require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./setup');
const app = express();

const port = process.env.PORT || 3000;

// Rate limiting configuration for normal users
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message,
  standardHeaders: true,
  legacyHeaders: false,
  // Use userId if logged in, otherwise IP
  keyGenerator: req => req.session?.userId || req.ip,
  // Skip rate limiting for authenticated users on most routes
  skip: (req) => {
    const isAuthenticatedUser = !!req.session?.userId;
    const isAuthRoute = req.path.startsWith('/account');
    // Still apply limits on auth routes even for logged in users
    return isAuthenticatedUser && !isAuthRoute;
  }
});

// More generous limits
const limiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000,            // 300 requests per window
  'Too many requests, please try again later'
);

const authLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  1000,           // 1000 requests per window for auth routes
  'Too many authentication attempts'
);

// Core middleware
app.use(limiter); // Global limit
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  store: new SQLiteStore({
    dir: path.join(process.env.ROOT, 'database'),
    db: 'database.db',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

app.use(csurf());

// Middleware to load user settings
app.use((req, res, next) => {
  if (req.session?.userId) {
    const settings = db.prepare('SELECT theme FROM user_settings WHERE userId = ?')
      .get(req.session.userId);
    res.locals.theme = settings?.theme || 'light';
  } else {
    res.locals.theme = 'light';
  }
  next();
});

// After session middleware
app.use((req, res, next) => {
  // Make auth status available to all views
  res.locals.userId = req.session?.userId;
  res.locals.isAuthenticated = !!req.session?.userId;
  next();
});

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.header('Service-Worker-Allowed', '/');
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/bootstrap-icons/font', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// Service worker and manifest
app.get('/service-worker.js', (req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'public/service-worker.js'));
});
app.get('/manifest.json', (req, res) => {
  res.type('application/json').sendFile(path.join(__dirname, 'public/manifest.json'));
});

// Routes with rate limiting
app.use('/account', authLimiter, require('./routes/account'));
app.use('/settings', authLimiter, require('./routes/settings'));
app.use('/api', authLimiter, require('./routes/api'));
app.use('/search', createRateLimiter(5 * 60 * 1000, 50), require('./routes/search'));
app.use('/post', createRateLimiter(10 * 60 * 1000, 30), require('./routes/post'));

// Basic routes
[
  ['/', 'index'],
  ['/notifications', 'notifications'],
  ['/settings', 'settings'],
  ['/user', 'user']
].forEach(([url, route]) => app.use(url, require(`./routes/${route}`)));

// Error handlers
app.use((req, res) => res.status(404).render('error', { errorCode: 404, errorMsg: 'Page Not Found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { errorCode: 500, errorMsg: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
