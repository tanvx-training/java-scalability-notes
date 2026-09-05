# 📚 DevPrep — Học · Ôn tập · Luyện thi

Web app tĩnh (vanilla JS, **không cần build, không dependency**) cho một nền tảng học đa lĩnh vực.
Mười lĩnh vực — **Kubernetes & chứng chỉ** (CKAD, CKA, CKS + ba bản dịch sách), **Lập trình hệ thống**
(UIUC CS 241), **Java & Spring Boot Scalability**, **Modern Java in Action**, **Designing Data-Intensive
Applications**, **Kafka: The Definitive Guide**, **Modern Concurrency in Java**, **Spring Start Here**,
**Spring Security** và **Lộ trình Senior Java** — dùng chung một bộ view; bộ chọn lĩnh vực ở sidebar
đổi toàn bộ nội dung.

Nguồn markdown nằm ở [`../sources/`](../sources/README.md); app đọc bản sao `webapp/content/` do
`scripts/build-content.sh` tạo.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🏠 Bảng điều khiển | Hero theo lĩnh vực; **Tiếp tục** (mục mở gần đây); **Bước tiếp theo** lấy từ Hướng dẫn học; số liệu lộ trình / tài liệu đã đọc / flashcard / trắc nghiệm / thi thử / ma trận; **chuỗi ngày học** 14 ngày; lưới lĩnh vực khác bấm để chuyển |
| 🧭 Hướng dẫn học | Mỗi lĩnh vực: cho ai, bao lâu, cần gì trước; **lộ trình khuyến nghị** cấp module (stepper) với trạng thái tính từ tiến độ thật (track, tài liệu đã đọc, flashcard, trắc nghiệm, thi thử, ma trận, hoặc tự tick); cách học hiệu quả; bẫy phương pháp; “coi như xong khi”; cách học từng track |
| 🗺️ Lộ trình học | 17 track / 804 mục theo tuần, mỗi mục một bài học markdown; khối **Cách học track này**; badge **Bắt đầu tại đây**; chip 📖 nối tuần chứng chỉ với chương sách; tiến độ lưu riêng từng track |
| 📚 Thư viện tài liệu | 196 tài liệu, gom theo sách; trang đọc có **hướng dẫn đọc suy từ lộ trình** (mục tiêu, bài học liên quan, bẫy, câu tự kiểm tra), thời gian đọc ước tính, **đánh dấu đã đọc**, thanh tiến độ cuộn, chỉnh cỡ chữ, mục lục nổi (desktop) / gọn (mobile), link `.md` tương đối mở trong app, mermaid, ảnh, copy code |
| 📊 Ma trận năng lực | 6 module / 34 chủ đề / 96 tiêu chí Senior Java theo 4 cấp độ — chỉ lĩnh vực Lộ trình Senior Java |
| 🎓 Chứng chỉ K8s · ⚡ Thực hành nhanh · 🧪 Labs · ⏱️ Thi thử | Chỉ lĩnh vực Kubernetes: so sánh 5 chứng chỉ; 130 lệnh, 48 YAML mẫu, 16 quy trình, thẻ trước giờ thi (ghim, lọc, chế độ gọn); 22 lab đề thật; thi thử bấm giờ theo tỷ trọng domain |
| 🃏 Flashcards · ✅ Trắc nghiệm | 174 thẻ spaced repetition, 220 câu có giải thích — Kubernetes và Lập trình hệ thống |
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

46 bất biến: id trùng, tệp/ảnh tồn tại, `docs[].file` nằm trong `content/<field>/` (#2c), link
`#/docs` hỏng, link chéo sách, khoá phân loại, hình dạng câu hỏi, module ↔ dữ liệu, hướng dẫn học
(G1–G4: lĩnh vực ↔ `fieldGuides`, track ↔ `trackGuides`, `steps` hợp lệ, `groupGuides` đúng nhóm) và
số lượng bản ghi theo bảng kỳ vọng. CI chạy trước khi deploy.

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
│   └── check-data.mjs        # 46 bất biến dữ liệu
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
│   ├── fields.js             # 10 lĩnh vực: label, icon, module bật; GLOBAL_MODULES
│   ├── meta.js · index.js · roadmap.js · docs-index.js · book-crossref.js
│   ├── guides.js             # fieldGuides / trackGuides / groupGuides
│   └── <lĩnh vực>/           # gương của sources/<lĩnh vực>/:
│       ├── docs.js           #   danh mục tài liệu (file: content/<lĩnh vực>/…)
│       ├── roadmap-*.js      #   track lộ trình theo tuần
│       └── …                 #   kubernetes: certs, commands, snippets, playbooks, examday, labs,
│                             #   flashcards, questions; sysprog: flashcards, questions; senior-java: matrix
└── js/views/                 # dashboard, guide, roadmap, docs, tracker, certs, commands,
                              # flashcards, quiz, exam, labs, settings
```

Thêm câu hỏi / flashcard / lab: sửa tệp tương ứng trong `js/data/<lĩnh vực>/` theo schema ở đầu tệp,
chạy `check-data.mjs` — không cần đụng view. Thêm lĩnh vực: khai trong `fields.js`, tạo
`js/data/<id>/docs.js`, thêm `fieldGuides[id]` và `trackGuides` cho mỗi track.
