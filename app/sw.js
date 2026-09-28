// Himalaya Mobile service worker: the app opens even with a bad connection (network first, cache as fallback).
const CACHE = 'himalaya-mobile-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', '../data.js', '../img/logo.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // Only this site's files (never the Supabase API calls)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)) }
        return res
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  )
})
// Tapping a notification opens (or focuses) the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = e.notification.data?.url || './'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.includes('/app/'))
    if (open) { open.postMessage({ open: e.notification.data }); return open.focus() }
    return self.clients.openWindow(target)
  }))
})
