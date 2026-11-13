# s08 — lời giải chuẩn: ~/drills/s08/answers.env trên cka-cp (giá trị đọc từ chính cluster), static pod web-static
# trên cka-w1, kubectl completion cho cả alias k trong ~/.bashrc. Chạy lại nhiều lần được.
# Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
w1=""
for v in $LAB_VMS; do [ "$v" = "$cp" ] || { w1="$v"; break; }; done
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")")"
printf '%s\n' "$facts" | grep -q '^APISERVER_CERT_EXPIRY=[0-9]' || { echo "s08: không đọc được giá trị cluster: $facts" >&2; exit 1; }
vm "$cp" "mkdir -p ~/drills/s08 && cat > ~/drills/s08/answers.env <<'EOF2'
$facts
EOF2"
vm "$w1" "sudo install -d -m 755 /etc/kubernetes/manifests"
vm_put "$SESSION_DIR/files/web-static.yaml" "$w1" /tmp/web-static.yaml
vm "$w1" "sudo install -m 644 /tmp/web-static.yaml /etc/kubernetes/manifests/web-static.yaml && rm -f /tmp/web-static.yaml"
vm "$cp" "grep -qxF 'source <(kubectl completion bash)' ~/.bashrc || echo 'source <(kubectl completion bash)' >> ~/.bashrc
grep -qxF 'complete -o default -F __start_kubectl k' ~/.bashrc || echo 'complete -o default -F __start_kubectl k' >> ~/.bashrc"
echo "s08: chờ Pod web-static-$w1 Running"
vm "$cp" "for i in \$(seq 1 90); do
  [ \"\$(kubectl get pod web-static-$w1 -o jsonpath='{.status.phase}' 2>/dev/null)\" = Running ] && exit 0; sleep 2
done; kubectl get pod web-static-$w1; exit 1"
