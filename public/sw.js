/* Public resources only. Bump VERSION whenever precached assets change. */
const VERSION='v1';
const PREFIX='shaikhs-public-';
const CACHE=PREFIX+VERSION;
const PRECACHE=['/offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of PRECACHE){const response=await fetch(new Request(path,{credentials:'omit',cache:'reload'}));if(!response.ok||response.redirected||/private|no-store/i.test(response.headers.get('cache-control')||''))throw Error('Public offline resource unavailable');await cache.put(path,response);}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='APPLY_PUBLIC_UPDATE')self.skipWaiting();});
function publicAsset(url){return url.origin===self.location.origin&&!url.search&&(PRECACHE.includes(url.pathname)||/^\/_next\/static\/[A-Za-z0-9_./-]+\.(?:js|css|woff2)$/.test(url.pathname));}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 // Never intercept APIs, image optimizers, JSON/RSC or account/financial requests.
 if(url.pathname.startsWith('/api/')||request.headers.get('RSC')||url.searchParams.has('_rsc'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{let fallback;try{fallback=await caches.match('/offline.html',{cacheName:CACHE});}catch{/* Storage can be denied. */}return fallback||new Response('Offline. Reconnect to continue.',{status:503,headers:{'Content-Type':'text/plain'}});}));return;}
 if(!publicAsset(url))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(request.url);if(hit)return hit;
 const response=await fetch(new Request(request.url,{credentials:'omit',cache:'no-cache'}));
 const policy=response.headers.get('cache-control')||'',type=response.headers.get('content-type')||'';
 if(response.ok&&!response.redirected&&response.type==='basic'&&!/private|no-store/i.test(policy)&&/javascript|css|font|image\/png|text\/html/i.test(type)){
   const bytes=await response.clone().arrayBuffer();if(bytes.byteLength<=2097152){await cache.put(request.url,response.clone());const keys=await cache.keys();const extras=keys.filter(key=>!PRECACHE.includes(new URL(key.url).pathname));while(extras.length>32)await cache.delete(extras.shift());}
 }return response;})().catch(()=>fetch(new Request(request.url,{credentials:'omit'}))));
});
