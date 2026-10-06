'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';

import { useState } from 'react';
import CreativeStudio from '@/components/portal/creative/CreativeStudio';
import type { PortalProject } from '@/lib/portal-projects';
import type { AgentProfile } from '@/components/portal/creative/types';

const image = '/w2m/canabay-golf.png';
const project: PortalProject = {
  id: 0, slug: 'creative-editor-local-validation', name: 'Cana Rock · Validación local', developer: '', location: 'Cana Bay, Punta Cana', zone: '', status: '', delivery: '',
  startingPrice: 260099, currency: 'USD', commission: 0, totalUnits: 1, availableUnits: 1, description: 'Contenido de prueba local.', shortDescription: 'Prueba de texto y composición del editor.',
  image, gallery: [image, image, image, image], highlights: ['Vista del proyecto', 'Espacios', 'Ubicación', 'Diseño'], amenities: ['Parqueo', 'Ascensores', 'Piscina'], paymentPlan: [], documents: [],
  units: [{ id: 'test', unit: 'Test', tower: '', floor: 1, type: '', bedrooms: 1, bathrooms: 2, area: 78.75, price: 260099, status: 'Disponible' }], projectType: 'building', lots: [], updatedAt: '',
};
const agent: AgentProfile = { name: 'Asesor de prueba', role: 'Validación local', phone: null, email: null, instagram: '', socialLinks: [], avatarUrl: null, signatureFont: 'dancing' };
export default function CreativeStudioFixture() {
  const [open, setOpen] = useState(false);
  return <main className="p-8"><h1><LocalizedText text={"Validación local del editor — datos de prueba"} /></h1><button className="mt-4 rounded bg-indigo-950 p-3 text-white" onClick={() => setOpen(true)}><LocalizedText text={"Abrir editor de prueba"} /></button><CreativeStudio isOpen={open} onClose={() => setOpen(false)} project={project} agent={agent} /></main>;
}
