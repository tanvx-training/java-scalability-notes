# s25 — kiểm đầu vào (thay verify.sh của s24): chỉ phần của cuối s24 mà sự cố st4-storage không phá. Sự cố xoá StatefulSet
# postgres và PVC data-postgres-0, làm order mất kết nối và thêm một PVC Pending, nên các dòng postgres 1/1, PVC Bound, dữ liệu
# đếm bằng psql, order Available của verify s24 đỏ suốt buổi: bỏ chúng đi để `begin cka s25` chạy lại được giữa chừng (gây lại
# sự cố, xoá answers.env cũ) mà không phải restore. Phần đó do verify của s25 chấm. Chỉ đọc. Nạp bởi `lab` (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver, nếu đang khởi động: tối đa ~3 phút)"
vm "$cp" "end=\$((\$(date +%s) + 180))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "StorageClass mặc định local-path; còn PV Retain của shop/data-postgres-0 (dữ liệu cuối s24) ghim cka-w2" "đạt" echo "$(fact PV)"
expect_eq "Service postgres headless; ~/shop/postgres.yaml có StatefulSet postgres (volumeClaimTemplates data); catalog có DB_URL trỏ postgres-0" \
  "đạt" echo "$(fact SPEC)"
expect_eq "cka-w2 schedulable, chỉ cka-w2 mang role=db; ~/drills/s24/answers.env (MOVE_REASON, STS_POD_DNS) đúng" "đạt" echo "$(fact S24)"
assert_summary
