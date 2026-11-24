# s50 — lời giải chuẩn: gây sự cố st9-etcd như `begin` (setup.sh: xoá answers.env, lab_break st9-etcd), rồi trên cka-cp:
# files/solve-api.sh (crictl logs thấy lỗi TLS tới etcd, etcd vẫn khoẻ, ba cờ --etcd-* so với pki/, sao lưu rồi sửa, /readyz),
# files/solve-ops.sh STEP=read (Unauthorized, log apiserver, notAfter của cert nhúng), cert mới cho ops qua CSR như s33
# (s33/files/issue.sh với u=ops: dùng lại ~/users/ops.key), files/solve-ops.sh STEP=embed (nhúng lại, thử quyền, answers.env,
# mục s50 của sổ tay), rồi chờ shop như s26. Chạy lại nhiều lần được. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
. "$SESSION_DIR/setup.sh"
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/solve-api.sh")"
vm "$LAB_CP" "STEP=read
$(cat "$SESSION_DIR/files/solve-ops.sh")"
echo "s50: cert mới cho ops qua CertificateSigningRequest (như s33)"
vm "$LAB_CP" "u=ops; o=shop-ops
$(cat "$SESSION_DIR/../s33/files/issue.sh")"
vm "$LAB_CP" "STEP=embed
$(cat "$SESSION_DIR/files/solve-ops.sh")"
vm "$LAB_CP" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
