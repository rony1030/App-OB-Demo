// sw.js - Service Worker for OB Brokers CRM PWA
const CACHE_NAME = 'ob-crm-pwa-v3';
const ASSETS = [
  '/manifest.json',
  '/brand/logo-isotype-blue.png'
];

// ── Install: pre-cache shell assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key.startsWith('ob-crm-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for own static assets only ─────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // 1. Let browser handle navigations (HTML pages)
  if (request.mode === 'navigate') return;

  // 2. Never intercept Next.js internal chunks/static, APIs, portal RSC payloads, or supabase
  if (
    url.includes('/_next/') ||
    url.includes('/api/') ||
    url.includes('supabase.co') ||
    url.includes('_rsc') ||
    request.headers.get('RSC') ||
    request.headers.get('Next-Router-State-Tree') ||
    request.headers.get('Next-Url')
  ) {
    return;
  }

  // 3. Only handle same-origin GET requests
  if (request.method !== 'GET' || !url.startsWith(self.location.origin)) return;

  // 4. Only intercept specific static assets (images, icons, manifest, fonts)
  const isStaticAsset = url.match(/\.(png|jpg|jpeg|svg|webp|ico|json|woff2?)$/i) || new URL(url).pathname.startsWith('/app-icons/');
  if (!isStaticAsset) return;

  // 5. Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (!cached) {
            return new Response('Offline — recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          }
          return null;
        });

      if (cached) return cached;
      return networkFetch.then((res) => res || cached || new Response('', { status: 503 }));
    })
  );
});

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'OB Brokers CRM',
    body: 'Tienes una nueva actualización en el CRM.'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'OB Brokers CRM', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/brand/logo-isotype-blue.png',
    badge: '/brand/logo-isotype-blue.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'crm-notification',
    renotify: true,
    data: {
      url: data.url || '/portal'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/portal';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          if ('focus' in client) client.focus();
          if ('navigate' in client) return client.navigate(targetUrl);
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
