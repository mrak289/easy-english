const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('./passport');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?error=auth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(process.env.FRONTEND_URL);
  }
);

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'lax' });
  res.json({ ok: true });
});

module.exports = router;
