import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendProjectInquiryEmail } from '@/lib/email/mailer';
import { uniqueEmails } from '@/lib/operations/notifications';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TERMS_VERSION = 'project-inquiry-v1';

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().replace(/\0/g, '').slice(0, maxLength) : '';
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ error: 'La solicitud es demasiado extensa.' }, { status: 413 });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
    }
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 20_000) {
      return NextResponse.json({ error: 'La solicitud es demasiado extensa.' }, { status: 413 });
    }
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  // Honeypot: acknowledge automated submissions without storing or emailing.
  if (cleanText(body.website, 200)) {
    return NextResponse.json({ success: true, reference: 'SOL-RECIBIDA' });
  }

  const submissionId = cleanText(body.submissionId, 40);
  const projectId = Number(body.projectId);
  const projectSlug = cleanText(body.projectSlug, 120);
  const requestType = body.requestType === 'site_visit' ? 'site_visit' : body.requestType === 'information' ? 'information' : '';
  const fullName = cleanText(body.fullName, 160);
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 254).toLowerCase();
  const profileType = body.profileType === 'agency' ? 'agency' : body.profileType === 'independent_broker' ? 'independent_broker' : '';
  const agencyName = cleanText(body.agencyName, 180);
  const typology = cleanText(body.typology, 180);
  const message = cleanText(body.message, 3000);
  const locale = body.locale === 'en' || body.locale === 'fr' ? body.locale : 'es';
  const acceptedTerms = body.acceptedTerms === true;

  const phoneDigits = phone.replace(/\D/g, '');
  if (!UUID_PATTERN.test(submissionId) || !Number.isInteger(projectId) || projectId <= 0 || !projectSlug) {
    return NextResponse.json({ error: 'No pudimos identificar el proyecto.' }, { status: 400 });
  }
  if (!requestType || fullName.length < 3 || phoneDigits.length < 8 || phoneDigits.length > 16 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Completa correctamente nombre, teléfono, correo y tipo de solicitud.' }, { status: 400 });
  }
  if (!profileType || (profileType === 'agency' && agencyName.length < 2)) {
    return NextResponse.json({ error: 'Indica si representas una agencia o trabajas de forma independiente.' }, { status: 400 });
  }
  if (!acceptedTerms) {
    return NextResponse.json({ error: 'Debes aceptar los términos y el tratamiento de tus datos.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const untypedAdmin = admin as unknown as SupabaseClient;
  const { data: project } = await admin
    .from('projects')
    .select('id, name, slug, organization_id')
    .eq('id', projectId)
    .eq('slug', projectSlug)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: 'El proyecto ya no está disponible.' }, { status: 404 });

  const inquiries = untypedAdmin.from('project_inquiries');
  const { data: existing } = await inquiries
    .select('id, email_status')
    .eq('submission_id', submissionId)
    .maybeSingle();

  if (existing?.email_status === 'sent') {
    return NextResponse.json({ success: true, reference: `SOL-${existing.id}` });
  }

  if (!existing) {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await inquiries
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', since);
    if ((count || 0) >= 3) {
      return NextResponse.json({ error: 'Espera unos minutos antes de enviar otra solicitud.' }, { status: 429 });
    }
  }

  const sourceUrl = cleanText(request.headers.get('referer'), 1000) || `${request.nextUrl.origin}/proyectos/${project.slug}`;
  let inquiryId = existing?.id as number | undefined;
  if (!inquiryId) {
    const { data: inserted, error: insertError } = await inquiries
      .insert({
        submission_id: submissionId,
        organization_id: project.organization_id,
        project_id: project.id,
        request_type: requestType,
        full_name: fullName,
        phone,
        email,
        profile_type: profileType,
        agency_name: profileType === 'agency' ? agencyName : null,
        typology: typology || null,
        message: message || null,
        locale,
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
        source_url: sourceUrl,
      })
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.error('project inquiry insert failed', insertError?.code);
      return NextResponse.json({ error: 'No pudimos registrar la solicitud. Inténtalo nuevamente.' }, { status: 503 });
    }
    inquiryId = inserted.id;
  }

  const [{ data: configuredRecipients }, { data: organization }] = await Promise.all([
    untypedAdmin
      .from('reservation_notification_recipients')
      .select('email')
      .eq('organization_id', project.organization_id)
      .eq('is_active', true),
    admin.from('organizations').select('contact_email').eq('id', project.organization_id).maybeSingle(),
  ]);
  const responsibleRecipients = uniqueEmails([
    ...((configuredRecipients || []) as Array<{ email?: string }>).map((recipient) => recipient.email),
    organization?.contact_email,
    process.env.PUBLIC_INQUIRIES_FALLBACK_EMAIL,
    'info@osvaldobello.com',
  ]);
  const reference = `SOL-${inquiryId}`;

  try {
    await sendProjectInquiryEmail({
      to: email,
      responsibleRecipients,
      requestType,
      fullName,
      phone,
      email,
      profileLabel: profileType === 'agency' ? 'Agencia inmobiliaria' : 'Vendedor independiente',
      agencyName: profileType === 'agency' ? agencyName : null,
      projectName: project.name,
      typology: typology || null,
      message: message || null,
      reference,
      projectUrl: `${request.nextUrl.origin}/proyectos/${project.slug}`,
    });
    await inquiries.update({ email_status: 'sent', emailed_at: new Date().toISOString(), email_error: null }).eq('id', inquiryId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message.slice(0, 500) : 'Error de correo';
    await inquiries.update({ email_status: 'failed', email_error: errorMessage }).eq('id', inquiryId);
    console.error('project inquiry email failed', reference);
    return NextResponse.json({ error: `Registramos ${reference}, pero el correo no pudo enviarse. Inténtalo nuevamente.` }, { status: 502 });
  }

  return NextResponse.json({ success: true, reference });
}
