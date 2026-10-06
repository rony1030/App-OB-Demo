import Image from 'next/image';
import { BadgeCheck, Mail, MessageCircle } from 'lucide-react';
import type { InvestorAdvisor } from '@/lib/data/investor-portal';
import { whatsappLink } from './status';

export default function AdvisorCard({ advisor, unitCode }: { advisor: InvestorAdvisor; unitCode: string }) {
  return (
    <aside className="rounded-xl bg-[#0C094E] p-6 text-white" aria-label="Su asesor">
      <p className="text-xs text-[#B8BDF2]">Su asesor personal</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#F5F8FC]">
          <Image src={advisor.photoUrl} alt={advisor.name} fill sizes="56px" className="object-contain p-3" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight">{advisor.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-[#C7CBEA]">{advisor.title}</p>
        </div>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#B8BDF2]">
        <BadgeCheck className="h-4 w-4" aria-hidden /> Asesor verificado
      </p>
      <div className="mt-5 grid gap-2.5">
        <a
          href={whatsappLink(advisor.whatsapp, `Hola ${advisor.name}, necesito asistencia con mi unidad ${unitCode}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0C094E] transition hover:bg-[#E8E8F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Escribir por WhatsApp
        </a>
        <a
          href={`mailto:${advisor.email}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm transition hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Mail className="h-4 w-4" aria-hidden /> Correo
        </a>
      </div>
    </aside>
  );
}
