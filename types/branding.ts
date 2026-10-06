export interface BrandTheme {
  id: string;
  name: string;
  subdomain?: string;
  custom_domain?: string;
  logo_url: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;     // Default #020433
  secondary_color: string;   // Default #D96A46
  accent_color: string;      // Default #C5A059
  surface_color: string;     // Default #F8F9FA
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  company_legal_name: string;
  rnc_tax_id?: string;
  website?: string;
  address?: string;
}

export const DEFAULT_BRAND: BrandTheme = {
  id: 'default',
  name: 'OB Brokers Team',
  logo_url: '/brand/logo-horizontal-blue-v2.png',
  logo_dark_url: '/brand/logo-horizontal-white-v2.png',
  favicon_url: '/brand/logo-isotype-blue.png',
  primary_color: '#0C094E',
  secondary_color: '#24207A',
  accent_color: '#E8E8F7',
  surface_color: '#F8F9FD',
  contact_email: 'info@obmasterbrokers.com',
  contact_phone: '+1 (809) 555-0199',
  whatsapp_number: '18095550199',
  company_legal_name: 'OB Brokers Team'
};

/** Sello "Proyecto comercializado por OB Brokers Team" — fijo de plataforma, no white-label por organización. */
export const OB_BROKERS_SEAL_URL = getPublicAssetUrl('ob-brokers-team/brand/logo-seal-navy.png');

import { getPublicAssetUrl } from '@/lib/supabase/storage';
