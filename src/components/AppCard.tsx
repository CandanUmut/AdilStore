"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { App } from "@/types/database.types";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import { shareApp, appUrl } from "@/lib/sharing";

interface RatingInfo {
  avg: number | null;
  count: number;
}

interface AppCardProps {
  app: App;
  lang: Lang;
  rating?: RatingInfo;
}

const PLAY_STORE_RE = /play\.google\.com/i;

function StarDisplay({ avg }: { avg: number | null }) {
  const stars = [1, 2, 3, 4, 5];
  const filled = avg ? Math.floor(avg) : 0;
  const hasHalf = avg ? avg - filled >= 0.5 : false;

  return (
    <span className="flex gap-[2px] text-xs" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s}
          className={
            s <= filled
              ? "text-yellow-400"
              : s === filled + 1 && hasHalf
              ? "text-yellow-300 opacity-80"
              : "text-[rgba(148,163,184,0.7)]"
          }
        >
          {s <= filled || (s === filled + 1 && hasHalf) ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export default function AppCard({ app, lang, rating }: AppCardProps) {
  const T = translations[lang];
  const [previewActive, setPreviewActive] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const isPlayStore = PLAY_STORE_RE.test(app.url);
  const canPreview = !isPlayStore && !!app.preview_url;
  const description =
    lang === "tr" && app.description_tr ? app.description_tr : app.description_en;
  const tags = (lang === "tr" && app.tags_tr?.length ? app.tags_tr : app.tags_en) ?? [];
  const platforms = (lang === "tr" && app.platforms_tr?.length ? app.platforms_tr : app.platforms_en) ?? [];

  async function handleShare() {
    const url = appUrl(app.slug, typeof window !== "undefined" ? window.location.origin : "");
    const result = await shareApp(app.name, url, description);
    if (result === "copied") {
      setShareMsg(T.buttons.copied);
      setTimeout(() => setShareMsg(""), 2000);
    }
  }

  return (
    <article
      className="relative rounded-[18px] border border-[rgba(148,163,184,0.4)] bg-[var(--panel-soft)] p-[14px_14px_13px] shadow-[0_14px_30px_rgba(15,23,42,0.58)] flex flex-col gap-2 app-card-hover overflow-hidden opacity-0 translate-y-3 animate-fade-up"
      data-app-id={app.id}
      data-category={app.category_id ?? ""}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/app/${app.slug}`}
          className="flex items-center gap-2 font-bold text-sm tracking-tight text-[var(--text)] hover:text-[var(--accent)] transition-colors"
        >
          <AppIcon app={app} size={34} />
          {app.name}
        </Link>
        {app.category_id && (
          <span className="text-[10px] uppercase tracking-[0.08em] px-[9px] py-1 rounded-full bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.7)] text-[var(--text-soft)] whitespace-nowrap flex-shrink-0">
            {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-[1.55] text-[var(--text-soft)] m-0">{description}</p>

      <p className="text-[10px] text-[var(--text-soft)]">{T.storePromise}</p>

      {/* Tags + Platforms */}
      <div className="flex justify-between gap-1 items-start mt-1">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-1 rounded-full bg-[var(--chip-bg)] border border-[rgba(148,163,184,0.5)] text-[var(--text-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-col items-end gap-[2px] text-[10px] text-right text-[var(--text-soft)]">
          {platforms.slice(0, 2).map((p) => (
            <span
              key={p}
              className="px-2 py-1 rounded-full border border-[rgba(148,163,184,0.5)] bg-[rgba(15,23,42,0.9)] whitespace-nowrap"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Rating summary */}
      {rating && (
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-soft)]">
          <StarDisplay avg={rating.avg} />
          <span>
            {rating.avg ? `${rating.avg.toFixed(1)} · ` : ""}
            {rating.count > 0
              ? T.ratings.ratingCount(rating.count)
              : T.ratings.noRatings}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1 flex-wrap">
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-[0_10px_25px_rgba(56,189,248,0.6)] hover:shadow-[0_14px_32px_rgba(56,189,248,0.9)] hover:-translate-y-[1.5px] transition-all"
          onClick={() => {
            // record install (fire-and-forget)
            fetch("/api/install", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ app_id: app.id, source: "direct" }),
            }).catch(() => {});
          }}
        >
          <span>{isPlayStore ? "↗" : "🚀"}</span>
          <span>{isPlayStore ? T.buttons.openPlay : T.buttons.open}</span>
        </a>

        {canPreview && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold bg-[rgba(15,23,42,0.9)] border border-[rgba(148,163,184,0.7)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all"
            onClick={() => setPreviewActive((v) => !v)}
          >
            <span>{previewActive ? "⏹" : "▶"}</span>
            <span>{previewActive ? T.buttons.hide : T.buttons.live}</span>
          </button>
        )}

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold bg-[rgba(15,23,42,0.9)] border border-[rgba(148,163,184,0.7)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all"
          onClick={handleShare}
        >
          <span>🔗</span>
          <span>{shareMsg || T.buttons.share}</span>
        </button>
      </div>

      {/* Inline preview */}
      {canPreview && previewActive && (
        <div className="mt-2 rounded-[14px] overflow-hidden border border-[rgba(148,163,184,0.55)] bg-black">
          <div className="px-3 py-2 bg-[rgba(15,23,42,0.92)] border-b border-[rgba(148,163,184,0.5)]">
            <p className="text-[11px] text-[var(--text-soft)] m-0">
              <strong>{T.preview.lead}</strong> {T.preview.body}
            </p>
            <p className="text-[11px] text-[var(--text-soft)] m-0">{T.preview.fallback}</p>
          </div>
          <iframe
            src={app.preview_url ?? app.url}
            title={`${app.name} preview`}
            className="w-full min-h-[360px] border-0 bg-black"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin allow-modals"
          />
        </div>
      )}
    </article>
  );
}

export function AppIcon({
  app,
  size = 34,
}: {
  app: Pick<App, "name" | "icon_filename">;
  size?: number;
}) {
  const sizeStyle = { width: size, height: size };

  if (app.icon_filename) {
    return (
      <span
        className="rounded-xl overflow-hidden flex-shrink-0 inline-flex"
        style={sizeStyle}
      >
        <Image
          src={`/icons/${app.icon_filename}`}
          alt={`${app.name} icon`}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </span>
    );
  }

  return (
    <span
      className="rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#6366f1] flex items-center justify-center font-extrabold text-[#0b1120] flex-shrink-0 shadow-[0_10px_26px_rgba(56,189,248,0.45)]"
      style={{ ...sizeStyle, fontSize: size * 0.47 }}
    >
      {app.name.charAt(0)}
    </span>
  );
}
