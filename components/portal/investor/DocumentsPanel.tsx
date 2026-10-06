import { Download, FileText, MessageCircle } from 'lucide-react';
import type { InvestorAdvisor, InvestorDocument } from '@/lib/data/investor-portal';
import { formatDate, whatsappLink } from './status';

const TYPE_LABEL: Record<string, string> = {
  promesa_compraventa: 'Promesa de compraventa',
  contract: 'Contrato',
  recibo_oficial: 'Recibo oficial',
  payment_receipt: 'Recibo de pago',
  carta_liquidacion: 'Carta de liquidación de saldo insoluto',
  acta_entrega: 'Acta de entrega',
  aviso_cobro: 'Aviso de cobro',
  intimacion_legal: 'Intimación legal',
  other: 'Documento',
};

function DocumentRow({ doc, advisor }: { doc: InvestorDocument; advisor: InvestorAdvisor }) {
  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#24207A]" aria-hidden />
        <div>
          <p className="text-xs text-[#6B7280]">{TYPE_LABEL[doc.documentType] ?? 'Documento'}</p>
          <p className="text-[#101826]">{doc.title}</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">{formatDate(doc.createdAt)}</p>
        </div>
      </div>
      {doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[#101826] underline decoration-[#94A3B8] underline-offset-4 hover:decoration-[#101826]"
        >
          <Download className="h-4 w-4" aria-hidden /> Descargar
        </a>
      ) : (
        <a
          href={whatsappLink(advisor.whatsapp, `Hola, solicito copia del documento: ${doc.title}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[#101826] underline decoration-[#94A3B8] underline-offset-4 hover:decoration-[#101826]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Solicitar copia
        </a>
      )}
    </li>
  );
}

export default function DocumentsPanel({
  documents,
  unitCode,
  advisor,
}: {
  documents: InvestorDocument[];
  unitCode: string;
  advisor: InvestorAdvisor;
}) {
  const forUnit = documents.filter((d) => d.unitCode === unitCode);
  const general = documents.filter((d) => !d.unitCode);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="font-display text-2xl text-[#101826]">Documentos · {unitCode}</h2>
        <p className="mt-1 max-w-prose text-sm text-[#5B6472]">
          Promesa de compraventa, recibos oficiales, carta de liquidación de saldo insoluto y acta de entrega.
        </p>
      </header>

      <section aria-label={`Documentos de la unidad ${unitCode}`}>
        {forUnit.length > 0 ? (
          <ul className="divide-y divide-[#E4EBF5] border-y border-[#DCE3EE]">
            {forUnit.map((d) => <DocumentRow key={d.id} doc={d} advisor={advisor} />)}
          </ul>
        ) : (
          <p className="border-y border-[#DCE3EE] py-10 text-center text-sm text-[#6B7280]">
            Los documentos de esta unidad aparecerán aquí a medida que se formalicen.
          </p>
        )}
      </section>

      {general.length > 0 && (
        <section aria-label="Documentos generales">
          <h3 className="font-display text-xl text-[#101826]">Documentos generales</h3>
          <ul className="mt-3 divide-y divide-[#E4EBF5] border-y border-[#DCE3EE]">
            {general.map((d) => <DocumentRow key={d.id} doc={d} advisor={advisor} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
