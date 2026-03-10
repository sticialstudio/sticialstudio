import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const jwtSecret = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_SECRET = 'edtech-local-dev-jwt-secret';

if (!jwtSecret && isProduction) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

if (!jwtSecret && !isProduction) {
  console.warn('[auth] JWT_SECRET is not set. Using local development fallback secret.');
}

export const JWT_SECRET = jwtSecret || DEV_FALLBACK_SECRET;
export const JWT_EXPIRY = '7d';

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
