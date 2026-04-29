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

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isDevAuthBypassEnabled() {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH_BYPASS === 'true';
}

async function ensureDevUser() {
  const email = 'stemaide-dev@example.com';
  const hashedPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  return prisma.user.upsert({
    where: { email },
    update: { name: 'Developer' },
    create: {
      email,
      password: hashedPassword,
      name: 'Developer',
    },
  });
}

router.post('/dev-login', async (req, res) => {
  if (!isDevAuthBypassEnabled()) {
    return sendApiError(res, 404, {
      message: 'Development login is not enabled.',
      code: 'AUTH_DEV_LOGIN_DISABLED',
      requestId: req.requestId,
    });
  }

  try {
    const user = await ensureDevUser();
    const token = signAppToken(user);

    return res.status(200).json({
      token,
      user: serializeUser(user),
      requestId: req.requestId,
    });
  } catch (error) {
    logApiEvent('error', 'Development login failed', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    return sendApiError(res, 500, {
      message: 'Could not start the local development session.',
      code: 'AUTH_DEV_LOGIN_FAILED',
      requestId: req.requestId,
    });
  }
});

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

function resolveSupabaseDisplayName(supabaseUser) {
  return supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name || null;
}

async function signInWithSupabasePassword(email, password) {
  const config = getSupabaseConfig();
  if (!config) {
    return { status: 'disabled' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => null);

  if (response.ok && payload?.access_token) {
    return {
      status: 'success',
      accessToken: payload.access_token,
      user: payload.user ?? null,
    };
  }

  if (response.status === 400 || response.status === 401) {
    return { status: 'invalid' };
  }

  return {
    status: 'error',
    message:
      payload?.error_description ||
      payload?.msg ||
      payload?.error ||
      'Supabase password sign-in is unavailable.',
  };
}

async function syncLocalPasswordUser({ localUser, email, password, name }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!localUser) {
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  const updateData = {
    password: hashedPassword,
  };

  if (name && name !== localUser.name) {
    updateData.name = name;
  }

  return prisma.user.update({
    where: { id: localUser.id },
    data: updateData,
  });
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

    const normalizedEmail = normalizeEmail(email);
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
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return sendApiError(res, 400, {
        message: 'Email and password are required',
        code: 'AUTH_LOGIN_INVALID_INPUT',
        requestId: req.requestId,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        const token = signAppToken(user);

        return res.status(200).json({
          token,
          user: serializeUser(user),
          requestId: req.requestId,
        });
      }
    }

    const supabaseSignIn = await signInWithSupabasePassword(email, password);

    if (supabaseSignIn.status === 'success') {
      const supabaseUser = supabaseSignIn.user ?? (await fetchSupabaseUser(supabaseSignIn.accessToken));
      const syncedUser = await syncLocalPasswordUser({
        localUser: user,
        email,
        password,
        name: resolveSupabaseDisplayName(supabaseUser),
      });
      const token = signAppToken(syncedUser);

      return res.status(200).json({
        token,
        user: serializeUser(syncedUser),
        requestId: req.requestId,
      });
    }

    if (supabaseSignIn.status === 'error') {
      logApiEvent('error', 'Supabase password login fallback failed', {
        requestId: req.requestId,
        path: req.originalUrl,
        email,
        error: { message: supabaseSignIn.message },
      });
      return sendApiError(res, 503, {
        message: 'Password sign-in is temporarily unavailable. Try again in a moment.',
        code: 'AUTH_LOGIN_PROVIDER_UNAVAILABLE',
        requestId: req.requestId,
      });
    }

    return sendApiError(res, 401, {
      message: 'Invalid credentials',
      code: 'AUTH_LOGIN_INVALID_CREDENTIALS',
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
    const email = normalizeEmail(supabaseUser?.email);

    if (!email) {
      return sendApiError(res, 401, {
        message: 'Google sign-in did not return a valid email address.',
        code: 'AUTH_GOOGLE_EMAIL_MISSING',
        requestId: req.requestId,
      });
    }

    const resolvedName = resolveSupabaseDisplayName(supabaseUser);

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
