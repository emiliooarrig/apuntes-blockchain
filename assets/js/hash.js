/* =========================================================
   ChainNotes — Apunte 01: Funciones hash
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   SHA-256 va implementado a mano y no con WebCrypto a propósito:
   crypto.subtle sólo existe en contextos seguros, y estos apuntes
   deben poder abrirse con doble clic desde el disco (file://).
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* =======================================================
     1. Primitivas
     ======================================================= */

  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  var W = new Uint32Array(64);
  // Los laboratorios hacen millones de llamadas: se reutiliza un búfer de relleno
  // en lugar de pedir memoria nueva en cada hash.
  var scratch = new Uint8Array(320);

  /** SHA-256 sobre un Uint8Array. Devuelve 32 bytes. */
  function sha256(data) {
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    var len = data.length;
    // Relleno: 0x80, ceros, y la longitud en bits como entero de 64 bits big-endian.
    var total = (((len + 8) >> 6) + 1) << 6;
    var padded;
    if (total <= scratch.length) {
      padded = scratch.subarray(0, total);
      padded.fill(0);
    } else {
      padded = new Uint8Array(total);
    }
    padded.set(data);
    padded[len] = 0x80;
    var bitLen = len * 8;
    var hi = Math.floor(bitLen / 4294967296);
    var lo = bitLen >>> 0;
    var p = padded.length;
    padded[p - 8] = (hi >>> 24) & 255; padded[p - 7] = (hi >>> 16) & 255;
    padded[p - 6] = (hi >>> 8) & 255;  padded[p - 5] = hi & 255;
    padded[p - 4] = (lo >>> 24) & 255; padded[p - 3] = (lo >>> 16) & 255;
    padded[p - 2] = (lo >>> 8) & 255;  padded[p - 1] = lo & 255;

    for (var off = 0; off < p; off += 64) {
      var i;
      for (i = 0; i < 16; i++) {
        W[i] = (padded[off + i * 4] << 24) | (padded[off + i * 4 + 1] << 16) |
               (padded[off + i * 4 + 2] << 8) | padded[off + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        var w15 = W[i - 15], w2 = W[i - 2];
        var s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
        var s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }

      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + W[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }

      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }

    var out = new Uint8Array(32);
    var words = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (var j = 0; j < 8; j++) {
      out[j * 4] = (words[j] >>> 24) & 255;
      out[j * 4 + 1] = (words[j] >>> 16) & 255;
      out[j * 4 + 2] = (words[j] >>> 8) & 255;
      out[j * 4 + 3] = words[j] & 255;
    }
    return out;
  }

  var encoder = new TextEncoder();
  function utf8(str) {
    // Camino rápido para ASCII, que es el 99 % de lo que hashean los laboratorios.
    var n = str.length, i, c;
    var u = new Uint8Array(n);
    for (i = 0; i < n; i++) {
      c = str.charCodeAt(i);
      if (c > 127) return encoder.encode(str);
      u[i] = c;
    }
    return u;
  }

  var HEX = [];
  for (var hi_ = 0; hi_ < 256; hi_++) HEX.push((hi_ < 16 ? '0' : '') + hi_.toString(16));
  function toHex(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += HEX[u8[i]];
    return s;
  }
  function sha256Hex(str) { return toHex(sha256(utf8(str))); }
  /** Doble SHA-256: la variante que usa Bitcoin en TXID y árboles de Merkle. */
  function dsha(u8) { return sha256(sha256(u8)); }
  function dshaHex(str) { return toHex(dsha(utf8(str))); }
  function concat(a, b) {
    var r = new Uint8Array(a.length + b.length);
    r.set(a); r.set(b, a.length);
    return r;
  }
  /** Los primeros n bits del digest, leídos como entero. n <= 32. */
  function truncBits(u8, n) {
    var v = ((u8[0] << 24) | (u8[1] << 16) | (u8[2] << 8) | u8[3]) >>> 0;
    return n >= 32 ? v : v >>> (32 - n);
  }

  /* --- Funciones no criptográficas, sólo para comparar --- */
  var crcTable = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xffffffff;
    for (var i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function byteSum(u8) {
    var s = 0;
    for (var i = 0; i < u8.length; i++) s = (s + u8[i] * (i + 1)) >>> 0;
    return s >>> 0;
  }
  function xorWords(u8) {
    var s = 0;
    for (var i = 0; i < u8.length; i += 4) {
      s ^= ((u8[i] << 24) | ((u8[i + 1] || 0) << 16) | ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0));
    }
    return s >>> 0;
  }
  function word32ToBytes(v) {
    return new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
  }

  var FUNCS = {
    'sha256': { label: 'SHA-256', bits: 256, run: function (u8) { return sha256(u8); } },
    'crc32':  { label: 'CRC32',   bits: 32,  run: function (u8) { return word32ToBytes(crc32(u8)); } },
    'suma':   { label: 'suma de bytes', bits: 32, run: function (u8) { return word32ToBytes(byteSum(u8)); } },
    'xor':    { label: 'XOR de palabras', bits: 32, run: function (u8) { return word32ToBytes(xorWords(u8)); } }
  };

  function popcount8(x) {
    x = x - ((x >> 1) & 0x55);
    x = (x & 0x33) + ((x >> 2) & 0x33);
    return (x + (x >> 4)) & 0x0f;
  }
  /** Distancia de Hamming entre dos digests del mismo tamaño. */
  function hamming(a, b) {
    var d = 0;
    for (var i = 0; i < a.length; i++) d += popcount8(a[i] ^ b[i]);
    return d;
  }

  /* --- Utilidades varias --- */
  function fmt(n, dec) {
    if (!isFinite(n)) return '∞';
    return n.toLocaleString('es-MX', { maximumFractionDigits: dec === undefined ? 0 : dec });
  }
  function fmtBig(n) {
    if (n < 1e6) return fmt(n);
    var exp = Math.log(n) / Math.LN2;
    return '≈ 2^' + exp.toFixed(1);
  }
  function ms(t) { return t < 1000 ? Math.round(t) + ' ms' : (t / 1000).toFixed(2) + ' s'; }
  function randomWord() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  function randomBytes(n) {
    var u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = (Math.random() * 256) | 0;
    return u;
  }

  /**
   * Ejecuta un bucle pesado por tandas para no congelar la interfaz.
   * step(): devuelve true cuando terminó. Devuelve un objeto con .stop().
   */
  function runChunks(step, chunk, onTick, onDone) {
    var stopped = false;
    function loop() {
      if (stopped) return;
      for (var i = 0; i < chunk; i++) {
        if (step()) { if (onTick) onTick(); if (onDone) onDone(true); return; }
      }
      if (onTick) onTick();
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
    return { stop: function () { stopped = true; if (onDone) onDone(false); } };
  }

  /* =======================================================
     Lab 1 — Espejo de bits: el efecto avalancha en vivo
     ======================================================= */
  (function labMirror() {
    var input = $('mirrorInput');
    var grid = $('mirrorGrid');
    var out = $('mirrorHash');
    var flips = $('mirrorFlips');
    var pct = $('mirrorPct');
    if (!input || !grid || !out) return;

    var cells = [];
    for (var i = 0; i < 256; i++) {
      var cell = document.createElement('i');
      grid.appendChild(cell);
      cells.push(cell);
    }

    var prev = null;

    function render() {
      var digest = sha256(utf8(input.value));
      var changed = 0;

      for (var i = 0; i < 256; i++) {
        var bit = (digest[i >> 3] >> (7 - (i & 7))) & 1;
        var prevBit = prev ? (prev[i >> 3] >> (7 - (i & 7))) & 1 : bit;
        var flipped = prev !== null && bit !== prevBit;
        if (flipped) changed++;
        cells[i].className = (bit ? 'on' : '') + (flipped ? ' flip' : '');
      }

      out.textContent = toHex(digest);
      if (prev === null) {
        flips.textContent = '—';
        pct.textContent = '—';
      } else {
        flips.textContent = changed + ' / 256';
        pct.textContent = (changed / 2.56).toFixed(1) + ' %';
      }
      prev = digest;
    }

    input.addEventListener('input', render);
    render();
    prev = null;
    render();
  })();

  /* =======================================================
     Lab 2 — Medidor de avalancha: el 50 % no basta
     ======================================================= */
  (function labAvalanche() {
    var btn = $('avBtn');
    if (!btn) return;
    var sel = $('avFunc');
    var bars = $('avBars');
    var acEl = $('avAC'), sdEl = $('avSD'), patEl = $('avPat'), nEl = $('avN');

    var BINS = 33;
    var barEls = [];
    for (var b = 0; b < BINS; b++) {
      var el = document.createElement('i');
      el.style.height = '2%';
      bars.appendChild(el);
      barEls.push(el);
    }

    btn.addEventListener('click', function () {
      var fn = FUNCS[sel.value];
      var trials = 400;
      var n = fn.bits;
      var counts = new Array(BINS).fill(0);
      var patterns = Object.create(null);
      var distinct = 0;
      var sum = 0, sumSq = 0;

      for (var t = 0; t < trials; t++) {
        var msg = randomBytes(32);
        var d1 = fn.run(msg);
        // Siempre el mismo bit de entrada, mensajes distintos:
        // así se ve si el patrón de diferencia depende o no del mensaje.
        msg[0] ^= 0x08;
        var d2 = fn.run(msg);

        var diff = new Uint8Array(d1.length);
        for (var i = 0; i < d1.length; i++) diff[i] = d1[i] ^ d2[i];
        var key = toHex(diff);
        if (!patterns[key]) { patterns[key] = 1; distinct++; }

        var h = hamming(d1, d2);
        sum += h; sumSq += h * h;
        counts[Math.round((h / n) * (BINS - 1))]++;
      }

      var mean = sum / trials;
      var variance = Math.max(0, sumSq / trials - mean * mean);
      var max = Math.max.apply(null, counts) || 1;

      barEls.forEach(function (el, idx) {
        el.style.height = Math.max(2, (counts[idx] / max) * 100) + '%';
        el.classList.toggle('hot', idx === Math.round((BINS - 1) / 2));
        el.title = 'Cambiaron ≈ ' + Math.round((idx / (BINS - 1)) * n) + ' bits en ' + counts[idx] + ' pruebas';
      });

      acEl.textContent = ((mean / n) * 100).toFixed(1) + ' %';
      sdEl.textContent = Math.sqrt(variance).toFixed(2) + ' / ' + (Math.sqrt(n) / 2).toFixed(2);
      patEl.textContent = distinct + ' / ' + trials;
      nEl.textContent = n + ' bits';

      acEl.className = 'metric__num ' + (Math.abs(mean / n - 0.5) < 0.05 ? 'metric__num--mint' : 'metric__num--coral');
      patEl.className = 'metric__num ' + (distinct > trials * 0.9 ? 'metric__num--mint' : 'metric__num--coral');
    });
  })();

  /* =======================================================
     Lab 3 — Caza de colisiones sobre un hash truncado
     ======================================================= */
  (function labCollision() {
    var start = $('colStart');
    if (!start) return;
    var stop = $('colStop');
    var range = $('colBits');
    var bitsLabel = $('colBitsLabel');
    var modeBtns = Array.prototype.slice.call(document.querySelectorAll('#colModes button'));
    var tries = $('colTries'), theory = $('colTheory'), time = $('colTime'), log = $('colLog');

    var mode = 'colision';
    var job = null;

    function theoretical(n) {
      return mode === 'colision' ? 1.1774 * Math.pow(2, n / 2) : Math.pow(2, n - 1);
    }
    function refresh() {
      var n = +range.value;
      bitsLabel.textContent = n + ' bits';
      theory.textContent = fmt(Math.round(theoretical(n))) + ' intentos';
    }
    range.addEventListener('input', refresh);

    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        modeBtns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        mode = b.dataset.mode;
        refresh();
      });
    });
    refresh();

    function say(html) { log.innerHTML = html; }

    start.addEventListener('click', function () {
      if (job) job.stop();
      var n = +range.value;
      var t0 = performance.now();
      var count = 0;
      var seen = Object.create(null);
      var objetivo = null, fijo = null;

      if (mode === 'preimagen') {
        objetivo = truncBits(sha256(utf8('recompensa: 50 BTC')), n);
      } else if (mode === 'segunda') {
        fijo = 'contrato de compraventa · v1';
        objetivo = truncBits(sha256(utf8(fijo)), n);
      }

      start.disabled = true; stop.disabled = false;
      say('<p class="dim">Buscando…</p>');

      function step() {
        var cand = randomWord();
        var v = truncBits(sha256(utf8(cand)), n);
        count++;

        if (mode === 'colision') {
          if (seen[v] !== undefined && seen[v] !== cand) {
            finish(seen[v], cand, v, n);
            return true;
          }
          seen[v] = cand;
        } else if (seen[v] === undefined && v === objetivo) {
          finish(mode === 'segunda' ? fijo : '(desconocida)', cand, v, n);
          return true;
        }
        return false;
      }

      function finish(a, b, v, bits) {
        var t = performance.now() - t0;
        var hexv = v.toString(16).padStart(Math.ceil(bits / 4), '0');
        var titulo = mode === 'colision' ? 'Colisión encontrada'
                   : mode === 'segunda' ? 'Segunda preimagen encontrada'
                   : 'Preimagen encontrada';
        say('<p><span class="ok">' + titulo + '</span></p>' +
            '<p>x&nbsp;&nbsp;= ' + escapeHtml(a) + '</p>' +
            '<p>x′ = ' + escapeHtml(b) + '</p>' +
            '<p class="dim">H(x) truncado a ' + bits + ' bits = 0x' + hexv + '</p>' +
            '<p class="dim">' + fmt(count) + ' intentos · predicción ' + fmt(Math.round(theoretical(bits))) + '</p>');
        time.textContent = ms(t);
      }

      job = runChunks(step, 4000,
        function () { tries.textContent = fmt(count); },
        function () { start.disabled = false; stop.disabled = true; job = null; }
      );
    });

    stop.addEventListener('click', function () {
      if (job) job.stop();
      log.innerHTML += '<p class="bad">Detenido por el usuario.</p>';
    });
  })();

  /* =======================================================
     Lab 4 — La paradoja del cumpleaños
     ======================================================= */
  (function labBirthday() {
    var kRange = $('bdK');
    if (!kRange) return;
    var space = $('bdSpace');
    var kLabel = $('bdKLabel');
    var exact = $('bdExact'), approx = $('bdApprox'), half = $('bdHalf');
    var bar = $('bdBar');

    function N() { return +space.value; }

    function update() {
      var n = N();
      var maxK = Math.min(200000, Math.max(40, Math.round(6 * Math.sqrt(n))));
      kRange.max = maxK;
      var k = Math.min(+kRange.value, maxK);

      // Probabilidad exacta: producto de (N-i)/N.
      var p = 1;
      for (var i = 0; i < k; i++) {
        p *= (n - i) / n;
        if (p === 0) break;
      }
      var pExact = 1 - p;
      var pApprox = 1 - Math.exp(-(k * (k - 1)) / (2 * n));

      kLabel.textContent = fmt(k) + ' elementos';
      exact.textContent = (pExact * 100).toFixed(2) + ' %';
      approx.textContent = (pApprox * 100).toFixed(2) + ' %';
      half.textContent = fmt(Math.ceil(1.1774 * Math.sqrt(n)));
      bar.style.width = (pExact * 100).toFixed(1) + '%';
      bar.textContent = (pExact * 100).toFixed(0) + ' %';
    }

    kRange.addEventListener('input', update);
    space.addEventListener('change', function () {
      var n = N();
      kRange.value = Math.ceil(1.1774 * Math.sqrt(n));
      update();
    });
    update();
  })();

  /* =======================================================
     Lab 5 — Tabla arcoíris contra sal
     ======================================================= */
  (function labSalt() {
    var btn = $('saltBtn');
    if (!btn) return;
    var salted = $('saltOn');
    var cracked = $('saltCracked'), hashes = $('saltHashes'), time = $('saltTime');
    var log = $('saltLog');

    var base = ['123456', 'password', 'qwerty', 'admin', 'iloveyou', 'bitcoin', 'dragon', 'futbol',
                'hola123', 'monkey', 'letmein', 'sunshine', 'princesa', 'blockchain', 'satoshi'];
    var usuarios = [
      { u: 'ana',    p: 'bitcoin' },
      { u: 'beto',   p: '123456' },
      { u: 'carla',  p: 'qwerty' },
      { u: 'diego',  p: 'satoshi' },
      { u: 'elena',  p: 'password' },
      { u: 'fer',    p: 'hola123' },
      { u: 'gaby',   p: 'blockchain' },
      { u: 'hugo',   p: 'futbol' }
    ];

    // Diccionario del atacante: las comunes más ruido. Se baraja para que las
    // contraseñas reales no queden al principio y el conteo de hashes sea honesto.
    var dic = base.slice();
    for (var i = 0; i < 1985; i++) dic.push('pass' + i);
    for (var s = dic.length - 1; s > 0; s--) {
      var q = (Math.random() * (s + 1)) | 0;
      var tmp = dic[s]; dic[s] = dic[q]; dic[q] = tmp;
    }

    btn.addEventListener('click', function () {
      var useSalt = salted.checked;
      var t0 = performance.now();
      var calc = 0, roto = 0;
      var lineas = [];

      var registros = usuarios.map(function (x, idx) {
        var s = useSalt ? 'sal' + idx + '_' + (Math.random().toString(36).slice(2, 10)) : '';
        return { u: x.u, s: s, v: sha256Hex(s + x.p) };
      });

      if (!useSalt) {
        // Una sola tabla arcoíris sirve para toda la base de datos.
        var tabla = Object.create(null);
        dic.forEach(function (c) { tabla[sha256Hex(c)] = c; calc++; });
        registros.forEach(function (r) {
          var hit = tabla[r.v];
          if (hit) { roto++; lineas.push('<p><span class="bad">' + r.u + '</span> → ' + hit + '</p>'); }
        });
      } else {
        // Con sal hay que rehacer el trabajo para cada usuario.
        registros.forEach(function (r) {
          for (var j = 0; j < dic.length; j++) {
            calc++;
            if (sha256Hex(r.s + dic[j]) === r.v) {
              roto++;
              lineas.push('<p><span class="bad">' + r.u + '</span> → ' + dic[j] + ' <span class="dim">(sal ' + r.s + ')</span></p>');
              break;
            }
          }
        });
      }

      cracked.textContent = roto + ' / ' + usuarios.length;
      hashes.textContent = fmt(calc);
      time.textContent = ms(performance.now() - t0);
      // Proyección: es donde se ve de verdad la diferencia entre O(|D|) y O(u·|D|).
      var millon = useSalt ? 1000000 * (calc / usuarios.length) : dic.length;
      log.innerHTML = (useSalt
        ? '<p class="dim">Con sal: una tabla por usuario. El diccionario hay que recorrerlo ' +
          usuarios.length + ' veces, una por cada valor de sal.</p>'
        : '<p class="dim">Sin sal: una sola tabla de ' + fmt(dic.length) +
          ' entradas sirve para todos los usuarios de todas las bases de datos del mundo.</p>')
        + lineas.join('')
        + '<p class="dim">Proyectado a un millón de usuarios: <strong>' + fmtBig(millon) +
        ' hashes</strong>' + (useSalt ? '' : ' — la misma tabla, sin trabajo extra') + '.</p>';
    });
  })();

  /* =======================================================
     Lab 6 — Árbol de Merkle y prueba de inclusión
     ======================================================= */
  (function labMerkle() {
    var build = $('mkBuild');
    if (!build) return;
    var ta = $('mkTxs'), sel = $('mkPick'), proofBtn = $('mkProof'), tamperBtn = $('mkTamper');
    var view = $('mkTree');
    var rootEl = $('mkRoot'), leavesEl = $('mkLeaves'), heightEl = $('mkHeight'), sizeEl = $('mkSize');
    var log = $('mkLog');

    var levels = [], txs = [], tampered = -1;

    function leaves(list) { return list.map(function (t) { return dsha(utf8(t)); }); }

    function buildTree(list) {
      var lv = [leaves(list)];
      while (lv[lv.length - 1].length > 1) {
        var cur = lv[lv.length - 1], next = [];
        for (var i = 0; i < cur.length; i += 2) {
          var a = cur[i];
          var b = (i + 1 < cur.length) ? cur[i + 1] : cur[i]; // se duplica la última hoja
          next.push(dsha(concat(a, b)));
        }
        lv.push(next);
      }
      return lv;
    }

    function proofFor(idx) {
      var path = [], i = idx;
      for (var l = 0; l < levels.length - 1; l++) {
        var cur = levels[l];
        var sib = (i % 2 === 0) ? Math.min(i + 1, cur.length - 1) : i - 1;
        path.push({ level: l, index: sib, right: i % 2 === 0 });
        i = i >> 1;
      }
      return path;
    }

    function render(highlight) {
      view.innerHTML = '';
      for (var l = levels.length - 1; l >= 0; l--) {
        var row = document.createElement('div');
        row.className = 'merkle__level';
        for (var i = 0; i < levels[l].length; i++) {
          var node = document.createElement('span');
          node.className = 'merkle__node';
          node.textContent = toHex(levels[l][i]).slice(0, 8);
          node.title = 'nivel ' + l + ' · índice ' + i + '\n' + toHex(levels[l][i]);
          if (l === levels.length - 1) node.classList.add('merkle__node--root');
          if (highlight) {
            if (highlight.path.some(function (p) { return p.level === l && p.index === i; })) {
              node.classList.add('merkle__node--sib');
            }
            if (highlight.chain[l] === i) node.classList.add('merkle__node--path');
          }
          if (tampered >= 0 && l === 0 && i === tampered) node.classList.add('merkle__node--bad');
          row.appendChild(node);
        }
        view.appendChild(row);
      }
    }

    function refreshSelect() {
      sel.innerHTML = '';
      txs.forEach(function (t, i) {
        var o = document.createElement('option');
        o.value = String(i);
        o.textContent = (i + 1) + ' · ' + t.slice(0, 34);
        sel.appendChild(o);
      });
    }

    function rebuild() {
      txs = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (txs.length < 2) { log.innerHTML = '<p class="bad">Hacen falta al menos dos transacciones.</p>'; return; }
      tampered = -1;
      levels = buildTree(txs);
      refreshSelect();
      render(null);
      var d = levels.length - 1;
      rootEl.textContent = toHex(levels[levels.length - 1][0]).slice(0, 24) + '…';
      leavesEl.textContent = txs.length;
      heightEl.textContent = d + ' niveles';
      sizeEl.textContent = d + ' hashes · ' + (d * 32) + ' B';
      log.innerHTML = '<p class="dim">Árbol construido con doble SHA-256, igual que Bitcoin. ' +
        'Pide una prueba de inclusión para ver qué hashes viaja realmente un cliente ligero.</p>';
    }

    build.addEventListener('click', rebuild);

    proofBtn.addEventListener('click', function () {
      if (!levels.length) return;
      var idx = +sel.value;
      var path = proofFor(idx);
      var chain = [idx];
      for (var l = 0; l < levels.length - 1; l++) chain.push(chain[l] >> 1);
      render({ path: path, chain: chain });

      // El verificador recomputa la raíz sólo con la hoja y los hermanos.
      var r = dsha(utf8(txs[idx]));
      var lineas = ['<p><span class="ok">Prueba de inclusión de la hoja ' + (idx + 1) + '</span></p>',
                    '<p class="dim">r₀ = dSHA(tx) = ' + toHex(r).slice(0, 16) + '…</p>'];
      path.forEach(function (p, j) {
        var sib = levels[p.level][p.index];
        r = dsha(p.right ? concat(r, sib) : concat(sib, r));
        lineas.push('<p>σ' + j + ' = ' + toHex(sib).slice(0, 16) + '… <span class="dim">(' +
          (p.right ? 'derecha' : 'izquierda') + ')</span> → r' + (j + 1) + ' = ' + toHex(r).slice(0, 16) + '…</p>');
      });
      var ok = toHex(r) === toHex(levels[levels.length - 1][0]);
      lineas.push('<p><span class="' + (ok ? 'ok' : 'bad') + '">' +
        (ok ? 'r_d coincide con la raíz: la transacción está en el bloque.' : 'La raíz no coincide: prueba inválida.') +
        '</span></p>');
      lineas.push('<p class="dim">Se transmitieron ' + path.length + ' hashes (' + (path.length * 32) +
        ' bytes) en lugar de las ' + txs.length + ' transacciones.</p>');
      log.innerHTML = lineas.join('');
    });

    tamperBtn.addEventListener('click', function () {
      if (!levels.length) return;
      var idx = +sel.value;
      txs[idx] = txs[idx] + ' [ALTERADA]';
      ta.value = txs.join('\n');
      tampered = idx;
      var antes = toHex(levels[levels.length - 1][0]);
      levels = buildTree(txs);
      var despues = toHex(levels[levels.length - 1][0]);
      render(null);
      rootEl.textContent = despues.slice(0, 24) + '…';
      log.innerHTML = '<p><span class="bad">Hoja ' + (idx + 1) + ' alterada.</span></p>' +
        '<p class="dim">raíz anterior: ' + antes.slice(0, 32) + '…</p>' +
        '<p class="dim">raíz nueva:&nbsp;&nbsp;&nbsp; ' + despues.slice(0, 32) + '…</p>' +
        '<p>Cambió toda la rama hasta la raíz: cualquier nodo completo lo detecta al comparar contra la cabecera del bloque.</p>';
    });

    rebuild();
  })();

  /* =======================================================
     Lab 7 — El volado por teléfono (esquema de compromiso)
     ======================================================= */
  (function labCommit() {
    var commit = $('cmCommit');
    if (!commit) return;
    var reveal = $('cmReveal'), attack = $('cmAttack');
    var useR = $('cmUseR');
    var choiceBtns = Array.prototype.slice.call(document.querySelectorAll('#cmChoice button'));
    var out = $('cmOut'), log = $('cmLog');

    var choice = 'aguila', r = null, c = null;

    choiceBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        choiceBtns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        choice = b.dataset.choice;
      });
    });

    commit.addEventListener('click', function () {
      r = useR.checked ? toHex(randomBytes(16)) : '';
      c = sha256Hex(choice + '|' + r);
      out.textContent = c;
      reveal.disabled = false; attack.disabled = false;
      log.innerHTML = '<p><span class="ok">Fase 1 · Alice publica c = H(m ‖ r)</span></p>' +
        '<p class="dim">Bob recibe únicamente el compromiso. ' +
        (useR.checked ? 'El valor aleatorio r queda guardado con Alice.' : 'Sin valor aleatorio: c = H(m).') + '</p>';
    });

    reveal.addEventListener('click', function () {
      log.innerHTML = '<p><span class="ok">Fase 2 · Alice abre el sobre</span></p>' +
        '<p>m = ' + choice + (r ? '<br>r = ' + r : '') + '</p>' +
        '<p class="dim">Bob recomputa H(m ‖ r) y obtiene ' + sha256Hex(choice + '|' + r).slice(0, 32) + '…</p>' +
        '<p><span class="ok">Coincide con el compromiso: Alice no pudo cambiar de opinión.</span></p>';
    });

    attack.addEventListener('click', function () {
      var t0 = performance.now();
      var opciones = ['aguila', 'sol'];
      var found = null, intentos = 0;

      // Bob prueba las dos opciones posibles. Sin r hay exactamente dos candidatos.
      for (var i = 0; i < opciones.length && !found; i++) {
        intentos++;
        if (sha256Hex(opciones[i] + '|') === c) found = opciones[i];
      }

      if (found) {
        log.innerHTML = '<p><span class="bad">Ocultamiento roto en ' + intentos +
          (intentos === 1 ? ' hash' : ' hashes') + ' (' + ms(performance.now() - t0) + ')</span></p>' +
          '<p>Bob sabe que Alice eligió <strong>' + found + '</strong> antes de que abra el sobre.</p>' +
          '<p class="dim">El espacio de m tiene dos elementos: hashearlos todos es gratis. ' +
          'La resistencia a preimagen no sirve de nada cuando el mensaje es adivinable.</p>';
      } else {
        // Con r de 128 bits, Bob tendría que recorrer 2^128 candidatos.
        for (var k = 0; k < 200000; k++) { intentos++; sha256Hex('aguila|' + k.toString(16)); }
        log.innerHTML = '<p><span class="ok">Ocultamiento intacto</span></p>' +
          '<p>Bob probó ' + fmt(intentos) + ' candidatos en ' + ms(performance.now() - t0) + ' y no acertó ninguno.</p>' +
          '<p class="dim">Con r de 128 bits el espacio de búsqueda es 2¹²⁸ ≈ 3.4 × 10³⁸. ' +
          'A este ritmo tardaría más que la edad del universo.</p>';
      }
    });
  })();

  /* =======================================================
     Lab 8 — Prueba de trabajo y encadenamiento
     ======================================================= */
  (function labChain() {
    var mine = $('powMine');
    if (!mine) return;
    var stop = $('powStop'), diff = $('powDiff'), diffLabel = $('powDiffLabel');
    var wrap = $('powChain'), stats = $('powStats');

    var GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';
    var blocks = [
      { data: 'Alice paga 2 BTC a Bob', nonce: 0, hash: '', prev: GENESIS },
      { data: 'Bob paga 0.5 BTC a Carol', nonce: 0, hash: '', prev: '' },
      { data: 'Carol paga 1 BTC a Dave', nonce: 0, hash: '', prev: '' }
    ];
    var job = null;

    function target() { return new Array(+diff.value + 1).join('0'); }
    function hashOf(b, i) { return sha256Hex(i + '|' + b.prev + '|' + b.data + '|' + b.nonce); }

    /**
     * Reencadena: el prev de cada bloque es el hash del anterior, así que tocar
     * un bloque cambia el contenido de todos los siguientes. Ésa es la cascada.
     */
    function recompute() {
      blocks.forEach(function (b, i) {
        b.prev = i === 0 ? GENESIS : blocks[i - 1].hash;
        b.hash = hashOf(b, i);
      });
    }
    function valid(b) { return b.hash.indexOf(target()) === 0; }

    function render() {
      wrap.innerHTML = '';
      blocks.forEach(function (b, i) {
        var ok = valid(b);
        var card = document.createElement('article');
        card.className = 'miniblock ' + (ok ? 'is-valid' : 'is-invalid');
        card.innerHTML =
          '<header class="miniblock__head"><span>Bloque #' + (i + 1) + '</span>' +
          '<span class="miniblock__state">' + (ok ? 'VÁLIDO' : 'INVÁLIDO') + '</span></header>';

        var inp = document.createElement('input');
        inp.type = 'text';
        inp.value = b.data;
        inp.setAttribute('aria-label', 'Contenido del bloque ' + (i + 1));
        inp.addEventListener('input', function () {
          b.data = inp.value;
          recompute();
          render();
        });
        card.appendChild(inp);

        var dl = document.createElement('dl');
        dl.innerHTML =
          '<dt>prev</dt><dd>' + (b.prev ? b.prev.slice(0, 22) + '…' : '—') + '</dd>' +
          '<dt>nonce</dt><dd>' + fmt(b.nonce) + '</dd>' +
          '<dt>hash</dt><dd class="' + (ok ? 'hit' : '') + '">' + (b.hash ? b.hash.slice(0, 22) + '…' : '—') + '</dd>';
        card.appendChild(dl);
        wrap.appendChild(card);
      });
    }

    diff.addEventListener('input', function () {
      diffLabel.textContent = diff.value + (diff.value === '1' ? ' cero' : ' ceros') + ' hexadecimales';
      recompute();
      render();
    });

    mine.addEventListener('click', function () {
      if (job) job.stop();
      var t0 = performance.now();
      var idx = 0, total = 0;
      var pref = target();
      mine.disabled = true; stop.disabled = false;

      function step() {
        if (idx >= blocks.length) return true;
        var b = blocks[idx];
        b.prev = idx === 0 ? GENESIS : blocks[idx - 1].hash;
        b.nonce++;
        total++;
        b.hash = hashOf(b, idx);
        if (b.hash.indexOf(pref) === 0) {
          idx++;
          if (idx < blocks.length) { blocks[idx].nonce = 0; }
        }
        return idx >= blocks.length;
      }

      job = runChunks(step, 3000,
        function () {
          stats.textContent = fmt(total) + ' hashes · ' + ms(performance.now() - t0);
          render();
        },
        function () {
          mine.disabled = false; stop.disabled = true; job = null;
          render();
        });
    });

    stop.addEventListener('click', function () { if (job) job.stop(); });

    recompute();
    diffLabel.textContent = diff.value + ' ceros hexadecimales';
    render();
  })();

  /* =======================================================
     Barras del deterioro (se animan al entrar en pantalla)
     ======================================================= */
  (function decayBars() {
    var fills = document.querySelectorAll('.decay__fill[data-w]');
    if (!fills.length) return;

    function fill(el) {
      el.style.width = el.dataset.w + '%';
      el.textContent = el.dataset.label;
    }
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(fills, fill);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fill(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(fills, function (el) { io.observe(el); });
  })();

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

})();
