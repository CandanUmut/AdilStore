"use client";

import { useState } from "react";
import { shareApp, appUrl } from "@/lib/sharing";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

interface ShareButtonProps {
  slug: string;
  name: string;
  description?: string;
  lang: Lang;
  variant?: "icon" | "full";
}

export default function ShareButton({
  slug,
  name,
  description,
  lang,
  variant = "full",
}: ShareButtonProps) {
  const T = translations[lang];
  const [msg, setMsg] = useState("");

  async function handleShare() {
    const url = appUrl(slug, window.location.origin);
    const result = await shareApp(name, url, description);
    if (result === "copied") {
      setMsg(T.buttons.copied);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(148,163,184,0.55)] bg-[var(--panel-soft)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
        title={T.buttons.share}
        aria-label={T.buttons.share}
      >
        🔗
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold border border-[rgba(148,163,184,0.7)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all"
    >
      <span>🔗</span>
      <span>{msg || T.buttons.share}</span>
    </button>
  );
}
