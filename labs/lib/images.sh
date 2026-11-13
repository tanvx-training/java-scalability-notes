#!/bin/bash
# Nạp image Docker vào containerd của từng VM (không cần registry).
# Chương trình cung cấp LAB_IMAGES (danh sách), lab_build_images (hàm build) và tuỳ chọn LAB_CTR_NAMESPACE.

# images_missing: in các image trong LAB_IMAGES mà docker chưa có
images_missing() {
  local img
  for img in $LAB_IMAGES; do
    docker image inspect "$img" >/dev/null 2>&1 || echo "$img"
  done
}

# images_load: chọn VM nhận được image (đang chạy, có containerd) TRƯỚC, rồi mới build nếu thiếu, docker save
# một lần, chuyển và import vào từng VM đã chọn. Không VM nào nhận được thì dừng với mã khác 0, không build.
# Namespace containerd lấy từ LAB_CTR_NAMESPACE của chương trình (mặc định "default" của containerd).
images_load() {
  local tar v n=0 targets="" ns
  [ -n "${LAB_IMAGES:-}" ] || die "chương trình '$LAB_PROGRAM' không khai báo LAB_IMAGES"
  ns="${LAB_CTR_NAMESPACE:-default}"
  case "$ns" in ''|*[!a-zA-Z0-9._-]*) die "chương trình '$LAB_PROGRAM': LAB_CTR_NAMESPACE '$ns' không hợp lệ" ;; esac
  require_cmd docker "cài Docker Desktop hoặc OrbStack"
  for v in $LAB_VMS; do
    if [ "$(vm_state "$v")" != Running ]; then
      info "cảnh báo: bỏ qua $v (chưa chạy)"; continue
    fi
    if ! vm "$v" "command -v ctr" >/dev/null 2>&1; then
      info "cảnh báo: bỏ qua $v (chưa có containerd)"; continue
    fi
    targets="$targets $v"
  done
  [ -n "$targets" ] || die "không có VM nào đang chạy và có containerd để nạp image, chưa build gì (chạy '$LAB_CMD up $LAB_PROGRAM' và cài containerd trước)"
  if [ -n "$(images_missing)" ]; then
    command -v lab_build_images >/dev/null 2>&1 || die "thiếu image và chương trình '$LAB_PROGRAM' không có lab_build_images"
    info "build image chưa có, có thể mất vài phút"
    lab_build_images >&2 || die "build image thất bại"
  fi
  tar="$(mktemp "${TMPDIR:-/tmp}/lab-images.XXXXXX")" || die "không tạo được tệp tạm"
  info "docker save $(printf '%s\n' $LAB_IMAGES | wc -l | tr -d ' ') image"
  docker save -o "$tar" $LAB_IMAGES >/dev/null || { rm -f "$tar"; die "docker save thất bại"; }
  for v in $targets; do
    info "nạp image vào $v"
    vm_put "$tar" "$v" /tmp/lab-images.tar >/dev/null || { rm -f "$tar"; die "không chuyển được image vào $v"; }
    vm "$v" "sudo ctr -n $ns images import /tmp/lab-images.tar && rm -f /tmp/lab-images.tar" >/dev/null \
      || { rm -f "$tar"; die "import image vào $v thất bại"; }
    n=$((n+1))
  done
  rm -f "$tar"
  [ "$n" -gt 0 ] || die "không nạp được image vào VM nào"
  info "đã nạp image vào $n VM"
}
