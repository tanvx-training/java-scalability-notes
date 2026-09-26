# Giai đoạn 5 — Góc nhìn Solution Architect (tài liệu chi tiết)

Năm tuần cuối không thêm tính năng; chúng biến 4 giai đoạn code, số đo và ADR thành một bộ tài liệu kiến trúc mà một khách hàng, một CTO và một kỹ sư mới đều đọc được, kèm con số chi phí và một bài trình bày công khai.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 5 kết thúc khi có một Solution Architecture Document đọc được trong 30 phút, một bảng chi phí 1 năm cho 3 phương án hạ tầng có khuyến nghị, và một bài trình bày đã nhận phản biện từ người khác.

**Mục tiêu**

- Viết được kiến trúc theo chuẩn (arc42) từ artefact có sẵn: C4, ADR, số đo, threat model, postmortem; không viết lại từ đầu, không viết thứ chưa làm.
- Đưa chi phí vào quyết định kiến trúc: TCO 1 năm, chi phí mỗi đợt flash sale, độ nhạy theo giả định; ADR-008 có số.
- Tự đánh giá theo AWS Well-Architected và ghi khoảng trống một cách trung thực; đây là ngôn ngữ SA dùng với khách hàng cloud.
- Nhìn ra ngoài dự án: đối chiếu với hệ thống thật và với các lựa chọn không dùng (Temporal, service mesh, GraalVM native) để biết ranh giới của thiết kế mình.
- Luyện kỹ năng chuyển giữa kỹ thuật và kinh doanh: bài viết, talk 20 phút, proposal 2 trang, mock review.

**Trong phạm vi:** SAD arc42, threat model đầy đủ + risk register, TCO 3 phương án AWS (ap-southeast-1), Well-Architected review, GraalVM native cho một service, đọc so sánh, bài viết Viblo, slide và talk, proposal, portfolio README.

**Ngoài phạm vi:** triển khai lên cloud thật (chỉ tính); thêm tính năng; chứng chỉ (lộ trình ở mục 11, học song song ngoài giờ dự án); đa vùng, DR thật (chỉ thiết kế trên giấy trong SAD).

**Definition of Done (đủ mới gắn tag `v5-sa`)**

- [ ] `docs/sad/` có 12 mục arc42, mỗi mục có nội dung thật hoặc ghi rõ "không áp dụng, vì…"; tổng dưới 40 trang; C4 Context, Container, Deployment và ít nhất 2 Component view sinh từ Modulith.
- [ ] Mục 10 của SAD có ít nhất 8 quality scenario theo mẫu ở mục 3.3, mỗi scenario trỏ tới bằng chứng (test, report, chaos).
- [ ] `docs/security/threat-model-v1.md`: DFD mức 1 và 2, bảng STRIDE theo phần tử, risk register có chủ sở hữu và hạn cho mọi rủi ro còn tồn đọng; checklist ASVS mức 2 tự đánh giá với tỷ lệ đạt và danh sách chưa đạt.
- [ ] `docs/cost/tco-1y.xlsx` (hoặc Markdown) cho 3 phương án, mỗi dòng có link tới cấu hình trên Pricing Calculator; bảng độ nhạy 4 giả định; ADR-008 Accepted với khuyến nghị và điều kiện đổi phương án.
- [ ] `docs/well-architected.md`: 6 trụ cột, mỗi trụ cột có bằng chứng, khoảng trống, hành động; ít nhất 3 khoảng trống được thừa nhận.
- [ ] payment-service build native thành công; bảng so sánh JVM+AOT so với native (startup, RSS, p99 warm, build time, image size); quyết định ghi thành một mục trong SAD (không cần ADR riêng).
- [ ] `docs/comparison.md`: 3 điểm khác biệt với hệ thống thật có lý do, 1 mục về Temporal, 1 mục về service mesh.
- [ ] Bài viết 3 phần trên Viblo (hoặc blog cá nhân) đã đăng; slide 20 phút; talk đã trình bày cho ít nhất 2 người và có ghi lại 5 phản biện cùng câu trả lời.
- [ ] `docs/proposal.md` 2 trang cho khách hàng giả định, có 3 phương án chi phí và timeline.
- [ ] README repo là trang portfolio: bài toán, NFR, kiến trúc (1 hình), số đo chính, link tới SAD, ADR, report, attack log, postmortem.
- [ ] Retrospective toàn dự án 1 trang; dòng giai đoạn 5 ở tab chính đổi sang Hoàn thành.

## 2. Lịch 5 tuần theo buổi

20 buổi, khoảng 45 giờ; tuần 20–21 viết SAD và threat model, tuần 22 chi phí và Well-Architected, tuần 23 thí nghiệm và đối chiếu, tuần 24 viết, nói và chốt. Viết SAD trước vì mọi việc sau đều bổ sung vào nó.

| Buổi | Tuần | Việc | Đầu ra |
| --- | --- | --- | --- |
| 1 | 20 | Đọc lại toàn bộ ADR, report, attack log, postmortem; lập mục lục SAD; viết arc42 mục 1–3 (mục tiêu, ràng buộc, bối cảnh) | `docs/sad/01-03.md` |
| 2 | 20 | Mục 4–5: chiến lược giải pháp, building blocks từ C4 Container và Component | `04-05.md` + hình |
| 3 | 20 | Mục 6–7: runtime view cho 4 đường saga và failover Redis; deployment view từ kind, phác thảo cho AWS | `06-07.md` |
| 4 | 20 | Mục 8–9: cross-cutting concepts (nhất quán, idempotency, security, observability, cấu hình) và chỉ mục ADR | `08-09.md` |
| 5 | 21 | Mục 10–12: quality scenarios, rủi ro và nợ kỹ thuật, thuật ngữ | `10-12.md`; SAD bản 1 |
| 6 | 21 | Threat model đầy đủ: DFD mức 1 và 2 trên kiến trúc cuối (Threat Dragon), STRIDE theo phần tử | `threat-model-v1.md` bản nháp |
| 7 | 21 | Risk register: mọi rủi ro chấp nhận từ giai đoạn 0–4 gom lại, cho điểm, gán chủ và hạn; checklist ASVS mức 2 | Risk register |
| 8 | 21 | Viết mục Security của SAD; đối chiếu với OWASP API Top 10; rà lại attack log 1–4 thành bảng "đã chứng minh" | SAD bản 2 |
| 9 | 22 | Hồ sơ tải và giả định chi phí; phương án A (EKS) trên Pricing Calculator | Bảng chi phí A |
| 10 | 22 | Phương án B (ECS Fargate) và C (serverless); ghi phần phải thiết kế lại ở C | Bảng chi phí B, C |
| 11 | 22 | TCO 1 năm gồm công vận hành; độ nhạy; chi phí mỗi đợt; ADR-008 | ADR-008 Accepted |
| 12 | 22 | Well-Architected review 6 trụ cột | `well-architected.md` |
| 13 | 23 | GraalVM native cho payment-service: build, sửa reachability metadata, `nativeTest` | Image native chạy được |
| 14 | 23 | Đo JVM+AOT so với native; kết luận; cập nhật SAD mục 8 và 11 | Bảng so sánh |
| 15 | 23 | Đọc và đối chiếu với Tiki, Shopee/Grab, Netflix/Uber theo mẫu mục 8 | `comparison.md` |
| 16 | 23 | Đọc Temporal và service mesh (Istio hoặc Linkerd) ở mức concept; cập nhật ADR-007 với ghi chú; viết mục đối chiếu | `comparison.md` hoàn chỉnh |
| 17 | 24 | Viết bài phần 1–2 | Bản nháp |
| 18 | 24 | Bài phần 3; slide 20 phút; tự ghi hình và xem lại 1 lần | Slide + video nháp |
| 19 | 24 | Trình bày cho 2–3 người; thu phản biện; viết proposal 2 trang từ phản biện đó | 5 phản biện + `proposal.md` |
| 20 | 24 | README portfolio, retrospective, rà Definition of Done, tag | Tag `v5-sa` |

Nếu chỉ còn 3 tuần, giữ buổi 1–5, 9–11, 17–19; bỏ GraalVM và Well-Architected trước, vì SAD, chi phí và bài trình bày là ba thứ tuyển dụng SA sẽ hỏi.

## 3. Solution Architecture Document theo arc42

SAD là bản tổng hợp, không phải bản viết mới: mỗi mục arc42 chỉ ra artefact nào từ giai đoạn 0–4 được kéo vào, và mục nào cần viết thêm thật sự chỉ có 4 (chiến lược, runtime view, quality scenarios, rủi ro).

**3.1. 12 mục arc42 và nguồn**

| Mục | Nội dung cho FlashSale | Nguồn có sẵn | Viết thêm |
| --- | --- | --- | --- |
| 1. Introduction and Goals | Bài toán flash sale, 5 NFR hàng đầu, stakeholder (khách, admin, vận hành, kinh doanh) | `requirements.md` giai đoạn 0 | Bảng stakeholder và mối quan tâm |
| 2. Constraints | Kỹ thuật (Java 25, Spring Boot 4, Kafka), tổ chức (1 người, 8–10 giờ/tuần), quy ước (ADR, C4, tag) | ADR-001, 002 | Ít |
| 3. Context and Scope | Business context và technical context từ C4 Context; giao diện ngoài: Keycloak, gateway, observability | `workspace.dsl` | Bảng giao diện ngoài với giao thức |
| 4. Solution Strategy | 6 quyết định nền: modular monolith rồi tách có tiêu chí; Redis là cổng, PostgreSQL là sự thật; outbox + idempotent consumer; saga choreography; SLO-driven ops; supply chain có chữ ký | ADR-001…008 | Viết mới, 1 trang, mỗi quyết định 3 câu |
| 5. Building Block View | Mức 1: 3 deployable + data (C4 Container); mức 2: module trong core và order-service (Modulith `Documenter`); mức 3: chỉ `order` (state machine) | C4, Modulith docs | Mô tả trách nhiệm và giao diện mỗi block |
| 6. Runtime View | 4 đường saga (giai đoạn 3 mục 10.2), Redis failover (giai đoạn 4 mục 7.2), rolling update, replay từ DLT | Bảng bước saga, chaos results | Vẽ sequence bằng PlantUML cho 3 kịch bản quan trọng nhất |
| 7. Deployment View | kind hiện tại (C4 Deployment) và phương án AWS được khuyến nghị ở ADR-008 | C4 Deployment, `tco-1y` | Hình AWS phác thảo |
| 8. Cross-cutting Concepts | Nhất quán Redis–PostgreSQL, idempotency (HTTP và event), state machine, security (authn/authz, secrets, supply chain), observability, cấu hình, xử lý lỗi (Problem Details), nhiều instance | Giai đoạn 1–4 | Gom và rút gọn, mỗi concept dưới 1 trang |
| 9. Architecture Decisions | Chỉ mục ADR-001…008 với 1 dòng tóm tắt và trạng thái | `docs/adr` | Bảng |
| 10. Quality Requirements | Cây chất lượng và scenario (mục 3.3) | NFR, report, chaos | Viết mới |
| 11. Risks and Technical Debt | Risk register (mục 4.3) và nợ kỹ thuật: L1 cache lệch, chưa có WAF, secret không mã hóa at rest trên kind, Connect REST không auth, `notification` chưa tách | Rủi ro chấp nhận giai đoạn 0–4 | Gom, cho điểm |
| 12. Glossary | Đợt, token hàng chờ, outbox, saga, reserved/paid, drift, error budget | — | Viết mới, 1 trang |

**3.2. Quy tắc viết**

- Mỗi mục bắt đầu bằng một câu kết luận; người đọc dừng ở câu đó vẫn hiểu ý chính.
- Mọi con số có nguồn (link tới report, test, chaos log); không có số "khoảng" mà không nói vì sao khoảng.
- Hình từ code (Structurizr, Modulith, PlantUML) commit cạnh tài liệu; không dán ảnh vẽ tay.
- Viết cho ba người đọc: CTO (mục 1, 4, 7, 10, 11), kỹ sư mới (mục 5, 6, 8), người review bảo mật (mục 8 security và threat model).
- Dưới 40 trang; dài hơn thì cắt mục 8, không cắt mục 10 và 11.

**3.3. Quality scenarios (arc42 mục 10, mẫu Bass: nguồn → kích thích → môi trường → phản ứng → thước đo)**

| # | Thuộc tính | Scenario | Thước đo | Bằng chứng |
| --- | --- | --- | --- | --- |
| Q1 | Performance | 10.000 người bấm mua trong 60 giây, đợt đang mở | p99 đặt hàng < 300 ms, p99 đọc đợt < 100 ms | `docs/perf/report.md` mốc v2 và v3 |
| Q2 | Correctness | Cùng scenario Q1 | 0 oversell, 0 double-charge | `verify-no-oversell` sau mỗi k6 |
| Q3 | Availability | payment-service chết 2 phút giữa đợt | 0 đơn mất; 100% về trạng thái cuối trong 60 giây sau khi bật lại | Chaos giai đoạn 3 kịch bản 1 |
| Q4 | Availability | Redis master chết giữa đợt | Dưới 10 giây có 503; không oversell; không alert page | Chaos giai đoạn 4 kịch bản 2 |
| Q5 | Security | Kẻ tấn công gửi lại token hàng chờ hoặc webhook cũ | Bị từ chối 100%; không tác dụng phụ | Attack log 2 và 3 |
| Q6 | Modifiability | Thêm cổng thanh toán thứ hai | Chỉ payment-service thay đổi; dưới 2 ngày công; không đổi contract event | Ranh giới ADR-006; đánh giá trên giấy |
| Q7 | Operability | Alert page bắn khi SLI thủng | Từ alert tới phục hồi dưới 15 phút theo runbook | Sự cố giả lập giai đoạn 4 |
| Q8 | Deployability | Commit lên main | Thành pod trên cụm trong dưới 15 phút, không 5xx khi rolling update | Pipeline giai đoạn 4 |
| Q9 | Cost | Một đợt 10.000 người | Dưới 5 USD hạ tầng (NFR-08) | `tco-1y` mục 5.4 |
| Q10 | Scalability | Tải tăng gấp đôi (20.000 người) | HPA lên tối đa 6 pod; p99 tăng nhưng không thủng SLO khả dụng | k6 trên kind giai đoạn 4 buổi 12 |

Scenario nào không có bằng chứng thì ghi "chưa kiểm chứng" chứ không bỏ; danh sách "chưa kiểm chứng" chính là backlog của mục 11.

## 4. Threat model đầy đủ và risk register

Threat model v1 làm trên kiến trúc cuối (3 deployable trên Kubernetes) và có hai thứ v0 không có: DFD hai mức để thấy luồng dữ liệu bên trong mỗi service, và risk register nơi mọi rủi ro chấp nhận suốt 5 giai đoạn có chủ, hạn và điều kiện xem lại.

**4.1. DFD**

| Mức | Phạm vi | Phần tử chính | Ranh giới tin cậy |
| --- | --- | --- | --- |
| 0 | Hệ thống với bên ngoài | Customer, Admin, Keycloak, gateway, observability, FlashSale | Internet ↔ ingress; FlashSale ↔ đối tác |
| 1 | Bên trong cụm | ingress, 3 service, gateway mock, Kafka, Connect, PostgreSQL ×3, Redis Sentinel, Keycloak, Apicurio, OTel Collector, Argo CD, Kyverno | Namespace `flashsale` ↔ `data` ↔ `observability` ↔ `argocd`; NetworkPolicy là đường vẽ |
| 2 (chỉ cho order-service) | Bên trong order-service | Filter idempotency, rate limit, JWT, controller, Lua client, outbox writer, expiry job, saga consumer | Request ↔ process; process ↔ Redis/DB/Kafka |

Vẽ trong Threat Dragon, lưu `.json` cạnh Markdown; STRIDE theo phần tử như v0 nhưng đủ 3 mức; mỗi phần tử có ít nhất một dòng "không có mối đe dọa đáng kể vì…" nếu đúng vậy.

**4.2. Những gì mới so với v0**

| Chủ đề | Mối đe dọa mới | Biện pháp đã có | Còn lại |
| --- | --- | --- | --- |
| Kubernetes control plane | Kubeconfig hoặc Argo CD admin bị lộ → deploy image đã ký nhưng độc hại (từ commit của kẻ tấn công) | RBAC, branch protection, CODEOWNERS, Kyverno chỉ nhận chữ ký từ workflow `main` | SSO cho Argo CD, 2 người review PR, runner riêng (SLSA 3) |
| Kafka Connect | REST API của Connect không xác thực trong cụm | NetworkPolicy chỉ cho Strimzi operator | Basic auth cho Connect REST |
| Replication | Dữ liệu Redis và PostgreSQL replicate không mã hóa | NetworkPolicy | TLS trong cụm (mesh hoặc cấu hình từng thành phần) |
| Observability | Trace/log chứa `orderId`, `sub` băm; Grafana không SSO | Mask, port-forward | Grafana SSO và RBAC theo team |
| Secrets at rest | etcd trên kind không mã hóa | Không | KMS trên cloud (ghi trong ADR-008) |
| Supply chain | Base image và dependency bị cài mã độc trước khi vào CI | Renovate + Trivy + pin digest; SBOM attest | Scorecard cho dependency chính, review dependency mới bằng tay |
| Business logic | Admin tạo đợt với giá 0 hoặc số lượng âm; admin hủy đơn hàng loạt | Validation, audit log | Quy trình 4 mắt cho admin (ngoài phạm vi kỹ thuật; ghi cho khách hàng) |

**4.3. Risk register (`docs/security/risk-register.md`)**

| ID | Rủi ro | Khả năng (1–5) | Tác động (1–5) | Điểm | Biện pháp hiện có | Chủ | Hạn / điều kiện xem lại | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Bot dùng nhiều tài khoản thật để mua gom | 4 | 3 | 12 | Token 1/user, rate limit IP, chỗ cắm challenge | Bạn | Khi có người dùng thật: bật Turnstile | Chấp nhận |
| R2 | Không có WAF/DDoS tầng mạng | 3 | 4 | 12 | Rate limit ứng dụng | Bạn | Khi lên cloud: AWS WAF + Shield Standard (ADR-008) | Chấp nhận |
| R3 | Redis Sentinel mất vài lệnh khi failover | 2 | 3 | 6 | `min-replicas-to-write`, job đối chiếu, `CHECK >= 0` | Bạn | Xem lại sau chaos kịch bản 2 | Giảm thiểu |
| R4 | Secret không mã hóa at rest | 2 | 4 | 8 | NetworkPolicy, RBAC | Bạn | Cloud: KMS | Chấp nhận (dev) |
| R5 | GitHub Actions bị chiếm | 1 | 5 | 5 | OIDC keyless, Kyverno subject cố định | Bạn | SLSA 3 khi có team | Chấp nhận |
| R6 | Không phát hiện gian lận theo hành vi | 3 | 2 | 6 | Giới hạn số lượng | Bạn | Ngoài phạm vi; ghi cho khách hàng | Chấp nhận |
| R7 | PII trong log/trace | 2 | 3 | 6 | Mask, băm `sub` | Bạn | Rà lại khi thêm field | Giảm thiểu |

Quy tắc: điểm ≥ 12 phải có hành động cụ thể hoặc chữ ký chấp nhận (trong dự án là một dòng ADR); mọi rủi ro có ngày xem lại.

**4.4. Kiểm tra lại ASVS mức 2**

- Dùng checklist ASVS (bản mới nhất tại thời điểm làm) lọc mức L2; tự đánh giá Đạt / Không đạt / Không áp dụng cho từng yêu cầu, ghi bằng chứng (test, config, attack log).
- Kỳ vọng: các chương Authentication, Session, Access Control, Validation, Error Handling, API đạt phần lớn; các chương về quy trình (V1 Architecture đầy đủ, quản lý cấu hình bảo mật tổ chức) có mục không đạt vì dự án một người; ghi tỷ lệ và danh sách chưa đạt vào SAD mục 11.
- Đối chiếu thêm OWASP API Security Top 10: mỗi mục một dòng "đã xử lý ở đâu" hoặc "không áp dụng".

**4.5. Mục Security trong SAD (arc42 mục 8)**

Gồm: mô hình tin cậy (3 ranh giới), authn/authz (OIDC, role, ownership), bảo vệ dữ liệu (mask, băm, TLS ở đâu có và chưa có), bảo vệ hạ tầng (NetworkPolicy, PSS, RBAC, Kyverno), supply chain (SBOM, chữ ký, level SLSA), vận hành (xoay secret, runbook), và bảng "đã chứng minh bằng tấn công" gom từ attack log 1–4 (khoảng 26 kịch bản).

## 5. Ước lượng chi phí và ADR-008

Chi phí tính cho 1 năm trên AWS vùng ap-southeast-1 (Singapore, gần Việt Nam nhất), cho 3 phương án cùng một hồ sơ tải; con số cuối lấy từ AWS Pricing Calculator (mỗi dòng có link cấu hình), còn phần dưới đây là phương pháp, giả định và các bẫy chi phí phải nhớ.

**5.1. Hồ sơ tải (giữ nguyên từ giai đoạn 0, thêm phần ngoài giờ cao điểm)**

| Giả định | Giá trị |
| --- | --- |
| Đợt mỗi ngày | 20 đợt × 10 phút = 200 phút cao điểm/ngày, khoảng 14% thời gian |
| Tải cao điểm | 2.500 request/giây, 750 request đồng thời; 4 vCPU cho order-service (HPA 2–6 pod × 0,5–1 vCPU) |
| Tải nền (86% thời gian) | 20 request/giây (xem sản phẩm, xem đơn); 1 pod mỗi service |
| Dữ liệu | PostgreSQL 20 GB/năm (3 DB), Redis dưới 1 GB, Kafka 2,5 GB retention 7 ngày |
| Băng thông ra Internet | 240 MB/đợt × 20 × 30 = 144 GB/tháng |
| Log, metric, trace | 5 GB log/ngày ở cao điểm, 30 ngày; trace sampling 10% |
| Nhân sự vận hành | 4 giờ/tuần (một người, ngoài giờ) tính theo mức 25 USD/giờ để có TCO thật |

**5.2. Ba phương án**

| Thành phần | A: EKS | B: ECS Fargate | C: Serverless |
| --- | --- | --- | --- |
| Compute | EKS control plane + 3 node m6g.large (Graviton) hoặc 2 node + Karpenter; HPA/KEDA như kind | 3 service = 3 task definition; scale task theo CPU và theo SQS/lag (Application Auto Scaling); không control plane | order-service và core thành Lambda (Java 25, SnapStart), API Gateway HTTP; payment-service giữ Fargate (webhook + breaker) |
| PostgreSQL | RDS for PostgreSQL db.t4g.medium ×1 instance chứa 3 database (tách instance khi cần), Multi-AZ | Như A | Aurora Serverless v2 (0,5–4 ACU) |
| Redis | ElastiCache for Redis cache.t4g.small, 1 primary + 1 replica, Multi-AZ | Như A | ElastiCache Serverless |
| Messaging | MSK provisioned 2 broker kafka.t3.small (tối thiểu để có replication), hoặc MSK Serverless | Như A | Thay Kafka bằng EventBridge + SQS FIFO (theo `orderId` làm group); outbox qua DynamoDB Streams hoặc giữ RDS + poller Lambda |
| Debezium | MSK Connect hoặc tự chạy Connect trên EKS | MSK Connect | Không có (thiết kế lại outbox) |
| Ingress | ALB + Ingress Controller, ACM cert | ALB | API Gateway |
| Keycloak | Pod trên EKS (hoặc Amazon Cognito thay thế) | Fargate task | Cognito |
| Observability | AMP + AMG + X-Ray/ADOT, hoặc Grafana Cloud free tier | Như A | CloudWatch + X-Ray |
| Mạng | VPC 2 AZ, 1 NAT Gateway (không 2 để tiết kiệm, ghi rủi ro) | Như A | Như A, ít egress hơn |
| Secrets | Secrets Manager + KMS | Như A | Như A |
| CI/CD | GitHub Actions (miễn phí cho public repo), ECR, Argo CD trên EKS | GitHub Actions + ECR, deploy bằng `aws ecs update-service` hoặc CodeDeploy | GitHub Actions + SAM/CDK |

**5.3. Điểm neo giá để tự kiểm tra (xấp xỉ theo giá công khai us-east-1 On-Demand; ap-southeast-1 thường cao hơn 10–20%; phải thay bằng số từ Calculator)**

| Hạng mục | Xấp xỉ mỗi tháng | Ghi chú |
| --- | --- | --- |
| EKS control plane | ≈ 73 USD (0,10 USD/giờ) | Chỉ có ở phương án A; là lý do A đắt hơn B ở quy mô nhỏ |
| NAT Gateway | ≈ 32 USD + ≈ 0,045 USD/GB xử lý | Bẫy phổ biến nhất: pull image, gọi API AWS đều đi qua NAT; dùng VPC endpoint cho ECR, S3, Secrets Manager để giảm |
| ALB | ≈ 16–20 USD + LCU theo tải | Có ở A và B |
| RDS db.t4g.medium Single-AZ | ≈ 50 USD | Multi-AZ gấp đôi; storage gp3 tính riêng |
| ElastiCache cache.t4g.small | ≈ 25 USD mỗi node | 2 node cho HA |
| MSK Serverless | ≈ 0,75 USD/cluster-giờ ≈ 550 USD | Đắt bất ngờ ở quy mô nhỏ |
| MSK provisioned kafka.t3.small | ≈ 33 USD mỗi broker + storage | 2 broker tối thiểu; rẻ hơn Serverless nhiều ở tải này |
| Data transfer ra Internet | ≈ 0,09–0,12 USD/GB sau 100 GB miễn phí | 144 GB/tháng → vài USD |
| Fargate | ≈ 0,04 USD/vCPU-giờ + ≈ 0,004 USD/GB-giờ (x86); Graviton rẻ hơn ≈ 20% | Chỉ trả khi task chạy; scale về 1 task ngoài giờ |
| Lambda | Miễn phí 1 triệu request và 400.000 GB-giây/tháng; sau đó theo GB-giây | Java cần SnapStart để tránh cold start; 16.000 request đặt hàng/đợt × 600 đợt/tháng ≈ 10 triệu request/tháng |

Giá thay đổi thường xuyên; bảng này chỉ để phát hiện khi Calculator cho số vô lý (ví dụ quên tắt Multi-AZ hoặc chọn nhầm MSK Serverless).

**5.4. Bảng TCO 1 năm (`docs/cost/tco-1y.md`, điền từ Calculator)**

| Hạng mục | A: EKS | B: Fargate | C: Serverless | Ghi chú |
| --- | --- | --- | --- | --- |
| Compute (cao điểm + nền) |  |  |  | A có control plane; B tính theo task-giờ; C theo request và GB-giây |
| PostgreSQL |  |  |  | Multi-AZ hay không: hai dòng |
| Redis |  |  |  |  |
| Messaging |  |  |  | A, B: MSK provisioned; C: EventBridge + SQS |
| Ingress và mạng (ALB/API GW, NAT, transfer) |  |  |  |  |
| Observability |  |  |  | So AMP/AMG với Grafana Cloud free |
| Secrets, KMS, ECR |  |  |  | Nhỏ |
| Hạ tầng/năm (On-Demand) |  |  |  |  |
| Hạ tầng/năm với Savings Plans 1 năm cho compute và RDS Reserved |  |  |  | Kỳ vọng giảm 30–40% phần compute và DB |
| Công vận hành/năm (4 giờ/tuần × 52 × 25 USD) | 5.200 | 5.200 | 5.200 | A thực tế nhiều hơn (nâng cấp cụm, operator) → dùng 6 giờ/tuần cho A |
| Công chuyển đổi một lần | 0 (đã có Helm) | 40 giờ (task definition, autoscaling) | 200 giờ (thiết kế lại outbox, saga, Lambda) | Nhân 25 USD/giờ |
| **TCO năm 1** |  |  |  |  |
| **TCO năm 2** (không có chuyển đổi) |  |  |  |  |
| Chi phí mỗi đợt (hạ tầng/năm ÷ 7.300 đợt) |  |  |  | So với NFR-08 < 5 USD |

**5.5. Độ nhạy (mỗi dòng đổi một giả định, giữ phần còn lại)**

| Giả định đổi | Ảnh hưởng kỳ vọng | Phương án bị ảnh hưởng nhất |
| --- | --- | --- |
| Đợt/ngày × 2 (40 đợt) | Compute cao điểm × 2; B và C tăng gần tuyến tính, A tăng ít vì node đã có | A lợi thế dần |
| Multi-AZ cho RDS và Redis | + ≈ 75–100 USD/tháng | Cả ba |
| Savings Plans 1 năm | − 30–40% compute A và B | A, B |
| MSK Serverless thay provisioned | + ≈ 450 USD/tháng | A, B (không có ở C) |
| Thêm 2 team và 6 service | A trở nên hợp lý (chuẩn hóa, operator); B tăng số task definition; C tăng độ phức tạp saga | A |

**5.6. ADR-008: Phương án hạ tầng cho FlashSale**

- Giả thuyết trước khi tính (ghi lại để kiểm chứng, không phải kết luận): với hồ sơ tải 14% cao điểm và một người vận hành, B (ECS Fargate + MSK provisioned nhỏ) rẻ nhất về TCO năm 1 và năm 2; A chỉ hợp lý khi ≥ 3 team hoặc cần operator (Strimzi, CloudNativePG) như đã học; C rẻ về hạ tầng nếu tải nền gần 0 nhưng công thiết kế lại và rủi ro saga trên SQS/EventBridge lớn hơn tiết kiệm.
- Tiêu chí quyết định theo thứ tự: tính đúng đắn giữ nguyên (không đổi outbox/saga), TCO 2 năm, công vận hành, khả năng mở rộng khi có team.
- Quyết định: điền sau buổi 11 từ bảng 5.4; ghi kèm "điều kiện đổi phương án" (ví dụ: chuyển sang A khi số service > 6 hoặc có team platform; xem xét C cho `notification` khi tách).
- Hệ quả: nếu chọn B, Helm chart giai đoạn 4 không dùng trực tiếp; giữ kind làm môi trường dev và viết task definition từ cùng image; ghi là nợ kỹ thuật "hai cách deploy".
- Cách xác nhận: chạy Calculator lại sau 6 tháng; nếu lệch trên 20% so với ước lượng, cập nhật ADR.

## 6. Well-Architected review

Tự đánh giá theo 6 trụ cột của AWS Well-Architected Framework với bằng chứng từ giai đoạn 0–4; mục đích không phải "đạt" mà là nói được bằng ngôn ngữ khách hàng cloud dùng và thừa nhận khoảng trống trước khi họ hỏi.

| Trụ cột | Câu hỏi tiêu biểu của framework | Bằng chứng đã có | Khoảng trống | Hành động (ghi vào backlog mục 11) |
| --- | --- | --- | --- | --- |
| Operational Excellence | Có runbook, postmortem, deploy tự động, quan sát được không? | 4 runbook, postmortem-001, GitOps, dashboard SLO | Chưa có game day định kỳ; một người trực | Lịch chaos hàng quý; on-call luân phiên khi có team |
| Security | Identity, phát hiện, bảo vệ hạ tầng và dữ liệu, ứng phó sự cố? | OIDC, RBAC, NetworkPolicy, PSS, cosign + Kyverno, threat model, attack log | Secret at rest, WAF, SSO cho công cụ vận hành, không có SIEM | KMS, AWS WAF, Grafana/Argo SSO, gửi audit log ra ngoài cụm |
| Reliability | Tự phục hồi, giới hạn được tải, kiểm chứng bằng chaos? | Sentinel, PDB, HPA/KEDA, breaker, outbox, 10 kịch bản chaos | Một AZ (kind), backup DB chưa có, NAT đơn | Multi-AZ trên cloud, backup CloudNativePG/RDS có test restore, DR trên giấy |
| Performance Efficiency | Chọn đúng loại tài nguyên, đo và tối ưu liên tục? | Report 5 mốc, JMH, virtual threads, Graviton trong TCO | Chưa đo trên cloud thật; cache stampede chỉ test local | Đo lại sau khi lên cloud; benchmark định kỳ trong CI (kịch bản ngắn) |
| Cost Optimization | Biết chi phí theo đơn vị, có tắt tài nguyên thừa, có commitment? | TCO 3 phương án, chi phí mỗi đợt, độ nhạy | Chưa có tagging và budget alert thật | Tag theo service, AWS Budgets, review hàng tháng |
| Sustainability | Dùng tài nguyên vừa đủ, scale về 0 khi rảnh, kiến trúc hiệu quả? | Scale về 1 pod ngoài giờ, Graviton, AOT giảm CPU khởi động | Kafka và DB chạy 24/7 cho 14% thời gian có tải | Cân nhắc C cho phần rảnh; retention log ngắn hơn |

**Cách làm buổi 12**

1. Mở bộ câu hỏi Well-Architected (AWS Well-Architected Tool có bản miễn phí trong console, hoặc bản PDF của framework); chọn 3–4 câu mỗi trụ cột sát với FlashSale.
2. Trả lời bằng bằng chứng có link; không trả lời "có" nếu không chỉ ra được file hoặc số.
3. Đánh giá mức rủi ro High/Medium theo cách của framework; mọi High phải xuất hiện ở risk register mục 4.3.
4. Ghi "3 điều sẽ làm khác nếu làm lại" ở cuối; đây là phần người phỏng vấn SA hay hỏi nhất.

## 7. Thí nghiệm GraalVM native cho payment-service

payment-service là ứng viên đúng cho native image (tải thấp, cần khởi động nhanh và ít RAM khi scale về 0 trên Fargate hoặc Lambda), còn order-service thì không (cần JIT ở đỉnh tải); thí nghiệm đo cả hai nhận định đó thay vì tin theo blog.

**7.1. Cách làm (buổi 13)**

1. GraalVM for JDK 25 (bản Community đủ dùng) trong stage build của Dockerfile riêng `Dockerfile.native`; plugin Gradle `org.graalvm.buildtools.native`; Spring Boot 4 AOT processing chạy tự động trong `nativeCompile`.
2. Chạy `./gradlew :payment-service:nativeCompile`; lỗi đầu tiên gần như chắc chắn là thiếu reachability metadata cho một thư viện (Lettuce, Kafka client, Resilience4j, thư viện CloudEvents); dùng GraalVM Reachability Metadata Repository trước, thiếu thì thêm `RuntimeHintsRegistrar` cho reflection/proxy/resource.
3. Chạy `nativeTest` để bảo đảm test component chạy trên native (một số test dùng Mockito cần cấu hình thêm hoặc bỏ khỏi native).
4. Image từ `scratch` hoặc distroless `static` + binary; kích thước kỳ vọng 80–120 MB.
5. Deploy lên kind thay thế image JVM của payment-service; chạy đủ 4 đường saga và chaos kịch bản gateway lỗi (breaker) để chắc hành vi không đổi.

**7.2. Số đo (buổi 14, mỗi số đo 3 lần, cùng resource limit)**

| Chỉ số | JVM + AOT cache (giai đoạn 4) | Native | Cách đo |
| --- | --- | --- | --- |
| Startup tới Ready |  |  | Log `Started ... in`, probe Ready trong Kubernetes |
| RSS sau 5 phút tải nền |  |  | `kubectl top pod`, `docker stats` |
| p99 xử lý `payment.requested` khi warm |  |  | Metric listener duration sau 5 phút |
| p99 trong 60 giây đầu sau khởi động |  |  | Cùng metric, cửa sổ đầu |
| Throughput tối đa của consumer |  |  | Bơm 10.000 event, đo thời gian xử lý hết |
| Thời gian build |  |  | CI |
| Kích thước image |  |  | `docker images` |
| CVE trong image |  |  | Trivy |

Kỳ vọng để đối chiếu: native khởi động dưới 0,3 giây và RSS thấp hơn 50–70%, nhưng throughput đỉnh thấp hơn JVM đã warm (không có JIT profile-guided), và build lâu gấp 5–10 lần; nếu số đo khác, ghi đúng như đo.

**7.3. Kết luận cần viết (SAD mục 8 và 11)**

- Dùng native cho service nào, điều kiện nào (scale về 0, cold start Lambda, cost per GB-giây); không dùng cho đường nóng.
- Chi phí bảo trì: mỗi thư viện mới phải kiểm tra metadata; test phải chạy trên native; build chậm → tách pipeline native chạy nightly.
- Nếu ADR-008 chọn C cho một phần, native là điều kiện để Lambda Java có cold start chấp nhận được (so với SnapStart, ghi cả hai).

## 8. Đối chiếu với hệ thống thật và các lựa chọn không dùng

Mục đích của hai buổi đọc này là biết thiết kế của mình nằm ở đâu so với hệ thống có hàng triệu người dùng và so với các công cụ đã cân nhắc rồi bỏ; kết quả là `docs/comparison.md`, viết theo mẫu để không rơi vào tóm tắt bài của người khác.

**8.1. Mẫu cho mỗi hệ thống đối chiếu**

| Mục | Nội dung ghi |
| --- | --- |
| Bài đã đọc | Link, ngày, tác giả; ghi rõ bài mô tả hệ thống ở thời điểm nào |
| Bài toán của họ | Quy mô, ràng buộc khác gì FlashSale (số SKU, số đợt, đa vùng, đội ngũ) |
| Cách họ giải một bài giống mình | Chọn đúng một bài: trừ kho, chống bot, saga, cache, tách service |
| Điểm giống | Tối đa 3 |
| Điểm khác và lý do | Tối đa 3, mỗi điểm ghi "vì họ có ràng buộc X mà mình không có" hoặc ngược lại |
| Điều mình sẽ mượn | 0–2 việc cụ thể đưa vào backlog, kèm điều kiện áp dụng |

**8.2. Danh sách đọc (buổi 15)**

| Nguồn | Bài toán đối chiếu | Câu hỏi khi đọc |
| --- | --- | --- |
| Tiki Engineering (bài về tồn kho, binlog MySQL, microservices; blog ngừng cập nhật từ 2022 nên đọc như case study lịch sử) | Trừ kho và CDC | Họ đặt "nguồn sự thật" ở đâu; dùng CDC cho việc gì; có tầng Redis làm cổng không |
| Grab Engineering (các bài về microservices ở quy mô lớn, rate limiting, Kafka) | Tách service, chống lạm dụng | Tiêu chí tách của họ; rate limit đặt ở gateway hay service |
| Shopee (bài công khai hiếm; dùng bài phân tích flash sale của cộng đồng, ByteByteGo, Viblo System Design VN) | Flash sale, hàng chờ | Họ tách "lấy suất" và "thanh toán" thế nào; hàng chờ ở client hay server |
| Netflix Tech Blog (resilience, chaos, Hystrix → Resilience4j lineage) | Breaker, chaos | Vì sao họ chuyển từ thư viện sang mesh/adaptive concurrency |
| Uber Engineering (bài về tính nhất quán, idempotency, saga trong thanh toán) | Idempotency và saga tiền | Họ xử lý "đã trừ tiền mà không có kết quả" ra sao |
| ZaloPay Engineering (consensus, chaos, chuyển sang Kubernetes; ngừng cập nhật từ 2023) | Chaos, K8s migration ở Việt Nam | Họ gặp gì khi chuyển; có giống sự cố giả lập của mình không |

Đầu ra: 3 điểm khác biệt lớn nhất của FlashSale so với ít nhất 2 hệ thống, mỗi điểm có lý do; ví dụ kỳ vọng: họ tách bước "lấy suất" thành một hệ riêng với hàng đợi, còn FlashSale gộp vào Lua vì quy mô 10.000 người không cần.

**8.3. Hai lựa chọn không dùng (buổi 16)**

| Lựa chọn | Đọc gì | Câu hỏi | Ghi vào đâu |
| --- | --- | --- | --- |
| Temporal (orchestration) | Temporal docs: Workflows, Activities, Signals; một bài so sánh saga choreography vs orchestration | Với 4 bước và 2 bù, Temporal thêm gì và bớt gì; ở bước thứ mấy thì nên đổi; chi phí vận hành Temporal server | Ghi chú vào ADR-007 (không đổi quyết định), mục 8.3 của `comparison.md` |
| Service mesh (Istio hoặc Linkerd) | Docs về mTLS, retry, traffic shifting; bài về chi phí sidecar và ambient mode | Mesh giải quyết TLS trong cụm (rủi ro R-replication) và canary; đổi lại là CPU và độ phức tạp; với 3 service có đáng không | Risk register (TLS trong cụm) và SAD mục 11 |

Kết luận cần đạt: biết nói "chưa dùng vì…" với điều kiện cụ thể, thay vì "không cần". Đây là câu trả lời SA cần có khi khách hàng hỏi "sao không dùng X".

## 9. Bài viết công khai và tech talk

Bài viết và talk không kể lại dự án theo thứ tự thời gian; mỗi bài trả lời một câu hỏi mà người đọc có thể mang về áp dụng, và mọi khẳng định đều có số từ report.

**9.1. Loạt bài trên Viblo (tiếng Việt; README repo tiếng Anh)**

| Phần | Tiêu đề gợi ý | Câu hỏi bài trả lời | Số liệu phải có | Dài |
| --- | --- | --- | --- | --- |
| 1 | Flash sale không oversell: Redis Lua, token hàng chờ và những gì PostgreSQL không nên làm | Trừ kho ở đâu và vì sao | p99 và số transaction DB trước/sau (mốc v1 → v2), số lần xung đột optimistic lock | 2.000–2.500 chữ |
| 2 | Từ modular monolith đến saga: tách gì, giữ gì, và cách không mất đơn khi service chết | Tiêu chí tách service và outbox + idempotent consumer | Kết quả chaos tắt payment-service; số event, lag phục hồi | 2.500 chữ |
| 3 | Từ commit đến pod có chữ ký: SLO, chaos và postmortem cho dự án một người | Vận hành production-grade khi chỉ có một người | 4 SLI, alert bắn sau bao lâu, postmortem tóm tắt | 2.000 chữ |

- Mỗi bài mở bằng vấn đề và một con số, kết bằng "làm lại thì tôi sẽ…" và link repo; hình lấy từ C4, flame graph diff, dashboard.
- Đăng cách nhau 1 tuần; bài 1 đăng ở buổi 17 dù chưa xong bài 3 để có phản hồi sớm.
- Trả lời mọi bình luận có nội dung kỹ thuật trong 48 giờ; gom câu hỏi hay vào mục Q&A của talk.

**9.2. Talk 20 phút (slide trong `docs/talk/`)**

| Phút | Nội dung | Slide |
| --- | --- | --- |
| 0–2 | Bài toán: 10.000 người, 500 sản phẩm, 60 giây; ba thứ không được sai | 1 |
| 2–4 | NFR bằng số và cách đo (một slide bảng NFR, một slide môi trường đo) | 2 |
| 4–10 | Kiến trúc tiến hóa qua 3 hình: modular monolith → Redis là cổng → 3 deployable với saga; mỗi hình một trade-off | 3 |
| 10–15 | Bằng chứng: bảng 5 mốc perf, một flame graph diff, một kết quả chaos, một alert bắn thật | 4 |
| 15–18 | Bài học và "làm lại sẽ khác": 3 điều | 1 |
| 18–20 | Q&A với 3 câu tự chuẩn bị nếu không ai hỏi | 1 |

- Tổng 12 slide, chữ ít, mỗi slide một ý; số liệu có đơn vị và điều kiện đo.
- Tập 3 lần có bấm giờ; lần 2 ghi hình và xem lại để cắt phần dài; lần 3 trước 1–2 người.
- Nơi trình bày theo thứ tự: nhóm nội bộ công ty, rồi meetup cộng đồng (Grokking Vietnam, Viblo, nhóm Java Việt Nam) khi có dịp.

**9.3. Thu phản biện**

- Mẫu 5 câu hỏi gửi người nghe: điều gì chưa thuyết phục; quyết định nào họ sẽ làm khác; số liệu nào họ nghi ngờ; phần nào nên bỏ; câu hỏi họ sẽ hỏi nếu là khách hàng.
- Ghi 5 phản biện đáng giá nhất và câu trả lời vào `docs/talk/feedback.md`; phản biện chưa trả lời được đưa vào backlog.

**9.4. Portfolio (README của repo)**

1. Một đoạn: bài toán và ba NFR quan trọng nhất.
2. Một hình: C4 Container hiện tại.
3. Bảng 6 con số: p99 place, throughput, oversell, thời gian phục hồi chaos, thời gian pipeline, chi phí mỗi đợt.
4. Link: SAD, ADR index, perf report, attack log 1–4, postmortem, bài viết, slide.
5. Cách chạy trong 3 lệnh (Compose) và cách dựng kind.
6. Giấy phép, trạng thái dự án, việc còn mở.

## 10. Kỹ năng SA mềm

Ba bài tập ở tuần 24 luyện đúng ba việc SA làm nhiều nhất mà Senior ít làm: viết proposal cho người quyết định ngân sách, trình bày kiến trúc cho người không kỹ thuật, và chịu review kiến trúc từ người khác.

**10.1. Proposal 2 trang (`docs/proposal.md`) cho khách hàng giả định**

Khách hàng giả định: một nhà bán lẻ Việt Nam đang chạy flash sale trên nền tảng hiện có, hay bị oversell và sập lúc mở đợt, muốn hệ thống riêng trong 4 tháng với ngân sách hạn chế.

| Mục | Nội dung | Giới hạn |
| --- | --- | --- |
| Bối cảnh và vấn đề | Mất uy tín vì oversell; sập 5 phút đầu; chi phí hạ tầng khó dự đoán | 3 câu, có số nếu khách cung cấp |
| Mục tiêu kinh doanh | Không bán quá hàng; 99,9% đơn đặt thành công trong đợt; chi phí mỗi đợt dưới X | Chuyển thẳng từ NFR sang ngôn ngữ kinh doanh |
| Phạm vi và ngoài phạm vi | Có: đặt hàng, thanh toán, tồn kho, vận hành; Không: catalog đầy đủ, vận chuyển, khuyến mãi | Rõ để tránh mở rộng |
| Kiến trúc đề xuất | Một hình C4 Container và 5 gạch đầu dòng "vì sao" | Không có từ Kafka, Lua, saga trong phần này; để chú thích |
| Ba phương án chi phí | A/B/C từ TCO, mỗi phương án: chi phí năm 1, năm 2, ưu, nhược, khuyến nghị | Bảng 1 |
| Timeline | 4 giai đoạn theo tag của dự án, mốc nghiệm thu = quality scenario | Bảng 2 |
| Rủi ro và giả định | 5 rủi ro từ risk register có ý nghĩa với khách; giả định về tải | Bảng 3 |
| Bước tiếp theo | Workshop 2 giờ để xác nhận NFR; PoC 2 tuần trên môi trường khách | 2 câu |

Viết xong, đọc lại bằng câu hỏi: một giám đốc kinh doanh đọc trang 1 có quyết định được không? Nếu cần đọc trang 2 mới hiểu, viết lại trang 1.

**10.2. Trình bày cho người không chuyên ("đi thang máy" theo Hohpe)**

- Chuẩn bị 3 phiên bản của cùng một ý "Redis là cổng, PostgreSQL là sự thật": cho kỹ sư (30 giây, có Lua và outbox), cho quản lý sản phẩm (30 giây: "kiểm tra hàng còn hay hết bằng bộ nhớ nhanh, ghi sổ bằng cơ sở dữ liệu chắc chắn"), cho giám đốc (15 giây: "không bao giờ bán quá hàng, kể cả khi 10.000 người bấm cùng lúc").
- Làm tương tự cho saga, SLO và chi phí; ghi cả 12 phiên bản vào `docs/talk/elevator.md`; đọc to, bấm giờ.
- Trong talk (mục 9.2), phần 0–4 phút dùng phiên bản giám đốc, phần 4–15 dùng phiên bản kỹ sư; đó là bài tập chuyển tầng.

**10.3. Mock architecture review**

- Nhờ 1–2 đồng nghiệp Senior hoặc người trong cộng đồng đóng vai reviewer với SAD trong tay, 45 phút; bạn trình bày 10 phút, còn lại trả lời.
- Chuẩn bị bằng cách tự đặt 10 câu hỏi khó nhất ("sao không dùng X", "chuyện gì xảy ra khi Y chết", "chi phí nếu tải × 10", "ai chịu trách nhiệm khi Z"); mỗi câu có câu trả lời 3 câu và link bằng chứng.
- Sau buổi: cập nhật SAD mục 11 với điều reviewer chỉ ra; ghi vào `feedback.md`. Nếu không tìm được reviewer, tự review sau 3 ngày với bộ câu hỏi ATAM rút gọn (quality attribute → scenario → sensitivity point → trade-off → risk).

**10.4. Ước lượng công (bài tập nhỏ, 1 giờ)**

- Ước lượng lại toàn dự án nếu làm cho khách hàng với đội 3 người full-time: chia theo epic, three-point estimate (lạc quan, thực tế, bi quan), cộng 20% cho vận hành và tài liệu.
- So với thời gian thật đã ghi trong nhật ký tiến độ (tab chính); ghi hệ số lệch và lý do; đây là dữ liệu cho proposal sau này.

## 11. Sau giai đoạn 5

Dự án kết thúc ở tag `v5-sa` nhưng portfolio còn dùng nhiều năm; mục này ghi việc để mở, lộ trình chứng chỉ song song, và cách dùng dự án khi phỏng vấn Senior hoặc SA.

**11.1. Backlog để mở (theo thứ tự đáng làm)**

| # | Việc | Vì sao đáng | Ước lượng |
| --- | --- | --- | --- |
| 1 | Tách `notification` thành service, gửi email/SMS thật qua nhà cung cấp (bên thứ ba là tiêu chí ADR-006) | Có ví dụ tách vì lý do đúng, và một cổng ngoài nữa cho breaker | 2 tuần |
| 2 | Triển khai phương án được chọn ở ADR-008 lên AWS thật với ngân sách trần (AWS Budgets) | Số chi phí thật thay cho ước lượng; Well-Architected Tool thật | 3 tuần, chi phí vài chục USD nếu tắt sau khi đo |
| 3 | Web UI tối giản với PKCE thật | Đóng dòng threat model về client và XSS | 1 tuần |
| 4 | Phát hiện gian lận theo hành vi đơn giản (điểm rủi ro theo tốc độ, thiết bị, lịch sử) | Đóng R1, R6 | 2 tuần |
| 5 | Backup PostgreSQL có test restore, DR trên giấy thành DR chạy thử | Trụ cột Reliability | 1 tuần |
| 6 | Chạy lại toàn bộ chaos như game day hàng quý; đo lại NFR trên Java LTS tiếp theo | Giữ dự án sống | 1 ngày mỗi quý |
| 7 | Thử Temporal cho saga trên nhánh riêng và so sánh bằng cùng 4 test end-to-end | Chuyển "chưa dùng vì" thành số | 2 tuần |

**11.2. Chứng chỉ (học song song, ngoài giờ dự án, theo báo cáo ở tab chính)**

| Thứ tự | Chứng chỉ | Khi nào | Dùng gì từ dự án |
| --- | --- | --- | --- |
| 1 | AWS Certified Solutions Architect – Associate (SAA-C03) | Đã lên kế hoạch ôn từ cuối giai đoạn 1; thi trước hoặc trong giai đoạn 2 | Mọi câu về HA, autoscaling, RDS, ElastiCache đối chiếu được với TCO và Well-Architected |
| 2 | CKAD (tùy chọn) | Sau giai đoạn 4 | Toàn bộ giai đoạn 4 là bài luyện |
| 3 | AWS Certified Solutions Architect – Professional (SAP-C02) hoặc AZ-305 / Google PCA tùy hệ sinh thái công ty | Trong hoặc ngay sau giai đoạn 5 | ADR-008, độ nhạy chi phí, DR trên giấy, migration là đúng dạng đề |
| 4 | iSAQB CPSA-F hoặc TOGAF tùy khách hàng | Khi nhắm thị trường châu Âu/Nhật hoặc ngân hàng | SAD arc42 chính là tài liệu iSAQB kỳ vọng |

**11.3. Dùng dự án khi phỏng vấn**

| Loại phỏng vấn | Câu hỏi thường gặp | Lấy từ dự án |
| --- | --- | --- |
| Senior: coding và concurrency | Race condition, idempotency, virtual threads | Test 100 thread, bảng Idempotency-Key, ADR-004 với số |
| Senior: system design | Thiết kế flash sale, rate limiter, thông báo | Trình bày đúng hình tiến hóa 3 bước, kèm số p99 và lý do bỏ optimistic lock |
| Senior: hành vi | Kể một sự cố, một quyết định sai, cách mentor | Postmortem-001, ADR bị superseded, attack log (tìm lỗi của chính mình) |
| SA: kiến trúc | Trade-off, khi nào không microservices, chi phí | ADR-006 (giữ inventory), ADR-007 (choreography có ngưỡng), TCO 3 phương án |
| SA: khách hàng | Trình bày cho người không kỹ thuật, xử lý "sao không dùng X" | Elevator versions, comparison.md, proposal |
| SA: bảo mật | Threat model, supply chain | Threat model v1, risk register, pipeline có chữ ký |

Mỗi câu trả lời theo cấu trúc: bối cảnh (1 câu) → quyết định và phương án bị loại (2 câu) → số liệu (1 câu) → điều sẽ làm khác (1 câu). Tập nói 12 câu chuyện này, mỗi câu dưới 90 giây.

**11.4. Retrospective toàn dự án (1 trang, buổi 20)**

- Giờ thật so với kế hoạch theo giai đoạn (từ nhật ký ở tab chính); giai đoạn nào lệch nhất và vì sao.
- 3 kỹ năng tiến bộ rõ nhất, có bằng chứng; 3 kỹ năng vẫn yếu và cách luyện tiếp.
- Quyết định nào ở giai đoạn 0–1 hóa ra sai hoặc thừa; quyết định nào tiết kiệm nhiều nhất về sau.
- Cập nhật checklist tự đánh giá Senior và SA ở báo cáo tổng (tab chính): mục nào đã tự tin đánh dấu, mục nào chưa.

## 12. Nguồn học cho giai đoạn 5 và quyết định cho các câu hỏi mở

Khoảng 12 giờ đọc; ba nguồn xương sống là arc42 (mẫu và ví dụ), *The Software Architect Elevator* (Hohpe) và AWS Well-Architected Framework, cộng chương pre-sales và SAD trong *Solutions Architect's Handbook* 3rd.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1–5 | arc42 template và arc42 by Example (Starke, Hruschka); docs.arc42.org FAQ | Từng mục làm gì, ví dụ thật | Template có; sách không |
| 5 | *Software Architecture in Practice* (Bass, Clements, Kazman) chương về quality attribute scenarios; *Fundamentals of Software Architecture* 2nd chương architecture characteristics | Mẫu scenario 6 phần | Không |
| 6–8 | *Threat Modeling: Designing for Security* (Shostack) chương về DFD nhiều mức và quản lý rủi ro; OWASP ASVS; OWASP API Security Top 10 | Risk register, đánh giá theo checklist | ASVS, API Top 10 có |
| 9–11 | AWS Pricing Calculator; AWS Well-Architected Cost Optimization pillar; tài liệu giá của EKS, ECS, Fargate, RDS, ElastiCache, MSK, Lambda, NAT Gateway | Tính đúng, tránh bẫy NAT và MSK Serverless | Có |
| 11 | *Solutions Architect's Handbook* 3rd: chương về cost, SAD, pre-sales và trình bày với C-level | Cấu trúc SAD và proposal | Không |
| 12 | AWS Well-Architected Framework (6 pillar whitepaper) và Well-Architected Tool | Bộ câu hỏi | Có |
| 13–14 | GraalVM docs: Native Image, Reachability Metadata; Spring Boot docs: GraalVM Native Images; bài của Spring team về AOT | Hints, nativeTest | Có |
| 15 | Các blog kỹ thuật ở mục 8.2 | Theo mẫu | Có |
| 16 | Temporal docs: Concepts; Istio hoặc Linkerd docs: Architecture; bài về sidecar so với ambient | Đủ để nói "chưa dùng vì" | Có |
| 17–18 | *The Software Architect Elevator* (Hohpe) phần về giao tiếp; hướng dẫn viết bài của Viblo | Chuyển tầng, cấu trúc bài | Sách không |
| 19 | *Solutions Architect's Handbook* chương proposal; mẫu RFP response công khai; ATAM rút gọn (SEI) | Proposal, review | ATAM có |

**Quyết định cho các câu hỏi mở** (chốt sẵn theo tiêu chí thực tế và học sâu; đổi được bằng cách sửa bảng này)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | SAD theo arc42 hay mẫu tự soạn? | **arc42** | Chuẩn được iSAQB và nhiều khách hàng châu Âu dùng; có ví dụ để so; tự soạn dễ thiếu mục 10 và 11 |
| 2 | Vùng AWS để tính chi phí | **ap-southeast-1**, ghi thêm us-east-1 làm mốc so sánh | Gần người dùng Việt Nam; thấy chênh giá vùng là bài học |
| 3 | Có tính công vận hành vào TCO không? | **Có**, ở mức 25 USD/giờ và số giờ khác nhau theo phương án | Không tính là bỏ sót phần lớn chi phí thật; đây là điểm SA hay bị hỏi |
| 4 | Ba database trên một RDS instance hay ba instance? | **Một instance, ba database** ở TCO cơ sở; dòng độ nhạy cho ba instance | Đúng cho quy mô này; ghi rõ mất cô lập tài nguyên, chuyển sang ba instance khi order-db chiếm > 60% CPU |
| 5 | Native cho service nào? | **Chỉ payment-service** trong thí nghiệm; quyết định áp dụng theo số đo | Đường nóng cần JIT; service rảnh cần startup và RAM |
| 6 | Viết bài tiếng Việt hay tiếng Anh? | **Bài tiếng Việt trên Viblo; README và SAD tiếng Anh** | Cộng đồng phản biện gần nhất là Việt Nam; portfolio cần đọc được bởi nhà tuyển dụng nước ngoài |
| 7 | Nơi trình bày talk | **Nội bộ trước, meetup sau** | Phản biện nội bộ rẻ và nhanh; meetup khi slide đã qua một vòng sửa |
| 8 | Khách hàng giả định cho proposal | **Nhà bán lẻ Việt Nam cỡ vừa, 4 tháng, ngân sách hạn chế** | Đủ ràng buộc để phải chọn phương án B/C thay vì "làm hết" |
| 9 | Có làm mock review nếu không tìm được reviewer? | **Có, tự review sau 3 ngày với ATAM rút gọn** | Kỹ năng chịu review quan trọng hơn người review cụ thể |
| 10 | Dừng ở v5-sa hay làm backlog ngay? | **Dừng, nghỉ 2 tuần, rồi chọn 1 việc ở mục 11.1** | Tránh dự án không bao giờ "xong"; portfolio cần một điểm kết |
