# Tích hợp Effective Java vào DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lĩnh vực thứ 15 `effective-java` vào DevPrep — 11 chương bản dịch *Effective Java* 3e trong thư viện tài liệu, lộ trình đọc 10 tuần / 40 mục, 24 câu phỏng vấn, nối vào con đường Java Backend và trục Senior Java.

**Architecture:** Web app tĩnh vanilla JS, không build. Dữ liệu là module ES trong `webapp/js/data/<field>/`; nguồn markdown ở `sources/<field>/` được `build-content.sh` sao chép vào `webapp/content/`. "Test" của repo là `webapp/scripts/check-data.mjs` (57 bất biến + bảng `EXPECTED.counts`). Mỗi task: sửa bảng kỳ vọng / khai trước → chạy thấy đỏ → viết dữ liệu → chạy thấy xanh → commit.

**Tech Stack:** JavaScript ES modules, Node (chạy check-data), bash, git.

**Spec:** [`docs/superpowers/specs/2026-09-26-effective-java-integration-design.md`](../specs/2026-09-26-effective-java-integration-design.md)

## Global Constraints

- Field id `effective-java`; doc id `ej-02`…`ej-12`; track id `ej`; tuần `ej-w<N>`, mục `ej-w<N>-<M>`; phỏng vấn `ej-iq01`…`ej-iq24`; chủ đề `ej-create`, `ej-object`, `ej-types`, `ej-lambda`, `ej-api`, `ej-conc`.
- Module: `["dashboard", "guide", "docs", "roadmap", "interview"]` — chỉ khai một module khi dữ liệu của nó đã có (bất biến #7/#7b/IQ6).
- `EXPECTED.counts`: `docs:effective-java` = 11, `roadmap-items:effective-java` = 40, `interview:effective-java` = 24.
- Con đường Java Backend: `spring-start → modern-java → effective-java → wgjd → jcip → ocnj → jpa → java → modern-concurrency → spring-security`.
- `part: null` cho mọi doc. `title` = H1 bỏ "Chương N. ".
- Nội dung markdown bản dịch **không sửa ký tự nào**.
- Mọi văn bản hiển thị viết bằng tiếng Việt, giữ thuật ngữ tiếng Anh như bản dịch (static factory, builder, raw type, bounded wildcard…).
- Lộ trình là kế hoạch đọc trỏ vào sách, **không chép lại nội dung sách**.
- `$SCRATCH` = thư mục scratchpad của phiên (không nằm trong repo); script lint tạm đặt ở đó, không commit.
- Lệnh kiểm chạy từ gốc repo: `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`. Viết tắt trong plan: **CHECK**.
- Commit message tiếng Việt, kiểu `feat(effective-java): …`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Link `#/docs/ej-NN` sai chương** — một bài học về Item 50 trỏ `ej-07` vẫn qua #3 (id có thật). Người đọc bấm link sẽ rơi vào chương sai. Task 3/4 có bước tự kiểm bằng script đối chiếu dải Item ↔ chương.
2. **Bỏ sót Item** — 40 mục phải phủ đủ Item 1–90; không bất biến nào kiểm. Task 4 có script đếm Item được nhắc trong `text`/`lesson`.
3. **PDF ghép nhầm chương** vì `ls` xếp `10 …` trước `2 …`. Task 1 có bước so kích thước/tên sau khi đổi.
4. **Đề phỏng vấn lộ rubric** (IQ7) hoặc sai khoảng phút theo cấp (IQ4: L1 3–6, L2 4–10, L3 5–12, L4 8–20) — CHECK bắt; Task 5/6 ghi rõ khoảng phút.
5. **Guide/README còn nói "chín chặng", "14 lĩnh vực", "288 câu"** — không bất biến nào bắt. Task 7 có bước `grep` các chuỗi cũ.

---

## Bảng tham chiếu dùng chung

Chương ↔ doc ↔ tệp ↔ Item (dùng ở mọi task):

| doc id | `chapter` | Tệp (`sources/effective-java/`) | `title` | Item | icon |
|---|---:|---|---|---|---|
| ej-02 | 2 | `02-creating-and-destroying-objects.md` | Tạo và hủy đối tượng | 1–9 | 🏗️ |
| ej-03 | 3 | `03-methods-common-to-all-objects.md` | Các phương thức chung của mọi đối tượng | 10–14 | ⚖️ |
| ej-04 | 4 | `04-classes-and-interfaces.md` | Class và Interface | 15–25 | 🧩 |
| ej-05 | 5 | `05-generics.md` | Generics | 26–33 | 🔣 |
| ej-06 | 6 | `06-enums-and-annotations.md` | Enum và Annotation | 34–41 | 🏷️ |
| ej-07 | 7 | `07-lambdas-and-streams.md` | Lambda và Stream | 42–48 | λ |
| ej-08 | 8 | `08-methods.md` | Phương thức | 49–56 | 🔧 |
| ej-09 | 9 | `09-general-programming.md` | Lập trình tổng quát | 57–68 | 🧰 |
| ej-10 | 10 | `10-exceptions.md` | Exceptions | 69–77 | 🚨 |
| ej-11 | 11 | `11-concurrency.md` | Concurrency (Lập trình đồng thời) | 78–84 | 🧵 |
| ej-12 | 12 | `12-serialization.md` | Serialization | 85–90 | 📦 |

---

### Task 1: Chuyển nguồn vào `sources/effective-java/`

**Files:**
- Move: `Effective Java/vi/chNN-*.md` → `sources/effective-java/NN-*.md` (11 tệp)
- Move: `Effective Java/<N> <Title> _ Effective Java, 3rd Edition.pdf` → `sources/effective-java/pdf/NN-<slug>.pdf` (11 tệp)
- Delete: `Effective Java/vi/images/ch02-000.jpg` … `ch12-000.jpg` (11 tệp)
- Create: `sources/effective-java/README.md`
- Modify: `sources/README.md` (bảng "Bản đồ hiện tại")

**Interfaces:**
- Produces: 11 tệp `sources/effective-java/NN-slug.md` đúng tên ở bảng tham chiếu; Task 2 trỏ `file: "content/effective-java/NN-slug.md"`.

- [ ] **Step 1: Xác nhận nền xanh và không ai tham chiếu đường dẫn cũ**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -2
grep -rn "Effective Java/" --exclude-dir=.git --exclude-dir=docs --exclude-dir=content --exclude-dir="Effective Java" .
```

Expected: `57/57 bất biến đạt`; grep không in dòng nào.

- [ ] **Step 2: Chuyển markdown (bỏ tiền tố `ch`)**

```bash
mkdir -p sources/effective-java/pdf
for f in "Effective Java/vi"/ch*.md; do
  b=$(basename "$f"); git mv "$f" "sources/effective-java/${b#ch}"
done
```

- [ ] **Step 3: Chuyển PDF — ghép theo SỐ chương, không theo thứ tự `ls`**

```bash
for n in 2 3 4 5 6 7 8 9 10 11 12; do
  nn=$(printf "%02d" $n)
  src=$(ls "Effective Java/" | grep -E "^${n} .*\.pdf$")
  slug=$(ls sources/effective-java/ | grep -E "^${nn}-.*\.md$" | sed 's/\.md$//')
  git mv "Effective Java/$src" "sources/effective-java/pdf/${slug}.pdf"
done
ls sources/effective-java/pdf
```

Expected: 11 tệp `02-creating-and-destroying-objects.pdf` … `12-serialization.pdf`. Kiểm chéo: `pdf/10-exceptions.pdf` phải ~297 KB và `pdf/02-creating-and-destroying-objects.pdf` ~551 KB (`ls -l`).

- [ ] **Step 4: Xoá ảnh bìa không tham chiếu và thư mục cũ**

```bash
grep -c '!\[' sources/effective-java/*.md | grep -v ':0$'   # phải không in gì
git rm -q "Effective Java/vi/images/"*.jpg
ls "Effective Java" 2>/dev/null && echo "CÒN SÓT" || echo "đã sạch"
```

Expected: `đã sạch`.

- [ ] **Step 5: Viết `sources/effective-java/README.md`**

```markdown
# Effective Java, ấn bản 3

Bản dịch tiếng Việt của *Effective Java, Third Edition* — Joshua Bloch (Addison-Wesley, 2018).

> **Bản quyền.** Đây là sách thương mại có bản quyền, **không** phải giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Chương | 11 (2–12). Chương 1 (Introduction) không có bản dịch — chương đó không chứa Item nào |
| Item | 90 (Item 1–90), đủ |
| Số từ | 159.666 |
| Hình | 0 — sách không có hình minh hoạ |
| PDF gốc | 11, trong `pdf/` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Trong app | Lĩnh vực **Effective Java**, kèm lộ trình đọc 10 tuần / 40 mục và 24 câu phỏng vấn |
| Mã nguồn ví dụ | <https://github.com/jbloch/effective-java-3e-source-code> |

## Mục lục

| Chương | Tiêu đề | Item | Tệp |
| --- | --- | --- | --- |
| 2 | Tạo và hủy đối tượng | 1–9 | [02-creating-and-destroying-objects.md](02-creating-and-destroying-objects.md) |
| 3 | Các phương thức chung của mọi đối tượng | 10–14 | [03-methods-common-to-all-objects.md](03-methods-common-to-all-objects.md) |
| 4 | Class và Interface | 15–25 | [04-classes-and-interfaces.md](04-classes-and-interfaces.md) |
| 5 | Generics | 26–33 | [05-generics.md](05-generics.md) |
| 6 | Enum và Annotation | 34–41 | [06-enums-and-annotations.md](06-enums-and-annotations.md) |
| 7 | Lambda và Stream | 42–48 | [07-lambdas-and-streams.md](07-lambdas-and-streams.md) |
| 8 | Phương thức | 49–56 | [08-methods.md](08-methods.md) |
| 9 | Lập trình tổng quát | 57–68 | [09-general-programming.md](09-general-programming.md) |
| 10 | Exceptions | 69–77 | [10-exceptions.md](10-exceptions.md) |
| 11 | Concurrency (Lập trình đồng thời) | 78–84 | [11-concurrency.md](11-concurrency.md) |
| 12 | Serialization | 85–90 | [12-serialization.md](12-serialization.md) |

## Quy ước dịch

Giữ nguyên thuật ngữ tiếng Anh (static factory, builder, raw type, bounded wildcard, checked
exception…), chú giải tiếng Việt trong ngoặc ở lần xuất hiện đầu. Tham chiếu chéo trong sách giữ
dạng **Item N**.
```

- [ ] **Step 6: Thêm dòng vào bảng "Bản đồ hiện tại" của `sources/README.md`** — chèn ngay sau dòng `modern-java`:

```markdown
| `effective-java` | `effective-java/` | Bản dịch *Effective Java* 3e (Bloch, Addison-Wesley 2018) — 11 chương (2–12), 90 Item, PDF |
```

- [ ] **Step 7: CHECK — vẫn 57/57** (chưa khai lĩnh vực nên app chưa đọc thư mục mới)

Expected: `57/57 bất biến đạt`.

- [ ] **Step 8: Commit**

```bash
git add -A sources/effective-java sources/README.md "Effective Java"
git commit -m "feat(effective-java): chuyển bản dịch 11 chương vào sources/effective-java

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Khai lĩnh vực + thư viện 11 tài liệu + con đường + hướng dẫn lĩnh vực

**Files:**
- Modify: `webapp/scripts/check-data.mjs` (bảng `EXPECTED.counts`, sau khối `modern-java`)
- Modify: `webapp/js/data/fields.js` (thêm entry sau `"modern-java"`; `FIELD_ORDER` dòng 156)
- Create: `webapp/js/data/effective-java/docs.js`
- Modify: `webapp/js/data/docs-index.js`
- Modify: `webapp/js/data/paths.js` (`PATHS.java`)
- Modify: `webapp/js/data/guides.js` (`fieldGuides`, chèn sau khối `"modern-java"` kết thúc trước `kafka:`)

**Interfaces:**
- Consumes: tệp nguồn Task 1.
- Produces: `FIELDS["effective-java"]`, 11 doc id `ej-02`…`ej-12` mà Task 3–7 link tới qua `#/docs/ej-NN`.

- [ ] **Step 1: Thêm kỳ vọng docs trước (đỏ)** — trong `EXPECTED.counts`, ngay sau `"roadmap-items:modern-java": 48,`:

```js
    // Lĩnh vực Effective Java — 11 chương (2–12) Effective Java ấn bản 3;
    // chương 1 (Introduction) không có bản dịch và không chứa Item nào.
    "docs:effective-java": 11,
```

- [ ] **Step 2: CHECK — phải đỏ**

Expected: FAIL ở "Số lượng bản ghi khớp bảng kỳ vọng" (docs:effective-java 0 ≠ 11).

- [ ] **Step 3: Khai lĩnh vực trong `fields.js`** — entry chèn sau khối `"modern-java"`:

```js
  "effective-java": {
    label: "Effective Java",
    icon: "📘",
    short: "EJ",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt Effective Java, ấn bản 3 (Joshua Bloch, Addison-Wesley 2018) — 90 Item về tạo đối tượng, equals/hashCode, thiết kế class và interface, generics, enum, lambda & stream, thiết kế method, exception, concurrency và serialization.",
    certFilter: false,
    // Mở dần theo dữ liệu: "roadmap" bật ở Task 4, "interview" ở Task 6 — khai sớm là #7/IQ6 báo đỏ.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "jbloch/effective-java-3e-source-code", href: "https://github.com/jbloch/effective-java-3e-source-code" },
  },
```

`FIELD_ORDER`: chèn `"effective-java"` ngay sau `"modern-java"`.

- [ ] **Step 4: Tạo `webapp/js/data/effective-java/docs.js`**

```js
// Tài liệu lĩnh vực "Effective Java" — 11 chương (2–12), đủ Item 1–90.
// Nguồn markdown: sources/effective-java/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/effective-java/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `part: null`: sách không chia Phần. Nhãn "Ch. N · …" do labels.js sinh (bất biến D1).
//
// Chương 1 (Introduction) không có bản dịch — nó chỉ hướng dẫn cách dùng sách, không chứa Item nào.

const base = { field: "effective-java", part: null };

export const docs = [
  { ...base, id: "ej-02", chapter: 2, title: "Tạo và hủy đối tượng",
    file: "content/effective-java/02-creating-and-destroying-objects.md", icon: "🏗️",
    desc: "Item 1–9: static factory thay constructor, builder, singleton bằng enum, class không khởi tạo được, dependency injection, tránh tạo đối tượng thừa, rò rỉ bộ nhớ do tham chiếu lỗi thời, finalizer/cleaner và try-with-resources.",
    tags: ["Effective Java", "Tạo đối tượng", "Builder"] },
  { ...base, id: "ej-03", chapter: 3, title: "Các phương thức chung của mọi đối tượng",
    file: "content/effective-java/03-methods-common-to-all-objects.md", icon: "⚖️",
    desc: "Item 10–14: hợp đồng equals, hashCode đi kèm equals, toString, clone thận trọng và Comparable/compareTo.",
    tags: ["Effective Java", "equals/hashCode", "Comparable"] },
  { ...base, id: "ej-04", chapter: 4, title: "Class và Interface",
    file: "content/effective-java/04-classes-and-interfaces.md", icon: "🧩",
    desc: "Item 15–25: giảm khả năng truy cập, accessor thay field public, giảm tính mutable, composition hơn inheritance, thiết kế cho kế thừa, interface hơn abstract class, default method, tagged class, nested class.",
    tags: ["Effective Java", "Immutability", "Composition"] },
  { ...base, id: "ej-05", chapter: 5, title: "Generics",
    file: "content/effective-java/05-generics.md", icon: "🔣",
    desc: "Item 26–33: raw type, cảnh báo unchecked, list hơn mảng, generic type và generic method, bounded wildcard (PECS), generics với varargs, typesafe heterogeneous container.",
    tags: ["Effective Java", "Generics", "PECS"] },
  { ...base, id: "ej-06", chapter: 6, title: "Enum và Annotation",
    file: "content/effective-java/06-enums-and-annotations.md", icon: "🏷️",
    desc: "Item 34–41: enum thay hằng số int, instance field thay ordinal, EnumSet và EnumMap, enum mở rộng qua interface, annotation hơn naming pattern, @Override, marker interface.",
    tags: ["Effective Java", "Enum", "Annotation"] },
  { ...base, id: "ej-07", chapter: 7, title: "Lambda và Stream",
    file: "content/effective-java/07-lambdas-and-streams.md", icon: "λ",
    desc: "Item 42–48: lambda hơn anonymous class, method reference, functional interface chuẩn, dùng stream thận trọng, hàm không side effect, Collection làm kiểu trả về, song song hoá stream.",
    tags: ["Effective Java", "Lambda", "Stream"] },
  { ...base, id: "ej-08", chapter: 8, title: "Phương thức",
    file: "content/effective-java/08-methods.md", icon: "🔧",
    desc: "Item 49–56: kiểm tra tham số, bản sao phòng vệ, thiết kế chữ ký, overloading và varargs thận trọng, trả collection rỗng thay null, Optional, doc comment.",
    tags: ["Effective Java", "API design", "Optional"] },
  { ...base, id: "ej-09", chapter: 9, title: "Lập trình tổng quát",
    file: "content/effective-java/09-general-programming.md", icon: "🧰",
    desc: "Item 57–68: phạm vi biến cục bộ, for-each, dùng thư viện, float/double và BigDecimal, boxed primitive, chuỗi, interface làm kiểu tham chiếu, reflection, native method, tối ưu hoá, quy ước đặt tên.",
    tags: ["Effective Java", "Boxed primitive", "Tối ưu hoá"] },
  { ...base, id: "ej-10", chapter: 10, title: "Exceptions",
    file: "content/effective-java/10-exceptions.md", icon: "🚨",
    desc: "Item 69–77: exception chỉ cho tình huống ngoại lệ, checked hay runtime, exception chuẩn, exception translation, tài liệu hoá, detail message, failure atomicity, không nuốt exception.",
    tags: ["Effective Java", "Exception", "Checked/unchecked"] },
  { ...base, id: "ej-11", chapter: 11, title: "Concurrency (Lập trình đồng thời)",
    file: "content/effective-java/11-concurrency.md", icon: "🧵",
    desc: "Item 78–84: đồng bộ hoá dữ liệu chia sẻ, tránh đồng bộ quá mức, executor hơn thread, tiện ích concurrency hơn wait/notify, tài liệu hoá thread safety, lazy initialization, không dựa vào bộ lập lịch.",
    tags: ["Effective Java", "Concurrency", "Executor"] },
  { ...base, id: "ej-12", chapter: 12, title: "Serialization",
    file: "content/effective-java/12-serialization.md", icon: "📦",
    desc: "Item 85–90: lựa chọn thay Java serialization, cái giá của Serializable, custom serialized form, readObject phòng thủ, enum hơn readResolve, serialization proxy.",
    tags: ["Effective Java", "Serialization", "Bảo mật"] },
];
```

Trước khi dùng spread `base`: mở `webapp/js/data/jpa/docs.js` xem các lĩnh vực khác có viết tường minh từng khoá không. Nếu **mọi** docs.js khác viết tường minh `field`/`part` trên từng entry thì viết tường minh như vậy (khớp nếp repo) thay cho `...base`.

- [ ] **Step 5: Đăng ký trong `docs-index.js`**

Thêm `import { docs as effectiveJava } from "./effective-java/docs.js";` sau dòng import `jpa`, và `...effectiveJava,` sau `...jpa,`.

- [ ] **Step 6: Con đường — `paths.js`**

`PATHS.java.fields` →

```js
    fields: ["spring-start", "modern-java", "effective-java", "wgjd", "jcip", "ocnj", "jpa", "java", "modern-concurrency", "spring-security"],
```

`PATHS.java.desc` → thay cụm `"Một nghề, chín chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM"` bằng `"Một nghề, mười chặng: Spring cơ bản → Java hiện đại → dùng ngôn ngữ cho đúng (API, generics, equals/hashCode, exception) → xuống dưới nắp JVM"`; phần còn lại giữ nguyên.

- [ ] **Step 7: `fieldGuides["effective-java"]` trong `guides.js`** (chèn sau khối `"modern-java"` của `fieldGuides`):

```js
  "effective-java": {
    tagline: "Đọc Effective Java ấn bản 3 có kỷ luật — 90 Item trong 10 tuần, mỗi Item một đoạn code bạn tự gõ và một chỗ trong codebase để áp dụng.",
    audience: "Java developer đã viết code production, dùng thành thạo collection, interface và generics ở mức gọi API; **lambda/stream nên xong Modern Java in Action trước** vì chương 7 giả định bạn đã quen chúng. Sách không dạy cú pháp — nó dạy chọn đúng giữa các cách viết đều compile được.",
    hoursPerWeek: "5–6 giờ/tuần · 10 tuần",
    prereqs: [
      "JDK 17+ và một IDE; clone `jbloch/effective-java-3e-source-code` để chạy ví dụ.",
      "Viết được class, interface, generic method; đọc được stream pipeline đơn giản.",
      "Một codebase thật (cá nhân hoặc công ty) để tìm chỗ vi phạm từng Item.",
    ],
    steps: [
      { id: "ej-1", title: "Đủ nền Java hiện đại", desc: "Tự đánh giá: viết được lambda, stream, Optional. Chưa vững thì đi lĩnh vực Modern Java in Action trước rồi quay lại tick bước này.", done: { kind: "manual" } },
      // ej-2, ej-3 (bước trỏ track "ej") thêm ở Task 4 — track chưa tồn tại thì G3 báo đỏ.
      { id: "ej-4", title: "Đọc trọn 11 chương", desc: "Chương 2–12, đủ 90 Item. Đánh dấu đã đọc từng chương khi xong.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "ej-5", title: "Dùng Effective Java trong code review thật", desc: "Viết ít nhất ba comment review ở dự án thật dẫn đúng số Item và lý do. Tự đánh dấu khi xong.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Một Item, một đoạn code", desc: "Gõ ví dụ \"sai\" của Item trước, chạy để thấy nó hỏng, rồi mới gõ bản đúng. Item nào không chạy được thì viết test chứng minh." },
      { title: "Tìm vi phạm trong codebase của bạn", desc: "Sau mỗi chương, grep codebase tìm ít nhất một chỗ vi phạm (constructor 6 tham số, equals không hashCode, catch rỗng…). Ghi lại, chưa cần sửa." },
      { title: "Nhớ bằng số Item", desc: "Khi review hay tranh luận, dẫn \"Item 18\" thay vì \"sách bảo\". Buộc bạn nhớ chính xác Item nói gì và ngoại lệ của nó." },
    ],
    pitfalls: [
      "Áp Item như luật tuyệt đối — hầu hết Item bắt đầu bằng \"cân nhắc\" hoặc \"ưu tiên\", và sách nêu rõ khi nào không áp dụng.",
      "Đọc lướt chương 3 vì \"IDE sinh equals/hashCode rồi\" — hợp đồng equals là nguồn bug khó tìm nhất trong collection.",
      "Bỏ chương 12 vì \"không ai dùng Java serialization\" — Item 85 giải thích vì sao đó là lỗ hổng bảo mật, và nó vẫn nằm trong nhiều thư viện.",
    ],
    doneWhen: [
      "Nhìn một class là nói được nó vi phạm Item nào, bằng số Item.",
      "Viết được builder, bản sao phòng vệ, equals/hashCode đúng hợp đồng mà không tra.",
      "Giải thích được PECS và chọn đúng `? extends` / `? super` cho một API mới.",
    ],
  },
```

- [ ] **Step 8: CHECK — phải xanh**

Expected: `57/57 bất biến đạt` (số bất biến không đổi; chỉ số liệu đổi). Nếu G1 báo thiếu khoá của `fieldGuides`, mở một entry khác (`jpa`) so hình dạng rồi bổ sung đúng khoá thiếu.

- [ ] **Step 9: Commit**

```bash
git add webapp/scripts/check-data.mjs webapp/js/data/fields.js webapp/js/data/effective-java/docs.js webapp/js/data/docs-index.js webapp/js/data/paths.js webapp/js/data/guides.js
git commit -m "feat(effective-java): khai lĩnh vực, thư viện 11 chương và chặng thứ ba của con đường Java Backend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Khuôn bài học lộ trình (dùng cho Task 3 và Task 4)

Mỗi tuần có hình dạng y hệt `webapp/js/data/spring-security/roadmap-part1.js`:

```js
{
  id: "ej-w1",
  week: "Tuần 1",
  title: "…",
  goal: "…",          // 1–2 câu: làm được gì sau tuần
  practice: "…",      // một bài gõ code cụ thể trên JDK 17+
  resources: [
    { label: "EJ 02 — Tạo và hủy đối tượng", href: "#/docs/ej-02" },
    { label: "jbloch/effective-java-3e-source-code — chapter 2", href: "https://github.com/jbloch/effective-java-3e-source-code" },
  ],
  items: [ { id: "ej-w1-1", text: "…", lesson: `…` }, /* đúng 4 mục */ ],
}
```

`lesson` là template literal có đúng 4 đoạn, theo thứ tự, mỗi đoạn bắt đầu bằng nhãn in đậm:

1. `**Mục tiêu.**` — làm được / giải thích được gì, cụ thể.
2. `**Đọc.**` — liệt kê Item theo dạng `[Item N — <tiêu đề Item nguyên văn từ H2 bản dịch>](#/docs/ej-NN)`, nối bằng ` → `; thêm 1–2 câu chỉ đoạn nào đọc kỹ.
3. `**Bẫy.**` — 1–2 hiểu lầm thực tế, mỗi cái kèm lý do theo sách.
4. `**Tự kiểm tra.**` — 2 câu hỏi trả lời được sau khi đọc, không trả lời hộ.

Backtick trong template literal phải escape (`\``), như file mẫu. **Mẫu một mục đạt chuẩn:**

```js
      {
        id: "ej-w1-1",
        text: "Static factory method và builder — hai cách thay constructor",
        lesson: `**Mục tiêu.** Viết được một class vừa có static factory \`of(...)\` vừa có builder cho constructor nhiều tham số tuỳ chọn, và nói được mỗi cách thắng constructor ở điểm nào.

**Đọc.** [Item 1 — Cân nhắc dùng static factory method thay vì constructor](#/docs/ej-02) → [Item 2 — Cân nhắc dùng builder khi gặp constructor có nhiều tham số](#/docs/ej-02). Ở Item 1 đọc kỹ năm ưu điểm và hai nhược điểm, nhất là quy ước đặt tên \`from\`, \`of\`, \`valueOf\`, \`getInstance\`. Ở Item 2 gõ lại cả ba phiên bản \`NutritionFacts\`: telescoping constructor, JavaBeans, rồi Builder.

**Bẫy.** Tưởng JavaBeans (constructor rỗng + setter) là đủ tốt. Sách chỉ ra hai lỗi: đối tượng có thể ở trạng thái dở dang giữa các lần gọi setter, và class không thể immutable. Bẫy thứ hai: dùng builder cho class hai tham số — sách nói builder đáng giá từ khoảng bốn tham số trở lên hoặc khi class sẽ còn thêm tham số.

**Tự kiểm tra.** Vì sao \`Boolean.valueOf(boolean)\` không bao giờ tạo đối tượng mới, và điều đó cho phép class làm gì? Trong builder phân cấp của \`Pizza\`, phương thức \`self()\` giải quyết vấn đề gì?`,
      },
```

Viết mỗi bài học **sau khi đọc** đúng các Item đó trong `sources/effective-java/NN-*.md`; chi tiết trong Bẫy/Tự kiểm tra phải có trong sách.

**Script tự kiểm dùng ở Task 3 và 4** — lưu vào scratchpad `ej-roadmap-lint.mjs` (không commit):

```js
// node ej-roadmap-lint.mjs <file.js> <exportName> <tuầnĐầu> <tuầnCuối>
import { pathToFileURL } from "node:url";
const [file, name] = process.argv.slice(2);
const [from, to] = process.argv.slice(4).map(Number);
const weeks = (await import(pathToFileURL(file)))[name];
const CH = [[2,1,9],[3,10,14],[4,15,25],[5,26,33],[6,34,41],[7,42,48],[8,49,56],[9,57,68],[10,69,77],[11,78,84],[12,85,90]];
const chOf = (n) => CH.find(([, a, b]) => n >= a && n <= b)[0];
const errs = [], seen = new Set();
if (weeks.length !== to - from + 1) errs.push(`số tuần ${weeks.length} ≠ ${to - from + 1}`);
weeks.forEach((w, i) => {
  const wn = from + i;
  if (w.id !== `ej-w${wn}`) errs.push(`${w.id} ≠ ej-w${wn}`);
  for (const k of ["week", "title", "goal", "practice"]) if (!w[k]) errs.push(`${w.id} thiếu ${k}`);
  if (w.items.length !== 4) errs.push(`${w.id} có ${w.items.length} mục ≠ 4`);
  w.items.forEach((it, j) => {
    if (it.id !== `ej-w${wn}-${j + 1}`) errs.push(`${it.id} ≠ ej-w${wn}-${j + 1}`);
    const parts = ["**Mục tiêu.**", "**Đọc.**", "**Bẫy.**", "**Tự kiểm tra.**"].map((p) => it.lesson.indexOf(p));
    if (parts.some((p) => p < 0) || parts.some((p, k) => k && p < parts[k - 1])) errs.push(`${it.id} sai khuôn 4 đoạn`);
    for (const m of it.lesson.matchAll(/\[Item (\d+)[^\]]*\]\(#\/docs\/ej-(\d+)\)/g)) {
      const n = +m[1]; seen.add(n);
      if (chOf(n) !== +m[2]) errs.push(`${it.id}: Item ${n} trỏ ej-${m[2]}, đúng là ej-${String(chOf(n)).padStart(2, "0")}`);
    }
  });
});
console.log(`Item được link: ${[...seen].sort((a, b) => a - b).join(",")}`);
console.log(errs.length ? errs.join("\n") : "OK");
process.exit(errs.length ? 1 : 0);
```

---

### Task 3: Lộ trình phần 1 — Tuần 1–5 (chương 2–6, Item 1–41)

**Files:**
- Create: `webapp/js/data/effective-java/roadmap-part1.js` (export `ejWeeksPart1`)

**Interfaces:**
- Consumes: doc id `ej-02`…`ej-06` (Task 2).
- Produces: `export const ejWeeksPart1` — mảng 5 tuần, 20 mục; Task 4 import nó.

- [ ] **Step 1: Tạo script lint trong scratchpad** (nội dung ở mục "Khuôn bài học" phía trên) và chạy trên tệp chưa tồn tại để thấy đỏ:

```bash
node $SCRATCH/ej-roadmap-lint.mjs webapp/js/data/effective-java/roadmap-part1.js ejWeeksPart1 1 5
```

Expected: lỗi `Cannot find module`.

- [ ] **Step 2: Viết `roadmap-part1.js`** — đầu tệp:

```js
// Lộ trình đọc Effective Java — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Effective Java", ấn bản 3 — Joshua Bloch, Addison-Wesley 2018.
// Thư mục nguồn: sources/effective-java/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ej-w<N> / ej-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 10 tuần / 11 chương: T1 ch2 · T2 ch3 · T3 ch4 · T4 ch5 · T5 ch6 ·
// T6 ch7 · T7 ch8 · T8 ch9 · T9 ch10–11 · T10 ch12 + tổng ôn.

export const ejWeeksPart1 = [ /* 5 tuần */ ];
```

Nội dung bắt buộc (tiêu đề tuần và `text` của mục lấy đúng như bảng; Item link đúng chương):

| Tuần | `title` | doc | Mục: `text` — Item |
|---|---|---|---|
| ej-w1 | Tạo đối tượng có chủ đích | ej-02 | 1 "Static factory method và builder — hai cách thay constructor" — 1–2 · 2 "Singleton, class không khởi tạo được và dependency injection" — 3–5 · 3 "Tránh đối tượng thừa và tham chiếu lỗi thời" — 6–7 · 4 "Finalizer, cleaner và try-with-resources" — 8–9 |
| ej-w2 | Hợp đồng của `Object` | ej-03 | 1 "Hợp đồng `equals` — năm tính chất và cách vi phạm" — 10 · 2 "`hashCode` đi kèm `equals`, và `toString` có ích" — 11–12 · 3 "`clone` và vì sao nên tránh nó" — 13 · 4 "`Comparable` và comparator construction method" — 14 |
| ej-w3 | Thiết kế class và interface | ej-04 | 1 "Đóng gói: khả năng truy cập tối thiểu và accessor" — 15–16 · 2 "Class immutable" — 17 · 3 "Composition hơn inheritance, và thiết kế cho kế thừa" — 18–19 · 4 "Interface, default method, tagged class và nested class" — 20–25 |
| ej-w4 | Generics an toàn kiểu | ej-05 | 1 "Raw type và cảnh báo unchecked" — 26–27 · 2 "List hơn mảng, và tự viết generic type" — 28–29 · 3 "Generic method và bounded wildcard (PECS)" — 30–31 · 4 "Generics với varargs, và typesafe heterogeneous container" — 32–33 |
| ej-w5 | Enum và annotation | ej-06 | 1 "Enum thay hằng số `int`, và instance field thay ordinal" — 34–35 · 2 "`EnumSet` và `EnumMap`" — 36–37 · 3 "Enum mở rộng được qua interface" — 38 · 4 "Annotation hơn naming pattern, `@Override` và marker interface" — 39–41 |

`practice` mỗi tuần (viết thành 2–3 câu cụ thể):
- T1: refactor một class có constructor ≥ 4 tham số sang builder; viết `Stack` rò bộ nhớ của Item 7, chứng minh bằng heap dump hoặc `WeakReference`, rồi sửa.
- T2: class chỉ override `equals` không `hashCode`, bỏ vào `HashSet`, viết test cho thấy `contains` trả `false`; sửa; thêm `Comparator.comparingInt(...).thenComparing(...)`.
- T3: viết `InstrumentedHashSet` kế thừa `HashSet` để thấy `addAll` đếm đôi, rồi viết lại bằng wrapper class `ForwardingSet`.
- T4: viết `Stack<E>` generic, rồi `pushAll(Iterable<? extends E>)` / `popAll(Collection<? super E>)`; thử bỏ wildcard để thấy compiler chặn gì.
- T5: thay một nhóm hằng số `int` trong codebase bằng enum có constant-specific method; thay một mảng đánh chỉ số bằng `ordinal()` bằng `EnumMap`.

- [ ] **Step 3: Chạy lint — phải OK và phủ Item 1–41**

```bash
node $SCRATCH/ej-roadmap-lint.mjs webapp/js/data/effective-java/roadmap-part1.js ejWeeksPart1 1 5
```

Expected: `Item được link: 1,2,…,41` (đủ 41 số liên tiếp) và `OK`.

- [ ] **Step 4: CHECK — vẫn xanh** (tệp chưa được import, nhưng cú pháp phải hợp lệ): `node -e "import('./webapp/js/data/effective-java/roadmap-part1.js').then(m=>console.log(m.ejWeeksPart1.length))"` in `5`, rồi CHECK in `57/57`.

- [ ] **Step 5: Commit**

```bash
git add webapp/js/data/effective-java/roadmap-part1.js
git commit -m "feat(effective-java): lộ trình tuần 1–5 — chương 2–6, Item 1–41

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lộ trình phần 2 — Tuần 6–10 (chương 7–12, Item 42–90) + đăng ký track

**Files:**
- Create: `webapp/js/data/effective-java/roadmap-part2.js` (export `ejWeeksPart2`)
- Modify: `webapp/scripts/check-data.mjs` (`EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js` (comment đầu tệp, import, mảng `tracks` — chèn track `ej` ngay sau track `modern-java`)
- Modify: `webapp/js/data/fields.js` (thêm module `"roadmap"`)
- Modify: `webapp/js/data/guides.js` (`trackGuides.ej`)

**Interfaces:**
- Consumes: `ejWeeksPart1` (Task 3).
- Produces: track `{ id: "ej", field: "effective-java" }`, route `#/roadmap/ej`; thêm hai bước guide `ej-2`/`ej-3` trỏ vào nó.

- [ ] **Step 1: Viết `roadmap-part2.js`** — cùng khuôn, đầu tệp như part1 nhưng "Phần 2 (Tuần 6–10)", `export const ejWeeksPart2 = [...]`.

| Tuần | `title` | doc | Mục: `text` — Item |
|---|---|---|---|
| ej-w6 | Lambda và stream đúng mực | ej-07 | 1 "Lambda, method reference và functional interface chuẩn" — 42–44 · 2 "Dùng stream thận trọng, và hàm không side effect" — 45–46 · 3 "`Collection` hơn `Stream` làm kiểu trả về" — 47 · 4 "Song song hoá stream — khi nào nó chậm hơn hoặc sai" — 48 |
| ej-w7 | Thiết kế method | ej-08 | 1 "Kiểm tra tham số và bản sao phòng vệ" — 49–50 · 2 "Chữ ký method, overloading và varargs" — 51–53 · 3 "Collection rỗng thay `null`, và `Optional` thận trọng" — 54–55 · 4 "Doc comment cho API công khai" — 56 |
| ej-w8 | Lập trình tổng quát | ej-09 | 1 "Phạm vi biến, for-each, thư viện, và số thực chính xác" — 57–60 · 2 "Boxed primitive, chuỗi và phép nối chuỗi" — 61–63 · 3 "Interface làm kiểu tham chiếu, reflection và native method" — 64–66 · 4 "Tối ưu hoá thận trọng và quy ước đặt tên" — 67–68 |
| ej-w9 | Exception và concurrency | ej-10, ej-11 | 1 "Exception cho tình huống ngoại lệ: checked, runtime, exception chuẩn" — 69–72 · 2 "Translation, tài liệu hoá, detail message, failure atomicity" — 73–77 · 3 "Đồng bộ hoá dữ liệu chia sẻ và tránh đồng bộ quá mức" — 78–80 · 4 "Tiện ích concurrency, thread safety, lazy init và bộ lập lịch" — 81–84 |
| ej-w10 | Serialization và tổng ôn | ej-12 | 1 "Vì sao tránh Java serialization, và cái giá của `Serializable`" — 85–86 · 2 "Custom serialized form và `readObject` phòng thủ" — 87–88 · 3 "`readResolve`, enum singleton và serialization proxy" — 89–90 · 4 "Tổng ôn 90 Item: bản đồ một trang của riêng bạn" — (không link Item; `**Đọc.**` trỏ lại 11 chương `ej-02`…`ej-12` bằng link chương) |

Mục `ej-w10-4` vẫn đủ 4 đoạn: Mục tiêu (tự viết bản đồ 90 Item theo 11 nhóm, mỗi Item một dòng), Đọc (lướt lại H2 từng chương), Bẫy (học thuộc tiêu đề mà quên ngoại lệ của Item), Tự kiểm tra (3 Item bạn áp dụng thường nhất và 3 Item bạn vừa vi phạm trong codebase).

`practice`:
- T6: viết lại một anonymous `Comparator` thành lambda rồi method reference; viết một pipeline có side effect trong `forEach` rồi sửa bằng collector; đo `parallel()` trên `LongStream.rangeClosed` và trên một stream từ `Stream.iterate` để thấy khác biệt.
- T7: thêm bản sao phòng vệ cho một class nhận `Date`/mảng trong constructor, viết test tấn công ở Item 50; đổi một method trả `null` sang trả collection rỗng.
- T8: tính `1.03 - 0.42` bằng `double` rồi bằng `BigDecimal`; viết vòng lặp `Long sum` và `long sum`, đo bằng JMH hoặc `System.nanoTime`.
- T9: viết `StopThread` của Item 78 (không `volatile`) và chạy để thấy nó không dừng; sửa hai cách; thay một `wait/notify` bằng `CountDownLatch`.
- T10: serialize rồi deserialize một singleton để thấy hai instance; sửa bằng enum; viết serialization proxy cho `Period` của Item 50.

- [ ] **Step 2: Lint part2**

```bash
node $SCRATCH/ej-roadmap-lint.mjs webapp/js/data/effective-java/roadmap-part2.js ejWeeksPart2 6 10
```

Expected: `Item được link: 42,43,…,90` (đủ 49 số liên tiếp) và `OK`. Part1 + part2 phủ đủ 1–90.

- [ ] **Step 3: Thêm kỳ vọng roadmap trước (đỏ)** — dưới `"docs:effective-java": 11,`:

```js
    "roadmap-items:effective-java": 40,
```

- [ ] **Step 4: CHECK — phải đỏ**

Expected: FAIL "Số lượng bản ghi khớp bảng kỳ vọng" (roadmap-items:effective-java 0 ≠ 40).

- [ ] **Step 5: Đăng ký track trong `roadmap.js`**

Import (sau import `jpa`):

```js
import { ejWeeksPart1 } from "./effective-java/roadmap-part1.js";
import { ejWeeksPart2 } from "./effective-java/roadmap-part2.js";
```

Track (chèn ngay sau object track `id: "modern-java"`):

```js
  {
    id: "ej",
    field: "effective-java",
    label: "Effective Java",
    icon: "📘",
    name: "Đọc Effective Java (ấn bản 3)",
    durationWeeks: 10,
    desc: "Kế hoạch đọc 10 tuần phủ đủ 90 Item: mỗi mục nêu mục tiêu, chỉ đúng Item cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: viết Java production được, quen collection, interface, generics; lambda/stream nên học trước ở Modern Java in Action.",
    weeks: [...ejWeeksPart1, ...ejWeeksPart2],
  },
```

Comment đầu tệp: thêm "đọc sách Effective Java," vào câu liệt kê sách; thêm dòng bảng `//   effective-java/roadmap-part{1,2}.js    (Tuần 1–5 / 6–10)       — 40 mục` sau dòng `jpa`; thêm `ej-w1` vào danh sách id tuần và `ej-w1-1` vào danh sách id mục.

- [ ] **Step 6: Bật module** — `fields.js`: `modules: ["dashboard", "guide", "docs", "roadmap"]`, sửa comment thành chỉ còn "interview" bật ở Task 6.

- [ ] **Step 7: `trackGuides.ej`** trong `guides.js` (chèn sau `trackGuides["modern-java"]`):

```js
  ej: {
    rhythm: "10 tuần, 4 mục mỗi tuần, một chương mỗi tuần (tuần 9 gộp chương 10–11); đủ 90 Item. Mỗi mục: mục tiêu, đọc Item nào, bẫy, tự kiểm tra. Đọc (30–45 phút) → gõ ví dụ sai rồi ví dụ đúng → tick.",
    before: ["JDK 17+ và clone `jbloch/effective-java-3e-source-code`.", "Xong Modern Java in Action hoặc tự tin với lambda/stream.", "Chọn một codebase thật làm nơi tìm vi phạm sau mỗi chương."],
    during: ["Mỗi Item: gõ bản sai, chạy thấy hỏng, rồi mới gõ bản đúng.", "Cuối mỗi tuần ghi một vi phạm tìm được trong codebase, kèm số Item.", "Tuần 9 nặng nhất (chương 10–11): chia làm hai nửa tuần nếu cần."],
    after: ["Bản đồ 90 Item một trang của riêng bạn (mục cuối tuần 10).", "Ba comment code review thật dẫn số Item.", "Sang lĩnh vực The Well-Grounded Java Developer — chặng tiếp theo trên con đường Java Backend."],
  },
```

Đồng thời sửa `trackGuides["modern-java"].after`: phần tử cuối `"Đọc Modern Concurrency in Java để tiếp phần bất đồng bộ."` giữ nguyên, **chèn trước nó** `"Sang lĩnh vực Effective Java — chặng tiếp theo trên con đường Java Backend."`.

- [ ] **Step 7b: Thêm hai bước track vào `fieldGuides["effective-java"].steps`** — thay dòng comment `// ej-2, ej-3 …` bằng:

```js
      { id: "ej-2", title: "Tuần 1–5: tạo đối tượng, equals/hashCode, class & interface, generics, enum", desc: "Chương 2–6 — nửa sách định hình cách bạn thiết kế type. Mỗi mục có bẫy và câu tự kiểm tra.", href: "#/roadmap/ej", done: { kind: "track", id: "ej", pct: 50 } },
      { id: "ej-3", title: "Tuần 6–10: lambda & stream, method, lập trình tổng quát, exception, concurrency, serialization", desc: "Chương 7–12 — phần API và độ bền khi chạy thật. Tuần 10 có mục tổng ôn đủ 90 Item.", href: "#/roadmap/ej", done: { kind: "track", id: "ej" } },
```

- [ ] **Step 8: CHECK — phải xanh**

Expected: `57/57 bất biến đạt`. Nếu #3b báo link lạc đường: mọi link trong lộ trình EJ phải là `#/docs/ej-*` hoặc doc thuộc con đường Java Backend.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/effective-java/roadmap-part2.js webapp/scripts/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/guides.js
git commit -m "feat(effective-java): lộ trình tuần 6–10 và bật track ej — 10 tuần / 40 mục, đủ 90 Item

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Khuôn câu hỏi phỏng vấn (dùng cho Task 5 và Task 6)

Hình dạng y hệt `webapp/js/data/spring-security/interview.js` (đọc hết câu `springsec-iq01`…`iq04` trước khi viết). Khoá của mỗi câu:

| Khoá | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| `id`, `field: "effective-java"`, `topic`, `level`, `minutes`, `question`, `mustCover` (≥3, không trùng), `model` (một đoạn văn trả lời mẫu nói ở ngôi thứ nhất), `redFlags` (≥1), `probes` (≥1), `refs` (doc id `ej-*`) | ✓ | ✓ | ✓ | ✓ |
| `code: { lang: "java", text: \`…\` }` | **cấm** | **bắt buộc** | tuỳ chọn | tuỳ chọn |
| `tradeoffs: [{ option, when }, …]` (≥2) | **cấm** | tuỳ chọn | **bắt buộc** | tuỳ chọn |
| `incident: { symptom, scale, constraints }` | **cấm** | **cấm** | tuỳ chọn | **bắt buộc** |
| `minutes` | 3–6 | 4–10 | 5–12 | 8–20 |

IQ7: không câu nào trong `mustCover` (≥12 ký tự) được xuất hiện nguyên văn trong `question`.
Mỗi chủ đề: 4 câu liên tiếp, level 1→2→3→4. Nội dung đáp án phải khớp sách — đọc chương trong `refs` trước khi viết.

Script tự kiểm cho tệp chưa đăng ký — scratchpad `ej-iq-lint.mjs` (không commit):

```js
// node ej-iq-lint.mjs <file.js> <exportName> <idĐầu> <idCuối>
import { pathToFileURL } from "node:url";
const [file, name, a, b] = process.argv.slice(2);
const qs = (await import(pathToFileURL(file)))[name];
const RANGE = { 1: [3, 6], 2: [4, 10], 3: [5, 12], 4: [8, 20] };
const errs = [];
if (qs.length !== b - a + 1) errs.push(`số câu ${qs.length} ≠ ${b - a + 1}`);
qs.forEach((q, i) => {
  const want = `ej-iq${String(+a + i).padStart(2, "0")}`;
  if (q.id !== want) errs.push(`${q.id} ≠ ${want}`);
  if (q.level !== (i % 4) + 1) errs.push(`${q.id} level ${q.level} ≠ ${(i % 4) + 1}`);
  const [lo, hi] = RANGE[q.level] ?? [0, -1];
  if (q.minutes < lo || q.minutes > hi) errs.push(`${q.id} minutes ${q.minutes} ngoài ${lo}–${hi}`);
  if (q.level === 1 && ("code" in q || "tradeoffs" in q || "incident" in q)) errs.push(`${q.id} L1 có artifact`);
  if (q.level === 2 && (!q.code || "incident" in q)) errs.push(`${q.id} L2 sai artifact`);
  if (q.level === 3 && !(q.tradeoffs?.length >= 2)) errs.push(`${q.id} L3 thiếu tradeoffs`);
  if (q.level === 4 && !["symptom", "scale", "constraints"].every((k) => q.incident?.[k])) errs.push(`${q.id} L4 thiếu incident`);
  if (!(q.mustCover?.length >= 3)) errs.push(`${q.id} mustCover < 3`);
  for (const m of q.mustCover ?? []) if (m.length >= 12 && q.question.includes(m)) errs.push(`${q.id} đề lộ rubric`);
  if (!q.refs?.length || q.refs.some((r) => !/^ej-(0[2-9]|1[0-2])$/.test(r))) errs.push(`${q.id} refs sai`);
});
console.log(errs.length ? errs.join("\n") : "OK");
process.exit(errs.length ? 1 : 0);
```

---

### Task 5: Phỏng vấn phần 1 — 12 câu, chủ đề `ej-create`, `ej-object`, `ej-types`

**Files:**
- Create: `webapp/js/data/effective-java/interview-part1.js` (export `ejInterviewPart1`) — tạm thời, Task 6 gộp vào `interview.js`

**Interfaces:**
- Produces: `ejInterviewPart1` — 12 câu `ej-iq01`…`ej-iq12`.

- [ ] **Step 1: Lint trên tệp chưa có — đỏ**

```bash
node $SCRATCH/ej-iq-lint.mjs webapp/js/data/effective-java/interview-part1.js ejInterviewPart1 1 12
```

Expected: `Cannot find module`.

- [ ] **Step 2: Viết 12 câu.** Đề bài và trọng tâm từng câu:

| id | topic | L | Trọng tâm đề (viết lại thành câu hỏi phỏng vấn tự nhiên) | refs |
|---|---|---|---|---|
| ej-iq01 | ej-create | 1 | So sánh static factory method với constructor: ưu và nhược điểm, quy ước đặt tên | ej-02 |
| ej-iq02 | ej-create | 2 | `code`: một class `Stack` tự quản mảng có rò rỉ bộ nhớ (pop không null hoá phần tử) — tìm lỗi, sửa, và giải thích vì sao GC không thu hồi | ej-02 |
| ej-iq03 | ej-create | 3 | `tradeoffs`: builder vs telescoping constructor vs JavaBeans cho class 8 tham số tuỳ chọn cần immutable | ej-02, ej-04 |
| ej-iq04 | ej-create | 4 | `incident`: service rò file descriptor ("Too many open files") sau vài giờ; code đóng stream trong `finally` lồng nhau và dựa vào finalizer của một wrapper | ej-02 |
| ej-iq05 | ej-object | 1 | Năm tính chất của hợp đồng `equals` và vì sao không thể vừa kế thừa class instantiable vừa thêm value component mà giữ được hợp đồng | ej-03 |
| ej-iq06 | ej-object | 2 | `code`: class `PhoneNumber` override `equals` nhưng không `hashCode`, dùng làm key `HashMap` — dự đoán kết quả `get`, sửa, viết `hashCode` đúng | ej-03 |
| ej-iq07 | ej-object | 3 | `tradeoffs`: kế thừa `HashSet` để đếm phần tử thêm vào vs wrapper class (composition) vs thiết kế class cho kế thừa có `@implSpec` | ej-04 |
| ej-iq08 | ej-object | 4 | `incident`: `TreeSet` và `HashSet` chứa cùng dữ liệu cho kích thước khác nhau với `BigDecimal("1.0")`/`"1.00"`; hoặc comparator dùng phép trừ bị tràn số gây sắp xếp sai trong báo cáo | ej-03 |
| ej-iq09 | ej-types | 1 | Vì sao `List<Object>` không nhận được `List<String>`; khác biệt raw type, `List<Object>`, `List<?>` | ej-05 |
| ej-iq10 | ej-types | 2 | `code`: method `pushAll`/`popAll` hoặc `max` không có wildcard không compile với lời gọi hợp lý — sửa theo PECS | ej-05 |
| ej-iq11 | ej-types | 3 | `tradeoffs`: hằng số `int` vs enum vs enum mở rộng qua interface cho bộ opcode mà client cần tự thêm | ej-06 |
| ej-iq12 | ej-types | 4 | `incident`: `ClassCastException` ở production tại dòng không có cast; truy ra `@SuppressWarnings("unchecked")` rộng trên một method dùng generic varargs (heap pollution) | ej-05 |

Đầu tệp:

```js
// Ngân hàng câu hỏi phỏng vấn Effective Java — phần 1 (ej-iq01–ej-iq12).
// Gộp vào interview.js ở Task 6. Hợp đồng theo cấp giống hệt ngân hàng JPA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)

export const ejInterviewPart1 = [
  // ===== ej-create (ej-iq01–ej-iq04) =====
  // …
];
```

- [ ] **Step 3: Lint — OK**

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add webapp/js/data/effective-java/interview-part1.js
git commit -m "feat(effective-java): 12 câu phỏng vấn — tạo đối tượng, equals/hashCode & class, generics & enum

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Phỏng vấn phần 2 — 12 câu còn lại + đăng ký module interview

**Files:**
- Create: `webapp/js/data/effective-java/interview.js` (export `effectiveJavaInterview`, gộp part1 + 12 câu mới)
- Delete: `webapp/js/data/effective-java/interview-part1.js` (nội dung chuyển nguyên vào `interview.js`)
- Modify: `webapp/js/data/meta.js` (`INTERVIEW_TOPICS`, chèn sau khối `ssec-*`)
- Modify: `webapp/js/data/index.js`
- Modify: `webapp/js/data/fields.js` (thêm `"interview"`, xoá comment "mở dần")
- Modify: `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `ejInterviewPart1` (Task 5).
- Produces: `effectiveJavaInterview` — 24 câu.

- [ ] **Step 1: Kỳ vọng trước (đỏ)** — dưới `"roadmap-items:effective-java": 40,`: `"interview:effective-java": 24,`. CHECK → FAIL ở số lượng (0 ≠ 24).

- [ ] **Step 2: Chủ đề trong `meta.js` `INTERVIEW_TOPICS`:**

```js
  "ej-create":  { label: "Tạo và hủy đối tượng",                               short: "Tạo đối tượng", field: "effective-java" },
  "ej-object":  { label: "equals/hashCode/compareTo và thiết kế class",        short: "Object & class", field: "effective-java" },
  "ej-types":   { label: "Generics, enum và annotation",                       short: "Generics/enum", field: "effective-java" },
  "ej-lambda":  { label: "Lambda và stream",                                   short: "Lambda/stream", field: "effective-java" },
  "ej-api":     { label: "Thiết kế method, lập trình tổng quát và exception",  short: "API & lỗi",     field: "effective-java" },
  "ej-conc":    { label: "Concurrency và serialization",                       short: "Concurrency",   field: "effective-java" },
```

- [ ] **Step 3: Viết `interview.js`** — chép nguyên mảng của part1 vào đầu, rồi 12 câu mới:

| id | topic | L | Trọng tâm đề | refs |
|---|---|---|---|---|
| ej-iq13 | ej-lambda | 1 | Khi nào lambda kém hơn anonymous class hoặc method reference; vì sao nên dùng functional interface chuẩn trong `java.util.function` | ej-07 |
| ej-iq14 | ej-lambda | 2 | `code`: pipeline đếm tần suất từ dùng `forEach` cập nhật `HashMap` bên ngoài — viết lại bằng `groupingBy`/`counting`, giải thích vì sao bản cũ sai tinh thần stream | ej-07 |
| ej-iq15 | ej-lambda | 3 | `tradeoffs`: method công khai trả `Stream<T>` vs `Collection<T>` vs `Iterable<T>` | ej-07 |
| ej-iq16 | ej-lambda | 4 | `incident`: thêm `.parallel()` vào pipeline dựa trên `Stream.iterate` + `limit` khiến CPU 100% và job không xong; hoặc parallel stream trên common pool chặn các tác vụ khác | ej-07 |
| ej-iq17 | ej-api | 1 | Checked vs runtime exception: khi nào dùng loại nào, và vì sao lạm dụng checked exception làm API khó dùng | ej-10 |
| ej-iq18 | ej-api | 2 | `code`: class `Period` nhận `Date` start/end, kiểm `start <= end` — chỉ ra hai cách tấn công tính bất biến và sửa bằng bản sao phòng vệ đúng thứ tự (copy trước, kiểm sau) | ej-08 |
| ej-iq19 | ej-api | 3 | `tradeoffs`: trả `null` vs `Optional<T>` vs ném exception vs collection rỗng khi không có kết quả | ej-08, ej-10 |
| ej-iq20 | ej-api | 4 | `incident`: số dư tài khoản lệch vài xu sau đối soát; code tính tiền bằng `double` và so sánh `Integer` bằng `==` | ej-09 |
| ej-iq21 | ej-conc | 1 | Vì sao `synchronized` cần cho cả đọc lẫn ghi; `volatile` bảo đảm gì và không bảo đảm gì | ej-11 |
| ej-iq22 | ej-conc | 2 | `code`: observable set gọi callback của observer bên trong khối `synchronized` — chỉ ra deadlock/`ConcurrentModificationException`, sửa bằng open call hoặc `CopyOnWriteArrayList` | ej-11 |
| ej-iq23 | ej-conc | 3 | `tradeoffs`: khởi tạo thường vs lazy holder class vs double-check idiom cho field đắt | ej-11 |
| ej-iq24 | ej-conc | 4 | `incident`: endpoint nhận object Java serialized bị tấn công từ chối dịch vụ / gadget chain; đội đề xuất vá bằng blacklist class | ej-12 |

Đầu tệp:

```js
// Ngân hàng câu hỏi phỏng vấn Effective Java — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
//
// Nguồn: bản dịch tiếng Việt Effective Java, ấn bản 3 (Joshua Bloch, Addison-Wesley 2018)
// — 11 chương (2–12) trong sources/effective-java/.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA:
//   L1 hiểu lý thuyết (3–6′, không artifact) · L2 đọc/viết code (4–10′, bắt buộc `code`)
//   L3 đánh đổi thiết kế (5–12′, bắt buộc `tradeoffs`) · L4 xử lý sự cố (8–20′, bắt buộc `incident`)
//
// GIỮ NGUYÊN id (ej-iq01–ej-iq24) — tiến độ localStorage lưu theo id này.

export const effectiveJavaInterview = [ /* 24 câu */ ];
```

Rồi `git rm webapp/js/data/effective-java/interview-part1.js`.

- [ ] **Step 4: Lint 24 câu**

```bash
node $SCRATCH/ej-iq-lint.mjs webapp/js/data/effective-java/interview.js effectiveJavaInterview 1 24
```

Expected: `OK`.

- [ ] **Step 5: Đăng ký** — `index.js`: `import { effectiveJavaInterview } from "./effective-java/interview.js";` (sau import `spring-security`), và thêm `...effectiveJavaInterview` vào `allInterviews` ngay sau `...modernJavaInterview`. `fields.js`: `modules: ["dashboard", "guide", "docs", "roadmap", "interview"]`, xoá dòng comment "Mở dần…".

- [ ] **Step 6: CHECK — phải xanh**

Expected: `57/57 bất biến đạt` (IQ1–IQ8 xanh).

- [ ] **Step 7: Commit**

```bash
git add -A webapp/js/data/effective-java webapp/js/data/meta.js webapp/js/data/index.js webapp/js/data/fields.js webapp/scripts/check-data.mjs
git commit -m "feat(effective-java): 24 câu phỏng vấn theo 4 cấp năng lực

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Liên kết chéo, nối Senior Java, cập nhật README

**Files:**
- Modify: `webapp/js/data/related.js`
- Modify: `webapp/js/data/senior-java/roadmap-gd1.js` (dòng ~16, 41–42, 56, 134, 184, 198)
- Modify: `webapp/js/data/guides.js` (`fieldGuides["senior-java"]` dòng ~193; `trackGuides["sj-gd1"].before` dòng ~570)
- Modify: `README.md` (dòng 126), `webapp/README.md` (dòng 4, 17, 20, 21, 25, 84, cây `js/data/` phần interview), `sources/README.md` (nếu Task 1 chưa đủ)

- [ ] **Step 1: `related.js`** — thêm khối trước dấu `};` cuối (các cặp đã xác minh bằng nội dung khi viết spec):

```js
  // ---- Effective Java ↔ Modern Java (lambda, stream, Optional, default method),
  //      JPA (equals/hashCode entity), JCiP (đồng bộ hoá), WGJD (đo hiệu năng), DDIA (encoding) ----
  "ej-03": ["jpa-08", "jpa-10"],                    // hợp đồng equals/hashCode ↔ equality của value type trong Set; entity detached
  "ej-04": ["mjia-13"],                             // Item 21 thiết kế interface cho hậu thế ↔ default method
  "ej-07": ["mjia-03", "mjia-05", "mjia-07"],       // lambda; dùng stream; song song hoá stream
  "ej-08": ["mjia-11"],                             // Item 55 Optional ↔ dùng Optional thay null
  "ej-09": ["wgjd-07"],                             // Item 67 tối ưu thận trọng ↔ hiểu hiệu năng Java, đo trước
  "ej-11": ["jcip-02", "jcip-03", "jcip-05"],       // đồng bộ hoá, visibility, tiện ích concurrency ↔ thread safety, sharing objects, building blocks
  "ej-12": ["ddia-05"],                             // Item 85 tránh Java serialization ↔ encoding và tiến hoá schema
```

- [ ] **Step 2: Nối bài học Senior Java giai đoạn 1** (`senior-java/roadmap-gd1.js`, giữ nguyên id mục; chỉ sửa chuỗi):
  - Dòng ~16 `doneWhen`: `"Effective Java chương 1–3"` → `"Effective Java chương 2–3"`.
  - Dòng ~41 `text`: `"Đọc Effective Java chương 1–3, tự viết lại ví dụ cho từng item"` → `"Đọc Effective Java chương 2–3, tự viết lại ví dụ cho từng item"`.
  - Dòng ~42 `lesson`: `Đọc Effective Java chương 1–3.` → `Đọc Effective Java [chương 2](#/docs/ej-02) và [chương 3](#/docs/ej-03) (chương 1 chỉ là lời giới thiệu, không có Item).`
  - Dòng ~56: `(Item 2 của Effective Java)` → `([Item 2 của Effective Java](#/docs/ej-02))`.
  - Dòng ~134: `Đọc các item Effective Java về equals/hashCode/compareTo.` → `Đọc các item Effective Java về equals/hashCode/compareTo ([chương 3](#/docs/ej-03)).`
  - Dòng ~184: `Đọc phần generics của Effective Java.` → `Đọc phần generics của Effective Java ([chương 5](#/docs/ej-05)).`
  - Dòng ~198: `Đọc phần lambda/stream của Effective Java,` → `Đọc phần lambda/stream của Effective Java ([chương 7](#/docs/ej-07)),`.

  Mở từng dòng bằng Read trước khi Edit — số dòng có thể lệch ±2.

- [ ] **Step 3: Guide Senior Java**
  - `fieldGuides["senior-java"]` method "Mượn lĩnh vực khác của app": `"Giai đoạn 1 mượn Modern Java in Action và Java Scalability;"` → `"Giai đoạn 1 mượn Modern Java in Action, Effective Java và Java Scalability;"`.
  - `trackGuides["sj-gd1"].before`: `"Chuẩn bị Effective Java và Java Concurrency in Practice."` → `"Effective Java và Java Concurrency in Practice đều có sẵn trong app — mở hai lĩnh vực đó song song."`.

- [ ] **Step 4: CHECK — xanh** (R1 kiểm id thật, khác lĩnh vực; #3b cho phép link từ trục Senior Java).

- [ ] **Step 5: Tính số liệu mới rồi cập nhật README**

```bash
node --input-type=module -e '
const {docs}=await import("./webapp/js/data/docs-index.js");
const {tracks}=await import("./webapp/js/data/roadmap.js");
const {allInterviews}=await import("./webapp/js/data/index.js");
const {related}=await import("./webapp/js/data/related.js");
const {FIELDS}=await import("./webapp/js/data/fields.js");
console.log({fields:Object.keys(FIELDS).length, docs:docs.length, tracks:tracks.length,
 items:tracks.flatMap(t=>t.weeks.flatMap(w=>w.items)).length, interview:allInterviews.length,
 iqFields:new Set(allInterviews.map(q=>q.field)).size,
 relatedPairs:Object.values(related).flat().length});'
```

Expected: `fields 15, docs 270, tracks 22, items 1038, interview 312, iqFields 13, relatedPairs 137`. Nếu số nào khác, dùng số in ra (không dùng số trong plan) và ghi chú lệch vào commit.

Thay trong README bằng số vừa in:
- `webapp/README.md` dòng 4: `Mười bốn lĩnh vực` → `Mười lăm lĩnh vực`, chèn `**Effective Java**,` sau `**Modern Java in Action**,`.
- dòng 17: `14 lĩnh vực` → `15 lĩnh vực`; chuỗi con đường chèn `→ Effective Java` sau `Modern Java`.
- dòng 20: `21 track / 998 mục` → số mới.
- dòng 21: `259 tài liệu` và `125 cặp` → số mới.
- dòng 25: `288 câu`, `12 lĩnh vực` → số mới; chèn `Effective Java,` sau `Modern Java in Action,` trong danh sách.
- dòng 84: `14 lĩnh vực` → `15 lĩnh vực`; cây `interview (24 câu/lĩnh vực)` thêm `effective-java ·`.
- `README.md` dòng 126: `14 lĩnh vực` (hai chỗ), `21 giáo trình, 998 mục`, `259 tài liệu` → số mới.

- [ ] **Step 6: Soát chuỗi cũ còn sót**

```bash
grep -rn "chín chặng\|Mười bốn\|14 lĩnh vực\|998 mục\|259 tài liệu\|288 câu\|125 cặp\|Effective Java chương 1" README.md sources/README.md webapp/README.md webapp/js
```

Expected: không dòng nào (trừ nếu `docs/` spec cũ — đã loại khỏi grep).

- [ ] **Step 7: CHECK — xanh**, rồi commit

```bash
git add webapp/js/data/related.js webapp/js/data/senior-java/roadmap-gd1.js webapp/js/data/guides.js README.md webapp/README.md sources/README.md
git commit -m "feat(effective-java): liên kết chéo, nối Senior Java giai đoạn 1, cập nhật README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Kiểm chứng trong app thật

**Files:** không sửa (trừ khi phát hiện lỗi — khi đó sửa ở task sở hữu và commit riêng).

- [ ] **Step 1: Chạy app**

```bash
./webapp/scripts/dev.sh 8888
```

(chạy nền; dừng sau khi kiểm xong)

- [ ] **Step 2: Kiểm từng route** (dùng skill `claude-in-chrome` hoặc `curl` + đọc HTML/JS nếu không có trình duyệt):
  - `http://localhost:8888/#/docs/ej-02` — render chương 2, nhãn "Ch. 2 · Tạo và hủy đối tượng", khối "Đọc liền mạch" **không** hiện ở ej-02 nhưng hiện ở `#/docs/ej-07` (3 chương MJiA).
  - `#/roadmap/ej` — 10 tuần, 40 mục; bấm link Item trong một bài học mở đúng chương.
  - Module phỏng vấn của lĩnh vực Effective Java — 24 câu, 6 chủ đề, lọc theo cấp chạy.
  - Trang Con đường học — Java Backend hiện Effective Java ở vị trí 3/10.
  - Console trình duyệt không có lỗi.

- [ ] **Step 3: CHECK lần cuối và `git status` sạch**

Expected: `57/57 bất biến đạt`; `git status` không có thay đổi chưa commit; thư mục `Effective Java/` không tồn tại.
