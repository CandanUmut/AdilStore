-- Migration 003: Rating rate-limiting & review integrity
-- Prevents duplicate and spam reviews

-- Ensure one review per authenticated user per app
-- (belt-and-suspenders: index already exists but this makes it a hard constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_user_app_unique'
      AND conrelid = 'reviews'::regclass
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_user_app_unique
      UNIQUE (user_id, app_id);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END$$;

-- Anonymous review fingerprints: one per fingerprint per app per day
-- Stores a hashed fingerprint so anonymous users can't spam reviews
CREATE TABLE IF NOT EXISTS review_fingerprints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,  -- SHA-256(user_agent + date) first 16 hex chars
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS review_fingerprints_app_fp_day
  ON review_fingerprints (app_id, fingerprint, date_trunc('day', created_at AT TIME ZONE 'UTC'));

-- Function: check if a fingerprint is allowed to review today
CREATE OR REPLACE FUNCTION is_review_allowed(p_app_id uuid, p_fingerprint text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM review_fingerprints
    WHERE app_id = p_app_id
      AND fingerprint = p_fingerprint
      AND date_trunc('day', created_at AT TIME ZONE 'UTC')
          = date_trunc('day', now() AT TIME ZONE 'UTC')
  )
$$;

-- RLS on review_fingerprints
ALTER TABLE review_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to review_fingerprints"
  ON review_fingerprints FOR ALL TO service_role USING (true);

CREATE POLICY "Anon can insert fingerprint"
  ON review_fingerprints FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Rate-limit: prevent submitting more than 3 reviews per hour per user (auth)
-- Enforced via a DB function called from the API route
CREATE OR REPLACE FUNCTION check_review_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    SELECT COUNT(*) FROM reviews
    WHERE user_id = p_user_id
      AND created_at > now() - INTERVAL '1 hour'
  ) < 3
$$;
