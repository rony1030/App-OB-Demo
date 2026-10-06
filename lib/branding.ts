import type { BrandTheme } from '../types/branding';
import { DEFAULT_BRAND } from '../types/branding';

/**
 * Injects dynamic CSS variables for white-label styling in the browser
 */
export function applyBrandTheme(theme: Partial<BrandTheme>) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = theme.primary_color || DEFAULT_BRAND.primary_color;
  const secondary = theme.secondary_color || DEFAULT_BRAND.secondary_color;
  const accent = theme.accent_color || DEFAULT_BRAND.accent_color;
  const surface = theme.surface_color || DEFAULT_BRAND.surface_color;

  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-secondary', secondary);
  root.style.setProperty('--brand-accent', accent);
  root.style.setProperty('--brand-surface', surface);
}
