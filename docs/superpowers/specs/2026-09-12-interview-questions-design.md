# Câu hỏi phỏng vấn theo cấp độ năng lực — thiết kế

Ngày: 2026-09-12 · Trạng thái: đã duyệt, chưa triển khai

## 1. Bối cảnh

DevPrep có hai dạng luyện tập chấm tự động — flashcards (spaced repetition) và
trắc nghiệm 4 lựa chọn (`views/quiz.js`) — nhưng không có dạng nào mô phỏng được
một buổi phỏng vấn thật. Hai giới hạn cụ thể:

1. **Trắc nghiệm không đo được tầng trên.** Câu "chọn A hay B, vì sao, và đổi ý
   khi nào" hoặc "production đang N+1 dưới tải, chẩn đoán thế nào" không gói được
   vào bốn lựa chọn. Người học nhận ra đáp án đúng mà vẫn không diễn đạt được lý
   lẽ — đúng thứ buổi phỏng vấn kiểm tra.
2. **`difficulty` 1–3 của ngân hàng trắc nghiệm không phải cấp độ năng lực.** Nó
   đo độ khó của một câu, không đo *loại* năng lực câu đó cần.

Trong khi đó dự án đã có sẵn một thang cấp độ năng lực đúng nghĩa, dùng ở ma trận
năng lực Senior Java (`js/data/senior-java/matrix.js`, render bởi `views/tracker.js`):

| Cấp | Tên | Câu hỏi nó trả lời |
|:--:|---|---|
| L1 | Hiểu lý thuyết | Bạn biết cơ chế hoạt động không? |
| L2 | Thực thi mã nguồn | Bạn viết/sửa được mã không? |
| L3 | Phân tích đánh đổi | Bạn chọn được giữa hai cách và biết khi nào đổi ý không? |
| L4 | Thiết kế & xử lý sự cố | Bạn xử lý được khi nó hỏng trên production không? |

Thiết kế này thêm module thứ mười hai — **🎤 Câu hỏi phỏng vấn** — dùng đúng thang
đó cho **mọi lĩnh vực**, không riêng Senior Java.
(`NAV_GROUPS` hiện có 11 mục: dashboard, guide, certs, roadmap, tracker, docs,
commands, flashcards, quiz, exam, labs.)

### Phân biệt với ba module luyện tập sẵn có

- **Flashcards** trả lời *"tôi có nhớ không"* — nhận diện, chấm bằng SRS.
- **Trắc nghiệm** trả lời *"tôi có chọn đúng không"* — nhận diện có nhiễu, chấm tự động.
- **Thi thử** trả lời *"tôi có qua được kỳ thi không"* — bấm giờ, theo tỷ trọng domain.
- **Phỏng vấn** trả lời *"tôi diễn đạt được ở tầng nào"* — sản sinh, tự chấm theo rubric.

## 2. Quyết định đã chốt

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Phạm vi | **Mọi lĩnh vực** (14 field), engine viết một lần | Không phải sửa view khi mở thêm lĩnh vực — đúng nếp `questions`/`flashcards` |
| Dạng câu hỏi | **Tự luận + đáp án mẫu + rubric** | Trắc nghiệm không đo được L3/L4; phỏng vấn thật là câu mở |
| Thang cấp độ | **Tái dùng 4 cấp năng lực sẵn có** | Một từ vựng duy nhất cho toàn app; `tracker.js` đã dạy người dùng ý nghĩa 4 cấp |
| Bảo đảm đúng cấp | **Hợp đồng cứng theo level**, `check-data.mjs` ép | Level trở thành sự thật kiểm chứng được, không phải nhãn dán |
| View | **`views/interview.js` mới** | Quiz chấm bằng `answer` index, phỏng vấn chấm bằng tự đối chiếu rubric — hai vòng lặp UI khác hẳn |
| Dữ liệu đợt đầu | **JPA, 24 câu** (6 chủ đề × 4 cấp) | Nhánh JPA vừa hoàn thiện; ORM giàu tình huống sự cố thật |

## 3. Ánh xạ yêu cầu → cơ chế

Yêu cầu gốc: *"đảm bảo câu hỏi đánh giá chính xác được level, tính thực tế, độ hiểu,
ứng dụng"*. Bốn trục đó ánh xạ thẳng vào bốn cấp, và mỗi cấp có một **artifact bắt
buộc** khiến không thể dán nhãn sai:

| Trục yêu cầu | Cấp | Artifact bắt buộc | Vì sao không gian lận được |
|---|:--:|---|---|
| **độ hiểu** | L1 | *(không có, và cấm cả ba)* | Có `code`/`tradeoffs`/`incident` thì không còn là L1 |
| **ứng dụng** | L2 | `code` | Không có mã thật thì không phải câu "thực thi mã nguồn" |
| **đánh đổi** | L3 | `tradeoffs` (≥2 phương án) | Một phương án thì không có gì để đánh đổi |
| **tính thực tế** | L4 | `incident` (triệu chứng + quy mô + ràng buộc) | Buộc phải mô tả một sự cố cụ thể, không bịa tình huống chung chung |

## 4. Vị trí trong ứng dụng

Module mới `interview` — nhãn **"Câu hỏi phỏng vấn"**, icon 🎤 — trong nhóm
*Luyện tập* của `NAV_GROUPS`, ngay sau `quiz`:

```js
// js/data/fields.js — NAV_GROUPS, nhóm "Luyện tập"
{ id: "interview", label: "Câu hỏi phỏng vấn", icon: "🎤", href: "#/interview" },
```

`FIELDS.jpa.modules` thêm `"interview"` (sau `"roadmap"`). Mười ba lĩnh vực còn lại
**không** khai module này ở đợt đầu — bất biến #7 sẽ báo đỏ nếu khai mà chưa có dữ liệu.

### Tệp bị chạm

| Tệp | Thay đổi |
|---|---|
| `js/data/fields.js` | mục `interview` trong `NAV_GROUPS`; `"interview"` vào `FIELDS.jpa.modules` |
| `js/data/meta.js` | `INTERVIEW_TOPICS` — taxonomy chủ đề theo lĩnh vực |
| `js/data/jpa/interview.js` | **mới** — 24 câu hỏi |
| `js/data/index.js` | `allInterviews`, `getInterviews(field)` |
| `js/views/interview.js` | **mới** — view hai pha |
| `js/app.js` | `import * as interview` + mục trong `routes` |
| `js/lib/stats.js` | `interviewStats(field)`; `fieldSummary` thêm `"N câu phỏng vấn"` |
| `js/lib/guides.js` | `case "interview"` trong `stepStatus()` |
| `js/data/guides.js` | bước `jp-6` cho `fieldGuides.jpa` |
| `js/lib/store.js` | ghi chú hai khoá mới trong bảng khoá |
| `js/views/settings.js` | `KEY_LABELS` hai khoá mới |
| `js/views/dashboard.js` | `statCard` cho `interview` |
| `scripts/check-data.mjs` | 8 bất biến mới; `DONE_KINDS` thêm `"interview"`; `EXPECTED.counts` |
| `webapp/README.md` | bảng tính năng, cây thư mục, số bất biến |

`VIEW_ROUTES` trong `check-data.mjs` đọc thẳng thư mục `js/views/` nên tự nhận
`interview` — không phải sửa.

## 5. Schema

```js
// js/data/jpa/interview.js
export const jpaInterview = [
  {
    id: "jpa-iq01",            // <field>-iq<NN> · HẰNG — tiến độ localStorage khoá theo id
    field: "jpa",
    topic: "jpa-tx",           // khoá trong INTERVIEW_TOPICS, phải cùng field
    level: 4,                  // 1..4
    minutes: 10,               // thời lượng kỳ vọng — hiệu chuẩn mong đợi của người học

    question: "…",             // đề bài, như người phỏng vấn đọc lên
    mustCover: ["…","…","…"],  // ≥3 ý PHẢI nói được — đây CHÍNH LÀ rubric chấm
    model: "…",                // đáp án mẫu (markdown)
    redFlags: ["…"],           // ≥1 dấu hiệu trả lời học vẹt / hiểu sai phổ biến
    probes: ["…"],             // ≥1 câu đào sâu người phỏng vấn hỏi tiếp
    refs: ["jpa-11","jpa-12"], // ≥1 doc id CÙNG lĩnh vực, phải tồn tại thật

    // ── artifact theo cấp độ (mục 6) ──
    code:      { lang: "java", text: "…" },
    tradeoffs: [{ option: "…", when: "…" }, …],
    incident:  { symptom: "…", scale: "…", constraints: "…" },
  },
];
```

Trường tuỳ theo cấp mà **bắt buộc**, **tuỳ chọn** hoặc **bị cấm** — xem mục 6.
Trường không dùng thì **bỏ hẳn khoá** khỏi object, không viết `code: null`.
Bất biến IQ4 hiểu "bị cấm" là `!(key in obj)`: `code: null` ở một câu L1 vẫn báo
đỏ. Đây là chỗ cố ý khác ngân hàng trắc nghiệm sysprog (dùng `code: null`) — ở đó
`null` chỉ là dữ liệu, còn ở đây sự có mặt của khoá mang ý nghĩa phân tầng.

### `INTERVIEW_TOPICS`

Cùng hình dạng `DOMAINS`/`TOPICS` sẵn có trong `meta.js`, nên bất biến "khoá phân
loại khớp lĩnh vực" (#4) mở rộng sang được mà không đổi hình:

```js
// js/data/meta.js
export const INTERVIEW_TOPICS = {
  "jpa-mapping":   { label: "Ánh xạ & domain model",          short: "Ánh xạ",      field: "jpa" },
  "jpa-assoc":     { label: "Collection & association",       short: "Association", field: "jpa" },
  "jpa-lifecycle": { label: "Persistence context & vòng đời", short: "Vòng đời",    field: "jpa" },
  "jpa-tx":        { label: "Transaction & concurrency",      short: "Transaction", field: "jpa" },
  "jpa-fetch":     { label: "Fetch plan & truy vấn",          short: "Fetch",       field: "jpa" },
  "jpa-spring":    { label: "Tích hợp Spring & kiểm thử",     short: "Spring",      field: "jpa" },
};
```

Chỉ khai chủ đề cho lĩnh vực **đã có** câu hỏi — giống nếp `modules` trong `fields.js`.

## 6. Hợp đồng theo cấp độ

Đây là trái tim của yêu cầu "đánh giá chính xác được level". `check-data.mjs` từ
chối mọi câu vi phạm.

| Cấp | Tên | Dạng đề điển hình | Bắt buộc | Bị cấm | `minutes` |
|:--:|---|---|---|---|:--:|
| L1 | Hiểu lý thuyết | "Giải thích…", "Phân biệt X với Y", "Điều gì xảy ra khi…" | *(khung chung)* | `code`, `tradeoffs`, `incident` | 3–6 |
| L2 | Thực thi mã nguồn | "Đoạn này sai ở đâu / viết lại thế nào / kết quả là gì" | `code` | `incident` | 4–10 |
| L3 | Phân tích đánh đổi | "Chọn A hay B, vì sao, đổi ý khi nào" | `tradeoffs` (≥2) | — | 5–12 |
| L4 | Thiết kế & xử lý sự cố | "Production đang X — chẩn đoán và sửa" | `incident` (đủ 3 trường) | — | 8–20 |

Cột **Bị cấm** là cơ chế ép đúng tầng. Một câu có `code` không thể mang nhãn L1;
một câu có `incident` không thể là L1 hay L2. Người viết muốn đặt nhãn cấp cao cho
oai thì phải thực sự viết ra artifact của cấp đó, và muốn hạ nhãn cho dễ thì phải
bỏ artifact đi — lúc ấy câu hỏi đã tự trở về đúng tầng.

Khoảng `minutes` là ràng buộc hiệu chuẩn thứ hai: một câu L4 mà chỉ cần 4 phút thì
gần như chắc chắn không phải câu xử lý sự cố thật.

**Ràng buộc cấm không áp cho `refs`, `probes`, `redFlags`, `mustCover`** — bốn
trường đó bắt buộc ở mọi cấp.

## 7. Luồng người dùng

### 7.1 Màn cài đặt phiên

Theo đúng bố cục `renderSetup()` của `views/quiz.js` để người dùng không phải học lại:

- `pageHead("🎤 Câu hỏi phỏng vấn", …)` — nêu tổng số câu và cách chấm.
- Hàng chip **lọc cấp độ**: `L1 Hiểu lý thuyết (6)` … `L4 Thiết kế & xử lý sự cố (6)`.
  Mặc định bật cả bốn.
- Hàng chip **lọc chủ đề**: sinh từ `INTERVIEW_TOPICS` của lĩnh vực hiện tại, mặc
  định bật hết, chỉ hiện chủ đề thực sự có câu hỏi.
- `<select>` số câu: 5 · 10 · Toàn bộ (mặc định 5 — câu tự luận dài hơn trắc nghiệm nhiều).
- Chip `🎯 Ưu tiên câu chưa đạt / chưa gặp` — cùng cơ chế `onlyWeak` của quiz:
  trọng số `chưa gặp = 0`, `lần gần nhất chưa đạt/một phần = 1`, `đã đạt = 2`, sắp
  xếp tăng dần rồi trộn trong nhóm.
- Nút **Bắt đầu phỏng vấn**.

Nếu bộ lọc không còn câu nào: `toast("Không có câu hỏi nào khớp bộ lọc.", "error")`
và ở lại màn cài đặt — giống quiz.

### 7.2 Một câu một màn, hai pha

**Pha trả lời** (chưa lộ gì):

1. Badge `L4 · Thiết kế & xử lý sự cố`, badge chủ đề, nhãn `⏱ 10 phút`.
2. Đề bài (`question`) qua `inlineMd`.
3. `code` render bằng `codeNode()` sẵn có; `incident` render thành khối ba dòng
   nhãn rõ — *Triệu chứng · Quy mô · Ràng buộc*.
4. Đồng hồ **đếm lên**, không ép giờ — phỏng vấn thật không có chuông.
5. `<textarea>` *"Ghi ý bạn định trả lời"* — tuỳ chọn, lưu vào `interview.notes`
   khi `blur` và khi chuyển câu.
6. Một nút duy nhất: **Xem đáp án mẫu →**.

**Pha đối chiếu** (sau khi bấm):

1. `mustCover` hiện thành **checklist tick được**, đầu đề *"Bạn có nói được ý này
   không?"*. Đây là rubric, người dùng tự tick từng ý.
2. `model` — đáp án mẫu.
3. `tradeoffs` — bảng hai cột *Phương án* / *Chọn khi*.
4. `redFlags` — khối cảnh báo, đầu đề *"Dấu hiệu trả lời thuộc lòng"*.
5. `probes` — khối *"Người phỏng vấn sẽ hỏi tiếp"*.
6. `refs` — hàng chip nhảy sang `#/docs/<id>`, nhãn lấy từ `docLabel()`.
7. **Tự chấm**, ba nút: `❌ Chưa đạt` · `🟡 Đạt một phần` · `✅ Đạt`.
   App *gợi ý* sẵn một nút theo tỉ lệ `mustCover` đã tick — `<50%` → chưa đạt,
   `<85%` → một phần, `≥85%` → đạt — nhưng **người dùng quyết định cuối cùng**;
   gợi ý chỉ là trạng thái `.suggested` trên nút, không tự chấm thay.
8. Bấm một trong ba nút → ghi `interview.stats`, gọi `recordActivity()`, sang câu kế.

### 7.3 Màn tổng kết

- Tỉ lệ đạt tổng, và **bảng tách theo từng cấp độ** — bốn dòng `L1`…`L4`, mỗi
  dòng một thanh tiến độ và `đạt/tổng`. Đây là chỗ trả lời "đánh giá chính xác được
  level" ở phía người học: nhìn ra ngay mình vững L1–L2 nhưng rụng ở L3–L4.
- Danh sách câu **chưa đạt / đạt một phần**, mỗi câu kèm `mustCover` chưa tick và
  chip `refs` để ôn lại.
- Nút *Phiên mới* và, nếu lĩnh vực có module `docs`, nút *Về thư viện tài liệu*.

## 8. Lưu trữ

Hai khoá mới trong namespace `kubeprep.` sẵn có:

```
interview.stats : { [qId]: { seen, last, best, lastAt, covered } }
                  last / best ∈ 0 (chưa đạt) | 1 (một phần) | 2 (đạt)
                  covered      = mảng chỉ số mustCover đã tick ở lần gần nhất
interview.notes : { [qId]: "ghi chú người dùng tự viết" }
```

Tách hẳn khỏi `quiz.stats`: khác không gian id, khác cách chấm (tự đánh giá so với
chấm tự động), và người dùng phải đặt lại được riêng từng cái. Cả hai khoá vào
`KEY_LABELS` của trang Cài đặt (*"Thống kê phỏng vấn"*, *"Ghi chú phỏng vấn"*) nên
tự động nằm trong luồng xuất/nhập tiến độ JSON.

`interviewStats(field)` trong `lib/stats.js`:

```js
{ seen, passed, total, seenPct, passPct,
  byLevel: { 1: { seen, passed, total }, 2: …, 3: …, 4: … } }
```

- `seen` — số câu đã tự chấm ít nhất một lần.
- `passed` — số câu có `last === 2` (trạng thái *hiện tại*, không phải kỷ lục).
- `passPct = pct(passed, seen)`; `null` khi `seen === 0`.

`fieldSummary()` thêm `"N câu phỏng vấn"` vào chuỗi mô tả lĩnh vực.

Bảng điều khiển thêm một `statCard` (chỉ khi lĩnh vực khai module):

```js
has("interview") ? statCard({ icon: "🎤",
  num: iv.passPct == null ? "—" : `${iv.passPct}%`,
  label: "Tỉ lệ đạt phỏng vấn", href: "#/interview",
  extra: `${iv.seen}/${iv.total} câu đã tự chấm` }) : null
```

## 9. Tích hợp Hướng dẫn học

`DONE_KINDS` trong `check-data.mjs` thêm `"interview"`; `stepStatus()` trong
`lib/guides.js` thêm nhánh song song với nhánh `quiz` sẵn có:

```js
case "interview": {
  const s = interviewStats(field);
  const needSeen = d.seenPct ?? 50;
  const needPass = d.passPct ?? 70;
  const progress = Math.round(
    Math.min(1, s.seenPct / needSeen) * 50 +
    Math.min(1, (s.passPct ?? 0) / needPass) * 50);
  return {
    done: s.seenPct >= needSeen && (s.passPct ?? 0) >= needPass,
    progress,
    detail: `đã tự chấm ${s.seen}/${s.total} câu${s.passPct != null ? ` · đạt ${s.passPct}%` : ""}`,
  };
}
```

Bảng `need` trong bất biến G3 thêm `interview: "interview"`.

`fieldGuides.jpa` thêm bước cuối:

```js
{ id: "jp-6",
  title: "Tự phỏng vấn: kiểm tra mình đứng ở tầng nào",
  desc: "Trả lời thành lời trước khi xem đáp án mẫu. Đọc hiểu và nói ra được là hai việc khác nhau — chính chỗ này tách người đã hiểu khỏi người mới đọc qua.",
  href: "#/interview",
  done: { kind: "interview", seenPct: 50, passPct: 70 } }
```

Bước này hợp với đối tượng đã khai của guide JPA — *"người đã từng gặp
LazyInitializationException hoặc N+1 mà chỉ chữa được bằng cách thử"*.

## 10. Bất biến mới trong `check-data.mjs`

Gọi chung là nhóm **#IQ**, đặt ngay sau nhóm #6 (hình dạng câu hỏi trắc nghiệm).

| # | Kiểm |
|---|---|
| IQ1 | `id` duy nhất trên toàn ngân hàng và khớp `^<field>-iq\d{2}$` với đúng `field` của bản ghi |
| IQ2 | `topic` có trong `INTERVIEW_TOPICS` **và** `INTERVIEW_TOPICS[topic].field === field` |
| IQ3 | khung chung: `level` ∈ 1..4 · `question`, `model` không rỗng · `mustCover` ≥3 phần tử, không rỗng, không trùng nhau · `redFlags` ≥1 · `probes` ≥1 · `minutes` là số nguyên |
| IQ4 | **hợp đồng theo cấp** — bảng mục 6: trường bắt buộc có mặt, trường bị cấm vắng khoá hẳn (`!(key in obj)`, nên `code: null` vẫn đỏ), `tradeoffs` ≥2 và mỗi phần tử đủ `option`+`when`, `incident` đủ `symptom`+`scale`+`constraints`, `code` đủ `lang`+`text`, `minutes` trong khoảng của cấp |
| IQ5 | `refs` ≥1; mỗi ref là doc id **có thật** và cùng lĩnh vực với câu hỏi |
| IQ6 | lĩnh vực khai module `interview` ⟺ có ≥1 câu (hai chiều — mở rộng #7 và #7c) |
| IQ7 | không phần tử `mustCover` nào xuất hiện nguyên văn trong `question` — đề không tự tiết lộ rubric |
| IQ8 | `EXPECTED.counts["interview:jpa"] === 24`, và đếm thực tế khớp bảng |

Ngoài ra `model` được đưa vào hai vòng quét sẵn có ở dòng ~261 và ~324
(ký tự lạ / link `#/docs` hỏng), cùng cách `explanation` đang được quét.

**IQ6 là hai chiều** vì đây là module mới: khác `flashcards`/`quiz` (ghi chú ở #7c
nói rõ không mở rộng chiều ngược vì không có ca thật), ở đây ta tự đặt ra cả hai
chiều từ đầu nên không có dữ liệu cũ nào để làm hỏng.

## 11. Dữ liệu đợt đầu — JPA

24 câu = **6 chủ đề × 4 cấp**, mỗi ô đúng một câu. Bố cục này bảo đảm phân bố cấp
độ cân bằng theo cấu trúc, không cần thêm bất biến về phân bố.

| `topic` | Nhãn | Chương nguồn (`refs`) |
|---|---|---|
| `jpa-mapping` | Ánh xạ & domain model | `jpa-03`, `jpa-05`, `jpa-06`, `jpa-07` |
| `jpa-assoc` | Collection & association | `jpa-08`, `jpa-09` |
| `jpa-lifecycle` | Persistence context & vòng đời | `jpa-02`, `jpa-10` |
| `jpa-tx` | Transaction & concurrency | `jpa-11` |
| `jpa-fetch` | Fetch plan & truy vấn | `jpa-04`, `jpa-12`, `jpa-19` |
| `jpa-spring` | Tích hợp Spring & kiểm thử | `jpa-14`, `jpa-20` |

Id chạy `jpa-iq01` … `jpa-iq24` theo thứ tự chủ đề rồi cấp độ.

### Nguyên tắc viết nội dung

- **Đọc chương nguồn trước khi viết mỗi câu.** Nội dung bám `webapp/content/jpa/`,
  không viết từ trí nhớ. Đây là cùng kỷ luật đã dùng cho ngân hàng sysprog (mỗi câu
  trích mục sách §X.Y).
- **L4 lấy sự cố ORM có thật**, không bịa tình huống chung chung: N+1 nổ dưới tải,
  `LazyInitializationException` sau khi tách tầng, lost update do thiếu `@Version`,
  connection pool cạn vì transaction mở quá lâu, `MultipleBagFetchException` khi
  join fetch hai collection.
- **`redFlags` mô tả câu trả lời sai *phổ biến*** — thứ người đọc lướt hay nói —
  chứ không phải sai ngớ ngẩn. Ví dụ: "nói `FetchType.EAGER` chữa được N+1" là
  red flag thật vì nó nghe hợp lý và vẫn sai.
- **`mustCover` là ý, không phải câu văn.** Mỗi phần tử một mệnh đề kiểm được, đủ
  ngắn để người dùng tick được sau khi nghe lại chính mình.

## 12. Cách kiểm chứng

Dự án không có test framework — `check-data.mjs` **là** bộ test. Trình tự đỏ-xanh:

1. **Dựng khung rỗng trước** — `js/data/jpa/interview.js` export mảng `[]`,
   `INTERVIEW_TOPICS = {}` trong `meta.js`, `allInterviews`/`getInterviews` trong
   `index.js`. Không có bước này thì `check-data.mjs` chết ở khâu `import` và
   "báo đỏ" sẽ là lỗi module-not-found, không phải bất biến thất bại.
2. Viết 8 bất biến #IQ, cùng `EXPECTED.counts["interview:jpa"] = 24`.
3. Chạy `node webapp/scripts/check-data.mjs` và **thấy đúng những bất biến này đỏ**
   — IQ8 (đếm 0 ≠ 24) là chính; IQ1–IQ7 xanh rỗng vì chưa có bản ghi nào để soi.
   Đọc thông báo lỗi, xác nhận nó nói về số lượng câu hỏi chứ không phải lỗi cú pháp.
4. Viết `INTERVIEW_TOPICS` thật, engine, view, rồi 24 câu dữ liệu. Chạy lại sau mỗi
   vài câu — IQ1–IQ7 chỉ bắt đầu có việc khi đã có bản ghi, nên đừng để dồn 24 câu
   rồi mới chạy lần đầu.
5. `./webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`
   — toàn bộ bất biến cũ **và** mới phải xanh.
6. `./webapp/scripts/dev.sh`, tự đi hết một phiên trong trình duyệt: lọc theo cấp,
   lọc theo chủ đề, chip ưu tiên câu yếu, hai pha, ba nút tự chấm, bảng tổng kết
   theo cấp, chip `refs` nhảy đúng tài liệu, đặt lại tiến độ ở Cài đặt.

Kiểm riêng ba điểm dễ hỏng thầm lặng:

- Đổi lĩnh vực khi đang ở `#/interview` → lĩnh vực không khai module phải rơi về
  bảng điều khiển (`switchField()` + `moduleAllowed()` đã lo, nhưng phải xác nhận).
- Xuất/nhập JSON ở Cài đặt giữ nguyên `interview.stats` và `interview.notes`.
- Câu hỏi có `code` rất dài không làm vỡ bố cục trên màn hình hẹp.

## 13. Ngoài phạm vi đợt này

- **13 lĩnh vực còn lại.** Engine đã nhận `field` làm tham số nên thêm lĩnh vực chỉ
  là thêm `js/data/<field>/interview.js`, khai chủ đề trong `INTERVIEW_TOPICS` và
  thêm `"interview"` vào `modules` — không đụng view.
- **Chấm tự động bằng NLP / so khớp câu trả lời.** App là tĩnh, không backend.
- **Bấm giờ ép buộc kiểu thi thử.** Đồng hồ chỉ đếm lên để tham khảo.
- **Ghi âm câu trả lời.** Đáng giá cho luyện nói nhưng kéo theo quyền truy cập
  micro và lưu trữ blob — một tính năng riêng, không ghép vào đây.
- **Liên kết câu hỏi phỏng vấn với tiêu chí ma trận năng lực Senior Java.** Hai tập
  id độc lập; nối chúng là một thiết kế riêng.
