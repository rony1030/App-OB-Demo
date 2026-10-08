"use server";

import { getDemoProposalsPersistent, saveDemoProposal, updateDemoProposal } from '@/lib/demo/local-crm-store';

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { hasCapability } from "@/lib/auth/permissions";
import {
  buildFrozenProposalSnapshot,
  calculateCommercialSchedule,
  type SimulatorPlanConfig,
} from "@/lib/proposals/simulator";
import { sendProposalEmail } from "@/lib/email/mailer";
import { resolvePublicPresentationTranslationsAction } from "@/app/public-translations/actions";
import type { Json } from "@/types/database";
import type { Block } from "@/components/portal/PresentationEditor";
import { getGeminiPool } from "@/lib/ai/gemini-config";
import { getPublicAssetUrl } from "@/lib/supabase/storage";
import { getPortalProject } from "@/lib/data/projects";
import { brandPersonalizedBlock } from "@/lib/portal/personalized-dossier-brand";

type SavedPresentationSnapshot = Json & {
  blocks?: Block[];
  project?: string;
  project_slug?: string;
  items?: Array<{ id?: string; project_slug?: string }>;
};

export type SaveProposalResponse = {
  success?: boolean;
  error?: string;
  presentationId?: number;
  token?: string;
  url?: string;
  snapshot?: unknown;
  emailStatus?: 'sent' | 'failed' | 'skipped';
  emailError?: string;
  status?: 'draft' | 'ready';
};

export type ProposalListItem = {
  id: number;
  kind: "proposal" | "dossier";
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectName?: string;
  projectSlug?: string;
  projectPrice?: number;
  currency?: string;
  coverImage?: string;
  sharedToken?: string;
  sharedUrl?: string;
  sharedExpiresAt?: string;
  viewsCount?: number;
  demoActivity?: Array<{ type: string; label: string; occurredAt: string; device?: string; location?: string; durationSeconds?: number }>;
  snapshot?: unknown;
  decision?: 'accepted' | 'rejected';
  decisionComment?: string;
  versionNumber?: number;
  pageCount?: number;
  sharedLinkId?: number;
  authorMembershipId?: number | null;
  isMasterTemplate?: boolean;
  isOwner?: boolean;
  canClone?: boolean;
  canDelete?: boolean;
};

export type ProposalTracking = {
  presentationId: number;
  title: string;
  kind: 'proposal' | 'dossier';
  clientName: string;
  projectName: string;
  views: number;
  pdfs: number;
  shares: number;
  whatsappClicks: number;
  averageDurationSeconds: number;
  devices: Array<{ label: string; count: number }>;
  locations: Array<{ label: string; count: number }>;
  activity: Array<{ type: string; label: string; occurredAt: string; device?: string; location?: string; durationSeconds?: number }>;
};

export async function getProposalTrackingAction(presentationId: number): Promise<{ data?: ProposalTracking; error?: string }> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const item = (await getDemoProposalsPersistent()).find((proposal) => proposal.id === presentationId);
    if (!item) return { error: 'Documento no encontrado o sin acceso.' };
    const activity = item.demoActivity || [];
    const count = (types: string[]) => activity.filter((entry) => types.includes(entry.type)).length;
    const aggregate = (key: 'device' | 'location') => Object.entries(activity.reduce<Record<string, number>>((result, entry) => {
      if (entry[key]) result[entry[key]!] = (result[entry[key]!] || 0) + 1;
      return result;
    }, {})).map(([label, count]) => ({ label, count }));
    const durations = activity.map((entry) => entry.durationSeconds).filter((value): value is number => typeof value === 'number' && value > 0);
    return { data: { presentationId, title: item.title, kind: item.kind, clientName: item.clientName || 'Sin asignar', projectName: item.projectName || 'Villas en Punta Cana', views: Math.max(item.viewsCount || 0, count(['proposal_view', 'dossier_view'])), pdfs: count(['pdf_export']), shares: count(['share_click']), whatsappClicks: count(['whatsapp_click']), averageDurationSeconds: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0, devices: aggregate('device'), locations: aggregate('location'), activity } };
  }
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser?.organization?.id || !Number.isInteger(presentationId)) return { error: 'No tienes permiso para ver este seguimiento.' };
  const { data: presentation } = await supabase
    .from('presentations')
    .select('id, title, kind, organization_id, author_membership_id, contact:contacts(first_name, last_name), presentation_versions(snapshot, shared_links(id))')
    .eq('id', presentationId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (!presentation) return { error: 'Documento no encontrado o sin acceso.' };
  if (currentUser.role === 'broker_agent' && presentation.author_membership_id !== currentUser.membershipId) return { error: 'Solo puedes consultar tus propios documentos.' };
  const versions = ((presentation.presentation_versions || []) as Array<{ snapshot?: Record<string, unknown>; shared_links?: Array<{ id: number }> }>);
  const latest = versions.at(-1);
  const linkId = latest?.shared_links?.[0]?.id;
  const kind = presentation.kind === 'dossier' ? 'dossier' : 'proposal';
  if (!linkId) return { data: { presentationId, title: presentation.title, kind, clientName: 'Sin asignar', projectName: 'Sin proyecto', views: 0, pdfs: 0, shares: 0, whatsappClicks: 0, averageDurationSeconds: 0, devices: [], locations: [], activity: [] } };
  const { data: events } = await createAdminClient().from('engagement_events').select('event_type, metadata, occurred_at').eq('organization_id', currentUser.organization.id).eq('shared_link_id', linkId).order('occurred_at', { ascending: false }).limit(500);
  const rows = (events || []) as Array<{ event_type: string; metadata: Record<string, unknown> | null; occurred_at: string }>;
  const count = (type: string) => rows.filter((row) => row.event_type === type).length;
  const contact = presentation.contact as { first_name?: string; last_name?: string } | null;
  const snapshot = (latest?.snapshot || {}) as Record<string, unknown>;
  const activityLabels: Record<string, string> = { proposal_view: 'Propuesta abierta', dossier_view: 'Dossier abierto', pdf_export: 'PDF descargado', share_click: 'Enlace compartido', whatsapp_click: 'Contacto por WhatsApp', locale_change: 'Idioma cambiado', section_view: 'Sección consultada' };

  const resolveLocationLabel = (meta: Record<string, unknown> | null) => {
    if (!meta) return '';
    const city = typeof meta.locationCity === 'string' ? meta.locationCity.trim() : '';
    const country = typeof meta.locationCountry === 'string' ? meta.locationCountry.trim() : '';
    const ip = typeof meta.ip === 'string' ? meta.ip.trim() : '';
    const place = [city, country].filter(Boolean).join(', ');
    if (place && ip) return `${place} (IP ${ip})`;
    if (place) return place;
    if (ip) return `IP ${ip}`;
    return '';
  };

  const devicesMap = rows.reduce<Record<string, number>>((acc, row) => {
    const value = row.metadata?.deviceType;
    if (typeof value === 'string' && value) acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const devices = Object.entries(devicesMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  const locationsMap = rows.reduce<Record<string, number>>((acc, row) => {
    const loc = resolveLocationLabel(row.metadata);
    if (loc) acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const locations = Object.entries(locationsMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));
  const durations = rows.map((row) => row.metadata?.durationSeconds).filter((value): value is number => typeof value === 'number' && value > 0);

  return {
    data: {
      presentationId,
      title: presentation.title,
      kind,
      clientName: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || String(snapshot.client_name || 'Sin asignar'),
      projectName: String(snapshot.project || snapshot.projectName || 'Sin proyecto'),
      views: count('proposal_view') + count('dossier_view'),
      pdfs: count('pdf_export'),
      shares: count('share_click'),
      whatsappClicks: count('whatsapp_click'),
      averageDurationSeconds: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
      devices,
      locations,
      activity: rows.slice(0, 20).map((row) => ({
        type: row.event_type,
        label: activityLabels[row.event_type] || 'Interacción registrada',
        occurredAt: row.occurred_at,
        device: typeof row.metadata?.deviceType === 'string' ? row.metadata.deviceType : undefined,
        location: resolveLocationLabel(row.metadata) || undefined,
        durationSeconds: typeof row.metadata?.durationSeconds === 'number' && row.metadata.durationSeconds > 0 ? row.metadata.durationSeconds : undefined,
      })),
    },
  };
}

export async function getProposalsListAction(): Promise<ProposalListItem[]> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return getDemoProposalsPersistent();
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return [];
  const orgId = currentUser.organization?.id;
  if (!orgId) return [];
  const canSeeDraftDossiers = hasCapability(currentUser.role, 'edit_project_dossier');

  // Reporting-only users can consult the published dossier assigned to their
  // master broker, but never see drafts, proposals, or other organizations'
  // documents in the commercial workspace.
  if (currentUser.role === 'support_auditor') {
    const reportingAdmin = createAdminClient();
    const { data: officialAuthors } = await reportingAdmin
      .from('memberships')
      .select('id')
      .eq('role', 'super_admin')
      .eq('status', 'active');
    const officialAuthorIds = (officialAuthors || []).map((member) => member.id);
    if (!officialAuthorIds.length) return [];
    const { data: publishedDossiers } = await reportingAdmin
      .from('presentations')
      .select(`id, kind, title, status, created_at, updated_at, author_membership_id, organization_id,
        contact:contacts(id, first_name, last_name, email, phone),
        presentation_versions(id, version_number, snapshot, created_at, shared_links(id, token, status, expires_at, views_count))`)
      .eq('kind', 'dossier')
      .eq('status', 'ready')
      .in('author_membership_id', officialAuthorIds)
      .ilike('title', '%Cipres%')
      .order('updated_at', { ascending: false })
      .limit(1);
    const visiblePublishedDossiers = (publishedDossiers || []).filter((row) => {
      const versions = row.presentation_versions as Array<{
        shared_links?: Array<{ status?: string; expires_at?: string | null }>;
      }> | undefined;
      return Boolean(versions?.some((version) => version.shared_links?.some((link) =>
        link.status === 'active' && (!link.expires_at || Date.parse(link.expires_at) > Date.now())
      )));
    });
    return visiblePublishedDossiers.map((row) => ({
      id: row.id as number,
      kind: 'dossier' as const,
      title: row.title as string,
      status: row.status as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      clientName: undefined,
      clientEmail: undefined,
      clientPhone: undefined,
      projectName: 'Cipres Residences',
      projectSlug: 'cipres-residences',
      projectPrice: undefined,
      currency: 'USD',
      coverImage: undefined,
      sharedToken: undefined,
      sharedUrl: undefined,
      isOwner: false,
      isMasterTemplate: true,
      canClone: false,
      canDelete: false,
    }));
  }

  const isBroker = currentUser.role === "broker_agent";
  const admin = createAdminClient();
  const { data: officialAuthors } = await admin.from('memberships')
    .select('id').eq('role', 'super_admin').eq('status', 'active');
  const officialAuthorIds = new Set((officialAuthors || []).map((member) => member.id));

  // 1. Presentations belonging to user's organization (filtered for broker agent)
  let query = supabase
    .from("presentations")
    .select(`
      id,
      kind,
      title,
      status,
      created_at,
      updated_at,
      author_membership_id,
      organization_id,
      contact:contacts(id, first_name, last_name, email, phone),
      presentation_versions(
        id,
        version_number,
        snapshot,
        created_at,
        shared_links(id, token, status, expires_at, views_count)
      )
    `)
    .eq("organization_id", orgId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!canSeeDraftDossiers) {
    // Agency and broker users can only receive dossiers that are published
    // and still have a live public link. Proposals retain their own visibility.
    query = query.or('kind.neq.dossier,and(kind.eq.dossier,status.eq.ready)');
  }

  if (isBroker && currentUser.membershipId) {
    query = query.eq("author_membership_id", currentUser.membershipId);
  }

  const { data: ownData, error } = await query;
  if (error) {
    console.warn("getProposalsListAction query error:", error);
  }

  // 2. Fetch master dossiers from the platform catalog so brokers can see and clone them
  let masterRows: Array<Record<string, unknown>> = [];
  try {
    if (!officialAuthorIds.size) throw new Error('No hay dossiers oficiales disponibles.');
    const { data: masterData } = await admin
      .from("presentations")
      .select(`
        id,
        kind,
        title,
        status,
        created_at,
        updated_at,
        author_membership_id,
        organization_id,
        contact:contacts(id, first_name, last_name, email, phone),
        presentation_versions(
          id,
          version_number,
          snapshot,
          created_at,
          shared_links(id, token, status, expires_at, views_count)
        )
      `)
      .eq("kind", "dossier")
      .in('author_membership_id', [...officialAuthorIds])
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(60);

    masterRows = (masterData || []) as Array<Record<string, unknown>>;
  } catch (err) {
    console.warn("Could not fetch master dossiers for proposals list:", err);
  }

  // Combine and deduplicate
  const seenIds = new Set<number>();
  const combinedRows: Array<Record<string, unknown>> = [];

  for (const row of (ownData || []) as Array<Record<string, unknown>>) {
    const id = row.id as number;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      combinedRows.push(row);
    }
  }

  for (const row of masterRows) {
    const id = row.id as number;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      combinedRows.push(row);
    }
  }

  const visibleRows = canSeeDraftDossiers ? combinedRows : combinedRows.filter((row) => {
    if (row.kind !== 'dossier') return true;
    if (row.status !== 'ready') return false;
    const versions = row.presentation_versions as Array<{
      shared_links?: Array<{ status?: string; expires_at?: string | null }>;
    }> | undefined;
    return Boolean(versions?.some((version) => version.shared_links?.some((link) =>
      link.status === 'active' && (!link.expires_at || Date.parse(link.expires_at) > Date.now())
    )));
  });

  // Older imports can leave several official records for the same project.
  // Present one canonical template per project, preferring a record with an
  // explicit project_slug; leave older records intact in storage.
  const canonicalTemplateByProject = new Map<string, Record<string, unknown>>();
  for (const row of visibleRows) {
    if (row.kind !== 'dossier' || !officialAuthorIds.has(row.author_membership_id as number)) continue;
    const rowVersions = row.presentation_versions as Array<{ version_number?: number; snapshot?: Record<string, unknown> }> | undefined;
    const latest = [...(rowVersions || [])].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0];
    const snapshot = latest?.snapshot || {};
    const projectName = String(snapshot.project || snapshot.projectName || row.title || '')
      .replace(/\s*[·—-]\s*Dossier Oficial.*$/i, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const projectKey = projectName || String(snapshot.project_slug || row.id);
    const existing = canonicalTemplateByProject.get(projectKey);
    const rowHasSlug = Boolean(snapshot.project_slug);
    const existingVersions = existing?.presentation_versions as Array<{ version_number?: number; snapshot?: Record<string, unknown> }> | undefined;
    const existingLatest = [...(existingVersions || [])].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0];
    const existingHasSlug = Boolean(existingLatest?.snapshot?.project_slug);
    if (!existing || (rowHasSlug && !existingHasSlug) || (rowHasSlug === existingHasSlug && String(row.created_at || '') > String(existing.created_at || ''))) {
      canonicalTemplateByProject.set(projectKey, row);
    }
  }
  const canonicalTemplateIds = new Set([...canonicalTemplateByProject.values()].map((row) => row.id as number));
  const rowsForDisplay = visibleRows.filter((row) =>
    row.kind !== 'dossier' || !officialAuthorIds.has(row.author_membership_id as number) || canonicalTemplateIds.has(row.id as number)
  );

  return rowsForDisplay.map((row) => {
    const versions = row.presentation_versions as Array<{
      version_number?: number;
      snapshot?: Record<string, unknown>;
      shared_links?: Array<{ id?: number; token: string; expires_at?: string; views_count?: number }>;
    }> | undefined;
    const latestVersion = versions?.sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0];
    const snapshot = (latestVersion?.snapshot || {}) as Record<string, unknown>;
    const sharedLink = row.status === 'draft' ? undefined : versions?.flatMap((version) => version.shared_links || []).find((link) => {
      const candidate = link as { status?: string; expires_at?: string | null };
      return candidate.status === 'active' && (!candidate.expires_at || Date.parse(candidate.expires_at) > Date.now());
    });

    const contact = row.contact as { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
    const clientObj = snapshot.client as { name?: string; email?: string; phone?: string } | undefined;
    const items = snapshot.items as Array<{ price?: number; currency?: string; project_name?: string; project_slug?: string; image?: string }> | undefined;
    const unitObj = snapshot.unit as { price?: number; currency?: string } | undefined;

    const contactName = contact
      ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
      : (snapshot.client_name as string) || clientObj?.name || "";

    const blocks = (Array.isArray(snapshot.blocks) ? snapshot.blocks : []) as Block[];
    const inventoryPrices = (items || [])
      .map((item) => Number(item.price || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    const dossierPrices = blocks.flatMap((block) => {
      if (!Array.isArray(block?.pricingCards)) return [];
      return block.pricingCards
        .filter((card) => !String(card?.kicker || '').toLocaleLowerCase().includes('agotad'))
        .map((card) => Number(card?.price || 0))
        .filter((value: number) => Number.isFinite(value) && value > 0);
    });
    const validPrices = row.kind === 'dossier'
      ? [...dossierPrices, ...inventoryPrices]
      : inventoryPrices;
    // Copied draft pages can still contain the source project's price until edited.
    const price = row.kind === 'dossier' && row.status === 'draft'
      ? undefined
      : validPrices.length ? Math.min(...validPrices) : unitObj?.price;
    const currency = items?.[0]?.currency ?? unitObj?.currency ?? "USD";

    const coverBlock = (blocks.find((b) => b?.type === 'cover') || blocks[0]) as { image?: string; secondaryImage?: string } | undefined;
    const coverImage = (snapshot.coverImage as string)
      || (snapshot.image as string)
      || coverBlock?.image
      || coverBlock?.secondaryImage
      || (items?.[0])?.image
      || (snapshot.project_image as string)
      || undefined;

    const isOwner = row.author_membership_id === currentUser.membershipId;
    const isMasterTemplate = row.kind === 'dossier' && officialAuthorIds.has(row.author_membership_id as number);
    const canClone = isMasterTemplate && row.status === 'ready' && Boolean(sharedLink);
    const isPersonalizedCopy = (snapshot.branding as { personalized_copy?: boolean } | undefined)?.personalized_copy === true;
    const isOrganizationAdmin = ['super_admin', 'master_broker_admin', 'agency_admin'].includes(currentUser.role);
    const canDelete = isOrganizationAdmin && row.organization_id === orgId &&
      (row.kind === 'proposal' || currentUser.role === 'super_admin' || isPersonalizedCopy);

    return {
      id: row.id as number,
      kind: row.kind as "proposal" | "dossier",
      title: row.title as string,
      status: (row.status as string) || "ready",
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      clientName: contactName || undefined,
      clientEmail: contact?.email || (snapshot.client_email as string) || clientObj?.email,
      clientPhone: contact?.phone || (snapshot.client_phone as string) || clientObj?.phone,
      projectName: (snapshot.project as string) || (snapshot.projectName as string) || items?.[0]?.project_name,
      projectSlug: (snapshot.project_slug as string) || items?.[0]?.project_slug || undefined,
      projectPrice: price,
      currency,
      coverImage,
      pageCount: blocks.length,
      sharedToken: sharedLink?.token,
      sharedUrl: sharedLink?.token ? `/p/${sharedLink.token}` : undefined,
      sharedExpiresAt: sharedLink?.expires_at,
      viewsCount: sharedLink?.views_count || 0,
      sharedLinkId: (sharedLink as { id?: number } | undefined)?.id,
      versionNumber: latestVersion?.version_number || 1,
      authorMembershipId: (row.author_membership_id as number) || null,
      isMasterTemplate,
      isOwner,
      canClone,
      canDelete,
    };
  });
}

/** Archive keeps the immutable proposal, links and audit trail available to admins. */
export async function archivePresentationAction(presentationId: number): Promise<{ success?: boolean; error?: string }> {
  try {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const updated = await updateDemoProposal(presentationId, (proposal) => ({ ...proposal, status: 'archived', updatedAt: new Date().toISOString() }));
    if (!updated) return { error: 'La propuesta ya no está disponible.' };
    revalidatePath('/portal/proposals');
    return { success: true };
  }
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.organization?.id || !Number.isInteger(presentationId)) return { error: 'No tienes permiso para archivar esta propuesta.' };

  const { data: presentation, error: readError } = await supabase
    .from('presentations')
    .select('id, kind, author_membership_id, organization_id, title')
    .eq('id', presentationId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (readError || !presentation) return { error: 'La propuesta ya no está disponible.' };
  if (presentation.kind === 'dossier' && !hasCapability(currentUser.role, 'edit_project_dossier')) {
    return { error: 'Las copias de dossiers son de solo lectura.' };
  }

  const canManageAll = ['super_admin', 'master_broker_admin', 'agency_admin', 'agency_support'].includes(currentUser.role);
  if (!canManageAll && presentation.author_membership_id !== currentUser.membershipId) {
    return { error: 'Solo puedes archivar tus propias propuestas.' };
  }

  const { error } = await supabase.from('presentations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', presentationId);
  if (error) {
    const isLegacyStatusConstraint = error.code === '23514' && error.message.includes('presentations_status_check');
    if (!isLegacyStatusConstraint || currentUser.role !== 'super_admin') return { error: error.message };

    // Compatibility for production databases that have not received the
    // archived-status migration yet. Cascades remove versions and shared links
    // while engagement events remain detached by their existing FK policy.
    const admin = createAdminClient();
    const { error: deleteError } = await admin
      .from('presentations')
      .delete()
      .eq('id', presentationId)
      .eq('organization_id', currentUser.organization.id);
    if (deleteError) return { error: deleteError.message };
  }

  await supabase.from('audit_events').insert({
    organization_id: currentUser.organization.id,
    actor_user_id: currentUser.id,
    action: error ? 'presentation_deleted_legacy_fallback' : 'presentation_archived',
    entity_type: 'presentation',
    entity_id: String(presentationId),
    metadata: { title: presentation.title },
  }).then(() => {}, () => {});
  revalidatePath('/portal/proposals');
  return { success: true };
  } catch (err) {
    console.error('archivePresentationAction error:', err);
    return { error: 'Ocurrió un error al archivar la propuesta. Inténtalo de nuevo.' };
  }
}

/** Deletes an agency-owned document and its public links; the audit event remains. */
export async function deletePresentationAction(presentationId: number): Promise<{ success?: boolean; error?: string }> {
  try {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      const deleted = await updateDemoProposal(presentationId, () => null);
      if (!deleted) return { error: 'Documento no encontrado o sin acceso.' };
      revalidatePath('/portal/proposals');
      return { success: true };
    }
    const currentUser = await getCurrentUser();
    if (!currentUser?.organization?.id || !Number.isSafeInteger(presentationId) || presentationId <= 0) {
      return { error: 'Documento no encontrado o sin acceso.' };
    }
    if (!['super_admin', 'master_broker_admin', 'agency_admin'].includes(currentUser.role)) {
      return { error: 'Solo un administrador puede eliminar documentos de su organización.' };
    }

    const admin = createAdminClient();
    const { data: presentation, error: readError } = await admin
      .from('presentations')
      .select('id, kind, title, organization_id, presentation_versions(version_number, snapshot)')
      .eq('id', presentationId)
      .eq('organization_id', currentUser.organization.id)
      .maybeSingle();
    if (readError || !presentation) return { error: 'Documento no encontrado en tu organización.' };

    if (presentation.kind === 'dossier' && currentUser.role !== 'super_admin') {
      const versions = presentation.presentation_versions as Array<{ version_number: number; snapshot: Record<string, unknown> }> | undefined;
      const latest = versions?.sort((a, b) => b.version_number - a.version_number)[0];
      const branding = latest?.snapshot?.branding as { personalized_copy?: boolean } | undefined;
      if (branding?.personalized_copy !== true) {
        return { error: 'Solo puedes eliminar copias personalizadas de dossiers de tu agencia.' };
      }
    }

    const { data: deleted, error: deleteError } = await admin
      .from('presentations')
      .delete()
      .eq('id', presentationId)
      .eq('organization_id', currentUser.organization.id)
      .select('id');
    if (deleteError) return { error: 'No se pudo eliminar el documento. Inténtalo de nuevo.' };
    if (deleted?.length !== 1) return { error: 'El documento ya no está disponible.' };

    await admin.from('audit_events').insert({
      organization_id: currentUser.organization.id,
      actor_user_id: currentUser.id,
      action: 'presentation_deleted',
      entity_type: 'presentation',
      entity_id: String(presentationId),
      metadata: { title: presentation.title, kind: presentation.kind },
    });
    revalidatePath('/portal/proposals');
    return { success: true };
  } catch (error) {
    console.error('deletePresentationAction error:', error);
    return { error: 'Ocurrió un error al eliminar el documento.' };
  }
}

export async function saveProposalAction(payload: {
  title: string;
  kind: "proposal" | "dossier";
  contactId?: number;
  directInvestor?: boolean;
  offerId?: number;
  snapshot: Json;
}): Promise<SaveProposalResponse> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const snapshot = payload.snapshot as unknown as Record<string, unknown>;
    const client = snapshot.client as { name?: string; email?: string; phone?: string } | undefined;
    const clientName = String(snapshot.client_name || client?.name || '');
    const clientEmail = String(snapshot.client_email || client?.email || '') || undefined;
    const clientPhone = String(snapshot.client_phone || client?.phone || '') || undefined;
    const project = String(snapshot.project || snapshot.projectName || 'Villas en Punta Cana');
    const id = Date.now();
    const token = crypto.randomBytes(20).toString('hex');
    const now = Date.now();
    const sample = (minutesAgo: number, type: string, label: string, device: string, location: string, durationSeconds?: number) => ({ type, label, occurredAt: new Date(now - minutesAgo * 60_000).toISOString(), device, location, durationSeconds });
    const demoActivity = [
      sample(8, 'proposal_view', 'Consulta abierta', 'mobile', 'Santo Domingo, República Dominicana', 186),
      sample(42, 'section_view', 'Consultó disponibilidad y precios', 'desktop', 'Santiago de los Caballeros, República Dominicana', 94),
      sample(115, 'whatsapp_click', 'Hizo clic en contacto por WhatsApp', 'mobile', 'Punta Cana, República Dominicana'),
      sample(238, 'pdf_export', 'Descargó el PDF de la propuesta', 'desktop', 'La Romana, República Dominicana'),
      sample(512, 'share_click', 'Abrió el enlace compartido', 'tablet', 'Santo Domingo, República Dominicana'),
    ];
    const item = {
      id, kind: payload.kind, title: payload.title.trim(), status: 'ready',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      clientName, clientEmail, clientPhone, snapshot: payload.snapshot,
      projectName: project, projectSlug: 'villas-en-punta-cana',
      currency: 'USD', sharedToken: token, sharedUrl: `/p/${token}`, viewsCount: 1, demoActivity,
    } satisfies ProposalListItem;
    await saveDemoProposal(item);
    revalidatePath('/portal/proposals');
    return { success: true, presentationId: id, token, url: `/p/${token}`, snapshot: payload.snapshot, emailStatus: 'skipped', status: 'ready' };
  }
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "Debes iniciar sesión para guardar una propuesta." };
  }
  if (payload.kind === "proposal" && !hasCapability(currentUser.role, "create_proposals")) {
    return { error: "Tu perfil no tiene permiso para generar propuestas." };
  }
  if (payload.kind === "dossier" && !hasCapability(currentUser.role, "edit_project_dossier")) {
    return { error: "Solo el administrador principal de la plataforma puede crear dossiers." };
  }
  const orgId = currentUser.organization?.id;
  if (!orgId) return { error: 'Tu cuenta no está vinculada a una organización.' };

  if (!payload.title.trim()) {
    return { error: "El título de la propuesta es obligatorio." };
  }
  const directInvestor = payload.directInvestor === true;
  const canUseDirectInvestor = ['super_admin', 'master_broker_admin', 'agency_support'].includes(currentUser.role);
  if (payload.kind === 'proposal' && !payload.contactId && !(directInvestor && canUseDirectInvestor)) {
    return { error: 'La propuesta debe estar vinculada a un lead registrado.' };
  }
  if (payload.contactId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', payload.contactId)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!contact) return { error: 'El lead seleccionado ya no está disponible para esta agencia.' };
  }

  if (payload.kind === 'proposal') {
    type ProposalSnapshotItem = {
      unit_id?: string;
      property_id?: string;
      developer_name?: string;
      list_price?: number;
      price?: number;
      applied_discount_type?: 'percent' | 'amount';
      applied_discount_percent?: number;
      applied_discount_amount?: number;
    };
    type AppliedOfferSnapshot = {
      id?: number;
      offer_type?: string;
      discount_percent?: number | null;
      promotion_text?: string | null;
    };
    const proposalSnapshot = payload.snapshot as unknown as { items?: unknown; applied_offer?: unknown; manual_discount?: unknown };
    const rawItems = proposalSnapshot.items;
    const items = Array.isArray(rawItems) ? rawItems.filter((item): item is ProposalSnapshotItem => Boolean(item && typeof item === 'object')) : [];
    if (!items.length) return { error: 'La propuesta debe incluir al menos una unidad válida.' };
    const developerNames = Array.isArray(rawItems)
      ? rawItems.map((item) => (item && typeof item === 'object' && 'developer_name' in item ? String(item.developer_name || '').trim().toLowerCase() : '')).filter(Boolean)
      : [];
    if (new Set(developerNames).size > 1) {
      return { error: 'Una propuesta multiunidad solo puede incluir propiedades de la misma desarrolladora.' };
    }

    const unitIds = Array.from(new Set(items.map((item) => Number(item.unit_id)).filter((id) => Number.isInteger(id) && id > 0)));
    if (unitIds.length !== items.length) return { error: 'Una unidad de la propuesta no tiene una referencia válida.' };
    const { data: officialUnits, error: unitsError } = await supabase
      .from('units')
      .select('id, project_id, list_price')
      .in('id', unitIds);
    if (unitsError || !officialUnits || officialUnits.length !== unitIds.length) {
      return { error: 'No fue posible confirmar el precio oficial de todas las unidades.' };
    }
    const officialUnitsById = new Map(officialUnits.map((unit) => [Number(unit.id), unit]));
    const appliedOffer = proposalSnapshot.applied_offer && typeof proposalSnapshot.applied_offer === 'object'
      ? proposalSnapshot.applied_offer as AppliedOfferSnapshot
      : null;
    const manualDiscount = proposalSnapshot.manual_discount && typeof proposalSnapshot.manual_discount === 'object'
      ? proposalSnapshot.manual_discount as { type?: string; value?: number }
      : null;
    const offerId = Number(payload.offerId || 0);
    let authorizedDiscount: number | null = null;
    const canApplyManualDiscount = ['super_admin', 'master_broker_admin'].includes(currentUser.role);

    if (manualDiscount && offerId > 0) {
      return { error: 'No puedes combinar un descuento directo con una oferta autorizada.' };
    }
    if (manualDiscount) {
      const type = manualDiscount.type;
      const value = Number(manualDiscount.value);
      if (!canApplyManualDiscount) return { error: 'Solo el Super User y el administrador del Master Broker pueden aplicar descuentos directos.' };
      if (type !== 'percent' && type !== 'amount') return { error: 'El tipo de descuento no es válido.' };
      if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value >= 100)) {
        return { error: 'El valor del descuento debe ser mayor que cero y dejar un precio final válido.' };
      }
    }

    if (offerId > 0) {
      const now = new Date().toISOString();
      const { data: offer } = await supabase
        .from('marketing_offers')
        .select('id, offer_type, discount_percent, promotion_text, status, starts_at, ends_at')
        .eq('id', offerId)
        .eq('status', 'active')
        .lte('starts_at', now)
        .gt('ends_at', now)
        .maybeSingle();
      if (!offer) return { error: 'La oferta seleccionada ya no está activa o vigente.' };

      const projectIds = Array.from(new Set(items.map((item) => Number(item.property_id)).filter((id) => Number.isInteger(id) && id > 0)));
      if (!projectIds.length) return { error: 'No fue posible confirmar el proyecto de la propuesta.' };
      const { data: offerProjects } = await supabase
        .from('marketing_offer_projects')
        .select('project_id')
        .eq('offer_id', offerId)
        .in('project_id', projectIds);
      if (!offerProjects || offerProjects.length !== projectIds.length) {
        return { error: 'La oferta seleccionada no está autorizada para todos los proyectos incluidos.' };
      }
      if (Number(appliedOffer?.id) !== offer.id || appliedOffer?.offer_type !== offer.offer_type) {
        return { error: 'Los datos de la oferta no coinciden con la autorización vigente.' };
      }
      if (offer.offer_type === 'discount') {
        authorizedDiscount = Number(offer.discount_percent);
        if (!Number.isFinite(authorizedDiscount) || authorizedDiscount <= 0 || authorizedDiscount > 100 || Math.abs(Number(appliedOffer?.discount_percent) - authorizedDiscount) > 0.001) {
          return { error: 'El descuento de la propuesta no coincide con el autorizado.' };
        }
      } else if (appliedOffer?.promotion_text !== offer.promotion_text) {
        return { error: 'La promoción de la propuesta cambió. Vuelve a seleccionarla antes de guardar.' };
      }
    } else if (appliedOffer) {
      return { error: 'La propuesta contiene una oferta que no fue autorizada por el sistema.' };
    }

    for (const item of items) {
      const unit = officialUnitsById.get(Number(item.unit_id));
      const projectId = Number(item.property_id);
      const listPrice = Number(item.list_price);
      const price = Number(item.price);
      const officialPrice = Number(unit?.list_price);
      if (!unit || Number(unit.project_id) !== projectId || !Number.isFinite(listPrice) || !Number.isFinite(price) || listPrice <= 0 || price <= 0 || !Number.isFinite(officialPrice) || officialPrice <= 0) {
        return { error: 'Una unidad contiene datos comerciales no válidos.' };
      }
      if (listPrice + 0.02 < officialPrice) return { error: 'El precio base de una unidad es inferior al precio oficial.' };

      if (authorizedDiscount !== null) {
        const expectedPrice = Math.round(listPrice * (1 - authorizedDiscount / 100) * 100) / 100;
        const minimumAuthorizedPrice = Math.round(officialPrice * (1 - authorizedDiscount / 100) * 100) / 100;
        if (Math.abs(Number(item.applied_discount_percent) - authorizedDiscount) > 0.001 || Math.abs(price - expectedPrice) > 0.02 || price + 0.02 < minimumAuthorizedPrice) {
          return { error: 'El precio descontado no coincide con la oferta autorizada.' };
        }
      } else if (manualDiscount) {
        const type = manualDiscount.type as 'percent' | 'amount';
        const value = Number(manualDiscount.value);
        const expectedDiscount = type === 'percent'
          ? Math.round(listPrice * value / 100 * 100) / 100
          : value;
        const expectedPrice = Math.round((listPrice - expectedDiscount) * 100) / 100;
        if (expectedPrice <= 0 || Math.abs(price - expectedPrice) > 0.02 || item.applied_discount_type !== type || Math.abs(Number(item.applied_discount_amount) - expectedDiscount) > 0.02) {
          return { error: 'El precio con descuento no coincide con el descuento directo indicado.' };
        }
      } else if (Number(item.applied_discount_percent || 0) > 0 || Number(item.applied_discount_amount || 0) > 0 || Math.abs(price - listPrice) > 0.02) {
        return { error: 'No se permiten descuentos manuales en una propuesta.' };
      }
    }
  }

  const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
  const validCreatedBy = isUuid(currentUser.id) ? currentUser.id : null;

  // 1. Insert presentation header
  const { data: pres, error: presError } = await supabase
    .from("presentations")
    .insert({
      organization_id: orgId,
      contact_id: payload.contactId || null,
      author_membership_id: currentUser.membershipId || null,
      kind: payload.kind,
      title: payload.title.trim(),
      status: "ready",
    })
    .select("id")
    .single();

  if (presError || !pres) {
    return { error: presError?.message || "Error al guardar la propuesta." };
  }

  const presentationId = pres.id;

  // 2. Insert immutable version 1 snapshot
  const { data: ver, error: verError } = await supabase
    .from("presentation_versions")
    .insert({
      presentation_id: presentationId,
      version_number: 1,
      snapshot: payload.snapshot,
      created_by: validCreatedBy,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (verError || !ver) {
    return { error: verError?.message || "Error al crear la versión de la propuesta." };
  }

  // 3. Generate a cryptographically random, unguessable token for the shared link.
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const { error: linkError } = await supabase.from("shared_links").insert({
    presentation_version_id: ver.id,
    token,
    status: "active",
    expires_at: expiresAt,
  });

  if (linkError) {
    return { error: linkError.message || "Error al generar el enlace compartible." };
  }

  // Pre-translate proposal in background for EN and FR so public views load instantly in all languages
  void resolvePublicPresentationTranslationsAction(token, 'en').catch(() => {});
  void resolvePublicPresentationTranslationsAction(token, 'fr').catch(() => {});

  // Proposal creation is commercial telemetry, not client profiling. The
  // frozen project identifier lets authorized dashboards aggregate results.
  const snapshotItems = (payload.snapshot as unknown as { items?: Array<{ property_id?: string }> }).items;
  const firstProjectId = snapshotItems?.[0]?.property_id;
  await supabase.from('engagement_events').insert({
    organization_id: orgId,
    event_type: 'proposal_created',
    metadata: {
      projectId: firstProjectId && /^\d+$/.test(firstProjectId) ? Number(firstProjectId) : undefined,
      source: 'portal',
    },
  }).then(() => {}, () => {});
  await supabase.from('audit_events').insert({
    organization_id: orgId,
    actor_user_id: validCreatedBy,
    action: 'presentation_created',
    entity_type: 'presentation',
    entity_id: String(presentationId),
    metadata: { kind: payload.kind, title: payload.title.trim(), version: 1 },
  }).then(() => {}, () => {});

  // 4. If associated with a contact, log activity in their timeline
  if (payload.contactId) {
    try {
      await supabase.from("activities").insert({
        organization_id: orgId,
        contact_id: payload.contactId,
        kind: "system",
        subject: `Propuesta generada: "${payload.title.trim()}"`,
        details: `Enlace creado con vigencia de 30 días.`,
        completed_at: new Date().toISOString(),
        created_by: validCreatedBy,
      });
    } catch {
      // Non-blocking
    }
  }

  revalidatePath("/portal/proposals");
  revalidatePath("/portal/clientes");

  // Attempt email if the proposal is linked to a contact with a valid email
  const snap = payload.snapshot as Record<string, unknown>;
  const clientEmail = typeof snap.client_email === 'string' ? snap.client_email.trim() : '';
  const clientName = typeof snap.client_name === 'string' ? snap.client_name.trim() : '';
  const projectName = typeof snap.project === 'string' ? snap.project : payload.title;
  const items = Array.isArray(snap.items) ? snap.items as Array<{ unit_name?: string }> : [];
  const unitSummary = items.map((i) => i.unit_name).filter(Boolean).join(', ') || 'Ver propuesta';

  if (payload.kind === 'proposal' && clientEmail && /^\S+@\S+\.\S+$/.test(clientEmail)) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com';
    const fullUrl = `${baseUrl}/p/${token}`;
    const idempotencyKey = `proposal_email:${ver.id}:${clientEmail.toLowerCase()}`;

    const { data: existingEvent } = await supabase
      .from('audit_events')
      .select('id')
      .eq('organization_id', orgId)
      .eq('action', 'proposal_email_sent')
      .contains('metadata', { idempotency_key: idempotencyKey })
      .limit(1)
      .maybeSingle();

    if (existingEvent) {
      return {
        success: true,
        presentationId,
        token,
        url: `/p/${token}`,
        emailStatus: 'skipped' as const,
      };
    }

    try {
      await supabase.from('audit_events').insert({
        organization_id: orgId,
        actor_user_id: validCreatedBy,
        action: 'proposal_email_requested',
        entity_type: 'presentation',
        entity_id: String(presentationId),
        metadata: { idempotency_key: idempotencyKey, recipient: clientEmail },
      }).then(() => {}, () => {});

      await sendProposalEmail({
        to: clientEmail,
        replyTo: currentUser.email,
        recipientName: clientName || 'Cliente',
        projectName,
        unitSummary,
        brokerName: currentUser.displayName || 'Tu asesor',
        brokerPhone: currentUser.phone || undefined,
        agencyName: currentUser.organization?.name,
        proposalUrl: fullUrl,
        expiresAt: expiresAt,
      });

      await supabase.from('audit_events').insert({
        organization_id: orgId,
        actor_user_id: validCreatedBy,
        action: 'proposal_email_sent',
        entity_type: 'presentation',
        entity_id: String(presentationId),
        metadata: { idempotency_key: idempotencyKey, recipient: clientEmail },
      }).then(() => {}, () => {});

      await supabase.from('engagement_events').insert({
        organization_id: orgId,
        event_type: 'proposal_email_sent',
        metadata: { presentationId, recipient: clientEmail, source: 'portal' },
      }).then(() => {}, () => {});

      return {
        success: true,
        presentationId,
        token,
        url: `/p/${token}`,
        emailStatus: 'sent' as const,
      };
    } catch (emailErr) {
      const errorMessage = emailErr instanceof Error ? emailErr.message : 'Error desconocido';
      await supabase.from('audit_events').insert({
        organization_id: orgId,
        actor_user_id: validCreatedBy,
        action: 'proposal_email_failed',
        entity_type: 'presentation',
        entity_id: String(presentationId),
        metadata: { idempotency_key: idempotencyKey, recipient: clientEmail, error: errorMessage },
      }).then(() => {}, () => {});

      return {
        success: true,
        presentationId,
        token,
        url: `/p/${token}`,
        emailStatus: 'failed' as const,
        emailError: errorMessage,
      };
    }
  }

  return {
    success: true,
    presentationId,
    token,
    url: `/p/${token}`,
    emailStatus: clientEmail ? 'skipped' as const : undefined,
  };
}

export async function saveDossierAction(payload: {
  presentationId?: number;
  projectSlug: string;
  snapshot: Json;
  publish: boolean;
}): Promise<SaveProposalResponse> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const project = await getPortalProject(payload.projectSlug);
    const snapshot = payload.snapshot as Record<string, unknown>;
    if (!project || snapshot.kind !== 'dossier' || snapshot.project_slug !== project.slug || !Array.isArray(snapshot.blocks) || !snapshot.blocks.length) {
      return { error: 'El dossier no corresponde a un proyecto válido del demo.' };
    }
    const existing = payload.presentationId
      ? (await getDemoProposalsPersistent()).find((item) => item.id === payload.presentationId && item.kind === 'dossier')
      : undefined;
    if (payload.presentationId && !existing) return { error: 'El dossier no existe en el almacenamiento local del demo.' };
    const id = existing?.id || Date.now();
    const token = payload.publish ? (existing?.sharedToken || crypto.randomBytes(20).toString('hex')) : undefined;
    const now = new Date().toISOString();
    const item: ProposalListItem = {
      ...(existing || {}),
      id,
      kind: 'dossier',
      title: `${project.name} · Dossier Oficial`,
      status: payload.publish ? 'ready' : 'draft',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      projectName: project.name,
      projectSlug: project.slug,
      projectPrice: project.startingPrice,
      currency: project.currency || 'USD',
      coverImage: project.image,
      sharedToken: token,
      sharedUrl: token ? `/p/${token}` : undefined,
      snapshot: payload.snapshot,
      viewsCount: existing?.viewsCount || 0,
      demoActivity: existing?.demoActivity || [],
    };
    if (existing) {
      const updated = await updateDemoProposal(id, () => item);
      if (!updated) await saveDemoProposal(item);
    } else await saveDemoProposal(item);
    revalidatePath('/portal/proposals');
    revalidatePath(`/portal/projects/${project.slug}/dossier`);
    if (token) revalidatePath(`/p/${token}`);
    return { success: true, presentationId: id, status: item.status as 'draft' | 'ready', token, url: token ? `/p/${token}` : undefined };
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  const orgId = currentUser?.organization?.id;
  if (!currentUser || !orgId) return { error: 'Inicia sesión para guardar el dossier.' };
  if (!hasCapability(currentUser.role, 'edit_project_dossier')) {
    return { error: 'No tienes permiso para editar dossiers.' };
  }

  const project = await getPortalProject(payload.projectSlug);
  const snapshot = payload.snapshot as Record<string, unknown>;
  if (!project || snapshot.kind !== 'dossier' || snapshot.project_slug !== project.slug || !Array.isArray(snapshot.blocks) || !snapshot.blocks.length) {
    return { error: 'El dossier no corresponde a un proyecto válido.' };
  }

  const title = `${project.name} · Dossier Oficial`;
  const validCreatedBy = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) ? currentUser.id : null;
  let presentationId = payload.presentationId;
  let createdNew = !presentationId;
  let versions: Array<{ id: number; version_number: number; snapshot: Record<string, unknown>; shared_links?: Array<{ id: number; token: string; status: string }> }> = [];

  // Keep one editable master template per project even if the administrator
  // starts from the generic "new dossier" entry point.
  if (!presentationId && currentUser.membershipId) {
    const { data: projectDossiers } = await createAdminClient()
      .from('presentations')
      .select('id, updated_at, presentation_versions(version_number, snapshot)')
      .eq('organization_id', orgId)
      .eq('author_membership_id', currentUser.membershipId)
      .eq('kind', 'dossier')
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(100);
    const matchingTemplate = (projectDossiers || []).find((row) => {
      const rowVersions = row.presentation_versions as Array<{ version_number?: number; snapshot?: Record<string, unknown> }> | undefined;
      const latest = [...(rowVersions || [])].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0];
      return latest?.snapshot?.project_slug === project.slug;
    });
    if (matchingTemplate) {
      presentationId = matchingTemplate.id;
      createdNew = false;
    }
  }

  if (presentationId) {
    const { data: existing, error } = await supabase.from('presentations')
      .select('id, kind, status, author_membership_id, presentation_versions(id, version_number, snapshot, shared_links(id, token, status))')
      .eq('id', presentationId).eq('organization_id', orgId).maybeSingle();
    if (error || !existing || existing.kind !== 'dossier' || existing.status === 'archived') {
      return { error: 'El dossier no existe o no está disponible para edición.' };
    }
    versions = (existing.presentation_versions || []) as typeof versions;
    const previousSnapshot = [...versions].sort((a, b) => b.version_number - a.version_number)[0]?.snapshot;
    if (previousSnapshot?.project_slug && previousSnapshot.project_slug !== project.slug) {
      return { error: 'Este dossier pertenece a otro proyecto.' };
    }
  } else {
    const { data: created, error } = await supabase.from('presentations').insert({
      organization_id: orgId,
      author_membership_id: currentUser.membershipId || null,
      kind: 'dossier',
      title,
      status: 'draft',
    }).select('id').single();
    if (error || !created) return { error: error?.message || 'No fue posible crear el borrador.' };
    presentationId = created.id;
  }

  const nextVersion = Math.max(0, ...versions.map((version) => version.version_number)) + 1;
  if (!payload.publish && !createdNew) {
    const { error: hideError } = await supabase.from('presentations').update({ status: 'draft' }).eq('id', presentationId).eq('organization_id', orgId);
    if (hideError) return { error: hideError.message || 'No fue posible proteger el borrador.' };
  }
  const { data: savedVersion, error: versionError } = await supabase.from('presentation_versions').insert({
    presentation_id: presentationId,
    version_number: nextVersion,
    snapshot: payload.snapshot,
    created_by: validCreatedBy,
    published_at: payload.publish ? new Date().toISOString() : null,
  }).select('id').single();
  if (versionError || !savedVersion) {
    if (createdNew) await supabase.from('presentations').delete().eq('id', presentationId).eq('organization_id', orgId).eq('status', 'draft');
    return { error: versionError?.message || 'No fue posible guardar el contenido.' };
  }

  if (!payload.publish) {
    const { error: updateError } = await supabase.from('presentations').update({ title, status: 'draft', updated_at: new Date().toISOString() }).eq('id', presentationId).eq('organization_id', orgId);
    if (updateError) return { error: updateError.message };
    // The private status blocks the public viewer immediately. Also revoke old
    // links so making a template private invalidates every previously shared URL.
    const activeLinkIds = versions.flatMap((version) => version.shared_links || [])
      .filter((link) => link.status === 'active')
      .map((link) => link.id);
    if (activeLinkIds.length) {
      const { error: revokeError } = await createAdminClient()
        .from('shared_links')
        .update({ status: 'revoked' })
        .in('id', activeLinkIds);
      if (revokeError) return { error: 'El dossier quedó privado, pero no se pudieron invalidar todos sus enlaces. Intenta guardar de nuevo o contacta soporte.' };
    }
    revalidatePath('/portal/proposals');
    for (const link of versions.flatMap((version) => version.shared_links || [])) {
      if (link.status === 'active') revalidatePath(`/p/${link.token}`);
    }
    return { success: true, presentationId, status: 'draft' };
  }

  const activeLink = versions.flatMap((version) => version.shared_links || []).find((link) => link.status === 'active');
  const token = activeLink?.token || crypto.randomBytes(20).toString('hex');
  // Official master templates remain available to brokers until the platform
  // administrator explicitly makes them private again.
  const expiresAt = null;
  const linkResult = activeLink
    ? await supabase.from('shared_links').update({ presentation_version_id: savedVersion.id, expires_at: expiresAt }).eq('id', activeLink.id)
    : await supabase.from('shared_links').insert({ presentation_version_id: savedVersion.id, token, status: 'active', expires_at: expiresAt });
  if (linkResult.error) return { error: linkResult.error.message || 'No fue posible publicar el dossier.' };

  const { error: publishError } = await supabase.from('presentations').update({ title, status: 'ready', updated_at: new Date().toISOString() }).eq('id', presentationId).eq('organization_id', orgId);
  if (publishError) return { error: publishError.message || 'No fue posible publicar el dossier.' };

  revalidatePath('/portal/proposals');
  revalidatePath(`/portal/projects/${project.slug}/dossier`);
  revalidatePath(`/p/${token}`);
  return { success: true, presentationId, status: 'ready', token, url: `/p/${token}` };
}

export async function cloneProjectDossierAction(params: {
  dossierId?: number;
  projectSlug?: string;
}): Promise<{
  success?: boolean;
  error?: string;
  presentationId?: number;
  token?: string;
  url?: string;
  editUrl?: string;
}> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser) return { error: 'Debes iniciar sesión para personalizar este dossier.' };

    const orgId = currentUser.organization?.id;
    if (!orgId) return { error: 'Tu usuario no tiene una organización vinculada.' };

    const admin = createAdminClient();

    // 1. Find source presentation
    let sourcePres: {
      id: number;
      kind: string;
      status: string;
      title: string;
      author_membership_id: number | null;
      presentation_versions?: Array<{
        id: number;
        version_number: number;
        snapshot?: Json;
        shared_links?: Array<{ status: string; expires_at: string | null }>;
      }>;
    } | null = null;

    if (params.dossierId) {
      const { data } = await admin
        .from('presentations')
        .select(`
          id, kind, status, title, author_membership_id,
          presentation_versions(id, version_number, snapshot, shared_links(status, expires_at))
        `)
        .eq('id', params.dossierId)
        .maybeSingle();
      sourcePres = data;
    }

    if (!sourcePres || sourcePres.kind !== 'dossier' || sourcePres.status !== 'ready' || !sourcePres.author_membership_id) {
      return { error: 'Selecciona un dossier oficial publicado para crear tu copia.' };
    }
    const { data: officialAuthor } = await admin.from('memberships')
      .select('id').eq('id', sourcePres.author_membership_id).eq('role', 'super_admin').eq('status', 'active').maybeSingle();
    if (!officialAuthor) return { error: 'Solo se pueden copiar dossiers oficiales.' };
    const hasActivePublicLink = (sourcePres.presentation_versions || []).some((version) =>
      (version.shared_links || []).some((link) =>
        link.status === 'active' && (!link.expires_at || Date.parse(link.expires_at) > Date.now())
      )
    );
    if (!hasActivePublicLink) return { error: 'Esta plantilla no está disponible para los brokers en este momento.' };

    const versions = ((sourcePres?.presentation_versions || []) as Array<{ version_number: number; snapshot?: Record<string, unknown> }>).sort(
      (a, b) => (b.version_number || 0) - (a.version_number || 0)
    );
    const sourceSnapshot = (versions[0]?.snapshot || {}) as Record<string, unknown>;
    const rawBlocks = (Array.isArray(sourceSnapshot.blocks) ? sourceSnapshot.blocks : []) as Block[];

    const targetSlug = (sourceSnapshot.project_slug as string) || '';
    if (params.projectSlug && targetSlug && params.projectSlug !== targetSlug) {
      return { error: 'El dossier no corresponde al proyecto solicitado.' };
    }
    const fallbackProject = targetSlug ? await getPortalProject(targetSlug) : null;
    if (!rawBlocks.length) return { error: 'No hay contenido de dossier para este proyecto.' };

    // 2. Fetch current user brand and profile
    const { data: brand } = await admin
      .from('brand_profiles')
      .select('name, primary_color, accent_color, surface_color, logo_path, whatsapp_number, contact_email, contact_phone')
      .eq('organization_id', orgId)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    const brokerAgencyLogo = brand?.logo_path ? getPublicAssetUrl(brand.logo_path) : undefined;
    const agencyName = brand?.name || currentUser.organization.name;
    const primaryColor = brand?.primary_color || '#0c094e';
    const accentColor = brand?.accent_color || '#2563eb';

    // 3. Clone blocks and apply agency branding
    const copyBrand = { primary_color: primaryColor, accent_color: accentColor, surface_color: brand?.surface_color };
    const clonedBlocks = rawBlocks.map((b) => {
      const copy = brandPersonalizedBlock(b, copyBrand);
      if (copy.type === 'cover' || copy.showBrokerLogo !== false) {
        // Never carry the source broker's logo into a personalized copy.
        copy.customBrokerLogoUrl = brokerAgencyLogo;
        copy.showBrokerLogo = Boolean(brokerAgencyLogo);
      }
      return copy;
    });

    // 4. Remove previous contact slides and append personal contact slide
    const sourceContact = [...rawBlocks].reverse().find((b) => b.type === 'contact');
    const nonContactBlocks = clonedBlocks.filter((b) => b.type !== 'contact');
    const sourceCover = rawBlocks.find((block) => block.type === 'cover');
    const projectCoverImage = sourceCover?.image || sourceCover?.secondaryImage || fallbackProject?.image;
    const contactBlock = brandPersonalizedBlock({
      id: `contact-${Date.now()}`,
      type: 'contact',
      title: currentUser.displayName || agencyName,
      body: sourceContact?.body || 'Estoy a tu disposición para brindarte asesoría personalizada, disponibilidad en tiempo real y coordinar tu visita.',
      kicker: 'Atención personalizada',
      subHeader: currentUser.professionalTitle || (currentUser.role === 'super_admin' ? 'Master Broker' : 'Asesor Inmobiliario Especialista'),
      agentProfessionalTitle: currentUser.professionalTitle || (currentUser.role === 'super_admin' ? 'Master Broker' : 'Asesor Inmobiliario Especialista'),
      agentAvatarUrl: currentUser.avatarUrl ? (currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : getPublicAssetUrl(currentUser.avatarUrl)) : undefined,
      hideBrokerDetails: false,
      layout: 'vertical-top',
      backgroundType: projectCoverImage ? 'image' : 'solid',
      backgroundColor: sourceContact?.copyContactBackgroundColor || brand?.surface_color || '#f8fafc',
      image: projectCoverImage,
      copyContactBackgroundColor: sourceContact?.copyContactBackgroundColor,
      textColor: '#0f172a',
      accentColor: accentColor,
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 25,
      titleSize: sourceContact?.titleSize || 26,
      bodySize: sourceContact?.bodySize || 14,
      padding: sourceContact?.padding || 48,
      minHeight: 620,
      brokerLogoSize: sourceContact?.brokerLogoSize || 52,
      customBrokerLogoUrl: brokerAgencyLogo,
      showBrokerLogo: Boolean(brokerAgencyLogo),
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#64748b',
      disclaimerSize: 9,
    }, copyBrand) as Block;
    nonContactBlocks.push(contactBlock);

    // 5. Build new snapshot
    const projectName = fallbackProject?.name || (sourceSnapshot.project as string) || (sourceSnapshot.projectName as string) || sourcePres?.title?.replace(/dossier/i, '').trim() || 'Proyecto';
    const newTitle = `Dossier ${projectName} — ${currentUser.displayName || agencyName}`;

    const newSnapshot = {
      ...sourceSnapshot,
      project: projectName,
      project_slug: fallbackProject?.slug || sourceSnapshot.project_slug || params.projectSlug,
      blocks: nonContactBlocks,
      branding: {
        name: agencyName,
        logo_url: brokerAgencyLogo || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        surface_color: brand?.surface_color || '#ffffff',
        personalized_copy: true,
      },
    };

    // 6. Insert new presentation
    const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
    const validCreatedBy = isUuid(currentUser.id) ? currentUser.id : null;

    const { data: newPres, error: presError } = await admin
      .from('presentations')
      .insert({
        organization_id: orgId,
        author_membership_id: currentUser.membershipId,
        kind: 'dossier',
        title: newTitle,
        status: 'draft',
      })
      .select('id')
      .single();

    if (presError || !newPres) {
      return { error: presError?.message || 'Error al crear la copia del dossier.' };
    }

    // 7. Insert version 1
    const { data: ver, error: verError } = await admin
      .from('presentation_versions')
      .insert({
        presentation_id: newPres.id,
        version_number: 1,
        snapshot: newSnapshot as unknown as Json,
        created_by: validCreatedBy,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (verError || !ver) {
      await admin.from('presentations').delete().eq('id', newPres.id).eq('status', 'draft');
      return { error: verError?.message || 'Error al versionar el dossier clonado.' };
    }

    const token = crypto.randomBytes(20).toString('hex');
    const { error: linkError } = await admin.from('shared_links').insert({
      presentation_version_id: ver.id,
      token,
      status: 'active',
      expires_at: null,
    });
    if (linkError) {
      await admin.from('presentations').delete().eq('id', newPres.id).eq('status', 'draft');
      return { error: 'No fue posible crear el enlace para ver el dossier.' };
    }

    const { data: published, error: publishError } = await admin.from('presentations')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', newPres.id).eq('status', 'draft').select('id').maybeSingle();
    if (publishError || !published) {
      await admin.from('presentations').delete().eq('id', newPres.id).eq('status', 'draft');
      return { error: 'No fue posible publicar la copia personalizada.' };
    }

    revalidatePath('/portal/proposals');
    revalidatePath(`/p/${token}`);

    return {
      success: true,
      presentationId: newPres.id,
      token,
      url: `/p/${token}`,
    };
  } catch (err) {
    console.error('cloneProjectDossierAction error:', err);
    return { error: 'Ocurrió un error inesperado al clonar el dossier.' };
  }
}

export async function getProposalForEditAction(presentationId: number): Promise<{
  data?: {
    presentationId: number;
    title: string;
    kind: 'proposal' | 'dossier';
    contactId?: number;
    projectSlug?: string;
    token?: string;
    url?: string;
    authorMembershipId?: number | null;
    snapshot: Record<string, unknown>;
  };
  error?: string;
  viewUrl?: string;
}> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const saved = (await getDemoProposalsPersistent()).find((item) => item.id === presentationId && item.status !== 'archived');
    const snapshot = saved?.snapshot as Record<string, unknown> | undefined;
    if (!saved || !snapshot) return { error: 'Documento no encontrado en el almacenamiento local del demo.' };
    if (saved.kind === 'dossier' && !Array.isArray(snapshot.blocks)) return { error: 'El dossier no tiene páginas para editar.' };
    return {
      data: {
        presentationId: saved.id,
        title: saved.title,
        kind: saved.kind,
        contactId: undefined,
        projectSlug: saved.projectSlug,
        token: saved.sharedToken,
        url: saved.sharedUrl,
        authorMembershipId: 1,
        snapshot,
      },
    };
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return { error: 'Debes iniciar sesión para editar propuestas.' };
  const orgId = currentUser.organization?.id;
  if (!orgId) return { error: 'Tu cuenta no está vinculada a una organización.' };

  const { data: pres, error: presError } = await supabase
    .from('presentations')
    .select(`
      id, title, kind, status, contact_id, organization_id, author_membership_id,
      presentation_versions(id, version_number, snapshot, published_at, shared_links(id, token, status, expires_at))
    `)
    .eq('id', presentationId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (presError || !pres) return { error: 'Propuesta no encontrada o sin acceso.' };

  const canEditAny = pres.kind === 'dossier'
    ? hasCapability(currentUser.role, 'edit_project_dossier')
    : ['super_admin', 'master_broker_admin'].includes(currentUser.role);
  const isAuthor = Boolean(currentUser.membershipId && pres.author_membership_id === currentUser.membershipId);
  if (!canEditAny && (pres.kind === 'dossier' || !isAuthor)) {
    if (pres.kind === 'dossier') {
      const activeLink = (pres.presentation_versions || [])
        .flatMap((version) => version.shared_links || [])
        .find((link) => link.status === 'active');
      return { error: 'Esta copia se consulta en línea y no se puede editar.', viewUrl: activeLink ? `/p/${activeLink.token}` : undefined };
    }
    return { error: 'Solo los administradores o el autor pueden editar este documento.' };
  }

  const versions = ((pres.presentation_versions || []) as Array<{
    id: number;
    version_number: number;
    snapshot: Record<string, unknown>;
    published_at: string;
    shared_links?: Array<{ id: number; token: string; status: string; expires_at: string }>;
  }>).sort((a, b) => (b.version_number || 0) - (a.version_number || 0));

  const latest = versions[0];
  if (!latest || !latest.snapshot) return { error: 'La propuesta no tiene contenido guardado.' };

  const snapshot = latest.snapshot;
  const sharedLink = pres.kind === 'dossier' && pres.status === 'draft'
    ? undefined
    : versions.flatMap((version) => version.shared_links || []).find((link) => link.status === 'active');
  const token = sharedLink?.token;

  return {
    data: {
      presentationId: pres.id,
      title: pres.title,
      kind: pres.kind as 'proposal' | 'dossier',
      contactId: pres.contact_id || undefined,
      projectSlug: (snapshot.project_slug as string) || undefined,
      token,
      url: token ? `/p/${token}` : undefined,
      authorMembershipId: pres.author_membership_id,
      snapshot,
    },
  };
}

export async function updateProposalAction(payload: {
  presentationId: number;
  title: string;
  contactId?: number;
  directInvestor?: boolean;
  offerId?: number;
  snapshot: Json;
}): Promise<SaveProposalResponse> {
  try {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return { error: 'Debes iniciar sesión para editar una propuesta.' };
  const orgId = currentUser.organization?.id;
  if (!orgId) return { error: 'Tu cuenta no está vinculada a una organización.' };

  const { data: pres, error: presError } = await supabase
    .from('presentations')
    .select('id, kind, organization_id, author_membership_id, presentation_versions(id, version_number, shared_links(id, token))')
    .eq('id', payload.presentationId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (presError || !pres) return { error: 'Propuesta no encontrada o sin acceso.' };

  if (pres.kind !== 'proposal') return { error: 'Los dossiers solo se modifican desde el editor oficial.' };
  const canEditAny = ['super_admin', 'master_broker_admin'].includes(currentUser.role);
  const isAuthor = Boolean(currentUser.membershipId && pres.author_membership_id === currentUser.membershipId);
  if (!canEditAny && !isAuthor) {
    return { error: 'Solo los administradores o el autor pueden editar este documento.' };
  }

  const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  const validCreatedBy = isUuid(currentUser.id) ? currentUser.id : null;

  // 1. Update presentation title and contact
  await supabase
    .from('presentations')
    .update({
      title: payload.title.trim(),
      contact_id: payload.contactId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.presentationId);

  const versions = ((pres.presentation_versions || []) as Array<{
    id: number;
    version_number: number;
    shared_links?: Array<{ id: number; token: string }>;
  }>).sort((a, b) => (b.version_number || 0) - (a.version_number || 0));

  const latestVer = versions[0];
  const nextVerNum = (latestVer?.version_number || 1) + 1;

  // 2. Insert new version with updated snapshot
  const { data: newVer, error: verError } = await supabase
    .from('presentation_versions')
    .insert({
      presentation_id: payload.presentationId,
      version_number: nextVerNum,
      snapshot: payload.snapshot,
      created_by: validCreatedBy,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (verError || !newVer) {
    return { error: verError?.message || 'Error al actualizar la versión de la propuesta.' };
  }

  // 3. Update existing shared link to point to the new version so the same public link reflects edits
  let token = '';
  const existingSharedLink = latestVer?.shared_links?.[0];
  if (existingSharedLink?.id) {
    token = existingSharedLink.token;
    await supabase
      .from('shared_links')
      .update({ presentation_version_id: newVer.id })
      .eq('id', existingSharedLink.id);
  } else {
    token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('shared_links').insert({
      presentation_version_id: newVer.id,
      token,
      status: 'active',
      expires_at: expiresAt,
    });
  }

  // 4. In background, refresh EN and FR translations for this token
  if (token) {
    void resolvePublicPresentationTranslationsAction(token, 'en').catch(() => {});
    void resolvePublicPresentationTranslationsAction(token, 'fr').catch(() => {});
  }

  await supabase.from('audit_events').insert({
    organization_id: orgId,
    actor_user_id: validCreatedBy,
    action: 'presentation_updated',
    entity_type: 'presentation',
    entity_id: String(payload.presentationId),
    metadata: { title: payload.title.trim(), version: nextVerNum },
  }).then(() => {}, () => {});

  revalidatePath('/portal/proposals');
  revalidatePath('/portal/clientes');
  if (token) revalidatePath(`/p/${token}`);

  return {
    success: true,
    presentationId: payload.presentationId,
    token,
    url: `/p/${token}`,
  };
  } catch (err) {
    console.error('updateProposalAction error:', err);
    return { error: 'Ocurrió un error al actualizar la propuesta. Inténtalo de nuevo.' };
  }
}

export async function createCommercialProposalFromSimulatorAction(payload: {
  projectId: number;
  unitId: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  planConfig: SimulatorPlanConfig;
  validDays?: number;
  amenities?: string[];
  amenityIconMap?: Record<string, string>;
}): Promise<SaveProposalResponse> {
  try {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "Debes iniciar sesión para generar una propuesta." };
  }
  if (!hasCapability(currentUser.role, "create_proposals")) {
    return { error: "Tu perfil no tiene permiso para generar propuestas." };
  }
  if (!payload.clientName?.trim()) {
    return { error: "El nombre del cliente es obligatorio." };
  }

  // 1. Fetch project details
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select(`
      id, slug, name, location, starting_price, currency, description, delivery_date,
      brand_profile:brand_profiles(name, primary_color, accent_color, logo_path),
      project_media(storage_path, kind, sort_order)
    `)
    .eq("id", payload.projectId)
    .single();

  if (projErr || !project) {
    return { error: `Proyecto no encontrado: ${projErr?.message || "ID inválido"}` };
  }

  // 2. Fetch unit details — verify it belongs to the project and is available
  const { data: unit, error: unitErr } = await supabase
    .from("units")
    .select(`
      id, unit_code, list_price, currency, floor_level, tower, status, project_id,
      typologies(name, bedrooms, bathrooms, total_sqm)
    `)
    .eq("id", payload.unitId)
    .eq("project_id", payload.projectId)
    .single();

  if (unitErr || !unit) {
    return { error: `Unidad no encontrada o no pertenece al proyecto seleccionado.` };
  }

  if (unit.status && !['available', 'disponible'].includes((unit.status as string).toLowerCase())) {
    return { error: `La unidad ${unit.unit_code} no está disponible (estado: ${unit.status}).` };
  }

  const { data: projectAmenityRows } = await supabase
    .from('project_amenities')
    .select('amenity:amenities(name)')
    .eq('project_id', payload.projectId);
  const projectAmenities = (projectAmenityRows || [])
    .map((row) => (row.amenity as { name?: string } | null)?.name || '')
    .filter(Boolean);
  const frozenAmenities = (payload.amenities?.length ? payload.amenities : projectAmenities)
    .map((amenity) => amenity.trim())
    .filter(Boolean)
    .slice(0, 12);

  const typology = unit.typologies as {
    name?: string;
    bedrooms?: number;
    bathrooms?: number;
    total_sqm?: number;
  } | null;
  const bedrooms = typology?.bedrooms ?? 2;
  const bathrooms = typology?.bathrooms ? Number(typology.bathrooms) : 2;
  const areaSqm = typology?.total_sqm ? Number(typology.total_sqm) : 85;

  // 3. Fetch approved documents only (Dossier / Proposal rule)
  const { data: rawDocs } = await supabase
    .from("project_documents")
    .select(`
      id, title, category, status,
      document_versions(version_number, storage_path, mime_type, file_size_bytes)
    `)
    .eq("project_id", payload.projectId)
    .in("status", ["approved", "published"]);

  const approvedDocuments = ((rawDocs || []) as Array<{
    title: string;
    category: string;
    document_versions?: Array<{ version_number?: number; storage_path?: string; mime_type?: string }>;
  }>).map((d) => {
    const latest = d.document_versions?.[0];
    return {
      title: d.title,
      category: d.category,
      versionNumber: latest?.version_number || 1,
      storagePath: latest?.storage_path,
      mimeType: latest?.mime_type,
    };
  });

  // 4. Resolve hero and gallery media
  const projectMediaList = (project.project_media || []) as Array<{ kind?: string; storage_path?: string }>;
  const heroMedia = projectMediaList.find((m) => m.kind === "hero")?.storage_path;
  const galleryMedia = projectMediaList
    .filter((m) => m.kind === "gallery")
    .map((m) => m.storage_path || "")
    .filter(Boolean);

  // 5. Freeze Proposal Snapshot
  const title = `${project.name} · Propuesta Unidad ${unit.unit_code} para ${payload.clientName.trim()}`;
  const validDays = payload.validDays ?? 30;

  const frozen = buildFrozenProposalSnapshot({
    title,
    projectSlug: project.slug,
    projectName: project.name,
    clientName: payload.clientName.trim(),
    clientEmail: payload.clientEmail?.trim(),
    clientPhone: payload.clientPhone?.trim(),
    unit: {
      id: unit.id,
      unitCode: unit.unit_code,
      price: Number(unit.list_price),
      currency: (unit.currency || project.currency || "USD") as "USD" | "DOP" | "EUR",
      floor: unit.floor_level,
      tower: unit.tower,
      type: typology?.name || `${bedrooms} Hab.`,
      bedrooms,
      bathrooms,
      areaSqm,
      deliveryDate: project.delivery_date,
    },
    planConfig: payload.planConfig,
    validDays,
    approvedDocuments,
    branding: {
      organizationName: project.brand_profile?.name || currentUser.organization?.name,
      primaryColor: project.brand_profile?.primary_color || "#0A1140",
      accentColor: project.brand_profile?.accent_color || "#D4AF37",
      logoUrl: project.brand_profile?.logo_path || undefined,
    },
  });

  // Calculate schedule for ProposalPropertyItem format (compatible with MultiPropertyProposalViewer)
  const calculatedSchedule = calculateCommercialSchedule(Number(unit.list_price), payload.planConfig);

  const fullSnapshot = {
    ...frozen,
    items: [
      {
        id: `${project.slug}-${unit.unit_code}`,
        property_id: String(project.id),
        project_name: project.name,
        unit_name: unit.unit_code,
        location: project.location || "Punta Cana, Rep. Dominicana",
        price: Number(unit.list_price),
        currency: (unit.currency || project.currency || "USD") as "USD" | "DOP" | "EUR",
        bedrooms,
        bathrooms,
        area_sqm: areaSqm,
        delivery_date: project.delivery_date || "2026",
        description: project.description || "",
        hero_image: heroMedia || "",
        gallery_images: galleryMedia.length > 0 ? galleryMedia : [heroMedia || ""],
        amenities: frozenAmenities,
        amenity_icon_map: payload.amenityIconMap || {},
        payment_plan: {
          reservation_amount: payload.planConfig.reservationAmount,
          initial_percentage: payload.planConfig.initialPercentage,
          during_construction_percentage: payload.planConfig.duringConstructionPercentage,
          upon_delivery_percentage: payload.planConfig.uponDeliveryPercentage,
          steps: calculatedSchedule.steps,
        },
      },
    ],
    presentation_mode: "magazine",
  };

  // 6. Save presentation and version
  return await saveProposalAction({
    title,
    kind: "proposal",
    snapshot: fullSnapshot as unknown as Json,
  });
  } catch (err) {
    console.error('createCommercialProposalFromSimulatorAction error:', err);
    return { error: 'Ocurrió un error al generar la propuesta. Inténtalo de nuevo.' };
  }
}

export async function getLatestSavedPresentationAction(params: {
  projectSlug?: string;
  projectName?: string;
  kind?: "proposal" | "dossier";
}): Promise<{ presentationId: number; status: string; blocks?: Block[]; snapshot?: SavedPresentationSnapshot } | null> {
  try {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      if (params.kind !== 'dossier') return null;
      const saved = (await getDemoProposalsPersistent())
        .filter((item) => item.kind === 'dossier' && item.status !== 'archived')
        .find((item) => item.projectSlug === params.projectSlug || item.projectName?.toLowerCase() === params.projectName?.toLowerCase());
      const snapshot = saved?.snapshot as SavedPresentationSnapshot | undefined;
      if (!saved || !Array.isArray(snapshot?.blocks)) return null;
      return { presentationId: saved.id, status: saved.status, blocks: snapshot.blocks, snapshot };
    }
    const supabase = await createClient();
    const currentUser = await getCurrentUser();
    if (params.kind === 'dossier' && !hasCapability(currentUser?.role, 'edit_project_dossier')) return null;
    const orgId = currentUser?.organization?.id;
    if (!orgId) return null;

    let query = supabase
      .from("presentations")
      .select(`
        id,
        kind,
        title,
        status,
        author_membership_id,
        created_at,
        presentation_versions(
          snapshot,
          version_number,
          created_at
        )
      `)
      .eq("organization_id", orgId)
      .neq('status', 'archived')
      .order("updated_at", { ascending: false });

    if (params.kind) {
      query = query.eq("kind", params.kind);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    // Search for the presentation that matches projectSlug or title
    for (const pres of data as Array<Record<string, unknown>>) {
      if (pres.kind === 'dossier' && !hasCapability(currentUser?.role, 'edit_project_dossier')) continue;
      const canEditAny = ['super_admin', 'master_broker_admin'].includes(currentUser.role) || hasCapability(currentUser.role, 'edit_project_dossier');
      if (!canEditAny && pres.author_membership_id !== currentUser.membershipId) continue;
      const versions = pres.presentation_versions as Array<{ snapshot?: SavedPresentationSnapshot; version_number?: number }> | undefined;
      const latestVer = versions?.sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0];
      const snapshot = latestVer?.snapshot;
      if (!snapshot) continue;

      const slugInSnapshot =
        snapshot.project_slug ||
        snapshot.items?.[0]?.id ||
        snapshot.items?.[0]?.project_slug;

      const nameMatches = Boolean(params.projectName && typeof snapshot.project === 'string' && snapshot.project.toLowerCase() === params.projectName.toLowerCase());

      const slugMatches =
        params.projectSlug &&
        (slugInSnapshot === params.projectSlug ||
         (typeof slugInSnapshot === 'string' && slugInSnapshot.startsWith(params.projectSlug)));

      if (!params.projectSlug || slugMatches || nameMatches) {
        if (Array.isArray(snapshot.blocks) && snapshot.blocks.length > 0) {
          return {
            presentationId: pres.id as number,
            status: pres.status as string,
            blocks: snapshot.blocks,
            snapshot,
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.warn("getLatestSavedPresentationAction error:", err);
    return null;
  }
}

export async function resendProposalEmailAction(presentationId: number): Promise<{
  success?: boolean;
  error?: string;
  emailStatus?: 'sent' | 'failed';
}> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };

  const canManageAll = ['super_admin', 'master_broker_admin', 'agency_admin', 'agency_support'].includes(currentUser.role);
  const orgId = currentUser.organization?.id;
  if (!orgId) return { error: 'Tu cuenta no está vinculada a una organización.' };

  const { data: presentation } = await supabase
    .from('presentations')
    .select(`
      id, title, author_membership_id, organization_id,
      contact:contacts(first_name, last_name, email),
      presentation_versions(id, snapshot, shared_links(token, status, expires_at))
    `)
    .eq('id', presentationId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!presentation) return { error: 'Propuesta no encontrada.' };
  if (!canManageAll && presentation.author_membership_id !== currentUser.membershipId) {
    return { error: 'Solo puedes reenviar tus propias propuestas.' };
  }

  const contact = presentation.contact as { first_name?: string; last_name?: string; email?: string } | null;
  const versions = presentation.presentation_versions as Array<{
    id: number;
    snapshot?: Record<string, unknown>;
    shared_links?: Array<{ token: string; status: string; expires_at?: string }>;
  }> | undefined;
  const latestVersion = versions?.[0];
  const sharedLink = latestVersion?.shared_links?.find((l) => l.status === 'active');
  const snapshot = latestVersion?.snapshot;

  if (!contact?.email || !/^\S+@\S+\.\S+$/.test(contact.email)) {
    return { error: 'El lead no tiene un correo válido.' };
  }
  if (!sharedLink) return { error: 'No hay un enlace activo para esta propuesta.' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com';
  const fullUrl = `${baseUrl}/p/${sharedLink.token}`;
  const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente';
  const projectName = (snapshot?.project as string) || presentation.title;
  const items = Array.isArray(snapshot?.items) ? snapshot.items as Array<{ unit_name?: string }> : [];
  const unitSummary = items.map((i) => i.unit_name).filter(Boolean).join(', ') || 'Ver propuesta';

  const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
  const validCreatedBy = isUuid(currentUser.id) ? currentUser.id : null;

  try {
    await sendProposalEmail({
      to: contact.email,
      replyTo: currentUser.email,
      recipientName: clientName,
      projectName,
      unitSummary,
      brokerName: currentUser.displayName || 'Tu asesor',
      brokerPhone: currentUser.phone || undefined,
      agencyName: currentUser.organization?.name,
      proposalUrl: fullUrl,
      expiresAt: sharedLink.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabase.from('audit_events').insert({
      organization_id: orgId,
      actor_user_id: validCreatedBy,
      action: 'proposal_email_resent',
      entity_type: 'presentation',
      entity_id: String(presentationId),
      metadata: { recipient: contact.email },
    }).then(() => {}, () => {});

    return { success: true, emailStatus: 'sent' };
  } catch (emailErr) {
    const errorMessage = emailErr instanceof Error ? emailErr.message : 'Error desconocido';
    await supabase.from('audit_events').insert({
      organization_id: orgId,
      actor_user_id: validCreatedBy,
      action: 'proposal_email_failed',
      entity_type: 'presentation',
      entity_id: String(presentationId),
      metadata: { recipient: contact.email, error: errorMessage, is_resend: true },
    }).then(() => {}, () => {});
    return { error: `No se pudo enviar el correo: ${errorMessage}`, emailStatus: 'failed' };
  }
}

export async function summarizeProposalCoverMessageAction(input: {
  projectName?: string;
  projectDescription?: string;
  currentMessage?: string;
}): Promise<{ success: boolean; text?: string; error?: string }> {
  const currentUser = await getCurrentUser().catch(() => null);
  if (!currentUser) {
    return { success: false, error: 'Sesión no autorizada.' };
  }

  const sourceDescription = (input.projectDescription || input.currentMessage || '').trim();
  if (!sourceDescription) {
    return { success: false, error: 'No hay descripción disponible para resumir.' };
  }

  const systemInstruction = [
    'Eres un redactor inmobiliario senior especializado en inversiones residenciales y turísticas de alto nivel en el Caribe (República Dominicana).',
    'Tu ÚNICA tarea es sintetizar la descripción oficial del proyecto para crear el mensaje de portada de una propuesta comercial dirigida a un inversionista.',
    'REGLAS ESTRICTAS E INQUEBRANTABLES:',
    '1. LONGITUD: Debe tener entre 220 y 380 caracteres (oraciones completas con punto final, nunca dejes una frase a medias ni interrumpida).',
    '2. NO INVENTES NADA: Basa todo única y exclusivamente en la información provista en la descripción.',
    '3. NADA DE DETALLES TÉCNICOS: Prohibido incluir metrajes (m², sq ft), número de habitaciones, baños o cantidad de niveles.',
    '4. ENFOQUE INVERSIONISTA: Destaca la esencia, el estilo de vida exclusivo, la ubicación/entorno y el atractivo de inversión/rentabilidad/servicios que le llame la atención a un inversionista.',
    '5. TONO: Elegante, directo, profesional y vendedor.',
    '6. FORMATO: Devuelve ÚNICAMENTE el párrafo de texto, sin comillas, sin viñetas, sin títulos ni explicaciones previas o posteriores.',
  ].join('\n');

  const userPrompt = [
    input.projectName ? `PROYECTO: ${input.projectName}` : '',
    `DESCRIPCIÓN OFICIAL:\n${sourceDescription}`,
    input.currentMessage && input.currentMessage !== sourceDescription ? `MENSAJE ACTUAL:\n${input.currentMessage}` : '',
    'Sintetiza la esencia para el inversionista en un párrafo menor a 380 caracteres:',
  ].filter(Boolean).join('\n\n');

  const pool = getGeminiPool();
  if (!pool.length) {
    // Deterministic fallback if Gemini pool is not configured
    const clean = sourceDescription
      .replace(/\b\d+\s*(?:m2|mts2|m²|sqm)\b/gi, '')
      .replace(/\b\d+\s*(?:habitación|habitaciones|habs|dormitorio|dormitorios|baño|baños)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const truncated = clean.length > 370 ? clean.slice(0, 367) + '...' : clean;
    return { success: true, text: truncated };
  }

  const configured = process.env.GEMINI_TRANSLATION_MODELS || process.env.GEMINI_INVENTORY_MODEL || '';
  const fallbackModels = configured ? configured.split(',').map((m) => m.trim()).filter(Boolean) : [];
  const modelList = [...new Set([...fallbackModels, 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash', 'gemini-2.0-flash'])];

  for (const entry of pool) {
    const targetModels = [entry.model, ...modelList].filter(Boolean) as string[];
    for (const model of targetModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(entry.key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1500,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        let generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        // Strip any wrapping quotes
        if ((generatedText.startsWith('"') && generatedText.endsWith('"')) || (generatedText.startsWith('“') && generatedText.endsWith('”'))) {
          generatedText = generatedText.slice(1, -1).trim();
        }

        if (generatedText) {
          if (generatedText.length > 400) {
            // Cut neatly at the last punctuation before 390 chars
            const lastPeriod = generatedText.slice(0, 390).lastIndexOf('.');
            if (lastPeriod > 220) {
              generatedText = generatedText.slice(0, lastPeriod + 1);
            } else {
              generatedText = generatedText.slice(0, 385) + '...';
            }
          }
          return { success: true, text: generatedText };
        }
      } catch {
        // Try next model or credential
      }
    }
  }

  // Fallback if all Gemini requests failed
  const clean = sourceDescription
    .replace(/\b\d+\s*(?:m2|mts2|m²|sqm)\b/gi, '')
    .replace(/\b\d+\s*(?:habitación|habitaciones|habs|dormitorio|dormitorios|baño|baños)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const fallbackText = clean.length > 370 ? clean.slice(0, 367) + '...' : clean;
  return { success: true, text: fallbackText };
}

export async function summarizeProposalConceptAction(input: {
  projectName?: string;
  projectDescription?: string;
  currentPart1?: string;
  currentPart2?: string;
}): Promise<{ success: boolean; part1?: string; part2?: string; error?: string }> {
  const currentUser = await getCurrentUser().catch(() => null);
  if (!currentUser) {
    return { success: false, error: 'Sesión no autorizada.' };
  }

  const sourceDescription = (input.projectDescription || [input.currentPart1, input.currentPart2].filter(Boolean).join('\n\n') || '').trim();
  if (!sourceDescription) {
    return { success: false, error: 'No hay descripción disponible para redactar el concepto.' };
  }

  function cleanAndCap(text: string, maxChars: number): string {
    let t = text.replace(/^["'“]+|["'”]+$/g, '').trim();
    // Strip technical bedroom / square meter notes
    t = t
      .replace(/\b\d+\s*(?:m2|mts2|m²|sqm)\b/gi, '')
      .replace(/\b\d+\s*(?:habitación|habitaciones|habs|dormitorio|dormitorios|baño|baños)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (t.length <= maxChars) return t;
    const lastPeriod = t.slice(0, maxChars - 3).lastIndexOf('.');
    if (lastPeriod > maxChars * 0.6) {
      return t.slice(0, lastPeriod + 1).trim();
    }
    return t.slice(0, maxChars - 3).trim() + '...';
  }

  const systemInstruction = [
    'Eres un redactor inmobiliario senior especializado en inversiones residenciales y turísticas de lujo en el Caribe (República Dominicana).',
    'Tu ÚNICA tarea es redactar el texto de la página "Concepto" para una propuesta comercial dirigida a inversionistas, dividida estrictamente en DOS PARTES.',
    'REGLAS ESTRICTAS E INQUEBRANTABLES:',
    '1. PARTE 1 (Concepto, arquitectura y estilo de vida):',
    '   - LÍMITE: MÁXIMO 300 caracteres (ideal entre 200 y 295 caracteres).',
    '   - Enfoque: concepto de diseño, atmósfera residencial de lujo, servicios de hotel, club o estilo de vida exclusivo.',
    '   - Oraciones completas, fluidas, con punto final.',
    '2. PARTE 2 (Ubicación estratégica y valor de inversión):',
    '   - LÍMITE: MÁXIMO 430 caracteres (ideal entre 260 y 425 caracteres).',
    '   - Enfoque: ubicación clave, cercanía a aeropuerto, playas, campo de golf o downtown, master plan y potencial de plusvalía y rentabilidad.',
    '   - Oraciones completas, fluidas, con punto final.',
    '3. NO INVENTES NADA: Basa todo única y exclusivamente en la información provista en la descripción oficial.',
    '4. CERO DETALLES TÉCNICOS: Prohibido mencionar metrajes (m², mts2, sq ft), cantidad de habitaciones, dormitorios o baños.',
    '5. TONO: Elegante, persuasivo, profesional y orientado al inversionista.',
    '6. FORMATO DE SALIDA ESTRICTO: Devuelve ÚNICAMENTE un JSON con esta estructura exacta, sin markdown ni explicaciones:',
    '{"part1": "texto de la parte 1...", "part2": "texto de la parte 2..."}',
  ].join('\n');

  const userPrompt = [
    input.projectName ? `PROYECTO: ${input.projectName}` : '',
    `DESCRIPCIÓN OFICIAL:\n${sourceDescription}`,
    input.currentPart1 ? `PARTE 1 ACTUAL:\n${input.currentPart1}` : '',
    input.currentPart2 ? `PARTE 2 ACTUAL:\n${input.currentPart2}` : '',
    'Redacta las dos partes en formato JSON respetando rigurosamente los límites (Parte 1: máx 300 caracteres, Parte 2: máx 430 caracteres):',
  ].filter(Boolean).join('\n\n');

  const pool = getGeminiPool();
  if (pool.length) {
    const configured = process.env.GEMINI_TRANSLATION_MODELS || process.env.GEMINI_INVENTORY_MODEL || '';
    const fallbackModels = configured ? configured.split(',').map((m) => m.trim()).filter(Boolean) : [];
    const modelList = [...new Set([...fallbackModels, 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.7-flash', 'gemini-2.0-flash'])];

    for (const entry of pool) {
      const targetModels = [entry.model, ...modelList].filter(Boolean) as string[];
      for (const model of targetModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(entry.key)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 1500,
                  thinkingConfig: { thinkingBudget: 0 },
                },
              }),
              cache: 'no-store',
              signal: AbortSignal.timeout(15000),
            }
          );

          if (!response.ok) continue;

          const data = await response.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (!generatedText) continue;

          let part1 = '';
          let part2 = '';
          try {
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.part1) part1 = cleanAndCap(String(parsed.part1), 300);
              if (parsed.part2) part2 = cleanAndCap(String(parsed.part2), 430);
            }
          } catch {}

          if (!part1 || !part2) {
            const paragraphs = generatedText
              .replace(/```json|```/g, '')
              .split(/\n\s*\n/)
              .map((p: string) => p.trim())
              .filter(Boolean);
            if (paragraphs.length >= 2) {
              if (!part1) part1 = cleanAndCap(paragraphs[0], 300);
              if (!part2) part2 = cleanAndCap(paragraphs.slice(1).join(' '), 430);
            } else if (paragraphs.length === 1 && !part1) {
              part1 = cleanAndCap(paragraphs[0], 300);
            }
          }

          if (part1 || part2) {
            return {
              success: true,
              part1: part1 || undefined,
              part2: part2 || undefined,
            };
          }
        } catch {
          // Try next model or credential
        }
      }
    }
  }

  // Deterministic fallback if Gemini is unavailable
  const rawParagraphs = sourceDescription
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  const fallbackPart1 = cleanAndCap(rawParagraphs[0] || sourceDescription, 300);
  const remainingText = rawParagraphs.slice(1).join(' ').trim() || sourceDescription;
  const fallbackPart2 = cleanAndCap(remainingText !== rawParagraphs[0] ? remainingText : '', 430);

  return {
    success: true,
    part1: fallbackPart1,
    part2: fallbackPart2 || undefined,
  };
}
