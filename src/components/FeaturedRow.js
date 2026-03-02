import { getState } from '../lib/state.js';
import { getLocalizedText } from '../lib/i18n.js';
import { escapeHtml } from '../lib/sanitize.js';
import { navigate } from '../lib/router.js';

export function renderFeaturedRow(container) {
  const { apps } = getState();
  container.innerHTML = '';

  const featured = apps.filter((a) => a.isFeatured);
  const picks = featured.length ? featured.slice(0, 5) : apps.slice(0, 3);

  picks.forEach((app) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'featured-card';
    const desc = escapeHtml(getLocalizedText(app.description));
    const iconHtml = app.iconFilename
      ? `<img src="./icons/${escapeHtml(app.iconFilename)}" alt="" class="app-icon-img" loading="lazy" />`
      : escapeHtml(app.name.charAt(0));

    card.innerHTML = `
      <div class="featured-meta">
        <span class="app-icon">${iconHtml}</span>
        <div>
          <p class="featured-title">${escapeHtml(app.name)}</p>
        </div>
      </div>
      <p class="featured-desc">${desc.slice(0, 110)}${desc.length > 110 ? '…' : ''}</p>
    `;
    card.addEventListener('click', () => navigate(`/app/${app.slug || app.id}`));
    container.appendChild(card);
  });
}
