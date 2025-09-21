// Service Worker for Route Wars
const CACHE_NAME = 'route-wars-v1';
const STATIC_CACHE_NAME = 'route-wars-static-v1';
const DYNAMIC_CACHE_NAME = 'route-wars-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets as needed
];

// API endpoints that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/v1/users/profile',
  '/api/v1/territories/map',
  '/api/v1/leaderboard',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
  );
});

// Handle API requests with network-first strategy for fresh data
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    // Cache successful responses for cacheable routes
    if (networkResponse.ok && isCacheableApiRoute(url.pathname)) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical endpoints
    if (isCriticalApiRoute(url.pathname)) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This feature is not available offline' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle navigation requests (SPA routing)
async function handleNavigation(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fallback to cached index.html for SPA routing
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isCacheableApiRoute(pathname) {
  return CACHEABLE_API_ROUTES.some(route => pathname.startsWith(route));
}

function isCriticalApiRoute(pathname) {
  const criticalRoutes = [
    '/api/v1/users/profile',
    '/api/v1/territories/map',
    '/api/v1/leaderboard'
  ];
  return criticalRoutes.some(route => pathname.startsWith(route));
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'route-sync') {
    event.waitUntil(syncOfflineRoutes());
  }
  
  if (event.tag === 'territory-sync') {
    event.waitUntil(syncOfflineTerritoryActions());
  }
});

// Sync offline route data when connection is restored
async function syncOfflineRoutes() {
  try {
    // Get offline route data from IndexedDB
    const offlineRoutes = await getOfflineRoutes();
    
    for (const route of offlineRoutes) {
      try {
        await fetch('/api/v1/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${route.token}`
          },
          body: JSON.stringify(route.data)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineRoute(route.id);
      } catch (error) {
        console.error('Failed to sync route:', route.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline territory actions when connection is restored
async function syncOfflineTerritoryActions() {
  try {
    const offlineActions = await getOfflineTerritoryActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(`/api/v1/territories/${action.territoryId}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${action.token}`
          },
          body: JSON.stringify(action.data)
        });
        
        await removeOfflineTerritoryAction(action.id);
      } catch (error) {
        console.error('Failed to sync territory action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Territory sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
// These would be implemented with proper IndexedDB operations
async function getOfflineRoutes() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function removeOfflineRoute(id) {
  // Implementation would remove from IndexedDB
}

async function getOfflineTerritoryActions() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function removeOfflineTerritoryAction(id) {
  // Implementation would remove from IndexedDB
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'route-wars-notification',
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  
  event.waitUntil(
    clients.openWindow(data.url || '/')
  );
});