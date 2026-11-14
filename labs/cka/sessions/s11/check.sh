# s11 — kiểm đầu vào (thay verify.sh của s10): như verify của s10 trừ một điểm: POD_IP trong answers.env chỉ cần là
# một địa chỉ IPv4, không cần bằng IP hiện tại — Pod được tạo lại sandbox sau khi VM khởi động lại nên IP có thể đổi.
# Phần còn lại của s10: Pod catalog trong namespace default Running + Ready, image shop/catalog:1.0, nhãn app=catalog, containerPort
# 8080; ~/drills/s10/pod.yaml mô tả đúng Pod đó (apply --dry-run=server); /actuator/health của Pod trả UP qua apiserver
# proxy; ~/drills/s10/answers.env khớp giá trị script tự đọc. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
# Sau khi bật VM, apiserver và Pod cần một lúc: chờ có giới hạn (không sửa gì).
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n default wait --for=condition=Ready pod/catalog --timeout=150s
  # Pod chưa có readinessProbe: Ready trước khi Spring Boot mở cổng, nên chờ thêm tới khi app trả lời (tối đa 180 giây).
  for i in \$(seq 1 90); do kubectl -n default get pod catalog >/dev/null 2>&1 || break; kubectl get --raw /api/v1/namespaces/default/pods/catalog:8080/proxy/actuator/health >/dev/null 2>&1 && break; sleep 2; done" >/dev/null 2>&1 || true

pod="kubectl -n default get pod catalog -o jsonpath"
ans() { printf "sed -n 's/^%s=//p' ~/drills/s10/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

expect_eq "Pod catalog (default) Running và Ready" "Running/True" \
  vm "$cp" "$pod='{.status.phase}/{.status.conditions[?(@.type==\"Ready\")].status}'"
expect_eq "Pod catalog chạy image shop/catalog:1.0" "shop/catalog:1.0" \
  vm "$cp" "$pod='{.spec.containers[0].image}'"
expect_eq "Pod catalog có nhãn app=catalog" "catalog" \
  vm "$cp" "$pod='{.metadata.labels.app}'"
expect_eq "Pod catalog khai containerPort 8080" "8080" \
  vm "$cp" "$pod='{.spec.containers[0].ports[*].containerPort}'"
expect_eq "~/drills/s10/pod.yaml qua apply --dry-run=server, mô tả Pod/catalog/default" "Pod/catalog/default" \
  vm "$cp" "kubectl apply --dry-run=server -n default -f ~/drills/s10/pod.yaml -o jsonpath='{.kind}/{.metadata.name}/{.metadata.namespace}'"
expect_match "/actuator/health của Pod catalog trả UP (qua apiserver proxy)" '"status":"UP"' \
  vm "$cp" "kubectl get --raw /api/v1/namespaces/default/pods/catalog:8080/proxy/actuator/health"
node="$(vm "$cp" "$pod='{.spec.nodeName}'" 2>/dev/null)"
expect_eq "answers.env: NODE=${node:-?}" "${node:-?}" vm "$cp" "$(ans NODE)"
expect_match "answers.env: POD_IP là một IPv4" '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' vm "$cp" "$(ans POD_IP)"
uid="$(vm "$cp" "kubectl -n default exec catalog -- id -u" 2>/dev/null)"
expect_eq "answers.env: RUN_UID=${uid:-?} (kubectl exec … id -u)" "${uid:-?}" vm "$cp" "$(ans RUN_UID)"
expect_match "answers.env: BAD_REASON là lý do chờ của Pod tag sai (ErrImagePull hoặc ImagePullBackOff)" \
  '^(ErrImagePull|ImagePullBackOff)$' vm "$cp" "$(ans BAD_REASON)"
assert_summary
