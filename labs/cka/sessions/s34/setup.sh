# s34 — chạy bởi `./labs/lab begin cka s34`: tạo ~/drills/s34 và đặt stranger.kubeconfig (kubeconfig "lạ" ba context để đọc;
# đặt lại mỗi lần vì người học không sửa nó), xoá answers.env của lần trước. Không đụng ~/dev.kubeconfig, ~/ops.kubeconfig.
vm_put "$SESSION_DIR/files/stranger.kubeconfig" "$LAB_CP" /tmp/lab-s34-stranger.kubeconfig
vm "$LAB_CP" "mkdir -p ~/drills/s34 && rm -f ~/drills/s34/answers.env
  install -m 600 /tmp/lab-s34-stranger.kubeconfig ~/drills/s34/stranger.kubeconfig; rm -f /tmp/lab-s34-stranger.kubeconfig"
echo "s34: đã tạo ~/drills/s34 (stranger.kubeconfig) và xoá answers.env của lần trước (nếu có)."
