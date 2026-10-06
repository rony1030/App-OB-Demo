'use client';
import { createContext, useContext } from 'react';
import type { Locale } from '@/lib/i18n/locale';
import { documentText } from '@/lib/i18n/document-copy';

// Editors retain Spanish until their content is translated too.
export const DocumentLocale = createContext<Locale>('es');
export function useDocumentText() {
  const locale = useContext(DocumentLocale);
  return (text: string) => documentText(text, locale);
}
