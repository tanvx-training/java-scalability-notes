# s50 — lời giải, phần kubeconfig của ops, trên cka-cp (user ubuntu; kubectl, openssl), gọi hai lần bởi apply.sh:
#   STEP=read   kubectl --kubeconfig ~/ops.kubeconfig báo Unauthorized; lý do trong log của apiserver (x509 … expired); tách
#               cert khỏi kubeconfig (jsonpath + base64 -d + openssl x509 -enddate) so với `date -u`; tình huống hỏng (chỉ đọc):
#               `openssl verify -attime` cho thấy cert "hợp lệ" nếu đồng hồ lùi — đổi giờ không phải cách sửa.
#   (giữa hai bước, apply.sh chạy s33/files/issue.sh với u=ops: CSR mới bằng ~/users/ops.key, approve, cert vào ~/users/ops.crt)
#   STEP=embed  nhúng lại cert mới (`kubectl config set-credentials --embed-certs`), chmod 600, thử whoami, get nodes, create
#               (Forbidden), dev.kubeconfig và admin vẫn dùng được; thêm EXPIRED_KUBECONFIG vào answers.env, mục s50 của sổ tay.
set -e
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s50: $*"; }
die() { echo "s50: $*" >&2; exit 1; }
cert() { kubectl config view --raw --kubeconfig "$1" -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d; }
case "${STEP:-}" in
read)
  log "6. ~/ops.kubeconfig"
  k --kubeconfig ~/ops.kubeconfig get nodes 2>&1 | tail -n1 || true
  sleep 1
  echo "    log apiserver: $(k -n kube-system logs kube-apiserver-cka-cp --since=1m 2>/dev/null | grep -m1 'certificate has expired' | sed 's/.*err="\[//' | cut -c1-140)"
  log "7. cert trong kubeconfig: CN, issuer, hạn"
  for u in ops dev; do echo "    $u: $(cert ~/$u.kubeconfig | openssl x509 -noout -subject -issuer -enddate | tr '\n' ' ')"; done
  echo "    bây giờ: $(date -u '+%b %e %H:%M:%S %Y GMT')"
  d=$(mktemp -d); cert ~/ops.kubeconfig > "$d/ops.pem"
  echo "    openssl verify (bây giờ): $(openssl verify -CAfile /etc/kubernetes/pki/ca.crt "$d/ops.pem" 2>&1 | tail -n1)"
  echo "    tình huống hỏng, nếu đồng hồ lùi 10 ngày: $(openssl verify -CAfile /etc/kubernetes/pki/ca.crt -attime $(($(date +%s) - 10 * 86400)) "$d/ops.pem" 2>&1 | tail -n1)"
  rm -rf "$d"
  ;;
embed)
  log "8. nhúng cert mới vào ~/ops.kubeconfig"
  kubectl config set-credentials ops --client-certificate="$HOME/users/ops.crt" --client-key="$HOME/users/ops.key" --embed-certs \
    --kubeconfig ~/ops.kubeconfig >/dev/null
  chmod 600 ~/ops.kubeconfig
  cert ~/ops.kubeconfig | openssl x509 -noout -subject -enddate
  k --kubeconfig ~/ops.kubeconfig auth whoami
  k --kubeconfig ~/ops.kubeconfig get nodes
  if k --kubeconfig ~/ops.kubeconfig -n default create configmap s50-probe --from-literal=a=b --dry-run=server 2>/tmp/lab-s50.err; then
    die "ops tạo được ConfigMap: quyền quá rộng"
  fi
  cat /tmp/lab-s50.err; grep -q 'User "ops"' /tmp/lab-s50.err; rm -f /tmp/lab-s50.err
  log "9. dev và admin vẫn dùng được"
  k --kubeconfig ~/dev.kubeconfig auth whoami | sed -n 2p
  k auth whoami | sed -n 2p
  sed -i '/^EXPIRED_KUBECONFIG=/d' ~/drills/s50/answers.env
  echo "EXPIRED_KUBECONFIG=ops" >> ~/drills/s50/answers.env
  cat ~/drills/s50/answers.env
  grep -qi '^#.*s50' ~/notes/runbook.md 2>/dev/null || cat >> ~/notes/runbook.md <<'RB'

## s50 — apiserver ↔ etcd TLS, cert hết hạn trong kubeconfig
- Triệu chứng: kubectl lúc refused lúc timeout; `crictl logs` apiserver: `createTransport failed … x509: certificate signed by unknown authority` hay `remote error: tls: unknown certificate authority`; etcd vẫn healthy.
- Lệnh: `etcdctl endpoint status -w table` (ID, VERSION, IS LEADER); so `--etcd-cafile` (subject) với issuer của `pki/etcd/server.crt`, issuer của `--etcd-certfile` phải là etcd-ca.
- kubeconfig bị Unauthorized: lý do ở log apiserver (`x509: certificate has expired`); `k config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -enddate`.
- Sửa: cấp cert mới qua CSR (hay kubeadm kubeconfig user), `set-credentials --embed-certs`. Không chỉnh giờ hệ thống.
RB
  ;;
*) die "STEP phải là read hay embed" ;;
esac
