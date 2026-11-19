# s34 — lời giải chuẩn: ghép ~/dev.kubeconfig (namespace shop) và ~/ops.kubeconfig (namespace default) bằng `kubectl config
# set-cluster/set-credentials/set-context --embed-certs --kubeconfig`, server lấy từ ~/.kube/config, cert/key của s33; `use-context`
# trong chính tệp đó, chmod 600; thử `get pods` (Forbidden) và `auth whoami`; tình huống hỏng: bản không --embed-certs chép sang
# cka-w1 (scp, khoá ssh của s01); đọc stranger.kubeconfig và ghi đáp án. ~/.kube/config không bị ghi. Mỗi tệp ghép mới vào tệp tạm rồi `mv`, nên
# chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/stranger.kubeconfig" "$cp" /tmp/lab-s34-stranger.kubeconfig

echo "s34: ghép ~/dev.kubeconfig và ~/ops.kubeconfig"
vm "$cp" "set -e; mkdir -p ~/drills/s34
  [ -f ~/drills/s34/stranger.kubeconfig ] || install -m 600 /tmp/lab-s34-stranger.kubeconfig ~/drills/s34/stranger.kubeconfig
  rm -f /tmp/lab-s34-stranger.kubeconfig
  before=\$(sha256sum < ~/.kube/config)
  server=\$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
  for pair in dev:shop ops:default; do
    u=\${pair%%:*}; ns=\${pair#*:}; f=~/\$u.kubeconfig.new
    rm -f \$f
    kubectl config set-cluster kubernetes --server=\$server --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig \$f >/dev/null
    kubectl config set-credentials \$u --client-certificate=\$HOME/users/\$u.crt --client-key=\$HOME/users/\$u.key --embed-certs --kubeconfig \$f >/dev/null
    kubectl config set-context \$u@kubernetes --cluster=kubernetes --user=\$u --namespace=\$ns --kubeconfig \$f >/dev/null
    kubectl config use-context \$u@kubernetes --kubeconfig \$f >/dev/null
    chmod 600 \$f; mv \$f ~/\$u.kubeconfig
    kubectl --kubeconfig ~/\$u.kubeconfig config get-contexts
    kubectl --kubeconfig ~/\$u.kubeconfig auth whoami
    if kubectl --kubeconfig ~/\$u.kubeconfig --request-timeout=10s get pods 2>/tmp/lab-s34.err; then
      echo \"\$u: get pods chạy được, chưa đúng đầu ra s34\" >&2; exit 1
    fi
    cat /tmp/lab-s34.err; grep -q \"User \\\"\$u\\\"\" /tmp/lab-s34.err; rm -f /tmp/lab-s34.err
  done
  ls -l ~/dev.kubeconfig ~/ops.kubeconfig
  [ \"\$(sha256sum < ~/.kube/config)\" = \"\$before\" ] && echo '~/.kube/config không đổi'"

echo "s34: tình huống hỏng: không --embed-certs rồi chép tệp sang cka-w1"
vm "$cp" "set -e; cd ~/drills/s34; rm -f noembed.kubeconfig
  kubectl config set-cluster kubernetes --server=\$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}') --certificate-authority=/etc/kubernetes/pki/ca.crt --kubeconfig noembed.kubeconfig >/dev/null
  kubectl config set-credentials dev --client-certificate=../../users/dev.crt --client-key=../../users/dev.key --kubeconfig noembed.kubeconfig >/dev/null
  kubectl config set-context dev --cluster=kubernetes --user=dev --namespace=shop --kubeconfig noembed.kubeconfig >/dev/null
  kubectl config use-context dev --kubeconfig noembed.kubeconfig >/dev/null
  grep -E 'certificate-authority|client-(certificate|key)' noembed.kubeconfig
  kubectl --kubeconfig noembed.kubeconfig --request-timeout=10s auth whoami | sed -n 2p
  scp -q -o BatchMode=yes -o ConnectTimeout=10 noembed.kubeconfig cka-w1:/tmp/lab-s34-noembed.kubeconfig
  ssh -o BatchMode=yes -o ConnectTimeout=10 cka-w1 'kubectl --kubeconfig /tmp/lab-s34-noembed.kubeconfig --request-timeout=10s get pods 2>&1 | head -2; rm -f /tmp/lab-s34-noembed.kubeconfig' || true"

echo "s34: đọc stranger.kubeconfig"
vm "$cp" "set -e; f=~/drills/s34/stranger.kubeconfig
  kubectl config get-contexts --kubeconfig \$f
  kubectl config view --minify --kubeconfig \$f
  printf 'STRANGER_SERVER=%s\nSTRANGER_USER=%s\nSTRANGER_NS=%s\n' \
    \"\$(kubectl config view --minify --kubeconfig \$f -o jsonpath='{.clusters[0].cluster.server}')\" \
    \"\$(kubectl config view --minify --kubeconfig \$f -o jsonpath='{.contexts[0].context.user}')\" \
    \"\$(kubectl config view --minify --kubeconfig \$f -o jsonpath='{.contexts[0].context.namespace}')\" > ~/drills/s34/answers.env
  cat ~/drills/s34/answers.env"
