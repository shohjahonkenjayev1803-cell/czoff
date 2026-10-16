(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- site data + helpers ---------- */
var DATA;
try{DATA=JSON.parse($('#site-data').textContent)}catch(e){DATA={}}
DATA.profile=DATA.profile||{};
['stats','services','tools','socials','works','gallery','channels'].forEach(function(k){DATA[k]=DATA[k]||[]});
DATA.tr=DATA.tr||{ru:{},en:{}};
DATA.assets=DATA.assets||{};
var P=DATA.profile;

function el(tag,props,kids){
  var e=document.createElement(tag);
  if(props)for(var a in props){
    var v=props[a];
    if(a==='class')e.className=v;
    else if(a==='text')e.textContent=v;
    else if(a.slice(0,2)==='on')e.addEventListener(a.slice(2),v);
    else if(v===true)e.setAttribute(a,'');
    else if(v!==false&&v!=null)e.setAttribute(a,v);
  }
  (kids||[]).forEach(function(c){if(c==null||c===false)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c)});
  return e;
}
function safeUrl(u){
  u=(u||'').trim();if(!u)return '#';
  if(/^(https?:|mailto:|tel:)/i.test(u))return u;
  if(/^[\w-]+(\.[\w-]+)+(\/|$|\?)/.test(u))return 'https://'+u;
  return '#';
}
function okColor(c,d){return /^#[0-9a-f]{3,8}$/i.test(c||'')?c:d}
function safeImg(s){return typeof s==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(s)}
function pad(n){return (n<10?'0':'')+n}
function idOf(s){return String(s||'').replace(/[^\w-]/g,'')}
function setText(sel,t){var e=$(sel);if(e)e.textContent=t||''}
function fullName(){return ((P.first||'')+' '+(P.last||'')).trim()}

/* ---------- languages ---------- */
var LANGS=['uz','ru','en'];
var lang='uz';
try{var _sl=localStorage.getItem('lang');if(LANGS.indexOf(_sl)>-1)lang=_sl}catch(e){}
/*UI*/
UI.wPause={uz:"To'xtatish",ru:'Пауза',en:'Pause'};
UI.wPlay={uz:'Davom ettirish',ru:'Продолжить',en:'Play'};
UI.download={uz:'Yuklab olish',ru:'Скачать',en:'Download'};
UI.share={uz:'Ulashish',ru:'Поделиться',en:'Share'};
UI.copyLink={uz:'Havolani nusxalash',ru:'Копировать ссылку',en:'Copy link'};
UI.linkCopied={uz:'Havola nusxalandi',ru:'Ссылка скопирована',en:'Link copied'};
UI.linkFail={uz:"Nusxalab bo'lmadi. Havolani qo'lda belgilang",ru:'Не удалось скопировать. Выделите ссылку вручную',en:"Couldn't copy. Select the link manually"};
UI.dlFail={uz:"Rasmni yuklab bo'lmadi",ru:'Не удалось скачать изображение',en:"Couldn't download the image"};
UI.galAll={uz:"Barchasini ko'rish ({n})",ru:'Показать все ({n})',en:'View all ({n})'};
UI.galLess={uz:"Kamroq ko'rsatish",ru:'Показать меньше',en:'Show less'};
UI.viewsN={uz:"{n} marta ko'rilgan",ru:'Просмотров: {n}',en:'{n} views'};
UI.demoTag={uz:"DEMO: namunaviy raqamlar, haqiqiy statistika emas",ru:'ДЕМО: примерные цифры, не реальная статистика',en:'DEMO: sample numbers, not real statistics'};
UI.scrollCue={uz:'Pastga',ru:'Вниз',en:'Scroll'};
UI.cursorView={uz:"Ko'rish",ru:'Смотр.',en:'View'};
UI.cursorOpen={uz:'Ochish',ru:'Открыть',en:'Open'};
UI.skip={uz:"Asosiy mazmunga o'tish",ru:'Перейти к содержимому',en:'Skip to content'};
function tt(k,v){
  var o=UI[k],s=o?(o[lang]||o.uz):k;
  if(v)for(var a in v)s=s.split('{'+a+'}').join(v[a]);
  return s;
}
function T(s){
  if(!s||lang==='uz')return s||'';
  var m=DATA.tr&&DATA.tr[lang];
  return (m&&m[s])||s;
}
/*ICONS*/
ICONS.eye='<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
ICONS.download='<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/>';
ICONS.share='<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>';
ICONS.copy='<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>';
function icon(n){var d=document.createElement('span');d.innerHTML='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||ICONS.link)+'</svg>';return d.firstChild}
function plural(n,w){var a=Math.abs(n)%100,b=a%10;if(a>10&&a<20)return w[2];if(b>1&&b<5)return w[1];if(b===1)return w[0];return w[2]}

/* ---------- theme ---------- */
var theme='dark';
try{var _t=localStorage.getItem('theme');if(_t==='light'||_t==='dark')theme=_t}catch(e){}
function applyTheme(){
  document.documentElement.dataset.theme=theme;
  var b=$('#themeBtn');
  if(b){var l=theme==='dark'?tt('themeToLight'):tt('themeToDark');b.setAttribute('aria-label',l);b.title=l}
  var m=$('meta[name="theme-color"]');if(m)m.setAttribute('content',theme==='dark'?'#04060F':'#EEF1FF');
  FX.theme(theme);
}

function secList(){return [['home','n_home'],['about','n_about'],['services','n_services'],['works','n_works'],['gallery','n_gallery'],['channels','n_channels'],['contact','n_contact']]}
function secVisible(id){
  if(id==='gallery')return DATA.gallery.some(function(g){return safeImg(g.img)});
  if(id==='channels')return DATA.channels.length>0;
  return true;
}
function typedList(){var t=(P.typed||[]).map(T).filter(Boolean);return t.length?t:[T(P.role)||'']}

/* ---------- render ---------- */
function imgSrc(sel,src,alt){var i=$(sel);if(!i)return;if(src&&i.getAttribute('src')!==src)i.src=src;i.alt=alt||''}

function setName(){
  [['#ln1',P.first],['#ln2',P.last]].forEach(function(p){
    var e=$(p[0]);if(!e)return;var v=p[1]||'';
    if(e.classList.contains('is-split')&&e.__txt===v)return;
    if(!e.classList.contains('is-split'))e.textContent=v;
  });
  setText('#wordmark',P.first||fullName());
}
function renderStatic(){
  setName();
  document.title=fullName()+(P.role?' — '+T(P.role):'');
  document.documentElement.lang=lang;
  setText('#roleTxt',T(P.role));setText('#bio',T(P.bio));setText('#quote',T(P.quote));setText('#logoTxt',P.first);
  imgSrc('#heroImg',DATA.assets.me,fullName());
  imgSrc('#hdrAvatar',DATA.assets.face,'');
  imgSrc('#cAvatar',DATA.assets.face,'');
  $$('[data-i]').forEach(function(n){n.textContent=tt(n.dataset.i)});
  var ph=$('#cmdIn');if(ph)ph.placeholder=tt('searchPh');
  $$('[data-sec]').forEach(function(n){n.hidden=!secVisible(n.dataset.sec)});

  var f=$('#facts');f.textContent='';
  (P.facts||[]).forEach(function(r){f.appendChild(el('div',null,[el('dt',{text:T(r.k)}),el('dd',{text:T(r.v)})]))});
  var st=$('#stats');st.textContent='';
  DATA.stats.forEach(function(s){
    var n=Number(s.n)||0;
    st.appendChild(el('div',{class:'stat'},[el('b',null,[el('span',{class:'num','data-to':String(n),text:String(n)}),s.s||'']),el('span',{text:T(s.l)})]));
  });
  var tl=$('#tools');tl.textContent='';
  DATA.tools.filter(Boolean).forEach(function(t){tl.appendChild(el('span',{class:'tag',text:t}))});
  tl.hidden=!tl.children.length;
}

function renderServices(){
  var g=$('#svcGrid');g.textContent='';
  DATA.services.forEach(function(s,i){
    var v=Math.max(0,Math.min(100,Number(s.v)||0));
    var card=el('article',{class:'card svc','data-reveal':'',style:'--v:'+(v/100)});
    card.appendChild(el('span',{class:'svc-n',text:pad(i+1)}));
    card.appendChild(el('h3',{text:T(s.name)}));
    if(s.desc)card.appendChild(el('p',{text:T(s.desc)}));
    if(s.tech&&s.tech.length){var t=el('div',{class:'svc-tech'});s.tech.forEach(function(x){t.appendChild(el('span',{class:'tag',text:x}))});card.appendChild(t)}
    if(v>0)card.appendChild(el('div',{class:'svc-bar'},[el('div',null,[el('span',null,[el('span',{class:'num','data-to':String(v),text:String(v)}),'%'])]),el('div',{class:'track'},[el('i')])]));
    var b=el('button',{class:'link svc-go',type:'button',text:tt('svcSee')});
    b.addEventListener('click',function(){showCat(s.id)});
    card.appendChild(b);
    g.appendChild(card);
  });
}

function socA(s,cls){
  var a=el('a',{class:cls,href:safeUrl(s.url),target:'_blank',rel:'noopener','aria-label':s.label||s.type,title:s.label||s.type});
  a.appendChild(icon(s.type));return a;
}
function renderContact(){
  var cl=$('#cList');cl.textContent='';
  if(P.email)cl.appendChild(el('li',null,[el('div',null,[el('small',{text:'Email'}),el('a',{href:'mailto:'+P.email,text:P.email})]),el('button',{class:'copy',type:'button','data-copy':P.email,text:tt('copy')})]));
  DATA.socials.forEach(function(s){
    cl.appendChild(el('li',null,[el('div',null,[el('small',{text:s.label||s.type}),el('a',{href:safeUrl(s.url),target:'_blank',rel:'noopener',text:s.handle||s.url||''})])]));
  });
  if(P.phone)cl.appendChild(el('li',null,[el('div',null,[el('small',{text:tt('lbl_phone')}),el('a',{href:'tel:'+P.phone.replace(/[^\d+]/g,''),text:P.phone})])]));
  if(P.location)cl.appendChild(el('li',null,[el('div',null,[el('small',{text:tt('lbl_loc')}),el('strong',{text:T(P.location)})])]));

  var g=$('#fGrid');g.textContent='';
  var face=el('img',{class:'avatar',alt:'',width:'40',height:'40'});if(DATA.assets.face)face.src=DATA.assets.face;
  g.appendChild(el('div',{class:'f-brand'},[face,el('b',{text:fullName()}),el('p',{text:[T(P.role),T(P.location)].filter(Boolean).join('. ')})]));
  var c1=el('div',{class:'f-col'},[el('h4',{text:tt('f_sections')})]),u1=el('ul');
  secList().forEach(function(s){if(secVisible(s[0]))u1.appendChild(el('li',null,[el('a',{href:'#'+s[0],text:tt(s[1])})]))});c1.appendChild(u1);g.appendChild(c1);
  var c2=el('div',{class:'f-col'},[el('h4',{text:tt('f_socials')})]),u2=el('ul');
  DATA.socials.concat(DATA.channels).forEach(function(s){u2.appendChild(el('li',null,[el('a',{href:safeUrl(s.url),target:'_blank',rel:'noopener'},[icon(s.type),s.label||s.type])]))});
  c2.appendChild(u2);g.appendChild(c2);
  var c3=el('div',{class:'f-col'},[el('h4',{text:tt('f_contact')})]),u3=el('ul');
  if(P.email)u3.appendChild(el('li',null,[el('a',{href:'mailto:'+P.email,text:P.email})]));
  if(P.phone)u3.appendChild(el('li',null,[el('a',{href:'tel:'+P.phone.replace(/[^\d+]/g,''),text:P.phone})]));
  c3.appendChild(u3);g.appendChild(c3);
  setText('#copyr','© '+new Date().getFullYear()+' '+(P.last||'')+' '+(P.first||'')+'. '+tt('rights'));
}

/* works with category filter */
var curCat='all';
function worksOf(){return DATA.works.filter(function(p){return curCat==='all'||p.cat===curCat})}
function renderTags(){
  var box=$('#pTags');box.textContent='';
  if(!DATA.services.length){box.hidden=true;return}
  box.hidden=false;
  function chip(label,val,count){
    var b=el('button',{class:'tg',type:'button','aria-pressed':String(curCat===val)},[label,el('small',{text:String(count)})]);
    b.addEventListener('click',function(){curCat=val;renderTags();renderWorks()});
    box.appendChild(b);
  }
  chip(tt('all'),'all',DATA.works.length);
  DATA.services.forEach(function(s){chip(T(s.name),s.id,DATA.works.filter(function(p){return p.cat===s.id}).length)});
}
function lbWork(p){return {id:p.id,kind:'work',img:safeImg(p.img)?p.img:'',title:T(p.title),text:T(p.desc),url:p.url&&p.url!=='#'?safeUrl(p.url):'',urlLabel:p.cat==='video'?tt('watch'):tt('visit')}}
function workCard(p,i,list){
  var media=el('div',{class:'media'});
  if(safeImg(p.img))media.appendChild(el('img',{src:p.img,alt:'',loading:'lazy',decoding:'async',width:p.w||null,height:p.h||null}));
  else media.appendChild(el('b',{'aria-hidden':'true',text:String(p.title||'?').trim().charAt(0).toUpperCase()}));
  if(p.cat==='video'&&p.url)media.appendChild(el('span',{class:'playb','aria-hidden':'true'},[icon('play')]));
  var meta=el('div',{class:'meta'});
  if(p.tag)meta.appendChild(el('span',{class:'tag',text:T(p.tag)}));
  if(p.date)meta.appendChild(el('span',{text:p.date}));
  var btn=el('button',{type:'button','data-cursor':'open',text:T(p.title)});
  btn.addEventListener('click',function(){openLb(list.map(lbWork),i)});
  var body=el('div',{class:'body'},[el('span',{class:'wnum','aria-hidden':'true',text:pad(i+1)}),meta.children.length?meta:null,el('h3',null,[btn]),p.desc?el('p',{text:T(p.desc)}):null]);
  if(p.url&&p.url!=='#'){
    var lk=el('a',{class:'link',href:safeUrl(p.url),target:'_blank',rel:'noopener',text:p.cat==='video'?tt('watch'):tt('visit')});
    lk.addEventListener('click',function(){track('project_click',p.id,p.title)});
    body.appendChild(lk);
  }
  return el('li',{id:'work-'+idOf(p.id),class:'wslide'},[el('article',{class:'card wc'},[media,body])]);
}
/* works: one card at a time, rotating on its own */
var wIdx=0,wTimer=null,wUser=false,wHover=false;
function wCount(){return $$('#wgrid > li.wslide').length}
function wGo(i){
  var n=wCount();if(!n)return;
  wIdx=(i+n)%n;
  $('#wgrid').style.transform='translateX('+(-wIdx*100)+'%)';
  $$('#wgrid > li').forEach(function(li,k){
    if(k===wIdx){li.removeAttribute('inert');li.setAttribute('aria-hidden','false')}
    else{li.setAttribute('inert','');li.setAttribute('aria-hidden','true')}
  });
  setText('#wN',pad(wIdx+1)+' / '+pad(n));
}
function wRestart(){
  clearInterval(wTimer);
  if(reduce||wUser||wCount()<2)return;
  wTimer=setInterval(function(){if(!document.hidden&&!wHover)wGo(wIdx+1)},5500);
}
function wPauseUi(){
  var b=$('#wPause'),l=wUser?tt('wPlay'):tt('wPause');
  b.setAttribute('aria-pressed',String(wUser));b.setAttribute('aria-label',l);b.title=l;
}
function renderWorks(){
  var g=$('#wgrid');g.textContent='';
  var list=worksOf();
  setText('#pCount',DATA.works.length?tt('nWorks',{n:list.length}):'');
  if(!list.length){g.appendChild(el('li',{class:'empty',text:tt('noWorks')}));$('#wctl').hidden=true;g.style.transform='';wIdx=0;clearInterval(wTimer);return}
  list.forEach(function(p,i){g.appendChild(workCard(p,i,list))});
  $('#wctl').hidden=list.length<2;
  $('#wPause').hidden=reduce;
  wPauseUi();wGo(0);wRestart();
}
(function(){
  var v=$('#wview'),x0=null;
  $('#wPrev').addEventListener('click',function(){wGo(wIdx-1);wRestart()});
  $('#wNext').addEventListener('click',function(){wGo(wIdx+1);wRestart()});
  $('#wPause').addEventListener('click',function(){wUser=!wUser;wPauseUi();wRestart()});
  v.addEventListener('mouseenter',function(){wHover=true});
  v.addEventListener('mouseleave',function(){wHover=false});
  v.addEventListener('focusin',function(){wHover=true});
  v.addEventListener('focusout',function(){wHover=false});
  v.addEventListener('pointerdown',function(e){x0=e.clientX});
  v.addEventListener('pointerup',function(e){
    if(x0===null)return;var d=e.clientX-x0;x0=null;
    if(Math.abs(d)>50&&e.pointerType!=='mouse'){wGo(wIdx+(d<0?1:-1));wRestart()}
  });
})();
function showCat(id){
  curCat=id;renderTags();renderWorks();
  var t=document.getElementById('works');if(t)t.scrollIntoView({behavior:reduce?'auto':'smooth'});
}

/* gallery */
var galExpanded=false,GAL_FIRST=6;
function galList(){return DATA.gallery.filter(function(x){return safeImg(x.img)})}
function lbGal(y){return {id:y.id,kind:'gallery',img:y.img,title:T(y.cap),text:'',url:'',urlLabel:''}}
function galTile(x,i,list){
  var b=el('button',{type:'button',class:'gbtn','data-cursor':'view','aria-label':(T(x.cap)||('#'+(i+1)))},[el('img',{src:x.img,alt:T(x.cap)||'',loading:'lazy',decoding:'async',width:x.w||null,height:x.h||null})]);
  b.addEventListener('click',function(){openLb(list.map(lbGal),i)});
  var eye=el('span',{class:'eye','data-eye':x.id,hidden:true},[icon('eye'),el('span',{class:'eye-n'})]);
  var bar=el('div',{class:'gbar'},[eye,x.cap?el('span',{class:'gcap',text:T(x.cap)}):null]);
  return el('figure',{class:'gtile'+(i===0?' main':''),'data-gid':x.id},[b,bar]);
}
function renderGallery(){
  var g=$('#galGrid'),list=galList(),shown=galExpanded?list:list.slice(0,GAL_FIRST);
  g.textContent='';g.setAttribute('data-n',String(Math.min(shown.length,3)));
  shown.forEach(function(x,i){g.appendChild(galTile(x,i,list))});
  var more=$('#galMore');
  more.hidden=list.length<=GAL_FIRST;
  more.textContent=galExpanded?tt('galLess'):tt('galAll',{n:list.length});
  more.setAttribute('aria-expanded',String(galExpanded));
  var d=$('#galDemo');d.hidden=!DEMO;d.textContent=DEMO?tt('demoTag'):'';
  updateEyes();
}
$('#galMore').addEventListener('click',function(){
  galExpanded=!galExpanded;renderGallery();
  if(!galExpanded){var t=document.getElementById('gallery');if(t)t.scrollIntoView({behavior:reduce?'auto':'smooth'})}
});

/* channels */
function renderChannels(){
  var g=$('#chGrid');g.textContent='';
  DATA.channels.forEach(function(c){
    g.appendChild(el('a',{class:'card chc','data-reveal':'',href:safeUrl(c.url),target:'_blank',rel:'noopener'},[
      el('span',{class:'chi'},[icon(c.type)]),el('h3',{text:c.label||c.type}),
      c.handle?el('p',{text:c.handle}):null,c.desc?el('p',{text:T(c.desc)}):null,
      el('span',{class:'chgo',text:tt('chOpen')})]));
  });
}

/* lightbox */
var lbList=[],lbIdx=0,lbPrevFocus=null;
function lbFilename(it){
  var m=/^data:image\/(\w+)/.exec(it.img||'');var ext=(m?m[1]:'webp').replace('jpeg','jpg');
  return 'portfolio-'+(idOf(it.id)||'rasm')+'.'+ext;
}
function dataUrlToBlob(u){
  var p=u.split(','),mime=/^data:([^;]+)/.exec(p[0])[1],bin=atob(p[1]),a=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  return new Blob([a],{type:mime});
}
async function lbDownload(){
  var it=lbList[lbIdx];if(!it||!it.img)return;
  var blob,name=lbFilename(it);
  try{blob=dataUrlToBlob(it.img)}catch(e){say(tt('dlFail'));return}
  try{                                              /* inside claude.ai the page may only save through the viewer's confirmation */
    var dl=(window.claude&&window.claude.use)?await window.claude.use('downloads'):null;
    if(dl){await dl.save({filename:name,data:blob});return}
  }catch(e){if(e&&e.code==='declined')return;if(!e||e.code!=='unavailable'){say(tt('dlFail'));return}}
  try{
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.rel='noopener';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
  }catch(e){say(tt('dlFail'))}
}
function ownDomain(){
  var h=location.hostname||'';
  return /^https?:$/.test(location.protocol)&&h&&!/claude|anthropic/i.test(h);
}
function shareUrl(it){
  var base=ownDomain()?location.href.split('#')[0]:((P.siteUrl||'').trim()||location.href.split('#')[0]);
  return base.split('#')[0]+'#'+(it.kind==='work'?'w-':'g-')+idOf(it.id);
}
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{var x=el('textarea',{style:'position:fixed;opacity:0',readonly:true});x.value=t;document.body.appendChild(x);x.select();var ok=document.execCommand('copy');x.remove();return !!ok}catch(e){return false}
}
async function lbShare(){
  var it=lbList[lbIdx];if(!it)return;
  var url=shareUrl(it);
  if(navigator.share){
    try{await navigator.share({title:it.title||fullName(),text:it.title||fullName(),url:url});return}
    catch(e){if(e&&e.name==='AbortError')return}     /* closed by the user; anything else falls back to copying */
  }
  if(await copyText(url)){say(tt('linkCopied'));return}
  var box=$('#lbLink');box.value=url;box.hidden=false;box.focus();box.select();say(tt('linkFail'));
}
function lbShow(){
  var it=lbList[lbIdx];if(!it)return;
  var act=$('#lbActions');act.hidden=!it.img;$('#lbLink').hidden=true;
  var canShare=!!navigator.share;
  $('#lbShare').textContent='';$('#lbShare').appendChild(icon(canShare?'share':'copy'));$('#lbShare').appendChild(document.createTextNode(' '+(canShare?tt('share'):tt('copyLink'))));
  $('#lbDl').textContent='';$('#lbDl').appendChild(icon('download'));$('#lbDl').appendChild(document.createTextNode(' '+tt('download')));
  if(it.kind==='gallery')track('gallery_view',it.id,it.title);
  else if(it.kind==='work')track('project_view',it.id,it.title);
  var fig=$('#lbFig'),img=$('#lbImg'),cap=$('#lbCap');
  fig.classList.toggle('noimg',!it.img);
  if(it.img){img.src=it.img;img.alt=it.title||''}else{img.removeAttribute('src')}
  cap.textContent='';
  if(it.title)cap.appendChild(el('h3',{text:it.title}));
  if(it.text)cap.appendChild(el('p',{class:'lb-text',text:it.text}));
  if(it.url){
    var ob=el('a',{class:'btn btn-primary',href:it.url,target:'_blank',rel:'noopener',text:it.urlLabel||tt('open')});
    if(it.kind==='work')ob.addEventListener('click',function(){track('project_click',it.id,it.title)});
    cap.appendChild(ob);
  }
  var many=lbList.length>1;$('#lbPrev').hidden=!many;$('#lbNext').hidden=!many;
}
function openLb(list,i){lbList=list;lbIdx=i;lbPrevFocus=document.activeElement;lbShow();$('#lb').classList.add('open');document.body.style.overflow='hidden';$('#lbX').focus()}
function closeLb(){$('#lb').classList.remove('open');document.body.style.overflow='';if(lbPrevFocus&&lbPrevFocus.focus)lbPrevFocus.focus()}
function lbStep(d){if(lbList.length<2)return;lbIdx=(lbIdx+d+lbList.length)%lbList.length;lbShow()}
$('#lbX').addEventListener('click',closeLb);
$('#lbDl').addEventListener('click',lbDownload);
$('#lbShare').addEventListener('click',lbShare);
$('#lbPrev').addEventListener('click',function(){lbStep(-1)});
$('#lbNext').addEventListener('click',function(){lbStep(1)});
$('#lb').addEventListener('click',function(e){if(e.target===this||e.target.id==='lbFig')closeLb()});

/* hero: gallery photos as a quiet background slider */
var hsEls=[],hsIdx=0,hsTimer=null;
function hsShow(i){
  if(!hsEls.length)return;
  hsIdx=(i+hsEls.length)%hsEls.length;
  hsEls.forEach(function(n,j){n.classList.toggle('on',j===hsIdx)});
  setText('#hsN',pad(hsIdx+1)+' / '+pad(hsEls.length));
}
function hsRestart(){
  clearInterval(hsTimer);
  if(reduce||hsEls.length<2)return;
  var s=Math.max(3,Math.min(5,Number(P.heroSec)||4))*1000;
  hsTimer=setInterval(function(){if(!document.hidden)hsShow(hsIdx+1)},s);
}
function buildSlides(){
  var box=$('#hs');box.textContent='';clearInterval(hsTimer);hsEls=[];hsIdx=0;
  var items=DATA.gallery.filter(function(g){return g.hero!==false&&safeImg(g.img)});
  items.forEach(function(g){var im=el('img',{src:g.img,alt:'',decoding:'async'});box.appendChild(im);hsEls.push(im)});
  $('#hsCtl').hidden=items.length<2;
  hsShow(0);hsRestart();
}
$('#hsPrev').addEventListener('click',function(){hsShow(hsIdx-1);hsRestart()});
$('#hsNext').addEventListener('click',function(){hsShow(hsIdx+1);hsRestart()});

/* rotating "I ..." line */
var roleTimer=null,roleIdx=0;
function startRole(){
  clearInterval(roleTimer);
  var list=typedList(),em=$('#typed');em.classList.remove('out');roleIdx=0;em.textContent=list[0]||'';
  if(reduce||list.length<2)return;
  roleTimer=setInterval(function(){
    if(document.hidden)return;
    em.classList.add('out');
    setTimeout(function(){roleIdx=(roleIdx+1)%list.length;em.textContent=list[roleIdx];em.classList.remove('out')},300);
  },3600);
}

/* birthday: age + countdown (Tashkent time) */
var tzFmt=null;
function nowTz(){
  try{
    if(!tzFmt)tzFmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    var o={};tzFmt.formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});
    return Date.UTC(+o.year,+o.month-1,+o.day,(+o.hour)%24,+o.minute,+o.second);
  }catch(e){var d=new Date();return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds())}
}
function bdayInfo(){
  var m=(P.birthday||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
  var by=+m[1],bm=+m[2]-1,bd=+m[3],now=nowTz(),n=new Date(now);
  var y=n.getUTCFullYear(),today=Date.UTC(y,n.getUTCMonth(),n.getUTCDate());
  var thisYear=Date.UTC(y,bm,bd),isToday=thisYear===today;
  var next=thisYear>=today?thisYear:Date.UTC(y+1,bm,bd);
  var age=y-by-(thisYear>today?1:0);
  var diff=Math.max(0,next-now);
  return {age:age,today:isToday,days:Math.floor(diff/864e5),h:Math.floor(diff%864e5/36e5),mi:Math.floor(diff%36e5/6e4),s:Math.floor(diff%6e4/1e3)};
}
function ageWord(n){return lang==='ru'?plural(n,['год','года','лет']):lang==='en'?(n===1?'year old':'years old'):'yosh'}
function dayWord(n){return lang==='ru'?plural(n,['день','дня','дней']):lang==='en'?(n===1?'day':'days'):'kun'}
function tickBday(){
  var b=$('#bday');if(!b||b.hidden)return;
  var i=bdayInfo();if(!i){b.hidden=true;return}
  setText('#bdAge',String(i.age));setText('#bdAgeL',ageWord(i.age));
  if(i.today){setText('#bdToday',tt('bdToday'));$('#bdCd').hidden=true;$('#bdToday').hidden=false;return}
  $('#bdCd').hidden=false;$('#bdToday').hidden=true;
  setText('#bdDays',String(i.days));setText('#bdDayL',dayWord(i.days));
  setText('#bdHms',pad(i.h)+':'+pad(i.mi)+':'+pad(i.s));
}
function renderBday(){
  var b=$('#bday');if(!b)return;
  b.hidden=!bdayInfo();if(b.hidden)return;
  setText('#bdAgeT',tt('bdAge'));setText('#bdUntil',tt('bdUntil'));
  tickBday();
}
setInterval(function(){if(!document.hidden)tickBday()},1000);

/* language switch */
function renderLang(){
  $$('.lang').forEach(function(box){
    box.textContent='';
    LANGS.forEach(function(l){
      var b=el('button',{type:'button','aria-pressed':String(l===lang),'aria-label':l==='uz'?"O'zbekcha":l==='ru'?'Русский':'English',text:l.toUpperCase()});
      b.addEventListener('click',function(){setLang(l)});box.appendChild(b);
    });
  });
}

/* counters + reveal */
function countUp(n){
  var to=+n.dataset.to;
  if(reduce){n.textContent=to;return}
  var t0=performance.now(),dur=1100;
  (function s(t){var p=Math.min(1,(t-t0)/dur),e=p===1?1:1-Math.pow(2,-10*p);n.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(s)})(t0);
}
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(!e.isIntersecting)return;
    e.target.classList.add('in');io.unobserve(e.target);
    $$('.num',e.target).forEach(countUp);
  });
},{threshold:.1,rootMargin:'0px 0px -4% 0px'}):null;
function observeAll(){
  $$('[data-reveal]:not(.in)').forEach(function(n){
    if(!io){n.classList.add('in');return}
    if(!reduce)$$('.num',n).forEach(function(x){x.textContent='0'});
    io.observe(n);
  });
}
/* safety net: never leave content hidden. Anything at or above the bottom of the screen is shown, whatever the observer did. */
function revealSweep(){
  $$('[data-reveal]:not(.in)').forEach(function(n){
    if(n.getBoundingClientRect().top<innerHeight*.96){n.classList.add('in');$$('.num',n).forEach(countUp)}
  });
}
setTimeout(revealSweep,1200);setTimeout(revealSweep,2500);
window.addEventListener('load',revealSweep);

function renderAll(live){
  renderStatic();renderServices();renderTags();renderWorks();renderGallery();renderChannels();renderContact();renderLang();renderBday();applyTheme();startRole();FX.after(!!live);
  if(live){
    $$('[data-reveal]').forEach(function(n){n.classList.add('in')});
    $$('.num').forEach(function(n){n.textContent=n.dataset.to});
    updateActive(true);
  }else observeAll();
}
function setLang(l){
  if(l===lang)return;lang=l;
  try{localStorage.setItem('lang',l)}catch(e){}
  renderAll(true);
}

/* ---------- navigation behaviour ---------- */
var hdr=$('#hdr'),pfill=$('#pfill'),plane=$('#plane'),prog=$('#progress'),homeBtn=$('#homeBtn'),_act='',lastY=0;
function updateActive(force){
  var mid=innerHeight*.4,cur='home',ss=$$('main section');
  for(var i=0;i<ss.length;i++){if(ss[i].hidden)continue;if(ss[i].getBoundingClientRect().top<=mid)cur=ss[i].id}
  if(cur===_act&&!force)return;_act=cur;
  $$('#nav a,#mnav a').forEach(function(a){
    if(a.getAttribute('href')==='#'+cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
  });
}
var ticking=false;
function onScroll(){
  ticking=false;
  var y=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;
  var pct=max>0?Math.min(1,y/max)*100:0;
  pfill.style.width=pct+'%';plane.style.left=pct+'%';prog.classList.toggle('on',y>8);
  if(Math.abs(y-lastY)>1){plane.classList.toggle('back',y<lastY);lastY=y}
  hdr.classList.toggle('scrolled',y>8);
  homeBtn.classList.toggle('show',y>innerHeight*.8);
  updateActive();
  FX.scroll();
  revealSweep();
}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
window.addEventListener('resize',function(){if(innerWidth>=1180)menu(false)});

var burger=$('#burger');
function menu(open){
  document.body.classList.toggle('menu-open',open);
  burger.setAttribute('aria-expanded',open?'true':'false');
  document.body.style.overflow=open?'hidden':'';
}
burger.addEventListener('click',function(){menu(!document.body.classList.contains('menu-open'))});
$$('#mnav a').forEach(function(a){a.addEventListener('click',function(){menu(false)})});
function toTop(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})}
homeBtn.addEventListener('click',toTop);
$('#themeBtn').addEventListener('click',function(){
  theme=theme==='dark'?'light':'dark';
  try{localStorage.setItem('theme',theme)}catch(e){}
  applyTheme();
});

/* ---------- search palette (Ctrl+K) ---------- */
(function(){
  var box=$('#cmd'),inp=$('#cmdIn'),list=$('#cmdList'),items=[],shown=[],sel=0,lastFocus=null;
  function go(id){var t=document.getElementById(id);if(t)t.scrollIntoView({behavior:reduce?'auto':'smooth'})}
  function openWork(id){
    curCat='all';renderTags();renderWorks();
    var k=worksOf().map(function(p){return p.id}).indexOf(id);
    if(k>-1){wGo(k);wRestart()}
    go('works');
    setTimeout(function(){
      var c=document.getElementById('work-'+idOf(id)),cd=c&&c.querySelector('.card');
      if(cd){cd.classList.remove('flash');void cd.offsetWidth;cd.classList.add('flash')}
    },400);
  }
  function build(){
    items=[];
    secList().forEach(function(s){if(secVisible(s[0]))items.push({t:tt(s[1]),k:tt('k_section'),a:function(){go(s[0])}})});
    DATA.works.forEach(function(p){items.push({t:T(p.title),k:tt('k_work'),a:function(){openWork(p.id)}})});
    DATA.channels.concat(DATA.socials).forEach(function(s){items.push({t:s.label||s.type,k:tt('k_link'),a:function(){window.open(safeUrl(s.url),'_blank','noopener')}})});
  }
  function paint(){
    var q=inp.value.trim().toLowerCase();
    shown=items.filter(function(it){return !q||it.t.toLowerCase().indexOf(q)>-1||it.k.toLowerCase().indexOf(q)>-1});
    list.textContent='';
    if(!shown.length){list.appendChild(el('li',{class:'cmd-empty',text:tt('none')}));return}
    if(sel>=shown.length)sel=0;
    shown.forEach(function(it,i){
      var b=el('button',{type:'button'},[it.t,el('small',{text:it.k})]);
      b.addEventListener('click',function(){pick(i)});
      b.addEventListener('mousemove',function(){if(sel!==i){sel=i;mark()}});
      list.appendChild(el('li',{class:i===sel?'sel':''},[b]));
    });
  }
  function mark(){Array.prototype.forEach.call(list.children,function(li,i){li.classList.toggle('sel',i===sel)});var s=list.children[sel];if(s&&s.scrollIntoView)s.scrollIntoView({block:'nearest'})}
  function open(){build();lastFocus=document.activeElement;inp.value='';sel=0;paint();box.classList.add('open');setTimeout(function(){inp.focus()},30)}
  function close(){box.classList.remove('open');if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function pick(i){var it=shown[i];if(!it)return;close();setTimeout(it.a,150)}
  $('#srchBtn').addEventListener('click',open);
  box.addEventListener('click',function(e){if(e.target===box)close()});
  inp.addEventListener('input',function(){sel=0;paint()});
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();if(shown.length){sel=(sel+1)%shown.length;mark()}}
    else if(e.key==='ArrowUp'){e.preventDefault();if(shown.length){sel=(sel-1+shown.length)%shown.length;mark()}}
    else if(e.key==='Enter'){e.preventDefault();pick(sel)}
  });
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();box.classList.contains('open')?close():open();return}
    if(e.key!=='Escape')return;
    if(box.classList.contains('open'))close();
    else if($('#lb').classList.contains('open'))closeLb();
    else if(document.body.classList.contains('menu-open')){menu(false);burger.focus()}
  });
  document.addEventListener('keydown',function(e){
    if(!$('#lb').classList.contains('open'))return;
    if(e.key==='ArrowLeft')lbStep(-1);else if(e.key==='ArrowRight')lbStep(1);
  });
})();

/* ---------- toast, copy, contact form ---------- */
var toast=$('#toast'),toastT;
function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){toast.classList.remove('show')},2400)}
document.addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('[data-copy]'):null;if(!b)return;
  try{navigator.clipboard.writeText(b.dataset.copy).then(function(){say(tt('copied'))},function(){say(tt('copyFail'))})}
  catch(err){say(tt('copyFail'))}
});
/* ---------- contact form -> Telegram (through your own server endpoint) ---------- */
UI.f_phone={uz:'Telefon raqami',ru:'Номер телефона',en:'Phone number'};
UI.e_name={uz:"Ismingizni to'g'ri kiriting (kamida 2 ta harf)",ru:'Введите имя (не менее 2 букв)',en:'Enter your name (at least 2 letters)'};
UI.e_phone={uz:"Telefon raqamini to'liq kiriting: +998 XX XXX XX XX",ru:'Введите номер полностью: +998 XX XXX XX XX',en:'Enter the full number: +998 XX XXX XX XX'};
UI.sending={uz:'Yuborilmoqda...',ru:'Отправка...',en:'Sending...'};
UI.sentOk={uz:'Xabaringiz muvaffaqiyatli yuborildi!',ru:'Ваше сообщение успешно отправлено!',en:'Your message was sent successfully!'};
UI.failMsg={uz:"Xabar yuborilmadi. Qayta urinib ko'ring",ru:'Сообщение не отправлено. Попробуйте ещё раз',en:'Message was not sent. Please try again'};
UI.notCfg={uz:"Forma hozircha sozlanmagan. Iltimos, Telegram yoki email orqali yozing.",ru:'Форма пока не настроена. Напишите в Telegram или на email.',en:'The form is not set up yet. Please write via Telegram or email.'};
UI.rateWait={uz:"Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",ru:'Слишком много попыток. Попробуйте чуть позже.',en:'Too many attempts. Please try again a bit later.'};
(function(){
  var form=$('#form'),send=$('#send'),nameI=$('#name'),phoneI=$('#phone'),msgI=$('#msg'),stat=$('#formStatus'),cnt=$('#msgCount');
  var sending=false,cooldown=false,firstInput=0;
  var NAME_RE=/^[\p{L}\p{M}][\p{L}\p{M}\s'’ʻ`.\-]{1,59}$/u;

  /* phone: digits only, +998 XX XXX XX XX for Uzbekistan, +<digits> for other countries */
  function phoneFormat(raw){
    var plus=/^\s*\+/.test(raw),d=String(raw).replace(/\D/g,'');
    if(!d)return {text:'',e164:'',ok:false};
    var rest,uz=true;
    if(plus){
      if(d.indexOf('998')===0)rest=d.slice(3);
      else if('998'.indexOf(d)===0)return {text:'+'+d,e164:'',ok:false};      /* still typing the country code */
      else uz=false;
    }else if(d.length>9&&d.indexOf('998')===0)rest=d.slice(3);
    else rest=d.replace(/^0/,'');
    if(!uz){d=d.slice(0,15);return {text:'+'+d,e164:'+'+d,ok:d.length>=8}}
    rest=rest.slice(0,9);
    var t='+998'+(rest?' '+rest.slice(0,2):'')+(rest.length>2?' '+rest.slice(2,5):'')+(rest.length>5?' '+rest.slice(5,7):'')+(rest.length>7?' '+rest.slice(7,9):'');
    return {text:t,e164:'+998'+rest,ok:rest.length===9&&rest.charAt(0)!=='0'};
  }
  function setPhone(v){var f=phoneFormat(v);phoneI.value=f.text;try{phoneI.setSelectionRange(f.text.length,f.text.length)}catch(e){}}
  phoneI.addEventListener('beforeinput',function(e){
    if(e.inputType&&e.inputType.indexOf('insert')===0&&e.data!=null&&/[^\d+\s]/.test(e.data))e.preventDefault();   /* letters and symbols never get in */
  });
  phoneI.addEventListener('input',function(){setPhone(phoneI.value);touch();clearErr('phone')});
  phoneI.addEventListener('focus',function(){if(!phoneI.value)setPhone('+998')});
  phoneI.addEventListener('blur',function(){if(/^\+998?$/.test(phoneI.value.trim()))phoneI.value=''});

  function touch(){if(!firstInput)firstInput=Date.now()}
  function showErr(id,key){$('#e-'+id).textContent=tt(key);$('#f-'+id).classList.add('bad');$('#'+id).setAttribute('aria-invalid','true')}
  function clearErr(id){$('#e-'+id).textContent='';$('#f-'+id).classList.remove('bad');$('#'+id).removeAttribute('aria-invalid')}
  function status(kind,text){stat.className='form-status'+(kind?' '+kind:'');stat.textContent=text||''}
  nameI.addEventListener('input',function(){touch();clearErr('name')});
  msgI.addEventListener('input',function(){touch();clearErr('msg');cnt.textContent=msgI.value.length+' / '+msgI.maxLength});

  function validate(){
    var name=nameI.value.replace(/\s+/g,' ').trim(),msg=msgI.value.trim(),ph=phoneFormat(phoneI.value),bad=[];
    ['name','phone','msg'].forEach(clearErr);
    if(!NAME_RE.test(name))bad.push(['name','e_name']);
    if(!ph.ok)bad.push(['phone','e_phone']);
    if(msg.length<10)bad.push(['msg','e_msg']);
    bad.forEach(function(b){showErr(b[0],b[1])});
    if(bad.length)$('#'+bad[0][0]).focus();
    return bad.length?null:{name:name,phone:ph.e164,message:msg};
  }
  function busy(on){
    sending=on;send.disabled=on||cooldown;
    [nameI,phoneI,msgI].forEach(function(i){i.readOnly=on});
    form.setAttribute('aria-busy',String(on));
    send.textContent=on?tt('sending'):(cooldown?tt('sent'):tt('send'));
  }
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    if(sending||cooldown)return;                               /* no double sending */
    var data=validate();if(!data)return;
    var ep=(P.endpoint||'').trim();
    if(!/^https:\/\//i.test(ep)){status('fail',tt('notCfg'));return}
    status('','');busy(true);
    var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort()},15000),delivered=false,limited=false;
    try{
      var r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},signal:ctl.signal,
        body:JSON.stringify({name:data.name,phone:data.phone,message:data.message,hp:($('#hp')||{}).value||'',t:firstInput?Date.now()-firstInput:0})});
      var j=null;try{j=await r.json()}catch(x){}
      delivered=!!(r.ok&&j&&j.ok===true);                        /* success only when the server confirmed Telegram accepted it */
      limited=r.status===429;
    }catch(err){delivered=false}
    clearTimeout(timer);
    if(delivered){
      form.reset();firstInput=0;cnt.textContent='0 / '+msgI.maxLength;
      cooldown=true;busy(false);status('ok',tt('sentOk'));
      setTimeout(function(){cooldown=false;busy(false)},8000);   /* short pause before another message */
    }else{
      busy(false);status('fail',limited?tt('rateWait'):tt('failMsg'));   /* fields stay filled */
    }
  });
  /* keep the status text in the chosen language */
  form.addEventListener('langchange',function(){});
})();

/*FX*/
/* ---------- analytics: anonymous counters, only when a statistics server is configured ---------- */
var DEMO=/[?&]demo=1(&|$)/.test(location.search);
var STATS=(P.statsEndpoint||'').trim().replace(/\/+$/,'');
var HAS_SERVER=/^https:\/\//i.test(STATS)&&!DEMO;
var DNT=navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true;
var viewCounts={gallery:{},works:{}},countsReady=DEMO,tracked={};
function rnd(n){var a=new Uint8Array(n),s='';try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<n;i++)a[i]=Math.random()*256}for(var j=0;j<n;j++)s+='abcdefghijklmnopqrstuvwxyz0123456789'.charAt(a[j]%36);return s}
function store(kind,key,make){
  var st=kind==='local'?window.localStorage:window.sessionStorage;
  try{var v=st.getItem(key);if(!v){v=make();st.setItem(key,v)}return v}catch(e){return make()}
}
var VID=store('local','pv-id',function(){return rnd(24)}),SID=store('session','pv-sid',function(){return rnd(16)});
function deviceType(){
  var coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches,short=Math.min(screen.width||innerWidth,screen.height||innerHeight),ua=navigator.userAgent||'';
  if(/iPad|Tablet/i.test(ua)||(coarse&&short>=700))return 'tablet';
  if(coarse||/Mobi|Android|iPhone/i.test(ua))return 'mobile';
  return 'desktop';
}
function sourceOf(){
  function map(s){
    s=String(s||'').toLowerCase();
    if(/(^|\.)google\./.test(s)||s==='google')return 'google';
    if(/telegram|(^|\.)t\.me$/.test(s)||s==='tg')return 'telegram';
    if(/instagram/.test(s)||s==='ig')return 'instagram';
    if(/facebook|(^|\.)fb\.com$|^fb$/.test(s))return 'facebook';
    if(/youtube|youtu\.be/.test(s)||s==='yt')return 'youtube';
    if(/yandex|(^|\.)ya\.ru$/.test(s))return 'yandex';
    return 'other';
  }
  var q=new URLSearchParams(location.search),tag=q.get('src')||q.get('utm_source');
  if(tag)return map(tag);
  var host='';try{host=document.referrer?new URL(document.referrer).hostname:''}catch(e){}
  if(!host||host===location.hostname)return 'direct';
  return map(host);
}
function post(body){
  return fetch(STATS+'/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true})
    .then(function(r){return r.json()}).catch(function(){return null});
}
function track(type,id,label){
  if(!HAS_SERVER&&!DEMO)return;
  var k=type+':'+id;
  if(DEMO){if(type==='gallery_view'&&!tracked[k]){tracked[k]=1;viewCounts.gallery[id]=demoCount(id)+1;updateEyes()}return}
  if(DNT||tracked[k])return;tracked[k]=1;
  post({type:type,id:String(id),label:String(label||'').slice(0,80),vid:VID}).then(function(r){
    if(r&&r.ok&&typeof r.n==='number'){
      if(type==='gallery_view')viewCounts.gallery[id]=r.n;else if(type==='project_view')viewCounts.works[id]=r.n;
      updateEyes();
    }
  });
}
function demoCount(id){var h=0,s=String(id);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return 3+h%120}
function countFor(id){
  if(viewCounts.gallery[id]!=null)return viewCounts.gallery[id];
  return DEMO?demoCount(id):null;
}
function updateEyes(){
  $$('[data-eye]').forEach(function(e){
    var n=countFor(e.dataset.eye);
    if(n==null||(!DEMO&&!countsReady)){e.hidden=true;return}
    e.hidden=false;e.querySelector('.eye-n').textContent=String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    e.setAttribute('aria-label',tt('viewsN',{n:n}));e.title=tt('viewsN',{n:n});
  });
}
function startAnalytics(){
  if(HAS_SERVER){
    fetch(STATS+'/counts').then(function(r){return r.json()}).then(function(j){
      if(j&&j.ok){viewCounts.gallery=j.gallery||{};viewCounts.works=j.works||{};countsReady=true;updateEyes()}
    }).catch(function(){});
    if(!DNT){
      try{if(!sessionStorage.getItem('pv-visit')){sessionStorage.setItem('pv-visit','1');post({type:'visit',vid:VID,sid:SID,src:sourceOf(),dev:deviceType()})}}catch(e){}
      var gs=document.getElementById('gallery');
      if('IntersectionObserver' in window&&gs&&!gs.hidden){
        var gio=new IntersectionObserver(function(es){if(es[0].isIntersecting){gio.disconnect();try{if(!sessionStorage.getItem('pv-gal')){sessionStorage.setItem('pv-gal','1');post({type:'gallery_section',vid:VID})}}catch(e){}}},{threshold:.25});
        gio.observe(gs);
      }
    }
  }
  updateEyes();
}
/* links like  site#g-<image id>  and  site#w-<work id>  open that image or work */
function openFromHash(){
  var m=/^#([gw])-([\w-]+)$/.exec(location.hash);if(!m)return;
  if(m[1]==='g'){
    var list=galList(),i=list.map(function(x){return x.id}).indexOf(m[2]);
    if(i>-1){var t=document.getElementById('gallery');if(t)t.scrollIntoView();openLb(list.map(lbGal),i)}
  }else{
    curCat='all';renderTags();renderWorks();
    var l2=worksOf(),k=l2.map(function(p){return p.id}).indexOf(m[2]);
    if(k>-1){wGo(k);var w=document.getElementById('works');if(w)w.scrollIntoView();openLb(l2.map(lbWork),k)}
  }
}
window.addEventListener('hashchange',openFromHash);

/* ---------- start ---------- */
renderAll(false);
FX.init();
startAnalytics();
setTimeout(openFromHash,0);
buildSlides();
onScroll();
/*ADMIN*/
})();
