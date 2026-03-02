"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import type { Review } from "@/types/database.types";

interface RatingWidgetProps {
  appId: string;
  initialAvg: number | null;
  initialCount: number;
  latestReviews: Pick<Review, "nickname" | "score" | "comment" | "created_at">[];
  lang: Lang;
}

function Stars({ avg }: { avg: number | null }) {
  return (
    <span className="flex gap-[2px] text-sm" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = avg ? Math.floor(avg) : 0;
        const hasHalf = avg ? avg - filled >= 0.5 : false;
        return (
          <span
            key={s}
            className={
              s <= filled
                ? "text-yellow-400"
                : s === filled + 1 && hasHalf
                ? "text-yellow-300 opacity-80"
                : "text-[rgba(148,163,184,0.7)]"
            }
          >
            {s <= filled || (s === filled + 1 && hasHalf) ? "★" : "☆"}
          </span>
        );
      })}
    </span>
  );
}

export default function RatingWidget({
  appId,
  initialAvg,
  initialCount,
  latestReviews,
  lang,
}: RatingWidgetProps) {
  const T = translations[lang];
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [reviews, setReviews] = useState(latestReviews);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    if (!selected) {
      setMessage(T.ratings.selectRating);
      return;
    }
    setStatus("submitting");
    setMessage(T.ratings.submitting);

    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      app_id: appId,
      score: selected,
      nickname: nickname.trim() || null,
      comment: comment.trim() || null,
      is_verified_install: false,
    });

    if (error) {
      setStatus("error");
      setMessage(T.ratings.ratingError);
      return;
    }

    // Optimistically update UI
    const newCount = count + 1;
    const newAvg = ((avg ?? 0) * count + selected) / newCount;
    setCount(newCount);
    setAvg(newAvg);
    if (comment.trim()) {
      setReviews((prev) => [
        { nickname: nickname.trim() || null, score: selected, comment: comment.trim(), created_at: new Date().toISOString() },
        ...prev,
      ].slice(0, 3));
    }

    setSelected(0);
    setNickname("");
    setComment("");
    setStatus("success");
    setMessage(T.ratings.thankYou);
    setTimeout(() => setMessage(""), 4000);
  }

  return (
    <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.25)]">
      {/* Summary */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Stars avg={avg} />
        <span className="text-[11px] text-[var(--text-soft)]">
          {avg ? `${avg.toFixed(1)} · ` : ""}
          {count > 0 ? T.ratings.ratingCount(count) : T.ratings.noRatings}
        </span>
      </div>

      {/* Input */}
      <div className="grid gap-2">
        <input
          type="text"
          className="w-full rounded-lg border border-[var(--border)] bg-[rgba(15,23,42,0.98)] text-[var(--text)] px-2 py-1.5 text-[11px] outline-none focus:border-[var(--accent)]"
          placeholder={T.ratings.namePlaceholder}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
        />
        <textarea
          className="w-full rounded-lg border border-[var(--border)] bg-[rgba(15,23,42,0.98)] text-[var(--text)] px-2 py-1.5 text-[11px] outline-none focus:border-[var(--accent)] resize-y min-h-[40px]"
          placeholder={T.ratings.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={2}
        />
        <div className="flex items-center gap-3">
          {/* Star selector */}
          <div className="flex gap-0.5" role="group" aria-label={T.ratings.giveRating}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className={`p-0 border-none bg-transparent cursor-pointer text-base leading-none transition-colors ${
                  s <= (hovered || selected) ? "text-yellow-400" : "text-[rgba(148,163,184,0.8)]"
                }`}
                onClick={() => setSelected(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold border border-[rgba(148,163,184,0.7)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all disabled:opacity-50"
            onClick={handleSubmit}
            disabled={status === "submitting"}
          >
            {T.ratings.submitButton}
          </button>
          {message && (
            <span
              className={`text-[10px] ${
                status === "success"
                  ? "text-green-400"
                  : status === "error"
                  ? "text-[var(--danger)]"
                  : "text-[var(--text-soft)]"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </div>

      {/* Latest reviews */}
      {reviews.length > 0 && (
        <div className="mt-3 grid gap-2">
          {reviews.map((r, i) => (
            <div key={i} className="text-[10px] text-[var(--text-soft)]">
              <span className="font-medium text-[var(--text)]">
                {r.nickname ?? T.ratings.anonymous}:
              </span>{" "}
              {r.comment}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
