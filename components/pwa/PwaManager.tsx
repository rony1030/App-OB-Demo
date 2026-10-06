'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaManager() {
  const { locale } = useLocale();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let active = true;

    // Detect browser-only state after hydration without forcing a synchronous
    // state update from the effect body.
    queueMicrotask(() => {
      if (!active) return;
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));

      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIos(/iphone|ipad|ipod/.test(userAgent));
    });

    // Register Service Worker cleanly
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for service worker updates periodically
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update ready
                  console.log('OB CRM PWA: Nueva versión disponible.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('OB CRM ServiceWorker registration: ', err);
        });
    }

    // Listen for beforeinstallprompt event (Android, Chrome, Edge, Windows)
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // Detect appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 4000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Standalone F5 / Ctrl+R reload shortcut — only in standalone PWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const handleKeydown = standaloneMode
      ? (e: KeyboardEvent) => {
          if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
            e.preventDefault();
            window.location.reload();
          }
        }
      : null;
    if (handleKeydown) window.addEventListener('keydown', handleKeydown);

    return () => {
      active = false;
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (handleKeydown) window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
      }
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  // If already running in standalone / installed window, no need to display install button
  if (isStandalone) {
    return null;
  }

  // Only render if browser supports prompt or is iOS
  if (!deferredPrompt && !isIos) {
    return null;
  }

  const installLabel =
    locale === 'fr' ? 'Installer l’App' : locale === 'en' ? 'Install App' : 'Instalar App';

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        title={installLabel}
        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-extrabold text-blue-700 shadow-xs transition hover:bg-blue-100 hover:border-blue-300"
      >
        <Download className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
        <span className="hidden sm:inline">{installLabel}</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950">
                  {locale === 'fr' ? 'Installer OB CRM' : locale === 'en' ? 'Install OB CRM' : 'Instalar OB CRM'}
                </h3>
                <p className="text-xs text-slate-500"><LocalizedText text={"iPhone / iPad"} /></p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                  1
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {locale === 'fr' ? (
                    <><LocalizedText text={"Touche le bouton "} /><strong><LocalizedText text={"Partager"} /></strong> <Share className="inline h-3.5 w-3.5 mx-0.5 text-blue-600" /><LocalizedText text={" dans la barre Safari."} /></>
                  ) : locale === 'en' ? (
                    <><LocalizedText text={"Tap the "} /><strong><LocalizedText text={"Share"} /></strong><LocalizedText text={" button "} /><Share className="inline h-3.5 w-3.5 mx-0.5 text-blue-600" /><LocalizedText text={" in the Safari toolbar."} /></>
                  ) : (
                    <><LocalizedText text={"Pulsa el botón "} /><strong><LocalizedText text={"Compartir"} /></strong> <Share className="inline h-3.5 w-3.5 mx-0.5 text-blue-600" /><LocalizedText text={" en la barra inferior de Safari."} /></>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                  2
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {locale === 'fr' ? (
                    <><LocalizedText text={"Fais défiler et sélectionne "} /><strong><LocalizedText text={"« Sur l’écran d’accueil » ⊞"} /></strong>.</>
                  ) : locale === 'en' ? (
                    <><LocalizedText text={"Scroll down and tap "} /><strong><LocalizedText text={"“Add to Home Screen” ⊞"} /></strong>.</>
                  ) : (
                    <><LocalizedText text={"Desplaza hacia abajo y selecciona "} /><strong><LocalizedText text={"“Añadir a pantalla de inicio” ⊞"} /></strong>.</>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
            >
              {locale === 'fr' ? 'Compris' : locale === 'en' ? 'Understood' : 'Entendido'}
            </button>
          </div>
        </div>
      )}

      {/* Installed Toast Notification */}
      {installedNotice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>
            {locale === 'fr'
              ? <LocalizedText text={"Application installée avec succès !"} />
              : locale === 'en'
              ? 'App successfully installed!'
              : <LocalizedText text={"¡Aplicación instalada con éxito!"} />}
          </span>
        </div>
      )}
    </>
  );
}
