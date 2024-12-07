function isAuthenticated(req, res, next) {
  if (req.session?.userId) {
    return next();
  }
  res.redirect('/account/login');
}

module.exports = { isAuthenticated };