#!/usr/bin/env bash
# loop.sh — vòng request cho sẵn của s41 và s42 (đặt vào ~/drills/<buổi>/loop.sh bởi `begin`). Chạy trên cka-cp bằng user ubuntu.
#
#   ~/drills/s41/loop.sh start ~/drills/s41/loop.log    chạy nền (ghi PID vào <log>.pid), in ngay đường dẫn log
#   ~/drills/s41/loop.sh stop  ~/drills/s41/loop.log    dừng vòng đang ghi vào log đó
#   ~/drills/s41/loop.sh run   ~/drills/s41/loop.log    chạy tiền cảnh (Ctrl-C để dừng)
#
# Mỗi 0,5 giây một GET tới http://<IP cka-w1>:30180/api/products (NodePort gateway-nodeport của s27; đổi bằng LOOP_URL), tối
# đa 5 giây một request (chậm hơn thế mới tính là mất). Mỗi request một dòng:
#   <epoch có mili giây> <giờ> <mã HTTP, 000 = không nối được/hết giờ> <giây> <mã thoát curl: 0, 7 bị từ chối, 28 hết giờ, 52/56 đứt>
# Song song, cứ 2 giây đọc node (cordon, phiên bản kubelet) và số Pod gateway/catalog/order đang Running trên từng node; khi
# có gì đổi thì ghi một dòng bắt đầu bằng '#':
#   # <epoch> <giờ> nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/cordon … pods cka-w1=0 cka-w2=6 [ev:cka-w1=2]
# (ev:<node>=N: số Pod trên node đang bị đuổi qua Eviction API, condition DisruptionTarget=EvictionByEvictionAPI)
# apiserver không trả lời (lúc nâng control plane) thì bỏ qua lượt đó, không ghi gì. Mỗi lần `start`/`run` ghi đè log cũ.
set -u
cmd="${1:-}"; log="${2:-}"
[ -n "$cmd" ] && [ -n "$log" ] || { echo "cách dùng: $0 start|stop|run <tệp log>" >&2; exit 2; }
pidf="$log.pid"
k() { kubectl --request-timeout=3s "$@"; }
now() { date +%s.%3N; }
hms() { date +%H:%M:%S; }

watch_nodes() {
  local last="" n p s
  while :; do
    n=$(k get nodes -o jsonpath='{range .items[*]}{.metadata.name}={.status.nodeInfo.kubeletVersion}/{.spec.unschedulable}{" "}{end}' 2>/dev/null) || n=""
    # Một lệnh cho cả hai: node của mỗi Pod gateway/catalog/order, phase, và lý do của condition DisruptionTarget
    # (EvictionByEvictionAPI khi Pod bị đuổi qua Eviction API, như drain làm; `kubectl delete pod` không đặt nó).
    p=$(k -n shop get pod -l 'app in (gateway,catalog,order)' \
          -o jsonpath='{range .items[*]}{.spec.nodeName} {.status.phase} {.status.conditions[?(@.type=="DisruptionTarget")].reason}{"\n"}{end}' 2>/dev/null) || p="ERR"
    if [ -n "$n" ] && [ "$p" != "ERR" ]; then
      n=$(printf '%s' "$n" | sed -e 's#/true#/cordon#g' -e 's#/false#/sched#g' -e 's#/ #/sched #g' -e 's#/$#/sched#' -e 's/ *$//')
      local pc="" ev="" c
      for x in $(printf '%s' "$n" | tr ' ' '\n' | sed 's/=.*//'); do
        pc="$pc $x=$(printf '%s\n' "$p" | awk -v n="$x" '$1==n && $2=="Running"' | grep -c .)"
        c=$(printf '%s\n' "$p" | awk -v n="$x" '$1==n && $3=="EvictionByEvictionAPI"' | grep -c .)
        [ "$c" -gt 0 ] && ev="$ev ev:$x=$c"
      done
      s="nodes $n pods${pc}${ev}"
      if [ "$s" != "$last" ]; then echo "# $(date +%s) $(hms) $s"; last="$s"; fi
    fi
    sleep 2
  done
}

run_loop() {
  local url="${LOOP_URL:-}" ip t0 r rc code dt
  if [ -z "$url" ]; then
    ip=$(k get node cka-w1 -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)
    [ -n "$ip" ] || { echo "không đọc được IP của cka-w1" >&2; exit 1; }
    url="http://$ip:30180/api/products"
  fi
  : > "$log"
  echo "# $(date +%s) $(hms) start $url" >> "$log"
  watch_nodes >> "$log" &
  local wpid=$!
  trap 'kill $wpid 2>/dev/null; echo "# $(date +%s) $(hms) stop" >> "$log"; exit 0' INT TERM
  while :; do
    t0=$(date +%s%N)
    rc=0; r=$(curl -s -o /dev/null --max-time 5 -w '%{http_code} %{time_total}' "$url" 2>/dev/null) || rc=$?
    code=${r%% *}; dt=${r#* }
    [ -n "$code" ] || { code=000; dt=5; }
    echo "$(now) $(hms) $code $dt $rc" >> "$log"
    # Giữ nhịp 2 request/giây: nghỉ phần còn lại của 0,5 giây.
    dt=$(( 500 - ($(date +%s%N) - t0) / 1000000 ))
    [ "$dt" -gt 0 ] && sleep "0.$(printf '%03d' "$dt")"
  done
}

case "$cmd" in
  run) run_loop ;;
  start)
    if [ -f "$pidf" ] && kill -0 "$(cat "$pidf")" 2>/dev/null; then echo "đang chạy (PID $(cat "$pidf")), ghi vào $log"; exit 0; fi
    setsid nohup "$0" run "$log" >/dev/null 2>&1 < /dev/null &
    echo $! > "$pidf"
    sleep 1
    echo "đã chạy nền (PID $(cat "$pidf")), ghi vào $log; dừng: $0 stop $log"
    ;;
  stop)
    if [ -f "$pidf" ] && kill -0 "$(cat "$pidf")" 2>/dev/null; then
      kill "$(cat "$pidf")"; sleep 1; rm -f "$pidf"
      echo "đã dừng; $(grep -vc '^#' "$log") request, $(grep -v '^#' "$log" | awk '$3 != 200' | wc -l | tr -d ' ') lỗi"
    else
      rm -f "$pidf"; echo "không có vòng nào đang chạy cho $log"
    fi
    ;;
  *) echo "cách dùng: $0 start|stop|run <tệp log>" >&2; exit 2 ;;
esac
