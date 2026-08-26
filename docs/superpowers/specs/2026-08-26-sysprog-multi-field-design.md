# Thiết kế — Nền tảng học đa lĩnh vực & track System Programming

- Ngày: 2026-08-26
- Branch: `claude/system-programming-features-f06f88`
- Trạng thái: đã duyệt thiết kế, chờ lập kế hoạch triển khai

## 1. Mục tiêu

Đưa bộ tài liệu `System_Programming_VI/` (bản dịch tiếng Việt *System Programming
Coursebook*, UIUC CS 241 — 18 chương, ~12.700 dòng, 48 hình) vào webapp thành một
**track học đầy đủ**: tài liệu, lộ trình, flashcards, trắc nghiệm.

Webapp hiện tại (`webapp/`) là app tĩnh vanilla ES modules, không build step, tên
**KubePrep**, mọi thứ giả định "một chứng chỉ Kubernetes". Để chứa một lĩnh vực
không phải Kubernetes và không phải chứng chỉ, app được tái cấu trúc thành **nền
tảng học đa lĩnh vực** với ba lĩnh vực: Kubernetes, System Programming, Java
Scalability.

### Ngoài phạm vi

Các hạng mục sau đã được cân nhắc và **cố ý loại khỏi bản thiết kế này**:

- Thi thử bấm giờ cho System Programming
- Bài tập đọc code C tìm lỗi (view mới)
- Thư viện post-mortem tương tác từ chương 18 (view mới)
- Track lộ trình / flashcards / trắc nghiệm cho lĩnh vực Java (giữ nguyên: chỉ tài liệu)
- Tách `js/data/` thành thư mục con theo lĩnh vực

## 2. Quyết định thiết kế

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Lĩnh vực khai báo tập trung trong `js/data/fields.js` | Một nguồn sự thật; thêm lĩnh vực/module sau này sửa 1 chỗ |
| D2 | **Không** đưa lĩnh vực vào URL hash | Markdown bài học của 3 track K8s chứa hàng trăm link `#/docs/…`, `#/commands`; đổi cấu trúc hash là phải sửa hết. Mọi id đã duy nhất toàn cục nên không cần |
| D3 | Bản ghi K8s cũ **không** được thêm trường `field` | `field` mặc định `"kubernetes"` tại lớp truy cập → zero churn trên 194 bản ghi, zero rủi ro cho `localStorage` |
| D4 | Sidebar ẩn module mà lĩnh vực không có dữ liệu | Tránh dẫn người dùng vào trang rỗng (Java sẽ có 6/8 mục rỗng nếu hiện hết) |
| D5 | Lộ trình sysprog là **kế hoạch học trỏ vào sách**, không chép lại nội dung | Nguồn đã là giáo trình hoàn chỉnh; viết lại là nhân bản |
| D6 | Giữ nguyên namespace `localStorage` = `kubeprep.` dù đổi brand | Đổi prefix sẽ xoá sạch tiến độ học hiện có |
| D7 | Gộp logic copy nội dung vào `webapp/build-content.sh` | Logic đang lặp ở 3 nơi (dev.sh, Dockerfile, workflow) và feature này buộc phải sửa cả ba |
| D8 | Thêm script kiểm tra tính toàn vẹn dữ liệu | Feature chủ yếu là ~200 bản ghi mới; lỗi khả dĩ nhất là gõ sai khoá, hiện không có gì bắt được |

## 3. Kiến trúc

### 3.1 Field registry — `js/data/fields.js` (mới)

```js
export const FIELDS = {
  kubernetes: {
    label: "Kubernetes & Chứng chỉ",
    icon: "☸️",
    desc: "…",
    certFilter: true,
    modules: ["dashboard", "certs", "roadmap", "docs", "commands",
              "flashcards", "quiz", "exam", "labs"],
  },
  sysprog: {
    label: "Lập trình hệ thống",
    icon: "🖥️",
    desc: "…",              // kèm ghi công CC BY 4.0 — xem §7
    certFilter: false,
    modules: ["dashboard", "roadmap", "docs", "flashcards", "quiz"],
  },
  java: {
    label: "Java & Spring Boot Scalability",
    icon: "☕",
    desc: "…",
    certFilter: false,
    modules: ["dashboard", "docs"],
  },
};

export const FIELD_ORDER = ["kubernetes", "sysprog", "java"];
export const DEFAULT_FIELD = "kubernetes";

// Thứ tự + nhãn + icon của từng module trong sidebar. Nav của một lĩnh vực =
// duyệt mảng này, giữ lại module có trong FIELDS[field].modules, bỏ nhóm rỗng.
export const NAV_GROUPS = [
  { title: "Tổng quan", items: [
      { id: "dashboard",  label: "Bảng điều khiển", icon: "🏠", href: "#/" },
      { id: "certs",      label: "Chứng chỉ K8s",   icon: "🎓", href: "#/certs" },
      { id: "roadmap",    label: "Lộ trình học",    icon: "🗺️", href: "#/roadmap" } ] },
  { title: "Học & tham khảo", items: [
      { id: "docs",       label: "Tài liệu",        icon: "📚", href: "#/docs" },
      { id: "commands",   label: "Thực hành nhanh", icon: "⚡", href: "#/commands" } ] },
  { title: "Luyện tập", items: [
      { id: "flashcards", label: "Flashcards",      icon: "🃏", href: "#/flashcards" },
      { id: "quiz",       label: "Trắc nghiệm",     icon: "✅", href: "#/quiz" },
      { id: "exam",       label: "Thi thử",         icon: "⏱️", href: "#/exam" },
      { id: "labs",       label: "Labs thực hành",  icon: "🧪", href: "#/labs" } ] },
];
```

Nhãn và icon lấy nguyên từ `index.html` hiện tại để sidebar không đổi hình dạng
với người dùng Kubernetes.

`modules` là thứ sinh ra sidebar. `certFilter` quyết định trang trắc nghiệm có
hiện tầng lọc chứng chỉ hay không.

`js/data/docs-index.js` hiện **tự khai** một hằng `FIELDS` riêng — bỏ khai báo đó
và `export { FIELDS } from "./fields.js"` để không phá các import hiện có ở
`js/views/docs.js`. Khoá `kubernetes` và `java` đã trùng sẵn.

### 3.2 Lớp truy cập — `js/data/index.js` (mới)

```js
const fieldOf = (rec) => rec.field ?? "kubernetes";

export const getDocs       = (f) => docs.filter((d) => fieldOf(d) === f);
export const getTracks     = (f) => tracks.filter((t) => fieldOf(t) === f);
export const getFlashcards = (f) => allFlashcards.filter((c) => fieldOf(c) === f);
export const getQuestions  = (f) => allQuestions.filter((q) => fieldOf(q) === f);

// Suy ra lĩnh vực từ một deep-link (dùng cho D2 — xem §3.4)
export const fieldOfDoc   = (docId)   => …;
export const fieldOfTrack = (trackId) => …;
```

`allFlashcards` = `[...flashcards, ...sysprogFlashcards]`,
`allQuestions` = `[...questions, ...sysprogQuestionsPart1, ...sysprogQuestionsPart2]`.

Các view chuyển sang gọi accessor thay vì import mảng thô.

### 3.3 Taxonomy — `js/data/meta.js` (sửa)

Mọi entry hiện có trong `DOMAINS` và `TOPICS` được thêm `field: "kubernetes"`.
Thêm 7 khoá mới dùng **chung cho cả `DOMAINS` và `TOPICS`** (một mô hình phân
loại duy nhất cho lĩnh vực này), tất cả mang `field: "sysprog"`:

| Khoá | Nhãn | Chương nguồn |
|---|---|---|
| `sp-c` | C & Bộ nhớ | 2, 3, 5 |
| `sp-process` | Tiến trình & Tín hiệu | 4, 13 |
| `sp-concurrency` | Luồng & Đồng bộ hoá | 6, 7 |
| `sp-deadlock` | Deadlock & Lập lịch | 8, 10 |
| `sp-memory-ipc` | Bộ nhớ ảo & IPC | 9 |
| `sp-io` | Hệ thống tệp & Mạng | 11, 12 |
| `sp-security` | Bảo mật | 14 |

Entry `DOMAINS` của K8s có trường `cert`; entry sysprog không có. Trang trắc
nghiệm phải xử lý cả hai trường hợp (§3.5).

### 3.4 Router & điều hướng

**Router giữ nguyên cấu trúc hash `#/<view>/<params…>`.** Lĩnh vực là trạng thái
UI lưu ở `store.set("field", …)`, không nằm trong URL (D2).

Đồng bộ ngược từ deep-link: khi `navigate()` xử lý `#/docs/<id>` hoặc
`#/roadmap/<trackId>` mà đối tượng đó thuộc lĩnh vực khác lĩnh vực đang chọn,
app **tự chuyển lĩnh vực đang chọn** rồi mới render. Nhờ vậy mở thẳng
`#/docs/sysprog-11` từ bookmark vẫn cho ngữ cảnh đúng.

Nếu route hiện tại không nằm trong `modules` của lĩnh vực đang chọn → điều hướng
về `dashboard`.

Đánh đổi đã chấp nhận: không deep-link được riêng một lĩnh vực, và nút back
không khôi phục lĩnh vực.

**Sidebar**: khối `<nav class="nav">` trong `index.html` bỏ hardcode, thành
`<nav class="nav" id="nav"></nav>`. `js/app.js` render nav từ registry, kèm bộ
chọn lĩnh vực đặt ngay dưới brand. Đổi lĩnh vực → lưu store, render lại nav, và
nếu route hiện tại không còn hợp lệ thì về dashboard.

### 3.5 Thay đổi theo từng view

| View | Thay đổi |
|---|---|
| `dashboard.js` | Thống kê tính theo lĩnh vực đang chọn; thêm dải tổng quan 3 lĩnh vực ở đầu trang; hero đổi theo brand mới |
| `docs.js` | Bỏ import `FIELDS` cục bộ (đã chuyển sang `fields.js`); trang danh mục chỉ hiện lĩnh vực đang chọn. `navRow` giữ nguyên (đã lọc theo `field`) |
| `roadmap.js` | Dùng `getTracks(field)`; bỏ dải "CKAD → CKA → CKS" cứng, chỉ hiện khi lĩnh vực là `kubernetes` |
| `flashcards.js` | Dùng `getFlashcards(field)`; chip chủ đề lọc theo `TOPICS` cùng `field` |
| `quiz.js` | Dùng `getQuestions(field)`. Tầng lọc chứng chỉ **chỉ hiện khi** `FIELDS[field].certFilter`; nếu không, vào thẳng chip domain. Không render `certBadge` cho bản ghi thiếu `cert` |
| `certs.js`, `commands.js`, `exam.js`, `labs.js` | Không đổi logic — chỉ có thể tới được khi lĩnh vực là `kubernetes` |

### 3.6 Brand

Đổi **KubePrep → DevPrep**. Chạm tới: `index.html` (`<title>`, meta
description, favicon emoji `📚`, 2 chỗ brand trong topbar/sidebar) và
`dashboard.js` (hero).

**Namespace `localStorage` giữ nguyên `kubeprep.`** (D6). Ghi chú lý do ngay
trong `js/lib/store.js` để lần sau không ai "dọn dẹp" nhầm.

## 4. Nội dung System Programming

### 4.1 Tài liệu — 18 mục

Thêm vào `docs-index.js`: id `sysprog-01` … `sysprog-18`, `field: "sysprog"`,
`file: "content/sysprog/<tên file gốc>.md"`, kèm `icon`, `desc`, `tags`.

Markdown nguồn tham chiếu ảnh dạng `images/fig-11.1.png`. Hàm
`fixRelativePaths()` sẵn có trong `docs.js` resolve tương đối theo `doc.file`, nên
copy ảnh vào `content/sysprog/images/` là đủ — **không sửa markdown nguồn**.

### 4.2 Lộ trình — track `sysprog`, 10 tuần, ~50 mục

| Tuần | Chủ đề | Chương | Số mục |
|---|---|---|---|
| 1 | Nền tảng & công cụ (gcc, make, Valgrind, GDB) | 1, 2 | 4 |
| 2 | C cốt lõi — cú pháp, mô hình bộ nhớ, con trỏ | 3 | 5 |
| 3 | Bộ cấp phát bộ nhớ | 5 | 4 |
| 4 | Tiến trình — fork / exec / wait | 4 | 5 |
| 5 | Tín hiệu | 13 | 4 |
| 6 | Luồng & Mutex | 6, §7.1–7.5 | 6 |
| 7 | Đồng bộ nâng cao & Deadlock | §7.6–7.9, 8 | 6 |
| 8 | Bộ nhớ ảo & IPC | 9 | 5 |
| 9 | Lập trình mạng | 11 | 5 |
| 10 | Hệ thống tệp, Lập lịch & Bảo mật | 12, 10, 14 | 6 |

Tín hiệu (chương 13) xếp ở tuần 5 thay vì theo số chương, vì `SIGCHLD`/`waitpid`
chỉ có nghĩa ngay sau khi học `fork`/`wait`.

Chương 15 (Ôn tập) và 18 (Post-mortem) không thành tuần riêng — xuất hiện trong
`resources` của các tuần liên quan.

Hình dạng mỗi mục (giữ đúng schema `{ id, text, lesson }` đang dùng):

```js
{
  id: "sp-w7-3",
  text: "Bộ đệm vòng (ring buffer): producer–consumer với 2 semaphore + 1 mutex",
  lesson: `**Mục tiêu.** …

**Đọc.** [§7.8 Bộ đệm vòng](#/docs/sysprog-07) — …

**Bẫy.** …

**Tự kiểm tra.** …`,
}
```

> **Bất biến — tiền tố id.** Track sysprog dùng `sp-w<N>` cho tuần và
> `sp-w<N>-<M>` cho mục. Track CKAD đã chiếm `w1`, `w1-1`… Thiếu tiền tố `sp-`
> là hai track ghi đè tiến độ của nhau trong `roadmap.checked`.

### 4.3 Flashcards (~90) & Trắc nghiệm (~110)

| Khoá | Flashcards | Câu hỏi |
|---|---|---|
| `sp-c` | 18 | 22 |
| `sp-process` | 12 | 14 |
| `sp-concurrency` | 20 | 24 |
| `sp-deadlock` | 10 | 12 |
| `sp-memory-ipc` | 12 | 14 |
| `sp-io` | 12 | 16 |
| `sp-security` | 6 | 8 |
| **Tổng** | **90** | **110** |

Id: `spf001`+ và `spq001`+ (không đụng `f001`/`q001` hiện có). Giữ nguyên schema
sẵn có; bản ghi trắc nghiệm sysprog **không có trường `cert`**.

Nguyên liệu lấy từ **14 chương nội dung (2–14)**: mục "Chủ đề"/"Câu hỏi" cuối mỗi
chương, cộng 132 mục ở chương 15 (Ôn tập). Chương 1 (Giới thiệu), 16 (Chủ đề nâng
cao), 17 (Phụ lục) và 18 (Post-mortem) vẫn đọc được ở Thư viện tài liệu nhưng
không sinh flashcard/câu hỏi. Sách
đặt câu hỏi mở, **không kèm đáp án** — phần việc thật là chuyển thành 4 lựa chọn
và viết `explanation`. Mỗi `explanation` trích dẫn mục nguồn (vd "§5.4") để người
học nhảy ngược về sách.

Trường `code` (đã có trong schema) được dùng nhiều: nhiều câu có dạng "đọc đoạn C
này, lỗi ở đâu".

### 4.4 File dữ liệu mới

```
js/data/fields.js
js/data/index.js
js/data/sysprog-roadmap-part1.js    (Tuần 1–5)
js/data/sysprog-roadmap-part2.js    (Tuần 6–10)
js/data/sysprog-flashcards.js       (90 thẻ)
js/data/sysprog-questions-part1.js  (sp-c, sp-process, sp-concurrency)
js/data/sysprog-questions-part2.js  (sp-deadlock, sp-memory-ipc, sp-io, sp-security)
```

Tách phần theo đúng quy ước `roadmap-part*.js` sẵn có. `questions.js` hiện đã
2093 dòng cho 110 câu, nên bộ mới cũng tách đôi để mỗi file còn đọc/sửa được.

`js/data/roadmap.js` thêm track `sysprog` (có `field: "sysprog"`) vào mảng
`tracks`. Ba track K8s không khai `field` → mặc định `kubernetes` (D3).

## 5. Nguồn nội dung & pipeline build

### 5.1 Đưa bản dịch vào git

`System_Programming_VI/` hiện đang staged-nhưng-chưa-commit trong working tree
chính. Commit riêng vào `main` (bản dịch là tài sản độc lập, không dính feature),
rồi rebase branch này lên. Xác nhận `.idea/` không lọt vào commit trước khi chạy.

### 5.2 `webapp/build-content.sh` (mới)

```bash
#!/usr/bin/env bash
# Nguồn duy nhất của logic copy markdown vào thư mục content/.
# Gọi bởi: webapp/dev.sh, Dockerfile, .github/workflows/deploy-pages.yml
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?usage: build-content.sh <dest-dir>}"

mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images"
cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
```

Ba nơi gọi:

| Nơi | Thay bằng |
|---|---|
| `webapp/dev.sh` | `"$DIR/build-content.sh" "$DIR/content"` |
| `Dockerfile` | `RUN webapp/build-content.sh webapp/content` |
| `.github/workflows/deploy-pages.yml` | `webapp/build-content.sh _site/content` |

Workflow đang `rm -f _site/dev.sh` → bổ sung `_site/build-content.sh`.

`webapp/content/` đã nằm trong `.gitignore`, nên 18 markdown + 48 ảnh không bị
commit trùng lặp; nguồn chuẩn vẫn ở `System_Programming_VI/`.

### 5.3 Tài liệu cần cập nhật

- `README.md` (gốc repo): thêm mục System Programming vào bảng thành phần; cập
  nhật mô tả webapp và tên DevPrep
- `webapp/README.md`: bảng tính năng (tài liệu 17 → 35, flashcards 84 → 174,
  trắc nghiệm 110 → 220, thêm khái niệm lĩnh vực), cây cấu trúc mã, đổi brand

## 6. Kiểm thử

Repo hiện không có test. Feature chủ yếu là dữ liệu, nên rủi ro chính là **gõ sai
một khoá** rồi lặng lẽ mất bản ghi khỏi bộ lọc.

### 6.1 `webapp/check-data.mjs` (mới) — chạy bằng `node`, không thêm dependency

Kiểm 7 bất biến:

1. Id duy nhất trong từng tập (docs, roadmap items, flashcards, questions) **và
   giữa các track** — bắt đúng lỗi va chạm tiền tố `sp-`
2. Mọi `docs[].file` tồn tại trên đĩa sau khi chạy `build-content.sh`
3. Mọi link `#/docs/<id>` trong `resources` **và trong markdown `lesson`** trỏ tới
   doc id có thật
4. `question.domain` ∈ `DOMAINS`, `flashcard.topic` ∈ `TOPICS`, và `field` của bản
   ghi khớp `field` khai trong taxonomy
5. Mọi tên trong `modules` của lĩnh vực ⊆ tên view thật trong `js/views/`
6. Mỗi câu hỏi đúng 4 lựa chọn, `answer` ∈ 0..3, `explanation` không rỗng
7. Lĩnh vực khai module `quiz`/`flashcards` thì phải có dữ liệu tương ứng (chặn
   ngõ cụt)

Thêm job `check` vào `deploy-pages.yml`, chạy **trước** bước deploy.

### 6.2 Smoke checklist thủ công

Chạy `./webapp/dev.sh`, kiểm:

- Đổi lĩnh vực → sidebar đổi đúng tập module (K8s 9, sysprog 5, Java 2)
- Mở thẳng `#/docs/sysprog-11` → lĩnh vực tự chuyển sang System Programming, ảnh
  `fig-11.1.png` hiển thị
- Tick 1 mục lộ trình sysprog → tiến độ CKAD **không đổi**
- Trắc nghiệm sysprog: không hiện tầng lọc chứng chỉ, không hiện badge chứng chỉ
- Flashcards sysprog: chip chủ đề chỉ hiện 7 khoá `sp-*`
- Route không hợp lệ với lĩnh vực (vd đang ở `sysprog`, mở `#/labs`) → về dashboard
- Light/dark; mobile 375px

## 7. Giấy phép

Sách gốc phát hành theo **CC BY 4.0** (B. Venkatesh, L. Angrave et al., UIUC CS
241). Flashcards và câu hỏi là tác phẩm phái sinh. Ghi công tại:

- `desc` của lĩnh vực `sysprog` trong `fields.js`
- Một dòng chú thích ở đầu mỗi file dữ liệu mới của sysprog

giống cách `System_Programming_VI/README.md` đang làm.

## 8. Tiêu chí hoàn thành

- [ ] `System_Programming_VI/` đã commit vào `main`, branch đã rebase
- [ ] Ba lĩnh vực chuyển đổi được, sidebar sinh từ registry
- [ ] 18 tài liệu System Programming đọc được, ảnh hiển thị đúng
- [ ] Track lộ trình `sysprog` 10 tuần / ~50 mục, tiến độ độc lập với track K8s
- [ ] 90 flashcards + 110 câu trắc nghiệm sysprog, lọc theo 7 khoá
- [ ] Logic copy nội dung tồn tại ở đúng một nơi
- [ ] `check-data.mjs` chạy sạch, đã gắn vào workflow
- [ ] Smoke checklist §6.2 qua hết
- [ ] Toàn bộ tiến độ học K8s hiện có còn nguyên sau khi nâng cấp
