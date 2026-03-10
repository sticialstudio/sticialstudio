const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config/authConfig');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach the decoded user payload securely to the request stack
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;
