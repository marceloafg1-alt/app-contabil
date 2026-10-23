// Contabills teste v2: rede primeiro (as atualizações chegam), cópia guardada só quando está sem internet.
const CACHE = 'contabills-teste-v2-8';
const ARQS = ['./app.html', './index.html', './painel.html', './manifest.webmanifest', './manifest-contador.webmanifest', './manifest-painel.webmanifest', './manifest-escuro.webmanifest', './manifest-contador-escuro.webmanifest', './manifest-painel-escuro.webmanifest', '../icon-192.png', '../icon-512.png', '../icon-maskable-512.png', '../apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.indexOf('contabills-teste-v2') === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
