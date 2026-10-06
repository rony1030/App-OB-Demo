'use client';

import { Check, Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { localeNames, supportedLocales, getLocalizedPath, type Locale } from '@/lib/i18n/locale';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSelectLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setOpen(false);

    if (pathname) {
      const nextPath = getLocalizedPath(pathname, nextLocale);
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      router.push(`${nextPath}${search}${hash}`);
    }
  };

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        aria-expanded={open}
        aria-label="Cambiar idioma"
      >
        <Languages className="h-4 w-4 text-blue-700" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {supportedLocales.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelectLocale(item as Locale)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${
                locale === item ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-6 font-mono text-[10px] font-black">{item.toUpperCase()}</span>
              <span className="flex-1">{localeNames[item]}</span>
              {locale === item && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
