const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Create a new session (called once on mount)
router.post('/save', requireAuth, async (req, res) => {
  const { textId, textTitle, userRecall } = req.body;
  if (!textId || !textTitle || !userRecall) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO recall_sessions (user_id, text_id, text_title, user_recall)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.user.id, String(textId), textTitle, userRecall]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('Failed to save session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Update existing session with AI results (called after AI feedback)
router.patch('/:id', requireAuth, async (req, res) => {
  const { aiFeedback, corrections, score, criteria } = req.body;
  try {
    await db.query(
      `UPDATE recall_sessions
       SET ai_feedback = COALESCE($1, ai_feedback),
           corrections = COALESCE($2, corrections),
           score       = COALESCE($3, score),
           criteria    = COALESCE($4, criteria)
       WHERE id = $5 AND user_id = $6`,
      [
        aiFeedback || null,
        corrections ? JSON.stringify(corrections) : null,
        score ?? null,
        criteria ? JSON.stringify(criteria) : null,
        req.params.id,
        req.user.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Get user's history list
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, text_id, text_title, created_at, score, criteria,
              LEFT(user_recall, 120) AS recall_preview,
              ai_feedback IS NOT NULL AS has_feedback
       FROM recall_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Failed to get history:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Get a single session
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM recall_sessions WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

module.exports = router;
