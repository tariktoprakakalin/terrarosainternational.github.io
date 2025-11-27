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
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiG3S1XCYsZkFEILnxgFqAF12ABUEBfvTH0VxngPFoFq3J9latmScC6WbpJEoqbJ5d/exec';

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

      const company = form.querySelector('[name="company"]')?.value.trim();
      const country = form.querySelector('[name="country"]')?.value.trim();
      const email = form.querySelector('[name="email"]')?.value.trim();
      const product = form.querySelector('[name="product"]')?.value.trim();
      const volume = form.querySelector('[name="volume"]')?.value.trim();
      const port = form.querySelector('[name="port"]')?.value.trim();
      const bank = form.querySelector('[name="bank"]')?.value.trim();
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
        company: company || '',
        country: country || '',
        email: email || '',
        product: product || '',
        volume: volume || '',
        port: port || '',
        bank: bank || '',
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

// ==== AI CHAT ====
function initChat() {
  const form = document.getElementById("tr-chat-form");
  const input = document.getElementById("tr-chat-input");
  const statusEl = document.getElementById("tr-chat-status");
  const replyEl = document.getElementById("tr-chat-reply");
  const lang = document.documentElement.lang === 'tr' ? 'TR' : 'EN';

  const history = [];

  if (!form || !input || !statusEl || !replyEl) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await handleChatSubmit();
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  });

  async function handleChatSubmit() {
    const text = (input.value || "").trim();
    if (!text) return;

    history.push({ role: "user", content: text });

    statusEl.textContent = lang === 'TR' ? "AI düşünüyor..." : "AI is thinking...";
    replyEl.textContent = "";
    input.disabled = true;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
      });

      const data = await resp.json();
      if (data.error) {
        statusEl.textContent = (lang === 'TR' ? "Hata: " : "Error: ") + data.error;
      } else {
        let parsed;
        try {
          parsed = JSON.parse(data.reply);
        } catch (e) {
          parsed = { reply: data.reply, fields: {} };
        }

        const replyText = parsed.reply || (lang === 'TR' ? "(Yanıt alınamadı)" : "(No response)");
        statusEl.textContent = "";
        replyEl.textContent = replyText;

        history.push({ role: "assistant", content: replyText });

        if (parsed.fields) {
          const f = parsed.fields;
          const fieldsToUpdate = [
            { key: 'product', selector: '[name="product"]' },
            { key: 'volume', selector: '[name="volume"]' },
            { key: 'port', selector: '[name="port"]' },
            { key: 'bank', selector: '[name="bank"]' },
            { key: 'company', selector: '[name="company"]' },
            { key: 'country', selector: '[name="country"]' },
            { key: 'email', selector: '[name="email"]' },
            { key: 'message', selector: '[name="message"]' }
          ];

          fieldsToUpdate.forEach(item => {
            if (f[item.key]) {
              const el = document.querySelector(item.selector);
              if (el) {
                el.value = f[item.key];
                el.style.transition = "background-color 0.5s, border-color 0.5s";
                el.style.backgroundColor = "#e6f7ff";
                el.style.borderColor = "#1890ff";
                setTimeout(() => {
                  el.style.backgroundColor = "";
                  el.style.borderColor = "";
                }, 2000);
              }
            }
          });
        }
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = lang === 'TR' ? "Bağlantı hatası. Lütfen daha sonra tekrar deneyin." : "Connection error. Please try again later.";
    } finally {
      input.disabled = false;
      input.value = "";
      input.focus();
    }
  }
}

// ==== CHAT MOBILE TOGGLE ====
function initChatToggle() {
  const wrapper = document.querySelector('.tr-chat-wrapper');
  const toggleBtn = document.getElementById('tr-chat-toggle');
  if (!wrapper || !toggleBtn) return;

  const lang = document.documentElement.lang === 'tr' ? 'TR' : 'EN';
  const labels = lang === 'TR'
    ? { open: 'Asistanı aç', close: 'Asistanı gizle' }
    : { open: 'Open assistant', close: 'Hide assistant' };

  function setCollapsed(collapsed) {
    const shouldCollapse = collapsed && window.matchMedia('(max-width: 900px)').matches;
    if (shouldCollapse) {
      wrapper.classList.add('mobile-collapsed');
    } else {
      wrapper.classList.remove('mobile-collapsed');
    }

    const isCollapsed = wrapper.classList.contains('mobile-collapsed');
    toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
    toggleBtn.textContent = isCollapsed ? labels.open : labels.close;
  }

  function handleResize() {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }

  toggleBtn.addEventListener('click', function () {
    const isCollapsed = wrapper.classList.contains('mobile-collapsed');
    setCollapsed(!isCollapsed);
  });

  window.addEventListener('resize', handleResize);
  handleResize();
}

// ==== INITIALIZATION ====
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initForms();
  initChat();
  initChatToggle();

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
