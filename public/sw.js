const CACHE_NAME = "agriorbit-shell-v3";

const APP_SHELL = [
  "/",
  "/login",
  "/dashboard",
  "/farmers",
  "/fields",
  "/surveys",
  "/surveys/new",
  "/drafts",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache available shell routes individually so one unavailable route
      // cannot prevent the service worker from installing.
      await Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("agriorbit-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Leave APIs, Next data/server requests, and immutable build assets to the browser.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/auth/")
  ) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, copy).catch(() => undefined)
            );
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response(
            "You are offline. Please reconnect to continue using AgriOrbit.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, copy).catch(() => undefined)
          );
        }
        return response;
      } catch {
        return new Response("", { status: 503 });
      }
    })
  );
});
