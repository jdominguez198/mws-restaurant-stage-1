const STATIC = 'static-v1';
const DYNAMIC = 'dynamic-v1';

// A list of local resources we always want to be cached.
const STATIC_URLS = [
    '/',
    'index.html',
    'restaurant.html',
    'manifest.json',
    'css/styles.css',
    'js/main.js',
    'js/idb/idb.js',
    'js/idbhelper.js',
    'js/dbhelper.js',
    'js/restaurant_info.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC)
            .then(cache => cache.addAll(STATIC_URLS))
            //.then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    const currentCaches = [STATIC, DYNAMIC];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
    // Skip cross-origin requests, like those for Google Analytics.
    if (event.request.url.startsWith(self.location.origin) ||
            event.request.url.endsWith('/restaurants') ||
            event.request.url.includes('cdnjs.cloudflare.com') ||
            event.request.url.includes('maps.googleapis.com') ||
            event.request.url.includes('maps.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return caches.open(DYNAMIC).then(cache => {
                    return fetch(event.request).then(response => {
                        // Put a copy of the response in the runtime cache.
                        return cache.put(event.request, response.clone()).then(() => {
                            return response;
                        });
                    });
                });
            })
        );
    }
});