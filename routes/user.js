const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../models/Post');
const rateLimit = require('express-rate-limit');

// Rate limiters
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/user to 100 requests per window
  message: 'Too many profile requests',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.userId || req.ip
});

const editLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 profile edits per hour
  message: 'Too many profile updates',
  standardHeaders: true,
  keyGenerator: (req) => req.session.userId
});

// Apply rate limiting to all routes
router.use(profileLimiter);

// View own profile
router.get('/me', isAuthenticated, (req, res) => {
  try {
    const profile = db.prepare(`
      SELECT users.username, profiles.* 
      FROM users 
      LEFT JOIN profiles ON users.id = profiles.userId 
      WHERE users.id = ?
    `).get(req.session.userId);

    const posts = db.prepare(`
      SELECT posts.*, COUNT(likes.postId) as likeCount 
      FROM posts 
      LEFT JOIN likes ON posts.id = likes.postId 
      WHERE posts.userId = ? 
      GROUP BY posts.id 
      ORDER BY posts.created_at DESC
    `).all(req.session.userId);

    res.render('profile', {
      username: profile?.username,
      displayName: profile?.username, // Using username as displayName
      profile,
      posts: posts || [],
      isOwner: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      errorCode: 500, 
      errorMsg: 'Failed to load profile' 
    });
  }
});

// View user profile
router.get(['/@:username'], async (req, res) => {
  try {
    const username = req.params.username.replace('@', ''); // Remove @ if present
    
    const userProfile = db.prepare(`
      SELECT users.id as userId, users.username, profiles.* 
      FROM users 
      LEFT JOIN profiles ON users.id = profiles.userId 
      WHERE users.username = ?
    `).get(username);

    if (!userProfile) {
      return res.status(404).render('error', { 
        errorCode: 404, 
        errorMsg: 'User not found' 
      });
    }

    const posts = db.prepare(`
      SELECT posts.*, COUNT(likes.postId) as likeCount 
      FROM posts 
      LEFT JOIN likes ON posts.id = likes.postId 
      WHERE posts.userId = ? 
      GROUP BY posts.id 
      ORDER BY posts.created_at DESC
    `).all(userProfile.userId);

    res.render('profile', {
      username: userProfile.username,
      displayName: userProfile.username,
      profile: userProfile,
      posts: posts || [],
      isOwner: req.session?.userId === userProfile.userId
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      errorCode: 500, 
      errorMsg: 'Failed to load profile' 
    });
  }
});

// Update profile
router.post('/me', [isAuthenticated, editLimiter], async (req, res) => {
  const { bio, location, website } = req.body;
  try {
    db.prepare(`
      UPDATE profiles 
      SET bio = ?, location = ?, website = ? 
      WHERE userId = ?
    `).run(bio, location, website, req.session.userId);
    
    res.redirect('/user/me');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
