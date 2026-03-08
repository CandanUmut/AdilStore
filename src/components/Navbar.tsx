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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Close mobile menu on route change / outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mobileOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("adilstore-theme", next);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header
      className="sticky top-0 z-30 transition-all duration-200"
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: scrolled
          ? "var(--panel-strong)"
          : "linear-gradient(to bottom, rgba(2,6,23,0.96), rgba(2,6,23,0.82))",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 flex items-center justify-between min-h-[66px] py-3">

        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-extrabold text-[15px] tracking-tight text-[var(--text)] hover:text-[var(--accent)] transition-colors no-underline"
        >
          <span
            className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ boxShadow: "0 6px 20px rgba(56,189,248,0.45)" }}
          >
            <Image
              src="/adilstore-icon.png"
              alt="AdilStore logo"
              width={32}
              height={32}
              className="block object-cover"
            />
          </span>
          <span>AdilStore</span>
          <span
            className="hidden md:inline text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
            style={{
              background: "var(--green-soft)",
              border: "1px solid rgba(52,211,153,0.3)",
              color: "var(--green)",
            }}
          >
            beta
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Nav links */}
          <nav className="flex items-center gap-0.5 mr-2">
            {[
              { href: "/submit",    label: T.nav.submit },
              { href: "/developer", label: T.nav.developer },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11.5px] px-3 py-2 rounded-full font-medium transition-all"
                style={{ color: "var(--text-soft)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-soft)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] text-[var(--text-muted)] px-2 truncate max-w-[120px]"
                title={user.email}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[11px] px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-soft)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--danger)";
                  (e.currentTarget as HTMLElement).style.background = "var(--danger-soft)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,115,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-soft)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="text-[11px] px-3 py-1.5 rounded-full transition-all"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-soft)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-soft)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              Sign in
            </Link>
          )}

          {/* Language toggle */}
          <div
            className="inline-flex items-center p-0.5 rounded-full gap-0.5"
            style={{ border: "1px solid var(--border-subtle)", background: "var(--chip-bg)" }}
          >
            {(["en", "tr"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all"
                style={
                  l === lang
                    ? {
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        boxShadow: "0 2px 8px rgba(56,189,248,0.25)",
                        transform: "translateY(-0.5px)",
                      }
                    : { color: "var(--text-muted)", background: "transparent" }
                }
                onClick={() => onLangChange?.(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] transition-all"
            style={{
              border: "1px solid var(--border-subtle)",
              background: "var(--chip-bg)",
              color: "var(--text-soft)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--panel)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--chip-bg)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <span className="hidden lg:inline">
              {theme === "dark" ? T.theme.dark : T.theme.light}
            </span>
          </button>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-2">
          {/* Language toggle (mobile) */}
          <div
            className="inline-flex items-center p-0.5 rounded-full gap-0.5"
            style={{ border: "1px solid var(--border-subtle)", background: "var(--chip-bg)" }}
          >
            {(["en", "tr"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className="px-2 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all"
                style={
                  l === lang
                    ? { background: "var(--accent-soft)", color: "var(--accent)" }
                    : { color: "var(--text-muted)", background: "transparent" }
                }
                onClick={() => onLangChange?.(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex flex-col items-center justify-center gap-[5px]"
            style={{
              border: "1px solid var(--border-subtle)",
              background: mobileOpen ? "var(--accent-soft)" : "var(--chip-bg)",
            }}
            onClick={(e) => { e.stopPropagation(); setMobileOpen((v) => !v); }}
            aria-label="Menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-200"
                style={{
                  width: i === 1 ? 12 : 16,
                  height: 1.5,
                  background: mobileOpen ? "var(--accent)" : "var(--text-soft)",
                }}
              />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href="/submit"
            className="text-sm py-2.5 px-3 rounded-xl font-medium"
            style={{ color: "var(--text-soft)", background: "var(--chip-bg)" }}
            onClick={() => setMobileOpen(false)}
          >
            📤 {T.nav.submit}
          </Link>
          <Link
            href="/developer"
            className="text-sm py-2.5 px-3 rounded-xl font-medium"
            style={{ color: "var(--text-soft)", background: "var(--chip-bg)" }}
            onClick={() => setMobileOpen(false)}
          >
            💻 {T.nav.developer}
          </Link>
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm py-2.5 px-3 rounded-xl font-medium text-left"
              style={{ color: "var(--danger)", background: "var(--danger-soft)" }}
            >
              Sign out ({user.email})
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm py-2.5 px-3 rounded-xl font-medium"
              style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="text-sm py-2.5 px-3 rounded-xl font-medium text-left flex items-center gap-2"
            style={{ color: "var(--text-soft)", background: "var(--chip-bg)" }}
            onClick={toggleTheme}
          >
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
            <span>{theme === "dark" ? T.theme.dark : T.theme.light}</span>
          </button>
        </div>
      )}
    </header>
  );
}
