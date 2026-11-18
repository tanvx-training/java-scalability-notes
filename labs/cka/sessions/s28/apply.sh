# s28 — lời giải chuẩn: tra catalog ở ba dạng từ Pod tạm, đọc resolv.conf (search, ndots), dig thẳng ClusterIP kube-dns từ
# node; ~/shop/postgres-rw.yaml (ClusterIP thường, cùng selector với headless postgres); thêm khối hosts (db.shop.internal →
# ClusterIP postgres-rw, fallthrough) vào ConfigMap coredns bằng PyYAML/JSON (thay cho `k edit`), rollout restart CoreDNS, tra
# từ Pod order; Pod nháp dnspolicy-lab (dnsPolicy None + dnsConfig) và dns-default (dnsPolicy Default: không phân giải được tên
# Service) rồi xoá; ghi ~/drills/s28/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/postgres-rw.yaml" "$cp" /tmp/lab-s28-postgres-rw.yaml
vm_put "$SESSION_DIR/files/dnspolicy-lab.yaml" "$cp" /tmp/lab-s28-dnspolicy-lab.yaml

echo "s28: tra catalog ở ba dạng: nslookup của busybox (Pod tạm) và getent (resolver của hệ thống, trong Pod order)"
# nslookup của busybox tự gửi câu hỏi và hỏi nguyên tên có dấu chấm trước search domain: "catalog.shop" ra IP công cộng của
# TLD .shop (wildcard). getent đi qua resolver của libc, áp search và ndots như ứng dụng Java: cả ba dạng ra ClusterIP catalog.
vm "$cp" "set -e; mkdir -p ~/drills/s28
  kubectl -n shop delete pod dns-probe --ignore-not-found --now >/dev/null 2>&1
  kubectl -n shop run dns-probe --image=busybox:1.37 --restart=Never --command -- sleep 600 >/dev/null
  kubectl -n shop wait pod/dns-probe --for=condition=Ready --timeout=120s >/dev/null
  kubectl -n shop exec dns-probe -- sh -c \
    'for n in catalog catalog.shop catalog.shop.svc.cluster.local; do echo \"nslookup \$n:\"; nslookup \$n | sed -n \"s/^Name:[[:space:]]*/  /p;s/^Address: /  /p\"; done'
  conf=\$(kubectl -n shop exec dns-probe -- cat /etc/resolv.conf)
  kubectl -n shop delete pod dns-probe --now >/dev/null
  echo \"\$conf\"
  cip=\$(kubectl -n shop get svc catalog -o jsonpath='{.spec.clusterIP}')
  for n in catalog catalog.shop catalog.shop.svc.cluster.local; do
    got=\$(kubectl -n shop exec deploy/order -c order -- getent hosts \$n | awk '{print \$1}')
    echo \"getent hosts \$n (order): \$got\"; [ \"\$got\" = \"\$cip\" ]
  done
  printf '%s\n' \"\$conf\" | sed -n 's/.*ndots:\\([0-9]*\\).*/\\1/p' > ~/drills/s28/.ndots
  [ -s ~/drills/s28/.ndots ]"

echo "s28: dig thẳng ClusterIP của kube-dns từ node"
dns="$(vm "$cp" "kubectl -n kube-system get svc kube-dns -o jsonpath='{.spec.clusterIP}'")"
vm "$cp" "set -e
  dig @$dns catalog.shop.svc.cluster.local +short
  dig @$dns kubernetes.default.svc.cluster.local +short
  [ -n \"\$(dig @$dns catalog.shop.svc.cluster.local +short)\" ]
  kubectl -n kube-system get cm coredns -o jsonpath='{.data.Corefile}'"

echo "s28: Service postgres-rw (ClusterIP thường), khối hosts db.shop.internal trong Corefile, rollout restart CoreDNS"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s28-postgres-rw.yaml ~/shop/postgres-rw.yaml; rm -f /tmp/lab-s28-postgres-rw.yaml
  kubectl apply -f ~/shop/postgres-rw.yaml >/dev/null
  ip=\$(kubectl -n shop get svc postgres-rw -o jsonpath='{.spec.clusterIP}')
  for i in \$(seq 1 30); do
    kubectl -n shop get endpointslice -l kubernetes.io/service-name=postgres-rw -o jsonpath='{.items[*].endpoints[*].addresses[0]}' | grep -q . && break; sleep 1
  done
  kubectl -n kube-system get cm coredns -o json > /tmp/lab-s28-cm.json
python3 - \"\$ip\" <<'PY'
import json, re, sys
ip = sys.argv[1]
p = '/tmp/lab-s28-cm.json'
cm = json.load(open(p))
core = cm['data']['Corefile']
# Bỏ khối hosts cũ có db.shop.internal (chạy lại được), rồi chèn khối mới ngay trước plugin kubernetes.
core = re.sub(r'\n[ \t]*hosts\b[^{\n]*\{[^}]*db\.shop\.internal[^}]*\}[ \t]*', '', core)
block = '    hosts {\n       %s db.shop.internal\n       fallthrough\n    }\n' % ip
core, n = re.subn(r'^([ \t]*kubernetes\b)', lambda m: block + m.group(1), core, count=1, flags=re.M)
assert n == 1, 'không thấy plugin kubernetes trong Corefile'
cm['data']['Corefile'] = core
for k in ('resourceVersion', 'uid', 'creationTimestamp', 'managedFields'): cm['metadata'].pop(k, None)
json.dump(cm, open(p, 'w'))
PY
  kubectl replace -f /tmp/lab-s28-cm.json >/dev/null; rm -f /tmp/lab-s28-cm.json
  kubectl -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | sed -n '/hosts/,/}/p'
  kubectl -n kube-system rollout restart deploy/coredns >/dev/null
  kubectl -n kube-system rollout status deploy/coredns --timeout=300s >/dev/null
  for i in \$(seq 1 30); do
    got=\$(kubectl -n shop exec deploy/order -c order -- getent hosts db.shop.internal 2>/dev/null | awk '{print \$1}')
    [ \"\$got\" = \"\$ip\" ] && break; sleep 2
  done
  echo \"order: db.shop.internal → \$got (postgres-rw \$ip)\"
  [ \"\$got\" = \"\$ip\" ]
  kubectl -n shop exec deploy/order -c order -- getent hosts catalog.shop.svc.cluster.local"

echo "s28: Pod nháp dnspolicy-lab (dnsPolicy None + dnsConfig) và dns-default (dnsPolicy Default)"
vm "$cp" "set -e
  sed 's/10\\.96\\.0\\.10/$dns/' /tmp/lab-s28-dnspolicy-lab.yaml > ~/drills/s28/dnspolicy-lab.yaml; rm -f /tmp/lab-s28-dnspolicy-lab.yaml
  kubectl -n shop delete pod dnspolicy-lab dns-default --ignore-not-found --now >/dev/null 2>&1
  kubectl apply -f ~/drills/s28/dnspolicy-lab.yaml >/dev/null
  kubectl -n shop wait pod/dnspolicy-lab --for=condition=Ready --timeout=120s >/dev/null
  kubectl -n shop exec dnspolicy-lab -- cat /etc/resolv.conf
  kubectl -n shop exec dnspolicy-lab -- nslookup catalog | sed -n 's/^Name:[[:space:]]*//p'
  kubectl -n shop delete pod dnspolicy-lab --now >/dev/null
  kubectl -n shop run dns-default --image=busybox:1.37 --restart=Never --overrides='{\"spec\":{\"dnsPolicy\":\"Default\"}}' --command -- sleep 3600 >/dev/null
  kubectl -n shop wait pod/dns-default --for=condition=Ready --timeout=120s >/dev/null
  kubectl -n shop exec dns-default -- cat /etc/resolv.conf
  if kubectl -n shop exec dns-default -- nslookup catalog.shop.svc.cluster.local >/tmp/lab-s28-nx.txt 2>&1; then r=0; else r=1; fi
  cat /tmp/lab-s28-nx.txt; rm -f /tmp/lab-s28-nx.txt
  kubectl -n shop delete pod dns-default --now >/dev/null
  [ \"\$r\" = 1 ]
  printf 'NDOTS=%s\nKUBE_DNS_IP=%s\n' \"\$(cat ~/drills/s28/.ndots)\" '$dns' > ~/drills/s28/answers.env
  rm -f ~/drills/s28/.ndots; cat ~/drills/s28/answers.env"
