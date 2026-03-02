import { t } from '../lib/i18n.js';
import { isAdmin } from '../lib/auth.js';
import { loadReviewQueue, reviewSubmission } from '../lib/api.js';
import { escapeHtml } from '../lib/sanitize.js';
import { navigate } from '../lib/router.js';

export async function renderAdminReviewPage(root) {
  if (!isAdmin()) {
    navigate('/');
    return;
  }

  root.innerHTML = `
    <div class="admin-page">
      <a href="#/" class="back-link" data-link>← ${t('buttons.back')}</a>
      <h1>${t('review.queueTitle')}</h1>
      <div id="reviewQueue"><p class="text-soft">Loading...</p></div>
    </div>
  `;

  root.querySelector('.back-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/');
  });

  try {
    const queue = await loadReviewQueue();
    const container = root.querySelector('#reviewQueue');

    if (!queue.length) {
      container.innerHTML = '<p class="text-soft">No pending submissions.</p>';
      return;
    }

    container.innerHTML = queue.map((item) => `
      <div class="review-card" data-id="${item.id}">
        <div class="review-card-header">
          <h3>${escapeHtml(item.name || item.app_name || 'Unnamed')}</h3>
          <span class="status-badge status-pending">Pending</span>
        </div>
        <div class="review-card-body">
          <p><strong>URL:</strong> <a href="${escapeHtml(item.url || item.app_url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(item.url || item.app_url || '-')}</a></p>
          <p><strong>Category:</strong> ${escapeHtml(item.category || '-')}</p>
          <p><strong>Email:</strong> ${escapeHtml(item.contact_email || '-')}</p>
          <p><strong>Description:</strong> ${escapeHtml(item.description_en || item.description || '-')}</p>
          ${item.extra_notes ? `<p><strong>Notes:</strong> ${escapeHtml(item.extra_notes)}</p>` : ''}
          ${item.privacy_url ? `<p><strong>Privacy:</strong> <a href="${escapeHtml(item.privacy_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.privacy_url)}</a></p>` : ''}
          ${item.source_url ? `<p><strong>Source:</strong> <a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.source_url)}</a></p>` : ''}
        </div>
        <div class="review-card-actions">
          <textarea class="form-input review-notes" placeholder="${t('review.notes')}" rows="2"></textarea>
          <div class="review-buttons">
            <button class="btn btn-primary btn-sm js-review-action" data-action="approved" type="button">${t('review.approve')}</button>
            <button class="btn btn-ghost btn-sm js-review-action" data-action="changes_requested" type="button">${t('review.requestChanges')}</button>
            <button class="btn btn-danger btn-sm js-review-action" data-action="rejected" type="button">${t('review.reject')}</button>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.js-review-action').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.review-card');
        const id = card.dataset.id;
        const notes = card.querySelector('.review-notes')?.value?.trim() || null;
        const action = btn.dataset.action;

        btn.disabled = true;
        try {
          await reviewSubmission(id, action, notes);
          card.remove();
          if (!container.querySelector('.review-card')) {
            container.innerHTML = '<p class="text-soft">No pending submissions.</p>';
          }
        } catch (err) {
          alert('Failed: ' + err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    root.querySelector('#reviewQueue').innerHTML = `<p class="text-soft">Failed to load queue.</p>`;
  }
}
