const express = require('express');
const cookieParser = require('cookie-parser');
const passport = require('./auth/passport');
const authRoutes = require('./auth/routes');
const aiRoutes = require('./ai/routes');
const adminRoutes = require('./admin/routes');
const historyRoutes = require('./history/routes');
const vocabularyRoutes = require('./vocabulary/routes');
const migrate = require('./migrate');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

migrate()
  .then(() => app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`)))
  .catch(err => { console.error('Migration failed:', err); process.exit(1); });
