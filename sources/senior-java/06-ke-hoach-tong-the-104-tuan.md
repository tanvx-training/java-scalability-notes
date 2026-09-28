# Kế hoạch tổng thể 104 tuần — một dự án, mọi cuốn sách

> **Tài liệu này là gì.** Bản kế hoạch học tập cá nhân đã *gắn ngày*, cho 24 tháng từ **thứ Hai 05/10/2026** đến **Chủ nhật 01/10/2028**, với **8–10 giờ/tuần**. Nó là nguồn sự thật của trang **🗓️ Kế hoạch tuần** trong app (dữ liệu `webapp/js/data/senior-java/schedule.js`) và là bản cập nhật của [Hướng dẫn học với kho tài nguyên](05-huong-dan-hoc-voi-kho-tai-nguyen.md) sau khi kho có thêm Effective Java, PostgreSQL Internals và pet project FlashSale.
>
> **Khi hai tài liệu mâu thuẫn về "tuần này làm gì", theo tài liệu này.** Sáu tài liệu đi kèm: [sắp xếp thời gian](07-sap-xep-thoi-gian.md) · [cách học và ghi chép](08-cach-hoc-va-ghi-chep.md) · [thực hành](09-thuc-hanh-mot-du-an-moi-cuon-sach.md) · [sợi chỉ xuyên stack](10-soi-chi-xuyen-stack.md) · [đo lường và review](11-do-luong-va-review.md) · [mẫu ghi chép](12-mau-ghi-chep.md).

---

## 1. Kho có gì, và ba vấn đề của nó

### 1.1 Có gì

| Thành phần | Số lượng | Dùng để |
|---|---|---|
| Lĩnh vực | 17 (4 con đường + trục Senior) | Chọn nội dung |
| Tài liệu đọc | 318 (13 sách dịch trọn, 10 bài Java Scalability, 7 tài liệu chứng chỉ, 13 tài liệu lộ trình, 10 tài liệu FlashSale) | Đọc sâu |
| Lộ trình theo tuần | 29 track / 1251 mục, mỗi mục một bài học có *Mục tiêu · Bẫy · Tự kiểm tra* | Tick tiến độ |
| Đo năng lực | Ma trận 96 tiêu chí × 4 cấp; 336 câu phỏng vấn tự chấm; 220 trắc nghiệm; 22 lab K8s; thi thử | Biết mình ở đâu |
| Dự án | FlashSale 24 tuần, 6 giai đoạn, 96 buổi, 69 tiêu chí DoD, security xuyên suốt | Ráp mọi thứ lại |

Kho **không thiếu nội dung**. Nội dung đủ cho 3–4 năm. Vấn đề nằm ở chỗ khác.

### 1.2 Vấn đề 1 — hai kế hoạch, một quỹ giờ

| Kế hoạch | Giả định | Thời lượng |
|---|---|---|
| Lộ trình Senior Java (`sj-gd1`…`sj-gd4`) | 8–10 giờ/tuần, bắt đầu 10/2026 | 104 tuần |
| Pet project FlashSale (`fs-gd0`…`fs-gd5`) | 8–10 giờ/tuần, bắt đầu 28/09/2026 | 24 tuần |
| 23 track sách nếu đọc trọn theo tuần | 4–8 giờ/tuần mỗi track | ≈ 210 tuần |

Cộng hai dòng đầu là **16–20 giờ/tuần** trong 24 tuần đầu — gấp đôi quỹ. Không kế hoạch nào nhắc đến kế hoạch kia: tài liệu sj-05 viết khi kho có 14 lĩnh vực, chưa có FlashSale; FlashSale coi mình là việc duy nhất. Nếu cứ bấm "bắt đầu" ở cả hai, tháng 12/2026 sẽ là tháng bỏ cuộc.

### 1.3 Vấn đề 2 — không có lịch thật

Mọi track chỉ có "Tuần 1, Tuần 2". Không tuần nào gắn với ngày. App đếm *thao tác* (tick, lật thẻ) chứ không đếm *giờ*. Nghi thức review quý nằm trong văn bản, không có ngày, không ai nhắc. Người học tự dựng lịch trong đầu — và cái lịch trong đầu là thứ trôi đầu tiên khi công ty bận.

### 1.4 Vấn đề 3 — ghi chép, thực hành và "xuyên stack" mới ở mức khẩu hiệu

"Feynman note", "đọc mà không code = chưa đọc", "kết hợp các stack" được nhắc ở nhiều nơi nhưng chưa có: mẫu ghi chép, cây thư mục, quy tắc khi nào viết loại note nào; bản đồ *cuốn sách này đáp xuống chỗ nào của dự án*; và những **sợi chỉ** nối một khái niệm qua Java → PostgreSQL → Kafka → Kubernetes (144 liên kết chéo hiện có là liên kết cặp, không phải sợi chỉ).

---

## 2. Bảy nguyên tắc của kế hoạch này

1. **Một dự án, mọi cuốn sách.** FlashSale là *phòng lab* của lộ trình Senior. Mỗi cuốn sách được đọc *để làm một việc cụ thể trong FlashSale tuần đó*. Kết hợp stack không phải một môn học riêng — nó xảy ra trên một codebase.
2. **Một trục, một dự án, sách là vệ tinh.** Tuần nào cũng có đúng một lát của trục Senior (`sj-gd*`), một lát của dự án (`fs-gd*`, năm 2 là giáo trình CKAD/CKA), và 1–3 chương sách đọc *just-in-time*. Không mở track sách thứ tư.
3. **Dự án chạy nửa tốc.** 1 tuần nguồn FlashSale (4 buổi) = 2 tuần lịch (mỗi tuần 2 buổi). 24 tuần thành 48 tuần lịch + 5 tuần nghỉ sau tag = xong ở **tuần 53** (10/10/2027). Đổi lại, dự án chỉ chiếm 2,5 giờ/tuần và không giết phần đọc.
4. **Phủ trọn, không trùng.** 276 mục Senior và 165 mục FlashSale, mỗi mục xuất hiện **đúng một lần** trong 104 tuần. `check-data.mjs` bất biến PL2 ép điều này — sửa lịch mà sót mục là CI đỏ.
5. **Tick theo "Hoàn thành khi", không theo "đã đọc xong".** Trang Kế hoạch tuần tick thẳng vào mục lộ trình; nó chỉ là cách nhìn khác của cùng dữ liệu.
6. **Lịch có ngày thật, có tuần nghỉ.** Tết 2027 (tuần 18) và Tết 2028 (tuần 69) là tuần nghỉ. Sau mỗi tag FlashSale nghỉ dự án một tuần (luật của `fs-09`). Review quý rơi vào tuần 13, 26, 39, 52, 65, 78, 91, 104.
7. **Cắt sách trước, không cắt lab.** Khi trượt, thứ bị cắt đầu tiên là chương Hạng B/C, rồi giáo trình phụ; **không bao giờ** cắt lab của trục hay buổi dự án. Chi tiết ở [sj-07](07-sap-xep-thoi-gian.md) §4.

---

## 3. Mô hình một tuần và hai quyết định gây tranh cãi

### 3.1 Khối tuần chuẩn (năm 1, 8 giờ + 1 giờ dự phòng)

| Khối | Giờ | Nguồn việc | Sản phẩm |
|---|---|---|---|
| Đọc | 2 | 1–3 chương "Đọc" của tuần, mở từ trang Kế hoạch tuần, đọc *hướng dẫn đọc* trước | Đánh dấu đã đọc + concept card |
| Lab sách | 1,5 | Mục của trục Senior tuần này (*Cách thực hiện* trong bài học) | Lab log có số, đổ vào `java-deep-dive` |
| Dự án | 2,5 | 2 buổi FlashSale của tuần, mỗi buổi 1,25 giờ hoặc gộp 1 buổi 2,5 giờ | Commit + đầu ra của buổi |
| Viết | 1 | Feynman note của chủ đề tuần + nhật ký tuần | 2 tệp trong `learning-notes` |
| Ôn | 1 | 3–4 câu phỏng vấn cùng chủ đề, đọc lại 1 note cũ, tick lộ trình, đặt lịch tuần sau | Dòng "rụng ở tầng nào" |

Năm 2 (tuần 54–104) không còn dự án: khối Dự án đổi thành lab Kubernetes / production-ready-platform / design doc ở công ty (3,5 giờ).

### 3.2 Quyết định 1 — xếp lại thứ tự Giai đoạn 1 theo dự án

Track `sj-gd1` đi: Java hiện đại → JVM → collections → generics → concurrency → Spring → @Transactional → JPA → SQL → testing. FlashSale GĐ1 (tuần lịch 5–12) cần Spring internals, @Transactional, JPA, testing *ngay*; GĐ2 (tuần 14–22) mới cần concurrency. Nên lịch đảo:

| Tuần lịch | Chủ đề trục (`sj-gd1`) | Vì sao ở đây |
|---|---|---|
| 1–4 | w1 Java 17–21 · w2 JVM & GC | Giữ nguyên: dựng nền nếp, GĐ0 FlashSale chưa code |
| 5–12 | w8 Spring IoC/AOP · w9 @Transactional · w10 JPA N+1 · w12 Testing | FlashSale GĐ1 viết module, @Version, Testcontainers |
| 13–16 | w3 Collections · w4 Generics/stream | Tuần nhẹ giữa hai giai đoạn dự án |
| 17–23 | w5 Thread safety · w6 Thread pool · w7 CompletableFuture/VT | FlashSale GĐ2: virtual threads, JMH, k6 |
| 24–25 | w11 SQL, index, EXPLAIN | FlashSale GĐ3 đụng bảng outbox lớn, cần index |
| 26–27 | w13 Ôn & mock interview · Nghiệm thu | Cuối quý 2 |

Id mục không đổi, chỉ thứ tự trên lịch đổi. Track trong app vẫn hiện theo thứ tự gốc — không sao, bạn tick từ trang Kế hoạch tuần.

### 3.3 Quyết định 2 — Kafka và K8s đến sớm hơn lộ trình gốc

Lộ trình gốc để Kafka ở Giai đoạn 4 (năm 2) và K8s ở Giai đoạn 3. FlashSale GĐ3 (tuần 24–33) cần Kafka, GĐ4 (tuần 35–42) cần kind + Helm. Kế hoạch này cho bạn **chạm Kafka và K8s ở năm 1 qua dự án**, rồi **học có hệ thống ở năm 2** (giáo trình CKAD/CKA, Kafka ch. 9–14, DDIA có kỷ luật). Đó là thứ tự đúng để nhớ: dùng trước, hiểu sâu sau. Giai đoạn 2 DevOps của lộ trình gốc (không có lĩnh vực trong app) được lấp bằng FlashSale GĐ4 — CI/CD, observability, supply chain — đúng nội dung, có sản phẩm.

---

## 4. Lịch tám quý

| Quý | Tuần | Ngày | Tên | Trục Senior | Dự án / K8s | Sách chính | Mốc |
|---|---|---|---|---|---|---|---|
| 1 | 1–13 | 05/10/2026 – 03/01/2027 | Nền và luồng đúng | GĐ1: Java 21, JVM, Spring internals, @Transactional, JPA, testing | FlashSale GĐ0–GĐ1 | OCNJ 3–5, Java Scalability 9–10, JPA 3/8/10–12/20, SSIA 5–8, WGJD 13–14 | v0-design (t4), v1-monolith (t12), review Q1 (t13) |
| 2 | 14–26 | 04/01 – 04/04/2027 | Chịu tải: concurrency gặp k6 | GĐ1: collections, generics, JCiP, thread pool, virtual threads, SQL/EXPLAIN, ôn | FlashSale GĐ2, đầu GĐ3 | JCiP 2–6/8/10–11, Java Scalability 3/5–8, OCNJ 2/12, PG 2/16/20/25, Kafka 3–4/7–8 | Tết (t18), v2-perf (t22), review Q2 + mock Java (t26) |
| 3 | 27–39 | 05/04 – 04/07/2027 | Event-driven và DevOps nền tảng | Cổng GĐ1 (t27); GĐ2: Linux, networking, image, compose, CI, CD | FlashSale GĐ3, GĐ4 | SysProg 4/11/13/14, Java Scalability 1–2, WGJD 11–12, Kafka 6/11, SSIA 9/13/15, OCNJ 1/7–11, DDIA 5, CKA-SG 8–9/11/17 | Blog #1 (t27), v3-events (t33), review Q3 (t39) |
| 4 | 40–52 | 05/07 – 03/10/2027 | Production-grade và góc nhìn SA | GĐ2: CD prod, metrics, Grafana, logs, game day, portfolio; Cổng GĐ2 (t51) | FlashSale GĐ4 chốt, GĐ5 | DDIA 1–4, OCNJ 6/13–15, Kafka 12–13, PG 9–11, SSIA 10/14/16, EJ 4/8/10, WGJD 7/17–18, SysProg 18 | v4-prod (t42), blog #2 (t51), review Q4 (t52) |
| 5 | 53–65 | 04/10/2027 – 02/01/2028 | Kubernetes: CKAD | GĐ3: workload, networking, probe/JVM, storage, Helm, HPA, AWS IAM/VPC | v5-sa (t53); **giáo trình CKAD** t53–62 | CKA Study Guide 2–22 chọn lọc, DDIA 6 | v5-sa (t53), thi thử CKAD ≥80% (t62), review Q5 (t65) |
| 6 | 66–78 | 03/01 – 02/04/2028 | CKA, AWS, Terraform | GĐ3: compute/RDS, Terraform, production-ready-platform, nước rút, blog #3; Cổng GĐ3 (t78) | **giáo trình CKA** t66–75 | CKA Study Guide, DDIA 7–10 | **Thi CKAD (t66)**, Tết (t69), **Thi CKA (t76)**, review Q6 (t78) |
| 7 | 79–91 | 03/04 – 02/07/2028 | Distributed systems | GĐ4: Kafka nhìn lại, outbox/idempotency viết cho người khác, Redis, resilience, DDIA có kỷ luật | distributed-patterns-demo (tách từ FlashSale) | Kafka 5/9–10/14, DDIA 11–14, PG 6–7/12–14/17/19/21–23/28, MCJ 4–7, EJ 6/9/11 | Blog #4a (t81), review Q7 (t91) |
| 8 | 92–104 | 03/07 – 01/10/2028 | System design và hồ sơ Senior | GĐ4: 2 design doc, system design, mock, đóng gói hồ sơ, buffer; Cổng GĐ4 (t104) | Design doc tại công ty, mentoring | EJ 12, MJIA 9–14/19/21, WGJD 2/5/15–16, JCiP 14, SSIA 17, MCJ 8, PG 3–5/8, SysProg 6–8/10 | Mock #1–2 (t98–99), blog #4 (t101), review Q8 (t104) |

### 4.1 Lịch từng tuần

Cột *Trục Senior* và *FlashSale / K8s* ghi id tuần track và khoảng mục (ví dụ `gd1-w8 (1–3)` = ba mục đầu của tuần "Spring IoC & AOP"). Cột *Đọc* là chương mở từ trang Kế hoạch tuần. Bảng này sinh từ `schedule.js`; sửa lịch thì sửa ở đó rồi sinh lại, đừng sửa tay ở đây.


#### Quý 1 · 05/10/2026 – 03/01/2027 · Nền và luồng đúng

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 1 | 05/10/2026 | gd1-w1 (1–3) | gd0-w1 (1–2) | sj-06 · sj-07 · MJIA ch.1 | Bắt đầu 24 tháng |
| 2 | 12/10/2026 | gd1-w1 (4–5) | gd0-w1 (3–4) | WGJD ch.1 · WGJD ch.3 · EJ ch.2 |  |
| 3 | 19/10/2026 | gd1-w2 (1–3) | gd0-w2 (1–2) | OCNJ ch.3 · OCNJ ch.4 |  |
| 4 | 26/10/2026 | gd1-w2 (4–6) | gd0-w2 (3–4), gd0-done | OCNJ ch.5 | FlashSale v0-design |
| 5 | 02/11/2026 | gd1-w8 (1–3) | gd1-w3 (1–2) | JavaScal ch.9 · SSH ch.6 |  |
| 6 | 09/11/2026 | gd1-w8 (4–6) | gd1-w3 (3–4) | SSIA ch.5 · SSIA ch.6 |  |
| 7 | 16/11/2026 | gd1-w9 (1–3) | gd1-w4 (1–2) | JavaScal ch.10 · JPA ch.10 |  |
| 8 | 23/11/2026 | gd1-w9 (4–6) | gd1-w4 (3–4) | JPA ch.11 · PG ch.2 |  |
| 9 | 30/11/2026 | gd1-w10 (1–3) | gd1-w5 (1–2) | JPA ch.3 · JPA ch.12 |  |
| 10 | 07/12/2026 | gd1-w10 (4–6) | gd1-w5 (3–4) | JPA ch.8 · SSIA ch.7 · SSIA ch.8 |  |
| 11 | 14/12/2026 | gd1-w12 (1–3) | gd1-w6 (1–2) | WGJD ch.13 · JPA ch.20 |  |
| 12 | 21/12/2026 | gd1-w12 (4–5) | gd1-w6 (3–4), gd1-done | WGJD ch.14 · SSIA ch.18 | FlashSale v1-monolith |
| 13 | 28/12/2026 | gd1-w3 (1–3) | — | MJIA ch.8 · EJ ch.3 | Review quý 1 |

#### Quý 2 · 04/01 – 04/04/2027 · Chịu tải: concurrency gặp k6

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 14 | 04/01/2027 | gd1-w3 (4–5) | gd2-w7 (1–2) | OCNJ ch.2 · OCNJ ch.12 |  |
| 15 | 11/01/2027 | gd1-w4 (1–2) | gd2-w7 (3–4) | EJ ch.5 · MJIA ch.5 |  |
| 16 | 18/01/2027 | gd1-w4 (3–4) | gd2-w8 (1–2) | EJ ch.7 · JavaScal ch.8 |  |
| 17 | 25/01/2027 | gd1-w5 (1–3) | gd2-w8 (3–4) | JCiP ch.2 · JCiP ch.3 |  |
| 18 🌴 | 01/02/2027 | — | — | JCiP ch.16 | Tết 2027 |
| 19 | 08/02/2027 | gd1-w5 (4–5) | gd2-w9 (1–2) | JCiP ch.4 · JCiP ch.5 |  |
| 20 | 15/02/2027 | gd1-w6 (1–2) | gd2-w9 (3–4) | JCiP ch.6 · JCiP ch.8 · JavaScal ch.6 |  |
| 21 | 22/02/2027 | gd1-w6 (3–4) | gd2-w10 (1–2) | JavaScal ch.7 · JCiP ch.11 · JCiP ch.10 |  |
| 22 | 01/03/2027 | gd1-w7 (1–2) | gd2-w10 (3–4), gd2-done | JavaScal ch.3 · JavaScal ch.5 | FlashSale v2-perf |
| 23 | 08/03/2027 | gd1-w7 (3–4) | — | MCJ ch.2 · MCJ ch.3 · MJIA ch.16 |  |
| 24 | 15/03/2027 | gd1-w11 (1–4) | gd3-w11 (1–2) | PG ch.16 · PG ch.20 · Kafka ch.3 |  |
| 25 | 22/03/2027 | gd1-w11 (5–7) | gd3-w11 (3–4) | Kafka ch.7 · PG ch.25 |  |
| 26 | 29/03/2027 | gd1-w13 (1–6) | gd3-w12 (1–2) | Kafka ch.4 · Kafka ch.8 | Review quý 2 · mock interview Java |

#### Quý 3 · 05/04 – 04/07/2027 · Event-driven và DevOps nền tảng

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 27 | 05/04/2027 | gd1-w13 (7–12), gd1-done | gd3-w12 (3–4) | JCiP ch.13 · JCiP ch.15 | Cổng Giai đoạn 1 · blog #1 |
| 28 | 12/04/2027 | gd2-w1 (1–4) | gd3-w13 (1–2) | SysProg ch.4 · SysProg ch.13 |  |
| 29 | 19/04/2027 | gd2-w1 (5–7) | gd3-w13 (3–4) | SSIA ch.13 · SSIA ch.15 |  |
| 30 | 26/04/2027 | gd2-w2 (1–3) | gd3-w14 (1–2) | JavaScal ch.1 · SysProg ch.11 |  |
| 31 | 03/05/2027 | gd2-w2 (4–6) | gd3-w14 (3–4) | JavaScal ch.2 · DDIA ch.5 |  |
| 32 | 10/05/2027 | gd2-w3 (1–3) | gd3-w15 (1–2) | WGJD ch.12 · Kafka ch.11 |  |
| 33 | 17/05/2027 | gd2-w3 (4–6) | gd3-w15 (3–4), gd3-done | OCNJ ch.8 · Kafka ch.6 | FlashSale v3-events |
| 34 | 24/05/2027 | gd2-w4 (1–3) | — | WGJD ch.11 · OCNJ ch.9 |  |
| 35 | 31/05/2027 | gd2-w4 (4–5) | gd4-w16 (1–2) | OCNJ ch.10 · OCNJ ch.11 |  |
| 36 | 07/06/2027 | gd2-w5 (1–3) | gd4-w16 (3–4) | OCNJ ch.1 · OCNJ ch.7 |  |
| 37 | 14/06/2027 | gd2-w5 (4–5) | gd4-w17 (1–2) | K8s ch.9 · K8s ch.11 |  |
| 38 | 21/06/2027 | gd2-w6 (1–3) | gd4-w17 (3–4) | K8s ch.8 · K8s ch.17 |  |
| 39 | 28/06/2027 | gd2-w6 (4–5) | gd4-w18 (1–2) | SysProg ch.14 · SSIA ch.9 | Review quý 3 |

#### Quý 4 · 05/07 – 03/10/2027 · Production-grade và góc nhìn SA

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 40 | 05/07/2027 | gd2-w7 | gd4-w18 (3–4) | SSIA ch.10 · WGJD ch.7 |  |
| 41 | 12/07/2027 | gd2-w8 (1–3) | gd4-w19 (1–2) | K8s ch.20 · K8s ch.6 |  |
| 42 | 19/07/2027 | gd2-w8 (4–5) | gd4-w19 (3–4), gd4-done | SysProg ch.18 · OCNJ ch.13 | FlashSale v4-prod |
| 43 | 26/07/2027 | gd2-w9 (1–2) | — | Kafka ch.13 · Kafka ch.12 |  |
| 44 | 02/08/2027 | gd2-w9 (3–4) | gd5-w20 (1–2) | DDIA ch.1 · DDIA ch.2 |  |
| 45 | 09/08/2027 | gd2-w10 (1–3) | gd5-w20 (3–4) | OCNJ ch.14 · DDIA ch.3 |  |
| 46 | 16/08/2027 | gd2-w10 (4–5) | gd5-w21 (1–2) | SSIA ch.14 · SSIA ch.16 |  |
| 47 | 23/08/2027 | gd2-w11 (1–2) | gd5-w21 (3–4) | DDIA ch.4 · PG ch.9 |  |
| 48 | 30/08/2027 | gd2-w11 (3–4) | gd5-w22 (1–2) | PG ch.10 · PG ch.11 |  |
| 49 | 06/09/2027 | gd2-w12 | gd5-w22 (3–4) | OCNJ ch.6 · WGJD ch.17 |  |
| 50 | 13/09/2027 | gd2-w13 | gd5-w23 (1–2) | OCNJ ch.15 · WGJD ch.18 |  |
| 51 | 20/09/2027 | gd2-done | gd5-w23 (3–4) | MJIA ch.18 · EJ ch.10 | Cổng Giai đoạn 2 · blog #2 |
| 52 | 27/09/2027 | — | gd5-w24 | EJ ch.8 · EJ ch.4 | Review quý 4 · hết năm 1 |

#### Quý 5 · 04/10/2027 – 02/01/2028 · Kubernetes: CKAD

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 53 | 04/10/2027 | gd3-w1 (1–4) | gd5-done, w1 | K8s ch.2 · K8s ch.3 | FlashSale v5-sa · hoàn tất dự án |
| 54 | 11/10/2027 | gd3-w1 (5–7) | w2 | K8s study-guide · K8s ch.9 |  |
| 55 | 18/10/2027 | gd3-w2 (1–2) | w3 | K8s ch.11 · K8s ch.12 |  |
| 56 | 25/10/2027 | gd3-w2 (3–4) | w4 | K8s ch.10 · K8s ch.13 |  |
| 57 | 01/11/2027 | gd3-w3 (1–3) | w5 | K8s ch.21 · JavaScal ch.7 |  |
| 58 | 08/11/2027 | gd3-w3 (4–5) | w6 | K8s ch.17 · K8s ch.18 |  |
| 59 | 15/11/2027 | gd3-w4 | w7 | K8s ch.15 · K8s ch.16 · K8s ch.8 |  |
| 60 | 22/11/2027 | gd3-w5 (1–3) | w8 (1–3) | K8s ch.14 · K8s cheat-sheet |  |
| 61 | 29/11/2027 | gd3-w5 (4–5) | w8 (4–6) | K8s ch.19 · K8s ch.7 |  |
| 62 | 06/12/2027 | gd3-w6 (1–3) | w10 | K8s ch.22 | Thi thử CKAD ≥ 80% ×2 → đặt lịch thi |
| 63 | 13/12/2027 | gd3-w6 (4–5) | — | K8s ch.4 · K8s ch.5 |  |
| 64 | 20/12/2027 | gd3-w7 (1–2) | — | OCNJ ch.8 · K8s ch.6 |  |
| 65 | 27/12/2027 | gd3-w7 (3–4) | — | DDIA ch.6 | Review quý 5 |

#### Quý 6 · 03/01 – 02/04/2028 · CKA, AWS, Terraform

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 66 | 03/01/2028 | gd3-w8 (1–2) | cka-w1 | K8s cka-study-guide | Thi CKAD |
| 67 | 10/01/2028 | gd3-w8 (3–4) | cka-w2 | K8s ch.1 · DDIA ch.7 |  |
| 68 | 17/01/2028 | gd3-w9 (1–3) | cka-w3 | K8s ch.5 · DDIA ch.8 |  |
| 69 🌴 | 24/01/2028 | — | — | — | Tết 2028 |
| 70 | 31/01/2028 | gd3-w9 (4–5) | cka-w4 | K8s ch.14 · K8s ch.13 |  |
| 71 | 07/02/2028 | gd3-w10 (1–3) | cka-w5 | K8s ch.15 · K8s ch.16 |  |
| 72 | 14/02/2028 | gd3-w10 (4–6) | cka-w6 | K8s ch.17 · K8s ch.18 · K8s ch.20 |  |
| 73 | 21/02/2028 | gd3-w11 (1–2) | cka-w7 | K8s ch.6 · K8s ch.8 |  |
| 74 | 28/02/2028 | gd3-w11 (3–4) | cka-w8 | K8s ch.21 · K8s ch.22 |  |
| 75 | 06/03/2028 | gd3-w11 (5–6) | cka-w9 | K8s cka-cheat-sheet | Thi thử CKA ≥ 80% ×2 → đặt lịch thi |
| 76 | 13/03/2028 | gd3-w12 (1–2) | — | DDIA ch.9 | Thi CKA |
| 77 | 20/03/2028 | gd3-w12 (3–3) | — | DDIA ch.10 |  |
| 78 | 27/03/2028 | gd3-done | — | — | Cổng Giai đoạn 3 · Review quý 6 |

#### Quý 7 · 03/04 – 02/07/2028 · Distributed systems

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 79 | 03/04/2028 | gd4-w1 (1–4) | — | Kafka ch.9 · Kafka ch.14 |  |
| 80 | 10/04/2028 | gd4-w1 (5–7) | — | Kafka ch.10 · Kafka ch.5 |  |
| 81 | 17/04/2028 | gd4-w2 (1–4) | — | DDIA ch.11 · DDIA ch.12 |  |
| 82 | 24/04/2028 | gd4-w2 (5–7) | — | DDIA ch.13 · PG ch.6 |  |
| 83 | 01/05/2028 | gd4-w3 (1–3) | — | PG ch.7 · PG ch.12 |  |
| 84 | 08/05/2028 | gd4-w3 (4–6) | — | PG ch.13 · PG ch.14 |  |
| 85 | 15/05/2028 | gd4-w4 (1–3) | — | MCJ ch.4 · MCJ ch.5 |  |
| 86 | 22/05/2028 | gd4-w4 (4–6) | — | MCJ ch.6 · MCJ ch.7 |  |
| 87 | 29/05/2028 | gd4-w5 (1–1) | — | DDIA ch.14 · EJ ch.11 |  |
| 88 | 05/06/2028 | gd4-w5 (2–2) | — | PG ch.17 · PG ch.21 |  |
| 89 | 12/06/2028 | gd4-w5 (3–3) | — | PG ch.22 · PG ch.23 |  |
| 90 | 19/06/2028 | gd4-w5 (4–4) | — | PG ch.19 · PG ch.28 |  |
| 91 | 26/06/2028 | gd4-w5 (5–5) | — | EJ ch.6 · EJ ch.9 | Review quý 7 |

#### Quý 8 · 03/07 – 01/10/2028 · System design và hồ sơ Senior

| Tuần | Từ | Trục Senior | FlashSale / K8s | Đọc | Mốc |
|---|---|---|---|---|---|
| 92 | 03/07/2028 | gd4-w6 (1–2) | — | EJ ch.12 · MJIA ch.9 |  |
| 93 | 10/07/2028 | gd4-w6 (3–4) | — | MJIA ch.19 · WGJD ch.15 |  |
| 94 | 17/07/2028 | gd4-w7 (1–2) | — | WGJD ch.16 · JCiP ch.14 |  |
| 95 | 24/07/2028 | gd4-w7 (3–4) | — | SSIA ch.17 · MCJ ch.8 |  |
| 96 | 31/07/2028 | gd4-w8 (1–2) | — | MJIA ch.10 · MJIA ch.11 |  |
| 97 | 07/08/2028 | gd4-w8 (3–3) | — | PG ch.3 · PG ch.4 |  |
| 98 | 14/08/2028 | gd4-w9 (1–1) | — | PG ch.5 · PG ch.8 |  |
| 99 | 21/08/2028 | gd4-w9 (2–2) | — | MJIA ch.12 · MJIA ch.13 |  |
| 100 | 28/08/2028 | gd4-w10 (1–2) | — | MJIA ch.14 · WGJD ch.2 |  |
| 101 | 04/09/2028 | gd4-w10 (3–4) | — | SysProg ch.6 · SysProg ch.7 |  |
| 102 | 11/09/2028 | gd4-w11 (1–5) | — | SysProg ch.8 · SysProg ch.10 |  |
| 103 | 18/09/2028 | gd4-w11 (6–10) | — | MJIA ch.21 · WGJD ch.5 |  |
| 104 | 25/09/2028 | gd4-done | — | — | Cổng Giai đoạn 4 · hết 24 tháng |

---

## 5. Mốc cố định

| Loại | Tuần → ngày | Điều kiện |
|---|---|---|
| Tag FlashSale | v0-design t4 (26/10/2026) · v1-monolith t12 (21/12/2026) · v2-perf t22 (08/03/2027) · v3-events t33 (21/06/2027) · v4-prod t42 (23/08/2027) · v5-sa t53 (04/10/2027) | Đủ DoD của giai đoạn, attack log đã ghi |
| Cổng giai đoạn Senior | GĐ1 t27 (05/04/2027) · GĐ2 t51 (20/09/2027) · GĐ3 t78 (27/03/2028) · GĐ4 t104 (25/09/2028) | ≥ 5/6 hoặc ≥ 6/7 tiêu chí khối *Nghiệm thu* |
| Review quý | t13 · t26 · t39 · t52 · t65 · t78 · t91 · t104 | 2 giờ, checklist ở [sj-11](11-do-luong-va-review.md) |
| Chứng chỉ lõi | **CKAD** thi t66 (03–09/01/2028) · **CKA** thi t76 (13–19/03/2028) | Thi thử ≥ 80% hai lần liên tiếp ở t62 / t75; chưa đạt thì lùi 3 tuần, không thi |
| Chứng chỉ tuỳ chọn | OCP Java SE 21: chỉ khi chọn, ôn thêm 6 tuần ngoài lịch ở quý 3 · CCDAK: chỉ khi công việc có Kafka, sau t80 | Không ăn vào khối lab/dự án |
| Blog | #1 @Transactional t27 · #2 CI/CD & observability t51 · #3 production-ready-platform t77 · #4 tổng kết t101 | Mỗi bài có số đo trước/sau |
| Nghỉ | Tết t18 (01–07/02/2027) · Tết t69 (24–30/01/2028) · sau tag FlashSale: t13, t23, t34, t43, t52 (chỉ nghỉ dự án) | Không lab; đọc nhẹ được |

---

## 6. Phân hạng sách — bản 17 lĩnh vực

| Hạng | Nghĩa | Lĩnh vực | Ở đâu trong lịch |
|---|---|---|---|
| **A — đọc trọn, có lab, có Feynman note** | Mọi chương trong lịch | JCiP (10 chương), JPA (11 chương chọn theo dự án), Java Scalability (10 bài), OCNJ (15 chương), giáo trình CKAD + CKA | Quý 1–2 (JCiP, JPA, Java Scalability), quý 1–4 rải OCNJ, quý 5–6 K8s |
| **B — đọc chọn chương theo việc** | Chương nào dự án hoặc trục cần | Effective Java (11/11 chương nhưng rải 2 năm), Modern Java (12 chương), WGJD (14 chương), Modern Concurrency (7), Spring Security (13), Kafka (12), DDIA (14 — đọc lần đầu just-in-time, đọc lại có kỷ luật ở quý 7), PG Internals (22 chương) | Theo cột *Đọc* của từng tuần |
| **C — tra cứu khi cần** | Không có trong lịch, mở khi vướng | Spring Start Here (bạn đã 4 năm Spring), Sysprog (trừ 8 chương trong lịch), Kubernetes in Action, KUAR, CKS, CKA Study Guide phần còn lại | Tìm kiếm toàn cục `⌘K` |

Tổng chương trong lịch: **≈ 205 chương / 104 tuần**, trung bình 2 chương/tuần, không tuần nào quá 4. So với 178–210 tuần nếu đọc trọn theo track — đây là phần "cắt" đã làm sẵn để bạn không phải cắt lúc mệt.

---

## 7. Khác gì so với sj-05

| Điểm | sj-05 (09/2026, 14 lĩnh vực) | Tài liệu này |
|---|---|---|
| FlashSale | Không biết đến | Trục lab, nửa tốc, xong tuần 53 |
| Effective Java | Sách ngoài | Trong kho, 11 chương rải 2 năm |
| PG Internals | Chưa có | 22 chương chọn, quý 2/4/7/8 |
| Giai đoạn 2 DevOps | "Học tay trên VPS" | FlashSale GĐ4 + Linux/networking trên VPS |
| Kafka | Quý 7–8 | Chạm quý 2–3 qua FlashSale, học có hệ thống quý 7 |
| Thứ tự GĐ1 | Theo track | Xếp lại theo dự án (§3.2) |
| Ngày | Tháng | Tuần có ngày bắt đầu, trong app |
| Giờ học | Mẫu nhịp tuần | Nhật ký giờ trong app, ba chế độ tuần (sj-07) |
| Ghi chép / thực hành / xuyên stack | Nguyên tắc | Ba tài liệu riêng có mẫu và bản đồ (sj-08, 09, 10) |

Những gì sj-05 nói về *vòng học một tài liệu*, *ba công cụ đo*, *chiến lược chứng chỉ* và *bẫy phương pháp* vẫn đúng và không lặp lại ở đây.

---

## 8. Dùng tài liệu này với app như thế nào

1. Mở **🗓️ Kế hoạch tuần** (nhóm *Kế hoạch* ở đầu thanh bên, có ở mọi lĩnh vực). Lần đầu, kiểm tra ngày bắt đầu (mặc định 05/10/2026) và giờ mục tiêu (mặc định 9). Nếu bạn bắt đầu muộn, đổi ngày bắt đầu — toàn bộ lịch dịch theo, id mục không đổi.
2. Mỗi tuần, trang đó gom: lát trục Senior, lát FlashSale, chương đọc, việc thực hành, việc viết, và mốc. Tick mục **ngay tại đó** khi đạt *Hoàn thành khi*; tick chương khi đã đọc.
3. Sau mỗi buổi, ghi **một dòng giờ học** (ngày, giờ, loại). Cuối tuần nhìn tổng so với mục tiêu; ba tuần liên tiếp dưới 60% là tín hiệu đổi chế độ tuần (sj-07 §3).
4. Thẻ **Nợ tuần trước** liệt kê mục chưa tick của các tuần đã qua. Luật: còn nợ lab thì tuần này không đọc chương mới.
5. Tuần 13, 26, 39… trang hiện checklist **review quý**; các tuần khác hiện checklist **review tuần**. Tick để lưu ngày làm.
6. Tiến độ lịch, giờ học, nghi thức đều nằm trong bản xuất JSON ở ⚙️ Cài đặt — xuất mỗi cuối tháng.
