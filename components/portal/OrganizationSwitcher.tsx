'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import { switchMembership } from '@/app/portal/impersonate-actions';
import type { AvailableMembership } from '@/lib/auth/get-user';
import { roleLabels } from '@/lib/auth/permissions';

export default function OrganizationSwitcher({ memberships, activeId }: { memberships: AvailableMembership[]; activeId: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  if (memberships.length < 2) return null;

  return <div className="relative">
    <UITranslationBoundary attributes={["aria-label"]}><button type="button" aria-expanded={open} aria-label="Cambiar organización activa" onClick={() => setOpen(!open)}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50">
      <Building2 className="h-3.5 w-3.5" /><span className="hidden max-w-32 truncate sm:inline"><LocalizedText text={"Organización"} /></span><ChevronDown className="h-3 w-3" />
    </button></UITranslationBoundary>
    {open && <div className="absolute right-0 top-11 z-[70] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <p className="px-2 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Trabajar en"} /></p>
      {memberships.map((membership) => <button key={membership.id} type="button" disabled={pending}
        onClick={() => startTransition(async () => {
          setError('');
          const result = await switchMembership(membership.id);
          if (result.error) { setError(result.error); return; }
          router.replace('/portal');
          router.refresh();
        })}
        className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50 ${membership.id === activeId ? 'bg-blue-50 text-blue-900' : 'text-slate-700'}`}>
        <span className="flex items-center gap-2 text-xs font-bold">{membership.organization.name}{pending && <Loader2 className="h-3 w-3 animate-spin" />}</span>
        <span className="block text-[10px] text-slate-500">{roleLabels[membership.role] || membership.role}</span>
      </button>)}
      {error && <p role="alert" className="px-2 py-1 text-xs text-red-600">{error}</p>}
    </div>}
  </div>;
}
