# s29 — chờ có giới hạn (420 giây theo đồng hồ, mỗi lệnh có --request-timeout) trước khi đọc dữ kiện: apiserver, postgres-0,
# CoreDNS, ba Deployment của shop và controller ingress-nginx (Pod nhãn app.kubernetes.io/component=controller ở namespace
# ingress-nginx; chưa cài thì không chờ nó). Ngay sau khi VM bật lại, status trong API còn là của trước lúc tắt (node chưa bị coi là
# NotReady), nên "replicas = available" chưa đủ: chờ tới khi mọi Pod của gateway, catalog, order, postgres, coredns và ingress-nginx đã Ready
# SAU lúc control plane khởi động (lastTransitionTime của condition Ready ≥ thời điểm boot của cka-cp), rồi exec được vào
# postgres-0 và tên Service phân giải được từ đó. Lệnh lỗi hay hết giờ là "chưa sẵn sàng". Chạy trên cka-cp (kubectl + python3).
end=$(($(date +%s) + 420))
boot=$(date -d "$(uptime -s)" +%s)
# Status cũ chỉ là chuyện của vài phút đầu sau khi bật VM: control plane đã chạy quá 15 phút thì bỏ điều kiện "Ready sau lúc boot"
# (và vòng tra tên của s28), chỉ chờ replicas = available. Nhờ vậy lỗi thật của người học không bắt verify chờ đủ 420 giây.
recent=0; [ $(($(date +%s) - boot)) -lt 900 ] && recent=1
k() { kubectl --request-timeout=10s "$@"; }
until k get --raw /readyz >/dev/null 2>&1 || [ "$(date +%s)" -ge "$end" ]; do sleep 2; done
fresh() {
  { k -n shop get pod -l 'app in (gateway,catalog,order,postgres)' -o json && k -n kube-system get pod -l k8s-app=kube-dns -o json &&
    k -n ingress-nginx get pod -l app.kubernetes.io/component=controller -o json; } 2>/dev/null |
  python3 -c '
import calendar, json, sys, time
boot = int(sys.argv[1]); raw = sys.stdin.read(); dec = json.JSONDecoder(); i = 0; pods = []
while i < len(raw):
    while i < len(raw) and raw[i].isspace(): i += 1
    if i >= len(raw): break
    obj, i = dec.raw_decode(raw, i); pods += obj.get("items", [])
def ok(p):
    # Pod đang xoá, đã xong hay Failed (bị evict: ReplicaSet đã tạo Pod thay) không chặn vòng chờ.
    if p["metadata"].get("deletionTimestamp") or (p.get("status") or {}).get("phase") in ("Succeeded", "Failed"): return True
    for c in (p.get("status") or {}).get("conditions") or []:
        if c.get("type") == "Ready":
            return c.get("status") == "True" and calendar.timegm(time.strptime(c["lastTransitionTime"], "%Y-%m-%dT%H:%M:%SZ")) >= boot
    return False
sys.exit(0 if pods and all(ok(p) for p in pods) else 1)' "$boot"
}
counts() {
  o=$( { k -n kube-system get deploy coredns -o jsonpath='{.spec.replicas} {.status.availableReplicas}{"\n"}' &&
         k -n shop get deploy gateway catalog order -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{"\n"}{end}' &&
         k -n ingress-nginx get deploy -l app.kubernetes.io/component=controller -o jsonpath='{range .items[*]}{.spec.replicas} {.status.availableReplicas}{"\n"}{end}'; } 2>/dev/null) &&
    [ "$(printf '%s\n' "$o" | grep -c .)" -ge 4 ] && [ "$(printf '%s\n' "$o" | awk '$1!=$2' | grep -c .)" = 0 ]
}
until { { [ "$recent" = 0 ] || fresh; } && counts; } || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
until [ "$recent" = 0 ] || k -n shop exec postgres-0 -c postgres -- getent hosts catalog.shop.svc.cluster.local >/dev/null 2>&1 || [ "$(date +%s)" -ge "$end" ]; do sleep 3; done
exit 0
