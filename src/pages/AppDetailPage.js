import { t, getLocalizedText, getLocalizedList } from '../lib/i18n.js';
import { getState, subscribe } from '../lib/state.js';
import { loadAppBySlug, submitRating, loadRatings, trackInstall, trackShareClick } from '../lib/api.js';
import { escapeHtml } from '../lib/sanitize.js';
import { renderStars } from '../components/AppCard.js';
import { navigate } from '../lib/router.js';
import { renderFooter } from '../components/Footer.js';

export async function renderAppDetailPage(root, params) {
  const { slug } = params;

  root.innerHTML = `
    <div class="detail-loading">
      <div class="spinner"></div>
      <p>Loading app...</p>
    </div>
  `;

  // Try to find in state first, then load from DB
  let app = getState().apps.find((a) => (a.slug || a.id) === slug);
  if (!app) {
    app = await loadAppBySlug(slug);
  }

  if (!app) {
    root.innerHTML = `
      <div class="detail-not-found">
        <h2>App not found</h2>
        <p>The app you're looking for doesn't exist or has been removed.</p>
        <button class="btn btn-primary js-back" type="button">${t('buttons.back')}</button>
      </div>
    `;
    root.querySelector('.js-back')?.addEventListener('click', () => navigate('/'));
    return;
  }

  const description = escapeHtml(getLocalizedText(app.description));
  const tags = getLocalizedList(app.tags);
  const platforms = getLocalizedList(app.platforms);
  const isPlayStore = app.url?.includes('play.google.com');
  const { appRatings } = getState();
  const ratingInfo = appRatings[app.id];
  const shareUrl = `${window.location.origin}${window.location.pathname}#/app/${slug}`;

  const iconHtml = app.iconFilename
    ? `<img src="./icons/${escapeHtml(app.iconFilename)}" alt="${escapeHtml(app.name)}" class="detail-icon-img" />`
    : app.iconUrl
      ? `<img src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)}" class="detail-icon-img" />`
      : `<div class="detail-icon-placeholder">${escapeHtml(app.name.charAt(0))}</div>`;

  root.innerHTML = `
    <div class="detail-page">
      <nav class="detail-breadcrumb">
        <a href="#/" data-link class="breadcrumb-link">${t('nav.home')}</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${escapeHtml(app.name)}</span>
      </nav>

      <header class="detail-header">
        <div class="detail-icon-wrap">${iconHtml}</div>
        <div class="detail-header-info">
          <h1 class="detail-title">${escapeHtml(app.name)}</h1>
          ${app.developerName ? `<p class="detail-developer">${escapeHtml(app.developerName)}</p>` : ''}
          <div class="detail-meta-row">
            <span class="app-category">${escapeHtml(t(`categories.${app.category}`) || app.category)}</span>
            ${ratingInfo ? `
              <span class="detail-rating">
                ${renderStars(ratingInfo.avg)}
                <span class="rating-summary-text">${ratingInfo.avg?.toFixed(1) || '0'} (${ratingInfo.count})</span>
              </span>
            ` : ''}
          </div>
          <div class="detail-actions">
            <a class="btn btn-primary btn-lg" href="${escapeHtml(app.url)}" target="_blank" rel="noreferrer noopener" id="installBtn">
              <span class="icon">${isPlayStore ? '↗' : '🚀'}</span>
              <span>${isPlayStore ? t('buttons.openPlay') : t('buttons.install')}</span>
            </a>
            <button class="btn btn-ghost js-share" type="button">
              <span class="icon">↗</span>
              <span>${t('buttons.share')}</span>
            </button>
          </div>
        </div>
      </header>

      <section class="detail-section">
        <h2>${t('appDetail.aboutApp')}</h2>
        <p class="detail-description">${description}</p>
        <div class="detail-tags">
          ${tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </section>

      <section class="detail-section detail-info-grid">
        <div class="info-item">
          <span class="info-label">${t('metrics.platforms')}</span>
          <span class="info-value">${platforms.map((p) => escapeHtml(p)).join(', ')}</span>
        </div>
        ${app.version ? `
          <div class="info-item">
            <span class="info-label">${t('appDetail.version')}</span>
            <span class="info-value">${escapeHtml(app.version)}</span>
          </div>
        ` : ''}
        ${app.updatedAt ? `
          <div class="info-item">
            <span class="info-label">${t('appDetail.updated')}</span>
            <span class="info-value">${new Date(app.updatedAt).toLocaleDateString()}</span>
          </div>
        ` : ''}
        ${app.privacyUrl ? `
          <div class="info-item">
            <a href="${escapeHtml(app.privacyUrl)}" target="_blank" rel="noreferrer">Privacy Policy</a>
          </div>
        ` : ''}
        ${app.sourceUrl ? `
          <div class="info-item">
            <a href="${escapeHtml(app.sourceUrl)}" target="_blank" rel="noreferrer">Source Code</a>
          </div>
        ` : ''}
      </section>

      <section class="detail-section">
        <h2>${t('appDetail.ratings')}</h2>
        <div id="ratingsSection">
          ${ratingInfo ? renderRatingsBlock(ratingInfo) : `<p class="text-soft">${t('appDetail.noRatings')}</p>`}
        </div>
        <div class="review-form" id="reviewForm">
          <h3>${t('appDetail.writeReview')}</h3>
          <div class="rating-stars rating-stars-input" id="starInput" aria-label="Give a rating">
            ${[1, 2, 3, 4, 5].map((s) => `<button type="button" class="star-btn js-rate-star" data-score="${s}">★</button>`).join('')}
          </div>
          <input type="text" class="form-input" id="reviewName" placeholder="Name (optional)" />
          <textarea class="form-input" id="reviewComment" rows="3" placeholder="Your review (optional)"></textarea>
          <div class="review-form-actions">
            <button class="btn btn-primary" id="submitReviewBtn" type="button">${t('buttons.submit')}</button>
            <span class="review-message" id="reviewMessage"></span>
          </div>
        </div>
      </section>

      <section class="detail-section" id="similarApps">
        <h2>${t('appDetail.similar')}</h2>
        <div class="similar-grid" id="similarGrid"></div>
      </section>

      <div id="footerContainer"></div>
    </div>
  `;

  renderFooter(root.querySelector('#footerContainer'));
  renderSimilarApps(root.querySelector('#similarGrid'), app);
  setupDetailEvents(root, app, shareUrl);
}

function renderRatingsBlock(info) {
  return `
    <div class="ratings-overview">
      <div class="ratings-big-number">${info.avg?.toFixed(1) || '0'}</div>
      <div class="ratings-stars">${renderStars(info.avg)}</div>
      <div class="ratings-count">${info.count} rating${info.count !== 1 ? 's' : ''}</div>
    </div>
    ${info.latest?.length ? `
      <div class="reviews-list">
        ${info.latest.map((r) => `
          <div class="review-item">
            <div class="review-header">
              <strong>${escapeHtml(r.name || 'Anonymous')}</strong>
              ${r.verified ? `<span class="verified-badge">✓ Verified</span>` : ''}
              <span class="review-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
            </div>
            ${r.comment ? `<p class="review-text">${escapeHtml(r.comment)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function renderSimilarApps(container, currentApp) {
  if (!container) return;
  const { apps } = getState();
  const similar = apps
    .filter((a) => a.category === currentApp.category && a.id !== currentApp.id)
    .slice(0, 3);

  if (!similar.length) {
    container.closest('.detail-section')?.remove();
    return;
  }

  similar.forEach((app) => {
    const slug = app.slug || app.id;
    const iconHtml = app.iconFilename
      ? `<img src="./icons/${escapeHtml(app.iconFilename)}" alt="" class="app-icon-img" loading="lazy" />`
      : escapeHtml(app.name.charAt(0));

    const card = document.createElement('a');
    card.href = `#/app/${encodeURIComponent(slug)}`;
    card.className = 'similar-card';
    card.dataset.link = '';
    card.innerHTML = `
      <span class="app-icon">${iconHtml}</span>
      <div>
        <strong>${escapeHtml(app.name)}</strong>
        <span class="small">${escapeHtml(t(`categories.${app.category}`) || app.category)}</span>
      </div>
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(`/app/${slug}`);
    });
    container.appendChild(card);
  });
}

function setupDetailEvents(root, app, shareUrl) {
  // Breadcrumb nav
  root.querySelector('.breadcrumb-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/');
  });

  // Install tracking
  root.querySelector('#installBtn')?.addEventListener('click', () => {
    trackInstall(app.id);
  });

  // Share
  root.querySelector('.js-share')?.addEventListener('click', async () => {
    trackShareClick(app.id, 'detail-share');
    if (navigator.share) {
      await navigator.share({ title: app.name, url: shareUrl });
    } else {
      await navigator.clipboard?.writeText(shareUrl);
      alert('Link copied!');
    }
  });

  // Star selection
  let selectedScore = 0;
  root.querySelectorAll('.js-rate-star').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedScore = Number(btn.dataset.score);
      root.querySelectorAll('.js-rate-star').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.score) <= selectedScore);
      });
    });
  });

  // Submit review
  root.querySelector('#submitReviewBtn')?.addEventListener('click', async () => {
    const msg = root.querySelector('#reviewMessage');
    if (!selectedScore) {
      if (msg) { msg.textContent = 'Please select a rating.'; msg.className = 'review-message error'; }
      return;
    }
    const name = root.querySelector('#reviewName')?.value?.trim() || null;
    const comment = root.querySelector('#reviewComment')?.value?.trim() || null;

    try {
      if (msg) { msg.textContent = 'Submitting...'; msg.className = 'review-message'; }
      await submitRating(app.id, selectedScore, name, comment);
      await loadRatings();
      if (msg) { msg.textContent = 'Thank you!'; msg.className = 'review-message success'; }
      root.querySelector('#reviewName').value = '';
      root.querySelector('#reviewComment').value = '';
      selectedScore = 0;
      root.querySelectorAll('.js-rate-star').forEach((b) => b.classList.remove('active'));

      // Re-render ratings section
      const { appRatings } = getState();
      const section = root.querySelector('#ratingsSection');
      if (section && appRatings[app.id]) {
        section.innerHTML = renderRatingsBlock(appRatings[app.id]);
      }
    } catch (err) {
      if (msg) { msg.textContent = 'Failed. Please try again.'; msg.className = 'review-message error'; }
    }
  });
}
