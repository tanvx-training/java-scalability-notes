# Spring Start Here — Lĩnh vực mới của DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Spring Start Here* (15 chương + 1 hướng dẫn học) vào web app DevPrep thành lĩnh vực `spring-start`, với module `docs` (16 tài liệu) và `roadmap` (giáo trình đọc 8 tuần / 32 mục).

**Architecture:** DevPrep là web app tĩnh, không build, không dependency. Thêm một lĩnh vực = thêm dữ liệu thuần, không sửa view nào: `fields.js` là nguồn sự thật duy nhất. Nội dung markdown nằm trong repo, `build-content.sh` copy sang `webapp/content/` lúc dev/deploy. Toàn bộ nghiệm thu tự động do `webapp/check-data.mjs` đảm nhiệm.

**Tech Stack:** JavaScript ES modules thuần (không framework, không bundler) · Node.js ≥ 18 để chạy `check-data.mjs` · bash cho `build-content.sh` · python3 `http.server` cho dev.

**Spec:** [`docs/superpowers/specs/2026-09-05-spring-start-integration-design.md`](../specs/2026-09-05-spring-start-integration-design.md)

**Kế hoạch chị em:** [`2026-09-05-kafka-integration.md`](2026-09-05-kafka-integration.md) — lĩnh vực `kafka`, độc lập hoàn toàn, **thứ tự làm không ràng buộc**. Xem Task 8 về số liệu tài liệu.

## Global Constraints

- **Mọi `id` là khoá localStorage lưu tiến độ người dùng — không bao giờ đổi sau khi đã commit.** Áp dụng cho `springstart-00`…`springstart-15`, `sh-w1`…`sh-w8`, `sh-w1-1`…`sh-w8-4`.
- **Tiền tố tuần là `sh-`, KHÔNG phải `ss-`.** `ss-w` đã thuộc lĩnh vực Spring Security. Gõ nhầm `sh-w9` thành `ss-w9` sẽ **không** va chạm id nào (vì `ss-w9` tồn tại nhưng thuộc track khác), nên bất biến "id duy nhất" **không** bắt được. Task 6 có lệnh đếm xác nhận đúng 32 id bắt đầu bằng `sh-w`.
- **Tệp `00` là hướng dẫn học, không phải chương sách, và KHÔNG có PDF.** Lệnh kiểm cặp `.md`/`.pdf` phải trừ nó ra: **15 cặp, không phải 16**.
- **Không viết bất biến mới trong `check-data.mjs`.** Chỉ mở rộng `EXPECTED.counts`.
- **Không copy `.pdf` sang `webapp/content/`.**
- **Không sửa view nào** ngoài một dòng chú thích ở `views/roadmap.js` (Task 8).
- **Không thêm link `#/docs/<id>` xuyên lĩnh vực.** Cám dỗ ở đây lớn nhất trong mọi đợt: sách *Spring Security in Action* chỉ đích danh *"Chương 6 trong Spring Start Here"*. **Vẫn không được** — bất biến #3b cấm, và chip chỉ ở mức track.
- **`grep "Spring Start Here"` sẽ ra hàng chục kết quả hợp lệ.** 7 tệp trong `spring-security-vi/` nhắc tên cuốn này trong văn xuôi (sách cùng tác giả tự giới thiệu sách), cộng bản sao đã build. **Không sửa chúng.** Dùng mẫu có dấu `/` ở Task 1 Step 1 để lọc ra tham chiếu đường dẫn thật.
- **Ngôn ngữ: tiếng Việt.** Thuật ngữ giữ tiếng Anh đúng như bản dịch giữ (bean, context, wiring, scope, aspect, advice, pointcut, starter, autoconfiguration, endpoint, data source, repository…).
- **Khối "Đọc" trỏ anchor vào bản dịch, không chép lại nội dung.** Tên mục trích **nguyên văn** tiêu đề `##`/`###`, **kể cả số mục ở đầu** (vd `3.2 Sử dụng annotation @Autowired để inject bean`).
- **Khối "Bẫy" phải là bẫy NGƯỜI MỚI thật sự vấp** và sách thật sự cảnh báo — bean không được quét, `@Autowired` trên trường so với constructor, proxy tự gọi chính mình mất aspect… **Không nâng lên thành bẫy nâng cao mà sách không bàn.** Đây là sách nhập môn.
- **`practice` mức tuần là bài code cụ thể** bám đúng ví dụ của chương tuần đó.
- **Độ dài mỗi `lesson`: 250–400 từ.** Bốn khối `**Mục tiêu.** / **Đọc.** / **Bẫy.** / **Tự kiểm tra.**`, đúng thứ tự.
- **Mỗi khối tuần phải có trường `goal`.** Thứ tự khoá: `id, week, title, goal, practice, resources, items`.
- **Bản quyền:** sách thương mại Manning. Khuôn: *"sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0"*.
- **Lệnh nghiệm thu duy nhất của repo** (không có test runner nào khác):

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

- **Luôn dán output thật.**

## Ghi chú về thứ tự so với spec §9

Như kế hoạch Kafka: chặng 1 khai `EXPECTED` trước (Task 2 Step 1); chặng 2 dời việc khai `"roadmap-items:spring-start": 32` xuống Task 7, sau khi 8 tuần đã viết xong, để checker không đỏ liên tục suốt 4 task viết nội dung.

## Bảng phân bổ tổng

| Tuần | Chương | Số từ | Ảnh | Mục | Task |
|---|---|---:|---:|---:|---|
| `sh-w1` | 00 + ch.1 | 12.177 | 8 | 4 | Task 3 |
| `sh-w2` | ch.2 | 9.125 | 14 | 4 | Task 3 |
| `sh-w3` | ch.3 + ch.4 | 15.164 | 25 | 4 | Task 4 |
| `sh-w4` | ch.5 + ch.6 | 16.608 | 26 | 4 | Task 4 |
| `sh-w5` | ch.7 + ch.8 | 15.748 | 29 | 4 | Task 5 |
| `sh-w6` | ch.9 + ch.10 | 13.117 | 26 | 4 | Task 5 |
| `sh-w7` | ch.11 + ch.12 | 13.095 | 20 | 4 | Task 6 |
| `sh-w8` | ch.13 + ch.14 + ch.15 | 18.194 | 31 | 4 | Task 6 |

`springStartWeeksPart1` = tuần 1–4 = **16 mục** · `springStartWeeksPart2` = tuần 5–8 = **16 mục** · tổng **32**.
Tổng 113.228 từ / 179 ảnh.

---

# CHẶNG 1 — Lĩnh vực sống, đọc được 16 tài liệu

## Task 1: Chuẩn hoá nguồn sang `spring-start-vi/` và nối vào build

**Files:**
- Rename: `Spring Start Here/` → `spring-start-vi/` (16 `.md`, 15 `.pdf`, `images/ch01`–`ch15` với 179 tệp)
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có.
- Produces: 16 markdown tại `spring-start-vi/NN-slug.md` và 179 ảnh tại `spring-start-vi/images/chNN/`; sau build có mặt tại `webapp/content/springstart/`. Task 2 tham chiếu qua `file: "content/springstart/NN-slug.md"`.

- [ ] **Step 1: Xác nhận không nơi nào tham chiếu ĐƯỜNG DẪN cũ**

```bash
grep -rn "Spring Start Here/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Spring Start Here" .
```

Kỳ vọng: **không dòng nào**.

**Đừng grep không có dấu `/`** — `grep -rn "Spring Start Here"` sẽ ra hàng chục dòng từ 7 tệp trong `spring-security-vi/` nhắc tên cuốn sách trong văn xuôi. Đó là sách cùng tác giả tự giới thiệu sách, **không phải tham chiếu đường dẫn**, và không được sửa.

**Dùng `--exclude-dir`, không dùng `grep -v "^./..."`** — trên máy này `grep -r .` không thêm tiền tố `./`.

- [ ] **Step 2: Đổi tên thư mục**

```bash
git mv "Spring Start Here" spring-start-vi
ls spring-start-vi | head -5
ls spring-start-vi/images | tr '\n' ' '
```

Kỳ vọng: 16 `.md` + 15 `.pdf` + thư mục `images`; và `images` chứa `ch01 ch02 … ch15`.

`images/` đã nằm cùng cấp với các `.md` nên đường dẫn tương đối `images/chNN/...` **không gãy và không được sửa**.

- [ ] **Step 3: Đổi tên 16 tệp markdown sang slug tiếng Việt**

Chép nguyên khối, **không tự gõ lại tên tệp** (tên nguồn có dấu cách và gạch dưới):

```bash
cd spring-start-vi
git mv "00 Hướng dẫn học hiệu quả _ Spring Start Here.md"                                  00-huong-dan-hoc-hieu-qua.md
git mv "1 Spring in the real world _ Spring Start Here.md"                                 01-spring-trong-the-gioi-thuc.md
git mv "2 The Spring context_ Defining beans _ Spring Start Here.md"                       02-spring-context-dinh-nghia-bean.md
git mv "3 The Spring context_ Wiring beans _ Spring Start Here.md"                         03-spring-context-wiring-bean.md
git mv "4 The Spring context_ Using abstractions _ Spring Start Here.md"                   04-spring-context-su-dung-abstraction.md
git mv "5 The Spring context_ Bean scopes and life cycle _ Spring Start Here.md"           05-spring-context-bean-scope-va-vong-doi.md
git mv "6 Using aspects with Spring AOP _ Spring Start Here.md"                            06-su-dung-aspect-voi-spring-aop.md
git mv "7 Understanding Spring Boot and Spring MVC _ Spring Start Here.md"                 07-tim-hieu-spring-boot-va-spring-mvc.md
git mv "8 Implementing web apps with Spring Boot and Spring MVC _ Spring Start Here.md"    08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc.md
git mv "9 Using the Spring web scopes _ Spring Start Here.md"                              09-su-dung-cac-web-scope-cua-spring.md
git mv "10 Implementing REST services _ Spring Start Here.md"                              10-trien-khai-rest-service.md
git mv "11 Consuming REST endpoints _ Spring Start Here.md"                                11-su-dung-cac-rest-endpoint.md
git mv "12 Using data sources in Spring apps _ Spring Start Here.md"                       12-su-dung-data-source-trong-ung-dung-spring.md
git mv "13 Using transactions in Spring apps _ Spring Start Here.md"                       13-su-dung-transaction-trong-ung-dung-spring.md
git mv "14 Implementing data persistence with Spring Data _ Spring Start Here.md"          14-trien-khai-luu-tru-du-lieu-voi-spring-data.md
git mv "15 Testing your Spring app _ Spring Start Here.md"                                 15-kiem-thu-ung-dung-spring.md
cd ..
ls spring-start-vi/*.md | sed 's#.*/##'
```

Kỳ vọng chính xác 16 dòng, từ `00-huong-dan-hoc-hieu-qua.md` tới `15-kiem-thu-ung-dung-spring.md`.

- [ ] **Step 4: Đổi tên 15 tệp PDF theo cùng slug**

```bash
cd spring-start-vi
git mv "1 Spring in the real world _ Spring Start Here.pdf"                                01-spring-trong-the-gioi-thuc.pdf
git mv "2 The Spring context_ Defining beans _ Spring Start Here.pdf"                      02-spring-context-dinh-nghia-bean.pdf
git mv "3 The Spring context_ Wiring beans _ Spring Start Here.pdf"                        03-spring-context-wiring-bean.pdf
git mv "4 The Spring context_ Using abstractions _ Spring Start Here.pdf"                  04-spring-context-su-dung-abstraction.pdf
git mv "5 The Spring context_ Bean scopes and life cycle _ Spring Start Here.pdf"          05-spring-context-bean-scope-va-vong-doi.pdf
git mv "6 Using aspects with Spring AOP _ Spring Start Here.pdf"                           06-su-dung-aspect-voi-spring-aop.pdf
git mv "7 Understanding Spring Boot and Spring MVC _ Spring Start Here.pdf"                07-tim-hieu-spring-boot-va-spring-mvc.pdf
git mv "8 Implementing web apps with Spring Boot and Spring MVC _ Spring Start Here.pdf"   08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc.pdf
git mv "9 Using the Spring web scopes _ Spring Start Here.pdf"                             09-su-dung-cac-web-scope-cua-spring.pdf
git mv "10 Implementing REST services _ Spring Start Here.pdf"                             10-trien-khai-rest-service.pdf
git mv "11 Consuming REST endpoints _ Spring Start Here.pdf"                               11-su-dung-cac-rest-endpoint.pdf
git mv "12 Using data sources in Spring apps _ Spring Start Here.pdf"                      12-su-dung-data-source-trong-ung-dung-spring.pdf
git mv "13 Using transactions in Spring apps _ Spring Start Here.pdf"                      13-su-dung-transaction-trong-ung-dung-spring.pdf
git mv "14 Implementing data persistence with Spring Data _ Spring Start Here.pdf"         14-trien-khai-luu-tru-du-lieu-voi-spring-data.pdf
git mv "15 Testing your Spring app _ Spring Start Here.pdf"                                15-kiem-thu-ung-dung-spring.pdf
cd ..
```

- [ ] **Step 5: Xác nhận 15 cặp `.md`/`.pdf` khớp slug — TRỪ `00`**

```bash
diff <(ls spring-start-vi/*.md  | sed 's#.*/##; s#\.md$##'  | grep -vE '^00-') \
     <(ls spring-start-vi/*.pdf | sed 's#.*/##; s#\.pdf$##') && echo "OK — 15 cặp khớp slug"
```

Kỳ vọng: `OK — 15 cặp khớp slug`.

**`grep -vE '^00-'` là bắt buộc** — tệp `00` là hướng dẫn học do người dịch viết, không có PDF tương ứng. Bỏ bộ lọc đó sẽ báo lỗi giả.

- [ ] **Step 6: Kiểm toàn vẹn ảnh — 179 tệp, 0 gãy, 0 mồ côi**

```bash
cd spring-start-vi
echo "tệp ảnh: $(find images -type f | wc -l | tr -d ' ')"
miss=0
for ref in $(grep -ho '](images/[^)]*)' [0-9][0-9]-*.md | sed 's#](##; s#)##' | sort -u); do
  [ -f "$ref" ] || { echo "THIẾU: $ref"; miss=$((miss+1)); }
done
orph=0
for f in $(find images -type f | sort); do
  grep -qF "$f" [0-9][0-9]-*.md || { echo "MỒ CÔI: $f"; orph=$((orph+1)); }
done
echo "gãy: $miss | mồ côi: $orph"
cd ..
```

Kỳ vọng chính xác: `tệp ảnh: 179` và `gãy: 0 | mồ côi: 0`.

Glob `[0-9][0-9]-*.md` phủ cả 16 tệp (kể cả `00-`) vì mọi tệp đều bắt đầu bằng hai chữ số.

- [ ] **Step 7: Nối vào `build-content.sh`**

Thêm `"$DEST/springstart/images"` vào cuối danh sách của lệnh `mkdir -p`, và **hai** dòng `cp` vào cuối tệp:

```bash
cp    "$REPO"/spring-start-vi/*.md                      "$DEST/springstart/"
cp -R "$REPO"/spring-start-vi/images/.                  "$DEST/springstart/images/"
```

Thư mục đích là `springstart` (một từ), **không phải `springsec`** — đọc kỹ, hai tên rất giống nhau.
Canh cột `"$DEST/..."` khớp các dòng `cp` sẵn có (mở tệp đếm cột).

- [ ] **Step 8: Chạy build và đếm tệp đích**

```bash
./webapp/build-content.sh webapp/content
echo "mục trong content/springstart: $(ls webapp/content/springstart | wc -l | tr -d ' ')"
echo "ảnh đã copy: $(find webapp/content/springstart/images -type f | wc -l | tr -d ' ')"
echo "thư mục ảnh: $(ls webapp/content/springstart/images | tr '\n' ' ')"
```

Kỳ vọng chính xác: `mục trong content/springstart: 17` (16 markdown + thư mục `images`), `ảnh đã copy: 179`, và `thư mục ảnh: ch01 ch02 … ch15`.

- [ ] **Step 9: Chạy checker để xác nhận không hồi quy**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH**.

- [ ] **Step 10: Commit**

```bash
git add -A spring-start-vi webapp/build-content.sh
git commit -m "chore: chuẩn hoá nguồn Spring Start Here thành spring-start-vi/ (16 tệp, 179 ảnh) và nối vào build-content"
```

---

## Task 2: Khai lĩnh vực `spring-start` và 16 tài liệu

**Files:**
- Modify: `webapp/check-data.mjs` (chỉ `EXPECTED.counts`)
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/docs-index.js`

**Interfaces:**
- Consumes: từ Task 1 — 16 tệp tại `webapp/content/springstart/`, 179 ảnh.
- Produces: field id `spring-start`; 16 doc id `springstart-00`…`springstart-15`. Task 3–6 trỏ anchor `#/docs/springstart-NN`. Task 7 bật thêm `roadmap`.

- [ ] **Step 1: Viết bảng kỳ vọng TRƯỚC**

```js
    // Lĩnh vực Spring Start Here — 15 chương + 1 hướng dẫn học (Manning 2021).
    "docs:spring-start": 16,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ** (kỳ vọng 16, thực tế 0). Đây là bước red.

- [ ] **Step 3: Khai lĩnh vực trong `fields.js`**

```js
  "spring-start": {
    label: "Spring Start Here",
    icon: "🌱",
    desc: "Bản dịch tiếng Việt Spring Start Here (Laurențiu Spilcă, Manning 2021) — sách nhập môn Spring: context và bean, wiring, abstraction, bean scope, AOP, Spring Boot và MVC, web scope, REST, data source, transaction, Spring Data và kiểm thử.",
    certFilter: false,
    // Module "roadmap" mở ở Task 7, khi đã có đủ 32 mục lộ trình.
    modules: ["dashboard", "docs"],
    externalRef: { label: "spring.io — Spring Framework", href: "https://spring.io/projects/spring-framework" },
  },
```

Chèn `"spring-start"` vào `FIELD_ORDER` **ngay trước** `"spring-security"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "ddia", "modern-concurrency", "spring-start", "spring-security", "senior-java"];
```

**Nếu lĩnh vực `kafka` đã tồn tại** (kế hoạch chị em chạy trước), nó nằm giữa `"ddia"` và `"modern-concurrency"` — vẫn chèn `"spring-start"` ngay trước `"spring-security"`, không đụng vị trí `kafka`.

- [ ] **Step 4: Cập nhật chú thích đầu `docs-index.js`**

Thêm `spring-start-vi/` vào danh sách thư mục nguồn.

- [ ] **Step 5: Viết 16 bản ghi tài liệu**

Thêm vào cuối mảng `docs`. `desc` dưới đây là bản chốt — dùng nguyên văn:

```js
  // ===== Spring Start Here (Laurențiu Spilcă — Manning, 2021) =====
  // Bản dịch tiếng Việt, thư mục nguồn: spring-start-vi/
  {
    id: "springstart-00",
    field: "spring-start",
    title: "Spring Start 00 — Hướng dẫn học hiệu quả",
    file: "content/springstart/00-huong-dan-hoc-hieu-qua.md",
    icon: "🧭",
    desc: "Bản đồ cuốn sách, thứ tự học gợi ý, quy trình sáu bước cho mỗi chương, và danh sách bẫy mà người mới học Spring hay vấp.",
    tags: ["Hướng dẫn", "Lộ trình", "Checklist"],
  },
  {
    id: "springstart-01",
    field: "spring-start",
    title: "Spring Start 01 — Spring trong thế giới thực",
    file: "content/springstart/01-spring-trong-the-gioi-thuc.md",
    icon: "🌍",
    desc: "Framework giải quyết vấn đề gì, hệ sinh thái Spring gồm những mảnh nào, và khi nào thì KHÔNG nên dùng framework.",
    tags: ["Framework", "Hệ sinh thái", "Khi nào không dùng"],
  },
  {
    id: "springstart-02",
    field: "spring-start",
    title: "Spring Start 02 — Spring context: Định nghĩa bean",
    file: "content/springstart/02-spring-context-dinh-nghia-bean.md",
    icon: "🫘",
    desc: "Spring context là gì, và ba cách đưa một đối tượng vào đó: @Bean, stereotype annotation, và đăng ký theo cách lập trình.",
    tags: ["Context", "@Bean", "@Component"],
  },
  {
    id: "springstart-03",
    field: "spring-start",
    title: "Spring Start 03 — Spring context: Wiring bean",
    file: "content/springstart/03-spring-context-wiring-bean.md",
    icon: "🔌",
    desc: "Cách nối các bean phụ thuộc nhau, ba kiểu @Autowired, circular dependency xảy ra khi nào, và cách chọn khi context có nhiều bean cùng kiểu.",
    tags: ["@Autowired", "Circular dependency", "@Qualifier"],
  },
  {
    id: "springstart-04",
    field: "spring-start",
    title: "Spring Start 04 — Spring context: Sử dụng abstraction",
    file: "content/springstart/04-spring-context-su-dung-abstraction.md",
    icon: "🧩",
    desc: "Dùng interface làm contract, tiêm phụ thuộc qua abstraction, và các stereotype annotation gán trách nhiệm rõ ràng cho từng đối tượng.",
    tags: ["Interface", "DI", "@Service"],
  },
  {
    id: "springstart-05",
    field: "spring-start",
    title: "Spring Start 05 — Spring context: Bean scope và vòng đời",
    file: "content/springstart/05-spring-context-bean-scope-va-vong-doi.md",
    icon: "♻️",
    desc: "Singleton và prototype khác nhau ở đâu, mỗi loại hợp với tình huống nào, và khởi tạo eager so với lazy đổi lấy được gì.",
    tags: ["Singleton", "Prototype", "Lazy"],
  },
  {
    id: "springstart-06",
    field: "spring-start",
    title: "Spring Start 06 — Sử dụng aspect với Spring AOP",
    file: "content/springstart/06-su-dung-aspect-voi-spring-aop.md",
    icon: "🪝",
    desc: "Aspect chặn lời gọi method bằng cách nào, viết một aspect từ đầu, đổi tham số và giá trị trả về, và chuỗi thực thi khi có nhiều aspect.",
    tags: ["AOP", "Aspect", "Proxy"],
  },
  {
    id: "springstart-07",
    field: "spring-start",
    title: "Spring Start 07 — Tìm hiểu Spring Boot và Spring MVC",
    file: "content/springstart/07-tim-hieu-spring-boot-va-spring-mvc.md",
    icon: "🚀",
    desc: "Web app hoạt động ra sao, servlet container làm gì, và ba thứ khiến Spring Boot tiện: initializr, dependency starter, autoconfiguration.",
    tags: ["Spring Boot", "MVC", "Starter"],
  },
  {
    id: "springstart-08",
    field: "spring-start",
    title: "Spring Start 08 — Triển khai ứng dụng web với Spring Boot và Spring MVC",
    file: "content/springstart/08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc.md",
    icon: "🖥️",
    desc: "Trả về view động, nhận dữ liệu từ client qua request parameter và path variable, và dùng GET với POST cho đúng việc.",
    tags: ["View", "@RequestParam", "@PathVariable"],
  },
  {
    id: "springstart-09",
    field: "spring-start",
    title: "Spring Start 09 — Sử dụng các web scope của Spring",
    file: "content/springstart/09-su-dung-cac-web-scope-cua-spring.md",
    icon: "🧴",
    desc: "Ba scope chỉ có trong ứng dụng web — request, session, application — sống bao lâu và hợp với dữ liệu nào.",
    tags: ["Request scope", "Session scope", "Application scope"],
  },
  {
    id: "springstart-10",
    field: "spring-start",
    title: "Spring Start 10 — Triển khai REST service",
    file: "content/springstart/10-trien-khai-rest-service.md",
    icon: "🛰️",
    desc: "REST dùng để trao đổi dữ liệu giữa các ứng dụng ra sao, viết endpoint đầu tiên, kiểm soát HTTP response, và nhận dữ liệu qua request body.",
    tags: ["REST", "@RestController", "ResponseEntity"],
  },
  {
    id: "springstart-11",
    field: "spring-start",
    title: "Spring Start 11 — Sử dụng các REST endpoint",
    file: "content/springstart/11-su-dung-cac-rest-endpoint.md",
    icon: "📞",
    desc: "Ba cách gọi một REST endpoint từ ứng dụng Spring — OpenFeign, RestTemplate, WebClient — và cái nào hợp với hoàn cảnh nào.",
    tags: ["OpenFeign", "RestTemplate", "WebClient"],
  },
  {
    id: "springstart-12",
    field: "spring-start",
    title: "Spring Start 12 — Sử dụng data source trong ứng dụng Spring",
    file: "content/springstart/12-su-dung-data-source-trong-ung-dung-spring.md",
    icon: "🗃️",
    desc: "Data source là gì và vì sao cần nó, dùng JdbcTemplate để đọc ghi dữ liệu, và tuỳ chỉnh cấu hình connection pool.",
    tags: ["DataSource", "JdbcTemplate", "Connection pool"],
  },
  {
    id: "springstart-13",
    field: "spring-start",
    title: "Spring Start 13 — Sử dụng transaction trong ứng dụng Spring",
    file: "content/springstart/13-su-dung-transaction-trong-ung-dung-spring.md",
    icon: "🔒",
    desc: "Transaction là gì, Spring cài đặt nó bằng cơ chế nào, và dùng @Transactional sao cho nó thật sự có tác dụng.",
    tags: ["Transaction", "@Transactional", "Rollback"],
  },
  {
    id: "springstart-14",
    field: "spring-start",
    title: "Spring Start 14 — Triển khai lưu trữ dữ liệu với Spring Data",
    file: "content/springstart/14-trien-khai-luu-tru-du-lieu-voi-spring-data.md",
    icon: "💾",
    desc: "Spring Data bỏ bớt phần code lặp lại thế nào, các interface repository hoạt động ra sao, và Spring Data JDBC qua ví dụ.",
    tags: ["Spring Data", "Repository", "CrudRepository"],
  },
  {
    id: "springstart-15",
    field: "spring-start",
    title: "Spring Start 15 — Kiểm thử ứng dụng Spring",
    file: "content/springstart/15-kiem-thu-ung-dung-spring.md",
    icon: "🧪",
    desc: "Một test được triển khai đúng cách trông thế nào, và khác biệt thật giữa unit test với integration test trong ứng dụng Spring.",
    tags: ["Unit test", "Integration test", "Mock"],
  },
```

- [ ] **Step 6: Chạy nghiệm thu đầy đủ**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ** — `docs:spring-start` = 16, #1, #2 (16 tệp), **#2b (179 ảnh)**, N3, FIELD_ORDER 1-1, #7/#7b.

#2b đỏ nghĩa là `cp -R images` ở Task 1 Step 7 thiếu hoặc chưa build lại.

- [ ] **Step 7: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/fields.js webapp/js/data/docs-index.js
git commit -m "feat: khai lĩnh vực spring-start và 16 tài liệu Spring Start Here"
```

**Bước kiểm bằng mắt do controller làm:** mở `Spring Start 07` (18 ảnh) và `Spring Start 06` (16 ảnh), xác nhận ảnh hiện và mục lục nổi dựng đúng.

---

# CHẶNG 2 — Giáo trình đọc 8 tuần

**Mẫu tham chiếu bắt buộc:** `webapp/js/data/mjia-roadmap-part1.js`. Dấu vân tay giọng văn phải giữ: mỗi **Bẫy** có hai bẫy, bẫy thứ hai mở bằng "Bẫy thứ hai:"; mỗi **Tự kiểm tra** kết bằng đúng hai câu hỏi nối bằng " Và "; khối **Đọc** dùng giọng điều hướng.

## Task 3: Lộ trình tuần 1–2 (8 mục)

**Files:**
- Create: `webapp/js/data/springstart-roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `springstart-00`, `springstart-01`, `springstart-02`.
- Produces: `export const springStartWeeksPart1`. Task 4 nối tuần 3–4 vào **cùng mảng**. Task 7 import tên này.

- [ ] **Step 1: Đọc 3 tệp nguồn**

`spring-start-vi/00-huong-dan-hoc-hieu-qua.md`, `01-spring-trong-the-gioi-thuc.md`, `02-spring-context-dinh-nghia-bean.md`.

- [ ] **Step 2: Tạo tệp với header**

```js
// Lộ trình đọc Spring Start Here — Phần 1 (Tuần 1–4).
//
// Nguồn: bản dịch tiếng Việt "Spring Start Here" (Laurențiu Spilcă — Manning, 2021).
// Thư mục nguồn: spring-start-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Đây là sách NHẬP MÔN: khối "Bẫy" phải là bẫy người mới thật sự vấp.
// GIỮ NGUYÊN id (sh-w<N> / sh-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là sh-, KHÔNG phải ss- (đã thuộc lĩnh vực Spring Security).

export const springStartWeeksPart1 = [
  // … 2 khối tuần ở Step 3–4, thêm 2 khối nữa ở Task 4 …
];
```

- [ ] **Step 3: Viết tuần 1 — `sh-w1`, 4 mục (00 + ch.1)**

`title`: `"Spring là gì, và cách học cuốn sách này"` · `resources` trỏ `#/docs/springstart-00`, `#/docs/springstart-01`, và `{ label: "spring.io — Spring Framework", href: "https://spring.io/projects/spring-framework" }`.

`practice`: Cài JDK 17 trở lên và Maven, chạy `mvn -v` xác nhận cả hai nhận nhau. Rồi làm đúng "Checklist tự kiểm tra theo chương" của hướng dẫn học cho chương 1, và viết ra một đoạn ngắn: dự án bạn đang định làm có rơi vào trường hợp nào mà mục "1.4 Khi nào không nên dùng framework" khuyên đừng dùng framework không.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w1-1` | Sách dành cho ai, bản đồ cuốn sách, và lộ trình gợi ý | 00 §"1. Cuốn sách này dành cho ai và cần chuẩn bị gì" + §"2. Bản đồ cuốn sách và thứ tự học" + §"3. Lộ trình gợi ý" |
| `sh-w1-2` | Quy trình học một chương, và những bẫy người mới hay vấp | 00 §"4. Cách học một chương: quy trình 6 bước" + §"5. Bài tập tự luyện và dự án tổng hợp" + §"6. Checklist tự kiểm tra theo chương" + §"7. Lưu ý về phiên bản khi chạy ví dụ trên Spring mới" + §"8. Những bẫy thường gặp khi mới học Spring" + §"9. Cách dùng bộ bản dịch này" + §"10. Sau khi đọc xong sách" |
| `sh-w1-3` | Vì sao dùng framework, và hệ sinh thái Spring gồm gì | ch.1 §"1.1 Tại sao chúng ta nên dùng framework?" + §"1.2 Hệ sinh thái Spring" |
| `sh-w1-4` | Spring trong tình huống thật, và khi nào KHÔNG nên dùng framework | ch.1 §"1.3 Spring trong các tình huống thực tế" + §"1.4 Khi nào không nên dùng framework" + §"1.5 Bạn sẽ học gì trong cuốn sách này" |

- [ ] **Step 4: Viết tuần 2 — `sh-w2`, 4 mục (ch.2)**

`title`: `"Spring context: định nghĩa bean"` · `resources` trỏ `#/docs/springstart-02`.

`practice`: Tạo project Maven theo mục 2.1, rồi thêm **cùng một** bean `Parrot` bằng cả ba cách của mục 2.2 — `@Bean`, stereotype annotation, và `registerBean()` — mỗi cách trong một class cấu hình riêng. In `context.getBean(Parrot.class)` ở cả ba và so số dòng code phải viết.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w2-1` | Dựng project Maven đầu tiên và tạo Spring context | ch.2 §"2.1 Tạo một project Maven" |
| `sh-w2-2` | Thêm bean bằng annotation @Bean | ch.2 §"2.2.1 Dùng annotation @Bean để thêm bean vào Spring context" |
| `sh-w2-3` | Thêm bean bằng stereotype annotation | ch.2 §"2.2.2 Dùng stereotype annotation để thêm bean vào Spring context" |
| `sh-w2-4` | Thêm bean theo cách lập trình, và chọn cách nào khi nào | ch.2 §"2.2.3 Thêm bean vào Spring context theo cách lập trình" + §"Tóm tắt" |

- [ ] **Step 5: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/springstart-roadmap-part1.js').then(m=>{
  const w=m.springStartWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 2 | mục: 8` và `sh-w1:4 sh-w2:4`

- [ ] **Step 6: Kiểm anchor trỏ tài liệu có thật và cùng lĩnh vực**

```bash
node -e "
import('./webapp/js/data/springstart-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const byId=new Map(docs.map(d=>[d.id,d]));
  const bad=[];
  const scan=(o,s)=>{ for(const x of String(s).matchAll(/#\/docs\/([\w-]+)/g)){
    const d=byId.get(x[1]);
    if(!d) bad.push(o+' → '+x[1]+' (không tồn tại)');
    else if(d.field!=='spring-start') bad.push(o+' → '+x[1]+' (lĩnh vực '+d.field+')');
  }};
  for(const w of m.springStartWeeksPart1){
    for(const r of w.resources??[]) scan(w.id, r.href);
    for(const it of w.items) scan(it.id, it.lesson);
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — mọi anchor hợp lệ và cùng lĩnh vực');
})"
```

Kỳ vọng: `OK`. Nếu ra `(lĩnh vực spring-security)` nghĩa là đã lỡ link sang `springsec-NN` — bất biến #3b sẽ đỏ ở Task 7; sửa ngay.

- [ ] **Step 7: Kiểm độ dài, cấu trúc 4 khối, và tiền tố id**

```bash
node -e "import('./webapp/js/data/springstart-roadmap-part1.js').then(m=>{
  const w=m.springStartWeeksPart1, its=w.flatMap(x=>x.items);
  const len=its.map(i=>[i.id, i.lesson.trim().split(/\s+/).length]);
  const bad=len.filter(([,n])=>n<250||n>400);
  const blocks=its.filter(i=>!/\*\*Mục tiêu\.\*\*[\s\S]*\*\*Đọc\.\*\*[\s\S]*\*\*Bẫy\.\*\*[\s\S]*\*\*Tự kiểm tra\.\*\*/.test(i.lesson));
  const wrongPrefix=[...w.map(x=>x.id), ...its.map(i=>i.id)].filter(id=>!id.startsWith('sh-w'));
  console.log(len.map(([a,b])=>a+':'+b).join(' '));
  console.log(bad.length? 'NGOÀI KHUNG: '+bad.map(([a,b])=>a+'='+b).join(', ') : 'OK — mọi lesson trong khung 250-400 từ');
  console.log(blocks.length? 'SAI CẤU TRÚC: '+blocks.map(i=>i.id).join(', ') : 'OK — mọi lesson đủ 4 khối đúng thứ tự');
  console.log(wrongPrefix.length? 'SAI TIỀN TỐ (phải là sh-w): '+wrongPrefix.join(', ') : 'OK — mọi id dùng tiền tố sh-w');
})"
```

Kỳ vọng: cả ba dòng `OK`.

- [ ] **Step 8: Kiểm tiêu đề mục trích trong "Đọc" có thật trong nguồn**

```bash
node -e "
import('./webapp/js/data/springstart-roadmap-part1.js').then(async m=>{
  const fs=await import('node:fs');
  const map={'springstart-00':'00-huong-dan-hoc-hieu-qua','springstart-01':'01-spring-trong-the-gioi-thuc','springstart-02':'02-spring-context-dinh-nghia-bean'};
  const heads={};
  for(const [id,f] of Object.entries(map))
    heads[id]=new Set(fs.readFileSync('spring-start-vi/'+f+'.md','utf8').split('\n')
      .filter(l=>/^#{2,4} /.test(l)).map(l=>l.replace(/^#{2,4} /,'').trim()));
  const bad=[];
  for(const w of m.springStartWeeksPart1) for(const it of w.items)
    for(const x of it.lesson.matchAll(/\[([^\]]+)\]\(#\/docs\/(springstart-\d\d)\)/g))
      if(heads[x[2]] && !heads[x[2]].has(x[1])) bad.push(it.id+': \"'+x[1]+'\" không có trong '+x[2]);
  console.log(bad.length? 'LỆCH:\n  '+bad.join('\n  ') : 'OK — mọi tiêu đề mục trích đúng nguyên văn');
})"
```

Kỳ vọng: `OK`. Lệch thường do bỏ số mục ở đầu (`Tại sao chúng ta nên dùng framework?` thay vì `1.1 Tại sao chúng ta nên dùng framework?`).

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/springstart-roadmap-part1.js
git commit -m "feat: lộ trình đọc Spring Start Here tuần 1-2 — 8 mục"
```

---

## Task 4: Lộ trình tuần 3–4 (8 mục) — part1 đủ 16 mục

**Files:**
- Modify: `webapp/js/data/springstart-roadmap-part1.js`

**Interfaces:**
- Consumes: `springStartWeeksPart1` từ Task 3; doc id `springstart-03`…`springstart-06`.
- Produces: `springStartWeeksPart1` đủ 4 tuần / **16 mục**.

- [ ] **Step 1: Đọc 4 chương nguồn**

`03-spring-context-wiring-bean.md`, `04-spring-context-su-dung-abstraction.md`, `05-spring-context-bean-scope-va-vong-doi.md`, `06-su-dung-aspect-voi-spring-aop.md`.

- [ ] **Step 2: Viết tuần 3 — `sh-w3`, 4 mục (ch.3 + ch.4)**

Nối vào **cuối** mảng, sau `sh-w2`. `title`: `"Wiring bean và lập trình theo abstraction"` · `resources` trỏ `#/docs/springstart-03` và `#/docs/springstart-04`.

`practice`: Lấy project tuần 2, thêm bean `Person` phụ thuộc `Parrot`. Nối chúng bằng cả ba cách mục 3.2 mô tả (tham số của `@Bean`, `@Autowired` trên trường, `@Autowired` trên constructor). Rồi cố tình tạo circular dependency giữa hai bean để thấy đúng thông báo lỗi mục 3.3 nói tới, và gỡ nó ra. Cuối cùng thêm bean thứ hai cùng kiểu và dùng một cách của mục 3.4 để Spring biết chọn cái nào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w3-1` | Nối bean trong file cấu hình, và ba kiểu @Autowired | ch.3 §"3.1 Triển khai quan hệ giữa các bean được định nghĩa trong file cấu hình" + §"3.2 Sử dụng annotation @Autowired để inject bean" |
| `sh-w3-2` | Circular dependency, và cách chọn giữa nhiều bean cùng kiểu | ch.3 §"3.3 Xử lý circular dependency" + §"3.4 Chọn từ nhiều bean trong Spring context" |
| `sh-w3-3` | Interface làm contract, và tiêm phụ thuộc qua abstraction | ch.4 §"4.1 Dùng interface để định nghĩa contract" + §"4.2 Dùng dependency injection với abstraction" |
| `sh-w3-4` | Stereotype annotation gán trách nhiệm cho từng đối tượng | ch.4 §"4.3 Tập trung vào trách nhiệm của đối tượng với các stereotype annotation" |

- [ ] **Step 3: Viết tuần 4 — `sh-w4`, 4 mục (ch.5 + ch.6)**

`title`: `"Bean scope, vòng đời, và AOP"` · `resources` trỏ `#/docs/springstart-05` và `#/docs/springstart-06`.

`practice`: Đổi một bean sang prototype và in `hashCode()` của hai lần lấy để thấy nó khác singleton. Rồi viết một aspect ghi lại thời gian thực thi theo mục 6.2.1, thêm một aspect thứ hai, và dùng `@Order` để quan sát chuỗi thực thi mà mục 6.3 mô tả đổi thế nào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w4-1` | Singleton scope: cách hoạt động, tình huống thật, eager và lazy | ch.5 §"5.1.1 Singleton bean hoạt động như thế nào" + §"5.1.2 Singleton bean trong các tình huống thực tế" + §"5.1.3 Sử dụng khởi tạo eager và lazy" |
| `sh-w4-2` | Prototype scope và khi nào thật sự cần nó | ch.5 §"5.2.1 Prototype bean hoạt động như thế nào" + §"5.2.2 Prototype bean trong các tình huống thực tế" |
| `sh-w4-3` | Aspect hoạt động thế nào, và viết aspect đầu tiên | ch.6 §"6.1 Cách aspect hoạt động trong Spring" + §"6.2.1 Triển khai một aspect đơn giản" + §"6.2.2 Thay đổi các tham số của method bị chặn và giá trị trả về" |
| `sh-w4-4` | Chặn method theo annotation, các advice khác, và chuỗi thực thi | ch.6 §"6.2.3 Chặn các method được đánh dấu bằng annotation" + §"6.2.4 Các advice annotation khác bạn có thể dùng" + §"6.3 Chuỗi thực thi aspect" |

- [ ] **Step 4: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/springstart-roadmap-part1.js').then(m=>{
  const w=m.springStartWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 4 | mục: 16` và `sh-w1:4 sh-w2:4 sh-w3:4 sh-w4:4`

- [ ] **Step 5: Kiểm anchor, độ dài, cấu trúc, tiền tố, tiêu đề trích**

Chạy lại **nguyên văn** ba lệnh ở Task 3 Step 6, Step 7 và Step 8. **Riêng Step 8 mở rộng bảng `map`** thành đủ 7 tệp của part1:

```js
const map={'springstart-00':'00-huong-dan-hoc-hieu-qua','springstart-01':'01-spring-trong-the-gioi-thuc',
 'springstart-02':'02-spring-context-dinh-nghia-bean','springstart-03':'03-spring-context-wiring-bean',
 'springstart-04':'04-spring-context-su-dung-abstraction','springstart-05':'05-spring-context-bean-scope-va-vong-doi',
 'springstart-06':'06-su-dung-aspect-voi-spring-aop'};
```

Kỳ vọng: tất cả `OK`.

- [ ] **Step 6: Commit**

```bash
git add webapp/js/data/springstart-roadmap-part1.js
git commit -m "feat: lộ trình đọc Spring Start Here tuần 3-4 — part1 đủ 16 mục"
```

---

## Task 5: Lộ trình tuần 5–6 (8 mục)

**Files:**
- Create: `webapp/js/data/springstart-roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `springstart-07`…`springstart-10`.
- Produces: `export const springStartWeeksPart2` — tuần 5–6. Task 6 nối tuần 7–8 vào **cùng mảng**. Task 7 import tên này.

- [ ] **Step 1: Đọc 4 chương nguồn**

`07-tim-hieu-spring-boot-va-spring-mvc.md`, `08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc.md`, `09-su-dung-cac-web-scope-cua-spring.md`, `10-trien-khai-rest-service.md`.

- [ ] **Step 2: Tạo tệp với header**

Giống header Task 3 Step 2, đổi `Phần 1 (Tuần 1–4)` thành `Phần 2 (Tuần 5–8)` và tên export thành `springStartWeeksPart2`.

- [ ] **Step 3: Viết tuần 5 — `sh-w5`, 4 mục (ch.7 + ch.8)**

`title`: `"Spring Boot, Spring MVC và ứng dụng web"` · `resources` trỏ `#/docs/springstart-07`, `#/docs/springstart-08`, và `{ label: "start.spring.io", href: "https://start.spring.io/" }`.

`practice`: Dựng một project Spring Boot từ start.spring.io với dependency starter web (mục 7.2.1 và 7.2.2). Viết một controller trả về view động, rồi thêm một form POST nhận dữ liệu qua `@RequestParam` và một endpoint nhận `@PathVariable`. Cuối cùng xoá dòng khai starter web khỏi `pom.xml` và chạy lại để thấy autoconfiguration ngừng cấu hình những gì.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w5-1` | Web app hoạt động ra sao, và các cách triển khai với Spring | ch.7 §"7.1.1 Tổng quan chung về web app" + §"7.1.2 Các cách khác nhau để triển khai web app với Spring" + §"7.1.3 Sử dụng servlet container trong phát triển web app" |
| `sh-w5-2` | Spring Boot: initializr, dependency starter, autoconfiguration | ch.7 §"7.2.1 Sử dụng dịch vụ khởi tạo dự án để tạo dự án Spring Boot" + §"7.2.2 Sử dụng dependency starter để đơn giản hóa việc quản lý dependency" + §"7.2.3 Sử dụng autoconfiguration theo quy ước dựa trên dependency" |
| `sh-w5-3` | Spring MVC và view động | ch.7 §"7.3 Triển khai web app với Spring MVC" + ch.8 §"8.1.1 Nhận dữ liệu trên HTTP request" |
| `sh-w5-4` | Request parameter, path variable, và GET so với POST | ch.8 §"8.1.2 Dùng request parameter để gửi dữ liệu từ client đến server" + §"8.1.3 Dùng path variable để gửi dữ liệu từ client đến server" + §"8.2 Dùng các HTTP method GET và POST" |

- [ ] **Step 4: Viết tuần 6 — `sh-w6`, 4 mục (ch.9 + ch.10)**

`title`: `"Web scope và REST service"` · `resources` trỏ `#/docs/springstart-09` và `#/docs/springstart-10`.

`practice`: Thêm ba bean vào ứng dụng tuần 5: một request-scoped đếm số lần gọi trong một request, một session-scoped giữ tên người dùng, một application-scoped đếm tổng lượt truy cập. Mở hai trình duyệt khác nhau để thấy ba scope hành xử khác nhau. Rồi chuyển một controller sang `@RestController` và trả JSON.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w6-1` | Request scope: sống bao lâu và hợp với dữ liệu nào | ch.9 §"9.1 Sử dụng request scope trong ứng dụng web Spring" |
| `sh-w6-2` | Session scope và application scope | ch.9 §"9.2 Sử dụng session scope trong ứng dụng web Spring" + §"9.3 Sử dụng application scope trong ứng dụng web Spring" |
| `sh-w6-3` | REST dùng để làm gì, và viết endpoint đầu tiên | ch.10 §"10.1 Dùng REST service để trao đổi dữ liệu giữa các ứng dụng" + §"10.2 Triển khai REST endpoint" |
| `sh-w6-4` | Kiểm soát HTTP response, và nhận dữ liệu qua request body | ch.10 §"10.3 Quản lý HTTP response" + §"10.4 Dùng request body để lấy dữ liệu từ client" |

- [ ] **Step 5: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/springstart-roadmap-part2.js').then(m=>{
  const w=m.springStartWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 2 | mục: 8` và `sh-w5:4 sh-w6:4`

- [ ] **Step 6: Kiểm anchor, độ dài, cấu trúc, tiền tố, tiêu đề trích**

Chạy lại các lệnh Task 3 Step 6–8, **đổi `springstart-roadmap-part1.js` → `part2.js` và `springStartWeeksPart1` → `springStartWeeksPart2`** ở mọi chỗ, và bảng `map` của Step 8 thành:

```js
const map={'springstart-07':'07-tim-hieu-spring-boot-va-spring-mvc',
 'springstart-08':'08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc',
 'springstart-09':'09-su-dung-cac-web-scope-cua-spring','springstart-10':'10-trien-khai-rest-service'};
```

Kỳ vọng: tất cả `OK`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/springstart-roadmap-part2.js
git commit -m "feat: lộ trình đọc Spring Start Here tuần 5-6 — 8 mục"
```

---

## Task 6: Lộ trình tuần 7–8 (8 mục) — part2 đủ 16 mục

**Files:**
- Modify: `webapp/js/data/springstart-roadmap-part2.js`

**Interfaces:**
- Consumes: `springStartWeeksPart2` từ Task 5; doc id `springstart-11`…`springstart-15`.
- Produces: `springStartWeeksPart2` đủ 4 tuần / **16 mục**; tổng toàn track 32.

- [ ] **Step 1: Đọc 5 chương nguồn**

`11-su-dung-cac-rest-endpoint.md`, `12-su-dung-data-source-trong-ung-dung-spring.md`, `13-su-dung-transaction-trong-ung-dung-spring.md`, `14-trien-khai-luu-tru-du-lieu-voi-spring-data.md`, `15-kiem-thu-ung-dung-spring.md`.

- [ ] **Step 2: Viết tuần 7 — `sh-w7`, 4 mục (ch.11 + ch.12)**

Nối vào **cuối** mảng, sau `sh-w6`. `title`: `"Gọi REST endpoint và dùng data source"` · `resources` trỏ `#/docs/springstart-11` và `#/docs/springstart-12`.

`practice`: Viết một ứng dụng thứ hai gọi chính REST endpoint bạn đã viết ở tuần 6, bằng cả ba cách của chương 11 — OpenFeign, `RestTemplate`, `WebClient`. Ghi lại cách nào ít code nhất và cách nào chặn thread. Rồi nối một H2 in-memory data source vào ứng dụng và viết một insert cùng một select bằng `JdbcTemplate`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w7-1` | Gọi REST endpoint bằng Spring Cloud OpenFeign | ch.11 §"11.1 Gọi các REST endpoint bằng Spring Cloud OpenFeign" |
| `sh-w7-2` | RestTemplate và WebClient — ba lựa chọn khác nhau ở đâu | ch.11 §"11.2 Gọi các REST endpoint bằng RestTemplate" + §"11.3 Gọi các REST endpoint bằng WebClient" |
| `sh-w7-3` | Data source là gì, và làm việc với dữ liệu bằng JdbcTemplate | ch.12 §"12.1 Data source là gì" + §"12.2 Dùng JdbcTemplate để làm việc với dữ liệu được lưu trữ" |
| `sh-w7-4` | Tuỳ chỉnh cấu hình của data source | ch.12 §"12.3 Tùy chỉnh cấu hình của data source" |

- [ ] **Step 3: Viết tuần 8 — `sh-w8`, 4 mục (ch.13 + ch.14 + ch.15)**

`title`: `"Transaction, Spring Data và kiểm thử"` · `resources` trỏ `#/docs/springstart-13`, `#/docs/springstart-14`, `#/docs/springstart-15`.

`practice`: Bọc hai lệnh ghi vào một method `@Transactional`, ném exception ở giữa, và xác nhận cả hai bị rollback. Rồi thay `JdbcTemplate` bằng một repository của Spring Data JDBC cho cùng bảng đó. Cuối cùng viết một unit test và một integration test cho **cùng một hành vi**, và ghi lại chúng khác nhau ở chỗ nào — đó chính là điểm mục 15.2 muốn dạy.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `sh-w8-1` | Transaction là gì, và Spring cài đặt nó bằng cơ chế nào | ch.13 §"13.1 Transaction" + §"13.2 Transaction hoạt động như thế nào trong Spring" |
| `sh-w8-2` | Dùng @Transactional trong ứng dụng thật | ch.13 §"13.3 Sử dụng transaction trong ứng dụng Spring" |
| `sh-w8-3` | Spring Data: là gì, hoạt động ra sao, và Spring Data JDBC | ch.14 §"14.1 Spring Data là gì" + §"14.2 Spring Data hoạt động như thế nào" + §"14.3 Sử dụng Spring Data JDBC" |
| `sh-w8-4` | Viết test đúng cách: unit test và integration test | ch.15 §"15.1 Viết test được triển khai đúng cách" + §"15.2.1 Triển khai unit test" + §"15.2.2 Triển khai integration test" |

- [ ] **Step 4: Đếm mục và xác nhận tổng toàn track = 32**

```bash
node -e "Promise.all([
  import('./webapp/js/data/springstart-roadmap-part1.js'),
  import('./webapp/js/data/springstart-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.springStartWeeksPart1, ...b.springStartWeeksPart2];
  const ids=[...w.map(x=>x.id), ...w.flatMap(x=>x.items).map(i=>i.id)];
  console.log('part1:', a.springStartWeeksPart1.flatMap(x=>x.items).length,
              '| part2:', b.springStartWeeksPart2.flatMap(x=>x.items).length,
              '| tổng tuần:', w.length, '| TỔNG MỤC:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
  console.log('id bắt đầu bằng sh-w:', ids.filter(i=>i.startsWith('sh-w')).length, '/', ids.length);
  const bad=ids.filter(i=>!i.startsWith('sh-w'));
  console.log(bad.length? 'SAI TIỀN TỐ: '+bad.join(', ') : 'OK — không id nào lọt sang tiền tố khác');
})"
```

Kỳ vọng chính xác: `part1: 16 | part2: 16 | tổng tuần: 8 | TỔNG MỤC: 32`; chuỗi `sh-w1:4 … sh-w8:4`; `id bắt đầu bằng sh-w: 40 / 40` (8 tuần + 32 mục); và `OK — không id nào lọt sang tiền tố khác`.

Dòng cuối là chốt chặn riêng cho rủi ro gõ nhầm `sh-` thành `ss-` — bất biến "id duy nhất" **không** bắt được lỗi đó.

- [ ] **Step 5: Kiểm anchor, độ dài, cấu trúc, tiêu đề trích**

Chạy lại các lệnh Task 5 Step 6, bảng `map` mở rộng thêm:

```js
'springstart-11':'11-su-dung-cac-rest-endpoint','springstart-12':'12-su-dung-data-source-trong-ung-dung-spring',
'springstart-13':'13-su-dung-transaction-trong-ung-dung-spring','springstart-14':'14-trien-khai-luu-tru-du-lieu-voi-spring-data',
'springstart-15':'15-kiem-thu-ung-dung-spring'
```

Kỳ vọng: tất cả `OK`.

- [ ] **Step 6: Kiểm `practice`, `goal` và thứ tự khoá**

```bash
node -e "Promise.all([
  import('./webapp/js/data/springstart-roadmap-part1.js'),
  import('./webapp/js/data/springstart-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.springStartWeeksPart1,...b.springStartWeeksPart2];
  const noP=w.filter(x=>!x.practice||x.practice.trim().split(/\s+/).length<25);
  const noG=w.filter(x=>!x.goal||!x.goal.trim());
  const keys=w.filter(x=>JSON.stringify(Object.keys(x))!==JSON.stringify(['id','week','title','goal','practice','resources','items']));
  console.log('practice:', w.map(x=>x.id+':'+(x.practice?x.practice.trim().split(/\s+/).length:0)).join(' '));
  console.log(noP.length? 'PRACTICE THIẾU/NGẮN: '+noP.map(x=>x.id).join(', ') : 'OK — 8 tuần đều có practice cụ thể');
  console.log(noG.length? 'THIẾU goal: '+noG.map(x=>x.id).join(', ') : 'OK — 8 tuần đều có goal');
  console.log(keys.length? 'SAI THỨ TỰ KHOÁ: '+keys.map(x=>x.id).join(', ') : 'OK — thứ tự khoá đúng ở cả 8 tuần');
})"
```

Kỳ vọng: cả ba dòng `OK`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/springstart-roadmap-part2.js
git commit -m "feat: lộ trình đọc Spring Start Here tuần 7-8 — đủ 8 tuần / 32 mục"
```

---

## Task 7: Bật module `roadmap`, khai track, thêm hai chip

**Files:**
- Modify: `webapp/check-data.mjs` (`EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/springsec-roadmap-part1.js`
- Modify: `webapp/js/data/senior-java-gd1.js`

**Interfaces:**
- Consumes: `springStartWeeksPart1` (16 mục) và `springStartWeeksPart2` (16 mục).
- Produces: track id `spring-start` — địa chỉ `#/roadmap/spring-start` mà hai chip trỏ tới.

- [ ] **Step 1: Khai bảng kỳ vọng**

```js
    "roadmap-items:spring-start": 32,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ** (kỳ vọng 32, thực tế 0).

- [ ] **Step 3: Ghi lại số mục của hai lĩnh vực sắp bị chạm — TRƯỚC khi sửa**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  for(const f of ['spring-security','senior-java'])
    console.log(f+':', m.tracks.filter(t=>t.field===f).flatMap(t=>t.weeks).flatMap(w=>w.items).length, 'mục');
})"
```

Kỳ vọng: `spring-security: 30 mục` và `senior-java: 276 mục`. Ghi lại — Step 9 phải ra đúng hai con số này.

- [ ] **Step 4: Khai track trong `roadmap.js`**

```js
import { springStartWeeksPart1 } from "./springstart-roadmap-part1.js";
import { springStartWeeksPart2 } from "./springstart-roadmap-part2.js";
```

Thêm khối track vào **cuối** mảng `tracks`:

```js
  {
    id: "spring-start",
    field: "spring-start",
    label: "Spring Start",
    icon: "🌱",
    name: "Đọc Spring Start Here",
    durationWeeks: 8,
    desc: "Kế hoạch đọc 8 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy người mới hay vấp và câu tự kiểm tra; mỗi tuần một bài code.",
    prereq: "Yêu cầu: viết được Java cơ bản (class, interface, annotation) và dựng được một dự án Maven. Không cần biết trước gì về Spring — đây là điểm bắt đầu, và là bước đi trước lĩnh vực Spring Security.",
    weeks: [...springStartWeeksPart1, ...springStartWeeksPart2],
  },
```

Không bọc `withBookRefs`.

Cập nhật chú thích đầu tệp: thêm vào câu liệt kê track, thêm dòng bảng
`//   SSH : springstart-roadmap-part{1,2}.js (Tuần 1–4 / 5–8)   — 32 mục` **canh cột khớp các dòng sẵn có**, và thêm `sh-w1` / `sh-w1-1` vào dòng LƯU Ý id.

- [ ] **Step 5: Bật module `roadmap` cho lĩnh vực `spring-start`**

Trong `fields.js`: xoá dòng chú thích `// Module "roadmap" mở ở Task 7…` và đổi thành `modules: ["dashboard", "docs", "roadmap"],`.

- [ ] **Step 6: Chạy checker để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**, gồm `roadmap-items:spring-start` = 32, tiền tố mục khớp tuần cha, mọi tuần ≥ 1 mục, #3/#3b/#3c.

Nếu #3b đỏ: có link `#/docs/springsec-NN` lọt vào lesson của track `spring-start`, hoặc ngược lại. Sửa **dữ liệu**, không nới bất biến.

- [ ] **Step 7: Thêm chip thứ nhất vào `ss-w1`**

Trong `webapp/js/data/springsec-roadmap-part1.js`, tuần có `id: "ss-w1"` và `title: "Nền tảng bảo mật & dự án đầu tiên"`. Thêm **một** phần tử vào cuối mảng `resources`:

```js
      { label: "🌱 Sang lĩnh vực Spring Start Here — lộ trình đọc 8 tuần", href: "#/roadmap/spring-start" },
```

**Đặt ở `ss-w1` là có chủ đích**, dù sách nhắc Spring Start Here ở chương 6 (đọc ở `ss-w4`) và chương 11 (`ss-w7`) — spec §6.1 giải thích: chip là biển chỉ đường, giá trị cao nhất ở lối vào track nơi người đọc còn kịp quyết định học SSH trước. **Không thêm chip thứ hai vào `ss-w4` hay `ss-w7`.**

**Không sửa `title`, `week`, `goal`, `practice`, hay bất kỳ `item` nào. Không thêm/bớt mục.**

- [ ] **Step 8: Thêm chip thứ hai vào `sj-gd1-w8`**

Trong `webapp/js/data/senior-java-gd1.js`, tuần có `id: "sj-gd1-w8"` và `title: "Spring IoC & AOP — vén màn magic"`. Thêm **một** phần tử vào cuối mảng `resources`:

```js
      { label: "🌱 Sang lĩnh vực Spring Start Here — lộ trình đọc 8 tuần", href: "#/roadmap/spring-start" },
```

Cùng ràng buộc như Step 7. **Lưu ý tuần `sj-gd1-w4` đã có sẵn một chip sang Modern Java in Action** — đó là chip khác, của đợt trước, không đụng tới.

- [ ] **Step 9: Kiểm hồi quy — hai con số KHÔNG được đổi**

Chạy lại **nguyên văn** lệnh ở Step 3.

Kỳ vọng: `spring-security: 30 mục` và `senior-java: 276 mục`.

- [ ] **Step 10: Chạy checker lần cuối**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH**.

- [ ] **Step 11: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/springsec-roadmap-part1.js webapp/js/data/senior-java-gd1.js
git commit -m "feat: bật lộ trình Spring Start Here 8 tuần và nối chip từ Spring Security và Senior Java GĐ1"
```

**Bước kiểm bằng mắt do controller làm:** chọn lĩnh vực Spring Start Here → mở track, xác nhận 8 tuần / 32 checkbox; sang Spring Security tuần 1 và Senior Java GĐ1 tuần 8 xác nhận mỗi nơi có đúng một chip mới, và GĐ1 tuần 4 vẫn giữ nguyên chip MJIA cũ.

---

## Task 8: Cập nhật tài liệu và số liệu

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`
- Modify: `webapp/index.html` (dòng 7)
- Modify: `webapp/js/views/roadmap.js` (dòng 1, chỉ chú thích)

**Interfaces:**
- Consumes: toàn bộ dữ liệu từ Task 1–7.
- Produces: không có mã nào.

- [ ] **Step 1: ĐO số liệu sống — không chép số từ kế hoạch**

Lĩnh vực `kafka` có thể đã được thêm trước hoặc chưa.

```bash
node -e "Promise.all([
  import('./webapp/js/data/docs-index.js'),
  import('./webapp/js/data/roadmap.js'),
  import('./webapp/js/data/fields.js')
]).then(([d,r,f])=>{
  console.log('tài liệu:', d.docs.length);
  console.log('track:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length);
  console.log('lĩnh vực:', f.FIELD_ORDER.length);
  console.log('lĩnh vực có roadmap:', f.FIELD_ORDER.filter(x=>f.FIELDS[x].modules.includes('roadmap')).length);
  console.log('thứ tự lĩnh vực:', f.FIELD_ORDER.join(' → '));
})"
```

Delta của đợt này: **+16 tài liệu · +1 track · +32 mục · +1 lĩnh vực · +1 lĩnh vực có roadmap**.

**"lĩnh vực có roadmap" luôn nhỏ hơn "lĩnh vực" ít nhất 1** vì `java` không khai module `roadmap`. Đó là con số cho `views/roadmap.js`.

- [ ] **Step 2: `webapp/README.md`**

1. Dòng "🗺️ Lộ trình học": số giáo trình và tổng mục theo Step 1; thêm cụm *lộ trình đọc **Spring Start Here** (8 tuần, 32 mục, bám theo 15 chương và một hướng dẫn học)* — **in nghiêng tên sách, không in đậm**; thêm `+ 32 mục đọc Spring Start Here` vào phép cộng.
2. Dòng "📚 Thư viện tài liệu": tổng tài liệu và số lĩnh vực; thêm `16 Spring Start Here` **đúng vị trí theo `thứ tự lĩnh vực` in ra ở Step 1** — ngay **trước** Spring Security.
3. Dòng cây thư mục: `# khai N lĩnh vực`.

Sau khi sửa, **tự cộng lại cả hai phép tính trong ngoặc** và xác nhận bằng đúng tổng đã ghi.

- [ ] **Step 3: `README.md` (gốc repo)**

1. Câu liệt kê: thêm `bản dịch **Spring Start Here**`, cập nhật "cả N lĩnh vực".
2. Bảng thành phần: thêm dòng **ngay trước** dòng `spring-security-vi/`:

```markdown
| [`spring-start-vi/`](./spring-start-vi/) | Bản dịch tiếng Việt *Spring Start Here* (Laurențiu Spilcă, Manning 2021) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 15 chương + 1 hướng dẫn học, 179 hình. Đọc trong app ở lĩnh vực Spring Start Here, kèm lộ trình đọc 8 tuần. |
```

3. Dòng mô tả `webapp/`: thêm Spring Start Here **đúng vị trí `FIELD_ORDER`**; cập nhật số giáo trình / mục / tài liệu.

- [ ] **Step 4: `webapp/index.html` dòng 7**

Thêm `Spring Start Here` vào meta description, **ngay trước** `Spring Security`.

- [ ] **Step 5: `webapp/js/views/roadmap.js` dòng 1**

Cập nhật "N track thuộc M lĩnh vực" — **M là `lĩnh vực có roadmap` in ra ở Step 1**. Thêm Spring Start Here vào câu liệt kê track.

- [ ] **Step 6: Quét sót số liệu cũ**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  console.log('Số ĐÚNG:', m.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length, 'mục |',
              docs.length, 'tài liệu |', m.tracks.length, 'giáo trình');
})"
grep -rn "giáo trình\|tài liệu\|lĩnh vực" README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js | grep -oE '[0-9]+ (giáo trình|tài liệu|lĩnh vực|mục|track)' | sort -u
```

Mọi con số ở dòng thứ hai phải khớp số đo được. Con số lạ là một chỗ chưa cập nhật.

- [ ] **Step 7: Nghiệm thu lần cuối**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  for(const f of ['spring-security','senior-java'])
    console.log(f+':', m.tracks.filter(t=>t.field===f).flatMap(t=>t.weeks).flatMap(w=>w.items).length);
})"
```

Kỳ vọng: checker **XANH toàn bộ**; `spring-security: 30`; `senior-java: 276`. Dán nguyên output.

- [ ] **Step 8: Commit**

```bash
git add README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm lĩnh vực Spring Start Here"
```
