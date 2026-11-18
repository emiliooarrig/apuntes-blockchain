/* =========================================================
   ChainNotes — Apunte: El problema de los generales bizantinos
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Todo es determinista salvo la fórmula de Nakamoto: los traidores
   siguen estrategias fijas, la peor para cada caso. Los colores de
   los diagramas vienen de clases CSS (.bg*) para respetar el tema.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ==== CORE: modelos (sin DOM) ==== */

  /* ---------- Imposibilidad con tres generales ---------- */
  // roles: l = leal, t = traidor · arcos: [desde, hacia, texto]
  var ESCENARIOS = [
    {
      boton: 'Escenario A', titulo: 'Escenario A · el comandante traiciona',
      roles: { C: 't', L1: 'l', L2: 'l' },
      arcos: [['C', 'L1', 'atacar'], ['C', 'L2', 'retirarse'],
              ['L1', 'L2', 'me dijo atacar'], ['L2', 'L1', 'me dijo retirarse']],
      bandejas: [
        { quien: 'L1', items: ['del comandante: atacar', 'de L2: «me dijo retirarse»'], igual: false },
        { quien: 'L2', items: ['del comandante: retirarse', 'de L1: «me dijo atacar»'], igual: false }
      ],
      texto: '<h3>El comandante miente a cada quien</h3>' +
        '<p>Le ordena <strong>atacar</strong> a L1 y <strong>retirarse</strong> a L2. Los dos tenientes son leales y se cuentan honestamente lo que recibieron.</p>' +
        '<p>IC2 no aplica, porque el comandante no es leal. Pero IC1 sí: L1 y L2 <strong>tienen que decidir lo mismo</strong>. Veamos si pueden.</p>'
    },
    {
      boton: 'Escenario B', titulo: 'Escenario B · traiciona el teniente 2',
      roles: { C: 'l', L1: 'l', L2: 't' },
      arcos: [['C', 'L1', 'atacar'], ['C', 'L2', 'atacar'],
              ['L1', 'L2', 'atacar'], ['L2', 'L1', 'me dijo retirarse']],
      bandejas: [
        { quien: 'L1', items: ['del comandante: atacar', 'de L2: «me dijo retirarse»'], igual: true }
      ],
      texto: '<h3>Ahora el comandante es leal</h3>' +
        '<p>Ordena <strong>atacar</strong> a los dos. El traidor es L2, que le miente a L1 diciéndole que recibió la orden de retirarse.</p>' +
        '<p>Como el comandante es leal, <strong>IC2 obliga a L1 a atacar</strong>. No hay opción.</p>' +
        '<p>Y aquí está el golpe: la bandeja de entrada de L1 es <strong>idéntica</strong> a la del escenario A. Si debe atacar aquí, debe atacar allá.</p>'
    },
    {
      boton: 'Escenario C', titulo: 'Escenario C · traiciona el teniente 1',
      roles: { C: 'l', L1: 't', L2: 'l' },
      arcos: [['C', 'L1', 'retirarse'], ['C', 'L2', 'retirarse'],
              ['L1', 'L2', 'me dijo atacar'], ['L2', 'L1', 'retirarse']],
      bandejas: [
        { quien: 'L2', items: ['del comandante: retirarse', 'de L1: «me dijo atacar»'], igual: true }
      ],
      texto: '<h3>El espejo del anterior</h3>' +
        '<p>El comandante es leal y ordena <strong>retirarse</strong>. El traidor es L1, que le miente a L2.</p>' +
        '<p>Por IC2, <strong>L2 debe retirarse</strong>.</p>' +
        '<p>Y la bandeja de L2 es idéntica a la que tenía en el escenario A. Si debe retirarse aquí, debe retirarse allá.</p>'
    },
    {
      boton: 'Conclusión', titulo: 'Conclusión · no hay algoritmo posible',
      roles: { C: 't', L1: 'l', L2: 'l' },
      arcos: [['C', 'L1', 'atacar'], ['C', 'L2', 'retirarse'],
              ['L1', 'L2', 'me dijo atacar'], ['L2', 'L1', 'me dijo retirarse']],
      bandejas: [
        { quien: 'L1', items: ['del comandante: atacar', 'de L2: «me dijo retirarse»'], igual: true },
        { quien: 'L2', items: ['del comandante: retirarse', 'de L1: «me dijo atacar»'], igual: true }
      ],
      texto: '<h3>Volvemos al escenario A</h3>' +
        '<p>L1 no puede distinguir A de B, así que <strong>ataca</strong>. L2 no puede distinguir A de C, así que <strong>se retira</strong>.</p>' +
        '<p>Los dos son leales y decidieron cosas distintas: <strong>IC1 queda violada</strong>. Y esto no depende del algoritmo: el argumento sólo usó que un participante decide a partir de lo que recibe, y lo que recibe es igual en los dos mundos.</p>' +
        '<p>Con tres generales y un traidor el problema <strong>no tiene solución</strong>. Hacen falta cuatro.</p>'
    }
  ];

  /* ---------- Cota n > 3f: quórums que se traslapan ---------- */
  /**
   * Dos quórums de tamaño n − f sobre un anillo de n nodos: A = [0, q) y
   * B = [f, n). Se intersecan en [f, q), es decir, en n − 2f nodos. Los
   * traidores se colocan en el peor lugar posible: primero en la intersección.
   */
  function quorums(n, f) {
    var q = n - f, inter = [], traidores = [], i;
    for (i = f; i < q; i++) inter.push(i);
    for (i = 0; i < inter.length && traidores.length < f; i++) traidores.push(inter[i]);
    for (i = 0; traidores.length < f; i++) traidores.push(i);
    return {
      q: q, inter: inter, traidores: traidores,
      ok: n >= 3 * f + 1, leales: Math.max(0, n - 3 * f)
    };
  }

  /* ---------- OM(1): un comandante y tres tenientes ---------- */
  var TENIENTES = ['L1', 'L2', 'L3'];
  var OTRO = { A: 'R', R: 'A' };
  var NOM = { A: 'atacar', R: 'retirarse' };

  /**
   * Estrategia del traidor: si es el comandante, a L2 le manda lo contrario
   * que a los demás; si es un teniente, invierte todo lo que reenvía.
   */
  function om1(traidor, orden) {
    var r1 = {}, r2 = {}, dec = {};
    TENIENTES.forEach(function (t, k) {
      r1[t] = (traidor === 'C' && k === 1) ? OTRO[orden] : orden;
    });
    TENIENTES.forEach(function (e) {
      r2[e] = {};
      TENIENTES.forEach(function (r) {
        if (e !== r) r2[e][r] = e === traidor ? OTRO[r1[e]] : r1[e];
      });
    });
    var leales = TENIENTES.filter(function (t) { return t !== traidor; });
    leales.forEach(function (t) {
      var vals = [r1[t]];
      TENIENTES.forEach(function (o) { if (o !== t) vals.push(r2[o][t]); });
      var nA = vals.filter(function (v) { return v === 'A'; }).length;
      dec[t] = { vals: vals, d: nA >= 2 ? 'A' : 'R' };
    });
    return {
      r1: r1, r2: r2, dec: dec, leales: leales,
      acuerdo: leales.every(function (t) { return dec[t].d === dec[leales[0]].d; }),
      // IC2 sólo obliga cuando el comandante es leal
      validez: traidor === 'C' ? null : leales.every(function (t) { return dec[t].d === orden; })
    };
  }

  /* ---------- Probabilidad de revertir z confirmaciones (Nakamoto §11) ---------- */
  function probReversion(q, z) {
    var p = 1 - q;
    if (q >= p) return 1;
    var lam = z * q / p, s = 0, t = Math.exp(-lam);
    for (var k = 0; k <= z; k++) {
      if (k > 0) t *= lam / k;
      s += t * (1 - Math.pow(q / p, z - k));
    }
    return Math.max(0, Math.min(1, 1 - s));
  }
  /** Mínimo de confirmaciones para bajar de un umbral (null si no se alcanza). */
  function minConfirmaciones(q, umbral) {
    for (var z = 0; z <= 3000; z++) if (probReversion(q, z) < umbral) return z;
    return null;
  }

  /* ==== FIN CORE ==== */

  /* =======================================================
     Formato y SVG
     ======================================================= */
  var NBSP = ' ';
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function fmtPct(x) {
    var v = x * 100;
    if (v === 0) return '0 %';
    if (v >= 1) return v.toFixed(2) + ' %';
    if (v >= 0.001) return v.toFixed(4) + ' %';
    return v.toExponential(2).replace('e', '×10^') + ' %';
  }

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
  function setState(node, kind, text) {
    node.className = 'state' + (kind ? ' state--' + kind : '');
    node.textContent = text;
  }

  /* =======================================================
     Lab 0 — La imposibilidad con tres generales
     ======================================================= */
  (function labEscenarios() {
    var seg = $('escSeg');
    if (!seg) return;
    var POS = { C: [150, 42], L1: [52, 164], L2: [248, 164] };
    var R = 27;

    /**
     * Flecha entre dos nodos, recortada al borde de los círculos. La separación
     * va en la perpendicular al trazo, que se invierte sola en el sentido
     * contrario: con el mismo «lado», las dos flechas de un par no se pisan.
     */
    function flecha(svg, a, b, texto, lado, sep) {
      var x1 = POS[a][0], y1 = POS[a][1], x2 = POS[b][0], y2 = POS[b][1];
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / L, uy = dy / L, px = -uy, py = ux;
      var ox = px * lado * sep, oy = py * lado * sep;
      var ax = x1 + ux * (R + 4) + ox, ay = y1 + uy * (R + 4) + oy;
      var bx = x2 - ux * (R + 4) + ox, by = y2 - uy * (R + 4) + oy;
      el('line', { x1: ax.toFixed(1), y1: ay.toFixed(1), x2: bx.toFixed(1), y2: by.toFixed(1),
        'class': 'bgedge', 'marker-end': 'url(#bgPunta)' }, svg);
      // la etiqueta se ancla hacia afuera del trazo para no montarse en él
      var nx = px * lado, mx = (ax + bx) / 2 + nx * 10, my = (ay + by) / 2 + py * lado * 12 + 3;
      txt(svg, mx.toFixed(1), my.toFixed(1), texto, 'bglab', nx < -0.3 ? 'end' : (nx > 0.3 ? 'start' : 'middle'));
    }

    function nodo(svg, id, etq, rol) {
      el('circle', { cx: POS[id][0], cy: POS[id][1], r: R,
        'class': 'bgnode' + (rol === 't' ? ' bgnode--traidor' : '') }, svg);
      txt(svg, POS[id][0], POS[id][1] + 4, etq, 'bgname' + (rol === 't' ? ' bgname--traidor' : ''));
    }

    function pintar(i) {
      var e = ESCENARIOS[i];
      seg.querySelectorAll('button').forEach(function (b, k) {
        b.setAttribute('aria-pressed', String(k === i));
      });
      $('escTitulo').textContent = e.titulo;

      var svg = svgBox($('escSvg'), 300, 232, 'Diagrama del ' + e.titulo);
      var defs = el('defs', {}, svg);
      var m = el('marker', { id: 'bgPunta', viewBox: '0 0 10 10', refX: 9, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'bgarrow' }, m);
      e.arcos.forEach(function (a) {
        // los mensajes entre tenientes comparten recta: se separan 9 px;
        // las órdenes del comandante llevan la etiqueta por fuera del triángulo
        var entre = a[0] !== 'C';
        flecha(svg, a[0], a[1], a[2], entre || a[1] === 'L1' ? 1 : -1, entre ? 9 : 0);
      });
      nodo(svg, 'C', 'Cmdte', e.roles.C);
      nodo(svg, 'L1', 'L1', e.roles.L1);
      nodo(svg, 'L2', 'L2', e.roles.L2);

      var solo = e.bandejas.length === 1;
      $('escTexto').innerHTML = e.texto + '<div class="inboxes">' + e.bandejas.map(function (bj) {
        return '<div class="inbox' + (bj.igual ? ' inbox--match' : '') + '">' +
          '<span class="inbox__title">Bandeja de ' + bj.quien + (solo ? ' · igual que en el escenario A' : '') + '</span>' +
          '<ul>' + bj.items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div>';
    }

    seg.innerHTML = ESCENARIOS.map(function (e, i) {
      return '<button type="button" data-i="' + i + '" aria-pressed="false">' + e.boton + '</button>';
    }).join('');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { pintar(+b.dataset.i); });
    });
    pintar(0);
  })();

  /* =======================================================
     Lab 1 — Explorador de umbrales
     ======================================================= */
  (function labUmbral() {
    var nIn = $('uN'), fIn = $('uF');
    if (!nIn) return;
    var CX = 170, CY = 170, R = 112;

    function ang(i, n) { return -Math.PI / 2 + i * 2 * Math.PI / n; }
    function punto(a, r) { return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
    /** Arco por fuera del anillo que cubre los nodos [desde, hasta]. */
    function arco(svg, desde, hasta, n, r, cls) {
      var d = Math.PI / n * 0.7, a0 = ang(desde, n) - d, a1 = ang(hasta, n) + d;
      var p0 = punto(a0, r), p1 = punto(a1, r), grande = (a1 - a0) > Math.PI ? 1 : 0;
      el('path', { d: 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + grande +
        ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1), 'class': 'bgq ' + cls }, svg);
    }

    function render() {
      var n = +nIn.value, f = +fIn.value, maxF = Math.max(1, Math.floor((n - 1) / 2));
      if (f > maxF) { f = maxF; fIn.value = f; }
      $('uNOut').textContent = 'n = ' + n;
      $('uFOut').textContent = 'f = ' + f + (f === maxF ? ' (máximo para n = ' + n + ')' : '');

      var Q = quorums(n, f), i, j;
      var svg = svgBox($('uSvg'), 340, 340, 'Anillo de ' + n + ' generales con ' + f + ' traidores y dos quórums de tamaño ' + Q.q);
      var pos = [];
      for (i = 0; i < n; i++) pos.push(punto(ang(i, n), R));
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          el('line', { x1: pos[i][0].toFixed(1), y1: pos[i][1].toFixed(1), x2: pos[j][0].toFixed(1), y2: pos[j][1].toFixed(1),
            'class': 'bgedge--mesh' }, svg);
        }
      }
      arco(svg, 0, Q.q - 1, n, R + 26, 'bgq--a');
      arco(svg, f, n - 1, n, R + 36, 'bgq--b');
      for (i = 0; i < n; i++) {
        var tr = Q.traidores.indexOf(i) >= 0, inter = Q.inter.indexOf(i) >= 0;
        el('circle', { cx: pos[i][0].toFixed(1), cy: pos[i][1].toFixed(1), r: 15,
          'class': 'bgnode' + (tr ? ' bgnode--traidor' : '') + (inter ? ' bgnode--inter' : '') }, svg);
        txt(svg, pos[i][0].toFixed(1), (pos[i][1] + 4).toFixed(1), String(i + 1), 'bgname' + (tr ? ' bgname--traidor' : ''));
      }

      $('uCond').textContent = 'n ≥ ' + (3 * f + 1) + (Q.ok ? ' ✓' : ' ✗');
      $('uCond').className = 'metric__num metric__num--' + (Q.ok ? 'mint' : 'coral');
      $('uQuorum').textContent = Q.q;
      $('uInter').textContent = n - 2 * f;
      $('uLeales').textContent = Q.leales ? Q.leales : 'ninguno';
      $('uLeales').className = 'metric__num metric__num--' + (Q.leales ? 'mint' : 'coral');
      if (Q.ok) {
        setState($('uNota'), 'ok', 'Dos quórums cualesquiera comparten ' + (n - 2 * f) + ' participantes y los traidores son sólo ' + f +
          ', así que al menos ' + Q.leales + ' de ellos ' + (Q.leales === 1 ? 'es leal' : 'son leales') +
          '. Un leal dice lo mismo a los dos quórums: no pueden comprometerse a decisiones contradictorias.');
      } else {
        setState($('uNota'), 'bad', 'La intersección de dos quórums puede estar formada únicamente por traidores. Nada les impide contar una historia distinta a cada quórum, y dos grupos de leales se comprometen a decisiones incompatibles. Ningún algoritmo salva esta configuración.');
      }
    }
    nIn.addEventListener('input', render);
    fIn.addEventListener('input', render);
    render();
  })();

  /* =======================================================
     Lab 2 — OM(1) con cuatro generales
     ======================================================= */
  (function labOM() {
    var tSel = $('omTraidor'), oSel = $('omOrden');
    if (!tSel) return;

    function celda(v) { return '<td class="v-' + v.toLowerCase() + '">' + NOM[v] + '</td>'; }
    function marca(id, traidor) { return id + (id === traidor ? ' (traidor)' : ''); }

    function render() {
      var tr = tSel.value, orden = oSel.value, r = om1(tr, orden);

      $('omR1').innerHTML = '<table class="nb" style="min-width:420px"><thead><tr><th scope="col">Emisor</th>' +
        TENIENTES.map(function (t) { return '<th scope="col">a ' + marca(t, tr) + '</th>'; }).join('') +
        '</tr></thead><tbody><tr' + (tr === 'C' ? ' class="is-traitor"' : '') + '><th scope="row">' +
        (tr === 'C' ? 'Comandante (traidor)' : 'Comandante') + '</th>' +
        TENIENTES.map(function (t) { return celda(r.r1[t]); }).join('') + '</tr></tbody></table>';

      var t2 = '<table class="nb" style="min-width:420px"><thead><tr><th scope="col">Emisor \\ recibe</th>' +
        TENIENTES.map(function (t) { return '<th scope="col">' + t + '</th>'; }).join('') + '</tr></thead><tbody>';
      TENIENTES.forEach(function (e) {
        t2 += '<tr' + (e === tr ? ' class="is-traitor"' : '') + '><th scope="row">' + marca(e, tr) + '</th>';
        TENIENTES.forEach(function (d) { t2 += e === d ? '<td>—</td>' : celda(r.r2[e][d]); });
        t2 += '</tr>';
      });
      $('omR2').innerHTML = t2 + '</tbody></table>';

      $('omDec').innerHTML = TENIENTES.map(function (t) {
        if (t === tr) return '<div class="verdict__card verdict__card--traidor">' + t + ' · traidor, su decisión no cuenta</div>';
        var d = r.dec[t];
        return '<div class="verdict__card">' + t + ' · {' + d.vals.map(function (v) { return NOM[v]; }).join(', ') +
          '} → <strong>' + NOM[d.d] + '</strong></div>';
      }).join('');

      if (r.acuerdo && r.validez !== false) {
        setState($('omNota'), 'ok', tr === 'C'
          ? 'IC1 se cumple: los tres tenientes leales llegaron al mismo valor porque los tres terminaron con el mismo multiconjunto de tres reportes. IC2 no aplica, ya que el comandante es traidor. El resultado puede no coincidir con lo que el comandante le mandó a alguno en particular, y eso está permitido.'
          : 'IC1 e IC2 se cumplen: los dos tenientes leales recibieron del comandante el valor correcto y sólo uno de sus tres reportes está corrompido, así que la mayoría lo absorbe. Con cuatro generales y un traidor, OM(1) siempre funciona.');
      } else {
        setState($('omNota'), 'bad', 'Configuración sin acuerdo.');
      }
    }
    tSel.addEventListener('change', render);
    oSel.addEventListener('change', render);
    render();
  })();

  /* =======================================================
     Lab 3 — Votar por identidad frente a votar por trabajo
     ======================================================= */
  (function labSybil() {
    var qIn = $('sQ');
    if (!qIn) return;
    var HONESTOS = 100, INICIAL = 5, ids = INICIAL;

    /** Actualiza en sitio los dos tramos de la barra para que el ancho se anime. */
    function barra(host, wH, wA, lH, lA) {
      if (host.children.length !== 2) host.innerHTML = '<span></span><span></span>';
      [[wH, lH], [wA, lA]].forEach(function (par, k) {
        var s = host.children[k];
        s.style.setProperty('--w', par[0].toFixed(1));
        s.textContent = par[1];
      });
    }

    function identidades() {
      var tot = HONESTOS + ids, pA = 100 * ids / tot;
      barra($('sBarId'), 100 - pA, pA, HONESTOS + ' honestos', String(ids));
      if (ids > HONESTOS) {
        setState($('sNotaId'), 'bad', 'El atacante tiene ' + pA.toFixed(0) + ' % de los votos. Costo: generar ' + fmtInt(ids) +
          ' pares de llaves, unos milisegundos de cómputo. La votación por identidad ya no significa nada.');
      } else {
        setState($('sNotaId'), '', 'El atacante controla ' + pA.toFixed(0) + ' % de los votos con ' + ids +
          ' identidades. Nada le impide crear más, y cada una es gratis.');
      }
    }

    function trabajo() {
      var q = +qIn.value / 100, pA = 100 * q;
      $('sQOut').textContent = 'q = ' + q.toFixed(2);
      barra($('sBarW'), 100 - pA, pA, (100 - pA).toFixed(0) + ' %', pA.toFixed(0) + ' %');
      if (q >= 0.5) {
        setState($('sNotaW'), 'bad', 'Con la mitad o más del cómputo, el atacante impone su cadena. Pero para llegar aquí tuvo que adquirir y operar tanto hardware como toda la red honesta junta: el costo es real y verificable, no una llamada a una función de generación de llaves.');
      } else {
        setState($('sNotaW'), '', 'El atacante tiene ' + pA.toFixed(0) + ' % del cómputo. Para aumentarlo necesita comprar más máquinas y pagar más electricidad. No existe un botón de «crear más cómputo».');
      }
    }

    $('sMas').addEventListener('click', function () { ids += 60; identidades(); });
    $('sReset').addEventListener('click', function () { ids = INICIAL; identidades(); });
    qIn.addEventListener('input', trabajo);
    identidades();
    trabajo();
  })();

  /* =======================================================
     Lab 4 — Probabilidad de revertir z confirmaciones
     ======================================================= */
  (function labReversion() {
    var qIn = $('pQ'), zIn = $('pZ');
    if (!qIn) return;
    function render() {
      var q = +qIn.value / 100, z = +zIn.value, P = probReversion(q, z);
      $('pQOut').textContent = 'q = ' + q.toFixed(2);
      $('pZOut').textContent = z + (z === 1 ? ' confirmación' : ' confirmaciones');
      $('pRes').textContent = fmtPct(P);
      $('pOdds').textContent = P > 0 ? '1 de cada ' + fmtInt(1 / P) : '—';
      var zMin = minConfirmaciones(q, 0.001);
      $('pMin').textContent = zMin === null ? '—' : zMin;
      if (q >= 0.45) {
        setState($('pNota'), 'bad', 'Cerca del 50 % la caída deja de ser exponencial y la protección se evapora. Es el régimen en el que han caído cadenas pequeñas cuyo poder de cómputo se puede alquilar por horas.');
      } else if (P < 1e-4) {
        setState($('pNota'), 'ok', 'La probabilidad decae aproximadamente como (q/p)^z: exponencialmente en el número de confirmaciones. No hay nada mágico en el número seis; es donde la probabilidad se vuelve despreciable frente al valor típico de una transacción cuando q es pequeño.');
      } else {
        setState($('pNota'), '', 'Todavía no es despreciable. Aumenta z y observa la caída; el ritmo depende por completo de qué tan cerca esté q de 0.5.');
      }
    }
    qIn.addEventListener('input', render);
    zIn.addEventListener('input', render);
    render();
  })();

})();
