(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: 'Dominas el encadenamiento: referencia al bloque anterior, integridad y verificación.',
    repasa: 'Repasa las secciones indicadas en cada pregunta fallada y vuelve a intentarlo.',
    preguntas: [
      {
        q: '¿Qué guarda normalmente cada bloque para enlazarse con el bloque anterior?',
        o: ['Las transacciones completas del bloque anterior',
            'El <strong>hash</strong> del bloque anterior',
            'La clave privada de quien creó el bloque anterior',
            'Solo el número de posición del bloque anterior'],
        a: 1,
        e: 'La referencia al bloque anterior es, normalmente, su hash. Funciona como una huella digital que identifica ese contenido exacto.',
        s: ['encadenamiento', '01']
      },
      {
        q: '¿Cómo se llama el primer bloque de una cadena?',
        o: ['Bloque raíz', 'Bloque nonce', 'Bloque génesis', 'Bloque ancla'],
        a: 2,
        e: 'El primer bloque es el <strong>bloque génesis</strong>. A partir de él, cada bloque nuevo se enlaza con el anterior y forma una secuencia ordenada.',
        s: ['encadenamiento', '01']
      },
      {
        q: 'Según el esquema mínimo del apunte, ¿qué es el bloque <em>n</em>?',
        o: ['Datos + hash del bloque n+1 + metadatos',
            'Solo el hash del bloque n−1',
            'Datos + clave pública + firma',
            'Datos + hash del bloque n−1 + metadatos'],
        a: 3,
        e: 'Bloque n = datos + hash del bloque n−1 + metadatos. Se apunta hacia atrás, nunca al bloque siguiente, que aún no existe cuando se crea el bloque n.',
        s: ['estructura', '02']
      },
      {
        q: '¿Qué es el <em>hash propio</em> de un bloque?',
        o: ['Una huella calculada a partir del contenido del bloque',
            'La referencia que lo conecta con su predecesor',
            'El número usado por el consenso',
            'La marca de tiempo de su creación'],
        a: 0,
        e: 'El hash propio se calcula a partir del contenido del bloque. No se confunde con el <em>hash anterior</em>, que es la referencia al predecesor, ni con los metadatos (tiempo, nonce).',
        s: ['estructura', '02']
      },
      {
        q: 'Se modifica un dato dentro del bloque 2. ¿Qué ocurre con su hash?',
        o: ['Permanece igual, porque el hash no depende de los datos',
            'Cambia, y el bloque 3 sigue guardando el hash original del bloque 2',
            'Cambia, y el bloque 3 se actualiza solo',
            'Se elimina y el bloque 2 se descarta'],
        a: 1,
        e: 'Al cambiar el contenido, el hash del bloque 2 cambia. El bloque 3 conserva la referencia al hash original, y esa discrepancia es la que delata la alteración.',
        s: ['integridad', '03']
      },
      {
        q: 'Para ocultar la modificación del bloque 2, ¿qué habría que hacer además de cambiarlo?',
        o: ['Nada más: con cambiar el bloque 2 basta',
            'Actualizar todos los bloques posteriores y superar las reglas de consenso de la red',
            'Cambiar solo el bloque génesis',
            'Borrar el hash del bloque 3 sin más consecuencias'],
        a: 1,
        e: 'La referencia deja de coincidir, así que habría que corregir todos los bloques posteriores y, además, lograr que la red acepte esa versión según el consenso.',
        s: ['integridad', '03']
      },
      {
        q: '¿Cómo se verifica la continuidad de la cadena?',
        o: ['Comparando el tamaño en bytes de cada bloque',
            'Preguntando a un único nodo cuál es la cadena correcta',
            'Recalculando el hash de cada bloque anterior y comparándolo con el campo <em>hash anterior</em> del bloque actual',
            'Revisando únicamente el último bloque'],
        a: 2,
        e: 'Se recorre la cadena: se recalcula el hash del bloque anterior, se compara con la referencia almacenada en el bloque actual y se repite hasta el bloque más reciente.',
        s: ['verificacion', '04']
      },
      {
        q: 'Durante la verificación, un <em>hash anterior</em> no coincide con el hash recalculado del bloque previo. ¿Qué indica?',
        o: ['Que la cadena es válida y está al día',
            'Que el bloque actual es el bloque génesis',
            'Que la cadena fue alterada en ese punto',
            'Que el nonce es demasiado grande'],
        a: 2,
        e: 'El flujo de comprobación termina en «cadena válida o alterada». Una discrepancia señala que el bloque previo (o la referencia) fue modificado.',
        s: ['verificacion', '04']
      },
      {
        q: '¿Cuál es la diferencia entre encadenamiento y consenso?',
        o: ['El encadenamiento enlaza bloques y ayuda a comprobar integridad; el consenso determina qué versión de la cadena reconoce la red',
            'Son sinónimos',
            'El consenso calcula los hashes y el encadenamiento elige la cadena',
            'El encadenamiento decide qué bloque acepta la red'],
        a: 0,
        e: 'El hash enlaza los bloques y permite detectar cambios, pero por sí solo no decide qué bloque acepta la red: esa función corresponde al consenso.',
        s: ['limites', '05']
      },
      {
        q: 'Una cadena tiene los bloques 1 a 5. Se altera un dato del bloque 2 y nadie corrige nada más. Al verificar de izquierda a derecha, ¿dónde se detecta primero la discrepancia?',
        o: ['En el bloque 1, que guarda el hash del bloque 2',
            'En el bloque 5, porque es el más reciente',
            'En ningún punto, porque la cadena sigue enlazada',
            'En el bloque 3, cuyo <em>hash anterior</em> ya no coincide con el hash recalculado del bloque 2'],
        a: 3,
        e: 'El bloque 3 guarda el hash original del bloque 2. Al recalcular el hash del bloque 2 alterado, ambos valores difieren, y la verificación señala la alteración en ese enlace.',
        s: ['verificacion', '04']
      },
      {
        q: 'El bloque génesis no tiene bloque anterior. ¿Qué implica esto para la verificación?',
        o: ['La comprobación del <em>hash anterior</em> empieza a partir del bloque que le sigue',
            'La cadena no puede verificarse',
            'Debe recalcularse el hash de un bloque 0 que está oculto',
            'El génesis se compara con el último bloque'],
        a: 0,
        e: 'El génesis inicia la cadena y no apunta hacia atrás. La verificación enlace por enlace parte del bloque 2, que debe referenciar el hash del génesis.',
        s: ['verificacion', '04']
      },
      {
        q: '¿Qué hace que el encadenamiento por sí solo no baste para garantizar la seguridad final?',
        o: ['Los hashes no pueden recalcularse',
            'También depende de la función hash utilizada, del consenso y de la distribución de la red',
            'Solo importa el tamaño de cada bloque',
            'Las transacciones no se guardan en los bloques'],
        a: 1,
        e: 'El encadenamiento permite detectar cambios, pero la seguridad final depende también del hash empleado, del consenso y de que la red esté distribuida.',
        s: ['integridad', '03']
      },
      {
        q: 'El bloque 7 de una cadena es modificado. ¿Qué bloques dejan de ser consistentes con sus referencias si no se actualizan?',
        o: ['Todos los bloques anteriores, del 1 al 6',
            'Solo el propio bloque 7',
            'El bloque 8 y, en cadena, los posteriores, porque cada hash propio depende del anterior',
            'Ninguno: cada bloque es independiente'],
        a: 2,
        e: 'El hash del bloque 7 cambia, así que el bloque 8 deja de coincidir; al corregirlo cambiaría su propio hash y afectaría al 9, y así sucesivamente. Los bloques previos no se alteran porque apuntan hacia atrás.',
        s: ['integridad', '03']
      }
    ]
  };
})();
