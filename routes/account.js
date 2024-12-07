const express = require('express');
const router = express.Router();
const { createUser, authenticateUser } = require('../models/user');
const csrf = require('csurf');

// Render the login page
router.get('/login', (req, res) => {
  res.render('account/login', { csrfToken: req.csrfToken() });
});

// Handle login form submission
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = authenticateUser(username, password);
  if (user) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.render('account/login', {
      error: 'Invalid username or password',
      csrfToken: req.csrfToken(),
    });
  }
});

// Render the registration page
router.get('/register', (req, res) => {
  res.render('account/register', { csrfToken: req.csrfToken() });
});

// Handle registration form submission
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  try {
    createUser(username, password);
    res.redirect('/account/login');
  } catch (error) {
    res.render('account/register', {
      error: 'Username already exists',
      csrfToken: req.csrfToken(),
    });
  }
});

// Handle logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
