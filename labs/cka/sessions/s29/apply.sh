# s29 — lời giải chuẩn: tải manifest ingress-nginx controller-v1.15.1 bản baremetal (Service NodePort) vào ~/drills/s29, sửa
# bằng files/patch-ingress-nginx.py (NodePort 30080/30443, controller trên cka-cp), apply, chờ controller và webhook; shop.local
# trong /etc/hosts của cka-cp; chứng chỉ tự ký (openssl req -x509, SAN shop.local) và Secret tls shop-tls; Ingress nháp
# shop-noclass (không ingressClassName: không có ADDRESS, gọi ra 404) rồi xoá; ~/shop/ingress.yaml (sinh khung bằng
# `kubectl create ingress … --dry-run=client`, tệp chuẩn là files/ingress.yaml) và apply; ghi PATH_EXACT_RESULT; gọi từ Mac.
# Chạy lại nhiều lần được (manifest đã tải và chứng chỉ còn đúng thì giữ). Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
INGRESS_NGINX_VERSION=controller-v1.15.1
url="https://raw.githubusercontent.com/kubernetes/ingress-nginx/$INGRESS_NGINX_VERSION/deploy/static/provider/baremetal/deploy.yaml"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/patch-ingress-nginx.py" "$cp" /tmp/lab-s29-patch.py
vm_put "$SESSION_DIR/files/ingress.yaml" "$cp" /tmp/lab-s29-ingress.yaml
vm_put "$SESSION_DIR/files/noclass.yaml" "$cp" /tmp/lab-s29-noclass.yaml

echo "s29: cài ingress-nginx $INGRESS_NGINX_VERSION (manifest baremetal, NodePort 30080/30443, controller trên cka-cp)"
vm "$cp" "set -e; mkdir -p ~/drills/s29; cd ~/drills/s29
  if ! grep -q 'controller:v1.15.1@' ingress-nginx.yaml 2>/dev/null; then
    curl -fsSL --retry 3 --max-time 60 -o ingress-nginx.yaml.tmp '$url'; mv ingress-nginx.yaml.tmp ingress-nginx.yaml
  fi
  python3 /tmp/lab-s29-patch.py ingress-nginx.yaml; rm -f /tmp/lab-s29-patch.py
  grep -E 'image:|nodePort:' ingress-nginx.yaml
  kubectl apply -f ingress-nginx.yaml >/dev/null
  kubectl -n ingress-nginx rollout status deploy/ingress-nginx-controller --timeout=600s >/dev/null
  kubectl -n ingress-nginx wait --for=condition=complete job/ingress-nginx-admission-create --timeout=300s >/dev/null 2>&1 || true
  kubectl -n ingress-nginx get pod,svc -o wide
  kubectl get ingressclass"

echo "s29: shop.local trong /etc/hosts của cka-cp (IP của chính cka-cp)"
vm "$cp" "set -e
  ip=\$(kubectl get node $cp -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}')
  sudo sed -i '/[[:space:]]shop\\.local\$/d' /etc/hosts
  echo \"\$ip shop.local\" | sudo tee -a /etc/hosts >/dev/null
  getent hosts shop.local"

echo "s29: chứng chỉ tự ký cho shop.local và Secret tls shop-tls"
vm "$cp" "set -e; cd ~/drills/s29
  if ! openssl x509 -in tls.crt -noout -ext subjectAltName 2>/dev/null | grep -q 'DNS:shop.local' || ! openssl x509 -in tls.crt -noout -checkend 86400 >/dev/null 2>&1; then
    openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout tls.key -out tls.crt -subj '/CN=shop.local' -addext 'subjectAltName=DNS:shop.local' 2>/dev/null
  fi
  openssl x509 -in tls.crt -noout -subject -ext subjectAltName -enddate
  kubectl -n shop create secret tls shop-tls --cert=tls.crt --key=tls.key --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  kubectl -n shop get secret shop-tls"

echo "s29: Ingress nháp shop-noclass (không ingressClassName): không controller nào nhận"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s29-noclass.yaml ~/drills/s29/noclass.yaml; rm -f /tmp/lab-s29-noclass.yaml
  # Webhook của controller có thể chưa nhận kết nối ngay sau rollout: thử lại tới 60 giây.
  for i in \$(seq 1 30); do kubectl apply -f ~/drills/s29/noclass.yaml >/dev/null 2>&1 && break; sleep 2; done
  kubectl -n shop get ingress shop-noclass >/dev/null
  sleep 15
  kubectl -n shop get ingress shop-noclass
  addr=\$(kubectl -n shop get ingress shop-noclass -o jsonpath='{.status.loadBalancer.ingress}')
  code=\$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' -H 'Host: noclass.shop.local' http://shop.local:30080/api/products)
  echo \"shop-noclass: ADDRESS='\$addr', curl -H 'Host: noclass.shop.local' → \$code\"
  kubectl -n shop delete ingress shop-noclass >/dev/null
  [ -z \"\$addr\" ] && [ \"\$code\" = 404 ]"

echo "s29: ~/shop/ingress.yaml (Ingress shop: /api Prefix → gateway, /orders Exact → order, tls shop-tls)"
vm "$cp" "set -e
  kubectl -n shop create ingress shop --class=nginx --rule='shop.local/api*=gateway:8080,tls=shop-tls' --rule='shop.local/orders=order:8080' \
    --annotation=nginx.ingress.kubernetes.io/ssl-redirect=false --dry-run=client -o yaml
  install -m 644 /tmp/lab-s29-ingress.yaml ~/shop/ingress.yaml; rm -f /tmp/lab-s29-ingress.yaml
  for i in \$(seq 1 30); do kubectl apply -f ~/shop/ingress.yaml >/dev/null 2>&1 && break; sleep 2; done
  kubectl apply -f ~/shop/ingress.yaml >/dev/null
  for i in \$(seq 1 60); do
    [ -n \"\$(kubectl -n shop get ingress shop -o jsonpath='{.status.loadBalancer.ingress}')\" ] &&
      curl -sf --max-time 5 http://shop.local:30080/api/products | grep -q '\"id\":3' && break
    sleep 3
  done
  kubectl -n shop get ingress shop
  for p in /api/products /orders /orders/1 /api; do
    printf '%-14s http %s  https %s\n' \"\$p\" \"\$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://shop.local:30080\$p)\" \
      \"\$(curl -s --max-time 5 --cacert ~/drills/s29/tls.crt -o /dev/null -w '%{http_code}' https://shop.local:30443\$p)\"
  done
  code=\$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://shop.local:30080/orders/1)
  [ \"\$code\" = 404 ]
  printf 'PATH_EXACT_RESULT=%s\n' \"\$code\" > ~/drills/s29/answers.env
  cat ~/drills/s29/answers.env"

ip="$(vm "$cp" "kubectl get node cka-w1 -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}'")"
echo "s29: từ máy Mac: curl --resolve shop.local:30080:$ip http://shop.local:30080/api/products"
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf --noproxy '*' --max-time 5 --resolve "shop.local:30080:$ip" http://shop.local:30080/api/products | grep -q '"id":3' && { echo "s29: Ingress trả 3 sản phẩm"; exit 0; }
  sleep 3
done
echo "s29: http://shop.local:30080/api/products (qua $ip) không trả 3 sản phẩm" >&2; exit 1
