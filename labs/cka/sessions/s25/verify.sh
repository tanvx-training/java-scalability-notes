# s25 — kiểm (6 dòng, sau sự cố st4-storage): mọi PVC của shop Bound, không PV Released của shop; postgres-0 Ready trên
# cka-w2 với PVC data-postgres-0 bind vào PV cũ của s24; dữ liệu bằng hoặc hơn cuối s24 (psql); catalog, order DB_URL đúng
# và Available, ~/shop/order.yaml khớp; PVC reports Bound với lớp có thật, Deployment reports Available, ~/shop/reports.yaml
# khớp; answers.env PROTECTION_FINALIZER. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Không chờ khi sự cố còn (PVC Pending, PV Released, chưa có StatefulSet postgres hay Deployment reports, DB_URL của order
# sai): người học chạy verify nhiều lần giữa buổi. Chỉ chờ khi mọi thứ đã có mà chưa sẵn sàng (như ngay sau khi VM khởi
# động lại), tối đa ~7 phút.
cp="$LAB_CP"
echo "  (chờ apiserver, postgres-0 và các Deployment, nếu đang khởi động: tối đa ~7 phút)"
vm "$cp" "# Hạn theo đồng hồ (420 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 420))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  while [ \$(date +%s) -lt \$end ]; do
    # Sự cố còn đó: đọc ngay, không chờ.
    o=\$(\$k -n shop get pvc -o jsonpath='{range .items[*]}{.status.phase}{\"\\n\"}{end}' 2>/dev/null) && printf '%s\\n' \"\$o\" | grep -qx Pending && break
    o=\$(\$k get pv -o jsonpath='{range .items[*]}{.status.phase}{\"\\n\"}{end}' 2>/dev/null) && printf '%s\\n' \"\$o\" | grep -qx Released && break
    e=\$(\$k -n shop get sts postgres deploy/reports -o name 2>&1) || { case \"\$e\" in *NotFound*) break ;; esac; sleep 3; continue; }
    o=\$(\$k -n shop get deploy order -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name==\"DB_URL\")].value}' 2>/dev/null) \\
      && case \"\$o\" in *:5432/shop) ;; *) break ;; esac
    # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát khi postgres-0 Ready và mọi Deployment đủ Available.
    o=\$(\$k -n shop get sts postgres -o jsonpath='{.spec.replicas} {.status.readyReplicas}' 2>/dev/null) \\
      && [ \"\${o% *}\" = \"\${o#* }\" ] \\
      && o=\$(\$k -n shop get deploy gateway catalog order reports -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 4 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "Mọi PVC trong shop Bound; không PV nào của shop ở Released" "đạt" echo "$(fact BOUND)"
expect_eq "postgres-0 Ready trên cka-w2; PVC data-postgres-0 bind vào PV cũ của s24 (Retain), không phải PV mới" "đạt" echo "$(fact POSTGRES)"
expect_eq "PostgreSQL: products 3 dòng, orders ≥ 3 dòng, đơn cũ của s24 còn (psql trong postgres-0)" "đạt" echo "$(fact DATA)"
expect_eq "catalog, order: DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop, Available, rollout xong; ~/shop/order.yaml khớp" \
  "đạt" echo "$(fact APPS)"
expect_eq "PVC reports Bound với StorageClass có thật; Deployment reports Available (ghi được /reports); ~/shop/reports.yaml khớp" "đạt" echo "$(fact REPORTS)"
expect_eq "answers.env: PROTECTION_FINALIZER=kubernetes.io/pvc-protection" "kubernetes.io/pvc-protection" echo "$(fact PROTECTION_FINALIZER)"
assert_summary
