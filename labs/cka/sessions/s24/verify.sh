# s24 — kiểm (6 dòng): StatefulSet postgres (1/1, postgres:17-alpine, nodeSelector role=db, tài nguyên khai rõ, probe
# pg_isready, mật khẩu từ db-cred) và headless Service postgres, Pod postgres-0 trên cka-w2, ~/shop/postgres.yaml khớp; PVC
# data-postgres-0 Bound (local-path), PV Retain; catalog và order có DB_URL trỏ postgres-0 và Available; dữ liệu đếm bằng
# psql (3 sản phẩm, ≥ 3 đơn; Pod postgres-0 tạo sau đơn thứ ba), /api/products qua gateway; cka-w2 schedulable, chỉ cka-w2
# role=db, MOVE_REASON; STS_POD_DNS. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
# Sau khi VM khởi động lại: postgres-0 lên trong vài chục giây, catalog/order (JVM) cần tới vài phút; status trong API còn là của
# trước lúc tắt nên "replicas = available" đúng ngay mà Pod chưa chạy. Vì vậy: chờ apiserver (180 giây), thoát sớm khi đang dời node
# hay chưa có StatefulSet; control plane vừa khởi động (< 15 phút) thì chờ bằng s26/files/wait.sh (mọi Pod gateway, catalog,
# order, postgres Ready sau lúc boot, 420 giây), không thì vòng cũ (420 giây). Cộng facts.sh với --request-timeout: in ra ~13 phút.
cp="$LAB_CP"
echo "  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~13 phút)"
rc=0
vm "$cp" "end=\$((\$(date +%s) + 180))
  until kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 || [ \$(date +%s) -ge \$end ]; do sleep 2; done
  k='kubectl --request-timeout=10s'
  # Đang thử dời node (cka-w2 cordon): không chờ.
  o=\$(\$k get node cka-w2 -o jsonpath='{.spec.unschedulable}' 2>/dev/null) && [ \"\$o\" = true ] && exit 0
  # Chưa có StatefulSet (NotFound) thì không chờ postgres-0; lỗi khác là \"chưa sẵn sàng\".
  e=\$(\$k -n shop get sts postgres -o name 2>&1) || case \"\$e\" in *NotFound*) exit 0 ;; esac
  [ \$((\$(date +%s) - \$(date -d \"\$(uptime -s)\" +%s))) -lt 900 ] && exit 3
  # Hạn theo đồng hồ (420 giây): mỗi lệnh có --request-timeout nên vượt hạn tối đa ~10 giây.
  end=\$((\$(date +%s) + 420))
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get sts postgres -o jsonpath='{.spec.replicas} {.status.readyReplicas}' 2>/dev/null) \\
      && [ -n \"\$o\" ] && [ \"\${o% *}\" = \"\${o#* }\" ] && break
    sleep 3
  done
  # Lệnh lỗi hay hết giờ là \"chưa sẵn sàng\": chỉ thoát sớm khi đọc được cả ba Deployment và cả ba đủ Available.
  while [ \$(date +%s) -lt \$end ]; do
    o=\$(\$k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{\"\\n\"}{end}' 2>/dev/null) \\
      && [ \"\$(printf '%s\\n' \"\$o\" | grep -c .)\" = 3 ] && [ \"\$(printf '%s\\n' \"\$o\" | awk '\$1!=\$2' | grep -c .)\" = 0 ] && break
    sleep 3
  done" >/dev/null 2>&1 || rc=$?
if [ "$rc" = 3 ]; then vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true; fi

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }

expect_eq "StatefulSet postgres 1/1 (postgres:17-alpine, nodeSelector role=db, requests/limits, probe pg_isready, mật khẩu từ db-cred), Pod postgres-0 trên cka-w2; Service postgres headless; ~/shop/postgres.yaml khớp" \
  "đạt" echo "$(fact POSTGRES)"
expect_eq "PVC data-postgres-0 Bound (local-path, 1Gi, RWO), PV của nó Retain và ghim cka-w2" "đạt" echo "$(fact STORAGE)"
expect_eq "catalog, order: DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop, DB_USER/DB_PASSWORD từ db-cred, Available; ~/shop/{catalog,order}.yaml khớp" \
  "đạt" echo "$(fact APPS)"
expect_eq "PostgreSQL: products 3 dòng, orders ≥ 3 dòng (psql trong postgres-0); postgres-0 được tạo lại sau đơn thứ ba; gateway /api/products trả 3 sản phẩm" \
  "đạt" echo "$(fact DATA)"
expect_eq "answers.env: MOVE_REASON có “didn't match PersistentVolume's node affinity” và “were unschedulable”; postgres-0 hiện tại đã đứng Pending lúc thử dời; cka-w2 đã uncordon, chỉ cka-w2 mang nhãn role=db" "đạt" echo "$(fact MOVE)"
expect_eq "answers.env: STS_POD_DNS=postgres-0.postgres.shop.svc.cluster.local" "postgres-0.postgres.shop.svc.cluster.local" echo "$(fact STS_POD_DNS)"
assert_summary
