/* =========================================================
   ChainNotes — Apunte: Pruebas de conocimiento cero
   Preguntas del quiz (las renderiza assets/js/quiz.js).
   ========================================================= */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Dominas las tres propiedades de una prueba de conocimiento cero y sabes hacer las cuentas de Schnorr y Shamir.',
    repasa: 'Te conviene repasar desde la sección 02 (la cueva): ahí aparecen la completitud, la solidez y el conocimiento cero, que sostienen todo lo demás.',
    preguntas: [
      {
        q: 'En la cueva de Alí Babá, una impostora que no conoce la palabra mágica adivina el pasillo que pedirá Víctor en cada ronda. ¿Con qué probabilidad supera una ronda?',
        o: [
          '1/4, porque hay dos pasillos y dos momentos para fallar.',
          '1/2: acierta si Víctor pide justo el pasillo por el que ella salió.',
          '1/3, porque hay tres puertas posibles.',
          '0, porque sin la palabra no puede salir nunca.'
        ],
        a: 1,
        e: 'Peggy entra por un lado al azar; si Víctor pide ese mismo lado, sale sin necesitar la puerta. Acierta con probabilidad <strong>½</strong> por ronda, así que el engaño sólo se sostiene con mucha suerte.',
        s: ['cueva', '02']
      },
      {
        q: '¿Cuántas rondas superadas necesita Víctor, como mínimo, para que la suerte de una impostora sea menor que 1 en un millón?',
        o: [
          '10 rondas',
          '15 rondas',
          '20 rondas',
          '100 rondas'
        ],
        a: 2,
        e: 'Se busca el menor <var>n</var> con (½)<sup><var>n</var></sup> &lt; 10<sup>−6</sup>, o sea 2<sup><var>n</var></sup> &gt; 1 000 000. Como 2<sup>19</sup> = 524 288 y 2<sup>20</sup> = 1 048 576, hacen falta <strong>20 rondas</strong>.',
        s: ['cueva', '02']
      },
      {
        q: 'Víctor graba las 20 rondas exitosas y se las muestra a Alicia. ¿Por qué ella no debería creerle?',
        o: [
          'Porque el video comprime la imagen y pierde la palabra mágica.',
          'Porque Víctor y una actriz sin la palabra pueden fabricar el video acordando los retos de antemano o cortando las tomas fallidas.',
          'Porque 20 rondas son insuficientes para cualquier prueba.',
          'Porque la palabra mágica queda grabada y Alicia la podría robar.'
        ],
        a: 1,
        e: 'Un video falso es indistinguible de uno real: la convicción nace de que Víctor eligió los retos <em>al azar y en vivo</em>. Esa posibilidad de simular es justamente la idea del conocimiento cero: el verificador no se lleva nada transferible.',
        s: ['cueva', '02']
      },
      {
        q: 'En la prueba del amigo daltónico (dos bolas), ¿qué impide que un verificador con trampa sepa cuál bola es cuál sin que la probadora distinga los colores?',
        o: [
          'Nada: con suficientes rondas el verificador siempre termina enterándose.',
          'Que la probadora cambie o no las bolas a escondidas y el verificador sólo verifique si ella acierta; si las bolas fueran idénticas, acertaría sólo la mitad de las veces.',
          'Que las bolas se guarden en una caja cerrada con llave.',
          'Que el verificador sea daltónico y no pueda ver ninguna de las dos.'
        ],
        a: 1,
        e: 'El verificador intercambia o no las bolas tras su espalda en secreto. Quien distingue los colores siempre dice si hubo cambio; una probadora que no los distingue acierta con probabilidad ½ por ronda. El verificador no aprende <em>cuál</em> es cuál, sólo que son distintas.',
        s: ['bolas', '03']
      },
      {
        q: 'En la prueba de 3-coloración con sobres sellados, ¿qué ocurre si Peggy NO baraja los colores entre una ronda y otra?',
        o: [
          'Nada, porque los sobres siguen sellados.',
          'Víctor detecta que ella miente, porque los colores se repiten.',
          'Cada vértice muestra siempre el mismo color y, con suficientes rondas, Víctor reconstruye la coloración completa: deja de ser conocimiento cero.',
          'La prueba falla en la solidez, ya que Peggy podría hacer trampa con aristas mal coloreadas.'
        ],
        a: 2,
        e: 'Al barajar los tres colores cada ronda, Víctor sólo ve “dos colores distintos” sin saber cuáles. Sin barajar, anota el color real de cada vértice ronda tras ronda y obtiene la solución: se rompe el <em>conocimiento cero</em>, no la solidez.',
        s: ['grafo', '04']
      },
      {
        q: 'Un grafo tiene 14 aristas y Peggy colorea mal exactamente una. Cada ronda Víctor revisa una arista al azar. ¿Cuántas rondas hacen falta para tener al menos 99.9 % de certeza de pillarla?',
        o: [
          '14 rondas',
          '94 rondas',
          '14 · 14 = 196 rondas',
          '1 000 rondas'
        ],
        a: 1,
        e: 'Peggy escapa en una ronda con probabilidad 13/14. Se pide (13/14)<sup><var>n</var></sup> ≤ 0.001, es decir <var>n</var> ≥ ln(0.001)/ln(13/14) ≈ 93.2. Hacen falta <strong>94 rondas</strong>.',
        s: ['grafo', '04']
      },
      {
        q: 'Schnorr con <var>p</var> = 23, <var>q</var> = 11, <var>g</var> = 2 y secreto <var>x</var> = 7. Peggy elige <var>r</var> = 5 y Víctor reta con <var>c</var> = 8. ¿Qué respuesta <var>s</var> = <var>r</var> + <var>c</var>·<var>x</var> (mod <var>q</var>) envía Peggy?',
        o: [
          '<var>s</var> = 5',
          '<var>s</var> = 9',
          '<var>s</var> = 61',
          '<var>s</var> = 6'
        ],
        a: 3,
        e: 'Se calcula 5 + 8·7 = 61 y se reduce módulo <var>q</var> = 11: 61 = 5·11 + 6, así que <strong><var>s</var> = 6</strong>. (9 es el compromiso <var>t</var> = 2<sup>5</sup> mod 23, y 61 es el valor sin reducir.)',
        s: ['schnorr', '05']
      },
      {
        q: 'Con los mismos datos (<var>t</var> = 9, <var>y</var> = 13, <var>c</var> = 8, <var>s</var> = 6), ¿qué comprueba Víctor para aceptar?',
        o: [
          'Que <var>g</var><sup><var>s</var></sup> ≡ <var>t</var>·<var>y</var><sup><var>c</var></sup> (mod <var>p</var>): 18 = 18.',
          'Que <var>s</var> = <var>x</var>, calculando el secreto directamente.',
          'Que <var>g</var><sup><var>s</var></sup> ≡ <var>t</var> + <var>y</var> (mod <var>p</var>).',
          'Que <var>t</var> sea primo y menor que <var>q</var>.'
        ],
        a: 0,
        e: 'Lado izquierdo: 2<sup>6</sup> mod 23 = 18. Lado derecho: 9·13<sup>8</sup> mod 23 = 9·2 = 18. Coinciden, así que Víctor acepta sin conocer <var>x</var>: la ecuación sólo se cumple si Peggy sabe <var>x</var> (o adivinó <var>c</var> de antemano).',
        s: ['schnorr', '05']
      },
      {
        q: 'Peggy reutilizó el mismo <var>r</var> en dos rondas (módulo <var>q</var> = 11): con <var>c</var><sub>1</sub> = 3 respondió <var>s</var><sub>1</sub> = 4 y con <var>c</var><sub>2</sub> = 8 respondió <var>s</var><sub>2</sub> = 6. ¿Qué secreto <var>x</var> se filtra?',
        o: [
          '<var>x</var> = 3',
          '<var>x</var> = 9',
          '<var>x</var> = 7',
          '<var>x</var> = 5'
        ],
        a: 2,
        e: 'Al restar, <var>r</var> se cancela: <var>s</var><sub>1</sub> − <var>s</var><sub>2</sub> = (<var>c</var><sub>1</sub> − <var>c</var><sub>2</sub>)·<var>x</var>. Entonces <var>x</var> = (4 − 6)·(3 − 8)<sup>−1</sup> = 9·6<sup>−1</sup> = 9·2 = 18 ≡ <strong>7</strong> (mod 11). Por eso el aleatorio debe ser nuevo cada ronda, como el nonce de ECDSA.',
        s: ['schnorr', '05']
      },
      {
        q: 'En Shamir con umbral <var>k</var> = 3 sólo tienes dos fragmentos, (1, 13) y (2, 12). ¿Qué puedes concluir sobre el secreto <var>S</var>?',
        o: [
          'Que <var>S</var> = 12, el menor valor de los fragmentos.',
          'Que <var>S</var> está acotado a unos pocos valores posibles.',
          'Nada: cualquier valor de <var>S</var> es compatible con esos dos fragmentos, porque siempre existe una parábola que pasa por ellos con ese secreto.',
          'Que <var>S</var> = 13 − 12 = 1, la diferencia entre fragmentos.'
        ],
        a: 2,
        e: 'Con dos puntos faltan grados de libertad: 20<var>x</var> − 7<var>x</var><sup>2</sup> pasa por (1, 13) y (2, 12) con secreto 0, y 12 + 2<var>x</var> − <var>x</var><sup>2</sup> pasa por ellos con secreto 12. Con <em>k</em> − 1 fragmentos la información sobre <var>S</var> es nula.',
        s: ['shamir', '06']
      },
      {
        q: 'Resume las tres propiedades de una prueba de conocimiento cero. ¿Cuál es la correcta?',
        o: [
          'Completitud: el verificador gana siempre; solidez: la probadora nunca se equivoca; conocimiento cero: el protocolo es rápido.',
          'Completitud: si la afirmación es cierta, el verificador honesto acepta; solidez: si es falsa, una tramposa casi nunca lo engaña; conocimiento cero: el verificador no aprende nada más que la verdad de la afirmación.',
          'Completitud: la prueba cabe en un solo mensaje; solidez: usa hashes seguros; conocimiento cero: no requiere aleatoriedad.',
          'Completitud: se revelan todos los datos; solidez: se verifican; conocimiento cero: se borran después.'
        ],
        a: 1,
        e: 'Son las tres piezas: <strong>completitud</strong> (lo cierto se acepta), <strong>solidez</strong> (lo falso se rechaza salvo con probabilidad despreciable) y <strong>conocimiento cero</strong> (el verificador podría simular la conversación él solo).',
        s: ['idea', '01']
      },
      {
        q: 'El conocimiento cero se demuestra mostrando que el verificador podría generar por su cuenta transcripciones indistinguibles de las reales. ¿Cómo se llama a este argumento?',
        o: [
          'Un simulador',
          'Un oráculo aleatorio',
          'Un compromiso de Pedersen',
          'Un árbol de Merkle'
        ],
        a: 0,
        e: 'Es el argumento del <em>simulador</em>: si alguien sin el secreto puede fabricar transcripciones con la misma distribución que las reales, entonces las reales no pueden filtrar el secreto. Es la misma idea del video falso de la cueva.',
        s: ['idea', '01']
      }
    ]
  };
})();
