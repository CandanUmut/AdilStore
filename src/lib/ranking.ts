/**
 * AdilStore Fair Ranking Algorithm v1
 *
 * Principles:
 * - No factor is purchasable or gameable by paying
 * - All weights are fixed and publicly documented
 * - Anti-gaming rules run before scoring
 * - Score is recomputed every 6 hours via Edge Function
 *
 * Formula:
 *   ranking_score = (
 *     install_velocity_7d   * 0.20  +
 *     retention_signal_7d   * 0.25  +
 *     review_score_bayesian * 0.20  +
 *     update_recency        * 0.15  +
 *     report_penalty        * 0.15  +
 *     developer_response    * 0.05
 *   ) * anti_gaming_multiplier
 */

export interface RankingInput {
  installs_7d: number;
  installs_30d: number;
  installs_all_time: number;
  return_visits_7d: number; // unique hashes that appear 2+ times in 7d
  review_scores: number[];  // all published review scores
  review_reply_count: number;
  days_since_last_update: number;
  report_count: number;
  is_flagged_for_spike: boolean;
}

export interface RankingOutput {
  score: number;
  factors: {
    install_velocity: number;
    retention_signal: number;
    review_score_bayesian: number;
    update_recency: number;
    report_penalty: number;
    developer_response: number;
    anti_gaming_multiplier: number;
  };
}

// Bayesian average constants — prior of 10 reviews at 3.5 stars
const BAYESIAN_C = 10;
const BAYESIAN_M = 3.5;

export function computeRankingScore(input: RankingInput): RankingOutput {
  // --- Anti-gaming check ---
  // If 7-day installs are more than 3x the daily average from 30-day window, flag as spike
  const daily_avg_30d = input.installs_30d / 30;
  const effective_installs_7d = input.is_flagged_for_spike
    ? Math.min(input.installs_7d, daily_avg_30d * 7)
    : input.installs_7d;

  const anti_gaming_multiplier = input.is_flagged_for_spike ? 0.5 : 1.0;

  // --- Factor 1: Install velocity (0..1) ---
  // Measures recent momentum relative to total history
  const install_velocity = clamp(
    effective_installs_7d / (input.installs_all_time + 1),
    0, 1
  );

  // --- Factor 2: Retention signal (0..1) ---
  // % of last-7d installs that showed a return visit
  const retention_signal = input.installs_7d > 0
    ? clamp(input.return_visits_7d / input.installs_7d, 0, 1)
    : 0;

  // --- Factor 3: Bayesian average review score (0..1) ---
  const n = input.review_scores.length;
  const sum = input.review_scores.reduce((a, b) => a + b, 0);
  const bayesian_avg = (BAYESIAN_C * BAYESIAN_M + sum) / (BAYESIAN_C + n);
  // Normalize from [1..5] to [0..1]
  const review_score_bayesian = (bayesian_avg - 1) / 4;

  // --- Factor 4: Update recency (0..1) ---
  // Decays linearly to 0 over 180 days
  const update_recency = clamp(
    1 - input.days_since_last_update / 180,
    0, 1
  );

  // --- Factor 5: Report penalty (0..1) ---
  // 1.0 = no reports, 0.0 = heavily reported
  const report_penalty = clamp(
    1 - (input.report_count * 2) / (input.installs_all_time + 1),
    0, 1
  );

  // --- Factor 6: Developer response rate (0..1) ---
  const review_count_for_response = Math.max(10, n);
  const developer_response = clamp(
    input.review_reply_count / review_count_for_response,
    0, 1
  );

  // --- Final score ---
  const raw_score =
    install_velocity      * 0.20 +
    retention_signal      * 0.25 +
    review_score_bayesian * 0.20 +
    update_recency        * 0.15 +
    report_penalty        * 0.15 +
    developer_response    * 0.05;

  const score = round6(raw_score * anti_gaming_multiplier);

  return {
    score,
    factors: {
      install_velocity:       round6(install_velocity),
      retention_signal:       round6(retention_signal),
      review_score_bayesian:  round6(review_score_bayesian),
      update_recency:         round6(update_recency),
      report_penalty:         round6(report_penalty),
      developer_response:     round6(developer_response),
      anti_gaming_multiplier,
    },
  };
}

/**
 * Detect install spikes:
 * Returns true if 7d installs > 3× the daily average from the past 30 days.
 */
export function detectInstallSpike(installs_7d: number, installs_30d: number): boolean {
  const daily_avg = installs_30d / 30;
  const expected_7d = daily_avg * 7;
  return installs_7d > expected_7d * 3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
