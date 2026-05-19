# Лабораторна робота №6 — Використання Node.js

Реалізовано Node.js застосунок для розгортання статичного сайту з попередніх лабораторних робіт, обробки форми зворотного зв’язку та надсилання email власнику сайту.

## Використаний варіант

- Node.js фреймворк: **Express**
- Відправка пошти: **Nodemailer + Brevo SMTP**
- Тунелювання: **Cloudflare Quick Tunnel**

## Структура

- `server.js` — Express-сервер, статичні файли та API `/api/contact`
- `public/index.html` — головна сторінка сайту
- `public/styles.css` — стилі сайту
- `public/script.js` — JavaScript для теми, коментарів, localStorage та форми
- `.env.example` — приклад змінних середовища для SMTP

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

У файлі `.env` потрібно вказати SMTP-дані Brevo:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-smtp-login@example.com
SMTP_PASS=your-brevo-smtp-key
MAIL_FROM="CV Site <your-brevo-smtp-login@example.com>"
MAIL_TO=student@example.com
```

Форма надсилає `POST`-запит на `/api/contact` з полями:

- `name`
- `email`
- `subject`
- `message`

На сервері виконується базова валідація обов’язкових полів, довжини значень та коректності email.

## Публічний URL через Cloudflare Quick Tunnel

Після запуску локального сервера можна відкрити доступ з інтернету:

```bash
cloudflared tunnel --url http://localhost:3000
```

У консолі буде виведено публічне посилання формату `https://...trycloudflare.com`.
