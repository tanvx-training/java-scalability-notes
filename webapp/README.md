# 📚 DevPrep — Học · Ôn tập · Luyện thi

Web app tĩnh (vanilla JS, **không cần build, không dependency**) cho một nền tảng học đa lĩnh vực: **Kubernetes & chứng chỉ** (CKAD, CKA, CKS, bản dịch tiếng Việt *Kubernetes in Action*), **Lập trình hệ thống** (bản dịch tiếng Việt System Programming Coursebook, UIUC CS 241), **Java & Spring Boot Scalability** và **Spring Security** (bản dịch tiếng Việt *Spring Security in Action*, ấn bản 2, Laurențiu Spilcă, Manning 2024). Một bộ chọn lĩnh vực ở sidebar chuyển toàn bộ giao diện — nav, lộ trình, tài liệu, flashcards, trắc nghiệm — sang đúng nội dung của lĩnh vực đang chọn.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🏠 Bảng điều khiển | Tổng quan tiến độ của lĩnh vực đang chọn: lộ trình, flashcard đến hạn, độ chính xác trắc nghiệm, điểm thi thử |
| 🎓 Chứng chỉ K8s | So sánh KCNA / KCSA / CKAD / CKA / CKS + lộ trình gợi ý (kèm Kubestronaut) — riêng lĩnh vực Kubernetes |
| 🗺️ Lộ trình học | 6 giáo trình: CKAD, CKA, CKS (mỗi track 8–10 tuần), System Programming (10 tuần), lộ trình đọc *Kubernetes in Action* (9 tuần, bám theo 17 chương sách) và lộ trình đọc *Spring Security in Action* (9 tuần, bám theo 17 chương — lời giới thiệu, ch.14 và 2 phụ lục chỉ xuất hiện ở tài nguyên theo tuần, không phải mục Đọc chính) — tổng **264 mục** (154 bài K8s + 50 mục sysprog + 30 mục đọc *Kubernetes in Action* + 30 mục đọc *Spring Security in Action*), lý thuyết dễ hiểu + lệnh/YAML/code mẫu + bẫy thường gặp, tài nguyên liên quan theo tuần, nút "Tiếp tục học", tiến độ lưu riêng từng track |
| 📚 Thư viện tài liệu | **73 tài liệu** thuộc 4 lĩnh vực (24 Kubernetes, 18 System Programming, 10 Java & Spring Boot Scalability, 21 Spring Security) — mục lục nổi, highlight yaml/bash/c, mermaid diagram, ảnh minh họa, nút copy |
| ⚡ Thực hành nhanh | Trung tâm tra cứu khi làm lab Kubernetes: lệnh, YAML mẫu đánh dấu field cần sửa, quy trình thuộc lòng có chỉ tiêu thời gian, thẻ "Trước giờ thi" từng chứng chỉ. Ghim mục hay dùng, lọc theo chứng chỉ, chế độ gọn mở cạnh terminal |
| 🃏 Flashcards | **174 thẻ** (84 Kubernetes + 90 System Programming), spaced repetition (Lại/Khó/Tốt/Dễ), phím tắt Space + 1–4 |
| ✅ Trắc nghiệm | **220 câu** (110 Kubernetes + 110 System Programming) có giải thích, lọc theo chứng chỉ/domain, chế độ ưu tiên câu sai |
| ⏱️ Thi thử | Bấm giờ, đánh dấu câu, lấy mẫu theo tỷ trọng domain CKAD, chấm điểm theo domain, lưu lịch sử — riêng lĩnh vực Kubernetes |
| 🧪 Labs | 22 bài thực hành kiểu đề thật, có gợi ý, lời giải ẩn, lệnh verify, đồng hồ bấm giờ — riêng lĩnh vực Kubernetes |

Toàn bộ tiến độ lưu trong `localStorage` — không cần đăng nhập, không backend.

### Bộ chọn lĩnh vực

Sidebar có một bộ chọn lĩnh vực (`Kubernetes & Chứng chỉ` / `Lập trình hệ thống` / `Java & Spring Boot Scalability` / `Spring Security`). Chọn một lĩnh vực sẽ:

- Đổi các mục nav còn lại — chỉ hiện trang có dữ liệu thật cho lĩnh vực đó (ví dụ Java chỉ có Bảng điều khiển + Tài liệu; Spring Security có thêm Lộ trình học nên là Bảng điều khiển + Lộ trình + Tài liệu — cả hai đều chưa có flashcards/trắc nghiệm riêng).
- Lọc lại dữ liệu ở mọi trang dùng chung (Bảng điều khiển, Lộ trình, Tài liệu, Flashcards, Trắc nghiệm) theo đúng lĩnh vực.
- Lưu lựa chọn vào `localStorage` để lần sau mở app vẫn ở đúng lĩnh vực đó.

Bản ghi Kubernetes không khai trường `field` tường minh — được coi mặc định là `kubernetes`, nên dữ liệu Kubernetes hiện có không cần sửa lại.

## Chạy local

```bash
./webapp/dev.sh        # http://localhost:8888 (cổng tùy chọn: ./webapp/dev.sh 3000)
```

Script gọi `build-content.sh` để copy toàn bộ markdown của repo (`CKAD/`, `CKA/`, `CKS/`, `System_Programming_VI/`, `k8s-ebook/`, `spring-security-vi/`, các bài `Chủ đề *`) và ảnh minh họa vào `webapp/content/` (thư mục này nằm trong `.gitignore` — nguồn chuẩn vẫn ở repo) rồi chạy `python3 -m http.server`.

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
├── check-data.mjs        # kiểm 30 bất biến dữ liệu (id trùng, link hỏng, số lượng…)
├── css/style.css         # design system (light/dark, components)
├── js/app.js             # hash router + theme + sidebar mobile
├── js/lib/
│   ├── field.js          # lĩnh vực đang chọn: đọc/ghi localStorage
│   ├── markdown.js       # render markdown + highlight yaml/bash/c
│   ├── store.js          # localStorage có namespace
│   └── ui.js             # DOM helper, badge, copy code…
├── js/data/
│   ├── fields.js         # khai 4 lĩnh vực: label, icon, module nào bật
│   ├── index.js          # lớp truy cập dữ liệu lọc theo lĩnh vực
│   ├── meta.js, certs.js, roadmap.js, docs-index.js, …
│   ├── sysprog-roadmap-part*.js, sysprog-flashcards.js,
│   │   sysprog-questions-part*.js   # dữ liệu lĩnh vực System Programming
│   ├── k8sbook-roadmap-part*.js, k8sbook-crossref.js  # sách Kubernetes in Action
│   ├── springsec-roadmap-part*.js   # sách Spring Security in Action
│   └── …                 # roadmap-part*, questions, flashcards, commands, labs (Kubernetes)
└── js/views/             # dashboard, certs, roadmap, docs, commands,
                          # flashcards, quiz, exam, labs
```

Muốn thêm câu hỏi/flashcard/lab: sửa file tương ứng trong `js/data/` theo đúng schema có sẵn ở đầu mỗi file, chạy `node webapp/check-data.mjs` để kiểm — không cần đụng vào code view.
