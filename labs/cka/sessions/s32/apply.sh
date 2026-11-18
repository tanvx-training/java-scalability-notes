# s32 — lời giải chuẩn: gây sự cố st5-network (như `begin`), rồi đi theo thứ tự của buổi: curl tới shop.local:30080 từ cka-cp
# (gateway tự trả 503 "không kết nối được catalog" → chặng hỏng đầu tiên là gateway → catalog, FIRST_BROKEN_HOP); Pod netshoot (image ghim) ở
# default: dig tên Service qua kube-dns (DNS của cluster vẫn chạy); EndpointSlice và cổng của Service; NetworkPolicy của shop.
# Sửa bằng tệp chuẩn: ~/shop/services.yaml (s27) và ~/shop/netpol.yaml (s31), apply; xoá netshoot; chờ shop phục vụ lại.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "mkdir -p ~/drills/s32"
lab_break st5-network
vm_put "$SESSION_DIR/files/netshoot.yaml" "$cp" /tmp/lab-s32-netshoot.yaml
vm_put "$SESSION_DIR/../s27/files/services.yaml" "$cp" /tmp/lab-s32-services.yaml
vm_put "$SESSION_DIR/../s31/files/netpol.yaml" "$cp" /tmp/lab-s32-netpol.yaml

echo "s32: chặng đầu: curl http://shop.local:30080/api/products trên cka-cp"
vm "$cp" "set -e
  out=''; for i in \$(seq 1 20); do
    out=\$(curl -s --max-time 30 -w ' %{http_code}' http://shop.local:30080/api/products || true)
    case \"\$out\" in *catalog*' 503') break ;; esac; [ \$i -ge 5 ] && break; sleep 3
  done
  echo \"shop.local:30080/api/products → \$out (gateway tự trả lời: Mac → controller → gateway đi được)\"
  # Sau khi VM khởi động lại giữa sự cố, gateway kẹt ở initContainer (catalog rỗng, không DNS) và controller tự trả 503: chỉ in,
  # không dừng; đáp án là chặng hỏng của sự cố như begin gây ra.
  case \"\$out\" in *catalog*' 503') ;; *) echo '(gateway chưa chạy: chặng hỏng thấy được lúc này nằm trước gateway)' ;; esac
  echo \"shop.local:30080/orders → \$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' http://shop.local:30080/orders || true)\"
  printf 'FIRST_BROKEN_HOP=%s\n' 'gateway->catalog' > ~/drills/s32/answers.env"

echo "s32: netshoot ở default, EndpointSlice, cổng Service, NetworkPolicy"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s32-netshoot.yaml ~/drills/s32/netshoot.yaml; rm -f /tmp/lab-s32-netshoot.yaml
  # netshoot của lần trước (hay do người học tạo bằng k run) có spec khác: xoá rồi tạo lại.
  kubectl -n default delete pod netshoot --ignore-not-found --grace-period=1 --wait=true >/dev/null
  kubectl apply -f ~/drills/s32/netshoot.yaml >/dev/null
  kubectl -n default wait --for=condition=Ready pod/netshoot --timeout=600s >/dev/null
  echo \"dig catalog.shop.svc.cluster.local: \$(kubectl -n default exec netshoot -- dig +short +time=2 +tries=1 catalog.shop.svc.cluster.local)\"
  kubectl -n shop get endpointslice -l 'kubernetes.io/service-name in (catalog,order)' -o wide
  kubectl -n shop get svc catalog -o jsonpath='{.spec.selector}'; echo
  kubectl -n shop get svc order -o jsonpath='{.spec.ports}'; echo
  kubectl -n shop get networkpolicy order -o jsonpath='{.spec.ingress[0].from[1]}'; echo
  kubectl -n shop get networkpolicy allow-dns-egress -o jsonpath='{.spec.egress[0].to[0]}'; echo"

echo "s32: sửa ~/shop/services.yaml và ~/shop/netpol.yaml, apply; xoá netshoot"
vm "$cp" "set -e
  install -m 644 /tmp/lab-s32-services.yaml ~/shop/services.yaml; install -m 644 /tmp/lab-s32-netpol.yaml ~/shop/netpol.yaml
  rm -f /tmp/lab-s32-services.yaml /tmp/lab-s32-netpol.yaml
  kubectl apply -f ~/shop/services.yaml -f ~/shop/netpol.yaml
  kubectl -n default delete pod netshoot --wait=false >/dev/null 2>&1 || true
  # Tối đa 600 giây: sau khi VM khởi động lại giữa sự cố, catalog/order CrashLoopBackOff (schema.sql cần DB, DNS hỏng) và chờ
  # back-off của kubelet (tới 5 phút) mới lên lại.
  ok=0; end=\$((\$(date +%s) + 600)); while [ \$(date +%s) -lt \$end ]; do
    [ \"\$(curl -s --max-time 5 http://shop.local:30080/api/products | grep -o '\"id\":[0-9]*' | sort -u | wc -l)\" = 3 ] &&
      [ \"\$(curl -s -o /dev/null --max-time 5 -w '%{http_code}' http://shop.local:30080/orders)\" = 200 ] && { ok=1; break; }
    sleep 3
  done
  [ \$ok = 1 ] || { echo 'shop.local:30080 chưa phục vụ lại' >&2; exit 1; }
  kubectl -n shop get endpointslice -l 'kubernetes.io/service-name in (catalog,order)'
  cat ~/drills/s32/answers.env"
