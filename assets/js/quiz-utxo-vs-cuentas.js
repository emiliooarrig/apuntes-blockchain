/* =========================================================
   ChainNotes — Apunte: UTXO frente a cuentas
   Preguntas del quiz (las renderiza assets/js/quiz.js).
   ========================================================= */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Distingues objetos de celdas, sabes de dónde sale el nonce y por qué el paralelismo depende de cómo se reparte el estado.',
    repasa: 'Te conviene repasar desde la sección 02 (las dos definiciones): validez local frente a nonce, y de ahí salen la selección de monedas, el paralelismo y el costo del estado.',
    preguntas: [
      {
        q: 'Una cartera tiene monedas de 1, 3, 7, 12 y 20 mil sat y quiere pagar 15 mil a 20 sat/vB (tasa de largo plazo: 10 sat/vB). Con la métrica de desperdicio, ¿qué selección elegiría Bitcoin Core?',
        o: [
          'Sólo la de 20 000, porque usa una entrada y paga menos comisión hoy.',
          '3 000 + 12 000, porque suma exactamente el monto a pagar.',
          '7 000 + 12 000, sin cambio, con desperdicio de 1 800.',
          '1 000 + 7 000 + 12 000, porque reduce el número de monedas pequeñas.'
        ],
        a: 2,
        e: '3 000 + 12 000 suma justo 15 000 y no deja nada para la comisión, así que no alcanza. La de 20 000 paga menos comisión hoy (2 820 contra 4 000) pero arrastra un cambio que costará 1 300 sat después: desperdicio 1 980. {7 000, 12 000} evita el cambio y gana con 1 800 (1 360 del término temporal más 440 de exceso). Pruébalo en el laboratorio 1.',
        s: ['seleccion', '04']
      },
      {
        q: 'Con el modelo de tarifas del apunte (entrada 68 vB, salida 31 vB, tasa 20 sat/vB hoy y 10 sat/vB de largo plazo), ¿cuánto cuesta el cambio: crear la salida ahora y gastarla después?',
        o: [
          '620 sat, el costo de crear la salida de cambio.',
          '1 300 sat: 31 × 20 para crearla más 68 × 10 para gastarla después.',
          '1 980 sat: 31 × 20 para crearla más 68 × 20 para gastarla.',
          '680 sat, el costo de gastarla a la tasa de largo plazo.'
        ],
        a: 1,
        e: 'Crear la salida se paga a la tasa de hoy (31 × 20 = 620) y gastarla se pagará a la de largo plazo (68 × 10 = 680). La suma es 1 300 sat. Es la cantidad que el desperdicio resta en las selecciones con cambio.',
        s: ['seleccion', '04']
      },
      {
        q: 'Alicia tiene saldo 5. Una transacción paga 4 a Beto y otra paga 3 a Caro; cada una es válida por separado. ¿Qué pasa en el modelo de cuentas?',
        o: [
          'Da igual el orden: las dos se aplican y Alicia queda en −2.',
          'Se aplican las dos en paralelo y se descuenta la mitad de cada una.',
          'Se rechazan las dos, porque su suma excede el saldo.',
          'Sólo se aplica la primera en ejecutarse; la otra falla, y el estado final cambia según el orden.'
        ],
        a: 3,
        e: 'En cuentas las dos escriben el mismo renglón: la que corra segunda ya no tiene saldo suficiente. El orden importa. En UTXO, con entradas disjuntas, el resultado no depende del orden. Compara los dos modos del laboratorio 3.',
        s: ['paralelismo', '06']
      },
      {
        q: 'Modelas el conjunto UTXO como un grafo con una arista de t₁ a t₂ cuando t₂ gasta una salida de t₁. ¿Qué grafo resulta y por qué?',
        o: [
          'Un DAG: un ciclo exigiría que cada txid contuviera el hash de la otra transacción, una preimagen circular.',
          'Un árbol, porque cada transacción tiene exactamente una entrada.',
          'Un grafo con ciclos, porque el cambio vuelve a la dirección de origen.',
          'Un grafo completo, porque cualquier salida puede gastarse en cualquier transacción.'
        ],
        a: 0,
        e: 'El txid es el hash del contenido, así que una transacción sólo puede apuntar a otras que ya existían. Un ciclo equivaldría a romper la resistencia a preimagen. Los UTXO vigentes son las hojas del DAG: salidas a las que todavía no apunta ninguna arista.',
        s: ['definiciones', '02']
      },
      {
        q: 'Si Ethereum no tuviera nonce, cualquiera podría reenviar una transacción ya minada. ¿Por qué esa copia no funciona en Bitcoin sin recurrir a ninguna propiedad criptográfica adicional?',
        o: [
          'Porque la firma de la copia ya no verifica después de minarse.',
          'Porque el locktime caduca la transacción tras el primer bloque.',
          'Porque sus entradas ya no están en U: falla la regla «cada entrada existe en U» antes de mirar la firma.',
          'Porque los nodos recuerdan el hash de todas las transacciones pasadas y descartan duplicados.'
        ],
        a: 2,
        e: 'La protección es estructural: el primer minado destruye los objetos que la transacción consume. En el laboratorio 2, T4 es la copia exacta de T1 y en cuentas se rechaza sólo por el nonce; su firma es perfectamente válida.',
        s: ['nonce', '05']
      },
      {
        q: 'Una prueba de acceso en el árbol hexario actual pesa unos 3 kB. En un árbol binario (EIP-7864), con el factor (k − 1)/log₂k, ¿cuánto pesaría aproximadamente?',
        o: [
          'Unos 1 500 bytes, la mitad.',
          'Unos 800 bytes: 15/4 ≈ 3.75 veces menos.',
          'Unos 100 bytes, porque cada nodo aporta un solo hermano.',
          'Unos 3 kB: el tamaño no depende de la aridad.'
        ],
        a: 1,
        e: 'Para k = 16 el factor es 15/4 = 3.75; para k = 2 es 1/1 = 1. La razón es ≈ 3.75, de donde sale «unas cuatro veces más cortas»: 3 000 / 3.75 = 800 bytes. A cambio hay más niveles y más hashes que calcular al verificar.',
        s: ['estado', '07']
      },
      {
        q: 'Sobre el crecimiento del estado, ¿qué diferencia de incentivos hay entre los dos modelos?',
        o: [
          'En ambos el costo lo paga exclusivamente quien crea el estado nuevo.',
          'En UTXO el gas de almacenamiento internaliza el costo; en Ethereum no se paga nada por escribir estado.',
          'En UTXO el crecimiento es reversible porque los nodos pueden borrar polvo.',
          'En UTXO el costo recae en quien opera un nodo (quien creó el polvo ya pagó y se fue); en Ethereum el gas de almacenamiento internaliza parte del costo.'
        ],
        a: 3,
        e: 'En UTXO el polvo acumulado es una externalidad permanente: nadie borra entradas salvo gastándolas y gastar polvo cuesta más de lo que vale. En cuentas el gas cobra por escribir estado y hay reembolsos por liberarlo, aunque siguen siendo insuficientes.',
        s: ['estado', '07']
      },
      {
        q: 'En Ethereum la transacción con nonce 5 queda atorada por comisión baja. ¿Qué ocurre con las de nonce 6 y 7 de la misma cuenta, aunque paguen bien?',
        o: [
          'No pueden ejecutarse hasta que se resuelva la 5: el nonce impone un orden total estricto.',
          'Se ejecutan normalmente y la 5 se descarta.',
          'Se ejecutan, pero con un descuento proporcional en la comisión.',
          'Se reasignan automáticamente al nonce 5.'
        ],
        a: 0,
        e: 'Ése es el precio del contador: un orden total estricto por cuenta. En UTXO dos pagos que gastan monedas distintas son independientes. En el laboratorio 2, envía T2 (nonce 6) primero y verás que queda en espera hasta que llegue T3.',
        s: ['nonce', '05']
      },
      {
        q: 'Cuando Ethereum se bifurcó en 2016, la misma transacción firmada era válida en las dos redes. ¿Qué lo resolvió?',
        o: [
          'Aumentar el nonce de todas las cuentas en una de las cadenas.',
          'Prohibir que una dirección existiera en las dos redes.',
          'Cambiar el esquema de firma por uno distinto en cada cadena.',
          'El EIP-155: incluir el chainId dentro de lo que se firma.'
        ],
        a: 3,
        e: 'El nonce protege contra la repetición dentro de una cadena, pero no entre cadenas: mismo origen, mismo nonce, mismo saldo. Con el chainId firmado, una firma de la cadena 1 ya no sirve en la 61.',
        s: ['nonce', '05']
      },
      {
        q: 'Alicia gasta dos monedas de 5 y 3 BTC, paga 6 a Beto y recibe 1.9 de cambio. ¿Cuál es la comisión y dónde aparece en la transacción?',
        o: [
          '0.1; no aparece como campo: es el residuo entre lo que entra y lo que sale.',
          '0.1; aparece en un campo «fee» firmado por Alicia.',
          '2.0; es lo que sobra después de pagar a Beto.',
          '0; en Bitcoin la comisión la paga el receptor.'
        ],
        a: 0,
        e: 'La validez exige Σ entradas ≥ Σ salidas y la diferencia es la comisión: (5 + 3) − (6 + 1.9) = 0.1. Tampoco aparece ningún remitente: se deduce de quién pudo firmar las entradas.',
        s: ['definiciones', '02']
      },
      {
        q: 'Una transacción gasta cinco monedas a la vez. ¿Qué infiere un analista con la heurística de propiedad común de entradas?',
        o: [
          'Que las cinco monedas se crearon en el mismo bloque.',
          'Que lo más probable es que las cinco pertenezcan al mismo dueño, pues sólo él pudo firmarlas todas.',
          'Que el receptor es una cuenta de contrato.',
          'Nada: usar direcciones nuevas para cada cambio impide cualquier agrupamiento.'
        ],
        a: 1,
        e: 'Basta esa observación para volver a unir buena parte de una cartera, aunque cada cambio use una dirección nueva. Por eso la selección de monedas también es un problema de privacidad: Branch and Bound evita el cambio y el sorteo aleatorio no deja patrón.',
        s: ['privacidad', '08']
      },
      {
        q: 'Seis pagos idénticos al mismo destinatario. ¿Cuántos pueden ejecutarse a la vez en UTXO y en cuentas, y por qué?',
        o: [
          'Los seis en ambos, porque cuestan lo mismo.',
          'Los seis en cuentas y uno en UTXO, porque UTXO exige un orden.',
          'Los seis en UTXO (cada uno gasta monedas distintas y crea la suya) y uno a la vez en cuentas (todos escriben el mismo renglón).',
          'Uno en ambos, porque el destinatario es el mismo.'
        ],
        a: 2,
        e: 'El paralelismo no lo decide la carga de trabajo sino cómo está repartido el estado. En la práctica los pagos de Bitcoin sí pueden depender unos de otros (salidas creadas en el mismo bloque), pero la asimetría estructural es real. Míralo en el laboratorio 3.',
        s: ['paralelismo', '06']
      }
    ]
  };
})();
