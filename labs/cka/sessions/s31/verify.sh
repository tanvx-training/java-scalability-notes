# s31 — kiểm (7 dòng): NetworkPolicy default-deny (Ingress + Egress, mọi Pod) và egress DNS tới CoreDNS (kube-system VÀ
# k8s-app=kube-dns, UDP+TCP 53), YAML trong ~/shop/; Pod busybox trong namespace tạm của verify (spec 8.4, xoá trước khi thoát)
# gọi catalog bị chặn; `kubectl exec` vào Pod thật: luồng của app mở, catalog→order và gateway→postgres chặn, order phân giải
# tên; dưới default-deny ba đường từ máy Mac (30180, Ingress 30080, Gateway 30280) trả 200, HPA catalog có số liệu, Deployment,
# postgres và hai controller sẵn sàng; đáp án, policy nháp đã xoá. Chỉ đọc trạng thái buổi học. Nạp bởi `lab` trên Mac (bash 3.2).
# Sau khi VM khởi động lại: chờ có giới hạn (420 giây như s30, cộng facts.sh: Pod tạm tối đa 90 giây, ~15 lần exec tối đa
# 10 giây; cộng bốn vòng curl tối đa 6 × 7 giây: in ra ~14 phút).
cp="$LAB_CP"
echo "  (chờ apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và NGF, nếu đang khởi động: tối đa ~14 phút)"
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
. "$SESSION_DIR/files/rows.sh"
assert_summary
