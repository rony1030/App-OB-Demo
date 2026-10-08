'use client';
import { useWorkflow } from '@/lib/demo/use-workflow';
import type { PortalProject } from '@/lib/portal-projects';
import SimpleProposalCreator from './SimpleProposalCreator';
import DemoDossierComposer from './DemoDossierComposer';
import type { SlideBlock } from '@/components/portal/PublicDossierViewer';
import type { ProposalListItem } from '@/app/portal/proposals/actions';

export default function DemoProposalEditor({ id, projects, seed = [] }: { id: number; projects: PortalProject[]; seed?: ProposalListItem[] }) {
  const { state, ready } = useWorkflow();
  if (!ready) return <p className="p-8">Cargando propuesta…</p>;
  const item = [...state.proposals, ...seed].find(value => value.id === id && value.status !== 'archived');
  const project = projects.find(value => value.slug === item?.projectSlug);
  if (!item || !project) return <p className="p-8">Propuesta no encontrada.</p>;
  const snapshot = item.snapshot as Record<string, unknown>;
  if (item.kind === 'dossier') return <DemoDossierComposer project={project} blocks={snapshot.blocks as SlideBlock[]} item={item} />;
  const units = Array.isArray(snapshot.items) ? snapshot.items as Record<string, unknown>[] : [];
  return <SimpleProposalCreator project={project} selectedUnitIds={units.map(value => String(value.unit_id || value.id || '')).filter(value => project.units.some(unit => unit.id === value))} recipients={state.contacts.map(contact => ({ id: contact.id, fullName: contact.fullName, email: contact.email, phone: contact.phone, classification: contact.classification }))} canApplyManualDiscount canUseDirectInvestor brokerName="Equipo comercial" editMode={{ presentationId: item.id, title: item.title, token: item.sharedToken, url: item.sharedUrl, snapshot }} />;
}
