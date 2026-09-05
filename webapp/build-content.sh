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
         "$DEST/modconc/images" "$DEST/ddia/images" "$DEST/mjia/images" \
         "$DEST/kafka/images" "$DEST/springstart/images" "$DEST/ckabook/images"

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
cp    "$REPO"/ddia-vi/*.md                              "$DEST/ddia/"
cp -R "$REPO"/ddia-vi/images/.                          "$DEST/ddia/images/"
cp    "$REPO"/modern-java-vi/*.md                        "$DEST/mjia/"
cp -R "$REPO"/modern-java-vi/images/.                    "$DEST/mjia/images/"
cp    "$REPO"/kafka-vi/*.md                              "$DEST/kafka/"
cp -R "$REPO"/kafka-vi/images/.                          "$DEST/kafka/images/"
cp    "$REPO"/spring-start-vi/*.md                       "$DEST/springstart/"
cp -R "$REPO"/spring-start-vi/images/.                   "$DEST/springstart/images/"
cp    "$REPO"/cka-book-vi/*.md                           "$DEST/ckabook/"
cp -R "$REPO"/cka-book-vi/images/.                       "$DEST/ckabook/images/"
