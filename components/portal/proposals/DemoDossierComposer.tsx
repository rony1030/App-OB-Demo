'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicDossierViewer, { type SlideBlock } from '@/components/portal/PublicDossierViewer';
import { changeWorkflow } from '@/lib/demo/browser-workflow';
import type { PortalProject } from '@/lib/portal-projects';
import type { ProposalListItem } from '@/app/portal/proposals/actions';
import type { Json } from '@/types/database';

export default function DemoDossierComposer({ project, blocks, item }: { project: PortalProject; blocks: SlideBlock[]; item?: ProposalListItem }) {
  const [title, setTitle] = useState(item?.title || `${project.name} · Dossier comercial`);
  const [description, setDescription] = useState(String(blocks.find(block => block.type === 'editorial')?.body || project.description));
  const [url, setUrl] = useState(item?.sharedUrl || ''); const [error, setError] = useState('');
  const prepared = blocks.map(block => block.type === 'editorial' ? { ...block, body: description } : block);
  return <div className="space-y-6"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-2xl font-bold">Personalizar dossier</h1><form className="mt-5 space-y-4" onSubmit={event => {
    event.preventDefault();
    try {
      const id = item?.id || Date.now(); const token = item?.sharedToken || crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().slice(0, 8); const link = `/p/${token}`; const now = new Date().toISOString();
      changeWorkflow(state => { state.proposals = [{ ...item, id, kind: 'dossier', title, status: 'ready', createdAt: item?.createdAt || now, updatedAt: now, projectName: project.name, projectSlug: project.slug, coverImage: project.image, sharedToken: token, sharedUrl: link, snapshot: { blocks: prepared, project_slug: project.slug, project: project.name } as unknown as Json }, ...state.proposals.filter(value => value.id !== id)]; }); setUrl(link); setError('');
    } catch { setError('No se pudo guardar el dossier.'); }
  }}><label className="block text-sm font-semibold">Título<input required value={title} onChange={event => setTitle(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="block text-sm font-semibold">Descripción del proyecto<textarea required value={description} onChange={event => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3" /></label><button className="min-h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white">Guardar dossier</button>{url && <Link href={url} className="ml-4 font-semibold text-blue-900 underline">Abrir dossier guardado</Link>}{error && <p role="alert">{error}</p>}</form></div><PublicDossierViewer blocks={prepared} projectName={project.name} projectSlug={project.slug} title={title} brokerName="Equipo comercial" brokerPhone="" agencyName="Horizonte Asesores Inmobiliarios" /></div>;
}
