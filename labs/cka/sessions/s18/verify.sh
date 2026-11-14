# s18 — kiểm: ResourceQuota shop-quota có pods, requests.cpu, requests.memory, limits.memory và LimitRange shop-limits
# có default.memory, defaultRequest.cpu/memory, max.memory (cả hai khớp ~/shop/quota.yaml, ~/shop/limits.yaml); namespace
# của context hiện hành (user ubuntu trên cka-cp) là shop; Pod không khai tài nguyên, thử bằng --dry-run=server, nhận
# đúng giá trị mặc định của LimitRange; used ≤ hard và ba Deployment Available đúng số replica; namespace quota-lab đã
# xoá; answers.env khớp. Chỉ đọc (--dry-run=server không tạo gì). Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment, nếu đang khởi động: tối đa ~6 phút)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  # Chỉ thoát sớm khi đọc được cả ba Deployment và cả ba đủ Available: lệnh lỗi hay hết giờ là \"chưa sẵn sàng\".
  for i in \$(seq 1 120); do
    o=\$(kubectl --request-timeout=10s -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s18/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "ResourceQuota shop-quota: pods, requests.cpu, requests.memory, limits.memory; khớp ~/shop/quota.yaml" "đạt" echo "$(fact QUOTA)"
expect_eq "LimitRange shop-limits (Container): default.memory, defaultRequest.cpu/memory, max.memory; khớp ~/shop/limits.yaml" \
  "đạt" echo "$(fact LR)"
expect_eq "kubectl config: namespace của context hiện hành là shop" "shop" echo "$(fact CTX_NS)"
expect_eq "Pod không khai tài nguyên (--dry-run=server) nhận đúng defaultRequest và default của shop-limits" "đạt" echo "$(fact DEFAULTS)"
expect_eq "shop-quota: used ≤ hard mọi khoá; gateway, catalog, order Available 2/2/1" "đạt" echo "$(fact USED)"
expect_eq "answers.env: QUOTA_ERROR_KIND=ReplicaSet; namespace quota-lab đã xoá" "ReplicaSet đã xoá" \
  echo "$(vm "$cp" "$(ans QUOTA_ERROR_KIND)") $(fact QUOTA_LAB)"
expect_eq "answers.env: POD_QUOTA_ERROR=Forbidden (lỗi khi tạo Pod thẳng vượt quota)" "Forbidden" vm "$cp" "$(ans POD_QUOTA_ERROR)"
assert_summary
