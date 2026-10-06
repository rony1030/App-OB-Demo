'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { Bell, Check, Plus, Trash2 } from 'lucide-react';
import { addMasterBrokerRecipientAction, removeMasterBrokerRecipientAction } from '@/app/portal/admin/brokers/[slug]/actions';

type Kind = 'leads' | 'payments' | 'reservations';
const labels: Array<[Kind, string]> = [['leads', 'Reporte de clientes'], ['payments', 'Pagos y acuerdos'], ['reservations', 'Reservas y operaciones']];

export default function MasterBrokerNotificationSettings({ organizationId, recipients }: { organizationId: number; recipients: Record<Kind, string[]> }) {
  const [kind, setKind] = useState<Kind>('leads');
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const add = () => startTransition(async () => {
    const result = await addMasterBrokerRecipientAction({ organizationId, kind, email, label });
    if (result.error) return setNotice(result.error);
    setEmail(''); setLabel(''); setNotice('Destinatario agregado.'); window.location.reload();
  });

  const remove = (targetKind: Kind, targetEmail: string) => startTransition(async () => {
    const result = await removeMasterBrokerRecipientAction({ organizationId, kind: targetKind, email: targetEmail });
    if (result.error) return setNotice(result.error);
    setNotice('Destinatario retirado.'); window.location.reload();
  });

  return <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/50 p-4"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-blue-600" /><div><h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Configuración privada de reportes y correos"} /></h2><p className="mt-1 text-[10px] text-slate-500"><LocalizedText text={"Solo visible y editable por el superadministrador."} /></p></div></div><button type="button" onClick={() => setIsOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-blue-700"><Plus className="h-3.5 w-3.5" /><LocalizedText text={"Configurar"} /></button></div>
    {isOpen && <div className="space-y-4 p-4"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto]"><select value={kind} onChange={(event) => setKind(event.target.value as Kind)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"><option value="leads"><LocalizedText text={"Reporte de clientes"} /></option><option value="payments"><LocalizedText text={"Pagos y acuerdos"} /></option><option value="reservations"><LocalizedText text={"Reservas y operaciones"} /></option></select><UITranslationBoundary attributes={["placeholder"]}><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Etiqueta (opcional)" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" /></UITranslationBoundary><UITranslationBoundary attributes={["placeholder"]}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@empresa.com" className="rounded-xl border border-slate-200 px-3 py-2 text-xs" /></UITranslationBoundary><button type="button" disabled={isPending} onClick={add} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50"><LocalizedText text={"Agregar"} /></button></div>{notice && <p className="text-xs font-bold text-blue-700">{notice}</p>}<div className="grid gap-3 sm:grid-cols-3">{labels.map(([targetKind, title]) => <div key={targetKind} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[11px] font-extrabold text-slate-900">{title}</p><div className="mt-2 space-y-1.5">{recipients[targetKind].length ? recipients[targetKind].map((targetEmail) => <div key={targetEmail} className="flex items-center justify-between gap-2"><span className="truncate text-[10px] text-slate-600">{targetEmail}</span><UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => remove(targetKind, targetEmail)} title="Retirar destinatario" className="shrink-0 rounded-md p-1 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3 w-3" /></button></UITranslationBoundary></div>) : <p className="text-[10px] text-slate-400"><LocalizedText text={"Sin destinatarios"} /></p>}</div></div>)}</div><p className="flex items-center gap-1 text-[10px] text-slate-500"><Check className="h-3.5 w-3.5 text-emerald-600" /><LocalizedText text={"Los cambios se aplican a los reportes del Master Broker."} /></p></div>}
  </section>;
}
