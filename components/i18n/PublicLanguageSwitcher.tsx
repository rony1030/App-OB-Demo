'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { localeNames, supportedLocales, getLocalizedPath, type Locale } from '@/lib/i18n/locale';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function PublicLanguageSwitcher({ dark = false, circular = false }: { dark?: boolean; circular?: boolean }) {
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

    // If on a page with a route, update address bar to localized path seamlessly
    if (pathname) {
      const nextPath = getLocalizedPath(pathname, nextLocale);
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      router.push(`${nextPath}${search}${hash}`);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${
          circular ? 'h-10 w-10 justify-center rounded-full px-0' : 'h-10 rounded-lg px-3'
        } inline-flex items-center gap-2 border text-[11px] font-bold shadow-sm transition ${
          dark
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
            : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-white'
        }`}
        aria-expanded={open}
        aria-label="Cambiar idioma"
      >
        <Languages className={dark ? 'h-4 w-4 text-white/80' : 'h-4 w-4 text-blue-700'} />
        <span className={circular ? 'sr-only' : ''}>{locale.toUpperCase()}</span>
        {!circular && <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-[calc(100%+8px)] z-[70] w-40 overflow-hidden rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl ${
            dark ? 'border-white/15 bg-[#193322] text-white' : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          {supportedLocales.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelectLocale(item as Locale)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                locale === item
                  ? dark
                    ? 'bg-[#dbeabe] text-[#21412b] shadow-sm'
                    : 'bg-white text-blue-900 ring-1 ring-inset ring-blue-100 shadow-sm'
                  : dark
                  ? 'text-white/80 hover:bg-white/10 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`w-6 font-mono text-[10px] font-black ${dark && locale === item ? 'text-[#507735]' : ''}`}>
                {item.toUpperCase()}
              </span>
              <span className="flex-1">{localeNames[item]}</span>
              {locale === item && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
