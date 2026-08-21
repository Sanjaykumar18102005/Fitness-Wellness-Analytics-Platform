const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_wellness_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Forbidden: User identity or role missing' });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      error: `Forbidden: Action requires one of roles [${allowedRoles.join(', ')}]`,
    });
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
