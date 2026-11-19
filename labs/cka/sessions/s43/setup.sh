# s43 — chạy bởi `./labs/lab begin cka s43`: cài etcdctl, etcdutl v3.7.0 vào /usr/local/bin trên cka-cp (files/etcd-tools.sh,
# bản ghim có sha256; đã có thì bỏ qua), tạo ~/drills/s43 và /opt/backup, xoá answers.env của lần trước. Không đụng etcd,
# manifest hay snapshot cũ.
vm "$LAB_CP" "$(cat "$SESSION_DIR/files/etcd-tools.sh")"
vm "$LAB_CP" "mkdir -p ~/drills/s43 && sudo mkdir -p /opt/backup && rm -f ~/drills/s43/answers.env"
echo "s43: etcdctl/etcdutl sẵn sàng, đã tạo ~/drills/s43 và /opt/backup, xoá answers.env của lần trước (nếu có)."
