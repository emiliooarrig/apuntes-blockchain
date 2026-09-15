/* =========================================================
   ChainNotes — Apunte 02: Esquemas de compromiso
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Dos primitivas conviven aquí:
     · SHA-256 a mano (igual que en hash.js, y por el mismo motivo:
       crypto.subtle no existe en file://, y estos apuntes tienen que
       poder abrirse con doble clic desde el disco).
     · Aritmética modular con BigInt para Pedersen. El grupo es real:
       p = 2q+1 con p y q primos, y se trabaja en el subgrupo de
       residuos cuadráticos, que tiene orden primo q.

   Los grupos pequeños NO son seguros, y ése es justamente el punto:
   permiten romper la vinculación en vivo con un logaritmo discreto.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* =======================================================
     1. SHA-256
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
  var scratch = new Uint8Array(320);

  function sha256(data) {
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var len = data.length;
    var total = (((len + 8) >> 6) + 1) << 6;
    var padded;
    if (total <= scratch.length) { padded = scratch.subarray(0, total); padded.fill(0); }
    else { padded = new Uint8Array(total); }
    padded.set(data);
    padded[len] = 0x80;
    var bitLen = len * 8;
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0, p = padded.length;
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
    var out = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (var j = 0; j < 8; j++) {
      out[j * 4] = (hs[j] >>> 24) & 255; out[j * 4 + 1] = (hs[j] >>> 16) & 255;
      out[j * 4 + 2] = (hs[j] >>> 8) & 255; out[j * 4 + 3] = hs[j] & 255;
    }
    return out;
  }

  var encoder = new TextEncoder();
  function utf8(str) {
    var n = str.length, i, c, u = new Uint8Array(n);
    for (i = 0; i < n; i++) {
      c = str.charCodeAt(i);
      if (c > 127) return encoder.encode(str);
      u[i] = c;
    }
    return u;
  }
  var HEX = [];
  for (var hx = 0; hx < 256; hx++) HEX.push((hx < 16 ? '0' : '') + hx.toString(16));
  function toHex(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i++) s += HEX[u8[i]];
    return s;
  }
  function sha256Hex(str) { return toHex(sha256(utf8(str))); }

  /* =======================================================
     2. Aritmética modular (BigInt)
     ======================================================= */

  function modPow(base, exp, mod) {
    var r = 1n;
    base %= mod;
    if (base < 0n) base += mod;
    while (exp > 0n) {
      if (exp & 1n) r = (r * base) % mod;
      base = (base * base) % mod;
      exp >>= 1n;
    }
    return r;
  }

  /** Inverso modular por Euclides extendido. mod debe ser primo aquí. */
  function modInv(a, mod) {
    var t = 0n, newT = 1n, r = mod, newR = ((a % mod) + mod) % mod, q, tmp;
    while (newR !== 0n) {
      q = r / newR;
      tmp = t - q * newT; t = newT; newT = tmp;
      tmp = r - q * newR; r = newR; newR = tmp;
    }
    if (r > 1n) return null;
    return ((t % mod) + mod) % mod;
  }

  function mod(a, m) { return ((a % m) + m) % m; }

  /** Entero aleatorio en [0, n). Usa el CSPRNG del navegador. */
  function randBelow(n) {
    var bits = n.toString(2).length;
    var bytes = Math.ceil(bits / 8);
    var buf = new Uint8Array(bytes);
    var v;
    do {
      crypto.getRandomValues(buf);
      v = 0n;
      for (var i = 0; i < bytes; i++) v = (v << 8n) | BigInt(buf[i]);
      v >>= BigInt(bytes * 8 - bits);
    } while (v >= n);
    return v;
  }

  function bytesToBig(u8) {
    var v = 0n;
    for (var i = 0; i < u8.length; i++) v = (v << 8n) | BigInt(u8[i]);
    return v;
  }

  /* =======================================================
     3. Grupos de Pedersen
     ======================================================= */

  /* p = 2q + 1, con p y q primos. Se trabaja en el subgrupo de residuos
     cuadráticos módulo p, que tiene orden q (primo). g = 4 = 2² es
     generador de ese subgrupo en los tres casos. */
  var GROUPS = {
    juguete: {
      label: 'juguete · q = 1 013 (10 bits)',
      q: 1013n, p: 2027n, g: 4n, bits: 10, breakable: true
    },
    pequeno: {
      label: 'pequeño · q = 100 043 (17 bits)',
      q: 100043n, p: 200087n, g: 4n, bits: 17, breakable: true
    },
    real: {
      label: 'realista · q de 255 bits',
      q: 56843583220066177835985595243232291031664051669221247396768723487275420763651n,
      p: 113687166440132355671971190486464582063328103338442494793537446974550841527303n,
      g: 4n, bits: 255, breakable: false
    }
  };

  /** h = g^x, con x que alguien conoce. Es la versión CON puerta trasera. */
  function hWithTrapdoor(group, x) {
    return { h: modPow(group.g, x, group.p), x: x };
  }

  /** h derivado de un hash: "nothing up my sleeve". Nadie conoce log_g(h). */
  function hNothingUpMySleeve(group) {
    var i = 0, cand;
    for (;;) {
      cand = bytesToBig(sha256(utf8('ChainNotes/pedersen/h/' + i))) % group.p;
      // Elevar al cuadrado mete el valor en el subgrupo de orden q.
      var h = modPow(cand, 2n, group.p);
      if (h !== 1n && h !== 0n) return { h: h, x: null };
      i++;
    }
  }

  /** Compromiso de Pedersen: C(m, r) = g^m · h^r mod p. */
  function pedersen(group, h, m, r) {
    return mod(modPow(group.g, mod(m, group.q), group.p) *
               modPow(h, mod(r, group.q), group.p), group.p);
  }

  /** Paso de bebé, paso de gigante: log_base(target) en un grupo de orden q.
      Coste O(√q) en tiempo y memoria. Devuelve null si no encuentra nada. */
  function bsgs(base, target, group, budget) {
    var q = group.q, p = group.p;
    var mCeil = 1n;
    while (mCeil * mCeil < q) mCeil++;
    var steps = Number(mCeil);
    if (steps > (budget || 400000)) return { log: null, ops: 0, tooBig: true };

    var table = new Map(), cur = 1n, j;
    for (j = 0; j < steps; j++) {
      if (!table.has(cur)) table.set(cur, j);
      cur = (cur * base) % p;
    }
    // factor = base^(-m)
    var factor = modInv(modPow(base, mCeil, p), p);
    var gamma = mod(target, p);
    for (var i = 0; i < steps; i++) {
      if (table.has(gamma)) {
        return { log: mod(BigInt(i) * mCeil + BigInt(table.get(gamma)), q), ops: steps + i, tooBig: false };
      }
      gamma = (gamma * factor) % p;
    }
    return { log: null, ops: steps * 2, tooBig: false };
  }

  /* =======================================================
     4. Utilidades de presentación
     ======================================================= */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /** Números grandes recortados por el centro, para que quepan. */
  function shorten(big, keep) {
    var s = big.toString();
    keep = keep || 14;
    if (s.length <= keep * 2 + 3) return s;
    return s.slice(0, keep) + '…' + s.slice(-keep);
  }

  function grouped(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /** Duración legible a partir de segundos, de milisegundos a eones. */
  function humanTime(seconds) {
    if (seconds < 1e-3) return (seconds * 1e6).toFixed(0) + ' µs';
    if (seconds < 1) return (seconds * 1e3).toFixed(0) + ' ms';
    if (seconds < 60) return seconds.toFixed(1) + ' s';
    if (seconds < 3600) return (seconds / 60).toFixed(1) + ' min';
    if (seconds < 86400) return (seconds / 3600).toFixed(1) + ' h';
    if (seconds < 3.156e7) return (seconds / 86400).toFixed(1) + ' días';
    var years = seconds / 3.156e7;
    if (years < 1e3) return years.toFixed(1) + ' años';
    if (years < 1e6) return (years / 1e3).toFixed(1) + ' mil años';
    if (years < 1e9) return (years / 1e6).toFixed(1) + ' millones de años';
    if (years < 1e12) return (years / 1e9).toFixed(1) + ' mil millones de años';
    return years.toExponential(2) + ' años';
  }

  function logLine(el, html, cls) {
    if (!el) return;
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.innerHTML = html;
    el.appendChild(p);
    el.scrollTop = el.scrollHeight;
  }
  function logClear(el) { if (el) el.innerHTML = ''; }

  /* =======================================================
     LAB 0 · El sobre cerrado (cabecera)
     ======================================================= */
  (function () {
    var sel = $('envMsg'), useR = $('envUseR'), btn = $('envCommit'),
        guess = $('envGuess'), cOut = $('envC'), rOut = $('envR'),
        tries = $('envTries'), verdict = $('envVerdict');
    if (!sel || !btn) return;

    var OPTIONS = ['águila', 'sol'];
    var state = null;

    function commit() {
      var m = sel.value;
      var r = useR.checked ? toHex(crypto.getRandomValues(new Uint8Array(16))) : '';
      var c = sha256Hex(m + '|' + r);
      state = { m: m, r: r, c: c };
      cOut.textContent = c;
      rOut.textContent = r ? r : '— sin valor aleatorio —';
      rOut.className = 'hashout hashout--sm' + (r ? '' : ' is-warn');
      tries.textContent = '—';
      verdict.textContent = '—';
      verdict.className = 'metric__num';
    }

    /* Bob no conoce m, pero conoce el espacio de mensajes: son dos.
       Sin r le bastan dos hashes; con r tendría que recorrer 2^128. */
    function bobGuesses() {
      if (!state) { commit(); }
      var n = 0, found = null;
      for (var i = 0; i < OPTIONS.length; i++) {
        n++;
        if (sha256Hex(OPTIONS[i] + '|' + '') === state.c) { found = OPTIONS[i]; break; }
      }
      tries.textContent = n + ' hash' + (n === 1 ? '' : 'es');
      if (found) {
        verdict.textContent = 'leyó «' + found + '»';
        verdict.className = 'metric__num metric__num--coral';
      } else {
        verdict.textContent = 'no pudo';
        verdict.className = 'metric__num metric__num--mint';
      }
    }

    btn.addEventListener('click', commit);
    guess.addEventListener('click', bobGuesses);
    sel.addEventListener('change', commit);
    useR.addEventListener('change', commit);
    commit();
  })();

  /* =======================================================
     LAB 2.1 · Cuánto cuesta abrir el sobre por la fuerza
     ======================================================= */
  (function () {
    var space = $('atkSpace'), spaceOut = $('atkSpaceOut'),
        lam = $('atkLambda'), lamOut = $('atkLambdaOut'),
        run = $('atkRun'), log = $('atkLog'),
        mHashes = $('atkHashes'), mTime = $('atkTime'), mVerdict = $('atkVerdict');
    if (!run) return;

    var RATE = 0; // hashes por segundo, medido en la primera corrida

    function sync() {
      spaceOut.textContent = grouped(Math.pow(2, +space.value)) + ' mensajes posibles';
      lamOut.textContent = (+lam.value === 0)
        ? 'sin valor aleatorio (λ = 0)'
        : 'λ = ' + lam.value + ' bits';
    }

    function measureRate() {
      var t0 = performance.now(), n = 20000;
      for (var i = 0; i < n; i++) sha256Hex('calibrado' + i);
      var dt = (performance.now() - t0) / 1000;
      return n / Math.max(dt, 1e-6);
    }

    run.addEventListener('click', function () {
      logClear(log);
      if (!RATE) RATE = measureRate();

      var bitsM = +space.value, lambda = +lam.value;
      var sizeM = Math.pow(2, bitsM);
      var work = sizeM * Math.pow(2, lambda);   // hashes en el peor caso
      var secret = Math.floor(Math.random() * sizeM);
      var r = lambda === 0 ? '' : toHex(crypto.getRandomValues(new Uint8Array(Math.ceil(lambda / 8))));
      var c = sha256Hex('mensaje#' + secret + '|' + r);

      logLine(log, 'Alice publica <b>c = ' + c.slice(0, 24) + '…</b>', 'dim');
      logLine(log, 'El adversario conoce el espacio (' + grouped(sizeM) +
                   ' mensajes) pero no el valor aleatorio.', 'dim');

      // Sólo se ejecuta de verdad si cabe en un parpadeo; si no, se extrapola.
      var BUDGET = 3e6;
      if (work <= BUDGET) {
        var t0 = performance.now(), done = 0, found = -1;
        outer:
        for (var m = 0; m < sizeM; m++) {
          if (lambda === 0) {
            done++;
            if (sha256Hex('mensaje#' + m + '|') === c) { found = m; break; }
          } else {
            for (var k = 0; k < Math.pow(2, lambda); k++) {
              done++;
              var cand = k.toString(16);
              while (cand.length < Math.ceil(lambda / 8) * 2) cand = '0' + cand;
              if (sha256Hex('mensaje#' + m + '|' + cand) === c) { found = m; break outer; }
            }
          }
        }
        var dt = (performance.now() - t0) / 1000;
        mHashes.textContent = grouped(done);
        mTime.textContent = humanTime(dt);
        if (found >= 0) {
          mVerdict.textContent = 'abierto';
          mVerdict.className = 'metric__num metric__num--coral';
          logLine(log, '<span class="bad">Compromiso roto.</span> El mensaje era <b>#' +
                       found + '</b>, encontrado con ' + grouped(done) + ' hashes.', '');
        } else {
          mVerdict.textContent = 'resistió';
          mVerdict.className = 'metric__num metric__num--mint';
          logLine(log, '<span class="ok">No lo encontró</span> dentro del presupuesto.', '');
        }
      } else {
        var secs = work / RATE;
        mHashes.textContent = work.toExponential(2);
        mTime.textContent = humanTime(secs);
        mVerdict.textContent = 'inviable';
        mVerdict.className = 'metric__num metric__num--mint';
        logLine(log, 'El ataque exige <b>' + work.toExponential(2) +
                     '</b> hashes. A ' + grouped(Math.round(RATE)) +
                     ' hashes/s en esta máquina, son <b>' + humanTime(secs) + '</b>.', '');
        logLine(log, 'No se ejecuta: se reporta la extrapolación medida.', 'dim');
      }
      logLine(log, 'Trabajo del verificador honesto: <span class="ok">1 hash</span>.', '');
    });

    space.addEventListener('input', sync);
    lam.addEventListener('input', sync);
    sync();
  })();

  /* =======================================================
     LAB 2.2 · Pedersen en vivo + dispersión del compromiso
     ======================================================= */
  (function () {
    var gsel = $('pedGroup'), mIn = $('pedM'), rIn = $('pedR'),
        rnd = $('pedRand'), out = $('pedC'), params = $('pedParams'),
        spread = $('pedSpread'), spreadBtn = $('pedSpreadRun'),
        mSame = $('pedSame');
    if (!gsel) return;

    var G, H;

    function loadGroup() {
      G = GROUPS[gsel.value];
      H = hNothingUpMySleeve(G).h;
      params.innerHTML =
        '<div><dt>p</dt><dd>' + shorten(G.p, 20) + '</dd></div>' +
        '<div><dt>q = (p−1)/2</dt><dd>' + shorten(G.q, 20) + '</dd></div>' +
        '<div><dt>g</dt><dd>' + G.g.toString() + '</dd></div>' +
        '<div><dt>h = SHA-256(…)²</dt><dd>' + shorten(H, 20) + '</dd></div>';
      mIn.max = (G.q - 1n).toString();
      rIn.max = (G.q - 1n).toString();
      if (BigInt(mIn.value || 0) >= G.q) mIn.value = '42';
      newR();
    }

    function newR() {
      rIn.value = randBelow(G.q).toString();
      recompute();
    }

    function recompute() {
      var m, r;
      try { m = BigInt(mIn.value || '0'); r = BigInt(rIn.value || '0'); }
      catch (e) { return; }
      var c = pedersen(G, H, m, r);
      out.textContent = c.toString();
      // ¿Cuántos compromisos distintos produce el mismo m con distintos r?
      mSame.textContent = grouped(G.q.toString());
    }

    /* Dispersión: 240 valores de r al azar para el MISMO m. Si el
       ocultamiento es perfecto, los compromisos caen uniformemente. */
    function drawSpread() {
      var m = BigInt(mIn.value || '0');
      var BUCKETS = 48, counts = new Array(BUCKETS).fill(0), N = 240;
      var scale = G.p / BigInt(BUCKETS);
      for (var i = 0; i < N; i++) {
        var c = pedersen(G, H, m, randBelow(G.q));
        var b = Number(c / scale);
        if (b >= BUCKETS) b = BUCKETS - 1;
        counts[b]++;
      }
      var max = Math.max.apply(null, counts) || 1;
      spread.innerHTML = '';
      counts.forEach(function (v) {
        var i = document.createElement('i');
        i.style.height = Math.max(3, (v / max) * 100) + '%';
        spread.appendChild(i);
      });
    }

    gsel.addEventListener('change', loadGroup);
    mIn.addEventListener('input', recompute);
    rIn.addEventListener('input', recompute);
    rnd.addEventListener('click', newR);
    spreadBtn.addEventListener('click', drawSpread);
    loadGroup();
  })();

  /* =======================================================
     LAB 2.3 · Ocultamiento perfecto y vinculación computacional
     ======================================================= */
  (function () {
    var gsel = $('hidGroup'), run = $('hidRun'), tbody = $('hidTable'),
        mOps = $('hidOps'), mCost = $('hidCost'), log = $('hidLog');
    if (!run) return;

    var CANDIDATES = [0n, 1n, 42n, 100n, 777n, 1000n];

    run.addEventListener('click', function () {
      var G = GROUPS[gsel.value];
      var H = hNothingUpMySleeve(G).h;
      logClear(log);
      tbody.innerHTML = '';

      // Alice se compromete de verdad a un valor que nadie más conoce.
      var mTrue = randBelow(G.q), rTrue = randBelow(G.q);
      var c = pedersen(G, H, mTrue, rTrue);
      logLine(log, 'Alice publica <b>c = ' + shorten(c, 22) + '</b>', 'dim');

      if (!G.breakable) {
        var half = Math.floor(G.bits / 2);
        var sq = Math.pow(2, half);
        mOps.textContent = '2^' + half;
        mCost.textContent = humanTime(sq / 1e9);
        logLine(log, 'El grupo tiene orden de <b>' + G.bits + ' bits</b>. Un paso de bebé, ' +
                     'paso de gigante necesita ≈ 2^' + half +
                     ' operaciones y esa misma cantidad de memoria.', '');
        logLine(log, '<span class="ok">La búsqueda no se ejecuta: es imposible.</span> ' +
                     'Aquí la vinculación se sostiene.', '');
        tbody.innerHTML = '<tr><td colspan="3" class="center muted-p">' +
          'Con 255 bits no hay tabla que quepa en el universo observable.</td></tr>';
        return;
      }

      var totalOps = 0, rows = '';
      CANDIDATES.forEach(function (mFake) {
        if (mFake >= G.q) return;
        // Buscamos r tal que g^mFake · h^r = c, es decir h^r = c · g^(-mFake).
        var target = mod(c * modInv(modPow(G.g, mFake, G.p), G.p), G.p);
        var res = bsgs(H, target, G);
        totalOps += res.ops;
        var ok = res.log !== null && pedersen(G, H, mFake, res.log) === c;
        rows += '<tr><td class="num">' + mFake.toString() + '</td>' +
                '<td class="num">' + (res.log === null ? '—' : shorten(res.log, 16)) + '</td>' +
                '<td>' + (ok
                  ? '<span class="status status--bad">abre c</span>'
                  : '<span class="status status--ok">no abre</span>') + '</td></tr>';
      });
      tbody.innerHTML = rows;
      mOps.textContent = grouped(totalOps);
      mCost.textContent = '≈ √q por valor';

      logLine(log, '<span class="bad">Todos los mensajes de la lista abren el mismo c.</span>', '');
      logLine(log, 'Eso es <b>ocultamiento perfecto</b>: c no contiene información sobre m, ' +
                   'porque cualquier m es compatible con él.', '');
      logLine(log, 'Y también es <b>vinculación rota</b>: aquí sí pude calcular las aperturas, ' +
                   'porque √q son ' + grouped(totalOps) + ' operaciones. Con q de 255 bits ' +
                   'serían 2^127.', '');
      logLine(log, 'El valor real de Alice era m = ' + mTrue.toString() + '.', 'dim');
    });
  })();

  /* =======================================================
     LAB 2.4 · Aritmética sobre sobres cerrados
     ======================================================= */
  (function () {
    var aIn = $('homA'), bIn = $('homB'), run = $('homRun'),
        outA = $('homCa'), outB = $('homCb'), outP = $('homProd'),
        outD = $('homDirect'), verdict = $('homVerdict'), log = $('homLog');
    if (!run) return;

    run.addEventListener('click', function () {
      var G = GROUPS.pequeno, H = hNothingUpMySleeve(G).h;
      logClear(log);
      var a = mod(BigInt(aIn.value || '0'), G.q), b = mod(BigInt(bIn.value || '0'), G.q);
      var ra = randBelow(G.q), rb = randBelow(G.q);

      var Ca = pedersen(G, H, a, ra);
      var Cb = pedersen(G, H, b, rb);
      var prod = mod(Ca * Cb, G.p);
      var direct = pedersen(G, H, a + b, ra + rb);

      outA.textContent = Ca.toString();
      outB.textContent = Cb.toString();
      outP.textContent = prod.toString();
      outD.textContent = direct.toString();

      var ok = prod === direct;
      verdict.textContent = ok ? 'idénticos' : 'distintos';
      verdict.className = 'metric__num ' + (ok ? 'metric__num--mint' : 'metric__num--coral');

      logLine(log, 'C(' + a + ', r₁) · C(' + b + ', r₂) mod p = <b>' + prod.toString() + '</b>', '');
      logLine(log, 'C(' + (a + b) + ', r₁+r₂) = <b>' + direct.toString() + '</b>', '');
      logLine(log, ok
        ? '<span class="ok">Coinciden.</span> Multiplicar los sobres cerrados equivale a sumar lo que hay dentro, y nadie abrió nada.'
        : '<span class="bad">No coinciden.</span>', '');
      logLine(log, 'El verificador acaba de comprobar una suma sin conocer ni a ni b.', 'dim');
    });
  })();

  /* =======================================================
     LAB 2.5 · Transacción confidencial
     ======================================================= */
  (function () {
    var i1 = $('ctIn1'), i2 = $('ctIn2'), o1 = $('ctOut1'), o2 = $('ctOut2'),
        fee = $('ctFee'), run = $('ctRun'), log = $('ctLog'),
        verdict = $('ctVerdict'), mIn = $('ctSumIn'), mOut = $('ctSumOut');
    if (!run) return;

    function preset(a, b, c, d, f) {
      i1.value = a; i2.value = b; o1.value = c; o2.value = d; fee.value = f;
    }
    var pH = $('ctHonest'), pS = $('ctSteal'), pO = $('ctOverflow');
    if (pH) pH.addEventListener('click', function () { preset(40, 60, 70, 29, 1); run.click(); });
    if (pS) pS.addEventListener('click', function () { preset(40, 60, 70, 500, 1); run.click(); });
    // 100 043 = q. Los montos 100 038 y 10 suman q + 5 ≡ 5 (mod q).
    if (pO) pO.addEventListener('click', function () { preset(3, 2, 100038, 10, 0); run.click(); });

    run.addEventListener('click', function () {
      var G = GROUPS.pequeno, H = hNothingUpMySleeve(G).h;
      logClear(log);

      var ins = [BigInt(i1.value || 0), BigInt(i2.value || 0)];
      var outs = [BigInt(o1.value || 0), BigInt(o2.value || 0)];
      var f = BigInt(fee.value || 0);

      // Los factores de cegado se eligen para que se cancelen: es lo que hace
      // el emisor honesto de una transacción confidencial.
      var rIn = ins.map(function () { return randBelow(G.q); });
      var rOut = [randBelow(G.q)];
      var rFee = randBelow(G.q);
      var sumIn = rIn.reduce(function (x, y) { return x + y; }, 0n);
      rOut.push(mod(sumIn - rOut[0] - rFee, G.q));

      var Cin = ins.map(function (v, k) { return pedersen(G, H, v, rIn[k]); });
      var Cout = outs.map(function (v, k) { return pedersen(G, H, v, rOut[k]); });
      var Cfee = pedersen(G, H, f, rFee);

      var lhs = Cin.reduce(function (x, y) { return mod(x * y, G.p); }, 1n);
      var rhs = mod(Cout.reduce(function (x, y) { return mod(x * y, G.p); }, 1n) * Cfee, G.p);

      Cin.forEach(function (c, k) {
        logLine(log, 'entrada ' + (k + 1) + ' → C = ' + shorten(c, 16), 'dim');
      });
      Cout.forEach(function (c, k) {
        logLine(log, 'salida ' + (k + 1) + ' → C = ' + shorten(c, 16), 'dim');
      });

      var balanced = lhs === rhs;
      var realIn = ins[0] + ins[1], realOut = outs[0] + outs[1] + f;
      mIn.textContent = grouped(realIn.toString());
      mOut.textContent = grouped(realOut.toString());

      if (balanced) {
        verdict.textContent = 'transacción válida';
        verdict.className = 'metric__num metric__num--mint';
        logLine(log, '<span class="ok">Π entradas = Π salidas.</span> ' +
                     'El nodo acepta sin haber visto un solo monto.', '');
      } else {
        verdict.textContent = 'rechazada';
        verdict.className = 'metric__num metric__num--coral';
        logLine(log, '<span class="bad">El producto no cuadra.</span> ' +
                     'Entran ' + realIn + ' y salen ' + realOut + '.', '');
      }

      // El desbordamiento: la suma cuadra módulo q aunque no cuadre en los enteros.
      if (balanced && realOut > realIn) {
        logLine(log, '<span class="bad">Y sin embargo se creó dinero de la nada.</span> ' +
                     'La comprobación es módulo q = ' + grouped(G.q.toString()) +
                     ', y ' + realOut + ' ≡ ' + mod(realOut, G.q) + ' (mod q).', '');
        logLine(log, 'Por eso una transacción confidencial real exige además una ' +
                     '<b>prueba de rango</b>: que cada monto viva en [0, 2⁶⁴) y la suma ' +
                     'no dé la vuelta.', '');
      }
    });
  })();

  /* =======================================================
     LAB 2.6 · La puerta trasera del setup
     ======================================================= */
  (function () {
    var run = $('tdRun'), mIn = $('tdM'), mpIn = $('tdMp'),
        outX = $('tdX'), outC = $('tdC'), outR = $('tdR'), outRp = $('tdRp'),
        verdict = $('tdVerdict'), log = $('tdLog'), nums = $('tdNums');
    if (!run) return;

    run.addEventListener('click', function () {
      var G = GROUPS.pequeno;
      logClear(log);

      var honest = nums && nums.checked;
      var setup = honest ? hNothingUpMySleeve(G) : hWithTrapdoor(G, randBelow(G.q));
      var H = setup.h, x = setup.x;

      var m = mod(BigInt(mIn.value || '0'), G.q);
      var mp = mod(BigInt(mpIn.value || '0'), G.q);
      var r = randBelow(G.q);
      var c = pedersen(G, H, m, r);

      outX.textContent = x === null ? 'nadie lo conoce' : x.toString();
      outC.textContent = c.toString();
      outR.textContent = r.toString();

      logLine(log, 'Alice publica c = ' + c.toString() + ' comprometiéndose a m = ' + m + '.', 'dim');

      if (x === null) {
        outRp.textContent = '—';
        verdict.textContent = 'vinculante';
        verdict.className = 'metric__num metric__num--mint';
        logLine(log, 'h se derivó de un hash, así que <b>nadie conoce x = log_g(h)</b>.', '');
        logLine(log, '<span class="ok">Sin x no hay fórmula.</span> Cambiar de opinión exige ' +
                     'resolver un logaritmo discreto.', '');
        return;
      }

      // c = g^m h^r = g^(m + xr). Para que m' abra el mismo c:
      //   m + x·r ≡ m' + x·r'  (mod q)   →   r' = r + (m − m')·x⁻¹
      var xinv = modInv(x, G.q);
      var rp = mod(r + mod(m - mp, G.q) * xinv, G.q);
      var cp = pedersen(G, H, mp, rp);
      outRp.textContent = rp.toString();

      var ok = cp === c;
      verdict.textContent = ok ? 'vinculación rota' : 'falló';
      verdict.className = 'metric__num ' + (ok ? 'metric__num--coral' : 'metric__num--mint');

      logLine(log, 'Quien hizo el setup conoce <b>x = ' + x.toString() + '</b>.', '');
      logLine(log, 'r′ = r + (m − m′)·x⁻¹ mod q = <b>' + rp.toString() + '</b>', '');
      logLine(log, ok
        ? '<span class="bad">C(' + mp + ', r′) = ' + cp.toString() + ' = c.</span> ' +
          'El mismo sobre se abre en ' + m + ' o en ' + mp + ', a voluntad.'
        : 'No coincidió.', '');
      logLine(log, 'Por eso ningún esquema serio deja que una sola persona elija h. ' +
                   'De ahí vienen las ceremonias de setup de múltiples participantes.', 'dim');
    });
  })();

  /* =======================================================
     LAB 2.7 · Subasta a sobre cerrado
     ======================================================= */
  (function () {
    var run = $('aucRun'), cheat = $('aucCheat'), noCommit = $('aucNoCommit'),
        tbody = $('aucTable'), winner = $('aucWinner'), log = $('aucLog');
    if (!run) return;

    var BIDDERS = [
      { name: 'Alice', bid: 120 },
      { name: 'Bob', bid: 185 },
      { name: 'Carol', bid: 150 },
      { name: 'Dave', bid: 170 }
    ];

    run.addEventListener('click', function () {
      logClear(log);
      var sinSobre = noCommit.checked;
      var tramposo = cheat.checked;

      // Dave es el último en revelar: es quien tiene la tentación.
      var bids = BIDDERS.map(function (b) {
        return { name: b.name, bid: b.bid, r: toHex(crypto.getRandomValues(new Uint8Array(16))) };
      });

      if (sinSobre) {
        logLine(log, 'Sin compromiso: las pujas se anuncian en orden, a la vista de todos.', 'dim');
        var best = 0;
        bids.forEach(function (b, i) {
          if (i === bids.length - 1) {
            b.bid = best + 1; // ve todo lo anterior y puja lo mínimo para ganar
            logLine(log, '<span class="bad">' + b.name + ' ve las pujas anteriores y ofrece ' +
                         b.bid + '</span>, un peso más que la mejor.', '');
          } else {
            logLine(log, b.name + ' puja ' + b.bid + '.', 'dim');
            if (b.bid > best) best = b.bid;
          }
        });
        render(bids, null);
        var w = bids.slice().sort(function (a, b) { return b.bid - a.bid; })[0];
        winner.textContent = w.name + ' · ' + w.bid;
        winner.className = 'metric__num metric__num--coral';
        logLine(log, 'Gana quien habló al final, no quien más valoraba el bien. ' +
                     'La subasta dejó de medir lo que quería medir.', '');
        return;
      }

      // Fase 1: todos publican c = H(puja ‖ r).
      bids.forEach(function (b) {
        b.c = sha256Hex(b.bid + '|' + b.r);
        logLine(log, b.name + ' publica c = ' + b.c.slice(0, 20) + '…', 'dim');
      });
      logLine(log, 'Fase 1 cerrada. Nadie sabe nada de nadie.', '');

      // Fase 2: apertura. Dave intenta rebajar su puja al ver que ya ganó.
      bids.forEach(function (b, i) {
        b.revealed = b.bid;
        if (tramposo && i === bids.length - 1) b.revealed = 125;
        b.valid = sha256Hex(b.revealed + '|' + b.r) === b.c;
      });

      var validos = bids.filter(function (b) { return b.valid; });
      render(bids, true);

      bids.forEach(function (b) {
        if (!b.valid) {
          logLine(log, '<span class="bad">' + b.name + ' revela ' + b.revealed +
                       ' y el hash no coincide con su compromiso.</span> Queda descalificado.', '');
        }
      });

      var w2 = validos.slice().sort(function (a, b) { return b.revealed - a.revealed; })[0];
      winner.textContent = w2 ? (w2.name + ' · ' + w2.revealed) : 'nadie';
      winner.className = 'metric__num metric__num--mint';
      logLine(log, '<span class="ok">Gana ' + (w2 ? w2.name : '—') +
                   '.</span> La puja más alta de verdad, no la mejor informada.', '');
    });

    function render(bids, conSobre) {
      tbody.innerHTML = bids.map(function (b) {
        var estado = !conSobre
          ? '<span class="status status--warn">a la vista</span>'
          : (b.valid ? '<span class="status status--ok">válida</span>'
                     : '<span class="status status--bad">descalificada</span>');
        return '<tr><td><strong>' + b.name + '</strong></td>' +
               '<td class="num">' + (conSobre ? b.c.slice(0, 16) + '…' : '—') + '</td>' +
               '<td class="num">' + (conSobre ? b.revealed : b.bid) + '</td>' +
               '<td>' + estado + '</td></tr>';
      }).join('');
    }
  })();

  /* =======================================================
     GRÁFICA · Cuánto pesa comprometerse a n cosas
     ======================================================= */
  (function () {
    var slider = $('szK'), svg = $('szChart'),
        oList = $('szList'), oMerkle = $('szMerkle'), oKzg = $('szKzg'), oN = $('szN');
    if (!svg) return;

    var W = 720, H = 300, PAD = { l: 66, r: 20, t: 28, b: 42 };
    var KMIN = 1, KMAX = 24;

    // Bytes que hay que enviar para probar UN elemento de un conjunto de 2^k.
    function sizes(k) {
      return {
        lista: Math.pow(2, k) * 32,   // mandar el conjunto entero
        merkle: Math.max(1, k) * 32,  // un hermano por nivel
        kzg: 48                       // un punto de curva, siempre
      };
    }

    var LOGMIN = Math.log10(32), LOGMAX = Math.log10(Math.pow(2, KMAX) * 32);
    function x(k) { return PAD.l + (k - KMIN) / (KMAX - KMIN) * (W - PAD.l - PAD.r); }
    function y(bytes) {
      var t = (Math.log10(bytes) - LOGMIN) / (LOGMAX - LOGMIN);
      return H - PAD.b - t * (H - PAD.t - PAD.b);
    }

    function path(fn) {
      var d = '';
      for (var k = KMIN; k <= KMAX; k++) {
        d += (k === KMIN ? 'M' : 'L') + x(k).toFixed(1) + ' ' + y(fn(k)).toFixed(1);
      }
      return d;
    }

    function humanBytes(b) {
      if (b < 1024) return b + ' B';
      if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
      if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
      return (b / 1073741824).toFixed(2) + ' GB';
    }

    function build() {
      var gridY = '', labelsY = '';
      [32, 1024, 32768, 1048576, 33554432, 536870912].forEach(function (b) {
        var yy = y(b).toFixed(1);
        gridY += '<line x1="' + PAD.l + '" y1="' + yy + '" x2="' + (W - PAD.r) +
                 '" y2="' + yy + '" class="szgrid"/>';
        labelsY += '<text x="' + (PAD.l - 8) + '" y="' + (+yy + 4) +
                   '" class="szlab" text-anchor="end">' + humanBytes(b) + '</text>';
      });
      var labelsX = '';
      [1, 4, 8, 12, 16, 20, 24].forEach(function (k) {
        labelsX += '<text x="' + x(k).toFixed(1) + '" y="' + (H - PAD.b + 20) +
                   '" class="szlab" text-anchor="middle">2^' + k + '</text>';
      });

      // El viewBox solo no basta: si la hoja de estilos no llegó (caché vieja,
      // carga fallida), un <svg> sin width/height colapsa a 1em. Con los
      // atributos puestos, la gráfica se ve igual aunque falte el CSS.
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.innerHTML =
        gridY + labelsY + labelsX +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" class="szlab szlab--axis" text-anchor="middle">elementos comprometidos</text>' +
        '<path d="' + path(function (k) { return sizes(k).lista; }) + '" class="szline szline--coral"/>' +
        '<path d="' + path(function (k) { return sizes(k).merkle; }) + '" class="szline szline--amber"/>' +
        '<path d="' + path(function (k) { return sizes(k).kzg; }) + '" class="szline szline--mint"/>' +
        '<line id="szCursor" y1="' + PAD.t + '" y2="' + (H - PAD.b) + '" class="szcursor"/>' +
        '<circle id="szDot1" r="4.5" class="szdot szdot--coral"/>' +
        '<circle id="szDot2" r="4.5" class="szdot szdot--amber"/>' +
        '<circle id="szDot3" r="4.5" class="szdot szdot--mint"/>';
    }

    function update() {
      var k = +slider.value, s = sizes(k);
      var cur = svg.querySelector('#szCursor');
      cur.setAttribute('x1', x(k)); cur.setAttribute('x2', x(k));
      svg.querySelector('#szDot1').setAttribute('cx', x(k));
      svg.querySelector('#szDot1').setAttribute('cy', y(s.lista));
      svg.querySelector('#szDot2').setAttribute('cx', x(k));
      svg.querySelector('#szDot2').setAttribute('cy', y(s.merkle));
      svg.querySelector('#szDot3').setAttribute('cx', x(k));
      svg.querySelector('#szDot3').setAttribute('cy', y(s.kzg));
      oN.textContent = grouped(Math.pow(2, k));
      oList.textContent = humanBytes(s.lista);
      oMerkle.textContent = humanBytes(s.merkle);
      oKzg.textContent = humanBytes(s.kzg);
    }

    build();
    slider.addEventListener('input', update);
    update();
  })();

  /* =======================================================
     Barras comparativas: se llenan al entrar en pantalla
     ======================================================= */
  (function () {
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

  void escapeHtml;
})();
