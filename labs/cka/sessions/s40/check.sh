# s40 — kiểm đầu vào (thay verify.sh của s39): đủ năm dòng của s39 (CRD và ShopFeature, cert-manager, Certificate shop-local,
# shop-tls, CERT_MANAGER_CRDS). Sự cố st7-helm không đụng chúng, nên `begin cka s40` chạy lại được giữa buổi (release shop đang
# failed, demo đang pending-upgrade) mà không phải restore. Không kiểm lại release shop/demo ở đây: chính sự cố phá chúng.
# Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Sau khi VM khởi động lại: chờ như verify s39 (s26/files/wait.sh 420 giây, s39/files/wait-cm.sh 240 giây) cộng facts s39
# (~30 lệnh, mỗi lệnh tối đa 10–30 giây): chậm nhất ~17 phút, in ra đúng con số đó.
cp="$LAB_CP"
s39="$SESSION_DIR/../s39"
echo "  (chờ apiserver, shop và cert-manager, nếu đang khởi động: tối đa ~17 phút)"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "$(cat "$s39/files/wait-cm.sh")" >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$s39/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "CRD shopfeatures.shop.example.com như cuối s39 (Namespaced, schema chặn resource sai); hai ShopFeature ở shop" \
  "đạt" echo "$(fact CRD)$( [ "$(fact FEAT)" = "đạt" ] || echo "; $(fact FEAT)")"
expect_eq "Release cert-manager deployed (cert-manager-v1.21.3), ba Deployment Available trên cka-cp" "đạt" echo "$(fact CM)"
expect_eq "Certificate shop-local Ready → Secret shop-local-cm-tls; shop-tls của s29 không đổi" "đạt" echo "$(fact CERT)"
expect_eq "answers.env của s39: CERT_MANAGER_CRDS" "đạt" echo "$(fact ANS)"
assert_summary
