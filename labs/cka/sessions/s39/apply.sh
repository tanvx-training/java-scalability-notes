# s39 — lời giải chuẩn: CRD shopfeatures.shop.example.com (namespaced, v1, schema) và hai ShopFeature trong ~/shop/;
# thử một resource sai schema (bị từ chối, lỗi ghi ~/drills/s39/rejected.txt); cert-manager v1.21.3 bằng Helm
# (crds.enabled=true, controller/webhook/cainjector trên cka-cp, values ở ~/drills/s39/cert-manager-values.yaml); Issuer
# selfsigned + Certificate shop-local (Secret shop-local-cm-tls) trong ~/shop/shop-local-cert.yaml; ghi CERT_MANAGER_CRDS.
# Chạy lại nhiều lần được (files/solve.sh). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "rm -rf /tmp/s39 && mkdir -p /tmp/s39"
for f in shopfeature-crd.yaml shopfeatures.yaml shop-local-cert.yaml cert-manager-values.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/s39/$f"
done
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
