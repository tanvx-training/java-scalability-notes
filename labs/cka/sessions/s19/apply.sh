# s19 — lời giải chuẩn: nhãn role=db cho cka-w2; vòng taint dedicated=db:NoSchedule → Pod db-probe (nodeSelector) Pending
# → db-probe có toleration + nodeAffinity chạy trên cka-w2 → gỡ taint, xoá Pod; Deployment nháp spread-lab 3 replica với
# podAntiAffinity required (replica thứ ba Pending) rồi xoá; Pod pinned bằng nodeName cka-cp (chạy dù control plane có
# taint, không qua scheduler) rồi xoá; PriorityClass shop-critical cho gateway; podAntiAffinity preferred cho catalog
# (~/shop/{catalog,gateway,priorityclass}.yaml), hai Pod catalog ở hai node; ghi ~/drills/s19/answers.env.
# Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in catalog.yaml gateway.yaml priorityclass.yaml db-probe.yaml db-probe-fixed.yaml spread-lab.yaml pinned.yaml; do
  vm_put "$SESSION_DIR/files/$f" "$cp" "/tmp/lab-s19-$f"
done
vm "$cp" "set -e; mkdir -p ~/shop ~/drills/s19
  for f in catalog.yaml gateway.yaml priorityclass.yaml; do install -m 644 /tmp/lab-s19-\$f ~/shop/\$f; rm -f /tmp/lab-s19-\$f; done
  install -m 644 /tmp/lab-s19-db-probe.yaml ~/drills/s19/db-probe.yaml
  for f in db-probe-fixed.yaml spread-lab.yaml pinned.yaml; do install -m 644 /tmp/lab-s19-\$f ~/drills/s19/\$f; done
  rm -f /tmp/lab-s19-*.yaml"

echo "s19: nhãn role=db, taint dedicated=db:NoSchedule, Pod db-probe Pending rồi chạy nhờ toleration"
reason="$(vm "$cp" "set -e
  kubectl -n shop delete pod db-probe pinned --ignore-not-found --wait=true >/dev/null
  kubectl -n shop delete deploy spread-lab --ignore-not-found --wait=true >/dev/null
  kubectl label node cka-w2 role=db --overwrite >/dev/null
  kubectl taint node cka-w2 dedicated=db:NoSchedule --overwrite >/dev/null
  kubectl apply -f ~/drills/s19/db-probe.yaml >/dev/null
  m=''; for i in \$(seq 1 30); do
    m=\$(kubectl -n shop get events --field-selector reason=FailedScheduling,involvedObject.name=db-probe -o jsonpath='{.items[-1:].message}' 2>/dev/null)
    [ -n \"\$m\" ] && break; sleep 2
  done
  [ \"\$(kubectl -n shop get pod db-probe -o jsonpath='{.spec.nodeName}')\" = '' ]
  kubectl replace --force -f ~/drills/s19/db-probe-fixed.yaml >/dev/null
  kubectl -n shop wait --for=condition=Ready pod/db-probe --timeout=120s >/dev/null
  [ \"\$(kubectl -n shop get pod db-probe -o jsonpath='{.spec.nodeName}')\" = cka-w2 ]
  kubectl taint node cka-w2 dedicated=db:NoSchedule- >/dev/null
  kubectl -n shop delete pod db-probe --wait=true >/dev/null
  printf '%s' \"\$m\" | grep -o 'untolerated taint' | head -n1")"
echo "s19: FailedScheduling của db-probe có: '$reason'"
[ "$reason" = "untolerated taint" ] || { echo "s19: db-probe không Pending vì taint" >&2; exit 1; }

echo "s19: spread-lab (podAntiAffinity required, 3 replica): replica thứ ba Pending"
vm "$cp" "set -e
  kubectl apply -f ~/drills/s19/spread-lab.yaml >/dev/null
  ok=''; for i in \$(seq 1 60); do
    r=\$(kubectl -n shop get pod -l app=spread-lab -o jsonpath='{range .items[*]}{.status.phase}{\"\\n\"}{end}' | sort | uniq -c | tr -s ' \\n' ' ')
    [ \"\$r\" = ' 1 Pending 2 Running ' ] && ok=1 && break; sleep 2
  done
  [ -n \"\$ok\" ] || { echo \"spread-lab: \$r\" >&2; exit 1; }
  kubectl delete -f ~/drills/s19/spread-lab.yaml --wait=true >/dev/null"

echo "s19: Pod pinned bằng nodeName lên cka-cp (bỏ qua scheduler)"
vm "$cp" "set -e
  kubectl apply -f ~/drills/s19/pinned.yaml >/dev/null
  kubectl -n shop wait --for=condition=Ready pod/pinned --timeout=120s >/dev/null
  [ -z \"\$(kubectl -n shop get events --field-selector reason=Scheduled,involvedObject.name=pinned -o name)\" ]
  kubectl -n shop delete pod pinned --wait=true >/dev/null"

echo "s19: PriorityClass shop-critical cho gateway, podAntiAffinity preferred cho catalog"
vm "$cp" "set -e
  kubectl apply -f ~/shop/priorityclass.yaml >/dev/null
  kubectl apply -f ~/shop/catalog.yaml >/dev/null
  kubectl -n shop rollout status deploy/catalog --timeout=420s >/dev/null
  kubectl apply -f ~/shop/gateway.yaml >/dev/null
  kubectl -n shop rollout status deploy/gateway --timeout=420s >/dev/null
  # preferred chỉ là điểm cộng lúc xếp lịch: trong rolling update hai Pod mới vẫn có thể rơi cùng node. Khi đó xoá một
  # Pod: Pod thay thế được xếp lúc node kia không có catalog nào, nên điểm anti-affinity đưa nó sang đó.
  for i in 1 2 3; do
    n=\$(kubectl -n shop get pod -l app=catalog -o jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}' | sort -u | grep -c .)
    [ \"\$n\" -ge 2 ] && break
    kubectl -n shop delete \$(kubectl -n shop get pod -l app=catalog -o name | head -n1) --wait=true >/dev/null
    kubectl -n shop rollout status deploy/catalog --timeout=420s >/dev/null
  done
  n=\$(kubectl -n shop get pod -l app=catalog -o jsonpath='{range .items[*]}{.spec.nodeName}{\"\\n\"}{end}' | sort -u | grep -c .)
  [ \"\$n\" -ge 2 ] || { echo 'catalog: hai Pod vẫn chung một node sau 3 lần xoá' >&2; exit 1; }
  printf 'PENDING_REASON=%s\nNODENAME_SKIPS_SCHEDULER=yes\n' '$reason' > ~/drills/s19/answers.env"
