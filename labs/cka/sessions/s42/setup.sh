# s42 — chạy bởi `./labs/lab begin cka s42`: tạo ~/drills/s42, đặt vòng request ~/drills/s42/loop.sh (bản của s41,
# s41/files/loop.sh) và xoá answers.env của lần trước (W2_OUTAGE_SECONDS phải đo lại). Không xoá log của vòng request, không
# đụng node, gói hay repo apt.
t="$(mktemp -t s42-loop)"
cp "$SESSION_DIR/../s41/files/loop.sh" "$t"
vm_put "$t" "$LAB_CP" /tmp/s42-loop.sh
rm -f "$t"
vm "$LAB_CP" "mkdir -p ~/drills/s42 && install -m 0755 /tmp/s42-loop.sh ~/drills/s42/loop.sh && rm -f /tmp/s42-loop.sh ~/drills/s42/answers.env"
echo "s42: đã tạo ~/drills/s42, đặt ~/drills/s42/loop.sh và xoá answers.env của lần trước (nếu có)."
