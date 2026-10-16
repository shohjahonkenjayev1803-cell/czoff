/* ---------- visual layer ----------
   Signature effects (kept few, one idea: light that moves through the story):
   1. light that changes colour from scene to scene, with a section HUD
   2. letters rising through a mask (hero name and every section title)
   3. a cursor that changes with context (desktop mouse only)
   4. scene colours that shift from section to section, with depth parallax
   5. liquid distortion on gallery pictures + 3D tilt with light on project media */
var FX=(function(){
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  var weak=(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
  var root=document.documentElement,ready=false;
  function narrow(){return window.innerWidth<1024}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function mix(a,b,t){return a+(b-a)*t}

  /* ---- 1. which scene we are in (drives the colour of the light and the HUD) ---- */
  function sections(){return $$('main section').filter(function(s){return !s.hidden})}
  function sceneNow(){
    var ss=sections(),y=window.innerHeight*.5,i=0,k;
    for(k=0;k<ss.length;k++){if(ss[k].getBoundingClientRect().top<=y)i=k}
    return {id:ss[i].id,index:i,total:ss.length};
  }

  /* ---- 2. letters rising through a mask ---- */
  function split(){
    $$('[data-split]').forEach(function(el){
      var txt=el.textContent;
      if(el.querySelector('.sc')&&el.__txt===txt)return;
      el.__txt=txt;el.setAttribute('aria-label',txt);el.textContent='';
      var idx=0;
      txt.split(/(\s+)/).forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part)){el.appendChild(document.createTextNode(' '));return}
        var w=document.createElement('span');w.className='sw';w.setAttribute('aria-hidden','true');
        Array.prototype.forEach.call(part,function(ch){var c=document.createElement('span');c.className='sc';c.style.setProperty('--i',idx++);c.textContent=ch;w.appendChild(c)});
        el.appendChild(w);
      });
      el.classList.add('is-split');
      if(el.dataset.rev)el.classList.add('in');
    });
  }
  var sio=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');e.target.dataset.rev='1';sio.unobserve(e.target)});
  },{threshold:.35}):null;
  function watchSplit(){
    $$('[data-split]').forEach(function(el){
      if(el.closest('#title'))return;
      if(el.dataset.rev){el.classList.add('in');return}
      if(!sio){el.classList.add('in');el.dataset.rev='1';return}
      sio.observe(el);
    });
  }

  /* the hero name must fill the width whatever the font is */
  function fitName(){
    var h1=$('#title'),a=$('#ln1'),b=$('#ln2'),ui=document.querySelector('.hero-ui'),st=$('#heroStage');if(!h1||!a||!b)return;
    h1.style.removeProperty('--name-fs');
    var base=parseFloat(getComputedStyle(h1).fontSize)||100,avail=h1.clientWidth,w=Math.max(a.scrollWidth,b.scrollWidth);
    if(!(w>0&&avail>0))return;
    var fs=base*avail/w*(narrow()?.99:.66);                         /* desktop: the portrait covers the right part, so the name stops before it */
    var por=$('#heroPortrait');
    if(!narrow()&&por&&por.offsetWidth)fs=Math.min(fs,base*(avail-por.offsetWidth)/w);   /* ...and on very wide screens the portrait is narrower than the column, so use its real width */
    fs=Math.min(fs,window.innerWidth*(narrow()?.3:.2),window.innerHeight*.34);
    if(!narrow()&&ui&&st){                                          /* never run into the text block above */
      var sr=st.getBoundingClientRect(),ur=ui.getBoundingClientRect(),bottom=parseFloat(getComputedStyle(h1).bottom)||0;
      var room=sr.height-bottom-(ur.bottom-sr.top)-14;
      if(room>0)fs=Math.min(fs,room/(2*.86));
    }
    h1.style.setProperty('--name-fs',fs.toFixed(1)+'px');
  }

  function fitWordmark(){
    var w=$('#wordmark');if(!w||!w.parentNode)return;
    w.style.removeProperty('--wm-fs');
    var base=parseFloat(getComputedStyle(w).fontSize)||100,avail=w.parentNode.clientWidth,tw=w.scrollWidth;
    if(!(tw>0&&avail>0))return;
    w.style.setProperty('--wm-fs',Math.min(base*avail/tw*.985,window.innerHeight*.5).toFixed(1)+'px');
  }

  /* ---- 3. context cursor ---- */
  function cursor(){
    if(!fine||reduce)return;
    var cur=$('#cur'),lbl=$('#curLbl'),ring=cur.querySelector('.cur-ring'),dot=cur.querySelector('.cur-dot');
    root.classList.add('has-cursor');
    var x=-100,y=-100,rx=-100,ry=-100,raf=0,state='';
    function setState(s){if(s===state)return;state=s;cur.setAttribute('data-s',s);lbl.textContent=s==='view'?tt('cursorView'):s==='open'?tt('cursorOpen'):''}
    function loop(){raf=0;rx+=(x-rx)*.2;ry+=(y-ry)*.2;
      ring.style.transform='translate3d('+rx.toFixed(1)+'px,'+ry.toFixed(1)+'px,0)';
      dot.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
      if(Math.abs(x-rx)>.1||Math.abs(y-ry)>.1)raf=requestAnimationFrame(loop)}
    document.addEventListener('mousemove',function(e){
      x=e.clientX;y=e.clientY;cur.classList.add('on');if(!raf)raf=requestAnimationFrame(loop);
    },{passive:true});
    document.addEventListener('mouseover',function(e){
      var t=e.target;if(!t.closest)return;
      if(t.closest('.adm'))return setState('native');
      var d=t.closest('[data-cursor]');
      if(d)return setState(d.getAttribute('data-cursor'));
      if(t.closest('input,textarea,select'))return setState('text');
      if(t.closest('a,button,[role="button"],label,.copy'))return setState('link');
      setState('');
    });
    document.addEventListener('mouseleave',function(){cur.classList.remove('on')});
    document.addEventListener('mousedown',function(){cur.classList.add('down')});
    document.addEventListener('mouseup',function(){cur.classList.remove('down')});
    /* the dot and ring are separate layers: the dot is inside .cur, positioned by transform from the viewport corner */
    cur.style.transform='none';
  }

  /* ---- magnetic buttons (desktop) ---- */
  function magnets(){
    if(!fine||reduce)return;
    document.addEventListener('mousemove',function(e){
      var m=e.target.closest&&e.target.closest('[data-magnetic]');
      $$('[data-magnetic].mag').forEach(function(b){if(b!==m){b.style.transform='';b.classList.remove('mag')}});
      if(!m)return;
      var r=m.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
      m.classList.add('mag');m.style.transform='translate('+(dx*.2).toFixed(1)+'px,'+(dy*.3).toFixed(1)+'px)';
    },{passive:true});
  }

  /* ---- 5. tilt with light on project media; liquid hover on gallery pictures ---- */
  function tilt(){
    if(!fine||reduce)return;
    var g=$('#wgrid');
    g.addEventListener('mousemove',function(e){
      var m=e.target.closest&&e.target.closest('.media');if(!m)return;
      var r=m.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      m.style.setProperty('--ry',((x-.5)*12).toFixed(2)+'deg');m.style.setProperty('--rx',((.5-y)*10).toFixed(2)+'deg');
      m.style.setProperty('--gx',(x*100).toFixed(1)+'%');m.style.setProperty('--gy',(y*100).toFixed(1)+'%');m.style.setProperty('--go','1');
    });
    g.addEventListener('mouseout',function(e){
      var m=e.target.closest&&e.target.closest('.media');if(!m||(e.relatedTarget&&m.contains(e.relatedTarget)))return;
      m.style.setProperty('--rx','0deg');m.style.setProperty('--ry','0deg');m.style.setProperty('--go','0');
    });
  }
  function liquid(){
    if(!fine||reduce||weak)return;
    var map=$('#liquidMap'),grid=$('#galGrid'),cur=0,tgt=0,img=null,raf=0;
    function tick(){
      raf=0;cur+=(tgt-cur)*.14;map.setAttribute('scale',cur.toFixed(1));
      if(tgt===0&&cur<.6){if(img){img.style.filter='';img=null}map.setAttribute('scale','0');return}
      raf=requestAnimationFrame(tick);
    }
    grid.addEventListener('mouseover',function(e){
      var t=e.target.closest&&e.target.closest('.gtile');if(!t)return;
      var im=t.querySelector('img');if(!im||im===img)return;
      if(img)img.style.filter='';
      img=im;img.style.filter='url(#liquid)';tgt=26;if(!raf)raf=requestAnimationFrame(tick);
    });
    grid.addEventListener('mouseout',function(e){
      var t=e.target.closest&&e.target.closest('.gtile');if(!t||(e.relatedTarget&&t.contains(e.relatedTarget)))return;
      tgt=0;if(!raf)raf=requestAnimationFrame(tick);
    });
  }

  /* ---- 4. depth parallax + scene colours ---- */
  function parallax(){
    if(reduce)return;
    $$('[data-depth]').forEach(function(el){
      var d=parseFloat(el.getAttribute('data-depth'))||0;
      var sec=el.__sec||(el.__sec=el.closest('section'));if(!sec)return;
      var top=sec.getBoundingClientRect().top;
      if(top>window.innerHeight*1.3||top<-sec.offsetHeight*1.3)return;
      el.style.setProperty('--py',(-top*d).toFixed(1));
    });
  }
  var lastScene='';
  function scene(){
    if(!ready)return;
    var s=sceneNow();
    if(s.id!==lastScene){lastScene=s.id;root.setAttribute('data-scene',s.id);hud(s)}
    var ft=document.querySelector('footer'),hd=$('#hud');
    if(ft&&hd)hd.classList.toggle('off',ft.getBoundingClientRect().top<window.innerHeight-40);   /* the HUD steps aside over the footer */
  }
  function hud(s){
    s=s||sceneNow();
    var n=$('#hudN'),t=$('#hudT');if(!n)return;
    n.textContent=pad(s.index+1)+' / '+pad(s.total);
    var map={home:'n_home',about:'n_about',services:'n_services',works:'n_works',gallery:'n_gallery',channels:'n_channels',contact:'n_contact'};
    t.textContent=tt(map[s.id]||'n_home');
  }

  /* ---- start ---- */
  function init(){
    ready=true;
    scene();
    window.addEventListener('resize',function(){
      clearTimeout(init.t);init.t=setTimeout(function(){fitName();fitWordmark();scene()},120);
    });
    cursor();magnets();tilt();liquid();
    split();watchSplit();fitName();fitWordmark();
    var ff=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,900)})]):Promise.resolve();
    ff.then(function(){
      fitName();fitWordmark();
      var hero=$('#home');
      requestAnimationFrame(function(){hero.classList.add('is-in');$$('#title [data-split]').forEach(function(e){e.classList.add('in');e.dataset.rev='1'})});
    });
    if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',function(){fitName();fitWordmark()});
  }
  return {
    init:init,scroll:function(){scene();parallax()},scene:scene,hud:hud,
    theme:function(){},
    after:function(live){split();if(live){$$('[data-split]').forEach(function(e){e.classList.add('in');e.dataset.rev='1'})}else watchSplit();fitName();fitWordmark();hud()},
    info:function(){return {cursor:root.classList.contains('has-cursor')}}
  };
})();
