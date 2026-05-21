const path = require('node:path');

const dotenv = require('dotenv');
const restify = require('restify');

dotenv.config();

const server = restify.createServer({
  name: 'lab-6-restify-contact-server',
  version: '1.0.0',
});

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

server.use(restify.plugins.queryParser());
server.use(
  restify.plugins.bodyParser({
    mapParams: false,
    maxBodySize: 20 * 1024,
  })
);

const trimValue = (value) => String(value ?? '').trim();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const validateContactForm = (payload = {}) => {
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

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const isMailConfigured = () =>
  Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_SENDER_EMAIL &&
      process.env.MAIL_TO
  );

const buildBrevoEmail = (data) => ({
  sender: {
    name: process.env.BREVO_SENDER_NAME || 'CV Site',
    email: process.env.BREVO_SENDER_EMAIL,
  },
  to: [
    {
      email: process.env.MAIL_TO,
      name: process.env.MAIL_TO_NAME || 'Site owner',
    },
  ],
  replyTo: {
    email: data.email,
    name: data.name,
  },
  subject: `Повідомлення з сайту: ${data.subject}`,
  textContent: [
    `Ім’я: ${data.name}`,
    `Email: ${data.email}`,
    `Тема: ${data.subject}`,
    '',
    data.message,
  ].join('\n'),
  htmlContent: `
    <html>
      <body>
        <h2>Нове повідомлення з форми зворотного зв’язку</h2>
        <p><strong>Ім’я:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Тема:</strong> ${escapeHtml(data.subject)}</p>
        <p><strong>Повідомлення:</strong></p>
        <p>${escapeHtml(data.message).replaceAll('\n', '<br>')}</p>
      </body>
    </html>
  `,
});

const sendBrevoEmail = async (data) => {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(buildBrevoEmail(data)),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `Brevo API returned ${response.status}: ${responseBody || response.statusText}`
    );
  }

  return responseBody ? JSON.parse(responseBody) : {};
};

server.post('/api/contact', async (req, res) => {
  const { data, errors, isValid } = validateContactForm(req.body);

  if (!isValid) {
    res.send(400, {
      message: 'Перевірте правильність заповнення форми.',
      errors,
    });
    return;
  }

  if (!isMailConfigured()) {
    res.send(503, {
      message:
        'Відправлення пошти не налаштовано. Заповніть BREVO_API_KEY, BREVO_SENDER_EMAIL та MAIL_TO у файлі .env.',
    });
    return;
  }

  try {
    const result = await sendBrevoEmail(data);

    res.send(200, {
      message: 'Повідомлення успішно надіслано.',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Brevo API error:', error);

    res.send(500, {
      message: 'Не вдалося надіслати повідомлення. Спробуйте пізніше.',
    });
  }
});

server.get(
  '/',
  restify.plugins.serveStatic({
    directory: PUBLIC_DIR,
    file: 'index.html',
    appendRequestPath: false,
    charSet: 'utf-8',
  })
);

server.get('/*', restify.plugins.serveStaticFiles(PUBLIC_DIR));

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
