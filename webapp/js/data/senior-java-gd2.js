// Lộ trình Senior Java — Giai đoạn 2: DevOps nền tảng (tháng 6–12).
//
// Nguồn: senior-java-roadmap/02-giai-doan-2-devops.md (tài liệu sj-02).
// Mỗi mục là MỘT BƯỚC trong "Cách thực hiện" của tuần tương ứng.
//
// GIỮ NGUYÊN id (sj-gd2-w<N> / sj-gd2-w<N>-<M>) — tiến độ localStorage lưu
// theo id này. Khối cuối `sj-gd2-done` là cổng nghiệm thu giai đoạn, nhận
// badge "✓" thay cho số tuần.
//
// Tuần 25–26 trong nguồn không có bước đánh số, chỉ một câu văn xuôi — được
// tách thủ công thành 2 mục để tránh khối tuần rỗng (xem bất biến #3e trong
// check-data.mjs).

export const seniorJavaGd2 = [
  {
    id: "sj-gd2-w1",
    week: "Tuần 1–2",
    title: "Linux thực chiến",
    goal: "Vận hành được app Java trên server Linux như 1 sysadmin cơ bản.",
    doneWhen: "App chạy như service, tự restart khi crash; SSH chỉ vào được bằng key; `deploy.sh` chạy được; qua Bandit level 20.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "linuxjourney.com", href: "https://linuxjourney.com/" },
    ],
    items: [
      {
        id: "sj-gd2-w1-1",
        text: "Đọc The Phoenix Project, ghi 3 bài học liên hệ với team",
        lesson: `**Việc cần làm.** Đọc The Phoenix Project trong tuần (sách truyện, đọc nhanh). Ghi 3 bài học liên hệ với chính team bạn.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-2",
        text: "Thuê VPS Ubuntu, bảo mật tối thiểu: user thường, SSH key, tắt password/root",
        lesson: `**Việc cần làm.** Thuê VPS Ubuntu 24.04 rẻ nhất. Việc đầu tiên — bảo mật tối thiểu: tạo user thường (\`adduser deploy\`, \`usermod -aG sudo deploy\`), copy SSH key (\`ssh-copy-id\`), tắt đăng nhập password + root trong \`/etc/ssh/sshd_config\` (\`PasswordAuthentication no\`, \`PermitRootLogin no\`), bật firewall \`ufw allow OpenSSH && ufw enable\`.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-3",
        text: "Cài JDK, scp jar app demo lên VPS, chạy thử bằng tay",
        lesson: `**Việc cần làm.** Cài JDK (\`apt install openjdk-21-jre-headless\`), scp file jar app demo lên, chạy thử bằng tay.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-4",
        text: "Chuyển app thành systemd service với user riêng không login",
        lesson: `**Việc cần làm.** Chuyển thành systemd service: tạo user riêng không login (\`useradd -r -s /usr/sbin/nologin appuser\`), viết \`/etc/systemd/system/myapp.service\`:
- \`[Service]\`: \`User=appuser\`, \`ExecStart=/usr/bin/java -jar /opt/myapp/app.jar\`, \`Restart=on-failure\`, \`Environment=SPRING_PROFILES_ACTIVE=prod\`.
- \`systemctl daemon-reload && systemctl enable --now myapp\`.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-5",
        text: "Thao tác vận hành hằng ngày: status, journalctl, kill và quan sát tự restart",
        lesson: `**Việc cần làm.** Thao tác vận hành hằng ngày: \`systemctl status myapp\`, xem log \`journalctl -u myapp -f\`, kill process xem systemd tự restart (\`Restart=on-failure\` hoạt động thật).

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-6",
        text: "Luyện phản xạ lệnh: OverTheWire Bandit level 0–20 mỗi tối",
        lesson: `**Việc cần làm.** Luyện phản xạ lệnh: chơi OverTheWire Bandit level 0–20 (mỗi tối 3–4 level). Học kèm: \`ps aux\`, \`top\`, \`df -h\`, \`du -sh\`, \`find\`, \`grep -r\`, pipe và redirect.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w1-7",
        text: "Viết deploy.sh thô sơ: scp jar → restart → health check → in OK/FAIL",
        lesson: `**Việc cần làm.** Viết 1 script bash \`deploy.sh\` thô sơ: scp jar mới → \`systemctl restart\` → curl health check → in OK/FAIL. Đây là phôi thai của pipeline sau này.

**Nguồn.** [Giai đoạn 2 — Tuần 1–2](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w2",
    week: "Tuần 3–4",
    title: "Networking cho backend engineer",
    goal: "Hiểu đường đi của request và tự dựng HTTPS thật.",
    doneWhen: "Domain của bạn chạy HTTPS thật, điểm A trên ssllabs.com/ssltest; giải thích được từng chặng của request không cần nhìn note.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "ssllabs.com/ssltest", href: "https://ssllabs.com/ssltest" },
    ],
    items: [
      {
        id: "sj-gd2-w2-1",
        text: "Học DNS bằng tay: trỏ A record, dig +trace xem phân giải từng chặng",
        lesson: `**Việc cần làm.** Học DNS bằng tay: mua domain rẻ (hoặc DuckDNS miễn phí), trỏ A record về IP VPS. Dùng \`dig +trace tendomain.com\` xem quá trình phân giải từ root server xuống. Ghi chú lại từng chặng.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w2-2",
        text: "Quan sát TCP/HTTP bằng curl -v và ss -tlnp trên VPS",
        lesson: `**Việc cần làm.** Quan sát TCP/HTTP: \`curl -v http://tendomain.com\` đọc từng dòng (resolve → connect → request headers → response). \`ss -tlnp\` trên VPS xem app đang listen port nào.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w2-3",
        text: "Cài Nginx reverse proxy, mở 80/443, đóng port app với bên ngoài",
        lesson: `**Việc cần làm.** Cài Nginx làm reverse proxy: \`apt install nginx\`, viết server block: \`location / { proxy_pass http://127.0.0.1:8080; }\` + các header \`X-Forwarded-For\`, \`X-Forwarded-Proto\`. Mở firewall 80/443, ĐÓNG port 8080 với bên ngoài (app chỉ listen localhost hoặc ufw chặn) — hiểu tại sao: app không bao giờ nên phơi trực tiếp.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w2-4",
        text: "TLS thật với certbot --nginx, kiểm tra renew --dry-run",
        lesson: `**Việc cần làm.** TLS thật: \`apt install certbot python3-certbot-nginx\`, chạy \`certbot --nginx -d tendomain.com\` → có HTTPS trong 2 phút. Mở \`certbot renew --dry-run\` hiểu cơ chế tự gia hạn. Dùng \`curl -v https://...\` xem TLS handshake trong output.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w2-5",
        text: "Học khái niệm TLS handshake + HTTP/2 qua video Practical Networking",
        lesson: `**Việc cần làm.** Học khái niệm TLS handshake + HTTP/2 qua video Practical Networking (2 buổi), không cần sâu toán mã hóa.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w2-6",
        text: "Ghi chú Feynman: chuyện gì xảy ra khi mở https://tendomain.com",
        lesson: `**Việc cần làm.** Ghi chú Feynman: "Chuyện gì xảy ra khi user mở https://tendomain.com" — viết từ trải nghiệm thật: DNS → TCP → TLS → Nginx → app → response.

**Nguồn.** [Giai đoạn 2 — Tuần 3–4](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w3",
    week: "Tuần 5–6",
    title: "Image tối ưu cho Spring Boot",
    goal: "Image < 200MB, build lại nhanh nhờ cache, an toàn cơ bản.",
    doneWhen: "Image < 200MB; rebuild khi đổi code < 30 giây; hadolint và Trivy (HIGH/CRITICAL) sạch; bảng số liệu có trong README.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "spring.io — hướng dẫn Spring Boot Docker", href: "https://spring.io/" },
    ],
    items: [
      {
        id: "sj-gd2-w3-1",
        text: "Đo hiện trạng: Dockerfile ngây thơ, ghi size, xem layer bằng docker history",
        lesson: `**Việc cần làm.** Đo hiện trạng: viết Dockerfile ngây thơ (\`FROM eclipse-temurin:21-jdk\`, COPY jar, ENTRYPOINT) → \`docker images\` ghi size (thường 450–600MB). \`docker history <image>\` xem layer nào to.

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w3-2",
        text: "Đổi base image sang eclipse-temurin:21-jre, đo lại size",
        lesson: `**Việc cần làm.** Bước 1 — đổi base image runtime: \`eclipse-temurin:21-jre\` (bỏ JDK) → đo lại.

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w3-3",
        text: "Multi-stage build, COPY pom.xml trước để tận dụng cache dependency",
        lesson: `**Việc cần làm.** Bước 2 — multi-stage + tận dụng cache dependency:
- Stage build: COPY \`pom.xml\` + \`mvnw\` TRƯỚC, chạy \`./mvnw dependency:go-offline\`, RỒI MỚI COPY \`src\` và \`./mvnw package -DskipTests\`. Thứ tự này khiến đổi code không phải tải lại dependency. Kiểm chứng: sửa 1 dòng code, build lại, xem log các layer dependency báo CACHED.

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w3-4",
        text: "Spring Boot layered jar: extract layers, COPY theo thứ tự dependencies trước",
        lesson: `**Việc cần làm.** Bước 3 — Spring Boot layered jar: trong stage build chạy \`java -Djarmode=tools -jar app.jar extract --layers --destination extracted\` (Boot 3.3+; bản cũ dùng \`-Djarmode=layertools ... extract\`). Stage runtime COPY theo thứ tự: \`dependencies\` → \`spring-boot-loader\` → \`snapshot-dependencies\` → \`application\`. Giờ đổi code chỉ rebuild layer cuối vài trăm KB.

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w3-5",
        text: "An toàn: user non-root, healthcheck, hadolint và trivy sạch",
        lesson: `**Việc cần làm.** Bước 4 — an toàn: thêm \`RUN useradd -r appuser\` + \`USER appuser\`; \`EXPOSE 8080\`; healthcheck để sau cho compose. Chạy \`hadolint Dockerfile\` fix cảnh báo; \`trivy image <image>\` fix lỗi HIGH/CRITICAL (thường chỉ cần nâng base image tag mới nhất).

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w3-6",
        text: "Ghi bảng README: size và thời gian rebuild của từng bước",
        lesson: `**Việc cần làm.** Ghi bảng vào README: size + thời gian rebuild-khi-đổi-code của từng bước (ngây thơ → JRE → multi-stage → layered).

**Nguồn.** [Giai đoạn 2 — Tuần 5–6](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w4",
    week: "Tuần 7–8",
    title: "docker-compose môi trường dev chuẩn",
    goal: "1 lệnh dựng full môi trường dev.",
    doneWhen: "Máy lạ + 1 lệnh = môi trường chạy; đề xuất ở công ty đã gửi.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w4-1",
        text: "Viết compose.yaml: app, postgres, redis; biến qua .env không hardcode",
        lesson: `**Việc cần làm.** Viết \`compose.yaml\` gồm: app (build từ Dockerfile), postgres (hoặc DB công ty), redis. Dùng env file \`.env\` cho biến, KHÔNG hardcode password, \`.env\` vào \`.gitignore\` (commit file \`.env.example\`).

**Nguồn.** [Giai đoạn 2 — Tuần 7–8](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w4-2",
        text: "Healthcheck từng service, app chỉ start khi DB sẵn sàng",
        lesson: `**Việc cần làm.** Healthcheck cho từng service: postgres dùng \`pg_isready\`, app dùng \`curl -f http://localhost:8080/actuator/health\`. App khai báo \`depends_on: postgres: condition: service_healthy\` → app chỉ start khi DB sẵn sàng. Thử nghiệm: tắt healthcheck xem app crash lúc DB chưa lên để hiểu giá trị của nó.

**Nguồn.** [Giai đoạn 2 — Tuần 7–8](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w4-3",
        text: "Volume cho data postgres, hiểu khác biệt down vs down -v",
        lesson: `**Việc cần làm.** Volume cho data postgres để không mất dữ liệu khi \`down\`; hiểu khác biệt \`docker compose down\` vs \`down -v\`.

**Nguồn.** [Giai đoạn 2 — Tuần 7–8](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w4-4",
        text: "Kiểm chứng tiêu chí '1 lệnh' bằng máy lạ và nhờ bạn làm theo README",
        lesson: `**Việc cần làm.** Kiểm chứng tiêu chí "1 lệnh": clone repo vào thư mục mới, chạy đúng 1 lệnh \`docker compose up -d\`, mọi thứ chạy. Nhờ 1 người bạn làm theo README — họ tắc ở đâu, README thiếu ở đó.

**Nguồn.** [Giai đoạn 2 — Tuần 7–8](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w4-5",
        text: "Áp dụng tại công ty: đề xuất compose file thay 'cài tay theo file Word'",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: nếu setup môi trường dev cho người mới đang là "cài tay theo file Word", đề xuất compose file này. Quick win dễ được ghi nhận nhất giai đoạn.

**Nguồn.** [Giai đoạn 2 — Tuần 7–8](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w5",
    week: "Tuần 9–10",
    title: "CI — build & test tự động",
    goal: "Mọi push/PR đều được build + test tự động, PR đỏ không được merge.",
    doneWhen: "PR đỏ không merge được; CI < 5 phút với cache; badge xanh trên README.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w5-1",
        text: "Tạo ci.yml: checkout → setup-java (temurin 21, cache maven) → mvnw verify",
        lesson: `**Việc cần làm.** Trong repo \`springboot-cicd-observability\`, tạo \`.github/workflows/ci.yml\`: trigger \`on: [push, pull_request]\`; các step: \`actions/checkout\` → \`actions/setup-java\` (distribution temurin, java 21, \`cache: maven\`) → \`./mvnw verify\`.

**Nguồn.** [Giai đoạn 2 — Tuần 9–10](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w5-2",
        text: "Chạy thử Testcontainers trên ubuntu-latest, tự kiểm chứng Docker daemon sẵn có",
        lesson: `**Việc cần làm.** Testcontainers chạy được sẵn trên runner \`ubuntu-latest\` (có Docker daemon) — không cần config thêm. Chạy thử để tự kiểm chứng.

**Nguồn.** [Giai đoạn 2 — Tuần 9–10](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w5-3",
        text: "Đọc hiểu workflow/job/step/secrets, thêm badge CI vào README",
        lesson: `**Việc cần làm.** Đọc hiểu các khái niệm ngay trên file mình vừa viết: workflow/job/step, biến \`\${{ github.sha }}\`, secrets. Thêm badge trạng thái CI vào README.

**Nguồn.** [Giai đoạn 2 — Tuần 9–10](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w5-4",
        text: "Branch protection: require status check pass + require PR, tự thử PR đỏ",
        lesson: `**Việc cần làm.** Branch protection: Settings → Branches → require status check pass trước khi merge + require PR. Tự thử: tạo PR có test fail → nút merge bị khóa. Trải nghiệm này là văn hóa CI.

**Nguồn.** [Giai đoạn 2 — Tuần 9–10](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w5-5",
        text: "Tối ưu: xem thời gian chạy tab Actions, xác nhận cache Maven hoạt động",
        lesson: `**Việc cần làm.** Tối ưu: xem thời gian chạy trong tab Actions, xác nhận cache Maven hoạt động (lần 2 nhanh hơn hẳn).

**Nguồn.** [Giai đoạn 2 — Tuần 9–10](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w6",
    week: "Tuần 11–12",
    title: "CD phần 1 — build image & deploy staging",
    goal: "Push code lên main → image mới tự lên VPS staging.",
    doneWhen: "Push main → staging tự cập nhật không đụng tay; image có tag SHA trên ghcr; Trivy gate hoạt động.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w6-1",
        text: "Job build-push trên main: login ghcr.io, build-push-action tag SHA + latest",
        lesson: `**Việc cần làm.** Thêm job build-push (chỉ chạy trên main, \`needs: test\`): \`docker/login-action\` vào ghcr.io (dùng \`GITHUB_TOKEN\` có sẵn) → \`docker/build-push-action\` với tags: \`ghcr.io/<user>/app:\${{ github.sha }}\` và \`:latest\` chỉ cho staging. Quy tắc ghi vào README: production KHÔNG BAO GIỜ deploy tag \`latest\`, chỉ deploy tag SHA/semver — để rollback được và biết chính xác đang chạy gì.

**Nguồn.** [Giai đoạn 2 — Tuần 11–12](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w6-2",
        text: "Thêm step scan trivy-action, exit-code 1 cho CRITICAL",
        lesson: `**Việc cần làm.** Thêm step scan: \`aquasecurity/trivy-action\` với \`exit-code: 1\` cho CRITICAL → image lỗi nặng không được push.

**Nguồn.** [Giai đoạn 2 — Tuần 11–12](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w6-3",
        text: "Job deploy staging: ssh-action pull image mới, compose up -d app",
        lesson: `**Việc cần làm.** Job deploy staging: dùng \`appleboy/ssh-action\` SSH vào VPS chạy: \`docker pull <image:sha> && docker compose up -d app\` (compose trên VPS trỏ image theo biến). Secrets cần: \`SSH_HOST\`, \`SSH_USER\`, \`SSH_KEY\` (tạo key riêng cho CI, không dùng key cá nhân).

**Nguồn.** [Giai đoạn 2 — Tuần 11–12](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w6-4",
        text: "Chuyển VPS từ systemd jar sang container, giữ Nginx phía trước",
        lesson: `**Việc cần làm.** Trên VPS: app giờ chạy bằng container thay vì systemd jar (giữ Nginx phía trước như cũ). Chuyển đổi này chính là "containerize" một hệ thống đang chạy — kinh nghiệm quý.

**Nguồn.** [Giai đoạn 2 — Tuần 11–12](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w6-5",
        text: "Kiểm chứng end-to-end: sửa code → push → thấy thay đổi trên staging",
        lesson: `**Việc cần làm.** Kiểm chứng end-to-end: sửa 1 dòng code → push → 5 phút sau curl staging thấy thay đổi. Ghi video/GIF ngắn cho README.

**Nguồn.** [Giai đoạn 2 — Tuần 11–12](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w7",
    week: "Tuần 13–14",
    title: "CD phần 2 — production, approval, rollback",
    goal: "Deploy production có kiểm soát, rollback đã diễn tập; bắt đầu tự động hóa tại công ty.",
    doneWhen: "Production cần approval; rollback đã diễn tập có số liệu; tại công ty tối thiểu xong bước (b) — script hóa.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w7-1",
        text: "GitHub Environment production với required reviewers, chờ Approve",
        lesson: `**Việc cần làm.** Tạo GitHub Environment \`production\` với required reviewers (chính bạn). Job deploy-prod dùng \`environment: production\` → pipeline dừng chờ bấm Approve. Trải nghiệm luồng: push → staging tự động → bấm duyệt → production.

**Nguồn.** [Giai đoạn 2 — Tuần 13–14](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w7-2",
        text: "Rollback qua workflow_dispatch, diễn tập thật 1 lần, đo thời gian",
        lesson: `**Việc cần làm.** Rollback: viết script/job nhận input tag SHA cũ (\`workflow_dispatch\` với input) → deploy lại tag đó. DIỄN TẬP THẬT 1 LẦN: deploy bản "lỗi" (đổi màu trang chủ chẳng hạn) → rollback → đo mất bao nhiêu phút. Ghi vào README. Rollback chưa từng diễn tập = không có rollback.

**Nguồn.** [Giai đoạn 2 — Tuần 13–14](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w7-3",
        text: "Tại công ty: viết ra deploy thủ công, script hóa, đưa vào CI, trình bày số liệu",
        lesson: `**Việc cần làm.** Dự án tại công ty — làm theo 4 bước:
- (a) Viết ra giấy TỪNG bước deploy thủ công hiện tại (lệnh gì, ai làm, mất bao lâu, bước nào hay sai).
- (b) Gom các lệnh thành 1 script bash có kiểm tra lỗi (\`set -euo pipefail\`) + health check cuối. Đưa team dùng chung → đã giảm sai sót ngay.
- (c) Đưa script vào CI của công ty (GitHub Actions/GitLab CI/Jenkins tùy công ty — tư duy y hệt, chỉ khác cú pháp; nếu là GitLab CI, đọc quickstart 1 buổi là chuyển được).
- (d) Trình bày cho lead với số liệu: "trước 30 phút/lần + tháng sai 2 lần; giờ 5 phút + có log + rollback được".
- Nếu công ty không cho làm → mô phỏng đúng quy trình công ty trên VPS cá nhân và vẫn trình bày như một đề xuất.

**Nguồn.** [Giai đoạn 2 — Tuần 13–14](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w8",
    week: "Tuần 15–16",
    title: "Metrics — Actuator, Micrometer, Prometheus",
    goal: "App phơi metrics chuẩn, Prometheus thu thập được, bạn query được.",
    doneWhen: "Tự viết được 4 query trên không nhìn note; custom metric hiện trong Prometheus và thay đổi khi gọi API.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w8-1",
        text: "Thêm actuator + micrometer-registry-prometheus, mở /actuator/prometheus",
        lesson: `**Việc cần làm.** Thêm dependency \`spring-boot-starter-actuator\` + \`micrometer-registry-prometheus\`; config \`management.endpoints.web.exposure.include=health,info,prometheus,metrics\`. Mở \`/actuator/prometheus\` đọc thử raw output — hiểu format \`tên_metric{label="..."} giá_trị\`.

**Nguồn.** [Giai đoạn 2 — Tuần 15–16](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w8-2",
        text: "Thêm Prometheus vào compose, scrape /actuator/prometheus mỗi 15s",
        lesson: `**Việc cần làm.** Thêm Prometheus vào compose; \`prometheus.yml\` có \`scrape_configs\` job trỏ \`app:8080\` với \`metrics_path: /actuator/prometheus\`, \`scrape_interval: 15s\`. Mở UI Prometheus (9090) → Status → Targets thấy UP.

**Nguồn.** [Giai đoạn 2 — Tuần 15–16](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w8-3",
        text: "Học PromQL: request rate, error rate, p95 latency, heap usage",
        lesson: `**Việc cần làm.** Học PromQL bằng 4 query lõi (gõ từng cái trong UI, quan sát khi bắn tải bằng \`hey\`):
- Request rate: \`rate(http_server_requests_seconds_count[5m])\`
- Error rate: thêm \`{status=~"5.."}\` chia cho tổng
- p95 latency: \`histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))\`
- Heap: \`jvm_memory_used_bytes{area="heap"}\`

**Nguồn.** [Giai đoạn 2 — Tuần 15–16](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w8-4",
        text: "Custom metric nghiệp vụ: Counter orders_created_total với tag status",
        lesson: `**Việc cần làm.** Custom metric nghiệp vụ: inject \`MeterRegistry\`, tạo \`Counter\` (vd \`orders_created_total\` với tag \`status\`) tăng trong service. Đây là khác biệt giữa "cài cho có" và "đo cái business cần".

**Nguồn.** [Giai đoạn 2 — Tuần 15–16](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w8-5",
        text: "Ghi chú Feynman: RED method (Rate, Errors, Duration)",
        lesson: `**Việc cần làm.** Ghi chú Feynman: RED method (Rate, Errors, Duration) — vì sao 3 số này đủ nói sức khỏe 1 service.

**Nguồn.** [Giai đoạn 2 — Tuần 15–16](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w9",
    week: "Tuần 17–18",
    title: "Grafana dashboard & alert",
    goal: "1 dashboard nhìn 10 giây biết app khỏe hay ốm; 2 alert hoạt động thật.",
    doneWhen: "Dashboard đủ 3 hàng và phản ứng với tải; đã NHẬN được alert thật trên điện thoại.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "grafana.com/tutorials", href: "https://grafana.com/tutorials/" },
    ],
    items: [
      {
        id: "sj-gd2-w9-1",
        text: "Thêm Grafana vào compose, import dashboard cộng đồng JVM (Micrometer) ID 4701",
        lesson: `**Việc cần làm.** Thêm Grafana vào compose, add datasource Prometheus. Khởi động nhanh: import dashboard cộng đồng "JVM (Micrometer)" ID **4701** → xem cách người ta làm.

**Nguồn.** [Giai đoạn 2 — Tuần 17–18](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w9-2",
        text: "Tự dựng dashboard 3 hàng: RED, JVM (heap/GC/threads), HikariCP",
        lesson: `**Việc cần làm.** Tự dựng dashboard riêng (bắt buộc, để hiểu): hàng 1 — RED (request rate, error rate, p95/p99); hàng 2 — JVM (heap, GC pause \`rate(jvm_gc_pause_seconds_sum[5m])\`, threads); hàng 3 — HikariCP (\`hikaricp_connections_active\` vs \`hikaricp_connections_max\`). Kiến thức GC/pool của giai đoạn 1 giờ hiện lên màn hình — vòng lặp học đã khép.

**Nguồn.** [Giai đoạn 2 — Tuần 17–18](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w9-3",
        text: "Kiểm chứng dashboard bằng tải hey -z 2m -c 50, xem panel nhúc nhích",
        lesson: `**Việc cần làm.** Kiểm chứng dashboard bằng tải: chạy \`hey -z 2m -c 50 ...\` và nhìn từng panel nhúc nhích. Panel nào không đổi khi có tải → đang đo sai.

**Nguồn.** [Giai đoạn 2 — Tuần 17–18](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w9-4",
        text: "2 alert rule (error rate, heap) + endpoint /boom kiểm chứng nhận tin nhắn thật",
        lesson: `**Việc cần làm.** Alert: tạo 2 rule trong Grafana Alerting — error rate > 5% trong 5 phút; heap > 85% trong 5 phút. Notification về Telegram/Slack webhook cá nhân. Kiểm chứng: viết endpoint \`/boom\` ném exception, bắn tải vào → nhận tin nhắn thật.

**Nguồn.** [Giai đoạn 2 — Tuần 17–18](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w10",
    week: "Tuần 19–20",
    title: "Logs — structured logging & Loki",
    goal: "Log JSON có correlation ID, tra được bằng query, nhảy được từ metric sang log.",
    doneWhen: "Tự truy được hành trình 1 request lỗi từ dashboard → Loki → requestId trong < 3 phút.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w10-1",
        text: "Structured logging: logstash-logback-encoder xuất JSON qua logback-spring.xml",
        lesson: `**Việc cần làm.** Structured logging: thêm \`logstash-logback-encoder\`, cấu hình \`logback-spring.xml\` xuất JSON (mỗi dòng log là 1 JSON có timestamp, level, logger, message, mdc). So sánh trước/sau bằng mắt để thấy vì sao máy parse được JSON còn text thì khó.

**Nguồn.** [Giai đoạn 2 — Tuần 19–20](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w10-2",
        text: "Filter correlation ID: X-Request-Id vào MDC, clear ở finally",
        lesson: `**Việc cần làm.** Correlation ID: viết 1 servlet Filter — lấy header \`X-Request-Id\` (không có thì \`UUID.randomUUID()\`), bỏ vào \`MDC.put("requestId", ...)\`, nhớ \`MDC.clear()\` ở finally, set lại header vào response. Mọi dòng log của 1 request giờ chung 1 id. (Xịn hơn: dùng Micrometer Tracing để có traceId chuẩn — làm nếu còn thời gian.)

**Nguồn.** [Giai đoạn 2 — Tuần 19–20](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w10-3",
        text: "Thêm Loki + Promtail vào compose, add datasource Loki vào Grafana",
        lesson: `**Việc cần làm.** Thêm Loki + Promtail (hoặc Alloy) vào compose: Promtail đọc log container Docker (mount \`/var/lib/docker/containers\` + \`docker_sd_configs\` hoặc dùng Loki Docker driver). Add datasource Loki vào Grafana.

**Nguồn.** [Giai đoạn 2 — Tuần 19–20](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w10-4",
        text: "Học LogQL 3 truy vấn, diễn tập luồng debug từ dashboard sang Loki",
        lesson: `**Việc cần làm.** Học LogQL bằng 3 truy vấn: \`{container="app"}\` xem tất cả; \`|= "ERROR"\` lọc lỗi; \`| json | requestId="abc-123"\` truy toàn bộ hành trình 1 request. Kịch bản diễn tập: gọi API lỗi → thấy error rate tăng trên dashboard → click sang Loki lọc ERROR đúng khung giờ → lấy requestId → xem cả chuỗi log của request đó. Đây chính là luồng debug production thực tế.

**Nguồn.** [Giai đoạn 2 — Tuần 19–20](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w10-5",
        text: "Áp dụng tại công ty: đề xuất correlation ID nếu log chưa có",
        lesson: `**Việc cần làm.** Áp dụng tại công ty: nếu log chưa có correlation ID → đây là đề xuất giá trị cao, chi phí thấp (1 filter + 1 dòng pattern). Viết đề xuất kèm demo.

**Nguồn.** [Giai đoạn 2 — Tuần 19–20](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w11",
    week: "Tuần 21–22",
    title: "Game day — tự gây sự cố, tự chẩn đoán",
    goal: "Chẩn đoán 4 loại sự cố chỉ bằng dashboard/log, mỗi loại < 10 phút.",
    doneWhen: "4/4 sự cố chẩn đoán đúng < 10 phút; 4 runbook hoàn chỉnh.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w11-1",
        text: "Chuẩn bị 4 công tắc sự cố: memory leak, query chậm, thread pool cạn, disk đầy",
        lesson: `**Việc cần làm.** Chuẩn bị 4 "công tắc sự cố" trên app VPS (ẩn sau endpoint admin):
- Memory leak: endpoint mỗi lần gọi add 5MB vào static list.
- Query chậm: endpoint chạy \`SELECT pg_sleep(2)\` hoặc query bảng lớn không index.
- Thread pool cạn: endpoint sleep 30s, pool cấu hình 5 thread — bắn 50 request là nghẽn.
- Disk đầy: script \`fallocate -l 90% dung lượng còn lại\` (cẩn thận, làm trên VPS lab).

**Nguồn.** [Giai đoạn 2 — Tuần 21–22](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w11-2",
        text: "Chơi: kích hoạt ngẫu nhiên 1 công tắc, bấm giờ chẩn đoán chỉ bằng dashboard",
        lesson: `**Việc cần làm.** Cách chơi cho đúng: nhờ bạn kích hoạt ngẫu nhiên 1 công tắc (hoặc tự viết script random rồi chờ 1 ngày cho quên). Khi alert nổ hoặc thấy dashboard bất thường: bấm giờ, CHỈ dùng Grafana/Loki/lệnh trên server (không đọc code) đến khi nêu đúng nguyên nhân. Ghi thời gian.

**Nguồn.** [Giai đoạn 2 — Tuần 21–22](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w11-3",
        text: "Viết runbook nửa trang cho mỗi sự cố, bỏ vào repo /runbooks",
        lesson: `**Việc cần làm.** Sau mỗi sự cố, viết runbook nửa trang: triệu chứng trên dashboard → lệnh/truy vấn kiểm tra → cách xử lý tạm + xử lý gốc. 4 runbook bỏ vào repo \`/runbooks\`.

**Nguồn.** [Giai đoạn 2 — Tuần 21–22](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w11-4",
        text: "Sự cố quá 10 phút → bổ sung panel/alert đang thiếu tín hiệu rồi chơi lại",
        lesson: `**Việc cần làm.** Sự cố nào quá 10 phút → dashboard/alert đang thiếu tín hiệu → bổ sung panel/alert rồi chơi lại.

**Nguồn.** [Giai đoạn 2 — Tuần 21–22](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w12",
    week: "Tuần 23–24",
    title: "Hoàn thiện portfolio + blog",
    goal: "Đóng gói repo và kể lại hành trình tự động hóa bằng một bài blog thật.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w12-1",
        text: "README repo: sơ đồ kiến trúc, ảnh dashboard, bảng số liệu, hướng dẫn 1 lệnh",
        lesson: `**Việc cần làm.** README repo: sơ đồ kiến trúc (vẽ bằng Excalidraw/draw.io), ảnh dashboard, bảng số liệu image size, hướng dẫn chạy 1 lệnh, mục "Những gì tôi học được".

**Nguồn.** [Giai đoạn 2 — Tuần 23–24](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-w12-2",
        text: "Viết blog 'Tự động hóa deploy Spring Boot: từ 30 phút đến 5 phút CI/CD'",
        lesson: `**Việc cần làm.** Viết blog "Tự động hóa deploy Spring Boot: từ 30 phút thủ công đến 5 phút CI/CD": bối cảnh → từng bước → số liệu → bài học. Đăng lên dev.to / Viblo / blog cá nhân. Bài đầu không cần hay, cần THẬT.

**Nguồn.** [Giai đoạn 2 — Tuần 23–24](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-w13",
    week: "Tuần 25–26",
    title: "Đánh giá & buffer",
    goal: "Chốt sổ giai đoạn và trả nợ các tuần bị trễ.",
    resources: [
      { label: "Giai đoạn 2 — bản đầy đủ", href: "#/docs/sj-02" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd2-w13-1",
        text: "Chấm checklist nghiệm thu và làm review quý",
        lesson: `**Việc cần làm.** Chấm từng dòng của checklist đánh giá cuối giai đoạn, rồi làm nghi thức review quý theo tài liệu tổng quan: cập nhật CV với thành tích đo được, dọn README các repo mới, và viết một đoạn trả lời "Quý này tôi làm được gì mà 3 tháng trước tôi chưa làm được?".

**Nguồn.** [Tổng quan — Nghi thức review hàng quý](#/docs/sj-00)`,
      },
      {
        id: "sj-gd2-w13-2",
        text: "Dùng buffer trả nợ các tuần trễ",
        lesson: `**Việc cần làm.** Rà lại 12 tuần trước, chọn phần bị bỏ dở và hoàn tất trong hai tuần đệm này. Nếu không nợ gì thì dùng thời gian để làm sâu thêm phần observability — nguồn nói rõ trượt observability thì mang sang giai đoạn 3 làm tiếp trên Kubernetes.

**Nguồn.** [Giai đoạn 2 — Tuần 25–26](#/docs/sj-02)`,
      },
    ],
  },

  {
    id: "sj-gd2-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 2 — 7 tiêu chí bắt buộc",
    goal: "Cổng ra của giai đoạn 2. Đạt ≥ 6/7 thì sang giai đoạn 3; trượt riêng observability thì mang sang giai đoạn 3 làm tiếp trên Kubernetes.",
    items: [
      {
        id: "sj-gd2-done-1",
        text: "Deploy công ty (hoặc mô phỏng) tự động, có số liệu trước/sau",
        lesson: `**Cách tự chấm.** Kiểm tra pipeline deploy tại công ty (hoặc bản mô phỏng 1:1) đã chạy tự động, và bạn có số liệu thời gian trước/sau để chứng minh.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-2",
        text: "Pipeline đủ: test → scan → tag SHA → staging tự động → production approval → rollback",
        lesson: `**Cách tự chấm.** Kiểm tra pipeline có đủ chuỗi: test → scan (Trivy) → image tag SHA → staging tự động → production cần approval → rollback đã diễn tập, đúng như đã dựng ở tuần 9–14.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-3",
        text: "Image < 200MB, non-root, Trivy HIGH/CRITICAL sạch",
        lesson: `**Cách tự chấm.** Kiểm tra lại image cuối cùng: dưới 200MB, chạy bằng user non-root, và \`trivy image\` sạch lỗi HIGH/CRITICAL — như đã đạt ở tuần 5–6.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-4",
        text: "Dashboard RED + JVM + pool, 2 alert đã nổ thật vào điện thoại",
        lesson: `**Cách tự chấm.** Kiểm tra dashboard Grafana đủ 3 hàng (RED, JVM, HikariCP) và cả 2 alert (error rate, heap) đã từng nổ thật lên điện thoại bạn, như ở tuần 17–18.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-5",
        text: "Log JSON + correlation ID, truy vết 1 request < 3 phút",
        lesson: `**Cách tự chấm.** Tự thử lại luồng debug: từ dashboard → Loki → requestId, tính thời gian truy vết một request lỗi — phải dưới 3 phút, như ở tuần 19–20.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-6",
        text: "Game day 4/4 sự cố < 10 phút, có 4 runbook",
        lesson: `**Cách tự chấm.** Đếm lại kết quả game day ở tuần 21–22: cả 4 sự cố phải được chẩn đoán đúng trong dưới 10 phút, và có đủ 4 runbook trong repo.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
      {
        id: "sj-gd2-done-7",
        text: "Blog đã đăng",
        lesson: `**Cách tự chấm.** Kiểm tra bài blog "Tự động hóa deploy Spring Boot" viết ở tuần 23–24 đã thực sự được đăng lên (dev.to / Viblo / blog cá nhân), không chỉ nằm bản nháp.

**Nguồn.** [Giai đoạn 2 — Checklist đánh giá cuối giai đoạn](#/docs/sj-02)`,
      },
    ],
  },
];
