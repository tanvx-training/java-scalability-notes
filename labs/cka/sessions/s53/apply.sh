# s53 — lời giải chuẩn của buổi Mock 2: dựng đề m2 như `./labs/lab mock cka m2 start` (nạp mocks/m2/setup.sh với SESSION_DIR
# của đề), chạy lời giải chuẩn cả 16 câu (mocks/m2/files/solve.sh PART=1 trên cka-cp: q1 và các câu "lúc sự cố";
# solve-node.sh trên cka-w2: phần node của q16; solve.sh PART=2: mọi câu còn lại và vòng chờ), rồi chấm bằng mocks/m2/score.sh
# tới khi đủ 100/100: tối đa 3 lần, cách nhau 30 giây (vài tiêu chí đo theo thời gian thật — data plane nạp route, policy có
# hiệu lực, quota tính lại — có thể trễ một nhịp sau vòng chờ của solve.sh); lần thứ ba vẫn thiếu thì DỪNG LỖI (in câu thiếu
# và lý do). Chạy lại được (setup xoá lần làm trước). Thường 4–7 phút; chậm nhất ~30 phút (setup khi VM vừa bật ~20 phút,
# solve ~6 phút, ba lần chấm). Nạp bởi `lab` trên Mac (bash 3.2, set -e).
m2="$SESSION_DIR/../../mocks/m2"
( SESSION_DIR="$m2"; . "$m2/setup.sh" )
vm "$LAB_CP" "PART=1
$(cat "$m2/files/solve.sh")"
vm cka-w2 "$(cat "$m2/files/solve-node.sh")"
vm "$LAB_CP" "PART=2
$(cat "$m2/files/solve.sh")"
. "$m2/../m1/files/scorelib.sh"
try=1
while :; do
  out="$(SESSION_DIR="$m2" MOCK_WHY=1; export MOCK_WHY; . "$m2/score.sh")"
  set -- $(mock_total "$out")
  echo "s53: điểm m2 sau lời giải chuẩn (lần chấm $try): $1/$2"
  [ "$1" = 100 ] && [ "$2" = 100 ] && break
  [ "$try" -lt 3 ] || { echo "lab: lời giải chuẩn của m2 chưa đủ 100/100 sau 3 lần chấm (câu thiếu ở trên)" >&2; exit 1; }
  try=$((try + 1)); sleep 30
done
