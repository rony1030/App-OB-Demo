import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { agreementState } from '@/lib/data/agreements';

export type DeveloperProjectOverview = {
  id: number;
  name: string;
  slug: string;
  publicationStatus: string;
  lifecycleStatus: string;
  totalUnits: number;
  availableUnits: number;
  inventoryUpdatedAt: string | null;
  documentsCount: number;
  activeMasterBrokersCount: number;
  proposalViews: number;
  dossierViews: number;
  pdfDownloads: number;
};

export type DeveloperOverview = {
  projects: DeveloperProjectOverview[];
  totalProjects: number;
  totalUnitsAvailable: number;
  totalActiveMasterBrokers: number;
};

export async function getDeveloperOverview(organizationId: number): Promise<DeveloperOverview> {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, publication_status, lifecycle_status, inventory_total_declared, inventory_available_declared, inventory_updated_at')
    .eq('developer_organization_id', organizationId)
    .order('name');

  const rows = projects ?? [];
  if (rows.length === 0) {
    return { projects: [], totalProjects: 0, totalUnitsAvailable: 0, totalActiveMasterBrokers: 0 };
  }

  const projectIds = rows.map((p) => p.id);

  const [{ data: documents }, { data: agreements }, { data: engagementEvents }] = await Promise.all([
    supabase.from('project_documents').select('project_id').in('project_id', projectIds),
    supabase.from('agreements').select('project_id, master_broker_organization_id, status, expires_at').in('project_id', projectIds),
    createAdminClient().from('engagement_events').select('event_type, metadata').limit(5000),
  ]);

  const docCountByProject = new Map<number, number>();
  for (const d of documents ?? []) {
    docCountByProject.set(d.project_id, (docCountByProject.get(d.project_id) ?? 0) + 1);
  }

  const activeBrokersByProject = new Map<number, Set<number>>();
  const proposalViewsByProject = new Map<number, number>();
  const dossierViewsByProject = new Map<number, number>();
  const pdfDownloadsByProject = new Map<number, number>();
  for (const event of engagementEvents ?? []) {
    const metadata = event.metadata as { projectId?: number } | null;
    if (!metadata?.projectId || !projectIds.includes(metadata.projectId)) continue;
    if (event.event_type === 'proposal_view') proposalViewsByProject.set(metadata.projectId, (proposalViewsByProject.get(metadata.projectId) ?? 0) + 1);
    if (event.event_type === 'dossier_view') dossierViewsByProject.set(metadata.projectId, (dossierViewsByProject.get(metadata.projectId) ?? 0) + 1);
    if (event.event_type === 'pdf_export') pdfDownloadsByProject.set(metadata.projectId, (pdfDownloadsByProject.get(metadata.projectId) ?? 0) + 1);
  }
  const allActiveBrokerOrgs = new Set<number>();
  for (const a of agreements ?? []) {
    if (!a.project_id) continue;
    if (agreementState(a.status, a.expires_at) !== 'vigente') continue;
    if (!activeBrokersByProject.has(a.project_id)) activeBrokersByProject.set(a.project_id, new Set());
    activeBrokersByProject.get(a.project_id)!.add(a.master_broker_organization_id);
    allActiveBrokerOrgs.add(a.master_broker_organization_id);
  }

  const projectOverviews: DeveloperProjectOverview[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    publicationStatus: p.publication_status,
    lifecycleStatus: p.lifecycle_status,
    totalUnits: p.inventory_total_declared ?? 0,
    availableUnits: p.inventory_available_declared ?? 0,
    inventoryUpdatedAt: p.inventory_updated_at,
    documentsCount: docCountByProject.get(p.id) ?? 0,
    activeMasterBrokersCount: activeBrokersByProject.get(p.id)?.size ?? 0,
    proposalViews: proposalViewsByProject.get(p.id) ?? 0,
    dossierViews: dossierViewsByProject.get(p.id) ?? 0,
    pdfDownloads: pdfDownloadsByProject.get(p.id) ?? 0,
  }));

  return {
    projects: projectOverviews,
    totalProjects: projectOverviews.length,
    totalUnitsAvailable: projectOverviews.reduce((s, p) => s + p.availableUnits, 0),
    totalActiveMasterBrokers: allActiveBrokerOrgs.size,
  };
}
