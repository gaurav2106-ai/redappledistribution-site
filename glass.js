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
