# s36 — gây sự cố của buổi (chạy bởi `./labs/lab begin cka s36`). Không nói đã làm gì: đó là việc của bạn.
# Làm lại buổi: đáp án của lần trước không được tính. forbidden.txt là thông báo cho sẵn của t5 (output thật, đo trên lab).
vm "$LAB_CP" "mkdir -p ~/drills/s36 && rm -f ~/drills/s36/answers.env
  cat > ~/drills/s36/forbidden.txt <<'EOF'
\$ kubectl --kubeconfig ~/dev.kubeconfig -n shop scale deploy order --replicas=2
Error from server (Forbidden): deployments.apps \"order\" is forbidden: User \"dev\" cannot patch resource \"deployments/scale\" in API group \"apps\" in the namespace \"shop\"
EOF"
echo "s36: đã xoá ~/drills/s36/answers.env của lần trước (nếu có), đặt ~/drills/s36/forbidden.txt."
lab_break st6-access
echo "s36: đã gây sự cố. Bấm giờ 20 phút; bắt đầu từ 'k --kubeconfig ~/dev.kubeconfig get pods' và 'k --kubeconfig ~/ops.kubeconfig get nodes' trên $LAB_CP."
