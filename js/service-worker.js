// service-worker.js
const CACHE_NAME = 'aisle9-cache-v1.2.6';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/login.js',
    '/js/firebase-config.js',
];

// Install Event: Caches all static assets, gracefully handling errors
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache. Attempting to add URLs individually...');
                // Use Promise.all with .map to add each URL individually,
                // catching errors for each one so the whole operation doesn't fail.
                return Promise.all(
                    urlsToCache.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url} with status: ${response.status}`);
                                }
                                return cache.put(url, response);
                            })
                            .catch(error => {
                                console.error(`Failed to cache ${url}:`, error);
                                // Don't re-throw the error, so other files can still be cached.
                            });
                    })
                );
            })
            .then(() => {
                console.log('Installation complete. All available assets have been cached.');
            })
            .catch(error => {
                console.error('Service Worker installation failed due to a critical error:', error);
                // This catch block would only be reached if caches.open failed.
            })
    );
});

// Fetch Event: Intercepts network requests and serves from cache first
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // If a cached response is found, return it
                if (response) {
                    return response;
                }
                // If not found in cache, fetch from the network
                return fetch(event.request);
            })
    );
});

// Activate Event: Cleans up old caches to save space
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
