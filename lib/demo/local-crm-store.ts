/**
 * Memoria y almacenamiento local para el Demo independiente.
 * Los leads y propuestas creados durante demostraciones o grabaciones de tutoriales
 * se guardan aquí para no necesitar conexión externa y no alterar la BD de producción.
 */

import type { ContactSummary } from '@/lib/data/crm';
import type { ProposalListItem } from '@/app/portal/proposals/actions';
import { readDemoState, updateDemoState } from '@/lib/demo/local-store';

// Contactos iniciales de demostración
export const INITIAL_DEMO_CONTACTS: ContactSummary[] = [
  {
    id: 9001,
    firstName: 'Alejandro',
    lastName: 'Morales',
    fullName: 'Alejandro Morales',
    email: 'alejandro.morales@ejemplo.com',
    phone: '+1 809 555 0192',
    publicCode: 'CLI-9001',
    phoneNormalized: '18095550192',
    phoneLast4: '0192',
    country: 'DO',
    preferredLanguage: 'es',
    classification: 'Inversionista',
    source: 'Referido',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [{ id: 1, name: 'VIP Punta Cana', color: '#2563eb' }],
    primaryOpportunity: {
      id: 9001,
      publicCode: 'OPP-9001',
      stage: 'Propuesta',
      priority: 'Alta',
      budgetMin: 450000,
      budgetMax: 700000,
      currency: 'USD',
      projectName: 'Villas en Punta Cana',
    },
    dnd: { email: false, whatsapp: false, calls: false, sms: false },
  },
  {
    id: 9002,
    firstName: 'Sophia',
    lastName: 'Taylor',
    fullName: 'Sophia Taylor',
    email: 'sophia.taylor@investor.com',
    phone: '+1 305 777 8899',
    publicCode: 'CLI-9002',
    phoneNormalized: '13057778899',
    phoneLast4: '8899',
    country: 'US',
    preferredLanguage: 'en',
    classification: 'Inversionista Internacional',
    source: 'Instagram Ads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [{ id: 2, name: 'Miami Investor', color: '#10b981' }],
    primaryOpportunity: {
      id: 9002,
      publicCode: 'OPP-9002',
      stage: 'Calificado',
      priority: 'Alta',
      budgetMin: 520000,
      budgetMax: 800000,
      currency: 'USD',
      projectName: 'Villas en Punta Cana',
    },
    dnd: { email: false, whatsapp: false, calls: false, sms: false },
  },
];

// Propuestas iniciales de demostración
export const INITIAL_DEMO_PROPOSALS: ProposalListItem[] = [
  {
    id: 8001,
    kind: 'proposal',
    title: 'Propuesta Comercial — Villa Palma (4H)',
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientName: 'Alejandro Morales',
    clientEmail: 'alejandro.morales@ejemplo.com',
    clientPhone: '+1 809 555 0192',
    projectName: 'Villas en Punta Cana',
    projectSlug: 'villas-en-punta-cana',
    projectPrice: 520000,
    currency: 'USD',
    coverImage: '/paridera/villas/villa-02.jpg',
    sharedToken: 'demo-propuesta-villa-palma',
    sharedUrl: '/p/demo-propuesta-villa-palma',
    viewsCount: 3,
  },
  {
    id: 8002,
    kind: 'dossier',
    title: 'Dossier Ejecutivo — Villas en Punta Cana',
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientName: 'Sophia Taylor',
    clientEmail: 'sophia.taylor@investor.com',
    clientPhone: '+1 305 777 8899',
    projectName: 'Villas en Punta Cana',
    projectSlug: 'villas-en-punta-cana',
    projectPrice: 450000,
    currency: 'USD',
    coverImage: '/paridera/villas/galeria/01-portada.jpg',
    sharedToken: 'demo-dossier-villas',
    sharedUrl: '/p/demo-dossier-villas',
    viewsCount: 7,
  },
];

// InMemory State para la sesión del servidor en demo
declare global {
  var __demoContacts: ContactSummary[] | undefined;
  var __demoProposals: ProposalListItem[] | undefined;
}

if (!global.__demoContacts) {
  global.__demoContacts = [...INITIAL_DEMO_CONTACTS];
}
if (!global.__demoProposals) {
  global.__demoProposals = [...INITIAL_DEMO_PROPOSALS];
}

export function getDemoContacts(): ContactSummary[] {
  return global.__demoContacts ?? INITIAL_DEMO_CONTACTS;
}

export async function getDemoContactsPersistent(): Promise<ContactSummary[]> {
  const persisted = await readDemoState();
  return [...INITIAL_DEMO_CONTACTS, ...(persisted.contacts as ContactSummary[])];
}

export function addDemoContact(contact: ContactSummary) {
  if (!global.__demoContacts) global.__demoContacts = [...INITIAL_DEMO_CONTACTS];
  global.__demoContacts.unshift(contact);
}

export async function saveDemoContact(contact: ContactSummary) {
  await updateDemoState((state) => { state.contacts.unshift(contact); });
}

export function getDemoProposals(): ProposalListItem[] {
  return global.__demoProposals ?? INITIAL_DEMO_PROPOSALS;
}

export async function getDemoProposalsPersistent(): Promise<ProposalListItem[]> {
  const persisted = await readDemoState();
  return persisted.proposals as ProposalListItem[];
}

export function addDemoProposal(prop: ProposalListItem) {
  if (!global.__demoProposals) global.__demoProposals = [...INITIAL_DEMO_PROPOSALS];
  global.__demoProposals.unshift(prop);
}

export async function saveDemoProposal(prop: ProposalListItem) {
  await updateDemoState((state) => { state.proposals.unshift(prop); });
}

export async function updateDemoProposal(id: number, update: (proposal: ProposalListItem) => ProposalListItem | null) {
  return updateDemoState((state) => {
    const index = state.proposals.findIndex((proposal) => (proposal as ProposalListItem).id === id);
    if (index < 0) return false;
    const next = update(state.proposals[index] as ProposalListItem);
    if (!next) state.proposals.splice(index, 1);
    else state.proposals[index] = next;
    return true;
  });
}

export async function updateDemoProposalByToken(token: string, update: (proposal: ProposalListItem) => ProposalListItem) {
  return updateDemoState((state) => {
    const proposal = state.proposals.find((item) => (item as ProposalListItem).sharedToken === token) as ProposalListItem | undefined;
    if (!proposal) return false;
    const index = state.proposals.indexOf(proposal);
    state.proposals[index] = update(proposal);
    return true;
  });
}
