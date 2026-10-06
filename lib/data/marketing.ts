import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type MarketingStats = {
  masterBrokerCount: number;
  projectCount: number;
};

/**
 * Public landing page stats. Deliberately reads only `projects` (already
 * open to `anon` via the projects_anon_catalog RLS policy) instead of
 * querying `organizations` directly — anon read access on organizations is
 * scoped narrowly to developer orgs with a published project, not master
 * brokers, so counting distinct owning orgs from the projects table avoids
 * needing a new RLS policy just for a trust-stat counter.
 */
export async function getMarketingStats(): Promise<MarketingStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('publication_status', 'published');

  if (error || !data) return { masterBrokerCount: 0, projectCount: 0 };

  return {
    masterBrokerCount: new Set(data.map((row) => row.organization_id)).size,
    projectCount: data.length,
  };
}
