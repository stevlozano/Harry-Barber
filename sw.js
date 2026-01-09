// Service Worker for Harry Barber PWA
const CACHE_NAME = 'harry-barber-v1.0.10';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/calender/calender.html',
  '/pages/admin/panel.html',
  '/pages/tipos-corte/tipos-corte.html',
  '/pages/promociones/promociones.html',
  '/pages/historial/story.html',
  '/js/main.js',
  '/js/calendar.js',
  '/js/booking.js',
  '/js/encryption.js',
  '/js/data-sync.js',
  '/js/firebase-config.js',
  '/js/barber-panel.js',
  '/js/additional-services.js',
  '/pages/calender/script.js',
  '/pages/calender/style.css',
  '/pages/admin/style.css',
  '/pages/promociones/style.css',
  '/pages/tipos-corte/style.css',
  '/pages/historial/style.css',
  '/images/logo/logo.png',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from Cache or Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Update Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Harry Barber';
    const options = {
      body: data.body || 'Nueva actualización disponible',
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-72x72.png'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});