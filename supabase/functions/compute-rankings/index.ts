/**
 * AdilStore Ranking Edge Function
 * Runs every 6 hours via pg_cron or Supabase Scheduled Functions.
 *
 * Deploy:
 *   supabase functions deploy compute-rankings --no-verify-jwt
 *
 * Schedule (pg_cron in Supabase SQL editor):
 *   select cron.schedule('rank-apps', '0 */6 * * *',
 *     $$select net.http_post(
 *       url := current_setting('app.settings.functions_url') || '/compute-rankings',
 *       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
 *       body := '{}'::jsonb
 *     )$$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Bayesian average constants — prior of 10 reviews at 3.5 stars
const BAYESIAN_C = 10;
const BAYESIAN_M = 3.5;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function round6(v: number) {
  return Math.round(v * 1_000_000) / 1_000_000;
}

interface AppRow {
  id: string;
  updated_at: string | null;
}

interface InstallStats {
  app_id: string;
  installs_7d: number;
  installs_30d: number;
  installs_all: number;
  return_visits_7d: number;
}

interface ReviewStats {
  app_id: string;
  scores: number[];
  reply_count: number;
}

interface ReportStats {
  app_id: string;
  report_count: number;
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch all published apps
  const { data: apps, error: appsErr } = await supabase
    .from("apps")
    .select("id, updated_at")
    .eq("is_published", true);

  if (appsErr || !apps) {
    return new Response(JSON.stringify({ error: appsErr?.message }), { status: 500 });
  }

  // 2. Install stats per app (7d, 30d, all-time, return visits 7d)
  const installStats: Map<string, InstallStats> = new Map();

  // All-time installs
  const { data: allInstalls } = await supabase
    .from("installs")
    .select("app_id");
  for (const row of allInstalls ?? []) {
    const cur = installStats.get(row.app_id) ?? {
      app_id: row.app_id, installs_7d: 0, installs_30d: 0, installs_all: 0, return_visits_7d: 0,
    };
    cur.installs_all++;
    installStats.set(row.app_id, cur);
  }

  // 30d installs
  const { data: installs30 } = await supabase
    .from("installs")
    .select("app_id")
    .gte("created_at", d30);
  for (const row of installs30 ?? []) {
    const cur = installStats.get(row.app_id) ?? {
      app_id: row.app_id, installs_7d: 0, installs_30d: 0, installs_all: 0, return_visits_7d: 0,
    };
    cur.installs_30d++;
    installStats.set(row.app_id, cur);
  }

  // 7d installs + return visits (fingerprints appearing 2+ times in 7d window)
  const { data: installs7 } = await supabase
    .from("installs")
    .select("app_id, fingerprint")
    .gte("created_at", d7);

  // Group fingerprints per app to detect return visits
  const fpMap: Map<string, Map<string, number>> = new Map();
  for (const row of installs7 ?? []) {
    const cur = installStats.get(row.app_id) ?? {
      app_id: row.app_id, installs_7d: 0, installs_30d: 0, installs_all: 0, return_visits_7d: 0,
    };
    cur.installs_7d++;
    installStats.set(row.app_id, cur);

    if (row.fingerprint) {
      if (!fpMap.has(row.app_id)) fpMap.set(row.app_id, new Map());
      const fps = fpMap.get(row.app_id)!;
      fps.set(row.fingerprint, (fps.get(row.fingerprint) ?? 0) + 1);
    }
  }

  // Count return visits (fingerprint appears 2+ times in window)
  for (const [appId, fps] of fpMap.entries()) {
    const cur = installStats.get(appId);
    if (cur) {
      let returns = 0;
      for (const count of fps.values()) {
        if (count >= 2) returns++;
      }
      cur.return_visits_7d = returns;
    }
  }

  // 3. Review stats per app
  const { data: reviews } = await supabase
    .from("reviews")
    .select("app_id, score, developer_reply")
    .eq("is_published", true);

  const reviewStats: Map<string, ReviewStats> = new Map();
  for (const r of reviews ?? []) {
    const cur = reviewStats.get(r.app_id) ?? { app_id: r.app_id, scores: [], reply_count: 0 };
    cur.scores.push(r.score);
    if (r.developer_reply) cur.reply_count++;
    reviewStats.set(r.app_id, cur);
  }

  // 4. Report counts per app
  const { data: reports } = await supabase
    .from("reports")
    .select("app_id")
    .eq("status", "open");

  const reportStats: Map<string, ReportStats> = new Map();
  for (const r of reports ?? []) {
    const cur = reportStats.get(r.app_id) ?? { app_id: r.app_id, report_count: 0 };
    cur.report_count++;
    reportStats.set(r.app_id, cur);
  }

  // 5. Compute and update scores
  const updates: { id: string; ranking_score: number }[] = [];

  for (const app of apps as AppRow[]) {
    const installs = installStats.get(app.id) ?? {
      installs_7d: 0, installs_30d: 0, installs_all: 0, return_visits_7d: 0,
    };
    const reviews_ = reviewStats.get(app.id) ?? { scores: [], reply_count: 0 };
    const reports_ = reportStats.get(app.id) ?? { report_count: 0 };

    // Anti-gaming spike detection
    const daily_avg_30d = installs.installs_30d / 30;
    const expected_7d = daily_avg_30d * 7;
    const is_spike = installs.installs_7d > expected_7d * 3;
    const effective_7d = is_spike
      ? Math.min(installs.installs_7d, daily_avg_30d * 7)
      : installs.installs_7d;
    const anti_gaming = is_spike ? 0.5 : 1.0;

    // Factor 1: Install velocity
    const install_velocity = clamp(effective_7d / (installs.installs_all + 1), 0, 1);

    // Factor 2: Retention
    const retention_signal = installs.installs_7d > 0
      ? clamp(installs.return_visits_7d / installs.installs_7d, 0, 1)
      : 0;

    // Factor 3: Bayesian review score
    const n = reviews_.scores.length;
    const sum = reviews_.scores.reduce((a, b) => a + b, 0);
    const bayesian_avg = (BAYESIAN_C * BAYESIAN_M + sum) / (BAYESIAN_C + n);
    const review_score_bayesian = (bayesian_avg - 1) / 4;

    // Factor 4: Update recency
    const days_since_update = app.updated_at
      ? (now.getTime() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      : 365;
    const update_recency = clamp(1 - days_since_update / 180, 0, 1);

    // Factor 5: Report penalty
    const report_penalty = clamp(
      1 - (reports_.report_count * 2) / (installs.installs_all + 1),
      0, 1
    );

    // Factor 6: Developer response
    const review_count_for_response = Math.max(10, n);
    const developer_response = clamp(reviews_.reply_count / review_count_for_response, 0, 1);

    const raw_score =
      install_velocity      * 0.20 +
      retention_signal      * 0.25 +
      review_score_bayesian * 0.20 +
      update_recency        * 0.15 +
      report_penalty        * 0.15 +
      developer_response    * 0.05;

    updates.push({ id: app.id, ranking_score: round6(raw_score * anti_gaming) });
  }

  // Batch update in chunks of 100
  const CHUNK = 100;
  let updated = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    for (const row of chunk) {
      await supabase
        .from("apps")
        .update({ ranking_score: row.ranking_score })
        .eq("id", row.id);
      updated++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, apps_scored: updated, computed_at: now.toISOString() }),
    { headers: { "Content-Type": "application/json" } }
  );
});
