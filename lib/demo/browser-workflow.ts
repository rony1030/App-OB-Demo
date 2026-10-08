import type { ContactDetail, ContactSummary } from '@/lib/data/crm';
import type { ProposalListItem } from '@/app/portal/proposals/actions';

export type WorkflowDocument = { id: string; name: string; type: string; size: number; createdAt: string };
export type WorkflowDeal = {
  id: string; contactId: number; contactCode: string; clientName: string;
  projectId: number; projectSlug: string; projectName: string; developer: string;
  unitId: string; unitCode: string; price: number; currency: string; commissionRate: number;
  reservedAt: string; paymentAmount?: number; paymentReference?: string; receiptId?: string;
  paymentReportedAt?: string; paymentConfirmedAt?: string; promiseSignedAt?: string;
  claimRequestedAt?: string; proformaAt?: string; proformaApprovedAt?: string;
  invoiceAt?: string; paidAt?: string;
};
export type WorkflowState = {
  contacts: ContactDetail[]; proposals: ProposalListItem[]; deals: WorkflowDeal[];
  documents: Record<string, WorkflowDocument[]>;
  investorReports: Array<{ id: string; code: string; reservationId: number; amount: number; paidAt: string; reportedAt: string; reference: string; receiptId?: string }>;
};
export const WORKFLOW_KEY = 'ob-demo.workflow.v1';
export const WORKFLOW_EVENT = 'ob-workflow-change';
export const PAYMENT_DELAY_MS = 4000;
export const PROFORMA_DELAY_MS = 10000;
export const COMMISSION_DELAY_MS = 10000;
export const FICTIONAL_AGENCY = { name: 'Horizonte Asesores Inmobiliarios', taxId: '000-00000-0', address: 'Avenida del Horizonte 24, Punta Cana', email: 'administracion@horizonte.example' };
const stageKey = (value: string) => ({ Nuevo: 'new', Contactado: 'contacted', Calificado: 'qualified', Propuesta: 'proposal', Negociación: 'negotiation', Reserva: 'reservation', Ganado: 'won', Perdido: 'lost' } as Record<string, string>)[value] || value;

export function emptyWorkflow(): WorkflowState { return { contacts: [], proposals: [], deals: [], documents: {}, investorReports: [] }; }
export function readWorkflow(): WorkflowState {
  if (typeof window === 'undefined') return emptyWorkflow();
  try {
    const value = JSON.parse(window.localStorage.getItem(WORKFLOW_KEY) || '{}');
    return { contacts: Array.isArray(value.contacts) ? value.contacts : [], proposals: Array.isArray(value.proposals) ? value.proposals : [], deals: Array.isArray(value.deals) ? value.deals : [], documents: value.documents || {}, investorReports: Array.isArray(value.investorReports) ? value.investorReports : [] };
  } catch { return emptyWorkflow(); }
}
export function writeWorkflow(state: WorkflowState) {
  if (process.env.NEXT_PUBLIC_APP_SCOPE !== 'demo' || typeof window === 'undefined') throw new Error('Almacenamiento no disponible.');
  window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(WORKFLOW_EVENT));
}
export function changeWorkflow(update: (state: WorkflowState) => void) { const state = readWorkflow(); update(state); writeWorkflow(state); return state; }
export function contactDetail(contact: ContactSummary): ContactDetail {
  return { ...contact, notes: [], activities: [], opportunities: [], customFields: {} };
}
export function saveWorkflowContact(contact: ContactDetail) {
  return changeWorkflow(state => { state.contacts = [contact, ...state.contacts.filter(item => item.id !== contact.id)]; });
}
export function createWorkflowContact(data: FormData): ContactDetail {
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  if (!name || phone.replace(/\D/g, '').length < 4) throw new Error('Escribe el nombre y el teléfono del cliente.');
  const id = Date.now(); const now = new Date().toISOString(); const parts = name.split(' ');
  const contact: ContactDetail = {
    id, publicCode: `CLI-${id.toString(36).toUpperCase()}`, firstName: parts[0], lastName: parts.slice(1).join(' ') || null, fullName: name,
    phone, email: String(data.get('email') || '').trim() || null, phoneNormalized: phone.replace(/\D/g, ''), phoneLast4: phone.replace(/\D/g, '').slice(-4),
    country: 'DO', preferredLanguage: data.get('language') === 'English' ? 'en' : data.get('language') === 'Français' ? 'fr' : 'es', classification: String(data.get('classification') || 'Inversionista'), source: String(data.get('source') || 'Referido'), createdAt: now, updatedAt: now,
    tags: String(data.get('tags') || '').split(',').map(tag => tag.trim()).filter(Boolean).map((tag, index) => ({ id: index + 1, name: tag, color: '#2563eb' })),
    dnd: { email: data.get('dndEmail') === 'true', whatsapp: data.get('dndWhatsapp') === 'true', calls: data.get('dndCalls') === 'true', sms: false }, notes: [], activities: [], opportunities: [],
    customFields: { project: String(data.get('project') || ''), budgetMin: Number(data.get('budgetMin')) || 0, budgetMax: Number(data.get('budgetMax')) || 0, currency: String(data.get('budgetCurrency') || 'USD') },
    primaryOpportunity: { id, publicCode: `OPP-${id.toString(36).toUpperCase()}`, stage: String(data.get('stage') || 'Nuevo'), priority: String(data.get('priority') || 'Media'), budgetMin: Number(data.get('budgetMin')) || 0, budgetMax: Number(data.get('budgetMax')) || 0, currency: String(data.get('budgetCurrency') || 'USD'), projectName: String(data.get('project') || '') || undefined },
  };
  const notes = String(data.get('notes') || '').trim();
  if (notes) contact.notes.push({ id, body: notes, createdAt: now, createdByName: 'Equipo comercial' });
  saveWorkflowContact(contact); return contact;
}
export function mergeWorkflowContacts(seed: ContactSummary[], state: WorkflowState): ContactSummary[] {
  return [...state.contacts, ...seed.filter(contact => !state.contacts.some(item => item.id === contact.id))].map(contact => {
    contact = contact.primaryOpportunity ? { ...contact, primaryOpportunity: { ...contact.primaryOpportunity, stage: stageKey(contact.primaryOpportunity.stage) } } : contact;
    const deal = state.deals.find(item => item.contactId === contact.id);
    if (deal) return { ...contact, primaryOpportunity: { id: Number(deal.id), publicCode: `OPP-${deal.id}`, stage: deal.paidAt ? 'won' : 'reservation', priority: 'high', budgetMin: deal.price, budgetMax: deal.price, currency: deal.currency, projectName: deal.projectName } };
    const proposal = state.proposals.find(item => item.status !== 'archived' && (item.snapshot as Record<string, unknown> | undefined)?.contact_id === contact.id);
    return proposal ? { ...contact, primaryOpportunity: { id: contact.primaryOpportunity?.id || contact.id, publicCode: contact.primaryOpportunity?.publicCode || `OPP-${contact.id}`, stage: proposal.decision === 'accepted' ? 'negotiation' : 'proposal', priority: contact.primaryOpportunity?.priority || 'Media', budgetMin: contact.primaryOpportunity?.budgetMin ?? null, budgetMax: contact.primaryOpportunity?.budgetMax ?? null, currency: proposal.currency || 'USD', projectName: proposal.projectName } } : contact;
  });
}
export function advanceWorkflow(state: WorkflowState, now = Date.now()): boolean {
  let changed = false;
  for (const deal of state.deals) {
    if (deal.paymentReportedAt && !deal.paymentConfirmedAt && now >= Date.parse(deal.paymentReportedAt) + PAYMENT_DELAY_MS) {
      deal.paymentConfirmedAt = new Date(Date.parse(deal.paymentReportedAt) + PAYMENT_DELAY_MS).toISOString();
      deal.promiseSignedAt = deal.paymentConfirmedAt; changed = true;
    }
    if (deal.proformaAt && !deal.proformaApprovedAt && now >= Date.parse(deal.proformaAt) + PROFORMA_DELAY_MS) {
      deal.proformaApprovedAt = new Date(Date.parse(deal.proformaAt) + PROFORMA_DELAY_MS).toISOString(); changed = true;
    }
    if (deal.invoiceAt && !deal.paidAt && now >= Date.parse(deal.invoiceAt) + COMMISSION_DELAY_MS) {
      deal.paidAt = new Date(Date.parse(deal.invoiceAt) + COMMISSION_DELAY_MS).toISOString(); changed = true;
    }
  }
  return changed;
}
export function updateWorkflowDeal(id: string, action: 'report_payment' | 'request_claim' | 'proforma' | 'invoice', payload: { amount?: number; reference?: string; receiptId?: string } = {}) {
  return changeWorkflow(state => {
    advanceWorkflow(state); const deal = state.deals.find(item => item.id === id);
    if (!deal) throw new Error('Negociación no encontrada.');
    const now = new Date().toISOString();
    if (action === 'report_payment') {
      if (deal.paymentReportedAt) return;
      if (!Number.isFinite(payload.amount) || !payload.amount || payload.amount <= 0 || payload.amount > deal.price) throw new Error('El monto debe ser mayor que cero y no superar el valor de la unidad.');
      deal.paymentAmount = payload.amount; deal.paymentReference = payload.reference || 'Transferencia bancaria'; deal.receiptId = payload.receiptId; deal.paymentReportedAt = now;
    } else if (action === 'request_claim') {
      if (!deal.paymentConfirmedAt || !deal.promiseSignedAt) throw new Error('Espera la confirmación del pago y la firma de la promesa.');
      deal.claimRequestedAt ||= now;
    } else if (action === 'proforma') {
      if (!deal.claimRequestedAt) throw new Error('Solicita primero la comisión.');
      deal.proformaAt ||= now;
    } else {
      if (!deal.proformaApprovedAt) throw new Error('La proforma debe estar aprobada antes de generar la factura.');
      deal.invoiceAt ||= now;
    }
  });
}
export function commissionAmount(deal: WorkflowDeal) { return Math.round(deal.price * deal.commissionRate) / 100; }
export function documentNumber(deal: WorkflowDeal, kind: 'proforma' | 'factura') { return `${kind === 'proforma' ? 'PRO' : 'FAC'}-${new Date(deal.reservedAt).getFullYear()}-${deal.id.slice(-6)}`; }
export function fiscalNumber(deal: WorkflowDeal) { return `B01${deal.id.slice(-8).padStart(8, '0')}`; }

async function fileDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ob-workflow-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('No se pudo abrir el expediente.'));
  });
}
export async function saveWorkflowFile(contactId: number, file: File, type: string): Promise<WorkflowDocument> {
  if (file.size <= 0 || file.size > 10 * 1024 * 1024 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Selecciona un PDF o imagen de hasta 10 MB.');
  const document = { id: crypto.randomUUID(), name: file.name, type, size: file.size, createdAt: new Date().toISOString() };
  const db = await fileDatabase();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, document.id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('No se pudo guardar el archivo.')); }); }
  finally { db.close(); }
  changeWorkflow(state => { (state.documents[String(contactId)] ||= []).push(document); }); return document;
}
export async function openWorkflowFile(id: string) {
  const db = await fileDatabase();
  try {
    const file = await new Promise<Blob>((resolve, reject) => { const request = db.transaction('files').objectStore('files').get(id); request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error('Archivo no encontrado.')); request.onerror = () => reject(new Error('No se pudo abrir el archivo.')); });
    const url = URL.createObjectURL(file); const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  } finally { db.close(); }
}
