'use client';

import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { useLocale } from './LocaleProvider';
import { interfaceText } from '@/lib/i18n/interface-text';

export function LocalizedText({ text }: { text: string }) {
  const { locale } = useLocale();
  return interfaceText(text, locale);
}

/** Localizes explicit interface attributes without changing input values or data. */
export function UITranslationBoundary({ children, attributes = [] }: { children: ReactNode; attributes?: readonly string[] }) {
  const { locale } = useLocale();
  return Children.map(children, child => {
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<Record<string, unknown>>;
    const translated: Record<string, string> = {};
    for (const key of attributes) {
      if (typeof element.props[key] === 'string') translated[key] = interfaceText(element.props[key], locale);
    }
    return cloneElement(element, translated);
  });
}
