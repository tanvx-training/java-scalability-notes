# s26 — chờ có giới hạn (420 giây theo đồng hồ, mỗi lệnh có --request-timeout) trước khi đọc dữ kiện: apiserver, postgres-0,
# và ba Deployment của shop. Ngay sau khi VM bật lại, status trong API còn là của trước lúc tắt (node chưa bị coi là
# NotReady), nên "replicas = available" chưa đủ: chờ tới khi mọi Pod của gateway, catalog, order và postgres đã Ready
# SAU lúc control plane khởi động (lastTransitionTime của condition Ready ≥ thời điểm boot của cka-cp). Lệnh lỗi hay hết giờ là "chưa sẵn sàng". Chạy trên cka-cp (kubectl + python3).
end=$(($(date +%s) + 420))
boot=$(date -d "$(uptime -s)" +%s)
k() { kubectl --request-timeout=10s "$@"; }
until k get --raw /readyz >/dev/null 2>&1 || [ "$(date +%s)" -ge "$end" ]; do sleep 2; done
fresh() {
  { k -n shop get pod -l 'app in (gateway,catalog,order,postgres)' -o json; } 2>/dev/null |
  python3 -c '
import calendar, json, sys, time
boot = int(sys.argv[1]); raw = sys.stdin.read(); dec = json.JSONDecoder(); i = 0; pods = []
while i < len(raw):
    while i < len(raw) and raw[i].isspace(): i += 1
    if i >= len(raw): break
    obj, i = dec.raw_decode(raw, i); pods += obj.get("items", [])
def ok(p):
    if p["metadata"].get("deletionTimestamp") or (p.get("status") or {}).get("phase") == "Succeeded": return True
    for c in (p.get("status") or {}).get("conditions") or []:
        if c.get("type") == "Ready":
            return c.get("status") == "True" and calendar.timegm(time.strptime(c["lastTransitionTime"], "%Y-%m-%dT%H:%M:%SZ")) >= boot
    return False
sys.exit(0 if pods and all(ok(p) for p in pods) else 1)' "$boot"
}
counts() {
  o=$(k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{"\n"}{end}' 2>/dev/null) &&
    [ "$(printf '%s\n' "$o" | grep -c .)" = 3 ] && [ "$(printf '%s\n' "$o" | awk '$1!=$2' | grep -c .)" = 0 ]
}
until { fresh && counts; } || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
exit 0
