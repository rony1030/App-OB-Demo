'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState, useTransition } from 'react';
import { CalendarClock, CheckCircle2, ImageIcon, Pause, Pencil, Play, Plus, Tag, Trash2, X } from 'lucide-react';
import {
  archiveMarketingOfferAction,
  saveMarketingOfferAction,
  setMarketingOfferStatusAction,
} from '@/app/portal/admin/offers/actions';
import type { MarketingOffer, MarketingOfferPlacement, MarketingOfferStatus, MarketingOfferType } from '@/lib/data/marketing-offers';
import { cn } from '@/lib/utils';
import { requestConfirmation } from '@/components/feedback/AppNotifications';

type ProjectOption = { id: number; name: string; developer?: string };

const placementLabels: Record<MarketingOfferPlacement, string> = {
  header_banner: 'Banner en el encabezado',
  side_card: 'Tarjeta lateral',
  popup: 'Ventana emergente',
  fullscreen: 'Pantalla completa',
};

const statusLabels: Record<MarketingOfferStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  paused: 'Pausada',
  archived: 'Archivada',
};

function localDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date);
  return parts.replace(' ', 'T');
}

function defaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return localDateTime(date.toISOString());
}

export default function MarketingOffersManager({ offers, projects, nowIso }: { offers: MarketingOffer[]; projects: ProjectOption[]; nowIso: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<MarketingOffer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [offerType, setOfferType] = useState<MarketingOfferType>('promotion');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const projectNames = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);

  function openCreate() {
    setEditing(null);
    setOfferType('promotion');
    setFeedback(null);
    setFormOpen(true);
  }

  function openEdit(offer: MarketingOffer) {
    setEditing(offer);
    setOfferType(offer.offerType);
    setFeedback(null);
    setFormOpen(true);
  }

  function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveMarketingOfferAction(formData);
      if (result.error) {
        setFeedback({ type: 'error', message: result.error });
        return;
      }
      setFeedback({ type: 'success', message: editing ? 'Oferta actualizada.' : 'Oferta creada.' });
      setFormOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  function changeStatus(offer: MarketingOffer) {
    const nextStatus = offer.status === 'active' ? 'paused' : 'active';
    startTransition(async () => {
      const result = await setMarketingOfferStatusAction(offer.id, nextStatus);
      setFeedback(result.error ? { type: 'error', message: result.error } : { type: 'success', message: nextStatus === 'active' ? 'Oferta activada.' : 'Oferta pausada.' });
      if (!result.error) router.refresh();
    });
  }

  async function archiveOffer(offer: MarketingOffer) {
    if (!(await requestConfirmation(`¿Eliminar “${offer.title}”? Se archivará y dejará de estar disponible para los agentes.`))) return;
    startTransition(async () => {
      const result = await archiveMarketingOfferAction(offer.id);
      setFeedback(result.error ? { type: 'error', message: result.error } : { type: 'success', message: 'Oferta eliminada del catálogo activo.' });
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="portal-enter mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600"><LocalizedText text={"Marketing del catálogo"} /></p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Ofertas y promociones"} /></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500"><LocalizedText text={"Prepara aquí los beneficios autorizados. Los agentes solo podrán aplicarlos; nunca escribir o alterar el descuento."} /></p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700">
          <Plus className="h-4 w-4" /><LocalizedText text={" Nueva oferta"} /></button>
      </header>

      {feedback && <div role="status" className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>{feedback.message}</div>}

      {formOpen && (
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">{editing ? <LocalizedText text={"Editar beneficio"} /> : <LocalizedText text={"Nuevo beneficio"} />}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-950">{editing?.title || 'Configurar oferta autorizada'}</h2>
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setFormOpen(false)} aria-label="Cerrar formulario" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></UITranslationBoundary>
          </div>

          <form key={editing?.id || 'new'} onSubmit={submitOffer} className="mt-6 grid gap-5 lg:grid-cols-2">
            {editing && <input type="hidden" name="offerId" value={editing.id} />}
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Nombre interno y visible"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input name="title" required maxLength={120} defaultValue={editing?.title} placeholder="Ej. Bono de cierre septiembre" className="editor-input h-11 text-sm" /></UITranslationBoundary>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Tipo"} /></span>
              <select name="offerType" value={offerType} onChange={(event) => setOfferType(event.target.value as MarketingOfferType)} className="editor-input h-11 text-sm">
                <option value="promotion"><LocalizedText text={"Promoción"} /></option>
                <option value="discount"><LocalizedText text={"Descuento"} /></option>
              </select>
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Descripción para los agentes"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><textarea name="description" maxLength={1200} rows={3} defaultValue={editing?.description} placeholder="Explica condiciones, alcance y cómo comunicarla." className="editor-textarea text-sm" /></UITranslationBoundary>
            </label>
            {offerType === 'discount' ? (
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Descuento autorizado"} /></span>
                <div className="relative"><input name="discountPercent" required min="0.01" max="100" step="0.01" type="number" defaultValue={editing?.discountPercent || ''} className="editor-input h-11 pr-10 text-sm" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span></div>
              </label>
            ) : (
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Texto de la promoción"} /></span>
                <UITranslationBoundary attributes={["placeholder"]}><input name="promotionText" required maxLength={500} defaultValue={editing?.promotionText || ''} placeholder="Ej. Bono de mobiliario incluido" className="editor-input h-11 text-sm" /></UITranslationBoundary>
              </label>
            )}
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Dónde se anuncia"} /></span>
              <select name="displayPlacement" defaultValue={editing?.displayPlacement || 'header_banner'} className="editor-input h-11 text-sm">
                {Object.entries(placementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Inicio · hora de Santo Domingo"} /></span>
              <input name="startsAt" required type="datetime-local" defaultValue={localDateTime(editing?.startsAt)} className="editor-input h-11 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Final · hora de Santo Domingo"} /></span>
              <input name="endsAt" required type="datetime-local" defaultValue={editing ? localDateTime(editing.endsAt) : defaultEndDate()} className="editor-input h-11 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Estado inicial"} /></span>
              <select name="status" defaultValue={editing?.status || 'draft'} className="editor-input h-11 text-sm">
                <option value="draft"><LocalizedText text={"Borrador"} /></option>
                <option value="active"><LocalizedText text={"Activa"} /></option>
                <option value="paused"><LocalizedText text={"Pausada"} /></option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-700"><LocalizedText text={"Banner opcional · JPG, PNG o WebP, máximo 5 MB"} /></span>
              <input name="banner" type="file" accept="image/jpeg,image/png,image/webp" className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-bold file:text-blue-700" />
            </label>

            <fieldset className="lg:col-span-2">
              <legend className="text-xs font-bold text-slate-700"><LocalizedText text={"Proyectos incluidos"} /></legend>
              <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"La oferta solo aparecerá en propuestas de estos proyectos."} /></p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <label key={project.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40">
                    <input type="checkbox" name="projectIds" value={project.id} defaultChecked={editing?.projectIds.includes(project.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{project.name}</span>{project.developer && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{project.developer}</span>}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 lg:col-span-2">
              <button type="button" onClick={() => setFormOpen(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"Cancelar"} /></button>
              <button type="submit" disabled={isPending} className="h-11 rounded-xl bg-blue-600 px-6 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">{isPending ? 'Guardando…' : editing ? <LocalizedText text={"Guardar cambios"} /> : <LocalizedText text={"Crear oferta"} />}</button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {offers.map((offer) => {
          const now = new Date(nowIso).getTime();
          const inWindow = new Date(offer.startsAt).getTime() <= now && new Date(offer.endsAt).getTime() > now;
          return (
            <article key={offer.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {offer.bannerUrl ? <div className="relative aspect-[16/5] bg-slate-100"><UITranslationBoundary attributes={["alt"]}><Image src={offer.bannerUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></UITranslationBoundary></div> : <div className="flex h-20 items-center justify-center bg-gradient-to-r from-blue-950 to-blue-700 text-blue-100"><ImageIcon className="h-6 w-6" /></div>}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide', offer.status === 'active' && inWindow ? 'bg-emerald-50 text-emerald-700' : offer.status === 'paused' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{statusLabels[offer.status]}{offer.status === 'active' && !inWindow ? ' · fuera de fecha' : ''}</span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-blue-700">{offer.offerType === 'discount' ? `${offer.discountPercent}% descuento` : <LocalizedText text={"Promoción"} />}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold text-slate-950">{offer.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{offer.promotionText || offer.description || 'Sin descripción adicional.'}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Tag className="h-5 w-5" /></span>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />{new Date(offer.startsAt).toLocaleDateString('es-DO')} – {new Date(offer.endsAt).toLocaleDateString('es-DO')}</p>
                  <p className="truncate">{placementLabels[offer.displayPlacement]}</p>
                  <p className="sm:col-span-2">{offer.projectIds.map((id) => projectNames.get(id)).filter(Boolean).join(' · ') || 'Sin proyectos asociados'}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => openEdit(offer)} disabled={isPending} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /><LocalizedText text={"Editar"} /></button>
                  <button type="button" onClick={() => changeStatus(offer)} disabled={isPending} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{offer.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{offer.status === 'active' ? 'Pausar' : 'Activar'}</button>
                  <button type="button" onClick={() => archiveOffer(offer)} disabled={isPending} className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /><LocalizedText text={"Eliminar"} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!offers.length && !formOpen && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><CheckCircle2 className="h-6 w-6" /></span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-950"><LocalizedText text={"Aún no hay ofertas configuradas"} /></h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500"><LocalizedText text={"Crea la primera cuando exista una condición comercial o promoción aprobada para el catálogo."} /></p>
        </section>
      )}
    </div>
  );
}
