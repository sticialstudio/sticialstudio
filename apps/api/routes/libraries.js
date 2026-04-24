const express = require('express');
const { execFile } = require('child_process');
const util = require('util');
const authMiddleware = require('../middleware/authMiddleware');
const { getArduinoCliConfig } = require('../lib/arduinoCli');
const { logApiEvent, sendApiError, serializeError } = require('../lib/telemetry');

const execFileAsync = util.promisify(execFile);
const router = express.Router();
const MAX_BUFFER_BYTES = 12 * 1024 * 1024;

function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeInstalledLibrary(entry) {
  const library = entry?.library ?? {};
  const release = entry?.release ?? {};

  return {
    name: library.name || 'Unknown library',
    author: library.author || library.maintainer || 'Unknown author',
    version: library.version || release.version || 'Unknown',
    latestVersion: release.version || library.version || null,
    description: cleanText(library.sentence || library.paragraph),
    category: library.category || 'Uncategorized',
    website: library.website || null,
    includes: Array.isArray(library.provides_includes) ? library.provides_includes : [],
    availableVersions: [],
    installed: true,
    installedVersion: library.version || null,
    location: library.location || 'user',
    installDir: library.install_dir || null,
  };
}

function normalizeSearchLibrary(entry, installedByName) {
  const latest = entry?.latest ?? {};
  const installedMatch = installedByName.get(String(entry?.name || '').toLowerCase()) || null;

  return {
    name: entry?.name || 'Unknown library',
    author: latest.author || latest.maintainer || 'Unknown author',
    version: latest.version || 'Unknown',
    latestVersion: latest.version || null,
    description: cleanText(latest.sentence || latest.paragraph),
    category: latest.category || 'Uncategorized',
    website: latest.website || null,
    includes: Array.isArray(latest.provides_includes) ? latest.provides_includes : [],
    availableVersions: Array.isArray(entry?.available_versions) ? entry.available_versions : [],
    installed: Boolean(installedMatch),
    installedVersion: installedMatch?.version || null,
    location: installedMatch?.location || null,
    installDir: installedMatch?.installDir || null,
  };
}

function ensureArduinoCli(req, res, next) {
  const cli = getArduinoCliConfig();
  if (!cli.available || !cli.path) {
    sendApiError(res, 503, {
      message:
        cli.reason ||
        'Arduino library management is not available on this server. Configure ARDUINO_CLI_PATH to enable it.',
      code: 'LIBRARIES_ARDUINO_UNAVAILABLE',
      degraded: true,
      capability: 'arduino-cli',
      requestId: req.requestId,
      details: { source: cli.source || null },
    });
    return;
  }

  req.arduinoCliPath = cli.path;
  next();
}

async function runArduinoCliJson(cliPath, args) {
  try {
    const { stdout, stderr } = await execFileAsync(cliPath, args, { maxBuffer: MAX_BUFFER_BYTES });
    const parsed = stdout && stdout.trim().length > 0 ? JSON.parse(stdout) : {};
    return { data: parsed, stderr };
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    const combined = stdout || stderr || error.message || 'Arduino CLI command failed.';

    try {
      const parsed = JSON.parse(combined);
      throw new Error(parsed.error || combined);
    } catch {
      throw new Error(combined.trim() || 'Arduino CLI command failed.');
    }
  }
}

async function listInstalledArduinoLibraries(cliPath) {
  const { data } = await runArduinoCliJson(cliPath, ['lib', 'list', '--format', 'json']);
  const libraries = Array.isArray(data?.installed_libraries)
    ? data.installed_libraries.map(normalizeInstalledLibrary)
    : [];

  return {
    libraries,
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
}

router.use(authMiddleware);
router.use(ensureArduinoCli);

router.get('/arduino/installed', async (req, res) => {
  try {
    const { libraries, warnings } = await listInstalledArduinoLibraries(req.arduinoCliPath);
    res.json({ success: true, libraries, warnings, requestId: req.requestId, capability: 'arduino-cli' });
  } catch (error) {
    logApiEvent('error', 'Failed to load installed Arduino libraries', {
      requestId: req.requestId,
      path: req.originalUrl,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: error.message || 'Failed to load installed Arduino libraries.',
      code: 'LIBRARIES_ARDUINO_LIST_FAILED',
      requestId: req.requestId,
      capability: 'arduino-cli',
    });
  }
});

router.get('/arduino/search', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limitValue = Number(req.query.limit);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 24)) : 18;

  try {
    const installed = await listInstalledArduinoLibraries(req.arduinoCliPath);

    if (!query) {
      res.json({
        success: true,
        libraries: installed.libraries.slice(0, limit),
        warnings: installed.warnings,
        requestId: req.requestId,
        capability: 'arduino-cli',
      });
      return;
    }

    const installedByName = new Map(installed.libraries.map((library) => [library.name.toLowerCase(), library]));
    const { data } = await runArduinoCliJson(req.arduinoCliPath, ['lib', 'search', query, '--format', 'json']);
    const libraries = Array.isArray(data?.libraries)
      ? data.libraries.map((entry) => normalizeSearchLibrary(entry, installedByName)).slice(0, limit)
      : [];

    res.json({ success: true, libraries, warnings: installed.warnings, requestId: req.requestId, capability: 'arduino-cli' });
  } catch (error) {
    logApiEvent('error', 'Failed to search Arduino libraries', {
      requestId: req.requestId,
      path: req.originalUrl,
      query,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: error.message || 'Failed to search Arduino libraries.',
      code: 'LIBRARIES_ARDUINO_SEARCH_FAILED',
      requestId: req.requestId,
      capability: 'arduino-cli',
    });
  }
});

router.post('/arduino/install', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const version = typeof req.body?.version === 'string' ? req.body.version.trim() : '';

  if (!name) {
    sendApiError(res, 400, {
      message: 'Library name is required.',
      code: 'LIBRARIES_ARDUINO_INSTALL_NAME_MISSING',
      requestId: req.requestId,
      capability: 'arduino-cli',
    });
    return;
  }

  const spec = version ? `${name}@${version}` : name;

  try {
    await runArduinoCliJson(req.arduinoCliPath, ['lib', 'install', '--json', spec]);
    const { libraries, warnings } = await listInstalledArduinoLibraries(req.arduinoCliPath);
    res.json({ success: true, libraries, warnings, requestId: req.requestId, capability: 'arduino-cli' });
  } catch (error) {
    logApiEvent('error', 'Failed to install Arduino library', {
      requestId: req.requestId,
      path: req.originalUrl,
      spec,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: error.message || `Failed to install ${spec}.`,
      code: 'LIBRARIES_ARDUINO_INSTALL_FAILED',
      requestId: req.requestId,
      capability: 'arduino-cli',
      details: { spec },
    });
  }
});

router.post('/arduino/uninstall', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    sendApiError(res, 400, {
      message: 'Library name is required.',
      code: 'LIBRARIES_ARDUINO_UNINSTALL_NAME_MISSING',
      requestId: req.requestId,
      capability: 'arduino-cli',
    });
    return;
  }

  try {
    await runArduinoCliJson(req.arduinoCliPath, ['lib', 'uninstall', '--json', name]);
    const { libraries, warnings } = await listInstalledArduinoLibraries(req.arduinoCliPath);
    res.json({ success: true, libraries, warnings, requestId: req.requestId, capability: 'arduino-cli' });
  } catch (error) {
    logApiEvent('error', 'Failed to uninstall Arduino library', {
      requestId: req.requestId,
      path: req.originalUrl,
      name,
      error: serializeError(error),
    });
    sendApiError(res, 500, {
      message: error.message || `Failed to uninstall ${name}.`,
      code: 'LIBRARIES_ARDUINO_UNINSTALL_FAILED',
      requestId: req.requestId,
      capability: 'arduino-cli',
      details: { name },
    });
  }
});

module.exports = router;