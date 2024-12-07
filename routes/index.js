const express = require('express');
const router = express.Router();
const db = require('../models/Post');
const rateLimit = require('express-rate-limit');
const marked = require('marked');
const createDOMPurifier = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurifier = createDOMPurifier(window);

marked.setOptions({
  breaks: true,
  gfm: true
});

const indexLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.userId || req.ip
});

router.use(indexLimiter);

router.get('/', async (req, res) => {
  try {
    let posts = db.prepare(`
      SELECT posts.*, users.username, COUNT(likes.postId) as likeCount 
      FROM posts 
      JOIN users ON posts.userId = users.id 
      LEFT JOIN likes ON posts.id = likes.postId 
      GROUP BY posts.id 
      ORDER BY posts.created_at DESC
    `).all();

    // Process markdown for posts without htmlContent
    posts = posts.map(post => ({
      ...post,
      htmlContent: post.htmlContent || DOMPurifier.sanitize(marked.parse(post.content))
    }));

    res.render('index', { 
      posts,
      user: req.session?.userId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      errorCode: 500, 
      errorMsg: 'Failed to load posts' 
    });
  }
});

module.exports = router;
