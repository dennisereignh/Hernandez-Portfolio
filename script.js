/* Dennise Hernandez — Portfolio scripts */
(function () {
  'use strict';
  // Optional: paste a Formspree (or similar) endpoint here to receive messages directly,
  // e.g. 'https://formspree.io/f/xxxxxxx'. If empty, the form opens the visitor's email app.
  var FORM_ENDPOINT = 'api/contact.php';
  var EMAIL = 'dennisereignh@gmail.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  /* Theme */
  var root = document.documentElement;
  var saved = safe(function () { return localStorage.getItem('theme'); });
  if (!saved && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) saved = 'dark';
  if (saved) root.setAttribute('data-theme', saved);
  var themeBtn = $('#theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    safe(function () { localStorage.setItem('theme', next); });
  });

  /* Mobile menu */
  var menuBtn = $('#menu'), links = $('#links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    $$('a', links).forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); }); });
  }

  /* Missing-image placeholders */
  $$('img[data-fallback]').forEach(function (img) {
    function swap() {
      var d = document.createElement('div');
      d.className = 'ph';
      d.setAttribute('role', 'img');
      d.setAttribute('aria-label', img.alt);
      d.textContent = img.alt;
      img.replaceWith(d);
    }
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });
  $$('img[data-svg]').forEach(function (img) {
    function swap() {
      var svg = img.getAttribute('data-svg'), s = document.createElement('span');
      if (svg.indexOf('<svg') === 0) { s.innerHTML = svg; s.style.display = 'contents'; img.replaceWith(s); } else { var p = img.parentNode; if (p.classList) p.classList.add('fb'); img.replaceWith(document.createTextNode(svg)); }
    }
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });
  $$('img.avatar, img.about-photo').forEach(function (img) {
    function swap() {
      var d = document.createElement('div');
      d.className = img.className + ' avatar-fallback';
      d.textContent = 'DH';
      img.replaceWith(d);
    }
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
  });
  // Hero background only if b2.jpg exists
  var hero = $('.hero');
  if (hero) {
    var t = new Image();
    t.onload = function () { hero.classList.add('has-bg'); };
    t.src = 'imgs/b2.jpg';
  }

  /* Scroll reveal + skill bars */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.bar i', e.target).forEach(function (b) { b.style.width = b.dataset.w + '%'; });
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 }) : null;
  $$('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  if (!io) $$('.bar i').forEach(function (b) { b.style.width = b.dataset.w + '%'; });

  /* Count-up stats */
  $$('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, done = false;
    function run() {
      if (done) return; done = true;
      var s = performance.now();
      (function tick(n) {
        var p = Math.min((n - s) / 1100, 1);
        el.textContent = Math.round(end * p) + (el.dataset.suffix || '');
        if (p < 1) requestAnimationFrame(tick);
      })(s);
    }
    if (io) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }).observe(el); else run();
  });

  /* Project filters */
  var chips = $$('.chip');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      c.classList.add('active'); c.setAttribute('aria-pressed', 'true');
      var f = c.dataset.filter;
      $$('[data-cat]').forEach(function (card) {
        card.classList.toggle('hidden', f !== 'all' && card.dataset.cat.split(' ').indexOf(f) === -1);
      });
    });
  });

  /* Lightbox */
  var items = $$('.gallery .gitem');
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<span class="count"></span><button class="x" aria-label="Close">×</button><button class="pv" aria-label="Previous">‹</button><img alt=""><p></p><button class="nx" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    var i = 0, lastFocus;
    var show = function (n) {
      i = (n + items.length) % items.length;
      var src = $('img', items[i]);
      var im = $('img', lb), cap = $('figcaption', items[i]);
      if (src) { im.style.display = ''; im.src = src.currentSrc || src.src; im.alt = src.alt; } else { im.style.display = 'none'; }
      $('p', lb).textContent = cap ? cap.textContent : (src ? src.alt : '');
      $('.count', lb).textContent = (i + 1) + ' / ' + items.length;
    };
    var open = function (n) { lastFocus = document.activeElement; show(n); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.x', lb).focus(); };
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    items.forEach(function (it, n) {
      it.tabIndex = 0; it.setAttribute('role', 'button');
      it.addEventListener('click', function () { open(n); });
      it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
    });
    $('.x', lb).onclick = close;
    $('.pv', lb).onclick = function () { show(i - 1); };
    $('.nx', lb).onclick = function () { show(i + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    });
  }

  /* Back to top */
  var top = $('#top');
  if (top) {
    addEventListener('scroll', function () { top.classList.toggle('show', scrollY > 500); }, { passive: true });
    top.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* Contact form */
  var form = $('#contact-form');
  if (form) {
    var status = $('.status', form);
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
      message: function (v) { return v.trim().length >= 10 ? '' : 'Message should be at least 10 characters.'; }
    };
    function check(el) {
      var msg = rules[el.name](el.value), f = el.closest('.field');
      f.classList.toggle('bad', !!msg); $('.err', f).textContent = msg; return !msg;
    }
    $$('input,textarea', form).forEach(function (el) {
      if (rules[el.name]) el.addEventListener('blur', function () { check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('.hp input', form).value) return; // honeypot
      var ok = $$('input,textarea', form).filter(function (el) { return rules[el.name]; }).map(check).every(Boolean);
      if (!ok) { status.className = 'status fail'; status.textContent = 'Please fix the highlighted fields.'; return; }
      var d = { name: form.name.value.trim(), email: form.email.value.trim(), message: form.message.value.trim() };
      if (FORM_ENDPOINT) {
        status.className = 'status'; status.textContent = 'Sending…';
        fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
          .then(function (r) { if (!r.ok) throw 0; status.className = 'status ok'; status.textContent = 'Thank you! Your message has been sent.'; form.reset(); })
          .catch(function () {
            // Server/database not reachable (e.g. page opened by double-click): fall back to the email app
            var body = 'Hi Dennise,\n\n' + d.message + '\n\n— ' + d.name + ' (' + d.email + ')';
            status.className = 'status fail';
            status.textContent = 'Could not save to the database. Opening your email app instead…';
            location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Portfolio message from ' + d.name) + '&body=' + encodeURIComponent(body);
          });
      } else {
        var body = 'Hi Dennise,\n\n' + d.message + '\n\n— ' + d.name + ' (' + d.email + ')';
        location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Portfolio message from ' + d.name) + '&body=' + encodeURIComponent(body);
        status.className = 'status ok'; status.textContent = 'Opening your email app… if nothing happens, write to ' + EMAIL + '.';
      }
    });
  }
  var copy = $('#copy-email');
  if (copy) copy.addEventListener('click', function (e) {
    e.preventDefault();
    (navigator.clipboard ? navigator.clipboard.writeText(EMAIL) : Promise.reject()).then(function () {
      copy.querySelector('b').textContent = 'Copied to clipboard ✓';
      setTimeout(function () { copy.querySelector('b').textContent = EMAIL; }, 2000);
    }).catch(function () { location.href = 'mailto:' + EMAIL; });
  });
})();
