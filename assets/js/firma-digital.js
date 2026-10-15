/* =========================================================
   ChainNotes — Apunte: Firma digital y red P2P
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Tres laboratorios sobre la mitad criptográfica del apunte:
     1. ECDSA: firmar, verificar y ver qué pasa al alterar el mensaje.
     2. El nonce repetido: recuperar la clave privada con dos firmas.
     3. Schnorr: sumar firmas, y por qué la suma ingenua es atacable.

   Igual que en compromisos.js, la curva es deliberadamente pequeña
   (p = 10 007) para que los números quepan en pantalla y los ataques
   corran al instante: la inseguridad es intencional. La aritmética va
   con BigInt. SHA-256 está implementado a mano porque crypto.subtle
   no existe bajo file:// y las páginas deben abrir con doble clic.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* =======================================================
     CORE — primitivas sin DOM
     ======================================================= */

  /* ---------- SHA-256 a mano ---------- */
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

  function sha256Hex(str) {
    var msg = [], i, c;
    for (i = 0; i < str.length; i++) {                 /* UTF-8 a mano */
      c = str.charCodeAt(i);
      if (c < 0x80) msg.push(c);
      else if (c < 0x800) msg.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else msg.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    var len = msg.length, total = ((len + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(total);
    buf.set(msg); buf[len] = 0x80;
    var bits = len * 8;
    buf[total - 4] = bits >>> 24; buf[total - 3] = bits >>> 16;
    buf[total - 2] = bits >>> 8; buf[total - 1] = bits;

    var h = new Int32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    var w = new Int32Array(64), off, a, b2, cc, d, e, f, g, hh, t1, t2, x, y;

    for (off = 0; off < total; off += 64) {
      for (i = 0; i < 16; i++) {
        w[i] = (buf[off + i * 4] << 24) | (buf[off + i * 4 + 1] << 16) |
               (buf[off + i * 4 + 2] << 8) | buf[off + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        x = w[i - 15]; y = w[i - 2];
        w[i] = (w[i - 16] + (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) +
          w[i - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) | 0;
      }
      a = h[0]; b2 = h[1]; cc = h[2]; d = h[3]; e = h[4]; f = h[5]; g = h[6]; hh = h[7];
      for (i = 0; i < 64; i++) {
        t1 = (hh + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
          ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
          ((a & b2) ^ (a & cc) ^ (b2 & cc))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b2; b2 = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b2) | 0; h[2] = (h[2] + cc) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + (h[i] >>> 0).toString(16)).slice(-8);
    return out;
  }

  /* ---------- La curva ----------
     y² = x³ + 3x + 6  sobre  F_10007.
     El grupo tiene orden n = 10039, que es primo, así que cualquier
     punto distinto del infinito sirve de generador. Es la versión de
     juguete de secp256k1: misma aritmética, números de cuatro cifras. */
  var P = 10007n;      /* primo del campo */
  var A = 3n, B = 6n;  /* coeficientes */
  var N = 10039n;      /* orden del grupo, primo */
  var G = { x: 5n, y: 4270n };
  var INF = null;      /* el punto al infinito, el neutro */

  function mod(v, m) { var r = v % m; return r < 0n ? r + m : r; }

  /** Inverso modular por exponenciación: m es primo en los dos usos. */
  function inv(v, m) { return power(mod(v, m), m - 2n, m); }

  function power(base, exp, m) {
    var r = 1n; base = mod(base, m);
    while (exp > 0n) {
      if (exp & 1n) r = (r * base) % m;
      base = (base * base) % m; exp >>= 1n;
    }
    return r;
  }

  function eqPt(p1, p2) {
    if (p1 === INF || p2 === INF) return p1 === p2;
    return p1.x === p2.x && p1.y === p2.y;
  }

  function neg(p1) { return p1 === INF ? INF : { x: p1.x, y: mod(-p1.y, P) }; }

  function addPt(p1, p2) {
    if (p1 === INF) return p2;
    if (p2 === INF) return p1;
    if (p1.x === p2.x && mod(p1.y + p2.y, P) === 0n) return INF;   /* inversos */
    var l;
    if (p1.x === p2.x && p1.y === p2.y) {
      l = mod((3n * p1.x * p1.x + A) * inv(2n * p1.y, P), P);       /* tangente */
    } else {
      l = mod((p2.y - p1.y) * inv(p2.x - p1.x, P), P);              /* secante */
    }
    var x = mod(l * l - p1.x - p2.x, P);
    return { x: x, y: mod(l * (p1.x - x) - p1.y, P) };
  }

  /** k·Pt por duplicación y suma. En secp256k1 es lo mismo, con 256 bits. */
  function mulPt(k, pt) {
    var r = INF, acc = pt;
    k = mod(k, N);
    while (k > 0n) {
      if (k & 1n) r = addPt(r, acc);
      acc = addPt(acc, acc); k >>= 1n;
    }
    return r;
  }

  function ptStr(pt) { return pt === INF ? '∞' : '(' + pt.x + ', ' + pt.y + ')'; }

  /** e = SHA-256(mensaje) reducido módulo n. Nadie firma el texto: firma su hash. */
  function hashToScalar(msg) {
    return mod(BigInt('0x' + sha256Hex(msg)), N);
  }

  function pub(d) { return mulPt(d, G); }

  /* ---------- ECDSA ---------- */
  function ecdsaSign(d, msg, k) {
    k = mod(k, N);
    if (k === 0n) return null;
    var R = mulPt(k, G);
    if (R === INF) return null;
    var r = mod(R.x, N);
    var e = hashToScalar(msg);
    var s = mod(inv(k, N) * (e + r * d), N);
    if (r === 0n || s === 0n) return null;
    return { r: r, s: s, e: e, R: R };
  }

  function ecdsaVerify(Q, msg, sig) {
    if (!sig) return false;
    if (!(sig.r > 0n && sig.r < N && sig.s > 0n && sig.s < N)) return false;
    var e = hashToScalar(msg);
    var w = inv(sig.s, N);
    var pt = addPt(mulPt(mod(e * w, N), G), mulPt(mod(sig.r * w, N), Q));
    if (pt === INF) return false;
    return mod(pt.x, N) === sig.r;
  }

  /**
   * Dos firmas hechas con el MISMO k revelan la clave privada.
   *   s1 = k⁻¹(e1 + r·d)   y   s2 = k⁻¹(e2 + r·d)
   * Restando:  s1 − s2 = k⁻¹(e1 − e2)  ⟹  k = (e1 − e2)/(s1 − s2)
   * Y con k:   d = (s1·k − e1)/r
   * No se rompe ninguna curva: es despejar dos ecuaciones lineales.
   */
  function recoverKey(sig1, sig2) {
    if (sig1.r !== sig2.r) return null;          /* mismo k ⟹ misma r */
    var ds = mod(sig1.s - sig2.s, N);
    if (ds === 0n) return null;
    var k = mod(mod(sig1.e - sig2.e, N) * inv(ds, N), N);
    var d = mod(mod(sig1.s * k - sig1.e, N) * inv(sig1.r, N), N);
    return { k: k, d: d };
  }

  /* ---------- Schnorr ----------
     s = k + e·d, lineal en d y en k. Esa linealidad es justo lo que
     ECDSA no tiene, y lo que permite sumar firmas. */
  function challenge(R, Q, msg) {
    return hashToScalar(ptStr(R) + '|' + ptStr(Q) + '|' + msg);
  }

  function schnorrSign(d, msg, k, Ragg, Qagg) {
    var R = mulPt(k, G);
    var e = challenge(Ragg || R, Qagg || pub(d), msg);
    return { R: R, s: mod(k + e * d, N), e: e };
  }

  function schnorrVerify(Q, msg, R, s) {
    var e = challenge(R, Q, msg);
    return eqPt(mulPt(s, G), addPt(R, mulPt(e, Q)));
  }

  /* =======================================================
     LAB 1 — Firmar y verificar con ECDSA
     ======================================================= */
  (function labFirma() {
    var btn = $('sgSign');
    if (!btn) return;

    var state = null;

    function show() {
      if (!state) return;
      var ok = ecdsaVerify(state.Q, state.shown, state.sig);
      $('sgQ').textContent = ptStr(state.Q);
      $('sgR').textContent = String(state.sig.r);
      $('sgS').textContent = String(state.sig.s);
      $('sgE').textContent = String(state.sig.e);
      $('sgVerdict').textContent = ok ? 'VÁLIDA' : 'RECHAZADA';
      $('sgVerdict').className = 'metric__num ' + (ok ? 'metric__num--mint' : 'metric__num--coral');

      var l = [];
      l.push('<p>Clave privada <b>d = ' + state.d + '</b> · clave pública <b>Q = d·G = ' + ptStr(state.Q) + '</b></p>');
      l.push('<p class="dim">Q es público y de él nadie puede volver a d: eso es el problema del logaritmo discreto.</p>');
      l.push('<p>Mensaje firmado: «' + state.signed + '»</p>');
      l.push('<p>e = SHA-256(mensaje) mod n = ' + state.sig.e + ' &nbsp;·&nbsp; k·G = ' + ptStr(state.sig.R) + ' → r = ' + state.sig.r + '</p>');
      l.push('<p>s = k⁻¹(e + r·d) mod n = <b>' + state.sig.s + '</b></p>');
      if (state.shown !== state.signed) {
        l.push('<p>Mensaje que se verifica ahora: «' + state.shown + '»</p>');
        l.push('<p class="bad">Rechazada. Cambió un carácter, así que e cambió por completo, y la ecuación de verificación ya no cierra. La firma no protege el texto: protege su hash.</p>');
      } else {
        l.push('<p class="ok">Válida. El verificador solo usó Q, el mensaje y (r, s). Nunca vio d ni k.</p>');
      }
      $('sgLog').innerHTML = l.join('');
    }

    function sign() {
      var msg = $('sgMsg').value || 'pago 5 a Beto';
      var d = mod(BigInt(Math.max(1, Math.min(10038, parseInt($('sgD').value, 10) || 1234))), N);
      var k = mod(BigInt(Math.max(1, Math.min(10038, parseInt($('sgK').value, 10) || 9871))), N);
      var sig = ecdsaSign(d, msg, k);
      if (!sig) { $('sgLog').innerHTML = '<p class="bad">Esa k degenera (r o s dieron 0). Prueba otra.</p>'; return; }
      state = { d: d, Q: pub(d), sig: sig, signed: msg, shown: msg };
      show();
    }

    function tamper() {
      if (!state) { sign(); }
      /* Un cambio mínimo: el mismo mensaje con un dígito distinto. */
      state.shown = state.signed.replace(/\d+/, function (m) { return String(+m * 100); });
      if (state.shown === state.signed) state.shown = state.signed + ' ';
      show();
    }

    btn.addEventListener('click', sign);
    $('sgTamper').addEventListener('click', tamper);
    sign();
  })();

  /* =======================================================
     LAB 2 — El nonce repetido
     ======================================================= */
  (function labNonce() {
    var btn = $('nkRun');
    if (!btn) return;

    function run() {
      var d = mod(BigInt(Math.max(1, Math.min(10038, parseInt($('nkD').value, 10) || 1234))), N);
      var k = mod(BigInt(Math.max(1, Math.min(10038, parseInt($('nkK').value, 10) || 4242))), N);
      var m1 = $('nkMsg1').value || 'pago 5 a Beto';
      var m2 = $('nkMsg2').value || 'pago 7 a Caro';
      var reuse = $('nkReuse').checked;

      var s1 = ecdsaSign(d, m1, k);
      var s2 = ecdsaSign(d, m2, reuse ? k : mod(k + 1337n, N));
      if (!s1 || !s2) { $('nkLog').innerHTML = '<p class="bad">Parámetros degenerados, prueba otros.</p>'; return; }

      var rec = recoverKey(s1, s2);
      var win = rec && rec.d === d;

      $('nkRecD').textContent = win ? String(rec.d) : '—';
      $('nkVerdict').textContent = win ? 'CLAVE ROBADA' : 'a salvo';
      $('nkVerdict').className = 'metric__num ' + (win ? 'metric__num--coral' : 'metric__num--mint');

      var l = [];
      l.push('<p>Firma 1 sobre «' + m1 + '» → r = ' + s1.r + ', s = ' + s1.s + '</p>');
      l.push('<p>Firma 2 sobre «' + m2 + '» → r = ' + s2.r + ', s = ' + s2.s + '</p>');
      if (!reuse) {
        l.push('<p class="ok">Las dos r son distintas, señal de que el nonce fue distinto. Sin esa coincidencia no hay por dónde empezar: la clave está a salvo.</p>');
        $('nkLog').innerHTML = l.join('');
        return;
      }
      l.push('<p class="bad">Las dos firmas comparten la misma r (' + s1.r + '). Eso delata públicamente que se reusó el nonce, y basta con mirar la cadena para notarlo.</p>');
      l.push('<p>k = (e₁ − e₂)/(s₁ − s₂) mod n = <b>' + rec.k + '</b>' + (rec.k === k ? ' ✓' : '') + '</p>');
      l.push('<p>d = (s₁·k − e₁)/r mod n = <b>' + rec.d + '</b>' + (win ? ' ✓ es la clave privada real' : '') + '</p>');
      l.push('<p class="dim">No se rompió ninguna curva ni se hizo fuerza bruta: son dos ecuaciones lineales con dos incógnitas. Por eso el estándar RFC 6979 genera k de forma determinista a partir del mensaje y la clave, en vez de confiar en el azar del dispositivo.</p>');
      $('nkLog').innerHTML = l.join('');
    }

    btn.addEventListener('click', run);
    $('nkReuse').addEventListener('change', run);
    run();
  })();

  /* =======================================================
     LAB 3 — Schnorr: sumar firmas
     ======================================================= */
  (function labSchnorr() {
    var seg = $('scSeg');
    if (!seg) return;

    var mode = 'honesto';

    function run() {
      var msg = $('scMsg').value || 'pago 5 a Beto';
      var d1 = 1111n, d2 = 2222n, k1 = 515n, k2 = 626n;
      var Q1 = pub(d1), l = [];

      if (mode === 'honesto') {
        var Q2 = pub(d2);
        var Qa = addPt(Q1, Q2);
        var R1 = mulPt(k1, G), R2 = mulPt(k2, G), Ra = addPt(R1, R2);
        var e = challenge(Ra, Qa, msg);
        var s1 = mod(k1 + e * d1, N), s2 = mod(k2 + e * d2, N);
        var sa = mod(s1 + s2, N);
        var ok = schnorrVerify(Qa, msg, Ra, sa);
        var solo = schnorrVerify(Qa, msg, Ra, s1);

        $('scQ').textContent = ptStr(Qa);
        $('scSize').textContent = '1 firma / 2 firmantes';
        $('scVerdict').textContent = ok ? 'VÁLIDA' : 'RECHAZADA';
        $('scVerdict').className = 'metric__num ' + (ok ? 'metric__num--mint' : 'metric__num--coral');

        l.push('<p>Alicia: Q₁ = ' + ptStr(Q1) + ' &nbsp;·&nbsp; Beto: Q₂ = ' + ptStr(Q2) + '</p>');
        l.push('<p>Clave agregada Q = Q₁ + Q₂ = <b>' + ptStr(Qa) + '</b> &nbsp;·&nbsp; R = R₁ + R₂ = ' + ptStr(Ra) + '</p>');
        l.push('<p>s₁ = k₁ + e·d₁ = ' + s1 + ' &nbsp;·&nbsp; s₂ = k₂ + e·d₂ = ' + s2 + '</p>');
        l.push('<p>s = s₁ + s₂ = <b>' + sa + '</b></p>');
        l.push('<p class="' + (ok ? 'ok' : 'bad') + '">' + (ok
          ? 'Verifica contra la clave agregada: s·G = R + e·Q. Para la cadena esto es una firma de un solo firmante — mismo tamaño, mismo costo de verificación.'
          : 'No verifica.') + '</p>');
        l.push('<p class="' + (solo ? 'bad' : 'dim') + '">Una sola de las dos firmas contra la clave agregada: ' + (solo ? 'verifica (mal)' : 'no verifica, como debe ser. Hacen falta los dos.') + '</p>');
        l.push('<p class="dim">Esto con ECDSA no se puede: su s lleva un k⁻¹ que rompe la linealidad, y dos firmas ECDSA no se suman.</p>');
      } else {
        /* Clave deshonesta: el atacante publica Q₂ = d·G − Q₁, de modo que
           la clave agregada queda siendo suya y firma solo por los dos. */
        var dm = 3333n;
        var Q2r = addPt(mulPt(dm, G), neg(Q1));
        var Qr = addPt(Q1, Q2r);                 /* = dm·G */
        var kr = 4040n, Rr = mulPt(kr, G);
        var er = challenge(Rr, Qr, msg);
        var sr = mod(kr + er * dm, N);
        var okr = schnorrVerify(Qr, msg, Rr, sr);

        $('scQ').textContent = ptStr(Qr);
        $('scSize').textContent = '1 firmante, no 2';
        $('scVerdict').textContent = okr ? 'FIRMÓ SOLO' : 'falló';
        $('scVerdict').className = 'metric__num ' + (okr ? 'metric__num--coral' : 'metric__num--mint');

        l.push('<p>Beto ve la clave de Alicia Q₁ = ' + ptStr(Q1) + ' y, en vez de publicar la suya, publica</p>');
        l.push('<p>Q₂ = d·G − Q₁ = <b>' + ptStr(Q2r) + '</b> &nbsp;<span class="dim">(con su d = ' + dm + ')</span></p>');
        l.push('<p>La clave agregada queda Q = Q₁ + Q₂ = ' + ptStr(Qr) + ', que es exactamente d·G: la clave de Beto, sin rastro de Alicia.</p>');
        l.push('<p class="bad">' + (okr
          ? 'Beto firma solo y la firma verifica contra la clave de los dos. Alicia nunca participó y no se entera.'
          : 'El ataque falló.') + '</p>');
        l.push('<p class="dim">Por eso la agregación ingenua de claves no se usa tal cual. MuSig2, que es lo que hay detrás de Taproot, obliga a cada firmante a comprometerse primero con su nonce y pondera cada clave con un coeficiente que depende de todas las demás, de modo que nadie puede elegir la suya en función de las ajenas.</p>');
      }
      $('scLog').innerHTML = l.join('');
    }

    seg.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      mode = b.dataset.mode;
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.mode === mode));
      });
      run();
    });
    $('scMsg').addEventListener('input', run);
    run();
  })();

})();
