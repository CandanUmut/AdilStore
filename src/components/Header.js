import { t, setLang } from '../lib/i18n.js';
import { getState, setState, subscribe } from '../lib/state.js';
import { navigate } from '../lib/router.js';
import { signOut, isLoggedIn, isDeveloper, isAdmin } from '../lib/auth.js';

export function renderHeader(container) {
  update(container);
  subscribe(() => update(container));
}

function update(container) {
  const { lang, theme, user } = getState();

  container.innerHTML = `
    <div class="top-bar">
      <a class="brand" href="#/" data-link aria-label="AdilStore">
        <div class="brand-mark">
          <img src="/adilstore-icon.png" alt="" width="20" height="20" />
        </div>
        <span>AdilStore</span>
      </a>

      <nav class="header-nav" aria-label="Main navigation">
        <a href="#/" class="nav-link" data-link>${t('nav.home')}</a>
        ${user ? `<a href="#/developer" class="nav-link" data-link>${t('nav.devPortal')}</a>` : ''}
        ${isAdmin() ? `<a href="#/admin/reviews" class="nav-link" data-link>${t('review.queueTitle')}</a>` : ''}
      </nav>

      <div class="header-actions">
        <div class="lang-toggle" role="group" aria-label="Language toggle">
          <button class="lang-option ${lang === 'en' ? 'active' : ''}" data-lang="en" type="button">EN</button>
          <button class="lang-option ${lang === 'tr' ? 'active' : ''}" data-lang="tr" type="button">TR</button>
        </div>
        <button class="theme-toggle" type="button" aria-label="Toggle theme">
          <span class="theme-icon">${theme === 'light' ? '☀️' : '🌙'}</span>
          <span class="theme-label">${t(`theme.${theme}`)}</span>
        </button>
        ${user
          ? `<div class="user-menu">
              <button class="btn btn-ghost btn-sm user-menu-trigger" type="button">
                ${user.user_metadata?.display_name || user.email?.split('@')[0] || t('nav.profile')}
              </button>
              <div class="user-dropdown" hidden>
                <a href="#/developer" class="dropdown-item" data-link>${t('nav.devPortal')}</a>
                <button class="dropdown-item js-sign-out" type="button">${t('buttons.signOut')}</button>
              </div>
            </div>`
          : `<a href="#/login" class="btn btn-ghost btn-sm" data-link>${t('buttons.signIn')}</a>`
        }
      </div>
    </div>
  `;

  // Language toggle
  container.querySelectorAll('.lang-option').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Theme toggle
  container.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = getState().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('adilstore-theme', next);
    setState({ theme: next });
  });

  // Sign out
  container.querySelector('.js-sign-out')?.addEventListener('click', async () => {
    await signOut();
    navigate('/');
  });

  // User dropdown toggle
  const trigger = container.querySelector('.user-menu-trigger');
  const dropdown = container.querySelector('.user-dropdown');
  if (trigger && dropdown) {
    trigger.addEventListener('click', () => {
      dropdown.hidden = !dropdown.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!container.querySelector('.user-menu')?.contains(e.target)) {
        dropdown.hidden = true;
      }
    });
  }

  // data-link navigation
  container.querySelectorAll('a[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.getAttribute('href').replace('#', ''));
    });
  });
}
