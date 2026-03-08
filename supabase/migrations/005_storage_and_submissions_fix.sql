-- Migration 005: Fix storage bucket policies + harden app_submissions RLS
-- Run this in the Supabase Dashboard → SQL Editor

-- ============================================================
-- 1. STORAGE BUCKET: adil-icons
--    Allows authenticated users to upload icons and anyone to view them.
-- ============================================================

-- Create the bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('adil-icons', 'adil-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read adil-icons"       ON storage.objects;
DROP POLICY IF EXISTS "Auth upload adil-icons"       ON storage.objects;
DROP POLICY IF EXISTS "Owner delete adil-icons"      ON storage.objects;

-- Anyone can read (bucket is public but explicit policy is safer)
CREATE POLICY "Public read adil-icons"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'adil-icons');

-- Authenticated users can upload to submissions/ folder
CREATE POLICY "Auth upload adil-icons"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'adil-icons'
    AND (storage.foldername(name))[1] = 'submissions'
  );

-- Owners can delete their own uploads
CREATE POLICY "Owner delete adil-icons"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'adil-icons'
    AND owner = auth.uid()
  );

-- ============================================================
-- 2. APP SUBMISSIONS — fix RLS policies
--    Replace subquery-based policies with SECURITY DEFINER
--    helper functions to avoid potential recursion / 500 errors.
-- ============================================================

-- Helper: get the developer profile id for the current user
CREATE OR REPLACE FUNCTION get_my_developer_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM developer_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Helper: get the role for the current user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Drop old policies
DROP POLICY IF EXISTS "Auth users insert submissions"    ON app_submissions;
DROP POLICY IF EXISTS "Developers read own submissions"  ON app_submissions;
DROP POLICY IF EXISTS "Admin manage submissions"         ON app_submissions;

-- Re-create with SECURITY DEFINER helper functions
CREATE POLICY "Auth users insert submissions" ON app_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Developers read own submissions" ON app_submissions
  FOR SELECT USING (
    developer_id = get_my_developer_id()
    OR get_my_role() = 'admin'
  );

CREATE POLICY "Admin manage submissions" ON app_submissions
  FOR ALL USING (get_my_role() = 'admin');
