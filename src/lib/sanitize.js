/**
 * Lightweight HTML sanitization.
 * Uses DOMPurify when available, falls back to text-only escaping.
 */

let purify = null;

export async function initSanitizer() {
  try {
    const mod = await import('dompurify');
    purify = mod.default || mod;
  } catch {
    // DOMPurify not available — use escape fallback
  }
}

/** Escape all HTML entities — use for user-generated text that should never contain HTML. */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Sanitize HTML — allows safe tags (strong, em, a, br). Use for trusted content only. */
export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  if (purify) {
    return purify.sanitize(dirty, { ALLOWED_TAGS: ['strong', 'em', 'a', 'br', 'code'], ALLOWED_ATTR: ['href', 'target', 'rel'] });
  }
  return escapeHtml(dirty);
}
