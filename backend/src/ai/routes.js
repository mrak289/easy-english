const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const SYSTEM_PROMPT = "You are a friendly, encouraging English teacher assessing an adult student practicing speed reading. The student was reading a simple textbook story (level A2) and has written a quick summary from memory. Evaluate their summary in clear, easy-to-read English appropriate for an A2 learner. Check if they captured the major details of the story (specified in the prompt). Correct any spelling or grammar mistakes gently. Then, rewrite their summary in simple, perfectly natural English. Be highly encouraging!";

async function getGeminiKey() {
  // Prefer env var, fall back to DB settings
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const { rows } = await db.query("SELECT value FROM settings WHERE key = 'GEMINI_API_KEY'");
  return rows[0]?.value || null;
}

router.post('/feedback', requireAuth, async (req, res) => {
  const { title, focusPoints, userRecall } = req.body;
  if (!title || !focusPoints || !userRecall) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = await getGeminiKey();
  if (!apiKey) {
    return res.status(503).json({ error: 'AI feedback is not configured on this server.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const userQuery = `Text Title: "${title}"\nTarget Concepts the student should recall: ${focusPoints}\n\nStudent's Written Summary from Memory:\n"${userRecall}"`;

  let delay = 1000;
  for (let retry = 0; retry < 5; retry++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ feedback: text });
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, delay));
    delay *= 2;
  }

  res.status(502).json({ error: 'Failed to get AI feedback after retries.' });
});

module.exports = router;
