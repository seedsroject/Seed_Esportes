// Minimal Service Worker for PWA Installability
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch (no caching for now to avoid issues with dynamic content)
  event.respondWith(fetch(event.request));
});
