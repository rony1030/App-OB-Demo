
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { headers } from 'next/headers';
import MultiPropertyProposalViewer from '@/components/proposals/MultiPropertyProposalViewer';
import PublicDossierViewer from '@/components/portal/PublicDossierViewer';
import type { SlideBlock } from '@/components/portal/PublicDossierViewer';
import type { MultiPropertyProposal } from '@/types/proposals';
import { getDemoProposalsPersistent } from '@/lib/demo/local-crm-store';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import { brandPersonalizedBlock } from '@/lib/portal/personalized-dossier-brand';

import type { Locale } from '@/lib/i18n/locale';
import DemoSavedProposal from '@/components/portal/proposals/DemoSavedProposal';

export async function generateMetadata(props: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { token } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const headerList = await headers();
  const headerLocale = headerList.get('x-ob-locale') as Locale | null;
  const rawLang = searchParams?.lang?.toLowerCase()?.trim();
  const locale: Locale =
    rawLang === 'en' || rawLang === 'fr'
      ? rawLang
      : headerLocale === 'en' || headerLocale === 'fr'
      ? headerLocale
      : 'es';

  const defaultMeta: Metadata = {
    title: locale === 'en' ? 'Investment Proposal · OB Brokers Team' : locale === 'fr' ? 'Proposition Commerciale · OB Brokers Team' : 'Propuesta Comercial · OB Brokers Team',
    description: locale === 'en' ? 'Interactive and personalized commercial proposal.' : locale === 'fr' ? 'Proposition commerciale interactive et personnalisée.' : 'Propuesta comercial interactiva y personalizada.',
  };

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const saved = (await getDemoProposalsPersistent()).find(item => item.sharedToken === token);
    return saved ? { title: `${saved.title} · OB Brokers Team`, description: `${saved.projectName || 'Proyecto inmobiliario'} · Propuesta personalizada` } : defaultMeta;
  }
  if (!/^[a-f0-9]{40}$/i.test(token)) return defaultMeta;

  try {
    const supabase = createAdminClient();
    const { data: link } = await supabase
      .from('shared_links')
      .select('presentation_version_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!link || link.status !== 'active' || (link.expires_at && new Date(link.expires_at) < new Date())) {
      return defaultMeta;
    }

    const { data: version } = await supabase
      .from('presentation_versions')
      .select(`
        snapshot,
        presentation:presentations ( title, kind, status )
      `)
      .eq('id', link.presentation_version_id)
      .maybeSingle();

    if (!version) return defaultMeta;
    const metadataPresentation = Array.isArray(version.presentation) ? version.presentation[0] : version.presentation;
    if (metadataPresentation?.kind === 'dossier' && metadataPresentation.status === 'draft') return defaultMeta;

    const snapshot = version.snapshot as {
      project?: string;
      client_name?: string;
      items?: Array<{ unit_name?: string; hero_image?: string; image?: string; typology_image?: string }>;
      blocks?: Array<{ image?: string; images?: string[]; projectLogoUrl?: string }>;
      branding?: { logo_url?: string; name?: string };
    } | null;

    const presentation = Array.isArray(version.presentation) ? version.presentation[0] : version.presentation;
    const isDossier = presentation?.kind === 'dossier';
    const kind = isDossier
      ? (locale === 'en' ? 'Commercial Dossier' : locale === 'fr' ? 'Dossier Commercial' : 'Dossier Comercial')
      : (locale === 'en' ? 'Investment Proposal' : locale === 'fr' ? "Proposition d'Investissement" : 'Propuesta de Inversión');
    const projectName = snapshot?.project || presentation?.title || 'Proyecto Inmobiliario';
    const firstItem = snapshot?.items?.[0];
    const unitName = firstItem?.unit_name ? ` · ${locale === 'en' ? 'Unit' : locale === 'fr' ? 'Unité' : 'Unidad'} ${firstItem.unit_name}` : '';
    const clientName = snapshot?.client_name || (locale === 'en' ? 'Investor' : locale === 'fr' ? 'Investisseur' : 'Inversionista');

    const title = isDossier ? `${kind} — ${projectName}` : `${kind} — ${projectName}${unitName}`;
    const description = isDossier
      ? (locale === 'en'
          ? `Official commercial dossier for ${projectName}. Check live availability, gallery, floor plans, and project specifications.`
          : locale === 'fr'
          ? `Dossier commercial officiel de ${projectName}. Consultez les disponibilités, la galerie, les plans et les spécifications.`
          : `Dossier comercial oficial de ${projectName}. Consulta la disponibilidad, galería de imágenes, planos y especificaciones del desarrollo.`)
      : (locale === 'en'
          ? `Personalized commercial proposal for ${clientName} at ${projectName}${firstItem?.unit_name ? ` (${firstItem.unit_name})` : ''}. Check live availability, payment plan, and specifications.`
          : locale === 'fr'
          ? `Proposition commerciale personnalisée pour ${clientName} à ${projectName}${firstItem?.unit_name ? ` (${firstItem.unit_name})` : ''}. Consultez les disponibilités, le plan de paiement et les spécifications.`
          : `Propuesta comercial personalizada para ${clientName} en ${projectName}${firstItem?.unit_name ? ` (${firstItem.unit_name})` : ''}. Consulta la disponibilidad en vivo, plan de pago y especificaciones.`);

    let rawImageUrl: string | undefined;
    if (firstItem?.hero_image?.trim()) rawImageUrl = firstItem.hero_image.trim();
    else if (firstItem?.image?.trim()) rawImageUrl = firstItem.image.trim();
    else if (firstItem?.typology_image?.trim()) rawImageUrl = firstItem.typology_image.trim();

    if (!rawImageUrl && Array.isArray(snapshot?.blocks)) {
      for (const block of snapshot!.blocks!) {
        if (typeof block.image === 'string' && block.image.trim()) { rawImageUrl = block.image.trim(); break; }
        if (Array.isArray(block.images) && typeof block.images[0] === 'string' && block.images[0].trim()) { rawImageUrl = block.images[0].trim(); break; }
      }
    }

    if (!rawImageUrl && snapshot?.branding?.logo_url?.trim()) {
      rawImageUrl = snapshot.branding.logo_url.trim();
    }

    let imageUrl: string | undefined;
    if (rawImageUrl) {
      if (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')) {
        imageUrl = rawImageUrl;
      } else if (rawImageUrl.startsWith('/')) {
        imageUrl = `https://brokers.osvaldobello.com${rawImageUrl}`;
      } else {
        imageUrl = getPublicAssetUrl(rawImageUrl);
      }
    }

    const shareUrl = `https://brokers.osvaldobello.com/p/${token}${locale !== 'es' ? `?lang=${locale}` : ''}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareUrl,
        siteName: snapshot?.branding?.name || 'OB Brokers Team',
        images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    return defaultMeta;
  }
}

function LinkUnavailable({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/70">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-black"><LocalizedText text={"Este enlace ya no está disponible"} /></h1>
        <p className="text-xs text-white/60">{reason}</p>
      </div>
    </div>
  );
}

export default async function PublicProposalPage(props: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { token } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const headerList = await headers();
  const headerLocale = headerList.get('x-ob-locale') as Locale | null;
  const rawLang = searchParams?.lang?.toLowerCase()?.trim();
  const initialLocale: Locale =
    rawLang === 'en' || rawLang === 'fr'
      ? rawLang
      : headerLocale === 'en' || headerLocale === 'fr'
      ? headerLocale
      : 'es';

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const saved = (await getDemoProposalsPersistent()).find(item => item.sharedToken === token);
    return <DemoSavedProposal token={token} seed={saved} />;
  }
  if (!/^[a-f0-9]{40}$/i.test(token)) {
    return <LinkUnavailable reason="Verifica que copiaste el enlace completo, o solicita uno nuevo a tu asesor." />;
  }

  // Shared presentation records are private. The server validates the full,
  // high-entropy token before returning the minimal public document payload.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    // Never expose server configuration details through a public share link.
    return <LinkUnavailable reason="El documento no está disponible temporalmente. Intenta de nuevo en unos minutos o solicita asistencia a tu asesor." />;
  }

  const { data: link } = await supabase
    .from('shared_links')
    .select('id, status, expires_at, presentation_version_id, views_count')
    .eq('token', token)
    .maybeSingle();

  if (!link) {
    return <LinkUnavailable reason="Verifica que copiaste el enlace completo, o solicita uno nuevo a tu asesor." />;
  }
  if (link.status !== 'active') {
    return <LinkUnavailable reason="El asesor que lo compartió lo ha desactivado. Solicita un enlace actualizado." />;
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return <LinkUnavailable reason="Este enlace venció. Pide a tu asesor que te comparta una propuesta nueva." />;
  }

  const { data: version } = await supabase
    .from('presentation_versions')
    .select(`
      snapshot,
      presentation:presentations (
        id, kind, title, status, organization_id, author_membership_id, created_at, updated_at,
        contact:contacts ( first_name, last_name, email, phone )
      )
    `)
    .eq('id', link.presentation_version_id)
    .maybeSingle();

  const snapshot = version?.snapshot as {
    items?: unknown;
    subtitle?: string;
    presentation_mode?: string;
    blocks?: Record<string, unknown>[];
    project?: string;
    project_slug?: string;
    kind?: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    recipient_type?: 'person' | 'company';
  } | null;
  const presentation = version?.presentation as unknown as {
    id: number; kind?: string; title: string; status: MultiPropertyProposal['status']; organization_id: number;
    author_membership_id: number | null; created_at: string; updated_at: string;
    contact: { first_name: string; last_name: string | null; email: string | null; phone: string | null } | null;
  } | null;

  if (!presentation || (!snapshot?.items && !snapshot?.blocks)) {
    return <LinkUnavailable reason="No fue posible cargar el contenido de esta propuesta." />;
  }
  if (presentation.kind === 'dossier' && presentation.status === 'draft') {
    return <LinkUnavailable reason="Este dossier todavía no ha sido publicado." />;
  }

  const [{ data: brand }, { data: authorMembership }] = await Promise.all([
    supabase
      .from('brand_profiles')
      .select('name, primary_color, secondary_color, accent_color, surface_color, logo_path, whatsapp_number, contact_email, contact_phone')
      .eq('organization_id', presentation.organization_id)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle(),
    presentation.author_membership_id
      ? supabase.from('memberships').select('user_id, role').eq('id', presentation.author_membership_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: authorProfile } = authorMembership?.user_id
    ? await supabase.from('profiles').select('display_name, email, phone, avatar_path').eq('user_id', authorMembership.user_id).maybeSingle()
    : { data: null };

  // Best-effort view tracking — never blocks rendering if it fails or leaks client data.
  const firstItem = Array.isArray(snapshot.items) ? snapshot.items[0] as { property_id?: string } | undefined : undefined;
  const projectId = firstItem?.property_id && /^\d+$/.test(firstItem.property_id) ? Number(firstItem.property_id) : null;
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') || '';
  const deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : /mobile|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
  const rawIp = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || requestHeaders.get('cf-connecting-ip') || undefined;
  const locationCountry = requestHeaders.get('cf-ipcountry') || undefined;
  const locationCity = requestHeaders.get('cf-ipcity') || undefined;
  const proposalEventType = presentation.kind === 'dossier' ? 'dossier_view' : 'proposal_view';
  await Promise.all([
    supabase.from('engagement_events').insert({
      organization_id: presentation.organization_id,
      shared_link_id: link.id,
      event_type: proposalEventType,
      metadata: {
        projectId,
        source: 'proposal_viewer',
        deviceType,
        ip: rawIp,
        locationCountry,
        locationCity,
      },
    }),
    supabase.from('shared_links').update({ views_count: (link.views_count || 0) + 1 }).eq('id', link.id),
  ]).then(() => {}, () => {});

  const contact = presentation.contact;
  const presentationKind = presentation.kind || snapshot?.kind || 'proposal';
  const savedClientName = typeof snapshot.client_name === 'string' ? snapshot.client_name.trim() : '';
  const contactClientName = contact ? `${contact.first_name} ${contact.last_name || ''}`.trim() : '';
  const clientName = contactClientName || savedClientName || (presentationKind === 'dossier' ? '' : 'Cliente');

  const snapshotBranding = (snapshot as unknown as { branding?: { name?: string; logo_url?: string | null; header_logo_mode?: string; custom_logo_url?: string; personalized_copy?: boolean; primary_color?: string; accent_color?: string; surface_color?: string } })?.branding;
  const isWhiteLabel = snapshotBranding?.header_logo_mode === 'none' || Boolean((snapshot?.blocks?.[0] as Record<string, unknown> | undefined)?.hideHeaderLogo);
  const resolvedAgencyLogo = isWhiteLabel
    ? undefined
    : snapshotBranding?.logo_url !== undefined
    ? (snapshotBranding.logo_url ? getPublicAssetUrl(snapshotBranding.logo_url) : undefined)
    : (brand?.logo_path ? getPublicAssetUrl(brand.logo_path) : undefined);
  const resolvedAgencyName = isWhiteLabel ? undefined : (snapshotBranding?.name || brand?.name || undefined);

  const proposal: MultiPropertyProposal = {
    id: String(presentation.id),
    token,
    title: presentation.title,
    subtitle: snapshot.subtitle,
    client_name: clientName,
    recipient_type: snapshot.recipient_type,
    client_email: contact?.email || snapshot.client_email || undefined,
    client_phone: contact?.phone || snapshot.client_phone || undefined,
    broker_id: authorMembership?.user_id || '',
    broker_name: authorProfile?.display_name || brand?.name || 'Tu asesor',
    broker_email: authorProfile?.email || brand?.contact_email || '',
    broker_phone: authorProfile?.phone || brand?.whatsapp_number || brand?.contact_phone || '',
    broker_avatar: authorProfile?.avatar_path ? getPublicAssetUrl(authorProfile.avatar_path) : undefined,
    agency_name: resolvedAgencyName,
    agency_logo: resolvedAgencyLogo,
    brand_primary: brand?.primary_color || undefined,
    brand_accent: brand?.accent_color || undefined,
    brand_surface: brand?.surface_color || undefined,
    items: Array.isArray(snapshot.items) ? snapshot.items as MultiPropertyProposal['items'] : [],
    presentation_mode: (snapshot.presentation_mode as MultiPropertyProposal['presentation_mode']) || 'comparative',
    status: presentation.status,
    views_count: 0,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at,
    expires_at: link.expires_at || undefined,
  };

  const brandStyle = brand
    ? ({
        '--brand-primary': brand.primary_color,
        '--brand-secondary': brand.secondary_color,
        '--brand-accent': brand.accent_color,
        '--brand-surface': brand.surface_color,
      } as React.CSSProperties)
    : undefined;

  const hasPresentationBlocks = Array.isArray(snapshot?.blocks) && snapshot.blocks.length > 0;
  const rawBlocks = hasPresentationBlocks ? snapshot.blocks as SlideBlock[] : [];
  const sourceCover = rawBlocks.find((block) => block.type === 'cover');
  const projectCoverImage = sourceCover?.image || sourceCover?.secondaryImage ||
    (snapshot as { coverImage?: string }).coverImage;
  const presentationBlocks = rawBlocks.map((original) => {
    // Older personalized snapshots kept the source dossier's footer palette.
    // Normalize only these copies at render time; the stored version remains immutable.
    const b = snapshotBranding?.personalized_copy
      ? brandPersonalizedBlock(
          original.type === 'contact' && projectCoverImage
            ? { ...original, backgroundType: 'image', image: projectCoverImage, imageFit: 'cover', overlayOpacity: 25 }
            : original,
          snapshotBranding,
        )
      : original;
    if (isWhiteLabel) {
      return {
        ...b,
        hideHeaderLogo: true,
        showBrokerLogo: false,
        headerLogoMode: 'none' as const,
      };
    }
    if (snapshotBranding?.header_logo_mode) {
      return {
        ...b,
        headerLogoMode: snapshotBranding.header_logo_mode,
        hideHeaderLogo: snapshotBranding.header_logo_mode === 'none',
        customBrokerLogoUrl: snapshotBranding.custom_logo_url
          ? getPublicAssetUrl(snapshotBranding.custom_logo_url)
          : (b).customBrokerLogoUrl
          ? getPublicAssetUrl((b).customBrokerLogoUrl)
          : undefined,
      };
    }
    return b.customBrokerLogoUrl
      ? { ...b, customBrokerLogoUrl: getPublicAssetUrl(b.customBrokerLogoUrl) }
      : b;
  });

  // The shared document must render the exact immutable snapshot saved by the editor.
  // Proposals and dossiers have separate records and use their respective presentation mode.
  if (hasPresentationBlocks) {
    return (
      <div style={brandStyle}>
        <PublicDossierViewer
          blocks={presentationBlocks}
          title={presentation.title}
          projectName={snapshot.project || presentation.title}
          projectSlug={snapshot.project_slug || 'proposal'}
          brokerName={proposal.broker_name}
          brokerPhone={proposal.broker_phone}
          brokerEmail={proposal.broker_email}
          brokerAvatarUrl={proposal.broker_avatar}
          agencyName={resolvedAgencyName || snapshot.project || presentation.title || 'Propuesta de inversión'}
          agencyLogo={resolvedAgencyLogo}
          clientName={clientName}
          variant={presentationKind === 'proposal' ? 'proposal' : 'dossier'}
          proposalItems={proposal.items}
          token={token}
          initialLocale={initialLocale}
          sourceDossierId={presentationKind === 'dossier' && authorMembership?.role === 'super_admin' ? presentation.id : undefined}
        />
      </div>
    );
  }

  return (
    <div style={brandStyle}>
      <MultiPropertyProposalViewer proposal={proposal} />
    </div>
  );
}
