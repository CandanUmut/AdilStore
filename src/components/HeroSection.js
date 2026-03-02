import { t, getLocalizedText, getLocalizedList } from '../lib/i18n.js';
import { getState } from '../lib/state.js';
import { escapeHtml } from '../lib/sanitize.js';
import { navigate } from '../lib/router.js';

export function renderHeroSection(container) {
  const { apps } = getState();

  container.innerHTML = `
    <section class="hero">
      <div class="hero-main">
        <div class="hero-kicker"><span class="dot"></span><span>${t('heroKicker')}</span></div>
        <h1 class="hero-title">${t('heroTitle')}</h1>
        <p class="hero-sub">${t('heroSubtitle')}</p>
        <div class="hero-note">${t('heroNote')}</div>
      </div>
      <div class="hero-side">
        <div class="hero-app-card" id="heroAppCard"></div>
        <div class="hero-metrics">
          <div class="metric">
            <div class="metric-label">${t('metrics.apps')}</div>
            <div class="metric-value">${apps.length}</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.privacy')}</div>
            <div class="metric-value">${t('metrics.privacyValue')}</div>
          </div>
          <div class="metric">
            <div class="metric-label">${t('metrics.platforms')}</div>
            <div class="metric-value">${t('metrics.platformsValue')}</div>
          </div>
        </div>
      </div>
    </section>
  `;

  renderHeroApp();
}

function renderHeroApp() {
  const card = document.getElementById('heroAppCard');
  if (!card) return;

  const heroApp = getHeroApp();
  if (!heroApp) { card.innerHTML = ''; return; }

  const desc = escapeHtml(getLocalizedText(heroApp.description));
  const shortDesc = desc.length > 200 ? desc.slice(0, 200) + '…' : desc;
  const tags = getLocalizedList(heroApp.tags).slice(0, 3);
  const slug = heroApp.slug || heroApp.id;
  const isPlayStore = heroApp.url?.includes('play.google.com');

  const iconHtml = heroApp.iconFilename
    ? `<img src="./icons/${escapeHtml(heroApp.iconFilename)}" alt="" class="app-icon-img" loading="lazy" />`
    : escapeHtml(heroApp.name.charAt(0));

  card.innerHTML = `
    <div class="hero-app-header">
      <div class="app-icon lg">${iconHtml}</div>
      <div>
        <div class="eyebrow">${t('heroAppTagline')}</div>
        <h2>${escapeHtml(heroApp.name)}</h2>
        <p class="hero-app-desc">${shortDesc}</p>
      </div>
    </div>
    <div class="hero-app-meta">
      ${tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}
    </div>
    <div class="app-actions">
      <a class="btn btn-primary" href="${escapeHtml(heroApp.url)}" target="_blank" rel="noreferrer noopener">
        <span class="icon">${isPlayStore ? '↗' : '🚀'}</span>
        <span>${isPlayStore ? t('buttons.openPlay') : t('buttons.open')}</span>
      </a>
      <a href="#/app/${encodeURIComponent(slug)}" class="btn btn-ghost" data-link>
        <span class="icon">ℹ</span>
        <span>Details</span>
      </a>
    </div>
  `;

  card.querySelector('a[data-link]')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(`/app/${slug}`);
  });
}

function getHeroApp() {
  const { apps } = getState();
  const eligible = apps.filter((app) => Boolean(app.url));
  if (!eligible.length) return null;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return eligible[dayOfYear % eligible.length];
}
