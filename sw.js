const V = 'seaking-v4';
const FILES = ['./', './index.html', './coast.js', './world.js', './game.js', './ui.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png',
  './fonts/fraunces.woff2', './fonts/hanken-grotesk.woff2', './fonts/jetbrains-mono.woff2', './mark/ring-small.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// network first, cache fallback: updates land on next open, offline still plays
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
