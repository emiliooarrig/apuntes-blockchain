/* Quiz de Prueba de trabajo: datos para assets/js/quiz.js */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: 'Dominas la prueba de trabajo: orden, minería, dificultad y seguridad. Ya puedes explicar por qué Bitcoin no necesita un banco.',
    repasa: 'Revisa las secciones que se indican junto a cada respuesta fallada y vuelve a intentarlo.',
    preguntas: [
      {
        q: 'Una transacción digital está firmada. ¿Por qué eso no basta para evitar el doble gasto?',
        o: ['Porque las firmas digitales se pueden falsificar con facilidad',
          'Porque la firma prueba quién la emitió, no que no se haya gastado antes',
          'Porque el banco no reconoce las firmas digitales',
          'Porque una moneda firmada solo se puede gastar una vez por día'],
        a: 1,
        e: 'Dos copias de un archivo firmado son igual de válidas: ambas llevan una firma correcta. El problema no es criptográfico sino de consenso: hace falta un <em>orden</em> común de las transacciones, para que la segunda transacción que gaste la misma moneda sea inválida.',
        s: ['problema', '01']
      },
      {
        q: '¿Qué aportó Hashcash (Back, 1997) que Bitcoin adoptó casi tal cual?',
        o: ['Un servicio central de sellado de tiempo',
          'Las firmas ciegas para dar privacidad al dinero',
          'Un registro replicado que elimina el punto central',
          'Hallar un texto cuyo hash empiece con ceros: un cálculo caro de hacer y barato de verificar'],
        a: 3,
        e: 'Hashcash exige un cálculo costoso de producir y trivial de comprobar. Por sí solo no prevenía el doble gasto; faltaba usarlo como mecanismo de <em>consenso</em>, que es lo que hizo Nakamoto en 2008.',
        s: ['antecedentes', '02']
      },
      {
        q: '¿Qué es un ataque Sybil y por qué la prueba de trabajo lo frena?',
        o: ['Fabricar muchas identidades para ganar votos; frenado porque votar exige cómputo real, no identidades',
          'Gastar dos veces la misma moneda; frenado porque el hash es determinista',
          'Alterar un bloque antiguo; frenado porque el nonce solo tiene 32 bits',
          'Retrasar los bloques de la red; frenado por el ajuste de dificultad'],
        a: 0,
        e: 'Si cada identidad tuviera un voto, bastaría crear miles. Con prueba de trabajo la probabilidad de ganar es <code>h<sub>i</sub> / Σh<sub>j</sub></code>: repartir el mismo hardware entre mil cuentas no suma ni un voto.',
        s: ['voto', '03']
      },
      {
        q: 'Un minero aporta el 5 % de los hashes de la red. ¿Con qué probabilidad encuentra el siguiente bloque?',
        o: ['Con 5 %, y no cambia aunque use cien identidades distintas',
          'Con más de 5 %, porque lleva más tiempo buscando',
          'Con 5 % solo si usa una única identidad',
          'Con menos de 5 %, porque la red compite contra él'],
        a: 0,
        e: 'La probabilidad es exactamente su fracción <var>f</var> del cómputo, sin importar cuántas identidades use. Y llevar tiempo buscando no ayuda: la búsqueda no tiene memoria.',
        s: ['voto', '03']
      },
      {
        q: '¿Qué se hashea exactamente al minar un bloque de Bitcoin?',
        o: ['Todas las transacciones del bloque, una por una',
          'Un encabezado de 80 bytes, con SHA-256 aplicado dos veces',
          'Solo el nonce, con SHA-256 una vez',
          'La cadena completa de bloques anteriores'],
        a: 1,
        e: 'El encabezado (versión, hash previo, raíz de Merkle, tiempo, bits y nonce) mide 80 bytes. Las transacciones entran por la raíz de Merkle: tocar una cambia la raíz y, con ella, el hash del bloque.',
        s: ['bloque', '04']
      },
      {
        q: 'La regla real para que un hash sea válido es que, leído como número de 256 bits, sea…',
        o: ['igual a un valor fijo para todos los bloques',
          'mayor o igual que el objetivo',
          'menor o igual que el objetivo',
          'un número par con ceros al final'],
        a: 2,
        e: 'Contar ceros iniciales es solo una aproximación: la regla exacta es hash ≤ objetivo. Cada cero hexadecimal más divide el objetivo entre 16, y el campo <em>bits</em> lo codifica de forma compacta.',
        s: ['bloque', '04']
      },
      {
        q: 'Un minero lleva horas buscando sin éxito. ¿Qué probabilidad tiene ahora de acertar en el siguiente intento?',
        o: ['Mayor, porque ya "le toca"',
          'Menor, porque ya gastó su suerte',
          'Nula, hasta que cambie el nonce de bloque',
          'La misma que al empezar: la minería no tiene memoria'],
        a: 3,
        e: 'Cada intento es un sorteo independiente con probabilidad 2<sup>−d</sup>. Como lanzar un dado: fallar diez veces no hace más probable el siguiente seis. Por eso el tiempo de búsqueda es exponencial.',
        s: ['mineria', '05']
      },
      {
        q: 'Con <em>d</em> bits iniciales en cero exigidos, ¿cuántos intentos hacen falta en promedio, y qué pasa con la dispersión?',
        o: ['2<sup>d</sup> intentos; unos pocos bloques tardan varias veces el promedio',
          '<em>d</em> intentos; todos los bloques tardan casi lo mismo',
          '2<sup>d</sup> intentos; todos los bloques tardan exactamente el promedio',
          '<em>d</em><sup>2</sup> intentos; la mayoría tarda más que el promedio'],
        a: 0,
        e: 'Cada intento acierta con probabilidad 2<sup>−d</sup>, así que E[N] = 2<sup>d</sup>. Pero la dispersión es enorme: la mediana es ≈ 0.693 del promedio y cerca del 36.8 % de los bloques tarda más que él.',
        s: ['mineria', '05']
      },
      {
        q: 'La cadena A tiene 10 bloques de dificultad 1 y la B solo 4 bloques de dificultad 4. ¿Cuál adoptan los nodos?',
        o: ['La A, por ser la más larga',
          'La B, por tener mayor trabajo acumulado',
          'La que se haya publicado primero',
          'Ninguna, hasta que ambas igualen su longitud'],
        a: 1,
        e: 'Los nodos adoptan la cadena válida con mayor trabajo acumulado: W<sub>A</sub> = 10·2<sup>32</sup> frente a W<sub>B</sub> = 16·2<sup>32</sup>. Casi siempre coincide con la más larga, pero no es lo mismo.',
        s: ['cadena', '06']
      },
      {
        q: '¿Qué hace el ajuste de dificultad cada 2016 bloques?',
        o: ['Fija un número máximo de transacciones por bloque',
          'Reduce la recompensa a la mitad',
          'Recalcula la dificultad para volver a ~10 minutos por bloque, con el factor limitado a [¼, 4]',
          'Cambia el algoritmo de hash para frenar a los ASIC'],
        a: 2,
        e: 'Si el periodo fue más rápido de lo previsto, la dificultad sube en la misma proporción; si fue más lento, baja. Así el reloj se autorregula aunque entre o salga hardware. La recompensa se divide entre dos cada 210 000 bloques, que es otro mecanismo.',
        s: ['dificultad', '07']
      },
      {
        q: 'Un atacante con menos del 50 % del cómputo intenta un doble gasto. ¿Cómo cambia su probabilidad de éxito al añadir confirmaciones?',
        o: ['Baja de forma lineal con cada confirmación',
          'No cambia: depende solo de su fracción de cómputo',
          'Sube, porque la red tiene más trabajo que alcanzar',
          'Baja exponencialmente con cada confirmación'],
        a: 3,
        e: 'Desde <var>k</var> bloques atrás alcanza a la red con probabilidad (<var>q</var>/<var>p</var>)<sup><var>k</var></sup> si <var>q</var> &lt; <var>p</var>, así que cada bloque extra multiplica el riesgo por un factor menor que 1. Con <var>q</var> ≥ 50 % el éxito a la larga es seguro: el ataque del 51 %.',
        s: ['ataque', '08']
      },
      {
        q: '¿Qué corrección hace la página sobre el cálculo de Nakamoto (2008) de la carrera del atacante?',
        o: ['Los bloques del atacante siguen una binomial negativa, no una Poisson: tiene más varianza',
          'Los bloques del atacante siguen una Poisson, y la binomial negativa es la aproximación',
          'La carrera no depende de la fracción de cómputo del atacante',
          'El atacante necesita siempre el 51 % para tener alguna probabilidad'],
        a: 0,
        e: 'Poisson y binomial negativa tienen la misma media, pero la segunda tiene más varianza (factor 1/<var>p</var>): las rachas de suerte del atacante son más probables de lo que supone Poisson. Además, Nakamoto cuenta <em>empatar</em> como éxito.',
        s: ['ataque', '08']
      }
    ]
  };
})();
