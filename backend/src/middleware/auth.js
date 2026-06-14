const jwt = require('jsonwebtoken');
const db = require('../db');

async function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [userId]);
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAuth };
