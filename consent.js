/* Red Apple Distribution - cookie and alerts consent (landing + shop). Exposes window.RAConsent { get, onChange, open }.
   No third-party scripts. Nothing optional is stored or registered before the visitor chooses. */
(function () {
  'use strict';
  var KEY = 'ra_consent', PUSHKEY = 'ra_push', VERSION = 1, DAYS = 180;
  var CFG = window.RA_PUSH = Object.assign({ provider: 'none', vapidPublicKey: '', subscribeEndpoint: '' }, window.RA_PUSH || {});
  var listeners = [], state = null, barEl = null, panelEl = null, backEl = null, toastEl = null, toastTimer = 0, lastFocus = null;

  /* ---------- storage ---------- */
  function readCookie() {
    var m = document.cookie.match(/(?:^|;\s*)ra_consent=([^;]*)/);
    try { return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch (e) { return null; }
  }
  function valid(o) {
    return o && o.v === VERSION && typeof o.ts === 'number' && Date.now() - o.ts < DAYS * 864e5;
  }
  function load() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!valid(o)) o = readCookie();
    return valid(o) ? { v: VERSION, essential: true, analytics: !!o.analytics, notifications: !!o.notifications, ts: o.ts } : null;
  }
  function store(o) {
    var s = JSON.stringify(o);
    try { localStorage.setItem(KEY, s); } catch (e) {}
    try {
      document.cookie = KEY + '=' + encodeURIComponent(s) + '; path=/; max-age=' + (DAYS * 86400) + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    } catch (e) {}
  }

  /* ---------- push ---------- */
  var canSW = 'serviceWorker' in navigator;
  function getPush() { try { return JSON.parse(localStorage.getItem(PUSHKEY)); } catch (e) { return null; } }
  function setPush(o) { try { localStorage.setItem(PUSHKEY, JSON.stringify(o)); } catch (e) {} }
  function registerSW() {
    if (!canSW) return Promise.resolve(null);
    return navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () { return null; });
  }
  function unregisterAll() {
    try { localStorage.removeItem(PUSHKEY); } catch (e) {}
    if (!canSW) return Promise.resolve();
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) {
        var p = r.pushManager ? r.pushManager.getSubscription().then(function (s) { return s ? s.unsubscribe() : null; }).catch(function () {}) : Promise.resolve();
        return p.then(function () { return r.unregister(); });
      }));
    }).catch(function () {});
  }
  function b64(k) {
    var p = '='.repeat((4 - k.length % 4) % 4), s = (k + p).replace(/-/g, '+').replace(/_/g, '/'), r = atob(s), a = new Uint8Array(r.length);
    for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
    return a;
  }
  /* Called only from a visitor click on "Enable alerts". Returns 'pending' | 'on' | 'denied' | 'unsupported'. */
  function enableAlerts() {
    var rec = { consented: true, subscribed: false, ts: Date.now() };
    if (!CFG.vapidPublicKey) { setPush(rec); return Promise.resolve('pending'); }
    if (!canSW || !('Notification' in window) || !('PushManager' in window)) { setPush(rec); return Promise.resolve('unsupported'); }
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') { setPush(rec); return 'denied'; }
      return registerSW().then(function () { return navigator.serviceWorker.ready; }).then(function (reg) {
        return reg.pushManager.getSubscription().then(function (s) {
          return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(CFG.vapidPublicKey) });
        });
      }).then(function (sub) {
        rec.subscribed = true; setPush(rec);
        if (CFG.subscribeEndpoint) {
          try { fetch(CFG.subscribeEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()), keepalive: true }).catch(function () {}); } catch (e) {}
        }
        return 'on';
      });
    }).catch(function () { setPush(rec); return 'unsupported'; });
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function afterPaint(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  var FOC = 'button:not([disabled]),[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])';

  /* ---------- bar ---------- */
  function buildBar() {
    var b = el('section', 'rac');
    b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Cookie and notification choices');
    b.innerHTML =
      '<div class="rac__in">' +
      '<div class="rac__mark" aria-hidden="true"><img src="/assets/red-apple-mark.svg" alt="" width="52" height="52"><i></i><i></i><i></i><i></i></div>' +
      '<div class="rac__t"><h2 class="rac__h">We use cookies. Pick your <em>side.</em></h2>' +
      '<p class="rac__p">Essential cookies keep the site working. Accept all to also allow analytics and let us send you new-drop and restock alerts on this device.</p></div>' +
      '<div class="rac__b"><button type="button" class="rac-btn rac-btn--red" data-r="all">Accept all</button>' +
      '<button type="button" class="rac-btn rac-btn--ghost" data-r="ess">Essential only</button>' +
      '<button type="button" class="rac-link" data-r="cust">Customize</button></div></div>';
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-r]'); if (!t) return;
      var r = t.getAttribute('data-r');
      if (r === 'all') choose({ analytics: true, notifications: true });
      else if (r === 'ess') choose({ analytics: false, notifications: false });
      else openPanel(t);
    });
    return b;
  }
  function showBar() {
    if (barEl || state) return;
    barEl = buildBar(); document.body.appendChild(barEl);
    afterPaint(function () { barEl && barEl.classList.add('is-in'); });
  }
  function hideBar() {
    if (!barEl) return; var b = barEl; barEl = null;
    b.classList.remove('is-in'); b.classList.add('is-out');
    setTimeout(function () { b.remove(); }, 450);
  }

  /* ---------- panel ---------- */
  function row(id, title, text, on, locked) {
    return '<div class="rac-row"><b>' + title + (locked ? '<span class="rac-tag">Always on</span>' : '') + '</b>' +
      '<label class="rac-sw-w"><input type="checkbox" role="switch" id="rac-' + id + '" ' + (on ? 'checked ' : '') + (locked ? 'disabled ' : '') + 'aria-label="' + title + '"><span class="rac-sw" aria-hidden="true"></span></label>' +
      '<small>' + text + '</small></div>';
  }
  function openPanel(from) {
    if (panelEl) return;
    lastFocus = from || document.activeElement;
    var cur = state || { analytics: false, notifications: false };
    backEl = el('div', 'rac-back'); backEl.addEventListener('click', function () { closePanel(); });
    panelEl = el('div', 'rac-panel');
    panelEl.setAttribute('role', 'dialog'); panelEl.setAttribute('aria-modal', 'true'); panelEl.setAttribute('aria-labelledby', 'rac-ph');
    panelEl.innerHTML =
      '<div class="rac-panel__hd"><div><h2 class="rac-panel__h" id="rac-ph" tabindex="-1">Your <em>choices</em></h2>' +
      '<p class="rac-panel__sub">Change this any time from Cookie settings in the footer.</p></div>' +
      '<button type="button" class="rac-x" data-r="close" aria-label="Close cookie settings">&times;</button></div>' +
      '<div class="rac-panel__bd">' +
      row('ess', 'Essential', 'Keeps the site working: your 21+ confirmation, your quote list and this choice. Cannot be turned off.', true, true) +
      row('ana', 'Analytics', 'Anonymous visit stats so we can improve the site. Off unless you allow it.', cur.analytics, false) +
      row('not', 'Notifications and marketing', 'New drops, restocks and trending picks sent to this device. Your browser only asks after you tap Enable alerts.', cur.notifications, false) +
      '</div><div class="rac-panel__ft"><button type="button" class="rac-btn rac-btn--red" data-r="save">Save choices</button></div>';
    panelEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-r]'); if (!t) return;
      if (t.getAttribute('data-r') === 'close') closePanel();
      else choose({ analytics: panelEl.querySelector('#rac-ana').checked, notifications: panelEl.querySelector('#rac-not').checked });
    });
    document.body.appendChild(backEl); document.body.appendChild(panelEl);
    if (barEl) barEl.setAttribute('aria-hidden', 'true');
    afterPaint(function () { if (!panelEl) return; backEl.classList.add('is-in'); panelEl.classList.add('is-in'); panelEl.querySelector('#rac-ph').focus(); });
    document.addEventListener('keydown', onKey, true);
  }
  function closePanel(skipFocus) {
    if (!panelEl) return;
    var p = panelEl, bk = backEl; panelEl = backEl = null;
    document.removeEventListener('keydown', onKey, true);
    p.classList.remove('is-in'); bk.classList.remove('is-in');
    setTimeout(function () { p.remove(); bk.remove(); }, 450);
    if (barEl) barEl.removeAttribute('aria-hidden');
    if (!skipFocus && lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) {
    if (!panelEl) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePanel(); return; }
    if (e.key !== 'Tab') return;
    var f = [].slice.call(panelEl.querySelectorAll(FOC)).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (!panelEl.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (a === first || a.id === 'rac-ph')) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- toast ---------- */
  function hideToast() {
    clearTimeout(toastTimer);
    if (!toastEl) return; var t = toastEl; toastEl = null;
    t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 450);
  }
  function showToast(title, text, withEnable) {
    hideToast();
    var t = el('div', 'rac-toast');
    t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
    t.innerHTML = '<b>' + title + '</b><p>' + text + '</p>' + (withEnable ? '<div class="rac-toast__b"><button type="button" class="rac-btn rac-btn--red" data-t="enable">Enable alerts</button><button type="button" class="rac-btn rac-btn--ghost" data-t="no">Not now</button></div>' : '');
    t.addEventListener('click', function (e) {
      var x = e.target.closest('[data-t]'); if (!x) return;
      if (x.getAttribute('data-t') === 'no') return hideToast();
      x.disabled = true;
      enableAlerts().then(function (r) {
        if (r === 'on') showToast('Alerts are on', 'We will let you know about new drops and restocks on this device.', false);
        else if (r === 'denied') showToast('Alerts are blocked', 'Your browser has notifications blocked for this site. You can allow them in your browser settings.', false);
        else if (r === 'unsupported') showToast('Not available here', 'This browser cannot receive web alerts. Your choice is saved.', false);
        else showToast('You are on the list', 'Your choice is saved. Alerts start once we switch them on - nothing else to do.', false);
        toastTimer = setTimeout(hideToast, 7000);
      });
    });
    document.body.appendChild(t); toastEl = t;
    afterPaint(function () { t.classList.add('is-in'); });
    toastTimer = setTimeout(hideToast, withEnable ? 20000 : 7000);
  }

  /* ---------- choose / apply ---------- */
  function choose(c) {
    var prev = state;
    state = { v: VERSION, essential: true, analytics: !!c.analytics, notifications: !!c.notifications, ts: Date.now() };
    store(state);
    closePanel(true); hideBar();
    var was = !!(prev && prev.notifications);
    if (state.notifications && !was) {
      var rec = getPush(); if (!rec) setPush({ consented: true, subscribed: false, ts: Date.now() });
      registerSW();
      showToast('Alerts, your call', 'Tap Enable alerts to get new-drop and restock notifications on this device. Your browser will ask once.', true);
    } else if (!state.notifications && was) {
      unregisterAll();
      showToast('Alerts are off', 'We removed alerts from this device. You can turn them back on in Cookie settings.', false);
    } else if (!state.notifications) {
      unregisterAll();
    }
    listeners.slice().forEach(function (cb) { try { cb(JSON.parse(JSON.stringify(state))); } catch (e) {} });
  }

  /* ---------- public API ---------- */
  window.RAConsent = {
    get: function () { return state ? JSON.parse(JSON.stringify(state)) : null; },
    onChange: function (cb) {
      if (typeof cb !== 'function') return function () {};
      listeners.push(cb);
      return function () { listeners = listeners.filter(function (x) { return x !== cb; }); };
    },
    open: function () { openPanel(document.activeElement); }
  };

  /* footer "Cookie settings" links (capture phase so the shop router never sees the click) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-ra-cookie-settings]');
    if (!a) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    openPanel(a);
  }, true);

  /* ---------- start: only after the age gate is passed ---------- */
  function ageOK() {
    try { return localStorage.getItem('ra-age-ok') === '1' || localStorage.getItem('ra_age') === 'true' || localStorage.getItem('ra_age') === '"true"'; } catch (e) { return true; }
  }
  function hasGate() { return !!(document.getElementById('age') || document.getElementById('agegate') || document.querySelector('.agegate-wrap')); }
  function start() {
    state = load();
    if (state) { if (state.notifications) registerSW(); return; }
    var waited = false;
    function tick() {
      if (state || barEl) return;
      if (!hasGate()) { setTimeout(showBar, 1200); return; }
      if (ageOK()) { setTimeout(function () { if (!state && ageOK()) showBar(); }, waited ? 900 : 1200); return; }
      waited = true; setTimeout(tick, 250);
    }
    tick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
