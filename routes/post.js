const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../models/Post');
const marked = require('marked');
const createDOMPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const hljs = require('highlight.js');

// Configure marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const window = new JSDOM('').window;
const DOMPurifier = createDOMPurifier(window);

// Sanitize and render markdown
function renderMarkdown(content) {
  const rawHtml = marked.parse(content);
  return DOMPurifier.sanitize(rawHtml);
}

router.get('/create', isAuthenticated, (req, res) => {
  res.render('create-post');
});

router.post('/create', isAuthenticated, (req, res) => {
  const { content } = req.body;
  try {
    const htmlContent = marked.parse(content);
    const stmt = db.prepare(`
      INSERT INTO posts (userId, content, htmlContent) 
      VALUES (?, ?, ?)
    `);
    stmt.run(req.session.userId, content, htmlContent);
    res.status(201).json({ message: 'Post created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

router.get("/post/:postID", (req, res) => {
  const postID = req.params.postID;
  res.render("post.ejs", { postID: postID });
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = db.prepare(`
      SELECT posts.*, users.username, COUNT(likes.postId) as likeCount 
      FROM posts 
      JOIN users ON posts.userId = users.id 
      LEFT JOIN likes ON posts.id = likes.postId 
      WHERE posts.id = ?
      GROUP BY posts.id
    `).get(req.params.id);

    if (!post) {
      return res.status(404).render('error', {
        errorCode: 404,
        errorMsg: 'Post not found'
      });
    }

    // Process markdown if needed
    post.htmlContent = post.htmlContent || DOMPurifier.sanitize(marked.parse(post.content));

    res.render('post', { // Changed from post-detail to post
      post,
      fullView: true,
      user: req.session?.userId
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', {
      errorCode: 500,
      errorMsg: 'Failed to load post'
    });
  }
});

module.exports = router;
