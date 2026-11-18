/* Preguntas del quiz de Compromisos (las lee quiz.js) */
(function () {
  'use strict';

  window.CN_QUIZ = {
  perfecto: "¡Perfecto! Tienes claro cómo funciona un sobre cerrado criptográfico.",
  repasa: "Repasa las secciones que se indican en cada pregunta fallada y vuelve a intentarlo.",
  preguntas: [
    {
      q: "¿Contra qué adversario protege cada propiedad de un compromiso?",
      o: [
        "El ocultamiento protege contra el emisor y la vinculación contra el receptor",
        "Las dos protegen contra el receptor, que quiere leer antes de tiempo",
        "El ocultamiento protege contra el receptor y la vinculación contra el emisor",
        "Las dos protegen contra un tercero que escucha el canal"
      ],
      a: 2,
      e: "El ocultamiento es la promesa a Alice: quien tiene el sobre no puede leerlo. La vinculación es la promesa a Bob: Alice ya no puede cambiar lo que metió. Son dos ataques opuestos.",
      s: [
        "definicion",
        "01"
      ]
    },
    {
      q: "¿Por qué un compromiso no es lo mismo que cifrar el mensaje?",
      o: [
        "Porque cifrar es siempre más lento",
        "Porque el cifrado no promete nada sobre la imposibilidad de abrir el mismo criptograma de dos maneras, y el compromiso vive de eso",
        "Porque el compromiso no necesita ningún valor aleatorio",
        "Porque el cifrado no puede ocultar el mensaje"
      ],
      a: 1,
      e: "Cifrar protege al que guarda el secreto. Comprometerse protege también al otro: nada impide que Alice guarde dos claves y decida al final cuál entrega, y eso con un compromiso no debe poder pasar.",
      s: [
        "definicion",
        "01"
      ]
    },
    {
      q: "En el compromiso de hash <code>c = H(m ‖ r)</code>, ¿de dónde sale la vinculación?",
      o: [
        "De la resistencia a colisión de H",
        "Del valor aleatorio r",
        "De que H es irreversible",
        "Del tamaño de m"
      ],
      a: 0,
      e: "Abrir el mismo <code>c</code> con dos pares distintos <em>es</em> una colisión de H. Si H aguanta, el esquema aguanta. El ocultamiento, en cambio, viene de <code>r</code>.",
      s: [
        "hash",
        "02"
      ]
    },
    {
      q: "Alice se compromete con <code>c = H(m)</code>, sin r, a «águila» o «sol». ¿Qué le cuesta a Bob averiguar el mensaje?",
      o: [
        "Invertir el hash, algo inviable",
        "2<sup>128</sup> hashes",
        "Nada puede hacer; el hash lo oculta",
        "Dos hashes: calcula H de cada opción y compara"
      ],
      a: 3,
      e: "Que H sea irreversible no basta: es determinista, así que el adversario hashea todos los mensajes posibles y compara. Con un espacio pequeño el ataque es instantáneo; <code>r</code> aleatorio y largo es lo que lo vuelve impracticable.",
      s: [
        "hash",
        "02"
      ]
    },
    {
      q: "Según la Proposición 1, ¿qué esquemas de compromiso existen?",
      o: [
        "Los hay perfectamente ocultantes y perfectamente vinculantes a la vez, pero son caros",
        "Ninguno puede ser a la vez perfectamente ocultante y perfectamente vinculante",
        "Solo existen esquemas con las dos propiedades computacionales",
        "Los perfectamente vinculantes no pueden existir"
      ],
      a: 1,
      e: "Si el ocultamiento es perfecto, para cada mensaje <code>m′</code> existe un <code>r′</code> que abre el mismo <code>c</code>, y un emisor sin límite de cómputo lo encuentra. Es un argumento de conteo, no una limitación tecnológica.",
      s: [
        "imposibilidad",
        "03"
      ]
    },
    {
      q: "¿Qué ofrece el compromiso de Pedersen <code>C(m, r) = g<sup>m</sup> · h<sup>r</sup></code>?",
      o: [
        "Ocultamiento computacional y vinculación perfecta",
        "Ocultamiento y vinculación perfectos",
        "Ocultamiento perfecto y vinculación computacional, apoyada en el logaritmo discreto",
        "Solo vinculación, pues no oculta nada"
      ],
      a: 2,
      e: "Como <code>r</code> es uniforme, <code>h<sup>r</sup></code> es un elemento uniforme del grupo y el compromiso no contiene información sobre <code>m</code>. Romper la vinculación equivale a resolver el logaritmo discreto.",
      s: [
        "pedersen",
        "04"
      ]
    },
    {
      q: "¿Qué propiedad algebraica de Pedersen permite verificar que una transacción balancea sin ver los montos?",
      o: [
        "<code>C(a, r₁) · C(b, r₂) = C(a+b, r₁+r₂)</code>, el producto de los sobres es el sobre de la suma",
        "Que se puede obtener <code>C(ab)</code> a partir de <code>C(a)</code> y <code>C(b)</code>",
        "Que el compromiso es reversible con la clave pública",
        "Que el hash del compromiso es lineal"
      ],
      a: 0,
      e: "Es una consecuencia de las leyes de los exponentes: el nodo multiplica compromisos públicos y compara una igualdad, sin ver un solo monto. Lo que no existe es un producto: no se obtiene <code>C(ab)</code>.",
      s: [
        "homomorfismo",
        "05"
      ]
    },
    {
      q: "Una transacción confidencial con montos gigantescos que «dan la vuelta» al grupo pasa la verificación y crea dinero. ¿Qué lo evita?",
      o: [
        "Usar un hash más largo",
        "Aumentar el número de entradas",
        "Quitar el cegado r de los compromisos",
        "Pruebas de rango, que demuestran que cada monto está en un intervalo como [0, 2<sup>64</sup>)"
      ],
      a: 3,
      e: "La igualdad se comprueba módulo <code>q</code>, no sobre los enteros. Las pruebas de rango (Bulletproofs y sucesores) cierran ese agujero; son la parte cara de la transacción: el compromiso ocupa 32 bytes y la prueba, cientos.",
      s: [
        "homomorfismo",
        "05"
      ]
    },
    {
      q: "Si quien eligió el generador <code>h</code> conoce <code>x</code> con <code>h = g<sup>x</sup></code>, ¿qué puede hacer?",
      o: [
        "Leer los compromisos de los demás",
        "Abrir sus propios compromisos con el mensaje que quiera, rompiendo la vinculación",
        "Nada, porque el logaritmo discreto es difícil",
        "Falsificar el hash de cualquier compromiso"
      ],
      a: 1,
      e: "Con la trampa <code>x</code>, la fórmula <code>r′ = r + (m − m′)·x<sup>−1</sup> mod q</code> da una segunda apertura. Rompe la <strong>vinculación</strong>, no el ocultamiento: no puede leer sobres ajenos, pero sí mentir sobre los propios.",
      s: [
        "setup",
        "06"
      ]
    },
    {
      q: "¿Cuál es una defensa válida contra una trampa en los parámetros del setup?",
      o: [
        "Mantener secretos los generadores",
        "Usar siempre el mismo r",
        "Derivar h de un hash de una cadena pública («nothing up my sleeve») o hacer una ceremonia multiparte",
        "Publicar x en la cadena"
      ],
      a: 2,
      e: "Si <code>h</code> sale de un hash de algo público, nadie conoce su logaritmo porque nadie eligió el resultado. Cuando los parámetros son demasiado complejos, una ceremonia multiparte garantiza que la trampa solo existe si <em>todos</em> los participantes conspiraron.",
      s: [
        "setup",
        "06"
      ]
    },
    {
      q: "Frente a un árbol de Merkle, ¿qué ventaja tiene KZG como compromiso a una lista?",
      o: [
        "No necesita ningún setup de confianza",
        "Sus pruebas crecen más despacio que el logaritmo, pero no son constantes",
        "Es resistente a computadores cuánticos",
        "La prueba de que un elemento está dentro tiene tamaño constante (48 bytes) sin importar el tamaño de la lista"
      ],
      a: 3,
      e: "La prueba KZG es el compromiso al cociente <code>(f(X) − y)/(X − z)</code>, un solo elemento del grupo. El precio es la ceremonia de confianza y los emparejamientos; Merkle no pide confianza y paga con pruebas logarítmicas.",
      s: [
        "vectores",
        "07"
      ]
    },
    {
      q: "En una subasta a sobre cerrado, ¿qué consigue el compromiso cuando un postor intenta cambiar su puja al revelarla?",
      o: [
        "Hace que mentir sea detectable: el hash no cuadra y lo descalifica",
        "Impide que el postor mienta",
        "Oculta la puja ganadora para siempre",
        "Cobra una comisión al postor tramposo"
      ],
      a: 0,
      e: "Todos publican <code>c = H(puja ‖ r)</code> en la fase 1 y abren en la fase 2. El compromiso no impide mentir; hace que cualquier cifra distinta de la comprometida sea inválida. Para que no valga la pena abstenerse de abrir se suele exigir un depósito.",
      s: [
        "aplicaciones",
        "08"
      ]
    }
  ]
};
})();
