/* Arquivos de verdade: guarda o arquivo escolhido no armazenamento do artefato e liga o registro (ST.arq) a ele.
   O registro guarda só o id do arquivo (fileId); o endereço para abrir é "/_blob/" + id.
   Sem armazenamento disponível (fora do Claude, ou para quem não pode editar), o arquivo abre só nesta sessão. */
(function(){
 var AS=null,ready=false,waiters=[];
 /* Sem o armazenamento do Claude (ex.: GitHub Pages), guarda o arquivo no IndexedDB do navegador.
    Todas as abas da mesma origem (cliente, contador e painel) leem o mesmo banco, então o contador abre o arquivo que o cliente enviou.
    O id começa com "loc-"; o endereço é um blob criado a partir do banco (LOC). */
 var IDB=null,LOC={},LOCP={},falta={};
 function idb(){if(IDB)return IDB;IDB=new Promise(function(res,rej){try{var r=indexedDB.open('contabills-arquivos',1);r.onupgradeneeded=function(){r.result.createObjectStore('f');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};}catch(e){rej(e);}});return IDB;}
 function locPut(id,f,ty){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('f','readwrite');t.objectStore('f').put({blob:f,type:ty,name:f.name,size:f.size,em:Date.now()},id);t.oncomplete=function(){res();};t.onerror=function(){rej(t.error);};});});}
 function locGet(id){if(LOC[id])return Promise.resolve(LOC[id]);if(LOCP[id])return LOCP[id];
  LOCP[id]=idb().then(function(db){return new Promise(function(res){var r=db.transaction('f').objectStore('f').get(id);r.onsuccess=function(){var v=r.result;if(v&&v.blob)LOC[id]=URL.createObjectURL(v.type?new Blob([v.blob],{type:v.type}):v.blob);res(LOC[id]||'');};r.onerror=function(){res('');};});}).catch(function(){return '';}).then(function(u){delete LOCP[id];return u;});return LOCP[id];}
 /* carrega todos os arquivos já guardados, e de novo quando outra aba muda os dados */
 function locAll(){return idb().then(function(db){return new Promise(function(res){var r=db.transaction('f').objectStore('f').getAllKeys();r.onsuccess=function(){res(r.result||[]);};r.onerror=function(){res([]);};});}).then(function(ks){var novos=ks.filter(function(k){return !LOC[k];});return Promise.all(novos.map(locGet)).then(function(){return novos.length;});}).catch(function(){return 0;});}
 function redesenha(){if(window.__refresh)try{__refresh();}catch(e){}if(window.__ctRerender)try{__ctRerender();}catch(e){}}
 /* registro chegou antes do arquivo: tenta de novo algumas vezes */
 function locFalta(id){if(falta[id])return;falta[id]=1;var n=0;(function tenta(){locGet(id).then(function(u){if(u){delete falta[id];redesenha();}else if(++n<6)setTimeout(tenta,500*n);else delete falta[id];});})();}
 /* O arquivo é guardado uma vez só: o id vem do conteúdo (SHA-256), então o mesmo arquivo enviado de novo, para outro cliente ou outra tela, reaproveita o que já está guardado */
 function hashHex(f){if(!(window.crypto&&crypto.subtle&&f.arrayBuffer))return Promise.resolve('');return f.arrayBuffer().then(function(b){return crypto.subtle.digest('SHA-256',b);}).then(function(d){return [].map.call(new Uint8Array(d),function(x){return ('0'+x.toString(16)).slice(-2);}).join('').slice(0,40);}).catch(function(){return '';});}
 function locHas(id){return idb().then(function(db){return new Promise(function(res){var r=db.transaction('f').objectStore('f').count(id);r.onsuccess=function(){res(r.result>0);};r.onerror=function(){res(false);};});}).catch(function(){return false;});}
 function locLista(){return idb().then(function(db){return new Promise(function(res){var out=[],r=db.transaction('f').objectStore('f').openCursor();r.onsuccess=function(){var c=r.result;if(c){out.push({k:c.key,v:c.value});c.continue();}else res(out);};r.onerror=function(){res(out);};});}).catch(function(){return [];});}
 function locApaga(ks){if(!ks.length)return Promise.resolve();return idb().then(function(db){return new Promise(function(res){var t=db.transaction('f','readwrite'),o=t.objectStore('f');ks.forEach(function(k){o.delete(k);delete LOC[k];});t.oncomplete=function(){res();};t.onerror=function(){res();};});}).catch(function(){});}
 function trocaIds(o,map){var n=0;(function w(x){if(!x||typeof x!=='object')return;Object.keys(x).forEach(function(k){var v=x[k];if(typeof v==='string'){if(map[v]){x[k]=map[v];n++;}}else w(v);});})(o);return n;}
 /* junta cópias antigas do mesmo arquivo (ids sem hash) numa só, aponta os registros para ela e apaga o que ninguém usa mais há mais de um dia */
 window.unificaArquivos=function(){if(!window.indexedDB||!window.MULTI)return Promise.resolve(0);
  return locLista().then(function(L){var tem={};L.forEach(function(x){tem[x.k]=1;});
   var txt0=JSON.stringify(MULTI.data),solto=function(x){return txt0.indexOf(x.k)<0&&x.v&&x.v.em&&Date.now()-x.v.em>864e5;},leg=L.filter(function(x){return /^loc-/.test(x.k)&&String(x.k).indexOf('loc-h')!==0&&x.v&&x.v.blob&&!solto(x);}),map={};
   return Promise.all(leg.map(function(x){return hashHex(x.v.blob).then(function(h){if(h)map[x.k]='loc-h'+h;});})).then(function(){
    var puts=Object.keys(map).filter(function(k){return !tem[map[k]];}).map(function(k){var x=leg.filter(function(y){return y.k===k;})[0],id=map[k];if(tem[id])return null;tem[id]=1;return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('f','readwrite');t.objectStore('f').put(x.v,id);t.oncomplete=function(){res();};t.onerror=function(){rej(t.error);};});});}).filter(Boolean);
    return Promise.all(puts).then(function(){var mud=Object.keys(map).length?trocaIds(MULTI.data,map):0;if(mud&&window.save)save();
     var txt=JSON.stringify(MULTI.data),velhos=Object.keys(map),gc=L.filter(function(x){return map[x.k]||(/^loc-/.test(x.k)&&txt.indexOf(x.k)<0&&x.v&&x.v.em&&Date.now()-x.v.em>864e5);}).map(function(x){return x.k;});
     /* só apaga o que já foi copiado e religado, ou o que nenhum registro usa */
     return locApaga(gc).then(function(){velhos.forEach(function(k){if(window.FILES)Object.keys(FILES).forEach(function(n){if(FILES[n].id===k)FILES[n].id=map[k];});});return mud+gc.length;});});});}).catch(function(){return 0;});};
 window.blobUrl=function(id){if(!id)return '';if(/^loc-/.test(id)){if(!LOC[id])locFalta(id);return LOC[id]||'';}return '/_blob/'+id;};
 if(window.indexedDB)locAll().then(function(n){if(n)redesenha();});
 addEventListener('storage',function(e){if(e.key==='app-multi-v1')locAll().then(function(n){if(n)redesenha();});});
 var FILES=window.FILES={}; /* nome -> {id,url,type,local,pend} */
 var TYPES={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',csv:'text/csv',txt:'text/plain',json:'application/json',md:'text/markdown',xml:'text/plain',ofx:'text/plain',ret:'text/plain',rem:'text/plain',mp4:'video/mp4',webm:'video/webm'};
 function ext(n){var m=/\.([a-z0-9]+)$/i.exec(n||'');return m?m[1].toLowerCase():'';}
 function tipo(f){var t=TYPES[ext(f.name)];if(t)return t;var b=(f.type||'').split(';')[0];if(/xml/i.test(b))return 'text/plain';if(/pdf/i.test(b))return 'application/pdf';return /^(image\/(png|jpeg|gif|webp)|application\/pdf|video\/(mp4|webm))$/.test(b)?b:'';}
 if(window.claude&&claude.use)claude.use('assets').then(function(a){AS=a;ready=true;waiters.splice(0).forEach(function(f){f();});}).catch(function(){ready=true;waiters.splice(0).forEach(function(f){f();});});
 else ready=true;
 setTimeout(function(){if(!ready){ready=true;waiters.splice(0).forEach(function(f){f();});}},10000);
 function whenReady(f){if(ready)f();else waiters.push(f);}
 /* liga o arquivo a todos os registros com esse nome, em todas as empresas */
 function liga(nome,info){var mud=false;
  MULTI.emps.forEach(function(e){var d=MULTI.data[e.id];if(!d)return;
   (d.arq||[]).forEach(function(a){if(a.arq===nome&&!a.fileId&&info.id){a.fileId=info.id;a.ftype=info.type;mud=true;}});
   Object.keys(d.cofre||{}).forEach(function(c){((d.cofre[c]||{}).notas||[]).forEach(function(n){if(n.arq===nome&&!n.fileId&&info.id){n.fileId=info.id;n.ftype=info.type;mud=true;}(n.files||[]).forEach(function(f){if(f.n===nome&&!f.fid&&info.id){f.fid=info.id;f.ft=info.type;mud=true;}});});});});
  if(mud&&window.save)save();}
 window.upFiles=function(list){[].forEach.call(list||[],function(f){var nome=f.name,ty=tipo(f);
  var info=FILES[nome]={url:URL.createObjectURL(f),type:ty||f.type||'',local:1,size:f.size};
  if(!ty){info.nota='Tipo de arquivo que o protótipo não guarda. Ele abre só nesta sessão.';return;}
  info.pend=new Promise(function(res){whenReady(function(){
   if(!AS&&window.indexedDB){info.local=0;info.type=ty;
    hashHex(f).then(function(h){var lid=h?'loc-h'+h:'loc-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);info.id=lid;if(!LOC[lid])LOC[lid]=info.url;
     return (h?locHas(lid):Promise.resolve(false)).then(function(ja){return ja?null:locPut(lid,f,ty);}).then(function(){liga(nome,info);res(info);},function(){info.id=null;info.local=1;delete LOC[lid];info.nota='Não foi possível guardar o arquivo neste navegador. Ele abre só nesta sessão.';res(info);});});return;}
   if(!AS){info.nota='Sem armazenamento aqui: o arquivo abre só nesta sessão.';res(info);return;}
   AS.upload(f,{type:ty}).then(function(r){info.id=r.id;info.url='/_blob/'+r.id;info.local=0;info.type=r.contentType||ty;liga(nome,info);res(info);if(window.onFileSaved)onFileSaved(nome,info);})
   .catch(function(err){info.nota=err&&err.code==='too_large'?'Arquivo grande demais para guardar (até 20 MB).':'Não foi possível guardar o arquivo. Ele abre só nesta sessão.';res(info);if(window.onFileSaved)onFileSaved(nome,info);});});});});};
 /* apaga do armazenamento um arquivo que foi substituído (quem chama confere antes que nenhum registro usa mais o id) */
 window.apagaArquivo=function(id){if(!id)return Promise.resolve();Object.keys(FILES).forEach(function(n){if(FILES[n].id===id)delete FILES[n];});
  if(/^loc-/.test(id))return locApaga([id]);
  if(AS&&typeof AS.delete==='function')return Promise.resolve().then(function(){return AS.delete(id);}).catch(function(){});
  return Promise.resolve();};
 /* endereço do arquivo de um registro */
 window.arqUrl=function(a){if(!a)return '';if(a.fileId){var bu=blobUrl(a.fileId);if(bu||!FILES[a.arq])return bu;}var f=FILES[a.arq];if(f){if(f.id&&!a.fileId){a.fileId=f.id;a.ftype=f.type;}return f.url;}return '';};
 window.arqTipo=function(a){if(!a)return '';return a.ftype||(FILES[a.arq]||{}).type||TYPES[ext(a.arq)]||'';};
 window.abrirArquivo=function(a){var u=arqUrl(a);if(!u)return false;var l=document.createElement('a');l.href=u;l.target='_blank';l.rel='noopener';document.body.appendChild(l);l.click();l.remove();return true;};
 /* bloco de visualização para a tela do arquivo */
 window.arqPreview=function(a){var u=arqUrl(a),t=arqTipo(a);
  if(!u)return '<div class="note">Este arquivo foi registrado só pelo nome (envio anterior à guarda de arquivos, ou de outro aparelho sem armazenamento).</div>';
  var h='';if(/^image\//.test(t))h='<div class="card pad fprev"><img src="'+u+'" alt="'+String(a.n||'').replace(/"/g,'&quot;')+'"></div>';
  else if(/^video\//.test(t))h='<div class="card pad fprev"><video src="'+u+'" controls></video></div>';
  else if(t==='application/pdf')h='<div class="card pad fprev fpdf"><span>PDF</span><b>'+String(a.arq||a.n).replace(/</g,'&lt;')+'</b></div>';
  else h='<div class="card pad fprev fpdf"><span>'+(ext(a.arq)||'arquivo').toUpperCase()+'</span><b>'+String(a.arq||a.n).replace(/</g,'&lt;')+'</b></div>';
  var f=FILES[a.arq];if(f&&f.local&&f.nota)h+='<p class="foot">'+f.nota+'</p>';return h;};
})();

/* Teclado nunca cobre o campo: ao focar, rola o campo para cima do teclado e da barra de botões */
(function(){var CAMPO='input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([readonly]),textarea,select,[contenteditable=true]',foco=null,tm=[];
 function rolavel(el){var p=el.parentElement;while(p&&p!==document.body&&p!==document.documentElement){var o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+2)return p;p=p.parentElement;}return document.scrollingElement||document.documentElement;}
 function altVis(){var v=window.visualViewport;return v?v.height+v.offsetTop:window.innerHeight;}
 function teclado(){var v=window.visualViewport;return v?Math.max(0,window.innerHeight-v.height-v.offsetTop):0;}
 function topoBarra(el,lim){var m=lim;[].forEach.call(document.querySelectorAll('.fbar,.cbar,.fab,.tabs,.nav'),function(b){if(!b.offsetParent||b.contains(el))return;var ps=getComputedStyle(b).position;if(ps!=='fixed'&&ps!=='sticky'&&ps!=='absolute')return;var r=b.getBoundingClientRect();if(r.height>0&&r.top<m&&r.bottom>=lim-4&&r.top>lim*0.45)m=r.top;});return m;}
 function mostra(el){if(!el||!document.contains(el)||document.activeElement!==el)return;var sc=rolavel(el),kb=teclado();
  var sp=sc.querySelector(':scope > .kbsp');if(!sp){sp=document.createElement('div');sp.className='kbsp';sp.setAttribute('aria-hidden','true');sp.style.cssText='flex:none;pointer-events:none';sc.appendChild(sp);}sp.style.height=(kb+160)+'px';
  var vis=altVis(),base=topoBarra(el,vis)-14,r=el.getBoundingClientRect(),cab=Math.max(70,(sc.getBoundingClientRect?sc.getBoundingClientRect().top:0)+16);
  if(r.bottom>base||r.top<cab){var alvo=Math.max(cab,Math.min(base-r.height,cab+(base-cab-r.height)*0.35));var d=r.top-alvo;if(sc===document.scrollingElement||sc===document.documentElement)window.scrollBy(0,d);else sc.scrollTop+=d;}}
 function agenda(el){tm.forEach(clearTimeout);tm=[60,300,650].map(function(t){return setTimeout(function(){mostra(el);},t);});}
 document.addEventListener('focusin',function(e){var t=e.target;if(window.__chKb&&t&&t.id==='cmsg')return;/* o chat do cliente cuida do próprio teclado (ui.js) */if(t&&t.matches&&t.matches(CAMPO)){foco=t;agenda(t);}});
 document.addEventListener('focusout',function(){setTimeout(function(){var a=document.activeElement;if(a&&a.matches&&a.matches(CAMPO))return;foco=null;[].forEach.call(document.querySelectorAll('.kbsp'),function(s){s.remove();});},250);});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){if(foco)agenda(foco);});
 window.addEventListener('resize',function(){if(foco)agenda(foco);});
 /* ao digitar e a tela se redesenhar (ex.: busca do CEP), mantém o campo visível */
 document.addEventListener('input',function(e){if(foco&&e.target===foco)setTimeout(function(){mostra(foco);},30);});
})();
