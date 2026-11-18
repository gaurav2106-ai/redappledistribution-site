/* Red Apple Distribution — motion + interactions (GSAP + ScrollTrigger) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGsap && !reduce;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* clean URLs: logo links go to "./"; when already on the landing, scroll to top and keep the URL hash-free */
  $$('a.nav__logo').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (new URL(a.href, location.href).pathname !== location.pathname) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      if (location.hash || /index\.html$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/index\.html$/, ''));
    });
  });

  /* clean URLs: in-page anchors scroll smoothly and never write a hash (scroll-padding-top in CSS handles the fixed header) */
  function cleanPath() { return location.pathname.replace(/index\.html$/, '') + location.search; }
  function goTo(id) {
    var t = id && document.getElementById(id);
    if (!t) return false;
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    return true;
  }
  $$('a[href]').forEach(function (a) {
    var raw = a.getAttribute('href'), m = /^(?:\.\/|index\.html)?#([\w-]+)$/.exec(raw);
    if (!m) return;
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      if (!document.getElementById(m[1])) return;
      e.preventDefault();
      if (typeof closeMenu === 'function') closeMenu();
      goTo(m[1]);
      history.replaceState(null, '', cleanPath());
    });
  });
  window.addEventListener('load', function () {
    if (window.__raHash) setTimeout(function () { goTo(window.__raHash); window.__raHash = ''; }, 300);
  });

  var SALES_EMAIL = 'sales@redappledistro.com';

  /* ---------- age gate ---------- */
  var age = $('#age'), ageOk = false, intro = null;
  try { ageOk = localStorage.getItem('ra-age-ok') === '1' || localStorage.getItem('ra_age') === 'true'; } catch (e) {}
  if (!ageOk) {
    age.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    $('#age-yes').focus();
    $('#age-yes').addEventListener('click', function () {
      try { localStorage.setItem('ra-age-ok', '1'); } catch (e) {} try { localStorage.setItem('ra_age', 'true'); } catch (e) {}
      document.documentElement.style.overflow = '';
      if (motion) {
        gsap.to('.age__card', { y: -30, opacity: 0, duration: .35, ease: 'power2.in' });
        gsap.to(age, { opacity: 0, duration: .45, delay: .15, onComplete: function () { age.hidden = true; } });
        gsap.delayedCall(.3, function () { if (intro) intro.play(); });
      } else { age.hidden = true; }
    });
    $('#age-no').addEventListener('click', function () { $('#age-deny').hidden = false; $('.age__btns').hidden = true; });
  }

  /* ---------- nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), links = $('#links'), lastY = 0;
  function closeMenu() { links.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', closeMenu);
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 30);
    // hide on scroll down, show on scroll up
    if (!links.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- product tile -> preselect in quote form ---------- */
  $$('[data-product]').forEach(function (t) {
    t.addEventListener('click', function () {
      var box = $('input[name=products][value="' + t.dataset.product + '"]');
      if (box && !box.checked) {
        box.checked = true;
        if (motion) gsap.fromTo(box.nextElementSibling, { scale: 1.25 }, { scale: 1, duration: .6, delay: .7, ease: 'elastic.out(1,.5)' });
      }
    });
  });

  /* ---------- quote form ---------- */
  var form = $('#form'), msg = $('#form-msg'), done = $('#form-done');
  form.addEventListener('input', function (e) { var f = e.target.closest('.f'); if (f) f.classList.remove('is-bad'); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), bad = [];
    $$('[required]', form).forEach(function (el) {
      var ok = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
      var f = el.closest('.f');
      f.classList.remove('is-bad');
      if (!ok) { void f.offsetWidth; f.classList.add('is-bad'); bad.push(el); }
    });
    if (bad.length) { msg.textContent = 'Please fill in the highlighted fields.'; bad[0].focus(); return; }
    msg.textContent = '';
    var products = d.getAll('products').join(', ') || 'Not specified';
    var body = [
      'Business name: ' + d.get('business'),
      'Contact name: ' + d.get('name'),
      'Work email: ' + d.get('email'),
      'Shop type: ' + d.get('type'),
      'Estimated monthly volume: ' + d.get('volume'),
      'Products of interest: ' + products,
      '',
      'Notes:',
      d.get('notes') || '-'
    ].join('\n');
    // No backend yet: hand the request to the visitor's email app, addressed to sales.
    // To post to a form service instead, replace this line with a fetch() to your endpoint.
    window.location.href = 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent('Wholesale pricing request - ' + d.get('business')) + '&body=' + encodeURIComponent(body);
    done.hidden = false;
    if (motion) {
      gsap.from(done, { opacity: 0, duration: .4 });
      gsap.from($$('svg *', done), { strokeDasharray: 200, strokeDashoffset: 200, duration: .9, stagger: .25, ease: 'power2.out' });
      gsap.from($$('h3,p,button', done), { y: 20, opacity: 0, duration: .6, stagger: .08, delay: .3, ease: 'power3.out' });
    }
  });
  $('#form-again').addEventListener('click', function () { done.hidden = true; });

  /* ---------- reviews: real approved reviews from the shop (/shop/reviews.js), honest empty state when there are none ---------- */
  (function () {
    var box = $('#rev-list');
    if (!box) return;
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    var list = (Array.isArray(window.REVIEWS) ? window.REVIEWS : []).filter(function (r) { return r && r.text; }).slice(0, 3);
    var sec = box.closest('section');
    if (!list.length) { if (sec) sec.hidden = true; return; }
    if (sec) sec.hidden = false;
    box.innerHTML = list.map(function (r) {
      var n = Math.max(1, Math.min(5, Math.round(+r.rating || 5))), stars = '';
      for (var i = 1; i <= 5; i++) stars += '<i class="' + (i <= n ? 'on' : '') + '">&#9733;</i>';
      return '<article class="rcard"><div class="rcard__stars" role="img" aria-label="' + n + ' out of 5 stars">' + stars + '</div><p>' + esc(r.text) + '</p><div><b>' + esc(r.name || 'Verified shop owner') + '</b>' + (r.shop ? '<small>' + esc(r.shop) + '</small>' : '') + '</div></article>';
    }).join('');
  })();

  /* ---------- FAQ accordion (aria-expanded, keyboard accessible via native buttons) ---------- */
  $$('[data-faq]').forEach(function (item) {
    var btn = $('.faq__q', item);
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* =====================================================================
     MOTION: one hero entrance, one quiet scroll reveal, one staggered tile reveal.
     Hover effects are CSS only. The hero products follow the pointer (fine pointers only); touch gets a slow float.
     ===================================================================== */
  document.documentElement.classList.add('js-motion');
  var enter = $$('[data-enter]');
  intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  intro.to(enter, { opacity: 1, y: 0, duration: .9, stagger: .12, clearProps: 'transform' }, 0);
  if (ageOk) intro.play();

  $$('[data-rise]').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  var tiles = $$('.tile');
  gsap.set(tiles, { opacity: 0, y: 40, rotationX: 16, transformPerspective: 1000, transformOrigin: '50% 100%' });
  ScrollTrigger.batch(tiles, {
    start: 'top 92%', once: true,
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, stagger: .12, ease: 'power3.out' }); }
  });


  /* Hero: three rows of different products slide in opposite directions and speed up with the pointer. */
  (function () {
    var host = $('#rows'); if (!host) return;
    var R = [["assets/hero/r0-0.webp", "assets/hero/r0-1.webp", "assets/hero/r0-2.webp", "assets/hero/r0-3.webp", "assets/hero/r0-4.webp", "assets/hero/r0-5.webp", "assets/hero/r0-6.webp", "assets/hero/r0-7.webp", "assets/hero/r0-8.webp", "assets/hero/r0-9.webp"], ["assets/hero/r1-0.webp", "assets/hero/r1-1.webp", "assets/hero/r1-2.webp", "assets/hero/r1-3.webp", "assets/hero/r1-4.webp", "assets/hero/r1-5.webp", "assets/hero/r1-6.webp", "assets/hero/r1-7.webp", "assets/hero/r1-8.webp", "assets/hero/r1-9.webp"], ["assets/hero/r2-0.webp", "assets/hero/r2-1.webp", "assets/hero/r2-2.webp", "assets/hero/r2-3.webp", "assets/hero/r2-4.webp", "assets/hero/r2-5.webp", "assets/hero/r2-6.webp", "assets/hero/r2-7.webp", "assets/hero/r2-8.webp", "assets/hero/r2-9.webp"]];
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rows = [], sp = [.5, -.4, .35], pos = [0, 0, 0], mx = 0, vx = 0;
    R.forEach(function (set) {
      var r = document.createElement('div'); r.className = 'row'; var h = '';
      for (var k = 0; k < 2; k++) set.forEach(function (n) { h += '<img src="' + n + '" alt="" width="200" height="380" loading="lazy">'; });
      r.innerHTML = h; host.appendChild(r); rows.push(r);
    });
    var tk = $('#tk');
    if (tk) { var line = '<span>*</span>Geek Bar<span>*</span>Dozo<span>*</span>Muha Meds<span>*</span>Viva La Hemp<span>*</span>FVKD<span>*</span>One rep per account<span>*</span>Bulk quotes from 10 boxes<span>*</span>Ships in 24-48 hours'; tk.innerHTML = line + line + line + line; }
    if (rm) return;
    window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth * 2 - 1; });
    (function f() {
      vx += (mx - vx) * .07;
      rows.forEach(function (r, i) {
        pos[i] += Math.abs(sp[i]) * (1 + Math.abs(vx) * 3);
        var w = r.scrollWidth / 2, p = pos[i] % w;
        r.style.transform = 'translateX(' + (sp[i] > 0 ? -w + p : -p) + 'px)';
      });
      requestAnimationFrame(f);
    })();
  })();

  window.addEventListener('load', function () {
    if (window.__raHash) setTimeout(function () { goTo(window.__raHash); window.__raHash = ''; }, 300);
  });

  var SALES_EMAIL = 'sales@redappledistro.com';

  /* ---------- age gate ---------- */
  var age = $('#age'), ageOk = false, intro = null;
  try { ageOk = localStorage.getItem('ra-age-ok') === '1' || localStorage.getItem('ra_age') === 'true'; } catch (e) {}
  if (!ageOk) {
    age.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    $('#age-yes').focus();
    $('#age-yes').addEventListener('click', function () {
      try { localStorage.setItem('ra-age-ok', '1'); } catch (e) {} try { localStorage.setItem('ra_age', 'true'); } catch (e) {}
      document.documentElement.style.overflow = '';
      if (motion) {
        gsap.to('.age__card', { y: -30, opacity: 0, duration: .35, ease: 'power2.in' });
        gsap.to(age, { opacity: 0, duration: .45, delay: .15, onComplete: function () { age.hidden = true; } });
        gsap.delayedCall(.3, function () { if (intro) intro.play(); });
      } else { age.hidden = true; }
    });
    $('#age-no').addEventListener('click', function () { $('#age-deny').hidden = false; $('.age__btns').hidden = true; });
  }

  /* ---------- nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), links = $('#links'), lastY = 0;
  function closeMenu() { links.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', closeMenu);
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 30);
    // hide on scroll down, show on scroll up
    if (!links.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- product tile -> preselect in quote form ---------- */
  $$('[data-product]').forEach(function (t) {
    t.addEventListener('click', function () {
      var box = $('input[name=products][value="' + t.dataset.product + '"]');
      if (box && !box.checked) {
        box.checked = true;
        if (motion) gsap.fromTo(box.nextElementSibling, { scale: 1.25 }, { scale: 1, duration: .6, delay: .7, ease: 'elastic.out(1,.5)' });
      }
    });
  });

  /* ---------- quote form ---------- */
  var form = $('#form'), msg = $('#form-msg'), done = $('#form-done');
  form.addEventListener('input', function (e) { var f = e.target.closest('.f'); if (f) f.classList.remove('is-bad'); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), bad = [];
    $$('[required]', form).forEach(function (el) {
      var ok = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
      var f = el.closest('.f');
      f.classList.remove('is-bad');
      if (!ok) { void f.offsetWidth; f.classList.add('is-bad'); bad.push(el); }
    });
    if (bad.length) { msg.textContent = 'Please fill in the highlighted fields.'; bad[0].focus(); return; }
    msg.textContent = '';
    var products = d.getAll('products').join(', ') || 'Not specified';
    var body = [
      'Business name: ' + d.get('business'),
      'Contact name: ' + d.get('name'),
      'Work email: ' + d.get('email'),
      'Shop type: ' + d.get('type'),
      'Estimated monthly volume: ' + d.get('volume'),
      'Products of interest: ' + products,
      '',
      'Notes:',
      d.get('notes') || '-'
    ].join('\n');
    // No backend yet: hand the request to the visitor's email app, addressed to sales.
    // To post to a form service instead, replace this line with a fetch() to your endpoint.
    window.location.href = 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent('Wholesale pricing request - ' + d.get('business')) + '&body=' + encodeURIComponent(body);
    done.hidden = false;
    if (motion) {
      gsap.from(done, { opacity: 0, duration: .4 });
      gsap.from($$('svg *', done), { strokeDasharray: 200, strokeDashoffset: 200, duration: .9, stagger: .25, ease: 'power2.out' });
      gsap.from($$('h3,p,button', done), { y: 20, opacity: 0, duration: .6, stagger: .08, delay: .3, ease: 'power3.out' });
    }
  });
  $('#form-again').addEventListener('click', function () { done.hidden = true; });

  /* ---------- reviews: real approved reviews from the shop (/shop/reviews.js), honest empty state when there are none ---------- */
  (function () {
    var box = $('#rev-list');
    if (!box) return;
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    var list = (Array.isArray(window.REVIEWS) ? window.REVIEWS : []).filter(function (r) { return r && r.text; }).slice(0, 3);
    var sec = box.closest('section');
    if (!list.length) { if (sec) sec.hidden = true; return; }
    if (sec) sec.hidden = false;
    box.innerHTML = list.map(function (r) {
      var n = Math.max(1, Math.min(5, Math.round(+r.rating || 5))), stars = '';
      for (var i = 1; i <= 5; i++) stars += '<i class="' + (i <= n ? 'on' : '') + '">&#9733;</i>';
      return '<article class="rcard"><div class="rcard__stars" role="img" aria-label="' + n + ' out of 5 stars">' + stars + '</div><p>' + esc(r.text) + '</p><div><b>' + esc(r.name || 'Verified shop owner') + '</b>' + (r.shop ? '<small>' + esc(r.shop) + '</small>' : '') + '</div></article>';
    }).join('');
  })();

  /* ---------- FAQ accordion (aria-expanded, keyboard accessible via native buttons) ---------- */
  $$('[data-faq]').forEach(function (item) {
    var btn = $('.faq__q', item);
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* =====================================================================
     MOTION: one hero entrance, one quiet scroll reveal, one staggered tile reveal.
     Hover effects are CSS only. The hero products follow the pointer (fine pointers only); touch gets a slow float.
     ===================================================================== */
  document.documentElement.classList.add('js-motion');
  var enter = $$('[data-enter]');
  intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  intro.to(enter, { opacity: 1, y: 0, duration: .9, stagger: .12, clearProps: 'transform' }, 0);
  if (ageOk) intro.play();

  $$('[data-rise]').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  var tiles = $$('.tile');
  gsap.set(tiles, { opacity: 0, y: 40, rotationX: 16, transformPerspective: 1000, transformOrigin: '50% 100%' });
  ScrollTrigger.batch(tiles, {
    start: 'top 92%', once: true,
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, stagger: .12, ease: 'power3.out' }); }
  });


  /* Hero products: pointer-driven tilt and parallax. Front object moves most (depth).
     Transform only, eased with quickTo so it settles smoothly and retargets mid-move. */
  (function () {
    var hero = $('.hero'), stage = $('#stage');
    if (!hero || !stage) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce) return;
    var layers = [
      { el: $('.pcard--1 img', stage), d: 1.0, rz: 0 },
      { el: $('.pcard--3 img', stage), d: 1.5, rz: 0 },
      { el: $('.pcard--2 img', stage), d: 1.0, rz: 0 },
      { el: $('.disc', stage), d: -0.4, rz: 0 },
      { el: $('.ring--1', stage), d: -0.7, rz: 0 },
      { el: $('.ring--2', stage), d: -1.1, rz: 0 }
    ].filter(function (l) { return l.el; });
    if (!fine) { stage.classList.add('is-float'); return; }
    layers.forEach(function (l) {
      gsap.set(l.el, { transformPerspective: 900 });
      l.x = gsap.quickTo(l.el, 'x', { duration: .7, ease: 'power3.out' });
      l.y = gsap.quickTo(l.el, 'y', { duration: .7, ease: 'power3.out' });
      l.ry = gsap.quickTo(l.el, 'rotationY', { duration: .9, ease: 'power3.out' });
      l.rx = gsap.quickTo(l.el, 'rotationX', { duration: .9, ease: 'power3.out' });
    });
    function move(nx, ny) {
      layers.forEach(function (l) {
        l.x(nx * 16 * l.d); l.y(ny * 12 * l.d);
        if (l.d > 0) { l.ry(nx * 14 * l.d); l.rx(-ny * 10 * l.d); }
      });
    }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      move(((e.clientX - r.left) / r.width - .5) * 2, ((e.clientY - r.top) / r.height - .5) * 2);
    });
    hero.addEventListener('pointerleave', function () { move(0, 0); });
  })();


  /* 3D depth: springy pointer tilt on the hero panel and tiles (fine pointers, motion allowed). */
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    function tilt(el, max, lift) {
      gsap.set(el, { transformPerspective: 900 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'elastic.out(1,.7)' }),
          ry = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'elastic.out(1,.7)' }),
          z = gsap.quickTo(el, 'z', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        if (e.target.closest && e.target.closest('.tile__go')) { rx(0); ry(0); z(0); return; }
        var r = el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        ry(nx * max * 2); rx(-ny * max * 2); z(lift);
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); z(0); });
    }
    $$('.tile').forEach(function (t) { tilt(t, 5, 18); });
    /* Arrow pick-up: hover the arrow on a ring tile, the front product flies to it and the arrow becomes that product. */
    $$('.tile--a, .tile--c').forEach(function (tile) {
      var go = $('.tile__go', tile), arr = $('.arr', go), imgs = $$('.ring img', tile), pick = null, src = null;
      if (!go || !imgs.length) return;
      function rel(r) { var t = tile.getBoundingClientRect(); return { x: r.left - t.left, y: r.top - t.top, w: r.width, h: r.height }; }
      go.addEventListener('pointerenter', function () {
        if (pick) { gsap.killTweensOf(pick); pick.remove(); if (src) gsap.set(src, { opacity: 1 }); }
        src = imgs.reduce(function (a, b) { return b.getBoundingClientRect().width > a.getBoundingClientRect().width ? b : a; });
        var from = rel(src.getBoundingClientRect()), to = rel(go.getBoundingClientRect());
        pick = document.createElement('img'); pick.src = src.src; pick.alt = ''; pick.className = 'pickfly';
        pick.style.cssText = 'left:' + from.x + 'px;top:' + from.y + 'px;width:' + from.w + 'px;height:' + from.h + 'px;';
        tile.appendChild(pick);
        gsap.set(src, { opacity: 0 });
        var h = 34, w = from.w / from.h * h;
        gsap.killTweensOf([go, arr]);
        gsap.to(arr, { scale: 0, rotate: -90, opacity: 0, duration: .25, ease: 'power3.in' });
        gsap.to(go, { scale: 1.3, duration: .5, ease: 'back.out(1.6)' });
        gsap.to(pick, { left: to.x + to.w / 2 - w / 2, top: to.y + to.h / 2 - h / 2, width: w, height: h, rotate: 360, duration: .75, ease: 'power3.inOut' });
      });
      go.addEventListener('pointerleave', function () {
        if (!pick) return;
        var p = pick, s2 = src; pick = null;
        var to = rel(s2.getBoundingClientRect());
        gsap.to(go, { scale: 1, duration: .4, ease: 'power3.out' });
        gsap.to(arr, { scale: 1, rotate: 0, opacity: 1, duration: .35, delay: .2, ease: 'power3.out' });
        gsap.to(p, { left: to.x, top: to.y, width: to.w, height: to.h, rotate: 720, duration: .6, ease: 'power3.inOut',
          onComplete: function () { p.remove(); gsap.set(s2, { opacity: 1 }); } });
      });
    });
    var hs = $('.hero__side');
    if (hs) {
      var hero = $('.hero');
      gsap.set(hs, { transformPerspective: 1400 });
      var hrx = gsap.quickTo(hs, 'rotationX', { duration: 1.2, ease: 'power3.out' }), hry = gsap.quickTo(hs, 'rotationY', { duration: 1.2, ease: 'power3.out' });
      hero.addEventListener('pointermove', function (e) { hry((e.clientX / innerWidth - .5) * -6); hrx((e.clientY / innerHeight - .5) * 4); });
    }
  })();


  /* Brands we carry: pinned 3D brand story. Transform and opacity only. */
  (function () {
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var st = $('#story'); if (!st) return;
    var words = $$('.story__words span'), imgs = $$('.story__items img'), txt = $$('.story__txt > div'), n = words.length, sn = $('#sn'), bg = $('.story__bg');
    var hues = ['#5E1A2C', '#8C1520', '#6E2A5E', '#7A3A10', '#7A1F2B', '#8C1520'];
    function clamp(v) { return Math.max(0, Math.min(1, v)); }
    var last = -1;
    function upd(p) {
      var f = p * n;
      for (var i = 0; i < n; i++) {
        var u = f - (i + .5), a = Math.abs(u), vis = clamp(1 - a * 2.1);
        gsap.set(imgs[i], { opacity: vis, rotationY: rm ? 0 : u * -80, z: rm ? 0 : -a * 420, x: u * innerWidth * .22, scale: 1 - a * .18, xPercent: -50, yPercent: -50, transformPerspective: 1200 });
        gsap.set(words[i], { opacity: clamp(1 - a * 1.8) * .95, y: rm ? 0 : u * -140, xPercent: -50, yPercent: -50, scale: 1 + a * .12 });
        gsap.set(txt[i], { opacity: clamp(1 - a * 3.2), y: u * 40, pointerEvents: a < .3 ? 'auto' : 'none' });
      }
      var idx = Math.min(n - 1, Math.max(0, Math.floor(f)));
      if (idx !== last) { last = idx; sn.textContent = '0' + (idx + 1); bg.style.setProperty('--sg', hues[idx]); st.querySelector('.story__bg').style.setProperty('--sg', hues[idx]); }
    }
    upd(0);
    ScrollTrigger.create({ trigger: st, start: 'top top', end: 'bottom bottom', onUpdate: function (s) { upd(s.progress); } });
  })();


  /* Category tile effects: sparks, smoke and glints over the photos (canvas, paused off-screen). */
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cfg = {
      edibles: { n: 46, make: function (w, h) { return { x: w * (.35 + Math.random() * .4), y: h * (.35 + Math.random() * .4), vx: (Math.random() - .5) * .15, vy: -.1 - Math.random() * .25, r: .6 + Math.random() * 1.8, life: 0, max: 120 + Math.random() * 140, c: '255,214,150', tw: 1 }; } },
      prerolls: { n: 34, make: function (w, h) { return { x: w * (.66 + Math.random() * .1), y: h * (.58 + Math.random() * .06), vx: (Math.random() - .35) * .35, vy: -.35 - Math.random() * .5, r: 10 + Math.random() * 18, life: 0, max: 130 + Math.random() * 120, c: '235,225,215', smoke: 1 }; } },
      flower: { n: 40, make: function (w, h) { return { x: w * (.45 + Math.random() * .22), y: h * (.5 + Math.random() * .2), vx: (Math.random() - .5) * .5, vy: -.6 - Math.random() * 1.1, r: .8 + Math.random() * 1.8, life: 0, max: 70 + Math.random() * 90, c: '255,170,70', tw: 1 }; } }
    };
    Array.prototype.forEach.call(document.querySelectorAll('canvas.fx'), function (cv) {
      var k = cfg[cv.getAttribute('data-fx')]; if (!k) return;
      var ctx = cv.getContext('2d'), W = 0, H = 0, ps = [], on = false, raf = 0;
      function size() { var d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
      function frame() {
        raf = 0; if (!on) return; ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
        while (ps.length < k.n) { var p = k.make(W, H); p.life = Math.random() * p.max * (ps.length < k.n / 2 ? 1 : 0); ps.push(p); }
        for (var i = ps.length - 1; i >= 0; i--) {
          var p = ps[i]; p.life++; if (p.life > p.max) { ps[i] = k.make(W, H); continue; }
          p.x += p.vx + (p.smoke ? Math.sin(p.life * .04 + i) * .25 : 0); p.y += p.vy;
          var t = p.life / p.max, a = Math.sin(t * Math.PI) * (p.smoke ? .09 : .9);
          if (p.tw) a *= .6 + .4 * Math.sin(p.life * .3 + i);
          var rad = p.smoke ? p.r * (1 + t * 2.4) : p.r;
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * (p.smoke ? 1 : 3));
          g.addColorStop(0, 'rgba(' + p.c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad * (p.smoke ? 1 : 3), 0, 6.283); ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      size(); window.addEventListener('resize', size);
      new IntersectionObserver(function (e) { on = e[0].isIntersecting; if (on && !raf) { size(); raf = requestAnimationFrame(frame); } }, { threshold: .05 }).observe(cv);
    });
  })();

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
