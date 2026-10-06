import copy from './interface-copy.json';
import type { Locale } from './locale';

const dictionary: Readonly<Record<string, { en?: string; fr?: string }>> = copy;

/** Static interface copy only. Project/customer values never enter this lookup implicitly. */
export function interfaceText(text: string, locale: Locale): string {
  const decode = (value: string) => value.replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' })[name] || _);
  if (locale === 'es') return decode(text);
  const normalized = text.replace(/\s+/g, ' ').trim();
  const translated = dictionary[normalized]?.[locale];
  if (!translated) return decode(text);
  const leading = /^\s/.test(text) ? ' ' : '';
  const trailing = /\s$/.test(text) ? ' ' : '';
  return leading + decode(translated) + trailing;
}
