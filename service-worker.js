const CACHE_NAME = 'aisle9-cache-v1.3.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/model.js',
    '/js/view.js',
    '/js/firebase-config.js',
    '/js/lib/page.mjs'
    '/js/data/initial-data.js',
    '/js/listings/listings-controller.js',
    '/js/listings/listings-model.js',
    '/js/listings/listings-view.js',
    '/js/comparisons/comparisons-controller.js',
    '/js/comparisons/comparisons-model.js',
    '/js/comparisons/comparisons-view.js',
    '/js/shopping-list/shopping-list-controller.js',
    '/js/shopping-list/shopping-list-model.js',
    '/js/shopping-list/shopping-list-view.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css?family=Fira+Sans:400,500,600,700,800',
];

self.addEventListener('install', event => {
    // Perform installation steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response because it's a stream
                        const responseToCache = response.clone();
                        
                        // Dynamically cache new requests
                        if (event.request.url.startsWith('https://')) {
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
