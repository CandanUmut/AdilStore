import { t } from '../lib/i18n.js';
import { sanitizeHtml } from '../lib/sanitize.js';

export function renderFooter(container) {
  container.innerHTML = `
    <footer>
      <div class="footer-inner">
        <div class="footer-main">${sanitizeHtml(t('footer.line1'))}</div>
        <div class="footer-links">
          <a href="#/developer">${t('footer.developers')}</a>
          <span class="footer-sep">·</span>
          <span>${sanitizeHtml(t('footer.line2'))}</span>
        </div>
      </div>
    </footer>
  `;
}
