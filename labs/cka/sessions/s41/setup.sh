# s41 — chạy bởi `./labs/lab begin cka s41`: tạo ~/drills/s41 và đặt vòng request cho sẵn ~/drills/s41/loop.sh (files/loop.sh,
# ghi đè bản cũ). Buổi không có answers.env; không xoá loop.log của lần trước (lần `loop.sh start` sau ghi đè nó), không đụng
# release, chart hay node.
t="$(mktemp -t s41-loop)"
cp "$SESSION_DIR/files/loop.sh" "$t"
vm_put "$t" "$LAB_CP" /tmp/s41-loop.sh
rm -f "$t"
vm "$LAB_CP" "mkdir -p ~/drills/s41 && install -m 0755 /tmp/s41-loop.sh ~/drills/s41/loop.sh && rm -f /tmp/s41-loop.sh"
echo "s41: đã tạo ~/drills/s41 và đặt ~/drills/s41/loop.sh (start|stop|run <log>)."
