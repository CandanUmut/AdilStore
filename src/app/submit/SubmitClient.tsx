"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

const CATEGORIES = [
  { id: "spiritual", label: "Spiritual growth" },
  { id: "wellness", label: "Wellbeing & mind" },
  { id: "learning", label: "Learning & reflection" },
  { id: "games", label: "Games & play" },
  { id: "tools", label: "Tools & utilities" },
  { id: "environment", label: "Environment & care" },
  { id: "self-assessment", label: "Self-assessment" },
];

interface Props {
  developerId: string;
  defaultEmail: string;
}

export default function SubmitClient({ developerId, defaultEmail }: Props) {
  const [lang, setLang] = useState<Lang>("en");
  const T = translations[lang];

  const [form, setForm] = useState({
    app_name: "",
    app_url: "",
    category_id: "",
    description_en: "",
    contact_email: defaultEmail,
    extra_notes: "",
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.app_name || !form.app_url || !form.contact_email || !form.description_en) {
      setMessage("Please fill in all required fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setMessage(T.submit.button + "…");

    const supabase = createClient();
    let icon_path: string | null = null;

    if (iconFile && iconFile.size > 0) {
      if (iconFile.size > 2 * 1024 * 1024) {
        setMessage("Icon must be under 2MB.");
        setStatus("error");
        return;
      }
      const ext = iconFile.name.split(".").pop() ?? "png";
      const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("adil-icons")
        .upload(path, iconFile, { contentType: iconFile.type || "image/png", upsert: false });
      if (!uploadError) icon_path = path;
    }

    const { error } = await supabase.from("app_submissions").insert({
      app_name: form.app_name.trim(),
      app_url: form.app_url.trim(),
      category_id: form.category_id || null,
      description_en: form.description_en.trim(),
      contact_email: form.contact_email.trim(),
      extra_notes: form.extra_notes.trim() || null,
      icon_path,
      developer_id: developerId,
    });

    if (error) {
      setStatus("error");
      setMessage(T.submit.error);
      return;
    }

    setStatus("success");
    setMessage(T.submit.success);
    setForm({ app_name: "", app_url: "", category_id: "", description_en: "", contact_email: defaultEmail, extra_notes: "" });
    setIconFile(null);
  }

  return (
    <div className="min-h-screen">
      <Navbar lang={lang} onLangChange={setLang} />
      <div className="max-w-[720px] mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{T.submit.title}</h1>
        <p className="text-sm text-[var(--text-soft)] mb-6">{T.submit.subtitle}</p>

        <form
          onSubmit={handleSubmit}
          className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-soft grid gap-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              <span>{T.submit.appName} *</span>
              <input
                type="text"
                required
                value={form.app_name}
                onChange={(e) => update("app_name", e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                placeholder="My Amazing App"
              />
            </label>
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              <span>{T.submit.appUrl} *</span>
              <input
                type="url"
                required
                value={form.app_url}
                onChange={(e) => update("app_url", e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                placeholder="https://myapp.example.com"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              <span>{T.submit.category}</span>
              <select
                value={form.category_id}
                onChange={(e) => update("category_id", e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
              >
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
              <span>{T.submit.contactEmail} *</span>
              <input
                type="email"
                required
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            <span>{T.submit.description} *</span>
            <textarea
              required
              rows={4}
              value={form.description_en}
              onChange={(e) => update("description_en", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)] resize-y"
              placeholder="Describe your app in 2–5 sentences. What does it do? Why does it belong on AdilStore?"
            />
          </label>

          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            <span>{T.submit.extraNotes}</span>
            <textarea
              rows={3}
              value={form.extra_notes}
              onChange={(e) => update("extra_notes", e.target.value)}
              className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)] resize-y"
              placeholder="Open source repo link, license, any privacy notes, etc."
            />
          </label>

          <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
            <span>{T.submit.icon}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
              className="text-xs text-[var(--text-soft)] file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[var(--accent-soft)] file:text-[var(--accent-strong)] hover:file:bg-[var(--accent-soft)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-soft)]">{T.submit.iconHint}</span>
          </label>

          <div className="px-3 py-2 rounded-xl bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] text-[11px] text-[var(--text-soft)]">
            Your submission is reviewed manually before it goes live. We do not sell your contact email.
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-[0_10px_25px_rgba(56,189,248,0.6)] hover:shadow-[0_14px_32px_rgba(56,189,248,0.9)] hover:-translate-y-px transition-all disabled:opacity-50"
            >
              {T.submit.button}
            </button>
            {message && (
              <p
                className={`text-xs m-0 ${
                  status === "success" ? "text-green-400" : status === "error" ? "text-[var(--danger)]" : "text-[var(--text-soft)]"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
