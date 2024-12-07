const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isAuthenticated } = require('../middleware/auth');
const db = require('../setup');

// Get settings page
router.get('/', isAuthenticated, (req, res) => {
  try {
    if (!db.open) {
      throw new Error('Database connection lost');
    }

    const stmt = db.prepare(`
      SELECT users.username, user_settings.* 
      FROM users 
      LEFT JOIN user_settings ON users.id = user_settings.userId 
      WHERE users.id = ?
    `);

    const settings = stmt.get(req.session.userId);

    if (!settings) {
      // Create default settings
      db.prepare(`
        INSERT OR IGNORE INTO user_settings (userId, theme) 
        VALUES (?, 'light')
      `).run(req.session.userId);
    }

    res.render('settings', {
      settings: settings || { theme: 'light' },
      error: req.query.error,
      message: req.query.message,
      csrfToken: req.csrfToken()
    });

  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('error', {
      errorCode: 500,
      errorMsg: 'Database connection error'
    });
  }
});

// Update settings
router.post('/update', isAuthenticated, (req, res) => {
  const { display_name, bio, theme } = req.body;

  try {
    db.prepare(`
      INSERT INTO user_settings (userId, display_name, bio, theme)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET 
        display_name = excluded.display_name,
        bio = excluded.bio,
        theme = excluded.theme
    `).run(req.session.userId, display_name, bio, theme);

    req.session.theme = theme;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/settings?error=Failed to update settings');
      }
      res.redirect('/settings?message=Settings updated');
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.redirect('/settings?error=Failed to update settings');
  }
});

router.post('/update/theme', isAuthenticated, (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.redirect('/settings?error=Invalid theme');
  }

  try {
    db.prepare(`
      INSERT INTO user_settings (userId, theme)
      VALUES (?, ?)
      ON CONFLICT(userId) DO UPDATE SET theme = ?
    `).run(req.session.userId, theme, theme);

    // Update session
    req.session.theme = theme;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/settings?error=Failed to update theme');
      }
      res.redirect('/settings?message=Theme updated');
    });
  } catch (error) {
    console.error('Theme update error:', error);
    res.redirect('/settings?error=Failed to update theme');
  }
});

module.exports = router;
