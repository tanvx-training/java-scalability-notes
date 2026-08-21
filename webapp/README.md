# ☸️ KubePrep — Học · Ôn tập · Luyện thi chứng chỉ Kubernetes

Web app tĩnh (vanilla JS, **không cần build, không dependency**) phục vụ học và luyện thi các chứng chỉ Kubernetes của CNCF, trọng tâm là **CKAD**.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🏠 Bảng điều khiển | Tổng quan tiến độ: lộ trình, flashcard đến hạn, độ chính xác trắc nghiệm, điểm thi thử |
| 🎓 Chứng chỉ K8s | So sánh KCNA / KCSA / CKAD / CKA / CKS + lộ trình gợi ý (kèm Kubestronaut) |
| 🗺️ Lộ trình học | Checklist 8–10 tuần từ CKAD Study Guide, tick đến đâu lưu đến đó |
| 📚 Thư viện tài liệu | 17 tài liệu thuộc 2 lĩnh vực: Kubernetes (CKAD/CKA/CKS) + series blog Java & Spring Boot Scalability — mục lục nổi, highlight YAML/bash, mermaid diagram, ảnh minh họa, nút copy |
| ⌨️ Tra cứu kubectl | 90 lệnh hay dùng, lọc tức thì theo từ khóa/nhóm, nhấn `/` để tìm |
| 🃏 Flashcards | 84 thẻ, spaced repetition (Lại/Khó/Tốt/Dễ), phím tắt Space + 1–4 |
| ✅ Trắc nghiệm | 110 câu có giải thích, lọc theo chứng chỉ/domain, chế độ ưu tiên câu sai |
| ⏱️ Thi thử | Bấm giờ, đánh dấu câu, lấy mẫu theo tỷ trọng domain CKAD, chấm điểm theo domain, lưu lịch sử |
| 🧪 Labs | 22 bài thực hành kiểu đề thật, có gợi ý, lời giải ẩn, lệnh verify, đồng hồ bấm giờ |

Toàn bộ tiến độ lưu trong `localStorage` — không cần đăng nhập, không backend.

## Chạy local

```bash
./webapp/dev.sh        # http://localhost:8080 (cổng tùy chọn: ./webapp/dev.sh 3000)
```

Script copy `CKAD/*.md` vào `webapp/content/` (thư mục này nằm trong `.gitignore` — nguồn chuẩn vẫn là `CKAD/`) rồi chạy `python3 -m http.server`.

## Deploy GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` tự build khi push `main`:
stage `webapp/` + copy `CKAD/*.md` vào `content/` → upload artifact → deploy.

Chỉ cần bật một lần: **Settings → Pages → Source: GitHub Actions**.

## Cấu trúc mã

```
webapp/
├── index.html            # shell: sidebar, topbar, theme boot
├── css/style.css         # design system (light/dark, components)
├── js/app.js             # hash router + theme + sidebar mobile
├── js/lib/
│   ├── markdown.js       # render markdown + highlight yaml/bash
│   ├── store.js          # localStorage có namespace
│   └── ui.js             # DOM helper, badge, copy code…
├── js/data/              # meta, certs, roadmap, docs-index,
│   …                     # questions (110), flashcards (84), commands (90), labs (22)
└── js/views/             # dashboard, certs, roadmap, docs, commands,
                          # flashcards, quiz, exam, labs
```

Muốn thêm câu hỏi/flashcard/lab: sửa file tương ứng trong `js/data/` theo đúng schema có sẵn ở đầu mỗi file — không cần đụng vào code view.
