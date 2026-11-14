# s12 — kiểm: ConfigMap shop-config (APP_GREETING mới, CATALOG_URL, ORDER_URL), ConfigMap gateway-files (application.yaml),
# Secret db-cred (DB_USER, DB_PASSWORD); gateway nạp shop-config bằng envFrom và /api/info trả đúng lời chào trong
# ConfigMap; gateway mount gateway-files ở /config, tệp trong Pod bằng nội dung khoá và Spring đã đọc nó (/actuator/info);
# catalog, order lấy DB_USER, DB_PASSWORD từ secretKeyRef; answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=150s; done
  # Chưa có readinessProbe (s13): Pod Ready trước khi Spring Boot mở cổng, nên chờ app trả lời (tối đa 180 giây mỗi service).
  for d in gateway catalog order; do
    for i in \$(seq 1 90); do kubectl -n shop get svc \$d >/dev/null 2>&1 || break; kubectl get --raw /api/v1/namespaces/shop/services/\$d:8080/proxy/actuator/health >/dev/null 2>&1 && break; sleep 2; done
  done" >/dev/null 2>&1 || true

keys() { printf "kubectl -n shop get %s -o go-template='{{range \$k, \$v := .data}}{{\$k}} {{end}}' | sed 's/ *\$//'" "$1"; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s12/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }
proxy="kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy"
dep="kubectl -n shop get deploy"

expect_eq "ConfigMap shop-config: khoá APP_GREETING CATALOG_URL ORDER_URL, URL trỏ tới Service, lời chào khác mặc định" \
  "APP_GREETING CATALOG_URL ORDER_URL|http://catalog:8080|http://order:8080|mới" \
  vm "$cp" "k=\$($(keys cm/shop-config)) || exit 1
    g=\$(kubectl -n shop get cm shop-config -o jsonpath='{.data.APP_GREETING}')
    n=mới; { [ -z \"\$g\" ] || [ \"\$g\" = 'Xin chào từ shop' ]; } && n=\"cũ/rỗng: \$g\"
    echo \"\$k|\$(kubectl -n shop get cm shop-config -o jsonpath='{.data.CATALOG_URL}|{.data.ORDER_URL}')|\$n\""
expect_eq "ConfigMap gateway-files: khoá application.yaml" "application.yaml" vm "$cp" "$(keys cm/gateway-files)"
expect_eq "Secret db-cred: Opaque, khoá DB_PASSWORD DB_USER" "Opaque DB_PASSWORD DB_USER" \
  vm "$cp" "t=\$(kubectl -n shop get secret db-cred -o jsonpath='{.type}') || exit 1; echo \"\$t \$($(keys secret/db-cred))\""
expect_eq "gateway: envFrom configMapRef shop-config, 1/1 cập nhật và Available" "shop-config 1/1/1" \
  vm "$cp" "$dep gateway -o jsonpath='{.spec.template.spec.containers[0].envFrom[*].configMapRef.name} {.spec.replicas}/{.status.updatedReplicas}/{.status.availableReplicas}'"
want="$(vm "$cp" "kubectl -n shop get cm shop-config -o jsonpath='{.data.APP_GREETING}'" 2>/dev/null)"
expect_eq "gateway /api/info: greeting = APP_GREETING của shop-config (${want:-?})" "${want:-?}" \
  vm "$cp" "for i in \$(seq 1 15); do o=\$($proxy/api/info 2>/dev/null) && break; sleep 2; done
    printf '%s' \"\$o\" | sed -n 's/.*\"greeting\":\"\\([^\"]*\\)\".*/\\1/p'"
expect_eq "gateway: volume từ ConfigMap gateway-files mount ở /config" "/config" \
  vm "$cp" "v=\$($dep gateway -o jsonpath='{range .spec.template.spec.volumes[?(@.configMap.name==\"gateway-files\")]}{.name}{end}') || exit 1
    [ -n \"\$v\" ] || exit 1
    $dep gateway -o jsonpath=\"{range .spec.template.spec.containers[0].volumeMounts[?(@.name==\\\"\$v\\\")]}{.mountPath}{end}\""
# kubelet cập nhật tệp của volume ConfigMap theo chu kỳ (tới khoảng một phút): chờ có giới hạn nếu ConfigMap vừa đổi.
expect_ok "Pod gateway: /config/application.yaml bằng nội dung khoá application.yaml" \
  vm "$cp" "kubectl -n shop get cm gateway-files -o jsonpath='{.data.application\\.yaml}' | grep -q . || { echo 'khoá application.yaml rỗng hoặc không có'; exit 1; }
  for i in \$(seq 1 45); do
    a=\$(kubectl -n shop get cm gateway-files -o jsonpath='{.data.application\\.yaml}' | md5sum)
    b=\$(kubectl -n shop exec deploy/gateway -- cat /config/application.yaml 2>/dev/null | md5sum)
    [ \"\$a\" = \"\$b\" ] && exit 0; sleep 2; done; echo \"khác nhau: cm \$a, Pod \$b\"; exit 1"
expect_match "gateway /actuator/info có khối shop (Spring đã nạp /config/application.yaml)" '"shop":\{' \
  vm "$cp" "$proxy/actuator/info"
for spec in catalog:2 order:1; do
  d="${spec%%:*}"; n="${spec##*:}"
  expect_eq "$d: DB_USER, DB_PASSWORD từ secretKeyRef db-cred, $n/$n/$n cập nhật và Available" \
    "DB_PASSWORD<-db-cred DB_USER<-db-cred $n/$n/$n" \
    vm "$cp" "e=\$($dep $d -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}<-{.valueFrom.secretKeyRef.name}{\"\\n\"}{end}') || exit 1
      echo \"\$(printf '%s\\n' \"\$e\" | grep -E '^DB_(USER|PASSWORD)<-' | sort | tr '\\n' ' ')\$($dep $d -o jsonpath='{.spec.replicas}/{.status.updatedReplicas}/{.status.availableReplicas}')\""
done
pw="$(vm "$cp" "kubectl -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d" 2>/dev/null)"
expect_eq "answers.env: DB_PASSWORD_DECODED khớp Secret db-cred" "${pw:-?}" vm "$cp" "$(ans DB_PASSWORD_DECODED)"
expect_eq "answers.env: CONFIG_ERROR_REASON=CreateContainerConfigError (tham chiếu khoá không có)" "CreateContainerConfigError" \
  vm "$cp" "$(ans CONFIG_ERROR_REASON)"
assert_summary
