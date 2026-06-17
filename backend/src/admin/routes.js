const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, ADMIN_EMAIL } = require('../middleware/requireAdmin');

router.use(requireAuth, requireAdmin);

// Users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, name, avatar_url, created_at, last_login_at, is_blocked FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/users/:id/block', async (req, res) => {
  const { id } = req.params;
  // Cannot block the admin
  try {
    const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    if (rows[0].email === ADMIN_EMAIL) return res.status(400).json({ error: 'Cannot block admin' });

    const { blocked } = req.body;
    await db.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [!!blocked, id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT key, value, updated_at FROM settings ORDER BY key');
    const SECRET_KEYS = new Set(['GEMINI_API_KEY', 'GEMINI_API_KEY_ALT']);
    const masked = rows.map(r => ({
      key: r.key,
      value: SECRET_KEYS.has(r.key)
        ? (r.value ? '••••••••' + r.value.slice(-4) : '')
        : r.value,
      rawValue: SECRET_KEYS.has(r.key) ? undefined : r.value,
      hasValue: r.value.length > 0,
      updated_at: r.updated_at,
    }));
    res.json(masked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== 'string') return res.status(400).json({ error: 'Value must be a string' });

  try {
    await db.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch available Gemini models using stored API key
router.get('/gemini-models', async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('GEMINI_API_KEY', 'GEMINI_API_KEY_ALT') AND value != '' ORDER BY key"
    );
    const apiKey = rows[0]?.value;
    if (!apiKey) return res.status(503).json({ error: 'No API key configured' });

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`);
    if (!r.ok) return res.status(r.status).json({ error: 'Failed to fetch models from Google' });

    const data = await r.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => ({ id: m.name.replace('models/', ''), displayName: m.displayName || m.name.replace('models/', '') }))
      .sort((a, b) => a.id.localeCompare(b.id));

    res.json(models);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
