import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { headers, cookies } from 'next/headers';
import './globals.css';
import { BrandProvider } from '../components/branding/BrandProvider';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import AppLaunch from '@/components/pwa/AppLaunch';
import AppNotifications from '@/components/feedback/AppNotifications';

const favicon = '/brand/logo-isotype-blue.png';

const isDemoDeployment = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo';

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
    <html lang={initialLocale} className={isDemoDeployment ? 'demo-fonts' : 'production-fonts'}>
      <head>
        {!isDemoDeployment && <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Fraunces:opsz,wght@9..144,100..900&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        </>}
        {!isDemoDeployment && <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />}
      </head>
      <body className="antialiased">
        {!isDemoDeployment && <Script src="https://www.googletagmanager.com/gtag/js?id=G-SJ90BN2127" strategy="afterInteractive" />}
        {!isDemoDeployment && <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-SJ90BN2127', { anonymize_ip: true });`}
        </Script>}
        <LocaleProvider initialLocale={initialLocale}>
          <AppLaunch />
          {!isDemoDeployment && <AppNotifications />}
          <BrandProvider>{children}</BrandProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
