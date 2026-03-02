"use client";

import { useState } from "react";

interface Props {
  appId: string;
  appName: string;
}

const REASONS = [
  { id: "contains_ads", label: "Contains ads or promoted content" },
  { id: "tracks_users", label: "Tracks users without disclosure" },
  { id: "broken_link", label: "App URL is broken or inaccessible" },
  { id: "inappropriate_content", label: "Inappropriate or harmful content" },
  { id: "spam", label: "Spam or duplicate listing" },
  { id: "other", label: "Other (explain below)" },
];

export default function ReportButton({ appId, appName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, reason, details }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit report");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit report");
    }
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setDetails("");
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-[var(--text-soft)] hover:text-[var(--danger)] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(249,115,115,0.08)]"
        aria-label={`Report ${appName}`}
      >
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report app"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-[20px] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            {status === "success" ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✓</div>
                <h2 className="font-bold text-base mb-2">Report received</h2>
                <p className="text-sm text-[var(--text-soft)] mb-5">
                  Thank you. Our team will review <strong>{appName}</strong> within 48 hours.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-[var(--panel-soft)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div>
                  <h2 className="font-bold text-base mb-0.5">Report an issue</h2>
                  <p className="text-[11px] text-[var(--text-soft)]">
                    Reporting: <span className="text-[var(--text)]">{appName}</span>
                  </p>
                </div>

                {/* Reason selection */}
                <fieldset className="grid gap-2">
                  <legend className="text-[11px] text-[var(--text-soft)] mb-1">
                    What&apos;s the issue? <span className="text-[var(--danger)]">*</span>
                  </legend>
                  {REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                        reason === r.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--text-soft)] hover:border-[rgba(148,163,184,0.5)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={() => setReason(r.id)}
                        className="accent-[var(--accent)]"
                      />
                      {r.label}
                    </label>
                  ))}
                </fieldset>

                {/* Details (optional) */}
                <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
                  Additional details (optional)
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={1000}
                    className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)] resize-none"
                    placeholder="Any extra context that might help our review…"
                  />
                </label>

                {errorMsg && (
                  <p className="text-xs text-[var(--danger)] bg-[rgba(249,115,115,0.08)] px-3 py-2 rounded-lg">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-full text-xs text-[var(--text-soft)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || status === "submitting"}
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-[var(--danger)]/80 text-white hover:bg-[var(--danger)] transition-all disabled:opacity-40"
                  >
                    {status === "submitting" ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
