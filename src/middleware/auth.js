const jwt = require('jsonwebtoken');
const db = require('../database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Verify user still exists in database
    db.get('SELECT id, email FROM users WHERE id = ?', [user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!row) {
        return res.status(403).json({ message: 'User not found' });
      }

      req.user = row;
      next();
    });
  });
};

module.exports = { authenticateToken };

