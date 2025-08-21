const CACHE_NAME = 'aisle9-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/login.js',
    '/js/firebase.js',
    '/js/firebase-config.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css?family=Fira+Sans:400,500,600,700,800'
];

self.addEventListener('install', (event) => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Check if the request is for a Google API, and if so, don't intercept.
    const url = new URL(event.request.url);
    if (url.origin === 'https://firestore.googleapis.com' || url.origin === 'https://www.gstatic.com') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Network-first strategy for all other requests
    event.respondWith(
        fetch(event.request)
        .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            return response;
        })
        .catch(() => {
            // If the network request fails, try to get it from the cache
            return caches.match(event.request);
        })
    );
});