'use strict';
const CACHE='ucus-atlasi-v1';
const FILES=['./','./index.html','./style.css','./app.js','./quest-input.js','./landscape.js','./exhibition.js','./drone-physics.js','./assets/simurg/consumer.jpg','./assets/simurg/fpv.jpg','./assets/simurg/fixed-wing.jpg','./assets/simurg/mixed.jpg','./manifest.webmanifest','./vendor/aframe.min.js','./assets/poster.jpg','./assets/concept.jpg','./assets/cad-preview.jpg','./assets/frame-r02.glb','./assets/battery-r02.glb'];
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{const port=e.ports[0];e.waitUntil((async()=>{try{if(e.data.type==='DOWNLOAD'){const pending=await caches.open(CACHE+'-pending');for(const file of FILES){const r=await fetch(new Request(new URL(file,self.registration.scope),{cache:'reload'}));if(!r.ok||r.redirected)throw Error('Bir dosya indirilemedi. Oturumunu ve bağlantını kontrol edip tekrar dene.');await pending.put(new URL(file,self.registration.scope),r);}const target=await caches.open(CACHE);for(const key of await pending.keys())await target.put(key,await pending.match(key));await caches.delete(CACHE+'-pending');port.postMessage({complete:true});}else if(e.data.type==='STATUS'){const c=await caches.open(CACHE);const matches=await Promise.all(FILES.map(f=>c.match(new URL(f,self.registration.scope))));port.postMessage({complete:matches.every(Boolean)});}}catch(err){port.postMessage({error:err.message});}})());});
FILES.push('./assets/kestrel-loop.mp4','./assets/kestrel-workspace.png','./assets/drone-10inch-light.glb','./assets/drone-10inch-modules.glb','./assets/shah-logo.png');
FILES.push('./assets/ambient-orchestral.mp3','./assets/openipc/diy-assembly.jpg','./assets/openipc/diy-system.jpg','./assets/openipc/LICENSE.txt','./assets/MEDIA-SOURCES.txt');
FILES.push(...["./assets/nature/Bush_Common_Flowers.glb", "./assets/nature/CommonTree_1.glb", "./assets/nature/CommonTree_2.glb", "./assets/nature/CommonTree_3.glb", "./assets/nature/Fern_1.glb", "./assets/nature/Flower_3_Group.glb", "./assets/nature/LICENSE.txt", "./assets/nature/Pine_2.glb", "./assets/nature/Pine_5.glb", "./assets/nature/Rock_Medium_1.glb", "./assets/nature/SOURCE.txt", "./assets/nature/TwistedTree_1.glb", "./assets/nature/TwistedTree_4.glb"]);
// Video players request byte ranges, including when the gallery is offline.
async function cachedResponse(request,cached){
 const headers=new Headers(cached.headers);
 if(request.method==='HEAD')return new Response(null,{status:cached.status,headers});
 const range=request.headers.get('Range');
 if(!range)return cached;
 const blob=await cached.blob(),size=blob.size;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);
 let start=0,end=size-1;
 if(match&&(match[1]||match[2])){
  if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),size-1);}
  else start=Math.max(0,size-Number(match[2]));
 }else start=size;
 if(start>=size||start>end){return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});}
 headers.set('Accept-Ranges','bytes');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
 return new Response(blob.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',e=>{
 if(!['GET','HEAD'].includes(e.request.method)||new URL(e.request.url).origin!==self.location.origin)return;
 const allowed=FILES.map(f=>new URL(f,self.registration.scope).href);if(!allowed.includes(e.request.url))return;
 e.respondWith((async()=>{
  if(new URL(e.request.url).pathname.endsWith('/assets/kestrel-loop.mp4')){
   const cached=await caches.match(e.request.url,{cacheName:CACHE});if(cached)return cachedResponse(e.request,cached);
  }
  try{return await fetch(e.request);}catch(err){
   const cached=await caches.match(e.request.url,{cacheName:CACHE});if(cached)return cachedResponse(e.request,cached);throw err;
  }
 })());
});

