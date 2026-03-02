import { t } from '../lib/i18n.js';
import { getState } from '../lib/state.js';
import { isLoggedIn, isDeveloper } from '../lib/auth.js';
import { submitApp } from '../lib/api.js';
import { navigate } from '../lib/router.js';

const CATEGORIES = ['spiritual', 'wellness', 'learning', 'games', 'tools', 'environment', 'self-assessment'];
const PLATFORMS = ['Web', 'Android', 'iOS', 'Windows', 'macOS', 'Linux'];

export function renderSubmitAppPage(root) {
  if (!isLoggedIn()) {
    navigate('/login');
    return;
  }

  root.innerHTML = `
    <div class="submit-page">
      <a href="#/developer" class="back-link" data-link>← ${t('buttons.back')}</a>
      <h1>${t('submission.title')}</h1>
      <p class="text-soft">${t('submission.subtitle')}</p>

      <form id="submitAppForm" class="submit-form">
        <div class="form-row">
          <label class="form-label">
            <span>${t('submission.appName')} *</span>
            <input type="text" name="name" class="form-input" required maxlength="100" />
          </label>
          <label class="form-label">
            <span>${t('submission.appUrl')} *</span>
            <input type="url" name="url" class="form-input" required placeholder="https://" />
          </label>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span>${t('submission.category')} *</span>
            <select name="category" class="form-input" required>
              <option value="">--</option>
              ${CATEGORIES.map((c) => `<option value="${c}">${t(`categories.${c}`)}</option>`).join('')}
            </select>
          </label>
          <label class="form-label">
            <span>${t('submission.contactEmail')} *</span>
            <input type="email" name="contact_email" class="form-input" required value="${getState().user?.email || ''}" />
          </label>
        </div>

        <label class="form-label">
          <span>${t('submission.descriptionEn')} *</span>
          <textarea name="description_en" class="form-input" rows="4" required maxlength="2000"></textarea>
        </label>

        <label class="form-label">
          <span>${t('submission.descriptionTr')}</span>
          <textarea name="description_tr" class="form-input" rows="4" maxlength="2000"></textarea>
        </label>

        <div class="form-row">
          <label class="form-label">
            <span>${t('submission.tags')}</span>
            <input type="text" name="tags" class="form-input" placeholder="privacy, open-source, ..." maxlength="200" />
          </label>
          <label class="form-label">
            <span>${t('submission.version')}</span>
            <input type="text" name="version" class="form-input" placeholder="1.0.0" maxlength="20" />
          </label>
        </div>

        <label class="form-label">
          <span>${t('submission.platforms')}</span>
          <div class="checkbox-group">
            ${PLATFORMS.map((p) => `
              <label class="checkbox-label">
                <input type="checkbox" name="platforms" value="${p}" />
                <span>${p}</span>
              </label>
            `).join('')}
          </div>
        </label>

        <div class="form-row">
          <label class="form-label">
            <span>${t('submission.privacyUrl')}</span>
            <input type="url" name="privacy_url" class="form-input" placeholder="https://" />
          </label>
          <label class="form-label">
            <span>${t('submission.sourceUrl')}</span>
            <input type="url" name="source_url" class="form-input" placeholder="https://github.com/..." />
          </label>
        </div>

        <label class="form-label">
          <span>${t('submission.icon')}</span>
          <input type="file" name="icon_file" class="form-input" accept="image/*" />
          <span class="small text-soft">${t('submission.iconHint')}</span>
        </label>

        <label class="form-label">
          <span>${t('submission.extraNotes')}</span>
          <textarea name="extra_notes" class="form-input" rows="3" maxlength="2000"></textarea>
        </label>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg">
            <span class="icon">📤</span>
            <span>${t('buttons.submit')}</span>
          </button>
          <span class="submit-message" id="submitMessage"></span>
        </div>
      </form>
    </div>
  `;

  root.querySelector('.back-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/developer');
  });

  const form = root.querySelector('#submitAppForm');
  const msg = root.querySelector('#submitMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = t('submission.sending');
    msg.className = 'submit-message';

    const fd = new FormData(form);
    const iconFile = fd.get('icon_file');
    const selectedPlatforms = [...form.querySelectorAll('input[name="platforms"]:checked')].map((c) => c.value);
    const tags = (fd.get('tags') || '').split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: fd.get('name')?.trim(),
      url: fd.get('url')?.trim(),
      category: fd.get('category'),
      contact_email: fd.get('contact_email')?.trim(),
      description_en: fd.get('description_en')?.trim(),
      description_tr: fd.get('description_tr')?.trim() || null,
      tags_en: tags,
      platforms_en: selectedPlatforms,
      privacy_url: fd.get('privacy_url')?.trim() || null,
      source_url: fd.get('source_url')?.trim() || null,
      version: fd.get('version')?.trim() || '1.0.0',
      extra_notes: fd.get('extra_notes')?.trim() || null,
      developer_id: getState().developerProfile?.id || null,
    };

    try {
      await submitApp(payload, iconFile);
      form.reset();
      msg.textContent = t('submission.success');
      msg.className = 'submit-message success';
    } catch (err) {
      msg.textContent = t('submission.error');
      msg.className = 'submit-message error';
    }
  });
}
