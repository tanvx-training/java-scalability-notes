# s46 — lời giải trên cka-cp (user ubuntu; kubectl, helm, python3), gọi bởi apply.sh sau khi setup.sh đã gây sự cố st9-app.
# Đi đúng thứ tự của buổi: toàn cảnh (Pod không Running và giới hạn của --field-selector, sắp theo restartCount), ghi
# not-ready.txt TRƯỚC khi sửa, đọc nguyên nhân từng Deployment (logs --previous, Events, describe), ghi answers.env, rồi sửa
# đối tượng cha về đúng release. Đo trên Helm v4.3.2 (release cài server-side apply): `helm upgrade --reuse-values` và
# `helm rollback` đều lỗi `conflict with "kubectl-set"`/`"kubectl-patch"` (release thành failed); thêm --force-conflicts thì
# Helm lấy lại image của order và probe của gateway, nhưng KHÔNG gỡ biến SPRING_CONFIG_IMPORT (trường Helm chưa từng sở hữu)
# nên --wait hết giờ vì catalog. Vì vậy: gỡ biến bằng kubectl trước, rồi helm rollback về chính revision deployed với
# --force-conflicts --wait (release deployed trở lại). Cuối cùng viết ~/notes/runbook.md nếu sổ tay chưa đủ bốn tầng (không
# ghi đè sổ tay đã đủ). Chạy lại được.
set -e
k() { kubectl --request-timeout=10s "$@"; }
log() { echo "s46: $*"; }
die() { echo "s46: $*" >&2; exit 1; }
mkdir -p ~/drills/s46 ~/notes
log "1. Pod không Running (--field-selector chỉ lọc được status.phase: CrashLoopBackOff vẫn là phase Running)"
k get pod -A --field-selector=status.phase!=Running,status.phase!=Succeeded || true
log "   sắp theo số lần restart (cuối danh sách là Pod restart nhiều nhất)"
k get pod -A --sort-by='.status.containerStatuses[0].restartCount' \
  -o custom-columns='NS:.metadata.namespace,POD:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status,RESTARTS:.status.containerStatuses[0].restartCount,WAIT:.status.containerStatuses[0].state.waiting.reason' | tail -6
log "2. not-ready.txt: mọi Pod có condition Ready khác True, dạng <ns>/<pod>"
k get pod -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name} {.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' |
  awk '$2 != "True" {print $1}' > ~/drills/s46/not-ready.txt
cat ~/drills/s46/not-ready.txt
log "3. catalog: log của container đã chết (logs --previous), dòng Caused by/Exception đầu tiên"
cause=""
end=$(($(date +%s) + 120))
while [ -z "$cause" ] && [ "$(date +%s)" -lt "$end" ]; do
  for p in $(k -n shop get pod -l app=catalog -o jsonpath='{range .items[?(@.status.containerStatuses[0].restartCount>0)]}{.metadata.name}{"\n"}{end}'); do
    cause=$(k -n shop logs "$p" --previous 2>/dev/null | grep -m1 -E 'Unable to load config data|Exception.*configserver' || true)
    [ -n "$cause" ] && { log "   $p"; break; }
  done
  [ -n "$cause" ] || sleep 3
done
[ -n "$cause" ] || die "không đọc được nguyên nhân catalog từ logs --previous sau 2 phút"
echo "$cause" | cut -c1-300
log "4. order: lý do chờ của Pod mới, Events"
reason=$(k -n shop get pod -l app=order -o jsonpath='{range .items[*]}{.status.containerStatuses[0].state.waiting.reason}{"\n"}{end}' | grep -m1 -E 'ImagePull|ErrImage' || true)
[ -n "$reason" ] || die "không thấy Pod order nào ErrImagePull/ImagePullBackOff"
echo "$reason"
k get events -A --sort-by=.lastTimestamp --field-selector type=Warning 2>/dev/null | grep -E 'order|gateway|catalog' | tail -5 || true
log "5. gateway: Events Unhealthy cho biết probe nào lỗi"
k -n shop get events --field-selector reason=Unhealthy -o custom-columns=MSG:.message --no-headers 2>/dev/null | sort | uniq -c | tail -3 || true
printf 'CATALOG_CAUSE=%s\nORDER_REASON=%s\nGATEWAY_PROBE=liveness\n' "$(printf '%s' "$cause" | tr -d '\r' | cut -c1-500)" "$reason" > ~/drills/s46/answers.env
log "6. sửa đối tượng cha: gỡ biến Helm không sở hữu, rồi helm rollback về revision deployed, lấy lại các trường bị kubectl sửa"
k -n shop set env deploy/catalog SPRING_CONFIG_IMPORT-
rev=$(helm -n shop history shop -o json | python3 -c 'import json,sys; print([r for r in json.load(sys.stdin) if r["status"] in ("deployed", "superseded")][-1]["revision"])')
helm -n shop rollback shop "$rev" --force-conflicts --wait --timeout 6m
helm -n shop history shop --max 2
for d in catalog order gateway; do k -n shop rollout status deploy/$d --timeout=300s; done
log "7. sổ tay ~/notes/runbook.md"
python3 - "$HOME" <<'PY'
import re, sys
p = f"{sys.argv[1]}/notes/runbook.md"
try: text = open(p, encoding="utf-8").read()
except Exception: text = ""
# Cùng luật với verify (files/facts.sh, RUNBOOK): mỗi tầng một mục ## riêng, ≥ 3 dòng không rỗng.
secs, cur = [], None
for l in text.splitlines():
    m = re.match(r"^(#{1,2})\s+(.*)", l)
    if m:
        cur = [m.group(2), 0] if m.group(1) == "##" else None
        if cur: secs.append(cur)
    elif cur is not None and l.strip(): cur[1] += 1
G = (r"\bapp\b|ứng dụng|\bpods?\b", r"\bservices?\b|\bdns\b", r"\bnodes?\b|\bkubelet\b", r"control[ -]?plane|\bapiserver\b|kube-apiserver")
import itertools
if any(all(re.search(g, secs[i][0], re.I) and secs[i][1] >= 3 for i, g in zip(p4, G)) for p4 in itertools.permutations(range(len(secs)), 4)):
    print("s46:    sổ tay đã có bốn tầng, giữ nguyên"); sys.exit(0)
BODY = """# Sổ tay sự cố cluster

Thứ tự: đi từ triệu chứng người dùng thấy xuống từng tầng; dừng ở tầng đầu tiên tự nó hỏng (các tầng trên chỉ là nạn nhân).

## Tầng 1 — ứng dụng và Pod
- Toàn cảnh: `k get pod -A -o wide`, sắp theo restart: `--sort-by=.status.containerStatuses[0].restartCount`.
- `--field-selector=status.phase!=Running` không bắt CrashLoopBackOff (phase vẫn Running); lọc theo Ready bằng jsonpath.
- CrashLoopBackOff: `k logs <pod> --previous` (container đã chết), tìm dòng `Caused by` cuối cùng.
- ImagePullBackOff / ErrImagePull: `k describe pod` → Events, sai tag hay registry.
- Restart lặp mà log sạch: Events `Unhealthy` (probe nào, đường dẫn nào).
- Sửa đối tượng cha (Deployment, release Helm), không xoá Pod; kiểm `helm get manifest` so với cluster.

## Tầng 2 — Service và DNS
- `k get endpointslice -l kubernetes.io/service-name=<svc>`: rỗng là selector/nhãn sai.
- Từ một Pod busybox: `nslookup <svc>.<ns>.svc.cluster.local` rồi `wget -T3 <ClusterIP>:<port>`: tách DNS khỏi Service.
- DNS: `k -n kube-system logs -l k8s-app=kube-dns`, Corefile trong ConfigMap `coredns`.
- NetworkPolicy: `k get netpol -A`, đọc policyTypes và egress của Pod nguồn.

## Tầng 3 — node và kubelet
- `k get node`, `k describe node` (Conditions, Taints).
- Trên node: `systemctl status kubelet containerd`, `journalctl -u kubelet --since -10min`.
- `sudo crictl ps -a`, `sudo crictl logs <id>` khi kubectl không thấy gì.

## Tầng 4 — control plane và apiserver
- `k get --raw /readyz?verbose`, `k -n kube-system get pod -l tier=control-plane`.
- apiserver chết: `sudo crictl ps -a`, `sudo crictl logs`, `/var/log/pods/kube-system_*`, manifest trong `/etc/kubernetes/manifests`.
- etcd: `etcdctl endpoint health`, `endpoint status -w table`; sao lưu manifest ra ngoài thư mục manifests trước khi sửa.
"""
open(p, "w", encoding="utf-8").write(BODY + ("\n" + text if text.strip() else ""))
print("s46:    đã viết sổ tay bốn tầng")
PY
