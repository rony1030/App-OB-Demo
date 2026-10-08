/**
 * Memoria y almacenamiento local para el Demo independiente.
 * Los leads y propuestas creados durante demostraciones o grabaciones de tutoriales
 * se guardan aquí para no necesitar conexión externa y no alterar la BD de producción.
 */

import type { ContactSummary } from '@/lib/data/crm';
import type { ProposalListItem } from '@/app/portal/proposals/actions';
import { readDemoState, updateDemoState } from '@/lib/demo/local-store';
import { DEMO_PORTAL_PROJECTS } from '@/lib/demo/projects';
import { buildDossierTemplate } from '@/lib/portal/dossier-template';
import { localizeDemoDossierAssets } from '@/lib/demo/localize-dossier-assets';

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
  {
    id: 9003,
    firstName: 'María',
    lastName: 'Fernández',
    fullName: 'María Fernández',
    email: 'maria.fernandez@ejemplo.com',
    phone: '+1 809 555 0147',
    publicCode: 'CLI-9003',
    phoneNormalized: '18095550147',
    phoneLast4: '0147',
    country: 'DO',
    preferredLanguage: 'es',
    classification: 'Comprador final',
    source: 'Portal web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [{ id: 3, name: 'Santiago', color: '#7c3aed' }],
    primaryOpportunity: { id: 9003, publicCode: 'OPP-9003', stage: 'Calificado', priority: 'Media', budgetMin: 250000, budgetMax: 400000, currency: 'USD', projectName: 'Villas en Punta Cana' },
    dnd: { email: false, whatsapp: false, calls: false, sms: false },
  },
  {
    id: 9004,
    firstName: 'Carlos',
    lastName: 'Ramírez',
    fullName: 'Carlos Ramírez',
    email: 'carlos.ramirez@ejemplo.com',
    phone: '+1 809 555 0168',
    publicCode: 'CLI-9004',
    phoneNormalized: '18095550168',
    phoneLast4: '0168',
    country: 'DO',
    preferredLanguage: 'es',
    classification: 'Inversionista',
    source: 'Instagram',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [{ id: 4, name: 'La Romana', color: '#059669' }],
    primaryOpportunity: { id: 9004, publicCode: 'OPP-9004', stage: 'Contactado', priority: 'Alta', budgetMin: 350000, budgetMax: 550000, currency: 'USD', projectName: 'Villas en Punta Cana' },
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
    coverImage: '/demo-projects/villas-punta-cana.png',
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
    coverImage: '/demo-projects/villas-punta-cana.png',
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
  const seedDossiers: ProposalListItem[] = DEMO_PORTAL_PROJECTS.map((project, index) => {
    const sharedToken = `demo-dossier-${project.slug}`;
    return {
      id: 8100 + index,
      kind: 'dossier',
      title: `${project.name} · Dossier Oficial`,
      status: 'ready',
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
      projectName: project.name,
      projectSlug: project.slug,
      projectPrice: project.startingPrice,
      currency: project.currency || 'USD',
      coverImage: project.image,
      sharedToken,
      sharedUrl: `/p/${sharedToken}`,
      viewsCount: 0,
      snapshot: {
        kind: 'dossier',
        project: project.name,
        project_slug: project.slug,
        blocks: localizeDemoDossierAssets(buildDossierTemplate(project), project),
        branding: { name: 'OB Brokers Team', primary_color: '#0f172a', accent_color: '#2563eb' },
      },
      demoActivity: [],
    };
  });
  const saved = persisted.proposals as ProposalListItem[];
  const savedIds = new Set(saved.map((item) => item.id));
  return [...seedDossiers.filter((item) => !savedIds.has(item.id)), ...saved];
}

export function addDemoProposal(prop: ProposalListItem) {
  if (!global.__demoProposals) global.__demoProposals = [...INITIAL_DEMO_PROPOSALS];
  global.__demoProposals.unshift(prop);
}

export async function saveDemoProposal(prop: ProposalListItem) {
  await updateDemoState((state) => {
    state.proposals = state.proposals.filter((item) => (item as ProposalListItem).id !== prop.id);
    state.proposals.unshift(prop);
  });
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
