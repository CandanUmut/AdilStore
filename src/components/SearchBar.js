import { t } from '../lib/i18n.js';
import { setState, getState, subscribe } from '../lib/state.js';

export function renderSearchBar(container) {
  container.innerHTML = `
    <div class="search-inner" id="searchWrap">
      <span class="search-icon">🔍</span>
      <input id="searchInput" type="search" aria-label="Search apps" />
      <button class="search-clear" id="searchClear" type="button" aria-label="Clear search">×</button>
    </div>
    <div class="results-counter" id="resultsCounter"></div>
  `;

  const input = container.querySelector('#searchInput');
  const wrap = container.querySelector('#searchWrap');
  const clear = container.querySelector('#searchClear');

  input.placeholder = t('searchPlaceholder');

  input.addEventListener('input', () => {
    const q = input.value;
    wrap.classList.toggle('has-text', !!q);
    setState({ searchQuery: q });
  });

  clear.addEventListener('click', () => {
    input.value = '';
    wrap.classList.remove('has-text');
    setState({ searchQuery: '' });
    input.focus();
  });

  subscribe((state) => {
    input.placeholder = t('searchPlaceholder');
  });
}

export function updateResultsCount(count) {
  const el = document.getElementById('resultsCounter');
  if (!el) return;
  const label = count === 1 ? t('results.single') : t('results.plural');
  el.textContent = `${count} ${label}`;
}
