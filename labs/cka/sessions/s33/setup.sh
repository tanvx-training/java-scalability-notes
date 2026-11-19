# s33 — chạy bởi `./labs/lab begin cka s33`: tạo ~/drills/s33 (bài nháp CSR nằm ở đây) và ~/users (key, CSR, cert của dev/ops);
# làm lại buổi thì đáp án của lần trước không được tính. Không xoá key hay cert đã có: cert là thứ s34 trở đi dùng.
vm "$LAB_CP" "mkdir -p ~/drills/s33 ~/users && rm -f ~/drills/s33/answers.env"
echo "s33: đã tạo ~/drills/s33, ~/users và xoá answers.env của lần trước (nếu có)."
