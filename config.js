// ============================================================
// НАСТРОЙКИ САЙТА — всё меняется только в этом файле
// ============================================================
const CONFIG = {

  // Куда форма отправляет ответы. Работает Google Apps Script:
  // после развертывания скрипта (инструкция в apps-script/Code.gs)
  // вставьте сюда URL вида 'https://script.google.com/macros/s/.../exec'
  // Пустая строка '' — отправка выключена (форма работает без писем).
  rsvpScriptUrl: 'https://script.google.com/macros/s/AKfycbw06iaNIzX4EzgI7-_C9odpIxW1ozfFrNwrfC6KjATXYRR6SElRYj5yCFOyFGLhoFSq/exec',

  // (не используется) прежний канал FormSubmit — заблокирован провайдером:
  // rsvpRecipients: '69e5753904b77acb8943b3fdcb13886b',

  // Тема письма с ответом гостя
  rsvpSubject: 'RSVP: свадьба Андрея и Ксении',
};
