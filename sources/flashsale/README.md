# FlashSale — pet project 24 tuần

Kế hoạch dự án thực hành của tác giả repo: nền tảng flash sale chịu tải cao, event-driven (10.000
người tranh 500 sản phẩm trong 1 phút; 0 oversell, 0 double-charge). Đi qua 6 giai đoạn, mỗi giai
đoạn kết thúc bằng một tag Git, kèm một luồng security tự tấn công chạy song song. **Không phải bản
dịch** — không có giấy phép bên thứ ba. Đọc trong app ở lĩnh vực *Pet project FlashSale*, lộ trình
tick được theo từng buổi ở 6 track `fs-gd0`…`fs-gd5`.

| # | Tài liệu | Nội dung |
|---|---|---|
| 00 | [Kế hoạch & theo dõi tiến độ](00-ke-hoach-tong-quan.md) | Bài toán, NFR, stack, bảng tiến độ, tóm tắt 6 giai đoạn, luồng security, nhật ký ADR |
| 01 | [Thiết lập môi trường](01-thiet-lap-moi-truong.md) | Yêu cầu máy, công cụ theo giai đoạn, script cài đặt, IDE, lỗi thường gặp, smoke test |
| 02 | [Giai đoạn 0 — Thiết kế trước khi code](02-giai-doan-0.md) | Tuần 1–2: requirements, ước lượng, C4, ADR-001/002, threat model v0, khung repo và CI |
| 03 | [Giai đoạn 1 — Modular monolith](03-giai-doan-1.md) | Tuần 3–6: Spring Modulith, domain và schema, API, idempotency, optimistic locking, Keycloak |
| 04 | [Giai đoạn 2 — Chịu tải flash sale](04-giai-doan-2.md) | Tuần 7–10: k6, profiling, Redis Lua, token hàng chờ, rate limit, virtual threads, JMH |
| 05 | [Giai đoạn 3 — Event-driven](05-giai-doan-3.md) | Tuần 11–15: Kafka, outbox, saga, consumer idempotent, DLQ, tách service, contract test |
| 06 | [Giai đoạn 4 — Production-grade](06-giai-doan-4.md) | Tuần 16–19: OpenTelemetry, SLO, container, kind + Helm, supply chain, resilience, chaos, postmortem |
| 07 | [Giai đoạn 5 — Góc nhìn SA](07-giai-doan-5.md) | Tuần 20–24: SAD arc42, threat model đầy đủ, TCO và ADR-008, Well-Architected, GraalVM, tech talk |
| 08 | [Security xuyên suốt](08-security.md) | Vòng xây–tấn công–sửa, bộ công cụ, attack log, secure coding, secrets, supply chain, ASVS |
| 09 | [Quy ước & tự đánh giá](09-quy-uoc-tu-danh-gia.md) | Nhịp tuần, git workflow, ADR, DoD chung, nhật ký học, bảng tự đánh giá Senior/SA, rủi ro, ngân sách |
