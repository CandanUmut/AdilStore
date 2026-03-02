import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portal",
  description: "Submit and manage your apps on AdilStore",
};

const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-400/10",
  approved: "text-green-400 bg-green-400/10",
  rejected: "text-red-400 bg-red-400/10",
  needs_changes: "text-orange-400 bg-orange-400/10",
} as const;

const STATUS_LABELS = {
  pending: "Pending review",
  approved: "Published",
  rejected: "Rejected",
  needs_changes: "Needs changes",
} as const;

export default async function DeveloperPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-3">Developer Portal</h1>
          <p className="text-sm text-[var(--text-soft)] mb-6">
            Sign in to submit and manage your apps on AdilStore.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-accent hover:shadow-accent-lg hover:-translate-y-px transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold border border-[rgba(148,163,184,0.7)] bg-[rgba(15,23,42,0.9)] text-[var(--text-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
            >
              Create developer account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch developer profile
  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch submissions
  const { data: submissions } = await supabase
    .from("app_submissions")
    .select("*")
    .eq("developer_id", profile?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight m-0">Developer Dashboard</h1>
            <p className="text-sm text-[var(--text-soft)] mt-1">
              {user.email}
              {profile?.is_verified && (
                <span className="ml-2 text-green-400 text-[11px]">✓ Verified</span>
              )}
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120] shadow-accent hover:shadow-accent-lg hover:-translate-y-px transition-all"
          >
            + Submit new app
          </Link>
        </div>

        {/* Profile card */}
        {!profile && (
          <div className="rounded-[18px] border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.08)] p-5 mb-6">
            <h2 className="text-sm font-bold m-0 mb-1">Complete your developer profile</h2>
            <p className="text-xs text-[var(--text-soft)] m-0 mb-3">
              A complete profile is required before you can submit apps.
            </p>
            <Link
              href="/developer/profile"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#0b1120]"
            >
              Set up profile →
            </Link>
          </div>
        )}

        {/* Submissions */}
        <h2 className="text-base font-bold tracking-tight mb-3">My apps</h2>

        {(!submissions || submissions.length === 0) ? (
          <div className="text-center py-10 px-4 rounded-[18px] border border-dashed border-[var(--border)] text-[var(--text-soft)] bg-[var(--panel-soft)]">
            <p className="font-medium m-0">You haven&apos;t submitted any apps yet.</p>
            <p className="text-xs mt-1 m-0">
              When you{" "}
              <Link href="/submit" className="text-[var(--accent)] underline">submit an app</Link>
              , it will appear here with its review status.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-[14px] border border-[rgba(148,163,184,0.35)] bg-[var(--panel)] p-4 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold m-0">{sub.app_name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        STATUS_COLORS[sub.status as keyof typeof STATUS_COLORS] ?? "text-[var(--text-soft)] bg-[var(--chip-bg)]"
                      }`}
                    >
                      {STATUS_LABELS[sub.status as keyof typeof STATUS_LABELS] ?? sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-soft)] m-0 mt-1 line-clamp-2">
                    {sub.description_en}
                  </p>
                  {sub.reviewer_notes && (
                    <div className="mt-2 pl-3 border-l border-[var(--accent-soft)] text-xs text-[var(--text-soft)]">
                      <span className="text-[var(--accent)] font-medium">Reviewer note: </span>
                      {sub.reviewer_notes}
                    </div>
                  )}
                  <p className="text-[10px] text-[var(--text-soft)] mt-1 m-0">
                    Submitted {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
