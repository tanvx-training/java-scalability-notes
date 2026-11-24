# s46 — cổng ghép lên trước s26/files/wait.sh (bên gửi: vm "$LAB_CP" "$(cat bootwait.sh)
# $(cat s26/files/wait.sh)"), dùng cho verify của chặng 9. wait.sh chờ tới 420 giây cho tới khi gateway, catalog, order đủ
# replica sẵn sàng: đúng sau khi VM vừa bật (status trong API còn cũ), nhưng trong một buổi sự cố thì chính sự cố làm shop thiếu
# replica, và verify ngay sau `begin` phải đỏ trong vài giây chứ không chờ 7 phút (đo trên s46: 7 phút 02 giây khi không có
# cổng này, 22 giây khi có). Vì vậy chỉ chờ như s26 khi cka-cp mới chạy chưa tới 15 phút (cùng ngưỡng `recent` của wait.sh); còn lại chỉ chờ
# apiserver /readyz tối đa 60 giây. Chạy trên cka-cp.
if [ "$(cut -d. -f1 /proc/uptime)" -ge 900 ]; then
  end=$(($(date +%s) + 60))
  until [ "$(kubectl --request-timeout=5s get --raw /readyz 2>/dev/null)" = ok ] || [ "$(date +%s)" -ge "$end" ]; do sleep 2; done
  exit 0
fi
