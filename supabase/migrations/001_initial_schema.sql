-- AdilStore — Full Schema Migration
-- Run this in your Supabase SQL editor or via supabase db push
-- Existing tables (adil_apps, adil_app_ratings, adil_app_submissions) are extended, not replaced.

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          text PRIMARY KEY,
  name_en     text NOT NULL,
  name_tr     text,
  sort_order  int NOT NULL DEFAULT 0,
  icon        text
);

INSERT INTO categories (id, name_en, name_tr, sort_order, icon) VALUES
  ('spiritual',      'Spiritual growth',       'Maneviyat ve ihsan',     1, '🌙'),
  ('wellness',       'Wellbeing & mind',       'İyilik hali ve zihin',   2, '🌿'),
  ('learning',       'Learning & reflection',  'Öğrenme ve tefekkür',    3, '📚'),
  ('games',          'Games & play',           'Oyun ve eğlence',        4, '🎮'),
  ('tools',          'Tools & utilities',      'Araçlar ve yardımcılar', 5, '🔧'),
  ('environment',    'Environment & care',     'Çevre ve hassasiyet',    6, '🌍'),
  ('self-assessment','Self-assessment',        'Öz değerlendirme',       7, '🔍')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. DEVELOPER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS developer_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name    text NOT NULL,
  website         text,
  bio             text,
  contact_email   text NOT NULL,
  is_verified     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_developer_profiles_user_id ON developer_profiles(user_id);

-- ============================================================
-- 3. APPS — extend existing adil_apps or create fresh
-- ============================================================
-- If adil_apps exists, we add missing columns:
ALTER TABLE IF EXISTS adil_apps
  ADD COLUMN IF NOT EXISTS developer_id uuid REFERENCES developer_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS install_count bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_score numeric(10,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS screenshots  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS version      text;

-- Create fresh apps table (used if adil_apps doesn't exist / for new deployments)
CREATE TABLE IF NOT EXISTS apps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  category_id     text REFERENCES categories(id),
  developer_id    uuid REFERENCES developer_profiles(id),
  url             text NOT NULL,
  preview_url     text,
  description_en  text NOT NULL,
  description_tr  text,
  tags_en         text[] DEFAULT '{}',
  tags_tr         text[] DEFAULT '{}',
  platforms_en    text[] DEFAULT '{}',
  platforms_tr    text[] DEFAULT '{}',
  icon_filename   text,
  screenshots     text[] DEFAULT '{}',
  is_published    boolean DEFAULT false,
  is_featured     boolean DEFAULT false,
  is_external     boolean DEFAULT false,
  sort_order      int DEFAULT 0,
  install_count   bigint DEFAULT 0,
  ranking_score   numeric(10,6) DEFAULT 0,
  version         text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apps_slug            ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_apps_category_id     ON apps(category_id);
CREATE INDEX IF NOT EXISTS idx_apps_ranking_score   ON apps(ranking_score DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_apps_developer_id    ON apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_apps_is_published    ON apps(is_published, created_at DESC);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS apps_updated_at ON apps;
CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. APP VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  version         text NOT NULL,
  changelog_en    text,
  changelog_tr    text,
  url             text,
  is_current      boolean DEFAULT false,
  released_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON app_versions(app_id);

-- ============================================================
-- 5. INSTALLS — privacy-preserving, no PII
-- ============================================================
CREATE TABLE IF NOT EXISTS installs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  install_source  text CHECK (install_source IN ('direct','share_link','search','featured','category')) DEFAULT 'direct',
  share_link_id   uuid,
  -- SHA-256(user_agent + YYYY-MM-DD). No IP ever stored.
  user_agent_hash text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installs_app_id       ON installs(app_id);
CREATE INDEX IF NOT EXISTS idx_installs_created_at   ON installs(created_at);
CREATE INDEX IF NOT EXISTS idx_installs_app_created  ON installs(app_id, created_at);
CREATE INDEX IF NOT EXISTS idx_installs_hash         ON installs(user_agent_hash, app_id, created_at);

-- Partition installs by month for scalability (manual in Supabase free tier)
-- In production, use pg_partman or migrate to TimescaleDB when installs > 1M/month.

-- ============================================================
-- 6. REVIEWS — extends existing adil_app_ratings
-- ============================================================
ALTER TABLE IF EXISTS adil_app_ratings
  ADD COLUMN IF NOT EXISTS user_id             uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_verified_install boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS helpful_count       int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS developer_reply     text,
  ADD COLUMN IF NOT EXISTS developer_reply_at  timestamptz;

CREATE TABLE IF NOT EXISTS reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id              uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES auth.users(id),
  nickname            text,
  score               smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment             text,
  is_verified_install boolean DEFAULT false,
  helpful_count       int DEFAULT 0,
  is_published        boolean DEFAULT true,
  developer_reply     text,
  developer_reply_at  timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_app_id  ON reviews(app_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
-- One review per user per app (nullable user_id allows legacy anonymous)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_app
  ON reviews(user_id, app_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 7. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  reporter_id     uuid REFERENCES auth.users(id),
  reason          text NOT NULL CHECK (reason IN ('malware','spam','privacy','misleading','other')),
  description     text,
  created_at      timestamptz DEFAULT now(),
  resolved        boolean DEFAULT false,
  resolution_note text,
  resolved_by     uuid REFERENCES auth.users(id),
  resolved_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reports_app_id   ON reports(app_id);
CREATE INDEX IF NOT EXISTS idx_reports_resolved ON reports(resolved, created_at);

-- ============================================================
-- 8. SHARE LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS share_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id          uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  token           text UNIQUE NOT NULL,
  source_hint     text,
  install_count   bigint DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_links_token  ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_app_id ON share_links(app_id);

-- ============================================================
-- 9. APP SUBMISSIONS — extends existing adil_app_submissions
-- ============================================================
ALTER TABLE IF EXISTS adil_app_submissions
  ADD COLUMN IF NOT EXISTS developer_id  uuid REFERENCES developer_profiles(id),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_tr text,
  ADD COLUMN IF NOT EXISTS screenshots    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','needs_changes')),
  ADD COLUMN IF NOT EXISTS reviewer_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_by    uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at    timestamptz;

CREATE TABLE IF NOT EXISTS app_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    uuid REFERENCES developer_profiles(id),
  app_name        text NOT NULL,
  app_url         text NOT NULL,
  category_id     text REFERENCES categories(id),
  description_en  text NOT NULL,
  description_tr  text,
  contact_email   text NOT NULL,
  extra_notes     text,
  icon_path       text,
  screenshots     text[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','needs_changes')),
  reviewer_notes  text,
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_submissions_status       ON app_submissions(status);
CREATE INDEX IF NOT EXISTS idx_app_submissions_developer_id ON app_submissions(developer_id);

-- ============================================================
-- 10. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id),
  action          text NOT NULL,
  resource_type   text NOT NULL,
  resource_id     uuid,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource   ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- 11. USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role    text NOT NULL DEFAULT 'user' CHECK (role IN ('user','developer','admin')),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create user_roles row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================

-- APPS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published apps" ON apps;
CREATE POLICY "Public read published apps" ON apps
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Admin full access on apps" ON apps;
CREATE POLICY "Admin full access on apps" ON apps
  FOR ALL USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );
DROP POLICY IF EXISTS "Developers read own apps" ON apps;
CREATE POLICY "Developers read own apps" ON apps
  FOR SELECT USING (
    developer_id = (SELECT id FROM developer_profiles WHERE user_id = auth.uid())
  );

-- REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published reviews" ON reviews;
CREATE POLICY "Public read published reviews" ON reviews
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Auth users insert reviews" ON reviews;
CREATE POLICY "Auth users insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admin manage reviews" ON reviews;
CREATE POLICY "Admin manage reviews" ON reviews
  FOR ALL USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

-- INSTALLS (anonymous insert ok, no read for anon)
ALTER TABLE installs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can record install" ON installs;
CREATE POLICY "Anyone can record install" ON installs
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read installs" ON installs;
CREATE POLICY "Admin read installs" ON installs
  FOR SELECT USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('admin','developer')
  );

-- SHARE LINKS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read share links" ON share_links;
CREATE POLICY "Public read share links" ON share_links
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon insert share links" ON share_links;
CREATE POLICY "Anon insert share links" ON share_links
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update share link count" ON share_links;
CREATE POLICY "Public update share link count" ON share_links
  FOR UPDATE USING (true) WITH CHECK (true);

-- APP SUBMISSIONS
ALTER TABLE app_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users insert submissions" ON app_submissions;
CREATE POLICY "Auth users insert submissions" ON app_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Developers read own submissions" ON app_submissions;
CREATE POLICY "Developers read own submissions" ON app_submissions
  FOR SELECT USING (
    developer_id = (SELECT id FROM developer_profiles WHERE user_id = auth.uid())
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );
DROP POLICY IF EXISTS "Admin manage submissions" ON app_submissions;
CREATE POLICY "Admin manage submissions" ON app_submissions
  FOR ALL USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');

-- DEVELOPER PROFILES
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read developer profiles" ON developer_profiles;
CREATE POLICY "Public read developer profiles" ON developer_profiles
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own profile" ON developer_profiles;
CREATE POLICY "Users manage own profile" ON developer_profiles
  FOR ALL USING (user_id = auth.uid());

-- USER ROLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own role" ON user_roles;
CREATE POLICY "Users read own role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admin manage roles" ON user_roles;
CREATE POLICY "Admin manage roles" ON user_roles
  FOR ALL USING ((SELECT role FROM user_roles ur2 WHERE ur2.user_id = auth.uid()) = 'admin');

-- CATEGORIES (public read)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

-- AUDIT LOGS (admin read only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin read audit logs" ON audit_logs;
CREATE POLICY "Admin read audit logs" ON audit_logs
  FOR SELECT USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "System insert audit logs" ON audit_logs;
CREATE POLICY "System insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
