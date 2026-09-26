# Giai đoạn 4 — Production-grade (tài liệu chi tiết)

Sep 26, 2026 · @Nothing

Bốn tuần này đưa ba deployable lên Kubernetes với pipeline có chữ ký, quan sát được theo SLO và sống sót qua chaos test; thước đo là một postmortem viết được từ dashboard chứ không từ trí nhớ.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 4 kết thúc khi một commit lên `main` tự đi qua test, SBOM, quét lỗ hổng, ký image, Argo CD và chính sách Kyverno để thành pod trên kind, còn dashboard cho biết SLO còn bao nhiêu error budget khi chaos test đang chạy.

**Mục tiêu**

- Quan sát được: một request đặt hàng có trace xuyên order-service → Kafka → core và payment-service; metric RED và metric nghiệp vụ; log có `traceId`; dashboard và alert theo SLO chứ không theo ngưỡng CPU.
- Đóng gói và triển khai đúng chuẩn: image non-root, read-only, ký bằng cosign; Helm chart có probe, resource, PDB, graceful shutdown; HPA cho API và KEDA cho consumer.
- Supply chain: SBOM, quét lỗ hổng chặn High/Critical, chính sách chỉ cho chạy image có chữ ký; SLSA build level 2 với GitHub Actions và provenance.
- Chịu lỗi: circuit breaker cho gọi gateway, bulkhead cho Redis, Redis Sentinel failover mà không mất kho; chaos test trên cụm có kết quả ghi lại.
- Kỹ năng vận hành: một sự cố giả lập, một postmortem blameless, bốn runbook.

**Trong phạm vi:** OpenTelemetry qua Micrometer Tracing, Grafana Tempo/Loki/Prometheus, kind, Helm, Strimzi (Kafka), CloudNativePG (PostgreSQL), Redis Sentinel (Bitnami chart), ingress-nginx, Argo CD, Kyverno, KEDA, Chaos Mesh, cosign, Syft, Trivy, kube-bench, OWASP ZAP, schemathesis, Resilience4j, ShedLock.

**Ngoài phạm vi:** cloud thật (giai đoạn 5 chỉ ước lượng chi phí), service mesh (Istio/Linkerd: đọc để so sánh, không cài), multi-cluster, backup PostgreSQL ra object storage (ghi vào SAD), WAF/DDoS tầng mạng, tách `notification` (để mở).

**Definition of Done (đủ mới gắn tag `v4-prod`)**

- [ ] Trace end-to-end trong Tempo: một `traceId` đi qua 3 service và qua Kafka (span `order.placed publish` → `inventory consume`); log của cả 3 service lọc được bằng `traceId` đó trong Loki.
- [ ] Dashboard Grafana `FlashSale SLO` có 4 SLI ở mục 3.3, error budget còn lại 30 ngày, và panel burn rate; alert rule multiwindow (1 giờ / 6 giờ) đã bắn thử một lần trong chaos test.
- [ ] Ba image build từ CI, chạy non-root, filesystem read-only, `USER 10001`, startup dưới 3 giây nhờ AOT cache, kích thước dưới 200 MB.
- [ ] `kind create cluster` + `make cluster-up` dựng đủ: Strimzi Kafka + Connect + Debezium, CloudNativePG, Redis Sentinel, Keycloak, Apicurio, gateway mock, ingress-nginx, Grafana stack, Argo CD, Kyverno, KEDA, Chaos Mesh, trong 15 phút không cần thao tác tay.
- [ ] Helm chart cho 3 service: startup/readiness/liveness probe, requests và limits, PDB `minAvailable: 1`, `terminationGracePeriodSeconds` 30 với preStop, `server.shutdown=graceful`; rolling update không có 5xx khi k6 chạy.
- [ ] HPA order-service 2–6 replica theo CPU 60%; KEDA scale consumer `inventory` theo lag Kafka; test tải trên kind thấy scale lên và xuống.
- [ ] Pipeline: test → build image (buildx) → SBOM (Syft, SPDX) → Trivy (fail High/Critical) → cosign sign keyless + attest SBOM → push GHCR → commit tag mới vào `deploy/values/` → Argo CD sync; Kyverno từ chối image không chữ ký hoặc tag `latest` (test bằng một image cố tình không ký).
- [ ] Resilience4j: circuit breaker mở khi gateway mock trả lỗi 50% trong 10 giây và đóng lại sau khi phục hồi; dashboard thấy trạng thái; đặt hàng không bị ảnh hưởng.
- [ ] Redis Sentinel: kill master giữa k6; Lettuce chuyển sang master mới trong 10 giây; `verify-no-oversell` xanh; ghi rõ số request lỗi trong cửa sổ failover.
- [ ] NetworkPolicy default-deny ở namespace `flashsale`; Pod Security `restricted`; kube-bench không có FAIL ở mức cluster mình kiểm soát; ZAP baseline và schemathesis chạy trong CI, không có High.
- [ ] Chaos Mesh: 5 kịch bản ở mục 9 có kết quả; `docs/postmortem-001.md` theo mẫu mục 10; 4 runbook trong `docs/runbooks/`.
- [ ] `docs/security/attack-log-4.md` có 6 kịch bản; realm Keycloak import lên kind **không** có client `flashsale-cli`.
- [ ] Dòng giai đoạn 4 ở tab chính đổi sang Hoàn thành.

## 2. Lịch 4 tuần theo buổi

16 buổi, khoảng 36 giờ; tuần 16 làm observability ngay trên Compose (để có mắt trước khi chuyển nhà), tuần 17 đóng gói và lên kind, tuần 18 pipeline và resilience, tuần 19 security, chaos và postmortem. Tuần 19 rơi vào Tết 2027; kế hoạch dự phòng ở cuối mục.

| Buổi | Tuần | Việc | Đầu ra |
| --- | --- | --- | --- |
| 1 | 16 | Micrometer Tracing + OpenTelemetry bridge + OTLP exporter cho 3 service; propagation qua Kafka (`traceparent` trong header, Spring Kafka observation); Tempo + Grafana trong Compose | Một trace qua 3 service |
| 2 | 16 | Metric: RED cho HTTP và Kafka listener, `order.confirm.latency`, `saga.stuck`, `inventory.drift`, `inventory.compensation`, `ratelimit.rejected`; Prometheus scrape qua OTel Collector | Panel metric nghiệp vụ |
| 3 | 16 | Log JSON (Logback + `logstash-logback-encoder`) có `traceId`, `spanId`, `sub` masked; Loki qua OTel Collector; mask token và PII | Lọc log theo traceId |
| 4 | 16 | Định nghĩa 4 SLI/SLO, recording rules, dashboard SLO, alert multiwindow burn rate; runbook link trong alert | Dashboard + alert rule |
| 5 | 17 | Dockerfile multi-stage, layered jar, AOT cache Java 25, non-root, read-only; `docker scout` hoặc Trivy local; healthcheck | 3 image local |
| 6 | 17 | kind với 3 node; Strimzi, CloudNativePG, Redis Sentinel, ingress-nginx, Grafana stack bằng Helm; `make cluster-up` | Cụm nền |
| 7 | 17 | Helm chart cho 3 service (umbrella `deploy/flashsale`); probe, resource, PDB, graceful shutdown; ConfigMap, Secret; ingress thay Traefik | 3 service chạy trên kind |
| 8 | 17 | Strimzi KafkaConnect + Debezium connector CRD, Keycloak, Apicurio, gateway mock lên kind; end-to-end 4 đường saga chạy trên kind | E2E xanh trên kind |
| 9 | 18 | CI: buildx, Syft SBOM, Trivy, cosign keyless (OIDC GitHub), attest SBOM và provenance, push GHCR | Image có chữ ký trên GHCR |
| 10 | 18 | Argo CD (app-of-apps), CI commit tag vào `deploy/values/`; Kyverno: verifyImages, disallow-latest, require-resources, PSS restricted; test image không ký bị từ chối | GitOps chạy |
| 11 | 18 | Resilience4j (circuit breaker, bulkhead, timeout) cho payment-service và Redis; Lettuce với Sentinel; ShedLock cho 3 job; xử lý L1 cache lệch giữa instance | Failover Redis xanh |
| 12 | 18 | HPA order-service, KEDA cho consumer, PDB; k6 chạy trong cụm (`k6-operator` hoặc Job); test scale lên và xuống; rolling update dưới tải | Bảng scale |
| 13 | 19 | NetworkPolicy default-deny + allowlist; PSS restricted; RBAC tối thiểu; kube-bench; ZAP baseline và schemathesis vào CI; buổi tấn công 7 | Attack log 3 dòng |
| 14 | 19 | Chaos Mesh: pod kill, network delay, Redis master kill, node drain, CPU stress; đối chiếu dashboard và alert; buổi tấn công 8 nếu còn giờ | Kết quả chaos |
| 15 | 19 | Sự cố giả lập (mục 10.1) chạy như thật, viết postmortem, 4 runbook | `docs/postmortem-001.md` |
| 16 | 19 | Cập nhật C4 Deployment view, README, rà Definition of Done, tag | Tag `v4-prod` |

Dự phòng Tết: nếu tuần 19 mất, chuyển buổi 13–14 sang tuần 20 và dồn buổi 15–16 vào một buổi 3 giờ; không bỏ buổi 14 (chaos) vì đó là bằng chứng chính của giai đoạn.

## 3. Observability

Ba tín hiệu đi qua một OpenTelemetry Collector duy nhất rồi vào Tempo (trace), Prometheus (metric) và Loki (log); ứng dụng chỉ biết một endpoint OTLP, còn đích đến đổi được mà không sửa code.

**3.1. Tracing**

| Việc | Cách làm |
| --- | --- |
| Thư viện | `spring-boot-starter-actuator` + `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp`; không dùng Java agent để thấy rõ span nào do Spring tạo, span nào do mình tạo |
| Sampling | 100% trong dev và chaos; `management.tracing.sampling.probability=0.1` khi đo hiệu năng để không làm méo số |
| Qua Kafka | Spring Kafka observation bật (`spring.kafka.template.observation-enabled`, `listener.observation-enabled`); `traceparent` đi trong header Kafka. Với Debezium, `traceparent` nằm trong envelope CloudEvents (đã có từ giai đoạn 3): consumer đọc `traceparent` từ payload và tạo span con bằng `Tracer.nextSpan()` khi header không có |
| Span tự tạo | `reserve.lua`, `outbox.write`, `saga.transition` (tag `from`, `to`, `reason`), `webhook.verify` |
| Baggage | `sale.id` là baggage để mọi span của một đợt lọc được; không đưa `userId` vào baggage (PII) |
| Tempo | Deploy bằng chart `tempo` (monolithic mode); Grafana Explore và TraceQL: `{ span.sale.id = "..." && duration > 300ms }` |

**3.2. Metric**

| Nhóm | Metric | Nguồn |
| --- | --- | --- |
| RED HTTP | `http.server.requests` (count, error, duration histogram theo `uri`, `status`) | Actuator, bật histogram và percentiles cho `place`, `sale`, `token` |
| RED Kafka | `spring.kafka.listener` duration, `kafka.consumer.fetch.manager.records.lag.max` | Spring Kafka observation + Kafka client metric |
| Nghiệp vụ | `order.confirm.latency` (timer), `saga.stuck` (gauge), `inventory.drift` (gauge), `inventory.compensation` (counter), `ratelimit.rejected` (counter theo scope), `outbox.pending` (gauge) | `MeterRegistry` |
| JVM | GC pause, heap, virtual thread count (`jvm.threads.started`), HikariCP | Micrometer binder |
| Hạ tầng | Kafka (Strimzi exporter), PostgreSQL (CloudNativePG exporter), Redis (Bitnami exporter), Debezium (`debezium.metrics` qua JMX exporter của Strimzi) | Helm chart bật `metrics.enabled` |

OTel Collector nhận OTLP metric từ app và scrape Prometheus endpoint của hạ tầng; Prometheus (chart `kube-prometheus-stack`) scrape Collector. Cardinality: không tag metric bằng `userId`, `orderId`, `saleId`; tag `uri` dùng template `/api/orders/{id}`, không phải giá trị thật.

**3.3. SLI, SLO và alert**

| SLI | Định nghĩa | SLO (30 ngày, tính trong khung giờ có đợt mở) | Error budget 30 ngày |
| --- | --- | --- | --- |
| Đặt hàng khả dụng | request `place` trả 2xx hoặc 409 hợp lệ / tổng request `place` | 99,9% | 0,1% request |
| Đặt hàng nhanh | request `place` dưới 300 ms / tổng | 99% | 1% request |
| Xác nhận kịp | đơn CONFIRMED hoặc CANCELLED trong 2 giây kể từ pay / tổng đơn đã pay | 99% | 1% đơn |
| Không sai kho | `inventory.drift` = 0 sau job đối chiếu; oversell = 0 | 100% (SLO cứng) | 0 |

- Recording rule tính `sli:place:success_ratio_rate5m` và `error_budget_remaining` bằng PromQL từ histogram.
- Alert theo burn rate multiwindow theo SRE Workbook: page khi burn rate 14,4× trong 1 giờ **và** 5 phút; ticket khi 6× trong 6 giờ và 30 phút; không alert theo CPU hay số pod.
- Mỗi alert có nhãn `runbook` trỏ tới `docs/runbooks/*.md`; Alertmanager gửi vào một kênh chat cá nhân (Slack, Telegram) để tập phản xạ.

**3.4. Log**

- JSON bằng `logstash-logback-encoder`; field bắt buộc: `ts`, `level`, `service`, `traceId`, `spanId`, `sub` (băm SHA-256 6 ký tự đầu, không phải giá trị thật), `orderId`, `msg`.
- Không log `Authorization`, body request, token hàng chờ, chữ ký webhook; `MaskingJsonGeneratorDecorator` với pattern cho JWT và số thẻ.
- Log lên stdout; OTel Collector `filelog` receiver đọc từ node và gắn `k8s.pod.name`, `k8s.namespace`; Loki lưu; Grafana có nút nhảy từ trace sang log và ngược lại nhờ `traceId`.
- Mức log: INFO mặc định; DEBUG bật được theo package bằng Actuator `loggers` endpoint (chỉ mở cho admin qua port management riêng).

**3.5. Dashboard**

| Dashboard | Panel chính |
| --- | --- |
| `FlashSale SLO` | 4 SLI, error budget còn lại, burn rate 1h/6h, alert đang bắn |
| `FlashSale Sale` | Theo `sale.id`: RPS, p50/p99 `place`, token cấp/đã dùng, kho Redis so với DB, đơn theo trạng thái, `saga.stuck`, consumer lag |
| `FlashSale Service` | Mỗi service: RED, JVM, HikariCP, circuit breaker state, pod count và HPA |
| `FlashSale Pipeline` | Outbox pending, Debezium lag, replication slot size, DLT count |

Dashboard lưu dạng JSON trong `deploy/grafana/` và nạp bằng ConfigMap; đây cũng là tài liệu, không phải cấu hình tay.

## 4. Container

Một Dockerfile dùng chung cho ba service (tham số `SERVICE`), sinh image dưới 200 MB, chạy non-root trên filesystem read-only, khởi động dưới 3 giây nhờ AOT cache của Java 25.

**4.1. Dockerfile (`deploy/docker/Dockerfile`)**

```dockerfile
# syntax=docker/dockerfile:1.7
ARG SERVICE
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.gradle ./gradlew :${SERVICE}:bootJar -x test --no-daemon

FROM eclipse-temurin:25-jre AS layers
ARG SERVICE
WORKDIR /app
COPY --from=build /src/${SERVICE}/build/libs/*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted
# AOT cache: chạy huấn luyện một lần với profile 'aot' (khởi động, gọi vài endpoint, tắt)
RUN java -XX:AOTCacheOutput=/app/app.aot -Dspring.profiles.active=aot -jar app.jar || true

FROM eclipse-temurin:25-jre
ARG SERVICE
RUN groupadd -g 10001 app && useradd -u 10001 -g app -s /usr/sbin/nologin app
WORKDIR /app
COPY --from=layers --chown=app:app /app/extracted/dependencies/ ./
COPY --from=layers --chown=app:app /app/extracted/spring-boot-loader/ ./
COPY --from=layers --chown=app:app /app/extracted/snapshot-dependencies/ ./
COPY --from=layers --chown=app:app /app/extracted/application/ ./
COPY --from=layers --chown=app:app /app/app.aot ./app.aot
USER 10001
EXPOSE 8080 8081
ENV JAVA_TOOL_OPTIONS="-XX:AOTCache=/app/app.aot -XX:+UseZGC -XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s CMD curl -fs http://localhost:8081/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

- Layered jar: lớp `dependencies` ít đổi nằm dưới, lớp `application` đổi mỗi commit nằm trên; push image chỉ đẩy lớp thay đổi.
- AOT cache (JEP 483/514, Java 25): lần huấn luyện tạo `app.aot` chứa class đã nạp và link; nếu flag khác trên bản JDK đang dùng, sửa theo `java -XX:+PrintFlagsFinal | grep AOT` và ghi vào README. Đo startup có và không có cache, ghi vào report.
- Port 8081 là management (Actuator) tách khỏi 8080; ingress không bao giờ trỏ vào 8081.
- `curl` cần cho HEALTHCHECK của Docker; trên Kubernetes dùng probe HTTP nên không cần, có thể bỏ để giảm bề mặt tấn công (quyết định ở mục 11).

**4.2. Chuẩn hardening của image**

| Yêu cầu | Cách kiểm |
| --- | --- |
| Non-root, UID cố định 10001 | `docker inspect` và Kyverno `runAsNonRoot` |
| Read-only filesystem | Pod `readOnlyRootFilesystem: true`; `/tmp` là `emptyDir`; `java.io.tmpdir=/tmp` |
| Không shell, không package manager trong image cuối | Thử `docker run --entrypoint sh` phải thất bại (nếu dùng distroless), hoặc chấp nhận Temurin JRE và ghi lý do (mục 11) |
| Không secret trong image | `docker history` và Trivy `--scanners secret` |
| Tag bất biến | Tag = `git sha` ngắn; không có `latest` |
| SBOM đính kèm | `cosign attest --type spdx` (mục 6) |

**4.3. Build local và kiểm tra**

```bash
docker buildx build --build-arg SERVICE=order-service -t ghcr.io/<user>/flashsale/order-service:$(git rev-parse --short HEAD) -f deploy/docker/Dockerfile .
trivy image --severity HIGH,CRITICAL --exit-code 1 ghcr.io/<user>/flashsale/order-service:<sha>
docker run --rm --read-only --tmpfs /tmp -e SPRING_PROFILES_ACTIVE=local ghcr.io/<user>/flashsale/order-service:<sha>
```

Ba lệnh này chính là ba bước đầu của CI; chạy được local thì CI không bất ngờ.

## 5. Kubernetes trên kind

Cụm kind 3 node (1 control-plane, 2 worker) chạy toàn bộ hệ thống bằng operator cho hạ tầng và Helm chart cho ứng dụng; mọi thứ dựng bằng `make cluster-up` để phá đi làm lại không tốn công.

**5.1. Cụm và hạ tầng**

| Thành phần | Cách cài | Ghi chú |
| --- | --- | --- |
| kind | `kind create cluster --config deploy/kind/cluster.yaml` (3 node, port map 80/443 cho ingress) | Laptop 16 GB: giới hạn resource của hạ tầng ở mức tối thiểu ở bảng 5.3 |
| Namespace | `flashsale` (3 service, gateway mock), `data` (Kafka, PostgreSQL, Redis, Keycloak, Apicurio), `observability`, `argocd`, `kyverno`, `keda`, `chaos-mesh` | Tách để NetworkPolicy và RBAC theo namespace |
| Kafka | Strimzi operator; `Kafka` CR 1 broker KRaft, `KafkaConnect` CR với image build có Debezium plugin, `KafkaConnector` CR cho outbox; `KafkaUser` CR cho SCRAM và ACL | Thay hoàn toàn script SASL/ACL của giai đoạn 3 bằng CR |
| PostgreSQL | CloudNativePG operator; 3 `Cluster` CR (`order-db`, `payment-db`, `core-db`), mỗi cụm 1 instance (2 instance cho `order-db` để thử failover), `wal_level=logical` cho Debezium | Backup ra object storage ghi vào SAD, không làm |
| Redis | Bitnami chart `redis` chế độ `sentinel`: 1 master, 2 replica, 3 sentinel; AOF bật; ACL user từ Secret | Xử lý điểm lỗi đơn của ADR-003 |
| Keycloak | Chart `keycloak` (Bitnami hoặc Codecentric) với realm import từ ConfigMap; realm **không** có client `flashsale-cli` | k6 lấy token bằng client credentials của một client test riêng trong namespace |
| Apicurio, gateway mock | Deployment thường |  |
| Ingress | ingress-nginx; host `flashsale.local` trỏ 127.0.0.1; TLS tự ký bằng cert-manager (self-signed issuer) | Route như Traefik ở giai đoạn 3 |
| Observability | `kube-prometheus-stack`, `tempo`, `loki`, `opentelemetry-collector` (mode daemonset cho log, deployment cho OTLP) |  |
| Argo CD, Kyverno, KEDA, Chaos Mesh | Chart chính chủ | Cài ở buổi 10, 12, 14 |

**5.2. Helm chart ứng dụng (`deploy/flashsale/`)**

```
deploy/flashsale/
├── Chart.yaml                 # umbrella
├── values.yaml                # mặc định
├── values/kind.yaml           # override cho kind: replica, resource, host
├── charts/service/            # subchart dùng chung cho 3 service
│   ├── templates/deployment.yaml, service.yaml, hpa.yaml, pdb.yaml, networkpolicy.yaml, servicemonitor.yaml, configmap.yaml
│   └── values.yaml
└── templates/ingress.yaml, keda-scaledobject.yaml, externalsecret-placeholder.yaml
```

Một subchart `service` với `values` khác nhau cho 3 service; lỗi cấu hình sửa một chỗ. `helm template | kubeconform` chạy trong CI để bắt lỗi schema trước khi Argo CD sync.

**5.3. Deployment: probe, resource, shutdown**

| Mục | order-service | core | payment-service |
| --- | --- | --- | --- |
| Replica | 2 (HPA 2–6) | 1 | 1 |
| requests / limits CPU | 500m / 2000m | 300m / 1000m | 200m / 500m |
| requests / limits RAM | 1Gi / 2Gi | 768Mi / 1Gi | 512Mi / 768Mi |
| startupProbe | `/actuator/health/readiness`, period 2s, failureThreshold 30 (60 giây cho JVM + Flyway) | như trên | như trên |
| readinessProbe | `/actuator/health/readiness` (gồm DB, Redis, Kafka) period 5s | như trên | như trên |
| livenessProbe | `/actuator/health/liveness` (chỉ trạng thái JVM, **không** gồm DB) period 10s | như trên | như trên |
| Shutdown | `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase=20s`, preStop `sleep 5`, `terminationGracePeriodSeconds: 30` | như trên | như trên |
| PDB | `minAvailable: 1` | không (1 replica) | không |
| topologySpreadConstraints | theo `kubernetes.io/hostname`, `maxSkew: 1` | — | — |

Liveness không được phụ thuộc DB: DB chết mà restart pod thì chỉ làm tệ hơn. Readiness gồm DB để pod không nhận traffic khi chưa kết nối được. preStop `sleep 5` để kube-proxy và ingress kịp bỏ pod khỏi endpoint trước khi JVM nhận SIGTERM.

**5.4. Autoscaling**

| Đối tượng | Cơ chế | Quy tắc | Kiểm tra |
| --- | --- | --- | --- |
| order-service | HPA v2 theo CPU | target 60%, min 2, max 6, `stabilizationWindowSeconds` scale-down 300 | k6 spike trên cụm: thấy scale lên 4–6 trong 2 phút, xuống sau 5 phút |
| core (consumer `inventory`) | KEDA `ScaledObject` với trigger `kafka` | lag > 1.000 → scale 1–3 (không vượt 6 partition / 2) | Dừng consumer 1 phút để lag tích, bật lại và xem KEDA thêm pod |
| payment-service | Không scale (gateway mock giới hạn) | — | — |

Ghi lại vấn đề gặp khi có nhiều instance ở mục 7.4: L1 cache lệch, job chạy trùng, rate limit theo instance.

**5.5. Cấu hình và secret**

- ConfigMap cho `application-kind.yaml`; Secret cho DB, Redis, Kafka SCRAM, HMAC key, webhook secret; Secret tạo bởi script `make secrets` từ file `.env.kind` không commit (gitleaks canh).
- External Secrets Operator chỉ để một CR placeholder trỏ tới "fake" provider, ghi vào SAD là trên cloud sẽ dùng AWS Secrets Manager; không tích hợp thật.
- Không mount Secret vào biến môi trường có thể lộ qua `/actuator/env`: endpoint `env` tắt hẳn; Actuator chỉ mở `health`, `prometheus`, `loggers` trên port 8081.

**5.6. C4 Deployment view**

Thêm `deploymentEnvironment "kind"` vào `workspace.dsl` với node theo namespace và container instance; render cùng hai view cũ. Sơ đồ này là hình đầu tiên trong SAD ở giai đoạn 5.

## 6. CI/CD và supply chain

Pipeline có hai cổng chặn ở hai đầu: Trivy chặn image có lỗ hổng trước khi nó rời CI, Kyverno chặn image không có chữ ký hợp lệ trước khi nó thành pod; giữa hai cổng, không ai (kể cả người có quyền push) đổi được image mà không bị phát hiện.

**6.1. Luồng**

&#91;embedded content: pipeline commit → pod · 2 cổng chặn\]

Đường "không" ở cổng Trivy là đường chính; đường "có" dừng pipeline và mở issue tự động; Kyverno từ chối thì Argo CD báo Degraded và giữ bản cũ chạy.

**6.2. Workflow `release.yml` (trích các bước sau test)**

```yaml
permissions: { contents: write, packages: write, id-token: write, security-events: write }
steps:
  - uses: docker/setup-buildx-action@v3
  - uses: docker/login-action@v3
    with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
  - uses: docker/build-push-action@v6
    with:
      file: deploy/docker/Dockerfile
      build-args: SERVICE=${{ matrix.service }}
      tags: ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
      push: false
      load: true
  - uses: anchore/sbom-action@v0
    with: { image: ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}, format: spdx-json, output-file: sbom.spdx.json }
  - uses: aquasecurity/trivy-action@0.28.0
    with: { image-ref: ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}, severity: 'HIGH,CRITICAL', exit-code: '1', ignore-unfixed: true, format: sarif, output: trivy.sarif }
  - uses: github/codeql-action/upload-sarif@v3
    if: always()
    with: { sarif_file: trivy.sarif }
  - run: docker push ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }}
  - uses: sigstore/cosign-installer@v3
  - run: |
      DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/${{ github.repository }}/${{ matrix.service }}:${{ github.sha }} | cut -d@ -f2)
      IMAGE=ghcr.io/${{ github.repository }}/${{ matrix.service }}@$DIGEST
      cosign sign --yes $IMAGE                                      # keyless: OIDC của GitHub Actions
      cosign attest --yes --type spdxjson --predicate sbom.spdx.json $IMAGE
  - run: |
      yq -i '.services.${{ matrix.service }}.image.tag = strenv(GITHUB_SHA)' deploy/flashsale/values/kind.yaml
      git config user.name ci && git config user.email ci@users.noreply.github.com
      git commit -am 'deploy: ${{ matrix.service }} ${{ github.sha }}' && git push
```

- Ký theo digest, không theo tag; Kyverno cũng xác minh theo digest.
- `ignore-unfixed: true` để không chặn vì CVE chưa có bản vá trong base image; những CVE này vẫn hiện ở tab Security và được xem lại mỗi tuần cùng Renovate.
- Provenance: thêm `actions/attest-build-provenance` để đạt SLSA build level 2 trên GitHub-hosted runner; ghi level đạt được và điều còn thiếu để lên level 3 vào SAD.
- Job cuối commit vào `deploy/` bằng `GITHUB_TOKEN`; branch protection cho phép bot push thẳng nhưng CODEOWNERS giới hạn đường dẫn `deploy/`.

**6.3. Argo CD**

- `Application` app-of-apps trong `deploy/argocd/`: một app cho hạ tầng (chart bên ngoài, sync thủ công), một app cho `deploy/flashsale` (auto-sync, self-heal, prune).
- Sync wave: CRD và operator (wave -2) → data (wave -1) → ứng dụng (wave 0) → KEDA và HPA (wave 1).
- Rollback = `git revert` commit tag rồi để Argo CD sync; đây là runbook `rollback.md`.
- UI chỉ mở qua `kubectl port-forward`; SSO không làm, ghi vào SAD.

**6.4. Kyverno (`deploy/kyverno/`)**

| Policy | Nội dung | Mode |
| --- | --- | --- |
| `verify-image-signature` | `verifyImages` cho `ghcr.io/<repo>/*` với keyless: issuer `https://token.actions.githubusercontent.com`, subject là workflow `release.yml` trên `refs/heads/main`; yêu cầu attestation SBOM tồn tại | Enforce |
| `disallow-latest-tag` | Từ chối tag `latest` hoặc thiếu tag | Enforce |
| `require-requests-limits` | Mọi container có requests và limits | Enforce cho `flashsale`, Audit cho namespace khác |
| `restricted-pss` | `validate.podSecurity: restricted` | Enforce cho `flashsale` |
| `require-probes` | Deployment có readiness và liveness | Audit |
| `default-deny-networkpolicy` | Generate NetworkPolicy default-deny cho namespace mới | Generate |

Test cổng Kyverno ba cách: deploy image build tay không ký (bị từ chối), đổi tag thành `latest` (bị từ chối), bỏ `runAsNonRoot` (bị từ chối); cả ba ghi vào attack log 4.

**6.5. Renovate và base image**

- Renovate mở PR hàng tuần cho Gradle, GitHub Actions (pin theo SHA), Helm chart, base image (theo digest); PR tự chạy test và Trivy.
- Base image `eclipse-temurin:25-jre` pin digest; distroless cân nhắc ở mục 11.

## 7. Resilience

Ba thứ có thể lỗi ở giai đoạn này mà giai đoạn trước không có: gateway bên ngoài chậm hoặc lỗi hàng loạt, Redis master chết, và chính việc có nhiều instance của cùng một service.

**7.1. Resilience4j**

| Chỗ áp dụng | Pattern | Cấu hình | Fallback |
| --- | --- | --- | --- |
| payment-service → gateway `/charge`, `/refund` | CircuitBreaker + TimeLimiter + Retry | cửa sổ 20 cuộc gọi, mở khi lỗi ≥ 50%, chờ 30 giây rồi half-open với 5 cuộc; timeout 3 giây; retry 2 lần với jitter chỉ cho lỗi mạng, không retry 4xx | Khi mở: không gọi gateway, giữ `payment.requested` chờ và phát metric; job 6.4 của giai đoạn 3 phát lại sau |
| order-service → Redis (Lua, token, rate limit) | Bulkhead (semaphore 200) + TimeLimiter 200 ms | Vượt bulkhead hoặc timeout → 503 `try-again` với `Retry-After: 1` | Không fallback sang PostgreSQL cho trừ kho (sẽ oversell); từ chối nhanh là đúng |
| core → Redis (cache đọc) | TimeLimiter 100 ms | Timeout → đọc PostgreSQL trực tiếp cho `GET sale` (chấp nhận chậm) | Có fallback vì đường đọc không ảnh hưởng tính đúng |
| Consumer Kafka | Không dùng Resilience4j; retry và DLT của Spring Kafka đã đủ | — | — |

Metric `resilience4j.circuitbreaker.state` lên dashboard Service; test ở buổi 11: gateway mock cấu hình trả 500 cho 60% cuộc gọi trong 20 giây, quan sát breaker mở, đặt hàng vẫn 201, đơn về PAYMENT\_PENDING, rồi gateway phục hồi và saga tự hoàn tất.

**7.2. Redis Sentinel**

- Lettuce cấu hình `redis-sentinel://...` với `masterId`; Spring Boot `spring.data.redis.sentinel.*`; xác nhận Lettuce tự chuyển sang master mới khi Sentinel bầu.
- Replica là bất đồng bộ: khi master chết giữa chừng có thể mất vài lệnh `DECRBY` cuối cùng → kho Redis mới có thể cao hơn thực tế vài đơn vị. Đây là lý do job đối chiếu Redis với PostgreSQL (giai đoạn 2) và `CHECK >= 0` ở `core_db` (giai đoạn 3) tồn tại; sau failover, job chạy ngay (trigger bằng event `RedisFailover` từ Lettuce) thay vì chờ chu kỳ 1 phút.
- `min-replicas-to-write 1` và `min-replicas-max-lag 5` trên master: master từ chối ghi khi không có replica theo kịp, đổi một chút khả dụng lấy ít mất mát hơn; đo tác động lên p99 và ghi vào report.
- Test: `kubectl delete pod redis-node-0` (master) khi k6 chạy; kỳ vọng dưới 10 giây có 503 `try-again`, rồi bình thường; `verify-no-oversell` xanh; ghi số request lỗi.

**7.3. ShedLock**

- Ba job (`OrderExpiryJob`, `IdempotencyCleanup`, `InventoryReconciler`) dùng `@SchedulerLock` với `JdbcTemplateLockProvider` trên bảng `shedlock` trong DB của service sở hữu job; `lockAtMostFor` bằng 2 lần thời gian chạy dự kiến.
- Test: scale order-service lên 3, bật log job, xác nhận mỗi chu kỳ chỉ một instance chạy.

**7.4. Vấn đề khi có nhiều instance (ghi vào `docs/perf/report.md` mục giai đoạn 4)**

| Vấn đề | Biểu hiện | Xử lý |
| --- | --- | --- |
| L1 Caffeine lệch giữa instance | Admin đóng đợt, một instance vẫn trả `OPEN` tối đa 1 giây | Chấp nhận với TTL L1 1 giây; ghi vào SAD; nếu cần đồng bộ thì publish `sale.changed` để các instance `invalidate` (làm ở buổi 11 nếu còn giờ) |
| Rate limit theo user tính trên Redis nên đúng; rate limit "toàn hệ thống" nếu tính trong JVM sẽ nhân theo số instance | 3.000 request/giây thành 9.000 | Bucket toàn hệ thống cũng đặt trên Redis (đã vậy từ giai đoạn 2, xác nhận lại) |
| Job chạy trùng | Hoàn kho 2 lần, dọn idempotency 2 lần | ShedLock (7.3); idempotent nhờ `HDEL` trả 0 |
| Rolling update | Pod cũ nhận SIGTERM khi đang xử lý Lua + ghi DB | Graceful shutdown 20 giây + preStop; test: rolling update dưới tải phải 0 lỗi 5xx |
| Sticky session | Không có; API stateless | Không làm gì; ghi để nhớ lý do không dùng session |

## 8. Security giai đoạn 4

Giai đoạn 4 chuyển trọng tâm từ ứng dụng sang nền tảng: mạng trong cụm mặc định đóng, pod chạy với quyền thấp nhất, secret không lộ qua bất kỳ endpoint nào, và chuỗi cung ứng có chữ ký từ CI đến pod.

**8.1. NetworkPolicy (namespace `flashsale` và `data`)**

| Policy | Từ | Đến | Cổng |
| --- | --- | --- | --- |
| `default-deny` | mọi pod | mọi pod (ingress và egress) | — |
| `allow-dns` | mọi pod | kube-dns | 53 |
| `ingress-to-api` | ingress-nginx | order-service, core | 8080 |
| `order-to-data` | order-service | order-db, redis (sentinel + node), kafka | 5432, 26379, 6379, 9093 |
| `core-to-data` | core | core-db, redis, kafka | như trên |
| `payment-to-data` | payment-service | payment-db, kafka | 5432, 9093 |
| `payment-to-gateway` | payment-service | payment-gateway-mock | 8080 |
| `gateway-to-webhook` | payment-gateway-mock | payment-service | 8080 (`/webhooks/payment` là path duy nhất mở) |
| `connect-to-db` | kafka-connect (Strimzi) | order-db, payment-db | 5432 |
| `otel` | mọi pod | otel-collector | 4317, 4318 |
| `prometheus-scrape` | prometheus | mọi pod | 8081 |
| `keycloak-jwks` | order-service, core, payment-service | keycloak | 8080 |

Kiểm tra bằng `kubectl exec` vào pod core thử `nc -zv payment-db 5432` (phải thất bại) và bằng Chaos Mesh `NetworkChaos` ở mục 9. Chọn CNI hỗ trợ NetworkPolicy cho kind (Calico hoặc Cilium; kindnet không hỗ trợ).

**8.2. Pod Security và RBAC**

- Namespace `flashsale` gắn nhãn `pod-security.kubernetes.io/enforce: restricted`; Kyverno kiểm thêm để có thông báo rõ hơn.
- SecurityContext: `runAsNonRoot`, `runAsUser: 10001`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`.
- ServiceAccount riêng cho mỗi service, `automountServiceAccountToken: false` (ứng dụng không gọi Kubernetes API); KEDA và Argo CD có SA riêng với RBAC tối thiểu.
- Không dùng `hostPath`, `hostNetwork`, `privileged` ở bất kỳ đâu trong `flashsale`.

**8.3. Secret**

- Secret Kubernetes mã hóa at rest chỉ khi bật encryption provider trên API server; kind mặc định không bật → ghi vào rủi ro chấp nhận và SAD (trên cloud dùng KMS).
- Actuator `env`, `configprops`, `heapdump`, `threaddump` tắt; `health` không show details cho người không xác thực; management port 8081 không có ingress.
- Xoay secret: HMAC key và webhook secret chấp nhận 2 giá trị (mới, cũ) qua `flashsale.security.hmac.keys[]`; runbook `rotate-secrets.md` mô tả thứ tự.

**8.4. Kiểm thử bảo mật trong CI (bổ sung vào workflow của giai đoạn 1–2)**

| Công cụ | Chạy khi | Nội dung | Ngưỡng |
| --- | --- | --- | --- |
| OWASP ZAP baseline | Job `dast` sau khi deploy lên kind tạm trong CI (`kind` action) hoặc trên Compose | Quét passive + rule active nhẹ vào ingress | Không có High; Medium ghi issue |
| schemathesis | Cùng job | Fuzz theo `openapi.yaml`: 500 case mỗi endpoint, kiểm tra không 5xx, response khớp schema | 0 lỗi 5xx |
| kube-bench | Job hàng tuần trên kind | CIS Benchmark; nhiều mục là của control-plane kind, đánh dấu N/A | 0 FAIL ở mục mình kiểm soát (worker, policies) |
| kubeconform + Kyverno CLI `apply` | Mọi PR | Manifest hợp lệ và qua policy trước khi Argo CD thấy | 0 lỗi |
| Trivy `config` | Mọi PR | Quét Dockerfile, Helm, manifest | Không có High |

**8.5. Cập nhật threat model**

- Đóng dòng "Repo, CI, image": biện pháp SBOM, Trivy, cosign, Kyverno, Renovate; mức còn lại Thấp (rủi ro còn: GitHub Actions bị chiếm → SLSA level 3 và runner riêng nằm ngoài dự án).
- Đóng dòng "Observability": mask ở encoder, không log body; Loki chỉ trong cụm; mức Thấp.
- Dòng mới "Kubernetes API và Argo CD": ai có kubeconfig hoặc Argo CD admin thì deploy được bất kỳ image đã ký; biện pháp RBAC, không có SSO; mức Trung bình, chấp nhận trong dự án.
- Dòng mới "Redis Sentinel replication": dữ liệu replicate không mã hóa trong cụm; biện pháp NetworkPolicy; TLS giữa node Redis để giai đoạn 5 cân nhắc.

**8.6. Hai buổi tự tấn công (buổi 13 và 14) — `docs/security/attack-log-4.md`**

| # | Kịch bản | Cách thử | Kết quả kỳ vọng |
| --- | --- | --- | --- |
| 1 | Deploy image không ký, image tag `latest`, pod chạy root | `kubectl apply` ba manifest xấu | Kyverno từ chối cả ba với thông báo rõ policy |
| 2 | Từ pod core đọc DB của payment | `kubectl exec` + `psql -h payment-db` | Kết nối bị NetworkPolicy chặn (timeout) |
| 3 | Từ pod bị chiếm gọi Kubernetes API | `curl https://kubernetes.default` với SA token | Không có token (automount tắt) hoặc 403 |
| 4 | Đọc secret qua Actuator | `GET :8081/actuator/env`, `/heapdump` qua port-forward và qua ingress | 404 (tắt) qua port-forward; không tới được qua ingress |
| 5 | Sửa image trên GHCR sau khi ký (retag digest khác) | Push image khác với cùng tag | Argo CD sync bị Kyverno từ chối vì digest không khớp chữ ký |
| 6 | Gọi webhook từ pod ngoài gateway mock | `kubectl run` pod tạm gọi `payment-service:8080/webhooks/payment` | NetworkPolicy chặn; nếu qua được thì HMAC chặn (lớp 2) |
| 7 (tùy chọn) | ZAP full scan tay vào ingress | ZAP desktop | Không có High; ghi Medium để xử lý ở giai đoạn 5 |

## 9. Chaos engineering và kiểm chứng SLO

Chaos ở giai đoạn này có mục tiêu khác giai đoạn 3: không chỉ "hệ thống còn đúng không" mà "dashboard và alert có nói đúng điều đang xảy ra không"; mỗi kịch bản có giả thuyết trước, số đo sau, và một dòng về alert đã bắn hay chưa.

**9.1. Quy trình cho mỗi thí nghiệm**

1. Viết giả thuyết ở trạng thái ổn định: "SLI đặt hàng khả dụng giữ trên 99,9% và alert không bắn".
2. Chạy k6 `steady.js` (500 request/giây, 10 phút) làm nền; bắt đầu chaos ở phút thứ 2, dừng ở phút thứ 5.
3. Ghi: SLI trước, trong, sau; thời điểm alert bắn (nếu có) so với thời điểm bắt đầu chaos; thời gian phục hồi.
4. Kết luận: giả thuyết đúng hay sai; nếu sai, action item vào backlog và runbook.

**9.2. Năm kịch bản (Chaos Mesh CR trong `perf/chaos/k8s/`)**

| # | Kịch bản | CR | Giả thuyết | Điều cần nhìn |
| --- | --- | --- | --- | --- |
| 1 | Kill 1 trong 2 pod order-service | `PodChaos` action `pod-kill` | 0 lỗi 5xx nhờ PDB, readiness và graceful shutdown; HPA không cần can thiệp | Panel RED order-service; endpoint của Service đổi trong dưới 5 giây |
| 2 | Redis master chết | `PodChaos` chọn pod master bằng label của Sentinel | Dưới 10 giây có 503 `try-again`; SLI khả dụng giảm nhưng không thủng budget; job đối chiếu chạy ngay; alert **không** bắn (dưới ngưỡng burn rate) | Panel `inventory.drift`, log Lettuce failover, alert list |
| 3 | Kafka chậm 2 giây từ order-service | `NetworkChaos` action `delay` 2000 ms selector order-service → kafka | `place` p99 không đổi; `order.confirm.latency` tăng; SLI "xác nhận kịp" thủng trong cửa sổ chaos; alert ticket (6 giờ) không bắn, alert page (1 giờ) có thể bắn nếu chaos kéo dài 3 phút | Panel SLO, alert |
| 4 | CPU stress trên node có order-service | `StressChaos` 2 worker 80% | HPA scale lên; p99 tăng tạm rồi hồi; ghi thời gian từ tăng tải đến pod mới Ready (mục tiêu dưới 90 giây nhờ AOT cache) | Panel HPA, startup time |
| 5 | Node drain worker 1 | `kubectl drain` (không cần Chaos Mesh) | Pod dời sang worker 2; PDB giữ ít nhất 1 order-service; CloudNativePG `order-db` failover sang replica; 0 oversell | Panel Service, CloudNativePG status |

Bổ sung nếu còn giờ: `DNSChaos` làm Keycloak không phân giải được (JWKS đã cache nên đặt hàng vẫn chạy, đăng nhập mới lỗi); `IOChaos` làm chậm disk của Kafka.

**9.3. Kiểm chứng SLO và alert**

- Sau 5 kịch bản, error budget 30 ngày trên dashboard phải giảm đúng bằng số request lỗi đã ghi trong chaos; lệch nghĩa là recording rule sai.
- Cố ý gây một sự cố đủ lớn (kịch bản 3 kéo dài 8 phút) để alert page bắn; ghi độ trễ từ lúc bắt đầu tới lúc nhận thông báo; mục tiêu dưới 5 phút (giới hạn bởi cửa sổ 5 phút của multiwindow).
- Kết quả tổng hợp thành bảng trong `docs/perf/report.md` mục "Chaos giai đoạn 4" và là đầu vào cho phần Reliability của SAD.

## 10. Sự cố giả lập, postmortem và runbook

Buổi 15 chạy một sự cố như thật từ alert đến khắc phục, rồi viết postmortem blameless theo mẫu SRE; giá trị nằm ở việc dùng dashboard và runbook để tìm nguyên nhân, không phải ở việc biết trước nguyên nhân.

**10.1. Kịch bản sự cố (người "gây" và người "xử lý" là một, nên ghi kịch bản ra rồi để 2 ngày mới chạy)**

- Bối cảnh: đợt flash sale 10.000 người đang chạy (k6 spike), phút thứ 1.
- Sự cố: secret Redis bị xoay trên cụm (Secret cập nhật) nhưng order-service chưa restart nên vẫn dùng mật khẩu cũ; đồng thời Sentinel failover (kịch bản 2 mục 9). Sau failover, Lettuce kết nối master mới bằng mật khẩu cũ → `NOAUTH`; đặt hàng trả 503 hàng loạt.
- Kỳ vọng phát hiện: alert page burn rate bắn trong 5 phút; dashboard Sale cho thấy 503 tăng, `inventory.drift` không đổi (không oversell); log lọc theo traceId thấy `NOAUTH`.
- Kỳ vọng xử lý: runbook `redis-failover.md` dẫn tới kiểm tra Secret và rollout restart; thời gian từ alert tới phục hồi mục tiêu dưới 15 phút.

**10.2. Mẫu `docs/postmortem-001.md`**

```markdown
# Postmortem 001: Đặt hàng lỗi 503 sau khi xoay secret Redis

- Ngày: YYYY-MM-DD · Thời lượng ảnh hưởng: mm phút · Mức: SEV-2
- Người viết: … · Người review: (tự review sau 1 ngày)

## Tóm tắt (3 câu)
## Ảnh hưởng
- SLI đặt hàng khả dụng: x% trong cửa sổ; error budget tiêu: y%
- Số đơn ảnh hưởng: … ; oversell: 0
## Dòng thời gian (giờ:phút, nguồn: dashboard, alert, log)
## Nguyên nhân gốc (5 whys)
## Điều đã làm tốt · Điều may mắn · Điều làm chưa tốt
## Action item (mỗi item có chủ, hạn, link issue)
## Bài học
```

Quy tắc blameless: không có tên người trong phần nguyên nhân; nguyên nhân là hệ thống (thiếu reload secret, thiếu kiểm tra sau xoay), không phải "quên restart".

**10.3. Bốn runbook (`docs/runbooks/`)**

| Runbook | Khi nào mở | Nội dung chính |
| --- | --- | --- |
| `redis-failover.md` | Alert `inventory.drift > 0` hoặc 503 `try-again` tăng | Kiểm tra Sentinel master, Lettuce log, Secret; chạy job đối chiếu tay; rollout restart nếu `NOAUTH` |
| `consumer-lag.md` | Lag > 1.000 quá 5 phút | Xem KEDA đã scale chưa; xem DLT; xem partition bị chặn bởi retry; lệnh replay |
| `debezium-slot.md` | `pg_replication_slots` lag > 1 GB hoặc connector FAILED | Restart connector CR; nếu slot mất, tạo lại và snapshot; kiểm tra outbox pending |
| `rollback.md` | SLI thủng ngay sau deploy | `git revert` commit tag, chờ Argo CD sync, xác nhận pod cũ Ready; ghi vào postmortem |

Mỗi runbook bắt đầu bằng "dấu hiệu", có lệnh copy được, và kết thúc bằng "khi nào leo thang" (trong dự án: khi 30 phút không phục hồi, dừng flash sale bằng admin API close).

## 11. Nguồn học cho giai đoạn 4 và quyết định cho các câu hỏi mở

Khoảng 10 giờ đọc; xương sống là hai cuốn *Site Reliability Engineering* và *The Site Reliability Workbook* (miễn phí) cho SLO, cộng tài liệu chính chủ của từng công cụ.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1–3 | Spring Boot docs: Observability (Micrometer Tracing, OTel); OpenTelemetry docs: Collector, semantic conventions cho HTTP và messaging | Bridge, exporter, propagation qua Kafka | Có |
| 4 | *SRE Workbook* chương "Implementing SLOs" và "Alerting on SLOs"; Google SRE book chương "Service Level Objectives" | SLI, error budget, multiwindow burn rate | Có (sre.google) |
| 5 | Spring Boot docs: Efficient deployments (layered jar, CDS/AOT); JEP 483, JEP 514; Docker docs về BuildKit cache | AOT cache, layer | Có |
| 6 | kind docs; Strimzi docs (Kafka, KafkaConnect, KafkaUser); CloudNativePG docs; Bitnami Redis chart README | CR chính | Có |
| 7 | Kubernetes docs: Probes, Resource management, PDB, Termination of Pods; Spring Boot graceful shutdown | Lý do liveness không gồm DB | Có |
| 9 | Sigstore docs (cosign keyless), Syft, Trivy docs; SLSA spec v1.0 | Ký theo digest, attestation, level | Có |
| 10 | Argo CD docs (app-of-apps, sync waves); Kyverno docs (verifyImages, podSecurity) | GitOps, policy | Có |
| 11 | Resilience4j docs; Lettuce docs về Sentinel; Redis docs về replication và `min-replicas-to-write`; ShedLock README | Breaker, failover, lock | Có |
| 12 | Kubernetes HPA v2; KEDA docs (Kafka scaler) | Scale theo lag | Có |
| 13 | Kubernetes docs: NetworkPolicy, Pod Security Standards; Calico hoặc Cilium trên kind; kube-bench README; ZAP baseline; schemathesis docs | Default-deny, restricted | Có |
| 14 | Chaos Mesh docs; *Chaos Engineering* (Rosenthal, Jones) chương 1–3 | Giả thuyết trạng thái ổn định | Sách không |
| 15 | Google SRE book chương "Postmortem Culture"; mẫu postmortem của PagerDuty | Blameless | Có |

**Quyết định cho các câu hỏi mở** (chốt sẵn theo tiêu chí thực tế và học sâu; đổi được bằng cách sửa bảng này)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | Micrometer Tracing + OTel bridge hay OTel Java agent? | **Micrometer Tracing**; agent chỉ thử một lần ở buổi 1 để so số span | Hiểu span do ai tạo; Spring hỗ trợ chính chủ; agent tiện nhưng "hộp đen" |
| 2 | Log qua OTel Collector hay Promtail? | **OTel Collector** (filelog receiver) | Một pipeline cho ba tín hiệu; Promtail đang được thay bởi Alloy nên không đầu tư |
| 3 | Kafka: Strimzi hay Bitnami chart? | **Strimzi** | Chuẩn thực tế trên Kubernetes; `KafkaUser` thay script ACL; KafkaConnect CR cho Debezium |
| 4 | PostgreSQL: CloudNativePG hay Bitnami? | **CloudNativePG** | Operator có failover, replica, logical replication cho Debezium; là thứ SA sẽ gặp trên cloud tự quản |
| 5 | Redis Sentinel hay Redis Cluster? | **Sentinel** | Dữ liệu nhỏ, cần HA chứ không cần shard; hash tag từ giai đoạn 2 giữ đường sang Cluster nếu cần |
| 6 | Argo CD hay Flux? | **Argo CD** | UI giúp học và demo; app-of-apps quen thuộc ở doanh nghiệp Việt Nam |
| 7 | cosign keyless hay khóa riêng? | **Keyless (OIDC GitHub)** | Không quản lý khóa; Kyverno xác minh theo issuer và subject |
| 8 | Chaos Mesh hay Litmus? | **Chaos Mesh** | CR đơn giản, có dashboard; đủ cho 5 kịch bản |
| 9 | KEDA cho consumer hay chỉ HPA? | **KEDA** | Scale theo lag là bài học đúng cho consumer; HPA theo CPU không phản ánh backlog |
| 10 | Base image Temurin JRE hay distroless? | **Temurin JRE ở giai đoạn 4**, thử distroless trên một service ở buổi 5 nếu còn giờ | Debug dễ hơn khi mới lên K8s; distroless bỏ shell và curl, ghi lại chênh lệch kích thước và CVE |
| 11 | Giữ `curl` cho HEALTHCHECK trong image? | **Bỏ**, dùng probe HTTP của Kubernetes | Giảm bề mặt tấn công; HEALTHCHECK Docker chỉ cần cho Compose và Compose dùng probe qua `wget` của busybox sidecar hoặc bỏ luôn |
| 12 | CNI cho kind: Calico hay Cilium? | **Cilium** | Có Hubble để nhìn luồng mạng khi test NetworkPolicy; là công cụ đang phổ biến |
