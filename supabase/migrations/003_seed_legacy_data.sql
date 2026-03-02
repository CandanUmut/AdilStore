-- ============================================================
-- AdilStore Legacy Data Migration
-- Migration 003: Seed categories + migrate adil_apps → apps
-- ============================================================
-- This migration copies data from the existing adil_apps table
-- into the new normalized apps table. Run AFTER 001.
-- Only runs if adil_apps exists; safe to skip if starting fresh.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adil_apps') THEN
    INSERT INTO public.apps (
      slug, name, category, url, preview_url,
      description_en, description_tr,
      tags_en, tags_tr, platforms_en, platforms_tr,
      icon_filename, is_featured, is_external, status,
      created_at, updated_at
    )
    SELECT
      COALESCE(slug, id::TEXT),
      name,
      COALESCE(category, 'tools'),
      url,
      COALESCE(preview_url, url),
      COALESCE(description_en, ''),
      COALESCE(description_tr, ''),
      COALESCE(tags_en, '{}'),
      COALESCE(tags_tr, '{}'),
      COALESCE(platforms_en, '{}'),
      COALESCE(platforms_tr, '{}'),
      icon_filename,
      COALESCE(is_featured, FALSE),
      COALESCE(is_external, FALSE),
      CASE WHEN is_published THEN 'published' ELSE 'draft' END,
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW())
    FROM adil_apps
    ON CONFLICT (slug) DO NOTHING;

    RAISE NOTICE 'Migrated apps from adil_apps to apps table';
  ELSE
    RAISE NOTICE 'adil_apps table not found — skipping legacy migration';
  END IF;
END $$;
