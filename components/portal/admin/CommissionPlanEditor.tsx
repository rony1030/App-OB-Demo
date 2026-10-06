'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, DollarSign, CheckCircle2 } from 'lucide-react';
import { saveCommissionMilestonesAction, getCommissionMilestonesAction } from '@/app/portal/admin/projects/commission-actions';
import { TRIGGER_TYPE_LABELS, type TriggerType } from '@/lib/commission-milestones-constants';

type Milestone = {
  key: number;
  milestoneOrder: number;
  commissionPct: number;
  triggerType: TriggerType;
  triggerValue: number | null;
  description: string | null;
};

const TRIGGER_TYPES = Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[];

let nextKey = 1000;

function emptyMilestone(order: number): Milestone {
  return { key: ++nextKey, milestoneOrder: order, commissionPct: 0, triggerType: 'client_payment_pct', triggerValue: null, description: null };
}

export default function CommissionPlanEditor({
  projectId,
  projectName,
  commissionRate,
  initialMilestones,
}: {
  projectId: number;
  projectName: string;
  commissionRate: number | null;
  initialMilestones: Milestone[];
}) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    initialMilestones.length > 0 ? initialMilestones : []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string }>({});

  useEffect(() => {
    let active = true;
    getCommissionMilestonesAction(projectId).then((data) => {
      if (!active) return;
      if (data.length > 0) {
        setMilestones(data.map((m, i) => ({ ...m, key: ++nextKey })));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [projectId]);

  const total = milestones.reduce((s, m) => s + (m.commissionPct || 0), 0);

  function addMilestone() {
    setMilestones((prev) => [...prev, emptyMilestone(prev.length + 1)]);
  }

  function removeMilestone(key: number) {
    setMilestones((prev) => prev.filter((m) => m.key !== key).map((m, i) => ({ ...m, milestoneOrder: i + 1 })));
  }

  function updateMilestone(key: number, patch: Partial<Milestone>) {
    setMilestones((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  async function handleSave() {
    setSaving(true);
    setResult({});
    const res = await saveCommissionMilestonesAction(
      projectId,
      milestones.map((m) => ({
        milestoneOrder: m.milestoneOrder,
        commissionPct: m.commissionPct,
        triggerType: m.triggerType,
        triggerValue: m.triggerValue,
        description: m.description,
      }))
    );
    setResult(res);
    setSaving(false);
  }

  function addPreset(type: 'full' | 'split2' | 'split3') {
    if (type === 'full') {
      setMilestones([
        { key: ++nextKey, milestoneOrder: 1, commissionPct: 100, triggerType: 'client_payment_pct', triggerValue: 20, description: null },
      ]);
    } else if (type === 'split2') {
      setMilestones([
        { key: ++nextKey, milestoneOrder: 1, commissionPct: 50, triggerType: 'client_payment_pct', triggerValue: 10, description: null },
        { key: ++nextKey, milestoneOrder: 2, commissionPct: 50, triggerType: 'contract_signed', triggerValue: null, description: null },
      ]);
    } else {
      setMilestones([
        { key: ++nextKey, milestoneOrder: 1, commissionPct: 25, triggerType: 'client_payment_pct', triggerValue: 10, description: null },
        { key: ++nextKey, milestoneOrder: 2, commissionPct: 25, triggerType: 'client_payment_pct', triggerValue: 20, description: null },
        { key: ++nextKey, milestoneOrder: 3, commissionPct: 50, triggerType: 'unit_delivery', triggerValue: null, description: null },
      ]);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Plan de pago de comisiones"} /></h3>
        </div>
        {commissionRate != null && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">{commissionRate}<LocalizedText text={"% del valor de venta"} /></span>
        )}
      </div>

      <p className="text-[11px] text-slate-500"><LocalizedText text={"Define cuándo y cómo se paga la comisión del "} />{commissionRate ?? '—'}<LocalizedText text={"% para "} /><strong>{projectName}</strong><LocalizedText text={". Los porcentajes deben sumar 100%."} /></p>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /><LocalizedText text={" Cargando plan de comisiones..."} /></div>
      )}

      {!loading && milestones.length === 0 && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400"><LocalizedText text={"No hay plan configurado. Usa una plantilla o agrega hitos manualmente."} /></p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addPreset('full')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"100% al pagar 20%"} /></button>
            <button type="button" onClick={() => addPreset('split2')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"50/50 (10% + contrato)"} /></button>
            <button type="button" onClick={() => addPreset('split3')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"25/25/50 (10% + 20% + entrega)"} /></button>
          </div>
        </div>
      )}

      {milestones.map((m) => (
        <div key={m.key} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-[auto_1fr_1fr_auto]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
            {m.milestoneOrder}
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-bold text-slate-500"><LocalizedText text={"% de la comisión"} /></label>
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="number"
              value={m.commissionPct || ''}
              onChange={(e) => updateMilestone(m.key, { commissionPct: Number(e.target.value) })}
              min={0}
              max={100}
              step={0.5}
              placeholder="Ej. 50"
              className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
            /></UITranslationBoundary>
          </div>

          <div>
            <label className="mb-0.5 block text-[10px] font-bold text-slate-500"><LocalizedText text={"Condición"} /></label>
            <select
              value={m.triggerType}
              onChange={(e) => updateMilestone(m.key, { triggerType: e.target.value as TriggerType, triggerValue: null, description: null })}
              className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <button type="button" onClick={() => removeMilestone(m.key)} className="mt-4 flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 sm:mt-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {m.triggerType === 'client_payment_pct' && (
            <div className="col-span-full ml-10">
              <label className="mb-0.5 block text-[10px] font-bold text-slate-500"><LocalizedText text={"Cliente paga el (%) del inmueble"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                type="number"
                value={m.triggerValue ?? ''}
                onChange={(e) => updateMilestone(m.key, { triggerValue: Number(e.target.value) })}
                min={1}
                max={100}
                placeholder="Ej. 20"
                className="h-8 w-40 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
              /></UITranslationBoundary>
            </div>
          )}

          {m.triggerType === 'custom' && (
            <div className="col-span-full ml-10">
              <label className="mb-0.5 block text-[10px] font-bold text-slate-500"><LocalizedText text={"Descripción de la condición"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                type="text"
                value={m.description ?? ''}
                onChange={(e) => updateMilestone(m.key, { description: e.target.value })}
                placeholder="Describe cuándo se paga..."
                className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-blue-400"
              /></UITranslationBoundary>
            </div>
          )}
        </div>
      ))}

      {milestones.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <button type="button" onClick={addMilestone} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800">
              <Plus className="h-3.5 w-3.5" /><LocalizedText text={" Agregar hito"} /></button>
            <span className={`text-[11px] font-bold ${Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}><LocalizedText text={"Total: "} />{total.toFixed(1)}%
            </span>
          </div>

          {result.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{result.error}</p>}
          {result.success && (
            <p className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /><LocalizedText text={" Plan de comisiones guardado."} /></p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || Math.abs(total - 100) >= 0.01}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}<LocalizedText text={"Guardar plan de comisiones"} /></button>
        </>
      )}
    </div>
  );
}
