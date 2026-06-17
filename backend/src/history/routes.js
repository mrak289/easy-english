const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Save a session result
router.post('/save', requireAuth, async (req, res) => {
  const { textId, textTitle, userRecall, aiFeedback, corrections } = req.body;
  if (!textId || !textTitle || !userRecall) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO recall_sessions (user_id, text_id, text_title, user_recall, ai_feedback, corrections)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, textId, textTitle, userRecall, aiFeedback || null, corrections ? JSON.stringify(corrections) : null]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('Failed to save session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Get user's history list
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, text_id, text_title, created_at,
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
