LAB_PREFIX="tst-"
LAB_VMS="tst-a tst-b"
LAB_CP="tst-a"
LAB_IMAGE="24.04"
K8S_INSTALL_MINOR="1.0"
K8S_TARGET_MINOR="1.1"
lab_vm_spec() {
  case "$1" in
    tst-a) echo "2 3G 20G" ;;
    *) echo "1 2G 15G" ;;
  esac
}
