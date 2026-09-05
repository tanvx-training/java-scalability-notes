#!/usr/bin/env bash
# Nguồn duy nhất của logic dựng webapp/content/: sao chép NGUYÊN CÂY sources/
# (trừ *.pdf) vào <dest>. webapp/content/ vì thế luôn là ảnh gương của sources/,
# và mọi docs[].file trong js/data/<lĩnh vực>/docs.js đều có dạng
# content/<lĩnh vực>/… (bất biến #2c trong check-data.mjs).
#
# Gọi bởi: webapp/scripts/dev.sh, Dockerfile, .github/workflows/deploy-pages.yml
#
#   webapp/scripts/build-content.sh webapp/content    (local dev)
#   webapp/scripts/build-content.sh _site/content     (GitHub Pages)
#
# Thêm một nguồn học mới = thêm thư mục dưới sources/ — KHÔNG cần sửa tệp này.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$REPO/sources"
DEST="${1:?usage: build-content.sh <dest-dir>}"

[ -d "$SRC" ] || { echo "✗ không thấy thư mục nguồn $SRC" >&2; exit 1; }
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"

# Đích luôn tên "content": xoá bản cũ để không sót thư mục đã đổi tên.
if [ "$(basename "$DEST")" = "content" ]; then
  find "$DEST" -mindepth 1 -delete
fi

# tar có sẵn ở macOS, debian:*-slim và GitHub runner; --exclude không neo nên
# '*.pdf' khớp ở mọi độ sâu.
tar -C "$SRC" --exclude='*.pdf' --exclude='.DS_Store' -cf - . | tar -C "$DEST" -xf -
find "$DEST" -type d -name pdf -empty -delete

echo "✓ content: $(find "$DEST" -name '*.md' | wc -l | tr -d ' ') markdown, $(find "$DEST" -type f ! -name '*.md' | wc -l | tr -d ' ') ảnh → $DEST"
