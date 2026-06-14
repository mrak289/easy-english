const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const db = require('../db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.FRONTEND_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE
         SET name = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             last_login_at = NOW()
       RETURNING id, email, name, avatar_url`,
      [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value]
    );
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
}));

module.exports = passport;
