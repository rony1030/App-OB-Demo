'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useActionState, useState } from 'react';
import { ChevronDown, ChevronUp, Landmark, Loader2 } from 'lucide-react';
import { updateOwnOrganizationLegalInfoAction } from '@/app/portal/admin/actions';
import { cn } from '@/lib/utils';
import type { OrganizationLegalInfo } from '@/lib/data/admin';

type ActionState = { success?: boolean; error?: string };

export default function OrgLegalInfoCard({
  organizationName,
  legalInfo,
}: {
  organizationName: string;
  legalInfo: OrganizationLegalInfo;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateOwnOrganizationLegalInfoAction, {});
  const isComplete = Boolean(legalInfo.taxId && legalInfo.legalAddress);
  const [open, setOpen] = useState(!isComplete);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <Landmark className="h-4 w-4 text-blue-600" />
          <div>
            <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Datos legales de "} />{organizationName}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isComplete
                ? <LocalizedText text={"RNC y domicilio ya configurados. Estos datos aparecen en los acuerdos de colaboración que emitas."} />
                : <LocalizedText text={"Faltan datos: aparecerán como \"(dato pendiente)\" en los acuerdos de colaboración hasta completarlos."} />}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <form action={formAction} className="space-y-3 border-t border-slate-100 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Razón social"} /></label>
            <input
              name="legalName"
              defaultValue={legalInfo.legalName || organizationName}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"RNC"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                name="taxId"
                defaultValue={legalInfo.taxId || ''}
                placeholder="Ej. 130-00000-1"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              /></UITranslationBoundary>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Domicilio legal"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                name="legalAddress"
                defaultValue={legalInfo.legalAddress || ''}
                placeholder="Dirección completa"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              /></UITranslationBoundary>
            </div>
          </div>

          {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{state.error}</p>}
          {state.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700"><LocalizedText text={"Datos legales actualizados."} /></p>}

          <button
            type="submit"
            disabled={isPending}
            className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white', isPending && 'opacity-60')}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}<LocalizedText text={"Guardar"} /></button>
        </form>
      )}
    </section>
  );
}
