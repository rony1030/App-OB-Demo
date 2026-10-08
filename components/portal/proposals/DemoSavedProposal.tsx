'use client';
import { useState } from 'react';
import PublicDossierViewer, { type SlideBlock } from '@/components/portal/PublicDossierViewer';
import { useWorkflow } from '@/lib/demo/use-workflow';
import { changeWorkflow } from '@/lib/demo/browser-workflow';
import type { ProposalMagazineItem } from '@/components/presentations/ProposalMagazinePage';
import type { ProposalListItem } from '@/app/portal/proposals/actions';

export default function DemoSavedProposal({ token, seed }: { token: string; seed?: ProposalListItem }) {
  const { state, ready } = useWorkflow(); const [error, setError] = useState('');
  const candidate = state.proposals.find(proposal => proposal.sharedToken === token) || seed;
  const item = candidate?.status !== 'archived' ? candidate : undefined;
  if (!ready) return <p className="p-10 text-center">Cargando propuesta…</p>;
  if (!item) return <div className="p-10 text-center"><h1 className="text-xl font-bold">Propuesta no disponible</h1><p className="mt-3 text-sm">Abre el enlace desde el navegador donde guardaste la propuesta.</p></div>;
  const snapshot = item.snapshot as Record<string, unknown>;
  function decide(decision: 'accepted' | 'rejected') {
    try { changeWorkflow(current => { const proposal = current.proposals.find(value => value.id === item!.id); if (proposal) { proposal.decision = decision; proposal.status = decision; proposal.updatedAt = new Date().toISOString(); } }); } catch { setError('No se pudo guardar la respuesta. Vuelve a intentarlo.'); }
  }
  return <><PublicDossierViewer blocks={snapshot.blocks as SlideBlock[]} projectName={item.projectName || 'Proyecto inmobiliario'} projectSlug={item.projectSlug || 'proposal'} title={item.title} brokerName="Equipo comercial" brokerPhone="" agencyName="Horizonte Asesores Inmobiliarios" clientName={item.clientName} variant={item.kind === 'dossier' ? 'dossier' : 'proposal'} proposalItems={snapshot.items as ProposalMagazineItem[]} />
    {item.kind === 'proposal' && <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-5 text-sm">{item.decision ? <p role="status" className="font-semibold">{item.decision === 'accepted' ? 'Propuesta aceptada. Tu asesor continuará con la negociación.' : 'Respuesta registrada. Tu asesor se pondrá en contacto.'}</p> : <><button onClick={() => decide('accepted')} className="min-h-11 rounded-xl bg-slate-950 px-5 text-white">Aceptar propuesta</button><button onClick={() => decide('rejected')} className="min-h-11 rounded-xl border border-slate-300 px-5">Solicitar otra opción</button></>}{error && <p role="alert">{error}</p>}</div>}
  </>;
}
