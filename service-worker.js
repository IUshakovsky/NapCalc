// Service worker version
const CACHE_NAME = 'tinyrests-v2';

// Determine the base URL from the service worker's scope
const getBaseUrl = () => {
  return self.location.pathname.replace(/\/service-worker\.js$/, '');
};

// Files to cache - will be prefixed with baseUrl when caching
// Critical resources first for faster LCP
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/css/bootstrap-custom.css'
];

const NON_CRITICAL_RESOURCES = [
  '/assets/css/install-button.css',
  '/assets/js/script.js',
  '/assets/js/install.js',
  '/assets/js/dropdown-selector.js',
  '/manifest.webmanifest',
  '/assets/favicon/android-chrome-192x192.png',
  '/assets/favicon/android-chrome-512x512.png'
];

const FILES_TO_CACHE = [...CRITICAL_RESOURCES, ...NON_CRITICAL_RESOURCES];

// Install event - cache assets
self.addEventListener('install', (event) => {
  const baseUrl = getBaseUrl();
  
  // Add the base URL to each file path
  const criticalToCache = CRITICAL_RESOURCES.map(file => {
    // Don't modify absolute URLs
    if (file.startsWith('http')) {
      return file;
    }
    // Handle the root path special case
    if (file === '/') {
      return baseUrl || '/';
    }
    // Concatenate the baseUrl with the file path (avoiding double slashes)
    return `${baseUrl}${file}`;
  });
  
  const nonCriticalToCache = NON_CRITICAL_RESOURCES.map(file => {
    if (file.startsWith('http')) return file;
    return `${baseUrl}${file}`;
  });
  
  // First cache critical resources
  const cacheCritical = caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Caching critical resources with baseUrl:', baseUrl);
      return cache.addAll(criticalToCache);
    });
    
  // Then cache non-critical resources
  const cacheNonCritical = caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Caching non-critical resources with baseUrl:', baseUrl);
      return cache.addAll(nonCriticalToCache);
    });
  
  // Prioritize critical resources, but still load everything
  event.waitUntil(
    Promise.all([cacheCritical, cacheNonCritical])
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const baseUrl = getBaseUrl();
  
  // Skip non-GET requests and requests to other domains
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Create a URL object from the request
  const url = new URL(event.request.url);
  
  // Only handle requests for files under our baseUrl (if any)
  if (baseUrl !== '/' && !url.pathname.startsWith(baseUrl)) {
    return;
  }
  
  // For critical resources, prioritize cache response
  const isCriticalResource = CRITICAL_RESOURCES.some(resource => {
    const resourcePath = resource === '/' ? baseUrl || '/' : `${baseUrl}${resource}`;
    return url.pathname === resourcePath;
  });
  
  if (isCriticalResource) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
            .then((fetchResponse) => {
              // Clone the response
              const responseToCache = fetchResponse.clone();
              
              // Add to cache
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return fetchResponse;
            });
        })
    );
  } else {
    // For non-critical resources, use the standard strategy
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-GET requests
              if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              // Add to cache
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
});
