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
    }).catch((error) => {
      console.error('Service Worker: Install failed', error);
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

  if (request.url.startsWith(BASE_URL) && request.method === 'GET') {
    event.respondWith(
      fetch(request, {
        signal: AbortSignal.timeout(10000) 
      })
        .then(async (response) => {
          if (!response || !response.ok || response.status !== 200) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            return response; 
          }

          const responseToCache = response.clone(); 
          
          try {
            const cache = await caches.open(DATA_CACHE_NAME);
            await cache.put(request, responseToCache);
          } catch (cacheError) {
            console.error('Service Worker: Cache put failed', cacheError);
          }
          
          return response;
        })
        .catch(async (error) => {
          console.error('Service Worker: Fetch failed', error);
          
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('Service Worker: Returning cached response');
            return cachedResponse;
          }
          
          return new Response(
            JSON.stringify({ 
              error: true, 
              message: 'Network request failed and no cache available'
            }), 
            {
              status: 503, statusText: 'Service Unavailable',
              headers: new Headers({'Content-Type': 'application/json'})
            }
          );
        }),
    );
  } 
  else if (APP_SHELL_RESOURCES.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; 
        }
        
        return fetch(request)
          .then((response) => {
            if (!response || !response.ok) {
              return response;
            }

            const clonedResponse = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse); 
            }).catch((error) => {
              console.error('Service Worker: Cache put failed', error);
            });
            
            return response; 
          })
          .catch(() => {
            return caches.match('/');
          });
      }),
    );
  }
});

self.addEventListener('push', (event) => {
  let title = 'Cerita Yuk';
  let message = 'Anda memiliki pesan baru.';
  let icon = 'images/logo.png';
  let targetUrl = '/';

  const pushEvent = event.waitUntil(
    (async () => {
      let bodyText = 'Push message no payload'; 

      try {
        if (event.data) {
          bodyText = await event.data.text();
          
          try {
            const data = JSON.parse(bodyText);
            title = data.title || title;
            message = data.body || message;
            icon = data.icon || icon;
            targetUrl = data.url || targetUrl;
          } catch (jsonError) {
            console.log('Service Worker: Payload bukan JSON, gunakan sebagai teks.');
            message = bodyText;
          }
        }
      } catch (readError) {
        console.error('Service Worker: Gagal membaca push data', readError);
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

      await self.registration.showNotification(title, options);
    })()
  );

  event.waitUntil(pushEvent);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.openWindow(urlToOpen)
      .then((windowClient) => {
        return windowClient ? windowClient.focus() : null;
      })
      .catch((error) => {
        console.error('Service Worker: Open window failed', error);
      })
  );
});
