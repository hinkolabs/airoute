-- Shopping Shorts Sourcing: widen shorts_product_matches.provider to also allow
-- 'alibaba' and 'aliexpress' (previously '1688' only). Verified live 2026-08-09
-- that the backing Apify actor (devcake/scraper-by-image) supports exactly these
-- three providers — Taobao is NOT supported by the actor and is intentionally
-- excluded here.
--
-- Table is additive-only elsewhere; this only relaxes an existing CHECK
-- constraint (no column/type changes, no data migration needed — table is
-- currently empty in production).
--
-- The original constraint has no explicit name in the 20260809 migration, so we
-- look it up dynamically via pg_constraint instead of guessing the
-- auto-generated name, then drop and recreate it.
--
-- Rollback:
--   DO $$
--   DECLARE con_name text;
--   BEGIN
--     SELECT conname INTO con_name FROM pg_constraint
--       WHERE conrelid = 'shorts_product_matches'::regclass AND contype = 'c'
--         AND pg_get_constraintdef(oid) ILIKE '%provider%';
--     IF con_name IS NOT NULL THEN
--       EXECUTE format('ALTER TABLE shorts_product_matches DROP CONSTRAINT %I', con_name);
--     END IF;
--   END $$;
--   ALTER TABLE shorts_product_matches ADD CONSTRAINT shorts_product_matches_provider_check
--     CHECK (provider IN ('1688'));

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'shorts_product_matches'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%provider%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE shorts_product_matches DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE shorts_product_matches
  ADD CONSTRAINT shorts_product_matches_provider_check
  CHECK (provider IN ('1688', 'alibaba', 'aliexpress'));
