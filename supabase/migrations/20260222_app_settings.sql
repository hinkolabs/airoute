-- App-level settings (feature flags, runtime config)
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial demo_mode flag (matches current env-var default)
INSERT INTO app_settings (key, value)
VALUES ('demo_mode', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS: anyone can read, only service_role can write
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_public_read"
  ON app_settings FOR SELECT
  USING (true);

CREATE POLICY "app_settings_service_write"
  ON app_settings FOR ALL
  USING (auth.role() = 'service_role');
