const cacheName="biopitanie-web-v2";
const files=["./", "./index.html", "./app.js", "./data.js", "./style.css", "./manifest.webmanifest", "./assets/app_photo.webp", "./assets/icon-large.png", "./assets/icon.png", "./assets/photo_apple.webp", "./assets/photo_avocado.webp", "./assets/photo_berries.webp", "./assets/photo_dairy.webp", "./assets/photo_fish.webp", "./assets/photo_greens.webp", "./assets/photo_mint.webp", "./assets/photo_oats.webp", "./assets/photo_protein.webp", "./assets/photo_table.webp", "./assets/photo_variety.webp", "./assets/photo_water.webp"];

self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('biopitanie-web-')&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate')event.respondWith(fetch(request).catch(()=>caches.match('./index.html')));
 else event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
