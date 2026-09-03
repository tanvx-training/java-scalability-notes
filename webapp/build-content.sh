#!/usr/bin/env bash
# Nguồn duy nhất của logic copy nội dung markdown vào thư mục content/.
# Gọi bởi: webapp/dev.sh, Dockerfile, .github/workflows/deploy-pages.yml
#
#   ./webapp/build-content.sh webapp/content    (local dev)
#   ./webapp/build-content.sh _site/content     (GitHub Pages)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?usage: build-content.sh <dest-dir>}"
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"

mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior" \
         "$DEST/modconc/images"

cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
cp "$REPO"/k8s-ebook/*.md                               "$DEST/k8sbook/"
cp -R "$REPO"/k8s-ebook/images/.                        "$DEST/k8sbook/images/"
cp "$REPO"/spring-security-vi/*.md                      "$DEST/springsec/"
cp "$REPO"/senior-java-roadmap/*.md                     "$DEST/senior/"
cp "$REPO"/modern-concurrency-vi/*.md                   "$DEST/modconc/"
cp -R "$REPO"/modern-concurrency-vi/images/.            "$DEST/modconc/images/"
