-- Migration 004: Full-text search for apps
-- Adds a tsvector column with GIN index for fast bilingual search

-- Add search vector column
ALTER TABLE apps ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Function to build the search vector from English + Turkish fields
CREATE OR REPLACE FUNCTION build_app_search_vector(
  name_en    text,
  name_tr    text,
  desc_en    text,
  desc_tr    text,
  category   text
) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('simple',  coalesce(name_tr, name_en, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(desc_en, '')), 'B') ||
    setweight(to_tsvector('simple',  coalesce(desc_tr, desc_en, '')), 'B') ||
    setweight(to_tsvector('simple',  coalesce(category, '')), 'C')
  );
END
$$;

-- GIN index on the search vector
CREATE INDEX IF NOT EXISTS apps_search_vector_idx ON apps USING GIN (search_vector);

-- Trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION trg_apps_search_vector()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := build_app_search_vector(
    NEW.name,
    NEW.name,
    NEW.description_en,
    NEW.description_tr,
    NEW.category_id
  );
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS apps_search_vector_trigger ON apps;
CREATE TRIGGER apps_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description_en, description_tr, category_id
  ON apps
  FOR EACH ROW EXECUTE FUNCTION trg_apps_search_vector();

-- Backfill all existing rows
UPDATE apps
SET search_vector = build_app_search_vector(name, name, description_en, description_tr, category_id)
WHERE search_vector IS NULL;
