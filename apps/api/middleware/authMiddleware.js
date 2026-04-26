const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config/authConfig');

const AUTH_COOKIE_NAMES = ['sticial_session', 'token'];

function readCookieToken(req) {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) {
    return null;
  }

  for (const part of rawCookie.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (AUTH_COOKIE_NAMES.includes(name)) {
      return valueParts.join('=');
    }
  }

  return null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = bearerToken || readCookieToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.', requestId: req.requestId || null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.', requestId: req.requestId || null });
  }
}

module.exports = authMiddleware;
