const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

async function getGeminiKeys() {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY_ALT) keys.push(process.env.GEMINI_API_KEY_ALT);
  const { rows } = await db.query(
    "SELECT key, value FROM settings WHERE key IN ('GEMINI_API_KEY', 'GEMINI_API_KEY_ALT') AND value != '' ORDER BY key"
  );
  for (const row of rows) {
    if (row.value && !keys.includes(row.value)) keys.push(row.value);
  }
  return keys;
}

async function getGeminiModel() {
  const { rows } = await db.query("SELECT value FROM settings WHERE key = 'GEMINI_MODEL'");
  return rows[0]?.value || DEFAULT_GEMINI_MODEL;
}

async function callGemini(prompt, apiKeys, geminiModel) {
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  for (const apiKey of apiKeys) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (_) {}
  }
  return null;
}

// GET /api/vocabulary — list user's words
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM vocabulary WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// POST /api/vocabulary — add word, get AI definition
router.post('/', requireAuth, async (req, res) => {
  const { word } = req.body;
  if (!word || !word.trim()) return res.status(400).json({ error: 'Word is required' });

  const clean = word.trim().toLowerCase();

  const [apiKeys, geminiModel] = await Promise.all([getGeminiKeys(), getGeminiModel()]);

  let definition = null;
  if (apiKeys.length) {
    const prompt = `Give a simple, clear definition of the English word "${clean}" in 1-2 sentences. Write for a language learner at A2 level. Use simple English only. Return just the definition text, nothing else.`;
    definition = await callGemini(prompt, apiKeys, geminiModel);
  }

  const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(clean)}`;

  try {
    const { rows } = await db.query(
      `INSERT INTO vocabulary (user_id, word, definition, image_url, status)
       VALUES ($1, $2, $3, $4, 'new') RETURNING *`,
      [req.user.id, clean, definition, imageUrl]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save word' });
  }
});

// PATCH /api/vocabulary/:id — update status
router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'learning', 'learned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE vocabulary SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// DELETE /api/vocabulary/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM vocabulary WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

module.exports = router;
