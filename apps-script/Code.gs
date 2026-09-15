/**
 * RSVP-приёмник для свадебного сайта.
 *
 * Как подключить (один раз, ~3 минуты):
 * 1. Откройте https://script.google.com → «Новый проект».
 * 2. Удалите всё из Code.gs и вставьте этот код целиком.
 * 3. В строке EMAIL впишите свой адрес (куда слать уведомления).
 * 4. Нажмите «Развернуть» → «Новое развертывание» → тип «Веб-приложение»:
 *      — Описание: любое;
 *      — Выполнять как: «От моего имени»;
 *      — Доступ: «Все» (Anyone).
 * 5. Нажмите «Развернуть», разрешите доступ (Google покажет предупреждение —
 *    это ваш же скрипт, нажмите «Дополнительно» → «Перейти»).
 * 6. Скопируйте URL вида https://script.google.com/macros/s/AKfy.../exec
 *    и вставьте его в config.js сайта в rsvpScriptUrl.
 */

var EMAILS = [                               // ← кому приходят ответы
  'andrej-vilenskij@yandex.ru',
  'kseniya-litvinova@mail.ru',
];
var SUBJECT = 'RSVP: свадьба Андрея и Ксении';

function doPost(e) {
  var name = '', answer = '';
  try {
    var data = e && e.parameter ? e.parameter : {};
    name = data.name || '(без имени)';
    answer = data.answer || '(нет ответа)';
  } catch (err) {}

  var body = 'Имя гостя: ' + name + '\n' +
             'Ответ: ' + answer + '\n' +
             'Дата: ' + new Date().toLocaleString('ru-RU');

  try {
    EMAILS.forEach(function (addr) {
      MailApp.sendEmail(addr, SUBJECT, body);
    });
  } catch (err) {
    return ContentService.createTextOutput('error')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput('ok')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Тест из редактора: «Выполнить» → doPost_test — должно прийти письмо
function doPost_test() {
  doPost({ parameter: { name: 'Тест из редактора', answer: 'Буду' } });
}
