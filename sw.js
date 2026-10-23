// Contabills: rede primeiro para a página (atualizações chegam), cache para os ícones.
const CACHE = 'contabills-v1';
const ARQS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.indexOf('/teste-comunicacao') > -1) return; // os testes (v1 e v2) ficam fora do cache do app
  if (req.mode === 'navigate' || req.url.endsWith('/index.html')) {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copia));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
