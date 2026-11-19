# s38 — lời giải chuẩn: cây files/kustomize chép vào ~/kustomize/shop (base: catalog H2 + Service + configMapGenerator;
# overlays/dev: namespace shop-dev, 1 replica, tag 1.0, patch limit 208Mi, literal LOGGING_LEVEL_SHOP=DEBUG; overlays/prod:
# shop-prod, 2 replica, tag 2.0, chỉ build); tạo namespace shop-dev; lần đầu apply -k bản dev chưa có literal rồi thêm literal
# và apply lại (rollout theo hậu tố hash); ghi HASHED_CM_NAME; dựng tình huống hỏng (patch sai tên) trong ~/drills/s38/broken.
# Chạy lại nhiều lần được (files/solve.sh). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
t="$(mktemp -t s38-kustomize)"
( cd "$SESSION_DIR/files" && COPYFILE_DISABLE=1 tar --no-mac-metadata -czf "$t" kustomize 2>/dev/null || COPYFILE_DISABLE=1 tar -czf "$t" kustomize )
vm_put "$t" "$cp" /tmp/s38-kustomize.tgz
rm -f "$t"
vm_put "$SESSION_DIR/files/dev-kustomization-v1.yaml" "$cp" /tmp/s38-dev-v1.yaml
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
