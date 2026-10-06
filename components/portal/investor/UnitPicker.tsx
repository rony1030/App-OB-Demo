import Image from 'next/image';
import type { InvestorReservationItem } from '@/lib/data/investor-portal';
import { STATUS_TONE, formatMoney } from './status';

export default function UnitPicker({
  reservations,
  selectedIndex,
  onSelect,
}: {
  reservations: InvestorReservationItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const many = reservations.length > 1;
  return (
    <section aria-label="Mis inmuebles">
      <ul
        className={`-mx-5 flex scroll-pl-5 snap-x snap-mandatory gap-3 sm:scroll-pl-8 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:grid md:overflow-visible md:px-0 ${
          many ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:max-w-sm'
        }`}
      >
        {reservations.map((r, idx) => {
          const tone = STATUS_TONE[r.account.operationalStatus];
          const selected = idx === selectedIndex;
          return (
            <li key={r.reservationId} className={`snap-start ${many ? 'w-[80%] shrink-0 sm:w-[46%] md:w-auto' : 'w-full'}`}>
              <button
                type="button"
                onClick={() => onSelect(idx)}
                aria-pressed={selected}
                className={`group block w-full overflow-hidden rounded-xl bg-white text-left shadow-[0_6px_24px_-12px_rgba(11,19,43,0.35)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A] ${
                  selected ? 'ring-2 ring-[#24207A]' : 'ring-1 ring-[#E4EBF5] hover:ring-[#24207A]/60'
                }`}
              >
                <span className="relative block aspect-[16/9] bg-[#E4EBF5]">
                  <Image src={r.coverImage} alt="" fill sizes="(min-width: 1024px) 30vw, 80vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#101826] shadow-sm">
                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                    {tone.label}
                  </span>
                </span>
                <span className="block p-4">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl tabular-nums text-[#101826]">{r.unitCode}</span>
                    <span className="text-sm tabular-nums text-[#5B6472]">{r.account.paidPercentage}%</span>
                  </span>
                  <span className="block truncate text-sm text-[#5B6472]">{r.projectName}</span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[#E4EBF5]" aria-hidden>
                    <span className="block h-full rounded-full bg-[#0C094E]" style={{ width: `${r.account.paidPercentage}%` }} />
                  </span>
                  <span className="mt-2 block text-xs text-[#6B7280]">
                    {r.account.remainingBalance > 0 ? `Resta ${formatMoney(r.account.remainingBalance, r.currency)}` : 'Saldado'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
