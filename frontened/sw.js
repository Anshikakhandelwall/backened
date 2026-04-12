// Service Worker — handles background push notifications

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || '🔔 SmartTimetable';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/badge-72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/dashboard.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open — focus it
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

const CACHE_NAME = 'smarttimetable-v1';

// Files to cache for offline use
const CACHED_FILES = [
    '/signin.html',
    '/dashboard.html',
    '/mytimetable.html',
    '/events.html',
    '/iks.html',
    '/style.css',
    '/dashboard.css',
    '/icon-192.png',
    '/icon-512.png',
];

// ── Install — cache files ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service worker: caching files');
            return cache.addAll(CACHED_FILES);
        })
    );
    self.skipWaiting();
});

// ── Activate — clear old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch — serve from cache when offline ──────────────────────────────
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    // Don't cache API calls
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('/signin.html');
                }
            });
        })
    );
});

// ── Push — receive notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'SmartTimetable', body: event.data?.text() || '' };
    }

    const title = data.title || '🔔 SmartTimetable';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.data?.type || 'general',
        renotify: true,
        data: data.data || {},
        actions: [
            { action: 'view', title: '👁 View' },
            { action: 'dismiss', title: '✕ Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ── Notification click ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/dashboard.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow(url);
            })
    );
});