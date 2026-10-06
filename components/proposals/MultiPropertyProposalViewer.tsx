'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import { useMemo, useState } from 'react';
import { Bath, BedDouble, Building2, CheckCircle2, Download, Mail, Maximize2, MessageCircle, Phone, Share2, UserRound, XCircle } from 'lucide-react';
import { exportPresentationToPdf } from '@/lib/export/presentation-pdf';
import { generatePaymentSchedule } from '@/lib/proposals';
import { formatCurrency } from '@/lib/utils';
import type { MultiPropertyProposal, PaymentPlanStep, ProposalPropertyItem } from '@/types/proposals';
import { CanaRockAmenityIcon, resolveIconKey } from '@/components/branding/CanaRockAmenityIcon';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';

interface MultiPropertyProposalViewerProps {
  proposal: MultiPropertyProposal;
}

type Decision = 'accepted' | 'rejected';
type PropertyWithRawPlan = ProposalPropertyItem & {
  raw_payment_plan?: Array<{ label?: string; value?: string }>;
};

function formatDate(value?: string, includeDay = false) {
  if (!value) return 'Por confirmar';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-DO', {
    ...(includeDay ? { day: 'numeric' as const } : {}),
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function cleanPhone(phone?: string) {
  return (phone || '').replace(/[^\d+]/g, '');
}

function recipientName(proposal: MultiPropertyProposal) {
  const cleanName = proposal.client_name.replace(/^SR\/?A\.?\s*/i, '').trim() || 'Cliente';
  return proposal.recipient_type === 'company' ? cleanName : `SR/A. ${cleanName}`;
}

function getPlanRows(property: ProposalPropertyItem) {
  const hasLegacyFractionalPercentages = [
    property.payment_plan?.initial_percentage,
    property.payment_plan?.during_construction_percentage,
    property.payment_plan?.upon_delivery_percentage,
  ].some((percentage) => Number(percentage) > 0 && Number(percentage) <= 1);

  // Early proposal snapshots kept a pre-calculated schedule with fractional
  // percentages. Recalculate from the frozen commercial terms for display.
  if (hasLegacyFractionalPercentages) {
    return generatePaymentSchedule(property.price, property.payment_plan).map((step) => ({
      label: step.label,
      amount: step.amount,
      detail: step.pct > 0 ? `${step.pct}% del valor` : 'Separacion de unidad',
    }));
  }

  if (property.payment_plan?.steps?.length) {
    return property.payment_plan.steps.map((step: PaymentPlanStep) => ({
      label: step.label,
      amount: step.amount,
      detail: step.due_date_or_milestone,
    }));
  }

  const rawPlan = (property as PropertyWithRawPlan).raw_payment_plan;
  if (rawPlan?.length) {
    return rawPlan.map((step) => ({
      label: step.label || 'Condicion de pago',
      amount: null,
      detail: step.value || 'Por confirmar',
    }));
  }

  return generatePaymentSchedule(property.price, property.payment_plan).map((step) => ({
    label: step.label,
    amount: step.amount,
    detail: step.pct > 0 ? `${step.pct}% del valor` : 'Separacion de unidad',
  }));
}

export default function MultiPropertyProposalViewer({ proposal }: MultiPropertyProposalViewerProps) {
  const { t } = useLocale();
  const items = useMemo(() => proposal.items.filter(Boolean), [proposal.items]);
  const images = useMemo(
    () => Array.from(new Set(items.flatMap((item) => [item.hero_image, ...(item.gallery_images || [])]).filter(Boolean))),
    [items]
  );
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState<Decision | null>(
    proposal.status === 'accepted' || proposal.status === 'rejected' ? proposal.status : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const clientName = recipientName(proposal);
  const brokerPhone = cleanPhone(proposal.broker_phone);
  const primaryItem = items[0];
  const lowestPrice = items.length ? Math.min(...items.map((item) => item.price)) : 0;
  const agentInitials = (proposal.broker_name || 'Asesor')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  // Shared proposal visual language: Cana Rock's navy, champagne and warm paper,
  // kept as neutral defaults so the same renderer works for every developer.
  const brandPrimary = proposal.brand_primary || '#0a1140';
  const brandAccent = proposal.brand_accent || '#c5a880';
  const brandSurface = proposal.brand_surface || '#fcfbf9';

  const recordTelemetry = (eventType: 'pdf_export' | 'share_click' | 'whatsapp_click') => {
    void fetch(`/api/public/proposals/${proposal.token}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType }),
      keepalive: true,
    });
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://brokers.osvaldobello.com/p/${proposal.token}`;
    const text = `Hola, te comparto esta propuesta de inversión de *${proposal.title}*:\n${currentUrl}`;
    await navigator.clipboard.writeText(text);
    recordTelemetry('share_click');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      await exportPresentationToPdf({
        filename: `Propuesta_${clientName.replace(/[^a-z0-9]+/gi, '_')}.pdf`,
        slideSelector: '[data-proposal-page="true"]',
        aspectRatio: 'portrait',
        scale: 1.75,
      });
      recordTelemetry('pdf_export');
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsApp = () => {
    recordTelemetry('whatsapp_click');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://brokers.osvaldobello.com/p/${proposal.token}`;
    const text = `Hola, te comparto esta propuesta de inversión de *${proposal.title}*:\n${currentUrl}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const submitDecision = async (nextDecision: Decision) => {
    if (nextDecision === 'rejected' && comment.trim().length < 3) {
      setDecisionError('Indica brevemente por que deseas rechazarla.');
      return;
    }

    setSubmitting(true);
    setDecisionError('');
    try {
      const response = await fetch(`/api/public/proposals/${proposal.token}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: nextDecision, clientName, comment: comment.trim() }),
      });
      const result = (await response.json()) as { decision?: Decision; error?: string };
      if (!response.ok || !result.decision) throw new Error(result.error || 'No fue posible registrar tu respuesta.');
      setDecision(result.decision);
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'No fue posible registrar tu respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!primaryItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center">
        <div className="max-w-md border border-slate-200 bg-white p-8">
          <p className="text-sm font-black text-slate-950"><LocalizedText text={"Esta propuesta no contiene unidades."} /></p>
          <p className="mt-2 text-sm text-slate-600"><LocalizedText text={"Solicita a tu asesor un enlace actualizado."} /></p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8edf2] text-slate-950" style={{ '--proposal-primary': brandPrimary, '--proposal-accent': brandAccent, '--proposal-surface': brandSurface } as React.CSSProperties}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{proposal.title}</p>
            <p className="truncate text-[10px] font-bold uppercase text-slate-500">{t('privateProposal')}<LocalizedText text={" para "} />{clientName}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <UITranslationBoundary attributes={["label"]}><ToolbarButton label={copied ? 'Copiado' : 'Compartir'} icon={Share2} onClick={handleShare} /></UITranslationBoundary>
            <PublicLanguageSwitcher circular />
            <ToolbarButton label={exporting ? t('exporting') : 'PDF'} icon={Download} onClick={handleDownload} disabled={exporting} />
            {brokerPhone && <ToolbarButton label={t('contactAdvisor')} icon={MessageCircle} onClick={handleWhatsApp} primary />}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[860px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-8">
        <LetterPage page={1} total={items.length + 4} className="bg-[var(--proposal-primary)] text-white">
          <Image src={primaryItem.hero_image} alt={primaryItem.project_name} fill priority unoptimized className="object-cover opacity-35" sizes="816px" />
          <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--proposal-primary)]/55 via-[color:var(--proposal-primary)]/70 to-[color:var(--proposal-primary)]" />
          <div className="absolute bottom-0 left-[8%] top-0 w-px bg-white/20" />
          <div className="relative z-10 flex h-full flex-col px-[9%] py-[8%]">
            <div className="flex items-start justify-between gap-5">
              <div className="max-w-[36%] rounded-xl bg-white p-[2.4%] shadow-2xl"><DocumentLogo proposal={proposal} /></div>
              <p className="text-right text-[1.35cqw] font-black uppercase tracking-[0.34em] text-white/65"><LocalizedText text={"Propuesta de inversión"} /><br /><span className="text-white">{proposal.title}</span></p>
            </div>
            <div className="mt-auto">
              <p className="text-[1.8cqw] font-black uppercase tracking-[0.3em] text-[var(--proposal-accent)]"><LocalizedText text={"Exclusiva para"} /></p>
              <h2 className="mt-[2%] text-[5cqw] font-serif italic leading-none">{clientName}</h2>
              <h1 className="mt-[5%] max-w-[94%] text-[7.2cqw] font-black uppercase leading-[0.88]">{primaryItem.project_name}</h1>
              <div className="mt-[6%] grid grid-cols-[1.12fr_0.88fr] gap-[8%]">
                <div><div className="h-px w-[18%] bg-[var(--proposal-accent)]" /><p className="mt-[4%] max-w-[94%] text-[1.95cqw] leading-relaxed text-white/75"><LocalizedText text={"Una selección privada de unidades, precios y condiciones pensada para decidir con claridad."} /></p></div>
                <div className="text-right"><p className="text-[1.25cqw] font-black uppercase tracking-[0.28em] text-white/45"><LocalizedText text={"Inversión desde"} /></p><p className="mt-[2%] text-[3.6cqw] font-black">{formatCurrency(lowestPrice, primaryItem.currency)}</p><p className="mt-[6%] text-[1.35cqw] font-semibold text-white/65">{items.length}<LocalizedText text={" opción"} />{items.length === 1 ? '' : 'es'}<LocalizedText text={" seleccionada"} />{items.length === 1 ? '' : 's'}</p></div>
              </div>
            </div>
          </div>
        </LetterPage>

        <LetterPage page={2} total={items.length + 4}>
          <UITranslationBoundary attributes={["title"]}><PageHeading kicker="Comparativa" title="Opciones seleccionadas" body="Todas las unidades pertenecen al mismo proyecto y mantienen su disponibilidad sujeta a confirmacion." /></UITranslationBoundary>
          <div className="mt-[5%] flex-1 px-[6%]">
            <div className="overflow-hidden border border-slate-200">
              <div className="grid grid-cols-[1.15fr_0.8fr_0.55fr_0.55fr_0.7fr] bg-[var(--proposal-primary)] px-[3%] py-[2.3%] text-[1.45cqw] font-black uppercase text-white">
                <span><LocalizedText text={"Unidad"} /></span><span><LocalizedText text={"Precio"} /></span><span><LocalizedText text={"Hab."} /></span><span><LocalizedText text={"Area"} /></span><span><LocalizedText text={"Entrega"} /></span>
              </div>
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="grid grid-cols-[1.15fr_0.8fr_0.55fr_0.55fr_0.7fr] items-center border-t border-slate-200 px-[3%] py-[3%] text-[1.75cqw]">
                  <div><p className="font-black">{item.unit_name || `Opcion ${index + 1}`}</p><p className="mt-1 text-[1.4cqw] text-slate-500">{item.project_name}</p></div>
                  <span className="font-black">{formatCurrency(item.price, item.currency)}</span>
                  <span>{item.bedrooms}</span><span>{item.area_sqm}<LocalizedText text={" m²"} /></span><span>{formatDate(item.delivery_date)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-[6%] mb-[6%] grid grid-cols-3 border-y border-slate-200 py-[3%]">
            <UITranslationBoundary attributes={["label"]}><Metric label="Menor precio" value={formatCurrency(lowestPrice, primaryItem.currency)} compact /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><Metric label="Mayor metraje" value={`${Math.max(...items.map((item) => item.area_sqm))} m²`} compact /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><Metric label="Proyecto" value={primaryItem.project_name} compact /></UITranslationBoundary>
          </div>
        </LetterPage>

        {items.map((item, index) => (
          <LetterPage key={`${item.id}-page`} page={index + 3} total={items.length + 4}>
            <div className="grid h-[46%] grid-cols-[1.05fr_0.95fr]">
              <div className="relative bg-slate-100">
                <Image src={item.hero_image} alt={item.unit_name || item.project_name} fill unoptimized className="object-cover" sizes="430px" />
              </div>
              <div className="flex flex-col justify-between bg-slate-950 p-[9%] text-white">
                <div>
                  <p className="text-[1.7cqw] font-black uppercase text-[var(--proposal-accent)]"><LocalizedText text={"Opcion "} />{String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-[4%] text-[4.8cqw] font-black leading-tight">{item.unit_name || item.project_name}</h2>
                  <p className="mt-[3%] text-[1.8cqw] text-white/60">{item.project_name}</p>
                </div>
                <p className="text-[4cqw] font-black">{formatCurrency(item.price, item.currency)}</p>
              </div>
            </div>
            <div className="flex-1 p-[6%]">
              <div className="grid grid-cols-4 border-y border-slate-200 py-[3%]">
                <UITranslationBoundary attributes={["label"]}><Spec icon={BedDouble} label="Habitaciones" value={String(item.bedrooms)} /></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><Spec icon={Bath} label="Banos" value={String(item.bathrooms)} /></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><Spec icon={Maximize2} label="Metraje" value={`${item.area_sqm} m²`} /></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><Spec icon={Building2} label="Entrega" value={formatDate(item.delivery_date)} /></UITranslationBoundary>
              </div>
              <div className="mt-[4%] grid grid-cols-[0.9fr_1.1fr] gap-[6%]">
                <div>
                  <p className="text-[1.5cqw] font-black uppercase text-[var(--proposal-accent)]"><LocalizedText text={"Descripcion"} /></p>
                  <p className="mt-[3%] text-[1.75cqw] leading-relaxed text-slate-600">{item.description || 'Informacion comercial de la unidad seleccionada.'}</p>
                  {item.amenities?.length > 0 && (
                    <div className="mt-[5%] grid grid-cols-2 gap-x-[3%] gap-y-[2%]">
                      {item.amenities.slice(0, 8).map((amenity, amenityIndex) => (
                        <p key={amenity} className="flex items-start gap-1 text-[1.45cqw] font-semibold"><CanaRockAmenityIcon iconKey={item.amenity_icon_map?.[String(amenityIndex)] || resolveIconKey(amenity)} className="mt-0.5 h-[1.7cqw] w-[1.7cqw] shrink-0 text-[var(--proposal-accent)]" />{amenity}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[1.5cqw] font-black uppercase text-[var(--proposal-accent)]"><LocalizedText text={"Plan de pagos"} /></p>
                  <div className="mt-[2%] divide-y divide-slate-200 border-y border-slate-200">
                    {getPlanRows(item).slice(0, 5).map((row, rowIndex) => (
                      <div key={`${row.label}-${rowIndex}`} className="grid grid-cols-[1fr_auto] gap-3 py-[2.2%] text-[1.45cqw]">
                        <div><p className="font-black">{row.label}</p><p className="text-[1.25cqw] text-slate-500">{row.detail}</p></div>
                        <p className="font-black">{typeof row.amount === 'number' ? formatCurrency(row.amount, item.currency) : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </LetterPage>
        ))}

        <LetterPage page={items.length + 3} total={items.length + 4}>
          <UITranslationBoundary attributes={["title"]}><PageHeading kicker="Archivo visual" title="El proyecto en imagenes" body="Referencias visuales de arquitectura, distribucion y amenidades incluidas en esta propuesta." /></UITranslationBoundary>
          <div className="grid flex-1 grid-cols-2 grid-rows-3 gap-[2%] px-[6%] pb-[6%]">
            {images.slice(0, 6).map((image, index) => (
              <div key={`${image}-${index}`} className="relative overflow-hidden bg-slate-100">
                <Image src={image} alt={`Referencia ${index + 1}`} fill unoptimized className="object-cover" sizes="390px" />
                <span className="absolute bottom-[4%] left-[4%] bg-white px-[3%] py-[1.4%] text-[1.35cqw] font-black">#{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </LetterPage>

        <LetterPage page={items.length + 4} total={items.length + 4}>
          <div className="flex h-full flex-col">
            <div className="flex flex-1 flex-col justify-center px-[9%]">
              <p className="text-[1.8cqw] font-black uppercase text-[var(--proposal-accent)]"><LocalizedText text={"Preparada y enviada por"} /></p>
              <div className="mt-[5%] flex items-center gap-[5%]">
                {proposal.broker_avatar ? (
                  <Image src={proposal.broker_avatar} alt={proposal.broker_name} width={160} height={160} unoptimized className="h-[16cqw] w-[16cqw] rounded-full object-cover" />
                ) : (
                  <div className="flex h-[16cqw] w-[16cqw] items-center justify-center rounded-full bg-slate-950 text-[4cqw] font-black text-white">{agentInitials || <UserRound />}</div>
                )}
                <div>
                  <h2 className="text-[5cqw] font-black leading-tight">{proposal.broker_name || 'Asesor inmobiliario'}</h2>
                  {proposal.agency_name && <p className="mt-[2%] text-[2cqw] font-semibold text-slate-500">{proposal.agency_name}</p>}
                </div>
              </div>
              <div className="mt-[8%] grid grid-cols-2 gap-[3%]">
                {proposal.broker_phone && <UITranslationBoundary attributes={["label"]}><ContactLine icon={Phone} label="Telefono" value={proposal.broker_phone} /></UITranslationBoundary>}
                {proposal.broker_email && <UITranslationBoundary attributes={["label"]}><ContactLine icon={Mail} label="Correo" value={proposal.broker_email} /></UITranslationBoundary>}
              </div>
              <p className="mt-[8%] max-w-[82%] text-[2cqw] leading-relaxed text-slate-600"><LocalizedText text={"Estoy disponible para confirmar disponibilidad, responder preguntas y acompanarte durante el proceso de seleccion y reserva."} /></p>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-[8%] bg-slate-950 p-[7%] text-white">
              <div>
                <DocumentLogo proposal={proposal} inverted />
                <p className="mt-[5%] max-w-[85%] text-[1.35cqw] leading-relaxed text-white/55"><LocalizedText text={"Precios, disponibilidad y condiciones sujetos a confirmacion. Esta propuesta es informativa y no constituye un contrato de compraventa ni una reserva."} /></p>
              </div>
              <p className="text-[1.45cqw] font-bold uppercase text-white/60">{formatDate(proposal.created_at, true)}</p>
            </div>
          </div>
        </LetterPage>

        <section className="my-2 border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:hidden" data-no-export>
          {decision ? (
            <div className="flex items-start gap-4">
              {decision === 'accepted' ? <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-700" /> : <XCircle className="h-7 w-7 shrink-0 text-rose-700" />}
              <div>
                <h2 className="text-xl font-black"><LocalizedText text={"Respuesta registrada"} /></h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {decision === 'accepted' ? 'Confirmaste tu interes en continuar con esta propuesta.' : 'Indicaste que no deseas continuar con esta propuesta.'}<LocalizedText text={" Tu asesor recibira el seguimiento correspondiente."} /></p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-black uppercase text-[var(--proposal-accent)]"><LocalizedText text={"Decision del cliente"} /></p>
              <h2 className="mt-2 text-2xl font-black"><LocalizedText text={"¿Deseas continuar con esta propuesta?"} /></h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600"><LocalizedText text={"Aceptar expresa interes para continuar el proceso. No constituye una reserva ni un contrato de compraventa."} /></p>
              <label className="mt-5 block text-xs font-black text-slate-700" htmlFor="proposal-comment"><LocalizedText text={"Comentario opcional"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><textarea id="proposal-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={3} placeholder="Escribe una pregunta o indica por que no deseas continuar." className="mt-2 w-full resize-none border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--proposal-accent)]" /></UITranslationBoundary>
              {decisionError && <p className="mt-2 text-sm font-semibold text-rose-700">{decisionError}</p>}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => submitDecision('accepted')} disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--proposal-primary)] px-5 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /><LocalizedText text={"Aceptar propuesta"} /></button>
                <button type="button" onClick={() => submitDecision('rejected')} disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 disabled:opacity-50"><XCircle className="h-4 w-4" /><LocalizedText text={"Rechazar"} /></button>
              </div>
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        @page { size: Letter portrait; margin: 0; }
        @media print {
          body { background: #fff !important; }
          [data-proposal-page='true'] { break-after: page; box-shadow: none !important; width: 8.5in !important; height: 11in !important; }
        }
      `}</style>
    </div>
  );
}

function LetterPage({ children, page, total, className = '' }: { children: React.ReactNode; page: number; total: number; className?: string }) {
  return (
    <article data-proposal-page="true" style={{ containerType: 'inline-size' }} className={`relative mx-auto flex aspect-[8.5/11] w-full max-w-[816px] flex-col overflow-hidden bg-white shadow-[0_12px_35px_rgba(15,23,42,0.13)] ${className}`}>
      {children}
      <div className="pointer-events-none absolute bottom-[2.1%] right-[3%] text-[1.15cqw] font-black uppercase text-slate-400"><LocalizedText text={"Pag. "} />{String(page).padStart(2, '0')}<LocalizedText text={" de "} />{String(total).padStart(2, '0')}</div>
    </article>
  );
}

function PageHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[0.95fr_1.05fr] items-end gap-[7%] px-[6%] pb-[4%] pt-[7%]">
      <div><p className="text-[1.55cqw] font-black uppercase tracking-[0.24em] text-[var(--proposal-accent)]">{kicker}</p><h2 className="mt-[2%] text-[5.2cqw] font-serif italic leading-tight">{title}</h2></div>
      <p className="text-[1.75cqw] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function DocumentLogo({ proposal, inverted = false }: { proposal: MultiPropertyProposal; inverted?: boolean }) {
  if (proposal.agency_logo) {
    return <Image src={proposal.agency_logo} alt={proposal.agency_name || 'Agencia'} width={180} height={56} unoptimized className={`h-[6cqw] w-[19cqw] object-contain object-left ${inverted ? 'brightness-0 invert' : ''}`} />;
  }
  return <p className={`text-[2.4cqw] font-black ${inverted ? 'text-white' : 'text-slate-950'}`}>{proposal.agency_name || 'OB Brokers Team'}</p>;
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={compact ? 'px-[6%]' : 'mb-[13%]'}><p className="text-[1.35cqw] font-black uppercase text-slate-400">{label}</p><p className="mt-[2%] text-[2.3cqw] font-black leading-tight">{value}</p></div>;
}

function Spec({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return <div className="border-r border-slate-200 px-[8%] last:border-r-0"><Icon className="h-[2.4cqw] w-[2.4cqw] text-[var(--proposal-accent)]" /><p className="mt-[5%] text-[1.2cqw] font-black uppercase text-slate-400">{label}</p><p className="mt-[2%] text-[1.9cqw] font-black">{value}</p></div>;
}

function ContactLine({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return <div className="flex items-center gap-[5%] border border-slate-200 p-[5%]"><Icon className="h-[2.8cqw] w-[2.8cqw] shrink-0 text-[var(--proposal-accent)]" /><div className="min-w-0"><p className="text-[1.2cqw] font-black uppercase text-slate-400">{label}</p><p className="mt-1 break-all text-[1.65cqw] font-black">{value}</p></div></div>;
}

function ToolbarButton({ label, icon: Icon, onClick, disabled, primary }: { label: string; icon: typeof Share2; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={label} className={`inline-flex h-9 items-center justify-center gap-2 px-3 text-xs font-black disabled:opacity-50 ${primary ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span></button>;
}
