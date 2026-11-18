/* Red Apple Distribution - shop behaviour (one file for every shop page).
   Data logic (quote cart, units, 10 box minimum, forms, Supabase accounts, admin, quote summary) is carried over from the
   previous shop runtime. Presentation is new: pages are pre-rendered by tools/build_shop.py and this file enhances them. */
(function(){
'use strict';
const MAIN=()=>document.getElementById('main');
const THR={contact:20000,subscribe:20000,review:30000};
const P=window.PRODUCTS||[],PICKS=window.PICKS||{},AL=window.ALIASES||{},byId=id=>P.find(p=>p.id==id)||P.find(p=>p.id==AL[id]);
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
 const payload=lastSent=Object.assign({_subject:(SUBJ[type]||'New website lead')+' - Red Apple Distribution',_template:'table',_captcha:'false',_honey:'',type,site:'redappledistribution.com',submitted_at:new Date().toISOString()},data,type==='quote'?acctInfo():{});
 if(CFG.endpoint){try{const r=await fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});if(!r.ok)return false;const j=await r.json().catch(()=>null);return !!j&&(j.success===true||j.success==='true')}catch(e){return false}}
 const q=ld('ra_outbox',[]);q.push(payload);sv('ra_outbox',q);return true}
// simple client throttle for contact, subscribe and review (the server-side honeypot is the _honey field)
function throttled(kind){const k='ra_thr_'+kind,now=Date.now();let last=0;try{last=+localStorage.getItem(k)||0}catch(e){}if(now-last<(THR[kind]||0))return true;try{localStorage.setItem(k,String(now))}catch(e){}return false}
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
function toast(t){const e=document.createElement('div');e.className='toast';e.setAttribute('role','status');e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}
function add(id,n){cart[id]=(cart[id]||0)+n;if(cart[id]<1)delete cart[id];sv('ra_cart',cart);refresh()}
function slugOf(p){return Object.keys(CATS).find(k=>CATS[k]===p.c)}
function list(slug,q){let l;if(slug==='all')l=P;else if(slug==='new'||slug==='trending')l=(PICKS[slug]||[]).map(byId).filter(Boolean);else l=P.filter(p=>slugOf(p)===slug);if(q){q=q.toLowerCase();l=P.filter(p=>(p.n+' | '+p.b+' | '+(p.dn||'')+' | '+p.b+' '+(p.dn||'')).replace(/[\u2013\u2014]/g,'-').toLowerCase().includes(q))}return l}
const flList=p=>{const seen={},o=[];((p&&p.f)||[]).forEach(f=>{const n=String(f).trim(),k=n.toLowerCase();if(n&&!seen[k]){seen[k]=1;o.push(n)}});return o};
const flImg=(p,n)=>{const m=(window.FLAVOR_IMAGES||{})[p.id];return(m&&m[n])||''};
const reduceMo=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
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
function qMin(pg,n){const t=Math.round(n*10)/10;$$('[data-f=q-bar]',pg).forEach(e=>{e.style.width=Math.min(100,t/MINB*100)+'%'});$$('[data-qmin]',pg).forEach(e=>{e.classList.toggle('is-ok',t>=MINB);e.setAttribute('data-n',String(t))});
 $$('[data-f=q-minmsg]',pg).forEach(e=>{if(t>=MINB){e.textContent='Minimum reached.';e.className='rq-min-msg ok'}else if(t>0){const m=Math.round((MINB-t)*10)/10;e.textContent='Add '+fb(m)+' more '+bw(m)+' to reach the 10-box minimum. You can still send a smaller quote.';e.className='rq-min-msg warn'}else{e.textContent='Minimum order: 10 boxes across your quote. Smaller quotes can still be requested.';e.className='rq-min-msg'}})}
const prodDesc2=p=>{const fl=flList(p),f=(p.df||[]).slice();if(p.ppb>0)f.push(p.ppb+' pieces per box');if(fl.length)f.push(fl.length+(fl.length===1?' flavor':' flavors')+' to choose from');
 return strip(p)+(bd(p)?' from '+bd(p):'')+', in our '+p.c+' range.'+(f.length?' Details: '+dList(f)+'.':'')+(p.nt&&p.nt.length?' '+p.nt.map(x=>x+'.').join(' '):'')+' Wholesale for US retailers, 21+ only. Get a quote for bulk terms.'};
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
 async listAllQuotes(){return authed('/rest/v1/quotes?select=id,share_token,replied_at,created_at,total_boxes,payload,user_id&order=created_at.desc&limit=500')},
 async markReplied(id){const r=await authed('/rest/v1/quotes?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=representation'},body:{replied_at:new Date().toISOString()}});if(!r||!r.length)throw new AErr('not allowed','42501',403);return r[0]},
 async getSummary(t){return raw('/rest/v1/rpc/get_quote_summary',{method:'POST',body:{t}})},
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
 async saveQuote(payload,total){await W();need();const d=L(),q={id:'q-'+Math.random().toString(36).slice(2,10),user_id:SESS.user.id,payload:JSON.parse(JSON.stringify(payload)),total_boxes:total,created_at:new Date().toISOString(),share_token:Array.from({length:24},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join(''),replied_at:null};d.quotes.push(q);S(d);return q},
 async listAllQuotes(){await W();adm();return L().quotes.slice().sort((a,b)=>b.created_at<a.created_at?-1:1)},
 async markReplied(id){await W();adm();const d=L(),q=d.quotes.find(x=>x.id===id);if(!q)throw new AErr('not found','404',404);q.replied_at=new Date().toISOString();S(d);return Object.assign({},q)},
 async getSummary(t){await W();const d=L(),q=d.quotes.find(x=>x.share_token&&x.share_token===t&&x.replied_at);if(!q)return null;const u=byId_(d,q.user_id),pl=q.payload||{};return{ref:pl.ref,shop:(u&&u.profile.shop)||'',replied_at:q.replied_at,items:pl.items||[]}},
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
const sfxOf=()=>'p';
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
 +'<p class="rq-note aa-consent">By creating an account you agree to how we use your details as described on our <a href="/shop/privacy/">Privacy page</a>. We never ask for card or bank numbers, and nothing is charged on this website.</p>'
 +'<p class="rq-note aa-alt">Already have an account? <a href="/shop/account/signin/">Sign in</a></p></form>'}
function formSignin(s,next){const I=n=>'si-'+n+'-'+s;
 return '<form class="rq-card aa-card aa-narrow" data-af="signin"'+(next?' data-next="'+esc(next)+'"':'')+' novalidate onsubmit="return false"><h2 class="rq-h2">Welcome back</h2>'
 +fld({id:I('email'),n:'email',t:'email',l:'Email',ac:'username',inm:'email',req:1,ph:'you@yourshop.com',max:160})
 +fld({id:I('pw'),n:'password',t:'password',l:'Password',ac:'current-password',req:1})
 +HP+'<p class="rq-err aa-ferr" data-err role="alert"></p><button type="submit" class="rq-btn full">Sign in</button>'
 +'<p class="rq-note aa-alt"><button type="button" class="aa-link" data-aa="view" data-v="forgot">Forgot password?</button></p>'
 +'<p class="rq-note aa-alt">New here? <a href="/shop/account/signup'+(next&&nextPath(next)?'?next='+encodeURIComponent(next):'')+'">Create an account</a> or <a href="/shop/quote/">request a quote as a guest</a>.</p></form>'}
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
 render();if(state.page==='account')paintDash(MAIN())}
addEventListener('pagehide',()=>{if(cDirty)pushCart(true)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&cDirty)pushCart(true)});

// ---- profile, header link, prompts, quote prefill and save
async function loadProfile(){if(!SESS)return null;try{PROF=await B.getProfile()}catch(e){if(e.code==='signed_out')PROF=null}
 if(PROF)rememberName();if(PROF&&state.page==='quote')prefillQuote(MAIN());return PROF}
function acctNav(){const on=!!SESS,n=on?String(localStorage.getItem('ra_auth_name')||''):'';$$('a[data-ra-acct]').forEach(a=>{a.textContent=on?'My account'+(n?' - '+n:''):'Sign in';a.setAttribute('href',on?'/shop/account/':'/shop/account/signin/')});$$('[data-ra-acct-cta]').forEach(e=>{e.hidden=on});const em=on?String(SESS.user.email||'').toLowerCase():'',staff=/@(redappledistro|redappledistribution)\.com$/.test(em);$$('a[data-ra-acct]').forEach(a=>{let x=a.parentNode.querySelector('[data-ra-admin]');if(staff&&!x){x=document.createElement('a');x.className='nav__acct-btn btn btn--line btn--sm';x.setAttribute('data-ra-admin','');x.href='/shop/admin/';x.textContent='Admin dashboard';a.insertAdjacentElement('afterend',x)}else if(!staff&&x)x.remove()});$$('[data-acct-line]').forEach(e=>{e.hidden=!AUTH_ON||on})}
function rememberName(){try{const p=PROF;if(!SESS||!p)return;const f=String(p.name||'').trim().split(/\s+/)[0]||String(p.shop||'').trim();localStorage.setItem('ra_auth_name',f.slice(0,14))}catch(e){}acctNav()}
function acctInfo(){return SESS?{account:'signed in',account_email:SESS.user.email,account_status:(PROF&&PROF.status)||'pending'}:{}}
function prefillQuote(pg){if(!SESS||!PROF||!pg)return;$$('form[data-form=quote]',pg).forEach(f=>{if(f.dataset.pf===PROF.id)return;f.dataset.pf=PROF.id;const set=(n,v)=>{const i=$('[name='+n+']',f);if(i&&v&&!i.value)i.value=v};set('shop',PROF.shop);set('contact',PROF.name);set('email',PROF.email||SESS.user.email);set('whatsapp',PROF.whatsapp||PROF.phone);set('state',PROF.state)})}
function clearQuoteForms(){$$('form[data-form=quote]').forEach(f=>{if(!f.dataset.pf)return;delete f.dataset.pf;['shop','contact','email','whatsapp','state'].forEach(n=>{const i=$('[name='+n+']',f);if(i)i.value=''})})}
function quotePrompt(pg){$$('[data-acct-prompt]',pg).forEach(e=>{if(!AUTH_ON){e.hidden=true;return}e.hidden=false;
 e.innerHTML=SESS?'Signed in as <b>'+esc(SESS.user.email)+'</b>. Your details are filled in and this quote will be saved to your account.':'Have an account? <a href="/shop/account/signin/?next=quote">Sign in</a> or <a href="/shop/account/signup/?next=quote">create an account</a> to save your cart. Accounts are optional.'})}
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
async function doConfirmReturn(){const pg=MAIN(),hp=new URLSearchParams(RECOV.replace(/^#/,''));setH1(pg,'Confirming your email');paint(pg,()=>msgCard('One moment','Confirming your email','Signing you in...'));
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
  if(r.confirm){sv('ra_signup_pending',{email});markResend(email);busy(f,false);paintConfirm(MAIN(),email,true);return}
  WELCOME=true;PROF=null;notifySignup(Object.assign({id:SESS.user.id,email,status:'pending',email_confirmed:'no (confirmation is off)'},meta));
  await afterSignIn(f,true)}
 catch(e){busy(f,false);ferr(f,emsg(e,'signup'));if(e.code==='user_already_exists')focusBad(f,'email')}}
async function doSignin(f){const v=rd(f);if(v.hp_check)return;const bad=chk(f,['email','password'],v);if(bad.length){ferr(f,'Please enter your email and password.');focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Signing in...');
 try{await B.signIn(v.email.toLowerCase(),v.password);await afterSignIn(f,false)}catch(e){busy(f,false);if(e.code==='email_not_confirmed'||/not confirmed/i.test(e.message||'')){paintConfirm(MAIN(),v.email.toLowerCase(),false);return}ferr(f,emsg(e,'signin'));const p=$('[name=password]',f);if(p){p.value='';p.focus()}}}
async function doForgot(f){const v=rd(f);if(v.hp_check)return;const bad=chk(f,['email'],v);if(bad.length){focusBad(f,bad[0]);return}
 ferr(f,'');busy(f,true,'Sending...');
 try{await B.recover(v.email.toLowerCase());const pg=MAIN();setH1(pg,'Check your email');paint(pg,()=>msgCard('Reset link sent','Check your email','If an account exists for <b>'+esc(v.email)+'</b>, a link to choose a new password is on its way. It can take a minute to arrive. Check your spam folder too.','<p><button type="button" class="rq-btn ghost" data-aa="view" data-v="in">Back to sign in</button></p>'))}
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
  const p=await B.updateProfile(meta);PROF=Object.assign({},PROF||{},p||meta);D.edit=false;paintDash(MAIN());toast('Profile saved')}
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
 if(D.q===null){if(!pastLoading){pastLoading=true;B.listQuotes().then(q=>{D.q=q||[]},()=>{D.q=[]}).then(()=>{pastLoading=false;if(state.page==='quote')paintPast(MAIN())})}hosts.forEach(h=>{h.hidden=true});return}
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
 paint(pg,()=>'<div class="rq-card aa-card aa-msg aa-soon"><p class="rq-pill">Coming soon</p><h2 class="rq-h2">Accounts are opening soon</h2><p>Retailer accounts with a saved quote list and quote history are on the way. Until then you can browse the catalog and request a quote as a guest. It takes about a minute.</p><p><a class="rq-btn" href="/shop/quote/">Get a quote</a> <a class="rq-btn ghost" href="/shop/c/all/">Browse products</a></p></div>')}

// ---- dashboard
const D={q:null,p:null,edit:false,err:''};
function statusBadge(st){const ok=st==='approved';return '<span class="aa-badge '+(ok?'is-ok':'is-wait')+'"><i aria-hidden="true"></i>Account status: '+(ok?'Approved':'Pending review')+'</span>'}
function dashCart(){const ids=Object.keys(cart).filter(k=>byId(ck(k).id));if(!ids.length)return '<p class="rq-empty">Your saved cart is empty. Add products from the catalog and they will be saved here.</p><p><a class="rq-btn" href="/shop/c/all/">Browse products</a></p>';
 return '<div class="aa-lines">'+ids.slice(0,12).map(k=>{const q=ck(k),p=byId(q.id);return '<div class="aa-line"><b>'+esc(strip(p))+'</b>'+(q.fl?'<span>Flavor: '+esc(q.fl)+'</span>':'')+'<em>'+esc(unitLine(p,q.un,cart[k]))+'</em></div>'}).join('')+(ids.length>12?'<p class="rq-note">and '+(ids.length-12)+' more</p>':'')+'</div>'
 +'<p class="rq-note" style="margin:10px 0 16px"><b>'+fb(boxes())+'</b> boxes in total</p><p><a class="rq-btn" href="/shop/quote/">Review and request a quote</a></p>'}
function dashQuotes(){if(D.err==='q')return '<p class="rq-empty">We could not load your quote history right now. Please refresh in a moment.</p>';if(D.q===null)return '<p class="rq-empty">Loading your quotes...</p>';
 if(!D.q.length)return '<p class="rq-empty">No quote requests yet. When you send a quote while signed in, it is saved here so you can re-order in one tap.</p><p><a class="rq-btn ghost" href="/shop/c/all/">Browse products</a></p>';
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
async function loadDash(){const pg=MAIN();paintDash(pg);
 const [,q]=await Promise.all([loadProfile(),B.listQuotes().catch(e=>{D.err='q';return null})]);
 if(!SESS)return;D.q=q||[];if(q)D.err='';paintDash(MAIN());
 if(!PROF)paint(MAIN(),()=>'<div class="rq-card aa-card aa-msg"><h2 class="rq-h2">We are setting up your profile</h2><p>This can take a moment. Please refresh the page, or contact us if it keeps happening.</p><p><button type="button" class="rq-btn" data-aa="signout">Sign out</button></p></div>')}

// ---- admin approvals (UI check is cosmetic; the database policies decide)
const A={rows:null,q:'',f:'all',err:'',loading:false,tab:'accounts',quotes:null,qerr:'',qloading:false,qq:'',qf:'all',qOpen:''};
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
const ADMTAB=s=>'<div class="adm-tabs" role="tablist" aria-label="Admin sections"><button type="button" role="tab" class="adm-tab'+(A.tab==='accounts'?' on':'')+'" aria-selected="'+(A.tab==='accounts')+'" data-aa="adm-tab" data-tab="accounts">Accounts</button><button type="button" role="tab" class="adm-tab'+(A.tab==='quotes'?' on':'')+'" aria-selected="'+(A.tab==='quotes')+'" data-aa="adm-tab" data-tab="quotes">Quotes</button></div>';
function paintAdmin(pg){setH1(pg,'Retailer accounts');
 if(!SESS){paint(pg,s=>'<p class="rq-lead" style="margin-bottom:18px">Team sign-in.</p>'+formSignin(s,'admin'));return}
 if(!isAdmin()){paint(pg,()=>'<div class="rq-card aa-card aa-msg"><h2 class="rq-h2">Not authorised</h2><p>This account does not have access to this page.</p><p><button type="button" class="rq-btn ghost" data-aa="signout">Sign out</button></p></div>');return}
 if(A.tab==='quotes'){setH1(pg,'Quotes');
  paint(pg,s=>ADMTAB(s)+'<div class="adm-bar"><div class="rq-f"><label for="adm-qq-'+s+'">Search</label><input class="rq-in" id="adm-qq-'+s+'" type="search" data-aa-in="qq" autocomplete="off" placeholder="Shop, quote ref, email" value="'+esc(A.qq)+'"></div>'
   +'<div class="rq-f"><label for="adm-qf-'+s+'">Show</label><select class="rq-sel" id="adm-qf-'+s+'" data-aa-in="qf">'+opt('all',A.qf==='all','All')+opt('awaiting',A.qf==='awaiting','Awaiting reply')+opt('replied',A.qf==='replied','Replied')+'</select></div>'
   +'<div class="adm-tools"><button type="button" class="rq-btn ghost aa-sm" data-aa="adm-qreload">Refresh</button><button type="button" class="rq-btn ghost aa-sm" data-aa="signout">Sign out</button></div></div>'
   +'<p class="aa-count" data-adm-qcount role="status"></p><div data-adm-qpanel></div><div class="rq-card adm-card" data-adm-qbody></div>');
  admPaintQ(pg,true);if(!A.quotes&&!A.qloading)admQLoad();return}
 paint(pg,s=>ADMTAB(s)+'<div class="adm-bar"><div class="rq-f"><label for="adm-q-'+s+'">Search</label><input class="rq-in" id="adm-q-'+s+'" type="search" data-aa-in="q" autocomplete="off" placeholder="Shop, name, email, phone, state" value="'+esc(A.q)+'"></div>'
  +'<div class="rq-f"><label for="adm-f-'+s+'">Show</label><select class="rq-sel" id="adm-f-'+s+'" data-aa-in="f">'+opt('all',A.f==='all','All')+opt('pending',A.f==='pending','Pending')+opt('approved',A.f==='approved','Approved')+'</select></div>'
  +'<div class="adm-tools"><button type="button" class="rq-btn ghost aa-sm" data-aa="adm-copy">Copy emails</button><button type="button" class="rq-btn ghost aa-sm" data-aa="adm-reload">Refresh</button><button type="button" class="rq-btn ghost aa-sm" data-aa="signout">Sign out</button></div></div>'
  +'<p class="aa-count" data-adm-count role="status"></p><div class="rq-card adm-card" data-adm-body></div>');
 admPaintBody(pg);if(!A.rows&&!A.loading)admLoad()}
// ---- quotes: list, mark as replied (sets replied_at), summary link and email drafts. No email is sent from here.
const QR_TPL="<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"color-scheme\" content=\"dark\"><meta name=\"supported-color-schemes\" content=\"dark\"><title>Your quote is ready<\/title><\/head>\n<body style=\"margin:0;padding:0;background:#790B13\">\n<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:#790B13\">Your quote summary is ready. Tap to watch your products appear one by one.<\/div>\n<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#790B13\"><tr><td align=\"center\" style=\"padding:28px 12px\">\n<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;background:#5A080E;border:1px solid #2a2a2e;border-radius:20px;overflow:hidden\">\n<tr><td style=\"background:#E9CFAF;padding:9px 16px;text-align:center;font:700 11px Arial,sans-serif;letter-spacing:2px;color:#FFF0DC\">ADULTS 21+ ONLY &nbsp;&bull;&nbsp; WHOLESALE FOR US RETAILERS<\/td><\/tr>\n<tr><td align=\"center\" style=\"padding:34px 40px 8px;background:#101012\"><img src=\"https://redappledistribution.com/shop/assets/email-logo.png\" width=\"200\" alt=\"Red Apple Distribution\" style=\"display:block;border:0;height:auto;width:200px;max-width:100%\"><\/td><\/tr>\n<tr><td align=\"center\" style=\"padding:0;background:#101012\"><a href=\"{{LINK}}\" style=\"display:block;text-decoration:none\"><img src=\"https://redappledistribution.com/shop/assets/quote-teaser.gif\" width=\"600\" alt=\"Your quote is ready. Open your quote summary to see your products.\" style=\"display:block;border:0;height:auto;width:100%;max-width:600px\"><\/a><\/td><\/tr>\n<tr><td style=\"padding:26px 40px 0\"><p style=\"margin:0 0 10px;font:700 11px Arial,sans-serif;letter-spacing:3px;color:#E9CFAF;text-transform:uppercase\">Wholesale quote<\/p>\n<h1 style=\"margin:0 0 16px;font:400 38px/1.05 Impact,'Arial Narrow Bold','Arial Black',Arial,sans-serif;letter-spacing:.5px;color:#FFF0DC;text-transform:uppercase\">Your quote is ready<\/h1>\n<p style=\"margin:0 0 14px;font:400 16px/1.6 Arial,sans-serif;color:#F3E4CE\">Hi {{SHOP}}, our team has replied to your quote request with pricing. We also put together a short summary of the products you asked for. Tap the button to watch it play, one product at a time.<\/p>\n<p style=\"margin:0 0 26px;font:400 14px/1.6 Arial,sans-serif;color:#E6D2BA\">The summary shows product names and quantities only. Please use our reply for the pricing.<\/p><\/td><\/tr>\n<tr><td align=\"center\" style=\"padding:0 40px 28px\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" bgcolor=\"#E9CFAF\" style=\"border-radius:30px;background:linear-gradient(90deg,#E9CFAF,#E9CFAF)\"><a href=\"{{LINK}}\" style=\"display:inline-block;padding:17px 40px;font:700 16px Arial,sans-serif;color:#FFF0DC;text-decoration:none;border-radius:30px\">View my quote summary<\/a><\/td><\/tr><\/table><\/td><\/tr>\n<tr><td style=\"padding:8px 40px 4px\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#1a0a0b;border:1px solid #3a1416;border-radius:14px\"><tr><td style=\"padding:20px 24px\"><p style=\"margin:0 0 8px;font:700 11px Arial,sans-serif;letter-spacing:2px;color:#E9CFAF;text-transform:uppercase\">Next step<\/p><p style=\"margin:0;font:400 14px/1.6 Arial,sans-serif;color:#d9d9dc\">Reply to this email, or message us on WhatsApp at +1 (502) 616-3671, and we will take it from there.<\/p><\/td><\/tr><\/table><\/td><\/tr>\n<tr><td style=\"padding:22px 40px 8px\"><p style=\"margin:0;font:400 12px/1.6 Arial,sans-serif;color:#D4BFA6\">Button not working? Paste this link into your browser:<br><a href=\"{{LINK}}\" style=\"color:#E9CFAF;word-break:break-all\">{{LINK}}<\/a><\/p><\/td><\/tr>\n<tr><td style=\"padding:22px 40px 30px\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-top:1px solid #2a2a2e\"><tr><td style=\"padding-top:18px;font:400 12px/1.7 Arial,sans-serif;color:#D4BFA6\"><strong style=\"color:#d9d9dc\">Red Apple Distribution<\/strong> &nbsp;|&nbsp; Wholesale for US smoke shops<br>Quotes in about a minute &nbsp;|&nbsp; <a href=\"https://redappledistribution.com/shop/\" style=\"color:#E9CFAF;text-decoration:none\">redappledistribution.com<\/a> &nbsp;|&nbsp; <a href=\"mailto:sales@redappledistro.com\" style=\"color:#E9CFAF;text-decoration:none\">sales@redappledistro.com<\/a> &nbsp;|&nbsp; (347) 937-9103<\/td><\/tr><\/table><\/td><\/tr>\n<\/table><\/td><\/tr><\/table><\/body><\/html>\n";
const SUMMARY_ORIGIN=()=>(MOCK||LOCALH)?location.origin:'https://redappledistribution.com';
function qRows(){const pr={};(A.rows||[]).forEach(x=>{pr[x.id]=x});return (A.quotes||[]).map(q=>{const p=pr[q.user_id]||{},pl=q.payload||{};
 return{id:q.id,tok:q.share_token||'',replied:q.replied_at||'',created:q.created_at,boxes:+q.total_boxes||0,ref:String(pl.ref||String(q.id).slice(0,8)),shop:p.shop||pl.shop||'',name:p.name||pl.contact||'',email:p.email||pl.email||''}})}
function qFiltered(){const k=A.qq.toLowerCase();return qRows().filter(r=>(A.qf==='all'||(A.qf==='replied')===!!r.replied)&&(!k||[r.shop,r.ref,r.email,r.name].join(' ').toLowerCase().includes(k)))}
const qLink=r=>SUMMARY_ORIGIN()+'/shop/quote-summary/?t='+encodeURIComponent(r.tok);
function qDraft(r){const first=String(r.name||'').trim().split(/\s+/)[0],link=qLink(r);
 const subject='Your Red Apple quote is ready - '+r.ref;
 const body=['Hi '+(first||'there')+',','','Thank you for your quote request '+r.ref+'. We have replied with your pricing, and we put together a short summary of the products you asked for.','',
  'Open your quote summary: '+link,'','It opens as a short teaser animation: your shop name and each product with its quantity appear one by one. It shows product names and quantities only, so please use our reply for the pricing.','',
  'Reply to this email or message us on WhatsApp at +1 (502) 616-3671 and we will take it from there.','','Thank you,','Red Apple Distribution Sales','sales@redappledistro.com | (347) 937-9103'].join('\n');
 return{subject,body,link}}
function qPrevBody(h){try{const d=new DOMParser().parseFromString(h,'text/html');d.querySelectorAll('script,iframe,link,style,meta,title,base,object,embed,form').forEach(n=>n.remove());d.querySelectorAll('a').forEach(a=>{a.removeAttribute('href');a.removeAttribute('target')});d.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(at=>{if(/^on/i.test(at.name))n.removeAttribute(at.name)})});return d.body.innerHTML}catch(e){return ''}}
function qHtml(r){const sh=r.shop||'there';return QR_TPL.split('{{SHOP}}').join(esc(sh)).split('{{LINK}}').join(qLink(r))}
function qBody(){if(A.qloading&&!A.quotes)return '<p class="rq-empty">Loading quotes...</p>';if(A.qerr)return '<p class="rq-empty">'+esc(A.qerr)+'</p>';const rows=qFiltered();
 if(!rows.length)return '<p class="rq-empty">No quotes match.</p>';
 return '<div class="adm-wrap"><table class="adm-tbl adm-qt"><thead><tr><th>Shop</th><th>Quote ref</th><th>Date</th><th>Boxes</th><th>Status</th><th></th></tr></thead><tbody>'
 +rows.map(r=>'<tr data-qrow="'+esc(r.id)+'"><td data-l="Shop"><b>'+esc(r.shop||'-')+'</b>'+(r.email?'<span class="adm-sub">'+esc(r.email)+'</span>':'')+'</td><td data-l="Quote ref">'+esc(r.ref)+'</td><td data-l="Date">'+esc(fdate(r.created))+'</td><td data-l="Boxes">'+esc(fb(r.boxes))+'</td>'
  +'<td data-l="Status"><span class="aa-badge sm '+(r.replied?'is-ok':'is-wait')+'"><i aria-hidden="true"></i>'+(r.replied?'Replied':'Awaiting reply')+'</span>'+(r.replied?'<span class="adm-sub">'+esc(fdate(r.replied))+'</span>':'')+'</td>'
  +'<td class="adm-act">'+(r.replied?'<button type="button" class="rq-btn aa-sm" data-aa="q-copylink" data-id="'+esc(r.id)+'">Copy link</button> <button type="button" class="rq-btn ghost aa-sm" data-aa="q-open" data-id="'+esc(r.id)+'">Email draft</button>'
   :'<button type="button" class="rq-btn aa-sm" data-aa="q-reply" data-id="'+esc(r.id)+'">Mark as replied and get summary</button>')+'</td></tr>').join('')+'</tbody></table></div>'}
function qPanel(s){const r=qRows().find(x=>x.id===A.qOpen);if(!r||!r.replied)return '';const d=qDraft(r),mt=r.email?'mailto:'+encodeURIComponent(r.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(d.subject)+'&body='+encodeURIComponent(d.body.replace(/\n/g,'\r\n')):'';
 const prev=qHtml(r).split('https://redappledistribution.com/shop/assets/quote-teaser.gif').join('/shop/assets/quote-teaser.gif');
 return '<div class="rq-card qp" data-qp="'+esc(r.id)+'"><div class="qp-h"><div><p class="rq-pill">Summary ready</p><h2 class="rq-h2">'+esc(r.shop||'Retailer')+' - '+esc(r.ref)+'</h2></div><button type="button" class="rq-btn ghost aa-sm" data-aa="q-close">Close</button></div>'
 +'<p class="rq-note qp-warn">Send this only after you have replied to the retailer with pricing. The summary page shows product names and quantities only, never prices or contact details.</p>'
 +'<div class="rq-f"><label for="qp-l-'+s+'">Summary link</label><div class="qp-row"><input class="rq-in" id="qp-l-'+s+'" readonly value="'+esc(d.link)+'" data-qp-link><button type="button" class="rq-btn aa-sm" data-aa="q-copylink" data-id="'+esc(r.id)+'">Copy link</button></div></div>'
 +'<div class="rq-f"><label for="qp-s-'+s+'">Email subject</label><input class="rq-in" id="qp-s-'+s+'" readonly value="'+esc(d.subject)+'"></div>'
 +'<div class="rq-f"><label for="qp-b-'+s+'">Email draft</label><textarea class="rq-ta qp-ta" id="qp-b-'+s+'" readonly rows="15">'+esc(d.body)+'</textarea></div>'
 +'<div class="aa-btns"><button type="button" class="rq-btn aa-sm" data-aa="q-copyemail" data-id="'+esc(r.id)+'">Copy email</button>'+(mt?'<a class="rq-btn ghost aa-sm" data-qp-mailto href="'+esc(mt)+'">Open in email app</a>':'<span class="rq-note">No email on file for this retailer.</span>')+'</div>'
 +'<h3 class="qp-h3">Branded HTML email</h3><p class="rq-note">The plain text above works in any mail client. For the animated teaser version, paste this HTML into a mail client or email tool that supports HTML. The teaser GIF is hosted at redappledistribution.com. Nothing is sent from this page.</p>'
 +'<div class="qp-prev" role="img" aria-label="HTML email preview">'+qPrevBody(prev)+'</div><div class="aa-btns"><button type="button" class="rq-btn ghost aa-sm" data-aa="q-copyhtml" data-id="'+esc(r.id)+'">Copy HTML</button></div></div>'}
function admPaintQ(pg,panel){$$('[data-adm-qbody]',pg).forEach(e=>{e.innerHTML=qBody()});$$('[data-adm-qcount]',pg).forEach(e=>{const r=qRows();e.textContent=A.quotes?r.length+' quotes, '+r.filter(x=>!x.replied).length+' awaiting reply, showing '+qFiltered().length:''});
 if(panel)$$('[data-adm-qpanel]',pg).forEach(e=>{e.innerHTML=qPanel(sfxOf(e))})}
async function admQLoad(){const pg=MAIN();A.qloading=true;A.qerr='';admPaintQ(pg);
 const [q,pr]=await Promise.all([B.listAllQuotes().then(x=>({x}),e=>({e})),A.rows?Promise.resolve(A.rows):B.listProfiles().catch(()=>null)]);
 if(pr)A.rows=pr;if(q.e){A.qerr=emsg(q.e,'admin');A.quotes=A.quotes||null}else A.quotes=q.x||[];A.qloading=false;if(A.tab==='quotes')admPaintQ(MAIN(),true)}
async function qReply(id,btn){const r=qRows().find(x=>x.id===id);if(!r)return;if(!r.tok){toast('This quote has no summary link yet');return}btn.disabled=true;
 try{const u=await B.markReplied(id),q=A.quotes.find(x=>x.id===id);q.replied_at=(u&&u.replied_at)||new Date().toISOString();A.qOpen=id;const pg=MAIN();admPaintQ(pg,true);toast('Marked as replied: '+(r.shop||r.ref));
  const el=$$('[data-adm-qpanel] .qp',pg).find(e=>e.offsetParent!==null);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
 catch(e){btn.disabled=false;toast(emsg(e,'admin'))}}
async function admLoad(){const pg=MAIN();A.loading=true;A.err='';admPaintBody(pg);
 try{A.rows=await B.listProfiles()}catch(e){A.rows=A.rows||null;A.err=emsg(e,'admin')}A.loading=false;admPaintBody(MAIN())}
async function admSet(id,to,btn){const r=(A.rows||[]).find(x=>x.id===id);if(!r)return;const was=r.status;btn.disabled=true;r.status=to;admPaintBody(MAIN());
 try{await B.setStatus(id,to);toast((to==='approved'?'Approved: ':'Revoked: ')+(r.shop||r.email))}catch(e){r.status=was;admPaintBody(MAIN());toast(emsg(e,'admin'))}}
function copyText(t){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t).then(()=>true,()=>false);return new Promise(r=>{const x=document.createElement('textarea');x.value=t;x.setAttribute('readonly','');x.style.cssText='position:fixed;left:-9999px';document.body.appendChild(x);x.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}x.remove();r(ok)})}
document.addEventListener('input',e=>{const i=e.target.closest&&e.target.closest('[data-aa-in]');if(!i||state.page!=='admin')return;const k=i.dataset.aaIn;if(k==='q')A.q=i.value;else if(k==='f')A.f=i.value;else if(k==='qq')A.qq=i.value;else if(k==='qf')A.qf=i.value;const pg=MAIN();$$('[data-aa-in='+k+']',pg).forEach(x=>{if(x!==i)x.value=i.value});if(k==='qq'||k==='qf')admPaintQ(pg);else admPaintBody(pg)});
document.addEventListener('change',e=>{const i=e.target.closest&&e.target.closest('[data-aa-in=f],[data-aa-in=qf]');if(i)i.dispatchEvent(new Event('input',{bubbles:true}))});
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
 else if(k==='adm-tab'){A.tab=a.dataset.tab==='quotes'?'quotes':'accounts';paintAdmin(pg)}
 else if(k==='adm-qreload'){A.quotes=null;admQLoad()}
 else if(k==='q-reply')qReply(a.dataset.id,a);
 else if(k==='q-open'){A.qOpen=a.dataset.id;admPaintQ(pg,true);const el=$$('[data-adm-qpanel] .qp',pg).find(x=>x.offsetParent!==null);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
 else if(k==='q-close'){A.qOpen='';admPaintQ(pg,true)}
 else if(k==='q-copylink'||k==='q-copyemail'||k==='q-copyhtml'){const r=qRows().find(x=>x.id===a.dataset.id);if(!r||!r.tok){toast('No summary link for this quote');return}const d=qDraft(r);
  const txt=k==='q-copylink'?d.link:k==='q-copyemail'?'Subject: '+d.subject+'\n\n'+d.body:qHtml(r);
  copyText(txt).then(ok=>toast(ok?(k==='q-copylink'?'Summary link copied':k==='q-copyemail'?'Email copied':'HTML copied'):'Could not copy. Select the text manually.'))}
 else if(k==='adm-copy'){const em=[...new Set(admRows().map(r=>r.email).filter(Boolean))];if(!em.length){toast('No emails to copy');return}copyText(em.join(', ')).then(ok=>toast(ok?'Copied '+em.length+' email'+(em.length>1?'s':''):'Could not copy. Select the emails manually.'))}});

// ---- quote summary: public page /shop/quote-summary/?t=TOKEN. Shown only after the team has replied (the database returns null before that).
// It displays names and quantities only: no prices, no contact details, no internal ids.
const QS={tm:[],tok:'',data:null};
const qsNum=n=>{n=Number(n);return isFinite(n)?(Number.isInteger(n)?String(n):String(Math.round(n*10)/10)):''};
const qsUnit=(u,n)=>{u=String(u||'Box').toLowerCase();if(!/^(piece|box|case)$/.test(u))u='box';return Number(n)===1?u:(u==='box'?'boxes':u+'s')};
const qsQty=it=>{const n=it.quantity!=null?it.quantity:it.boxes;const q=Number(n);return isFinite(q)&&q>0?'x '+qsNum(q)+' '+qsUnit(it.unit,q):''};
function qsItems(d){return ((d&&d.items)||[]).filter(i=>i&&typeof i==='object'&&String(i.display_name||i.product||'').trim())}
function qsTotals(its){let b=0,ok=false;its.forEach(it=>{const q=Number(it.quantity!=null?it.quantity:it.boxes);let x=it.box_equivalent!=null?Number(it.box_equivalent):(String(it.unit||'Box').toLowerCase()==='box'?q:NaN);if(isFinite(x)&&x>0){b+=x;ok=true}});
 const n=its.length,bx=Math.round(b*10)/10;return n+(n===1?' product':' products')+(ok?' - '+qsNum(bx)+(bx===1?' box':' boxes'):'')}
const qsLogo='<img class="qs-logo qs-r" src="/assets/red-apple-logo.svg" alt="Red Apple Distribution" width="198" height="84">';
function qsShell(inner,cls){return '<div class="qs '+(cls||'')+'" data-qs><div class="qs-glow" aria-hidden="true"></div><div class="qs-glow g2" aria-hidden="true"></div><div class="qs-stage">'+inner+'</div></div>'}
function qsHTML(d){const its=qsItems(d),ref=String(d.ref||'').trim(),shop=String(d.shop||'').trim();
 const subj=encodeURIComponent('Quote '+(ref||'summary')+' - reply to Red Apple Distribution');
 return qsShell(qsLogo
 +'<div class="qs-head"><p class="qs-eyebrow qs-r">Wholesale quote</p><h1 class="qs-h1 qs-r">Your quote is ready</h1>'+(shop?'<p class="qs-shop qs-r">'+esc(shop)+'</p>':'')+(ref?'<p class="qs-ref qs-r">Quote ref '+esc(ref)+'</p>':'')+'</div>'
 +'<div class="qs-card qs-r">'+(its.length?'<ol class="qs-list" aria-label="Products in your quote" tabindex="0">'+its.map(it=>{const nm=String(it.display_name||it.product).trim(),fl=String(it.flavor||'').trim(),q=qsQty(it);
   return '<li class="qs-i"><span class="qs-n"><b>'+esc(nm)+'</b>'+(fl?'<small>'+esc(fl)+'</small>':'')+'</span>'+(q?'<em class="qs-q">'+esc(q)+'</em>':'')+'</li>'}).join('')+'</ol>'
   :'<p class="qs-empty">Your quote notes are with our team. Reply to us if you have any questions.</p>')
 +'<p class="qs-total qs-r">'+esc(its.length?qsTotals(its):'Quote summary')+'</p></div>'
 +'<div class="qs-close qs-r"><h2 class="qs-h2">Questions or ready to move forward?</h2><p>Our team has already sent your pricing by email. Reply to us and we will take it from there.</p>'
 +'<div class="qs-btns"><a class="rq-btn" data-qs-reply href="mailto:sales@redappledistro.com?subject='+subj+'">Reply to our team</a><a class="rq-btn ghost" href="/shop/account/">Open my account / quotes</a></div>'
 +'<p class="qs-tools"><button type="button" class="qs-link" data-qs-act="replay">Replay</button></p></div>'
 +'<p class="qs-tools qs-skip"><button type="button" class="qs-link" data-qs-act="skip">Skip animation</button></p>')}
const qsNA=()=>qsShell(qsLogo+'<div class="qs-na qs-r"><p class="rq-pill">Quote summary</p><h1 class="qs-h2">This quote summary is not available yet</h1><p>We share your summary once our team has replied to your quote request with pricing. Please check back soon, or reach out to us and we will help.</p><div class="qs-btns"><a class="rq-btn" href="mailto:sales@redappledistro.com?subject='+encodeURIComponent('My quote summary')+'">Email our team</a><a class="rq-btn ghost" href="/shop/account/">Open my account / quotes</a></div></div>','qs-state')
const qsERR=()=>qsShell(qsLogo+'<div class="qs-na qs-r"><p class="rq-pill">Quote summary</p><h1 class="qs-h2">We could not load your summary</h1><p>Please check your connection and try again in a moment.</p><div class="qs-btns"><button type="button" class="rq-btn" data-qs-act="retry">Try again</button></div></div>','qs-state')
const qsLOAD=()=>qsShell(qsLogo+'<p class="qs-wait qs-r">Loading your quote...</p>','qs-state');
function qsRoots(){return $$('[data-qs-root]',MAIN()||document)}
function qsStop(){QS.tm.forEach(clearTimeout);QS.tm=[]}
const qsAt=(ms,fn)=>{QS.tm.push(setTimeout(fn,ms))};
const qsReduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
function qsShowAll(r){const q=$('[data-qs]',r);if(!q)return;q.classList.add('is-on','is-done');$$('.qs-r,.qs-i',q).forEach(e=>e.classList.add('in'))}
function qsPlay(r,static_){const q=$('[data-qs]',r);if(!q)return;
 $$('.qs-r,.qs-i',q).forEach(e=>e.classList.remove('in'));q.classList.remove('is-done','is-on','is-static');const L=$('.qs-list',q);if(L)L.scrollTop=0;
 if(static_||qsReduced()){q.classList.add('is-static');qsShowAll(r);return}
 const on=(sel,ms)=>qsAt(ms,()=>{$$(sel,q).forEach(e=>e.classList.add('in'))});
 let user=false;if(L){const stop=()=>{user=true};L.addEventListener('wheel',stop,{passive:true,once:true});L.addEventListener('touchstart',stop,{passive:true,once:true})}
 qsAt(60,()=>q.classList.add('is-on'));on('.qs-logo',250);on('.qs-eyebrow',1100);on('.qs-h1',1300);on('.qs-shop',1900);on('.qs-ref',2250);
 if(!$('.qs-i',q)){on('.qs-card',2500);on('.qs-close',3600);qsAt(3600,()=>q.classList.add('is-done'));return}
 on('.qs-card',2500);const its=$$('.qs-i',q);let t=3100;
 const fast=its.length>40?60:110;
 its.forEach((li,i)=>{qsAt(t,()=>{li.classList.add('in');if(L&&!user){const y=li.offsetTop+li.offsetHeight-L.clientHeight+6;if(y>0)L.scrollTo({top:y,behavior:'smooth'})}});t+=i<7?430:fast});
 on('.qs-total',t+500);on('.qs-close',t+1500);
 qsAt(t+1500,()=>{q.classList.add('is-done');if(!user&&L)L.scrollTo({top:0,behavior:'smooth'});const c=$('.qs-close',q);if(c&&c.getBoundingClientRect().bottom>innerHeight)c.scrollIntoView({behavior:'smooth',block:'end'})})}
function qsPaint(kind,d){qsStop();qsRoots().forEach(r=>{r.innerHTML=kind==='ok'?qsHTML(d):kind==='na'?qsNA():kind==='err'?qsERR():qsLOAD();if(kind==='ok')qsPlay(r);else{const q=$('[data-qs]',r);if(q){q.classList.add('is-on');qsAt(80,()=>{$$('.qs-r',q).forEach(e=>e.classList.add('in'))})}}})}
async function qsLoad(){const tok=(new URLSearchParams(location.search).get('t')||'').trim();QS.tok=tok;qsPaint('load');
 if(!AUTH_ON||!/^[A-Za-z0-9_-]{6,80}$/.test(tok)){qsPaint('na');return}
 let d;try{d=await B.getSummary(tok)}catch(e){if(state.page==='qsum'&&QS.tok===tok)qsPaint(e&&e.status>=400&&e.status<500&&e.status!==429?'na':'err');return}
 if(state.page!=='qsum'||QS.tok!==tok)return;
 if(!d||typeof d!=='object'||!d.replied_at&&!d.items){qsPaint('na');return}
 QS.data=d;qsPaint('ok',d)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-qs-act]');if(!b||state.page!=='qsum')return;const k=b.dataset.qsAct;
 if(k==='retry')qsLoad();else if(k==='replay'){qsStop();window.scrollTo({top:0,behavior:'smooth'});qsRoots().forEach(r=>qsPlay(r))}else if(k==='skip'){qsStop();qsRoots().forEach(r=>qsPlay(r,true))}});

// ---- route hook: returns true when it redirected (the caller stops)
function authRoute(){const p=state.page;closeMenus();acctNav();if(p!=='signin')RECOV='';if(p!=='account')WELCOME=false;
 if(p!=='qsum')qsStop();else{qsLoad();return false}
 if(!['signup','signin','account','admin'].includes(p)){quotePrompt(MAIN());paintPast(MAIN());return false}
 const pg=MAIN(),nx=new URLSearchParams(location.search).get('next')||'';
 if(!AUTH_ON){soonState(pg);return false}
 if(p==='signup'){if(SESS){go(nextPath(nx)||'/account',true);return true}paintSignup(pg);return false}
 if(p==='signin'){if(RECOV){paintSignin(pg,'recovery');return false}if(SESS){go(nextPath(nx)||'/account',true);return true}paintSignin(pg,'in',nx);return false}
 if(p==='account'){if(!SESS){go('/account/signin?next=account',true);return true}D.edit=false;paintDash(pg);loadDash();return false}
 if(p==='admin'){paintAdmin(pg);return false}
 return false}
function formVals(f){const o={};$$('input,select,textarea',f).forEach(i=>{if(!i.name)return;if(i.type==='radio'){if(i.checked)o[i.name]=/^\d+$/.test(i.value)?+i.value:i.value;else if(!(i.name in o))o[i.name]='';return}o[i.name]=i.type==='checkbox'?i.checked:i.value.trim()});return o}
function bad(f,names,msg){const e=$('[data-err]',f);if(e)e.textContent=msg;
 $$('.rq-in,.rq-sel,.rq-ta',f).forEach(i=>{const b=names.includes(i.name);i.classList.toggle('rq-bad',b);if(b)i.setAttribute('aria-invalid','true');else i.removeAttribute('aria-invalid')});
 $$('.rv-q',f).forEach(q=>{const r=$('input[type=radio]',q);q.classList.toggle('rq-bad',!!r&&names.includes(r.name))});
 const first=$('.rq-bad',f);if(first){const t=first.matches('fieldset')?$('input',first):first;try{t.focus()}catch(x){}}return false}
async function submitForm(f,kind){const btn=$('button[type=submit]',f);const v=formVals(f);if(v.website||v._honey)return;
 const miss=[];const need=(k,lbl)=>{if(!v[k])miss.push(k)};
 if(kind==='quote'){['shop','contact','email','whatsapp','state'].forEach(k=>need(k));if(miss.length)return bad(f,miss,'Please fill in the highlighted fields.');
  if(!emailOK(v.email))return bad(f,['email'],'Please enter a valid email address.');if(!phoneOK(v.whatsapp))return bad(f,['whatsapp'],'Please enter a valid WhatsApp or mobile number.');
  if(!v.age)return bad(f,[],'Please confirm you are 21 or older and buying for a retail business.');
  const items=Object.keys(cart).filter(i=>byId(ck(i).id)).map(i=>{const q=ck(i),p=byId(q.id);const fx=factor(p,q.un),bx=fx>0?Math.round(cart[i]*fx*100)/100:null;return {id:q.id,brand:p.b,product:p.n,original_name:p.n,display_name:strip(p),flavor:q.fl,unit:UN[q.un],quantity:cart[i],box_equivalent:bx,boxes:bx}});if(!items.length&&!v.notes)return bad(f,['notes'],'Add products to your list, or tell us what you need in the notes.');
  const ref='RA-'+String(Math.floor(Math.random()*9000)+1000);btn.textContent='Sending...';btn.disabled=true;const ok=await send('quote',{ref,business:v.shop,name:v.contact,email:v.email,whatsapp:v.whatsapp,state:v.state,preferred_contact:v.best,notes:v.notes,items,items_summary:items.map((x,k)=>(k+1)+'. '+(x.brand&&x.brand!==HB?x.brand+' - ':'')+x.display_name+(x.flavor?' | Flavor: '+x.flavor:'')+' | '+x.quantity+' x '+x.unit+(x.box_equivalent==null?'':' = '+x.box_equivalent+' box')+' | SKU name: '+x.original_name).join('\n'),total_boxes:Math.round(boxes()*10)/10,minimum_boxes:MINB,meets_minimum:Math.round(boxes()*10)/10>=MINB?'yes':'no'});btn.textContent='Request my quote';btn.disabled=false;
  if(!ok)return bad(f,[],'Sorry, we could not send your request. Please try again or email sales@redappledistro.com.');
  saveQuoteAcct(lastSent);qdone=ref;cart={};sv('ra_cart',cart);render();window.scrollTo(0,0);return}
 if(kind==='contact'){['contact','email','whatsapp','message'].forEach(k=>need(k));if(miss.length)return bad(f,miss,'Please fill in the highlighted fields.');
  if(!emailOK(v.email))return bad(f,['email'],'Please enter a valid email address.');if(!phoneOK(v.whatsapp))return bad(f,['whatsapp'],'Please enter a valid WhatsApp or mobile number.');
  if(throttled('contact'))return bad(f,[],'Please wait a few seconds before sending again.');btn.disabled=true;const ok=await send('contact',{name:v.contact,business:v.shop,email:v.email,whatsapp:v.whatsapp,message:v.message});btn.disabled=false;if(!ok)return bad(f,[],'Sorry, we could not send your message. Please try again.');
  bad(f,[],'');$$('input,textarea',f).forEach(i=>{if(i.type!=='checkbox')i.value=''});const o=$('[data-ok]',f);if(o)o.hidden=false;return}
 if(kind==='review'){['name','shop','remark'].forEach(k=>need(k));['overall','rep_rating','service','product'].forEach(k=>{if(!v[k])miss.push(k)});if(miss.length)return bad(f,miss,'Please fill in your name, shop, the star ratings marked with * and your remarks.');
  if(v.remark.length<15)return bad(f,['remark'],'Please write at least 15 characters in your remarks.');
  if(throttled('review'))return bad(f,[],'Please wait a few seconds before sending again.');btn.disabled=true;const ok=await send('review',{name:v.name,shop:v.shop,contact:v.contact,representative:v.rep,ratings:{overall:v.overall,representative:v.rep_rating,service:v.service,product:v.product,delivery:v.delivery},recommend:v.recommend,tenure:v.tenure,remark:v.remark,show_name:v.consent,status:'pending'});
  btn.disabled=false;if(!ok)return bad(f,[],'Sorry, we could not send your review. Please try again.');state.rdone=true;render();window.scrollTo(0,0)}}

// =====================================================================================================
// NEW PRESENTATION LAYER
// =====================================================================================================
const fine=()=>{try{return matchMedia('(hover: hover) and (pointer: fine)').matches&&!reduceMo()}catch(e){return false}};
function go(p,rep){const q=p.indexOf('?'),pa=q<0?p:p.slice(0,q),qs=q<0?'':p.slice(q);let u='/shop'+(pa.charAt(0)==='/'?pa:'/'+pa);if(u.slice(-1)!=='/')u+='/';if(u==='/shop/')u='/shop/c/all/';location[rep?'replace':'assign'](u+qs)}
function closeMenus(){const l=$('#links'),b=$('#burger'),n=$('#nav');if(l)l.classList.remove('is-open');if(n)n.classList.remove('is-open');if(b)b.setAttribute('aria-expanded','false')}
function flash(btn,t){const o=btn.textContent;btn.textContent=t;btn.classList.add('is-done');setTimeout(()=>{btn.textContent=o;btn.classList.remove('is-done')},1100)}
function refresh(){let n=0;if(P.length){n=fb(boxes());try{localStorage.setItem('ra_boxes',n)}catch(e){}}else{try{n=localStorage.getItem('ra_boxes')||0}catch(e){}}
 $$('[data-nav-n]').forEach(e=>{e.hidden=!(+n>0);e.textContent=' ('+n+')'});$$('[data-cart-n]').forEach(e=>{e.textContent=+n>0?' ('+n+')':''})}
function render(){const pg=MAIN();if(!pg)return;
 if(state.page==='quote')renderQuote(pg);
 if(state.page==='quote'||state.page==='review'){const dn=state.page==='quote'?!!qdone:!!state.rdone;$$('[data-view=form]',pg).forEach(v=>v.hidden=dn);$$('[data-view=done]',pg).forEach(v=>v.hidden=!dn);$$('.qlist',pg).forEach(v=>v.hidden=dn)}
 refresh()}
function renderQuote(pg){const ids=Object.keys(cart).filter(i=>byId(ck(i).id));const n=boxes();
 $$('[data-qlist]',pg).forEach(c=>{c.innerHTML=ids.length?'<ul class="rq-items">'+ids.map(i=>{const q=ck(i),p=byId(q.id),fl=q.fl,un=q.un,nm=esc(strip(p));return '<li class="rq-item"><div class="rq-thumb">'+(p.i?'<img src="/shop/'+esc(p.i)+'" alt="">':'<img class="is-mark" src="/assets/red-apple-mark.svg" alt="">')+'</div><div class="rq-info">'+(bd(p)?'<b>'+esc(bd(p))+'</b>':'')+'<span>'+nm+'</span>'+(fl?'<em class="rq-flv">Flavor: '+esc(fl)+'</em>':'')+'<em class="rq-un">'+esc(unitLine(p,un,cart[i]))+'</em>'+(p.mq>0?'<em class="rq-un">'+esc(minText(p,un))+'</em>':'')+'</div><div class="rq-qty"><button type="button" data-act="q-dec" data-id="'+esc(i)+'" aria-label="Fewer: '+nm+'">-</button><em aria-live="polite">'+cart[i]+'</em><button type="button" data-act="q-inc" data-id="'+esc(i)+'" aria-label="More: '+nm+'">+</button><button type="button" class="rq-x" data-act="q-rm" data-id="'+esc(i)+'" aria-label="Remove '+nm+'">Remove</button></div></li>'}).join('')+'</ul>':'<p class="rq-empty">Your quote list is empty. Add products from the <a href="/shop/c/all/">catalog</a>, or just tell us what you need in the notes and we will take it from there.</p>'});
 $$('[data-f=q-count]',pg).forEach(e=>e.textContent=fb(n));qMin(pg,n);prefillQuote(pg);quotePrompt(pg);paintPast(pg);$$('[data-f=q-ref]',pg).forEach(e=>e.textContent=qdone)}
const stars=n=>'<span class="rv-stars" role="img" aria-label="'+n+' out of 5 stars"><span aria-hidden="true">'+[1,2,3,4,5].map(i=>'<i class="'+(i<=n?'on':'')+'">&#9733;</i>').join('')+'</span></span>';

// ---- cards, grid, filters, reveal, tilt
const cardHTML=p=>{const src=p.i?'/shop/'+p.i:'';
 const im=src?'<img src="'+esc(src)+'" alt="'+esc(altOf(p))+'" loading="lazy" decoding="async">':'<img class="is-mark" src="/assets/red-apple-mark.svg" alt="" loading="lazy" decoding="async">';
 const add=flList(p).length?'<a class="pc__add" href="/shop/p/'+p.id+'/#buy">Choose flavor</a>':'<button class="pc__add" type="button" data-act="card-add" data-id="'+p.id+'">Add to quote</button>';
 return '<li class="pc"><a class="pc__a" href="/shop/p/'+p.id+'/"><span class="pc__art">'+im+'</span><span class="pc__b">'+esc(bd(p))+'</span><span class="pc__n">'+esc(strip(p))+'</span></a>'+add+'</li>'};
const G={base:[],items:[],shown:0};
let io=null;
function reveal(root){const els=$$('.pc:not(.in)',root);if(!('IntersectionObserver' in window)||reduceMo()){els.forEach(x=>x.classList.add('in'));return}
 if(!io)io=new IntersectionObserver(es=>{es.filter(x=>x.isIntersecting).sort((a,b)=>(a.target.compareDocumentPosition(b.target)&2)?1:-1).forEach((x,i)=>{const t=x.target;t.style.transitionDelay=Math.min(i,8)*55+'ms';t.classList.add('in');io.unobserve(t);setTimeout(()=>{t.style.transitionDelay=''},1200)})},{rootMargin:'0px 0px -5% 0px'});
 els.forEach(x=>io.observe(x))}
function renderGrid(reset){const g=$('#grid');if(!g)return;if(reset){g.innerHTML='';G.shown=0}
 const next=G.items.slice(G.shown,G.shown+24);g.insertAdjacentHTML('beforeend',next.map(cardHTML).join(''));G.shown+=next.length;
 if(!G.items.length)g.innerHTML='<li class="empty">No products match. Clear a filter, or <a href="/shop/quote/">tell us what you need</a>.</li>';
 reveal(g);const b=$('[data-act=load-more]');if(b)b.hidden=G.shown>=G.items.length;const c=$('#count');if(c)c.textContent=G.items.length+(G.items.length===1?' product':' products')}
function applyF(){const f=$('#tools');if(!f){G.items=G.base;return}const v=formVals(f),q=(v.q||'').toLowerCase();let l=G.base.slice();
 if(q)l=l.filter(p=>(p.n+' | '+p.b+' | '+(p.dn||'')).replace(/[\u2013\u2014]/g,'-').toLowerCase().includes(q));
 if(v.brand)l=l.filter(p=>p.b===v.brand);if(v.puff)l=l.filter(p=>dk(p.n)>=+v.puff);if(v.newonly){const nw=(PICKS.new||[]);l=l.filter(p=>nw.includes(p.id))}
 if(v.sort==='az')l.sort((a,b)=>strip(a).localeCompare(strip(b)));else if(v.sort==='brand')l.sort((a,b)=>bd(a).localeCompare(bd(b))||strip(a).localeCompare(strip(b)));else if(v.sort==='puff')l.sort((a,b)=>dk(b.n)-dk(a.n));
 G.items=l;renderGrid(true)}
function initGrid(items){G.base=items;const g=$('#grid'),f=$('#tools');if(!g)return;
 if(f){const sel=$('#f-b');[...new Set(items.map(p=>p.b))].filter(b=>b!==HB).sort((a,b)=>a.localeCompare(b)).forEach(b=>{const o=document.createElement('option');o.textContent=b;sel.appendChild(o)});
  const q=new URLSearchParams(location.search).get('q')||'';if(q)$('#f-q').value=q;
  let t=0;f.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(applyF,120)});f.addEventListener('change',applyF);
  if(q){applyF();return}}
 G.items=items;G.shown=g.children.length;if(!G.shown)renderGrid(true);else{const b=$('[data-act=load-more]');if(b)b.hidden=G.shown>=items.length;reveal(g)}}
function loadMore(){renderGrid(false);const g=$('#grid');}
function initCat(){const slug=MAIN().dataset.slug;initGrid(list(slug,''));initPickup()}
function initBrand(){initGrid(P.filter(p=>p.b===state.brand))}
function initBrands(){const by={};P.forEach(p=>{if(p.b!==HB&&p.i&&!by[p.b])by[p.b]=p.i});
 $$('#blist a').forEach(a=>{const n=$('b',a).textContent,src=by[n];a.insertAdjacentHTML('afterbegin','<span class="bl__art"><img src="'+(src?'/shop/'+esc(src):'/assets/red-apple-mark.svg')+'" alt="" loading="lazy"'+(src?'':' class="is-mark"')+'></span>')})}
// pointer 3D tilt on product cards (fine pointers, motion allowed). Transform only.
(function(){if(!fine())return;let cur=null,raf=0,ev=null;
 const apply=()=>{raf=0;if(!cur||!ev)return;const r=cur.getBoundingClientRect(),nx=(ev.clientX-r.left)/r.width-.5,ny=(ev.clientY-r.top)/r.height-.5;cur.style.setProperty('--rx',(-ny*12).toFixed(2)+'deg');cur.style.setProperty('--ry',(nx*14).toFixed(2)+'deg');cur.style.setProperty('--tx',(nx*10).toFixed(1)+'px');cur.style.setProperty('--ty',(ny*8).toFixed(1)+'px')};
 const reset=c=>{if(!c)return;c.classList.remove('is-tilt');['--rx','--ry','--tx','--ty'].forEach(k=>c.style.removeProperty(k))};
 document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.pc');if(c!==cur){reset(cur);cur=c;if(c)c.classList.add('is-tilt')}if(!c)return;ev=e;if(!raf)raf=requestAnimationFrame(apply)},{passive:true});
 document.addEventListener('pointerleave',()=>{reset(cur);cur=null})})();
// arrow pick-up on category cards: hover the arrow and the product flies to it and becomes the arrow
function initPickup(){if(!fine()||!Element.prototype.animate)return;
 $$('.cat').forEach(card=>{const go=$('.cat__go',card),art=$('.cat__art',card),arr=$('.arr',go);if(!go||!art||art.classList.contains('is-mark'))return;let fly=null;
  const rel=r=>{const t=card.getBoundingClientRect();return{x:r.left-t.left,y:r.top-t.top,w:r.width,h:r.height}};
  const D=520,E='cubic-bezier(0.23, 1, 0.32, 1)';
  function up(){if(fly)return;const a=rel(art.getBoundingClientRect()),g=rel(go.getBoundingClientRect());
   fly=document.createElement('img');fly.src=art.currentSrc||art.src;fly.alt='';fly.className='pickfly';fly.style.cssText='left:'+a.x+'px;top:'+a.y+'px;width:'+a.w+'px;height:'+a.h+'px';card.appendChild(fly);art.style.opacity='0';
   const k=Math.min(30/a.w,30/a.h),dx=g.x+g.w/2-(a.x+a.w/2),dy=g.y+g.h/2-(a.y+a.h/2);
   fly.animate([{transform:'none'},{transform:'translate('+dx+'px,'+dy+'px) scale('+k+') rotate(360deg)'}],{duration:D,easing:E,fill:'forwards'});
   arr.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.2) rotate(-90deg)'}],{duration:200,easing:E,fill:'forwards'})}
  function down(){if(!fly)return;const f=fly;fly=null;const an=f.getAnimations()[0];if(an){an.playbackRate=-1.4;an.onfinish=()=>{f.remove();art.style.opacity=''};an.play()}else{f.remove();art.style.opacity=''}
   arr.getAnimations().forEach(x=>{x.playbackRate=-1.4;x.play()})}
  go.addEventListener('pointerenter',up);go.addEventListener('pointerleave',down);card.addEventListener('pointerleave',down);go.addEventListener('focus',up);go.addEventListener('blur',down)})}

// ---- product page
const FI=()=>window.FLAVOR_IMAGES||{};
function updateOb(){const p=byId(state.id);if(!p)return;const pg=MAIN(),un=curUnit(p),q=state.qty||1;
 $$('[data-f=ob-hint]',pg).forEach(e=>e.textContent=obText(p,un,q));$$('[data-f=ob-item]',pg).forEach(e=>{const t=minText(p,un);e.hidden=!t;e.textContent=t});$$('[data-f=qty-label]',pg).forEach(e=>e.textContent='Quantity ('+wd(un,2)+')')}
function setUnit(p,u){if(!unitsOf(p).includes(u)||state.un===u)return;state.un=u;state.qty=minQty(p,u);const i=$('#b-q');if(i)i.value=state.qty;updateOb()}
function showImg(src,dir){const st=$('#stage');if(!st)return;const old=st.querySelector('img');if(old&&old.getAttribute('src')===src)return;
 const im=document.createElement('img');im.src=src;im.alt=old?old.alt:'';if(!src||/red-apple-mark/.test(src))im.className='is-mark';
 if(!old||reduceMo()){st.innerHTML='';st.appendChild(im);return}
 st.appendChild(im);im.style.position='absolute';
 im.animate([{opacity:0,transform:'translateX('+(dir*40)+'px) scale(1.04)'},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(0.23, 1, 0.32, 1)'});
 old.style.position='absolute';const a=old.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX('+(-dir*40)+'px) scale(.96)'}],{duration:360,easing:'cubic-bezier(0.23, 1, 0.32, 1)',fill:'forwards'});a.onfinish=()=>{old.remove();im.style.position=''}}
function initProd(){const pg=MAIN(),p=byId(+pg.dataset.id);if(!p)return;state.id=p.id;state.un=defUnit(p);state.qty=minQty(p,state.un);state.fl='';
 const host=$('#buy'),fl=flList(p),uns=unitsOf(p),imgs=FI()[p.id]||{};
 host.innerHTML='<form class="buyf" novalidate>'
  +(fl.length?'<div class="rq-f"><label for="b-fl">Flavor <span aria-hidden="true">*</span></label><select class="rq-sel" id="b-fl" aria-describedby="b-fl-e"><option value="">Select a flavor</option>'+fl.map(n=>'<option>'+esc(n)+'</option>').join('')+'</select><p class="rq-err" id="b-fl-e" role="alert"></p></div>':'')
  +(uns.length>1?'<div class="rq-f"><label for="b-un">Order by</label><select class="rq-sel" id="b-un">'+uns.map(u=>'<option value="'+u+'"'+(u===state.un?' selected':'')+'>'+UN[u]+'</option>').join('')+'</select></div>':'<p class="ob-one">Sold by the '+UN[uns[0]].toLowerCase()+'.</p>')
  +'<div class="rq-f"><label for="b-q" data-f="qty-label">Quantity</label><div class="stepper"><button type="button" data-act="qty-dec" aria-label="Decrease quantity">-</button><input id="b-q" type="number" inputmode="numeric" min="1" max="9999" value="'+state.qty+'"><button type="button" data-act="qty-inc" aria-label="Increase quantity">+</button></div></div>'
  +'<p class="ob-hint" data-f="ob-hint" aria-live="polite"></p><p class="ob-min" data-f="ob-item" hidden></p>'
  +'<div class="buy__row"><button class="btn btn--red buy__add" type="submit">Add to quote</button><a class="btn btn--line" href="/shop/quote/">View quote list<span data-cart-n></span></a></div></form>';
 const form=$('form',host),sel=$('#b-fl'),un=$('#b-un'),qi=$('#b-q');
 // thumbnails: product photo plus every flavor photo
 const its=[{k:'',src:p.i?'/shop/'+p.i:'/assets/red-apple-mark.svg',l:'Product photo'}];fl.forEach(n=>{if(imgs[n])its.push({k:n,src:'/shop/'+imgs[n],l:n})});
 const th=$('#thumbs');if(its.length>1){th.innerHTML=its.map((t,i)=>'<li><button type="button" class="th'+(i?'':' is-on')+'" data-k="'+esc(t.k)+'" aria-pressed="'+(i?'false':'true')+'" aria-label="Show '+esc(t.l)+'"><img src="'+esc(t.src)+'" alt="" loading="lazy"></button></li>').join('')}else th.hidden=true;
 const mark=()=>$$('.th',th).forEach(b=>{const on=b.dataset.k===(imgs[state.fl]?state.fl:'');b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',on?'true':'false')});
 let idx=0;const setFl=(n,fromThumb)=>{const ni=fl.indexOf(n),dir=ni>=idx?1:-1;if(n&&ni>=0)idx=ni;state.fl=n;if(sel)sel.value=n;const m=$('#b-fl-e');if(m)m.textContent='';if(sel)sel.classList.remove('rq-bad');showImg(imgs[n]?'/shop/'+imgs[n]:(p.i?'/shop/'+p.i:'/assets/red-apple-mark.svg'),dir);mark()};
 if(sel)sel.addEventListener('change',()=>setFl(sel.value));
 th.addEventListener('click',e=>{const b=e.target.closest('.th');if(!b)return;const k=b.dataset.k;if(k)setFl(k,true);else{state.fl=sel?'':'';if(sel)sel.value='';showImg(its[0].src,-1);mark()}});
 if(un)un.addEventListener('change',()=>setUnit(p,un.value));
 qi.addEventListener('input',()=>{const v=Math.floor(+qi.value);if(v>=1)state.qty=Math.min(9999,v);updateOb()});
 qi.addEventListener('blur',()=>{state.qty=Math.min(9999,Math.max(_mq(),Math.floor(+qi.value)||1));qi.value=state.qty;updateOb()});
 form.addEventListener('submit',ev=>{ev.preventDefault();
  if(fl.length&&!state.fl){const m=$('#b-fl-e');m.textContent='Please choose a flavor.';sel.classList.add('rq-bad');sel.focus();return}
  const u=curUnit(p),qn=Math.max(Math.floor(+qi.value)||1,minQty(p,u));state.qty=qn;qi.value=qn;add(mk(p.id,state.fl,u),qn);toast('Added '+qn+' '+wd(u,qn)+' to your quote list'+(state.fl?' - '+state.fl:''));flash($('.buy__add',form),'Added')});
 updateOb();
 // pointer tilt on the stage
 const st=$('#stage');if(fine()&&st){st.addEventListener('pointermove',e=>{const r=st.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;st.style.setProperty('--rx',(-ny*8).toFixed(2)+'deg');st.style.setProperty('--ry',(nx*10).toFixed(2)+'deg')});st.addEventListener('pointerleave',()=>{st.style.removeProperty('--rx');st.style.removeProperty('--ry')})}
 refresh()}
function stepQty(d){const qi=$('#b-q');if(!qi)return;state.qty=Math.min(9999,Math.max(_mq(),(Math.floor(+qi.value)||state.qty||1)+d));qi.value=state.qty;updateOb()}

// ---- faq, reviews, subscribe
function initFaq(){const L=$('#faq-list');$$('.fchip').forEach(b=>b.addEventListener('click',()=>{$$('.fchip').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));const c=b.dataset.cat;$$('[data-faq]',L).forEach(i=>{i.hidden=c!=='all'&&i.dataset.cat!==c})}))}
document.addEventListener('click',e=>{const q=e.target.closest('.faq__q');if(!q)return;const it=q.closest('[data-faq]'),open=!it.classList.contains('is-open');it.classList.toggle('is-open',open);q.setAttribute('aria-expanded',open?'true':'false')});
function initReviews(){const c=$('#rv-list'),l=REVS();if(!c||!l.length)return;c.innerHTML=l.map(r=>'<article class="rv-card"><div class="rv-h"><div><b>'+esc(r.name||'Verified shop owner')+'</b><small>'+esc(r.shop||'')+'</small></div>'+stars(+r.rating||5)+'</div><p>'+esc(r.text)+'</p></article>').join('')}
async function subscribe(f){const inp=$('input[name=contact]',f),hp=$('[name=_honey]',f),msg=$('.sub__msg',f),val=(inp.value||'').trim();
 if(hp&&hp.value)return;
 if(!(emailOK(val)||phoneOK(val))){msg.textContent='Enter a valid email or WhatsApp number.';inp.setAttribute('aria-invalid','true');inp.focus();return}
 inp.removeAttribute('aria-invalid');
 if(throttled('subscribe')){msg.textContent='Please wait a few seconds before sending again.';return}
 const btn=$('button',f);btn.disabled=true;const ok=await send('subscribe',{contact:val,kind:emailOK(val)?'email':'whatsapp'});btn.disabled=false;
 if(ok){inp.value='';msg.textContent='Thanks, you are on the list.';toast('Thanks, you are on the list')}else msg.textContent='Something went wrong. Please try again.'}

// ---- events
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act;
 if(act==='card-add'){const p=byId(a.dataset.id);if(!p)return;const u0=defUnit(p),q=minQty(p,u0);add(mk(p.id,'',u0),q);flash(a,'Added');toast('Added '+q+' '+wd(u0,q)+' to your quote list')}
 else if(act==='load-more')loadMore();
 else if(act==='qty-inc'||act==='qty-dec')stepQty(act==='qty-inc'?1:-1)
 else if(act==='q-inc')add(a.dataset.id,1),render();
 else if(act==='q-dec'){const k_=ck(a.dataset.id),p_=byId(k_.id);if(!p_||cart[a.dataset.id]-1>=minQty(p_,k_.un))add(a.dataset.id,-1);render()}
 else if(act==='q-rm'){delete cart[a.dataset.id];sv('ra_cart',cart);render()}});
document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('form[data-form]');if(f){e.preventDefault();submitForm(f,f.dataset.form);return}
 const s=e.target.closest&&e.target.closest('form[data-sub]');if(s){e.preventDefault();subscribe(s)}});

// ---- shell: age gate, nav, page head parallax
function initShell(){const age=$('#age');let ok=false;try{ok=localStorage.getItem('ra-age-ok')==='1'||localStorage.getItem('ra_age')==='true'}catch(e){}
 if(!ok&&age){age.hidden=false;document.documentElement.style.overflow='hidden';$('#age-yes').focus();
  $('#age-yes').addEventListener('click',()=>{try{localStorage.setItem('ra-age-ok','1');localStorage.setItem('ra_age','true')}catch(e){}document.documentElement.style.overflow='';age.hidden=true});
  $('#age-no').addEventListener('click',()=>{$('#age-deny').hidden=false;$('.age__btns').hidden=true})}
 const nav=$('#nav'),burger=$('#burger'),links=$('#links');let lastY=0;
 burger.addEventListener('click',()=>{const o=links.classList.toggle('is-open');nav.classList.toggle('is-open',o);burger.setAttribute('aria-expanded',o)});
 links.addEventListener('click',e=>{if(e.target.closest('a'))closeMenus()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
 addEventListener('scroll',()=>{const y=scrollY;nav.classList.toggle('is-solid',y>30);if(!links.classList.contains('is-open'))nav.classList.toggle('is-hidden',y>500&&y>lastY+4);if(y<lastY-4)nav.classList.remove('is-hidden');lastY=y},{passive:true});
 nav.classList.toggle('is-solid',scrollY>30);
 if(fine()){const h=$('.phead'),im=$$('.phead__art .a');if(h&&im.length){let raf=0,mx=0,my=0;h.addEventListener('pointermove',e=>{const r=h.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;if(!raf)raf=requestAnimationFrame(()=>{raf=0;im.forEach(x=>{const d=+x.dataset.depth||10;x.style.translate=(mx*d*-1.6).toFixed(1)+'px '+(my*d*-1.2).toFixed(1)+'px'})})})}}}

// ---- boot
(function(){const pg=MAIN();if(!pg)return;
 state={page:pg.dataset.page,slug:pg.dataset.slug,id:pg.dataset.id,brand:pg.dataset.brand||'',q:''};
 initShell();migrateCart();
 $$('select[name=state]',pg).forEach(s=>{if(s.options.length<3)STATES_US.forEach(n=>{const o=document.createElement('option');o.textContent=n;s.appendChild(o)})});
 if(authRoute())return;
 const INIT={cat:initCat,brand:initBrand,brands:initBrands,prod:initProd,faq:initFaq,reviews:initReviews};if(INIT[state.page])INIT[state.page]();
 render();reveal(document);
 setTimeout(async()=>{acctNav();if(!(SESS&&AUTH_ON))return;await loadProfile();await pullMerge(false);flushQuotes(false);retryNotify();if(state.page==='quote')prefillQuote(MAIN());quotePrompt(MAIN())},0);
 addEventListener('storage',e=>{if(e.key==='ra_cart'){cart=ld('ra_cart',{});render()}});
})();
})();
