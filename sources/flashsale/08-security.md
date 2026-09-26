# Security xuyên suốt — tài liệu chi tiết

Security trong FlashSale là một luồng chạy qua cả 6 giai đoạn chứ không phải một giai đoạn; tab này gom những gì các tab giai đoạn chỉ nhắc tới: công cụ và cách cài, quy trình buổi tấn công, quy tắc viết code, quản lý secret và dependency, vòng đời threat model, và ánh xạ sang chuẩn ASVS.

## 1. Mục tiêu, nguyên tắc và vòng lặp xây–tấn công–sửa

Mục tiêu của luồng security không phải "không có lỗ hổng" mà là: mọi biện pháp đều được chứng minh bằng một cuộc tấn công thất bại có ghi chép, và mọi rủi ro chưa xử lý đều có tên, điểm, chủ và hạn.

**Bốn nguyên tắc**

1. Thiết kế trước, vá sau là thất bại: threat model có trước code (giai đoạn 0), cập nhật mỗi khi kiến trúc đổi (giai đoạn 2, 3, 4), hoàn chỉnh khi viết SAD (giai đoạn 5).
2. Mỗi giai đoạn có ít nhất một buổi tự tấn công 2–3 giờ trước khi gắn tag; kịch bản nào không như kỳ vọng là thành công của buổi đó.
3. Biện pháp phải có test hồi quy; test đỏ khi ai đó (kể cả chính mình sau 3 tháng) bỏ biện pháp đi.
4. Chỉ tấn công hệ thống của mình trên môi trường local hoặc kind; không bao giờ trỏ công cụ vào dịch vụ bên ngoài, kể cả Keycloak public hay registry.

**Vòng lặp mỗi giai đoạn**

| Bước | Việc | Đầu ra |
| --- | --- | --- |
| Thiết kế | Đọc threat model hiện hành; liệt kê phần tử hoặc luồng mới của giai đoạn; thêm dòng STRIDE | Threat model bản mới |
| Xây | Cài biện pháp cùng lúc với tính năng, không để "làm sau"; thêm công cụ CI của giai đoạn | Code + CI |
| Tấn công | Buổi tự tấn công theo mục 4 với kịch bản đã viết trước | `attack-log-<n>.md` |
| Sửa | Fix + test hồi quy; cập nhật threat model và risk register | Commit có tag `security-fix` |
| Chốt | Rà lại checklist ASVS của giai đoạn (mục 9); ghi rủi ro chấp nhận | Dòng trong risk register |

## 2. Bản đồ security theo 6 giai đoạn

Bảng này là mục lục của toàn bộ luồng: mỗi ô trỏ tới mục tương ứng trong tab giai đoạn, để không lặp lại nội dung.

| Giai đoạn | Threat model | Biện pháp chính thêm vào | Công cụ thêm vào | Buổi tấn công | Rủi ro chấp nhận |
| --- | --- | --- | --- | --- | --- |
| 0 | v0: STRIDE sơ bộ trên Container, 3 ranh giới tin cậy | Abuse cases trong requirements; chuẩn ASVS mức 2 | gitleaks, Dependency-Check, pre-commit | Không (chưa có code) | WAF/DDoS, mã hóa at rest, phát hiện gian lận |
| 1 | v0 giữ nguyên | JWT (iss/aud/exp/alg), authorization theo ownership, DTO riêng, Problem Details không lộ, security headers, audit log, idempotency | CodeQL, JWKS giả cho test | 1 và 2: BOLA, mass assignment, JWT, replay, idempotency, race cùng user, SQLi, lộ thông tin | Client dev dùng password grant chỉ trong realm dev |
| 2 | v0 + dòng Redis, token, rate limit | Redis ACL + TLS + AOF, token HMAC dùng một lần, rate limit user/IP/toàn hệ thống, giới hạn body và timeout, trust proxy | Redis ACL, Turbo Intruder single-packet | 3 và 4: dùng lại token, token người khác, giả token, bypass rate limit, race trên Redis, payload lớn và slow client | Redis điểm lỗi đơn, không có challenge chống bot thật |
| 3 | v0 + Kafka, webhook, Connect | Kafka SASL/SCRAM + ACL + TLS, webhook HMAC + timestamp + nonce + đối chiếu số tiền, DB và Redis user theo service, schema validation, `source` allowlist | Kafka ACL, Apicurio auth | 5 và 6: publish event giả, replay webhook, sửa số tiền, sai schema, poison message, trùng event | Connect REST không auth; cli có quyền cao dùng tay |
| 4 | v0 + Kubernetes, supply chain, observability | NetworkPolicy default-deny, PSS restricted, RBAC, SA không mount token, SBOM + Trivy + cosign + Kyverno, secret không lộ qua Actuator, mask log, xoay secret 2 giá trị | Syft, Trivy, cosign, Kyverno, kube-bench, ZAP, schemathesis, Cilium/Hubble | 7 và 8: image không ký, DB chéo, gọi API K8s, Actuator, retag image, webhook từ pod lạ, ZAP | Secret at rest trên kind, GitHub Actions bị chiếm (SLSA 3), Argo CD không SSO |
| 5 | v1: DFD 3 mức, risk register, ASVS tự đánh giá | Mục Security của SAD, bảng "đã chứng minh bằng tấn công" | Threat Dragon (đầy đủ), ASVS checklist | Không thêm; mock review có câu hỏi security | Gom tất cả vào risk register có chủ và hạn |

Tổng cộng khoảng 26 kịch bản tấn công có ghi chép và 4 phiên bản threat model; đó là phần "bằng chứng" của mục Security trong SAD.

## 3. Bộ công cụ

21 công cụ, tất cả miễn phí hoặc có bản community đủ dùng; cài theo giai đoạn cần đến, không cài trước để tránh choáng.

| Công cụ | Mục đích | Giai đoạn | Cài | Chạy ở |
| --- | --- | --- | --- | --- |
| gitleaks | Quét secret trong lịch sử Git và commit mới | 0 | `brew install gitleaks` hoặc binary; pre-commit hook + GitHub Action | Local + CI |
| pre-commit | Chạy gitleaks và spotless trước commit | 0 | `pip install pre-commit`; `.pre-commit-config.yaml` | Local |
| OWASP Dependency-Check | SCA cho dependency Gradle theo NVD | 0 | Gradle plugin; cần NVD API key (miễn phí) | CI + local khi cần |
| CodeQL | SAST cho Java | 1 | Default setup trên GitHub (repo public) hoặc workflow riêng | CI |
| Semgrep (tùy chọn) | SAST nhanh, rule Spring | 1 | `pip install semgrep`; `semgrep --config p/java` | Local |
| Burp Suite Community | Proxy, Repeater, Intruder cơ bản | 1 | Tải từ PortSwigger; cấu hình proxy cho HTTP client | Local |
| Turbo Intruder | Race condition, single-packet attack | 1–2 | Extension trong Burp (BApp Store) | Local |
| jwt\_tool | Thử alg none, key confusion, sửa claim | 1 | `git clone` + Python | Local |
| sqlmap | SQLi nhẹ để xác nhận tham số hóa | 1 | `pip install sqlmap` | Local, chỉ mức thấp |
| OWASP Threat Dragon | Vẽ DFD, STRIDE | 0, 5 | Bản desktop hoặc web tự host | Local |
| Redis ACL và `redis-cli --user` | Kiểm tra quyền Redis | 2 | Có sẵn trong Redis | Local |
| kcat và `kafka-acls.sh` | Publish/consume thử với credential khác nhau | 3 | `brew install kcat`; script trong image Kafka | Local |
| Syft | SBOM SPDX/CycloneDX | 4 | Binary hoặc GitHub Action `anchore/sbom-action` | CI |
| Trivy | Quét image, filesystem, config, secret | 4 | Binary + `aquasecurity/trivy-action` | CI + local |
| cosign | Ký và xác minh image, attestation | 4 | `sigstore/cosign-installer` | CI; `cosign verify` local |
| Kyverno + Kyverno CLI | Policy admission; `kyverno apply` để test policy offline | 4 | Helm chart; CLI binary | Cụm + CI |
| kube-bench | CIS Benchmark cho node | 4 | Job trên kind | Cụm, hàng tuần |
| OWASP ZAP | DAST baseline và full scan | 4 | Docker `zaproxy/zap-stable`; GitHub Action | CI (baseline) + local (full) |
| schemathesis | Fuzz API theo OpenAPI | 4 | `pip install schemathesis` | CI + local |
| Cilium + Hubble | CNI có NetworkPolicy và quan sát luồng mạng | 4 | Helm trên kind | Cụm |
| OpenSSF Scorecard | Điểm sức khỏe repo và dependency chính | 4 | GitHub Action | CI, hàng tuần |

Mỗi công cụ có một file `docs/security/tools/<tên>.md` 10 dòng: lệnh chạy chuẩn của dự án, cách đọc kết quả, lỗi thường gặp; viết lúc cài để 3 tháng sau không phải nhớ lại.

## 4. Quy trình buổi tự tấn công và mẫu attack log

Một buổi 2–3 giờ với kịch bản viết trước, phạm vi rõ, và ghi chép ngay khi làm; đọc lại attack log sau 3 tháng phải hiểu được đã thử gì và vì sao.

**4.1. Trước buổi (30 phút, làm ở buổi trước đó)**

- Chọn 3–4 kịch bản từ bảng của tab giai đoạn; mỗi kịch bản viết trước: mục tiêu, cách thử, kết quả kỳ vọng, dòng threat model tương ứng.
- Chuẩn bị môi trường: Compose hoặc kind sạch, seed dữ liệu (2 user, 1 admin, 1 đợt đang mở), token hợp lệ của từng user, Burp đang chạy, log của service mở ở terminal riêng.
- Đặt giới hạn: chỉ mục tiêu local; không thử tấn công tài nguyên ngoài; không chạy công cụ tự động toàn cục (sqlmap mức cao, ZAP full) khi chưa hiểu tác động.

**4.2. Trong buổi**

1. Bấm giờ 30–40 phút mỗi kịch bản; hết giờ chuyển kịch bản, ghi "chưa xong" thay vì kéo dài.
2. Ghi request/response mẫu (rút gọn, bỏ token thật) vào attack log ngay khi có kết quả.
3. Với mỗi kết quả không như kỳ vọng: chụp bằng chứng, tạo issue gắn nhãn `security`, không sửa ngay trong buổi (sửa vội dễ sửa sai chỗ).
4. Nếu tìm ra thứ nằm ngoài kịch bản, ghi vào mục "ngoài kế hoạch" và tiếp tục kịch bản đang làm.

**4.3. Sau buổi (buổi tiếp theo)**

- Sửa theo issue; mỗi fix có test hồi quy đặt tên theo kịch bản (`Attack2_TokenReuseTest`).
- Cập nhật threat model (dòng nào đổi mức rủi ro) và risk register.
- Đóng attack log bằng 3 câu "bài học".

**4.4. Mẫu `docs/security/attack-log-<n>.md`**

```markdown
# Attack log <n> — Giai đoạn <k>

- Ngày: YYYY-MM-DD · Môi trường: compose | kind · Commit: <sha> · Người: <tên>
- Phạm vi: <service, endpoint, topic được phép chạm> · Ngoài phạm vi: <…>

| # | Kịch bản | Dòng threat model | Cách thử (công cụ, request rút gọn) | Kỳ vọng | Kết quả | Bằng chứng | Fix (commit) | Test hồi quy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | Đúng kỳ vọng / Không | link ảnh hoặc đoạn log | | |

## Ngoài kế hoạch
## Bài học (3 câu)
## Cập nhật threat model và risk register
```

**4.5. Đạo đức và pháp lý**

- Toàn bộ mục tiêu là hệ thống do mình sở hữu, chạy trên máy mình hoặc cụm kind; điều này ghi ở đầu mỗi attack log.
- Không lưu credential thật, không đưa payload có thể gây hại vào repo public dưới dạng chạy được (mô tả kịch bản là đủ; script tấn công để trong thư mục không commit hoặc repo riêng).
- Khi viết bài công khai, mô tả pattern và biện pháp, không đăng exploit kèm hướng dẫn nhắm vào hệ thống của người khác.

## 5. Secure coding guideline cho Java/Spring của dự án

20 quy tắc, mỗi quy tắc có cách kiểm tự động khi có thể; quy tắc không kiểm tự động được thì nằm trong checklist self-review của PR (tab Quy ước làm việc).

| # | Quy tắc | Vì sao | Kiểm tự động |
| --- | --- | --- | --- |
| 1 | Controller chỉ nhận record DTO có Bean Validation; không bao giờ nhận entity | Chặn mass assignment | ArchUnit: method trong `*Controller` không có tham số thuộc package `internal` |
| 2 | `userId` chỉ lấy từ `Jwt.getSubject()`, không từ body, query, header | Chặn giả danh | ArchUnit: không class nào ngoài `shared.security` gọi `getHeader("X-User")`; review |
| 3 | Mọi truy vấn tài nguyên của user đi qua method có tham số `userId` | Chặn BOLA | ArchUnit: `order.internal` không gọi `findById` của `JpaRepository` |
| 4 | Tài nguyên không thuộc user trả 404, không 403 | Không lộ ID tồn tại | Test authorization cho mọi endpoint |
| 5 | Truy vấn SQL chỉ qua JPA/JDBC tham số hóa; không nối chuỗi | Chặn SQLi | CodeQL rule `java/sql-injection`; review `@Query` native |
| 6 | Không bật Jackson default typing; không deserialize kiểu đa hình từ input | Chặn deserialization | Grep `enableDefaultTyping`, `@JsonTypeInfo` trên DTO input |
| 7 | So sánh chữ ký, token, hash bằng `MessageDigest.isEqual` | Chặn timing attack | CodeQL custom query hoặc Semgrep rule tìm `equals` trên byte\[\] chữ ký |
| 8 | Ngẫu nhiên bảo mật bằng `SecureRandom`; ID không đoán được dùng UUIDv7 từ generator tin cậy | Chặn đoán token/ID | Semgrep: cấm `new Random()` trong package security |
| 9 | Không tự viết crypto; HMAC-SHA256 qua `javax.crypto.Mac`, khóa ≥ 256 bit từ Secret | Tránh lỗi tự chế | Review |
| 10 | JWT: kiểm tra `iss`, `aud`, `exp`, `nbf`; thuật toán lấy từ JWKS; access token ≤ 5 phút | Chặn token giả | `JwtValidationTest` với 4 token xấu |
| 11 | Không log `Authorization`, body, token, chữ ký; `sub` chỉ log dạng băm ngắn | Chặn lộ qua log | `MaskingJsonGeneratorDecorator` + test log không chứa pattern JWT |
| 12 | Problem Details không chứa stack trace, tên class, SQL; lỗi lạ → 500 kèm `traceId` | Chặn lộ thông tin | `ProblemDetailsTest` |
| 13 | Mọi cuộc gọi ra ngoài (HTTP, Redis, DB, Kafka) có timeout tường minh dưới 5 giây | Chặn treo tài nguyên | Grep cấu hình; test timeout với `tok_timeout` |
| 14 | Không regex trên input người dùng trừ pattern hằng đã kiểm ReDoS | Chặn ReDoS | Semgrep rule tìm `Pattern.compile` với biến |
| 15 | Giới hạn body 16 KB; từ chối `Content-Type` không mong đợi | Chặn payload lớn | `BodyLimitTest` |
| 16 | Không gọi mạng trong transaction DB; outbox cho mọi event | Nhất quán và không giữ lock lâu | ArchUnit: class có `@Transactional` không phụ thuộc `RestClient`/`KafkaTemplate` |
| 17 | Consumer idempotent theo `event id`; endpoint ghi có `Idempotency-Key` | Chặn trùng và replay | `IdempotencyTest`, `IdempotentConsumerTest` |
| 18 | Secret chỉ từ biến môi trường hoặc Secret mount; không trong `application.yaml`, không trong test commit | Chặn lộ secret | gitleaks; Trivy secret scanner |
| 19 | Dependency pin version cố định; thêm dependency mới phải qua review (mục 7) | Supply chain | Renovate + Dependency-Check + review PR |
| 20 | Endpoint quản trị (Actuator, admin API) trên port hoặc route riêng, có role riêng, không ra ingress | Giảm bề mặt tấn công | Test 404 qua ingress cho `/actuator/**`; NetworkPolicy |

**Quy tắc ArchUnit (`shared/src/test/java/.../SecurityRulesTest.java`, trích)**

```java
@ArchTest
static final ArchRule controllersTakeOnlyDtos = methods()
    .that().areDeclaredInClassesThat().haveSimpleNameEndingWith("Controller")
    .should().notHaveRawParameterTypes(DescribedPredicate.describe("entity types",
        c -> c.getPackageName().contains(".internal")));

@ArchTest
static final ArchRule noFindByIdWithoutUser = noClasses()
    .that().resideInAPackage("..order.internal..")
    .should().callMethod(JpaRepository.class, "findById", Object.class);

@ArchTest
static final ArchRule noNetworkInsideTransactions = noClasses()
    .that().areAnnotatedWith(Transactional.class)
    .should().dependOnClassesThat().haveNameMatching(".*(RestClient|WebClient|KafkaTemplate).*");
```

Ba rule này chạy trong `ModularityTests` cùng `ApplicationModules.verify()`; rule mới thêm khi một fix từ attack log có thể được ép bằng cấu trúc.

## 6. Danh mục secret và xoay khóa

Mọi secret của dự án có tên trong bảng này, nơi lưu ở từng môi trường, và một quy trình xoay đã chạy thử ít nhất một lần (giai đoạn 4, sự cố giả lập chính là xoay secret Redis).

**6.1. Danh mục**

| Secret | Dùng bởi | Compose (dev) | kind | Cloud (thiết kế trong SAD) | Xoay |
| --- | --- | --- | --- | --- | --- |
| Mật khẩu PostgreSQL ×3 user app + `debezium` | 3 service, Connect | `.env` không commit; giá trị `dev-only` trong allowlist gitleaks | Secret do `make secrets` tạo; CloudNativePG tự sinh cho superuser | Secrets Manager + KMS; RDS IAM auth cân nhắc | Rollout restart service; Debezium cần restart connector |
| Redis ACL ×2 user | order-service, core | `.env` | Secret | Secrets Manager | 2 giá trị đồng thời không hỗ trợ trên Redis ACL → đặt user mới, chuyển app, xóa user cũ |
| Kafka SCRAM ×5 user | 3 service, Connect, cli | `.env` | `KafkaUser` CR (Strimzi tự sinh Secret) | MSK SCRAM qua Secrets Manager | Strimzi: xóa và tạo lại `KafkaUser`, rollout |
| HMAC key token hàng chờ | order-service | `.env` | Secret | Secrets Manager | Hỗ trợ 2 khóa (`keys[]`): thêm khóa mới, chờ TTL 60 giây, bỏ khóa cũ |
| Webhook secret ×2 (charge, webhook) | payment-service, gateway mock | `.env` | Secret | Secrets Manager | 2 giá trị trong 24 giờ như Stripe |
| Keycloak admin và client secret | Keycloak, k6 test client | Realm import (dev) | Secret + realm ConfigMap không chứa mật khẩu user | Cognito hoặc Keycloak quản lý | Đổi trong Keycloak, cập nhật Secret |
| NVD API key, `GITHUB_TOKEN`, cosign (keyless, không có khóa) | CI | — | — | GitHub Secrets | NVD: tạo key mới trên trang NVD |
| Grafana admin, Argo CD admin | Vận hành | — | Secret sinh lúc cài | SSO (ghi trong SAD) | Đổi qua UI/CLI |

**6.2. Quy tắc**

- Không có secret nào xuất hiện trong `application*.yaml`, Helm `values.yaml`, Dockerfile, test hay tài liệu; gitleaks có allowlist đúng 3 giá trị dev (`dev-only`, mật khẩu user mẫu Keycloak, secret của gateway mock) và file allowlist được review khi thay đổi.
- Ứng dụng đọc secret qua biến môi trường hoặc file mount, không qua `@Value` trên giá trị mặc định có secret.
- Actuator `env` và `configprops` tắt; `refresh` không dùng; xoay secret luôn kèm rollout restart hoặc reload có chủ đích.
- Mọi secret có ngày tạo ghi trong `docs/security/secrets-inventory.md` (không ghi giá trị); xoay ít nhất một lần trong dự án để chứng minh quy trình.

**6.3. Quy trình xoay chuẩn (runbook `rotate-secrets.md`)**

1. Tạo giá trị mới; với secret hỗ trợ 2 giá trị: thêm giá trị mới bên cạnh giá trị cũ.
2. Cập nhật Secret trong kind (hoặc `.env`); xác nhận bằng `kubectl get secret -o jsonpath`.
3. Rollout restart service liên quan theo thứ tự: consumer trước, producer sau (để không mất event khi Kafka SCRAM đổi).
4. Kiểm tra: health Ready, một request đặt hàng thành công, một event đi hết saga.
5. Gỡ giá trị cũ sau cửa sổ chồng lấn; ghi ngày vào inventory.
6. Nếu bước 4 thất bại: rollback Secret về giá trị cũ, rollout lại; đây chính là sự cố giả lập ở giai đoạn 4.

## 7. Chính sách dependency và supply chain

Dependency là mã của người khác chạy với quyền của mình; chính sách này quyết định thêm gì, cập nhật khi nào, và chứng minh được image chứa đúng những gì đã kiểm.

**7.1. Thêm dependency mới**

| Bước | Việc |
| --- | --- |
| 1 | Hỏi ba câu: JDK hoặc Spring đã có chưa; thư viện còn được bảo trì không (commit trong 12 tháng, issue được trả lời); có bao nhiêu dependency bắc cầu |
| 2 | Xem OpenSSF Scorecard hoặc ít nhất số maintainer, chính sách release, có ký artifact không |
| 3 | Pin version cụ thể; `gradle dependencies --configuration runtimeClasspath` để thấy cây bắc cầu; từ chối nếu kéo theo thư viện đã cấm (ví dụ Jackson cũ, Log4j 1.x) |
| 4 | Ghi một dòng vào `docs/dependencies.md`: tên, lý do, ngày, ai review (tự review nhưng ghi "ngày review lại") |
| 5 | PR riêng cho dependency mới, không gộp với tính năng; Dependency-Check và Trivy phải xanh |

**7.2. Cập nhật**

- Renovate (`renovate.json`): lịch hàng tuần, gộp patch và minor thành một PR, major PR riêng; pin GitHub Actions theo SHA; base image theo digest; Helm chart và Kubernetes operator có nhóm riêng.
- PR của Renovate tự chạy toàn bộ test (kể cả test đồng thời 3 lần) và Trivy; merge tay sau khi đọc changelog của major.
- CVE Critical trong dependency đang dùng: xử lý trong 48 giờ (mục 10); High: trong tuần; Medium: gom vào Renovate tuần tới.
- Mỗi quý chạy `gradle dependencyUpdates` để thấy thư viện Renovate không theo dõi (plugin, buildSrc).

**7.3. SBOM và attestation**

- Syft sinh SPDX JSON cho mỗi image; cosign `attest` đính vào image; Kyverno chỉ nhận image có attestation SBOM từ workflow `release.yml`.
- SBOM lưu thêm dạng artifact của GitHub Actions 90 ngày; khi có CVE mới, `grype sbom:sbom.spdx.json` (hoặc Trivy với SBOM) để biết image nào ảnh hưởng mà không build lại.
- Provenance SLSA từ `actions/attest-build-provenance`; ghi vào SAD mức đạt được (build level 2) và vì sao chưa level 3 (runner dùng chung, không có isolation cứng).

**7.4. License**

- Plugin Gradle license report (ví dụ `com.github.jk1.dependency-license-report`) chạy trong CI; allowlist Apache-2.0, MIT, BSD, EPL; GPL và AGPL phải review riêng (dự án public nên thường chấp nhận được, nhưng đây là thói quen SA cần có với khách hàng thương mại).
- Báo cáo license nằm cạnh SBOM trong artifact CI.

**7.5. Base image và toolchain**

- JDK build và JRE runtime pin digest; Renovate cập nhật digest; mỗi lần đổi base image chạy lại Trivy và so số CVE trước/sau vào nhật ký.
- Gradle wrapper pin version và checksum (`distributionSha256Sum`); wrapper validation action trong CI.
- Không cài công cụ từ `curl | sh` trong CI; dùng action có pin SHA hoặc tải binary có checksum.

## 8. Vòng đời threat model và risk register

Threat model là tài liệu sống có version như code: thay đổi kiến trúc nào không kèm cập nhật threat model thì PR chưa xong.

**8.1. Bốn phiên bản**

| Phiên bản | Khi nào | Phạm vi | Lưu |
| --- | --- | --- | --- |
| v0 | Giai đoạn 0, buổi 5 | STRIDE trên Container, 3 ranh giới, abuse cases AC-01…08 | `threat-model-v0.md` + `.json` Threat Dragon |
| v0.1, v0.2, v0.3 | Cuối giai đoạn 2, 3, 4 | Thêm dòng cho phần tử mới (Redis, Kafka, webhook, K8s, supply chain); đổi mức rủi ro cho dòng đã có biện pháp | Cùng file, mục "Changelog" ở cuối, commit cùng tag giai đoạn |
| v1 | Giai đoạn 5, buổi 6–8 | DFD 3 mức trên kiến trúc cuối; STRIDE theo phần tử đủ 3 mức; risk register hoàn chỉnh | `threat-model-v1.md`, `risk-register.md` |
| v1.x | Sau dự án, khi làm backlog | Mỗi việc trong backlog mục 11.1 (tab Giai đoạn 5) kèm cập nhật | Cùng file |

**8.2. Quy tắc cập nhật khi kiến trúc đổi**

1. ADR mới hoặc thay đổi C4 → mở threat model, thêm phần tử hoặc luồng mới với đủ 6 chữ STRIDE.
2. Mỗi dòng mới có: biện pháp dự kiến và giai đoạn xử lý, hoặc "chấp nhận" kèm lý do → risk register.
3. Biện pháp đã làm xong và có test hồi quy → hạ mức rủi ro còn lại; ghi link test.
4. Trước khi gắn tag giai đoạn: rà lại mọi dòng có mức Cao còn lại; không được gắn tag nếu có dòng Cao chưa có chủ và hạn.

**8.3. Risk register: cách cho điểm và theo dõi**

- Khả năng 1–5 và tác động 1–5; điểm = tích; ≥ 12 phải có hành động hoặc chấp nhận có ghi ADR; 6–11 có ngày xem lại; < 6 ghi nhận.
- Trạng thái: Mở, Giảm thiểu, Chấp nhận, Đóng; mỗi dòng có chủ (trong dự án là bạn, nhưng ghi để quen) và hạn hoặc điều kiện ("khi lên cloud", "khi có team").
- Xem lại register ở buổi cuối mỗi giai đoạn và ở retrospective; dòng nào quá hạn hai lần thì hoặc làm hoặc nâng thành "chấp nhận có lý do".

**8.4. Cách trình bày trong SAD và với khách hàng**

- SAD mục 8: mô hình tin cậy và biện pháp theo ranh giới; mục 11: bảng rủi ro còn lại rút gọn (chỉ dòng ≥ 6).
- Với khách hàng: nói rủi ro chấp nhận trước khi họ hỏi, kèm điều kiện xử lý và chi phí; đây là thói quen phân biệt SA với người bán giải pháp.

## 9. Ánh xạ ASVS mức 2 và OWASP API Security Top 10

ASVS là thước đo, không phải danh sách việc: mỗi chương của ASVS được gán cho giai đoạn nơi bằng chứng xuất hiện, và tự đánh giá cuối giai đoạn 5 đi qua đúng bảng này. Tên và số chương lấy theo bản ASVS đang dùng lúc làm (bản 5.x); nếu số chương khác, giữ tên chủ đề.

**9.1. ASVS theo chủ đề**

| Chủ đề ASVS | Giai đoạn có bằng chứng | Bằng chứng chính | Kỳ vọng tự đánh giá |
| --- | --- | --- | --- |
| Kiến trúc, thiết kế, threat modeling | 0, 5 | Threat model v0, v1; risk register; ADR | Đạt phần lớn; mục về quy trình tổ chức đánh dấu không áp dụng |
| Xác thực | 1 | Keycloak OIDC, JWT validation, MFA cho admin | Đạt; phần chính sách mật khẩu do Keycloak đảm nhiệm |
| Quản lý phiên | 1 | Stateless, access token 5 phút, refresh 30 phút, không cookie | Đạt (nhiều mục không áp dụng vì không có session) |
| Kiểm soát truy cập | 1, 3 | Ownership, role, 404 cho tài nguyên người khác, ACL Kafka/Redis/DB theo service | Đạt |
| Validation, sanitization, encoding | 1, 2 | DTO + Bean Validation, giới hạn body, không regex trên input, Problem Details | Đạt |
| Mật mã | 2, 3 | HMAC-SHA256 qua JCA, `SecureRandom`, so sánh hằng thời gian, TLS ở Redis/Kafka | Đạt; mã hóa at rest chưa đạt trên kind |
| Xử lý lỗi và logging | 1, 4 | Không lộ stack trace, mask log, audit log bất biến, traceId | Đạt |
| Bảo vệ dữ liệu | 1, 4 | PII tối thiểu (chỉ `sub`), băm trong log, không lưu thẻ | Đạt; retention và xóa dữ liệu theo yêu cầu ghi là chưa làm |
| Giao tiếp (TLS) | 2, 3, 4 | TLS Redis, Kafka, ingress; chưa TLS giữa node Redis và trong replication | Đạt một phần; ghi risk |
| Mã độc và toàn vẹn (supply chain) | 4 | SBOM, Trivy, cosign, Kyverno, Renovate, pin digest | Đạt |
| Logic nghiệp vụ | 1, 2, 3 | Idempotency, race test, token dùng một lần, giới hạn số lượng, saga bù trừ | Đạt |
| File và tài nguyên | — | Không có upload | Không áp dụng |
| API và web service | 1, 3, 4 | OpenAPI, schema validation event, rate limit, schemathesis, ZAP | Đạt |
| Cấu hình | 4 | Actuator tối thiểu, secret ngoài code, PSS, NetworkPolicy, image non-root | Đạt; secret at rest chưa |

**9.2. OWASP API Security Top 10 (2023)**

| # | Rủi ro | Xử lý ở | Bằng chứng |
| --- | --- | --- | --- |
| API1 | Broken Object Level Authorization | Giai đoạn 1 | `OrderAuthorizationTest`, ArchUnit `noFindByIdWithoutUser` |
| API2 | Broken Authentication | 1 | JWT validation test, Keycloak cấu hình |
| API3 | Broken Object Property Level Authorization | 1 | DTO riêng, `PlaceOrderValidationTest` |
| API4 | Unrestricted Resource Consumption | 2 | Rate limit, body limit, timeout, bulkhead |
| API5 | Broken Function Level Authorization | 1 | Ma trận quyền 10 endpoint; admin route riêng |
| API6 | Unrestricted Access to Sensitive Business Flows | 2 | Token hàng chờ, giới hạn 1 đơn/user, chỗ cắm challenge; rủi ro R1 |
| API7 | Server Side Request Forgery | 3 | Không có URL từ input; gateway URL cố định từ cấu hình; NetworkPolicy egress |
| API8 | Security Misconfiguration | 4 | Actuator tối thiểu, security headers, PSS, Trivy config |
| API9 | Improper Inventory Management | 5 | OpenAPI duy nhất, C4 Context liệt kê giao diện ngoài, không có endpoint "test" trên môi trường kind (profile `e2e` chỉ local) |
| API10 | Unsafe Consumption of APIs | 3 | Webhook HMAC, đối chiếu số tiền, schema validation, timeout khi gọi gateway |

Hai bảng này đặt vào phụ lục SAD; mỗi dòng "Đạt" phải có link, mỗi dòng "chưa" phải có mã rủi ro.

## 10. Playbook ứng phó sự cố bảo mật trong dự án

Ba tình huống có thể xảy ra thật với một dự án public trong 6 tháng; mỗi tình huống có thứ tự việc làm để không phải nghĩ lúc đang lo.

**10.1. Lộ secret (commit nhầm, log, ảnh chụp màn hình)**

1. Coi secret đã bị lộ ngay khi phát hiện, kể cả khi vừa push 1 phút; không dựa vào "chưa ai thấy".
2. Xoay secret theo runbook mục 6.3 trước, dọn lịch sử sau: giá trị mới có hiệu lực rồi mới `git filter-repo` (hoặc BFG) và force push; ghi rõ trong nhật ký vì force push trên repo public ảnh hưởng người fork.
3. Nếu là secret của dịch vụ ngoài (NVD key, token GitHub): thu hồi trên trang nhà cung cấp trước.
4. Kiểm tra gitleaks vì sao không bắt: thiếu rule hay bị allowlist quá rộng; sửa cấu hình và thêm test cho rule.
5. Ghi một postmortem ngắn (10 dòng) trong `docs/security/incidents.md`.

**10.2. CVE Critical hoặc High trong dependency hoặc base image đang dùng**

1. Xác định ảnh hưởng bằng SBOM: `grype sbom:...` hoặc Trivy với SBOM cho cả 3 image; ghi image nào chứa gói bị ảnh hưởng và có reachable không (CodeQL/Semgrep tìm lời gọi tới API bị lỗi).
2. Có bản vá: nâng version qua PR riêng, chạy toàn bộ test và Trivy, merge trong 48 giờ (Critical) hoặc trong tuần (High).
3. Chưa có bản vá: biện pháp tạm (tắt tính năng, NetworkPolicy chặt hơn, WAF rule nếu có), ghi vào risk register với hạn xem lại; `ignore-unfixed` chỉ áp dụng khi có dòng risk tương ứng.
4. Ghi dòng vào `docs/security/incidents.md` với CVE, thời gian phát hiện, thời gian vá; đây là số liệu "mean time to remediate" cho SAD.

**10.3. Dấu hiệu bất thường trong môi trường (log, Hubble, alert)**

1. Không tắt hệ thống ngay nếu là kind local; chụp trạng thái: `kubectl get events`, log service, Hubble flows, `redis-cli ACL LOG`, `kafka-acls --list`.
2. Đối chiếu với attack log: có phải chính mình đang thử không (thường là vậy).
3. Nếu không: cô lập bằng NetworkPolicy deny riêng cho pod nghi ngờ, xoay secret liên quan, xem image digest có khớp chữ ký (`cosign verify`).
4. Ghi lại như một kịch bản chaos/security mới; nếu là lỗ hổng thật, tạo issue riêng và fix có test hồi quy.

**10.4. Báo cáo lỗ hổng từ người ngoài (repo public có thể nhận)**

- Có `SECURITY.md` với cách liên hệ riêng (email hoặc GitHub private vulnerability reporting), cam kết phản hồi trong 7 ngày, và phạm vi (chỉ code trong repo, không phải hạ tầng cá nhân).
- Cảm ơn công khai sau khi fix nếu người báo đồng ý; đây cũng là bài học về cách doanh nghiệp nhận báo cáo.

## 11. Nguồn học security tổng hợp và quyết định

Đây là danh sách gộp từ các tab giai đoạn, sắp theo thứ tự đọc; tổng khoảng 25 giờ rải trong 6 tháng, không đọc dồn.

| Thứ tự | Nguồn | Dùng cho | Miễn phí |
| --- | --- | --- | --- |
| 1 | OWASP ASVS (bản mới nhất) và OWASP API Security Top 10 (2023) | Thước đo xuyên suốt; mục 9 | Có |
| 2 | *Threat Modeling: Designing for Security* (Shostack), chương 1–3 và chương STRIDE, DFD | Giai đoạn 0 và 5 | Không |
| 3 | *Secure by Design* (Bergh Johnsson, Deogun, Sawano) | Quy tắc 1–6, 16–17 ở mục 5; gắn DDD với bảo mật | Không |
| 4 | OWASP Cheat Sheet Series: Authorization, Input Validation, Logging, REST Security, Secrets Management, Docker Security, Kubernetes Security | Tra cứu khi làm từng biện pháp | Có |
| 5 | Spring Security reference (bản 7): OAuth2 Resource Server, Headers, Method Security | Giai đoạn 1 | Có |
| 6 | PortSwigger Web Security Academy: Access control, JWT, Race conditions, Business logic, Rate limit bypass | Buổi tấn công 1–4 | Có |
| 7 | James Kettle, "Smashing the state machine" (PortSwigger Research) | Single-packet attack, race trong logic nghiệp vụ | Có |
| 8 | Redis Security docs, ACL; Kafka Security docs | Giai đoạn 2–3 | Có |
| 9 | Stripe và Slack docs về ký webhook | Giai đoạn 3 | Có |
| 10 | Kubernetes docs: Security (PSS, NetworkPolicy, RBAC, Secrets); CIS Kubernetes Benchmark; Kyverno docs | Giai đoạn 4 | Benchmark cần đăng ký miễn phí |
| 11 | SLSA spec, Sigstore docs, OpenSSF Scorecard, CNCF Software Supply Chain Best Practices | Giai đoạn 4 mục supply chain | Có |
| 12 | Google SRE book chương "Postmortem Culture"; NIST SP 800-61 (tóm tắt) | Mục 10 | Có |
| 13 | Podcast và newsletter: tl;dr sec, Risky Business, OWASP podcast | Cập nhật hàng tuần 20 phút | Có |

**Quyết định cho các câu hỏi mở của luồng security**

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | Chuẩn kiểm tra: ASVS mức 2 hay thêm cả mức 3 ở vài chương? | **Mức 2 toàn bộ**; mức 3 chỉ tham khảo ở chương mật mã và supply chain | Mức 3 đòi hỏi kiểm định bên ngoài và cấu hình tổ chức; ngoài phạm vi một người |
| 2 | Burp Community có đủ không? | **Đủ** với Turbo Intruder; nếu cần scanner tự động dùng ZAP | Không mua Pro cho dự án học; ZAP đã có scan |
| 3 | Script tấn công có commit không? | **Không commit exploit chạy được**; commit mô tả kịch bản và test hồi quy | Repo public; tránh cung cấp công cụ nhắm vào hệ thống người khác |
| 4 | Threat model bằng Threat Dragon hay chỉ Markdown? | **Cả hai**: Threat Dragon cho DFD (file .json commit), Markdown cho bảng STRIDE và risk register | Hình vẽ để nói chuyện, bảng để theo dõi |
| 5 | SECURITY.md và nhận báo cáo từ ngoài? | **Có**, dùng GitHub private vulnerability reporting | Thói quen doanh nghiệp; chi phí bằng 0 |
| 6 | Xoay secret thật bao nhiêu lần trong dự án? | **Ít nhất 2 lần**: một lần theo runbook (giai đoạn 4 buổi 11), một lần trong sự cố giả lập | Runbook chưa chạy là runbook chưa đúng |
| 7 | Semgrep có bắt buộc bên cạnh CodeQL? | **Không bắt buộc**; dùng local cho rule tự viết ở mục 5 (regex, `equals` trên chữ ký) | CodeQL đủ cho SAST chuẩn; Semgrep tiện cho rule riêng của dự án |
