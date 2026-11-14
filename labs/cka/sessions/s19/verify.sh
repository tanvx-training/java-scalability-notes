# s19 — kiểm: cka-w2 có nhãn role=db (chỉ cka-w2), hai worker không taint, không cordon; catalog có podAntiAffinity
# preferred theo kubernetes.io/hostname chọn chính Pod catalog (không còn required), hai Pod Ready ở hai node khác nhau,
# ~/shop/catalog.yaml khớp; PriorityClass shop-critical (không globalDefault) và gateway dùng nó, ba Deployment Available
# đúng số replica, ~/shop/gateway.yaml khớp; db-probe, pinned, spread-lab đã xoá; answers.env khớp.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~4 phút)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for i in \$(seq 1 80); do
    u=\$(kubectl --request-timeout=10s -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null | awk '\$1!=\$2' | grep -c .)
    [ \"\$u\" = 0 ] && break; sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s19/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "cka-w2 có nhãn role=db (chỉ cka-w2); cka-w1, cka-w2 không còn taint, không cordon" "đạt" echo "$(fact NODES)"
expect_eq "catalog: podAntiAffinity preferred theo kubernetes.io/hostname (app=catalog), 2 Pod Ready ở 2 node khác nhau; ~/shop/catalog.yaml khớp" \
  "đạt" echo "$(fact CATALOG)"
expect_eq "PriorityClass shop-critical (không globalDefault), Pod gateway mang priority của nó; Available 2/2/1; ~/shop/gateway.yaml khớp" \
  "đạt" echo "$(fact PRIORITY)"
expect_match "answers.env: PENDING_REASON có 'untolerated taint' (Event FailedScheduling của db-probe); Pod db-probe đã xoá" \
  "untolerated taint.* đã xoá\$" echo "$(vm "$cp" "$(ans PENDING_REASON)") $(fact DB_PROBE)"
expect_match "answers.env: NODENAME_SKIPS_SCHEDULER=yes; Pod pinned và Deployment spread-lab đã xoá" \
  "^(yes|true|có) đã xoá\$" echo "$(vm "$cp" "$(ans NODENAME_SKIPS_SCHEDULER) | tr 'A-Z' 'a-z'") $(fact DRAFTS)"
assert_summary
