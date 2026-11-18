/* =========================================================
   ChainNotes — Apunte: Pruebas de conocimiento cero
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Los parámetros son diminutos a propósito (Schnorr con p = 23,
   Shamir sobre los reales) para que cada cuenta se pueda seguir
   a mano. Los diagramas SVG usan clases .zk* de apuntes.css
   (sección Q), así que sus colores siguen el tema claro/oscuro.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NBSP = ' ';

  /* ==== CORE: aritmética y utilidades (sin DOM) ==== */

  function rnd(n) { return Math.floor(Math.random() * n); }

  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }

  /** Número como «m × 10^e» en HTML, para probabilidades y cocientes enormes. */
  function sci(v, dig) {
    var e = Math.floor(Math.log(v) / Math.LN10);
    var m = v / Math.pow(10, e);
    if (m >= 9.95) { m /= 10; e += 1; }
    return m.toFixed(dig === undefined ? 1 : dig) + ' × 10<sup>' + String(e).replace('-', '−') + '</sup>';
  }

  /** Probabilidad legible: decimal mientras se pueda, notación científica después. */
  function fmtProb(p) {
    if (p === 1) return '1';
    if (p >= 0.001) return p.toFixed(p < 0.1 ? 4 : 3);
    return sci(p);
  }

  /** «1 en X», la forma más intuitiva de leer una probabilidad pequeña. */
  function oddsHTML(p) {
    var x = 1 / p;
    if (x < 1e7) return '1 en ' + fmtInt(x);
    return '1 en ' + sci(x);
  }

  /** b^e mod m con exponente no negativo (números pequeños: cabe en double). */
  function modpow(b, e, m) {
    var r = 1;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) r = (r * b) % m;
      b = (b * b) % m;
      e >>= 1;
    }
    return r;
  }

  /** Inverso modular por búsqueda: m es diminuto. */
  function inv(a, m) {
    a = ((a % m) + m) % m;
    for (var i = 1; i < m; i++) if ((a * i) % m === 1) return i;
    return null;
  }

  /** Huella FNV-1a de 16 bits: de juguete, sólo para mostrar «algo sellado». */
  function huella(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ('0000' + ((h >>> 0) & 0xffff).toString(16)).slice(-4);
  }

  /** Interpolación de Lagrange: valor en x0 del polinomio que pasa por pts. */
  function lagrange(pts, x0) {
    var s = 0;
    for (var j = 0; j < pts.length; j++) {
      var t = pts[j][1];
      for (var m = 0; m < pts.length; m++) {
        if (m !== j) t *= (x0 - pts[m][0]) / (pts[j][0] - pts[m][0]);
      }
      s += t;
    }
    return s;
  }

  function evalPoly(coef, x) {
    var y = 0;
    for (var i = coef.length - 1; i >= 0; i--) y = y * x + coef[i];
    return y;
  }

  function barajar() {
    var p = [0, 1, 2];
    for (var i = 2; i > 0; i--) {
      var j = rnd(i + 1), t = p[i];
      p[i] = p[j]; p[j] = t;
    }
    return p;
  }

  /* ==== Utilidades de DOM ==== */

  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, cls, anchor) {
    var t = el('text', { x: x, y: y, 'class': cls, 'text-anchor': anchor || 'middle' }, parent);
    t.textContent = s;
    return t;
  }
  function svgBox(host, w, h, aria) {
    host.innerHTML = '';
    return el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': aria }, host);
  }
  function setState(node, kind, html) {
    node.className = 'state' + (kind ? ' state--' + kind : '');
    node.innerHTML = html;
  }
  /** Control segmentado: marca el botón pulsado y avisa con su data-*. */
  function seg(id, cb) {
    var g = $(id);
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !g.contains(b)) return;
      Array.prototype.forEach.call(g.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      cb(b);
    });
  }
  function chip(box, ok, text) {
    var c = document.createElement('span');
    c.className = 'zkchip' + (ok ? '' : ' zkchip--bad');
    c.textContent = text;
    box.appendChild(c);
    while (box.children.length > 120) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }
  function delay(ms) {
    return new Promise(function (res) { setTimeout(res, REDUCED ? 0 : ms); });
  }

  /* =======================================================
     Lab 0 — ¿Cuánta suerte necesita una tramposa?
     ======================================================= */
  (function labSuerte() {
    var nIn = $('rN');
    if (!nIn) return;
    var p = 0.5;
    var HITOS = [
      { t: 'Sacar un 6 con un dado', x: 6 },
      { t: 'Diez águilas seguidas con una moneda', x: 1024 },
      { t: 'Adivinar un PIN de 4 dígitos al primer intento', x: 1e4 },
      { t: 'Ganar la lotería 6 de 49 con un solo boleto', x: 13983816 },
      { t: 'Adivinar una clave de 64 bits al primer intento', x: Math.pow(2, 64) }
    ];
    var lis = HITOS.map(function (h) {
      var li = document.createElement('li');
      $('rHitos').appendChild(li);
      return li;
    });

    function render() {
      var n = +nIn.value, P = Math.pow(p, n);
      $('rNOut').textContent = n + (n === 1 ? ' ronda seguida' : ' rondas seguidas');
      $('rOdds').innerHTML = oddsHTML(P);
      $('rMin').textContent = Math.ceil(Math.log(1e-6) / Math.log(p));

      var coins = $('rCoins'), shown = Math.min(n, 50), html = '';
      for (var i = 0; i < shown; i++) html += '<i></i>';
      if (n > shown) html += '<span>+' + (n - shown) + '</span>';
      coins.innerHTML = html;

      HITOS.forEach(function (h, k) {
        var on = 1 / P >= h.x;
        lis[k].className = on ? 'is-on' : '';
        lis[k].textContent = (on ? 'Ya es más difícil que: ' : 'Todavía más fácil que: ') + h.t.charAt(0).toLowerCase() + h.t.slice(1);
      });
    }

    seg('rSeg', function (b) { p = +b.getAttribute('data-p'); render(); });
    nIn.addEventListener('input', render);
    render();
  })();

  /* =======================================================
     Lab 1 — La cueva de Alí Babá
     ======================================================= */
  (function labCueva() {
    var P = $('peggyG');
    if (!P) return;
    var V = $('victorG');
    var paths = { E: $('pE'), A: $('pA'), B: $('pB'), D: $('pD') };
    var knows = true, side = null, busy = false, st = { n: 0, ok: 0, fail: false };

    function place(g, x, y) { g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')'); }

    /** Lleva a un personaje a lo largo de un pasillo (rev = en sentido contrario). */
    function walk(g, path, rev, dur) {
      return new Promise(function (res) {
        var L = path.getTotalLength();
        if (REDUCED) {
          var q = path.getPointAtLength(rev ? 0 : L);
          place(g, q.x, q.y);
          res();
          return;
        }
        var t0 = null;
        function f(now) {
          if (t0 === null) t0 = now;
          var u = Math.min(1, (now - t0) / dur);
          var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          var q = path.getPointAtLength((rev ? 1 - e : e) * L);
          place(g, q.x, q.y);
          if (u < 1) requestAnimationFrame(f); else res();
        }
        requestAnimationFrame(f);
      });
    }
    function moveTo(g, x0, y0, x1, y1, dur) {
      return new Promise(function (res) {
        if (REDUCED) { place(g, x1, y1); res(); return; }
        var t0 = null;
        function f(now) {
          if (t0 === null) t0 = now;
          var u = Math.min(1, (now - t0) / dur);
          place(g, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u);
          if (u < 1) requestAnimationFrame(f); else res();
        }
        requestAnimationFrame(f);
      });
    }

    function veil(on) {
      var see = $('caveSee').checked;
      $('veil').setAttribute('opacity', on ? (see ? 0.35 : 0.94) : 0);
      $('veilTxt').setAttribute('opacity', on && !see ? 1 : 0);
    }
    function status(kind, html) { setState($('caveState'), kind, html); }
    function stats() {
      var p = st.fail ? 0 : Math.pow(0.5, st.ok);
      $('cvN').textContent = st.n;
      $('cvOk').textContent = st.ok;
      $('cvP').innerHTML = st.fail ? '—' : fmtProb(p);
      var conf = st.fail ? 0 : (1 - p) * 100;
      $('cvConf').textContent = st.fail ? 'la rechaza' : conf.toFixed(conf > 99.9 ? 4 : 1) + ' %';
      $('cvMeter').style.width = conf + '%';
    }
    function botones(entrar, gritar) {
      $('caveStart').disabled = !entrar;
      $('caveA').disabled = $('caveB').disabled = !gritar;
    }

    function start() {
      if (busy) return;
      busy = true;
      botones(false, false);
      $('shout').textContent = '';
      side = Math.random() < 0.5 ? 'A' : 'B';
      veil(true);
      status('', 'Peggy entra… Víctor espera afuera, de espaldas.');
      place(V, 110, 445);
      place(P, 200, 445);
      walk(P, paths.E, false, 700)
        .then(function () { return walk(P, paths[side], false, 900); })
        .then(function () { return moveTo(V, 110, 445, 200, 340, 600); })
        .then(function () {
          status('', 'Víctor llegó a la bifurcación. ¿Por qué pasillo quiere ver salir a Peggy?');
          botones(false, true);
          busy = false;
        });
    }

    function call(pedido) {
      if (busy || side === null) return;
      busy = true;
      botones(false, false);
      $('shout').textContent = '«¡Sal por ' + pedido + '!»';
      var door = $('door'), viaje;
      if (pedido === side) {
        viaje = walk(P, paths[pedido], true, 900).then(function () { return true; });
      } else if (knows) {
        door.classList.add('is-open');
        viaje = delay(250)
          .then(function () { return walk(P, paths.D, side === 'B', 400); })
          .then(function () { door.classList.remove('is-open'); return walk(P, paths[pedido], true, 900); })
          .then(function () { return true; });
      } else {
        door.classList.add('is-shake');
        viaje = delay(750)
          .then(function () { door.classList.remove('is-shake'); return walk(P, paths[side], true, 900); })
          .then(function () { return false; });
      }
      viaje.then(function (ok) {
        veil(false);
        st.n++;
        if (ok) st.ok++; else st.fail = true;
        chip($('cvChips'), ok, (ok ? '✓ ' : '✗ ') + side + '→' + pedido);
        var como = pedido === side ? 'Ya estaba en ese pasillo: le tocó fácil.' : 'Abrió la puerta mágica y cruzó al otro lado.';
        if (ok) status('ok', 'Peggy salió por ' + pedido + '. ' + como);
        else status('bad', 'Peggy salió por ' + side + ', no por ' + pedido + '. Sin la palabra no pudo cruzar: <strong>Víctor la rechaza</strong>.');
        stats();
        side = null;
        busy = false;
        botones(true, false);
        $('caveStart').textContent = '1 · Nueva ronda';
      });
    }

    function fast() {
      if (busy) return;
      for (var i = 0; i < 20; i++) {
        var s = rnd(2) ? 'A' : 'B', c = rnd(2) ? 'A' : 'B';
        var ok = knows || s === c;
        st.n++;
        if (ok) st.ok++; else st.fail = true;
        chip($('cvChips'), ok, (ok ? '✓ ' : '✗ ') + s + '→' + c);
      }
      stats();
      if (st.fail) status('bad', 'En alguna ronda la impostora no pudo salir por el pasillo pedido. Víctor la rechaza.');
      else status('ok', 'Peggy superó ' + st.ok + ' rondas seguidas. Una impostora lo habría logrado con suerte de ' + oddsHTML(Math.pow(0.5, st.ok)) + '.');
    }

    function reset() {
      if (busy) return;
      st = { n: 0, ok: 0, fail: false };
      side = null;
      $('cvChips').innerHTML = '';
      place(P, 200, 445);
      place(V, 110, 445);
      veil(false);
      $('shout').textContent = '';
      botones(true, false);
      $('caveStart').textContent = '1 · Peggy entra';
      stats();
      status('', knows ? 'Peggy conoce la palabra. Pulsa «Peggy entra».' :
        'Esta Peggy <strong>no</strong> conoce la palabra. A ver cuánto aguanta.');
    }

    seg('caveMode', function (b) { knows = b.getAttribute('data-v') === '1'; reset(); });
    $('caveSee').addEventListener('change', function () { veil(side !== null); });
    $('caveStart').addEventListener('click', start);
    $('caveA').addEventListener('click', function () { call('A'); });
    $('caveB').addEventListener('click', function () { call('B'); });
    $('caveFast').addEventListener('click', fast);
    $('caveReset').addEventListener('click', reset);
    stats();
  })();

  /* =======================================================
     Lab 2 — Dos bolas y un verificador daltónico
     ======================================================= */
  (function labBolas() {
    var box = $('balls');
    if (!box) return;
    var R = $('ballR'), G = $('ballG');
    var distintas = true, busy = false, posR = 0, st = { n: 0, ok: 0, fail: false };

    function slot(i) { return 'calc(' + (i ? 75 : 25) + '% - ' + (R.offsetWidth / 2) + 'px)'; }
    function colocar() { R.style.left = slot(posR); G.style.left = slot(1 - posR); }

    /** Una ronda: si las bolas son iguales, Peggy sólo puede adivinar. */
    function ronda(cambio) {
      var dice = distintas ? cambio : Math.random() < 0.5;
      return { ok: dice === cambio, dice: dice };
    }
    function stats() {
      $('blN').textContent = st.n;
      $('blOk').textContent = st.ok;
      $('blP').innerHTML = st.fail ? '—' : fmtProb(Math.pow(0.5, st.ok));
    }
    function status(kind, html) { setState($('ballState'), kind, html); }

    $('ballGo').addEventListener('click', function () {
      if (busy) return;
      busy = true;
      var cambio = Math.random() < 0.5;
      status('', 'Víctor esconde las bolas tras su espalda y lanza la moneda…');
      box.classList.add('is-hidden');
      delay(600).then(function () {
        if (cambio) { posR = 1 - posR; colocar(); }
        return delay(800);
      }).then(function () {
        box.classList.remove('is-hidden');
        return delay(450);
      }).then(function () {
        var r = ronda(cambio);
        st.n++;
        if (r.ok) st.ok++; else st.fail = true;
        chip($('blChips'), r.ok, r.ok ? '✓' : '✗');
        stats();
        status(r.ok ? 'ok' : 'bad', 'Moneda: <strong>' + (cambio ? 'las cambió' : 'no las cambió') + '</strong>. Peggy dice: «' +
          (r.dice ? 'las cambiaste' : 'no las cambiaste') + '». ' + (r.ok ? 'Correcto.' : 'Falló: Víctor deja de creerle.'));
        busy = false;
      });
    });

    $('ballFast').addEventListener('click', function () {
      if (busy) return;
      for (var i = 0; i < 30; i++) {
        var r = ronda(Math.random() < 0.5);
        st.n++;
        if (r.ok) st.ok++; else st.fail = true;
        chip($('blChips'), r.ok, r.ok ? '✓' : '✗');
      }
      stats();
      if (st.fail) status('bad', 'Peggy falló al menos una vez: Víctor concluye que las bolas podrían ser iguales.');
      else status('ok', 'Peggy acertó ' + st.ok + ' de ' + st.n + '. Una mentirosa lo habría logrado con suerte de ' + oddsHTML(Math.pow(0.5, st.ok)) + '.');
    });

    function reset() {
      if (busy) return;
      st = { n: 0, ok: 0, fail: false };
      $('blChips').innerHTML = '';
      stats();
      status('', distintas ? 'Las bolas son roja y verde.' : 'Las dos bolas son <strong>rojas</strong>, pero Peggy afirma que son distintas.');
    }

    seg('ballMode', function (b) {
      distintas = b.getAttribute('data-v') === '1';
      G.className = 'zkball ' + (distintas ? 'zkball--g' : 'zkball--r');
      reset();
    });
    $('ballView').addEventListener('change', function (e) {
      box.classList.toggle('is-victor', e.target.checked);
      $('ballTag').textContent = e.target.checked ? 'Vista de Víctor (no distingue)' : 'Vista de Peggy (ve colores)';
    });
    $('ballReset').addEventListener('click', reset);
    window.addEventListener('resize', colocar);
    colocar();
    stats();
  })();

  /* =======================================================
     Lab 3 — 3-coloración con sobres sellados
     ======================================================= */
  (function labGrafo() {
    var host = $('gHost');
    if (!host) return;
    var N = 7;
    var E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0], [5, 1], [2, 6]];
    var GOOD = [0, 1, 2, 0, 1, 2, 1];
    var FAKE = [0, 1, 2, 0, 1, 2, 0];          // la arista 6–0 queda con el mismo color
    var NOMBRE = ['amarillo', 'verde', 'azul'];
    var CX = 200, CY = 180, RAD = 135;
    var pos = [];
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / N;
      pos.push([CX + RAD * Math.cos(a), CY + RAD * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }

    var valida = true, perm = [0, 1, 2], fase = 'idle', abierto = null;
    var st = { n: 0, bad: 0 }, cuaderno;

    var svg = svgBox(host, 400, 360, 'Grafo de 7 vértices y 14 aristas');
    var eEls = E.map(function (e, k) {
      var g = el('g', { 'class': 'zkedgeg', tabindex: '0', role: 'button', 'aria-label': 'Revisar la arista ' + e[0] + '–' + e[1] }, svg);
      var p1 = pos[e[0]], p2 = pos[e[1]];
      var line = el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], 'class': 'zkedge' }, g);
      el('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], 'class': 'zkhit' }, g);
      g.addEventListener('click', function () { retar(k); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); retar(k); }
      });
      return line;
    });
    var vEls = pos.map(function (p, i) {
      var c = el('circle', { cx: p[0], cy: p[1], r: 19, 'class': 'zkvert' }, svg);
      var lk = el('path', {
        d: 'M' + (p[0] - 6) + ',' + (p[1] - 1) + 'h12v10h-12z M' + (p[0] - 3.5) + ',' + (p[1] - 1) + 'v-3.5a3.5,3.5 0 0 1 7,0v3.5',
        'class': 'zklock', visibility: 'hidden'
      }, svg);
      txt(svg, (p[0] + p[2] * 32).toFixed(1), (p[1] + p[3] * 32 + 4).toFixed(1), 'v' + i, 'zkvnum');
      return { c: c, lk: lk };
    });

    function colorReal(i) { return (valida ? GOOD : FAKE)[i]; }
    function colorDe(i) { return perm[colorReal(i)]; }

    function draw() {
      var espiar = $('gSee').checked;
      vEls.forEach(function (v, i) {
        var visible = abierto && (i === abierto.a || i === abierto.b);
        var cls = 'zkvert', candado = false;
        if (visible) {
          cls += ' zkvert--c' + colorDe(i);
        } else if (fase !== 'idle') {
          candado = true;
          cls += espiar ? ' zkvert--c' + colorDe(i) + ' zkvert--peek' : ' zkvert--sealed';
        } else if (espiar) {
          cls += ' zkvert--c' + colorReal(i);
        }
        v.c.setAttribute('class', cls);
        v.lk.setAttribute('visibility', candado ? 'visible' : 'hidden');
      });
      eEls.forEach(function (l, k) {
        var hit = abierto && abierto.k === k;
        l.setAttribute('class', 'zkedge' + (hit ? (abierto.ok ? ' zkedge--ok' : ' zkedge--bad') : ''));
      });
    }

    function status(kind, html) { setState($('gState'), kind, html); }
    function stats() {
      $('gN').textContent = st.n;
      $('gBad').textContent = st.bad;
      $('gP').innerHTML = st.bad ? '—' : fmtProb(Math.pow(13 / 14, st.n));
    }

    /** El cuaderno guarda qué colores vio Víctor en cada vértice. */
    function anotar(i, c) { cuaderno[i].veces++; cuaderno[i].vistos[c] = true; }
    function drawCuaderno() {
      var html = '', conocidos = 0;
      cuaderno.forEach(function (v, i) {
        var distintos = v.vistos.filter(Boolean).length;
        var conocido = v.veces >= 3 && distintos === 1;
        if (conocido) conocidos++;
        var dots = '';
        v.vistos.forEach(function (b, c) { if (b) dots += '<i class="zkdot zkdot--c' + c + '"></i>'; });
        html += '<div class="zkbook__v' + (conocido ? ' is-known' : '') + '">v' + i +
          '<div class="zkbook__dots">' + dots + '</div></div>';
      });
      $('gBook').innerHTML = html;
      var nota = $('gBookNote'), barajado = $('gShuffle').checked;
      if (st.n === 0) {
        setState(nota, '', 'Aquí se apuntan los colores que Víctor ve al abrir sobres.');
      } else if (barajado) {
        setState(nota, 'ok', 'Con barajado, el mismo vértice aparece con colores distintos de una ronda a otra. El cuaderno no le sirve a Víctor para nada.');
      } else if (conocidos === N) {
        setState(nota, 'bad', '<strong>Víctor reconstruyó la coloración completa.</strong> Sin barajar, cada sobre siempre muestra el mismo color y el secreto se filtra.');
      } else {
        setState(nota, 'bad', 'Sin barajar, cada vértice muestra siempre el mismo color. Víctor ya está seguro de ' + conocidos + ' de 7 (en rojo).');
      }
    }

    function sellar() {
      perm = $('gShuffle').checked ? barajar() : [0, 1, 2];
      var nonces = [];
      for (var i = 0; i < N; i++) nonces.push(Math.random().toString(36).slice(2, 8));
      $('gCom').textContent = nonces.map(function (n, i) { return 'v' + i + ': ' + huella(colorDe(i) + '|' + n); }).join('   ');
      fase = 'sealed';
      abierto = null;
      $('gRand').disabled = false;
      status('', 'Colores ' + ($('gShuffle').checked ? 'barajados' : '<strong>sin barajar</strong>') + ' y sellados en 7 sobres. Ahora Víctor elige una arista: haz clic en una línea.');
      draw();
    }

    function retar(k) {
      if (fase !== 'sealed') { status('', 'Primero Peggy debe barajar y sellar los sobres.'); return; }
      var a = E[k][0], b = E[k][1], ca = colorDe(a), cb = colorDe(b), ok = ca !== cb;
      abierto = { a: a, b: b, k: k, ok: ok };
      fase = 'opened';
      st.n++;
      if (!ok) st.bad++;
      anotar(a, ca);
      anotar(b, cb);
      chip($('gChips'), ok, a + '–' + b);
      stats();
      drawCuaderno();
      draw();
      $('gRand').disabled = true;
      if (ok) status('ok', 'Sobres v' + a + ' y v' + b + ': ' + NOMBRE[ca] + ' y ' + NOMBRE[cb] + '. Distintos: la ronda pasa, y Víctor no sabe nada de los otros cinco.');
      else status('bad', 'Sobres v' + a + ' y v' + b + ': ¡los dos ' + NOMBRE[ca] + '! <strong>Peggy queda atrapada.</strong>');
    }

    function rapidas() {
      var barajado = $('gShuffle').checked;
      for (var i = 0; i < 100; i++) {
        perm = barajado ? barajar() : [0, 1, 2];
        var k = rnd(E.length), a = E[k][0], b = E[k][1];
        var ok = colorDe(a) !== colorDe(b);
        st.n++;
        if (!ok) st.bad++;
        anotar(a, colorDe(a));
        anotar(b, colorDe(b));
        chip($('gChips'), ok, a + '–' + b);
      }
      fase = 'idle';
      abierto = null;
      $('gRand').disabled = true;
      stats();
      drawCuaderno();
      draw();
      if (st.bad) status('bad', 'En ' + st.n + ' rondas Víctor encontró ' + st.bad + ' vez(es) una arista con el mismo color. Rechaza.');
      else status('ok', st.n + ' rondas sin fallo. Una tramposa habría pasado con suerte de ' + oddsHTML(Math.pow(13 / 14, st.n)) + ' o menos.');
    }

    function reset() {
      st = { n: 0, bad: 0 };
      fase = 'idle';
      abierto = null;
      cuaderno = [];
      for (var i = 0; i < N; i++) cuaderno.push({ veces: 0, vistos: [false, false, false] });
      $('gChips').innerHTML = '';
      $('gCom').textContent = '—';
      $('gRand').disabled = true;
      stats();
      drawCuaderno();
      draw();
      status('', valida ? 'Peggy tiene una 3-coloración válida. Pídele que baraje y selle.' :
        'La coloración de Peggy tiene una arista mala (v6–v0). ¿Cuánto tarda Víctor en encontrarla?');
    }

    seg('gMode', function (b) { valida = b.getAttribute('data-v') === '1'; reset(); });
    $('gShuffle').addEventListener('change', reset);
    $('gSee').addEventListener('change', draw);
    $('gCommit').addEventListener('click', sellar);
    $('gRand').addEventListener('click', function () { retar(rnd(E.length)); });
    $('gFast').addEventListener('click', rapidas);
    $('gReset').addEventListener('click', reset);
    reset();
  })();

  /* =======================================================
     Lab 4 — El protocolo de Schnorr paso a paso
     ======================================================= */
  (function labSchnorr() {
    var xIn = $('sxR');
    if (!xIn) return;
    var P = 23, Q = 11, G = 2;
    var x = 7, y = 0, paso = 0, cur = {};

    function verifica(t, c, s) { return modpow(G, s, P) === (t * modpow(y, c, P)) % P; }

    function textos() {
      $('c1').innerHTML = 'Elige r al azar y envía t = g<sup>r</sup> mod p.';
      $('c2').textContent = 'Elige c al azar en {0, …, 10}.';
      $('c3').textContent = 'Envía s = r + c·x mod q.';
      $('c4').innerHTML = '¿g<sup>s</sup> ≡ t·y<sup>c</sup> (mod p)?';
    }
    function reset() {
      paso = 0;
      ['st1', 'st2', 'st3', 'st4'].forEach(function (id) { $(id).classList.remove('is-on'); });
      textos();
      $('sNext').textContent = 'Siguiente paso';
    }
    function setX() {
      x = +xIn.value;
      $('sx').textContent = x;
      y = modpow(G, x, P);
      $('sy').innerHTML = 'y = 2<sup>' + x + '</sup> mod 23 = <strong>' + y + '</strong>';
      $('sTab').innerHTML = '';
      reset();
    }

    function fila(origen, t, c, s) {
      var ok = verifica(t, c, s), tr = document.createElement('tr');
      tr.innerHTML = '<td class="' + (origen === 'real' ? 'zk-peggy' : 'zk-victor') + '">' + origen + '</td>' +
        '<td class="num">' + t + '</td><td class="num">' + c + '</td><td class="num">' + s + '</td>' +
        '<td class="' + (ok ? 'zkok' : 'zkbad') + '">' + (ok ? '✓ sí' : '✗ no') + '</td>';
      var tb = $('sTab');
      tb.insertBefore(tr, tb.firstChild);
      while (tb.children.length > 10) tb.removeChild(tb.lastChild);
    }

    function siguiente() {
      if (paso === 4) reset();
      paso++;
      $('st' + paso).classList.add('is-on');
      if (paso === 1) {
        cur.r = rnd(Q);
        cur.t = modpow(G, cur.r, P);
        $('c1').innerHTML = 'r = ' + cur.r + ' (lo guarda en secreto) → t = 2<sup>' + cur.r + '</sup> mod 23 = <strong>' + cur.t + '</strong>';
      } else if (paso === 2) {
        cur.c = rnd(Q);
        $('c2').innerHTML = 'c = <strong>' + cur.c + '</strong>';
      } else if (paso === 3) {
        cur.s = (cur.r + cur.c * x) % Q;
        $('c3').innerHTML = 's = ' + cur.r + ' + ' + cur.c + '·' + x + ' mod 11 = <strong>' + cur.s + '</strong>';
      } else {
        var izq = modpow(G, cur.s, P), der = (cur.t * modpow(y, cur.c, P)) % P;
        $('c4').innerHTML = '2<sup>' + cur.s + '</sup> mod 23 = <strong>' + izq + '</strong> &nbsp;y&nbsp; ' +
          cur.t + '·' + y + '<sup>' + cur.c + '</sup> mod 23 = <strong>' + der + '</strong> &nbsp;' +
          (izq === der ? '<span class="zkok">✓ acepta</span>' : '<span class="zkbad">✗ rechaza</span>');
        fila('real', cur.t, cur.c, cur.s);
        $('sNext').textContent = 'Nueva ronda';
      }
    }

    $('sNext').addEventListener('click', siguiente);
    $('sAuto').addEventListener('click', function () { reset(); for (var i = 0; i < 4; i++) siguiente(); });

    // El simulador elige c y s primero y despeja t: no necesita x.
    $('sSim').addEventListener('click', function () {
      var yi = inv(y, P);
      for (var i = 0; i < 5; i++) {
        var c = rnd(Q), s = rnd(Q);
        fila('simulada', (modpow(G, s, P) * modpow(yi, c, P)) % P, c, s);
      }
    });
    $('sClr').addEventListener('click', function () { $('sTab').innerHTML = ''; });

    // Mismo r ante dos retos distintos: r se cancela al restar y x queda expuesto.
    $('sReuse').addEventListener('click', function () {
      var r = 1 + rnd(Q - 1), t = modpow(G, r, P), c1 = rnd(Q), c2;
      do { c2 = rnd(Q); } while (c2 === c1);
      var s1 = (r + c1 * x) % Q, s2 = (r + c2 * x) % Q;
      var dif = (((s1 - s2) % Q) + Q) % Q, dc = (((c1 - c2) % Q) + Q) % Q;
      var xr = (dif * inv(dc, Q)) % Q;
      setState($('sReuseOut'), 'bad',
        'Mismo t = ' + t + '. Retos c<sub>1</sub> = ' + c1 + ' y c<sub>2</sub> = ' + c2 +
        '; respuestas s<sub>1</sub> = ' + s1 + ' y s<sub>2</sub> = ' + s2 + '.<br>' +
        '<span class="mono">x = (' + s1 + ' − ' + s2 + ')·(' + c1 + ' − ' + c2 + ')<sup>−1</sup> mod 11 = <strong>' + xr + '</strong></span>' +
        (xr === x ? ' · <strong>¡el secreto quedó expuesto!</strong>' : ''));
    });

    xIn.addEventListener('input', setX);
    setX();
  })();

  /* =======================================================
     Lab 5 — Compartir un secreto (Shamir)
     ======================================================= */
  (function labShamir() {
    var host = $('shHost');
    if (!host) return;
    var S = 12, K = 3, coef = [], sel = {};
    var W = 420, H = 300, ML = 40, MR = 12, MT = 14, MB = 28, X0 = -0.4, X1 = 5.6;

    function f(x) { return evalPoly(coef, x); }
    function seleccion() {
      var pts = [];
      for (var i = 1; i <= 5; i++) if (sel[i]) pts.push([i, f(i)]);
      return pts;
    }

    function nuevo() {
      coef = [S];
      for (var i = 1; i < K; i++) {
        var a;
        do { a = rnd(9) - 4; } while (a === 0 && i === K - 1);
        coef.push(a);
      }
      if (K === 4) coef[3] = coef[3] > 0 ? 1 : -1;   // cúbica suave, para que quepa en la gráfica
      sel = {};
      botones();
      draw();
    }

    function botones() {
      var box = $('shShares');
      box.innerHTML = '';
      for (var i = 1; i <= 5; i++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'zkshare';
          b.setAttribute('aria-pressed', sel[i] ? 'true' : 'false');
          b.textContent = 'P' + i + ': (' + i + ', ' + f(i) + ')';
          b.addEventListener('click', function () {
            sel[i] = !sel[i];
            b.setAttribute('aria-pressed', sel[i] ? 'true' : 'false');
            draw();
          });
          box.appendChild(b);
        })(i);
      }
      var SUP = ['', '', '²', '³'];
      var terms = [String(coef[0])];
      for (var k = 1; k < coef.length; k++) {
        var c = coef[k];
        if (c === 0) continue;                       // «+ 0x» no aporta nada
        terms.push((c < 0 ? '− ' : '+ ') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + 'x' + SUP[k]);
      }
      $('shPoly').textContent = 'f(x) = ' + terms.join(' ');
    }

    function draw() {
      var pts = seleccion(), basta = pts.length >= K;
      var familia = !basta && pts.length === K - 1 && pts.length > 0;
      var curvas = [];
      if (basta) curvas.push({ fn: function (v) { return lagrange(pts.slice(0, K), v); }, cls: 'zkcurve' });
      if (familia) {
        for (var s = -10; s <= 40; s += 5) {
          (function (s) {
            var base = [[0, s]].concat(pts);
            curvas.push({ fn: function (v) { return lagrange(base, v); }, cls: 'zkcurve zkcurve--fam', s: s });
          })(s);
        }
      }
      if ($('shShow').checked) curvas.push({ fn: f, cls: 'zkcurve zkcurve--dealer' });

      var ys = [0, S];
      for (var i = 1; i <= 5; i++) ys.push(f(i));
      if (familia) ys.push(-10, 40);
      var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
      var pad = (ymax - ymin || 10) * 0.18;
      ymin -= pad; ymax += pad;
      var X = function (v) { return ML + (v - X0) / (X1 - X0) * (W - ML - MR); };
      var Y = function (v) { return MT + (ymax - v) / (ymax - ymin) * (H - MT - MB); };

      var svg = svgBox(host, W, H, 'Gráfica del polinomio de Shamir con sus fragmentos');
      var clip = el('clipPath', { id: 'zkShClip' }, el('defs', {}, svg));
      el('rect', { x: ML, y: MT, width: W - ML - MR, height: H - MT - MB }, clip);

      // Rejilla con un paso «redondo»
      var crudo = (ymax - ymin) / 5, pot = Math.pow(10, Math.floor(Math.log(crudo) / Math.LN10));
      var paso = [1, 2, 5, 10].map(function (m) { return m * pot; }).filter(function (v) { return v >= crudo; })[0];
      for (var v = Math.ceil(ymin / paso) * paso; v <= ymax; v += paso) {
        el('line', { x1: ML, y1: Y(v).toFixed(1), x2: W - MR, y2: Y(v).toFixed(1), 'class': 'zkgrid' }, svg);
        txt(svg, ML - 6, (Y(v) + 4).toFixed(1), String(Math.round(v)), 'zktxt', 'end');
      }
      for (i = 0; i <= 5; i++) txt(svg, X(i).toFixed(1), H - 8, String(i), 'zktxt');
      el('line', { x1: X(0), y1: MT, x2: X(0), y2: H - MB, 'class': 'zkaxis' }, svg);
      txt(svg, X(0) + 6, MT + 12, 'x = 0 · aquí vive el secreto', 'zktxt zktxt--ink', 'start');

      var g = el('g', { 'clip-path': 'url(#zkShClip)' }, svg);
      curvas.forEach(function (c) {
        var d = '';
        for (var k = 0; k <= 160; k++) {
          var xv = X0 + (X1 - X0) * k / 160;
          d += (k ? 'L' : 'M') + X(xv).toFixed(1) + ',' + Y(c.fn(xv)).toFixed(1);
        }
        el('path', { d: d, 'class': c.cls }, g);
        if (c.s !== undefined) el('circle', { cx: X(0), cy: Y(c.s).toFixed(1), r: 3.5, 'class': 'zkpt zkpt--fam' }, g);
      });
      for (i = 1; i <= 5; i++) {
        var on = !!sel[i];
        el('circle', { cx: X(i).toFixed(1), cy: Y(f(i)).toFixed(1), r: on ? 7 : 4.5, 'class': 'zkpt' + (on ? ' zkpt--on' : '') }, g);
        if (on) txt(g, (X(i) + 10).toFixed(1), (Y(f(i)) - 9).toFixed(1), 'P' + i, 'zktxt zktxt--ink', 'start');
      }
      var rec = basta ? lagrange(pts.slice(0, K), 0) : null;
      if (basta) el('circle', { cx: X(0), cy: Y(rec).toFixed(1), r: 8, 'class': 'zkpt zkpt--secret' }, g);

      var nota = $('shState');
      if (basta) {
        setState(nota, 'ok', 'Con ' + pts.length + ' fragmento(s) y umbral ' + K + ' la curva queda fija: <strong class="mono">S = f(0) = ' +
          (Math.round(rec * 1000) / 1000) + '</strong>.');
      } else if (familia) {
        setState(nota, 'bad', 'Con ' + pts.length + ' fragmento(s) cualquier secreto es posible: cada curva azul pasa por tus puntos y corta el eje en un valor distinto.');
      } else {
        setState(nota, '', 'Selecciona fragmentos. Se necesitan ' + K + ' para reconstruir el secreto.');
      }
    }

    $('shSR').addEventListener('input', function (e) {
      S = +e.target.value;
      $('shS').textContent = S;
      coef[0] = S;
      botones();
      draw();
    });
    seg('shK', function (b) { K = +b.getAttribute('data-v'); nuevo(); });
    $('shNew').addEventListener('click', nuevo);
    $('shShow').addEventListener('change', function (e) {
      $('shPoly').hidden = !e.target.checked;
      draw();
    });
    nuevo();
  })();

})();
