/* ==========================================================
   ChainNotes · datos del quiz de la página "Time stamping"
   (temas/timestamping.html). Lo consume assets/js/quiz.js, que
   debe cargarse DESPUÉS de este archivo.
   ========================================================== */
(function () {
  'use strict';

  window.CN_QUIZ = {
    perfecto: '¡Perfecto! Sabes qué demuestra un sello de tiempo, por qué encadenarlos impide antedatar y cómo Bitcoin funciona como notario sin dueño.',
    repasa: 'Te conviene repasar desde la sección 02 (sellar la huella) y la 04 (sellos encadenados): son la base de todo lo demás.',
    preguntas: [
      {
        q: '¿Por qué la fecha de «modificado» que muestra tu computadora no sirve para demostrar cuándo existía un archivo?',
        o: [
          'Porque sólo guarda el año, no el día.',
          'Porque la escribe tu propia computadora y se puede cambiar en segundos.',
          'Porque se borra cada vez que copias el archivo a una USB.',
          'Porque sólo funciona con documentos de texto.'
        ],
        a: 1,
        e: 'Esa fecha la controla quien tiene el archivo. Un sello de tiempo, en cambio, depende de algo que el dueño no puede alterar después.',
        s: ['problema', '01']
      },
      {
        q: 'Un documento tiene un sello de tiempo válido del 10 de marzo. ¿Qué demuestra exactamente?',
        o: [
          'Que lo escribió la persona que lo selló.',
          'Que su contenido es verdadero.',
          'Que fue creado exactamente el 10 de marzo.',
          'Que ya existía, tal como está, a más tardar el 10 de marzo.'
        ],
        a: 3,
        e: 'Un sello sólo habla de <em>cuándo</em>, y como límite superior: pudo existir desde antes. No dice nada de autoría ni de veracidad.',
        s: ['problema', '01']
      },
      {
        q: '¿Por qué se sella la huella (hash) del documento y no el documento completo?',
        o: [
          'Porque así el contenido se mantiene privado y el sello mide siempre lo mismo, sin importar el tamaño del archivo.',
          'Porque la huella es más fácil de leer para las personas.',
          'Porque las autoridades de sellado no aceptan archivos de más de 1 MB.',
          'Porque la huella guarda la fecha dentro.'
        ],
        a: 0,
        e: 'La huella no revela el contenido y siempre tiene 256 bits. Además, cualquier cambio al documento produce una huella distinta, así que sigue representándolo fielmente.',
        s: ['huella', '02']
      },
      {
        q: 'Sellaste tu tesis hace un año. Hoy le corriges un acento y vuelves a calcular la huella. ¿Qué pasa?',
        o: [
          'La huella es casi igual; sólo cambia el último carácter.',
          'La huella es idéntica, porque el contenido es prácticamente el mismo.',
          'La huella es totalmente distinta y ya no coincide con la sellada: el sello no protege la versión corregida.',
          'El sello se actualiza solo con la nueva versión.'
        ],
        a: 2,
        e: 'Cualquier cambio, por mínimo que sea, produce una huella completamente distinta. Por eso hay que guardar el archivo original intacto. Pruébalo en el laboratorio 1.',
        s: ['huella', '02']
      },
      {
        q: 'Con una autoridad de sellado de tiempo (TSA), ¿qué es exactamente el sello?',
        o: [
          'Una copia del documento guardada en sus servidores.',
          'La firma digital de la autoridad sobre «huella del documento + fecha y hora».',
          'Un número de folio escrito en un libro físico.',
          'La huella del documento sin nada más.'
        ],
        a: 1,
        e: 'La autoridad recibe sólo la huella, le añade la hora de su reloj y firma el conjunto. Cualquiera puede verificar esa firma con la llave pública de la autoridad.',
        s: ['autoridad', '03']
      },
      {
        q: '¿Cuál es el principal punto débil de depender de una sola autoridad de sellado?',
        o: [
          'Que es muy lenta: tarda días en sellar.',
          'Que no puede sellar archivos de imagen.',
          'Que obliga a revelar el contenido del documento.',
          'Que hay que confiar en ella: si la sobornan o le roban la llave, puede emitir sellos con fechas falsas.'
        ],
        a: 3,
        e: 'El esquema es tan confiable como la autoridad. Eso motivó buscar formas de sellar sin depender ciegamente de una sola entidad.',
        s: ['autoridad', '03']
      },
      {
        q: 'En los sellos encadenados de Haber y Stornetta, ¿qué incluye cada sello nuevo?',
        o: [
          'Una copia completa de todos los documentos anteriores.',
          'La huella del sello anterior, además de la huella del documento y la hora.',
          'Sólo la hora, para ahorrar espacio.',
          'El nombre de la persona que pidió el sello.'
        ],
        a: 1,
        e: 'Cada eslabón «abraza» al anterior: sello nuevo = huella(sello anterior + huella del documento + hora). Así todos quedan conectados.',
        s: ['encadenar', '04']
      },
      {
        q: 'En una libreta de 10 sellos encadenados, alguien altera el documento del sello 4. ¿Qué sellos dejan de cuadrar?',
        o: [
          'Sólo el sello 4.',
          'Los sellos 1 a 4.',
          'El sello 4 y todos los posteriores, del 5 al 10.',
          'Ninguno, porque los sellos ya estaban guardados.'
        ],
        a: 2,
        e: 'Cambiar el sello 4 cambia el valor que usa el 5, que cambia el 6, y así hasta el final. Los anteriores no se ven afectados. Compruébalo en el laboratorio 2.',
        s: ['encadenar', '04']
      },
      {
        q: 'Quieres sellar un millón de documentos de una sola vez con un árbol de Merkle. ¿Qué se sella?',
        o: [
          'Sólo la raíz del árbol; cada documento se demuestra después con unas 20 huellas «hermanas».',
          'Un millón de huellas, una por documento.',
          'La mitad de las huellas, elegidas al azar.',
          'El documento más grande, que representa a los demás.'
        ],
        a: 0,
        e: 'Las huellas se juntan de dos en dos hasta quedar una sola, la raíz. Para un millón de documentos el camino a la raíz tiene unos 20 pasos, porque 2<sup>20</sup> ≈ 1 millón.',
        s: ['arbol', '05']
      },
      {
        q: '¿Por qué es tan difícil antedatar un documento sellado en Bitcoin?',
        o: [
          'Porque una empresa revisa cada sello a mano.',
          'Porque Bitcoin guarda el documento completo cifrado.',
          'Porque las huellas en Bitcoin caducan después de un año.',
          'Porque habría que meter la huella en un bloque viejo y rehacer la prueba de trabajo de ese bloque y de todos los posteriores, más rápido que toda la red.'
        ],
        a: 3,
        e: 'No hay llave que robar ni autoridad que sobornar: la seguridad del sello es la misma que protege los pagos de Bitcoin.',
        s: ['bitcoin', '06']
      },
      {
        q: 'Dos personas sellan la misma idea en Bitcoin con diez segundos de diferencia. ¿Puede el sello decidir quién fue primero?',
        o: [
          'No, porque Bitcoin no guarda horas, sólo números de bloque.',
          'Sí: cada bloque registra la hora exacta al segundo.',
          'Sí: gana quien pagó más comisión.',
          'No con seguridad: la hora de un bloque tiene un margen de minutos u horas.'
        ],
        a: 3,
        e: 'La hora de un bloque debe ser posterior a la mediana de los 11 anteriores y no adelantarse más de 2 horas. Es precisa en días, no en segundos.',
        s: ['reloj', '07']
      },
      {
        q: 'Quieres demostrar que una foto se tomó <em>después</em> del 1 de junio, no antes. ¿Qué haces?',
        o: [
          'Sellarla dos veces el mismo día.',
          'Cambiar la fecha del archivo al 1 de junio.',
          'Incluir en la foto algo imposible de conocer antes de esa fecha, como el periódico del día o la huella del último bloque de Bitcoin.',
          'No se puede: un sello sólo demuestra fechas anteriores.'
        ],
        a: 2,
        e: 'Un dato impredecible da el límite inferior y el sello da el superior: la foto nació entre ambos. El primer bloque de Bitcoin hizo esto con un titular de periódico.',
        s: ['ventana', '08']
      }
    ]
  };
})();
