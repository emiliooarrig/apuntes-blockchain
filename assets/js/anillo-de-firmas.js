/* =========================================================
   ChainNotes — Apunte: El anillo de firmas
   Laboratorios interactivos y quiz. Vanilla JS, sin dependencias.

   Firma de anillo de Abe–Ohkubo–Suzuki (versión Schnorr) sobre
   grupos diminutos y con un hash de juguete H(m,R) = (3·m̂ + R) mod q.
   La inseguridad es intencional: los números deben poder seguirse
   a mano. Todos los productos caben de sobra en un double.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ==== CORE: aritmética y esquema (sin DOM) ==== */

  var GROUPS = [
    { p: 23, q: 11, g: 4 },
    { p: 47, q: 23, g: 2 },
    { p: 59, q: 29, g: 4 }
  ];
  var NAMES = ['Ana', 'Beto', 'Carla', 'Diego', 'Elena', 'Fer', 'Gabi', 'Hugo', 'Iris', 'Juan'];

  function mod(a, n) { return ((a % n) + n) % n; }

  function powmod(b, e, m) {
    var r = 1;
    b = mod(b, m);
    while (e > 0) {
      if (e & 1) r = (r * b) % m;
      b = (b * b) % m;
      e >>= 1;
    }
    return r;
  }

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  /**
   * Huella del mensaje: mezcla polinómica módulo un primo grande y luego
   * mod q. Sumar código·posición directamente módulo q fallaba mucho
   * (p. ej. «!» = 33 = 3·11 no altera nada con q = 11).
   */
  function huella(txt, q) {
    var h = 7;
    for (var i = 0; i < txt.length; i++) h = (h * 131 + txt.charCodeAt(i)) % 1000003;
    return h % q;
  }

  /** Hash de juguete. Ignora la lista L a propósito (ver la sección 08). */
  function H(mh, R, q) { return mod(3 * mh + R, q); }

  /** Condición ① de un eslabón: R = g^r · y^c mod p. */
  function eslabon(G, y, r, c) { return (powmod(G.g, r, G.p) * powmod(y, c, G.p)) % G.p; }

  /** n pares de claves con x distintas en 1..q-1 (así las y también son distintas). */
  function keygen(G, n) {
    var pool = [], i;
    for (i = 1; i < G.q; i++) pool.push(i);
    for (i = pool.length - 1; i > 0; i--) {
      var j = randInt(0, i), t = pool[i];
      pool[i] = pool[j]; pool[j] = t;
    }
    var keys = [];
    for (i = 0; i < n; i++) keys.push({ x: pool[i], y: powmod(G.g, pool[i], G.p) });
    return keys;
  }

  /** El azar de una firma: el a del firmante y una respuesta r por miembro. */
  function coins(G, n) {
    var rr = [];
    for (var i = 0; i < n; i++) rr.push(randInt(0, G.q - 1));
    return { a: randInt(1, G.q - 1), rr: rr };
  }

  /**
   * Firma el mensaje (huella mh) como el miembro s. Devuelve la firma
   * (c[0] y r[]) y la lista de pasos para la bitácora.
   */
  function sign(G, keys, s, mh, a, rr) {
    var n = keys.length, R = [], c = [], r = [], steps = [];
    var nx = (s + 1) % n;
    R[s] = powmod(G.g, a, G.p);
    c[nx] = H(mh, R[s], G.q);
    steps.push({ kind: 'start', i: s, a: a, R: R[s], next: nx, c: c[nx] });
    for (var k = 1; k < n; k++) {
      var i = (s + k) % n;
      r[i] = rr[i];
      R[i] = eslabon(G, keys[i].y, r[i], c[i]);
      nx = (i + 1) % n;
      c[nx] = H(mh, R[i], G.q);
      steps.push({ kind: 'sim', i: i, r: r[i], cin: c[i], R: R[i], next: nx, c: c[nx] });
    }
    r[s] = mod(a - keys[s].x * c[s], G.q);
    steps.push({ kind: 'close', i: s, a: a, x: keys[s].x, cin: c[s], r: r[s] });
    return { c1: c[0], r: r, R: R, c: c, steps: steps };
  }

  /** Da la vuelta completa desde c1. c tiene n+1 entradas; válida si c[n] === c1. */
  function verify(G, ys, mh, c1, r) {
    var n = ys.length, c = [c1], R = [];
    for (var i = 0; i < n; i++) {
      R[i] = eslabon(G, ys[i], r[i], c[i]);
      c[i + 1] = H(mh, R[i], G.q);
    }
    return { R: R, c: c, ok: c[n] === c1 };
  }

  /* ---------- Formato ---------- */
  var SUBS = '₀₁₂₃₄₅₆₇₈₉';
  function subU(k) { return String(k).replace(/\d/g, function (d) { return SUBS[+d]; }); }
  function sub(k) { return '<sub>' + k + '</sub>'; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function pct(x) {
    var v = Math.round(x * 1000) / 10;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + ' %';
  }
  function setPressed(group, btn) {
    Array.prototype.forEach.call(group.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
  }

  /* ==== LAB 0: qué sabe quien verifica ==== */
  (function labQuien() {
    var seg = $('wsSeg');
    if (!seg) return;
    var range = $('wsN'), mode = 'anillo';

    function render() {
      var n = +range.value, ring = mode === 'anillo', html = '';
      $('wsNOut').textContent = n + ' personas';
      range.disabled = !ring;
      for (var i = 0; i < n; i++) {
        var cls = ring ? 'is-ring' : (i === 0 ? 'is-signer' : 'is-out');
        html += '<span class="who__chip ' + cls + '"><span class="who__face">' +
          (ring ? '?' : NAMES[i].charAt(0)) + '</span>' + NAMES[i] + '</span>';
      }
      $('wsPeople').innerHTML = html;
      $('wsAuth').textContent = 'Sí';
      $('wsWho').textContent = ring ? 'Alguien de ' + n : 'Ana';
      $('wsOdds').textContent = ring ? pct(1 / n) : '100 %';
      $('wsLog').innerHTML = ring
        ? '<p>La firma verifica contra las claves públicas de ' + NAMES.slice(0, n).join(', ') +
          '.</p><p class="dim">Cualquiera de las ' + n + ' personas pudo escribirlo. Para adivinar, ' +
          'solo queda tirar un dado de ' + n + ' caras.</p>'
        : '<p>La firma verifica contra la clave pública de <span class="ok">Ana</span>.</p>' +
          '<p class="dim">Mensaje auténtico, pero quien denuncia queda expuesto.</p>';
    }

    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-mode]');
      if (!btn) return;
      mode = btn.getAttribute('data-mode');
      setPressed(seg, btn);
      render();
    });
    range.addEventListener('input', render);
    render();
  })();

  /* ==== LAB 1: firma real contra simulación ==== */
  (function labPieza() {
    if (!$('pzA')) return;
    var G = GROUPS[0], x = 7, y = powmod(G.g, x, G.p); // y = 8
    var msg = $('pzMsg'), A = $('pzA'), C = $('pzC'), Rr = $('pzR');

    function ok(b) { return b ? '<span class="ok">✓ se cumple</span>' : '<span class="bad">✗ no se cumple</span>'; }

    function render() {
      var mh = huella(msg.value, G.q);
      $('pzMh').innerHTML = 'm̂ = ' + mh;

      /* Con clave: a → R → c → r */
      var a = +A.value, R = powmod(G.g, a, G.p), c = H(mh, R, G.q);
      var r = mod(a - x * c, G.q), chk = eslabon(G, y, r, c);
      $('pzAOut').textContent = 'a = ' + a;
      $('pzSign').innerHTML =
        '<p>1. R = 4<sup>' + a + '</sup> mod 23 = <b>' + R + '</b></p>' +
        '<p>2. c = H(m, R) = (3·' + mh + ' + ' + R + ') mod 11 = <b>' + c + '</b></p>' +
        '<p>3. r = a − x·c = ' + a + ' − 7·' + c + ' mod 11 = <b>' + r + '</b></p>' +
        '<p class="dim">Comprobación:</p>' +
        '<p>① 4<sup>' + r + '</sup>·8<sup>' + c + '</sup> mod 23 = ' + chk + ' = R ' + ok(chk === R) + '</p>' +
        '<p>② c = H(m, R) ' + ok(true) + '</p>' +
        '<p class="ok">Firma válida: (c, r) = (' + c + ', ' + r + ')</p>';

      /* Simulación: c, r → R; el hash casi nunca coincide */
      var c2 = +C.value, r2 = +Rr.value, R2 = eslabon(G, y, r2, c2), h2 = H(mh, R2, G.q);
      $('pzCOut').textContent = 'c = ' + c2;
      $('pzROut').textContent = 'r = ' + r2;
      var hits = 0, cand;
      for (cand = 0; cand < G.q; cand++) if (H(mh, eslabon(G, y, r2, cand), G.q) === cand) hits++;
      $('pzSim').innerHTML =
        '<p>1. Eliges c = <b>' + c2 + '</b> y r = <b>' + r2 + '</b></p>' +
        '<p>2. Despejas R = 4<sup>' + r2 + '</sup>·8<sup>' + c2 + '</sup> mod 23 = <b>' + R2 + '</b></p>' +
        '<p>3. El hash de ese R: H(m, ' + R2 + ') = (3·' + mh + ' + ' + R2 + ') mod 11 = <b>' + h2 + '</b></p>' +
        '<p class="dim">Comprobación:</p>' +
        '<p>① R = g<sup>r</sup>·y<sup>c</sup> ' + ok(true) + '</p>' +
        '<p>② c = H(m, R): ' + c2 + (h2 === c2 ? ' = ' : ' ≠ ') + h2 + ' ' + ok(h2 === c2) + '</p>' +
        (h2 === c2
          ? '<p class="ok">¡Le atinaste! Con r = ' + r2 + ', solo ' + hits + ' de los 11 desafíos posibles funciona' + (hits === 1 ? '' : 'n') + '.</p>'
          : '<p class="bad">No es una firma: el desafío no salió del hash.</p>');
    }

    [msg, A, C, Rr].forEach(function (el) { el.addEventListener('input', render); });
    render();
  })();

  /* ==== LABS 2–4: el anillo compartido ==== */
  (function labAnillo() {
    if (!$('rgSvg')) return;

    var S = { gi: 0, n: 5, s: 2, msg: '', keys: null, coins: null, sig: null, mh: 0, step: 0, reveal: false };
    var signerSel = $('rgSigner'), msgIn = $('rgMsg');

    function G() { return GROUPS[S.gi]; }
    function ys() { return S.keys.map(function (k) { return k.y; }); }

    function fillSigners() {
      var html = '';
      for (var i = 0; i < S.n; i++) html += '<option value="' + i + '"' + (i === S.s ? ' selected' : '') + '>' + NAMES[i] + '</option>';
      signerSel.innerHTML = html;
    }

    /** Recalcula la firma. fresh = nuevas claves y nuevo azar. */
    function rebuild(fresh) {
      if (fresh || !S.keys) {
        S.keys = keygen(G(), S.n);
        S.coins = coins(G(), S.n);
      }
      if (S.s >= S.n) S.s = 0;
      S.msg = msgIn.value;
      S.mh = huella(S.msg, G().q);
      S.sig = sign(G(), S.keys, S.s, S.mh, S.coins.a, S.coins.rr);
      S.step = Math.min(S.step, S.n + 1);
      S.reveal = false;
      renderRing();
      buildVerifyInputs();
      restoreVerify();
      renderSuspects();
    }

    /* ---------- LAB 2: diagrama y bitácora ---------- */

    /** Qué se conoce tras k pasos: estado de cada nodo y desafíos ya calculados. */
    function view(k) {
      var n = S.n, st = { status: [], R: [], r: [], c: [], arc: [], now: -1, closed: false };
      for (var i = 0; i < n; i++) st.status[i] = 'pending';
      for (var j = 0; j < Math.min(k, n); j++) {
        var p = S.sig.steps[j];
        st.status[p.i] = j === 0 ? 'signer' : 'sim';
        st.R[p.i] = p.R;
        if (p.kind === 'sim') st.r[p.i] = p.r;
        st.c[p.next] = p.c;
        st.arc[p.i] = true;
        st.now = p.i;
      }
      if (k === n + 1) { st.r[S.s] = S.sig.r[S.s]; st.now = S.s; st.closed = true; }
      return st;
    }

    function ringSVG(st) {
      var n = S.n, cx = 280, cy = 220, RR = 125, NR = 36, out = [];
      var ang = function (i) { return (-90 + 360 * i / n) * Math.PI / 180; };
      var X = function (r, t) { return (cx + r * Math.cos(t)).toFixed(1); };
      var Y = function (r, t) { return (cy + r * Math.sin(t)).toFixed(1); };
      var gap = (NR + 8) / RR, i;

      for (i = 0; i < n; i++) {
        var t1 = ang(i) + gap, t2 = ang(i + 1) - gap, done = st.arc[i] ? ' is-done' : '';
        out.push('<path class="rg-arc' + done + '" d="M' + X(RR, t1) + ' ' + Y(RR, t1) +
          ' A' + RR + ' ' + RR + ' 0 0 1 ' + X(RR, t2) + ' ' + Y(RR, t2) + '"/>');
        /* Punta de flecha: tangente en sentido horario (−sen t, cos t) */
        var ex = cx + RR * Math.cos(t2), ey = cy + RR * Math.sin(t2);
        var tx = -Math.sin(t2), ty = Math.cos(t2), nx = Math.cos(t2), ny = Math.sin(t2);
        out.push('<polygon class="rg-head' + done + '" points="' +
          (ex + 4 * tx).toFixed(1) + ',' + (ey + 4 * ty).toFixed(1) + ' ' +
          (ex - 8 * tx + 6 * nx).toFixed(1) + ',' + (ey - 8 * ty + 6 * ny).toFixed(1) + ' ' +
          (ex - 8 * tx - 6 * nx).toFixed(1) + ',' + (ey - 8 * ty - 6 * ny).toFixed(1) + '"/>');
        var tm = (ang(i) + ang(i + 1)) / 2, j = (i + 1) % n, cv = st.c[j];
        out.push('<text class="rg-lab' + done + '" x="' + X(RR - 32, tm) + '" y="' + Y(RR - 32, tm) +
          '" dy=".35em">c' + subU(j + 1) + ' = ' + (cv === undefined ? '?' : cv) + '</text>');
      }

      for (i = 0; i < n; i++) {
        var t = ang(i), px = X(RR, t), py = Y(RR, t), stt = st.status[i];
        var light = stt === 'signer' ? ' is-light' : '';
        if (i === st.now) out.push('<circle class="rg-now" cx="' + px + '" cy="' + py + '" r="' + (NR + 7) + '"/>');
        out.push('<circle class="rg-node rg-node--' + stt + '" cx="' + px + '" cy="' + py + '" r="' + NR + '"/>');
        out.push('<text class="rg-name' + light + '" x="' + px + '" y="' + (+py - 3) + '">' + NAMES[i] + '</text>');
        out.push('<text class="rg-small' + light + '" x="' + px + '" y="' + (+py + 14) + '">y = ' + S.keys[i].y + '</text>');

        var lines = [];
        if (st.R[i] !== undefined) lines.push('R' + subU(i + 1) + ' = ' + st.R[i]);
        if (st.r[i] !== undefined) lines.push('r' + subU(i + 1) + ' = ' + st.r[i]);
        if (!lines.length) continue;
        var ox = cx + (RR + NR + 16) * Math.cos(t), oy = cy + (RR + NR + 16) * Math.sin(t);
        var cs = Math.cos(t), sn = Math.sin(t), L = lines.length, y0;
        var anchor = cs > 0.3 ? 'start' : (cs < -0.3 ? 'end' : 'middle');
        if (sn < -0.7) y0 = oy - (L - 1) * 16;
        else if (sn > 0.7) y0 = oy + 10;
        else y0 = oy - (L - 1) * 8 + 5;
        for (var l = 0; l < L; l++) {
          out.push('<text class="rg-out" text-anchor="' + anchor + '" x="' + ox.toFixed(1) + '" y="' + (y0 + l * 16).toFixed(1) + '">' + lines[l] + '</text>');
        }
      }
      return '<svg viewBox="0 0 560 440" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';
    }

    function stepText(p) {
      var g = G(), nm = '<b>' + NAMES[p.i] + '</b>', k = p.i + 1;
      if (p.kind === 'start') {
        return nm + ' (quien firma) elige al azar a = ' + p.a + ' y calcula R' + sub(k) +
          ' = g<sup>a</sup> = ' + g.g + '<sup>' + p.a + '</sup> mod ' + g.p + ' = <b>' + p.R + '</b>. ' +
          'El hash le da el desafío de ' + NAMES[p.next] + ': c' + sub(p.next + 1) +
          ' = H(m, ' + p.R + ') = <b>' + p.c + '</b>.';
      }
      if (p.kind === 'sim') {
        return nm + ' no participa: se simula. Le llega c' + sub(k) + ' = ' + p.cin +
          ', se escoge al azar r' + sub(k) + ' = ' + p.r + ' y se despeja R' + sub(k) +
          ' = ' + g.g + '<sup>' + p.r + '</sup>·' + S.keys[p.i].y + '<sup>' + p.cin + '</sup> mod ' + g.p +
          ' = <b>' + p.R + '</b>. Desafío de ' + NAMES[p.next] + ': c' + sub(p.next + 1) +
          ' = H(m, ' + p.R + ') = <b>' + p.c + '</b>.';
      }
      return 'La vuelta regresa a ' + nm + ' con c' + sub(k) + ' = ' + p.cin +
        ', un desafío que no escogió. Con su clave secreta x = ' + p.x + ' cierra el hueco: r' + sub(k) +
        ' = a − x·c = ' + p.a + ' − ' + p.x + '·' + p.cin + ' mod ' + G().q + ' = <b>' + p.r + '</b>. ' +
        '<span class="ok">Anillo cerrado.</span>';
    }

    function sigHTML() {
      var parts = [];
      for (var i = 0; i < S.n; i++) parts.push('r' + sub(i + 1) + ' = ' + S.sig.r[i]);
      return 'σ = (c' + sub(1) + ' = ' + S.sig.c1 + '; ' + parts.join(', ') + ')';
    }

    function renderRing() {
      var n = S.n, k = S.step, st = view(k);
      $('rgSvg').innerHTML = ringSVG(st);

      var keys = '';
      for (var i = 0; i < n; i++) {
        var me = i === S.s;
        keys += '<div><dt>' + NAMES[i] + (me ? ' · firma' : '') + '</dt><dd>y = ' + S.keys[i].y +
          ' · <span class="' + (me ? '' : 'xsecret') + '">x = ' + S.keys[i].x + '</span></dd></div>';
      }
      $('rgKeys').innerHTML = keys;

      var log = '<p class="dim">Paso 0 · Cada miembro publicó su clave pública y. ' + NAMES[S.s] +
        ' va a firmar «' + esc(S.msg) + '», cuya huella es m̂ = ' + S.mh + '.</p>';
      for (var j = 0; j < Math.min(k, n + 1); j++) {
        log += '<p' + (j === k - 1 ? ' class="is-now"' : '') + '><span class="dim">Paso ' + (j + 1) + ' · </span>' +
          stepText(S.sig.steps[j]) + '</p>';
      }
      var box = $('rgLog');
      box.innerHTML = log;
      box.scrollTop = box.scrollHeight;

      $('rgStep').textContent = 'Paso ' + k + ' de ' + (n + 1);
      $('rgSig').innerHTML = st.closed ? sigHTML()
        : '<span class="muted-p">La firma aparece cuando el anillo se cierra.</span>';
      $('rgPrev').disabled = k === 0;
      $('rgNext').disabled = $('rgAll').disabled = k === n + 1;
      $('rgMetSize').textContent = (n + 1) + ' números';
      $('rgMetKeys').textContent = String(n);
      $('rgMetOdds').textContent = '1/' + n;
    }

    $('rgNext').addEventListener('click', function () { if (S.step < S.n + 1) { S.step++; renderRing(); } });
    $('rgPrev').addEventListener('click', function () { if (S.step > 0) { S.step--; renderRing(); } });
    $('rgAll').addEventListener('click', function () { S.step = S.n + 1; renderRing(); });
    $('rgReset').addEventListener('click', function () { S.step = 0; renderRing(); });
    $('rgNew').addEventListener('click', function () { S.step = 0; rebuild(true); });
    $('rgGroup').addEventListener('change', function () { S.gi = +this.value; S.step = 0; rebuild(true); });
    $('rgSize').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-n]');
      if (!btn) return;
      setPressed(this, btn);
      S.n = +btn.getAttribute('data-n');
      if (S.s >= S.n) S.s = S.n - 1;
      S.step = 0;
      fillSigners();
      rebuild(true);
    });
    signerSel.addEventListener('change', function () { S.s = +this.value; S.step = 0; rebuild(false); });
    msgIn.addEventListener('input', function () { rebuild(false); });

    /* ---------- LAB 3: verifica y rompe ---------- */

    function buildVerifyInputs() {
      var html = '';
      for (var i = 0; i < S.n; i++) {
        html += '<div class="field"><label class="field__label" for="vfR' + i + '">r' + subU(i + 1) +
          ' · ' + NAMES[i] + '</label><input type="number" id="vfR' + i + '" min="0" step="1"></div>';
      }
      $('vfR').innerHTML = html;
    }

    function restoreVerify() {
      $('vfMsg').value = S.msg;
      $('vfC1').value = S.sig.c1;
      for (var i = 0; i < S.n; i++) $('vfR' + i).value = S.sig.r[i];
      renderVerify();
    }

    function readInt(el) {
      var v = parseInt(el.value, 10);
      return isNaN(v) ? 0 : v;
    }

    function readVerify() {
      var q = G().q, r = [];
      for (var i = 0; i < S.n; i++) r.push(mod(readInt($('vfR' + i)), q));
      return { msg: $('vfMsg').value, c1: mod(readInt($('vfC1')), q), r: r };
    }

    function renderVerify() {
      var g = G(), inp = readVerify(), mh = huella(inp.msg, g.q);
      var v = verify(g, ys(), mh, inp.c1, inp.r), n = S.n, html = '';
      html += '<p class="dim">Huella del mensaje recibido: m̂ = ' + mh + '. Se arranca con c' + sub(1) + ' = ' + inp.c1 + '.</p>';
      for (var i = 0; i < n; i++) {
        var bad = v.c[i] !== S.sig.c[i] || inp.r[i] !== S.sig.r[i];
        html += '<p><b>' + NAMES[i] + ':</b> R' + sub(i + 1) + ' = ' + g.g + '<sup>' + inp.r[i] + '</sup>·' +
          S.keys[i].y + '<sup>' + v.c[i] + '</sup> mod ' + g.p + ' = <b' + (bad ? ' class="bad"' : '') + '>' + v.R[i] + '</b>' +
          ' → c' + sub(i + 2) + ' = H(m, ' + v.R[i] + ') = <b>' + v.c[i + 1] + '</b></p>';
      }
      html += v.ok
        ? '<p class="ok">c' + sub(n + 1) + ' = ' + v.c[n] + ' = c' + sub(1) + ': el anillo cierra.</p>'
        : '<p class="bad">c' + sub(n + 1) + ' = ' + v.c[n] + ' ≠ c' + sub(1) + ' = ' + inp.c1 + ': el anillo no cierra.</p>';
      $('vfLinks').innerHTML = html;

      var res = $('vfResult');
      res.textContent = v.ok ? 'Válida ✓' : 'Inválida ✗';
      res.className = 'metric__num ' + (v.ok ? 'metric__num--mint' : 'metric__num--coral');
      $('vfEnd').innerHTML = 'c' + sub(n + 1) + ' = ' + v.c[n] + ' · c' + sub(1) + ' = ' + inp.c1;

      var changed = inp.msg !== S.msg || inp.c1 !== S.sig.c1 ||
        inp.r.some(function (x, k) { return x !== S.sig.r[k]; });
      $('vfQ').textContent = g.q;
      $('vfNote').hidden = !(changed && v.ok);
    }

    $('vfMsg').addEventListener('input', renderVerify);
    $('vfC1').addEventListener('input', renderVerify);
    $('vfR').addEventListener('input', renderVerify);
    $('vfRestore').addEventListener('click', restoreVerify);
    $('vfAlter').addEventListener('click', function () {
      /* Busca una alteración visible que rompa la firma; con q tan pequeño
         alguna podría coincidir por casualidad, así que se prueban varias. */
      var tails = ['!', '?', ' (editado)', '.', ' :)', ' ya no'], g = G(), pick = S.msg + tails[0];
      for (var i = 0; i < tails.length; i++) {
        var cand = S.msg + tails[i];
        if (!verify(g, ys(), huella(cand, g.q), S.sig.c1, S.sig.r).ok) { pick = cand; break; }
      }
      $('vfMsg').value = pick;
      $('vfC1').value = S.sig.c1;
      for (var k = 0; k < S.n; k++) $('vfR' + k).value = S.sig.r[k];
      renderVerify();
    });

    /* ---------- LAB 4: todos son sospechosos ---------- */

    function renderSuspects() {
      var g = G(), html = '';
      for (var i = 0; i < S.n; i++) {
        var x = S.keys[i].x, c = S.sig.c[i], r = S.sig.r[i];
        var a2 = mod(r + x * c, g.q), ga = powmod(g.g, a2, g.p), R = S.sig.R[i];
        var real = S.reveal && i === S.s;
        html += '<tr' + (real ? ' class="is-real"' : '') + '><td><strong>' + NAMES[i] + '</strong></td>' +
          '<td class="num">' + x + '</td><td class="num">' + c + '</td><td class="num">' + r + '</td>' +
          '<td class="num">' + r + ' + ' + x + '·' + c + ' mod ' + g.q + ' = ' + a2 + '</td>' +
          '<td class="num">' + ga + '</td><td class="num">' + R + '</td>' +
          '<td>' + (ga === R ? '<span class="status status--ok">✓ posible</span>' : '<span class="status status--bad">✗</span>') +
          (real ? ' <span class="status status--warn">firmó de verdad</span>' : '') + '</td></tr>';
      }
      $('qnTable').innerHTML = html;
      var btn = $('qnReveal');
      btn.setAttribute('aria-pressed', S.reveal ? 'true' : 'false');
      btn.textContent = S.reveal ? 'Ocultar al firmante' : 'Mostrar quién firmó en realidad';
    }

    $('qnReveal').addEventListener('click', function () { S.reveal = !S.reveal; renderSuspects(); });

    fillSigners();
    rebuild(true);
  })();

  /* ==== QUIZ ==== */
  (function quiz() {
    var list = $('quizList');
    if (!list) return;

    var Q = [
      {
        q: 'Una firma de anillo válida sobre un mensaje le demuestra a quien la verifica que…',
        o: ['lo firmó la persona que aparece primero en el anillo',
          'lo firmó alguno de los miembros del anillo, sin revelar cuál',
          'lo firmaron todos los miembros del anillo juntos',
          'lo que dice el mensaje es verdad'],
        a: 1,
        e: 'Prueba que el autor está en el grupo y que el mensaje no se alteró. No dice quién fue y tampoco garantiza que el contenido sea cierto.',
        s: ['idea', '01']
      },
      {
        q: '¿Qué necesita la persona que firma para armar el anillo?',
        o: ['Las claves secretas de todos los miembros',
          'El permiso de cada miembro y la aprobación de un administrador',
          'Su propia clave secreta y las claves públicas de los demás',
          'Solo claves públicas; nadie usa claves secretas'],
        a: 2,
        e: 'Las claves públicas de los demás están a la vista de todos, así que no hace falta su permiso. Su propia clave secreta la usa una sola vez, para cerrar el anillo.',
        s: ['idea', '01']
      },
      {
        q: '¿En qué se diferencia una firma de anillo de una firma de grupo?',
        o: ['En la de grupo hay un administrador que puede revelar quién firmó; en la de anillo nadie tiene ese poder',
          'La firma de anillo siempre es más pequeña',
          'En la de anillo los miembros deben inscribirse antes',
          'No hay diferencia: son dos nombres para lo mismo'],
        a: 0,
        e: 'La firma de grupo necesita un administrador que inscribe a los miembros y puede destapar al firmante. En la de anillo no hay administrador y el secreto es para siempre.',
        s: ['blockchain', '07']
      },
      {
        q: 'Al simular el eslabón de otra persona, ¿cuál es el truco?',
        o: ['Adivinar su clave secreta probando números',
          'Copiar una firma vieja de esa persona',
          'Pedirle que firme en secreto',
          'Invertir el orden: con el desafío c ya dado, escoger la respuesta r y despejar R'],
        a: 3,
        e: 'Si escoges r y despejas R = gʳ·yᶜ, la condición ① se cumple sin conocer la clave secreta. Es aritmética, no hay ningún secreto involucrado.',
        s: ['simular', '03']
      },
      {
        q: 'Si simular no requiere la clave, ¿por qué no sirve para falsificar una firma de una sola persona?',
        o: ['Porque el desafío debe salir del hash de R, y al simular se escoge c antes de conocer R: casi nunca coinciden',
          'Porque la simulación solo funciona con números pares',
          'Porque el verificador pregunta al dueño de la clave',
          'Sí sirve: cualquier firma se puede falsificar así'],
        a: 0,
        e: 'La condición ② exige c = H(m, R). Al simular eliges c primero y el hash de R sale otro número. Solo acertarías por suerte, 1 vez de cada q, y en la práctica q tiene 77 dígitos.',
        s: ['simular', '03']
      },
      {
        q: '¿En qué momento usa quien firma su clave secreta?',
        o: ['Al principio, para escoger a los miembros del anillo',
          'En cada uno de los eslabones',
          'Nunca; por eso la firma es anónima',
          'Al final, para cerrar el único hueco que queda: su propio eslabón'],
        a: 3,
        e: 'Arranca en su eslabón con un número al azar, simula a todos los demás y, cuando la vuelta le regresa un desafío que no escogió, calcula r = a − x·c. Solo ese paso exige la clave.',
        s: ['anillo', '04']
      },
      {
        q: '¿Qué hace quien verifica para aceptar la firma?',
        o: ['Recorre el anillo desde c₁ recalculando cada eslabón y comprueba que vuelve a obtener c₁',
          'Pregunta a cada miembro si fue quien firmó',
          'Comprueba que el firmante esté en una lista oficial',
          'Usa la clave secreta del firmante para descifrar la firma'],
        a: 0,
        e: 'El verificador solo usa datos públicos: el mensaje, las claves públicas y σ. Si la vuelta regresa a c₁, la firma es válida. Además trata a todos los miembros igual.',
        s: ['verificar', '05']
      },
      {
        q: 'Alguien cambia una sola letra del mensaje después de que se firmó. ¿Qué pasa?',
        o: ['Nada: la firma protege a los miembros, no al mensaje',
          'La firma sigue siendo válida, pero cambia quién aparece como firmante',
          'Los desafíos recalculados cambian, la vuelta ya no regresa a c₁ y la firma es inválida',
          'Queda revelada la identidad de quien firmó'],
        a: 2,
        e: 'La huella del mensaje entra en cada hash, así que cambian todos los desafíos y el anillo deja de cerrar. Con nuestros números de juguete puede coincidir por suerte; con números reales, no.',
        s: ['verificar', '05']
      },
      {
        q: 'Una investigadora con una computadora infinitamente potente estudia una firma de anillo de 5 miembros. ¿Puede saber quién firmó?',
        o: ['Sí, probando todas las claves hasta encontrar la correcta',
          'Solo si el anillo tiene menos de 10 miembros',
          'No: para cada miembro existe un camino válido que produce exactamente esa firma; lo mejor que puede hacer es adivinar (1 de 5)',
          'Sí, porque la clave del firmante siempre va primero'],
        a: 2,
        e: 'El anonimato es incondicional: la información sobre quién firmó no está en la firma. Ni conociendo todas las claves secretas se distingue al firmante.',
        s: ['quien', '06']
      },
      {
        q: '¿Por qué Monero usa firmas de anillo enlazables?',
        o: ['Para que la firma ocupe menos espacio',
          'Para que un administrador pueda rastrear a los usuarios',
          'Para detectar, con la imagen de clave, si la misma moneda se gasta dos veces, sin revelar quién la gasta',
          'Para vincular cada transacción con el nombre real del usuario'],
        a: 2,
        e: 'La imagen de clave es siempre la misma para la misma moneda, pero no indica cuál miembro del anillo es. Si aparece dos veces, la red rechaza el segundo gasto.',
        s: ['blockchain', '07']
      },
      {
        q: 'En Monero cada anillo tiene 16 miembros. ¿Qué afirmación es correcta?',
        o: ['La firma mide lo mismo sin importar el tamaño del anillo',
          'La firma revela a la mitad de los miembros',
          'Más miembros hacen que la firma sea más fácil de falsificar',
          'Más miembros dan más anonimato (1 de 16 al adivinar), pero la firma crece con el anillo'],
        a: 3,
        e: 'En la versión de esta lección, la firma tiene n + 1 números. Más miembros significa más señuelos entre los cuales esconderse, a cambio de una firma más grande y una verificación más lenta.',
        s: ['anillo', '04']
      },
      {
        q: '¿Por qué los laboratorios de esta página NO son seguros?',
        o: ['Porque usan números diminutos (q = 11, 23 o 29) y un hash de juguete, así que se pueden probar todas las opciones',
          'Porque corren en un navegador',
          'Porque las firmas de anillo están rotas en general',
          'Porque el anillo tiene menos de 100 miembros'],
        a: 0,
        e: 'Con q = 11 basta probar 11 valores para encontrar cualquier clave secreta. Los sistemas reales usan números de unos 256 bits, normalmente sobre curvas elípticas, y un hash criptográfico.',
        s: ['claves', '02']
      }
    ];

    var LETTERS = 'ABCD', answers = [];

    function render() {
      var html = '';
      Q.forEach(function (item, qi) {
        html += '<fieldset class="clay-card quiz__q" id="qz' + qi + '"><legend><span class="quiz__n">' + (qi + 1) +
          '</span><span>' + item.q + '</span></legend><div class="quiz__opts">';
        item.o.forEach(function (txt, oi) {
          html += '<button type="button" class="quiz__opt" data-q="' + qi + '" data-o="' + oi + '">' +
            '<span class="quiz__letter">' + LETTERS[oi] + '</span><span>' + txt + '</span></button>';
        });
        html += '</div><p class="quiz__fb" id="qzFb' + qi + '" aria-live="polite" hidden></p></fieldset>';
      });
      list.innerHTML = html;
      answers = Q.map(function () { return -1; });
      score();
    }

    function answer(qi, oi) {
      if (answers[qi] !== -1) return;
      answers[qi] = oi;
      var item = Q[qi], right = oi === item.a, box = $('qz' + qi);
      Array.prototype.forEach.call(box.querySelectorAll('.quiz__opt'), function (b) {
        var o = +b.getAttribute('data-o');
        b.disabled = true;
        if (o === item.a) b.classList.add('is-right');
        else if (o === oi) b.classList.add('is-wrong');
      });
      box.classList.add(right ? 'is-right' : 'is-wrong');
      var fb = $('qzFb' + qi);
      fb.innerHTML = (right ? '<strong class="ok">¡Correcto!</strong> ' : '<strong class="bad">No exactamente.</strong> ') +
        item.e + ' <a href="#' + item.s[0] + '">Repasar la sección ' + item.s[1] + '</a>';
      fb.hidden = false;
      score();
    }

    function score() {
      var done = 0, right = 0, total = Q.length;
      answers.forEach(function (a, i) { if (a !== -1) { done++; if (a === Q[i].a) right++; } });
      $('quizDone').textContent = done + ' / ' + total;
      $('quizRight').textContent = String(right);
      $('quizBar').style.width = (100 * done / total) + '%';
      $('quizTag').textContent = done === 0 ? 'sin empezar' : (done < total ? 'en curso' : 'terminado');
      var msg = $('quizMsg');
      if (done < total) {
        $('quizGrade').textContent = done ? Math.round(100 * right / done) + ' %' : '—';
        msg.textContent = 'Responde todas las preguntas para ver tu resultado final.';
        return;
      }
      $('quizGrade').textContent = (Math.round(100 * right / total) / 10).toFixed(1) + ' / 10';
      if (right === total) msg.textContent = '¡Perfecto! Entiendes qué promete una firma de anillo, cómo se construye y por qué nadie puede saber quién firmó.';
      else if (right >= 9) msg.textContent = 'Muy bien. Revisa la explicación de las preguntas que fallaste para afinar los detalles.';
      else if (right >= 6) msg.textContent = 'Vas por buen camino. Cada pregunta fallada indica qué sección repasar; los laboratorios 1 y 2 ayudan mucho.';
      else msg.textContent = 'Te conviene repasar desde la sección 03 (firmar o simular): es la idea en la que se apoya todo lo demás.';
    }

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.quiz__opt');
      if (!btn || btn.disabled) return;
      answer(+btn.getAttribute('data-q'), +btn.getAttribute('data-o'));
    });
    $('quizReset').addEventListener('click', function () {
      render();
      $('qz0').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });

    render();
  })();
})();
