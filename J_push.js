/* Notificações push: o aviso do aparelho (fora da tela do app) quando chega algo novo para quem usa este app.
   Sem servidor de push, o aviso sai enquanto o app está aberto, também em segundo plano (outra aba, outra janela, app instalado minimizado).
   Cada app diz o que é aviso: PUSH.fonte(lista, abrir). lista() devolve [{k,t,s,go}]; o que já foi avisado fica guardado neste aparelho, por app.
   Com a tela do app à frente, o aviso não sai (o app já mostra o sino e o cartão). O sw.js mostra o aviso e, no toque, volta ao app no ponto do aviso.
   Quando houver servidor de push, o evento "push" do sw.js já mostra o que chegar. */
(function(){
 if(window.PUSH)return;
 var APP=window.__PUSH_APP||(/contador/.test(window.__PAGE||'')?'contador':'cliente'),KEY='push-'+APP,DIA=864e5;
 var S={on:0,v:{}},lista=null,abrir=null,silencio=null,ini=false,tm=null;
 try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o){S.on=o.on?1:0;S.v=o.v||{};}}catch(e){}
 function guarda(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
 function suporte(){return 'Notification' in window&&window.isSecureContext!==false;}
 function permissao(){return suporte()?Notification.permission:'sem';}
 function ligado(){return !!S.on&&permissao()==='granted';}
 function aFrente(){return document.visibilityState==='visible'&&(!document.hasFocus||document.hasFocus());}
 function icone(){var l=document.querySelector('link[rel="icon"]');return l?l.href:'';}
 function reg(){if(!('serviceWorker' in navigator))return Promise.resolve(null);
  return navigator.serviceWorker.getRegistration().then(function(r){return r||null;}).catch(function(){return null;});} /* o próprio app registra o sw.js ao abrir */
 /* mostra um aviso: pelo service worker (necessário no Android) e, sem ele, pelo próprio navegador */
 function mostrar(t,s,go,k){var tag=APP+'|'+(k||t),dt={app:APP,go:go||'',k:k||'',url:location.href.split('#')[0]};
  var op={body:s||'',tag:tag,icon:icone(),badge:icone(),lang:'pt-BR',data:dt};
  return reg().then(function(r){if(r&&r.showNotification)return r.showNotification(t,op).then(function(){return true;});
   var n=new Notification(t,op);n.onclick=function(){try{window.focus();}catch(e){}n.close();vai(dt);};return true;}).catch(function(){return false;});}
 function vai(dt){if(!dt||dt.app!==APP||!abrir)return;try{abrir(dt);}catch(e){console.error(e);}}
 if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',function(e){var m=e.data||{};if(m.tipo==='push-abrir')vai(m.data);});
 /* marca como avisado tudo o que já está na lista (ao ligar e na primeira leitura): só o que chegar depois vira aviso */
 function base(){if(!lista)return;var L=[];try{L=lista()||[];}catch(e){}var n=Date.now();L.forEach(function(x){S.v[x.k]=n;});guarda();}
 function verificar(){if(!lista)return;
  if(!ini){ini=true;base();return;}
  if(!ligado())return;
  var L=[];try{L=lista()||[];}catch(e){return;}
  var n=Date.now(),novos=L.filter(function(x){return !S.v[x.k];});
  L.forEach(function(x){S.v[x.k]=n;});
  for(var k in S.v)if(n-S.v[k]>7*DIA)delete S.v[k];
  guarda();
  if(!novos.length||aFrente()||(silencio&&silencio()))return;
  novos.slice(0,3).forEach(function(x){mostrar(x.t,x.s,x.go,x.k);});
  if(novos.length>3)mostrar('Mais '+(novos.length-3)+(novos.length-3>1?' avisos novos':' aviso novo'),'Abra o app para ver todos','','resto');}
 function agenda(){clearTimeout(tm);tm=setTimeout(verificar,400);}
 addEventListener('storage',function(e){if(e.key==='app-multi-v1')agenda();});
 document.addEventListener('visibilitychange',agenda);
 setInterval(verificar,15000);
 window.PUSH={app:APP,suporte:suporte,permissao:permissao,ligado:ligado,mostrar:mostrar,verificar:agenda,
  /* lista: o que hoje é aviso para este app; abrir: o que fazer quando tocam no aviso; silencio: true para não avisar agora */
  fonte:function(fn,ab,si){lista=fn;abrir=ab||null;silencio=si||null;ini=false;setTimeout(verificar,1500);},
  /* avisos que o app já sabe que são novos (painel): sem guardar a lista */
  avisar:function(L){if(!ligado()||aFrente()||!L||!L.length)return;L.slice(0,3).forEach(function(x){mostrar(x.t,x.s,x.go,x.k);});},
  /* ligar pede a permissão do navegador (precisa de um toque); cb(ok, texto) */
  ligar:function(cb){cb=cb||function(){};
   if(!suporte()){cb(false,'Este navegador não mostra notificações. No iPhone, instale o app na tela de início.');return;}
   var fim=function(p){if(p==='granted'){S.on=1;base();cb(true,'Notificações ligadas neste aparelho');}
    else if(p==='denied'){S.on=0;guarda();cb(false,'O navegador bloqueou as notificações. Libere nas configurações do site e tente de novo.');}
    else{S.on=0;guarda();cb(false,'Sem permissão: as notificações continuam desligadas');}};
   if(Notification.permission==='granted'){fim('granted');return;}
   try{var r=Notification.requestPermission(fim);if(r&&r.then)r.then(fim);}catch(e){fim('default');}},
  desligar:function(){S.on=0;guarda();},
  estado:function(){var p=permissao();return p==='sem'?'Este navegador não mostra notificações':p==='denied'?'Bloqueadas no navegador: libere nas configurações do site':ligado()?'Ligadas neste aparelho, também com o app em segundo plano':'Desligadas neste aparelho';},
  teste:function(cb){cb=cb||function(){};if(!ligado()){cb(false,'Ligue as notificações push primeiro');return;}
   mostrar('LivTask','É assim que os avisos vão aparecer neste aparelho','','teste-'+Date.now()).then(function(ok){cb(ok,ok?'Notificação de teste enviada':'Não foi possível mostrar a notificação');});}};
})();
