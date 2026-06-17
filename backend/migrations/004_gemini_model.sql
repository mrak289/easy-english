INSERT INTO settings (key, value) VALUES ('GEMINI_MODEL', 'gemini-2.5-flash')
  ON CONFLICT (key) DO NOTHING;
