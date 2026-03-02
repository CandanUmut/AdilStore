import { t } from '../lib/i18n.js';
import { getState, subscribe } from '../lib/state.js';
import { getLocalizedText, getLocalizedList } from '../lib/i18n.js';
import { renderHeroSection } from '../components/HeroSection.js';
import { renderFilters } from '../components/Filters.js';
import { renderSearchBar, updateResultsCount } from '../components/SearchBar.js';
import { renderFeaturedRow } from '../components/FeaturedRow.js';
import { createAppCard } from '../components/AppCard.js';
import { renderFooter } from '../components/Footer.js';

export function renderHomePage(root) {
  root.innerHTML = `
    <div id="heroContainer"></div>

    <div class="controls-bar">
      <div class="filters" id="filtersContainer" aria-label="Category filters"></div>
      <div class="search-wrap" id="searchContainer"></div>
    </div>

    <section class="section-heading" aria-label="Featured apps">
      <h3>${t('featuredTitle')}</h3>
    </section>
    <div class="featured-row" id="featuredContainer"></div>

    <main aria-label="App grid">
      <div class="section-heading">
        <h3>${t('allAppsTitle')}</h3>
      </div>
      <div class="app-grid" id="appGrid"></div>
      <div class="empty-state" id="emptyState" style="display:none">
        <div>${t('empty.title')}</div>
        <div class="small">${t('empty.subtitle')}</div>
      </div>
    </main>

    <div id="footerContainer"></div>
  `;

  const heroContainer = root.querySelector('#heroContainer');
  const filtersContainer = root.querySelector('#filtersContainer');
  const searchContainer = root.querySelector('#searchContainer');
  const featuredContainer = root.querySelector('#featuredContainer');

  renderHeroSection(heroContainer);
  renderFilters(filtersContainer);
  renderSearchBar(searchContainer);
  renderFeaturedRow(featuredContainer);
  renderAppGrid();
  renderFooter(root.querySelector('#footerContainer'));

  // Observe intersection for card animations
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  function observeCards() {
    root.querySelectorAll('.app-card').forEach((card) => io.observe(card));
  }

  const unsubscribe = subscribe(() => {
    renderFilters(filtersContainer);
    renderFeaturedRow(featuredContainer);
    renderHeroSection(heroContainer);
    renderAppGrid();
    observeCards();
  });

  renderAppGrid();
  observeCards();

  // Return cleanup function
  return () => {
    unsubscribe();
    io.disconnect();
  };
}

function renderAppGrid() {
  const grid = document.getElementById('appGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;

  const filtered = getFilteredApps();
  grid.innerHTML = '';

  if (!filtered.length) {
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
  }

  filtered.forEach((app, idx) => {
    const card = createAppCard(app);
    card.style.animationDelay = `${idx * 40}ms`;
    grid.appendChild(card);
  });

  updateResultsCount(filtered.length);
}

function getFilteredApps() {
  const { apps, currentCategory, searchQuery } = getState();
  const query = (searchQuery || '').trim().toLowerCase();

  return apps.filter((app) => {
    if (currentCategory !== 'all' && app.category !== currentCategory) return false;
    if (!query) return true;

    const desc = getLocalizedText(app.description);
    const tags = getLocalizedList(app.tags);
    const haystack = `${app.name} ${desc} ${tags.join(' ')}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    const needle = query.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return haystack.includes(needle);
  });
}
