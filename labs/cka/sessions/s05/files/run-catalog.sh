#!/bin/bash
# Chạy trong VM bằng root: chạy shop/catalog:1.0 bằng ctr (mạng host, giới hạn 768 MiB) và chờ health UP.
set -euo pipefail
ns="ctr -n k8s.io"
if $ns task ls | awk 'NR>1 && $1=="catalog" && $3=="RUNNING"' | grep -q .; then
  echo "catalog đang chạy"
else
  # dọn task/container cũ (vd. sau reboot container còn nhưng task đã mất)
  $ns task kill -s SIGKILL catalog >/dev/null 2>&1 || true
  sleep 1
  $ns task rm -f catalog >/dev/null 2>&1 || true
  $ns container rm catalog >/dev/null 2>&1 || true
  $ns run -d --net-host --memory-limit 805306368 docker.io/shop/catalog:1.0 catalog
fi
for i in $(seq 1 120); do
  curl -sf localhost:8080/actuator/health | grep -q '"UP"' && exit 0
  sleep 1
done
echo "catalog chưa trả UP sau 120 giây" >&2
exit 1
