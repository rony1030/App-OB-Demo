'use server';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMagicLinkEmail } from '@/lib/email/mailer';
import { resolvePublicAppOrigin } from '@/lib/auth/app-origin';

export type MagicLinkState = {
  success?: boolean;
  error?: string;
  email?: string;
};

export async function requestMagicLinkAction(
  _prevState: MagicLinkState | null,
  formData: FormData
): Promise<MagicLinkState> {
  try {
    const rawEmail = formData.get('email');
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { error: 'Por favor, ingresa un correo electrónico válido.' };
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('user_id, email, display_name')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('magic profile lookup error:', profileError.message);
      return { error: 'No pudimos verificar la cuenta. Intenta nuevamente en unos minutos.' };
    }

    if (!profile?.user_id) {
      return {
        success: true,
        email,
      };
    }

    const { data: activeMembership, error: membershipError } = await admin
      .from('memberships')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error('magic membership lookup error:', membershipError.message);
      return { error: 'No pudimos verificar la membresía. Intenta nuevamente en unos minutos.' };
    }

    if (!activeMembership) {
      return {
        success: true,
        email,
      };
    }

    const hdrs = await headers();
    const origin = resolvePublicAppOrigin({
      configuredOrigin: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL,
      requestOrigin: hdrs.get('origin'),
      forwardedHost: hdrs.get('x-forwarded-host') || hdrs.get('host'),
      forwardedProto: hdrs.get('x-forwarded-proto'),
      environment: process.env.NODE_ENV,
    });

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      // Magic links return the session in the URL hash, so land on the
      // client-side login screen where the hash can be consumed safely.
      options: { redirectTo: `${origin}/login` },
    });

    if (error || !link?.properties?.action_link) {
      console.error('generate magic link error:', error?.message);
      return { error: 'No pudimos enviar el enlace de acceso. Intenta nuevamente.' };
    }

    const magicUrl = new URL(link.properties.action_link);
    magicUrl.searchParams.set('redirect_to', `${origin}/login`);

    await sendMagicLinkEmail({
      to: email,
      name: profile.display_name || 'Hola',
      magicUrl: magicUrl.toString(),
    });

    return {
      success: true,
      email,
    };
  } catch (err: unknown) {
    console.error('requestMagicLinkAction error:', err);
    return {
      error: 'No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.',
    };
  }
}
