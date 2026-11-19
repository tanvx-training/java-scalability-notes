# s43 — lời giải trên cka-cp (user ubuntu, sudo), gọi bởi apply.sh. Không bao giờ xoá thư mục dữ liệu etcd nào: /var/lib/etcd
# (data-dir cũ) giữ nguyên; /var/lib/etcd-restore cũ mà etcd không dùng thì đổi tên thành /var/lib/etcd-restore.old-<giờ>.
# Không bao giờ trỏ etcd sang một thư mục chưa có dữ liệu (member/snap/db). Ba trường hợp, theo manifest etcd lúc bắt đầu:
#   A. đã trỏ /var/lib/etcd-restore ở cả --data-dir, mountPath, hostPath, có dữ liệu, shop đúng dấu hiệu (before-snapshot có,
#      after-snapshot không, order Available): bỏ qua, chỉ chụp lại snapshot nếu /opt/backup/etcd.db mất, ghi answers.env.
#   B. trỏ /var/lib/etcd-restore ở một hay hai chỗ (tình huống hỏng của buổi: sửa --data-dir mà quên hostPath) và thư mục đó có
#      dữ liệu: sửa nốt cho đủ ba chỗ, chờ etcd và apiserver, rồi đòi dấu hiệu như A.
#   C. còn nguyên /var/lib/etcd: cả luồng của buổi (before-snapshot → snapshot → after-snapshot → xoá order → dừng apiserver,
#      controller-manager, scheduler → restore → sửa manifest → bật lại).
# Còn lại (manifest lạ, dấu hiệu sai sau restore): dừng, gợi ý `./labs/lab restore cka s42`.
set -e
NEW=/var/lib/etcd-restore
OLD=/var/lib/etcd
MAN=/etc/kubernetes/manifests
OFF=/etc/kubernetes/s43-off        # nơi tạm cất manifest control plane (ngoài thư mục kubelet đọc)
SNAP=/opt/backup/etcd.db
PKI=/etc/kubernetes/pki/etcd
IP=$(sudo sed -n 's/^ *- --advertise-client-urls=https:\/\/\([0-9.]*\):2379$/\1/p' $MAN/etcd.yaml 2>/dev/null || true)
[ -n "$IP" ] || IP=$(sudo sed -n 's/^ *- --advertise-client-urls=https:\/\/\([0-9.]*\):2379$/\1/p' $OFF/etcd.yaml 2>/dev/null || true)
k() { kubectl --request-timeout=10s "$@"; }
etcdctl_() { sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt --key=$PKI/server.key "$@"; }
log() { echo "s43: $*"; }
die() { echo "s43: $*" >&2; exit 1; }
mkdir -p ~/drills/s43

# Lần trước bị ngắt khi manifest control plane đang cất ở $OFF: đưa lại trước khi làm gì.
for f in kube-apiserver kube-controller-manager kube-scheduler; do
  if sudo test -f $OFF/$f.yaml && ! sudo test -f $MAN/$f.yaml; then log "đưa lại $f.yaml từ $OFF (lần trước bị ngắt)"; sudo mv $OFF/$f.yaml $MAN/; fi
done

wait_readyz() { # <giây>
  local end=$(($(date +%s) + $1))
  until [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; do [ $(date +%s) -lt $end ] || return 1; sleep 2; done
}
wait_etcd() { # <giây>: container etcd chạy và healthy
  local end=$(($(date +%s) + $1))
  until etcdctl_ --command-timeout=3s endpoint health >/dev/null 2>&1; do [ $(date +%s) -lt $end ] || return 1; sleep 2; done
}
wait_new_etcd() { # <giây>: container etcd ĐANG CHẠY mount $NEW vào đúng --data-dir của nó (kubelet đã thay container cũ), rồi healthy
  local end=$(($(date +%s) + $1)) id
  until id=$(sudo crictl ps -q --name '^etcd$' --state running | head -1) && [ -n "$id" ] &&
        sudo crictl inspect "$id" | python3 -c '
import json, sys
d = json.load(sys.stdin); c = d["info"].get("config") or {}; a = (c.get("command") or []) + (c.get("args") or [])
dd = next(x.split("=", 1)[1] for x in a if x.startswith("--data-dir="))
sys.exit(0 if any(m["containerPath"] == dd and m["hostPath"] == sys.argv[1] for m in d["status"]["mounts"]) else 1)' "$NEW" 2>/dev/null; do
    [ $(date +%s) -lt $end ] || return 1; sleep 2; done
  wait_etcd $(( end - $(date +%s) > 10 ? end - $(date +%s) : 10 ))
}
wait_order() { # order chạy thật, tối đa 7 phút: đủ Pod Ready, không đang xoá, không phải Pod có tên ghi lúc chụp (status của
  # chúng sau restore là status cũ trong snapshot), và /api/orders qua NodePort 30180 trả 200. Không tin status của Deployment:
  # sau restore nó là status lúc chụp (đo: "2/2 available" khi chưa có Pod order nào chạy).
  local end=$(($(date +%s) + ${1:-420})) ip
  ip=$(k get node cka-w1 -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)
  until k -n shop get deploy order -o json 2>/dev/null >/tmp/s43-order.json && k -n shop get pod -l app=order -o json 2>/dev/null | python3 -c '
import json, sys
want = json.load(open("/tmp/s43-order.json"))["spec"].get("replicas", 1)
try: old = set(l.strip().split("/", 1)[-1] for l in open(sys.argv[1]))
except Exception: old = set()
ok = [p for p in json.load(sys.stdin)["items"] if not p["metadata"].get("deletionTimestamp") and p["metadata"]["name"] not in old
      and any(c["type"] == "Ready" and c["status"] == "True" for c in p.get("status", {}).get("conditions", []))]
sys.exit(0 if len(ok) >= want else 1)' ~/drills/s43/order-pods-at-snapshot &&
        [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$ip:30180/api/orders")" = 200 ]; do
    [ $(date +%s) -lt $end ] || { rm -f /tmp/s43-order.json; return 1; }; sleep 3
  done
  rm -f /tmp/s43-order.json
}
# manifest_state: in "<--data-dir> <mountPath của volume etcd-data> <hostPath của etcd-data>"
manifest_state() {
  sudo cat $MAN/etcd.yaml | python3 -c '
import sys, yaml
d = yaml.safe_load(sys.stdin); c = d["spec"]["containers"][0]
dd = next((a.split("=", 1)[1] for a in c["command"] if a.startswith("--data-dir=")), "-")
mp = next((m["mountPath"] for m in c["volumeMounts"] if m["name"] == "etcd-data"), "-")
hp = next((v["hostPath"]["path"] for v in d["spec"]["volumes"] if v["name"] == "etcd-data"), "-")
print(dd, mp, hp)'
}
markers_ok() {
  k -n shop get cm before-snapshot >/dev/null 2>&1 || return 1
  local err; err=$(k -n shop get cm after-snapshot 2>&1 >/dev/null) && return 1
  case "$err" in *NotFound*) ;; *) return 1 ;; esac
  wait_order
}
snapshot_save() {
  sudo mkdir -p /opt/backup
  etcdctl_ snapshot save $SNAP
  sudo etcdutl snapshot status $SNAP -w table
}
point_to_new() { # sửa đủ ba chỗ trong manifest etcd sang $NEW (giữ bản gốc ở ~/drills/s43/etcd.yaml.orig, ngoài $MAN)
  sudo test -s $NEW/member/snap/db || die "$NEW chưa có dữ liệu (member/snap/db): không trỏ etcd sang đó"
  [ -f ~/drills/s43/etcd.yaml.orig ] || sudo cat $MAN/etcd.yaml > ~/drills/s43/etcd.yaml.orig
  # Sửa đúng ba dòng, giữ nguyên định dạng của kubeadm: --data-dir; mountPath ngay trên "name: etcd-data" của volumeMounts;
  # path trong khối hostPath ngay trên "name: etcd-data" của volumes.
  sudo cat $MAN/etcd.yaml | python3 -c '
import re, sys
new = sys.argv[1]; L = sys.stdin.read().split("\n")
for i, l in enumerate(L):
    if re.match(r"^\s*- --data-dir=", l): L[i] = re.sub(r"--data-dir=.*", "--data-dir=" + new, l)
    if l.strip() == "name: etcd-data" and i and re.match(r"^\s*- mountPath: ", L[i-1]): L[i-1] = re.sub(r"mountPath: .*", "mountPath: " + new, L[i-1])
    if l.strip() == "name: etcd-data" and not (i and "mountPath" in L[i-1]):
        j = i - 1
        while j > 0 and "hostPath:" not in L[j]:
            if re.match(r"^\s*path: ", L[j]): L[j] = re.sub(r"path: .*", "path: " + new, L[j])
            j -= 1
sys.stdout.write("\n".join(L))' "$NEW" > /tmp/s43-etcd.yaml
  sudo install -m 0600 /tmp/s43-etcd.yaml $MAN/etcd.yaml; rm -f /tmp/s43-etcd.yaml
  log "manifest etcd: $(manifest_state)"
}

st=$(manifest_state)
log "manifest etcd lúc bắt đầu (--data-dir mountPath hostPath): $st"
case "$st" in
  "$NEW $NEW $NEW")
    wait_etcd 180 || die "etcd chưa healthy sau 3 phút"
    wait_readyz 240 || die "apiserver chưa sẵn sàng sau 4 phút"
    markers_ok || die "etcd đã chạy từ $NEW nhưng shop chưa đúng dấu hiệu (before-snapshot, after-snapshot, order). Làm lại: ./labs/lab restore cka s42"
    log "etcd đã chạy từ $NEW, before-snapshot có, after-snapshot không, order Available: bỏ qua phần restore"
    sudo etcdutl snapshot status $SNAP -w table >/dev/null 2>&1 || { log "chưa có $SNAP hợp lệ: chụp lại"; snapshot_save; } ;;
  *"$NEW"*)
    log "manifest mới trỏ $NEW ở một phần (tình huống hỏng): sửa đủ ba chỗ"
    point_to_new
    wait_new_etcd 180 || die "etcd chưa chạy từ $NEW sau 3 phút"
    wait_readyz 240 || die "apiserver chưa sẵn sàng sau 4 phút"
    markers_ok || die "etcd chạy từ $NEW nhưng shop chưa đúng dấu hiệu. Làm lại: ./labs/lab restore cka s42"
    sudo etcdutl snapshot status $SNAP -w table >/dev/null 2>&1 || snapshot_save ;;
  "$OLD $OLD $OLD")
    [ -n "$IP" ] || die "không đọc được IP của etcd trong manifest"
    wait_readyz 240 || die "apiserver chưa sẵn sàng"
    rm -f ~/drills/s43/order-pods-at-snapshot     # danh sách của một lần chạy trước không áp dụng cho lần chụp này
    k -n shop get deploy order >/dev/null 2>&1 || die "Deployment order đã mất trước khi chụp (lần trước bị ngắt sau bước xoá?). Làm lại: ./labs/lab restore cka s42"
    wait_order || die "order chưa Available"
    log "1. ConfigMap before-snapshot, rồi snapshot"
    k -n shop delete cm after-snapshot --ignore-not-found
    k -n shop create cm before-snapshot --from-literal=note="tạo trước snapshot" --dry-run=client -o yaml | k apply -f -
    snapshot_save
    log "2. sau snapshot: ConfigMap after-snapshot, xoá Deployment order"
    k -n shop create cm after-snapshot --from-literal=note="tạo sau snapshot" --dry-run=client -o yaml | k apply -f -
    # Tên Pod của order lúc chụp: sau restore chúng có lại trong API (đối tượng trong snapshot) mà container đã bị xoá.
    k -n shop get pod -l app=order -o name > ~/drills/s43/order-pods-at-snapshot
    k -n shop delete deploy order --wait=true --timeout=60s
    k -n shop get deploy,cm | grep -E 'order|snapshot' || true
    log "3. dừng kube-apiserver, kube-controller-manager, kube-scheduler (cất manifest ra $OFF)"
    sudo mkdir -p $OFF
    for f in kube-apiserver kube-controller-manager kube-scheduler; do sudo mv $MAN/$f.yaml $OFF/; done
    end=$(($(date +%s) + 120))
    until [ -z "$(sudo crictl ps -q --name 'kube-apiserver|kube-controller-manager|kube-scheduler')" ]; do
      [ $(date +%s) -lt $end ] || die "container control plane chưa dừng sau 2 phút"; sleep 2; done
    log "4. restore vào $NEW"
    if sudo test -e $NEW; then sudo mv $NEW $NEW.old-$(date +%s); log "đổi tên $NEW cũ (không dùng) thành $NEW.old-*"; fi
    sudo etcdutl snapshot restore $SNAP --data-dir $NEW --name cka-cp \
      --initial-cluster cka-cp=https://$IP:2380 --initial-advertise-peer-urls https://$IP:2380 \
      --bump-revision 1000000000 --mark-compacted
    log "5. sửa manifest etcd (--data-dir, mountPath, hostPath)"
    point_to_new
    wait_new_etcd 180 || die "etcd chưa chạy từ $NEW sau 3 phút: xem sudo crictl ps -a --name etcd, sudo crictl logs <id>"
    sudo crictl ps --name etcd
    log "6. bật lại kube-apiserver, kube-controller-manager, kube-scheduler"
    for f in kube-apiserver kube-controller-manager kube-scheduler; do sudo mv $OFF/$f.yaml $MAN/; done
    wait_readyz 240 || die "apiserver chưa sẵn sàng sau 4 phút"
    markers_ok || die "sau restore shop chưa đúng dấu hiệu"
    ;;
  *) die "manifest etcd lạ ($st). Làm lại: ./labs/lab restore cka s42" ;;
esac
# Pod của order có trong snapshot nhưng container đã bị xoá: kubelet không dọn được sandbox của chúng lúc apiserver tắt (Calico
# CNI gọi apiserver), chúng chuyển sang STATUS Error vài phút sau, bên cạnh hai Pod mới mà ReplicaSet tạo (đo). Xoá đúng các Pod
# có tên ghi lúc chụp (không đụng Pod nào khác); Pod đã Failed thì xoá thêm theo phase. Chạy lại được.
# Ngay sau restore, status của các Pod này là status lúc chụp (Ready), nên không chọn theo Ready: xoá cả hai rồi chờ Pod mới thật
# sự chạy (wait_order bỏ qua tên cũ). Đo: Pod cũ Terminating vài phút vì CNI không dọn được sandbox, ReplicaSet chỉ tạo Pod mới
# khi Pod cũ biến mất, và kubelet nhận Pod mới chậm ~1 phút (watch phải list lại sau --bump-revision).
for p in $(cat ~/drills/s43/order-pods-at-snapshot 2>/dev/null); do
  k -n shop get "$p" >/dev/null 2>&1 || continue
  k -n shop delete "$p" --ignore-not-found --wait=false
done
wait_order || die "order chưa chạy (Pod mới Ready, /api/orders 200) sau 7 phút"
k -n shop delete pod -l app=order --field-selector=status.phase=Failed --ignore-not-found
echo "LOST_OBJECT=configmap/after-snapshot" > ~/drills/s43/answers.env
cat ~/drills/s43/answers.env
k -n shop get deploy order; k -n shop get cm | grep snapshot || true
helm -n shop list
