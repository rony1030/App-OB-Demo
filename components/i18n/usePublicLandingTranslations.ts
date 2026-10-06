'use client';

import { useEffect, useState } from 'react';
import { resolvePublicLandingTranslationsAction } from '@/app/public-translations/actions';
import type { Locale } from '@/lib/i18n/locale';

export function usePublicLandingTranslations(projectSlug: string, locale: Locale) {
  const requestKey = `${projectSlug}:${locale}`;
  const [result, setResult] = useState<{
    key: string;
    translations: Record<string, string>;
    error: string | null;
  }>({ key: '', translations: {}, error: null });

  useEffect(() => {
    let active = true;
    if (locale === 'es') return;
    void resolvePublicLandingTranslationsAction(projectSlug, locale).then((result) => {
      if (!active) return;
      setResult({ key: requestKey, translations: result.translations, error: result.error });
    });
    return () => { active = false; };
  }, [locale, projectSlug, requestKey]);

  if (locale === 'es') return { translations: {}, isLoading: false, error: null };
  if (result.key !== requestKey) return { translations: {}, isLoading: true, error: null };
  return { translations: result.translations, isLoading: false, error: result.error };
}
