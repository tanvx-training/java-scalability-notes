// Ngân hàng câu hỏi phỏng vấn JPA — 24 câu, 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Java Persistence with Spring Data and Hibernate
// (Cătălin Tudose — Manning). Mỗi câu trỏ chương nguồn qua `refs` để tra ngược.
//
// Thang cấp độ lấy nguyên từ ma trận năng lực Senior Java (senior-java/matrix.js):
//   1 Hiểu lý thuyết · 2 Thực thi mã nguồn · 3 Phân tích đánh đổi ·
//   4 Thiết kế & xử lý sự cố
//
// HỢP ĐỒNG THEO CẤP (check-data.mjs nhóm #IQ ép, không phải gợi ý):
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (jpa-iq01–jpa-iq24) — thống kê tự chấm trong localStorage lưu theo id.

export const jpaInterview = [];
