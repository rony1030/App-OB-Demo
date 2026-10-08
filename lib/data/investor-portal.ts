import 'server-only';

import type { ProjectConstructionUpdate } from '@/lib/data/construction-updates';
import { buildDemoUnit, findDemoClient } from '@/lib/data/investor-demo';
import { getDemoConstructionUpdates } from '@/lib/data/investor-demo-construction';
import { readDemoState } from '@/lib/demo/local-store';
import { DEMO_PORTAL_PROJECTS } from '@/lib/demo/projects';
import { getPaymentFlow, toPublicFlow } from '@/lib/data/payment-flows';
import type { PaymentFlowPublic } from '@/lib/investor/payment-report';
import {
  computeAccount,
  type AccountSummary,
  type CollectionStatus,
  type ComputedInstallment,
  type DeliveryStatus,
  type InstallmentRow,
} from '@/lib/investor/account';

export type { AccountSummary, ComputedInstallment, OperationalStatus } from '@/lib/investor/account';

export interface InvestorReceipt {
  id: string;
  label: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  status: 'approved' | 'pending';
}

export interface InvestorReservationItem {
  reservationId: number;
  projectName: string;
  projectSlug: string;
  unitCode: string;
  price: number;
  currency: string;
  deliveryStatus: DeliveryStatus;
  collectionStatus: CollectionStatus;
  coverImage: string;
  legalNotes?: string | null;
  account: AccountSummary;
  receipts: InvestorReceipt[];
  /** Cómo reporta el cliente un pago de este proyecto (sin datos privados). */
  paymentFlow: PaymentFlowPublic;
}

type ReservationBase = Omit<InvestorReservationItem, 'paymentFlow'>;

export interface InvestorDocument {
  id: number;
  publicCode: string;
  documentType: string;
  title: string;
  fileName: string;
  createdAt: string;
  unitCode: string | null;
  url: string | null;
}

export interface InvestorAdvisor {
  name: string;
  title: string;
  photoUrl: string;
  whatsapp: string;
  email: string;
  legalWhatsapp: string;
}

export interface InvestorPortalData {
  contact: { id: number; organizationId: number | null; fullName: string; email: string | null; phone: string; publicCode: string; createdAt: string };
  organization: { name: string; slug: string };
  advisor: InvestorAdvisor;
  reservations: InvestorReservationItem[];
  documents: InvestorDocument[];
  /** Bitácora de obra agrupada por slug de proyecto */
  constructionByProject: Record<string, ProjectConstructionUpdate[]>;
  isDemo: boolean;
}

const PROJECT_COVERS: Record<string, string> = {
  'cana-rock-star': '/projects/cana-rock/drone-golf-course.jpg',
  'cana-rock-universe': '/projects/cana-rock/drone-golf-course.jpg',
  'cana-rock-galaxy': '/projects/cana-rock/drone-golf-course.jpg',
  'cana-rock-stelar': '/projects/cana-rock-stelar/stelar-hero-bg.jpg',
  'sunrise-bonita-beach': '/paridera/hub/sunrise-hero.jpg',
  'cipres-residences': '/projects/cipres-residences/gallery/cipres_06.jpeg',
  'palm-view': '/projects/palm-view/gallery/amenidades-casa-club-aerea.jpg',
  'uve-residences': '/projects/uve-residences/hero.jpeg',
};
const DEFAULT_COVER = '/projects/cana-rock/drone-golf-course.jpg';

const ADVISOR: InvestorAdvisor = {
  name: 'Osvaldo Bello',
  title: 'Comercializador Inmobiliario · Bello Valdez Enterprise',
  photoUrl: '/brand/ob-brokers-isotipo-azul.png',
  whatsapp: '18296391841',
  email: 'info@osvaldobello.com',
  legalWhatsapp: '18296391841',
};

const ORGANIZATION = { name: 'Bello Valdez Enterprise', slug: 'bello-valdez-enterprise' };

const STAGE_LABEL: Record<string, string> = {
  reservation: 'Reserva',
  initial: 'Inicial 20%',
  construction_cuotas: 'Cuota de construcción',
  delivery_final: 'Pago Insoluto',
};

const KIND_LABEL: Record<string, string> = {
  reservation: 'Reserva',
  initial: 'Inicial 20%',
  delivery_balance: 'Pago Insoluto',
  other: 'Pago',
};

function receiptsFromInstallments(schedule: ComputedInstallment[], currency: string): InvestorReceipt[] {
  return schedule
    .filter((r) => r.paidAmount > 0)
    .map((r) => ({
      id: `inst-${r.sequence}`,
      label: KIND_LABEL[r.kind] ?? r.concept,
      amount: r.paidAmount,
      currency,
      paidAt: r.paidAt ?? null,
      status: 'approved' as const,
    }))
    .reverse();
}

async function constructionFor(slugs: string[], demo = false): Promise<Record<string, ProjectConstructionUpdate[]>> {
  const unique = Array.from(new Set(slugs));
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    return Object.fromEntries(unique.map((slug) => [slug, getDemoConstructionUpdates(slug)]));
  }
  const { getProjectConstructionUpdates } = await import('@/lib/data/construction-updates');
  const entries = await Promise.all(
    unique.map(async (slug) => {
      const real = await getProjectConstructionUpdates(slug);
      return [slug, real.length || !demo ? real : getDemoConstructionUpdates(slug)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function attachFlows(bases: ReservationBase[], demo: boolean): Promise<InvestorReservationItem[]> {
  const flows = new Map<string, PaymentFlowPublic>();
  await Promise.all(
    Array.from(new Set(bases.map((b) => b.projectSlug))).map(async (slug) => {
      flows.set(slug, toPublicFlow(await getPaymentFlow(slug, demo)));
    }),
  );
  return bases.map((b) => ({ ...b, paymentFlow: flows.get(b.projectSlug)! }));
}

async function buildDemoPortal(code: string): Promise<InvestorPortalData | null> {
  const client = findDemoClient(code);
  if (!client) return null;
  const asOf = new Date();

  const bases: ReservationBase[] = client.units.map((unitCode) => {
    const u = buildDemoUnit(unitCode, asOf);
    const account = computeAccount({
      price: u.price,
      installments: u.installments,
      deliveryStatus: u.deliveryStatus,
      collectionStatus: u.collectionStatus,
      asOf,
    });
    return {
      reservationId: u.reservationId,
      projectName: u.projectName,
      projectSlug: u.projectSlug,
      unitCode: u.unitCode,
      price: u.price,
      currency: 'USD',
      deliveryStatus: u.deliveryStatus,
      collectionStatus: u.collectionStatus,
      coverImage: PROJECT_COVERS[u.projectSlug] ?? DEFAULT_COVER,
      legalNotes: u.legalNotes ?? null,
      account,
      receipts: receiptsFromInstallments(account.schedule, 'USD'),
    };
  });
  const reservations = await attachFlows(bases, true);
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    for (const reservation of reservations) {
      const index = reservation.projectSlug === 'cipres-residences' ? 2 : reservation.projectSlug === 'uve-residences' ? 1 : reservation.projectSlug === 'palm-view' ? 3 : 0;
      const project = DEMO_PORTAL_PROJECTS[index];
      reservation.projectName = project.name;
      reservation.projectSlug = project.slug;
      reservation.coverImage = project.image;
      reservation.unitCode = `${index === 2 ? 'BC' : index === 3 ? 'CV' : 'VC'}-${String(reservation.reservationId % 100).padStart(2, '0')}`;
      reservation.paymentFlow = { mode: 'api', developerName: project.developer, steps: ['Registra el monto y la fecha del pago.', 'Adjunta el comprobante para su verificación.', 'Recibirás la confirmación en tu estado de cuenta.'], acceptsReceipt: true };
    }
  }
  const localState = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? await readDemoState() : null;
  const reports = localState?.investors[client.code]?.paymentReports ?? [];
  for (const report of reports) {
    if (!report || typeof report !== 'object') continue;
    const entry = report as { id?: string; reservationId?: number; unitCode?: string; amount?: number; paidAt?: string; reference?: string | null };
    const reservation = reservations.find((item) => item.reservationId === entry.reservationId || item.unitCode === entry.unitCode);
    if (!reservation) continue;
    reservation.receipts.push({
      id: entry.id || `demo-report-${reservation.unitCode}`,
      label: `Reporte local${entry.reference ? ` · ${entry.reference}` : ''}`,
      amount: Number(entry.amount) || 0,
      currency: reservation.currency,
      paidAt: entry.paidAt || null,
      status: 'pending',
    });
  }
  return {
    contact: {
      id: client.id,
      organizationId: null,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      publicCode: client.code,
      createdAt: new Date(asOf.getFullYear() - 1, 0, 15).toISOString(),
    },
    organization: process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? { name: 'Desarrollos Costa Serena', slug: 'costa-serena' } : ORGANIZATION,
    advisor: process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? { name: 'Andrea Castillo', title: 'Asesora inmobiliaria', photoUrl: '/brand/ob-brokers-isotipo-azul.png', whatsapp: '18095550100', email: 'andrea@horizonte.example', legalWhatsapp: '18095550100' } : ADVISOR,
    reservations,
    documents: client.documents.map((d) => ({
      id: d.id,
      publicCode: d.publicCode,
      documentType: d.documentType,
      title: d.title,
      fileName: d.fileName,
      createdAt: new Date(asOf.getFullYear(), asOf.getMonth() - d.monthsAgo, 15).toISOString(),
      unitCode: process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? reservations[0]?.unitCode || '' : d.unitCode,
      url: null,
    })),
    constructionByProject: await constructionFor(reservations.map((r) => r.projectSlug), process.env.NEXT_PUBLIC_APP_SCOPE !== 'demo'),
    isDemo: true,
  };
}

async function loadPortalFromDatabase(cleanCode: string): Promise<InvestorPortalData | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { getPublicAssetUrl, PUBLIC_ASSETS_BUCKET } = await import('@/lib/supabase/storage');
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const admin = createAdminClient() as any;
  const contactColumns = 'id, first_name, last_name, email, phone, public_code, organization_id, created_at';

  let { data: contact } = await admin.from('contacts').select(contactColumns).eq('public_code', cleanCode).is('deleted_at', null).maybeSingle();

  if (!contact) {
    const { data: leadReport } = await admin.from('lead_reports').select('contact_id').eq('public_code', cleanCode).maybeSingle();
    if (leadReport?.contact_id) {
      const { data: c } = await admin.from('contacts').select(contactColumns).eq('id', leadReport.contact_id).is('deleted_at', null).maybeSingle();
      contact = c;
    }
  }
  if (!contact) return null;

  const [{ data: org }, { data: opps }] = await Promise.all([
    admin.from('organizations').select('name, slug').eq('id', contact.organization_id).maybeSingle(),
    admin.from('opportunities').select('id').eq('contact_id', contact.id),
  ]);

  const oppIds = (opps ?? []).map((o: { id: number }) => o.id);
  const requests: { id: number; unit_id: number }[] = oppIds.length
    ? (await admin.from('reservation_requests').select('id, unit_id').in('opportunity_id', oppIds).eq('status', 'approved')).data ?? []
    : [];
  const reqIds = requests.map((r) => r.id);

  let reservationBases: ReservationBase[] = [];
  const unitCodeByRequest = new Map<number, string>();

  if (reqIds.length) {
    const { data: reservations } = await admin
      .from('reservations')
      .select('id, reservation_request_id, unit_id, status, contract_price, delivery_status, collection_status, legal_notes')
      .in('reservation_request_id', reqIds)
      .in('status', ['active', 'converted']);
    const resRows: any[] = reservations ?? [];
    const resIds = resRows.map((r) => r.id);
    const unitIds = resRows.map((r) => r.unit_id);

    const [{ data: units }, { data: installments }, { data: payments }] = await Promise.all([
      unitIds.length
        ? admin
            .from('units')
            .select('id, unit_code, list_price, currency, project:projects(name, slug, project_media(kind, storage_bucket, storage_path, sort_order))')
            .in('id', unitIds)
        : Promise.resolve({ data: [] }),
      resIds.length
        ? admin.from('reservation_installments').select('*').in('reservation_id', resIds).order('sequence')
        : Promise.resolve({ data: [] }),
      resIds.length
        ? admin
            .from('reservation_payment_submissions')
            .select('id, reservation_id, amount, currency, status, payment_stage, paid_at, created_at')
            .in('reservation_id', resIds)
            .in('status', ['approved', 'pending'])
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const unitMap = new Map<number, any>((units ?? []).map((u: any) => [u.id, u]));
    requests.forEach((r) => {
      const code = unitMap.get(r.unit_id)?.unit_code;
      if (code) unitCodeByRequest.set(r.id, String(code));
    });

    const installmentsByRes = new Map<number, InstallmentRow[]>();
    (installments ?? []).forEach((i: any) => {
      const list = installmentsByRes.get(i.reservation_id) ?? [];
      list.push({
        sequence: i.sequence,
        kind: i.kind,
        concept: i.concept,
        dueDate: String(i.due_date),
        amount: Number(i.amount),
        paidAmount: Number(i.paid_amount),
        paidAt: i.paid_at ?? null,
        moraAmount: Number(i.mora_amount),
      });
      installmentsByRes.set(i.reservation_id, list);
    });
    const paymentsByRes = new Map<number, any[]>();
    (payments ?? []).forEach((p: any) => paymentsByRes.set(p.reservation_id, [...(paymentsByRes.get(p.reservation_id) ?? []), p]));

    const asOf = new Date();
    reservationBases = resRows.map((res) => {
      const unit = unitMap.get(res.unit_id);
      const project = unit?.project;
      const currency = String(unit?.currency ?? 'USD');
      const price = Number(res.contract_price ?? unit?.list_price ?? 0);
      const rows = installmentsByRes.get(res.id) ?? [];
      const deliveryStatus = (res.delivery_status ?? 'in_construction') as DeliveryStatus;
      const collectionStatus = (res.collection_status ?? 'normal') as CollectionStatus;
      const account = computeAccount({ price, installments: rows, deliveryStatus, collectionStatus, asOf });

      const submissions = paymentsByRes.get(res.id) ?? [];
      // Sin cronograma cargado todavía: el abonado sale de los comprobantes aprobados.
      if (rows.length === 0) {
        const approved = submissions.filter((p) => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0);
        account.totalPaid = approved;
        account.remainingBalance = Math.max(0, price - approved);
        account.paidPercentage = price > 0 ? Math.min(100, Math.round((approved / price) * 100)) : 0;
      }

      const media = [...(project?.project_media ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
      const hero = media.find((m: any) => m.kind === 'hero') ?? media[0];
      const slug = String(project?.slug ?? 'proyecto');

      const receipts: InvestorReceipt[] = submissions.length
        ? submissions.map((p) => ({
            id: `pay-${p.id}`,
            label: STAGE_LABEL[p.payment_stage] ?? 'Pago registrado',
            amount: Number(p.amount),
            currency: String(p.currency ?? currency),
            paidAt: p.paid_at ? String(p.paid_at) : null,
            status: p.status === 'approved' ? 'approved' : 'pending',
          }))
        : receiptsFromInstallments(account.schedule, currency);

      return {
        reservationId: Number(res.id),
        projectName: String(project?.name ?? 'Proyecto inmobiliario'),
        projectSlug: slug,
        unitCode: String(unit?.unit_code ?? `Unidad ${res.unit_id}`),
        price,
        currency,
        deliveryStatus,
        collectionStatus,
        coverImage: hero && hero.storage_bucket === PUBLIC_ASSETS_BUCKET ? getPublicAssetUrl(hero.storage_path) : PROJECT_COVERS[slug] ?? DEFAULT_COVER,
        legalNotes: res.legal_notes ?? null,
        account,
        receipts,
      };
    });
  }

  const { data: rawDocs } = await admin
    .from('client_documents')
    .select('id, document_type, title, file_name, created_at, storage_bucket, storage_path, reservation_request_id')
    .eq('contact_id', contact.id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  const documents: InvestorDocument[] = await Promise.all(
    (rawDocs ?? []).map(async (d: any) => {
      let url: string | null = null;
      try {
        const { data: signed } = await admin.storage.from(d.storage_bucket).createSignedUrl(d.storage_path, 3600);
        url = signed?.signedUrl ?? null;
      } catch {
        url = null;
      }
      return {
        id: Number(d.id),
        publicCode: `DOC-${d.id}`,
        documentType: String(d.document_type),
        title: String(d.title || d.file_name),
        fileName: String(d.file_name),
        createdAt: String(d.created_at),
        unitCode: d.reservation_request_id ? unitCodeByRequest.get(d.reservation_request_id) ?? null : null,
        url,
      };
    }),
  );

  const reservationItems = await attachFlows(reservationBases, false);

  return {
    contact: {
      id: Number(contact.id),
      organizationId: Number(contact.organization_id),
      fullName: `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'Cliente inversionista',
      email: contact.email ? String(contact.email) : null,
      phone: String(contact.phone ?? ''),
      publicCode: String(contact.public_code),
      createdAt: String(contact.created_at),
    },
    organization: org ? { name: String(org.name), slug: String(org.slug) } : ORGANIZATION,
    advisor: ADVISOR,
    reservations: reservationItems,
    documents,
    constructionByProject: await constructionFor(reservationItems.map((r) => r.projectSlug)),
    isDemo: false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Datos del portal del inversionista a partir de su código público (contacto o reporte de lead).
 * Los códigos CLI-* de demostración solo se resuelven si allowDemo es verdadero.
 */
export async function getInvestorPortalDataByCode(code: string, allowDemo = false): Promise<InvestorPortalData | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  if (allowDemo) {
    const demo = await buildDemoPortal(cleanCode);
    if (demo) return demo;
  }

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return null;
  try {
    return await loadPortalFromDatabase(cleanCode);
  } catch (error) {
    console.error('[getInvestorPortalDataByCode] Error:', error);
    return null;
  }
}

/** Comprobación ligera para el login: ¿existe un portal para este código? */
export async function investorCodeExists(code: string): Promise<boolean> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,40}$/.test(clean)) return false;
  if (findDemoClient(clean)) return true;
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return false;
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: contact } = await admin.from('contacts').select('id').eq('public_code', clean).is('deleted_at', null).maybeSingle();
    if (contact) return true;
    const { data: report } = await admin.from('lead_reports').select('id').eq('public_code', clean).maybeSingle();
    return Boolean(report);
  } catch {
    return false;
  }
}
