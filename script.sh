#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/.venv"

cd "$ROOT_DIR"

if ! command -v python >/dev/null 2>&1; then
  echo "Python was not found. Install Python 3.11 or newer and run this script again."
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm were not found. Install Node.js 18 or newer and run this script again."
  exit 1
fi

if [[ ! -f "$VENV_DIR/Scripts/python.exe" && ! -f "$VENV_DIR/bin/python" ]]; then
  echo "Creating Python virtual environment..."
  python -m venv "$VENV_DIR"
fi

if [[ -f "$VENV_DIR/Scripts/python.exe" ]]; then
  PYTHON="$VENV_DIR/Scripts/python.exe"
else
  PYTHON="$VENV_DIR/bin/python"
fi

echo "Installing Python dependencies..."
"$PYTHON" -m pip install -q -r requirements.txt -r requirements-api.txt

echo "Installing frontend dependencies..."
npm --prefix frontend install --silent

echo "Starting API at http://localhost:8000"
"$PYTHON" -m uvicorn api.main:app --reload --port 8000 &
API_PID=$!

echo "Starting frontend at http://localhost:3000"
npm --prefix frontend run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

cleanup() {
  echo
  echo "Stopping application..."
  kill "$API_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Application is ready. Open http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

wait "$API_PID" "$FRONTEND_PID"