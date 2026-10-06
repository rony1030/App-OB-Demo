import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const code = normalizeCurrencyCode(currency);
  const label = getCurrencyLabel(code);
  const value = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  return `${label} ${value}`;
}

export function formatCurrencyExplicit(amount: number, currency: string = 'USD'): string {
  return formatCurrency(amount, currency);
}

const PORTAL_TIME_ZONE = 'America/Santo_Domingo';

export function formatPortalDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}, locale: string = 'es') {
  const intlLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-DO';
  return new Intl.DateTimeFormat(intlLocale, { timeZone: PORTAL_TIME_ZONE, ...options }).format(new Date(value));
}

export function formatPortalDateTime(value: string | Date) {
  return formatPortalDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatPortalTime(value: string | Date) {
  return formatPortalDate(value, { hour: '2-digit', minute: '2-digit' });
}

function normalizeCurrencyCode(currency: string = 'USD'): string {
  const code = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : 'USD';
}

function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    USD: 'US$',
    DOP: 'RD$',
    EUR: 'EUR€',
    CAD: 'CAD$',
  };
  return labels[currency] || `${currency}$`;
}
