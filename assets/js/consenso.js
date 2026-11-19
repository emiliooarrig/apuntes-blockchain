/* =========================================================
   ChainNotes — Apunte: Mecanismos de consenso en blockchain
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Seis laboratorios:
     0. El trilema: qué se sacrifica al elegir.
     1. PoW: dificultad, intentos esperados y seguridad de Nakamoto.
     2. PoS en su mínima expresión: el sorteo por boletos.
     3. PoS de juguete: ocho slots con castigo y expulsión.
     4. DPoS: votación ponderada, turnos e irreversibilidad.
     5. Vista comparativa filtrable.

   Las dos simulaciones de PoS reproducen exactamente las trazas del
   documento del curso: mismos parámetros, mismo generador y mismos
   eventos, de modo que la tabla impresa sirve de verificación.
   Todo se calcula en el navegador y nada sale a la red: las páginas
   deben abrir con doble clic.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* =======================================================
     CORE — modelos sin DOM
     ======================================================= */

  /* ---------- PoW ----------
     Un bloque es válido si SHA256(SHA256(B)) ≤ T. Como el hash se
     comporta como un número uniforme en [0, 2^256), cada intento
     acierta con probabilidad θ = (T+1)/2^256, y la dificultad es
     D = T_max/T. En Bitcoin eso da E[intentos] ≈ D·2^32. */
  var POW_SCALE = 4294967296;            /* 2^32 */

  function powExpectedHashes(D) { return D * POW_SCALE; }

  /** Tiempo esperado entre bloques: 1/(Λθ), con Λ la tasa de la red. */
  function powBlockTime(D, hashrate) {
    if (hashrate <= 0) return Infinity;
    return powExpectedHashes(D) / hashrate;
  }

  /** La proporción de bloques de un minero es su proporción de potencia. */
  function powShare(lambda, total) {
    if (total <= 0) return 0;
    return lambda / total;
  }

  /**
   * Ajuste de dificultad de Bitcoin: cada 2016 bloques, con meta de 600 s.
   * El factor se recorta a [1/4, 4] para que un salto no desestabilice la red.
   */
  function powRetarget(T, realSeconds) {
    var factor = realSeconds / (2016 * 600);
    factor = Math.min(4, Math.max(0.25, factor));
    return { T2: T * factor, factor: factor, clamped: (realSeconds / (2016 * 600)) !== factor };
  }

  /**
   * Cota de Nakamoto, en su forma simplificada: si el atacante controla
   * una fracción q < 1/2 de la potencia, la probabilidad de que alcance
   * a la cadena honesta desde z bloques atrás es (q/p)^z.
   * Por eso se esperan varias confirmaciones.
   */
  function nakamoto(q, z) {
    if (q >= 0.5) return 1;
    if (z <= 0) return 1;
    return Math.pow(q / (1 - q), z);
  }

  /** Confirmaciones necesarias para bajar el riesgo por debajo de un umbral. */
  function confirmsFor(q, target) {
    if (q >= 0.5) return Infinity;
    var z = 1;
    while (nakamoto(q, z) > target && z < 200) z++;
    return z;
  }

  /* ---------- PoS en su mínima expresión ----------
     Tres ideas y nada más: un sorteo donde cada validador tiene tantos
     boletos como monedas en garantía, una votación que exige 2/3 de la
     garantía total, y un pago al proponente si el bloque se acepta. */
  var MIN_NAMES = ['Ana', 'Beto', 'Carla'];
  var MIN_STAKE = [3, 2, 1];                 /* S = 6 boletos */
  var MIN_DRAWS = [4, 0, 5, 2];              /* un número por slot, entre 0 y S−1 */
  var MIN_OFF = { 3: ['Beto'], 4: ['Beto', 'Carla'] };   /* desconectados por slot */

  /** Intervalos de boletos: Ana {0,1,2}, Beto {3,4}, Carla {5}. */
  function ticketRanges(stake) {
    var out = [], acc = 0;
    for (var i = 0; i < stake.length; i++) {
      out.push({ from: acc, to: acc + stake[i] - 1 });
      acc += stake[i];
    }
    return out;
  }

  function runMinimal() {
    var b = MIN_STAKE.slice();
    var S = b.reduce(function (a, c) { return a + c; }, 0);
    var gain = [0, 0, 0];
    var rows = [];

    for (var t = 1; t <= MIN_DRAWS.length; t++) {
      var r = MIN_DRAWS[t - 1];
      /* El acumulador recorre a los validadores en un orden fijo: todos
         los nodos deben usar el mismo, o no habría acuerdo. */
      var acc = 0, p = -1, steps = [];
      for (var i = 0; i < b.length; i++) {
        acc += b[i];
        steps.push({ who: MIN_NAMES[i], limit: acc, hit: r < acc });
        if (r < acc) { p = i; break; }
      }
      var off = MIN_OFF[t] || [];
      var connected = MIN_NAMES.filter(function (n) { return off.indexOf(n) === -1; });
      /* Vota la garantía de los conectados, incluido el proponente. */
      var V = 0;
      for (var j = 0; j < b.length; j++) {
        if (connected.indexOf(MIN_NAMES[j]) !== -1) V += b[j];
      }
      /* 3V ≥ 2S es «al menos dos tercios» escrito sin fracciones. */
      var accepted = 3 * V >= 2 * S;
      if (accepted && p >= 0) gain[p] += 1;

      rows.push({
        t: t, r: r, p: p, who: p >= 0 ? MIN_NAMES[p] : '—',
        steps: steps, connected: connected.slice(), V: V,
        accepted: accepted, gain: gain.slice()
      });
    }
    return { rows: rows, S: S, ranges: ticketRanges(MIN_STAKE), gain: gain };
  }

  /* ---------- PoS de juguete ----------
     La misma idea con tres añadidos: un generador que produce los números
     del sorteo, un pago que aumenta la garantía (y con ella los boletos
     del ganador) y el castigo por doble firma. */
  var TOY_NAMES = ['Ana', 'Beto', 'Carla', 'Dani'];
  var TOY_STAKE = [40, 30, 20, 10];
  var TOY_X0 = 13;
  var TOY_REWARD = 2;
  /* Escenario del documento: doble firma y dos desconexiones. */
  var TOY_EVENTS = {
    2: { type: 'doble', who: 'Carla' },
    3: { type: 'fuera', who: 'Beto' },
    5: { type: 'fuera', who: 'Ana' }
  };

  /** Generador lineal congruencial: no es seguro, pero es reproducible. */
  function lcg(x) { return (21 * x + 7) % 1000; }

  function runToy(slots) {
    slots = slots || 8;
    var b = TOY_STAKE.slice();
    var active = [true, true, true, true];
    var x = TOY_X0;
    var rows = [];

    for (var t = 1; t <= slots; t++) {
      x = lcg(x);
      /* Solo cuentan los activos: un expulsado sale del sorteo. */
      var S = 0, k;
      for (k = 0; k < 4; k++) if (active[k]) S += b[k];
      if (S <= 0) break;
      var r = x % S;

      /* Límites acumulados sobre los activos. */
      var acc = 0, p = -1, limits = [];
      for (k = 0; k < 4; k++) {
        if (!active[k]) { limits.push(null); continue; }
        acc += b[k];
        limits.push(acc);
        if (p < 0 && r < acc) p = k;
      }

      var ev = TOY_EVENTS[t] || null;
      var row = {
        t: t, x: x, S: S, r: r, p: p,
        who: p >= 0 ? TOY_NAMES[p] : '—',
        limits: limits.slice(),
        out: ev && ev.type === 'fuera' ? ev.who : '—',
        V: null, lhs: null, rhs: null, result: '', note: ''
      };

      if (ev && ev.type === 'doble' && p >= 0 && TOY_NAMES[p] === ev.who) {
        /* Doble firma: se parte la garantía y se expulsa al proponente. */
        b[p] = Math.floor(b[p] / 2);
        active[p] = false;
        row.result = 'castigo';
        row.note = ev.who + ' firmó dos bloques: pierde la mitad de su garantía y queda expulsada.';
      } else if (ev && ev.type === 'fuera' && p >= 0 && TOY_NAMES[p] === ev.who) {
        /* El proponente del slot está desconectado: no hay bloque. */
        row.result = 'vacío';
        row.note = ev.who + ' es la proponente pero está desconectada: el slot queda vacío.';
      } else {
        /* Vota la garantía de los activos conectados. */
        var off = ev && ev.type === 'fuera' ? ev.who : null;
        var V = 0;
        for (k = 0; k < 4; k++) {
          if (active[k] && TOY_NAMES[k] !== off) V += b[k];
        }
        row.V = V; row.lhs = 3 * V; row.rhs = 2 * S;
        if (3 * V >= 2 * S) {
          row.result = 'final';
          if (p >= 0) b[p] += TOY_REWARD;
          row.note = 'Los votos alcanzan dos tercios: el bloque es final y ' +
            (p >= 0 ? TOY_NAMES[p] : '—') + ' cobra ' + TOY_REWARD + ' monedas.';
        } else {
          row.result = 'no final';
          row.note = 'Faltan votos para los dos tercios: el bloque no es final y nadie cobra.';
        }
      }

      row.b = b.slice();
      row.active = active.slice();
      rows.push(row);
    }
    return { rows: rows, b: b, active: active };
  }

  /* ---------- DPoS ----------
     Cada poseedor aprueba un conjunto de candidatos; el peso de cada
     candidato es la suma de las participaciones que lo aprueban, y los
     N mayores forman el consejo que se turna en un calendario fijo. */
  function dposElect(holders, candidates, N) {
    var weight = {};
    candidates.forEach(function (c) { weight[c] = 0; });
    holders.forEach(function (h) {
      h.approves.forEach(function (c) {
        if (weight.hasOwnProperty(c)) weight[c] += h.stake;
      });
    });
    var ranked = candidates.map(function (c) { return { name: c, V: weight[c] }; })
      .sort(function (a, b) { return b.V - a.V || a.name.localeCompare(b.name); });
    return { ranked: ranked, elected: ranked.slice(0, N) };
  }

  /** Productor del slot t: el calendario reparte m bloques seguidos a cada delegado. */
  function dposProducer(elected, t, m) {
    if (!elected.length) return null;
    return elected[Math.floor(t / m) % elected.length];
  }

  /** Un bloque es irreversible con ⌊2N/3⌋+1 productores distintos encima. */
  function dposIrreversible(N) { return Math.floor(2 * N / 3) + 1; }

  /** Delegados caídos o maliciosos que la red tolera. */
  function dposTolerance(N) { return Math.floor((N - 1) / 3); }

  /** Recompensa: una parte fija por producir y otra según los votos. */
  function dposReward(R, N, Vk, sumV, alpha) {
    if (sumV <= 0 || N <= 0) return 0;
    return alpha * (R / N) + (1 - alpha) * R * (Vk / sumV);
  }

  /* ---------- Catálogo de mecanismos ---------- */
  var MECHS = [
    { id: 'pow', name: 'PoW', full: 'Proof of Work', red: 'abierta',
      quien: 'Quien resuelve primero el acertijo', tipo: 'Pública, abierta', ej: 'Bitcoin',
      seg: 3, vel: 1, desc: 3, familia: 'base',
      bien: 'Muy segura y muy descentralizada.', mal: 'Consume mucha electricidad y procesa pocas operaciones por segundo.' },
    { id: 'pos', name: 'PoS', full: 'Proof of Stake', red: 'abierta',
      quien: 'Sorteo según monedas en garantía', tipo: 'Pública, abierta', ej: 'Ethereum',
      seg: 3, vel: 2, desc: 2, familia: 'base',
      bien: 'Una fracción de la energía del PoW y más rápida.', mal: 'Quienes más capital tienen ganan más influencia.' },
    { id: 'dpos', name: 'DPoS', full: 'Delegated Proof of Stake', red: 'abierta',
      quien: 'Representantes elegidos por voto', tipo: 'Pública, con pocos validadores', ej: 'EOS, TRON',
      seg: 2, vel: 3, desc: 1, familia: 'base',
      bien: 'Muy rápida y eficiente.', mal: 'Más centralizada: unos pocos representantes concentran el poder.' },
    { id: 'bft', name: 'BFT', full: 'PBFT y variantes', red: 'cerrada',
      quien: 'Votación entre nodos conocidos', tipo: 'Privada o de consorcio', ej: 'Cosmos, redes empresariales',
      seg: 3, vel: 3, desc: 1, familia: 'base',
      bien: 'Rápida y con finalidad inmediata.', mal: 'La comunicación crece tanto que no escala a miles de participantes.' },
    { id: 'poa', name: 'PoA', full: 'Proof of Authority', red: 'cerrada',
      quien: 'Autoridades aprobadas de antemano', tipo: 'Privada, consorcio o pruebas', ej: 'VeChain',
      seg: 2, vel: 3, desc: 1, familia: 'base',
      bien: 'Muy rápida y de costo mínimo.', mal: 'Fuertemente centralizada: se pierde la idea de no depender de nadie.' },
    { id: 'algorand', name: 'Algorand', full: 'Prueba de Participación Pura', red: 'abierta',
      quien: 'Comité elegido por sorteo criptográfico secreto', tipo: 'Pública, abierta', ej: 'Algorand',
      seg: 3, vel: 3, desc: 2, familia: 'moderno',
      ingenio: 'Funciones aleatorias verificables (VRF): cada quien calcula un número pseudoaleatorio con su clave secreta y después puede demostrar a todos que fue legítimo.',
      bien: 'Rápida, eficiente y muy resistente a ataques dirigidos.', mal: 'Diseño más sofisticado; depende de que la mayoría del capital sea honesta.' },
    { id: 'avalanche', name: 'Avalanche', full: 'Consenso por muestreo aleatorio', red: 'abierta',
      quien: 'Muestreo aleatorio repetido entre nodos', tipo: 'Pública, abierta y subredes', ej: 'Avalanche',
      seg: 2, vel: 3, desc: 3, familia: 'moderno',
      ingenio: 'Muestreo repetido y sistemas metaestables, como los cristales que «se decantan» hacia un estado. Con pocos parámetros se acota la probabilidad de desacuerdo.',
      bien: 'Muy escalable y rápida.', mal: 'La seguridad es probabilística: altísima, pero no certeza absoluta.' },
    { id: 'espacio', name: 'Espacio y tiempo', full: 'Prueba de Espacio y Tiempo', red: 'abierta',
      quien: 'Quien aporta más espacio en disco', tipo: 'Pública, abierta', ej: 'Chia',
      seg: 2, vel: 2, desc: 2, familia: 'moderno',
      ingenio: 'Problemas difíciles de calcular en poco espacio, más un retardo secuencial verificable para que el tiempo también cuente.',
      bien: 'Consume mucha menos energía que el PoW.', mal: 'Fomenta la compra y el desgaste de discos duros; las grandes granjas centralizan.' },
    { id: 'poh', name: 'Historia (PoH)', full: 'Proof of History', red: 'abierta',
      quien: 'Líder rotativo con reloj criptográfico compartido', tipo: 'Pública, basada en participación', ej: 'Solana',
      seg: 2, vel: 3, desc: 2, familia: 'moderno',
      ingenio: 'Encadena hashes de forma estrictamente secuencial: calcular toma tiempo, pero verificar se hace en paralelo. El orden queda fijado sin comunicación adicional.',
      bien: 'Permite un rendimiento muy alto.', mal: 'Por sí sola no es consenso completo y exige hardware exigente.' },
    { id: 'hashgraph', name: 'Hashgraph', full: 'Chisme sobre chisme y voto virtual', red: 'cerrada',
      quien: 'Voto virtual deducido del grafo de rumores', tipo: 'Consejo de validadores conocidos', ej: 'Hedera',
      seg: 3, vel: 3, desc: 1, familia: 'moderno',
      ingenio: 'Combina gossip about gossip con voto virtual: el acuerdo se calcula sobre el grafo de mensajes ya compartidos, sin rondas adicionales de votación.',
      bien: 'Rápida, justa en el orden y con gran fundamento teórico.', mal: 'Gobierno más centralizado y tecnología sujeta a patentes.' }
  ];

  /* =======================================================
     FORMATO
     ======================================================= */
  var NBSP = ' ';
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }

  /** Números enormes en notación corta: 7.2 × 10^22. */
  function sci(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1e6) return fmtInt(n);
    var e = Math.floor(Math.log10(n));
    var m = n / Math.pow(10, e);
    return m.toFixed(2) + ' × 10<sup>' + e + '</sup>';
  }

  function pct(x, dec) { return (x * 100).toFixed(dec === undefined ? 1 : dec) + ' %'; }

  function dur(seconds) {
    if (!isFinite(seconds)) return '∞';
    if (seconds < 90) return seconds.toFixed(1) + ' s';
    if (seconds < 5400) return (seconds / 60).toFixed(1) + ' min';
    if (seconds < 172800) return (seconds / 3600).toFixed(1) + ' h';
    return (seconds / 86400).toFixed(1) + ' días';
  }

  /* =======================================================
     LAB 0 — El trilema
     ======================================================= */
  (function trilema() {
    var seg = $('trRed');
    if (!seg) return;

    var red = 'abierta';

    function paint() {
      var pri = $('trPri').value;          /* seg | vel | desc */
      var pool = MECHS.filter(function (m) {
        return red === 'cualquiera' || m.red === red;
      });
      /* Se ordena por la prioridad elegida. En caso de empate gana el
         mecanismo clásico sobre el moderno: es la respuesta canónica y la
         más probada, y los modernos aparecen justo debajo como alternativa. */
      var ranked = pool.slice().sort(function (a, b) {
        if (b[pri] !== a[pri]) return b[pri] - a[pri];
        if (a.familia !== b.familia) return a.familia === 'base' ? -1 : 1;
        return (b.seg + b.vel + b.desc) - (a.seg + a.vel + a.desc);
      });
      var top = ranked[0];

      $('trPick').textContent = top ? top.name : '—';
      $('trEj').textContent = top ? top.ej.split(',')[0] : '—';

      var bars = ['seg', 'vel', 'desc'];
      var etiq = { seg: 'Seguridad', vel: 'Velocidad', desc: 'Descentralización' };
      var col = { seg: 'var(--mint)', vel: 'var(--amber)', desc: 'var(--sky)' };
      $('trBars').innerHTML = bars.map(function (k) {
        var v = top ? top[k] : 0;
        return '<div class="decay__row"><span class="decay__name">' + etiq[k] + '</span>' +
          '<div class="decay__track"><span class="decay__fill" style="width:' + (v / 3 * 100) +
          '%;--accent:' + col[k] + '">' + ['—', 'bajo', 'medio', 'alto'][v] + '</span></div></div>';
      }).join('');

      var l = [];
      if (top) {
        l.push('<p><b>' + top.full + '</b> · ' + top.quien + '.</p>');
        l.push('<p class="ok">Lo bueno: ' + top.bien + '</p>');
        l.push('<p class="bad">Lo malo: ' + top.mal + '</p>');
        var otros = ranked.slice(1, 4).map(function (m) { return m.name; }).join(', ');
        if (otros) l.push('<p class="dim">Le siguen: ' + otros + '.</p>');
        l.push('<p class="dim">Ninguna opción gana en las tres cosas a la vez: elegir un mecanismo es elegir qué se sacrifica.</p>');
      }
      $('trLog').innerHTML = l.join('');

      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.red === red));
      });
    }

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) { red = b.dataset.red; paint(); }
    });
    $('trPri').addEventListener('change', paint);
    paint();
  })();

  /* =======================================================
     LAB 1 — PoW
     ======================================================= */
  (function labPow() {
    var run = $('pwRun');
    if (!run) return;

    function paint() {
      var D = Math.max(1, +$('pwD').value || 1);
      var EH = Math.max(0.001, +$('pwHash').value || 1);     /* exahashes/s */
      var share = Math.min(99, Math.max(0, +$('pwShare').value || 0)) / 100;
      var q = Math.min(49, Math.max(1, +$('pwQ').value || 1)) / 100;
      var z = Math.max(0, Math.round(+$('pwZ').value || 0));

      var hashrate = EH * 1e18;
      var intentos = powExpectedHashes(D);
      var tBlock = powBlockTime(D, hashrate);
      var tMiner = powBlockTime(D, hashrate * share);
      var risk = nakamoto(q, z);

      $('pwTries').innerHTML = sci(intentos);
      $('pwTime').textContent = dur(tBlock);
      $('pwShareOut').textContent = pct(share, 2);
      $('pwRisk').textContent = risk < 1e-4 ? risk.toExponential(2) : pct(risk, 4);

      var l = [];
      l.push('<p>Con dificultad D = ' + fmtInt(D) + ', cada bloque exige en promedio ' +
        '<b>' + sci(intentos) + '</b> intentos (D × 2<sup>32</sup>).</p>');
      l.push('<p>A ' + EH + ' EH/s la red tarda <b>' + dur(tBlock) + '</b> por bloque. ' +
        (Math.abs(tBlock - 600) < 60
          ? 'Está cerca de los 600 s que busca Bitcoin.'
          : tBlock < 600
            ? 'Va más rápido que los 600 s de meta: en el siguiente ajuste la dificultad <b>subirá</b>.'
            : 'Va más lento que los 600 s de meta: en el siguiente ajuste la dificultad <b>bajará</b>.') + '</p>');
      if (share > 0) {
        l.push('<p>Un minero con el ' + pct(share, 2) + ' de la potencia gana esa misma proporción de los bloques: ' +
          'uno cada <b>' + dur(tMiner) + '</b> en promedio. La proporción es exacta; el tiempo, aleatorio.</p>');
      }
      l.push('<p class="dim">El tiempo entre bloques sigue una exponencial, así que la media no es lo típico: ' +
        'hay rachas largas y bloques casi seguidos sin que nada falle.</p>');

      /* Ajuste de dificultad sobre los 2016 bloques */
      var realSec = tBlock * 2016;
      var rt = powRetarget(1 / D, realSec);
      var nuevaD = 1 / rt.T2;
      l.push('<p>Si el ritmo se mantuviera, los 2016 bloques tardarían ' + dur(realSec) +
        ' y el ajuste multiplicaría el objetivo por ' + rt.factor.toFixed(3) +
        ', dejando D ≈ <b>' + fmtInt(nuevaD) + '</b>' + (rt.clamped ? ' <span class="bad">(recortado al límite ×4 o ÷4)</span>' : '') + '.</p>');

      var zz = confirmsFor(q, 0.001);
      l.push('<p class="' + (risk > 0.01 ? 'bad' : 'ok') + '">Un atacante con el ' + pct(q, 0) +
        ' de la potencia alcanza una cadena de ' + z + ' bloques con probabilidad ' +
        (risk < 1e-4 ? risk.toExponential(2) : pct(risk, 4)) + '. ' +
        (isFinite(zz) ? 'Para bajar del 0.1 % harían falta ' + zz + ' confirmaciones.'
                      : 'Con q ≥ 50 % la cota no sirve: el ataque triunfa con certeza.') + '</p>');
      $('pwLog').innerHTML = l.join('');
    }

    run.addEventListener('click', paint);
    ['pwD', 'pwHash', 'pwShare', 'pwQ', 'pwZ'].forEach(function (id) {
      $(id).addEventListener('input', paint);
    });
    paint();
  })();

  /* =======================================================
     LAB 2 — PoS en su mínima expresión
     ======================================================= */
  (function labMinimal() {
    var host = $('pmTable');
    if (!host) return;

    var sim = runMinimal();
    var step = 0;

    function drawTickets() {
      $('pmTickets').innerHTML = sim.ranges.map(function (r, i) {
        var nums = [];
        for (var n = r.from; n <= r.to; n++) nums.push(n);
        return '<div class="lane" style="--accent:' + ['var(--violet)', 'var(--mint)', 'var(--amber)'][i] + '">' +
          '<span class="lane__n">' + MIN_NAMES[i] + ' · ' + MIN_STAKE[i] + '</span>' +
          '<div class="lane__txs">' + nums.map(function (n) {
            return '<span class="txchip">' + n + '</span>';
          }).join('') + '</div></div>';
      }).join('');
    }

    function draw() {
      var rows = sim.rows.slice(0, step);
      host.innerHTML =
        '<table class="nb"><thead><tr>' +
        '<th scope="col">t</th><th scope="col">r</th><th scope="col">Intervalo</th>' +
        '<th scope="col">Proponente</th><th scope="col">Conectados</th>' +
        '<th scope="col">V</th><th scope="col">3V vs 2S</th><th scope="col">Resultado</th>' +
        '<th scope="col">g (A/B/C)</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var rg = r.p >= 0 ? sim.ranges[r.p] : null;
          return '<tr><td class="num">' + r.t + '</td><td class="num">' + r.r + '</td>' +
            '<td>' + (rg ? '{' + (rg.from === rg.to ? rg.from : rg.from + '…' + rg.to) + '}' : '—') + '</td>' +
            '<td><strong>' + r.who + '</strong></td>' +
            '<td>' + r.connected.map(function (c) { return c[0]; }).join(', ') + '</td>' +
            '<td class="num">' + r.V + '</td>' +
            '<td class="num">' + (3 * r.V) + (r.accepted ? ' ≥ ' : ' < ') + (2 * sim.S) + '</td>' +
            '<td><span class="status ' + (r.accepted ? 'status--ok' : 'status--bad') + '">' +
            (r.accepted ? 'aceptado' : 'descartado') + '</span></td>' +
            '<td class="num">' + r.gain.join('/') + '</td></tr>';
        }).join('') + '</tbody></table>';

      var last = rows[rows.length - 1];
      if (!last) {
        $('pmLog').innerHTML = '<p class="dim">Presiona «siguiente slot» para avanzar.</p>';
      } else {
        var l = [];
        l.push('<p><b>Slot ' + last.t + '</b> · sale r = ' + last.r + '. El acumulador recorre a los validadores en orden fijo:</p>');
        l.push('<p class="dim">' + last.steps.map(function (s) {
          return s.who + ' → límite ' + s.limit + (s.hit ? ' · <b>' + last.r + ' &lt; ' + s.limit + ', es suyo</b>' : ' · ' + last.r + ' ≥ ' + s.limit + ', sigue buscando');
        }).join('<br>') + '</p>');
        if (last.connected.length < 3) {
          l.push('<p>Desconectados: ' + MIN_NAMES.filter(function (n) {
            return last.connected.indexOf(n) === -1;
          }).join(', ') + '. Solo vota la garantía de los conectados.</p>');
        }
        l.push('<p class="' + (last.accepted ? 'ok' : 'bad') + '">V = ' + last.V + ' · 3V = ' + (3 * last.V) +
          (last.accepted ? ' ≥ ' : ' &lt; ') + (2 * sim.S) + ' = 2S → ' +
          (last.accepted ? 'el bloque se acepta y ' + last.who + ' cobra 1 moneda.'
                         : 'sin dos tercios no hay acuerdo: el bloque se descarta y nadie cobra.') + '</p>');
        if (last.t === 3) l.push('<p class="dim">Carla, con un solo boleto, también puede ganar. Y como Beto no vota, V = 4 es exactamente dos tercios de 6: eso basta.</p>');
        if (last.t === 4) l.push('<p class="dim">Ana propone, pero solo vota ella. Su garantía es la mitad del total, que no llega a los dos tercios: ni el validador más rico decide solo.</p>');
        $('pmLog').innerHTML = l.join('');
      }
      $('pmStep').textContent = step + ' / ' + sim.rows.length;
      $('pmNext').disabled = step >= sim.rows.length;
    }

    $('pmNext').addEventListener('click', function () {
      if (step < sim.rows.length) { step++; draw(); }
    });
    $('pmAll').addEventListener('click', function () { step = sim.rows.length; draw(); });
    $('pmReset').addEventListener('click', function () { step = 0; draw(); });
    drawTickets();
    draw();
  })();

  /* =======================================================
     LAB 3 — PoS de juguete
     ======================================================= */
  (function labToy() {
    var btn = $('ptRun');
    if (!btn) return;

    function draw() {
      var slots = Math.min(12, Math.max(1, Math.round(+$('ptSlots').value || 8)));
      var sim = runToy(slots);

      $('ptTable').innerHTML =
        '<table class="nb"><thead><tr>' +
        '<th scope="col">t</th><th scope="col">x<sub>t</sub></th><th scope="col">S<sub>t</sub></th>' +
        '<th scope="col">Límites A/B/C/D</th><th scope="col">r<sub>t</sub></th>' +
        '<th scope="col">Proponente</th><th scope="col">Fuera</th><th scope="col">V</th>' +
        '<th scope="col">3V vs 2S</th><th scope="col">Resultado</th><th scope="col">b al final</th>' +
        '</tr></thead><tbody>' +
        sim.rows.map(function (r) {
          var cls = r.result === 'final' ? 'status--ok'
            : r.result === 'castigo' ? 'status--bad'
            : r.result === 'vacío' ? 'status--warn' : 'status--warn';
          return '<tr><td class="num">' + r.t + '</td><td class="num">' + r.x + '</td>' +
            '<td class="num">' + r.S + '</td>' +
            '<td class="num">' + r.limits.map(function (x) { return x === null ? '—' : x; }).join('/') + '</td>' +
            '<td class="num">' + r.r + '</td><td><strong>' + r.who + '</strong></td>' +
            '<td>' + r.out + '</td>' +
            '<td class="num">' + (r.V === null ? '—' : r.V) + '</td>' +
            '<td class="num">' + (r.lhs === null ? '—' : r.lhs + (r.lhs >= r.rhs ? ' ≥ ' : ' < ') + r.rhs) + '</td>' +
            '<td><span class="status ' + cls + '">' + r.result + '</span></td>' +
            '<td class="num">' + r.b.map(function (v, i) {
              return r.active[i] ? v : v + '†';
            }).join('/') + '</td></tr>';
        }).join('') + '</tbody></table>';

      var l = [];
      sim.rows.forEach(function (r) {
        if (r.note) l.push('<p class="' + (r.result === 'final' ? 'ok' : r.result === 'castigo' ? 'bad' : 'dim') +
          '">Slot ' + r.t + ': ' + r.note + '</p>');
      });
      var fin = sim.b.map(function (v, i) { return TOY_NAMES[i] + ' ' + v + (sim.active[i] ? '' : ' (expulsada)'); });
      l.push('<p><b>Al final:</b> ' + fin.join(' · ') + '</p>');
      l.push('<p class="dim">Cada recompensa agranda el intervalo del ganador, así que su probabilidad de proponer sube. ' +
        'Ana pasa de 40 a 46 monedas: es el efecto «el rico se hace más rico» que se le critica al PoS.</p>');
      $('ptLog').innerHTML = l.join('');
    }

    btn.addEventListener('click', draw);
    $('ptSlots').addEventListener('input', draw);
    draw();
  })();

  /* =======================================================
     LAB 4 — DPoS
     ======================================================= */
  (function labDpos() {
    var btn = $('dpRun');
    if (!btn) return;

    var HOLDERS = [
      { name: 'Cooperativa norte', stake: 500, approves: ['Delta', 'Eco', 'Fox'] },
      { name: 'Cooperativa sur', stake: 300, approves: ['Alfa', 'Delta', 'Golf'] },
      { name: 'Socios pequeños', stake: 220, approves: ['Alfa', 'Bravo', 'Eco'] },
      { name: 'Fondo común', stake: 180, approves: ['Bravo', 'Charlie', 'Delta'] },
      { name: 'Tesorería', stake: 120, approves: ['Charlie', 'Fox', 'Golf'] }
    ];
    var CANDS = ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Eco', 'Fox', 'Golf'];

    function draw() {
      var N = Math.min(7, Math.max(3, Math.round(+$('dpN').value || 5)));
      var m = Math.min(12, Math.max(1, Math.round(+$('dpM').value || 3)));
      var caidos = Math.max(0, Math.round(+$('dpDown').value || 0));

      var el = dposElect(HOLDERS, CANDS, N);
      var sumV = el.elected.reduce(function (a, c) { return a + c.V; }, 0);
      var tol = dposTolerance(N);
      var irr = dposIrreversible(N);

      $('dpTol').textContent = tol + ' de ' + N;
      $('dpIrr').textContent = irr + ' bloques';
      $('dpVivo').textContent = caidos <= tol ? 'tolera' : 'se detiene';
      $('dpVivo').className = 'metric__num ' + (caidos <= tol ? 'metric__num--mint' : 'metric__num--coral');

      $('dpRank').innerHTML = '<table class="nb"><thead><tr><th scope="col">Candidato</th>' +
        '<th scope="col">Votos V<sub>k</sub></th><th scope="col">¿Electo?</th>' +
        '<th scope="col">Recompensa</th></tr></thead><tbody>' +
        el.ranked.map(function (c, i) {
          var elected = i < N;
          var R = elected ? dposReward(100, N, c.V, sumV, 0.5) : 0;
          return '<tr><td><strong>' + c.name + '</strong></td><td class="num">' + fmtInt(c.V) + '</td>' +
            '<td><span class="status ' + (elected ? 'status--ok' : 'status--bad') + '">' +
            (elected ? 'sí' : 'no') + '</span></td>' +
            '<td class="num">' + (elected ? R.toFixed(1) : '—') + '</td></tr>';
        }).join('') + '</tbody></table>';

      /* Calendario: cada delegado produce m bloques seguidos. */
      var cal = [];
      for (var t = 0; t < N * m; t++) {
        var d = dposProducer(el.elected, t, m);
        cal.push('<span class="txchip" style="--accent:' +
          ['var(--violet)', 'var(--mint)', 'var(--amber)', 'var(--sky)', 'var(--coral)', 'var(--violet)', 'var(--mint)'][el.elected.indexOf(d) % 7] +
          '">' + t + '<small>' + d.name + '</small></span>');
      }
      $('dpCal').innerHTML = '<div class="lane"><span class="lane__n">ronda</span>' +
        '<div class="lane__txs">' + cal.join('') + '</div></div>';

      var l = [];
      l.push('<p>Con ' + N + ' delegados y ' + m + ' bloques por turno, una ronda completa dura ' +
        (N * m) + ' slots antes de volver a elegir.</p>');
      l.push('<p>Tolerancia f<sub>max</sub> = ⌊(' + N + '−1)/3⌋ = <b>' + tol + '</b>. ' +
        (caidos <= tol
          ? 'Con ' + caidos + ' delegados caídos la red sigue produciendo, aunque esos turnos queden vacíos.'
          : '<span class="bad">Con ' + caidos + ' caídos se pasa del límite: la cadena deja de avanzar con garantías.</span>') + '</p>');
      l.push('<p>Un bloque es irreversible cuando ⌊2·' + N + '/3⌋+1 = <b>' + irr +
        '</b> delegados distintos han construido encima, es decir tras ' + (irr * m) + ' slots en el peor caso.</p>');
      l.push('<p class="dim">El castigo aquí es político, no una confiscación: un delegado que falla seguido pierde votos y sale del consejo en la siguiente elección.</p>');
      $('dpLog').innerHTML = l.join('');
    }

    btn.addEventListener('click', draw);
    ['dpN', 'dpM', 'dpDown'].forEach(function (id) { $(id).addEventListener('input', draw); });
    draw();
  })();

  /* =======================================================
     LAB 5 — Vista comparativa
     ======================================================= */
  (function labTabla() {
    var seg = $('cmSeg');
    if (!seg) return;

    var filtro = 'todos';

    function draw() {
      var rows = MECHS.filter(function (m) {
        return filtro === 'todos' ||
          (filtro === 'base' && m.familia === 'base') ||
          (filtro === 'moderno' && m.familia === 'moderno') ||
          (filtro === 'abierta' && m.red === 'abierta') ||
          (filtro === 'cerrada' && m.red === 'cerrada');
      });

      $('cmTable').innerHTML = '<table class="nb"><thead><tr>' +
        '<th scope="col">Mecanismo</th><th scope="col">Quién decide el siguiente bloque</th>' +
        '<th scope="col">Tipo de red típica</th><th scope="col">Ejemplo</th></tr></thead><tbody>' +
        rows.map(function (m) {
          return '<tr><td><strong>' + m.name + '</strong></td><td>' + m.quien + '</td>' +
            '<td>' + m.tipo + '</td><td>' + m.ej + '</td></tr>';
        }).join('') + '</tbody></table>';

      $('cmCount').textContent = rows.length + (rows.length === 1 ? ' mecanismo' : ' mecanismos');
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.f === filtro));
      });
    }

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) { filtro = b.dataset.f; draw(); }
    });
    draw();
  })();

})();
