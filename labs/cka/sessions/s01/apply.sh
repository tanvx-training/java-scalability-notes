# s01 — lời giải chuẩn: khoá ssh trên cka-cp, phát sang worker, khai tên ba máy trong /etc/hosts.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).

hosts=""
for v in $LAB_VMS; do
  ip="$(vm_field "$v" 3)"
  ip="${ip%%;*}"
  [ -n "$ip" ] || { echo "s01: chưa lấy được IP của $v" >&2; exit 1; }
  hosts="$hosts$ip $v
"
done
names="$(echo $LAB_VMS | tr ' ' '|')"

# /etc/hosts do cloud-init sinh lại mỗi lần khởi động (manage_etc_hosts: true),
# nên ghi vào cả tệp mẫu /etc/cloud/templates/hosts.debian.tmpl để bền qua reboot.
for v in $LAB_VMS; do
  vm "$v" "sudo bash -euc '
for f in /etc/hosts /etc/cloud/templates/hosts.debian.tmpl; do
  [ -f \$f ] || continue
  sed -i -E \"/^[0-9.]+[[:space:]]+($names)([[:space:]]|\\\$)/{/^127\\./!d}\" \$f
  printf \"%s\" \"$hosts\" >> \$f
done'"
done

# Cặp khoá của user ubuntu trên cka-cp (giữ khoá cũ nếu đã có)
vm "$LAB_CP" "test -f ~/.ssh/id_ed25519 || ssh-keygen -q -t ed25519 -N '' -f ~/.ssh/id_ed25519"
pub="$(vm "$LAB_CP" "cat ~/.ssh/id_ed25519.pub")"
[ -n "$pub" ] || { echo "s01: không đọc được khoá công khai" >&2; exit 1; }

# Phát khoá công khai sang các worker: thêm vào cuối authorized_keys, không ghi đè khoá của multipass
for v in $LAB_VMS; do
  [ "$v" = "$LAB_CP" ] && continue
  vm "$v" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
grep -qxF '$pub' ~/.ssh/authorized_keys || echo '$pub' >> ~/.ssh/authorized_keys"
  # Ghi khoá host của worker vào known_hosts để ssh lần đầu không hỏi yes/no
  vm "$LAB_CP" "ssh-keygen -F $v >/dev/null 2>&1 || ssh-keyscan -t ed25519 $v 2>/dev/null >> ~/.ssh/known_hosts"
done
