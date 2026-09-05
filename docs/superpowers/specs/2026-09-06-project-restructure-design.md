# Tái cấu trúc DevPrep: thư mục nguồn, giao diện webapp và module "Hướng dẫn học" — thiết kế

Ngày: 2026-09-06
Trạng thái: triển khai trực tiếp trên nhánh `claude/webapp-restructure-6b6de3` (phiên tự động, không có
vòng duyệt giữa chừng — mọi quyết định đều ghi ở §2 để người review đối chiếu).
Spec gần nhất để đối chiếu khuôn mẫu: [`2026-09-05-k8s-two-books-design.md`](2026-09-05-k8s-two-books-design.md).

## 1. Bối cảnh — hiện trạng đã đo

Repo bắt đầu là "ghi chú Java scalability" rồi lớn dần thành nền tảng học đa lĩnh vực DevPrep
qua 10 lần tích hợp sách. Mỗi lần tích hợp thêm một thư mục ở gốc theo quy ước của lúc đó,
nên gốc repo hiện có **31 mục** với 5 kiểu đặt tên khác nhau:

| Kiểu tên | Ví dụ | Vấn đề |
|---|---|---|
| Viết hoa | `CKA/`, `CKAD/`, `CKS/` | 7 tệp md rải 3 thư mục, cùng một lĩnh vực |
| Tiếng Việt có ký tự đặc biệt | `Chủ đề I — Connection & Request Lifecycle/` | Em dash, `&`, dấu cách — URL trong README phải encode; shell phải quote; 10 bài Java rải 4 thư mục nên **336 link chéo `.md`** kiểu `./07-threadpool-sizing.md` đang trỏ sai thư mục |
| snake_case | `System_Programming_VI/` | Lệch với 9 thư mục kebab-case còn lại |
| kebab + hậu tố `-vi` | `kuar-vi/`, `ddia-vi/`, … | Nhất quán với nhau nhưng tên không khớp id lĩnh vực trong `fields.js` (`kuar` ≠ `kubernetes`, `mjia` ≠ `modern-java`) |
| Có dấu cách | `Kubernetes In Action/` | Nguồn thô vừa thêm ở commit `3c2d2d4` — **bản dịch khác** của cùng cuốn với `k8s-ebook/` (18 chương so với 17, 204 ảnh so với 184), chưa tích hợp vào app |

Số liệu đã đo, không ước lượng:

| Chỉ số | Giá trị |
|---|---:|
| Tệp markdown nguồn (ngoài webapp) | 231 |
| Tệp PDF sách có bản quyền trong git | **135**, ≈ 170 MB, nằm cạnh markdown trong 8 thư mục |
| Kích thước working tree | 245 MB (`Kubernetes In Action/` một mình 46 MB) |
| Tài liệu trong app | 196 (10 lĩnh vực) |
| Track lộ trình / mục | 17 / 804 |
| Flashcard / câu hỏi / lab / tiêu chí ma trận | 174 / 220 / 22 / 96 |
| Tệp dữ liệu trong `webapp/js/data/` | 45, **phẳng**, tên không theo lĩnh vực (`mjia-*`, `modconc-*`, `roadmap-part1` = CKAD) |
| `docs-index.js` | 1.871 dòng, một tệp cho cả 196 tài liệu |
| `build-content.sh` | 13 lệnh `cp` viết tay, mỗi cuốn 1–2 dòng; đích trong `content/` dùng tên tắt riêng (`kuar`, `mjia`, `modconc`, `senior`) |

Webapp: vanilla JS, không build, design system CSS ~1.070 dòng, 10 view. Chất lượng nền tốt
(theme sáng/tối, markdown renderer riêng, 40 bất biến dữ liệu). Khoảng trống trải nghiệm đã ghi
nhận khi đọc mã:

1. Chọn lĩnh vực bằng `<select>` 10 dòng trong sidebar; thẻ lĩnh vực trên bảng điều khiển **không bấm được**.
2. **Không có tìm kiếm** — 196 tài liệu, 804 bài học, 130 lệnh chỉ duyệt được bằng mắt.
3. Trang đọc tài liệu: không có thời gian đọc ước tính, không đánh dấu "đã đọc", không chỉnh cỡ chữ,
   link `.md` tương đối trong bài mở thẳng tệp thô thay vì tài liệu trong app.
4. Bảng điều khiển không nhớ "đang học tới đâu" xuyên lĩnh vực; không có chuỗi ngày học.
5. `alert()`/`confirm()` ở 6 chỗ; style nội tuyến rải trong mọi view; bảng token dark lặp hai lần
   (`[data-theme=dark]` và `@media prefers-color-scheme`) — 30 dòng trùng.
6. Không có chỗ nào trả lời câu hỏi **"tôi nên học lĩnh vực này như thế nào, bắt đầu từ đâu, học
   xong khi nào"** — mỗi track có `prereq`/`desc` nhưng không có hướng dẫn phương pháp; tài liệu
   không có hướng dẫn đọc; 10 lĩnh vực không có lộ trình cấp module (đọc gì trước, luyện gì sau).
7. Không xuất/nhập được tiến độ — đổi máy hay xoá cache là mất sạch.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Gom mọi nguồn học vào `sources/<fieldId>/…`, **tên thư mục = id lĩnh vực** trong `fields.js` | Một quy tắc thay cho 5. Mở đường cho `build-content.sh` copy nguyên cây, và cho bất biến mới "mọi `docs[].file` bắt đầu bằng `content/<field>/`". |
| 2 | Lĩnh vực có nhiều nguồn (chỉ `kubernetes`) thì một thư mục con mỗi nguồn: `certs/`, `kubernetes-in-action/`, `cka-study-guide/`, `kubernetes-up-and-running/` | Các lĩnh vực còn lại đúng một nguồn → markdown nằm thẳng trong `sources/<field>/`. Không tạo cấp trung gian rỗng. |
| 3 | 10 bài Java gom phẳng vào `sources/java/` + `images/`; sửa `../images/` → `images/` | Bốn thư mục "Chủ đề …" chỉ là nhóm trình bày — README đã nhóm sẵn; gom phẳng **sửa luôn 336 link chéo `.md`** đang lệch thư mục. |
| 4 | PDF gom vào `pdf/` trong từng thư mục sách bằng `git mv`; loại khỏi `content/`, Docker, Pages | Giữ nguyên lịch sử và quyền quyết định của tác giả về việc lưu PDF; nhưng 170 MB không có lý do nằm trong image nginx hay artifact Pages. |
| 5 | `Kubernetes In Action/` → `inbox/kubernetes-in-action-2e/`, **không** tích hợp, **không** xoá | Đây là bản dịch thứ hai chưa có spec tích hợp riêng. Tích hợp là việc nội dung (so 18 chương với 17 chương hiện có, quyết định thay hay bổ sung) — ngoài phạm vi tái cấu trúc. `inbox/` là nơi rõ ràng cho "nguồn thô chờ xử lý". |
| 6 | `webapp/content/` là **bản sao nguyên cây** của `sources/` trừ PDF; `build-content.sh` còn một lệnh `tar` | 13 lệnh `cp` viết tay là điểm phải sửa mỗi lần thêm sách; đã từng gây bug ảnh vỡ (bất biến #2b sinh ra vì nó). |
| 7 | `webapp/js/data/` chia theo lĩnh vực: `data/<fieldId>/…`; `docs-index.js` tách thành `data/<fieldId>/docs.js` | Cùng nguyên tắc #1 áp cho mã. Tên export **giữ nguyên** nên chỉ đường dẫn import đổi. |
| 8 | Script công cụ gom vào `webapp/scripts/` | Tách "thứ chạy trên máy dev/CI" khỏi "thứ deploy lên Pages". Workflow đang phải `rm` từng tệp khỏi `_site/`. |
| 9 | Module mới `guide` ("Hướng dẫn học") bật cho **cả 10 lĩnh vực**; dữ liệu ở `data/guides.js` | Trả lời khoảng trống #6. Bất biến #7 mở rộng: khai `guide` thì phải có `fieldGuides[field]`; mọi track phải có `trackGuides[track.id]`. |
| 10 | Hướng dẫn đọc **từng tài liệu** suy ra tự động từ lộ trình, không viết tay 196 bản | 26 tệp lộ trình đã có 458 mục dạng **Mục tiêu / Đọc / Bẫy / Tự kiểm tra** trỏ `#/docs/<id>`. Đảo chỉ mục: với mỗi tài liệu, gom các mục lộ trình trỏ tới nó → mục tiêu đọc, bài học liên quan, câu tự kiểm tra. Nội dung có sẵn, chỉ thiếu góc nhìn. |
| 11 | Namespace localStorage `kubeprep.` và mọi id tiến độ **giữ nguyên** | Ràng buộc cũ của repo (xem `store.js`). Khoá mới thêm vào: `docs.read`, `recent`, `activity`, `reader.fontScale`. |
| 12 | Không thêm dependency, không bước build cho app | Nguyên tắc gốc của webapp. Tìm kiếm, toast, dialog, popover đều viết tay trên API trình duyệt. |
| 13 | Triển khai theo **5 chặng**, mỗi chặng một commit, `check-data.mjs` xanh trước khi sang chặng sau | Diff tái cấu trúc thư mục rất lớn (≈ 600 rename) — tách khỏi diff thay đổi hành vi để review được. |

### 2.1 Giả định do không có vòng hỏi-đáp

- "Guideline học cho từng phần cụ thể" được hiểu ở **ba cấp**: lĩnh vực (module `guide`),
  track lộ trình (khối "Cách học track này"), tài liệu (khối "Hướng dẫn đọc"). Nếu ý người dùng
  là cấp khác (ví dụ từng tuần), dữ liệu `guides.js` đã có chỗ mở rộng.
- Nội dung hướng dẫn viết dựa trên `desc`/`prereq`/`goal` sẵn có và cấu trúc sách; **không**
  bịa số liệu hay tính năng. Chỗ nào cần thời lượng, dùng `durationWeeks` của track.
- Không xoá gì ngoài tệp trùng 100% do chính lần di chuyển này tạo ra. Không đụng
  `docs/superpowers/` cũ và `.superpowers/` (hồ sơ lịch sử).

## 3. Cấu trúc thư mục đích

```
.
├── README.md                         ← viết lại phần cấu trúc; giữ nội dung Java series
├── Dockerfile · docker-compose.yml · .dockerignore (mới) · .gitignore
├── .github/workflows/deploy-pages.yml
├── docs/superpowers/{specs,plans}/   ← giữ nguyên
├── sources/                          ← MỌI nguồn học. 1 thư mục = 1 lĩnh vực = 1 id trong fields.js
│   ├── README.md                     ← quy ước đặt tên, cách thêm nguồn mới
│   ├── kubernetes/
│   │   ├── certs/                    ← 7 md CKAD/CKA/CKS tự biên
│   │   ├── kubernetes-in-action/     ← k8s-ebook (17 md + README + images/)
│   │   ├── cka-study-guide/          ← cka-book-vi (23 md + images/ + pdf/)
│   │   └── kubernetes-up-and-running/← kuar-vi (24 md + images/ + pdf/)
│   ├── sysprog/                      ← System_Programming_VI (19 md + images/)
│   ├── java/                         ← 10 md + images/ (gom từ 4 "Chủ đề" + images/ gốc)
│   ├── modern-java/                  ← modern-java-vi (23 md + images/ + pdf/)
│   ├── ddia/                         ← ddia-vi (14 md + images/ + pdf/)
│   ├── kafka/                        ← kafka-vi (14 md + images/ + pdf/)
│   ├── modern-concurrency/           ← modern-concurrency-vi (9 md + images/ + pdf/)
│   ├── spring-start/                 ← spring-start-vi (16 md + images/ + pdf/)
│   ├── spring-security/              ← spring-security-vi (22 md)
│   └── senior-java/                  ← senior-java-roadmap (5 md)
├── inbox/                            ← nguồn thô CHƯA tích hợp, không vào app
│   └── kubernetes-in-action-2e/      ← "Kubernetes In Action" (18 md, 18 pdf, 204 ảnh)
└── webapp/
    ├── index.html · manifest.webmanifest (mới) · css/style.css
    ├── scripts/{dev.sh, build-content.sh, check-data.mjs}
    ├── content/                      ← build output = sources/ trừ *.pdf (gitignored)
    └── js/
        ├── app.js
        ├── lib/  store · field · ui · markdown · search (mới) · activity (mới) · guides (mới)
        ├── data/
        │   ├── fields.js · meta.js · index.js · roadmap.js · docs-index.js · book-crossref.js · guides.js (mới)
        │   ├── kubernetes/  docs.js, certs.js, commands.js, commands-admin.js, snippets.js,
        │   │                playbooks.js, examday.js, labs.js, flashcards.js, questions.js,
        │   │                roadmap-ckad-part{1,2,3}.js, roadmap-cka-part{1,2,3}.js,
        │   │                roadmap-cks-part{1,2}.js, roadmap-kia-part{1,2}.js,
        │   │                roadmap-ckabook.js, roadmap-kuar-part{1,2}.js
        │   ├── sysprog/     docs.js, roadmap-part{1,2}.js, flashcards.js, questions-part{1,2}.js
        │   ├── java/        docs.js
        │   ├── senior-java/ docs.js, roadmap-gd{1..4}.js, matrix.js
        │   └── {spring-security,modern-concurrency,ddia,modern-java,kafka,spring-start}/
        │                    docs.js, roadmap-part{1,2}.js
        └── views/  dashboard · guide (mới) · settings (mới) · roadmap · docs · tracker · certs
                    · commands · flashcards · quiz · exam · labs
```

Ánh xạ đường dẫn `docs[].file` (sed một lượt, kiểm bằng bất biến #2 sau khi build):

| Cũ | Mới |
|---|---|
| `content/CKAD-*.md`, `content/CKA-*.md`, `content/CKS-*.md` | `content/kubernetes/certs/…` |
| `content/k8sbook/` · `content/ckabook/` · `content/kuar/` | `content/kubernetes/{kubernetes-in-action,cka-study-guide,kubernetes-up-and-running}/` |
| `content/springsec/` · `content/senior/` · `content/modconc/` · `content/mjia/` · `content/springstart/` | `content/{spring-security,senior-java,modern-concurrency,modern-java,spring-start}/` |
| `content/java/` · `content/sysprog/` · `content/ddia/` · `content/kafka/` | không đổi |

## 4. Webapp — giao diện và trải nghiệm

### 4.1 Nền tảng (áp cho mọi view)

- **Theme**: script boot trong `index.html` luôn đặt `data-theme` (đọc lựa chọn đã lưu, không có
  thì lấy `prefers-color-scheme`, và lắng nghe thay đổi hệ thống khi chưa chọn). CSS bỏ khối
  `@media (prefers-color-scheme: dark)` trùng lặp — bảng token dark còn một nơi.
- **Token & utility**: thêm `--space-*`, lớp `.stack`, `.mt-*`/`.mb-*`, `.section-title`,
  `.card-head`, `:focus-visible` ring thống nhất cho `.btn`, `.chip`, `.nav-link`, `.q-option`.
  View được sửa trong lần này (dashboard, roadmap, docs, tracker, guide, settings) bỏ style nội
  tuyến; view không đụng hành vi (quiz, exam, labs, commands, certs, flashcards) chỉ đổi
  `alert`/`confirm` → toast/dialog.
- **Toast & dialog** (`lib/ui.js`): `toast(msg, kind)` góc dưới, `confirmDialog(msg)` dùng
  `<dialog>` trả Promise. Thay 6 chỗ `alert`/`confirm`.
- **Bộ chọn lĩnh vực**: nút trong sidebar (icon + tên + ▾) mở **bảng chọn** 10 thẻ (icon, tên,
  thanh tiến độ lộ trình, số module). Esc/backdrop đóng. Trên bảng điều khiển, thẻ lĩnh vực
  **bấm được** và làm cùng việc.
- **Tìm kiếm toàn cục** (`lib/search.js`, mở bằng `Ctrl/⌘+K`, `/`, hoặc nút 🔍 trong sidebar):
  chỉ mục dựng lười lần đầu mở, gồm tài liệu (tiêu đề, mô tả, tag, nhóm), mục lộ trình (tiêu đề
  + track + tuần), lab, lệnh, YAML mẫu, quy trình, flashcard (mặt trước). Chuẩn hoá bỏ dấu tiếng
  Việt (NFD + xoá dấu, `đ→d`) nên gõ "lo trinh" vẫn khớp "lộ trình". Kết quả nhóm theo loại, có
  badge lĩnh vực, ↑↓ Enter. Chọn kết quả ở lĩnh vực khác → app chuyển lĩnh vực rồi điều hướng.
  Không đưa câu hỏi trắc nghiệm vào chỉ mục (không có trang cho một câu đơn, và lộ đáp án).
- **Phím tắt**: `?` mở bảng phím tắt; `Ctrl/⌘+K` tìm kiếm; giữ các phím sẵn có của flashcards.
- **Trang `#/settings`** (nút ⚙️ ở chân sidebar, mọi lĩnh vực): theme, cỡ chữ đọc, **xuất/nhập
  tiến độ** (JSON toàn bộ khoá `kubeprep.*`), dung lượng đã dùng, đặt lại toàn bộ (qua dialog).
- `manifest.webmanifest` để cài được lên màn hình chính. Không thêm service worker (đề xuất §6).
- `.dockerignore`: `.git`, `inbox/`, `**/pdf/`, `*.pdf`, `docs/`, `.superpowers/`, `webapp/content/`.

### 4.2 Bảng điều khiển

Thứ tự khối, trên xuống:

1. **Hero theo lĩnh vực** (icon, tên, `desc`) thay cho đoạn liệt kê 10 lĩnh vực.
2. **Tiếp tục** — mục gần nhất người dùng mở (tài liệu / bài học / tiêu chí) lấy từ khoá
   `recent` (tối đa 8 bản ghi `{type, href, title, field, ts}`, ghi bởi docs/roadmap/tracker).
   Ẩn khi trống.
3. **Bước tiếp theo** — bước đầu tiên chưa hoàn thành trong `fieldGuides[field].steps` (§5.2),
   kèm nút đi thẳng. Đây là cầu nối sang module `guide`.
4. **Thẻ số liệu** như hiện có + thẻ mới "Tài liệu đã đọc x/y" + "🔥 chuỗi ngày" (từ khoá
   `activity`: `{ "YYYY-MM-DD": n }`, ghi khi tick bài học, chấm flashcard, trả lời trắc nghiệm,
   đánh dấu đã đọc, tick tiêu chí; hiển thị 14 ngày gần nhất dạng chấm).
5. **Khu vực học tập** như hiện có.
6. **Các lĩnh vực khác** — lưới thẻ bấm được (icon, tên, tiến độ lộ trình %), thay dải tổng quan.

### 4.3 Trang đọc tài liệu

- Thanh tiến độ cuộn mảnh sát mép trên `main`.
- Dòng meta dưới tiêu đề: nhóm/sách, **≈ N phút đọc** (số từ / 220), trạng thái đã đọc.
- Nút **✓ Đánh dấu đã đọc** (toggle, khoá `docs.read: { [docId]: ts }`), lặp lại ở cuối bài.
  Thẻ tài liệu ở trang danh mục hiện dấu ✓ và nhóm hiện "x/y đã đọc".
- **A− / A+** chỉnh cỡ chữ prose (`reader.fontScale` 0.9–1.3), áp cả bài học lộ trình.
- Link `.md` tương đối trong bài → `#/docs/<id>` khi tìm được tài liệu có `file` tương ứng
  (resolve theo thư mục chứa tệp, cùng quy tắc với ảnh).
- Mục lục: dưới 1150px chuyển thành `<details>` gọn ở đầu bài thay vì ẩn hẳn.
- Khối **📖 Hướng dẫn đọc** (§5.3) đặt ngay dưới meta, mở mặc định khi chưa đánh dấu đã đọc.

### 4.4 Lộ trình

- Trang chọn track: thẻ gắn thêm badge "Bắt đầu tại đây" cho track mà `fieldGuides.steps`
  đặt đầu tiên; thứ tự thẻ theo `steps` nếu có, không thì như cũ.
- Trang track: khối **📌 Cách học track này** (`trackGuides[id]`, §5.2) dạng `<details>` dưới
  thanh tiến độ, mở mặc định khi tiến độ 0 %.
- `confirm` đặt lại → `confirmDialog`; `alert` hoàn thành → `toast`.

## 5. Module "Hướng dẫn học" (`guide`)

### 5.1 Ba cấp và nguồn dữ liệu

| Cấp | Hiển thị ở | Dữ liệu | Viết tay? |
|---|---|---|---|
| Lĩnh vực | `#/guide`, khối "Bước tiếp theo" ở dashboard | `fieldGuides[fieldId]` | Có — 10 bản |
| Track | Trang track, và mục "Các track" trong `#/guide` | `trackGuides[trackId]` | Có — 17 bản |
| Tài liệu | Trang đọc, khối "Hướng dẫn đọc" | `lib/guides.js` suy từ lộ trình (đảo chỉ mục) + `groupGuides` cho nhóm sách (tuỳ chọn) | **Không** cho 196 tài liệu; có cho 4 nhóm sách Kubernetes |

### 5.2 Hình dạng `data/guides.js`

```js
export const fieldGuides = {
  kubernetes: {
    tagline: "…một câu định vị lĩnh vực…",
    audience: "…ai nên học, ở mức nào…",
    hoursPerWeek: "8–10 giờ",
    prereqs: ["…", "…"],
    steps: [                          // lộ trình cấp module, thứ tự khuyến nghị
      { id: "k-1", title: "…", desc: "…", href: "#/roadmap/ckad",
        done: { kind: "track", id: "ckad", pct: 100 } },   // điều kiện hoàn thành, máy tính được
      { id: "k-2", title: "…", href: "#/flashcards",
        done: { kind: "flashcards", learnedPct: 80 } },
      // kind ∈ track | docs (readPct) | flashcards (learnedPct) | quiz (accuracy, seen)
      //        | exam (bestPct) | tracker (pct) | manual (không tự tính, người dùng tick)
    ],
    method: [ { title: "…", desc: "…" } ],   // cách học đặc thù lĩnh vực (3–5 mục)
    pitfalls: ["…"],                          // bẫy phương pháp (không phải bẫy kỹ thuật)
    doneWhen: ["…"],                          // coi như "xong lĩnh vực" khi…
  },
  …
};

export const trackGuides = {
  ckad: {
    rhythm: "…nhịp học mỗi tuần: đọc gì, gõ gì, bao lâu…",
    before: ["…chuẩn bị trước khi bắt đầu…"],
    during: ["…cách làm một mục: đọc bài → gõ lệnh → tick khi…"],
    after: ["…làm gì sau khi hết track…"],
  },
  …
};

export const groupGuides = {   // khoá = docs[].group
  "Kubernetes in Action (Lukša, Manning)": { howToRead: "…", pace: "…" },
  …
};
```

Bước `manual` lưu ở khoá `guide.manual: { [stepId]: ts }`. Các `kind` còn lại tính từ dữ liệu
tiến độ hiện có — không lưu gì thêm, nên đổi ngưỡng không làm lệch trạng thái đã lưu.

### 5.3 Hướng dẫn đọc một tài liệu — suy ra tự động (`lib/guides.js`)

`docGuide(docId)` trả về:

```js
{
  lessons: [ { trackId, trackLabel, trackIcon, weekId, weekLabel, itemId, text, checked } ],
  goals:   [ "…" ],   // đoạn sau "**Mục tiêu.**" của các bài học trỏ tới tài liệu này
  selfChecks: [ "…" ],// đoạn sau "**Tự kiểm tra.**"
  pitfalls: [ "…" ],  // đoạn sau "**Bẫy.**"
  weeks: [ { trackId, weekId, weekLabel } ], // tuần có tài liệu trong `resources`
  group: groupGuides[doc.group] ?? null,
}
```

Quy tắc khớp: bài học được coi là "trỏ tới" tài liệu khi `lesson` chứa `#/docs/<id>` **đúng id**
(ranh giới từ, tránh `kuar-1` khớp `kuar-10`). Tuần được coi là liên quan khi `resources[].href`
trỏ tới tài liệu. Tài liệu không có mục nào trỏ tới (ví dụ 10 bài Java, 5 bài Senior Java) chỉ
hiện thời gian đọc, nhóm và nút đánh dấu — khối không hiện phần rỗng.

Trích đoạn: tách theo regex `\*\*(Mục tiêu|Đọc|Bẫy|Tự kiểm tra)\.\*\*\s*` trên `lesson`,
lấy tới dòng trống kế tiếp; bỏ trùng nguyên văn.

### 5.4 Trang `#/guide`

1. Đầu trang: icon + "Hướng dẫn học — <lĩnh vực>", `tagline`, `audience`, `hoursPerWeek`, `prereqs`.
2. **Bạn đang ở đâu** — thanh tiến độ tổng (trung bình có trọng số các bước đã xong) + "Bước tiếp
   theo" nổi bật.
3. **Lộ trình khuyến nghị** — stepper dọc; mỗi bước: trạng thái ✓ / ▶ / ○, tiêu đề, mô tả, số
   liệu tiến độ của điều kiện (`72 % lộ trình`, `41/84 thẻ`), nút đi tới. Bước `manual` có checkbox.
4. **Cách học hiệu quả** (`method`) — thẻ.
5. **Bẫy phương pháp** (`pitfalls`) và **Coi như xong khi** (`doneWhen`) — hai cột.
6. **Từng track** — `<details>` cho mỗi track của lĩnh vực với `trackGuides` + tiến độ + link.

### 5.5 Bất biến mới trong `check-data.mjs`

- **G1** — lĩnh vực khai module `guide` phải có `fieldGuides[field]`; và ngược lại.
- **G2** — mọi `track.id` có `trackGuides[id]`; không khoá thừa.
- **G3** — mọi `steps[].href` trỏ tới route/track/doc có thật; `done.kind` hợp lệ; `done.id`
  (nếu có) tồn tại; ngưỡng trong (0, 100].
- **G4** — `groupGuides` khoá phải là `group` có thật trong docs.
- **#2c** — mọi `docs[].file` bắt đầu bằng `content/<field>/` (mirror `sources/`).
- **#7** mở rộng: `settings` là module toàn cục, không cần dữ liệu; `guide` cần G1.

## 6. Đề xuất tiếp theo (không làm trong lần này)

Xếp theo giá trị / công sức, nêu cả lý do chưa làm:

1. **Sinh flashcard & trắc nghiệm cho 8 lĩnh vực chưa có** từ 458 câu "Tự kiểm tra" đã có trong
   lộ trình — dữ liệu sẵn, chỉ cần một bước chuyển sang schema `flashcards` (mặt trước = câu,
   mặt sau = đoạn "Mục tiêu"/"Bẫy"). Chưa làm vì cần quyết định biên tập từng câu.
2. **Ôn lại bài đã tick theo lịch** (spaced repetition trên `roadmap.checked`, gợi ý ôn sau
   7 / 30 / 90 ngày) — cần lưu thêm mốc thời gian tick; hiện `roadmap.checked` chỉ lưu `true`.
3. **Service worker** cache app shell + tài liệu đã mở để đọc offline — lợi lớn với 196 tài liệu
   nhưng cần chiến lược làm mới cache rõ ràng, không nên đi cùng diff tái cấu trúc.
4. **Đồng bộ tiến độ đa thiết bị** — hai đường: (a) tệp JSON xuất/nhập (đã có ở §4.1),
   (b) GitHub Gist qua token cá nhân, không backend. (b) là bước tự nhiên tiếp theo.
5. **Ghi chú & highlight trên tài liệu** lưu local, xuất Markdown — dựa trên `docs.read` và
   `Range` API.
6. **Tích hợp `inbox/kubernetes-in-action-2e/`**: so 18 chương với 17 chương hiện có, quyết
   định thay thế hay giữ song song; cần spec riêng như 10 lần trước.
7. **Lint nội dung trong CI**: link `.md` tương đối tới tệp không tồn tại, ảnh thiếu `alt`, heading
   nhảy cấp — mở rộng `check-data.mjs` sang chính markdown.
8. **Trang PDF**: 135 PDF đã ở `pdf/`; nếu muốn đọc trong app cần quyết định về bản quyền và
   dung lượng deploy trước.
9. **Chỉ mục tìm kiếm toàn văn** dựng lúc CI (đọc cả nội dung markdown) — tìm trong-bài chứ không
   chỉ tiêu đề; đổi lại một tệp JSON vài MB tải lười.

## 7. Kế hoạch triển khai — 5 chặng

| Chặng | Nội dung | Cổng kiểm |
|---|---|---|
| 1 | Spec này | commit |
| 2 | Di chuyển vật lý: `sources/`, `inbox/`, `pdf/`, `webapp/scripts/`, `data/<field>/`, tách `docs-index.js`; sửa `build-content.sh`, Dockerfile, workflow, `.gitignore`, `.dockerignore`, README gốc + `sources/README.md`, đường dẫn `docs[].file`, `../images/` trong bài Java, header comment | `build-content.sh` + `check-data.mjs` xanh 100 % với số lượng **không đổi**; `git status` không còn tệp lạ |
| 3 | Nền UI: theme boot, token/utility, toast/dialog, bộ chọn lĩnh vực, tìm kiếm, phím tắt, settings + xuất/nhập, `activity`/`recent`, manifest | check-data xanh; mở app, đổi lĩnh vực, tìm "lo trinh", xuất/nhập JSON |
| 4 | Module `guide`: `guides.js` (10 + 17 + 4), `lib/guides.js`, view `guide`, khối trong trang track, khối trong trang đọc, "Bước tiếp theo" ở dashboard, bất biến G1–G4 + #2c | check-data xanh; mở `#/guide` cả 10 lĩnh vực; mở một tài liệu có/không có bài học trỏ tới |
| 5 | Trang đọc (tiến độ, thời gian, đã đọc, cỡ chữ, link `.md`, TOC mobile), dashboard mới, thay `alert`/`confirm`, README webapp | check-data xanh; smoke test trình duyệt desktop + 375px; ảnh chụp |

Mỗi chặng một commit, thông điệp theo quy ước repo (`feat:`/`refactor:`/`docs:` tiếng Việt).

## 8. Kết quả triển khai (cập nhật 2026-09-06)

Năm chặng đã hoàn thành trên nhánh `claude/webapp-restructure-6b6de3`, mỗi chặng một commit;
`check-data.mjs` xanh **46/46** (42 bất biến cũ + #2c + G1–G4) với số lượng bản ghi không đổi
(196 tài liệu, 17 track / 804 mục, 174 thẻ, 220 câu, 22 lab, 96 tiêu chí). Smoke test trình duyệt
desktop và 375px: không lỗi console, không tràn ngang.

Lệch so với thiết kế: không có. Bổ sung ngoài thiết kế: `.claude/launch.json` (mở preview),
`inbox/README.md` (ghi rõ việc còn lại với bản dịch KIA thứ hai), badge "Bắt đầu tại đây" dựa
trên bước `track` đầu tiên của `fieldGuides`.
