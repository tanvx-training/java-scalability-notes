# Tích hợp *Designing Data-Intensive Applications* vào DevPrep — thiết kế

Ngày: 2026-09-04
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực thứ 7 của DevPrep — id `ddia`

## 1. Bối cảnh

Commit `a45d233` đưa vào repo thư mục `Designing Data-Intensive Applications/`: 14 chương
bản dịch tiếng Việt của DDIA ấn bản 2 (Martin Kleppmann, O'Reilly), kèm `.pdf` từng chương
và 105 ảnh trong `images/ch1`–`images/ch13`. Nội dung **đã dịch xong**; việc còn lại thuần
tuý là tích hợp vào web app DevPrep.

DevPrep hiện có 6 lĩnh vực. Lần thêm gần nhất — Modern Concurrency in Java, merge `37aedf1`
— chạm 9 tệp và là khuôn mẫu trực tiếp cho đợt này. Kiến trúc app đã đủ chín để việc thêm
một lĩnh vực không phải sửa view nào: `dashboard.js` đọc thẳng từ `fields.js`.

Điểm khác biệt so với các lần trước: DDIA nặng hơn hẳn — 14 chương, ~295 nghìn từ, chương
lớn nhất (ch.8 Transaction) 33 nghìn từ, gấp đôi mặt bằng chương của Modern Concurrency.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Module: `["dashboard", "docs", "roadmap"]` | Đồng khuôn Modern Concurrency và Spring Security. Không làm flashcards/quiz đợt này. |
| 2 | Lộ trình 12 tuần / 48 mục | Bám độ nặng thật của sách; 9 tuần cho ~33 nghìn từ/tuần là nhịp không đọc nổi. |
| 3 | Đổi tên sang `ddia-vi/NN-slug.md` | Quy ước repo (`k8s-ebook/`, `spring-security-vi/`, `modern-concurrency-vi/`). |
| 4 | Có liên kết chéo, **chỉ** từ Senior Java GĐ4 | Mô tả track `sj-gd4` đã hứa "Sách nền của giai đoạn là DDIA". |
| 5 | Liên kết chéo ở mức **track**, không mức chương | Bất biến #3b cấm link `#/docs/` xuyên lĩnh vực — xem §6.3. |
| 6 | Sửa đánh số chương ấn bản 1 → 2 ở GĐ4 | Dữ liệu hiện có đã sai so với chính sách trong repo — xem §6.1. |
| 7 | Chia 2 chặng, mỗi chặng tự chạy được | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu. |
| 8 | Giữ ch.8 nguyên một tuần dù nặng 33 nghìn từ | Chương Transaction là một mạch lập luận liền; cắt giữa "isolation yếu" và "serializability" làm gãy đúng chỗ hay nhất. |

## 3. Nguồn: chuẩn hoá `ddia-vi/`

`git mv` thư mục và 14 tệp `.md`. Giữ nguyên nội dung, giữ cả `.pdf` và `images/`.
Đường dẫn ảnh trong markdown là tương đối (`images/ch1/fig-1-1.png`) nên **không sửa một
ký tự nào** trong nội dung.

| Cũ (rút gọn) | Mới |
|---|---|
| `1. Trade-Offs in Data Systems Architecture …` | `01-danh-doi-trong-kien-truc-he-thong-du-lieu.md` |
| `2. Defining Nonfunctional Requirements …` | `02-xac-dinh-cac-yeu-cau-phi-chuc-nang.md` |
| `3. Data Models and Query Languages …` | `03-mo-hinh-du-lieu-va-ngon-ngu-truy-van.md` |
| `4. Storage and Retrieval …` | `04-luu-tru-va-truy-xuat.md` |
| `5. Encoding and Evolution …` | `05-encoding-va-tien-hoa.md` |
| `6. Replication …` | `06-replication.md` |
| `7. Sharding …` | `07-sharding.md` |
| `8. Transactions …` | `08-transaction.md` |
| `9. The Trouble with Distributed Systems …` | `09-nhung-rac-roi-cua-he-phan-tan.md` |
| `10. Consistency and Consensus …` | `10-tinh-nhat-quan-va-consensus.md` |
| `11. Batch Processing …` | `11-batch-processing.md` |
| `12. Stream Processing …` | `12-stream-processing.md` |
| `13. A Philosophy of Streaming Systems …` | `13-mot-triet-ly-ve-he-thong-streaming.md` |
| `14. Doing the Right Thing …` | `14-lam-dieu-dung-dan.md` |

Slug lấy từ chính tiêu đề H1 tiếng Việt trong tệp, không dịch lại từ tên tiếng Anh.

### `webapp/build-content.sh`

```bash
# thêm vào lệnh mkdir -p sẵn có:
"$DEST/ddia/images"

# thêm 2 dòng cp:
cp    "$REPO"/ddia-vi/*.md          "$DEST/ddia/"
cp -R "$REPO"/ddia-vi/images/.      "$DEST/ddia/images/"
```

`.pdf` **không** copy sang `content/` — nhất quán với 3 thư mục sách hiện có; PDF ở lại repo
làm nguồn đối chiếu, không phục vụ qua web.

`Dockerfile` và `.github/workflows/deploy-pages.yml` không đổi: cả hai đều gọi
`build-content.sh`, vốn là nguồn duy nhất của logic copy.

## 4. Lĩnh vực mới — `webapp/js/data/fields.js`

```js
ddia: {
  label: "Designing Data-Intensive Applications",
  icon: "🗄️",
  desc: "Bản dịch tiếng Việt Designing Data-Intensive Applications, ấn bản 2 " +
        "(Martin Kleppmann, O'Reilly) — mô hình dữ liệu, lưu trữ, replication, " +
        "sharding, transaction, hệ phân tán, batch và stream processing.",
  certFilter: false,
  modules: ["dashboard", "docs"],           // chặng 1
  // modules: ["dashboard", "docs", "roadmap"],  // chặng 2
  externalRef: { label: "dataintensive.net", href: "https://dataintensive.net/" },
},
```

`FIELD_ORDER` — chèn `ddia` ngay sau `java`:

```js
["kubernetes", "sysprog", "java", "ddia", "modern-concurrency", "spring-security", "senior-java"]
```

DDIA là phần nối tiếp về chiều sâu của Java & Spring Boot Scalability, và nó đứng trước
`senior-java` — lĩnh vực có track trích dẫn nó.

**Bản quyền:** sách thương mại của O'Reilly, không phải giấy phép mở như CC BY 4.0. Ghi
đúng khuôn đã dùng cho `k8s-ebook`, `spring-security-vi`, `modern-concurrency-vi`.

### Sơ đồ id

| Loại | Khuôn | Ví dụ |
|---|---|---|
| Lĩnh vực | `ddia` | — |
| Tài liệu | `ddia-NN` | `ddia-01` … `ddia-14` |
| Track lộ trình | `ddia` | — |
| Tuần | `dd-wN` | `dd-w1` … `dd-w12` |
| Mục | `dd-wN-M` | `dd-w7-3` |

Tiền tố `dd-` không đụng bất kỳ tiền tố nào đang dùng (`w`, `cka-w`, `cks-w`, `sp-w`,
`kb-w`, `ss-w`, `mc-w`, `sj-gd*-w`). **Mọi id là khoá localStorage — không được đổi về sau.**

## 5. Module `docs` — 14 tài liệu

14 bản ghi trong `webapp/js/data/docs-index.js`, nhóm `// ===== DDIA =====`:

```js
{
  id: "ddia-06",
  field: "ddia",
  title: "Chương 6 — Replication",
  file: "content/ddia/06-replication.md",
  icon: "🔁",
  desc: "<1–2 câu>",
  tags: ["Replication", "Leader", "Quorum"],
}
```

`title` lấy nguyên tiêu đề chương tiếng Việt. `desc` viết mới, 1–2 câu, nêu chương trả lời
câu hỏi gì — không tóm tắt nội dung.

## 6. Liên kết chéo với lĩnh vực `senior-java`

### 6.1 Sửa đánh số chương ấn bản 1 → 2

Track `sj-gd4` xếp lịch DDIA theo đánh số **ấn bản 1**, trong khi bản dịch trong repo là
**ấn bản 2**. Không sửa thì màn hình sẽ tự mâu thuẫn: dòng chữ "ch.5 (replication)" nằm
cạnh tài liệu "Chương 6 — Replication".

Bảng quy đổi:

| Nội dung | Ấn bản 1 | Ấn bản 2 |
|---|---|---|
| LSM-tree vs B-tree (Storage & Retrieval) | ch.3 | **ch.4** |
| Replication | ch.5 | **ch.6** |
| Partitioning / Sharding | ch.6 | **ch.7** |
| Transactions | ch.7 | **ch.8** |
| Network/clock không tin được | ch.8 | **ch.9** |
| Consensus | ch.9 | **ch.10** |
| Stream processing | ch.11 | **ch.12** |

Phải sửa **hai** tệp, cùng một bảng quy đổi — vì mục lộ trình trích chính tài liệu kia
làm nguồn (`#/docs/sj-04`), sửa một bên để lại mâu thuẫn:

1. `webapp/js/data/senior-java-gd4.js` — các mục `sj-gd4-w5-1` (lịch chương T9–T14),
   `sj-gd4-w5-3` (móc nối lab: ch.3/ch.7/ch.11), `sj-gd4-w5-5` ("quá nặng ngay ch.3").
2. `senior-java-roadmap/04-giai-doan-4-system-design.md` — dòng 91, 93, 95 (cùng nội dung)
   và dòng 130 ("key-value store phân tán — DDIA ch.5–6" → **ch.6–7**).

**Giữ nguyên mọi `id`.** Chỉ đổi chữ trong `text`/`lesson`. Tiến độ localStorage của người
dùng không suy suyển, và `"roadmap-items:senior-java": 276` phải giữ nguyên 276.

### 6.2 Chip điều hướng sang lĩnh vực DDIA

Thêm **đúng một** chip, vào `resources` của **đúng một tuần** — `sj-gd4-w5` ("Đọc DDIA có
kỷ luật"), chỗ hai lĩnh vực thực sự khớp vào nhau. Sửa trực tiếp `senior-java-gd4.js`,
không thêm bảng crossref, không rải chip sang `sj-gd4-w1`/`w2`/`w3`/`w4`/`w7`:

```js
{ label: "🗺️ Sang lĩnh vực DDIA — lộ trình đọc 12 tuần", href: "#/roadmap/ddia" }
```

Ngoài ra thêm một câu vào `goal` của `sj-gd4-w5` nói rõ hai nhịp đọc khác nhau **có chủ
đích**: GĐ4 đọc phần lõi trong 6 tuần ở nhịp gấp (chính nó dặn "đọc mức khái niệm, đừng sa
lầy"), track `ddia` đọc đủ 14 chương trong 12 tuần. Không đồng bộ hoá hai con số này.

### 6.3 Không liên kết chéo ở mức chương

Bất biến **#3b** quét `week.resources[].href` *và* `item.lesson`, bắt buộc mọi link
`#/docs/<id>` phải cùng lĩnh vực với track chứa nó. Lý do có thật: `navigate()`
(`webapp/js/app.js:159`) suy ra lĩnh vực từ tài liệu được mở, nên link xuyên lĩnh vực âm
thầm đổi lĩnh vực đang chọn của người dùng giữa chừng bài học.

Một bảng `ddia-crossref.js` trỏ từ track `sj-gd4` (field `senior-java`) sang doc field
`ddia` sẽ vi phạm bất biến này. **Không nới bất biến, không thêm allowlist** — theo đúng
tiền lệ spec Modern Concurrency §6.4.

Chip mức chương cũng **thừa**: trang track DDIA đã liệt kê cả 14 chương, chỉ cách một cú
bấm từ chip ở §6.2.

Hệ quả: `withBookRefs` trong `roadmap.js` **giữ nguyên chữ ký cũ**, không cần tổng quát hoá.

## 7. Module `roadmap` — track `ddia`

### 7.1 Phân bổ tuần

Nguyên tắc: **một chương một tuần, trừ tuần đầu và tuần cuối gộp đôi.** 14 chương → 12 tuần
cần đúng 2 lần gộp; gộp hai cặp nhẹ nhất và liền mạch về chủ đề (ch.1+2 là hai chương khung
của Phần I; ch.13+14 là hai chương khép lại).

| Tuần | Chương | Số từ | Mục | Tiêu đề |
|---|---|---:|---:|---|
| `dd-w1` | ch.1 + ch.2 | 32.5k | 5 | Đánh đổi, và cách phát biểu yêu cầu phi chức năng |
| `dd-w2` | ch.3 | 21.9k | 4 | Mô hình dữ liệu và ngôn ngữ truy vấn |
| `dd-w3` | ch.4 | 20.5k | 4 | Lưu trữ và truy xuất — LSM-tree, B-tree, cột |
| `dd-w4` | ch.5 | 15.9k | 3 | Encoding và tiến hoá schema |
| `dd-w5` | ch.6 | 26.3k | 4 | Replication |
| `dd-w6` | ch.7 | 11.1k | 3 | Sharding |
| `dd-w7` | ch.8 | 33.1k | 5 | Transaction — ACID, isolation yếu, serializability |
| `dd-w8` | ch.9 | 29.2k | 5 | Những rắc rối của hệ phân tán |
| `dd-w9` | ch.10 | 24.7k | 4 | Tính nhất quán và consensus |
| `dd-w10` | ch.11 | 17.9k | 3 | Batch processing |
| `dd-w11` | ch.12 | 26.1k | 4 | Stream processing |
| `dd-w12` | ch.13 + ch.14 | 35.9k | 4 | Triết lý hệ streaming, và làm điều đúng đắn |

**Tổng 48 mục.** Nhịp không đều là cố ý: `dd-w6` (Sharding, 11k) là quãng nghỉ đặt ngay
trước `dd-w7` nặng nhất; `dd-w4` và `dd-w10` nhẹ để bù cho `dd-w7`–`dd-w8` liền kề.

### 7.2 Lược đồ nội dung mỗi mục

Giữ nguyên khuôn Modern Concurrency, để hai track sách đọc giống hệt nhau:

```js
{
  id: "dd-w5-2",
  text: "<một dòng nêu việc cần làm>",
  lesson: `**Mục tiêu.** … **Đọc.** … **Bẫy.** … **Tự kiểm tra.** …`,
}
```

- **Mục tiêu** — người đọc làm được gì sau mục này.
- **Đọc** — trỏ anchor vào chính bản dịch (`#/docs/ddia-06`), chỉ đúng phần cần đọc.
  **Không chép lại nội dung sách**; đây là kế hoạch đọc, không phải bản tóm tắt.
- **Bẫy** — lấy từ chỗ sách tự cảnh báo, không bịa.
- **Tự kiểm tra** — câu hỏi chỉ trả lời được sau khi đọc đúng phần đó.

Tuần có `id`, `week`, `title`, `goal`, `practice`, `resources`, `items` — dùng `practice`
(quy ước của track sách), không phải `doneWhen` (quy ước của track `sj-gd*`).

### 7.3 Chia tệp và khai track

- `webapp/js/data/ddia-roadmap-part1.js` → `ddiaWeeksPart1`, tuần 1–6, **23 mục**
- `webapp/js/data/ddia-roadmap-part2.js` → `ddiaWeeksPart2`, tuần 7–12, **25 mục**

```js
{
  id: "ddia",
  field: "ddia",
  label: "DDIA",
  icon: "🗄️",
  name: "Đọc Designing Data-Intensive Applications (ấn bản 2)",
  durationWeeks: 12,
  desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, " +
        "chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra.",
  prereq: "Yêu cầu: đã làm backend với một database quan hệ, hiểu index và transaction " +
          "ở mức dùng được. Không cần biết trước về hệ phân tán.",
  weeks: [...ddiaWeeksPart1, ...ddiaWeeksPart2],
}
```

Không bọc `withBookRefs` — track này không nhận crossref từ đâu cả.

## 8. Bất biến dữ liệu — `webapp/check-data.mjs`

**Không viết bất biến mới.** Chỉ mở rộng bảng kỳ vọng, và **khai trước khi viết dữ liệu**
(đúng như tệp tự dặn ở đầu: *"sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới"*):

```js
// Lĩnh vực DDIA — 14 chương Designing Data-Intensive Applications ấn bản 2.
"docs:ddia": 14,
"roadmap-items:ddia": 48,   // thêm ở chặng 2
```

Bất biến N3 ("EXPECTED.counts phủ mọi lĩnh vực khai docs/roadmap/tracker") tự cưỡng chế hai
khoá này ngay khi `fields.js` khai module — quên khai là báo đỏ.

Các bất biến sẵn có tự phủ lên dữ liệu mới, không cần sửa gì: #1 id duy nhất · #2 tệp docs
tồn tại trên đĩa · #2b ảnh trong markdown tồn tại (105 ảnh `ch1`–`ch13`; ch.14 không có ảnh,
đúng như nguồn) · #3 link `#/docs/<id>` có thật · #3b link cùng lĩnh vực với track ·
#3c link `#/roadmap/<trackId>` có thật · "Id mục lộ trình khớp tiền tố id tuần cha"
(`dd-w7-3` ⊂ `dd-w7`) · "Mọi khối tuần có ít nhất 1 mục" · "Mọi module của lĩnh vực là view
có thật" · "FIELD_ORDER khớp FIELDS 1-1" · #7 và #7b (module ↔ dữ liệu, hai chiều) ·
"Module chỉ dành cho Kubernetes không bị lĩnh vực khác khai".

## 9. Thứ tự triển khai

**Chặng 1 — lĩnh vực sống, đọc được 14 chương.**

1. `git mv` thư mục và 14 tệp sang `ddia-vi/`.
2. `build-content.sh`: `mkdir` + 2 dòng `cp`.
3. `check-data.mjs`: khai `"docs:ddia": 14`.
4. `fields.js`: entry `ddia` với `modules: ["dashboard", "docs"]`, chèn `FIELD_ORDER`.
5. `docs-index.js`: 14 bản ghi.
6. Nghiệm thu chặng 1 (§11), rồi cập nhật tài liệu (§10).

**Chặng 2 — giáo trình 12 tuần.**

7. `check-data.mjs`: khai `"roadmap-items:ddia": 48`.
8. `ddia-roadmap-part1.js` (23 mục) và `ddia-roadmap-part2.js` (25 mục).
9. `roadmap.js`: import + khai track `ddia`.
10. `fields.js`: bật `"roadmap"` trong `modules`.
11. `senior-java-gd4.js` + `senior-java-roadmap/04-…md`: sửa đánh số ấn bản (§6.1),
    thêm chip và câu `goal` (§6.2).
12. Nghiệm thu chặng 2 (§11), cập nhật số liệu tài liệu (§10).

Mỗi chặng nghiệm thu xanh trước khi bước sang chặng sau.

## 10. Tài liệu phải cập nhật

| Chỗ | Cũ → Mới |
|---|---|
| `webapp/README.md:12` | 86 tài liệu / 6 lĩnh vực → **100 tài liệu / 7 lĩnh vực** (thêm 14 DDIA) |
| `webapp/README.md:73` | "khai 6 lĩnh vực" → **7** |
| `README.md:82` | "cả sáu lĩnh vực" → **cả bảy lĩnh vực** |
| `README.md` bảng thành phần | thêm dòng `ddia-vi/` kèm ghi chú bản quyền thương mại |
| `README.md` dòng `webapp/` | 11 giáo trình / 572 mục → **12 giáo trình / 620 mục**; 86 → **100 tài liệu** |
| `webapp/index.html:7` | meta description: thêm "Designing Data-Intensive Applications" |
| `webapp/js/data/roadmap.js` | khối chú thích đầu tệp: thêm dòng `DDIA: ddia-roadmap-part{1,2}.js (Tuần 1–6 / 7–12) — 48 mục` |
| `webapp/js/views/roadmap.js:1` | chú thích "10 track thuộc 4 lĩnh vực" → **12 track thuộc 6 lĩnh vực** (chú thích này **đã lạc hậu sẵn** trước đợt này: thực tế hiện là 11 track / 5 lĩnh vực — không phải đếm nhầm) |

Số liệu đã xác minh bằng dữ liệu hiện tại: 24+18+10+21+5+8 = 86 tài liệu, +14 = 100;
184+50+30+276+32 = 572 mục lộ trình, +48 = 620; 11 track, +1 = 12.

## 11. Nghiệm thu

Lệnh duy nhất, chạy cuối mỗi chặng:

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

`package.json` chỉ khai `type: module` — repo **không có test runner nào khác**.
`check-data.mjs` là toàn bộ lớp nghiệm thu tự động. Phải dán output thật, không chỉ tuyên
bố đã chạy.

**Chặng 1 xanh khi:** #1, #2 (14 tệp), #2b (105 ảnh), `"docs:ddia": 14`, N3, FIELD_ORDER 1-1.
Kiểm bằng mắt phần checker không với tới: `./webapp/dev.sh` → chọn lĩnh vực DDIA → mở ch.6
(16 ảnh) và ch.8 (14 ảnh), xác nhận ảnh hiện và mục lục nổi dựng đúng.

**Chặng 2 xanh khi:** thêm id tuần/mục duy nhất, tiền tố mục khớp tuần cha, mọi tuần có
≥ 1 mục, #3/#3b/#3c, `"roadmap-items:ddia": 48`.

**Hồi quy bắt buộc:** `"roadmap-items:senior-java"` **vẫn là 276**. Con số này nhúc nhích
nghĩa là đã lỡ tay thêm/xoá mục khi sửa đánh số ấn bản ở §6.1.

## 12. Ngoài phạm vi

- **Flashcards và trắc nghiệm cho DDIA.** Cần ~90 thẻ và ~110 câu viết tay; để đợt sau.
- **Dịch lại hay hiệu đính nội dung 14 chương.** Nội dung nhận nguyên trạng.
- **Phục vụ `.pdf` qua web.** PDF ở lại repo làm nguồn.
- **Crossref mức chương từ GĐ4 hay từ lĩnh vực `java`.** Xem §6.3.
- **Sửa `app.js` để link xuyên lĩnh vực không đổi lĩnh vực đang chọn.** Là hạn chế đã biết
  của app, không phải việc của đợt này.
- **Đồng bộ nhịp đọc 6 tuần của GĐ4 với 12 tuần của track `ddia`.** Hai nhịp khác nhau có
  chủ đích (§6.2).

## 13. Rủi ro và giới hạn đã biết

1. **Khối lượng viết mới lớn.** 48 mục × 250–400 từ ≈ 15–20 nghìn từ tiếng Việt, cộng 14
   `desc` tài liệu. Đây là phần chiếm gần hết công sức, không phải phần wiring. Chia 2 chặng
   chính là để rủi ro này không kéo theo cả lĩnh vực: hết chặng 1 đã có thứ dùng được.
2. **`dd-w7` nặng 33 nghìn từ trong một tuần.** Chấp nhận có cân nhắc (quyết định #8);
   giảm nhẹ bằng 5 mục thay vì 4 và ghi rõ trong `practice` của tuần.
3. **Chip `#/roadmap/ddia` vẫn đổi lĩnh vực đang chọn** (`app.js:160`), giống mọi link
   `#/roadmap/<trackId>` xuyên lĩnh vực. Giảm nhẹ bằng nhãn nói thẳng "Sang lĩnh vực DDIA"
   thay vì để người dùng bị chuyển mà không biết.
4. **Chất lượng khối "Bẫy" phụ thuộc việc đọc thật từng chương.** Nguy cơ là bịa bẫy nghe
   hợp lý mà sách không nói. Ràng buộc: mỗi "Bẫy" phải truy được về một đoạn cảnh báo có
   thật trong chương tương ứng.
5. **`git mv` 14 tệp làm gãy mọi link ngoài trỏ vào đường dẫn cũ.** Thư mục vừa được commit
   ở `a45d233` và chưa nơi nào tham chiếu, nên rủi ro gần như bằng không — nhưng cần
   `grep` xác nhận trước khi đổi tên.
