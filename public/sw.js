// Flousy service worker.
//
// Deliberately conservative: the app shell is cached so the PWA opens
// offline, but Firestore/Auth traffic is never intercepted — stale financial
// data would be worse than an honest offline state, and the Firebase SDK has
// its own offline persistence.

const CACHE = 'flousy-shell-v1'
const SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API/auth traffic or anything cross-origin.
  if (url.origin !== self.location.origin) return
  if (/firestore|googleapis|identitytoolkit|firebaseio/.test(url.hostname)) return

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('/'))),
    )
    return
  }

  // Static assets: cache first.
  if (/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(hit =>
        hit ||
        fetch(request).then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {})
          return res
        }),
      ),
    )
  }
})
