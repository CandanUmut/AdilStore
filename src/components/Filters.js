import { t } from '../lib/i18n.js';
import { getState, setState } from '../lib/state.js';

const CATEGORY_ORDER = ['all', 'spiritual', 'wellness', 'learning', 'games', 'tools', 'environment', 'self-assessment'];

export function renderFilters(container) {
  const { apps, currentCategory } = getState();
  const counts = countByCategory(apps);

  container.innerHTML = '';
  CATEGORY_ORDER.forEach((cat) => {
    const label = t(`categories.${cat}`);
    if (!label) return;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'filter-pill' + (cat === currentCategory ? ' active' : '');
    pill.dataset.category = cat;
    pill.innerHTML = `<span>${label}</span><span class="count">${counts[cat] || 0}</span>`;
    container.appendChild(pill);
  });

  container.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    const category = pill.dataset.category;
    if (category && category !== getState().currentCategory) {
      setState({ currentCategory: category });
    }
  });
}

function countByCategory(apps) {
  const base = { all: apps.length };
  return apps.reduce((acc, app) => {
    acc[app.category] = (acc[app.category] || 0) + 1;
    return acc;
  }, base);
}
