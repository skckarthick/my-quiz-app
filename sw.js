// Service Worker for Offline Support and Caching
const CACHE_NAME = 'quiz-app-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/enhanced-styles.css',
    '/js/script.js',
    '/js/enhanced-script.js',
    '/js/security.js',
    '/js/animations.js',
    '/questions/quantitative.json',
    '/questions/verbal.json',
    '/questions/logical.json',
    '/questions/general_awareness.json',
    '/questions/current_affairs.json',
    '/questions/domain1.json',
    '/questions/domain2.json',
    '/questions/domain3.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app resources');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        // Sync any pending data when back online
        console.log('🔄 Syncing offline data');
        // Implementation for syncing offline quiz progress
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New quiz content available!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Start Quiz',
                icon: '/icon-explore.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Quiz App', options)
    );
});