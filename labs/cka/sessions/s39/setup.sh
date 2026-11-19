# s39 — chạy bởi `./labs/lab begin cka s39`: tạo ~/drills/s39 và xoá answers.env của lần trước (làm lại buổi thì đáp án cũ
# không được tính). Không đụng CRD, release hay tệp trong ~/shop/ đã có.
vm "$LAB_CP" "mkdir -p ~/drills/s39 && rm -f ~/drills/s39/answers.env"
echo "s39: đã tạo ~/drills/s39 và xoá answers.env của lần trước (nếu có)."
