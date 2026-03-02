import { t, getLocalizedText, getLocalizedList } from '../lib/i18n.js';
import { getState } from '../lib/state.js';
import { escapeHtml } from '../lib/sanitize.js';
import { navigate } from '../lib/router.js';

export function createAppCard(app) {
  const { appRatings } = getState();
  const card = document.createElement('article');
  card.className = 'app-card';
  card.dataset.category = app.category;
  card.dataset.appId = app.id;

  const description = escapeHtml(getLocalizedText(app.description));
  const shortDesc = description.length > 160 ? description.slice(0, 160) + '…' : description;
  const tags = getLocalizedList(app.tags);
  const platforms = getLocalizedList(app.platforms);
  const isPlayStore = app.url?.includes('play.google.com');
  const iconHtml = getIconHtml(app);
  const ratingInfo = appRatings[app.id];
  const slug = app.slug || app.id;
  const categoryLabel = t(`categories.${app.category}`) || app.category;

  card.innerHTML = `
    <div class="app-header">
      <h3 class="app-title">
        <span class="app-icon">${iconHtml}</span>
        <a href="#/app/${encodeURIComponent(slug)}" data-link class="app-name-link">${escapeHtml(app.name)}</a>
      </h3>
      <span class="app-category">${escapeHtml(categoryLabel)}</span>
    </div>
    <p class="app-description">${shortDesc}</p>
    <div class="small app-extra-line">${t('storePromise')}</div>
    <div class="app-meta">
      <div class="chip-row">
        ${tags.slice(0, 4).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="platforms">
        ${platforms.slice(0, 2).map((p) => `<span class="platform-pill">${escapeHtml(p)}</span>`).join('')}
      </div>
    </div>
    ${ratingInfo ? `
      <div class="rating-summary-row">
        <div class="rating-stars" aria-label="${ratingInfo.avg?.toFixed(1) || 0} out of 5">
          ${renderStars(ratingInfo.avg)}
        </div>
        <span class="rating-summary-text">${getRatingSummary(ratingInfo)}</span>
      </div>
    ` : ''}
    <div class="app-actions">
      <a class="btn btn-primary" href="${escapeHtml(app.url)}" target="_blank" rel="noreferrer noopener">
        <span class="icon">${isPlayStore ? '↗' : '🚀'}</span>
        <span>${isPlayStore ? t('buttons.openPlay') : t('buttons.open')}</span>
      </a>
      <a href="#/app/${encodeURIComponent(slug)}" class="btn btn-ghost" data-link>
        <span class="icon">ℹ</span>
        <span>Details</span>
      </a>
      <button class="btn btn-ghost js-share-btn" type="button" data-slug="${escapeHtml(slug)}">
        <span class="icon">↗</span>
        <span>${t('buttons.share')}</span>
      </button>
    </div>
  `;

  // Navigation links
  card.querySelectorAll('a[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.getAttribute('href').replace('#', ''));
    });
  });

  // Share button
  card.querySelector('.js-share-btn')?.addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/app/${slug}`;
    if (navigator.share) {
      navigator.share({ title: app.name, text: getLocalizedText(app.description).slice(0, 100), url: shareUrl });
    } else {
      navigator.clipboard?.writeText(shareUrl);
    }
  });

  return card;
}

function getIconHtml(app) {
  if (app.iconUrl) {
    return `<img src="${escapeHtml(app.iconUrl)}" alt="" class="app-icon-img" loading="lazy" />`;
  }
  if (app.iconFilename) {
    return `<img src="./icons/${escapeHtml(app.iconFilename)}" alt="" class="app-icon-img" loading="lazy" />`;
  }
  return escapeHtml(app.name.charAt(0));
}

export function renderStars(avg) {
  if (!avg || avg <= 0) return '<span class="star empty">☆</span>'.repeat(5);
  const full = Math.floor(avg);
  const hasHalf = avg - full >= 0.5;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += '<span class="star full">★</span>';
    else if (i === full + 1 && hasHalf) html += '<span class="star half">★</span>';
    else html += '<span class="star empty">☆</span>';
  }
  return html;
}

function getRatingSummary(info) {
  if (!info?.count) return t('appDetail.noRatings');
  const avg = info.avg ? info.avg.toFixed(1) : '0';
  return `${avg} · ${info.count} ${info.count === 1 ? 'rating' : 'ratings'}`;
}
