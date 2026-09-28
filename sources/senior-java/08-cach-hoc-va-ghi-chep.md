# Cách học và hệ thống ghi chép

> Đọc để nhớ được và dùng được, không phải đọc để xong. Tài liệu này có hai nửa: **cách học một tài liệu** (nửa đầu, bổ sung cho vòng học ở [sj-05 §2](05-huong-dan-hoc-voi-kho-tai-nguyen.md)) và **hệ thống ghi chép** (nửa sau: cây thư mục, sáu loại note, khi nào viết cái gì, và cách note biến thành flashcard, câu trả lời phỏng vấn, blog). Mẫu copy-dán ở [sj-12](12-mau-ghi-chep.md).

---

## 1. Vòng học một tài liệu — bản rút gọn để dán lên tường

```
① Hướng dẫn đọc (3 phút)  →  ② Đọc + chạy thí nghiệm (60–90 phút)  →  ③ Đóng sách, viết (20 phút)
        ↑                                                                        ↓
⑤ Ôn lại theo lịch 1–7–30 ngày   ←   ④ Câu hỏi phỏng vấn cùng chủ đề, tự chấm (15 phút)
```

Chi tiết từng bước đã có ở sj-05 §2. Bốn bổ sung sau là thứ sj-05 chưa nói.

### 1.1 Đọc ba lượt, không đọc một lượt kỹ

| Lượt | Thời gian | Làm gì | Mục đích |
|---|---|---|---|
| 1 — Khung | 5 phút | Mục lục nổi của trang đọc, các heading, hình, khối *hướng dẫn đọc* (mục tiêu, bẫy, câu tự kiểm) | Biết mình cần lấy gì ra; não có "móc" để treo chi tiết |
| 2 — Đọc-làm | 60–90 phút | Đọc từng mục; gặp code hoặc lệnh thì gõ lại, đổi tham số, làm hỏng, sửa | Kiến thức đi qua tay |
| 3 — Kể lại | 15 phút | Đóng tài liệu, nói (thành tiếng) hoặc viết 10 dòng trả lời câu tự kiểm tra **không nhìn** | Phát hiện lỗ hổng ngay, không đợi 2 tuần |

Chương dày (JCiP, DDIA, PG Internals) có thể cần hai lượt 2 ở hai tối. Không bao giờ dồn ba chương một buổi.

### 1.2 Bốn kỹ thuật có bằng chứng, và chỗ chúng nằm trong kho

| Kỹ thuật | Bằng chứng ngắn | Đã có sẵn trong kho | Bạn làm thêm |
|---|---|---|---|
| **Active recall** — tự trả lời trước khi xem đáp án | Nhớ lâu hơn đọc lại 2–3 lần | Câu *Tự kiểm tra* cuối mỗi mục lộ trình; ngân hàng phỏng vấn hai pha (trả lời rồi mới lật) | Lượt đọc 3; concept card viết dạng câu hỏi–trả lời |
| **Spaced repetition** — ôn giãn cách | Quên theo đường cong; ôn đúng lúc sắp quên là rẻ nhất | Flashcards K8s có SRS (quý 5–6) | Với sách: đọc lại note theo lịch **1–7–30 ngày** (ghi ở nhật ký tuần); 10 phút/ngày |
| **Interleaving** — trộn chủ đề | Học xen kẽ khó hơn nhưng chuyển giao tốt hơn | Lịch tuần cố ý trộn trục + dự án + sách khác lĩnh vực | Không "gom" một cuốn đọc liền 3 tuần cho tiện |
| **Elaboration / Feynman** — giảng lại bằng lời mình | Chỗ ngập ngừng = chỗ chưa hiểu | Nguyên tắc "Feynman note" của lộ trình | Viết cho một junior cụ thể trong đầu, có ví dụ từ FlashSale hoặc công ty |

### 1.3 Đọc bản dịch thế nào

Kho là bản dịch tiếng Việt. Thuật ngữ gốc được giữ trong ngoặc ở hầu hết chương. Khi viết note, **giữ thuật ngữ tiếng Anh** (thread pool, isolation level, outbox) — phỏng vấn và tài liệu công việc dùng tiếng Anh. Khi một đoạn dịch khó hiểu, mở PDF gốc trong `sources/<lĩnh vực>/pdf/` (nếu có) đúng trang đó, đừng đọc lại cả chương bằng tiếng Anh.

### 1.4 Khi nào được bỏ qua một chương trong lịch

Chỉ khi cả ba đúng: (1) bạn trả lời được ≥ 4/5 câu tự kiểm tra của mục lộ trình tương ứng mà không nhìn; (2) bạn đã dùng thứ đó ở công ty trong 12 tháng qua; (3) bạn ghi vào nhật ký tuần "bỏ chương X vì …". Đánh dấu đã đọc để lịch không báo nợ. Hai điều kiện đầu là để không tự lừa; điều kiện ba là để review quý nhìn lại.

---

## 2. Hệ thống ghi chép

### 2.1 Năm nguyên tắc

1. **Note là sản phẩm, không phải phụ phẩm.** Mục tiêu của khối Viết 1 giờ/tuần là tệp nằm trong Git, không phải cảm giác đã học.
2. **Viết cho junior cụ thể.** Không dùng từ mình không giải thích được. Nếu phải chép định nghĩa từ sách, chưa hiểu.
3. **Một khái niệm một tệp.** `volatile-vs-atomic.md`, không phải `jcip-ch3.md`. Tệp theo sách sẽ chết khi bạn đọc cuốn thứ hai về cùng chủ đề; tệp theo khái niệm lớn dần.
4. **Có số, có nguồn.** Mọi khẳng định hiệu năng kèm điều kiện đo ("p99 280 ms, 2.500 rps, k6 spike, commit abc123"); mọi cơ chế kèm link tài liệu trong kho (`#/docs/jcip-03`) hoặc source.
5. **Đọc lại có lịch.** Note không đọc lại là note chưa viết. Nhật ký tuần có mục "note ôn tuần này".

### 2.2 Một repo, tám thư mục

Tạo repo GitHub riêng `learning-notes` (private hay public tuỳ bạn; public giúp kỷ luật). FlashSale có tài liệu riêng trong repo của nó theo `fs-09` §4 (ADR, perf, security, journal) — `learning-notes` chỉ **link sang**, không chép.

```
learning-notes/
├── README.md                # chỉ mục + bảng điểm ma trận theo quý (tuần 0, Q1, Q2 …)
├── feynman/                 # 1 trang / 1 khái niệm lớn:  jvm-gc.md, transactional-proxy.md
├── concepts/                # concept card ≤ 15 dòng, dạng hỏi–đáp: pecs.md, fencing-token.md
├── labs/                    # lab log có số: 2026-w03-memory-leak.md, 2027-w20-virtual-threads-k6.md
├── threads/                 # 10 sợi chỉ xuyên stack (sj-10), mỗi sợi 1 tệp, cập nhật dần
├── journal/                 # nhật ký tuần: 2026-W41.md … (ISO week)
├── reviews/                 # review quý: 2026-Q4.md, 2027-Q1.md …; điểm ma trận; CV bản quý
├── interview/               # câu chuyện production (STAR 5 dòng), sổ "rụng ở tầng nào"
└── exports/                 # devprep-tien-do-YYYY-MM-DD.json (xuất từ ⚙️ Cài đặt, mỗi cuối tháng)
```

Code lab thuần ngôn ngữ nằm ở repo `java-deep-dive` (theo lộ trình gốc); README mỗi thư mục lab là *lab log*, và `learning-notes/labs/` chỉ chứa lab log của thí nghiệm không có code riêng (GC log, EXPLAIN, k6). Đừng tạo thêm repo.

### 2.3 Sáu loại note — khi nào, dài bao nhiêu, để làm gì

| Loại | Khi viết | Dài | Sinh ra cái gì sau này |
|---|---|---|---|
| **Feynman note** | Sau khi xong một chủ đề trục (≈ mỗi 2 tuần) | 1 trang (≤ 60 dòng), có 1 hình vẽ tay hoặc mermaid | Blog; câu trả lời L1–L2; tài liệu mentor junior |
| **Concept card** | Sau mỗi chương đọc (≈ 2/tuần) | ≤ 15 dòng, dạng *Hỏi → Đáp → Ví dụ của tôi → Bẫy → Nguồn* | Flashcard tự tạo; câu trả lời phỏng vấn L1 |
| **Lab log** | Sau mỗi lab có số (≈ 1/tuần) | 20–40 dòng: giả thuyết, cách đo, bảng số, kết luận, "làm lại thì đổi gì" | Con số cho CV và blog; câu trả lời L2–L3 |
| **Nhật ký tuần** | Chủ nhật, 10 phút | 10–15 dòng theo mẫu | Dữ liệu cho review quý; phát hiện trượt sớm |
| **Review quý** | Tuần 13, 26, … 2 giờ | 1 trang + bảng ma trận | Bằng chứng thăng chức; điều chỉnh kế hoạch |
| **Câu chuyện production** | Sau sự cố thật hoặc chaos test tự tạo | 5 dòng STAR (bối cảnh, việc, hành động, kết quả có số, bài học) | Câu trả lời L4 — thứ phỏng vấn Senior hỏi nhiều nhất |

Sợi chỉ xuyên stack (`threads/`) là loại thứ bảy, nhưng nó không viết một lần: mỗi khi một chương chạm sợi chỉ, thêm 3–5 dòng vào tệp sợi đó (xem [sj-10](10-soi-chi-xuyen-stack.md)).

### 2.4 Đặt tên và liên kết

- Tệp: `kebab-case`, tiếng Anh cho khái niệm (`connection-pool-sizing.md`), tiền tố `YYYY-wNN-` cho lab log và `YYYY-WNN` cho nhật ký.
- Đầu mỗi note 3 dòng frontmatter: `field:` (id lĩnh vực trong app), `thread:` (id sợi chỉ nếu có), `sources:` (link `#/docs/...` hoặc URL).
- Liên kết chéo bằng link tương đối (`[[fencing-token]]` nếu dùng Obsidian, `../concepts/fencing-token.md` nếu dùng VS Code). Mỗi Feynman note nên link ≥ 2 concept card; mỗi lab log link 1 Feynman note.
- README gốc là chỉ mục sinh bằng script 10 dòng (`ls` + `head -1`), chạy trước khi commit. Không duy trì chỉ mục tay.

### 2.5 Từ note ra thứ dùng được

| Từ | Thành | Cách |
|---|---|---|
| Concept card | Flashcard | Dòng *Hỏi* là mặt trước, *Đáp* + *Bẫy* là mặt sau. Cuối tháng đổ vào Anki (hoặc bảng trong `concepts/README.md` đọc theo lịch 1–7–30) |
| Concept card + Feynman note | Câu trả lời phỏng vấn L1–L2 | Khi làm câu hỏi trong app rụng ý `mustCover`, quay lại sửa note — note là nơi sửa, không phải app |
| Lab log | Dòng CV, đoạn blog | Mỗi lab log có một dòng "câu CV": *làm X, bằng Y, kết quả Z đo được* |
| 5–8 Feynman note cùng chủ đề | Blog | Blog #1 = Feynman note @Transactional + lab log 5 bẫy; không viết blog từ số không |
| Câu chuyện production | Trả lời L4 và system design | Quý 8 gom 30 câu thành `interview/production-stories.md` |

### 2.6 Công cụ: chọn trong 10 phút rồi thôi

- Markdown + Git là bắt buộc; công cụ soạn thảo tuỳ: **Obsidian** (link hai chiều, graph, dùng vault trỏ vào thư mục repo) hoặc **VS Code** (đã mở sẵn cả ngày). Chọn cái bạn đã mở mỗi ngày.
- Hình: mermaid trong markdown (app DevPrep render được); hình vẽ tay chụp lại, đặt `images/` cạnh note.
- Không dùng Notion/Docs cho note học — bạn sẽ không commit, không diff, không đọc lại.

### 2.7 Bẫy ghi chép

| Bẫy | Dấu hiệu | Sửa |
|---|---|---|
| Chép lại sách | Note dài hơn 1 trang, không có "ví dụ của tôi" | Xoá, viết lại bằng lượt đọc 3 (không nhìn) |
| Highlight thay cho viết | Có đánh dấu đã đọc, không có tệp mới | Khối Viết làm *trước* khối Đọc tuần sau |
| Note theo sách thay vì theo khái niệm | `ddia-ch7.md`, `jcip-ch7.md` cùng nói về lock | Gộp thành `locking.md`, giữ mục "theo nguồn" bên trong |
| Không đọc lại | `journal/` không có mục "note ôn" | Lịch 1–7–30; tuần nào cũng có ít nhất 1 note ôn trong thẻ nghi thức của app |
| Viết cho chính mình hôm nay | Đọc lại sau 1 tháng không hiểu | Viết cho junior; mỗi thuật ngữ lần đầu xuất hiện có 1 câu giải thích |
| Cầu toàn | 1 giờ Viết chỉ ra được nửa note | Timebox: Feynman 30 phút, nhật ký 10 phút; note xấu có còn hơn note đẹp không có |
