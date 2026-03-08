"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import AppCard, { AppIcon } from "./AppCard";
import type { App } from "@/types/database.types";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

const CATEGORIES = [
  { id: "all",             icon: "🏠" },
  { id: "spiritual",       icon: "🌙" },
  { id: "wellness",        icon: "🌿" },
  { id: "learning",        icon: "📚" },
  { id: "games",           icon: "🎮" },
  { id: "tools",           icon: "🔧" },
  { id: "environment",     icon: "🌍" },
  { id: "self-assessment", icon: "🔍" },
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
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function AppGrid({ apps, lang, ratings = {} }: AppGridProps) {
  const T = translations[lang];
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Press "/" or Ctrl+K to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      return normalize(`${app.name} ${desc} ${tags.join(" ")}`).includes(q);
    });
  }, [apps, category, search, lang]);

  const featured = useMemo(() => apps.filter((a) => a.is_featured).slice(0, 6), [apps]);
  const heroApp = useMemo(() => {
    if (!apps.length) return null;
    const eligible = apps.filter((a) => a.url);
    if (!eligible.length) return null;
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return eligible[day % eligible.length];
  }, [apps]);

  const resultLabel = filtered.length === 1 ? T.results.single : T.results.plural;

  return (
    <div className="w-full max-w-[1260px] mx-auto px-4 md:px-6 pb-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      {heroApp && (
        <section
          className="mt-4 mb-4 rounded-[22px] border overflow-hidden relative"
          style={{
            borderColor: "rgba(56,189,248,0.18)",
            background:
              "radial-gradient(ellipse 70% 80% at 0% 60%, rgba(56,189,248,0.09) 0%, transparent 60%)," +
              "radial-gradient(ellipse 50% 60% at 100% 20%, rgba(129,140,248,0.09) 0%, transparent 55%)," +
              "var(--panel)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          }}
        >
          {/* Top accent line */}
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.5), rgba(129,140,248,0.4), transparent)" }}
          />

          <div className="p-5 md:p-7 grid md:grid-cols-[1.4fr_0.9fr] gap-5 items-start">
            {/* Left: branding */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] tracking-[0.08em] uppercase mb-3 font-medium"
                style={{
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  color: "var(--green)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse-ring"
                  style={{ background: "var(--green)", flexShrink: 0 }}
                />
                {T.heroKicker}
              </div>

              <h1
                className="font-extrabold tracking-[-0.03em] m-0 mb-3"
                style={{ fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.15 }}
              >
                <span className="gradient-text">{T.heroTitle}</span>
              </h1>

              <p className="text-sm leading-[1.7] text-[var(--text-soft)] m-0 max-w-[540px]">
                {T.heroSubtitle}
              </p>

              <div
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  color: "var(--text)",
                }}
              >
                {T.heroNote}
              </div>

              {/* Stats row */}
              <div className="mt-4 flex gap-3 flex-wrap">
                {[
                  { value: String(apps.length), label: T.metrics.apps },
                  { value: T.metrics.privacyValue, label: T.metrics.privacy },
                  { value: String(CATEGORIES.length - 1), label: "categories" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col px-3 py-2 rounded-[12px]"
                    style={{
                      background: "var(--panel-strong)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: 70,
                    }}
                  >
                    <span className="font-extrabold text-base text-[var(--text)]">{stat.value}</span>
                    <span className="text-[10px] uppercase tracking-[0.07em] text-[var(--text-muted)]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: daily hero app */}
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.1em] font-semibold mb-2"
                style={{ color: "var(--accent)" }}
              >
                {T.heroAppTagline}
              </p>
              <Link
                href={`/app/${heroApp.slug}`}
                className="block rounded-[16px] p-4 no-underline featured-card"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(129,140,248,0.08))," +
                    "var(--panel-strong)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <AppIcon app={heroApp} size={44} />
                  <div>
                    <p className="font-bold text-sm m-0 text-[var(--text)] leading-snug">{heroApp.name}</p>
                    {heroApp.category_id && (
                      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {T.categories[heroApp.category_id as keyof typeof T.categories] ?? heroApp.category_id}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-soft)] m-0 leading-snug line-clamp-3">
                  {lang === "tr" && heroApp.description_tr ? heroApp.description_tr : heroApp.description_en}
                </p>
                <div
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
                    color: "#031018",
                  }}
                >
                  🚀 {T.buttons.open}
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div
        className="mt-2 flex flex-wrap gap-2.5 items-center justify-between px-3 py-3 rounded-[18px] sticky z-20 backdrop-blur-lg"
        style={{
          top: "calc(var(--nav-height) - 6px)",
          background: "var(--panel-strong)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter(
            ({ id }) => T.categories[id as keyof typeof T.categories]
          ).map(({ id, icon }) => (
            <button
              key={id}
              type="button"
              className={`cat-btn ${id === category ? "active" : ""}`}
              onClick={() => setCategory(id)}
            >
              <span>{icon}</span>
              <span>{T.categories[id as keyof typeof T.categories]}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {counts[id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="relative flex-1 max-w-[280px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">
              🔍
            </span>
            <input
              ref={searchRef}
              type="search"
              className="w-full pl-8 pr-16 py-2 rounded-full text-xs outline-none"
              style={{
                background: "var(--chip-bg)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-subtle)";
                e.target.style.boxShadow = "";
              }}
              placeholder={T.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={T.searchPlaceholder}
            />
            {!search && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded pointer-events-none hidden sm:flex items-center gap-0.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
              >
                /
              </span>
            )}
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text-muted)",
                  transition: "background 0.15s ease",
                }}
                onClick={() => setSearch("")}
                aria-label={T.searchClear}
              >
                ×
              </button>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
            <span className="font-bold text-[var(--text-soft)]">{filtered.length}</span> {resultLabel}
          </span>
        </div>
      </div>

      {/* ── Featured row ──────────────────────────────────────────── */}
      {featured.length > 0 && (
        <>
          <div className="mt-7 mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight m-0">{T.featuredTitle}</h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid rgba(56,189,248,0.3)",
                color: "var(--accent)",
              }}
            >
              {featured.length}
            </span>
          </div>
          <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {featured.map((app) => (
              <Link
                key={app.id}
                href={`/app/${app.slug}`}
                className="relative rounded-[16px] p-4 flex flex-col gap-2 snap-start min-h-[130px] no-underline featured-card"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(56,189,248,0.12), rgba(99,102,241,0.08))," +
                    "var(--panel-soft)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <FeaturedIcon app={app} />
                  <div>
                    <p className="font-bold text-[13px] m-0 text-[var(--text)] leading-snug">{app.name}</p>
                    {app.category_id && (
                      <span className="text-[10px] uppercase tracking-[0.07em] text-[var(--text-muted)]">
                        {T.categories[app.category_id as keyof typeof T.categories] ?? app.category_id}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-soft)] m-0 leading-snug line-clamp-2">
                  {(lang === "tr" && app.description_tr ? app.description_tr : app.description_en).slice(0, 100)}…
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── All apps grid ─────────────────────────────────────────── */}
      <div className="mt-7 mb-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight m-0">{T.allAppsTitle}</h3>
          {search && (
            <span className="text-[10px] text-[var(--text-muted)]">· &ldquo;{search}&rdquo;</span>
          )}
        </div>
        <span className="text-[11px] text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-soft)]">{filtered.length}</span>
          {" "}{filtered.length === 1 ? T.results.single : T.results.plural}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-12 px-4 rounded-[18px] mt-2"
          style={{
            border: "1px dashed var(--border-subtle)",
            background: "var(--panel-soft)",
          }}
        >
          <p className="text-3xl m-0 mb-2">🔍</p>
          <p className="font-semibold m-0 text-[var(--text-soft)]">{T.empty.title}</p>
          <p className="text-xs mt-1 m-0 text-[var(--text-muted)]">{T.empty.subtitle}</p>
          {(search || category !== "all") && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid rgba(56,189,248,0.35)",
                    color: "var(--accent)",
                  }}
                >
                  Clear search
                </button>
              )}
              {category !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--chip-bg)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  Show all categories
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 mt-1"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}
        >
          {filtered.map((app, idx) => (
            <div key={app.id} style={{ animationDelay: `${idx * 30}ms` }}>
              <AppCard app={app} lang={lang} rating={ratings[app.id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedIcon({ app }: { app: Pick<App, "name" | "icon_filename"> }) {
  const [imgError, setImgError] = useState(false);
  const size = 36;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (app.icon_filename && !imgError) {
    return (
      <span
        className="rounded-xl overflow-hidden flex-shrink-0 inline-flex"
        style={{ width: size, height: size, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
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
  return (
    <span
      className="rounded-xl flex items-center justify-center font-extrabold text-[#0b1120] flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: "linear-gradient(135deg, #38bdf8, #6366f1)",
        boxShadow: "0 4px 14px rgba(56,189,248,0.4)",
      }}
    >
      {app.name.charAt(0)}
    </span>
  );
}
