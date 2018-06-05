const STATIC = 'static-v1';
const DYNAMIC = 'dynamic-v1';

// A list of local resources we always want to be cached.
const STATIC_URLS = [
    '/',
    'index.html',
    'restaurant.html',
    'offline.html',
    'manifest.json',
    'img/img-placeholder.svg',
    'css/styles.css',
    'js/main.js',
    'js/idb/idb.js',
    'js/idbhelper.js',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/8.7.1/lazyload.min.js',
    'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700'
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
            event.request.url.includes('cdnjs.cloudflare.com') ||
            event.request.url.includes('fonts.googleapis.com') ||
            event.request.url.endsWith('/restaurants')) {
        event.respondWith(
            caches.match(event.request, {ignoreSearch: true}).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return tryCacheThenNetwork(event.request.clone(), cachedResponse);
            })
        );
    } else if (event.request.url.includes('maps.googleapis.com') ||
            event.request.url.includes('maps.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return tryCacheThenNetwork(event.request.clone(), cachedResponse);
            })
        );
    }
});

const tryCacheThenNetwork = function(masterRequest, masterResponse) {

    return caches.open(DYNAMIC).then(cache => {
        return fetch(masterRequest).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(masterRequest, response.clone()).then(() => {
                return response;
            });
        }).catch(err => {
            if (masterRequest.headers.get('accept').includes('text/html')) {
                return caches.match('offline.html');
            } else if (masterRequest.headers.get('accept').includes('image/') &&
                !masterRequest.url.includes('maps.gstatic.com')) {
                return caches.match('img/img-placeholder.svg');
            }
            return masterResponse;
        });
    });

};