(function(){
const P=window.PRODUCTS,PICKS=window.PICKS||{},AL=window.ALIASES||{},byId=id=>P.find(p=>p.id==id)||P.find(p=>p.id==AL[id]);
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
const boxes=()=>Object.keys(cart).reduce((a,k)=>{const q=ck(k),p=byId(q.id);return p?a+cart[k]*factor(p,q.un):a},0);
const ck=k=>{k=String(k);let un='box';const m=/\|(piece|box|case)$/.exec(k);if(m){un=m[1];k=k.slice(0,m.index)}const i=k.indexOf('~');return {id:+(i<0?k:k.slice(0,i)),fl:i<0?'':k.slice(i+1),un}};const unit=p=>p.p;const HB='Check brand',bd=p=>p.b===HB?'':p.b;
const m2=n=>'$'+(Math.round(n*100)/100).toFixed(2),m0=n=>'$'+(Number.isInteger(n)?n:n.toFixed(2));
const dk=n=>{const m=/(\d+(?:\.\d+)?)\s*k\s*puffs?/i.exec(n)||/\b(\d+(?:\.\d+)?)\s*k\b/i.exec(n);return m?+m[1]:0};
const dSize=n=>{const m=/(\d+(?:\.\d+)?)\s*(ml|gm|g|mg)\b/i.exec(n);return m?m[1]+(m[2].toLowerCase()==='gm'?'g':m[2].toLowerCase()):''};
const dPack=n=>{const m=/(\d+)\s*(?:pc|pcs|ct)\s*\/?\s*box/i.exec(n);return m?m[1]+' per box':''};
const dList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const prodDesc=p=>{const sp=[];const k=dk(p.n);if(k)sp.push(k+'K puffs');const z=dSize(p.n);if(z)sp.push(z+' size');const pk=dPack(p.n);if(pk)sp.push(pk);if(p.f&&p.f.length)sp.push(p.f.length+(p.f.length===1?' flavor':' flavors')+' listed');return (bd(p)||'Wholesale')+' product in our '+p.c+' category'+(sp.length?', '+dList(sp):'')+'; wholesale for US retailers, 21+ only, get a quote for bulk terms.'};
const brandDesc=(b,l)=>{const cs=[...new Set(l.map(x=>x.c))];const mk=Math.max(0,...l.map(x=>dk(x.n)));const fl=new Set(l.flatMap(x=>(x.f||[]).map(y=>y.toLowerCase()))).size;const bits=[];if(mk)bits.push('puff counts up to '+mk+'K');if(fl)bits.push(fl+(fl===1?' flavor':' flavors')+' listed');return b+': '+l.length+(l.length===1?' product':' products')+' in '+dList(cs)+(bits.length?', with '+dList(bits):'')+'. Wholesale for US retailers, 21+ only; get a quote for bulk terms.'};
const strip=(p)=>p.dn||p.n.replace(/[\u2013\u2014]/g,'-').replace(new RegExp('^'+p.b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s-]*','i'),'')||p.n;
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}
function setText(el,t){if(!el)return;const tn=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());if(el.children.length===0||!tn.length){if(el.children.length===0)el.textContent=t;else{const d=el.querySelector('p,span');if(d&&d.children.length===0)d.textContent=t;else el.textContent=t}}else tn[0].textContent=t}
function setImg(frame,p){if(!frame)return;let im=$('img',frame);
 if(p&&p.i){frame.querySelectorAll(':scope>p,:scope>span').forEach(x=>x.remove());if(!im){im=document.createElement('img');im.className='absolute inset-0 size-full object-contain';frame.appendChild(im)}im.src=p.i;im.alt=altOf(p);frame.style.background=''}
 else{if(im)im.remove();frame.style.background='#1a1a1c';frame.style.display='flex';frame.style.alignItems='center';frame.style.justifyContent='center';frame.innerHTML='<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:800;font-size:38px;color:#e01515">'+(p?(bd(p)||p.n).slice(0,2).toUpperCase():'')+'</span>'}}
function fillGrid(c,items,fill){if(!c)return;if(!c._i){const links=$$(':scope [data-f=link]',c);if(!links.length)return;const first=links[0],row=first.parentElement;c._i={card:first.cloneNode(true),row:row===c?null:row.cloneNode(false),box:row===c?c:row.parentElement,per:row===c?0:$$(':scope>[data-f=link]',row).length||links.length}}
 const {card,row,box,per}=c._i;box.innerHTML='';let r=null;items.forEach((it,i)=>{const e=card.cloneNode(true);fill(e,it);if(!row){box.appendChild(e)}else{if(i%per===0){r=row.cloneNode(false);box.appendChild(r)}r.appendChild(e)}});}
function fillCard(e,p){setImg($('[data-f=img]',e),p);setText($('[data-f=brand]',e),bd(p).toUpperCase());setText($('[data-f=name]',e),strip(p));setText($('[data-f=price]',e),priceTxt(p));$$('[data-f=price]',e).forEach(x=>{if(!CFG.showPrices)x.classList.add('rq-getq')});cardLink(e,'/p/'+p.id,altOf(p));const b=$('[data-act=add-to-order]',e);if(b)b.onclick=ev=>{ev.stopPropagation();if(flList(p).length){go('/p/'+p.id);toast('Choose a flavor to add this product');return}const u0=defUnit(p);add(mk(p.id,'',u0),minQty(p,u0));const t=b.querySelector('p')||b,o=t.textContent;t.textContent='Added';setTimeout(()=>t.textContent=o,900)}}
function add(id,n){cart[id]=(cart[id]||0)+n;if(cart[id]<1)delete cart[id];sv('ra_cart',cart);refresh()}
function slugOf(p){return Object.keys(CATS).find(k=>CATS[k]===p.c)}
function list(slug,q){let l;if(slug==='all')l=P;else if(slug==='new'||slug==='trending')l=(PICKS[slug]||[]).map(byId).filter(Boolean);else l=P.filter(p=>slugOf(p)===slug);if(q){q=q.toLowerCase();l=P.filter(p=>(p.n+' | '+p.b+' | '+(p.dn||'')+' | '+p.b+' '+(p.dn||'')).replace(/[\u2013\u2014]/g,'-').toLowerCase().includes(q))}return l}
// ---- layout scale
function scale(){const w=innerWidth;$$('.dsk').forEach(e=>{e.style.zoom=w<1440&&(w>=900||e.classList.contains('all'))?w/1440:1});$$('.mob').forEach(e=>{e.style.zoom=Math.min(w,520)/390});$$('.agegate-wrap').forEach((x,i)=>{x.dataset.mode=i?'m':'d'})}
// ---- routes
function route(){fixUrl();let pathq=curPath();const qs=new URLSearchParams(location.search);let seg=pathq.split('/');if(seg[0]==='p'&&AL[seg[1]]){seg[1]=String(AL[seg[1]]);pathq=seg.join('/');history.replaceState(null,'',BASE+pathq+location.search)}let page='home';
 if(seg[0]==='c')page='cat';else if(seg[0]==='p')page='prod';else if(seg[0]==='brands')page='brands';else if(seg[0]==='brand')page='brand';else if(seg[0]==='order'){history.replaceState(null,'',BASE+'quote');return route()}else if(['about','contact','faq','policy','terms','privacy','returns','quote','review','reviews'].includes(seg[0]))page=seg[0];else if(seg[0]!==''&&seg[0]!==undefined)page='nf';
 if(page==='cat'&&!TITLES[seg[1]])page='nf';if(page==='prod'&&!byId(seg[1]))page='nf';
 $$('#app>main').forEach(m=>m.hidden=m.dataset.page!==page);
 state={page,slug:seg[1],id:seg[1],brand:decodeURIComponent(seg[1]||''),q:qs.get('q')||''};vis=12;
 render();window.scrollTo(0,0);scale();document.title=({home:'Red Apple Distribution | Wholesale for US Smoke Shops',quote:'Get a Quote | Red Apple Distribution',review:'Write a Review | Red Apple Distribution',reviews:'Customer Reviews | Red Apple Distribution',about:'About Red Apple Distribution | US Wholesale Supplier',policy:'Shipping and Delivery | Red Apple Distribution',terms:'Terms of Sale | Red Apple Distribution',privacy:'Privacy Policy | Red Apple Distribution',returns:'Returns and Credits | Red Apple Distribution',contact:'Contact Red Apple Distribution'})[page]||('Red Apple Distribution | '+(page==='cat'?TITLES[seg[1]]:page==='prod'?((bd(byId(seg[1]))?bd(byId(seg[1]))+' ':'')+strip(byId(seg[1]))):page[0].toUpperCase()+page.slice(1)));seoTags(page,pathq);seoProd()}
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
 if(s.page==='prod'){const p=byId(s.id),sl=slugOf(p);$$('[data-f=p-crumb-cat]',pg).forEach(e=>{setText(e,TITLES[sl]||CATS[sl]||p.c);e.setAttribute('href',BASE+'c/'+sl)});$$('[data-f=p-crumb-name]',pg).forEach(e=>setText(e,strip(p)));
  $$('[data-f=p-img]',pg).forEach(e=>setImg(e,p));$$('[data-f=p-brand]',pg).forEach(e=>setText(e,bd(p).toUpperCase()));$$('[data-f=p-name]',pg).forEach(e=>setText(e,strip(p)));$$('[data-f=p-price]',pg).forEach(e=>{setText(e,CFG.showPrices?m2(p.p):'Get a quote');if(!CFG.showPrices)e.classList.add('rq-getq')});if(!CFG.showPrices)$$('*',pg).forEach(e=>{if(e.children.length===0&&/^(wholesale price|Have a discount code\?.*)$/i.test(e.textContent.trim()))e.hidden=true});
  $$('[data-f=p-desc]',pg).forEach(e=>{e.hidden=false;setText(e,prodDesc2(p))});$$('[data-f=p-details]',pg).forEach(e=>setText(e,'Full product name: '+safeN(p)));
  $$('*',pg).forEach(e=>{if(e.children.length===0&&/Shipping details and timelines go here/i.test(e.textContent))e.textContent='We ship with FedEx and UPS. Orders go to US addresses only.'});
  flavorInit(pg,p);
  state.qty=state.qty||minQty(p,curUnit(p));$$('[data-f=qty]',pg).forEach(e=>setText(e,String(state.qty)));updateOb(pg);
  const rel=P.filter(x=>x.c===p.c&&x.b!==p.b).sort((a,b)=>((a.id*7+p.id)%97)-((b.id*7+p.id)%97)).slice(0,4);$$('[data-grid=related]',pg).forEach(c=>fillGrid(c,rel,fillCard))}
 if(s.page==='brands'){const bs={};P.forEach(p=>(bs[p.b]=bs[p.b]||[]).push(p));const names=Object.keys(bs).filter(n=>n!==HB).sort((a,b)=>a.localeCompare(b));$$('[data-grid=brands]',pg).forEach(c=>fillGrid(c,names,(e,n)=>{setText($('[data-f=name]',e),n);setText($('[data-f=count]',e),bs[n].length+' products');const im=$('[data-f=img]',e);if(im){const pi=bs[n].find(x=>x.i);setImg(im,pi||{b:n,n})}cardLink(e,'/brand/'+encodeURIComponent(n),n)}))}
 if(s.page==='brand'&&s.brand===HB){go('/brands',true);return}
 if(s.page==='brand'){const l=P.filter(p=>p.b===s.brand);$$('[data-f=b-crumb]',pg).forEach(e=>setText(e,s.brand));$$('[data-f=b-title]',pg).forEach(e=>setText(e,s.brand));$$('[data-f=b-sub]',pg).forEach(e=>setText(e,brandDesc(s.brand,l)));$$('[data-grid=brand-products]',pg).forEach(c=>fillGrid(c,l,fillCard))}
 if(s.page==='quote')renderQuote(pg);
 if(s.page==='reviews')$$('[data-reviews=all]',pg).forEach(c=>fillReviews(c,REVS(),false));
 if(s.page==='review'||s.page==='quote'){const dn=s.page==='quote'?!!qdone:!!state.rdone;$$('[data-view=form]',pg).forEach(v=>v.hidden=dn);$$('[data-view=done]',pg).forEach(v=>v.hidden=!dn)}
 if(s.page==='home')$$('[data-reviews=home]',pg).forEach(c=>fillReviews(c,REVS().slice(0,2),true));
 refresh(true)}
function renderQuote(pg){const ids=Object.keys(cart).filter(i=>byId(ck(i).id));const n=boxes();
 $$('[data-qlist]',pg).forEach(c=>{c.innerHTML=ids.length?ids.map(i=>{const q=ck(i),p=byId(q.id),fl=q.fl,un=q.un;return '<div class="rq-item"><div class="rq-thumb">'+(p.i?'<img src="'+esc(p.i)+'" alt="'+esc(altOf(p))+'">':'<span>'+esc((bd(p)||p.n).slice(0,2).toUpperCase())+'</span>')+'</div><div class="rq-info">'+(bd(p)?'<b>'+esc(bd(p))+'</b>':'')+'<span>'+esc(strip(p))+'</span>'+(fl?'<em class="rq-flv">Flavor: '+esc(fl)+'</em>':'')+'<em class="rq-un">'+esc(unitLine(p,un,cart[i]))+'</em>'+(p.mq>0?'<em class="rq-un rq-min1">'+esc(minText(p,un))+'</em>':'')+'</div><div class="rq-qty"><button type="button" data-act="q-dec" data-id="'+esc(i)+'">-</button><em>'+cart[i]+'</em><button type="button" data-act="q-inc" data-id="'+esc(i)+'">+</button><button type="button" class="rq-x" data-act="q-rm" data-id="'+esc(i)+'">Remove</button></div></div>'}).join(''):'<p class="rq-empty">Your quote list is empty. Add products from the catalog, or just tell us what you need in the notes and we will take it from there.</p>'});
 $$('[data-f=q-count]',pg).forEach(e=>e.textContent=fb(n));qMin(pg,n);$$('[data-f=q-ref]',pg).forEach(e=>e.textContent=qdone)}
function stars(n){return '<span class="rv-stars">'+[1,2,3,4,5].map(i=>'<i class="'+(i<=n?'on':'')+'">&#9733;</i>').join('')+'</span>'}
function fillReviews(c,list,home){if(!c)return;if(!list.length){c.innerHTML=home?'<div class="rv-empty"></div>':'<div class="rv-empty" style="grid-column:1/-1"><a class="rq-btn" href="/shop/review">Be the first to write a review</a></div>';return}
 c.innerHTML=list.map(r=>'<div class="rv-card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><b>'+esc(r.name||'Verified shop owner')+'</b><br><small>'+esc(r.shop||'')+'</small></div>'+stars(+r.rating||5)+'</div><p>'+esc(r.text)+'</p></div>').join('')}
function banner(){const r=$('#float-root');if(r)r.hidden=true}
function refresh(){const n=fb(boxes());$$('.nav-order-num').forEach(e=>e.textContent=String(n));$$('.nav-order-count').forEach(e=>{e.textContent=(e.closest('a')&&e.closest('a').classList.contains('size-[44px]'))?String(n):'Get a Quote ('+n+')'});
 banner()}
// ---- actions
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act,pg=a.closest('main');
 if(act==='faq-toggle'){const ans=(a.nextElementSibling&&a.nextElementSibling.hasAttribute('data-faq-answer')&&a.nextElementSibling)||$('[data-faq-answer]',a)||(a.parentElement&&$('[data-faq-answer]',a.parentElement));if(ans){ans.classList.toggle('hidden');const s=$('.faq-sign',a)||$('.faq-sign',a.parentElement);if(s)s.textContent=ans.classList.contains('hidden')?'+':'-'}}
 if(act==='load-more'){vis+=12;render()}
 if(act==='qty-inc'||act==='qty-dec'){state.qty=Math.min(9999,Math.max(_mq(),(state.qty||1)+(act==='qty-inc'?1:-1)));$$('[data-f=qty]',pg).forEach(x=>setText(x,String(state.qty)));updateOb(pg)}
 if(act==='add-to-order'&&state.page==='prod'){const p=byId(state.id);if(p&&flList(p).length&&!state.fl)flavorNeed(pg);else{const un=curUnit(p),qn=Math.max(state.qty||1,minQty(p,un));add(mk(p.id,state.fl,un),qn);toast('Added '+qn+' '+wd(un,qn)+' to your quote list'+(state.fl?' - '+state.fl:''))}}

 if(act==='q-inc')add(a.dataset.id,1),render();
 if(act==='q-dec'){const k_=ck(a.dataset.id),p_=byId(k_.id);if(!p_||cart[a.dataset.id]-1>=minQty(p_,k_.un))add(a.dataset.id,-1);render()}
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
  const items=Object.keys(cart).filter(i=>byId(ck(i).id)).map(i=>{const q=ck(i),p=byId(q.id);const fx=factor(p,q.un),bx=fx>0?Math.round(cart[i]*fx*100)/100:null;return {id:q.id,brand:p.b,product:p.n,original_name:p.n,display_name:strip(p),flavor:q.fl,unit:UN[q.un],quantity:cart[i],box_equivalent:bx,boxes:bx}});if(!items.length&&!v.notes)return bad(f,['notes'],'Add products to your list, or tell us what you need in the notes.');
  const ref='RA-'+String(Math.floor(Math.random()*9000)+1000);btn.textContent='Sending...';const ok=await send('quote',{ref,business:v.shop,name:v.contact,email:v.email,whatsapp:v.whatsapp,state:v.state,preferred_contact:v.best,notes:v.notes,items,items_summary:items.map((x,k)=>(k+1)+'. '+(x.brand&&x.brand!==HB?x.brand+' - ':'')+x.display_name+(x.flavor?' | Flavor: '+x.flavor:'')+' | '+x.quantity+' x '+x.unit+(x.box_equivalent==null?'':' = '+x.box_equivalent+' box')+' | SKU name: '+x.original_name).join('\n'),total_boxes:Math.round(boxes()*10)/10,minimum_boxes:MINB,meets_minimum:Math.round(boxes()*10)/10>=MINB?'yes':'no'});btn.textContent='Request my quote';
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
const BASE='/shop/',SITE='https://redappledistribution.com',FIXED=['brands','about','contact','faq','policy','terms','privacy','returns','quote','review','reviews'];
function curPath(){let p=location.pathname;if(p.indexOf(BASE)===0)p=p.slice(BASE.length);else p='';return p.replace(/index\.html$/,'').replace(/\/+$/,'')}
// spa fallback (404.html -> /shop/?/rest), legacy #/ links and trailing slashes -> clean path, via replaceState
function fixUrl(){const l=location;let path=l.pathname,search=l.search,hash=l.hash,ch=false;
 if(search.charAt(1)==='/'){const r=search.slice(1).split('&').map(x=>x.replace(/~and~/g,'&')).join('?');const i=r.indexOf('?');path=BASE.slice(0,-1)+(i<0?r:r.slice(0,i));search=i<0?'':r.slice(i);ch=true}
 if(hash){const m=/^#\/?([^]*)$/.exec(hash);if(m&&(m[1]===''||/^(c|p|brands?|about|contact|faq|policy|terms|privacy|returns|quote|review|reviews|order)([\/?]|$)/.test(m[1]))){const h=m[1],i=h.indexOf('?');path=BASE+(i<0?h:h.slice(0,i));search=i<0?'':h.slice(i);}ch=true;hash=''}
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

// ---- flavor dropdown, image stage, thumbnails
const flList=p=>{const seen={},o=[];((p&&p.f)||[]).forEach(f=>{const n=String(f).trim(),k=n.toLowerCase();if(n&&!seen[k]){seen[k]=1;o.push(n)}});return o};
const flImg=(p,n)=>{const m=(window.FLAVOR_IMAGES||{})[p.id];return(m&&m[n])||''};
const reduceMo=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const ctrls=[];let ddN=0;
function mkSlide(p,src){const d=document.createElement('div');d.className='ra-slide';d.innerHTML=src?'<img alt="'+esc(altOf(p))+'" src="'+esc(src)+'" draggable="false">':'<span>'+esc((bd(p)||p.n).slice(0,2).toUpperCase())+'</span>';return d}
function slideTo(c,p,src,dir){const st=c.stage;[...st.children].forEach(x=>{if(x!==c.cur)x.remove()});const old=c.cur,nu=mkSlide(p,src);st.appendChild(nu);c.cur=nu;if(!old)return;
 const rm=reduceMo(),D=rm?280:680,E='cubic-bezier(.22,1,.36,1)';
 if(rm){const a=nu.animate([{opacity:0},{opacity:1}],{duration:D,easing:'ease-out'});a.onfinish=()=>a.cancel();const o=old.animate([{opacity:1},{opacity:0}],{duration:D,easing:'ease-in',fill:'forwards'});o.onfinish=()=>old.remove();return}
 const a=nu.animate([{transform:'translateX('+(dir*100)+'%) scale(1.1)',opacity:0,filter:'blur(10px)'},{transform:'translateX(0) scale(1)',opacity:1,filter:'blur(0px)'}],{duration:D,easing:E});a.onfinish=()=>a.cancel();
 const o=old.animate([{transform:'translateX(0) scale(1)',opacity:1,filter:'blur(0px)'},{transform:'translateX('+(-dir*100)+'%) scale(.9)',opacity:0,filter:'blur(10px)'}],{duration:D,easing:E,fill:'forwards'});o.onfinish=()=>old.remove();
 c.glow.animate([{opacity:0},{opacity:1,offset:.35},{opacity:0}],{duration:900,easing:'ease-out'})}
function setChip(c,fl){const ch=c.chip;if(!fl){ch.hidden=true;ch.innerHTML='';return}
 const was=!ch.hidden&&ch.firstElementChild,n=document.createElement('span');n.className='ra-chip-t';n.innerHTML='<i>Flavor:</i><b>'+esc(fl)+'</b>';ch.hidden=false;ch.setAttribute('aria-label','Selected flavor: '+fl);
 if(was){const o=ch.firstElementChild;ch.appendChild(n);if(reduceMo()){o.remove();n.animate([{opacity:0},{opacity:1}],{duration:240});return}
  const x=o.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-120%)',opacity:0}],{duration:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});x.onfinish=()=>o.remove();
  n.animate([{transform:'translateY(120%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'});
  ch.animate([{transform:'scale(.94)'},{transform:'scale(1.04)',offset:.5},{transform:'scale(1)'}],{duration:380,easing:'ease-out'})}
 else{ch.innerHTML='';ch.appendChild(n);if(!reduceMo())ch.animate([{transform:'translateY(10px) scale(.9)',opacity:0},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'})}}
function markThumbs(c,pulse){if(!c.thumbs)return;$$('.ra-th',c.thumbs).forEach(b=>{const on=b.dataset.k===c.shown;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on?'true':'false');if(on&&pulse&&!reduceMo())b.animate([{transform:'scale(.9)'},{transform:'scale(1.07)',offset:.55},{transform:'scale(1)'}],{duration:460,easing:'ease-out'})})}
function mkThumbs(c,p){const row=c.thumbs;if(!row)return;const its=[{k:'',src:p.i}];const m=(window.FLAVOR_IMAGES||{})[p.id]||{};flList(p).forEach(n=>{if(m[n])its.push({k:n,src:m[n]})});
 row.className='ra-thumbs';row.hidden=!p.i&&its.length===1;
 row.innerHTML=its.map(t=>'<button type="button" class="ra-th" data-k="'+esc(t.k)+'" aria-label="'+esc(t.k?'Show '+t.k+' image':'Show product image')+'" title="'+esc(t.k||'Product image')+'">'+(t.src?'<img alt="" src="'+esc(t.src)+'" draggable="false">':'<span>'+esc((bd(p)||p.n).slice(0,2).toUpperCase())+'</span>')+'</button>').join('');
 row.onclick=e=>{const b=e.target.closest('.ra-th');if(!b)return;const k=b.dataset.k;if(k)setFlavor(p,k,true);else{slideTo(c,p,p.i,-1);c.shown='';markThumbs(c,true)}}}
function mkDD(wrap,label,list,onPick,o){o=Object.assign({ph:'Select a flavor',msg:'Please choose a flavor',aria:'Flavor'},o||{});const u='ra-dd'+(++ddN);wrap.innerHTML='<div class="ra-dd"><button type="button" class="ra-dd-btn" id="'+u+'-b" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="'+u+'-l" aria-labelledby="'+u+'-lb '+u+'-v"><span class="ra-dd-v is-ph" id="'+u+'-v">'+esc(o.ph)+'</span><svg class="ra-dd-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><ul class="ra-dd-l" id="'+u+'-l" role="listbox" aria-labelledby="'+u+'-lb" tabindex="-1">'+list.map((n,i)=>'<li role="option" id="'+u+'-o'+i+'" data-i="'+i+'" aria-selected="false" style="--i:'+i+'"><span>'+esc(n)+'</span><svg class="ra-dd-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg></li>').join('')+'</ul></div><p class="ra-fl-msg" role="alert" aria-live="assertive"></p>';
 if(label)label.id=u+'-lb';else wrap.querySelector('.ra-dd-btn').setAttribute('aria-label',o.aria);
 const dd=wrap.firstElementChild,btn=$('.ra-dd-btn',wrap),ul=$('.ra-dd-l',wrap),val=$('.ra-dd-v',wrap),lis=$$('li',ul),msg=$('.ra-fl-msg',wrap);let open=false,act=-1,sel=-1,buf='',bt=0;
 const hl=i=>{if(i<0||i>=lis.length)return;act=i;lis.forEach((l,j)=>l.classList.toggle('is-act',j===i));btn.setAttribute('aria-activedescendant',lis[i].id);const l=lis[i],t=l.offsetTop,b=t+l.offsetHeight;if(t<ul.scrollTop)ul.scrollTop=t-6;else if(b>ul.scrollTop+ul.clientHeight)ul.scrollTop=b-ul.clientHeight+6};
 const openP=i=>{if(open)return;open=true;const r=btn.getBoundingClientRect(),z=r.height/(btn.offsetHeight||1)||1,full=Math.min(lis.length*44+14,272),below=(innerHeight-r.bottom-16)/z,above=(r.top-16)/z,up=below<Math.min(full,170)&&above>below;dd.classList.toggle('up',up);ul.style.maxHeight=Math.max(120,Math.min(full,up?above:below))+'px';wrap.classList.add('is-open');btn.setAttribute('aria-expanded','true');hl(i);setTimeout(()=>hl(act),0)};
 const closeP=()=>{if(!open)return;open=false;wrap.classList.remove('is-open');btn.setAttribute('aria-expanded','false');btn.removeAttribute('aria-activedescendant');buf=''};
 const pick=i=>{if(i<0||i>=list.length)return;onPick(list[i])};
 const type=ch=>{buf+=ch.toLowerCase();clearTimeout(bt);bt=setTimeout(()=>{buf=''},700);const st=buf.length===1?act+1:Math.max(act,0);for(let k=0;k<list.length;k++){const j=(st+k)%list.length;if(list[j].toLowerCase().indexOf(buf)===0){hl(j);return}}};
 btn.onclick=()=>open?closeP():openP(sel>=0?sel:0);
 btn.onkeydown=e=>{const k=e.key;if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(!open){if(k==='ArrowDown'||k==='ArrowUp'||k==='Enter'||k===' '){e.preventDefault();openP(sel>=0?sel:0)}else if(k.length===1){e.preventDefault();openP(sel>=0?sel:0);type(k)}return}
  if(k==='ArrowDown'){e.preventDefault();hl(Math.min(lis.length-1,act+1))}else if(k==='ArrowUp'){e.preventDefault();hl(Math.max(0,act-1))}
  else if(k==='Home'){e.preventDefault();hl(0)}else if(k==='End'){e.preventDefault();hl(lis.length-1)}
  else if(k==='PageDown'){e.preventDefault();hl(Math.min(lis.length-1,act+6))}else if(k==='PageUp'){e.preventDefault();hl(Math.max(0,act-6))}
  else if(k==='Enter'||(k===' '&&!buf)){e.preventDefault();pick(act);closeP()}
  else if(k==='Escape'){e.preventDefault();closeP()}else if(k==='Tab')closeP();
  else if(k.length===1){e.preventDefault();type(k)}};
 ul.addEventListener('mousedown',e=>e.preventDefault());
 ul.addEventListener('click',e=>{const l=e.target.closest('li');if(!l)return;pick(+l.dataset.i);closeP();btn.focus()});
 ul.addEventListener('pointermove',e=>{const l=e.target.closest('li');if(l&&+l.dataset.i!==act)hl(+l.dataset.i)});
 return{isOpen:()=>open,close:closeP,btn,
  set(n,quiet){sel=list.indexOf(n);lis.forEach((l,j)=>l.setAttribute('aria-selected',j===sel?'true':'false'));val.classList.toggle('is-ph',sel<0);val.textContent=sel<0?o.ph:n;wrap.classList.remove('is-bad');msg.textContent='';if(!quiet&&sel>=0&&!reduceMo())val.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'})},
  need(){wrap.classList.add('is-bad');msg.textContent=o.msg;if(btn.getClientRects().length){const r=btn.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight-20)btn.scrollIntoView({block:'center',behavior:reduceMo()?'auto':'smooth'});btn.focus({preventScroll:true});if(!reduceMo())btn.animate([{transform:'translateX(0)'},{transform:'translateX(-9px)'},{transform:'translateX(8px)'},{transform:'translateX(-6px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:480,easing:'ease-out'})}}}}
function setFlavor(p,name,fromThumb){const list=flList(p),ni=list.indexOf(name);if(ni<0)return;const oi=state.fl?list.indexOf(state.fl):-1;if(name===state.fl&&!fromThumb)return;const dir=ni>=oi?1:-1;state.fl=name;const own=flImg(p,name),src=own||p.i||'';
 ctrls.forEach(c=>{if(c.p!==p||!document.contains(c.root))return;c.dd.set(name);slideTo(c,p,src,dir);c.shown=own?name:'';setChip(c,name);markThumbs(c,true)})}
function flavorNeed(pg){ctrls.forEach(c=>{if(document.contains(c.root)&&pg.contains(c.root))c.dd.need()})}
function flavorInit(pg,p){const list=flList(p);if(state.flId!==p.id){state.flId=p.id;state.fl=''}
 for(let i=ctrls.length-1;i>=0;i--)if(!document.contains(ctrls[i].root))ctrls.splice(i,1);
 $$('.dsk,.mob',pg).forEach(ctx=>{const frame=$('[data-f=p-img]',ctx),wrap=$('[data-flavor]',ctx),label=$('[data-f=fl-label]',ctx);if(!frame)return;
  frame.style.cssText='';frame.innerHTML='<div class="ra-stage"></div><div class="ra-glow"></div><div class="ra-chip" hidden></div>';frame.classList.add('ra-frame');if(!p.i)frame.style.background='#1a1a1c';
  const c={root:frame,p,stage:$('.ra-stage',frame),glow:$('.ra-glow',frame),chip:$('.ra-chip',frame),thumbs:frame.nextElementSibling,shown:'',lastFl:'',lastOwn:'',cur:null,dd:null,od:null};const ow=$('[data-orderby]',ctx),olab=$('[data-f=ob-label]',ctx);
  const own0=state.fl?flImg(p,state.fl):'';c.cur=mkSlide(p,own0||p.i||'');c.stage.appendChild(c.cur);c.shown=own0?state.fl:'';mkThumbs(c,p);markThumbs(c,false);
  if(wrap){if(!list.length){wrap.hidden=true;wrap.innerHTML='';if(label)label.hidden=true}
   else{wrap.hidden=false;if(label)label.hidden=false;let a=wrap.parentElement;while(a&&a!==pg){if(getComputedStyle(a).overflow!=='visible')a.style.overflow='visible';a=a.parentElement}
    c.dd=mkDD(wrap,label,list,n=>setFlavor(p,n));if(state.fl){c.dd.set(state.fl,true);setChip(c,state.fl)}}}
  if(ow){let a=ow.parentElement;while(a&&a!==pg){if(getComputedStyle(a).overflow!=='visible')a.style.overflow='visible';a=a.parentElement}
   const ul=unitsOf(p);if(!state.un||!ul.includes(state.un))state.un=defUnit(p);
   if(ul.length>1){c.od=mkDD(ow,olab,ul.map(u=>UN[u]),l=>setUnit(p,Object.keys(UN).find(k=>UN[k]===l)),{ph:'Choose how to order',msg:'Please choose how to order',aria:'Order by'});c.od.set(UN[state.un],true)}
   else{ow.innerHTML='<div class="ra-ob-one">'+UN[ul[0]]+'</div>'}}
  [frame,wrap,ow].forEach(x=>{let a=x&&x.parentElement;while(a&&a!==pg&&a!==ctx.parentElement){if(/\bh-\[\d+px\]/.test(a.className)&&!a.dataset.raH){a.dataset.raH=1;const h=a.offsetHeight;a.style.minHeight=h+'px';a.style.height='auto'}a=a.parentElement}});
  if(!c.dd)c.dd={isOpen:()=>false,close(){},set(){},need(){}};if(!c.od)c.od={isOpen:()=>false,close(){},set(){},need(){}};ctrls.push(c)});updateOb(pg)}
document.addEventListener('pointerdown',e=>{ctrls.forEach(c=>{if(c.dd&&c.dd.isOpen()&&!c.dd.btn.closest('.ra-fl').contains(e.target))c.dd.close();if(c.od&&c.od.isOpen()&&!c.od.btn.closest('.ra-fl').contains(e.target))c.od.close()})},true);
// ---- order units: Piece / Box / Case, 10-box minimum (non-blocking). Source: units_runtime.js (spliced in by patch_runtime.py)
const MINB=10,UN={piece:'Piece',box:'Box',case:'Case'};
const unitsOf=p=>{if(p.po)return['piece'];const o=[];if(p.ppb>0)o.push('piece');o.push('box');if(p.bpc>0)o.push('case');return o};
const defUnit=p=>unitsOf(p).includes('box')?'box':unitsOf(p)[0];
const factor=(p,u)=>u==='piece'?(p.ppb>0?1/p.ppb:0):u==='case'?(p.bpc>0?+p.bpc:1):1;
const fb=n=>String(Math.round(n*10)/10);
const mk=(id,fl,un)=>id+(fl?'~'+fl:'')+'|'+un;
const altOf=p=>(bd(p)?bd(p)+' ':'')+strip(p);
const wd=(u,n)=>u==='box'?(n===1?'box':'boxes'):u==='piece'?(n===1?'piece':'pieces'):(n===1?'case':'cases');
const bw=x=>x>1?'boxes':'box';
const curUnit=p=>unitsOf(p).includes(state.un)?state.un:defUnit(p);
// item-level minimum (sheet MOQ): p.mq in p.mu ('box' | 'piece'); 1 when the item has none
const minQty=(p,u)=>{if(!(p.mq>0))return 1;if(p.mu==='piece')return u==='piece'?p.mq:1;if(u==='box')return p.mq;if(u==='piece')return Math.ceil(p.mq*(p.ppb||1));if(u==='case')return Math.max(1,Math.ceil(p.mq/(p.bpc||1)));return 1};
const minText=(p,u)=>{if(!(p.mq>0))return '';const n=minQty(p,u);if(p.mu==='piece')return 'Sold in minimum '+p.mq+' pieces';return 'Sold in minimum '+n+' '+wd(u,n)+(u==='box'?'':' ('+p.mq+' boxes)')};
const _mq=()=>{const p=byId(state.id);return p?minQty(p,curUnit(p)):1};
const safeN=p=>{let t=p.n.replace(/[\u2013\u2014]/g,'-');if(!CFG.showPrices)t=t.replace(/\s*-?\s*pre[\s-]*priced?\s*-?\s*\$?\s*\d+(?:\.\d+)?/ig,'');t=t.replace(/\(?\s*texas\s+compl\w+\s*\)?\.?/ig,'');return t.replace(/\s+/g,' ').trim()};
function migrateCart(){const n={};let ch=false;Object.keys(cart).forEach(k=>{const q=ck(k),p=byId(q.id),v=Math.floor(+cart[k]);if(!p||!(v>=1)){ch=true;return}let un=q.un;if(!unitsOf(p).includes(un)){un=defUnit(p);ch=true}const nk=mk(p.id,q.fl,un);if(nk!==k)ch=true;let vv=(n[nk]||0)+v;if(vv<minQty(p,un)){vv=minQty(p,un);ch=true}n[nk]=Math.min(9999,vv)});cart=n;if(ch)sv('ra_cart',cart)}
function unitLine(p,un,q){const bx=q*factor(p,un);return UN[un]+' - '+q+' '+wd(un,q)+(un==='box'||!(bx>0)?'':' = '+fb(bx)+' '+bw(Math.round(bx*10)/10))}
function obText(p,un,q){if(un==='piece'&&!(p.ppb>0))return 'Sold by the piece. The box size is not stated, so pieces are not counted toward the 10-box minimum.';if(un==='piece')return q+' '+wd('piece',q)+' = '+fb(q/p.ppb)+' '+bw(Math.round(q/p.ppb*10)/10)+'. 1 box = '+p.ppb+' pieces.';
 if(un==='case')return (q===1?'':q+' cases = '+fb(q*p.bpc)+' '+bw(Math.round(q*p.bpc*10)/10)+'. ')+'1 case = '+p.bpc+' boxes'+(p.ppb>0?' ('+Math.round(p.bpc*p.ppb)+' pieces)':'')+'.';
 const r=[];if(p.ppb>0)r.push('1 box = '+p.ppb+' pieces.');if(p.bpc>0)r.push('1 case = '+p.bpc+' boxes.');return r.length?r.join(' '):'Sold by the box. Quantity is counted in boxes.'}
function updateOb(pg){const p=byId(state.id);if(!p||!pg||state.page!=='prod')return;const un=curUnit(p),q=state.qty||1;
 $$('[data-f=ob-hint]',pg).forEach(e=>e.textContent=obText(p,un,q));$$('[data-f=ob-item]',pg).forEach(e=>{const t=minText(p,un);e.hidden=!t;e.textContent=t});$$('[data-f=qty-label]',pg).forEach(e=>e.textContent='QUANTITY ('+UN[un].toUpperCase()+'S)')}
function setUnit(p,u){if(!unitsOf(p).includes(u)||state.un===u)return;state.un=u;if(p.mq>0){state.qty=minQty(p,u);$$('[data-f=qty]',$('#app>main:not([hidden])')).forEach(x=>setText(x,String(state.qty)))}ctrls.forEach(c=>{if(c.p===p&&c.od&&document.contains(c.root))c.od.set(UN[u])});updateOb($('#app>main:not([hidden])'))}
function qMin(pg,n){const t=Math.round(n*10)/10;$$('[data-f=q-bar]',pg).forEach(e=>{e.style.width=Math.min(100,t/MINB*100)+'%'});$$('[data-qmin]',pg).forEach(e=>{e.classList.toggle('is-ok',t>=MINB);e.setAttribute('data-n',String(t))});
 $$('[data-f=q-minmsg]',pg).forEach(e=>{if(t>=MINB){e.textContent='Minimum reached.';e.className='rq-min-msg ok'}else if(t>0){const m=Math.round((MINB-t)*10)/10;e.textContent='Add '+fb(m)+' more '+bw(m)+' to reach the 10-box minimum. You can still send a smaller quote.';e.className='rq-min-msg warn'}else{e.textContent='Minimum order: 10 boxes across your quote. Smaller quotes can still be requested.';e.className='rq-min-msg'}})}
const prodDesc2=p=>{const fl=flList(p),f=(p.df||[]).slice();if(p.ppb>0)f.push(p.ppb+' pieces per box');if(fl.length)f.push(fl.length+(fl.length===1?' flavor':' flavors')+' to choose from');
 return strip(p)+(bd(p)?' from '+bd(p):'')+', in our '+p.c+' range.'+(f.length?' Details: '+dList(f)+'.':'')+(p.nt&&p.nt.length?' '+p.nt.map(x=>x+'.').join(' '):'')+' Wholesale for US retailers, 21+ only. Get a quote for bulk terms.'};
const SEO0={};
function seoProd(){const set=(sel,val)=>{const el=$(sel);if(!el)return;if(!(sel in SEO0))SEO0[sel]=el.getAttribute('content');el.setAttribute('content',val===null?SEO0[sel]:val)};
 const p=state.page==='prod'?byId(state.id):null;set('meta[property="og:title"]',document.title);set('meta[name=description]',p?prodDesc2(p):null);set('meta[property="og:description"]',p?prodDesc2(p):null)}
migrateCart();
// init
$$('[data-faq-answer]').forEach(a=>a.classList.add('hidden'));
$$('a[href^="#"]').forEach(a=>{});
addEventListener('popstate',route);addEventListener('hashchange',route);addEventListener('resize',scale);try{history.scrollRestoration='manual'}catch(e){}
if(!ld('ra_age',false))setTimeout(()=>{const i=innerWidth<900?1:0;const w=$$('.agegate-wrap')[i];if(w){w.hidden=false}},1500);else $$('.agegate-wrap').forEach(x=>x.hidden=true);
$$('.agegate-wrap').forEach(x=>x.hidden=true);if(!ld('ra_age',false))setTimeout(()=>{const w=$$('.agegate-wrap')[innerWidth<900?1:0];if(w)w.hidden=false},1500);
fixUrl();route();
})();
