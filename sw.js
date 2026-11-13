/* Red Apple Distribution - service worker for web push only.
   No caching, no fetch handling: pages and assets always come from the network.
   Payload (JSON): { title, body, icon, badge, url, tag } */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { try { d = { body: event.data.text() }; } catch (e2) {} }
  var title = d.title || 'Red Apple Distribution';
  var opts = {
    body: d.body || '',
    icon: d.icon || '/apple-touch-icon.png',
    badge: d.badge || '/apple-touch-icon.png',
    tag: d.tag || undefined,
    data: { url: d.url || '/shop/' }
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/shop/';
  try { url = new URL(url, self.location.origin).href; } catch (e) { url = self.location.origin + '/shop/'; }
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url === url && 'focus' in list[i]) return list[i].focus();
    }
    return self.clients.openWindow(url);
  }));
});
