'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useRef, useState } from 'react';
import { CalendarDays, Check, Info, LoaderCircle, Send } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export type ProjectInquiryType = 'information' | 'site_visit';

export interface LeadCaptureFormProps {
  projectId: number;
  projectSlug: string;
  projectName: string;
  accentClassName?: string;
  typologyOptions?: string[];
  initialMessage?: string;
  requestType?: ProjectInquiryType;
  onRequestTypeChange?: (value: ProjectInquiryType) => void;
  localeOverride?: Locale;
}

export default function LeadCaptureForm({ projectId, projectSlug, projectName, accentClassName = 'bg-slate-950 hover:bg-slate-800', typologyOptions = [], initialMessage = '', requestType, onRequestTypeChange, localeOverride }: LeadCaptureFormProps) {
  const { locale: currentLocale } = useLocale();
  const locale = localeOverride ?? currentLocale;
  const tText = (es: string, en: string, fr: string) => locale === 'fr' ? fr : locale === 'en' ? en : es;
  const [internalRequestType, setInternalRequestType] = useState<ProjectInquiryType>('information');
  const activeRequestType = requestType ?? internalRequestType;
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const submissionIdRef = useRef<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', profileType: 'independent_broker' as 'agency' | 'independent_broker', agencyName: '', typology: typologyOptions[0] || '', message: initialMessage, acceptedTerms: false, website: '' });

  const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [field]: value }));
  const selectRequestType = (value: ProjectInquiryType) => {
    setInternalRequestType(value);
    onRequestTypeChange?.(value);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('sending');
    submissionIdRef.current ||= crypto.randomUUID();
    try {
      const response = await fetch('/api/public/project-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submissionIdRef.current, projectId, projectSlug, requestType: activeRequestType, fullName: form.name, phone: form.phone, email: form.email, profileType: form.profileType, agencyName: form.profileType === 'agency' ? form.agencyName : '', typology: form.typology, message: form.message, acceptedTerms: form.acceptedTerms, website: form.website, locale }),
      });
      const result = await response.json() as { success?: boolean; reference?: string; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || tText('No pudimos enviar la solicitud.', 'We could not send the request.', 'Nous n’avons pas pu envoyer la demande.'));
      setReference(result.reference || '');
      setStatus('sent');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : tText('No pudimos enviar la solicitud.', 'We could not send the request.', 'Nous n’avons pas pu envoyer la demande.'));
      setStatus('idle');
    }
  };

  return (
    <form className="relative grid gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8" onSubmit={submit}>
      {status === 'sent' ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center" role="status">
          <Check className="h-10 w-10 text-emerald-600" />
          <h3 className="text-lg font-semibold text-stone-950">{activeRequestType === 'site_visit' ? tText('Visita solicitada', 'Visit requested', 'Visite demandée') : tText('Solicitud recibida', 'Request received', 'Demande reçue')}</h3>
          <p className="max-w-sm text-sm leading-6 text-stone-600">{tText(`Enviamos la confirmación a tu correo. El equipo responsable de ${projectName} recibió una copia para darte seguimiento.`, `We sent confirmation to your email. The team responsible for ${projectName} received a copy for follow-up.`, `Nous avons envoyé la confirmation à votre adresse e-mail. L’équipe responsable de ${projectName} en a reçu une copie.`)}</p>
          {reference && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{reference}</span>}
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-stone-700">{tText('¿Qué necesitas?', 'What do you need?', 'De quoi avez-vous besoin ?')}</legend>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
              {([['information', Info, tText('Más información', 'More information', 'Plus d’informations')], ['site_visit', CalendarDays, tText('Visitar proyecto', 'Visit project', 'Visiter le projet')]] as const).map(([value, Icon, label]) => (
                <button key={value} type="button" onClick={() => selectRequestType(value)} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition', activeRequestType === value ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800')} aria-pressed={activeRequestType === value}><Icon className="h-4 w-4" /> {label}</button>
              ))}
            </div>
          </fieldset>
          <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Nombre y apellido *', 'Full name *', 'Nom et prénom *')}</label><UITranslationBoundary attributes={["placeholder"]}><input required minLength={3} maxLength={160} autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white" placeholder="Ej. Carlos Rodríguez" /></UITranslationBoundary></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Teléfono / WhatsApp *', 'Phone / WhatsApp *', 'Téléphone / WhatsApp *')}</label><UITranslationBoundary attributes={["placeholder"]}><input required type="tel" minLength={8} maxLength={40} autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white" placeholder="+1 829 000 0000" /></UITranslationBoundary></div>
            <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Correo electrónico *', 'Email address *', 'Adresse e-mail *')}</label><UITranslationBoundary attributes={["placeholder"]}><input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white" placeholder="tu@email.com" /></UITranslationBoundary></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Perfil profesional *', 'Professional profile *', 'Profil professionnel *')}</label><select required value={form.profileType} onChange={(event) => update('profileType', event.target.value as typeof form.profileType)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white"><option value="independent_broker">{tText('Vendedor independiente', 'Independent agent', 'Agent indépendant')}</option><option value="agency">{tText('Agencia inmobiliaria', 'Real estate agency', 'Agence immobilière')}</option></select></div>
            {form.profileType === 'agency' ? <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Nombre de la agencia *', 'Agency name *', 'Nom de l’agence *')}</label><UITranslationBoundary attributes={["placeholder"]}><input required minLength={2} maxLength={180} autoComplete="organization" value={form.agencyName} onChange={(event) => update('agencyName', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white" placeholder="Ej. Inmobiliaria Punta Cana" /></UITranslationBoundary></div> : typologyOptions.length > 0 ? <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Modelo de interés', 'Model of interest', 'Modèle souhaité')}</label><select value={form.typology} onChange={(event) => update('typology', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white">{typologyOptions.map((option) => <option key={option}>{option}</option>)}</select></div> : null}
          </div>
          {form.profileType === 'agency' && typologyOptions.length > 0 && <div><label className="mb-1 block text-xs font-semibold text-stone-700">{tText('Modelo de interés', 'Model of interest', 'Modèle souhaité')}</label><select value={form.typology} onChange={(event) => update('typology', event.target.value)} className="h-11 w-full rounded-full border border-stone-300 bg-stone-50 px-4 text-sm outline-none focus:border-violet-500 focus:bg-white">{typologyOptions.map((option) => <option key={option}>{option}</option>)}</select></div>}
          <div><label className="mb-1 block text-xs font-semibold text-stone-700">{activeRequestType === 'site_visit' ? tText('Fecha preferida y mensaje', 'Preferred date and message', 'Date souhaitée et message') : tText('Mensaje o dudas', 'Message or questions', 'Message ou questions')}</label><textarea rows={3} maxLength={3000} value={form.message} onChange={(event) => update('message', event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm outline-none focus:border-violet-500 focus:bg-white" placeholder={activeRequestType === 'site_visit' ? tText('Indica el día, horario aproximado y cantidad de personas...', 'Share your preferred day, approximate time, and number of visitors...', 'Indiquez le jour, l’heure approximative et le nombre de visiteurs...') : tText('Disponibilidad, precios o información específica...', 'Availability, pricing, or specific information...', 'Disponibilité, prix ou information précise...')} /></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600"><input required type="checkbox" checked={form.acceptedTerms} onChange={(event) => update('acceptedTerms', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-violet-600" /><span>{tText('Acepto los términos y condiciones y autorizo el tratamiento de mis datos únicamente para atender esta solicitud comercial.', 'I accept the terms and conditions and authorize the use of my data solely to handle this business request.', 'J’accepte les conditions générales et autorise le traitement de mes données uniquement pour répondre à cette demande commerciale.')}</span></label>
          <div className="absolute -left-[9999px]" aria-hidden="true"><label><LocalizedText text={"Website"} /><input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update('website', event.target.value)} /></label></div>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">{error}</p>}
          <button type="submit" disabled={status === 'sending'} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-65 ${accentClassName}`}>{status === 'sending' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{status === 'sending' ? tText('Enviando...', 'Sending...', 'Envoi...') : activeRequestType === 'site_visit' ? tText('Solicitar visita', 'Request visit', 'Demander une visite') : tText('Enviar solicitud', 'Send request', 'Envoyer la demande')}</button>
          <p className="text-center text-[11px] leading-5 text-stone-500">{tText('Recibirás confirmación por correo; el equipo responsable del master broker recibirá una copia.', 'You will receive email confirmation; the responsible master-broker team will receive a copy.', 'Vous recevrez une confirmation par e-mail ; l’équipe responsable du master broker en recevra une copie.')}</p>
        </>
      )}
    </form>
  );
}
