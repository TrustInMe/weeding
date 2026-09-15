// ============================================================
// Свадебный сайт — интерактив
// 1) RSVP-форма: отправка на email (список адресов — в config.js)
// 2) Защита от повторной отправки (ключ в sessionStorage) + заглушка
// 3) Кнопка «наверх»
// 4) «Змейка» таймлайна
// 5) Появление секций, лепестки на обложке
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  var scriptUrl = (typeof CONFIG !== 'undefined' && CONFIG.rsvpScriptUrl || '').trim();

  // ---------- 1. RSVP ----------
  var form = document.getElementById('rsvpForm');
  var hint = document.getElementById('rsvpHint');
  var done = document.getElementById('rsvpDone');
  var SENT_KEY = 'rsvp_sent';

  function showDone() {
    form.hidden = true;
    done.hidden = false;
    hint.hidden = true;
  }
  function showForm() {
    form.hidden = false;
    done.hidden = true;
  }

  // Уже отвечали (в этой или прошлой сессии) — только заглушка, формы нет
  try {
    if (localStorage.getItem(SENT_KEY) === '1' || sessionStorage.getItem(SENT_KEY) === '1') showDone();
    else showForm();
  } catch (e) { showForm(); }

  function showHint(text) {
    hint.textContent = text;
    hint.hidden = false;
  }

  // Предпочтения по алкоголю — только тем, кто придёт
  var drinksBox = document.getElementById('rsvpDrinks');
  form.addEventListener('change', function (e) {
    if (e.target.name !== 'attendance') return;
    var coming = e.target.value !== 'Не смогу';
    drinksBox.hidden = !coming;
    if (!coming) {
      var d = form.querySelector('input[name="drinks"]:checked');
      if (d) d.checked = false;
    }
  });

  function sendToEmail(name, answer) {
    // Канал: Google Apps Script (инструкция и код — в apps-script/Code.gs)
    if (!scriptUrl) return Promise.resolve(false); // URL не задан — письмо не шлём
    // form-encoded POST = «простой» запрос: без CORS-предпроверки
    var drinks = form.querySelector('input[name="drinks"]:checked');
    var drinksText = drinks ? drinks.value : '';
    var params = new URLSearchParams({
      name: name,
      answer: answer + (drinksText ? ' · напитки: ' + drinksText : ''),
      date: new Date().toLocaleString('ru-RU'),
    });
    return fetch(scriptUrl, {
      method: 'POST',
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      redirect: 'follow',
    }).then(function (res) {
      if (res.ok) { sendToEmail.lastError = ''; return true; }
      console.warn('RSVP HTTP ' + res.status);
      sendToEmail.lastError = 'HTTP ' + res.status;
      return false;
    }).catch(function (err) {
      console.warn('RSVP error:', err);
      sendToEmail.lastError = String(err);
      return false;
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.guest_name.value.trim();
    var choice = form.querySelector('input[name="attendance"]:checked');
    if (!name || !choice) {
      showHint('Пожалуйста, укажите имя и выберите ответ.');
      return;
    }
    var submitBtn = form.querySelector('.rsvp__submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    sendToEmail(name, choice.value).then(function (ok) {
      // ответ сохраняем локально в любом случае (резерв)
      try {
        localStorage.setItem('rsvp', JSON.stringify({
          name: name, attendance: choice.value, date: new Date().toISOString(), emailed: ok,
        }));
      } catch (err) {}

      if (ok) {
        try { localStorage.setItem(SENT_KEY, '1'); sessionStorage.setItem(SENT_KEY, '1'); } catch (err) {}
        showDone(); // заглушка «успешно отправлено»
      } else {
        // письмо не ушло — гостя не блокируем, но честно предупреждаем
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить ответ';
        var errInfo = sendToEmail.lastError ? ' [' + sendToEmail.lastError + ']' : '';
        showHint((choice.value === 'Буду'
          ? 'Спасибо, ' + name + '! Ждём вас на свадьбе!'
          : 'Спасибо, ' + name + '. Нам жаль, что вы не сможете прийти!') +
          ' (ответ сохранён, но письмо не удалось отправить — попробуйте ещё раз позже' + errInfo + ')');
      }
    });
  });

  // ---------- 2. Кнопка «наверх» ----------
  var toTop = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('to-top--visible', window.scrollY > window.innerHeight * 0.7);
  }, { passive: true });
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- 3. «Змейка» таймлайна программы дня ----------
  var schedule = document.querySelector('.schedule');
  if (schedule && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var progress = document.createElement('div');
    progress.className = 'schedule__progress';
    progress.setAttribute('aria-hidden', 'true');
    schedule.appendChild(progress);
    var items = Array.prototype.slice.call(schedule.querySelectorAll('.schedule__item'));

    var ticking = false;
    function updateTimeline() {
      ticking = false;
      var rect = schedule.getBoundingClientRect();
      var anchor = window.innerHeight * 0.65;
      var total = rect.height;
      var passed = Math.min(Math.max(anchor - rect.top, 0), total);
      progress.style.transform = 'scaleY(' + (passed / total) + ')';
      items.forEach(function (item) {
        var top = item.getBoundingClientRect().top - rect.top;
        item.classList.toggle('is-reached', top + 12 <= passed);
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); }
    }, { passive: true });
    updateTimeline();
  }

  // ---------- 4. Плавное появление секций ----------
  var revealEls = document.querySelectorAll('.section, .dinner, .ornament');
  if ('IntersectionObserver' in window &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ---------- 5. Интро-конверт при первом заходе ----------
  // Принудительно показать: добавить к адресу ?intro  (например для проверки)
  var intro = document.getElementById('intro');
  var INTRO_KEY = 'intro_shown';
  var introAlreadyShown = false;
  try { introAlreadyShown = localStorage.getItem(INTRO_KEY) === '1'; } catch (err) {}
  var introForced = /[?&]intro\b/.test(location.search) || location.hash === '#intro';

  if (intro && (!introAlreadyShown || introForced) &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var envelope = document.getElementById('introEnvelope');
    var skipBtn = document.getElementById('introSkip');
    var closed = false;

    intro.hidden = false;
    document.body.style.overflow = 'hidden'; // не скроллим под интро

    function closeIntro() {
      if (closed) return;
      closed = true;
      try { localStorage.setItem(INTRO_KEY, '1'); } catch (err) {}
      intro.classList.add('intro--done');
      document.body.style.overflow = '';
      setTimeout(function () { intro.hidden = true; }, 750);
    }
    function openEnvelope() {
      if (closed) return;
      envelope.classList.add('intro__envelope--open');
      setTimeout(closeIntro, 1700); // даём письму подняться и «прочитаться»
    }

    envelope.addEventListener('click', openEnvelope);
    envelope.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
    });
    skipBtn.addEventListener('click', closeIntro);
  }

  // ---------- 6. Лепестки на обложке ----------
  var petalsBox = document.getElementById('petals');
  if (petalsBox && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var kinds = ['petal--blush', 'petal--burgundy', 'petal--sage'];
    var PETAL_COUNT = 14;
    for (var i = 0; i < PETAL_COUNT; i++) {
      var p = document.createElement('i');
      p.className = 'petal ' + kinds[i % kinds.length];
      // случайные параметры каждого лепестка
      p.style.left = (3 + Math.random() * 94) + '%';
      p.style.setProperty('--fall-dur', (9 + Math.random() * 10).toFixed(1) + 's');
      p.style.setProperty('--fall-delay', (-Math.random() * 18).toFixed(1) + 's');
      p.style.setProperty('--sway-dur', (2.2 + Math.random() * 2.2).toFixed(1) + 's');
      p.style.setProperty('--sway-amt', (14 + Math.random() * 34).toFixed(0) + 'px');
      var scale = (0.7 + Math.random() * 0.8).toFixed(2);
      p.style.width = p.style.height = (12 * scale + 4).toFixed(0) + 'px';
      petalsBox.appendChild(p);
    }
  }
});
