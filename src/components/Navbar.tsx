"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

interface NavbarProps {
  lang: Lang;
  onLangChange?: (lang: Lang) => void;
}

export default function Navbar({ lang, onLangChange }: NavbarProps) {
  const T = translations[lang];
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("adilstore-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("adilstore-theme", next);
  }

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 ${
        scrolled
          ? "shadow-[0_10px_30px_rgba(0,0,0,0.35)] border-b border-[rgba(148,163,184,0.3)]"
          : "border-b border-[rgba(148,163,184,0.16)]"
      }`}
      style={{
        backdropFilter: "blur(22px)",
        background:
          "linear-gradient(to bottom, rgba(2,6,23,0.96), rgba(2,6,23,0.9), rgba(2,6,23,0.6))",
      }}
    >
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 flex items-center justify-between min-h-[66px] py-3">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-base tracking-tight text-[var(--text)] hover:text-[var(--accent)] transition-colors no-underline"
        >
          <span
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-[0_12px_28px_rgba(56,189,248,0.45)] overflow-hidden"
          >
            <Image
              src="/adilstore-icon.png"
              alt="AdilStore logo"
              width={20}
              height={20}
              className="block"
            />
          </span>
          <span>AdilStore</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 mr-2">
            <Link
              href="/submit"
              className="text-[11px] px-3 py-1.5 rounded-full text-[var(--text-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all"
            >
              {T.nav.submit}
            </Link>
            <Link
              href="/developer"
              className="text-[11px] px-3 py-1.5 rounded-full text-[var(--text-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all"
            >
              {T.nav.developer}
            </Link>
          </nav>

          {/* Auth */}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              <span className="text-[11px] text-[var(--text-soft)] px-2 truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[11px] px-3 py-1.5 rounded-full text-[var(--text-soft)] hover:text-[var(--danger)] hover:bg-[rgba(249,115,115,0.08)] border border-transparent hover:border-[rgba(249,115,115,0.25)] transition-all"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="hidden md:inline-flex text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all"
            >
              Sign in
            </Link>
          )}

          {/* Language toggle */}
          <div className="inline-flex items-center p-1 rounded-full border border-[var(--border)] bg-[var(--panel-soft)] gap-1">
            {(["en", "tr"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className={`px-2 py-1.5 rounded-full text-[11px] cursor-pointer transition-all ${
                  l === lang
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold -translate-y-px shadow-[0_10px_22px_rgba(56,189,248,0.35)]"
                    : "text-[var(--text-soft)] bg-transparent"
                }`}
                onClick={() => onLangChange?.(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(148,163,184,0.55)] bg-[var(--panel-soft)] text-[var(--text-soft)] text-[11px] hover:bg-[var(--panel)] hover:-translate-y-px transition-all"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <span className="hidden sm:inline">
              {theme === "dark" ? T.theme.dark : T.theme.light}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
