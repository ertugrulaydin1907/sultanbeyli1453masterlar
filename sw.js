const VERSION='mpl-v4';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode!=='navigate' && !req.headers.get('accept')?.includes('text/html')) return;
  event.respondWith((async()=>{
    try{
      const res=await fetch(req);
      const type=res.headers.get('content-type')||'';
      if(!res.ok || !type.includes('text/html')) return res;
      let html=await res.text();
      const css=`
        .mpl-tap-feedback{transform:scale(.97)!important;filter:brightness(.94);box-shadow:0 0 0 3px rgba(229,170,73,.38)!important;transition:transform .08s ease,filter .08s ease,box-shadow .08s ease!important}
        #logo{cursor:pointer;transition:transform .12s ease,filter .12s ease}
        #logo:active{transform:scale(.94);filter:brightness(.9)}
      `;
      const js=`
        (()=>{
          const addTap=(el)=>{if(!el)return;el.classList.add('mpl-tap-feedback');clearTimeout(el.__mplTapTimer);el.__mplTapTimer=setTimeout(()=>el.classList.remove('mpl-tap-feedback'),180)};
          document.addEventListener('pointerdown',e=>{
            const el=e.target.closest?.('button,a,.team,.fixture,.stand-team,.fixture-team,.tabs button,#logo');
            if(el)addTap(el);
          },true);
          document.addEventListener('keydown',e=>{
            if(e.key==='Enter'||e.key===' '){const el=document.activeElement;if(el?.matches?.('button,a,.team,.fixture,.stand-team,.fixture-team,.tabs button,#logo'))addTap(el)}
          },true);
          const setup=()=>{
            const logo=document.getElementById('logo');
            if(logo&&!logo.dataset.mplReload){logo.dataset.mplReload='1';logo.setAttribute('title','Ana sayfayı yenile');logo.setAttribute('role','button');logo.addEventListener('click',()=>location.reload())}
            const notify=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Bildirimleri Aç'));
            if(notify&&!notify.dataset.mplNotify){
              notify.dataset.mplNotify='1';
              notify.addEventListener('click',e=>{
                if('Notification' in window && Notification.permission==='denied'){
                  e.preventDefault();e.stopImmediatePropagation();
                  alert('🔔 Bildirim izni daha önce engellenmiş.\n\nAndroid Chrome: site adresinin yanındaki ayarlar simgesine dokun → İzinler → Bildirimler → İzin ver.\n\nSonra sayfayı yenileyip Bildirimleri Aç düğmesine tekrar bas.');
                }
              },true);
            }
          };
          if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
          new MutationObserver(setup).observe(document.documentElement,{childList:true,subtree:true});
        })();
      `;
      html=html.replace('</head>',`<style>${css}</style></head>`).replace('</body>',`<script>${js}</script></body>`);
      return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
    }catch(e){return fetch(req)}
  })());
});

self.addEventListener('push',event=>{
  let d={title:'⚽ Master Pro Lig',body:'Yeni maç bildirimi',url:'/'};
  try{d={...d,...event.data.json()}}catch(_){}
  event.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/'},vibrate:[200,100,200]}));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/';
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs)if('focus'in c)return c.focus();
    return self.clients.openWindow(url);
  }));
});
