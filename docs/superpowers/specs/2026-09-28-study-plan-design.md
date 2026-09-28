# Kế hoạch học tập cá nhân & module Kế hoạch tuần — thiết kế

Ngày: 2026-09-28
Trạng thái: thiết kế theo yêu cầu, thực hiện ngay trong cùng phiên (người dùng chạy tự động, không có vòng duyệt)
Phạm vi: 7 tài liệu mới trong lĩnh vực `senior-java`, module toàn cục `planner`, dữ liệu lịch 104 tuần, bất biến mới trong `check-data.mjs`

## 1. Yêu cầu

Người dùng: "Phân tích, đánh giá kho tài liệu; dựa theo mục tiêu của tôi lên kế hoạch chi tiết lộ trình học,
cách học, cách ghi chép, cách thực hành và các hành động khác; đưa kế hoạch thành một chức năng của dự án;
bổ sung những gì cần để việc thực hiện khả thi, như cách sắp xếp thời gian."

Mục tiêu người dùng (từ `sources/senior-java/05-…md`): Java/Spring 4 năm, Mid vững → Senior Java + DevOps
trong 24 tháng, 8–10 giờ/tuần ngoài giờ làm, bắt đầu tháng 10/2026, kết thúc tháng 9/2028.

## 2. Đánh giá kho (kết luận)

| Điểm | Nhận xét |
|---|---|
| Hạ tầng | 17 lĩnh vực, 311 tài liệu, 29 track / 1251 mục, hướng dẫn học mọi lĩnh vực, ma trận 96 tiêu chí, 336 câu phỏng vấn, capstone FlashSale. Đủ để học sâu. |
| **Xung đột quỹ giờ** | Lộ trình Senior (104 tuần) và FlashSale (24 tuần) đều giả định trọn 8–10 giờ/tuần và cùng bắt đầu cuối 9/2026. Cộng 178 tuần sách. Hai kế hoạch không biết đến nhau. |
| Tài liệu sj-05 lỗi thời | Viết khi kho có 14 lĩnh vực; thiếu Effective Java, PG Internals, FlashSale; tham chiếu Effective Java như sách ngoài. |
| Không có lịch thật | Track chỉ có "Tuần N" tương đối, không gắn ngày; không ghi giờ; chuỗi ngày đếm thao tác, không đếm giờ. Review quý chỉ nằm trong văn bản. |
| Ghi chép / thực hành / xuyên stack | Chỉ được nhắc (Feynman note, "đọc mà không code = chưa đọc"); không có mẫu, không có chỗ trong app; 144 liên kết chéo nhưng không có "sợi chỉ" nối một khái niệm qua nhiều stack. |
| Giai đoạn 2 DevOps | Không có lĩnh vực trong app; FlashSale GĐ4 (CI/CD, observability, kind/Helm, supply chain) lấp đúng lỗ này. |

## 3. Quyết định

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Mô hình **"Một dự án, mọi cuốn sách"**: FlashSale là phòng lab của trục Senior, chạy nửa tốc (1 tuần nguồn = 2 tuần lịch, xong tuần 53). Sách đọc just-in-time theo tuần. | Giải xung đột quỹ giờ mà không bỏ cái nào; kết hợp stack diễn ra trên một codebase. |
| 2 | Thứ tự chủ đề Giai đoạn 1 được **xếp lại theo dự án** (Spring internals + @Transactional + JPA trước, collections/generics/concurrency sau) — chỉ ở lịch, không đổi track `sj-gd1`. | Id mục là khoá localStorage, không đổi; lịch là tầng bao. |
| 3 | 7 tài liệu mới `sj-06`…`sj-12` trong `sources/senior-java/`, không tạo lĩnh vực mới. | Lộ trình Senior là trục xuyên suốt, kế hoạch cá nhân thuộc về nó. Không thêm lĩnh vực nên P1/FIELD_ORDER không đổi. |
| 4 | Module toàn cục `planner` (`#/planner`, 🗓️ Kế hoạch tuần) có ở MỌI lĩnh vực qua `GLOBAL_MODULES`, hiện ở nhóm nav đầu tiên. | Người học đứng ở lĩnh vực nào cũng cần biết "tuần này làm gì". |
| 5 | Lịch 104 tuần là dữ liệu `webapp/js/data/senior-java/schedule.js`, tham chiếu **id mục** của `sj-gd*`, `fs-gd*`, `ckad`, `cka` và **id tài liệu**. Tiến độ tuần tính từ `roadmap.checked` thật. | Không tạo kho tiến độ thứ hai; tick ở lộ trình là tick ở kế hoạch. |
| 6 | Bất biến PL1–PL4: mọi tham chiếu tồn tại; mọi mục `sj-gd*` và `fs-gd*` xuất hiện đúng một lần; 104 tuần liên tục; giờ trong ngưỡng. | Lịch tổng thể phải phủ trọn hai trục, không sót không trùng. |
| 7 | Nhật ký giờ học `plan.log`, nghi thức `plan.rituals`, cấu hình `plan.config` (ngày bắt đầu, giờ mục tiêu) trong localStorage cùng namespace. | Xuất/nhập tiến độ hiện có bao luôn. |

## 4. Nội dung tài liệu mới (`sources/senior-java/`)

| Id | Tệp | Trả lời câu gì |
|---|---|---|
| sj-06 | `06-ke-hoach-tong-the-104-tuan.md` | Kho có gì, thiếu gì; mô hình tích hợp; lịch 8 quý; mốc chứng chỉ/tag/review/nghỉ; khác gì sj-05 |
| sj-07 | `07-sap-xep-thoi-gian.md` | 5 khối/tuần; ba chế độ tuần (đủ / tối thiểu / trắng); lịch cố định; luật nợ và trượt; năng lượng |
| sj-08 | `08-cach-hoc-va-ghi-chep.md` | Vòng học một tài liệu; đọc 3 lượt; active recall; hệ thống ghi chép (repo `learning-notes`, 6 loại note, đặt tên, liên kết, từ note ra flashcard và câu phỏng vấn) |
| sj-09 | `09-thuc-hanh-mot-du-an-moi-cuon-sach.md` | Bản đồ sách → chỗ đáp xuống trong FlashSale; lab thuần ngôn ngữ; áp dụng ở công ty; mỗi tuần một số đo; năm 2 |
| sj-10 | `10-soi-chi-xuyen-stack.md` | 10 sợi chỉ, mỗi sợi: câu hỏi dẫn, chuỗi tài liệu qua nhiều lĩnh vực, điểm chạm FlashSale, câu phỏng vấn/ma trận |
| sj-11 | `11-do-luong-va-review.md` | Review tuần 15 phút, review quý 2 giờ có ngày; mục tiêu ma trận theo quý; lịch ngân hàng phỏng vấn; bằng chứng theo ngày; luật khi trượt |
| sj-12 | `12-mau-ghi-chep.md` | Mẫu copy-dán: Feynman note, lab log, concept card, nhật ký tuần, review quý, incident, design doc mini; checklist tuần 1 |

`sj-05` thêm khung "Bản cập nhật" ở đầu: khi mâu thuẫn về lịch, theo sj-06. Không viết lại sj-05.

## 5. Dữ liệu lịch

```js
// schedule.js — mỗi tuần một dòng, hàm w() nở ra bản ghi đầy đủ
w(5, { q: 1, phase: "gd1", focus: "Spring internals gặp Modulith",
  spine: ["sj-gd1-w8", 1, 3],        // tuần track + khoảng mục (1-based, đóng)
  project: ["fs-gd1-w3", 1, 2],
  extra: [],                          // [weekId, from, to] cho ckad/cka (năm 2)
  reads: ["java-09", "springstart-06"],
  practice: "…", write: "…",
  hours: { read: 2, lab: 1.5, project: 2.5, write: 1, review: 1 },
  ms: { kind: "tag", label: "…" } });
```

`PLAN = { start: "2026-10-05", weeks: 104, hoursTarget: 9, rest: [18, 69] }`. Tuần nghỉ (Tết 2027, Tết 2028)
không có spine/project. Bản ghi nở ra có `n, q, phase, dates {from, to}, items[] (id mục), docs[]`.

Phân bổ: `sj-gd1` tuần 1–27 · `sj-gd2` 28–52 · `sj-gd3` 53–78 · `sj-gd4` 79–104 · `fs-gd0..5` 1–53 (nghỉ
một tuần sau mỗi tag) · `ckad` 53–62 (thi tuần 66) · `cka` 66–75 (thi tuần 78) · `ddia` đọc 1 chương/tuần 79–90.

## 6. App

- `fields.js`: `GLOBAL_MODULES = ["planner", "settings"]`; nhóm nav mới "Kế hoạch" `{ id: "planner", global: true }`
  đứng đầu `NAV_GROUPS`; `navFor()` giữ mục `global`.
- `lib/plan.js`: `weekOf(date)`, `dateOfWeek(n)`, `currentWeek()`, `weekEntry(n)`, `weekProgress(entry)`,
  `logSession()`, `hoursOfWeek(n)`, `ritualState(n)`, `nextMilestones(n)`.
- `views/planner.js`: đầu trang (tuần N/104, quý, giai đoạn, ngày, thanh 104 tuần), thẻ **Tuần này** (việc gom
  từ spine/project/extra với checkbox tick thẳng vào `roadmap.checked`, chương đọc với trạng thái đã đọc), thẻ
  **Giờ học** (ghi buổi: ngày, giờ, loại, ghi chú; tổng tuần / mục tiêu; 8 tuần gần nhất), **Nợ tuần trước**,
  **Nghi thức** (checklist tuần; checklist quý ở tuần 13/26/…), **Mốc sắp tới**, **Toàn bộ lịch** (details theo
  quý), link 7 tài liệu. Cài đặt ngày bắt đầu / giờ mục tiêu ngay trong trang.
- `views/dashboard.js`: thẻ 🗓️ Tuần này (tuần, trọng tâm, giờ đã ghi / mục tiêu, tiến độ) ở mọi lĩnh vực.
- `views/settings.js`: nhãn khoá `plan.*`.
- `check-data.mjs`: G3 chấp nhận route trong `GLOBAL_MODULES`; kiểm `navFor` cộng số mục global; PL1–PL4;
  `docs:senior-java` 13.
- `guides.js`: `fieldGuides["senior-java"]` thêm bước `sj-0a` (đọc sj-06, sj-07) và `sj-0c` (mở Kế hoạch tuần, tự tick).
- README gốc, `webapp/README.md`, `sources/README.md`: cập nhật số liệu và mô tả module.

## 7. Ngoài phạm vi

- Không sửa nội dung track hiện có, không đổi id.
- Không viết mã FlashSale.
- Không đồng bộ lịch ra Google Calendar (tài liệu sj-07 hướng dẫn tạo tay).
