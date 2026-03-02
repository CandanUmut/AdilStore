"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ShareButton from "@/components/ShareButton";
import RatingWidget from "@/components/RatingWidget";
import type { App, Review } from "@/types/database.types";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

const PLAY_STORE_RE = /play\.google\.com/i;

interface AppDetailClientProps {
  app: App;
  reviews: Review[];
  ratingAvg: number | null;
}

function QRButton({ slug, lang }: { slug: string; lang: Lang }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  async function generateQR() {
    if (qrUrl) { setQrUrl(null); return; }
    const url = `${window.location.origin}/app/${slug}`;
    // Lazy-load qrcode library
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 2, color: { dark: "#e5e7eb", light: "#020617" } });
    setQrUrl(dataUrl);
  }

  const T = translations[lang];
  return (
    <div>
      <button
        type="button"
        onClick={generateQR}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold border border-[rgba(148,163,184,0.7)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all"
      >
        ▦ {T.appDetail.getQR}
      </button>
      {qrUrl && (
        <div className="mt-3 p-3 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[var(--panel)] inline-flex flex-col items-center gap-2">
          <img src={qrUrl} alt="QR code" className="rounded-lg" width={220} height={220} />
          <p className="text-[10px] text-[var(--text-soft)] m-0 text-center">
            Scan to open {/* eslint-disable-line */}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AppDetailClient({ app, reviews, ratingAvg }: AppDetailClientProps) {
  const [lang, setLang] = useState<Lang>("en");
  const T = translations[lang];

  const description =
    lang === "tr" && app.description_tr ? app.description_tr : app.description_en;
  const tags = (lang === "tr" && app.tags_tr?.length ? app.tags_tr : app.tags_en) ?? [];
  const platforms = (lang === "tr" && app.platforms_tr?.length ? app.platforms_tr : app.platforms_en) ?? [];
  const isPlayStore = PLAY_STORE_RE.test(app.url);
  const [previewActive, setPreviewActive] = useState(false);

  const latestForWidget = reviews.slice(0, 3).map((r) => ({
    nickname: r.nickname,
    score: r.score,
    comment: r.comment,
    created_at: r.created_at,
  }));

  return (
    <div className="min-h-screen">
      <Navbar lang={lang} onLangChange={setLang} />

      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--text-soft)] mb-4">
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">
            AdilStore
          </Link>
          {" › "}
          {app.category_id && (
            <>
              <Link
                href={`/?cat=${app.category_id}`}
                className="hover:text-[var(--accent)] transition-colors capitalize"
              >
                {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
              </Link>
              {" › "}
            </>
          )}
          <span className="text-[var(--text)]">{app.name}</span>
        </nav>

        <div className="grid md:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left column */}
          <div>
            {/* App header */}
            <div className="flex items-start gap-4 mb-4">
              {app.icon_filename ? (
                <Image
                  src={`/icons/${app.icon_filename}`}
                  alt={`${app.name} icon`}
                  width={72}
                  height={72}
                  className="rounded-2xl shadow-[0_12px_28px_rgba(56,189,248,0.32)] flex-shrink-0"
                />
              ) : (
                <span
                  className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#6366f1] flex items-center justify-center font-extrabold text-[#0b1120] text-2xl flex-shrink-0 shadow-[0_12px_28px_rgba(56,189,248,0.32)]"
                >
                  {app.name.charAt(0)}
                </span>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight m-0 mb-1">
                  {app.name}
                </h1>
                {app.category_id && (
                  <span className="text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-full bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.7)] text-[var(--text-soft)]">
                    {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
                  </span>
                )}
                {app.version && (
                  <span className="ml-2 text-[11px] text-[var(--text-soft)]">
                    v{app.version}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mb-5">
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-[0_10px_25px_rgba(56,189,248,0.6)] hover:shadow-[0_14px_32px_rgba(56,189,248,0.9)] hover:-translate-y-px transition-all"
                onClick={() => {
                  fetch("/api/install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ app_id: app.id, source: "direct" }),
                  }).catch(() => {});
                }}
              >
                <span>{isPlayStore ? "↗" : "🚀"}</span>
                <span>{isPlayStore ? T.buttons.openPlay : T.appDetail.openApp}</span>
              </a>

              <ShareButton slug={app.slug} name={app.name} description={description} lang={lang} />
              <QRButton slug={app.slug} lang={lang} />

              {!isPlayStore && app.preview_url && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold border border-[rgba(148,163,184,0.7)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all"
                  onClick={() => setPreviewActive((v) => !v)}
                >
                  <span>{previewActive ? "⏹" : "▶"}</span>
                  <span>{previewActive ? T.buttons.hide : T.buttons.live}</span>
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-[var(--text-soft)] mb-4">{description}</p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full bg-[var(--chip-bg)] border border-[rgba(148,163,184,0.5)] text-[var(--text-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Platforms */}
            {platforms.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-soft)] mb-2">
                  {T.appDetail.platforms}
                </p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] px-3 py-1 rounded-full border border-[rgba(148,163,184,0.5)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshots */}
            {app.screenshots && app.screenshots.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-soft)] mb-3">
                  {T.appDetail.screenshots}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {app.screenshots.map((path, i) => (
                    <img
                      key={i}
                      src={path}
                      alt={`Screenshot ${i + 1}`}
                      className="h-[200px] rounded-xl border border-[rgba(148,163,184,0.35)] object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inline preview */}
            {previewActive && app.preview_url && (
              <div className="rounded-[14px] overflow-hidden border border-[rgba(148,163,184,0.55)] bg-black mb-5">
                <div className="px-3 py-2 bg-[rgba(15,23,42,0.92)] border-b border-[rgba(148,163,184,0.5)]">
                  <p className="text-[11px] text-[var(--text-soft)] m-0">
                    <strong>{T.preview.lead}</strong> {T.preview.body}
                  </p>
                </div>
                <iframe
                  src={app.preview_url}
                  title={`${app.name} preview`}
                  className="w-full min-h-[420px] border-0 bg-black"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin allow-modals"
                />
              </div>
            )}

            {/* Reviews */}
            <div
              className="rounded-[18px] border border-[rgba(148,163,184,0.35)] p-5 bg-[var(--panel-soft)] shadow-soft"
            >
              <h2 className="text-base font-bold tracking-tight m-0 mb-1">
                {T.appDetail.reviews}
              </h2>
              <RatingWidget
                appId={app.id}
                initialAvg={ratingAvg}
                initialCount={reviews.length}
                latestReviews={latestForWidget}
                lang={lang}
              />

              {reviews.length > 0 && (
                <div className="mt-4 grid gap-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--panel)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">
                          {r.nickname ?? T.ratings.anonymous}
                          {r.is_verified_install && (
                            <span className="ml-2 text-[10px] text-green-400">✓ verified</span>
                          )}
                        </span>
                        <span className="text-xs text-yellow-400">
                          {"★".repeat(r.score)}{"☆".repeat(5 - r.score)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-[var(--text-soft)] m-0">{r.comment}</p>
                      )}
                      {r.developer_reply && (
                        <div className="mt-2 pl-3 border-l border-[var(--accent-soft)] text-xs text-[var(--text-soft)]">
                          <span className="text-[var(--accent)] font-medium">Developer reply: </span>
                          {r.developer_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 && (
                <p className="text-xs text-[var(--text-soft)] mt-2">{T.appDetail.noReviews}</p>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-[18px] border border-[rgba(148,163,184,0.35)] p-4 bg-[var(--panel)] shadow-soft">
              <div className="grid gap-3">
                {ratingAvg !== null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-soft)] mb-1">
                      Rating
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{ratingAvg.toFixed(1)}</span>
                      <span className="text-sm text-yellow-400">
                        {"★".repeat(Math.round(ratingAvg))}
                        {"☆".repeat(5 - Math.round(ratingAvg))}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-soft)] m-0">
                      {T.ratings.ratingCount(reviews.length)}
                    </p>
                  </div>
                )}

                {app.updated_at && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-soft)] mb-0.5">
                      {T.appDetail.lastUpdated}
                    </p>
                    <p className="text-xs text-[var(--text)] m-0">
                      {new Date(app.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-soft)] mb-1">
                    Principles
                  </p>
                  {["No ads", "No tracking", "No pay-to-win"].map((p) => (
                    <div key={p} className="flex items-center gap-1.5 text-xs text-[var(--text-soft)] mb-1">
                      <span className="text-green-400">✓</span> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Share CTA */}
            <div className="rounded-[18px] border border-[rgba(148,163,184,0.35)] p-4 bg-[var(--panel)] text-center">
              <p className="text-xs text-[var(--text-soft)] mb-3 m-0">
                Know someone who would love this app?
              </p>
              <ShareButton slug={app.slug} name={app.name} description={description} lang={lang} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
