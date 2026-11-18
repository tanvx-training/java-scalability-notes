# s28 — chạy bởi `./labs/lab begin cka s28`: tạo ~/drills/s28 (làm lại buổi thì đáp án của lần trước không được tính), và bật
# TCP MTU probing trên cả ba node (files/node-net.sh): bài có thể dời Pod CoreDNS sang worker, worker phải kéo được image từ
# registry.k8s.io qua đường mạng có MTU nhỏ hơn 1500.
vm "$LAB_CP" "mkdir -p ~/drills/s28 && rm -f ~/drills/s28/answers.env"
for n in $LAB_VMS; do vm "$n" "$(cat "$SESSION_DIR/files/node-net.sh")"; done
echo "s28: đã tạo ~/drills/s28 và xoá answers.env của lần trước (nếu có)."
