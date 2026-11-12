(function(){
const P=window.PRODUCTS,PICKS=window.PICKS||{},byId=id=>P.find(p=>p.id==id);
const CATS={vapes:'Vapes',flower:'Flower',hydroxys:'Hydroxy','pre-rolls':'Pre-Rolls',edibles:'Edibles',kratom:'Kratom',shrooms:'Shrooms','smoke-accessories':'Smoke Accessories'};
const TITLES={vapes:'Vapes',flower:'Flower',hydroxys:'Hydroxys','pre-rolls':'Pre-Rolls',edibles:'Edibles',kratom:'Kratom',shrooms:'Shrooms','smoke-accessories':'Smoke Accessories',all:'All products',new:'New arrivals',trending:'Trending'};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const CFG=window.RA_CONFIG||{};const REVS=()=>(window.REVIEWS||[]).filter(r=>r&&r.text);
let cart=ld('ra_cart',{}),vis=12,state={},qdone='';
const priceTxt=p=>CFG.showPrices?m0(p.p):'Get a quote';
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailOK=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),phoneOK=v=>v.replace(/\D/g,'').length>=10;
async function send(type,data){const SUBJ={quote:'New QUOTE request',contact:'New contact message',subscribe:'New newsletter sign-up',review:'New customer REVIEW (to approve)'};
const payload=Object.assign({_subject:(SUBJ[type]||'New website lead')+' - Red Apple Distribution',_template:'table',_captcha:'false',type,site:'redappledistribution.com',submitted_at:new Date().toISOString()},data);
 if(CFG.endpoint){try{const r=await fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});return r.ok}catch(e){return false}}
 const q=ld('ra_outbox',[]);q.push(payload);sv('ra_outbox',q);return true}
const boxes=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const unit=p=>p.p;const HB='Check brand',bd=p=>p.b===HB?'':p.b;
const m2=n=>'$'+(Math.round(n*100)/100).toFixed(2),m0=n=>'$'+(Number.isInteger(n)?n:n.toFixed(2));
const dk=n=>{const m=/(\d+(?:\.\d+)?)\s*k\s*puffs?/i.exec(n)||/\b(\d+(?:\.\d+)?)\s*k\b/i.exec(n);return m?+m[1]:0};
const dSize=n=>{const m=/(\d+(?:\.\d+)?)\s*(ml|gm|g|mg)\b/i.exec(n);return m?m[1]+(m[2].toLowerCase()==='gm'?'g':m[2].toLowerCase()):''};
const dPack=n=>{const m=/(\d+)\s*(?:pc|pcs|ct)\s*\/?\s*box/i.exec(n);return m?m[1]+' per box':''};
const dList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const prodDesc=p=>{const sp=[];const k=dk(p.n);if(k)sp.push(k+'K puffs');const z=dSize(p.n);if(z)sp.push(z+' size');const pk=dPack(p.n);if(pk)sp.push(pk);if(p.f&&p.f.length)sp.push(p.f.length+(p.f.length===1?' flavor':' flavors')+' listed');return (bd(p)||'Wholesale')+' product in our '+p.c+' category'+(sp.length?', '+dList(sp):'')+'; wholesale for US retailers, 21+ only, get a quote for bulk terms.'};
const brandDesc=(b,l)=>{const cs=[...new Set(l.map(x=>x.c))];const mk=Math.max(0,...l.map(x=>dk(x.n)));const fl=new Set(l.flatMap(x=>(x.f||[]).map(y=>y.toLowerCase()))).size;const bits=[];if(mk)bits.push('puff counts up to '+mk+'K');if(fl)bits.push(fl+(fl===1?' flavor':' flavors')+' listed');return b+': '+l.length+(l.length===1?' product':' products')+' in '+dList(cs)+(bits.length?', with '+dList(bits):'')+'. Wholesale for US retailers, 21+ only; get a quote for bulk terms.'};
const strip=(p)=>p.n.replace(/[\u2013\u2014]/g,'-').replace(new RegExp('^'+p.b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s-]*','i'),'')||p.n;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}
function setText(el,t){if(!el)return;const tn=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());if(el.children.length===0||!tn.length){if(el.children.length===0)el.textContent=t;else{const d=el.querySelector('p,span');if(d&&d.children.length===0)d.textContent=t;else el.textContent=t}}else tn[0].textContent=t}
function setImg(frame,p){if(!frame)return;let im=$('img',frame);
 if(p&&p.i){frame.querySelectorAll(':scope>p,:scope>span').forEach(x=>x.remove());if(!im){im=document.createElement('img');im.className='absolute inset-0 size-full object-contain';frame.appendChild(im)}im.src=p.i;im.alt=p.n;frame.style.background=''}
 else{if(im)im.remove();frame.style.background='#1a1a1c';frame.style.display='flex';frame.style.alignItems='center';frame.style.justifyContent='center';frame.innerHTML='<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:38px;color:#e01515">'+(p?(bd(p)||p.n).slice(0,2).toUpperCase():'')+'</span>'}}
function fillGrid(c,items,fill){if(!c)return;if(!c._i){const links=$$(':scope [data-f=link]',c);if(!links.length)return;const first=links[0],row=first.parentElement;c._i={card:first.cloneNode(true),row:row===c?null:row.cloneNode(false),box:row===c?c:row.parentElement,per:row===c?0:$$(':scope>[data-f=link]',row).length||links.length}}
 const {card,row,box,per}=c._i;box.innerHTML='';let r=null;items.forEach((it,i)=>{const e=card.cloneNode(true);fill(e,it);if(!row){box.appendChild(e)}else{if(i%per===0){r=row.cloneNode(false);box.appendChild(r)}r.appendChild(e)}});}
function fillCard(e,p){setImg($('[data-f=img]',e),p);setText($('[data-f=brand]',e),bd(p).toUpperCase());setText($('[data-f=name]',e),strip(p));setText($('[data-f=price]',e),priceTxt(p));$$('[data-f=price]',e).forEach(x=>{if(!CFG.showPrices)x.classList.add('rq-getq')});cardLink(e,'/p/'+p.id,p.n);const b=$('[data-act=add-to-order]',e);if(b)b.onclick=ev=>{ev.stopPropagation();add(p.id,1);const t=b.querySelector('p')||b,o=t.textContent;t.textContent='Added';setTimeout(()=>t.textContent=o,900)}}
function add(id,n){cart[id]=(cart[id]||0)+n;if(cart[id]<1)delete cart[id];sv('ra_cart',cart);refresh()}
function slugOf(p){return Object.keys(CATS).find(k=>CATS[k]===p.c)}
function list(slug,q){let l;if(slug==='all')l=P;else if(slug==='new'||slug==='trending')l=(PICKS[slug]||[]).map(byId).filter(Boolean);else l=P.filter(p=>slugOf(p)===slug);if(q){q=q.toLowerCase();l=P.filter(p=>(p.n+' '+p.b).toLowerCase().includes(q))}return l}
// ---- layout scale
function scale(){const w=innerWidth;$$('.dsk').forEach(e=>{e.style.zoom=w<1440&&(w>=900||e.classList.contains('all'))?w/1440:1});$$('.mob').forEach(e=>{e.style.zoom=Math.min(w,520)/390});$$('.agegate-wrap').forEach((x,i)=>{x.dataset.mode=i?'m':'d'})}
// ---- routes
function route(){fixUrl();const pathq=curPath();const qs=new URLSearchParams(location.search);const seg=pathq.split('/');let page='home';
 if(seg[0]==='c')page='cat';else if(seg[0]==='p')page='prod';else if(seg[0]==='brands')page='brands';else if(seg[0]==='brand')page='brand';else if(seg[0]==='order'){history.replaceState(null,'',BASE+'quote');return route()}else if(['about','contact','faq','policy','quote','review','reviews'].includes(seg[0]))page=seg[0];else if(seg[0]!==''&&seg[0]!==undefined)page='nf';
 if(page==='cat'&&!TITLES[seg[1]])page='nf';if(page==='prod'&&!byId(seg[1]))page='nf';
 $$('#app>main').forEach(m=>m.hidden=m.dataset.page!==page);
 state={page,slug:seg[1],id:seg[1],brand:decodeURIComponent(seg[1]||''),q:qs.get('q')||''};vis=12;
 render();window.scrollTo(0,0);scale();document.title=({home:'Red Apple Distribution | Wholesale for US Smoke Shops',quote:'Get a Quote | Red Apple Distribution',review:'Write a Review | Red Apple Distribution',reviews:'Customer Reviews | Red Apple Distribution',about:'About Red Apple Distribution | US Wholesale Supplier',contact:'Contact Red Apple Distribution'})[page]||('Red Apple Distribution | '+(page==='cat'?TITLES[seg[1]]:page==='prod'?byId(seg[1]).n:page[0].toUpperCase()+page.slice(1)));seoTags(page,pathq)}
function render(){const pg=$('#app>main:not([hidden])');if(!pg)return;const s=state;
 if(s.page==='home'){$$('[data-grid=home-trending]',pg).forEach(c=>fillGrid(c,(PICKS.trending||[]).map(byId).filter(Boolean).slice(0,4),fillCard))}
 if(s.page==='cat'){const l=list(s.slug,s.q),title=s.q?'Search results':TITLES[s.slug];$$('[data-f=cat-title]',pg).forEach(e=>setText(e,title));$$('[data-f=cat-crumb]',pg).forEach(e=>setText(e,title));
  $$('[data-f=cat-sub]',pg).forEach(e=>{e.hidden=s.slug==='new'||s.slug==='trending'&&false;if(!e._o)e._o=e.textContent;if(CATS[s.slug])e.textContent=e._o.replace(/Wholesale vapes/i,'Wholesale '+TITLES[s.slug].toLowerCase()).replace(/ and puff count/i,'')});
  $$('[data-f=cat-banner] img,img[data-f=cat-banner]',pg).forEach(i=>{i.src='assets/catban-vapes.jpg'});
  $$('[data-f=count]',pg).forEach(e=>setText(e,l.length+' products'));
  const sel=$$('[data-f=brandfilter]',pg);const brands=[...new Set(l.map(p=>p.b))].filter(b=>b!==HB).sort();sel.forEach(x=>{if(!x._f){x._f=1;x.onchange=()=>{vis=12;render()}}if(x._b!==s.slug+s.q){x._b=s.slug+s.q;x.innerHTML='<option value="">Brand: All</option>'+brands.map(b=>'<option>'+b+'</option>').join('')}});
  const so=$$('[data-f=sort]',pg);so.forEach(x=>{if(!x._f){x._f=1;x.onchange=()=>{vis=12;render()}}});
  let items=l;const bv=(sel[0]||{}).value;if(bv)items=items.filter(p=>p.b===bv);const sv_=(so[0]||{}).value;if(sv_==='price-asc')items=[...items].sort((a,b)=>a.p-b.p);if(sv_==='price-desc')items=[...items].sort((a,b)=>b.p-a.p);
  $$('[data-f=brandfilter-label]',pg).forEach(e=>setText(e,bv?'Brand: '+bv:'Brand: All'));$$('[data-f=sort-label]',pg).forEach(e=>{const x=so[0];setText(e,x&&x.selectedOptions[0]?x.selectedOptions[0].textContent:'Sort: Trending')});
  $$('[data-grid=cat]',pg).forEach(c=>fillGrid(c,items.slice(0,vis),fillCard));$$('[data-act=load-more]',pg).forEach(b=>b.hidden=items.length<=vis)}
 if(s.page==='prod'){const p=byId(s.id),sl=slugOf(p);$$('[data-f=p-crumb-cat]',pg).forEach(e=>setText(e,CATS[sl]||p.c));$$('[data-f=p-crumb-name]',pg).forEach(e=>setText(e,strip(p)));
  $$('[data-f=p-img]',pg).forEach(e=>setImg(e,p));$$('[data-f=p-brand]',pg).forEach(e=>setText(e,bd(p).toUpperCase()));$$('[data-f=p-name]',pg).forEach(e=>setText(e,strip(p)));$$('[data-f=p-price]',pg).forEach(e=>{setText(e,CFG.showPrices?m2(p.p):'Get a quote');if(!CFG.showPrices)e.classList.add('rq-getq')});if(!CFG.showPrices)$$('*',pg).forEach(e=>{if(e.children.length===0&&/^(wholesale price|Have a discount code\?.*)$/i.test(e.textContent.trim()))e.hidden=true});
  $$('[data-f=p-desc]',pg).forEach(e=>{e.hidden=false;setText(e,prodDesc(p))});$$('[data-f=p-details]',pg).forEach(e=>setText(e,p.n));
  $$('*',pg).forEach(e=>{if(e.children.length===0&&/Shipping details and timelines go here/i.test(e.textContent))e.textContent='We ship with FedEx and UPS. Orders go to US addresses only.'});
  $$('[data-grid=p-flavors]',pg).forEach(c=>{if(!c._i){const t=c.firstElementChild;c._i={t:t.cloneNode(true)}}c.innerHTML='';const fl=p.f.slice(0,16);fl.forEach(f=>{const e=c._i.t.cloneNode(true);setText($('[data-f=chip]',e)||e,f);c.appendChild(e)});if(!fl.length)c.parentElement.hidden=false});
  $$('[data-f=qty]',pg).forEach(e=>setText(e,String(state.qty=state.qty||1)));
  const rel=P.filter(x=>x.c===p.c&&x.b!==p.b).sort((a,b)=>((a.id*7+p.id)%97)-((b.id*7+p.id)%97)).slice(0,4);$$('[data-grid=related]',pg).forEach(c=>fillGrid(c,rel,fillCard))}
 if(s.page==='brands'){const bs={};P.forEach(p=>(bs[p.b]=bs[p.b]||[]).push(p));const names=Object.keys(bs).filter(n=>n!==HB).sort((a,b)=>a.localeCompare(b));$$('[data-grid=brands]',pg).forEach(c=>fillGrid(c,names,(e,n)=>{setText($('[data-f=name]',e),n);setText($('[data-f=count]',e),bs[n].length+' products');const im=$('[data-f=img]',e);if(im){const pi=bs[n].find(x=>x.i);setImg(im,pi||{b:n,n})}cardLink(e,'/brand/'+encodeURIComponent(n),n)}))}
 if(s.page==='brand'&&s.brand===HB){go('/brands',true);return}
 if(s.page==='brand'){const l=P.filter(p=>p.b===s.brand);$$('[data-f=b-crumb]',pg).forEach(e=>setText(e,s.brand));$$('[data-f=b-title]',pg).forEach(e=>setText(e,s.brand));$$('[data-f=b-sub]',pg).forEach(e=>setText(e,brandDesc(s.brand,l)));$$('[data-grid=brand-products]',pg).forEach(c=>fillGrid(c,l,fillCard))}
 if(s.page==='quote')renderQuote(pg);
 if(s.page==='reviews')$$('[data-reviews=all]',pg).forEach(c=>fillReviews(c,REVS(),false));
 if(s.page==='review'||s.page==='quote'){const dn=s.page==='quote'?!!qdone:!!state.rdone;$$('[data-view=form]',pg).forEach(v=>v.hidden=dn);$$('[data-view=done]',pg).forEach(v=>v.hidden=!dn)}
 if(s.page==='home')$$('[data-reviews=home]',pg).forEach(c=>fillReviews(c,REVS().slice(0,2),true));
 refresh(true)}
function renderQuote(pg){const ids=Object.keys(cart).filter(i=>byId(i));const n=boxes();
 $$('[data-qlist]',pg).forEach(c=>{c.innerHTML=ids.length?ids.map(i=>{const p=byId(i);return '<div class="rq-item"><div class="rq-thumb">'+(p.i?'<img src="'+esc(p.i)+'" alt="'+esc(p.n)+'">':'<span>'+esc((bd(p)||p.n).slice(0,2).toUpperCase())+'</span>')+'</div><div class="rq-info"><b>'+esc(bd(p)||strip(p))+'</b><span>'+esc(strip(p))+'</span></div><div class="rq-qty"><button type="button" data-act="q-dec" data-id="'+i+'">-</button><em>'+cart[i]+'</em><button type="button" data-act="q-inc" data-id="'+i+'">+</button><button type="button" class="rq-x" data-act="q-rm" data-id="'+i+'">Remove</button></div></div>'}).join(''):'<p class="rq-empty">Your quote list is empty. Add products from the catalog, or just tell us what you need in the notes and we will take it from there.</p>'});
 $$('[data-f=q-count]',pg).forEach(e=>e.textContent=String(n));$$('[data-f=q-ref]',pg).forEach(e=>e.textContent=qdone)}
function stars(n){return '<span class="rv-stars">'+[1,2,3,4,5].map(i=>'<i class="'+(i<=n?'on':'')+'">&#9733;</i>').join('')+'</span>'}
function fillReviews(c,list,home){if(!c)return;if(!list.length){c.innerHTML=home?'<div class="rv-empty"></div>':'<div class="rv-empty" style="grid-column:1/-1"><a class="rq-btn" href="/shop/review">Be the first to write a review</a></div>';return}
 c.innerHTML=list.map(r=>'<div class="rv-card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><b>'+esc(r.name||'Verified shop owner')+'</b><br><small>'+esc(r.shop||'')+'</small></div>'+stars(+r.rating||5)+'</div><p>'+esc(r.text)+'</p></div>').join('')}
function banner(){const r=$('#float-root');if(r)r.hidden=true}
function refresh(){const n=boxes();$$('.nav-order-num').forEach(e=>e.textContent=String(n));$$('.nav-order-count').forEach(e=>{e.textContent=(e.closest('a')&&e.closest('a').classList.contains('size-[44px]'))?String(n):'Get a Quote ('+n+')'});
 banner()}
// ---- actions
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act,pg=a.closest('main');
 if(act==='faq-toggle'){const ans=(a.nextElementSibling&&a.nextElementSibling.hasAttribute('data-faq-answer')&&a.nextElementSibling)||$('[data-faq-answer]',a)||(a.parentElement&&$('[data-faq-answer]',a.parentElement));if(ans){ans.classList.toggle('hidden');const s=$('.faq-sign',a)||$('.faq-sign',a.parentElement);if(s)s.textContent=ans.classList.contains('hidden')?'+':'-'}}
 if(act==='load-more'){vis+=12;render()}
 if(act==='qty-inc'||act==='qty-dec'){state.qty=Math.max(1,(state.qty||1)+(act==='qty-inc'?1:-1));$$('[data-f=qty]',pg).forEach(x=>setText(x,String(state.qty)))}
 if(act==='add-to-order'&&state.page==='prod'){add(+state.id,state.qty||1);toast('Added to your quote list')}

 if(act==='q-inc')add(+a.dataset.id,1),render();
 if(act==='q-dec'){add(+a.dataset.id,-1);render()}
 if(act==='q-rm'){delete cart[a.dataset.id];sv('ra_cart',cart);render()}
 if(act==='quote-send')submitForm(a,'quote');
 if(act==='contact-send')submitForm(a,'contact');
 if(act==='review-send')submitForm(a,'review');
 if(act==='subscribe')subscribe(a);
 if(act==='age-yes'){sv('ra_age',true);try{localStorage.setItem('ra-age-ok','1')}catch(e){};$$('.agegate-wrap').forEach(x=>x.hidden=true)}
 if(act==='age-no')location.href='https://www.google.com';
});
document.addEventListener('keydown',e=>{if(e.target.classList&&e.target.classList.contains('nav-search')&&e.key==='Enter'){go('/c/all?q='+encodeURIComponent(e.target.value))}});
function confetti(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const c=$('#confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const cols=['#ff2b2b','#ff4a4a','#2f2f33'];const ps=Array.from({length:160},()=>({x:innerWidth*.75,y:innerHeight*.3,vx:(Math.random()-.5)*16,vy:Math.random()*-13-3,s:Math.random()*8+4,c:cols[Math.random()*3|0],r:Math.random()*6}));const t0=performance.now();(function f(t){x.clearRect(0,0,c.width,c.height);if(t-t0>1500)return;ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=.2;x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});requestAnimationFrame(f)})(t0)}

function formVals(f){const o={};$$('input,select,textarea',f).forEach(i=>{if(!i.name)return;o[i.name]=i.type==='checkbox'?i.checked:i.value.trim()});$$('[data-stars]',f).forEach(x=>o[x.dataset.stars]=+x.dataset.v||0);$$('[data-chips]',f).forEach(x=>{const on=$('.on',x);o[x.dataset.chips]=on?on.dataset.val:''});return o}
function bad(f,names,msg){const e=$('[data-err]',f);if(e)e.textContent=msg;$$('.rq-in,.rq-sel,.rq-ta',f).forEach(i=>i.classList.toggle('rq-bad',names.includes(i.name)));$$('[data-stars]',f).forEach(x=>x.style.outline=names.includes(x.dataset.stars)?'1px solid #ff2b2b':'');const first=$('.rq-bad',f);if(first)first.focus();return false}
async function submitForm(btn,kind){const f=btn.closest('[data-form]');if(!f)return;const v=formVals(f);if(v.website)return;
 const miss=[];const need=(k,lbl)=>{if(!v[k])miss.push(k)};
 if(kind==='quote'){['shop','contact','email','whatsapp','state'].forEach(k=>need(k));if(miss.length)return bad(f,miss,'Please fill in the highlighted fields.');
  if(!emailOK(v.email))return bad(f,['email'],'Please enter a valid email address.');if(!phoneOK(v.whatsapp))return bad(f,['whatsapp'],'Please enter a valid WhatsApp or mobile number.');
  if(!v.age)return bad(f,[],'Please confirm you are 21 or older and buying for a retail business.');
  const items=Object.keys(cart).filter(i=>byId(i)).map(i=>({brand:byId(i).b,product:byId(i).n,boxes:cart[i]}));if(!items.length&&!v.notes)return bad(f,['notes'],'Add products to your list, or tell us what you need in the notes.');
  const ref='RA-'+String(Math.floor(Math.random()*9000)+1000);btn.textContent='Sending...';const ok=await send('quote',{ref,business:v.shop,name:v.contact,email:v.email,whatsapp:v.whatsapp,state:v.state,preferred_contact:v.best,notes:v.notes,items,total_boxes:boxes()});btn.textContent='Request my quote';
  if(!ok)return bad(f,[],'Sorry, we could not send your request. Please try again or email sales@redappledistro.com.');
  qdone=ref;cart={};sv('ra_cart',cart);render();window.scrollTo(0,0);return}
 if(kind==='contact'){['contact','email','whatsapp','message'].forEach(k=>need(k));if(miss.length)return bad(f,miss,'Please fill in the highlighted fields.');
  if(!emailOK(v.email))return bad(f,['email'],'Please enter a valid email address.');if(!phoneOK(v.whatsapp))return bad(f,['whatsapp'],'Please enter a valid WhatsApp or mobile number.');
  const ok=await send('contact',{name:v.contact,business:v.shop,email:v.email,whatsapp:v.whatsapp,message:v.message});if(!ok)return bad(f,[],'Sorry, we could not send your message. Please try again.');
  bad(f,[],'');$$('input,textarea',f).forEach(i=>{if(i.type!=='checkbox')i.value=''});const o=$('[data-ok]',f);if(o)o.hidden=false;return}
 if(kind==='review'){['name','shop','remark'].forEach(k=>need(k));['overall','rep_rating','service','product'].forEach(k=>{if(!v[k])miss.push(k)});if(miss.length)return bad(f,miss,'Please fill in your name, shop, the star ratings marked with * and your remarks.');
  if(v.remark.length<15)return bad(f,['remark'],'Please write at least 15 characters in your remarks.');
  const ok=await send('review',{name:v.name,shop:v.shop,contact:v.contact,representative:v.rep,ratings:{overall:v.overall,representative:v.rep_rating,service:v.service,product:v.product,delivery:v.delivery},recommend:v.recommend,tenure:v.tenure,remark:v.remark,show_name:v.consent,status:'pending'});
  if(!ok)return bad(f,[],'Sorry, we could not send your review. Please try again.');state.rdone=true;render();window.scrollTo(0,0)}}
async function subscribe(a){const box=a.closest('[data-f=sub]')||a.parentElement,inp=$('input',box),val=(inp.value||'').trim();
 if(!(emailOK(val)||phoneOK(val))){toast('Enter a valid email or WhatsApp number');inp.focus();return}
 const ok=await send('subscribe',{contact:val,kind:emailOK(val)?'email':'whatsapp'});if(ok){inp.value='';toast('Thanks, you are on the list')}else toast('Something went wrong, please try again')}
document.addEventListener('click',e=>{const st=e.target.closest('[data-stars] i');if(st){const w=st.parentElement,v=+st.dataset.n;w.dataset.v=v;w.style.outline='';$$('i',w).forEach(i=>i.classList.toggle('on',+i.dataset.n<=v));return}
 const ch=e.target.closest('.rv-chip');if(ch){const w=ch.parentElement;$$('.rv-chip',w).forEach(i=>i.classList.toggle('on',i===ch&&!ch.classList.contains('on')))}});
// footer: add a Reviews link next to About
$$('a[href="/shop/about"]').forEach(a=>{const p=a.parentElement,isP=p.tagName==='P';const t=isP?p:a;if(t.dataset.rv)return;const c=t.cloneNode(true);c.dataset.rv=1;const l=c.tagName==='A'?c:c.querySelector('a');l.setAttribute('href','/shop/reviews');l.textContent='Reviews';t.after(c)});

// ---- clean-path router helpers
const BASE='/shop/',SITE='https://redappledistribution.com',FIXED=['brands','about','contact','faq','policy','quote','review','reviews'];
function curPath(){let p=location.pathname;if(p.indexOf(BASE)===0)p=p.slice(BASE.length);else p='';return p.replace(/index\.html$/,'').replace(/\/+$/,'')}
// spa fallback (404.html -> /shop/?/rest), legacy #/ links and trailing slashes -> clean path, via replaceState
function fixUrl(){const l=location;let path=l.pathname,search=l.search,hash=l.hash,ch=false;
 if(search.charAt(1)==='/'){const r=search.slice(1).split('&').map(x=>x.replace(/~and~/g,'&')).join('?');const i=r.indexOf('?');path=BASE.slice(0,-1)+(i<0?r:r.slice(0,i));search=i<0?'':r.slice(i);ch=true}
 if(hash){const m=/^#\/?([^]*)$/.exec(hash);if(m&&(m[1]===''||/^(c|p|brands?|about|contact|faq|policy|quote|review|reviews|order)([\/?]|$)/.test(m[1]))){const h=m[1],i=h.indexOf('?');path=BASE+(i<0?h:h.slice(0,i));search=i<0?'':h.slice(i);}ch=true;hash=''}
 let q=path.replace(/index\.html$/,'');if(q==='/shop')q=BASE;else if(q!==BASE&&q.length>1)q=q.replace(/\/+$/,'');if(q!==path){path=q;ch=true}
 if(ch)history.replaceState(null,'',path+search+hash);
}
function go(p,rep){const u=BASE.slice(0,-1)+(p.charAt(0)==='/'?p:'/'+p),f=u==='/shop'?BASE:u;if(f===location.pathname+location.search){window.scrollTo(0,0);return}history[rep?'replaceState':'pushState'](null,'',f);route()}
function cardLink(e,path,label){e.style.cursor='pointer';$$('.ra-cardlink',e).forEach(x=>x.remove());const a=document.createElement('a');a.className='ra-cardlink';a.href=BASE.slice(0,-1)+path;a.setAttribute('aria-label',label||'Open');e.appendChild(a)}
function seoTags(page,path){const fixed=page==='home'?BASE:(page==='cat'||page==='prod'||page==='brand')?BASE+path:FIXED.includes(page)?BASE+page+'/':BASE;
 const cp=page==='cat'?BASE+'c/'+path.split('/')[1]+'/':fixed,u=SITE+(page==='prod'||page==='brand'?BASE+path:cp);
 let c=$('link[rel=canonical]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href=u;
 const og=$('meta[property="og:url"]');if(og)og.content=u;const rb=$('meta[name=robots]');if(rb)rb.content=page==='nf'?'noindex,follow':'index,follow'}
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a[href]');if(!a||a.target&&a.target!=='_self'||a.hasAttribute('download'))return;
 if(a.hasAttribute('data-noop')){e.preventDefault();return}
 const raw=a.getAttribute('href');let u;try{u=new URL(a.href,location.href)}catch(x){return}if(u.origin!==location.origin)return;
 if(raw.charAt(0)==='#'){e.preventDefault();const id=raw.slice(1),t=$$('[id="'+id+'"]').find(x=>x.getClientRects().length)||document.getElementById(id);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(u.pathname!==BASE.slice(0,-1)&&u.pathname.indexOf(BASE)!==0)return;
 e.preventDefault();let p=u.pathname.slice(BASE.length-1).replace(/index\.html$/,'');p=p.replace(/\/+$/,'')||'/';go(p+u.search)});
// init
$$('[data-faq-answer]').forEach(a=>a.classList.add('hidden'));
$$('a[href^="#"]').forEach(a=>{});
addEventListener('popstate',route);addEventListener('hashchange',route);addEventListener('resize',scale);try{history.scrollRestoration='manual'}catch(e){}
if(!ld('ra_age',false))setTimeout(()=>{const i=innerWidth<900?1:0;const w=$$('.agegate-wrap')[i];if(w){w.hidden=false}},1500);else $$('.agegate-wrap').forEach(x=>x.hidden=true);
$$('.agegate-wrap').forEach(x=>x.hidden=true);if(!ld('ra_age',false))setTimeout(()=>{const w=$$('.agegate-wrap')[innerWidth<900?1:0];if(w)w.hidden=false},1500);
fixUrl();route();
})();
