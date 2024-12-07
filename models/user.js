const db = require('../setup');
const bcrypt = require('bcrypt');

function createUser(username, password) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
  return result.lastInsertRowid;
}

function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function authenticateUser(username, password) {
  const user = getUserByUsername(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return null;
}

module.exports = {
  createUser,
  authenticateUser,
  getUserByUsername,
};