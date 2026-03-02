import { t } from '../lib/i18n.js';
import { signIn, signInWithOAuth } from '../lib/auth.js';
import { navigate } from '../lib/router.js';
import { escapeHtml } from '../lib/sanitize.js';

export function renderLoginPage(root) {
  root.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="/adilstore-icon.png" alt="AdilStore" width="48" height="48" class="auth-logo" />
          <h1>${t('auth.loginTitle')}</h1>
        </div>
        <form id="loginForm" class="auth-form" novalidate>
          <label class="form-label">
            <span>${t('auth.email')}</span>
            <input type="email" name="email" class="form-input" required autocomplete="email" />
          </label>
          <label class="form-label">
            <span>${t('auth.password')}</span>
            <input type="password" name="password" class="form-input" required autocomplete="current-password" />
          </label>
          <div class="auth-error" id="loginError" hidden></div>
          <button type="submit" class="btn btn-primary btn-full">${t('buttons.signIn')}</button>
        </form>
        <div class="auth-divider"><span>${t('auth.orContinueWith')}</span></div>
        <div class="oauth-buttons">
          <button class="btn btn-ghost btn-full js-oauth" data-provider="google" type="button">Google</button>
          <button class="btn btn-ghost btn-full js-oauth" data-provider="github" type="button">GitHub</button>
        </div>
        <p class="auth-switch">
          ${t('auth.noAccount')}
          <a href="#/register" data-link>${t('buttons.signUp')}</a>
        </p>
      </div>
    </div>
  `;

  const form = root.querySelector('#loginForm');
  const errorEl = root.querySelector('#loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed';
      errorEl.hidden = false;
    }
  });

  root.querySelectorAll('.js-oauth').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await signInWithOAuth(btn.dataset.provider);
      } catch (err) {
        errorEl.textContent = err.message || 'OAuth failed';
        errorEl.hidden = false;
      }
    });
  });

  root.querySelector('a[data-link]')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/register');
  });
}
