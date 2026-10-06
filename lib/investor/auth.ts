import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { mailer, SMTP_CONFIG } from '@/lib/email/mailer';
import { updateDemoState } from '@/lib/demo/local-store';
import { DEMO_CLIENTS } from '@/lib/data/investor-demo';

export const INVESTOR_SESSION_COOKIE = 'ob_inv_session';
export const INVESTOR_DEMO_COOKIE = 'ob_inv_demo_access';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_PER_15_MIN = 3;

// Clean alphanumeric character set avoiding easily confused glyphs (0, O, I, 1)
const OTP_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function hashValue(raw: string): string {
  return createHash('sha256').update(raw.trim()).digest('hex');
}

export function generateOtpCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += OTP_CHARS[bytes[i] % OTP_CHARS.length];
  }
  return code;
}

export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? '';
    return forwarded.split(',')[0].trim() || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

export async function getUserAgent(): Promise<string> {
  try {
    const h = await headers();
    return (h.get('user-agent') ?? 'unknown').slice(0, 250);
  } catch {
    return 'unknown';
  }
}

export interface InvestorAuthSession {
  sessionId: string;
  contactId: number;
  email: string;
  publicCode: string;
  fullName: string;
}

/**
 * Normaliza un email eliminando espacios y convirtiéndolo a minúsculas.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valida si un email tiene formato válido estándar.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Envía un código OTP al correo del inversionista si existe un contacto con ese correo.
 * Por seguridad y privacidad:
 * 1. Los perfiles demo NUNCA se admiten en el login normal.
 * 2. Si el correo no existe en `contacts`, se retorna un mensaje genérico sin filtrar la existencia.
 * 3. Se limita la frecuencia de solicitudes a máximo 3 cada 15 minutos por correo o IP.
 */
export async function requestInvestorOtp(rawEmail: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Por favor ingrese un correo electrónico válido.' };
  }

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const client = DEMO_CLIENTS.find((entry) => entry.email.toLowerCase() === email);
    if (!client) return { ok: false, error: 'No encontramos un perfil demo con ese correo. Pruebe Carlos, Elena o Roberto desde “Ver modo demostración”.' };
    const code = 'DEMO26';
    await updateDemoState((state) => {
      state.investorOtps[email] = { code, expiresAt: Date.now() + OTP_TTL_MS };
      state.investors[client.code] ??= { email, session: false, paymentReports: [] };
    });
    return { ok: true, message: 'Código de demostración: DEMO26 (no se envió ningún correo).' };
  }

  // Comprobar que no sea un correo ficticio de demo
  if (email.endsWith('@demoinversionista.com') || email.includes('demo')) {
    return {
      ok: false,
      error: 'Este correo no está registrado en el portal. Si busca las demostraciones, use la ruta de demo.',
    };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient() as any;
  const clientIp = await getClientIp();

  // Rate limiting check: max 3 requests in the last 15 minutes for this email or IP
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recentChallenges } = await admin
    .from('investor_otp_challenges')
    .select('id')
    .or(`email.eq.${email},client_ip.eq.${clientIp}`)
    .gte('created_at', fifteenMinutesAgo);

  if (recentChallenges && recentChallenges.length >= MAX_REQUESTS_PER_15_MIN) {
    return {
      ok: false,
      error: 'Ha solicitado varios códigos recientemente. Por favor espere unos minutos antes de intentar de nuevo.',
    };
  }

  // Buscar contacto activo registrado con este correo
  const { data: contact } = await admin
    .from('contacts')
    .select('id, first_name, last_name, email, public_code')
    .eq('email', email)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contact) {
    // Si no existe, no creamos OTP pero devolvemos mensaje seguro
    return {
      ok: false,
      error: 'No encontramos un expediente registrado con este correo electrónico. Por favor contacte a su asesor.',
    };
  }

  const code = generateOtpCode(6);
  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Invalidar desafíos previos no consumidos de este contacto/correo
  await admin
    .from('investor_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('contact_id', contact.id)
    .is('consumed_at', null);

  // Registrar nuevo desafío
  const { error: insertError } = await admin.from('investor_otp_challenges').insert({
    email,
    contact_id: contact.id,
    code_hash: codeHash,
    attempts: 0,
    max_attempts: MAX_VERIFY_ATTEMPTS,
    expires_at: expiresAt,
    client_ip: clientIp,
  });

  if (insertError) {
    console.error('[requestInvestorOtp] insert challenge error:', insertError);
    return { ok: false, error: 'Hubo un error al generar su código. Intente de nuevo más tarde.' };
  }

  // Enviar correo con el código OTP
  const fullName = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'Inversionista';
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Código de acceso al portal de inversionistas</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden">
    <div style="background:#0C094E;padding:32px;text-align:center;color:#fff">
      <h1 style="margin:0;font-size:20px;font-weight:700">OB Brokers · Portal de Inversionistas</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5">Hola, <strong>${fullName}</strong>:</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6">
        Recibimos una solicitud para acceder a su portal de inversiones y seguimiento de inmuebles. Use el siguiente código de confirmación:
      </p>
      <div style="text-align:center;margin:28px 0;background:#f1f5f9;border-radius:12px;padding:20px;border:1px dashed #cbd5e1">
        <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#0C094E;font-family:monospace">${code}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b">
        • Este código es de un solo uso y vencerá en <strong>10 minutos</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#64748b">
        • Si usted no solicitó este acceso, puede ignorar este mensaje de forma segura.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
      <p style="margin:0;font-size:11px;color:#94a3b8">Bello Valdez Enterprise · OB Brokers Team</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await mailer.sendMail({
      from: SMTP_CONFIG.from,
      to: email,
      subject: `${code} es su código de acceso · Portal de Inversionistas OB Brokers`,
      html,
    });
    return { ok: true, message: 'Le enviamos un código de 6 caracteres a su correo electrónico.' };
  } catch (err) {
    console.error('[requestInvestorOtp] sendMail error:', err);
    return {
      ok: false,
      error: 'No se pudo enviar el correo con el código. Verifique su conexión o contacte a su asesor.',
    };
  }
}

/**
 * Verifica el código OTP de 6 caracteres y crea una sesión segura en HTTP-only cookie.
 */
export async function verifyInvestorOtp(
  rawEmail: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string; publicCode?: string }> {
  const email = normalizeEmail(rawEmail);
  const cleanCode = rawCode.trim().toUpperCase();

  if (!email || !cleanCode) {
    return { ok: false, error: 'Ingrese el correo y el código de verificación.' };
  }

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const match = DEMO_CLIENTS.find((entry) => entry.email.toLowerCase() === email);
    if (!match) return { ok: false, error: 'El correo no corresponde a un perfil demo.' };
    const cookieStore = await cookies();
    const valid = await updateDemoState((state) => {
      const challenge = state.investorOtps[email];
      if (!challenge || challenge.expiresAt < Date.now() || challenge.code !== cleanCode) return false;
      delete state.investorOtps[email];
      state.investors[match.code] = { email, session: true, paymentReports: state.investors[match.code]?.paymentReports ?? [] };
      return true;
    });
    if (!valid) return { ok: false, error: 'Código demo incorrecto o expirado. Solicite otro.' };
    cookieStore.set(INVESTOR_SESSION_COOKIE, `demo:${match.code}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 });
    await updateDemoState((state) => { state.investorSession = { code: match.code, email }; });
    return { ok: true, publicCode: match.code };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient() as any;
  const nowIso = new Date().toISOString();

  // Buscar el desafío activo más reciente para este correo
  const { data: challenge } = await admin
    .from('investor_otp_challenges')
    .select('id, contact_id, code_hash, attempts, max_attempts, expires_at, consumed_at')
    .eq('email', email)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge) {
    return {
      ok: false,
      error: 'El código ha expirado o no es válido. Por favor solicite uno nuevo.',
    };
  }

  // Verificar si se excedió el número de intentos
  if (challenge.attempts >= challenge.max_attempts) {
    await admin
      .from('investor_otp_challenges')
      .update({ consumed_at: nowIso })
      .eq('id', challenge.id);
    return {
      ok: false,
      error: 'Ha superado el número máximo de intentos para este código. Por favor solicite uno nuevo.',
    };
  }

  const inputHash = hashValue(cleanCode);
  if (inputHash !== challenge.code_hash) {
    // Incrementar contador de intentos fallidos
    const nextAttempts = challenge.attempts + 1;
    await admin
      .from('investor_otp_challenges')
      .update({
        attempts: nextAttempts,
        consumed_at: nextAttempts >= challenge.max_attempts ? nowIso : null,
      })
      .eq('id', challenge.id);

    const remaining = challenge.max_attempts - nextAttempts;
    return {
      ok: false,
      error:
        remaining > 0
          ? `Código incorrecto. Le quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`
          : 'Código incorrecto. Ha agotado sus intentos; solicite un código nuevo.',
    };
  }

  // Código correcto: marcar desafío como consumido
  await admin
    .from('investor_otp_challenges')
    .update({ consumed_at: nowIso })
    .eq('id', challenge.id);

  // Obtener información del contacto vinculado
  const { data: contact } = await admin
    .from('contacts')
    .select('id, public_code')
    .eq('id', challenge.contact_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!contact) {
    return { ok: false, error: 'No se encontró el expediente del contacto.' };
  }

  // Generar token de sesión seguro (32 bytes aleatorios)
  const sessionToken = randomBytes(32).toString('hex');
  const tokenHash = hashValue(sessionToken);
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const clientIp = await getClientIp();
  const userAgent = await getUserAgent();

  const { error: sessionError } = await admin.from('investor_sessions').insert({
    contact_id: contact.id,
    token_hash: tokenHash,
    email,
    expires_at: sessionExpiresAt,
    user_agent: userAgent,
    ip_address: clientIp,
  });

  if (sessionError) {
    console.error('[verifyInvestorOtp] create session error:', sessionError);
    return { ok: false, error: 'Error al iniciar su sesión segura. Intente nuevamente.' };
  }

  // Guardar cookie HTTP-only segura
  const cookieStore = await cookies();
  cookieStore.set(INVESTOR_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  });

  return { ok: true, publicCode: contact.public_code };
}

/**
 * Valida la cookie de sesión del inversionista y retorna la información del contacto autenticado.
 */
export async function getAuthenticatedInvestorSession(): Promise<InvestorAuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(INVESTOR_SESSION_COOKIE)?.value;
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const { readDemoState } = await import('@/lib/demo/local-store');
    const active = (await readDemoState()).investorSession;
    if (!active) return null;
    const demoClient = DEMO_CLIENTS.find((entry) => entry.code === active.code);
    return demoClient ? { sessionId: `demo-${demoClient.id}`, contactId: demoClient.id, email: active.email, publicCode: demoClient.code, fullName: demoClient.fullName } : null;
  }
  if (!token) return null;

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' && token.startsWith('demo:')) {
    const client = DEMO_CLIENTS.find((entry) => entry.code === token.slice(5));
    if (!client) return null;
    return { sessionId: `demo-${client.id}`, contactId: client.id, email: client.email, publicCode: client.code, fullName: client.fullName };
  }
  if (token.length < 32) return null;

  const tokenHash = hashValue(token);
  const nowIso = new Date().toISOString();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient() as any;
  const { data: session } = await admin
    .from('investor_sessions')
    .select(`
      id,
      contact_id,
      email,
      expires_at,
      revoked_at,
      contacts:contact_id (
        id,
        first_name,
        last_name,
        public_code,
        deleted_at
      )
    `)
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .maybeSingle();

  if (!session || !session.contacts || session.contacts.deleted_at) {
    return null;
  }

  // Actualizar last_seen_at periódicamente en segundo plano
  admin
    .from('investor_sessions')
    .update({ last_seen_at: nowIso })
    .eq('id', session.id)
    .then(() => {});

  const c = session.contacts;
  const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Inversionista';

  return {
    sessionId: session.id,
    contactId: Number(session.contact_id),
    email: session.email,
    publicCode: c.public_code,
    fullName,
  };
}

/**
 * Cierra la sesión activa revocándola en base de datos y borrando la cookie.
 */
export async function logoutInvestor(): Promise<void> {
  const cookieStore = await cookies();
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    await updateDemoState((state) => { state.investorSession = null; });
    cookieStore.delete(INVESTOR_SESSION_COOKIE);
    return;
  }
  const token = cookieStore.get(INVESTOR_SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashValue(token);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient() as any;
    await admin
      .from('investor_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);
  }

  cookieStore.delete(INVESTOR_SESSION_COOKIE);
}

/**
 * Valida si el código de acceso para demostración es correcto.
 */
export function checkDemoAccessCode(inputCode: string): boolean {
  const expected = (process.env.INVESTOR_DEMO_ACCESS_CODE || 'DEMO2026').trim();
  return inputCode.trim() === expected;
}

/**
 * Comprueba si la cookie de acceso a demostraciones está presente y es válida.
 */
export async function hasDemoAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const val = cookieStore.get(INVESTOR_DEMO_COOKIE)?.value;
  if (!val) return false;
  const expected = (process.env.INVESTOR_DEMO_ACCESS_CODE || 'DEMO2026').trim();
  return val === hashValue(expected);
}

/**
 * Habilita el acceso a demostraciones guardando una cookie HTTP-only con el hash del código.
 */
export async function grantDemoAccess(inputCode: string): Promise<boolean> {
  if (!checkDemoAccessCode(inputCode)) return false;
  const expected = (process.env.INVESTOR_DEMO_ACCESS_CODE || 'DEMO2026').trim();
  const cookieStore = await cookies();
  cookieStore.set(INVESTOR_DEMO_COOKIE, hashValue(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  });
  return true;
}
