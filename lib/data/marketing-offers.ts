import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getPublicAssetUrl } from '@/lib/supabase/storage';

export type MarketingOfferType = 'discount' | 'promotion';
export type MarketingOfferStatus = 'draft' | 'active' | 'paused' | 'archived';
export type MarketingOfferPlacement = 'header_banner' | 'side_card' | 'popup' | 'fullscreen';

export type MarketingOffer = {
  id: number;
  organizationId: number;
  title: string;
  offerType: MarketingOfferType;
  description: string;
  promotionText: string | null;
  discountPercent: number | null;
  bannerPath: string | null;
  bannerUrl: string | null;
  displayPlacement: MarketingOfferPlacement;
  status: MarketingOfferStatus;
  startsAt: string;
  endsAt: string;
  priority: number;
  requiresOptIn: boolean;
  projectIds: number[];
};

type OfferRow = {
  id: number;
  organization_id: number;
  title: string;
  offer_type: string;
  description: string;
  promotion_text: string | null;
  discount_percent: number | null;
  banner_path: string | null;
  display_placement: string;
  status: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  requires_opt_in: boolean;
};

function resolveBanner(path: string | null) {
  if (!path) return null;
  if (/^(https?:|data:|\/)/i.test(path)) return path;
  return getPublicAssetUrl(path);
}

function normalizeOffer(row: OfferRow, projectIds: number[]): MarketingOffer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    offerType: row.offer_type as MarketingOfferType,
    description: row.description,
    promotionText: row.promotion_text,
    discountPercent: row.discount_percent === null ? null : Number(row.discount_percent),
    bannerPath: row.banner_path,
    bannerUrl: resolveBanner(row.banner_path),
    displayPlacement: row.display_placement as MarketingOfferPlacement,
    status: row.status as MarketingOfferStatus,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: row.priority,
    requiresOptIn: row.requires_opt_in,
    projectIds,
  };
}

async function projectIdsByOffer(offerIds: number[], client?: Awaited<ReturnType<typeof createClient>>) {
  if (!offerIds.length) return new Map<number, number[]>();
  const db = client || (await createClient());
  const { data } = await db
    .from('marketing_offer_projects')
    .select('offer_id, project_id')
    .in('offer_id', offerIds);

  const map = new Map<number, number[]>();
  for (const row of data || []) {
    map.set(row.offer_id, [...(map.get(row.offer_id) || []), row.project_id]);
  }
  return map;
}

export async function getMarketingOffersForAdmin(): Promise<MarketingOffer[]> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return [];

  const admin = createAdminClient();
  let query = admin
    .from('marketing_offers')
    .select('id, organization_id, title, offer_type, description, promotion_text, discount_percent, banner_path, display_placement, status, starts_at, ends_at, priority, requires_opt_in')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (user.role !== 'super_admin') {
    query = query.eq('organization_id', user.organization.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  const links = await projectIdsByOffer(data.map((row) => row.id), admin);
  return data.map((row) => normalizeOffer(row, links.get(row.id) || []));
}

export async function getActiveMarketingOffersForProject(projectId: number): Promise<MarketingOffer[]> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return [];
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: links, error: linksError } = await supabase
    .from('marketing_offer_projects')
    .select('offer_id, project_id')
    .eq('project_id', projectId);

  if (linksError || !links?.length) return [];
  const { data, error } = await supabase
    .from('marketing_offers')
    .select('id, organization_id, title, offer_type, description, promotion_text, discount_percent, banner_path, display_placement, status, starts_at, ends_at, priority, requires_opt_in')
    .in('id', links.map((row) => row.offer_id))
    .eq('status', 'active')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('priority', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => normalizeOffer(row, [projectId]));
}

export async function getActiveMarketingOffers(): Promise<MarketingOffer[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('marketing_offers')
    .select('id, organization_id, title, offer_type, description, promotion_text, discount_percent, banner_path, display_placement, status, starts_at, ends_at, priority, requires_opt_in')
    .eq('status', 'active')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('priority', { ascending: false })
    .limit(6);

  if (error || !data) return [];
  const links = await projectIdsByOffer(data.map((row) => row.id));
  return data.map((row) => normalizeOffer(row, links.get(row.id) || []));
}
