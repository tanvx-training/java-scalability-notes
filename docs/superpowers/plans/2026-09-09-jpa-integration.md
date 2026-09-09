# Tích hợp Java Persistence with Spring Data and Hibernate — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Java Persistence with Spring Data and Hibernate* (đủ 20 chương) vào web app DevPrep thành lĩnh vực thứ 14 `jpa`, kèm thư viện 20 tài liệu và lộ trình đọc 13 tuần / 52 mục.

**Architecture:** DevPrep là SPA vanilla JS không build — dữ liệu học tập là các module ES export mảng object, và `webapp/scripts/check-data.mjs` là bộ 49 bất biến đóng vai trò test suite của toàn bộ dữ liệu. Đợt này thêm một lĩnh vực mới theo đúng khuôn 13 đợt tích hợp sách trước: chuẩn hoá nguồn vào `sources/jpa/`, khai lĩnh vực trong `fields.js`, viết thư viện tài liệu và lộ trình đọc, rồi nối liên kết chéo. Mỗi task kết thúc bằng `check-data.mjs` xanh.

**Tech Stack:** ES modules (không transpile), Node 18+ để chạy `check-data.mjs`, bash cho `build-content.sh`. Không có framework, không có bước build, không có test runner ngoài `check-data.mjs`.

**Spec:** [`docs/superpowers/specs/2026-09-09-jpa-integration-design.md`](../specs/2026-09-09-jpa-integration-design.md)

## Global Constraints

- **Id là khoá localStorage — không bao giờ đổi sau khi commit.** Doc id `jpa-01`…`jpa-20`; week id `jp-w1`…`jp-w13`; item id `jp-w<N>-<M>`.
- **Doc id khớp số chương sách, liền mạch 01–20.** Bản dịch đủ 20 chương, không có lỗ hổng nào.
- **`part` PHẢI là `null` cho cả 20 tài liệu.** Bộ nguồn không có README, không tệp nào chứa chữ "Phần", và hai trang đầu của cả 20 PDF không có trang phân Phần. Điền tên Phần theo trí nhớ về bản in tiếng Anh là **bịa** — spec §1.2 đã đóng cửa này.
- **Không sửa một ký tự nào trong 20 tệp markdown nguồn.** Chỉ đổi tên tệp và di chuyển thư mục.
- **Mọi con số, tên annotation, tên API, tên mục trong lộ trình phải lấy từ bản dịch**, không từ trí nhớ về bản tiếng Anh.
- **Mỗi tuần đúng 4 mục.** 13 tuần × 4 = 52.
- **Sau mỗi task, `node webapp/scripts/check-data.mjs` phải in `49/49 bất biến đạt` (hoặc hơn) và không dòng `✗` nào.**
- **Chạy `build-content.sh` từ gốc repo**, không từ trong `webapp/` — đường dẫn đích là tương đối, chạy sai chỗ sẽ tạo `webapp/webapp/content/`.
- Nguồn: *Java Persistence with Spring Data and Hibernate* — Cătălin Tudose; Manning. **Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.**
- **Chương 18 (Hibernate OGM) giữ nguyên trong docs và lộ trình.** Tính thời sự của Hibernate OGM ghi ở **đúng một chỗ**: một `pitfall` trong `fieldGuides.jpa`. Không ghi vào `desc` của `jpa-18`, không ghi vào `lesson` của mục lộ trình.

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `sources/jpa/*.md` (20) | Bản dịch, đổi tên theo `NN-slug.md` | 1 |
| `sources/jpa/images/chNN/` (127 ảnh) | Ảnh, giữ nguyên bố cục `chNN` có đệm 0 | 1 |
| `sources/jpa/pdf/*.pdf` (20) | PDF gốc, không vào deploy | 1 |
| `sources/jpa/README.md` | Tác giả, bản quyền, phạm vi, mục lục, ghi chú ch.18 | 1 |
| `webapp/js/data/fields.js` | Khai lĩnh vực `jpa` + `FIELD_ORDER` | 2, 9 |
| `webapp/js/data/paths.js` | Chèn `jpa` vào con đường Java Backend (9 chặng) | 2 |
| `webapp/js/data/jpa/docs.js` | 20 bản ghi thư viện tài liệu, `part: null` | 2 |
| `webapp/js/data/docs-index.js` | Nối `jpa/docs.js` vào mảng chung | 2 |
| `webapp/js/data/guides.js` | `fieldGuides.jpa` với steps manual (Task 2); `trackGuides.jpa` + viết lại steps trỏ track (Task 9) | 2, 9 |
| `webapp/js/data/jpa/roadmap-part1.js` | Tuần 1–7, 28 mục | 3, 4, 5 |
| `webapp/js/data/jpa/roadmap-part2.js` | Tuần 8–13, 24 mục | 6, 7, 8 |
| `webapp/js/data/roadmap.js` | Đăng ký track `jpa` | 9 |
| `webapp/js/data/related.js` | 9 khoá liên kết chéo | 10 |
| `webapp/scripts/check-data.mjs` | `EXPECTED.counts` cho `jpa` | 2, 9 |
| `README.md`, `sources/README.md` | Tài liệu repo | 10 |

Không tệp nào khác được sửa. Nếu một task khiến bạn muốn sửa view (`webapp/js/views/`) hay `build-content.sh`, dừng lại — đó là dấu hiệu làm sai khuôn.

### Sáu chặng của spec ↔ mười task của kế hoạch

Spec §8 chia việc thành sáu chặng. Kế hoạch tách nhỏ hơn để mỗi task là một đơn vị review được:

| Chặng (spec §8) | Task |
|---|---|
| 1 — Chuẩn hoá nguồn | 1 |
| 2 — Khai lĩnh vực + thư viện tài liệu | 2 |
| 3 — Hướng dẫn học | **gộp vào 2** |
| 4 — Lộ trình 13 tuần | 3, 4, 5, 6, 7, 8, 9 |
| 5 — Liên kết chéo | 10 (Bước 1) |
| 6 — Tài liệu repo | 10 (Bước 2–3) |

**Vì sao gộp chặng 3 vào Task 2:** bất biến G1 đòi khai module `guide` thì phải có `fieldGuides` và ngược lại, nên hai thứ đó buộc phải cùng một commit. Tách thành hai task chỉ tạo ra một task có đúng một khối object và một task để lại repo ở trạng thái đỏ giữa chừng.

**Vì sao chặng 4 thành bảy task:** đó là 52 mục lộ trình, phần lớn khối lượng viết của cả đợt. Mỗi task viết 2–3 tuần rồi tự kiểm và commit, để lỗi khuôn `lesson` bị bắt sau 8 mục chứ không phải sau 52.

---

## Task 1: Chuẩn hoá nguồn thành `sources/jpa/`

**Files:**
- Move: `Java Persistence with Spring Data and Hibernate/` → `sources/jpa/` (nội dung `vi/` nâng lên một cấp)
- Create: `sources/jpa/README.md`

**Interfaces:**
- Consumes: không gì (task đầu tiên).
- Produces: 20 tệp `sources/jpa/NN-slug.md` mà Task 2 trỏ tới qua `file: "content/jpa/NN-slug.md"`; 127 ảnh ở `sources/jpa/images/chNN/`.

- [ ] **Bước 1: Xác nhận không ai tham chiếu đường dẫn cũ**

```bash
grep -rn "Java Persistence with Spring Data and Hibernate/" --exclude-dir=.git --exclude-dir=docs --exclude-dir=content --exclude-dir="Java Persistence with Spring Data and Hibernate" .
```

Kỳ vọng: **không dòng nào**. Dấu `/` cuối mẫu chỉ bắt tham chiếu đường dẫn, không bắt tên sách trong văn xuôi. Loại trừ `content/` vì đó là ảnh gương do `build-content.sh` sinh, và `docs/` vì spec nhắc tên thư mục cũ. Nếu có dòng nào ngoài các thư mục đã loại trừ, dừng và báo.

- [ ] **Bước 2: Tạo thư mục và di chuyển 20 tệp markdown**

Tên nguồn có **chữ hoa**; tên đích **chữ thường**. Mọi cặp tên đều khác nhau nhiều hơn chỉ hoa/thường nên `git mv` an toàn trên macOS.

```bash
mkdir -p sources/jpa/pdf
B="Java Persistence with Spring Data and Hibernate/vi"
git mv "$B/Chuong-01-Tim-hieu-ve-object-relational-persistence.md" sources/jpa/01-tim-hieu-object-relational-persistence.md
git mv "$B/Chuong-02-Bat-dau-mot-du-an.md"                          sources/jpa/02-bat-dau-mot-du-an.md
git mv "$B/Chuong-03-Domain-model-va-metadata.md"                   sources/jpa/03-domain-model-va-metadata.md
git mv "$B/Chuong-04-Lam-viec-voi-Spring-Data-JPA.md"               sources/jpa/04-lam-viec-voi-spring-data-jpa.md
git mv "$B/Chuong-05-Anh-xa-cac-persistent-class.md"                sources/jpa/05-anh-xa-cac-persistent-class.md
git mv "$B/Chuong-06-Anh-xa-value-type.md"                          sources/jpa/06-anh-xa-value-type.md
git mv "$B/Chuong-07-Anh-xa-inheritance.md"                         sources/jpa/07-anh-xa-inheritance.md
git mv "$B/Chuong-08-Anh-xa-collection-va-entity-association.md"    sources/jpa/08-anh-xa-collection-va-entity-association.md
git mv "$B/Chuong-09-Anh-xa-entity-association-nang-cao.md"         sources/jpa/09-anh-xa-entity-association-nang-cao.md
git mv "$B/Chuong-10-Quan-ly-du-lieu.md"                            sources/jpa/10-quan-ly-du-lieu.md
git mv "$B/Chuong-11-Transaction-va-concurrency.md"                 sources/jpa/11-transaction-va-concurrency.md
git mv "$B/Chuong-12-Fetch-plan-strategy-va-profile.md"             sources/jpa/12-fetch-plan-strategy-va-profile.md
git mv "$B/Chuong-13-Loc-du-lieu.md"                                sources/jpa/13-loc-du-lieu.md
git mv "$B/Chuong-14-Tich-hop-JPA-va-Hibernate-voi-Spring.md"       sources/jpa/14-tich-hop-jpa-va-hibernate-voi-spring.md
git mv "$B/Chuong-15-Lam-viec-voi-Spring-Data-JDBC.md"              sources/jpa/15-lam-viec-voi-spring-data-jdbc.md
git mv "$B/Chuong-16-Lam-viec-voi-Spring-Data-REST.md"              sources/jpa/16-lam-viec-voi-spring-data-rest.md
git mv "$B/Chuong-17-Lam-viec-voi-Spring-Data-MongoDB.md"           sources/jpa/17-lam-viec-voi-spring-data-mongodb.md
git mv "$B/Chuong-18-Lam-viec-voi-Hibernate-OGM.md"                 sources/jpa/18-lam-viec-voi-hibernate-ogm.md
git mv "$B/Chuong-19-Truy-van-JPA-voi-Querydsl.md"                  sources/jpa/19-truy-van-jpa-voi-querydsl.md
git mv "$B/Chuong-20-Kiem-thu-ung-dung-Java-persistence.md"         sources/jpa/20-kiem-thu-ung-dung-java-persistence.md
```

- [ ] **Bước 3: Di chuyển thư mục ảnh**

```bash
git mv "Java Persistence with Spring Data and Hibernate/vi/images" sources/jpa/images
```

Thư mục `images/` chứa 20 thư mục con `ch01`…`ch20`. **Không đổi tên chúng** — 127 tham chiếu trong markdown là tương đối và trỏ thẳng vào `images/chNN/`.

- [ ] **Bước 4: Di chuyển 20 PDF, ghép theo SỐ CHƯƠNG**

Tên PDF gốc là **tiếng Anh**, chương một chữ số **không** đệm 0 và **không** có dấu chấm sau số. `ls` xếp `10 Managing data` ngay sau `1 Understanding` — ghép theo **số chương**, không theo thứ tự sắp xếp chuỗi.

```bash
S="Java Persistence with Spring Data and Hibernate"
T="_ Java Persistence with Spring Data and Hibernate.pdf"
git mv "$S/1 Understanding object_relational persistence $T"     sources/jpa/pdf/01-tim-hieu-object-relational-persistence.pdf
git mv "$S/2 Starting a project $T"                              sources/jpa/pdf/02-bat-dau-mot-du-an.pdf
git mv "$S/3 Domain models and metadata $T"                      sources/jpa/pdf/03-domain-model-va-metadata.pdf
git mv "$S/4 Working with Spring Data JPA $T"                    sources/jpa/pdf/04-lam-viec-voi-spring-data-jpa.pdf
git mv "$S/5 Mapping persistent classes $T"                      sources/jpa/pdf/05-anh-xa-cac-persistent-class.pdf
git mv "$S/6 Mapping value types $T"                             sources/jpa/pdf/06-anh-xa-value-type.pdf
git mv "$S/7 Mapping inheritance $T"                             sources/jpa/pdf/07-anh-xa-inheritance.pdf
git mv "$S/8 Mapping collections and entity associations $T"     sources/jpa/pdf/08-anh-xa-collection-va-entity-association.pdf
git mv "$S/9 Advanced entity association mappings $T"            sources/jpa/pdf/09-anh-xa-entity-association-nang-cao.pdf
git mv "$S/10 Managing data $T"                                  sources/jpa/pdf/10-quan-ly-du-lieu.pdf
git mv "$S/11 Transactions and concurrency $T"                   sources/jpa/pdf/11-transaction-va-concurrency.pdf
git mv "$S/12 Fetch plans, strategies, and profiles $T"          sources/jpa/pdf/12-fetch-plan-strategy-va-profile.pdf
git mv "$S/13 Filtering data $T"                                 sources/jpa/pdf/13-loc-du-lieu.pdf
git mv "$S/14 Integrating JPA and Hibernate with Spring $T"      sources/jpa/pdf/14-tich-hop-jpa-va-hibernate-voi-spring.pdf
git mv "$S/15 Working with Spring Data JDBC $T"                  sources/jpa/pdf/15-lam-viec-voi-spring-data-jdbc.pdf
git mv "$S/16 Working with Spring Data REST $T"                  sources/jpa/pdf/16-lam-viec-voi-spring-data-rest.pdf
git mv "$S/17 Working with Spring Data MongoDB $T"               sources/jpa/pdf/17-lam-viec-voi-spring-data-mongodb.pdf
git mv "$S/18 Working with Hibernate OGM $T"                     sources/jpa/pdf/18-lam-viec-voi-hibernate-ogm.pdf
git mv "$S/19 Querying JPA with Querydsl $T"                     sources/jpa/pdf/19-truy-van-jpa-voi-querydsl.pdf
git mv "$S/20 Testing Java persistence applications $T"          sources/jpa/pdf/20-kiem-thu-ung-dung-java-persistence.pdf
```

**Kiểm ghép đúng** — số chương trong tên PDF phải khớp số chương trong tên markdown cùng slug:

```bash
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20; do
  md=$(ls sources/jpa/$i-*.md 2>/dev/null | head -1)
  pdf=$(ls sources/jpa/pdf/$i-*.pdf 2>/dev/null | head -1)
  [ "$(basename "$md" .md)" = "$(basename "$pdf" .pdf)" ] || echo "LỆCH $i: $md ↔ $pdf"
done; echo "kiểm xong"
```

Kỳ vọng: chỉ dòng `kiểm xong`.

- [ ] **Bước 5: Xác nhận thư mục cũ đã biến mất và bố cục mới đúng**

```bash
ls "Java Persistence with Spring Data and Hibernate" 2>&1 | head -3
echo "md: $(ls sources/jpa/*.md | wc -l)  pdf: $(ls sources/jpa/pdf/*.pdf | wc -l)  img: $(find sources/jpa/images -type f | wc -l)"
```

Kỳ vọng: thư mục cũ báo "No such file or directory", và `md: 20  pdf: 20  img: 127`.

- [ ] **Bước 6: Kiểm toàn vẹn ảnh — 127 tham chiếu, 0 gãy, 0 mồ côi**

```bash
cd sources/jpa
grep -ohE '!\[[^]]*\]\(images/[^)]+\)' *.md | sed -E 's/.*\((images\/[^)]+)\)/\1/' | sort -u > /tmp/jpa-refs.txt
find images -type f | sort > /tmp/jpa-files.txt
echo "refs: $(wc -l < /tmp/jpa-refs.txt)  files: $(wc -l < /tmp/jpa-files.txt)"
echo "--- gãy (ref không có tệp) ---"; comm -23 /tmp/jpa-refs.txt /tmp/jpa-files.txt
echo "--- mồ côi (tệp không ai trỏ) ---"; comm -13 /tmp/jpa-refs.txt /tmp/jpa-files.txt
cd ../..
```

Kỳ vọng: `refs: 127  files: 127`, hai danh sách rỗng. Dùng đúng mẫu markdown `!\[…\]\(images/…\)`; mẫu tham lam kiểu `images/[^)]*` sẽ bắt cả đường dẫn nhắc trong backtick và cho ra "ảnh gãy" giả.

- [ ] **Bước 7: Xác nhận mỗi tệp có đúng một H1 thật**

`grep -c '^# '` trên ch.4, 15, 16, 17 và 20 trả về số lớn hơn 1, nhưng mọi dòng thừa là chú thích listing của Manning (`# Ⓐ`, `# Ⓑ`…) **nằm trong khối mã**. Đếm có nhận biết hàng rào:

```bash
for f in sources/jpa/*.md; do
  n=$(awk '/^```/{fence=!fence; next} !fence && /^# /{c++} END{print c+0}' "$f")
  [ "$n" = "1" ] || echo "SAI $f có $n H1 thật"
done; echo "kiểm xong"
```

Kỳ vọng: chỉ dòng `kiểm xong`. **Không** đi "chuẩn hoá tiêu đề" các dòng `#` trong khối mã.

- [ ] **Bước 8: Viết `sources/jpa/README.md`**

Khác các nguồn khác, ở đây **không có README của người dịch để giữ lại** — viết mới hoàn toàn. Theo khuôn `sources/ocnj/README.md` (đọc tệp đó trước để bám cấu trúc), gồm:

- Tiêu đề và một đoạn mở: tên sách, tác giả **Cătălin Tudose**, nhà xuất bản **Manning**.
- Một dòng in đậm: **sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0**.
- Phạm vi: **đủ 20 chương**, 178.653 từ, 127 ảnh trong `images/chNN/`, PDF gốc trong `pdf/` và **không** vào bản deploy hay image Docker.
- Mục lục 20 chương: cột số chương, tên tệp `NN-slug.md`, tiêu đề chương (lấy nguyên dòng H1). **Không** chia Phần — bộ nguồn không có bằng chứng nào về tên Phần.
- Một mục ngắn "Ghi chú": chương 18 dạy Hibernate OGM, một dự án không còn được phát triển tích cực và không theo kịp Jakarta EE; giữ chương trong bộ tài liệu để hiểu ý tưởng mở rộng khả chuyển của JPA sang NoSQL, không phải để dựng hệ thống mới.

Lấy 20 dòng H1 để chép vào mục lục:

```bash
for f in sources/jpa/*.md; do echo "$(basename $f): $(head -1 $f)"; done
```

- [ ] **Bước 9: Chạy build-content và kiểm dữ liệu — phải vẫn xanh**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Chưa lĩnh vực nào trỏ tới `content/jpa/` nên số đếm không đổi — nếu đỏ, lỗi nằm ở chỗ khác.

- [ ] **Bước 10: Commit**

```bash
git add -A
git commit -m "feat(jpa): chuẩn hoá nguồn Java Persistence with Spring Data and Hibernate

20 chương bản dịch từ thư mục gốc vào sources/jpa/ theo quy ước NN-slug.md,
20 PDF vào pdf/ ghép theo số chương (tên gốc tiếng Anh không đệm 0 nên thứ
tự chuỗi khác thứ tự chương), 127 ảnh giữ nguyên bố cục images/chNN/.

Toàn vẹn ảnh: 127 tệp, 127 tham chiếu, 0 gãy, 0 mồ côi. Mỗi tệp đúng một H1
thật — các dòng # thừa ở ch.4, 15, 16, 17, 20 là chú thích listing trong
khối mã.

README nguồn viết mới: tác giả Cătălin Tudose, Manning, bản quyền thương mại.
Không chia Phần vì bộ nguồn không có bằng chứng tên Phần.

Chưa lĩnh vực nào trỏ tới content/jpa/ — app chưa đổi."
```

---

## Task 2: Khai lĩnh vực `jpa` và thư viện 20 tài liệu

**Files:**
- Modify: `webapp/js/data/fields.js`, `webapp/js/data/paths.js`, `webapp/js/data/docs-index.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`
- Create: `webapp/js/data/jpa/docs.js`

**Interfaces:**
- Consumes: 20 tệp `sources/jpa/NN-slug.md` từ Task 1.
- Produces: `FIELDS.jpa`; doc id `jpa-01`…`jpa-20` mà Task 3–8 trỏ tới qua `#/docs/jpa-NN` và Task 10 dùng làm khoá trong `related.js`.

Năm thay đổi dưới đây phải **cùng một commit**: bất biến #7 chặn khai module `docs` khi chưa có dữ liệu, #7b chặn có dữ liệu mà chưa khai module, P1 chặn lĩnh vực không nằm trên con đường nào.

- [ ] **Bước 1: Khai lĩnh vực trong `fields.js`**

Thêm khối `jpa` **ngay sau khối `ocnj`** (khối cuối trước dấu `};`):

```js
  jpa: {
    label: "Java Persistence with Spring Data and Hibernate",
    icon: "🗃️",
    short: "JPA",
    unit: "Ch.",
    desc: "Bản dịch tiếng Việt Java Persistence with Spring Data and Hibernate (Cătălin Tudose — Manning) — đủ 20 chương: object/relational paradigm mismatch và vai trò của ORM, dựng dự án với JPA thuần, Hibernate native và Spring Data JPA, domain model và metadata, query method và projection, ánh xạ persistent class, value type, inheritance, collection và entity association, vòng đời persistence và EntityManager, transaction và điều khiển đồng thời, fetch plan và fetch profile, cascade, Envers và data filter, tích hợp với Spring theo mẫu DAO, Spring Data JDBC, Spring Data REST, Spring Data MongoDB, Hibernate OGM, Querydsl, và kiểm thử tầng persistence bằng Spring TestContext.",
    certFilter: false,
    // Module roadmap mở ở Task 9, khi đã có dữ liệu lộ trình — bất biến #7.
    modules: ["dashboard", "guide", "docs"],
    externalRef: { label: "hibernate.org — ORM documentation", href: "https://hibernate.org/orm/documentation/" },
  },
```

Rồi chèn `"jpa"` vào `FIELD_ORDER` ngay sau `"ocnj"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "wgjd", "jcip", "ocnj", "jpa", "ddia", "kafka", "modern-concurrency", "spring-start", "spring-security", "senior-java"];
```

- [ ] **Bước 2: Chèn `jpa` vào con đường Java Backend trong `paths.js`**

Hai sửa đổi trong khối `PATHS.java`:

```js
    desc: "Một nghề, chín chặng: Spring cơ bản → Java hiện đại → xuống dưới nắp JVM (bytecode, JMM, build, container) → nền concurrency cổ điển (thread safety, lock, AQS, JMM) → đo và tối ưu trên cloud (GC, JIT, observability, profiling) → persistence (ánh xạ, persistence context, transaction, fetch) → khả năng mở rộng trên Tomcat → concurrency sau Loom → bảo mật. Lập trình hệ thống là nền tuỳ chọn cho ai muốn hiểu tới tầng kernel.",
    fields: ["spring-start", "modern-java", "wgjd", "jcip", "ocnj", "jpa", "java", "modern-concurrency", "spring-security"],
```

Chỉ đổi `desc` và `fields`; `label`, `icon`, `foundation` giữ nguyên.

- [ ] **Bước 3: Viết `webapp/js/data/jpa/docs.js`**

```js
// Tài liệu lĩnh vực "Java Persistence with Spring Data and Hibernate" — 20 tài liệu.
// Nguồn markdown: sources/jpa/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/jpa/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` giữ ĐÚNG số chương sách: 1–20, liền mạch, bản dịch đủ chương.
// `part` là null cho CẢ 20: bộ nguồn không có README, không tệp nào chứa chữ
// "Phần", và PDF tách theo chương nên không có trang phân Phần. Điền tên Phần
// theo trí nhớ về bản in tiếng Anh là bịa — giống cách wgjd và jcip xử lý.

export const docs = [
  {
    id: "jpa-01",
    field: "jpa",
    chapter: 1,
    part: null,
    title: "Tìm hiểu về object/relational persistence",
    file: "content/jpa/01-tim-hieu-object-relational-persistence.md",
    icon: "🧩",
    desc: "Vì sao một ứng dụng hướng đối tượng và một SQL database không khớp nhau, và ORM giải quyết điều đó thế nào. Persistence là gì, quan hệ giữa SQL, JDBC và Java, rồi năm mặt của paradigm mismatch — granularity, inheritance, identity, association và data navigation — trước khi giới thiệu vai trò của JPA, Hibernate và Spring Data.",
    tags: ["ORM", "Paradigm mismatch", "JPA"],
  },
  {
    id: "jpa-02",
    field: "jpa",
    chapter: 2,
    part: null,
    title: "Bắt đầu một dự án",
    file: "content/jpa/02-bat-dau-mot-du-an.md",
    icon: "👋",
    desc: "Cùng một ví dụ \"Hello World\" viết bằng ba cách để thấy rõ chúng khác nhau ở đâu: JPA thuần với persistence unit, cấu hình native của Hibernate, và Spring Data JPA. Kèm cách chuyển đổi qua lại giữa JPA và Hibernate, và một mục so sánh thẳng ba cách tiếp cận lưu trữ entity.",
    tags: ["Hello World", "Persistence unit", "Spring Data"],
  },
  {
    id: "jpa-03",
    field: "jpa",
    chapter: 3,
    part: null,
    title: "Domain model và metadata",
    file: "content/jpa/03-domain-model-va-metadata.md",
    icon: "🏛️",
    desc: "Ứng dụng ví dụ CaveatEmptor xuyên suốt cả cuốn sách: kiến trúc phân tầng, phân tích miền nghiệp vụ và domain model. Rồi cách hiện thực nó thành POJO có khả năng persistence — xử lý rò rỉ mối quan tâm, persistence trong suốt, hiện thực association — và ba cách khai metadata: annotation, constraint Bean Validation, và file XML, cộng cách đọc metadata lúc chạy.",
    tags: ["CaveatEmptor", "POJO", "Metadata"],
  },
  {
    id: "jpa-04",
    field: "jpa",
    chapter: 4,
    part: null,
    title: "Làm việc với Spring Data JPA",
    file: "content/jpa/04-lam-viec-voi-spring-data-jpa.md",
    icon: "🔍",
    desc: "Repository của Spring Data JPA từ đầu tới hết: dựng dự án, cấu hình, rồi bảy cách lấy dữ liệu ra — query method suy từ tên, giới hạn và sắp xếp và phân trang, streaming kết quả, annotation @Query, projection, truy vấn sửa đổi, và Query by Example.",
    tags: ["Repository", "@Query", "Projection"],
  },
  {
    id: "jpa-05",
    field: "jpa",
    chapter: 5,
    part: null,
    title: "Ánh xạ các persistent class",
    file: "content/jpa/05-anh-xa-cac-persistent-class.md",
    icon: "🆔",
    desc: "Ranh giới quan trọng nhất của mọi domain model: cái gì là entity và cái gì là value type. Kèm identity và equality trong Java so với trong database, cách chọn primary key, năm chiến lược sinh định danh và cách cấu hình generator, rồi các tuỳ chọn ánh xạ entity như điều khiển tên, sinh SQL động, entity bất biến và ánh xạ tới subselect.",
    tags: ["Entity", "Identity", "Primary key"],
  },
  {
    id: "jpa-06",
    field: "jpa",
    chapter: 6,
    part: null,
    title: "Ánh xạ value type",
    file: "content/jpa/06-anh-xa-value-type.md",
    icon: "🧱",
    desc: "Chương dài nhất sách, về mọi thứ không phải entity. Basic property với ghi đè mặc định, tuỳ chỉnh cách truy cập, derived property, biến đổi giá trị cột, giá trị được sinh ra, @Temporal và ánh xạ enum. Rồi embeddable component kể cả lồng nhau, và cuối cùng là converter giữa kiểu Java và kiểu SQL bằng JPA converter hoặc Hibernate UserType.",
    tags: ["Embeddable", "Converter", "Enum"],
  },
  {
    id: "jpa-07",
    field: "jpa",
    chapter: 7,
    part: null,
    title: "Ánh xạ inheritance",
    file: "content/jpa/07-anh-xa-inheritance.md",
    icon: "🌳",
    desc: "Bốn cách đưa một cây thừa kế Java xuống bảng SQL: table per concrete class với đa hình ngầm định, table per concrete class với union, table per class hierarchy, và table per subclass với join. Kèm cách trộn chúng, inheritance của class embeddable, một mục riêng về cách chọn chiến lược, và polymorphic association ở cả dạng many-to-one lẫn collection.",
    tags: ["Inheritance", "Discriminator", "Polymorphic"],
  },
  {
    id: "jpa-08",
    field: "jpa",
    chapter: 8,
    part: null,
    title: "Ánh xạ collection và entity association",
    file: "content/jpa/08-anh-xa-collection-va-entity-association.md",
    icon: "📦",
    desc: "Collection của value type trước: schema, cách chọn interface, rồi ánh xạ set, identifier bag, list và map, cộng collection được sắp xếp và có thứ tự. Sau đó là collection của component với vấn đề equality đi kèm. Khép lại bằng entity association đầu tiên — dạng đơn giản nhất, cách làm cho nó hai chiều, và cascade trạng thái.",
    tags: ["Collection", "Set và bag", "Cascade"],
  },
  {
    id: "jpa-09",
    field: "jpa",
    chapter: 9,
    part: null,
    title: "Ánh xạ entity association nâng cao",
    file: "content/jpa/09-anh-xa-entity-association-nang-cao.md",
    icon: "🔗",
    desc: "Chương nhiều hình nhất sách, đi qua mọi hình dạng association. Một-một bằng primary key dùng chung, foreign primary key generator, cột foreign key join hoặc join table. Một-nhiều với bag, list một chiều và hai chiều, join table, và trong class embeddable. Nhiều-nhiều và quan hệ bậc ba, kể cả với entity trung gian. Cuối cùng là entity association dùng map làm cấu trúc.",
    tags: ["Một-nhiều", "Nhiều-nhiều", "Join table"],
  },
  {
    id: "jpa-10",
    field: "jpa",
    chapter: 10,
    part: null,
    title: "Quản lý dữ liệu",
    file: "content/jpa/10-quan-ly-du-lieu.md",
    icon: "♻️",
    desc: "Cơ chế mà mọi thứ trước đó dựa vào: vòng đời persistence với các trạng thái của instance entity, và persistence context. Interface EntityManager trong một đơn vị công việc chuẩn mực — persist, truy xuất và sửa, lấy reference, remove, refresh, replicate — cộng caching trong persistence context và cơ chế flush. Rồi trạng thái detached: identity, hiện thực equals, detach và merge.",
    tags: ["Persistence context", "EntityManager", "Detached"],
  },
  {
    id: "jpa-11",
    field: "jpa",
    chapter: 11,
    part: null,
    title: "Transaction và concurrency",
    file: "content/jpa/11-transaction-va-concurrency.md",
    icon: "⚖️",
    desc: "ACID, và phân biệt database transaction với system transaction. Điều khiển truy cập đồng thời từ mức database lên: kiểm soát lạc quan bằng versioning, pessimistic locking tường minh, và cách tránh deadlock. Truy cập dữ liệu phi giao dịch ở chế độ auto-commit và cách xếp hàng sửa đổi. Khép lại bằng quản lý transaction với Spring và Spring Data: propagation, rollback, các thuộc tính, và cách định nghĩa bằng chương trình.",
    tags: ["Transaction", "Optimistic lock", "Propagation"],
  },
  {
    id: "jpa-12",
    field: "jpa",
    chapter: 12,
    part: null,
    title: "Fetch plan, strategy và profile",
    file: "content/jpa/12-fetch-plan-strategy-va-profile.md",
    icon: "🎣",
    desc: "Vì sao cùng một đoạn mã có thể sinh ra một câu SQL hoặc một nghìn câu. Entity proxy và persistent collection lazy, eager loading, rồi hai vấn đề kinh điển là n+1 selects và tích Descartes. Bốn cách chữa: prefetch theo lô, prefetch bằng subselect, eager fetching bằng nhiều SELECT, và eager fetching động. Cuối cùng là fetch profile của Hibernate và entity graph của JPA.",
    tags: ["Lazy loading", "N+1", "Entity graph"],
  },
  {
    id: "jpa-13",
    field: "jpa",
    chapter: 13,
    part: null,
    title: "Lọc dữ liệu",
    file: "content/jpa/13-loc-du-lieu.md",
    icon: "🧹",
    desc: "Bốn cơ chế chen vào giữa mã của bạn và database. Cascade các chuyển đổi trạng thái, kể cả detach và merge bắc cầu. Lắng nghe và chặn sự kiện bằng event listener và callback của JPA, Hibernate interceptor, và hệ thống sự kiện lõi. Auditing và versioning bằng Hibernate Envers: bật audit log, tạo audit trail, tìm revision và truy cập dữ liệu lịch sử. Và data filter động: định nghĩa, áp dụng, bật, và lọc việc truy cập collection.",
    tags: ["Cascade", "Envers", "Interceptor"],
  },
  {
    id: "jpa-14",
    field: "jpa",
    chapter: 14,
    part: null,
    title: "Tích hợp JPA và Hibernate với Spring",
    file: "content/jpa/14-tich-hop-jpa-va-hibernate-voi-spring.md",
    icon: "🌱",
    desc: "Ráp tầng persistence vào một ứng dụng Spring bằng tay, trước khi để Spring Data làm hộ. Dependency injection, rồi ứng dụng JPA dùng Spring theo mẫu DAO và cách tổng quát hoá DAO đó, và cùng hai bước ấy cho ứng dụng Hibernate native. Chương này giải thích cái mà Spring Data giấu đi.",
    tags: ["DAO", "Dependency injection", "Spring"],
  },
  {
    id: "jpa-15",
    field: "jpa",
    chapter: 15,
    part: null,
    title: "Làm việc với Spring Data JDBC",
    file: "content/jpa/15-lam-viec-voi-spring-data-jdbc.md",
    icon: "🪶",
    desc: "Một lựa chọn nhẹ hơn JPA: không persistence context, không lazy loading, không dirty checking. Dựng dự án, rồi cùng bộ công cụ truy vấn quen thuộc — query method, giới hạn và sắp xếp và phân trang, streaming, @Query, modifying query. Phần đáng giá nhất là mô hình hoá quan hệ: một-một, embedded entity, một-nhiều và nhiều-nhiều được làm khác hẳn so với JPA.",
    tags: ["Spring Data JDBC", "Aggregate", "Quan hệ"],
  },
  {
    id: "jpa-16",
    field: "jpa",
    chapter: 16,
    part: null,
    title: "Làm việc với Spring Data REST",
    file: "content/jpa/16-lam-viec-voi-spring-data-rest.md",
    icon: "🌐",
    desc: "Phơi repository thành REST endpoint mà không viết controller. Dựng ứng dụng Spring Data REST, dùng ETag cho yêu cầu có điều kiện, giới hạn truy cập tới repository, phương thức và field, xử lý REST event bằng AnnotatedHandler hoặc ApplicationListener, và điều khiển hình dạng dữ liệu trả về bằng projection và excerpt.",
    tags: ["REST", "ETag", "Projection"],
  },
  {
    id: "jpa-17",
    field: "jpa",
    chapter: 17,
    part: null,
    title: "Làm việc với Spring Data MongoDB",
    file: "content/jpa/17-lam-viec-voi-spring-data-mongodb.md",
    icon: "🍃",
    desc: "Cùng mô hình lập trình Spring Data nhưng trên một database document. Giới thiệu MongoDB và Spring Data MongoDB, rồi MongoRepository với query method, phân trang, streaming và @Query. Kèm Query by Example, cách tham chiếu tới các document khác, và MongoTemplate cho những thao tác mà repository không diễn đạt được.",
    tags: ["MongoDB", "Document", "MongoTemplate"],
  },
  {
    id: "jpa-18",
    field: "jpa",
    chapter: 18,
    part: null,
    title: "Làm việc với Hibernate OGM",
    file: "content/jpa/18-lam-viec-voi-hibernate-ogm.md",
    icon: "🕸️",
    desc: "Chương ngắn nhất sách, về một ý tưởng lớn: mở rộng tính khả chuyển của JPA từ database quan hệ sang NoSQL. Giới thiệu Hibernate OGM và bốn họ database NoSQL, dựng một ứng dụng với MongoDB, rồi đổi sang Neo4j để thấy cùng một đoạn mã JPA chạy trên một database đồ thị.",
    tags: ["Hibernate OGM", "NoSQL", "Neo4j"],
  },
  {
    id: "jpa-19",
    field: "jpa",
    chapter: 19,
    part: null,
    title: "Truy vấn JPA với Querydsl",
    file: "content/jpa/19-truy-van-jpa-voi-querydsl.md",
    icon: "🧮",
    desc: "Viết truy vấn bằng API kiểu an toàn thay vì chuỗi JPQL, để trình biên dịch bắt lỗi thay vì lúc chạy. Giới thiệu Querydsl, cấu hình dự án và sinh Q-class, rồi truy vấn thật: lọc, sắp xếp, nhóm và hàm tổng hợp, subquery và join, cập nhật và xoá entity.",
    tags: ["Querydsl", "Kiểu an toàn", "JPQL"],
  },
  {
    id: "jpa-20",
    field: "jpa",
    chapter: 20,
    part: null,
    title: "Kiểm thử ứng dụng Java persistence",
    file: "content/jpa/20-kiem-thu-ung-dung-java-persistence.md",
    icon: "🧪",
    desc: "Kim tự tháp kiểm thử áp vào tầng persistence, rồi Spring TestContext Framework với những công cụ quyết định test của bạn nhanh hay chậm, cô lập hay lẫn lộn: @DirtiesContext, thực thi test trong @Transactional, @BeforeTransaction và @AfterTransaction, Spring profile, và test execution listener.",
    tags: ["Kiểm thử", "TestContext", "@Transactional"],
  },
];
```

- [ ] **Bước 4: Nối vào `docs-index.js`**

Thêm import cạnh các import khác (sau dòng `ocnj`):

```js
import { docs as jpa } from "./jpa/docs.js";
```

Và `...jpa,` vào mảng, ngay sau `...ocnj,`. Giữ đúng thứ tự như `FIELD_ORDER`.

- [ ] **Bước 5: Thêm `fieldGuides.jpa` vào `guides.js`**

Đặt sau khối `fieldGuides.ocnj`. Ở task này **mọi `step` dùng `done: { kind: "manual" }`** vì track `jpa` chưa tồn tại — Task 9 sẽ viết lại chúng để trỏ track. Khai `done: { kind: "track", id: "jpa" }` bây giờ là đỏ.

```js
  jpa: {
    tagline: "Đọc Java Persistence with Spring Data and Hibernate — từ paradigm mismatch tới persistence context, transaction, fetch plan và kiểm thử.",
    audience: "Lập trình viên Java đã dùng Spring Data JPA nhưng chưa biết Hibernate làm gì sau lưng mình — người đã từng gặp LazyInitializationException hoặc N+1 mà chỉ chữa được bằng cách thử.",
    hoursPerWeek: "6–8 giờ/tuần · 13 tuần",
    prereqs: [
      "Đọc và viết được SQL ở mức join và index — sách nói thẳng ở chương 1 rằng nắm vững mô hình quan hệ và SQL là điều kiện tiên quyết.",
      "Chạy được một ứng dụng Spring Boot thật để gõ theo từng chương.",
      "Một SQL database chạy được cục bộ hoặc qua Docker; mọi tuần đều đọc SQL do Hibernate sinh ra.",
      "Docker cho chương 17 và 18 — hai chương đó cần MongoDB và Neo4j.",
    ],
    steps: [
      { id: "jp-1", title: "Dựng chỗ chạy và bật SQL log", desc: "Một dự án Spring Boot trống nối tới một SQL database thật, với `spring.jpa.show-sql` đã bật. Bạn sẽ đọc SQL sinh ra ở gần như mọi tuần — không bật nó thì nửa giá trị cuốn sách biến mất.", done: { kind: "manual" } },
      { id: "jp-2", title: "Tuần 1–2: vì sao cần ORM, và repository đầu tiên", desc: "Paradigm mismatch qua năm mặt của nó, ba cách viết \"Hello World\", domain model CaveatEmptor và metadata, rồi toàn bộ cách lấy dữ liệu bằng Spring Data JPA.", done: { kind: "manual" } },
      { id: "jp-3", title: "Tuần 3–7: ánh xạ", desc: "Entity với value type và identity, ánh xạ property và embeddable và converter, bốn chiến lược inheritance, collection, rồi mọi hình dạng association. Phần dày nhất sách và là nơi quyết định schema bạn sẽ sống chung nhiều năm.", done: { kind: "manual" } },
      { id: "jp-4", title: "Tuần 8–10: cơ chế lúc chạy", desc: "Persistence context và vòng đời entity, transaction và điều khiển đồng thời, rồi fetch plan cùng các cơ chế cascade, Envers và filter. Kết thúc tuần 10 bạn giải thích được vì sao một đoạn mã sinh ra một nghìn câu SQL.", done: { kind: "manual" } },
      { id: "jp-5", title: "Tuần 11–13: ráp vào Spring và kiểm thử", desc: "Mẫu DAO viết tay, Spring Data JDBC, Spring Data REST, MongoDB, Hibernate OGM, Querydsl, và kiểm thử tầng persistence bằng Spring TestContext.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Bật SQL log trước khi đọc", desc: "Mỗi chương ánh xạ kết thúc bằng một câu hỏi kiểm được: schema sinh ra trông thế nào, và một thao tác sinh ra mấy câu lệnh. Đọc mà không nhìn SQL là học thuộc annotation." },
      { title: "Giữ lại một dự án xuyên suốt", desc: "Sách dùng CaveatEmptor từ chương 3 tới hết. Giữ một dự án của riêng bạn theo cùng cách: mỗi tuần thêm vào nó, đừng dựng dự án mới mỗi chương." },
    ],
    pitfalls: [
      "**Đọc sách như một danh mục annotation.** Giá trị nằm ở đánh đổi giữa các chiến lược — chương 7 dành hẳn một mục \"Chọn chiến lược\" cho bốn cách ánh xạ inheritance. Học thuộc annotation mà không bật SQL log để nhìn schema và câu lệnh thật là bỏ đúng phần đó.",
      "**Chương 18 dạy công nghệ đã ngưng phát triển.** Hibernate OGM không còn được phát triển tích cực và không theo kịp Jakarta EE. Đọc để hiểu ý tưởng mở rộng khả chuyển của JPA sang NoSQL, đừng dựng hệ thống mới trên nó. Đây là ghi chú thời sự, không phải chê nguồn.",
      "**Tưởng tên package và giá trị mặc định là hằng số.** Ranh giới `javax.persistence` và `jakarta.persistence`, mặc định của Hibernate, API của Spring Data — tất cả đổi theo phiên bản. Đọc để hiểu cơ chế, còn cấu hình thì tra lại theo phiên bản đang chạy; Hibernate ORM documentation ở chân thanh bên là chỗ tra.",
      "**Bỏ qua chương 10 vì tên nó nghe hiền.** \"Quản lý dữ liệu\" là chương persistence context — cơ chế mà chương 12 về lazy loading và chương 11 về transaction đều đứng lên trên. Đọc lướt chương này là ba tuần sau không hiểu gì.",
    ],
    doneWhen: [
      "Nhìn một domain model là nói được cái gì nên là entity, cái gì nên là value type, và vì sao.",
      "Chọn được một trong bốn chiến lược inheritance cho một cây thừa kế cụ thể và nêu lý do bằng đánh đổi.",
      "Giải thích được vì sao một vòng lặp trên collection sinh ra N+1 câu SQL, và chữa được bằng ít nhất hai cách khác nhau.",
      "Nói được một entity đang ở trạng thái nào trong vòng đời persistence, và thao tác nào chuyển nó sang trạng thái nào.",
      "Chặn được lost update bằng optimistic locking, và nói được khi nào phải dùng pessimistic thay thế.",
      "Viết được test cho tầng persistence chạy trên database thật mà không rò rỉ trạng thái giữa các test.",
    ],
  },
```

- [ ] **Bước 6: Thêm số đếm kỳ vọng vào `check-data.mjs`**

Trong `EXPECTED.counts`, sau khối `ocnj`:

```js
    // Lĩnh vực JPA — 20 chương Java Persistence with Spring Data and Hibernate.
    "docs:jpa": 20,
```

**Chưa** thêm `"roadmap-items:jpa"` — module `roadmap` chưa khai, bất biến chỉ đòi key khi module có mặt. Task 9 thêm nó.

- [ ] **Bước 7: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`.

Nếu **#2b** đỏ (ảnh trong markdown không có trên đĩa): bạn quên chạy `build-content.sh`, hoặc ảnh chưa được di chuyển ở Task 1.
Nếu **P1** đỏ: quên Bước 2.
Nếu **G1** đỏ: quên Bước 5, hoặc một `step` khai `kind: "track"`.
Nếu **D1** đỏ: một `title` còn tiền tố "Chương N. ".

- [ ] **Bước 8: Xác nhận số tài liệu đã lên 262**

```bash
node --input-type=module -e '
const { docs } = await import("./webapp/js/data/docs-index.js");
const jpa = docs.filter(d => d.field === "jpa");
console.log("tổng:", docs.length, "| jpa:", jpa.length);
console.log("chapter:", jpa.map(d => d.chapter).join(","));
console.log("part khác null:", jpa.filter(d => d.part !== null).map(d => d.id));
console.log("id sai khuôn:", jpa.filter(d => !/^jpa-(0[1-9]|1[0-9]|20)$/.test(d.id)).map(d => d.id));
'
```

Kỳ vọng: `tổng: 262 | jpa: 20`, chapter là `1,2,…,20` liền mạch, hai danh sách cuối rỗng.

- [ ] **Bước 9: Commit**

```bash
git add -A
git commit -m "feat(jpa): khai lĩnh vực và thư viện 20 tài liệu

Lĩnh vực thứ 14 của DevPrep, id jpa, icon 🗃️, đặt sau ocnj trong FIELD_ORDER
và trên con đường Java Backend — nay chín chặng thay vì tám.

part để null cho cả 20 tài liệu: bộ nguồn không có README, không tệp nào chứa
chữ Phần, PDF tách theo chương nên không có trang phân Phần. Cùng cách xử lý
như wgjd và jcip.

externalRef là Hibernate ORM documentation chứ không phải Spring Data JPA
reference: chương 5-13 về ánh xạ và persistence context chiếm 101.721 trong
178.653 từ, tức 57% cuốn sách.

Module roadmap chưa mở — chưa có dữ liệu lộ trình, bất biến #7 chặn.
242 → 262 tài liệu."
```

---

## Ghi chú chung cho Task 3–8 (viết lộ trình)

Sáu task này viết 52 mục lộ trình. Chúng chia sẻ toàn bộ quy ước dưới đây — đọc một lần, áp dụng cho cả sáu.

**Tệp và biến export:**

| Task | Tệp | Biến export | Tuần | Cộng dồn |
|---|---|---|---|---|
| 3 | `webapp/js/data/jpa/roadmap-part1.js` (tạo) | `jpaWeeksPart1` | W1–W2 | 2 tuần, 8 mục |
| 4 | `roadmap-part1.js` | `jpaWeeksPart1` | W3–W4 | 4 tuần, 16 mục |
| 5 | `roadmap-part1.js` (đóng) | `jpaWeeksPart1` | W5–W7 | 7 tuần, 28 mục |
| 6 | `webapp/js/data/jpa/roadmap-part2.js` (tạo) | `jpaWeeksPart2` | W8–W9 | 2 tuần, 8 mục |
| 7 | `roadmap-part2.js` | `jpaWeeksPart2` | W10–W11 | 4 tuần, 16 mục |
| 8 | `roadmap-part2.js` (đóng) | `jpaWeeksPart2` | W12–W13 | 6 tuần, 24 mục |

**Các tệp này chưa được `roadmap.js` import cho tới Task 9** — nên `check-data.mjs` không nhìn thấy chúng, và mỗi task tự kiểm bằng script riêng ở bước cuối.

**Đầu tệp `roadmap-part1.js`** (Task 3 viết, Task 4–5 không sửa):

```js
// Lộ trình đọc Java Persistence with Spring Data and Hibernate — Phần 1 (Tuần 1–7).
//
// Nguồn: bản dịch tiếng Việt "Java Persistence with Spring Data and Hibernate"
// (Cătălin Tudose — Manning).
// Thư mục nguồn: sources/jpa/ — đủ 20 chương, không thiếu chương nào.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jp-w<N> / jp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jpaWeeksPart1 = [
```

Đầu tệp `roadmap-part2.js` giống hệt, đổi `Phần 1 (Tuần 1–7)` thành `Phần 2 (Tuần 8–13)` và tên biến thành `jpaWeeksPart2`.

**Hình dạng một tuần:**

```js
  {
    id: "jp-w1",
    week: "Tuần 1",
    title: "…",
    goal: "…",
    practice: "…",
    resources: [
      { label: "JPA 01 — Tìm hiểu về object/relational persistence", href: "#/docs/jpa-01" },
    ],
    items: [ /* đúng 4 mục */ ],
  },
```

**Cả 13 tuần đều có `practice` gõ tay** — không tuần nào được để trống hay viết một câu giải thích thay thế. Nội dung `practice` từng tuần cho sẵn ở mỗi task.

**Hình dạng một mục:** `{ id, text, lesson }`. `lesson` là chuỗi template literal markdown gồm **đúng bốn khối, đúng thứ tự và đúng nhãn**:

```
**Mục tiêu.** …một câu, nói người đọc sẽ làm được gì sau mục này…

**Đọc.** …dẫn qua từng mục con, mỗi mục con là một link [tên mục](#/docs/jpa-NN), kèm chỉ dẫn đọc kỹ hay đọc lướt…

**Bẫy.** …hai cái bẫy CÓ THẬT trong chương, mỗi cái nói rõ sách cảnh báo gì…

**Tự kiểm tra.** …hai câu hỏi trả lời được sau khi đọc, không phải câu hỏi mẹo…
```

**Quy tắc bắt buộc khi viết `lesson`:**

1. **Đọc chương gốc trước khi viết.** Mở `sources/jpa/NN-slug.md`, đọc đúng những mục con mà mục lộ trình phụ trách. Tên mục trong khối **Đọc** phải là tên mục **có thật** trong bản dịch — bảng "Mục con nguồn" ở mỗi task cho biết đọc mục nào, và tên trong bảng đã trích nguyên văn từ heading của bản dịch (bỏ số mục).
2. **Không bịa tên annotation, tên phương thức, tên thuộc tính cấu hình.** Sách dày đặc annotation (`@Entity`, `@Embeddable`, `@Version`, `@EntityGraph`…) — chỉ nhắc cái nào bạn thật sự thấy trong chương.
3. **Bẫy phải là bẫy sách nói**, không phải kinh nghiệm chung chung của người viết.
4. Link luôn dạng `#/docs/jpa-NN` — bất biến #3 kiểm id có thật, #3b kiểm cùng con đường. **Không link sang lĩnh vực khác trong `lesson`** (dùng `related.js` ở Task 10 cho việc đó).
5. Escape dấu backtick trong template literal bằng `` \` ``, và dấu `$` đứng trước `{` bằng `\$`.
6. **Không nhắc tính thời sự của Hibernate OGM trong `lesson` của `jp-w13-1`.** Ghi chú đó nằm ở `fieldGuides.jpa.pitfalls`, đúng một chỗ — Global Constraints.

**Ví dụ một mục viết đủ chuẩn** — dùng làm khuôn cho 51 mục còn lại. Đây là `jp-w8-1`, viết sau khi đọc `sources/jpa/10-quan-ly-du-lieu.md`:

```js
      {
        id: "jp-w8-1",
        text: "Bốn trạng thái của một instance entity, và persistence context",
        lesson: `**Mục tiêu.** Nhìn một đoạn mã là nói được entity trong đó đang ở trạng thái nào, và thao tác nào chuyển nó sang trạng thái nào.

**Đọc.** [Vòng đời persistence](#/docs/jpa-10) mở chương bằng khung mà cả phần còn lại đứng lên trên. [Các trạng thái của instance entity](#/docs/jpa-10) là mục phải đọc chậm và vẽ lại thành sơ đồ trên giấy — bốn trạng thái cùng các mũi tên giữa chúng là thứ bạn sẽ tra lại suốt các chương sau. [Persistence context](#/docs/jpa-10) giải thích cái hộp giữ các instance đang được quản lý; đọc kỹ đoạn nói nó tồn tại trong bao lâu, vì đó là nguồn gốc của gần như mọi bất ngờ ở chương 12.

**Bẫy.** Nghĩ rằng gọi setter trên một object là chưa đủ để dữ liệu xuống database. Với một instance đang được quản lý, sửa trạng thái của nó là đủ — persistence context sẽ phát hiện thay đổi và sinh UPDATE khi flush, không cần gọi một phương thức lưu nào. Bẫy ngược lại cũng thật: sửa một instance **detached** thì không có gì xảy ra cả, và đây là chỗ chương 10 dành hẳn một mục cuối để nói về merge.

**Tự kiểm tra.** Bốn trạng thái mà chương này liệt kê là gì, và thao tác nào đưa một instance từ transient sang persistent? Persistence context sống trong bao lâu, và điều gì xảy ra với các instance nó đang giữ khi nó đóng lại?`,
      },
```

**Bước cuối chung cho Task 3–8** — script tự kiểm, thay `<PART>`, `<BIẾN>`, `<SỐ TUẦN>`, `<SỐ MỤC>` theo task:

```bash
node --input-type=module -e '
const m = await import("./webapp/js/data/jpa/roadmap-<PART>.js");
const weeks = m.<BIẾN>;
const items = weeks.flatMap(w => w.items);
const bad = [];
if (weeks.length !== <SỐ TUẦN>) bad.push(`tuần: ${weeks.length} ≠ <SỐ TUẦN>`);
if (items.length !== <SỐ MỤC>) bad.push(`mục: ${items.length} ≠ <SỐ MỤC>`);
for (const w of weeks) {
  if (w.items.length !== 4) bad.push(`${w.id} có ${w.items.length} mục, phải là 4`);
  for (const k of ["id","week","title","goal","practice","resources"])
    if (!w[k]) bad.push(`${w.id} thiếu ${k}`);
  for (const it of w.items) {
    if (!it.id.startsWith(w.id + "-")) bad.push(`${it.id} không khớp tiền tố ${w.id}-`);
    for (const blk of ["**Mục tiêu.**","**Đọc.**","**Bẫy.**","**Tự kiểm tra.**"])
      if (!it.lesson.includes(blk)) bad.push(`${it.id} thiếu khối ${blk}`);
    for (const ref of it.lesson.matchAll(/#\/docs\/([a-zA-Z0-9-]+)/g))
      if (!/^jpa-(0[1-9]|1[0-9]|20)$/.test(ref[1])) bad.push(`${it.id} link lạ: ${ref[1]}`);
  }
}
const dup = items.map(i=>i.id).filter((v,i,a)=>a.indexOf(v)!==i);
if (dup.length) bad.push(`id trùng: ${dup}`);
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: <SỐ TUẦN> tuần, <SỐ MỤC> mục, id và khối hợp lệ");
process.exit(bad.length ? 1 : 0);
'
```

Regex `^jpa-(0[1-9]|1[0-9]|20)$` cho đúng 20 id hợp lệ `jpa-01`…`jpa-20` và chặn mọi id lạc.

**Lưu ý về tiền tố id.** Bất biến "Id mục lộ trình khớp tiền tố id tuần cha" so `id tuần + "-"`, nên `jp-w1-1` khớp `jp-w1-` còn `jp-w13-1` khớp `jp-w13-` — không xung đột. Nhưng khi **tự viết grep** thì `grep 'jp-w1-'` sẽ **không** bắt các mục tuần 10–13, còn `grep 'jp-w1'` thì có. Đếm bằng script ở trên, đừng đếm bằng grep.

---

## Task 3: Lộ trình tuần 1–2 (ch.1 + ch.2, ch.3 + ch.4)

**Files:**
- Create: `webapp/js/data/jpa/roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `jpa-01`…`jpa-04` từ Task 2.
- Produces: `export const jpaWeeksPart1` — mảng tuần mà Task 4 và 5 nối thêm vào, và Task 9 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc bốn chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/01-tim-hieu-object-relational-persistence.md sources/jpa/02-bat-dau-mot-du-an.md sources/jpa/03-domain-model-va-metadata.md sources/jpa/04-lam-viec-voi-spring-data-jpa.md
```

Rồi đọc nội dung các mục con sẽ viết ở Bước 3 và 4. Không viết `lesson` trước khi đọc — mọi tên mục và cái bẫy phải lấy từ bản dịch.

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/jpa/roadmap-part1.js` với khối chú thích đầu tệp và dòng `export const jpaWeeksPart1 = [` như mô tả ở "Ghi chú chung", rồi đóng bằng `];`.

- [ ] **Bước 3: Viết tuần 1**

`id: "jp-w1"`, `week: "Tuần 1"`, `title: "Vì sao cần ORM, và ba cách gõ dòng đầu tiên"`.

`goal`: Phát biểu được paradigm mismatch qua năm vấn đề cụ thể mà chương 1 nêu tên, và dựng được cùng một ví dụ lưu-rồi-đọc bằng cả ba cách sách trình bày.

`practice`: Dựng cùng một schema "Hello World" bằng ba cách sách trình bày — JPA thuần với persistence unit, cấu hình native của Hibernate, và Spring Data JPA. Giữ cả ba trong một dự án, rồi viết ra bằng lời của bạn: mỗi cách bắt bạn khai những gì, và cách nào giấu đi cái gì.

`resources`:
```js
    resources: [
      { label: "JPA 01 — Tìm hiểu về object/relational persistence", href: "#/docs/jpa-01" },
      { label: "JPA 02 — Bắt đầu một dự án", href: "#/docs/jpa-02" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w1-1` | Persistence, SQL và JDBC trong ứng dụng Java | ch.1: Persistence là gì? (Relational database · Hiểu về SQL · Sử dụng SQL trong Java) |
| `jp-w1-2` | Năm mặt của paradigm mismatch, và ORM trả lời chúng thế nào | ch.1: Paradigm mismatch (Vấn đề về granularity · Vấn đề về inheritance · Vấn đề về identity · Vấn đề về association · Vấn đề về data navigation) · ORM, JPA, Hibernate và Spring Data |
| `jp-w1-3` | "Hello World" với JPA, và cấu hình native của Hibernate | ch.2: Giới thiệu Hibernate · Giới thiệu Spring Data · "Hello World" với JPA (Cấu hình một persistence unit · Viết một persistent class · Lưu và nạp message) · Cấu hình native của Hibernate |
| `jp-w1-4` | Chuyển đổi JPA ↔ Hibernate, Spring Data JPA, và so ba cách | ch.2: Chuyển đổi giữa JPA và Hibernate · "Hello World" với Spring Data JPA · So sánh các cách tiếp cận lưu trữ entity |

Ở `jp-w1-2`, khối **Bẫy** phải bám đúng những gì chương 1 nói về vấn đề identity — sách phân biệt identity trong Java với identity trong database, và đó là gốc của bẫy `equals`/`hashCode` mà tuần 8 sẽ gặp lại.

- [ ] **Bước 4: Viết tuần 2**

`id: "jp-w2"`, `week: "Tuần 2"`, `title: "Domain model, metadata, và repository đầu tiên"`.

`goal`: Dựng được một domain model POJO có khả năng persistence với metadata khai bằng annotation, rồi lấy dữ liệu ra khỏi nó bằng năm cách khác nhau của Spring Data JPA.

`practice`: Dựng domain model CaveatEmptor theo chương 3, bật `spring.jpa.show-sql` và đọc DDL Hibernate sinh ra — đối chiếu từng cột với annotation bạn đã khai. Rồi viết 5 query method Spring Data với tên method khác nhau và đối chiếu SQL mà từng cái sinh ra.

`resources`:
```js
    resources: [
      { label: "JPA 03 — Domain model và metadata", href: "#/docs/jpa-03" },
      { label: "JPA 04 — Làm việc với Spring Data JPA", href: "#/docs/jpa-04" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w2-1` | CaveatEmptor: kiến trúc phân tầng và hiện thực domain model | ch.3: Ứng dụng ví dụ CaveatEmptor (Kiến trúc phân tầng · Phân tích miền nghiệp vụ · Domain model CaveatEmptor) · Hiện thực domain model (Xử lý rò rỉ mối quan tâm · Persistence trong suốt và tự động · Viết các class có khả năng persistence · Hiện thực association trong POJO) |
| `jp-w2-2` | Metadata: annotation, constraint, XML và đọc lúc chạy | ch.3: Metadata của domain model (Metadata dựa trên annotation · Áp dụng constraint cho object Java · Đưa metadata ra ngoài bằng file XML · Truy cập metadata lúc chạy) |
| `jp-w2-3` | Dựng repository, query method, phân trang và streaming | ch.4: Giới thiệu Spring Data JPA · Bắt đầu một dự án Spring Data JPA mới · Những bước đầu tiên để cấu hình một dự án Spring Data JPA · Định nghĩa query method với Spring Data JPA · Giới hạn kết quả truy vấn, sắp xếp và phân trang · Streaming kết quả |
| `jp-w2-4` | @Query, projection, truy vấn sửa đổi và Query by Example | ch.4: Annotation @Query · Projection · Truy vấn sửa đổi (modifying query) · Query by Example |

- [ ] **Bước 5: Chạy script tự kiểm — kỳ vọng XANH**

Dùng script ở "Ghi chú chung" với `<PART>`=`part1`, `<BIẾN>`=`jpaWeeksPart1`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 6: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Tệp mới chưa được import nên số đếm không đổi — nếu đỏ, lỗi nằm ở chỗ khác.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part1.js
git commit -m "feat(jpa): lộ trình đọc tuần 1-2 — vì sao cần ORM, và repository đầu tiên

Tuần 1 ghép ch.1 + ch.2: năm mặt của paradigm mismatch, rồi cùng một Hello
World viết bằng JPA thuần, Hibernate native và Spring Data JPA. Tuần 2 ghép
ch.3 + ch.4 vì ch.4 dùng repository ngay trên domain model ch.3 vừa dựng.

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 4: Lộ trình tuần 3–4 (ch.5, ch.6)

**Files:**
- Modify: `webapp/js/data/jpa/roadmap-part1.js`

**Interfaces:**
- Consumes: `jpaWeeksPart1` từ Task 3; doc id `jpa-05`, `jpa-06`.
- Produces: `jpaWeeksPart1` dài 4 tuần.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/05-anh-xa-cac-persistent-class.md sources/jpa/06-anh-xa-value-type.md
```

- [ ] **Bước 2: Nối tuần 3 và tuần 4 vào cuối mảng `jpaWeeksPart1`**

**Tuần 3** — `id: "jp-w3"`, `week: "Tuần 3"`, `title: "Entity, value type và identity"`.

`goal`: Nhìn một khái niệm trong domain model là quyết định được nó nên là entity hay value type, và chọn được chiến lược sinh định danh phù hợp với cách ứng dụng ghi dữ liệu.

`practice`: Ánh xạ một entity với ba chiến lược sinh id khác nhau (IDENTITY, SEQUENCE, TABLE — dùng đúng tên chương 5 gọi). Insert 100 bản ghi bằng mỗi kiểu, bật SQL log và đếm số round-trip tới database; giải thích chênh lệch bằng cơ chế chương mô tả.

`resources`: `{ label: "JPA 05 — Ánh xạ các persistent class", href: "#/docs/jpa-05" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w3-1` | Domain model mịn, và ranh giới entity với value type | ch.5: Hiểu về entity và value type (Domain model mịn · Định nghĩa các khái niệm của ứng dụng · Phân biệt entity và value type) |
| `jp-w3-2` | Identity, equality và ánh xạ entity đầu tiên | ch.5: Ánh xạ entity với identity (Hiểu về identity và equality trong Java · Entity class và ánh xạ đầu tiên) |
| `jp-w3-3` | Chọn primary key và cấu hình key generator | ch.5: Ánh xạ entity với identity (Chọn primary key · Cấu hình key generator · Các chiến lược sinh định danh) |
| `jp-w3-4` | Điều khiển tên, SQL động, entity bất biến và subselect | ch.5: Các tùy chọn ánh xạ entity (Điều khiển tên · Sinh SQL động · Làm cho một entity bất biến · Ánh xạ một entity tới subselect) |

**Tuần 4** — `id: "jp-w4"`, `week: "Tuần 4"`, `title: "Value type: property, embeddable và converter"`.

`goal`: Ánh xạ được mọi thứ không phải entity — từ một cột `boolean` tới một component lồng nhau tới một kiểu tự định nghĩa — và biết cột SQL sinh ra sẽ trông thế nào trước khi chạy.

`practice`: Ánh xạ một `@Embeddable` vào một entity, rồi viết một converter cho một kiểu Java tự định nghĩa theo đúng cách chương 6 chỉ. Sinh schema và kiểm từng cột SQL thật sinh ra khớp với điều bạn nghĩ — chỗ nào lệch, tìm mục trong chương giải thích vì sao.

`resources`: `{ label: "JPA 06 — Ánh xạ value type", href: "#/docs/jpa-06" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w4-1` | Ghi đè mặc định, cách truy cập, derived property và biến đổi cột | ch.6: Ánh xạ basic property (Ghi đè giá trị mặc định của basic property · Tùy chỉnh cách truy cập property · Sử dụng derived property · Biến đổi giá trị cột) |
| `jp-w4-2` | Giá trị được sinh ra, @Temporal và ánh xạ enum | ch.6: Ánh xạ basic property (Giá trị property được sinh ra và giá trị mặc định · Annotation @Temporal · Ánh xạ enum) |
| `jp-w4-3` | Embeddable component, ghi đè thuộc tính và component lồng nhau | ch.6: Ánh xạ embeddable component (Schema cơ sở dữ liệu · Làm cho class trở nên embeddable · Ghi đè các thuộc tính được nhúng · Ánh xạ embedded component lồng nhau) |
| `jp-w4-4` | Converter: kiểu dựng sẵn, JPA converter và Hibernate UserType | ch.6: Ánh xạ kiểu Java và kiểu SQL bằng converter (Các kiểu dựng sẵn · Tạo JPA converter tùy chỉnh · Mở rộng Hibernate bằng UserType) |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part1`, `<BIẾN>`=`jpaWeeksPart1`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part1.js
git commit -m "feat(jpa): lộ trình đọc tuần 3-4 — entity, identity và value type

Tuần 3 là ch.5: ranh giới entity/value type, identity và equality, năm chiến
lược sinh định danh. Tuần 4 là ch.6, chương dài nhất sách: basic property,
embeddable component lồng nhau, và converter giữa kiểu Java với kiểu SQL.

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 5: Lộ trình tuần 5–7 (ch.7, ch.8, ch.9) — đóng `roadmap-part1.js`

**Files:**
- Modify: `webapp/js/data/jpa/roadmap-part1.js`

**Interfaces:**
- Consumes: `jpaWeeksPart1` từ Task 4; doc id `jpa-07`, `jpa-08`, `jpa-09`.
- Produces: `jpaWeeksPart1` hoàn chỉnh — 7 tuần, 28 mục.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/07-anh-xa-inheritance.md sources/jpa/08-anh-xa-collection-va-entity-association.md sources/jpa/09-anh-xa-entity-association-nang-cao.md
```

- [ ] **Bước 2: Nối tuần 5, 6 và 7 vào cuối mảng, rồi đóng tệp**

**Tuần 5** — `id: "jp-w5"`, `week: "Tuần 5"`, `title: "Bốn chiến lược ánh xạ inheritance"`.

`goal`: Cho một cây thừa kế cụ thể, chọn được một trong bốn chiến lược và bảo vệ lựa chọn đó bằng đánh đổi về schema, về truy vấn đa hình và về ràng buộc `NOT NULL`.

`practice`: Hiện thực cùng một cây thừa kế bằng cả bốn chiến lược chương 7 trình bày. Sinh schema cho từng cách và đặt bốn schema cạnh nhau. Rồi chạy cùng một truy vấn đa hình trên cả bốn và so SQL sinh ra — số bảng, số join, và ràng buộc nào phải hy sinh.

`resources`: `{ label: "JPA 07 — Ánh xạ inheritance", href: "#/docs/jpa-07" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w5-1` | Table per concrete class: đa hình ngầm định và union | ch.7: Table per concrete class với đa hình ngầm định · Table per concrete class với union |
| `jp-w5-2` | Table per class hierarchy và table per subclass với join | ch.7: Table per class hierarchy · Table per subclass với join |
| `jp-w5-3` | Trộn chiến lược, inheritance của embeddable, và cách chọn | ch.7: Trộn các chiến lược inheritance · Inheritance của các class embeddable · Chọn chiến lược |
| `jp-w5-4` | Polymorphic association: many-to-one và collection | ch.7: Polymorphic association (Polymorphic many-to-one association · Polymorphic collection) |

**Tuần 6** — `id: "jp-w6"`, `week: "Tuần 6"`, `title: "Collection: value type, component và association đầu tiên"`.

`goal`: Chọn được đúng interface collection cho một quan hệ cụ thể, và đoán trước được số câu SQL mà việc thêm hoặc xoá một phần tử sẽ sinh ra.

`practice`: Ánh xạ cùng một collection bằng `Set`, rồi `List`, rồi `Map`. Với mỗi cách, bật SQL log và đếm số câu lệnh khi thêm một phần tử và khi xoá một phần tử ở giữa. Giải thích chênh lệch bằng đúng mục trong chương 8 nói về việc chọn interface collection.

`resources`: `{ label: "JPA 08 — Ánh xạ collection và entity association", href: "#/docs/jpa-08" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w6-1` | Schema, chọn interface collection, và ánh xạ một set | ch.8: Set, bag, list và map của value type (Schema cơ sở dữ liệu · Tạo và ánh xạ một property collection · Chọn interface collection · Ánh xạ một set) |
| `jp-w6-2` | Identifier bag, list, map, và collection sắp xếp hay có thứ tự | ch.8: Set, bag, list và map của value type (Ánh xạ một identifier bag · Ánh xạ một list · Ánh xạ một map · Collection được sắp xếp và có thứ tự) |
| `jp-w6-3` | Collection của component và equality của instance component | ch.8: Collection của component (Equality của instance component · Set các component · Bag các component · Map các giá trị component · Component làm khóa của map · Collection trong một embeddable component) |
| `jp-w6-4` | Entity association: đơn giản nhất, hai chiều, và cascade trạng thái | ch.8: Ánh xạ entity association (Association đơn giản nhất có thể · Làm cho nó hai chiều · Cascade trạng thái) |

**Tuần 7** — `id: "jp-w7"`, `week: "Tuần 7"`, `title: "Mọi hình dạng của entity association"`.

`goal`: Ánh xạ được một-một, một-nhiều, nhiều-nhiều và quan hệ bậc ba, và nói được bên nào sở hữu association cùng hệ quả của việc chọn sai bên.

`practice`: Dựng một association một-nhiều hai chiều, cố tình **quên** khai bên sở hữu rồi sửa lại cho đúng. So hai lần: số bảng schema sinh ra, và số câu UPDATE khi thêm một phần tử vào collection. Đây là lỗi hay gặp nhất trong mã Spring Data thật.

`resources`: `{ label: "JPA 09 — Ánh xạ entity association nâng cao", href: "#/docs/jpa-09" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w7-1` | Bốn cách ánh xạ association một-một | ch.9: Association một-một (Dùng chung primary key · Foreign primary key generator · Sử dụng cột foreign key join · Sử dụng join table) |
| `jp-w7-2` | Một-nhiều: bag, list, join table và trong embeddable | ch.9: Association một-nhiều (Cân nhắc bag một-nhiều · Ánh xạ list một chiều và hai chiều · Một-nhiều tùy chọn với join table · Association một-nhiều trong class embeddable) |
| `jp-w7-3` | Nhiều-nhiều, entity trung gian và association bậc ba | ch.9: Association nhiều-nhiều và bậc ba (Association nhiều-nhiều một chiều và hai chiều · Nhiều-nhiều với một entity trung gian · Association bậc ba với component) |
| `jp-w7-4` | Entity association dùng map làm cấu trúc | ch.9: Entity association với map (Một-nhiều với khóa là property · Quan hệ bậc ba kiểu khóa/giá trị) |

Đóng mảng bằng `];`.

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part1`, `<BIẾN>`=`jpaWeeksPart1`, `<SỐ TUẦN>`=`7`, `<SỐ MỤC>`=`28`.

- [ ] **Bước 4: Xác nhận id tuần W1–W7 đủ và đúng thứ tự**

```bash
node --input-type=module -e '
const { jpaWeeksPart1 } = await import("./webapp/js/data/jpa/roadmap-part1.js");
const ids = jpaWeeksPart1.map(w => w.id);
const want = ["jp-w1","jp-w2","jp-w3","jp-w4","jp-w5","jp-w6","jp-w7"];
console.log(JSON.stringify(ids) === JSON.stringify(want) ? "XANH: 7 tuần đúng thứ tự" : "ĐỎ: " + ids);
'
```

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part1.js
git commit -m "feat(jpa): lộ trình đọc tuần 5-7 — inheritance, collection và association

Đóng roadmap-part1.js ở 7 tuần / 28 mục. Tuần 5 là bốn chiến lược inheritance
cùng mục 'Chọn chiến lược' của chính sách; tuần 6 là collection value type và
component; tuần 7 là mọi hình dạng association, chương nhiều hình nhất sách
(19 ảnh).

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 6: Lộ trình tuần 8–9 (ch.10, ch.11) — tạo `roadmap-part2.js`

**Files:**
- Create: `webapp/js/data/jpa/roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `jpa-10`, `jpa-11`.
- Produces: `export const jpaWeeksPart2` — mảng tuần mà Task 7 và 8 nối thêm vào, và Task 9 import vào `roadmap.js`.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/10-quan-ly-du-lieu.md sources/jpa/11-transaction-va-concurrency.md
```

- [ ] **Bước 2: Tạo tệp với đầu tệp**

Tạo `webapp/js/data/jpa/roadmap-part2.js` với khối chú thích đầu tệp (đổi thành `Phần 2 (Tuần 8–13)`) và dòng `export const jpaWeeksPart2 = [`, rồi đóng bằng `];`.

- [ ] **Bước 3: Viết tuần 8**

`id: "jp-w8"`, `week: "Tuần 8"`, `title: "Vòng đời persistence và EntityManager"`.

`goal`: Nói được một entity đang ở trạng thái nào và thao tác nào chuyển nó sang trạng thái nào, và giải thích được vì sao sửa một object đang được quản lý là đủ để dữ liệu xuống database.

`practice`: Tái hiện `LazyInitializationException` bằng cách chạm vào một proxy sau khi persistence context đã đóng. Rồi sửa bằng ba cách khác nhau, và với mỗi cách viết ra cái giá của nó — cách nào kéo thêm dữ liệu, cách nào kéo dài transaction, cách nào đổi thiết kế tầng.

`resources`: `{ label: "JPA 10 — Quản lý dữ liệu", href: "#/docs/jpa-10" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w8-1` | Bốn trạng thái của một instance entity, và persistence context | ch.10: Vòng đời persistence (Các trạng thái của instance entity · Persistence context) |
| `jp-w8-2` | Đơn vị công việc: persist, truy xuất, sửa, reference và remove | ch.10: Interface EntityManager (Đơn vị công việc chuẩn mực · Làm cho dữ liệu trở nên persistent · Truy xuất và sửa đổi dữ liệu persistent · Lấy một reference · Làm cho dữ liệu trở nên transient) |
| `jp-w8-3` | Refresh, replicate, cache trong persistence context và flush | ch.10: Interface EntityManager (Làm mới dữ liệu · Nhân bản dữ liệu · Caching trong persistence context · Flush persistence context) |
| `jp-w8-4` | Trạng thái detached: identity, equals, detach và merge | ch.10: Làm việc với trạng thái detached (Identity của các instance detached · Hiện thực các phương thức equality · Detach các instance entity · Merge các instance entity) |

`jp-w8-1` đã có sẵn bản viết đủ chuẩn ở "Ghi chú chung" — dùng nguyên văn khối đó.

- [ ] **Bước 4: Viết tuần 9**

`id: "jp-w9"`, `week: "Tuần 9"`, `title: "Transaction và điều khiển đồng thời"`.

`goal`: Chặn được lost update bằng optimistic locking, và nói được trường hợp nào bắt buộc phải chuyển sang pessimistic.

`practice`: Cho hai luồng cùng đọc rồi cùng sửa một entity để tái hiện lost update. Chặn nó bằng optimistic locking theo cách chương 11 chỉ, rồi chặn lại bằng pessimistic locking tường minh. So hai lần: hành vi khi xung đột xảy ra, và câu SQL mà mỗi cách sinh ra.

`resources`: `{ label: "JPA 11 — Transaction và concurrency", href: "#/docs/jpa-11" }`.

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w9-1` | ACID, và database transaction so với system transaction | ch.11: Những điều thiết yếu về transaction (Các thuộc tính ACID · Database transaction và system transaction) |
| `jp-w9-2` | Concurrency ở mức database, và kiểm soát lạc quan | ch.11: Điều khiển truy cập đồng thời (Hiểu về concurrency ở mức cơ sở dữ liệu · Kiểm soát đồng thời lạc quan (optimistic)) |
| `jp-w9-3` | Pessimistic locking tường minh và cách tránh deadlock | ch.11: Điều khiển truy cập đồng thời (Pessimistic locking tường minh · Tránh deadlock) |
| `jp-w9-4` | Truy cập phi giao dịch, và transaction với Spring / Spring Data | ch.11: Truy cập dữ liệu phi giao dịch (Đọc dữ liệu ở chế độ auto-commit · Xếp hàng các sửa đổi) · Quản lý transaction với Spring và Spring Data (Transaction propagation · Rollback transaction · Các thuộc tính của transaction · Định nghĩa transaction bằng chương trình · Phát triển có giao dịch với Spring và Spring Data) |

- [ ] **Bước 5: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part2`, `<BIẾN>`=`jpaWeeksPart2`, `<SỐ TUẦN>`=`2`, `<SỐ MỤC>`=`8`.

- [ ] **Bước 6: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part2.js
git commit -m "feat(jpa): lộ trình đọc tuần 8-9 — persistence context và transaction

Tuần 8 là ch.10, cơ chế mà mọi chương ánh xạ trước đó dựa vào: bốn trạng thái
entity, persistence context, flush và merge. Tuần 9 là ch.11: ACID, optimistic
và pessimistic locking, propagation và rollback.

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 7: Lộ trình tuần 10–11 (ch.12 + ch.13, ch.14 + ch.15)

**Files:**
- Modify: `webapp/js/data/jpa/roadmap-part2.js`

**Interfaces:**
- Consumes: `jpaWeeksPart2` từ Task 6; doc id `jpa-12`…`jpa-15`.
- Produces: `jpaWeeksPart2` dài 4 tuần.

- [ ] **Bước 1: Đọc bốn chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/12-fetch-plan-strategy-va-profile.md sources/jpa/13-loc-du-lieu.md sources/jpa/14-tich-hop-jpa-va-hibernate-voi-spring.md sources/jpa/15-lam-viec-voi-spring-data-jdbc.md
```

- [ ] **Bước 2: Nối tuần 10 và tuần 11 vào cuối mảng `jpaWeeksPart2`**

**Tuần 10** — `id: "jp-w10"`, `week: "Tuần 10"`, `title: "Hibernate làm gì sau lưng bạn"`.

`goal`: Giải thích được vì sao một vòng lặp trên collection sinh ra N+1 câu SQL, chữa được bằng ít nhất hai cách, và biết cơ chế nào đang chen vào giữa mã của bạn với database.

`practice`: Bật `hibernate.generate_statistics`, tái hiện vấn đề n+1 selects đúng như chương 12 mô tả. Chữa bằng cách fetch kèm join, rồi chữa lại bằng entity graph. Đếm số query trước và sau mỗi cách, và ghi lại cách nào kéo về bao nhiêu dữ liệu thừa.

`resources`:
```js
    resources: [
      { label: "JPA 12 — Fetch plan, strategy và profile", href: "#/docs/jpa-12" },
      { label: "JPA 13 — Lọc dữ liệu", href: "#/docs/jpa-13" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w10-1` | Proxy, collection lazy, eager loading và vấn đề n+1 selects | ch.12: Lazy loading và eager loading (Hiểu về entity proxy · Persistent collection lazy · Eager loading association và collection) · Chọn fetch strategy (Vấn đề n+1 selects) |
| `jp-w10-2` | Tích Descartes, bốn cách prefetch, fetch profile và entity graph | ch.12: Chọn fetch strategy (Vấn đề tích Descartes · Prefetch dữ liệu theo lô · Prefetch collection bằng subselect · Eager fetching bằng nhiều lệnh SELECT · Eager fetching động) · Sử dụng fetch profile (Khai báo fetch profile của Hibernate · Làm việc với entity graph) |
| `jp-w10-3` | Cascade các chuyển đổi trạng thái, và chặn sự kiện | ch.13: Cascade các chuyển đổi trạng thái (Các tùy chọn cascade khả dụng · Detach và merge bắc cầu · Cascade refresh · Cascade replication) · Lắng nghe và chặn sự kiện (Event listener và callback của JPA · Hiện thực Hibernate interceptor · Hệ thống sự kiện lõi) |
| `jp-w10-4` | Auditing bằng Envers, và data filter động | ch.13: Auditing và versioning với Hibernate Envers (Bật audit logging · Tạo audit trail · Tìm các revision · Truy cập dữ liệu lịch sử) · Data filter động (Định nghĩa · Áp dụng · Bật data filter động · Lọc việc truy cập collection) |

**Tuần 11** — `id: "jp-w11"`, `week: "Tuần 11"`, `title: "Ráp vào Spring bằng tay, và một lựa chọn nhẹ hơn"`.

`goal`: Viết được tầng persistence bằng mẫu DAO mà không có Spring Data, để hiểu Spring Data giấu đi cái gì — rồi so nó với Spring Data JDBC, nơi không có persistence context.

`practice`: Chuyển một repository Spring Data JPA sang Spring Data JDBC. So hai bên ở hai điểm chương 15 nhấn: cách mô hình hoá quan hệ, và SQL sinh ra khi đọc một đối tượng có collection con.

`resources`:
```js
    resources: [
      { label: "JPA 14 — Tích hợp JPA và Hibernate với Spring", href: "#/docs/jpa-14" },
      { label: "JPA 15 — Làm việc với Spring Data JDBC", href: "#/docs/jpa-15" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w11-1` | Dependency injection và ứng dụng JPA dùng Spring theo mẫu DAO | ch.14: Spring Framework và dependency injection · Ứng dụng JPA dùng Spring và mẫu DAO · Tổng quát hóa ứng dụng JPA dùng Spring và DAO |
| `jp-w11-2` | Cùng hai bước ấy cho ứng dụng Hibernate native | ch.14: Ứng dụng Hibernate dùng Spring và mẫu DAO · Tổng quát hóa ứng dụng Hibernate dùng Spring và DAO |
| `jp-w11-3` | Dựng dự án Spring Data JDBC và truy vấn trong nó | ch.15: Tạo một dự án Spring Data JDBC · Làm việc với truy vấn trong Spring Data JDBC (Định nghĩa query method · Giới hạn kết quả truy vấn, sắp xếp và phân trang · Streaming kết quả · Annotation @Query · Modifying query) |
| `jp-w11-4` | Mô hình hoá quan hệ với Spring Data JDBC | ch.15: Mô hình hóa quan hệ với Spring Data JDBC (một-một · embedded entity · một-nhiều · nhiều-nhiều) |

- [ ] **Bước 3: Chạy script tự kiểm — kỳ vọng XANH**

`<PART>`=`part2`, `<BIẾN>`=`jpaWeeksPart2`, `<SỐ TUẦN>`=`4`, `<SỐ MỤC>`=`16`.

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part2.js
git commit -m "feat(jpa): lộ trình đọc tuần 10-11 — fetch plan, lọc dữ liệu và tầng DAO

Tuần 10 ghép ch.12 + ch.13 vì cả hai nói về hành vi lúc chạy chứ không phải
ánh xạ tĩnh: n+1 selects, tích Descartes, entity graph, rồi cascade, Envers
và data filter. Tuần 11 ghép ch.14 + ch.15: mẫu DAO viết tay, rồi Spring Data
JDBC không persistence context.

Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 8: Lộ trình tuần 12–13 (ch.16 + ch.17, ch.18 + ch.19 + ch.20) — đóng `roadmap-part2.js`

**Files:**
- Modify: `webapp/js/data/jpa/roadmap-part2.js`

**Interfaces:**
- Consumes: `jpaWeeksPart2` từ Task 7; doc id `jpa-16`…`jpa-20`.
- Produces: `jpaWeeksPart2` hoàn chỉnh — 6 tuần, 24 mục.

- [ ] **Bước 1: Đọc năm chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' sources/jpa/16-lam-viec-voi-spring-data-rest.md sources/jpa/17-lam-viec-voi-spring-data-mongodb.md sources/jpa/18-lam-viec-voi-hibernate-ogm.md sources/jpa/19-truy-van-jpa-voi-querydsl.md sources/jpa/20-kiem-thu-ung-dung-java-persistence.md
```

- [ ] **Bước 2: Nối tuần 12 và tuần 13 vào cuối mảng, rồi đóng tệp**

**Tuần 12** — `id: "jp-w12"`, `week: "Tuần 12"`, `title: "Phơi dữ liệu ra REST, và rời khỏi SQL"`.

`goal`: Phơi được một repository thành REST endpoint có kiểm soát, và dùng được cùng mô hình lập trình Spring Data trên một database document.

`practice`: Phơi một repository qua Spring Data REST. Gửi một yêu cầu có `If-None-Match` để thấy server trả 304 đúng như chương 16 mô tả. Rồi giới hạn field trả về bằng projection, và kiểm lại phản hồi đã đổi.

`resources`:
```js
    resources: [
      { label: "JPA 16 — Làm việc với Spring Data REST", href: "#/docs/jpa-16" },
      { label: "JPA 17 — Làm việc với Spring Data MongoDB", href: "#/docs/jpa-17" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w12-1` | Ứng dụng REST, và dựng một ứng dụng Spring Data REST | ch.16: Giới thiệu ứng dụng REST · Tạo một ứng dụng Spring Data REST |
| `jp-w12-2` | ETag, giới hạn truy cập, REST event, projection và excerpt | ch.16: Dùng ETag cho các yêu cầu có điều kiện · Giới hạn truy cập tới repository, phương thức và field · Làm việc với REST event (Viết một AnnotatedHandler · Viết một ApplicationListener) · Sử dụng projection và excerpt |
| `jp-w12-3` | MongoDB, Spring Data MongoDB và MongoRepository | ch.17: Giới thiệu MongoDB · Giới thiệu Spring Data MongoDB · Dùng MongoRepository để truy cập cơ sở dữ liệu (query method · giới hạn, sắp xếp và phân trang · streaming · @Query) |
| `jp-w12-4` | Query by Example, tham chiếu document, và MongoTemplate | ch.17: Query by Example · Tham chiếu tới các document MongoDB khác · Dùng MongoTemplate để truy cập cơ sở dữ liệu (Cấu hình truy cập · Thực thi các thao tác CRUD) |

**Tuần 13** — `id: "jp-w13"`, `week: "Tuần 13"`, `title: "Khả chuyển NoSQL, truy vấn kiểu an toàn, và kiểm thử"`.

`goal`: Viết được truy vấn mà trình biên dịch kiểm được thay vì để lỗi tới lúc chạy, và viết được test cho tầng persistence không rò rỉ trạng thái giữa các test.

`practice`: Viết bộ test cho tầng persistence bằng Spring TestContext Framework, dùng `@Transactional` và `@DirtiesContext` theo đúng cách chương 20 chỉ. Chạy chúng trên một database thật trong container thay vì database in-memory, rồi chạy hai lần liên tiếp để chứng minh không có trạng thái rò rỉ.

`resources`:
```js
    resources: [
      { label: "JPA 18 — Làm việc với Hibernate OGM", href: "#/docs/jpa-18" },
      { label: "JPA 19 — Truy vấn JPA với Querydsl", href: "#/docs/jpa-19" },
      { label: "JPA 20 — Kiểm thử ứng dụng Java persistence", href: "#/docs/jpa-20" },
    ],
```

| Mục | `text` | Mục con nguồn |
|---|---|---|
| `jp-w13-1` | Hibernate OGM: cùng mã JPA trên MongoDB rồi trên Neo4j | ch.18: Giới thiệu Hibernate OGM · Xây dựng một ứng dụng Hibernate OGM đơn giản với MongoDB (Cấu hình · Tạo các entity · Dùng ứng dụng với MongoDB) · Chuyển sang cơ sở dữ liệu NoSQL Neo4j |
| `jp-w13-2` | Querydsl: dựng dự án, và lọc, sắp xếp, nhóm dữ liệu | ch.19: Giới thiệu Querydsl · Tạo một ứng dụng Querydsl (Cấu hình · Tạo các entity · Tạo dữ liệu test để truy vấn) · Truy vấn cơ sở dữ liệu với Querydsl (Lọc dữ liệu · Sắp xếp dữ liệu · Nhóm dữ liệu và làm việc với hàm tổng hợp) |
| `jp-w13-3` | Subquery, join, cập nhật và xoá bằng Querydsl; kim tự tháp kiểm thử | ch.19: Truy vấn cơ sở dữ liệu với Querydsl (Làm việc với subquery và join · Cập nhật entity · Xóa entity) · ch.20: Giới thiệu kim tự tháp kiểm thử · Tạo ứng dụng persistence để kiểm thử |
| `jp-w13-4` | Spring TestContext: @DirtiesContext, @Transactional, profile và listener | ch.20: Dùng Spring TestContext Framework · Annotation @DirtiesContext · Thực thi với @Transactional · Annotation @BeforeTransaction và @AfterTransaction · Làm việc với Spring profile · Làm việc với test execution listener |

**Nhắc lại Global Constraint:** `jp-w13-1` **không** được nhắc việc Hibernate OGM đã ngưng phát triển. Ghi chú đó nằm ở `fieldGuides.jpa.pitfalls`, đúng một chỗ. Khối **Đọc** và **Bẫy** của mục này chỉ nói những gì chương 18 nói.

Đóng mảng bằng `];`.

- [ ] **Bước 3: Chạy script tự kiểm cho cả hai tệp — kỳ vọng XANH**

Part 2: `<PART>`=`part2`, `<BIẾN>`=`jpaWeeksPart2`, `<SỐ TUẦN>`=`6`, `<SỐ MỤC>`=`24`.
Rồi chạy lại cho part 1: `<PART>`=`part1`, `<BIẾN>`=`jpaWeeksPart1`, `<SỐ TUẦN>`=`7`, `<SỐ MỤC>`=`28`.

- [ ] **Bước 4: Xác nhận 13 tuần và 52 mục phủ đủ, không trùng**

```bash
node --input-type=module -e '
const p1 = await import("./webapp/js/data/jpa/roadmap-part1.js");
const p2 = await import("./webapp/js/data/jpa/roadmap-part2.js");
const weeks = [...p1.jpaWeeksPart1, ...p2.jpaWeeksPart2];
const items = weeks.flatMap(w => w.items);
const wantW = Array.from({length:13}, (_,i) => `jp-w${i+1}`);
const bad = [];
if (JSON.stringify(weeks.map(w=>w.id)) !== JSON.stringify(wantW)) bad.push("id tuần: " + weeks.map(w=>w.id).join(","));
if (items.length !== 52) bad.push("mục: " + items.length + " ≠ 52");
const ids = items.map(i=>i.id);
const dup = ids.filter((v,i,a)=>a.indexOf(v)!==i);
if (dup.length) bad.push("id trùng: " + dup);
const refs = new Set(items.flatMap(i => [...i.lesson.matchAll(/#\/docs\/(jpa-\d+)/g)].map(m=>m[1])));
const missing = Array.from({length:20},(_,i)=>`jpa-${String(i+1).padStart(2,"0")}`).filter(d => !refs.has(d));
if (missing.length) bad.push("chương không mục nào trỏ tới: " + missing.join(","));
console.log(bad.length ? "ĐỎ:\n  " + bad.join("\n  ") : "XANH: 13 tuần, 52 mục, cả 20 chương đều được trỏ tới");
'
```

Kỳ vọng XANH. Nếu `missing` không rỗng, một chương đã bị bỏ quên — quay lại tuần phụ trách nó.

- [ ] **Bước 5: Chạy kiểm dữ liệu — phải vẫn xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/jpa/roadmap-part2.js
git commit -m "feat(jpa): lộ trình đọc tuần 12-13 — REST, MongoDB, Querydsl và kiểm thử

Đóng roadmap-part2.js ở 6 tuần / 24 mục, tổng lộ trình 13 tuần / 52 mục.
Tuần 12 ghép ch.16 + ch.17; tuần 13 gom ba chương nhẹ nhất sách (ch.18, 19,
20) và kết bằng kiểm thử tầng persistence.

Cả 20 chương đều có ít nhất một mục lộ trình trỏ tới.
Tệp chưa được roadmap.js import — app chưa đổi."
```

---

## Task 9: Bật track `jpa`

**Files:**
- Modify: `webapp/js/data/roadmap.js`, `webapp/js/data/fields.js`, `webapp/js/data/guides.js`, `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `jpaWeeksPart1` và `jpaWeeksPart2` từ Task 3–8; `FIELDS.jpa` từ Task 2.
- Produces: track id `jpa` mà `fieldGuides.jpa.steps` trỏ tới qua `#/roadmap/jpa`, và Task 10 nhắc trong README.

Sáu thay đổi dưới đây phải **cùng một commit**: bất biến #7 chặn khai module `roadmap` khi chưa có dữ liệu, #7b chặn có dữ liệu mà chưa khai module, G1 đòi mọi track có `trackGuides`. Làm lẻ một nửa là đỏ.

- [ ] **Bước 1: Thêm import vào `roadmap.js`**

Cạnh các import khác, sau hai dòng `ocnj`:

```js
import { jpaWeeksPart1 } from "./jpa/roadmap-part1.js";
import { jpaWeeksPart2 } from "./jpa/roadmap-part2.js";
```

- [ ] **Bước 2: Cập nhật khối chú thích đầu `roadmap.js`**

Khối đó là tài liệu sống. Hai chỗ phải sửa:

1. Câu liệt kê track ở đầu — thêm `đọc sách Java Persistence with Spring Data and Hibernate` vào danh sách, ngay sau `đọc sách Optimizing Cloud Native Java`, trước `và 4 giai đoạn của Lộ trình Senior Java`.
2. Bảng tệp — thêm dòng sau dòng `ocnj/`, canh cột như các dòng có sẵn:

```
//   jpa/roadmap-part{1,2}.js                (Tuần 1–7 / 8–13)       — 52 mục
```

- [ ] **Bước 3: Đăng ký track trong mảng `tracks`**

**Đọc track `ocnj` ngay phía trên trước khi viết** — nếu nó có trường nào ngoài bảng dưới đây, copy đúng hình dạng đó. Thêm sau track `ocnj`:

```js
  {
    id: "jpa",
    field: "jpa",
    label: "Java Persistence",
    icon: "🗃️",
    name: "Đọc Java Persistence with Spring Data and Hibernate",
    durationWeeks: 13,
    desc: "Kế hoạch đọc 13 tuần bám theo bản dịch đủ 20 chương: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra; cả mười ba tuần đều có bài thực hành gõ tay — dựng cùng một Hello World bằng ba cách, đọc DDL Hibernate sinh ra, so ba chiến lược sinh id, viết converter, hiện thực một cây thừa kế bằng cả bốn chiến lược, đếm câu lệnh khi đổi interface collection, tái hiện LazyInitializationException, chặn lost update bằng optimistic rồi pessimistic lock, đếm query trước và sau khi chữa n+1, chuyển một repository sang Spring Data JDBC, thử ETag, và viết test persistence chạy trên database thật trong container.",
    prereq: "Yêu cầu: đọc và viết được SQL ở mức join và index — sách nói thẳng ở chương 1 rằng nắm vững mô hình quan hệ và SQL là điều kiện tiên quyết. Chạy được một ứng dụng Spring Boot thật để gõ theo từng chương, và có một SQL database chạy được cục bộ hoặc qua Docker vì gần như mọi tuần đều đọc SQL do Hibernate sinh ra. Docker cho chương 17 và 18 (MongoDB và Neo4j). Tên package và giá trị mặc định của Hibernate cùng Spring Data đổi theo phiên bản: đọc để hiểu cơ chế, còn cấu hình thì tra lại theo phiên bản bạn đang chạy.",
    weeks: [...jpaWeeksPart1, ...jpaWeeksPart2],
  },
```

- [ ] **Bước 4: Mở module `roadmap` trong `fields.js`**

Trong `FIELDS.jpa`, đổi `modules` và **xoá dòng chú thích** "Module roadmap mở ở Task 9…":

```js
    modules: ["dashboard", "guide", "docs", "roadmap"],
```

- [ ] **Bước 5: Thêm `trackGuides.jpa` vào `guides.js`**

Đặt sau khối `trackGuides.ocnj`:

```js
  jpa: {
    rhythm: "13 tuần, 4 mục mỗi tuần bám đủ 20 chương theo thứ tự sách; cả mười ba tuần đều có bài gõ tay. Đọc mục được chỉ (45–60 phút) → gõ ví dụ vào dự án xuyên suốt của bạn → bật SQL log và đối chiếu với điều chương vừa nói → trả lời tự kiểm tra → tick.",
    before: [
      "Đọc và viết được SQL ở mức join và index — chương 1 nói thẳng đây là điều kiện tiên quyết của cả cuốn sách.",
      "Một dự án Spring Boot trống để giữ xuyên suốt 13 tuần; đừng dựng dự án mới mỗi chương.",
      "Một SQL database chạy được cục bộ hoặc qua Docker, và `spring.jpa.show-sql` đã bật từ tuần 1.",
      "Docker cho tuần 12 và 13 — chương 17 cần MongoDB, chương 18 cần cả MongoDB lẫn Neo4j.",
    ],
    during: [
      "Bật SQL log rồi mới đọc. Gần như mọi chương ánh xạ kết thúc bằng một câu hỏi kiểm được: schema sinh ra trông thế nào, và một thao tác sinh ra mấy câu lệnh.",
      "Tuần 8 (chương 10) là bản lề: persistence context là cơ chế mà chương 11 về transaction và chương 12 về lazy loading đều đứng lên trên. Đọc lướt tuần này là ba tuần sau không hiểu gì.",
      "Giữ lại schema và SQL log của từng tuần. Tuần 10 về n+1 chỉ có nghĩa khi đặt cạnh các ánh xạ association bạn viết ở tuần 6 và 7.",
      "Tuần 5 hiện thực cùng một cây thừa kế bằng cả bốn chiến lược. Nghe thừa nhưng đó là cách duy nhất để mục \"Chọn chiến lược\" của chương 7 trở thành hiểu biết thay vì một bảng thuộc lòng.",
      "Tên package và giá trị mặc định trong sách gắn với một phiên bản cụ thể. Đọc để hiểu cơ chế, rồi tra lại theo phiên bản của bạn — Hibernate ORM documentation ở chân thanh bên.",
    ],
    after: [
      "Mở lại một dự án Spring Data JPA cũ của bạn, bật SQL log, và tìm ít nhất một chỗ đang sinh n+1 hoặc đang giữ transaction dài hơn cần thiết.",
      "Sang lĩnh vực Java & Spring Boot Scalability — chặng tiếp theo trên con đường Java Backend, nơi bẫy @Transactional và việc sizing connection pool được nhìn từ phía vận hành.",
      "Đọc lại chương 11 khi bạn gặp một sự cố đồng thời thật; nó đọc khác hẳn khi đã có một lost update trong log.",
    ],
  },
```

- [ ] **Bước 6: Viết lại `fieldGuides.jpa.steps` để trỏ track**

Task 2 để mọi `step` ở `done: { kind: "manual" }` vì track chưa tồn tại. Giờ track đã có — thay bốn step cuối. Mốc `pct` rơi vào ranh giới tuần: sau W2 là 2/13 ≈ 15%, sau W7 là 7/13 ≈ 54%, sau W10 là 10/13 ≈ 77%, sau W13 là 100%.

```js
      { id: "jp-1", title: "Dựng chỗ chạy và bật SQL log", desc: "Một dự án Spring Boot trống nối tới một SQL database thật, với `spring.jpa.show-sql` đã bật. Bạn sẽ đọc SQL sinh ra ở gần như mọi tuần — không bật nó thì nửa giá trị cuốn sách biến mất.", done: { kind: "manual" } },
      { id: "jp-2", title: "Tuần 1–2: vì sao cần ORM, và repository đầu tiên", desc: "Paradigm mismatch qua năm mặt của nó, ba cách viết \"Hello World\", domain model CaveatEmptor và metadata, rồi toàn bộ cách lấy dữ liệu bằng Spring Data JPA.", href: "#/roadmap/jpa", done: { kind: "track", id: "jpa", pct: 15 } },
      { id: "jp-3", title: "Tuần 3–7: ánh xạ", desc: "Entity với value type và identity, ánh xạ property và embeddable và converter, bốn chiến lược inheritance, collection, rồi mọi hình dạng association. Phần dày nhất sách và là nơi quyết định schema bạn sẽ sống chung nhiều năm.", href: "#/roadmap/jpa", done: { kind: "track", id: "jpa", pct: 54 } },
      { id: "jp-4", title: "Tuần 8–10: cơ chế lúc chạy", desc: "Persistence context và vòng đời entity, transaction và điều khiển đồng thời, rồi fetch plan cùng các cơ chế cascade, Envers và filter. Kết thúc tuần 10 bạn giải thích được vì sao một đoạn mã sinh ra một nghìn câu SQL.", href: "#/roadmap/jpa", done: { kind: "track", id: "jpa", pct: 77 } },
      { id: "jp-5", title: "Tuần 11–13: ráp vào Spring và kiểm thử", desc: "Mẫu DAO viết tay, Spring Data JDBC, Spring Data REST, MongoDB, Hibernate OGM, Querydsl, và kiểm thử tầng persistence bằng Spring TestContext.", href: "#/roadmap/jpa", done: { kind: "track", id: "jpa", pct: 100 } },
```

- [ ] **Bước 7: Thêm số đếm lộ trình vào `check-data.mjs`**

Ngay dưới `"docs:jpa": 20` đã thêm ở Task 2:

```js
    "roadmap-items:jpa": 52,
```

- [ ] **Bước 8: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`.

Nếu **#3b** đỏ (link `#/docs/…` trong lộ trình không cùng con đường với track): một `lesson` link sang lĩnh vực khác — quy tắc 4 ở "Ghi chú chung" cấm điều đó.
Nếu **#7/#7b** đỏ: Bước 3 và Bước 4 không cùng commit.
Nếu **G1** đỏ: thiếu `trackGuides.jpa`, hoặc `fieldGuides.jpa.steps` trỏ `id` track sai.
Nếu số đếm đỏ: đối chiếu `52` với kết quả script ở Task 8 Bước 4.

- [ ] **Bước 9: Xác nhận số liệu mới**

```bash
node --input-type=module -e '
const { tracks } = await import("./webapp/js/data/roadmap.js");
const { docs } = await import("./webapp/js/data/docs-index.js");
const { FIELDS } = await import("./webapp/js/data/fields.js");
console.log("lĩnh vực:", Object.keys(FIELDS).length, "| tài liệu:", docs.length,
            "| track:", tracks.length, "| mục:", tracks.flatMap(t=>t.weeks.flatMap(w=>w.items||[])).length);
'
```

Kỳ vọng: `lĩnh vực: 14 | tài liệu: 262 | track: 21 | mục: 998`.

- [ ] **Bước 10: Commit**

```bash
git add -A
git commit -m "feat(jpa): bật lộ trình đọc Java Persistence — 13 tuần / 52 mục

Track thứ 21 của DevPrep, tiền tố id jp-. Mốc % của fieldGuides.steps rơi
đúng ranh giới tuần: 15% sau tuần 2, 54% sau tuần 7 (hết phần ánh xạ), 77%
sau tuần 10 (hết phần cơ chế lúc chạy). Module roadmap của lĩnh vực mở cùng
commit này — bất biến #7/#7b không cho tách.

13 tuần thay vì khuôn 12 tuần quen thuộc: phương án 12 tuần dồn bốn chương
17-20 vào tuần cuối ở 21.250 từ, cao hơn mọi tuần của phương án 13 tuần.

Số liệu: 14 lĩnh vực, 262 tài liệu, 21 track, 998 mục lộ trình."
```

---

## Task 10: Liên kết chéo và cập nhật tài liệu repo

**Files:**
- Modify: `webapp/js/data/related.js`, `README.md`, `sources/README.md`

**Interfaces:**
- Consumes: doc id `jpa-01`…`jpa-20` từ Task 2; track `jpa` từ Task 9.
- Produces: không gì (task cuối).

- [ ] **Bước 1: Thêm 9 khoá liên kết chéo vào `related.js`**

Khai **một chiều** từ `jpa`; `lib/labels.js` (`relatedOf`) phản chiếu hai chiều khi đọc. Thêm khối này với dòng phân nhóm như các khối khác trong tệp:

```js
  // ---- Java Persistence ↔ ddia (lý thuyết dữ liệu), java (bẫy production),
  //      spring-start (nhập môn Spring), jcip (race condition), spring-security ----
  "jpa-01": ["ddia-03"],                                      // paradigm mismatch ↔ mô hình dữ liệu và ngôn ngữ truy vấn
  "jpa-04": ["springstart-14"],                               // Spring Data JPA đầy đủ ↔ lưu trữ dữ liệu với Spring Data nhập môn
  "jpa-10": ["java-09"],                                      // persistence context ↔ Connection trong ThreadLocal, cùng một ranh giới transaction
  "jpa-11": ["ddia-08", "java-10", "springstart-13", "jcip-02"], // transaction ↔ isolation lý thuyết; bẫy production; nhập môn; lost update ↔ check-then-act
  "jpa-12": ["java-08"],                                      // n+1 và fetch strategy ↔ giữ connection quá lâu khi sizing pool
  "jpa-14": ["springstart-06", "springstart-12"],             // mẫu DAO ↔ Spring AOP; ↔ data source
  "jpa-16": ["springstart-10", "springsec-11"],               // Spring Data REST ↔ REST service viết tay; ↔ phân quyền cấp phương thức
  "jpa-17": ["ddia-03"],                                      // tham chiếu document ↔ mô hình document so với quan hệ
  "jpa-20": ["springstart-15"],                               // kiểm thử persistence ↔ kiểm thử ứng dụng Spring
```

Mắt xích đáng chú ý nhất là `jpa-11` → `jcip-02`: lost update ở tầng database và check-then-act ở tầng bộ nhớ là **cùng một lớp lỗi ở hai tầng**, và cùng một cách chữa là biến kiểm-rồi-ghi thành một thao tác nguyên tử.

`jpa-01` và `jpa-17` cùng trỏ `ddia-03` — hợp lệ, bất biến R1 chỉ chặn trùng **trong cùng một mảng**. `jpa-11` → `ddia-08` là **xuyên con đường** (sang `data`), có tiền lệ `java-10` → `ddia-08`.

- [ ] **Bước 2: Cập nhật `README.md` gốc — bốn chỗ**

1. **Cây thư mục** (khối ```` ``` ```` quanh dòng 88): thêm `jpa/` vào dòng liệt kê các thư mục con của `sources/`, sau `ocnj/`.
2. **Đoạn liệt kê bản dịch** (dòng 103): thêm `bản dịch **Java Persistence with Spring Data and Hibernate**,` sau `bản dịch **Optimizing Cloud Native Java**,`; và sửa `cả mười ba lĩnh vực` → `cả mười bốn lĩnh vực`.
3. **Bảng nguồn**: thêm hàng sau hàng `sources/ocnj/`:

```markdown
| [`sources/jpa/`](./sources/jpa/) | Bản dịch tiếng Việt *Java Persistence with Spring Data and Hibernate* (Cătălin Tudose — Manning) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. Đủ 20 chương, 127 hình. Đọc trong app ở lĩnh vực Java Persistence with Spring Data and Hibernate, kèm lộ trình đọc 13 tuần. |
```

4. **Hàng `webapp/`** (dòng 125): sửa các số — `13 lĩnh vực` → `14 lĩnh vực` (**hai chỗ trong cùng câu**), `20 giáo trình, 946 mục` → `21 giáo trình, 998 mục`, `242 tài liệu` → `262 tài liệu`.

Kiểm lại bằng:

```bash
grep -n "mười ba lĩnh vực\|13 lĩnh vực\|242 tài liệu\|20 giáo trình\|946 mục" README.md
```

Kỳ vọng: không dòng nào.

- [ ] **Bước 3: Cập nhật `sources/README.md`**

Thêm hàng vào bảng "Bản đồ hiện tại", sau hàng `ocnj`:

```markdown
| `jpa` | `jpa/` | Bản dịch *Java Persistence with Spring Data and Hibernate* (Tudose — Manning) — 20 chương, 127 ảnh, PDF |
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — kỳ vọng XANH**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `49/49 bất biến đạt`. Nếu **R1** đỏ: một id trong Bước 1 không tồn tại, tự trỏ, lặp, hoặc cùng lĩnh vực — đọc tên id mà bất biến in ra.

- [ ] **Bước 5: Kiểm bằng mắt trong app**

```bash
webapp/scripts/dev.sh
```

Mở app, chọn lĩnh vực **Java Persistence with Spring Data and Hibernate**, xác nhận:

- Thanh bên có đúng 4 mục: Bảng điều khiển, Hướng dẫn học, Lộ trình học, Tài liệu.
- Thư viện hiện **20 tài liệu trong một danh sách phẳng, không nhóm Phần** (vì `part` là `null`), nhãn dạng "Ch. N · …".
- Mở `jpa-09` (19 ảnh, nhiều nhất) và `jpa-08` (16 ảnh) — ảnh hiện đủ. Mở `jpa-13`, `jpa-15` và `jpa-19` (1 ảnh mỗi chương) — không vỡ bố cục.
- Mở `jpa-04`, `jpa-16` và `jpa-20` — khối mã render đúng, các dòng `# Ⓐ` trong khối mã **không** bị biến thành tiêu đề.
- Lộ trình hiện 13 tuần, mỗi tuần 4 mục, và **mọi tuần đều có bài thực hành**.
- Chân thanh bên có link "hibernate.org — ORM documentation".
- Thẻ Con đường trên bảng điều khiển hiện JPA ở **chặng 6 trên 9** của Java Backend.
- Mở `jpa-11` và xác nhận khối "đọc liên quan" hiện DDIA, Java Scalability, Spring Start Here và JCiP.

- [ ] **Bước 6: Commit**

```bash
git add -A
git commit -m "feat(jpa): liên kết chéo và cập nhật tài liệu repo

9 khoá / 14 liên kết một chiều từ jpa sang ddia, java, spring-start, jcip và
spring-security. Mắt xích đáng giá nhất: jpa-11 → jcip-02, lost update ở tầng
database và check-then-act ở tầng bộ nhớ là cùng một lớp lỗi ở hai tầng, cùng
một cách chữa là biến kiểm-rồi-ghi thành thao tác nguyên tử.

README gốc và sources/README.md cập nhật số liệu: 14 lĩnh vực, 262 tài liệu,
21 track, 998 mục lộ trình."
```

---

## Kiểm chứng cuối cùng

Sau Task 10, chạy một lần nữa từ gốc repo:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
```

Kỳ vọng: `49/49 bất biến đạt` và `Dữ liệu hợp lệ.`

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Lĩnh vực | 13 | **14** |
| Tài liệu | 242 | **262** |
| Track lộ trình | 20 | **21** |
| Mục lộ trình | 946 | **998** |
| Markdown trong `content/` | 254 | **275** |
| Ảnh trong `content/` | 1204 | **1331** |

Markdown tăng **21** chứ không phải 20: ngoài 20 chương còn có `sources/jpa/README.md` do Task 1
viết, và `build-content.sh` sao chép README của mọi nguồn (`content/` có 12 README).

Hai dòng cuối kiểm bằng:

```bash
echo "md: $(find webapp/content -name '*.md' | wc -l)"
echo "img: $(find webapp/content -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' -o -name '*.svg' -o -name '*.webp' \) | wc -l)"
```
