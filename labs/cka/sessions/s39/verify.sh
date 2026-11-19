# s39 — kiểm (5 dòng): CRD shopfeatures.shop.example.com (Namespaced, v1 có schema, Established, schema chặn thật: verify tạo
# thử ba resource sai và một resource đúng bằng --dry-run=server); đúng hai ShopFeature trong shop và có trong ~/shop/;
# release cert-manager (chart cert-manager-v1.21.3, CRD do release cài, ba Deployment Available trên cka-cp); Issuer
# selfsigned, Certificate shop-local Ready=True ghi Secret shop-local-cm-tls (SAN shop.local) và shop-tls của s29 không đổi;
# CERT_MANAGER_CRDS. Chỉ đọc. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ như s26 (files/wait.sh, 420 giây) rồi chờ Pod cert-manager Ready sau lúc boot (files/wait-cm.sh,
# tối đa 240 giây), cộng facts.sh (~30 lệnh kubectl/helm/openssl, mỗi lệnh tối đa 10–30 giây): chậm nhất ~17 phút, in ra
# đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver, shop và cert-manager, nếu đang khởi động: tối đa ~17 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "$(cat "$SESSION_DIR/files/wait-cm.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "CRD shopfeatures.shop.example.com: Namespaced, v1 served/storage có schema, Established; schema từ chối rolloutPercent 150, enabled \"yes\", thiếu enabled; explain và api-resources thấy nó" \
  "đạt" echo "$(fact CRD)"
expect_eq "Đúng hai ShopFeature ở shop: new-checkout (enabled, 20%), dark-mode (tắt, 0%); CRD và hai resource có trong ~/shop/" "đạt" echo "$(fact FEAT)"
expect_eq "Release cert-manager (namespace cert-manager, cert-manager-v1.21.3, deployed, CRD do release cài); ba Deployment Available, Pod trên cka-cp" \
  "đạt" echo "$(fact CM)"
expect_eq "Issuer selfsigned Ready; Certificate shop-local Ready=True → Secret shop-local-cm-tls (kubernetes.io/tls, SAN DNS:shop.local, khoá khớp); shop-tls của s29 không đổi, Ingress vẫn dùng nó" \
  "đạt" echo "$(fact CERT)"
expect_eq "answers.env: CERT_MANAGER_CRDS bằng số CRD *.cert-manager.io trong cluster" "đạt" echo "$(fact ANS)"
assert_summary
