# s31 — chạy bởi `./labs/lab begin cka s31`: tạo ~/drills/s31 (NetworkPolicy nháp allow-probe.yaml nằm ở đây); làm lại buổi
# thì đáp án của lần trước không được tính.
vm_put "$SESSION_DIR/files/allow-probe.yaml" "$LAB_CP" /tmp/lab-s31-allow-probe.yaml
vm "$LAB_CP" "mkdir -p ~/drills/s31 && rm -f ~/drills/s31/answers.env
  [ -f ~/drills/s31/allow-probe.yaml ] || install -m 644 /tmp/lab-s31-allow-probe.yaml ~/drills/s31/allow-probe.yaml
  rm -f /tmp/lab-s31-allow-probe.yaml"
echo "s31: đã tạo ~/drills/s31 (allow-probe.yaml) và xoá answers.env của lần trước (nếu có)."
