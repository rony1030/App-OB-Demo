import { createClient } from '@/lib/supabase/server';

export type AuditEvent = {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  occurredAt: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
};

export async function getAuditEvents(organizationId: number, limit = 50): Promise<AuditEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('audit_events')
    .select('id, action, entity_type, entity_id, occurred_at, actor_user_id, metadata')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_user_id).filter(Boolean))) as string[];
  const profileByUserId = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', actorIds);
    for (const p of profiles ?? []) profileByUserId.set(p.user_id, p.display_name);
  }

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    occurredAt: r.occurred_at,
    actorName: r.actor_user_id ? profileByUserId.get(r.actor_user_id) ?? null : null,
    metadata: r.metadata as Record<string, unknown> | null,
  }));
}
