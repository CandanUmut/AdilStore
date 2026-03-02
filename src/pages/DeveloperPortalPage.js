import { t } from '../lib/i18n.js';
import { getState, subscribe } from '../lib/state.js';
import { isLoggedIn, isDeveloper, applyAsDeveloper } from '../lib/auth.js';
import { loadDeveloperApps } from '../lib/api.js';
import { escapeHtml } from '../lib/sanitize.js';
import { navigate } from '../lib/router.js';

export async function renderDeveloperPortalPage(root) {
  if (!isLoggedIn()) {
    navigate('/login');
    return;
  }

  const { developerProfile } = getState();

  if (!developerProfile) {
    renderApplyForm(root);
    return;
  }

  if (developerProfile.status === 'pending_review') {
    root.innerHTML = `
      <div class="dev-portal">
        <h1>${t('developer.portalTitle')}</h1>
        <div class="notice notice-info">
          <p>${t('developer.pending')}</p>
        </div>
      </div>
    `;
    return;
  }

  if (developerProfile.status === 'rejected') {
    root.innerHTML = `
      <div class="dev-portal">
        <h1>${t('developer.portalTitle')}</h1>
        <div class="notice notice-error">
          <p>${t('developer.rejected')}</p>
        </div>
      </div>
    `;
    return;
  }

  // Approved developer — show dashboard
  renderDashboard(root, developerProfile);
}

function renderApplyForm(root) {
  const { user } = getState();

  root.innerHTML = `
    <div class="dev-portal">
      <h1>${t('developer.applyTitle')}</h1>
      <p class="text-soft">${t('developer.applySubtitle')}</p>
      <form id="devApplyForm" class="submit-form">
        <label class="form-label">
          <span>${t('auth.displayName')}</span>
          <input type="text" name="displayName" class="form-input" required value="${escapeHtml(user?.user_metadata?.display_name || '')}" />
        </label>
        <label class="form-label">
          <span>${t('auth.email')}</span>
          <input type="email" name="email" class="form-input" required value="${escapeHtml(user?.email || '')}" />
        </label>
        <label class="form-label">
          <span>${t('developer.website')}</span>
          <input type="url" name="website" class="form-input" placeholder="https://" />
        </label>
        <label class="form-label">
          <span>${t('developer.description')}</span>
          <textarea name="description" class="form-input" rows="4"></textarea>
        </label>
        <div class="auth-error" id="applyError" hidden></div>
        <button type="submit" class="btn btn-primary">${t('buttons.submit')}</button>
      </form>
    </div>
  `;

  const form = root.querySelector('#devApplyForm');
  const errorEl = root.querySelector('#applyError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    try {
      await applyAsDeveloper({
        displayName: form.displayName.value.trim(),
        email: form.email.value.trim(),
        website: form.website.value.trim(),
        description: form.description.value.trim(),
      });
      renderDeveloperPortalPage(root);
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to submit';
      errorEl.hidden = false;
    }
  });
}

async function renderDashboard(root, profile) {
  root.innerHTML = `
    <div class="dev-portal">
      <div class="dev-header">
        <h1>${t('developer.dashboardTitle')}</h1>
        <button class="btn btn-primary" id="submitAppBtn" type="button">
          + ${t('developer.submitApp')}
        </button>
      </div>
      <div class="dev-stats" id="devStats">
        <div class="stat-card">
          <div class="stat-label">Total Apps</div>
          <div class="stat-value" id="statApps">-</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('developer.installs')}</div>
          <div class="stat-value" id="statInstalls">-</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('developer.ratings')}</div>
          <div class="stat-value" id="statRating">-</div>
        </div>
      </div>
      <div class="dev-apps-list" id="devAppsList">
        <p class="text-soft">Loading your apps...</p>
      </div>
    </div>
  `;

  root.querySelector('#submitAppBtn')?.addEventListener('click', () => navigate('/developer/submit'));

  try {
    const apps = await loadDeveloperApps(profile.id);

    root.querySelector('#statApps').textContent = apps.length;

    const listEl = root.querySelector('#devAppsList');
    if (!apps.length) {
      listEl.innerHTML = '<p class="text-soft">You haven\'t submitted any apps yet.</p>';
      return;
    }

    listEl.innerHTML = `
      <table class="dev-apps-table">
        <thead>
          <tr>
            <th>App</th>
            <th>${t('developer.status')}</th>
            <th>${t('developer.versions')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${apps.map((app) => `
            <tr>
              <td>
                <strong>${escapeHtml(app.name)}</strong>
                <span class="small text-soft">${escapeHtml(app.slug)}</span>
              </td>
              <td><span class="status-badge status-${app.status}">${app.status}</span></td>
              <td>${escapeHtml(app.version || '1.0')}</td>
              <td>
                <a href="#/app/${encodeURIComponent(app.slug || app.id)}" class="btn btn-ghost btn-xs" data-link>View</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    listEl.querySelectorAll('a[data-link]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(a.getAttribute('href').replace('#', ''));
      });
    });
  } catch (err) {
    root.querySelector('#devAppsList').innerHTML = `<p class="text-soft">Failed to load apps.</p>`;
  }
}
