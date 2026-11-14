# s10 — lời giải chuẩn: Pod catalog (default) từ ~/drills/s10/pod.yaml (nhãn app=catalog, containerPort 8080); thử một
# Pod tag sai để đọc lý do chờ rồi xoá nó; ghi ~/drills/s10/answers.env (NODE, POD_IP, RUN_UID, LOG_DB_USER, PRODUCTS, BAD_REASON) từ chính
# cluster. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
vm_put "$SESSION_DIR/files/pod.yaml" "$cp" /tmp/lab-s10-pod.yaml
vm "$cp" "mkdir -p ~/drills/s10 && install -m 644 /tmp/lab-s10-pod.yaml ~/drills/s10/pod.yaml && rm -f /tmp/lab-s10-pod.yaml"
# Pod đã có mà khác lời giải (vd. tạo bằng kubectl run, chưa có containerPort): spec của Pod gần như bất biến, nên xoá rồi tạo lại.
vm "$cp" "cur=\$(kubectl -n default get pod catalog -o jsonpath='{.spec.containers[0].image}|{.metadata.labels.app}|{.spec.containers[0].ports[*].containerPort}' 2>/dev/null || true)
  if [ -n \"\$cur\" ] && [ \"\$cur\" != 'shop/catalog:1.0|catalog|8080' ]; then kubectl -n default delete pod catalog --wait=true >/dev/null; fi
  kubectl apply -f ~/drills/s10/pod.yaml >/dev/null
  kubectl -n default wait --for=condition=Ready pod/catalog --timeout=180s >/dev/null"
# Tình huống hỏng: tag không có trong containerd của node → kubelet thử kéo từ docker.io và thất bại.
reason="$(vm "$cp" "kubectl -n default delete pod catalog-bad --ignore-not-found --wait=true >/dev/null
  kubectl -n default run catalog-bad --image=shop/catalog:9.9 --restart=Never >/dev/null
  r=''; for i in \$(seq 1 60); do
    r=\$(kubectl -n default get pod catalog-bad -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' 2>/dev/null)
    case \"\$r\" in ErrImagePull|ImagePullBackOff) break ;; esac; sleep 2
  done
  kubectl -n default delete pod catalog-bad --wait=true >/dev/null; echo \"\$r\"")"
case "$reason" in ErrImagePull|ImagePullBackOff) ;; *) echo "s10: Pod tag sai không ra lý do mong đợi: '$reason'" >&2; exit 1 ;; esac
echo "s10: chờ /actuator/health của catalog trả UP"
vm "$cp" "for i in \$(seq 1 60); do
  kubectl get --raw /api/v1/namespaces/default/pods/catalog:8080/proxy/actuator/health 2>/dev/null | grep -q '\"status\":\"UP\"' && exit 0; sleep 2
done; exit 1"
vm "$cp" "p='kubectl -n default get pod catalog -o jsonpath'
  { echo \"NODE=\$(\$p='{.spec.nodeName}')\"
    echo \"POD_IP=\$(\$p='{.status.podIP}')\"
    echo \"RUN_UID=\$(kubectl -n default exec catalog -- id -u)\"
    echo \"LOG_DB_USER=\$(kubectl -n default logs catalog | sed -n 's/.*HikariPool-1 - Added connection.* user=\\([^ ]*\\).*/\\1/p' | tail -n1)\"
    echo \"PRODUCTS=\$(kubectl get --raw /api/v1/namespaces/default/pods/catalog:8080/proxy/products | grep -o '\"id\":' | wc -l)\"
    echo 'BAD_REASON=$reason'; } > ~/drills/s10/answers.env"
