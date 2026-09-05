# Kafka: The Definitive Guide — Lĩnh vực mới của DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Kafka: The Definitive Guide* ấn bản 2, chương 2–14, vào web app DevPrep thành lĩnh vực `kafka`, với module `docs` (13 tài liệu) và `roadmap` (giáo trình đọc 11 tuần / 44 mục).

**Architecture:** DevPrep là web app tĩnh, không build, không dependency. Thêm một lĩnh vực = thêm dữ liệu thuần, không sửa view nào: `fields.js` là nguồn sự thật duy nhất, `dashboard.js` và sidebar đọc thẳng từ đó. Nội dung markdown nằm trong repo, `build-content.sh` copy sang `webapp/content/` lúc dev/deploy. Toàn bộ nghiệm thu tự động do `webapp/check-data.mjs` đảm nhiệm.

**Tech Stack:** JavaScript ES modules thuần (không framework, không bundler) · Node.js ≥ 18 để chạy `check-data.mjs` · bash cho `build-content.sh` · python3 `http.server` cho dev.

**Spec:** [`docs/superpowers/specs/2026-09-05-kafka-integration-design.md`](../specs/2026-09-05-kafka-integration-design.md)

**Kế hoạch chị em:** [`2026-09-05-spring-start-integration.md`](2026-09-05-spring-start-integration.md) — lĩnh vực `spring-start`, độc lập hoàn toàn, **thứ tự làm không ràng buộc**. Xem Task 8 về cách xử lý số liệu tài liệu.

## Global Constraints

Mọi task đều ngầm chịu các ràng buộc sau. Đọc kỹ trước khi bắt đầu bất kỳ task nào.

- **Mọi `id` là khoá localStorage lưu tiến độ người dùng — không bao giờ đổi sau khi đã commit.** Áp dụng cho `kafka-02`…`kafka-14`, `kf-w1`…`kf-w11`, `kf-w1-1`…`kf-w11-4`, và mọi id sẵn có của lĩnh vực khác.
- **Doc id bắt đầu từ `kafka-02`, KHÔNG có `kafka-01`.** Bản dịch chỉ có chương 2–14. Số id khớp số chương sách là cố ý (spec §2 quyết định #3) — **không đánh lại thành 01–13**.
- **Ảnh giữ nguyên bố cục PHẲNG.** 47 ảnh nằm trực tiếp trong `kafka-vi/images/` với tên `hinh-<chương>-<số>.png`, **không có thư mục con `chNN`**. Khác MJIA. Sắp xếp lại sẽ làm gãy toàn bộ đường dẫn và #2b đỏ 47 lần.
- **Không viết bất biến mới trong `check-data.mjs`.** Chỉ mở rộng bảng `EXPECTED.counts`. Không nới, không thêm allowlist, không sửa bất biến hiện có.
- **Không copy `.pdf` sang `webapp/content/`.**
- **Không sửa view nào** (`webapp/js/views/*.js`) ngoài một dòng chú thích ở `views/roadmap.js` (Task 8).
- **Không thêm link `#/docs/<id>` xuyên lĩnh vực.** Bất biến #3b quét cả `week.resources[].href` lẫn `item.lesson`. Chip từ lĩnh vực khác chỉ ở mức track (`#/roadmap/kafka`).
- **SÁU CHỖ CODE BỊ PDF GỐC CẮT CỤT — không được dùng làm bài tập, không được suy đoán phần thiếu** (spec §1.2): ch.3 lệnh `kafka-configs ... --add-config 'producer_byte_` · ch.4 dòng `throw new SerializationException("Error when deserializing " +` · ch.9 lệnh `echo '{"name":"dump-kafka-config"...` và output Elasticsearch · ch.10 lệnh `kafka-consumer-groups.sh ... --reset-offsets --al` · ch.11 ba dòng log mục Auditing · ch.12 các dòng `Configs: segment.bytes=1`, `kafka.host2.dom`, `among 1 parti`.
- **Ngôn ngữ nội dung: tiếng Việt.** Thuật ngữ giữ nguyên tiếng Anh đúng như bản dịch giữ (broker, topic, partition, offset, replica, ISR, consumer group, rebalance, serializer, exactly-once, log compaction, MirrorMaker, Kafka Streams, ACL, SASL…).
- **Khối "Đọc" trỏ anchor vào bản dịch, không chép lại nội dung sách.** Tên mục trích **nguyên văn** tiêu đề `##`/`###` trong tệp nguồn, kể cả phần tiếng Anh trong ngoặc (vd `Cấu hình broker (Configuring the Broker)`).
- **Khối "Bẫy" phải truy được về một đoạn cảnh báo có thật.** Kafka có rất nhiều blockquote `> **Cảnh báo**` / `> **Lưu ý**` / `> **Mẹo**` — đó là mỏ quặng. Nếu đọc một mục mà không tìm ra cảnh báo nào, báo lại thay vì bịa.
- **`practice` mức tuần phải là thao tác trên cluster thật**, nêu đúng lệnh hoặc tham số cấu hình của chương tuần đó, và **tránh sáu chỗ code cụt ở trên**.
- **Độ dài mỗi `lesson`: 250–400 từ.** Bốn khối `**Mục tiêu.** / **Đọc.** / **Bẫy.** / **Tự kiểm tra.**`, đúng thứ tự.
- **Mỗi khối tuần phải có trường `goal`** (một câu nêu tuần đó đạt được gì). Thứ tự khoá: `id, week, title, goal, practice, resources, items`.
- **Bản quyền:** sách thương mại O'Reilly. Khuôn ghi nguồn: *"sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0"*.
- **Lệnh nghiệm thu duy nhất của repo** (không có test runner nào khác — `package.json` chỉ khai `type: module`):

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

- **Luôn dán output thật.** Không tuyên bố "đã chạy, xanh" mà không có output.

## Ghi chú về thứ tự so với spec §9

Spec §9 xếp "khai `EXPECTED.counts`" trước khi viết dữ liệu. Kế hoạch giữ nguyên nguyên tắc đó cho **chặng 1** (Task 2 Step 1), nhưng ở **chặng 2** dời việc khai `"roadmap-items:kafka": 44` + wiring xuống Task 7, sau khi 11 tuần đã viết xong — nếu khai 44 từ đầu, checker sẽ đỏ liên tục suốt 4 task viết nội dung và mất tác dụng tín hiệu. Mỗi task viết tuần có lệnh đếm riêng để vẫn tự nghiệm thu được.

## Bảng phân bổ tổng — tham chiếu nhanh

| Tuần | Chương | Số từ | Ảnh | Mục | Task |
|---|---|---:|---:|---:|---|
| `kf-w1` | ch.2 | 13.231 | 2 | 4 | Task 3 |
| `kf-w2` | ch.3 | 11.564 | 3 | 3 | Task 3 |
| `kf-w3` | ch.4 | 13.599 | 9 | 4 | Task 3 |
| `kf-w4` | ch.5 + ch.6 | 22.205 | 7 | 5 | Task 4 |
| `kf-w5` | ch.7 + ch.8 | 20.279 | 4 | 5 | Task 4 |
| `kf-w6` | ch.9 | 12.017 | 0 | 3 | Task 4 |
| `kf-w7` | ch.10 | 15.428 | 7 | 4 | Task 5 |
| `kf-w8` | ch.11 | 15.782 | 2 | 4 | Task 5 |
| `kf-w9` | ch.12 | 13.661 | 0 | 4 | Task 5 |
| `kf-w10` | ch.13 | 19.493 | 0 | 4 | Task 6 |
| `kf-w11` | ch.14 | 17.830 | 13 | 4 | Task 6 |

`kafkaWeeksPart1` = tuần 1–6 = **24 mục** · `kafkaWeeksPart2` = tuần 7–11 = **20 mục** · tổng **44**.
Tổng 175.089 từ / 47 ảnh. Các chương 5, 7, 9, 12, 13 không có ảnh — đúng nguồn.

---

# CHẶNG 1 — Lĩnh vực sống, đọc được 13 chương

## Task 1: Chuẩn hoá nguồn sang `kafka-vi/` và nối vào build

**Files:**
- Rename: `Kafka-The Definitive Guide/vi/` → `kafka-vi/` (13 `.md` + `README.md` + `images/` 47 tệp)
- Rename: `Kafka-The Definitive Guide/*.pdf` → `kafka-vi/NN-slug.pdf` (13 tệp)
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có (task đầu tiên).
- Produces: 13 markdown tại `kafka-vi/NN-slug.md` và 47 ảnh tại `kafka-vi/images/`; sau build có mặt tại `webapp/content/kafka/` và `webapp/content/kafka/images/`. Task 2 tham chiếu qua `file: "content/kafka/NN-slug.md"`.

- [ ] **Step 1: Xác nhận không nơi nào tham chiếu đường dẫn cũ**

```bash
grep -rn "Kafka-The Definitive Guide/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Kafka-The Definitive Guide" .
```

Kỳ vọng: **không dòng nào**. Mẫu có dấu `/` cuối để chỉ bắt tham chiếu **đường dẫn**, không bắt tên sách trong văn xuôi (DDIA và Senior Java GĐ4 có nhắc Kafka — đó là chữ, không phải đường dẫn).

**Dùng `--exclude-dir`, không dùng `grep -v "^./..."`** — trên máy này `grep -r .` không thêm tiền tố `./`, bộ lọc dạng `^./` không ăn và cho cảm giác an toàn giả.

- [ ] **Step 2: Chuyển thư mục `vi/` thành `kafka-vi/`**

```bash
git mv "Kafka-The Definitive Guide/vi" kafka-vi
ls kafka-vi
```

Kỳ vọng: 13 tệp `chuong-*.md` + `README.md` + thư mục `images`.

Thư mục `images/` **phải** đi cùng bước này — đường dẫn ảnh trong markdown là tương đối, chỉ cần nó nằm cạnh các `.md` là không tham chiếu nào gãy và không phải sửa một ký tự nội dung nào.

- [ ] **Step 3: Bỏ tiền tố `chuong-` khỏi 13 tệp markdown**

```bash
cd kafka-vi
for f in chuong-*.md; do git mv "$f" "${f#chuong-}"; done
cd ..
ls kafka-vi/*.md | sed 's#.*/##'
```

Kỳ vọng chính xác 14 dòng: `02-installing-kafka.md` … `14-stream-processing.md`, cộng `README.md`.

- [ ] **Step 4: Chuyển 13 PDF vào cùng thư mục, đổi tên theo cùng slug**

Tên PDF nguồn chứa dấu cách và dấu gạch dưới thay dấu hai chấm. Chép nguyên khối, **không tự gõ lại tên tệp**:

```bash
D="Kafka-The Definitive Guide"
git mv "$D/2. Installing Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                    kafka-vi/02-installing-kafka.pdf
git mv "$D/3. Kafka Producers_ Writing Messages to Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"          kafka-vi/03-kafka-producers.pdf
git mv "$D/4. Kafka Consumers_ Reading Data from Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"            kafka-vi/04-kafka-consumers.pdf
git mv "$D/5. Managing Apache Kafka Programmatically _ Kafka_ The Definitive Guide, 2nd Edition.pdf"              kafka-vi/05-managing-kafka-programmatically.pdf
git mv "$D/6. Kafka Internals _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                     kafka-vi/06-kafka-internals.pdf
git mv "$D/7. Reliable Data Delivery _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                              kafka-vi/07-reliable-data-delivery.pdf
git mv "$D/8. Exactly-Once Semantics _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                              kafka-vi/08-exactly-once-semantics.pdf
git mv "$D/9. Building Data Pipelines _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                             kafka-vi/09-building-data-pipelines.pdf
git mv "$D/10. Cross-Cluster Data Mirroring _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                       kafka-vi/10-cross-cluster-data-mirroring.pdf
git mv "$D/11. Securing Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                     kafka-vi/11-securing-kafka.pdf
git mv "$D/12. Administering Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                kafka-vi/12-administering-kafka.pdf
git mv "$D/13. Monitoring Kafka _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                   kafka-vi/13-monitoring-kafka.pdf
git mv "$D/14. Stream Processing _ Kafka_ The Definitive Guide, 2nd Edition.pdf"                                  kafka-vi/14-stream-processing.pdf
rmdir "$D"
```

`rmdir` thành công chứng minh thư mục cũ đã rỗng. Nếu báo "Directory not empty", dừng lại: còn tệp chưa chuyển.

- [ ] **Step 5: Xác nhận 13 cặp `.md`/`.pdf` khớp slug**

```bash
diff <(ls kafka-vi/*.md  | sed 's#.*/##; s#\.md$##'  | grep -E '^[0-9]{2}-') \
     <(ls kafka-vi/*.pdf | sed 's#.*/##; s#\.pdf$##') && echo "OK — 13 cặp khớp slug"
```

Kỳ vọng: in ra `OK — 13 cặp khớp slug`, không dòng `<`/`>` nào.

- [ ] **Step 6: Kiểm toàn vẹn ảnh — 47 tệp, 0 gãy, 0 mồ côi**

```bash
cd kafka-vi
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
echo "bố cục: $(ls images | head -3 | tr '\n' ' ')"
cd ..
```

Kỳ vọng chính xác: `tệp ảnh: 47`, `gãy: 0 | mồ côi: 0`, và `bố cục:` in ra tên tệp `hinh-*.png` — **không phải** tên thư mục `ch01 ch02 …`.

**Glob là `[0-9][0-9]-*.md`, không phải `*.md`** — `README.md` mô tả quy ước bằng đường dẫn mẫu và sẽ gây báo thiếu giả.

Nếu `bố cục` in ra tên thư mục: ai đó đã sắp xếp lại ảnh thành `chNN/`. **Hoàn tác.** Bố cục phẳng là đúng nguồn (Global Constraints).

- [ ] **Step 7: Nối vào `build-content.sh`**

Sửa lệnh `mkdir -p` (thêm `"$DEST/kafka/images"` vào cuối danh sách):

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior" \
         "$DEST/modconc/images" "$DEST/ddia/images" "$DEST/mjia/images" \
         "$DEST/kafka/images"
```

Thêm **hai** dòng `cp` vào cuối tệp, sau khối `modern-java-vi`:

```bash
cp    "$REPO"/kafka-vi/*.md                             "$DEST/kafka/"
cp -R "$REPO"/kafka-vi/images/.                         "$DEST/kafka/images/"
```

Canh cột `"$DEST/..."` **khớp với các dòng `cp` sẵn có trong tệp** — mở tệp ra đếm cột, đừng chép khoảng trắng từ kế hoạch này.

- [ ] **Step 8: Chạy build và đếm tệp đích**

```bash
./webapp/build-content.sh webapp/content
echo "mục trong content/kafka: $(ls webapp/content/kafka | wc -l | tr -d ' ')"
echo "ảnh đã copy: $(find webapp/content/kafka/images -type f | wc -l | tr -d ' ')"
```

Kỳ vọng chính xác: `mục trong content/kafka: 15` (13 chương + `README.md` + thư mục `images`) và `ảnh đã copy: 47`.

`README.md` thừa là vô hại, có tiền lệ ở `content/modconc/` và `content/mjia/`.

- [ ] **Step 9: Chạy checker để xác nhận không hồi quy**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH**. Chưa khai lĩnh vực nào nên chưa có gì để đỏ. Nếu đỏ, lỗi đến từ chỗ khác — báo lại, không tự sửa.

- [ ] **Step 10: Commit**

```bash
git add -A kafka-vi webapp/build-content.sh
git commit -m "chore: chuẩn hoá nguồn Kafka: The Definitive Guide thành kafka-vi/ (13 chương, 47 ảnh) và nối vào build-content"
```

---

## Task 2: Khai lĩnh vực `kafka` và 13 tài liệu

**Files:**
- Modify: `webapp/check-data.mjs` (chỉ bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/docs-index.js`

**Interfaces:**
- Consumes: từ Task 1 — 13 tệp tại `webapp/content/kafka/NN-slug.md`, 47 ảnh tại `webapp/content/kafka/images/`.
- Produces: field id `kafka`; 13 doc id `kafka-02`…`kafka-14`, mỗi bản ghi có `field: "kafka"`. Task 3–6 trỏ anchor `#/docs/kafka-NN`. Task 7 bật thêm module `roadmap` vào chính entry này.

- [ ] **Step 1: Viết bảng kỳ vọng TRƯỚC — để checker đỏ có chủ đích**

Trong `webapp/check-data.mjs`, thêm vào cuối object `EXPECTED.counts`:

```js
    // Lĩnh vực Kafka — 13 chương (2–14) Kafka: The Definitive Guide ấn bản 2.
    "docs:kafka": 13,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ đúng chỗ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ**, lỗi về số tài liệu lĩnh vực `kafka` (kỳ vọng 13, thực tế 0). Đây là bước red. Nếu xanh, bảng kỳ vọng chưa ăn — kiểm tra Step 1.

- [ ] **Step 3: Khai lĩnh vực trong `fields.js`**

Thêm entry vào cuối object `FIELDS`:

```js
  kafka: {
    label: "Kafka: The Definitive Guide",
    icon: "📨",
    desc: "Bản dịch tiếng Việt Kafka: The Definitive Guide, ấn bản 2 (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly) — chương 2–14: cài đặt, producer, consumer, cơ chế bên trong, truyền tin cậy, exactly-once, data pipeline, mirroring, bảo mật, vận hành, giám sát và stream processing.",
    certFilter: false,
    // Module "roadmap" mở ở Task 7, khi đã có đủ 44 mục lộ trình.
    modules: ["dashboard", "docs"],
    externalRef: { label: "kafka.apache.org/documentation", href: "https://kafka.apache.org/documentation/" },
  },
```

Chèn `"kafka"` vào `FIELD_ORDER`, ngay sau `"ddia"`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "modern-java", "ddia", "kafka", "modern-concurrency", "spring-security", "senior-java"];
```

**Nếu lĩnh vực `spring-start` đã tồn tại** (kế hoạch chị em chạy trước), `FIELD_ORDER` sẽ dài hơn — vẫn chèn `"kafka"` ngay sau `"ddia"`, không đụng vị trí của `spring-start`.

- [ ] **Step 4: Cập nhật chú thích đầu `docs-index.js`**

Thêm `kafka-vi/` vào danh sách thư mục nguồn ở khối chú thích đầu tệp (dòng 2–5).

- [ ] **Step 5: Viết 13 bản ghi tài liệu**

Thêm vào cuối mảng `docs`, mở đầu bằng comment nhóm. `desc` dưới đây là bản chốt — dùng nguyên văn:

```js
  // ===== Kafka: The Definitive Guide (O'Reilly, ấn bản 2) =====
  // Bản dịch tiếng Việt chương 2–14, thư mục nguồn: kafka-vi/
  {
    id: "kafka-02",
    field: "kafka",
    title: "Kafka 02 — Cài đặt Kafka",
    file: "content/kafka/02-installing-kafka.md",
    icon: "🧰",
    desc: "Dựng broker đầu tiên từ ZooKeeper tới cấu hình, chọn phần cứng ra sao, và một cluster cần gì trước khi dám chạy production.",
    tags: ["Broker", "ZooKeeper", "Cấu hình"],
  },
  {
    id: "kafka-03",
    field: "kafka",
    title: "Kafka 03 — Kafka Producer: Ghi message vào Kafka",
    file: "content/kafka/03-kafka-producers.md",
    icon: "📤",
    desc: "Một message đi qua những gì từ lúc gọi send() tới lúc nằm trên đĩa broker, và các tham số quyết định đánh đổi giữa độ trễ, thông lượng và độ an toàn.",
    tags: ["Producer", "acks", "Serializer"],
  },
  {
    id: "kafka-04",
    field: "kafka",
    title: "Kafka 04 — Kafka Consumer: Đọc dữ liệu từ Kafka",
    file: "content/kafka/04-kafka-consumers.md",
    icon: "📥",
    desc: "Consumer group chia partition thế nào, rebalance xảy ra khi nào, và bốn cách commit offset cùng cái giá của từng cách.",
    tags: ["Consumer group", "Offset", "Rebalance"],
  },
  {
    id: "kafka-05",
    field: "kafka",
    title: "Kafka 05 — Quản trị Apache Kafka bằng lập trình",
    file: "content/kafka/05-managing-kafka-programmatically.md",
    icon: "🔧",
    desc: "Dùng AdminClient thay cho script dòng lệnh: quản lý topic, cấu hình, consumer group và metadata ngay trong ứng dụng.",
    tags: ["AdminClient", "Topic", "Metadata"],
  },
  {
    id: "kafka-06",
    field: "kafka",
    title: "Kafka 06 — Cơ chế bên trong Kafka",
    file: "content/kafka/06-kafka-internals.md",
    icon: "⚙️",
    desc: "Controller bầu ra sao (cả ZooKeeper lẫn KRaft), replication giữ dữ liệu đồng bộ thế nào, và một request đi qua những tầng nào trước khi chạm đĩa.",
    tags: ["Controller", "KRaft", "Replication"],
  },
  {
    id: "kafka-07",
    field: "kafka",
    title: "Kafka 07 — Truyền dữ liệu tin cậy",
    file: "content/kafka/07-reliable-data-delivery.md",
    icon: "🛡️",
    desc: "Kafka bảo đảm chính xác những gì, và bạn phải cấu hình gì ở broker, producer và consumer để những bảo đảm đó thành thật.",
    tags: ["ISR", "min.insync.replicas", "Độ tin cậy"],
  },
  {
    id: "kafka-08",
    field: "kafka",
    title: "Kafka 08 — Ngữ nghĩa Exactly-Once",
    file: "content/kafka/08-exactly-once-semantics.md",
    icon: "🎯",
    desc: "Idempotent producer giải được vấn đề gì và không giải được gì, transaction bù vào chỗ nào, và exactly-once tốn bao nhiêu hiệu năng.",
    tags: ["Idempotent", "Transaction", "Exactly-once"],
  },
  {
    id: "kafka-09",
    field: "kafka",
    title: "Kafka 09 — Xây dựng data pipeline",
    file: "content/kafka/09-building-data-pipelines.md",
    icon: "🔗",
    desc: "Những gì phải cân nhắc khi nối hai hệ thống qua Kafka, khi nào Kafka Connect thắng producer/consumer tự viết, và Connect gồm những mảnh nào.",
    tags: ["Kafka Connect", "Pipeline", "Converter"],
  },
  {
    id: "kafka-10",
    field: "kafka",
    title: "Kafka 10 — Mirroring dữ liệu liên cluster",
    file: "content/kafka/10-cross-cluster-data-mirroring.md",
    icon: "🪞",
    desc: "Vì sao cần nhiều cluster, ba kiến trúc multicluster phổ biến, và MirrorMaker 2 triển khai với tinh chỉnh ra sao.",
    tags: ["MirrorMaker", "Multicluster", "Active-active"],
  },
  {
    id: "kafka-11",
    field: "kafka",
    title: "Kafka 11 — Bảo mật Kafka",
    file: "content/kafka/11-securing-kafka.md",
    icon: "🔐",
    desc: "Bốn security protocol, các cơ chế xác thực SSL và SASL, mã hoá đường truyền, ACL phân quyền, và cả bảo mật ZooKeeper phía sau.",
    tags: ["SASL", "SSL", "ACL"],
  },
  {
    id: "kafka-12",
    field: "kafka",
    title: "Kafka 12 — Quản trị vận hành Kafka",
    file: "content/kafka/12-administering-kafka.md",
    icon: "🛠️",
    desc: "Bộ công cụ dòng lệnh dùng hằng ngày cho topic, consumer group, cấu hình động và partition — kèm danh sách thao tác không bao giờ nên chạm.",
    tags: ["CLI", "Partition", "Thao tác nguy hiểm"],
  },
  {
    id: "kafka-13",
    field: "kafka",
    title: "Kafka 13 — Giám sát Kafka",
    file: "content/kafka/13-monitoring-kafka.md",
    icon: "📈",
    desc: "Metric nào của broker thật sự báo động, cách đặt SLO cho một cluster, và giám sát lag cùng độ trễ đầu-cuối.",
    tags: ["JMX", "SLO", "Lag"],
  },
  {
    id: "kafka-14",
    field: "kafka",
    title: "Kafka 14 — Xử lý luồng (Stream Processing)",
    file: "content/kafka/14-stream-processing.md",
    icon: "🌊",
    desc: "Stream processing khác xử lý theo lô ở đâu, các design pattern hay dùng, và Kafka Streams làm được gì qua ví dụ thật.",
    tags: ["Kafka Streams", "Windowing", "State store"],
  },
```

- [ ] **Step 6: Chạy nghiệm thu đầy đủ để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**. Phải thấy xanh: `docs:kafka` = 13, #1 (id duy nhất), #2 (13 tệp trên đĩa), **#2b (47 ảnh trên đĩa)**, N3, `FIELD_ORDER` khớp `FIELDS` 1-1, #7/#7b.

#2b đỏ nghĩa là `cp -R images` ở Task 1 Step 7 thiếu, hoặc chưa chạy lại build.
#7b đỏ với thông báo về module `roadmap` nghĩa là đã lỡ khai `"roadmap"` ở Step 3 — bỏ ra, việc đó thuộc Task 7.

- [ ] **Step 7: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/fields.js webapp/js/data/docs-index.js
git commit -m "feat: khai lĩnh vực kafka và 13 tài liệu Kafka: The Definitive Guide"
```

**Bước kiểm bằng mắt do controller làm, không phải subagent** — subagent không có mắt người và `dev.sh` là tiến trình treo phiên. Controller mở `Kafka 14` (13 ảnh) và `Kafka 04` (9 ảnh), xác nhận ảnh hiện và mục lục nổi dựng đúng.

---

# CHẶNG 2 — Giáo trình đọc 11 tuần

Bốn task viết nội dung (3–6) theo cùng nhịp: đọc chương nguồn → viết khối tuần → đếm mục → kiểm anchor → kiểm độ dài → commit. Khuôn `lesson` và ràng buộc nội dung ở **Global Constraints**.

**Mẫu tham chiếu bắt buộc:** `webapp/js/data/mjia-roadmap-part1.js` — track sách gần nhất, đã qua ba vòng review. Mở ra xem một khối tuần hoàn chỉnh trước khi gõ dòng đầu tiên. Dấu vân tay giọng văn phải giữ: mỗi **Bẫy** có hai bẫy, bẫy thứ hai mở bằng "Bẫy thứ hai:"; mỗi **Tự kiểm tra** kết bằng đúng hai câu hỏi nối bằng " Và "; khối **Đọc** dùng giọng điều hướng ("đọc lướt", "mục đọc chậm nhất tuần", "gõ lại", "chạy thật").

## Task 3: Lộ trình tuần 1–3 (11 mục)

**Files:**
- Create: `webapp/js/data/kafka-roadmap-part1.js`

**Interfaces:**
- Consumes: từ Task 2 — doc id `kafka-02`, `kafka-03`, `kafka-04`.
- Produces: `export const kafkaWeeksPart1` — mảng khối tuần. Task 4 nối thêm tuần 4–6 vào **cùng mảng này**. Task 7 import tên `kafkaWeeksPart1`.

- [ ] **Step 1: Đọc 3 chương nguồn**

Đọc `kafka-vi/02-installing-kafka.md`, `03-kafka-producers.md`, `04-kafka-consumers.md`. Ghi lại tên chính xác các mục `##` — khối "Đọc" trích nguyên văn, **kể cả phần tiếng Anh trong ngoặc**.

- [ ] **Step 2: Tạo tệp với header**

```js
// Lộ trình đọc Kafka: The Definitive Guide — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "Kafka: The Definitive Guide", ấn bản 2
// (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly).
// Thư mục nguồn: kafka-vi/ — bản dịch gồm chương 2–14; chương 1 không thuộc phạm vi.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, trên một cluster thật.
// GIỮ NGUYÊN id (kf-w<N> / kf-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const kafkaWeeksPart1 = [
  // … 3 khối tuần ở Step 3–5, thêm 3 khối nữa ở Task 4 …
];
```

- [ ] **Step 3: Viết tuần 1 — `kf-w1`, 4 mục (ch.2)**

`title`: `"Cài đặt Kafka và cấu hình broker"` · `resources` trỏ `#/docs/kafka-02` và `{ label: "kafka.apache.org — Quickstart", href: "https://kafka.apache.org/quickstart" }`.

`practice`: Dựng một broker chạy được theo đúng các bước của mục "Cài đặt một Kafka broker (Installing a Kafka Broker)" — tarball hoặc Docker Compose đều được. Rồi mở `server.properties`, đặt lại ba tham số mà mục "Cấu hình broker (Configuring the Broker)" bàn — `num.partitions`, `log.retention.hours`, `log.segment.bytes` — khởi động lại và dùng `kafka-topics.sh --describe` xác nhận topic mới sinh ra đúng số partition bạn đặt.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w1-1` | Dựng broker đầu tiên: Java, ZooKeeper, rồi Kafka | ch.2 §"Thiết lập môi trường (Environment Setup)" + §"Cài đặt một Kafka broker (Installing a Kafka Broker)" |
| `kf-w1-2` | Cấu hình broker: tham số bắt buộc và mặc định của topic | ch.2 §"Cấu hình broker (Configuring the Broker)" |
| `kf-w1-3` | Chọn phần cứng, và Kafka trên cloud | ch.2 §"Lựa chọn phần cứng (Selecting Hardware)" + §"Kafka trên cloud (Kafka in the Cloud)" |
| `kf-w1-4` | Từ một broker lên một cluster, và những gì production đòi hỏi | ch.2 §"Cấu hình các cụm Kafka (Configuring Kafka Clusters)" + §"Các vấn đề cần lưu ý khi chạy production (Production Concerns)" |

- [ ] **Step 4: Viết tuần 2 — `kf-w2`, 3 mục (ch.3)**

`title`: `"Producer: ghi message vào Kafka"` · `resources` trỏ `#/docs/kafka-03`.

`practice`: Viết một producer gửi 1.000 message vào một topic 3 partition. Chạy ba lần với `acks=0`, `acks=1`, `acks=all` và ghi lại thời gian mỗi lần. Rồi bật `enable.idempotence=true` và xem những cấu hình nào bị ép đổi theo — mục "Cấu hình Producer (Configuring Producers)" nói rõ cái nào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w2-1` | Đường đi của một message từ `send()` tới broker | ch.3 §"Tổng quan về Producer (Producer Overview)" + §"Khởi tạo một Kafka Producer (Constructing a Kafka Producer)" + §"Gửi message tới Kafka (Sending a Message to Kafka)" |
| `kf-w2-2` | Cấu hình producer: acks, retry, batching và độ trễ | ch.3 §"Cấu hình Producer (Configuring Producers)" |
| `kf-w2-3` | Serializer, partition, header, interceptor và quota | ch.3 §"Serializer (Serializers)" + §"Partition (Partitions)" + §"Header (Headers)" + §"Interceptor (Interceptors)" + §"Quota và Throttling (Quotas and Throttling)" |

**Cảnh báo cho `kf-w2-3`:** mục Quota chứa một trong sáu chỗ code bị PDF gốc cắt cụt (lệnh `kafka-configs ... --add-config 'producer_byte_`). Được phép nhắc rằng quota đặt bằng `kafka-configs`, **không được** bảo người đọc gõ lại đúng dòng đó.

- [ ] **Step 5: Viết tuần 3 — `kf-w3`, 4 mục (ch.4)**

`title`: `"Consumer, consumer group và rebalance"` · `resources` trỏ `#/docs/kafka-04`.

`practice`: Chạy hai consumer cùng một group trên topic 4 partition. Giết một con và đọc log để thấy rebalance chia lại partition. Rồi chuyển từ auto-commit sang `commitSync()`, cố tình ném lỗi giữa lúc xử lý, và xác nhận message được đọc lại sau khi khởi động lại.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w3-1` | Consumer group chia partition thế nào, và rebalance xảy ra khi nào | ch.4 §"Khái niệm về Kafka Consumer (Kafka Consumer Concepts)" |
| `kf-w3-2` | Vòng lặp poll, và các tham số cấu hình consumer | ch.4 §"Tạo một Kafka Consumer (Creating a Kafka Consumer)" + §"Subscribe vào các topic (Subscribing to Topics)" + §"Vòng lặp poll (The Poll Loop)" + §"Cấu hình Consumer (Configuring Consumers)" |
| `kf-w3-3` | Commit offset — các cách và cái giá của từng cách | ch.4 §"Commit và Offset (Commits and Offsets)" + §"Rebalance Listener" |
| `kf-w3-4` | Đọc từ offset cụ thể, thoát sạch, deserializer và standalone consumer | ch.4 §"Tiêu thụ record với offset cụ thể (Consuming Records with Specific Offsets)" + §"Nhưng làm sao để thoát? (But How Do We Exit?)" + §"Deserializer" + §"Standalone Consumer: Tại sao và làm thế nào để dùng một Consumer không thuộc Group (Standalone Consumer: Why and How to Use a Consumer Without a Group)" |

**Cảnh báo cho `kf-w3-4`:** mục Deserializer chứa dòng bị cắt cụt (`throw new SerializationException("Error when deserializing " +`). Không lấy nó làm bài tập gõ lại.

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/kafka-roadmap-part1.js').then(m=>{
  const w=m.kafkaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 11` và `kf-w1:4 kf-w2:3 kf-w3:4`

- [ ] **Step 7: Kiểm mọi anchor `#/docs/` trỏ tài liệu có thật và cùng lĩnh vực**

```bash
node -e "
import('./webapp/js/data/kafka-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const byId=new Map(docs.map(d=>[d.id,d]));
  const bad=[];
  const scan=(o,s)=>{ for(const x of String(s).matchAll(/#\/docs\/([\w-]+)/g)){
    const d=byId.get(x[1]);
    if(!d) bad.push(o+' → '+x[1]+' (không tồn tại)');
    else if(d.field!=='kafka') bad.push(o+' → '+x[1]+' (lĩnh vực '+d.field+')');
  }};
  for(const w of m.kafkaWeeksPart1){
    for(const r of w.resources??[]) scan(w.id, r.href);
    for(const it of w.items) scan(it.id, it.lesson);
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — mọi anchor hợp lệ và cùng lĩnh vực');
})"
```

Kỳ vọng: `OK — mọi anchor hợp lệ và cùng lĩnh vực`.

- [ ] **Step 8: Kiểm độ dài `lesson` và cấu trúc 4 khối**

```bash
node -e "import('./webapp/js/data/kafka-roadmap-part1.js').then(m=>{
  const its=m.kafkaWeeksPart1.flatMap(w=>w.items);
  const len=its.map(i=>[i.id, i.lesson.trim().split(/\s+/).length]);
  const bad=len.filter(([,n])=>n<250||n>400);
  const blocks=its.filter(i=>!/\*\*Mục tiêu\.\*\*[\s\S]*\*\*Đọc\.\*\*[\s\S]*\*\*Bẫy\.\*\*[\s\S]*\*\*Tự kiểm tra\.\*\*/.test(i.lesson));
  console.log(len.map(([a,b])=>a+':'+b).join(' '));
  console.log(bad.length? 'NGOÀI KHUNG: '+bad.map(([a,b])=>a+'='+b).join(', ') : 'OK — mọi lesson trong khung 250-400 từ');
  console.log(blocks.length? 'SAI CẤU TRÚC: '+blocks.map(i=>i.id).join(', ') : 'OK — mọi lesson đủ 4 khối đúng thứ tự');
})"
```

Kỳ vọng: cả hai dòng `OK`.

- [ ] **Step 9: Kiểm mọi tiêu đề mục trích trong "Đọc" có thật trong nguồn**

```bash
node -e "
import('./webapp/js/data/kafka-roadmap-part1.js').then(async m=>{
  const fs=await import('node:fs');
  const map={'kafka-02':'02-installing-kafka','kafka-03':'03-kafka-producers','kafka-04':'04-kafka-consumers'};
  const heads={};
  for(const [id,f] of Object.entries(map))
    heads[id]=new Set(fs.readFileSync('kafka-vi/'+f+'.md','utf8').split('\n')
      .filter(l=>/^#{2,6} /.test(l)).map(l=>l.replace(/^#{2,6} /,'').trim()));
  const bad=[];
  for(const w of m.kafkaWeeksPart1) for(const it of w.items)
    for(const x of it.lesson.matchAll(/\[([^\]]+)\]\(#\/docs\/(kafka-\d\d)\)/g))
      if(heads[x[2]] && !heads[x[2]].has(x[1])) bad.push(it.id+': \"'+x[1]+'\" không có trong '+x[2]);
  console.log(bad.length? 'LỆCH:\n  '+bad.join('\n  ') : 'OK — mọi tiêu đề mục trích đúng nguyên văn');
})"
```

Kỳ vọng: `OK — mọi tiêu đề mục trích đúng nguyên văn`. Lệch nghĩa là đã rút gọn hoặc bỏ phần tiếng Anh trong ngoặc — sửa lại cho khớp nguyên văn.

- [ ] **Step 10: Commit**

```bash
git add webapp/js/data/kafka-roadmap-part1.js
git commit -m "feat: lộ trình đọc Kafka tuần 1-3 — 11 mục"
```

---

## Task 4: Lộ trình tuần 4–6 (13 mục) — part1 đủ 24 mục

**Files:**
- Modify: `webapp/js/data/kafka-roadmap-part1.js`

**Interfaces:**
- Consumes: `kafkaWeeksPart1` từ Task 3 (3 khối tuần đã có); doc id `kafka-05`…`kafka-09`.
- Produces: `kafkaWeeksPart1` đủ 6 tuần / **24 mục**.

- [ ] **Step 1: Đọc 5 chương nguồn**

`kafka-vi/05-managing-kafka-programmatically.md`, `06-kafka-internals.md`, `07-reliable-data-delivery.md`, `08-exactly-once-semantics.md`, `09-building-data-pipelines.md`.

- [ ] **Step 2: Viết tuần 4 — `kf-w4`, 5 mục (ch.5 + ch.6)**

Nối vào **cuối** mảng, sau `kf-w3`. `title`: `"AdminClient, và cơ chế bên trong Kafka"` · `resources` trỏ `#/docs/kafka-05` và `#/docs/kafka-06`.

`practice`: Viết một chương trình dùng `AdminClient` làm đủ vòng: tạo topic, đổi một cấu hình của nó, liệt kê consumer group, và đọc metadata cluster — thay cho script dòng lệnh. Rồi dùng đúng lệnh mà chính mục "Physical Storage (Lưu trữ vật lý)" của ch.6 đưa ra — `kafka-run-class.sh kafka.tools.DumpLogSegments` — trên một segment của topic đó, để nhìn thấy tận mắt bố cục mà mục ấy mô tả. Đừng với sang `kafka-dump-log.sh` ở bước này — công cụ đó thuộc chương 12, bạn sẽ gặp nó ở tuần 9.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w4-1` | AdminClient: vòng đời, quản lý topic và cấu hình | ch.5 §"Tổng quan về AdminClient (AdminClient Overview)" + §"Vòng đời của AdminClient: Tạo, cấu hình và đóng (AdminClient Lifecycle: Creating, Configuring, and Closing)" + §"Quản lý topic thiết yếu (Essential Topic Management)" + §"Quản lý cấu hình (Configuration Management)" |
| `kf-w4-2` | Quản lý consumer group, metadata và thao tác nâng cao bằng code | ch.5 §"Quản lý consumer group (Consumer Group Management)" + §"Metadata của cluster (Cluster Metadata)" + §"Các thao tác quản trị nâng cao (Advanced Admin Operations)" + §"Kiểm thử (Testing)" |
| `kf-w4-3` | Thành viên cluster và controller — ZooKeeper và KRaft | ch.6 §"Cluster Membership (Thành viên của cluster)" + §"The Controller (Controller)" + §"KRaft: Controller mới dựa trên Raft của Kafka" |
| `kf-w4-4` | Replication: leader, follower và ISR | ch.6 §"Replication" |
| `kf-w4-5` | Xử lý request, và lưu trữ vật lý trên đĩa | ch.6 §"Request Processing (Xử lý request)" + §"Physical Storage (Lưu trữ vật lý)" |

- [ ] **Step 3: Viết tuần 5 — `kf-w5`, 5 mục (ch.7 + ch.8)**

`title`: `"Truyền dữ liệu tin cậy và exactly-once"` · `resources` trỏ `#/docs/kafka-07` và `#/docs/kafka-08`.

`practice`: Dựng cluster 3 broker. Tạo topic với `replication.factor=3` và `min.insync.replicas=2`. Dừng hai broker và quan sát producer `acks=all` bị chặn thế nào. Khôi phục, rồi viết một vòng read-process-write bọc trong transaction và xác nhận consumer đặt `isolation.level=read_committed` không thấy dữ liệu của transaction bị abort.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w5-1` | Kafka bảo đảm chính xác những gì, và replication làm nền ra sao | ch.7 §"Các bảo đảm về độ tin cậy (Reliability Guarantees)" + §"Replication" |
| `kf-w5-2` | Cấu hình broker cho độ tin cậy | ch.7 §"Cấu hình broker (Broker Configuration)" |
| `kf-w5-3` | Producer và consumer trong hệ tin cậy, và cách kiểm chứng | ch.7 §"Sử dụng producer trong một hệ thống tin cậy (Using Producers in a Reliable System)" + §"Sử dụng consumer trong một hệ thống tin cậy (Using Consumers in a Reliable System)" + §"Kiểm chứng độ tin cậy của hệ thống (Validating System Reliability)" |
| `kf-w5-4` | Idempotent producer giải và không giải vấn đề gì | ch.8 §"Idempotent Producer" |
| `kf-w5-5` | Transaction, exactly-once, và cái giá hiệu năng | ch.8 §"Transactions" + §"Hiệu năng của Transaction" |

- [ ] **Step 4: Viết tuần 6 — `kf-w6`, 3 mục (ch.9)**

`title`: `"Xây dựng data pipeline với Kafka Connect"` · `resources` trỏ `#/docs/kafka-09` và `{ label: "kafka.apache.org — Kafka Connect", href: "https://kafka.apache.org/documentation/#connect" }`.

`practice`: Chạy Kafka Connect ở chế độ standalone với `FileStreamSource` đọc một tệp và `FileStreamSink` ghi ra tệp khác. Rồi đổi converter từ JSON sang String trong tệp cấu hình worker và dùng `kafka-console-consumer.sh` xem topic trung gian đổi hình dạng thế nào.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w6-1` | Những gì phải cân nhắc khi nối hai hệ thống qua Kafka | ch.9 §"Những cân nhắc khi xây dựng data pipeline" |
| `kf-w6-2` | Khi nào Connect thắng producer/consumer tự viết, và Connect gồm gì | ch.9 §"Khi nào dùng Kafka Connect thay vì producer và consumer" + §"Kafka Connect" |
| `kf-w6-3` | Các lựa chọn thay thế Connect, và khi nào chọn chúng | ch.9 §"Các lựa chọn thay thế Kafka Connect" |

**Cảnh báo cho `kf-w6-2`:** mục Kafka Connect chứa hai chỗ bị cắt cụt (lệnh `echo '{"name":"dump-kafka-config"...` và vài dòng output Elasticsearch). Không lấy chúng làm bài tập.

- [ ] **Step 5: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/kafka-roadmap-part1.js').then(m=>{
  const w=m.kafkaWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 6 | mục: 24` và `kf-w1:4 kf-w2:3 kf-w3:4 kf-w4:5 kf-w5:5 kf-w6:3`

- [ ] **Step 6: Kiểm anchor, độ dài, cấu trúc và tiêu đề trích**

Chạy lại **nguyên văn** ba lệnh ở Task 3 Step 7, Step 8 và Step 9 — chúng quét cả mảng nên tự phủ 3 tuần mới. **Riêng lệnh Step 9 phải mở rộng bảng `map`** thành đủ 9 chương của part1:

```js
const map={'kafka-02':'02-installing-kafka','kafka-03':'03-kafka-producers','kafka-04':'04-kafka-consumers',
 'kafka-05':'05-managing-kafka-programmatically','kafka-06':'06-kafka-internals','kafka-07':'07-reliable-data-delivery',
 'kafka-08':'08-exactly-once-semantics','kafka-09':'09-building-data-pipelines'};
```

Kỳ vọng: cả bốn dòng `OK`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/kafka-roadmap-part1.js
git commit -m "feat: lộ trình đọc Kafka tuần 4-6 — part1 đủ 24 mục"
```

---

## Task 5: Lộ trình tuần 7–9 (12 mục)

**Files:**
- Create: `webapp/js/data/kafka-roadmap-part2.js`

**Interfaces:**
- Consumes: doc id `kafka-10`, `kafka-11`, `kafka-12`.
- Produces: `export const kafkaWeeksPart2` — tuần 7–9. Task 6 nối thêm tuần 10–11 vào **cùng mảng này**. Task 7 import tên `kafkaWeeksPart2`.

- [ ] **Step 1: Đọc 3 chương nguồn**

`kafka-vi/10-cross-cluster-data-mirroring.md`, `11-securing-kafka.md`, `12-administering-kafka.md`.

- [ ] **Step 2: Tạo tệp với header**

Giống header Task 3 Step 2, đổi `Phần 1 (Tuần 1–6)` thành `Phần 2 (Tuần 7–11)` và tên export thành `kafkaWeeksPart2`.

- [ ] **Step 3: Viết tuần 7 — `kf-w7`, 4 mục (ch.10)**

`title`: `"Mirroring dữ liệu liên cluster"` · `resources` trỏ `#/docs/kafka-10`.

`practice`: Dựng hai cluster local (cổng khác nhau), chạy MirrorMaker 2 giữa chúng theo mục "MirrorMaker của Apache Kafka", produce vào cluster nguồn và xác nhận topic xuất hiện ở cluster đích **kèm tiền tố tên cluster nguồn** — rồi giải thích được vì sao MM2 đặt tiền tố đó.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w7-1` | Vì sao cần nhiều cluster, và các tình huống mirroring thật | ch.10 §"Các tình huống sử dụng của mirroring liên cluster" |
| `kf-w7-2` | Kiến trúc multicluster: hub-and-spoke, active-active, active-standby | ch.10 §"Các kiến trúc multicluster" |
| `kf-w7-3` | MirrorMaker 2: cấu hình, triển khai và tinh chỉnh | ch.10 §"MirrorMaker của Apache Kafka" |
| `kf-w7-4` | Các giải pháp mirroring khác, và khi nào chọn chúng | ch.10 §"Các giải pháp mirroring liên cluster khác" |

**Cảnh báo cho `kf-w7-2`:** lệnh bị cắt cụt `kafka-consumer-groups.sh ... --reset-offsets --al` nằm ở dòng 177 của ch.10, dưới `#### Offset khởi đầu cho ứng dụng sau khi failover` — tức trong §"Các kiến trúc multicluster", bài đọc của `kf-w7-2`, **không phải** §MirrorMaker. Đặt cảnh báo "đừng gõ lại, đừng đoán" ở đúng mục người đọc gặp nó.

- [ ] **Step 4: Viết tuần 8 — `kf-w8`, 4 mục (ch.11)**

`title`: `"Bảo mật Kafka — xác thực, phân quyền, mã hoá"` · `resources` trỏ `#/docs/kafka-11`.

`practice`: Bật SSL cho một broker: sinh keystore và truststore, đổi `listeners` sang `SASL_SSL`, và kết nối bằng một client cấu hình đúng. Rồi tạo một ACL bằng `kafka-acls.sh` cho phép đúng một user ghi vào đúng một topic, và xác nhận user khác bị từ chối.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w8-1` | Mô hình bảo mật Kafka và bốn security protocol | ch.11 §"Khóa chặt Kafka (Locking Down Kafka)" + §"Security Protocols" |
| `kf-w8-2` | Authentication: SSL và các cơ chế SASL | ch.11 §"Authentication" |
| `kf-w8-3` | Mã hoá đường truyền và phân quyền bằng ACL | ch.11 §"Encryption" + §"Authorization" |
| `kf-w8-4` | Auditing, bảo mật ZooKeeper và bảo mật nền tảng | ch.11 §"Auditing" + §"Bảo mật ZooKeeper (Securing ZooKeeper)" + §"Bảo mật nền tảng (Securing the Platform)" |

**Cảnh báo cho `kf-w8-4`:** mục Auditing chứa ba dòng log ví dụ bị cắt cụt. Không lấy làm bài tập.

- [ ] **Step 5: Viết tuần 9 — `kf-w9`, 4 mục (ch.12)**

`title`: `"Quản trị vận hành Kafka"` · `resources` trỏ `#/docs/kafka-12`.

`practice`: Làm đủ một vòng vận hành trên cluster thử: tạo topic, tăng số partition, xem lag của một consumer group, và reset offset của group đó theo đúng mục "Consumer Groups" của chương. **Đọc hết mục "Các thao tác không an toàn (Unsafe Operations)" TRƯỚC khi thử bất cứ thứ gì trong đó** — và không thử trên cluster có dữ liệu thật.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w9-1` | Thao tác topic bằng dòng lệnh | ch.12 §"Thao tác với topic (Topic Operations)" |
| `kf-w9-2` | Consumer group và thay đổi cấu hình động | ch.12 §"Consumer Groups" + §"Thay đổi cấu hình động (Dynamic Configuration Changes)" |
| `kf-w9-3` | Produce/consume từ dòng lệnh, và quản lý partition | ch.12 §"Produce và consume (Producing and Consuming)" + §"Quản lý partition (Partition Management)" |
| `kf-w9-4` | Các công cụ khác, và những thao tác KHÔNG an toàn | ch.12 §"Các công cụ khác (Other Tools)" + §"Các thao tác không an toàn (Unsafe Operations)" |

**Cảnh báo:** ch.12 chứa ba dòng output bị cắt cụt (`Configs: segment.bytes=1`, `kafka.host2.dom`, `among 1 parti`). Không trích chúng làm kết quả kỳ vọng của bài tập.

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/kafka-roadmap-part2.js').then(m=>{
  const w=m.kafkaWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 12` và `kf-w7:4 kf-w8:4 kf-w9:4`

- [ ] **Step 7: Kiểm anchor, độ dài, cấu trúc và tiêu đề trích**

Chạy lại ba lệnh ở Task 3 Step 7–9, **đổi `kafka-roadmap-part1.js` → `kafka-roadmap-part2.js` và `kafkaWeeksPart1` → `kafkaWeeksPart2`** ở mọi chỗ, và đổi bảng `map` của Step 9 thành:

```js
const map={'kafka-10':'10-cross-cluster-data-mirroring','kafka-11':'11-securing-kafka','kafka-12':'12-administering-kafka'};
```

Kỳ vọng: cả bốn dòng `OK`.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/kafka-roadmap-part2.js
git commit -m "feat: lộ trình đọc Kafka tuần 7-9 — 12 mục"
```

---

## Task 6: Lộ trình tuần 10–11 (8 mục) — part2 đủ 20 mục

**Files:**
- Modify: `webapp/js/data/kafka-roadmap-part2.js`

**Interfaces:**
- Consumes: `kafkaWeeksPart2` từ Task 5; doc id `kafka-13`, `kafka-14`.
- Produces: `kafkaWeeksPart2` đủ 5 tuần / **20 mục**; tổng toàn track 44.

- [ ] **Step 1: Đọc 2 chương nguồn**

`kafka-vi/13-monitoring-kafka.md`, `14-stream-processing.md`.

- [ ] **Step 2: Viết tuần 10 — `kf-w10`, 4 mục (ch.13)**

Nối vào **cuối** mảng, sau `kf-w9`. `title`: `"Giám sát Kafka"` · `resources` trỏ `#/docs/kafka-13`.

`practice`: Bật JMX trên broker và gắn `jconsole` (hoặc Prometheus JMX exporter). Dựng đúng ba biểu đồ: under-replicated partitions, request handler idle ratio, và consumer lag. Rồi viết một SLO cho một trong ba theo mục "Mục tiêu mức dịch vụ (Service-Level Objectives)" — nêu rõ ngưỡng và cửa sổ thời gian.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w10-1` | Metric cơ bản, JMX, và cách đặt SLO cho một cluster | ch.13 §"Kiến thức cơ bản về metric (Metric Basics)" + §"Mục tiêu mức dịch vụ (Service-Level Objectives)" |
| `kf-w10-2` | Metric của broker — cái nào thật sự báo động | ch.13 §"Metric của Kafka Broker (Kafka Broker Metrics)" |
| `kf-w10-3` | Giám sát client và giám sát lag | ch.13 §"Giám sát client (Client Monitoring)" + §"Giám sát lag (Lag Monitoring)" |
| `kf-w10-4` | Giám sát đầu-cuối | ch.13 §"Giám sát đầu-cuối (End-to-End Monitoring)" |

- [ ] **Step 3: Viết tuần 11 — `kf-w11`, 4 mục (ch.14)**

`title`: `"Stream processing"` · `resources` trỏ `#/docs/kafka-14` và `{ label: "kafka.apache.org — Kafka Streams", href: "https://kafka.apache.org/documentation/streams/" }`.

`practice`: Viết một ứng dụng Kafka Streams đếm từ theo cửa sổ thời gian, bám theo mục "Kafka Streams qua các ví dụ". Rồi liệt kê các topic mà nó tự tạo (`kafka-topics.sh --list`) để thấy state store được backing bằng topic nội bộ thế nào — đó là điều mục "Kafka Streams: Tổng quan kiến trúc" mô tả.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `kf-w11-1` | Stream processing là gì, và các khái niệm nền của nó | ch.14 §"Stream Processing là gì?" + §"Các khái niệm về Stream Processing" |
| `kf-w11-2` | Các design pattern trong xử lý luồng | ch.14 §"Các Design Pattern trong Stream Processing" |
| `kf-w11-3` | Kafka Streams qua ví dụ, và kiến trúc bên trong | ch.14 §"Kafka Streams qua các ví dụ" + §"Kafka Streams: Tổng quan kiến trúc" |
| `kf-w11-4` | Khi nào dùng stream processing, và chọn framework nào | ch.14 §"Các tình huống sử dụng Stream Processing" + §"Cách chọn một Stream Processing Framework" |

- [ ] **Step 4: Đếm mục và xác nhận tổng toàn track = 44**

```bash
node -e "Promise.all([
  import('./webapp/js/data/kafka-roadmap-part1.js'),
  import('./webapp/js/data/kafka-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.kafkaWeeksPart1, ...b.kafkaWeeksPart2];
  console.log('part1:', a.kafkaWeeksPart1.flatMap(x=>x.items).length,
              '| part2:', b.kafkaWeeksPart2.flatMap(x=>x.items).length,
              '| tổng tuần:', w.length, '| TỔNG MỤC:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `part1: 24 | part2: 20 | tổng tuần: 11 | TỔNG MỤC: 44` và chuỗi
`kf-w1:4 kf-w2:3 kf-w3:4 kf-w4:5 kf-w5:5 kf-w6:3 kf-w7:4 kf-w8:4 kf-w9:4 kf-w10:4 kf-w11:4`

- [ ] **Step 5: Kiểm anchor, độ dài, cấu trúc và tiêu đề trích**

Chạy lại các lệnh Task 5 Step 7, bảng `map` mở rộng thêm `'kafka-13':'13-monitoring-kafka','kafka-14':'14-stream-processing'`.
Kỳ vọng: cả bốn dòng `OK`.

- [ ] **Step 6: Kiểm mọi tuần có `practice` thật, và `goal` không rỗng**

```bash
node -e "Promise.all([
  import('./webapp/js/data/kafka-roadmap-part1.js'),
  import('./webapp/js/data/kafka-roadmap-part2.js')
]).then(([a,b])=>{
  const w=[...a.kafkaWeeksPart1,...b.kafkaWeeksPart2];
  const noP=w.filter(x=>!x.practice||x.practice.trim().split(/\s+/).length<25);
  const noG=w.filter(x=>!x.goal||!x.goal.trim());
  const keys=w.filter(x=>JSON.stringify(Object.keys(x))!==JSON.stringify(['id','week','title','goal','practice','resources','items']));
  console.log('practice:', w.map(x=>x.id+':'+(x.practice?x.practice.trim().split(/\s+/).length:0)).join(' '));
  console.log(noP.length? 'PRACTICE THIẾU/NGẮN: '+noP.map(x=>x.id).join(', ') : 'OK — 11 tuần đều có practice cụ thể');
  console.log(noG.length? 'THIẾU goal: '+noG.map(x=>x.id).join(', ') : 'OK — 11 tuần đều có goal');
  console.log(keys.length? 'SAI THỨ TỰ KHOÁ: '+keys.map(x=>x.id).join(', ') : 'OK — thứ tự khoá đúng ở cả 11 tuần');
})"
```

Kỳ vọng: cả ba dòng `OK`. Ngưỡng 25 từ là chốt chặn thô — qua ngưỡng vẫn phải tự đọc lại xem `practice` có nêu lệnh/tham số cụ thể của chương không, và **không đụng sáu chỗ code cụt**.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/kafka-roadmap-part2.js
git commit -m "feat: lộ trình đọc Kafka tuần 10-11 — đủ 11 tuần / 44 mục"
```

---

## Task 7: Bật module `roadmap`, khai track, thêm hai chip

**Files:**
- Modify: `webapp/check-data.mjs` (bảng `EXPECTED.counts`)
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/data/senior-java-gd4.js`
- Modify: `webapp/js/data/ddia-roadmap-part2.js`

(Chú thích đầu `webapp/js/views/roadmap.js` sửa ở Task 8.)

**Interfaces:**
- Consumes: `kafkaWeeksPart1` (24 mục) và `kafkaWeeksPart2` (20 mục).
- Produces: track id `kafka` — địa chỉ `#/roadmap/kafka` mà hai chip trỏ tới.

- [ ] **Step 1: Khai bảng kỳ vọng — để checker đỏ có chủ đích**

Thêm ngay dưới dòng `"docs:kafka": 13,`:

```js
    "roadmap-items:kafka": 44,
```

- [ ] **Step 2: Chạy checker để xác nhận nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **ĐỎ** — kỳ vọng 44 nhưng track chưa khai nên thực tế 0. Đây là bước red.

- [ ] **Step 3: Ghi lại số mục của hai lĩnh vực sắp bị chạm — TRƯỚC khi sửa**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  for(const f of ['senior-java','ddia'])
    console.log(f+':', m.tracks.filter(t=>t.field===f).flatMap(t=>t.weeks).flatMap(w=>w.items).length, 'mục');
})"
```

Kỳ vọng: `senior-java: 276 mục` và `ddia: 48 mục`. Ghi lại — Step 9 phải ra đúng hai con số này.

- [ ] **Step 4: Khai track trong `roadmap.js`**

Thêm hai import cạnh nhóm import hiện có:

```js
import { kafkaWeeksPart1 } from "./kafka-roadmap-part1.js";
import { kafkaWeeksPart2 } from "./kafka-roadmap-part2.js";
```

Thêm khối track vào **cuối** mảng `tracks`:

```js
  {
    id: "kafka",
    field: "kafka",
    label: "Kafka",
    icon: "📨",
    name: "Đọc Kafka: The Definitive Guide (ấn bản 2)",
    durationWeeks: 11,
    desc: "Kế hoạch đọc 11 tuần bám theo bản dịch chương 2–14: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực hành trên cluster thật.",
    prereq: "Yêu cầu: biết Java ở mức đọc được code client, quen dòng lệnh Linux, và dựng được một cluster Kafka một broker bằng Docker. Bản dịch bắt đầu từ chương 2 (cài đặt) — chương 1 giới thiệu khái niệm không nằm trong phạm vi.",
    weeks: [...kafkaWeeksPart1, ...kafkaWeeksPart2],
  },
```

Không bọc `withBookRefs`.

Cập nhật khối chú thích đầu tệp: thêm Kafka vào câu liệt kê track, thêm dòng bảng
`//   Kafka: kafka-roadmap-part{1,2}.js (Tuần 1–6 / 7–11)     — 44 mục` **canh cột khớp các dòng sẵn có** (mở tệp đếm cột, đừng chép khoảng trắng từ đây), và thêm `kf-w1` / `kf-w1-1` vào dòng LƯU Ý id.

- [ ] **Step 5: Bật module `roadmap` cho lĩnh vực `kafka`**

Trong `fields.js`, entry `kafka`: xoá dòng chú thích `// Module "roadmap" mở ở Task 7…` và đổi thành `modules: ["dashboard", "docs", "roadmap"],`.

- [ ] **Step 6: Chạy checker để xác nhận XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: **XANH toàn bộ**, gồm `roadmap-items:kafka` = 44, "Id mục lộ trình khớp tiền tố id tuần cha" (`kf-w4-3` ⊂ `kf-w4`), "Mọi khối tuần có ít nhất 1 mục", #3/#3b/#3c.

Nếu đỏ ở "44 ≠ thực tế": đếm lại bằng lệnh Task 6 Step 4 và sửa **dữ liệu**, không sửa con số 44 trong `EXPECTED` — 44 là con số spec chốt.

- [ ] **Step 7: Thêm chip thứ nhất vào `sj-gd4-w1`**

Trong `webapp/js/data/senior-java-gd4.js`, tuần có `id: "sj-gd4-w1"` và `title: "Kafka nền tảng"`. Thêm **một** phần tử vào cuối mảng `resources` của tuần đó:

```js
      { label: "📨 Sang lĩnh vực Kafka — lộ trình đọc 11 tuần", href: "#/roadmap/kafka" },
```

**Không sửa `title`, `week`, `goal`, `doneWhen`, hay bất kỳ `item` nào. Không thêm/bớt mục. Không đụng tuần nào khác.**

- [ ] **Step 8: Thêm chip thứ hai vào `dd-w11`**

Trong `webapp/js/data/ddia-roadmap-part2.js`, tuần có `id: "dd-w11"` và `title: "Stream processing"`. Thêm **một** phần tử vào cuối mảng `resources`:

```js
      { label: "📨 Sang lĩnh vực Kafka — lộ trình đọc 11 tuần", href: "#/roadmap/kafka" },
```

Cùng ràng buộc như Step 7.

- [ ] **Step 9: Kiểm hồi quy — hai con số KHÔNG được đổi**

Chạy lại **nguyên văn** lệnh ở Step 3.

Kỳ vọng: `senior-java: 276 mục` và `ddia: 48 mục` — đúng hai con số ghi ở Step 3. Khác nghĩa là đã lỡ thêm/xoá mục khi chèn chip; hoàn tác tệp đó và làm lại.

- [ ] **Step 10: Chạy checker lần cuối**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **XANH**. Bất biến #3c ("link `#/roadmap/<trackId>` có thật") vừa được hai chip mới kích hoạt — xanh nghĩa là track `kafka` đã khai đúng ở Step 4.

- [ ] **Step 11: Commit**

```bash
git add webapp/check-data.mjs webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/senior-java-gd4.js webapp/js/data/ddia-roadmap-part2.js
git commit -m "feat: bật lộ trình Kafka 11 tuần và nối chip từ Senior Java GĐ4 và DDIA"
```

**Bước kiểm bằng mắt do controller làm:** chọn lĩnh vực Kafka → mở track, xác nhận 11 tuần / 44 checkbox, tick một mục rồi tải lại thấy tiến độ còn; sang GĐ4 tuần 1 và DDIA tuần 11 xác nhận mỗi nơi có đúng một chip mới.

---

## Task 8: Cập nhật tài liệu và số liệu

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`
- Modify: `webapp/index.html` (dòng 7)
- Modify: `webapp/js/views/roadmap.js` (dòng 1, chỉ chú thích)

**Interfaces:**
- Consumes: toàn bộ dữ liệu từ Task 1–7.
- Produces: không có mã nào; đây là task cuối.

- [ ] **Step 1: ĐO số liệu sống — không chép số từ kế hoạch**

Lĩnh vực `spring-start` có thể đã được thêm trước hoặc chưa. **Mọi con số phải lấy từ lệnh này, không từ trí nhớ hay từ kế hoạch:**

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

Delta của đợt này là **+13 tài liệu · +1 track · +44 mục · +1 lĩnh vực · +1 lĩnh vực có roadmap** so với trước Task 1 — dùng để tự kiểm số đo có hợp lý không.

**Con số "lĩnh vực có roadmap" luôn nhỏ hơn "lĩnh vực" ít nhất 1**, vì lĩnh vực `java` không khai module `roadmap`. Đó là con số dùng cho `views/roadmap.js`.

- [ ] **Step 2: `webapp/README.md`**

Ba chỗ:
1. Dòng "🗺️ Lộ trình học": số giáo trình và tổng mục theo Step 1; thêm cụm *lộ trình đọc **Kafka: The Definitive Guide** (11 tuần, 44 mục, bám theo 13 chương 2–14)* vào câu liệt kê — **in nghiêng tên sách, không in đậm**, khớp khuôn các cụm anh em; thêm `+ 44 mục đọc Kafka: The Definitive Guide` vào phép cộng trong ngoặc.
2. Dòng "📚 Thư viện tài liệu": tổng tài liệu và số lĩnh vực theo Step 1; thêm `13 Kafka: The Definitive Guide` vào phân rã, **đặt đúng vị trí theo `thứ tự lĩnh vực` in ra ở Step 1**.
3. Dòng cây thư mục: `# khai N lĩnh vực`.

Sau khi sửa, **tự cộng lại cả hai phép tính trong ngoặc** và xác nhận chúng bằng đúng tổng đã ghi.

- [ ] **Step 3: `README.md` (gốc repo)**

Ba chỗ:
1. Câu liệt kê ở đầu mục DevPrep: thêm `bản dịch **Kafka: The Definitive Guide**`, cập nhật "cả N lĩnh vực".
2. Bảng thành phần: thêm một dòng sau dòng `ddia-vi/`:

```markdown
| [`kafka-vi/`](./kafka-vi/) | Bản dịch tiếng Việt *Kafka: The Definitive Guide*, ấn bản 2 (Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 13 chương (2–14), 47 hình. Đọc trong app ở lĩnh vực Kafka: The Definitive Guide, kèm lộ trình đọc 11 tuần. |
```

3. Dòng mô tả `webapp/`: thêm Kafka vào danh sách lĩnh vực **đúng vị trí `FIELD_ORDER`**; cập nhật số giáo trình / mục / tài liệu.

- [ ] **Step 4: `webapp/index.html` dòng 7**

Trong `<meta name="description">`, thêm `Kafka: The Definitive Guide` ngay sau `Designing Data-Intensive Applications,` để khớp `FIELD_ORDER`.

- [ ] **Step 5: `webapp/js/views/roadmap.js` dòng 1**

Cập nhật "N track thuộc M lĩnh vực" — **M là con số `lĩnh vực có roadmap` in ra ở Step 1**, không phải tổng lĩnh vực. Thêm Kafka vào câu liệt kê track trong chú thích.

- [ ] **Step 6: Quét sót số liệu cũ**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const items=m.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length;
  console.log('Quét các số ĐÚNG:', items, 'mục |', docs.length, 'tài liệu |', m.tracks.length, 'giáo trình');
})"
grep -rn "giáo trình\|tài liệu thuộc\|lĩnh vực" README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js | grep -oE '[0-9]+ (giáo trình|tài liệu|lĩnh vực|mục|track)' | sort -u
```

Đối chiếu bằng mắt: mọi con số in ra ở dòng thứ hai phải khớp với số đo được ở Step 1. Bất kỳ con số lạ nào là một chỗ chưa cập nhật.

- [ ] **Step 7: Nghiệm thu lần cuối**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  for(const f of ['senior-java','ddia'])
    console.log(f+':', m.tracks.filter(t=>t.field===f).flatMap(t=>t.weeks).flatMap(w=>w.items).length);
})"
```

Kỳ vọng: checker **XANH toàn bộ**; `senior-java: 276`; `ddia: 48`. Dán nguyên output.

- [ ] **Step 8: Commit**

```bash
git add README.md webapp/README.md webapp/index.html webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm lĩnh vực Kafka: The Definitive Guide"
```
