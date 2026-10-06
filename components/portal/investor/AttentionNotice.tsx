import { ArrowRight } from 'lucide-react';
import type { InvestorAdvisor, InvestorReservationItem } from '@/lib/data/investor-portal';
import { STATUS_TONE, formatMoney, whatsappLink } from './status';

export type PortalTab = 'summary' | 'payments' | 'documents' | 'progress';

const btnPrimary =
  'inline-flex items-center gap-2 rounded-md bg-[#0C094E] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24207A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A]';
const btnGhost =
  'inline-flex items-center gap-2 rounded-md border border-[#101826]/30 px-4 py-2.5 text-sm text-[#101826] transition hover:border-[#101826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A]';

/** Aviso contextual: solo aparece cuando el estado de la unidad exige atención o merece una nota formal. */
export default function AttentionNotice({
  unit,
  advisor,
  onNavigate,
}: {
  unit: InvestorReservationItem;
  advisor: InvestorAdvisor;
  onNavigate: (tab: PortalTab) => void;
}) {
  const a = unit.account;
  const tone = STATUS_TONE[a.operationalStatus];
  const c = unit.currency;
  const shell = `border-l-2 ${tone.rule} bg-[#FFFFFF] py-6 pl-6 pr-5 sm:pl-8`;

  if (a.operationalStatus === 'proceso_entrega') {
    return (
      <section className={shell} aria-labelledby="notice-title">
        <p className={`text-xs font-medium ${tone.text}`}>Protocolo de entrega · Pago Insoluto</p>
        <h3 id="notice-title" className="mt-1 font-display text-2xl text-[#101826]">
          Su unidad está terminada e inspeccionada
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#3d4655]">
          El Pago Insoluto es el saldo final que se liquida antes de recibir las llaves y firmar el título de propiedad.
          La entrega se coordina en cuanto se confirme el pago total.
        </p>
        <dl className="mt-6 max-w-lg text-sm">
          <div className="flex justify-between border-b border-[#DCE3EE] py-2.5">
            <dt className="text-[#3d4655]">Pago Insoluto</dt>
            <dd className="tabular-nums text-[#101826]">{formatMoney(a.insolutoBalance, c)}</dd>
          </div>
          <div className="flex justify-between border-b border-[#DCE3EE] py-2.5">
            <dt className="text-[#3d4655]">{a.overdueCount} cuotas mensuales vencidas</dt>
            <dd className="tabular-nums text-[#101826]">{formatMoney(a.overdueAmount, c)}</dd>
          </div>
          <div className="flex justify-between border-b border-[#DCE3EE] py-2.5">
            <dt className="text-[#3d4655]">Mora aplicada</dt>
            <dd className="tabular-nums text-[#101826]">{formatMoney(a.moraAmount, c)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pt-4">
            <dt className="font-medium text-[#101826]">Total a liquidar para recibir llaves</dt>
            <dd className="font-display text-3xl tabular-nums text-[#24207A]">{formatMoney(a.totalToDeliver, c)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={whatsappLink(advisor.whatsapp, `Hola, quiero coordinar la liquidación del Pago Insoluto y la entrega de la unidad ${unit.unitCode}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            Coordinar liquidación y entrega <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <button type="button" onClick={() => onNavigate('payments')} className={btnGhost}>
            Reportar pago
          </button>
        </div>
      </section>
    );
  }

  if (a.operationalStatus === 'vencida') {
    return (
      <section className={shell} aria-labelledby="notice-title">
        <p className={`text-xs font-medium ${tone.text}`}>Cuotas vencidas</p>
        <h3 id="notice-title" className="mt-1 font-display text-2xl text-[#101826]">
          {a.overdueCount} cuotas atrasadas con mora aplicada
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#3d4655]">
          Cuotas por {formatMoney(a.overdueAmount, c)} más mora acumulada de {formatMoney(a.moraAmount, c)}. Para
          regularizar la unidad y evitar su paso a gestión jurídica, el monto a pagar es{' '}
          <strong className="font-medium text-[#101826]">{formatMoney(a.regularizationAmount, c)}</strong>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => onNavigate('payments')} className={btnPrimary}>
            Reportar pago <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <a
            href={whatsappLink(advisor.whatsapp, `Hola, necesito ayuda con las cuotas vencidas de la unidad ${unit.unitCode}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={btnGhost}
          >
            Hablar con mi asesor
          </a>
        </div>
      </section>
    );
  }

  if (a.operationalStatus === 'en_legal') {
    return (
      <section className={shell} aria-labelledby="notice-title">
        <p className={`text-xs font-medium ${tone.text}`}>Notificación formal</p>
        <h3 id="notice-title" className="mt-1 font-display text-2xl text-[#101826]">
          Expediente en proceso jurídico
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#3d4655]">
          {unit.legalNotes ?? 'Este inmueble tiene un requerimiento legal vigente por cuotas acumuladas en mora.'} Hay{' '}
          {a.overdueCount} cuotas vencidas por {formatMoney(a.overdueAmount, c)} y mora de {formatMoney(a.moraAmount, c)}.
          Para conciliar su expediente, comuníquese con el Departamento Jurídico.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={whatsappLink(advisor.legalWhatsapp, `Solicito conciliación con el Departamento Jurídico para la unidad ${unit.unitCode}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            Contactar al Departamento Jurídico <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <button type="button" onClick={() => onNavigate('documents')} className={btnGhost}>
            Ver intimación
          </button>
        </div>
      </section>
    );
  }

  if (a.operationalStatus === 'entregada') {
    return (
      <section className={shell} aria-labelledby="notice-title">
        <p className={`text-xs font-medium ${tone.text}`}>Entrega completada</p>
        <h3 id="notice-title" className="mt-1 font-display text-2xl text-[#101826]">
          Inmueble saldado y entregado
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#3d4655]">
          El acta de entrega de llaves fue firmada y recibida conforme. No hay saldo pendiente.
        </p>
        <div className="mt-5">
          <button type="button" onClick={() => onNavigate('documents')} className={btnGhost}>
            Ver acta de entrega
          </button>
        </div>
      </section>
    );
  }

  return null;
}
