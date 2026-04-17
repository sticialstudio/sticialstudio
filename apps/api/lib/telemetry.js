const crypto = require('crypto');
const { getArduinoCliConfig } = require('./arduinoCli');

function buildAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const derivedOrigins = [
    process.env.WEB_ORIGIN,
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    derivedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  return new Set([...configuredOrigins, ...derivedOrigins]);
}

function buildCorsOptions() {
  const allowedOrigins = buildAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  };
}

function attachRequestContext(req, res, next) {
  const headerRequestId = req.headers['x-request-id'];
  const requestId =
    typeof headerRequestId === 'string' && headerRequestId.trim().length > 0
      ? headerRequestId.trim()
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  try {
    return {
      message: JSON.stringify(error),
    };
  } catch {
    return {
      message: String(error),
    };
  }
}

function logApiEvent(level, message, context = {}) {
  const logger = typeof console[level] === 'function' ? console[level] : console.log;
  logger(`[api] ${message}`, context);
}

function sendApiError(res, status, options) {
  const {
    message,
    code = 'API_ERROR',
    degraded = false,
    capability = null,
    details = null,
    requestId = null,
  } = options;

  return res.status(status).json({
    success: false,
    error: message,
    code,
    degraded,
    capability,
    details,
    requestId,
  });
}

function getRuntimeCapabilities() {
  const arduinoCli = getArduinoCliConfig();

  return {
    arduinoCli: {
      available: Boolean(arduinoCli.available && arduinoCli.path),
      source: arduinoCli.source || null,
      reason: arduinoCli.reason || null,
    },
    googleOAuth: {
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    persistence: {
      provider: 'sqlite',
      requiresPersistentDisk: true,
      databaseUrl: process.env.DATABASE_URL || 'file:../../packages/database/prisma/dev.db',
    },
    deployment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.platform,
    },
  };
}

module.exports = {
  attachRequestContext,
  buildCorsOptions,
  getRuntimeCapabilities,
  logApiEvent,
  sendApiError,
  serializeError,
};
