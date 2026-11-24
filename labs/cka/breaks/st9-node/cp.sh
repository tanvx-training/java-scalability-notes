# st9-node trên cka-cp (user ubuntu; kubectl). Gọi bởi run.sh cùng thư mục, sau dòng STEP=ready|down; chú thích ở run.sh.
# Không in gì khi thành công; lỗi thì một dòng `lab: …` ra stderr.
#   ready  sau khi hai worker về bản tốt: apiserver /readyz, bỏ cordon cka-w1/cka-w2 nếu lần trước bạn đã cordon (trạng thái
#          tốt là cả hai schedulable), chờ ba node Ready (tối đa 4 phút).
#   down   sau khi gây lỗi: chờ hai worker hết Ready (kubelet báo runtime hỏng, hay ngừng báo), tối đa 2 phút, để buổi bắt
#          đầu đúng lúc triệu chứng đã hiện.
set -e
k() { kubectl --request-timeout=10s "$@"; }
until_t() { local end=$(($(date +%s) + $1)); shift; until "$@"; do [ "$(date +%s)" -lt "$end" ] || return 1; sleep 3; done; }
readyz() { [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; }
nready() { k get node cka-cp cka-w1 cka-w2 -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' 2>/dev/null | grep -c '^True$'; }
all_ready() { [ "$(nready)" = 3 ]; }
workers_down() { [ "$(k get node cka-w1 cka-w2 -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' 2>/dev/null | grep -c '^True$')" = 0 ]; }
case "$STEP" in
  ready)
    until_t 180 readyz || { echo "lab: apiserver chưa sẵn sàng sau 3 phút" >&2; exit 1; }
    for n in cka-w1 cka-w2; do
      [ "$(k get node $n -o jsonpath='{.spec.unschedulable}' 2>/dev/null)" = true ] && k uncordon $n >/dev/null
    done
    until_t 240 all_ready || { echo "lab: ba node chưa Ready sau 4 phút; chạy lại ./labs/lab begin cka s48, vẫn lỗi thì ./labs/lab restore cka s47" >&2; exit 1; }
    ;;
  down)
    until_t 120 workers_down || { echo "lab: không gây được sự cố st9-node (bước 4); chạy lại ./labs/lab begin cka s48" >&2; exit 1; }
    ;;
  *) echo "lab: STEP lạ: $STEP" >&2; exit 2 ;;
esac
