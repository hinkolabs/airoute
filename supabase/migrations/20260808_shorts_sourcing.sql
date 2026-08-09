-- Shopping Shorts Sourcing: product image -> AI analysis -> Chinese keywords ->
-- Douyin/Xiaohongshu candidate video search -> dedupe/rank -> favorites.
-- Admin-only feature for now (see /kr/workspace/admin/shopping-shorts), but all
-- tables are workspace_id scoped from day one so it can be opened to customers later
-- without any schema change (see docs plan: 쇼핑숏츠_소싱_자동화_통합).
--
-- Rollback:
--   DROP TABLE IF EXISTS shorts_favorites;
--   DROP TABLE IF EXISTS shorts_sourcing_jobs;
--   DROP TABLE IF EXISTS shorts_source_items;
--   DROP TABLE IF EXISTS shorts_sourcing_keywords;
--   DROP TABLE IF EXISTS shorts_sourcing_sessions;
--   DROP TABLE IF EXISTS shorts_search_cache;
--
-- All mutations from the app go through API routes using the service-role admin
-- client (same pattern as kb_chunks / autoposting items), so client-facing RLS is
-- read-only for workspace members; no insert/update/delete policies are defined.

-- 1. shorts_sourcing_sessions — one row per uploaded product image analysis
CREATE TABLE IF NOT EXISTS shorts_sourcing_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_hash          TEXT NOT NULL,
  image_storage_path  TEXT,
  product_name_ko     TEXT,
  category_ko         TEXT,
  analysis_json       JSONB,
  vision_model        TEXT,
  prompt_version      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_sourcing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_sessions"
  ON shorts_sourcing_sessions FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_shorts_sessions_workspace_hash
  ON shorts_sourcing_sessions (workspace_id, image_hash);

CREATE INDEX IF NOT EXISTS idx_shorts_sessions_workspace_created
  ON shorts_sourcing_sessions (workspace_id, created_at DESC);

-- 2. shorts_sourcing_keywords — AI-generated + user-edited Chinese search keywords
CREATE TABLE IF NOT EXISTS shorts_sourcing_keywords (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES shorts_sourcing_sessions(id) ON DELETE CASCADE,
  keyword           TEXT NOT NULL,
  is_ai_generated   BOOLEAN NOT NULL DEFAULT true,
  is_selected       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_sourcing_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_keywords"
  ON shorts_sourcing_keywords FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM shorts_sourcing_sessions
      WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_shorts_keywords_session
  ON shorts_sourcing_keywords (session_id);

-- 3. shorts_source_items — normalized Douyin/Xiaohongshu candidate videos
CREATE TABLE IF NOT EXISTS shorts_source_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES shorts_sourcing_sessions(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('douyin', 'xiaohongshu')),
  platform_post_id    TEXT,
  canonical_url       TEXT NOT NULL,
  title               TEXT,
  author_name         TEXT,
  thumbnail_url       TEXT,
  preview_media_url   TEXT,
  media_url           TEXT,
  duration_seconds    REAL,
  like_count          INTEGER,
  comment_count       INTEGER,
  share_count         INTEGER,
  published_at        TIMESTAMPTZ,
  matched_keywords    JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[] of keywords that surfaced this item
  text_score          REAL,
  visual_score        REAL,
  engagement_score    REAL,
  recency_score       REAL,
  final_score         REAL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_source_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_source_items"
  ON shorts_source_items FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Dedupe key #1: same session + platform + post id. platform_post_id is never NULL
-- in practice (the app synthesizes a fallback id from the canonical URL when a
-- provider omits one — see normalize.ts:fallbackPostId), so this is a plain
-- (non-partial) unique index, which Supabase's upsert(..., { onConflict }) needs
-- as its conflict target.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_shorts_source_items_session_platform_post
  ON shorts_source_items (session_id, platform, platform_post_id);

-- Dedupe key #2 (fallback lookup, not unique — canonical URL normalization happens in app code)
CREATE INDEX IF NOT EXISTS idx_shorts_source_items_session_canonical
  ON shorts_source_items (session_id, canonical_url);

CREATE INDEX IF NOT EXISTS idx_shorts_source_items_session
  ON shorts_source_items (session_id);

-- 4. shorts_favorites — user's saved/starred candidates ("소싱함")
CREATE TABLE IF NOT EXISTS shorts_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id    UUID NOT NULL UNIQUE REFERENCES shorts_source_items(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  note              TEXT,
  usage_status      TEXT NOT NULL DEFAULT 'unreviewed' CHECK (usage_status IN ('unreviewed', 'approved', 'rejected')),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_favorites"
  ON shorts_favorites FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_shorts_favorites_workspace
  ON shorts_favorites (workspace_id, created_at DESC);

-- 5. shorts_search_cache — global (not workspace-scoped) cache to avoid paying for the
-- same platform+keyword search twice. Service-role only: RLS enabled, zero policies.
CREATE TABLE IF NOT EXISTS shorts_search_cache (
  cache_key         TEXT PRIMARY KEY,
  platform          TEXT NOT NULL CHECK (platform IN ('douyin', 'xiaohongshu')),
  keyword           TEXT NOT NULL,
  response_json     JSONB NOT NULL,
  provider_version  TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL
);

ALTER TABLE shorts_search_cache ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the service-role admin client (bypasses RLS) reads/writes this table.

CREATE INDEX IF NOT EXISTS idx_shorts_search_cache_expires
  ON shorts_search_cache (expires_at);

-- 6. shorts_sourcing_jobs — async Apify actor run tracking (search is never awaited synchronously)
CREATE TABLE IF NOT EXISTS shorts_sourcing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES shorts_sourcing_sessions(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('douyin', 'xiaohongshu')),
  keyword         TEXT NOT NULL,
  limit_per_keyword INTEGER NOT NULL DEFAULT 20,
  apify_actor_id  TEXT,
  apify_run_id    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  error_message   TEXT,
  result_count    INTEGER,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_sourcing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_jobs"
  ON shorts_sourcing_jobs FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_shorts_jobs_session
  ON shorts_sourcing_jobs (session_id);

CREATE INDEX IF NOT EXISTS idx_shorts_jobs_apify_run
  ON shorts_sourcing_jobs (apify_run_id);

-- 7. Raise the shared workspace-assets bucket's size limit so product screenshots
-- (up to 10MB per SSOT) can be uploaded. Additive-only: keeps existing mime types,
-- only widens the limit (existing usages like 2MB logos are unaffected).
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'workspace-assets'
  AND (file_size_limit IS NULL OR file_size_limit < 10485760);
