const CACHE_NAME = 'cerita-yuk-v1';
const DATA_CACHE_NAME = 'cerita-yuk-data-v1';
const BASE_URL = 'https://story-api.dicoding.dev/v1';

const APP_SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/manifest.json',
  '/iconppl.png',
  '/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell...');
      return cache.addAll(APP_SHELL_RESOURCES);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.url.startsWith(BASE_URL)) {
    event.respondWith(
      fetch(request)
        .then(async (response) => { 
          const cache = await caches.open(DATA_CACHE_NAME); 
          await cache.put(request, response.clone()); 
          return response; 
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || Promise.reject(new Error('Data not in cache'));
          });
        }),
    );
  } else if (APP_SHELL_RESOURCES.includes(url.pathname) || url.pathname === '/') {
     event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        });
      }),
    );
  }
});


self.addEventListener('push', (event) => {
  let body;
  if (event.data) {
    body = event.data.text(); 
  } else {
    body = 'Push message no payload';
  }

  let title = 'Cerita Yuk';
  let message = body;
  let icon = 'images/logo.png';
  let targetUrl = '/';
  
  try {
    const data = JSON.parse(body);
    title = data.title;
    message = data.body;
    icon = data.icon || 'images/logo.png';
    targetUrl = data.url || '/';
  } catch (e) {
  }

  const options = {
    body: message,
    icon: icon,
    badge: 'iconppl.png',
    data: { 
      url: targetUrl,
    },
    actions: [ 
      { action: 'open-story', title: 'Lihat Cerita' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.openWindow(urlToOpen).then((windowClient) => {
      return windowClient ? windowClient.focus() : null;
    }),
  );
});