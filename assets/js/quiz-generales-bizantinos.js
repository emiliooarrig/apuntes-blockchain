/* =========================================================
   ChainNotes — Apunte: Generales bizantinos
   Preguntas del quiz (las renderiza assets/js/quiz.js).
   ========================================================= */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Dominas las condiciones IC1 e IC2, la cota n ≥ 3f + 1, el papel de las firmas y por qué Bitcoin necesita un recurso escaso.',
    repasa: 'Te conviene repasar desde la sección 02 (la cota n > 3f): de ahí salen los quórums, el costo de OM(m) y la diferencia entre fallas bizantinas y de caída.',
    preguntas: [
      {
        q: 'El comandante es traidor. ¿Qué condiciones de consistencia interactiva siguen exigiéndose al algoritmo?',
        o: [
          'Ninguna: si el comandante miente, no hay nada que garantizar.',
          'IC2: los tenientes leales deben obedecer la orden del comandante.',
          'IC1: los tenientes leales deben ponerse de acuerdo entre sí, aunque IC2 ya no diga nada.',
          'Las dos, IC1 e IC2, con la misma fuerza que si fuera leal.'
        ],
        a: 2,
        e: 'IC2 sólo aplica con comandante leal. IC1 vale <em>siempre</em>: los leales deben decidir lo mismo aunque quien da la orden mienta. Esa exigencia es la que fracasa en el escenario A de la portada.',
        s: ['planteamiento', '01']
      },
      {
        q: 'En la demostración con tres generales, ¿por qué el teniente L1 no puede distinguir el escenario A (comandante traidor) del B (L2 traidor)?',
        o: [
          'Porque en ambos recibe exactamente los mismos mensajes: «atacar» del comandante y «me dijo retirarse» de L2.',
          'Porque en ambos casos el comandante envía la misma orden a todos.',
          'Porque L1 no puede leer los mensajes de L2.',
          'Porque en B el traidor firma sus mensajes y en A no.'
        ],
        a: 0,
        e: 'Lo único que un teniente ve es su bandeja de entrada, y es idéntica en A y en B. Por IC2 debe atacar en B, así que en A también ataca; el argumento simétrico en C obliga a L2 a retirarse y se viola IC1.',
        s: ['cota', '02']
      },
      {
        q: 'Quieres tolerar f = 3 generales traidores con mensajes orales. ¿Cuántos generales necesitas como mínimo?',
        o: [
          '9, porque 3f = 9.',
          '10, porque se requiere n ≥ 3f + 1.',
          '7, porque basta una mayoría simple de leales.',
          '12, porque cada traidor necesita tres leales.'
        ],
        a: 1,
        e: 'La cota es <var>n</var> &gt; 3<var>f</var>, es decir <var>n</var> ≥ 3<var>f</var> + 1 = 10. Con <var>n</var> = 9 = 3<var>f</var> la demostración de las tres divisiones por grupos de <var>f</var> vuelve a funcionar y no existe algoritmo.',
        s: ['cota', '02']
      },
      {
        q: 'En OM(1) con cuatro generales (n = 4, m = 1), ¿cuántos mensajes se envían en total?',
        o: [
          '6',
          '12',
          '16',
          '9'
        ],
        a: 3,
        e: 'Ronda 1: el comandante manda <var>n</var> − 1 = 3 mensajes. Ronda 2: cada uno de los 3 tenientes reenvía a los otros 2, es decir 3·2 = 6. Total: 3 + 6 = 9.',
        s: ['om', '03']
      },
      {
        q: 'Con la recurrencia M(n, m) = (n − 1) + (n − 1)·M(n − 1, m − 1) y M(n, 0) = n − 1, ¿cuántos mensajes envía OM(2) con n = 7?',
        o: [
          '156',
          '42',
          '216',
          '49'
        ],
        a: 0,
        e: 'M(6, 1) = 5 + 5·4 = 25, así que M(7, 2) = 6 + 6·25 = 156. El costo crece como <var>n</var><sup><var>m</var>+1</sup>: por eso OM(<var>m</var>) es inaplicable en redes grandes y PBFT o HotStuff evitan la recursión.',
        s: ['om', '03']
      },
      {
        q: 'En un sistema con n = 10 participantes y f = 3 traidores, dos quórums de tamaño n − f = 7 se intersecan como mínimo en…',
        o: [
          '1 participante.',
          '3 participantes, justo los traidores.',
          '4 participantes, de modo que al menos uno es leal.',
          '7 participantes, porque los quórums coinciden.'
        ],
        a: 2,
        e: 'Por inclusión–exclusión la intersección es ≥ 2(<var>n</var> − <var>f</var>) − <var>n</var> = <var>n</var> − 2<var>f</var> = 4 = <var>f</var> + 1. Como a lo más 3 son traidores, queda al menos un leal que dijo lo mismo a ambos quórums.',
        s: ['cota', '02']
      },
      {
        q: 'Con fallas por caída (no bizantinas), ¿cuántos procesos bastan para tolerar f = 2 caídas con quórums que se intersecan?',
        o: [
          '4, porque n > f + 2.',
          '5, porque basta n ≥ 2f + 1.',
          '6, porque se necesita n ≥ 3f.',
          '7, igual que en el caso bizantino.'
        ],
        a: 1,
        e: 'Un proceso caído no miente: basta que la intersección de quórums no sea vacía, <var>n</var> − 2<var>f</var> ≥ 1, es decir <var>n</var> ≥ 2<var>f</var> + 1 = 5. El caso bizantino exige 7; la diferencia es el precio de que los traidores puedan estar a ambos lados a la vez.',
        s: ['cota', '02']
      },
      {
        q: '¿Qué capacidad del traidor eliminan las firmas infalsificables de SM(m)?',
        o: [
          'Callar y no reenviar nada.',
          'Enviar mensajes contradictorios a distintos destinatarios.',
          'Negarse a firmar sus propios mensajes.',
          'Mentir sobre lo que dijo otro: sólo puede reenviar lo verdadero o callar.'
        ],
        a: 3,
        e: 'Con firmas, inventar una orden del comandante exigiría falsificarla. El traidor aún puede callar o contradecirse, pero dos leales que comparen notas obtienen una prueba pública de la traición. Por eso el umbral baja de <var>n</var> ≥ 3<var>m</var> + 1 a <var>n</var> ≥ <var>m</var> + 2.',
        s: ['firmas', '04']
      },
      {
        q: 'En una red abierta, ¿por qué falla una votación de «una identidad, un voto» (ataque Sybil)?',
        o: [
          'Porque las firmas digitales pueden falsificarse con facilidad.',
          'Porque los mensajes tardan demasiado en propagarse.',
          'Porque crear mil identidades cuesta casi lo mismo que crear una: basta generar pares de llaves.',
          'Porque el número de traidores siempre supera a n/3.'
        ],
        a: 2,
        e: 'Sin una lista de participantes, <var>n</var> es desconocido y contar identidades no significa nada. Nakamoto sustituye la identidad por un recurso escaso: el costo del trabajo crece con la influencia, el de las llaves no.',
        s: ['sybil', '05']
      },
      {
        q: 'Con un atacante que controla q = 0.25 del cómputo, ¿cuál es aproximadamente la probabilidad de que revierta una transacción con z = 6 confirmaciones (fórmula de Nakamoto)?',
        o: [
          'Cerca del 5 %: uno de cada veinte ataques triunfa.',
          'Cerca del 0.02 %, prácticamente imposible.',
          'Cerca del 50 %, una moneda al aire.',
          'Exactamente 0, porque seis confirmaciones son definitivas.'
        ],
        a: 0,
        e: 'La fórmula da <var>P</var> ≈ 4.99 % para <var>q</var> = 0.25 (0.024 % sólo con <var>q</var> = 0.10, y ≈ 50 % con <var>q</var> = 0.40). Para bajar de 0.1 % con <var>q</var> = 0.25 hacen falta 15 confirmaciones.',
        s: ['nakamoto', '06']
      },
      {
        q: 'El resultado de Fischer, Lynch y Paterson (FLP) afirma que…',
        o: [
          'Con más de n/3 traidores no existe ningún algoritmo de consenso.',
          'En un sistema asíncrono, ningún algoritmo determinista garantiza acuerdo aunque falle un solo proceso, incluso por caída.',
          'Las firmas digitales hacen imposible el consenso en redes abiertas.',
          'El consenso síncrono requiere al menos 2f + 1 procesos.'
        ],
        a: 1,
        e: 'FLP limita las suposiciones sobre el <em>tiempo</em>, no el número de traidores: en asincronía total no se distingue un proceso caído de uno lento. PBFT lo rodea con sincronía parcial y Bitcoin con aleatoriedad.',
        s: ['flp', '07']
      }
    ]
  };
})();
