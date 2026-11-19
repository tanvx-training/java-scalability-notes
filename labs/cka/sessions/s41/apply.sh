# s41 — lời giải chuẩn: setup.sh (loop.sh); chép các tệp đổi của chart (files/chart: Chart.yaml 0.2.0, values.yaml có
# order.replicas 2, spread, pdb.minAvailable 1; templates/pdb.yaml; topologySpreadConstraints trong _helpers.tpl và ba
# Deployment) đè lên ~/charts/shop, helm upgrade --force-conflicts; vòng request (loop.sh start), cordon + drain cka-w1,
# uncordon, rollout restart service nào dồn về một worker, dừng vòng (files/solve.sh). Chạy lại được. Nạp bởi `lab` trên Mac
# (bash 3.2, set -e).
cp="$LAB_CP"
vm "$cp" "$(cat "$SESSION_DIR/../s26/files/wait.sh")" >/dev/null 2>&1 || true
. "$SESSION_DIR/setup.sh"
t="$(mktemp -t s41-chart)"
( cd "$SESSION_DIR/files" && COPYFILE_DISABLE=1 tar --no-mac-metadata -czf "$t" chart 2>/dev/null || COPYFILE_DISABLE=1 tar -czf "$t" chart )
vm_put "$t" "$cp" /tmp/s41-chart.tgz
rm -f "$t"
vm "$cp" "$(cat "$SESSION_DIR/files/solve.sh")"
