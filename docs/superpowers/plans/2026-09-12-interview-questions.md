# Câu hỏi phỏng vấn theo cấp độ năng lực — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm module thứ 12 — 🎤 **Câu hỏi phỏng vấn** — vào DevPrep: ngân hàng câu hỏi tự luận có đáp án mẫu và rubric, phân theo 4 cấp độ năng lực, với 24 câu đợt đầu cho lĩnh vực JPA.

**Architecture:** DevPrep là SPA vanilla JS không build. Dữ liệu học tập là các module ES export mảng object; `webapp/scripts/check-data.mjs` là bộ bất biến đóng vai trò test suite cho toàn bộ dữ liệu. Đợt này thêm một dạng dữ liệu mới (`interview`) đi kèm một view mới, theo đúng khuôn `questions`/`flashcards` đã có: engine nhận `field` làm tham số nên mở thêm lĩnh vực về sau không phải đụng view. Điểm khác biệt so với mọi dạng dữ liệu trước là **hợp đồng cứng theo cấp độ**: mỗi cấp bắt buộc một artifact riêng và cấm artifact của cấp cao hơn, nên `check-data.mjs` từ chối được câu dán nhãn sai tầng.

**Tech Stack:** ES modules (không transpile), Node 18+ để chạy `check-data.mjs`, bash cho `build-content.sh`. Không framework, không bước build, không test runner nào ngoài `check-data.mjs`.

**Spec:** [`docs/superpowers/specs/2026-09-12-interview-questions-design.md`](../specs/2026-09-12-interview-questions-design.md)

## Global Constraints

- **Id là khoá localStorage — không bao giờ đổi sau khi commit.** Câu hỏi phỏng vấn dùng `jpa-iq01` … `jpa-iq24`, hai chữ số, không nhảy cóc.
- **Mốc xuất phát: `49/49 bất biến đạt`.** Sau Task 1 phải là `57/57`. Mỗi task kết thúc bằng `node webapp/scripts/check-data.mjs` không còn dòng `✗` nào.
- **Hợp đồng theo cấp (spec §6) là luật, không phải hướng dẫn:**

  | Cấp | Bắt buộc | Bị cấm | `minutes` |
  |:--:|---|---|:--:|
  | L1 Hiểu lý thuyết | — | `code`, `tradeoffs`, `incident` | 3–6 |
  | L2 Thực thi mã nguồn | `code` | `incident` | 4–10 |
  | L3 Phân tích đánh đổi | `tradeoffs` (≥2) | — | 5–12 |
  | L4 Thiết kế & xử lý sự cố | `incident` (đủ 3 trường) | — | 8–20 |

- **"Bị cấm" nghĩa là VẮNG KHOÁ HẲN.** Viết `code: null` trong một câu L1 vẫn báo đỏ — bất biến IQ4 kiểm `!(key in obj)`. Đây là chỗ cố ý khác ngân hàng sysprog (ở đó `code: null` là hợp lệ).
- **Mọi câu phải có đủ 6 trường khung chung:** `question`, `mustCover` (≥3), `model`, `redFlags` (≥1), `probes` (≥1), `refs` (≥1).
- **Nội dung phải lấy từ bản dịch trong `webapp/content/jpa/`, không từ trí nhớ về bản tiếng Anh.** Mỗi task viết dữ liệu bắt đầu bằng một bước đọc chương nguồn. Tên annotation, tên API, tên mục sách phải khớp bản dịch.
- **`refs` chỉ trỏ doc id của chính lĩnh vực đó** — `jpa-01` … `jpa-20`. Trỏ sang lĩnh vực khác là đỏ IQ5.
- **Không sửa `css/style.css`.** View mới dựng hoàn toàn từ class sẵn có: `card`, `badge badge-*`, `chip`, `chip-row`, `check-item`, `explain-box`, `grade-row`/`grade-btn`, `progress`, `table-wrap`/`table`, `list-warn`, `stat-num`, `stat-label`. Nếu thấy cần class mới, dừng lại — gần như chắc chắn đang có class làm đúng việc đó rồi.
- **Chạy mọi lệnh từ gốc repo**, không từ trong `webapp/`.

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `webapp/js/data/meta.js` | `INTERVIEW_TOPICS` — 6 chủ đề JPA | 1 |
| `webapp/js/data/jpa/interview.js` | Ngân hàng 24 câu; Task 1 tạo rỗng | 1, 2, 4–8 |
| `webapp/js/data/index.js` | `allInterviews`, `getInterviews(field)` | 1 |
| `webapp/scripts/check-data.mjs` | 8 bất biến #IQ; `DONE_KINDS`; `EXPECTED.counts` | 1, 2, 3, 4–8 |
| `webapp/js/views/interview.js` | **Mới** — cài đặt phiên, hai pha, tự chấm, tổng kết | 2 |
| `webapp/js/data/fields.js` | Mục `interview` trong `NAV_GROUPS`; `FIELDS.jpa.modules` | 2 |
| `webapp/js/app.js` | `import * as interview` + mục trong `routes` | 2 |
| `webapp/js/lib/stats.js` | `interviewStats(field)`; `fieldSummary` | 3 |
| `webapp/js/lib/store.js` | Ghi chú hai khoá mới trong bảng khoá | 3 |
| `webapp/js/views/settings.js` | `KEY_LABELS` hai nhãn mới | 3 |
| `webapp/js/views/dashboard.js` | `statCard` cho `interview` | 3 |
| `webapp/js/lib/guides.js` | `case "interview"` trong `stepStatus()` | 3 |
| `webapp/js/data/guides.js` | Bước `jp-6` cho `fieldGuides.jpa` | 3 |
| `webapp/README.md` | Bảng tính năng, cây thư mục, số bất biến | 9 |

Không tệp nào khác được sửa. Nếu một task khiến bạn muốn sửa `css/style.css`, `build-content.sh`, hay dữ liệu của lĩnh vực khác — dừng lại, đó là dấu hiệu làm sai khuôn.

### Vì sao chia task như dưới đây

- **Task 1 đứng riêng** vì bất biến là test suite của đợt này. Viết chúng trước, chứng minh chúng biết báo đỏ, rồi mới viết dữ liệu — nếu gộp vào task dữ liệu thì không còn cách nào biết bất biến có thật sự hoạt động hay chỉ đang xanh vì rỗng.
- **Task 2 là một lát cắt dọc** (view + module + 4 câu đầu). Không tách nhỏ hơn được: bất biến #5 đòi module phải có view thật, #7 đòi module phải có dữ liệu, IQ6 đòi có dữ liệu thì phải khai module. Ba ràng buộc này khoá chúng vào cùng một commit.
- **Task 3 gom toàn bộ tích hợp vỏ app** vì sáu tệp đó chỉ cùng nhau mới tạo ra một thay đổi review được: thống kê không có chỗ hiển thị thì vô nghĩa, thẻ bảng điều khiển không có thống kê thì không chạy.
- **Task 4–8 mỗi task một chủ đề, đúng 4 câu, đủ 4 cấp.** Cấu trúc này bảo đảm phân bố cấp độ cân bằng bằng chính cách chia việc, không cần thêm bất biến. Bốn câu một lượt để lỗi khuôn bị bắt sau 4 câu chứ không phải sau 24.

---

## Task 1: Bất biến #IQ và khung dữ liệu rỗng

**Files:**
- Modify: `webapp/js/data/meta.js` (thêm `INTERVIEW_TOPICS` ở cuối tệp)
- Create: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/js/data/index.js`
- Modify: `webapp/scripts/check-data.mjs`

**Interfaces:**
- Consumes: `fieldOf`, `dupes`, `check`, `expect`, `EXPECTED`, `docs`, `FIELDS` — đều đã có sẵn trong `check-data.mjs`.
- Produces:
  - `INTERVIEW_TOPICS: Record<string, { label: string, short: string, field: string }>` từ `meta.js`
  - `jpaInterview: Array<InterviewQuestion>` từ `js/data/jpa/interview.js`
  - `allInterviews: Array<InterviewQuestion>` và `getInterviews(fieldId): Array<InterviewQuestion>` từ `js/data/index.js`

- [ ] **Bước 1: Thêm `INTERVIEW_TOPICS` vào cuối `webapp/js/data/meta.js`**

```js
// Chủ đề của ngân hàng câu hỏi phỏng vấn — cùng hình dạng DOMAINS/TOPICS, nhưng
// `field` BẮT BUỘC khai tường minh (DOMAINS mặc định "kubernetes" vì lý do lịch
// sử; ngân hàng này mới nên không thừa kế mặc định đó).
//
// Chỉ khai chủ đề cho lĩnh vực ĐÃ có câu hỏi — giống nếp `modules` trong fields.js.
export const INTERVIEW_TOPICS = {
  "jpa-mapping":   { label: "Ánh xạ & domain model",          short: "Ánh xạ",      field: "jpa" },
  "jpa-assoc":     { label: "Collection & association",       short: "Association", field: "jpa" },
  "jpa-lifecycle": { label: "Persistence context & vòng đời", short: "Vòng đời",    field: "jpa" },
  "jpa-tx":        { label: "Transaction & concurrency",      short: "Transaction", field: "jpa" },
  "jpa-fetch":     { label: "Fetch plan & truy vấn",          short: "Fetch",       field: "jpa" },
  "jpa-spring":    { label: "Tích hợp Spring & kiểm thử",     short: "Spring",      field: "jpa" },
};
```

- [ ] **Bước 2: Tạo `webapp/js/data/jpa/interview.js` rỗng**

```js
// Ngân hàng câu hỏi phỏng vấn JPA — 24 câu, 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt Java Persistence with Spring Data and Hibernate
// (Cătălin Tudose — Manning). Mỗi câu trỏ chương nguồn qua `refs` để tra ngược.
//
// Thang cấp độ lấy nguyên từ ma trận năng lực Senior Java (senior-java/matrix.js):
//   1 Hiểu lý thuyết · 2 Thực thi mã nguồn · 3 Phân tích đánh đổi ·
//   4 Thiết kế & xử lý sự cố
//
// HỢP ĐỒNG THEO CẤP (check-data.mjs nhóm #IQ ép, không phải gợi ý):
//   L1 — cấm `code`, `tradeoffs`, `incident`; minutes 3–6
//   L2 — BẮT BUỘC `code`; cấm `incident`;      minutes 4–10
//   L3 — BẮT BUỘC `tradeoffs` (≥2 phương án);  minutes 5–12
//   L4 — BẮT BUỘC `incident` (symptom + scale + constraints); minutes 8–20
// "Cấm" nghĩa là VẮNG KHOÁ HẲN — viết `code: null` ở câu L1 vẫn báo đỏ.
//
// GIỮ NGUYÊN id (jpa-iq01–jpa-iq24) — thống kê tự chấm trong localStorage lưu theo id.

export const jpaInterview = [];
```

- [ ] **Bước 3: Nối vào `webapp/js/data/index.js`**

Thêm dòng import cạnh các import dữ liệu khác (sau `import { seniorJavaMatrix } …`):

```js
import { jpaInterview } from "./jpa/interview.js";
```

Thêm sau dòng `export const allMatrices = [seniorJavaMatrix];`:

```js
export const allInterviews = [...jpaInterview];
```

Thêm sau dòng `export const getMatrices = by(allMatrices);`:

```js
export const getInterviews = by(allInterviews);
```

- [ ] **Bước 4: Nạp dữ liệu phỏng vấn trong `check-data.mjs`**

Sửa dòng nạp dữ liệu (hiện là `const { allFlashcards: flashcards, allQuestions: questions, allMatrices: matrices } = await import("../js/data/index.js");`) thành:

```js
const { allFlashcards: flashcards, allQuestions: questions, allMatrices: matrices,
        allInterviews: interviews } = await import("../js/data/index.js");
```

Và sửa dòng nạp `meta.js` (hiện là `const { DOMAINS, TOPICS } = await import("../js/data/meta.js");`) thành:

```js
const { DOMAINS, TOPICS, INTERVIEW_TOPICS } = await import("../js/data/meta.js");
```

- [ ] **Bước 5: Viết 8 bất biến #IQ**

Đặt **ngay sau bất biến `#7b`** (khối "Module chỉ dành cho Kubernetes không bị lĩnh vực khác khai"). Vị trí này bắt buộc: IQ6 cần `FIELDS`, mà `FIELDS` chỉ được import ở khối `#5` phía trên `#7`.

```js
// ---- #IQ — Ngân hàng câu hỏi phỏng vấn ----
//
// Thang cấp độ lấy nguyên từ ma trận năng lực Senior Java. Khác `difficulty`
// 1–3 của ngân hàng trắc nghiệm: difficulty đo ĐỘ KHÓ của một câu, level đo
// LOẠI năng lực câu đó đòi hỏi.
//
// IQ4 là bất biến mang nhiều sức nặng nhất. Mỗi cấp buộc phải có artifact của
// cấp đó và không được có artifact của cấp cao hơn, nên không thể dán nhãn L4
// cho một câu lý thuyết suông: muốn L4 thì phải thật sự viết ra một `incident`
// có triệu chứng, quy mô và ràng buộc. Ngược lại, muốn hạ một câu xuống L1 cho
// dễ viết thì phải bỏ hết artifact đi — lúc ấy nó đã tự trở về đúng tầng.
const IQ_CONTRACT = {
  1: { need: [],            ban: ["code", "tradeoffs", "incident"], minutes: [3, 6] },
  2: { need: ["code"],      ban: ["incident"],                      minutes: [4, 10] },
  3: { need: ["tradeoffs"], ban: [],                                minutes: [5, 12] },
  4: { need: ["incident"],  ban: [],                                minutes: [8, 20] },
};

await check("IQ1 — interview.id duy nhất và đúng dạng <field>-iq<NN>", () => {
  const dup = dupes(interviews.map((q) => q.id));
  expect(!dup.length, `id trùng: ${dup.join(", ")}`);
  const bad = interviews.filter((q) => !new RegExp(`^${fieldOf(q)}-iq\\d{2}$`).test(q.id ?? ""));
  expect(!bad.length, `id sai dạng: ${bad.map((q) => q.id).join(", ")}`);
});

await check("IQ2 — interview.topic hợp lệ và khớp field", () => {
  const bad = interviews.filter((q) => {
    const t = INTERVIEW_TOPICS[q.topic];
    return !t || t.field !== fieldOf(q);
  });
  expect(!bad.length, `sai topic/field: ${bad.map((q) => `${q.id}→${q.topic}`).join(", ")}`);
});

await check("IQ3 — khung chung của câu hỏi phỏng vấn", () => {
  const bad = [];
  const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
  const listOf = (v, n) => Array.isArray(v) && v.length >= n && v.every(nonEmpty);
  for (const q of interviews) {
    if (![1, 2, 3, 4].includes(q.level)) bad.push(`${q.id}: level "${q.level}" ngoài 1..4`);
    if (!nonEmpty(q.question)) bad.push(`${q.id}: thiếu question`);
    if (!nonEmpty(q.model)) bad.push(`${q.id}: thiếu model`);
    if (!listOf(q.mustCover, 3)) bad.push(`${q.id}: mustCover cần ≥3 chuỗi không rỗng`);
    else if (new Set(q.mustCover.map((x) => x.trim())).size !== q.mustCover.length) {
      bad.push(`${q.id}: mustCover có ý trùng nhau`);
    }
    if (!listOf(q.redFlags, 1)) bad.push(`${q.id}: redFlags cần ≥1 chuỗi không rỗng`);
    if (!listOf(q.probes, 1)) bad.push(`${q.id}: probes cần ≥1 chuỗi không rỗng`);
    if (!Number.isInteger(q.minutes)) bad.push(`${q.id}: minutes phải là số nguyên`);
  }
  expect(!bad.length, bad.join("; "));
});

await check("IQ4 — hợp đồng artifact theo cấp độ", () => {
  const bad = [];
  const filled = (v) => typeof v === "string" && v.trim().length > 0;
  for (const q of interviews) {
    const c = IQ_CONTRACT[q.level];
    if (!c) continue;  // level sai đã do IQ3 bắt; không báo đỏ hai lần cùng một lỗi
    for (const key of c.need) {
      if (!(key in q)) bad.push(`${q.id} (L${q.level}): thiếu "${key}" bắt buộc`);
    }
    for (const key of c.ban) {
      if (key in q) bad.push(`${q.id} (L${q.level}): không được có "${key}"`);
    }
    if ("code" in q && !(filled(q.code?.lang) && filled(q.code?.text))) {
      bad.push(`${q.id}: code cần đủ lang + text`);
    }
    if ("tradeoffs" in q) {
      if (!Array.isArray(q.tradeoffs) || q.tradeoffs.length < 2) {
        bad.push(`${q.id}: tradeoffs cần ≥2 phương án`);
      } else if (!q.tradeoffs.every((t) => filled(t?.option) && filled(t?.when))) {
        bad.push(`${q.id}: mỗi tradeoff cần đủ option + when`);
      }
    }
    if ("incident" in q && !["symptom", "scale", "constraints"].every((k) => filled(q.incident?.[k]))) {
      bad.push(`${q.id}: incident cần đủ symptom + scale + constraints`);
    }
    const [lo, hi] = c.minutes;
    if (Number.isInteger(q.minutes) && (q.minutes < lo || q.minutes > hi)) {
      bad.push(`${q.id} (L${q.level}): minutes=${q.minutes} ngoài khoảng ${lo}–${hi}`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

await check("IQ5 — interview.refs trỏ tài liệu có thật, cùng lĩnh vực", () => {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const bad = [];
  for (const q of interviews) {
    if (!Array.isArray(q.refs) || !q.refs.length) { bad.push(`${q.id}: refs rỗng`); continue; }
    for (const r of q.refs) {
      const d = byId.get(r);
      if (!d) bad.push(`${q.id}: ref "${r}" không phải doc id`);
      else if (fieldOf(d) !== fieldOf(q)) bad.push(`${q.id}: ref "${r}" thuộc lĩnh vực khác`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

// IQ6 soát CẢ HAI CHIỀU, khác #7/#7c. Ghi chú ở #7c nói rõ vì sao không mở rộng
// chiều ngược cho flashcards/quiz: không có ca thật để kiểm chứng. Ở đây module
// hoàn toàn mới nên không có dữ liệu cũ nào để làm đỏ oan — đặt cả hai chiều từ
// đầu là rẻ nhất.
await check("IQ6 — khai module interview ⇔ có dữ liệu (hai chiều)", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    const has = interviews.some((q) => fieldOf(q) === id);
    if (f.modules.includes("interview") && !has) {
      bad.push(`${id} khai "interview" nhưng không có câu hỏi`);
    }
    if (!f.modules.includes("interview") && has) {
      bad.push(`${id} có câu hỏi phỏng vấn nhưng không khai module "interview"`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

// IQ7 — đề bài không được chứa nguyên văn một ý trong rubric: đọc đề mà thấy
// sẵn đáp án thì phần tự chấm mất hết ý nghĩa. Ngưỡng 12 ký tự để một mệnh đề
// ngắn dùng chung (vd tên một annotation) không bị báo đỏ oan.
await check("IQ7 — đề bài không tiết lộ rubric", () => {
  const bad = [];
  for (const q of interviews) {
    const ask = String(q.question ?? "").toLowerCase();
    for (const m of q.mustCover ?? []) {
      const t = String(m).trim().toLowerCase();
      if (t.length >= 12 && ask.includes(t)) {
        bad.push(`${q.id}: mustCover "${m}" nằm nguyên văn trong question`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});

await check("IQ8 — EXPECTED.counts phủ mọi lĩnh vực khai interview", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    if (f.modules.includes("interview") && !(`interview:${id}` in EXPECTED.counts)) {
      bad.push(`thiếu "interview:${id}"`);
    }
  }
  expect(!bad.length, `${bad.join("; ")} trong EXPECTED.counts`);
});
```

- [ ] **Bước 6: Đưa `interview` vào vòng đếm của bảng kỳ vọng**

Trong khối `await check("Số lượng bản ghi khớp bảng kỳ vọng", …)`, sửa vòng `for` đầu tiên:

```js
  for (const f of new Set([...docs, ...flashcards, ...questions, ...interviews].map(fieldOf))) {
    actual[`docs:${f}`] = docs.filter((d) => fieldOf(d) === f).length;
    actual[`flashcards:${f}`] = flashcards.filter((c) => fieldOf(c) === f).length;
    actual[`questions:${f}`] = questions.filter((q) => fieldOf(q) === f).length;
    actual[`interview:${f}`] = interviews.filter((q) => fieldOf(q) === f).length;
  }
```

- [ ] **Bước 7: Đưa `model` vào hai vòng quét link sẵn có**

Trong bất biến **#3** (link `#/docs/<id>` hỏng) và **#3c** (link `#/roadmap/<id>` hỏng), mỗi khối có một dòng `for (const q of questions) scan(q.explanation, …)`. Thêm ngay dưới mỗi dòng đó:

```js
  for (const q of interviews) scan(q.model, `${q.id} model`);
```

- [ ] **Bước 8: Thêm `"interview"` vào `DONE_KINDS`**

```js
const DONE_KINDS = new Set(["track", "roadmap", "docs", "doc", "flashcards", "quiz", "exam", "tracker", "interview", "manual"]);
```

Và trong bất biến **G3**, bảng `need` (dòng bắt đầu `const need = { flashcards: "flashcards", …`) thêm cặp `interview: "interview"`:

```js
      const need = { flashcards: "flashcards", quiz: "quiz", exam: "exam", tracker: "tracker", interview: "interview", track: "roadmap", roadmap: "roadmap", docs: "docs", doc: "docs" }[d.kind];
```

- [ ] **Bước 9: Chạy kiểm dữ liệu — kỳ vọng `57/57` xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng: `57/57 bất biến đạt` và `Dữ liệu hợp lệ.` Tám bất biến mới xanh *rỗng* — chưa có bản ghi nào để soi. Bước 10 là để chứng minh chúng không xanh vì lý do đó.

- [ ] **Bước 10: Chứng minh bất biến biết báo đỏ**

Tạm thay `export const jpaInterview = [];` trong `webapp/js/data/jpa/interview.js` bằng một bản ghi **cố tình sai mọi đường**:

```js
export const jpaInterview = [
  {
    id: "jpa-bad-1",              // sai dạng id            → IQ1
    field: "jpa",
    topic: "jpa-khong-co-that",   // chủ đề không tồn tại   → IQ2
    level: 1,
    minutes: 99,                  // ngoài khoảng 3–6 của L1 → IQ4
    question: "Giải thích persistence context là bộ nhớ đệm cấp một",
    mustCover: ["persistence context là bộ nhớ đệm cấp một", "a", "a"], // <3 hợp lệ + trùng → IQ3, và nằm trong question → IQ7
    model: "Xem #/docs/jpa-99",   // link tài liệu không tồn tại → #3
    redFlags: [],                 // rỗng                   → IQ3
    probes: [],                   // rỗng                   → IQ3
    refs: ["sp-c-01"],            // không phải doc id jpa  → IQ5
    incident: { symptom: "x" },   // L1 không được có       → IQ4
  },
];
```

Chạy `node webapp/scripts/check-data.mjs`. **Phải thấy đỏ ít nhất:** IQ1, IQ2, IQ3, IQ4, IQ5, IQ7, và IQ6 (`jpa có câu hỏi phỏng vấn nhưng không khai module "interview"`), cùng bất biến #3 về link `#/docs/jpa-99`. Đọc từng dòng `✗`, đối chiếu với chú thích trong khối trên — nếu một bất biến nào đó **không** đỏ, nó đang hỏng, sửa trước khi đi tiếp.

Sau đó **hoàn nguyên** tệp về `export const jpaInterview = [];` và chạy lại để chắc chắn trở về `57/57`.

- [ ] **Bước 11: Commit**

```bash
git add webapp/js/data/meta.js webapp/js/data/jpa/interview.js \
        webapp/js/data/index.js webapp/scripts/check-data.mjs
git commit -m "test(interview): 8 bất biến #IQ và khung dữ liệu câu hỏi phỏng vấn

Bộ bất biến đi trước dữ liệu. IQ4 mã hoá hợp đồng theo cấp độ: mỗi cấp
bắt buộc artifact của cấp đó (L2 code, L3 tradeoffs, L4 incident) và cấm
artifact của cấp cao hơn, nên không thể dán nhãn L4 cho một câu lý thuyết
suông. \"Cấm\" là vắng khoá hẳn — code: null vẫn đỏ.

IQ6 soát hai chiều ngay từ đầu, khác #7/#7c: module mới nên không có dữ
liệu cũ nào để làm đỏ oan.

Đã kiểm từng bất biến bằng một bản ghi cố tình sai mọi đường rồi hoàn
nguyên. Ngân hàng còn rỗng — app chưa đổi. 57/57 bất biến đạt."
```

---

## Task 2: View, module, và 4 câu chủ đề `jpa-mapping`

**Files:**
- Create: `webapp/js/views/interview.js`
- Modify: `webapp/js/data/fields.js`
- Modify: `webapp/js/app.js`
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`EXPECTED.counts`)

**Interfaces:**
- Consumes: `getInterviews(field)` (Task 1); `INTERVIEW_TOPICS` (Task 1); `h`, `pageHead`, `inlineMd`, `codeNode`, `shuffle`, `toast`, `emptyState` từ `lib/ui.js`; `store` từ `lib/store.js`; `recordActivity` từ `lib/activity.js`; `currentField` từ `lib/field.js`; `docLabel` từ `data/labels.js`; `allDocs` từ `data/index.js`.
- Produces: `render(root)` export từ `views/interview.js` — chữ ký giống mọi view khác, nhận `root` và mảng `params` (view này bỏ qua `params`). Hai khoá localStorage `interview.stats` và `interview.notes` với hình dạng ghi ở Bước 3.

- [ ] **Bước 1: Đọc bốn chương nguồn của chủ đề `jpa-mapping`**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/03-domain-model-va-metadata.md \
  webapp/content/jpa/05-anh-xa-cac-persistent-class.md \
  webapp/content/jpa/06-anh-xa-value-type.md \
  webapp/content/jpa/07-anh-xa-inheritance.md
```

Tên tệp lấy từ `webapp/js/data/jpa/docs.js` (`file:` của `jpa-03`, `jpa-05`, `jpa-06`, `jpa-07`) — nếu `awk` báo không thấy tệp, chạy `./webapp/scripts/build-content.sh webapp/content` trước.

Đọc kỹ bốn mục sau, vì bốn câu hỏi dựa thẳng vào chúng: ranh giới entity với value type (ch.5), chiến lược sinh định danh (ch.5), embeddable component và converter (ch.6), bốn chiến lược ánh xạ inheritance (ch.7).

- [ ] **Bước 2: Khai module trong `webapp/js/data/fields.js`**

Trong `NAV_GROUPS`, nhóm `"Luyện tập"`, chèn **ngay sau** mục `quiz`:

```js
      { id: "interview",  label: "Câu hỏi phỏng vấn", icon: "🎤", href: "#/interview" },
```

Trong `FIELDS.jpa`, sửa `modules` thành:

```js
    modules: ["dashboard", "guide", "docs", "roadmap", "interview"],
```

- [ ] **Bước 3: Tạo `webapp/js/views/interview.js`**

```js
// Câu hỏi phỏng vấn — tự luận có đáp án mẫu và rubric, phân theo 4 cấp năng lực.
//
// Khác trắc nghiệm ở TRỤC CHẤM ĐIỂM: quiz so `chosen` với `answer` rồi tự kết
// luận đúng/sai; ở đây không có đáp án máy so được, người học tự đối chiếu câu
// trả lời của mình với rubric `mustCover` rồi tự chấm ba mức. Vì vậy có view
// riêng thay vì nhánh thứ hai trong views/quiz.js — cùng lý do views/tracker.js
// tách khỏi views/roadmap.js.
//
// Phiên chạy hai pha có chủ đích: pha trả lời KHÔNG hiện bất cứ thứ gì thuộc
// đáp án. Thấy trước rubric là hỏng phép đo — người đọc sẽ nhận ra ý thay vì
// tự sản sinh ra nó, đúng thứ khác biệt giữa "đọc hiểu" và "nói được".

import { h, pageHead, inlineMd, codeNode, shuffle, toast, emptyState } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { recordActivity } from "../lib/activity.js";
import { getInterviews, allDocs } from "../data/index.js";
import { INTERVIEW_TOPICS } from "../data/meta.js";
import { docLabel } from "../data/labels.js";
import { currentField } from "../lib/field.js";

// Giữ ĐÚNG nhãn của ma trận năng lực (views/tracker.js) — một từ vựng cho cả app.
const LEVELS = [
  { n: 1, label: "Hiểu lý thuyết",         color: "blue"  },
  { n: 2, label: "Thực thi mã nguồn",      color: "teal"  },
  { n: 3, label: "Phân tích đánh đổi",     color: "amber" },
  { n: 4, label: "Thiết kế & xử lý sự cố", color: "red"   },
];

const GRADES = [
  { v: 0, cls: "grade-again", label: "❌ Chưa đạt",     hint: "thiếu ý cốt lõi" },
  { v: 1, cls: "grade-hard",  label: "🟡 Đạt một phần", hint: "đúng hướng, còn hổng" },
  { v: 2, cls: "grade-good",  label: "✅ Đạt",          hint: "nói được trọn ý" },
];

const levelOf = (n) => LEVELS.find((l) => l.n === n) ?? LEVELS[0];
const levelBadge = (n) =>
  h("span", { class: `badge badge-${levelOf(n).color}` }, `L${n} · ${levelOf(n).label}`);

export function render(root) {
  renderSetup(root);
}

// ---------- Màn cài đặt phiên ----------

function renderSetup(root) {
  const fieldKey = currentField();
  const bank = getInterviews(fieldKey);
  const page = h("div", { class: "page" });

  if (!bank.length) {
    page.append(
      pageHead("🎤 Câu hỏi phỏng vấn", "Lĩnh vực này chưa có ngân hàng câu hỏi phỏng vấn."),
      emptyState("🎤", "Chưa có câu hỏi", "Ngân hàng câu hỏi phỏng vấn cho lĩnh vực này chưa được viết."));
    root.append(page);
    return;
  }

  page.append(pageHead("🎤 Câu hỏi phỏng vấn",
    `${bank.length} câu tự luận có đáp án mẫu và rubric, phân theo 4 cấp năng lực. ` +
    "Trả lời thành lời trước, rồi mới lật đáp án và tự chấm — đọc hiểu và nói ra được là hai việc khác nhau."));

  // Lọc cấp độ
  const levelSel = new Set(LEVELS.map((l) => l.n));
  const levelRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  for (const lv of LEVELS) {
    const count = bank.filter((q) => q.level === lv.n).length;
    if (!count) continue;
    const chip = h("button", { class: "chip on" }, `L${lv.n} ${lv.label} (${count})`);
    chip.addEventListener("click", () => {
      if (levelSel.has(lv.n)) levelSel.delete(lv.n);
      else levelSel.add(lv.n);
      chip.classList.toggle("on", levelSel.has(lv.n));
    });
    levelRow.append(chip);
  }

  // Lọc chủ đề — chỉ hiện chủ đề thực sự có câu hỏi
  const topicSel = new Set();
  const topicRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  for (const [key, t] of Object.entries(INTERVIEW_TOPICS)) {
    if (t.field !== fieldKey) continue;
    const count = bank.filter((q) => q.topic === key).length;
    if (!count) continue;
    topicSel.add(key);
    const chip = h("button", { class: "chip on" }, `${t.short} (${count})`);
    chip.addEventListener("click", () => {
      if (topicSel.has(key)) topicSel.delete(key);
      else topicSel.add(key);
      chip.classList.toggle("on", topicSel.has(key));
    });
    topicRow.append(chip);
  }

  // Mặc định 5 câu, không phải 20 như trắc nghiệm: một câu tự luận L4 ngốn
  // 8–20 phút, nên 20 câu là một buổi chiều chứ không phải một lượt ôn.
  const countSel = h("select", { class: "select", style: "max-width:200px" },
    h("option", { value: "5", selected: true }, "5 câu"),
    h("option", { value: "10" }, "10 câu"),
    h("option", { value: "all" }, "Toàn bộ"));

  let onlyWeak = false;
  const weakChip = h("button", { class: "chip" }, "🎯 Ưu tiên câu chưa đạt / chưa gặp");
  weakChip.addEventListener("click", () => {
    onlyWeak = !onlyWeak;
    weakChip.classList.toggle("on", onlyWeak);
  });

  const startBtn = h("button", { class: "btn btn-primary btn-lg" }, "Bắt đầu phỏng vấn");
  startBtn.addEventListener("click", () => {
    let pool = bank.filter((q) => levelSel.has(q.level) && topicSel.has(q.topic));
    if (!pool.length) { toast("Không có câu hỏi nào khớp bộ lọc.", "error"); return; }
    const n = countSel.value === "all" ? pool.length : Math.min(+countSel.value, pool.length);
    if (onlyWeak) {
      const stats = store.get("interview.stats", {});
      const weight = (q) => {
        const s = stats[q.id];
        if (!s || !s.seen) return 0;   // chưa gặp — ưu tiên nhất
        if (s.last < 2) return 1;      // lần gần nhất chưa đạt / một phần
        return 2;                      // đã đạt
      };
      pool = pool.slice().sort((a, b) => weight(a) - weight(b));
      // Trộn trong một cửa sổ rộng gấp đôi rồi cắt: giữ ưu tiên câu yếu mà vẫn
      // không ra đúng một thứ tự cố định mỗi lượt.
      pool = shuffle(pool.slice(0, Math.max(n, Math.min(pool.length, n * 2)))).slice(0, n);
    } else {
      pool = shuffle(pool).slice(0, n);
    }
    renderSession(root, pool);
  });

  page.append(
    h("div", { class: "card" },
      h("strong", {}, "Cấp độ"), levelRow,
      h("strong", {}, "Chủ đề"), topicRow,
      h("div", { class: "flex flex-wrap", style: "margin-bottom:14px" }, countSel, weakChip),
      startBtn)
  );

  root.append(page);
}

// ---------- Phiên phỏng vấn ----------

function renderSession(root, list) {
  root.innerHTML = "";
  const page = h("div", { class: "page" });
  root.append(page);

  const stats = store.get("interview.stats", {});
  const notes = store.get("interview.notes", {});
  let idx = 0;
  const results = []; // { q, grade, covered }

  const progressText = h("span", { class: "muted small" });
  const progressBar = h("span", {});
  const body = h("div", {});

  page.append(
    h("div", { class: "flex spread", style: "margin-bottom:6px" },
      h("a", {
        class: "btn btn-ghost btn-sm", href: "#/interview",
        onclick: (e) => { e.preventDefault(); root.innerHTML = ""; renderSetup(root); },
      }, "← Thoát"),
      progressText),
    h("div", { class: "progress", style: "margin-bottom:16px" }, progressBar),
    body
  );

  function showQuestion() {
    const q = list[idx];
    progressText.textContent = `Câu ${idx + 1}/${list.length}`;
    progressBar.style.width = `${(idx / list.length) * 100}%`;
    body.innerHTML = "";

    const topic = INTERVIEW_TOPICS[q.topic];
    const card = h("div", { class: "card" },
      h("div", { class: "flex flex-wrap", style: "margin-bottom:10px" },
        levelBadge(q.level),
        h("span", { class: "badge" }, topic ? topic.short : q.topic),
        h("span", { class: "faint small" }, `⏱ ${q.minutes} phút`),
        clockEl()),
      h("div", { style: "font-size:16px;font-weight:600", html: inlineMd(q.question) }));

    if (q.incident) card.append(incidentBlock(q.incident));
    const codeEl = codeNode(q.code);
    if (codeEl) card.append(codeEl);

    const note = h("textarea", {
      class: "input",
      rows: "4",
      placeholder: "Ghi ý bạn định trả lời (tuỳ chọn) — viết ra trước khi lật đáp án",
      style: "margin-top:12px;width:100%;resize:vertical",
    });
    note.value = notes[q.id] ?? "";
    const saveNote = () => {
      const v = note.value.trim();
      if (v) notes[q.id] = v; else delete notes[q.id];
      store.set("interview.notes", notes);
    };
    note.addEventListener("blur", saveNote);
    card.append(note);

    const revealBtn = h("button", { class: "btn btn-primary", style: "margin-top:12px" },
      "Xem đáp án mẫu →");
    revealBtn.addEventListener("click", () => { saveNote(); reveal(); });
    card.append(revealBtn);
    body.append(card);

    function reveal() {
      revealBtn.remove();
      note.disabled = true;

      // Rubric: người học tick từng ý mình thật sự nói được.
      const covered = new Set();
      const rubric = h("div", { style: "margin-top:16px" },
        h("strong", {}, "Bạn có nói được ý này không?"));
      const gradeBtns = [];
      q.mustCover.forEach((m, i) => {
        const cb = h("input", { type: "checkbox" });
        const row = h("label", { class: "check-item" }, cb, h("span", { class: "check-text", html: inlineMd(m) }));
        cb.addEventListener("change", () => {
          if (cb.checked) covered.add(i); else covered.delete(i);
          row.classList.toggle("done", cb.checked);
          syncSuggestion();
        });
        rubric.append(row);
      });

      const suggestion = h("div", { class: "faint small", style: "margin:10px 0 6px" });
      function syncSuggestion() {
        const ratio = q.mustCover.length ? covered.size / q.mustCover.length : 0;
        const v = ratio >= 0.85 ? 2 : ratio >= 0.5 ? 1 : 0;
        suggestion.textContent =
          `Đã tick ${covered.size}/${q.mustCover.length} ý — gợi ý: ${GRADES[v].label}. Bạn vẫn là người chấm cuối.`;
        // Viền dày lên bằng token sẵn có thay vì một class mới: không có
        // .suggested trong style.css, và đợt này không đụng tới style.css.
        gradeBtns.forEach((b, i) => {
          b.style.borderColor = i === v ? "var(--accent)" : "";
          b.style.borderWidth = i === v ? "2px" : "";
        });
      }

      const refChips = h("div", { class: "chip-row", style: "margin-top:10px" },
        q.refs.map((id) => {
          const d = allDocs.find((x) => x.id === id);
          return h("a", { class: "chip", href: `#/docs/${id}` }, d ? docLabel(d) : id);
        }));

      const grades = h("div", { class: "grade-row", style: "margin-top:10px;grid-template-columns:repeat(3,1fr)" });
      for (const g of GRADES) {
        const btn = h("button", { class: `grade-btn ${g.cls}` },
          h("span", {}, g.label), h("small", {}, g.hint));
        btn.addEventListener("click", () => answer(g.v, [...covered]));
        gradeBtns.push(btn);
        grades.append(btn);
      }

      card.append(
        rubric,
        h("div", { class: "explain-box ok", style: "margin-top:14px" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Đáp án mẫu"),
          h("div", { html: inlineMd(q.model) })),
        q.tradeoffs ? tradeoffTable(q.tradeoffs) : null,
        h("div", { class: "explain-box bad" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Dấu hiệu trả lời thuộc lòng"),
          h("ul", { class: "list-warn" }, q.redFlags.map((r) => h("li", { html: inlineMd(r) })))),
        h("div", { class: "explain-box" },
          h("div", { style: "font-weight:700;margin-bottom:4px" }, "Người phỏng vấn sẽ hỏi tiếp"),
          h("ul", {}, q.probes.map((p) => h("li", { html: inlineMd(p) })))),
        refChips,
        suggestion,
        grades);

      syncSuggestion();
      grades.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function answer(grade, covered) {
      results.push({ q, grade, covered });
      const s = stats[q.id] ?? { seen: 0, last: 0, best: 0, lastAt: 0, covered: [] };
      s.seen++;
      s.last = grade;
      s.best = Math.max(s.best ?? 0, grade);
      s.lastAt = Date.now();
      s.covered = covered;
      stats[q.id] = s;
      store.set("interview.stats", stats);
      recordActivity();
      idx++;
      if (idx >= list.length) showSummary();
      else showQuestion();
    }
  }

  // Đồng hồ ĐẾM LÊN, không đếm ngược: phỏng vấn thật không có chuông, và ép giờ
  // ở đây chỉ tạo áp lực giả mà không đo thêm được gì.
  function clockEl() {
    const el = h("span", { class: "faint small" }, "0:00");
    const t0 = Date.now();
    const tick = () => {
      if (!el.isConnected) { clearInterval(timer); return; }
      const s = Math.floor((Date.now() - t0) / 1000);
      el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };
    const timer = setInterval(tick, 1000);
    return el;
  }

  function incidentBlock(inc) {
    const row = (label, text) =>
      h("div", { style: "margin-top:4px" },
        h("strong", {}, `${label}: `), h("span", { html: inlineMd(text) }));
    return h("div", { class: "explain-box bad", style: "margin-top:12px" },
      h("div", { style: "font-weight:700" }, "🔥 Tình huống production"),
      row("Triệu chứng", inc.symptom),
      row("Quy mô", inc.scale),
      row("Ràng buộc", inc.constraints));
  }

  function tradeoffTable(list) {
    return h("div", { class: "table-wrap", style: "margin-top:12px" },
      h("table", { class: "table" },
        h("thead", {}, h("tr", {}, h("th", {}, "Phương án"), h("th", {}, "Chọn khi"))),
        h("tbody", {}, list.map((t) =>
          h("tr", {},
            h("td", { html: inlineMd(t.option) }),
            h("td", { html: inlineMd(t.when) }))))));
  }

  function showSummary() {
    body.innerHTML = "";
    progressBar.style.width = "100%";
    progressText.textContent = "Hoàn thành";

    const passed = results.filter((r) => r.grade === 2).length;
    const pct = Math.round((passed / results.length) * 100);

    body.append(
      h("div", { class: "card center" },
        h("div", { class: "stat-num", style: `color:${pct >= 66 ? "var(--green)" : "var(--red)"};font-size:42px` }, `${pct}%`),
        h("div", { class: "stat-label" }, `${passed}/${results.length} câu tự chấm Đạt`),
        h("div", { class: "flex", style: "justify-content:center;margin-top:14px" },
          h("button", { class: "btn btn-primary", onclick: () => { root.innerHTML = ""; renderSetup(root); } }, "Phiên mới"),
          h("a", { class: "btn", href: "#/docs" }, "Về thư viện tài liệu →")))
    );

    // Bảng theo cấp — phần riêng của view này. Tỉ lệ đạt tổng che mất chuyện
    // quan trọng nhất: rụng ở tầng nào. Bốn dòng này trả lời đúng câu đó.
    const grid = h("div", { class: "grid", style: "margin:18px 0;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr))" });
    for (const lv of LEVELS) {
      const inLv = results.filter((r) => r.q.level === lv.n);
      if (!inLv.length) continue;
      const ok = inLv.filter((r) => r.grade === 2).length;
      grid.append(
        h("div", { class: "card" },
          h("div", { class: "flex spread" },
            h("strong", {}, `L${lv.n} · ${lv.label}`),
            h("span", { class: "small", style: "font-weight:700" }, `${ok}/${inLv.length}`)),
          h("div", { class: "progress", style: "margin-top:8px;height:5px" },
            h("span", { style: `width:${(ok / inLv.length) * 100}%` }))));
    }
    if (grid.children.length) body.append(grid);

    const weak = results.filter((r) => r.grade < 2);
    if (weak.length) {
      body.append(h("h2", { style: "font-size:18px;margin:22px 0 10px" }, `Ôn lại ${weak.length} câu chưa trọn ý`));
      for (const r of weak) {
        const missed = r.q.mustCover.filter((_, i) => !r.covered.includes(i));
        const card = h("div", { class: "card", style: "margin-bottom:12px" },
          h("div", { class: "flex flex-wrap", style: "margin-bottom:8px" },
            levelBadge(r.q.level),
            h("span", { class: "badge" }, GRADES[r.grade].label)),
          h("div", { style: "font-weight:600", html: inlineMd(r.q.question) }));
        if (missed.length) {
          card.append(
            h("div", { class: "explain-box bad", style: "margin-top:10px" },
              h("div", { style: "font-weight:700;margin-bottom:4px" }, "Ý còn thiếu"),
              h("ul", { class: "list-warn" }, missed.map((m) => h("li", { html: inlineMd(m) })))));
        }
        card.append(
          h("div", { class: "chip-row", style: "margin-top:10px" },
            r.q.refs.map((id) => {
              const d = allDocs.find((x) => x.id === id);
              return h("a", { class: "chip", href: `#/docs/${id}` }, d ? docLabel(d) : id);
            })));
        body.append(card);
      }
    }
    window.scrollTo({ top: 0 });
  }

  showQuestion();
}
```

- [ ] **Bước 4: Nối route trong `webapp/js/app.js`**

Thêm import cạnh các import view khác (sau `import * as quiz …`):

```js
import * as interview from "./views/interview.js";
```

Thêm `interview,` vào object `routes`, ngay sau `quiz,`.

- [ ] **Bước 5: Viết 4 câu chủ đề `jpa-mapping`**

Thay `export const jpaInterview = [];` bằng mảng 4 bản ghi theo bảng dưới. Nội dung (`question`, `mustCover`, `model`, `redFlags`, `probes`, và artifact) viết từ chương nguồn đã đọc ở Bước 1 — **không** viết từ trí nhớ về bản tiếng Anh.

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq01` | 1 | 5 | `jpa-05` | Ranh giới **entity** với **value type**: dựa vào đâu để quyết định một khái niệm trong domain model là entity hay value type, và hệ quả của việc chọn sai lên identity và vòng đời | — |
| `jpa-iq02` | 2 | 7 | `jpa-05`, `jpa-03` | Đọc một entity có `@Id` sinh bằng `GenerationType.IDENTITY` và `equals`/`hashCode` viết theo id: chỉ ra vì sao object vỡ khi nằm trong `HashSet` **trước lúc** được lưu, và sửa lại | `code` (lang `java`) — entity với `equals`/`hashCode` dựa trên id |
| `jpa-iq03` | 3 | 10 | `jpa-07` | Chọn chiến lược ánh xạ inheritance cho một cây phân cấp cụ thể, và điều kiện khiến bạn đổi ý | `tradeoffs` — ≥3 phương án: single table, joined, table-per-class (dùng đúng tên bản dịch ch.7 gọi), mỗi phương án một `when` nêu rõ điều kiện chọn |
| `jpa-iq04` | 4 | 12 | `jpa-06`, `jpa-05` | Một converter/embeddable ánh xạ sai kiểu khiến schema sinh ra lệch với dữ liệu đang có trên production: chẩn đoán và đưa ra đường di trú không mất dữ liệu | `incident` — `symptom`, `scale`, `constraints` đều là mệnh đề cụ thể (có số liệu, có ràng buộc thật như "không được downtime") |

Khuôn một bản ghi hoàn chỉnh, dùng làm mẫu cho cả 24 câu:

```js
  {
    id: "jpa-iq03",
    field: "jpa",
    topic: "jpa-mapping",
    level: 3,
    minutes: 10,
    question: "…",
    tradeoffs: [
      { option: "…", when: "…" },
      { option: "…", when: "…" },
      { option: "…", when: "…" },
    ],
    mustCover: ["…", "…", "…"],
    model: "…",
    redFlags: ["…"],
    probes: ["…"],
    refs: ["jpa-07"],
  },
```

Bốn luật viết nội dung, áp cho mọi câu từ đây tới Task 8:

1. **`mustCover` là ý, không phải câu văn.** Mỗi phần tử một mệnh đề kiểm được, đủ ngắn để người dùng tick được sau khi nghe lại chính mình. Không phần tử nào lặp ý phần tử khác (IQ3 bắt trùng nguyên văn, nhưng trùng ý thì chỉ có bạn bắt được).
2. **`redFlags` là câu trả lời sai *phổ biến*, không phải sai ngớ ngẩn** — thứ người đọc lướt hay nói và nghe rất hợp lý. Ví dụ mẫu cho lĩnh vực này: "nói `FetchType.EAGER` chữa được N+1".
3. **`question` không được chứa nguyên văn một ý trong `mustCover`** — IQ7 bắt, và kể cả không bị bắt thì đề lộ rubric là hỏng phép đo.
4. **`model` viết được bằng `inlineMd`** — chỉ `` `code` `` và `**đậm**` được render. Xuống dòng, danh sách, tiêu đề đều **không** render; viết thành đoạn văn liền mạch.

- [ ] **Bước 6: Cập nhật `EXPECTED.counts` trong `webapp/scripts/check-data.mjs`**

Thêm vào khối `counts`, ngay dưới dòng `"roadmap-items:jpa": 52,`:

```js
    // Ngân hàng câu hỏi phỏng vấn JPA — 6 chủ đề × 4 cấp độ, viết dần qua
    // các task. Số này TĂNG DẦN cho tới 24; sửa ở đây TRƯỚC khi viết dữ liệu.
    "interview:jpa": 4,
```

- [ ] **Bước 7: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `57/57 bất biến đạt`. Nếu IQ4 đỏ, đọc kỹ thông báo: gần như luôn là artifact sai cấp (câu L1 lỡ có `code`, hoặc `minutes` ngoài khoảng).

- [ ] **Bước 8: Chạy thật trong trình duyệt**

```bash
./webapp/scripts/dev.sh
```

Mở `http://localhost:8888/#/interview`, đổi lĩnh vực sang **Java Persistence with Spring Data and Hibernate** nếu chưa ở đó. Kiểm đủ sáu điểm:

1. Sidebar nhóm *Luyện tập* có mục 🎤 **Câu hỏi phỏng vấn**, ngay sau Trắc nghiệm.
2. Chip cấp độ và chủ đề hiện đúng số lượng; tắt hết chip cấp độ rồi bấm *Bắt đầu* phải ra toast lỗi, không phải màn trắng.
3. Pha trả lời **không** hiện rubric, đáp án, red flag hay probe. Đồng hồ chạy.
4. Bấm *Xem đáp án mẫu* → rubric tick được, gợi ý chấm đổi theo số ý đã tick.
5. Câu L4 hiện khối 🔥 *Tình huống production* đủ ba dòng; câu L3 hiện bảng đánh đổi; câu L2 hiện code có nút copy.
6. Chấm hết 4 câu → màn tổng kết có bảng theo cấp; chip `refs` nhảy đúng sang tài liệu.

- [ ] **Bước 9: Commit**

```bash
git add webapp/js/views/interview.js webapp/js/app.js webapp/js/data/fields.js \
        webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): module câu hỏi phỏng vấn và 4 câu chủ đề ánh xạ

View hai pha: pha trả lời không hiện bất cứ thứ gì thuộc đáp án, pha đối
chiếu mới lật rubric, đáp án mẫu, red flag và câu đào sâu. Người học tự
tick từng ý mustCover rồi tự chấm ba mức — app chỉ gợi ý theo tỉ lệ đã
tick, không chấm thay.

Bốn câu đầu thuộc chủ đề jpa-mapping, đủ L1-L4: ranh giới entity/value
type, equals-hashCode theo id sinh bởi IDENTITY, chọn chiến lược ánh xạ
inheritance, và di trú khi converter ánh xạ sai kiểu.

Dựng hoàn toàn từ class CSS sẵn có, không đụng style.css. 57/57 xanh."
```

---

## Task 3: Thống kê và tích hợp vỏ ứng dụng

**Files:**
- Modify: `webapp/js/lib/stats.js`
- Modify: `webapp/js/lib/store.js`
- Modify: `webapp/js/views/settings.js`
- Modify: `webapp/js/views/dashboard.js`
- Modify: `webapp/js/lib/guides.js`
- Modify: `webapp/js/data/guides.js`

**Interfaces:**
- Consumes: `getInterviews` (Task 1); khoá `interview.stats` do `views/interview.js` ghi (Task 2, hình dạng `{ seen, last, best, lastAt, covered }`).
- Produces: `interviewStats(fieldId)` trả về
  `{ seen: number, passed: number, total: number, seenPct: number, passPct: number | null, byLevel: Record<1|2|3|4, { seen, passed, total }> }`
  — `passPct` là `null` khi `seen === 0`. Dùng bởi `views/dashboard.js` và `lib/guides.js`.

- [ ] **Bước 1: Thêm `interviewStats` vào `webapp/js/lib/stats.js`**

Sửa dòng import đầu tệp thành:

```js
import { getDocs, getTracks, getFlashcards, getQuestions, getMatrices, getInterviews } from "../data/index.js";
```

Thêm hàm sau `quizStats`:

```js
// Tự chấm, không chấm máy: `last` là trạng thái HIỆN TẠI của một câu (0 chưa
// đạt · 1 một phần · 2 đạt), `best` là kỷ lục. Thống kê lấy `last` vì câu hỏi
// "giờ tôi đứng ở đâu" mới là câu đáng trả lời — một lần đạt hồi tháng trước
// rồi nay trả lời hụt thì không còn là đạt.
export function interviewStats(field) {
  const saved = store.get("interview.stats", {});
  const bank = getInterviews(field);
  const byLevel = { 1: { seen: 0, passed: 0, total: 0 }, 2: { seen: 0, passed: 0, total: 0 },
                    3: { seen: 0, passed: 0, total: 0 }, 4: { seen: 0, passed: 0, total: 0 } };
  let seen = 0, passed = 0;
  for (const q of bank) {
    const lv = byLevel[q.level];
    if (lv) lv.total++;
    const s = saved[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (lv) lv.seen++;
    if (s.last === 2) {
      passed++;
      if (lv) lv.passed++;
    }
  }
  return {
    seen, passed, total: bank.length,
    seenPct: pct(seen, bank.length),
    passPct: seen ? pct(passed, seen) : null,
    byLevel,
  };
}
```

Trong `fieldSummary`, thêm ngay trước dòng `const cr = getMatrices(field)…`:

```js
  const iq = getInterviews(field).length;
  if (iq) parts.push(`${iq} câu phỏng vấn`);
```

và thêm `interviews: iq,` vào object trả về, cạnh `questions: qs,`.

- [ ] **Bước 2: Ghi chú hai khoá mới trong `webapp/js/lib/store.js`**

Thêm vào bảng khoá ở cuối tệp, ngay dưới dòng `// quiz.stats …`:

```js
// interview.stats       : { [qId]: { seen, last, best, lastAt, covered } }
//                         last/best: 0 chưa đạt · 1 đạt một phần · 2 đạt
//                         covered  : chỉ số các ý mustCover đã tick lần gần nhất
// interview.notes       : { [qId]: "ghi chú người dùng tự viết trước khi lật đáp án" }
```

- [ ] **Bước 3: Thêm nhãn vào `KEY_LABELS` trong `webapp/js/views/settings.js`**

Ngay dưới dòng `"quiz.stats": "Thống kê trắc nghiệm",`:

```js
  "interview.stats": "Thống kê phỏng vấn",
  "interview.notes": "Ghi chú phỏng vấn",
```

Không cần đụng gì thêm: luồng xuất/nhập JSON và bảng dung lượng đọc thẳng từ namespace, `KEY_LABELS` chỉ cấp tên hiển thị.

- [ ] **Bước 4: Thêm thẻ vào `webapp/js/views/dashboard.js`**

Sửa dòng import `stats.js` để thêm `interviewStats`. Thêm cạnh các dòng `const qz = quizStats(fieldKey);`:

```js
  const iv = interviewStats(fieldKey);
```

Thêm vào lưới thẻ, **ngay sau** thẻ `quiz`:

```js
    has("interview") ? statCard({ icon: "🎤", num: iv.passPct == null ? "—" : `${iv.passPct}%`,
      label: "Tỉ lệ đạt phỏng vấn", href: "#/interview",
      extra: `${iv.seen}/${iv.total} câu đã tự chấm` }) : null,
```

- [ ] **Bước 5: Thêm nhánh `interview` vào `webapp/js/lib/guides.js`**

Sửa dòng import `stats.js` để thêm `interviewStats`. Thêm nhánh sau `case "quiz": { … }`:

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

- [ ] **Bước 6: Thêm bước `jp-6` vào `fieldGuides.jpa` trong `webapp/js/data/guides.js`**

Nối vào cuối mảng `steps` của `fieldGuides.jpa`:

```js
      { id: "jp-6",
        title: "Tự phỏng vấn: kiểm tra mình đứng ở tầng nào",
        desc: "Trả lời thành lời trước khi lật đáp án mẫu. Đọc hiểu và nói ra được là hai việc khác nhau — chính chỗ này tách người đã hiểu khỏi người mới đọc qua. Bảng tổng kết chia theo bốn cấp cho biết bạn rụng ở tầng nào.",
        href: "#/interview",
        done: { kind: "interview", seenPct: 50, passPct: 70 } },
```

- [ ] **Bước 7: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

Kỳ vọng `57/57`. Nếu G3 đỏ với `done.kind "interview" lạ`, nghĩa là Bước 8 của Task 1 (thêm vào `DONE_KINDS`) bị bỏ sót.

- [ ] **Bước 8: Kiểm trong trình duyệt**

```bash
./webapp/scripts/dev.sh
```

Bốn điểm:

1. Bảng điều khiển lĩnh vực JPA có thẻ 🎤 *Tỉ lệ đạt phỏng vấn* — hiện `—` khi chưa chấm câu nào, hiện phần trăm sau khi chấm.
2. Trang *Hướng dẫn học* của JPA có bước 6 với thanh tiến độ nhích lên sau khi tự chấm vài câu.
3. Bộ chọn lĩnh vực hiện `… · 4 câu phỏng vấn` trong dòng mô tả JPA.
4. Trang *Cài đặt* liệt kê hai khoá mới với dung lượng; xuất JSON rồi nhập lại giữ nguyên tiến độ tự chấm.

- [ ] **Bước 9: Commit**

```bash
git add webapp/js/lib/stats.js webapp/js/lib/store.js webapp/js/lib/guides.js \
        webapp/js/data/guides.js webapp/js/views/settings.js webapp/js/views/dashboard.js
git commit -m "feat(interview): thống kê tự chấm và tích hợp vỏ ứng dụng

interviewStats() lấy `last` chứ không phải `best`: câu hỏi đáng trả lời
là \"giờ tôi đứng ở đâu\", nên một lần đạt hồi trước rồi nay trả lời hụt
thì không còn tính là đạt. byLevel để bảng điều khiển và hướng dẫn học
nói được chuyện quan trọng nhất — rụng ở tầng nào.

Nối vào thẻ bảng điều khiển, bước 6 của hướng dẫn học JPA, dòng mô tả
lĩnh vực, và hai khoá localStorage trong Cài đặt (nên tự động nằm trong
luồng xuất/nhập JSON). 57/57 xanh."
```

---

## Task 4: 4 câu chủ đề `jpa-assoc`

**Files:**
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`"interview:jpa": 8`)

**Interfaces:**
- Consumes: `jpaInterview` từ Task 2; khuôn bản ghi và bốn luật viết nội dung ở Task 2 Bước 5.
- Produces: `jpaInterview` dài 8 phần tử.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/08-anh-xa-collection-va-entity-association.md \
  webapp/content/jpa/09-anh-xa-entity-association-nang-cao.md
```

- [ ] **Bước 2: Nối 4 bản ghi vào cuối `jpaInterview`**

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq05` | 1 | 5 | `jpa-08` | `mappedBy` và phía sở hữu (owning side) của một association hai chiều: ai ghi khoá ngoại, và điều gì xảy ra khi chỉ cập nhật phía nghịch | — |
| `jpa-iq06` | 2 | 8 | `jpa-08` | Đọc một `@OneToMany` hai chiều thiếu hàm tiện ích đồng bộ hai phía: chỉ ra vì sao bản ghi con không được lưu (hoặc khoá ngoại để `null`), và sửa | `code` (lang `java`) — cặp entity cha/con hai chiều |
| `jpa-iq07` | 3 | 9 | `jpa-08`, `jpa-09` | Chọn kiểu collection cho một association: `Set` với `List` có `@OrderColumn`, và `Bag` — kèm điều kiện chọn | `tradeoffs` — ≥3 phương án, dùng đúng tên bản dịch ch.8 gọi |
| `jpa-iq08` | 4 | 12 | `jpa-09`, `jpa-08` | Một association nhiều-nhiều sinh ra bảng nối phình to và thao tác xoá quét toàn bảng trên production: chẩn đoán và thiết kế lại | `incident` — đủ ba trường, `scale` phải có số liệu cụ thể |

Nhắc lại bốn luật viết nội dung ở **Task 2 Bước 5** — đọc lại chúng trước khi viết, đừng viết theo trí nhớ về task trước.

- [ ] **Bước 3: Cập nhật `EXPECTED.counts`**

```js
    "interview:jpa": 8,
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): 4 câu chủ đề collection và association

L1 phía sở hữu và mappedBy · L2 đồng bộ hai phía của quan hệ hai chiều ·
L3 chọn giữa Set, List có @OrderColumn và Bag · L4 bảng nối nhiều-nhiều
phình to trên production. 57/57 xanh."
```

---

## Task 5: 4 câu chủ đề `jpa-lifecycle`

**Files:**
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`"interview:jpa": 12`)

**Interfaces:**
- Consumes: `jpaInterview` dài 8 từ Task 4.
- Produces: `jpaInterview` dài 12 phần tử.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/02-bat-dau-mot-du-an.md \
  webapp/content/jpa/10-quan-ly-du-lieu.md
```

- [ ] **Bước 2: Nối 4 bản ghi vào cuối `jpaInterview`**

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq09` | 1 | 6 | `jpa-10` | Bốn trạng thái vòng đời của một instance (dùng đúng tên bản dịch ch.10 gọi) và những chuyển dịch giữa chúng; vai trò persistence context làm bộ nhớ đệm cấp một và làm phạm vi identity | — |
| `jpa-iq10` | 2 | 7 | `jpa-10` | Đọc một đoạn sửa entity đã `find` rồi **không** gọi `save`: giải thích vì sao dữ liệu vẫn ghi xuống (dirty checking + flush), và khi nào thì không | `code` (lang `java`) — một method có `@Transactional` sửa entity đã nạp |
| `jpa-iq11` | 3 | 9 | `jpa-10`, `jpa-02` | `merge` với `persist` cho một object detached đến từ tầng web: chọn cái nào, và điều kiện đổi ý | `tradeoffs` — ≥2 phương án, `when` nêu rõ trạng thái object và nguồn gốc của nó |
| `jpa-iq12` | 4 | 14 | `jpa-10` | `LazyInitializationException` bùng lên sau khi tách tầng service/controller: chẩn đoán, và vì sao "mở session lâu hơn" là đường cụt | `incident` — `constraints` phải chặn sẵn giải pháp dễ dãi (vd "không được bật OSIV") |

- [ ] **Bước 3: Cập nhật `EXPECTED.counts`**

```js
    "interview:jpa": 12,
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): 4 câu chủ đề persistence context và vòng đời

L1 bốn trạng thái vòng đời và bộ nhớ đệm cấp một · L2 dirty checking khi
không gọi save · L3 merge so với persist cho object detached · L4
LazyInitializationException sau khi tách tầng, với ràng buộc chặn sẵn
đường vòng OSIV. 57/57 xanh."
```

---

## Task 6: 4 câu chủ đề `jpa-tx`

**Files:**
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`"interview:jpa": 16`)

**Interfaces:**
- Consumes: `jpaInterview` dài 12 từ Task 5.
- Produces: `jpaInterview` dài 16 phần tử.

- [ ] **Bước 1: Đọc chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/11-transaction-va-concurrency.md
```

- [ ] **Bước 2: Nối 4 bản ghi vào cuối `jpaInterview`**

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq13` | 1 | 6 | `jpa-11` | Bốn hiện tượng bất thường của transaction và các mức isolation ngăn được chúng, theo đúng cách ch.11 trình bày; vì sao mức mặc định của database thường không đủ cho ghi đồng thời | — |
| `jpa-iq14` | 2 | 8 | `jpa-11` | Đọc một luồng đọc-sửa-ghi không có `@Version`: dựng lại kịch bản lost update theo từng bước, và sửa | `code` (lang `java`) — service đọc entity, tính toán, rồi ghi |
| `jpa-iq15` | 3 | 10 | `jpa-11` | Optimistic locking với pessimistic locking cho một luồng ghi tranh chấp: chọn cái nào, và ngưỡng khiến bạn đổi | `tradeoffs` — ≥2 phương án, `when` gắn với mức tranh chấp và chi phí thử lại |
| `jpa-iq16` | 4 | 15 | `jpa-11` | Connection pool cạn trong giờ cao điểm vì transaction mở quá lâu (gọi HTTP bên ngoài nằm trong `@Transactional`): chẩn đoán và tách lại ranh giới transaction | `incident` — `scale` có số liệu pool và thời gian chờ |

- [ ] **Bước 3: Cập nhật `EXPECTED.counts`**

```js
    "interview:jpa": 16,
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): 4 câu chủ đề transaction và concurrency

L1 hiện tượng bất thường và mức isolation · L2 dựng lại lost update khi
thiếu @Version · L3 optimistic so với pessimistic locking theo mức tranh
chấp · L4 connection pool cạn vì gọi HTTP trong @Transactional. 57/57 xanh."
```

---

## Task 7: 4 câu chủ đề `jpa-fetch`

**Files:**
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`"interview:jpa": 20`)

**Interfaces:**
- Consumes: `jpaInterview` dài 16 từ Task 6.
- Produces: `jpaInterview` dài 20 phần tử.

- [ ] **Bước 1: Đọc ba chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/04-lam-viec-voi-spring-data-jpa.md \
  webapp/content/jpa/12-fetch-plan-strategy-va-profile.md \
  webapp/content/jpa/19-truy-van-jpa-voi-querydsl.md
```

- [ ] **Bước 2: Nối 4 bản ghi vào cuối `jpaInterview`**

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq17` | 1 | 6 | `jpa-12` | Phân biệt **fetch plan** với **fetch strategy** theo đúng cách ch.12 tách hai khái niệm; vì sao `FetchType` trên annotation chỉ là mặc định chứ không phải quyết định cuối | — |
| `jpa-iq18` | 2 | 9 | `jpa-12`, `jpa-04` | Đọc một query method Spring Data lặp N+1 query: đọc SQL log, chỉ ra chỗ nổ, và sửa bằng `@EntityGraph` hoặc `join fetch` | `code` (lang `java`) — repository method kèm vài dòng SQL log minh hoạ |
| `jpa-iq19` | 3 | 10 | `jpa-12`, `jpa-19` | Chọn cách nạp dữ liệu cho một màn hình danh sách: `join fetch`, `@EntityGraph`, batch size, và projection/DTO | `tradeoffs` — ≥3 phương án, `when` gắn với hình dạng dữ liệu (một-nhiều hay nhiều-nhiều, có phân trang hay không) |
| `jpa-iq20` | 4 | 14 | `jpa-12` | `MultipleBagFetchException` khi join fetch hai collection, hoặc phân trang vỡ vì join fetch một-nhiều: chẩn đoán và thiết kế lại đường nạp | `incident` — `constraints` nêu rõ yêu cầu phân trang phải giữ |

- [ ] **Bước 3: Cập nhật `EXPECTED.counts`**

```js
    "interview:jpa": 20,
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Commit**

```bash
git add webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): 4 câu chủ đề fetch plan và truy vấn

L1 tách fetch plan khỏi fetch strategy · L2 đọc SQL log tìm chỗ N+1 nổ ·
L3 chọn giữa join fetch, @EntityGraph, batch size và projection · L4
MultipleBagFetchException và phân trang vỡ vì join fetch một-nhiều.
57/57 xanh."
```

---

## Task 8: 4 câu chủ đề `jpa-spring` — đóng ngân hàng ở 24 câu

**Files:**
- Modify: `webapp/js/data/jpa/interview.js`
- Modify: `webapp/scripts/check-data.mjs` (`"interview:jpa": 24`)

**Interfaces:**
- Consumes: `jpaInterview` dài 20 từ Task 7.
- Produces: `jpaInterview` dài 24 phần tử — ngân hàng hoàn chỉnh.

- [ ] **Bước 1: Đọc hai chương nguồn**

```bash
awk '/^```/{fence=!fence} !fence && /^#{2,3} /{print FILENAME": "$0}' \
  webapp/content/jpa/14-tich-hop-jpa-va-hibernate-voi-spring.md \
  webapp/content/jpa/20-kiem-thu-ung-dung-java-persistence.md
```

- [ ] **Bước 2: Nối 4 bản ghi vào cuối `jpaInterview`**

| id | level | minutes | refs | Nội dung câu hỏi phải kiểm | Artifact bắt buộc |
|---|:--:|:--:|---|---|---|
| `jpa-iq21` | 1 | 5 | `jpa-14` | Spring quản lý `EntityManager` thế nào (proxy theo transaction hiện hành), và vì sao inject thẳng một `EntityManager` vào field singleton vẫn chạy được | — |
| `jpa-iq22` | 2 | 8 | `jpa-20` | Đọc một test tầng persistence dùng `@Transactional` nên tự rollback: chỉ ra vì sao nó **không** phát hiện được lỗi chỉ lộ ra lúc flush, và sửa | `code` (lang `java`) — test class kèm annotation |
| `jpa-iq23` | 3 | 10 | `jpa-20` | Chọn cách kiểm thử tầng persistence: database nhúng trong bộ nhớ, container database thật, hay mock repository | `tradeoffs` — ≥3 phương án, `when` gắn với thứ rủi ro mà test cần bắt |
| `jpa-iq24` | 4 | 12 | `jpa-14`, `jpa-20` | Bộ test xanh trên CI nhưng production vỡ vì khác biệt phương ngữ SQL / schema sinh tự động: chẩn đoán và dựng lại quy trình kiểm chứng schema | `incident` — `symptom` nêu rõ chênh lệch CI với production |

- [ ] **Bước 3: Cập nhật `EXPECTED.counts`**

```js
    "interview:jpa": 24,
```

- [ ] **Bước 4: Chạy kiểm dữ liệu — phải xanh**

```bash
node webapp/scripts/check-data.mjs | tail -3
```

- [ ] **Bước 5: Tự soát phân bố và độ trùng lặp**

```bash
node -e "
import('./webapp/js/data/jpa/interview.js').then(({ jpaInterview: b }) => {
  const byLevel = {}, byTopic = {};
  for (const q of b) {
    byLevel[q.level] = (byLevel[q.level] ?? 0) + 1;
    byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1;
  }
  console.log('tổng:', b.length);
  console.log('theo cấp :', JSON.stringify(byLevel));
  console.log('theo chủ đề:', JSON.stringify(byTopic));
  console.log('phút trung bình mỗi cấp:', JSON.stringify(
    [1,2,3,4].reduce((a,l)=>{const x=b.filter(q=>q.level===l);
      a[l]=+(x.reduce((s,q)=>s+q.minutes,0)/x.length).toFixed(1); return a;},{})));
  const refs = b.flatMap(q => q.refs);
  console.log('chương chưa được câu nào trỏ tới:',
    Array.from({length:20},(_,i)=>'jpa-'+String(i+1).padStart(2,'0'))
      .filter(id => !refs.includes(id)).join(', ') || '(không có)');
});
"
```

Kỳ vọng: tổng 24; mỗi cấp đúng 6; mỗi chủ đề đúng 4; phút trung bình **tăng đơn điệu** từ L1 lên L4. Nếu phút trung bình không tăng đơn điệu, một câu nào đó bị gán sai cấp — IQ4 chỉ chặn được khoảng cho từng câu, không chặn được xu hướng. Danh sách chương chưa được trỏ tới chỉ để tham khảo, không phải lỗi: 24 câu không phủ hết 20 chương và không cần phủ.

- [ ] **Bước 6: Đi hết một phiên "Toàn bộ" trong trình duyệt**

```bash
./webapp/scripts/dev.sh
```

Mở `#/interview`, chọn **Toàn bộ**, đi hết 24 câu. Soát ba thứ mà bất biến không bắt được:

1. **Không hai câu nào hỏi cùng một thứ bằng hai cách nói.** Nếu thấy trùng, sửa một câu thành khía cạnh khác của cùng chương.
2. **Mỗi `redFlags` là một sai lầm nghe hợp lý**, không phải sai ngớ ngẩn không ai mắc.
3. **Bảng đánh đổi ở câu L3 không có phương án rơm** — cả hai (hoặc ba) phương án đều phải là lựa chọn một người có kinh nghiệm thực sự cân nhắc.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/jpa/interview.js webapp/scripts/check-data.mjs
git commit -m "feat(interview): 4 câu chủ đề Spring và kiểm thử — đủ 24 câu

L1 EntityManager proxy theo transaction · L2 test tự rollback bỏ lọt lỗi
lúc flush · L3 database nhúng, container thật hay mock · L4 CI xanh mà
production vỡ vì khác phương ngữ SQL.

Ngân hàng JPA đóng ở 24 câu = 6 chủ đề × 4 cấp, mỗi cấp đúng 6 câu.
57/57 xanh."
```

---

## Task 9: Tài liệu repo và rà soát cuối

**Files:**
- Modify: `webapp/README.md`

**Interfaces:**
- Consumes: toàn bộ tám task trước.
- Produces: không có gì cho task sau — đây là task cuối.

- [ ] **Bước 1: Cập nhật bảng tính năng trong `webapp/README.md`**

Thêm một dòng vào bảng **Tính năng**, ngay dưới dòng `🃏 Flashcards · ✅ Trắc nghiệm`:

```markdown
| 🎤 Câu hỏi phỏng vấn | 24 câu tự luận có đáp án mẫu và rubric, 6 chủ đề × 4 cấp năng lực (L1 Hiểu lý thuyết → L4 Thiết kế & xử lý sự cố) — hiện chỉ lĩnh vực JPA. Hai pha: trả lời rồi mới lật đáp án; tự tick từng ý `mustCover` rồi tự chấm ba mức; tổng kết tách theo cấp để thấy rụng ở tầng nào. Hợp đồng cứng theo cấp do `check-data.mjs` ép: L2 phải có `code`, L3 phải có `tradeoffs`, L4 phải có `incident` |
```

- [ ] **Bước 2: Cập nhật số bất biến và cây thư mục**

Trong mục **Kiểm tra dữ liệu**, đổi `49 bất biến` thành `57 bất biến` và thêm `hợp đồng câu hỏi phỏng vấn theo cấp độ (#IQ)` vào danh sách liệt kê.

Trong cây thư mục mục **Cấu trúc mã**:

- Dòng `│   └── check-data.mjs  # 46 bất biến dữ liệu` → `# 57 bất biến dữ liệu` (con số này đang lệch sẵn từ trước — sửa luôn cho đúng).
- Thêm `interview` vào danh sách view ở dòng `└── js/views/`.
- Trong khối `js/data/<lĩnh vực>/`, thêm dòng ghi chú `jpa: interview`.

Trong dòng cuối README (*"Thêm câu hỏi / flashcard / lab…"*), thêm `câu hỏi phỏng vấn` vào danh sách.

- [ ] **Bước 3: Rà soát toàn bộ thay đổi của đợt**

```bash
git diff --stat b9a5e9e..HEAD
node webapp/scripts/check-data.mjs | tail -3
```

Đối chiếu danh sách tệp với **Bản đồ tệp** ở đầu kế hoạch này. Nếu có tệp nào bị sửa mà không nằm trong bảng — đặc biệt `css/style.css` hay dữ liệu của lĩnh vực khác — kiểm lại vì sao.

- [ ] **Bước 4: Kiểm ba điểm dễ hỏng thầm lặng**

```bash
./webapp/scripts/dev.sh
```

1. **Đổi lĩnh vực khi đang ở `#/interview`.** Từ JPA sang Kubernetes phải rơi về bảng điều khiển, không phải màn trắng hay trang phỏng vấn rỗng.
2. **Xuất rồi nhập JSON ở Cài đặt.** Tự chấm vài câu → xuất → xoá khoá `interview.stats` → nhập lại → tiến độ tự chấm quay về nguyên vẹn.
3. **Màn hình hẹp.** Thu cửa sổ xuống ~400px: bảng đánh đổi cuộn ngang được trong `.table-wrap`, ba nút tự chấm không tràn, khối code có thanh cuộn riêng chứ không đẩy trang.

- [ ] **Bước 5: Commit**

```bash
git add webapp/README.md
git commit -m "docs(webapp): ghi module câu hỏi phỏng vấn vào README

Bảng tính năng, cây thư mục, và số bất biến 49 → 57. Con số trong cây
thư mục đang lệch sẵn từ trước (ghi 46) — sửa luôn cho khớp."
```

---

## Tổng kết đợt

| Hạng mục | Trước | Sau |
|---|:--:|:--:|
| Module trong `NAV_GROUPS` | 11 | 12 |
| Bất biến `check-data.mjs` | 49 | 57 |
| View | 12 | 13 |
| Câu hỏi phỏng vấn | 0 | 24 |
| Lĩnh vực khai module `interview` | 0 | 1 (JPA) |

Mười ba lĩnh vực còn lại mở sau bằng ba bước, **không đụng view**: thêm `js/data/<field>/interview.js`, khai chủ đề trong `INTERVIEW_TOPICS`, thêm `"interview"` vào `FIELDS[<field>].modules` và `"interview:<field>"` vào `EXPECTED.counts`.
