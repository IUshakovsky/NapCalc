// Service worker version
const CACHE_NAME = 'tinyrests-v6';

// Determine the base URL from the service worker's scope
const getBaseUrl = () => {
  return self.location.pathname.replace(/\/service-worker\.js$/, '');
};

// Files to cache - will be prefixed with baseUrl when caching
// Critical resources first for faster LCP (prioritizing h1.title element)
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/css/bootstrap-custom.css',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@700&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-&font-display=swap'
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

// Check if request is for HTML content
const isHtmlRequest = (request) => {
  const url = new URL(request.url);
  const acceptHeader = request.headers.get('Accept') || '';
  // HTML requests: accept header includes text/html, or path ends with / or .html, or has no extension
  const pathEndsWithSlash = url.pathname.endsWith('/');
  const pathEndsWithHtml = url.pathname.endsWith('.html');
  const hasNoExtension = !url.pathname.split('/').pop().includes('.');
  return acceptHeader.includes('text/html') || pathEndsWithSlash || pathEndsWithHtml || hasNoExtension;
};

// Check if request is for static assets (CSS, JS, images, fonts)
const isStaticAsset = (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  return /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|webmanifest)$/i.test(pathname);
};

// Fetch event - network-first for HTML, cache-first for static assets
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
  
  // Network-first strategy for HTML (always get fresh content)
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails (offline support)
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets (CSS, JS, images, fonts)
  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((fetchResponse) => {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return fetchResponse;
            });
        })
    );
    return;
  }
  
  // Default: network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
