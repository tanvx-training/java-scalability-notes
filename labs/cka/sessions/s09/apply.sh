# s09 — lời giải chuẩn: gây đúng sự cố của buổi rồi sửa theo cách chẩn đoán ra (để selftest chứng minh cách sửa khớp lỗi):
# cka-w1: /etc/default/kubelet ghi đè --config bằng đường dẫn không tồn tại → trả KUBELET_EXTRA_ARGS về rỗng, restart;
# cka-w2: kubelet bị stop + disable → enable --now. Chờ ba node Ready. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
lab_break st1-node-notready
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  vm "$v" "sudo bash -euc '
if grep -q -- \"--config=\" /etc/default/kubelet 2>/dev/null; then
  printf \"KUBELET_EXTRA_ARGS=\n\" > /etc/default/kubelet
fi
systemctl enable kubelet >/dev/null 2>&1
systemctl restart kubelet'"
done
# Ngay sau khi gây lỗi, node có thể vẫn còn Ready (chưa hết thời gian ân hạn), nên `kubectl wait Ready` một mình không
# chứng minh gì: chờ kubelet active và enabled trên từng worker trước, rồi mới chờ node Ready.
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  vm "$v" "for i in \$(seq 1 30); do systemctl is-active --quiet kubelet && break; sleep 2; done
    systemctl is-active --quiet kubelet && systemctl is-enabled --quiet kubelet" \
    || { echo "s09: kubelet trên $v chưa active/enabled sau khi sửa" >&2; exit 1; }
done
# Sau khi bật VM (vd. ngay sau restore về mốc st1-done) apiserver cần một lúc mới nhận kết nối: chờ có giới hạn.
vm "$LAB_CP" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
echo "s09: chờ ba node Ready"
vm "$LAB_CP" "kubectl wait --for=condition=Ready node --all --timeout=300s >/dev/null"
