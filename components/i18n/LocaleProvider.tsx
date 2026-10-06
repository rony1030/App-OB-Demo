'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  supportedLocales,
  translate,
  autoTranslateDateOrPhrase,
  stripLocaleFromPath,
  getLocalizedPath,
  type Locale,
  type TranslationKey,
} from '@/lib/i18n/locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  autoTranslate: (text: string | undefined | null) => string;
  getLocalizedUrl: (targetLocale: Locale) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale && supportedLocales.includes(initialLocale)) {
      return initialLocale;
    }
    // Check URL pathname immediately if available
    if (typeof window !== 'undefined') {
      const { locale: pathLocale } = stripLocaleFromPath(window.location.pathname);
      if (pathLocale && supportedLocales.includes(pathLocale)) {
        return pathLocale;
      }
    }
    return 'es';
  });

  useEffect(() => {
    // 1. First priority: Check if current URL has a locale prefix
    if (typeof window !== 'undefined') {
      const { locale: pathLocale } = stripLocaleFromPath(window.location.pathname);
      if (pathLocale && supportedLocales.includes(pathLocale)) {
        queueMicrotask(() => setLocaleState(current => current === pathLocale ? current : pathLocale));
        document.documentElement.lang = pathLocale;
        window.localStorage.setItem('ob_locale', pathLocale);
        document.cookie = `ob_locale=${pathLocale}; path=/; max-age=31536000; samesite=lax`;
        return;
      }
    }

    // 2. Second priority: If no prefix on URL, restore saved preference
    const saved = window.localStorage.getItem('ob_locale');
    if (saved && supportedLocales.includes(saved as Locale) && !initialLocale) {
      queueMicrotask(() => setLocaleState(saved as Locale));
    }
  }, [initialLocale]);

  useEffect(() => {
    // Keep assistive technologies, browser translation and pronunciation in
    // sync with the language currently shown by proposals, landings and the portal.
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    window.localStorage.setItem('ob_locale', nextLocale);
    document.cookie = `ob_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const getLocalizedUrl = useCallback((targetLocale: Locale): string => {
    if (typeof window === 'undefined') return `/${targetLocale}`;
    const targetPath = getLocalizedPath(window.location.pathname, targetLocale);
    return `${targetPath}${window.location.search}${window.location.hash}`;
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
      autoTranslate: (text: string | undefined | null) => autoTranslateDateOrPhrase(text, locale),
      getLocalizedUrl,
    }),
    [locale, setLocale, getLocalizedUrl]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
