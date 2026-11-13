#!/bin/bash
# Ghi một dòng ra stdout mỗi 10 giây; systemd chuyển stdout của service vào journal.
while true; do
  echo "shop heartbeat từ $(hostname) lúc $(date '+%H:%M:%S')"
  sleep 10
done
