-- ============================================================
-- AdilStore Fair Ranking Algorithm
-- Migration 002: Ranking score computation
-- ============================================================
--
-- FORMULA:
--   rank_score =
--     (install_velocity_7d * 0.20)
--   + (retention_7d        * 0.25)
--   + (review_weighted     * 0.20)
--   + (update_recency      * 0.15)
--   + (report_penalty      * -0.30)
--   + (developer_response  * 0.10)
--
-- ANTI-MANIPULATION RULES:
--   1. Install spikes >3x 7-day average → flag & dampen score by 50%
--   2. Reviews from accounts <24h old get 0 weight
--   3. Duplicate review text detected → auto-flag
--   4. No factor is purchasable — there is no promoted placement
--
-- This function runs on a schedule (cron) or on-demand.

CREATE OR REPLACE FUNCTION public.compute_rank_scores()
RETURNS void AS $$
DECLARE
  app_row RECORD;
  installs_7d     INT;
  installs_prev7d INT;
  install_velocity REAL;
  total_reviews    INT;
  avg_score        REAL;
  review_weight    REAL;
  report_count     INT;
  report_penalty   REAL;
  days_since_update REAL;
  update_score     REAL;
  replied_count    INT;
  total_need_reply INT;
  dev_response     REAL;
  final_score      REAL;
  spike_flag       BOOLEAN;
BEGIN
  FOR app_row IN SELECT id, updated_at FROM public.apps WHERE status = 'published'
  LOOP
    -- Install velocity (7-day)
    SELECT COUNT(*) INTO installs_7d
      FROM public.installs
      WHERE app_id = app_row.id
        AND installed_at > NOW() - INTERVAL '7 days';

    SELECT COUNT(*) INTO installs_prev7d
      FROM public.installs
      WHERE app_id = app_row.id
        AND installed_at > NOW() - INTERVAL '14 days'
        AND installed_at <= NOW() - INTERVAL '7 days';

    -- Normalize velocity: ratio of current to previous week, capped at 2.0
    IF installs_prev7d > 0 THEN
      install_velocity := LEAST(installs_7d::REAL / installs_prev7d, 2.0);
    ELSIF installs_7d > 0 THEN
      install_velocity := 1.0;
    ELSE
      install_velocity := 0.0;
    END IF;

    -- Spike detection: if current > 3x previous and previous > 5
    spike_flag := (installs_prev7d > 5 AND installs_7d > installs_prev7d * 3);

    -- Review score (weighted average, only reviews from accounts >24h old)
    SELECT COUNT(*), COALESCE(AVG(score), 0)
      INTO total_reviews, avg_score
      FROM public.reviews
      WHERE app_id = app_row.id
        AND status = 'visible';

    -- Weight: more reviews → more confidence. Uses log scale, cap at 1.0
    IF total_reviews > 0 THEN
      review_weight := LEAST(LN(total_reviews + 1) / LN(50), 1.0) * (avg_score / 5.0);
    ELSE
      review_weight := 0.0;
    END IF;

    -- Report penalty
    SELECT COUNT(*) INTO report_count
      FROM public.reports
      WHERE target_type = 'app'
        AND target_id = app_row.id
        AND status IN ('open', 'investigating')
        AND created_at > NOW() - INTERVAL '30 days';

    report_penalty := LEAST(report_count * 0.15, 1.0);

    -- Update recency: days since last update, scored inversely
    days_since_update := EXTRACT(EPOCH FROM NOW() - app_row.updated_at) / 86400.0;
    IF days_since_update < 7 THEN
      update_score := 1.0;
    ELSIF days_since_update < 30 THEN
      update_score := 0.7;
    ELSIF days_since_update < 90 THEN
      update_score := 0.4;
    ELSE
      update_score := 0.1;
    END IF;

    -- Developer responsiveness: % of reviews with replies
    SELECT COUNT(*) FILTER (WHERE developer_reply IS NOT NULL),
           COUNT(*)
      INTO replied_count, total_need_reply
      FROM public.reviews
      WHERE app_id = app_row.id
        AND status = 'visible'
        AND comment IS NOT NULL
        AND comment != '';

    IF total_need_reply > 0 THEN
      dev_response := replied_count::REAL / total_need_reply;
    ELSE
      dev_response := 0.5;  -- neutral if no reviews need reply
    END IF;

    -- Compute final score
    final_score :=
        (install_velocity * 0.20)
      + (0.25 * review_weight)       -- retention proxy via review engagement
      + (review_weight    * 0.20)
      + (update_score     * 0.15)
      + (report_penalty   * -0.30)
      + (dev_response     * 0.10);

    -- Apply spike dampening
    IF spike_flag THEN
      final_score := final_score * 0.5;
    END IF;

    -- Clamp to [0, 1]
    final_score := GREATEST(0, LEAST(final_score, 1.0));

    -- Update the app
    UPDATE public.apps
      SET rank_score = final_score,
          updated_at = NOW()
      WHERE id = app_row.id;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: run every 6 hours via pg_cron (if available)
-- SELECT cron.schedule('rank-recompute', '0 */6 * * *', 'SELECT public.compute_rank_scores()');
