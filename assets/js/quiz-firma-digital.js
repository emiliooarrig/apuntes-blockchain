/* Quiz de "Propagación de bloques y Red P2P" (temas/firma-digital.html).
   Datos para assets/js/quiz.js, que debe cargarse después. */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Tienes claro cómo viaja un bloque por la red y qué hace falta para que una blockchain sea realmente distribuida.',
    repasa: 'Conviene repasar el apunte desde el principio: empieza por la red P2P y la propagación, y después vuelve a intentarlo.',
    preguntas: [
      {
        q: '¿Por qué una cadena de bloques artesanal puede funcionar sin red?',
        o: ['Porque usa funciones hash más seguras',
          'Porque una sola entidad controla la creación y el almacenamiento de todos los bloques',
          'Porque no necesita encadenar los bloques',
          'Porque cada bloque se valida con una firma de anillo'],
        a: 1,
        e: 'Si una única entidad crea y guarda todos los bloques, no hay nadie más con quien compartirlos. En una blockchain distribuida hay múltiples participantes y los bloques deben compartirse entre los nodos.',
        s: ['p2p', '01']
      },
      {
        q: '¿Qué permite la red P2P dentro de una blockchain distribuida?',
        o: ['Encontrar la solución del Proof of Work más rápido',
          'Cifrar el contenido de los bloques',
          'Eliminar la necesidad de reglas de consenso',
          'Que los nodos conozcan los nuevos bloques producidos en el sistema'],
        a: 3,
        e: 'La red P2P sirve para propagar bloques: gracias a ella los distintos nodos se enteran de los bloques nuevos. No acelera la minería ni sustituye al consenso.',
        s: ['p2p', '01']
      },
      {
        q: 'Cuando se produce un nuevo bloque, ¿qué debe ocurrir con esa información?',
        o: ['Difundirse entre los participantes de la red',
          'Guardarse solo en el nodo que lo produjo',
          'Enviarse a un único servidor central que la reparte',
          'Mantenerse en secreto hasta que haya dos bloques'],
        a: 0,
        e: 'El bloque se difunde entre los participantes para que cada nodo pueda actualizar su visión de la cadena. No depende de un servidor único, sino que se distribuye entre los nodos.',
        s: ['propagacion', '02']
      },
      {
        q: 'En el ejemplo del apunte, el nodo A conoce un bloque, lo comunica a B y C, y estos a D y E. ¿Qué característica de una red P2P ilustra?',
        o: ['La existencia de un servidor central que coordina todo',
          'La resolución de conflictos entre dos bloques',
          'La propagación distribuida, sin depender de un único servidor',
          'La obtención de una solución de Proof of Work'],
        a: 2,
        e: 'La información pasa de nodo en nodo sin pasar por un punto central. Eso es la propagación distribuida, la diferencia clave frente a un sistema centralizado.',
        s: ['propagacion', '02']
      },
      {
        q: '¿Cuál es la relación entre el Proof of Work y la red P2P?',
        o: ['El Proof of Work reemplaza a la red P2P',
          'El Proof of Work encuentra una solución válida para el bloque y la red P2P lo comunica al resto',
          'La red P2P resuelve el Proof of Work entre todos los nodos',
          'Son lo mismo: minar es propagar'],
        a: 1,
        e: 'Cumplen funciones distintas pero relacionadas: Proof of Work → bloque válido → propagación P2P → otros nodos conocen el bloque.',
        s: ['mineria-red', '03']
      },
      {
        q: 'Un minero encuentra una solución válida de Proof of Work. ¿Por qué no basta con que solo él conozca el bloque?',
        o: ['Porque los demás nodos deben conocerlo para actualizar su visión de la cadena',
          'Porque el bloque caduca si no se comparte en un segundo',
          'Porque el Proof of Work no es válido hasta que se firma',
          'Porque el minero no puede guardar bloques propios'],
        a: 0,
        e: 'Una blockchain distribuida tiene múltiples participantes. Si el bloque no se propaga, el resto de los nodos nunca se entera y no puede actualizar su copia de la cadena.',
        s: ['mineria-red', '03']
      },
      {
        q: '¿Qué puede ocurrir en una red con muchos nodos que producen bloques?',
        o: ['Que sea imposible que dos nodos produzcan bloques a la vez',
          'Que todos los nodos produzcan siempre el mismo bloque',
          'Que la red P2P deje de ser necesaria',
          'Que dos participantes produzcan bloques diferentes aproximadamente al mismo tiempo'],
        a: 3,
        e: 'Es perfectamente posible. Entonces existen temporalmente versiones diferentes de la cadena, y por eso hace falta algo más que propagar bloques.',
        s: ['conflictos', '04']
      },
      {
        q: 'El nodo A recibe primero el bloque X y otro grupo de nodos recibe primero un bloque Y distinto. ¿Qué necesita el sistema?',
        o: ['Borrar ambos bloques y empezar de cero',
          'Pedirle al minero más rápido que repita su trabajo',
          'Una regla de resolución de conflictos que determine cómo continúa la cadena',
          'Una segunda red P2P independiente'],
        a: 2,
        e: 'Aparece un conflicto entre versiones de la cadena. Una blockchain real necesita no solo red P2P, sino también una regla de resolución de conflictos que decida cómo debe continuar.',
        s: ['conflictos', '04']
      },
      {
        q: 'Según el apunte, ¿cuál de estos elementos NO es uno de los tres que una blockchain real añade al pipeline artesanal?',
        o: ['Un mecanismo de consenso para múltiples nodos',
          'Una red P2P para propagar los bloques',
          'Un servidor central que almacene todos los bloques',
          'Una regla de resolución de conflictos'],
        a: 2,
        e: 'Los tres elementos adicionales son consenso, red P2P y resolución de conflictos. Un servidor central iría en contra de la idea de distribución.',
        s: ['blockchain-real', '05']
      },
      {
        q: '¿Qué contiene ya el pipeline artesanal, antes de añadir red, consenso y resolución de conflictos?',
        o: ['Solo funciones hash',
          'Funciones hash, firma digital, encadenamiento y sellado de tiempo',
          'Únicamente encadenamiento y Proof of Work',
          'Red P2P y sellado de tiempo'],
        a: 1,
        e: 'El pipeline artesanal reúne hash, firma digital, encadenamiento y sellado de tiempo. Para volverse una blockchain real le faltan consenso, red P2P y resolución de conflictos.',
        s: ['blockchain-real', '05']
      },
      {
        q: 'Ordena el proceso completo, de principio a fin.',
        o: ['Se obtiene un Proof of Work válido → se produce el bloque → se propaga por la red P2P → otros nodos lo conocen',
          'Se produce el bloque → otros nodos lo conocen → se propaga por la red P2P → se obtiene un Proof of Work válido',
          'Se propaga por la red P2P → se obtiene un Proof of Work válido → se produce el bloque → otros nodos lo conocen',
          'Otros nodos lo conocen → se obtiene un Proof of Work válido → se produce el bloque → se propaga por la red P2P'],
        a: 0,
        e: 'Primero se consigue la solución de Proof of Work, con ella se produce el bloque válido, luego se propaga por la red P2P y finalmente otros nodos lo conocen.',
        s: ['ejercicios', '07']
      }
    ]
  };
})();
