#!/bin/bash
# Chạy trên control plane bằng user có kubeconfig: Deployment 2 replica busybox, anti-affinity bắt buộc theo hostname,
# trong namespace tạm; đạt khi cả hai replica Ready và nằm đúng trên hai node đưa vào. Xoá namespace khi xong.
# Cách dùng: bash spread-test.sh <node 1> <node 2>
set -u
want="$(printf '%s\n' "$@" | sort | tr '\n' ' ')"
ns="lab-verify-$(date +%s)-$$"
trap 'kubectl delete namespace "$ns" --timeout=90s >/dev/null 2>&1' EXIT
kubectl create namespace "$ns" >/dev/null || exit 1
kubectl -n "$ns" apply -f - >/dev/null <<'YAML' || exit 1
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spread
spec:
  replicas: 2
  selector:
    matchLabels: {app: spread}
  template:
    metadata:
      labels: {app: spread}
    spec:
      terminationGracePeriodSeconds: 0
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels: {app: spread}
            topologyKey: kubernetes.io/hostname
      containers:
      - name: c
        image: busybox:1.37
        command: ["sleep", "3600"]
YAML
if ! kubectl -n "$ns" rollout status deployment/spread --timeout=180s >/dev/null 2>&1; then
  echo "Deployment chưa sẵn sàng: $(kubectl -n "$ns" get pods -o wide --no-headers 2>&1 | tr '\n' ';')"
  exit 1
fi
got="$(kubectl -n "$ns" get pods -l app=spread -o jsonpath='{range .items[*]}{.spec.nodeName}{"\n"}{end}' | sort | tr '\n' ' ')"
[ "$got" = "$want" ] || { echo "replica nằm trên: $got (cần: $want)"; exit 1; }
echo "2 replica trên: $got"
