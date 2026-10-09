'use strict';
const VERSION='20261010-0105';
const PREFIX='angle-pwa:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const url=path=>new URL(path,self.registration.scope).href;
const ENTRY=url('./index.html');
const FILES=['./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'].map(url);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(FILES.map(u=>new Request(u,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const requested=new URL(event.request.url);
 if(requested.origin!==self.location.origin)return;
 const clean=requested.origin+requested.pathname;
 const isEntry=clean===ENTRY||clean===self.registration.scope;
 if(!isEntry&&!FILES.includes(clean))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=isEntry?ENTRY:clean;
  try {
   const response=await fetch(event.request,{cache:'no-store'});
   if(response.ok){await cache.put(key,response.clone());return response}
   return (await cache.match(key))||response;
  } catch(error){
   return (await cache.match(key))||new Response('オフラインです。通信できる場所でもう一度開いてください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
