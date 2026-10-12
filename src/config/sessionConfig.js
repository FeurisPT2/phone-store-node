const session = require('express-session');
module.exports = session({
  secret: 'phone_store_secret_2026',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: false }
});
