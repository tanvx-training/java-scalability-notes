# 📚 DevPrep — Học · Ôn tập · Luyện thi

Web app tĩnh (vanilla JS, **không cần build, không dependency**) cho một nền tảng học đa lĩnh vực: **Kubernetes & chứng chỉ** (CKAD, CKA, CKS, bản dịch tiếng Việt *Kubernetes in Action*), **Lập trình hệ thống** (bản dịch tiếng Việt System Programming Coursebook, UIUC CS 241), **Java & Spring Boot Scalability**, **Designing Data-Intensive Applications** (bản dịch tiếng Việt, ấn bản 2, Martin Kleppmann, O'Reilly), **Modern Concurrency in Java** (bản dịch tiếng Việt, O'Reilly, ISBN 9781098165406), **Spring Security** (bản dịch tiếng Việt *Spring Security in Action*, ấn bản 2, Laurențiu Spilcă, Manning 2024) và **Lộ trình Senior Java** (chương trình tự học 24 tháng). Một bộ chọn lĩnh vực ở sidebar chuyển toàn bộ giao diện — nav, lộ trình, tài liệu, flashcards, trắc nghiệm — sang đúng nội dung của lĩnh vực đang chọn.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🏠 Bảng điều khiển | Tổng quan tiến độ của lĩnh vực đang chọn: lộ trình, flashcard đến hạn, độ chính xác trắc nghiệm, điểm thi thử, ma trận năng lực |
| 🎓 Chứng chỉ K8s | So sánh KCNA / KCSA / CKAD / CKA / CKS + lộ trình gợi ý (kèm Kubestronaut) — riêng lĩnh vực Kubernetes |
| 🗺️ Lộ trình học | 15 giáo trình: CKAD, CKA, CKS (mỗi track 8–10 tuần), System Programming (10 tuần), lộ trình đọc *Kubernetes in Action* (9 tuần, bám theo 17 chương sách), lộ trình đọc *Spring Start Here* (8 tuần, 32 mục, bám theo 15 chương và một hướng dẫn học), lộ trình đọc *Spring Security in Action* (9 tuần, bám theo 17 chương — lời giới thiệu, ch.14 và 2 phụ lục chỉ xuất hiện ở tài nguyên theo tuần, không phải mục Đọc chính), lộ trình đọc *Modern Concurrency in Java* (9 tuần, 32 mục, bám theo 8 chương sách), lộ trình đọc *Designing Data-Intensive Applications* (12 tuần, 48 mục, bám theo 14 chương sách), lộ trình đọc *Kafka: The Definitive Guide* (11 tuần, 44 mục, bám theo 13 chương 2–14), lộ trình đọc *Modern Java in Action* (12 tuần, 48 mục, bám theo 21 chương sách) và 4 giai đoạn **Lộ trình Senior Java** (GĐ1–GĐ4, 24 tháng) — tổng **744 mục** (184 K8s + 50 mục sysprog + 32 mục đọc *Spring Start Here* + 30 mục đọc *Spring Security in Action* + 32 mục đọc *Modern Concurrency in Java* + 48 mục đọc *Designing Data-Intensive Applications* + 44 mục đọc *Kafka: The Definitive Guide* + 48 mục đọc *Modern Java in Action* + 276 mục Senior Java: GĐ1 81, GĐ2 66, GĐ3 64, GĐ4 65), lý thuyết dễ hiểu + lệnh/YAML/code mẫu + bẫy thường gặp, tài nguyên liên quan theo tuần, nút "Tiếp tục học", tiến độ lưu riêng từng track |
| 📚 Thư viện tài liệu | **150 tài liệu** thuộc 10 lĩnh vực (24 Kubernetes, 18 System Programming, 10 Java & Spring Boot Scalability, 21 Modern Java in Action, 14 Designing Data-Intensive Applications, 13 Kafka: The Definitive Guide, 8 Modern Concurrency in Java, 16 Spring Start Here, 21 Spring Security, 5 Lộ trình Senior Java) — mục lục nổi, highlight yaml/bash/c, mermaid diagram, ảnh minh họa, nút copy |
| 📊 Ma trận năng lực | 6 module / 34 chủ đề / **96 tiêu chí** đánh giá năng lực Senior Java, tick từng tiêu chí lưu tiến độ riêng — chỉ lĩnh vực Lộ trình Senior Java |
| ⚡ Thực hành nhanh | Trung tâm tra cứu khi làm lab Kubernetes: lệnh, YAML mẫu đánh dấu field cần sửa, quy trình thuộc lòng có chỉ tiêu thời gian, thẻ "Trước giờ thi" từng chứng chỉ. Ghim mục hay dùng, lọc theo chứng chỉ, chế độ gọn mở cạnh terminal |
| 🃏 Flashcards | **174 thẻ** (84 Kubernetes + 90 System Programming), spaced repetition (Lại/Khó/Tốt/Dễ), phím tắt Space + 1–4 |
| ✅ Trắc nghiệm | **220 câu** (110 Kubernetes + 110 System Programming) có giải thích, lọc theo chứng chỉ/domain, chế độ ưu tiên câu sai |
| ⏱️ Thi thử | Bấm giờ, đánh dấu câu, lấy mẫu theo tỷ trọng domain CKAD, chấm điểm theo domain, lưu lịch sử — riêng lĩnh vực Kubernetes |
| 🧪 Labs | 22 bài thực hành kiểu đề thật, có gợi ý, lời giải ẩn, lệnh verify, đồng hồ bấm giờ — riêng lĩnh vực Kubernetes |

Toàn bộ tiến độ lưu trong `localStorage` — không cần đăng nhập, không backend.

### Bộ chọn lĩnh vực

Sidebar có một bộ chọn lĩnh vực (`Kubernetes & Chứng chỉ` / `Lập trình hệ thống` / `Java & Spring Boot Scalability` / `Designing Data-Intensive Applications` / `Modern Concurrency in Java` / `Spring Security` / `Lộ trình Senior Java`). Chọn một lĩnh vực sẽ:

- Đổi các mục nav còn lại — chỉ hiện trang có dữ liệu thật cho lĩnh vực đó (ví dụ Java chỉ có Bảng điều khiển + Tài liệu; Spring Security có thêm Lộ trình học nên là Bảng điều khiển + Lộ trình + Tài liệu; Modern Concurrency in Java cũng có 3 module — Bảng điều khiển + Lộ trình + Tài liệu; Designing Data-Intensive Applications cũng có 3 module — Bảng điều khiển + Lộ trình + Tài liệu; Lộ trình Senior Java có 4 module — Bảng điều khiển + Tài liệu + Lộ trình + Ma trận năng lực — vì đây là lĩnh vực duy nhất bật module `tracker`. Các lĩnh vực trên đều chưa có flashcards/trắc nghiệm riêng).
- Lọc lại dữ liệu ở mọi trang dùng chung (Bảng điều khiển, Lộ trình, Tài liệu, Flashcards, Trắc nghiệm) theo đúng lĩnh vực.
- Lưu lựa chọn vào `localStorage` để lần sau mở app vẫn ở đúng lĩnh vực đó.

Bản ghi Kubernetes không khai trường `field` tường minh — được coi mặc định là `kubernetes`, nên dữ liệu Kubernetes hiện có không cần sửa lại.

## Chạy local

```bash
./webapp/dev.sh        # http://localhost:8888 (cổng tùy chọn: ./webapp/dev.sh 3000)
```

Script gọi `build-content.sh` để copy toàn bộ markdown của repo (`CKAD/`, `CKA/`, `CKS/`, `System_Programming_VI/`, `k8s-ebook/`, `spring-security-vi/`, `senior-java-roadmap/`, các bài `Chủ đề *`) và ảnh minh họa vào `webapp/content/` (thư mục này nằm trong `.gitignore` — nguồn chuẩn vẫn ở repo) rồi chạy `python3 -m http.server`.

## Deploy GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` tự build khi push `main`:
stage `webapp/` + `build-content.sh` copy markdown & ảnh vào `content/` → upload artifact → deploy.

Chỉ cần bật một lần: **Settings → Pages → Source: GitHub Actions**.

## Kiểm tra dữ liệu

```bash
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kiểm id trùng, link `#/docs` hỏng, khoá phân loại sai và số lượng bản ghi.
Chạy trước mỗi lần commit dữ liệu mới.

## Cấu trúc mã

```
webapp/
├── index.html            # shell: sidebar, topbar, theme boot
├── package.json          # {"type": "module"} — khai module ES tường minh cho check-data.mjs
├── build-content.sh      # copy markdown + ảnh từ repo vào content/ (dùng bởi dev.sh, CI)
├── check-data.mjs        # kiểm 40 bất biến dữ liệu (id trùng, link hỏng, số lượng…)
├── css/style.css         # design system (light/dark, components)
├── js/app.js             # hash router + theme + sidebar mobile
├── js/lib/
│   ├── field.js          # lĩnh vực đang chọn: đọc/ghi localStorage
│   ├── markdown.js       # render markdown + highlight yaml/bash/c
│   ├── store.js          # localStorage có namespace
│   └── ui.js             # DOM helper, badge, copy code…
├── js/data/
│   ├── fields.js         # khai 10 lĩnh vực: label, icon, module nào bật
│   ├── index.js          # lớp truy cập dữ liệu lọc theo lĩnh vực
│   ├── meta.js, certs.js, roadmap.js, docs-index.js, …
│   ├── sysprog-roadmap-part*.js, sysprog-flashcards.js,
│   │   sysprog-questions-part*.js   # dữ liệu lĩnh vực System Programming
│   ├── k8sbook-roadmap-part*.js     # sách Kubernetes in Action
│   ├── book-crossref.js             # chip "đọc thêm trong sách" → tuần giáo trình chứng chỉ (3 cuốn)
│   ├── springsec-roadmap-part*.js   # sách Spring Security in Action
│   ├── ddia-roadmap-part1.js        # sách Designing Data-Intensive Applications (tuần 1–6)
│   ├── ddia-roadmap-part2.js        # sách Designing Data-Intensive Applications (tuần 7–12)
│   ├── modconc-roadmap-part*.js     # sách Modern Concurrency in Java
│   ├── senior-java-gd{1..4}.js      # 4 giai đoạn Lộ trình Senior Java
│   ├── senior-java-matrix.js        # ma trận năng lực (6 module/34 chủ đề/96 tiêu chí)
│   └── …                 # roadmap-part*, questions, flashcards, commands, labs (Kubernetes)
└── js/views/             # dashboard, certs, roadmap, docs, commands,
                          # flashcards, quiz, exam, labs, tracker
```

Muốn thêm câu hỏi/flashcard/lab: sửa file tương ứng trong `js/data/` theo đúng schema có sẵn ở đầu mỗi file, chạy `node webapp/check-data.mjs` để kiểm — không cần đụng vào code view.
