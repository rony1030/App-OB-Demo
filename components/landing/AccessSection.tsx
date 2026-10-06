'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition, useRef, useEffect } from 'react';
import { Building2, CheckCircle2, ChevronDown, Clock3, RefreshCw, Send, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestAccessAction } from '@/app/auth/actions';
import Reveal from '@/components/landing/Reveal';
import { useLocale } from '@/components/i18n/LocaleProvider';

const TRUST_POINTS_DATA = {
  es: [
    { icon: Clock3, text: 'Respuesta de nuestro equipo en menos de 24 horas hábiles.' },
    { icon: ShieldCheck, text: 'Acuerdo de colaboración digital, sin papeleo ni visitas presenciales.' },
    { icon: Users, text: 'Acceso inmediato al inventario y las herramientas comerciales una vez aprobado.' },
  ],
  en: [
    { icon: Clock3, text: 'Direct response from our team within 24 business hours.' },
    { icon: ShieldCheck, text: '100% digital collaboration agreement — zero paperwork or office visits.' },
    { icon: Users, text: 'Immediate access to live inventory and commercial tools upon approval.' },
  ],
  fr: [
    { icon: Clock3, text: 'Réponse personnalisée sous 24 heures ouvrées.' },
    { icon: ShieldCheck, text: 'Convention de collaboration 100% numérique, sans formalités papier.' },
    { icon: Users, text: 'Accès instantané à l’inventaire en direct et aux outils dès validation.' },
  ],
};

export default function AccessSection({ selectedProject }: { selectedProject: string }) {
  const { locale, t } = useLocale();
  const trustPoints = TRUST_POINTS_DATA[locale] || TRUST_POINTS_DATA.es;

  return (
    <section id="acceso" className="border-t border-slate-200 bg-white py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="space-y-6">
            <span className="inline-flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>{locale === 'en' ? 'Exclusive Professional Access' : locale === 'fr' ? 'Accès Professionnel Exclusif' : <LocalizedText text={"Acceso Exclusivo para Profesionales"} />}</span>
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-950 tracking-tight">
              {locale === 'en'
                ? 'Join the Caribbean’s most dynamic broker network'
                : locale === 'fr'
                ? <LocalizedText text={"Rejoignez le réseau de courtiers le plus dynamique des Caraïbes"} />
                : <LocalizedText text={"Únete a la red de brokers más activa del Caribe"} />}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              {locale === 'en'
                ? 'Request your commercial credentials and begin marketing prime developments with full legal backing and transparent payouts.'
                : locale === 'fr'
                ? <LocalizedText text={"Demandez vos accès commerciaux et commercialisez les plus beaux programmes avec sécurité juridique et commissions garanties."} />
                : 'Solicita tus credenciales comerciales y empieza a comercializar los mejores desarrollos con respaldo contractual y comisiones claras.'}
            </p>
            <div className="space-y-4 pt-2">
              {trustPoints.map((point) => (
                <div key={point.text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <point.icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1.5">{point.text}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <AccessForm key={selectedProject} selectedProject={selectedProject} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function AccessForm({ selectedProject }: { selectedProject: string }) {
  const { locale } = useLocale();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agency, setAgency] = useState('');
  const [roleType, setRoleType] = useState('Broker inmobiliario');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const roleOptions = locale === 'en' ? [
    { value: 'Broker inmobiliario', label: 'Broker / Agent' },
    { value: 'Director de agencia', label: 'Agency Director' },
    { value: 'Master broker', label: 'Master Broker' },
  ] : locale === 'fr' ? [
    { value: 'Broker inmobiliario', label: 'Courtier / Conseiller' },
    { value: 'Director de agencia', label: 'Directeur d’Agence' },
    { value: 'Master broker', label: 'Master Broker' },
  ] : [
    { value: 'Broker inmobiliario', label: 'Broker / Agente' },
    { value: 'Director de agencia', label: 'Director de Agencia' },
    { value: 'Master broker', label: 'Master Broker' },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('agency', agency);
      formData.append('roleType', roleType);
      formData.append('projectInterest', selectedProject);
      formData.append('message', message);

      const res = await requestAccessAction(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setError('');
      setSubmitted(true);
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-sm">
      {submitted ? (
        <div className="py-10 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-base font-black text-slate-950">
            {locale === 'en' ? 'Request Submitted Successfully!' : locale === 'fr' ? <LocalizedText text={"Demande Envoyée avec Succès !"} /> : <LocalizedText text={"¡Solicitud Enviada con Éxito!"} />}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {locale === 'en'
              ? 'A master broker advisor will review your profile and send your login credentials.'
              : locale === 'fr'
              ? <LocalizedText text={"Un conseiller master broker examinera votre dossier et vous délivrera vos identifiants."} />
              : <LocalizedText text={"Un asesor master broker revisará tu perfil y te enviará las credenciales de acceso."} />}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {selectedProject && (
            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900 font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-700 shrink-0" />
              <span>{locale === 'en' ? 'Project of interest:' : locale === 'fr' ? <LocalizedText text={"Programme d’intérêt :"} /> : <LocalizedText text={"Proyecto de interés:"} />} {selectedProject}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">
              {locale === 'en' ? 'Full Name *' : locale === 'fr' ? 'Nom Complet *' : <LocalizedText text={"Nombre Completo *"} />}
            </span>
            <UITranslationBoundary attributes={["placeholder"]}><input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={locale === 'en' ? 'e.g. John Doe' : locale === 'fr' ? 'ex. Jean Dupont' : 'Ej. Carlos Martínez'}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                {locale === 'en' ? 'Official Email *' : locale === 'fr' ? 'Email Professionnel *' : <LocalizedText text={"Correo Oficial *"} />}
              </span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@broker.com"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              /></UITranslationBoundary>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                {locale === 'en' ? 'WhatsApp / Phone *' : locale === 'fr' ? <LocalizedText text={"WhatsApp / Téléphone *"} /> : <LocalizedText text={"WhatsApp / Teléfono *"} />}
              </span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (809) 000-0000"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              /></UITranslationBoundary>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                {locale === 'en' ? 'Real Estate Agency' : locale === 'fr' ? 'Agence Immobilière' : <LocalizedText text={"Inmobiliaria / Agencia"} />}
              </span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder={locale === 'en' ? 'e.g. Punta Cana Realty' : locale === 'fr' ? 'ex. Agence Caraïbes' : 'Ej. Inmobiliaria Punta Cana'}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              /></UITranslationBoundary>
            </label>
            <UITranslationBoundary attributes={["label"]}><CustomSelect
              label={locale === 'en' ? 'Professional Role' : locale === 'fr' ? 'Profil Professionnel' : 'Perfil Profesional'}
              value={roleType}
              onChange={setRoleType}
              options={roleOptions}
            /></UITranslationBoundary>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">
              {locale === 'en' ? 'Message or Inquiries (Optional)' : locale === 'fr' ? 'Message ou Question (Optionnel)' : 'Mensaje o Dudas (Opcional)'}
            </span>
            <UITranslationBoundary attributes={["placeholder"]}><textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={locale === 'en' ? 'Write here if you need details about a specific development...' : locale === 'fr' ? 'Écrivez ici pour toute demande relative à un programme...' : 'Escribe aquí si requieres información sobre un desarrollo específico...'}
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </label>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending || !fullName.trim() || !email.trim() || !phone.trim()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>
              {isPending
                ? (locale === 'en' ? 'Submitting…' : locale === 'fr' ? 'Envoi en cours…' : 'Enviando…')
                : (locale === 'en' ? 'Submit Request' : locale === 'fr' ? 'Envoyer la Demande' : 'Enviar Solicitud')}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}

function CustomSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="block" ref={ref}>
      <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm font-bold text-slate-800 outline-none transition-all',
            open
              ? 'border-blue-600 ring-4 ring-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          )}
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center px-4 py-3 text-left text-sm font-semibold transition-colors',
                  option.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
