const path = require('path');

const dotenv = require('dotenv');
const express = require('express');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const trimValue = (value) => String(value ?? '').trim();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const validateContactForm = (payload) => {
  const data = {
    name: trimValue(payload.name),
    email: trimValue(payload.email).toLowerCase(),
    subject: trimValue(payload.subject),
    message: trimValue(payload.message),
  };

  const errors = {};

  if (!data.name) {
    errors.name = 'Поле імені є обов’язковим.';
  } else if (data.name.length < 2 || data.name.length > 80) {
    errors.name = 'Ім’я повинно містити від 2 до 80 символів.';
  }

  if (!data.email) {
    errors.email = 'Поле email є обов’язковим.';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Вкажіть коректну email-адресу.';
  }

  if (!data.subject) {
    errors.subject = 'Поле теми є обов’язковим.';
  } else if (data.subject.length < 3 || data.subject.length > 120) {
    errors.subject = 'Тема повинна містити від 3 до 120 символів.';
  }

  if (!data.message) {
    errors.message = 'Поле повідомлення є обов’язковим.';
  } else if (data.message.length < 10 || data.message.length > 2000) {
    errors.message = 'Повідомлення повинно містити від 10 до 2000 символів.';
  }

  return {
    data,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const isMailConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_TO);

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

app.post('/api/contact', async (req, res) => {
  const { data, errors, isValid } = validateContactForm(req.body);

  if (!isValid) {
    return res.status(400).json({
      message: 'Перевірте правильність заповнення форми.',
      errors,
    });
  }

  if (!isMailConfigured()) {
    return res.status(503).json({
      message:
        'Відправлення пошти не налаштовано. Заповніть SMTP_USER, SMTP_PASS та MAIL_TO у файлі .env.',
    });
  }

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO,
      replyTo: data.email,
      subject: `Повідомлення з сайту: ${data.subject}`,
      text: [
        `Ім’я: ${data.name}`,
        `Email: ${data.email}`,
        `Тема: ${data.subject}`,
        '',
        data.message,
      ].join('\n'),
      html: `
        <h2>Нове повідомлення з форми зворотного зв’язку</h2>
        <p><strong>Ім’я:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Тема:</strong> ${escapeHtml(data.subject)}</p>
        <p><strong>Повідомлення:</strong></p>
        <p>${escapeHtml(data.message).replaceAll('\n', '<br>')}</p>
      `,
    });

    return res.status(200).json({
      message: 'Повідомлення успішно надіслано.',
    });
  } catch (error) {
    console.error('Email send error:', error);

    return res.status(500).json({
      message: 'Не вдалося надіслати повідомлення. Спробуйте пізніше.',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не знайдено.' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
