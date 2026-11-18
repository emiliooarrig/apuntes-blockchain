/* =========================================================
   ChainNotes — Apunte: Funciones hash
   Preguntas del quiz (las renderiza assets/js/quiz.js).
   ========================================================= */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Distingues las tres resistencias, sabes por qué 256 bits valen 128 y entiendes qué se rompe cuando una propiedad falla.',
    repasa: 'Te conviene repasar desde la sección 02 (las tres resistencias): es la idea en la que se apoyan el cumpleaños, Merkle, los compromisos y la firma.',
    preguntas: [
      {
        q: 'Cambias un solo bit de la entrada de SHA-256. ¿Qué esperas ver en el digest?',
        o: [
          'Que cambie sólo un bit, porque la entrada cambió muy poco.',
          'Que cambie aproximadamente la mitad de los bits, sin patrón predecible.',
          'Que cambien los últimos bits, que son los que dependen del final del mensaje.',
          'Que no cambie nada, porque el hash tiene longitud fija.'
        ],
        a: 1,
        e: 'Es el <em>efecto avalancha</em>: cada bit de salida se voltea con probabilidad ≈ ½, así que la distancia de Hamming esperada es <var>n</var>/2. Una función hash es discontinua a propósito: no existe el “casi igual”.',
        s: ['fundamentos', '01']
      },
      {
        q: 'Si SHA-256 tiene sólo 2<sup>256</sup> salidas y las entradas son infinitas, ¿qué se concluye?',
        o: [
          'Que SHA-256 no puede ser determinista para entradas muy largas.',
          'Que cada mensaje tiene un hash único, siempre que no se repita.',
          'Que existen infinitos pares de mensajes distintos con el mismo hash; sólo son inencontrables.',
          'Que basta con probar 2<sup>256</sup> mensajes para garantizar una colisión.'
        ],
        a: 2,
        e: 'Es el principio del palomar: hay más entradas que salidas, así que las colisiones existen. La criptografía no las elimina; las vuelve computacionalmente imposibles de hallar.',
        s: ['fundamentos', '01']
      },
      {
        q: 'En el medidor de avalancha, CRC32 alcanza cerca del 50 % de bits cambiados. ¿Por qué aun así no es una buena función hash criptográfica?',
        o: [
          'Porque produce un solo patrón de diferencia (σ = 0): voltear ese bit cambia siempre los mismos bits de salida, sin importar el mensaje.',
          'Porque su salida es demasiado larga y se vuelve lenta.',
          'Porque no es determinista y da resultados distintos en cada ejecución.',
          'Porque el 50 % es un valor demasiado alto: lo ideal sería cercano al 25 %.'
        ],
        a: 0,
        e: 'El promedio engaña; los patrones no. Una función lineal como CRC32 produce siempre la misma diferencia, lo que es una ecuación que el atacante puede resolver. SHA-256 da patrones distintos en cada prueba y una σ cercana a √<var>n</var>/2.',
        s: ['fundamentos', '01']
      },
      {
        q: 'Con un digest de <var>n</var> bits, ¿cuál es el costo ideal de cada ataque?',
        o: [
          'Preimagen 2<sup>n/2</sup>, segunda preimagen 2<sup>n/2</sup>, colisión 2<sup>n/2</sup>.',
          'Preimagen 2<sup>n</sup>, segunda preimagen 2<sup>n/2</sup>, colisión 2<sup>n</sup>.',
          'Preimagen 2<sup>n/2</sup>, segunda preimagen 2<sup>n</sup>, colisión 2<sup>n</sup>.',
          'Preimagen 2<sup>n</sup>, segunda preimagen 2<sup>n</sup>, colisión 2<sup>n/2</sup>.'
        ],
        a: 3,
        e: 'En la colisión el atacante escoge <em>ambos</em> mensajes, lo que habilita el ataque del cumpleaños (≈ 2<sup>n/2</sup>). En preimagen y segunda preimagen el objetivo está fijado de antemano, por eso cuestan 2<sup>n</sup>.',
        s: ['resistencias', '02']
      },
      {
        q: 'Se dice que MD5 y SHA-1 están “rotas”. ¿En qué sentido, exactamente?',
        o: [
          'Cualquiera puede invertirlas y recuperar el mensaje original a partir del hash.',
          'Están rotas en resistencia a colisión, no en preimagen: siguen siendo irreversibles, pero ya no garantizan que dos documentos distintos tengan huellas distintas.',
          'Están rotas en preimagen, pero su resistencia a colisión sigue intacta.',
          'Producen digests de longitud variable, lo que las vuelve inservibles.'
        ],
        a: 1,
        e: 'Por eso una contraseña vieja en SHA-1 no se recupera de golpe, pero una firma sobre SHA-1 no vale nada: la firma depende de la resistencia a colisión.',
        s: ['resistencias', '02']
      },
      {
        q: 'Según la Proposición 1, ¿qué relación hay entre la resistencia a colisiones y la resistencia a segunda preimagen?',
        o: [
          'Si H es resistente a colisiones, entonces es resistente a segunda preimagen; el recíproco no se garantiza.',
          'Si H es resistente a segunda preimagen, entonces es resistente a colisiones.',
          'Son equivalentes: una implica la otra y viceversa.',
          'No hay ninguna relación: son propiedades totalmente independientes.'
        ],
        a: 0,
        e: 'Un algoritmo que halle segundas preimágenes produce colisiones de inmediato (contrapuesta). La Proposición 2 muestra que el recíproco falla, así que las tres propiedades deben pedirse por separado y la única implicación gratuita es ésta.',
        s: ['resistencias', '02']
      },
      {
        q: 'Un servidor autentica con <var>t</var> = H(<var>k</var> ‖ <var>m</var>) usando SHA-256. ¿Qué puede hacer un atacante que ve <var>m</var> y <var>t</var> pero no conoce <var>k</var>?',
        o: [
          'Nada: sin la clave es imposible producir una etiqueta válida.',
          'Recuperar <var>k</var> probando todas las claves posibles en tiempo lineal.',
          'Calcular una etiqueta válida de <var>m</var> ‖ relleno ‖ <var>z</var>, reanudando SHA-256 desde el estado que <var>t</var> revela.',
          'Obtener <var>m</var> invirtiendo <var>t</var>, porque H(<var>k</var> ‖ <var>m</var>) es reversible.'
        ],
        a: 2,
        e: 'Es el ataque de extensión de longitud, consecuencia de la construcción de Damgård–Merkle: el digest es el estado interno final. HMAC lo evita con su doble anidamiento, y SHA-3 lo evita con la construcción de esponja.',
        s: ['construccion', '03']
      },
      {
        q: 'Un digest de 128 bits, ¿cuántos bits de seguridad ofrece frente a colisión?',
        o: [
          '128 bits, porque la seguridad es igual a la longitud de la salida.',
          '256 bits, porque el atacante debe romper dos mensajes.',
          '32 bits, porque se divide entre el número de bloques.',
          'Sólo 64 bits, por el ataque del cumpleaños; y 2<sup>64</sup> es alcanzable.'
        ],
        a: 3,
        e: 'Con <var>k</var> ≈ 1.1774·2<sup>n/2</sup> mensajes ya hay probabilidad ½ de colisión: la raíz cuadrada es el precio de que el atacante elija ambos mensajes. Es la razón por la que SHA-256 vale 128 bits ante colisión, y la historia de MD5.',
        s: ['cumpleanos', '04']
      },
      {
        q: '¿Qué protege la sal al almacenar contraseñas?',
        o: [
          'Hace que cada hash individual tarde más en calcularse.',
          'Impide reutilizar una misma tabla precalculada contra todos los usuarios: el atacante debe rehacer el trabajo por usuario.',
          'Vuelve irreversible un hash que de otro modo se podría invertir.',
          'Evita que dos usuarios puedan elegir la misma contraseña.'
        ],
        a: 1,
        e: 'La sal (aleatoria y distinta por usuario) rompe la amortización de la tabla arcoíris: el costo pasa de O(|D| + <var>u</var>) a O(<var>u</var>·|D|). Lo que encarece cada intento es el <em>factor de trabajo</em> (bcrypt, scrypt, Argon2), no la sal.',
        s: ['contrasenas', '06']
      },
      {
        q: 'Un árbol de Merkle tiene 1 048 576 transacciones. ¿Cuántos hashes hacen falta, aproximadamente, en la prueba de inclusión de una de ellas?',
        o: [
          '1 048 576, uno por cada transacción del bloque.',
          'Alrededor de 1 024, la raíz cuadrada del número de hojas.',
          '20 hashes (640 bytes): la profundidad del árbol, ⌈log₂ <var>m</var>⌉.',
          'Sólo 1: la raíz de Merkle basta para verificar.'
        ],
        a: 2,
        e: 'La prueba consiste en los hashes <em>hermanos</em> del camino de la hoja a la raíz, uno por nivel. El ahorro es logarítmico, y por eso es posible la verificación simplificada de pagos sin descargar todo el bloque.',
        s: ['merkle', '07']
      },
      {
        q: 'En un compromiso <var>c</var> = H(<var>m</var> ‖ <var>r</var>), ¿para qué sirve el valor aleatorio <var>r</var>?',
        o: [
          'Para conservar el ocultamiento cuando el espacio de mensajes es pequeño: sin <var>r</var>, el adversario hashea todas las opciones y compara.',
          'Para acortar el digest y hacer más barata la verificación.',
          'Para garantizar la vinculación: sin <var>r</var>, el emisor podría abrir el compromiso de dos formas.',
          'Para que el verificador no tenga que recomputar el hash al abrirlo.'
        ],
        a: 0,
        e: 'Con sólo dos opciones (águila o sol) a Bob le bastan dos hashes para descubrir la elección de Alice. La vinculación, en cambio, se apoya en la resistencia a colisión de H, no en <var>r</var>.',
        s: ['blockchain', '08']
      },
      {
        q: 'En la prueba de trabajo, ¿qué ocurre si alteras el contenido de un bloque ya minado de la cadena?',
        o: [
          'Nada: el nonce sigue siendo válido porque no se modificó.',
          'Sólo ese bloque queda inválido; los demás no dependen de él.',
          'Los bloques anteriores a él quedan inválidos, no los posteriores.',
          'Ese bloque y todos los posteriores quedan inválidos, y hay que reminarlos todos para rehacer la cadena.'
        ],
        a: 3,
        e: 'Cada bloque incluye el hash del anterior, así que el cambio se propaga en cascada. Ése es el costo de reescribir la historia. Además, cada cero hexadecimal adicional de dificultad multiplica por 16 el trabajo esperado.',
        s: ['blockchain', '08']
      }
    ]
  };
})();
