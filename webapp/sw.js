/* Service Worker — cache static assets for offline + fast reload */
var CACHE = 'facture-v2';
var ASSETS = [
  '.',
  'css/app.css',
  'js/config.js',
  'js/categories.js',
  'js/supabase.js',
  'js/auth.js',
  'js/helpers.js',
  'js/router.js',
  'js/pages/login.js',
  'js/pages/invoices.js',
  'js/pages/scan.js',
  'js/pages/report.js',
  'js/pages/profile.js',
  'manifest.json'
];

/* Install: cache all static assets */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
});

/* Fetch: cache-first for static assets, network-first for CDN/Supabase */
self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // Skip Supabase API calls — always network
  if (url.indexOf('supabase.co') !== -1) return;
  // CDN scripts — network first, fallback to cache
  if (url.indexOf('jsdelivr.net') !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, clone); });
        return res;
      }).catch(function () {
        return caches.match(e.request);
      })
    );
    return;
  }
  // Static assets — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (res) {
        caches.open(CACHE).then(function (cache) { cache.put(e.request, res.clone()); });
        return res;
      });
    })
  );
});
