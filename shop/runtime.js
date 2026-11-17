(function(){
const P=window.PRODUCTS,PICKS=window.PICKS||{},AL=window.ALIASES||{},byId=id=>P.find(p=>p.id==id)||P.find(p=>p.id==AL[id]);
const CATS={vapes:'Vapes',flower:'Flower',hydroxys:'Hydroxy','pre-rolls':'Pre-Rolls',edibles:'Edibles',kratom:'Kratom',shrooms:'Shrooms','smoke-accessories':'Smoke Accessories'};
const TITLES={vapes:'Vapes',flower:'Flower',hydroxys:'Hydroxys','pre-rolls':'Pre-Rolls',edibles:'Edibles',kratom:'Kratom',shrooms:'Shrooms','smoke-accessories':'Smoke Accessories',all:'All products',new:'New arrivals',trending:'Trending'};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}if(k==='ra_cart'){try{cartChanged()}catch(e){}}};
const CFG=window.RA_CONFIG||{};const REVS=()=>(window.REVIEWS||[]).filter(r=>r&&r.text);
let cart=ld('ra_cart',{}),vis=12,state={},qdone='',lastSent=null;
const priceTxt=p=>CFG.showPrices?m0(p.p):'Get a quote';
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailOK=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),phoneOK=v=>v.replace(/\D/g,'').length>=10;
async function send(type,data){const SUBJ={quote:'New QUOTE request',contact:'New contact message',subscribe:'New newsletter sign-up',review:'New customer REVIEW (to approve)'};
const payload=lastSent=Object.assign({_subject:(SUBJ[type]||'New website lead')+' - Red Apple Distribution',_template:'table',_captcha:'false',type,site:'redappledistribution.com',submitted_at:new Date().toISOString()},data,type==='quote'?acctInfo():{});
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
 if(seg[0]==='c')page='cat';else if(seg[0]==='p')page='prod';else if(seg[0]==='brands')page='brands';else if(seg[0]==='brand')page='brand';else if(seg[0]==='account')page=!seg[1]?'account':(seg[1]==='signup'||seg[1]==='signin')&&!seg[2]?seg[1]:'nf';else if(seg[0]==='admin')page='admin';else if(seg[0]==='order'){history.replaceState(null,'',BASE+'quote');return route()}else if(['about','contact','faq','policy','terms','privacy','returns','quote','review','reviews'].includes(seg[0]))page=seg[0];else if(seg[0]!==''&&seg[0]!==undefined)page='nf';
 if(page==='cat'&&!TITLES[seg[1]])page='nf';if(page==='prod'&&!byId(seg[1]))page='nf';
 $$('#app>main').forEach(m=>m.hidden=m.dataset.page!==page);
 state={page,slug:seg[1],id:seg[1],brand:decodeURIComponent(seg[1]||''),q:qs.get('q')||''};vis=12;
 render();if(authRoute())return;window.scrollTo(0,0);scale();document.title=({home:'Red Apple Distribution | Wholesale for US Smoke Shops',quote:'Get a Quote | Red Apple Distribution',review:'Write a Review | Red Apple Distribution',reviews:'Customer Reviews | Red Apple Distribution',about:'About Red Apple Distribution | US Wholesale Supplier',policy:'Shipping and Delivery | Red Apple Distribution',terms:'Terms of Sale | Red Apple Distribution',privacy:'Privacy Policy | Red Apple Distribution',returns:'Returns and Credits | Red Apple Distribution',contact:'Contact Red Apple Distribution',signup:'Create a Retailer Account | Red Apple Distribution',signin:'Sign In | Red Apple Distribution',account:'Your Account | Red Apple Distribution',admin:'Admin | Red Apple Distribution'})[page]||('Red Apple Distribution | '+(page==='cat'?TITLES[seg[1]]:page==='prod'?((bd(byId(seg[1]))?bd(byId(seg[1]))+' ':'')+strip(byId(seg[1]))):page[0].toUpperCase()+page.slice(1)));seoTags(page,pathq);seoProd()}
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
 $$('[data-f=q-count]',pg).forEach(e=>e.textContent=fb(n));qMin(pg,n);prefillQuote(pg);quotePrompt(pg);paintPast(pg);$$('[data-f=q-ref]',pg).forEach(e=>e.textContent=qdone)}
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
  saveQuoteAcct(lastSent);qdone=ref;cart={};sv('ra_cart',cart);render();window.scrollTo(0,0);return}
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
function seoTags(page,path){const fixed=page==='home'?BASE:['signup','signin','account','admin'].includes(page)?BASE+path+'/':(page==='cat'||page==='prod'||page==='brand')?BASE+path:FIXED.includes(page)?BASE+page+'/':BASE;
 const cp=page==='cat'?BASE+'c/'+path.split('/')[1]+'/':fixed,u=SITE+(page==='prod'||page==='brand'?BASE+path:cp);
 let c=$('link[rel=canonical]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href=u;
 const og=$('meta[property="og:url"]');if(og)og.content=u;const rb=$('meta[name=robots]');if(rb)rb.content=page==='nf'?'noindex,follow':(page==='account'||page==='admin')?'noindex,nofollow':'index,follow'}
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
// ---- optional retailer accounts. Source: auth_runtime.js (spliced in by patch_runtime.py). No library: direct fetch to Supabase Auth (GoTrue) and PostgREST.
// Guests are untouched: nothing here runs a network call unless a session exists or a visitor submits an account form.
const AUTHC=window.RA_AUTH||{};
let RECOV=/[#&](access_token|error_code|error|error_description|type)=/.test(location.hash)?location.hash:'';
const LOCALH=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
let MOCK=false;
try{if(/[?&]authmock=1/.test(location.search))sessionStorage.setItem('ra_authmock','1');MOCK=sessionStorage.getItem('ra_authmock')==='1'&&(!AUTHC.url||LOCALH)}catch(e){}
let MOCKC=false;try{if(MOCK){if(/[?&]confirm=1/.test(location.search))sessionStorage.setItem('ra_authmock_confirm','1');MOCKC=sessionStorage.getItem('ra_authmock_confirm')==='1'}}catch(e){}
const AUTH_ON=MOCK||!!(AUTHC.url&&AUTHC.anonKey);
const ADMINS=['gaurav@redappledistro.com','sales@redappledistro.com'];
const STATES_US=["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
const PAYS=['Zelle','ACH/bank transfer','Wire','Check','Net terms request','Other'];
const SK='ra_auth';
let SESS=ld(SK,null),PROF=null,WELCOME=false,UIDN=0;
if(SESS&&!(SESS.user&&SESS.user.id&&SESS.access_token))SESS=null;
if(SESS&&(SESS.access_token==='mock')!==MOCK)SESS=null;
if(!SESS){try{localStorage.removeItem('ra_auth_name')}catch(e){}}
if(!AUTH_ON)SESS=null;
const nowS=()=>Math.floor(Date.now()/1000);
function saveSess(s){SESS=s;if(s)sv(SK,s);else{try{localStorage.removeItem(SK)}catch(e){}}}
function setSession(j){saveSess({access_token:j.access_token,refresh_token:j.refresh_token||'',expires_at:j.expires_at||nowS()+(j.expires_in||3600),user:{id:j.user.id,email:String(j.user.email||'').toLowerCase()}})}
class AErr extends Error{constructor(m,code,status){super(m);this.code=code||'';this.status=status||0}}

// ---- remote backend (Supabase REST)
async function raw(path,o){o=o||{};const h=Object.assign({apikey:AUTHC.anonKey,'Content-Type':'application/json'},o.headers||{});if(o.token)h.Authorization='Bearer '+o.token;else if(/^eyJ/.test(String(AUTHC.anonKey)))h.Authorization='Bearer '+AUTHC.anonKey; // publishable keys (sb_publishable_) go in apikey only
 let r;try{r=await fetch(String(AUTHC.url).replace(/\/+$/,'')+path,{method:o.method||'GET',headers:h,body:o.body==null?undefined:JSON.stringify(o.body),keepalive:!!o.keepalive})}catch(e){throw new AErr('network','network',0)}
 let j=null;const t=await r.text();try{j=t?JSON.parse(t):null}catch(e){}
 if(!r.ok){const m=(j&&(j.msg||j.message||j.error_description||j.error))||('HTTP '+r.status);throw new AErr(String(m),String((j&&(j.error_code||j.code))||''),r.status)}
 return j}
let refreshing=null;
function refreshSess(){if(refreshing)return refreshing;const s=SESS;refreshing=(async()=>{try{const j=await raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}});setSession(j);return true}catch(e){if(e.status>=400&&e.status<500){saveSess(null);PROF=null;acctNav()}return false}finally{refreshing=null}})();return refreshing}
async function tok(){if(!SESS)throw new AErr('signed out','signed_out',401);if(SESS.expires_at-nowS()<60){const ok=await refreshSess();if(!SESS)throw new AErr('signed out','signed_out',401);if(!ok)throw new AErr('network','network',0)}return SESS.access_token}
async function authed(path,o){o=o||{};const t=await tok();try{return await raw(path,Object.assign({},o,{token:t}))}catch(e){if(e.status===401&&SESS&&!o._r){if(await refreshSess()&&SESS)return raw(path,Object.assign({},o,{token:SESS.access_token}));}throw e}}
const PF=['name','shop','phone','whatsapp','state','requirements','payment_pref'];
const pick=(o,ks)=>{const r={};ks.forEach(k=>{r[k]=o[k]==null?'':o[k]});return r};
const remoteB={
 async signUp(email,password,data){const j=await raw('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+'/shop/account/signin'),{method:'POST',body:{email,password,data}});if(j&&j.access_token&&j.user){setSession(j);return{ok:true}}return{ok:true,confirm:true}},
 async signIn(email,password){const j=await raw('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});setSession(j)},
 async signOut(){try{if(SESS)await raw('/auth/v1/logout',{method:'POST',token:SESS.access_token})}catch(e){}},
 async recover(email){await raw('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+'/shop/account/signin'),{method:'POST',body:{email}})},
 async setPassword(password,token){return raw('/auth/v1/user',{method:'PUT',token,body:{password}})},
 async resend(email){await raw('/auth/v1/resend?redirect_to='+encodeURIComponent(location.origin+'/shop/account/signin'),{method:'POST',body:{type:'signup',email}})},
 async userFromToken(token){const u=await raw('/auth/v1/user',{token});return{id:u.id,email:String(u.email||'').toLowerCase()}},
 async getProfile(){const r=await authed('/rest/v1/profiles?id=eq.'+encodeURIComponent(SESS.user.id)+'&select=*');return r&&r[0]||null},
 async updateProfile(f){const r=await authed('/rest/v1/profiles?id=eq.'+encodeURIComponent(SESS.user.id),{method:'PATCH',headers:{Prefer:'return=representation'},body:pick(f,PF)});return r&&r[0]||null},
 async getCart(){const r=await authed('/rest/v1/carts?user_id=eq.'+encodeURIComponent(SESS.user.id)+'&select=cart,updated_at');return r&&r[0]||null},
 async saveCart(c,keep){const ts=new Date().toISOString();await authed('/rest/v1/carts?on_conflict=user_id',{method:'POST',keepalive:keep,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:SESS.user.id,cart:c,updated_at:ts}});return ts},
 async listQuotes(){return authed('/rest/v1/quotes?user_id=eq.'+encodeURIComponent(SESS.user.id)+'&select=id,payload,total_boxes,created_at&order=created_at.desc&limit=50')},
 async saveQuote(payload,total){const r=await authed('/rest/v1/quotes',{method:'POST',headers:{Prefer:'return=representation'},body:{user_id:SESS.user.id,payload,total_boxes:total}});return r&&r[0]||null},
 async listProfiles(){return authed('/rest/v1/profiles?select=*&order=created_at.desc&limit=1000')},
 async setStatus(id,status){const r=await authed('/rest/v1/profiles?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:{status}});if(!r||!r.length)throw new AErr('not allowed','42501',403);return r[0]}
};
// ---- mock backend (?authmock=1, localhost or when no backend is configured): everything lives in localStorage key ra_mock_db
const cLink=e=>location.origin+'/shop/account/signin?authmock=1&confirm=1#access_token=mockconfirm.'+encodeURIComponent(e)+'&refresh_token=mock&expires_in=3600&type=signup';
const mockB=(()=>{const L=()=>ld('ra_mock_db',{users:{},carts:{},quotes:[],mail:[]}),S=d=>sv('ra_mock_db',d),W=()=>new Promise(r=>setTimeout(r,120));
 const need=()=>{if(!SESS)throw new AErr('signed out','signed_out',401)},adm=()=>{need();if(!ADMINS.includes(SESS.user.email))throw new AErr('permission denied','42501',403)};
 const mk_=u=>setSession({access_token:'mock',refresh_token:'mock',expires_at:nowS()+86400,user:{id:u.id,email:u.email}});
 const byEmail=(d,e)=>d.users[String(e).toLowerCase()],byId_=(d,id)=>Object.values(d.users).find(u=>u.id===id);
 return{
 async signUp(email,pw,meta){await W();const d=L();email=email.toLowerCase();if(d.users[email])throw new AErr('User already registered','user_already_exists',422);if(pw.length<8)throw new AErr('Password should be at least 8 characters','weak_password',422);
  const id='mock-'+Math.random().toString(36).slice(2,10);d.users[email]={id,email,pw,profile:Object.assign({id,email,status:'pending',created_at:new Date().toISOString()},pick(meta,PF))};if(MOCKC){d.users[email].confirmed=false;d.mail.push({to:email,kind:'confirm',link:cLink(email),at:new Date().toISOString()});S(d);return{ok:true,confirm:true}}S(d);mk_(d.users[email]);return{ok:true}},
 async resend(email){await W();const d=L();if(byEmail(d,email)){d.mail.push({to:email.toLowerCase(),kind:'confirm',link:cLink(email),at:new Date().toISOString()});S(d)}},
 async userFromToken(token){await W();const d=L(),m=/^mockconfirm\.(.+)$/.exec(token||''),u=m&&byEmail(d,decodeURIComponent(m[1]));if(!u)throw new AErr('Invalid or expired link','otp_expired',401);u.confirmed=true;S(d);return{id:u.id,email:u.email}},
 async signIn(email,pw){await W();const u=byEmail(L(),email);if(!u||u.pw!==pw)throw new AErr('Invalid login credentials','invalid_credentials',400);if(u.confirmed===false)throw new AErr('Email not confirmed','email_not_confirmed',400);mk_(u)},
 async signOut(){await W()},
 async recover(email){await W();const d=L();if(byEmail(d,email)){d.mail.push({to:email.toLowerCase(),link:location.origin+'/shop/account/signin?authmock=1#access_token=mockrecovery.'+encodeURIComponent(email.toLowerCase())+'&refresh_token=mock&expires_in=3600&type=recovery',at:new Date().toISOString()});S(d)}},
 async setPassword(pw,token){await W();const d=L(),m=/^mockrecovery\.(.+)$/.exec(token||''),u=m&&byEmail(d,decodeURIComponent(m[1]));if(!u)throw new AErr('Invalid or expired link','otp_expired',401);if(pw.length<8)throw new AErr('Password should be at least 8 characters','weak_password',422);u.pw=pw;S(d);return{id:u.id,email:u.email}},
 async getProfile(){await W();need();const u=byId_(L(),SESS.user.id);return u?Object.assign({},u.profile):null},
 async updateProfile(f){await W();need();const d=L(),u=byId_(d,SESS.user.id);Object.assign(u.profile,pick(f,PF));S(d);return Object.assign({},u.profile)},
 async getCart(){await W();need();return L().carts[SESS.user.id]||null},
 async saveCart(c,keep){need();const d=L(),ts=new Date().toISOString();d.carts[SESS.user.id]={cart:JSON.parse(JSON.stringify(c)),updated_at:ts};S(d);return ts},
 async listQuotes(){await W();need();return L().quotes.filter(q=>q.user_id===SESS.user.id).sort((a,b)=>b.created_at<a.created_at?-1:1)},
 async saveQuote(payload,total){await W();need();const d=L(),q={id:'q-'+Math.random().toString(36).slice(2,10),user_id:SESS.user.id,payload:JSON.parse(JSON.stringify(payload)),total_boxes:total,created_at:new Date().toISOString()};d.quotes.push(q);S(d);return q},
 async listProfiles(){await W();adm();return Object.values(L().users).map(u=>Object.assign({},u.profile)).sort((a,b)=>b.created_at<a.created_at?-1:1)},
 async setStatus(id,status){await W();adm();const d=L(),u=byId_(d,id);if(!u)throw new AErr('not found','404',404);u.profile.status=status;S(d);return Object.assign({},u.profile)}}})();
const B=MOCK?mockB:remoteB;

// ---- small helpers
const digits=v=>String(v||'').replace(/\D/g,'');
const us10=v=>{let d=digits(v);if(d.length===11&&d[0]==='1')d=d.slice(1);return d};
const fmtUS=v=>{const d=us10(v);return d.length===10?'('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6):String(v||'').trim()};
const waLink=v=>{let d=digits(v);if(d.length===10)d='1'+d;return d.length>=10?'https://wa.me/'+d:''};
const isAdmin=()=>!!SESS&&ADMINS.includes(SESS.user.email);
const nextPath=n=>({quote:'/quote',account:'/account'})[n]||'';
const fdate=s=>{try{return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}catch(e){return ''}};
const sfxOf=r=>r.closest('.dsk')?'d':'m';
const roots=pg=>$$('[data-acct-root]',pg);
const opt=(v,sel,lab)=>'<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+esc(lab||v)+'</option>';
function emsg(e,ctx){e=e||{};const c=e.code||'',s=e.status||0,m=String(e.message||'').toLowerCase();
 if(c==='network')return 'We could not reach the server. Check your connection and try again.';
 if(c==='user_already_exists'||/already registered|already exists/.test(m))return 'An account with this email already exists. Try signing in instead.';
 if(c==='invalid_credentials'||/invalid login/.test(m))return 'That email and password do not match. Please try again, or reset your password.';
 if(c==='weak_password'||(s===422&&/password/.test(m)))return 'Please choose a stronger password (at least 8 characters).';
 if(s===429||/rate limit/.test(m)||c==='over_request_rate_limit'||c==='over_email_send_rate_limit')return 'Too many attempts. Please wait a minute and try again.';
 if(c==='email_not_confirmed'||/not confirmed/.test(m))return 'Please confirm your email first. Check your inbox for our message.';
 if(c==='otp_expired'||c==='bad_jwt')return 'That link has expired. Please request a new one.';
 if(ctx==='admin'&&(s===401||s===403))return 'You do not have access.';
 if(s===401)return 'Your session has ended. Please sign in again.';
 return 'Something went wrong. Please try again, or email sales@redappledistro.com.'}

// ---- form builders (ids carry a per-frame suffix: the 1440 and 390 frames both live in the DOM)
function fld(o){const id=o.id,e=id+'-e',h=o.hint?id+'-h':'',ar=' aria-describedby="'+(h?h+' ':'')+e+'"'+(o.req?' aria-required="true"':'');let c;
 if(o.t==='select')c='<select class="rq-sel" id="'+id+'" name="'+o.n+'" autocomplete="'+(o.ac||'off')+'"'+ar+'>'+o.opts+'</select>';
 else if(o.t==='textarea')c='<textarea class="rq-ta" id="'+id+'" name="'+o.n+'" rows="3" maxlength="1000" placeholder="'+esc(o.ph||'')+'"'+ar+'>'+esc(o.v||'')+'</textarea>';
 else if(o.t==='password')c='<div class="aa-pw"><input class="rq-in" id="'+id+'" name="'+o.n+'" type="password" autocomplete="'+o.ac+'" autocapitalize="none" spellcheck="false"'+ar+'><button type="button" class="aa-eye" data-aa="pw" aria-controls="'+id+'" aria-pressed="false" aria-label="Show password">Show</button></div>';
 else c='<input class="rq-in" id="'+id+'" name="'+o.n+'" type="'+(o.t||'text')+'" autocomplete="'+(o.ac||'off')+'"'+(o.inm?' inputmode="'+o.inm+'"':'')+(o.t==='email'?' autocapitalize="none" spellcheck="false"':'')+(o.ro?' readonly aria-disabled="true"':'')+' maxlength="'+(o.max||120)+'" placeholder="'+esc(o.ph||'')+'" value="'+esc(o.v||'')+'"'+ar+'>';
 return '<div class="rq-f aa-f"><label for="'+id+'">'+esc(o.l)+(o.req?' <span class="aa-req" aria-hidden="true">*</span>':'')+(o.opt?' <small>optional</small>':'')+'</label>'+c+(o.hint?'<p class="aa-h" id="'+h+'">'+esc(o.hint)+'</p>':'')+'<p class="aa-fe" id="'+e+'" data-fe="'+o.n+'" role="alert"></p></div>'}
const stateOpts=v=>'<option value="">Select your state</option>'+STATES_US.map(s=>opt(s,s===v)).join('');
const payOpts=v=>'<option value="">No preference yet</option>'+PAYS.map(s=>opt(s,s===v)).join('');
const HP='<input class="rq-hp" name="hp_check" tabindex="-1" autocomplete="off" aria-hidden="true">';
function profFields(s,p,pre){p=p||{};const I=n=>pre+n+'-'+s;const same=p.whatsapp&&p.phone&&digits(p.whatsapp)===digits(p.phone);
 return '<div class="rq-row2">'+fld({id:I('name'),n:'name',l:'Your name',ac:'name',req:1,ph:'Full name',v:p.name})+fld({id:I('shop'),n:'shop',l:'Shop name',ac:'organization',req:1,ph:'Your shop name',v:p.shop})+'</div>'
 +'<div class="rq-row2">'+fld({id:I('phone'),n:'phone',t:'tel',l:'Phone (US)',ac:'tel',inm:'tel',req:1,ph:'(555) 123-4567',v:p.phone,max:20})+fld({id:I('wa'),n:'whatsapp',t:'tel',l:'WhatsApp number',opt:1,ac:'off',inm:'tel',ph:'(555) 123-4567',v:same?p.phone:p.whatsapp,ro:same,max:24})+'</div>'
 +'<label class="rq-check aa-same"><input type="checkbox" name="wa_same"'+(same?' checked':'')+'> <span>My WhatsApp number is the same as my phone</span></label>'
 +'<div class="rq-row2">'+fld({id:I('state'),n:'state',t:'select',l:'Your state',ac:'address-level1',req:1,opts:stateOpts(p.state)})+fld({id:I('pay'),n:'payment_pref',t:'select',l:'Preferred payment method',opt:1,opts:payOpts(p.payment_pref),hint:'Preference only. Never enter card or bank numbers.'})+'</div>'
 +fld({id:I('req'),n:'requirements',t:'textarea',l:'What are you looking for?',opt:1,ph:'Brands, categories, flavors or target quantities',v:p.requirements})}
function formSignup(s){const I=n=>'su-'+n+'-'+s;
 return '<form class="rq-card aa-card" data-af="signup" novalidate onsubmit="return false"><h2 class="rq-h2">Your details</h2>'
 +'<div class="rq-row2">'+fld({id:I('name'),n:'name',l:'Your name',ac:'name',req:1,ph:'Full name'})+fld({id:I('shop'),n:'shop',l:'Shop name',ac:'organization',req:1,ph:'Your shop name'})+'</div>'
 +'<div class="rq-row2">'+fld({id:I('email'),n:'email',t:'email',l:'Email',ac:'username',inm:'email',req:1,ph:'you@yourshop.com',max:160})+fld({id:I('pw'),n:'password',t:'password',l:'Password',ac:'new-password',req:1,hint:'At least 8 characters.'})+'</div>'
 +'<div class="rq-row2">'+fld({id:I('phone'),n:'phone',t:'tel',l:'Phone (US)',ac:'tel',inm:'tel',req:1,ph:'(555) 123-4567',max:20})+fld({id:I('wa'),n:'whatsapp',t:'tel',l:'WhatsApp number',opt:1,ac:'off',inm:'tel',ph:'(555) 123-4567',max:24})+'</div>'
 +'<label class="rq-check aa-same"><input type="checkbox" name="wa_same"> <span>My WhatsApp number is the same as my phone</span></label>'
 +'<div class="rq-row2">'+fld({id:I('state'),n:'state',t:'select',l:'Your state',ac:'address-level1',req:1,opts:stateOpts('')})+fld({id:I('pay'),n:'payment_pref',t:'select',l:'Preferred payment method',opt:1,opts:payOpts(''),hint:'Preference only. Never enter card or bank numbers.'})+'</div>'
 +fld({id:I('req'),n:'requirements',t:'textarea',l:'What are you looking for?',opt:1,ph:'Brands, categories, flavors or target quantities'})
 +HP+'<div class="aa-chk"><label class="rq-check"><input type="checkbox" name="age" id="'+I('age')+'" aria-describedby="'+I('age')+'-e" aria-required="true"> <span>I am 21 or older and I am signing up for a business that sells to adults 21 and older.</span></label><p class="aa-fe" id="'+I('age')+'-e" data-fe="age" role="alert"></p></div>'
 +'<p class="rq-err aa-ferr" data-err role="alert"></p>'
 +'<button type="submit" class="rq-btn full">Create account</button>'
 +'<p class="rq-note aa-consent">By creating an account you agree to how we use your details as described on our <a href="/shop/privacy">Privacy page</a>. We never ask for card or bank numbers, and nothing is charged on this website.</p>'
 +'<p class="rq-note aa-alt">Already have an account? <a href="/shop/account/signin">Sign in</a></p></form>'}
function formSignin(s,next){const I=n=>'si-'+n+'-'+s;
 return '<form class="rq-card aa-card aa-narrow" data-af="signin"'+(next?' data-next="'+esc(next)+'"':'')+' novalidate onsubmit="return false"><h2 class="rq-h2">Welcome back</h2>'
 +fld({id:I('email'),n:'email',t:'email',l:'Email',ac:'username',inm:'email',req:1,ph:'you@yourshop.com',max:160})
 +fld({id:I('pw'),n:'password',t:'password',l:'Password',ac:'current-password',req:1})
 +HP+'<p class="rq-err aa-ferr" data-err role="alert"></p><button type="submit" class="rq-btn full">Sign in</button>'
 +'<p class="rq-note aa-alt"><button type="button" class="aa-link" data-aa="view" data-v="forgot">Forgot password?</button></p>'
 +'<p class="rq-note aa-alt">New here? <a href="/shop/account/signup'+(next&&nextPath(next)?'?next='+encodeURIComponent(next):'')+'">Create an account</a> or <a href="/shop/quote">request a quote as a guest</a>.</p></form>'}
function formForgot(s){const I=n=>'fg-'+n+'-'+s;
 return '<form class="rq-card aa-card aa-narrow" data-af="forgot" novalidate onsubmit="return false"><h2 class="rq-h2">Reset your password</h2><p class="rq-note" style="margin-bottom:16px">Enter the email you signed up with and we will send you a link to choose a new password.</p>'
 +fld({id:I('email'),n:'email',t:'email',l:'Email',ac:'username',inm:'email',req:1,ph:'you@yourshop.com',max:160})
 +HP+'<p class="rq-err aa-ferr" data-err role="alert"></p><button type="submit" class="rq-btn full">Send reset link</button>'
 +'<p class="rq-note aa-alt"><button type="button" class="aa-link" data-aa="view" data-v="in">Back to sign in</button></p></form>'}
function formReset(s){const I=n=>'rs-'+n+'-'+s;
 return '<form class="rq-card aa-card aa-narrow" data-af="reset" novalidate onsubmit="return false"><h2 class="rq-h2">Choose a new password</h2>'
 +fld({id:I('pw'),n:'password',t:'password',l:'New password',ac:'new-password',req:1,hint:'At least 8 characters.'})
 +fld({id:I('pw2'),n:'password2',t:'password',l:'Repeat new password',ac:'new-password',req:1})
 +'<p class="rq-err aa-ferr" data-err role="alert"></p><button type="submit" class="rq-btn full">Save new password</button></form>'}
const msgCard=(pill,h,body,btns)=>'<div class="rq-card aa-card aa-narrow aa-msg"><p class="rq-pill">'+pill+'</p><h2 class="rq-h2">'+h+'</h2><p>'+body+'</p>'+(btns||'')+'</div>';
const mockBar=()=>MOCK?'<p class="aa-mock" role="note">Test mode: accounts are simulated in this browser only.</p>':'';
function paint(pg,fn){roots(pg).forEach(r=>{r.innerHTML=mockBar()+fn(sfxOf(r),r)})}
function setH1(pg,t){$$('.rq-h1',pg).forEach(h=>{h.textContent=t})}

// ---- validation
const RULE={name:v=>v.length<2?'Please enter your name.':'',shop:v=>v.length<2?'Please enter your shop name.':'',
 email:v=>!v?'Please enter your email.':!emailOK(v)?'Please enter a valid email address.':'',
 password:(v,a)=>a&&a.__signin?(v?'':'Please enter your password.'):(v.length<8?'Use at least 8 characters.':''),
 password2:(v,a)=>v!==a.password?'The two passwords do not match.':'',
 phone:v=>us10(v).length!==10?'Please enter a valid US phone number (10 digits).':'',
 whatsapp:(v,a)=>!a.wa_same&&v&&digits(v).length<10?'Please enter a valid WhatsApp number, or leave it empty.':'',
 state:v=>!v?'Please choose your state.':'',age:v=>!v?'Please confirm to continue.':''};
function rd(f){const o={};$$('input,select,textarea',f).forEach(i=>{if(!i.name)return;o[i.name]=i.type==='checkbox'?i.checked:(i.type==='password'?i.value:i.value.trim())});if(f.dataset.af==='signin')o.__signin=1;if(o.wa_same)o.whatsapp=o.phone;return o}
function setFE(f,n,msg){const p=$('[data-fe="'+n+'"]',f),i=$('[name="'+n+'"]',f);if(p)p.textContent=msg||'';if(i){i.classList.toggle('rq-bad',!!msg);if(msg)i.setAttribute('aria-invalid','true');else i.removeAttribute('aria-invalid')}}
function chk(f,names,v){const bad=[];names.forEach(n=>{const m=RULE[n]?RULE[n](v[n],v):'';setFE(f,n,m);if(m)bad.push(n)});return bad}
function focusBad(f,n){const i=$('[name="'+n+'"]',f);if(i){try{i.scrollIntoView({block:'center'})}catch(e){}i.focus({preventScroll:true})}}
function ferr(f,m){const e=$('[data-err]',f);if(e)e.textContent=m||''}
function busy(f,on,txt){const b=$('button[type=submit]',f);f.dataset.busy=on?'1':'';if(!b)return;if(on){b.dataset.t=b.textContent;b.textContent=txt;b.disabled=true;f.setAttribute('aria-busy','true')}else{b.textContent=b.dataset.t||b.textContent;b.disabled=false;f.removeAttribute('aria-busy')}}
document.addEventListener('focusout',e=>{const i=e.target,f=i&&i.closest&&i.closest('form[data-af]');if(!f||!i.name||!RULE[i.name])return;const v=rd(f),has=i.type==='checkbox'?i.checked:!!i.value;
 if(!has&&!i.getAttribute('aria-invalid'))return;if(i.type==='tel'&&i.name==='phone'&&us10(i.value).length===10)i.value=fmtUS(i.value);setFE(f,i.name,RULE[i.name](v[i.name],v))});
document.addEventListener('input',e=>{const i=e.target,f=i&&i.closest&&i.closest('form[data-af]');if(!f||!i.name)return;
 if(i.name==='phone'){const cb=$('[name=wa_same]',f),w=$('[name=whatsapp]',f);if(cb&&cb.checked&&w)w.value=i.value}
 if(i.getAttribute('aria-invalid')&&RULE[i.name]){const v=rd(f);setFE(f,i.name,RULE[i.name](v[i.name],v))}});
document.addEventListener('change',e=>{const i=e.target,f=i&&i.closest&&i.closest('form[data-af]');if(!f)return;
 if(i.name==='wa_same'){const w=$('[name=whatsapp]',f),p=$('[name=phone]',f);if(!w)return;w.readOnly=i.checked;w.setAttribute('aria-disabled',i.checked?'true':'false');if(i.checked){w.value=p?p.value:'';setFE(f,'whatsapp','')}else w.value=''}
 else if(RULE[i.name]&&i.getAttribute('aria-invalid')){const v=rd(f);setFE(f,i.name,RULE[i.name](v[i.name],v))}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-aa=pw]');if(!b)return;const i=document.getElementById(b.getAttribute('aria-controls'));if(!i)return;const show=i.type==='password';i.type=show?'text':'password';b.textContent=show?'Hide':'Show';b.setAttribute('aria-pressed',show?'true':'false');b.setAttribute('aria-label',show?'Hide password':'Show password')});

// ---- cart sync (guests are unchanged; this only runs with a session)
function normCart(o){const n={};Object.keys(o||{}).forEach(k=>{const q=ck(k),p=byId(q.id),v=Math.floor(+o[k]);if(!p||!(v>=1))return;let un=q.un;if(!unitsOf(p).includes(un))un=defUnit(p);const nk=mk(p.id,q.fl,un);n[nk]=Math.min(9999,(n[nk]||0)+v)});return n}
function mergeCarts(a,b){const A=normCart(a),Bc=normCart(b),o=Object.assign({},A);Object.keys(Bc).forEach(k=>{o[k]=Math.max(o[k]||0,Bc[k])});Object.keys(o).forEach(k=>{const q=ck(k),p=byId(q.id);o[k]=Math.min(9999,Math.max(o[k],minQty(p,q.un)))});return o}
let cTimer=0,cDirty=false,cReady=false,cPend=false,qFlush=false;
const tsGet=()=>(ld('ra_cart_ts',{})||{})[SESS&&SESS.user.id]||'';
const tsSet=t=>{if(!SESS)return;const o=ld('ra_cart_ts',{})||{};o[SESS.user.id]=t;sv('ra_cart_ts',o)};
function cartChanged(){if(!SESS||!AUTH_ON)return;if(!cReady){cPend=true;return}cDirty=true;clearTimeout(cTimer);cTimer=setTimeout(()=>pushCart(false),1200)}
async function pushCart(keep){if(!SESS||!cDirty)return true;cDirty=false;clearTimeout(cTimer);try{const ts=await B.saveCart(cart,keep);tsSet(ts);return true}catch(e){cDirty=true;return false}}
async function pullMerge(always){if(!SESS)return;let r;try{r=await B.getCart()}catch(e){cReady=true;return}
 const remote=(r&&r.cart)||{},ts=(r&&r.updated_at)||'';
 if(always||ts!==tsGet()){const m=mergeCarts(cart,remote),same=JSON.stringify(m)===JSON.stringify(normCart(remote));cart=m;sv('ra_cart',cart);cReady=true;if(!same||!r){cDirty=true;await pushCart(false)}else tsSet(ts)}
 else cReady=true;
 if(cPend){cPend=false;cDirty=true;pushCart(false)}
 render();if(state.page==='account')paintDash($('#app>main:not([hidden])'))}
addEventListener('pagehide',()=>{if(cDirty)pushCart(true)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&cDirty)pushCart(true)});

// ---- profile, header link, prompts, quote prefill and save
async function loadProfile(){if(!SESS)return null;try{PROF=await B.getProfile()}catch(e){if(e.code==='signed_out')PROF=null}
 if(PROF)rememberName();if(PROF&&state.page==='quote')prefillQuote($('#app>main:not([hidden])'));return PROF}
function acctNav(){const on=!!SESS,n=on?String(localStorage.getItem('ra_auth_name')||''):'';$$('a[data-ra-acct]').forEach(a=>{a.textContent=on?'My account'+(n?' - '+n:''):'Sign in';a.setAttribute('href',on?'/shop/account':'/shop/account/signin')});$$('[data-ra-acct-cta]').forEach(e=>{e.hidden=on});$$('[data-acct-line]').forEach(e=>{e.hidden=!AUTH_ON||on})}
function rememberName(){try{const p=PROF;if(!SESS||!p)return;const f=String(p.name||'').trim().split(/\s+/)[0]||String(p.shop||'').trim();localStorage.setItem('ra_auth_name',f.slice(0,14))}catch(e){}acctNav()}
function acctInfo(){return SESS?{account:'signed in',account_email:SESS.user.email,account_status:(PROF&&PROF.status)||'pending'}:{}}
function prefillQuote(pg){if(!SESS||!PROF||!pg)return;$$('form[data-form=quote]',pg).forEach(f=>{if(f.dataset.pf===PROF.id)return;f.dataset.pf=PROF.id;const set=(n,v)=>{const i=$('[name='+n+']',f);if(i&&v&&!i.value)i.value=v};set('shop',PROF.shop);set('contact',PROF.name);set('email',PROF.email||SESS.user.email);set('whatsapp',PROF.whatsapp||PROF.phone);set('state',PROF.state)})}
function clearQuoteForms(){$$('form[data-form=quote]').forEach(f=>{if(!f.dataset.pf)return;delete f.dataset.pf;['shop','contact','email','whatsapp','state'].forEach(n=>{const i=$('[name='+n+']',f);if(i)i.value=''})})}
function quotePrompt(pg){$$('[data-acct-prompt]',pg).forEach(e=>{if(!AUTH_ON){e.hidden=true;return}e.hidden=false;
 e.innerHTML=SESS?'Signed in as <b>'+esc(SESS.user.email)+'</b>. Your details are filled in and this quote will be saved to your account.':'Have an account? <a href="/shop/account/signin?next=quote">Sign in</a> or <a href="/shop/account/signup?next=quote">create an account</a> to save your cart. Accounts are optional.'})}
function saveQuoteAcct(payload){if(!SESS||!payload)return;const total=payload.total_boxes==null?0:payload.total_boxes;
 const q=ld('ra_q_pending',[]);q.push({u:SESS.user.id,payload,total});sv('ra_q_pending',q);flushQuotes(true)}
async function flushQuotes(loud){if(!SESS)return;if(qFlush)return;let q=ld('ra_q_pending',[]);if(!q.length)return;qFlush=true;const mine=q.filter(x=>x.u===SESS.user.id);let failed=false;
 for(const x of mine){try{await B.saveQuote(x.payload,x.total);D.q=null;q=ld('ra_q_pending',[]).filter(y=>y!==x&&JSON.stringify(y)!==JSON.stringify(x))}catch(e){failed=true;break}sv('ra_q_pending',q)}
 qFlush=false;if(failed&&loud)toast('Quote sent. We could not add it to your account history yet.')}

// ---- sign-up notification to the owner (profile without password) through the existing form endpoint
async function notifySignup(p){const body=Object.assign({_subject:'New retailer account: '+(p.shop||p.email)},p);sv('ra_acct_notify',body);const ok=await send('account',body);if(ok)try{localStorage.removeItem('ra_acct_notify')}catch(e){}return ok}
async function retryNotify(){const b=ld('ra_acct_notify',null);if(b&&SESS&&b.email===SESS.user.email){const ok=await send('account',b);if(ok)try{localStorage.removeItem('ra_acct_notify')}catch(e){}}}

// ---- email confirmation (works with confirmation off or on; the live project decides)
const RS='ra_resend_ts';
const coolLeft=e=>Math.max(0,60-Math.floor((Date.now()-((ld(RS,{})||{})[e]||0))/1000));
function markResend(e){const o=ld(RS,{})||{};o[e]=Date.now();sv(RS,o)}
function tickResend(){let any=false;$$('[data-aa=resend]').forEach(b=>{const l=coolLeft(b.dataset.email);b.disabled=l>0;b.textContent=l>0?'Resend email ('+l+'s)':'Resend email';if(l>0)any=true});if(any)setTimeout(tickResend,1000)}
function paintConfirm(pg,email,first){setH1(pg,first?'Check your email':'Confirm your email');
 paint(pg,()=>msgCard(first?'Almost there':'One more step','<span data-confirm-h>'+(first?'Check your email to confirm your account':'Please confirm your email first')+'</span>','We sent a confirmation link to <b>'+esc(email)+'</b>. Open it to finish setting up your account. If you do not see it, check your spam folder.','<p><button type="button" class="rq-btn" data-aa="resend" data-email="'+esc(email)+'">Resend email</button></p><p class="rq-note"><button type="button" class="aa-link" data-aa="restart">Wrong address? Start again</button> <span aria-hidden="true">|</span> <button type="button" class="aa-link" data-aa="view" data-v="in">Back to sign in</button></p>'));tickResend()}
// first confirmed sign-in on this device after a sign-up that needed confirmation: tell the owner once (profile read from the server)
async function confirmedNotify(){const pend=ld('ra_signup_pending',null);if(!pend||!SESS||pend.email!==SESS.user.email||!PROF)return;try{localStorage.removeItem('ra_signup_pending')}catch(e){}
 await notifySignup(profileMail('yes'))}
function profileMail(conf){const p=PROF||{};return Object.assign({id:SESS.user.id,email:p.email||SESS.user.email,status:p.status||'pending',email_confirmed:conf},pick(p,PF))}
function recovKind(){const hp=new URLSearchParams(RECOV.replace(/^#/,''));if(hp.get('error')||hp.get('error_code'))return 'error';if(hp.get('type')==='signup')return hp.get('access_token')?'confirm':'confirmed';return hp.get('access_token')?'recovery':'error'}
async function doConfirmReturn(){const pg=$('#app>main:not([hidden])'),hp=new URLSearchParams(RECOV.replace(/^#/,''));setH1(pg,'Confirming your email');paint(pg,()=>msgCard('One moment','Confirming your email','Signing you in...'));
 try{const t=hp.get('access_token'),u=await B.userFromToken(t);setSession({access_token:t,refresh_token:hp.get('refresh_token')||'',expires_at:+hp.get('expires_at')||nowS()+(+hp.get('expires_in')||3600),user:u});RECOV='';
  try{localStorage.removeItem('ra_signup_pending')}catch(e){}
  PROF=null;await loadProfile();if(PROF)await notifySignup(profileMail('yes'));WELCOME='confirmed';await afterSignIn(null,false)}
 catch(e){RECOV='';setH1(pg,'Email confirmed');paint(pg,()=>msgCard('Email confirmed','Email confirmed, please sign in','Thank you. Your email is confirmed. Sign in to open your account.','<p><button type="button" class="rq-btn" data-aa="view" data-v="in">Sign in</button></p>'))}}

// ---- actions
async function afterSignIn(f,fresh){PROF=null;cReady=false;await Promise.all([loadProfile(),pullMerge(true)]);flushQuotes(false);retryNotify();confirmedNotify();acctNav();clearQuoteForms();
 const nx=f&&f.dataset.next;if(nx==='admin'){authRoute();return}go(nextPath(nx)||'/account')}
async function doSignup(f){const v=rd(f);if(v.hp_check)return;const bad=chk(f,['name','shop','email','password','phone','whatsapp','state','age'],v);if(bad.length){ferr(f,'Please check the highlighted fields.');focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Creating account...');
 try{const meta={name:v.name,shop:v.shop,phone:fmtUS(v.phone),whatsapp:v.wa_same?fmtUS(v.phone):(v.whatsapp?fmtUS(v.whatsapp):''),state:v.state,requirements:v.requirements,payment_pref:v.payment_pref},email=v.email.toLowerCase();
  const r=await B.signUp(email,v.password,meta);
  if(r.confirm){sv('ra_signup_pending',{email});markResend(email);busy(f,false);paintConfirm($('#app>main:not([hidden])'),email,true);return}
  WELCOME=true;PROF=null;notifySignup(Object.assign({id:SESS.user.id,email,status:'pending',email_confirmed:'no (confirmation is off)'},meta));
  await afterSignIn(f,true)}
 catch(e){busy(f,false);ferr(f,emsg(e,'signup'));if(e.code==='user_already_exists')focusBad(f,'email')}}
async function doSignin(f){const v=rd(f);if(v.hp_check)return;const bad=chk(f,['email','password'],v);if(bad.length){ferr(f,'Please enter your email and password.');focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Signing in...');
 try{await B.signIn(v.email.toLowerCase(),v.password);await afterSignIn(f,false)}catch(e){busy(f,false);if(e.code==='email_not_confirmed'||/not confirmed/i.test(e.message||'')){paintConfirm($('#app>main:not([hidden])'),v.email.toLowerCase(),false);return}ferr(f,emsg(e,'signin'));const p=$('[name=password]',f);if(p){p.value='';p.focus()}}}
async function doForgot(f){const v=rd(f);if(v.hp_check)return;const bad=chk(f,['email'],v);if(bad.length){focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Sending...');
 try{await B.recover(v.email.toLowerCase());const pg=$('#app>main:not([hidden])');setH1(pg,'Check your email');paint(pg,()=>msgCard('Reset link sent','Check your email','If an account exists for <b>'+esc(v.email)+'</b>, a link to choose a new password is on its way. It can take a minute to arrive. Check your spam folder too.','<p><button type="button" class="rq-btn ghost" data-aa="view" data-v="in">Back to sign in</button></p>'))}
 catch(e){busy(f,false);ferr(f,emsg(e,'forgot'))}}
async function doReset(f){const v=rd(f);const bad=chk(f,['password','password2'],v);if(bad.length){focusBad(f,bad[0]);return}
 const hp=new URLSearchParams(RECOV.replace(/^#/,''));ferr(f,'');busy(f,true,'Saving...');
 try{const u=await B.setPassword(v.password,hp.get('access_token')||'');
  setSession({access_token:hp.get('access_token'),refresh_token:hp.get('refresh_token')||'',expires_at:+hp.get('expires_at')||nowS()+(+hp.get('expires_in')||3600),user:u});RECOV='';
  toast('Password updated');await afterSignIn(null,false)}
 catch(e){busy(f,false);ferr(f,emsg(e,'reset'))}}
async function doProfile(f){const v=rd(f);const bad=chk(f,['name','shop','phone','whatsapp','state'],v);if(bad.length){ferr(f,'Please check the highlighted fields.');focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Saving...');
 try{const meta={name:v.name,shop:v.shop,phone:fmtUS(v.phone),whatsapp:v.wa_same?fmtUS(v.phone):(v.whatsapp?fmtUS(v.whatsapp):''),state:v.state,requirements:v.requirements,payment_pref:v.payment_pref};
  const p=await B.updateProfile(meta);PROF=Object.assign({},PROF||{},p||meta);D.edit=false;paintDash($('#app>main:not([hidden])'));toast('Profile saved')}
 catch(e){busy(f,false);ferr(f,emsg(e,'profile'))}}
const FORMS={signup:doSignup,signin:doSignin,forgot:doForgot,reset:doReset,profile:doProfile};
document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('form[data-af]');if(!f)return;e.preventDefault();if(f.dataset.busy)return;const h=FORMS[f.dataset.af];if(h)h(f)});
async function doSignOut(){await pushCart(false);const ok=!cDirty;await B.signOut();saveSess(null);PROF=null;try{localStorage.removeItem('ra_auth_name')}catch(e){}cReady=false;cDirty=false;D.q=null;D.err='';A.rows=null;A.q='';A.f='all';WELCOME=false;
 if(ok){cart={};sv('ra_cart',cart)}clearQuoteForms();pastLoading=false;acctNav();render();toast('You are signed out');go('/')}
function itemKey(it){const p=byId(it.id);if(!p)return null;const rev={Piece:'piece',Box:'box',Case:'case'};let un=rev[it.unit]||'box';if(!unitsOf(p).includes(un))un=defUnit(p);return{p,un,k:mk(p.id,it.flavor||'',un),q:Math.min(9999,Math.max(minQty(p,un),Math.floor(+it.quantity)||1))}}
// adds only what is missing: the current cart is never replaced and existing lines keep their quantity
function addItems(items){let add=0,have=0,skip=0;const n=Object.assign({},cart);items.forEach(it=>{const r=itemKey(it);if(!r){skip++;return}if(n[r.k]){have++;return}n[r.k]=r.q;add++});if(add){cart=n;sv('ra_cart',cart);render()}return{add,have,skip}}
const addMsg=r=>!r.add?(r.have?'Already in your list':'Those products are no longer available'):'Added '+r.add+' item'+(r.add>1?'s':'')+' to your list'+(r.have?' ('+r.have+' already there)':'')+(r.skip?' ('+r.skip+' unavailable skipped)':'');
function reorder(id){const q=(D.q||[]).find(x=>String(x.id)===String(id));if(!q)return;const r=addItems((q.payload&&q.payload.items)||[]);toast(addMsg(r));if(r.add||r.have)go('/quote')}
// quote page: "From your past quotes" suggestions below the current list (signed-in only)
let pastLoading=false;
function paintPast(pg){if(!pg)return;const hosts=$$('[data-past]',pg);if(!hosts.length)return;
 if(!SESS||!AUTH_ON){hosts.forEach(h=>{h.hidden=true;h.innerHTML=''});return}
 if(D.q===null){if(!pastLoading){pastLoading=true;B.listQuotes().then(q=>{D.q=q||[]},()=>{D.q=[]}).then(()=>{pastLoading=false;if(state.page==='quote')paintPast($('#app>main:not([hidden])'))})}hosts.forEach(h=>{h.hidden=true});return}
 const qs=D.q.filter(q=>q.payload&&(q.payload.items||[]).length).slice(0,3);
 hosts.forEach(h=>{if(!qs.length){h.hidden=true;h.innerHTML='';return}h.hidden=false;
  h.innerHTML='<div class="rq-past-h"><b>Don\'t leave your first choices</b><span>From your past quotes. Add items to your list above. Your current list is never replaced.</span></div>'+qs.map(q=>{const p=q.payload,its=p.items;return '<div class="rq-pq"><div class="rq-pq-h"><div><b>'+esc(p.ref||String(q.id).slice(0,8))+'</b><span>'+esc(fdate(q.created_at))+' - '+esc(fb(+q.total_boxes||0))+' boxes</span></div><button type="button" class="rq-btn ghost aa-sm" data-aa="pq-add" data-id="'+esc(q.id)+'">Add these to my cart</button></div><ul>'
   +its.slice(0,6).map((it,i)=>'<li><span>'+esc(it.display_name||it.product||'Item')+(it.flavor?' - '+esc(it.flavor):'')+' <em>'+esc((it.quantity||it.boxes||'')+' '+(it.unit||'Box'))+'</em></span><button type="button" class="rq-pq-one" data-aa="pq-one" data-id="'+esc(q.id)+'" data-i="'+i+'" aria-label="Add '+esc(it.display_name||it.product||'item')+' to my cart">Add</button></li>').join('')+(its.length>6?'<li class="aa-more">and '+(its.length-6)+' more in this quote</li>':'')+'</ul></div>'}).join('')})}

// ---- views: sign-up, sign-in (+ forgot / reset), soon
function paintSignup(pg){paint(pg,s=>formSignup(s))}
function paintSignin(pg,view,next){const t={in:'Sign in',forgot:'Reset your password',recovery:'Choose a new password'}[view]||'Sign in';setH1(pg,t);
 if(view==='recovery'){const k=recovKind();
  if(k==='confirm'){doConfirmReturn();return}
  if(k==='confirmed'){RECOV='';setH1(pg,'Email confirmed');paint(pg,()=>msgCard('Email confirmed','Email confirmed, please sign in','Thank you. Your email is confirmed. Sign in to open your account.','<p><button type="button" class="rq-btn" data-aa="view" data-v="in">Sign in</button></p>'));return}
  if(k==='error'){RECOV='';setH1(pg,'Link expired');paint(pg,()=>msgCard('Link expired','This link is no longer valid','Links work once and expire after a while. For a password reset, request a new link. For a new account, sign in and we will offer to resend the confirmation email.','<p><button type="button" class="rq-btn" data-aa="view" data-v="forgot">Send a new reset link</button> <button type="button" class="rq-btn ghost" data-aa="view" data-v="in">Sign in</button></p>'));return}
  paint(pg,s=>formReset(s));return}
 paint(pg,s=>view==='forgot'?formForgot(s):formSignin(s,next))}
function soonState(pg){setH1(pg,state.page==='admin'?'Retailer accounts':state.page==='signup'?'Create your account':state.page==='account'?'Account':'Sign in');
 paint(pg,()=>'<div class="rq-card aa-card aa-msg aa-soon"><p class="rq-pill">Coming soon</p><h2 class="rq-h2">Accounts are opening soon</h2><p>Retailer accounts with a saved quote list and quote history are on the way. Until then you can browse the catalog and request a quote as a guest. It takes about a minute.</p><p><a class="rq-btn" href="/shop/quote">Get a quote</a> <a class="rq-btn ghost" href="/shop/c/all">Browse products</a></p></div>')}

// ---- dashboard
const D={q:null,p:null,edit:false,err:''};
function statusBadge(st){const ok=st==='approved';return '<span class="aa-badge '+(ok?'is-ok':'is-wait')+'"><i aria-hidden="true"></i>Account status: '+(ok?'Approved':'Pending review')+'</span>'}
function dashCart(){const ids=Object.keys(cart).filter(k=>byId(ck(k).id));if(!ids.length)return '<p class="rq-empty">Your saved cart is empty. Add products from the catalog and they will be saved here.</p><p><a class="rq-btn" href="/shop/c/all">Browse products</a></p>';
 return '<div class="aa-lines">'+ids.slice(0,12).map(k=>{const q=ck(k),p=byId(q.id);return '<div class="aa-line"><b>'+esc(strip(p))+'</b>'+(q.fl?'<span>Flavor: '+esc(q.fl)+'</span>':'')+'<em>'+esc(unitLine(p,q.un,cart[k]))+'</em></div>'}).join('')+(ids.length>12?'<p class="rq-note">and '+(ids.length-12)+' more</p>':'')+'</div>'
 +'<p class="rq-note" style="margin:10px 0 16px"><b>'+fb(boxes())+'</b> boxes in total</p><p><a class="rq-btn" href="/shop/quote">Review and request a quote</a></p>'}
function dashQuotes(){if(D.err==='q')return '<p class="rq-empty">We could not load your quote history right now. Please refresh in a moment.</p>';if(D.q===null)return '<p class="rq-empty">Loading your quotes...</p>';
 if(!D.q.length)return '<p class="rq-empty">No quote requests yet. When you send a quote while signed in, it is saved here so you can re-order in one tap.</p><p><a class="rq-btn ghost" href="/shop/c/all">Browse products</a></p>';
 return D.q.map(q=>{const p=q.payload||{},its=p.items||[],ref=p.ref||String(q.id).slice(0,8);return '<div class="aa-q"><div class="aa-q-h"><div><b>'+esc(ref)+'</b><span>'+esc(fdate(q.created_at))+' - '+esc(fb(+q.total_boxes||0))+' boxes</span></div><button type="button" class="rq-btn ghost aa-sm" data-aa="reorder" data-id="'+esc(q.id)+'">Re-order</button></div>'
  +'<ul class="aa-q-l">'+its.slice(0,5).map(it=>'<li>'+esc(it.display_name||it.product||'Item')+(it.flavor?' - '+esc(it.flavor):'')+' <em>'+esc((it.quantity||it.boxes||'')+' '+(it.unit||'Box'))+'</em></li>').join('')+(its.length>5?'<li class="aa-more">and '+(its.length-5)+' more</li>':'')+(its.length?'':'<li class="aa-more">Notes only</li>')+'</ul></div>'}).join('')}
function dashHTML(s){const p=PROF;if(!p)return '<p class="rq-empty">Loading your account...</p>';
 const row=(k,v)=>'<div><dt>'+k+'</dt><dd>'+(v||'<span class="aa-none">Not provided</span>')+'</dd></div>';
 const prof=D.edit?'<form class="aa-edit" data-af="profile" novalidate onsubmit="return false">'+profFields(s,p,'pr-')+'<p class="rq-note" style="margin:-4px 0 14px">Email: '+esc(p.email||SESS.user.email)+' (contact us to change it)</p><p class="rq-err aa-ferr" data-err role="alert"></p><div class="aa-btns"><button type="submit" class="rq-btn">Save changes</button><button type="button" class="rq-btn ghost" data-aa="edit-off">Cancel</button></div></form>'
  :'<dl class="aa-dl">'+row('Name',esc(p.name))+row('Shop',esc(p.shop))+row('Email',esc(p.email||SESS.user.email))+row('Phone',p.phone?'<a href="tel:+1'+us10(p.phone)+'">'+esc(p.phone)+'</a>':'')+row('WhatsApp',p.whatsapp?'<a href="'+esc(waLink(p.whatsapp))+'" target="_blank" rel="noopener">'+esc(p.whatsapp)+'</a>':'')+row('State',esc(p.state))+row('Payment preference',esc(p.payment_pref))+row('Looking for',esc(p.requirements))+'</dl><p style="margin-top:6px"><button type="button" class="rq-btn ghost aa-sm" data-aa="edit-on">Edit profile</button></p>';
 const note=p.status==='approved'?'Your account is approved. Request a quote any time and our team will connect with you.':'Our team is reviewing your account. You can browse and request quotes in the meantime, nothing is on hold.';
 return (WELCOME?'<div class="aa-welcome" role="status"><b>'+(WELCOME==='confirmed'?'Email confirmed. ':'')+'Welcome to Red Apple Distribution.</b> Your account is ready and we have your details.</div>':'')
 +'<div class="aa-top">'+statusBadge(p.status)+'<p class="aa-note">'+note+'</p></div>'
 +'<div class="rq-grid aa-dgrid"><div class="rq-card"><h2 class="rq-h2">Your profile</h2>'+prof+'</div><div class="rq-card"><h2 class="rq-h2">Saved cart</h2>'+dashCart()+'</div></div>'
 +'<div class="rq-card aa-hist"><h2 class="rq-h2">Quote history</h2>'+dashQuotes()+'</div>'
 +'<p class="aa-out"><button type="button" class="rq-btn ghost" data-aa="signout">Sign out</button></p>'}
function paintDash(pg){if(!pg||state.page!=='account')return;paint(pg,s=>dashHTML(s))}
async function loadDash(){const pg=$('#app>main:not([hidden])');paintDash(pg);
 const [,q]=await Promise.all([loadProfile(),B.listQuotes().catch(e=>{D.err='q';return null})]);
 if(!SESS)return;D.q=q||[];if(q)D.err='';paintDash($('#app>main:not([hidden])'));
 if(!PROF)paint($('#app>main:not([hidden])'),()=>'<div class="rq-card aa-card aa-msg"><h2 class="rq-h2">We are setting up your profile</h2><p>This can take a moment. Please refresh the page, or contact us if it keeps happening.</p><p><button type="button" class="rq-btn" data-aa="signout">Sign out</button></p></div>')}

// ---- admin approvals (UI check is cosmetic; the database policies decide)
const A={rows:null,q:'',f:'all',err:'',loading:false};
function admRows(){const q=A.q.toLowerCase();return (A.rows||[]).filter(r=>(A.f==='all'||r.status===A.f)&&(!q||[r.shop,r.name,r.email,r.phone,r.whatsapp,r.state,r.payment_pref,r.requirements].join(' ').toLowerCase().includes(q)))}
function admBody(){if(A.loading&&!A.rows)return '<p class="rq-empty">Loading accounts...</p>';if(A.err)return '<p class="rq-empty">'+esc(A.err)+'</p>';const rows=admRows();
 if(!rows.length)return '<p class="rq-empty">No accounts match.</p>';
 return '<div class="adm-wrap"><table class="adm-tbl"><thead><tr><th>Shop</th><th>Name</th><th>Email</th><th>Phone</th><th>WhatsApp</th><th>State</th><th>Payment</th><th>Looking for</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>'
 +rows.map(r=>{const ok=r.status==='approved',wa=waLink(r.whatsapp);return '<tr data-row="'+esc(r.id)+'"><td data-l="Shop"><b>'+esc(r.shop)+'</b></td><td data-l="Name">'+esc(r.name)+'</td><td data-l="Email"><a href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a></td>'
  +'<td data-l="Phone">'+(r.phone?'<a href="tel:+1'+us10(r.phone)+'">'+esc(r.phone)+'</a>':'-')+'</td><td data-l="WhatsApp">'+(wa?'<a href="'+esc(wa)+'" target="_blank" rel="noopener">'+esc(r.whatsapp)+'</a>':'-')+'</td><td data-l="State">'+esc(r.state||'-')+'</td><td data-l="Payment">'+esc(r.payment_pref||'-')+'</td>'
  +'<td data-l="Looking for" class="adm-req">'+esc(r.requirements||'-')+'</td><td data-l="Joined">'+esc(fdate(r.created_at))+'</td><td data-l="Status"><span class="aa-badge sm '+(ok?'is-ok':'is-wait')+'"><i aria-hidden="true"></i>'+(ok?'Approved':'Pending')+'</span></td>'
  +'<td class="adm-act"><button type="button" class="rq-btn aa-sm'+(ok?' ghost':'')+'" data-aa="adm-set" data-id="'+esc(r.id)+'" data-to="'+(ok?'pending':'approved')+'">'+(ok?'Revoke':'Approve')+'</button></td></tr>'}).join('')+'</tbody></table></div>'}
function admCount(){const r=A.rows||[];return r.length+' accounts, '+r.filter(x=>x.status!=='approved').length+' pending, showing '+admRows().length}
function admPaintBody(pg){$$('[data-adm-body]',pg).forEach(e=>{e.innerHTML=admBody()});$$('[data-adm-count]',pg).forEach(e=>{e.textContent=A.rows?admCount():''})}
function paintAdmin(pg){setH1(pg,'Retailer accounts');
 if(!SESS){paint(pg,s=>'<p class="rq-lead" style="margin-bottom:18px">Team sign-in.</p>'+formSignin(s,'admin'));return}
 if(!isAdmin()){paint(pg,()=>'<div class="rq-card aa-card aa-msg"><h2 class="rq-h2">Not authorised</h2><p>This account does not have access to this page.</p><p><button type="button" class="rq-btn ghost" data-aa="signout">Sign out</button></p></div>');return}
 paint(pg,s=>'<div class="adm-bar"><div class="rq-f"><label for="adm-q-'+s+'">Search</label><input class="rq-in" id="adm-q-'+s+'" type="search" data-aa-in="q" autocomplete="off" placeholder="Shop, name, email, phone, state" value="'+esc(A.q)+'"></div>'
  +'<div class="rq-f"><label for="adm-f-'+s+'">Show</label><select class="rq-sel" id="adm-f-'+s+'" data-aa-in="f">'+opt('all',A.f==='all','All')+opt('pending',A.f==='pending','Pending')+opt('approved',A.f==='approved','Approved')+'</select></div>'
  +'<div class="adm-tools"><button type="button" class="rq-btn ghost aa-sm" data-aa="adm-copy">Copy emails</button><button type="button" class="rq-btn ghost aa-sm" data-aa="adm-reload">Refresh</button><button type="button" class="rq-btn ghost aa-sm" data-aa="signout">Sign out</button></div></div>'
  +'<p class="aa-count" data-adm-count role="status"></p><div class="rq-card adm-card" data-adm-body></div>');
 admPaintBody(pg);if(!A.rows&&!A.loading)admLoad()}
async function admLoad(){const pg=$('#app>main:not([hidden])');A.loading=true;A.err='';admPaintBody(pg);
 try{A.rows=await B.listProfiles()}catch(e){A.rows=A.rows||null;A.err=emsg(e,'admin')}A.loading=false;admPaintBody($('#app>main:not([hidden])'))}
async function admSet(id,to,btn){const r=(A.rows||[]).find(x=>x.id===id);if(!r)return;const was=r.status;btn.disabled=true;r.status=to;admPaintBody($('#app>main:not([hidden])'));
 try{await B.setStatus(id,to);toast((to==='approved'?'Approved: ':'Revoked: ')+(r.shop||r.email))}catch(e){r.status=was;admPaintBody($('#app>main:not([hidden])'));toast(emsg(e,'admin'))}}
function copyText(t){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t).then(()=>true,()=>false);return new Promise(r=>{const x=document.createElement('textarea');x.value=t;x.setAttribute('readonly','');x.style.cssText='position:fixed;left:-9999px';document.body.appendChild(x);x.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}x.remove();r(ok)})}
document.addEventListener('input',e=>{const i=e.target.closest&&e.target.closest('[data-aa-in]');if(!i||state.page!=='admin')return;if(i.dataset.aaIn==='q')A.q=i.value;else A.f=i.value;const pg=$('#app>main:not([hidden])');$$('[data-aa-in='+i.dataset.aaIn+']',pg).forEach(x=>{if(x!==i)x.value=i.value});admPaintBody(pg)});
document.addEventListener('change',e=>{const i=e.target.closest&&e.target.closest('[data-aa-in=f]');if(i)i.dispatchEvent(new Event('input',{bubbles:true}))});
document.addEventListener('click',e=>{const a=e.target.closest('[data-aa]');if(!a)return;const k=a.dataset.aa,pg=a.closest('main');
 if(k==='view'){e.preventDefault();const v=a.dataset.v;paintSignin(pg,v,new URLSearchParams(location.search).get('next')||'')}
 else if(k==='signout')doSignOut();
 else if(k==='resend'){const em=a.dataset.email;if(coolLeft(em))return;a.disabled=true;B.resend(em).then(()=>{markResend(em);toast('Confirmation email sent');tickResend()},e=>{a.disabled=false;toast(emsg(e,'resend'))})}
 else if(k==='restart'){if(state.page==='signin')go('/account/signup');else{setH1(pg,'Create your account');paintSignup(pg)}}
 else if(k==='edit-on'){D.edit=true;paintDash(pg)}else if(k==='edit-off'){D.edit=false;paintDash(pg)}
 else if(k==='reorder')reorder(a.dataset.id);
 else if(k==='pq-add'||k==='pq-one'){const q=(D.q||[]).find(x=>String(x.id)===a.dataset.id);if(!q)return;const its=(q.payload&&q.payload.items)||[];toast(addMsg(addItems(k==='pq-one'?[its[+a.dataset.i]].filter(Boolean):its)))}
 else if(k==='adm-set')admSet(a.dataset.id,a.dataset.to,a);
 else if(k==='adm-reload'){A.rows=null;admLoad()}
 else if(k==='adm-copy'){const em=[...new Set(admRows().map(r=>r.email).filter(Boolean))];if(!em.length){toast('No emails to copy');return}copyText(em.join(', ')).then(ok=>toast(ok?'Copied '+em.length+' email'+(em.length>1?'s':''):'Could not copy. Select the emails manually.'))}});

// ---- route hook: returns true when it redirected (the caller stops)
function authRoute(){const p=state.page;closeMenus();acctNav();if(p!=='signin')RECOV='';if(p!=='account')WELCOME=false;
 if(!['signup','signin','account','admin'].includes(p)){quotePrompt($('#app>main:not([hidden])'));paintPast($('#app>main:not([hidden])'));return false}
 const pg=$('#app>main:not([hidden])'),nx=new URLSearchParams(location.search).get('next')||'';
 if(!AUTH_ON){soonState(pg);return false}
 if(p==='signup'){if(SESS){go(nextPath(nx)||'/account',true);return true}paintSignup(pg);return false}
 if(p==='signin'){if(RECOV){paintSignin(pg,'recovery');return false}if(SESS){go(nextPath(nx)||'/account',true);return true}paintSignin(pg,'in',nx);return false}
 if(p==='account'){if(!SESS){go('/account/signin?next=account',true);return true}D.edit=false;paintDash(pg);loadDash();return false}
 if(p==='admin'){paintAdmin(pg);return false}
 return false}

// ---- mobile menu (the hamburger had no menu): Shop, Brands, New, Trending, FAQ, Contact, Account
let mnN=0;
function closeMenus(){$$('.ra-mnav').forEach(n=>{n.hidden=true});$$('a[data-noop][aria-label=Menu]').forEach(b=>b.setAttribute('aria-expanded','false'))}
function mkMenu(b){const hd=b.parentElement;let n=$('.ra-mnav',hd);if(n)return n;n=document.createElement('nav');n.className='ra-mnav';n.id='ra-mnav-'+(++mnN);n.setAttribute('aria-label','Menu');n.hidden=true;
 n.innerHTML=[['/shop/c/all','Shop'],['/shop/brands','Brands'],['/shop/c/new','New arrivals'],['/shop/c/trending','Trending'],['/shop/faq','FAQ'],['/shop/contact','Contact']].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('')
  +'<a href="/shop/account/signin" data-ra-acct class="ra-mnav-acct">Sign in</a><a href="/shop/account/signup" data-ra-acct-cta class="ra-mnav-c">Create account</a><a href="/shop/quote" class="ra-mnav-q">Get a Quote</a>';
 hd.appendChild(n);b.setAttribute('aria-controls',n.id);return n}
document.addEventListener('click',e=>{const b=e.target.closest('a[data-noop][aria-label=Menu]');
 if(b){const n=mkMenu(b),open=n.hidden;closeMenus();if(open){n.hidden=false;b.setAttribute('aria-expanded','true');acctNav()}return}
 if(e.target.closest('.ra-mnav a')){closeMenus();return}
 if(!e.target.closest('.ra-mnav'))closeMenus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus();if(e.key===' '&&e.target.matches&&e.target.matches('a[data-noop][aria-label=Menu]')){e.preventDefault();e.target.click()}});

// ---- boot: signed-in visitors get their profile, saved cart and any unsent quote history on load
setTimeout(async()=>{acctNav();if(!(SESS&&AUTH_ON))return;await loadProfile();await pullMerge(false);flushQuotes(false);retryNotify();if(state.page==='quote')prefillQuote($('#app>main:not([hidden])'));quotePrompt($('#app>main:not([hidden])'))},0);
// init
$$('[data-faq-answer]').forEach(a=>a.classList.add('hidden'));
$$('a[href^="#"]').forEach(a=>{});
addEventListener('popstate',route);addEventListener('hashchange',route);addEventListener('resize',scale);try{history.scrollRestoration='manual'}catch(e){}
if(!ld('ra_age',false))setTimeout(()=>{const i=innerWidth<900?1:0;const w=$$('.agegate-wrap')[i];if(w){w.hidden=false}},1500);else $$('.agegate-wrap').forEach(x=>x.hidden=true);
$$('.agegate-wrap').forEach(x=>x.hidden=true);if(!ld('ra_age',false))setTimeout(()=>{const w=$$('.agegate-wrap')[innerWidth<900?1:0];if(w)w.hidden=false},1500);
fixUrl();route();
})();
