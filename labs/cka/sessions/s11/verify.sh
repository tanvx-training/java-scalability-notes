# s11 — kiểm: Pod lẻ catalog ở default đã xoá; namespace shop có ba Deployment gateway (1), catalog (2), order (1) image
# :1.0, Available; ba Service ClusterIP cổng 8080 có số địa chỉ EndpointSlice bằng số replica; gateway /api/products trả
# đủ 3 sản phẩm (qua service proxy của apiserver); answers.env khớp; ba tệp YAML trong ~/shop/ qua --dry-run=server.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver, ba Deployment và app trả lời; lâu nhất vài phút nếu Pod đang khởi động)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=150s; done
  # Chưa có readinessProbe (s13): Pod Ready trước khi Spring Boot mở cổng, nên chờ app trả lời (tối đa 180 giây mỗi service).
  for d in gateway catalog order; do
    for i in \$(seq 1 90); do kubectl -n shop get svc \$d >/dev/null 2>&1 || break; kubectl get --raw /api/v1/namespaces/shop/services/\$d:8080/proxy/actuator/health >/dev/null 2>&1 && break; sleep 2; done
  done" >/dev/null 2>&1 || true

expect_eq "Pod lẻ catalog ở namespace default đã xoá" "còn: không" \
  vm "$cp" "o=\$(kubectl -n default get pod catalog --ignore-not-found -o name) || exit 1; echo \"còn: \${o:-không}\""
for spec in gateway:1 catalog:2 order:1; do
  d="${spec%%:*}"; n="${spec##*:}"
  expect_eq "Deployment $d: image shop/$d:1.0, selector app=$d, $n/$n Available" "shop/$d:1.0 app=$d $n/$n" \
    vm "$cp" "kubectl -n shop get deploy $d -o jsonpath='{.spec.template.spec.containers[0].image} app={.spec.selector.matchLabels.app} {.spec.replicas}/{.status.availableReplicas}'"
done
for spec in gateway:1 catalog:2 order:1; do
  d="${spec%%:*}"; n="${spec##*:}"
  expect_eq "Service $d: ClusterIP cổng 8080, $n địa chỉ sẵn sàng trong EndpointSlice" "ClusterIP 8080 $n" \
    vm "$cp" "t=\$(kubectl -n shop get svc $d -o jsonpath='{.spec.type} {.spec.ports[0].port}') || exit 1
      c=\$(kubectl -n shop get endpointslices -l kubernetes.io/service-name=$d -o jsonpath='{range .items[*].endpoints[?(@.conditions.ready==true)]}{.addresses[0]}{\"\\n\"}{end}' | grep -c .)
      echo \"\$t \$c\""
done
expect_eq "gateway /api/products trả 3 sản phẩm (gateway → Service catalog)" "3" \
  vm "$cp" "for i in \$(seq 1 15); do
    o=\$(kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products 2>/dev/null) && break; sleep 2; done
    printf '%s' \"\$o\" | grep -o '\"id\":' | wc -l"
rs="$(vm "$cp" "rev=\$(kubectl -n shop get deploy catalog -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}')
  kubectl -n shop get rs -l app=catalog -o jsonpath=\"{range .items[?(@.metadata.annotations.deployment\\.kubernetes\\.io/revision==\\\"\$rev\\\")]}{.metadata.name}{end}\"" 2>/dev/null)"
expect_eq "answers.env: CATALOG_RS=${rs:-?} (ReplicaSet hiện hành của catalog)" "${rs:-?}" \
  vm "$cp" "sed -n 's/^CATALOG_RS=//p' ~/drills/s11/answers.env 2>/dev/null | tr -d '\"' | tail -n1"
# Selector của Service thử (tuỳ cách người học tạo: create service, ví dụ dán từ docs…): dạng khoá=giá-trị, không Pod nào
# trong shop khớp, và không phải nhãn của ba service thật.
expect_eq "answers.env: EMPTY_SELECTOR là selector khoá=giá-trị không khớp Pod nào trong shop" "0 Pod khớp" \
  vm "$cp" "s=\$(sed -n 's/^EMPTY_SELECTOR=//p' ~/drills/s11/answers.env 2>/dev/null | tr -d '\"' | tail -n1)
    printf '%s' \"\$s\" | grep -Eq '^[A-Za-z0-9./_-]+=[A-Za-z0-9._-]+\$' || { echo \"sai dạng: '\$s'\"; exit 1; }
    case \"\$s\" in app=gateway|app=catalog|app=order) echo \"là nhãn của service thật: \$s\"; exit 1 ;; esac
    echo \"\$(kubectl -n shop get pod -l \"\$s\" -o name | grep -c .) Pod khớp\""
for spec in gateway:1 catalog:2 order:1; do
  d="${spec%%:*}"; n="${spec##*:}"
  expect_eq "~/shop/$d.yaml qua apply --dry-run=server, khai namespace shop, replicas $n (Deployment/$d/shop $n)" "Deployment/$d/shop $n" \
    vm "$cp" "kubectl apply --dry-run=server -f ~/shop/$d.yaml -o jsonpath='{.kind}/{.metadata.name}/{.metadata.namespace} {.spec.replicas}'"
done
assert_summary
