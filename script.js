// script.js

// ==== THEME SYSTEM ====
function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add('theme-' + theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀' : '🌙';
    const isDark = theme === 'dark';
    const lang = document.documentElement.lang;

    if (lang === 'tr') {
      btn.setAttribute('aria-label', isDark ? 'Açık temaya geç' : 'Koyu temaya geç');
    } else {
      btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }
  try {
    localStorage.setItem('terraTheme', theme);
  } catch (e) { }
}

function initTheme() {
  let theme = 'dark';
  try {
    const stored = localStorage.getItem('terraTheme');
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  } catch (e) { }
  applyTheme(theme);
}

// ==== FORM + GOOGLE SHEETS ====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyj5wU0DQ1CnAsVnxFRAlStBJPYeLPBtS46My6OB1pbabULdYszze-dThMdM4KaMJzZ/exec';

const blockedEmailDomains = [
  'gmail.com', 'gmail.com.tr',
  'yahoo.com', 'yahoo.com.tr',
  'hotmail.com', 'hotmail.com.tr',
  'outlook.com', 'outlook.com.tr',
  'live.com', 'live.com.tr',
  'icloud.com',
  'yandex.com', 'yandex.ru', 'yandex.com.tr',
  'proton.me', 'protonmail.com',
  'mail.com', 'gmx.com'
];

function isCorporateEmail(email) {
  if (!email) return false;
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return false;
  const domain = email.slice(atIndex + 1).toLowerCase().trim();
  return !blockedEmailDomains.includes(domain);
}

function initForms() {
  const forms = document.querySelectorAll('form.tr-form');

  forms.forEach(function (form) {
    const lang = document.documentElement.lang === 'tr' ? 'TR' : 'EN';
    const statusEl = form.querySelector('.tr-form-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = form.querySelector('[name="email"]')?.value.trim();
      const message = form.querySelector('[name="message"]')?.value.trim();

      function setStatus(text, type) {
        if (!statusEl) return;
        statusEl.textContent = text || '';
        statusEl.className = 'tr-form-status' + (type ? ' ' + type : '');
      }

      if (!isCorporateEmail(email)) {
        if (lang === 'TR') {
          alert('Lütfen kurumsal bir e-posta adresi kullanın (gmail, hotmail vb. kişisel adresler kabul edilmiyor).');
        } else {
          alert('Please use a corporate email address (personal emails like gmail, hotmail etc. are not accepted).');
        }
        return;
      }

      setStatus(lang === 'TR' ? 'Gönderiliyor...' : 'Sending...', 'pending');
      if (submitBtn) submitBtn.disabled = true;

      const payload = new URLSearchParams({
        language: lang,
        email: email || '',
        message: message || ''
      });

      try {
        const resp = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: payload.toString()
        });

        if (!resp.ok) {
          const bodyText = await resp.text().catch(() => '');
          throw new Error('HTTP ' + resp.status + ' ' + resp.statusText + ' ' + bodyText);
        }

        form.reset();
        setStatus(lang === 'TR' ? 'Talebiniz alındı.' : 'Your inquiry has been received.', 'success');
        if (lang === 'TR') {
          alert('Talebiniz alındı. Uygunluk durumuna göre sizinle iletişime geçilecektir.');
        } else {
          alert('Your inquiry has been received. We will contact you based on availability.');
        }
      } catch (err) {
        console.error(err);
        setStatus(lang === 'TR' ? 'Hata oluştu, lütfen tekrar deneyin.' : 'Error occurred, please try again.', 'error');
        if (lang === 'TR') {
          alert('Bir hata oluştu. Lütfen daha sonra tekrar deneyin veya direkt e-posta ile ulaşın: satis@terrarosainternational.com');
        } else {
          alert('An error occurred. Please try again later or contact us directly: satis@terrarosainternational.com');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

// ==== INITIALIZATION ====
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initForms();

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const isDark = document.body.classList.contains('theme-dark') ||
        !document.body.classList.contains('theme-light');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
