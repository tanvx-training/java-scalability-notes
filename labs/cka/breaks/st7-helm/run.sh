# Lỗi st7-helm: "một đồng nghiệp" upgrade hai release rồi bỏ dở (không in ra đã làm gì: đây là đề bài sự cố). Phần chạy trên
# cka-cp ở break.sh (cùng thư mục; chú thích đầu tệp đó ghi đủ ba lỗi và cách chạy lại). Mất ~1,5 phút: lần upgrade lỗi của
# shop chờ hết --timeout 60s. Cần trạng thái cuối s39; thiếu thì dừng, không gây gì. Nạp bởi `lab` trên máy Mac (bash 3.2,
# set -e).
vm "$LAB_CP" "$(cat "$SESSION_DIR/break.sh")"
