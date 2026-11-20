# Phần chạy trên cka-cp của lỗi st8-ops (run.sh gửi nội dung tệp này qua `vm`, sau dòng STEP=prep hay STEP=break). Không in
# gì khi thành công: đây là đề bài. Chạy bằng user ubuntu, sudo không hỏi mật khẩu.
#
# Quy tắc an toàn (plan, "s45"): etcd KHÔNG BAO GIỜ được khởi động trên một data-dir rỗng hay cũ. /var/lib/etcd là dữ liệu
# trước lần restore của s43, không phải bản dự phòng; một đường dẫn gõ sai với hostPath DirectoryOrCreate thì kubelet tạo thư
# mục rỗng và etcd lên với cluster rỗng. Vì vậy lỗi ở đây là: volume etcd-data trỏ hostPath vào TỆP snapshot
# /opt/backup/etcd.db với `type: File` ("một đồng nghiệp tưởng etcd đọc thẳng snapshot"). kubelet mount tệp đó vào
# /var/lib/etcd-restore trong container, etcd đọc thư mục dữ liệu thì gặp một tệp và dừng ngay (đo: `failed to list data
# directory … not a directory`), không ghi gì. Tệp biến mất thì `type: File` làm kubelet từ chối mount, không tạo gì. Không
# đụng /var/lib/etcd-restore, /var/lib/etcd hay chính tệp snapshot (chỉ đọc; sha256 đo trước/sau bằng nhau).
#
# STEP=prep: kiểm trạng thái cuối s44 (etcdctl, snapshot, dữ liệu thật trong /var/lib/etcd-restore, đúng một manifest etcd).
#   Lần đầu: manifest phải trỏ /var/lib/etcd-restore ở cả --data-dir, mountPath, hostPath; etcd chạy từ đó và healthy; lưu
#   bản manifest tốt vào $H (thư mục chỉ root đọc). Lần sau (begin chạy lại giữa buổi): manifest khác bản đã lưu thì cài lại
#   bản đó (theo nội dung). Rồi chờ etcd chạy từ /var/lib/etcd-restore, apiserver /readyz (kick_apiserver nếu kẹt back-off),
#   và ghi revision và raft index etcd hiện tại vào $H/rev, $H/raft (verify đòi cả hai không lùi: khôi phục lại snapshot cũ là
#   mất dữ liệu ghi sau đó; raft index bắt cả --bump-revision lớn). Trước hết đưa lại kube-apiserver.yaml nếu một lần chạy
#   trước bị ngắt giữa lúc kick (unstrand). "Sự cố đang dở" (check.sh) = manifest etcd khác bản tốt đã lưu; không có dấu riêng.
# STEP=break: ghi manifest lỗi (từ bản tốt đã lưu, đổi đúng hai dòng path/type của volume etcd-data), chờ etcd ngừng phục vụ.
set -e
H=/root/.lab/st8-ops
MAN=/etc/kubernetes/manifests
NEW=/var/lib/etcd-restore
SNAP=/opt/backup/etcd.db
PKI=/etc/kubernetes/pki/etcd
k() { kubectl --request-timeout=10s "$@"; }
ec() { sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$PKI/ca.crt --cert=$PKI/server.crt --key=$PKI/server.key --command-timeout=3s "$@"; }
miss() { echo "lab: thiếu $1 (trạng thái cuối s44); thử: ./labs/lab restore cka s44" >&2; exit 1; }
# fail <bước>: một bước không có hiệu lực. Không nói bước đó làm gì (đây là đề bài sự cố).
fail() { echo "lab: không gây được sự cố st8-ops (bước $1/3); chạy lại ./labs/lab begin cka s45, vẫn lỗi thì ./labs/lab restore cka s44" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ $(date +%s) -lt $end ] || return 1; sleep 2; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
etcd_ok() { ec endpoint health >/dev/null 2>&1; }
etcd_down() { ! etcd_ok; }
has_data() { sudo grep -qaF /registry/namespaces/shop $NEW/member/snap/db 2>/dev/null; }
# good <tệp>: --data-dir, mountPath và hostPath của etcd-data đều là $NEW, hostPath type DirectoryOrCreate/Directory.
good() {
  sudo cat "$1" 2>/dev/null | python3 -c '
import sys, yaml
new = sys.argv[1]
try:
    d = yaml.safe_load(sys.stdin); c = d["spec"]["containers"][0]
    dd = next(a.split("=", 1)[1] for a in c["command"] if a.startswith("--data-dir="))
    mp = next(m["mountPath"] for m in c["volumeMounts"] if m["name"] == "etcd-data")
    hp = next(v for v in d["spec"]["volumes"] if v["name"] == "etcd-data")["hostPath"]
except Exception: sys.exit(1)
sys.exit(0 if dd == mp == hp["path"] == new and hp.get("type", "DirectoryOrCreate") in ("DirectoryOrCreate", "Directory") else 1)' "$NEW"
}
# mount_new: có container etcd ĐANG CHẠY mount $NEW vào đúng --data-dir của nó. live_new: thêm healthy.
mount_new() {
  local id
  for id in $(sudo crictl ps -q --name '^etcd$' --state running 2>/dev/null); do
    sudo crictl inspect "$id" 2>/dev/null | python3 -c '
import json, sys
d = json.load(sys.stdin); c = d["info"].get("config") or {}; a = (c.get("command") or []) + (c.get("args") or [])
dd = next(x.split("=", 1)[1] for x in a if x.startswith("--data-dir="))
sys.exit(0 if any(m["containerPath"] == dd and m["hostPath"] == sys.argv[1] for m in d["status"]["mounts"]) else 1)' "$NEW" && return 0
  done
  return 1
}
live_new() { mount_new && etcd_ok; }
# gone: etcd không phục vụ VÀ không còn container nào chạy trên $NEW (kubelet đã dừng etcd của manifest tốt; một lần health
# lỗi thoáng qua chưa đủ).
gone() { etcd_down && ! mount_new; }
n_etcd() {
  local f n=0
  for f in $(sudo ls $MAN); do sudo grep -q '^ *component: etcd$' "$MAN/$f" && n=$((n + 1)); done
  echo $n
}
raft() { ec endpoint status -w json | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["Status"]["raftIndex"])'; }
# unstrand: một lần chạy trước bị ngắt giữa lúc kick_apiserver (manifest đang ở $OFF): đưa lại trước khi làm gì (như s44).
OFF=/etc/kubernetes/s45-off
unstrand() {
  if sudo test -f $OFF/kube-apiserver.yaml && ! sudo test -f $MAN/kube-apiserver.yaml; then sudo mv $OFF/kube-apiserver.yaml $MAN/; fi
  sudo rm -f $H/active      # dấu của bản trước (đợt đầu); "sự cố đang dở" nay là: manifest khác bản tốt đã lưu
}
# kick_apiserver: kube-apiserver kẹt trong back-off của CrashLoopBackOff (tới 5 phút) dù etcd đã lên. Bộ đếm back-off chỉ
# nằm trong bộ nhớ của kubelet: `systemctl restart kubelet` xoá nó, kubelet thử lại apiserver ngay; container đang chạy
# không bị khởi động lại (đo, cả cka-cp lẫn cka-w2). Đo sau ≥ 6 phút hỏng, tính từ lúc cài lại manifest etcd tốt: chỉ chờ
# /readyz 310 giây; dời manifest apiserver ra, chờ kubelet bỏ hẳn Pod (49 giây) rồi đưa lại 71 giây; restart kubelet
# 51 giây.
kick_apiserver() {
  sudo systemctl restart kubelet
}
rev() { ec endpoint status -w json | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["Status"]["header"]["revision"])'; }

case "$STEP" in
  prep)
    unstrand
    command -v etcdctl >/dev/null 2>&1 || miss "etcdctl (s43)"
    sudo test -f $SNAP || miss "$SNAP (s43)"
    has_data || miss "dữ liệu etcd trong $NEW (s43)"
    [ "$(n_etcd)" = 1 ] || { echo "lab: $MAN có $(n_etcd) manifest etcd; để lại đúng etcd.yaml rồi chạy lại ./labs/lab begin cka s45" >&2; exit 1; }
    if sudo test -f $H/etcd.yaml; then
      sudo cmp -s $H/etcd.yaml $MAN/etcd.yaml || sudo install -m 0600 -o root -g root $H/etcd.yaml $MAN/etcd.yaml
    else
      good $MAN/etcd.yaml || miss "manifest etcd trỏ $NEW ở --data-dir, mountPath và hostPath (s43)"
    fi
    until_t 240 live_new || fail 1
    # Sau khi etcd vắng lâu, kube-apiserver nằm trong CrashLoopBackOff (kubelet chờ tới 5 phút giữa hai lần thử): chưa
    # /readyz sau 60 giây thì kick_apiserver (cách đã đo, xem hàm).
    until_t 60 readyz || kick_apiserver
    until_t 300 readyz || fail 1
    if ! sudo test -f $H/etcd.yaml; then
      sudo mkdir -p -m 0700 $H
      sudo install -m 0600 -o root -g root $MAN/etcd.yaml $H/etcd.yaml
    fi
    r=$(rev) || fail 1
    old=$(sudo cat $H/rev 2>/dev/null || echo 0)
    [ "$r" -ge "$old" ] || { echo "lab: revision etcd ($r) nhỏ hơn lúc begin trước ($old): dữ liệu đã lùi; thử: ./labs/lab restore cka s44" >&2; exit 1; }
    echo "$r" | sudo tee $H/rev >/dev/null
    # Raft index của member: chỉ tăng trên cùng một data-dir (qua mọi lần khởi động lại); restore một snapshot (kể cả
    # --bump-revision lớn) bắt đầu lại từ vài chục. Verify đòi raft index hiện tại ≥ số này.
    x=$(raft) || fail 1
    old=$(sudo cat $H/raft 2>/dev/null || echo 0)
    [ "$x" -ge "$old" ] || { echo "lab: raft index etcd ($x) nhỏ hơn lúc begin trước ($old): data-dir đã bị restore lại; thử: ./labs/lab restore cka s44" >&2; exit 1; }
    echo "$x" | sudo tee $H/raft >/dev/null
    ;;
  break)
    sudo test -f $H/etcd.yaml || fail 3
    t=$(mktemp)
    sudo cat $H/etcd.yaml | python3 -c '
import re, sys, yaml
snap = sys.argv[1]; src = sys.stdin.read(); L = src.split("\n")
# Volume etcd-data của kubeadm: "- hostPath:" / "path: …" / "type: …" / "name: etcd-data". Đổi đúng hai dòng path, type.
for i, l in enumerate(L):
    if l.strip() == "name: etcd-data" and not (i and "mountPath" in L[i - 1]):
        j = i - 1
        while j > 0 and "hostPath:" not in L[j]:
            if re.match(r"^\s*path: ", L[j]): L[j] = re.sub(r"path: .*", "path: " + snap, L[j])
            if re.match(r"^\s*type: ", L[j]): L[j] = re.sub(r"type: .*", "type: File", L[j])
            j -= 1
out = "\n".join(L)
a, b = yaml.safe_load(src), yaml.safe_load(out)
v = next(x for x in b["spec"]["volumes"] if x["name"] == "etcd-data")
v0 = next(x for x in a["spec"]["volumes"] if x["name"] == "etcd-data")
assert v["hostPath"] == {"path": snap, "type": "File"}, v
v0["hostPath"] = v["hostPath"]; assert a == b
sys.stdout.write(out)' "$SNAP" > "$t" || { rm -f "$t"; fail 3; }
    sudo install -m 0600 -o root -g root "$t" $MAN/etcd.yaml
    rm -f "$t"
    until_t 120 gone || fail 3
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 2 ;;
esac
