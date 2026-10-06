'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { CheckCircle2, Languages, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { reviewTranslationAction, translateContentAction } from '@/app/portal/translations/actions';
import type { Locale } from '@/lib/i18n/locale';

type TranslatableEntityType = 'project' | 'landing' | 'proposal' | 'dossier';

const entityOptions: Array<{ value: TranslatableEntityType; label: string }> = [
  { value: 'landing', label: 'Landing de proyecto' },
  { value: 'project', label: 'Proyecto' },
  { value: 'proposal', label: 'Propuesta' },
  { value: 'dossier', label: 'Dossier' },
];

export default function TranslationWorkbench() {
  const [entityType, setEntityType] = useState<TranslatableEntityType>('landing');
  const [targetLocale, setTargetLocale] = useState<Locale>('en');
  const [sourceText, setSourceText] = useState('Bienvenido a nuestra plataforma de propiedades.');
  const [translation, setTranslation] = useState('');
  const [translationId, setTranslationId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [review, setReview] = useState<{ status: string; score: number | null; findings: string[]; suggestedText: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setMessage('');
    setReview(null);
    startTransition(async () => {
      const result = await translateContentAction({
        entityType,
        entityId: 'translation-sandbox',
        fieldPath: `sandbox.${entityType}.sample`,
        sourceLocale: 'es',
        targetLocale,
        sourceText,
        context: 'Validation sample for the translation workflow.',
      });
      if (!result.success) {
        setMessage(result.error || 'No se pudo generar la traducción.');
        return;
      }
      setTranslation(result.translation || '');
      setTranslationId(result.translationId || null);
      setMessage(result.status === 'reviewed' ? 'Se cargó una versión revisada guardada.' : 'Traducción guardada para revisión.');
    });
  }

  function verify() {
    if (!translationId) return;
    setMessage('');
    startTransition(async () => {
      const result = await reviewTranslationAction(translationId);
      if (!result.success || !result.review) {
        setMessage(result.error || 'No se pudo revisar la traducción.');
        return;
      }
      setReview(result.review);
      setMessage('La revisión de calidad quedó registrada en Supabase.');
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Traducciones IA"} /></h2>
            <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Genera, guarda y valida una muestra antes de traducir contenido real."} /></p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /><LocalizedText text={" Gemini con respaldo"} /></span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-slate-700"><LocalizedText text={"Contenido"} /><select value={entityType} onChange={(event) => setEntityType(event.target.value as TranslatableEntityType)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-violet-500">
                {entityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-slate-700"><LocalizedText text={"Traducir a"} /><select value={targetLocale} onChange={(event) => setTargetLocale(event.target.value as Locale)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-violet-500">
                <option value="en"><LocalizedText text={"English"} /></option>
                <option value="fr"><LocalizedText text={"Français"} /></option>
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-bold text-slate-700"><LocalizedText text={"Texto original en español"} /><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} rows={5} className="resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-violet-500" />
          </label>
          <button type="button" onClick={generate} disabled={isPending || !sourceText.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}<LocalizedText text={"Generar y guardar"} /></button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"><LocalizedText text={"Resultado guardado"} /></p>
          <p className="mt-3 min-h-20 whitespace-pre-wrap text-sm leading-6 text-slate-800">{translation || 'Todavía no hay una traducción generada.'}</p>
          {translationId && (
            <button type="button" onClick={verify} disabled={isPending} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition hover:border-violet-400 hover:text-violet-700 disabled:opacity-60">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}<LocalizedText text={"Verificar calidad"} /></button>
          )}
          {review && (
            <div className={`mt-4 rounded-lg border p-3 ${review.status === 'passed' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-xs font-extrabold text-slate-900"><LocalizedText text={"Puntuación "} />{review.score ?? '—'} / 5</p>
              {review.findings.length > 0 && <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">{review.findings.map((finding) => <li key={finding}>• {finding}</li>)}</ul>}
              {review.suggestedText && <p className="mt-2 text-xs leading-5 text-slate-700"><strong><LocalizedText text={"Versión sugerida:"} /></strong> {review.suggestedText}</p>}
            </div>
          )}
        </div>
      </div>
      {message && <p className={`mt-4 text-xs font-medium ${message.includes('No se pudo') ? 'text-rose-700' : 'text-emerald-700'}`}>{message}</p>}
    </section>
  );
}
