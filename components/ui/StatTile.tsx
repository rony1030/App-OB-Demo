import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  className,
  href,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  className?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-black text-slate-900">{value}</p>
        {helper && <p className="mt-1 text-[10px] text-slate-400">{helper}</p>}
      </div>
      {Icon && (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md cursor-pointer',
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={cn(
        'flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs',
        className
      )}
    >
      {content}
    </article>
  );
}
