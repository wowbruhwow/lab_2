# Лабораторна робота №6 — Використання Node.js

Реалізовано Node.js застосунок для розгортання статичного сайту з попередніх лабораторних робіт, обробки форми зворотного зв’язку та надсилання email власнику сайту.

## Використаний варіант 14

- Node.js фреймворк: **Restify**
- Відправка пошти: **Brevo API (REST)**
- Тунелювання: **ngrok**

## Структура

- `server.js` — Restify-сервер, статичні файли та API `/api/contact`
- `public/index.html` — головна сторінка сайту
- `public/styles.css` — стилі сайту
- `public/script.js` — JavaScript для теми, коментарів, localStorage та форми
- `.env.example` — приклад змінних середовища для Brevo API
- `.gitignore` — виключає `.env` та `node_modules/` з репозиторію

## Запуск локально

```bash
npm install
cp .env.example .env
npm start
```

Після запуску сайт буде доступний за адресою:

```text
http://localhost:3000
```

## Налаштування відправлення пошти

У файлі `.env` потрібно вказати дані Brevo API:

```env
PORT=3000
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_NAME="CV Site"
BREVO_SENDER_EMAIL=verified-sender@example.com
MAIL_TO=owner@example.com
MAIL_TO_NAME="Site owner"
```

`BREVO_SENDER_EMAIL` має бути підтвердженим відправником у Brevo.

Форма надсилає `POST`-запит на `/api/contact` у JSON-форматі з полями:

- `name`
- `email`
- `subject`
- `message`

На сервері виконується базова валідація обов’язкових полів, довжини значень та коректності email.

## Публічний URL через ngrok

Після запуску локального сервера відкрийте новий термінал і виконайте:

```bash
ngrok http 3000
```

У консолі буде виведено публічне посилання формату `https://...ngrok-free.app`.
