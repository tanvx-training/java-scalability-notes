#!/usr/bin/env bash
# Chạy DevPrep ở local:
#   ./webapp/scripts/dev.sh          (mặc định cổng 8888)
#   ./webapp/scripts/dev.sh 3000
# Script dựng webapp/content/ từ sources/ (giống lúc deploy) rồi mở HTTP server
# tĩnh bằng python3.

set -euo pipefail

WEBAPP="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-${PORT:-8888}}"

"$WEBAPP/scripts/build-content.sh" "$WEBAPP/content"

echo "▶ DevPrep: http://localhost:$PORT"
cd "$WEBAPP"
exec python3 -m http.server "$PORT"
