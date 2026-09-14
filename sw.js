// SHIFT offline shell. Network-first with a short timeout: a deployed fix lands
// the moment there is signal, but no signal still opens the trainer instantly.
const CACHE = 'shift-__BUILD_STAMP__';
const ASSETS = ['./implied-shift.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const NET_TIMEOUT_MS = 2000;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // fonts and anything else fend for themselves
  e.respondWith(networkFirst(req));
});

function networkFirst(req){
  return new Promise((resolve) => {
    let settled = false;
    const fromCache = () => {
      if (settled) return;
      settled = true;
      caches.match(req)
        .then((hit) => resolve(hit || new Response('offline', { status: 503, statusText: 'offline' })))
        .catch(() => resolve(new Response('offline', { status: 503, statusText: 'offline' })));
    };
    const timer = setTimeout(fromCache, NET_TIMEOUT_MS);
    fetch(req).then((res) => {
      clearTimeout(timer);
      if (settled) return;                            // the timeout already answered from cache
      settled = true;
      if (res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      resolve(res);
    }).catch(() => { clearTimeout(timer); fromCache(); });
  });
}
