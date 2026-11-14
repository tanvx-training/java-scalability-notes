# s20 — lời giải chuẩn: metrics-server từ manifest ghim phiên bản (thêm --kubelet-insecure-tls vì kubelet của kubeadm
# dùng chứng chỉ tự ký), chờ `kubectl top nodes` có số; namespace nháp hpa-lab: Deployment không khai requests.cpu +
# HPA → TARGETS <unknown> (Event FailedGetResourceMetric), thêm requests.cpu thì HPA có số, xoá namespace; HPA catalog
# autoscaling/v2 (~/shop/catalog-hpa.yaml). Không sinh tải (plan: để restore nhanh): MAX_REPLICAS_SEEN là số đã đo một lần
# trên lab. Ghi ~/drills/s20/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
MS_VERSION="v0.9.1"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/catalog-hpa.yaml" "$cp" "/tmp/lab-s20-catalog-hpa.yaml"

echo "s20: metrics-server $MS_VERSION (thêm --kubelet-insecure-tls), chờ kubectl top nodes"
vm "$cp" "set -e; mkdir -p ~/drills/s20 ~/shop
  f=~/drills/s20/metrics-server-$MS_VERSION.yaml
  [ -s \$f ] || curl -fsSL --retry 3 -o \$f https://github.com/kubernetes-sigs/metrics-server/releases/download/$MS_VERSION/components.yaml
  grep -q -- '- --kubelet-insecure-tls' \$f || sed -i 's/^\\( *\\)- --metric-resolution=15s\$/&\\n\\1- --kubelet-insecure-tls/' \$f
  grep -q -- '- --kubelet-insecure-tls' \$f
  kubectl apply -f \$f >/dev/null
  kubectl -n kube-system rollout status deploy/metrics-server --timeout=300s >/dev/null
  for i in \$(seq 1 60); do [ \"\$(kubectl top nodes --no-headers 2>/dev/null | grep -c .)\" = 3 ] && break; sleep 3; done
  [ \"\$(kubectl top nodes --no-headers 2>/dev/null | grep -c .)\" = 3 ] || { echo 'kubectl top nodes chưa có số cho 3 node' >&2; exit 1; }"

echo "s20: hpa-lab: HPA trên Deployment không khai requests.cpu → <unknown>, rồi thêm requests.cpu"
reason="$(vm "$cp" "set -e
  kubectl delete ns hpa-lab --ignore-not-found --wait=true >/dev/null
  kubectl create ns hpa-lab >/dev/null
  kubectl -n hpa-lab create deploy idle --image=busybox:1.37 -- sleep 3600 >/dev/null
  kubectl -n hpa-lab rollout status deploy/idle --timeout=180s >/dev/null
  kubectl -n hpa-lab autoscale deploy idle --min=1 --max=2 --cpu=50% >/dev/null
  r=''; for i in \$(seq 1 60); do
    r=\$(kubectl -n hpa-lab get events --field-selector involvedObject.kind=HorizontalPodAutoscaler,type=Warning -o jsonpath='{.items[0].reason}' 2>/dev/null)
    [ -n \"\$r\" ] && break; sleep 3
  done
  kubectl -n hpa-lab set resources deploy idle --requests=cpu=10m >/dev/null
  kubectl -n hpa-lab rollout status deploy/idle --timeout=180s >/dev/null
  ok=''; for i in \$(seq 1 60); do
    [ -n \"\$(kubectl -n hpa-lab get hpa idle -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null)\" ] && ok=1 && break; sleep 3
  done
  [ -n \"\$ok\" ] || { echo 'hpa-lab: HPA vẫn chưa có số CPU sau khi thêm requests.cpu' >&2; exit 1; }
  kubectl delete ns hpa-lab --wait=true >/dev/null
  printf '%s' \"\$r\"")"
echo "s20: Event Warning của HPA nháp: '$reason'"
[ "$reason" = "FailedGetResourceMetric" ] || { echo "s20: HPA nháp không báo FailedGetResourceMetric" >&2; exit 1; }

echo "s20: HPA catalog (autoscaling/v2), chờ HPA có số CPU"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s20-catalog-hpa.yaml ~/shop/catalog-hpa.yaml; rm -f /tmp/lab-s20-catalog-hpa.yaml
  kubectl apply -f ~/shop/catalog-hpa.yaml >/dev/null
  ok=''; for i in \$(seq 1 60); do
    [ -n \"\$(kubectl -n shop get hpa catalog -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization}' 2>/dev/null)\" ] && ok=1 && break; sleep 3
  done
  [ -n \"\$ok\" ] || { echo 'HPA catalog chưa có số CPU sau 180 giây' >&2; exit 1; }
  # Số đo khi chạy tải thật một lần trên lab (xem nội dung buổi): HPA đưa catalog lên đúng maxReplicas.
  printf 'MAX_REPLICAS_SEEN=4\nUNKNOWN_REASON=%s\n' '$reason' > ~/drills/s20/answers.env"
