/*
CACHE MANAGEMENT SYSTEM - Version Independent Updates
Self-contained cache system that doesn't rely on previous versions
*/

// Cache version identifier - increment this for each major update
const CACHE_VERSION = 'v1.0.10';
const CACHE_NAME = `harry-barber-${CACHE_VERSION}`;

// Assets to cache for offline functionality
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style2.css',
    '/css/mobile-responsive.css',
    '/css/mobile-positioning-system.css',
    '/js/booking.js',
    '/js/calendar.js',
    '/js/additional-services.js',
    '/js/data-sync.js',
    '/js/encryption.js',
    '/images/logo/stylejarry.png',
    '/images/JERRYSTYLE.png',
    '/manifest.json',
    '/sw.js'
];

// Cache update strategy - Fresh start approach
self.addEventListener('install', (event) => {
    console.log(`[Cache] Installing ${CACHE_NAME}`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Cache] Caching assets');
                // Add all assets to fresh cache
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Cache] Installation complete');
                // Force activate new cache immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Cache] Installation failed:', error);
            })
    );
});

// Cache activation - Clean old caches completely
self.addEventListener('activate', (event) => {
    console.log(`[Cache] Activating ${CACHE_NAME}`);
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete ALL old caches except current version
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log(`[Cache] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Cache] Activation complete - fresh start');
                // Claim clients immediately
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[Cache] Activation failed:', error);
            })
    );
});

// Fetch strategy - Network first, cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Handle different request types
    if (event.request.destination === 'document') {
        // HTML documents - Network first approach
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Ultimate fallback - basic offline page
                            return new Response(
                                '<html><body><h1>Offline Mode</h1><p>Content temporarily unavailable</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                })
        );
    } else {
        // Static assets - Cache first approach
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached version immediately
                        return cachedResponse;
                    }
                    
                    // Fetch from network and cache for future use
                    return fetch(event.request)
                        .then((response) => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                            }
                            return response;
                        });
                })
        );
    }
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'data-sync') {
        event.waitUntil(syncData());
    }
});

// Periodic background updates
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
        event.waitUntil(checkForUpdates());
    }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CHECK_UPDATES':
            checkForUpdates().then(() => {
                event.source.postMessage({ type: 'UPDATES_CHECKED' });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.source.postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then((info) => {
                event.source.postMessage({
                    type: 'CACHE_INFO',
                    data: info
                });
            });
            break;
    }
});

// Helper functions
async function syncData() {
    try {
        const response = await fetch('/api/sync');
        if (response.ok) {
            console.log('[Sync] Data synchronized successfully');
        }
    } catch (error) {
        console.error('[Sync] Data sync failed:', error);
    }
}

async function checkForUpdates() {
    try {
        const response = await fetch('/api/version');
        const data = await response.json();
        
        if (data.version !== CACHE_VERSION) {
            console.log('[Update] New version detected:', data.version);
            // Trigger cache refresh
            self.registration.update();
        }
    } catch (error) {
        console.log('[Update] Could not check for updates');
    }
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('[Cache] All caches cleared');
}

async function getCacheInfo() {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = {
            itemCount: keys.length,
            items: keys.map(request => request.url)
        };
    }
    
    return cacheInfo;
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('[SW] Global error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});