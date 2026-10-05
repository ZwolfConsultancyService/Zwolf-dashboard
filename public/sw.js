/* =========================================================
   ZWOLF NOTIFICATION SERVICE WORKER
========================================================= */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* =========================================================
   PUSH EVENT
========================================================= */

self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'New Message', body: event.data?.text() || '' };
  }

  const title = data.title || 'Zwolf';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'zwolf-message',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      conversationId: data.conversationId || null,
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);

          if (
            clientUrl.origin === self.location.origin &&
            'focus' in client
          ) {
            client.focus();
            client.postMessage({
              type: 'NAVIGATE',
              url: targetUrl,
            });
            return;
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});