import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';

/**
 * Enforces authentication on protected routes.
 * Accepts Bearer token in 'Authorization' header or 'token' query parameter (for iframe/downloads).
 */
export function requireAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = req.query.token.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Optional authentication middleware.
 * If token is present and valid, attaches req.user; otherwise proceeds as unauthenticated.
 */
export function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = req.query.token.trim();
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.getUserById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }

  next();
}
