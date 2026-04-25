#!/usr/bin/env sh
set -eu

log() {
  printf '%s\n' "[render-api] $*"
}

warn() {
  printf '%s\n' "[render-api] $*" >&2
}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)

: "${ARDUINO_RENDER_ROOT:=/var/data/arduino-cli}"
: "${ARDUINO_CLI_BIN_DIR:=$ARDUINO_RENDER_ROOT/bin}"
: "${ARDUINO_CLI_PATH:=$ARDUINO_CLI_BIN_DIR/arduino-cli}"
: "${ARDUINO_DIRECTORIES_DATA:=$ARDUINO_RENDER_ROOT/data}"
: "${ARDUINO_DIRECTORIES_DOWNLOADS:=$ARDUINO_RENDER_ROOT/staging}"
: "${ARDUINO_DIRECTORIES_USER:=$ARDUINO_RENDER_ROOT/user}"
: "${ARDUINO_CORE_PACKAGE:=arduino:avr}"
: "${ARDUINO_BOOTSTRAP_MARKER:=$ARDUINO_RENDER_ROOT/.bootstrap-complete}"
: "${ARDUINO_UPDATER_ENABLE_NOTIFICATION:=false}"

export ARDUINO_CLI_PATH
export ARDUINO_DIRECTORIES_DATA
export ARDUINO_DIRECTORIES_DOWNLOADS
export ARDUINO_DIRECTORIES_USER
export ARDUINO_CORE_PACKAGE
export ARDUINO_UPDATER_ENABLE_NOTIFICATION

bootstrap_arduino_cli() {
  mkdir -p \
    "$ARDUINO_CLI_BIN_DIR" \
    "$ARDUINO_DIRECTORIES_DATA" \
    "$ARDUINO_DIRECTORIES_DOWNLOADS" \
    "$ARDUINO_DIRECTORIES_USER"

  if [ ! -x "$ARDUINO_CLI_PATH" ]; then
    install_script=$(mktemp)
    log "Installing Linux arduino-cli into $ARDUINO_CLI_BIN_DIR"

    if ! curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh -o "$install_script"; then
      warn "Could not download the Arduino CLI install script. Compile routes will stay degraded."
      rm -f "$install_script"
      return 0
    fi

    if [ -n "${ARDUINO_CLI_VERSION:-}" ]; then
      if ! BINDIR="$ARDUINO_CLI_BIN_DIR" sh "$install_script" "$ARDUINO_CLI_VERSION"; then
        warn "Failed to install Arduino CLI version $ARDUINO_CLI_VERSION. Compile routes will stay degraded."
        rm -f "$install_script"
        return 0
      fi
    elif ! BINDIR="$ARDUINO_CLI_BIN_DIR" sh "$install_script"; then
      warn "Failed to install the latest Arduino CLI. Compile routes will stay degraded."
      rm -f "$install_script"
      return 0
    fi

    rm -f "$install_script"
  fi

  if [ ! -x "$ARDUINO_CLI_PATH" ]; then
    warn "Arduino CLI is still missing at $ARDUINO_CLI_PATH after bootstrap. Compile routes will stay degraded."
    return 0
  fi

  if ! "$ARDUINO_CLI_PATH" version >/dev/null 2>&1; then
    warn "Arduino CLI exists but could not be executed. Compile routes will stay degraded."
    return 0
  fi

  if [ -f "$ARDUINO_BOOTSTRAP_MARKER" ]; then
    log "Arduino CLI runtime assets already initialized."
    return 0
  fi

  log "Initializing Arduino CLI indexes and installing $ARDUINO_CORE_PACKAGE"
  if ! "$ARDUINO_CLI_PATH" update; then
    warn "Failed to update Arduino indexes. Compile routes will stay degraded until a later restart succeeds."
    return 0
  fi

  if ! "$ARDUINO_CLI_PATH" core install "$ARDUINO_CORE_PACKAGE" --run-post-install; then
    warn "Failed to install Arduino core $ARDUINO_CORE_PACKAGE. Compile routes will stay degraded until a later restart succeeds."
    return 0
  fi

  touch "$ARDUINO_BOOTSTRAP_MARKER"
  log "Arduino CLI runtime assets are ready."
}

bootstrap_arduino_cli

cd "$REPO_ROOT"
npm --workspace packages/database run db:push
exec node apps/api/index.js
