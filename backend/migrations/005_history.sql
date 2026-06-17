CREATE TABLE IF NOT EXISTS recall_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  text_id VARCHAR(100) NOT NULL,
  text_title TEXT NOT NULL,
  user_recall TEXT NOT NULL,
  ai_feedback TEXT,
  corrections JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recall_sessions_user_id ON recall_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recall_sessions_created_at ON recall_sessions(created_at DESC);
