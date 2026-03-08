#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  if [[ -n "${WEB_PID:-}" ]]; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${MOBILE_PID:-}" ]]; then
    kill "$MOBILE_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting web dev server..."
pnpm dev &
WEB_PID=$!

echo "Starting mobile dev server..."
pnpm mobile:dev &
MOBILE_PID=$!

EXIT_CODE=0
while true; do
  if ! kill -0 "$WEB_PID" >/dev/null 2>&1; then
    wait "$WEB_PID" || EXIT_CODE=$?
    break
  fi

  if ! kill -0 "$MOBILE_PID" >/dev/null 2>&1; then
    wait "$MOBILE_PID" || EXIT_CODE=$?
    break
  fi

  sleep 1
done

echo "One dev process exited. Stopping the other..."
cleanup

exit "$EXIT_CODE"
