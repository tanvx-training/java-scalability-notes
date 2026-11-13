# Giá trị riêng của chương trình (nạp bởi labs/lab).
LAB_PREFIX="cka-"
LAB_CP="cka-cp"
LAB_VMS="cka-cp cka-w1 cka-w2"
LAB_IMAGE="24.04"
K8S_TARGET_MINOR="1.37"   # phiên bản của kỳ thi hiện hành
K8S_INSTALL_MINOR="1.36"  # cài thấp hơn một minor để buổi nâng cấp có việc làm

# lab_vm_spec <tên>: in "<cpus> <mem> <disk>"
lab_vm_spec() {
  case "$1" in
    cka-cp) echo "2 3G 20G" ;;
    *)      echo "2 2G 15G" ;;
  esac
}
