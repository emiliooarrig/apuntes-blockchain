/* ==========================================================
   ChainNotes · datos del quiz de la página "Modelo UTXO y minería"
   (temas/utxo-y-mineria.html). Lo consume assets/js/quiz.js, que
   debe cargarse DESPUÉS de este archivo.
   ========================================================== */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Sabes leer un pago como monedas que entran y salen, y entiendes cómo la minería, la dificultad y el halving mantienen a Bitcoin funcionando.',
    repasa: 'Te conviene repasar desde la sección 01 (dinero en monedas, no en saldos) y la 03 (anatomía de una transacción): son la base de todo lo demás.',
    preguntas: [
      {
        q: 'Tu cartera de Bitcoin te muestra un saldo de 1.45 BTC. ¿Qué hay guardado realmente en la red?',
        o: [
          'Una fila con tu nombre y el número 1.45, que se reescribe con cada pago.',
          'Un archivo en tu teléfono que contiene los bitcoins.',
          'Varias monedas sueltas (UTXO) que sólo tus llaves pueden abrir; tu cartera las suma.',
          'Un registro en el servidor de la empresa que creó tu cartera.'
        ],
        a: 2,
        e: 'Bitcoin no guarda saldos. Guarda monedas sin gastar, cada una con su candado. El «saldo» es una suma que calcula tu cartera, igual que sumas los billetes que traes en la bolsa.',
        s: ['monedas', '01']
      },
      {
        q: '¿Qué significa <em>UTXO</em>?',
        o: [
          'Salida de transacción no gastada: una moneda que nació en un pago y nadie ha usado todavía.',
          'Unidad de transferencia entre exchanges.',
          'Un tipo de cuenta bancaria compatible con Bitcoin.',
          'El nombre del bloque donde se guardan las comisiones.'
        ],
        a: 0,
        e: 'Son las siglas de <em>Unspent Transaction Output</em>. «Salida» porque nace como resultado de un pago; «no gastada» porque sigue disponible.',
        s: ['utxo', '02']
      },
      {
        q: 'Tienes una sola moneda de 0.5 BTC y quieres pagar 0.2 BTC. ¿Qué pasa con tu moneda?',
        o: [
          'Se le restan 0.2 BTC y la misma moneda queda valiendo 0.3 BTC.',
          'Se gasta completa: salen 0.2 BTC para el destinatario y lo demás regresa a ti como una moneda nueva de cambio (menos la comisión).',
          'No puedes pagar: necesitas una moneda de exactamente 0.2 BTC.',
          'Se divide en dos mitades de 0.25 BTC.'
        ],
        a: 1,
        e: 'Las monedas no se editan ni se gastan a medias. Se consumen enteras y en su lugar se crean salidas nuevas: el pago y tu cambio.',
        s: ['utxo', '02']
      },
      {
        q: 'Ana gasta monedas de 0.8 y 0.5 BTC. Crea una salida de 1 BTC para Beto y otra de 0.29 BTC de cambio para ella. ¿Cuánto cobra el minero de comisión?',
        o: [
          'Nada, porque no hay ninguna salida para el minero.',
          '0.29 BTC.',
          '0.3 BTC.',
          '0.01 BTC.'
        ],
        a: 3,
        e: 'Comisión = entradas − salidas = (0.8 + 0.5) − (1 + 0.29) = 1.3 − 1.29 = 0.01 BTC. No hace falta escribirla: es lo que sobra.',
        s: ['transaccion', '03']
      },
      {
        q: 'Ana gasta una moneda de 1.3 BTC para pagarle 1 BTC a Beto, pero se le olvida crear la salida de cambio. ¿Qué ocurre?',
        o: [
          'La red detecta el error y le devuelve automáticamente los 0.3 BTC.',
          'Los 0.3 BTC que sobran se van completos al minero como comisión.',
          'La transacción es inválida y se rechaza.',
          'Los 0.3 BTC se quedan congelados en la moneda original.'
        ],
        a: 1,
        e: 'Todo lo que no se asigna a una salida es comisión. Por eso el cambio es tan importante: olvidarlo equivale a regalarle la diferencia al minero.',
        s: ['transaccion', '03']
      },
      {
        q: 'Las monedas de Bitcoin están en una lista que todos pueden ver. ¿Qué impide que alguien gaste una moneda que no es suya?',
        o: [
          'Cada moneda tiene un candado (Script) que sólo se abre con una firma hecha con la llave privada del dueño.',
          'Las monedas están ocultas y nadie más sabe que existen.',
          'Un banco revisa cada pago y bloquea los sospechosos.',
          'Nada: en Bitcoin se confía en que nadie lo intente.'
        ],
        a: 0,
        e: 'Cada salida lleva una condición de gasto. Para usarla, la entrada debe traer una firma válida. Cualquier nodo puede comprobarla sin conocer la llave privada.',
        s: ['candados', '04']
      },
      {
        q: 'Ana intenta usar la misma moneda para pagarle a Beto y, después, a Carla. El pago a Beto ya está en un bloque. ¿Qué pasa con el de Carla?',
        o: [
          'Se aceptan los dos y la moneda queda con saldo negativo.',
          'Se acepta el de Carla y se cancela el de Beto, porque es más reciente.',
          'Se rechaza: esa moneda ya salió del conjunto UTXO y cualquier nodo ve que ya no existe.',
          'Se envía a revisión manual.'
        ],
        a: 2,
        e: 'Así se evita el doble gasto: una moneda gastada desaparece de la lista de monedas vivas, y un pago que intente usarla de nuevo es inválido.',
        s: ['candados', '04']
      },
      {
        q: 'La red está congestionada y tu pago lleva horas en espera. ¿Qué lo haría entrar antes a un bloque?',
        o: [
          'Enviarlo varias veces seguidas.',
          'Pagar una comisión más alta por el espacio que ocupa, porque los mineros eligen primero los pagos que más dejan.',
          'Enviar un monto más grande.',
          'Esperar a que baje la dificultad.'
        ],
        a: 1,
        e: 'Los bloques tienen espacio limitado y el minero los llena con los pagos del mempool que dejan más comisión por byte.',
        s: ['mineria', '05']
      },
      {
        q: '¿De dónde salen los bitcoins nuevos?',
        o: [
          'Los imprime una fundación cada año.',
          'Se crean cuando alguien compra bitcoin en un exchange.',
          'Aparecen cuando dos monedas pequeñas se combinan.',
          'De la transacción coinbase: la primera de cada bloque, con la que el minero cobra la recompensa.'
        ],
        a: 3,
        e: 'La coinbase no tiene entradas y es la única forma de emitir bitcoins nuevos. Paga al minero la recompensa del bloque más las comisiones.',
        s: ['mineria', '05']
      },
      {
        q: 'En la prueba de trabajo, ¿para qué cambia el minero el <em>nonce</em> una y otra vez?',
        o: [
          'Para cifrar los pagos del bloque.',
          'Para que la huella (hash) del encabezado cambie, hasta encontrar una que quede por debajo del objetivo.',
          'Para registrar la hora exacta del bloque.',
          'Para elegir qué pagos entran al bloque.'
        ],
        a: 1,
        e: 'El hash es impredecible, así que la única estrategia es probar. Cada nonce produce una huella nueva; casi todas fallan, y gana quien encuentre una bajo el objetivo.',
        s: ['loteria', '06']
      },
      {
        q: 'Los últimos 2016 bloques salieron en una semana en lugar de dos. ¿Qué hace la red?',
        o: [
          'Duplica la dificultad, para que los bloques vuelvan a salir cada 10 minutos.',
          'Reduce la dificultad a la mitad.',
          'Nada: la dificultad es fija desde 2009.',
          'Duplica la recompensa del minero.'
        ],
        a: 0,
        e: 'Nueva dificultad = vieja × (2 semanas ÷ 1 semana) = el doble. El ajuste es automático: cada nodo hace la misma cuenta cada 2016 bloques.',
        s: ['dificultad', '07']
      },
      {
        q: 'Desde el halving de 2024 la recompensa es de 3.125 BTC por bloque. ¿Cuál será después del siguiente halving (hacia 2028)?',
        o: [
          '6.25 BTC.',
          '3.125 BTC; ya no habrá más halvings.',
          '1.5625 BTC.',
          '0 BTC; a partir de ahí sólo habrá comisiones.'
        ],
        a: 2,
        e: 'Cada 210 000 bloques (unos cuatro años) la recompensa se parte a la mitad: 3.125 ÷ 2 = 1.5625. Así la emisión total se acerca a 21 millones sin superarlos.',
        s: ['halving', '08']
      }
    ]
  };
})();
