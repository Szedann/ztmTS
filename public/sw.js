const cacheName = 'ztmGeo-v1'

const staticAssets = [
    './',
    './geo',
    './qr',
    './css/style.css',
    './css/qr/qr.css',
    './css/geo/geo.css',
    './scripts/script.js',
    './manifest.json'
]

self.addEventListener('install', async () => {
    const cache = await caches.open(cacheName)
    await cache.addAll(staticAssets)
    return self.skipWaiting()
})

self.addEventListener('activate', ()=>{
    self.clients.claim()
})

self.addEventListener('fetch', async e=>{
    const req = e.request
    const url = new URL(req.url)

    // if(url.origin === location.origin) {
    //     e.respondWith(cacheFirst(req))
    // } else {
        e.respondWith(networkAndCache(req))
    // }
})

async function cacheFirst(req){
    const cache = await caches.open(cacheName)
    const cached = await cache.match(req)
    return cached || fetch(req)
}

async function networkAndCache(req){
    const cache = await caches.open(cacheName)
    try {
        const fresh = await fetch(req)
        await cache.put(req, fresh.clone())
        return fresh
    } catch (error) {
        const cached = await cache.match(req)
        return cached
    }
}