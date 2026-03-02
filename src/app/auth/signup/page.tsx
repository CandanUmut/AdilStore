"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "credentials" | "verify";

export default function SignUpPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/developer/profile`,
      },
    });

    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }

    setStep("verify");
  }

  async function handleGoogleSignIn() {
    setStatus("loading");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/developer/profile`,
      },
    });
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-xl font-extrabold tracking-tight mb-2">Check your inbox</h1>
          <p className="text-sm text-[var(--text-soft)] mb-6">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your
            developer account, then complete your profile.
          </p>
          <p className="text-xs text-[var(--text-soft)]">
            Wrong email?{" "}
            <button
              type="button"
              className="text-[var(--accent)] underline"
              onClick={() => setStep("credentials")}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg tracking-tight text-[var(--text)] no-underline">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-[0_12px_28px_rgba(56,189,248,0.45)] overflow-hidden">
              <img src="/adilstore-icon.png" alt="AdilStore" width={22} height={22} />
            </span>
            AdilStore
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight mt-4 mb-1">Create developer account</h1>
          <p className="text-sm text-[var(--text-soft)]">
            Submit ad-free, privacy-first apps to AdilStore
          </p>
        </div>

        <div className="rounded-[18px] border border-[rgba(148,163,184,0.35)] bg-[var(--panel)] p-6 shadow-soft">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-[rgba(148,163,184,0.55)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:-translate-y-px transition-all mb-4 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--text-soft)]">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSignUp} className="grid gap-3">
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              Email address
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-all"
                placeholder="you@example.com" autoComplete="email"
              />
            </label>
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              Password <span className="text-[10px]">(min. 8 characters)</span>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-all"
                placeholder="••••••••" autoComplete="new-password"
              />
            </label>
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              Confirm password
              <input
                type="password" required value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-all"
                placeholder="••••••••" autoComplete="new-password"
              />
            </label>

            {error && (
              <p className="text-xs text-[var(--danger)] bg-[rgba(249,115,115,0.08)] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="px-3 py-2 rounded-xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] text-[11px] text-[var(--text-soft)]">
              🛡️ By creating an account you agree to review AdilStore&apos;s developer guidelines. No app goes live without manual review.
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full py-2.5 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-accent hover:shadow-accent-lg hover:-translate-y-px transition-all disabled:opacity-50 mt-1"
            >
              {status === "loading" ? "Creating account…" : "Create developer account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-soft)] mt-4">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
