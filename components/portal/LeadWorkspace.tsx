'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  CircleDollarSign, Clock3, Languages, Mail, MessageSquareText, Phone, Save,
  ShieldCheck, UserRound, Users,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { createLeadAction } from '@/app/portal/crm/actions';
import { createWorkflowContact } from '@/lib/demo/browser-workflow';

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  classification: string;
  priority: string;
  source: string;
  language: string;
  tags: string;
  project: string;
  unit: string;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: string;
  objective: string;
  timeframe: string;
  stage: string;
  owner: string;
  followUpDate: string;
  followUpTime: string;
  preferredChannel: string;
  notes: string;
  identityDocument: string;
  jobPlace: string;
  instagram: string;
  linkedin: string;
  dndEmail: boolean;
  dndWhatsapp: boolean;
  dndCalls: boolean;
};

export interface LeadWorkspaceProps {
  projectNames: string[];
  currentUser?: {
    id: string;
    displayName: string;
    membershipId: number;
  } | null;
  agencyAgents?: Array<{
    membershipId: number;
    displayName: string;
    email?: string | null;
  }>;
}

export default function LeadWorkspace({
  projectNames,
  currentUser,
  agencyAgents = [],
}: LeadWorkspaceProps) {
  const router = useRouter();

  const defaultOwner = currentUser?.displayName || 'Sin asignar';

  const [form, setForm] = useState<LeadForm>(() => ({
    name: '', email: '', phone: '', classification: 'Inversionista', priority: 'Media', source: 'Referido', language: 'Español', tags: '',
    project: '', unit: '', budgetMin: '', budgetMax: '', budgetCurrency: 'USD', objective: 'Inversión', timeframe: '3 a 6 meses', stage: 'Nuevo',
    owner: defaultOwner,
    followUpDate: '', followUpTime: '', preferredChannel: 'WhatsApp', notes: '', identityDocument: '', jobPlace: '', instagram: '', linkedin: '',
    dndEmail: false, dndWhatsapp: false, dndCalls: false,
  }));
  const [advanced, setAdvanced] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const availableOwners = useMemo(() => {
    const list: string[] = [];
    if (currentUser?.displayName) {
      list.push(currentUser.displayName);
    }
    for (const ag of agencyAgents) {
      if (ag.displayName && !list.includes(ag.displayName)) {
        list.push(ag.displayName);
      }
    }
    if (!list.includes('Equipo comercial')) {
      list.push('Equipo comercial');
    }
    if (!list.includes('Sin asignar')) {
      list.push('Sin asignar');
    }
    return list;
  }, [agencyAgents, currentUser]);


  const initials = form.name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NL';
  const possibleDuplicate = /carlos@inversiones\.com|sofia\.ramirez@email\.com/i.test(form.email);
  const completion = [form.name, form.email, form.phone, form.project, form.budgetMax, form.followUpDate].filter(Boolean).length;

  function set<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 4 || digits.length > 15) {
      setError('Escribe el teléfono completo o exactamente los últimos 4 dígitos.');
      setStatus('error');
      return;
    }

    setStatus('saving');

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('classification', form.classification);
    formData.append('priority', form.priority);
    formData.append('source', form.source);
    formData.append('language', form.language);
    formData.append('tags', form.tags);
    formData.append('project', form.project);
    formData.append('budgetMin', form.budgetMin);
    formData.append('budgetMax', form.budgetMax);
    formData.append('budgetCurrency', form.budgetCurrency);
    formData.append('objective', form.objective);
    formData.append('notes', form.notes);
    formData.append('dndEmail', String(form.dndEmail));
    formData.append('dndWhatsapp', String(form.dndWhatsapp));
    formData.append('dndCalls', String(form.dndCalls));
    formData.append('stage', form.stage);
    formData.append('owner', form.owner);

    const selectedAgent = agencyAgents.find((a) => a.displayName === form.owner);
    const targetMembershipId = selectedAgent
      ? selectedAgent.membershipId
      : form.owner === currentUser?.displayName
      ? currentUser?.membershipId
      : null;

    if (targetMembershipId) {
      formData.append('ownerMembershipId', String(targetMembershipId));
    }

    try {
      if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
        const contact = createWorkflowContact(formData);
        setStatus('saved');
        router.push(`/portal/clientes/${contact.publicCode}`);
        return;
      }
      const result = await createLeadAction(formData);

      if (result.error) {
        setError(result.error);
        setStatus('error');
      } else {
        setStatus('saved');
        if (result.contactPublicCode) {
          router.push(`/portal/clientes/${result.contactPublicCode}`);
        } else {
          router.push('/portal/clientes');
        }
      }
    } catch {
      setError(process.env.NEXT_PUBLIC_APP_SCOPE === 'demo'
        ? 'No se pudo guardar el lead. Revisa el almacenamiento y vuelve a intentarlo.'
        : 'No se pudo guardar el lead. Revisa tu conexión y vuelve a intentarlo.');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={saveLead} className="portal-enter mx-auto max-w-[1440px] space-y-5 pb-24">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <UITranslationBoundary attributes={["aria-label"]}><Link href="/portal/leads" aria-label="Volver al pipeline" className="mt-0.5 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></Link></UITranslationBoundary>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600"><LocalizedText text={"CRM · Nuevo registro"} /></p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950"><LocalizedText text={"Crear lead"} /></h1><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Registra, clasifica y deja programado el próximo paso comercial."} /></p></div>
        </div>
        <div className="flex items-center gap-2"><span className="hidden text-[10px] font-bold text-slate-400 sm:block">{completion}<LocalizedText text={"/6 datos clave"} /></span><Link href="/portal/leads" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600"><LocalizedText text={"Cancelar"} /></Link><button type="submit" disabled={status === 'saving' || status === 'saved'} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-70">{status === 'saved' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{status === 'saving' ? 'Guardando…' : status === 'saved' ? 'Lead guardado' : <LocalizedText text={"Guardar lead"} />}</button></div>
      </header>

      {possibleDuplicate && <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div><p className="text-xs font-extrabold text-blue-900"><LocalizedText text={"Posible contacto existente"} /></p><p className="mt-1 text-[11px] leading-5 text-blue-700">{process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? 'El correo coincide con un contacto registrado.' : <LocalizedText text={"El correo coincide con un registro previo. Se verificarán duplicados automáticamente en la base de datos."} />}</p></div></div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <UITranslationBoundary attributes={["title","description"]}><FormSection icon={UserRound} eyebrow="Identificación" title="Contacto principal" description="Solo nombre, correo y teléfono son obligatorios.">
            <div className="grid gap-4 md:grid-cols-2"><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Nombre completo" required value={form.name} onChange={(value) => set('name', value)} placeholder="Ej. Laura Pérez" /></UITranslationBoundary><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Correo electrónico" required type="email" value={form.email} onChange={(value) => set('email', value)} placeholder="laura@email.com" /></UITranslationBoundary></div>
            <div className="grid gap-4 md:grid-cols-2"><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Teléfono o últimos 4 dígitos" required value={form.phone} onChange={(value) => set('phone', value)} placeholder="+1 829 000 0000 o 1841" /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Idioma preferido" value={form.language} onChange={(value) => set('language', value)} options={['Español', 'English', 'Français']} /></UITranslationBoundary></div>
            <div className="grid gap-4 md:grid-cols-3"><UITranslationBoundary attributes={["label"]}><SelectField label="Clasificación" value={form.classification} onChange={(value) => set('classification', value)} options={['Inversionista', 'Comprador final', 'Broker / aliado', 'Referido', 'Propietario']} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Prioridad" value={form.priority} onChange={(value) => set('priority', value)} options={['Alta', 'Media', 'Baja', 'Fase cero']} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Origen" value={form.source} onChange={(value) => set('source', value)} options={['Referido', 'WhatsApp', 'Instagram', 'Facebook', 'Google', 'Evento', 'Portal web', 'Llamada', 'Otro']} /></UITranslationBoundary></div>
            <UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Etiquetas" value={form.tags} onChange={(value) => set('tags', value)} placeholder="Ej. inversión, extranjero, renta corta" hint="Separadas por comas" /></UITranslationBoundary>
          </FormSection></UITranslationBoundary>

          <UITranslationBoundary attributes={["title","description"]}><FormSection icon={BriefcaseBusiness} eyebrow="Calificación" title="Interés inmobiliario" description="Relaciona el contacto con su oportunidad real.">
            <div className="grid gap-4 md:grid-cols-2"><UITranslationBoundary attributes={["label"]}><SelectField label="Proyecto de interés" value={form.project} onChange={(value) => set('project', value)} options={['', ...projectNames]} emptyLabel="Seleccionar proyecto" /></UITranslationBoundary><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Unidad o tipología" value={form.unit} onChange={(value) => set('unit', value)} placeholder="Ej. A-301 o 2 habitaciones" /></UITranslationBoundary></div>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_160px]"><UITranslationBoundary attributes={["placeholder"]}><InputField label={`Presupuesto mínimo (${form.budgetCurrency})`} type="number" value={form.budgetMin} onChange={(value) => set('budgetMin', value)} placeholder="150000" /></UITranslationBoundary><UITranslationBoundary attributes={["placeholder"]}><InputField label={`Presupuesto máximo (${form.budgetCurrency})`} type="number" value={form.budgetMax} onChange={(value) => set('budgetMax', value)} placeholder="300000" /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Moneda" value={form.budgetCurrency} onChange={(value) => set('budgetCurrency', value)} options={['USD', 'DOP', 'EUR', 'CAD']} /></UITranslationBoundary></div>
            <div className="grid gap-4 md:grid-cols-2"><UITranslationBoundary attributes={["label"]}><SelectField label="Objetivo" value={form.objective} onChange={(value) => set('objective', value)} options={['Inversión', 'Vivienda', 'Renta corta', 'Segunda vivienda', 'Diversificación', 'Por definir']} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Plazo estimado" value={form.timeframe} onChange={(value) => set('timeframe', value)} options={['Inmediato', '0 a 3 meses', '3 a 6 meses', '6 a 12 meses', 'Más de 12 meses', 'Por definir']} /></UITranslationBoundary></div>
          </FormSection></UITranslationBoundary>

          <UITranslationBoundary attributes={["title","description"]}><FormSection icon={CalendarDays} eyebrow="Operación" title="Pipeline y próximo paso" description="El lead debe entrar con responsable y siguiente acción clara.">
            <div className="grid gap-4 md:grid-cols-2"><UITranslationBoundary attributes={["label"]}><SelectField label="Etapa inicial" value={form.stage} onChange={(value) => set('stage', value)} options={['Nuevo', 'Contactado', 'Calificado', 'Propuesta', 'Negociación']} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Responsable" value={form.owner} onChange={(value) => set('owner', value)} options={availableOwners} /></UITranslationBoundary></div>
            <div className="grid gap-4 md:grid-cols-3"><UITranslationBoundary attributes={["label"]}><InputField label="Próximo seguimiento" type="date" value={form.followUpDate} onChange={(value) => set('followUpDate', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><InputField label="Hora" type="time" value={form.followUpTime} onChange={(value) => set('followUpTime', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SelectField label="Canal preferido" value={form.preferredChannel} onChange={(value) => set('preferredChannel', value)} options={['WhatsApp', 'Correo', 'Llamada', 'Videollamada', 'Presencial']} /></UITranslationBoundary></div>
          </FormSection></UITranslationBoundary>

          <UITranslationBoundary attributes={["title","description"]}><FormSection icon={MessageSquareText} eyebrow="Contexto" title="Notas y preferencias" description="Información útil para que cualquier miembro autorizado continúe la conversación.">
            <UITranslationBoundary attributes={["label","placeholder"]}><TextAreaField label="Notas comerciales" value={form.notes} onChange={(value) => set('notes', value)} placeholder="Intereses, objeciones, motivo de compra, acompañantes y detalles relevantes…" /></UITranslationBoundary>
            <div className="grid gap-3 md:grid-cols-3"><UITranslationBoundary attributes={["label"]}><ChannelToggle icon={Mail} label="No enviar correo (DND)" checked={form.dndEmail} onChange={(value) => set('dndEmail', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><ChannelToggle icon={MessageSquareText} label="No enviar WhatsApp (DND)" checked={form.dndWhatsapp} onChange={(value) => set('dndWhatsapp', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><ChannelToggle icon={Phone} label="No realizar llamadas (DND)" checked={form.dndCalls} onChange={(value) => set('dndCalls', value)} /></UITranslationBoundary></div>
            <button type="button" onClick={() => setAdvanced((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700"><ChevronDown className={cn('h-4 w-4 transition', advanced && 'rotate-180')} />{advanced ? <LocalizedText text={"Ocultar información ampliada"} /> : <LocalizedText text={"Añadir información ampliada"} />}</button>
            {advanced && <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2"><UITranslationBoundary attributes={["label"]}><InputField label="Cédula o pasaporte" value={form.identityDocument} onChange={(value) => set('identityDocument', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><InputField label="Empresa o lugar de trabajo" value={form.jobPlace} onChange={(value) => set('jobPlace', value)} /></UITranslationBoundary><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="Instagram" value={form.instagram} onChange={(value) => set('instagram', value)} placeholder="@usuario" /></UITranslationBoundary><UITranslationBoundary attributes={["label","placeholder"]}><InputField label="LinkedIn" value={form.linkedin} onChange={(value) => set('linkedin', value)} placeholder="linkedin.com/in/…" /></UITranslationBoundary></div>}
          </FormSection></UITranslationBoundary>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-950">{form.name || 'Nuevo lead'}</p><p className="mt-1 truncate text-[10px] text-slate-500">{form.email || 'Sin correo todavía'}</p></div></div><div className="mt-5 space-y-3 border-t border-slate-100 pt-4"><UITranslationBoundary attributes={["label"]}><SummaryRow icon={BadgeCheck} label="Etapa" value={form.stage} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SummaryRow icon={Users} label="Responsable" value={form.owner} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SummaryRow icon={CircleDollarSign} label="Presupuesto" value={form.budgetMax ? `Hasta ${formatCurrency(Number(form.budgetMax), form.budgetCurrency)}` : 'Por definir'} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SummaryRow icon={Languages} label="Idioma" value={form.language} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><SummaryRow icon={Clock3} label="Seguimiento" value={form.followUpDate || 'Sin programar'} /></UITranslationBoundary></div></div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700"><LocalizedText text={"Calidad del registro"} /></p><span className="text-xs font-extrabold text-blue-800">{Math.round((completion / 6) * 100)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(completion / 6) * 100}%` }} /></div><ul className="mt-4 space-y-2 text-[10px] leading-4 text-slate-600"><li><LocalizedText text={"• Nombre, correo y teléfono permiten reportarlo."} /></li><li><LocalizedText text={"• Proyecto y presupuesto ayudan a calificarlo."} /></li><li><LocalizedText text={"• Un seguimiento programado evita perder la oportunidad."} /></li></ul></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" /><div><p className="text-xs font-extrabold text-slate-900"><LocalizedText text={"Protección y exclusividad de 180 días"} /></p><p className="mt-2 text-[10px] leading-5 text-slate-500">{process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? 'El registro conserva el expediente y su seguimiento comercial.' : <LocalizedText text={"Al confirmar, el lead quedará formalmente registrado con vigencia de 180 días en Supabase Postgres."} />}</p></div></div></div>
        </aside>
      </div>
    </form>
  );
}

function FormSection({ icon: Icon, eyebrow, title, description, children }: { icon: typeof UserRound; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex gap-3 border-b border-slate-100 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p><h2 className="mt-1 text-base font-extrabold text-slate-950">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{description}</p></div></div><div className="space-y-4 p-5">{children}</div></section>;
}

function InputField({ label, value, onChange, required, type = 'text', placeholder, hint }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string; hint?: string }) {
  return <label className="block"><span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-700">{label}{required && <span className="text-blue-600">*</span>}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />{hint && <span className="mt-1 block text-[9px] text-slate-400">{hint}</span>}</label>;
}

function SelectField({ label, value, onChange, options, emptyLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; emptyLabel?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayLabel = value || emptyLabel || 'Seleccionar';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="block" ref={ref}>
      <span className="mb-1.5 block text-[10px] font-bold text-slate-700">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border bg-slate-50/60 px-3 text-xs font-semibold outline-none transition',
            open
              ? 'border-blue-400 bg-white ring-4 ring-blue-50'
              : 'border-slate-200 hover:border-slate-300',
            value ? 'text-slate-800' : 'text-slate-400'
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((option, index) => (
              <button
                key={`${option}-${index}`}
                type="button"
                onClick={() => { onChange(option); setOpen(false); }}
                className={cn(
                  'flex w-full items-center px-3 py-2.5 text-left text-xs transition hover:bg-slate-50',
                  option === value ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'
                )}
              >
                {!option ? emptyLabel || 'Seleccionar' : option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-slate-700">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" /></label>;
}

function ChannelToggle({ icon: Icon, label, checked, onChange }: { icon: typeof Mail; label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition', checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white')}><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-[10px] font-bold text-slate-700">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof BadgeCheck; label: string; value: string }) {
  return <div className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0 text-blue-500" /><div className="min-w-0 flex-1"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-[10px] font-bold text-slate-700">{value}</p></div></div>;
}
