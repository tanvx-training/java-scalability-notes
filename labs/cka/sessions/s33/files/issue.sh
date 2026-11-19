# s33 — cấp cert cho một user qua CertificateSigningRequest (chạy trên cka-cp bằng user ubuntu; trước nội dung này apply.sh
# đặt u=<user> o=<group>). Chạy lại được: cert hiện có hợp lệ (CA cluster ký, subject đúng, khớp key, còn hạn ≥ 30 ngày) và đã
# có ~/users/<u>-csr.yaml thì giữ nguyên; nếu không thì dùng lại key (tạo nếu chưa có), tạo CSR mới, xoá CSR cũ cùng tên trong
# API rồi gửi, duyệt, chờ cert (tối đa 60 giây).
set -e
mkdir -p ~/users; cd ~/users
valid() {
  [ -s "$u.crt" ] && [ -s "$u.key" ] && [ -s "$u-csr.yaml" ] &&
    openssl verify -CAfile /etc/kubernetes/pki/ca.crt "$u.crt" >/dev/null 2>&1 &&
    [ "$(openssl x509 -in "$u.crt" -noout -subject -nameopt RFC2253)" = "subject=CN=$u,O=$o" ] &&
    [ "$(openssl x509 -in "$u.crt" -noout -pubkey)" = "$(openssl pkey -in "$u.key" -pubout)" ] &&
    openssl x509 -in "$u.crt" -noout -checkend $((30 * 86400)) >/dev/null &&
    # CSR trong API còn và mang đúng cert này; hay đã không còn và cert ký hơn 1 giờ trước (như verify: controller dọn CSR).
    { [ "$(kubectl --request-timeout=10s get csr "$u" -o jsonpath='{.status.certificate}' 2>/dev/null | base64 -d 2>/dev/null)" = "$(cat "$u.crt")" ] ||
      { ! kubectl --request-timeout=10s get csr "$u" >/dev/null 2>&1 &&
        [ $(( $(date +%s) - $(date -d "$(openssl x509 -in "$u.crt" -noout -startdate | cut -d= -f2)" +%s) )) -ge 3600 ]; }; }
}
if valid; then echo "$u: giữ cert hiện có ($(openssl x509 -in "$u.crt" -noout -enddate))"; exit 0; fi
[ -s "$u.key" ] || openssl genrsa -out "$u.key" 2048 2>/dev/null
chmod 600 "$u.key"
openssl req -new -key "$u.key" -subj "/CN=$u/O=$o" -out "$u.csr"
cat > "$u-csr.yaml" <<EOF
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: $u
spec:
  request: $(base64 -w0 "$u.csr")
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 31536000
  usages:
  - client auth
EOF
kubectl --request-timeout=10s delete csr "$u" --ignore-not-found >/dev/null
kubectl --request-timeout=10s apply -f "$u-csr.yaml"
kubectl --request-timeout=10s certificate approve "$u"
c=''; for i in $(seq 1 30); do
  c=$(kubectl --request-timeout=10s get csr "$u" -o jsonpath='{.status.certificate}' 2>/dev/null || true)
  [ -n "$c" ] && break; sleep 2
done
[ -n "$c" ] || { echo "CSR $u chưa có cert sau 60 giây" >&2; exit 1; }
printf '%s' "$c" | base64 -d > "$u.crt"
kubectl --request-timeout=10s get csr "$u"
openssl x509 -in "$u.crt" -noout -subject -issuer -startdate -enddate
