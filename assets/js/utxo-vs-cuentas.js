/* =========================================================
   ChainNotes — Apunte: Modelo UTXO frente a modelo de cuentas
   Laboratorios interactivos. Vanilla JS, sin dependencias.

   Tres laboratorios:
     1. Selección de monedas (BnB, CoinGrinder, voraces, SRD)
        con la métrica de desperdicio de Bitcoin Core.
     2. Cuenta con nonce: repetición, adelanto y orden estricto.
     3. Carriles de ejecución: conflictos de estado en los dos modelos.

   Como en el resto del sitio, todo se calcula en el navegador y
   nada sale a la red: las páginas deben abrir con doble clic.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* =======================================================
     CORE — modelos sin DOM
     ======================================================= */

  /* ---------- Modelo de tarifas simplificado ----------
     Los pesos están en vB (bytes virtuales). Son los de una
     entrada y una salida P2TR redondeados: bastan para que la
     comparación entre algoritmos sea honesta. */
  var IN_VB = 68;    /* cada entrada agranda la transacción */
  var OUT_VB = 31;   /* cada salida */
  var HDR_VB = 11;   /* encabezado fijo */
  var LTR = 10;      /* tasa de largo plazo, sat/vB */
  var DUST = 546;    /* por debajo de esto, el cambio no vale la pena */

  var WALLET0 = [500000, 250000, 120000, 75000, 40000, 30000, 12000, 8000, 5000, 2000];

  /** Valor efectivo: lo que la moneda aporta ya descontado lo que cuesta gastarla. */
  function effective(v, rate) { return v - IN_VB * rate; }

  /** Coste de crear cambio ahora y gastarlo después. Es el umbral del BnB. */
  function costOfChange(rate) { return OUT_VB * rate + IN_VB * LTR; }

  /**
   * Cierra una selección: decide si lleva cambio o no y calcula comisión,
   * cambio y desperdicio. Devuelve null si la selección no alcanza.
   *
   * desperdicio = peso_entradas × (tasa − tasa_largo_plazo) + costo_del_cambio + exceso
   * El primer término es el que manda: con tasas bajas premia consolidar,
   * con tasas altas premia usar el mínimo de entradas.
   */
  function finalize(sel, target, rate, noChange) {
    if (!sel.length) return null;
    var n = sel.length;
    var sum = sel.reduce(function (a, b) { return a + b; }, 0);
    var inputsWeight = n * IN_VB;
    var timingCost = inputsWeight * (rate - LTR);

    /* Primero se intenta con cambio: dos salidas.
       noChange lo salta: el BnB busca precisamente no crearlo. */
    var vbChange = HDR_VB + inputsWeight + 2 * OUT_VB;
    var feeChange = vbChange * rate;
    var change = sum - target - feeChange;

    if (!noChange && change >= DUST) {
      return {
        coins: sel.slice(), inputs: n, sum: sum,
        vbytes: vbChange, fee: feeChange, change: change, excess: 0,
        waste: timingCost + costOfChange(rate), changeless: false
      };
    }

    /* Si el cambio sería polvo, se tira a comisión: una sola salida. */
    var vbPlain = HDR_VB + inputsWeight + OUT_VB;
    var feePlain = vbPlain * rate;
    var excess = sum - target - feePlain;
    if (excess < 0) return null;

    return {
      coins: sel.slice(), inputs: n, sum: sum,
      vbytes: vbPlain, fee: feePlain + excess, change: 0, excess: excess,
      waste: timingCost + excess, changeless: true
    };
  }

  /* ---------- Branch and Bound (Murch, 2016 · Core 0.17) ----------
     Busca un subconjunto cuyo valor efectivo caiga dentro de una ventana
     estrecha sobre el objetivo, de modo que no haga falta crear cambio.
     No siempre existe solución; por eso Core corre también los demás. */
  function bnb(wallet, target, rate) {
    var pool = wallet.map(function (v) { return { v: v, e: effective(v, rate) }; })
      .filter(function (c) { return c.e > 0; })
      .sort(function (a, b) { return b.e - a.e; });

    var lo = target + (HDR_VB + OUT_VB) * rate;   /* la parte de la comisión que no son entradas */
    var hi = lo + costOfChange(rate);

    /* Sumas de cola: cuánto queda disponible a partir de cada posición. */
    var rest = new Array(pool.length + 1);
    rest[pool.length] = 0;
    for (var i = pool.length - 1; i >= 0; i--) rest[i] = rest[i + 1] + pool[i].e;

    var best = null, bestWeight = Infinity, nodes = 0, LIMIT = 120000;

    (function dfs(i, sum, picked) {
      if (nodes++ > LIMIT) return;
      if (sum > hi) return;                       /* se pasó: esta rama muere */
      if (sum >= lo) {
        if (picked.length * IN_VB < bestWeight) { best = picked.slice(); bestWeight = picked.length * IN_VB; }
        return;                                    /* añadir más solo empeora */
      }
      if (i >= pool.length || sum + rest[i] < lo) return;  /* ya no alcanza */
      picked.push(pool[i].v);
      dfs(i + 1, sum + pool[i].e, picked);        /* con la moneda i */
      picked.pop();
      dfs(i + 1, sum, picked);                    /* sin ella */
    })(0, 0, []);

    return { sel: best, nodes: Math.min(nodes, LIMIT) };
  }

  /* ---------- CoinGrinder (Core 27.0, abril de 2024) ----------
     También recorre el conjunto potencia, pero busca el conjunto de
     entradas de peso mínimo y sí produce cambio. Core solo lo activa
     cuando la tasa supera unas tres veces la de largo plazo: si
     minimizaras entradas siempre, triturarías la cartera. */
  function coinGrinder(wallet, target, rate) {
    var pool = wallet.map(function (v) { return { v: v, e: effective(v, rate) }; })
      .filter(function (c) { return c.e > 0; })
      .sort(function (a, b) { return b.e - a.e; });

    /* Hace falta cubrir objetivo + comisión de dos salidas + un cambio no-polvo. */
    var need = target + (HDR_VB + 2 * OUT_VB) * rate + DUST;

    var rest = new Array(pool.length + 1);
    rest[pool.length] = 0;
    for (var i = pool.length - 1; i >= 0; i--) rest[i] = rest[i + 1] + pool[i].e;

    var best = null, bestN = Infinity, bestSum = Infinity, nodes = 0, LIMIT = 120000;

    (function dfs(i, sum, picked) {
      if (nodes++ > LIMIT) return;
      if (picked.length > bestN) return;          /* ya pesa más que el mejor */
      if (sum >= need) {
        var s = picked.reduce(function (a, b) { return a + b; }, 0);
        /* Menos entradas gana; a igualdad de entradas, menos valor inmovilizado. */
        if (picked.length < bestN || (picked.length === bestN && s < bestSum)) {
          best = picked.slice(); bestN = picked.length; bestSum = s;
        }
        return;
      }
      if (i >= pool.length || sum + rest[i] < need) return;
      picked.push(pool[i].v);
      dfs(i + 1, sum + pool[i].e, picked);
      picked.pop();
      dfs(i + 1, sum, picked);
    })(0, 0, []);

    return { sel: best, nodes: Math.min(nodes, LIMIT) };
  }

  /** Acumula monedas en el orden dado hasta cubrir objetivo, comisión y un cambio digno. */
  function accumulate(order, target, rate) {
    var sel = [], sum = 0;
    var base = target + (HDR_VB + 2 * OUT_VB) * rate;
    for (var i = 0; i < order.length; i++) {
      if (effective(order[i], rate) <= 0) continue;   /* no vale lo que cuesta gastarla */
      sel.push(order[i]);
      sum += effective(order[i], rate);
      if (sum >= base + DUST) return sel;
    }
    return sum >= base ? sel : null;                  /* sin cambio digno, pero alcanza */
  }

  function greedyBig(wallet, target, rate) {
    return { sel: accumulate(wallet.slice().sort(function (a, b) { return b - a; }), target, rate), nodes: wallet.length };
  }
  function greedySmall(wallet, target, rate) {
    return { sel: accumulate(wallet.slice().sort(function (a, b) { return a - b; }), target, rate), nodes: wallet.length };
  }
  /** Sorteo aleatorio: peor en comisión, mejor en privacidad (no deja patrón). */
  function srd(wallet, target, rate, rnd) {
    var pool = wallet.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return { sel: accumulate(pool, target, rate), nodes: wallet.length };
  }

  var ALGOS = {
    bnb: { name: 'Branch and Bound', run: bnb },
    grinder: { name: 'CoinGrinder', run: coinGrinder },
    big: { name: 'Mayor primero', run: greedyBig },
    small: { name: 'Menor primero', run: greedySmall },
    srd: { name: 'Sorteo aleatorio', run: srd }
  };

  /** Corre un algoritmo y cierra la selección. Devuelve {res, nodes, msg}. */
  function select(algo, wallet, target, rate, rnd) {
    var a = ALGOS[algo];
    var out = a.run(wallet, target, rate, rnd || Math.random);
    if (!out.sel) return { res: null, nodes: out.nodes, msg: 'sin solución' };
    var res = finalize(out.sel, target, rate, algo === 'bnb');
    if (!res) return { res: null, nodes: out.nodes, msg: 'sin solución' };
    return { res: res, nodes: out.nodes, msg: '' };
  }

  /* ---------- Cuenta con nonce ----------
     Una transferencia firmada sobre saldos es un mensaje válido para
     siempre. El contador es lo único que impide reaplicarla. */
  function Account(balance, nonce) {
    this.balance = balance;
    this.nonce = nonce;
    this.waiting = [];     /* llegaron adelantadas: esperan su turno */
    this.done = {};
  }

  Account.prototype.submit = function (tx) {
    if (this.done[tx.id]) return { state: 'bad', why: 'ya minada' };
    if (tx.nonce < this.nonce) return { state: 'bad', why: 'nonce ' + tx.nonce + ' ya usado · repetición rechazada' };
    if (tx.nonce > this.nonce) {
      for (var i = 0; i < this.waiting.length; i++) if (this.waiting[i].id === tx.id) return { state: 'wait', why: 'ya estaba en espera' };
      this.waiting.push(tx);
      return { state: 'wait', why: 'espera el nonce ' + this.nonce + ' · bloqueada por orden' };
    }
    return this._apply(tx);
  };

  Account.prototype._apply = function (tx) {
    if (tx.amount > this.balance) return { state: 'bad', why: 'saldo insuficiente' };
    this.balance -= tx.amount;
    this.nonce += 1;
    this.done[tx.id] = true;
    var chained = this._drain();
    return { state: 'done', why: 'aplicada · nonce ahora ' + this.nonce, chained: chained };
  };

  /** Tras aplicar una transacción, las que esperaban su turno pueden entrar en cadena. */
  Account.prototype._drain = function () {
    var out = [], moved = true;
    while (moved) {
      moved = false;
      for (var i = 0; i < this.waiting.length; i++) {
        if (this.waiting[i].nonce === this.nonce) {
          var tx = this.waiting.splice(i, 1)[0];
          if (tx.amount > this.balance) { out.push({ tx: tx, ok: false }); break; }
          this.balance -= tx.amount; this.nonce += 1; this.done[tx.id] = true;
          out.push({ tx: tx, ok: true });
          moved = true;
          break;
        }
      }
    }
    return out;
  };

  /* ---------- Carriles de ejecución ----------
     Dos transacciones comparten carril solo si no tocan el mismo estado.
     Coloreo voraz: el número de carriles es una cota superior razonable
     de lo que haría un planificador real. */
  function lanes(txs, keyFn) {
    var out = [];
    txs.forEach(function (tx) {
      var keys = keyFn(tx);
      for (var i = 0; i < out.length; i++) {
        var clash = out[i].keys.some(function (k) { return keys.indexOf(k) !== -1; });
        if (!clash) { out[i].txs.push(tx); out[i].keys = out[i].keys.concat(keys); return; }
      }
      out.push({ txs: [tx], keys: keys.slice() });
    });
    return out;
  }

  var PAYMENTS = [
    { id: 'P1', from: 'Ana', to: 'Zoe', coin: 'ana·m1' },
    { id: 'P2', from: 'Beto', to: 'Zoe', coin: 'beto·m1' },
    { id: 'P3', from: 'Caro', to: 'Zoe', coin: 'caro·m1' },
    { id: 'P4', from: 'Dan', to: 'Eva', coin: 'dan·m1' },
    { id: 'P5', from: 'Eva', to: 'Ana', coin: 'eva·m1' },
    { id: 'P6', from: 'Zoe', to: 'Beto', coin: 'zoe·m1' }
  ];

  /* En UTXO el estado tocado es la moneda concreta que se gasta: el
     destinatario no es estado tocado, recibe una moneda nueva. */
  function keysUtxo(tx) { return [tx.coin]; }
  /* En cuentas se escriben los dos renglones, y ahí aparecen los choques. */
  function keysAccounts(tx) { return [tx.from, tx.to]; }

  /* =======================================================
     FORMATO
     ======================================================= */
  var NBSP = ' ';
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP); }
  function sat(n) { return fmtInt(n) + ' sat'; }
  function money(n) { return n.toFixed(2); }

  /* =======================================================
     LAB 0 — ¿Qué guarda el nodo? (cabecera)
     ======================================================= */
  (function modelo() {
    var seg = $('stSeg');
    if (!seg) return;

    var DATA = {
      objetos: {
        unit: 'Objeto', op: 'Destruir y crear', anti: 'Implícita',
        disk: [
          '<span class="dim">chainstate · conjunto U</span>',
          '(3f9c…a1, 0) → 5 unidades · gastable por <b>alicia</b>',
          '(77b2…e4, 1) → 3 unidades · gastable por <b>alicia</b>',
          '<span class="dim">no existe ningún renglón con el nombre de Alicia</span>'
        ]
      },
      tabla: {
        unit: 'Celda', op: 'Sobrescribir', anti: 'Nonce explícito',
        disk: [
          '<span class="dim">árbol de estado · función S</span>',
          '0xa1c3… → saldo <b>8</b> · nonce 4 · sin código',
          '<span class="dim">no existe ninguna moneda: existe una celda</span>',
          '<span class="dim">pagar 6 no mueve un objeto, reescribe el número</span>'
        ]
      }
    };

    function paint(model) {
      var d = DATA[model];
      $('stUnit').textContent = d.unit;
      $('stOp').textContent = d.op;
      $('stAnti').textContent = d.anti;
      $('stDisk').innerHTML = d.disk.map(function (l) { return '<p>' + l + '</p>'; }).join('');
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.model === model));
      });
    }

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) paint(b.dataset.model);
    });
    paint('objetos');
  })();

  /* =======================================================
     LAB 1 — Selección de monedas
     ======================================================= */
  (function coinSelection() {
    var runBtn = $('csRun');
    if (!runBtn) return;

    var wallet = WALLET0.slice();

    /* Una moneda se pinta en rojo cuando su valor efectivo a la tasa actual
       es negativo: incluirla cuesta más de lo que aporta. El umbral se mueve
       con el mercado de comisiones, no es el valor fijo de polvo. */
    function drawWallet(selected, rate) {
      var sel = (selected || []).slice();
      var r = rate || Math.max(1, +$('csRate').value || 1);
      var html = wallet.slice().sort(function (a, b) { return b - a; }).map(function (v) {
        var k = sel.indexOf(v);
        var on = k !== -1;
        if (on) sel.splice(k, 1);                 /* una ficha por moneda, aunque repitan valor */
        var dead = effective(v, r) <= 0 || v < DUST;
        var cls = 'coin' + (on ? ' is-sel' : '') + (dead ? ' is-dust' : '');
        var tip = dead ? ' title="valor efectivo ' + fmtInt(Math.round(effective(v, r))) + ' sat a ' + r + ' sat/vB"' : '';
        return '<span class="' + cls + '"' + tip + '>' + fmtInt(v) + '</span>';
      }).join('');
      $('csWallet').innerHTML = html;
      var total = wallet.reduce(function (a, b) { return a + b; }, 0);
      $('csCount').textContent = wallet.length + (wallet.length === 1 ? ' moneda' : ' monedas');
      $('csTotal').textContent = sat(total);
    }

    function clearOut() {
      $('csInputs').textContent = '—';
      $('csFee').textContent = '—';
      $('csChange').textContent = '—';
      $('csWaste').textContent = '—';
    }

    function run() {
      var target = Math.max(1, Math.round(+$('csAmount').value || 0));
      var rate = Math.max(1, +$('csRate').value || 1);
      var algo = $('csAlgo').value;
      var out = select(algo, wallet, target, rate);
      var log = $('csLog');

      if (!out.res) {
        clearOut();
        drawWallet([], rate);
        log.innerHTML = '<p class="bad">' + ALGOS[algo].name + ' no encontró solución.</p>' +
          '<p class="dim">' + (algo === 'bnb'
            ? 'Es lo normal: una transacción sin cambio exige que algún subconjunto caiga dentro de una ventana de ' +
              sat(Math.round(costOfChange(rate))) + '. Cuando no existe, Core pasa a los demás algoritmos.'
            : 'La cartera no alcanza a cubrir el monto más la comisión.') + '</p>';
        return;
      }

      var r = out.res;
      $('csInputs').textContent = r.inputs + ' / ' + wallet.length;
      $('csFee').textContent = sat(Math.round(r.fee));
      $('csChange').textContent = r.changeless ? 'sin cambio' : sat(Math.round(r.change));
      $('csWaste').textContent = fmtInt(Math.round(r.waste));
      drawWallet(r.coins, rate);

      var lines = [];
      lines.push('<p><b>' + ALGOS[algo].name + '</b> · ' + r.inputs + ' entradas · ' +
        fmtInt(r.vbytes) + ' vB · exploró ' + fmtInt(out.nodes) + ' nodos</p>');
      lines.push('<p>Entrega ' + r.coins.sort(function (a, b) { return b - a; }).map(fmtInt).join(' + ') +
        ' = ' + sat(r.sum) + '</p>');
      if (r.changeless) {
        lines.push('<p class="ok">Sin cambio: el sobrante de ' + sat(Math.round(r.excess)) +
          ' se va a comisión. Ahorra la salida ahora y la entrada de mañana, y corta el grafo de transacciones.</p>');
      } else {
        lines.push('<p>Cambio de ' + sat(Math.round(r.change)) + ' de vuelta a la cartera: una moneda nueva que algún día habrá que gastar.</p>');
      }
      var timing = r.inputs * IN_VB * (rate - LTR);
      lines.push('<p class="dim">Desperdicio = ' + fmtInt(r.inputs * IN_VB) + ' vB × (' + rate + ' − ' + LTR + ') ' +
        (timing >= 0 ? '= +' : '= ') + fmtInt(Math.round(timing)) + '  ' +
        (r.changeless ? '+ exceso ' + fmtInt(Math.round(r.excess)) : '+ costo del cambio ' + fmtInt(Math.round(costOfChange(rate)))) +
        '  →  <b>' + fmtInt(Math.round(r.waste)) + '</b></p>');
      if (algo === 'grinder' && rate < 3 * LTR) {
        lines.push('<p class="dim">Aviso: a ' + rate + ' sat/vB Bitcoin Core <b>no</b> activaría CoinGrinder. ' +
          'Solo entra por encima de unas tres veces la tasa de largo plazo (~' + 3 * LTR + ' sat/vB). ' +
          'Aquí lo puedes correr igual para ver por qué está restringido: mira el tamaño del cambio que deja.</p>');
      }
      lines.push('<p class="dim">' + (rate < LTR
        ? 'La tasa está por debajo de la de largo plazo: gastar monedas de más sale barato hoy y caro mañana, así que la métrica empuja a consolidar.'
        : rate > LTR
          ? 'La tasa está por encima de la de largo plazo: cada entrada extra se castiga, así que la métrica empuja a usar el mínimo.'
          : 'Con la tasa justo en la de largo plazo el primer término se anula: da igual cuántas entradas uses.') + '</p>');
      log.innerHTML = lines.join('');
    }

    /* ---- Efecto acumulado: lo que ningún pago individual revela ---- */
    function simulate() {
      var rate = Math.max(1, +$('csRate').value || 1);
      var algo = $('csAlgo').value;
      var w = wallet.slice();
      var seed = 20261014;
      var rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

      var paid = 0, fees = 0, failed = 0;
      var lines = ['<p class="dim">Ocho pagos y dos depósitos con <b>' + ALGOS[algo].name + '</b> a ' + rate + ' sat/vB.</p>'];

      for (var k = 1; k <= 8; k++) {
        var amount = Math.round(10000 + rnd() * 90000);
        var out = select(algo, w, amount, rate, rnd);
        if (!out.res) {
          /* Si el algoritmo elegido falla, Core probaría otro: aquí cae al voraz. */
          out = select('big', w, amount, rate, rnd);
          if (!out.res) { failed++; lines.push('<p class="bad">' + k + '. ' + sat(amount) + ' — sin fondos suficientes</p>'); continue; }
        }
        var r = out.res;
        r.coins.forEach(function (c) { w.splice(w.indexOf(c), 1); });
        if (!r.changeless) w.push(Math.round(r.change));
        paid += amount; fees += r.fee;
        lines.push('<p>' + k + '. ' + sat(amount) + ' · ' + r.inputs + ' entradas · comisión ' +
          sat(Math.round(r.fee)) + (r.changeless ? ' · <span class="ok">sin cambio</span>' : '') +
          ' · quedan ' + w.length + '</p>');
        if (k === 3 || k === 6) {
          var dep = Math.round(50000 + rnd() * 100000);
          w.push(dep);
          lines.push('<p class="dim">   + depósito de ' + sat(dep) + ' · quedan ' + w.length + '</p>');
        }
      }

      var total = w.reduce(function (a, b) { return a + b; }, 0);
      var dusty = w.filter(function (v) { return v < 10000; }).length;
      lines.push('<p><b>Final:</b> ' + w.length + ' monedas · ' + sat(total) + ' · ' +
        dusty + ' por debajo de 10 000 sat · comisiones ' + sat(Math.round(fees)) +
        ' (' + (fees / paid * 100).toFixed(1) + ' % de lo pagado)' + (failed ? ' · ' + failed + ' pagos fallidos' : '') + '</p>');
      lines.push('<p class="dim">Cambia de algoritmo y vuelve a correrlo: los pagos son los mismos. Lo que cambia es con qué cartera te quedas.</p>');
      $('csSimLog').innerHTML = lines.join('');
    }

    function reset() {
      wallet = WALLET0.slice();
      drawWallet([]);
      clearOut();
      $('csLog').innerHTML = '<p class="dim">Elige un algoritmo y presiona calcular.</p>';
      $('csSimLog').innerHTML = '<p class="dim">Sin ejecutar.</p>';
    }

    runBtn.addEventListener('click', run);
    $('csReset').addEventListener('click', reset);
    $('csSim').addEventListener('click', simulate);
    reset();
  })();

  /* =======================================================
     LAB 2 — Cuenta con nonce
     ======================================================= */
  (function nonceLab() {
    var host = $('nnTxs');
    if (!host) return;

    var TXS = [
      { id: 'T1', nonce: 4, amount: 2.00, to: 'Beto', note: '' },
      { id: 'T2', nonce: 6, amount: 1.50, to: 'Caro', note: '' },
      { id: 'T3', nonce: 5, amount: 3.00, to: 'Dan', note: '' },
      { id: 'T4', nonce: 4, amount: 2.00, to: 'Beto', note: 'copia de T1' }
    ];

    var acc, lines;

    function draw() {
      host.innerHTML = TXS.map(function (tx) {
        return '<div class="txq__row" id="nnRow' + tx.id + '">' +
          '<span class="txq__desc"><b>' + tx.id + '</b> · nonce ' + tx.nonce +
          ' · paga ' + money(tx.amount) + ' a ' + tx.to +
          (tx.note ? ' <span class="dim">(' + tx.note + ')</span>' : '') + '</span>' +
          '<button class="clay-btn" type="button" data-tx="' + tx.id + '">Enviar</button>' +
          '</div>';
      }).join('');
    }

    function render() {
      $('nnBal').textContent = money(acc.balance);
      $('nnNonce').textContent = String(acc.nonce);
      $('nnQueue').textContent = String(acc.waiting.length);
      $('nnLog').innerHTML = lines.length ? lines.join('') : '<p class="dim">Ninguna transacción procesada todavía.</p>';
    }

    function mark(id, state) {
      var row = $('nnRow' + id);
      if (!row) return;
      row.className = 'txq__row is-' + state;
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tx]');
      if (!b) return;
      var tx = TXS.filter(function (t) { return t.id === b.dataset.tx; })[0];
      var out = acc.submit(tx);
      mark(tx.id, out.state);

      var cls = out.state === 'done' ? 'ok' : out.state === 'bad' ? 'bad' : 'dim';
      lines.push('<p class="' + cls + '">' + tx.id + ' · ' + out.why + '</p>');
      if (out.chained) {
        out.chained.forEach(function (c) {
          mark(c.tx.id, c.ok ? 'done' : 'bad');
          lines.push('<p class="' + (c.ok ? 'ok' : 'bad') + '">   ↳ ' + c.tx.id +
            (c.ok ? ' se desbloqueó y entró detrás · nonce ahora ' + acc.nonce : ' esperaba su turno pero ya no hay saldo') + '</p>');
        });
      }
      render();
    });

    $('nnReset').addEventListener('click', function () {
      acc = new Account(10, 4);
      lines = [];
      draw();
      render();
    });

    acc = new Account(10, 4);
    lines = [];
    draw();
    render();
  })();

  /* =======================================================
     LAB 3 — Carriles de ejecución
     ======================================================= */
  (function parallel() {
    var seg = $('plSeg');
    if (!seg) return;

    var ACCENTS = ['var(--violet)', 'var(--mint)', 'var(--amber)', 'var(--coral)', 'var(--sky)', 'var(--ink)'];

    var NOTES = {
      utxo: 'Un solo carril: los seis pagos gastan monedas distintas, así que se validan a la vez. ' +
        'Que P1, P2 y P3 paguen los tres a Zoe da igual, porque cada uno crea una moneda nueva e independiente.',
      cuentas: 'Cuatro carriles para los mismos seis pagos. Zoe aparece en P1, P2, P3 y P6: los cuatro escriben su renglón, ' +
        'así que hay que serializarlos. El paralelismo no lo decide la carga de trabajo, lo decide la forma del estado.'
    };

    function paint(model) {
      var keyFn = model === 'utxo' ? keysUtxo : keysAccounts;
      var ls = lanes(PAYMENTS, keyFn);

      $('plCores').textContent = ls.length + (ls.length === 1 ? ' carril' : ' carriles');
      $('plLanes').innerHTML = ls.map(function (l, i) {
        return '<div class="lane" style="--accent:' + ACCENTS[i % ACCENTS.length] + '">' +
          '<span class="lane__n">núcleo ' + (i + 1) + '</span>' +
          '<div class="lane__txs">' + l.txs.map(function (tx) {
            return '<span class="txchip">' + tx.id + ' ' + tx.from + '→' + tx.to +
              '<small>' + keyFn(tx).join(' · ') + '</small></span>';
          }).join('') + '</div></div>';
      }).join('');

      $('plNote').textContent = NOTES[model];
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.model === model));
      });
    }

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) paint(b.dataset.model);
    });
    paint('utxo');
  })();

  /* Barras animadas del crecimiento del conjunto UTXO */
  (function fills() {
    var items = document.querySelectorAll('.decay__fill[data-w]');
    if (!items.length) return;
    function show(n) { n.style.width = n.dataset.w + '%'; if (n.dataset.label) n.textContent = n.dataset.label; }
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(items, show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(items, function (n) { io.observe(n); });
  })();

})();
