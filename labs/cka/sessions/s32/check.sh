# s32 — kiểm đầu vào (thay verify.sh của s31): chỉ phần của cuối s31 mà sự cố st5-network không phá. Sự cố làm Service catalog
# rỗng, order sai targetPort, ingress controller không tới gateway và mọi Pod của shop mất DNS, nên các dòng DNS, Pod tạm, luồng
# trong shop và đường từ Mac của verify s31 đỏ suốt buổi: bỏ chúng để `begin cka s32` chạy lại được giữa chừng (gây lại sự cố,
# xoá answers.env cũ) mà không phải restore. Phần đó do verify của s32 chấm. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~3 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
expect_eq "shop có NetworkPolicy default-deny (podSelector {}, Ingress + Egress) và ~/shop/ có policy cho order (nhận ingress-nginx) và egress DNS" \
  "đạt" echo "$(fact NP)"
expect_eq "~/shop/ có Service catalog và order; ~/drills/s31/answers.env đúng (DEFAULT_NS_TO_CATALOG, DRAFT_TWO_PEERS)" "đạt" echo "$(fact S31)"
assert_summary
