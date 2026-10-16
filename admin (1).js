
/* ---------- admin panel (owner only) ---------- */
(function(){
  var LT='<';
  function esc(s){return s.split(LT+'/script').join(LT+'\\/script').split(LT+'!--').join(LT+'\\!--')}
  function unesc(s){return s.split(LT+'\\/script').join(LT+'/script').split(LT+'\\!--').join(LT+'!--')}
  function jsonForHtml(o){return JSON.stringify(o).split('<').join('\\u003c').split('\u2028').join('\\u2028').split('\u2029').join('\\u2029')}
  function escAttr(s){return escHtml(s).split('"').join('&quot;')}
  function escHtml(s){return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;')}

  /* the page's own source is kept in #src-tpl so the new version can be rebuilt from data */
  function buildHtml(data){
    var holder=document.getElementById('src-tpl');
    if(!holder)throw new Error('no-template');
    var tpl=unesc(holder.textContent);
    var marker='__DA'+'TA__';
    var title=((data.profile.first||'')+' '+(data.profile.last||'')).trim()+(data.profile.role?' — '+data.profile.role:'');
    var page=tpl.replace(marker,function(){return jsonForHtml(data)});
    var svc=(data.services||[]).map(function(x){return x.name}).filter(Boolean).join(', ');
    var desc=(title+'.'+(svc?' '+svc+'.':'')).slice(0,200);
    page=page.replace(/<title>[\s\S]*?<\/title>/,function(){return '<title>'+escHtml(title)+'</title>'});
    page=page.replace(/<meta name="description" content="[^"]*">/,function(){return '<meta name="description" content="'+escAttr(desc)+'">'});
    page=page.replace(/<meta property="og:title" content="[^"]*">/,function(){return '<meta property="og:title" content="'+escAttr(title)+'">'});
    page=page.replace(/<meta property="og:description" content="[^"]*">/,function(){return '<meta property="og:description" content="'+escAttr(desc)+'">'});
    var block=LT+'script type="text/plain" id="src-tpl">'+esc(tpl)+LT+'/script>';
    return page.replace(LT+'/body>',function(){return block+'\n'+LT+'/body>'});
  }

  var panel=$('#adm'),tabsEl=$('#admTabs'),main=$('#admMain'),statusEl=$('#admStatus'),saveBtn=$('#admSave'),closeBtn=$('#admClose');
  var art=null,sampler=null,draft=null,tab='profile',changed=false,closeArmed=false,uid=0,openSet={};

  function clone(o){return JSON.parse(JSON.stringify(o))}
  function hash(str){var h=5381;for(var i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return String(h)}
  function baseHash(){return hash(JSON.stringify(DATA))}
  function setStatus(t){statusEl.textContent=t||''}
  function dirty(){if(!changed){changed=true;saveBtn.disabled=false}setStatus("Saqlanmagan o'zgarishlar bor");closeArmed=false}
  function swap(a,i,j){var t=a[i];a[i]=a[j];a[j]=t}
  function newId(p){return (p||'i')+Date.now().toString(36)+Math.floor(Math.random()*1e3).toString(36)}
  function hex6(c){c=okColor(c,'#1C47C9');if(c.length===4)c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return c.slice(0,7)}

  function field(label,obj,key,o){
    o=o||{};var id='af'+(++uid),inp;
    if(o.area){inp=el('textarea',{id:id,rows:o.rows||3});inp.value=o.lines?(obj[key]||[]).join('\n'):(obj[key]||'')}
    else if(o.select){inp=el('select',{id:id});o.select.forEach(function(x){var op=el('option',{value:x[0],text:x[1]});if(String(x[0])===String(obj[key]))op.selected=true;inp.appendChild(op)})}
    else if(o.check){inp=el('input',{id:id,type:'checkbox'});inp.checked=obj[key]!==false}
    else{inp=el('input',{id:id,type:o.type||'text'});inp.value=o.csv?(obj[key]||[]).join(', '):(obj[key]==null?'':obj[key]);if(o.min!=null)inp.min=o.min;if(o.max!=null)inp.max=o.max}
    if(o.ph)inp.placeholder=o.ph;
    inp.addEventListener((o.select||o.check)?'change':'input',function(){
      var v=o.check?inp.checked:inp.value;
      if(o.num)v=Number(v)||0;
      if(o.lines)v=v.split('\n').map(function(x){return x.trim()}).filter(Boolean);
      if(o.csv)v=v.split(',').map(function(x){return x.trim()}).filter(Boolean);
      obj[key]=v;dirty();if(o.on)o.on(v);
    });
    var w=el('div',{class:o.check?'af af-check':'af'},o.check?[inp,el('label',{for:id,text:label})]:[el('label',{for:id,text:label}),inp]);
    if(o.hint)w.appendChild(el('small',{class:'afh',text:o.hint}));
    return w;
  }

  function rows(arr,build,rerender){
    var wrap=el('div');
    arr.forEach(function(it,i){
      var row=build(it,i);
      var del=el('button',{class:'abtn dan',type:'button',text:"O'chirish"});
      del.addEventListener('click',function(){
        if(del.dataset.arm){arr.splice(i,1);dirty();rerender()}
        else{del.dataset.arm='1';del.textContent='Tasdiqlash';setTimeout(function(){del.dataset.arm='';del.textContent="O'chirish"},2600)}
      });
      var ctl=el('div',{class:'arow arow-ctl'},[
        el('button',{class:'abtn',type:'button',text:'Yuqoriga',disabled:i===0,onclick:function(){swap(arr,i,i-1);dirty();rerender()}}),
        el('button',{class:'abtn',type:'button',text:'Pastga',disabled:i===arr.length-1,onclick:function(){swap(arr,i,i+1);dirty();rerender()}}),
        del]);
      row.appendChild(ctl);wrap.appendChild(row);
    });
    return wrap;
  }
  function head(title,hint,addLabel,onAdd){
    var h=el('div',null,[el('h3',{text:title}),el('p',{class:'hint',text:hint})]);
    if(onAdd){h.appendChild(el('div',{class:'alist-head'},[el('button',{class:'abtn pri',type:'button',text:addLabel,onclick:onAdd})]))}
    return h;
  }

  /* uploads: only JPG, PNG or WebP, at most 2 MB each */
  var MAX_MB=2,IMG_RULE="Eslatma: faqat JPG, PNG yoki WebP rasm yuklanadi, har bir rasm hajmi "+MAX_MB+" MB dan oshmasin.";
  function checkFile(f){
    var ok=/^image\/(jpeg|png|webp)$/.test(f.type)||(!f.type&&/\.(jpe?g|png|webp)$/i.test(f.name));
    if(!ok)return f.name+": faqat JPG, PNG yoki WebP";
    if(f.size>MAX_MB*1024*1024)return f.name+": "+(f.size/1048576).toFixed(1)+" MB, ruxsat "+MAX_MB+" MB gacha";
    return '';
  }
  /* image: shrink and keep as a data URI inside the page */
  function pickImage(file,maxW,cb){
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        var s=Math.min(1,maxW/img.width),c=document.createElement('canvas');
        c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        var out=c.toDataURL('image/webp',.8);
        if(out.indexOf('data:image/webp')!==0)out=c.toDataURL('image/jpeg',.8);
        cb(out,c.width,c.height);
      };
      img.onerror=function(){cb(null)};
      img.src=r.result;
    };
    r.onerror=function(){cb(null)};
    r.readAsDataURL(file);
  }

  /* ---- tabs ---- */
  var TABS=[['profile',"Asosiy ma'lumot"],['services',"Yo'nalishlar"],['works','Ishlar'],['gallery','Galereya'],['channels','Rasmiy kanallar'],['socials','Aloqa havolalari'],['stats','Raqamlar'],['analytics','Sayt statistikasi'],['security','Xavfsizlik']];

  function tProfile(){
    var p=draft.profile;main.textContent='';
    main.appendChild(head("Asosiy ma'lumot","Ism, kasb, qisqa bio va aloqa ma'lumotlari. Matnlarni o'zbekcha yozing: saqlaganda rus va ingliz tillariga o'zi tarjima qilinadi."));
    main.appendChild(el('div',{class:'ar'},[field('Ism',p,'first'),field('Familya',p,'last'),field('Kasb (yorliq)',p,'role')]));
    main.appendChild(field("Qisqacha bio",p,'bio',{area:true,rows:4}));
    main.appendChild(field("\"Men ...\" qatoridagi gaplar (har biri yangi qatorda)",p,'typed',{area:true,lines:true,rows:4}));
    main.appendChild(field("Shior (Men haqimda bo'limidagi katta matn)",p,'quote',{area:true,rows:3}));
    main.appendChild(el('div',{class:'ar'},[field('Email (xabarlar shu yerga tushadi)',p,'email',{type:'email'}),field('Telefon (ixtiyoriy)',p,'phone',{ph:'+998 ...'}),field('Manzil',p,'location')]));
    main.appendChild(el('div',{class:'ar'},[
      field("Tug'ilgan sana (yosh va sanoq shundan hisoblanadi)",p,'birthday',{type:'date'}),
      field('Bosh sahifa fonidagi rasmlar necha soniyada almashsin (3 dan 5 gacha)',p,'heroSec',{type:'number',num:true,min:3,max:5}),
      field("Bog'lanish formasi manzili (Telegram uchun server URL)",p,'endpoint',{ph:'https://contact.sizning-nom.workers.dev',hint:"Cloudflare Worker manzilingiz, faqat https. Bot tokeni bu yerga yozilmaydi. Bo'sh bo'lsa, forma ishlamaydi."})]));
    main.appendChild(el('h3',{text:"Men haqimda: qisqa ma'lumotlar",style:'margin-top:1.6rem'}));
    p.facts=p.facts||[];
    main.appendChild(el('div',{class:'alist-head'},[el('button',{class:'abtn',type:'button',text:"Qator qo'shish",onclick:function(){p.facts.push({k:'',v:''});dirty();tProfile()}})]));
    main.appendChild(rows(p.facts,function(f){return el('div',{class:'arow-flat'},[el('div',{class:'ar'},[field('Nomi',f,'k'),field('Qiymati',f,'v')])])},tProfile));
  }

  function tServices(){
    main.textContent='';
    main.appendChild(head("Yo'nalishlar","Qaysi ishlar bilan shug'ullanishingiz. Har bir yo'nalish Ishlar bo'limida alohida toifa bo'ladi. Foiz 0 bo'lsa, chiziq ko'rinmaydi.","Yo'nalish qo'shish",function(){
      draft.services.push({id:newId('s'),name:'',desc:'',v:0,tech:[]});dirty();tServices();
    }));
    main.appendChild(rows(draft.services,function(s){
      s.tech=s.tech||[];
      return el('div',{class:'arow-flat'},[
        el('div',{class:'ar'},[field('Nomi',s,'name'),field('Foiz (0 dan 100 gacha)',s,'v',{type:'number',num:true,min:0,max:100})]),
        field('Qisqa tavsif',s,'desc',{area:true,rows:2}),
        field("Texnologiyalar (vergul bilan)",s,'tech',{csv:true,ph:'HTML, CSS, JavaScript'})]);
    },tServices));
    main.appendChild(el('div',{style:'margin-top:1.4rem'},[field("Aylanib turuvchi lentadagi qo'shimcha so'zlar (vergul bilan)",draft,'tools',{csv:true,ph:'Git, GitHub, Netlify'})]));
  }

  function catOptions(){return draft.services.map(function(s){return [s.id,s.name||s.id]})}
  function tWorks(){
    main.textContent='';
    main.appendChild(head('Ishlar',"Har bir ishni toifasini tanlab qo'shing. Photoshop ishlari uchun rasm yuklang. Video montaj uchun videoning muqova rasmini yuklab, video havolasini (YouTube, Instagram, Telegram) yozing. Copywriting uchun matnni tavsifga yozing.","Yangi ish qo'shish",function(){
      var id=newId('w');openSet[id]=true;
      draft.works.unshift({id:id,cat:(draft.services[0]||{}).id||'',title:'Yangi ish',desc:'',url:'',tag:'',date:'',img:''});
      dirty();tWorks();
    }));
    if(!draft.works.length)main.appendChild(el('p',{class:'hint',text:"Hozircha ish yo'q."}));
    main.appendChild(rows(draft.works,function(p){
      var d=el('details',{class:'aitem'});
      if(openSet[p.id])d.open=true;
      d.addEventListener('toggle',function(){openSet[p.id]=d.open});
      var thumb=el('span',{class:'thumb'}),tt1=el('span',{class:'tt',text:p.title||'Nomsiz'}),st=el('span',{class:'st'});
      function catName(){var c=draft.services.filter(function(s){return s.id===p.cat})[0];return c?c.name:''}
      function paintSt(){st.textContent=[catName(),p.date].filter(Boolean).join(', ')}
      function paintThumb(){
        if(safeImg(p.img)){thumb.style.background='url('+p.img+') center/cover'}
        else thumb.style.background='var(--panel)';
      }
      paintThumb();paintSt();
      d.appendChild(el('summary',null,[thumb,el('span',null,[tt1,el('br'),st])]));
      var prev=el('img',{class:'pimg',alt:'Muqova'});prev.hidden=!safeImg(p.img);if(safeImg(p.img))prev.src=p.img;
      var file=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',id:'af'+(++uid)});
      file.addEventListener('change',function(){
        var f=file.files&&file.files[0];if(!f)return;
        var bad=checkFile(f);if(bad){file.value='';setStatus('Rasm qabul qilinmadi. '+bad);return}
        setStatus('Rasm tayyorlanmoqda...');
        pickImage(f,1000,function(url,w,h){
          if(!url){setStatus("Rasmni o'qib bo'lmadi");return}
          p.img=url;p.w=w;p.h=h;prev.src=url;prev.hidden=false;paintThumb();dirty();
        });
      });
      var rm=el('button',{class:'abtn',type:'button',text:"Rasmni olib tashlash",onclick:function(){p.img='';prev.hidden=true;file.value='';paintThumb();dirty()}});
      var body=el('div',{class:'abody'},[
        el('div',{class:'ar'},[
          field('Toifa',p,'cat',{select:catOptions(),on:paintSt}),
          field('Nomi',p,'title',{on:function(v){tt1.textContent=v||'Nomsiz'}})]),
        field('Tavsif yoki matn',p,'desc',{area:true,rows:5}),
        field('Havola (sayt yoki video)',p,'url',{ph:'https://...'}),
        el('div',{class:'ar'},[
          field('Qisqa yorliq',p,'tag',{ph:"Masalan: Onlayn do'kon"}),
          field('Sana yoki yil',p,'date',{ph:'2026',on:paintSt})]),
        el('div',{class:'af'},[el('label',{for:file.id,text:'Rasm yoki muqova (ixtiyoriy)'}),prev,file,el('small',{class:'afh',text:IMG_RULE}),el('div',{class:'arow'},[rm])]),
        el('p',{class:'hint',text:"Rasm bo'lmasa, kartada ishning birinchi harfi ko'rsatiladi."})
      ]);
      d.appendChild(body);
      var holder=el('div');holder.appendChild(d);
      return holder;
    },tWorks));
  }

  function tGallery(){
    main.textContent='';
    var add=el('input',{type:'file',accept:'image/jpeg,image/png,image/webp',multiple:true,id:'gup'});
    add.addEventListener('change',function(){
      var all=Array.prototype.slice.call(add.files||[]),n=0,rejected=[],files=[];
      if(!all.length)return;
      all.forEach(function(f){var bad=checkFile(f);if(bad)rejected.push(bad);else files.push(f)});
      (function next(){
        var f=files.shift();
        if(!f){
          var msg=n+" ta rasm qo'shildi.";
          if(rejected.length)msg+=" Qabul qilinmadi: "+rejected.join('; ')+".";
          tGallery();setStatus(msg);return;
        }
        setStatus('Rasm tayyorlanmoqda... ('+(n+1)+')');
        pickImage(f,1200,function(url,w,h){
          if(url){draft.gallery.unshift({id:newId('g'),img:url,w:w,h:h,cap:'',hero:true});n++;dirty()}
          next();
        });
      })();
    });
    main.appendChild(head('Galereya',"Birinchi rasm saytda katta asosiy rasm bo'ladi, keyingilari o'ng tomonda va pastda kichik kartochkalar. Saytda dastlab 6 ta rasm ko'rinadi, qolganlari «Barchasini ko'rish» tugmasi orqali ochiladi. Shaxsiy rasmlaringizni yuklang. \"Bosh sahifa fonida aylansin\" belgilangan rasmlar bosh sahifada xira orqa fon bo'lib 3 dan 5 soniyagacha almashib turadi (sizning rasmingiz joyida qoladi). Rasmlar avtomatik kichraytiriladi."));
    main.appendChild(el('p',{class:'adm-note',text:IMG_RULE}));
    main.appendChild(el('div',{class:'af'},[el('label',{for:'gup',text:"Rasmlarni tanlang (bir nechtasini birdaniga mumkin)"}),add]));
    if(!draft.gallery.length)main.appendChild(el('p',{class:'hint',text:"Hozircha rasm yo'q. Rasm qo'shilgach Galereya bo'limi saytda paydo bo'ladi."}));
    main.appendChild(rows(draft.gallery,function(g,i){
      var mk=i===0?el('p',{class:'afh',text:"Asosiy (katta) rasm"}):el('button',{class:'abtn',type:'button',text:'Asosiy qilish',onclick:function(){var x=draft.gallery.splice(i,1)[0];draft.gallery.unshift(x);dirty();tGallery()}});
      return el('div',{class:'arow-flat gal-row'},[
        el('img',{class:'gthumb',src:safeImg(g.img)?g.img:'',alt:''}),
        el('div',null,[field('Izoh (ixtiyoriy)',g,'cap'),field("Bosh sahifa fonida aylansin",g,'hero',{check:true}),mk])]);
    },tGallery));
  }

  function tChannels(){
    main.textContent='';
    var types=[['telegram','Telegram'],['instagram','Instagram'],['youtube','YouTube'],['tiktok','TikTok'],['facebook','Facebook'],['linkedin','LinkedIn'],['github','GitHub'],['x','X (Twitter)'],['link','Boshqa havola']];
    main.appendChild(head('Rasmiy kanallar',"Telegram kanal, YouTube, Instagram sahifa kabi rasmiy kanallaringiz. Saytda alohida bo'lim bo'ladi. Kanal qo'shilmaguncha bo'lim ko'rinmaydi.","Kanal qo'shish",function(){
      draft.channels.push({id:newId('c'),type:'telegram',label:'',handle:'',url:'',desc:''});dirty();tChannels();
    }));
    main.appendChild(rows(draft.channels,function(c){
      return el('div',{class:'arow-flat'},[
        el('div',{class:'ar'},[field('Turi',c,'type',{select:types}),field('Nomi',c,'label',{ph:'Mening kanalim'}),field("Ko'rinadigan yozuv",c,'handle',{ph:'@kanal'}),field('Havola',c,'url',{ph:'https://t.me/...'})]),
        field('Qisqa tavsif',c,'desc',{area:true,rows:2})]);
    },tChannels));
  }

  function tSocials(){
    main.textContent='';
    main.appendChild(head("Aloqa havolalari","Yuqori qator, Bog'lanish bo'limi va pastki qismdagi ijtimoiy tarmoq havolalaringiz. Birdaniga hammasida yangilanadi.","Tarmoq qo'shish",function(){
      draft.socials.push({id:newId('s'),type:'link',label:'',handle:'',url:''});dirty();tSocials();
    }));
    var types=[['telegram','Telegram'],['instagram','Instagram'],['github','GitHub'],['facebook','Facebook'],['youtube','YouTube'],['linkedin','LinkedIn'],['x','X (Twitter)'],['tiktok','TikTok'],['link','Boshqa havola']];
    main.appendChild(rows(draft.socials,function(s){
      return el('div',{class:'arow-flat'},[el('div',{class:'ar'},[
        field('Turi',s,'type',{select:types}),field('Nomi',s,'label',{ph:'Telegram'}),field("Ko'rinadigan yozuv",s,'handle',{ph:'@username'}),field('Havola',s,'url',{ph:'https://t.me/...'})])]);
    },tSocials));
  }

  function tStats(){
    main.textContent='';
    main.appendChild(head('Raqamlar',"Men haqimda bo'limidagi raqamlar. Faqat haqiqiy raqamlarni yozing.","Raqam qo'shish",function(){draft.stats.push({n:0,s:'',l:''});dirty();tStats()}));
    main.appendChild(rows(draft.stats,function(s){return el('div',{class:'arow-flat'},[el('div',{class:'ar'},[field('Raqam',s,'n',{type:'number',num:true,min:0}),field("Qo'shimcha (masalan +)",s,'s'),field('Yozuv',s,'l',{ph:'yillik tajriba'})])])},tStats));
  }
  var RENDER={analytics:tAnalytics,security:tSecurity,profile:tProfile,services:tServices,works:tWorks,gallery:tGallery,channels:tChannels,socials:tSocials,stats:tStats};

  /* ---- access control ----
     The real lock is the claude.ai account (only people with edit rights can publish).
     On top of that the panel asks for a login and password. The owner can create extra
     logins for trusted people and choose which sections each of them may change. */
  var enc=new TextEncoder(),MIN_PASS=10,SESSION_MIN=30,MAX_HELPERS=5,logoutBtn=null,isOwner=false,adminReady=false,sess=null;
  function b64(buf){var a=new Uint8Array(buf),t='';for(var i=0;i<a.length;i++)t+=String.fromCharCode(a[i]);return btoa(t)}
  async function derive(user,pass,saltB64,iter){
    var raw=atob(saltB64),salt=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)salt[i]=raw.charCodeAt(i);
    var key=await crypto.subtle.importKey('raw',enc.encode(user+'\n'+pass),'PBKDF2',false,['deriveBits']);
    return b64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:iter},key,256));
  }
  async function makeAuth(user,pass){
    var salt=b64(crypto.getRandomValues(new Uint8Array(16))),iter=210000;
    return {u:user,s:salt,i:iter,h:await derive(user,pass,salt,iter)};
  }
  function same(a,b){var d=a.length^b.length;for(var i=0;i<Math.min(a.length,b.length);i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
  /* older pages kept a single login at the top level: treat it as the owner */
  function accts(src){
    var a=src||DATA.admin;if(!a)return null;
    if(!a.owner&&a.u)return {owner:{u:a.u,s:a.s,i:a.i,h:a.h},helpers:[]};
    if(!a.owner)return null;
    return {owner:a.owner,helpers:a.helpers||[]};
  }
  async function login(user,pass){
    var A=accts();if(!A)return null;
    var list=[{role:'owner',acc:A.owner}].concat(A.helpers.map(function(h){return {role:'helper',id:h.id,acc:h}})),found=null;
    for(var i=0;i<list.length;i++){
      var c=list[i],h=await derive(c.acc.u,pass,c.acc.s,c.acc.i);
      if(same(h,c.acc.h)&&c.acc.u===user&&!found)found=c;
    }
    return found;
  }
  function readSession(){
    try{
      var o=JSON.parse(sessionStorage.getItem('adm-ok')||'null');
      if(!o||Date.now()-o.t>SESSION_MIN*60000)return null;
      var A=accts();if(!A)return null;
      if(o.role==='owner')return {role:'owner'};
      var h=A.helpers.filter(function(x){return x.id===o.id})[0];
      return h?{role:'helper',id:h.id,name:h.name,perms:h.perms||[]}:null;
    }catch(e){return null}
  }
  function writeSession(c){try{sessionStorage.setItem('adm-ok',JSON.stringify({t:Date.now(),role:c.role,id:c.id||null}))}catch(e){}}
  function allowedTabs(){
    if(!sess)return [];
    if(sess.role==='owner')return TABS.map(function(t){return t[0]});
    return TABS.map(function(t){return t[0]}).filter(function(k){return k!=='security'&&k!=='analytics'&&sess.perms.indexOf(k)>-1});
  }
  function lockUi(on){tabsEl.hidden=on;saveBtn.hidden=on;if(logoutBtn)logoutBtn.hidden=on||!accts()}
  function input(id,type,label,auto){
    var i=el('input',{id:id,type:type,autocomplete:auto,required:true});
    return {i:i,w:el('div',{class:'af'},[el('label',{for:id,text:label}),i])};
  }
  function notice(title,text){
    lockUi(true);main.textContent='';setStatus('');
    main.appendChild(el('div',{class:'lock'},[el('h3',{text:title}),el('p',{class:'hint',text:text})]));
  }
  function lockScreen(setup){
    lockUi(true);main.textContent='';setStatus('');
    var u=input('lk-u','text','Login','username'),p=input('lk-p','password',setup?'Parol (kamida '+MIN_PASS+' belgi)':'Parol',setup?'new-password':'current-password');
    var p2=setup?input('lk-p2','password','Parolni takrorlang','new-password'):null;
    var msg=el('p',{class:'err',role:'alert'}),btn=el('button',{class:'abtn pri',type:'submit',text:setup?"Parolni o'rnatish":'Kirish'});
    var form=el('form',{class:'lock',novalidate:true},[
      el('h3',{text:setup?"Admin uchun login va parol o'rnating":'Admin panelga kirish'}),
      el('p',{class:'hint',text:setup?"Bu panelni yana bir qulf bilan himoyalaydi. Parolni hech kimga bermang va unutmang.":"Login va parolni kiriting."}),
      u.w,p.w,p2?p2.w:null,msg,btn]);
    form.addEventListener('submit',async function(e){
      e.preventDefault();msg.textContent='';
      var user=u.i.value.trim(),pass=p.i.value;
      if(!window.crypto||!crypto.subtle){msg.textContent="Brauzer parolni tekshira olmaydi (xavfsiz ulanish kerak).";return}
      try{
        if(setup){
          if(!isOwner){msg.textContent="Faqat sahifa egasi sozlay oladi";return}
          if(user.length<3){msg.textContent="Login kamida 3 belgi bo'lsin";return}
          if(pass.length<MIN_PASS){msg.textContent="Parol kamida "+MIN_PASS+" belgidan iborat bo'lsin";return}
          if(pass.toLowerCase()===user.toLowerCase()){msg.textContent="Parol loginga o'xshamasin";return}
          if(pass!==p2.i.value){msg.textContent="Parollar bir xil emas";return}
          btn.disabled=true;btn.textContent='Saqlanmoqda...';
          draft.admin={owner:await makeAuth(user,pass),helpers:[]};changed=true;
          saveBtn.hidden=false;
          writeSession({role:'owner'});
          await save();
          if(changed){btn.disabled=false;btn.textContent="Parolni o'rnatish";delete draft.admin;lockUi(true);try{sessionStorage.removeItem('adm-ok')}catch(x){}}
          return;
        }
        var f=0,until=0;
        try{var o=JSON.parse(sessionStorage.getItem('adm-fail')||'{}');f=o.n||0;until=o.until||0}catch(x){}
        if(Date.now()<until){msg.textContent="Ko'p urinish. "+Math.ceil((until-Date.now())/1000)+" soniyadan keyin urinib ko'ring.";return}
        btn.disabled=true;
        var who=await login(user,pass);
        btn.disabled=false;
        if(who){try{sessionStorage.removeItem('adm-fail')}catch(x){}writeSession(who);sess=readSession();enterPanel();return}
        f++;var lock=f>=5?Date.now()+60000:0;
        try{sessionStorage.setItem('adm-fail',JSON.stringify({n:lock?0:f,until:lock}))}catch(x){}
        msg.textContent=lock?"Ko'p urinish. 1 daqiqadan keyin urinib ko'ring.":"Login yoki parol noto'g'ri";
        p.i.value='';
      }catch(err){btn.disabled=false;msg.textContent="Tekshirib bo'lmadi. Qayta urinib ko'ring."}
    });
    main.appendChild(form);u.i.focus();
  }
  function buildTabs(){
    tabsEl.textContent='';
    allowedTabs().forEach(function(k){
      var t=TABS.filter(function(x){return x[0]===k})[0];
      var b=el('button',{type:'button',role:'tab','data-t':k,text:t[1]});
      b.addEventListener('click',function(){showTab(k)});tabsEl.appendChild(b);
    });
  }
  function enterPanel(){
    sess=readSession();
    var ok=allowedTabs();
    if(!sess||!ok.length){notice("Ruxsat yo'q","Sizga hali hech qaysi bo'lim uchun ruxsat berilmagan. Sahifa egasiga murojaat qiling.");return}
    buildTabs();lockUi(false);
    if(ok.indexOf(tab)<0)tab=ok[0];
    showTab(tab);
  }

  /* owner only: own login + trusted people */
  function permBoxes(perms,onChange){
    var box=el('div',{class:'perms'});
    TABS.filter(function(t){return t[0]!=='security'&&t[0]!=='analytics'}).forEach(function(t){
      var id='pm'+(++uid),c=el('input',{type:'checkbox',id:id});c.checked=perms.indexOf(t[0])>-1;
      c.addEventListener('change',function(){
        var i=perms.indexOf(t[0]);
        if(c.checked&&i<0)perms.push(t[0]);if(!c.checked&&i>-1)perms.splice(i,1);
        dirty();if(onChange)onChange();
      });
      box.appendChild(el('div',{class:'af-check'},[c,el('label',{for:id,text:t[1]})]));
    });
    return box;
  }
  function tSecurity(){
    main.textContent='';
    var A=accts(draft.admin);
    if(!A){main.appendChild(el('p',{class:'hint',text:"Avval login va parol o'rnating."}));return}
    draft.admin={owner:A.owner,helpers:A.helpers};A=draft.admin;
    main.appendChild(head('Xavfsizlik va ruxsatlar',"Kirish login va parol bilan. Faqat siz (sahifa egasi) bu bo'limni ko'rasiz."));

    /* my own login */
    var u=input('sc-u','text','Yangi login','username'),cur=input('sc-c','password','Joriy parol','current-password'),n1=input('sc-n','password','Yangi parol (kamida '+MIN_PASS+' belgi, bo\'sh qoldirsangiz o\'zgarmaydi)','new-password'),n2=input('sc-n2','password','Yangi parolni takrorlang','new-password');
    u.i.value=A.owner.u;
    var msg=el('p',{class:'err',role:'alert'}),btn=el('button',{class:'abtn pri',type:'button',text:"Loginni va parolni o'zgartirish"});
    btn.addEventListener('click',async function(){
      msg.textContent='';
      var user=u.i.value.trim();
      if(user.length<3){msg.textContent="Login kamida 3 belgi bo'lsin";return}
      var h=await derive(A.owner.u,cur.i.value,A.owner.s,A.owner.i);
      if(!same(h,A.owner.h)){msg.textContent="Joriy parol noto'g'ri";return}
      var np=n1.i.value||cur.i.value;
      if(n1.i.value){
        if(np.length<MIN_PASS){msg.textContent="Yangi parol kamida "+MIN_PASS+" belgi bo'lsin";return}
        if(np!==n2.i.value){msg.textContent="Yangi parollar bir xil emas";return}
      }
      if(A.helpers.some(function(x){return x.u===user})){msg.textContent="Bu login boshqa odamga berilgan";return}
      A.owner=await makeAuth(user,np);dirty();
      setStatus("Yangi login va parol tayyor. «Saqlash va e'lon qilish» tugmasini bosing.");
      cur.i.value=n1.i.value=n2.i.value='';
    });
    main.appendChild(el('h3',{text:'Mening loginim',style:'margin-top:1.2rem'}));
    main.appendChild(el('div',{class:'lock-box'},[u.w,cur.w,n1.w,n2.w,msg,btn]));

    /* trusted people */
    main.appendChild(el('h3',{text:'Ishongan odamlar',style:'margin-top:1.8rem'}));
    main.appendChild(el('div',{class:'adm-note'},[
      el('p',{text:"Ishongan odamga huquq berish uchun ikki qadam kerak:"}),
      el('p',{text:"1) claude.ai da shu sahifani «Share» orqali o'sha odamga tahrirlash huquqi bilan ulashing. Busiz u saqlay olmaydi."}),
      el('p',{text:"2) Bu yerda unga alohida login va parol yarating, qaysi bo'limlarni o'zgartira olishini belgilang va login-parolni o'zingiz unga bering."}),
      el('p',{text:"Login-parolsiz u panelga kira olmaydi. U «Xavfsizlik» bo'limini ko'rmaydi va boshqa odamlarga ruxsat bera olmaydi. Belgilangan bo'limlar chegarasi panelda ishlaydi, shuning uchun faqat chindan ishongan odamga bering."})]));
    if(!A.helpers.length)main.appendChild(el('p',{class:'hint',text:"Hozircha hech kimga ruxsat berilmagan."}));
    main.appendChild(rows(A.helpers,function(hp){
      var pn=input('hp'+(++uid),'password','Yangi parol (parolni almashtirish uchun)','new-password'),pm=el('p',{class:'err',role:'alert'});
      var rb=el('button',{class:'abtn',type:'button',text:'Parolni almashtirish'});
      rb.addEventListener('click',async function(){
        pm.textContent='';
        if(pn.i.value.length<MIN_PASS){pm.textContent="Parol kamida "+MIN_PASS+" belgi bo'lsin";return}
        Object.assign(hp,await makeAuth(hp.u,pn.i.value));pn.i.value='';dirty();
        setStatus("Yangi parol tayyor. «Saqlash va e'lon qilish» tugmasini bosing.");
      });
      hp.perms=hp.perms||[];
      return el('div',{class:'arow-flat'},[
        el('p',null,[el('b',{text:hp.name||hp.u}),' ('+hp.u+')']),
        el('p',{class:'afh',text:"Ruxsat etilgan bo'limlar:"}),permBoxes(hp.perms),
        el('div',{style:'margin-top:.8rem'},[pn.w,pm,rb])]);
    },tSecurity));
    if(A.helpers.length<MAX_HELPERS){
      var nm=input('hn','text','Ismi (o\'zingiz uchun belgi)','off'),hu=input('hl','text','Login','off'),hpw=input('hpw','password','Parol (kamida '+MIN_PASS+' belgi)','new-password'),perms=[];
      var hm=el('p',{class:'err',role:'alert'}),hb=el('button',{class:'abtn pri',type:'button',text:'Ruxsat berish'});
      hb.addEventListener('click',async function(){
        hm.textContent='';
        var name=nm.i.value.trim(),user=hu.i.value.trim(),pass=hpw.i.value;
        if(user.length<3){hm.textContent="Login kamida 3 belgi bo'lsin";return}
        if(user===A.owner.u||A.helpers.some(function(x){return x.u===user})){hm.textContent="Bu login band";return}
        if(pass.length<MIN_PASS){hm.textContent="Parol kamida "+MIN_PASS+" belgi bo'lsin";return}
        if(pass.toLowerCase()===user.toLowerCase()){hm.textContent="Parol loginga o'xshamasin";return}
        if(!perms.length){hm.textContent="Kamida bitta bo'limni belgilang";return}
        var a=await makeAuth(user,pass);
        A.helpers.push({id:newId('h'),name:name||user,u:a.u,s:a.s,i:a.i,h:a.h,perms:perms.slice()});
        dirty();setStatus("Ruxsat tayyor. «Saqlash va e'lon qilish» tugmasini bosing.");tSecurity();
      });
      main.appendChild(el('h3',{text:"Yangi odamga ruxsat berish",style:'margin-top:1.4rem'}));
      main.appendChild(el('div',{class:'lock-box'},[nm.w,hu.w,hpw.w,el('p',{class:'afh',text:"Qaysi bo'limlarni o'zgartira oladi:"}),permBoxes(perms),hm,hb]));
    }else main.appendChild(el('p',{class:'hint',text:"Eng ko'pi bilan "+MAX_HELPERS+" ta odamga ruxsat berish mumkin."}));
  }

  /* ---- site statistics (real data only; demo is always labelled) ---- */
  function seeded(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function dayAdd(d,n){return new Date(Date.parse(d+'T00:00:00Z')+n*864e5).toISOString().slice(0,10)}
  function demoData(from,to){
    var rnd=seeded(7),span=Math.min(366,Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/864e5));
    if(span<0)span=0;
    var start=dayAdd(to,-span),series=[],v=0,u=0,today=new Date(Date.now()+5*3600e3).toISOString().slice(0,10),tv=0;
    for(var i=0;i<=span;i++){var d=dayAdd(start,i),vis=Math.round(12+rnd()*40+(i%7>4?-8:6)),un=Math.round(vis*(.6+rnd()*.2));series.push({day:d,visits:vis,uniques:un});v+=vis;u+=un;if(d===today)tv=vis}
    var split=function(total,keys,w){var out=[],left=total;keys.forEach(function(k,j){var n=j===keys.length-1?left:Math.round(total*w[j]);left-=n;out.push({key:k,n:Math.max(0,n)})});return out.filter(function(r){return r.n>0}).sort(function(a,b){return b.n-a.n})};
    var imgs=DATA.gallery.slice(0,10).map(function(g,k){return {key:g.id,label:g.cap||('Rasm '+(k+1)),n:Math.round((60-k*5)*(1+rnd()))}}).sort(function(a,b){return b.n-a.n});
    var gv=imgs.reduce(function(s,r){return s+r.n},0);
    return {demo:true,ok:true,range:{from:start,to:to},today:today,
      totals:{visits:v,uniques:Math.round(u*.55),today:tv,galleryViews:gv,gallerySection:Math.round(v*.3)},
      series:series,
      sources:split(v,['google','telegram','instagram','facebook','youtube','other','direct'],[.28,.22,.18,.04,.04,.06,.18]),
      devices:split(v,['mobile','tablet','desktop'],[.64,.06,.30]),
      topImages:imgs,
      topProjects:DATA.works.slice(0,10).map(function(w,k){return {key:w.id,label:w.title,n:Math.round((45-k*6)*(1+rnd())),clicks:Math.round((12-k)*(1+rnd()))}}).sort(function(a,b){return b.n-a.n})};
  }
  function tAnalytics(){
    main.textContent='';
    var p=draft.profile;
    main.appendChild(head('Sayt statistikasi',"Tashriflar, galereya ko'rishlari, manbalar va qurilmalar. Bu yerda faqat haqiqiy ma'lumot ko'rsatiladi. Server ulanmagan bo'lsa, raqamlar ko'rsatilmaydi. Demo ko'rinishi alohida belgilanadi."));
    main.appendChild(el('div',{class:'ar'},[
      field("Statistika serveri manzili (https)",p,'statsEndpoint',{ph:'https://portfolio-stats.sizning-nom.workers.dev',hint:"Cloudflare Worker manzili. Bo'sh bo'lsa, sayt hech narsani yig'maydi."}),
      field("Sayt manzili (rasmni ulashish uchun)",p,'siteUrl',{ph:'https://sizning-sayt.netlify.app',hint:"Ulashilgan havola shu manzilga olib boradi."})]));
    main.appendChild(el('p',{class:'hint',text:"Manzillarni o'zgartirgach, «Saqlash va e'lon qilish» tugmasini bosing."}));
    var area=el('div',{class:'sd-area'});main.appendChild(area);
    var ep=(p.statsEndpoint||'').trim().replace(/\/+$/,''),mode='none',stored='';
    try{stored=sessionStorage.getItem('sd-key')||''}catch(e){}
    if(/^https:\/\//i.test(ep))mode=stored?'live':'key';
    function paint(){
      area.textContent='';
      if(mode==='demo'){
        area.appendChild(el('button',{class:'abtn',type:'button',text:"Demo'dan chiqish",onclick:function(){mode=/^https:\/\//i.test(ep)?(stored?'live':'key'):'none';paint()}}));
        var box=el('div',{style:'margin-top:1rem'});area.appendChild(box);
        mountDashboard(box,{demo:true,banner:"DEMO: bu namunaviy raqamlar. Haqiqiy statistika emas!",load:function(f,t){return Promise.resolve(demoData(f,t))}});
        return;
      }
      if(mode==='none'){
        area.appendChild(el('div',{class:'adm-note'},[
          el('p',{text:"Statistika serveri hali ulanmagan, shuning uchun hozir hech qanday haqiqiy raqam yo'q."}),
          el('p',{text:"Ulash uchun: statistika serverini (Cloudflare Worker + D1, bepul) o'rnating va manzilini yuqoridagi maydonga yozing. Qadamlar STATISTIKA-SOZLASH.md faylida."}),
          el('p',{text:"Eslatma: tashriflar faqat sayt claude.ai dan tashqarida (masalan, Netlify'da) ochilganda hisoblanadi."})]));
        area.appendChild(el('button',{class:'abtn pri',type:'button',text:"Demo ko'rinishini ochish",onclick:function(){mode='demo';paint()}}));
        return;
      }
      if(mode==='key'){
        var ki=el('input',{type:'password',id:'sd-k',autocomplete:'off'});
        var kb=el('button',{class:'abtn pri',type:'button',text:'Ulanish'});
        kb.addEventListener('click',function(){if(!ki.value)return;stored=ki.value;try{sessionStorage.setItem('sd-key',stored)}catch(e){}mode='live';paint()});
        area.appendChild(el('div',{class:'af'},[el('label',{for:'sd-k',text:"Statistika kaliti (serverdagi ADMIN_STATS_KEY)"}),ki]));
        area.appendChild(el('div',{class:'arow'},[kb,el('button',{class:'abtn',type:'button',text:"Demo ko'rinishini ochish",onclick:function(){mode='demo';paint()}})]));
        return;
      }
      area.appendChild(el('div',{class:'arow'},[
        el('button',{class:'abtn',type:'button',text:'Kalitni almashtirish',onclick:function(){try{sessionStorage.removeItem('sd-key')}catch(e){}stored='';mode='key';paint()}}),
        el('a',{class:'abtn',href:ep+'/dashboard',target:'_blank',rel:'noopener',text:'Statistika sahifasini alohida ochish'}),
        el('button',{class:'abtn',type:'button',text:"Demo ko'rinishini ochish",onclick:function(){mode='demo';paint()}})]));
      var box2=el('div',{style:'margin-top:1rem'});area.appendChild(box2);
      mountDashboard(box2,{banner:"Haqiqiy statistika",load:function(f,t){
        return fetch(ep+'/stats?from='+f+'&to='+t,{headers:{Authorization:'Bearer '+stored}}).then(function(r){
          return r.json().then(function(j){
            if(r.status===401){try{sessionStorage.removeItem('sd-key')}catch(e){}throw new Error("Kalit noto'g'ri. «Kalitni almashtirish» tugmasini bosing.")}
            if(!r.ok||!j.ok)throw new Error('Server xatosi ('+(j.error||r.status)+')');
            return j;
          });
        },function(){
          var e=new Error("Serverga ulanib bo'lmadi. Admin panel claude.ai ichida ochilgan bo'lsa, brauzer bu yerdan tashqi serverga ulanishga ruxsat bermaydi. Statistikani serverning o'z sahifasida oching.");
          e.extra=el('a',{class:'abtn',href:ep+'/dashboard',target:'_blank',rel:'noopener',text:'Statistika sahifasini ochish'});
          throw e;
        });
      }});
    }
    paint();
  }

  function showTab(t){
    if(allowedTabs().indexOf(t)<0)return;
    tab=t;
    Array.prototype.forEach.call(tabsEl.children,function(b){b.setAttribute('aria-selected',String(b.dataset.t===t))});
    RENDER[t]();main.scrollTop=0;
  }

  function normalize(d){
    var o=clone(d),s=function(x){return typeof x==='string'?x.trim():x};
    ['first','last','role','bio','quote','email','phone','location','endpoint','birthday','statsEndpoint','siteUrl'].forEach(function(k){o.profile[k]=s(o.profile[k]||'')});
    o.profile.heroSec=Math.max(3,Math.min(5,Number(o.profile.heroSec)||4));
    o.profile.facts=(o.profile.facts||[]).filter(function(f){return (f.k||'').trim()||(f.v||'').trim()});
    o.profile.typed=(o.profile.typed||[]).filter(Boolean);
    o.services=o.services.filter(function(x){return (x.name||'').trim()}).map(function(x){
      x.id=idOf(x.id)||newId('s');x.name=s(x.name);x.desc=s(x.desc||'');x.v=Math.max(0,Math.min(100,Number(x.v)||0));x.tech=(x.tech||[]).filter(Boolean);return x});
    var ids={};o.services.forEach(function(x){ids[x.id]=1});
    o.works=o.works.filter(function(p){return (p.title||'').trim()}).map(function(p){
      p.id=idOf(p.id)||newId('w');['title','desc','url','tag','date'].forEach(function(k){p[k]=s(p[k]||'')});
      if(!ids[p.cat])p.cat=(o.services[0]||{}).id||'';
      delete p.art;
      if(!safeImg(p.img)){p.img='';delete p.w;delete p.h}else{p.w=Number(p.w)||undefined;p.h=Number(p.h)||undefined}
      return p});
    o.gallery=o.gallery.filter(function(g){return safeImg(g.img)}).map(function(g){g.id=idOf(g.id)||newId('g');g.cap=s(g.cap||'');g.hero=g.hero!==false;g.w=Number(g.w)||undefined;g.h=Number(g.h)||undefined;return g});
    o.channels=o.channels.filter(function(x){return (x.url||'').trim()}).map(function(x){x.id=idOf(x.id)||newId('c');['label','handle','url','desc'].forEach(function(k){x[k]=s(x[k]||'')});if(!x.label)x.label=x.type;return x});
    o.socials=o.socials.filter(function(x){return (x.url||'').trim()}).map(function(x){x.id=idOf(x.id)||newId('s');['label','handle','url'].forEach(function(k){x[k]=s(x[k]||'')});if(!x.label)x.label=x.type;return x});
    o.stats=o.stats.filter(function(x){return (x.l||'').trim()}).map(function(x){x.n=Number(x.n)||0;x.s=s(x.s||'');x.l=s(x.l);return x});
    o.tools=(o.tools||[]).filter(Boolean);
    return o;
  }

  /* ---- automatic translation (Uzbek -> Russian and English), done once at save time ---- */
  function collect(o){
    var out=[];function add(x){if(typeof x==='string'&&x.trim()&&/[A-Za-z\u0400-\u04FF]/.test(x)&&out.indexOf(x)<0)out.push(x)}
    var p=o.profile;add(p.role);add(p.bio);add(p.quote);add(p.location);(p.typed||[]).forEach(add);
    (p.facts||[]).forEach(function(f){add(f.k);add(f.v)});
    o.stats.forEach(function(x){add(x.l)});
    o.services.forEach(function(x){add(x.name);add(x.desc)});
    o.works.forEach(function(x){add(x.title);add(x.desc);add(x.tag)});
    o.gallery.forEach(function(x){add(x.cap)});
    o.channels.forEach(function(x){add(x.desc)});
    return out;
  }
  async function translateAll(o){
    var tr={ru:{},en:{}},old=o.tr||{ru:{},en:{}},all=collect(o),need=[];
    all.forEach(function(s){
      if(old.ru&&old.ru[s]&&old.en&&old.en[s]){tr.ru[s]=old.ru[s];tr.en[s]=old.en[s]}
      else need.push(s);
    });
    var failed=0;
    if(need.length){
      if(!sampler){failed=need.length}
      else{
        for(var i=0;i<need.length;i+=25){
          var batch=need.slice(i,i+25);
          setStatus('Tarjima qilinmoqda... ('+Math.min(i+25,need.length)+'/'+need.length+')');
          try{
            var res=await sampler.json("Translate each of the following Uzbek (Latin script) strings into Russian and into English. Keep brand names, product names, numbers and URLs unchanged. Keep the meaning and a natural tone suitable for a personal portfolio website. Reply with only a JSON array containing exactly "+batch.length+' objects of the form {"ru":"...","en":"..."} in the same order as the input.\n\nInput:\n'+JSON.stringify(batch),{modelTier:'quick'});
            if(!Array.isArray(res)||res.length!==batch.length)throw new Error('shape');
            batch.forEach(function(s,k){
              var r=res[k]||{};
              if(typeof r.ru==='string'&&typeof r.en==='string'){tr.ru[s]=r.ru;tr.en[s]=r.en}else failed++;
            });
          }catch(e){failed+=batch.length;if(e&&e.code==='not_granted'){break}}
        }
      }
    }
    o.tr=tr;
    return failed;
  }

  async function save(){
    var out=normalize(draft),html;
    if(!out.profile.first){setStatus("Ism bo'sh bo'lmasin");return}
    if(out.profile.statsEndpoint&&!/^https:\/\/[^\s"'<>]+$/i.test(out.profile.statsEndpoint)){setStatus("Statistika serveri manzili https:// bilan boshlanishi kerak");return}
    if(out.profile.siteUrl&&!/^https?:\/\/[^\s"'<>]+$/i.test(out.profile.siteUrl)){setStatus("Sayt manzili http:// yoki https:// bilan boshlanishi kerak");return}
    if(out.profile.endpoint&&!/^https:\/\/[^\s"'<>]+$/i.test(out.profile.endpoint)){setStatus("Forma manzili https:// bilan boshlanishi kerak");return}
    if(/\d{8,10}:[A-Za-z0-9_-]{30,}/.test(out.profile.endpoint||'')){setStatus("Bu Telegram tokeniga o'xshaydi. Uni bu yerga yozmang!");return}
    saveBtn.disabled=true;
    var failed=await translateAll(out);
    try{html=buildHtml(out)}catch(e){setStatus("Sahifa manbasini topib bo'lmadi. Admin panel faqat claude.ai da saqlay oladi.");saveBtn.disabled=false;return}
    if(html.length>12*1024*1024){setStatus("Sahifa juda katta (rasmlar ko'p). Ba'zi rasmlarni olib tashlang.");saveBtn.disabled=false;return}
    setStatus('Saqlanmoqda...');
    try{
      await art.publish(html);
      changed=false;
      setStatus(failed?("Saqlandi, lekin "+failed+" ta matn tarjima qilinmadi. Qayta saqlab ko'ring."):"Saqlandi. Sahifa yangilanmoqda...");
    }catch(err){
      var c=err&&err.code,m="Saqlab bo'lmadi. Qayta urinib ko'ring.";
      if(c==='conflict')m="Boshqa versiya e'lon qilingan edi. Sahifa yangilanadi, o'zgarishlaringiz qayta ochilganda tiklanadi.";
      else if(c==='not_writer'||c==='not_granted')m="Bu sahifani o'zgartirishga ruxsatingiz yo'q.";
      else if(c==='too_large')m="Sahifa juda katta. Rasmlarni kamaytiring.";
      else if(c==='rate_limited')m="Juda tez-tez saqlayapsiz. Bir ozdan keyin urinib ko'ring.";
      /* keep the draft only for a failed save, and only for the page version it was made on */
      try{sessionStorage.setItem('adm-draft',JSON.stringify({base:baseHash(),draft:out}))}catch(e2){}
      setStatus(m);saveBtn.disabled=false;
    }
  }

  function open(){
    if(!draft){
      draft=clone(DATA);
      try{
        var s=sessionStorage.getItem('adm-draft');
        if(s){
          var o=JSON.parse(s);
          if(o&&o.base===baseHash()&&o.draft){draft=o.draft;changed=true;saveBtn.disabled=false;setStatus("Oxirgi saqlanmagan o'zgarishlar tiklandi")}
          else sessionStorage.removeItem('adm-draft');
        }
      }catch(e){}
      draft.profile.facts=draft.profile.facts||[];
      ['stats','services','tools','socials','works','gallery','channels'].forEach(function(k){draft[k]=draft[k]||[]});
    }
    panel.classList.add('open');document.body.style.overflow='hidden';
    if(!accts()){
      if(isOwner)lockScreen(true);
      else notice("Admin hali sozlanmagan","Panelni faqat sahifa egasi sozlay oladi.");
      return;
    }
    sess=readSession();
    if(!sess){lockScreen(false);return}
    enterPanel();
  }
  function close(){
    if(changed&&!closeArmed){closeArmed=true;setStatus("Saqlanmagan o'zgarishlar bor. Yopish uchun yana bosing.");return}
    panel.classList.remove('open');document.body.style.overflow='';
  }

  logoutBtn=el('button',{class:'abtn',type:'button',text:'Chiqish',hidden:true});
  statusEl.parentNode.insertBefore(logoutBtn,closeBtn);
  logoutBtn.addEventListener('click',function(){
    try{sessionStorage.removeItem('adm-ok')}catch(e){}
    sess=null;changed=false;closeArmed=false;draft=null;panel.classList.remove('open');document.body.style.overflow='';
  });
  saveBtn.addEventListener('click',save);closeBtn.addEventListener('click',close);

  /* only the owner (or someone who can edit this page) sees the entry button */
  async function start(){
    try{
      if(!window.claude||!window.claude.use)return;
      var user=await window.claude.use('user');
      if(!user||!(await user.canEdit()))return;
      try{isOwner=!!(await user.isOwner())}catch(e){isOwner=false}
      art=await window.claude.use('artifact');
      if(!art||!document.getElementById('src-tpl'))return;
      try{sampler=await window.claude.use('sample')}catch(e){sampler=null}
      adminReady=true;
    }catch(e){}
  }
  /* the small photo in the corner is the way in; it only reacts for people who can edit this page */
  var avatar=$('#hdrAvatar');
  if(avatar)avatar.addEventListener('click',function(e){if(!adminReady)return;e.preventDefault();e.stopPropagation();open()});
  document.addEventListener('keydown',function(e){if(adminReady&&e.altKey&&e.shiftKey&&(e.key==='A'||e.key==='a')){e.preventDefault();open()}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
