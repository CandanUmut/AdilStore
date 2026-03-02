import { t } from '../lib/i18n.js';
import { signUp } from '../lib/auth.js';
import { navigate } from '../lib/router.js';

export function renderRegisterPage(root) {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="/adilstore-icon.png" alt="AdilStore" width="48" height="48" class="auth-logo" />
          <h1>${t('auth.registerTitle')}</h1>
        </div>
        <form id="registerForm" class="auth-form" novalidate>
          <label class="form-label">
            <span>${t('auth.displayName')}</span>
            <input type="text" name="displayName" class="form-input" required autocomplete="name" />
          </label>
          <label class="form-label">
            <span>${t('auth.email')}</span>
            <input type="email" name="email" class="form-input" required autocomplete="email" />
          </label>
          <label class="form-label">
            <span>${t('auth.password')}</span>
            <input type="password" name="password" class="form-input" required minlength="8" autocomplete="new-password" />
          </label>
          <div class="auth-error" id="registerError" hidden></div>
          <button type="submit" class="btn btn-primary btn-full">${t('buttons.signUp')}</button>
        </form>
        <p class="auth-switch">
          ${t('auth.hasAccount')}
          <a href="#/login" data-link>${t('buttons.signIn')}</a>
        </p>
      </div>
    </div>
  `;

  const form = root.querySelector('#registerForm');
  const errorEl = root.querySelector('#registerError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const displayName = form.displayName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (password.length < 8) {
      errorEl.textContent = 'Password must be at least 8 characters';
      errorEl.hidden = false;
      return;
    }

    try {
      await signUp(email, password, displayName);
      navigate('/');
    } catch (err) {
      errorEl.textContent = err.message || 'Registration failed';
      errorEl.hidden = false;
    }
  });

  root.querySelector('a[data-link]')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/login');
  });
}
