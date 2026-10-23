/* Sincroniza o estado do app (MULTI) entre o app do cliente, a versão web e o painel do contador.
   Banco compartilhado do artefato: coleção "app" com um documento "cfg" e um documento por empresa ("e_<id>").
   Sem banco (fora do Claude ou sem login), usa só o armazenamento do navegador, que as três páginas também compartilham.
   Regra principal: a mudança feita nesta tela nunca é desfeita por uma cópia antiga que volta do servidor. */
(function(){
 var KEY='app-multi-v1',GRACE=2500;
 var sent={},seen={},busy={},pend={},quiet={},db=null,col=null,timer=null,inited=false,recheck=null;
 function local(){try{localStorage.setItem(KEY,JSON.stringify(MULTI));}catch(e){}}
 function parts(M){var o={cfg:{emps:M.emps.map(function(e){return e.id;}),cfg:M.cfg||{folhaDU:2,docsDia:14},sim:M.sim||null}};
  M.emps.forEach(function(e){o['e_'+e.id]={emp:e,data:M.data[e.id]||null};});return o;}
 /* um documento sendo gravado ou com gravação recente: o servidor ainda pode devolver versão antiga */
 function guarded(k){return busy[k]||pend[k]||(Date.now()-(quiet[k]||0))<GRACE;}
 function write(k,str){if(busy[k]){pend[k]=str;return;}busy[k]=1;sent[k]=str;
  col.doc(k).set(JSON.parse(str)).catch(function(err){sent[k]=null;if(window.onSyncError)onSyncError(err);}).then(function(){
   busy[k]=0;quiet[k]=Date.now();
   if(pend[k]){var n=pend[k];pend[k]=null;if(n!==sent[k])write(k,n);else quiet[k]=Date.now();}
   planRecheck();});}
 function push(){if(!col||!inited)return;var P=parts(MULTI);for(var k in P){var s=JSON.stringify(P[k]);if(sent[k]!==s&&pend[k]!==s)write(k,s);}}
 function schedule(now){clearTimeout(timer);timer=null;if(now)push();else timer=setTimeout(function(){timer=null;push();},300);}
 window.save=function(){local();schedule(false);};
 window.syncNow=function(){local();schedule(true);};
 /* depois da janela de proteção, confere uma vez se outra tela mudou algo de verdade */
 function planRecheck(){if(!col)return;clearTimeout(recheck);recheck=setTimeout(function(){recheck=null;col.get().then(onSnap).catch(function(){});},GRACE+200);}
 function adopt(docs){var c=docs.cfg;if(!c||!c.emps)return false;var emps=[],data={};
  c.emps.forEach(function(id){var d=docs['e_'+id];if(d&&d.emp){emps.push(d.emp);data[id]=d.data||{};}});
  if(!emps.length)return false;
  var cur=MULTI.cur;MULTI=window.MULTI={emps:emps,cur:cur,data:data,cfg:c.cfg||{folhaDU:2,docsDia:14},sim:c.sim||null,seedT2:MULTI.seedT2};
  if(!emps.some(function(e){return e.id===cur;}))MULTI.cur=emps[0].id;
  if(window.arqMigra)arqMigra();if(window.arqMigra2)arqMigra2();if(window.seedFer)seedFer();if(window.seedCad)seedCad();if(window.seedRot2)seedRot2();if(window.seedJess)seedJess();if(window.seedTeste2)seedTeste2();if(window.seedFicha1)seedFicha1();if(window.seedTermOff)seedTermOff();local();return true;}
 function onSnap(snap){
  if(snap.metadata&&snap.metadata.hasPendingWrites)return;
  if(snap.empty){if(!(snap.metadata&&snap.metadata.fromCache)&&!inited){inited=true;schedule(true);}return;}
  var first=!inited;inited=true;
  var mine=parts(MULTI),docs={},diff=false,held=false;
  for(var k in mine)docs[k]=mine[k];
  snap.docs.forEach(function(d){if(!d.exists)return;var k=d.id,s=JSON.stringify(d.data());
   if(!first&&(timer||guarded(k))){held=true;return;}        /* mantém o que esta tela tem agora */
   if(s===sent[k]||s===seen[k]){seen[k]=s;return;} /* eco da própria gravação ou nada novo */
   seen[k]=s;sent[k]=s;docs[k]=JSON.parse(s);diff=true;});
  if(held)planRecheck();
  if(first){var P=parts(MULTI);snap.docs.forEach(function(d){delete P[d.id];});if(Object.keys(P).length)setTimeout(function(){schedule(true);},0);}
  if(!diff)return;
  if(adopt(docs)&&window.applyRemote){var keep=window.save;window.save=local;try{applyRemote();}catch(e){console.error(e);}finally{window.save=keep;}}
  if(window.onSyncStatus)onSyncStatus('online');}
 window.syncStatus='local';
 /* aviso do que chegou da outra aba (teste de comunicação no mesmo navegador) */
 function resumoSync(M){var r={a:{},p:{},c:{}};(M.emps||[]).forEach(function(e){var d=(M.data||{})[e.id]||{};
  (d.arq||[]).forEach(function(a){r.a[a.id]={st:a.st,or:a.or,cat:a.cat,n:a.n,e:e,nv:/\d:\d/.test(String(((a.h||[]).slice(-1)[0]||[])[1]||''))};});
  (d.ped||[]).forEach(function(x){r.p[e.id+':'+x.id]={st:x.st,t:x.tipo,e:e};});
  var ch=d.chat||[];r.c[e.id]={n:ch.length,u:ch.length?ch[ch.length-1]:null,e:e};});return r;}
 function avisosSync(A,B){var ct=/contador/.test(window.__PAGE||''),cur=MULTI.cur,out=[],lb=function(t,k){return (t&&t[k]&&t[k][0])||k;};
  var nm=function(e){return e.fant||e.nome;};
  for(var id in B.a){var b=B.a[id],a=A.a[id];if(b.cat==='interno')continue;
   if(!a){if(!b.nv)continue;if(ct&&b.or==='cli')out.push(nm(b.e)+' enviou: '+b.n);else if(!ct&&b.or==='ct'&&b.e.id===cur)out.push('O escritório enviou: '+b.n);}
   else if(a.st!==b.st){if(!ct&&b.or==='cli'&&b.e.id===cur)out.push(b.n+': '+lb(window.ARQ_ST,b.st));else if(ct&&b.or==='ct'&&b.st==='visto')out.push(nm(b.e)+' viu: '+b.n);}}
  for(var k in B.p){var q=B.p[k],o=A.p[k];if(!o){if(ct)out.push('Novo pedido de '+nm(q.e)+': '+q.t);}else if(o.st!==q.st&&!ct&&q.e.id===cur)out.push('Pedido '+q.t+': '+lb(window.STL,q.st));}
  for(var c in B.c){var y=B.c[c],x=A.c[c]||{n:0};if(y.n>x.n&&y.u&&(ct?y.u.me:!y.u.me)&&(ct||c===cur))out.push((ct?nm(y.e)+': ':'Mensagem do escritório: ')+String(y.u.t||'').slice(0,60));}
  if(!out.length)return;var el=document.getElementById('sync-aviso');
  if(!el){el=document.createElement('div');el.id='sync-aviso';el.setAttribute('role','status');el.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483000;max-width:min(440px,calc(100vw - 32px));background:#17181B;color:#fff;font:600 13.5px/1.4 Manrope,system-ui,sans-serif;padding:11px 16px;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.28);transition:opacity .25s;pointer-events:none';document.body.appendChild(el);}
  el.textContent='\u21c4 '+out[0]+(out.length>1?' (+'+(out.length-1)+')':'');el.style.opacity='1';clearTimeout(el.__t);el.__t=setTimeout(function(){el.style.opacity='0';},4200);}
 /* mesmo navegador, outra aba ou página do artefato, sem banco */
 addEventListener('storage',function(e){if(e.key!==KEY||col||!e.newValue)return;try{var M=JSON.parse(e.newValue);try{avisosSync(resumoSync(MULTI),resumoSync(M));}catch(x){}var cur=MULTI.cur;MULTI=window.MULTI=M;if(M.emps.some(function(x){return x.id===cur;}))MULTI.cur=cur;if(window.limpaGuiasDemo)limpaGuiasDemo();if(window.applyRemote){var keep=window.save;window.save=local;try{applyRemote();}finally{window.save=keep;}}}catch(err){}});
 window.syncReset=function(){var ks=Object.keys(parts(MULTI)).concat(Object.keys(sent));try{localStorage.removeItem(KEY);localStorage.removeItem('app-estado-v2');}catch(e){}
  if(!col)return Promise.resolve();var c=col;col=null;return Promise.all(ks.map(function(k){return c.doc(k).delete().catch(function(){});}));};
 if(window.claude&&claude.use)claude.use('db').then(function(d){if(!d){if(window.onSyncStatus)onSyncStatus('local');return;}db=d;col=db.collection('app');window.syncStatus='online';if(window.onSyncStatus)onSyncStatus('online');
  col.onSnapshot(onSnap,function(err){col=null;window.syncStatus='local';if(window.onSyncStatus)onSyncStatus('local');});}).catch(function(){});
})();
