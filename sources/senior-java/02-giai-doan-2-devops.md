# Giai đoạn 2 (Tháng 6–12): DevOps nền tảng — bản hướng dẫn thực hiện chi tiết

> Cấu trúc mỗi mục: **Mục tiêu** → **Cách thực hiện** → **Hoàn thành khi**.

## Output bắt buộc cuối giai đoạn

1. Pipeline CI/CD tự động hóa quy trình deploy tại công ty (hoặc bản mô phỏng 1:1), có số liệu thời gian trước/sau.
2. Repo `springboot-cicd-observability`: app + Dockerfile tối ưu + compose + pipeline + Prometheus/Grafana/Loki.
3. 1 bài blog về hành trình tự động hóa deploy.

## Tài nguyên chính

- Sách: *The Phoenix Project* (đọc chơi tuần 1), *Docker Deep Dive* (Poulton, tra cứu).
- Online: linuxjourney.com, OverTheWire Bandit, Practical Networking (YouTube), spring.io guide "Spring Boot Docker", docs GitHub Actions, TechWorld with Nana, grafana.com/tutorials.
- Công cụ: bash/ssh/systemd/journalctl, Docker + compose, hadolint, Trivy, GitHub Actions, Actuator/Micrometer, Prometheus, Grafana, Loki, Nginx, hey/k6.
- Chi phí: 1 VPS ~5 USD/tháng (Vultr/DigitalOcean/Hetzner) + 1 domain rẻ (~2–10 USD/năm, hoặc subdomain miễn phí DuckDNS).

---

## Tháng 7 — Linux & networking

### Tuần 1–2: Linux thực chiến

**Mục tiêu:** vận hành được app Java trên server Linux như 1 sysadmin cơ bản.

**Cách thực hiện:**
1. Đọc The Phoenix Project trong tuần (sách truyện, đọc nhanh). Ghi 3 bài học liên hệ với chính team bạn.
2. Thuê VPS Ubuntu 24.04 rẻ nhất. Việc đầu tiên — bảo mật tối thiểu: tạo user thường (`adduser deploy`, `usermod -aG sudo deploy`), copy SSH key (`ssh-copy-id`), tắt đăng nhập password + root trong `/etc/ssh/sshd_config` (`PasswordAuthentication no`, `PermitRootLogin no`), bật firewall `ufw allow OpenSSH && ufw enable`.
3. Cài JDK (`apt install openjdk-21-jre-headless`), scp file jar app demo lên, chạy thử bằng tay.
4. Chuyển thành systemd service: tạo user riêng không login (`useradd -r -s /usr/sbin/nologin appuser`), viết `/etc/systemd/system/myapp.service`:
   - `[Service]`: `User=appuser`, `ExecStart=/usr/bin/java -jar /opt/myapp/app.jar`, `Restart=on-failure`, `Environment=SPRING_PROFILES_ACTIVE=prod`.
   - `systemctl daemon-reload && systemctl enable --now myapp`.
5. Thao tác vận hành hằng ngày: `systemctl status myapp`, xem log `journalctl -u myapp -f`, kill process xem systemd tự restart (`Restart=on-failure` hoạt động thật).
6. Luyện phản xạ lệnh: chơi OverTheWire Bandit level 0–20 (mỗi tối 3–4 level). Học kèm: `ps aux`, `top`, `df -h`, `du -sh`, `find`, `grep -r`, pipe và redirect.
7. Viết 1 script bash `deploy.sh` thô sơ: scp jar mới → `systemctl restart` → curl health check → in OK/FAIL. Đây là phôi thai của pipeline sau này.

**Hoàn thành khi:** app chạy như service, tự restart khi crash; SSH chỉ vào được bằng key; `deploy.sh` chạy được; qua Bandit level 20.

### Tuần 3–4: Networking cho backend engineer

**Mục tiêu:** hiểu đường đi của request và tự dựng HTTPS thật.

**Cách thực hiện:**
1. Học DNS bằng tay: mua domain rẻ (hoặc DuckDNS miễn phí), trỏ A record về IP VPS. Dùng `dig +trace tendomain.com` xem quá trình phân giải từ root server xuống. Ghi chú lại từng chặng.
2. Quan sát TCP/HTTP: `curl -v http://tendomain.com` đọc từng dòng (resolve → connect → request headers → response). `ss -tlnp` trên VPS xem app đang listen port nào.
3. Cài Nginx làm reverse proxy: `apt install nginx`, viết server block: `location / { proxy_pass http://127.0.0.1:8080; }` + các header `X-Forwarded-For`, `X-Forwarded-Proto`. Mở firewall 80/443, ĐÓNG port 8080 với bên ngoài (app chỉ listen localhost hoặc ufw chặn) — hiểu tại sao: app không bao giờ nên phơi trực tiếp.
4. TLS thật: `apt install certbot python3-certbot-nginx`, chạy `certbot --nginx -d tendomain.com` → có HTTPS trong 2 phút. Mở `certbot renew --dry-run` hiểu cơ chế tự gia hạn. Dùng `curl -v https://...` xem TLS handshake trong output.
5. Học khái niệm TLS handshake + HTTP/2 qua video Practical Networking (2 buổi), không cần sâu toán mã hóa.
6. Ghi chú Feynman: "Chuyện gì xảy ra khi user mở https://tendomain.com" — viết từ trải nghiệm thật: DNS → TCP → TLS → Nginx → app → response.

**Hoàn thành khi:** domain của bạn chạy HTTPS thật, điểm A trên ssllabs.com/ssltest; giải thích được từng chặng của request không cần nhìn note.

---

## Tháng 8 — Docker sâu

### Tuần 5–6: Image tối ưu cho Spring Boot

**Mục tiêu:** image < 200MB, build lại nhanh nhờ cache, an toàn cơ bản.

**Cách thực hiện:**
1. Đo hiện trạng: viết Dockerfile ngây thơ (`FROM eclipse-temurin:21-jdk`, COPY jar, ENTRYPOINT) → `docker images` ghi size (thường 450–600MB). `docker history <image>` xem layer nào to.
2. Bước 1 — đổi base image runtime: `eclipse-temurin:21-jre` (bỏ JDK) → đo lại.
3. Bước 2 — multi-stage + tận dụng cache dependency:
   - Stage build: COPY `pom.xml` + `mvnw` TRƯỚC, chạy `./mvnw dependency:go-offline`, RỒI MỚI COPY `src` và `./mvnw package -DskipTests`. Thứ tự này khiến đổi code không phải tải lại dependency. Kiểm chứng: sửa 1 dòng code, build lại, xem log các layer dependency báo CACHED.
4. Bước 3 — Spring Boot layered jar: trong stage build chạy `java -Djarmode=tools -jar app.jar extract --layers --destination extracted` (Boot 3.3+; bản cũ dùng `-Djarmode=layertools ... extract`). Stage runtime COPY theo thứ tự: `dependencies` → `spring-boot-loader` → `snapshot-dependencies` → `application`. Giờ đổi code chỉ rebuild layer cuối vài trăm KB.
5. Bước 4 — an toàn: thêm `RUN useradd -r appuser` + `USER appuser`; `EXPOSE 8080`; healthcheck để sau cho compose. Chạy `hadolint Dockerfile` fix cảnh báo; `trivy image <image>` fix lỗi HIGH/CRITICAL (thường chỉ cần nâng base image tag mới nhất).
6. Ghi bảng vào README: size + thời gian rebuild-khi-đổi-code của từng bước (ngây thơ → JRE → multi-stage → layered).

**Hoàn thành khi:** image < 200MB; rebuild khi đổi code < 30 giây; hadolint và Trivy (HIGH/CRITICAL) sạch; bảng số liệu có trong README.

### Tuần 7–8: docker-compose môi trường dev chuẩn

**Mục tiêu:** 1 lệnh dựng full môi trường dev.

**Cách thực hiện:**
1. Viết `compose.yaml` gồm: app (build từ Dockerfile), postgres (hoặc DB công ty), redis. Dùng env file `.env` cho biến, KHÔNG hardcode password, `.env` vào `.gitignore` (commit file `.env.example`).
2. Healthcheck cho từng service: postgres dùng `pg_isready`, app dùng `curl -f http://localhost:8080/actuator/health`. App khai báo `depends_on: postgres: condition: service_healthy` → app chỉ start khi DB sẵn sàng. Thử nghiệm: tắt healthcheck xem app crash lúc DB chưa lên để hiểu giá trị của nó.
3. Volume cho data postgres để không mất dữ liệu khi `down`; hiểu khác biệt `docker compose down` vs `down -v`.
4. Kiểm chứng tiêu chí "1 lệnh": clone repo vào thư mục mới, chạy đúng 1 lệnh `docker compose up -d`, mọi thứ chạy. Nhờ 1 người bạn làm theo README — họ tắc ở đâu, README thiếu ở đó.
5. Áp dụng tại công ty: nếu setup môi trường dev cho người mới đang là "cài tay theo file Word", đề xuất compose file này. Quick win dễ được ghi nhận nhất giai đoạn.

**Hoàn thành khi:** máy lạ + 1 lệnh = môi trường chạy; đề xuất ở công ty đã gửi.

---

## Tháng 9–10 — CI/CD

### Tuần 9–10: CI — build & test tự động

**Mục tiêu:** mọi push/PR đều được build + test tự động, PR đỏ không được merge.

**Cách thực hiện:**
1. Trong repo `springboot-cicd-observability`, tạo `.github/workflows/ci.yml`: trigger `on: [push, pull_request]`; các step: `actions/checkout` → `actions/setup-java` (distribution temurin, java 21, `cache: maven`) → `./mvnw verify`.
2. Testcontainers chạy được sẵn trên runner `ubuntu-latest` (có Docker daemon) — không cần config thêm. Chạy thử để tự kiểm chứng.
3. Đọc hiểu các khái niệm ngay trên file mình vừa viết: workflow/job/step, biến `${{ github.sha }}`, secrets. Thêm badge trạng thái CI vào README.
4. Branch protection: Settings → Branches → require status check pass trước khi merge + require PR. Tự thử: tạo PR có test fail → nút merge bị khóa. Trải nghiệm này là văn hóa CI.
5. Tối ưu: xem thời gian chạy trong tab Actions, xác nhận cache Maven hoạt động (lần 2 nhanh hơn hẳn).

**Hoàn thành khi:** PR đỏ không merge được; CI < 5 phút với cache; badge xanh trên README.

### Tuần 11–12: CD phần 1 — build image & deploy staging

**Mục tiêu:** push code lên main → image mới tự lên VPS staging.

**Cách thực hiện:**
1. Thêm job build-push (chỉ chạy trên main, `needs: test`): `docker/login-action` vào ghcr.io (dùng `GITHUB_TOKEN` có sẵn) → `docker/build-push-action` với tags: `ghcr.io/<user>/app:${{ github.sha }}` và `:latest` chỉ cho staging. Quy tắc ghi vào README: production KHÔNG BAO GIỜ deploy tag `latest`, chỉ deploy tag SHA/semver — để rollback được và biết chính xác đang chạy gì.
2. Thêm step scan: `aquasecurity/trivy-action` với `exit-code: 1` cho CRITICAL → image lỗi nặng không được push.
3. Job deploy staging: dùng `appleboy/ssh-action` SSH vào VPS chạy: `docker pull <image:sha> && docker compose up -d app` (compose trên VPS trỏ image theo biến). Secrets cần: `SSH_HOST`, `SSH_USER`, `SSH_KEY` (tạo key riêng cho CI, không dùng key cá nhân).
4. Trên VPS: app giờ chạy bằng container thay vì systemd jar (giữ Nginx phía trước như cũ). Chuyển đổi này chính là "containerize" một hệ thống đang chạy — kinh nghiệm quý.
5. Kiểm chứng end-to-end: sửa 1 dòng code → push → 5 phút sau curl staging thấy thay đổi. Ghi video/GIF ngắn cho README.

**Hoàn thành khi:** push main → staging tự cập nhật không đụng tay; image có tag SHA trên ghcr; Trivy gate hoạt động.

### Tuần 13–14: CD phần 2 — production, approval, rollback + mang về công ty

**Mục tiêu:** deploy production có kiểm soát, rollback đã diễn tập; bắt đầu tự động hóa tại công ty.

**Cách thực hiện:**
1. Tạo GitHub Environment `production` với required reviewers (chính bạn). Job deploy-prod dùng `environment: production` → pipeline dừng chờ bấm Approve. Trải nghiệm luồng: push → staging tự động → bấm duyệt → production.
2. Rollback: viết script/job nhận input tag SHA cũ (`workflow_dispatch` với input) → deploy lại tag đó. DIỄN TẬP THẬT 1 LẦN: deploy bản "lỗi" (đổi màu trang chủ chẳng hạn) → rollback → đo mất bao nhiêu phút. Ghi vào README. Rollback chưa từng diễn tập = không có rollback.
3. Dự án tại công ty — làm theo 4 bước:
   - (a) Viết ra giấy TỪNG bước deploy thủ công hiện tại (lệnh gì, ai làm, mất bao lâu, bước nào hay sai).
   - (b) Gom các lệnh thành 1 script bash có kiểm tra lỗi (`set -euo pipefail`) + health check cuối. Đưa team dùng chung → đã giảm sai sót ngay.
   - (c) Đưa script vào CI của công ty (GitHub Actions/GitLab CI/Jenkins tùy công ty — tư duy y hệt, chỉ khác cú pháp; nếu là GitLab CI, đọc quickstart 1 buổi là chuyển được).
   - (d) Trình bày cho lead với số liệu: "trước 30 phút/lần + tháng sai 2 lần; giờ 5 phút + có log + rollback được".
   - Nếu công ty không cho làm → mô phỏng đúng quy trình công ty trên VPS cá nhân và vẫn trình bày như một đề xuất.

**Hoàn thành khi:** production cần approval; rollback đã diễn tập có số liệu; tại công ty tối thiểu xong bước (b) — script hóa.

---

## Tháng 11 — Observability

### Tuần 15–16: Metrics — Actuator, Micrometer, Prometheus

**Mục tiêu:** app phơi metrics chuẩn, Prometheus thu thập được, bạn query được.

**Cách thực hiện:**
1. Thêm dependency `spring-boot-starter-actuator` + `micrometer-registry-prometheus`; config `management.endpoints.web.exposure.include=health,info,prometheus,metrics`. Mở `/actuator/prometheus` đọc thử raw output — hiểu format `tên_metric{label="..."} giá_trị`.
2. Thêm Prometheus vào compose; `prometheus.yml` có `scrape_configs` job trỏ `app:8080` với `metrics_path: /actuator/prometheus`, `scrape_interval: 15s`. Mở UI Prometheus (9090) → Status → Targets thấy UP.
3. Học PromQL bằng 4 query lõi (gõ từng cái trong UI, quan sát khi bắn tải bằng `hey`):
   - Request rate: `rate(http_server_requests_seconds_count[5m])`
   - Error rate: thêm `{status=~"5.."}` chia cho tổng
   - p95 latency: `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))`
   - Heap: `jvm_memory_used_bytes{area="heap"}`
4. Custom metric nghiệp vụ: inject `MeterRegistry`, tạo `Counter` (vd `orders_created_total` với tag `status`) tăng trong service. Đây là khác biệt giữa "cài cho có" và "đo cái business cần".
5. Ghi chú Feynman: RED method (Rate, Errors, Duration) — vì sao 3 số này đủ nói sức khỏe 1 service.

**Hoàn thành khi:** tự viết được 4 query trên không nhìn note; custom metric hiện trong Prometheus và thay đổi khi gọi API.

### Tuần 17–18: Grafana dashboard & alert

**Mục tiêu:** 1 dashboard nhìn 10 giây biết app khỏe hay ốm; 2 alert hoạt động thật.

**Cách thực hiện:**
1. Thêm Grafana vào compose, add datasource Prometheus. Khởi động nhanh: import dashboard cộng đồng "JVM (Micrometer)" ID **4701** → xem cách người ta làm.
2. Tự dựng dashboard riêng (bắt buộc, để hiểu): hàng 1 — RED (request rate, error rate, p95/p99); hàng 2 — JVM (heap, GC pause `rate(jvm_gc_pause_seconds_sum[5m])`, threads); hàng 3 — HikariCP (`hikaricp_connections_active` vs `hikaricp_connections_max`). Kiến thức GC/pool của giai đoạn 1 giờ hiện lên màn hình — vòng lặp học đã khép.
3. Kiểm chứng dashboard bằng tải: chạy `hey -z 2m -c 50 ...` và nhìn từng panel nhúc nhích. Panel nào không đổi khi có tải → đang đo sai.
4. Alert: tạo 2 rule trong Grafana Alerting — error rate > 5% trong 5 phút; heap > 85% trong 5 phút. Notification về Telegram/Slack webhook cá nhân. Kiểm chứng: viết endpoint `/boom` ném exception, bắn tải vào → nhận tin nhắn thật.

**Hoàn thành khi:** dashboard đủ 3 hàng và phản ứng với tải; đã NHẬN được alert thật trên điện thoại.

### Tuần 19–20: Logs — structured logging & Loki

**Mục tiêu:** log JSON có correlation ID, tra được bằng query, nhảy được từ metric sang log.

**Cách thực hiện:**
1. Structured logging: thêm `logstash-logback-encoder`, cấu hình `logback-spring.xml` xuất JSON (mỗi dòng log là 1 JSON có timestamp, level, logger, message, mdc). So sánh trước/sau bằng mắt để thấy vì sao máy parse được JSON còn text thì khó.
2. Correlation ID: viết 1 servlet Filter — lấy header `X-Request-Id` (không có thì `UUID.randomUUID()`), bỏ vào `MDC.put("requestId", ...)`, nhớ `MDC.clear()` ở finally, set lại header vào response. Mọi dòng log của 1 request giờ chung 1 id. (Xịn hơn: dùng Micrometer Tracing để có traceId chuẩn — làm nếu còn thời gian.)
3. Thêm Loki + Promtail (hoặc Alloy) vào compose: Promtail đọc log container Docker (mount `/var/lib/docker/containers` + `docker_sd_configs` hoặc dùng Loki Docker driver). Add datasource Loki vào Grafana.
4. Học LogQL bằng 3 truy vấn: `{container="app"}` xem tất cả; `|= "ERROR"` lọc lỗi; `| json | requestId="abc-123"` truy toàn bộ hành trình 1 request. Kịch bản diễn tập: gọi API lỗi → thấy error rate tăng trên dashboard → click sang Loki lọc ERROR đúng khung giờ → lấy requestId → xem cả chuỗi log của request đó. Đây chính là luồng debug production thực tế.
5. Áp dụng tại công ty: nếu log chưa có correlation ID → đây là đề xuất giá trị cao, chi phí thấp (1 filter + 1 dòng pattern). Viết đề xuất kèm demo.

**Hoàn thành khi:** tự truy được hành trình 1 request lỗi từ dashboard → Loki → requestId trong < 3 phút.

---

## Tháng 12 — Game day & đóng gói

### Tuần 21–22: Game day — tự gây sự cố, tự chẩn đoán

**Mục tiêu:** chẩn đoán 4 loại sự cố chỉ bằng dashboard/log, mỗi loại < 10 phút.

**Cách thực hiện:**
1. Chuẩn bị 4 "công tắc sự cố" trên app VPS (ẩn sau endpoint admin):
   - Memory leak: endpoint mỗi lần gọi add 5MB vào static list.
   - Query chậm: endpoint chạy `SELECT pg_sleep(2)` hoặc query bảng lớn không index.
   - Thread pool cạn: endpoint sleep 30s, pool cấu hình 5 thread — bắn 50 request là nghẽn.
   - Disk đầy: script `fallocate -l 90% dung lượng còn lại` (cẩn thận, làm trên VPS lab).
2. Cách chơi cho đúng: nhờ bạn kích hoạt ngẫu nhiên 1 công tắc (hoặc tự viết script random rồi chờ 1 ngày cho quên). Khi alert nổ hoặc thấy dashboard bất thường: bấm giờ, CHỈ dùng Grafana/Loki/lệnh trên server (không đọc code) đến khi nêu đúng nguyên nhân. Ghi thời gian.
3. Sau mỗi sự cố, viết runbook nửa trang: triệu chứng trên dashboard → lệnh/truy vấn kiểm tra → cách xử lý tạm + xử lý gốc. 4 runbook bỏ vào repo `/runbooks`.
4. Sự cố nào quá 10 phút → dashboard/alert đang thiếu tín hiệu → bổ sung panel/alert rồi chơi lại.

**Hoàn thành khi:** 4/4 sự cố chẩn đoán đúng < 10 phút; 4 runbook hoàn chỉnh.

### Tuần 23–24: Hoàn thiện portfolio + blog

**Cách thực hiện:**
1. README repo: sơ đồ kiến trúc (vẽ bằng Excalidraw/draw.io), ảnh dashboard, bảng số liệu image size, hướng dẫn chạy 1 lệnh, mục "Những gì tôi học được".
2. Viết blog "Tự động hóa deploy Spring Boot: từ 30 phút thủ công đến 5 phút CI/CD": bối cảnh → từng bước → số liệu → bài học. Đăng lên dev.to / Viblo / blog cá nhân. Bài đầu không cần hay, cần THẬT.

### Tuần 25–26: Đánh giá & buffer

Chấm checklist, review quý theo file 00. Dùng buffer trả nợ các tuần trễ.

## Checklist đánh giá cuối giai đoạn

- [ ] Deploy công ty (hoặc mô phỏng) tự động, có số liệu trước/sau
- [ ] Pipeline đủ: test → scan → image tag SHA → staging tự động → production approval → rollback đã diễn tập
- [ ] Image < 200MB, non-root, Trivy HIGH/CRITICAL sạch
- [ ] Dashboard RED + JVM + pool, 2 alert đã nổ thật vào điện thoại
- [ ] Log JSON + correlation ID, truy vết 1 request < 3 phút
- [ ] Game day 4/4 sự cố < 10 phút, có 4 runbook
- [ ] Blog đã đăng

Đạt ≥ 6/7 → giai đoạn 3. Trượt observability → mang sang giai đoạn 3 làm tiếp trên Kubernetes.
