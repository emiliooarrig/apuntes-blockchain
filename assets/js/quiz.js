/* ==========================================================
   ChainNotes · motor de quiz compartido
   Lee las preguntas de window.CN_QUIZ (definido en quiz-<tema>.js,
   que debe cargarse ANTES que este archivo) y pinta el quiz en
   #quizList. Todo es de opción múltiple y se califica solo.

   Formato de window.CN_QUIZ:
   {
     perfecto: 'mensaje si acierta todo',
     repasa:   'mensaje si falla mucho (sugiere por dónde empezar)',
     preguntas: [
       { q: 'texto', o: ['A','B','C','D'], a: 1 (índice correcto),
         e: 'explicación', s: ['id-seccion', '02'] }
     ]
   }
   Vanilla JS, sin dependencias.
   ========================================================== */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var list = $('quizList');
  var DATA = window.CN_QUIZ;
  if (!list || !DATA || !DATA.preguntas || !DATA.preguntas.length) return;

  var Q = DATA.preguntas, LETTERS = 'ABCDEF', answers = [];

  function render() {
    var html = '';
    Q.forEach(function (item, qi) {
      html += '<fieldset class="clay-card quiz__q" id="qz' + qi + '"><legend><span class="quiz__n">' + (qi + 1) +
        '</span><span>' + item.q + '</span></legend><div class="quiz__opts">';
      item.o.forEach(function (txt, oi) {
        html += '<button type="button" class="quiz__opt" data-q="' + qi + '" data-o="' + oi + '">' +
          '<span class="quiz__letter">' + LETTERS[oi] + '</span><span>' + txt + '</span></button>';
      });
      html += '</div><p class="quiz__fb" id="qzFb' + qi + '" aria-live="polite" hidden></p></fieldset>';
    });
    list.innerHTML = html;
    answers = Q.map(function () { return -1; });
    score();
  }

  function answer(qi, oi) {
    if (answers[qi] !== -1) return;
    answers[qi] = oi;
    var item = Q[qi], right = oi === item.a, box = $('qz' + qi);
    Array.prototype.forEach.call(box.querySelectorAll('.quiz__opt'), function (b) {
      var o = +b.getAttribute('data-o');
      b.disabled = true;
      if (o === item.a) b.classList.add('is-right');
      else if (o === oi) b.classList.add('is-wrong');
    });
    box.classList.add(right ? 'is-right' : 'is-wrong');
    var fb = $('qzFb' + qi);
    fb.innerHTML = (right ? '<strong class="ok">¡Correcto!</strong> ' : '<strong class="bad">No exactamente.</strong> ') +
      item.e + (item.s ? ' <a href="#' + item.s[0] + '">Repasar la sección ' + item.s[1] + '</a>' : '');
    fb.hidden = false;
    score();
  }

  function score() {
    var done = 0, right = 0, total = Q.length;
    answers.forEach(function (a, i) { if (a !== -1) { done++; if (a === Q[i].a) right++; } });
    $('quizDone').textContent = done + ' / ' + total;
    $('quizRight').textContent = String(right);
    $('quizBar').style.width = (100 * done / total) + '%';
    $('quizTag').textContent = done === 0 ? 'sin empezar' : (done < total ? 'en curso' : 'terminado');
    var msg = $('quizMsg');
    if (done < total) {
      $('quizGrade').textContent = done ? Math.round(100 * right / done) + ' %' : '—';
      msg.textContent = 'Responde todas las preguntas para ver tu resultado final.';
      return;
    }
    $('quizGrade').textContent = (Math.round(100 * right / total) / 10).toFixed(1) + ' / 10';
    var ratio = right / total;
    if (right === total) msg.textContent = DATA.perfecto || '¡Perfecto! Dominas los conceptos de este apunte.';
    else if (ratio >= 0.75) msg.textContent = 'Muy bien. Revisa la explicación de las preguntas que fallaste para afinar los detalles.';
    else if (ratio >= 0.5) msg.textContent = 'Vas por buen camino. Cada pregunta fallada indica qué sección repasar.';
    else msg.textContent = DATA.repasa || 'Te conviene repasar el apunte desde el principio y volver a intentarlo.';
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.quiz__opt');
    if (!btn || btn.disabled) return;
    answer(+btn.getAttribute('data-q'), +btn.getAttribute('data-o'));
  });
  $('quizReset').addEventListener('click', function () {
    render();
    $('qz0').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });

  render();
})();
