# Roadmap 24 tháng: Từ Mid-level Java lên Senior Java + DevOps

## Bức tranh tổng thể

| Giai đoạn | Thời gian | Trọng tâm | Output cuối giai đoạn |
|---|---|---|---|
| 1 | Tháng 1–6 | Java & Spring chuyên sâu | Repo `deep-dive-notes` + 2 case optimize thực tế tại công ty + pass mock interview Java Senior |
| 2 | Tháng 6–12 | DevOps nền tảng (CI/CD, Docker, Observability) | Pipeline CI/CD hoàn chỉnh tự động hóa deploy + dashboard monitoring cho app thật |
| 3 | Tháng 12–18 | Kubernetes, Cloud (AWS), Terraform | Repo `production-ready-platform`: Terraform → K8s → Helm → autoscaling → monitoring, dựng từ số 0 + 1 chứng chỉ |
| 4 | Tháng 18–24 | Distributed systems & System design | 2 design doc được team triển khai + repo microservices demo + pass mock system design Senior |

Tỷ trọng học: **70% Java / 30% DevOps** trong 12 tháng đầu, chuyển dần sang 50/50 từ giai đoạn 3.

## Cách dùng bộ tài liệu này

1. Mỗi giai đoạn có 1 file riêng (`01` → `04`), trong đó có: mục tiêu, kế hoạch theo tuần, tài nguyên học, cách áp dụng tại công ty, checklist đánh giá và output bắt buộc.
2. **Không đọc trước quá 1 giai đoạn.** Tập trung hoàn thành giai đoạn hiện tại, tránh "học rộng chết nông".
3. Kế hoạch tuần được thiết kế cho **8–10 giờ/tuần** ngoài giờ làm (ví dụ: 1.5h × 4 tối + 3–4h cuối tuần). Nếu chỉ có 5–6 giờ/tuần, nhân thời lượng mỗi giai đoạn với 1.5.
4. Nguyên tắc vàng: **học gì áp dụng ngay vào công việc đó**. Task ở công ty là phòng lab tốt nhất và là bằng chứng thăng chức tốt nhất.

## Nghi thức review hàng quý (bắt buộc, 2 giờ/lần)

Cuối tháng 3, 6, 9, 12, 15, 18, 21, 24 — dành 1 buổi làm các việc sau:

- [ ] Chấm điểm checklist đánh giá của giai đoạn hiện tại (đạt / chưa đạt từng mục)
- [ ] Cập nhật CV: thêm thành tích đo được (con số trước/sau) trong quý
- [ ] Dọn GitHub: README rõ ràng cho các repo mới, pin repo tốt nhất
- [ ] Viết 1 đoạn ngắn trả lời: "Quý này tôi làm được gì mà 3 tháng trước tôi chưa làm được?"
- [ ] Nếu 2 quý liên tiếp trượt mục tiêu → thu hẹp phạm vi giai đoạn (bỏ mục "nâng cao"), không bỏ cuộc

## Quy tắc chung khi học

- **Đọc sách kỹ thuật**: 1 chương/tuần, mỗi chương phải sinh ra 1 ghi chú + 1 đoạn code thử nghiệm. Đọc mà không code = chưa đọc.
- **Ghi chú kiểu Feynman**: sau mỗi chủ đề, viết lại bằng lời của mình như đang giảng cho junior. Không viết lại được = chưa hiểu.
- **Portfolio xuyên suốt**: mọi output đổ về GitHub cá nhân. Sau 24 tháng, GitHub + blog + CV là bộ hồ sơ Senior hoàn chỉnh.
- **Mock interview**: cuối giai đoạn 1 và 4 có mock interview. Tìm đồng nghiệp senior, mentor, hoặc dùng nền tảng như Pramp/interviewing.io; tối thiểu là tự ghi âm và nghe lại.

## Điều chỉnh theo hoàn cảnh

- Công ty không cho phép động vào hạ tầng → làm mọi thứ trên side project + VPS cá nhân (chi phí ~5–10 USD/tháng), vẫn đủ giá trị portfolio.
- Muốn nhảy việc giữa chừng → thời điểm đẹp nhất là cuối giai đoạn 2 (đã có thành tích tự động hóa) hoặc cuối giai đoạn 3 (đã có chứng chỉ + portfolio hạ tầng).
- Sau giai đoạn 3, nếu thấy mê hạ tầng hơn code → có thể rẽ hẳn nhánh Platform/DevOps Engineer; giai đoạn 4 khi đó thay system design bằng SRE chuyên sâu (SLO, incident management, GitOps nâng cao).
