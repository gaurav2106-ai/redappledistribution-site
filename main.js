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
        gsap.delayedCall(.3, function () { intro.play(); });
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

  if (!motion) return;

  /* =====================================================================
     MOTION
     ===================================================================== */
  function hold(els) { els.forEach(function (e) { e.style.transition = 'none'; }); return els; }
  function release(els) { return function () { els.forEach(function (e) { e.style.transition = ''; }); }; }

  gsap.from('.age__card', { y: 40, opacity: 0, scale: .94, duration: .7, ease: 'back.out(1.6)' });
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ----- ribbon marquee, reacts to scroll velocity ----- */
  var rib = null, ribV = { v: 1 };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    var track = $('#ribbon'), html = track.innerHTML, w = track.scrollWidth;
    for (var i = 0, n = Math.ceil(window.innerWidth / w) + 1; i < n; i++) track.insertAdjacentHTML('beforeend', html);
    rib = gsap.to(track, { x: -w, duration: w / 80, ease: 'none', repeat: -1 });
    ScrollTrigger.refresh();
  });
  ScrollTrigger.create({
    onUpdate: function (self) {
      if (!rib) return;
      var v = gsap.utils.clamp(-7, 7, self.getVelocity() / 220);
      ribV.v = (v < 0 ? -1 : 1) * (1 + Math.abs(v));
      gsap.to(ribV, { v: self.direction < 0 ? -1 : 1, duration: .9, ease: 'power2.out', overwrite: true, onUpdate: function () { rib.timeScale(ribV.v); } });
    }
  });

  /* ----- hero intro ----- */
  var cards = $$('.pcard');
  intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  intro
    .from('.nav__logo', { y: -30, opacity: 0, duration: .7 }, 0)
    .from(hold($$('#links > *')), { y: -30, opacity: 0, duration: .7, stagger: .08, clearProps: 'transform', onComplete: release($$('#links > *')) }, .05)
    .from('.hero__glow', { scale: .3, opacity: 0, duration: 2, ease: 'power2.out' }, 0)
    .from('.hero__grid', { opacity: 0, duration: 1.5 }, .2)
    .from('#hero-badge', { clipPath: 'inset(0 100% 0 0)', duration: .8, ease: 'power3.inOut' }, .2)
    .from('.hero__h .ln > span', { yPercent: 110, duration: 1.1, stagger: .11 }, .35)
    .from('.hero__h .ln--red > span', { color: '#ffffff', duration: .6, ease: 'none' }, 1.1)
    .from('.hero__p', { y: 26, opacity: 0, duration: .8 }, 1.05)
    .from(hold($$('.hero__cta .btn')), { y: 26, opacity: 0, duration: .7, stagger: .1 }, 1.2)
    .from(cards, {
      y: 320, opacity: 0, scale: .55, rotation: function (i) { return [-45, 35, -28][i]; },
      duration: 1.4, stagger: .14, ease: 'back.out(1.2)'
    }, .55)
    .from('.hero__scroll', { opacity: 0, duration: .8 }, 1.8)
    .add(function () {
      cards.forEach(function (c, i) {
        gsap.to(c, { yPercent: i % 2 ? 5 : -5, rotation: i % 2 ? -1.5 : 1.5, duration: 3 + i * .6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    }, 2);
  if (ageOk) intro.play();

  /* ----- hero: mouse parallax, glow follow, scroll parallax ----- */
  var hero = $('#hero'), stage = $('#stage'), mouse = { x: -999, y: -999 };
  var movers = cards.map(function (c) {
    var inner = c.firstElementChild;
    return { d: +c.dataset.depth, x: gsap.quickTo(inner, 'x', { duration: .8, ease: 'power3.out' }), y: gsap.quickTo(inner, 'y', { duration: .8, ease: 'power3.out' }) };
  });
  var tiltX = gsap.quickTo(stage, 'rotationY', { duration: .9, ease: 'power3.out' });
  var tiltY = gsap.quickTo(stage, 'rotationX', { duration: .9, ease: 'power3.out' });
  var glowX = gsap.quickTo('.hero__glow', 'x', { duration: 1.6, ease: 'power3.out' });
  var glowY = gsap.quickTo('.hero__glow', 'y', { duration: 1.6, ease: 'power3.out' });
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    movers.forEach(function (m) { m.x(nx * m.d * 1.6); m.y(ny * m.d * 1.6); });
    tiltX(nx * 12); tiltY(-ny * 9); glowX(nx * 160); glowY(ny * 110);
  });
  hero.addEventListener('pointerleave', function () {
    mouse.x = mouse.y = -999;
    movers.forEach(function (m) { m.x(0); m.y(0); });
    tiltX(0); tiltY(0); glowX(0); glowY(0);
  });
  gsap.to('.hero__glow', { scale: 1.12, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
  gsap.to('.hero__grid', { x: 60, y: 60, duration: 8, ease: 'none', repeat: -1 });
  var heroSt = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(stage, { yPercent: -22, ease: 'none', scrollTrigger: heroSt });
  gsap.to('.hero__copy', { yPercent: 14, opacity: .15, ease: 'none', scrollTrigger: heroSt });
  gsap.to('.hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=200', scrub: true } });

  /* ----- hero: drifting smoke/ember particles ----- */
  (function () {
    var cv = $('#fx'), ctx = cv.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [], on = true;
    function size() { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(init) {
      var ember = Math.random() < .3;
      return ember
        ? { e: 1, x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: 1 + Math.random() * 1.8, vy: .4 + Math.random() * .9, vx: (Math.random() - .5) * .4, a: .5 + Math.random() * .5, p: Math.random() * 6.28 }
        : { e: 0, x: Math.random() * W, y: init ? Math.random() * H : H + 80, r: 40 + Math.random() * 90, vy: .12 + Math.random() * .35, vx: (Math.random() - .5) * .25, a: .03 + Math.random() * .06, p: Math.random() * 6.28 };
    }
    size();
    for (var i = 0; i < (W < 700 ? 22 : 46); i++) parts.push(spawn(true));
    window.addEventListener('resize', size);
    ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: function (s) { on = s.isActive; } });
    gsap.ticker.add(function (t) {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy; p.x += p.vx + Math.sin(t * .6 + p.p) * .3;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 30000) { var f = (1 - d2 / 30000) * 1.8, d = Math.sqrt(d2) || 1; p.x += dx / d * f; p.y += dy / d * f; }
        if (p.y < -p.r) { parts[i] = spawn(false); continue; }
        if (p.e) {
          ctx.fillStyle = 'rgba(255,90,60,' + (p.a * (.6 + .4 * Math.sin(t * 3 + p.p))) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        } else {
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, 'rgba(255,60,60,' + p.a + ')'); g.addColorStop(1, 'rgba(255,60,60,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        }
      }
    });
  })();

  /* ----- headings: masked line reveal ----- */
  $$('[data-lines]').forEach(function (h) {
    gsap.from($$('.ln > span', h), { yPercent: 110, duration: 1.05, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('[data-rise]').forEach(function (el) {
    gsap.from(hold([el]), { y: 34, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'transform', onComplete: release([el]), scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* ----- bento tiles: curtain reveal, image parallax, hover tilt ----- */
  var tiles = $$('.tile');
  gsap.set(tiles, { clipPath: 'inset(100% 0 0 0)', y: 50 });
  ScrollTrigger.batch(tiles, {
    start: 'top 90%', once: true,
    onEnter: function (b) {
      gsap.to(b, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.1, stagger: .12, ease: 'power4.out', clearProps: 'clipPath' });
      b.forEach(function (t, i) {
        gsap.from($$('.tile__body > *, :scope > h3, .tile__ask', t), { y: 26, opacity: 0, duration: .7, stagger: .07, delay: .35 + i * .12, ease: 'power3.out' });
      });
    }
  });
  tiles.forEach(function (t) {
    var img = $('img', t);
    if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (!window.matchMedia('(hover:hover)').matches) return;
    gsap.set(t, { transformPerspective: 900 });
    var rx = gsap.quickTo(t, 'rotationX', { duration: .5, ease: 'power3.out' }), ry = gsap.quickTo(t, 'rotationY', { duration: .5, ease: 'power3.out' });
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - .5) * 6); rx(-(py - .5) * 6);
      t.style.setProperty('--mx', px * 100 + '%'); t.style.setProperty('--my', py * 100 + '%');
    });
    t.addEventListener('pointerleave', function () { rx(0); ry(0); });
  });
  $('.tile--f').insertAdjacentHTML('afterbegin', '<span class="sheen"></span>');

  /* ----- stats: cards rise, icons draw, numbers count ----- */
  var stats = hold($$('.stat'));
  var stTrig = { trigger: '#stats', start: 'top 85%' };
  gsap.from(stats, { y: 50, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform', onComplete: release(stats), scrollTrigger: stTrig });
  $$('.stat svg *').forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 80;
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, delay: .3, ease: 'power2.inOut', scrollTrigger: stTrig });
  });
  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 1.6, delay: .2, ease: 'power3.out', scrollTrigger: stTrig, onUpdate: function () { el.textContent = Math.round(o.v); } });
  });

  /* ----- stock up: frame wipes open, red line draws, outlined word slides ----- */
  gsap.from('.frame__pic', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: '#frame', start: 'top 80%' } });
  gsap.from('.frame__line', { clipPath: 'inset(0 100% 0 0)', duration: 1.2, delay: .35, ease: 'power3.inOut', scrollTrigger: { trigger: '#frame', start: 'top 80%' } });
  gsap.fromTo('.mosaic', { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1, ease: 'none', scrollTrigger: { trigger: '#frame', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('#frame-word', { xPercent: 45, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '#frame', start: 'top 95%', end: 'center 55%', scrub: .6 } });

  /* ----- quote form: fields cascade in ----- */
  gsap.from('#form', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#form', start: 'top 85%' } });
  gsap.from($$('#form > .f, #form > .form__row, #form > .btn'), { y: 24, opacity: 0, duration: .7, stagger: .08, delay: .2, ease: 'power3.out', clearProps: 'transform', scrollTrigger: { trigger: '#form', start: 'top 85%' } });

  /* ----- footer: giant word rises letter by letter ----- */
  var fw = $('#foot-word');
  fw.innerHTML = fw.textContent.split('').map(function (c) { return c === ' ' ? ' ' : '<span>' + c + '</span>'; }).join('');
  gsap.from($$('span', fw), { yPercent: 100, ease: 'none', stagger: .08, scrollTrigger: { trigger: fw, start: 'top bottom', end: 'bottom bottom', scrub: .5 } });
  gsap.from('.foot__top > *', { y: 30, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 90%' } });

  /* ----- magnetic buttons ----- */
  if (window.matchMedia('(hover:hover)').matches) {
    $$('.hero__cta .btn, .nav__links .btn, .stock .btn').forEach(function (b) {
      var x = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3.out' }), y = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3.out' });
      b.addEventListener('pointerenter', function () { b.style.transition = 'color .3s, border-color .3s'; });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .25); y((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener('pointerleave', function () { x(0); y(0); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
