const ADMIN_EMAIL = 'mrak28@gmail.com';

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { requireAdmin, ADMIN_EMAIL };
