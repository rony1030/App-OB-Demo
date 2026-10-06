'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, CheckCheck, ShieldCheck, Volume2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/portal/notifications/actions';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

interface NotificationRow {
  id: number;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.14, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // AudioContext blocked by browser autoplay policy
  }
}

function relativeTime(iso: string, locale: 'es' | 'en' | 'fr' = 'es') {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return locale === 'fr' ? 'à l’instant' : locale === 'en' ? 'just now' : 'ahora';
  if (minutes < 60) return locale === 'fr' ? `il y a ${minutes} min` : locale === 'en' ? `${minutes}m ago` : `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'fr' ? `il y a ${hours} h` : locale === 'en' ? `${hours}h ago` : `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return locale === 'fr' ? `il y a ${days} j` : locale === 'en' ? `${days}d ago` : `hace ${days} d`;
}

export default function NotificationBell() {
  const router = useRouter();
  const { locale } = useLocale();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const containerRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);
  const prevNotificationsRef = useRef<NotificationRow[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      queueMicrotask(() => setPermission(Notification.permission));
    }
  }, []);

  const triggerOsNotification = useCallback(async (item: NotificationRow) => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          reg.showNotification(item.title || 'OB Brokers CRM', {
            body: item.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: { url: item.link || '/portal' },
            tag: `notif-${item.id}`,
          });
          return;
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new window.Notification(item.title || 'OB Brokers CRM', {
          body: item.body,
          icon: '/icon-192x192.png',
        });
        n.onclick = () => {
          window.focus();
          if (item.link) router.push(item.link);
          n.close();
        };
      }
    } catch (err) {
      console.warn('Could not trigger OS notification:', err);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, link, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!cancelled && data) {
        if (initialLoadDone.current) {
          // Check for newly arrived unread notifications
          const prevIds = new Set(prevNotificationsRef.current.map((n) => n.id));
          const newlyArrived = data.filter((n) => !n.read_at && !prevIds.has(n.id));

          if (newlyArrived.length > 0) {
            playNotificationChime();
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              triggerOsNotification(newlyArrived[0]);
            }
          }
        }

        prevNotificationsRef.current = data;
        initialLoadDone.current = true;
        setNotifications(data);
      }
    }

    load();
    const id = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [triggerOsNotification]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function handleSelect(notification: NotificationRow) {
    if (!notification.read_at) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)));
      const result = await markNotificationReadAction(notification.id);
      if (result.error) {
        console.error('markNotificationReadAction failed', result.error);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read_at: null } : n)));
      }
    }
    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  async function handleMarkAllRead() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    const result = await markAllNotificationsReadAction();
    if (result.error) {
      console.error('markAllNotificationsReadAction failed', result.error);
      setNotifications(previous);
    }
  }

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        playNotificationChime();
        // Send a test confirmation notification
        triggerOsNotification({
          id: Date.now(),
          title: 'OB Brokers CRM',
          body: locale === 'fr'
            ? 'Alertes activées avec succès sur cet appareil !'
            : locale === 'en'
            ? 'Alerts successfully enabled on this device!'
            : '¡Alertas activadas con éxito en este dispositivo!',
          link: '/portal',
          read_at: null,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error requesting notification permission', e);
    }
  };

  const titleText = locale === 'fr' ? 'Notifications' : locale === 'en' ? 'Notifications' : 'Notificaciones';
  const markAllText = locale === 'fr' ? 'Tout marquer lu' : locale === 'en' ? 'Mark all as read' : 'Marcar todas leídas';
  const emptyText = locale === 'fr' ? 'Aucune notification.' : locale === 'en' ? 'No notifications.' : 'No tienes notificaciones.';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={titleText}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-0.5 text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-88 rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-black text-slate-900">{titleText}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
              >
                <CheckCheck className="h-3 w-3" />
                <span>{markAllText}</span>
              </button>
            )}
          </div>

          {/* OS Notification Permission Banner */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
            {permission === 'granted' ? (
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  {locale === 'fr'
                    ? 'Alertes système & sonores actives'
                    : locale === 'en'
                    ? 'System & audio alerts active'
                    : 'Alertas del sistema y audio activas'}
                </span>
                <UITranslationBoundary attributes={["title","aria-label"]}><button
                  type="button"
                  onClick={playNotificationChime}
                  title="Probar sonido"
                  aria-label="Probar sonido"
                  className="ml-auto rounded p-1 text-slate-400 hover:text-blue-600"
                >
                  <Volume2 className="h-3 w-3" />
                </button></UITranslationBoundary>
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-center gap-2 text-[10px] font-medium text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  {locale === 'fr'
                    ? <LocalizedText text={"Alertes bloquées dans le navigateur"} />
                    : locale === 'en'
                    ? 'Alerts blocked in browser settings'
                    : 'Alertas bloqueadas en navegador'}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-extrabold text-white shadow-xs transition hover:bg-blue-700 active:scale-98"
              >
                <span className="flex items-center gap-1.5">
                  <BellRing className="h-3 w-3 animate-pulse" />
                  {locale === 'fr'
                    ? 'Activer les alertes sur cet appareil'
                    : locale === 'en'
                    ? 'Enable alerts on this device'
                    : 'Activar alertas en este dispositivo'}
                </span>
                <span className="text-[9px] font-black uppercase opacity-80">📲</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">{emptyText}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelect(n)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50',
                    !n.read_at && 'bg-blue-50/60'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                    <span className="text-xs font-extrabold text-slate-900">{n.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">{n.body}</p>
                  <span className="text-[10px] font-semibold text-slate-400">{relativeTime(n.created_at, locale)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
