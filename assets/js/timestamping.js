/* =========================================================
   ChainNotes — Apunte: Time stamping
   Laboratorios interactivos. Vanilla JS, sin dependencias.
   SHA-256 implementado a mano (copiado de hash.js): crypto.subtle
   no existe en file:// y el apunte debe abrirse con doble clic.
   ========================================================= */
(function () {
  'use strict';

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

  /* =======================================================
     2. Laboratorio 1 — La huella de un documento
     ======================================================= */
  (function labHuella() {
    var input = $('hfInput'), out = $('hfOut'), save = $('hfSave');
    var savedEl = $('hfSaved'), matchEl = $('hfMatch');
    if (!input || !out || !save) return;

    var saved = null;

    function short(h) { return h.slice(0, 10) + '…' + h.slice(-6); }

    function render() {
      var h = sha256Hex(input.value);
      out.textContent = h;
      if (saved === null) {
        matchEl.textContent = '—';
        matchEl.className = 'metric__num';
        return;
      }
      var ok = h === saved;
      matchEl.textContent = ok ? 'Sí' : 'No';
      matchEl.className = 'metric__num ' + (ok ? 'metric__num--mint' : 'metric__num--coral');
    }

    save.addEventListener('click', function () {
      saved = sha256Hex(input.value);
      savedEl.textContent = short(saved);
      savedEl.title = saved;
      render();
    });
    input.addEventListener('input', render);
    render();
  })();

  /* =======================================================
     3. Laboratorio 2 — La libreta encadenada
     sello_i = SHA-256( sello_{i-1} | SHA-256(doc_i) | hora_i )
     Cada tarjeta guarda el sello calculado al momento de sellar.
     Al editar un documento se recalcula la cadena y se compara.
     ======================================================= */
  (function labLibreta() {
    var chain = $('tsChain'), docIn = $('tsDoc'), addBtn = $('tsAdd'), resetBtn = $('tsReset');
    var countEl = $('tsCount'), brokenEl = $('tsBroken'), statusEl = $('tsStatus'), msgEl = $('tsMsg');
    if (!chain || !addBtn) return;

    var GENESIS = new Array(65).join('0');
    var INICIAL = [
      { doc: 'Contrato de renta entre Ana y Beto', hora: '2026-03-02 09:14' },
      { doc: 'Tarea final de Blockchain, equipo 3', hora: '2026-05-18 23:57' },
      { doc: 'Foto del pizarrón con la fórmula de la PoW', hora: '2026-06-01 12:30' }
    ];

    var entries = [];   // { doc, hora, sello (guardado), card, input, dd{} }

    function short(h) { return h.slice(0, 12) + '…'; }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function ahora() {
      var d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function sellar(prev, doc, hora) { return sha256Hex(prev + '|' + sha256Hex(doc) + '|' + hora); }

    function makeCard(i) {
      var e = entries[i];
      var card = document.createElement('article');
      card.className = 'miniblock is-valid';
      card.innerHTML =
        '<header class="miniblock__head"><span>Sello #' + (i + 1) + '</span>' +
        '<span class="miniblock__state">INTACTO</span></header>' +
        '<label class="field__label" for="tsIn' + i + '">Documento</label>' +
        '<input type="text" id="tsIn' + i + '" autocomplete="off" spellcheck="false">' +
        '<dl>' +
          '<dt>Hora</dt><dd data-k="hora"></dd>' +
          '<dt>Sello anterior</dt><dd data-k="prev"></dd>' +
          '<dt>Sello guardado</dt><dd data-k="sello"></dd>' +
          '<dt>Sello recalculado</dt><dd data-k="calc"></dd>' +
        '</dl>';
      var input = card.querySelector('input');
      input.value = e.doc;
      input.addEventListener('input', function () { e.doc = input.value; verify(); });
      e.card = card;
      e.dd = {};
      Array.prototype.forEach.call(card.querySelectorAll('dd'), function (dd) { e.dd[dd.getAttribute('data-k')] = dd; });
      chain.appendChild(card);
    }

    function verify() {
      var prev = GENESIS, broken = 0, firstBad = -1;
      entries.forEach(function (e, i) {
        var calc = sellar(prev, e.doc, e.hora);
        var ok = calc === e.sello && firstBad === -1;
        if (!ok) { broken++; if (firstBad === -1) firstBad = i; }
        e.card.className = 'miniblock ' + (ok ? 'is-valid' : 'is-invalid');
        e.card.querySelector('.miniblock__state').textContent = ok ? 'INTACTO' : 'ROTO';
        e.dd.hora.textContent = e.hora;
        e.dd.prev.textContent = i === 0 ? '(inicio de la libreta)' : short(prev);
        e.dd.sello.textContent = short(e.sello);
        e.dd.calc.textContent = short(calc);
        e.dd.calc.className = ok ? 'hit' : '';
        prev = calc;
      });
      countEl.textContent = String(entries.length);
      brokenEl.textContent = String(broken);
      statusEl.textContent = broken ? 'Alterada' : 'Intacta';
      statusEl.className = 'metric__num ' + (broken ? 'metric__num--coral' : 'metric__num--mint');
      msgEl.textContent = broken
        ? 'El sello #' + (firstBad + 1) + ' ya no cuadra con lo guardado, y arrastra a ' +
          (broken - 1 === 1 ? '1 sello posterior' : (broken - 1) + ' sellos posteriores') +
          '. Para ocultar el cambio habría que rehacer todos esos sellos, incluidos los que ya tienen otras personas.'
        : 'Todos los sellos cuadran: la libreta está intacta.';
      if (broken && broken - 1 === 0) {
        msgEl.textContent = 'El sello #' + (firstBad + 1) + ' ya no cuadra con lo guardado. Como es el último, no arrastra a nadie… todavía: el próximo sello se calculará sobre él.';
      }
    }

    function add(doc, hora) {
      // Se sella sobre la cadena tal como está ahora (recalculada).
      var prev = GENESIS;
      entries.forEach(function (e) { prev = sellar(prev, e.doc, e.hora); });
      entries.push({ doc: doc, hora: hora, sello: sellar(prev, doc, hora) });
      makeCard(entries.length - 1);
    }

    function reset() {
      entries = [];
      chain.innerHTML = '';
      INICIAL.forEach(function (x) { add(x.doc, x.hora); });
      verify();
    }

    addBtn.addEventListener('click', function () {
      var doc = docIn.value.trim();
      if (!doc) { docIn.focus(); return; }
      add(doc, ahora());
      verify();
    });
    resetBtn.addEventListener('click', reset);
    reset();
  })();
})();
