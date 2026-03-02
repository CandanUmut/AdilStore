/**
 * AdilStore Share Link System
 *
 * URL structure:
 *   Canonical:  adilstore.com/app/[slug]
 *   Share:      adilstore.com/s/[6-char-token]
 *
 * Privacy: install tracking uses no IP, no cookies, no localStorage.
 * Only a hashed (user-agent + date-bucket) pseudonym within a 24h window.
 */

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const TOKEN_LENGTH = 6;

/** Generate a 6-character URL-safe share token */
export function generateShareToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Server-side fallback (Node.js)
    const nodeCrypto = require("crypto") as typeof import("crypto");
    const buf = nodeCrypto.randomBytes(TOKEN_LENGTH);
    buf.copy(Buffer.from(bytes.buffer));
  }
  return Array.from(bytes)
    .map((b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length])
    .join("");
}

/** Generate a slug from an app name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80); // max slug length
}

/** Build the canonical app URL */
export function appUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/app/${slug}`;
}

/** Build the share redirect URL */
export function shareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/s/${token}`;
}

/**
 * Create a privacy-preserving install fingerprint.
 * Hash = SHA-256(user-agent + YYYY-MM-DD)
 * This allows same-day deduplication without cross-day tracking.
 */
export async function hashInstallFingerprint(userAgent: string): Promise<string> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const data = `${userAgent}::${date}`;

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16); // First 16 hex chars — enough for dedup, not enough to identify
  }

  // Server-side Node.js fallback
  const nodeCrypto = require("crypto") as typeof import("crypto");
  return nodeCrypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand("copy");
    document.body.removeChild(el);
    return success;
  } catch {
    return false;
  }
}

/** Trigger Web Share API if available, otherwise copy to clipboard */
export async function shareApp(
  name: string,
  url: string,
  description?: string
): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: name, url, text: description });
      return "shared";
    } catch {
      // User cancelled — fall through to clipboard
    }
  }

  const copied = await copyToClipboard(url);
  return copied ? "copied" : "failed";
}
