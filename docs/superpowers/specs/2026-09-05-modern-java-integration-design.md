# Tích hợp *Modern Java in Action* vào DevPrep — thiết kế

Ngày: 2026-09-05
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực thứ 8 của DevPrep — id `modern-java`

## 1. Bối cảnh

Commit `b40bc24` đưa vào repo thư mục `Modern Java In Action/`: 21 PDF từng chương và thư
mục `vi/` chứa bản dịch tiếng Việt đầy đủ 21 chương của *Modern Java in Action*
(Raoul-Gabriel Urma, Mario Fusco, Alan Mycroft — Manning), kèm `README.md` mục lục 6 phần
và `QUY-TAC-DICH.md`. Commit `133fe65` bổ sung **100 ảnh** vào `vi/images/chNN/` và nhúng
chúng vào markdown, đồng thời sửa `QUY-TAC-DICH.md`, `README.md` và chương 18. Nội dung
**đã dịch xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

DevPrep hiện có 7 lĩnh vực. Lần thêm gần nhất — DDIA, merge `460d1ab` — là khuôn mẫu trực
tiếp cho đợt này. Kiến trúc app đã đủ chín để thêm một lĩnh vực không phải sửa view nào:
`dashboard.js` đọc thẳng từ `fields.js`.

Số liệu đã đo, không ước lượng:

| Chỉ số | MJIA | DDIA (đối chiếu) |
|---|---:|---:|
| Số chương | 21 | 14 |
| Tổng số từ | 212.942 | ~295.000 |
| Trung bình mỗi chương | 10.140 | ~21.000 |
| Chương nặng nhất | ch.6 — 15.013 từ | ch.8 — 33.100 từ |
| Chương nhẹ nhất | ch.8 — 5.524 từ | ch.7 — 11.100 từ |
| Số ảnh | **100** (19/21 chương) | 105 |

Khác biệt đáng kể so với DDIA: chương **đều tay hơn nhiều** — không có chương nào nặng gấp
ba mặt bằng.

Về ảnh, MJIA đi cùng khuôn DDIA: 100 tệp `.jpg` trong `vi/images/ch01`–`ch21`, nhúng bằng
đường dẫn **tương đối** (`images/ch02/hinh-2-2.jpg`). Đã kiểm toàn vẹn: **0 tham chiếu gãy,
0 ảnh mồ côi** — 100 tệp, 100 lượt được tham chiếu. Hai chương không có hình: **ch.8** và
**ch.10**, đúng như nguồn. Hệ quả: bất biến #2b áp dụng đầy đủ, và `build-content.sh` cần
dòng `cp -R images` như các lĩnh vực sách khác.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Module: `["dashboard", "docs", "roadmap"]` | Đồng khuôn Spring Security, Modern Concurrency, DDIA. Không làm flashcards/quiz đợt này. |
| 2 | Lộ trình 12 tuần / 48 mục | ~17,7k từ/tuần. Nhẹ hơn DDIA (24k) có chủ đích: MJIA là sách để gõ code, mỗi tuần phải chừa chỗ cho bài tập. |
| 3 | Đổi tên sang `modern-java-vi/NN-slug.md` | Quy ước repo (`k8s-ebook/`, `spring-security-vi/`, `modern-concurrency-vi/`, `ddia-vi/`). Bỏ tầng `vi/` và tiền tố `chuong-`. |
| 4 | Đúng **một** chip liên kết chéo, từ `sj-gd1-w4` | Chỗ hai lĩnh vực thực sự khớp. Xem §6. |
| 5 | Liên kết chéo ở mức **track**, không mức chương | Bất biến #3b cấm link `#/docs/` xuyên lĩnh vực — xem §6.2. |
| 6 | Giữ khuôn 4 khối của `lesson`, bài tập code ở `practice` **mức tuần** | Không phá thế đồng nhất với 4 track sách hiện có; bài tập bám đúng đơn vị chương. Xem §7.2. |
| 7 | Chia 2 chặng, mỗi chặng tự chạy được | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu. |
| 8 | `mj-w12` gộp 3 chương (26,8k từ) | ch.20 (so sánh Scala) và ch.21 (kết luận) đọc lướt được; gộp còn hơn để tuần cuối chỉ có chương kết luận. |

## 3. Nguồn: chuẩn hoá `modern-java-vi/`

`git mv` 21 `.md` từ `Modern Java In Action/vi/` và 21 `.pdf` từ `Modern Java In Action/`
vào một thư mục phẳng `modern-java-vi/`, đặt tên theo cùng một slug. `README.md`,
`QUY-TAC-DICH.md` và cả thư mục `images/` đi cùng. Giữ nguyên nội dung — **không sửa một
ký tự nào**: đường dẫn ảnh là tương đối so với tệp markdown, và `images/` di chuyển cùng
chúng, nên không tham chiếu nào gãy.

Slug lấy nguyên từ tên tệp `vi/` hiện có, chỉ bỏ tiền tố `chuong-`:

| # | `.md` mới | `.pdf` nguồn (rút gọn) |
|---:|---|---|
| 01 | `01-java-8-9-10-11-co-gi-moi.md` | `Chapter 1. Java 8, 9, 10, and 11…` |
| 02 | `02-truyen-code-voi-behavior-parameterization.md` | `Chapter 2. Passing code with behavior parameterization…` |
| 03 | `03-lambda-expressions.md` | `Chapter 3. Lambda expressions…` |
| 04 | `04-gioi-thieu-stream.md` | `Chapter 4. Introducing streams…` |
| 05 | `05-lam-viec-voi-stream.md` | `Chapter 5. Working with streams…` |
| 06 | `06-thu-thap-du-lieu-voi-stream.md` | `Chapter 6. Collecting data with streams…` |
| 07 | `07-xu-ly-du-lieu-song-song-va-hieu-nang.md` | `Chapter 7. Parallel data processing and performance…` |
| 08 | `08-cai-tien-collection-api.md` | `Chapter 8. Collection API enhancements…` |
| 09 | `09-refactoring-testing-va-debugging.md` | `Chapter 9. Refactoring, testing, and debugging…` |
| 10 | `10-domain-specific-language-voi-lambda.md` | `Chapter 10. Domain-specific languages using lambdas…` |
| 11 | `11-dung-optional-thay-cho-null.md` | `Chapter 11. Using Optional as a better alternative to null…` |
| 12 | `12-date-and-time-api-moi.md` | `Chapter 12. New Date and Time API…` |
| 13 | `13-default-method.md` | `Chapter 13. Default methods…` |
| 14 | `14-he-thong-module-cua-java.md` | `Chapter 14. The Java Module System…` |
| 15 | `15-khai-niem-nen-tang-completablefuture-va-reactive-programming.md` | `Chapter 15. Concepts behind CompletableFuture…` |
| 16 | `16-completablefuture-lap-trinh-bat-dong-bo-kha-ket-hop.md` | `Chapter 16. CompletableFuture: composable asynchronous programming…` |
| 17 | `17-reactive-programming.md` | `Chapter 17. Reactive programming…` |
| 18 | `18-tu-duy-ham.md` | `Chapter 18. Thinking functionally…` |
| 19 | `19-ky-thuat-lap-trinh-ham.md` | `Chapter 19. Functional programming techniques…` |
| 20 | `20-ket-hop-oop-va-fp-so-sanh-java-va-scala.md` | `Chapter 20. Blending OOP and FP: Comparing Java and Scala…` |
| 21 | `21-ket-luan-va-huong-di-tiep-cua-java.md` | `Chapter 21. Conclusions and where next for Java…` |

Mỗi `.pdf` đổi tên thành `NN-<cùng slug>.pdf`. Sau khi `git mv` xong, thư mục
`Modern Java In Action/` biến mất hoàn toàn.

Trước khi đổi tên: `grep -rn "Modern Java In Action" --include='*.md' --include='*.js' .`
để xác nhận không nơi nào tham chiếu đường dẫn cũ. Đã chạy một lần khi làm thiết kế này —
0 kết quả ngoài chính thư mục đó — nhưng chạy lại ngay trước khi `git mv`.

### `webapp/build-content.sh`

```bash
# thêm vào lệnh mkdir -p sẵn có:
"$DEST/mjia/images"

# thêm 2 dòng cp:
cp    "$REPO"/modern-java-vi/*.md          "$DEST/mjia/"
cp -R "$REPO"/modern-java-vi/images/.      "$DEST/mjia/images/"
```

Đúng khuôn `modern-concurrency-vi/` và `ddia-vi/`.

`.pdf` **không** copy sang `content/` — nhất quán với 4 thư mục sách hiện có; PDF ở lại
repo làm nguồn đối chiếu, không phục vụ qua web.

`README.md` và `QUY-TAC-DICH.md` bị `*.md` quét theo sang `content/mjia/`. Vô hại và đúng
tiền lệ (`modern-concurrency-vi/README.md` cũng vậy): không bản ghi `docs` nào trỏ vào
chúng, và bất biến #2 chỉ kiểm chiều "doc đã khai thì tệp phải tồn tại", không kiểm ngược.

`Dockerfile` và `.github/workflows/deploy-pages.yml` không đổi: cả hai đều gọi
`build-content.sh`, vốn là nguồn duy nhất của logic copy.

## 4. Lĩnh vực mới — `webapp/js/data/fields.js`

```js
"modern-java": {
  label: "Modern Java in Action",
  icon: "🌊",
  desc: "Bản dịch tiếng Việt Modern Java in Action (Raoul-Gabriel Urma, Mario Fusco, " +
        "Alan Mycroft — Manning) — lambda, stream, collector, Optional, Date/Time API, " +
        "module system, CompletableFuture và reactive, tư duy hàm.",
  certFilter: false,
  modules: ["dashboard", "docs"],              // chặng 1
  // modules: ["dashboard", "docs", "roadmap"],   // chặng 2
  externalRef: { label: "dev.java", href: "https://dev.java/" },
},
```

`FIELD_ORDER` — chèn `modern-java` ngay sau `java`:

```js
["kubernetes", "sysprog", "java", "modern-java", "ddia", "modern-concurrency",
 "spring-security", "senior-java"]
```

MJIA là tầng ngôn ngữ Java, nối tiếp trực tiếp lĩnh vực `java`; `modern-concurrency` là
phần đi sau nó về thời gian (Loom nối tiếp CompletableFuture ở ch.15–17).

Icon 🌊 (stream) không đụng icon nào đang dùng: ☸️ 🖥️ ☕ 🔒 🧭 🧵 🗄️.

**Bản quyền:** sách thương mại của Manning, không phải giấy phép mở như CC BY 4.0. Ghi
đúng khuôn đã dùng cho `k8s-ebook`, `spring-security-vi`, `ddia-vi`.

### Sơ đồ id

| Loại | Khuôn | Ví dụ |
|---|---|---|
| Lĩnh vực | `modern-java` | — |
| Tài liệu | `mjia-NN` | `mjia-01` … `mjia-21` |
| Track lộ trình | `modern-java` | — |
| Tuần | `mj-wN` | `mj-w1` … `mj-w12` |
| Mục | `mj-wN-M` | `mj-w7-3` |

Tiền tố `mj-` không đụng tiền tố tuần nào đang dùng (`w`, `cka-w`, `cks-w`, `sp-w`, `kb-w`,
`ss-w`, `mc-w`, `dd-w`, `sj-gd*-w`); `mjia-` không đụng `modconc-`.
**Mọi id là khoá localStorage — không được đổi về sau.**

## 5. Module `docs` — 21 tài liệu

21 bản ghi trong `webapp/js/data/docs-index.js`, nhóm
`// ===== Modern Java in Action (Manning) =====`:

```js
{
  id: "mjia-06",
  field: "modern-java",
  title: "MJIA 06 — Thu thập dữ liệu với stream",
  file: "content/mjia/06-thu-thap-du-lieu-voi-stream.md",
  icon: "🧺",
  desc: "<1–2 câu>",
  tags: ["Collector", "groupingBy", "Reduction"],
}
```

`title` theo khuôn `MJIA NN — <tiêu đề H1 tiếng Việt của chương>`, đồng khuôn `MCJ NN —`.
`desc` viết mới, 1–2 câu, nêu chương trả lời câu hỏi gì — không tóm tắt nội dung.
Cập nhật khối chú thích đầu `docs-index.js` (dòng 2–4) để thêm `modern-java-vi/` vào danh
sách thư mục nguồn.

## 6. Liên kết chéo với lĩnh vực `senior-java`

### 6.1 Đúng một chip, vào `sj-gd1-w4`

Không chỗ nào trong repo nhắc tới *Modern Java in Action* từ trước — khác DDIA, nơi mô tả
track `sj-gd4` đã hứa sẵn cuốn sách đó. Ở đây liên kết chéo là tuỳ chọn, nên chỉ thêm đúng
một chip, vào tuần khớp nhất.

`sj-gd1-w4` có `title: "Generics, lambda, stream"` và `doneWhen` đòi *"nêu được 2 trường
hợp stream làm code TỆ hơn"* — chính là nội dung ch.5 và ch.7 của MJIA. Thêm vào
`resources` của tuần đó trong `webapp/js/data/senior-java-gd1.js`:

```js
{ label: "🌊 Sang lĩnh vực Modern Java in Action — lộ trình đọc 12 tuần",
  href: "#/roadmap/modern-java" }
```

**Không sửa chữ nào khác** của `sj-gd1-w4`, **không thêm/bớt mục nào**. Không rải chip sang
`sj-gd1-w7` ("CompletableFuture & virtual threads") hay sang lĩnh vực `modern-concurrency`:
một chip là đủ để người học biết lĩnh vực này tồn tại, và mỗi chip thêm là một tham chiếu
nữa phải giữ đồng bộ về sau.

### 6.2 Không liên kết chéo ở mức chương

Bất biến **#3b** quét `week.resources[].href` *và* `item.lesson`, bắt buộc mọi link
`#/docs/<id>` phải cùng lĩnh vực với track chứa nó. Lý do có thật: `navigate()`
(`webapp/js/app.js:159`) suy lĩnh vực từ tài liệu được mở, nên link xuyên lĩnh vực âm thầm
đổi lĩnh vực đang chọn của người dùng giữa chừng bài học.

**Không nới bất biến, không thêm allowlist, không thêm bảng crossref** — theo đúng tiền lệ
spec Modern Concurrency §6.4 và spec DDIA §6.3. Chip mức chương cũng thừa: trang track MJIA
đã liệt kê cả 21 chương, chỉ cách một cú bấm từ chip ở §6.1.

Hệ quả: `withBookRefs` trong `roadmap.js` **giữ nguyên chữ ký cũ**.

## 7. Module `roadmap` — track `modern-java`

### 7.1 Phân bổ tuần

Nguyên tắc: bám ranh giới 6 phần của sách; tách tuần riêng cho 4 chương xương sống (ch.3
lambda, ch.6 collector, ch.15 nền tảng async, ch.16 CompletableFuture); gộp các cặp liền
mạch còn lại.

| Tuần | Chương | Số từ | Ảnh | Mục | Tiêu đề |
|---|---|---:|---:|---:|---|
| `mj-w1` | ch.1 + ch.2 | 18.693 | 10 | 4 | Java 8+ đổi gì, và ý tưởng truyền hành vi |
| `mj-w2` | ch.3 | 14.269 | 8 | 4 | Lambda expression và functional interface |
| `mj-w3` | ch.4 + ch.5 | 20.333 | 14 | 5 | Stream: khái niệm và bộ thao tác trung gian |
| `mj-w4` | ch.6 | 15.047 | 8 | 4 | Collector — thu thập, nhóm, phân hoạch |
| `mj-w5` | ch.7 + ch.8 | 16.748 | 7 | 4 | Parallel stream, spliterator, và Collection API mới |
| `mj-w6` | ch.9 + ch.10 | 22.454 | 4 | 4 | Refactoring/test/debug code hàm, và DSL bằng lambda |
| `mj-w7` | ch.11 + ch.12 | 17.427 | 6 | 4 | Optional thay null, và Date/Time API |
| `mj-w8` | ch.13 + ch.14 | 16.027 | 11 | 4 | Default method và hệ thống module |
| `mj-w9` | ch.15 | 13.823 | 9 | 3 | Nền tảng: thread, future, reactive manifesto |
| `mj-w10` | ch.16 | 12.714 | 4 | 4 | CompletableFuture — kết hợp tác vụ bất đồng bộ |
| `mj-w11` | ch.17 + ch.18 | 18.523 | 11 | 4 | Flow API, reactive, và tư duy hàm |
| `mj-w12` | ch.19 + ch.20 + ch.21 | 26.884 | 8 | 4 | Kỹ thuật FP, so sánh Scala, hướng đi tiếp |

**Tổng 48 mục / 212.942 từ / 100 ảnh.** Hai chỗ lệch là cố ý:

- `mj-w9` chỉ 3 mục dù 13,8k từ — ch.15 là chương khái niệm (thread, future, reactive
  manifesto), không có API mới để gõ; 3 mục vừa đủ và nó dọn chỗ nghỉ trước `mj-w10` nặng
  về code.
- `mj-w12` gộp 3 chương / 26,8k từ — nhưng chỉ ch.19 cần đọc kỹ; ch.20 và ch.21 đọc lướt
  được, và `practice` của tuần phải nói rõ điều đó.

### 7.2 Lược đồ nội dung mỗi mục

Giữ nguyên khuôn 4 khối của track DDIA và Modern Concurrency, để bốn track sách đọc giống
hệt nhau:

```js
{
  id: "mj-w4-2",
  text: "<một dòng nêu việc cần làm>",
  lesson: `**Mục tiêu.** … **Đọc.** … **Bẫy.** … **Tự kiểm tra.** …`,
}
```

- **Mục tiêu** — người đọc làm được gì sau mục này.
- **Đọc** — trỏ anchor vào chính bản dịch (`#/docs/mjia-06`), chỉ đúng phần cần đọc.
  **Không chép lại nội dung sách**; đây là kế hoạch đọc, không phải bản tóm tắt.
- **Bẫy** — lấy từ chỗ sách tự cảnh báo, không bịa.
- **Tự kiểm tra** — câu hỏi chỉ trả lời được sau khi đọc đúng phần đó.

**Phần gõ code nằm ở `practice` mức tuần, không thành khối thứ 5 trong `lesson`.** MJIA
khác DDIA ở chỗ nó là sách để gõ code — mỗi mục sách đều có listing chạy được — nên track
đọc thuần sẽ phí mất giá trị đó. Nhưng thêm khối `**Gõ thử.**` vào cả 48 mục sẽ phá thế
đồng nhất với 4 track sách hiện có và làm mỗi `lesson` dài thêm khoảng một phần ba. Giải
pháp: `practice` của mỗi tuần là **một bài tập code cụ thể bám đúng chương của tuần đó**,
không phải lời khuyên chung chung. Ví dụ cho `mj-w4`: *"Lấy ba vòng lặp `for` gom nhóm
trong code thật của bạn, viết lại bằng `groupingBy` kèm downstream collector; giữ cả hai
bản và so kết quả trên cùng dữ liệu."*

Tuần có `id`, `week`, `title`, `goal`, `practice`, `resources`, `items` — dùng `practice`
(quy ước của track sách), không phải `doneWhen` (quy ước của track `sj-gd*`).

### 7.3 Chia tệp và khai track

- `webapp/js/data/mjia-roadmap-part1.js` → `mjiaWeeksPart1`, tuần 1–6, **25 mục**
- `webapp/js/data/mjia-roadmap-part2.js` → `mjiaWeeksPart2`, tuần 7–12, **23 mục**

```js
{
  id: "modern-java",
  field: "modern-java",
  label: "MJIA",
  icon: "🌊",
  name: "Đọc Modern Java in Action",
  durationWeeks: 12,
  desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, " +
        "chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài " +
        "tập gõ code.",
  prereq: "Yêu cầu: viết được Java ở mức thành thạo cú pháp trước Java 8 (class, " +
          "interface, generics, collection). Không cần biết trước lambda hay stream.",
  weeks: [...mjiaWeeksPart1, ...mjiaWeeksPart2],
}
```

Không bọc `withBookRefs` — track này không nhận crossref từ đâu cả.

## 8. Bất biến dữ liệu — `webapp/check-data.mjs`

**Không viết bất biến mới.** Chỉ mở rộng bảng kỳ vọng, và **khai trước khi viết dữ liệu**
(đúng như tệp tự dặn ở đầu: *"sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới"*):

```js
// Lĩnh vực Modern Java in Action — 21 chương sách Manning.
"docs:modern-java": 21,
"roadmap-items:modern-java": 48,   // thêm ở chặng 2
```

Bất biến N3 ("EXPECTED.counts phủ mọi lĩnh vực khai docs/roadmap/tracker") tự cưỡng chế hai
khoá này ngay khi `fields.js` khai module — quên khai là báo đỏ.

Các bất biến sẵn có tự phủ lên dữ liệu mới, không cần sửa gì: #1 id duy nhất · #2 tệp docs
tồn tại trên đĩa · #2b ảnh trong markdown tồn tại trên đĩa (100 ảnh `ch01`–`ch21`; ch.8 và
ch.10 không có ảnh, đúng như nguồn) · #3 link `#/docs/<id>` có thật · #3b link cùng lĩnh vực với track ·
#3c link `#/roadmap/<trackId>` có thật · "Id mục lộ trình khớp tiền tố id tuần cha"
(`mj-w7-3` ⊂ `mj-w7`) · "Mọi khối tuần có ít nhất 1 mục" · "Mọi module của lĩnh vực là view
có thật" · "FIELD_ORDER khớp FIELDS 1-1" · #7 và #7b (module ↔ dữ liệu, hai chiều) ·
"Module chỉ dành cho Kubernetes không bị lĩnh vực khác khai".

**#2b là bất biến đáng theo dõi nhất đợt này** — nó quét cả 100 đường dẫn ảnh sau khi
`build-content.sh` chạy. Nó đỏ nghĩa là `cp -R images` thiếu hoặc `git mv` bỏ sót thư mục.

## 9. Thứ tự triển khai

**Chặng 1 — lĩnh vực sống, đọc được 21 chương.**

1. `grep` xác nhận không tham chiếu đường dẫn cũ, rồi `git mv` 21 `.md` + 21 `.pdf` +
   `README.md` + `QUY-TAC-DICH.md` sang `modern-java-vi/`.
2. `build-content.sh`: `mkdir` + 1 dòng `cp`.
3. `check-data.mjs`: khai `"docs:modern-java": 21`.
4. `fields.js`: entry `modern-java` với `modules: ["dashboard", "docs"]`, chèn `FIELD_ORDER`.
5. `docs-index.js`: 21 bản ghi + cập nhật chú thích đầu tệp.
6. Nghiệm thu chặng 1 (§11), rồi cập nhật tài liệu (§10).

**Chặng 2 — giáo trình 12 tuần.**

7. `check-data.mjs`: khai `"roadmap-items:modern-java": 48`.
8. `mjia-roadmap-part1.js` (25 mục) và `mjia-roadmap-part2.js` (23 mục).
9. `roadmap.js`: import + khai track `modern-java` + cập nhật khối chú thích đầu tệp.
10. `fields.js`: bật `"roadmap"` trong `modules`.
11. `senior-java-gd1.js`: thêm đúng một chip vào `resources` của `sj-gd1-w4` (§6.1).
12. Nghiệm thu chặng 2 (§11), cập nhật số liệu tài liệu (§10).

Mỗi chặng nghiệm thu xanh trước khi bước sang chặng sau.

## 10. Tài liệu phải cập nhật

| Chỗ | Cũ → Mới |
|---|---|
| `webapp/README.md` dòng "Lộ trình học" | 12 giáo trình / **620 mục** → 13 giáo trình / **668 mục**; thêm mô tả track MJIA (12 tuần, 48 mục, bám theo 21 chương) và `+ 48 mục đọc Modern Java in Action` vào phép cộng |
| `webapp/README.md` dòng "Thư viện tài liệu" | **100 tài liệu** thuộc 7 lĩnh vực → **121 tài liệu** thuộc 8 lĩnh vực; thêm `21 Modern Java in Action` |
| `webapp/README.md:73` | "khai 7 lĩnh vực" → **8 lĩnh vực** |
| `README.md:82` | "cả bảy lĩnh vực" → **cả tám lĩnh vực**; thêm "bản dịch **Modern Java in Action**" vào câu liệt kê |
| `README.md` bảng thành phần | thêm dòng `modern-java-vi/` kèm ghi chú bản quyền thương mại: 21 chương, 100 hình |
| `README.md` dòng `webapp/` | 12 giáo trình / 620 mục → **13 / 668**; 100 → **121 tài liệu**; thêm "Modern Java in Action" vào danh sách lĩnh vực |
| `webapp/index.html:7` | meta description: thêm "Modern Java in Action" |
| `webapp/js/data/roadmap.js` | khối chú thích đầu tệp: thêm dòng `MJIA: mjia-roadmap-part{1,2}.js (Tuần 1–6 / 7–12) — 48 mục`, thêm MJIA vào câu liệt kê track, và thêm `mj-w1` / `mj-w1-1` vào dòng LƯU Ý id |
| `webapp/js/data/docs-index.js` dòng 2–4 | thêm `modern-java-vi/` vào danh sách thư mục nguồn |
| `webapp/js/views/roadmap.js:1` | "12 track thuộc 6 lĩnh vực" → **13 track thuộc 7 lĩnh vực**, thêm MJIA vào câu liệt kê. Chú thích này **hiện đang đúng** (khác đợt DDIA, khi nó đã lạc hậu sẵn) |

Số liệu đã xác minh bằng dữ liệu hiện tại: 100 tài liệu + 21 = **121**; 620 mục lộ trình
+ 48 = **668**; 12 track + 1 = **13**; 7 lĩnh vực + 1 = **8**. Chỉ 6 lĩnh vực khai module
`roadmap` trước đợt này (kubernetes, sysprog, spring-security, modern-concurrency, ddia,
senior-java), nên con số ở `views/roadmap.js` là **7**, không phải 8.

## 11. Nghiệm thu

Lệnh duy nhất, chạy cuối mỗi chặng:

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

`package.json` chỉ khai `type: module` — repo **không có test runner nào khác**.
`check-data.mjs` là toàn bộ lớp nghiệm thu tự động. Phải dán output thật, không chỉ tuyên
bố đã chạy.

**Chặng 1 xanh khi:** #1 id duy nhất, #2 (21 tệp tồn tại trong `content/mjia/`),
`"docs:modern-java": 21`, N3, FIELD_ORDER khớp FIELDS 1-1, #7/#7b.
Kiểm bằng mắt phần checker không với tới: `./webapp/dev.sh` → chọn lĩnh vực Modern Java in
Action → mở ch.6 và ch.16 (hai chương nhiều code nhất), xác nhận highlight cú pháp Java và
mục lục nổi dựng đúng.

**Chặng 2 xanh khi:** id tuần/mục duy nhất, tiền tố mục khớp tuần cha, mọi tuần có ≥ 1 mục,
#3/#3b/#3c, `"roadmap-items:modern-java": 48`.

**Hồi quy bắt buộc:** `"roadmap-items:senior-java"` **vẫn là 276**. Con số này nhúc nhích
nghĩa là đã lỡ tay thêm/xoá mục khi chèn chip ở §6.1.

## 12. Ngoài phạm vi

- **Flashcards và trắc nghiệm cho MJIA.** Cần ~90 thẻ và ~110 câu viết tay; để đợt sau.
- **Dịch lại hay hiệu đính nội dung 21 chương.** Nội dung nhận nguyên trạng.
- **Phục vụ `.pdf` qua web.** PDF ở lại repo làm nguồn đối chiếu.
- **Crossref mức chương từ `senior-java`, và chip thứ hai từ `modern-concurrency`.** Xem §6.
- **Sửa `app.js` để link xuyên lĩnh vực không đổi lĩnh vực đang chọn.** Là hạn chế đã biết
  của app, không phải việc của đợt này.
- **Bài tập code có lời giải kèm sẵn.** `practice` chỉ ra đề, không giải.

## 13. Rủi ro và giới hạn đã biết

1. **Khối lượng viết mới lớn.** 48 mục × 250–400 từ ≈ 15–19 nghìn từ tiếng Việt, cộng 21
   `desc` tài liệu và 12 `practice`. Đây là phần chiếm gần hết công sức, không phải phần
   wiring. Chia 2 chặng chính là để rủi ro này không kéo theo cả lĩnh vực: hết chặng 1 đã
   có thứ dùng được.
2. **Chất lượng khối "Bẫy" phụ thuộc việc đọc thật từng chương.** Nguy cơ là bịa bẫy nghe
   hợp lý mà sách không nói. Ràng buộc: mỗi "Bẫy" phải truy được về một đoạn cảnh báo có
   thật trong chương tương ứng.
3. **`practice` dễ trôi thành lời khuyên chung chung** ("thực hành lambda đi"), làm mất
   đúng thứ §7.2 đặt ra để bảo vệ. Ràng buộc: mỗi `practice` phải nêu được API hoặc listing
   cụ thể của chương tuần đó.
4. **Chip `#/roadmap/modern-java` vẫn đổi lĩnh vực đang chọn** (`app.js:160`), giống mọi
   link `#/roadmap/<trackId>` xuyên lĩnh vực. Giảm nhẹ bằng nhãn nói thẳng "Sang lĩnh vực
   Modern Java in Action" thay vì để người dùng bị chuyển mà không biết.
5. **`git mv` 144 tệp làm gãy mọi link ngoài trỏ vào đường dẫn cũ.** Thư mục vừa được commit
   ở `b40bc24`/`133fe65` và chưa nơi nào tham chiếu (đã grep, 0 kết quả), nên rủi ro gần
   bằng không — nhưng grep lại ngay trước khi đổi tên.
6. **Tên tệp `.pdf` chứa ký tự Unicode lạ** (dấu nháy cong `’` ở ch.1, gạch dưới thay dấu
   hai chấm). Đổi tên phải dùng `git mv` với chuỗi trích dẫn đúng, không dùng glob tự chế.
7. **Thư mục `images/` có thể bị bỏ quên khi đổi tên.** Đường dẫn ảnh là tương đối, nên
   `images/` phải đi cùng 21 tệp markdown trong cùng một `git mv`. Bất biến #2b bắt được
   sai sót này, nhưng chỉ sau khi đã chạy `build-content.sh` — nên chặng 1 phải có bước
   đếm ảnh riêng, không đợi tới checker.
