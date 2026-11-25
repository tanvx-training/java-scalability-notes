# m1 — Corefile của CoreDNS (câu q14), bước "chữa" cho đề khác: chạy trên cka-cp (user ubuntu, sudo; kubectl, dig, python3).
# Gọi bởi setup.sh của m2 qua files/heal.sh (m1_heal_dns) TRƯỚC khi kiểm lõi khoẻ; setup.sh của m1 không cần (stage.sh của m1
# luôn đưa Corefile về bản tốt khi dọn).
#   DNS của cluster khoẻ (hỏi ClusterIP kube-dns từ cka-cp: kubernetes.default và catalog.shop phân giải được, thử tới 60 giây)
#   → không làm gì: Corefile người học đã sửa đúng ở q14 (dòng legacy.m1.lab) được giữ, m1 vẫn chấm được như cũ.
#   DNS hỏng mà Corefile khác bản tốt của m1 (/root/.lab/m1/Corefile, stage.sh lưu ở lần dựng đầu) → q14 của m1 làm dở đã phá
#   DNS: cài lại bản tốt (đúng từng byte), `rollout restart` CoreDNS (Pod đang CrashLoop không chờ back-off), chờ DNS khoẻ tối
#   đa 180 giây. In `HEALED=corefile` khi có cài lại.
#   DNS hỏng mà Corefile là bản tốt, hay chưa từng có bản tốt → không phải do m1: không làm gì (lõi khoẻ của bên gọi sẽ báo).
# Lỗi thì một dòng `lab: …` ra stderr và trả 1.
H=/root/.lab/m1
k() { kubectl --request-timeout=10s "$@"; }
sudo -n test -s $H/Corefile || exit 0
ip=$(k -n kube-system get svc kube-dns -o jsonpath='{.spec.clusterIP}' 2>/dev/null)
[ -n "$ip" ] || { echo "lab: không đọc được ClusterIP của kube-dns" >&2; exit 1; }
ok() {
  local n
  for n in kubernetes.default.svc.cluster.local catalog.shop.svc.cluster.local; do
    dig +short +time=2 +tries=1 @"$ip" "$n" A 2>/dev/null | grep -q '^[0-9]' || return 1
  done
}
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }
until_t 60 ok && exit 0
cf="$(k -n kube-system get cm coredns -o json | python3 -c 'import json,sys; sys.stdout.write(json.load(sys.stdin)["data"]["Corefile"])'; echo x)" || exit 0
cf="${cf%x}"
good="$(sudo -n cat $H/Corefile; echo x)"; good="${good%x}"
[ "$cf" != "$good" ] || exit 0
f=$(mktemp)
printf '%s' "$good" | python3 -c 'import json,sys; print(json.dumps({"data": {"Corefile": sys.stdin.read()}}))' > "$f"
k -n kube-system patch cm coredns --type merge --patch-file "$f" >/dev/null || { rm -f "$f"; echo "lab: không cài lại được Corefile bản tốt của m1" >&2; exit 1; }
rm -f "$f"
k -n kube-system rollout restart deploy/coredns >/dev/null
k -n kube-system rollout status deploy/coredns --timeout=150s >/dev/null 2>&1 || true
until_t 60 ok || { echo "lab: DNS của cluster vẫn hỏng sau khi cài lại Corefile bản tốt của m1" >&2; exit 1; }
echo "HEALED=corefile"
