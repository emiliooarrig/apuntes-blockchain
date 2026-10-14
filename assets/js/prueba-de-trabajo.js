/* =========================================================
   ChainNotes — Apunte: La prueba de trabajo y el doble gasto
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Igual que en hash.js, SHA-256 va implementado a mano (WebCrypto
   no existe en file://). Aquí además se expone la función de
   compresión para poder reutilizar el «midstate» al minar.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ==== CORE: primitivas y modelos (sin DOM) ==== */

  /* ---------- SHA-256 con acceso a la compresión ---------- */
  var K = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  var IV = new Int32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);

  /** Procesa un bloque de 64 bytes. w trae las 16 primeras palabras; st se actualiza en sitio. */
  function compress(st, w) {
    var i, x, y;
    for (i = 16; i < 64; i++) {
      x = w[i - 15]; y = w[i - 2];
      w[i] = (w[i - 16] + (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) +
        w[i - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) | 0;
    }
    var a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7], t1, t2;
    for (i = 0; i < 64; i++) {
      t1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
        ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
        ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    st[0] = (st[0] + a) | 0; st[1] = (st[1] + b) | 0; st[2] = (st[2] + c) | 0; st[3] = (st[3] + d) | 0;
    st[4] = (st[4] + e) | 0; st[5] = (st[5] + f) | 0; st[6] = (st[6] + g) | 0; st[7] = (st[7] + h) | 0;
  }

  function wordBE(u8, i) { return (u8[i] << 24) | (u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]; }
  function bswap(x) { return ((x & 0xff) << 24) | ((x & 0xff00) << 8) | ((x >>> 8) & 0xff00) | (x >>> 24); }

  function stateBytes(st) {
    var out = new Uint8Array(32);
    for (var i = 0; i < 8; i++) {
      out[i * 4] = st[i] >>> 24; out[i * 4 + 1] = st[i] >>> 16;
      out[i * 4 + 2] = st[i] >>> 8; out[i * 4 + 3] = st[i];
    }
    return out;
  }

  function sha256(msg) {
    var len = msg.length, total = ((len + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(total);
    buf.set(msg); buf[len] = 0x80;
    var bits = len * 8;
    buf[total - 4] = bits >>> 24; buf[total - 3] = bits >>> 16; buf[total - 2] = bits >>> 8; buf[total - 1] = bits;
    buf[total - 5] = Math.floor(bits / 4294967296);
    var st = new Int32Array(IV), w = new Int32Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = wordBE(buf, off + i * 4);
      compress(st, w);
    }
    return stateBytes(st);
  }
  function sha256d(msg) { return sha256(sha256(msg)); }

  function toHex(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16);
    return s;
  }
  function fromHex(hex) {
    var u = new Uint8Array(hex.length >> 1);
    for (var i = 0; i < u.length; i++) u[i] = parseInt(hex.substr(i * 2, 2), 16);
    return u;
  }
  function reversed(u8) { return Uint8Array.from(u8).reverse(); }
  function le32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }

  /** Bits iniciales en cero de un hash ya invertido (tal como se muestra). */
  function leadingZeroBits(u8) {
    var n = 0;
    for (var i = 0; i < u8.length; i++) {
      if (u8[i] === 0) { n += 8; continue; }
      return n + Math.clz32(u8[i]) - 24;
    }
    return n;
  }

  /* ---------- Encabezado de bloque ---------- */
  var GENESIS = {
    version: 1,
    prev: '0000000000000000000000000000000000000000000000000000000000000000',
    merkle: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    time: 1231006505,
    bits: '1d00ffff',
    nonce: 2083236893
  };

  /** Seis campos → 80 bytes. Los hashes se escriben con los bytes invertidos. */
  function buildHeader(f) {
    var h = new Uint8Array(80);
    h.set(le32(f.version), 0);
    h.set(reversed(fromHex(f.prev)), 4);
    h.set(reversed(fromHex(f.merkle)), 36);
    h.set(le32(f.time), 68);
    h.set(le32(parseInt(f.bits, 16)), 72);
    h.set(le32(f.nonce), 76);
    return h;
  }

  /** Campo «bits» → objetivo de 256 bits (BigInt): c · 256^(e−3). */
  function bitsToTarget(bitsHex) {
    var v = parseInt(bitsHex, 16), e = v >>> 24, c = BigInt(v & 0xffffff);
    return e >= 3 ? c << BigInt(8 * (e - 3)) : c >> BigInt(8 * (3 - e));
  }
  var TWO256 = BigInt(1) << BigInt(256);

  /* ---------- Minería con midstate ---------- */
  /**
   * Prepara un minero para 76 bytes fijos. Los primeros 64 se comprimen UNA vez;
   * por cada nonce sólo se procesan los 16 bytes restantes y el segundo SHA-256.
   */
  function makeMiner(head76) {
    var mid = new Int32Array(IV), w = new Int32Array(64);
    for (var i = 0; i < 16; i++) w[i] = wordBE(head76, i * 4);
    compress(mid, w);
    var t0 = wordBE(head76, 64), t1 = wordBE(head76, 68), t2 = wordBE(head76, 72);
    var s1 = new Int32Array(8), s2 = new Int32Array(8);

    /** Devuelve los bits en cero iniciales (hasta 64) del hash invertido para ese nonce. */
    function tryNonce(nonce) {
      s1.set(mid);
      w[0] = t0; w[1] = t1; w[2] = t2; w[3] = bswap(nonce); w[4] = 0x80000000 | 0;
      w[5] = w[6] = w[7] = w[8] = w[9] = w[10] = w[11] = w[12] = w[13] = w[14] = 0; w[15] = 640;
      compress(s1, w);
      s2.set(IV);
      for (var j = 0; j < 8; j++) w[j] = s1[j];
      w[8] = 0x80000000 | 0; w[9] = w[10] = w[11] = w[12] = w[13] = w[14] = 0; w[15] = 256;
      compress(s2, w);
      var z = Math.clz32(bswap(s2[7]));
      return z < 32 ? z : 32 + Math.clz32(bswap(s2[6]));
    }
    function digest() { return reversed(stateBytes(s2)); }
    return { tryNonce: tryNonce, digest: digest };
  }

  /* ---------- Doble gasto: Poisson (2008) y binomial negativa exacta ---------- */
  function nbPmf(z, q, kmax) {
    var p = 1 - q, out = new Float64Array(kmax + 1);
    out[0] = Math.pow(p, z);
    for (var k = 1; k <= kmax; k++) out[k] = out[k - 1] * (z + k - 1) / k * q;
    return out;
  }
  function poisPmf(lam, kmax) {
    var out = new Float64Array(kmax + 1);
    out[0] = Math.exp(-lam);
    for (var k = 1; k <= kmax; k++) out[k] = out[k - 1] * lam / k;
    return out;
  }
  /** Las tres probabilidades de éxito del atacante con z confirmaciones. */
  function attack(q, z) {
    var p = 1 - q;
    if (q >= p) return { poisson: 1, empate: 1, superar: 1 };
    var r = q / p, i, s;
    var po = poisPmf(z * q / p, z), nb = nbPmf(z, q, z);
    for (s = 0, i = 0; i <= z; i++) s += po[i] * (1 - Math.pow(r, z - i));
    var poisson = 1 - s;
    for (s = 0, i = 0; i <= z - 1; i++) s += nb[i] * (1 - Math.pow(r, z - i));
    var empate = 1 - s;
    for (s = 0, i = 0; i <= z; i++) s += nb[i] * (1 - Math.pow(r, z - i + 1));
    var superar = 1 - s;
    return { poisson: Math.max(poisson, 0), empate: Math.max(empate, 0), superar: Math.max(superar, 0) };
  }
  /** Mínimo de confirmaciones para bajar de un umbral, con cada criterio. */
  function minConfirmations(q, thr) {
    var out = { poisson: null, empate: null, superar: null }, left = 3;
    for (var z = 1; z <= 3000 && left; z++) {
      var a = attack(q, z);
      ['poisson', 'empate', 'superar'].forEach(function (k) {
        if (out[k] === null && a[k] < thr) { out[k] = z; left--; }
      });
    }
    return out;
  }

  /** Una carrera bloque a bloque. Devuelve 0 (fracaso), 1 (sólo empata) o 2 (supera). */
  function race(q, z, cap) {
    var h = 0, a = 0;
    while (h < z) { if (Math.random() < q) a++; else h++; }
    var d = h - a, tie = d <= 0;
    while (d > -1 && d < cap) {
      if (Math.random() < q) d--; else d++;
      if (d <= 0) tie = true;
    }
    return d <= -1 ? 2 : (tie ? 1 : 0);
  }
  /** Intervalo de Wilson al 95 %. */
  function wilson(k, n) {
    var zz = 1.96, ph = k / n, den = 1 + zz * zz / n;
    var c = (ph + zz * zz / (2 * n)) / den;
    var hw = zz / den * Math.sqrt(ph * (1 - ph) / n + zz * zz / (4 * n * n));
    return [Math.max(0, c - hw), Math.min(1, c + hw)];
  }

  /* ---------- Ajuste de dificultad ---------- */
  var SCENARIOS = {
    crecimiento: function (k) { return Math.pow(1.06, k - 1); },
    caida: function (k) { return k >= 9 ? 0.5 : 1; },
    duplicacion: function (k) { return k >= 9 ? 2 : 1; },
    constante: function () { return 1; }
  };
  /** Suma de n exponenciales de media 1 (tiempo de un periodo en unidades de bloque). */
  function sumExp(n) {
    var s = 0;
    for (var i = 0; i < n; i++) s -= Math.log(1 - Math.random());
    return s;
  }
  /**
   * 26 periodos de 2016 bloques. Con y sin ajuste usan los mismos números
   * aleatorios, así la diferencia entre ambas curvas es sólo la regla.
   */
  function simulateDifficulty(name, periods) {
    var H = SCENARIOS[name], D = 1, con = [], sin = [];
    for (var k = 1; k <= periods; k++) {
      var s = sumExp(2016) / 2016, hk = H(k);
      var avgCon = 10 * D / hk * s;
      con.push(avgCon);
      sin.push(10 / hk * s);
      D *= Math.min(4, Math.max(0.25, 10 / avgCon));
    }
    return { con: con, sin: sin };
  }

  /* ---------- Costo eléctrico de un ataque ---------- */
  var NET_HS = 1e21, NET_TWH = 138;
  function attackCost(q, hours, usdKwh) {
    var f = q / (1 - q), pNetGW = NET_TWH * 1000 / 8760;
    var pGW = f * pNetGW;
    return { hs: f * NET_HS, gw: pGW, usd: pGW * 1e6 * hours * usdKwh };
  }

  /* ==== FIN CORE ==== */

  /* =======================================================
     Formato
     ======================================================= */
  var NBSP = ' ';
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function fmtPct(x) {
    var v = x * 100;
    if (v === 0) return '0 %';
    if (v >= 1) return v.toFixed(2) + ' %';
    if (v >= 0.001) return v.toFixed(4) + ' %';
    return v.toExponential(2).replace('e', '×10^') + ' %';
  }
  function fmtSci(x, dec) {
    if (x === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= 3 && e < 6) return fmtInt(x);
    if (e >= -2 && e < 3) return x.toFixed(dec == null ? 2 : dec);
    var m = x / Math.pow(10, e);
    return m.toFixed(dec == null ? 2 : dec) + '×10' + supNum(e);
  }
  function supNum(n) {
    var map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return String(n).split('').map(function (c) { return map[c]; }).join('');
  }
  /** Hash en grupos de 8 con los ceros iniciales resaltados. */
  function hashHtml(hex, zeroBits) {
    var nz = Math.floor((zeroBits || 0) / 4), out = '';
    for (var i = 0; i < hex.length; i++) {
      if (i && i % 8 === 0) out += ' ';
      out += i < nz ? '<b>' + hex[i] + '</b>' : hex[i];
    }
    return out;
  }
  function ms(t) { return t < 1000 ? Math.round(t) + ' ms' : (t / 1000).toFixed(2) + ' s'; }

  /**
   * Agenda la siguiente tanda de un bucle pesado. MessageChannel no espera al
   * repintado (requestAnimationFrame se frena a ~1 fps si la ventana queda tapada)
   * y aun así deja al navegador atender eventos y pintar entre tandas.
   */
  var nextSlice = (function () {
    if (typeof MessageChannel === 'undefined') return function (fn) { setTimeout(fn, 0); };
    var ch = new MessageChannel(), queue = [];
    ch.port1.onmessage = function () { var fn = queue.shift(); if (fn) fn(); };
    return function (fn) { queue.push(fn); ch.port2.postMessage(0); };
  })();

  /* =======================================================
     Gráficas SVG mínimas (reutilizan las clases .sz* de apuntes.css)
     ======================================================= */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, cls, anchor) {
    var t = el('text', { x: x, y: y, 'class': cls || 'szlab', 'text-anchor': anchor || 'middle' }, parent);
    t.textContent = s;
    return t;
  }
  /**
   * Plano cartesiano. opts: {xmin,xmax,ymin,ymax,log,xticks,yticks,xlabel,ylabel,yfmt}
   * Devuelve el <svg> y las funciones de escala.
   */
  function plot(host, opts) {
    host.innerHTML = '';
    var W = 640, H = 300, L = 62, R = 16, T = 16, B = 46;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opts.aria || '' }, host);
    var ly = opts.log;
    function X(v) { return L + (v - opts.xmin) / (opts.xmax - opts.xmin) * (W - L - R); }
    function Y(v) {
      var a = ly ? Math.log10(Math.max(v, opts.ymin)) : v;
      var lo = ly ? Math.log10(opts.ymin) : opts.ymin, hi = ly ? Math.log10(opts.ymax) : opts.ymax;
      return T + (1 - (a - lo) / (hi - lo)) * (H - T - B);
    }
    (opts.yticks || []).forEach(function (v) {
      el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), 'class': 'szgrid' }, svg);
      txt(svg, L - 8, Y(v) + 4, opts.yfmt ? opts.yfmt(v) : String(v), 'szlab', 'end');
    });
    (opts.xticks || []).forEach(function (v) {
      txt(svg, X(v), H - B + 18, String(v));
    });
    if (opts.xlabel) txt(svg, (L + W - R) / 2, H - 6, opts.xlabel, 'szlab szlab--axis');
    if (opts.ylabel) {
      var t = txt(svg, 14, (T + H - B) / 2, opts.ylabel, 'szlab szlab--axis');
      t.setAttribute('transform', 'rotate(-90 14 ' + (T + H - B) / 2 + ')');
    }
    return { svg: svg, X: X, Y: Y };
  }
  function polyline(pl, pts, cls, dash) {
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + pl.X(p[0]).toFixed(1) + ' ' + pl.Y(p[1]).toFixed(1); }).join('');
    var a = { d: d, 'class': 'szline ' + cls };
    if (dash) a['stroke-dasharray'] = dash;
    return el('path', a, pl.svg);
  }

  /* =======================================================
     Lab 0 — ¿Quién lleva el registro?
     ======================================================= */
  (function labLedger() {
    var seg = $('ldgSeg');
    if (!seg) return;
    var btns = seg.querySelectorAll('button');
    var MODELS = {
      nadie: {
        a: ['acepta', 'mint'], b: ['acepta', 'mint'], who: ['nadie', 'coral'],
        log: '<p>La moneda <b>#7F3A</b> es un archivo: se copia y se envía a las dos tiendas.</p>' +
          '<p>Cada tienda verifica la firma, y la firma es válida en ambas copias.</p>' +
          '<p class="bad">Doble gasto exitoso: dos copias igual de válidas.</p>'
      },
      banco: {
        a: ['acepta', 'mint'], b: ['rechaza', 'coral'], who: ['el banco', 'violet'],
        log: '<p>Las dos tiendas preguntan al libro central del banco.</p>' +
          '<p>La primera consulta marca la moneda como gastada; la segunda llega tarde.</p>' +
          '<p class="ok">Doble gasto evitado… a cambio de confiar en un tercero.</p>'
      },
      red: {
        a: ['acepta', 'mint'], b: ['rechaza', 'coral'], who: ['la red', 'violet'],
        log: '<p>Las dos transacciones llegan a la red de nodos y compiten por entrar en un bloque.</p>' +
          '<p>Los nodos adoptan la cadena con más trabajo acumulado: sólo una de las dos queda en ella.</p>' +
          '<p class="ok">Doble gasto evitado, y cualquiera puede verificar el orden por su cuenta.</p>'
      }
    };
    function set(name) {
      var m = MODELS[name];
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.model === name)); });
      [['ldgA', m.a], ['ldgB', m.b], ['ldgWho', m.who]].forEach(function (pair) {
        var n = $(pair[0]);
        n.textContent = pair[1][0];
        n.className = 'metric__num metric__num--' + pair[1][1];
      });
      $('ldgLog').innerHTML = m.log;
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.model); }); });
    set('nadie');
  })();

  /* =======================================================
     Lab 1 — Verifica el bloque génesis
     ======================================================= */
  (function labGenesis() {
    var ids = ['genVersion', 'genPrev', 'genMerkle', 'genTime', 'genBits', 'genNonce'];
    if (!$(ids[0])) return;
    var keys = ['version', 'prev', 'merkle', 'time', 'bits', 'nonce'];

    function load(f) { keys.forEach(function (k, i) { $(ids[i]).value = f[k]; }); }
    function read() {
      var f = {};
      keys.forEach(function (k, i) { f[k] = $(ids[i]).value.trim(); });
      f.version = (+f.version) >>> 0; f.time = (+f.time) >>> 0; f.nonce = (+f.nonce) >>> 0;
      return f;
    }
    function valid(f) {
      return /^[0-9a-f]{64}$/i.test(f.prev) && /^[0-9a-f]{64}$/i.test(f.merkle) && /^[0-9a-f]{8}$/i.test(f.bits);
    }
    function render() {
      var f = read();
      if (!valid(f)) {
        $('genHash').textContent = 'Los hashes deben tener 64 dígitos hexadecimales y «bits», 8.';
        $('genHash').classList.add('is-warn');
        return;
      }
      $('genHash').classList.remove('is-warn');
      var head = buildHeader(f), h = reversed(sha256d(head)), hex = toHex(h), zb = leadingZeroBits(h);
      var target = bitsToTarget(f.bits), ok = BigInt('0x' + hex) <= target;
      $('genBytes').innerHTML = hashHtml(toHex(head), 0);
      $('genHash').innerHTML = hashHtml(hex, zb);
      $('genZeros').textContent = zb + ' bits';
      $('genOk').textContent = ok ? 'cumple' : 'no cumple';
      $('genOk').className = 'metric__num metric__num--' + (ok ? 'mint' : 'coral');
      $('genWork').textContent = target > 0n ? fmtInt(Number(TWO256 / (target + 1n))) : '—';
      var isGen = hex === '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
      $('genOfficial').textContent = isGen ? 'sí, idéntico' : 'ya no';
      $('genOfficial').className = 'metric__num metric__num--' + (isGen ? 'mint' : 'coral');
    }
    ids.forEach(function (id) { $(id).addEventListener('input', render); });
    $('genReset').addEventListener('click', function () { load(GENESIS); render(); });
    load(GENESIS);
    render();
  })();

  /* =======================================================
     Lab 2 — El minero (un bloque y series)
     ======================================================= */
  (function labMiner() {
    var dIn = $('minD');
    if (!dIn) return;
    var job = null;

    function randomHead() {
      var u = new Uint8Array(76);
      for (var i = 0; i < 76; i++) u[i] = (Math.random() * 256) | 0;
      return u;
    }
    function d() { return +dIn.value; }
    function syncD() {
      $('minDOut').textContent = d() + ' bits · ' + fmtInt(Math.pow(2, d())) + ' intentos esperados';
    }
    function busy(on) {
      $('minOne').disabled = on; $('minSeries').disabled = on; $('minStop').disabled = !on;
    }

    /**
     * Mina `blocks` bloques seguidos con un presupuesto de ~14 ms por cuadro.
     * onBlock(tries, digest, zeros) se llama al hallar cada uno.
     */
    function mine(bits, blocks, onBlock, onTick, onDone) {
      var stopped = false, miner = makeMiner(randomHead()), nonce = 0, found = 0, total = 0;
      var t0 = performance.now();
      function frame() {
        if (stopped) return;
        var end = performance.now() + 14;
        while (performance.now() < end) {
          for (var i = 0; i < 2048; i++) {
            var z = miner.tryNonce(nonce);
            nonce++; total++;
            if (z >= bits) {
              onBlock(nonce, miner.digest(), z);
              found++;
              if (found >= blocks) { onTick(total, performance.now() - t0); onDone(true); return; }
              miner = makeMiner(randomHead()); nonce = 0;
            }
          }
        }
        onTick(total, performance.now() - t0);
        nextSlice(frame);
      }
      nextSlice(frame);
      return { stop: function () { stopped = true; onDone(false); } };
    }
    function speed(total, t) { return t > 0 ? fmtSci(total / t * 1000, 2) + ' H/s' : '—'; }

    $('minOne').addEventListener('click', function () {
      var bits = d();
      busy(true);
      $('minHash').innerHTML = '<span class="muted-p">Buscando…</span>';
      job = mine(bits, 1, function (tries, dig, z) {
        $('minHash').innerHTML = hashHtml(toHex(dig), z);
        $('minTries').textContent = fmtInt(tries);
        $('minRatio').textContent = (tries / Math.pow(2, bits)).toFixed(2) + '×';
      }, function (total, t) {
        $('minTries').textContent = fmtInt(total);
        $('minSpeed').textContent = speed(total, t);
        $('minTime').textContent = ms(t);
      }, function () { busy(false); job = null; });
    });

    $('minSeries').addEventListener('click', function () {
      var bits = d(), n = +$('minN').value, samples = [];
      busy(true);
      job = mine(bits, n, function (tries, dig, z) {
        $('minHash').innerHTML = hashHtml(toHex(dig), z);
        samples.push(tries / Math.pow(2, bits));
        if (samples.length % 10 === 0 || samples.length === n) drawHist(samples, n);
      }, function (total, t) {
        $('minSpeed').textContent = speed(total, t);
        $('minTime').textContent = ms(t);
        $('minTries').textContent = fmtInt(total);
      }, function () { busy(false); job = null; if (samples.length) drawHist(samples, n); });
    });

    $('minStop').addEventListener('click', function () { if (job) job.stop(); });
    dIn.addEventListener('input', syncD);
    syncD();
    busy(false);
    drawHist([], 0);

    function drawHist(s, n) {
      var bw = 0.25, bins = new Array(24).fill(0);
      s.forEach(function (x) { var b = Math.floor(x / bw); if (b < 24) bins[b]++; });
      var pl = plot($('minHist'), {
        xmin: 0, xmax: 6, ymin: 0, ymax: 1.1, xticks: [0, 1, 2, 3, 4, 5, 6], yticks: [0, 0.25, 0.5, 0.75, 1],
        xlabel: 'intentos hasta el éxito, en múltiplos de 2^d', ylabel: 'densidad',
        aria: 'Histograma del esfuerzo de minado comparado con la curva exponencial'
      });
      if (s.length) {
        bins.forEach(function (c, i) {
          var dens = c / (s.length * bw), y = pl.Y(Math.min(dens, 1.1));
          el('rect', { x: pl.X(i * bw) + 1, y: y, width: pl.X(bw) - pl.X(0) - 2, height: pl.Y(0) - y, 'class': 'szbar' }, pl.svg);
        });
      }
      var curve = [];
      for (var x = 0; x <= 6; x += 0.05) curve.push([x, Math.exp(-x)]);
      polyline(pl, curve, 'szline--coral');
      txt(pl.svg, pl.X(1.3), pl.Y(0.62), 'teoría: e^(−x)', 'szlab', 'start');

      if (!s.length) {
        $('minMean').textContent = $('minMedian').textContent = $('minOver').textContent = '—';
        return;
      }
      var sorted = s.slice().sort(function (a, b) { return a - b; });
      var mean = s.reduce(function (a, b) { return a + b; }, 0) / s.length;
      var over = s.filter(function (x) { return x > 1; }).length / s.length;
      $('minMean').textContent = mean.toFixed(3) + ' (teoría 1)';
      $('minMedian').textContent = sorted[Math.floor(s.length / 2)].toFixed(3) + ' (teoría 0.693)';
      $('minOver').textContent = (over * 100).toFixed(1) + ' % (teoría 36.8 %)';
      $('minCount').textContent = s.length + ' / ' + n;
    }
  })();

  /* =======================================================
     Lab 3 — El reloj: ajuste de dificultad
     ======================================================= */
  (function labDifficulty() {
    var sel = $('difScenario');
    if (!sel) return;
    function run() {
      var r = simulateDifficulty(sel.value, 26);
      var ymax = Math.max(12, Math.ceil(Math.max.apply(null, r.con.concat(r.sin)) / 4) * 4);
      var yt = [];
      for (var v = 0; v <= ymax; v += ymax > 16 ? 5 : 2) yt.push(v);
      var pl = plot($('difChart'), {
        xmin: 1, xmax: 26, ymin: 0, ymax: ymax, xticks: [1, 5, 10, 15, 20, 25], yticks: yt,
        xlabel: 'periodo (2016 bloques ≈ 2 semanas)', ylabel: 'minutos por bloque',
        aria: 'Tiempo medio por bloque en 26 periodos, con y sin ajuste de dificultad'
      });
      polyline(pl, [[1, 10], [26, 10]], 'szcursor');
      polyline(pl, r.sin.map(function (y, i) { return [i + 1, y]; }), 'szline--coral', '7 6');
      polyline(pl, r.con.map(function (y, i) { return [i + 1, y]; }), 'szline--mint');
      $('difLast').textContent = r.con[25].toFixed(2) + ' min';
      $('difLastNo').textContent = r.sin[25].toFixed(2) + ' min';
      var worst = r.con.reduce(function (m, y) { return Math.abs(y - 10) > Math.abs(m - 10) ? y : m; }, 10);
      $('difWorst').textContent = worst.toFixed(2) + ' min';
    }
    sel.addEventListener('change', run);
    $('difRun').addEventListener('click', run);
    run();
  })();

  /* =======================================================
     Lab 4 — La carrera del atacante
     ======================================================= */
  (function labRace() {
    var qIn = $('rcQ'), zIn = $('rcZ');
    if (!qIn) return;
    var mc = null, job = null;

    function q() { return +qIn.value / 100; }
    function z() { return +zIn.value; }

    function render() {
      $('rcQOut').textContent = qIn.value + ' % del poder de cómputo';
      $('rcZOut').textContent = z() + (z() === 1 ? ' confirmación' : ' confirmaciones');
      var a = attack(q(), z());
      $('rcPois').textContent = fmtPct(a.poisson);
      $('rcTie').textContent = fmtPct(a.empate);
      $('rcBeat').textContent = fmtPct(a.superar);
      $('rcRatio').textContent = a.poisson > 0 ? (a.empate / a.poisson).toFixed(2) + '×' : '—';
      chart();
    }

    function chart() {
      var qq = q(), zmax = Math.max(20, z() + 4), pts = { poisson: [], empate: [], superar: [] };
      for (var k = 1; k <= zmax; k++) {
        var a = attack(qq, k);
        pts.poisson.push([k, a.poisson]); pts.empate.push([k, a.empate]); pts.superar.push([k, a.superar]);
      }
      var lo = Math.max(1e-12, Math.min(pts.superar[zmax - 1][1], pts.poisson[zmax - 1][1]));
      var ymin = Math.pow(10, Math.floor(Math.log10(lo)));
      var yt = [];
      var step = Math.max(1, Math.ceil(-Math.log10(ymin) / 6));
      for (var e = 0; e >= Math.log10(ymin); e -= step) yt.push(Math.pow(10, e));
      var pl = plot($('rcChart'), {
        xmin: 1, xmax: zmax, ymin: ymin, ymax: 1, log: true,
        xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40].filter(function (v) { return v <= zmax; }),
        yticks: yt, yfmt: function (v) { var e = Math.round(Math.log10(v)); return e === 0 ? '1' : '10' + supNum(e); },
        xlabel: 'confirmaciones z', ylabel: 'probabilidad de éxito',
        aria: 'Probabilidad de éxito del atacante según las confirmaciones, en escala logarítmica'
      });
      polyline(pl, [[z(), ymin], [z(), 1]], 'szcursor');
      polyline(pl, pts.poisson, 'szline--amber', '7 6');
      polyline(pl, pts.empate, 'szline--coral');
      polyline(pl, pts.superar, 'szline--violet');
      if (mc && mc.q === qq && mc.z === z()) {
        [['tie', 'szdot--coral'], ['beat', 'szdot--violet']].forEach(function (pair) {
          var r = mc[pair[0]];
          if (r.p <= 0) return;
          el('line', { x1: pl.X(mc.z), x2: pl.X(mc.z), y1: pl.Y(r.ci[0]), y2: pl.Y(r.ci[1]), 'class': 'szline szline--ink' }, pl.svg);
          el('circle', { cx: pl.X(mc.z), cy: pl.Y(r.p), r: 5, 'class': pair[1] }, pl.svg);
        });
      }
    }

    $('rcRun').addEventListener('click', function () {
      var qq = q(), zz = z(), n = +$('rcN').value, done = 0, tie = 0, beat = 0;
      // Tope de ventaja: más allá, el regreso del atacante es menos probable que 1e-6.
      var cap = Math.min(400, Math.ceil(Math.log(1e-6) / Math.log(qq / (1 - qq))));
      $('rcRun').disabled = true;
      $('rcStop').disabled = false;
      var stopped = false;
      function frame() {
        if (stopped) return;
        var end = performance.now() + 14;
        while (done < n && performance.now() < end) {
          for (var i = 0; i < 500 && done < n; i++) {
            var r = race(qq, zz, cap);
            if (r >= 1) tie++;
            if (r === 2) beat++;
            done++;
          }
        }
        $('rcProg').textContent = fmtInt(done) + ' / ' + fmtInt(n);
        if (done < n) { nextSlice(frame); return; }
        finish();
      }
      function finish() {
        $('rcRun').disabled = false; $('rcStop').disabled = true; job = null;
        if (!done) return;
        mc = {
          q: qq, z: zz,
          tie: { p: tie / done, ci: wilson(tie, done) },
          beat: { p: beat / done, ci: wilson(beat, done) }
        };
        var a = attack(qq, zz);
        $('rcLog').innerHTML =
          '<p>' + fmtInt(done) + ' carreras con q = ' + Math.round(qq * 100) + ' % y z = ' + zz + '.</p>' +
          '<p>Empatar: <b>' + fmtPct(mc.tie.p) + '</b> [' + fmtPct(mc.tie.ci[0]) + ' ; ' + fmtPct(mc.tie.ci[1]) +
          '] · exacta ' + fmtPct(a.empate) + ' · Poisson ' + fmtPct(a.poisson) + '</p>' +
          '<p>Superar: <b>' + fmtPct(mc.beat.p) + '</b> [' + fmtPct(mc.beat.ci[0]) + ' ; ' + fmtPct(mc.beat.ci[1]) +
          '] · exacta ' + fmtPct(a.superar) + '</p>' +
          (a.empate >= mc.tie.ci[0] && a.empate <= mc.tie.ci[1]
            ? '<p class="ok">La fórmula exacta cae dentro del intervalo de confianza.</p>'
            : '<p class="bad">La exacta queda fuera del intervalo: con intervalos al 95 % ocurre 1 de cada 20 veces; repite.</p>') +
          (a.poisson < mc.tie.ci[0] ? '<p class="dim">Poisson queda por debajo del intervalo: subestima el riesgo.</p>' : '');
        chart();
      }
      job = { stop: function () { stopped = true; finish(); } };
      nextSlice(frame);
    });
    $('rcStop').addEventListener('click', function () { if (job) job.stop(); });

    qIn.addEventListener('input', render);
    zIn.addEventListener('input', render);
    render();

    // Tabla de confirmaciones necesarias para bajar de 0.1 %
    var body = $('confTable');
    if (body) {
      body.innerHTML = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45].map(function (qq) {
        var c = minConfirmations(qq, 0.001);
        return '<tr><td class="num">' + Math.round(qq * 100) + ' %</td><td class="num">' + c.poisson +
          '</td><td class="num">' + c.empate + '</td><td class="num">' + c.superar + '</td></tr>';
      }).join('');
    }
  })();

  /* =======================================================
     Lab 5 — ¿Cuánto cuesta atacar?
     ======================================================= */
  (function labCost() {
    var qIn = $('cstQ');
    if (!qIn) return;
    function render() {
      var q = +qIn.value / 100, h = +$('cstH').value, pr = +$('cstP').value / 100;
      $('cstQOut').textContent = qIn.value + ' %';
      $('cstHOut').textContent = h + ' h';
      $('cstPOut').textContent = pr.toFixed(2) + ' USD/kWh';
      var c = attackCost(q, h, pr);
      $('cstHs').textContent = (c.hs / 1e18).toFixed(1) + ' EH/s';
      $('cstGw').textContent = c.gw.toFixed(2) + ' GW';
      $('cstUsd').textContent = (c.usd / 1e6).toFixed(2) + ' M USD';
      $('cstWin').textContent = fmtPct(attack(q, 6).superar);
    }
    ['cstQ', 'cstH', 'cstP'].forEach(function (id) { $(id).addEventListener('input', render); });
    render();
  })();

  /* Barras animadas (mezcla energética, halving) */
  (function fills() {
    var items = document.querySelectorAll('.decay__fill[data-w]');
    if (!items.length) return;
    function show(n) { n.style.width = n.dataset.w + '%'; if (n.dataset.label) n.textContent = n.dataset.label; }
    if (!('IntersectionObserver' in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    items.forEach(function (n) { io.observe(n); });
  })();

})();
