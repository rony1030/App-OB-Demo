
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getPortalProjects } from '@/lib/data/projects';
import { getDynamicProjectTypologies } from '@/lib/data/project-typologies-db';
import AdminProjectsManager from '@/components/portal/admin/AdminProjectsManager';
import { isCanaRockLocalPreviewEnabled } from '@/lib/data/cana-rock-preview';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

export default async function AdminProjectsPage() {
  const currentUser = await getCurrentUser();
  const localPreview = isCanaRockLocalPreviewEnabled();

  if (!currentUser && !localPreview) {
    redirect('/login');
  }

  if (currentUser && currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  const projects = await getPortalProjects();
  const projectTypologies = Object.fromEntries(
    await Promise.all(projects.map(async (project) => [
      project.id,
      await getDynamicProjectTypologies(project.id, project.slug).catch(() => ({})),
    ]))
  );

  // Fetch real CRM reservations/sales (active negotiations producing broker/agency commission)
  let crmReservedUnitIds: string[] = [];
  try {
    const admin = createAdminClient();
    const [reqs, resvs, sales] = await Promise.all([
      admin.from('reservation_requests').select('unit_id').in('status', ['pending', 'approved']).not('unit_id', 'is', null),
      (admin).from('reservations').select('reservation_request:reservation_requests!inner(unit_id)').eq('status', 'active'),
      admin.from('sales').select('unit_id').not('unit_id', 'is', null),
    ]);
    const idSet = new Set<string>();
    reqs.data?.forEach((r) => { if (r.unit_id) idSet.add(String(r.unit_id)); });
    resvs.data?.forEach((r) => {
      const uid = r.reservation_request?.unit_id;
      if (uid) idSet.add(String(uid));
    });
    sales.data?.forEach((s) => { if (s.unit_id) idSet.add(String(s.unit_id)); });
    crmReservedUnitIds = Array.from(idSet);
  } catch (err) {
    console.error('Error fetching CRM reserved unit IDs in AdminProjectsPage:', err);
  }

  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400"><LocalizedText text={"Cargando proyectos…"} /></div>}>
      <AdminProjectsManager
        projects={projects}
        projectTypologies={projectTypologies}
        orgSlug={currentUser?.organization.slug || 'default'}
        crmReservedUnitIds={crmReservedUnitIds}
      />
    </Suspense>
  );
}
