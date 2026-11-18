# s26 — lời giải chuẩn (không đổi cluster): chọn Pod catalog (ưu tiên trên cka-w2) và Pod gateway; trên node chứa catalog đọc
# ip route, interface cali* của Pod (ip route get), tunnel theo chế độ của IPPool; crictl inspect lấy PID container, nsenter
# -n ip addr; tcpdump trên tunnel trong lúc một Pod tạm ghim worker kia gọi thẳng IP Pod catalog; đọc /etc/cni/net.d và
# /opt/cni/bin; ghi ~/drills/s26/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
# Ngay sau khi VM bật lại (vd. selftest chụp st4-done rồi chạy s26), API còn status của trước lúc tắt: rollout status qua ngay,
# Pod catalog "Running" nhưng chưa có IP. Chờ như verify (files/wait.sh: Pod Ready sau lúc boot, tối đa 420 giây).
vm "$cp" "$(cat "$SESSION_DIR/files/wait.sh")" >/dev/null 2>&1 || true
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm "$cp" "set -e
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=420s >/dev/null; done
  kubectl -n shop get pod -l 'app in (gateway,catalog)' -o wide
  kubectl -n kube-system get pod -l k8s-app=calico-node -o wide
  kubectl get ippools.crd.projectcalico.org -o custom-columns=NAME:.metadata.name,CIDR:.spec.cidr,IPIP:.spec.ipipMode,VXLAN:.spec.vxlanMode,BLOCK:.spec.blockSize"

# Pod catalog trên cka-w2 nếu có, không thì Pod catalog đầu tiên.
sel="$(vm "$cp" "kubectl -n shop get pod -l app=catalog --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.spec.nodeName} {.metadata.name} {.status.podIP}{\"\\n\"}{end}' | sort -r -k1,1 | head -n1")"
set -- $sel; node="$1"; pod="$2"; ip="$3"
echo "s26: Pod catalog $pod ($ip) trên $node"
case "$node" in cka-w1|cka-w2|cka-cp) ;; *) echo "s26: không chọn được Pod catalog" >&2; exit 1 ;; esac
mode="$(vm "$cp" "kubectl get ippools.crd.projectcalico.org -o jsonpath='{.items[0].spec.ipipMode} {.items[0].spec.vxlanMode}'")"
case "$mode" in Always*|CrossSubnet*) tun=tunl0 ;; *' Always'|*' CrossSubnet') tun=vxlan.calico ;; *) echo "s26: IPPool không có encapsulation ($mode)" >&2; exit 1 ;; esac
echo "s26: IPPool ipipMode/vxlanMode = $mode → interface $tun"

echo "s26: trên $node: route, interface của Pod, PID container, nsenter"
nf="$(vm "$node" "set -e
  ip route | grep -E 'tunl0|vxlan|cali|blackhole' >&2
  dev=\$(ip -o route get $ip | sed -n 's/.* dev \\([^ ]*\\).*/\\1/p')
  ip -d link show \$dev >&2; ip -d link show $tun >&2
  cid=\$(sudo crictl ps --pod \$(sudo crictl pods --name $pod -q | head -n1) --name catalog -q | head -n1)
  pid=\$(sudo crictl inspect -o go-template --template '{{.info.pid}}' \$cid)
  echo \"PID \$pid\" >&2
  sudo nsenter -t \$pid -n ip addr show eth0 >&2
  sudo nsenter -t \$pid -n ip route >&2
  sudo ls -l /etc/cni/net.d >&2; ls /opt/cni/bin | tr '\\n' ' ' >&2; echo >&2
  cni=\$(sudo ls -1 /etc/cni/net.d | grep -E '\\.(conflist|conf|json)\$' | LC_ALL=C sort | head -n1)
  echo \"\$dev \$cni\"")"
set -- $nf; veth="$1"; cni="$2"
case "$veth" in cali*) ;; *) echo "s26: không thấy interface cali* tới $ip trên $node: '$veth'" >&2; exit 1 ;; esac

src=cka-w1; [ "$node" = cka-w1 ] && src=cka-w2
echo "s26: tcpdump trên $tun của $node khi Pod tạm trên $src gọi thẳng $ip:8080"
vm "$node" "command -v tcpdump >/dev/null || { sudo apt-get -o DPkg::Lock::Timeout=300 install -y -q tcpdump >/dev/null; }
  sudo timeout 40 tcpdump -ni $tun -c 6 -l 'host $ip and tcp port 8080' > /tmp/lab-s26-tcpdump.txt 2>/dev/null &"
vm "$cp" "set -e
  kubectl -n shop delete pod s26-tmp --ignore-not-found --now >/dev/null 2>&1
  kubectl -n shop run s26-tmp --image=busybox:1.37 --restart=Never \
    --overrides='{\"spec\":{\"nodeName\":\"$src\"}}' --command -- sleep 600 >/dev/null
  kubectl -n shop wait pod/s26-tmp --for=condition=Ready --timeout=120s >/dev/null
  kubectl -n shop exec s26-tmp -- wget -q -T 5 -O- http://$ip:8080/products | head -c 80; echo
  kubectl -n shop delete pod s26-tmp --now >/dev/null"
vm "$node" "for i in \$(seq 1 20); do [ \"\$(wc -l < /tmp/lab-s26-tcpdump.txt)\" -ge 1 ] && break; sleep 1; done
  sleep 2; cat /tmp/lab-s26-tcpdump.txt; sudo rm -f /tmp/lab-s26-tcpdump.txt"

vm "$cp" "set -e; mkdir -p ~/drills/s26
  printf 'CATALOG_POD_IP=%s\nCATALOG_NODE=%s\nTUNNEL_IFACE=%s\nHOST_VETH=%s\nCNI_CONF=%s\n' '$ip' '$node' '$tun' '$veth' '$cni' > ~/drills/s26/answers.env
  cat ~/drills/s26/answers.env"
