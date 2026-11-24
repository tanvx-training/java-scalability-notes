# s48 — lời giải trên cka-cp (user ubuntu; kubectl, python3), gọi bởi apply.sh sau dòng STEP=look|fix (fix: thêm FIELD=…).
#   look  node nào NotReady, Conditions (Ready: reason/message; MemoryPressure, DiskPressure để loại trừ áp lực tài nguyên),
#         thử `kubectl debug node/cka-w1` khi runtime của node đó đang hỏng (đo: Pod debug Pending, không event: kubelet
#         không tạo được sandbox) rồi xoá Pod thử.
#   fix   (sau solve-node.sh trên hai worker) chờ ba node Ready; `kubectl debug node/cka-w1` đọc cgroupDriver trong
#         /host/var/lib/kubelet/config.yaml, xoá Pod debug; postgres-0 Ready; gateway, catalog, order mất trải hai worker
#         (Pod bị evict sau 300 giây NotReady dồn về node lên trước) thì `rollout restart` đúng Deployment đó; answers.env;
#         mục s48 của sổ tay nếu chưa có. Chạy lại được.
set -e
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s48: $*"; }
die() { echo "s48: $*" >&2; exit 1; }
cond() { k get node "$1" -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{"\n"}{end}' | grep -E '^(Ready|MemoryPressure|DiskPressure)=' | sed 's/^/    /'; }
debug_pod() {   # debug_pod <node> <lệnh…>: tạo Pod debug, in tên Pod
  local n="$1"; shift
  k debug "node/$n" --image=busybox:1.37 --profile=general -- "$@" 2>&1 | sed -n 's/^Creating debugging pod \([^ ]*\) .*/\1/p'
}
mkdir -p ~/drills/s48 ~/notes
case "$STEP" in
  look)
    log "1. k get node"
    k get node
    for n in cka-w1 cka-w2; do log "   Conditions của $n"; cond $n; done
    log "2. thử kubectl debug node/cka-w1 khi runtime của nó đang hỏng (20 giây)"
    p=$(debug_pod cka-w1 true); [ -n "$p" ] || die "kubectl debug node/cka-w1 không tạo được Pod"
    sleep 20
    k get pod "$p" -o wide --no-headers | awk '{print "    " $1, $3, "node=" $7}'
    echo "    Events: $(k get events --field-selector involvedObject.name=$p -o name | wc -l | tr -d ' ')"
    k delete pod "$p" --wait=false >/dev/null
    ;;
  fix)
    [ -n "$FIELD" ] || die "thiếu FIELD (trường đã sửa trên cka-w2)"
    log "5. chờ ba node Ready (tối đa 4 phút)"
    k wait node --all --for=condition=Ready --timeout=240s >/dev/null || die "ba node chưa Ready sau 4 phút"
    k get node
    log "6. kubectl debug node/cka-w1: cgroupDriver của kubelet (hệ thống tệp của node ở /host)"
    k get pod -o name | grep '^pod/node-debugger-' | xargs -r kubectl --request-timeout=10s delete --wait=false >/dev/null
    p=$(debug_pod cka-w1 grep cgroupDriver /host/var/lib/kubelet/config.yaml)
    [ -n "$p" ] || die "kubectl debug node/cka-w1 không tạo được Pod"
    end=$(($(date +%s) + 90))
    until [ "$(k get pod "$p" -o jsonpath='{.status.phase}')" = Succeeded ]; do
      [ "$(date +%s)" -lt "$end" ] || die "Pod debug $p chưa xong sau 90 giây"; sleep 3
    done
    cg=$(k logs "$p" | awk '/cgroupDriver:/ {print $2}')
    echo "    $p: cgroupDriver: $cg"
    [ -n "$cg" ] || die "không đọc được cgroupDriver"
    k delete pod "$p" --wait=false >/dev/null
    log "7. postgres-0 (PV local-path ghim cka-w2) và trải hai worker"
    k -n shop wait pod postgres-0 --for=condition=Ready --timeout=240s >/dev/null || die "postgres-0 chưa Ready sau 4 phút"
    for d in gateway catalog order; do
      on=$(k -n shop get pod -l app=$d -o jsonpath='{range .items[*]}{.spec.nodeName} {.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | awk '$2 == "True" {print $1}' | sort -u | tr '\n' ' ')
      case "$on" in
        *cka-w1*cka-w2*) echo "    $d: Pod Ready trên $on" ;;
        *) echo "    $d: Pod Ready chỉ trên ${on:-(không node nào)}: rollout restart"; k -n shop rollout restart deploy/$d >/dev/null ;;
      esac
    done
    for d in gateway catalog order; do k -n shop rollout status deploy/$d --timeout=300s >/dev/null || die "rollout $d chưa xong sau 5 phút"; done
    log "8. answers.env và mục s48 của sổ tay"
    printf 'W1_COMPONENT=containerd\nW2_FIELD=%s\nNODE_DEBUG_CGROUP=%s\n' "$FIELD" "$cg" > ~/drills/s48/answers.env
    cat ~/drills/s48/answers.env
    grep -qi '^#.*s48' ~/notes/runbook.md 2>/dev/null || cat >> ~/notes/runbook.md <<'EOF'

## s48 — node NotReady: containerd và kubelet
- Triệu chứng: hai worker NotReady; cka-w1 `KubeletNotReady: container runtime is down` (kubelet chạy, chỉ báo tin), cka-w2 `Kubelet stopped posting node status`.
- Lệnh: `k describe node` (Conditions), ssh node: `systemctl status containerd kubelet`, `journalctl -u containerd -u kubelet --since -10min`, `systemctl cat kubelet`, `crictl info`.
- Nguyên nhân 1: config.toml của containerd `SystemdCgroup = True` (TOML chỉ có true/false); sửa dòng journal chỉ ra, restart containerd. Đừng restart kubelet trước: nó sẽ thoát luôn.
- Nguyên nhân 2: /var/lib/kubelet/config.yaml sai một trường (runtime endpoint hay clientCAFile); đọc dòng "command failed", so với node khoẻ.
- Sau 300 giây NotReady Pod bị evict: kiểm trải hai worker, `rollout restart` nếu dồn về một node; postgres-0 chờ đúng node của PV.
EOF
    ;;
  *) die "STEP lạ: $STEP" ;;
esac
