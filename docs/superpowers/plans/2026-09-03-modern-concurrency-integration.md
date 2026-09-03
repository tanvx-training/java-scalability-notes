# Modern Concurrency in Java → DevPrep (lĩnh vực thứ 6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa 8 chương bản dịch *Modern Concurrency in Java* vào DevPrep thành **lĩnh vực học thứ sáu** — thư viện 8 tài liệu đọc được trong app cộng một giáo trình đọc sách 9 tuần / 32 mục.

**Architecture:** App tĩnh vanilla ES modules, không build step. Lĩnh vực khai báo tập trung trong `webapp/js/data/fields.js`; `check-data.mjs` chạy bằng `node` là bộ test duy nhất. Lĩnh vực mới **mở dần theo dữ liệu** — khai `["dashboard"]` trước, thêm `"docs"` khi đã có 8 tài liệu, thêm `"roadmap"` khi đã có track. Thứ tự này do bất biến ép, không đảo được.

**Tech Stack:** Vanilla ES modules · Node ≥ 22 (chỉ để chạy `check-data.mjs`) · bash · python3 `http.server` (dev) · GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-09-03-modern-concurrency-integration-design.md`

**Trạng thái đầu đợt:** 5 lĩnh vực · 78 tài liệu · 10 giáo trình · 540 mục lộ trình · toàn bộ bất biến xanh.

## Global Constraints

- **Không thêm dependency.** Repo không có `node_modules`, không bundler. `webapp/package.json` chỉ chứa `{"type": "module"}`.
- **Không đổi id đã tồn tại.** Id tuần và id mục lộ trình là khoá lưu tiến độ `localStorage`.
- **Không sửa nội dung markdown nguồn.** Đổi *tên tệp* (Task 1) thì được; sửa *nội dung* bên trong thì không — không dịch thêm, không đổi link, không sửa đường dẫn ảnh.
- **Không ghi tên tác giả ở bất kỳ đâu.** Nguồn không nêu tên tác giả. Nơi cần dẫn nguồn thì ghi đúng chuỗi: `O'Reilly, ISBN 9781098165406`.
- **Nhãn lĩnh vực giữ nguyên tiếng Anh:** `Modern Concurrency in Java`.
- **Mọi bản ghi mới phải khai `field: "modern-concurrency"` tường minh.**
- **Chỉ khai một module cho lĩnh vực khi lĩnh vực đó ĐÃ có dữ liệu** (bất biến #7). Xem "Ràng buộc thứ tự".
- **Lĩnh vực mới KHÔNG được khai bốn module chỉ dành cho Kubernetes**: `certs`, `commands`, `exam`, `labs`.
- **Bảng `EXPECTED.counts` sửa TRƯỚC khi viết dữ liệu**, để mỗi task bắt đầu bằng một lần chạy đỏ.
- **Không link chéo lĩnh vực.** Không `#/docs/java-*`, `#/docs/sysprog-*`, `#/docs/sj-*`… trong bất kỳ `lesson` hay `resources` nào của track `modconc` (bất biến #3b). Muốn nhắc tới series Java sẵn có thì nhắc bằng chữ, không đặt link.
- **Chỉ dùng bốn link JEP đã được kho xác minh** (xem "Nguồn ngoài được phép").
- Văn bản hướng tới người dùng viết **tiếng Việt**, xưng "bạn".
- Commit tiếng Việt, tiền tố `feat:` / `fix:` / `docs:`.
- Lệnh kiểm sau mỗi task: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs`

### Ràng buộc thứ tự — đọc trước khi làm bất cứ task nào

Bốn bất biến khoá chặt thứ tự và **không thể đảo**:

| Bất biến | Nội dung | Hệ quả |
|---|---|---|
| "field khai rõ (nếu có) phải là lĩnh vực tồn tại" | Bản ghi khai `field: "modern-concurrency"` thì khoá đó phải có trong `FIELDS` | Field phải được **khai trước** khi thêm docs |
| #7 | Lĩnh vực khai `docs`/`roadmap` thì phải có dữ liệu tương ứng | Module `docs` chỉ được bật **sau** khi 8 docs đã tồn tại |
| #7b (chiều ngược) | Lĩnh vực có dữ liệu `docs`/`roadmap` thì phải khai module tương ứng | Docs và việc bật module `"docs"` phải nằm **cùng một commit** |
| N3 | Lĩnh vực khai `docs`/`roadmap` phải có khoá đếm trong `EXPECTED.counts` | Bật module nào thì khai khoá đếm ấy trong cùng bước |

Thứ tự bắt buộc: **khai field `modules: ["dashboard"]`** → thêm 8 docs → **bật `"docs"` + khoá `docs:modern-concurrency`** → thêm track part1 → **bật `"roadmap"` + khoá `roadmap-items:modern-concurrency`** → thêm part2 → **nâng khoá đếm lên 32**.

## File Structure

**Tạo mới:**

| File | Trách nhiệm |
|---|---|
| `modern-concurrency-vi/README.md` | Mục lục 8 chương + ghi chú bản quyền và đặc điểm nguồn. Không phải mục docs của app. |
| `webapp/js/data/modconc-roadmap-part1.js` | Tuần 1–5 của track đọc sách (19 mục). Chỉ dữ liệu. |
| `webapp/js/data/modconc-roadmap-part2.js` | Tuần 6–9 của track đọc sách (13 mục). Chỉ dữ liệu. |

**Đổi tên (Task 1):** `Modern Concurrency in Java/` → `modern-concurrency-vi/`, 8 `.md` + 8 `.pdf` sang slug tiếng Việt.

**Sửa:**

| File | Sửa gì |
|---|---|
| `webapp/build-content.sh` | 1 mục trong `mkdir -p` + 2 lệnh copy (md và ảnh có thư mục con) |
| `webapp/js/data/fields.js` | khai lĩnh vực `modern-concurrency`, chèn vào `FIELD_ORDER`, mở dần `modules` |
| `webapp/js/data/docs-index.js` | +8 mục docs `modconc-*`, cập nhật chú thích đầu tệp |
| `webapp/js/data/roadmap.js` | import 2 part mới, đăng ký track `modconc`, cập nhật chú thích đầu tệp |
| `webapp/check-data.mjs` | bảng kỳ vọng (2 khoá mới) |
| `README.md`, `webapp/README.md`, `webapp/index.html` | số liệu, danh sách lĩnh vực, bảng thành phần, meta description |

**Không đụng:** `webapp/js/data/meta.js` (`DOMAINS`/`TOPICS` chỉ phục vụ quiz/flashcards — lĩnh vực này không khai hai module đó), `webapp/js/views/**` (dashboard/roadmap/docs đã hoàn toàn field-driven), `webapp/js/lib/**`, `webapp/css/style.css`, `webapp/dev.sh`, `Dockerfile`, `.github/workflows/**` (cả ba đều gọi `build-content.sh`), `.gitignore` (đã bỏ qua `webapp/content/`), `k8sbook-crossref.js`.

## Đặc điểm nguồn đã biết — không được tự vá

`Modern Concurrency in Java/` là bản dịch tiếng Việt đầy đủ, **không có lỗ thủng nội dung** như `spring-security-vi/`. Nhưng có bốn đặc điểm mà người triển khai phải biết trước:

1. **Tiêu đề mục không đánh số.** Sách này dùng tiêu đề chữ (`## Những hạn chế của Virtual Thread`), không có `§4.2`. Nên khối **Đọc** trong mỗi bài học trích **tên tiêu đề nguyên văn**, không bịa ra số mục.
2. **162 shortlink `oreil.ly/…`** rải khắp nguồn, không resolve được offline. Không đoán chúng trỏ đâu, không "sửa" chúng thành URL đích.
3. **3 link nội bộ sách** trỏ `learning.oreilly.com/…/ch01|ch02|ch05` (paywall) — giữ nguyên, đã ghi chú trong README nguồn.
4. **Ảnh chỉ có ở 5 chương:** `images/ch1` (3 tệp), `ch2` (5), `ch3` (7), `ch4` (2), `ch6` (2) = 19 ảnh. Chương 5, 7, 8 không có ảnh. Đừng đi tìm ảnh thiếu.

Nếu thấy một mục sách mà bảng mục trong kế hoạch này giả định nhưng nguồn không có, **DỪNG và báo**, không lấp bằng kiến thức concurrency của bạn.

## Nguồn ngoài được phép

Chỉ bốn link JEP sau (đã có sẵn trong `webapp/js/data/senior-java-matrix.js` và `senior-java-gd1.js`, nên đã qua một vòng xác minh), cộng trang chủ Loom:

| Nhãn dùng trong `resources` | href |
|---|---|
| `JEP 444 — Virtual Threads` | `https://openjdk.org/jeps/444` |
| `JEP 491 — Synchronize Virtual Threads without Pinning` | `https://openjdk.org/jeps/491` |
| `JEP 505 — Structured Concurrency` | `https://openjdk.org/jeps/505` |
| `JEP 506 — Scoped Values` | `https://openjdk.org/jeps/506` |
| `openjdk.org — Project Loom` | `https://wiki.openjdk.org/display/loom/Main` |

Cần link ngoài khác thì **không tự nghĩ ra URL** — dùng một trong năm link trên hoặc bỏ hẳn.

---

### Task 1: Chuẩn hoá thư mục nguồn thành `modern-concurrency-vi/`

**Files:**
- Rename: `Modern Concurrency in Java/` → `modern-concurrency-vi/` (16 tệp `.md`/`.pdf` + `images/`)
- Create: `modern-concurrency-vi/README.md`

**Interfaces:**
- Consumes: thư mục `Modern Concurrency in Java/` đã có trong repo (đã được git theo dõi).
- Produces: 8 tệp `modern-concurrency-vi/NN-<slug>.md` với tên chính xác mà Task 2 và Task 3 trỏ tới; `modern-concurrency-vi/images/ch{1,2,3,4,6}/` giữ nguyên cấu trúc.

- [ ] **Step 1: Chụp trạng thái trước — để đối chiếu sau khi đổi tên**

```bash
cd "$(git rev-parse --show-toplevel)"
ls "Modern Concurrency in Java"/*.md | wc -l    # kỳ vọng 8
ls "Modern Concurrency in Java"/*.pdf | wc -l   # kỳ vọng 8
find "Modern Concurrency in Java/images" -type f | wc -l  # kỳ vọng 19
md5 -q "Modern Concurrency in Java/8. Conclusion and Takeaways _ Modern Concurrency in Java.md"
```

Ghi lại giá trị md5 cuối cùng — Step 4 dùng để chứng minh nội dung không đổi.

- [ ] **Step 2: Đổi tên thư mục và 16 tệp**

```bash
git mv "Modern Concurrency in Java" modern-concurrency-vi

while IFS='|' read -r old new; do
  [ -z "$old" ] && continue
  git mv "modern-concurrency-vi/$old.md"  "modern-concurrency-vi/$new.md"
  git mv "modern-concurrency-vi/$old.pdf" "modern-concurrency-vi/$new.pdf"
done <<'EOF'
1. Introduction _ Modern Concurrency in Java|01-gioi-thieu
2. Understanding Virtual Threads _ Modern Concurrency in Java|02-tim-hieu-ve-virtual-thread
3. The Mechanics of Modern Concurrency in Java _ Modern Concurrency in Java|03-co-che-hoat-dong-cua-concurrency-hien-dai
4. Structured Concurrency _ Modern Concurrency in Java|04-structured-concurrency
5. Scoped Values _ Modern Concurrency in Java|05-scoped-values
6. The Relevance of Reactive Java in Light of Virtual Threads _ Modern Concurrency in Java|06-reactive-java-trong-boi-canh-virtual-thread
7. Modern Frameworks Utilizing Virtual Threads _ Modern Concurrency in Java|07-cac-framework-hien-dai-su-dung-virtual-thread
8. Conclusion and Takeaways _ Modern Concurrency in Java|08-ket-luan-va-diem-rut-ra
EOF
```

- [ ] **Step 3: Viết `modern-concurrency-vi/README.md`**

```markdown
# Modern Concurrency in Java — bản dịch tiếng Việt

*O'Reilly, ISBN 9781098165406*

Tài liệu được tách thành các chương độc lập, mỗi chương một tệp Markdown. Ảnh minh
họa nằm trong `images/ch<N>/`. Bản PDF gốc của từng chương đi kèm cùng tên tệp.

> ⚠️ **Bản quyền:** đây là sách thương mại, không phải tài liệu giấy phép mở như
> `System_Programming_VI/` (CC BY 4.0). Bản dịch này chỉ dùng để học cá nhân.

| # | Chương | Tệp |
| ---: | --- | --- |
| 1 | Giới thiệu | [01-gioi-thieu.md](01-gioi-thieu.md) |
| 2 | Tìm hiểu về Virtual Thread | [02-tim-hieu-ve-virtual-thread.md](02-tim-hieu-ve-virtual-thread.md) |
| 3 | Cơ chế hoạt động của Concurrency hiện đại trong Java | [03-co-che-hoat-dong-cua-concurrency-hien-dai.md](03-co-che-hoat-dong-cua-concurrency-hien-dai.md) |
| 4 | Structured Concurrency | [04-structured-concurrency.md](04-structured-concurrency.md) |
| 5 | Scoped Values | [05-scoped-values.md](05-scoped-values.md) |
| 6 | Sự phù hợp của Reactive Java trong bối cảnh Virtual Thread | [06-reactive-java-trong-boi-canh-virtual-thread.md](06-reactive-java-trong-boi-canh-virtual-thread.md) |
| 7 | Các framework hiện đại sử dụng virtual thread | [07-cac-framework-hien-dai-su-dung-virtual-thread.md](07-cac-framework-hien-dai-su-dung-virtual-thread.md) |
| 8 | Kết luận và Điểm rút ra | [08-ket-luan-va-diem-rut-ra.md](08-ket-luan-va-diem-rut-ra.md) |

## Ghi chú về nguồn

- Ảnh chỉ có ở 5 chương: ch1 (3 ảnh), ch2 (5), ch3 (7), ch4 (2), ch6 (2) — tổng 19.
  Chương 5, 7 và 8 không có hình minh họa trong nguồn.
- Ba liên kết trỏ chéo giữa các chương vẫn trỏ về bản gốc trên `learning.oreilly.com`
  (cần tài khoản). Chúng được giữ nguyên thay vì sửa thành liên kết nội bộ, để tệp
  nguồn đọc đúng cả khi xem ngoài web app.
- Các liên kết rút gọn `oreil.ly/…` trong thân bài là tham chiếu ngoài của chính cuốn
  sách (JEP, javadoc, bài viết), giữ nguyên.

Đọc trong app ở lĩnh vực **Modern Concurrency in Java**.
```

- [ ] **Step 4: Kiểm chứng — tên đúng, nội dung không đổi**

```bash
ls modern-concurrency-vi/*.md | wc -l                       # kỳ vọng 9 (8 chương + README)
ls modern-concurrency-vi/*.pdf | wc -l                      # kỳ vọng 8
find modern-concurrency-vi/images -type f | wc -l           # kỳ vọng 19
md5 -q modern-concurrency-vi/08-ket-luan-va-diem-rut-ra.md  # phải khớp md5 ở Step 1
git status --short | grep -c '^R'                           # kỳ vọng 35 (8 md + 8 pdf + 19 ảnh)
git diff --cached --numstat -M | awk '$1 != "-" && ($1 != 0 || $2 != 0)'   # phải KHÔNG in gì
```

Kỳ vọng: `git status` chỉ hiện `R` (rename) và một `??`/`A` cho README — **không có dòng `M`** nào, và lệnh `numstat` không in dòng nào. Một dòng `M` hay một dòng numstat khác 0 nghĩa là nội dung chương bị sửa, vi phạm Global Constraints.

- [ ] **Step 5: Kiểm bất biến cũ vẫn xanh (chưa có gì trỏ tới thư mục này)**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH y như trước — Task 1 chưa đụng vào webapp.

- [ ] **Step 6: Commit**

```bash
git add -A modern-concurrency-vi
git commit -m "$(cat <<'EOF'
chore: chuẩn hoá nguồn Modern Concurrency in Java thành modern-concurrency-vi/

Đổi tên thư mục và 16 tệp (.md + .pdf) sang slug tiếng Việt theo khuôn
k8s-ebook/ và spring-security-vi/, thêm README mục lục kèm ghi chú bản
quyền. Nội dung chương không đổi một byte.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Pipeline nội dung + khai lĩnh vực `modern-concurrency`

**Files:**
- Modify: `webapp/build-content.sh`
- Modify: `webapp/js/data/fields.js`

**Interfaces:**
- Consumes: `modern-concurrency-vi/*.md` và `modern-concurrency-vi/images/ch*/` (Task 1).
- Produces: thư mục `<dest>/modconc/` chứa 9 tệp `.md` và `<dest>/modconc/images/ch{1,2,3,4,6}/` chứa 19 ảnh; khoá `"modern-concurrency"` tồn tại trong `FIELDS` và `FIELD_ORDER`. Task 3 dùng cả hai.

- [ ] **Step 1: Viết lệnh kiểm chứng — phải thất bại**

```bash
./webapp/build-content.sh webapp/content
test -d webapp/content/modconc && echo "CÓ" || echo "KHÔNG CÓ"
```

Kỳ vọng: in `KHÔNG CÓ`.

- [ ] **Step 2: Sửa `webapp/build-content.sh`**

Thêm `"$DEST/modconc/images"` vào lệnh `mkdir -p` và hai dòng `cp`. Khối sau khi sửa:

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior" \
         "$DEST/modconc/images"

cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
cp "$REPO"/k8s-ebook/*.md                               "$DEST/k8sbook/"
cp -R "$REPO"/k8s-ebook/images/.                        "$DEST/k8sbook/images/"
cp "$REPO"/spring-security-vi/*.md                      "$DEST/springsec/"
cp "$REPO"/senior-java-roadmap/*.md                     "$DEST/senior/"
cp "$REPO"/modern-concurrency-vi/*.md                   "$DEST/modconc/"
cp -R "$REPO"/modern-concurrency-vi/images/.            "$DEST/modconc/images/"
```

Dùng `cp -R … images/.` như dòng `k8sbook` vì ảnh nằm trong thư mục con `ch*/`, không phẳng như `sysprog`.

- [ ] **Step 3: Chạy lại lệnh kiểm chứng — phải thành công**

```bash
find webapp/content -mindepth 1 -delete
./webapp/build-content.sh webapp/content
echo "md:  $(ls webapp/content/modconc/*.md | wc -l | tr -d ' ')   (kỳ vọng 9)"
echo "ảnh: $(find webapp/content/modconc/images -type f | wc -l | tr -d ' ')  (kỳ vọng 19)"
test -f webapp/content/modconc/04-structured-concurrency.md && echo "tệp mẫu OK"
test -f webapp/content/modconc/images/ch2/figure-2-1.png && echo "ảnh mẫu OK"
```

- [ ] **Step 4: Khai lĩnh vực trong `webapp/js/data/fields.js`**

Thêm khoá mới vào cuối object `FIELDS` (sau `"senior-java"`), **với `modules` chỉ có `"dashboard"`** — docs và roadmap bật ở Task 3 và Task 4:

```js
  "modern-concurrency": {
    label: "Modern Concurrency in Java",
    icon: "🧵",
    desc: "Bản dịch tiếng Việt Modern Concurrency in Java (O'Reilly, ISBN 9781098165406) — virtual thread, structured concurrency, scoped values, và chỗ đứng của reactive sau Loom.",
    certFilter: false,
    // Mở dần theo dữ liệu: "docs" thêm ở Task 3, "roadmap" ở Task 4.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard"],
    externalRef: { label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" },
  },
```

Và chèn id vào `FIELD_ORDER` **ngay sau `"java"`**:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-concurrency", "spring-security", "senior-java"];
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH. Bất biến "FIELD_ORDER khớp FIELDS 1-1" và "Mọi module của lĩnh vực là view có thật" đều phải qua.

- [ ] **Step 6: Chứng minh bất biến #7 bắt được lỗi thật**

Tạm đổi `modules: ["dashboard"]` thành `modules: ["dashboard", "docs"]`, chạy `node webapp/check-data.mjs`.

Kỳ vọng: ĐỎ với thông báo lĩnh vực khai `docs` mà không có dữ liệu. **Hoàn nguyên về `["dashboard"]`** rồi chạy lại cho xanh trước khi commit. Bước này chứng minh cổng kiểm thật sự chặn, không phải xanh do không ai gác.

- [ ] **Step 7: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh
```

Mở `http://localhost:8888`, xem:
- Bộ chọn lĩnh vực có **6 mục**, `Modern Concurrency in Java` nằm ngay sau `Java & Spring Boot Scalability`.
- Chọn lĩnh vực mới: nav chỉ còn **Bảng điều khiển**; chân sidebar hiện link `openjdk.org — Project Loom`.
- Tải lại trang: vẫn ở lĩnh vực mới (lựa chọn được lưu `localStorage`).

- [ ] **Step 8: Commit**

```bash
git add webapp/build-content.sh webapp/js/data/fields.js
git commit -m "$(cat <<'EOF'
feat: khai lĩnh vực Modern Concurrency in Java và pipeline nội dung

build-content.sh copy 8 chương + 19 ảnh (ch1-ch4, ch6) sang content/modconc/.
Lĩnh vực khai modules ["dashboard"] trước; docs và roadmap bật sau khi có
dữ liệu, theo ràng buộc của bất biến #7.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 8 tài liệu `modconc-*`

**Files:**
- Modify: `webapp/js/data/docs-index.js` (thêm khối cuối mảng `docs`, sửa chú thích đầu tệp)
- Modify: `webapp/js/data/fields.js` (bật module `"docs"`)
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: khoá lĩnh vực `"modern-concurrency"` (Task 2), tệp `content/modconc/*.md` (Task 2).
- Produces: 8 doc id `modconc-01` … `modconc-08`. Task 4 và Task 5 trỏ `#/docs/modconc-NN` vào chính 8 id này.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts` sau khối `senior-java`:

```js
    // Lĩnh vực Modern Concurrency in Java — 8 chương sách O'Reilly.
    "docs:modern-concurrency": 8,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `docs:modern-concurrency: kỳ vọng 8, thực tế 0`.

- [ ] **Step 3: Thêm 8 entry vào cuối mảng `docs` trong `webapp/js/data/docs-index.js`**

Tiền tố `MCJ` trong `title` bám đúng khuôn `SSIA NN — …` mà lĩnh vực Spring Security đã dùng.

```js
  // ===== Modern Concurrency in Java (O'Reilly, ISBN 9781098165406) =====
  // Bản dịch tiếng Việt, thư mục nguồn: modern-concurrency-vi/
  {
    id: "modconc-01",
    field: "modern-concurrency",
    title: "MCJ 01 — Giới thiệu: hành trình concurrency của Java",
    file: "content/modconc/01-gioi-thieu.md",
    icon: "🧬",
    desc: "Concurrency của Java từ thread trong bản 1.0, qua java.util.concurrent và Fork/Join, tới lời hứa của Project Loom. Chi phí ẩn của mỗi platform thread, work-stealing, CompletableFuture và giới hạn của reactive.",
    tags: ["Lịch sử", "Executor", "CompletableFuture", "Loom"],
  },
  {
    id: "modconc-02",
    field: "modern-concurrency",
    title: "MCJ 02 — Tìm hiểu về Virtual Thread",
    file: "content/modconc/02-tim-hieu-ve-virtual-thread.md",
    icon: "🧵",
    desc: "Virtual thread khác platform thread ở đâu, cách tạo, và vì sao chúng cho scalability chứ không phải tốc độ. Carrier thread, Semaphore thay cho pool, pinning, ThreadLocal và cách giám sát bằng JFR với jcmd.",
    tags: ["Virtual Thread", "Pinning", "Semaphore", "JFR"],
  },
  {
    id: "modconc-03",
    field: "modern-concurrency",
    title: "MCJ 03 — Cơ chế hoạt động của concurrency hiện đại",
    file: "content/modconc/03-co-che-hoat-dong-cua-concurrency-hien-dai.md",
    icon: "⚙️",
    desc: "Tự xây một thread pool để hiểu Executor, rồi Callable/Future và ForkJoinPool — scheduler mà virtual thread dùng. Kết chương dựng một virtual thread từ Continuation.",
    tags: ["Thread Pool", "ForkJoinPool", "Continuation"],
  },
  {
    id: "modconc-04",
    field: "modern-concurrency",
    title: "MCJ 04 — Structured Concurrency",
    file: "content/modconc/04-structured-concurrency.md",
    icon: "🌳",
    desc: "StructuredTaskScope: vòng đời scope và subtask, Joiner cùng các chính sách join, xử lý ngoại lệ, cấu hình, joiner tự viết, scope lồng nhau và khả năng quan sát.",
    tags: ["StructuredTaskScope", "Joiner", "Ngoại lệ"],
  },
  {
    id: "modconc-05",
    field: "modern-concurrency",
    title: "MCJ 05 — Scoped Values",
    file: "content/modconc/05-scoped-values.md",
    icon: "🎯",
    desc: "Vì sao truyền ngữ cảnh qua tham số hay ThreadLocal đều đuối trong thế giới hàng triệu thread, ScopedValue thay thế thế nào, và đường di chuyển từ ThreadLocal sang.",
    tags: ["ScopedValue", "ThreadLocal", "Ngữ cảnh"],
  },
  {
    id: "modconc-06",
    field: "modern-concurrency",
    title: "MCJ 06 — Reactive Java trong bối cảnh Virtual Thread",
    file: "content/modconc/06-reactive-java-trong-boi-canh-virtual-thread.md",
    icon: "🔁",
    desc: "Blocking so với non-blocking I/O, kiến trúc hướng sự kiện, Reactive Streams và backpressure — và phần nào của reactive vẫn còn giá trị sau khi có virtual thread.",
    tags: ["Reactive", "Backpressure", "Non-blocking I/O"],
  },
  {
    id: "modconc-07",
    field: "modern-concurrency",
    title: "MCJ 07 — Framework hiện đại dùng virtual thread",
    file: "content/modconc/07-cac-framework-hien-dai-su-dung-virtual-thread.md",
    icon: "🧩",
    desc: "Virtual thread trong Spring Boot (bật sẵn và cấu hình thủ công), trong Quarkus và trong Jakarta EE.",
    tags: ["Spring Boot", "Quarkus", "Jakarta EE"],
  },
  {
    id: "modconc-08",
    field: "modern-concurrency",
    title: "MCJ 08 — Kết luận và điểm rút ra",
    file: "content/modconc/08-ket-luan-va-diem-rut-ra.md",
    icon: "🏁",
    desc: "Tổng kết: chọn mô hình concurrency theo loại tải, cảnh báo pinning khi hệ thống còn ở JDK 21, quản lý ThreadLocal, và giám sát bằng công cụ hiện đại.",
    tags: ["Tổng kết", "Migrate", "Pinning"],
  },
```

Cập nhật chú thích đầu tệp: danh sách thư mục nguồn hiện là
`(CKAD/, CKA/, CKS/, "Chủ đề …", System_Programming_VI/, k8s-ebook/, spring-security-vi/)` — thêm `modern-concurrency-vi/`.

- [ ] **Step 4: Bật module `docs` trong `webapp/js/data/fields.js`**

```js
    modules: ["dashboard", "docs"],
```

Và cập nhật dòng chú thích: `// Mở dần theo dữ liệu: "roadmap" thêm ở Task 4.`

- [ ] **Step 5: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH, gồm cả bất biến #2 (mọi `docs[].file` tồn tại trên đĩa) và #2b (mọi ảnh trong markdown tồn tại) — #2b lúc này quét thêm 19 ảnh mới.

- [ ] **Step 6: Chứng minh bất biến bắt được lỗi thật**

Tạm đổi `file` của `modconc-05` thành `content/modconc/05-scoped-value.md` (thiếu chữ `s`), chạy `node webapp/check-data.mjs`.

Kỳ vọng: ĐỎ ở bất biến "Mọi docs[].file tồn tại trên đĩa". **Hoàn nguyên** rồi chạy lại cho xanh.

- [ ] **Step 7: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh
```

Ở lĩnh vực `Modern Concurrency in Java`:
- Nav có 2 mục: Bảng điều khiển · Tài liệu. Trang Tài liệu liệt kê đủ **8 thẻ**.
- Mở `MCJ 02`: ảnh `figure-2-1.png` … hiện đủ, mục lục nổi bám theo tiêu đề, khối mã Java được highlight, nút copy chạy.
- Mở `MCJ 04` (chương 210KB): trang không treo, mục lục nổi có đủ mục.
- Mở `MCJ 05` và `MCJ 08`: không có ảnh — đúng như nguồn, không phải lỗi.
- Deep-link `#/docs/modconc-06` khi đang đứng ở lĩnh vực Kubernetes: app tự chuyển sang lĩnh vực mới và mở đúng tài liệu.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: 8 tài liệu Modern Concurrency in Java và bật module docs

Thư viện tài liệu 78 -> 86. Bật module "docs" cho lĩnh vực mới cùng khoá
đếm docs:modern-concurrency = 8 trong bảng kỳ vọng.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Track `modconc` — tuần 1–5 (19 mục)

**Files:**
- Create: `webapp/js/data/modconc-roadmap-part1.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js` (bật module `"roadmap"`)
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `modconc-01` … `modconc-08` (Task 3).
- Produces: `export const modconcWeeksPart1` — mảng 5 tuần, id `mc-w1` … `mc-w5`, tổng **19** mục id `mc-w1-1` … `mc-w5-4`. Track id `modconc` với `field: "modern-concurrency"`. Task 5 nối tiếp từ `mc-w6` bằng `export const modconcWeeksPart2`.

**Phân bổ mục:** tuần 1: 3 · tuần 2: 4 · tuần 3: 4 · tuần 4: 4 · tuần 5: 4 = **19**.

| Tuần | id | Tiêu đề | Nguồn |
|---|---|---|---|
| 1 | `mc-w1` | Từ thread cổ điển tới lời hứa Loom | Ch.1 toàn bộ (`modconc-01`) |
| 2 | `mc-w2` | Virtual thread: khái niệm, cách tạo, scalability | Ch.2 dòng 1–1057 (`modconc-02`) |
| 3 | `mc-w3` | Giới hạn của virtual thread: pinning, ThreadLocal, giám sát | Ch.2 dòng 1058–2157 (`modconc-02`) |
| 4 | `mc-w4` | Cơ chế bên dưới: pool, ForkJoinPool, continuation | Ch.3 toàn bộ (`modconc-03`) |
| 5 | `mc-w5` | Structured concurrency: API và chính sách join | Ch.4 dòng 1–1745 (`modconc-04`) |

**Bảng mục — id, `text`, tiêu đề mục phải đọc (trích nguyên văn từ nguồn):**

| id | `text` | Đọc trong nguồn |
|---|---|---|
| `mc-w1-1` | Java sinh ra cùng thread — và cái giá của mỗi thread | `## Lược sử về thread trong Java` · `## Sự khởi nguồn của thread trong Java 1.0` · `## Hiểu về những chi phí ẩn của thread` |
| `mc-w1-2` | Từ thread pool tới Executor, work-stealing và CompletableFuture | `## Hiệu quả tài nguyên trong các ứng dụng quy mô lớn` · `## Vượt ra ngoài thread pool cơ bản` |
| `mc-w1-3` | Reactive là một paradigm khác — và vì sao Loom vẫn cần thiết | `## Một paradigm khác cho lập trình bất đồng bộ` · `## Cách mạng hóa concurrency trong Java` |
| `mc-w2-1` | Virtual thread là gì, khác platform thread ở đâu | `## Virtual thread là gì?` (gồm `### Hai loại thread trong Java`, `### Những khác biệt chính so với platform thread`) |
| `mc-w2-2` | Thiết lập môi trường và các cách tạo virtual thread | `## Thiết lập môi trường cho virtual thread` · `## Thích nghi với virtual thread` |
| `mc-w2-3` | Throughput không phải tốc độ: nguyên lý đằng sau scalability | `## Minh họa việc tạo virtual thread trong Java` (gồm `### Throughput và scalability`, `### Nguyên lý nền tảng đằng sau scalability của virtual thread`, `### Ý nghĩa thực tiễn`) |
| `mc-w2-4` | Dưới lớp vỏ: carrier thread, blocking, và rate limiting bằng Semaphore | `## Virtual thread hoạt động thế nào bên dưới lớp vỏ` · `## Quản lý ràng buộc tài nguyên bằng rate limiting` |
| `mc-w3-1` | Pinning: khi virtual thread bị ghim vào carrier thread | `## Những hạn chế của Virtual Thread` · `### Pinning` |
| `mc-w3-2` | Thoát pinning: ReentrantLock và bẫy phương thức native | `### Giải quyết vấn đề Pinning với ReentrantLock` · `### Gọi phương thức Native và Pinning` |
| `mc-w3-3` | ThreadLocal trong virtual thread — bài toán nan giải | `## Bài toán nan giải của biến ThreadLocal trong Virtual Thread` |
| `mc-w3-4` | Giám sát: JFR, thread dump và mẹo khi chuyển sang virtual thread | `## Giám sát (Monitoring)` · `## Tạo Thread Dump với HotSpotDiagnosticsMXBean` · `## Mẹo thực tiễn khi chuyển sang Virtual Thread` |
| `mc-w4-1` | Vì sao cần thread pool — và tự xây một pool để hiểu nó | `## Thread Pool` · `### Vì sao chúng ta cần Thread Pool?` · `### Xây dựng một Thread Pool đơn giản trong Java` |
| `mc-w4-2` | Executor framework, Callable và Future | `### Executor Framework` · `### Callable và Future: Xử lý kết quả của tác vụ` |
| `mc-w4-3` | ForkJoinPool và vì sao nó làm scheduler cho virtual thread | `## ForkJoinPool` · `### Tại sao lại dùng ForkJoinPool cho Virtual Thread?` |
| `mc-w4-4` | Continuation: tự dựng virtual thread từ đầu và chuyện I/O polling | `## Continuation` · `### Tự xây dựng Virtual Thread của riêng chúng ta từ đầu` · `### Virtual Thread và I/O Polling` |
| `mc-w5-1` | Thách thức của unstructured concurrency | `## Thách thức của unstructured concurrency` |
| `mc-w5-2` | Lời hứa của structured concurrency và API StructuredTaskScope | `## Lời hứa của Structured Concurrency` · `## Tìm hiểu API` · `### StructuredTaskScope` |
| `mc-w5-3` | Scope và subtask: quan hệ, vòng đời, và Joiner | `### Scope và Subtask: Mối quan hệ và Vòng đời` · `### Chính sách join với Joiner` |
| `mc-w5-4` | Các chính sách join phổ biến | `### Các chính sách join phổ biến` (mục dài nhất chương, dòng 526–1745) |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, thêm ngay dưới `"docs:modern-concurrency"`:

```js
    "roadmap-items:modern-concurrency": 19,
```

Con số 19 là **tạm** cho task này; Task 5 nâng lên 32.

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:modern-concurrency: kỳ vọng 19, thực tế 0`.

- [ ] **Step 3: Viết `webapp/js/data/modconc-roadmap-part1.js`**

Cấu trúc tuần: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

**Khuôn mẫu để bắt giọng — đọc trước khi viết:** `webapp/js/data/springsec-roadmap-part1.js` đã có sẵn trong repo. Đó là giáo trình đọc sách gần nhất, cùng thể loại, đã qua review đối chiếu ngược từng trích dẫn về tệp nguồn. Dùng nó làm chuẩn về giọng văn, độ dài và cách viết bốn khối — thay vì tự nghĩ ra kiểu riêng.

Kế hoạch này cố ý **không viết sẵn một bài học mẫu**: ở hai đợt trước, lỗi thật tìm được đều nằm trong đoạn mẫu do kế hoạch cung cấp, còn những mục người triển khai tự viết sau khi mở sách đọc thì không mắc lỗi.

**Lưu ý về `goal`:** trường này được render là **plain text**, không phải markdown (chỉ `practice` mới đi qua `inlineMd`). Đừng dùng backtick hay `**` trong `goal`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

Con số này là hướng dẫn, không phải trần cứng — tiền lệ cùng thể loại trong kho, `springsec-roadmap-part{1,2}.js`, nằm ở dải 188–272 từ (trung vị p1 216, p2 240), nên bám sát nguồn (sách) quan trọng hơn bám đúng con số.

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [<Tên tiêu đề nguyên văn>](#/docs/modconc-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Năm quy tắc bắt buộc khi viết `lesson`:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng tệp `modern-concurrency-vi/NN-*.md`, đọc mục được trích, rồi mới viết. Không suy diễn từ kiến thức concurrency chung, không mượn nội dung từ `Chủ đề II — Concurrency Model/` của kho.
2. **Trích đúng tiêu đề mục sách thật có, nguyên văn.** Sách này không đánh số mục — đối chiếu bằng `grep -nF "## Tên tiêu đề" modern-concurrency-vi/NN-*.md` trước khi dán vào `lesson`. Không bịa `§2.3`.
3. **Khối `Tự kiểm tra` phải trả lời được bằng chính mục vừa đọc**, không cần tài liệu ngoài.
4. **Không link chéo lĩnh vực.** Mọi `#/docs/…` trong tệp này phải là `#/docs/modconc-0N`. Muốn nhắc series Java sẵn có thì viết bằng chữ: *"đối chiếu với bài 05 của lĩnh vực Java & Spring Boot Scalability"* — không đặt link.
5. **Link ngoài chỉ lấy từ bảng "Nguồn ngoài được phép"** ở đầu kế hoạch.

Tuần 1 làm khuôn:

```js
// Lộ trình đọc Modern Concurrency in Java — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Modern Concurrency in Java" (O'Reilly,
// ISBN 9781098165406). Thư mục nguồn: modern-concurrency-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (mc-w<N> / mc-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Sách không đánh số mục, nên khối "Đọc" trích nguyên văn tiêu đề chương mục.
// Chương 2 và chương 4 mỗi chương trải hai tuần vì kích thước gấp đôi mặt bằng.

export const modconcWeeksPart1 = [
  {
    id: "mc-w1",
    week: "Tuần 1",
    title: "Từ thread cổ điển tới lời hứa Loom",
    goal: "Kể được vì sao mỗi platform thread lại đắt, và nói được ba bước tiến hoá đưa Java từ thread thô tới Project Loom.",
    practice: "Chạy thử đoạn đếm số thread tối đa trong chương 1 trên máy bạn, ghi lại con số máy bạn chịu được, rồi so với con số sách đưa ra.",
    resources: [
      { label: "MCJ 01 — Giới thiệu: hành trình concurrency của Java", href: "#/docs/modconc-01" },
      { label: "openjdk.org — Project Loom", href: "https://wiki.openjdk.org/display/loom/Main" },
    ],
    items: [
      // 3 mục mc-w1-1 … mc-w1-3 — lấy `id` và `text` nguyên văn từ "Bảng mục"
      // ở đầu Task 4, `lesson` theo 4 khối + 5 quy tắc nêu ở Step 3 này.
    ],
  },
  // Tuần 2–5: cùng cách làm, `title` lấy từ bảng tuần ở đầu Task 4.
  // Số mục mỗi tuần: mc-w2: 4 · mc-w3: 4 · mc-w4: 4 · mc-w5: 4.
  // resources: tuần 2 và 3 dùng #/docs/modconc-02 + JEP 444 (tuần 2),
  //            JEP 491 (tuần 3); tuần 4 dùng #/docs/modconc-03;
  //            tuần 5 dùng #/docs/modconc-04 + JEP 505.
];
```

- [ ] **Step 4: Đăng ký track trong `webapp/js/data/roadmap.js`**

Thêm import sau các import `springsec`:

```js
import { modconcWeeksPart1 } from "./modconc-roadmap-part1.js";
```

Thêm track vào cuối mảng `tracks` (sau `sj-gd4`):

```js
  {
    id: "modconc",
    field: "modern-concurrency",
    label: "Modern Concurrency",
    icon: "🧵",
    name: "Đọc Modern Concurrency in Java",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết Java cơ bản và đã từng dùng thread hoặc ExecutorService. Không cần biết trước virtual thread.",
    weeks: [...modconcWeeksPart1],
  },
```

Cập nhật khối chú thích đầu tệp: thêm dòng
`//   MCJ : modconc-roadmap-part{1,2}.js  (Tuần 1–5 / 6–9)       — 32 mục`
và thêm `mc-w1` / `mc-w1-1` vào danh sách id ở phần LƯU Ý.

- [ ] **Step 5: Bật module `roadmap` trong `webapp/js/data/fields.js`**

```js
    modules: ["dashboard", "docs", "roadmap"],
```

Xoá dòng chú thích "mở dần" — lĩnh vực đã đủ module.

- [ ] **Step 6: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH. Đặc biệt phải qua: "Id mục lộ trình khớp tiền tố id tuần cha" (`mc-w2-3` ⊂ `mc-w2`), "Mọi khối tuần có ít nhất 1 mục", #3, #3b, #3c.

- [ ] **Step 7: Chứng minh bất biến link bắt được lỗi thật**

Trong một `lesson` bất kỳ, tạm đổi một link thành `#/docs/java-05`, chạy `node webapp/check-data.mjs`.

Kỳ vọng: ĐỎ ở bất biến #3b ("Link #/docs/<id> trong lộ trình khớp lĩnh vực với track") với thông báo `doc field="java", track field="modern-concurrency"`. **Hoàn nguyên** rồi chạy lại cho xanh. Đây chính là luật ở Global Constraints, phải thấy nó chặn thật.

- [ ] **Step 8: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh
```

Ở lĩnh vực `Modern Concurrency in Java`:
- Nav đủ 3 mục: Bảng điều khiển · Lộ trình học · Tài liệu.
- Trang Lộ trình hiện track `Modern Concurrency`; mở ra thấy 5 tuần, mỗi tuần đúng số mục theo bảng phân bổ.
- Tick một mục, tải lại trang — vẫn còn tick. Đổi sang lĩnh vực khác rồi quay lại — vẫn còn.
- Bấm một chip tài nguyên `MCJ 0N` — mở đúng tài liệu, **không** nhảy sang lĩnh vực khác.
- Bảng điều khiển hiện thẻ tiến độ lộ trình với phần trăm đúng.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/modconc-roadmap-part1.js webapp/js/data/roadmap.js \
        webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: track đọc Modern Concurrency in Java tuần 1-5 — 19 mục

Chương 1 tới nửa đầu chương 4. Bật module "roadmap" cho lĩnh vực mới cùng
khoá đếm roadmap-items:modern-concurrency = 19 (nâng lên 32 khi có part2).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Track `modconc` — tuần 6–9 (13 mục)

**Files:**
- Create: `webapp/js/data/modconc-roadmap-part2.js`
- Modify: `webapp/js/data/roadmap.js` (nối part2 vào track)
- Modify: `webapp/check-data.mjs` (nâng khoá đếm 19 → 32)

**Interfaces:**
- Consumes: `modconcWeeksPart1` (Task 4), doc id `modconc-04` … `modconc-08` (Task 3).
- Produces: `export const modconcWeeksPart2` — mảng 4 tuần, id `mc-w6` … `mc-w9`, tổng **13** mục id `mc-w6-1` … `mc-w9-3`. Sau task này track có đủ 9 tuần / 32 mục.

**Phân bổ mục:** tuần 6: 4 · tuần 7: 3 · tuần 8: 3 · tuần 9: 3 = **13**.

| Tuần | id | Tiêu đề | Nguồn |
|---|---|---|---|
| 6 | `mc-w6` | Structured concurrency: ngoại lệ, cấu hình, quan sát | Ch.4 dòng 1746–3963 (`modconc-04`) |
| 7 | `mc-w7` | Scoped Values | Ch.5 toàn bộ (`modconc-05`) |
| 8 | `mc-w8` | Reactive Java sau Loom | Ch.6 toàn bộ (`modconc-06`) |
| 9 | `mc-w9` | Framework hiện đại và tổng kết | Ch.7 + Ch.8 (`modconc-07`, `modconc-08`) |

**Bảng mục — id, `text`, tiêu đề mục phải đọc (trích nguyên văn từ nguồn):**

| id | `text` | Đọc trong nguồn |
|---|---|---|
| `mc-w6-1` | Xử lý ngoại lệ trong StructuredTaskScope | `### Xử lý ngoại lệ trong StructuredTaskScope` |
| `mc-w6-2` | Cấu hình scope: timeout, tên, thread factory | `### Cấu hình` |
| `mc-w6-3` | Viết Joiner của riêng bạn | `### Joiner tùy chỉnh` |
| `mc-w6-4` | Nhất quán bộ nhớ, scope lồng nhau và khả năng quan sát | `### Hiệu ứng nhất quán bộ nhớ` · `### Scope lồng nhau` · `### Khả năng quan sát` |
| `mc-w7-1` | Gánh nặng truyền ngữ cảnh: ô nhiễm tham số và interface mong manh | `## Gánh nặng của việc truyền ngữ cảnh` (gồm `### Ô nhiễm tham số`, `### Sự mong manh của interface`, `### Sự ràng buộc và khả năng kiểm thử`) |
| `mc-w7-2` | ThreadLocal và những hạn chế của nó | `## Giới thiệu ThreadLocal` (gồm `### Những hạn chế của biến ThreadLocal`, `### Hướng tới việc chia sẻ nhẹ nhàng`) |
| `mc-w7-3` | ScopedValue: thành phần cốt lõi, cách chạy, đường di chuyển | `## Các thành phần cốt lõi của ScopedValue` (gồm `### Chạy ScopedValue`, `### ScopedValue và Structured Concurrency`, `### Di chuyển sang Scoped Values`) |
| `mc-w8-1` | Blocking so với non-blocking I/O | `## Tìm hiểu lập trình reactive trong Java` · `### Blocking so với Non-blocking I/O` |
| `mc-w8-2` | Kiến trúc hướng sự kiện và các API bất đồng bộ | `### Kiến trúc hướng sự kiện (Event-Driven Architecture)` · `### Các API bất đồng bộ (Asynchronous APIs)` |
| `mc-w8-3` | Reactive Streams, backpressure, và khi nào reactive vẫn đáng dùng | `## Lập trình Reactive trong Java` · `### Tìm hiểu về Reactive Streams` · `### Backpressure` · `### Lợi ích và hạn chế của lập trình Reactive` |
| `mc-w9-1` | Spring Boot: bật virtual thread và cấu hình thủ công | `## Spring Boot` · `### Cấu hình thủ công` (tệp `07-…`) |
| `mc-w9-2` | Quarkus và Jakarta EE | `## Quarkus` · `### Jakarta EE` (tệp `07-…`) |
| `mc-w9-3` | Tổng kết: chọn mô hình, tránh bẫy, và kế hoạch migrate | Toàn bộ tệp `08-ket-luan-va-diem-rut-ra.md` |

Lưu ý về cấu trúc nguồn chương 7: `### Jakarta EE` nằm **dưới** `## Quarkus` trong bản dịch. Đó là cấu trúc của chính nguồn — không sửa nguồn, chỉ cần biết để trích cho đúng.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa `19` thành `32`:

```js
    "roadmap-items:modern-concurrency": 32,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:modern-concurrency: kỳ vọng 32, thực tế 19`.

- [ ] **Step 3: Viết `webapp/js/data/modconc-roadmap-part2.js`**

Cấu trúc tuần: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }` — y như part1.

**Khuôn mẫu để bắt giọng:** `webapp/js/data/springsec-roadmap-part2.js` trong repo, cộng chính `modconc-roadmap-part1.js` bạn vừa viết ở Task 4 — hai tệp phải đọc như một giáo trình liền mạch, không đổi giọng giữa chừng.

**Lưu ý về `goal`:** plain text, không phải markdown (chỉ `practice` đi qua `inlineMd`). Không backtick, không `**`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

Con số này là hướng dẫn, không phải trần cứng — tiền lệ cùng thể loại trong kho, `springsec-roadmap-part{1,2}.js`, nằm ở dải 188–272 từ (trung vị p1 216, p2 240), nên bám sát nguồn (sách) quan trọng hơn bám đúng con số.

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [<Tên tiêu đề nguyên văn>](#/docs/modconc-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Năm quy tắc bắt buộc khi viết `lesson`:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng tệp `modern-concurrency-vi/NN-*.md`, đọc mục được trích, rồi mới viết. Không suy diễn từ kiến thức concurrency chung, không mượn nội dung từ `Chủ đề II — Concurrency Model/` của kho.
2. **Trích đúng tiêu đề mục sách thật có, nguyên văn.** Sách không đánh số mục — đối chiếu bằng `grep -nF "## Tên tiêu đề" modern-concurrency-vi/NN-*.md` trước khi dán vào `lesson`. Không bịa `§6.2`.
3. **Khối `Tự kiểm tra` phải trả lời được bằng chính mục vừa đọc**, không cần tài liệu ngoài.
4. **Không link chéo lĩnh vực.** Mọi `#/docs/…` trong tệp này phải là `#/docs/modconc-0N`. Nhắc series Java sẵn có thì viết bằng chữ, không đặt link.
5. **Link ngoài chỉ lấy từ bảng "Nguồn ngoài được phép"** ở đầu kế hoạch.

```js
// Lộ trình đọc Modern Concurrency in Java — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Modern Concurrency in Java" (O'Reilly,
// ISBN 9781098165406). Thư mục nguồn: modern-concurrency-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (mc-w<N> / mc-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Tuần 9 gộp hai chương ngắn nhất (ch.7 27KB, ch.8 7KB) — tuần nhẹ về số byte
// nhưng nặng về tổng hợp: đây là chỗ người học chốt lại lựa chọn mô hình.

export const modconcWeeksPart2 = [
  {
    id: "mc-w6",
    week: "Tuần 6",
    title: "Structured concurrency: ngoại lệ, cấu hình, quan sát",
    goal: "Xử lý được lỗi của subtask theo đúng chính sách đã chọn, đặt được timeout cho scope, và đọc được trạng thái scope khi có sự cố.",
    practice: "Lấy lại ví dụ scope ở tuần 5, ép một subtask ném ngoại lệ, rồi quan sát cả scope kết thúc thế nào; sau đó thêm cấu hình timeout và lặp lại.",
    resources: [
      { label: "MCJ 04 — Structured Concurrency", href: "#/docs/modconc-04" },
      { label: "JEP 505 — Structured Concurrency", href: "https://openjdk.org/jeps/505" },
    ],
    items: [
      // 4 mục mc-w6-1 … mc-w6-4 — `id` và `text` lấy nguyên văn từ "Bảng mục"
      // ở đầu Task 5.
    ],
  },
  // Tuần 7–9: cùng cách làm, `title` lấy từ bảng tuần ở đầu Task 5.
  // Số mục mỗi tuần: mc-w7: 3 · mc-w8: 3 · mc-w9: 3.
  // resources: tuần 7 dùng #/docs/modconc-05 + JEP 506;
  //            tuần 8 dùng #/docs/modconc-06;
  //            tuần 9 dùng #/docs/modconc-07 + #/docs/modconc-08 + JEP 444.
];
```

- [ ] **Step 4: Nối part2 vào track trong `webapp/js/data/roadmap.js`**

```js
import { modconcWeeksPart2 } from "./modconc-roadmap-part2.js";
```

và trong track `modconc`:

```js
    weeks: [...modconcWeeksPart1, ...modconcWeeksPart2],
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH với `roadmap-items:modern-concurrency` = 32.

- [ ] **Step 6: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh
```

- Track `Modern Concurrency` có đủ **9 tuần**; nhãn tuần không tràn ô.
- Nút "Tiếp tục học" nhảy đúng mục chưa tick đầu tiên.
- Tick hết tuần 9, thanh tiến độ track lên 100%.
- Mọi chip tài nguyên bấm được, không chip nào 404.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/modconc-roadmap-part2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: track đọc Modern Concurrency in Java tuần 6-9 — đủ 32 mục

Nửa sau chương 4, chương 5, 6 và tuần cuối gộp chương 7 với chương 8.
Khoá đếm roadmap-items:modern-concurrency nâng 19 -> 32.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Cập nhật tài liệu & nghiệm thu

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`
- Modify: `webapp/index.html`

**Interfaces:**
- Consumes: toàn bộ dữ liệu của Task 1–5.
- Produces: không có API mới. Đây là task đóng đợt.

- [ ] **Step 1: Lấy số liệu thật, không chép từ trí nhớ**

```bash
node --input-type=module -e '
const { docs } = await import("./webapp/js/data/docs-index.js");
const { tracks } = await import("./webapp/js/data/roadmap.js");
const { FIELDS } = await import("./webapp/js/data/fields.js");
const f = (r) => r.field ?? "kubernetes";
const per = {};
for (const d of docs) per[f(d)] = (per[f(d)] ?? 0) + 1;
console.log("lĩnh vực:", Object.keys(FIELDS).length);
console.log("tài liệu:", docs.length, per);
console.log("track:", tracks.length);
console.log("mục lộ trình:", tracks.reduce((n, t) => n + t.weeks.flatMap((w) => w.items).length, 0));
'
```

Kỳ vọng: 6 lĩnh vực · 86 tài liệu (24 kubernetes, 18 sysprog, 10 java, 21 spring-security, 5 senior-java, 8 modern-concurrency) · 11 track · 572 mục. **Nếu số thật khác, dùng số thật và điều tra vì sao lệch** trước khi viết vào tài liệu.

- [ ] **Step 2: Cập nhật `webapp/README.md`**

Bốn chỗ:
1. Câu mở đầu — thêm **Modern Concurrency in Java** vào danh sách lĩnh vực.
2. Hàng "🗺️ Lộ trình học" — `10 giáo trình` → `11 giáo trình`, `540 mục` → `572 mục`, thêm mô tả track mới: *lộ trình đọc Modern Concurrency in Java (9 tuần, 32 mục, bám theo 8 chương sách)*.
3. Hàng "📚 Thư viện tài liệu" — `78 tài liệu` → `86 tài liệu`, `5 lĩnh vực` → `6 lĩnh vực`, thêm `8 Modern Concurrency in Java`.
4. Mục "Bộ chọn lĩnh vực" — thêm tên lĩnh vực mới vào danh sách và một câu nói nó có 3 module (Bảng điều khiển + Lộ trình + Tài liệu), chưa có flashcards/trắc nghiệm.
5. Cây cấu trúc mã — thêm dòng `modconc-roadmap-part*.js   # sách Modern Concurrency in Java`.

- [ ] **Step 3: Cập nhật `README.md` gốc**

Ba chỗ:
1. Câu dẫn mục DevPrep (dòng ~82): thêm bản dịch **Modern Concurrency in Java**, `cả năm lĩnh vực` → `cả sáu lĩnh vực`.
2. Bảng thành phần: thêm hàng

```markdown
| [`modern-concurrency-vi/`](./modern-concurrency-vi/) | Bản dịch tiếng Việt *Modern Concurrency in Java* (O'Reilly, ISBN 9781098165406) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 8 chương, 19 hình. Đọc trong app ở lĩnh vực Modern Concurrency in Java. |
```

3. Hàng `webapp/`: `10 giáo trình, 540 mục` → `11 giáo trình, 572 mục`; `78 tài liệu` → `86 tài liệu`; thêm lĩnh vực mới vào danh sách trong ngoặc.

- [ ] **Step 4: Cập nhật `webapp/index.html`**

`<meta name="description">` — thêm `Modern Concurrency in Java` vào danh sách lĩnh vực. Giữ câu dưới 160 ký tự nếu được; nếu phải dài hơn thì rút gọn phần liệt kê module cuối câu.

- [ ] **Step 5: Rà lượt cuối cho hết lớp lỗi "câu văn xuôi đã cũ"**

```bash
grep -rn "năm lĩnh vực\|5 lĩnh vực\|10 giáo trình\|540 mục\|78 tài liệu" \
  README.md webapp/README.md webapp/index.html webapp/js/data/*.js
```

Kỳ vọng: **không còn dòng nào**. Mỗi kết quả còn sót là một câu chưa cập nhật.

- [ ] **Step 6: Chạy toàn bộ cổng kiểm**

```bash
find webapp/content -mindepth 1 -delete
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kỳ vọng: XANH toàn bộ, **0 bất biến bị bỏ qua** (nếu có dòng "bỏ qua" nghĩa là `build-content.sh` chưa chạy).

- [ ] **Step 7: Smoke checklist đầy đủ**

```bash
./webapp/dev.sh
```

- [ ] Bộ chọn hiện 6 lĩnh vực, thứ tự: Kubernetes · Lập trình hệ thống · Java & Spring Boot Scalability · Modern Concurrency in Java · Spring Security · Lộ trình Senior Java.
- [ ] Lĩnh vực mới: nav đúng 3 mục; chân sidebar có link Project Loom.
- [ ] 8 tài liệu mở được; ảnh ch1/ch2/ch3/ch4/ch6 hiển thị; MCJ 05, 07, 08 không có ảnh (đúng nguồn).
- [ ] Track 9 tuần, 32 mục; tick rồi tải lại vẫn còn.
- [ ] Deep-link `#/docs/modconc-03` và `#/roadmap/modconc` mở đúng kể cả khi đang ở lĩnh vực Kubernetes.
- [ ] Đổi giao diện sáng/tối: trang tài liệu và trang lộ trình của lĩnh vực mới đều đọc được.
- [ ] Thu hẹp cửa sổ xuống ~380px: sidebar mobile mở/đóng bình thường, bảng trong tài liệu cuộn ngang được.
- [ ] **Tiến độ của 5 lĩnh vực cũ không đổi** — mở một track cũ đã tick trước đó, kiểm còn nguyên.

- [ ] **Step 8: Commit**

```bash
git add README.md webapp/README.md webapp/index.html
git commit -m "$(cat <<'EOF'
docs: cập nhật số liệu và danh sách lĩnh vực sau khi thêm Modern Concurrency

6 lĩnh vực, 11 giáo trình, 86 tài liệu, 572 mục lộ trình.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Xác nhận CI sẽ qua**

```bash
grep -n "build-content" .github/workflows/deploy-pages.yml
```

Kỳ vọng: workflow gọi `webapp/build-content.sh` cho cả `webapp/content` và `_site/content` — nghĩa là nội dung mới tự động vào bản deploy, không phải sửa workflow. Không có bước nào khác cần đụng.

---

## Tiêu chí hoàn thành

- [ ] `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs` xanh toàn bộ, không bất biến nào bị bỏ qua.
- [ ] `docs:modern-concurrency` = 8 và `roadmap-items:modern-concurrency` = 32 trong `EXPECTED.counts`, khớp dữ liệu thật.
- [ ] Thư mục nguồn là `modern-concurrency-vi/` với 8 chương slug hoá + README mục lục; `git log --follow` lần được về tệp cũ; nội dung chương không đổi một byte.
- [ ] Lĩnh vực thứ 6 hiện trong bộ chọn với đúng 3 module, đứng ngay sau lĩnh vực `java`.
- [ ] 32 mục lộ trình, mỗi mục có đủ 4 khối Mục tiêu / Đọc / Bẫy / Tự kiểm tra, mọi trích dẫn tiêu đề đối chiếu được bằng `grep -nF` về tệp nguồn.
- [ ] Không một link `#/docs/` nào trong track trỏ ra ngoài lĩnh vực `modern-concurrency`.
- [ ] Không xuất hiện tên tác giả ở bất kỳ tệp nào của đợt này.
- [ ] `README.md`, `webapp/README.md`, `webapp/index.html` không còn số liệu cũ (5 lĩnh vực / 10 giáo trình / 540 mục / 78 tài liệu).
- [ ] Tiến độ `localStorage` của 5 lĩnh vực cũ không đổi.
