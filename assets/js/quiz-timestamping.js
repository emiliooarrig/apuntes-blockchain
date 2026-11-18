/* ==========================================================
   ChainNotes · datos del quiz de la página "Modelo UTXO y minería"
   (temas/timestamping.html). Lo consume assets/js/quiz.js, que
   debe cargarse DESPUÉS de este archivo.
   ========================================================== */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Tienes claro qué es un UTXO y cómo la minería busca una solución de Proof of Work.',
    repasa: 'Te conviene empezar por la sección 01 (¿qué es el modelo UTXO?) y seguir con la minería y el Proof of Work.',
    preguntas: [
      {
        q: '¿Qué es un <em>UTXO</em>?',
        o: [
          'Una salida de transacción que todavía no ha sido gastada',
          'Un bloque que ya fue minado y aceptado por la red',
          'Una clave privada con la que se firman las transacciones',
          'El hash del encabezado de un bloque'
        ],
        a: 0,
        e: 'UTXO significa <em>unspent transaction output</em>: una salida creada por una transacción que aún no se ha usado como entrada de otra. El conjunto de esas salidas representa lo que sigue disponible.',
        s: ['utxo', '01']
      },
      {
        q: 'Una salida se gasta en una nueva transacción. ¿Qué pasa con ella respecto al conjunto UTXO?',
        o: [
          'Permanece en el conjunto, marcada como usada',
          'Deja de formar parte del conjunto de salidas disponibles',
          'Se duplica, una copia para cada participante',
          'Se convierte en un nonce'
        ],
        a: 1,
        e: 'Una salida gastada ya no es una salida no gastada: sale del conjunto UTXO, y las nuevas salidas que produce la transacción pasan a formar parte del nuevo estado.',
        s: ['utxo', '01']
      },
      {
        q: '¿Cuál de estas cadenas resume mejor el flujo de un UTXO en el apunte?',
        o: [
          'Nonce → hash → bloque → salida',
          'Salida gastada → salida creada → hash → umbral',
          'Encabezado → double-SHA256 → comparación con la dificultad',
          'Salida creada → salida disponible → salida gastada → nuevas salidas disponibles'
        ],
        a: 3,
        e: 'La opción correcta es el ciclo de vida de una salida. Las otras mezclan conceptos de la minería (nonce, hash, umbral) o invierten el orden de creación y gasto.',
        s: ['utxo', '01']
      },
      {
        q: 'Ana tiene dos UTXO, de 0.8 BTC y 0.5 BTC, y quiere enviar 1 BTC (sin comisiones). ¿Qué ocurre?',
        o: [
          'Se usa solo el UTXO de 0.8 BTC y se pierde el resto',
          'Ambos UTXO se gastan como entradas y se crean una salida de 1 BTC y otra de 0.3 BTC de cambio',
          'Se divide cada UTXO en dos, sin gastar ninguno',
          'Ambos UTXO permanecen en el conjunto y se crea una salida de 1 BTC'
        ],
        a: 1,
        e: 'Los dos UTXO suman 1.3 BTC. Se consumen completos como entradas, y la transacción crea 1 BTC para el destinatario y 0.3 BTC de cambio para Ana. Los UTXO originales dejan de formar parte del conjunto.',
        s: ['ejercicios', '07']
      },
      {
        q: 'Una transacción crea tres salidas (A, B y C). Después se gastan A y C. ¿Qué queda en el conjunto UTXO?',
        o: [
          'Solo la salida B',
          'Solo las salidas A y C',
          'Las tres salidas',
          'Ninguna, porque la transacción original ya terminó'
        ],
        a: 0,
        e: 'Solo la salida B sigue sin gastar, así que es la única que continúa en el conjunto UTXO. A y C ya se consumieron.',
        s: ['ejercicios', '07']
      },
      {
        q: '¿Por qué importa el conjunto UTXO, según el apunte (tomando Mimblewimble como ejemplo)?',
        o: [
          'Porque permite que el minero elija el nonce más rápido',
          'Porque elimina la necesidad de verificar las transacciones',
          'Porque el tamaño de la cadena puede relacionarse con el estado actual y no solo con conservar todo el historial',
          'Porque garantiza que ningún bloque tenga que contener firmas'
        ],
        a: 2,
        e: 'Si las salidas creadas y luego gastadas pueden cancelarse, sobreviven principalmente las salidas sin gastar y lo necesario para verificar la validez. El estado actual, y no todo el historial, domina el tamaño.',
        s: ['utxo-importancia', '02']
      },
      {
        q: '¿Qué función hash usa Bitcoin en su mecanismo de Proof of Work?',
        o: [
          'SHA-256 aplicado una sola vez',
          'MD5 aplicado dos veces',
          'SHA-256 aplicado dos veces (double-SHA256)',
          'Una firma de anillo sobre el bloque'
        ],
        a: 2,
        e: 'Bitcoin aplica <em>double-SHA256</em>, tanto en la estructura de bloques como en el Proof of Work.',
        s: ['mineria', '03']
      },
      {
        q: '¿Qué busca el minero al variar el <em>nonce</em>?',
        o: [
          'Que el hash del encabezado del bloque quede por debajo del umbral de dificultad',
          'Que el hash del encabezado sea idéntico al del bloque anterior',
          'Que el bloque contenga el mayor número posible de UTXO',
          'Que el hash tenga la mayor cantidad de ceros posibles al final'
        ],
        a: 0,
        e: 'Cada nonce distinto produce un hash distinto del encabezado. La condición de Proof of Work es encontrar uno cuyo hash quede <em>por debajo</em> del umbral definido por la dificultad.',
        s: ['mineria', '03']
      },
      {
        q: 'Un minero calcula el double-SHA256 del encabezado y el hash NO cumple el umbral. ¿Qué hace?',
        o: [
          'Acepta el bloque de todos modos, porque hizo el trabajo',
          'Elimina el bloque candidato y la cadena se detiene',
          'Cambia el umbral de dificultad hasta que el hash lo cumpla',
          'Modifica valores del encabezado, como el nonce, y vuelve a calcular el hash'
        ],
        a: 3,
        e: 'El proceso se repite: se cambia el nonce (u otros valores del encabezado), se vuelve a aplicar double-SHA256 y se compara de nuevo. El umbral lo fija la red, el minero no lo cambia.',
        s: ['proceso-mineria', '04']
      },
      {
        q: 'Con un umbral simplificado de <code>0000FFFF...</code>, ¿cumple el hash <code>00001234...</code>?',
        o: [
          'No, porque tiene más ceros que el umbral',
          'Sí, porque es numéricamente menor que el umbral',
          'No, porque el hash debe ser siempre mayor que el umbral',
          'No se puede saber sin conocer el nonce'
        ],
        a: 1,
        e: 'La condición es hash menor que el umbral, y <code>00001234...</code> es numéricamente menor que <code>0000FFFF...</code>. Tener más ceros al inicio hace al número más pequeño, no menos válido.',
        s: ['ejercicios', '07']
      },
      {
        q: 'El ejemplo de blockchain artesanal del material se presenta sin minería, sin consenso distribuido y sin red P2P. ¿Qué hace falta para llegar a una blockchain real con varios participantes?',
        o: [
          'Solo agregar más bloques encadenados con hash',
          'Mecanismos de consenso como Proof of Work y una red que comparta los nuevos bloques',
          'Eliminar las funciones hash y las firmas digitales',
          'Que un único participante firme todos los bloques'
        ],
        a: 1,
        e: 'El encadenamiento criptográfico explica cómo se relacionan los bloques, pero un sistema distribuido necesita además consenso (aquí, Proof of Work) y una red P2P para propagar los bloques.',
        s: ['blockchain-real', '05']
      },
      {
        q: 'Resume el apunte: ¿cuál es la relación entre UTXO y minería?',
        o: [
          'UTXO identifica las salidas disponibles; la minería busca una solución válida de Proof of Work',
          'UTXO es el resultado de la minería y no existe sin ella',
          'La minería elimina el conjunto UTXO en cada bloque',
          'Son dos nombres para el mismo concepto'
        ],
        a: 0,
        e: 'Son ideas distintas: el modelo UTXO describe el estado (qué salidas siguen disponibles) y la minería es el proceso que, mediante Proof of Work, produce bloques válidos en una red distribuida.',
        s: ['resumen', '06']
      }
    ]
  };
})();
