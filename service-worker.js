const RELEASE = "teacher-tools-2026-11-13-footer-layout-1";
const CACHE = `teacher-tools-${RELEASE}`;
const APP_SHELL = [
  "/",
  "/scheduler/",
  "/calendar/",
  "/spinner/",
  "/timer/",
  "/tracker/",
  "/tricks/",
  "/offline/",
  `/assets/css/foundation.css?v=${RELEASE}`,
  `/assets/css/site.css?v=${RELEASE}`,
  `/assets/css/components.css?v=${RELEASE}`,
  "/assets/js/selfie/schema.js",
  "/assets/js/selfie/svg-parts.js",
  "/assets/js/selfie/renderer.js",
  "/assets/js/selfie/transfer-config.js",
  "/assets/js/selfie/transfer.js",
  `/assets/js/theme-bootstrap.js?v=${RELEASE}`,
  `/assets/js/ui.js?v=${RELEASE}`,
  `/assets/js/school-settings.js?v=${RELEASE}`,
  `/assets/js/profile.js?v=${RELEASE}`,
  `/assets/js/tools.js?v=${RELEASE}`,
  `/assets/js/toolbar.js?v=${RELEASE}`,
  "/assets/pwa/teacher-tools-icon.svg",
  "/assets/pwa/teacher-tools-icon-192.png",
  "/assets/pwa/teacher-tools-icon-512.png",
  "/assets/tricks/cards/ace-suits-v1.png",
  "/assets/tricks/cards/jack-suits-v1.png",
  "/assets/tricks/cards/queen-suits-v1.png",
  "/assets/tricks/cards/king-suits-v1.png",
  "/offline.webmanifest"
];

// A successful HTTP response alone can be a host's fallback HTML or an old build.
// Check the release and end of each document/stylesheet before declaring it ready.
async function validShellResponse(url, response) {
  if (!response?.ok || response.redirected) return false;
  const type = response.headers.get("Content-Type") || "";
  if (url.endsWith("/")) {
    if (!type.includes("text/html")) return false;
    const text = await response.clone().text();
    return text.includes(`<meta name="teacher-tools-release" content="${RELEASE}">`) &&
      /<\/html>\s*$/i.test(text);
  }
  if (/^\/assets\/js\/[^/?]+\.js\?/.test(url)) {
    if (!/^(?:text|application)\/javascript\b/i.test(type)) return false;
    const text = await response.clone().text();
    return text.trimEnd().endsWith(`/* teacher-tools-release: ${RELEASE} */`);
  }
  if (url.startsWith("/assets/css/")) {
    if (!type.includes("text/css")) return false;
    const text = await response.clone().text();
    return text.trimEnd().endsWith(`/* teacher-tools-release: ${RELEASE} */`);
  }
  if (url.endsWith(".png")) {
    if (!type.includes("image/png")) return false;
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    const signature = [137,80,78,71,13,10,26,10];
    const end = [0,0,0,0,73,69,78,68,174,66,96,130];
    return bytes.length >= 45 && signature.every((value,index) => bytes[index] === value) &&
      end.every((value,index) => bytes[bytes.length - end.length + index] === value);
  }
  return (await response.clone().arrayBuffer()).byteLength > 0;
}

let preparation;
function cacheShell(onProgress) {
  // Install and manual preparation may overlap. Share one operation and its progress.
  if (preparation) {
    if (onProgress) preparation.listeners.add(onProgress);
    return preparation.promise;
  }
  const listeners = new Set(onProgress ? [onProgress] : []);
  const promise = (async () => {
    // Fetch and validate the whole release before replacing any prepared files.
    // A missing file leaves the existing complete cache usable.
    const responses = [];
    for (let index = 0; index < APP_SHELL.length; index += 1) {
      const url = APP_SHELL[index];
      const response = await fetch(new Request(url, {cache:"reload"}));
      if (!await validShellResponse(url, response)) throw new Error(`Could not prepare ${url} for ${RELEASE}`);
      responses.push(response);
      listeners.forEach(listener => listener({completed:index + 1,total:APP_SHELL.length,url}));
    }
    const cache = await caches.open(CACHE);
    for (let index = 0; index < APP_SHELL.length; index += 1) {
      await cache.put(APP_SHELL[index], responses[index]);
    }
    return {ready: await shellReady(), release: RELEASE, count: APP_SHELL.length};
  })();
  preparation = {promise, listeners};
  promise.then(() => { preparation = null; }, () => { preparation = null; });
  return promise;
}

async function shellReady() {
  const cache = await caches.open(CACHE);
  const valid = await Promise.all(APP_SHELL.map(async url => validShellResponse(url, await cache.match(url))));
  return valid.every(Boolean);
}

self.addEventListener("install", event => event.waitUntil(cacheShell()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith("teacher-tools-") && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));

function shellKey(request) {
  const url = new URL(request.url);
  // Treat /timer/index.html and /timer/?... as the prepared /timer/ document.
  const path = url.pathname.replace(/\/index\.html$/, "/");
  if (request.mode === "navigate" && APP_SHELL.includes(path)) return path;
  const key = url.pathname + url.search;
  return APP_SHELL.includes(key) ? key : null;
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = shellKey(event.request);
    // Prepared pages and CSS are a release unit. Only a fully installed worker
    // updates them; ordinary navigation must not mix new HTML with old styles.
    const cached = await cache.match(key || event.request);
    if (cached) return cached;
    const fresh = await fetch(event.request);
    if (key) {
      if (await validShellResponse(key, fresh)) await cache.put(key, fresh.clone());
    } else if (fresh.ok) {
      await cache.put(event.request, fresh.clone());
    }
    return fresh;
  })());
});

self.addEventListener("message", event => {
  const reply = value => event.ports[0]?.postMessage(value);
  if (event.data?.type === "STATUS") event.waitUntil(shellReady().then(ready => reply({ready,release:RELEASE,count:APP_SHELL.length})).catch(error => reply({ready:false,error:String(error)})));
  if (event.data?.type === "CACHE_NOW") event.waitUntil(cacheShell(progress => reply({type:"PROGRESS",...progress})).then(reply).catch(error => reply({ready:false,error:String(error)})));
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
