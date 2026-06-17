const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const SYSTEM_PROMPT = "You are a friendly, encouraging English teacher assessing an adult student practicing speed reading. The student was reading a simple textbook story (level A2) and has written a quick summary from memory. Evaluate their summary in clear, easy-to-read English appropriate for an A2 learner. Check if they captured the major details of the story (specified in the prompt). Correct any spelling or grammar mistakes gently. Then, rewrite their summary in simple, perfectly natural English. Be highly encouraging!";

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

router.post('/feedback', requireAuth, async (req, res) => {
  const { title, focusPoints, userRecall } = req.body;
  if (!title || !focusPoints || !userRecall) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKeys = await getGeminiKeys();
  if (!apiKeys.length) {
    return res.status(503).json({ error: 'AI feedback is not configured on this server.' });
  }

  const userQuery = `Text Title: "${title}"\nTarget Concepts the student should recall: ${focusPoints}\n\nStudent's Written Summary from Memory:\n"${userRecall}"`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
  });

  for (const apiKey of apiKeys) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    let delay = 1000;
    for (let retry = 0; retry < 3; retry++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return res.json({ feedback: text });
        }
        // 429 or 5xx — retry with same key; 400/401/403 — broken key, try next
        const status = response.status;
        if (status === 400 || status === 401 || status === 403) break;
      } catch (_) {}
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }

  res.status(502).json({ error: 'Failed to get AI feedback after retries.' });
});

module.exports = router;
