const CACHE_NAME = 'aisle9-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/login.js',
    '/js/firebase.js',
    '/js/firebase-config.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Check if the request is for the Firestore API.
    // If it is, bypass the Service Worker and go directly to the network.
    if (event.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Return the cached resource
                }
                return fetch(event.request); // Fall back to the network
            })
    );
});