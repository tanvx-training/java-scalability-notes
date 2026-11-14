# s14 — lời giải chuẩn: gateway lên 2 replica với RollingUpdate maxUnavailable 0 / maxSurge 1 (vẫn 1.0); một vòng curl
# trên cka-cp ghi mã HTTP của /api/info vào ~/drills/s14/curl.log trong lúc set image lên 2.0 (change-cause "lên 2.0");
# rollout image hỏng shop/gateway:2.1 rồi rollout undo --to-revision về revision 1.0; roll lại lên 2.0; ~/shop/gateway.yaml
# khớp trạng thái cuối; ghi ~/drills/s14/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/gateway.yaml" "$cp" /tmp/lab-s14-gateway.yaml
# Hàm dùng chung trong VM: rev <image> = revision của ReplicaSet gateway mang image đó (rỗng nếu không có).
fns="g() { kubectl -n shop get deploy gateway -o jsonpath=\"\$1\"; }
  rev() { kubectl -n shop get rs -l app=gateway -o jsonpath=\"{range .items[?(@.spec.template.spec.containers[0].image==\\\"\$1\\\")]}{.metadata.annotations.deployment\\.kubernetes\\.io/revision}{'\\n'}{end}\" | sort -n | tail -n1; }
  cause() { kubectl -n shop annotate deploy/gateway kubernetes.io/change-cause=\"\$1\" --overwrite >/dev/null; }"

# 1. Hai replica và chiến lược rolling update, vẫn image hiện tại (1.0 nếu đây là lần đầu).
vm "$cp" "set -e; $fns
  mkdir -p ~/drills/s14
  img=\$(g '{.spec.template.spec.containers[0].image}')
  kubectl -n shop patch deploy gateway --type merge -p '{\"spec\":{\"replicas\":2,\"strategy\":{\"type\":\"RollingUpdate\",\"rollingUpdate\":{\"maxUnavailable\":0,\"maxSurge\":1}}}}' >/dev/null
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  # Lần chạy lại (đã ở 2.0): về 1.0 trước để vòng curl đo một rollout thật.
  if [ \"\$img\" != shop/gateway:1.0 ]; then
    kubectl -n shop set image deploy/gateway gateway=shop/gateway:1.0 >/dev/null; cause 'về 1.0 (chạy lại apply s14)'
    kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  fi
  [ -n \"\$(g '{.metadata.annotations.kubernetes\\.io/change-cause}')\" ] || cause 'probe + graceful shutdown (s13)'"

# 2. Vòng curl tới ClusterIP của gateway, 5 lần mỗi giây, trong lúc set image lên 2.0.
echo "s14: rollout gateway 1.0 → 2.0 trong khi vòng curl chạy"
vm "$cp" "set -e; $fns
  ip=\$(kubectl -n shop get svc gateway -o jsonpath='{.spec.clusterIP}')
  : > ~/drills/s14/curl.log
  nohup bash -c \"while :; do curl -s -o /dev/null -m 2 -w '%{http_code}\\n' http://\$ip:8080/api/info >> \$HOME/drills/s14/curl.log; sleep 0.2; done\" >/dev/null 2>&1 &
  echo \$! > /tmp/lab-s14-curl.pid
  sleep 3
  kubectl -n shop set image deploy/gateway gateway=shop/gateway:2.0 >/dev/null; cause 'lên 2.0'
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  sleep 15   # Pod cũ còn trong preStop + graceful shutdown: đo tới khi chúng dừng hẳn
  kill \$(cat /tmp/lab-s14-curl.pid); rm -f /tmp/lab-s14-curl.pid"
res="$(vm "$cp" "echo \"\$(grep -c . ~/drills/s14/curl.log) \$(grep -vc '^200\$' ~/drills/s14/curl.log)\"")"
echo "s14: curl.log $res (số dòng, số dòng khác 200)"
[ "${res##* }" = 0 ] || { echo "s14: vòng curl có request lỗi: $(vm "$cp" "sort ~/drills/s14/curl.log | uniq -c")" >&2; exit 1; }

# 3. Image hỏng: Pod mới ImagePullBackOff, maxUnavailable 0 giữ hai Pod 2.0 phục vụ; quay về revision 1.0 rồi lên lại 2.0.
echo "s14: rollout image hỏng, undo --to-revision, lên lại 2.0"
vm "$cp" "set -e; $fns
  kubectl -n shop set image deploy/gateway gateway=shop/gateway:2.1 >/dev/null; cause 'thử 2.1'
  kubectl -n shop rollout status deploy/gateway --timeout=40s >/dev/null 2>&1 && { echo 'image 2.1 không được rollout xong' >&2; exit 1; }
  r1=\$(rev shop/gateway:1.0); [ -n \"\$r1\" ]
  kubectl -n shop rollout undo deploy/gateway --to-revision=\$r1 >/dev/null; cause \"undo về revision \$r1 (1.0)\"
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  kubectl -n shop set image deploy/gateway gateway=shop/gateway:2.0 >/dev/null; cause 'lên lại 2.0 sau khi 2.1 hỏng'
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  install -m 644 /tmp/lab-s14-gateway.yaml ~/shop/gateway.yaml; rm -f /tmp/lab-s14-gateway.yaml
  kubectl apply -f ~/shop/gateway.yaml >/dev/null
  kubectl -n shop rollout status deploy/gateway --timeout=300s >/dev/null
  printf 'BROKEN_REVISION=%s\n' \"\$(rev shop/gateway:2.1)\" > ~/drills/s14/answers.env"
echo "s14: chờ gateway trả version 2.0"
vm "$cp" "for i in \$(seq 1 60); do
  kubectl get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info 2>/dev/null | grep -q '\"version\":\"2.0\"' && exit 0; sleep 2
done; exit 1"
