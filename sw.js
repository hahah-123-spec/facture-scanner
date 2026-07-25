/* Service Worker — cache smart, update fast */
var CACHE = 'facture-v13';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE));
  self.skipWaiting(); // activate immediately
});

self.addEventListener('activate', function (e) {
  // Clean old caches
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  clients.claim(); // take control of all pages
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // Skip Supabase API
  if (url.indexOf('supabase.co') !== -1) return;
  // Skip GitHub API
  if (url.indexOf('api.github.com') !== -1) return;

  // CDN scripts — network first, cache fallback
  if (url.indexOf('jsdelivr.net') !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res.ok) { var r = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, r); }); }
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // HTML — ALWAYS network first (get latest page)
  if (e.request.destination === 'document' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var r = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, r); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // Other static assets — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetched = fetch(e.request).then(function (res) {
        if (res.ok) { var r = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, r); }); }
        return res;
      });
      return cached || fetched;
    })
  );
});
