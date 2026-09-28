# Đo lường và review — biết mình đang ở đâu, và làm gì khi trượt

> Bốn thước đo, hai nghi thức có ngày, mục tiêu ma trận theo quý, lịch dùng ngân hàng phỏng vấn, dòng thời gian bằng chứng, và luật khi trượt hay khi vượt. Mọi thứ ở đây đều có chỗ bấm trong app; tài liệu này nói *khi nào bấm và đọc kết quả ra sao*.

---

## 1. Bốn thước đo và câu mỗi thước trả lời

| Thước | Ở đâu | Trả lời | Không trả lời |
|---|---|---|---|
| **Ma trận năng lực** (96 tiêu chí × 4 cấp) | 📊 lĩnh vực Lộ trình Senior Java | Tôi *thật sự* làm được gì (chỉ tick sau khi trình bày/đã làm) | Tôi đã đọc bao nhiêu |
| **Ngân hàng phỏng vấn** (336 câu, 4 cấp) | 🎤 mỗi lĩnh vực | Tôi rụng ở tầng nào: lý thuyết, code, đánh đổi, hay sự cố | Tôi giỏi hơn tuần trước không (chỉ khi làm lại đúng bộ) |
| **Tiến độ lịch** (mục + chương theo tuần) | 🗓️ Kế hoạch tuần, 🗺️ Lộ trình | Tôi đang đúng nhịp hay nợ | Tôi có hiểu không |
| **Giờ học** (nhật ký buổi) | 🗓️ Kế hoạch tuần | Kế hoạch có khớp đời sống không | Chất lượng giờ đó |

Đọc *cặp*: tiến độ lịch cao mà ma trận không nhích = tick sớm. Giờ đủ mà tiến độ thấp = ước lượng sai hoặc làm ngoài lịch. Phỏng vấn đạt L1–L2 mà rụng L3 = thiếu lab đánh đổi, không thiếu đọc.

---

## 2. Review tuần — 15 phút, Chủ nhật

Checklist này hiện trong thẻ **Nghi thức** của trang Kế hoạch tuần; tick ở đó để lưu ngày.

1. Viết nhật ký tuần theo mẫu (10 phút): chế độ tuần, giờ theo loại, mục đã tick, số đo của tuần, nợ, note ôn, chế độ tuần sau.
2. Tick lộ trình **chỉ** mục đạt *Hoàn thành khi*. Mục làm dở để nguyên; nó hiện ở *Nợ tuần trước* — đó là chức năng, không phải lỗi.
3. Đọc lại 1 Feynman note cũ theo lịch 1–7–30; sửa nếu giờ hiểu khác.
4. Đặt 5 khối tuần sau vào calendar; chọn chế độ tuần (sj-07 §3).
5. Cuối tháng: xuất JSON tiến độ vào `learning-notes/exports/`, commit.

---

## 3. Review quý — 2 giờ, tám lần

| # | Tuần | Chủ nhật | Trọng tâm review | Cổng đi kèm |
|---|---|---|---|---|
| Q1 | 13 | 03/01/2027 | Nếp học đã thành chưa; FlashSale v1 đúng chưa | — |
| Q2 | 26 | 04/04/2027 | Mock interview Java; concurrency có đo được không | Cổng GĐ1 tuần 27 |
| Q3 | 39 | 04/07/2027 | Event-driven chạy thật; CI/CD có số | — |
| Q4 | 52 | 03/10/2027 | Hết năm 1: portfolio, blog #1–2, SAD FlashSale | Cổng GĐ2 tuần 51; v5-sa tuần 53 |
| Q5 | 65 | 02/01/2028 | Sẵn sàng thi CKAD chưa (thi thử ≥ 80% ×2) | Thi CKAD tuần 66 |
| Q6 | 78 | 02/04/2028 | CKA đã thi; platform dựng lại được trong một buổi | Cổng GĐ3 tuần 78 |
| Q7 | 91 | 02/07/2028 | DDIA nói được bằng hệ của mình; distributed-patterns-demo | — |
| Q8 | 104 | 01/10/2028 | Hồ sơ Senior; quyết định 24 tháng tiếp | Cổng GĐ4 tuần 104 |

Chương trình 2 giờ (checklist trong app ở tuần 13, 26, …):

| Phút | Việc | Ghi vào |
|---|---|---|
| 0–30 | Chấm lại ma trận, **so với quý trước theo module** (không so tổng) | `reviews/YYYY-Qn.md` bảng module |
| 30–60 | Làm lại 24 câu phỏng vấn của lĩnh vực vừa xong; ghi rụng tầng nào | `interview/` sổ rụng |
| 60–75 | Chấm checklist cổng giai đoạn (nếu có) / DoD giai đoạn FlashSale | Khối *Nghiệm thu* trong app |
| 75–95 | Cập nhật CV (mỗi dòng có số), dọn README repo mới, pin repo | CV bản quý trong `reviews/` |
| 95–105 | Xuất JSON tiến độ, commit; kiểm tra biểu đồ giờ 13 tuần | `exports/` |
| 105–120 | Viết 5 dòng "quý này tôi làm được gì mà 3 tháng trước chưa làm được"; quyết định thu hẹp/giữ/mở rộng (§6) | `reviews/YYYY-Qn.md` |

---

## 4. Mục tiêu ma trận theo quý

Ma trận có 6 module (M1 Java/JVM/concurrency · M2 Spring · M3 distributed · M4 DB scaling/cache · M5 cloud-native · M6 GenAI). Số dưới là **% tiêu chí tick được thành thật** trong module, tối thiểu để coi là đúng nhịp.

| Quý | M1 | M2 | M3 | M4 | M5 | Tổng | Lý do |
|---|---|---|---|---|---|---|---|
| Tuần 0 | ghi thật | ghi thật | ghi thật | ghi thật | ghi thật | — | Điểm xuất phát |
| Q1 | 25 | 40 | 10 | 20 | 5 | ≈ 20 | Spring, transaction, JPA đi trước |
| Q2 | 50 | 50 | 15 | 35 | 5 | ≈ 30 | JCiP, pool, index |
| Q3 | 55 | 55 | 35 | 40 | 20 | ≈ 40 | Kafka qua FlashSale, CI/CD |
| Q4 | 60 | 60 | 45 | 50 | 35 | ≈ 50 | Observability, SA |
| Q5 | 60 | 60 | 45 | 50 | 55 | ≈ 55 | CKAD |
| Q6 | 65 | 65 | 50 | 55 | 75 | ≈ 62 | CKA, Terraform |
| Q7 | 75 | 70 | 75 | 70 | 75 | ≈ 73 | DDIA, resilience, Redis |
| Q8 | 85 | 85 | 85 | 80 | 80 | ≈ 83 | Design doc, mock |

Ngưỡng của Hướng dẫn học (25/50/75/100%) là mốc *cổng*; bảng này là *đường*. Đích thực tế của sj-05 §6 (M1–M2 đạt L3 ở ≥ 70% chủ đề, M4 ≥ 50%, M3/M5 L2 ≥ 70%) tương đương ≈ 80–85% tổng — 100% là lý tưởng, không phải điều kiện đổi chức danh.

---

## 5. Lịch dùng ngân hàng phỏng vấn

| Lĩnh vực | Lần 1 (L1–L2, 12 câu) | Lần 2 (L3–L4, 12 câu) | Lần 3 (24 câu, đo quên) |
|---|---|---|---|
| java (Scalability) | Tuần 1 (tuần 0) | Tuần 26 | Tuần 39 |
| jpa | Tuần 10 | Tuần 26 | Tuần 39 |
| spring-security | Tuần 12 | Tuần 46 | Tuần 65 |
| jcip | Tuần 20 | Tuần 27 | Tuần 39 |
| modern-java · effective-java · wgjd | Tuần 16 (mỗi bộ 6 câu) | Tuần 27 | Tuần 52 |
| modern-concurrency | Tuần 23 | Tuần 86 | Tuần 103 |
| kafka | Tuần 33 | Tuần 80 | Tuần 103 |
| ocnj | Tuần 42 | Tuần 52 | Tuần 91 |
| pg-internals | Tuần 48 | Tuần 90 | Tuần 103 |
| ddia | Tuần 52 | Tuần 91 | Tuần 103 |
| sysprog | Tuần 31 (6 câu chọn) | — | — |
| Kubernetes (220 trắc nghiệm + thi thử) | Tuần 54 trở đi hằng tuần | Thi thử tuần 60–62, 73–75 | — |

Sổ "rụng ở tầng nào" (`interview/`): mỗi lần ghi 1 dòng/lĩnh vực: `tuần · lĩnh vực · L1 x/6 · L2 x/6 · L3 x/6 · L4 x/6 · rụng vì`. Rụng L2 → lab; L3 → đọc lại mục "vì sao không chọn cách kia"; L4 → tái hiện sự cố bằng chaos.

---

## 6. Bằng chứng theo ngày

| Ngày | Bằng chứng | Kiểm chứng được bằng |
|---|---|---|
| 11/10/2026 | Điểm ma trận tuần 0; repo `learning-notes`, `java-deep-dive`, `flashsale` có commit đầu | `reviews/2026-W0.md`, 3 repo |
| 01/11/2026 | FlashSale `v0-design` | tag, `docs/adr` 2 ADR, CI xanh |
| 27/12/2026 | FlashSale `v1-monolith` | test 100 thread xanh 10 lần, coverage ≥ 80% |
| 14/03/2027 | FlashSale `v2-perf`; 12 lab `java-deep-dive` | `docs/perf/report.md` có p99 trước/sau |
| 11/04/2027 | Cổng GĐ1; blog #1; 2 case optimize ở công ty | 6 tiêu chí nghiệm thu; URL blog; số trước/sau |
| 27/06/2027 | FlashSale `v3-events` | chaos tắt payment 100% đúng |
| 29/08/2027 | FlashSale `v4-prod` | postmortem-001, CI có SCA+DAST xanh |
| 26/09/2027 | Cổng GĐ2; blog #2; repo `springboot-cicd-observability` | 7 tiêu chí; dashboard Grafana app thật |
| 10/10/2027 | FlashSale `v5-sa` | SAD arc42, threat model, TCO, bài viết công khai |
| 09/01/2028 | **CKAD** | chứng chỉ |
| 19/03/2028 | **CKA** | chứng chỉ |
| 02/04/2028 | Cổng GĐ3; blog #3; repo `production-ready-platform` | dựng lại EKS trong một buổi, có chi phí/giờ |
| 09/07/2028 | Design doc #1 được review; `distributed-patterns-demo` | biên bản review; README 4 pattern có chaos test |
| 24/09/2028 | Design doc #2; 2 mock system design; blog #4; CV Senior | ghi âm mock; CV mỗi dòng có số |
| 01/10/2028 | Cổng GĐ4; ma trận ≈ 83%+ | 7 tiêu chí; `reviews/2028-Q3.md` |

---

## 7. Luật khi trượt, luật khi vượt

**Trượt** (ở review quý, mục tiêu ma trận thấp hơn bảng §4 ≥ 10 điểm hoặc cổng không đạt):

1. Quý đầu trượt: **không đổi gì**, ghi nguyên nhân (giờ? tick sớm? ước lượng?). Một quý là nhiễu.
2. Hai quý liên tiếp trượt: **thu hẹp** — bỏ chứng chỉ tuỳ chọn, bỏ Hạng B của một con đường (thường PG Internals), giảm mục tiêu giờ về 6. Không kéo dài vô hạn, không bỏ cuộc.
3. Cổng giai đoạn không đạt: **ở lại tối đa 4 tuần** trả đúng tiêu chí thiếu (dùng tuần review + tuần *Trắng* dự trữ), rồi đi tiếp dù còn 1 tiêu chí — ghi nợ vào review quý, trả ở tuần buffer (13, 52, 102–103).
4. Thi thử chứng chỉ chưa ổn định ≥ 80% hai lần: lùi lịch thi 3 tuần, tối đa 2 lần. Lần thứ 3 vẫn chưa → thi CKAD thôi, bỏ CKA sang năm 3.

**Vượt** (ma trận cao hơn bảng ≥ 10 điểm và giờ ghi ≤ mục tiêu):

1. Không tăng tốc lịch — tăng **độ sâu**: chương Hạng B thành Hạng A (thêm lab), thêm buổi tấn công, thêm chaos.
2. Có thể mở chứng chỉ tuỳ chọn (OCP ở quý 3, CCDAK sau tuần 80) — vẫn không ăn vào khối dự án.
3. Chuyển nhiều việc hơn sang tầng 3 (công ty): design doc sớm hơn, mentor sớm hơn.

---

## 8. Dấu hiệu cần dừng lại và nghĩ

- Ba review quý liên tiếp bạn viết "quý này tôi làm được gì" mà không có con số nào → bạn đang học, không thực hành. Về sj-09 §4.
- Ma trận M5 (cloud-native) tăng nhanh nhất và bạn thích nó nhất → cân nhắc rẽ Platform/SRE ở quý 6 (lộ trình gốc cho phép); giai đoạn 4 đổi system design thành SLO, incident, GitOps.
- FlashSale xong `v3-events` mà bạn không muốn làm tiếp GĐ4–5 → dừng dự án ở đó là hợp lệ (sj-07 §5); trục Senior vẫn đủ.
- Bạn được thăng chức hoặc đổi việc giữa chừng → làm lại tuần 0 (ma trận, phỏng vấn), giữ lịch, đổi tầng 3 sang công ty mới.
