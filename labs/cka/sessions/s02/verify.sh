# s02 — kiểm dotfile phòng thi và tệp YAML đã sửa trên cka-cp. Chỉ đọc.
# Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
opt() { vm "$cp" "grep -Eq '^[[:space:]]*set(.*[[:space:]])($1)([[:space:]]|\$)' ~/.vimrc"; }
expect_ok "~/.vimrc có expandtab" opt 'expandtab|et'
expect_ok "~/.vimrc có tabstop=2" opt 'tabstop=2|ts=2'
expect_ok "~/.vimrc có shiftwidth=2" opt 'shiftwidth=2|sw=2'

rc() { vm "$cp" "grep -Eq '$1' ~/.bashrc"; }
expect_ok "~/.bashrc có alias k=kubectl" rc '^[[:space:]]*alias k=.?kubectl.?([[:space:]]|$)'
expect_ok "~/.bashrc có export do=" rc '^[[:space:]]*export do='
expect_ok "~/.bashrc có export now=" rc '^[[:space:]]*export now='

f='~/drills/s02/broken.yaml'
expect_ok "broken.yaml parse được bằng python3 yaml" \
  vm "$cp" "python3 -c 'import sys, yaml; yaml.safe_load(open(sys.argv[1]))' $f"
# So sau khi chuẩn hoá (bỏ chú thích, thứ tự khoá, kiểu trích dẫn): nội dung files/expected.yaml đi qua base64.
want="$(base64 < "$SESSION_DIR/files/expected.yaml" | tr -d '\n')"
expect_eq "broken.yaml khớp bản chuẩn sau khi chuẩn hoá" "khớp" \
  vm "$cp" "echo $want | base64 -d | python3 -c '
import sys, yaml
want = yaml.safe_load(sys.stdin)
try:
    got = yaml.safe_load(open(sys.argv[1]))
except Exception as e:
    print(\"chưa parse được\"); sys.exit(0)
print(\"khớp\" if got == want else \"lệch\")' $f"
assert_summary
