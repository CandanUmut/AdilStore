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
      <section className="max-w-[1260px] mx-auto px-4 md:px-6 mt-4 mb-2">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.6)]">
          <h3 className="text-base font-bold tracking-tight m-0 mb-1">{T.submit.title}</h3>
          <p className="text-xs text-[var(--text-soft)] mb-3 m-0">{T.submit.subtitle}</p>
          <a
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-[0_10px_25px_rgba(56,189,248,0.6)] hover:shadow-[0_14px_32px_rgba(56,189,248,0.9)] hover:-translate-y-px transition-all"
          >
            📤 {T.submit.button}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1260px] mx-auto px-4 md:px-6 mt-6 pb-6 pt-4 border-t border-[var(--border)] bg-[rgba(15,23,42,0.6)] rounded-[14px_14px_0_0] text-xs text-[var(--text-soft)] leading-relaxed">
        <p className="m-0" dangerouslySetInnerHTML={{ __html: T.footer.line1 }} />
        <p className="m-0 mt-1" dangerouslySetInnerHTML={{ __html: T.footer.line2 }} />
      </footer>
    </div>
  );
}
