import PortalShell from '@/components/portal/PortalShell';
import { BrandProvider } from '@/components/branding/BrandProvider';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import { DEFAULT_BRAND, type BrandTheme } from '@/types/branding';
import { redirect } from 'next/navigation';
import { getActiveMarketingOffers } from '@/lib/data/marketing-offers';
import { getReportingOrganizations } from '@/lib/data/project-reporting';

function resolveBrandAsset(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')) return value;
  return getPublicAssetUrl(value);
}

async function getPortalBrandTheme(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<BrandTheme> {
  if (!currentUser) return DEFAULT_BRAND;

  const { data: brandRow } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('organization_id', currentUser.organization.id)
    .eq('is_default', true)
    .maybeSingle();

  const organizationName = currentUser.organization.name || DEFAULT_BRAND.name;

  if (!brandRow) {
    return {
      ...DEFAULT_BRAND,
      name: organizationName,
      company_legal_name: organizationName,
    };
  }

  const brand = brandRow as typeof brandRow & { website?: string; address?: string };
  const logoUrl = resolveBrandAsset(brand.logo_path, DEFAULT_BRAND.logo_url);

  return {
    ...DEFAULT_BRAND,
    id: String(brand.id),
    name: brand.name || organizationName,
    company_legal_name: brand.name || organizationName,
    logo_url: logoUrl,
    logo_dark_url: resolveBrandAsset(brand.logo_dark_path, logoUrl),
    primary_color: brand.primary_color || DEFAULT_BRAND.primary_color,
    secondary_color: brand.secondary_color || DEFAULT_BRAND.secondary_color,
    accent_color: brand.accent_color || DEFAULT_BRAND.accent_color,
    surface_color: brand.surface_color || DEFAULT_BRAND.surface_color,
    contact_email: brand.contact_email || DEFAULT_BRAND.contact_email,
    contact_phone: brand.contact_phone || DEFAULT_BRAND.contact_phone,
    whatsapp_number: brand.whatsapp_number || DEFAULT_BRAND.whatsapp_number,
    website: brand.website || undefined,
    address: brand.address || undefined,
  };
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (currentUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if ((profile as { must_change_password?: boolean } | null)?.must_change_password) {
      redirect('/auth/update-password?required=1');
    }
  }
  const [brandTheme, marketingOffers, reportingOrganizations] = await Promise.all([
    getPortalBrandTheme(supabase, currentUser),
    currentUser ? getActiveMarketingOffers() : Promise.resolve([]),
    currentUser ? getReportingOrganizations(currentUser) : Promise.resolve([]),
  ]);

  return (
    <BrandProvider initialTheme={brandTheme}>
      <PortalShell currentUser={currentUser} marketingOffers={marketingOffers} hasMasterReporting={reportingOrganizations.length > 0}>{children}</PortalShell>
    </BrandProvider>
  );
}
