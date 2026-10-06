"use client";
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Lock, Mail, MapPin, Phone, RefreshCcw, ShieldCheck, User } from "lucide-react";
import { acceptInvitationAction, submitAgencyInvitationOnboardingAction } from "@/app/(public)/invite/actions";

interface AcceptInvitationCardProps {
  token: string;
  email: string;
  role: string;
  organizationName: string;
  expiresAt: string;
  initialAdminName?: string;
}

const roleDescriptions: Record<string, string> = {
  broker_agent: "Acceso para gestionar clientes propios y comercializar unidades autorizadas.",
  agency_admin: "Acceso de administración de agencia, supervisión de corredores de su equipo y gestión de cartera.",
  agency_support: "Acceso de soporte para equipo, documentos y dossiers de la agencia, sin propuestas, acuerdos ni comisiones.",
  master_broker_operations: "Operaciones de master broker, inventario, documentación comercial y soporte a proyectos.",
  developer_admin: "Administración del desarrollador inmobiliario, consulta de proyectos propios y métricas de avance.",
  developer_viewer: "Consulta de disponibilidad de proyectos y métricas comerciales.",
  support_auditor: "Auditoría de plataforma y visualización técnica con trazabilidad.",
};

export default function AcceptInvitationCard({
  token,
  email,
  role,
  organizationName,
  expiresAt,
  initialAdminName = '',
}: AcceptInvitationCardProps) {
  const router = useRouter();
  const nameParts = initialAdminName.trim().split(/\s+/).filter(Boolean);
  const initialFirstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || '';
  const initialLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState(organizationName);
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [agencyEmail, setAgencyEmail] = useState(email);
  const [agencyPhone, setAgencyPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasSecurePassword =
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const isAgencyOnboarding = role === "agency_admin";

  const handleAgencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agencyName.trim() || !agencyEmail.trim() || !firstName.trim()) {
      setError("Completa el nombre de la agencia, el representante y el correo de contacto.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitAgencyInvitationOnboardingAction({
          token,
          agencyName: agencyName.trim(),
          legalName: legalName.trim(),
          taxId: taxId.trim(),
          legalAddress: legalAddress.trim(),
          contactEmail: agencyEmail.trim(),
          contactPhone: agencyPhone.trim(),
          representativeName: [firstName.trim(), lastName.trim()].filter(Boolean).join(" "),
          representativePhone: phone.trim(),
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setIsSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasSecurePassword) {
      setError("La contraseña debe tener mínimo 10 caracteres, mayúscula, minúscula, número y símbolo.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await acceptInvitationAction({
          token,
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setIsSuccess(true);
        setTimeout(() => {
          router.push("/portal");
          router.refresh();
        }, 1800);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center space-y-4 animate-in fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          {isAgencyOnboarding ? <LocalizedText text={"Solicitud recibida"} /> : <LocalizedText text={"¡Cuenta activada con éxito!"} />}
        </h2>
        {isAgencyOnboarding ? (
          <p className="text-xs text-slate-500 leading-relaxed"><LocalizedText text={"Gracias. Estamos creando y revisando el perfil de tu agencia. Cuando todo esté confirmado, recibirás un mensaje con los pasos para acceder al CRM."} /></p>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed"><LocalizedText text={"Tu membresía en "} /><strong className="text-slate-800">{organizationName}</strong><LocalizedText text={" ha sido confirmada. Te estamos redirigiendo al portal..."} /></p>
        )}
      </div>
    );
  }

  if (isAgencyOnboarding) {
    return (
      <div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span><LocalizedText text={"Alta de agencia"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950"><LocalizedText text={"Completa el perfil de tu agencia"} /></h1>
          <p className="text-xs leading-relaxed text-slate-500"><LocalizedText text={"Estos datos serán revisados por OB Brokers antes de habilitar tu acceso. El perfil no se activa automáticamente."} /></p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleAgencySubmit} className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Building2} label="Nombre comercial de la agencia *" value={agencyName} onChange={setAgencyName} placeholder="Ej. Caribe Prime Realty" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Building2} label="Razón social" value={legalName} onChange={setLegalName} placeholder="Ej. Caribe Prime Realty SRL" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField label="RNC / identificación fiscal" value={taxId} onChange={setTaxId} placeholder="Ej. 1-30-00000-0" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Mail} label="Correo de agencia *" type="email" value={agencyEmail} onChange={setAgencyEmail} placeholder="contacto@agencia.com" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Phone} label="Teléfono de agencia" type="tel" value={agencyPhone} onChange={setAgencyPhone} placeholder="+1 809 000 0000" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={MapPin} label="Dirección legal" value={legalAddress} onChange={setLegalAddress} placeholder="Ciudad, sector, referencia" /></UITranslationBoundary>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500"><LocalizedText text={"Representante principal"} /></p>
            <div className="grid gap-3 sm:grid-cols-2">
              <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={User} label="Nombre *" value={firstName} onChange={setFirstName} placeholder="Ej. Laura" /></UITranslationBoundary>
              <UITranslationBoundary attributes={["label","placeholder"]}><InviteField label="Apellido" value={lastName} onChange={setLastName} placeholder="Ej. Gómez" /></UITranslationBoundary>
              <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Mail} label="Correo de invitación" type="email" readOnly value={email} onChange={() => {}} placeholder="correo@agencia.com" /></UITranslationBoundary>
              <UITranslationBoundary attributes={["label","placeholder"]}><InviteField icon={Phone} label="Teléfono personal" type="tel" value={phone} onChange={setPhone} placeholder="+1 809 000 0000" /></UITranslationBoundary>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span><LocalizedText text={"Enviar datos para revisión"} /></span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-2xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span><LocalizedText text={"Invitación a la Red"} /></span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950"><LocalizedText text={"Únete a "} />{organizationName}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {roleDescriptions[role] || "Acceso exclusivo a la plataforma de inventario y comercialización."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Correo de invitación"} /></label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              readOnly
              value={email}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-xs text-slate-600 font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Nombre "} /><span className="font-semibold text-slate-400"><LocalizedText text={"(opcional)"} /></span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="text"
                  placeholder="Ej. Laura"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                /></UITranslationBoundary>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Apellido "} /><span className="font-semibold text-slate-400"><LocalizedText text={"(opcional)"} /></span>
              </label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                type="text"
                placeholder="Ej. Gómez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              /></UITranslationBoundary>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Teléfono "} /><span className="font-semibold text-slate-400"><LocalizedText text={"(opcional)"} /></span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="tel"
              placeholder="Ej. +1 809 555 0144"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Contraseña"} /></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="password"
              required
              placeholder="Mínimo 10 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </div>
          <p className={hasSecurePassword || !password ? "mt-1 text-[10px] text-slate-400" : "mt-1 text-[10px] text-rose-600"}><LocalizedText text={"Usa mayúscula, minúscula, número y símbolo."} /></p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Confirmar contraseña"} /></label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="password"
              required
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            /></UITranslationBoundary>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md transition"
        >
          {isPending ? (
            <RefreshCcw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span><LocalizedText text={"Activar Cuenta y Acceder"} /></span>
        </button>
      </form>

      <div className="pt-2 text-center text-[10px] text-slate-400"><LocalizedText text={"Válido hasta"} />{" "}
        {new Date(expiresAt).toLocaleDateString("es-DO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

function InviteField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  icon?: typeof User;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-700">{label}</span>
      <span className="relative block">
        {Icon && <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          type={type}
          readOnly={readOnly}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 py-2.5 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${
            Icon ? "pl-10" : "px-3"
          } ${readOnly ? "bg-slate-100 text-slate-500" : "bg-white"}`}
        />
      </span>
    </label>
  );
}
