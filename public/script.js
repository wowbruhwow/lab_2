const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

const getDefaultTheme = () => {
  const currentHour = new Date().getHours();
  return currentHour >= 7 && currentHour < 21 ? 'light' : 'dark';
};

const storedTheme = localStorage.getItem('theme');
root.dataset.theme = storedTheme || getDefaultTheme();

if (themeToggle) {
  const themeIcon = themeToggle.querySelector('.theme-toggle__icon');
  const themeText = themeToggle.querySelector('.theme-toggle__text');

  const updateThemeToggle = () => {
    const isLight = root.dataset.theme === 'light';
    themeIcon.textContent = isLight ? '🌙' : '🌞';
    themeText.textContent = isLight ? 'Нічний режим' : 'Денний режим';
    themeToggle.setAttribute('aria-pressed', String(isLight));
  };

  updateThemeToggle();

  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', root.dataset.theme);
    updateThemeToggle();
  });
}

const commentsList = document.getElementById('comments-list');
const commentsStatus = document.getElementById('comments-status');

const renderComment = (comment) => {
  const commentCard = document.createElement('article');
  commentCard.className = 'comment';

  const title = document.createElement('h3');
  title.textContent = comment.name;

  const email = document.createElement('p');
  email.className = 'comment-email';
  email.textContent = `Email: ${comment.email}`;

  const body = document.createElement('p');
  body.className = 'comment-body';
  body.textContent = comment.body;

  commentCard.append(title, email, body);
  return commentCard;
};

if (commentsList && commentsStatus) {
  fetch('https://jsonplaceholder.typicode.com/comments?_limit=5')
    .then((response) => response.json())
    .then((comments) => {
      const fragment = document.createDocumentFragment();
      comments.forEach((comment) => {
        fragment.append(renderComment(comment));
      });
      commentsList.replaceChildren(fragment);
      commentsStatus.textContent = '';
    })
    .catch(() => {
      commentsStatus.textContent = 'Не вдалося завантажити коментарі.';
    });
}

const environmentInfo = {
  platform: navigator.platform,
  userAgent: navigator.userAgent,
  language: navigator.language,
  cookiesEnabled: navigator.cookieEnabled,
  online: navigator.onLine,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  colorDepth: window.screen.colorDepth,
  currentTime: new Date().toLocaleString('uk-UA'),
};

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection && typeof connection.saveData === 'boolean') {
  environmentInfo.saveData = connection.saveData;
}

localStorage.setItem('environmentInfo', JSON.stringify(environmentInfo));
const storageInfo = document.getElementById('storage-info');
if (storageInfo) {
  storageInfo.textContent = localStorage.getItem('environmentInfo') ?? '';
}

const contactForm = document.getElementById('contact-form');
const contactStatus = document.getElementById('contact-status');

const setContactStatus = (message, type = '') => {
  contactStatus.textContent = message;
  contactStatus.classList.remove('is-error', 'is-success');

  if (type) {
    contactStatus.classList.add(type);
  }
};

const formatServerErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return '';
  }

  return Object.values(errors).join(' ');
};

if (contactForm && contactStatus) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setContactStatus('Надсилання повідомлення...');
    submitButton.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverErrors = formatServerErrors(result.errors);
        throw new Error(serverErrors || result.message || 'Не вдалося надіслати повідомлення.');
      }

      contactForm.reset();
      setContactStatus(result.message || 'Повідомлення успішно надіслано.', 'is-success');
    } catch (error) {
      setContactStatus(error.message, 'is-error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
