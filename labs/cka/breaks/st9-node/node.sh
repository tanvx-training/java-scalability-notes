# st9-node trên một worker (user ubuntu, sudo; python3 + tomllib, PyYAML). Gọi bởi run.sh cùng thư mục, sau hai dòng
# STEP=prep|break và ROLE=w1|w2; chú thích ở run.sh. Không in gì khi thành công; lỗi đầu vào thì một dòng `lab: …` ra stderr
# và trả 1 trước khi gây gì. Không bao giờ đụng dữ liệu: chỉ hai tệp cấu hình và hai unit systemd.
set -e
H=/root/.lab/st9-node
TOML=/etc/containerd/config.toml
KCFG=/var/lib/kubelet/config.yaml
SOCK=unix:///var/run/containerd/containerd.sock
CA=/etc/kubernetes/pki/ca.crt
me=$(hostname)
miss() { echo "lab: $me: $1 chưa ở trạng thái tốt và chưa có bản lưu; thử: ./labs/lab restore cka s47" >&2; exit 1; }
# fail <bước>: một bước không có hiệu lực. Không nói bước đó làm gì (đây là đề bài sự cố).
fail() { echo "lab: không gây được sự cố st9-node trên $me (bước $1); chạy lại ./labs/lab begin cka s48, vẫn lỗi thì ./labs/lab restore cka s47" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
active() { [ "$(systemctl is-active "$1" 2>/dev/null)" = active ]; }
cri_ok() { active containerd && sudo timeout 5 crictl --runtime-endpoint "$SOCK" info >/dev/null 2>&1; }
# good_toml/good_kcfg <tệp>: tệp đọc được và đúng các trường sự cố sửa (SystemdCgroup của runc là true; runtime endpoint là
# socket containerd, clientCAFile là CA cluster). Đây chỉ là điều kiện để lưu bản tốt lần đầu.
good_toml() {
  sudo cat "$1" 2>/dev/null | python3 -c '
import sys, tomllib
d = tomllib.loads(sys.stdin.read())
r = d["plugins"]["io.containerd.cri.v1.runtime"]["containerd"]["runtimes"]["runc"]["options"]
sys.exit(0 if r.get("SystemdCgroup") is True else 1)' 2>/dev/null
}
good_kcfg() {
  sudo cat "$1" 2>/dev/null | python3 -c '
import sys, yaml
d = yaml.safe_load(sys.stdin)
ok = d.get("containerRuntimeEndpoint") == sys.argv[1] and d["authentication"]["x509"]["clientCAFile"] == sys.argv[2]
sys.exit(0 if ok else 1)' "$SOCK" "$CA" 2>/dev/null
}

case "$STEP" in
  prep)
    sudo install -d -m 700 $H
    # 1. Bản tốt: lưu lần đầu (chỉ khi trạng thái hiện tại là trạng thái tốt), các lần sau cài lại nếu khác.
    if ! sudo test -s $H/config.toml; then
      good_toml $TOML && cri_ok || miss "containerd ($TOML)"
      sudo cp -p $TOML $H/config.toml
    fi
    if ! sudo test -s $H/config.yaml; then
      good_kcfg $KCFG && active kubelet || miss "kubelet ($KCFG)"
      sudo cp -p $KCFG $H/config.yaml
    fi
    rt=0; rk=0
    sudo cmp -s $H/config.toml $TOML || { sudo install -m 644 -o root -g root $H/config.toml $TOML; rt=1; }
    sudo cmp -s $H/config.yaml $KCFG || { sudo install -m 644 -o root -g root $H/config.yaml $KCFG; rk=1; }
    sudo rm -f $H/field
    # 2. Hai unit enabled và chạy (lần trước bạn có thể đã stop/disable khi thử).
    sudo systemctl enable containerd kubelet >/dev/null 2>&1
    if [ $rt = 1 ] || ! active containerd; then sudo systemctl restart containerd || true; fi
    until_t 60 cri_ok || fail 1
    if [ $rk = 1 ] || ! active kubelet; then sudo systemctl restart kubelet || true; fi
    # kubelet đã chạy 15 giây liền (không phải một lần khởi động sắp thoát của vòng restart).
    until_t 90 sh -c '[ "$(systemctl is-active kubelet)" = active ] && [ $(( $(date +%s) - $(date -d "$(systemctl show -p ActiveEnterTimestamp --value kubelet)" +%s) )) -ge 15 ]' || fail 1
    ;;
  break)
    t=$(mktemp)
    trap 'rm -f "$t"' EXIT
    case "$ROLE" in
      w1)
        # "Một đồng nghiệp bật SystemdCgroup bằng sed": `True` không phải boolean TOML (chỉ có true/false), containerd không
        # đọc được tệp và thoát ngay.
        sudo cat $H/config.toml | sed 's/^\([[:space:]]*SystemdCgroup = \)true[[:space:]]*$/\1True/' > "$t"
        [ "$(sudo cat $H/config.toml | diff - "$t" | grep -c '^>')" = 1 ] || fail 2
        sudo install -m 644 -o root -g root "$t" $TOML
        sudo systemctl restart containerd >/dev/null 2>&1 || true
        until_t 30 sh -c '! sudo timeout 5 crictl --runtime-endpoint '"$SOCK"' info >/dev/null 2>&1' || fail 2
        ;;
      w2)
        # Một trong hai trường, chọn ngẫu nhiên mỗi lần (verify chấm W2_FIELD theo trường ghi ở $H/field): socket của
        # cri-dockerd ("chép cấu hình từ một node chạy Docker"), hay CA đổi đuôi .pem. kubelet thoát lúc khởi động,
        # systemd chạy lại sau 10 giây: vòng crash.
        if [ $((RANDOM % 2)) = 0 ]; then
          field=containerRuntimeEndpoint
          sudo cat $H/config.yaml | sed 's#^containerRuntimeEndpoint: .*#containerRuntimeEndpoint: unix:///var/run/cri-dockerd.sock#' > "$t"
        else
          field=clientCAFile
          sudo cat $H/config.yaml | sed 's#^\([[:space:]]*clientCAFile: \).*#\1/etc/kubernetes/pki/ca.pem#' > "$t"
        fi
        [ "$(sudo cat $H/config.yaml | diff - "$t" | grep -c '^>')" = 1 ] || fail 3
        echo "$field" | sudo tee $H/field >/dev/null
        sudo install -m 644 -o root -g root "$t" $KCFG
        sudo systemctl restart kubelet >/dev/null 2>&1 || true
        until_t 30 sh -c '[ "$(systemctl is-active kubelet)" != active ]' || fail 3
        ;;
      *) echo "lab: ROLE lạ: $ROLE" >&2; exit 2 ;;
    esac
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 2 ;;
esac
