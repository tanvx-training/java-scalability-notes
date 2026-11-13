#!/bin/bash
# Chạy trên control plane bằng user có kubeconfig: tạo hai Pod busybox trong một namespace tạm, ghim vào hai node,
# Pod thứ nhất ping IP của Pod thứ hai, rồi xoá namespace. In dòng kết quả; mã thoát 0 khi ping qua.
# Cách dùng: bash pod-ping.sh <node A> <node B>
set -u
a="$1"; b="$2"
ns="lab-verify-$(date +%s)-$$"
trap 'kubectl delete namespace "$ns" --timeout=90s >/dev/null 2>&1' EXIT
kubectl create namespace "$ns" >/dev/null || exit 1
for n in "$a" "$b"; do
  kubectl -n "$ns" apply -f - >/dev/null <<YAML || exit 1
apiVersion: v1
kind: Pod
metadata:
  name: ping-$n
spec:
  nodeName: $n
  terminationGracePeriodSeconds: 0
  containers:
  - name: c
    image: busybox:1.37
    command: ["sleep", "3600"]
YAML
done
if ! kubectl -n "$ns" wait --for=condition=Ready pod --all --timeout=180s >/dev/null 2>&1; then
  echo "Pod thử chưa Ready: $(kubectl -n "$ns" get pods --no-headers 2>&1 | tr '\n' ';')"
  exit 1
fi
ipb="$(kubectl -n "$ns" get pod "ping-$b" -o jsonpath='{.status.podIP}')"
if kubectl -n "$ns" exec "ping-$a" -- ping -c 2 -W 2 "$ipb" >/dev/null 2>&1; then
  echo "ping-$a → ping-$b ($ipb) qua"
else
  echo "ping-$a không ping được ping-$b ($ipb)"
  exit 1
fi
