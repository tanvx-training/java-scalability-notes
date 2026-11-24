# s33 — kiểm (6 dòng): ~/users/{dev,ops}.{key,crt} có đủ; cert do CA của cluster ký (openssl verify -CAfile
# /etc/kubernetes/pki/ca.crt), dùng cho client auth, còn hạn ≥ 30 ngày; subject đúng một CN (dev/ops) và một O (shop-dev/shop-ops);
# key khớp cert; CSR dev, ops Approved với signer kube-apiserver-client, cert trên đĩa trùng status.certificate của CSR đó
# (CSR đã duyệt bị controller dọn sau 1 giờ: khi đó chấm ~/users/<u>-csr.yaml cộng dấu vết signer của kube-controller-manager
# trên cert, để cert tự ký bằng ca.key không xanh chỉ vì CSR đã hết), CSR nháp đã xoá; hai đáp án. Chỉ đọc. Nạp bởi `lab` trên
# Mac (bash 3.2).
# Sau khi VM khởi động lại: chỉ cần apiserver (CSR), chờ có giới hạn 180 giây, cộng facts.sh (một lệnh kubectl 10 giây):
# in ra ~4 phút.
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~4 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until sudo kubectl --kubeconfig /etc/kubernetes/admin.conf --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "~/users/dev.key, dev.crt, ops.key, ops.crt có đủ" "đạt" echo "$(fact FILES)"
expect_eq "dev.crt, ops.crt do CA của cluster ký (openssl verify), EKU client auth, còn hạn ≥ 30 ngày" "đạt" echo "$(fact CA)"
expect_eq "Subject: dev.crt CN=dev O=shop-dev, ops.crt CN=ops O=shop-ops, không thêm trường nào" "đạt" echo "$(fact SUBJ)"
expect_eq "Key khớp cert (cùng public key) cho dev và ops" "đạt" echo "$(fact KEYMATCH)"
expect_eq "CSR dev, ops: kube-apiserver-client, client auth, Approved, cert cấp ra trùng ~/users/; CSR nháp dev-draft đã xoá" \
  "đạt" echo "$(fact CSR)"
expect_eq "answers.env: APISERVER_SANS khớp SAN của apiserver.crt, CERT_GROUP_FIELD" "đạt" echo "$(fact ANS)"
assert_summary
