// server.js  (root of /backend)
require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');

const postsRouter = require('./routes/posts');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const commentsRouter = require('./routes/comments');
const bookmarksRouter = require('./routes/bookmarks');

const app = express();

// -- debug route registrations -----------------------
const origGet = app.get.bind(app);
app.get = (path, ...h) => {
  console.log('🧭 app.get:', path);
  return origGet(path, ...h);
};
const origUse = app.use.bind(app);
app.use = (path, ...h) => {
  if (typeof path === 'string') console.log('🔧 app.use:', path);
  return origUse(path, ...h);
};
// ----------------------------------------------------

// ---------- middlewares ----------
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(express.json());

// ---------- API routes ----------
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/bookmarks', bookmarksRouter);

// ---------- serve front‑end ----------
const frontendPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback for client‑side routing (note the slash in '/*')
// ✅ safe version using RegExp
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// ---------- error handler ----------
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error('Server error:', err.message, err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});
/* eslint-enable no-unused-vars */

// ---------- start ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀  Server listening on http://localhost:${PORT}`),
);

module.exports = app;    // so supertest / vitest can import
