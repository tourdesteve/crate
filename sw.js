// Crate: keeps album cover images on this device so the shelf loads fast and works on a weak signal.
// Only images are cached; the app page itself always comes fresh from the network.
const CACHE='crate-covers-v1',MAX=2500;
const isCover=u=>/(^|\.)discogs\.com$/.test(u.hostname)&&u.hostname.startsWith('i.')||u.hostname==='i.scdn.co';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith('crate-covers-')&&k!==CACHE)await caches.delete(k);
  await self.clients.claim();
})()));
let puts=0;
async function trim(c){const keys=await c.keys();if(keys.length>MAX)for(const k of keys.slice(0,keys.length-MAX))await c.delete(k)}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  let u;try{u=new URL(r.url)}catch(err){return}
  if(!isCover(u))return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(r,{ignoreVary:true});if(hit)return hit;
    try{
      const res=await fetch(r);
      if(res.ok||res.type==='opaque'){c.put(r,res.clone()).then(()=>{if(++puts%50===0)trim(c)}).catch(()=>{})}
      return res;
    }catch(err){return hit||Response.error()}
  })());
});
