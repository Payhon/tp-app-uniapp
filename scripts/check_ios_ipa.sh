#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash fjbms-uniapp/scripts/check_ios_ipa.sh <ipa-path>" >&2
  exit 2
fi

IPA_PATH="$1"
if [[ ! -f "$IPA_PATH" ]]; then
  echo "IPA not found: $IPA_PATH" >&2
  exit 2
fi

TMPDIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

unzip -q "$IPA_PATH" -d "$TMPDIR"

APP_DIR="$(find "$TMPDIR/Payload" -maxdepth 1 -type d -name '*.app' | head -1)"
if [[ -z "${APP_DIR:-}" ]]; then
  echo "No .app bundle found in IPA" >&2
  exit 1
fi

PLIST="$APP_DIR/Info.plist"
if [[ ! -f "$PLIST" ]]; then
  echo "Info.plist not found: $PLIST" >&2
  exit 1
fi

read_plist_key() {
  local key="$1"
  /usr/libexec/PlistBuddy -c "Print :$key" "$PLIST" 2>/dev/null || true
}

failures=0

require_non_empty_key() {
  local key="$1"
  local value
  value="$(read_plist_key "$key")"
  if [[ -z "$value" ]]; then
    echo "[FAIL] missing or empty $key"
    failures=$((failures + 1))
  else
    echo "[OK]   $key: $value"
  fi
}

require_descriptive_key() {
  local key="$1"
  shift
  local value
  value="$(read_plist_key "$key")"
  if [[ -z "$value" ]]; then
    echo "[FAIL] missing or empty $key"
    failures=$((failures + 1))
    return
  fi
  for generic in "$@"; do
    if [[ "$value" == "$generic" ]]; then
      echo "[FAIL] $key is too generic: $value"
      failures=$((failures + 1))
      return
    fi
  done
  echo "[OK]   $key: $value"
}

reject_present_key() {
  local key="$1"
  local value
  value="$(read_plist_key "$key")"
  if [[ -n "$value" ]]; then
    echo "[FAIL] unexpected $key: $value"
    failures=$((failures + 1))
  else
    echo "[OK]   $key is absent"
  fi
}

echo "IPA: $IPA_PATH"
echo "App bundle: $APP_DIR"

require_non_empty_key "CFBundleIdentifier"
require_non_empty_key "CFBundleShortVersionString"
require_non_empty_key "CFBundleVersion"
require_descriptive_key "NSCameraUsageDescription" "使用相机" "App would like to access your camera"
require_descriptive_key "NSBluetoothAlwaysUsageDescription" "使用蓝牙" "App would like to use Bluetooth"
require_descriptive_key "NSBluetoothPeripheralUsageDescription" "使用蓝牙" "App would like to use Bluetooth"
reject_present_key "NSUserTrackingUsageDescription"

if [[ -f "$APP_DIR/Assets.car" ]]; then
  echo "[OK]   Assets.car exists"
else
  icons_dump="$(plutil -p "$PLIST" 2>/dev/null | rg "CFBundleIcons|CFBundleIconFiles|CFBundlePrimaryIcon|CFBundleIcons~ipad|CFBundleIconName" || true)"
  if [[ -n "$icons_dump" ]]; then
    echo "[OK]   icon metadata found in Info.plist"
    echo "$icons_dump"
  else
    echo "[FAIL] missing Assets.car and icon metadata"
    failures=$((failures + 1))
  fi
fi

if [[ $failures -ne 0 ]]; then
  echo "IPA verification failed with $failures issue(s)." >&2
  exit 1
fi

echo "IPA verification passed."
