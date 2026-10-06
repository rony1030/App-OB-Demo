'use server';

import { createHmac } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { mailer, SMTP_CONFIG } from '@/lib/email/mailer';
import { getInvestorPortalDataByCode } from '@/lib/data/investor-portal';
import { getPaymentFlow } from '@/lib/data/payment-flows';
import { toIsoDate } from '@/lib/investor/account';
import {
  PAYMENT_METHODS,
  validatePaymentReport,
  validateReceiptFile,
} from '@/lib/investor/payment-report';

export interface ReportPaymentResult {
  ok: boolean;
  error?: string;
  /** Verdadero cuando es un cliente de demostración: no se envió nada real. */
  demo?: boolean;
  message?: string;
}

const MAX_REPORTS_PER_HOUR = 5;
const attempts = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= MAX_REPORTS_PER_HOUR) {
    attempts.set(key, recent);
    return true;
  }
  attempts.set(key, [...recent, now]);
  return false;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

import { getAuthenticatedInvestorSession, hasDemoAccess } from '@/lib/investor/auth';
import { findDemoClient } from '@/lib/data/investor-demo';

/**
 * Recibe el reporte de pago de un inversionista. El acceso se valida por la sesión activa
 * o autorización de demostración: solo puede reportar sobre inmuebles que pertenecen a su expediente verificado.
 */
export async function reportPaymentAction(formData: FormData): Promise<ReportPaymentResult> {
  // Trampa para bots: el campo existe oculto en el formulario.
  if (text(formData, 'website')) return { ok: true, message: 'Reporte recibido.' };

  const code = text(formData, 'code').trim().toUpperCase();
  const reservationId = Number(text(formData, 'reservationId'));
  if (!code || !Number.isInteger(reservationId)) return { ok: false, error: 'No se pudo identificar el inmueble.' };

  const isDemo = Boolean(findDemoClient(code));
  if (isDemo) {
    const demoAllowed = await hasDemoAccess();
    if (!demoAllowed) {
      return { ok: false, error: 'Acceso no autorizado a la demostración.' };
    }
  } else {
    const session = await getAuthenticatedInvestorSession();
    if (!session || session.publicCode.toUpperCase() !== code) {
      return { ok: false, error: 'Sesión no válida o expirada. Por favor inicie sesión nuevamente.' };
    }
  }

  if (rateLimited(code)) {
    return { ok: false, error: 'Ha enviado varios reportes en la última hora. Si necesita ayuda, escriba a su asesor.' };
  }

  const data = await getInvestorPortalDataByCode(code, isDemo);
  const unit = data?.reservations.find((r) => r.reservationId === reservationId);
  if (!data || !unit) return { ok: false, error: 'No se encontró el inmueble en su portafolio.' };

  const validation = validatePaymentReport(
    {
      amount: Number(text(formData, 'amount')),
      paidAt: text(formData, 'paidAt'),
      method: text(formData, 'method'),
      reference: text(formData, 'reference'),
      note: text(formData, 'note'),
    },
    toIsoDate(new Date()),
  );
  if (!validation.ok || !validation.value) return { ok: false, error: validation.error };
  const report = validation.value;

  const fileEntry = formData.get('receipt');
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  const fileError = validateReceiptFile(file);
  if (fileError) return { ok: false, error: fileError };

  const flow = await getPaymentFlow(unit.projectSlug, data.isDemo);
  if (flow.mode !== 'email' && flow.mode !== 'api') {
    return { ok: false, error: 'Este proyecto no recibe reportes desde el portal. Siga los pasos indicados.' };
  }

  if (data.isDemo) {
    return {
      ok: true,
      demo: true,
      message:
        flow.mode === 'email'
          ? `Demostración: en producción este reporte se enviaría por correo al equipo de cobros de ${flow.developerName}, con el comprobante adjunto.`
          : `Demostración: en producción este reporte se registraría de inmediato en el sistema de ${flow.developerName} mediante su API.`,
    };
  }

  if (!data.contact.organizationId) return { ok: false, error: 'No se pudo registrar el reporte. Escriba a su asesor.' };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const admin = createAdminClient() as any;
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === report.method)?.label ?? report.method;

  const { data: inserted, error: insertError } = await admin
    .from('investor_payment_reports')
    .insert({
      organization_id: data.contact.organizationId,
      contact_id: data.contact.id,
      reservation_id: unit.reservationId,
      project_slug: unit.projectSlug,
      unit_code: unit.unitCode,
      amount: report.amount,
      currency: unit.currency,
      paid_at: report.paidAt,
      method: report.method,
      reference: report.reference,
      note: report.note,
      file_name: file?.name ?? null,
      delivery_mode: flow.mode,
      delivery_status: 'pending',
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    console.error('[reportPaymentAction] insert', insertError);
    return { ok: false, error: 'No se pudo registrar el reporte. Intente de nuevo o escriba a su asesor.' };
  }
  const reportId: number = inserted.id;

  const setStatus = (status: 'sent' | 'failed', error?: string) =>
    admin.from('investor_payment_reports').update({ delivery_status: status, delivery_error: error?.slice(0, 300) ?? null }).eq('id', reportId);

  const attachmentBuffer = file ? Buffer.from(await file.arrayBuffer()) : null;
  const summaryRows: [string, string][] = [
    ['Cliente', data.contact.fullName],
    ['Referencia del cliente', data.contact.publicCode],
    ['Proyecto', unit.projectName],
    ['Unidad', unit.unitCode],
    ['Monto reportado', `${unit.currency} ${report.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Fecha del pago', report.paidAt],
    ['Método', methodLabel],
    ['Referencia bancaria', report.reference ?? '—'],
    ['Nota', report.note ?? '—'],
  ];

  try {
    if (flow.mode === 'email') {
      if (!flow.emailTo.length) throw new Error('El proyecto no tiene correos de cobro configurados.');
      const rows = summaryRows
        .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#64748b">${escapeHtml(k)}</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(v)}</td></tr>`)
        .join('');
      await mailer.sendMail({
        from: SMTP_CONFIG.from,
        to: flow.emailTo,
        replyTo: data.contact.email ?? undefined,
        subject: `Reporte de pago · ${unit.projectName} · ${unit.unitCode} · ${data.contact.fullName}`,
        html: `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#0f172a"><main style="max-width:620px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><header style="background:#0C094E;padding:24px;color:#fff"><h1 style="margin:0;font-size:20px">Reporte de pago de un inversionista</h1></header><section style="padding:24px"><p>Un cliente reportó un pago desde el portal de OB Brokers. Verifíquelo contra el banco y aplíquelo a su estado de cuenta.</p><table style="border-collapse:collapse;width:100%">${rows}</table><p style="color:#64748b;font-size:13px">Reporte #${reportId} · ${file ? 'Comprobante adjunto.' : 'Sin comprobante adjunto.'}</p></section></main></body></html>`,
        attachments: file && attachmentBuffer ? [{ filename: file.name, content: attachmentBuffer, contentType: file.type }] : [],
      });
    } else {
      if (!flow.apiUrl) throw new Error('El proyecto no tiene API configurada.');
      const secret = flow.apiSecretEnv ? process.env[flow.apiSecretEnv] : undefined;
      if (!secret) throw new Error('El secreto de la API no está configurado en el servidor.');
      const body = JSON.stringify({
        reportId,
        project: unit.projectSlug,
        unit: unit.unitCode,
        amount: report.amount,
        currency: unit.currency,
        paidAt: report.paidAt,
        method: report.method,
        reference: report.reference,
        note: report.note,
        investor: { name: data.contact.fullName, email: data.contact.email, phone: data.contact.phone, code: data.contact.publicCode },
        receipt: attachmentBuffer && file ? { fileName: file.name, contentType: file.type, base64: attachmentBuffer.toString('base64') } : null,
      });
      const response = await fetch(flow.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OB-Report-Id': String(reportId),
          'X-OB-Signature': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`La API respondió ${response.status}.`);
    }
    await setStatus('sent');
    return { ok: true, message: `Reporte enviado a ${flow.developerName}. Su pago será verificado y aplicado a su estado de cuenta.` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[reportPaymentAction] delivery', reason);
    await setStatus('failed', reason);
    return {
      ok: false,
      error: 'Su reporte quedó registrado, pero no pudimos entregarlo automáticamente. Su asesor le dará seguimiento; también puede escribirle por WhatsApp.',
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
