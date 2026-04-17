const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const { getArduinoCliConfig } = require('../lib/arduinoCli');
const { logApiEvent, sendApiError, serializeError } = require('../lib/telemetry');

const router = express.Router();

const ARDUINO_FQBN_MAP = {
  'Arduino Uno': 'arduino:avr:uno',
  'Arduino Nano': 'arduino:avr:nano',
  'Arduino Mega': 'arduino:avr:mega',
  'Arduino Leonardo': 'arduino:avr:leonardo',
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteCompileLogPaths(log, sketchDir, compilePlan) {
  if (typeof log !== 'string' || !log) {
    return log;
  }

  const displayPath = compilePlan.entryFilePath || 'main.cpp';
  const absoluteSketchPath = path.join(sketchDir, compilePlan.primarySketchPath);
  const candidates = [
    absoluteSketchPath,
    absoluteSketchPath.replace(/\\/g, '/'),
    compilePlan.primarySketchPath,
  ].filter(Boolean);

  return candidates.reduce((current, candidate) => (
    candidate ? current.replace(new RegExp(escapeRegExp(candidate), 'g'), displayPath) : current
  ), log);
}

function sanitizeRelativePath(rawPath) {
  if (typeof rawPath !== 'string') {
    return null;
  }

  const normalized = rawPath.replace(/\\/g, '/').trim();
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
    return null;
  }

  const segments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  const safePath = segments.join('/');
  return safePath.startsWith('src/') ? safePath.slice(4) : safePath;
}

function normalizeIncomingCompileFile(rawFile) {
  const safePath = sanitizeRelativePath(rawFile?.path);
  if (!safePath) {
    return null;
  }

  return {
    path: safePath,
    content: typeof rawFile?.content === 'string' ? rawFile.content : '',
  };
}

async function writeCompileProjectFiles({ sketchDir, sessionId, files, entryFilePath, fallbackSourceCode }) {
  const compileFiles = Array.isArray(files)
    ? files.map(normalizeIncomingCompileFile).filter(Boolean)
    : [];
  const normalizedEntryPath = sanitizeRelativePath(entryFilePath);

  const entryFile = normalizedEntryPath
    ? compileFiles.find((file) => file.path === normalizedEntryPath) || null
    : compileFiles.find((file) => /(^|\/)(main\.(cpp|ino)|sketch\.(cpp|ino))$/i.test(file.path)) || compileFiles[0] || null;

  const primarySketchContent = entryFile?.content ?? fallbackSourceCode;
  if (typeof primarySketchContent !== 'string' || primarySketchContent.trim().length === 0) {
    throw new Error('No Arduino source code provided.');
  }

  const primarySketchPath = `${sessionId}.ino`;
  await fs.writeFile(path.join(sketchDir, primarySketchPath), primarySketchContent, 'utf8');

  let compiledFiles = 1;
  for (const file of compileFiles) {
    if (entryFile && file.path === entryFile.path) {
      continue;
    }

    const destination = path.join(sketchDir, ...file.path.split('/'));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, file.content, 'utf8');
    compiledFiles += 1;
  }

  return {
    compiledFiles,
    entryFilePath: entryFile?.path ?? null,
    primarySketchPath,
  };
}

router.post('/arduino', async (req, res) => {
  const { sourceCode, board, files, entryFilePath } = req.body;
  const requestedBoard = typeof board === 'string' && board.trim() ? board.trim() : 'Arduino Uno';
  const fqbn = ARDUINO_FQBN_MAP[requestedBoard];

  const hasSourceCode = typeof sourceCode === 'string' && sourceCode.trim().length > 0;
  const hasProjectFiles = Array.isArray(files) && files.length > 0;
  if (!hasSourceCode && !hasProjectFiles) {
    return sendApiError(res, 400, {
      message: 'No source code provided.',
      code: 'COMPILE_SOURCE_MISSING',
      requestId: req.requestId,
    });
  }

  if (!fqbn) {
    return sendApiError(res, 400, {
      message: `Board "${requestedBoard}" is not supported by the Arduino compiler route.`,
      code: 'COMPILE_BOARD_UNSUPPORTED',
      requestId: req.requestId,
      details: { board: requestedBoard },
    });
  }

  const cli = getArduinoCliConfig();
  if (!cli.available || !cli.path) {
    return sendApiError(res, 503, {
      message: cli.reason || 'Arduino compilation is not available on this server.',
      code: 'COMPILE_ARDUINO_UNAVAILABLE',
      degraded: true,
      capability: 'arduino-cli',
      requestId: req.requestId,
      details: { board: requestedBoard, fqbn, source: cli.source || null },
    });
  }

  const sessionId = `sketch_${crypto.randomBytes(16).toString('hex')}`;
  const sketchDir = path.join(os.tmpdir(), sessionId);
  const buildPath = path.join(sketchDir, 'build');

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    const compilePlan = await writeCompileProjectFiles({
      sketchDir,
      sessionId,
      files,
      entryFilePath,
      fallbackSourceCode: typeof sourceCode === 'string' ? sourceCode : '',
    });

    execFile(cli.path, ['compile', '--fqbn', fqbn, '--build-path', buildPath, sketchDir], async (error, stdout, stderr) => {
      const normalizedStdout = rewriteCompileLogPaths(stdout, sketchDir, compilePlan);
      const normalizedStderr = rewriteCompileLogPaths(stderr, sketchDir, compilePlan);
      let hex = null;

      if (!error) {
        try {
          hex = await fs.readFile(path.join(buildPath, `${sessionId}.ino.hex`), 'utf8');
        } catch (hexError) {
          logApiEvent('warn', 'Hex extraction failed after successful compile', {
            requestId: req.requestId,
            board: requestedBoard,
            error: serializeError(hexError),
          });
        }
      }

      try {
        await fs.rm(sketchDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logApiEvent('warn', 'Failed to cleanup compile temp directory', {
          requestId: req.requestId,
          sketchDir,
          error: serializeError(cleanupError),
        });
      }

      if (error) {
        logApiEvent('warn', 'Arduino compile failed', {
          requestId: req.requestId,
          board: requestedBoard,
          fqbn,
          error: serializeError(error),
          stderr: normalizedStderr,
          stdout: normalizedStdout,
          entryFilePath: compilePlan.entryFilePath,
          compiledFiles: compilePlan.compiledFiles,
        });

        return res.status(200).json({
          success: false,
          board: requestedBoard,
          fqbn,
          log: normalizedStderr || normalizedStdout || error.message,
          requestId: req.requestId,
          degraded: false,
          capability: 'arduino-cli',
          compiledFiles: compilePlan.compiledFiles,
        });
      }

      return res.status(200).json({
        success: true,
        board: requestedBoard,
        fqbn,
        log: normalizedStdout,
        hex,
        requestId: req.requestId,
        degraded: false,
        capability: 'arduino-cli',
        compiledFiles: compilePlan.compiledFiles,
      });
    });
  } catch (error) {
    logApiEvent('error', 'Arduino compile route crashed', {
      requestId: req.requestId,
      board: requestedBoard,
      fqbn,
      error: serializeError(error),
    });

    try {
      await fs.rm(sketchDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors after a crash
    }

    return sendApiError(res, 500, {
      message: `Backend execution error: ${error.message}`,
      code: 'COMPILE_ARDUINO_CRASH',
      requestId: req.requestId,
      details: { board: requestedBoard, fqbn },
    });
  }
});

module.exports = router;
