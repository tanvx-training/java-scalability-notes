# 📚 DevPrep — Học · Ôn tập · Luyện thi

Web app tĩnh (vanilla JS, **không cần build, không dependency**) cho một nền tảng học đa lĩnh vực.
Mười bốn lĩnh vực — **Kubernetes & chứng chỉ** (CKAD, CKA, CKS + ba bản dịch sách), **Lập trình hệ thống**
(UIUC CS 241), **Java & Spring Boot Scalability**, **Modern Java in Action**, **The Well-Grounded Java
Developer**, **Java Concurrency in Practice**, **Optimizing Cloud Native Java**, **Java Persistence with Spring Data and Hibernate**, **Designing Data-Intensive Applications**, **Kafka: The Definitive Guide**, **Modern
Concurrency in Java**, **Spring Start Here**, **Spring Security** và **Lộ trình Senior Java** — dùng
chung một bộ view; bộ chọn lĩnh vực ở sidebar đổi toàn bộ nội dung.

Nguồn markdown nằm ở [`../sources/`](../sources/README.md); app đọc bản sao `webapp/content/` do
`scripts/build-content.sh` tạo.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🧭 Con đường học | Ba con đường bao trên 14 lĩnh vực: ☸️ **Kubernetes & Cloud**, ☕ **Java Backend** (Spring Start → Modern Java → The Well-Grounded Java Developer → Java Concurrency in Practice → Optimizing Cloud Native Java → Java Persistence → Java Scalability → Modern Concurrency → Spring Security, nền tuỳ chọn: Lập trình hệ thống), 🗄️ **Data & Distributed** (DDIA → Kafka). Lộ trình Senior Java là **trục xuyên suốt** (4 giai đoạn → con đường). Bộ chọn lĩnh vực hai tầng; thẻ *Con đường của bạn* trên bảng điều khiển; badge con đường trên module ma trận |
| 🏠 Bảng điều khiển | Hero theo lĩnh vực; thẻ **Con đường của bạn** (vị trí, lĩnh vực kế tiếp); **Tiếp tục** (mục mở gần đây); **Bước tiếp theo** lấy từ Hướng dẫn học; số liệu lộ trình / tài liệu đã đọc / flashcard / trắc nghiệm / phỏng vấn / thi thử / ma trận; **chuỗi ngày học** 14 ngày; lưới lĩnh vực khác bấm để chuyển |
| 🧭 Hướng dẫn học | Mỗi lĩnh vực: cho ai, bao lâu, cần gì trước; **lộ trình khuyến nghị** cấp module (stepper) với trạng thái tính từ tiến độ thật (track, tài liệu đã đọc, flashcard, trắc nghiệm, thi thử, ma trận, hoặc tự tick); cách học hiệu quả; bẫy phương pháp; “coi như xong khi”; cách học từng track |
| 🗺️ Lộ trình học | 21 track / 998 mục theo tuần, mỗi mục một bài học markdown; khối **Cách học track này**; badge **Bắt đầu tại đây**; chip 📖 nối tuần chứng chỉ với chương sách; tiến độ lưu riêng từng track |
| 📚 Thư viện tài liệu | 262 tài liệu, gom theo **sách → Phần** (Phần lấy từ README nguồn / domain đề thi, không bịa); nhãn chương thống nhất `Ch. 5 · Pod` sinh từ `chapter` (không viết tay); khối **Đọc liền mạch trên con đường** (125 cặp liên kết chéo khác lĩnh vực); trang đọc có **hướng dẫn đọc suy từ lộ trình** (mục tiêu, bài học liên quan, bẫy, câu tự kiểm tra), thời gian đọc ước tính, **đánh dấu đã đọc**, thanh tiến độ cuộn, chỉnh cỡ chữ, mục lục nổi (desktop) / gọn (mobile), link `.md` tương đối mở trong app, mermaid, ảnh, copy code |
| 📊 Ma trận năng lực | 6 module / 34 chủ đề / 96 tiêu chí Senior Java theo 4 cấp độ — chỉ lĩnh vực Lộ trình Senior Java |
| 🎓 Chứng chỉ K8s · ⚡ Thực hành nhanh · 🧪 Labs · ⏱️ Thi thử | Chỉ lĩnh vực Kubernetes: so sánh 5 chứng chỉ; 130 lệnh, 48 YAML mẫu, 16 quy trình, thẻ trước giờ thi (ghim, lọc, chế độ gọn); 22 lab đề thật; thi thử bấm giờ theo tỷ trọng domain |
| 🃏 Flashcards · ✅ Trắc nghiệm | 174 thẻ spaced repetition, 220 câu có giải thích — Kubernetes và Lập trình hệ thống |
| 🎤 Câu hỏi phỏng vấn | **288 câu tự luận** có đáp án mẫu và rubric trên **12 lĩnh vực** (JPA, Java Concurrency in Practice, Optimizing Cloud Native Java, Java Scalability, Modern Java in Action, The Well-Grounded Java Developer, DDIA, Kafka, Modern Concurrency, Spring Start Here, Spring Security, Lập trình hệ thống) — mỗi lĩnh vực 6 chủ đề × 4 cấp năng lực (L1 Hiểu lý thuyết → L4 Thiết kế & xử lý sự cố), đúng 6 câu mỗi cấp. Hai pha: trả lời rồi mới lật đáp án; tự tick từng ý `mustCover` rồi tự chấm ba mức; tổng kết tách theo cấp để thấy rụng ở tầng nào. Hợp đồng cứng theo cấp do `check-data.mjs` ép: L2 phải có `code`, L3 phải có `tradeoffs`, L4 phải có `incident` với `symptom`/`scale`/`constraints` |
| 🔍 Tìm kiếm toàn cục | `Ctrl/⌘ K` hoặc `/`: tài liệu, bài học, lab, lệnh, YAML, quy trình, flashcard — **khớp không dấu**, chuyển lĩnh vực tự động khi mở kết quả |
| ⚙️ Cài đặt & tiến độ | Theme (sáng / tối / hệ thống), cỡ chữ đọc, **xuất / nhập toàn bộ tiến độ** (JSON), dung lượng từng khoá, đặt lại |

Toàn bộ tiến độ lưu trong `localStorage` (namespace `kubeprep.` — giữ nguyên vì lịch sử) — không đăng
nhập, không backend. Phím tắt: `?`.

## Chạy local

```bash
./webapp/scripts/dev.sh        # http://localhost:8888 (cổng tùy chọn: ./webapp/scripts/dev.sh 3000)
```

`dev.sh` gọi `scripts/build-content.sh` sao chép **nguyên cây** `sources/` (trừ `*.pdf`) vào
`webapp/content/` (gitignored) rồi chạy `python3 -m http.server`. Thêm một nguồn học mới không cần
sửa script — xem [`sources/README.md`](../sources/README.md).

## Kiểm tra dữ liệu

```bash
./webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

57 bất biến: id trùng, tệp/ảnh tồn tại, `docs[].file` nằm trong `content/<field>/` (#2c), link
`#/docs` hỏng, link chéo sách, khoá phân loại, hình dạng câu hỏi, hợp đồng câu hỏi phỏng vấn theo cấp
độ (#IQ1–#IQ8), module ↔ dữ liệu, hướng dẫn học (G1–G4), con đường (P1), chương/Phần và tiền tố cũ
(D1), liên kết chéo (R1), link lộ trình cùng đường (#3b) và số lượng bản ghi theo bảng kỳ vọng.
CI chạy trước khi deploy.

## Deploy GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main`: build content → check-data →
copy `webapp/` (bỏ `scripts/`) + content → deploy. Bật một lần: **Settings → Pages → Source: GitHub Actions**.

Docker: `docker compose up --build` → http://localhost:9020 (`.dockerignore` loại PDF, `inbox/`, `docs/`).

## Cấu trúc mã

```
webapp/
├── index.html                # shell: sidebar, topbar, theme boot (luôn đặt data-theme)
├── manifest.webmanifest      # cài lên màn hình chính
├── css/style.css             # design system: token light + một bảng dark, utility, component
├── scripts/
│   ├── dev.sh                # build content + http.server
│   ├── build-content.sh      # tar sources/ → content/ (trừ PDF); dùng bởi dev.sh, Dockerfile, CI
│   └── check-data.mjs        # 57 bất biến dữ liệu
├── js/app.js                 # hash router, theme, sidebar, bộ chọn lĩnh vực, phím tắt
├── js/lib/
│   ├── store.js              # localStorage có namespace + exportAll/importAll
│   ├── field.js              # lĩnh vực đang chọn
│   ├── ui.js                 # h(), badge, toast, confirmDialog, openOverlay, statCard…
│   ├── markdown.js           # render markdown + highlight yaml/bash
│   ├── search.js             # chỉ mục tìm kiếm không dấu + command palette
│   ├── activity.js           # chuỗi ngày, mục gần đây, tài liệu đã đọc
│   ├── stats.js              # số liệu tiến độ theo lĩnh vực (dùng chung)
│   └── guides.js             # đảo chỉ mục bài học → tài liệu; trạng thái bước hướng dẫn
├── js/data/
│   ├── fields.js             # 14 lĩnh vực: label, icon, module bật; GLOBAL_MODULES
│   ├── meta.js · index.js · roadmap.js · docs-index.js · book-crossref.js
│   ├── guides.js             # fieldGuides / trackGuides / groupGuides
│   ├── paths.js              # 3 con đường học, trục Senior Java, module ma trận → con đường
│   ├── related.js            # liên kết chéo khác lĩnh vực (một chiều, code phản chiếu)
│   ├── books.js · labels.js  # mã sách; docLabel/docLabelWithBook/docBook/relatedOf
│   └── <lĩnh vực>/           # gương của sources/<lĩnh vực>/:
│       ├── docs.js           #   danh mục tài liệu: id, chapter, part, title (tên chương), file…
│       ├── roadmap-*.js      #   track lộ trình theo tuần
│       └── …                 #   kubernetes: certs, commands, snippets, playbooks, examday, labs,
│                             #   flashcards, questions; sysprog: flashcards, questions;
│                             #   senior-java: matrix;
│                             #   interview (24 câu/lĩnh vực): jpa · jcip · ocnj ·
│                             #   java · modern-java · wgjd · ddia · kafka ·
│                             #   modern-concurrency · spring-start ·
│                             #   spring-security · sysprog
└── js/views/                 # dashboard, guide, roadmap, docs, tracker, certs, commands,
                              # flashcards, quiz, interview, exam, labs, settings
```

Thêm câu hỏi / câu hỏi phỏng vấn / flashcard / lab: sửa tệp tương ứng trong `js/data/<lĩnh vực>/` theo schema ở đầu tệp,
chạy `check-data.mjs` — không cần đụng view. Thêm lĩnh vực: khai trong `fields.js` (kèm `short`/`unit`), xếp vào một con đường trong `paths.js`, tạo
`js/data/<id>/docs.js` (có `chapter`/`part`), thêm `fieldGuides[id]` và `trackGuides` cho mỗi track.
