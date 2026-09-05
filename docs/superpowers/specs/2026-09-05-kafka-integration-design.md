# Tích hợp *Kafka: The Definitive Guide* vào DevPrep — thiết kế

Ngày: 2026-09-05
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `kafka`

Spec chị em: [`2026-09-05-spring-start-integration-design.md`](2026-09-05-spring-start-integration-design.md).
Hai lĩnh vực độc lập, mỗi cái một spec, một kế hoạch, một phiên triển khai. **Thứ tự làm
không ràng buộc** — xem §10 về cách xử lý số liệu tài liệu để cuốn làm sau không sai số.

## 1. Bối cảnh

Commit `133fe65` đưa vào repo thư mục `Kafka-The Definitive Guide/`: 13 PDF chương và thư mục
`vi/` chứa bản dịch tiếng Việt **chương 2–14** của *Kafka: The Definitive Guide, ấn bản 2*
(Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly), kèm `README.md` và 47 ảnh.
Nội dung **đã dịch xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

Khuôn mẫu trực tiếp: lần thêm gần nhất — Modern Java in Action, merge `b97573b`.

Số liệu đã đo, không ước lượng:

| Chỉ số | Kafka | MJIA (đối chiếu) |
|---|---:|---:|
| Số chương | **13** (ch.2–ch.14) | 21 |
| Tổng số từ | **175.089** | 212.942 |
| Trung bình mỗi chương | 13.468 | 10.140 |
| Chương nặng nhất | ch.13 Giám sát — 19.493 | ch.6 — 15.047 |
| Chương nhẹ nhất | ch.5 Quản trị bằng lập trình — 9.180 | ch.8 — 5.524 |
| Số ảnh | **47** | 100 |

Toàn vẹn ảnh đã kiểm: **47 tệp, 47 lượt tham chiếu, 0 gãy, 0 mồ côi.**

### 1.1 Chương 1 vắng mặt là CÓ CHỦ ĐÍCH

`Kafka-The Definitive Guide/vi/README.md` mở đầu: *"Bản dịch tiếng Việt các chương 2–14"*.
Không có `chuong-01`, cũng không có PDF chương 1. Sách gốc có 14 chương; ch.1 "Meet Kafka"
(chương giới thiệu khái niệm) không nằm trong phạm vi bản dịch.

Đây **không phải lỗ hổng phải vá**. Chương 2 (cài đặt) mở đầu bằng phần thiết lập môi trường
và không giả định đã đọc ch.1. Quyết định: tích hợp 13 chương, và **ghi rõ điều này ở ba chỗ**
— `desc` của lĩnh vực, `prereq` của track, và §12 ngoài phạm vi — để về sau không ai tưởng là
thiếu sót rồi đi đánh số lại.

### 1.2 Khiếm khuyết đã biết của nguồn

README bản dịch liệt kê 6 chỗ code/output bị **chính PDF gốc** cắt cụt (code block trong ebook
là vùng cuộn ngang, phần tràn lề không nằm trong nội dung tệp), và người dịch cố ý giữ nguyên
thay vì suy đoán:

| Chương | Chỗ bị cắt |
|---|---|
| ch.3 | lệnh `kafka-configs ... --add-config 'producer_byte_` (mục Quota) |
| ch.4 | dòng `throw new SerializationException("Error when deserializing " +` trong `CustomerDeserializer` |
| ch.9 | lệnh `echo '{"name":"dump-kafka-config"...` và vài dòng output Elasticsearch |
| ch.10 | lệnh `kafka-consumer-groups.sh ... --reset-offsets --al` |
| ch.11 | ba dòng log ví dụ ở mục Auditing |
| ch.12 | vài dòng output (`Configs: segment.bytes=1`, `kafka.host2.dom`, `among 1 parti`) |

**Ràng buộc rút ra:** không mục lộ trình nào được lấy một trong sáu chỗ này làm bài tập "gõ lại
lệnh sau", và không ai được suy đoán phần thiếu để lấp vào bản dịch.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Module `["dashboard", "docs", "roadmap"]` | Đồng khuôn 5 lĩnh vực sách hiện có. Không làm flashcards/quiz đợt này. |
| 2 | Lộ trình **11 tuần / 44 mục** | ~15,9k từ/tuần. Kafka là sách vận hành — cài đặt, cấu hình, giám sát — nên mỗi tuần phải chừa chỗ dựng cluster thật để thử. |
| 3 | Doc id `kafka-02`…`kafka-14`, **bỏ trống `kafka-01`** | Số id khớp số chương sách. Tiền lệ `k8sbook-` cũng nhảy số. Đánh lại 01–13 sẽ khiến `kafka-01` trỏ vào chương 2 — nhầm lẫn vĩnh viễn vì id là khoá localStorage. |
| 4 | Tích hợp 13 chương, không chờ ch.1 | §1.1. |
| 5 | **Hai** chip liên kết chéo: từ `sj-gd4-w1` và `dd-w11` | Hai neo có thật trong dữ liệu hiện có — xem §6. |
| 6 | Liên kết chéo ở mức **track**, không mức chương | Bất biến #3b — xem §6.2. |
| 7 | Chia 2 chặng, mỗi chặng tự chạy được | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu. |
| 8 | Ảnh giữ nguyên bố cục **phẳng** | Nguồn đặt `images/hinh-<chương>-<số>.png`, không có tầng `chNN`. Không sắp xếp lại — đường dẫn trong markdown sẽ gãy hết. |

## 3. Nguồn: chuẩn hoá `kafka-vi/`

`git mv` thư mục `vi/` thành `kafka-vi/`, bỏ tiền tố `chuong-` khỏi 13 tệp markdown, rồi
chuyển 13 PDF vào cùng thư mục theo cùng slug. `README.md` và `images/` đi cùng. Giữ nguyên
nội dung — **không sửa một ký tự nào**: đường dẫn ảnh là tương đối và `images/` di chuyển cùng
các tệp `.md`.

| # | `.md` mới | `.pdf` nguồn (rút gọn) | Tiêu đề |
|---:|---|---|---|
| 02 | `02-installing-kafka.md` | `2. Installing Kafka …` | Cài đặt Kafka |
| 03 | `03-kafka-producers.md` | `3. Kafka Producers_ Writing Messages …` | Kafka Producer: Ghi message vào Kafka |
| 04 | `04-kafka-consumers.md` | `4. Kafka Consumers_ Reading Data …` | Kafka Consumer: Đọc dữ liệu từ Kafka |
| 05 | `05-managing-kafka-programmatically.md` | `5. Managing Apache Kafka Programmatically …` | Quản trị Apache Kafka bằng lập trình |
| 06 | `06-kafka-internals.md` | `6. Kafka Internals …` | Cơ chế bên trong Kafka |
| 07 | `07-reliable-data-delivery.md` | `7. Reliable Data Delivery …` | Truyền dữ liệu tin cậy |
| 08 | `08-exactly-once-semantics.md` | `8. Exactly-Once Semantics …` | Ngữ nghĩa Exactly-Once |
| 09 | `09-building-data-pipelines.md` | `9. Building Data Pipelines …` | Xây dựng data pipeline |
| 10 | `10-cross-cluster-data-mirroring.md` | `10. Cross-Cluster Data Mirroring …` | Mirroring dữ liệu liên cluster |
| 11 | `11-securing-kafka.md` | `11. Securing Kafka …` | Bảo mật Kafka |
| 12 | `12-administering-kafka.md` | `12. Administering Kafka …` | Quản trị vận hành Kafka |
| 13 | `13-monitoring-kafka.md` | `13. Monitoring Kafka …` | Giám sát Kafka |
| 14 | `14-stream-processing.md` | `14. Stream Processing …` | Xử lý luồng (Stream Processing) |

Sau khi `git mv` xong, thư mục `Kafka-The Definitive Guide/` biến mất hoàn toàn.

Trước khi đổi tên, xác nhận không nơi nào tham chiếu đường dẫn cũ:

```bash
grep -rn "Kafka-The Definitive Guide/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Kafka-The Definitive Guide" .
```

Kỳ vọng: **không dòng nào** (đã chạy thử, đúng 0 dòng). Dùng dấu `/` cuối mẫu để chỉ bắt tham
chiếu **đường dẫn**, không bắt tên sách trong văn xuôi.

**Dùng `--exclude-dir`, không dùng `grep -v "^./..."`.** Trên máy này `grep -r .` không thêm
tiền tố `./` vào đường dẫn, nên bộ lọc dạng `^./` **không ăn** và sẽ cho cảm giác an toàn giả.

### 3.1 Ảnh — bố cục phẳng, khác MJIA

47 ảnh nằm **phẳng** trong `kafka-vi/images/`, tên `hinh-<chương>-<số>.png`, không có thư mục
con theo chương. Phân bố (theo README nguồn, đã đối chiếu):

| ch.2 | ch.3 | ch.4 | ch.6 | ch.8 | ch.10 | ch.11 | ch.14 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 3 | 9 | 7 | 4 | 7 | 2 | 13 |

**Các chương 5, 7, 9, 12, 13 không có hình** trong bản gốc. Đó là đúng nguồn, không phải mất mát.

### 3.2 `webapp/build-content.sh`

```bash
# thêm vào lệnh mkdir -p sẵn có:
"$DEST/kafka/images"

# thêm 2 dòng cp:
cp    "$REPO"/kafka-vi/*.md          "$DEST/kafka/"
cp -R "$REPO"/kafka-vi/images/.      "$DEST/kafka/images/"
```

`.pdf` **không** copy sang `content/` — nhất quán với 5 thư mục sách hiện có.

`README.md` bị `*.md` quét theo sang `content/kafka/`. Vô hại và đúng tiền lệ
(`content/modconc/`, `content/mjia/` cũng vậy): không bản ghi `docs` nào trỏ vào nó.

`Dockerfile` và `.github/workflows/deploy-pages.yml` không đổi — cả hai gọi `build-content.sh`.

## 4. Lĩnh vực mới — `webapp/js/data/fields.js`

```js
kafka: {
  label: "Kafka: The Definitive Guide",
  icon: "📨",
  desc: "Bản dịch tiếng Việt Kafka: The Definitive Guide, ấn bản 2 (Gwen Shapira, " +
        "Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly) — chương 2–14: cài đặt, " +
        "producer, consumer, cơ chế bên trong, truyền tin cậy, exactly-once, data " +
        "pipeline, mirroring, bảo mật, vận hành, giám sát và stream processing.",
  certFilter: false,
  modules: ["dashboard", "docs"],              // chặng 1
  // modules: ["dashboard", "docs", "roadmap"],   // chặng 2
  externalRef: { label: "kafka.apache.org/documentation",
                 href: "https://kafka.apache.org/documentation/" },
},
```

Cụm "chương 2–14" trong `desc` là chỗ thứ nhất trong ba chỗ nói rõ phạm vi bản dịch (§1.1).

`FIELD_ORDER` — chèn `kafka` ngay sau `ddia`:

```js
["kubernetes", "sysprog", "java", "modern-java", "ddia", "kafka",
 "modern-concurrency", "spring-security", "senior-java"]
```

Kafka đứng cạnh DDIA vì cùng tầng hạ tầng dữ liệu, và DDIA ch.12 (stream processing) dẫn thẳng
sang nó — chính là chip ở §6.1.

Icon 📨 không đụng icon nào đang dùng: ☸️ 🖥️ ☕ 🌊 🗄️ 🧵 🔒 🧭.

**Bản quyền:** sách thương mại của O'Reilly. Ghi đúng khuôn đã dùng cho `k8s-ebook`,
`spring-security-vi`, `ddia-vi`, `modern-java-vi`.

### Sơ đồ id

| Loại | Khuôn | Ví dụ |
|---|---|---|
| Lĩnh vực | `kafka` | — |
| Tài liệu | `kafka-NN` | `kafka-02` … `kafka-14` (không có `kafka-01`) |
| Track | `kafka` | — |
| Tuần | `kf-wN` | `kf-w1` … `kf-w11` |
| Mục | `kf-wN-M` | `kf-w4-3` |

Tiền tố `kf-` không đụng tiền tố tuần nào đang dùng (`w`, `cka-w`, `cks-w`, `sp-w`, `kb-w`,
`ss-w`, `mc-w`, `dd-w`, `mj-w`, `sj-gd*-w`); `kafka-` không đụng `k8sbook-`.
**Mọi id là khoá localStorage — không được đổi về sau.**

## 5. Module `docs` — 13 tài liệu

13 bản ghi trong `webapp/js/data/docs-index.js`, nhóm
`// ===== Kafka: The Definitive Guide (O'Reilly, ấn bản 2) =====`:

```js
{
  id: "kafka-06",
  field: "kafka",
  title: "Kafka 06 — Cơ chế bên trong Kafka",
  file: "content/kafka/06-kafka-internals.md",
  icon: "⚙️",
  desc: "<1–2 câu>",
  tags: ["Controller", "Replication", "Storage"],
}
```

`title` theo khuôn `Kafka NN — <tiêu đề chương tiếng Việt>`, lấy phần tiếng Việt của H1, bỏ
phần tiếng Anh trong ngoặc. `desc` viết mới, 1–2 câu, nêu chương trả lời câu hỏi gì.

Cập nhật khối chú thích đầu `docs-index.js` để thêm `kafka-vi/` vào danh sách thư mục nguồn.

## 6. Liên kết chéo — hai chip

### 6.1 Hai neo có thật

| Chip đặt ở | Vì sao đúng chỗ |
|---|---|
| `sj-gd4-w1` — `title: "Kafka nền tảng"` (`senior-java-gd4.js`) | Tuần đó tên là "Kafka nền tảng"; không chỗ nào trong repo khớp hơn. |
| `dd-w11` — `title: "Stream processing"` (`ddia-roadmap-part2.js`) | DDIA ch.12 bàn stream processing và dẫn Kafka làm ví dụ xuyên suốt. |

Cả hai thêm **đúng một** phần tử vào mảng `resources` của tuần tương ứng:

```js
{ label: "📨 Sang lĩnh vực Kafka — lộ trình đọc 11 tuần", href: "#/roadmap/kafka" }
```

**Không sửa chữ nào khác** của hai tuần đó — không `title`, không `goal`, không `doneWhen`,
không `item` nào. **Không thêm/bớt mục.**

**Hồi quy bắt buộc:** `"roadmap-items:senior-java"` vẫn **276** và `"roadmap-items:ddia"` vẫn
**48** sau khi sửa. Hai con số này nhúc nhích nghĩa là đã lỡ tay thêm/xoá mục.

### 6.2 Không liên kết chéo ở mức chương

Bất biến **#3b** quét `week.resources[].href` *và* `item.lesson`, bắt mọi link `#/docs/<id>`
phải cùng lĩnh vực với track chứa nó. `navigate()` (`webapp/js/app.js:159`) suy lĩnh vực từ
tài liệu được mở, nên link xuyên lĩnh vực âm thầm đổi lĩnh vực đang chọn của người dùng.

**Không nới bất biến, không thêm allowlist, không thêm bảng crossref** — đúng tiền lệ spec
Modern Concurrency §6.4, DDIA §6.3, MJIA §6.2. Hệ quả: `withBookRefs` giữ nguyên chữ ký cũ.

## 7. Module `roadmap` — track `kafka`

### 7.1 Phân bổ tuần

Nguyên tắc: **một chương một tuần**, chỉ gộp 2 cặp liền mạch về chủ đề.

| Tuần | Chương | Số từ | Ảnh | Mục | Tiêu đề |
|---|---|---:|---:|---:|---|
| `kf-w1` | ch.2 | 13.231 | 2 | 4 | Cài đặt Kafka và cấu hình broker |
| `kf-w2` | ch.3 | 11.564 | 3 | 3 | Producer: ghi message vào Kafka |
| `kf-w3` | ch.4 | 13.599 | 9 | 4 | Consumer, consumer group và rebalance |
| `kf-w4` | ch.5 + ch.6 | 22.205 | 7 | 5 | AdminClient, và cơ chế bên trong Kafka |
| `kf-w5` | ch.7 + ch.8 | 20.279 | 4 | 5 | Truyền dữ liệu tin cậy và exactly-once |
| `kf-w6` | ch.9 | 12.017 | 0 | 3 | Xây dựng data pipeline với Kafka Connect |
| `kf-w7` | ch.10 | 15.428 | 7 | 4 | Mirroring dữ liệu liên cluster |
| `kf-w8` | ch.11 | 15.782 | 2 | 4 | Bảo mật Kafka — xác thực, phân quyền, mã hoá |
| `kf-w9` | ch.12 | 13.661 | 0 | 4 | Quản trị vận hành |
| `kf-w10` | ch.13 | 19.493 | 0 | 4 | Giám sát Kafka |
| `kf-w11` | ch.14 | 17.830 | 13 | 4 | Stream processing |

**Tổng 44 mục / 175.089 từ / 47 ảnh.** Hai tuần 3 mục (`kf-w2`, `kf-w6`) là hai chương nhẹ
nhất trong nhóm, đặt xen ngay trước và sau hai tuần 5 mục để bù nhịp.

### 7.2 Lược đồ nội dung mỗi mục

Giữ nguyên khuôn 4 khối của track DDIA / Modern Concurrency / MJIA:

```js
{
  id: "kf-w4-3",
  text: "<một dòng nêu việc cần làm>",
  lesson: `**Mục tiêu.** … **Đọc.** … **Bẫy.** … **Tự kiểm tra.** …`,
}
```

- **Mục tiêu** — người đọc làm được gì sau mục này.
- **Đọc** — trỏ anchor vào chính bản dịch (`#/docs/kafka-06`), chỉ đúng phần cần đọc. Tên mục
  trích **nguyên văn** tiêu đề `##`/`###` trong tệp nguồn. **Không chép lại nội dung sách.**
- **Bẫy** — lấy từ chỗ sách tự cảnh báo, không bịa.
- **Tự kiểm tra** — câu hỏi chỉ trả lời được sau khi đọc đúng phần đó.

Tuần có `id`, `week`, `title`, `goal`, `practice`, `resources`, `items` — dùng `practice`
(quy ước track sách), không phải `doneWhen`.

**Phần thực hành nằm ở `practice` mức tuần.** Kafka là sách vận hành, nên `practice` phải là
thao tác trên một cluster thật (Docker Compose một broker là đủ cho hầu hết tuần), nêu đúng
lệnh/tham số cấu hình của chương tuần đó. **Không được lấy một trong sáu chỗ code bị cắt cụt
ở §1.2 làm bài tập** — người đọc sẽ gõ theo một dòng không hoàn chỉnh.

### 7.3 Chia tệp và khai track

- `webapp/js/data/kafka-roadmap-part1.js` → `kafkaWeeksPart1`, tuần 1–6, **24 mục**
- `webapp/js/data/kafka-roadmap-part2.js` → `kafkaWeeksPart2`, tuần 7–11, **20 mục**

```js
{
  id: "kafka",
  field: "kafka",
  label: "Kafka",
  icon: "📨",
  name: "Đọc Kafka: The Definitive Guide (ấn bản 2)",
  durationWeeks: 11,
  desc: "Kế hoạch đọc 11 tuần bám theo bản dịch chương 2–14: mỗi mục nêu mục tiêu, chỉ " +
        "đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực " +
        "hành trên cluster thật.",
  prereq: "Yêu cầu: biết Java ở mức đọc được code client, quen dòng lệnh Linux, và dựng " +
          "được một cluster Kafka một broker bằng Docker. Bản dịch bắt đầu từ chương 2 " +
          "(cài đặt) — chương 1 giới thiệu khái niệm không nằm trong phạm vi.",
  weeks: [...kafkaWeeksPart1, ...kafkaWeeksPart2],
}
```

`prereq` là chỗ thứ hai nói rõ phạm vi chương 2–14. Không bọc `withBookRefs`.

## 8. Bất biến dữ liệu — `webapp/check-data.mjs`

**Không viết bất biến mới.** Chỉ mở rộng bảng kỳ vọng, và **khai trước khi viết dữ liệu**:

```js
// Lĩnh vực Kafka — 13 chương (2–14) Kafka: The Definitive Guide ấn bản 2.
"docs:kafka": 13,
"roadmap-items:kafka": 44,   // thêm ở chặng 2
```

Bất biến N3 tự cưỡng chế hai khoá này ngay khi `fields.js` khai module.

Các bất biến sẵn có tự phủ: #1 id duy nhất · #2 tệp docs tồn tại trên đĩa · **#2b ảnh trong
markdown tồn tại trên đĩa (47 ảnh phẳng)** · #3/#3b/#3c link hợp lệ · "Id mục lộ trình khớp
tiền tố id tuần cha" (`kf-w4-3` ⊂ `kf-w4`) · "Mọi khối tuần có ít nhất 1 mục" · "FIELD_ORDER
khớp FIELDS 1-1" · #7/#7b · "Module chỉ dành cho Kubernetes không bị lĩnh vực khác khai".

## 9. Thứ tự triển khai

**Chặng 1 — lĩnh vực sống, đọc được 13 chương.**

1. `grep` xác nhận không tham chiếu đường dẫn cũ, rồi `git mv` sang `kafka-vi/` (13 `.md`,
   13 `.pdf`, `README.md`, `images/` 47 tệp).
2. `build-content.sh`: `mkdir` + 2 dòng `cp`.
3. `check-data.mjs`: khai `"docs:kafka": 13`.
4. `fields.js`: entry `kafka`, `modules: ["dashboard", "docs"]`, chèn `FIELD_ORDER`.
5. `docs-index.js`: 13 bản ghi + cập nhật chú thích đầu tệp.
6. Nghiệm thu chặng 1 (§11), rồi cập nhật tài liệu (§10).

**Chặng 2 — giáo trình 11 tuần.**

7. `check-data.mjs`: khai `"roadmap-items:kafka": 44`.
8. `kafka-roadmap-part1.js` (24 mục) và `kafka-roadmap-part2.js` (20 mục).
9. `roadmap.js`: import + khai track + cập nhật chú thích đầu tệp.
10. `fields.js`: bật `"roadmap"`.
11. `senior-java-gd4.js` + `ddia-roadmap-part2.js`: mỗi tệp thêm **đúng một** chip (§6.1).
12. Nghiệm thu chặng 2 (§11), cập nhật số liệu tài liệu (§10).

## 10. Tài liệu phải cập nhật — dùng DELTA, không chốt cứng

Lĩnh vực này và `spring-start` triển khai ở hai phiên riêng và **thứ tự chưa xác định**. Chốt
cứng con số tuyệt đối trong spec sẽ khiến cuốn làm sau ghi sai. Vì vậy kế hoạch phải **đo số
liệu sống ngay trước khi sửa tài liệu**:

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
  console.log('lĩnh vực có roadmap:',
    f.FIELD_ORDER.filter(x=>f.FIELDS[x].modules.includes('roadmap')).length);
})"
```

Delta của đợt này: **+13 tài liệu · +1 track · +44 mục · +1 lĩnh vực · +1 lĩnh vực có roadmap.**

Các chỗ phải sửa (nội dung theo số đo được, không theo số viết ở đây):

| Chỗ | Sửa gì |
|---|---|
| `webapp/README.md` dòng "Lộ trình học" | số giáo trình, tổng mục, thêm mô tả track Kafka (11 tuần, 44 mục, bám theo 13 chương) và addend `+ 44 mục đọc Kafka` — **nhấn markdown chỉ in nghiêng tên sách**, không in đậm |
| `webapp/README.md` dòng "Thư viện tài liệu" | tổng tài liệu, số lĩnh vực, thêm `13 Kafka` vào phân rã — **đặt đúng vị trí `FIELD_ORDER`** |
| `webapp/README.md` cây thư mục | `khai N lĩnh vực` |
| `README.md` câu liệt kê lĩnh vực | thêm "bản dịch **Kafka: The Definitive Guide**", cập nhật "cả N lĩnh vực" |
| `README.md` bảng thành phần | thêm dòng `kafka-vi/` — *"13 chương (2–14), 47 hình"* + khuôn bản quyền thương mại |
| `README.md` dòng `webapp/` | số giáo trình / mục / tài liệu, thêm Kafka vào danh sách lĩnh vực đúng vị trí `FIELD_ORDER` |
| `webapp/index.html:7` | meta description: thêm "Kafka: The Definitive Guide" sau "Designing Data-Intensive Applications" |
| `webapp/js/data/roadmap.js` | chú thích đầu tệp: dòng bảng `Kafka: kafka-roadmap-part{1,2}.js (Tuần 1–6 / 7–11) — 44 mục`, thêm vào câu liệt kê track, thêm `kf-w1` / `kf-w1-1` vào dòng LƯU Ý id |
| `webapp/js/data/docs-index.js` chú thích đầu | thêm `kafka-vi/` |
| `webapp/js/views/roadmap.js:1` | "N track thuộc M lĩnh vực" — **M đếm lĩnh vực khai module `roadmap`**, không phải tổng lĩnh vực (`java` không khai) |

## 11. Nghiệm thu

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

`package.json` chỉ khai `type: module` — repo **không có test runner nào khác**.
`check-data.mjs` là toàn bộ lớp nghiệm thu tự động. Phải dán output thật.

**Chặng 1 xanh khi:** #1, #2 (13 tệp), **#2b (47 ảnh)**, `"docs:kafka": 13`, N3, FIELD_ORDER
khớp FIELDS 1-1, #7/#7b.
Kiểm bằng mắt (người, không phải subagent): mở `Kafka 14 — Xử lý luồng` (13 ảnh, nhiều nhất)
và `Kafka 04 — Kafka Consumer` (9 ảnh), xác nhận ảnh hiện và mục lục nổi dựng đúng.

**Chặng 2 xanh khi:** id tuần/mục duy nhất, tiền tố mục khớp tuần cha, mọi tuần ≥ 1 mục,
#3/#3b/#3c, `"roadmap-items:kafka": 44`.

**Hồi quy bắt buộc:** `"roadmap-items:senior-java"` vẫn **276** và `"roadmap-items:ddia"` vẫn
**48**.

## 12. Ngoài phạm vi

- **Dịch hay tích hợp chương 1** *(Meet Kafka)*. Không nằm trong bản dịch (§1.1). Nếu về sau
  có bản dịch ch.1, nó vào làm `kafka-01` và lộ trình thêm một mục ở `kf-w1` — id hiện có
  không phải đổi, đó chính là lý do quyết định #3 giữ số id khớp số chương.
- **Vá 6 chỗ code bị PDF gốc cắt cụt** (§1.2). Nhận nguyên trạng.
- **Flashcards và trắc nghiệm cho Kafka.** Đợt sau.
- **Phục vụ `.pdf` qua web.**
- **Crossref mức chương** từ `senior-java` hay `ddia` (§6.2).
- **Sửa `app.js` để link xuyên lĩnh vực không đổi lĩnh vực đang chọn.** Hạn chế đã biết.

## 13. Rủi ro và giới hạn đã biết

1. **Khối lượng viết mới lớn.** 44 mục × 250–400 từ ≈ 13–18 nghìn từ, cộng 13 `desc` và 11
   `practice`. Chia 2 chặng để hết chặng 1 đã có thứ dùng được.
2. **Chất lượng khối "Bẫy" phụ thuộc việc đọc thật từng chương.** Mỗi "Bẫy" phải truy được về
   một đoạn cảnh báo có thật. Kafka có rất nhiều blockquote `> **Cảnh báo**` / `> **Lưu ý**` —
   đó là mỏ quặng, không phải chỗ để bịa.
3. **`practice` dễ trôi thành lời khuyên chung chung.** Ràng buộc: mỗi `practice` nêu lệnh
   hoặc tham số cấu hình cụ thể của chương tuần đó, và **tránh 6 chỗ code cụt ở §1.2**.
4. **Hai chip, hai tệp dữ liệu của hai lĩnh vực khác** — nhiều hơn tiền lệ (MJIA và DDIA mỗi
   cái một chip). Giảm nhẹ bằng hai lệnh hồi quy bắt buộc ở §11.
5. **`git mv` 74 tệp** (13 md + 13 pdf + README + 47 ảnh). Thư mục vừa commit ở `133fe65` và
   chưa nơi nào tham chiếu — nhưng grep lại ngay trước khi đổi tên.
6. **Ảnh phẳng, không theo thư mục chương.** Người triển khai quen MJIA (`images/chNN/`) dễ
   tự ý sắp xếp lại. **Không được.** Mọi đường dẫn trong markdown sẽ gãy và #2b sẽ đỏ 47 lần.
