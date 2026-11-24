# s46 — kiểm đầu vào (thay verify.sh của s45): phần của cuối s45 mà sự cố st9-app không phá. verify s45 đòi Mac :30180 trả
# 200, mà gateway restart lặp trong sự cố, nên `begin cka s46` lần hai (giữa buổi) sẽ đỏ ở đó. Ở đây: gói 1.37 và hold trên
# ba node (như verify s45, s42/files/node-facts.sh); ba node Ready và control plane khoẻ, etcd từ /var/lib/etcd-restore
# (CORE_NODES, CORE_CP của files/core-facts.sh); dữ liệu như cuối s44 và etcd không lùi (files/check-facts.sh); answers.env
# của s45 (s45/files/facts.sh với FAST=1). Không kiểm shop (sự cố sửa nó). Chỉ đọc. Nạp bởi `lab` (bash 3.2).
# Chờ apiserver /readyz tối đa 180 giây (VM vừa bật), cộng node-facts trên ba node (~10 giây mỗi node), core-facts và
# check-facts (mỗi lệnh tối đa 10–30 giây): chậm nhất ~6 phút, in ra đúng con số đó.
cp="$LAB_CP"
echo "  (chờ apiserver nếu đang khởi động: tối đa ~6 phút)"
vm "$cp" 'end=$(($(date +%s) + 180)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ $(date +%s) -ge $end ]; do sleep 2; done' >/dev/null 2>&1 || true
facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/core-facts.sh")" 2>/dev/null)
$(vm "$cp" "$(cat "$SESSION_DIR/files/check-facts.sh")" 2>/dev/null)
$(vm "$cp" "FAST=1
$(cat "$SESSION_DIR/../s45/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
both() { local r="" x; for x in "$@"; do [ "$(fact $x)" = "đạt" ] || r="$r; ${x}: $(fact $x)"; done; [ -n "$r" ] && echo "${r#; }" || echo "đạt"; }
pkg_row() {
  local v out r="" p
  for v in $LAB_VMS; do
    out="$(vm "$v" "$(cat "$SESSION_DIR/../s42/files/node-facts.sh")" 2>/dev/null)"
    nf() { printf '%s\n' "$out" | sed -n "s/^$1=//p" | head -n1; }
    for p in kubeadm kubelet kubectl; do
      case " $(nf PKGS)" in *" $p=1.37."*) ;; *) r="$r; ${v#cka-}: $p chưa 1.37" ;; esac
    done
    [ "$(nf HOLD)" = "kubeadm kubectl kubelet " ] || r="$r; ${v#cka-}: hold [$(nf HOLD)]"
  done
  [ -n "$r" ] && echo "${r#; }" || echo "đạt"
}
expect_eq "Đầu ra s45: kubeadm, kubelet, kubectl 1.37.x và hold trên ba node" "đạt" pkg_row
expect_eq "Ba node Ready, schedulable, v1.37.x; control plane chạy, etcd từ /var/lib/etcd-restore, /readyz" "đạt" both CORE_NODES CORE_CP
expect_eq "Dữ liệu như cuối s44 (before-snapshot có, after-snapshot không, release deployed, postgres-0), etcd không lùi; answers.env s45" \
  "đạt" both DATA ANS
assert_summary
