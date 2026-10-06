import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { headers, cookies } from 'next/headers';
import { Dancing_Script, Fraunces, Great_Vibes, Inter } from 'next/font/google';
import './globals.css';
import { BrandProvider } from '../components/branding/BrandProvider';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import AppLaunch from '@/components/pwa/AppLaunch';
import AppNotifications from '@/components/feedback/AppNotifications';

const favicon = getPublicAssetUrl('ob-brokers-team/brand/ob-brokers-team-isotype-blue.png');

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
// Editorial serif for headlines — echoes the serif "OB" wordmark in the brand
// logo instead of pairing it with an all-sans-serif SaaS look.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz', 'SOFT', 'WONK'] });
// Script faces used only for the agent signature in the Estudio Creativo carousel.
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-signature-dancing' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-signature-greatvibes' });

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'OB Brokers Team | Plataforma inmobiliaria',
  description: 'CRM multi-proyecto para master brokers, brokers y equipos comerciales inmobiliarios.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://brokers.osvaldobello.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OB CRM',
  },
  icons: {
    icon: favicon,
    shortcut: favicon,
    apple: '/app-icons/180',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const headerLocale = headerList.get('x-ob-locale') as Locale | null;
  const cookieLocale = cookieStore.get('ob_locale')?.value as Locale | undefined;
  const initialLocale: Locale =
    headerLocale && ['es', 'en', 'fr'].includes(headerLocale)
      ? headerLocale
      : cookieLocale && ['es', 'en', 'fr'].includes(cookieLocale)
      ? cookieLocale
      : 'es';

  return (
    <html lang={initialLocale} className={`${inter.variable} ${fraunces.variable} ${dancingScript.variable} ${greatVibes.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="antialiased">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SJ90BN2127" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-SJ90BN2127', { anonymize_ip: true });`}
        </Script>
        <LocaleProvider initialLocale={initialLocale}>
          <AppLaunch />
          <AppNotifications />
          <BrandProvider>{children}</BrandProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
