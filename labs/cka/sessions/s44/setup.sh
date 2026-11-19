# s44 — chạy bởi `./labs/lab begin cka s44`: tạo ~/drills/s44, ghi mốc giờ (epoch, giây) vào ~/drills/s44/started và xoá
# answers.env của lần trước. Verify đòi mọi cert kubeadm ký lại SAU mốc này (kubeadm upgrade apply ở s42 đã tự gia hạn, nên
# "còn hạn xa" chưa chứng minh bạn đã gia hạn). Chạy lại begin là đặt mốc mới: phải gia hạn lại. Không đụng cert, ha.txt.
vm "$LAB_CP" 'mkdir -p ~/drills/s44 && date +%s > ~/drills/s44/started && rm -f ~/drills/s44/answers.env && echo "s44: mốc ~/drills/s44/started = $(cat ~/drills/s44/started) ($(date -d @$(cat ~/drills/s44/started) "+%F %T %Z")), đã xoá answers.env của lần trước (nếu có)."'
