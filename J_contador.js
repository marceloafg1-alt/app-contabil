/* App do contador — usa o mesmo núcleo de dados (nucleo.js), a mesma sincronização (sync.js)
   e o mesmo visual do app do cliente. Telas: início, pedidos, recebidos, arquivo, mensagens, ajustes. */
(function(){
var $=function(id){return document.getElementById(id);};
var P=$('phone'),SCR=$('c-scr'),NAV=$('c-nav');
var DESK=!!window.CONTADOR_DESK;
var CLI0=MULTI.cur,cur='inicio',hist=[];
var UI={tema:'azul-escuro',escuro:0,arqEmp:'',fEmp:'all',pf:'abertos',og:'all'};
try{var sv=JSON.parse(localStorage.getItem('contador-ui2')||'{}');for(var k in sv)UI[k]=sv[k];}catch(e){}
var LIDAS={};try{LIDAS=JSON.parse(localStorage.getItem('contador-lidas')||'{}');}catch(e){}
function keep(){try{localStorage.setItem('contador-ui2',JSON.stringify(UI));localStorage.setItem('contador-lidas',JSON.stringify(LIDAS));}catch(e){}}
var MESC2=MESC;
/* ===== dados ===== */
function B(id){var e=MULTI.emps.filter(function(x){return x.id===id;})[0]||MULTI.emps[0];MULTI.cur=e.id;ST=MULTI.data[e.id]||(MULTI.data[e.id]=novaData(e.nome));
 FUNCD=e.func||(e.func={});FUNC=funcAtivos();SOCD=e.socios||{};SOCIOS=Object.keys(SOCD);GU=e.gu||(e.gu=[]);GU_PG=e.gupg||(e.gupg=[]);FOLDERS=e.folders||(e.folders={});
 GUIAS=GU.map(function(g){return g.n.split(' · ')[0]+' · '+g.c+' · R$ '+g.v;});return e;}
function eById(id){return MULTI.emps.filter(function(x){return x.id===id;})[0];}
function emps(f){f=f||UI.fEmp;var l=f==='all'?EV():MULTI.emps.filter(function(e){return e.id===f;});return l.length?l:MULTI.emps;}
function done(){MULTI.cur=CLI0;}
function commit(msg){done();save();rerender();if(msg)toast(msg);}
function agora(){var d=new Date();return hoje()+', '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function avisar(t,s,go){ST.notif=ST.notif||[];ST.notif.unshift({t:t,s:s,h:'Agora',go:go,u:1});}
function ativ(t){ST.act=ST.act||[];ST.act.unshift([t,'Agora',1]);}
function maskMoney(v){var d=String(v).replace(/\D/g,'').replace(/^0+/,'');if(!d)return '';while(d.length<3)d='0'+d;return d.slice(0,-2).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d.slice(-2);}
function dInput(dt){return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);}
function guiaCode(){var s='';for(var i=0;i<48;i++)s+=Math.floor(Math.random()*10);return '8'+s.slice(1,11)+'-'+s[11]+' '+s.slice(12,23)+'-'+s[23]+' '+s.slice(24,35)+'-'+s[35]+' '+s.slice(36,47)+'-'+s[47];}
function compsRec(){var n=NOW(),o=[];for(var k=0;k>=-5;k--)o.push(cName(n.getFullYear(),n.getMonth()+k));return o;}
function clientMsgs(st){return (st.chat||[]).filter(function(m){return m.me;}).length;}
var PST={enviado:['Novo','warn'],analise:['Em análise','info'],voce:['Com o cliente','neutral'],ok:['Concluído','ok']};
function pst(p){if(pedDireto(p)&&p.st!=='voce')return [p.f==='despesas'?'Lançada':'Recebido','ok'];if(p.st==='enviado'&&p.vis)return ['Em análise','info'];if(p.gEnv&&p.st!=='ok')return ['Guia enviada','info'];return p.st==='analise'&&p.cr?['Cliente respondeu','warn']:PST[p.st]||PST.enviado;}
function dirA0(a){return arqDireto(a);}
function aConferir(st){return arqList(st).filter(function(a){return a.or==='cli'&&(a.st==='enviado'||a.st==='analise')&&!arqDireto(a);});}
function folhasFechar(){return folhasOf().filter(function(f){var x=fst(f);return x==='enviada'||x==='auto';});}
function stats(f){var s={nv:0,ab:0,doc:0,fo:0,msg:0};emps(f).forEach(function(e){B(e.id);arqCofre(ST);
 ST.ped.forEach(function(p){if(p.st!=='ok')s.ab++;if(!pedDireto(p)&&(p.st==='enviado'||(p.st==='analise'&&p.cr)))s.nv++;});
 s.doc+=aConferir().length;s.fo+=folhasFechar().length;var n=clientMsgs(ST)-(LIDAS[e.id]||0);if(n>0)s.msg+=n;});done();return s;}
/* ===== peças visuais (mesmas classes do app do cliente) ===== */
function esw(e,sm){return '<span class="esw'+(sm?' sm':'')+'" style="'+tsw(e.tema)+'" aria-hidden="true">'+esc(ini(e.fant||e.nome))+'</span>';}
function pill(k,t){return '<span class="pill '+k+'">'+esc(t)+'</span>';}
function hdr(t,sub,noBack){return '<div class="dhd">'+(noBack?'':'<button type="button" class="bk" data-back aria-label="Voltar">'+IC.back+'</button>')+'<div class="dtt"><div class="s">'+esc(sub||'')+'</div><h1>'+esc(t)+'</h1></div></div>';}
function sec(t,extra){return '<div class="sec"><h2>'+esc(t)+'</h2>'+(extra||'')+'</div>';}
function tline(f,at,stop){return '<ol class="tline">'+f.map(function(x,i){var c=i<at?'ok':i===at?'cur':'';if(stop&&i===stop)c='cur';return '<li class="'+c+'"><span class="tb">'+(i<at?IC.check16:'')+'</span><span class="rt"><span class="a">'+esc(x[0])+'</span>'+(x[1]&&i<=at?'<span class="b">'+esc(x[1])+'</span>':'')+'</span></li>';}).join('')+'</ol>';}
function empChips(attr,val,all){return empSel(attr,val,all,'Cliente');}
function empChipsOld(attr,val,all){return '<div class="chips ech" role="group" aria-label="Cliente">'+(all?'<button type="button" class="chip'+(val==='all'?' on':'')+'" data-'+attr+'="all">Todos</button>':'')+MULTI.emps.map(function(e){return '<button type="button" class="chip'+(val===e.id?' on':'')+'" data-'+attr+'="'+e.id+'">'+esc(e.fant||e.nome)+'</button>';}).join('')+'</div>';}
/* campos: botões que abrem a lista, o calendário ou o seletor de mês (iguais ao app do cliente) */
var FV={},PL={},PLT={};
function fv(id,val){if(FV[id]===undefined)FV[id]=val;return FV[id];}
function V(id){return FV[id];}
function pickF(id,lab,list,val,ext){var v=fv(id,val),it=list.filter(function(o){return o[0]===v;})[0];PL[id]=list;PLT[id]=lab;
 return '<div class="fld"><span class="fl">'+lab+'</span><button type="button" class="selbtn'+(it?' has':'')+'" id="'+id+'" data-pk="'+id+'"><span>'+esc(it?it[1]:'Selecione')+'</span>'+IC.chevd+'</button>'+(ext||'')+'</div>';}
function dateF(id,lab,val,ext){var v=fv(id,val);PLT[id]=lab;return '<div class="fld"><span class="fl">'+lab+'</span><button type="button" class="selbtn'+(v?' has':'')+'" id="'+id+'" data-dt="'+id+'"><span>'+(v?fmtD(v):'dd/mm/aaaa')+'</span>'+IC.cal+'</button>'+(ext||'')+'</div>';}
function mesF(id,lab,val,ext){var v=fv(id,val);PLT[id]=lab;return '<div class="fld"><span class="fl">'+lab+'</span><button type="button" class="selbtn'+(v?' has':'')+'" id="'+id+'" data-mp="'+id+'"><span>'+(v?esc(v):'Selecione o mês')+'</span>'+IC.cal+'</button>'+(ext||'')+'</div>';}
function curto(c){var q=cParse(c);return q.m<0?c:MESC2[q.m]+'/'+q.y;}
function selE(id,val){var v=fv(id,val),e=eById(v)||MULTI.emps[0];return '<div class="fld"><span class="fl">Cliente</span><button type="button" class="selbtn has" id="'+id+'" data-empfld="'+id+'" aria-haspopup="dialog">'+esw(e,1)+'<span style="flex:1;text-align:left;margin-left:10px">'+esc(e.fant||e.nome)+'</span>'+IC.chevd+'</button></div>';}
function selCat(id,val,ext){return pickF(id,'Pasta',CATS.map(function(c){return [c[0],c[1]];}),val,ext);}
function selComp(id,val,lab){return mesF(id,lab||'Competência',val);}
function fileF(id,lab){return '<div class="fld"><span class="fl">'+(lab||'Arquivo')+' <i>(opcional)</i></span><label class="up" for="'+id+'" id="'+id+'-l"><span class="ri">'+IC.up16+'</span><span class="rt"><span class="a">Escolher arquivo</span><span class="b">O tipo aceito depende da pasta</span></span><input class="fi-over" type="file" id="'+id+'" aria-label="Escolher arquivo"></label></div>';}
function txt(id,lab,ph,val,opt){return '<div class="fld"><label class="fl" for="'+id+'">'+lab+(opt?' <i>(opcional)</i>':'')+'</label><input id="'+id+'" type="text" placeholder="'+esc(ph||'')+'" value="'+esc(val||'')+'" autocomplete="off"></div>';}
var tt;function toast(m){var t=$('toast'),d=toastPinta(t,m);clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},d);}
/* ===== navegação ===== */
var TABS=[['inicio','Início','home'],['pedidos','Pedidos','sol'],null,['arquivo','Documentos','folder'],['msg','Chat','chat']];
var TABOF={ped:'pedidos',pedidos:'pedidos',arquivo:'arquivo',pasta:'arquivo',doc:'arquivo',folha:'arquivo',msg:'msg',chat:'msg'};
function head(r){return r.split('-')[0];}
function navHTML(){P.classList.toggle('chat',head(cur)==='chat'||cur==='msg');var s=stats('all'),cnt={pedidos:s.nv,msg:s.msg,arquivo:s.doc+s.fo},on=TABOF[head(cur)]||'inicio';
 return TABS.map(function(t){if(!t)return '<div class="fw"><button type="button" class="fab" id="fab" aria-label="Novo envio" data-fab>'+IC.plus+'</button></div>';
  return '<button type="button" class="n'+(on===t[0]?' on':'')+'" data-go="'+t[0]+'" data-tab><span class="nw">'+IC[t[2]]+(cnt[t[0]]?'<span class="bd">'+cnt[t[0]]+'</span>':'')+'</span>'+t[1]+'</button>';}).join('')+
  (DESK?'<a class="wl" href="index.html">↗ App do cliente</a><a class="wl" href="contador-app.html" style="margin-top:0">↗ Contador no celular</a>':'');}
var fwd=[];
function go(r){if(r===cur)return;if(/^chat-/.test(r))UI.cht='ct';hist.push(cur);show(r);}
function forward(){var n=fwd.pop();if(!n)return false;hist.push(cur);show(n,false,true);return true;}
function back(){if(cur==='inicio')return;var p=hist.pop();fwd.push(cur);show(p||'inicio',true);}
function show(r,isBack,isFwd){if(!isBack&&!isFwd)fwd=[];closeSheet();closeAll();if(r!==cur){FV={};}cur=r;if(TABOF[r]===r||r==='inicio')hist=[];var html=route(r);if(html===null){r=cur='inicio';html=route('inicio');}
 SCR.innerHTML=html;SCR.scrollTop=0;SCR.classList.toggle('voltar',!!isBack);SCR.style.animation='none';void SCR.offsetWidth;SCR.style.animation='';NAV.innerHTML=navHTML();done();
 if(head(r)==='chat'||r==='msg'){var m=$('msgs');if(m)SCR.scrollTop=SCR.scrollHeight;}
 try{history.replaceState(null,'','#'+encodeURIComponent(r));}catch(e){}}
function rerender(){var y=SCR.scrollTop,vals={},ae=document.activeElement,aid=ae&&ae.id;
 SCR.querySelectorAll('input[id],textarea[id],select[id]').forEach(function(x){if(x.type!=='file')vals[x.id]=x.value;});
 var html=route(cur);if(html===null){show('inicio');return;}SCR.innerHTML=html;NAV.innerHTML=navHTML();done();
 for(var k in vals){var x=$(k);if(x&&x.type!=='file'&&!x.dataset.fresh)x.value=vals[k];}
 SCR.scrollTop=y;if(aid&&$(aid))try{$(aid).focus();}catch(e){}
 if(isChat())SCR.scrollTop=SCR.scrollHeight;}
function route(r){var h=head(r),a=r.slice(h.length+1);var R={recnovo:vRecNovo,rec:vRec,chk:vChk,lote:vLote,fecha:vFecha,dp:vDP,desp:vDesp,inicio:vInicio,pedidos:vPedidos,ped:vPed,receb:vReceb,arquivo:vArquivo,pasta:vPasta,doc:vDoc,folha:vFolha,msg:vMsg,chat:vChat,ajuda:vAjuda,novodoc:vNovoDoc,novoguia:vNovoGuia,guias:vGuias,colab:vColab,socio:vSocio,cguia:vGuiaC,novoped:vNovoPed,ajustes:vAjustes,cli:vCli,gestao:vGestao,notif:vNotif}[h];return R?R(a):null;}
/* ===== início ===== */
function vInicio(){var s=stats('all'),tot=s.nv+s.doc+s.fo+s.msg,partes=[];
 if(s.nv)partes.push(s.nv+(s.nv===1?' pedido novo':' pedidos novos'));if(s.doc)partes.push(s.doc+(s.doc===1?' documento para conferir':' documentos para conferir'));if(s.fo)partes.push(s.fo+(s.fo===1?' folha para fechar':' folhas para fechar'));if(s.msg)partes.push(s.msg+(s.msg===1?' mensagem':' mensagens'));
 var alvo=s.nv?'pedidos':(s.doc||s.fo)?'receb':s.msg?'msg':'arquivo';
 var h='<div class="hhd"><div class="s">Contabilidade Horizonte · '+MULTI.emps.length+(MULTI.emps.length===1?' cliente':' clientes')+'</div><div class="hrow"><h1 class="big">Olá, Paula</h1><div class="hbtns hic"><button type="button" class="tbtn ic" data-go="ajustes" aria-label="Configurações"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>'+nbellCt()+'</div></div></div>';
 h+='<div class="hero"><div class="hk"><span>Para hoje</span><span class="pill-w">'+(tot?tot+(tot===1?' pendência':' pendências'):'Tudo em dia')+'</span></div><p class="ht">'+(partes.length?esc(cap(partes.join(', ').replace(/, ([^,]*)$/,' e $1')))+'.':'Nenhum pedido ou documento esperando por você.')+'</p><div class="hb"><span class="due"></span><button type="button" class="send" data-go="'+alvo+'">'+(tot?'Começar':'Ver arquivo')+'</button></div></div>';
 h+='<button type="button" class="r solo" data-go="receb"><span class="ri">'+IC.down+'</span><span class="rt"><span class="a">Recebidos para conferir</span><span class="b">'+(s.doc+s.fo?(s.doc+' documentos · '+s.fo+' folhas'):'Nada esperando conferência')+'</span></span>'+(s.doc+s.fo?'<span class="pill warn">'+(s.doc+s.fo)+'</span>':'<span class="cv">'+IC.chev18+'</span>')+'</button>';
 var fv=0,fa=0,dpn=0;MULTI.emps.forEach(function(e){B(e.id);var n0=NOW(),c0=cName(n0.getFullYear(),n0.getMonth()-1);GRP.forEach(function(g){var x=celSt(g[0],c0);if(x.f==='venc')fv++;if(x.f==='aberto')fa++;});ST.ped.forEach(function(p){if(p.st!=='ok'&&(['admissao','cadfunc','ferias','demissao','afastamento'].indexOf(p.f)>-1||(p.f==='libmes'&&/^folha\|/.test(p.lk||''))))dpn++;});});done();
 var gp=gcPend(),gdn=0,gl=0;MULTI.emps.forEach(function(e){B(e.id);ST.ped.forEach(function(p){if(p.st!=='ok'&&(FLOWS[p.f]||{}).a==='guias')gdn++;});gl+=libPeds('notas').length+libPeds('extratos').length+libPeds('despesas').length;});done();
 var tile=function(go,ic,t,pl){return '<button type="button" class="t ti" data-go="'+go+'"><span class="trow"><span class="ib">'+ic+'</span>'+pl+'</span><span class="tl">'+t+'</span></button>';};
 h+='<div class="g2">'+tile('dp',IC.people,'Departamento Pessoal',dpn?pill('warn',dpn+(dpn>1?' pedidos':' pedido')):pill('ok','Em dia'))+tile('gestao',IC.receipt||IC.doc,'Gestão contábil',gp||gl?pill('warn',gp?gp+' para conferir':gl+(gl>1?' liberações':' liberação')):pill('ok','Em dia'))+tile('guias',IC.tax,'Guias de impostos',gdn?pill('warn',gdn+(gdn>1?' pedidos':' pedido')):pill('ok','Em dia'))+tile('pedidos',IC.sol,'Pedidos',s.ab?pill('warn',s.ab+' em aberto'):pill('ok','Em dia'))+'</div>';
 h+='<button type="button" class="r solo" data-go="fecha"><span class="ri">'+(IC.cal||IC.clock)+'</span><span class="rt"><span class="a">Fechamento do mês</span><span class="b">Prazos e envios de todos os clientes</span></span>'+(fv?'<span class="pill bad">'+fv+(fv>1?' vencidos':' vencido')+'</span>':fa?'<span class="pill warn">'+fa+' em aberto</span>':'<span class="cv">'+IC.chev18+'</span>')+'</button>';
 h+='<button type="button" class="r solo" data-go="rec-all"><span class="ri">'+(IC.pro||IC.people)+'</span><span class="rt"><span class="a">Recorrência</span><span class="b">Descontos e pedidos que se repetem: colaboradores e sócios</span></span><span class="cv">'+IC.chev18+'</span></button>';
 h+='<button type="button" class="r solo" data-go="lote"><span class="ri">'+IC.up16+'</span><span class="rt"><span class="a">Enviar em lote</span><span class="b">Guias, holerites e documentos para vários clientes de uma vez</span></span><span class="cv">'+IC.chev18+'</span></button>';
 h+='<button type="button" class="r solo" data-go="arquivo"><span class="ri">'+IC.folder+'</span><span class="rt"><span class="a">Documentos dos clientes</span><span class="b">Pastas e documentos de cada cliente</span></span><span class="cv">'+IC.chev18+'</span></button>';
 h+='<button type="button" class="r solo" data-go="novodoc"><span class="ri">'+IC.up+'</span><span class="rt"><span class="a">Enviar documento</span><span class="b">Contratos, demonstrativos e outros arquivos para um cliente</span></span><span class="cv">'+IC.chev18+'</span></button>';
 h+='<section>'+sec('Clientes','<button type="button" class="lnk" data-go="ajustes">Gerenciar</button>')+'<div class="card">'+MULTI.emps.map(function(e){B(e.id);var ab=ST.ped.filter(function(p){return p.st!=='ok';}).length,dc=aConferir().length+folhasFechar().length,pd=pendencias().length;
  return '<button type="button" class="r" data-earq="'+e.id+'">'+esw(e)+'<span class="rt"><span class="a">'+esc(e.fant||e.nome)+'</span><span class="b">'+[ab?ab+(ab===1?' pedido':' pedidos'):'',dc?dc+' para conferir':'',pd?pd+(pd===1?' envio pendente':' envios pendentes'):''].filter(Boolean).join(' · ').replace(/^$/,'Tudo em dia')+'</span></span>'+(ab+dc?pill('warn',String(ab+dc)):pill('ok','Em dia'))+'</button>';}).join('')+'</div></section>';
 var L=pedAll('all').slice(0,4);
 h+='<section>'+sec('Últimos pedidos','<button type="button" class="lnk" data-go="pedidos">Ver todos</button>')+'<div class="card">'+(L.map(pedRow).join('')||'<p class="empty">Nenhum pedido ainda.</p>')+'</div></section>';
 return h;}


/* ===== notificações: o que os clientes enviaram, pediram ou responderam; o que já foi lido fica guardado neste aparelho ===== */
var NLIDAS={};try{NLIDAS=JSON.parse(localStorage.getItem('contador-notif')||'{}');}catch(e){}
function nlSave(){try{localStorage.setItem('contador-notif',JSON.stringify(NLIDAS));}catch(e){}}
function ctNotifs(){var L=[];
 emps('all').forEach(function(e){B(e.id);arqCofre(ST);var en=e.fant||e.nome;
  ST.ped.forEach(function(p){if(pedDireto(p))return;var cr=p.st==='analise'&&p.cr;if(p.st!=='enviado'&&!cr)return;
   L.push({k:'p|'+e.id+'|'+p.id+'|'+(cr?'cr':'nv'),ic:IC[(FLOWS[p.f]||{}).i]||IC.sol,t:(cr?'Cliente respondeu: ':p.f==='libmes'?'':'Novo pedido: ')+p.tipo+(p.quem?' · '+p.quem:''),s:en+' · '+p.data,go:'ped-'+e.id+'|'+p.id});});
  aConferir().forEach(function(a){L.push({k:'a|'+e.id+'|'+a.id,ic:IC.down,t:'Documento recebido: '+a.n,s:en+' · '+catOf(a.cat)[1]+' · '+a.data,go:'doc-'+e.id+'|'+a.id});});
  folhasFechar().forEach(function(f){L.push({k:'f|'+e.id+'|'+f.id,ic:IC['var'],t:'Folha para fechar: '+f.func+' · '+f.tipo,s:en+' · '+f.comp,go:'folha-'+e.id+'|'+f.id});});
  var nm=clientMsgs(ST),n=nm-(LIDAS[e.id]||0);if(n>0)L.push({k:'m|'+e.id+'|'+nm,ic:IC.chat,t:n+(n===1?' mensagem nova':' mensagens novas'),s:en+' · Chat',go:'chat-'+e.id});});done();
 L.forEach(function(x){x.u=!NLIDAS[x.k];});return L.filter(function(x){return x.u;}).concat(L.filter(function(x){return !x.u;}));}
function nbellCt(){var nu=ctNotifs().filter(function(x){return x.u;}).length;
 return '<button type="button" class="tbtn ic nbell" data-go="notif" aria-label="Notificações">'+IC.bell+(nu?'<span class="bd">'+(nu>99?'99+':nu)+'</span>':'')+'</button>';}
function vNotif(){var L=ctNotifs(),nu=L.filter(function(x){return x.u;}).length,vale={};L.forEach(function(x){vale[x.k]=1;});
 Object.keys(NLIDAS).forEach(function(k){if(!vale[k])delete NLIDAS[k];});nlSave();
 return hdr('Notificações',nu?nu+(nu>1?' não lidas':' não lida'):'Tudo lido')+
 '<section>'+sec('Recentes',nu?'<button type="button" class="lnk" data-ntall>Marcar todas como lidas</button>':'')+'<div class="card">'+(L.map(function(x){return '<button type="button" class="r nt'+(x.u?' un':'')+'" data-ctnt="'+esc(x.k)+'" data-ntgo="'+esc(x.go)+'"><span class="ri">'+x.ic+'</span><span class="rt"><span class="a">'+esc(x.t)+'</span><span class="b">'+esc(x.s)+'</span></span>'+(x.u?'<span class="ud"></span>':IC.chev18)+'</button>';}).join('')||'<p class="empty">Nenhuma notificação. Tudo em dia.</p>')+'</div></section>'+
 '<p class="foot">Pedidos novos, respostas dos clientes, documentos e folhas recebidos e mensagens do chat. Cada aviso sai daqui quando você resolve o que ele pede.</p>';}

/* ===== colaboradores: ficha completa e histórico de solicitações ===== */
var CACC={};
document.addEventListener('toggle',function(e){var t=e.target;if(t&&t.dataset&&t.dataset.cacc)CACC[t.dataset.cacc]=t.open;},true);
function colabKind(e,nm,d){var P=ST.ped.filter(function(p){return p.quem===nm&&(p.f==='admissao'||p.f==='colaborador');}),a=P[P.length-1];if(d.ant)return 'Readmissão';if(a&&a.f==='admissao')return a.tipo||'Admissão';return 'Cadastro';}
function colabSt(d){return d.dem?['neutral','Desligado']:d.adm==='Em admissão'?['warn','Em admissão']:['ok','Ativo'];}
function colabRow(x){var d=x.d,s=colabSt(d),ini=x.nm.split(' ').map(function(w){return w[0];}).slice(0,2).join('');
 return '<button type="button" class="r" data-go="colab-'+x.e.id+'|'+esc(x.nm)+'">'+'<span class="ri" style="font-weight:700;font-size:13px">'+esc(ini)+'</span><span class="rt"><span class="a">'+esc(x.nm)+'</span><span class="b">'+esc((x.e.fant||x.e.nome)+' · '+(d.c||'—'))+'</span></span>'+pill(s[0],s[1])+'</button>';}
function vColab(a){var q=String(a).split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var nm=q.slice(1).join('|'),d=FUNCD[nm];if(!d){done();return null;}
 var v=function(x){return x==null||x===''?'—':esc(String(x));},s=colabSt(d),kind=colabKind(e,nm,d),fe=d.dem?null:ferEstado(nm);
 var pcd=d.pcd?('Sim · '+(d.pcdT==='Outros'?(d.pcdO||'Outros'):(d.pcdT||'tipo não informado'))):(d.pcd===false?'Não':'—');
 var h=hdr(nm,(d.c||'—')+' · '+(e.fant||e.nome))+'<div class="hero"><div class="hk"><span>'+esc(kind)+'</span><span class="pill-w">'+esc(s[1])+'</span></div><p class="ht">'+(d.dem?'Desligado em '+esc(d.dem)+'.':d.adm==='Em admissão'?'Admissão em andamento'+(d.ini?', início em '+esc(fmtD(d.ini)||d.ini):'')+'.':'Admitido em '+esc(d.adm||'—')+'.')+(d.cad?' Cadastro registrado em '+esc(d.cad)+'.':'')+'</p></div>';
 var acc=function(id,ic,t,sub,body){return '<details class="facc" data-cacc="'+id+'"'+(CACC[id]?' open':'')+'><summary><span class="ri">'+(ic||'')+'</span><span class="rt"><span class="a">'+t+'</span><span class="b">'+esc(sub||'')+'</span></span><span class="fchev">'+(IC.chevd||'▾')+'</span></summary><div class="fbody">'+body+'</div></details>';},
  em=d.emerg&&(d.emerg.n||d.emerg.tel)?esc([d.emerg.n,d.emerg.rel].filter(Boolean).join(' · '))+(d.emerg.tel?'<br>'+esc(d.emerg.tel):''):'—',en=d.end||{},ds=d.deps||[];
 h+='<div class="faccw"><p class="foot" style="margin:0 0 2px">Toque numa seção para abrir os dados.</p>'
 +acc('pessoal',IC.people,'Pessoal','CPF '+(d.cpf||'—')+(d.nasc?' · nasc. '+(fmtD(d.nasc)||d.nasc):''),kv('CPF',v(d.cpf))+kv('Nascimento',v(fmtD(d.nasc)||d.nasc))+kv('Gênero',v(d.gen))+kv('Nome da mãe',v(d.mae))+kv('Nome do pai',v(d.pai))+kv('Nacionalidade',v(d.nac))+kv('Estado civil',v(d.ecivil))+kv('Escolaridade',v(d.esc))+kv('Raça',v(d.raca))+kv('PcD',esc(pcd)))
 +acc('prof',IC.folha||IC.doc,'Profissional',[d.c,d.sal&&d.sal!=='—'?'R$ '+d.sal:''].filter(Boolean).join(' · '),kv('Cargo',v(d.c))+kv('Relação de emprego',v(d.tipo))+kv('Admissão',v(d.adm))+(d.ini?kv('Início',v(fmtD(d.ini)||d.ini)):'')+kv('Salário',d.sal&&d.sal!=='—'?'R$ '+esc(d.sal):'—')+kv('CTPS',d.ctpsN?esc(d.ctpsN)+' · série '+esc(d.ctpsS||'—'):'—')+(d.exame?kv('Exame admissional',v(fmtD(d.exame))):'')+(d.exp?kv('Experiência',v(d.exp)):'')+(d.fim?kv('Término do contrato',v(fmtD(d.fim))):'')+(d.interv?kv('Intervalo',v(d.interv)):'')+(d.tur?kv('Turno',v(d.tur)):'')+(fe?kv('Período aquisitivo',fmtA(fe.ini)+' a '+fmtA(fe.fim))+kv('Férias até',fmtA(fe.lim)):'')+(d.dem?kv('Desligamento',v(d.dem)):'')+(d.ant?kv('Vínculo anterior',esc(d.ant.adm)+' a '+esc(d.ant.dem)+(d.ant.mot?' · '+esc(d.ant.mot):'')):''))
 +acc('jornada',IC.clock||IC.cal,'Jornada',d.jornada?jorTotTxt(d.jornada)+' por semana':(d.jor||'—'),d.jornada?jorCard(d.jornada,0)+'<p class="foot">Total na semana: <b>'+jorTotTxt(d.jornada)+'</b></p>':kv('Jornada',v(d.jor)))
 +acc('contato',IC.chat||IC.people,'Contato',[d.tel,d.email].filter(Boolean).join(' · ')||'—',kv('Celular',v(d.tel))+kv('E-mail',v(d.email))+kv('Emergência',em))
 +acc('endereco',IC.folder||IC.doc,'Endereço',en.cep?(en.cidade||'')+(en.uf?'/'+en.uf:''):'Não informado',en.cep?kv('Logradouro',esc((en.rua||'')+(en.num?', '+en.num:'')))+(en.comp?kv('Complemento',v(en.comp)):'')+kv('Bairro',v(en.bairro))+kv('Cidade',esc((en.cidade||'—')+(en.uf?'/'+en.uf:'')))+kv('CEP',v(en.cep)):'<p class="lead0" style="margin:8px 0 0">Endereço não informado.</p>')
 +acc('deps',IC.people,'Dependentes',ds.length?ds.length+(ds.length===1?' dependente':' dependentes'):'Nenhum',ds.length?ds.map(function(x){return kv(esc(x.nome||'—'),esc((x.par==='Outros'?(x.parO||'Outros'):(x.par||''))+(x.nasc?' · '+fmtD(x.nasc):'')+(x.cpf?' · CPF '+x.cpf:'')));}).join(''):'<p class="lead0" style="margin:8px 0 0">Nenhum dependente cadastrado.</p>')+'</div>';
 var PD=ST.ped.filter(function(p){return p.quem===nm;}),FO=folhasOf().filter(function(f){return f.func===nm&&fst(f)!=='rascunho';});
 h+='<section>'+sec('Histórico de solicitações','<span class="s">'+PD.length+'</span>')+'<div class="card">'+(PD.map(function(p){return pedRow({e:e,p:p});}).join('')||'<p class="empty">Nenhuma solicitação para este colaborador.</p>')+'</div></section>';
 if(FO.length)h+='<section>'+sec('Folhas','<span class="s">'+FO.length+'</span>')+'<div class="card">'+FO.map(function(f){return folhaRow(e,f);}).join('')+'</div></section>';
 h+='<div class="fbar"><button type="button" class="cta ghost" data-go="chat-'+e.id+'">'+IC.chat+' Chamar o cliente</button></div>';done();return h;}
/* ===== guias de impostos: controle das guias enviadas aos clientes ===== */
var GUIA_TP={parcelar:'Parcelamento',recalculo:'Recálculo',duvida:'Dúvida',via2:'2ª via',comprovante:'Guia paga'};
function guiaPeds(g){var k=g.n.split(' · ')[0]+' · '+g.c;return ST.ped.filter(function(p){if(!GUIA_TP[p.f])return false;var v=dvP(p,/^(qual guia|o que voc|sobre qual)/i);return v.indexOf(k)===0;});}
function guiaInfo(e,i){B(e.id);var g=GU[i],pg=!!ST.pagas[i],dt=guiaDt(g),venc=!pg&&diasAte(dt)<0,pd=guiaPeds(g),ab=pd.filter(function(p){return p.st!=='ok';}),ar=arqList().filter(function(a){return a.gi===i&&a.or==='ct';})[0],cp=arqList().filter(function(a){return a.gi===i&&a.or==='cli';});done();
 return {g:g,i:i,pg:pg,venc:venc,pd:pd,ab:ab,ar:ar,cp:cp};}
function guiaPills(x){var o=[];if(x.pg)o.push(pill('ok',x.cp.length?'Paga · comprovante':'Paga'));else o.push(pill(x.venc?'bad':x.g.k==='warn'?'warn':'neutral',x.venc?'Vencida':'A pagar'));x.ab.forEach(function(p){o.push(pill('warn',GUIA_TP[p.f]));});return o.join('');}
function guiaRow(e,x){var g=x.g;return '<button type="button" class="r" data-go="cguia-'+e.id+'|'+x.i+'"><span class="ri">'+IC.tax+'</span><span class="rt"><span class="a">'+esc(g.n)+'</span><span class="b">'+esc(g.c+' · R$ '+g.v+' · '+(x.pg?'paga'+(x.cp.length?', com comprovante':', sem comprovante'):x.venc?'venceu em '+g.venc:'vence '+g.venc))+'</span></span><span class="gpl">'+guiaPills(x)+'</span></button>';}
function vGuias(){var f=UI.gfs||'todas',h=hdr('Guias de impostos','Controle das guias enviadas aos clientes')+empChips('femp',UI.fEmp,1),n={ap:0,pg:0,pd:0},B2=[];
 emps().forEach(function(e){B(e.id);var L=GU.map(function(g,i){return guiaInfo(e,i);});B(e.id);var sem=ST.ped.filter(function(p){return GUIA_TP[p.f]&&p.st!=='ok'&&!guiaPeds2(p);});done();
  L.forEach(function(x){if(x.pg)n.pg++;else n.ap++;n.pd+=x.ab.length;});n.pd+=sem.length;B2.push([e,L,sem]);});
 h+='<div class="gsm"><div><b>'+n.ap+'</b><span>A pagar</span></div><div><b>'+n.pg+'</b><span>Pagas</span></div><div class="'+(n.pd?'warn':'')+'"><b>'+n.pd+'</b><span>Pedidos do cliente</span></div></div>';
 h+='<div class="chips">'+[['todas','Todas'],['apagar','A pagar'],['pedidos','Com pedido'],['pagas','Pagas']].map(function(c){return '<button type="button" class="chip'+(f===c[0]?' on':'')+'" data-gfs="'+c[0]+'">'+c[1]+'</button>';}).join('')+'</div>';
 h+='<button type="button" class="r solo" data-go="novoguia"><span class="ri">'+IC.up16+'</span><span class="rt"><span class="a">Lançar nova guia</span><span class="b">Carregar o arquivo e os dados da guia de um cliente</span></span><span class="cv">'+IC.chev18+'</span></button>';
 B2.forEach(function(t){var e=t[0],L=t[1].filter(function(x){return f==='apagar'?!x.pg:f==='pedidos'?x.ab.length>0:f==='pagas'?x.pg:true;}),sem=f==='pagas'||f==='apagar'?[]:t[2];B(e.id);var pgh=f==='pagas'||f==='todas'?GU_PG.slice(0,6):[];done();
  if(!L.length&&!sem.length&&!pgh.length)return;
  h+='<section>'+sec(e.fant||e.nome,'<span class="s">'+(L.length+sem.length)+'</span>')+'<div class="card">'+L.map(function(x){return guiaRow(e,x);}).join('')+sem.map(function(p){return pedRow({e:e,p:p});}).join('')+pgh.map(function(g){return '<div class="r"><span class="ri">'+IC.comp+'</span><span class="rt"><span class="a">'+esc(g[0])+'</span><span class="b">'+esc(g[1]+' · R$ '+g[2])+'</span></span>'+pill('ok','Paga em '+esc(g[3]))+'</div>';}).join('')+'</div></section>';});
 if(!B2.some(function(t){return t[1].length||t[2].length;}))h+='<div class="card"><p class="empty">Nenhuma guia lançada para este cliente.</p></div>';
 return h;}
function guiaPeds2(p){var r=false;GU.forEach(function(g){if(guiaPeds(g).indexOf(p)>-1)r=true;});return r;}
function vGuiaC(a){var q=a.split('|'),e=eById(q[0]);if(!e)return null;B(e.id);if(!GU[+q[1]]){done();return null;}var x=guiaInfo(e,+q[1]),g=x.g;B(e.id);
 var h=hdr(g.n,e.fant||e.nome)+'<div class="hero"><div class="hk"><span>Competência '+esc(g.c)+'</span><span class="pill-w">'+(x.pg?'Paga em '+esc(ST.pagas[x.i]):x.venc?'Venceu em '+esc(g.venc):'Vence '+esc(g.venc))+'</span></div><p class="amt">R$ '+esc(g.v)+'</p></div>';
 h+='<section>'+sec('Situação')+'<div class="rs"><div class="rv"><span>Pagamento</span><span>'+(x.pg?'Cliente marcou como paga em '+esc(ST.pagas[x.i])+(x.cp.length?', com comprovante em Recibos':', sem comprovante'):x.venc?'Vencida, ainda sem pagamento':'A pagar até '+esc(g.venc))+'</span></div><div class="rv"><span>Parcelamento</span><span>'+gst(x,'parcelar')+'</span></div><div class="rv"><span>Recálculo</span><span>'+gst(x,'recalculo')+'</span></div><div class="rv"><span>Dúvida</span><span>'+gst(x,'duvida')+'</span></div><div class="rv"><span>2ª via</span><span>'+gst(x,'via2')+'</span></div></div>'+(x.pg?'<p class="foot">Guia paga: o cliente não consegue pedir recálculo nem parcelamento até desmarcar como paga.</p>':'')+'</section>';
 if(x.ar)h+='<section>'+sec('Guia enviada')+'<div class="card">'+docRow(e,x.ar)+'</div></section>';
 if(x.cp.length)h+='<section>'+sec('Comprovantes do cliente')+'<div class="card">'+x.cp.map(function(c){return docRow(e,c);}).join('')+'</div><p class="foot">Ao conferir o comprovante, a guia sai de "A pagar" no app do cliente.</p></section>';
 if(x.pd.length)h+='<section>'+sec('Pedidos do cliente sobre esta guia','<span class="s">'+x.pd.length+'</span>')+'<div class="card">'+x.pd.map(function(p){return pedRow({e:e,p:p});}).join('')+'</div></section>';
 h+='<div class="fbar"><button type="button" class="cta ghost" data-go="chat-'+e.id+'">'+IC.chat+' Chamar o cliente</button></div>';done();return h;}
function gst(x,f){var L=x.pd.filter(function(p){return p.f===f;});if(!L.length)return 'Não pedido';var p=L[L.length-1];return p.st==='ok'?'Concluído · '+esc(p.data):'Pedido em aberto · '+esc(p.data);}
(function(){var st=document.createElement('style');st.textContent='.r .dlr{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:17px;background:var(--tint);color:var(--accent);margin-left:auto}.r .dlr+.pill{margin-left:0}.r .dlr svg{width:16px;height:16px}.gpl{display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:auto}.gsm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border-radius:16px;overflow:hidden;margin:0 0 12px}.gsm>div{display:flex;flex-direction:column;gap:2px;padding:10px 12px;background:var(--card)}.gsm b{font-size:20px}.gsm span{font-size:12px;color:var(--muted)}.gsm .warn b{color:var(--warnc,#b4541a)}.rcob{display:flex;align-items:center;gap:12px}.rcob .mon{flex:1;min-width:0}.rck{display:inline-flex;align-items:center;gap:8px;font-weight:600;white-space:nowrap;cursor:pointer}.rsheet .rck input[type=checkbox]{-webkit-appearance:checkbox;appearance:auto;width:22px;height:22px;min-height:0;margin:0;padding:0;border:0;border-radius:4px;background:none;box-shadow:none;accent-color:var(--a2,var(--accent));flex:none}.rcob .mon input:disabled{opacity:.45}.rcbk{display:flex;align-items:center;gap:6px;margin:10px 0 0}.rsheet .form{display:flex;flex-direction:column;gap:12px}';document.head.appendChild(st);})();
(function(){var st=document.createElement('style');st.textContent='.faccw{display:flex;flex-direction:column;gap:8px}.facc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden}.facc summary{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;list-style:none}.facc summary::-webkit-details-marker{display:none}.facc .rt{flex:1;min-width:0}.facc .fchev{display:flex;transition:transform .2s;opacity:.6}.facc[open] .fchev{transform:rotate(180deg)}.facc .fbody{padding:0 16px 14px;border-top:1px solid var(--line)}.t.ti{height:104px;padding:16px;border-radius:18px;justify-content:space-between;gap:0}.t.ti .trow{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;width:100%}.t.ti .tl{line-height:1.2;text-align:left}';document.head.appendChild(st);})();
/* ===== lançamentos recorrentes da folha (fixos todo mês) ===== */
/* ===== recorrência: descontos e pedidos que se repetem, de colaboradores e sócios dos clientes ===== */
/* [lançamento, sinal (+ provento / − desconto), para quem (c colaborador, s sócio, cs os dois)] */
var REC_TIPOS=[['Adiantamento salarial','-','c'],['Adiantamento quinzenal','-','c'],['Vale-transporte (desconto)','-','c'],['Convênio médico (plano de saúde)','-','cs'],['Coparticipação do convênio médico','-','cs'],['Plano odontológico','-','cs'],['Convênio farmácia','-','cs'],['Empréstimo consignado','-','c'],['Empréstimo','-','cs'],['Pensão alimentícia','-','cs'],['Contribuição sindical','-','c'],['Mensalidade sindical ou assistencial','-','c'],['Vale-refeição / alimentação (desconto)','-','c'],['Cesta básica (desconto)','-','c'],['Seguro de vida','-','cs'],['Previdência privada','-','cs'],['Academia e bem-estar','-','cs'],['Compras em convênio com a empresa','-','c'],['Adiantamento de pró-labore','-','s'],
 ['Pró-labore','+','s'],['Divisão de lucros','+','s'],['Antecipação de lucros','+','s'],['Insalubridade','+','c'],['Periculosidade','+','c'],['Adicional noturno fixo','+','c'],['Gratificação fixa','+','c'],['Comissão fixa','+','c'],['Ajuda de custo','+','c'],['Quebra de caixa','+','c'],['Auxílio-creche','+','c'],['Auxílio-educação','+','c'],['Auxílio home office','+','c'],['Outro provento','+','cs'],['Outro desconto','-','cs']];
/* nomes usados antes, que continuam valendo nos lançamentos já salvos */
var REC_ANT={'Plano de saúde':'-','Pensão alimentícia':'-','Empréstimo consignado':'-','Seguro de vida':'-','Contribuição sindical':'-','Adiantamento quinzenal':'-'};
var REC_FREQ=[['Mensal','Mensal'],['Quinzenal','Quinzenal'],['Trimestral','Trimestral'],['Semestral','Semestral'],['Anual','Anual']];
function recSinal(t){var x=REC_TIPOS.filter(function(r){return r[0]===t;})[0];return x?x[1]:REC_ANT[t]||'+';}
function recAl(r){return r.al==='s'?'s':'c';}
/* parcela do mês: {n:parcela atual, t:total, fim:true se já terminou, ini:true se ainda não começou} */
function recParc(r,c){c=c||compOf();var a=cParse(r.ini||''),b=cParse(c);if(a.m<0||!a.y)return {n:0,t:+r.parc||0};var k=(b.y*12+b.m)-(a.y*12+a.m),st={Trimestral:3,Semestral:6,Anual:12}[r.freq]||1,n=k<0?0:Math.floor(k/st)+1,t=+r.parc||0;return {n:n,t:t,fim:!!t&&n>t,ini:k<0};}
function recAtivo(r,c){var p=recParc(r,c);return !p.fim&&!p.ini;}
function recVT(n){var L=ST.ped.filter(function(p){return p.f==='vt'&&p.st!=='rec'&&dvP(p,/^funcion/i)===n||(p.f==='vt'&&p.quem===n);});var last=null;L.forEach(function(p){if(!last)last=p;});if(!last)return null;var op=dvP(last,/fazer|^op/i);if(/cancel/i.test(op))return null;var v=dvP(last,/valor/i),l=dvP(last,/linha/i);return v?{v:v,l:l,data:last.data}:null;}
function recLista(e){B(e.id);var R={soc:[],col:[]};
 SOCIOS.forEach(function(s){var d=SOCD[s]||{},it=(ST.rec||[]).filter(function(r){return r.quem===s&&recAl(r)==='s';});R.soc.push({n:s,p:d.p,pl:d.pl&&d.pl!=='—'?d.pl:'',it:it});});
 FUNC.forEach(function(n){var d=FUNCD[n]||{};if(d.dem)return;var it=(ST.rec||[]).filter(function(r){return r.quem===n&&recAl(r)==='c';}),vt=recVT(n);R.col.push({n:n,sal:d.sal,jor:d.jor,c:d.c,vt:vt,it:it});});done();return R;}
function recCss(){return '<style>.rcz-p{display:block;padding:12px 0;border-top:1px solid var(--line)}.rcz-p:first-child{border-top:0}.rcz-p .rcz-h{display:flex;align-items:center;gap:10px}.rcz-p .rcz-h .ri{font-weight:700;font-size:13px}.rcz-p .rcz-h .rt{flex:1;min-width:0}'+
 '.rcz-l{display:flex;align-items:center;gap:8px;margin:8px 0 0;padding:8px 4px 8px 10px;border-radius:12px;background:var(--ground);font-size:12.5px}.rcz-l .rcz-s{flex:none;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}.rcz-l .rcz-s.m{background:var(--warnBg);color:var(--warn)}.rcz-l .rcz-s.p{background:var(--okBg);color:var(--okc)}'+
 '.rcz-l .rcz-n{flex:1;min-width:0;display:flex;flex-direction:column}.rcz-l .rcz-n b{font-weight:700;overflow-wrap:anywhere}.rcz-l .rcz-n i{font-style:normal;color:var(--muted);font-size:11.5px}.rcz-l .rcz-v{flex:none;font-weight:700;white-space:nowrap}.rcz-l .vx{flex:none;width:28px;height:28px;border:0;border-radius:50%;background:transparent;color:var(--muted);display:inline-flex;align-items:center;justify-content:center}.rcz-l .vx svg{width:14px;height:14px}.rcz-l.fim{opacity:.55}.rcz-l .rcz-t{align-self:flex-start;font-size:10.5px;font-weight:700;color:var(--accent);background:var(--tint);border-radius:6px;padding:1px 6px;margin:2px 0}'+
 '.rcz-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border-radius:16px;overflow:hidden;margin:0 0 6px}.rcz-sum>div{background:var(--card);padding:10px 12px;display:flex;flex-direction:column;gap:2px;min-width:0}.rcz-sum span{font-size:12px;color:var(--muted)}.rcz-sum b{font-size:14px}.rcz-sum .m b{color:var(--warn)}.rcz-sum .p b{color:var(--okc)}'+
 '.rcz-e{display:flex;align-items:center;gap:8px}.rcz-a{margin-left:auto}.rcz-0{margin:6px 0 0;font-size:12px;color:var(--muted)}</style>';}
function recLinha(e,r,c){var sg=recSinal(r.tipo),p=recParc(r,c),info=[r.freq&&r.freq!=='Mensal'?r.freq:'Mensal',p.t?(p.fim?'terminou':p.ini?'começa em '+cMes(r.ini):'parcela '+Math.max(p.n,1)+' de '+p.t):r.ini?'desde '+cMes(r.ini):'',r.desc||''].filter(Boolean).join(' · ');
 return '<div class="rcz-l'+(p.fim?' fim':'')+'"><span class="rcz-s '+(sg==='-'?'m':'p')+'" aria-label="'+(sg==='-'?'Desconto':'Provento')+'">'+(sg==='-'?'−':'+')+'</span><span class="rcz-n"><b>'+esc(r.tipo)+'</b><i>'+esc(info)+'</i></span><span class="rcz-v">R$ '+esc(r.valor)+'</span><button type="button" class="vx" data-recdel="'+e.id+'|'+r.id+'" aria-label="Tirar '+esc(r.tipo)+'">'+IC.x+'</button></div>';}
function recAuto(t,v,info,del){return '<div class="rcz-l"><span class="rcz-s '+(t==='-'?'m':'p')+'">'+(t==='-'?'−':'+')+'</span><span class="rcz-n"><b>'+esc(info[0])+'</b><span class="rcz-t">pedido do cliente</span><i>'+esc(info[1])+'</i></span><span class="rcz-v">'+esc(v)+'</span>'+(del||'<span style="width:28px"></span>')+'</div>';}
function recTot(L,al,c){var m=0,p=0,n=0;L.forEach(function(e){var R=recLista(e);(al==='s'?R.soc:R.col).forEach(function(x){if(al==='s'&&x.pl){p+=money(x.pl);n++;}x.it.forEach(function(r){if(!recAtivo(r,c))return;n++;if(recSinal(r.tipo)==='-')m+=money(r.valor);else p+=money(r.valor);});if(x.vt)n++;});});return {m:m,p:p,n:n};}
function vRec(a){var q=String(a||'').split('|'),f=q[0]||UI.recEmp||'all';if(f!=='all'&&!eById(f))f='all';if(q[1]==='col'||q[1]==='soc')UI.recT=q[1];var T=UI.recT==='soc'?'soc':'col',c=compOf(),L=f==='all'?emps('all'):[eById(f)];
 UI.recEmp=f;var nC=0,nS=0;L.forEach(function(e){B(e.id);nC+=FUNC.filter(function(n){return !(FUNCD[n]||{}).dem;}).length;nS+=SOCIOS.length;});done();
 var h=recCss()+pedSelCss()+hdr('Recorrência','Descontos e pedidos que se repetem todo mês')+empSel('rec',f,1,'Cliente');
 h+='<div class="pfsel" role="tablist" aria-label="Recorrência de">'+[['col','Colaboradores',IC.people,nC],['soc','Sócios',IC.pro||IC.user,nS]].map(function(x){return '<button type="button" class="pfb'+(T===x[0]?' on':'')+'" role="tab" aria-selected="'+(T===x[0])+'" data-rct="'+x[0]+'"><span class="pfi">'+x[2]+'</span>'+x[1]+'<b>'+x[3]+'</b></button>';}).join('')+'</div><div class="gap"></div>';
 var tt=recTot(L,T==='soc'?'s':'c',c);
 h+='<div class="rcz-sum"><div><span>Lançamentos ativos</span><b>'+tt.n+'</b></div><div class="m"><span>Descontos no mês</span><b>'+nfMoeda(tt.m)+'</b></div><div class="p"><span>'+(T==='soc'?'Retiradas no mês':'Proventos no mês')+'</span><b>'+nfMoeda(tt.p)+'</b></div></div>';
 h+='<p class="foot" style="margin-top:4px">'+(T==='soc'?'Pró-labore, divisão de lucros, convênios e descontos dos sócios de '+esc(cMes(c))+'. O pró-labore vem dos pedidos do cliente e também pode ser lançado aqui.':'Adiantamentos, vale-transporte, convênio médico, farmácia, empréstimos e os demais lançamentos fixos de '+esc(cMes(c))+'. Aparecem na folha de cada colaborador.')+'</p>';
 L.forEach(function(e){var R=recLista(e),P=T==='soc'?R.soc:R.col;
  h+='<section><div class="sec"><h2 class="rcz-e">'+esw(e,1)+' '+esc(e.fant||e.nome)+'</h2><button type="button" class="lnk rcz-a" data-go="recnovo-'+e.id+'|'+T+'">Adicionar</button></div><div class="card">';
  h+=P.map(function(x){var ini=x.n.split(' ').map(function(w){return w[0];}).slice(0,2).join(''),au='';
   if(T==='soc'&&x.pl)au+=recAuto('+','R$ '+x.pl,['Pró-labore','Mensal · '+(x.p||'—')+' do capital'],'<button type="button" class="vx" data-recpl="'+e.id+'|'+esc(x.n)+'" aria-label="Tirar o pró-labore">'+IC.x+'</button>');
   if(T==='col'&&x.vt)au+=recAuto('-','R$ '+x.vt.v+'/dia',['Vale-transporte',(x.vt.l||'Trajeto informado')+' · até 6% do salário']);
   var it=x.it.map(function(r){return recLinha(e,r,c);}).join('');
   return '<div class="rcz-p"><div class="rcz-h"><span class="ri">'+esc(ini)+'</span><span class="rt"><span class="a">'+esc(x.n)+'</span><span class="b">'+esc(T==='soc'?(x.p||'—')+' do capital':(x.c?x.c+' · ':'')+'Salário R$ '+(x.sal||'—'))+'</span></span></div>'+au+it+(!au&&!it?'<p class="rcz-0">Sem lançamentos recorrentes.</p>':'')+'</div>';}).join('')||'<p class="empty">'+(T==='soc'?'Nenhum sócio cadastrado.':'Nenhum colaborador ativo.')+'</p>';
  h+='</div></section>';});
 return h+'<p class="foot">Com número de parcelas, o lançamento sai sozinho depois da última. Os itens marcados como pedido do cliente vêm dos pedidos de vale-transporte e pró-labore.</p>';}
function vRecNovo(a){var q=String(a||'').split('|'),e=eById(q[0]);if(!e)return null;var T=q[1]==='soc'?'soc':q[1]==='col'?'col':(UI.recT==='soc'?'soc':'col'),al=T==='soc'?'s':'c';B(e.id);var ps=T==='soc'?SOCIOS.slice():FUNC.filter(function(n){return !(FUNCD[n]||{}).dem;});done();
 var tl=REC_TIPOS.filter(function(r){return r[2].indexOf(al)>-1;}),t0=V('rc-t')||fv('rc-t',T==='soc'?'Pró-labore':'Adiantamento salarial'),pl=T==='soc'&&t0==='Pró-labore';
 return hdr(T==='soc'?'Recorrência de sócio':'Recorrência de colaborador',e.fant||e.nome)+'<div class="form">'+pickF('rc-q',T==='soc'?'Sócio':'Colaborador',ps.map(function(n){return [n,n];}),ps[0]||'')+pickF('rc-t','Lançamento',tl.map(function(r){return [r[0],(r[1]==='-'?'Desconto · ':(T==='soc'?'Retirada · ':'Provento · '))+r[0]];}),t0)+
  '<div class="fld"><label class="fl" for="rc-v">'+(t0==='Vale-transporte (desconto)'?'Valor do desconto no mês':'Valor')+'</label><div class="mon"><span>R$</span><input id="rc-v" inputmode="numeric" placeholder="0,00" data-money></div></div>'+
  (pl?'<p class="fh">O pró-labore fica na ficha do sócio e aparece todo mês, como o que vem dos pedidos do cliente.</p>':pickF('rc-f','Frequência',REC_FREQ,'Mensal')+mesF('rc-i','Começa em',compOf())+
  '<div class="fld"><label class="fl" for="rc-n">Número de parcelas <i>(opcional)</i></label><input id="rc-n" inputmode="numeric" placeholder="Deixe vazio se não tiver fim" autocomplete="off"></div>')+
  txt('rc-d','Observação',t0.indexOf('Convênio médico')===0?'Ex.: titular + 1 dependente':/Empréstimo/.test(t0)?'Ex.: banco e contrato':'Ex.: combinado com o cliente','',1)+'<span class="fe" id="rc-err" hidden></span></div><div class="fbar"><button type="button" class="cta" data-recsave="'+e.id+'|'+T+'">Salvar recorrência</button></div>';}
/* ===== equipe do escritório ===== */
function eqNome(id){var u=(MULTI.equipe||[]).filter(function(x){return x.id===id;})[0];return u?u.n:'';}
function EU(){return (MULTI.equipe||[]).filter(function(x){return x.id===MULTI.eu;})[0]||null;}
function EV(){var u=EU();if(!u)return MULTI.emps;var L=MULTI.emps.filter(function(e){return e.resp===u.id;});return L.length?L:MULTI.emps;}
/* ===== lançado no sistema e checklist do mês ===== */
function lancOk(g,c){return !!((ST&&ST.lanc)||{})[g+'|'+c];}
function gOfPed(p){var m={extrato:'extratos',despesas:'despesas',notas:'notas',folha:'folha',variaveis:'folha'}[p.f];if(!m)return null;var c=dvP(p,/^compet|^m[eê]s/i);if(!c||cParse(c).m<0)return null;return [m,c];}
function vChk(a){var q=String(a||'').split('|'),e=eById(q[0]),c=q[1];if(!e||!c)return null;B(e.id);
 var gu=GU.filter(function(g){return String(g.c||'').toLowerCase()===String(curto(c)).toLowerCase()||String(g.c||'').toLowerCase()===(MESC2[cParse(c).m]+'/'+cParse(c).y).toLowerCase();}),fs=folhasOf().filter(function(f){return f.comp===c;}),fc=fs.filter(function(f){return fst(f)==='fechada';}).length;
 var rows=GRP.map(function(g){var x=celSt(g[0],c);return [g[0],g[1],x.t+' · '+x.det,x.f!=='futuro'];}).concat([['guias','Guias de impostos',gu.length?gu.length+(gu.length===1?' guia lançada':' guias lançadas'):'Nenhuma guia lançada para o mês',true],['holerites','Holerites',fs.length?fc+' de '+fs.length+' folhas fechadas':'Sem folhas no mês',true]]);
 var ok=rows.filter(function(r){return lancOk(r[0],c);}).length;
 var h=hdr('Checklist de '+cMes(c),e.fant||e.nome)+'<div class="hero"><div class="hk"><span>'+esc(e.fant||e.nome)+'</span><span class="pill-w">'+ok+' de '+rows.length+'</span></div><p class="ht">'+(ok===rows.length?'Mês fechado no sistema.':'Marque cada item quando já estiver lançado no sistema contábil.')+'</p></div>';
 h+='<div class="card">'+rows.map(function(r){var on=lancOk(r[0],c);return '<button type="button" class="r tgl" role="switch" aria-checked="'+(on?'true':'false')+'" data-lanc="'+e.id+'|'+r[0]+'|'+c+'"><span class="rt"><span class="a">'+r[1]+'</span><span class="b">'+esc(on?'Lançado no sistema em '+((ST.lanc||{})[r[0]+'|'+c]):r[2])+'</span></span><span class="sw2" aria-hidden="true"></span></button>';}).join('')+'</div><p class="foot">“Lançado no sistema” é só para o escritório: aparece no Fechamento do mês, o cliente não vê.</p>';
 done();return h;}
/* ===== indicadores e alertas do fechamento ===== */
function painelInd(c){var n=NOW(),M=[-1,-2,-3].map(function(k){return cName(n.getFullYear(),n.getMonth()+k);}),L=emps('all').map(function(e){B(e.id);var v=0;M.forEach(function(m){GRP.forEach(function(g){if(celSt(g[0],m).f==='venc')v++;});});var cur=GRP.filter(function(g){return celSt(g[0],c).f==='venc';}).length;return {e:e,v:v,cur:cur,cob:((ST.cob||{})[c])||0};});done();
 var emDia=L.filter(function(x){return !x.cur;}).length,pct=L.length?Math.round(emDia*100/L.length):100,rk=L.filter(function(x){return x.v;}).sort(function(a,b){return b.v-a.v;}).slice(0,3);
 return '<section>'+sec('Indicadores')+'<div class="card pad">'+kv('Clientes em dia em '+cMes(c),pct+'% ('+emDia+' de '+L.length+')')+kv('Envios vencidos nos últimos 3 meses',String(L.reduce(function(t,x){return t+x.v;},0)))+kv('Cobranças enviadas neste mês',String(L.reduce(function(t,x){return t+x.cob;},0)))+'</div>'+(rk.length?'<div class="card" style="margin-top:10px">'+rk.map(function(x){return '<div class="r">'+esw(x.e,1)+'<span class="rt"><span class="a">'+esc(x.e.fant||x.e.nome)+'</span><span class="b">'+x.v+(x.v>1?' envios vencidos':' envio vencido')+' nos últimos 3 meses</span></span></div>';}).join('')+'</div><p class="foot">Clientes que mais atrasam.</p>':'')+'</section>';}
function alertasExtra(){var G=[],V=[];emps('all').forEach(function(e){B(e.id);var hj=dOnly(NOW());GU.forEach(function(g,i){var dt=guiaDt(g);if(dt<hj&&!ST.pagas[i])G.push({e:e,g:g,dt:dt});});validades().forEach(function(v){var dd=valDias(v);if(dd<=30)V.push({e:e,v:v,dd:dd});});});done();
 var h='';if(G.length)h+='<section>'+sec('Guias vencidas sem comprovante','<span class="s">'+G.length+'</span>')+'<div class="card">'+G.map(function(x){return '<div class="r">'+esw(x.e,1)+'<span class="rt"><span class="a">'+esc(x.g.n.split(' · ')[0])+' · '+esc(x.g.c)+' · R$ '+esc(x.g.v)+'</span><span class="b">'+esc(x.e.fant||x.e.nome)+' · venceu '+fmtP(x.dt)+'</span></span>'+pill('bad','Sem comprovante')+'</div>';}).join('')+'</div></section>';
 V.sort(function(a,b){return a.dd-b.dd;});if(V.length)h+='<section>'+sec('Documentos vencendo','<span class="s">'+V.length+'</span>')+'<div class="card">'+V.map(function(x){return '<button type="button" class="r" data-go="cli-'+x.e.id+'">'+esw(x.e,1)+'<span class="rt"><span class="a">'+esc(x.v.desc||x.v.tipo)+'</span><span class="b">'+esc(x.e.fant||x.e.nome)+' · validade '+fmtD(x.v.ate)+'</span></span>'+pill(x.dd<0?'bad':x.dd<=7?'warn':'neutral',x.dd<0?'Vencido':x.dd===0?'Vence hoje':'Faltam '+x.dd+' dias')+'</button>';}).join('')+'</div></section>';
 return h;}
/* ===== ajustes extras: feriados, lembretes, equipe ===== */
function ajExtra(){var c=MULTI.cfg,LL=lembDias(),eq=MULTI.equipe||[];
 var h='<section>'+sec('Feriados da cidade')+'<div class="card pad form">'+txt('fer-cid','Cidade do escritório','Ex.: Sorocaba/SP',c.ferCid||'',1)+'<div class="fld"><label class="fl" for="fer-in">Feriados municipais (dd/mm)</label><input id="fer-in" placeholder="Ex.: 15/08, 20/01" value="'+esc((c.ferMun||[]).map(function(x){var q=x.split('-');return q[1]+'/'+q[0];}).join(', '))+'"></div><button type="button" class="wb" data-fersave>Salvar feriados</button><p class="fh">Entram na contagem de dias úteis da folha e das admissões, junto com os feriados nacionais.</p></div></section>';
 h+='<section>'+sec('Lembretes aos clientes')+'<div class="chips">'+[7,3,1,0].map(function(x){var on=LL.indexOf(x)>-1;return '<button type="button" class="chip'+(on?' on':'')+'" data-lemb="'+x+'" aria-pressed="'+on+'">'+(x?x+(x>1?' dias antes':' dia antes'):'No último dia')+'</button>';}).join('')+'</div><p class="fh">O cliente recebe aviso de prazo nesses dias. Os envios vencidos sempre aparecem.</p></section>';
 h+='<section>'+sec('Equipe do escritório')+'<div class="card">'+(eq.length?eq.map(function(u){var nc=MULTI.emps.filter(function(e){return e.resp===u.id;}).length;return '<div class="r"><span class="av2">'+esc(u.n.split(' ').map(function(x){return x[0];}).join('').slice(0,2))+'</span><span class="rt"><span class="a">'+esc(u.n)+(MULTI.eu===u.id?' · você':'')+'</span><span class="b">'+({todas:'Todas as áreas',dp:'Departamento Pessoal',contabil:'Contábil e fiscal'}[u.area]||'Todas as áreas')+' · '+nc+(nc===1?' cliente':' clientes')+'</span></span><button type="button" class="vx" data-eqdel="'+u.id+'" aria-label="Remover">'+IC.x+'</button></div>';}).join(''):'<p class="empty">Só você no escritório por enquanto.</p>')+'</div>'+
  '<div class="card pad form" style="margin-top:10px">'+txt('eq-n','Nome','Ex.: Bruna (DP)','',0)+pickF('eq-a','Área',[['todas','Todas as áreas'],['dp','Departamento Pessoal'],['contabil','Contábil e fiscal']],'todas')+'<button type="button" class="wb" data-eqadd>Adicionar à equipe</button></div>'+
  (eq.length?'<div class="card pad form" style="margin-top:10px">'+pickF('eq-eu','Você está como',[['','Escritório todo']].concat(eq.map(function(u){return [u.id,u.n];})),MULTI.eu||'')+'<p class="fh">Cada pessoa vê só os clientes em que é responsável (defina na ficha do cliente). Sem clientes definidos, vê todos.</p></div>':'')+'</section>';
 return h;}
/* ===== extras na ficha do cliente: prazo, responsável, validades e histórico ===== */
function cliExtra(e){B(e.id);var vs=validades().slice().sort(function(a,b){return a.ate<b.ate?-1:1;}),eq=MULTI.equipe||[];
 var h='<section>'+sec('Prazos deste cliente')+'<div class="card pad form">'+pickF('cl-pz','Dias a mais em todos os prazos',[0,1,2,3,5,7,10].map(function(d){return [String(d),d?'+'+d+(d===1?' dia':' dias'):'Prazos normais do escritório'];}),String(e.pzExtra||0))+'<p class="fh">Para clientes com mais volume ou rotina diferente. Vale para folha, notas, extratos e despesas.</p></div></section>';
 if(eq.length)h+='<section>'+sec('Responsável no escritório')+'<div class="card pad form">'+pickF('cl-resp','Responsável',[['','Ninguém']].concat(eq.map(function(u){return [u.id,u.n];})),e.resp||'')+'</div></section>';
 h+='<section>'+sec('Documentos com validade')+'<div class="card">'+(vs.map(function(v){var dd=valDias(v);return '<div class="r"><span class="ri">'+(IC.lock12||'')+'</span><span class="rt"><span class="a">'+esc(v.desc||v.tipo)+'</span><span class="b">Validade '+fmtD(v.ate)+'</span></span>'+pill(dd<0?'bad':dd<=30?'warn':'ok',dd<0?'Vencido':dd<=30?'Faltam '+dd+' dias':'Em dia')+'<button type="button" class="vx" data-vldel="'+v.id+'" aria-label="Tirar">'+IC.x+'</button></div>';}).join('')||'<p class="empty">Nenhum documento com validade cadastrado.</p>')+'</div>'+
  '<div class="card pad form" style="margin-top:10px">'+pickF('vl-t','Documento',VAL_TIPOS.map(function(x){return [x,x];}),'Certificado digital A1')+(V('vl-t')==='Outro'?txt('vl-x','Qual documento','Ex.: Licença ambiental','',0):'')+dateF('vl-d','Validade','')+'<button type="button" class="wb" data-vladd>Adicionar validade</button><p class="fh">Você e o cliente são avisados 30 dias antes.</p></div></section>';
 var T=[];ST.ped.forEach(function(p){T.push([p.data||'',p.tipo+(p.quem?' · '+p.quem:''),pst(p)[0]]);});(ST.act||[]).slice(0,15).forEach(function(a){T.push([a[1]||'',a[0],'']);});
 h+='<section>'+sec('Histórico do cliente','<span class="s">'+ST.ped.length+' pedidos</span>')+'<div class="card">'+(T.slice(0,25).map(function(x){return '<div class="r"><span class="rt"><span class="a">'+esc(x[1])+'</span><span class="b">'+esc(x[0])+'</span></span>'+(x[2]?pill('neutral',x[2]):'')+'</div>';}).join('')||'<p class="empty">Nada ainda.</p>')+'</div></section>';
 done();return h;}
/* ===== envio em lote (guias, holerites, documentos) ===== */
var LOTE={f:[],auto:{}};
function loteMatch(nm){var d=nm.replace(/\D/g,''),low=nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');for(var i=0;i<MULTI.emps.length;i++){var e=MULTI.emps[i],cd=String(e.cnpj||'').replace(/\D/g,'');if(cd.length>=8&&(d.indexOf(cd)>-1||d.indexOf(cd.slice(0,8))>-1))return e.id;}
 for(var j=0;j<MULTI.emps.length;j++){var e2=MULTI.emps[j],ws=String((e2.fant||'')+' '+(e2.nome||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(function(w){return w.length>=4&&['ltda','eireli','design','comercio','servicos'].indexOf(w)<0;});if(ws.some(function(w){return low.indexOf(w)>-1;}))return e2.id;}return '';}
function vLote(){var n=NOW(),cat=V('lt-c')||'guias',L=LOTE.f||[];
 var h=hdr('Enviar em lote','Vários arquivos, cada um para o seu cliente')+'<div class="form">'+pickF('lt-c','Pasta',[['guias','Impostos (guias)'],['folha','Folha (holerites)'],['documentos','Documentos'],['contabil','Demonstrativos contábeis'],['certidoes','Certidões negativas']],cat)+mesF('lt-m','Competência',cName(n.getFullYear(),n.getMonth()-1))+fileF('lt-f')+'</div>';
 h=h.replace('id="lt-f"','id="lt-f" multiple');
 if(L.length){h+='<section>'+sec('Arquivos','<span class="s">'+L.length+'</span>')+'<div class="form">'+L.map(function(f,i){var auto=LOTE.auto[i]!=null?LOTE.auto[i]:(LOTE.auto[i]=loteMatch(f));return pickF('lt-'+i,esc(f)+(auto?' · reconhecido':''),[['','Não enviar']].concat(MULTI.emps.map(function(e){return [e.id,e.fant||e.nome];})),auto)+(cat==='guias'&&V('lt-'+i)?'<div class="form" style="padding:0 0 6px 12px;border-left:2px solid var(--line)">'+guiaCampos('lg'+i,guiaVenc()).replace('id="lg'+i+'-t"','id="lg'+i+'-t"')+'</div>':'');}).join('')+'</div><p class="foot">O app reconhece o cliente pelo CNPJ ou pelo nome no nome do arquivo. Confira e troque se precisar.</p></section>';
  var ok=L.filter(function(f,i){return V('lt-'+i);}).length;h+='<div class="fbar"><button type="button" class="cta" data-ltsend'+(ok?'':' disabled')+'>'+IC.up16+' Enviar '+ok+(ok===1?' arquivo':' arquivos')+'</button></div>';}
 else h+='<p class="foot">Escolha vários PDFs de uma vez. Dica: deixe o CNPJ ou o nome do cliente no nome do arquivo, por exemplo “DAS 12345678000190.pdf”, para o app distribuir sozinho.</p>';
 return h;}
function loteEnviar(){var cat=V('lt-c')||'guias',comp=V('lt-m'),L=LOTE.f||[],k=0,por={};
 if(cat==='guias'){var falta=L.filter(function(f,i){return V('lt-'+i)&&(!money(($('lg'+i+'-v')||{}).value)||!V('lg'+i+'-d'));})[0];if(falta){toast('Preencha valor e vencimento de “'+falta+'”');return;}}
 L.forEach(function(f,i){var id=V('lt-'+i);if(!id)return;var e=B(id);var nm=f.replace(/\.[^.]+$/,'');if(cat==='guias')addGuia(V('lg'+i+'-t')||guiaTipo(nm),curto(comp),$('lg'+i+'-v').value,V('lg'+i+'-d'),'',f);else addDoc(cat==='folha'&&!/holerite/i.test(nm)?'Holerite · '+nm:nm,cat,comp,f);por[e.fant||e.nome]=(por[e.fant||e.nome]||0)+1;k++;done();});
 LOTE={f:[],auto:{}};Object.keys(FV).forEach(function(x){if(/^(lt-\d+|lg\d+-[tdv])$/.test(x))delete FV[x];});save();toast(k+(k===1?' arquivo enviado':' arquivos enviados')+' para '+Object.keys(por).length+(Object.keys(por).length===1?' cliente':' clientes'));hist=[];show('arquivo');}
/* ===== fechamento do mês: prazos e envios de todos os clientes ===== */
var GRP=[['folha','Folha','folha'],['notas','Notas fiscais','nf'],['extratos','Extratos','ext'],['despesas','Despesas','desp']];
function celSt(g,c){var n=dOnly(NOW()),pz=prazo(g,c),p=cParse(c),ini=new Date(p.y,p.m+1,1),feito=rotFeito(g,c),lanc=rotLanc(g,c),det='',tot=0;
 if(g==='folha'){var fe=folhaEnc(c),fs=folhasOf().filter(function(f){return f.comp===c;}),env=fs.filter(function(f){var x=fst(f);return x==='enviada'||x==='auto'||x==='fechada';}).length,fc=fs.filter(function(f){return fst(f)==='fechada';}).length;
  det=fe?'Sem variáveis · '+fe.n+(fe.n===1?' colaborador':' colaboradores'):(fs.length?env+' de '+FUNC.length+' enviadas'+(fc?' · '+fc+' fechadas':''):'Nenhuma folha lançada');}
 else if(g==='notas'){var L=cofreOf(c).notas||[];L.forEach(function(x){tot+=x.nf&&x.nf.val||0;});det=L.length?L.length+(L.length===1?' nota':' notas')+(tot?' · '+nfMoeda(tot):''):'Nenhuma nota';}
 else if(g==='extratos'){var E=extrOf(c);det=E.length?E.length+(E.length===1?' extrato':' extratos'):'Nenhum extrato';}
 else{var D=despOf(c).filter(function(x){return !/^Envio de/.test(x.tipo||'');});D.forEach(function(x){tot+=dplVal(String(despDv(x,/^valor/i)).replace(/^R\$\s*/,''));});det=D.length?D.length+(D.length===1?' despesa':' despesas')+(tot?' · '+nfMoeda(tot):''):'Nenhuma despesa';}
 if(n<ini)return {k:'neutral',t:g==='notas'||g==='despesas'?'Mês em curso':'Abre em '+fmtP(ini),det:det,pz:pz,tot:tot,f:'futuro'};
 if(lancOk(g,c))return {k:'ok',t:'Lançado no sistema',det:det,pz:pz,tot:tot,f:'ok'};
 if(feito)return {k:'ok',t:g==='folha'&&folhaEnc(c)?'Sem variáveis':'Recebido',det:det,pz:pz,tot:tot,f:'ok'};
 if(n<=pz){var dd=diasAte(pz);return {k:dd<=1?'bad':dd<=3?'warn':'neutral',t:(lanc?'Lançando':'Aguardando')+' · '+(dd===0?'último dia':'até '+fmtP(pz)),det:det,pz:pz,tot:tot,f:'aberto'};}
 if(lanc&&lancOk(g,c))return {k:'ok',t:'Lançado no sistema',det:det,pz:pz,tot:tot,f:'ok'};
 return lanc?{k:'ok',t:'Recebido (automático)',det:det,pz:pz,tot:tot,f:'ok'}:{k:'bad',t:'Venceu sem envio',det:det,pz:pz,tot:tot,f:'venc'};}
function vFecha(a){var n=NOW(),ops=[-2,-1,0].map(function(k){return cName(n.getFullYear(),n.getMonth()+k);}),c=a&&cParse(a).m>-1?a:ops[1],cf=MULTI.cfg||{},cont={ok:0,aberto:0,venc:0,futuro:0},emT=0,rcT=0,dsT=0;
 var rows=emps('all').map(function(e){B(e.id);var cs=GRP.map(function(g){var x=celSt(g[0],c);cont[x.f]++;return [g,x];});
  (cofreOf(c).notas||[]).forEach(function(x){var v=x.nf&&x.nf.val||0;if(/Emitidas/.test(x.tipo))emT+=v;else rcT+=v;});dsT+=cs[3][1].tot;
  var vb=cs.filter(function(x){return x[1].f==='venc';}).length,ab=cs.filter(function(x){return x[1].f==='aberto';}).length,okk=cs.filter(function(x){return x[1].f==='ok';}).length;
  return '<div class="card fch"><div class="r">'+esw(e)+'<span class="rt"><span class="a">'+esc(e.fant||e.nome)+'</span><span class="b">'+esc(e.reg||'')+' · '+FUNC.length+(FUNC.length===1?' colaborador':' colaboradores')+'</span></span>'+(vb?pill('bad',vb+(vb>1?' vencidos':' vencido')):okk===4?pill('ok','Mês fechado'):pill(ab?'warn':'neutral',ab?ab+' em aberto':'Em curso'))+'</div>'+
   '<div class="fgrid">'+cs.map(function(x){var g=x[0],st=x[1];return '<button type="button" class="fcel '+st.k+'" data-go="'+(g[0]==='despesas'?'desp-'+e.id+'|'+c:'pasta-'+e.id+'|'+g[0])+'"><span class="fl1">'+(IC[g[2]]||'')+' '+g[1]+'</span><span class="fl2">'+esc(st.t)+'</span><span class="fl3">'+esc(st.det)+'</span></button>';}).join('')+'</div><div class="fact">'+(vb||ab?'<button type="button" class="mini" data-cobrar="'+e.id+'|'+c+'">'+(IC.chat||'')+' Cobrar pendências</button>':'')+'<button type="button" class="mini" data-go="chk-'+e.id+'|'+c+'">'+(IC.check16||'')+' Checklist do mês</button></div></div>';}).join('');done();
 var css='<style>.fact{display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--line)}.fch{margin-bottom:12px;overflow:hidden}.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line)}.fcel{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 14px;background:var(--card);border:0;text-align:left;color:var(--ink);font:inherit;cursor:pointer;min-width:0}.fcel .fl1{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}.fcel .fl1 svg{width:15px;height:15px}.fcel .fl2{font-weight:700;font-size:13px}.fcel .fl3{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.fcel.ok .fl2{color:var(--okc,#1a7f4b)}.fcel.bad .fl2{color:var(--badc,#c0392b)}.fcel.warn .fl2{color:var(--warnc,#b4541a)}</style>';
 var h=css+hdr('Fechamento do mês','Prazos e envios de todos os clientes')+'<div class="chips">'+ops.map(function(x){return '<button type="button" class="chip'+(x===c?' on':'')+'" data-go="fecha-'+x+'">'+esc(cap(cMes(x)))+'</button>';}).join('')+'</div>';
 h+='<div class="hero"><div class="hk"><span>'+esc(cap(cMes(c)))+'</span><span class="pill-w">'+(cont.venc?cont.venc+(cont.venc>1?' envios vencidos':' envio vencido'):cont.aberto?cont.aberto+' em aberto':'Tudo recebido')+'</span></div><p class="ht">'+cont.ok+' recebidos, '+cont.aberto+' dentro do prazo e '+cont.venc+' vencidos sem envio, em '+emps('all').length+(emps('all').length===1?' cliente':' clientes')+'.</p></div>';
 h+='<section>'+sec('Regras de prazo')+'<div class="card pad">'+kv('Folhas e variáveis','Até o '+cf.folhaDU+'º dia útil · '+fmtP(prazo('folha',c)))+kv('Notas, extratos e despesas','Até o dia '+cf.docsDia+' · '+fmtP(prazo('notas',c)))+kv('Admissões','Início a partir de '+admDias()+(cf.admTipo==='u'?' dias úteis':' dias')+' do lançamento')+'</div><p class="foot">Mude em Ajustes. Depois do prazo, o que o cliente lançou chega automaticamente.</p></section>';
 h+=painelInd(c)+'<section>'+sec('Por cliente')+rows+'</section>'+alertasExtra();
 h+='<section>'+sec('Gestão contábil · '+cap(cMes(c)))+'<div class="card pad">'+kv('Notas emitidas (vendas)',nfMoeda(emT))+kv('Notas recebidas (compras)',nfMoeda(rcT))+kv('Despesas lançadas',nfMoeda(dsT))+'</div><p class="foot">Somas das notas lidas do XML ou do PDF e das despesas lançadas pelos clientes.</p></section>';
 return h;}
/* despesas lançadas pelo cliente num mês (vão direto, sem status) */
function vDesp(a){var q=String(a||'').split('|'),e=eById(q[0]),c=q[1];if(!e||!c)return null;B(e.id);var L=despOf(c),tot=0,enc=encSt('despesas',c);
 var rows=L.map(function(p){if(/^Envio de/.test(p.tipo||''))return '<div class="r"><span class="ri">'+(IC.lock||'')+'</span><span class="rt"><span class="a">'+esc(p.tipo)+'</span><span class="b">'+esc(p.data)+'</span></span>'+pill('ok','Encerrado')+'</div>';
  var v=despDv(p,/^valor/i),vn=dplVal(String(v).replace(/^R\$\s*/,''));tot+=vn;var o=despDv(p,/^origem/i);
  return '<button type="button" class="r" data-go="ped-'+e.id+'|'+p.id+'"><span class="ri">'+(IC.desp||'')+'</span><span class="rt"><span class="a">'+esc(p.quem||despDv(p,/^descri/i)||'Despesa')+'</span><span class="b">'+esc([despDv(p,/^categoria/i),despDv(p,/^vencimento/i)&&despDv(p,/^vencimento/i)!=='—'?'vence '+despDv(p,/^vencimento/i):'',despDv(p,/^situa/i),o?'planilha':''].filter(Boolean).join(' · '))+(p.ed?' · editada '+esc(p.ed):'')+'</span></span><span class="gv">'+esc(v||'—')+'</span></button>';}).join('');done();
 return hdr('Despesas de '+cMes(c),e.fant||e.nome)+'<div class="card pad">'+kv('Total lançado',nfMoeda(tot))+kv('Envio',enc==='encerrado'?'Encerrado':enc==='aberto'?'Aberto até '+fmtP(prazo('despesas',c))+' · o cliente ainda pode editar':'Ainda não abriu')+'</div><section>'+sec('Lançamentos','<span class="s">'+L.length+'</span>')+'<div class="card">'+(rows||'<p class="empty">Nenhuma despesa lançada neste mês.</p>')+'</div></section>';}
/* ===== gestão contábil: o que o cliente envia em Gestão contábil (notas, extratos, despesas e documentos), por cliente e mês ===== */
var GC={e:'',c:''};
function gcComps(){var n=NOW();return [-2,-1,0].map(function(k){return cName(n.getFullYear(),n.getMonth()+k);});}
/* competência da Gestão contábil: qualquer mês até o atual, escolhido no seletor de competência (o mesmo do app do cliente) */
function gcOk(c){var q=cParse(c),n=NOW();if(q.m<0||!q.y)return false;var k=q.y*12+q.m,h=n.getFullYear()*12+n.getMonth();return k<=h&&k>h-120;}
/* pedidos de liberação de mês encerrado: cada um aparece na área do envio (notas no cofre, extratos, despesas; folha no DP) */
function libPeds(g){return (ST.ped||[]).filter(function(p){return p.f==='libmes'&&p.st!=='ok'&&String(p.lk||'').indexOf(g+'|')===0;});}
function libBloco(e,g,txt){var L=libPeds(g);if(!L.length)return '';return '<div class="sec gcs"><h2>Pedidos de liberação</h2><span class="s">'+L.length+'</span></div><div class="card">'+L.map(function(p){return pedRow({e:e,p:p});}).join('')+'</div><p class="foot">'+txt+' Toque no pedido para liberar o mês por 3, 7 ou 15 dias.</p>';}
function gcEmp(){var e=eById(GC.e)||(UI.fEmp!=='all'&&eById(UI.fEmp))||EV()[0]||MULTI.emps[0];GC.e=e.id;return e;}
function gcPend(){var n=0;EV().forEach(function(e){B(e.id);arqCofre(ST);n+=aConferir().filter(function(a){return ['notas','extratos','despesas'].indexOf(a.cat)>-1;}).length;});done();return n;}
function gcNfArq(n,k){var nome=k==='pdf'?(n.pdf||(nfExt(n.arq)==='pdf'?n.arq:'')):(n.xml||(nfExt(n.arq)==='xml'?n.arq:''));if(!nome)return null;var f=(n.files||[]).filter(function(x){return x.n===nome;})[0]||{};
 return {n:nome,arq:nome,fileId:f.fid||(nome===n.arq?n.fileId:''),ftype:f.ft||(nome===n.arq?n.ftype:'')};}
function gcNota(n,i,st){var nf=n.nf,p=nfParte(n),fP=gcNfArq(n,'pdf'),fX=gcNfArq(n,'xml');
 var sub=nf?[p.l+': '+(p.n||p.d||'—'),nf.dt].filter(Boolean).join(' · '):(n.pend&&n.pend.length?'Lendo a nota…':'Dados não reconhecidos');
 return '<div class="nfc"><div class="nh"><span class="ri">'+IC.nf+'</span><span class="rt"><span class="a">'+esc(nf?nfTitulo(n):n.arq)+'</span><span class="b">'+esc(sub)+'</span><span class="b">Carregada em '+esc(n.data||'—')+(st==='aberto'?' · no cofre':' · recebida')+'</span></span>'+(nf&&nf.val!=null?'<span class="nv">'+nfMoeda(nf.val)+'</span>':'')+'</div>'+
  '<div class="nb">'+(fP?'<button type="button" data-gcnf="'+i+':pdf">'+(IC.down16||'')+' PDF</button>':'')+(fX?'<button type="button" data-gcnf="'+i+':xml">'+(IC.down16||'')+' XML</button>':'')+(!fP&&!fX?'<button type="button" disabled>Sem arquivo</button>':'')+'</div></div>';}
function gcDesp(e,p){var v=despDv(p,/^valor/i),o=despDv(p,/^origem/i),ve=despDv(p,/^vencimento/i);
 return '<button type="button" class="r" data-go="ped-'+e.id+'|'+p.id+'"><span class="ri">'+(IC.desp||'')+'</span><span class="rt"><span class="a">'+esc(p.quem||despDv(p,/^descri/i)||'Despesa')+'</span><span class="b">'+esc([despDv(p,/^categoria/i),ve&&ve!=='—'?'vence '+ve:'',despDv(p,/^situa/i),o?'planilha':''].filter(Boolean).join(' · '))+(p.ed?' · editada '+esc(p.ed):'')+'</span></span><span class="gv">'+esc(v||'—')+'</span></button>';}
function vGestao(a){var q=String(a||'').split('|'),ops=gcComps();if(q[0]&&eById(q[0]))GC.e=q[0];if(q[1]&&gcOk(q[1]))GC.c=q[1];
 var e=gcEmp();B(e.id);arqCofre(ST);var c=gcOk(GC.c)?GC.c:(ops.indexOf(compPad('docs'))>-1?compPad('docs'):ops[1]);GC.c=c;
 var css='<style>.gcg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border-radius:16px;overflow:hidden;margin:0 0 6px}.gcg>div{display:flex;flex-direction:column;gap:2px;padding:10px 12px;background:var(--card);min-width:0}.gcg .gc1{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}.gcg .gc1 svg{width:15px;height:15px}.gcg .gc2{font-weight:700;font-size:13px}.gcg .gc3{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.gcg .ok .gc2{color:var(--okc,#1a7f4b)}.gcg .bad .gc2{color:var(--badc,#c0392b)}.gcg .warn .gc2{color:var(--warnc,#b4541a)}@media (max-width:420px){.gcg{grid-template-columns:1fr}}.sec.gcs{margin-top:16px}</style>';
 var h=css+NF_CSS+hdr('Gestão contábil','O que o cliente envia ao escritório');
 h+='<button type="button" class="empsw empsel" data-gcemp aria-haspopup="dialog" style="margin:0 0 12px">'+esw(e,1)+'<span>Cliente: '+esc(e.fant||e.nome)+'</span>'+IC.chevd+'</button>';
 h+='<button type="button" class="perbtn" data-gcper aria-haspopup="dialog" style="margin:0 0 14px"><span class="pl">Competência</span><b>'+esc(c)+'</b>'+IC.cal+'</button>';
 /* situação dos envios do mês */
 var G=[['notas','Notas fiscais','nf'],['extratos','Extratos','ext'],['despesas','Despesas','desp']],S=G.map(function(g){var x=celSt(g[0],c);if(g[0]==='notas'&&['encerrado','auto'].indexOf(cofreStOf(ST,c))<0){x={k:x.k,t:x.t,det:'Cofre aberto',f:x.f};}return [g,x];}),rec=S.filter(function(x){return x[1].f==='ok';}).length;
 h+='<div class="hero"><div class="hk"><span>Envios de '+esc(cMes(c))+'</span><span class="pill-w">'+rec+' de 3 recebidos</span></div><p class="ht">Notas, extratos e despesas encerram em '+fmtP(prazo('notas',c))+'. Depois do prazo, o que o cliente lançou chega sozinho.</p></div>';
 h+='<div class="gcg">'+S.map(function(x){return '<div class="'+x[1].k+'"><span class="gc1">'+(IC[x[0][2]]||'')+' '+x[0][1]+'</span><span class="gc2">'+esc(x[1].t)+'</span><span class="gc3">'+esc(x[1].det)+'</span></div>';}).join('')+'</div>';
 var OL=[];EV().forEach(function(o){if(o.id===e.id)return;B(o.id);var k=['notas','extratos','despesas'].reduce(function(s0,g){return s0+libPeds(g).length;},0);if(k)OL.push([o,k]);});B(e.id);
 if(OL.length)h+='<div class="card">'+OL.map(function(x){return '<button type="button" class="r" data-go="gestao-'+x[0].id+'">'+esw(x[0],1)+'<span class="rt"><span class="a">'+esc(x[0].fant||x[0].nome)+'</span><span class="b">Pediu para enviar fora do prazo</span></span>'+pill('warn',x[1]+(x[1]>1?' liberações':' liberação'))+'</button>';}).join('')+'</div><div class="gap"></div>';
 /* cofre de notas: só depois de encerrado (pelo cliente ou pelo prazo). Notas avulsas, enviadas em Documentos, aparecem na hora */
 var cf=(ST.cofre||{})[c]||{notas:[]},cst=cofreStOf(ST,c),fech=cst==='encerrado'||cst==='auto',ns=fech?(cf.notas||[]):[],all=ns.map(function(n,i){return {n:n,i:i};}),em=all.filter(function(x){return /Emitidas/.test(x.n.tipo);}),rc=all.filter(function(x){return !/Emitidas/.test(x.n.tipo);});
 var tv=function(L){var t=L.reduce(function(s,x){return s+(x.n.nf&&x.n.nf.val||0);},0);return t?' · '+nfMoeda(t):'';},AV=arqList().filter(function(x){return (x.cat==='notas'||x.cat==='notasexp')&&x.or==='cli'&&x.comp===c&&x.ped;});
 h+='<section>'+sec('Cofre de notas','<span class="s">'+(fech?ns.length:'Aberto')+'</span>')+libBloco(e,'notas','O cliente pediu para carregar notas no cofre de um mês encerrado.');
 if(!fech)h+='<div class="card"><p class="empty">'+(cst==='futuro'?'O cofre de '+esc(cMes(c))+' ainda não abriu.':'O cofre de '+esc(cMes(c))+' está aberto. As notas chegam aqui quando o cliente encerrar ou em '+fmtP(prazo('notas',c))+'.')+'</p></div>';
 else{h+='<p class="foot" style="margin-top:0">'+(cst==='encerrado'?'Encerrado pelo cliente'+(cf.em?' em '+esc(cf.em):''):'Encerrado automaticamente em '+fmtP(prazo('notas',c)))+'. As notas também estão no arquivo, em Notas fiscais.</p>';
  if(!ns.length)h+='<div class="card"><p class="empty">Nenhuma nota no cofre de '+esc(cMes(c))+'.</p></div>';}
 if(em.length)h+='<div class="sec gcs"><h2>Emitidas (vendas)</h2><span class="s">'+em.length+tv(em)+'</span></div><div class="card">'+em.map(function(x){return gcNota(x.n,x.i,cst);}).join('')+'</div>';
 if(rc.length)h+='<div class="sec gcs"><h2>Recebidas (compras)</h2><span class="s">'+rc.length+tv(rc)+'</span></div><div class="card">'+rc.map(function(x){return gcNota(x.n,x.i,cst);}).join('')+'</div>';
 if(AV.length)h+='<div class="sec gcs"><h2>Notas avulsas</h2><span class="s">'+AV.length+'</span></div><div class="card">'+AV.map(function(x){return docRow(e,x);}).join('')+'</div><p class="foot">Enviadas pelo cliente em Documentos, fora do cofre.</p>';
 h+='</section>';
 /* extratos */
 var EX=arqList().filter(function(x){return x.cat==='extratos'&&x.comp===c&&x.or==='cli';}),exC=EX.filter(function(x){return !arqDireto(x)&&(x.st==='enviado'||x.st==='analise');}).length;
 h+='<section>'+sec('Extratos bancários','<span class="s">'+EX.length+(exC?' · '+exC+' para conferir':'')+'</span>')+libBloco(e,'extratos','O cliente pediu para enviar extratos de um mês encerrado.')+'<div class="card">'+(EX.map(function(x){return docRow(e,x);}).join('')||'<p class="empty">Nenhum extrato enviado em '+esc(cMes(c))+'.</p>')+'</div></section>';
 /* despesas e planilha */
 var D=despOf(c).filter(function(p){return !/^Envio de/.test(p.tipo||'');}),tot=0,pl=0,ids={};D.forEach(function(p){tot+=dplVal(String(despDv(p,/^valor/i)).replace(/^R\$\s*/,''));if(despDv(p,/^origem/i))pl++;ids[p.id]=1;});
 var CP=arqList().filter(function(x){return x.cat==='despesas'&&x.or==='cli'&&ids[x.ped];}),encD=encSt('despesas',c);
 h+='<section>'+sec('Despesas','<span class="s">'+D.length+(tot?' · '+nfMoeda(tot):'')+'</span>')+libBloco(e,'despesas','O cliente pediu para lançar despesas de um mês encerrado.')+(libPeds('despesas').length?'<div class="gap"></div>':'')+'<div class="card pad">'+kv('Lançadas',String(D.length)+(pl?' ('+pl+' pela planilha)':''))+kv('Envio',encD==='encerrado'?'Encerrado pelo cliente':encD==='auto'?'Encerrado no prazo':encD==='aberto'?'Aberto até '+fmtP(prazo('despesas',c))+' · o cliente ainda pode editar':'Ainda não abriu')+'</div>';
 h+='<div class="gap"></div><div class="card">'+(D.map(function(p){return gcDesp(e,p);}).join('')||'<p class="empty">Nenhuma despesa lançada em '+esc(cMes(c))+'.</p>')+'</div>';
 if(CP.length)h+='<div class="sec gcs"><h2>Comprovantes</h2><span class="s">'+CP.length+'</span></div><div class="card">'+CP.map(function(x){return docRow(e,x);}).join('')+'</div>';
 h+='</section>';
 /* documentos solicitados */
 var DP=(ST.docsPed||[]).slice().reverse(),SA=arqList().filter(function(x){return x.or==='cli'&&ST.ped.some(function(p){return p.f==='solicitado'&&p.id===x.ped;});});
 h+='<section>'+sec('Documentos solicitados','<button type="button" class="lnk" data-go="novoped-'+e.id+'">Pedir documento</button>')+'<div class="card">'+(DP.map(function(x){var ok=pedFeito(x),lim=pedLim(x),dd=diasAte(lim);return '<div class="r"><span class="ri">'+(IC.req||IC.doc)+'</span><span class="rt"><span class="a">'+esc(pedNome(x))+'</span><span class="b">'+(ok?'Enviado'+(x.em?' em '+esc(x.em):'')+(x.arq?' · '+esc(x.arq):''):'Prazo '+fmtP(lim))+'</span></span>'+(ok?pill('ok','Enviado'):pill(dd<0?'bad':dd<=3?'warn':'neutral',dd<0?'Atrasado':'Aguardando'))+'</div>';}).join('')||'<p class="empty">Nenhum documento pedido a este cliente.</p>')+'</div>';
 if(SA.length)h+='<div class="gap"></div><div class="card">'+SA.map(function(x){return docRow(e,x);}).join('')+'</div>';
 h+='</section>';
 /* do escritório */
 var CT=arqList().filter(function(x){return x.or==='ct'&&x.cat==='contabil';}).slice(0,6);
 h+='<section>'+sec('Enviados por você','<button type="button" class="lnk" data-go="novodoc-'+e.id+'|contabil">Enviar</button>')+'<div class="card">'+(CT.map(function(x){return docRow(e,x);}).join('')||'<p class="empty">Nenhum demonstrativo contábil enviado.</p>')+'</div></section>';
 h+='<button type="button" class="r solo" data-go="chk-'+e.id+'|'+c+'"><span class="ri">'+(IC.check16||'')+'</span><span class="rt"><span class="a">Checklist de '+esc(cMes(c))+'</span><span class="b">Marque o que já foi lançado no sistema. O cliente não vê.</span></span><span class="cv">'+IC.chev18+'</span></button>';
 done();return h;}
/* ===== departamento pessoal de todos os clientes ===== */
function vDP(){var A=[],C=[],F=[],P=[],X=[],S=[],SV=[],LF=[],FO=0,EA=0,tot=0;
 emps().forEach(function(e){B(e.id);tot+=FUNC.length;FO+=folhasFechar().length;
  ST.ped.forEach(function(p){if(p.st==='ok')return;var x={e:e,p:p};if(p.f==='admissao')A.push(x);else if(p.f==='cadfunc')C.push(x);else if(p.f==='ferias')P.push(x);else if(['demissao','afastamento','medida','salario','cargo','jornada','turno','dependente','vt'].indexOf(p.f)>-1)X.push(x);else if(SOC_F.indexOf(p.f)>-1)S.push(x);else if(p.f==='folha'&&/sem variáveis/i.test(p.tipo||''))SV.push(x);else if(p.f==='libmes'&&/^folha\|/.test(p.lk||''))LF.push(x);});
  FUNC.forEach(function(nm){var d=FUNCD[nm]||{};if(d.adm==='Em admissão')EA++;var fe=ferEstado(nm);if(!fe)return;var dd=diasAte(fe.lim);if(dd<=60)F.push({e:e,nm:nm,dd:dd,lim:fe.lim});});});done();
 F.sort(function(a,b){return a.dd-b.dd;});
 var CL=[],SC=[];emps().forEach(function(e){B(e.id);Object.keys(FUNCD||{}).forEach(function(nm){CL.push({e:e,nm:nm,d:FUNCD[nm]});});Object.keys(SOCD||{}).forEach(function(nm){SC.push({e:e,nm:nm,d:SOCD[nm]||{}});});});done();
 var ord=function(x){return x.d.dem?2:x.d.adm==='Em admissão'?0:1;};CL.sort(function(a,b){return ord(a)-ord(b)||a.nm.localeCompare(b.nm);});
 var lst=function(t,L,vazio,extra){return '<section>'+sec(t,'<span class="s">'+L.length+'</span>')+'<div class="card">'+(L.map(pedRow).join('')||'<p class="empty">'+vazio+'</p>')+'</div>'+(extra||'')+'</section>';};
 var h=hdr('Departamento Pessoal','Colaboradores e solicitações dos clientes')+empChips('femp',UI.fEmp,1);
 h+='<div class="hero"><div class="hk"><span>DP</span><span class="pill-w">'+tot+(tot===1?' colaborador':' colaboradores')+'</span></div><p class="ht">'+[A.length?A.length+(A.length===1?' admissão para gerar contrato':' admissões para gerar contrato'):'',F.filter(function(x){return x.dd<=30;}).length?F.filter(function(x){return x.dd<=30;}).length+' férias vencendo em até 30 dias':'',FO?FO+(FO===1?' folha para fechar':' folhas para fechar'):'',C.length?C.length+(C.length===1?' atualização cadastral':' atualizações cadastrais'):'',S.length?S.length+(S.length===1?' pedido de sócio':' pedidos de sócios'):'',SV.length?SV.length+(SV.length===1?' folha encerrada sem variáveis':' folhas encerradas sem variáveis'):'',LF.length?LF.length+(LF.length===1?' pedido de liberação da folha':' pedidos de liberação da folha'):''].filter(Boolean).join(', ').replace(/^$/,'Nada pendente no DP')+'.</p></div>';
 var nEmp=function(L){var o={};L.forEach(function(x){o[x.e.id]=1;});return Object.keys(o).length;},cnt=function(L,f){return L.filter(f).length;};
 h+=dpBloco('col','Colaboradores dos clientes',CL,colabRow,'Nenhum colaborador cadastrado.','Toque num colaborador para ver a ficha completa e o histórico de solicitações.',
  [cnt(CL,function(x){return !x.d.dem&&x.d.adm!=='Em admissão';})+' ativos',cnt(CL,function(x){return x.d.adm==='Em admissão'&&!x.d.dem;})?cnt(CL,function(x){return x.d.adm==='Em admissão'&&!x.d.dem;})+' em admissão':'',cnt(CL,function(x){return x.d.dem;})?cnt(CL,function(x){return x.d.dem;})+(cnt(CL,function(x){return x.d.dem;})===1?' desligado':' desligados'):''].filter(Boolean).join(' · ')+' · '+nEmp(CL)+(nEmp(CL)===1?' cliente':' clientes'));
 h+=dpBloco('soc','Sócios dos clientes',SC,socioRow,'Nenhum sócio cadastrado.','Toque num sócio para ver os dados e o histórico de pedidos.',
  cnt(SC,function(x){return x.d.pl&&x.d.pl!=='—';})+' com pró-labore · '+nEmp(SC)+(nEmp(SC)===1?' cliente':' clientes'));
 var RC=0,RS=0;emps().forEach(function(e){B(e.id);(ST.rec||[]).forEach(function(r){if(!recAtivo(r))return;if(recAl(r)==='s')RS++;else RC++;});SOCIOS.forEach(function(sn){if((SOCD[sn]||{}).pl&&SOCD[sn].pl!=='—')RS++;});FUNC.forEach(function(fn){if(!(FUNCD[fn]||{}).dem&&recVT(fn))RC++;});});done();
 h+='<section>'+sec('Recorrência','<button type="button" class="lnk" data-go="rec-'+(UI.fEmp&&UI.fEmp!=='all'?UI.fEmp:'all')+'">Ver tudo</button>')+'<div class="card">'+
  '<button type="button" class="r" data-go="rec-'+(UI.fEmp&&UI.fEmp!=='all'?UI.fEmp:'all')+'|col"><span class="ri">'+IC.people+'</span><span class="rt"><span class="a">Colaboradores</span><span class="b">Adiantamentos, vale-transporte, convênio médico, farmácia, empréstimos e outros</span></span>'+pill(RC?'info':'neutral',RC+(RC===1?' lançamento':' lançamentos'))+'</button>'+
  '<button type="button" class="r" data-go="rec-'+(UI.fEmp&&UI.fEmp!=='all'?UI.fEmp:'all')+'|soc"><span class="ri">'+(IC.pro||IC.people)+'</span><span class="rt"><span class="a">Sócios</span><span class="b">Pró-labore, divisão de lucros, convênios e descontos</span></span>'+pill(RS?'info':'neutral',RS+(RS===1?' lançamento':' lançamentos'))+'</button></div><p class="foot">Descontos e pedidos que se repetem todo mês. Os dos colaboradores aparecem na folha de cada um.</p></section>';
 if(LF.length)h+=lst('Liberação da folha de pagamento',LF,'','<p class="foot">O cliente pediu para enviar a folha ou as variáveis de um mês encerrado. Toque no pedido para liberar o mês por 3, 7 ou 15 dias.</p>');
 if(SV.length)h+=lst('Folhas encerradas sem variáveis',SV,'','<p class="foot">O cliente informou que nenhum colaborador teve variáveis no mês. Feche a folha e conclua o aviso.</p>');
 h+=lst('Admissões e readmissões',A,'Nenhuma admissão esperando contrato.','<p class="foot">Início a partir de '+admDias()+((MULTI.cfg||{}).admTipo==='u'?' dias úteis':' dias')+' do lançamento (regra de Ajustes). '+EA+(EA===1?' colaborador aparece':' colaboradores aparecem')+' como “Em admissão” nos clientes.</p>');
 h+='<section>'+sec('Férias','<span class="s">'+F.length+'</span>')+'<div class="card">'+(F.map(function(x){return '<div class="r">'+esw(x.e,1)+'<span class="rt"><span class="a">'+esc(x.nm)+'</span><span class="b">'+esc(x.e.fant||x.e.nome)+' · limite '+fmtA(x.lim)+'</span></span>'+pill(x.dd<0?'bad':x.dd<=30?'warn':'neutral',x.dd<0?'Vencidas':x.dd===0?'Vence hoje':'Faltam '+x.dd+' dias')+'</div>';}).join('')||'<p class="empty">Nenhuma férias vencendo nos próximos 60 dias.</p>')+'</div></section>';
 h+=lst('Pedidos de férias',P,'Nenhum pedido de férias em aberto.');
 h+=lst('Atualizações cadastrais',C,'Nenhuma alteração feita pelos clientes.','<p class="foot">Contato, endereço e dados pessoais que o cliente mudou na ficha do colaborador. Conclua depois de atualizar no sistema da folha.</p>');
 h+=lst('Demissões, afastamentos e alterações',X,'Nada em aberto.');
 h+=lst('Pró-labore, lucros e sócios',S,'Nenhum pedido de pró-labore, divisão de lucros ou inclusão de sócio em aberto.','<p class="foot">Na inclusão de sócio, o cliente já vê o sócio na lista. Atualize o contrato social e conclua o pedido.</p>');
 h+='<button type="button" class="r solo" data-go="receb"><span class="ri">'+(IC.folha||IC.down)+'</span><span class="rt"><span class="a">Folhas para fechar</span><span class="b">Folhas e variáveis enviadas pelos clientes</span></span>'+(FO?pill('warn',String(FO)):'<span class="cv">'+IC.chev18+'</span>')+'</button>';
 return h;}
/* lista do DP que expande e recolhe (colaboradores e sócios); recolhida, mostra um resumo. A escolha fica guardada */
function dpBloco(k,t,L,row,vazio,foot,res){var ab=!!(UI.dpx||{})[k],n=L.length,ic=k==='col'?IC.people:(IC.pie||IC.pro||IC.people),
 css=k==='col'?'<style>.dpxc{width:100%;text-align:left}.dpxc .cv svg{transition:transform .2s}.dpxc[aria-expanded="true"] .cv svg{transform:rotate(90deg)}.dpxl{margin-top:8px}</style>':'';
 return css+'<button type="button" class="r solo dpxc" data-dpx="'+k+'" aria-expanded="'+ab+'" aria-controls="dpx-'+k+'"><span class="ri">'+ic+'</span><span class="rt"><span class="a">'+esc(t)+'</span><span class="b">'+esc(n+(k==='col'?(n===1?' colaborador':' colaboradores'):(n===1?' sócio':' sócios'))+(n?' · '+res:''))+'</span></span><span class="cv">'+IC.chev18+'</span></button>'+
  (ab?'<div class="dpxl" id="dpx-'+k+'"><div class="card">'+(L.map(row).join('')||'<p class="empty">'+vazio+'</p>')+'</div><p class="foot">'+foot+'</p></div>':'');}
/* ===== sócios dos clientes (cadastrados em Departamento Pessoal › Gerenciar sócios ou Perfil › Sócios) ===== */
var SOC_F=['prolabore','lucros','socio'];
function socioRow(x){var d=x.d,ini=x.nm.split(' ').map(function(w){return w[0];}).slice(0,2).join('');
 return '<button type="button" class="r" data-go="socio-'+x.e.id+'|'+esc(x.nm)+'"><span class="ri" style="font-weight:700;font-size:13px">'+esc(ini)+'</span><span class="rt"><span class="a">'+esc(x.nm)+'</span><span class="b">'+esc((x.e.fant||x.e.nome)+' · '+(d.p||'—')+' do capital · '+(d.pl&&d.pl!=='—'?'pró-labore R$ '+d.pl:'sem pró-labore'))+'</span></span><span class="cv">'+IC.chev18+'</span></button>';}
function vSocio(a){var q=String(a).split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var nm=q.slice(1).join('|'),d=SOCD[nm];if(!d){done();return null;}
 var v=function(x){return x==null||x===''?'—':esc(String(x));};
 var h=hdr(nm,'Sócio · '+(e.fant||e.nome))+'<div class="hero"><div class="hk"><span>Sócio</span><span class="pill-w">'+esc(d.p||'—')+' do capital</span></div><p class="ht">'+(d.pl&&d.pl!=='—'?'Pró-labore de R$ '+esc(d.pl)+' por mês.':'Sem pró-labore.')+(d.cad?' Incluído pelo cliente em '+esc(d.cad)+'.':'')+'</p></div>';
 h+='<div class="card pad">'+kv('CPF',v(d.cpf))+kv('Nascimento',v(fmtD(d.nasc)||d.nasc))+kv('Gênero',v(d.gen))+kv('Nome da mãe',v(d.mae))+kv('Nome do pai',v(d.pai))+kv('Celular',v(d.tel))+kv('E-mail',v(d.email))+kv('Participação',v(d.p))+kv('Pró-labore',d.pl&&d.pl!=='—'?'R$ '+esc(d.pl):'—')+'</div>';
 var PD=ST.ped.filter(function(p){return p.quem===nm&&SOC_F.indexOf(p.f)>-1;});
 h+='<section>'+sec('Histórico de pedidos','<span class="s">'+PD.length+'</span>')+'<div class="card">'+(PD.map(function(p){return pedRow({e:e,p:p});}).join('')||'<p class="empty">Nenhum pedido para este sócio.</p>')+'</div></section>';
 h+='<div class="fbar"><button type="button" class="cta ghost" data-go="chat-'+e.id+'">'+IC.chat+' Chamar o cliente</button></div>';done();return h;}
/* ===== pedidos ===== */
function pedAll(f){var L=[];emps(f).forEach(function(e){B(e.id);ST.ped.forEach(function(p){L.push({e:e,p:p});});});done();
 L.sort(function(a,b){return (parseInt(String(b.p.prot||'').split('-')[1],10)||0)-(parseInt(String(a.p.prot||'').split('-')[1],10)||0);});return L;}
/* setor e situação dos pedidos: cor por setor, situação com ponto colorido (lista de pedidos, DP, início) */
var PSET={dp:['DP','people'],contabil:['Contábil','receipt'],guias:['Impostos','tax'],servicos:['Serviços','sol'],docs:['Documentos','doc']};
var PEDSEL={};
function pedSet(p){var a=(FLOWS[p.f]||{}).a;return PSET[a]?a:'docs';}
function pedSk(p){return p.st==='ok'||(pedDireto(p)&&p.st!=='voce')?'ok':p.st==='voce'?'voce':p.st==='analise'||(p.st==='enviado'&&p.vis)?'analise':'novo';}
(function(){if(document.getElementById('ped-css'))return;var st=document.createElement('style');st.id='ped-css';
 st.textContent='.sx-dp{--sc:#6B4FD8}.sx-contabil{--sc:#0F8A6A}.sx-guias{--sc:#B4541A}.sx-servicos{--sc:#2F6FE0}.sx-docs{--sc:#5F6670}'+
 '.phone[data-escuro="1"] .sx-dp{--sc:#A894FF}.phone[data-escuro="1"] .sx-contabil{--sc:#4CC9A0}.phone[data-escuro="1"] .sx-guias{--sc:#F2A15E}.phone[data-escuro="1"] .sx-servicos{--sc:#7FAAFF}.phone[data-escuro="1"] .sx-docs{--sc:#AAB2BD}'+
 '.r .ri.psi{background:color-mix(in srgb,var(--sc) 14%,transparent);color:var(--sc)}'+
 '.pset{display:inline-flex;align-items:center;gap:4px;height:19px;padding:0 7px;border-radius:6px;margin-right:6px;background:color-mix(in srgb,var(--sc) 13%,transparent);color:var(--sc);font-size:10.5px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;vertical-align:1px}'+
 '.pill.pdt{display:inline-flex;align-items:center;gap:5px}.pill.pdt:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}.pill.pdt.warn:before{box-shadow:0 0 0 3px color-mix(in srgb,currentColor 22%,transparent)}'+
 '.pfsel.sx .pfb .pfi{color:var(--sc,var(--accent))}.pfsel.sx .pfb.on{background:var(--sc,var(--accent));border-color:var(--sc,var(--accent));box-shadow:0 6px 16px -8px var(--sc,var(--accent))}.pfsel.sx .pfb.on .pfi{color:inherit}'+
 '.pstg{display:flex;align-items:center;gap:8px;margin:18px 2px 8px;font-size:13px;font-weight:700}.pstg:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--gc)}.pstg span{color:var(--muted);font-weight:600}'+
 '.pstg.novo{--gc:var(--warn)}.pstg.analise{--gc:var(--info)}.pstg.voce{--gc:var(--muted)}.pstg.ok{--gc:var(--okc)}'+
 '.pfsel+.pfsel{margin-top:4px}';document.head.appendChild(st);})();
function pedRow(x){var p=x.p,s=pst(p),F=FLOWS[p.f]||{i:'sol'},k=pedSet(p);
 return '<button type="button" class="r sx-'+k+'" data-go="ped-'+x.e.id+'|'+p.id+'"><span class="ri psi">'+(IC[F.i]||IC.sol)+'</span><span class="rt"><span class="a">'+esc(p.tipo)+(p.quem?' · '+esc(p.quem):'')+'</span><span class="b"><span class="pset">'+PSET[k][0]+'</span>'+esc(x.e.fant||x.e.nome)+' · '+esc(p.data)+'</span></span><span class="pill pdt '+s[1]+'">'+esc(s[0])+'</span></button>';}
function vPedidos(){var pa=UI.pa||'all',pf=UI.pf||'abertos';if(['abertos','novo','analise','voce','concluidos','todos'].indexOf(pf)<0)pf='abertos';if(pa!=='all'&&!PSET[pa])pa='all';
 var A=pedAll(),okS=function(x){var k=pedSk(x.p);return pf==='todos'||(pf==='abertos'?k!=='ok':pf==='concluidos'?k==='ok':k===pf);},okA=function(x){return pa==='all'||pedSet(x.p)===pa;};
 var L=A.filter(function(x){return okS(x)&&okA(x);}),nS=function(f){return A.filter(function(x){var k=pedSk(x.p);return okA(x)&&(f==='todos'||(f==='abertos'?k!=='ok':f==='concluidos'?k==='ok':k===f));}).length;},nA=function(a){return A.filter(function(x){return okS(x)&&(a==='all'||pedSet(x.p)===a);}).length;};
 var h=pedSelCss()+hdr('Pedidos','Tudo o que os clientes pediram')+empChips('femp',UI.fEmp,1);
 var SIT=[['abertos','Em aberto'],['novo','Novos'],['analise','Em análise'],['voce','Com o cliente'],['concluidos','Concluídos'],['todos','Todos']],SET=[['all','Todos os setores']].concat(Object.keys(PSET).map(function(k){return [k,PSET[k][0]];}));
 PEDSEL={pf:SIT.map(function(c){return [c[0],c[1]+' · '+nS(c[0])];}),pa:SET.map(function(c){return [c[0],c[1]+' · '+nA(c[0])];})};
 var lb=function(l,v){return l.filter(function(c){return c[0]===v;})[0][1];};
 h+='<style>.pedsel{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}.pedsb{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;padding:10px 12px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--ink);text-align:left;font:inherit}.pedsb .pl{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.pedsb .pv2{display:flex;align-items:center;gap:6px;width:100%;font-size:14.5px;font-weight:700}.pedsb .pv2 span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pedsb .pv2 svg{flex:none;width:16px;height:16px;color:var(--accent)}.pedsb .pdd{flex:none;width:9px;height:9px;border-radius:50%;background:var(--sc,var(--accent))}</style>'+
  '<div class="pedsel"><button type="button" class="pedsb" data-pedsel="pf" aria-haspopup="dialog"><span class="pl">Situação</span><span class="pv2"><span>'+esc(lb(SIT,pf))+'</span>'+IC.chevd+'</span></button>'+
  '<button type="button" class="pedsb'+(pa!=='all'?' sx-'+pa:'')+'" data-pedsel="pa" aria-haspopup="dialog"><span class="pl">Setor</span><span class="pv2">'+(pa!=='all'?'<i class="pdd"></i>':'')+'<span>'+esc(lb(SET,pa))+'</span>'+IC.chevd+'</span></button></div>';
 if(!L.length)return h+'<div class="card"><p class="empty">Nenhum pedido nesta lista.</p></div>';
 if(pf==='abertos'||pf==='todos'){var G=[['novo','Novos','Ainda não abertos por você'],['analise','Em análise','Você está cuidando'],['voce','Com o cliente','Esperando o cliente'],['ok','Concluídos','']];
  G.forEach(function(g){var M=L.filter(function(x){return pedSk(x.p)===g[0];});if(!M.length)return;h+='<div class="pstg '+g[0]+'">'+g[1]+' · '+M.length+(g[2]?' <span>'+g[2]+'</span>':'')+'</div><div class="card">'+M.map(pedRow).join('')+'</div>';});return h;}
 return h+'<div class="card">'+L.map(pedRow).join('')+'</div>';}
function compDe(q){var m=/([a-z]{3}\/\d{4})/i.exec(q||'');if(m)return m[1].toLowerCase();var d=new Date(NOW().getFullYear(),NOW().getMonth()-1,1);return MESC2[d.getMonth()]+'/'+d.getFullYear();}
var TIPOS_GUIA=['DAS · Simples Nacional','FGTS Digital','DCTFWeb · INSS','ISS · Municipal','IRPJ · trimestral','CSLL · trimestral','PIS/COFINS','DARF · IRRF'];
function catPed(p){var F=FLOWS[p.f]||{};return FLOW_CAT[p.f]&&FLOW_CAT[p.f]!=='outros'?FLOW_CAT[p.f]:({dp:'dp',servicos:'dp',contabil:'contabil',guias:'guias',docs:'outros'}[F.a]||'outros');}
function vPed(a){var q=a.split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var p=ST.ped.filter(function(x){return x.id===q[1];})[0];if(!p){done();return null;}
 if(p.st==='enviado'&&!p.vis&&!pedDireto(p)){p.vis=agora();setTimeout(function(){save();},0);} /* aberto pelo contador: o cliente vê Visualizado */
 if(p.f==='comprovante'&&p.st!=='ok'){guiaPagaConclui(p);setTimeout(function(){save();},0);}
 var s=pst(p),F=FLOWS[p.f]||{t:p.tipo,i:'sol',a:'docs'};
 var TL=pedTl(p,'ct'),fases=TL.f,at=TL.at;
 var h=hdr(F.t,e.fant||e.nome)+'<div class="card pad"><div class="pt">'+esw(e)+'<span class="rt"><span class="a">'+esc(p.tipo)+(p.quem?' · '+esc(p.quem):'')+'</span><span class="b">Protocolo #'+esc(p.prot||'—')+'</span></span>'+pill(s[1],s[0])+'</div></div>';
 if(!pedDireto(p))h+='<section>'+sec('Acompanhamento')+tline(fases,at)+'</section>';
 if(p.cli)h+='<div class="note"><b>Cliente:</b> '+esc(p.cli)+'</div>';
 if(p.gEnv&&p.st!=='ok')h+='<div class="note">Nova guia enviada em '+esc(p.gEnv)+'. O pedido é concluído quando o cliente abrir a guia.</div>';else if(p.gVis)h+='<div class="note">Concluído quando o cliente abriu a nova guia, em '+esc(p.gVis)+'.</div>';
 h+='<section>'+sec('O que o cliente informou')+(p.dados&&p.dados.length?'<div class="rs">'+p.dados.map(function(d){return '<div class="rv"><span>'+esc(d[0])+'</span><span>'+esc(d[1])+'</span></div>';}).join('')+'</div>':'<div class="note">Este pedido não tem detalhes gravados (foi feito antes da ligação com o painel).</div>')+'</section>';
 var AQ=arqDoPed(p.id);if(AQ.length)h+='<section>'+sec('Arquivos do pedido')+'<div class="card">'+AQ.map(function(x){return docRow(e,x);}).join('')+'</div></section>';
 if((p.resp||[]).length)h+='<section>'+sec('Enviado por você')+'<div class="card pad">'+p.resp.map(function(r){return '<div class="rv"><span>'+esc(r[1])+'</span><span>'+esc(r[0])+'</span></div>';}).join('')+(p.rsn?'<p class="foot rcbk">'+((p.rcb||0)>=p.rsn?IC.check16+' Recebido pelo cliente'+(p.rcbH?' em '+esc(p.rcbH):''):'Enviado. Aguardando o app do cliente receber.')+'</p>':'')+'</div></section>';
 if(p.rc)h+='<div class="note">'+(p.cobr?'Recálculo cobrado: '+esc(p.cobr):'Recálculo concluído sem cobrança')+'</div>';
 if(p.f==='libmes'&&p.lk){var lq=p.lk.split('|'),la=libAte(lq[0],lq[1]);
  if(p.st!=='ok'){h+='<section>'+sec('Liberar o envio')+'<div class="card pad"><p class="lead0" style="margin:0 0 10px">O cliente pede para enviar '+esc(LIBN[lq[0]]||lq[0])+' de '+esc(cMes(lq[1]))+', que já foi encerrado. Ao liberar, o mês reabre só para este cliente até a data escolhida.</p><div class="g2b">'+[3,7,15].map(function(d){return '<button type="button" class="wb'+(d===7?' pri':'')+'" data-libdias="'+d+'">Liberar por '+d+' dias</button>';}).join('')+'</div></div></section><div class="fbar"><button type="button" class="cta ghost" data-pst="ok">Recusar e concluir</button></div>';done();CTX={e:e.id,p:p.id};return h;}
  h+='<div class="note">'+(la?'Liberado até '+fmtA(la)+'.':'Pedido concluído sem liberação.')+'</div>';done();CTX={e:e.id,p:p.id};return h;}
 if(pedDireto(p)){h+='<div class="note">'+(p.f==='despesas'?'Despesa lançada pelo cliente. Vai direto para a contabilidade, sem status de acompanhamento. O cliente pode editar até o envio do mês encerrar.':'Recebimento direto: o cliente não vê status de acompanhamento. Dê andamento e, se algo estiver errado, chame o cliente.')+'</div><div class="fbar"><button type="button" class="cta ghost" data-go="chat-'+e.id+'">'+IC.chat+' Chamar o cliente</button></div>';done();CTX={e:e.id,p:p.id};return h;}
 if(p.st!=='ok'){
  h+='<section>'+sec('Responder ao cliente')+(pedGuia(p)?'<div class="card pad"><p class="lead0" style="margin:0 0 10px">'+(GUIA_NOVA.indexOf(p.f)>-1?'Envie o novo PDF da guia, com os dados atualizados, ou peça uma ação ao cliente.':'Responda ao cliente ou peça uma ação a ele.')+'</p><button type="button" class="cta" data-presp>'+IC.chat+' Responder ao cliente</button></div>':'<div class="chips" style="margin-bottom:8px">'+['Documento incompleto','Arquivo ilegível','Nota cancelada','Falta assinatura','Mês errado','Valor diferente'].map(function(m){return '<button type="button" class="chip" data-motivo="'+m+'">'+m+'</button>';}).join('')+'</div>'+(gOfPed(p)?'<label class="r tgl" style="padding:6px 0"><span class="rt"><span class="a">Liberar o mês por 7 dias para correção</span><span class="b">Ao pedir ação ao cliente, o envio de '+esc(cMes(gOfPed(p)[1]))+' reabre para ele corrigir</span></span><input type="checkbox" id="pd-lib" checked style="width:22px;height:22px"></label>':'')+'<div class="form"><div class="fld"><label class="fl" for="pd-msg">Mensagem '+(p.f==='ferias'?'<i>(opcional)</i>':'<i>(obrigatória ao pedir ação)</i>')+'</label><textarea id="pd-msg" rows="3" placeholder="Vai para o pedido e para o chat do cliente"></textarea></div>'+
  txt('pd-doc','Documento pronto','Ex.: Contrato de trabalho · '+(p.quem||'cliente'),'',1)+fileF('pd-arq')+'<p class="fh">Pasta: <b>'+esc(catOf(catPed(p))[1])+'</b>, definida pelo tipo do pedido.</p></div>')+'</section>';}
 h+='<div class="fbar">';
 if(p.st!=='ok'&&!pedGuia(p))h+='<button type="button" class="cta" data-pst="ok">'+IC.check16+' Concluir e avisar o cliente</button>';
 if(pedGuia(p)){if(p.st==='voce')h+='<button type="button" class="cta ghost" data-pst="analise">Voltar para análise</button>';}
 else{if(p.st==='enviado'||p.st==='analise')h+='<div class="g2b">'+(p.st==='enviado'?'<button type="button" class="wb" data-pst="analise">Iniciar análise</button>':'<button type="button" class="wb" data-pst="analise">Só responder</button>')+'<button type="button" class="wb" data-pst="voce">'+(p.f==='ferias'?'Enviar aviso p/ assinar':'Pedir ação do cliente')+'</button></div>';
 if(p.st==='voce')h+='<div class="g2b"><button type="button" class="wb" data-pst="voce">Reforçar pedido</button><button type="button" class="wb" data-pst="analise">Voltar para análise</button></div>';}
 if(p.st==='ok')h+='<button type="button" class="cta ghost" data-pst="analise">Reabrir pedido</button>';
 h+='</div>';done();CTX={e:e.id,p:p.id};return h;}
var CTX=null;
/* pedidos de guias: a resposta abre numa janela; a pasta é sempre Guias de impostos e o novo PDF substitui a guia anterior */
var GUIA_NOVA=['via2','parcelar','recalculo'];
/* campo do novo arquivo da guia: aparece em todo pedido de alteração da guia (recálculo, 2ª via, parcelamento, dúvida) e é sempre opcional.
   Se o contador carregar um arquivo, ele substitui o anterior, que é apagado do armazenamento. Na guia paga não aparece. */
function guiaCampo(p){return pedGuia(p)&&p.f!=='comprovante'?'opc':'';}
function pedGuia(p){return (FLOWS[p.f]||{}).a==='guias';}
function guiaIdxPed(p){var r=-1;GU.forEach(function(g,i){if(r<0&&guiaPeds(g).indexOf(p)>-1)r=i;});return r;}
function pedModal(p){var gc=guiaCampo(p);
 return '<div class="esh"><span class="grab"></span><div class="mt" id="rs-t">Responder ao cliente</div><div class="ms">'+esc(p.tipo+(p.quem?' · '+p.quem:''))+'</div></div>'+
 '<div class="chips" style="margin:0">'+['Falta informação','Valor diferente','Confirme a data de pagamento','Guia já paga'].map(function(m){return '<button type="button" class="chip" data-motivo="'+m+'">'+m+'</button>';}).join('')+'</div>'+
 '<div class="form"><div class="fld"><label class="fl" for="pd-msg">Mensagem <i>'+(gc?'(obrigatória se não enviar arquivo)':'')+'</i></label><textarea id="pd-msg" rows="3" placeholder="Vai para o pedido e para o chat do cliente"></textarea></div>'+
 '<button type="button" class="wb" data-pst="voce">Pedir ação ao cliente</button>'+
 (gc?'<div class="fld"><span class="fl">Novo arquivo da guia <i>(opcional)</i></span><label class="up" for="pd-arq" id="pd-arq-l"><span class="ri">'+IC.up16+'</span><span class="rt"><span class="a" id="pd-arq-n">Escolher arquivo</span><span class="b">PDF da guia com os dados novos. Se carregar, ele substitui o arquivo atual</span></span><input class="fi-over" type="file" id="pd-arq" accept="application/pdf,.pdf" aria-label="Escolher o PDF da guia"></label><button type="button" class="lnk" id="pd-arq-x" hidden style="align-self:flex-start;margin-top:6px">Tirar o arquivo e manter a guia atual</button></div><span class="fh" id="pd-ler" role="status" aria-live="polite" hidden></span>':'')+
 '<p class="fh">Pasta: <b>Guias de impostos</b>, definida pelo tipo do pedido.'+(gc?' Se você carregar um novo arquivo, ele substitui a guia anterior, que é apagada do armazenamento. Sem arquivo, a guia atual continua valendo.':'')+'</p>'+
 (p.f==='recalculo'?'<div class="fld"><span class="fl">Valor a cobrar</span><div class="rcob"><label class="rck"><input type="checkbox" id="rc-on"><span>Cobrar</span></label><div class="mon"><span>R$</span><input id="rc-v" inputmode="numeric" value="45,00" aria-label="Valor a cobrar" data-money disabled></div></div></div>':'')+
 '<span class="fe" id="pd-err" hidden></span><button type="button" class="cta" data-rsend>'+IC.up16+' Enviar</button><p class="fh" style="margin:0">'+(gc?'Com um novo arquivo, o pedido fica como Guia enviada e é concluído quando o cliente abrir a guia. Sem arquivo, o pedido é concluído ao enviar.':'Ao enviar, o pedido é concluído.')+' Se precisar, use Reabrir pedido.</p></div>'+
 '<button type="button" class="wb" data-rclose>Cancelar</button>';}
var rsh=null,ov5=null,RLER=null;
function rspOpen(){var c=CTX;if(!c||!c.p)return;B(c.e);var p=ST.ped.filter(function(x){return x.id===c.p;})[0];done();if(!p)return;
 if(!rsh){ov5=document.createElement('div');ov5.className='mov';ov5.id='mov5';ov5.hidden=true;ov5.addEventListener('click',rspClose);rsh=document.createElement('div');rsh.className='esheet rsheet';rsh.id='rsheet';rsh.hidden=true;rsh.setAttribute('role','dialog');rsh.setAttribute('aria-modal','true');rsh.setAttribute('aria-labelledby','rs-t');P.appendChild(ov5);P.appendChild(rsh);}
 fabClose();RLER=null;rsh.innerHTML=pedModal(p);rsh.hidden=false;ov5.hidden=false;rsh.scrollTop=0;setTimeout(function(){var m=$('pd-msg');m&&m.focus();},60);}
function rspClose(){if(rsh){rsh.hidden=true;rsh.innerHTML='';}if(ov5)ov5.hidden=true;RLER=null;}
/* lê o novo PDF (mesma leitura de Lançar guia) para atualizar valor, vencimento, código e Pix da guia do cliente */
function rspLer(f){var st=$('pd-ler'),msg=function(t,w){if(!st)return;st.textContent=t;st.hidden=!t;st.classList.toggle('warn',!!w);};RLER=null;if(!f)return msg('');
 if(ftOf(f.name)!=='pdf'&&!/pdf/i.test(f.type||''))return msg('Envie a guia em PDF.',1);
 msg('Lendo a guia…');var pr=RLER={d:null};
 pr.p=guiaPdfLer(f).then(function(r){pr.d=r.dados||{};var o=pr.d,lid=[];if(o.valor)lid.push('valor R$ '+o.valor);if(o.venc)lid.push('vencimento '+fmtP(o.venc));if(o.code)lid.push('código de barras');if(o.pix)lid.push('Pix');
  if(RLER===pr)msg(lid.length?'Lido do PDF: '+lid.join(', ')+'. A guia do cliente é atualizada com esses dados.':'Não encontrei os dados neste PDF. O arquivo substitui o anterior e os dados da guia ficam como estão.',!lid.length);})
 .catch(function(){pr.d={};if(RLER===pr)msg('Não deu para ler este PDF. O arquivo substitui o anterior e os dados da guia ficam como estão.',1);});}
function pedResp(){var c=CTX;if(!c)return;B(c.e);var p=ST.ped.filter(function(x){return x.id===c.p;})[0];done();if(!p)return;
 var msg=(($('pd-msg')||{}).value||'').trim(),fx=$('pd-arq'),f=fx&&fx.files&&fx.files[0],ck=$('rc-on'),cob=!!(ck&&ck.checked),v=(($('rc-v')||{}).value||'').trim();
 if(!errOn('pd-err',f&&ftOf(f.name)!=='pdf'?'A guia precisa ser um PDF':!msg&&!f?'Escreva a resposta ao cliente':cob&&!money(v)?'Digite o valor a cobrar':''))return;
 var bt=document.querySelector('[data-rsend]');if(bt)bt.disabled=true;var pr=RLER;
 ((pr&&pr.p)||Promise.resolve()).then(function(){pedRespFim(c,msg,f?f.name:'',cob?v:'',pr&&pr.d||{});});}
function pedRespFim(c,msg,nm,cob,o){B(c.e);var p=ST.ped.filter(function(x){return x.id===c.p;})[0];if(!p){done();rspClose();return;}var lbl=p.tipo+(p.quem?' · '+p.quem:'');p.resp=p.resp||[];p.docs=p.docs||[];
 if(nm){var gi=guiaIdxPed(p),dn=nm.replace(/\.[^.]+$/,'');
  if(gi>-1)guiaTroca(gi,nm,o,p);
  else if(o.valor&&o.venc)addGuia(TIPOS_GUIA.indexOf(o.tipo)>-1?o.tipo:TIPOS_GUIA.filter(function(x){return String(p.quem||'').indexOf(x.split(' · ')[0])>-1;})[0]||TIPOS_GUIA[0],o.comp?curto(o.comp):compDe(p.quem),o.valor,dInput(o.venc),p.id,nm,{code:o.code||'',pix:o.pix||''});
  else addDoc(dn,'guias',compOf(),nm,p.id);
  p.docs.push([dn,'Guias de impostos',hoje()]);}
 if(msg){p.resp.push([msg,agora()]);ST.chat.push({me:0,t:msg,h:agora(),go:'ped-'+p.id,gl:'Ver pedido'});ST.unread=(ST.unread||0)+1;}
 else if(nm)p.resp.push(['Nova guia enviada: '+nm,agora()]);
 if(p.f==='recalculo'){p.rc=1;p.cobr=cob?'R$ '+cob:'';avisar(cob?'O contador cobrou R$ '+cob+' pelo recálculo':'Recálculo concluído sem cobrança',p.quem||'Guia','ped-'+p.id);ativ(cob?'Recálculo cobrado: R$ '+cob:'Recálculo concluído, sem cobrança');}
 p.cr=0;delete p.cvis;p.rsn=(p.rsn||0)+1;
 if(nm){p.st='analise';p.gEnv=agora();avisar('Nova guia enviada',lbl+' · abra a guia para concluir','ped-'+p.id);ativ('Nova guia enviada · '+lbl);} /* conclui quando o cliente abrir a guia */
 else{p.st='ok';avisar('Pedido concluído',lbl,'ped-'+p.id);ativ('Pedido concluído · '+lbl);}
 rspClose();commit('Resposta enviada ao cliente');}
/* novo PDF de uma guia já lançada: atualiza os dados lidos, liga o registro ao novo arquivo e apaga o antigo do armazenamento */
function guiaTroca(i,nm,o,p){var g=GU[i];
 if(o.valor&&money(o.valor)>0)g.v=o.valor;
 if(o.venc){var dt=dOnly(o.venc),dd=diasAte(dt),vs=fmtP(dt);g.venc=vs;g.vl=dd===0?'Vence hoje, '+vs:dd===1?'Vence amanhã, '+vs:dd<0?'Venceu em '+vs:'Vence em '+dd+' dias, '+vs;g.k=dd<=3?'warn':'neutral';}
 g.code=o.code||guiaCode();if(o.pix)g.pix=o.pix;else delete g.pix;
 var a=arqList().filter(function(x){return x.gi===i&&x.or==='ct';})[0],velho=a&&a.fileId,fi=window.FILES&&FILES[nm];
 if(a){a.arq=nm;a.data=hoje();a.st='disp';a.ped=p.id;delete a.fileId;delete a.ftype;if(fi&&fi.id){a.fileId=fi.id;a.ftype=fi.type;}(a.h=a.h||[]).push(['Substituído pelo novo arquivo',agora()]);}
 else arqAdd({n:'Guia '+g.n.split(' · ')[0]+' · '+g.c,arq:nm,cat:'guias',comp:compOf(g.c),or:'ct',gi:i,ped:p.id});
 if(typeof GUIAS!=='undefined'&&GUIAS.length>i)GUIAS[i]=g.n.split(' · ')[0]+' · '+g.c+' · R$ '+g.v;
 avisar('Guia '+g.n.split(' · ')[0]+' atualizada','Vence '+g.venc+' · R$ '+g.v,'guia-'+i);ativ('Guia '+g.n.split(' · ')[0]+' de '+g.c+' substituída');
 if(velho&&velho!==(fi&&fi.id))arqApagaVelho(velho,fi);}
/* apaga o arquivo antigo depois que o novo foi guardado, se nenhum outro registro usa o mesmo arquivo (o mesmo conteúdo é guardado uma vez só) */
function arqApagaVelho(id,fi){((fi&&fi.pend)||Promise.resolve()).then(function(){setTimeout(function(){if(JSON.stringify(MULTI.data).indexOf(id)<0&&window.apagaArquivo)apagaArquivo(id);},300);});}
function fileName(id){var f=$(id);return f&&f.files&&f.files[0]?f.files[0].name:'';}
function addGuia(t,c,v,d,ped,arq,lido){lido=lido||{};var q=d.split('-'),dt=new Date(+q[0],+q[1]-1,+q[2]),dd=diasAte(dt),vs=fmtP(dt);
 GU.push({n:t,c:c,v:v,venc:vs,vl:dd===0?'Vence hoje, '+vs:dd===1?'Vence amanhã, '+vs:dd<0?'Venceu em '+vs:'Vence em '+dd+' dias, '+vs,k:dd<=3?'warn':'neutral',code:lido.code||guiaCode()});if(lido.pix)GU[GU.length-1].pix=lido.pix;
 var i=GU.length-1;arqAdd({n:'Guia '+t.split(' · ')[0]+' · '+c,arq:arq||'guia-'+t.split(' · ')[0].toLowerCase().replace(/[^a-z]/g,'')+'-'+c.replace('/','-')+'.pdf',cat:'guias',comp:compOf(c),or:'ct',gi:i,ped:ped||''});
 avisar('Guia '+t.split(' · ')[0]+' disponível','Vence '+vs+' · R$ '+v,'guia-'+i);ativ('Guia '+t.split(' · ')[0]+' de '+c+' disponível');return i;}
function addDoc(nome,cat,comp,arq,ped){var a=arqAdd({n:nome,arq:arq||'',cat:cat,comp:comp||compOf(),or:'ct',ped:ped||''});if(cat!=='interno'){avisar('Novo documento: '+nome,catOf(cat)[1],'arq-'+a.id);ativ(nome+' disponível em Documentos');}return a;}
function dvP(p,rx){var x=(p.dados||[]).filter(function(d){return rx.test(d[0]);})[0];return x?String(x[1]):'';}
function ajustaFunc(p){var sal=function(v){return v.replace(/^R\$\s*/,'');};
 if(p.f==='prolabore'&&p.quem&&SOCD[p.quem]){var vp=dvP(p,/^valor bruto/i);if(vp)SOCD[p.quem].pl=sal(vp);return;}
 var f=p.quem&&FUNCD[p.quem];if(!f)return;
 if(p.f==='admissao'){if(f.adm==='Em admissão')f.adm=dvP(p,/^data de in[íi]cio/i)||fmtD(f.ini)||hoje();var c=dvP(p,/^cargo/i),sl=dvP(p,/sal[áa]rio/i),j=dvP(p,/^jornada/i);if(c)f.c=c;if(sl)f.sal=sal(sl);if(j)f.jor=j;}
 if(p.f==='salario'){var v=dvP(p,/novo sal/i);if(v)f.sal=sal(v);}
 if(p.f==='cargo'){var c2=dvP(p,/novo cargo/i),v2=dvP(p,/novo sal/i);if(c2)f.c=c2;if(v2)f.sal=sal(v2);}
 if(p.f==='jornada'){var j2=dvP(p,/nova jornada/i);if(j2)f.jor=j2;}
 if(p.f==='turno'){var t2=dvP(p,/novo turno/i),h2=dvP(p,/novo hor/i);if(t2)f.tur=t2+(h2?' · '+h2:'');}
 if(p.f==='demissao')f.dem=dvP(p,/[úu]ltimo dia/i)||hoje();}
function pedAct(st){var c=CTX;if(!c)return;B(c.e);var p=ST.ped.filter(function(x){return x.id===c.p;})[0];if(!p)return;
 var gp=pedGuia(p),msg=(($('pd-msg')||{}).value||'').trim(),doc=gp?'':(($('pd-doc')||{}).value||'').trim(),cat=catPed(p),arq=gp?'':fileName('pd-arq'),lbl=p.tipo+(p.quem?' · '+p.quem:'');
 if(!doc&&arq)doc=arq.replace(/\.[^.]+$/,'');
 if(st==='voce'&&!msg&&p.f!=='ferias'){toast('Escreva o que o cliente precisa fazer');var pm=$('pd-msg');pm&&pm.focus();return;}
 p.st=st;p.cr=0;delete p.cvis;delete p.gEnv;p.resp=p.resp||[];p.docs=p.docs||[];
 if(st==='voce'&&$('pd-lib')&&$('pd-lib').checked&&gOfPed(p)){var gq=gOfPed(p),dl=dOnly(NOW());dl.setDate(dl.getDate()+7);ST.lib=ST.lib||{};ST.lib[libKey(gq[0],gq[1])]=dl.getFullYear()+'-'+('0'+(dl.getMonth()+1)).slice(-2)+'-'+('0'+dl.getDate()).slice(-2);msg=(msg?msg+' ':'')+'O envio de '+cMes(gq[1])+' foi liberado até '+fmtA(dl)+' para você corrigir.';}
 if(st==='voce')p.pede=msg||('O aviso de férias de '+(p.quem||'')+' está pronto. Confira e assine para o contador seguir.');
 if(msg){p.resp.push([msg,agora()]);ST.chat.push({me:0,t:msg,h:agora(),go:'ped-'+p.id,gl:'Ver pedido'});ST.unread=(ST.unread||0)+1;}
 if(doc){addDoc(doc,cat,compOf(),arq,p.id);p.docs.push([doc,catOf(cat)[1],hoje()]);}
 if(st==='ok')ajustaFunc(p);
 var tx={analise:['Contador está analisando',lbl],voce:['O contador precisa de você',lbl+(p.f==='ferias'&&!msg?' · assine o aviso':' · veja o pedido')],ok:['Pedido concluído',lbl]}[st];
 if(!(st==='analise'&&!msg&&!doc&&p.st==='analise'&&false))avisar(tx[0],tx[1],'ped-'+p.id);ativ(tx[0]+' · '+lbl);
 if(msg||doc)p.rsn=(p.rsn||0)+1;if(gp)rspClose();
 commit(st==='ok'?'Pedido concluído e cliente avisado':st==='voce'?'Pedido enviado ao cliente':'Cliente avisado');}
/* ===== documentos: linha, detalhe, conferência ===== */
function temArq(a){return !!(a&&(a.fileId||(window.FILES&&FILES[a.arq]&&FILES[a.arq].url)));}
function baixarArq(a,semMsg){var u=a&&window.arqUrl?arqUrl(a):'';if(!u){toast(semMsg||'Este arquivo foi registrado só pelo nome');return false;}var l=document.createElement('a');l.href=u;l.download=a.arq||a.n||'arquivo';document.body.appendChild(l);l.click();l.remove();toast('Baixando '+(a.arq||a.n));return true;}
function docRow(e,a,showE){var s=arqSt(a),c=catOf(a.cat);
 return '<button type="button" class="r" data-go="doc-'+e.id+'|'+a.id+'">'+(showE?esw(e,1):'<span class="ri">'+(IC[c[2]]||IC.doc)+'</span>')+'<span class="rt"><span class="a">'+esc(a.n)+'</span><span class="b">'+esc((showE?(e.fant||e.nome)+' · ':'')+(a.or==='ct'?(a.cat==='interno'?'Interno':'Do escritório'):'Do cliente')+' · '+(showE?c[1]+' · ':'')+a.data)+'</span></span>'+(temArq(a)?'<span class="dlr" role="button" tabindex="0" aria-label="Baixar '+esc(a.arq||a.n)+'" data-dlrow="'+e.id+'|'+a.id+'">'+IC.down16+'</span>':'')+pill(s[1],a.or==='cli'&&a.st==='enviado'?'Novo':s[0])+'</button>';}
function vDoc(x){var q=x.split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var a=arqGet(q[1]);if(!a){done();return null;}
 if(a.or==='cli'&&typeof a.gi==='number'&&(a.st==='enviado'||a.st==='analise')){guiaPagaConclui(a.ped&&ST.ped.filter(function(x){return x.id===a.ped;})[0],a);setTimeout(function(){save();},0);} /* comprovante aberto: já conclui */
 var c=catOf(a.cat),s=arqSt(a);
 var fases,at,stop;
 if(a.or==='cli'){fases=[['Enviado pelo cliente',a.data],['Em conferência',''],[a.st==='dev'?'Devolvido para correção':'Conferido','']];at={enviado:1,analise:1,ok:3,dev:2}[a.st];if(a.st==='analise')at=1;}
 else{fases=[['Enviado por você',a.data],[a.cat==='interno'?'Guardado no arquivo interno':'Disponível para o cliente',''],[a.st==='paga'?'Guia paga':a.cat==='guias'?'Aberta pelo cliente · concluída':'Visto pelo cliente','']];at=a.cat==='interno'?2:a.st==='disp'?1:3;}
 var h=hdr(a.n,e.fant||e.nome)+'<div class="card pad"><div class="pt"><span class="ri">'+(IC[c[2]]||IC.doc)+'</span><span class="rt"><span class="a">'+esc(a.arq||a.n)+'</span><span class="b">'+esc(c[1])+' · '+esc(a.comp)+'</span></span>'+pill(s[1],s[0])+'</div></div>'+(window.arqPreview?arqPreview(a):'');
 if(!dirA0(a))h+='<section>'+sec('Acompanhamento')+tline(fases,at)+'</section>';
 h+='<section>'+sec('Onde está guardado')+'<div class="rs"><div class="rv"><span>Cliente</span><span>'+esc(e.nome)+'</span></div><div class="rv"><span>Caminho</span><span>'+esc(e.cnpj)+' / '+esc(a.comp)+' / '+esc(c[1])+'</span></div><div class="rv"><span>Enviado por</span><span>'+(a.or==='ct'?'Escritório':'Cliente')+'</span></div><div class="rv"><span>Quem vê</span><span>'+(a.cat==='interno'?'Só o escritório':'Cliente e escritório')+'</span></div></div></section>';
 if(a.st==='dev')h+='<div class="note"><b>Motivo da devolução:</b> '+esc(a.mot||'')+'</div>';
 if(a.ped){var p=ST.ped.filter(function(x){return x.id===a.ped;})[0];if(p)h+='<button type="button" class="r solo" data-go="ped-'+e.id+'|'+p.id+'"><span class="ri">'+IC.sol+'</span><span class="rt"><span class="a">'+esc(p.tipo)+(p.quem?' · '+esc(p.quem):'')+'</span><span class="b">Pedido #'+esc(p.prot||'')+' · '+esc(pst(p)[0])+'</span></span><span class="cv">'+IC.chev18+'</span></button>';}
 if(a.h&&a.h.length)h+='<section>'+sec('Histórico')+'<div class="card pad">'+a.h.slice().reverse().map(function(x){return '<div class="rv"><span>'+esc(x[1])+'</span><span>'+esc(x[0])+'</span></div>';}).join('')+'</div></section>';
 var dirA=arqDireto(a),conf=!dirA&&a.or==='cli'&&(a.st==='enviado'||a.st==='analise'),gui=typeof a.gi==='number'&&a.or==='cli';
 if(conf)h+='<div class="fld" id="dv-box" hidden><label class="fl" for="dv-mot">O que precisa ser corrigido?</label><textarea id="dv-mot" rows="3" placeholder="Ex.: O extrato está sem a última semana do mês"></textarea></div>';
 h+='<div class="fbar">';
 h+='<button type="button" class="cta ghost" data-dl>'+IC.down16+' Baixar arquivo</button>';
 if(conf)h+='<button type="button" class="cta" data-dconf>'+IC.check16+' '+(gui?'Conferir e dar baixa na guia':'Marcar como conferido')+'</button><div class="g2b">'+(a.st==='enviado'?'<button type="button" class="wb" data-dana>Iniciar conferência</button>':'<button type="button" class="wb" data-dlo>Abrir em outra aba</button>')+'<button type="button" class="wb" data-ddev>Devolver ao cliente</button></div>';
 else h+=(dirA?'<button type="button" class="cta ghost" data-go="chat-'+e.id+'">'+IC.chat+' Chamar o cliente</button>':'');
 h+='</div>';done();CTX={e:e.id,a:a.id};return h;}
/* o cliente marcou a guia como paga: ao abrir o pedido ou o comprovante, o contador já conclui (comprovante conferido e baixa da guia) */
function guiaPagaConclui(p,a0){var L=p?arqDoPed(p.id).filter(function(a){return a.or==='cli'&&a.st!=='ok';}):[],bx=0;if(a0&&L.indexOf(a0)<0)L.push(a0);
 L.forEach(function(a){var gi=a.gi;arqMove(a,'ok','Conferido ao abrir');if(typeof gi==='number'){baixaGuia(gi);bx=1;}});
 if(p&&!bx){var gi=guiaIdxPed(p);if(gi>-1&&ST.pagas[gi])baixaGuia(gi);}
 if(p&&p.st!=='ok'){p.st='ok';p.vis=p.vis||agora();p.resp=p.resp||[];p.resp.push(['Pagamento conferido pelo escritório',agora()]);p.rsn=(p.rsn||0)+1;avisar('Pedido concluído',p.tipo+(p.quem?' · '+p.quem:''),'ped-'+p.id);ativ('Guia paga conferida · '+(p.quem||''));}}
function baixaGuia(i){var g=GU[i];if(!g)return;var pago=ST.pagas[i]||hoje();GU.splice(i,1);GU_PG.unshift([g.n,g.c,g.v,pago]);var np={};Object.keys(ST.pagas).forEach(function(k){var n=+k;if(n<i)np[n]=ST.pagas[k];else if(n>i)np[n-1]=ST.pagas[k];});ST.pagas=np;
 arqList().forEach(function(a){if(typeof a.gi!=='number')return;if(a.gi===i){if(a.or==='ct')arqMove(a,'paga','Guia paga');delete a.gi;}else if(a.gi>i)a.gi--;});
 avisar('Pagamento confirmado',g.n+' · R$ '+g.v,'guias');ativ('Baixa da guia '+g.n.split(' · ')[0]+' de '+g.c);}
function docAct(k){var c=CTX;if(!c||!c.a)return;var e=B(c.e),a=arqGet(c.a);if(!a)return;
 if(k==='ana'){arqMove(a,'analise','Em conferência pelo escritório');commit('Conferência iniciada');return;}
 if(k==='conf'){var gi=a.gi;arqMove(a,'ok','Conferido pelo escritório');if(a.or==='cli'&&typeof gi==='number')baixaGuia(gi);
  var ped=a.ped&&ST.ped.filter(function(x){return x.id===a.ped;})[0];
  if(ped&&ped.st==='enviado'){var rest=arqDoPed(ped.id).filter(function(x){return x.or==='cli'&&x.st!=='ok';});if(!rest.length&&['extrato','notas','comprovante','enviar','solicitado','despesas'].indexOf(ped.f)>-1){ped.st='ok';avisar('Pedido concluído',ped.tipo,'ped-'+ped.id);}}
  ativ(a.n+' conferido');commit(typeof gi==='number'?'Conferido e baixa registrada':'Documento conferido');return;}
 if(k==='devopen'){var bx=$('dv-box');if(bx){bx.hidden=false;var t=$('dv-mot');t&&t.focus();var bt=SCR.querySelector('[data-ddev]');if(bt){bt.textContent='Enviar devolução';bt.setAttribute('data-ddevok','');bt.removeAttribute('data-ddev');}}return;}
 if(k==='dev'){var m=(($('dv-mot')||{}).value||'').trim();if(!m){toast('Diga o que precisa ser corrigido');$('dv-mot')&&$('dv-mot').focus();return;}
  arqMove(a,'dev','Devolvido: '+m,{mot:m});avisar('O contador devolveu um arquivo',a.n+' · '+m,'arq-'+a.id);ST.chat.push({me:0,t:'Devolvi "'+a.n+'": '+m,h:agora(),go:'arq-'+a.id,gl:'Ver arquivo'});ST.unread=(ST.unread||0)+1;
  var ped2=a.ped&&ST.ped.filter(function(x){return x.id===a.ped;})[0];if(ped2&&ped2.st!=='ok'){ped2.st='voce';ped2.pede='Corrija e envie de novo: '+a.n+'. '+m;}
  commit('Devolvido ao cliente');return;}}
/* ===== recebidos ===== */
function vReceb(){var h=hdr('Recebidos','O que os clientes enviaram e falta conferir')+empChips('femp',UI.fEmp,1);var L=[],F=[],C=[];
 emps().forEach(function(e){B(e.id);arqCofre(ST);aConferir().forEach(function(a){L.push([e,a]);});folhasFechar().forEach(function(f){F.push([e,f]);});
  Object.keys(ST.cofre||{}).forEach(function(c){var x=ST.cofre[c];if(x&&x.notas&&x.notas.length&&cofreStOf(ST,c)==='aberto')C.push([e,c,x.notas.length]);});});done();
 h+='<section>'+sec('Documentos para conferir','<span class="s">'+L.length+'</span>')+'<div class="card">'+(L.map(function(x){return docRow(x[0],x[1],1);}).join('')||'<p class="empty">Nenhum documento esperando conferência.</p>')+'</div></section>';
 h+='<section>'+sec('Folhas para fechar','<span class="s">'+F.length+'</span>')+'<div class="card">'+(F.map(function(x){return folhaRow(x[0],x[1],1);}).join('')||'<p class="empty">Nenhuma folha esperando.</p>')+'</div></section>';
 if(C.length)h+='<section>'+sec('Cofres ainda abertos')+'<div class="card">'+C.map(function(x){return '<div class="r">'+esw(x[0],1)+'<span class="rt"><span class="a">Cofre de notas · '+esc(cMes(x[1]))+'</span><span class="b">'+esc(x[0].fant||x[0].nome)+' · '+x[2]+(x[2]===1?' nota carregada':' notas carregadas')+' · chega até '+fmtP(prazo('notas',x[1]))+'</span></span>'+pill('neutral','No cofre')+'</div>';}).join('')+'</div><p class="foot">As notas chegam para você quando o cliente encerra o cofre ou no fim do prazo.</p></section>';
 return h;}
var FSTL={rascunho:['Rascunho','neutral'],finalizada:['Finalizada','neutral'],enviada:['Para fechar','warn'],auto:['Para fechar','warn'],fechada:['Fechada','ok']};
function folhaRow(e,f,showE){var x=fst(f),s=FSTL[x]||FSTL.rascunho;return '<button type="button" class="r" data-go="folha-'+e.id+'|'+f.id+'">'+(showE?esw(e,1):'<span class="ri">'+IC['var']+'</span>')+'<span class="rt"><span class="a">'+esc(f.func)+' · '+esc(f.tipo)+'</span><span class="b">'+esc((showE?(e.fant||e.nome)+' · ':'')+f.comp)+(x==='auto'?' · enviada no prazo automático':'')+'</span></span>'+pill(s[1],s[0])+'</button>';}
function vFolha(x){var q=x.split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var f=getFolha(q[1]);if(!f){done();return null;}var es=fst(f),s=FSTL[es],vt=varsTxt(f.vars);
 var at={rascunho:1,finalizada:1,enviada:2,auto:2,fechada:4}[es],fs=[['Folha criada pelo cliente',f.criada||f.data],[es==='auto'?'Enviada automaticamente no prazo':'Variáveis enviadas',es==='enviada'||es==='fechada'?f.data:es==='auto'?fmtP(prazo('folha',f.comp)):''],['Você fechando a folha',''],['Holerite disponível ao cliente','']];
 var rcF=(ST.rec||[]).filter(function(r){return r.quem===f.func&&recAl(r)==='c'&&recAtivo(r,f.comp);}),vtF=recVT(f.func),recBox=(rcF.length||vtF)?'<div class="note"><b>Recorrência de '+esc(f.func)+'</b>'+(vtF?'<br>− Vale-transporte · R$ '+esc(vtF.v)+'/dia':'')+rcF.map(function(r){var rp=recParc(r,f.comp);return '<br>'+(recSinal(r.tipo)==='-'?'− ':'+ ')+esc(r.tipo)+' · R$ '+esc(r.valor)+(rp.t?' · parcela '+rp.n+' de '+rp.t:'');}).join('')+'</div>':'';var h=hdr(f.func+' · '+f.tipo,e.fant||e.nome)+recBox+(f.retro?'<div class="note"><b>Folha retroativa de '+esc(cMes(f.comp))+'</b> · lançada em '+esc(f.criada||'')+'<br>'+esc(f.motivo||'')+'</div>':'')+'<div class="card pad"><div class="pt"><span class="ri">'+IC['var']+'</span><span class="rt"><span class="a">Folha de '+esc(f.comp)+'</span><span class="b">'+esc((FUNCD[f.func]||{}).c||'')+'</span></span>'+pill(s[1],s[0])+'</div></div>';
 h+='<section>'+sec('Acompanhamento')+tline(fs,at)+'</section>';
 h+='<section>'+sec('Variáveis lançadas')+'<div class="rs">'+(f.sem?'<div class="rv"><span>Variáveis</span><span>Sem variáveis neste mês</span></div>':vt.length?vt.map(function(t){var p=t.split(': ');return '<div class="rv"><span>'+esc(p[0])+'</span><span>'+esc(p.slice(1).join(': ')||'Sim')+'</span></div>';}).join(''):'<div class="rv"><span>Variáveis</span><span>Nenhuma</span></div>')+(f.obs?'<div class="rv"><span>Observação</span><span>'+esc(f.obs)+'</span></div>':'')+'</div></section>';
 var AQ=arqList().filter(function(a){return a.cat==='folha'&&a.fid===f.id;});if(AQ.length)h+='<section>'+sec('Arquivos')+'<div class="card">'+AQ.map(function(a){return docRow(e,a);}).join('')+'</div></section>';
 h+='<div class="fbar">'+((es==='enviada'||es==='auto')?'<button type="button" class="cta" data-fecha="'+e.id+'|'+f.id+'">'+IC.check16+' Fechar folha e liberar holerite</button>':es==='fechada'?'<div class="note">Folha fechada. O holerite está no app do cliente.</div>':'<div class="note">O cliente ainda não enviou esta folha.</div>')+'</div>';done();return h;}
/* ===== arquivo ===== */
/* competência da tela Documentos: abre sempre no mês do sistema; as pastas contam só o que é desse mês */
var ARQC='';
function arqComp(){var n=NOW();return ARQC&&gcOk(ARQC)?ARQC:cName(n.getFullYear(),n.getMonth());}
function arqEmp(){var e=eById(UI.arqEmp)||MULTI.emps[0];UI.arqEmp=e.id;return e;}
function vArquivo(){var e=arqEmp();B(e.id);arqCofre(ST);var L=arqList(),q=(UI.q||'').toLowerCase().trim();
 var h='<div class="hhd"><div class="hrow" style="justify-content:flex-start"><button type="button" class="bk" data-back aria-label="Voltar">'+IC.back+'</button><button type="button" class="empsw" data-aemp-open aria-haspopup="dialog">'+esw(e,1)+'<span>'+esc(e.nome)+'</span>'+IC.chevd+'</button></div><div class="hrow"><h1 class="big">Documentos</h1></div></div>';
 h+='<button type="button" class="perbtn" data-arqper aria-haspopup="dialog" style="margin:0 0 14px"><span class="pl">Competência</span><b>'+esc(arqComp())+'</b>'+IC.cal+'</button>';
 h+='<label class="srch">'+(IC.search||'')+'<input id="arq-q" type="search" placeholder="Buscar em '+esc(e.fant||e.nome)+'" autocomplete="off" value="'+esc(UI.q||'')+'"></label>';
 if(q){var R=L.filter(function(a){return (a.n+' '+a.arq+' '+a.comp+' '+catOf(a.cat)[1]).toLowerCase().indexOf(q)>-1;});h+='<section>'+sec('Resultados','<span class="s">'+R.length+'</span>')+'<div class="card">'+(R.map(function(a){return docRow(e,a);}).join('')||'<p class="empty">Nada encontrado.</p>')+'</div></section>';done();return h;}
 var cp=arqComp(),fo=folhasOf().filter(function(f){return f.comp===cp;});
 h+='<section>'+sec('Pastas')+'<div class="g3 pastas">'+CATS.map(function(c){var l=L.filter(function(a){return a.cat===c[0]&&a.comp===cp;}),n=l.length,pc=l.filter(function(a){return a.or==='cli'&&(a.st==='enviado'||a.st==='analise');}).length;
  if(c[0]==='folha'){pc+=fo.filter(function(f){var x=fst(f);return x==='enviada'||x==='auto';}).length;n+=fo.filter(function(f){return fst(f)!=='rascunho';}).length;}
  return '<button type="button" class="t fo" data-go="pasta-'+e.id+'|'+c[0]+'"><span class="foh"><span class="ib">'+(IC[c[2]]||IC.folder)+'</span><span class="foi"><span class="tc">'+n+(n===1?' item':' itens')+'</span>'+(pc?'<span class="pfo">'+pc+' para conferir</span>':'')+'</span></span><span class="tl">'+c[1]+'</span></button>';}).join('')+'</div></section>';
 h+='<p class="foot">Caminho no armazenamento: '+esc(e.cnpj)+' / mês / pasta</p>';done();return h;}
function vPasta(x){var q=x.split('|'),e=eById(q[0]);if(!e)return null;B(e.id);var c=catOf(q[1]),k=c[0],og=UI.og;
 var L=arqList().filter(function(a){return a.cat===k&&(og==='all'||a.or===og);}),g={};L.forEach(function(a){(g[a.comp]=g[a.comp]||{d:[],f:[]}).d.push(a);});
 if(k==='folha'&&og!=='ct')folhasOf().forEach(function(f){if(fst(f)==='rascunho')return;(g[f.comp]=g[f.comp]||{d:[],f:[]}).f.push(f);});
 var cofres=k==='notas'?Object.keys(ST.cofre||{}).filter(function(cc){var y=ST.cofre[cc];return y&&y.notas&&y.notas.length&&cofreStOf(ST,cc)==='aberto';}):[];
 var cs=Object.keys(g).sort(function(a,b){return compOrd(b)-compOrd(a);});
 var h=hdr(c[1],e.fant||e.nome)+'<div class="chips">'+[['all','Todos'],['cli','Do cliente'],['ct','Do escritório']].map(function(o){return '<button type="button" class="chip'+(og===o[0]?' on':'')+'" data-og="'+o[0]+'">'+o[1]+'</button>';}).join('')+'</div>';
 h+='<div class="g2b"><button type="button" class="wb pri" data-go="novodoc-'+e.id+'|'+k+'">'+IC.up16+' Enviar para esta pasta</button><button type="button" class="wb" data-go="arquivo">'+IC.folder+' Outras pastas</button></div>';
 if(cofres.length)h+=cofres.map(function(cc){var n=ST.cofre[cc].notas.length;return '<div class="note">Cofre de '+esc(cMes(cc))+' ainda aberto: '+n+(n===1?' nota carregada':' notas carregadas')+'. Elas chegam aqui quando o cliente encerrar ou em '+fmtP(prazo('notas',cc))+'.</div>';}).join('');
 h+=cs.length?cs.map(function(cp){var G=g[cp];return '<section>'+sec(cp,'<span class="s">'+(G.d.length+G.f.length)+'</span>')+'<div class="card">'+G.f.map(function(f){return folhaRow(e,f);}).join('')+G.d.map(function(a){return docRow(e,a);}).join('')+'</div></section>';}).join(''):'<div class="card"><p class="empty">Nenhum arquivo nesta pasta'+(og!=='all'?' com este filtro':'')+'.</p></div>';
 if(k==='interno')h+='<p class="foot">Esta pasta não aparece para o cliente.</p>';
 done();return h;}
/* ===== chat: mesmo visual e funcionamento do app do cliente, ensinando o sistema do contador ===== */
var CH_SIS='LivTask',cPend=null,SIS_TTL=48*36e5;
function isChat(){return head(cur)==='chat'||cur==='msg';}
function cChDef(){var b=null;MULTI.emps.forEach(function(e){if(b)return;B(e.id);if(clientMsgs(ST)-(LIDAS[e.id]||0)>0)b=e.id;});done();return b||MULTI.emps[0].id;}
function cMsgs(k,id){if(k==='sis'){UI.chatSis=UI.chatSis||[];return UI.chatSis;}B(id||UI.chatEmp);var L=ST.chat=ST.chat||[];done();return L;}
/* LivTask: cada mensagem guarda a hora do envio e some 48 h depois; a conversa com o cliente nunca é apagada */
function cSisLimpa(){var L=cMsgs('sis'),ag=Date.now();L.forEach(function(m){if(!m.ts)m.ts=ag;});var K=L.filter(function(m){return ag-m.ts<SIS_TTL;});if(K.length!==L.length){UI.chatSis=K;keep();}}
function cBub(m,ix,C,nm){var sis=C==='sis',me=sis?!!m.me:!m.me,x='';
 if(sis&&m.opts&&m.opts.length)x+='<div class="faqopts">'+m.opts.map(function(q){return '<button type="button" class="faqo" data-faqpick="'+esc(q)+'">'+esc(q)+'</button>';}).join('')+'</div>';
 if(sis&&m.sim)x+='<div class="faqopts"><button type="button" class="faqo sim" data-faqsim="'+ix+'">Ver perguntas parecidas</button></div>';
 return '<div class="msg'+(me?' me':'')+'" data-mi="'+ix+'"><div class="bb">'+esc(m.t)+(m.go&&m.gl?(sis?'<button type="button" class="bl" data-go="'+m.go+'">'+esc(m.gl)+' '+IC.chev16+'</button>':'<span class="bl">'+esc(m.gl)+'</span>'):'')+'</div>'+x+'<span class="mh">'+esc((!me&&!sis?nm+' · ':'')+m.h)+'</span></div>';}
function vMsg(){return vChat('');}
function vChat(id){var e=eById(id)||eById(UI.chatEmp)||eById(cChDef());if(!e)return null;UI.chatEmp=e.id;var C=UI.cht==='sis'?'sis':'ct',nm=e.fant||e.nome;
 cSisLimpa();var L=cMsgs(C,e.id);if(C==='ct'){B(e.id);LIDAS[e.id]=clientMsgs(ST);done();}keep();
 var many=MULTI.emps.length>1,tab=function(k,t){return '<button type="button" class="cht cht-'+k+(C===k?' on':'')+'" role="tab" aria-selected="'+(C===k)+'" data-cht="'+k+'"><b>'+t+'</b>'+(k==='ct'&&many&&C==='ct'?'<span class="chv">'+IC.chevd+'</span>':'')+'</button>';};
 var h='<div class="dhd chd chtop"><button type="button" class="bk" data-back aria-label="Voltar">'+IC.back+'</button><div class="chtabs" role="tablist">'+tab('ct',esc(nm))+'<button type="button" class="chplus" data-chfan aria-expanded="false" aria-label="Abrir menu">'+IC.plus+'</button>'+tab('sis',CH_SIS)+'</div><i class="chsp" aria-hidden="true"></i></div>';
 var info=C==='ct'?'Aqui você fala com '+esc(nm)+': pedidos, documentos, guias e o dia a dia.'+(many?' Toque no nome para trocar de cliente.':'')+' Dúvidas de como usar o app vão para o '+CH_SIS+'.':'Aqui você tira dúvidas de como usar o app do contador, com base na Ajuda. Estas mensagens somem em 48 horas. As conversas com os clientes ficam guardadas.';
 h+='<div class="msgs" id="msgs"><div class="chinfo chi-'+C+'">'+info+'</div>'+L.map(function(m,i){return cBub(m,i,C,nm);}).join('')+'</div>';
 var ln=C==='ct'&&QL?LINKS.filter(function(x){return x[0]===QL;})[0]:null;
 if(ln)h+='<div class="chroute"><p>Atalho junto da mensagem: '+esc(ln[1])+'. O cliente toca e abre a tela.</p><div class="g2b"><button type="button" class="wb" data-chql="">Tirar atalho</button></div></div>';
 if(cPend)h+='<div class="chroute"><p>'+esc(cPend.why)+'</p><div class="g2b"><button type="button" class="wb pri" data-chroute="1">Ver resposta no '+CH_SIS+'</button><button type="button" class="wb" data-chkeep="1">Enviar ao cliente mesmo assim</button></div></div>';
 h+='<div class="cwho cw-'+C+'">Falando com <b>'+(C==='ct'?esc(nm):'o sistema')+'</b></div>';
 h+='<form class="cbar" id="cform"><div class="cin"><button type="button" class="ce" data-chemo aria-label="Emojis">'+CH_ICO_EMO+'</button><textarea id="cmsg" rows="1" placeholder="'+(C==='ct'?'Escreva para '+esc(nm):'Pergunte sobre o app')+'" autocomplete="off" enterkeyhint="enter"></textarea>'+(C==='ct'?'<button type="button" class="ca" data-chql="open" aria-label="Anexar atalho para uma tela do cliente">'+IC.clip+'</button>':'')+'</div><button type="submit" class="cs" aria-label="Enviar">'+IC.send+'</button><div class="chemo" hidden></div></form>';
 CTX={chat:e.id};return h;}
function cSisResp(t){var R=faqBusca(t),b=R[0];
 if(b&&b.r>=0.5)return faqBot(b.i,R.slice(1).filter(function(x){return x.r>=0.25;}).slice(0,4).map(function(x){return FAQ[x.i][0];}));
 var top=R.filter(function(x){return x.r>=0.2;}).slice(0,4);
 if(top.length)return {me:0,t:'Encontrei estas perguntas parecidas na Ajuda do app. Toque na que for a sua:',h:horaAgora(),opts:top.map(function(x){return FAQ[x.i][0];})};
 return {me:0,t:'Não achei essa dúvida na Ajuda do app. Se for sobre um cliente, fale com ele pela conversa.',h:horaAgora()};}
function cFim(){done();save();rerender();}
function cAdd(C,t){if(C==='sis'){var ts=Date.now(),r=cSisResp(t);r.ts=ts;UI.chatSis=UI.chatSis||[];UI.chatSis.push({me:1,t:t,h:horaAgora(),ts:ts},r);keep();return;}
 B(UI.chatEmp);var m={me:0,t:t,h:agora()},ln=LINKS.filter(function(x){return x[0]===QL;})[0];if(QL&&ln){m.go=QL;m.gl=ln[1];}
 ST.chat=ST.chat||[];ST.chat.push(m);ST.unread=(ST.unread||0)+1;QL='';}
function sendMsg(){var ta=$('cmsg');if(!ta)return;var t=(ta.value||'').trim();if(!t)return;var C=UI.cht==='sis'?'sis':'ct';
 if(C==='ct'&&chatRota(t)==='sis'){var r0=faqBusca(t)[0];cPend={text:t,why:'Essa parece uma dúvida sobre como usar o app'+(r0&&r0.r>=0.22?': “'+FAQ[r0.i][0]+'”':'')+'. Quer ver a resposta no '+CH_SIS+'?'};ta.value='';rerender();return;}
 cPend=null;ta.value='';cAdd(C,t);cFim();}
function cRoute(keepHere){if(!cPend)return;var x=cPend.text;cPend=null;if(keepHere)cAdd('ct',x);else{UI.cht='sis';keep();cAdd('sis',x);}cFim();}
function cFaqPick(q){var i=faqIdx(q);if(i<0)return;var L=cMsgs('sis'),R=faqBusca(q).filter(function(x){return x.i!==i&&x.r>=0.25;}).slice(0,4).map(function(x){return FAQ[x.i][0];}),ts=Date.now(),b=faqBot(i,R);b.ts=ts;L.push({me:1,t:q,h:horaAgora(),ts:ts});L.push(b);keep();rerender();}
function cFaqSim(ix){var L=cMsgs('sis'),m=L[ix];if(!m||!m.simList)return;L.push({me:0,t:'Perguntas parecidas. Toque na que for a sua:',h:horaAgora(),ts:Date.now(),opts:m.simList.slice()});m.sim=0;keep();rerender();}
/* leque do + no topo do chat: atalhos para as telas principais */
function cFan(cx,cy){var I=[['inicio','Início',IC.home],['dp','DP',IC.people],['gestao','Gestão contábil',IC.receipt],['guias','Guias',IC.tax],['ajustes','Ajustes',CH_GEAR]],rx=Math.min(148,cx-42),ry=170;
 return '<div class="chfov"></div><div class="chfttl" style="top:'+Math.round(cy+72)+'px">Menu</div>'+I.map(function(x,i){var a=(160-i*35)*Math.PI/180;return '<button type="button" class="chfi" data-go="'+x[0]+'" style="left:'+Math.round(cx+Math.cos(a)*rx-36)+'px;top:'+Math.round(cy+Math.sin(a)*ry-36)+'px;--dx:'+Math.round(-Math.cos(a)*rx)+'px;--dy:'+Math.round(-Math.sin(a)*ry)+'px"><span>'+x[2]+'</span><span'+(x[1].length>10&&x[1].indexOf(' ')<0?' class="lg"':'')+'>'+x[1]+'</span></button>';}).join('')+
 '<button type="button" class="chfx" data-chfan aria-label="Fechar menu" style="left:'+Math.round(cx-22)+'px;top:'+Math.round(cy-22)+'px">'+IC.plus+'</button>';}
function chFan(on){var w=$('chfanw'),b=SCR.querySelector('.chplus');if(on&&b){if(!w){w=document.createElement('div');w.id='chfanw';w.className='chfanw';P.appendChild(w);}
  var pb=P.getBoundingClientRect(),bb=b.getBoundingClientRect(),z=(pb.width/P.offsetWidth)||1;w.innerHTML=cFan((bb.left+bb.width/2-pb.left)/z,(bb.top+bb.height/2-pb.top)/z);void w.offsetWidth;}
 P.classList.toggle('chfan-on',!!(on&&b));if(b)b.setAttribute('aria-expanded',on?'true':'false');}
/* toque numa mensagem (ou segurar, no celular): copiar a mensagem ou a conversa */
function chCopiaAlt(txt,fim){var t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');t.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.appendChild(t);t.select();try{t.setSelectionRange(0,txt.length);}catch(e){}var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();if(ok)fim();else toast('Não foi possível copiar neste navegador');}
function chCopia(txt,msg){var fim=function(){toast(msg);};try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(fim,function(){chCopiaAlt(txt,fim);});return;}}catch(e){}chCopiaAlt(txt,fim);}
function chConversa(C){var e=eById(UI.chatEmp)||{},nm=e.fant||e.nome||'Cliente';return cMsgs(C).map(function(m){var me=C==='sis'?!!m.me:!m.me;return '['+m.h+'] '+(me?'Você':C==='sis'?CH_SIS:nm)+': '+m.t;}).join('\n');}
function chMenuFecha(){var w=$('chmw');if(w)w.remove();[].forEach.call(SCR.querySelectorAll('.msg.chsel'),function(x){x.classList.remove('chsel');});}
function chMenu(msg){var C=UI.cht==='sis'?'sis':'ct',m=cMsgs(C)[+msg.dataset.mi];if(!m)return;chMenuFecha();msg.classList.add('chsel');
 var w=document.createElement('div');w.id='chmw';w.className='chmw';w.dataset.mi=msg.dataset.mi;w.dataset.c=C;
 w.innerHTML='<div class="chmov" data-chmx></div><div class="chmc" role="menu"><button type="button" class="chma" data-chcopy="m">'+IC.copy15+'<span>Copiar mensagem</span></button><button type="button" class="chma" data-chcopy="c">'+IC.copy15+'<span>Copiar conversa</span></button></div>';
 P.appendChild(w);
 var c=w.querySelector('.chmc'),pb=P.getBoundingClientRect(),z=(pb.width/P.offsetWidth)||1,bb=msg.querySelector('.bb').getBoundingClientRect(),pw=P.offsetWidth,ph=P.offsetHeight,cw=c.offsetWidth,ch=c.offsetHeight,me=msg.classList.contains('me'),
  l=me?(bb.right-pb.left)/z-cw:(bb.left-pb.left)/z,t=(bb.bottom-pb.top)/z+8;
 l=Math.max(12,Math.min(l,pw-cw-12));if(t+ch>ph-12)t=(bb.top-pb.top)/z-ch-8;t=Math.max(70,Math.min(t,ph-ch-12));
 c.style.left=Math.round(l)+'px';c.style.top=Math.round(t)+'px';}
/* painel de emojis no lugar do teclado, Enter envia no computador e o campo cresce até 5 linhas */
var CHE={on:0,tom:0,sel:null,html:{}},CHE_ICO=['🕘','😀','🐻','🍔','⚽','🚗','💡','🔣','🏳️'],CHE_TONS=['✋','✋🏻','✋🏼','✋🏽','✋🏾','✋🏿'];
function cheRec(){try{return JSON.parse(localStorage.getItem('chEmoRec')||'[]')||[];}catch(e){return [];}}
function cheTom(e){var t=CHE.tom&&CH_TOM[e];return t?t.split('|')[CHE.tom-1]:e;}
function cheGrade(L){return L.map(function(e){return '<span data-emo="'+e+'">'+cheTom(e)+'</span>';}).join('');}
function cheCorpo(){var r=cheRec(),h='<div class="ches" data-ches="0"><div class="chet">Recentes</div>'+(r.length?'<div class="cheg">'+cheGrade(r)+'</div>':'<p class="chev">Os emojis que você usar aparecem aqui.</p>')+'</div>';
 if(!CHE.html[CHE.tom])CHE.html[CHE.tom]=CH_EMO.map(function(g,i){return '<div class="ches" data-ches="'+(i+1)+'"><div class="chet">'+g[0]+'</div><div class="cheg">'+cheGrade(g[1].split('|'))+'</div></div>';}).join('');return h+CHE.html[CHE.tom];}
function chePinta(){var pn=SCR.querySelector('.chemo');if(!pn)return;var bt=SCR.querySelector('[data-chemo]');P.classList.toggle('cheon',!!CHE.on);if(bt){bt.innerHTML=CHE.on?CH_ICO_TEC:CH_ICO_EMO;bt.setAttribute('aria-label',CHE.on?'Teclado':'Emojis');}
 if(!CHE.on){pn.hidden=true;return;}
 if(!pn.firstChild)pn.innerHTML='<div class="chetabs" role="tablist">'+CHE_ICO.map(function(c,i){return '<button type="button" data-chetab="'+i+'" aria-label="'+(i?CH_EMO[i-1][0]:'Recentes')+'">'+c+'</button>';}).join('')+'<button type="button" class="chetom" data-chetom title="Tom de pele" aria-label="Tom de pele">'+CHE_TONS[CHE.tom]+'</button></div><div class="chebody">'+cheCorpo()+'</div>';
 pn.hidden=false;var b=pn.querySelector('.chebody');
 if(b&&!b.dataset.ok){b.dataset.ok=1;var marca=function(){var at=0;[].forEach.call(b.querySelectorAll('.ches'),function(x){if(x.offsetTop-6<=b.scrollTop)at=+x.dataset.ches;});[].forEach.call(pn.querySelectorAll('[data-chetab]'),function(t){t.classList.toggle('on',+t.dataset.chetab===at);});};
  if(!cheRec().length){var s1=b.querySelector('[data-ches="1"]');if(s1)b.scrollTop=s1.offsetTop;}marca();b.addEventListener('scroll',marca,{passive:true});}}
function cheCresce(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,120)+'px';}
function cheInsere(e){var t=$('cmsg');if(!t)return;var v=t.value,a=CHE.sel?CHE.sel[0]:v.length,b=CHE.sel?CHE.sel[1]:v.length;t.value=v.slice(0,a)+e+v.slice(b);CHE.sel=[a+e.length,a+e.length];cheCresce(t);
 var r=cheRec().filter(function(x){return x!==e;});r.unshift(e);try{localStorage.setItem('chEmoRec',JSON.stringify(r.slice(0,32)));}catch(x){}}
function chKb(){var on=isChat()&&document.activeElement&&document.activeElement.id==='cmsg',vv=window.visualViewport;P.classList.toggle('chkb',on);
 if(on&&vv&&document.documentElement.clientWidth<=520&&vv.height<window.innerHeight-40)P.style.height=vv.height+'px';else P.style.height='';if(on){window.scrollTo(0,0);requestAnimationFrame(function(){window.scrollTo(0,0);});SCR.scrollTop=SCR.scrollHeight;}}
document.addEventListener('click',function(e){var t=e.target,w=$('chmw');
 var b=t.closest&&t.closest('[data-chfan]');if(b){chFan(!P.classList.contains('chfan-on'));return;}
 if(P.classList.contains('chfan-on')&&(t.closest('.chfi')||t.closest('.chfov')))chFan(false);
 if(w){var a=t.closest&&t.closest('[data-chcopy],[data-chmx]');if(!a)return;
  if(a.hasAttribute('data-chcopy')){var C=w.dataset.c,m=cMsgs(C)[+w.dataset.mi];chMenuFecha();if(a.dataset.chcopy==='m'){if(m)chCopia(String(m.t||''),'Mensagem copiada');}else chCopia(chConversa(C),'Conversa copiada');return;}
  chMenuFecha();return;}
 if(!isChat())return;
 var c=t.closest&&t.closest('[data-cht],[data-chroute],[data-chkeep],[data-chql],[data-faqpick],[data-faqsim],[data-chemo],[data-emo],[data-chetab],[data-chetom]');
 if(c){
  if(c.hasAttribute('data-cht')){var k=c.dataset.cht;if(k==='ct'&&UI.cht!=='sis'&&MULTI.emps.length>1){openEmp(UI.chatEmp,function(id){UI.chatEmp=id;keep();rerender();},{t:'Escolher cliente',sub:'Com qual cliente quer conversar?'});return;}
   UI.cht=k;cPend=null;keep();rerender();return;}
  if(c.hasAttribute('data-chroute')){cRoute(false);return;}
  if(c.hasAttribute('data-chkeep')){cRoute(true);return;}
  if(c.hasAttribute('data-chql')){if(c.dataset.chql==='open'){openPick('Atalho para uma tela do cliente',LINKS.map(function(l){return [l[0],l[1]];}),QL,function(v){QL=v;rerender();});}else{QL='';rerender();}return;}
  if(c.hasAttribute('data-faqpick')){cFaqPick(c.dataset.faqpick);return;}
  if(c.hasAttribute('data-faqsim')){cFaqSim(+c.dataset.faqsim);return;}
  if(c.hasAttribute('data-chemo')){var ta=$('cmsg');CHE.on=CHE.on?0:1;if(CHE.on){if(ta&&document.activeElement===ta)CHE.sel=[ta.selectionStart,ta.selectionEnd];if(ta)ta.blur();chePinta();}else{chePinta();if(ta){ta.focus();if(CHE.sel)ta.setSelectionRange(CHE.sel[0],CHE.sel[1]);}}return;}
  if(c.hasAttribute('data-emo')){cheInsere(c.textContent);return;}
  if(c.hasAttribute('data-chetab')){var bd=SCR.querySelector('.chebody'),sc=bd&&bd.querySelector('[data-ches="'+c.dataset.chetab+'"]');if(sc)bd.scrollTop=sc.offsetTop;return;}
  if(c.hasAttribute('data-chetom')){CHE.tom=(CHE.tom+1)%6;var pn=SCR.querySelector('.chemo');if(pn){var y=pn.querySelector('.chebody').scrollTop;pn.innerHTML='';chePinta();pn.querySelector('.chebody').scrollTop=y;}return;}}
 var bb=t.closest&&t.closest('.msgs .msg .bb');if(bb&&!t.closest('button,a'))chMenu(bb.parentElement);},true);
document.addEventListener('contextmenu',function(e){if(!isChat())return;var bb=e.target.closest&&e.target.closest('.msgs .msg .bb');if(!bb)return;e.preventDefault();chMenu(bb.parentElement);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')chMenuFecha();var t=e.target;if(t.id!=='cmsg'||e.key!=='Enter'||e.shiftKey||e.isComposing)return;if(window.matchMedia&&matchMedia('(pointer:coarse)').matches)return;e.preventDefault();var f=$('cform');if(f){if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));}});
document.addEventListener('input',function(e){if(e.target.id==='cmsg'){CHE.sel=null;cheCresce(e.target);}if(e.target.id==='busca-faq')filtraFaq(e.target.value);});
document.addEventListener('focusin',function(e){if(e.target.id==='cmsg'){if(CHE.on){CHE.on=0;CHE.sel=null;chePinta();}setTimeout(chKb,60);}});
document.addEventListener('focusout',function(e){if(e.target.id==='cmsg')setTimeout(chKb,60);});
if(window.visualViewport){visualViewport.addEventListener('resize',function(){if(P.classList.contains('chkb'))chKb();});visualViewport.addEventListener('scroll',function(){if(P.classList.contains('chkb')&&window.scrollY)window.scrollTo(0,0);});}
/* a tela do chat é redesenhada a cada envio: reabre o painel de emojis se estava aberto e fecha tudo ao sair do chat */
new MutationObserver(function(){setTimeout(function(){if(!isChat()){CHE.on=0;P.classList.remove('cheon','chkb','chfan-on');chMenuFecha();var w=$('chfanw');if(w)w.remove();return;}if(CHE.on)chePinta();},0);}).observe(SCR,{childList:true});
(function(){var st=document.createElement('style');st.textContent='.phone.chat nav.tab,.phone.chat .fabov,.phone.chat .fabmenu{display:none}.phone.chat #c-scr>.msgs{flex:1 0 auto}.cht .chv{display:inline-flex;margin-left:4px;vertical-align:middle}.cht .chv svg{width:14px;height:14px}';document.head.appendChild(st);})();
var LINKS=[['','Sem atalho'],['guias','Abrir guias'],['f-extrato','Enviar extrato'],['f-notas','Carregar notas'],['folhas','Folhas'],['docs','Documentos'],['f-solicitado','Enviar documento pedido']],QL='';
/* ===== ajuda: mesmo modelo do app do cliente, com o passo a passo do app do contador ===== */
var CFAQ=[
['Para que serve o botão + no meio do menu?','1. Toque no + em qualquer tela.<br>2. Aparecem só as ações daquela tela. Na pasta de um cliente, por exemplo, aparecem Enviar para a pasta, Lançar guia e Pedir documento.<br>3. Toque na ação: a tela abre já com o cliente escolhido.','inicio','Ir para o Início','Primeiros passos'],
['O que mostram os botões da tela Início?','1. Departamento Pessoal, Gestão contábil, Guias de impostos e Pedidos mostram dentro do botão o que está pendente: Em dia, pedidos em aberto ou itens para conferir.<br>2. Toque no botão para abrir a tela.<br>3. Fechamento do mês, Recorrência, Enviar em lote e Documentos ficam logo abaixo.','inicio','Ir para o Início','Primeiros passos'],
['Como escolho o cliente nas telas?','1. Toque no campo Cliente, ou no nome do cliente no topo do Chat.<br>2. Abre uma janela pequena com a lista, em vez de ocupar a tela.<br>3. Toque no cliente (ou em Todos, nas telas que aceitam) e a janela fecha.','arquivo','Abrir Documentos','Primeiros passos'],
['Como volto, avanço e atualizo a tela deslizando o dedo?','1. Deslize o dedo para a esquerda para voltar à tela anterior.<br>2. Deslize para a direita para avançar de novo.<br>3. Puxe a tela para baixo, no topo, para atualizar com o que os clientes enviaram.','inicio','Ir para o Início','Primeiros passos'],
['Como baixo um arquivo que o cliente enviou?','1. Em Pedidos, Recebidos ou Documentos, toque no ícone de download ao lado do arquivo.<br>2. Ou abra o documento e toque em Baixar.<br>3. Para só olhar, toque em Abrir.','receb','Ver recebidos','Pedidos e documentos'],
['Como atendo um pedido do cliente?','1. Toque em Pedidos e escolha o pedido.<br>2. Veja os dados e os anexos, baixe o que precisar e responda ao cliente.<br>3. Mude o andamento do pedido: o cliente vê a mudança no app dele.','pedidos','Ver pedidos','Pedidos e documentos'],
['Como peço um documento ao cliente?','1. Toque em Pedir documento (no + ou na tela Início).<br>2. Escolha o cliente, diga qual documento e o prazo.<br>3. O cliente vê o pedido nas rotinas e em Documentos, e recebe a mensagem no chat.','novoped','Pedir documento','Pedidos e documentos'],
['Como envio um documento para o arquivo do cliente?','1. Toque em Enviar documento.<br>2. Escolha o cliente, a pasta, o mês e o arquivo.<br>3. Na pasta Internos do escritório o cliente não vê o documento.','novodoc','Enviar documento','Pedidos e documentos'],
['Como envio arquivos para vários clientes de uma vez?','1. Toque em Enviar em lote.<br>2. Escolha os arquivos: o app reconhece o cliente pelo nome do arquivo.<br>3. Confira a lista e envie.','lote','Enviar em lote','Pedidos e documentos'],
['Como lanço uma guia para o cliente?','1. Toque em Lançar guia.<br>2. Escolha o cliente, o imposto, a competência, o valor e o vencimento.<br>3. A guia aparece em Guias de impostos no app do cliente, e ele recebe um aviso.','novoguia','Lançar guia','Guias de impostos'],
['Como acompanho se o cliente pagou a guia?','1. Abra Guias de impostos.<br>2. Cada guia mostra se está a pagar, vencida ou paga. O cliente marca como paga e o comprovante é opcional; quando enviado, fica na pasta Recibos.<br>3. Com comprovante, abra-o e toque em Conferir e dar baixa para a guia ir para Pagas.<br>4. Guia paga não aceita pedido de recálculo nem de parcelamento, até o cliente desmarcar.','guias','Abrir guias','Guias de impostos'],
['O cliente pediu parcelamento, recálculo ou tem uma dúvida. E agora?','1. Em Guias de impostos, a guia aparece com a marca do pedido: Parcelamento, Recálculo ou Dúvida.<br>2. Abra o pedido: ele passa a aparecer como Visualizado para o cliente.<br>3. Toque em Responder ao cliente. Na janela, escreva a mensagem e use Pedir ação ao cliente, e, se precisar, carregue um novo arquivo da guia (opcional) e toque em Enviar. Se carregar, o novo arquivo substitui a guia anterior, que é apagada; sem arquivo, a guia atual continua valendo.<br>4. No recálculo, marque Cobrar para informar o valor.<br>5. Quando o app do cliente receber a resposta, o pedido mostra Recebido pelo cliente.','guias','Abrir guias','Guias de impostos'],
['Onde vejo os colaboradores dos meus clientes?','1. Toque em Departamento Pessoal.<br>2. Aparecem os colaboradores de todos os clientes, com a situação de cada um: ativo, em admissão ou desligado.<br>3. Toque no nome para abrir os dados em seções que expandem e retraem.','dp','Abrir o DP','Departamento Pessoal'],
['Como vejo o histórico de solicitações de um colaborador?','1. Abra o colaborador no Departamento Pessoal.<br>2. No fim da ficha está o Histórico de solicitações: admissão, férias, alterações e demissão.<br>3. O cliente vê o mesmo histórico no app dele.','dp','Abrir o DP','Departamento Pessoal'],
['Onde vejo os sócios e os pedidos de pró-labore e lucros?','1. Toque em Departamento Pessoal.<br>2. Em Sócios dos clientes estão todos os sócios, com a participação e o pró-labore. Toque num sócio para ver os dados e o histórico.<br>3. Em Pró-labore, lucros e sócios ficam os pedidos em aberto: pró-labore, divisão de lucros e inclusão de sócio.<br>4. Ao concluir um pedido de pró-labore, o valor passa para o sócio e aparece em Recorrência, na aba Sócios.','dp','Abrir DP','Departamento Pessoal'],
['Como fecho uma folha e libero o holerite?','1. Abra Recebidos e toque na folha enviada pelo cliente.<br>2. Confira as variáveis e toque em Fechar folha.<br>3. O holerite fica disponível para o cliente.','receb','Ver recebidos','Departamento Pessoal'],
['O que é a Recorrência do DP?','1. São descontos e pedidos que se repetem: adiantamentos, vale-transporte, convênio médico, farmácia, empréstimos, pensão alimentícia, contribuição sindical, pró-labore, divisão de lucros e outros.<br>2. No Departamento Pessoal, toque em Recorrência e escolha Colaboradores ou Sócios.<br>3. Em cada cliente, toque em Adicionar, escolha a pessoa, o lançamento, o valor, a frequência, o mês de início e, se tiver, o número de parcelas. Depois da última parcela o lançamento sai sozinho.<br>4. Vale-transporte e pró-labore pedidos pelo cliente entram sozinhos. Para tirar um lançamento, toque no X.<br>5. Os lançamentos dos colaboradores aparecem na folha de cada um.','rec-all','Abrir Recorrência','Departamento Pessoal'],
['Como expando ou recolho a lista de colaboradores e de sócios?','1. No Departamento Pessoal, toque em Expandir ao lado de Colaboradores dos clientes ou de Sócios dos clientes.<br>2. Para fechar, toque em Recolher. Recolhida, a lista mostra só o resumo.<br>3. O app lembra a escolha da próxima vez.','dp','Abrir DP','Departamento Pessoal'],
['Como acompanho o fechamento do mês?','1. Toque em Fechamento do mês.<br>2. A tabela mostra, por cliente, o que já chegou, o que está aberto e o que venceu.<br>3. Toque em Cobrar para mandar uma mensagem ao cliente com o que falta.','fecha','Ver fechamento','Gestão contábil'],
['Onde vejo as notas fiscais, extratos e despesas do cliente?','1. Toque em Gestão contábil.<br>2. Escolha o cliente e o mês.<br>3. Veja o cofre de notas, os extratos e as despesas, e baixe os arquivos.','gestao','Abrir gestão contábil','Gestão contábil'],
['Como converso com um cliente?','1. Toque em Chat no menu de baixo.<br>2. Toque no nome do cliente no topo para trocar de cliente.<br>3. Escreva e envie. Use o clipe para mandar junto um atalho: o cliente toca e abre a tela certa.','msg','Abrir o Chat','Chat e ajustes'],
['Para que serve o LivTask no Chat?','1. Toque em LivTask no topo do Chat.<br>2. Escreva sua dúvida de como usar o app: ele responde com a Ajuda.<br>3. Estas mensagens somem em 48 horas. As conversas com os clientes nunca são apagadas.','#sis','Perguntar no Chat','Chat e ajustes'],
['Como cadastro um cliente novo ou mudo a cor do app dele?','1. Toque em Novo cliente, ou em Ajustes › Clientes.<br>2. Preencha razão social, CNPJ e regime e escolha a cor do app.<br>3. Salve: o cliente já pode entrar no app dele.','cli-novo','Novo cliente','Chat e ajustes'],
['Como mudo os prazos de envio dos clientes?','1. Abra Ajustes.<br>2. Em Prazos de envio, escolha o dia em que folhas, notas, extratos e despesas encerram.<br>3. O prazo vale no app de todos os clientes.','ajustes','Abrir Ajustes','Chat e ajustes']];
var CFAQ_KW={'O que é a Recorrência do DP?':'recorrente recorrentes recorrencia fixo fixos mensal desconto descontos adiantamento vale transporte vt convenio medico plano saude odontologico farmacia emprestimo consignado pensao sindical prolabore lucros parcela parcelas','Como expando ou recolho a lista de colaboradores e de sócios?':'expandir recolher abrir fechar comprimir lista colaboradores socios esconder mostrar','Onde vejo os sócios e os pedidos de pró-labore e lucros?':'socio socios prolabore retirada lucro lucros distribuicao divisao dividendos participacao contrato social incluir','Como lanço uma guia para o cliente?':'imposto das darf boleto vencimento valor enviar guia','Como acompanho se o cliente pagou a guia?':'paga pago pagamento comprovante baixa vencida','O cliente pediu parcelamento, recálculo ou tem uma dúvida. E agora?':'parcelar parcela recalcular recalculo duvida pergunta','Onde vejo os colaboradores dos meus clientes?':'funcionarios empregados admissao cadastro readmissao dp','Como converso com um cliente?':'mensagem falar conversa mandar mensagem atalho','Para que serve o LivTask no Chat?':'sistema assistente duvida usar app ensinar','Como baixo um arquivo que o cliente enviou?':'download baixar abrir pdf nota arquivo anexo','Como envio arquivos para vários clientes de uma vez?':'varios muitos lote massa holerite guias','Como mudo os prazos de envio dos clientes?':'dia limite encerra configurar prazo','Como volto, avanço e atualizo a tela deslizando o dedo?':'arrastar gesto voltar avancar atualizar puxar'};
FAQ.length=0;Array.prototype.push.apply(FAQ,CFAQ);Object.keys(FAQ_KW).forEach(function(k){delete FAQ_KW[k];});for(var kq in CFAQ_KW)FAQ_KW[kq]=CFAQ_KW[kq];FQ_VOC=null;FQ_IDX=null;
function vAjuda(){var gs=[];FAQ.forEach(function(f){var g=f[4]||'Outras dúvidas';if(gs.indexOf(g)<0)gs.push(g);});
 return hdr('Ajuda','Passo a passo de cada função')+'<label class="srch">'+IC.search+'<input id="busca-faq" type="search" placeholder="Buscar na ajuda" autocomplete="off"></label>'+
 gs.map(function(g){return '<section class="faqg"><div class="sec"><h2>'+g+'</h2></div><div class="faq">'+FAQ.filter(function(f){return (f[4]||'Outras dúvidas')===g;}).map(function(f){return '<details data-fq="'+esc((f[0]+' '+f[1]).toLowerCase().replace(/<br>/g,' '))+'"><summary>'+f[0]+IC.chevd+'</summary><p>'+f[1].replace('dia 14','dia '+MULTI.cfg.docsDia).replace('2º dia útil',MULTI.cfg.folhaDU+'º dia útil')+'</p><button type="button" class="mini" '+(f[2]==='#sis'?'data-chsis="1"':'data-go="'+f[2]+'"')+'>'+f[3]+'</button></details>';}).join('')+'</div></section>';}).join('')+
 '<p class="empty" id="faq-vazio" hidden>Nada encontrado. Pergunte ao LivTask no Chat.</p><div class="fbar"><button type="button" class="cta ghost" data-chsis="1">Não achou? Pergunte no Chat</button></div>';}
/* ===== novos envios ===== */
function ctxE(a){var q=(a||'').split('|');return {e:eById(q[0])?q[0]:(UI.fEmp!=='all'?UI.fEmp:UI.arqEmp||MULTI.emps[0].id),k:q[1]};}
/* imposto enviado: o mesmo arquivo fica na pasta Impostos e em Guias de impostos (um registro só, ligado à guia) */
function guiaCampos(p,venc){return pickF(p+'-t','Imposto',TIPOS_GUIA.map(function(x){return [x,x];}),TIPOS_GUIA[0])+'<div class="fld"><label class="fl" for="'+p+'-v">Valor</label><div class="mon"><span>R$</span><input id="'+p+'-v" inputmode="numeric" placeholder="0,00" data-money></div></div>'+dateF(p+'-d','Vencimento',venc);}
function guiaVenc(){var n=NOW();return dInput(new Date(n.getFullYear(),n.getMonth()+1,20));}
function guiaArqErro(id){var ok=ftCat(catOf('guias')[1]),fx=$(id),bad=fx&&fx.files?[].filter.call(fx.files,function(x){return ok.indexOf(ftOf(x.name))<0;})[0]:null;return bad?'“'+bad.name+'” não é aceito em guias. Envie '+ftTxt(ok)+'.':'';}
function guiaTipo(nm){var l=String(nm).toLowerCase();return TIPOS_GUIA.filter(function(t){return l.indexOf(t.split(' ')[0].toLowerCase().replace(/[^a-z]/g,''))>-1;})[0]||TIPOS_GUIA[0];}
/* leitura do PDF da guia, no navegador e sem IA: o texto vem do pdf.js embutido (pdfleitor.js) e as regras abaixo acham imposto, competência, valor, vencimento, código de barras e Pix; o QR do Pix é lido da imagem da página (jsQR) */
function gbMod10(s){var t=0,p=2;for(var i=s.length-1;i>=0;i--){var x=+s[i]*p;t+=x>9?x-9:x;p=p===2?1:2;}return (10-t%10)%10;}
function gbMod11(s){var t=0,p=2;for(var i=s.length-1;i>=0;i--){t+=+s[i]*p;p=p===9?2:p+1;}return t%11;}
function gbArrDv(s,ref){var r;if(ref==='6'||ref==='7')return gbMod10(s);r=gbMod11(s);return r<2?0:11-r;}
function gbBancDv(b){var d=11-gbMod11(b.slice(0,4)+b.slice(5));return d===0||d>9?1:d;}
/* código de arrecadação (48 dígitos, começa com 8) e boleto bancário (47) a partir das 44 posições do código de barras */
function gbLinhaArr(b){var q=[];for(var i=0;i<4;i++){var s=b.substr(i*11,11);q.push(s+'-'+gbArrDv(s,b[2]));}return q.join(' ');}
function gbLinhaBanc(b){var c1=b.slice(0,4)+b.slice(19,24),c2=b.slice(24,34),c3=b.slice(34,44);
 return c1.slice(0,5)+'.'+c1.slice(5)+gbMod10(c1)+' '+c2.slice(0,5)+'.'+c2.slice(5)+gbMod10(c2)+' '+c3.slice(0,5)+'.'+c3.slice(5)+gbMod10(c3)+' '+b[4]+' '+b.slice(5,19);}
function gbArrOk(b){return b.length===44&&b[0]==='8'&&/[6789]/.test(b[2])&&+b[3]===gbArrDv(b.slice(0,3)+b.slice(4),b[2]);}
function gbBancOk(b){return b.length===44&&b[0]!=='8'&&+b[4]===gbBancDv(b);}
/* aceita a linha digitável (47 ou 48) ou o código de barras (44); devolve {b: 44 posições, linha, arr} ou null se os dígitos verificadores não batem */
function gbLer(d){d=String(d||'').replace(/\D/g,'');var b='';
 if(d.length===48&&d[0]==='8'){for(var i=0;i<4;i++){var s=d.substr(i*12,11);if(+d[i*12+11]!==gbArrDv(s,d[2]))return null;b+=s;}}
 else if(d.length===47){if(+d[9]!==gbMod10(d.slice(0,9))||+d[20]!==gbMod10(d.slice(10,20))||+d[31]!==gbMod10(d.slice(21,31)))return null;b=d.slice(0,4)+d[32]+d.slice(33,47)+d.slice(4,9)+d.slice(10,20)+d.slice(21,31);}
 else if(d.length===44)b=d;else return null;
 if(gbArrOk(b))return {b:b,linha:gbLinhaArr(b),arr:1};if(gbBancOk(b))return {b:b,linha:gbLinhaBanc(b),arr:0};return null;}
/* valor e vencimento que o próprio código traz: arrecadação com valor efetivo (3º dígito 6 ou 8) e boleto bancário (fator de vencimento, que recomeçou em 1000 em 22/02/2025) */
function gbValor(g){var v=g.arr?(/[68]/.test(g.b[2])?+g.b.slice(4,15):0):+g.b.slice(9,19);return v>0?maskMoney(String(v)):'';}
function gbVenc(g){if(g.arr)return null;var f=+g.b.slice(5,9);if(!f)return null;var n=NOW(),a=new Date(1997,9,7+f),b=new Date(2025,1,22+f-1000);return Math.abs(a-n)<Math.abs(b-n)?a:b;}
function gbCodigos(T){var out=[],vis={},rx=/\d[\d .\-]{38,80}\d/g,m;
 var tenta=function(d){[48,47,44].forEach(function(n){for(var i=0;i+n<=d.length;i++){var g=gbLer(d.substr(i,n));if(g&&!vis[g.b]){vis[g.b]=1;out.push(g);}}});};
 while((m=rx.exec(T)))tenta(m[0].replace(/\D/g,''));return out;}
/* Pix copia e cola (BR Code): campos ID+tamanho+valor até o 6304 e o CRC conferido */
function pixLer(s){var i=0,o='';s=String(s||'');if(s.slice(0,6)!=='000201')return '';
 while(i+4<=s.length){var id=s.substr(i,2),n=+s.substr(i+2,2);if(!/^\d{2}$/.test(id)||isNaN(n))return '';var v=s.substr(i+4,n);if(v.length<n)return '';o+=id+s.substr(i+2,2)+v;i+=4+n;
  if(id==='63')return n===4&&crc16(o.slice(0,-4))===v.toUpperCase()?o:'';}return '';}
function pixNoTexto(T){var cand=[T.replace(/\n/g,''),T.replace(/\s+/g,'')],r='';cand.forEach(function(c){var k=-1;while(!r&&(k=c.indexOf('000201',k+1))>-1)r=pixLer(c.slice(k));});return r;}
var GL_MES={jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
/* primeiro achado do padrão logo depois do rótulo (nas guias o valor vem ao lado ou na linha de baixo); os rótulos vão do mais preciso ao mais vago */
function glPerto(T,rot,rx,lim){for(var j=0;j<rot.length;j++){var m,g=new RegExp(rot[j].source,'gi');while((m=g.exec(T))){var x=rx.exec(T.slice(m.index+m[0].length,m.index+m[0].length+(lim||160)));if(x)return x;}}return null;}
function glData(x){var d=new Date(+x[3],+x[2]-1,+x[1]);return d.getMonth()===+x[2]-1?d:null;}
function glComp(T){var m=glPerto(T,[/per[íi]odo\s+de\s+apura[çc][ãa]o/,/compet[êe]ncia/,/m[êe]s\s+de\s+refer[êe]ncia/,/refer[êe]ncia/],/(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b\.?\s*(?:\/|de)?\s*(20\d{2})|(?:\b\d{2}\/)?\b(0[1-9]|1[0-2])\/(20\d{2})\b/i,90);
 if(!m)return '';if(m[1])return cName(+m[2],GL_MES[m[1].toLowerCase().slice(0,3).replace('ç','c')]);return cName(+m[4],+m[3]-1);}
function glVenc(T){var m=glPerto(T,[/pagar\s+(?:este\s+documento\s+)?at[ée]/,/data\s+de\s+vencimento/,/vencimento/,/pag[aá]vel\s+at[ée]/,/validade/],/\b(\d{2})\/(\d{2})\/(20\d{2})\b/,120);return m?glData(m):null;}
var GL_VAL=/(?:R\$\s*)?\b(\d{1,3}(?:\.\d{3})*,\d{2})(?!\d)/;
function glValor(T){var m=glPerto(T,[/valor\s+total\s+do\s+documento/,/valor\s+total\s+a\s+(?:pagar|recolher)/,/total\s+a\s+(?:pagar|recolher)/,/valor\s+a\s+(?:pagar|recolher)/,/\(=\)\s*valor\s+(?:cobrado|do\s+documento)/,/valor\s+cobrado/,/valor\s+do\s+documento/,/valor\s+total/,/total\s+da\s+guia/,/\btotal\b/],GL_VAL,140);
 if(m)return m[1];var mx=0,s='',g=new RegExp(GL_VAL.source,'g'),x;while((x=g.exec(T))){var n=money(x[1]);if(n>mx){mx=n;s=x[1];}}return s;}
/* imposto: a ordem importa (o DAS cita IRPJ, CSLL, PIS, COFINS, INSS e ISS na composição); GPS e DARF da DCTFWeb são INSS */
var GL_DARF=[[/\b(2089|0220|2362|3373|5993|2430|1599)\b/,'IRPJ · trimestral'],[/\b(2372|6012|2484|3317)\b/,'CSLL · trimestral'],[/\b(8109|2172|6912|5856|8301|6912|4574|5952)\b/,'PIS/COFINS'],[/\b(0561|1708|0588|3208|0473|8045)\b/,'DARF · IRRF'],[/\b(1082|1138|1646|1099)\b/,'DCTFWeb · INSS']];
function glTipo(T){var t=T.replace(/\s+/g,' ');
 if(/simples\s+nacional|\bPGDAS|\bDAS\b|documento\s+de\s+arrecada[çc][ãa]o\s+do\s+simples/i.test(t))return 'DAS · Simples Nacional';
 if(/\bFGTS\b|\bGFD\b/i.test(t))return 'FGTS Digital';
 if(/\bDCTF\s*Web\b|\bGPS\b|guia\s+da\s+previd[êe]ncia|previd[êe]ncia\s+social|\bINSS\b|contribui[çc][ãa]o\s+previdenci[áa]ria|\beSocial\b/i.test(t))return 'DCTFWeb · INSS';
 if(/\bISS(?:QN)?\b|imposto\s+sobre\s+servi[çc]os|prefeitura|munic[íi]pio\s+de/i.test(t))return 'ISS · Municipal';
 var cr=/c[óo]digo\s+(?:da\s+)?receita[^\d]{0,40}(\d{4})|composi[çc][ãa]o\s+do\s+documento[\s\S]{0,200}?\b(\d{4})\b/i.exec(t),dc=cr?(cr[1]||cr[2]):'';
 if(dc)for(var i=0;i<GL_DARF.length;i++)if(GL_DARF[i][0].test(dc))return GL_DARF[i][1];
 if(/\bIRPJ\b|imposto\s+(?:sobre\s+a\s+)?renda\s+(?:da\s+)?pessoa\s+jur/i.test(t))return 'IRPJ · trimestral';
 if(/\bCSLL\b|contribui[çc][ãa]o\s+social\s+sobre\s+o\s+lucro/i.test(t))return 'CSLL · trimestral';
 if(/\bPIS\b|\bCOFINS\b|\bPASEP\b/i.test(t))return 'PIS/COFINS';
 if(/\bIRRF\b|imposto\s+de\s+renda\s+retido/i.test(t))return 'DARF · IRRF';
 return '';}
/* tudo o que deu para tirar do texto (e do QR); o contador confere antes de lançar */
function guiaDoTexto(T,qr){var o={},cods=gbCodigos(T),g=cods.filter(function(c){return c.arr;})[0]||cods[0];
 o.tipo=glTipo(T);o.comp=glComp(T);o.venc=glVenc(T);o.valor=glValor(T);
 if(g){o.code=g.linha;var gv=gbValor(g);if(gv)o.valor=gv;if(!o.venc)o.venc=gbVenc(g);}
 o.pix=pixNoTexto(T)||(qr||[]).map(pixLer).filter(Boolean)[0]||'';
 if(!o.valor&&o.pix){var p=o.pix,i=0;while(i+4<=p.length){var id=p.substr(i,2),n=+p.substr(i+2,2);if(id==='54'){o.valor=maskMoney(String(Math.round(parseFloat(p.substr(i+4,n))*100)));break;}i+=4+n;}}
 return o;}
function guiaPdfLer(file){return file.arrayBuffer().then(function(buf){window.__guiaLibs();return pdfjsLib.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;}).then(function(pdf){var N=Math.min(pdf.numPages,3),txt=[],qr=[],p=Promise.resolve();
 for(var i=1;i<=N;i++)(function(i){p=p.then(function(){return pdf.getPage(i);}).then(function(pg){return pg.getTextContent().then(function(tc){var it=tc.items.filter(function(x){return x.str;}).sort(function(a,b){return Math.abs(b.transform[5]-a.transform[5])>2?b.transform[5]-a.transform[5]:a.transform[4]-b.transform[4];}),ln=[],y=null,cur='';
   it.forEach(function(x){var yy=x.transform[5];if(y!==null&&Math.abs(yy-y)>2){ln.push(cur.trim());cur='';}cur+=(cur&&!/\s$/.test(cur)?' ':'')+x.str;y=yy;});ln.push(cur.trim());txt.push(ln.join('\n'));
   if(!window.jsQR)return;var vp0=pg.getViewport({scale:1}),sc=Math.min(3,1800/vp0.width),vp=pg.getViewport({scale:sc}),cv=document.createElement('canvas');cv.width=Math.floor(vp.width);cv.height=Math.floor(vp.height);var cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
   return pg.render({canvasContext:cx,viewport:vp}).promise.then(function(){var im=cx.getImageData(0,0,cv.width,cv.height),r=jsQR(im.data,cv.width,cv.height,{inversionAttempts:'dontInvert'});if(r&&r.data)qr.push(r.data);}).catch(function(){});});});})(i);
 return p.then(function(){var T=txt.join('\n');return {texto:T.replace(/\s/g,'').length,dados:guiaDoTexto(T,qr)};});});}
/* põe na tela o que foi lido, sem redesenhar o formulário (o arquivo escolhido continua no campo) */
var GLER=0,GLAUTO={};
function guiaPreenche(o){var lid=[],tx=function(id,v){var e=$(id);if(!e)return;if(v||e.value===GLAUTO[id]){e.value=FV[id]=v||'';GLAUTO[id]=v||'';}},sp=function(id,v,t){FV[id]=v;var b=$(id);if(b){b.classList.add('has');b.querySelector('span').textContent=t;}};
 if(o.tipo&&TIPOS_GUIA.indexOf(o.tipo)>-1){sp('ng-t',o.tipo,o.tipo);lid.push('imposto');}
 if(o.comp){sp('ng-c',o.comp,o.comp);lid.push('competência');}
 if(o.valor&&money(o.valor)>0){var v=$('ng-v');if(v)v.value=FV['ng-v']=o.valor;lid.push('valor');}
 if(o.venc){var dv=dInput(o.venc);sp('ng-d',dv,fmtD(dv));lid.push('vencimento');}
 /* código e Pix de um PDF anterior saem se o novo PDF não tiver; o que o contador digitou fica */
 tx('ng-b',o.code);if(o.code)lid.push('código de barras');tx('ng-p',o.pix);if(o.pix)lid.push('Pix copia e cola');
 return lid;}
function guiaLer(f){var st=$('ng-ler'),k=++GLER,msg=function(t,w){if(k!==GLER||!st)return;st.textContent=t;st.hidden=!t;st.classList.toggle('warn',!!w);};
 if(!f)return msg('');if(ftOf(f.name)!=='pdf'&&!/pdf/i.test(f.type||''))return msg('A leitura automática funciona com PDF. Preencha os dados à mão.',1);
 msg('Lendo a guia…');
 guiaPdfLer(f).then(function(r){if(k!==GLER)return;var lid=guiaPreenche(r.dados),falta=['imposto','competência','valor','vencimento','código de barras','Pix copia e cola'].filter(function(x){return lid.indexOf(x)<0;});
  if(r.texto<20&&!lid.length)return msg('Não deu para ler este PDF: ele parece ser uma imagem (guia digitalizada ou foto), sem texto. Preencha os dados à mão.',1);
  if(!lid.length)return msg('Não encontrei os dados da guia neste PDF. Preencha à mão.',1);
  msg('Lido do PDF: '+lid.join(', ')+'.'+(falta.length?' Não encontrei: '+falta.join(', ')+'.':'')+' Confira antes de lançar.',falta.length>0);})
 .catch(function(){msg('Não deu para abrir este PDF (pode estar protegido ou danificado). Preencha os dados à mão.',1);});}
function vNovoDoc(a){var c=ctxE(a),cat=fv('nd-c',c.k||'contabil'),gu=cat==='guias';return hdr('Enviar documento','Fica no arquivo do cliente')+'<form class="form" id="fm-doc" novalidate>'+selE('nd-e',c.e)+(gu?'':txt('nd-n','Nome do documento','Ex.: Balancete · outubro'))+selCat('nd-c',c.k||'contabil','<span class="fh">"Internos do escritório" não aparece para o cliente.</span>')+selComp('nd-m',compOf())+(gu?guiaCampos('nd',guiaVenc())+'<span class="fh">Imposto vai para a pasta Impostos e também para Guias de impostos, para o cliente pagar. O arquivo é guardado uma vez só.</span>':'')+fileF('nd-a')+'<span class="fe" id="nd-err" hidden></span></form><div class="fbar"><button type="button" class="cta" data-send="doc">'+IC.up16+' Enviar ao cliente</button></div>';}
function vNovoGuia(a){var c=ctxE(a),n=NOW(),v=new Date(n.getFullYear(),n.getMonth()+1,20);
 return hdr('Lançar guia','Aparece em Guias de impostos do cliente')+'<form class="form" id="fm-gu" novalidate>'+selE('ng-e',c.e)+fileF('ng-a','Arquivo da guia')+'<span class="fh" id="ng-ler" role="status" aria-live="polite" hidden></span>'+pickF('ng-t','Imposto',TIPOS_GUIA.map(function(x){return [x,x];}),TIPOS_GUIA[0])+
 mesF('ng-c','Competência',cName(n.getFullYear(),n.getMonth()-1))+
 '<div class="fld"><label class="fl" for="ng-v">Valor</label><div class="mon"><span>R$</span><input id="ng-v" inputmode="numeric" placeholder="0,00" value="'+esc(fv('ng-v',''))+'" data-money data-fvk></div></div>'+dateF('ng-d','Vencimento',dInput(v))+
 txt('ng-b','Código de barras','Linha digitável, só números',fv('ng-b',''),1).replace('autocomplete="off"','autocomplete="off" inputmode="numeric" data-fvk')+'<div class="fld"><label class="fl" for="ng-p">Pix copia e cola <i>(opcional)</i></label><textarea id="ng-p" rows="3" placeholder="Começa com 000201" autocomplete="off" data-fvk>'+esc(fv('ng-p',''))+'</textarea></div>'+
 '<span class="fh">Carregue o PDF da guia: o app lê o imposto, a competência, o valor, o vencimento, o código de barras e o Pix copia e cola e preenche os campos. Confira antes de lançar. Sem código de barras ou Pix, o protótipo gera um. A guia também fica em Guias e comprovantes, no arquivo.</span><span class="fe" id="ng-err" hidden></span></form><div class="fbar"><button type="button" class="cta" data-send="guia">'+IC.up16+' Lançar guia</button></div>';}
function vNovoPed(a){var c=ctxE(a),n=NOW();return hdr('Pedir documento','O cliente vê nas rotinas e em Documentos')+'<form class="form" id="fm-pd" novalidate>'+selE('np-e',c.e)+txt('np-n','Qual documento?','Ex.: Contrato de aluguel atualizado')+dateF('np-d','Prazo para o cliente',dInput(new Date(n.getFullYear(),n.getMonth(),n.getDate()+7)))+'<span class="fe" id="np-err" hidden></span></form><div class="fbar"><button type="button" class="cta" data-send="ped">'+IC.up16+' Pedir ao cliente</button></div>';}
function errOn(id,m){var e=$(id);if(!e)return !m;e.textContent=m;e.hidden=!m;return !m;}
function envio(k){if(k==='doc'&&V('nd-c')==='guias'){var gv=$('nd-v').value,gd=V('nd-d');if(!errOn('nd-err',!money(gv)?'Digite o valor da guia':!gd?'Escolha o vencimento':''))return;if(!errOn('nd-err',guiaArqErro('nd-a')))return;var eg=B(V('nd-e'));addGuia(V('nd-t'),curto(V('nd-m')),gv,gd,'',fileName('nd-a'));UI.arqEmp=eg.id;keep();done();save();toast('Guia enviada para '+(eg.fant||eg.nome));hist=[];show('pasta-'+eg.id+'|guias');return;}
 if(k==='doc'){var n=$('nd-n').value.trim(),f=fileName('nd-a');if(!n&&f)n=f.replace(/\.[^.]+$/,'');if(!errOn('nd-err',n?'':'Dê um nome ao documento'))return;var cat0=V('nd-c'),catL=(CATS.filter(function(c){return c[0]===cat0;})[0]||[])[1],okL=ftCat(catL),fx=$('nd-a'),bad1=fx&&fx.files?[].filter.call(fx.files,function(x){return okL.indexOf(ftOf(x.name))<0;})[0]:null;if(!errOn('nd-err',bad1?'“'+bad1.name+'” não é aceito em '+catL+'. Envie '+ftTxt(okL)+'.':''))return;var e=B(V('nd-e')),cat=V('nd-c');
  addDoc(n,cat,V('nd-m'),f);UI.arqEmp=e.id;keep();done();save();toast(cat==='interno'?'Guardado no arquivo interno':'Documento enviado para '+(e.fant||e.nome));hist=[];show('pasta-'+e.id+'|'+cat);return;}
 if(k==='guia'){var v=$('ng-v').value,d=V('ng-d');if(!errOn('ng-err',!money(v)?'Digite o valor da guia':!d?'Escolha o vencimento':''))return;if(!errOn('ng-err',guiaArqErro('ng-a')))return;var bc=$('ng-b').value.trim(),px=$('ng-p').value.replace(/\s*\n\s*/g,'').trim(),gb=bc?gbLer(bc):null;if(!errOn('ng-err',bc&&!gb?'O código de barras não confere: revise os números (44, 47 ou 48 dígitos)':px&&!pixLer(px)?'O Pix copia e cola não confere: copie o código inteiro':''))return;var e2=B(V('ng-e'));addGuia(V('ng-t'),curto(V('ng-c')),v,d,'',fileName('ng-a'),{code:gb?gb.linha:'',pix:px?pixLer(px):''});done();save();toast('Guia lançada para '+(e2.fant||e2.nome));hist=[];show('pasta-'+e2.id+'|guias');return;}
 if(k==='ped'){var nm=$('np-n').value.trim(),dd=V('np-d');if(!errOn('np-err',!nm?'Diga qual documento você precisa':!dd?'Escolha o prazo':''))return;var e3=B(V('np-e'));
  docsPed().push({id:'d'+Date.now().toString(36),t:'Enviar '+nm.charAt(0).toLowerCase()+nm.slice(1),lim:dd,go:'f-solicitado'});var p=dd.split('-'),dt=new Date(+p[0],+p[1]-1,+p[2]);
  avisar('O contador pediu um documento',cap(nm)+' · até '+fmtP(dt),'docs');ST.chat.push({me:0,t:'Preciso que você envie: '+cap(nm)+', até '+fmtP(dt)+'.',h:agora(),go:'f-solicitado',gl:'Enviar documento'});ST.unread=(ST.unread||0)+1;ativ('Contador pediu: '+cap(nm));
  done();save();toast('Pedido enviado para '+(e3.fant||e3.nome));back();}}
/* ===== ajustes, clientes e aparência ===== */
function vAjustes(){var c=MULTI.cfg,n=NOW(),on=window.syncStatus==='online';
 var h=hdr('Ajustes','Prazos, clientes e aparência');
 h+='<section>'+sec('Prazos de envio')+'<div class="card pad form">'+pickF('pz-du','Folhas de pagamento encerram no',[1,2,3,4,5].map(function(d){return [String(d),d+'º dia útil do mês seguinte'];}),String(c.folhaDU))+
 (function(){var D28=Array.apply(null,Array(28)).map(function(_,i){return [String(i+1),'Dia '+(i+1)+' do mês seguinte'];}),jt=c.junto!==false;
  return '<div class="card"><button type="button" class="r tgl" role="switch" aria-checked="'+(jt?'true':'false')+'" data-junto><span class="rt"><span class="a">Mesmo dia para notas, extratos e despesas</span><span class="b">Desligue para escolher um dia para cada um</span></span><span class="sw2" aria-hidden="true"></span></button></div>'+
  (jt?pickF('pz-dd','Notas, extratos, despesas e documentos encerram no',D28,String(c.docsDia)):
   pickF('pz-dn','Cofre de notas fiscais encerra no',D28,String(diaG('notas')))+pickF('pz-dx','Envio de extratos encerra no',D28,String(diaG('extratos')))+pickF('pz-dp','Envio de despesas encerra no',D28,String(diaG('despesas')))+pickF('pz-dd','Outros documentos encerram no',D28,String(c.docsDia)));})()+'<p class="fh">Vale no app de todos os clientes. O cliente pode encerrar antes; depois do prazo, o que foi lançado chega para você automaticamente.</p></div></section>';
 h+=ajExtra();
 h+='<section>'+sec('Acompanhamento dos envios')+'<div class="card">'+[['notas','Notas fiscais'],['extratos','Extratos bancários'],['folha','Folhas e variáveis']].map(function(x){var on=acompOn(x[0]);return '<button type="button" class="r tgl" role="switch" aria-checked="'+(on?'true':'false')+'" data-acomp="'+x[0]+'"><span class="rt"><span class="a">'+x[1]+'</span><span class="b">'+(on?'Com acompanhamento: você confere e o cliente vê cada status':'Recebimento direto: você recebe e dá andamento; se algo estiver errado, chama o cliente')+'</span></span><span class="sw2" aria-hidden="true"></span></button>';}).join('')+'</div><p class="fh">Vale para todos os clientes. Despesas sempre vão direto, sem status.</p></section>';
 h+='<section>'+sec('Admissão de colaboradores')+'<div class="card pad form">'+pickF('ad-dias','Data de admissão a partir de',[0,1,2,3,4,5,7,10,15].map(function(d){return [String(d),d?d+(d===1?' dia':' dias')+' após o lançamento':'No mesmo dia do lançamento'];}),String(admDias()))+pickF('ad-tipo','Contagem dos dias',[['c','Dias corridos'],['u','Dias úteis (sem fins de semana e feriados)']],(c.admTipo==='u'?'u':'c'))+'<p class="fh">Vale para admissões e readmissões de todos os clientes. Com a regra atual, uma admissão lançada hoje pode começar a partir de '+fmtA(admMin())+'.</p></div></section>';
 h+='<section>'+sec('Data do protótipo')+'<div class="card pad form">'+dateF('pz-sim','Hoje no app',dInput(n))+'<button type="button" class="wb" data-real>Usar a data de hoje</button></div></section>';
 h+='<section>'+sec('Clientes')+'<div class="card">'+MULTI.emps.map(function(e){var t=TEMAS.filter(function(x){return x[0]===e.tema;})[0]||TEMAS[0];return '<button type="button" class="r" data-go="cli-'+e.id+'">'+esw(e)+'<span class="rt"><span class="a">'+esc(e.nome)+'</span><span class="b">'+esc(e.cnpj)+' · cor '+esc(t[1])+(e.escuro?' · escuro':'')+'</span></span><span class="cv">'+IC.chev18+'</span></button>';}).join('')+'</div><div class="gap"></div><button type="button" class="wb pri" data-go="cli-novo">'+IC.plus+' Adicionar cliente</button></section>';
 var tt=TEMAS.filter(function(x){return x[0]===UI.tema;})[0]||TEMAS[0];
 h+='<section>'+sec('Aparência deste app')+'<div class="card"><button type="button" class="r" data-tema-go><span class="ri">'+IC.palette+'</span><span class="rt"><span class="a">Tema do app</span><span class="b">'+tt[1]+(UI.solido?' sólida':' em degradê')+' · escuro '+(UI.escuro?'ligado':'desligado')+'</span></span><span class="cfg-sw" style="background:linear-gradient(135deg,'+tt[2]+','+tt[3]+')"></span>'+IC.chev18+'</button></div></section>';
 h+='<section>'+sec('Suporte')+'<div class="card"><button type="button" class="r" data-go="ajuda"><span class="ri">'+IC.duv+'</span><span class="rt"><span class="a">Ajuda</span><span class="b">Passo a passo e perguntas frequentes</span></span><span class="cv">'+IC.chev18+'</span></button></div></section>';
 h+='<section>'+sec('Outras versões')+'<div class="card">'+[['index.html','App do cliente no celular'],['web.html','App do cliente no computador'],[DESK?'contador-app.html':'contador.html',DESK?'App do contador no celular':'Painel do contador no computador']].map(function(v){return '<a class="r lk" href="'+v[0]+'"><span class="rt"><span class="a">'+v[1]+'</span></span><span class="cv">↗</span></a>';}).join('')+'</div></section>';
 h+='<div class="note">'+(on?'Ligado ao app dos clientes: o que você faz aqui aparece para eles.':'Sem conexão com o banco: as mudanças ficam só neste navegador.')+'</div>';
 h+='<button type="button" class="rst" data-reset>Restaurar dados de exemplo</button>';
 return h;}
var ED=null;
var REGS=['Simples Nacional','Simples Nacional · Anexo III','MEI','Lucro Presumido','Lucro Real'];
function vCli(id){var novo=id==='novo',e=novo?{nome:'',fant:'',cnpj:'',reg:'Simples Nacional',ativ:'',end:'',tema:'verde',escuro:0}:eById(id);if(!e)return null;
 if(!ED||ED.id!==id)ED={id:id,tema:e.tema,escuro:e.escuro?1:0};
 var regs=REGS.indexOf(e.reg)<0?REGS.concat([e.reg]):REGS;
 return hdr(novo?'Novo cliente':(e.fant||e.nome),novo?'Cadastro':'Dados e tema do cliente')+'<form class="form" id="fm-ed" novalidate>'+txt('ed-n','Razão social','',e.nome)+txt('ed-f','Nome fantasia','',e.fant,1)+
 '<div class="fld"><label class="fl" for="ed-c">CNPJ</label><input id="ed-c" inputmode="numeric" maxlength="18" value="'+esc(e.cnpj)+'" placeholder="00.000.000/0000-00" data-cnpj></div>'+
 pickF('ed-r','Regime',regs.map(function(r){return [r,r];}),e.reg)+
 txt('ed-a','Atividade','',e.ativ==='A informar'?'':e.ativ,1)+txt('ed-e','Endereço','',e.end==='A informar'?'':e.end,1)+
 '<div class="fld"><span class="fl">Cor do app para este cliente</span><div class="tgrid">'+TEMAS.map(function(t){return '<button type="button" class="op tsw'+(ED.tema===t[0]?' on':'')+'" data-etema="'+t[0]+'" aria-label="'+t[1]+'"><i style="background:linear-gradient(135deg,'+t[2]+','+t[3]+')"></i><span>'+t[1]+'</span></button>';}).join('')+'</div></div>'+
 '<div class="card"><button type="button" class="r tgl" role="switch" aria-checked="'+(ED.escuro?'true':'false')+'" data-eesc><span class="rt"><span class="a">Tema escuro no app</span><span class="b">O cliente ainda pode trocar pela roda de temas</span></span><span class="sw2" aria-hidden="true"></span></button></div>'+
 '<span class="fe" id="ed-err" hidden></span></form>'+(novo?'':cliExtra(e))+'<div class="fbar"><button type="button" class="cta" data-edsave>'+(novo?'Adicionar cliente':'Salvar')+'</button></div>';}
function edSave(){var v={nome:$('ed-n').value.trim(),fant:$('ed-f').value.trim(),cnpj:$('ed-c').value.trim(),reg:V('ed-r'),ativ:$('ed-a').value.trim(),end:$('ed-e').value.trim()};
 if(!v.nome)return errOn('ed-err','Preencha a razão social');if(!cnpjOk(v.cnpj))return errOn('ed-err','CNPJ inválido. Confira os 14 números');
 if(MULTI.emps.some(function(x){return x.id!==ED.id&&x.cnpj.replace(/\D/g,'')===v.cnpj.replace(/\D/g,'');}))return errOn('ed-err','Este CNPJ já é de outro cliente');
 var e,novo=ED.id==='novo';if(!novo)e=eById(ED.id);else{var nid=addEmp({nome:v.nome,fant:v.fant,cnpj:v.cnpj,reg:v.reg,tema:ED.tema});e=eById(nid);}
 e.nome=v.nome;e.fant=v.fant||v.nome;e.cnpj=v.cnpj;e.reg=v.reg;e.ativ=v.ativ||'A informar';e.end=v.end||'A informar';e.tema=ED.tema;e.escuro=ED.escuro;ED=null;
 done();save();toast(novo?'Cliente adicionado':'Dados de '+(e.fant||e.nome)+' salvos');back();}
/* ===== botão + em arco, lista de seleção, calendário, troca de cliente, confirmação e roda de temas
   (mesmos componentes e classes do app do cliente) ===== */
var fab=null,fm=$('fabmenu'),fov=$('fabov'),ftt=$('fabttl');
var FABT={inicio:'Início',pedidos:'Pedidos',ped:'Pedido',receb:'Recebidos',arquivo:'Documentos',pasta:'Pasta do cliente',doc:'Documento',folha:'Folha',dp:'Departamento Pessoal',colab:'Colaborador',socio:'Sócio',guias:'Guias de impostos',cguia:'Guia',gestao:'Gestão contábil',fecha:'Fechamento do mês',rec:'Recorrência',recnovo:'Recorrência',lote:'Enviar em lote',desp:'Despesas',chk:'Checklist',novodoc:'Enviar documento',novoguia:'Lançar guia',novoped:'Pedir documento',ajustes:'Ajustes',cli:'Cliente',ajuda:'Ajuda'};
/* ações do + conforme a tela aberta (até 6, como no app do cliente) */
function fabItems(){var h=head(cur),a=cur.slice(h.length+1),eid=eById(a.split('|')[0])?a.split('|')[0]:'',
 U=['novodoc','Enviar documento','up'],R=['novoped','Pedir documento','req'],G=['novoguia','Lançar guia','tax'],CH=['msg','Chat','chat'],AJ=['ajuda','Ajuda','duv'],GS=['guias','Guias','tax'],LT=['lote','Enviar em lote','up'],NC=['cli-novo','Novo cliente','plus'],
 ce=eid?['chat-'+eid,'Chat do cliente','chat']:CH;
 switch(h){
  case 'inicio':return [U,R,G,NC,CH,AJ];
  case 'pedidos':case 'ped':return [R,G,['receb','Recebidos','down'],CH,AJ];
  case 'receb':return [U,R,CH,AJ];
  case 'arquivo':return [U,R,G,NC,AJ];
  case 'pasta':return [['novodoc-'+a,'Enviar para a pasta','up'],['novoguia-'+eid,'Lançar guia','tax'],['novoped-'+eid,'Pedir documento','req'],ce,AJ];
  case 'doc':case 'folha':return eid?[['novodoc-'+eid,'Enviar documento','up'],['novoped-'+eid,'Pedir documento','req'],ce,AJ]:[U,R,CH,AJ];
  case 'dp':return [['rec-all|col','Recorrência','pro'],LT,R,CH,AJ];
  case 'colab':case 'socio':return [ce,['novoped-'+eid,'Pedir documento','req'],['novodoc-'+eid,'Enviar documento','up'],AJ];
  case 'guias':return [G,LT,CH,AJ];
  case 'cguia':return eid?[['novoguia-'+eid,'Lançar guia','tax'],ce,GS,AJ]:[G,GS,CH,AJ];
  case 'gestao':return [['fecha','Fechamento','cal'],U,R,CH,AJ];
  case 'fecha':return [LT,R,CH,AJ];
  case 'ajustes':return [['#tema','Tema','palette'],NC,CH,AJ];
  case 'cli':return eid?[ce,AJ]:[CH,AJ];
  case 'ajuda':return [['#sis','Perguntar no Chat','chat'],R,U];
  case 'novodoc':return [R,G,CH,AJ];
  case 'novoguia':return [U,R,CH,AJ];
  case 'novoped':return [U,G,CH,AJ];
 }
 return [U,R,CH,AJ];}
function buildFab(){fab=$('fab');if(!fab)return;[].slice.call(fm.querySelectorAll('.fi')).forEach(function(x){x.remove();});
 var it=fabItems(),n=it.length,fb=fab.getBoundingClientRect(),pb=P.getBoundingClientRect(),cx=P.clientWidth/2,cy=fb.width?(fb.top-pb.top)/((pb.height/P.offsetHeight)||1)+29:792,rx=Math.min(158,cx-40),ry=n>5?205:185,a0=n<=3?235:n<=4?212:198,a1=540-a0;
 var N=300,Q=[],L=[0];for(var i=0;i<=N;i++){var g=(a0+(a1-a0)*i/N)*Math.PI/180;Q.push([cx+rx*Math.cos(g),cy+ry*Math.sin(g)]);if(i)L.push(L[i-1]+Math.hypot(Q[i][0]-Q[i-1][0],Q[i][1]-Q[i-1][1]));}
 var top=1e9,j=0;it.forEach(function(a,k){var tg=n===1?L[N]/2:L[N]*k/(n-1);while(j<N&&L[j]<tg)j++;var x=Q[j][0],y=Q[j][1];top=Math.min(top,y);
  var b=document.createElement('button');b.type='button';b.className='fi';b.setAttribute('data-fgo',a[0]);var h=36;b.style.left=(x-h).toFixed(1)+'px';b.style.top=(y-h).toFixed(1)+'px';b.style.setProperty('--dx',(cx-x).toFixed(1)+'px');b.style.setProperty('--dy',(cy-y).toFixed(1)+'px');
  b.innerHTML='<span>'+IC[a[2]]+'</span><span>'+a[1]+'</span>';b.tabIndex=-1;fm.appendChild(b);});
 ftt.textContent=FABT[head(cur)]||'Ações';ftt.style.top=(top-80)+'px';}
function fabOpen(){buildFab();P.classList.add('fab-on');fab&&fab.setAttribute('aria-expanded','true');fm.querySelectorAll('.fi').forEach(function(b){b.tabIndex=0;});var f=fm.querySelector('.fi');f&&setTimeout(function(){f.focus();},60);}
function fabClose(){P.classList.remove('fab-on');fab&&fab.setAttribute('aria-expanded','false');fm.querySelectorAll('.fi').forEach(function(b){b.tabIndex=-1;});}
fov.addEventListener('click',fabClose);
function openSheet(){P.classList.contains('fab-on')?fabClose():fabOpen();}
function closeSheet(){fabClose();}
/* lista de seleção */
var ps=$('psheet'),ov3=$('mov3'),psl=$('ps-list'),psq=$('ps-q'),PCB=null;
function openPick(title,list,curv,cb){fabClose();PCB=cb;$('ps-t').textContent=title;
 psl.innerHTML=list.map(function(o){var v=o[0],l=o[1];return '<button type="button" class="pv'+(v===curv?' on':'')+'" role="option" aria-selected="'+(v===curv)+'" data-pv="'+esc(v)+'" data-pl="'+esc(String(l).toLowerCase())+'"><span>'+esc(l)+'</span>'+(v===curv?IC.check16:'')+'</button>';}).join('');
 $('ps-srch').hidden=list.length<9;psq.value='';ps.hidden=false;ov3.hidden=false;ps.scrollTop=0;var on=psl.querySelector('.pv.on')||psl.querySelector('.pv');on&&setTimeout(function(){on.focus();},30);}
psq.addEventListener('input',function(){var q=psq.value.toLowerCase().trim();psl.querySelectorAll('.pv').forEach(function(b){b.hidden=q&&b.dataset.pl.indexOf(q)<0;});});
/* calendário e seletor de mês */
var cs=$('csheet'),csb=$('cs-body'),CAL=null,MES=MESU;
function iso(y,m,d){return y+'-'+('0'+(m+1)).slice(-2)+'-'+('0'+d).slice(-2);}
function openCal(id){fabClose();var v=V(id),t=NOW(),q=v?v.split('-'):null;CAL={id:id,y:q?+q[0]:t.getFullYear(),m:q?+q[1]-1:t.getMonth(),sel:v||'',view:'d'};$('cs-t').textContent=PLT[id]||'Selecionar data';renderCal();cs.hidden=false;ov3.hidden=false;}
function openPer(id){fabClose();var v=V(id),t=NOW(),q=v?cParse(v):null,mi=q&&q.m>-1?q.m:t.getMonth(),yy=q&&q.y?q.y:t.getFullYear();CAL={per:1,id:id,y:yy,py:yy,pm:mi,sel:'x'};$('cs-t').textContent=PLT[id]||'Competência';renderCal();cs.hidden=false;ov3.hidden=false;}
function renderCal(){var t=NOW(),hj=iso(t.getFullYear(),t.getMonth(),t.getDate()),h='';
 if(CAL.view==='y'){var y0=t.getFullYear(),ys=CAL.per?y0-15:y0-100,ye=y0+(CAL.per?2:10),yl='';for(var yy=ye;yy>=ys;yy--)yl+='<button type="button" class="'+(yy===CAL.y?'on':'')+(yy===y0&&yy!==CAL.y?' now':'')+'" data-cyr="'+yy+'"'+(yy===CAL.y?' id="cyr-sel"':'')+'>'+yy+'</button>';
  h+='<div class="cnav"><span class="cml" style="flex:1;text-align:center">Escolha o ano</span></div><div class="cmes cyrs" style="max-height:300px;overflow-y:auto;grid-template-columns:repeat(4,1fr)">'+yl+'</div>';csb.innerHTML=h;var ok0=document.getElementById('cs-ok');if(ok0)ok0.disabled=true;var sl=document.getElementById('cyr-sel');if(sl)sl.scrollIntoView({block:'center'});return;}
  if(CAL.per){h+='<div class="cnav"><button type="button" class="cn" data-cmv="-1" aria-label="Ano anterior">'+IC.tri+'</button><button type="button" class="cml" data-cyear>'+CAL.y+IC.chevd+'</button><button type="button" class="cn nx" data-cmv="1" aria-label="Próximo ano">'+IC.tri+'</button></div>';
  var gcm=CAL.id==='gc-comp'||CAL.id==='arq-comp';h+='<div class="cmes">'+MES.map(function(n,i){var on=i===CAL.pm&&CAL.y===CAL.py,now=i===t.getMonth()&&CAL.y===t.getFullYear(),ok=!gcm||gcOk(cName(CAL.y,i));return '<button type="button" class="'+(on&&ok?'on':'')+(now&&!on?' now':'')+(ok?'':' off')+'" data-cmes="'+i+'"'+(ok?'':' disabled aria-disabled="true" aria-label="'+n+' ainda não chegou"')+'>'+n.slice(0,3)+'</button>';}).join('')+'</div>';if(gcm)h+='<p class="cnote"><span>'+(CAL.id==='arq-comp'?'Escolha o mês para ver os documentos dele nas pastas.':'Escolha o mês para ver o que o cliente enviou.')+' Meses que ainda não chegaram ficam indisponíveis.</span></p>';csb.innerHTML=h;$('cs-ok').disabled=gcm&&!gcOk(cName(CAL.py,CAL.pm));return;}
 h+='<div class="cnav"><button type="button" class="cn" data-cmv="-1" aria-label="Anterior">'+IC.tri+'</button><button type="button" class="cml" data-cmode>'+(CAL.view==='d'?MES[CAL.m]+' '+CAL.y:CAL.y)+IC.chevd+'</button><button type="button" class="cn nx" data-cmv="1" aria-label="Próximo">'+IC.tri+'</button></div>';
 if(CAL.view==='d'){h+='<div class="cwk">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(function(d){return '<span>'+d+'</span>';}).join('')+'</div><div class="cgrid">';
  var f=new Date(CAL.y,CAL.m,1).getDay(),dm=new Date(CAL.y,CAL.m+1,0).getDate(),pm=new Date(CAL.y,CAL.m,0).getDate();
  for(var i=0;i<f;i++)h+='<span class="cd out">'+(pm-f+1+i)+'</span>';
  for(var d=1;d<=dm;d++){var id=iso(CAL.y,CAL.m,d);h+='<button type="button" class="cd'+(id===hj?' hoje':'')+(id===CAL.sel?' sel':'')+'" data-cday="'+id+'" aria-label="'+d+' de '+MES[CAL.m]+'">'+d+'</button>';}
  var tot=f+dm,rest=(7-tot%7)%7;for(var j=1;j<=rest;j++)h+='<span class="cd out">'+j+'</span>';h+='</div>';}
 else h+='<div class="cmes">'+MES.map(function(n,i){return '<button type="button" class="'+(i===CAL.m?'on':'')+'" data-cmes="'+i+'">'+n.slice(0,3)+'</button>';}).join('')+'</div>';
 csb.innerHTML=h;$('cs-ok').disabled=!CAL.sel;}
function closeSheets(){ps.hidden=true;cs.hidden=true;ov3.hidden=true;PCB=null;}
ov3.addEventListener('click',closeSheets);
function setVal(id,v){FV[id]=v;
 if(id==='gc-comp'){if(gcOk(v))GC.c=v;cur='gestao';rerender();return;}
 if(id==='arq-comp'){if(gcOk(v))ARQC=v;rerender();return;}
 if(id==='ad-dias'){MULTI.cfg.admDias=+v;commit('Admissão a partir de '+(+v?v+' dias após o lançamento':'mesmo dia do lançamento'));return;}
if(id==='ad-tipo'){MULTI.cfg.admTipo=v;commit('Admissão: contagem em '+(v==='u'?'dias úteis':'dias corridos'));return;}
if(id==='pz-du'){MULTI.cfg.folhaDU=+v;commit('Folhas encerram no '+v+'º dia útil');return;}
 if(id==='pz-dd'){MULTI.cfg.docsDia=+v;commit((MULTI.cfg.junto===false?'Outros documentos':'Notas, extratos e despesas')+' encerram no dia '+v);return;}
 if(id==='pz-dn'||id==='pz-dx'||id==='pz-dp'){var gk={'pz-dn':'notas','pz-dx':'extratos','pz-dp':'despesas'}[id];MULTI.cfg['dia_'+gk]=+v;commit({notas:'Cofre de notas',extratos:'Extratos',despesas:'Despesas'}[gk]+' encerra'+(gk==='notas'?'':'m')+' no dia '+v);return;}
 if(id==='cl-pz'){var ec=eById(ED&&ED.id);if(ec){ec.pzExtra=+v;commit((ec.fant||ec.nome)+': prazos '+(+v?'com '+v+(+v===1?' dia':' dias')+' a mais':'normais'));}return;}
 if(id==='cl-resp'){var er=eById(ED&&ED.id);if(er){er.resp=v||'';commit('Responsável: '+(eqNome(v)||'ninguém'));}return;}
 if(id==='eq-eu'){MULTI.eu=v||'';UI.fEmp='all';commit(v?'Vendo como '+eqNome(v):'Vendo o escritório todo');return;}
 if(/^lt-\d+$/.test(id)){rerender();return;}
 if(id==='pz-sim'){MULTI.sim=v===dInput(new Date())?null:v;commit('Hoje no app: '+fmtP(NOW()));return;}
 rerender();}
/* troca de cliente */
var es=$('esheet'),ov2=$('mov2'),ECB=null;
function openEmp(curId,cb,o){o=o||{};fabClose();ECB=cb;EMPO={cur:curId,all:!!o.all,q:''};var mt=$('es-t'),ms=es.querySelector('.ms');if(mt)mt.textContent=o.t||'Escolher cliente';if(ms)ms.textContent=o.sub||'Toque no cliente para abrir';
 $('es-list').innerHTML='<div class="fld" style="padding:10px 14px 4px;margin:0"><input id="es-q" type="search" placeholder="Buscar por nome ou CNPJ" autocomplete="off" style="width:100%"></div><div id="es-rows">'+empRows()+'</div>';es.hidden=false;ov2.hidden=false;var a=es.querySelector('.emr.on')||es.querySelector('.emr');a&&a.focus&&a.focus({preventScroll:false});}
var EMPO={};
function empRows(){var q=String(EMPO.q||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),qd=q.replace(/\D/g,'');
 var L=MULTI.emps.filter(function(e){if(!q)return true;var t=String((e.fant||'')+' '+(e.nome||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return t.indexOf(q)>-1||(qd&&String(e.cnpj||'').replace(/\D/g,'').indexOf(qd)>-1);});
 var h=EMPO.all&&!q?'<button type="button" class="r emr'+(EMPO.cur==='all'?' on':'')+'" data-emp="all"><span class="esw" style="background:var(--line);color:var(--ink)">'+(IC.people?'':'')+'★</span><span class="rt"><span class="a">Todos os clientes</span><span class="b">'+MULTI.emps.length+' clientes</span></span>'+(EMPO.cur==='all'?'<span class="pill ok">Aberto</span>':IC.chev18)+'</button>':'';
 h+=L.map(function(e){var on=e.id===EMPO.cur;return '<button type="button" class="r emr'+(on?' on':'')+'" data-emp="'+e.id+'"><span class="esw" style="'+tsw(e.tema)+'">'+esc(ini(e.fant||e.nome))+'</span><span class="rt"><span class="a">'+esc(e.fant||e.nome)+'</span><span class="b">'+esc(e.nome)+' · CNPJ '+esc(e.cnpj)+'</span></span>'+(on?'<span class="pill ok">Aberto</span>':IC.chev18)+'</button>';}).join('');
 return h||'<p class="empty">Nenhum cliente encontrado.</p>';}
/* seletor de cliente compacto (abre a janela de clientes) */
function empSel(attr,val,all,lab){var e=val&&val!=='all'?eById(val):null;return '<button type="button" class="empsw empsel" data-empsel="'+attr+'" data-empall="'+(all?1:0)+'" aria-haspopup="dialog" style="margin:0 0 12px">'+(e?esw(e,1):'<span class="esw" style="background:var(--line);color:var(--ink);width:26px;height:26px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:12px">★</span>')+'<span>'+(lab?lab+': ':'')+esc(e?(e.fant||e.nome):'Todos os clientes')+'</span>'+IC.chevd+'</button>';}
function closeEmp(){es.hidden=true;ov2.hidden=true;ECB=null;}
ov2.addEventListener('click',closeEmp);
/* confirmação */
var cfm=$('cfm'),ov4=$('mov4'),CFCB=null;
function askGen(o){CFCB=o.cb;var sw=$('cf-sw');sw.setAttribute('style',o.e?tsw(o.e.tema):'background:linear-gradient(135deg,var(--a1),var(--a3));color:var(--onA)');sw.innerHTML=o.e?esc(ini(o.e.fant||o.e.nome)):o.ic;$('cf-t').textContent=o.t;$('cf-d').textContent=o.d;$('cf-ok').textContent=o.ok;cfm.hidden=false;ov4.hidden=false;setTimeout(function(){$('cf-ok').focus();},30);}
function closeConfirm(){cfm.hidden=true;ov4.hidden=true;CFCB=null;}
$('cf-no').addEventListener('click',closeConfirm);ov4.addEventListener('click',closeConfirm);
$('cf-ok').addEventListener('click',function(){var cb=CFCB;closeConfirm();cb&&cb();});
/* roda de temas */
var modal=$('modal-tema'),ovT=$('mov'),dk=$('modo-escuro'),hubN=$('hub-n'),slices=[].slice.call(P.querySelectorAll('.slice')),tmb=[].slice.call(modal.querySelectorAll('[data-tmodo]'));
var SUN='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>',MOON='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path></svg>';
function curName(){var a=modal.querySelector('.slice[aria-pressed="true"]');return a?a.dataset.nome:'';}
function syncWheel(){slices.forEach(function(c){var on=c.dataset.tema===UI.tema;c.setAttribute('aria-pressed',on?'true':'false');if(on)hubN.textContent=c.dataset.nome;});dk.setAttribute('aria-checked',UI.escuro?'true':'false');$('hub-s').textContent=UI.escuro?'Escuro ligado':'Escuro desligado';$('hub-ic').innerHTML=UI.escuro?SUN:MOON;tmb.forEach(function(b){b.setAttribute('aria-checked',(b.dataset.tmodo==='s')===!!UI.solido?'true':'false');});}
function setTC(k){UI.tema=k;keep();applyLook();syncWheel();}
function abrirTema(){fabClose();syncWheel();modal.hidden=false;ovT.hidden=false;(modal.querySelector('.slice[aria-pressed="true"]')||slices[0]).focus();}
function fecharTema(){modal.hidden=true;ovT.hidden=true;if(cur==='ajustes')rerender();}
$('fechar-tema').addEventListener('click',fecharTema);ovT.addEventListener('click',fecharTema);
dk.addEventListener('click',function(){UI.escuro=UI.escuro?0:1;keep();applyLook();syncWheel();});
/* tema: cor em degradê ou sólida */
tmb.forEach(function(b){b.addEventListener('click',function(){UI.solido=b.dataset.tmodo==='s'?1:0;keep();applyLook();syncWheel();});});
slices.forEach(function(c,i){c.addEventListener('click',function(){setTC(c.dataset.tema);});
 c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();setTC(c.dataset.tema);}else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();slices[(i+1)%slices.length].focus();}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();slices[(i-1+slices.length)%slices.length].focus();}});
 c.addEventListener('mouseenter',function(){hubN.textContent=c.dataset.nome;});c.addEventListener('mouseleave',function(){hubN.textContent=curName();});
 c.addEventListener('focus',function(){hubN.textContent=c.dataset.nome;});c.addEventListener('blur',function(){hubN.textContent=curName();});});
function closeAll(){fabClose();rspClose();closeSheets();closeEmp();closeConfirm();if(!modal.hidden){modal.hidden=true;ovT.hidden=true;}}
/* ===== eventos ===== */
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-dlrow],button,a');if(!t||!P.contains(t))return;if(t.tagName==='A')return;var d=t.dataset;
 if(d.dlrow){ev.stopPropagation();var dq=d.dlrow.split('|');B(dq[0]);var da=arqGet(dq[1]);done();baixarArq(da);return;}
 if(d.gfs){UI.gfs=d.gfs;keep();rerender();return;}if(t.id==='cf-ok'||t.id==='cf-no'||t.id==='fechar-tema'||t.id==='modo-escuro')return;
 if(t.hasAttribute('data-fab')){openSheet();return;}
 if(d.fgo){fabClose();if(d.fgo==='#tema'){abrirTema();return;}if(d.fgo==='#sis'){UI.cht='sis';keep();go('msg');return;}go(d.fgo);return;}
 if(t.hasAttribute('data-chsis')){UI.cht='sis';keep();go('msg');return;}
 if(d.empfld){var fid=d.empfld;openEmp(V(fid),function(eid){setVal(fid,eid);},{t:'Escolher cliente',sub:'Para qual cliente?'});return;}
 if(d.pk){var pk=d.pk;openPick(PLT[pk]||'Selecione',PL[pk]||[],V(pk),function(v){setVal(pk,v);});return;}
 if(t.hasAttribute('data-pv')){var cb=PCB,vv=t.dataset.pv;closeSheets();cb&&cb(vv);return;}
 if(t.hasAttribute('data-pclose')){closeSheets();return;}
 if(d.dt){openCal(d.dt);return;}
 if(d.mp){openPer(d.mp);return;}
 if(t.hasAttribute('data-cmv')){var dv=+d.cmv;if(CAL.per){CAL.y+=dv;renderCal();return;}if(CAL.view==='d'){CAL.m+=dv;if(CAL.m<0){CAL.m=11;CAL.y--;}if(CAL.m>11){CAL.m=0;CAL.y++;}}else CAL.y+=dv;renderCal();return;}
 if(t.hasAttribute('data-cmode')||t.hasAttribute('data-cyear')){CAL.view='y';renderCal();return;}
 if(t.hasAttribute('data-cyr')){CAL.y=+d.cyr;CAL.view=CAL.per?null:'m';renderCal();return;}
 if(t.hasAttribute('data-cmes')&&CAL&&CAL.per){CAL.pm=+d.cmes;CAL.py=CAL.y;renderCal();return;}
 if(t.hasAttribute('data-cmes')){CAL.m=+d.cmes;CAL.view='d';renderCal();return;}
 if(t.hasAttribute('data-cday')){CAL.sel=d.cday;renderCal();return;}
 if(t.hasAttribute('data-calok')){var c0=CAL;if(!c0)return;if(!c0.per&&!c0.sel)return;closeSheets();setVal(c0.id,c0.per?MES[c0.pm]+'/'+c0.py:c0.sel);return;}
 if(t.hasAttribute('data-empsel')){var at=d.empsel,cv=at==='femp'?UI.fEmp:at==='rec'?(UI.recEmp||'all'):'all';openEmp(cv,function(id){if(at==='femp'){UI.fEmp=id;keep();rerender();}else if(at==='rec'){UI.recEmp=id;hist=[];show('rec-'+id);}},{all:d.empall==='1',t:'Escolher cliente',sub:'Mostrar só um cliente ou todos'});return;}
 if(d.emp&&t.classList.contains('emr')){var ecb=ECB;closeEmp();ecb&&ecb(d.emp);return;}
 if(t.hasAttribute('data-esclose')){closeEmp();go(d.go);return;}
 if(t.hasAttribute('data-aemp-open')){openEmp(UI.arqEmp,function(id){UI.arqEmp=id;UI.q='';keep();rerender();toast('Documentos de '+(eById(id).fant||eById(id).nome));});return;}
 if(t.hasAttribute('data-tema-go')){abrirTema();return;}
 if(t.hasAttribute('data-gcemp')){openEmp(GC.e,function(id){GC.e=id;cur='gestao';rerender();},{t:'Escolher cliente',sub:'Ver a gestão contábil de um cliente'});return;}
 if(t.hasAttribute('data-arqper')){FV['arq-comp']=arqComp();PLT['arq-comp']='Competência';openPer('arq-comp');return;}
 if(t.hasAttribute('data-gcper')){FV['gc-comp']=GC.c;PLT['gc-comp']='Competência';openPer('gc-comp');return;}
 if(d.gcnf){var gq=d.gcnf.split(':');B(GC.e);var gn=['encerrado','auto'].indexOf(cofreStOf(ST,GC.c))>-1?(((ST.cofre||{})[GC.c]||{}).notas||[])[+gq[0]]:null,gf=gn&&gcNfArq(gn,gq[1]);done();if(!gf){toast('Esta nota não tem '+String(gq[1]).toUpperCase());return;}baixarArq(gf,'Nota de exemplo: o arquivo '+String(gq[1]).toUpperCase()+' não foi guardado');return;}
 if(d.go==='arquivo'&&cur!=='arquivo'&&!/^pasta-/.test(cur))ARQC=''; /* Documentos abre no mês do sistema */
 if(d.ctnt){NLIDAS[d.ctnt]=1;nlSave();go(d.ntgo);return;}
 if(t.hasAttribute('data-ntall')){ctNotifs().forEach(function(x){NLIDAS[x.k]=1;});nlSave();rerender();return;}
 if(d.go){if(t.hasAttribute('data-tab')){hist=[];show(d.go);}else go(d.go);return;}
 if(t.hasAttribute('data-back')){back();return;}
 if(d.earq){UI.arqEmp=d.earq;ARQC='';keep();go('arquivo');return;}
 if(d.femp){UI.fEmp=d.femp;keep();rerender();return;}
 if(d.aemp){UI.arqEmp=d.aemp;UI.q='';keep();rerender();return;}
 if(d.pedsel){var pk2=d.pedsel;openPick(pk2==='pf'?'Situação do pedido':'Setor do pedido',PEDSEL[pk2]||[],pk2==='pf'?(UI.pf||'abertos'):(UI.pa||'all'),function(v){UI[pk2]=v;keep();rerender();});return;}
 if(d.cobrar){var cq=d.cobrar.split('|'),ce=B(cq[0]),pend=GRP.map(function(g){var x=celSt(g[0],cq[1]);return x.f==='aberto'||x.f==='venc'?[g[1],x]:null;}).filter(Boolean);if(!pend.length){done();toast('Nada pendente');return;}
  var tx='Olá! Para fecharmos '+cMes(cq[1])+', ainda faltam: '+pend.map(function(x){return x[0].toLowerCase()+(x[1].f==='venc'?' (prazo encerrado em '+fmtP(x[1].pz)+')':' (até '+fmtP(x[1].pz)+')');}).join(', ')+'. Qualquer dúvida, é só chamar.';
  ST.chat.push({me:0,t:tx,h:agora()});ST.unread=(ST.unread||0)+1;avisar('O contador está esperando seus envios',pend.map(function(x){return x[0];}).join(', '),'rotinas');ST.cob=ST.cob||{};ST.cob[cq[1]]=(ST.cob[cq[1]]||0)+1;done();commit('Cobrança enviada para '+(ce.fant||ce.nome));return;}
 if(d.lanc){var lq=d.lanc.split('|');B(lq[0]);ST.lanc=ST.lanc||{};var lk=lq[1]+'|'+lq[2];if(ST.lanc[lk])delete ST.lanc[lk];else ST.lanc[lk]=hoje();done();commit(ST&&0||'Checklist atualizado');return;}
 if(d.motivo){var pm=$('pd-msg');if(pm){pm.value=(pm.value?pm.value.trim()+' ':'')+d.motivo+': ';pm.focus();}return;}
 if(d.fersave!==undefined&&t.hasAttribute('data-fersave')){var fv0=($('fer-in')||{}).value||'',L=[],bad=[];fv0.split(/[,;\s]+/).filter(Boolean).forEach(function(x){var m=/^(\d{1,2})\/(\d{1,2})$/.exec(x);if(m&&+m[2]>=1&&+m[2]<=12&&+m[1]>=1&&+m[1]<=31)L.push(('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2));else bad.push(x);});if(bad.length){toast('Data inválida: '+bad[0]+' (use dd/mm)');return;}MULTI.cfg.ferMun=L;MULTI.cfg.ferCid=(($('fer-cid')||{}).value||'').trim();commit(L.length?L.length+(L.length>1?' feriados salvos':' feriado salvo'):'Sem feriados municipais');return;}
 if(d.lemb!==undefined&&t.hasAttribute('data-lemb')){var ln=+d.lemb,LL=lembDias().slice(),ix=LL.indexOf(ln);if(ix>-1)LL.splice(ix,1);else LL.push(ln);LL.sort(function(a,b){return b-a;});MULTI.cfg.lemb=LL;commit(LL.length?'Lembretes: '+LL.map(function(x){return x?x+' dia'+(x>1?'s':'')+' antes':'no último dia';}).join(', '):'Lembretes desligados');return;}
 if(t.hasAttribute('data-eqadd')){var en=(($('eq-n')||{}).value||'').trim(),ea=V('eq-a')||'todas';if(!en){toast('Digite o nome');return;}MULTI.equipe=MULTI.equipe||[];MULTI.equipe.push({id:'u'+Date.now().toString(36),n:en,area:ea});FV['eq-a']='todas';commit(en+' entrou na equipe');return;}
 if(d.eqdel){var ei=d.eqdel,eu0=(MULTI.equipe||[]).filter(function(x){return x.id===ei;})[0];askGen({t:'Remover '+(eu0?eu0.n:'')+' da equipe?',d:'Os clientes dessa pessoa ficam sem responsável.',ok:'Remover',cb:function(){MULTI.equipe=(MULTI.equipe||[]).filter(function(x){return x.id!==ei;});MULTI.emps.forEach(function(e){if(e.resp===ei)e.resp='';});if(MULTI.eu===ei)MULTI.eu='';commit('Removido da equipe');}});return;}
 if(t.hasAttribute('data-vladd')){var vt=V('vl-t'),vd=V('vl-d'),vx=(($('vl-x')||{}).value||'').trim();if(!vt||!vd){toast('Escolha o documento e a validade');return;}B(ED.id);ST.validades=ST.validades||[];ST.validades.push({id:'v'+Date.now().toString(36),tipo:vt,desc:vt==='Outro'?(vx||'Documento'):vt,ate:vd});done();FV['vl-d']='';commit('Validade cadastrada');return;}
 if(d.vldel){var vi=d.vldel;askGen({t:'Tirar esta validade?',d:'O documento deixa de ser acompanhado.',ok:'Tirar',cb:function(){B(ED.id);ST.validades=(ST.validades||[]).filter(function(x){return x.id!==vi;});done();commit('Validade removida');}});return;}
 if(t.hasAttribute('data-ltsend')){loteEnviar();return;}
 if(d.recsave){var sq=d.recsave.split('|'),soc=sq[1]==='soc',v0=($('rc-v')||{}).value||'',q0=V('rc-q'),t0=V('rc-t'),n0=(($('rc-n')||{}).value||'').trim(),i0=V('rc-i')||compOf();
  if(!errOn('rc-err',!q0?(soc?'Escolha o sócio':'Escolha o colaborador'):!t0?'Escolha o lançamento':!money(v0)?'Digite o valor':n0&&!(/^\d{1,3}$/.test(n0)&&+n0>=1&&+n0<=240)?'Parcelas: um número de 1 a 240':''))return;
  B(sq[0]);if(soc&&t0==='Pró-labore'){if(SOCD[q0])SOCD[q0].pl=v0;}else{ST.rec=ST.rec||[];ST.rec.push({id:'r'+Date.now().toString(36),al:soc?'s':'c',quem:q0,tipo:t0,valor:v0,freq:V('rc-f')||'Mensal',ini:i0,parc:n0?+n0:0,desc:(($('rc-d')||{}).value||'').trim(),desde:hoje()});}
  done();save();toast('Recorrência salva');UI.recT=soc?'soc':'col';hist=[];show('rec-'+sq[0]);return;}
 if(d.recdel){var rq=d.recdel.split('|');askGen({t:'Tirar esta recorrência?',d:'O lançamento deixa de aparecer todo mês e na folha.',ok:'Tirar',cb:function(){B(rq[0]);ST.rec=(ST.rec||[]).filter(function(x){return x.id!==rq[1];});done();commit('Recorrência removida');}});return;}
 if(d.recpl){var pq=d.recpl.split('|');askGen({t:'Tirar o pró-labore de '+pq.slice(1).join('|')+'?',d:'A ficha do sócio fica sem pró-labore. Um novo pedido do cliente pode lançar de novo.',ok:'Tirar',cb:function(){B(pq[0]);var sd=SOCD[pq.slice(1).join('|')];if(sd)sd.pl='—';done();commit('Pró-labore removido');}});return;}
 if(d.rct){UI.recT=d.rct==='soc'?'soc':'col';keep();cur='rec-'+(UI.recEmp||'all');rerender();return;}
 if(d.libdias){var cx=CTX;if(!cx)return;B(cx.e);var pp=ST.ped.filter(function(x){return x.id===cx.p;})[0];if(!pp){done();return;}var nd=+d.libdias,dt=dOnly(NOW());dt.setDate(dt.getDate()+nd);var isoD=dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);ST.lib=ST.lib||{};ST.lib[pp.lk]=isoD;pp.st='ok';var lmsg='Liberado até '+fmtA(dt)+'. Pode enviar normalmente até essa data.';pp.resp=Array.isArray(pp.resp)?pp.resp:[];pp.resp.push([lmsg,agora()]);ST.chat=ST.chat||[];ST.chat.push({me:0,t:lmsg,h:agora(),go:'ped-'+pp.id,gl:'Ver pedido'});ST.unread=(ST.unread||0)+1;ST.act.unshift(['Contador liberou '+pp.tipo.replace(/^Liberar envio de /,'')+' até '+fmtA(dt),'Agora',1]);done();commit('Liberado até '+fmtA(dt));return;}
 if(d.og){UI.og=d.og;keep();rerender();return;}
 if(d.dpx){UI.dpx=UI.dpx||{};UI.dpx[d.dpx]=!UI.dpx[d.dpx];keep();rerender();return;}
 if(t.id==='pd-arq-x'){var px=$('pd-arq');if(px){px.value='';px.dispatchEvent(new Event('change',{bubbles:true}));}return;}if(t.hasAttribute('data-presp')){rspOpen();return;}if(t.hasAttribute('data-rsend')){pedResp();return;}if(t.hasAttribute('data-rclose')){rspClose();return;}
 if(d.pst){pedAct(d.pst);return;}
 if(t.hasAttribute('data-dconf')){var cc=CTX&&CTX.a&&(B(CTX.e),arqGet(CTX.a));done();if(cc&&cc.or==='cli'&&typeof cc.gi==='number'){askGen({e:eById(CTX.e),t:'Conferir e dar baixa?',d:'A guia sai de "A pagar" no app do cliente e vai para Guias pagas.',ok:'Dar baixa',cb:function(){docAct('conf');}});}else docAct('conf');return;}
 if(t.hasAttribute('data-dana')){docAct('ana');return;}
 if(t.hasAttribute('data-ddev')){docAct('devopen');return;}
 if(t.hasAttribute('data-ddevok')){docAct('dev');return;}
 if(t.hasAttribute('data-dl')){var ca=CTX&&CTX.a&&(B(CTX.e),arqGet(CTX.a));done();baixarArq(ca);return;}
 if(t.hasAttribute('data-dlo')){var ca2=CTX&&CTX.a&&(B(CTX.e),arqGet(CTX.a));done();if(ca2&&window.abrirArquivo&&abrirArquivo(ca2))toast('Abrindo '+(ca2.arq||ca2.n));else toast('Este arquivo foi registrado só pelo nome');return;}
 if(d.fecha&&!t.hasAttribute('data-ok')){var q0=d.fecha.split('|'),e0=eById(q0[0]);B(q0[0]);var f0=getFolha(q0[1]);done();if(f0)askGen({e:e0,t:'Fechar a folha de '+f0.func+'?',d:f0.tipo+' · '+f0.comp+'. O holerite fica disponível para o cliente.',ok:'Fechar folha',cb:function(){t.setAttribute('data-ok','');t.click();}});return;}
 if(d.fecha){var q=d.fecha.split('|');B(q[0]);var f=getFolha(q[1]);if(f){f.st='fechada';f.data=hoje();var a=arqAdd({n:'Holerite · '+f.func+' · '+f.tipo,arq:'holerite-'+f.func.toLowerCase().replace(/\s+/g,'-')+'.pdf',cat:'folha',comp:f.comp,or:'ct'});a.fid=f.id;
  avisar('Holerite de '+f.func+' disponível',f.tipo+' · '+f.comp,'folha-'+f.id);ativ('Folha de '+f.func+' fechada · '+f.comp);commit('Folha fechada e holerite liberado');}return;}
 if(d.ql!==undefined&&t.classList.contains('qk')){QL=QL===d.ql?'':d.ql;SCR.querySelectorAll('.qk').forEach(function(x){x.classList.toggle('on',x.dataset.ql===QL&&!!QL);});return;}
 if(d.send){envio(d.send);return;}
 if(t.hasAttribute('data-acomp')){var ak=d.acomp,cf0=MULTI.cfg;cf0.acomp=cf0.acomp||{};cf0.acomp[ak]=!acompOn(ak);commit(({notas:'Notas fiscais',extratos:'Extratos bancários',folha:'Folhas e variáveis'})[ak]+': '+(cf0.acomp[ak]?'com acompanhamento':'recebimento direto'));return;}
 if(t.hasAttribute('data-junto')){var cf=MULTI.cfg;if(cf.junto===false){cf.junto=true;}else{cf.junto=false;['notas','extratos','despesas'].forEach(function(g){if(!cf['dia_'+g])cf['dia_'+g]=cf.docsDia;});}commit(cf.junto?'Mesmo dia para todos':'Escolha o dia de cada envio');return;}
 if(t.hasAttribute('data-real')){MULTI.sim=null;commit('Voltou para a data de hoje');return;}
 if(d.etema){ED.tema=d.etema;SCR.querySelectorAll('[data-etema]').forEach(function(x){x.classList.toggle('on',x===t);});return;}
 if(t.hasAttribute('data-eesc')){ED.escuro=ED.escuro?0:1;t.setAttribute('aria-checked',ED.escuro?'true':'false');return;}
 if(t.hasAttribute('data-edsave')){edSave();return;}
 if(t.hasAttribute('data-reset')){askGen({t:'Restaurar dados de exemplo?',d:'Apaga o que foi feito no app do cliente e no do contador e volta aos dados iniciais.',ok:'Restaurar',ic:IC.clock,cb:function(){(window.syncReset?syncReset():Promise.resolve()).then(function(){location.reload();});}});return;}
});
document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(rsh&&!rsh.hidden){rspClose();return;}if(!cfm.hidden){closeConfirm();return;}if(!ps.hidden||!cs.hidden){closeSheets();return;}if(!es.hidden){closeEmp();return;}if(!modal.hidden){fecharTema();return;}if(P.classList.contains('fab-on'))fabClose();});
document.addEventListener('submit',function(e){e.preventDefault();if(e.target.id==='cform')sendMsg();});
document.addEventListener('input',function(e){var t=e.target;if(t.hasAttribute('data-money'))t.value=maskMoney(t.value);if(t.hasAttribute('data-fvk'))FV[t.id]=t.value;
 if(t.hasAttribute('data-cnpj')){var v=t.value.replace(/\D/g,'').slice(0,14);t.value=v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');}
 if(t.id==='arq-q'){UI.q=t.value;clearTimeout(window._qT);window._qT=setTimeout(function(){rerender();},250);}});
document.addEventListener('input',function(e){var t=e.target;if(t&&t.id==='es-q'){EMPO.q=t.value;var r=$('es-rows');if(r)r.innerHTML=empRows();}});
addEventListener('change',function(e){var t=e.target;if(t&&t.id==='lt-f'&&t.files){LOTE.f=[].map.call(t.files,function(x){return x.name;});LOTE.auto={};Object.keys(FV).forEach(function(x){if(/^lg\d+-[tdv]$/.test(x))delete FV[x];});if(window.upFiles)upFiles(t.files);rerender();return;}
 if(t.type==='file'){if(window.upFiles)upFiles(t.files);var l=$(t.id+'-l');if(l){var f=t.files[0];l.classList.toggle('has',!!f);l.querySelector('.a').textContent=f?f.name:'Escolher arquivo';l.querySelector('.b').textContent=f?'Toque para trocar':t.id==='pd-arq'?'PDF da guia com os dados novos. Se carregar, ele substitui o arquivo atual':'O tipo aceito depende da pasta';l.querySelector('.ri').innerHTML=f?IC.check16:IC.up16;}var lx=$(t.id+'-x');if(lx)lx.hidden=!(t.files&&t.files[0]);if(t.id==='ng-a')guiaLer(t.files[0]);if(t.id==='pd-arq'&&rsh&&!rsh.hidden)rspLer(t.files[0]);}
 if(t&&t.id==='rc-on'){var rv=$('rc-v');if(rv){rv.disabled=!t.checked;if(t.checked)rv.focus();}}
});
/* aparência e encaixe na tela */
function applyLook(){P.setAttribute('data-tema',TEMAS.some(function(t){return t[0]===UI.tema;})?UI.tema:'azul-escuro');P.setAttribute('data-escuro',UI.escuro?'1':'0');P.setAttribute('data-solido',UI.solido?'1':'0');}
function fit(){if(DESK&&innerWidth>=900){P.style.setProperty('--z','1');return;}var cw=document.documentElement.clientWidth,ch=innerHeight;if(cw<=520){P.style.setProperty('--z','1');return;}P.style.setProperty('--z',Math.min(1,(cw-32)/390,(ch-24)/844).toFixed(3));}
addEventListener('resize',fit);
/* sincronização */
window.onSyncStatus=function(){if(cur==='ajustes')rerender();};
/* puxar de cima para baixo atualiza a tela (celular): só no começo da rolagem, nunca sobre campos, painéis abertos ou áreas com rolagem própria */
(function(){var P=document.querySelector('.phone');if(!P||!window.matchMedia)return;var ind=document.createElement('div');ind.className='ptr';ind.setAttribute('aria-hidden','true');ind.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"></path></svg>';P.appendChild(ind);
 var sy=0,sx=0,st=0,scr=null,on=false,pull=false,busy=false,d=0,LIM=44,mouse=false,wa=0,wt=0;
 function snap(){var v={};P.querySelectorAll('input[id],textarea[id],select[id]').forEach(function(x){if(x.type!=='file')v[x.id]=x.value;});return v;}
 function volta(v){for(var k in v){var x=document.getElementById(k);if(x&&x.type!=='file'&&x.value!==v[k])x.value=v[k];}var t=document.getElementById('cmsg');if(t&&t.value){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,120)+'px';}}
 function pos(y,rot,vis){ind.style.transform='translate(-50%,'+y+'px)';ind.style.opacity=vis;ind.firstChild.style.transform='rotate('+rot+'deg)';}
 function fim(){ind.classList.remove('go');ind.style.transition='transform .22s,opacity .22s';pos(-48,0,0);setTimeout(function(){ind.style.transition='';busy=false;},240);}
 function aberto(){return !ps.hidden||!cs.hidden||!ov3.hidden||!modal.hidden||!es.hidden||!cfm.hidden||P.classList.contains('fab-on');}
 function visScr(){var a=P.querySelectorAll('.scr'),i;for(i=0;i<a.length;i++)if(a[i].offsetParent&&!a[i].hidden)return a[i];return null;}
 function nested(el){while(el&&el!==P&&el!==scr){var s=getComputedStyle(el);if((s.overflowY==='auto'||s.overflowY==='scroll')&&el.scrollHeight>el.clientHeight+2&&el.scrollTop>0)return true;if((s.overflowX==='auto'||s.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+4)return true;el=el.parentElement;}return false;}
 function roda(){busy=true;ind.classList.remove('rdy');ind.classList.add('go');ind.style.transition='transform .15s';pos(LIM*0.6-24,0,1);var v=snap();try{rerender();}catch(x){console.error(x);}volta(v);setTimeout(fim,650);}
 function start(x,y,t){on=pull=false;if(busy||aberto())return;if(t.closest('input,textarea,select,[contenteditable],.hcol,.chfanw,.chmw,.chemo,.psheet,.msheet,[role=dialog]'))return;
  scr=t.closest('.scr')||visScr();if(!scr||scr.scrollTop>1||nested(t))return;sx=x;sy=y;st=Date.now();on=true;d=0;}
 function move(x,y,e){if(!on)return;var dy=y-sy,dx=x-sx;
  if(!pull){if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)){on=false;return;}if(dy<-6||scr.scrollTop>1){on=false;return;}if(dy<8)return;pull=true;}
  d=Math.min(dy*0.6,LIM+36);if(e.cancelable)e.preventDefault();pos(d-40,d*3.6,Math.min(1,d/30));ind.classList.toggle('rdy',d>=LIM);}
 function end(){if(!on)return;on=false;if(!pull)return;pull=false;var dt=Date.now()-st;if(d>=LIM||(d>=26&&dt<350)){roda();}else fim();}
 P.addEventListener('touchstart',function(e){mouse=false;if(e.touches.length!==1){on=false;return;}start(e.touches[0].clientX,e.touches[0].clientY,e.target);},{passive:true});
 P.addEventListener('touchmove',function(e){move(e.touches[0].clientX,e.touches[0].clientY,e);},{passive:false});
 P.addEventListener('touchend',end,{passive:true});P.addEventListener('touchcancel',function(){if(on&&pull)fim();on=pull=false;},{passive:true});
 /* computador: arrastar com o mouse ou deslizar dois dedos no touchpad para baixo, no topo da tela */
 P.addEventListener('mousedown',function(e){if(e.button!==0||busy)return;mouse=true;start(e.clientX,e.clientY,e.target);});
 addEventListener('mousemove',function(e){if(mouse&&on)move(e.clientX,e.clientY,e);},true);
 addEventListener('mouseup',function(){if(mouse){end();mouse=false;}},true);
 P.addEventListener('wheel',function(e){if(busy||e.deltaY>=0||e.ctrlKey){if(e.deltaY>0)wa=0;return;}if(aberto())return;var t=e.target,s=t.closest('.scr')||visScr();if(!s||s.scrollTop>1||t.closest('input,textarea,select,.chmw,.chemo,.psheet,.msheet')||nested(t))return;var n=Date.now();if(n-wt>400)wa=0;wt=n;wa+=-e.deltaY;if(wa>=260){wa=0;roda();}},{passive:true});
 window.__ptr=function(){if(busy||aberto())return;roda();};
})();


/* deslizar para esquerda volta, para a direita avança (celular); para baixo atualiza (ver acima) */
(function(){var P=document.querySelector('.phone');if(!P)return;var x0=0,y0=0,t0=0,on=false;
 function livre(t){return !t.closest('input,textarea,select,[contenteditable],.psheet,.msheet,.csheet,[role=dialog],.chmw,.chemo,.hcol,.jcard')&&!hor(t);}
 function hor(el){while(el&&el!==P){var s=getComputedStyle(el);if((s.overflowX==='auto'||s.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+4)return true;el=el.parentElement;}return false;}
 function aberto(){return [ps,cs,ov3,modal,es,cfm].some(function(x){return x&&!x.hidden;})||P.classList.contains('fab-on');}
 P.addEventListener('touchstart',function(e){on=false;if(e.touches.length!==1||aberto()||!livre(e.target))return;x0=e.touches[0].clientX;y0=e.touches[0].clientY;t0=Date.now();on=true;},{passive:true});
 P.addEventListener('touchend',function(e){if(!on)return;on=false;var c=e.changedTouches[0],dx=c.clientX-x0,dy=c.clientY-y0;if(Date.now()-t0>800||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.6)return;if(dx<0)back();else forward();},{passive:true});
 window.__swipe=function(k){if(k==='l')back();else forward();};
})();
window.onSyncError=function(){toast('Não foi possível salvar no banco. A mudança ficou neste navegador.');};
window.applyRemote=function(){CLI0=MULTI.cur;if(arqCofreAll())save();rerender();};
window.__ctRerender=function(){rerender();};
applyLook();fit();if(arqCofreAll()){done();save();}
if(window.unificaArquivos)setTimeout(function(){unificaArquivos().then(function(n){if(n)rerender();});},1500);
var h0=(location.hash||'').slice(1);try{h0=decodeURIComponent(h0);}catch(e){}show(route(h0)!==null&&h0?h0:'inicio');
})();
