const fs = require('fs');
const path = require('path');

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) return null;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnvFile(filePath, allowedKeys) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const entry = parseEnvLine(line);
    if (!entry) continue;
    if (allowedKeys && !allowedKeys.includes(entry.key)) continue;
    if (process.env[entry.key]) continue;
    process.env[entry.key] = entry.value;
  }
}

function normalizeDatabaseUrl(apiRoot) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    return;
  }

  const sqlitePath = databaseUrl.slice('file:'.length);
  if (!sqlitePath) {
    return;
  }

  const isWindowsAbsolute = /^[a-zA-Z]:[\\/]/.test(sqlitePath);
  if (path.isAbsolute(sqlitePath) || isWindowsAbsolute) {
    process.env.DATABASE_URL = `file:${sqlitePath.replace(/\\/g, '/')}`;
    return;
  }

  const absolutePath = path.resolve(apiRoot, sqlitePath);
  process.env.DATABASE_URL = `file:${absolutePath.replace(/\\/g, '/')}`;
}

function loadLocalEnv() {
  const apiRoot = path.resolve(__dirname, '..');
  const webRoot = path.resolve(apiRoot, '..', 'web');
  const sharedSupabaseKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  loadEnvFile(path.join(apiRoot, '.env'));
  loadEnvFile(path.join(apiRoot, '.env.local'));

  if (sharedSupabaseKeys.some((key) => !process.env[key])) {
    loadEnvFile(path.join(webRoot, '.env.local'), sharedSupabaseKeys);
    loadEnvFile(path.join(webRoot, '.env'), sharedSupabaseKeys);
  }

  normalizeDatabaseUrl(apiRoot);
}

module.exports = {
  loadLocalEnv,
};