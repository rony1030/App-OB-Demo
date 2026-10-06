import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const IMPERSONATE_COOKIE = 'ob_impersonate_uid';
const IMPERSONATE_MEMBERSHIP_COOKIE = 'ob_impersonate_mid';
const ACTIVE_MEMBERSHIP_COOKIE = 'ob_active_membership_id';

export type AvailableMembership = {
  id: number;
  role: UserRole;
  isPrimary: boolean;
  organization: { id: number; name: string; slug: string; kind: string };
};

export type UserRole =
  | 'super_admin'
  | 'master_broker_admin'
  | 'master_broker_operations'
  | 'agency_admin'
  | 'agency_support'
  | 'broker_agent'
  | 'developer_admin'
  | 'developer_viewer'
  | 'support_auditor';

export type CurrentSessionUser = {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  professionalTitle: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  role: UserRole;
  realRole?: UserRole;
  isPreviewMode?: boolean;
  membershipId: number;
  availableMemberships: AvailableMembership[];
  organization: {
    id: number;
    name: string;
    slug: string;
    kind: string;
  };
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentUser(
  supabaseClient?: SupabaseServerClient
): Promise<CurrentSessionUser | null> {
  const cookieStoreForDemo = await cookies();
  const demoCookie = cookieStoreForDemo.get('demo_auth_session')?.value;
  if (demoCookie === 'soporte@osvaldobello.com' || process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'soporte@osvaldobello.com',
      displayName: 'Soporte OB Brokers',
      phone: '+1 809 000 0000',
      avatarUrl: null,
      professionalTitle: 'Master Broker Director',
      instagramUrl: null,
      facebookUrl: null,
      linkedinUrl: null,
      tiktokUrl: null,
      websiteUrl: null,
      role: 'super_admin',
      realRole: 'super_admin',
      isPreviewMode: false,
      membershipId: 1,
      availableMemberships: [
        {
          id: 1,
          role: 'super_admin',
          isPrimary: true,
          organization: { id: 1, name: 'Agentes Inmobiliarios', slug: 'agentes-inmobiliarios', kind: 'agency' },
        },
      ],
      organization: {
        id: 1,
        name: 'Agentes Inmobiliarios',
        slug: 'agentes-inmobiliarios',
        kind: 'agency',
      },
    };
  }

  // Standard Supabase Session. Keep this below the demo branch so demo routes
  // can resolve their local session without constructing a Supabase client.
  const supabase = supabaseClient ?? (await createClient());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, avatar_path, professional_title, locale, instagram_url, facebook_url, linkedin_url, tiktok_url, website_url')
    .eq('user_id', user.id)
    .single();

  // Fetch active membership and organization
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      id,
      role,
      status,
      is_primary,
      organization:organizations (
        id,
        name,
        slug,
        kind,
        status
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('is_primary', { ascending: false });

  const cookieStore = await cookies();
  const selectedMembershipId = Number(cookieStore.get(ACTIVE_MEMBERSHIP_COOKIE)?.value);
  const availableMemberships: AvailableMembership[] = (memberships ?? []).flatMap((entry) => {
    const organization = entry.organization as unknown as AvailableMembership['organization'] | null;
    return organization ? [{ id: entry.id, role: entry.role as UserRole, isPrimary: entry.is_primary, organization }] : [];
  });
  const membership = availableMemberships.find((entry) => entry.id === selectedMembershipId)
    ?? availableMemberships[0];

  // A user may be granted a reporting-only view without retaining an operational
  // organization membership. Keep that session scoped to the assigned master
  // broker and give it no commercial/admin capabilities.
  if (!membership) {
    const { data: reportingGrant } = await supabase
      .from('master_broker_reporting_access')
      .select('master_broker_organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (reportingGrant?.master_broker_organization_id) {
      const { data: reportingOrganization } = await supabase
        .from('organizations')
        .select('id, name, slug, kind, status')
        .eq('id', reportingGrant.master_broker_organization_id)
        .eq('kind', 'master_broker')
        .eq('status', 'active')
        .maybeSingle();
      if (reportingOrganization) {
        return {
          id: user.id,
          email: user.email ?? '',
          displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario',
          phone: profile?.phone ?? null,
          avatarUrl: profile?.avatar_path ?? null,
          professionalTitle: profile?.professional_title ?? null,
          instagramUrl: profile?.instagram_url ?? null,
          facebookUrl: profile?.facebook_url ?? null,
          linkedinUrl: profile?.linkedin_url ?? null,
          tiktokUrl: profile?.tiktok_url ?? null,
          websiteUrl: profile?.website_url ?? null,
          role: 'support_auditor',
          realRole: 'support_auditor',
          isPreviewMode: false,
          membershipId: 0,
          availableMemberships: [],
          organization: {
            id: reportingOrganization.id,
            name: reportingOrganization.name,
            slug: reportingOrganization.slug,
            kind: reportingOrganization.kind,
          },
        };
      }
    }
    return null;
  }

  const org = membership?.organization as {
    id: number;
    name: string;
    slug: string;
    kind: string;
  } | null;

  if (!membership || !org) {
    return null;
  }

  const email = user.email ?? '';
  const resolvedDisplayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    (email.includes('rony') ? 'Rony Abello' : email.split('@')[0] || 'Usuario');

  const actualRole = membership.role as UserRole;

  const baseUser: CurrentSessionUser = {
    id: user.id,
    email,
    displayName: resolvedDisplayName,
    phone: profile?.phone ?? null,
    avatarUrl: profile?.avatar_path ?? null,
    professionalTitle: profile?.professional_title ?? null,
    instagramUrl: profile?.instagram_url ?? null,
    facebookUrl: profile?.facebook_url ?? null,
    linkedinUrl: profile?.linkedin_url ?? null,
    tiktokUrl: profile?.tiktok_url ?? null,
    websiteUrl: profile?.website_url ?? null,
    role: actualRole,
    realRole: actualRole,
    isPreviewMode: false,
    membershipId: membership.id,
    availableMemberships,
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      kind: org.kind,
    },
  };

  if (actualRole !== 'super_admin') return baseUser;

  try {
    const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
    if (!impersonateId || impersonateId === user.id) return baseUser;

    const admin = createAdminClient();
    const { data: impProfile } = await admin
      .from('profiles')
      .select('display_name, phone, avatar_path, professional_title, instagram_url, facebook_url, linkedin_url, tiktok_url, website_url, email')
      .eq('user_id', impersonateId)
      .single();

    const { data: impMemberships } = await admin
      .from('memberships')
      .select('id, role, is_primary, organization:organizations(id, name, slug, kind)')
      .eq('user_id', impersonateId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false });

    const previewMemberships: AvailableMembership[] = (impMemberships ?? []).flatMap((entry) => {
      const organization = entry.organization as unknown as AvailableMembership['organization'] | null;
      return organization ? [{ id: entry.id, role: entry.role as UserRole, isPrimary: entry.is_primary, organization }] : [];
    });
    const previewMembershipId = Number(cookieStore.get(IMPERSONATE_MEMBERSHIP_COOKIE)?.value);
    const impMembership = previewMemberships.find((entry) => entry.id === previewMembershipId)
      ?? previewMemberships[0];

    if (!impMembership) return baseUser;

    const impOrg = impMembership.organization as unknown as { id: number; name: string; slug: string; kind: string } | null;
    if (!impOrg) return baseUser;

    return {
      id: impersonateId,
      email: impProfile?.email ?? '',
      displayName: impProfile?.display_name || impProfile?.email?.split('@')[0] || 'Usuario',
      phone: impProfile?.phone ?? null,
      avatarUrl: impProfile?.avatar_path ?? null,
      professionalTitle: impProfile?.professional_title ?? null,
      instagramUrl: impProfile?.instagram_url ?? null,
      facebookUrl: impProfile?.facebook_url ?? null,
      linkedinUrl: impProfile?.linkedin_url ?? null,
      tiktokUrl: impProfile?.tiktok_url ?? null,
      websiteUrl: impProfile?.website_url ?? null,
      role: impMembership.role as UserRole,
      realRole: actualRole,
      isPreviewMode: true,
      membershipId: impMembership.id,
      availableMemberships: previewMemberships,
      organization: {
        id: impOrg.id,
        name: impOrg.name,
        slug: impOrg.slug,
        kind: impOrg.kind,
      },
    };
  } catch {
    return baseUser;
  }
}
