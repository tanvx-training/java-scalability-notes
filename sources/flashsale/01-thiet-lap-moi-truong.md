# Thiết lập môi trường — tài liệu chi tiết

Môi trường làm việc dựng một lần ở giữa giai đoạn 0 và bổ sung dần theo giai đoạn; mục tiêu là không mất buổi nào vì cài đặt, và có smoke test để biết máy sẵn sàng trước khi bắt đầu mỗi giai đoạn.

## 1. Yêu cầu máy và hệ điều hành

Giai đoạn 0–3 chạy được trên laptop 16 GB RAM; giai đoạn 4 (kind với Kafka, 3 PostgreSQL, Redis Sentinel, Grafana stack) cần 32 GB hoặc một VPS theo giờ; đây là ràng buộc cần biết từ đầu để không bất ngờ ở tuần 17.

**1.1. Cấu hình**

| Mức | CPU | RAM | Đĩa | Đủ cho |
| --- | --- | --- | --- | --- |
| Tối thiểu | 4 nhân | 16 GB | 60 GB trống SSD | Giai đoạn 0–3 với Compose; giai đoạn 4 phải cắt Grafana stack và chạy 1 node kind |
| Khuyến nghị | 8 nhân | 32 GB | 100 GB trống SSD | Toàn bộ dự án kể cả kind 3 node và Chaos Mesh |
| Thay thế | Laptop 16 GB + VPS 4 vCPU/16 GB theo giờ cho giai đoạn 4 |  |  | Xem ngân sách ở tab Quy ước mục 11 |

CPU ARM (Apple Silicon, Graviton) hoạt động tốt với toàn bộ stack (Temurin, PostgreSQL, Redis, Kafka, kind đều có image arm64); lưu ý ở mục 5 cho vài công cụ.

**1.2. Hệ điều hành**

| HĐH | Docker | Ghi chú |
| --- | --- | --- |
| macOS | Docker Desktop, OrbStack (nhẹ hơn, khuyến nghị) hoặc Colima | Cấp cho VM Docker tối thiểu 4 CPU / 8 GB ở giai đoạn 0–3, 6 CPU / 16 GB ở giai đoạn 4 |
| Linux (Ubuntu 24.04) | Docker Engine + Compose plugin | Nhẹ nhất; async-profiler và perf\_event hoạt động đầy đủ; là môi trường đo tốt nhất |
| Windows 11 | WSL2 (Ubuntu) + Docker Desktop với WSL backend | Làm toàn bộ trong WSL2 (repo, IDE remote, Docker); cấu hình `.wslconfig` với `memory=16GB`, `processors=6`; không đặt repo trên ổ Windows (chậm và lỗi quyền) |

**1.3. Phân bổ tài nguyên theo giai đoạn (Docker/VM)**

| Giai đoạn | Container chính | CPU / RAM cấp cho Docker | Ghi chú |
| --- | --- | --- | --- |
| 0–1 | PostgreSQL, Redis, Kafka, Keycloak | 4 / 6 GB | Kafka KRaft 1 broker \~1 GB |
| 2 | + Grafana, Prometheus (tùy chọn), k6 ngoài Docker | 4 / 8 GB; môi trường đo cố định theo `compose.perf.yaml` | Tắt IDE index khi đo |
| 3 | + Kafka Connect, Apicurio, Traefik, 2 service mới, gateway mock, 2 PostgreSQL thêm | 6 / 12 GB | Kafka Connect \~1 GB; giảm `Xmx` service xuống 512 MB local |
| 4 | kind 3 node với operator | 6–8 / 16 GB | Grafana stack \~3 GB; Chaos Mesh \~0,5 GB; tắt observability khi không đo |
| 5 | Như giai đoạn 4 khi cần chạy lại; phần lớn thời gian chỉ cần IDE và trình duyệt |  |  |

## 2. Danh sách công cụ theo giai đoạn

Cài theo giai đoạn cần; cột "Kiểm tra" là lệnh xác nhận cài đúng và cũng là nội dung smoke test ở mục 6. Version ghi là dòng chính, số cụ thể lấy từ `gradle/libs.versions.toml` và `.tool-versions` trong repo.

**2.1. Nền (giai đoạn 0)**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| Git 2.4x | Trình quản lý gói của HĐH | `git --version`; `git config commit.gpgsign` = true |
| SDKMAN | Script chính chủ | `sdk version` |
| Java 25 (Temurin) | `sdk install java 25-tem` | `java -version` hiện 25 |
| Gradle (dùng wrapper của repo) | Có sẵn qua `./gradlew` | `./gradlew --version` |
| Docker + Compose v2 | Theo HĐH (mục 1.2) | `docker compose version`; `docker run --rm hello-world` |
| Python 3.12 + pipx | HĐH hoặc `uv` | `pipx --version` (cho pre-commit, semgrep, schemathesis, sqlmap) |
| pre-commit, gitleaks | `pipx install pre-commit`; gitleaks binary | `pre-commit run --all-files` xanh trên repo rỗng |
| Structurizr Lite | Docker image `structurizr/lite` | Mở `http://localhost:8080` thấy workspace |
| OWASP Threat Dragon | Bản desktop từ GitHub Releases | Mở được file `.json` mẫu |
| NVD API key | Đăng ký trên trang NVD | Biến môi trường `NVD_API_KEY` có giá trị |

**2.2. Giai đoạn 1**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| IntelliJ IDEA (Community đủ; Ultimate có Spring và HTTP client tốt hơn) | JetBrains Toolbox | Mở repo, Gradle sync xanh |
| Bruno hoặc IntelliJ HTTP client | Bruno từ trang chính chủ | Gọi được `GET /actuator/health` |
| Burp Suite Community + Turbo Intruder | PortSwigger | Proxy 8080 nhận request từ Bruno |
| jwt\_tool | `git clone` + `pip install -r requirements.txt` trong venv | `python3 jwt_tool.py -h` |
| Keycloak (Docker) | Trong `compose.yaml` | `http://localhost:8081` đăng nhập admin |
| CodeQL (chỉ CI) | GitHub | Tab Security có kết quả sau push đầu |

**2.3. Giai đoạn 2**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| k6 | Binary hoặc `brew install k6` | `k6 run perf/k6/smoke.js` |
| async-profiler | Tải release cho HĐH/CPU | `asprof -v`; trên Linux cần `perf_event_paranoid` ≤ 1 (mục 5) |
| JDK Mission Control | Tải từ Adoptium hoặc Oracle | Mở được file `.jfr` |
| redis-cli | Có trong image Redis; hoặc `brew install redis` | `redis-cli -u redis://:dev-only@localhost:6379 PING` |
| Eclipse MAT (tùy chọn) | Tải | Mở heap dump |

**2.4. Giai đoạn 3**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| kcat | `brew install kcat` hoặc Docker `edenhill/kcat` | `kcat -L -b localhost:9092` |
| Kafka UI (Docker) | Trong `compose.yaml` | Thấy 8 topic |
| Apicurio Registry (Docker) | Trong `compose.yaml` | `curl localhost:8085/apis/registry/v3/system/info` (port và path theo bản đang dùng) |
| Kafka Connect + Debezium (Docker) | Image tự build từ `kafka-connect/Dockerfile` | `curl localhost:8083/connectors` trả `[]` rồi có `order-outbox` |
| Toxiproxy | Docker `ghcr.io/shopify/toxiproxy` + CLI | `toxiproxy-cli list` |

**2.5. Giai đoạn 4**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| kind | Binary | `kind create cluster --config deploy/kind/cluster.yaml` |
| kubectl, helm, kustomize | Binary | `kubectl get nodes` thấy 3 node Ready |
| Cilium CLI + Hubble CLI | Binary | `cilium status` OK |
| Argo CD CLI, Kyverno CLI | Binary | `argocd version`; `kyverno version` |
| Syft, Trivy, cosign | Binary | `trivy image alpine:3.20` chạy được |
| kube-bench, OWASP ZAP (Docker), schemathesis (`pipx`) | Docker/pipx | `schemathesis --version` |
| Chaos Mesh CLI (tùy chọn) | Binary | Dashboard mở qua port-forward |
| yq | Binary | `yq --version` |

**2.6. Giai đoạn 5**

| Công cụ | Cài bằng | Kiểm tra |
| --- | --- | --- |
| GraalVM for JDK 25 (Community) | `sdk install java 25-graalce` (tên distribution theo SDKMAN hiện hành) | `native-image --version` |
| PlantUML | Plugin IntelliJ hoặc Docker `plantuml/plantuml-server` | Render `.puml` mẫu |
| AWS Pricing Calculator, Well-Architected Tool | Web | Tài khoản AWS free tier (không tạo tài nguyên trả phí) |
| Trình soạn slide (Google Slides, Keynote, hoặc reveal.js trong repo) | Web/Markdown | 12 slide mẫu |

## 3. Script cài đặt và Makefile

Mọi thao tác lặp lại nằm trong `Makefile` ở gốc repo; một người mới (hoặc chính bạn sau kỳ nghỉ) chỉ cần `make doctor` rồi `make up`.

**3.1. `scripts/setup.sh` (trích, macOS/Linux; WSL2 dùng nhánh Linux)**

```bash
#!/usr/bin/env bash
set -euo pipefail

phase="${1:-0}"   # cài công cụ tới giai đoạn này

has() { command -v "$1" >/dev/null 2>&1; }

# Nền
has sdk || curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 25-tem || true
sdk default java 25-tem
has pipx || python3 -m pip install --user pipx
pipx install pre-commit || true
has gitleaks || echo "Cai gitleaks theo huong dan cua HDH"

if [ "$phase" -ge 2 ]; then
  has k6 || echo "Cai k6: https://grafana.com/docs/k6/latest/set-up/install-k6/"
  [ -d "$HOME/.async-profiler" ] || echo "Tai async-profiler release cho HDH/CPU vao ~/.async-profiler"
fi

if [ "$phase" -ge 4 ]; then
  for t in kind kubectl helm cilium argocd kyverno syft trivy cosign yq; do
    has "$t" || echo "Thieu $t"
  done
fi

pre-commit install
echo "Xong. Chay: make doctor"
```

Script không tự tải binary từ `curl | sh` cho công cụ ngoài SDKMAN (đúng quy tắc supply chain); nó in ra thứ còn thiếu để cài bằng trình quản lý gói hoặc binary có checksum.

**3.2. `Makefile` (mục tiêu chính)**

```makefile
.PHONY: doctor up down perf-up cluster-up cluster-down test test-concurrent smoke

doctor:            ## kiem tra cong cu va version
	@./scripts/doctor.sh

up:                ## compose cho dev (giai doan 0-3)
	docker compose up -d --wait

down:
	docker compose down -v

perf-up:           ## moi truong do co dinh (giai doan 2+)
	docker compose -f compose.perf.yaml up -d --wait

test:
	./gradlew build

test-concurrent:   ## lap 10 lan test dong thoi
	./gradlew test -Pflashsale.test.repeat=10 --tests '*Concurrent*'

smoke:             ## smoke test moi truong theo muc 6
	@./scripts/smoke.sh $(PHASE)

cluster-up:        ## kind + operator + ung dung (giai doan 4)
	kind create cluster --config deploy/kind/cluster.yaml || true
	./deploy/kind/install-infra.sh
	helm upgrade --install flashsale deploy/flashsale -f deploy/flashsale/values/kind.yaml -n flashsale --create-namespace

cluster-down:
	kind delete cluster

secrets:           ## sinh Secret cho kind tu .env.kind (khong commit)
	@./scripts/make-secrets.sh

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-18s %s\n", $$1, $$2}'
```

`make help` là tài liệu; mục tiêu mới thêm phải có chú thích `##`.

**3.3. `scripts/doctor.sh`**

In bảng: công cụ, version tìm thấy, version yêu cầu (đọc từ `.tool-versions`), OK/THIẾU; thoát mã 1 nếu thiếu công cụ của giai đoạn hiện hành (đọc từ biến `PHASE` hoặc tag Git gần nhất). Chạy trong CI ở job đầu để CI cũng "doctor" chính nó.

## 4. Cấu hình IDE và công cụ hỗ trợ

IDE cấu hình một lần và commit phần chia sẻ được (`.editorconfig`, run configuration, HTTP client collection) để môi trường tái tạo được trên máy khác.

**4.1. IntelliJ IDEA**

| Mục | Cấu hình |
| --- | --- |
| JDK | Project SDK = Temurin 25; Gradle JVM = cùng SDK; bật preview chỉ trong module thử structured concurrency |
| Plugin | Spring (Ultimate) hoặc Spring Boot Assistant; PlantUML; Kubernetes; Docker; SonarLint (rule Java security); Lombok không dùng (record và Java 25 đủ) |
| Format | `.editorconfig` commit; Spotless với Google Java Format chạy ở pre-commit; IDE dùng cùng cấu hình để không đánh nhau |
| Run configuration | Commit trong `.run/`: `order-service (local)`, `core (local)`, `payment-service (local)`, `all tests`, `concurrent tests x10`; biến môi trường đọc từ `.env` qua plugin EnvFile |
| Test | Chạy Testcontainers từ IDE cần Docker chạy; đặt `testcontainers.reuse.enable=true` trong `~/.testcontainers.properties` để container PostgreSQL tái dùng giữa các lần chạy (nhanh hơn 20–30 giây mỗi lần) |
| Bộ nhớ IDE | `-Xmx4g` cho IDE khi mở multi-module ở giai đoạn 3+ |

**4.2. HTTP client**

- Collection Bruno commit trong `http/` với environment `local` (Compose) và `kind`; request lấy token từ Keycloak bằng client `flashsale-cli` (password grant) rồi lưu vào biến; mọi request mẫu của 10 endpoint có sẵn kèm ví dụ lỗi.
- Với IntelliJ HTTP client: file `http/*.http` tương đương; chọn một trong hai, không duy trì cả hai.

**4.3. Docker**

- Bật BuildKit (mặc định trên Docker mới); `docker buildx` có builder mặc định.
- Cấp tài nguyên theo bảng 1.3; kiểm tra bằng `docker info | grep -E 'CPUs|Total Memory'`.
- Registry mirror không cần; nếu mạng chậm khi pull image lớn (Keycloak, Kafka Connect), pull trước ở buổi đọc.
- Dọn định kỳ: `docker system prune -f --volumes` sau mỗi giai đoạn (mất dữ liệu local, đúng ý).

**4.4. Terminal và shell**

- `direnv` với `.envrc` (không commit) để nạp `.env` và `PHASE`; `.envrc.example` commit.
- Alias: `kx` cho `kubectl -n flashsale`, `lg` cho `git log --oneline --graph -20`.
- `git config core.hooksPath` giữ mặc định để pre-commit hoạt động; không bỏ qua hook bằng `--no-verify` (nếu buộc phải, ghi vào nhật ký).

## 5. Lỗi thường gặp và cách xử lý

Danh sách này bắt đầu với các lỗi biết trước và được bổ sung mỗi khi mất hơn 30 phút cho một lỗi môi trường; mỗi dòng có dấu hiệu, nguyên nhân, cách xử lý.

| Khu vực | Dấu hiệu | Nguyên nhân | Xử lý |
| --- | --- | --- | --- |
| Testcontainers | `Could not find a valid Docker environment` | Docker socket không ở vị trí mặc định (OrbStack, Colima, rootless) | Đặt `DOCKER_HOST` hoặc `~/.testcontainers.properties` với `docker.host`; trên WSL2 chạy test trong WSL, không từ Windows |
| Testcontainers | Test chậm 30–60 giây mỗi lần | Pull và khởi động container mỗi lần | `testcontainers.reuse.enable=true` + `.withReuse(true)`; pull image trước |
| Kafka trong Docker | Client trên host không kết nối được, hoặc kết nối rồi timeout | `advertised.listeners` trỏ vào hostname nội bộ | Hai listener: `PLAINTEXT://kafka:9092` cho trong mạng Compose, `PLAINTEXT_HOST://localhost:29092` cho host; client trong container dùng `kafka:9092` |
| Kafka KRaft | Broker restart mất topic hoặc lỗi cluster id | Volume không gắn hoặc `CLUSTER_ID` đổi | Gắn volume cho `/var/lib/kafka/data`; cố định `CLUSTER_ID` |
| Redis | `NOAUTH` sau khi bật ACL | App vẫn dùng URL không có user | Dùng `redis://user:pass@host`; với Sentinel cấu hình `sentinel.username`/`password` riêng |
| PostgreSQL + Debezium | Connector lỗi `wal_level` | Mặc định `replica` | `command: postgres -c wal_level=logical`; tạo user có `REPLICATION` |
| Debezium | Replication slot lag tăng, đĩa đầy | Connector dừng lâu | Xóa slot khi không dùng (`pg_drop_replication_slot`), giới hạn `max_slot_wal_keep_size` |
| Keycloak | Token có `aud` là `account`, API trả 401 | Chưa có audience mapper | Thêm mapper Audience `flashsale-api` vào client scope |
| Keycloak | Realm import không cập nhật sau khi sửa file | Realm đã tồn tại trong volume | `docker compose down -v` hoặc `--import-realm` chỉ nạp khi realm chưa có; dùng `kc.sh import --override` |
| async-profiler (Linux) | `perf_event_open failed` | `perf_event_paranoid` > 1 hoặc container thiếu capability | `sysctl kernel.perf_event_paranoid=1`; Docker `--cap-add SYS_PTRACE`; hoặc dùng `-e itimer` |
| async-profiler (macOS) | Không có frame native/kernel | Giới hạn của macOS | Chấp nhận; dùng Linux hoặc VPS cho flame graph đầy đủ |
| async-profiler (ARM) | Không tải được binary | Chọn sai kiến trúc | Tải bản `linux-arm64` hoặc `macos` (universal) |
| k6 | `dropped_iterations` cao | `preAllocatedVUs` thấp hoặc máy hết CPU | Tăng `preAllocatedVUs`; chạy k6 trên máy khác; giảm tải và đo tương đối |
| k6 | `too many open files` | ulimit thấp | `ulimit -n 65535` trước khi chạy |
| Virtual threads | Log `jdk.VirtualThreadPinned` trong JFR | Frame native hoặc thư viện cũ | Trên Java 25 hiếm; nếu có, tìm frame và thay thư viện; không dùng `synchronized` quanh I/O trong code cũ |
| kind | Pod `Pending` vì thiếu tài nguyên | Laptop 16 GB | Giảm replica và requests trong `values/kind.yaml`; tắt Grafana stack; hoặc VPS |
| kind + Cilium | Pod không có mạng sau khi cài Cilium | kind tạo với `disableDefaultCNI: true` nhưng Cilium chưa xong | Chờ `cilium status` OK rồi mới cài phần còn lại; script `install-infra.sh` đã có wait |
| kind trên macOS | Ingress không vào được từ host | Port map thiếu | `extraPortMappings` 80/443 trong `cluster.yaml`; OrbStack có route trực tiếp |
| Strimzi | `KafkaConnect` build image lỗi | Registry đích không có quyền | Dùng registry local của kind (`kind load docker-image`) hoặc GHCR với token |
| CloudNativePG | Cluster mãi không Ready | Storage class kind chậm hoặc thiếu | Dùng `standard` storage class của kind; giảm `size` |
| Kyverno | Pod hợp lệ bị từ chối sau khi bật verifyImages | Image chưa ký hoặc subject không khớp | `cosign verify` bằng tay với cùng issuer/subject; kiểm tra nhánh và tên workflow trong policy |
| cosign keyless local | `cosign sign` yêu cầu đăng nhập trình duyệt | Keyless ngoài CI dùng OIDC người dùng | Chỉ ký trong CI; local dùng `cosign verify` |
| Trivy | Chạy lâu lần đầu | Tải DB | Chấp nhận lần đầu; cache `~/.cache/trivy`; trong CI dùng cache action |
| Dependency-Check | Chậm hoặc lỗi 403 | Không có NVD API key | Đặt `NVD_API_KEY`; cache thư mục data giữa các lần chạy |
| Gradle | Build chậm khi multi-module | Daemon và cache | `org.gradle.caching=true`, `org.gradle.parallel=true`, configuration cache bật ở giai đoạn 3+ |
| GraalVM | `ClassNotFoundException` lúc chạy native | Thiếu reachability metadata | Thêm hint hoặc `reachability-metadata.json`; kiểm tra bằng agent tracing trong test |
| WSL2 | I/O rất chậm, quyền file lạ | Repo nằm ở `/mnt/c` | Chuyển repo vào `~` trong WSL; mở IDE bằng remote/WSL mode |

Mỗi lỗi mới thêm vào bảng kèm ngày và link nhật ký; bảng này cũng là nguồn cho mục "lỗi thường gặp" của README.

## 6. Smoke test môi trường trước mỗi giai đoạn

`make smoke PHASE=<n>` chạy trong dưới 10 phút và trả lời một câu: máy này có sẵn sàng cho giai đoạn n không; chạy ở buổi cuối của giai đoạn trước và ở buổi đầu sau kỳ nghỉ.

| Giai đoạn | Kiểm tra | Đạt khi |
| --- | --- | --- |
| 0 | `make doctor`; `docker compose up -d --wait`; `./gradlew build`; `pre-commit run --all-files`; Structurizr Lite render `workspace.dsl` | Tất cả thoát mã 0; 4 container healthy trong 2 phút |
| 1 | Như 0 + lấy token từ Keycloak bằng Bruno; `GET /actuator/health` = UP; `make test-concurrent` với repeat=1 | Token có `aud` đúng; health UP; test đồng thời xanh |
| 2 | `make perf-up`; `k6 run perf/k6/smoke.js` (100 request); `asprof -d 5` gắn vào JVM; `redis-cli PING` với user ACL | k6 không lỗi; flame graph mở được; `PONG` |
| 3 | Compose đầy đủ (Kafka, Connect, Apicurio, Traefik, 3 service, gateway mock) lên trong 4 phút; `curl localhost:8083/connectors` có connector RUNNING; `kcat -L` thấy đủ topic; một đơn đi hết saga (script `scripts/e2e-smoke.sh`) | Đơn về CONFIRMED trong 30 giây |
| 4 | `make cluster-up` trong 15 phút; `kubectl get pods -A` không có Pending/CrashLoop; ingress trả health; Argo CD app Synced/Healthy; `cosign verify` một image; Grafana mở được dashboard SLO | Tất cả xanh; ghi thời gian dựng vào nhật ký |
| 5 | `native-image --version`; render một `.puml`; mở Pricing Calculator lưu được một estimate; repo build xanh ở tag `v4-prod` | Thoát mã 0; estimate có link chia sẻ |

**Sau kỳ nghỉ hoặc tạm dừng**

1. `git pull`, `make doctor`, `./gradlew build` (test toàn bộ) trước khi đọc bất kỳ code nào.
2. Đọc nhật ký 2 tuần cuối và mục "Tuần sau" của tuần cuối.
3. Chạy smoke của giai đoạn hiện hành; lỗi môi trường sửa trước, ghi vào mục 5 nếu mới.
4. Cập nhật Renovate PR đang chờ (chỉ patch/minor) rồi mới tiếp tục việc dở.
