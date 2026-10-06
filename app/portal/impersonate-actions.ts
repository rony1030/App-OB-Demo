'use server';

import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const IMPERSONATE_COOKIE = 'ob_impersonate_uid';
const IMPERSONATE_MEMBERSHIP_COOKIE = 'ob_impersonate_mid';
const ACTIVE_MEMBERSHIP_COOKIE = 'ob_active_membership_id';

export async function searchUsersForImpersonation(query: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.realRole !== 'super_admin') {
    return { error: 'Sin permisos', users: [] };
  }

  if (!query || query.trim().length < 2) {
    return { error: null, users: [] };
  }

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from('memberships')
    .select('id, user_id, role, status, organization:organizations(id, name, slug, kind)')
    .eq('status', 'active')
    .order('id')
    .limit(500);

  if (!memberships || memberships.length === 0) {
    return { error: null, users: [] };
  }

  const userIds = memberships.map((m) => m.user_id);

  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, display_name, email')
    .in('user_id', userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  type ResultUser = {
    userId: string;
    displayName: string;
    email: string;
    memberships: { id: number; role: string; orgName: string; orgSlug: string }[];
  };

  const results = new Map<string, ResultUser>();

  for (const m of memberships) {
    const profile = profileMap.get(m.user_id);
    const org = m.organization as unknown as { id: number; name: string; slug: string; kind: string } | null;
    const displayName = profile?.display_name || '';
    const email = profile?.email || '';
    const orgName = org?.name || '';

    const result = results.get(m.user_id) ?? {
      userId: m.user_id,
      displayName: displayName || email.split('@')[0] || 'Sin nombre',
      email,
      memberships: [],
    };
    result.memberships.push({ id: m.id, role: m.role, orgName, orgSlug: org?.slug || '' });
    results.set(m.user_id, result);
  }

  const needle = query.trim().toLowerCase();
  return { error: null, users: [...results.values()]
    .filter((person) => `${person.displayName} ${person.email} ${person.memberships.map((entry) => entry.orgName).join(' ')}`.toLowerCase().includes(needle))
    .slice(0, 20) };
}

export async function startImpersonation(targetUserId: string, membershipId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.realRole !== 'super_admin') {
    return { error: 'Sin permisos' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || targetUserId === user.id) {
    return { error: 'No puedes impersonarte a ti mismo' };
  }

  const admin = createAdminClient();
  const { data: membership } = await admin.from('memberships')
    .select('id').eq('id', membershipId).eq('user_id', targetUserId).eq('status', 'active').maybeSingle();
  if (!membership) return { error: 'Ese acceso ya no está disponible' };

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4,
  });
  cookieStore.set(IMPERSONATE_MEMBERSHIP_COOKIE, String(membershipId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 60 * 60 * 4,
  });

  return { error: null };
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  cookieStore.delete(IMPERSONATE_MEMBERSHIP_COOKIE);
  return { error: null };
}

export async function switchMembership(membershipId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Inicia sesión de nuevo' };
  const { data: membership } = await supabase.from('memberships')
    .select('id').eq('id', membershipId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!membership) return { error: 'Ese acceso no pertenece a tu cuenta' };
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MEMBERSHIP_COOKIE, String(membershipId), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  return { error: null };
}
