# s12 — lời giải chuẩn: ConfigMap shop-config (literal), ConfigMap gateway-files (tệp application.yaml), Secret db-cred;
# ~/shop/{gateway,catalog,order}.yaml thêm envFrom + volume /config (gateway) và secretKeyRef (catalog, order), apply;
# thử một Pod tham chiếu khoá Secret không có để đọc lý do chờ rồi xoá; ghi ~/drills/s12/answers.env.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in application.yaml gateway.yaml catalog.yaml order.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s12-$f"
done
vm "$cp" "set -e
  do='--dry-run=client -o yaml'
  mkdir -p ~/shop ~/drills/s12
  for f in application.yaml gateway.yaml catalog.yaml order.yaml; do install -m 644 /tmp/lab-s12-\$f ~/shop/\$f; rm -f /tmp/lab-s12-\$f; done
  kubectl -n shop create configmap shop-config --from-literal=APP_GREETING='Xin chào từ ConfigMap' \
    --from-literal=CATALOG_URL=http://catalog:8080 --from-literal=ORDER_URL=http://order:8080 \$do | kubectl apply -f - >/dev/null
  kubectl -n shop create configmap gateway-files --from-file=application.yaml=\$HOME/shop/application.yaml \$do | kubectl apply -f - >/dev/null
  kubectl -n shop create secret generic db-cred --from-literal=DB_USER=shop --from-literal=DB_PASSWORD=Shop-Pass-2026 \$do | kubectl apply -f - >/dev/null
  for d in gateway catalog order; do kubectl apply -f ~/shop/\$d.yaml >/dev/null; done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=240s >/dev/null; done"
# Biến môi trường chỉ được đọc lúc container khởi động: ConfigMap đổi sau đó thì phải rollout restart.
echo "s12: chờ gateway trả lời chào của shop-config"
vm "$cp" "want=\$(kubectl -n shop get cm shop-config -o jsonpath='{.data.APP_GREETING}')
  got() { kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info 2>/dev/null | sed -n 's/.*\"greeting\":\"\\([^\"]*\\)\".*/\\1/p'; }
  for i in \$(seq 1 30); do [ \"\$(got)\" = \"\$want\" ] && exit 0; g=\$(got); [ -n \"\$g\" ] && break; sleep 2; done
  kubectl -n shop rollout restart deploy/gateway >/dev/null
  kubectl -n shop rollout status deploy/gateway --timeout=240s >/dev/null
  for i in \$(seq 1 60); do [ \"\$(got)\" = \"\$want\" ] && exit 0; sleep 2; done
  echo \"gateway trả '\$(got)', ConfigMap '\$want'\" >&2; exit 1"
# Tình huống hỏng: secretKeyRef trỏ tới khoá không có trong db-cred → kubelet không dựng được env, container không được tạo.
reason="$(vm "$cp" "kubectl -n shop delete pod cfg-bad --ignore-not-found --wait=true >/dev/null
  kubectl -n shop apply -f - >/dev/null <<'YAML'
apiVersion: v1
kind: Pod
metadata:
  name: cfg-bad
spec:
  containers:
  - name: c
    image: shop/catalog:1.0
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-cred
          key: DB_PASS
YAML
  r=''; for i in \$(seq 1 60); do
    r=\$(kubectl -n shop get pod cfg-bad -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null)
    [ \"\$r\" = CreateContainerConfigError ] && break; sleep 2
  done
  kubectl -n shop delete pod cfg-bad --wait=true >/dev/null; echo \"\$r\"")"
[ "$reason" = CreateContainerConfigError ] || { echo "s12: Pod khoá sai không ra CreateContainerConfigError: '$reason'" >&2; exit 1; }
vm "$cp" "pw=\$(kubectl -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
  printf 'DB_PASSWORD_DECODED=%s\nCONFIG_ERROR_REASON=%s\n' \"\$pw\" '$reason' > ~/drills/s12/answers.env"
