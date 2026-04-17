const { loadLocalEnv } = require('./lib/loadLocalEnv');
const express = require('express');
const cors = require('cors');
const {
  attachRequestContext,
  buildCorsOptions,
  getRuntimeCapabilities,
  logApiEvent,
  sendApiError,
  serializeError,
} = require('./lib/telemetry');

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(attachRequestContext);
app.use(cors(buildCorsOptions()));
app.use(express.json());

const projectsRouter = require('./routes/projects');
const compileRouter = require('./routes/compile');
const authRouter = require('./routes/auth');
const librariesRouter = require('./routes/libraries');

app.use('/api/projects', projectsRouter);
app.use('/api/compile', compileRouter);
app.use('/api/auth', authRouter);
app.use('/api/libraries', librariesRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    requestId: req.requestId,
    capabilities: getRuntimeCapabilities(),
  });
});

app.use((error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  logApiEvent('error', 'Unhandled API middleware error', {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    error: serializeError(error),
  });

  if (String(error.message || '').includes('allowed by CORS')) {
    sendApiError(res, 403, {
      message: 'This origin is not allowed to access the API.',
      code: 'CORS_ORIGIN_DENIED',
      requestId: req.requestId,
      details: { origin: req.headers.origin || null },
    });
    return;
  }

  sendApiError(res, 500, {
    message: 'Internal server error.',
    code: 'UNHANDLED_API_ERROR',
    requestId: req.requestId,
  });
});

app.listen(PORT, HOST, () => {
  logApiEvent('log', 'EdTech API running', {
    host: HOST,
    port: PORT,
    capabilities: getRuntimeCapabilities(),
  });
});
