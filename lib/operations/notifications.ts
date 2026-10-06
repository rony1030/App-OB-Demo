import { createAdminClient } from '@/lib/supabase/admin';

const emailPattern = /^\S+@\S+\.\S+$/;

export function uniqueEmails(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim().toLowerCase() || '').filter((value) => emailPattern.test(value)))];
}

export async function getOperationalRecipientEmails(organizationId: number) {
  const admin = createAdminClient();
  const { data } = await (admin).from('reservation_notification_recipients').select('email').eq('organization_id', organizationId).eq('is_active', true);
  return uniqueEmails((data || []).map((item: { email?: string }) => item.email));
}

export async function getProjectNotificationChannels(projectId: number) {
  const admin = createAdminClient();
  const { data: project } = await admin.from('projects').select('organization_id').eq('id', projectId).maybeSingle();
  if (!project) return null;
  const { data: settings } = await (admin)
    .from('reservation_workflow_settings')
    .select('crm_notifications_enabled, email_notifications_enabled')
    .eq('master_broker_organization_id', project.organization_id)
    .or(`project_id.eq.${projectId},project_id.is.null`)
    .order('project_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return {
    organizationId: project.organization_id,
    crmEnabled: settings?.crm_notifications_enabled ?? true,
    emailEnabled: settings?.email_notifications_enabled ?? true,
  };
}

export async function notifyOperationalInbox({ organizationId, emails, type, title, body, link }: { organizationId: number; emails: string[]; type: string; title: string; body: string; link: string }) {
  const recipientEmails = uniqueEmails(emails);
  if (!recipientEmails.length) return;
  const admin = createAdminClient();
  const { data: profiles } = await admin.from('profiles').select('user_id, email').in('email', recipientEmails);
  const userIds = (profiles || []).map((profile) => profile.user_id);
  if (!userIds.length) return;
  const { data: memberships } = await admin.from('memberships').select('id, user_id').eq('organization_id', organizationId).eq('status', 'active').in('user_id', userIds);
  if (!(memberships || []).length) return;
  await admin.from('notifications').insert((memberships || []).map((membership) => ({ organization_id: organizationId, membership_id: membership.id, type, title, body, link })));
}

export async function notifyMembership({ organizationId, membershipId, type, title, body, link }: { organizationId: number; membershipId: number | null | undefined; type: string; title: string; body: string; link: string }) {
  if (!membershipId) return;
  const admin = createAdminClient();
  await admin.from('notifications').insert({ organization_id: organizationId, membership_id: membershipId, type, title, body, link });
}
