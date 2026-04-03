const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const util = require('util');
const authMiddleware = require('../middleware/authMiddleware');

const execFileAsync = util.promisify(execFile);
const router = express.Router();

const cliExt = process.platform === 'win32' ? '.exe' : '';
const cliPath = path.join(__dirname, '..', 'bin', `arduino-cli${cliExt}`);
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

async function runArduinoCliJson(args) {
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

async function listInstalledArduinoLibraries() {
  const { data } = await runArduinoCliJson(['lib', 'list', '--format', 'json']);
  const libraries = Array.isArray(data?.installed_libraries)
    ? data.installed_libraries.map(normalizeInstalledLibrary)
    : [];

  return {
    libraries,
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
  };
}

router.get('/arduino/installed', authMiddleware, async (_req, res) => {
  try {
    const { libraries, warnings } = await listInstalledArduinoLibraries();
    res.json({ success: true, libraries, warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to load installed Arduino libraries.' });
  }
});

router.get('/arduino/search', authMiddleware, async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limitValue = Number(req.query.limit);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 24)) : 18;

  try {
    const installed = await listInstalledArduinoLibraries();

    if (!query) {
      res.json({ success: true, libraries: installed.libraries.slice(0, limit), warnings: installed.warnings });
      return;
    }

    const installedByName = new Map(
      installed.libraries.map((library) => [library.name.toLowerCase(), library])
    );
    const { data } = await runArduinoCliJson(['lib', 'search', query, '--format', 'json']);
    const libraries = Array.isArray(data?.libraries)
      ? data.libraries.map((entry) => normalizeSearchLibrary(entry, installedByName)).slice(0, limit)
      : [];

    res.json({ success: true, libraries, warnings: installed.warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to search Arduino libraries.' });
  }
});

router.post('/arduino/install', authMiddleware, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const version = typeof req.body?.version === 'string' ? req.body.version.trim() : '';

  if (!name) {
    res.status(400).json({ success: false, error: 'Library name is required.' });
    return;
  }

  const spec = version ? `${name}@${version}` : name;

  try {
    await runArduinoCliJson(['lib', 'install', '--json', spec]);
    const { libraries, warnings } = await listInstalledArduinoLibraries();
    res.json({ success: true, libraries, warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || `Failed to install ${spec}.` });
  }
});

router.post('/arduino/uninstall', authMiddleware, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    res.status(400).json({ success: false, error: 'Library name is required.' });
    return;
  }

  try {
    await runArduinoCliJson(['lib', 'uninstall', '--json', name]);
    const { libraries, warnings } = await listInstalledArduinoLibraries();
    res.json({ success: true, libraries, warnings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || `Failed to uninstall ${name}.` });
  }
});

module.exports = router;