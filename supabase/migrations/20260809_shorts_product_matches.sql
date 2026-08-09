-- Shopping Shorts Sourcing: 1688 reverse-image-search matches.
-- New step inserted between "upload screenshot" and "search Douyin/Xiaohongshu":
-- reverse-image-search the uploaded screenshot against 1688 to find the exact
-- product listing, let the admin confirm the right one, then derive search
-- keywords from that listing's real Chinese title/description instead of a
-- generic vision-model guess. Purely additive — no changes to existing tables.
--
-- Rollback:
--   DROP TABLE IF EXISTS shorts_product_matches;

CREATE TABLE IF NOT EXISTS shorts_product_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES shorts_sourcing_sessions(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT '1688' CHECK (provider IN ('1688')),
  product_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT NOT NULL,
  images          JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[] of extra product photo urls
  product_url     TEXT,
  price_min       REAL,
  price_max       REAL,
  currency        TEXT,
  shop_name       TEXT,
  shop_url        TEXT,
  rating          REAL,
  sold_count      INTEGER,
  image_rank      INTEGER, -- 1 = closest visual match per the provider's own ranking
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[]
  is_selected     BOOLEAN NOT NULL DEFAULT false, -- admin-confirmed "this is the product"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shorts_product_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_shorts_product_matches"
  ON shorts_product_matches FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Avoid duplicate rows if a session's match search is re-run.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_shorts_product_matches_session_provider_product
  ON shorts_product_matches (session_id, provider, product_id);

CREATE INDEX IF NOT EXISTS idx_shorts_product_matches_session
  ON shorts_product_matches (session_id);
