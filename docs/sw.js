// Caches only this site's own static files. Never touches any other request.
var V='dotmail-v6',FILES=['./','og.png','index.html','app.js','template.html','demo.html','logo.svg','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
var SCOPE=self.registration.scope,OWN=FILES.map(function(f){return new URL(f,SCOPE).href});
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=r.url.split('#')[0].split('?')[0];if(OWN.indexOf(u)<0)return;
 e.respondWith(fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(u,cp)})}return res}).catch(function(){return caches.match(u)}))});
