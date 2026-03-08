"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppGrid from "@/components/AppGrid";
import type { App } from "@/types/database.types";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

interface HomeClientProps {
  apps: App[];
  initialRatings: Record<string, { avg: number | null; count: number }>;
}

export default function HomeClient({ apps, initialRatings }: HomeClientProps) {
  const [lang, setLang] = useState<Lang>("en");
  const T = translations[lang];

  return (
    <div className="min-h-screen">
      <Navbar lang={lang} onLangChange={setLang} />
      <AppGrid apps={apps} lang={lang} ratings={initialRatings} />

      {/* Submit CTA */}
      <section className="max-w-[1260px] mx-auto px-4 md:px-6 mt-2 mb-3">
        <div
          className="rounded-[18px] p-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(129,140,248,0.06))," +
              "var(--panel-strong)",
            border: "1px solid rgba(56,189,248,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}
        >
          {/* Decorative blob */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: "rgba(129,140,248,0.5)", filter: "blur(32px)" }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-bold tracking-tight m-0 mb-1">{T.submit.title}</h3>
          <p className="text-xs text-[var(--text-soft)] mb-3 m-0 max-w-[480px]">{T.submit.subtitle}</p>
          <a
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold"
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
          >
            📤 {T.submit.button}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="max-w-[1260px] mx-auto px-4 md:px-6 mt-4 pb-10 pt-6"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-extrabold text-sm text-[var(--text)] m-0 mb-1">AdilStore</p>
            <p className="text-xs text-[var(--text-muted)] m-0 max-w-[320px] leading-relaxed"
               dangerouslySetInnerHTML={{ __html: T.footer.line1 }} />
            <p className="text-xs text-[var(--text-muted)] m-0 mt-1"
               dangerouslySetInnerHTML={{ __html: T.footer.line2 }} />
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: "var(--green-soft)", border: "1px solid rgba(52,211,153,0.2)", color: "var(--green)" }}
            >
              ✓ No ads. No tracking. No pay-to-win.
            </span>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <a
                href="https://github.com/CandanUmut/AdilStore"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent)] transition-colors"
              >
                GitHub ↗
              </a>
              <a href="/submit" className="hover:text-[var(--accent)] transition-colors">
                Submit an App
              </a>
              <a href="/developer" className="hover:text-[var(--accent)] transition-colors">
                Developer Portal
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
