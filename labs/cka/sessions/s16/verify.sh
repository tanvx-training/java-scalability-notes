# s16 — kiểm (sau sự cố st2-pods-broken): ba Deployment về đúng image và số replica cuối s15, rollout xong, EndpointSlice
# đủ địa chỉ ready; envFrom, volume, secretKeyRef, probe, preStop còn nguyên; JAVA_OPTS của gateway (nếu có) chỉ gồm
# ký tự ASCII; ~/shop/*.yaml khớp Deployment; Pod report-once chạy image của CronJob order-report và đã Succeeded;
# namespace shop không còn Pod lỗi hay Pod lẻ nào; answers.env khớp. Chỉ đọc. Nạp bởi `lab` trên máy Mac (bash 3.2).
cp="$LAB_CP"
echo "  (chờ apiserver và ba Deployment; lâu nhất vài phút nếu Pod đang khởi động)"
vm "$cp" "for i in \$(seq 1 60); do kubectl get --raw /readyz >/dev/null 2>&1 && break; sleep 2; done
  for d in gateway catalog order; do kubectl -n shop rollout status deploy/\$d --timeout=150s; done" >/dev/null 2>&1 || true

facts="$(vm "$cp" "$(cat "$SESSION_DIR/files/facts.sh")" 2>/dev/null)"
fact() { printf '%s\n' "$facts" | sed -n "s/^$1=//p" | head -n1; }
ans() { printf "sed -n 's/^%s=//p' ~/drills/s16/answers.env 2>/dev/null | tr -d '\"' | tail -n1" "$1"; }

for spec in gateway:2.0:2 catalog:1.0:2 order:1.0:1; do
  d="${spec%%:*}"; r="${spec#*:}"; v="${r%%:*}"; n="${r##*:}"
  expect_eq "$d: shop/$d:$v, $n/$n/$n cập nhật và Available, rollout xong, EndpointSlice $n/$n ready" \
    "shop/$d:$v $n/$n/$n eps=$n/$n NewReplicaSetAvailable" echo "$(fact "RUN_$d")"
done
for d in gateway catalog order; do
  case "$d" in gateway) what="envFrom shop-config, volume gateway-files" ;; *) what="DB_USER/DB_PASSWORD từ secretKeyRef db-cred" ;; esac
  expect_eq "$d: $what, ba probe và preStop còn nguyên" "nguyên" echo "$(fact "CONF_$d")"
done
expect_match "gateway: JAVA_OPTS không còn ký tự lạ (chỉ ASCII, hoặc bỏ hẳn)" '^(ASCII|không có JAVA_OPTS)$' echo "$(fact JOPTS)"
for d in gateway catalog order; do
  expect_eq "~/shop/$d.yaml (apply --dry-run=server): image, replicas, secretKeyRef, JAVA_OPTS khớp Deployment" "khớp" \
    echo "$(fact "FILE_$d")"
done
ci="$(fact CRON_IMAGE)"
expect_eq "Pod report-once: image ${ci:-?} (như CronJob order-report), Succeeded" "${ci:-?} Succeeded" echo "$(fact REPORT)"
expect_eq "namespace shop: không Pod nào Failed, chờ vì lỗi, hay là Pod lẻ ngoài report-once" "sạch" echo "$(fact PODS)"
expect_eq "answers.env: REPORT_EXIT_CODE=127 (mã thoát của report-once trước khi sửa)" "127" vm "$cp" "$(ans REPORT_EXIT_CODE)"
expect_eq "answers.env: BAD_CHAR=c2a0 (hai byte của ký tự lạ trong JAVA_OPTS)" "c2a0" \
  vm "$cp" "$(ans BAD_CHAR) | tr 'A-F' 'a-f' | sed -e 's/0x//g' -e 's/\\\\x//g' -e 's/[ :]//g'"
assert_summary
