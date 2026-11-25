# s52 — lời giải chuẩn của buổi Mock 1: dựng đề m1 như `./labs/lab mock cka m1 start` (nạp mocks/m1/setup.sh với SESSION_DIR
# của đề), chạy lời giải chuẩn cả 16 câu (mocks/m1/files/solve-node.sh trên cka-w1 cho phần node của q12, files/solve.sh trên
# cka-cp cho mọi câu còn lại và phần Pod của q12), rồi chấm bằng mocks/m1/score.sh tới khi đủ 100/100: tối đa 3 lần, cách
# nhau 30 giây (vài tiêu chí đo theo thời gian thật — HPA đọc metric, CoreDNS nạp Corefile, data plane nạp route — có thể trễ
# một nhịp sau vòng chờ của solve.sh, nhất là ngay sau `restore`); lần thứ ba vẫn thiếu thì DỪNG LỖI (in câu thiếu và lý do).
# Chạy lại được (setup xoá lần làm trước). Thường 5–8 phút. Nạp bởi `lab` trên Mac (bash 3.2, set -e).
m1="$SESSION_DIR/../../mocks/m1"
( SESSION_DIR="$m1"; . "$m1/setup.sh" )
dns="$(vm "$LAB_CP" "kubectl --request-timeout=10s -n kube-system get svc kube-dns -o jsonpath='{.spec.clusterIP}'")"
vm cka-w1 "DNS_GOOD=$dns
$(cat "$m1/files/solve-node.sh")"
vm "$LAB_CP" "$(cat "$m1/files/solve.sh")"
. "$m1/files/scorelib.sh"
try=1
while :; do
  out="$(SESSION_DIR="$m1" MOCK_WHY=1; export MOCK_WHY; . "$m1/score.sh")"
  set -- $(mock_total "$out")
  echo "s52: điểm m1 sau lời giải chuẩn (lần chấm $try): $1/$2"
  [ "$1" = 100 ] && [ "$2" = 100 ] && break
  [ "$try" -lt 3 ] || { echo "lab: lời giải chuẩn của m1 chưa đủ 100/100 sau 3 lần chấm (câu thiếu ở trên)" >&2; exit 1; }
  try=$((try + 1)); sleep 30
done
