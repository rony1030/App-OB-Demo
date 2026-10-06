"use client";
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { createCommercialProposalFromSimulatorAction } from "@/app/portal/proposals/actions";
import {
  calculateCommercialSchedule,
  type SimulatorPlanConfig,
} from "@/lib/proposals/simulator";
import { formatCurrency } from "@/lib/utils";
import { CANA_ROCK_ICON_OPTIONS, resolveIconKey } from '@/components/branding/CanaRockAmenityIcon';

interface ProposalSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number;
    name: string;
    slug: string;
    currency?: string;
    delivery?: string;
    amenities?: string[];
  };
  unit: {
    id: number | string;
    unit: string;
    price: number;
    currency?: string;
    floor?: number | string | null;
    tower?: string | null;
    type?: string | null;
    area?: number | string | null;
  };
}

export default function ProposalSimulatorModal({
  isOpen,
  onClose,
  project,
  unit,
}: ProposalSimulatorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const unitPrice = Number(unit.price) || 0;
  const unitCurrency = (unit.currency || project.currency || "USD") as "USD" | "DOP" | "EUR";

  // Plan configuration state
  const [reservationAmount, setReservationAmount] = useState(
    unitCurrency === "USD" ? 3000 : unitCurrency === "EUR" ? 3000 : 150000
  );
  const [initialPct, setInitialPct] = useState(20);
  const [duringPct, setDuringPct] = useState(40);
  const [deliveryPct, setDeliveryPct] = useState(40);
  const [constructionMonths, setConstructionMonths] = useState(24);
  const [validDays, setValidDays] = useState(30);
  const [amenities, setAmenities] = useState(() => project.amenities || []);
  const [amenityIconMap, setAmenityIconMap] = useState<Record<string, string>>(() =>
    Object.fromEntries((project.amenities || []).map((amenity, index) => [String(index), resolveIconKey(amenity)]))
  );

  // Result state
  const [generatedLink, setGeneratedLink] = useState<{ url: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const planConfig: SimulatorPlanConfig = {
    reservationAmount,
    initialPercentage: initialPct,
    duringConstructionPercentage: duringPct,
    uponDeliveryPercentage: deliveryPct,
    constructionMonths,
  };

  const schedule = calculateCommercialSchedule(unitPrice, planConfig);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMsg("El nombre del cliente es obligatorio.");
      return;
    }
    if (initialPct + duringPct + deliveryPct !== 100) {
      setErrorMsg("La suma de porcentajes (Inicial + Obra + Entrega) debe ser exactamente 100%.");
      return;
    }

    startTransition(async () => {
      setErrorMsg(null);
      const res = await createCommercialProposalFromSimulatorAction({
        projectId: project.id,
        unitId: Number(unit.id),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        planConfig,
        validDays,
        amenities,
        amenityIconMap,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.url && res.token) {
        setGeneratedLink({
          url: window.location.origin + res.url,
          token: res.token,
        });
      }
    });
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola ${clientName}, te comparto la propuesta comercial oficial para la unidad ${unit.unit} en ${project.name}:\n\n${generatedLink?.url}\n\nQuedo a tu disposición para coordinar la reserva.`
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider"><LocalizedText text={"Simulador Comercial de Propuesta"} /></span>
                <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-700">
                  {unitCurrency}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Unidad "} />{unit.unit} · {project.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Unit Specs Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-blue-50/50 p-3.5 border border-blue-100 text-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Precio Congelado"} /></span>
              <div className="text-sm font-black text-blue-950 mt-0.5">
                {formatCurrency(unitPrice, unitCurrency)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Nivel / Torre"} /></span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {unit.floor ? `Nivel ${unit.floor}` : "Piso 1"} {unit.tower ? `· ${unit.tower}` : ""}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Tipología"} /></span>
              <div className="text-xs font-bold text-slate-800 mt-1">{unit.type || "Estándar"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Metraje"} /></span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {unit.area ? `${unit.area} m²` : "—"}
              </div>
            </div>
          </div>

          {generatedLink ? (
            /* Success View */
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-950"><LocalizedText text={"¡Propuesta Generada y Congelada!"} /></h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1"><LocalizedText text={"Se ha emitido la propuesta para "} /><span className="font-bold">{clientName}</span><LocalizedText text={" con precio y condiciones comerciales fijadas por "} />{validDays}<LocalizedText text={" días."} /></p>
              </div>

              {/* Shared URL Box */}
              <div className="flex items-center gap-2 rounded-2xl bg-white p-2 border border-emerald-200 shadow-xs max-w-lg mx-auto">
                <input
                  readOnly
                  value={generatedLink.url}
                  className="flex-1 px-3 text-xs font-mono font-medium text-slate-800 outline-none select-all bg-transparent"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white hover:bg-slate-800 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <a
                  href={`https://wa.me/?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <Send className="h-4 w-4" />
                  <span><LocalizedText text={"Compartir por WhatsApp"} /></span>
                </a>

                <a
                  href={generatedLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span><LocalizedText text={"Abrir Propuesta"} /></span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={() => setGeneratedLink(null)}
                  className="inline-flex h-10 items-center px-3 text-xs font-bold text-slate-500 hover:text-slate-800"
                ><LocalizedText text={"Crear otra"} /></button>
              </div>
            </div>
          ) : (
            /* Simulator Form */
            <form onSubmit={handleGenerate} className="space-y-5">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 border border-rose-200">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Client Info */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2 block"><LocalizedText text={"1. Datos del Cliente (Destinatario)"} /></label>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      required
                      placeholder="Nombre y Apellido *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    /></UITranslationBoundary>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      placeholder="WhatsApp / Teléfono"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    /></UITranslationBoundary>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="email"
                      placeholder="Correo Electrónico"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    /></UITranslationBoundary>
                  </div>
                </div>
              </div>

              {/* Payment Plan Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900"><LocalizedText text={"2. Plan de Pago Comercial"} /></label>
                  <span
                    className={`text-[11px] font-black ${
                      initialPct + duringPct + deliveryPct === 100
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  ><LocalizedText text={"Total: "} />{initialPct + duringPct + deliveryPct}<LocalizedText text={"% (debe ser 100%)"} /></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase"><LocalizedText text={"Reserva Fija"} /></span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-400">{unitCurrency}</span>
                      <input
                        type="number"
                        min="0"
                        value={reservationAmount}
                        onChange={(e) => setReservationAmount(Number(e.target.value))}
                        className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase"><LocalizedText text={"% Inicial Total"} /></span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={initialPct}
                        onChange={(e) => setInitialPct(Number(e.target.value))}
                        className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase"><LocalizedText text={"% Durante Obra"} /></span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={duringPct}
                        onChange={(e) => setDuringPct(Number(e.target.value))}
                        className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase"><LocalizedText text={"% Contra Entrega"} /></span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={deliveryPct}
                        onChange={(e) => setDeliveryPct(Number(e.target.value))}
                        className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                  <label className="font-bold"><LocalizedText text={"Cuotas mensuales estimadas durante obra:"} /></label>
                  <select
                    value={constructionMonths}
                    onChange={(e) => setConstructionMonths(Number(e.target.value))}
                    className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold outline-none"
                  >
                    <option value={12}><LocalizedText text={"12 meses"} /></option>
                    <option value={18}><LocalizedText text={"18 meses"} /></option>
                    <option value={24}><LocalizedText text={"24 meses"} /></option>
                    <option value={30}><LocalizedText text={"30 meses"} /></option>
                    <option value={36}><LocalizedText text={"36 meses"} /></option>
                  </select>
                </div>
              </div>

              {/* Calculated Schedule Preview */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900"><LocalizedText text={"Amenidades incluidas"} /></label>
                  <button type="button" onClick={() => setAmenities((current) => [...current, 'Nueva amenidad'])} className="text-xs font-bold text-blue-700"><LocalizedText text={"Agregar"} /></button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2.5">
                  {amenities.map((amenity, index) => (
                    <div key={`${index}-${amenity}`} className="grid grid-cols-[1fr_132px_auto] items-center gap-2">
                      <input value={amenity} onChange={(event) => setAmenities((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-medium outline-none focus:border-blue-600" aria-label={`Amenidad ${index + 1}`} />
                      <select value={amenityIconMap[String(index)] || resolveIconKey(amenity)} onChange={(event) => setAmenityIconMap((current) => ({ ...current, [String(index)]: event.target.value }))} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none focus:border-blue-600" aria-label={`Icono de ${amenity}`}>
                        {CANA_ROCK_ICON_OPTIONS.map((icon) => <option key={icon.key} value={icon.key}>{icon.label}</option>)}
                      </select>
                      <button type="button" onClick={() => { setAmenities((current) => current.filter((_, itemIndex) => itemIndex !== index)); setAmenityIconMap((current) => { const next = { ...current }; delete next[String(index)]; return next; }); }} className="h-8 px-2 text-xs font-bold text-slate-400 hover:text-rose-600" aria-label={`Quitar ${amenity}`}><LocalizedText text={"Quitar"} /></button>
                    </div>
                  ))}
                  {amenities.length === 0 && <p className="py-2 text-center text-xs text-slate-400"><LocalizedText text={"Agrega las amenidades que deseas presentar al cliente."} /></p>}
                </div>
              </div>

              {/* Calculated Schedule Preview */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2 block"><LocalizedText text={"3. Cronograma de Pagos Simulado"} /></label>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  {schedule.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{step.label}</div>
                        <div className="text-[11px] text-slate-500">{step.due_date_or_milestone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-950">
                          {formatCurrency(step.amount, unitCurrency)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium font-mono">
                          {step.percentage}<LocalizedText text={"% del total"} /></div>
                      </div>
                    </div>
                  ))}
                  {schedule.monthlyInstallmentAmount && (
                    <div className="bg-blue-50/50 p-2.5 text-center text-[11px] font-extrabold text-blue-900"><LocalizedText text={"Cuota mensual aproximada ("} />{constructionMonths}<LocalizedText text={" meses): "} />{formatCurrency(schedule.monthlyInstallmentAmount, unitCurrency)}<LocalizedText text={" / mes"} /></div>
                  )}
                </div>
              </div>

              {/* Cut-off & Expiration footer */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 font-medium border border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span><LocalizedText text={"Fecha de corte: "} /><strong className="text-slate-700"><LocalizedText text={"Hoy"} /></strong><LocalizedText text={" (Snapshot inmutable)"} /></span>
                </div>
                <div className="flex items-center gap-1">
                  <span><LocalizedText text={"Validez:"} /></span>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="h-6 rounded border border-slate-300 bg-white px-1 text-[11px] font-bold text-slate-800"
                  >
                    <option value={15}><LocalizedText text={"15 días"} /></option>
                    <option value={30}><LocalizedText text={"30 días"} /></option>
                    <option value={45}><LocalizedText text={"45 días"} /></option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-md hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {isPending
                      ? "Congelando y Generando Propuesta..."
                      : "Generar Propuesta Congelada y Obtener Enlace"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
