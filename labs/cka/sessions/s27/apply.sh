# s27 — lời giải chuẩn: thêm cổng tên http (containerPort 8080) vào ~/shop/{gateway,catalog,order}.yaml bằng PyYAML, apply,
# chờ rollout (Pod có tên cổng TRƯỚC khi Service trỏ targetPort theo tên); ~/shop/services.yaml (ba Service ClusterIP, cổng
# http 8080 → targetPort http) và ~/shop/gateway-nodeport.yaml (NodePort 30180) chép từ files/ (người học sinh khung bằng
# `kubectl create svc … --dry-run=client -o yaml` rồi sửa); thử Service catalog-bad (targetPort 9090: EndpointSlice có địa chỉ, gọi bị
# từ chối) và Service gateway-lb kiểu LoadBalancer (EXTERNAL-IP <pending>) rồi xoá; đọc chuỗi KUBE-SVC của
# shop/catalog:http và chế độ kube-proxy; ghi ~/drills/s27/answers.env. Chạy lại nhiều lần được.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"

echo "s27: cổng tên http trong ba Deployment, rollout"
vm "$cp" "set -e; mkdir -p ~/drills/s27
python3 - <<'PY'
import os, yaml
home = os.path.expanduser('~')
for name in ('gateway', 'catalog', 'order'):
    p = f'{home}/shop/{name}.yaml'
    with open(p) as f: doc = [d for d in yaml.safe_load_all(f) if d][0]
    c = [x for x in doc['spec']['template']['spec']['containers'] if x['name'] == name][0]
    c['ports'] = [{'name': 'http', 'containerPort': 8080, 'protocol': 'TCP'}]
    with open(p, 'w') as f: f.write(yaml.safe_dump(doc, sort_keys=False, allow_unicode=True, width=1000))
PY
kubectl apply -f ~/shop/gateway.yaml -f ~/shop/catalog.yaml -f ~/shop/order.yaml >/dev/null
for d in catalog order gateway; do kubectl -n shop rollout status deploy/\$d --timeout=600s >/dev/null; done"

echo "s27: ~/shop/services.yaml (targetPort http) và ~/shop/gateway-nodeport.yaml (30180)"
vm_put "$SESSION_DIR/files/services.yaml" "$cp" /tmp/lab-s27-services.yaml
vm_put "$SESSION_DIR/files/gateway-nodeport.yaml" "$cp" /tmp/lab-s27-nodeport.yaml
vm "$cp" "set -e
  # Khung người học sinh bằng dry-run (in ra để so), tệp chuẩn là files/services.yaml.
  kubectl -n shop create service clusterip catalog --tcp=8080:8080 --dry-run=client -o yaml
  install -m 644 /tmp/lab-s27-services.yaml ~/shop/services.yaml
  install -m 644 /tmp/lab-s27-nodeport.yaml ~/shop/gateway-nodeport.yaml
  rm -f /tmp/lab-s27-services.yaml /tmp/lab-s27-nodeport.yaml
  kubectl apply -f ~/shop/services.yaml -f ~/shop/gateway-nodeport.yaml >/dev/null
  kubectl -n shop get svc gateway catalog order gateway-nodeport
  for i in \$(seq 1 60); do
    kubectl get --raw /api/v1/namespaces/shop/services/gateway:http/proxy/api/products 2>/dev/null | grep -q '\"id\":3' && exit 0; sleep 2
  done; echo 'gateway chưa trả /api/products qua cổng http' >&2; exit 1"

echo "s27: Service catalog-bad (targetPort 9090): EndpointSlice có địa chỉ nhưng gọi bị từ chối"
vm "$cp" "set -e
  kubectl -n shop delete svc catalog-bad --ignore-not-found >/dev/null
  kubectl -n shop expose deploy catalog --name=catalog-bad --port=8080 --target-port=9090 >/dev/null
  for i in \$(seq 1 30); do n=\$(kubectl -n shop get endpointslice -l kubernetes.io/service-name=catalog-bad -o jsonpath='{.items[*].endpoints[*].addresses[0]}' | wc -w); [ \"\$n\" -ge 1 ] && break; sleep 1; done
  kubectl -n shop get endpointslice -l kubernetes.io/service-name=catalog-bad
  # Pod tạm chạy sleep rồi exec vào: \`run --rm -i\` với lệnh chạy xong ngay có thể mất output (attach sau khi container đã thoát).
  kubectl -n shop delete pod s27-probe --ignore-not-found --now >/dev/null 2>&1
  kubectl -n shop run s27-probe --image=busybox:1.37 --restart=Never --command -- sleep 600 >/dev/null
  kubectl -n shop wait pod/s27-probe --for=condition=Ready --timeout=120s >/dev/null
  out=\$(kubectl -n shop exec s27-probe -- sh -c 'wget -q -T 3 -O- http://catalog-bad:8080/products 2>&1; echo; wget -q -T 3 -O- http://catalog:8080/products | head -c 40' 2>&1 || true)
  kubectl -n shop delete pod s27-probe --now >/dev/null
  echo \"\$out\"
  kubectl -n shop delete svc catalog-bad >/dev/null
  case \"\$out\" in *'Connection refused'*'\"id\":1'*) ;; *) echo 'catalog-bad không bị từ chối như mong đợi' >&2; exit 1 ;; esac"

echo "s27: Service gateway-lb kiểu LoadBalancer (không có cloud: EXTERNAL-IP <pending>), chuỗi iptables, chế độ kube-proxy"
vm "$cp" "set -e
  kubectl -n shop delete svc gateway-lb --ignore-not-found >/dev/null
  kubectl -n shop expose deploy gateway --name=gateway-lb --type=LoadBalancer --port=8080 --target-port=http >/dev/null
  sleep 3
  lb=\$(kubectl -n shop get svc gateway-lb --no-headers | awk '{print \$4}')
  kubectl -n shop get svc gateway-lb
  kubectl -n shop delete svc gateway-lb >/dev/null
  [ \"\$lb\" = '<pending>' ]
  chain=''
  for i in \$(seq 1 30); do
    chain=\$(sudo iptables-save -t nat | sed -n 's/^-A KUBE-SERVICES .*--comment \"shop\\/catalog:http cluster IP\".* -j \\(KUBE-SVC-[A-Z0-9]*\\).*/\\1/p' | head -n1)
    [ -n \"\$chain\" ] && break; sleep 2
  done
  [ -n \"\$chain\" ]
  sudo iptables-save -t nat | grep -E \"^-A (\$chain|KUBE-SEP-[A-Z0-9]+) \" | grep 'shop/catalog:http'
  mode=\$(curl -s --max-time 5 http://127.0.0.1:10249/proxyMode)
  [ \"\$mode\" = iptables ]
  printf 'KUBE_SVC_CHAIN=%s\nPROXY_MODE=%s\nLB_EXTERNAL_IP_STATE=%s\n' \"\$chain\" \"\$mode\" \"\$lb\" > ~/drills/s27/answers.env
  cat ~/drills/s27/answers.env"

ip="$(vm "$cp" "kubectl get node cka-w1 -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}'")"
echo "s27: từ máy Mac: curl http://$ip:30180/api/products"
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf --noproxy '*' --max-time 5 "http://$ip:30180/api/products" | grep -q '"id":3' && { echo "s27: NodePort trả 3 sản phẩm"; exit 0; }
  sleep 3
done
echo "s27: http://$ip:30180/api/products không trả 3 sản phẩm" >&2; exit 1
