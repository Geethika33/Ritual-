const CACHE_NAME = 'ritual-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

// Install - cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - serve from cache
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Notification click - focus app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});

// Message from app - schedule alarm check
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_CHECK') {
    // The app sends this on load; SW just acknowledges
    e.ports[0]?.postMessage({ ok: true });
  }
});

// Periodic background check (fires when browser wakes SW)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'ritual-check') {
    e.waitUntil(checkAndNotify());
  }
});

// Also fire on push (dummy push to wake SW)
self.addEventListener('push', e => {
  e.waitUntil(checkAndNotify());
});

async function checkAndNotify() {
  // Get stored schedule from IndexedDB-like approach via clients
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  // Notifications are primarily handled by the app via setTimeout
  // This is a fallback for background wakeup
}
