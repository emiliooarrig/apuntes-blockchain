/* =========================================================
   ChainNotes — interacciones y animaciones
   Vanilla JS, sin dependencias.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Tema claro / oscuro ---------- */
  (function theme() {
    var root = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    var stored = null;

    try { stored = localStorage.getItem('chainnotes-theme'); } catch (e) { /* modo privado */ }

    var initial = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.setAttribute('data-theme', initial);

    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('chainnotes-theme', next); } catch (e) { /* ignorado */ }

      // Reinicia la animación del icono
      var icon = toggle.querySelector('svg');
      if (icon) {
        icon.style.animation = 'none';
        void icon.offsetWidth;
        icon.style.animation = '';
      }
    });
  })();

  /* ---------- 2. Header pegajoso + barra de progreso ---------- */
  (function scrollUI() {
    var header = document.getElementById('header');
    var bar = document.getElementById('progressBar');
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;

      if (header) header.classList.toggle('is-stuck', y > 24);

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (y / max) * 100 : 0;
        bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  })();

  /* ---------- 3. Menú móvil ---------- */
  (function mobileNav() {
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!burger || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
    }

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) close();
    });
  })();

  /* ---------- 4. Revelado al hacer scroll ---------- */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 5. Contadores animados ---------- */
  (function counters() {
    var nums = document.querySelectorAll('.stat__num');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var suffix = el.dataset.suffix || '';

      if (reduced) { el.textContent = target + suffix; return; }

      var duration = 1500;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 6. Scroll spy del menú ---------- */
  (function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var section = document.querySelector(id);
      if (!section) return;
      map[id.slice(1)] = link;
      sections.push(section);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = map[entry.target.id];
        if (!link) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  })();

  /* ---------- 7. Inclinación 3D y brillo en tarjetas ---------- */
  (function tilt() {
    if (reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var cards = document.querySelectorAll('[data-tilt]');
    var MAX = 7; // grados

    cards.forEach(function (card) {
      var frame = null;

      card.addEventListener('mousemove', function (e) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;

          var rotY = (px - 0.5) * (MAX * 2);
          var rotX = (0.5 - py) * (MAX * 2);

          card.style.transform =
            'perspective(900px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' +
            rotY.toFixed(2) + 'deg) translateY(-6px)';

          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          frame = null;
        });
      });

      card.addEventListener('mouseleave', function () {
        if (frame) { window.cancelAnimationFrame(frame); frame = null; }
        card.style.transform = '';
      });
    });
  })();

  /* ---------- 8. Parallax de los blobs del hero ---------- */
  (function parallax() {
    if (reduced) return;

    var blobs = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var hero = document.querySelector('.hero');
    if (!blobs.length || !hero) return;

    var ticking = false;
    var pointer = { x: 0, y: 0 };

    function apply() {
      var y = window.scrollY || window.pageYOffset;

      // Solo trabaja mientras el hero es visible
      if (y < hero.offsetHeight + 200) {
        blobs.forEach(function (blob) {
          var speed = parseFloat(blob.dataset.parallax) || 0;
          var dy = y * speed;
          var dx = pointer.x * speed * 34;
          var tilt = pointer.y * speed * 26;
          blob.style.translate = dx.toFixed(1) + 'px ' + (dy + tilt).toFixed(1) + 'px';
        });
      }
      ticking = false;
    }

    function request() {
      if (!ticking) { window.requestAnimationFrame(apply); ticking = true; }
    }

    window.addEventListener('scroll', request, { passive: true });

    hero.addEventListener('mousemove', function (e) {
      pointer.x = (e.clientX / window.innerWidth) - 0.5;
      pointer.y = (e.clientY / window.innerHeight) - 0.5;
      request();
    });

    apply();
  })();

  /* ---------- 9. Año del footer ---------- */
  (function year() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
