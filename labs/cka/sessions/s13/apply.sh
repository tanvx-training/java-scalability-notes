# s13 — lời giải chuẩn: ~/shop/{gateway,catalog,order}.yaml thêm startupProbe/livenessProbe (/actuator/health/liveness),
# readinessProbe (/actuator/health/readiness), preStop sleep 10 và terminationGracePeriodSeconds 45; gateway thêm
# initContainer wait-catalog (busybox chờ readiness của catalog); apply. Thí nghiệm trên Deployment nháp probe-lab:
# readiness sai → Pod bị rút khỏi EndpointSlice, không restart; liveness sai → kubelet restart container; xoá probe-lab;
# ghi ~/drills/s13/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in gateway.yaml catalog.yaml order.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s13-$f"
done
vm "$cp" "set -e
  mkdir -p ~/shop ~/drills/s13
  for f in gateway.yaml catalog.yaml order.yaml; do install -m 644 /tmp/lab-s13-\$f ~/shop/\$f; rm -f /tmp/lab-s13-\$f; done
  # catalog trước: initContainer của gateway chờ catalog sẵn sàng.
  for d in catalog order gateway; do kubectl apply -f ~/shop/\$d.yaml >/dev/null; done
  for d in catalog order gateway; do kubectl -n shop rollout status deploy/\$d --timeout=300s >/dev/null; done"

# Thí nghiệm: một Deployment nháp + Service cùng tên. Bước 1 chỉ có readiness, trỏ sai path; bước 2 readiness đúng,
# liveness trỏ sai path. Không dùng liveness ở bước 1: khi cluster bận, Spring có thể khởi động lâu hơn initialDelay của
# liveness (đo trên lab: load 13 trên cka-cp) và kubelet giết container vì lý do khác với điều đang thử.
lab_yaml() {  # $1 = path của readiness, $2 = path của liveness (rỗng: không có livenessProbe)
  live=""
  [ -n "$2" ] && live="
        livenessProbe: {httpGet: {path: $2, port: 8080}, initialDelaySeconds: 60, periodSeconds: 5, failureThreshold: 2}"
  cat <<YAML
apiVersion: apps/v1
kind: Deployment
metadata: {name: probe-lab, namespace: shop, labels: {app: probe-lab}}
spec:
  replicas: 1
  selector: {matchLabels: {app: probe-lab}}
  template:
    metadata: {labels: {app: probe-lab}}
    spec:
      terminationGracePeriodSeconds: 5
      containers:
      - name: catalog
        image: shop/catalog:1.0
        ports: [{containerPort: 8080}]
        readinessProbe: {httpGet: {path: $1, port: 8080}, periodSeconds: 5, failureThreshold: 2}$live
---
apiVersion: v1
kind: Service
metadata: {name: probe-lab, namespace: shop}
spec:
  selector: {app: probe-lab}
  ports: [{port: 8080, targetPort: 8080}]
YAML
}
echo "s13: thí nghiệm probe-lab (khoảng hai phút)"
lab_yaml /actuator/health/khong-co '' > "${TMPDIR:-/tmp}/lab-s13-probe-lab.yaml"
vm_put "${TMPDIR:-/tmp}/lab-s13-probe-lab.yaml" "$cp" /tmp/lab-s13-probe-lab-1.yaml
lab_yaml /actuator/health/readiness /actuator/health/khong-co > "${TMPDIR:-/tmp}/lab-s13-probe-lab.yaml"
vm_put "${TMPDIR:-/tmp}/lab-s13-probe-lab.yaml" "$cp" /tmp/lab-s13-probe-lab-2.yaml
rm -f "${TMPDIR:-/tmp}/lab-s13-probe-lab.yaml"
res="$(vm "$cp" "set -e
  kubectl -n shop delete deploy,svc probe-lab --ignore-not-found --wait=true >/dev/null
  kubectl apply -f /tmp/lab-s13-probe-lab-1.yaml >/dev/null
  pod() { kubectl -n shop get pod -l app=probe-lab -o jsonpath=\"\$1\" 2>/dev/null; }
  # Readiness sai: container chạy (Spring đã lên) nhưng không bao giờ Ready, EndpointSlice có địa chỉ ready=false.
  for i in \$(seq 1 60); do
    [ \"\$(pod '{.items[0].status.containerStatuses[0].started}')\" = true ] && break; sleep 2; done
  sleep 30
  rr=\$(pod '{.items[0].status.containerStatuses[0].restartCount}')
  ready=\$(pod '{.items[0].status.containerStatuses[0].ready}')
  eps=\$(kubectl -n shop get endpointslices -l kubernetes.io/service-name=probe-lab -o jsonpath='{range .items[*].endpoints[*]}{.conditions.ready}{\" \"}{end}')
  # Liveness sai: sau initialDelay 60 giây + 2 lần hỏng, kubelet giết container và tạo lại.
  kubectl apply -f /tmp/lab-s13-probe-lab-2.yaml >/dev/null
  kubectl -n shop rollout status deploy/probe-lab --timeout=180s >/dev/null 2>&1 || true
  lr=0; for i in \$(seq 1 120); do
    lr=\$(pod '{.items[0].status.containerStatuses[0].restartCount}'); [ \"\${lr:-0}\" -ge 1 ] && break; sleep 2; done
  code=\$(pod '{.items[0].status.containerStatuses[0].lastState.terminated.exitCode}')
  kubectl -n shop delete deploy,svc probe-lab --ignore-not-found --wait=true >/dev/null
  rm -f /tmp/lab-s13-probe-lab-1.yaml /tmp/lab-s13-probe-lab-2.yaml
  echo \"\$rr|\$ready|\$eps|\$lr|\$code\"")"
echo "s13: probe-lab readiness sai → restart|ready|EndpointSlice: ${res%|*|*}; liveness sai → restart|exitCode: ${res#*|*|*|}"
rr="${res%%|*}"; lr="$(printf '%s' "$res" | cut -d'|' -f4)"
[ "$rr" = 0 ] || { echo "s13: readiness sai mà container bị restart ($rr)" >&2; exit 1; }
[ "${lr:-0}" -ge 1 ] || { echo "s13: liveness sai mà container chưa bị restart" >&2; exit 1; }
code="${res##*|}"
[ "$code" = 143 ] || { echo "s13: container bị liveness giết thoát với mã '$code' (đo trên lab: 143)" >&2; exit 1; }
# periodSeconds mặc định: đọc bằng k explain pod.spec.containers.livenessProbe.periodSeconds ("Default to 10 seconds").
period="$(vm "$cp" "kubectl explain pod.spec.containers.livenessProbe.periodSeconds | grep -o 'Default to [0-9]*' | grep -o '[0-9]*'")"
vm "$cp" "printf 'READINESS_RESTARTS=0\nLIVENESS_RESTARTS_GE1=yes\nLIVENESS_EXIT_CODE=%s\nPROBE_PERIOD_DEFAULT=%s\n' '$code' '$period' > ~/drills/s13/answers.env"
