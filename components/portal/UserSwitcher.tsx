'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchUsersForImpersonation, startImpersonation, stopImpersonation } from '@/app/portal/impersonate-actions';
import { roleLabels } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/get-user';

type SearchResult = {
  userId: string;
  displayName: string;
  email: string;
  memberships: { id: number; role: string; orgName: string; orgSlug: string }[];
};

export default function UserSwitcher({
  isPreviewMode,
  previewUserName,
  previewOrgName,
  mobileIcon = false,
}: {
  isPreviewMode?: boolean;
  previewUserName?: string;
  previewOrgName?: string;
  mobileIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const [actionError, setActionError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const doSearch = useCallback((term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchUsersForImpersonation(term).then((res) => {
      setResults(res.users);
      setSearching(false);
    });
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (user: SearchResult, membershipId: number) => {
    startTransition(async () => {
      const result = await startImpersonation(user.userId, membershipId);
      if (result.error) { setActionError(result.error); return; }
      setOpen(false);
      setQuery('');
      setResults([]);
      window.location.reload();
    });
  };

  const handleStop = () => {
    startTransition(async () => {
      await stopImpersonation();
      setOpen(false);
      window.location.reload();
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={isPreviewMode ? `Vista activa como ${previewUserName}` : 'Cambiar vista de usuario'}
        className={cn(
          mobileIcon
            ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition'
            : 'inline-flex h-9 items-center gap-2 rounded-full px-3 text-[11px] font-bold transition',
          isPreviewMode
            ? 'border-2 border-amber-400 bg-amber-50 text-amber-800 shadow-sm hover:bg-amber-100'
            : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50'
        )}
        title={isPreviewMode ? `Viendo como: ${previewUserName}` : 'Cambiar vista de usuario'}
      >
        {isPreviewMode ? <Eye className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        <span className={mobileIcon ? 'sr-only' : 'hidden sm:inline max-w-[120px] truncate'}>
          {isPreviewMode ? previewUserName : 'Vista'}
        </span>
      </button>

      {open && (
        <>
        <div className="fixed inset-0 z-[69] bg-slate-950/20 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />
        <div className="fixed inset-x-3 top-20 z-[70] sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+8px)] w-auto sm:w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
          {isPreviewMode && (
            <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600"><LocalizedText text={"Vista activa"} /></p>
                <p className="truncate text-xs font-bold text-amber-900">{previewUserName}</p>
                <p className="truncate text-[10px] text-amber-700">{previewOrgName}</p>
              </div>
              <button
                type="button"
                onClick={handleStop}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-[10px] font-extrabold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <EyeOff className="h-3 w-3" />}<LocalizedText text={"Volver"} /></button>
            </div>
          )}

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <UITranslationBoundary attributes={["placeholder"]}><input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Buscar por nombre, email o agencia…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
              /></UITranslationBoundary>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {actionError && <p role="alert" className="px-4 py-2 text-xs text-red-600">{actionError}</p>}
            {searching && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /><LocalizedText text={"Buscando…"} /></div>
            )}

            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400"><LocalizedText text={"Sin resultados"} /></p>
            )}

            {!searching && results.map((user) => (
              <div
                key={user.userId}
                className="border-t border-slate-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700">
                  {user.displayName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-900">
                    {user.displayName}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    {user.memberships.length} {user.memberships.length === 1 ? <LocalizedText text={"acceso"} /> : 'accesos'}
                  </span>
                </span>
                </div>
                <div className="mt-2 space-y-1 pl-11">
                  {user.memberships.map((membership) => (
                    <button key={membership.id} type="button" onClick={() => handleSelect(user, membership.id)} disabled={isPending}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-900 disabled:opacity-50">
                      <span className="font-semibold">{membership.orgName}</span>
                      <span className="block text-[10px] text-slate-400">{roleLabels[membership.role as UserRole] || membership.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {query.length < 2 && !searching && results.length === 0 && (
            <p className="px-4 pb-4 text-[10px] text-slate-400"><LocalizedText text={"Escribe al menos 2 caracteres para buscar"} /></p>
          )}
        </div>
        </>
      )}
    </div>
  );
}
