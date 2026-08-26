#!/usr/bin/env bash
# Chạy KubePrep ở local:
#   ./webapp/dev.sh          (mặc định cổng 8888)
#   ./webapp/dev.sh 3000
# Script copy các file markdown từ CKAD/ vào webapp/content/ (giống lúc deploy)
# rồi mở HTTP server tĩnh bằng python3.

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$DIR")"
PORT="${1:-${PORT:-8888}}"

"$DIR/build-content.sh" "$DIR/content"

echo "▶ KubePrep: http://localhost:$PORT"
cd "$DIR"
exec python3 -m http.server "$PORT"
