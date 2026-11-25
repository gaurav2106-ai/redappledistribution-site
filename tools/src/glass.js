/* Liquid press: a ripple grows from the exact point of the press on every glass button (skipped for reduced motion). */
(function(){
 var SEL='.btn,.rq-btn,.adm-tab,.rac-btn--red,.rac-btn--ghost';
 function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
 document.addEventListener('pointerdown',function(e){
  if(!e.target||!e.target.closest||reduced())return;
  var b=e.target.closest(SEL);if(!b||b.disabled||b.getAttribute('aria-disabled')==='true')return;
  var r=b.getBoundingClientRect();
  b.style.setProperty('--rx',(e.clientX-r.left)+'px');b.style.setProperty('--ry',(e.clientY-r.top)+'px');
  b.classList.remove('is-liq');void b.offsetWidth;b.classList.add('is-liq');
 },{passive:true});
 document.addEventListener('animationend',function(e){if(e.animationName==='liq')e.target.classList.remove('is-liq')});
})();

/* Button icons: one line-icon set (24 grid, round caps), added to every button and button-style link, also those drawn later by the shop script. */
(function(){
 var P={
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
  doc:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  userplus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  chat:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  copy:'<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  sliders:'<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'
 };
 /* [pattern on the lower-case label, icon, 1 = icon after the label] first match wins */
 var R=[
  [/^no$|cancel|close|remove|revoke|dismiss/,'x'],
  [/yes, i am 21|accept all|^save|confirm|approve|complete quote|^done|keep quote|mark as replied|^allow/,'check'],
  [/essential only/,'shield'],[/customi[sz]e/,'sliders'],
  [/edit|keep editing/,'pencil'],[/copy/,'copy'],[/refresh|try again|re-order|reorder/,'refresh'],
  [/sign out/,'logout'],[/sign in/,'login'],
  [/create account|add account|add another account/,'userplus'],
  [/^add\b|add to|add these/,'plus'],[/load more/,'down'],[/items/,'list'],
  [/get a quote|request my quote|request pricing|review and request|view quote list|start another quote|new quote|^quotes$|open in quotes/,'doc'],
  [/shop the catalog/,'grid'],[/^accounts$|my account/,'user'],[/contact us/,'chat'],
  [/email|reply|resend|reset link|subscribe/,'mail'],[/send|submit/,'send'],
  [/browse|keep browsing|view all|see all|^view |^open /,'arrow',1]
 ];
 var SEL='.btn,.rq-btn,.adm-tab,.rac-btn,.nav__acct';
 function svg(n,end){var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','bi');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');s.innerHTML=P[n];if(end)s.setAttribute('data-end','');return s}
 function one(b){
  if(b.hasAttribute('data-noico')||b.querySelector('svg.bi'))return;
  var t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(!t||/^[\d\s]+$/.test(t))return;
  for(var i=0;i<R.length;i++){if(R[i][0].test(t)){var e=R[i][2]===1;e?b.appendChild(svg(R[i][1],1)):b.insertBefore(svg(R[i][1]),b.firstChild);return}}
  if(b.tagName==='A'&&b.classList.contains('btn')&&b.getAttribute('href'))b.appendChild(svg('arrow',1));
 }
 function all(root){if(root.nodeType!==1)return;if(root.matches&&root.matches(SEL))one(root);if(root.querySelectorAll)root.querySelectorAll(SEL).forEach(one)}
 var q=false,pending=[];
 function flush(){q=false;var l=pending;pending=[];l.forEach(function(n){all(n)})}
 function go(){all(document.body);try{new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){pending.push(n.nodeType===1?n:m.target)});if(m.type==='childList'&&m.target.nodeType===1)pending.push(m.target)});if(!q){q=true;requestAnimationFrame(flush)}}).observe(document.body,{childList:true,subtree:true})}catch(e){}}
 if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
