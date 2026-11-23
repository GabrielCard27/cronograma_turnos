// Service worker mínimo: hace la app instalable y muestra una pantalla si no hay conexión.
// No guarda páginas con datos de turnos (son privadas), solo archivos estáticos.
const CACHE = 'turnos-v1'
const BASE = ['/offline.html', '/icons/icon-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/offline.html')))
    return
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copia = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
            return res
          })
      )
    )
  }
})
