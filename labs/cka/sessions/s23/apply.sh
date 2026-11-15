# s23 — lời giải chuẩn: local-path-provisioner từ manifest ghim phiên bản (Deployment ghim cka-cp bằng nodeSelector +
# toleration control plane; image helper Pod ghim busybox:1.37), StorageClass local-path làm mặc định (annotation);
# PVC nháp wffc-lab Pending với Event WaitForFirstConsumer cho tới khi có Pod wffc-pod; xoá Pod + PVC → PV động bị xoá
# theo (Delete); làm lại, đổi PV sang Retain trước khi xoá → PV Released; dọn PV Released và thư mục của nó trên node.
# Ghi ~/drills/s23/answers.env. Chạy lại nhiều lần được. Nạp bởi `lab` trên máy Mac (bash 3.2, set -e).
cp="$LAB_CP"
LPP_VERSION="v0.0.37"
vm "$cp" "for i in \$(seq 1 90); do kubectl get --raw /readyz >/dev/null 2>&1 && exit 0; sleep 2; done
  echo 'apiserver chưa sẵn sàng sau 180 giây' >&2; exit 1"
for f in wffc-lab wffc-pod; do vm_put "$SESSION_DIR/files/$f.yaml" "$cp" "/tmp/lab-s23-$f.yaml"; done

echo "s23: local-path-provisioner $LPP_VERSION trên cka-cp, StorageClass local-path mặc định"
vm "$cp" "set -e; mkdir -p ~/drills/s23
  install -m 644 /tmp/lab-s23-wffc-lab.yaml ~/drills/s23/wffc-lab.yaml
  install -m 644 /tmp/lab-s23-wffc-pod.yaml ~/drills/s23/wffc-pod.yaml
  rm -f /tmp/lab-s23-*.yaml
  f=~/drills/s23/local-path-storage-$LPP_VERSION.yaml
  [ -s \$f ] || curl -fsSL --retry 3 -o \$f https://raw.githubusercontent.com/rancher/local-path-provisioner/$LPP_VERSION/deploy/local-path-storage.yaml
python3 - \$f <<'PY'
import sys, yaml
p = sys.argv[1]
with open(p) as fh: docs = [d for d in yaml.safe_load_all(fh) if d]
for d in docs:
    if d['kind'] == 'Deployment' and d['metadata']['name'] == 'local-path-provisioner':
        s = d['spec']['template']['spec']
        s['nodeSelector'] = {'node-role.kubernetes.io/control-plane': ''}
        s['tolerations'] = [{'key': 'node-role.kubernetes.io/control-plane', 'operator': 'Exists', 'effect': 'NoSchedule'}]
    if d['kind'] == 'ConfigMap' and d['metadata']['name'] == 'local-path-config':
        h = d['data']['helperPod.yaml']
        d['data']['helperPod.yaml'] = h.replace('image: docker.io/library/busybox\n', 'image: docker.io/library/busybox:1.37\n')
def block(dumper, s):
    return dumper.represent_scalar('tag:yaml.org,2002:str', s, style='|' if '\n' in s else None)
yaml.SafeDumper.add_representer(str, block)
with open(p, 'w') as fh: yaml.safe_dump_all(docs, fh, sort_keys=False, allow_unicode=True, width=1000)
PY
  grep -q 'image: docker.io/library/busybox:1.37' \$f
  kubectl apply -f \$f >/dev/null
  kubectl -n local-path-storage rollout status deploy/local-path-provisioner --timeout=300s >/dev/null
  kubectl patch storageclass local-path -p '{\"metadata\":{\"annotations\":{\"storageclass.kubernetes.io/is-default-class\":\"true\"}}}' >/dev/null"

echo "s23: dọn PVC/PV nháp của lần chạy trước (nếu có)"
vm "$cp" "set -e
  kubectl -n shop delete pod wffc-pod --ignore-not-found --now --wait=true >/dev/null
  kubectl -n shop delete pvc wffc-lab --ignore-not-found --wait=true >/dev/null
  for pv in \$(kubectl get pv -o jsonpath='{range .items[?(@.spec.claimRef.name==\"wffc-lab\")]}{.metadata.name}{\"\\n\"}{end}'); do
    [ \"\$(kubectl get pv \$pv -o jsonpath='{.status.phase}')\" = Released ] && kubectl delete pv \$pv --wait=true >/dev/null
  done; true"

echo "s23: PVC wffc-lab đứng Pending tới khi có Pod (Event WaitForFirstConsumer)"
reason="$(vm "$cp" "set -e
  kubectl apply -f ~/drills/s23/wffc-lab.yaml >/dev/null
  r=''; for i in \$(seq 1 30); do
    r=\$(kubectl -n shop get events --field-selector involvedObject.kind=PersistentVolumeClaim,involvedObject.name=wffc-lab -o jsonpath='{range .items[*]}{.reason}{\"\\n\"}{end}' 2>/dev/null | grep -x -m1 WaitForFirstConsumer || true)
    [ -n \"\$r\" ] && break; sleep 2
  done
  [ \"\$(kubectl -n shop get pvc wffc-lab -o jsonpath='{.status.phase}')\" = Pending ] || { echo 'wffc-lab không Pending khi chưa có Pod' >&2; exit 1; }
  printf '%s' \"\$r\"")"
echo "s23: Event của PVC chưa có Pod: '$reason'"
[ "$reason" = "WaitForFirstConsumer" ] || { echo "s23: PVC wffc-lab không có Event WaitForFirstConsumer" >&2; exit 1; }

# round <retain|delete>: tạo Pod dùng wffc-lab, chờ Bound; retain thì đổi PV sang Retain; xoá Pod + PVC; in PV và phase cuối.
round() {
  vm "$cp" "set -e
  kubectl apply -f ~/drills/s23/wffc-lab.yaml -f ~/drills/s23/wffc-pod.yaml >/dev/null
  kubectl -n shop wait pod/wffc-pod --for=condition=Ready --timeout=180s >/dev/null
  pv=\$(kubectl -n shop get pvc wffc-lab -o jsonpath='{.spec.volumeName}')
  [ -n \"\$pv\" ] && [ \"\$(kubectl -n shop get pvc wffc-lab -o jsonpath='{.status.phase}')\" = Bound ]
  [ $1 = retain ] && kubectl patch pv \$pv -p '{\"spec\":{\"persistentVolumeReclaimPolicy\":\"Retain\"}}' >/dev/null
  node=\$(kubectl get pv \$pv -o jsonpath='{.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]}')
  path=\$(kubectl get pv \$pv -o jsonpath='{.spec.hostPath.path}{.spec.local.path}')
  kubectl -n shop delete pod wffc-pod --now --wait=true >/dev/null
  kubectl -n shop delete pvc wffc-lab --wait=true >/dev/null
  ph=''; for i in \$(seq 1 30); do
    ph=\$(kubectl get pv \$pv -o jsonpath='{.status.phase}' 2>/dev/null || echo gone)
    [ $1 = retain ] && [ \"\$ph\" = Released ] && break
    [ $1 = delete ] && [ \"\$ph\" = gone ] && break
    sleep 2
  done
  printf '%s %s %s %s' \"\$pv\" \"\$ph\" \"\$node\" \"\$path\""
}
echo "s23: lần 1 (reclaimPolicy Delete): xoá PVC → PV bị xoá theo"
set -- $(round delete)
echo "s23: PV $1 sau khi xoá PVC: $2"
[ "$2" = gone ] || { echo "s23: PV $1 không bị xoá theo PVC" >&2; exit 1; }
echo "s23: lần 2 (đổi PV sang Retain trước khi xoá PVC): PV Released"
set -- $(round retain)
echo "s23: PV $1 sau khi xoá PVC: $2 (dữ liệu ở $3:$4)"
[ "$2" = Released ] || { echo "s23: PV $1 không Released" >&2; exit 1; }
vm "$cp" "kubectl get pv --sort-by=.spec.capacity.storage"
vm "$cp" "set -e; kubectl delete pv $1 --wait=true >/dev/null"
case "$3:$4" in
  cka-w1:/opt/local-path-provisioner/pvc-*|cka-w2:/opt/local-path-provisioner/pvc-*) vm "$3" "sudo rm -rf -- '$4'" ;;
  *) echo "s23: không rõ thư mục dữ liệu của PV $1 ($3:$4), không xoá" >&2; exit 1 ;;
esac
vm "$cp" "set -e; mkdir -p ~/drills/s23; printf 'WFFC_REASON=%s\n' '$reason' > ~/drills/s23/answers.env"
