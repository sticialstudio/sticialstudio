const { prisma } = require('../../../packages/database/dist');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { logApiEvent, sendApiError, serializeError } = require('../lib/telemetry');

const router = express.Router();
const { JWT_SECRET } = require('../config/authConfig');

function signAppToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function serializeUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
    supabaseAnonKey,
  };
}

async function fetchSupabaseUser(accessToken) {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase auth is not configured on the API.');
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return sendApiError(res, 400, {
        message: 'Email and password are required',
        code: 'AUTH_REGISTER_INVALID_INPUT',
        requestId: req.requestId,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return sendApiError(res, 400, {
        message: 'Email already exists',
        code: 'AUTH_REGISTER_DUPLICATE_EMAIL',
        requestId: req.requestId,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashedPassword, name },
    });

    const token = signAppToken(user);

    res.status(201).json({
      token,
      user: serializeUser(user),
      requestId: req.requestId,
    });
  } catch (error) {
    logApiEvent('error', 'Registration failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: 'Internal server error during registration',
      code: 'AUTH_REGISTER_FAILED',
      requestId: req.requestId,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendApiError(res, 401, {
        message: 'Invalid credentials',
        code: 'AUTH_LOGIN_INVALID_CREDENTIALS',
        requestId: req.requestId,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendApiError(res, 401, {
        message: 'Invalid credentials',
        code: 'AUTH_LOGIN_INVALID_CREDENTIALS',
        requestId: req.requestId,
      });
    }

    const token = signAppToken(user);

    res.status(200).json({
      token,
      user: serializeUser(user),
      requestId: req.requestId,
    });
  } catch (error) {
    logApiEvent('error', 'Login failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: 'Internal server error during login',
      code: 'AUTH_LOGIN_FAILED',
      requestId: req.requestId,
    });
  }
});

router.post('/supabase/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return sendApiError(res, 400, {
        message: 'Supabase access token is required.',
        code: 'AUTH_GOOGLE_TOKEN_MISSING',
        requestId: req.requestId,
      });
    }

    const supabaseUser = await fetchSupabaseUser(accessToken);
    const email = supabaseUser?.email?.trim().toLowerCase();

    if (!email) {
      return sendApiError(res, 401, {
        message: 'Google sign-in did not return a valid email address.',
        code: 'AUTH_GOOGLE_EMAIL_MISSING',
        requestId: req.requestId,
      });
    }

    const resolvedName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const generatedPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: resolvedName,
        },
      });
    } else if (!user.name && resolvedName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: resolvedName },
      });
    }

    const token = signAppToken(user);

    return res.status(200).json({
      token,
      user: serializeUser(user),
      requestId: req.requestId,
    });
  } catch (error) {
    logApiEvent('error', 'Supabase Google login failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    return sendApiError(res, 500, {
      message: 'Could not complete Google sign-in.',
      code: 'AUTH_GOOGLE_FAILED',
      requestId: req.requestId,
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return sendApiError(res, 404, {
        message: 'User not found',
        code: 'AUTH_PROFILE_NOT_FOUND',
        requestId: req.requestId,
      });
    }

    res.status(200).json({ user, requestId: req.requestId });
  } catch (error) {
    logApiEvent('error', 'Profile lookup failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    return sendApiError(res, 500, {
      message: 'Failed to load profile',
      code: 'AUTH_PROFILE_FAILED',
      requestId: req.requestId,
    });
  }
});

module.exports = router;