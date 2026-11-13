# s01 — kiểm: ba VM Running; mỗi VM phân giải đúng IP hai máy còn lại; cka-cp ssh sang worker không mật khẩu.
# Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).

for v in $LAB_VMS; do
  expect_eq "$v đang Running" "Running" vm_state "$v"
done

for v in $LAB_VMS; do
  for o in $LAB_VMS; do
    [ "$o" = "$v" ] && continue
    ip="$(vm_field "$o" 3)"; ip="${ip%%;*}"
    expect_eq "$v: getent hosts $o → ${ip:-?}" "${ip:-?}" vm "$v" "getent hosts $o | awk '{print \$1; exit}'"
  done
done

for o in $LAB_VMS; do
  [ "$o" = "$LAB_CP" ] && continue
  expect_eq "$LAB_CP: ssh -o BatchMode=yes $o hostname" "$o" \
    vm "$LAB_CP" "ssh -o BatchMode=yes -o ConnectTimeout=5 $o hostname"
done

assert_summary
