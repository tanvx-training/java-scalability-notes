# s31 — lời giải chuẩn: Pod tạm probe (busybox) ở namespace default gọi catalog trước khi chặn; ~/shop/netpol.yaml
# (files/netpol.yaml: default-deny, allow-dns-egress, rồi một policy cho mỗi nhóm Pod: gateway + gateway-v1, catalog, order,
# postgres, data plane shop-gw, Pod của Job) và apply; probe gọi lại catalog → bị chặn (DEFAULT_NS_TO_CATALOG); policy nháp
# allow-probe hai phần tử from (namespaceSelector, podSelector tách rời) → probe không nhãn vẫn vào được (DRAFT_TWO_PEERS),
# xoá nháp và probe; chờ data plane và Deployment sẵn sàng. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/netpol.yaml" "$cp" /tmp/lab-s31-netpol.yaml
vm_put "$SESSION_DIR/files/allow-probe.yaml" "$cp" /tmp/lab-s31-allow-probe.yaml

echo "s31: Pod tạm probe ở default; gọi catalog trước khi chặn"
vm "$cp" "set -e; mkdir -p ~/drills/s31
  install -m 644 /tmp/lab-s31-allow-probe.yaml ~/drills/s31/allow-probe.yaml; rm -f /tmp/lab-s31-allow-probe.yaml
  kubectl -n default get pod probe >/dev/null 2>&1 || kubectl -n default run probe --image=busybox:1.37 --restart=Never -- sleep 3600 >/dev/null
  kubectl -n default wait --for=condition=Ready pod/probe --timeout=180s >/dev/null
  kubectl -n default label pod probe role- >/dev/null 2>&1 || true
  w() { kubectl -n default exec probe -- wget -q -T 3 -O /dev/null http://catalog.shop.svc.cluster.local:8080/actuator/health/readiness >/dev/null 2>&1 && echo open || echo blocked; }
  echo \"probe → catalog: \$(w)\"
  install -m 644 /tmp/lab-s31-netpol.yaml ~/shop/netpol.yaml; rm -f /tmp/lab-s31-netpol.yaml
  kubectl apply -f ~/shop/netpol.yaml
  kubectl -n shop delete networkpolicy allow-probe --ignore-not-found >/dev/null
  kubectl -n shop get networkpolicy
  r=open; for i in \$(seq 1 10); do r=\$(w); [ \$r = blocked ] && break; sleep 2; done
  echo \"sau default-deny: probe → catalog: \$r\"; [ \$r = blocked ]
  kubectl apply -f ~/drills/s31/allow-probe.yaml >/dev/null
  d=blocked; for i in \$(seq 1 10); do d=\$(w); [ \$d = open ] && break; sleep 2; done
  echo \"allow-probe hai phần tử from: probe (không nhãn role) → catalog: \$d\"; [ \$d = open ]
  kubectl -n shop delete networkpolicy allow-probe >/dev/null
  kubectl -n default delete pod probe --wait=false >/dev/null
  printf 'DEFAULT_NS_TO_CATALOG=%s\nDRAFT_TWO_PEERS=%s\n' \"\$r\" \"\$d\" > ~/drills/s31/answers.env
  cat ~/drills/s31/answers.env"

echo "s31: chờ Deployment, data plane và postgres sẵn sàng dưới default-deny"
vm "$cp" "set -e
  for d in gateway gateway-v1 catalog order shop-gw-nginx; do kubectl -n shop rollout status deploy/\$d --timeout=300s >/dev/null; done
  kubectl -n shop rollout status sts/postgres --timeout=300s >/dev/null
  kubectl -n shop get deploy,sts"
