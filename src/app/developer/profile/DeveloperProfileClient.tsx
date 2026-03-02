"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { DeveloperProfile } from "@/types/database.types";

interface Props {
  userId: string;
  email: string;
  existingProfile: DeveloperProfile | null;
}

export default function DeveloperProfileClient({ userId, email, existingProfile }: Props) {
  const isEdit = !!existingProfile;
  const [form, setForm] = useState({
    display_name: existingProfile?.display_name ?? "",
    website: existingProfile?.website ?? "",
    bio: existingProfile?.bio ?? "",
    contact_email: existingProfile?.contact_email ?? email,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.display_name.trim()) {
      setError("Display name is required.");
      return;
    }
    setStatus("saving");
    setError("");

    const supabase = createClient();

    if (isEdit) {
      const { error: dbError } = await supabase
        .from("developer_profiles")
        .update({
          display_name: form.display_name.trim(),
          website: form.website.trim() || null,
          bio: form.bio.trim() || null,
          contact_email: form.contact_email.trim(),
        })
        .eq("user_id", userId);

      if (dbError) {
        setStatus("error");
        setError(dbError.message);
        return;
      }
    } else {
      const { error: dbError } = await supabase.from("developer_profiles").insert({
        user_id: userId,
        display_name: form.display_name.trim(),
        website: form.website.trim() || null,
        bio: form.bio.trim() || null,
        contact_email: form.contact_email.trim(),
        is_verified: false,
      });

      if (dbError) {
        setStatus("error");
        setError(dbError.message);
        return;
      }

      // Upgrade role to developer
      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "developer" }, { onConflict: "user_id" });
    }

    setStatus("success");
    setTimeout(() => {
      window.location.href = "/developer";
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <Link href="/developer" className="text-xs text-[var(--text-soft)] hover:text-[var(--accent)] transition-colors">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight mt-3 mb-1">
            {isEdit ? "Edit developer profile" : "Complete your developer profile"}
          </h1>
          {!isEdit && (
            <p className="text-sm text-[var(--text-soft)]">
              This information helps us verify your identity before publishing your apps. It is not
              shown publicly without your consent.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[18px] border border-[rgba(148,163,184,0.35)] bg-[var(--panel)] p-6 shadow-soft grid gap-4"
        >
          {/* Display name */}
          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            <span>
              Display name <span className="text-[var(--danger)]">*</span>
            </span>
            <input
              type="text"
              required
              maxLength={80}
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.5)] transition-all"
              placeholder="Your name or studio name"
            />
            <span className="text-[10px]">This will be shown on your app listings.</span>
          </label>

          {/* Contact email */}
          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            <span>
              Contact email <span className="text-[var(--danger)]">*</span>
            </span>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.5)] transition-all"
              placeholder="your@email.com"
            />
            <span className="text-[10px]">Used for review notifications only. Never sold.</span>
          </label>

          {/* Website */}
          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            Website or GitHub
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.5)] transition-all"
              placeholder="https://github.com/you (optional)"
            />
          </label>

          {/* Bio */}
          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            Short bio
            <textarea
              rows={3}
              maxLength={400}
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_1px_rgba(56,189,248,0.5)] transition-all resize-y"
              placeholder="Tell us about yourself or your studio (optional, max 400 chars)"
            />
          </label>

          {/* Guidelines */}
          {!isEdit && (
            <div className="px-3 py-3 rounded-xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] text-[11px] text-[var(--text-soft)] grid gap-1.5">
              <p className="font-semibold text-[var(--text)] m-0">Developer agreement</p>
              <ul className="m-0 pl-4 grid gap-1">
                <li>Your app must be genuinely ad-free and contain no hidden trackers</li>
                <li>You agree to respond to review feedback within 14 days</li>
                <li>Violations result in removal and ban following the three-strike process</li>
              </ul>
            </div>
          )}

          {error && (
            <p className="text-xs text-[var(--danger)] bg-[rgba(249,115,115,0.08)] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <button
              type="submit"
              disabled={status === "saving"}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-accent hover:shadow-accent-lg hover:-translate-y-px transition-all disabled:opacity-50"
            >
              {status === "saving"
                ? "Saving…"
                : status === "success"
                ? "✓ Saved — redirecting…"
                : isEdit
                ? "Save changes"
                : "Complete profile →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
