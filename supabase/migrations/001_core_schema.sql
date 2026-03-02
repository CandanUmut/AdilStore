-- ============================================================
-- AdilStore Core Database Schema
-- Migration 001: Foundation tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ─── USERS (extends Supabase auth.users) ────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ─── DEVELOPERS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.developers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  email         TEXT NOT NULL,
  website       TEXT,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending_review'
                  CHECK (status IN ('pending_review', 'approved', 'rejected', 'suspended')),
  verified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_developers_user_id ON public.developers(user_id);
CREATE INDEX idx_developers_status ON public.developers(status);

-- ─── CATEGORIES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id            TEXT PRIMARY KEY,  -- e.g. 'spiritual', 'games'
  name_en       TEXT NOT NULL,
  name_tr       TEXT,
  icon          TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.categories (id, name_en, name_tr, sort_order) VALUES
  ('spiritual',       'Spiritual growth',      'Maneviyat ve ihsan',     1),
  ('wellness',        'Wellbeing & mind',      'İyilik hali ve zihin',   2),
  ('learning',        'Learning & reflection', 'Öğrenme ve tefekkür',    3),
  ('games',           'Games & play',          'Oyun ve eğlence',        4),
  ('tools',           'Tools & utilities',     'Araçlar ve yardımcılar', 5),
  ('environment',     'Environment & care',    'Çevre ve hassasiyet',    6),
  ('self-assessment', 'Self-assessment',       'Öz değerlendirme',       7)
ON CONFLICT (id) DO NOTHING;

-- ─── APPS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.apps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  developer_id    UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL REFERENCES public.categories(id),
  url             TEXT NOT NULL,
  preview_url     TEXT,
  description_en  TEXT NOT NULL DEFAULT '',
  description_tr  TEXT DEFAULT '',
  tags_en         TEXT[] DEFAULT '{}',
  tags_tr         TEXT[] DEFAULT '{}',
  platforms_en    TEXT[] DEFAULT '{}',
  platforms_tr    TEXT[] DEFAULT '{}',
  icon_url        TEXT,
  icon_filename   TEXT,
  privacy_url     TEXT,
  source_url      TEXT,
  current_version TEXT DEFAULT '1.0.0',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('draft', 'pending', 'in_review', 'published', 'rejected', 'suspended', 'removed')),
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_external     BOOLEAN NOT NULL DEFAULT FALSE,
  rank_score      REAL NOT NULL DEFAULT 0,
  install_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_slug ON public.apps(slug);
CREATE INDEX idx_apps_category ON public.apps(category);
CREATE INDEX idx_apps_status ON public.apps(status);
CREATE INDEX idx_apps_developer_id ON public.apps(developer_id);
CREATE INDEX idx_apps_rank_score ON public.apps(rank_score DESC);
CREATE INDEX idx_apps_name_trgm ON public.apps USING gin(name gin_trgm_ops);

-- ─── APP VERSIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_versions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id        UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  version       TEXT NOT NULL,
  changelog_en  TEXT,
  changelog_tr  TEXT,
  binary_url    TEXT,
  binary_size   BIGINT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'deprecated', 'yanked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_versions_app_id ON public.app_versions(app_id);

-- ─── INSTALLS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.installs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id        UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  installed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source        TEXT DEFAULT 'direct'  -- 'direct', 'share_link', 'qr', 'search'
);

CREATE INDEX idx_installs_app_id ON public.installs(app_id);
CREATE INDEX idx_installs_user_id ON public.installs(user_id);
CREATE INDEX idx_installs_date ON public.installs(installed_at);

-- ─── REVIEWS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviews (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id               UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name         TEXT,
  score                SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment              TEXT,
  is_verified_install  BOOLEAN NOT NULL DEFAULT FALSE,
  status               TEXT NOT NULL DEFAULT 'visible'
                         CHECK (status IN ('visible', 'hidden', 'flagged', 'removed')),
  helpfulness_up       INT NOT NULL DEFAULT 0,
  helpfulness_down     INT NOT NULL DEFAULT 0,
  developer_reply      TEXT,
  developer_replied_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_app_id ON public.reviews(app_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);

-- ─── REPORTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type   TEXT NOT NULL CHECK (target_type IN ('app', 'review', 'developer')),
  target_id     UUID NOT NULL,
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolved_by   UUID REFERENCES auth.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON public.reports(status);

-- ─── APP SUBMISSIONS (review pipeline) ─────────────────────

CREATE TABLE IF NOT EXISTS public.app_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id    UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  category        TEXT,
  contact_email   TEXT,
  description_en  TEXT,
  description_tr  TEXT,
  tags_en         TEXT[] DEFAULT '{}',
  platforms_en    TEXT[] DEFAULT '{}',
  privacy_url     TEXT,
  source_url      TEXT,
  version         TEXT DEFAULT '1.0.0',
  icon_path       TEXT,
  extra_notes     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'changes_requested')),
  review_notes    TEXT,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_submissions_status ON public.app_submissions(status);

-- ─── SHARE LINKS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.share_links (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id      UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  medium      TEXT NOT NULL DEFAULT 'link'  -- 'link', 'qr', 'share_sheet', 'embed'
              CHECK (medium IN ('link', 'qr', 'share_sheet', 'embed')),
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_links_app_id ON public.share_links(app_id);

-- ─── AUDIT LOG ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,  -- e.g. 'app.published', 'review.removed', 'developer.approved'
  target_type TEXT,
  target_id   UUID,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read for published apps
CREATE POLICY "Public can read published apps"
  ON public.apps FOR SELECT
  USING (status = 'published');

-- Developers can read their own apps regardless of status
CREATE POLICY "Developers can read own apps"
  ON public.apps FOR SELECT
  USING (developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

-- Categories are publicly readable
CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT
  USING (true);

-- Reviews are publicly readable when visible
CREATE POLICY "Public can read visible reviews"
  ON public.reviews FOR SELECT
  USING (status = 'visible');

-- Users can insert reviews
CREATE POLICY "Users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);  -- anon can rate for now; tighten later

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Developers can read their own developer profile
CREATE POLICY "Developers read own profile"
  ON public.developers FOR SELECT
  USING (user_id = auth.uid());

-- Anyone can insert a developer application
CREATE POLICY "Users can apply as developer"
  ON public.developers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- App submissions: anyone authenticated can insert
CREATE POLICY "Authenticated users can submit apps"
  ON public.app_submissions FOR INSERT
  WITH CHECK (true);  -- anon allowed for backward compat

-- App submissions: developers can read their own
CREATE POLICY "Developers read own submissions"
  ON public.app_submissions FOR SELECT
  USING (developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

-- Share links: anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can log share clicks"
  ON public.share_links FOR INSERT
  WITH CHECK (true);

-- Installs: anyone can insert
CREATE POLICY "Anyone can log installs"
  ON public.installs FOR INSERT
  WITH CHECK (true);

-- App versions: public read
CREATE POLICY "Public can read app versions"
  ON public.app_versions FOR SELECT
  USING (app_id IN (SELECT id FROM public.apps WHERE status = 'published'));

-- ─── UPDATED_AT TRIGGER ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
