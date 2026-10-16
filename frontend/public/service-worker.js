const CACHE_NAME = "clinic-hms-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache.startsWith("clinic-hms-") && cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedShell = await caches.match("/index.html");
        if (cachedShell) return cachedShell;
        return Response.error();
      }),
    );
    return;
  }

  const isVersionedAsset = requestUrl.pathname.startsWith("/assets/");
  const isPublicAppAsset =
    requestUrl.pathname === "/favicon.svg" ||
    requestUrl.pathname === "/manifest.json";
  if (!isVersionedAsset && !isPublicAppAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedAsset = await cache.match(event.request);
      if (cachedAsset) return cachedAsset;

      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }),
  );
});
