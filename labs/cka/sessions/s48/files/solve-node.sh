# s48 — lời giải trên MỘT worker (user ubuntu, sudo; python3), gọi bởi apply.sh cho cka-w1 rồi cka-w2. Không biết trước node
# hỏng ở đâu: đi đúng thứ tự của buổi, tầng dưới trước. (1) systemctl status hai unit, systemctl cat kubelet (unit + drop-in).
# (2) containerd không trả lời `crictl info` thì đọc journalctl -u containerd, lấy dòng/cột của lỗi TOML, xem đúng dòng đó,
# sửa giá trị boolean viết hoa (`True` → `true`, TOML chỉ có true/false), kiểm tệp bằng tomllib trước khi restart. (3) kubelet
# không chạy yên 12 giây (vòng restart của systemd) thì đọc dòng `"command failed"` cuối cùng trong journalctl -u kubelet:
# runtime endpoint không nối được (mà không phải socket containerd) → trả containerRuntimeEndpoint về socket containerd;
# `open <tệp>: no such file` → tìm trường nào trong config.yaml trỏ tệp đó, trả về CA cluster. In FIELD=<trường đã sửa>
# cho apply.sh. Chạy lại được (node đã khoẻ thì chỉ in trạng thái).
set -e
SOCK=unix:///var/run/containerd/containerd.sock
KCFG=/var/lib/kubelet/config.yaml
TOML=/etc/containerd/config.toml
me=$(hostname)
log() { echo "s48 $me: $*"; }
die() { echo "s48 $me: $*" >&2; exit 1; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 2; done; }
cri_ok() { sudo timeout 5 crictl --runtime-endpoint "$SOCK" info >/dev/null 2>&1; }
# kubelet_steady: active ở cả sáu lần nhìn, 2 giây một lần (RestartSec=10: vòng crash luôn lộ ra trong 12 giây).
kubelet_steady() { local i; for i in 1 2 3 4 5 6; do [ "$(systemctl is-active kubelet)" = active ] || return 1; sleep 2; done; }

log "1. systemctl is-active containerd kubelet: $(systemctl is-active containerd | tr '\n' ' ')/ $(systemctl is-active kubelet)"
systemctl cat kubelet 2>/dev/null | grep -E '^# /|^(ExecStart|EnvironmentFile)=' | sed 's/^/    /'

if ! cri_ok; then
  log "2. containerd không trả lời crictl: journalctl -u containerd"
  line=$(sudo journalctl -u containerd --since -15min --no-pager | grep -E 'failed to unmarshal TOML' | tail -n1 || true)
  echo "    $line" | cut -c1-200
  row=$(printf '%s\n' "$line" | sed -n 's/.*at row \([0-9]*\) column.*/\1/p')
  [ -n "$row" ] || die "không đọc được dòng lỗi TOML trong journalctl -u containerd"
  echo "    dòng $row: $(sed -n "${row}p" $TOML | sed 's/^ *//')"
  sudo sed -i "${row}s/= True[[:space:]]*$/= true/; ${row}s/= False[[:space:]]*$/= false/" $TOML
  sudo cat $TOML | python3 -c 'import sys, tomllib; tomllib.loads(sys.stdin.read())' || die "$TOML vẫn chưa đọc được"
  sudo systemctl restart containerd
  until_t 60 cri_ok || die "containerd chưa trả lời sau 60 giây"
  log "   containerd chạy lại: $(sudo crictl --runtime-endpoint $SOCK info 2>/dev/null | python3 -c 'import json,sys; c=json.load(sys.stdin)["status"]["conditions"]; print(" ".join("%s=%s" % (x["type"], x["status"]) for x in c))')"
fi

if ! kubelet_steady; then
  log "3. kubelet không chạy yên (vòng restart): journalctl -u kubelet, dòng \"command failed\" cuối cùng"
  line=$(sudo journalctl -u kubelet --since -5min --no-pager | grep '"command failed"' | tail -n1 || true)
  echo "    $line" | sed 's/.*"command failed"/"command failed"/' | cut -c1-200
  field=""
  case "$line" in
    *"validate CRI v1 runtime API for endpoint"*)
      ep=$(sudo python3 -c 'import sys, yaml; print(yaml.safe_load(open(sys.argv[1]))["containerRuntimeEndpoint"])' $KCFG)
      [ "$ep" != "$SOCK" ] || die "kubelet không nối được socket containerd (containerd chưa chạy?)"
      echo "    containerRuntimeEndpoint: $ep (socket có: $(ls /var/run/*.sock /run/containerd/*.sock 2>/dev/null | tr '\n' ' '))"
      sudo sed -i "s#^containerRuntimeEndpoint: .*#containerRuntimeEndpoint: $SOCK#" $KCFG
      field=containerRuntimeEndpoint ;;
    *"no such file or directory"*)
      f=$(printf '%s\n' "$line" | grep -o 'open /[^:]*' | head -n1 | cut -c6-)
      [ -n "$f" ] || die "không đọc được tệp thiếu trong log kubelet"
      echo "    $(sudo grep -n -F "$f" $KCFG || echo "$f không có trong $KCFG")"
      field=$(sudo grep -F "$f" $KCFG | head -n1 | sed 's/^[[:space:]]*\([A-Za-z]*\):.*/\1/')
      [ "$field" = clientCAFile ] || die "trường trỏ $f là '$field', lời giải này chỉ biết clientCAFile"
      sudo sed -i "s#\(clientCAFile: \)$f#\1/etc/kubernetes/pki/ca.crt#" $KCFG ;;
    *) die "chưa nhận ra lỗi kubelet: $(echo "$line" | cut -c1-120)" ;;
  esac
  sudo python3 -c 'import sys, yaml; yaml.safe_load(open(sys.argv[1]))' $KCFG || die "$KCFG không còn là YAML hợp lệ"
  sudo systemctl restart kubelet
  until_t 60 kubelet_steady || die "kubelet chưa chạy yên sau 60 giây"
  log "   kubelet chạy lại (trường đã sửa: $field)"
  echo "FIELD=$field"
fi
log "4. containerd $(systemctl is-active containerd)/$(systemctl is-enabled containerd), kubelet $(systemctl is-active kubelet)/$(systemctl is-enabled kubelet)"
