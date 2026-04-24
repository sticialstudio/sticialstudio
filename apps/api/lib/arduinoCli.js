const fs = require('fs');
const path = require('path');

function resolveConfiguredCliPath() {
  const configuredPath = process.env.ARDUINO_CLI_PATH?.trim();
  if (!configuredPath) {
    return null;
  }

  const absolutePath = path.resolve(configuredPath);
  if (!fs.existsSync(absolutePath)) {
    return {
      available: false,
      path: absolutePath,
      reason: `ARDUINO_CLI_PATH points to a missing file: ${absolutePath}`,
    };
  }

  return {
    available: true,
    path: absolutePath,
    source: 'configured',
  };
}

function resolveBundledCliPath() {
  if (process.platform !== 'win32') {
    return {
      available: false,
      path: null,
      reason:
        'Arduino compile and library management are disabled in this deployment. Configure ARDUINO_CLI_PATH to a Linux arduino-cli binary if you want to enable these routes on Render.',
    };
  }

  const bundledPath = path.join(__dirname, '..', 'bin', 'arduino-cli.exe');
  if (!fs.existsSync(bundledPath)) {
    return {
      available: false,
      path: bundledPath,
      reason: `Bundled arduino-cli was not found at ${bundledPath}.`,
    };
  }

  return {
    available: true,
    path: bundledPath,
    source: 'bundled',
  };
}

function getArduinoCliConfig() {
  const configured = resolveConfiguredCliPath();
  if (configured) {
    return configured;
  }

  return resolveBundledCliPath();
}

function getArduinoCliPathOrThrow() {
  const config = getArduinoCliConfig();
  if (!config.available || !config.path) {
    throw new Error(config.reason || 'Arduino CLI is not available on this server.');
  }

  return config.path;
}

module.exports = {
  getArduinoCliConfig,
  getArduinoCliPathOrThrow,
};