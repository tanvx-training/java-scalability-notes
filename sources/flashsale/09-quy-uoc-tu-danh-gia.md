# Quy ước làm việc và tự đánh giá — tài liệu chi tiết

Tab này là "luật chơi" cho 24 tuần: nhịp làm việc, cách dùng Git và ADR, chuẩn tài liệu, cách ghi nhật ký, và bảng tự đánh giá kỹ năng Senior/SA có trạng thái để cập nhật sau mỗi giai đoạn.

## 1. Nhịp làm việc hàng tuần

8–10 giờ mỗi tuần chia thành 2 buổi làm sâu, 1 khối đọc và 1 khối viết; buổi làm sâu không bị chia nhỏ dưới 2 giờ vì phần lớn việc trong dự án (profiling, chaos, buổi tấn công) cần thời gian liên tục.

| Khối | Thời lượng | Nội dung | Ghi chú |
| --- | --- | --- | --- |
| Buổi làm 1 | 2–2,5 giờ | Theo bảng lịch của tab giai đoạn | Tắt thông báo; mở đúng 3 cửa sổ: IDE, terminal, doc này |
| Buổi làm 2 | 2–2,5 giờ | Theo bảng lịch | Nếu buổi 1 chưa xong, buổi 2 tiếp tục, không nhảy cóc |
| Đọc | 1–1,5 giờ | Nguồn học của buổi tuần sau (mục "Nguồn học" mỗi tab) | Đọc trước khi làm, không đọc thay làm |
| Viết | 1 giờ | Nhật ký tuần (mục 6), cập nhật bảng theo dõi ở tab chính, ADR nếu có quyết định | Cố định vào cuối tuần |
| Dự phòng | 0–1 giờ | Sửa CI đỏ, Renovate PR, trả lời bình luận | Không dùng để "làm thêm tính năng" |

**Mẫu lịch (ví dụ, đổi theo thực tế)**

- Thứ Ba 20:00–22:30: buổi làm 1.
- Thứ Năm 20:00–22:30: buổi làm 2.
- Thứ Bảy sáng: đọc 1,5 giờ.
- Chủ Nhật tối: viết 1 giờ, cập nhật doc.

**Ba quy tắc giữ nhịp**

1. Mỗi buổi bắt đầu bằng đọc lại "Đầu ra" của buổi trong bảng lịch và kết thúc bằng một commit (kể cả commit WIP có ghi chú).
2. Một tuần mất cả hai buổi thì kéo dài giai đoạn một tuần, không dồn 5 giờ vào một buổi để bù.
3. Sau mỗi giai đoạn nghỉ đúng 1 tuần không code (chỉ đọc hoặc viết); đây là lúc cập nhật bảng tự đánh giá ở mục 7.

## 2. Git workflow một người

Làm như có team: nhánh ngắn, PR tự review theo checklist, commit theo quy ước, tag bất biến; lợi ích không phải quy trình mà là lịch sử đọc được và thói quen mang sang công ty.

| Quy ước | Cụ thể |
| --- | --- |
| Mô hình | Trunk-based: `main` luôn xanh và deploy được; nhánh tính năng sống dưới 1 tuần |
| Tên nhánh | `<giai đoạn>/<việc>`: `p1/idempotency-key`, `p3/outbox-debezium`, `sec/attack-log-2` |
| Commit | Conventional Commits: `feat(order): reserve stock with optimistic lock`, `fix(security): constant-time HMAC compare`, `docs(adr): accept ADR-003`, `perf(order): move reservation to redis lua`, `test`, `chore`, `ci` |
| Ký commit | `git config commit.gpgsign true` với SSH signing key; GitHub hiện "Verified"; đây là thói quen supply chain từ tuần 1 |
| PR | Mọi thay đổi vào `main` qua PR kể cả một mình; mô tả PR theo mẫu; tự review sau ít nhất 1 giờ kể từ khi viết code |
| Bảo vệ `main` | Branch protection: CI xanh bắt buộc (build, test, gitleaks, Dependency-Check, CodeQL, sau này Trivy), không force push, tag chỉ tạo từ `main` |
| Tag | `v0-design` … `v5-sa` là annotated tag có ký; thêm `security-fix-<n>` cho commit sửa từ attack log; không xóa tag |
| Renovate và bot CI | Bot commit vào `deploy/` được phép push thẳng (giai đoạn 4) nhưng CODEOWNERS giới hạn đường dẫn |

**Mẫu mô tả PR (`.github/pull_request_template.md`)**

```markdown
## Việc gì, vì sao
(1–3 câu; link buổi trong doc kế hoạch, issue, ADR)

## Thay đổi
- 

## Bằng chứng
- Test: (tên test mới hoặc sửa)
- Số đo nếu là perf: trước / sau
- Attack log nếu là security-fix

## Checklist tự review (đánh dấu thật, không đánh dấu cho có)
- [ ] Đọc lại diff sau ≥ 1 giờ
- [ ] Không có secret, không có TODO không có issue
- [ ] DTO/validation cho input mới; authorization cho endpoint mới
- [ ] Timeout cho cuộc gọi ra ngoài mới
- [ ] Event mới có schema trong `contracts` và consumer idempotent
- [ ] Tài liệu: ADR / threat model / runbook cần cập nhật không?
- [ ] Test hồi quy cho bug đã sửa
```

**Quy ước message merge:** squash merge với tiêu đề là dòng Conventional Commit; body giữ mục "Bằng chứng" để `git log` kể được lịch sử số đo.

## 3. Quy trình ADR

ADR ghi quyết định khó đảo ngược hoặc đắt nếu sai; quyết định nhỏ ghi trong PR là đủ. Ngưỡng: nếu 3 tháng sau bạn có thể hỏi "sao hồi đó chọn thế này", thì viết ADR.

**3.1. Khi nào viết**

| Viết ADR | Không viết ADR (ghi trong PR) |
| --- | --- |
| Chọn công nghệ hoặc thư viện nền (DB, broker, cách outbox) | Chọn thư viện tiện ích nhỏ |
| Ranh giới: tách hay giữ module, service | Đặt tên package |
| Mô hình nhất quán, cơ chế đảm bảo đúng đắn | Tinh chỉnh tham số (pool size, TTL) — trừ khi có số đo đáng ghi, thì ghi vào perf report |
| Đổi mô hình runtime (virtual threads, native) | Bật/tắt feature flag |
| Phương án hạ tầng và chi phí | Thay đổi cấu hình dev |

**3.2. Vòng đời**

1. `Proposed`: viết khi bắt đầu việc, có giả thuyết và "cách xác nhận" (test hoặc số đo nào sẽ chứng minh); commit ngay.
2. `Accepted`: khi có bằng chứng; cập nhật mục "Cách xác nhận" bằng số thật và link.
3. `Superseded by ADR-00X`: khi quyết định mới thay thế; ADR cũ giữ nguyên nội dung, chỉ thêm dòng trạng thái và link; không xóa, không sửa lịch sử.
4. `Deprecated`: quyết định không còn áp dụng mà không có ADR thay thế (hiếm).

**3.3. Xem lại**

- Mỗi ADR có dòng "Xem lại: \<ngày hoặc điều kiện>"; ở buổi cuối mỗi giai đoạn mở lại các ADR đến hạn, ghi "vẫn đúng" hoặc mở ADR mới.
- Ở retrospective cuối dự án, xếp hạng ADR theo "tiết kiệm nhiều nhất" và "hối tiếc nhất"; đây là câu chuyện phỏng vấn tốt.

**3.4. Chỉ mục và công cụ**

- Tên file `NNNN-<slug>.md`, số không dùng lại; `docs/adr/README.md` là chỉ mục sinh bằng script nhỏ (`scripts/adr-index.sh`) chạy trong CI để không lệch.
- Mẫu MADR ở tab Giai đoạn 0 mục 6; mỗi ADR bắt buộc có ít nhất 2 phương án bị loại và ít nhất 1 hệ quả xấu của phương án được chọn.
- ADR nhắc tới trong SAD mục 9 bằng bảng một dòng mỗi ADR; SAD không chép lại nội dung.

## 4. Chuẩn tài liệu

Tài liệu sống trong repo, viết bằng Markdown, hình sinh từ code, và có hai ngôn ngữ với vai trò rõ: tiếng Việt cho nhật ký và bài viết, tiếng Anh cho artefact kỹ thuật mà nhà tuyển dụng nước ngoài sẽ đọc.

**4.1. Cây thư mục `docs/`**

```
docs/
├── README.md                 # mục lục tài liệu, link tới mọi thứ bên dưới
├── requirements.md, estimation.md
├── adr/                      # 0001-…md, README.md (chỉ mục sinh tự động)
├── c4/                       # workspace.dsl, *.png xuất ra, components/ (Modulith)
├── sad/                      # 01-12 theo arc42, giai đoạn 5
├── security/                 # threat-model-v*.md, risk-register.md, attack-log-*.md, tools/, incidents.md, secrets-inventory.md
├── perf/                     # baseline-v1.md, report.md, flame-*.html, chaos/
├── runbooks/                 # redis-failover.md, consumer-lag.md, debezium-slot.md, rollback.md, rotate-secrets.md, replay.md
├── postmortem-001.md
├── cost/                     # tco-1y.md
├── well-architected.md, comparison.md, proposal.md
├── talk/                     # slide, elevator.md, feedback.md
├── journal/                  # nhật ký tuần: 2026-W40.md …
└── retrospective.md
```

**4.2. Quy ước Markdown**

- Tiêu đề bắt đầu bằng câu kết luận; mục nào cũng có "Bằng chứng" hoặc "Nguồn" khi có số.
- Bảng cho dữ liệu có cột, danh sách cho bước, đoạn văn ngắn (≤ 3 câu) cho lý do; không dùng heading sâu hơn 3 cấp.
- Số có đơn vị và điều kiện đo ("p99 280 ms, 2.500 request/giây, compose.perf, commit abc123").
- Đường dẫn file và lệnh trong backtick; lệnh chạy được copy nguyên khối.
- Link nội bộ tương đối; link ngoài kèm ngày truy cập trong nhật ký (nội dung web đổi nhanh).

**4.3. Hình từ code**

| Hình | Công cụ | Nguồn | Xuất |
| --- | --- | --- | --- |
| C4 Context, Container, Deployment | Structurizr DSL + Structurizr Lite | `docs/c4/workspace.dsl` | PNG commit cạnh DSL; CI kiểm tra DSL parse được |
| C4 Component | Spring Modulith `Documenter` | Sinh khi chạy `ModularityTests` | Copy từ `build/spring-modulith-docs` vào `docs/c4/components/` bằng task Gradle |
| Sequence (saga, failover) | PlantUML trong Markdown | `docs/sad/*.puml` | Render bằng plugin IDE; PNG commit |
| DFD | Threat Dragon | `docs/security/*.json` | PNG xuất từ công cụ |
| Flame graph | async-profiler | `docs/perf/*.html` | Giữ HTML, chụp PNG cho bài viết |
| Dashboard | Grafana JSON | `deploy/grafana/` | Ảnh chụp cho report, JSON là nguồn |

Không có hình vẽ tay hay ảnh chụp bảng trắng làm nguồn chính; nếu có, vẽ lại bằng code trong tuần.

**4.4. Ngôn ngữ**

| Loại | Ngôn ngữ | Lý do |
| --- | --- | --- |
| Code, commit, PR, ADR, SAD, README, runbook, threat model | Tiếng Anh | Portfolio đọc được với nhà tuyển dụng nước ngoài; thuật ngữ nhất quán với tài liệu gốc |
| Nhật ký tuần, bài viết Viblo, slide talk nội bộ | Tiếng Việt | Viết nhanh, phản biện từ cộng đồng Việt Nam |
| Doc kế hoạch này | Tiếng Việt | Là công cụ cá nhân |

Thuật ngữ giữ nguyên tiếng Anh trong văn bản tiếng Việt (outbox, saga, idempotency); giải thích một lần ở glossary (SAD mục 12).

## 5. Definition of Done chung và checklist gắn tag

Mỗi tab giai đoạn có Definition of Done riêng; mục này là phần chung áp dụng cho mọi tag, để không giai đoạn nào "xong" mà thiếu nhật ký, threat model hay số đo.

**5.1. Definition of Done cho một PR**

- [ ] CI xanh toàn bộ (build, test kể cả test đồng thời theo cấu hình, gitleaks, Dependency-Check, CodeQL, Trivy từ giai đoạn 4).
- [ ] Checklist tự review trong PR đã đi qua thật.
- [ ] Tài liệu liên quan cập nhật trong cùng PR (ADR, threat model, runbook, OpenAPI, schema event).
- [ ] Không có TODO thiếu issue; không có test bị `@Disabled` thiếu lý do và issue.

**5.2. Checklist gắn tag giai đoạn (chạy ở buổi cuối mỗi giai đoạn)**

1. Definition of Done của tab giai đoạn: mọi ô đã đánh dấu, ô nào không đạt có dòng giải thích và issue.
2. `verify-no-oversell` và test end-to-end hiện hành xanh trên môi trường sạch (`down -v && up`).
3. Threat model có changelog cho giai đoạn; risk register không có dòng Cao thiếu chủ và hạn.
4. `docs/perf/report.md` có mốc của giai đoạn (từ giai đoạn 2).
5. Attack log của giai đoạn đóng với 3 câu bài học (từ giai đoạn 1).
6. README cập nhật cách chạy; `docs/README.md` có link tới artefact mới.
7. Bảng theo dõi ở tab chính: trạng thái Hoàn thành, nhật ký tiến độ có dòng tổng kết giai đoạn với giờ thật.
8. Bảng tự đánh giá (mục 7) cập nhật trạng thái các dòng thuộc giai đoạn.
9. Tạo annotated tag có ký từ `main`: `git tag -s v2-perf -m "Phase 2: ..."`; push tag; tạo GitHub Release với ghi chú 5 dòng và link report.
10. Nghỉ 1 tuần theo quy tắc mục 1.

**5.3. Điều không được làm để "kịp tag"**

- Không hạ ngưỡng test hoặc bỏ test đồng thời để CI xanh.
- Không đánh dấu Definition of Done khi bằng chứng chưa có; ghi "chưa đạt" là hợp lệ, đánh dấu sai thì không.
- Không gắn tag khi có CVE Critical chưa xử lý hoặc chưa có dòng risk.

## 6. Nhật ký học tập

Một file mỗi tuần trong `docs/journal/`, viết trong khối "Viết" 1 giờ; nhật ký là nguyên liệu thô của bài viết giai đoạn 5 và của các câu chuyện phỏng vấn, nên ghi số và ngạc nhiên, không ghi cảm xúc chung chung.

**6.1. Mẫu `docs/journal/YYYY-Www.md`**

```markdown
# Tuần <ww> — Giai đoạn <k>, buổi <a>–<b>

## Đã làm (giờ thật)
- Buổi a: <việc> — <giờ> — <commit/PR>
- Buổi b: …
- Đọc: <nguồn, phần> — <giờ>

## Số đo hoặc bằng chứng mới
- (p99, số test, kết quả chaos, dòng attack log…)

## Điều làm mình ngạc nhiên
- (một điều cụ thể; đây là hạt giống bài viết)

## Điều chưa hiểu / câu hỏi mở
- (kèm nơi sẽ tìm câu trả lời)

## Quyết định trong tuần
- (ADR mới hoặc lý do không cần ADR)

## Tuần sau
- (3 việc, theo bảng lịch)
```

**6.2. Quy tắc**

- Viết trong 30–45 phút; quá 1 giờ là đang viết bài, không phải nhật ký.
- Mục "Ngạc nhiên" là bắt buộc; tuần không có gì ngạc nhiên thường là tuần làm theo quán tính, đáng xem lại.
- Giờ thật ghi theo khối 15 phút; số này đi vào mục 9.
- Không chép lại tài liệu đã đọc; ghi điều mình sẽ làm khác nhờ đã đọc.

**6.3. Từ nhật ký thành bài viết**

1. Cuối mỗi giai đoạn, gom mục "Ngạc nhiên" và "Số đo" của 4–5 tuần vào một file `docs/journal/phase-<k>-digest.md`.
2. Chọn 1 ngạc nhiên có số đo đi kèm làm "câu hỏi" của bài viết (tab Giai đoạn 5 mục 9.1).
3. Dàn ý: vấn đề và số → điều đã tin trước đó → điều đo được → điều rút ra → làm lại sẽ khác.
4. Nhật ký cũng là nguồn cho retrospective (giờ thật so với kế hoạch) và cho câu trả lời phỏng vấn (mục 11.3 tab Giai đoạn 5).

## 7. Bảng tự đánh giá kỹ năng Senior và SA

Hai checklist lấy từ báo cáo lộ trình, ánh xạ vào giai đoạn nơi bằng chứng xuất hiện; cập nhật cột Mức sau mỗi tag, và chỉ chọn "Tự tin" khi có thể giải thích cho người khác trong 5 phút kèm bằng chứng.

**7.1. Senior (mục tiêu: ≥ 9/11 ở mức Có bằng chứng hoặc Tự tin sau giai đoạn 4)**

| # | Kỹ năng | Giai đoạn | Bằng chứng | Mức |
| --- | --- | --- | --- | --- |
| 1 | Giải thích Java Memory Model, happens-before; chọn đúng giữa virtual threads, platform threads, reactive | 1, 2 | Test đồng thời, ADR-004 có số | Chưa bắt đầu |
| 2 | Đọc GC log, chọn và tune G1/ZGC cho workload cụ thể | 2 | So sánh ZGC và G1 trong report | Chưa bắt đầu |
| 3 | Tìm và sửa bottleneck bằng JFR/async-profiler, có p99 trước/sau | 2 | Flame graph diff, 5 mốc perf | Chưa bắt đầu |
| 4 | Viết JMH đúng cách | 2 | 2 benchmark và phụ lục report | Chưa bắt đầu |
| 5 | Thiết kế service: API, schema, idempotency, retry/timeout, caching, versioning, design doc | 1, 2 | Hợp đồng API, bảng Idempotency-Key, OpenAPI | Chưa bắt đầu |
| 6 | Test strategy: unit, integration Testcontainers, contract | 1, 3 | Test pyramid, contract test event | Chưa bắt đầu |
| 7 | Sở hữu pipeline CI/CD và quy trình release/rollback | 4 | Pipeline có chữ ký, runbook rollback | Chưa bắt đầu |
| 8 | Dashboard và alert theo SLO bằng OpenTelemetry/Micrometer | 4 | 4 SLI, alert đã bắn thật | Chưa bắt đầu |
| 9 | OAuth2/OIDC, secrets, SCA, SBOM | 1, 4 | Spring Security config, secrets inventory, SBOM attest | Chưa bắt đầu |
| 10 | Dẫn dắt postmortem và mentor ít nhất một người | 4 + tại công ty | postmortem-001; ghi nhận mentoring ở mục 8 | Chưa bắt đầu |
| 11 | Nâng cấp dự án lên Java 25 và Spring Boot 4.x | 0, 1 | Repo từ đầu trên stack này; ghi chú migration nếu làm thêm PetClinic | Chưa bắt đầu |

**7.2. Solution Architect (mục tiêu: ≥ 10/12 sau giai đoạn 5)**

| # | Kỹ năng | Giai đoạn | Bằng chứng | Mức |
| --- | --- | --- | --- | --- |
| 1 | Liệt kê và ưu tiên architecture characteristics từ yêu cầu mơ hồ | 0, 5 | NFR bằng số, quality scenarios | Chưa bắt đầu |
| 2 | Trình bày ≥ 3 phương án có bảng trade-off và khuyến nghị | 2, 3, 5 | ADR-003, 005, 008 | Chưa bắt đầu |
| 3 | ≥ 10 ADR và một SAD arc42 có C4 ba tầng | 0–5 | `docs/adr`, `docs/sad` | Chưa bắt đầu |
| 4 | Thiết kế hệ phân tán với saga/outbox/CQRS và giải thích consistency | 3 | State machine hai cờ, read model `sale_stats`, ADR-007 | Chưa bắt đầu |
| 5 | Áp dụng EIP để tích hợp hệ thống legacy | 3 + đọc thêm | Webhook, outbox, DLQ, replay; bài đọc EIP (chưa có legacy thật) | Chưa bắt đầu |
| 6 | Tổ chức event storming và xác định bounded context | 1, 3 | Ranh giới Modulith, ADR-006; event storming làm thêm tại công ty | Chưa bắt đầu |
| 7 | AWS SAA và SAP (hoặc tương đương) | Song song | Chứng chỉ | Chưa bắt đầu |
| 8 | Ước lượng TCO và chi phí vận hành, sai số dưới 30% | 5 | `tco-1y`, độ nhạy; sai số chỉ kiểm được khi lên cloud thật | Chưa bắt đầu |
| 9 | Threat model theo STRIDE, thiết kế zero trust | 0–5 | Threat model v1, NetworkPolicy default-deny, mTLS là khoảng trống | Chưa bắt đầu |
| 10 | Tham gia pre-sales/RFP và trình bày cho stakeholder không chuyên | 5 | Proposal, elevator versions, talk | Chưa bắt đầu |
| 11 | Dẫn dắt architecture review và có tech talk bên ngoài | 5 + công ty | Mock review, feedback.md, talk ở meetup | Chưa bắt đầu |
| 12 | Giải thích khi nào không nên dùng microservices | 1, 3 | ADR-001, ADR-006 (giữ inventory), comparison.md | Chưa bắt đầu |

Dòng 5, 6, 7 và 10 không đạt được chỉ bằng dự án; mục 8 nói cách lấy bằng chứng từ công việc hiện tại.

## 8. Áp dụng song song tại công ty

Bốn dòng của bảng tự đánh giá (EIP với legacy, event storming, pre-sales, mentor và review) chỉ có bằng chứng từ công việc thật; mục này là kế hoạch lấy bằng chứng đó mà không cần chờ ai giao.

| Kỹ năng | Việc chủ động xin làm trong 6 tháng | Bằng chứng ghi lại (không chứa thông tin mật của công ty) |
| --- | --- | --- |
| Ownership và design doc | Nhận một tính năng hoặc service và viết design doc theo mẫu ADR + C4 trước khi code; xin được review | Bản design doc đã ẩn danh; phản hồi nhận được |
| Code review có tính dạy | Review với 3 tầng nhận xét (chặn, nên, gợi ý), giải thích vì sao thay vì chỉ ra chỗ sai | Số review; 1–2 ví dụ nhận xét ẩn danh |
| Mentor | Nhận một Junior hoặc Middle: 30 phút mỗi tuần, có mục tiêu 3 tháng, ghi tiến bộ | Ghi chú mentoring (ẩn danh), điều người đó làm được sau 3 tháng |
| On-call và postmortem | Xin vào rota on-call nếu có; viết hoặc đồng tác giả một postmortem thật | Postmortem ẩn danh, action item đã đóng |
| Event storming và bounded context | Đề xuất một buổi event storming 2 giờ cho tính năng mới hoặc cho phần code đang rối; điều phối buổi đó | Ảnh bảng (ẩn danh), context map |
| Tích hợp legacy và EIP | Nhận việc tích hợp với hệ thống cũ (SOAP, file batch, DB chia sẻ) và áp dụng đúng pattern EIP (messaging bridge, content enricher, idempotent receiver) | Sơ đồ tích hợp ẩn danh, pattern đã dùng |
| Pre-sales và stakeholder | Xin ngồi nghe buổi pre-sales, ước lượng hoặc họp khách hàng; sau đó tự viết bản proposal song song và so với bản chính thức | Bản proposal của mình (ẩn danh) và điểm khác |
| Architecture review | Đề xuất lịch review kiến trúc hàng tháng trong team (30 phút, một chủ đề); dẫn 2 buổi đầu | Biên bản 2 buổi |
| Tech talk | Trình bày talk FlashSale nội bộ ở giai đoạn 5; sau đó một talk về chủ đề của công ty | Slide, phản hồi |

**Cách xin việc mà không bị coi là "vượt phận"**

- Đề xuất kèm chi phí thời gian và lợi ích cho team ("design doc 2 trang trước khi code, tiết kiệm vòng review"), không kèm chức danh.
- Bắt đầu bằng thứ nhỏ nhất có thể làm một mình (review kỹ hơn, viết postmortem cho sự cố nhỏ), rồi mới đề xuất thứ cần người khác tham gia (event storming, review hàng tháng).
- Ghi vào nhật ký tuần một dòng "bằng chứng tại công ty"; đến giai đoạn 5 sẽ có 20–25 dòng để chọn.

**Nếu công việc hiện tại không cho phép** (không có on-call, không có pre-sales, không ai để mentor): đây là tín hiệu để cân nhắc đổi công ty sau khi xong giai đoạn 3, vì các dòng 7, 10, 11 của bảng SA khó đạt trong môi trường không có việc đó; portfolio đến `v3-events` đã đủ để phỏng vấn Senior.

## 9. Theo dõi thời gian và tiến độ

Ghi giờ thật theo buổi để biết kế hoạch 24 tuần lệch bao nhiêu và lệch ở đâu; số này dùng cho retrospective, cho ước lượng ở tab Giai đoạn 5 mục 10.4, và cho câu hỏi phỏng vấn "bạn ước lượng thế nào".

**9.1. Time log (`docs/journal/time-log.csv`)**

```csv
date,phase,session,planned_h,actual_h,category,note
2026-09-29,0,1,2.5,3.0,design,"requirements va NFR, mat them 30 phut vi doc arc42 quality"
2026-10-02,0,2,2.0,1.5,design,"estimation"
```

- `category`: design, code, test, perf, security, ops, docs, read, write, fix-ci.
- Ghi ngay cuối buổi, theo khối 15 phút; không ghi hồi tưởng cuối tuần.
- Giờ đọc và viết ghi riêng để thấy tỷ lệ làm/đọc/viết (kỳ vọng khoảng 60/20/20).

**9.2. Cách đọc số mỗi cuối giai đoạn**

| Chỉ số | Cách tính | Ngưỡng để hành động |
| --- | --- | --- |
| Hệ số lệch giai đoạn | tổng actual\_h / tổng planned\_h | > 1,3: giai đoạn sau cắt scope theo hướng dẫn "nếu trượt" của tab đó; < 0,8: kiểm tra có bỏ qua bước nào không |
| Tỷ lệ theo category | actual\_h theo category / tổng | fix-ci > 10%: đầu tư vào CI ổn định trước; read > 30%: đọc thay làm |
| Buổi trượt sang buổi sau | đếm | > 3 buổi/giai đoạn: chia nhỏ việc trong bảng lịch |
| Tuần trống | tuần không có buổi nào | 2 tuần liên tiếp: áp dụng mục 10 |

**9.3. Biểu đồ**

- Khi có dữ liệu từ 2 giai đoạn trở lên, vẽ planned so với actual theo giai đoạn (bar) và tích lũy theo tuần (line) từ `time-log.csv`; đặt vào retrospective và có thể đưa lên tab chính khi có số.
- Không vẽ khi chưa có số; bảng theo dõi ở tab chính là đủ cho đến giai đoạn 2.

## 10. Rủi ro của kế hoạch và cách xử lý

Kế hoạch 24 tuần một người có 6 rủi ro thường gặp; mỗi rủi ro có dấu hiệu sớm và cách xử lý đã quyết định trước để không phải quyết định lúc đang nản.

| Rủi ro | Dấu hiệu sớm | Xử lý đã định | Không làm |
| --- | --- | --- | --- |
| Mất động lực giữa giai đoạn dài (2, 3) | 2 tuần không commit; nhật ký không có "ngạc nhiên" | Cắt việc tuần tới thành 3 việc dưới 1 giờ có đầu ra nhìn thấy (một biểu đồ, một test xanh); đăng một bài ngắn trên Viblo về điều đã làm | Không bắt đầu tính năng mới để "lấy hứng" |
| Tết 2027 (tuần 19) và các kỳ nghỉ | Biết trước theo lịch | Dời lịch theo hướng dẫn trong tab giai đoạn 4; báo trước trong bảng theo dõi; kéo 2 tuần, không dồn | Không làm việc trong Tết để "bù" |
| Laptop không đủ tài nguyên cho kind + Kafka + Postgres + Grafana | Buổi 6 giai đoạn 4 không dựng được cụm | Giảm replica và resource trong `values/kind.yaml`; tắt Grafana stack khi không đo; thuê VPS 4 vCPU/16 GB theo giờ cho giai đoạn 4 (tính vào ngân sách mục 11) | Không bỏ Kubernetes vì đó là phần khác biệt của giai đoạn 4 |
| Scope creep (UI đẹp, thêm tính năng, thử framework mới) | PR không trỏ tới buổi nào trong bảng lịch | Quy tắc: việc không có trong bảng lịch đi vào backlog mục 11.1 tab Giai đoạn 5, không vào sprint | Không sửa bảng lịch để hợp thức hóa việc mới |
| Thư viện đổi API (Spring Boot 4.x minor, Modulith, Debezium) giữa chừng | Renovate PR đỏ nhiều | Pin version cho cả giai đoạn; nâng version ở tuần nghỉ giữa hai giai đoạn; ghi migration note vào nhật ký | Không nâng version giữa giai đoạn trừ CVE |
| Không tìm được người review/phản biện | Giai đoạn 5 buổi 19 không có người | Đăng bài sớm (buổi 17) để lấy bình luận; hỏi trong nhóm cộng đồng; tự review sau 3 ngày theo ATAM rút gọn | Không bỏ bước review |
| Sự kiện cuộc sống (việc mới, sức khỏe) | Tuần trống kéo dài | Tạm dừng có chủ đích: viết một dòng "tạm dừng từ ngày… dự kiến quay lại…" vào bảng theo dõi; khi quay lại bắt đầu bằng đọc lại nhật ký 2 tuần cuối và chạy lại toàn bộ test trước khi code | Không cố duy trì nhịp nửa vời |

Quy tắc chung: kế hoạch được phép trượt thời gian, không được phép trượt chất lượng bằng chứng (test, số đo, attack log).

## 11. Ngân sách và lịch mua tài nguyên

Toàn bộ công cụ trong dự án miễn phí; chi phí thật nằm ở sách, một gói đọc, chứng chỉ và có thể một VPS theo giờ. Con số là xấp xỉ theo giá công khai và phải kiểm tra lại trước khi mua.

| Khoản | Khi mua | Chi phí xấp xỉ | Ghi chú |
| --- | --- | --- | --- |
| O'Reilly Learning, 1–2 tháng | Đầu giai đoạn 0 | Kiểm tra giá gói cá nhân hiện hành (theo tháng hoặc năm) | Đọc FoSA 2nd, SDI Vol 1, Optimizing Cloud Native Java, JCIP, Monolith to Microservices, Chaos Engineering; hủy sau giai đoạn 2 |
| *Effective Java* 3rd, bản in | Giai đoạn 1 | Theo giá nhà sách | Đọc lại nhiều lần |
| *Designing Data-Intensive Applications* 2nd, bản in | Giai đoạn 2 | Theo giá nhà sách | Dùng ở giai đoạn 2, 3 và về sau |
| *Secure by Design*, *Threat Modeling* (Shostack), *The Software Architect Elevator*, *Solutions Architect's Handbook* 3rd | Có thể đọc qua O'Reilly thay vì mua | — | Mua bản in chỉ cuốn sẽ đọc lại |
| NVD API key, GitHub (public repo), CodeQL, Renovate, Grafana Cloud free tier | Giai đoạn 0, 4 | 0 |  |
| VPS 2 vCPU theo giờ cho k6 (nếu cần) | Giai đoạn 2 | Vài USD cho 10–20 giờ | Chỉ nếu laptop làm số đo không ổn định |
| VPS 4 vCPU/16 GB theo giờ cho kind (nếu laptop 16 GB không đủ) | Giai đoạn 4 | Khoảng vài chục USD cho 40 giờ | Tắt khi không dùng; ghi thành bài học FinOps nhỏ |
| AWS Certified Solutions Architect – Associate | Cuối giai đoạn 1 hoặc giai đoạn 2 | 150 USD | Ôn qua AWS Skill Builder miễn phí + một khóa luyện đề |
| CKAD (tùy chọn) | Sau giai đoạn 4 | 445 USD, gồm 2 lần thi | Mua trong đợt giảm giá của Linux Foundation |
| AWS Certified Solutions Architect – Professional | Trong hoặc sau giai đoạn 5 | 300 USD |  |
| Chạy thử phương án ADR-008 trên AWS thật (backlog) | Sau dự án | Vài chục USD nếu bật 1–2 ngày rồi tắt | Đặt AWS Budgets 50 USD trước khi tạo tài nguyên |

**Thứ tự ưu tiên nếu ngân sách hạn chế:** O'Reilly 1 tháng → AWS SAA → *DDIA* 2nd → *Effective Java* → SAP. Mọi thứ khác thay được bằng nguồn miễn phí đã liệt kê trong các tab giai đoạn.
