'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { createMasterBrokerAction } from '@/app/portal/admin/actions';

export default function BrokerStudio() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('master_broker');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState('');
  const [isPending, startTransition] = useTransition();

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleCreateOrg = () => {
    if (!name.trim()) {
      notify('El nombre de la organización es obligatorio.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('kind', kind);
      formData.append('contactEmail', email);
      formData.append('contactPhone', phone);

      const res = await createMasterBrokerAction(formData);
      if (res.error) {
        notify(`Error: ${res.error}`);
      } else {
        notify(`Organización "${name}" creada con éxito.`);
        router.push('/portal/admin#brokers');
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <UITranslationBoundary attributes={["title"]}><Link
            href="/portal/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
            title="Volver a Administración"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link></UITranslationBoundary>
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Alta de Entidades Comerciales"} /></span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              {name || 'Nueva Organización / Master Broker'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-xs"
          ><LocalizedText text={"Cancelar"} /></Link>
          <button
            type="button"
            disabled={isPending || !name.trim()}
            onClick={handleCreateOrg}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{isPending ? 'Creando…' : <LocalizedText text={"Crear Organización"} />}</span>
          </button>
        </div>
      </section>

      {/* Main Studio Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-950"><LocalizedText text={"Datos de la Organización"} /></h2>
              <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Registra la entidad legal y comercial que administrará los proyectos o red de brokers."} /></p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Nombre Comercial de la Organización *"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. OB Realty Network / Cana Rock Master"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 font-bold outline-none focus:border-blue-600"
              /></UITranslationBoundary>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Tipo de Entidad"} /></span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              >
                <option value="master_broker"><LocalizedText text={"Master Broker (Comercializadora Exclusiva)"} /></option>
                <option value="agency"><LocalizedText text={"Agencia Inmobiliaria Aliada (Red de Brokers)"} /></option>
                <option value="developer"><LocalizedText text={"Desarrollador / Empresa Constructora"} /></option>
                <option value="partner"><LocalizedText text={"Aliado / Representante de desarrollador"} /></option>
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Correo Electrónico Oficial"} /></span>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@masterbroker.com"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Teléfono / WhatsApp de Contacto"} /></span>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (809) 000-0000"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Preview (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><LocalizedText text={"Vista Previa de Organización"} /></span>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-base font-black text-blue-700">
                {name
                  ? name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'OB'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">
                  {name || 'Nombre de la Organización'}
                </h3>
                <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-700 mt-1">
                  {kind === 'master_broker'
                    ? 'Master Broker'
                    : kind === 'agency'
                    ? <LocalizedText text={"Agencia Aliada"} />
                    : kind === 'developer'
                    ? 'Desarrollador'
                    : 'Aliado / Representante'}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{email || 'Sin correo asignado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{phone || 'Sin teléfono asignado'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-extrabold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {notice}
        </div>
      )}
    </div>
  );
}
