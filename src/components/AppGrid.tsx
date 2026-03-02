"use client";

import { useState, useMemo } from "react";
import AppCard from "./AppCard";
import type { App } from "@/types/database.types";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

const CATEGORY_ORDER = [
  "all",
  "spiritual",
  "wellness",
  "learning",
  "games",
  "tools",
  "environment",
  "self-assessment",
];

interface RatingMap {
  [appId: string]: { avg: number | null; count: number };
}

interface AppGridProps {
  apps: App[];
  lang: Lang;
  ratings?: RatingMap;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function AppGrid({ apps, lang, ratings = {} }: AppGridProps) {
  const T = translations[lang];
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: apps.length };
    apps.forEach((a) => {
      if (a.category_id) base[a.category_id] = (base[a.category_id] ?? 0) + 1;
    });
    return base;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return apps.filter((app) => {
      if (category !== "all" && app.category_id !== category) return false;
      if (!q) return true;
      const desc = lang === "tr" && app.description_tr ? app.description_tr : app.description_en;
      const tags = (lang === "tr" && app.tags_tr?.length ? app.tags_tr : app.tags_en) ?? [];
      const haystack = normalize(`${app.name} ${desc} ${tags.join(" ")}`);
      return haystack.includes(q);
    });
  }, [apps, category, search, lang]);

  const featured = useMemo(() => apps.filter((a) => a.is_featured).slice(0, 4), [apps]);
  const heroApp = useMemo(() => {
    if (!apps.length) return null;
    const eligible = apps.filter((a) => a.url);
    if (!eligible.length) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return eligible[dayOfYear % eligible.length];
  }, [apps]);

  const resultLabel = filtered.length === 1 ? T.results.single : T.results.plural;

  return (
    <div className="w-full max-w-[1260px] mx-auto px-4 md:px-6 pb-8">
      {/* Hero */}
      {heroApp && (
        <section
          className="mt-4 mb-3 rounded-[18px] border border-[rgba(148,163,184,0.3)] p-5 md:p-6 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(99,102,241,0.1)), var(--panel)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.6)",
          }}
        >
          <div className="relative z-10 grid md:grid-cols-[1.2fr_0.9fr] gap-4 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.7)] text-[11px] tracking-[0.08em] text-[var(--text-soft)] uppercase mb-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-sky-500 shadow-[0_0_0_5px_rgba(34,197,94,0.2)]" />
                {T.heroKicker}
              </div>
              <h1 className="text-[clamp(26px,4vw,32px)] font-extrabold tracking-[-0.03em] m-0 mb-2">
                {T.heroTitle}
              </h1>
              <p className="text-sm leading-[1.65] text-[var(--text-soft)] max-w-[540px] m-0">
                {T.heroSubtitle}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(148,163,184,0.28)] bg-[rgba(56,189,248,0.12)] text-xs text-[var(--text)]">
                {T.heroNote}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {/* Daily hero app mini-card */}
              <div className="rounded-[18px] border border-[rgba(148,163,184,0.35)] p-3 bg-[var(--panel)] shadow-[0_18px_32px_rgba(0,0,0,0.28)]">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-soft)] mb-1">
                  {T.heroAppTagline}
                </p>
                <h2 className="text-base font-bold m-0 mb-1">{heroApp.name}</h2>
                <p className="text-[12px] text-[var(--text-soft)] m-0 leading-snug line-clamp-3">
                  {lang === "tr" && heroApp.description_tr
                    ? heroApp.description_tr
                    : heroApp.description_en}
                </p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <a
                    href={`/app/${heroApp.slug}`}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] hover:-translate-y-px transition-all"
                  >
                    🚀 {T.buttons.open}
                  </a>
                </div>
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: T.metrics.apps, value: String(apps.length) },
                  { label: T.metrics.privacy, value: T.metrics.privacyValue },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-3 rounded-[14px] bg-[var(--panel-strong)] border border-[rgba(148,163,184,0.45)] text-xs"
                  >
                    <div className="uppercase tracking-[0.08em] text-[var(--text-soft)] mb-1">
                      {m.label}
                    </div>
                    <div className="font-bold text-base text-[var(--text)]">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Controls bar */}
      <div
        className="mt-2 flex flex-wrap gap-3 items-center justify-between px-3 py-3 rounded-[18px] border border-[var(--border)] bg-[var(--panel-strong)] shadow-[0_12px_28px_rgba(15,23,42,0.3)] sticky top-0 z-20 backdrop-blur-md"
        style={{ top: "calc(var(--nav-height) - 6px)" }}
      >
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.filter(
            (cat) => T.categories[cat as keyof typeof T.categories]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                cat === category
                  ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-strong)] -translate-y-px shadow-[0_12px_24px_rgba(56,189,248,0.25)]"
                  : "bg-[rgba(15,23,42,0.82)] border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
              }`}
              onClick={() => setCategory(cat)}
            >
              <span>{T.categories[cat as keyof typeof T.categories]}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] opacity-90 font-variant-numeric tabular-nums">
                {counts[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="relative flex-1 max-w-[300px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-70 pointer-events-none">
              🔍
            </span>
            <input
              type="search"
              className="w-full pl-8 pr-8 py-2 rounded-full border border-[var(--border)] bg-[rgba(15,23,42,0.95)] text-[var(--text)] text-xs outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.5)] transition-all placeholder:text-[var(--text-soft)]"
              placeholder={T.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={T.searchPlaceholder}
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[rgba(255,255,255,0.08)] text-[var(--text-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] text-xs flex items-center justify-center"
                onClick={() => setSearch("")}
                aria-label={T.searchClear}
              >
                ×
              </button>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-soft)] whitespace-nowrap">
            {filtered.length} {resultLabel}
          </span>
        </div>
      </div>

      {/* Featured row */}
      {featured.length > 0 && (
        <>
          <div className="mt-6 mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold tracking-tight m-0">{T.featuredTitle}</h3>
          </div>
          <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
            {featured.map((app) => (
              <a
                key={app.id}
                href={`/app/${app.slug}`}
                className="relative rounded-[16px] p-[14px] border border-[rgba(148,163,184,0.35)] bg-gradient-to-[145deg] from-[rgba(56,189,248,0.16)] to-[rgba(99,102,241,0.12)] shadow-[0_16px_32px_rgba(0,0,0,0.35)] flex flex-col gap-2 snap-start min-h-[140px] hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(56,189,248,0.45)] hover:border-[var(--accent)] transition-all no-underline"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(56,189,248,0.16), rgba(99,102,241,0.12)), var(--panel-soft)",
                }}
              >
                <div className="flex items-center gap-2">
                  <AppCardIcon app={app} />
                  <div>
                    <p className="font-bold text-sm m-0 text-[var(--text)]">{app.name}</p>
                    {app.category_id && (
                      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-soft)]">
                        {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-soft)] m-0 leading-snug line-clamp-2">
                  {(lang === "tr" && app.description_tr
                    ? app.description_tr
                    : app.description_en
                  ).slice(0, 110)}
                  …
                </p>
              </a>
            ))}
          </div>
        </>
      )}

      {/* All apps grid */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight m-0">{T.allAppsTitle}</h3>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-[18px] border border-dashed border-[var(--border)] text-[var(--text-soft)] bg-[var(--panel-soft)] mt-2">
          <p className="font-medium m-0">{T.empty.title}</p>
          <p className="text-xs mt-1 m-0">{T.empty.subtitle}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-1">
          {filtered.map((app, idx) => (
            <div
              key={app.id}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <AppCard
                app={app}
                lang={lang}
                rating={ratings[app.id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppCardIcon({ app }: { app: Pick<App, "name" | "icon_filename"> }) {
  const size = 34;
  if (app.icon_filename) {
    return (
      <span
        className="rounded-xl overflow-hidden flex-shrink-0 inline-flex"
        style={{ width: size, height: size }}
      >
        <img
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
      className="rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#6366f1] flex items-center justify-center font-extrabold text-[#0b1120] flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.47 }}
    >
      {app.name.charAt(0)}
    </span>
  );
}
