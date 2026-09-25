# Đóng gói DevPrep để triển khai lên server không có mạng

Runbook tự làm lại quy trình đã chạy ngày 2026-09-15 (image `devprep:a8bd6ab`).
Đầu ra là **một file zip** chép sang server; server chỉ `docker load` rồi chạy,
không tải thêm gì.

Áp dụng khi server air-gapped, hoặc khi mạng server không ra được Docker Hub.
Nếu server có mạng thì dùng registry, đừng dùng cách này.

---

## 0. Quyết định phải chốt trước — kiến trúc CPU

**Đây là chỗ sai thì hỏng cả gói.** Máy build (Mac Apple Silicon) là `arm64`.
Nếu không chỉ định gì, `docker build` ra image **arm64**. Chép sang server x86_64
thì `docker load` vẫn chạy trót lọt, `docker run` mới báo `exec format error` —
tức là lỗi chỉ lộ ra ở bước cuối, trên máy không có internet để sửa.

Hỏi trước, hoặc chạy trên server:

```bash
uname -m        # x86_64 → linux/amd64 ; aarch64 → linux/arm64
```

Chưa chắc thì build cả hai: `--platform linux/amd64,linux/arm64`. Tar nặng gần gấp
đôi nhưng `docker load` trên server nào cũng lấy đúng biến thể.

---

## 1. Chuẩn bị

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes

git status --porcelain          # phải sạch — tag image theo commit nên không được có thay đổi chưa commit
docker version                  # Docker daemon phải đang chạy
docker buildx version           # cần buildx để build cross-arch

webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

`check-data.mjs` phải xanh **trước** khi build. Image đóng gói dữ liệu tĩnh — dữ
liệu hỏng thì không có gì ở runtime phát hiện hộ bạn.

---

## 2. Build

```bash
SHA=$(git rev-parse --short HEAD)
ARCH=amd64                      # hoặc arm64, theo bước 0

docker buildx build \
  --platform linux/$ARCH \
  --provenance=false --sbom=false \
  -t devprep:$SHA -t devprep:latest \
  --load .
```

Vì sao từng cờ:

| Cờ | Lý do |
|---|---|
| `--platform linux/$ARCH` | Ghim kiến trúc đích. Bỏ đi là ra kiến trúc máy build — xem bước 0. |
| `--provenance=false --sbom=false` | Buildx mặc định gắn attestation, tạo ra **manifest list**. Docker đời cũ trên server xử lý manifest list khi `docker load` hay sinh lỗi khó hiểu, mà ở đó bạn không debug được. Cắt sẵn. |
| `--load` | Nạp kết quả vào docker daemon local để `docker save` thấy. Không có nó, ảnh chỉ nằm trong cache buildx. |
| hai `-t` | Tag theo commit để truy nguyên, kèm `latest` cho tiện. Cả hai trỏ cùng một image nên không tốn thêm dung lượng. |

**Xác minh ngay, đừng tin build log:**

```bash
docker image inspect devprep:$SHA --format '{{.Os}}/{{.Architecture}}'   # phải khớp bước 0
```

---

## 3. Kiểm tra nội dung image

```bash
docker run --rm --platform linux/$ARCH devprep:$SHA sh -c '
  cd /usr/share/nginx/html
  echo "markdown: $(find content -name "*.md" | wc -l)"
  echo "ảnh:      $(find content -type f ! -name "*.md" | wc -l)"
  echo "pdf:      $(find . -name "*.pdf" | wc -l)"      # PHẢI là 0
  ls scripts 2>&1 | head -1                              # phải "No such file"
'
```

`pdf: 0` là mốc quan trọng — `.dockerignore` loại 217 PDF (213 MB). Nếu ra khác 0
nghĩa là `.dockerignore` đã bị sửa hỏng và image phình hơn gấp đôi.

Số markdown/ảnh phải khớp dòng cuối của `build-content.sh` ở bước 1.

---

## 4. Smoke test trước khi đóng gói

```bash
docker rm -f devprep-smoke 2>/dev/null
docker run -d --name devprep-smoke --platform linux/$ARCH -p 9020:80 devprep:$SHA

for i in $(seq 1 25); do curl -fsS localhost:9020/healthz >/dev/null 2>&1 && break; sleep 1; done

for u in /healthz / /js/vendor/mermaid.min.js /css/style.css; do
  printf "%-32s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}B' localhost:9020$u)"
done

sleep 8 && docker inspect devprep-smoke --format '{{.State.Health.Status}}'   # phải: healthy
docker rm -f devprep-smoke
```

`mermaid.min.js` (3,5 MB) đáng kiểm riêng: nó là thư viện ngoài **duy nhất**, đã
vendored vào `webapp/js/vendor/`. Nếu có ngày ai đó đổi sang CDN thì app sẽ hỏng
im lặng trên máy không mạng — đây là chỗ bắt được.

---

## 5. Đóng gói

```bash
BUNDLE=dist/devprep-$SHA-$ARCH
mkdir -p $BUNDLE

docker save devprep:$SHA devprep:latest -o $BUNDLE/devprep-$SHA-$ARCH.tar
chmod 644 $BUNDLE/devprep-$SHA-$ARCH.tar     # docker save ra mode 600
```

Thêm ba tệp đi kèm — thiếu chúng là người ở đầu bên kia phải đoán:

**`$BUNDLE/docker-compose.yml`** — khác bản ở gốc repo: dùng `image:` chứ **không**
`build:`, vì server không có mã nguồn.

```yaml
services:
  devprep:
    image: devprep:<SHA>
    container_name: devprep
    ports:
      - "9020:80"
    restart: unless-stopped
```

**`$BUNDLE/SHA256SUMS`** — gói đi qua USB/scp, checksum bắt tệp hỏng trước khi mất
thời gian debug ở server:

```bash
(cd $BUNDLE && shasum -a 256 devprep-$SHA-$ARCH.tar > SHA256SUMS)
```

**`$BUNDLE/README.md`** — hướng dẫn cho người chạy: kiến trúc, lệnh `docker load`,
lệnh chạy, cách kiểm tra, cách quay lui. Chép từ gói lần trước rồi sửa SHA.

Rồi nén:

```bash
(cd dist && zip -r -q devprep-$SHA-$ARCH.zip devprep-$SHA-$ARCH)
ls -lh dist/devprep-$SHA-$ARCH.zip
```

> Zip chỉ nhỏ hơn tar khoảng 5 MB (133 vs 140 MB) vì `docker save` đã chứa layer
> gzip sẵn. Nén ở đây là để gói 4 tệp thành 1, **không** phải để giảm dung lượng —
> đã đo `zstd -19 -T0` trên chính tar này: cũng ra 133 MB, mất thêm 8 giây và
> server phải có `zstd`. Không đáng. Muốn nhẹ thật thì phải cắt nội dung khỏi
> image, không phải đổi thuật toán nén.

---

## 6. Nghiệm thu — bắt buộc, và phải xoá image local

Bước hay bị bỏ nhất, và là bước duy nhất chứng minh gói chạy được:

```bash
V=$(mktemp -d) && cd $V
unzip -q /Users/tanvx/Dev/Java/java-scalability-notes/dist/devprep-$SHA-$ARCH.zip
cd devprep-$SHA-$ARCH

shasum -a 256 -c SHA256SUMS

docker rmi -f devprep:$SHA devprep:latest        # ← XOÁ, nếu không là đang test image cũ còn trong máy
docker load -i devprep-$SHA-$ARCH.tar
docker image inspect devprep:$SHA --format '{{.Os}}/{{.Architecture}}'

docker compose -f docker-compose.yml up -d
for i in $(seq 1 25); do curl -fsS localhost:9020/healthz >/dev/null 2>&1 && break; sleep 1; done
curl -s -o /dev/null -w '%{http_code}\n' localhost:9020/
docker ps --filter name=devprep --format '{{.Status}}'    # phải (healthy)

docker compose down && cd / && rm -rf $V
```

Không xoá image local trước khi `docker load` thì container vẫn chạy bằng image
sẵn có, và một file tar hỏng hoàn toàn vẫn "nghiệm thu đạt".

---

## 7. Trên server

```bash
uname -m                                   # khớp $ARCH
sha256sum -c SHA256SUMS
docker load -i devprep-<SHA>-<ARCH>.tar
docker compose up -d
curl -f http://127.0.0.1:9020/healthz
```

Quay lui = image cũ vẫn còn trên server, sửa tag trong `docker-compose.yml` rồi
`docker compose up -d`. Vì thế **đừng `docker rmi` bản cũ** cho tới khi bản mới
chạy ổn vài ngày.

---

## Bảng lỗi thường gặp

| Triệu chứng ở server | Nguyên nhân |
|---|---|
| `exec format error` khi `docker run` | Sai kiến trúc. `docker load` không kiểm arch nên lỗi chỉ lộ lúc chạy. Build lại theo bước 0. |
| `docker load` xong không thấy image | Docker cũ vướng manifest list — build lại với `--provenance=false --sbom=false`. |
| Container `unhealthy` | `nginx.conf` mất `location = /healthz`. Healthcheck trong Dockerfile gọi đúng đường dẫn đó. |
| Trang trắng, console lỗi tải JS | Có tài nguyên trỏ ra CDN. Grep `https?://` trong `index.html`, `css/`, `js/` (trừ link trong nội dung markdown — đó chỉ là link người đọc bấm). |
| Image hơn 350 MB | PDF lọt vào. Kiểm `.dockerignore` còn `**/pdf/` và `*.pdf` không. |
| Tiến độ học của người dùng biến mất | Không liên quan image: tiến độ nằm ở `localStorage` từng trình duyệt. Đổi domain/cổng là đổi origin nên mất. |

---

## Khi nào phải làm lại gói

Bất cứ thay đổi nào trong `sources/`, `webapp/`, `Dockerfile` hoặc `nginx.conf`.
Image là ảnh chụp tĩnh — server không kéo được gì mới.

`dist/` nằm trong `.gitignore`: artifact không commit, sinh lại từ commit SHA.
