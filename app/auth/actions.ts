'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAccessRequestReceivedEmail, sendBrokerAccessReviewEmail, sendPasswordSetupEmail } from '@/lib/email/mailer';
import { resolvePublicAppOrigin } from '@/lib/auth/app-origin';

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '').trim();
  const next = formData.get('next') as string;

  if (!email || !password) {
    return { error: 'Por favor, ingresa tu correo y contraseña.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
          : error.message,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (!membership) {
    await supabase.auth.signOut();
    return {
      error: 'Esta cuenta no tiene una membresía activa. Usa tu cuenta autorizada o solicita acceso.',
    };
  }

  revalidatePath('/', 'layout');
  const target = next && next.startsWith('/portal') ? next : '/portal';
  redirect(target);
}

export async function requestPasswordResetAction(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { error: 'Ingresa tu correo electrónico.' };

  const hdrs = await headers();
  const origin = resolvePublicAppOrigin({
    configuredOrigin: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL,
    requestOrigin: hdrs.get('origin'),
    forwardedHost: hdrs.get('x-forwarded-host') || hdrs.get('host'),
    forwardedProto: hdrs.get('x-forwarded-proto'),
    environment: process.env.NODE_ENV,
  });

  // Preserve the non-enumeration response while routing delivery through the
  // same configured SMTP provider as every other application email.
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('user_id, display_name')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (profile?.user_id) {
      const { data: link, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${origin}/auth/update-password` },
      });
      if (error || !link?.properties?.action_link) {
        console.error('generate recovery link error:', error?.message);
      } else {
        await sendPasswordSetupEmail({
          to: email,
          setupUrl: link.properties.action_link,
          organizationName: 'OB Brokers Team',
          recipientName: profile.display_name || 'Hola',
        });
      }
    }
  } catch (error) {
    console.error('custom password reset email failed:', error);
  }

  // Always report success: never reveal whether an email is registered.
  return { success: true };
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('ob_preview_role');
  } catch {
    // Ignore if cookies() not available
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function togglePreviewRoleAction(roleToSet?: 'broker_agent' | null) {
  const cookieStore = await cookies();
  if (roleToSet === 'broker_agent') {
    cookieStore.set('ob_preview_role', 'broker_agent', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  } else {
    cookieStore.delete('ob_preview_role');
  }
  revalidatePath('/', 'layout');
}

export async function requestAccessAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const fullName = String(formData.get('fullName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const agency = String(formData.get('agency') || '').trim();
  const roleType = String(formData.get('roleType') || 'Broker inmobiliario').trim();
  const projectInterest = String(formData.get('projectInterest') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!fullName || !email || !phone) {
    return { error: 'Nombre completo, correo y teléfono son obligatorios.' };
  }

  // The browser never receives permission to invoke the privileged RPC.
  // This Server Action validates the form and calls it with server-only credentials.
  const { error } = await createAdminClient().rpc('submit_broker_access_request', {
    full_name: fullName,
    email,
    phone,
    agency,
    role_type: roleType,
    project_interest: projectInterest,
    message,
  });

  if (error) {
    return { error: 'No pudimos registrar tu solicitud. Intenta de nuevo en unos minutos.' };
  }

  const headerStore = await headers();
  const origin = resolvePublicAppOrigin({
    requestOrigin: headerStore.get('origin'),
    forwardedHost: headerStore.get('x-forwarded-host') || headerStore.get('host'),
    forwardedProto: headerStore.get('x-forwarded-proto'),
    environment: process.env.NODE_ENV,
  });

  try {
    await sendAccessRequestReceivedEmail({
      to: email,
      fullName,
      roleType,
      agency,
    });
  } catch (mailError) {
    console.warn('sendAccessRequestReceivedEmail warning:', mailError);
    return { error: 'Registramos la solicitud, pero no pudimos enviar el correo de confirmación.' };
  }

  try {
    await sendBrokerAccessReviewEmail({
      fullName,
      email,
      phone,
      agency,
      roleType,
      projectInterest,
      message,
      reviewUrl: `${origin}/portal/admin/broker-requests`,
    });
  } catch (mailError) {
    console.warn('sendBrokerAccessReviewEmail warning:', mailError);
  }

  return { success: true };
}
