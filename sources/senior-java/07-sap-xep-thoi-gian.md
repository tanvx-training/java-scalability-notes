# Sắp xếp thời gian — 9 giờ một tuần trong 104 tuần

> Kế hoạch nào cũng chết vì lịch, không chết vì nội dung. Tài liệu này trả lời: 9 giờ đó nằm ở đâu trong tuần, tuần bận thì làm gì, trượt thì cắt gì, và làm sao giữ được nhịp 2 năm mà không kiệt sức. Đi kèm [kế hoạch tổng thể](06-ke-hoach-tong-the-104-tuan.md) và trang **🗓️ Kế hoạch tuần** trong app.

---

## 1. Ngân sách tuần: 5 khối, 9 giờ, 10 phút mỗi ngày

| Khối | Giờ | Làm gì | Không làm gì |
|---|---|---|---|
| **Đọc** (2 lần × 1 giờ) | 2 | Chương trong cột *Đọc* của tuần; đọc *hướng dẫn đọc* trên đầu trang trước; dừng ở mỗi thí nghiệm để gõ lại | Đọc chương ngoài lịch "cho biết" |
| **Lab sách** | 1,5 | Mục trục Senior tuần này — phần *Cách thực hiện* | Bỏ lab để đọc thêm |
| **Dự án** | 2,5 | 2 buổi FlashSale của tuần (năm 2: lab K8s / platform / design doc) | Làm thêm tính năng ngoài buổi |
| **Viết** | 1 | Feynman note chủ đề tuần + nhật ký tuần + ADR nếu có | Chép lại sách |
| **Ôn** | 1 | 3–4 câu phỏng vấn cùng chủ đề, đọc lại 1 note cũ, tick lộ trình, đặt lịch tuần sau | Làm thêm trắc nghiệm cho vui |
| **Mỗi ngày** | 10 phút | Quý 5–6: flashcards K8s. Quý khác: đọc lại 1 concept card hoặc 1 câu phỏng vấn | Kéo dài quá 15 phút |

Cộng lại 8 giờ + 50 phút lẻ ≈ 9 giờ. Giờ thứ 10 là **dự phòng**: sửa CI đỏ, đọc bù, trả lời bình luận. Không có việc dự phòng thì nghỉ, đừng học thêm — quỹ năng lượng quan trọng hơn quỹ giờ.

---

## 2. Hai lịch mẫu

### 2.1 Giờ hành chính, tối rảnh

| Ngày | Giờ | Khối |
|---|---|---|
| Thứ Hai | 20:30–21:30 | Đọc 1 |
| Thứ Ba | 20:00–22:30 | Dự án buổi 1 (1,25 giờ) + Lab sách (1,25 giờ) |
| Thứ Tư | 20:30–21:30 | Đọc 2 |
| Thứ Năm | 20:00–21:30 | Dự án buổi 2 |
| Thứ Sáu | — | Nghỉ (đi chơi, ngủ sớm) |
| Thứ Bảy | 08:30–11:00 | Lab sách (còn lại) + Viết 1 giờ |
| Chủ nhật | 20:00–21:00 | Ôn + nhật ký + đặt lịch |

### 2.2 Tối bận (con nhỏ, ca lệch), sáng sớm rảnh

| Ngày | Giờ | Khối |
|---|---|---|
| Thứ Hai–Sáu | 05:45–06:45 | Luân phiên: Đọc 1, Dự án 1, Đọc 2, Dự án 2, Lab sách (mỗi ngày 1 giờ, 5 giờ) |
| Thứ Bảy | 14:00–17:00 | Lab sách nốt + Dự án gộp (nếu buổi sáng thiếu) + Viết |
| Chủ nhật | 21:00–21:45 | Ôn + nhật ký |

Quy tắc chung của cả hai: **một khối liền ≥ 2 giờ vào cuối tuần** là bắt buộc. Profiling, chaos test, heap dump, Testcontainers không làm được trong 45 phút. Mất khối này là mất tuần.

---

## 3. Ba chế độ tuần

Trước Chủ nhật, nhìn lịch công ty tuần tới và chọn **một** chế độ. Ghi chế độ vào nhật ký tuần.

| Chế độ | Giờ | Giữ | Bỏ | Khi nào |
|---|---|---|---|---|
| **Đủ** | 8–10 | Cả 5 khối | — | Tuần bình thường |
| **Tối thiểu** | 5 | Dự án 2,5 · Đọc 1,5 (1 chương) · Viết 1 (nhật ký + 1 note ngắn) | Lab sách, Ôn, chương thứ 2–3 | Release ở công ty, ốm nhẹ, đi công tác 2–3 ngày |
| **Trắng** | 0–1 | 10 phút/ngày (flashcard hoặc đọc lại note) | Tất cả; lịch **dịch 1 tuần** | Nghỉ phép, ốm, việc gia đình |

Luật đi kèm:

- Hai tuần *Tối thiểu* liên tiếp → tuần thứ ba phải là *Đủ* hoặc *Trắng* — không được kéo dài "tối thiểu" thành bình thường mới.
- *Trắng* thì dịch: mở ⚙️ trong trang Kế hoạch tuần, lùi ngày bắt đầu 7 ngày, ghi lý do vào nhật ký. Tối đa **4 lần dịch trong 24 tháng** (Tết đã có sẵn 2 tuần). Lần thứ 5 nghĩa là kế hoạch không khớp đời sống — về §5.
- Tuần *Tối thiểu* vẫn tick được mục dự án, không tick mục trục (chưa làm lab). Nợ đó hiện ở thẻ *Nợ tuần trước*.

---

## 4. Nợ và trượt: cắt gì, giữ gì

Thứ tự **cắt** khi thiếu giờ (từ trên xuống):

1. Chương Hạng C (không có trong lịch — không bao giờ nên có).
2. Chương thứ 3 của tuần, rồi chương thứ 2 (đọc Hạng B chậm lại 1 tuần).
3. Giáo trình phụ (năm 2: mục CKAD/CKA của tuần lùi sang tuần sau, thi lùi 3 tuần).
4. Ôn (câu phỏng vấn) — bù ở review quý.
5. Lab sách của trục — **chỉ khi** đã ở chế độ Tối thiểu.

Thứ **không cắt**: buổi dự án (đây là thứ tạo portfolio), khối Viết (không viết = không nhớ), review quý.

Ba luật nợ:

- **Không nợ lab quá 1 tuần.** Còn mục trục tuần trước chưa tick → tuần này khối Đọc dùng để trả lab, không mở chương mới. Thẻ *Nợ tuần trước* trong app là người nhắc.
- **Dự án mất cả 2 buổi trong tuần → kéo giai đoạn 1 tuần**, không dồn 5 giờ vào một buổi (luật của `fs-09`). Kéo bằng cách coi tuần sau là tuần *Tối thiểu* cho phần sách.
- **Trễ tích luỹ > 2 tuần** (nhiều tuần liên tiếp không hoàn thành và nợ chồng): dùng tuần review quý gần nhất làm tuần "trả nợ" — quý nào cũng có tuần 13 nhẹ. Vẫn trễ → về §5.

---

## 5. Khi kế hoạch không khớp đời sống

Dấu hiệu: 3 tuần liên tiếp ghi dưới 60% giờ mục tiêu, hoặc phải dịch ngày bắt đầu lần thứ 5, hoặc thẻ nợ > 20 mục.

Làm theo thứ tự, dừng ở bước đầu tiên đủ:

1. **Giảm mục tiêu giờ** trong app xuống 6 (tương đương lộ trình 36 tháng của sj-00). Giữ nguyên thứ tự tuần; chấp nhận mỗi tuần lịch mất 1,5 tuần thật. Không cần sửa lịch — lịch dịch dần qua các lần *Trắng*.
2. **Bỏ chứng chỉ tuỳ chọn** (OCP, CCDAK) và blog #4a/#4b — giữ CKAD, CKA, 4 blog chính.
3. **Bỏ hẳn Hạng B của một con đường**: thường là PG Internals (22 chương) và Modern Java phần sau. Kho vẫn ở đó cho năm thứ ba.
4. **Không bỏ FlashSale giữa chừng.** Nếu phải chọn giữa trục Senior và FlashSale ở năm 1, giữ FlashSale đến v3-events (tuần 33) rồi tạm dừng dự án; trục Senior tiếp tục. Một dự án chạy được đến event-driven đáng giá hơn mười chương đọc dở.

---

## 6. Giữ được năng lượng 104 tuần

- **Ngủ trước.** Không học sau 23:00. Một tuần ngủ đủ và học 6 giờ hơn một tuần học 10 giờ và ngủ 5 tiếng — cái sau còn ăn vào tuần kế.
- **Deep work có luật:** tắt thông báo, đúng 3 cửa sổ (IDE, terminal, app DevPrep), pomodoro 50/10, không mở Slack công ty.
- **Bắt đầu bằng việc nhỏ nhất:** mở app, đọc *Hoàn thành khi* của mục hôm nay, gõ lệnh đầu tiên. Ngày mệt nhất vẫn làm được 10 phút; 10 phút giữ chuỗi.
- **Tuần cao điểm công ty biết trước** (release, on-call): đặt *Tối thiểu* từ Chủ nhật trước, đừng để nó tự thành *Trắng*.
- **Kỳ nghỉ dài:** Tết đã có tuần trắng. Nghỉ hè 1 tuần → tuần *Trắng* thứ 3 hoặc 4 — hợp lệ.
- **Mỗi quý một phần thưởng gắn với mốc:** tag FlashSale, cổng giai đoạn, chứng chỉ. Viết phần thưởng vào review quý trước để nó là lời hứa.
- **Không học một mình cả 24 tháng:** tìm một người cùng đọc DDIA (quý 7), một senior để mock (quý 2 và 8), một junior để mentor (quý 8). Người khác là lý do để tuần này không *Trắng*.

---

## 7. Dựng lịch một lần, dùng hai năm

1. Google Calendar (hoặc bất cứ lịch nào bạn đã mở mỗi ngày): tạo lịch riêng tên **"Học"**, màu riêng.
2. Tạo 5 sự kiện **lặp hằng tuần** đúng khối ở §2 (ví dụ *Đọc 1* thứ Hai 20:30–21:30). Ghi trong mô tả: link `http://localhost:8888/#/planner` hoặc link app đã deploy.
3. Sự kiện Chủ nhật *Ôn + đặt lịch* thêm nhắc 10 phút; đây là lúc chọn chế độ tuần và kéo sự kiện nếu tuần sau lệch.
4. Tạo 8 sự kiện **review quý** 2 giờ vào Chủ nhật của tuần 13, 26, 39, 52, 65, 78, 91, 104 (ngày cụ thể ở [sj-11](11-do-luong-va-review.md) §3). Tạo 2 sự kiện thi: CKAD tuần 66, CKA tuần 76 — đăng ký thật ở tuần 62/75 khi thi thử đạt.
5. Hai tuần Tết: xoá sự kiện học tuần đó ngay từ đầu.
6. Sự kiện cả ngày ở tuần 4, 12, 22, 33, 42, 53: "Tag FlashSale vN" — nhìn thấy mốc trước một tháng làm bạn không bỏ buổi.

Lịch trong calendar là **khung giờ**; nội dung giờ đó lấy từ trang Kế hoạch tuần. Đừng chép nội dung sang calendar — hai nơi sẽ lệch nhau.

---

## 8. Ghi giờ học trong app

Sau mỗi buổi, trong thẻ **Giờ học** của trang Kế hoạch tuần: chọn ngày (mặc định hôm nay), số giờ (bội 0,25), loại (đọc / lab sách / dự án / viết / ôn), một dòng ghi chú ("JCiP ch.3, chạy lab visibility"). Mất 15 giây.

Đọc số liệu như thế nào:

| Nhìn thấy | Nghĩa | Làm gì |
|---|---|---|
| Tổng tuần ≥ 80% mục tiêu, tiến độ tuần ≥ 80% | Nhịp đúng | Không làm gì |
| Giờ đủ nhưng tiến độ tuần thấp | Đang đọc/làm chậm hơn ước lượng, hoặc làm việc ngoài lịch | Xem phân bổ theo loại: nếu "dự án" ăn 5 giờ → dự án đang nuốt sách; ép dự án về 2,5 |
| Giờ thấp, tiến độ vẫn cao | Đang tick sớm | Đối chiếu ma trận ở review quý; tick lại thật thà |
| 3 tuần liên tiếp < 60% giờ | Kế hoạch không khớp đời sống | §5 |
| Loại "viết" = 0 nhiều tuần | Sẽ quên sau 2 tuần | Tuần sau khối Viết làm trước khối Đọc |

Biểu đồ 8 tuần trong thẻ là để nhìn xu hướng, không phải để tự trách. Một tuần trắng trên biểu đồ là dữ liệu, không phải thất bại.
