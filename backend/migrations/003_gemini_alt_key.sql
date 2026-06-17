INSERT INTO settings (key, value) VALUES ('GEMINI_API_KEY_ALT', '')
  ON CONFLICT (key) DO NOTHING;
