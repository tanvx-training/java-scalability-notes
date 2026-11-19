# s33 — lời giải chuẩn: đọc cert apiserver bằng openssl (issuer, SAN, hạn) và `kubeadm certs check-expiration`, ghi đáp án;
# cấp cert cho dev (O=shop-dev) và ops (O=shop-ops) qua CertificateSigningRequest (files/issue.sh: key, CSR openssl, YAML trong
# ~/users/, approve, lấy cert bằng jsonpath + base64 -d); tình huống hỏng: CSR nháp dev-draft sai signerName được duyệt mà không
# ai cấp cert, rồi xoá. Chạy lại nhiều lần được (cert hợp lệ thì giữ, không gửi CSR trùng). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl --request-timeout=5s get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"

echo "s33: cert của apiserver và hạn các cert kubeadm"
vm "$cp" "set -e; mkdir -p ~/drills/s33 ~/users
  openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -issuer -subject -enddate -ext subjectAltName
  sudo kubeadm certs check-expiration | grep -v '^\[check-expiration\]'
  sans=\$(openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -ext subjectAltName | tail -n +2 |
    sed -e 's/IP Address://g' -e 's/DNS://g' | tr -d ' ')
  printf 'APISERVER_SANS=%s\nCERT_GROUP_FIELD=O\n' \"\$sans\" > ~/drills/s33/answers.env"

echo "s33: cert cho dev và ops qua CertificateSigningRequest"
vm "$cp" "u=dev; o=shop-dev
$(cat "$SESSION_DIR/files/issue.sh")"
vm "$cp" "u=ops; o=shop-ops
$(cat "$SESSION_DIR/files/issue.sh")"

echo "s33: tình huống hỏng: CSR dev-draft sai signerName"
vm "$cp" "set -e; cd ~/drills/s33
  sed -e 's/name: dev\$/name: dev-draft/' -e 's#signerName: kubernetes.io/kube-apiserver-client#signerName: example.com/shop-client#' \
    ~/users/dev-csr.yaml > dev-draft.yaml
  kubectl delete csr dev-draft --ignore-not-found >/dev/null
  kubectl apply -f dev-draft.yaml >/dev/null
  kubectl certificate approve dev-draft >/dev/null
  sleep 5
  kubectl get csr dev-draft
  echo \"certificate: '\$(kubectl get csr dev-draft -o jsonpath='{.status.certificate}')'\"
  kubectl delete csr dev-draft >/dev/null
  cat ~/drills/s33/answers.env"
