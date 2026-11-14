# s14 — kiểm: gateway image shop/gateway:2.0, 2 replica Available, RollingUpdate maxUnavailable 0 / maxSurge 1;
# /api/info trả version 2.0; lịch sử ≥ 3 revision, có revision image hỏng cũ hơn revision hiện hành, revision hiện hành
# có change-cause; ~/drills/s14/curl.log ≥ 30 dòng, dòng nào cũng bắt đầu bằng 200 (`-w '%{http_code} %{exitcode}'`); ~/shop/gateway.yaml khớp; answers.env khớp.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và Deployment gateway nếu Pod đang khởi động: tối đa ~6 phút, lâu hơn nếu apiserver nhận kết nối mà không trả lời)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n shop rollout status deploy/gateway --timeout=240s" >/dev/null 2>&1 || true

g="kubectl -n shop get deploy gateway -o jsonpath"
# Mỗi ReplicaSet của gateway: "<revision> <image>", sắp theo revision.
rsl="kubectl -n shop get rs -l app=gateway -o jsonpath='{range .items[*]}{.metadata.annotations.deployment\\.kubernetes\\.io/revision} {.spec.template.spec.containers[0].image}{\"\\n\"}{end}' | sort -n"

expect_eq "gateway: image shop/gateway:2.0, 2/2/2 cập nhật và Available" "shop/gateway:2.0 2/2/2" \
  vm "$cp" "$g='{.spec.template.spec.containers[0].image} {.spec.replicas}/{.status.updatedReplicas}/{.status.availableReplicas}'"
expect_eq "gateway: strategy RollingUpdate, maxUnavailable 0, maxSurge 1" "RollingUpdate 0 1" \
  vm "$cp" "$g='{.spec.strategy.type} {.spec.strategy.rollingUpdate.maxUnavailable} {.spec.strategy.rollingUpdate.maxSurge}'"
expect_match "gateway /api/info trả version 2.0 (qua apiserver proxy)" '"version":"2.0"' \
  vm "$cp" "for i in \$(seq 1 30); do o=\$(kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info 2>/dev/null) && break; sleep 2; done; echo \"\$o\""
expect_eq "lịch sử: ≥ 3 revision, có revision image hỏng cũ hơn revision hiện hành, revision hiện hành có change-cause" \
  "đạt" vm "$cp" "cur=\$($g='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}') || exit 1
    cause=\$($g='{.metadata.annotations.kubernetes\\.io/change-cause}')
    l=\$($rsl); n=\$(printf '%s\\n' \"\$l\" | grep -c .)
    bad=\$(printf '%s\\n' \"\$l\" | awk '\$2!=\"shop/gateway:1.0\" && \$2!=\"shop/gateway:2.0\" {print \$1}' | tail -n1)
    [ \"\$n\" -ge 3 ] || { echo \"\$n revision\"; exit 0; }
    [ -n \"\$bad\" ] && [ \"\$bad\" -lt \"\$cur\" ] || { echo \"không có revision image hỏng cũ hơn revision \$cur: \$(echo \$l)\"; exit 0; }
    [ -n \"\$cause\" ] || { echo \"revision \$cur chưa có change-cause\"; exit 0; }
    echo đạt"
expect_eq "~/drills/s14/curl.log: ≥ 30 dòng, mọi dòng mã 200 (dạng '<mã HTTP> <mã thoát curl>', curl -m 5)" "đạt" \
  vm "$cp" "f=~/drills/s14/curl.log; [ -f \$f ] || { echo 'chưa có tệp'; exit 0; }
    n=\$(grep -c . \$f); b=\$(grep -vc '^200 0$' \$f)
    [ \"\$n\" -ge 30 ] && [ \"\$b\" = 0 ] && echo đạt || echo \"\$n dòng, \$b dòng khác 200\""
expect_eq "~/shop/gateway.yaml (apply --dry-run=server): image 2.0, replicas 2, maxUnavailable 0, maxSurge 1" \
  "shop/gateway:2.0 2 0 1" \
  vm "$cp" "kubectl apply --dry-run=server -f ~/shop/gateway.yaml -o jsonpath='{.spec.template.spec.containers[0].image} {.spec.replicas} {.spec.strategy.rollingUpdate.maxUnavailable} {.spec.strategy.rollingUpdate.maxSurge}'"
expect_eq "answers.env: BROKEN_REVISION là revision của ReplicaSet image hỏng (đọc từ rollout history)" "đạt" \
  vm "$cp" "a=\$(sed -n 's/^BROKEN_REVISION=//p' ~/drills/s14/answers.env 2>/dev/null | tr -d '\"' | tail -n1)
    [ -n \"\$a\" ] || { echo 'chưa có BROKEN_REVISION'; exit 0; }
    $rsl | awk -v a=\"\$a\" '\$1==a && \$2!=\"shop/gateway:1.0\" && \$2!=\"shop/gateway:2.0\" {ok=1} END {print (ok ? \"đạt\" : \"revision \" a \" không mang image hỏng\")}'"
assert_summary
