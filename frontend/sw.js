/**
 * Service Worker for Love Simulator
 * Provides offline support and caching for better performance
 */

const CACHE_NAME = 'love-simulator-v1.0.0';
const API_CACHE_NAME = 'love-simulator-api-v1.0.0';

// Files to cache for offline support
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/js/app.js',
    '/js/modules/config.js',
    '/js/modules/gameState.js',
    '/js/modules/apiClient.js',
    '/js/modules/gameEngine.js',
    '/js/utils/dom.js',
    '/manifest.json',
    // Add critical images
    '/images/icon-192x192.png',
    '/images/icon-512x512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/scenarios'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - intercept requests and serve from cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // Let other requests pass through
    event.respondWith(fetch(request));
});

/**
 * Handle API requests with network-first strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function handleApiRequest(request) {
    const url = new URL(request.url);

    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache successful GET requests
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', error);

        // Fallback to cache for GET requests
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // Return offline response for critical endpoints
        if (url.pathname === '/api/scenarios') {
            return new Response(
                JSON.stringify([
                    {
                        name: 'offline',
                        title: '오프라인 모드',
                        description: '인터넷 연결을 확인해주세요.'
                    }
                ]),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        throw error;
    }
}

/**
 * Handle static asset requests with cache-first strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} - The response
 */
async function handleStaticRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to network
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Failed to fetch static asset', error);

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const cachedPage = await caches.match('/index.html');
            if (cachedPage) {
                return cachedPage;
            }
        }

        throw error;
    }
}

// Handle background sync (for future features like offline ranking submission)
self.addEventListener('sync', (event) => {
    if (event.tag === 'ranking-sync') {
        event.waitUntil(syncRankings());
    }
});

/**
 * Sync pending rankings when back online
 */
async function syncRankings() {
    // This would handle offline ranking submissions
    console.log('Service Worker: Syncing rankings...');
    // Implementation would go here
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: '/images/icon-192x192.png',
            badge: '/images/badge-72x72.png',
            tag: 'love-simulator-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'play',
                    title: '게임하기',
                    icon: '/images/action-play.png'
                },
                {
                    action: 'close',
                    title: '닫기',
                    icon: '/images/action-close.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'play') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_CLEAR') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Log service worker lifecycle events
console.log('Service Worker: Script loaded');