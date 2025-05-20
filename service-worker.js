// Service worker version
const CACHE_NAME = 'tinyrests-v1';

// Determine the base URL from the service worker's scope
const getBaseUrl = () => {
  return self.location.pathname.replace(/\/service-worker\.js$/, '');
};

// Files to cache - will be prefixed with baseUrl when caching
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/css/install-button.css',
  '/assets/js/script.js',
  '/assets/js/install.js',
  '/assets/js/dropdown-selector.js',
  '/manifest.webmanifest',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  const baseUrl = getBaseUrl();
  
  // Add the base URL to each file path
  const filesToCache = FILES_TO_CACHE.map(file => {
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
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache with baseUrl:', baseUrl);
        return cache.addAll(filesToCache);
      })
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
});
