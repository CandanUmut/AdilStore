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

const CATEGORY_COLORS: Record<string, string> = {
  spiritual:       "rgba(129,140,248,0.18)",
  wellness:        "rgba(52,211,153,0.15)",
  learning:        "rgba(56,189,248,0.15)",
  games:           "rgba(251,191,36,0.15)",
  tools:           "rgba(148,163,184,0.12)",
  environment:     "rgba(74,222,128,0.15)",
  "self-assessment": "rgba(249,115,115,0.14)",
};

const CATEGORY_TEXT: Record<string, string> = {
  spiritual:       "#a5b4fc",
  wellness:        "#6ee7b7",
  learning:        "#7dd3fc",
  games:           "#fcd34d",
  tools:           "#cbd5e1",
  environment:     "#86efac",
  "self-assessment": "#fca5a5",
};

function Stars({ avg }: { avg: number | null }) {
  const v = avg ?? 0;
  return (
    <span className="inline-flex gap-[2px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = v >= s;
        const half = !filled && v >= s - 0.5;
        return (
          <span
            key={s}
            className={`text-xs ${filled ? "star-filled" : half ? "star-half" : "star-empty"}`}
          >
            {filled || half ? "★" : "☆"}
          </span>
        );
      })}
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

  const catColor = CATEGORY_COLORS[app.category_id ?? ""] ?? "rgba(148,163,184,0.12)";
  const catText  = CATEGORY_TEXT[app.category_id ?? ""]  ?? "#94a3b8";

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
      className="relative rounded-[18px] border border-[var(--border-subtle)] bg-[var(--panel-card)] p-[14px_15px_13px] app-card-hover flex flex-col gap-2 overflow-hidden opacity-0 translate-y-3 animate-fade-up"
      data-app-id={app.id}
      data-category={app.category_id ?? ""}
      style={{
        animationFillMode: "forwards",
        boxShadow: "var(--shadow-card)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Subtle gradient accent in top-right */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30"
        style={{ background: catColor, filter: "blur(24px)" }}
        aria-hidden="true"
      />

      {/* Featured badge */}
      {app.is_featured && (
        <div
          className="absolute top-3 right-3 px-2 py-[3px] rounded-full text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{
            background: "linear-gradient(135deg, rgba(56,189,248,0.22), rgba(129,140,248,0.22))",
            border: "1px solid rgba(56,189,248,0.35)",
            color: "#7dd3fc",
          }}
        >
          ★ Featured
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 pr-14">
        <Link
          href={`/app/${app.slug}`}
          className="flex items-center gap-2.5 font-bold text-[13px] tracking-tight text-[var(--text)] hover:text-[var(--accent)] transition-colors"
        >
          <AppIcon app={app} size={36} />
          <span className="leading-snug">{app.name}</span>
        </Link>
      </div>

      {/* Category chip */}
      {app.category_id && (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.07em]"
            style={{ background: catColor, color: catText, border: `1px solid ${catText}33` }}
          >
            {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
          </span>
          {app.is_external && (
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.08em]">
              external
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <p className="text-[11.5px] leading-[1.6] text-[var(--text-soft)] m-0 line-clamp-3">
        {description}
      </p>

      {/* Store promise */}
      <p className="text-[10px] text-[var(--text-muted)] m-0 flex items-center gap-1">
        <span className="text-[var(--green)] opacity-80">✓</span>
        {T.storePromise}
      </p>

      {/* Tags + Platforms */}
      <div className="flex justify-between gap-1 items-start mt-0.5">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-1 rounded-full font-medium"
              style={{
                background: "var(--chip-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-col items-end gap-[3px] text-[10px] text-right shrink-0">
          {platforms.slice(0, 2).map((p) => (
            <span
              key={p}
              className="px-2 py-[3px] rounded-full whitespace-nowrap font-medium"
              style={{
                background: "var(--chip-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Rating */}
      {rating && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-soft)]">
          <Stars avg={rating.avg} />
          <span className="font-semibold text-[var(--text)]">
            {rating.avg ? rating.avg.toFixed(1) : "—"}
          </span>
          <span className="text-[var(--text-muted)]">
            {rating.count > 0 ? T.ratings.ratingCount(rating.count) : T.ratings.noRatings}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="h-px w-full bg-[var(--border-subtle)] mt-0.5" />

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
            color: "#031018",
            boxShadow: "var(--shadow-btn)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1.5px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(56,189,248,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-btn)";
          }}
          onClick={() => {
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
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold"
            style={{
              background: previewActive ? "var(--accent-soft)" : "var(--chip-bg)",
              border: `1px solid ${previewActive ? "var(--accent)" : "var(--border-subtle)"}`,
              color: previewActive ? "var(--accent)" : "var(--text-soft)",
              transition: "all 0.15s ease",
            }}
            onClick={() => setPreviewActive((v) => !v)}
          >
            <span>{previewActive ? "⏹" : "▶"}</span>
            <span>{previewActive ? T.buttons.hide : T.buttons.live}</span>
          </button>
        )}

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold"
          style={{
            background: shareMsg ? "var(--green-soft)" : "var(--chip-bg)",
            border: `1px solid ${shareMsg ? "rgba(52,211,153,0.35)" : "var(--border-subtle)"}`,
            color: shareMsg ? "var(--green)" : "var(--text-soft)",
            transition: "all 0.15s ease",
          }}
          onClick={handleShare}
        >
          <span>{shareMsg ? "✓" : "🔗"}</span>
          <span>{shareMsg || T.buttons.share}</span>
        </button>
      </div>

      {/* Inline preview */}
      {canPreview && previewActive && (
        <div
          className="mt-1 rounded-[14px] overflow-hidden"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <div
            className="px-3 py-2"
            style={{
              background: "var(--panel-strong)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-[11px] text-[var(--text-soft)] m-0">
              <strong>{T.preview.lead}</strong> {T.preview.body}
            </p>
          </div>
          <iframe
            src={app.preview_url ?? app.url}
            title={`${app.name} preview`}
            className="w-full min-h-[320px] border-0 bg-black block"
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
  size = 36,
}: {
  app: Pick<App, "name" | "icon_filename">;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const s = { width: size, height: size };
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (app.icon_filename && !imgError) {
    return (
      <span
        className="rounded-xl overflow-hidden flex-shrink-0 inline-flex"
        style={{ ...s, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
      >
        <img
          src={`${basePath}/icons/${app.icon_filename}`}
          alt={`${app.name} icon`}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  const letter = app.name.charAt(0).toUpperCase();
  return (
    <span
      className="rounded-xl flex items-center justify-center font-extrabold text-[#0b1120] flex-shrink-0"
      style={{
        ...s,
        fontSize: size * 0.44,
        background: "linear-gradient(135deg, #38bdf8, #6366f1)",
        boxShadow: "0 6px 20px rgba(56,189,248,0.4)",
      }}
    >
      {letter}
    </span>
  );
}
