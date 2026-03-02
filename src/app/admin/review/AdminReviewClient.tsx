"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  app_name: string;
  app_url: string;
  category_id: string | null;
  description_en: string;
  contact_email: string;
  extra_notes: string | null;
  icon_path: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
  developer_id: string | null;
  developer_profiles: {
    display_name: string;
    contact_email: string;
    website: string | null;
  } | null;
};

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "needs_changes";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  needs_changes: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function AdminReviewClient({ submissions: initial }: { submissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initial);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [actionState, setActionState] = useState<Record<string, "loading" | "done">>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayed = filter === "all"
    ? submissions
    : submissions.filter((s) => s.status === filter);

  const counts: Record<string, number> = {};
  for (const s of submissions) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }

  async function updateStatus(id: string, newStatus: string) {
    setActionState((prev) => ({ ...prev, [id]: "loading" }));

    const supabase = createClient();
    const notes = reviewNotes[id]?.trim() || null;

    const { error } = await supabase
      .from("app_submissions")
      .update({ status: newStatus, review_notes: notes })
      .eq("id", id);

    if (!error) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus, review_notes: notes } : s))
      );
      setActionState((prev) => ({ ...prev, [id]: "done" }));
      setExpandedId(null);
    } else {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      alert("Failed to update: " + error.message);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] text-[var(--text-soft)] mb-1">Admin</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Submission Review Queue</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "approved", "needs_changes", "rejected"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                filter === f
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent)] shadow-sm"
                  : "text-[var(--text-soft)] border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
              {f !== "all" && counts[f] != null && (
                <span className="ml-1.5 opacity-70">{counts[f]}</span>
              )}
              {f === "all" && (
                <span className="ml-1.5 opacity-70">{submissions.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-soft)] text-sm">
            No submissions in this category.
          </div>
        ) : (
          <div className="grid gap-3">
            {displayed.map((sub) => (
              <div
                key={sub.id}
                className="rounded-[16px] border border-[var(--border)] bg-[var(--panel)] p-5 transition-all"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-bold text-sm text-[var(--text)] truncate">
                        {sub.app_name}
                      </h2>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[sub.status] ?? "bg-[var(--panel-soft)] text-[var(--text-soft)] border-[var(--border)]"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                    <a
                      href={sub.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--accent)] hover:underline"
                    >
                      {sub.app_url}
                    </a>
                  </div>
                  <div className="text-[10px] text-[var(--text-soft)] text-right shrink-0">
                    <div>{new Date(sub.created_at).toLocaleDateString()}</div>
                    {sub.category_id && (
                      <div className="mt-0.5 px-1.5 py-0.5 rounded bg-[var(--panel-soft)] text-[var(--text-soft)]">
                        {sub.category_id}
                      </div>
                    )}
                  </div>
                </div>

                {/* Developer */}
                {sub.developer_profiles && (
                  <div className="mt-2 text-[11px] text-[var(--text-soft)]">
                    Developer:{" "}
                    <span className="text-[var(--text)]">{sub.developer_profiles.display_name}</span>
                    {" "}·{" "}
                    <a
                      href={`mailto:${sub.developer_profiles.contact_email}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {sub.developer_profiles.contact_email}
                    </a>
                    {sub.developer_profiles.website && (
                      <>
                        {" "}·{" "}
                        <a
                          href={sub.developer_profiles.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          website
                        </a>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="mt-3 text-xs text-[var(--text-soft)] leading-relaxed line-clamp-3">
                  {sub.description_en}
                </p>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
                >
                  {expandedId === sub.id ? "Collapse ▲" : "Review actions ▼"}
                </button>

                {/* Expanded review panel */}
                {expandedId === sub.id && (
                  <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4">
                    {sub.extra_notes && (
                      <div className="text-[11px] text-[var(--text-soft)]">
                        <span className="font-semibold text-[var(--text)]">Extra notes: </span>
                        {sub.extra_notes}
                      </div>
                    )}

                    {/* Existing review notes */}
                    {sub.review_notes && (
                      <div className="px-3 py-2 rounded-lg bg-[rgba(249,115,115,0.06)] border border-[rgba(249,115,115,0.2)] text-[11px] text-[var(--text-soft)]">
                        <span className="font-semibold">Previous notes: </span>{sub.review_notes}
                      </div>
                    )}

                    {/* Review notes input */}
                    <label className="grid gap-1 text-[11px] text-[var(--text-soft)]">
                      Review notes (sent to developer)
                      <textarea
                        rows={3}
                        value={reviewNotes[sub.id] ?? ""}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="rounded-[10px] border border-[var(--border)] bg-[rgba(15,23,42,0.96)] text-[var(--text)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)] resize-y"
                        placeholder="Optional: explain what needs to change, or add approval context…"
                      />
                    </label>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={actionState[sub.id] === "loading"}
                        onClick={() => updateStatus(sub.id, "approved")}
                        className="px-4 py-2 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionState[sub.id] === "loading"}
                        onClick={() => updateStatus(sub.id, "needs_changes")}
                        className="px-4 py-2 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-all disabled:opacity-50"
                      >
                        Needs changes
                      </button>
                      <button
                        type="button"
                        disabled={actionState[sub.id] === "loading"}
                        onClick={() => updateStatus(sub.id, "rejected")}
                        className="px-4 py-2 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={actionState[sub.id] === "loading"}
                        onClick={() => updateStatus(sub.id, "pending")}
                        className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-soft)] border border-[var(--border)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
                      >
                        Reset to pending
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
