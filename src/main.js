import './styles/main.css';
import { addRoute, setNotFound, startRouter, navigate } from './lib/router.js';
import { initAuth } from './lib/auth.js';
import { initLang } from './lib/i18n.js';
import { setState, getState, subscribe } from './lib/state.js';
import { loadApps, loadRatings } from './lib/api.js';
import { initSanitizer } from './lib/sanitize.js';
import { renderHeader } from './components/Header.js';
import { FALLBACK_APPS } from './data/fallback-apps.js';

// ─── Theme ──────────────────────────────────────────

function initTheme() {
  const stored = localStorage.getItem('adilstore-theme');
  const theme = stored === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  setState({ theme });
}

// ─── Boot ───────────────────────────────────────────

async function boot() {
  initTheme();
  initLang();
  await initSanitizer();

  // Mount header
  const headerEl = document.getElementById('app-header');
  if (headerEl) renderHeader(headerEl);

  // Register routes (lazy-loaded pages)
  addRoute('/', async () => {
    const { renderHomePage } = await import('./pages/HomePage.js');
    renderHomePage(document.getElementById('app-root'));
  });

  addRoute('/app/:slug', async (params) => {
    const { renderAppDetailPage } = await import('./pages/AppDetailPage.js');
    renderAppDetailPage(document.getElementById('app-root'), params);
  });

  addRoute('/login', async () => {
    const { renderLoginPage } = await import('./pages/LoginPage.js');
    renderLoginPage(document.getElementById('app-root'));
  });

  addRoute('/register', async () => {
    const { renderRegisterPage } = await import('./pages/RegisterPage.js');
    renderRegisterPage(document.getElementById('app-root'));
  });

  addRoute('/developer', async () => {
    const { renderDeveloperPortalPage } = await import('./pages/DeveloperPortalPage.js');
    renderDeveloperPortalPage(document.getElementById('app-root'));
  });

  addRoute('/developer/submit', async () => {
    const { renderSubmitAppPage } = await import('./pages/SubmitAppPage.js');
    renderSubmitAppPage(document.getElementById('app-root'));
  });

  addRoute('/admin/reviews', async () => {
    const { renderAdminReviewPage } = await import('./pages/AdminReviewPage.js');
    renderAdminReviewPage(document.getElementById('app-root'));
  });

  setNotFound(() => {
    document.getElementById('app-root').innerHTML = `
      <div class="not-found">
        <h1>404</h1>
        <p>Page not found</p>
        <button class="btn btn-primary" onclick="location.hash='#/'">Go home</button>
      </div>
    `;
  });

  // Load data
  await initAuth();

  // Set fallback apps immediately so UI isn't empty
  if (!getState().apps.length) {
    setState({ apps: FALLBACK_APPS, loading: false });
  }

  // Start router (renders the current page)
  startRouter();

  // Load from Supabase in background, will replace fallback data
  loadApps().then(() => loadRatings());

  // Scroll shadow on header
  window.addEventListener('scroll', () => {
    document.querySelector('header')?.classList.toggle('scrolled', window.scrollY > 8);
  });
}

boot();
