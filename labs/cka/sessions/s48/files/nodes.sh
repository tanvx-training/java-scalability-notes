# s48 — gom dữ kiện của ba node trên Mac (bash 3.2), dùng chung cho verify s48 và check s49. Nạp bằng
#   . "$SESSION_DIR/files/nodes.sh"          (s48)
#   . "$SESSION_DIR/../s48/files/nodes.sh"    (s49)
#
# HỢP ĐỒNG: s48_nodes <thư mục files của s48>
#   Gửi files/node-facts.sh lên từng VM của $LAB_VMS (một lần gọi vm mỗi node, không gọi apiserver) và in đúng bốn dòng:
#     NODES_FILES   `đạt` hay lý do: config.toml, config.yaml của cka-w1 và cka-w2 như bản tốt của sự cố st9-node.
#     NODES_UNITS   `đạt` hay lý do: containerd và kubelet active (kubelet chạy liền ≥ 15 giây) và enabled trên ba node.
#     W1_CGROUP     cgroupDriver trong /var/lib/kubelet/config.yaml của cka-w1 (đáp án NODE_DEBUG_CGROUP).
#     W2_FIELD_SET  trường config.yaml của cka-w2 mà lần begin gần nhất đã sửa (rỗng nếu chưa có).
#   Lý do ghép theo node (`w1: …; w2: …`; mỗi node ≤ 170 ký tự). Luôn trả 0 (dùng trong `$(…)` được). Chỉ đọc.
s48_nodes() {
  local d="$1" v s x out files="" units="" cg="" fs=""
  for v in $LAB_VMS; do
    out="$(vm "$v" "$(cat "$d/node-facts.sh")" 2>/dev/null)" || true
    s="${v#cka-}"
    x="$(printf '%s\n' "$out" | sed -n 's/^FILES=//p' | head -n1)"
    [ "$v" = "$LAB_CP" ] || [ "$x" = "đạt" ] || files="${files:+$files; }$s: ${x:-không đọc được}"
    x="$(printf '%s\n' "$out" | sed -n 's/^UNITS=//p' | head -n1)"
    [ "$x" = "đạt" ] || units="${units:+$units; }$s: ${x:-không đọc được}"
    [ "$v" = cka-w1 ] && cg="$(printf '%s\n' "$out" | sed -n 's/^CGROUP=//p' | head -n1)"
    [ "$v" = cka-w2 ] && fs="$(printf '%s\n' "$out" | sed -n 's/^FIELD=//p' | head -n1)"
  done
  echo "NODES_FILES=${files:-đạt}"
  echo "NODES_UNITS=${units:-đạt}"
  echo "W1_CGROUP=$cg"
  echo "W2_FIELD_SET=$fs"
  return 0
}
