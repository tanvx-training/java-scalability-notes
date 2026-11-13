# s02 — đặt bài tập ~/drills/s02/broken.yaml trên cka-cp (chạy bởi `./labs/lab begin cka s02`).
# Không ghi đè bài đang làm dở: muốn làm lại thì xoá tệp rồi chạy begin lần nữa.
if vm "$LAB_CP" "test -f ~/drills/s02/broken.yaml"; then
  echo "s02: ~/drills/s02/broken.yaml đã có, giữ nguyên (xoá tệp rồi chạy lại begin nếu muốn làm lại từ đầu)"
else
  vm "$LAB_CP" "mkdir -p ~/drills/s02"
  vm_put "$SESSION_DIR/files/broken.yaml" "$LAB_CP" /home/ubuntu/drills/s02/broken.yaml
  echo "s02: đã đặt ~/drills/s02/broken.yaml trên $LAB_CP"
fi
