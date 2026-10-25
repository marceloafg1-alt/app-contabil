// LivTask: rede primeiro para a página (atualizações chegam), cache para os ícones.
const CACHE = 'contabills-v3';
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

/* notificações push: o toque no aviso volta ao app que avisou (cliente, contador ou painel) e abre o ponto do aviso */
self.addEventListener('notificationclick', e => {
  const dt = e.notification.data || {};
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const url = dt.url || self.registration.scope;
    const iguais = cs.filter(c => c.url.split('#')[0] === url);
    iguais.forEach(c => c.postMessage({ tipo: 'push-abrir', data: dt }));
    const c = iguais[0];
    if (c) return c.focus();
    return self.clients.openWindow(url);
  }));
});

/* com um servidor de push, o que ele mandar ({ titulo, texto, app, go }) aparece aqui, mesmo com o app fechado */
self.addEventListener('push', e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { m = { texto: e.data ? e.data.text() : '' }; }
  const icone = new URL(self.registration.scope.indexOf('/teste-comunicacao') > -1 ? '../icon-192.png' : './icon-192.png', self.registration.scope).href;
  e.waitUntil(self.registration.showNotification(m.titulo || 'LivTask', {
    body: m.texto || '', icon: icone, badge: icone, lang: 'pt-BR', tag: m.tag || undefined,
    data: { app: m.app || '', go: m.go || '', k: m.k || '', url: m.url || self.registration.scope }
  }));
});
