# s49 — lời giải trên cka-cp (user ubuntu, sudo; crictl, kubectl, python3), gọi bởi apply.sh sau khi setup.sh đã gây sự cố
# st9-cp. Đi đúng thứ tự của buổi: kubectl chết → xuống một tầng: crictl ps -a, crictl logs của container apiserver vừa thoát,
# log trên đĩa /var/log/pods/, ss -lntp (6443 không ai nghe, 10259/10257 thì có hay không); sao lưu ba manifest ra
# ~/drills/s49/backup/ TRƯỚC khi sửa; `cat -A` thấy M-BM- (NBSP) trên dòng của cờ; xoá NBSP, chờ kubelet nạp lại và /readyz;
# rồi từ triệu chứng: Pod mới Pending không event → scheduler (crictl logs: tệp kubeconfig không có), Deployment không có
# ReplicaSet → controller-manager (crictl logs: root-ca-file không có); sửa đúng đường dẫn, chờ bốn static pod, /livez?verbose,
# phép thử lại, dọn đồ thử, answers.env, mục s49 của sổ tay. Chạy lại được.
set -e
MAN=/etc/kubernetes/manifests
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s49: $*"; }
die() { echo "s49: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
# last_exit <tên>: id container đã thoát gần nhất của thành phần (crictl ps -a xếp mới nhất trước).
last_exit() { sudo crictl ps -a -q --name "^$1\$" --state exited 2>/dev/null | head -n1; }
mkdir -p ~/drills/s49 ~/notes

log "1. kubectl"
k get node 2>&1 | tail -n1 || true
log "2. một tầng xuống: crictl ps -a"
sudo crictl ps -a --name 'kube-(apiserver|scheduler|controller-manager)' | cut -c1-140
id=""; end=$(($(date +%s) + 60))
until [ -n "$id" ]; do id=$(last_exit kube-apiserver); [ -n "$id" ] || { [ "$(date +%s)" -lt "$end" ] || die "không thấy container kube-apiserver đã thoát"; sleep 3; }; done
err=$(sudo crictl logs "$id" 2>&1 | grep -m1 -E '^Error:' || true)
echo "    crictl logs $id: $err" | cat -A | sed 's/\$$//' | cut -c1-160
echo "    /var/log/pods: $(sudo sh -c 'ls -t /var/log/pods/kube-system_kube-apiserver-cka-cp_*/kube-apiserver/*.log | head -n1 | xargs tail -n1' | cut -c1-120)"
sudo ss -lntp | awk 'NR == 1 || /:(6443|10259|10257) /' | cut -c1-110
flag=$(printf '%s\n' "$err" | sed -n 's/^Error: unknown flag: --//p' | sed 's/\xc2\xa0//g; s/[[:space:]]*$//')
[ -n "$flag" ] || die "chưa nhận ra lỗi của apiserver: $err"
log "3. sao lưu ba manifest TRƯỚC khi sửa (ngoài manifests/: kubelet chạy mọi tệp trong thư mục đó)"
mkdir -p ~/drills/s49/backup
sudo cp $MAN/kube-apiserver.yaml $MAN/kube-scheduler.yaml $MAN/kube-controller-manager.yaml ~/drills/s49/backup/
sudo chown "$(id -u):$(id -g)" ~/drills/s49/backup/*
ls ~/drills/s49/backup/
log "4. dòng của cờ --$flag, cat -A (M-BM- là NBSP U+00A0)"
sudo grep -n -- "--$flag" $MAN/kube-apiserver.yaml | cat -A
sudo sed -i 's/\xc2\xa0//g' $MAN/kube-apiserver.yaml
sudo grep -c $'\xc2\xa0' $MAN/kube-apiserver.yaml >/dev/null && die "còn NBSP trong kube-apiserver.yaml"
t0=$(date +%s)
until_t 180 readyz || die "apiserver chưa /readyz sau 3 phút"
log "   kubelet nạp lại, /readyz ok sau $(($(date +%s) - t0)) giây"

log "5. Pod mới có được xếp lịch không?"
k delete pod s49-probe --ignore-not-found --wait=true >/dev/null
k run s49-probe --image=busybox:1.37 --restart=Never --overrides='{"spec":{"terminationGracePeriodSeconds":0,"containers":[{"name":"t","image":"busybox:1.37","command":["sleep","300"],"resources":{"requests":{"cpu":"10m","memory":"16Mi"},"limits":{"memory":"32Mi"}}}]}}' >/dev/null
sleep 15
sym=$(k get pod s49-probe -o jsonpath='{.status.phase} node={.spec.nodeName}')
echo "    s49-probe: $sym, events: $(k get events --field-selector involvedObject.name=s49-probe -o name | wc -l | tr -d ' ')"
k -n kube-system get pod -l tier=control-plane
if [ -z "$(k get pod s49-probe -o jsonpath='{.spec.nodeName}')" ]; then
  id=$(last_exit kube-scheduler)
  e=$(sudo crictl logs "$id" 2>&1 | grep -m1 '"command failed"' || true)
  echo "    crictl logs kube-scheduler: $e" | cut -c1-160
  bad=$(printf '%s\n' "$e" | sed -n 's/.*err="stat \([^:]*\): no such file.*/\1/p')
  [ -n "$bad" ] || die "chưa nhận ra lỗi của scheduler"
  sudo grep -n -- "$bad" $MAN/kube-scheduler.yaml
  sudo sed -i "s#--kubeconfig=$bad\$#--kubeconfig=/etc/kubernetes/scheduler.conf#" $MAN/kube-scheduler.yaml
fi
log "6. Deployment scale có tạo Pod không?"
k delete deploy s49-scale --ignore-not-found --wait=true >/dev/null
# Garbage collector nằm trong controller-manager: khi nó hỏng, xoá Deployment để lại ReplicaSet mồ côi (đo trong selftest đợt 5:
# lần chạy trước dừng giữa bước này, RS cũ khiến lời giải tưởng controller-manager vẫn làm việc). Xoá RS cũ và chỉ tính RS
# do chính Deployment vừa tạo sở hữu.
k delete rs -l app=s49-scale --ignore-not-found --wait=false >/dev/null
k create deploy s49-scale --image=busybox:1.37 --replicas=1 -- sleep 300 >/dev/null
uid=$(k get deploy s49-scale -o jsonpath='{.metadata.uid}')
[ -n "$uid" ] || die "không đọc được uid của Deployment s49-scale"
k scale deploy s49-scale --replicas=2 >/dev/null
sleep 10
k get deploy,rs -l app=s49-scale
if ! k get rs -l app=s49-scale -o jsonpath='{range .items[*]}{.metadata.ownerReferences[0].uid}{"\n"}{end}' | grep -qx "$uid"; then
  # Container dựng lúc apiserver còn chết chỉ chờ leader lease, chưa thoát: lỗi hiện ~20 giây sau khi apiserver lên (đo).
  e=""; end=$(($(date +%s) + 120))
  until [ -n "$e" ]; do
    for id in $(sudo crictl ps -a -q --name '^kube-controller-manager$'); do
      e=$(sudo crictl logs "$id" 2>&1 | grep -m1 'Error building controllers' || true)
      [ -z "$e" ] || break
    done
    [ -n "$e" ] || { [ "$(date +%s)" -lt "$end" ] || die "không thấy lỗi của controller-manager sau 2 phút"; sleep 5; }
  done
  echo "    crictl logs kube-controller-manager: $e" | cut -c1-200
  bad=$(printf '%s\n' "$e" | sed -n 's/.*root-ca-file at \([^:]*\):.*/\1/p')
  [ -n "$bad" ] || die "chưa nhận ra lỗi của controller-manager"
  sudo grep -n -- "$bad" $MAN/kube-controller-manager.yaml
  sudo sed -i "s#--root-ca-file=$bad\$#--root-ca-file=/etc/kubernetes/pki/ca.crt#" $MAN/kube-controller-manager.yaml
fi
log "7. chờ bốn static pod, /livez?verbose, thử lại"
cp_ok() { [ "$(k -n kube-system get pod -l tier=control-plane -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | grep -c '^True$')" = 4 ]; }
until_t 180 cp_ok || die "bốn static pod chưa Ready sau 3 phút"
k get --raw '/livez?verbose' | tail -n 3
k wait pod s49-probe --for=condition=Ready --timeout=90s >/dev/null || die "s49-probe chưa chạy sau khi sửa scheduler"
k rollout status deploy/s49-scale --timeout=90s >/dev/null || die "s49-scale chưa đủ 2 Pod sau khi sửa controller-manager"
k get pod -o wide -l 'run=s49-probe' --no-headers; k get pod -o wide -l app=s49-scale --no-headers
k delete pod s49-probe --wait=false >/dev/null
k delete deploy s49-scale --wait=false >/dev/null
log "8. answers.env và mục s49 của sổ tay"
printf 'APISERVER_BAD_FLAG=--%s\nSCHEDULER_SYMPTOM=Pending\nCM_SYMPTOM="Deployment scale lên 2 mà không có ReplicaSet nào, không có Pod mới"\n' "$flag" > ~/drills/s49/answers.env
cat ~/drills/s49/answers.env
grep -qi '^#.*s49' ~/notes/runbook.md 2>/dev/null || cat >> ~/notes/runbook.md <<'EOF'

## s49 — control plane: apiserver, scheduler, controller-manager
- Triệu chứng: kubectl `connection refused` :6443; sau khi apiserver lên: Pod mới Pending không event, Deployment không có ReplicaSet.
- Lệnh (kubectl chết thì xuống một tầng): `sudo crictl ps -a`, `sudo crictl logs <id>`, `/var/log/pods/kube-system_kube-apiserver-*`, `ss -lntp | grep -E '6443|10259|10257'`.
- Luôn sao lưu manifest ra NGOÀI /etc/kubernetes/manifests trước khi sửa (kubelet chạy mọi tệp trong đó, kể cả *.bak).
- Nguyên nhân: cờ apiserver có NBSP (`cat -A` thấy M-BM-), scheduler --kubeconfig trỏ tệp không có, controller-manager --root-ca-file sai.
- Sau khi sửa: chờ kubelet nạp lại (~20 giây), `k get --raw '/livez?verbose'`, thử một Pod và một Deployment.
EOF
