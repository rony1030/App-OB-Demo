export type DemoBrowserOpportunity = {
  contactId: number;
  id: number;
  publicCode: string;
  stage: string;
  priority: string;
  projectIds: number[];
  createdAt: string;
};

const STORAGE_KEY = 'ob-demo.crm.v1';

export function getDemoBrowserOpportunities(): DemoBrowserOpportunity[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as { opportunities?: unknown };
    return Array.isArray(parsed.opportunities) ? parsed.opportunities as DemoBrowserOpportunity[] : [];
  } catch {
    return [];
  }
}

export function saveDemoBrowserOpportunity(opportunity: DemoBrowserOpportunity): void {
  if (typeof window === 'undefined') return;
  const opportunities = getDemoBrowserOpportunities().filter((item) => item.id !== opportunity.id);
  opportunities.unshift(opportunity);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ opportunities }));
}
