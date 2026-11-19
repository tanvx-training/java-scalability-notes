# s39 — chờ có giới hạn (240 giây theo đồng hồ) sau khi VM bật lại: mọi Pod của ba Deployment cert-manager Ready SAU lúc
# cka-cp khởi động (status trong API còn của trước lúc tắt, như s26/files/wait.sh). Control plane đã chạy quá 15 phút, hay
# chưa có namespace cert-manager, thì thoát ngay. Chạy trên cka-cp (kubectl + python3). Chỉ đọc.
end=$(($(date +%s) + 240))
boot=$(date -d "$(uptime -s)" +%s)
[ $(($(date +%s) - boot)) -lt 900 ] || exit 0
k() { kubectl --request-timeout=10s "$@"; }
k get ns cert-manager >/dev/null 2>&1 || exit 0
until k -n cert-manager get pod -l app.kubernetes.io/instance=cert-manager -o json 2>/dev/null | python3 -c '
import calendar, json, sys, time
boot = int(sys.argv[1])
pods = [p for p in json.load(sys.stdin)["items"] if not p["metadata"].get("deletionTimestamp")
        and (p.get("status") or {}).get("phase") not in ("Succeeded", "Failed")]
def ok(p):
    for c in (p.get("status") or {}).get("conditions") or []:
        if c.get("type") == "Ready":
            return c.get("status") == "True" and calendar.timegm(time.strptime(c["lastTransitionTime"], "%Y-%m-%dT%H:%M:%SZ")) >= boot
    return False
sys.exit(0 if len(pods) >= 3 and all(ok(p) for p in pods) else 1)' "$boot" || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
