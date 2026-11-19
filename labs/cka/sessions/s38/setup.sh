# s38 — chạy bởi `./labs/lab begin cka s38`: tạo ~/drills/s38 và ~/kustomize/shop, xoá answers.env của lần trước (làm lại
# buổi thì đáp án cũ không được tính). Không đụng cây kustomize hay namespace shop-dev đã có.
vm "$LAB_CP" "mkdir -p ~/drills/s38 ~/kustomize/shop && rm -f ~/drills/s38/answers.env"
echo "s38: đã tạo ~/drills/s38, ~/kustomize/shop và xoá answers.env của lần trước (nếu có)."
