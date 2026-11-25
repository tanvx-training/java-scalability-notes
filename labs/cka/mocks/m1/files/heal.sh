# m1 — "chữa" phần node/cluster mà một lần làm dở của m1 để lại, dùng trước khi kiểm lõi khoẻ. Nạp trên Mac (bash 3.2) bởi
# setup.sh của m1 (m1_heal_kubelet, m1_heal_pods) và của m2 (cả ba): m1 là chủ của kubelet cka-w1 (q12) và Corefile (q14), đề
# khác không tự sửa hai thứ đó mà gọi lại đây. Cần sẵn: vm, LAB_CP; M1 = đường dẫn labs/cka/mocks/m1.
#
#   m1_heal_kubelet   cka-w1: files/node.sh STEP=restore (kubelet về bản tốt nếu q12 còn hỏng). Ghi nhớ các Pod node.sh báo
#                     STALE (sandbox có nameserver sai: tạo trong lúc lỗi, hay sau khi VM khởi động lại) vào M1_STALE, trừ Pod
#                     trong namespace m1-* (đồ của đề m1, để nguyên cho lần chấm m1). Không xoá gì.
#   m1_heal_dns       cka-cp: files/dns.sh (Corefile về bản tốt của m1 chỉ khi DNS của cluster đang hỏng mà Corefile khác bản
#                     tốt). Có cài lại thì đặt M1_DNS_HEALED=1 và in một dòng.
#   m1_heal_pods      (sau hai hàm trên, khi apiserver đã phục vụ — chờ tối đa 300 giây) xoá các Pod trong M1_STALE; nếu
#                     M1_DNS_HEALED, xoá thêm Pod chưa Ready của bốn Deployment shop (chúng CrashLoop vì DNS hỏng, back-off tới
#                     5 phút: tạo lại cho nhanh). Có xoá thì chờ shop (gateway, gateway-v1, catalog, order, postgres-0) sẵn
#                     sàng lại, tối đa 300 giây. In một dòng cho mỗi Pod xoá. Thứ tự này (DNS trước, xoá Pod sau) để Pod mới
#                     không lên trên DNS còn hỏng.
# Cả ba trả mã lỗi của lệnh vm (setup.sh chạy với set -e: lỗi thì dừng với dòng `lab: …` của node.sh/dns.sh).
M1_STALE=""; M1_DNS_HEALED=""
m1_heal_kubelet() {
  local out p
  out="$(vm cka-w1 "STEP=restore
$(cat "$M1/files/node.sh")")" || return 1
  for p in $(printf '%s\n' "$out" | sed -n 's/^STALE=//p'); do
    case "$p" in m1-*) ;; *) M1_STALE="$M1_STALE $p" ;; esac
  done
  return 0
}
m1_heal_dns() {
  local out
  out="$(vm "$LAB_CP" "$(cat "$M1/files/dns.sh")")" || return 1
  case "$out" in *HEALED=corefile*) M1_DNS_HEALED=1; echo "  Corefile của CoreDNS về bản tốt (câu q14 của m1 làm dở đã làm DNS của cluster hỏng)" ;; esac
  return 0
}
m1_heal_pods() {
  local p
  [ -n "$M1_STALE" ] || [ -n "$M1_DNS_HEALED" ] || return 0
  vm "$LAB_CP" 'end=$(($(date +%s) + 300)); until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ $(date +%s) -ge $end ]; do sleep 3; done'
  for p in $M1_STALE; do
    echo "  tạo lại Pod $p (cka-w1, nameserver sai do câu q12 của m1 làm dở)"
    vm "$LAB_CP" "kubectl --request-timeout=15s -n '${p%%/*}' delete pod '${p#*/}' --wait=false >/dev/null 2>&1 || true"
  done
  if [ -n "$M1_DNS_HEALED" ]; then
    vm "$LAB_CP" 'kubectl --request-timeout=15s -n shop get pod -l "app in (gateway,gateway-v1,catalog,order)" -o json | python3 -c "
import datetime, json, sys
now = datetime.datetime.now(datetime.timezone.utc)
for p in json.load(sys.stdin)[\"items\"]:
    m = p[\"metadata\"]
    age = (now - datetime.datetime.fromisoformat(m[\"creationTimestamp\"].replace(\"Z\", \"+00:00\"))).total_seconds()
    if m.get(\"deletionTimestamp\") or age < 90: continue   # Pod vừa tạo lại ở trên: để nó lên
    if not any(c.get(\"type\") == \"Ready\" and c.get(\"status\") == \"True\" for c in p[\"status\"].get(\"conditions\") or []): print(p[\"metadata\"][\"name\"])
" | while read -r n; do echo "  tạo lại Pod shop/$n (chưa Ready vì DNS hỏng)"; kubectl --request-timeout=15s -n shop delete pod "$n" --wait=false >/dev/null 2>&1 || true; done'
  fi
  vm "$LAB_CP" 'for d in gateway gateway-v1 catalog order; do kubectl --request-timeout=15s -n shop rollout status deploy/$d --timeout=300s >/dev/null 2>&1 || true; done
kubectl --request-timeout=15s -n shop wait pod postgres-0 --for=condition=Ready --timeout=120s >/dev/null 2>&1 || true'
}
