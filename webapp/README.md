# 📚 DevPrep — Học · Ôn tập · Luyện thi

Web app tĩnh (vanilla JS, **không cần build, không dependency**) cho một nền tảng học đa lĩnh vực.
Mười tám lĩnh vực — **Kubernetes & chứng chỉ** (CKAD, CKA, CKS + ba bản dịch sách), **Lập trình hệ thống**
(UIUC CS 241), **Java & Spring Boot Scalability**, **Modern Java in Action**, **Effective Java**, **The Well-Grounded Java
Developer**, **Java Under the Hood**, **Java Concurrency in Practice**, **Optimizing Cloud Native Java**, **Java Persistence with Spring Data and Hibernate**, **Designing Data-Intensive Applications**, **PostgreSQL 14 Internals**, **Kafka: The Definitive Guide**, **Modern
Concurrency in Java**, **Spring Start Here**, **Spring Security** và **Lộ trình Senior Java** — dùng
chung một bộ view; bộ chọn lĩnh vực ở sidebar đổi toàn bộ nội dung.

Nguồn markdown nằm ở [`../sources/`](../sources/README.md); app đọc bản sao `webapp/content/` do
`scripts/build-content.sh` tạo.

## Tính năng

| Trang | Nội dung |
|---|---|
| 🗓️ Kế hoạch tuần | **Toàn cục** (mọi lĩnh vực): lịch 104 tuần gắn ngày (05/10/2026 → 01/10/2028) theo kế hoạch "một dự án, mọi cuốn sách" (`sj-06`): tuần hiện tại tính từ ngày thật; **việc tuần này** gom một lát trục Senior (`sj-gd*`), một lát FlashSale (`fs-gd*`, nửa tốc) hoặc giáo trình CKAD/CKA (năm 2) và chương sách đọc just-in-time — checkbox tick thẳng vào `roadmap.checked` / `docs.read`; **giờ học** ghi từng buổi (ngày, giờ, loại, ghi chú) so với mục tiêu, biểu đồ 8 tuần; **nợ tuần trước**; **nghi thức** review tuần / review quý (tuần 13, 26, …); mốc sắp tới (tag, cổng, thi, nghỉ); thanh 104 tuần + toàn bộ lịch theo quý; cài đặt ngày bắt đầu (thứ Hai) và giờ mục tiêu. Bảng điều khiển mọi lĩnh vực có thẻ *Tuần này* |
| 🧭 Con đường học | Bốn con đường bao trên 18 lĩnh vực: ☸️ **Kubernetes & Cloud**, ☕ **Java Backend** (Spring Start → Modern Java → Effective Java → The Well-Grounded Java Developer → Java Under the Hood → Java Concurrency in Practice → Optimizing Cloud Native Java → Java Persistence → Java Scalability → Modern Concurrency → Spring Security, nền tuỳ chọn: Lập trình hệ thống), 🗄️ **Data & Distributed** (DDIA → PostgreSQL 14 Internals → Kafka), 🛒 **Dự án thực chiến** (pet project FlashSale — được link tài liệu cả ba con đường). Lộ trình Senior Java là **trục xuyên suốt** (4 giai đoạn → con đường). Bộ chọn lĩnh vực hai tầng; thẻ *Con đường của bạn* trên bảng điều khiển; badge con đường trên module ma trận |
| 🏠 Bảng điều khiển | Hero theo lĩnh vực; thẻ **Con đường của bạn** (vị trí, lĩnh vực kế tiếp); **Tiếp tục** (mục mở gần đây); **Bước tiếp theo** lấy từ Hướng dẫn học; số liệu lộ trình / tài liệu đã đọc / flashcard / trắc nghiệm / phỏng vấn / thi thử / ma trận; **chuỗi ngày học** 14 ngày; lưới lĩnh vực khác bấm để chuyển |
| 🧭 Hướng dẫn học | Mỗi lĩnh vực: cho ai, bao lâu, cần gì trước; **lộ trình khuyến nghị** cấp module (stepper) với trạng thái tính từ tiến độ thật (track, tài liệu đã đọc, flashcard, trắc nghiệm, thi thử, ma trận, hoặc tự tick); cách học hiệu quả; bẫy phương pháp; “coi như xong khi”; cách học từng track |
| 🗺️ Lộ trình học | 30 track / 1303 mục theo tuần, mỗi mục một bài học markdown; khối **Cách học track này**; badge **Bắt đầu tại đây**; chip 📖 nối tuần chứng chỉ với chương sách; tiến độ lưu riêng từng track |
| 📚 Thư viện tài liệu | 345 tài liệu, gom theo **sách → Phần** (Phần lấy từ README nguồn / domain đề thi, không bịa); nhãn chương thống nhất `Ch. 5 · Pod` sinh từ `chapter` (không viết tay); khối **Đọc liền mạch trên con đường** (180 cặp liên kết chéo khác lĩnh vực); trang đọc có **hướng dẫn đọc suy từ lộ trình** (mục tiêu, bài học liên quan, bẫy, câu tự kiểm tra), thời gian đọc ước tính, **đánh dấu đã đọc**, thanh tiến độ cuộn, chỉnh cỡ chữ, mục lục nổi (desktop) / gọn (mobile), link `.md` tương đối mở trong app, mermaid, ảnh, copy code |
| 📊 Ma trận năng lực | 6 module / 34 chủ đề / 96 tiêu chí Senior Java theo 4 cấp độ — chỉ lĩnh vực Lộ trình Senior Java |
| 🎓 Chứng chỉ K8s · ⚡ Thực hành nhanh · 🧪 Labs · ⏱️ Thi thử | Chỉ lĩnh vực Kubernetes: so sánh 5 chứng chỉ; 130 lệnh, 48 YAML mẫu, 16 quy trình, thẻ trước giờ thi (ghim, lọc, chế độ gọn); 22 lab đề thật; thi thử bấm giờ theo tỷ trọng domain |
| 🃏 Flashcards · ✅ Trắc nghiệm | 174 thẻ spaced repetition, 220 câu có giải thích — Kubernetes và Lập trình hệ thống |
| 🎤 Câu hỏi phỏng vấn | **360 câu tự luận** có đáp án mẫu và rubric trên **15 lĩnh vực** (JPA, Java Concurrency in Practice, Optimizing Cloud Native Java, Java Scalability, Modern Java in Action, Effective Java, The Well-Grounded Java Developer, Java Under the Hood, DDIA, PostgreSQL 14 Internals, Kafka, Modern Concurrency, Spring Start Here, Spring Security, Lập trình hệ thống) — mỗi lĩnh vực 6 chủ đề × 4 cấp năng lực (L1 Hiểu lý thuyết → L4 Thiết kế & xử lý sự cố), đúng 6 câu mỗi cấp. Hai pha: trả lời rồi mới lật đáp án; tự tick từng ý `mustCover` rồi tự chấm ba mức; tổng kết tách theo cấp để thấy rụng ở tầng nào. Hợp đồng cứng theo cấp do `check-data.mjs` ép: L2 phải có `code`, L3 phải có `tradeoffs`, L4 phải có `incident` với `symptom`/`scale`/`constraints` |
| 🛠️ Thực hành | **Toàn cục** (`#/practice`): chương trình thực hành theo buổi, mỗi buổi 60–90 phút làm bằng bộ lệnh [`labs/lab`](../labs/README.md), trên VM thật (CKA) hoặc trên workspace git ngay trên máy bạn (Spring Security in Action, JDK + Maven). Trang buổi có mục tiêu, trạng thái đầu vào / đầu ra, nhiệm vụ tick từng bước, gợi ý, lời giải, mẹo thi, kết quả mong đợi (`verify` in gì) và câu ôn; bấm giờ theo mục tiêu thời gian của đề thi; ghi chú riêng từng buổi; trang **kỹ năng** gom kỹ năng học mới và dùng lại ở buổi nào; thi thử bằng đề mock rồi dán dòng `devprep-mock:v1:…` do `./labs/lab mock … score` in ra để lưu điểm theo domain. Buổi khung (chưa phát hành) hiện đề cương nhưng không tính vào tiến độ. Chương trình có sẵn: CKA. Bảng điều khiển của lĩnh vực có thẻ tiến độ Thực hành |
| 🔍 Tìm kiếm toàn cục | `Ctrl/⌘ K` hoặc `/`: tài liệu, bài học, lab, lệnh, YAML, quy trình, flashcard — **khớp không dấu**, chuyển lĩnh vực tự động khi mở kết quả |
| ⚙️ Cài đặt & tiến độ | Theme (sáng / tối / hệ thống), cỡ chữ đọc, **xuất / nhập toàn bộ tiến độ** (JSON), dung lượng từng khoá, đặt lại |

Toàn bộ tiến độ lưu trong `localStorage` (namespace `kubeprep.` — giữ nguyên vì lịch sử) — không đăng
nhập, không backend. Module Thực hành dùng bốn khoá: `practice.done` (buổi đã xong, kèm thời điểm),
`practice.tasks` (nhiệm vụ đã tick), `practice.notes` (ghi chú theo buổi), `practice.mock` (danh sách
kết quả thi thử); cả bốn đi theo xuất / nhập tiến độ như mọi khoá khác. Phím tắt: `?`.

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

73 bất biến: id trùng, tệp/ảnh tồn tại, `docs[].file` nằm trong `content/<field>/` (#2c), link
`#/docs` hỏng, link chéo sách, khoá phân loại, hình dạng câu hỏi, hợp đồng câu hỏi phỏng vấn theo cấp
độ (#IQ1–#IQ8), module ↔ dữ liệu, hướng dẫn học (G1–G4), con đường (P1), chương/Phần và tiền tố cũ
(D1), liên kết chéo (R1), link lộ trình cùng đường (#3b), lịch 104 tuần (PL1–PL4: mọi tham chiếu
tuần/mục/tài liệu tồn tại và đúng khoảng; mọi mục `sj-gd*`/`fs-gd*` xuất hiện đúng một lần; 104 tuần
liên tục, quý/giai đoạn/tuần nghỉ khớp; giờ 6–10 mỗi tuần, ≤ 4 chương đọc), module Thực hành
(PR1–PR12: chương trình, đề thi tuỳ chọn và tỷ trọng domain khi có; id buổi/kỹ năng/chặng/mock không
trùng; tham chiếu và `requires` hợp lệ; kỹ năng học ở đúng một buổi, `area` thuộc `skillAreas` của chính
chương trình; phủ đủ năng lực của đề và mảnh project; buổi khung đủ trường, buổi đã phát hành đủ nội dung;
số buổi theo domain khớp tỷ trọng đề; đề mock; thư mục `labs/` khớp dữ liệu hai chiều, kể cả mốc snapshot
và lỗi gây có chủ ý; phần dùng chung không nhắc tên chương trình) và số lượng bản ghi theo bảng kỳ vọng.

Test đơn vị cho logic thuần của module Thực hành (không cần trình duyệt):

```bash
node --test "webapp/scripts/tests/*.test.mjs"
```
CI chạy trước khi deploy, cùng bộ test CLI lab `/bin/bash labs/tests/run.sh` (multipass và docker giả, không đụng VM).

## Deploy GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` chạy khi push `main`: build content → check-data →
copy `webapp/` (bỏ `scripts/`) + content → deploy. Bật một lần: **Settings → Pages → Source: GitHub Actions**.

Docker: `docker compose up --build` → http://localhost:9020 (`.dockerignore` loại PDF, `inbox/`, `docs/`).
Đóng gói cho server không có mạng: [`docs/deploy-offline.md`](../docs/deploy-offline.md).

## Cấu trúc mã

```
webapp/
├── index.html                # shell: sidebar, topbar, theme boot (luôn đặt data-theme)
├── manifest.webmanifest      # cài lên màn hình chính
├── css/style.css             # design system: token light + một bảng dark, utility, component
├── scripts/
│   ├── dev.sh                # build content + http.server
│   ├── build-content.sh      # tar sources/ → content/ (trừ PDF); dùng bởi dev.sh, Dockerfile, CI
│   ├── check-data.mjs        # 73 bất biến dữ liệu
│   └── tests/                # test đơn vị (node --test) cho lib/practice.js
├── js/app.js                 # hash router, theme, sidebar, bộ chọn lĩnh vực, phím tắt
├── js/lib/
│   ├── store.js              # localStorage có namespace + exportAll/importAll
│   ├── field.js              # lĩnh vực đang chọn
│   ├── ui.js                 # h(), badge, toast, confirmDialog, openOverlay, statCard…
│   ├── markdown.js           # render markdown + highlight yaml/bash
│   ├── search.js             # chỉ mục tìm kiếm không dấu + command palette
│   ├── activity.js           # chuỗi ngày, mục gần đây, tài liệu đã đọc
│   ├── stats.js              # số liệu tiến độ theo lĩnh vực (dùng chung)
│   ├── guides.js             # đảo chỉ mục bài học → tài liệu; trạng thái bước hướng dẫn
│   ├── plan.js               # lịch 104 tuần đã nở, tuần hiện tại, tiến độ tuần từ tiến độ thật,
│   │                         #   nhật ký giờ học, nghi thức, mốc (module Kế hoạch tuần)
│   ├── practice.js           # logic thuần của module Thực hành: thứ tự buổi, tiến độ, chấm dòng mock,
│   │                         #   bọc store cho practice.*
│   └── timer.js              # bấm giờ và đếm ngược cho trang Thực hành
├── js/data/
│   ├── fields.js             # 18 lĩnh vực: label, icon, module bật; GLOBAL_MODULES
│   ├── meta.js · index.js · roadmap.js · docs-index.js · book-crossref.js
│   ├── guides.js             # fieldGuides / trackGuides / groupGuides
│   ├── paths.js              # 4 con đường học (con đường capstone crossLinks), trục Senior Java, module ma trận → con đường
│   ├── related.js            # liên kết chéo khác lĩnh vực (một chiều, code phản chiếu)
│   ├── books.js · labels.js  # mã sách; docLabel/docLabelWithBook/docBook/relatedOf
│   ├── practice/             # module Thực hành: index.js ráp PROGRAMS; <chương trình>/ có program.js
│   │                         #   (meta, đề thi, project, chặng), stage-NN.js (buổi), skills.js, mocks.js
│   └── <lĩnh vực>/           # gương của sources/<lĩnh vực>/:
│       ├── docs.js           #   danh mục tài liệu: id, chapter, part, title (tên chương), file…
│       ├── roadmap-*.js      #   track lộ trình theo tuần
│       └── …                 #   kubernetes: certs, commands, snippets, playbooks, examday, labs,
│                             #   flashcards, questions; sysprog: flashcards, questions;
│                             #   senior-java: matrix, schedule (lịch 104 tuần: PLAN + 104 tuần
│                             #     tham chiếu id mục sj-gd*/fs-gd*/ckad/cka và id tài liệu);
│                             #   interview (24 câu/lĩnh vực): jpa · jcip · ocnj ·
│                             #   java · modern-java · effective-java · wgjd · under-hood · ddia · pg-internals · kafka ·
│                             #   modern-concurrency · spring-start ·
│                             #   spring-security · sysprog
└── js/views/                 # dashboard, guide, roadmap, docs, tracker, certs, commands,
                              # flashcards, quiz, interview, exam, labs, settings,
                              # planner, practice (toàn cục — GLOBAL_MODULES + mục nav `global: true`)
```

Sửa lịch 104 tuần: chỉ sửa `js/data/senior-java/schedule.js` (mỗi tuần một khối `w(n, {...})`, tham chiếu `[weekId, from, to]`), chạy `check-data.mjs` (PL1–PL4), rồi sinh lại bảng tuần trong `sources/senior-java/06-…md` từ dữ liệu.
Thêm buổi hay chương trình thực hành: xem mục [Thêm chương trình thực hành](#thêm-chương-trình-thực-hành) dưới đây.
Thêm câu hỏi / câu hỏi phỏng vấn / flashcard / lab: sửa tệp tương ứng trong `js/data/<lĩnh vực>/` theo schema ở đầu tệp,
chạy `check-data.mjs` — không cần đụng view. Thêm lĩnh vực: khai trong `fields.js` (kèm `short`/`unit`), xếp vào một con đường trong `paths.js`, tạo
`js/data/<id>/docs.js` (có `chapter`/`part`), thêm `fieldGuides[id]` và `trackGuides` cho mỗi track.

## Thêm chương trình thực hành

Dữ liệu của một chương trình nằm ở `js/data/practice/<id>/`: `program.js` (meta, môi trường, project, chặng), `stage-NN.js` (buổi), `skills.js`, `mocks.js`; `js/data/practice/index.js` import và ráp chúng vào `PROGRAMS`. `lib/practice.js` và `views/practice.js` dùng chung, không được nhắc tên chương trình nào (PR12). Quy tắc nằm ở PR1–PR12 trong `scripts/check-data.mjs`; phần quy tắc của các trường mới tách ra `scripts/practice-rules.mjs` để test đơn vị được. Phần chạy trên máy (`labs/<id>/`) theo [`../labs/README.md`](../labs/README.md#thêm-một-chương-trình-thực-hành-mới).

**Thêm một buổi:** khai đủ trường của buổi khung trong `stage-NN.js` — `id`, `stage`, `title`, `durationMin`, `domain` (`null` khi chương trình không có đề thi), `competencies`, `requires`, `pieces`, `goals`, `skills`, `uses` (mảng), `status` (`"skeleton"` hoặc `"published"`), `stateIn`, `stateOut` — rồi thêm id vào `stages[].sessions` trong `program.js` và vào `labs/<id>/sessions/ORDER` (cùng thứ tự, PR11).

**Phát hành một buổi:** đổi `status` thành `"published"`, viết đủ `mindset`, `refs`, `tasks` (≥ 3), `hints` (≥ 2), `solution`, `tips` (≥ 2), `outcome` (`md`, `verifyOutput` là output thật của một lần `verify`, `projectDelta` khi có project), `review` (3–5 câu), và khối luyện tập: `exam` nếu chương trình có đề thi, `work` nếu không (xem dưới). Thêm thư mục `labs/<id>/sessions/<buổi>/` theo driver (`multipass`: `apply.sh` + `verify.sh`, chạy thử trên VM thật; `local`: `verify.sh` + `solution/` hoặc `apply.sh`, chạy thử bằng `./labs/lab selftest <id>`), tăng số `practice-published:<id>` trong bảng kỳ vọng của `check-data.mjs` (sửa số **trước**), rồi chạy `check-data.mjs`.

**Thêm một chương trình:** `program.js` khai `field` là id một lĩnh vực có trong `fields.js` (PR1) và `skillAreas: [{ id, label, prefix }]` (PR5; mỗi kỹ năng trong `skills.js` có `area` thuộc danh sách này và id bắt đầu bằng `prefix` của nó). `exam` là tuỳ chọn: chương trình theo chứng chỉ khai `exam.domains` (tỷ trọng cộng đúng 100), `passPct`, `durationMin`; chương trình theo chủ đề bỏ hẳn `exam`, khi đó trang không hiện độ phủ đề thi, số tuần còn lại, tag domain, ngưỡng đậu, và không có trang mock. Mỗi đề trong `mocks.js` cần `exam` và `labs/<id>/mocks/<đề>/{setup.sh,score.sh}` (PR10, PR11). Đăng ký trong `index.js`, khai số kỳ vọng (`practice-sessions:<id>`, `practice-published:<id>`) trong `check-data.mjs`.

### Trường dữ liệu cho chương trình chạy cục bộ và theo sách

Các trường dưới đây đều tuỳ chọn; chương trình không khai thì chạy như trước (CKA chỉ khai `env.tool: "multipass"`). Ví dụ đầy đủ: `js/data/practice/ssia/`.

| Trường | Ở đâu | Ý nghĩa | Quy tắc |
|---|---|---|---|
| `env.tool` | `program.js` | Driver của bộ lab: `"multipass"` hoặc `"local"`, khớp `LAB_DRIVER` trong `labs/<id>/env.sh` | PR8: chỉ hai giá trị đó. PR11: `"local"` thì buổi đã phát hành cần `verify.sh` và `solution/` hoặc `apply.sh`; khác thì cần `apply.sh` + `verify.sh` |
| `labels.workBlock` | `program.js` | Tiêu đề khối luyện tập của trang buổi khi chương trình không có đề thi (mặc định `🏋️ Luyện tập`; `ssia`: `🧩 Trong công việc`) | PR8: chuỗi không rỗng; `labels` chỉ nhận `workBlock`, `startStep` |
| `labels.startStep` | `program.js` | Tiêu đề bước 1 trên trang chủ chương trình (mặc định `Khởi động lab`; `ssia`: `Chuẩn bị workspace`) | như trên |
| `book` | `program.js` | `{ label, docPrefix }`: chương trình học theo một cuốn sách có trong Thư viện | PR8: cần cả hai; mỗi buổi đã phát hành có ít nhất một `refs` trỏ `#/docs/<docPrefix>…` |
| `rules` | `program.js` | `{ diagram, dissect }` (true/false): bật quy tắc nội dung cho mọi buổi đã phát hành | PR8: `diagram` thì `mindset` có một khối ` ```mermaid `; `dissect` thì có ít nhất một nhiệm vụ `kind: "dissect"` |
| `stages[].num` | `program.js` | Số hiển thị của chặng trên trang chủ (với `ssia`: số chương sách). Không khai thì dùng chỉ số của chặng, đếm từ 0 | — |
| `session.work` | `stage-NN.js` | Khối luyện tập của chương trình **không có đề thi**: `patterns` (dạng tình huống thường gặp), `timeTargetMin`, `drills` (`{ text, timeLimitMin, solution }`) | PR8: buổi đã phát hành cần `work.patterns` (≥ 1) và `work.timeTargetMin` > 0 |
| `session.bookDiff` | `stage-NN.js` | Bảng **📕 Khác với sách**: mảng `{ book, now, why }` — sách viết gì, phiên bản đang dùng làm gì (đã quan sát), vì sao | PR8: cả ba chuỗi không rỗng |
| `tasks[].kind` | `stage-NN.js` | `"dissect"`: nhiệm vụ mổ xẻ (đọc log, chạy debugger, ghi kết quả vào tệp trả lời); trang buổi gắn nhãn "mổ xẻ" | PR8: chỉ nhận `"dissect"` |
| kỹ năng `kind: "code"` | `skills.js` | Kỹ năng viết code: Java, annotation, SpEL (cấu hình `application.yml`/`.properties` vẫn là `yaml`). Bản đồ kỹ năng lọc theo nhóm "💻 Code" | PR5: `kind` thuộc `command`, `yaml`, `code`, `procedure`, `concept`, `docs`, `path` |

**Chương trình không có `exam` phải dùng `session.work`.** Khối luyện tập đọc `session.exam ?? session.work`, nên một buổi cũ viết `exam: { patterns, timeTargetMin }` vẫn hiển thị, nhưng PR8 báo lỗi: với chương trình không có `exam`, buổi đã phát hành thiếu `work` bị báo `work.patterns cần ≥1` và `thiếu work.timeTargetMin` (đã thử bằng `sessionContentProblems` trong `practice-rules.mjs`).

### Chương trình theo sách, chạy cục bộ

Các bước cho một chương trình như `ssia` (học theo thứ tự chương một cuốn sách đã có bản dịch trong `sources/`, bộ lab driver `local`):

1. **Phần chạy trên máy**: `labs/<id>/env.sh` với `LAB_DRIVER="local"`, bản gốc của ứng dụng ở `labs/<id>/app/`, `sessions/ORDER`, và mỗi buổi đã phát hành một thư mục theo [hợp đồng buổi của driver `local`](../labs/README.md#hợp-đồng-buổi-của-driver-local). Chạy `./labs/lab selftest <id>` cho tới khi xanh.
2. **`program.js`**: `field` là lĩnh vực của cuốn sách; bỏ `exam`; `env: { tool: "local", commands: { up, down, status, begin, check, verify, restore, break, selftest, destroy } }` với mẫu `./labs/lab <lệnh> <id> <session>`; `labels` cho hai tiêu đề; `book: { label, docPrefix }` với `docPrefix` là tiền tố id tài liệu của sách trong `js/data/<lĩnh vực>/docs.js` (với `ssia`: `springsec-`); `rules` nếu muốn bắt buộc sơ đồ và nhiệm vụ mổ xẻ; mỗi chặng một chương, `num` là số chương.
3. **Buổi** (`stage-NN.js`): `domain: null`, khối `work` thay cho `exam`, `refs` trỏ chương sách `#/docs/<docPrefix>NN`, `bookDiff` cho chỗ phiên bản đang dùng khác sách, nhiệm vụ mổ xẻ có `kind: "dissect"`. `mocks.js` xuất mảng rỗng.
4. **Kỹ năng** (`skills.js`): `kind` theo bảng trên, để trống `ref` (chỉ lĩnh vực có module Thực hành nhanh mới có `ref`, PR5).
5. Đăng ký trong `index.js`, khai số kỳ vọng, chạy `check-data.mjs` và `node --test "webapp/scripts/tests/*.test.mjs"`.
