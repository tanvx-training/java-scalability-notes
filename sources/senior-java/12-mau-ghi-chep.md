# Mẫu ghi chép và checklist tuần đầu

> Copy-dán. Mỗi mẫu có giới hạn dài để chống cầu toàn. Thư mục đích theo [sj-08 §2.2](08-cach-hoc-va-ghi-chep.md). Ngày trong mẫu là ví dụ.

---

## 1. Feynman note — `feynman/<khai-niem>.md` (≤ 60 dòng, 30 phút)

```markdown
---
field: jcip
thread: T3
sources: ["#/docs/jcip-03", "#/docs/java-04"]
updated: 2027-02-14
---
# Vì sao volatile đủ cho cờ stop nhưng không đủ cho counter

## Giảng cho junior (≤ 10 câu, không thuật ngữ chưa giải thích)
Tưởng tượng hai người cùng ghi vào một bảng trắng …

## Cơ chế thật (≤ 15 dòng, có thuật ngữ gốc)
- visibility: …
- atomicity: …
- JMM happens-before: …

## Hình
```mermaid
sequenceDiagram …
```

## Ví dụ của tôi
- Lab `java-deep-dive/concurrency/StopFlag.java`: bỏ volatile → treo sau ~1s (JIT hoist).
- FlashSale: `processed_events` dùng … vì …

## Bẫy tôi đã mắc / sẽ mắc
1. …

## Câu tự kiểm (trả lời không nhìn, tuần sau)
1. …
2. …
```

## 2. Concept card — `concepts/<khai-niem>.md` (≤ 15 dòng, 5 phút)

```markdown
---
field: jpa
thread: T3
sources: ["#/docs/jpa-11"]
---
**Hỏi:** Optimistic locking bằng @Version bắt được gì và bỏ lọt gì?
**Đáp:** Bắt lost update giữa hai transaction đọc–sửa cùng bản ghi (so version khi UPDATE). Không bắt: phantom, write skew qua nhiều bản ghi, race ngoài transaction (cache).
**Ví dụ của tôi:** FlashSale Inventory.version, test 100 thread → 90 OptimisticLockException, retry 3 lần.
**Bẫy:** retry không giới hạn thành livelock dưới tải; @Version trên entity cache L2 stale.
**Liên quan:** [[pg-isolation]], [[redis-lua-atomic]]
```

## 3. Lab log — `labs/YYYY-wNN-<ten>.md` hoặc README thư mục lab (20–40 dòng)

```markdown
# Lab: virtual threads vs platform threads trên API đặt hàng (tuần 20)

**Giả thuyết (viết trước khi chạy):** p99 giảm ≥ 30% khi bật virtual threads vì API chờ Redis + PG.
**Cách đo:** k6 spike 0→10.000 VU/10s giữ 60s; commit `a1b2c3d`; compose.perf; 3 lần mỗi cấu hình; JDK 25.

| Cấu hình | p50 | p95 | p99 | error | CPU |
|---|---|---|---|---|---|
| platform, threads.max=200 | … | … | … | … | … |
| virtual | … | … | … | … | … |

**Kết luận:** … (giả thuyết đúng/sai, vì sao — điểm nghẽn dời sang Hikari pending 40)
**Làm hỏng nó:** giảm Hikari về 5 → p99 tăng gấp 4, pending = 195. Triệu chứng: …
**Làm lại thì đổi gì:** đo pinned events; tách kịch bản đọc/ghi.
**Câu CV:** Bật virtual threads + tính lại pool, p99 API đặt hàng 780 → 260 ms ở 10k VU.
**Link:** #/roadmap/sj-gd1/sj-gd1-w6-2 · #/docs/java-05 · FlashSale docs/perf/report.md#w20
```

## 4. Nhật ký tuần — `journal/YYYY-WNN.md` (10–15 dòng, 10 phút, Chủ nhật)

```markdown
# 2026-W41 · Tuần lịch 1 · 05–11/10 · Chế độ: Đủ

**Giờ:** 8,75 (đọc 2 · lab 1,5 · dự án 2,5 · viết 1 · ôn 1,75)
**Đã tick:** sj-gd1-w1-1..3 · fs-gd0-w1-1..2 · đọc sj-06, sj-07, MJIA ch.1
**Số đo của tuần:** ma trận tuần 0 = M1 18% · M2 42% · M3 8% · M4 15% · M5 5%; phỏng vấn java L1 4/6, L2 2/6
**Nợ:** —
**Note ôn (1–7–30):** —
**Điều tôi hiểu khác so với đầu tuần:** …
**Tuần sau:** chế độ Đủ; công ty release thứ Năm → dời dự án buổi 2 sang thứ Bảy sáng
```

## 5. Review quý — `reviews/YYYY-Qn.md` (1 trang, 2 giờ)

```markdown
# Review Q1 · tuần 13 · 03/01/2027

## Ma trận (so quý trước theo module)
| Module | Tuần 0 | Q1 | Mục tiêu Q1 | Lệch |
|---|---|---|---|---|
| M1 Java/JVM/concurrency | 18 | 27 | 25 | +2 |
| … |

## Phỏng vấn làm lại (lĩnh vực: jpa, java)
| Lĩnh vực | L1 | L2 | L3 | L4 | Rụng vì |
|---|---|---|---|---|---|

## Cổng / DoD
- FlashSale v1-monolith: 11/11 ✓ (link tag)

## CV — dòng mới quý này (mỗi dòng có số)
- …

## Giờ 13 tuần: tổng … / mục tiêu 117 · tuần thấp nhất … (lý do)
## 5 dòng: quý này tôi làm được gì mà 3 tháng trước chưa làm được?
1. …
## Quyết định: giữ nguyên / thu hẹp (bỏ …) / mở rộng (thêm …)
## Phần thưởng mốc tới: …
```

## 6. Câu chuyện production — `interview/production-stories.md` (5 dòng STAR mỗi chuyện)

```markdown
### Cạn connection pool khi payment chậm (FlashSale chaos, tuần 33)
- **Bối cảnh:** k6 10k VU, payment-service bị delay 5s cố ý.
- **Việc:** p99 API đặt hàng vọt 4s, Hikari pending 180, Tomcat busy 200/200.
- **Hành động:** đọc thread dump (200 thread RUNNABLE ở socketRead0 → chờ payment), thêm timeout 800ms + circuit breaker, dời gọi payment ra ngoài transaction.
- **Kết quả:** p99 về 310ms dưới cùng chaos; 0 đơn mất (saga bù).
- **Bài học:** captive connection = bẫy 2 của @Transactional; timeout budget phải nhỏ hơn timeout của LB.
```

## 7. Postmortem mini — FlashSale `docs/postmortem-NNN.md` (≤ 1 trang)

```markdown
# Postmortem 001 — Redis mất 90s, oversell 0 nhưng 412 đơn treo
**Ngày/giờ · thời lượng · mức độ:** …
**Tác động (số):** …
**Dòng thời gian:** hh:mm sự kiện … (phát hiện bằng alert nào)
**Nguyên nhân gốc:** …
**Điều gì đã đúng:** …
**Hành động:** | việc | chủ | hạn | (≥ 1 việc là test/alert)
**Bài học cho sợi chỉ:** T6, T10
```

## 8. Design doc mini (công ty, quý 8) — ≤ 3 trang

```markdown
# <Tên> — design doc
1. Vấn đề và số hiện tại (p99, chi phí, lỗi/tuần)
2. Mục tiêu / không mục tiêu (NFR có số)
3. Phương án A / B / C — bảng đánh đổi (độ phức tạp, rủi ro, chi phí, thời gian)
4. Thiết kế chọn: sơ đồ C4 Container, luồng dữ liệu, mô hình nhất quán, failure mode
5. Kế hoạch triển khai theo pha, rollback, cách đo thành công
6. Câu hỏi mở · Người review · Trạng thái
```

## 9. Sợi chỉ xuyên stack — `threads/T3-dung-dan-duoi-dong-thoi.md` (cập nhật dần)

```markdown
# T3 · Đúng đắn dưới đồng thời
**Câu hỏi dẫn:** (chép từ sj-10)

## Câu chuyện xuyên tầng (viết lại mỗi quý, ≤ 20 câu)
…

## Từng tầng góp gì (thêm 3–5 dòng mỗi khi đọc chương chạm sợi)
### JVM — JCiP 2–3 (tuần 17)
- Hứa: …  Không hứa: …  Số: …  Bẫy: …
### PostgreSQL — PG 2 (tuần 8)
- …

## Điểm chạm FlashSale (link commit/ADR)
## Câu phỏng vấn tôi đã rụng ở sợi này
```

## 10. Đoạn "hệ của tôi chọn gì" cho mỗi chương DDIA (5–8 câu, quý 7)

```markdown
### DDIA ch.6 Replication
FlashSale dùng PG single-primary + streaming replica (chưa bật), Kafka replication factor 3 min.insync 2.
Đang chọn: đọc từ primary → nhất quán mạnh, mất khả năng scale đọc.
Trả giá: RPO ≈ 0 chỉ khi synchronous_commit=on; failover tay.
Nếu 10× tải: đọc catalog từ replica (stale ≤ 1s chấp nhận), đơn hàng vẫn primary.
Không biết: lag replica dưới k6 — đo ở tuần 88.
```

---

## 11. Checklist tuần đầu tiên — 05–11/10/2026

- [ ] Thứ Hai: chạy app (`./webapp/scripts/dev.sh`), mở 🗓️ Kế hoạch tuần, kiểm tra ngày bắt đầu 05/10/2026 và giờ mục tiêu 9; đọc sj-06 §2–3 và sj-07 §1–3 (đây là khối Đọc 1).
- [ ] Thứ Hai: tạo 5 sự kiện lặp trong calendar (sj-07 §7) + 8 sự kiện review quý + 2 sự kiện thi.
- [ ] Thứ Ba: chấm **ma trận tuần 0** thật thà; làm 6 câu L1 + 6 câu L2 của *Java & Spring Boot Scalability*; ghi vào `reviews/2026-W0.md`.
- [ ] Thứ Ba: tạo repo `learning-notes` (8 thư mục, README), `java-deep-dive` (6 thư mục), `flashsale` (theo fs-01); commit đầu tiên cả ba.
- [ ] Thứ Tư: đọc MJIA ch.1 với hướng dẫn đọc; concept card đầu tiên; đánh dấu đã đọc.
- [ ] Thứ Năm: FlashSale buổi 1–2 (fs-gd0-w1-1, -2): `docs/requirements.md` với user story, NFR, abuse case; ước lượng back-of-the-envelope.
- [ ] Thứ Bảy: sj-gd1-w1 mục 1–3 (SDKMAN JDK, project Maven, đọc EJ 2 với lab "gõ lại + ví dụ riêng"); ghi giờ từng buổi trong app.
- [ ] Chủ nhật: nhật ký tuần `journal/2026-W41.md`; tick mục đạt *Hoàn thành khi*; tick 5 ô nghi thức tuần trong app; chọn chế độ tuần 2; xuất JSON.

Sau tuần này bạn có: một số đo, ba repo, một note, một dòng giờ học, một thói quen. Phần còn lại của 24 tháng là lặp lại.
