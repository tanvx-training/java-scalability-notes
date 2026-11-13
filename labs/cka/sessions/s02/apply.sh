# s02 — lời giải chuẩn: dotfile phòng thi cho user ubuntu trên cka-cp và bản đã sửa của broken.yaml.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
vm "$LAB_CP" "mkdir -p ~/drills/s02"
vm_put "$SESSION_DIR/files/vimrc" "$LAB_CP" /home/ubuntu/.vimrc
vm_put "$SESSION_DIR/files/tmux.conf" "$LAB_CP" /home/ubuntu/.tmux.conf
# Từng dòng của files/bashrc-exam được thêm riêng nếu ~/.bashrc chưa có đúng dòng đó (chạy được từ trạng thái dở dang)
vm_put "$SESSION_DIR/files/bashrc-exam" "$LAB_CP" /tmp/bashrc-exam
vm "$LAB_CP" "while IFS= read -r line; do grep -qxF -- \"\$line\" ~/.bashrc || printf '%s\n' \"\$line\" >> ~/.bashrc; done < /tmp/bashrc-exam; rm -f /tmp/bashrc-exam"
vm_put "$SESSION_DIR/files/expected.yaml" "$LAB_CP" /home/ubuntu/drills/s02/broken.yaml
