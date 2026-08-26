// webapp/check-data.mjs — kiểm tính toàn vẹn dữ liệu học tập.
//
//   node webapp/check-data.mjs
//
// Chạy webapp/build-content.sh webapp/content trước, nếu muốn kiểm cả bất biến
// #2 (file tài liệu tồn tại trên đĩa). Không có bước này thì #2 được bỏ qua
// kèm cảnh báo, không tính là lỗi.

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

// Các module mà view của chúng đọc dữ liệu Kubernetes cứng (không nhận field
// làm tham số) — chỉ lĩnh vực "kubernetes" được khai những module này.
const K8S_ONLY_MODULES = ["certs", "commands", "exam", "labs"];

// ---- Bảng kỳ vọng: sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới ----
const EXPECTED = {
  counts: {
    "docs:sysprog": 18,
    "roadmap-items:sysprog": 50,
    "flashcards:sysprog": 90,
    "questions:sysprog": 110,
    // Nội dung Kubernetes có từ trước — chốt luôn để xoá/thiếu bản ghi không
    // âm thầm lọt qua (vd xoá bớt câu hỏi vẫn qua đủ 23 bất biến trước đây).
    "docs:kubernetes": 24,
    "roadmap-items:kubernetes": 184,
    "flashcards:kubernetes": 84,
    "questions:kubernetes": 110,
    // Lĩnh vực Java chỉ có tài liệu, không có lộ trình/flashcard/trắc nghiệm.
    "docs:java": 10,
  },
};

// ---- Khung chạy ----
const failures = [];
let checked = 0;
let skipped = 0;
const SKIP = Symbol("skip");

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function check(name, fn) {
  checked++;
  try {
    const result = await fn();
    if (result === SKIP) {
      skipped++;
      console.log(`  – ${name} (bỏ qua)`);
    } else {
      console.log(`  ✓ ${name}`);
    }
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function dupes(ids) {
  const seen = new Set(), dup = new Set();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

// ---- Nạp dữ liệu ----
const { DOMAINS, TOPICS } = await import("./js/data/meta.js");
const { docs } = await import("./js/data/docs-index.js");
const { tracks } = await import("./js/data/roadmap.js");
const { allFlashcards: flashcards, allQuestions: questions } =
  await import("./js/data/index.js");
const { k8sbookCrossref } = await import("./js/data/k8sbook-crossref.js");
const { weeksPart1 } = await import("./js/data/roadmap-part1.js");
const { weeksPart2 } = await import("./js/data/roadmap-part2.js");
const { weeksPart3 } = await import("./js/data/roadmap-part3.js");
const { ckaWeeksPart1 } = await import("./js/data/cka-roadmap-part1.js");
const { ckaWeeksPart2 } = await import("./js/data/cka-roadmap-part2.js");
const { ckaWeeksPart3 } = await import("./js/data/cka-roadmap-part3.js");
const { cksWeeksPart1 } = await import("./js/data/cks-roadmap-part1.js");
const { cksWeeksPart2 } = await import("./js/data/cks-roadmap-part2.js");

// Tuần "thô" — trước khi roadmap.js merge crossref vào resources.
const rawWeeks = new Map(
  [...weeksPart1, ...weeksPart2, ...weeksPart3,
   ...ckaWeeksPart1, ...ckaWeeksPart2, ...ckaWeeksPart3,
   ...cksWeeksPart1, ...cksWeeksPart2].map((w) => [w.id, w]));

const allItems = tracks.flatMap((t) => t.weeks.flatMap((w) => w.items));
const fieldOf = (rec) => rec.field ?? "kubernetes";

console.log("Kiểm tra dữ liệu DevPrep\n");

// #1 — Id duy nhất
await check("Id tài liệu duy nhất", () => {
  const d = dupes(docs.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});
await check("Id mục lộ trình duy nhất (mọi track)", () => {
  const d = dupes(allItems.map((x) => x.id));
  expect(!d.length, `id trùng giữa các track: ${d.join(", ")} — kiểm tiền tố`);
});
await check("Id tuần lộ trình duy nhất (mọi track)", () => {
  const d = dupes(tracks.flatMap((t) => t.weeks.map((w) => w.id)));
  expect(!d.length, `id tuần trùng: ${d.join(", ")}`);
});
await check("Id track duy nhất", () => {
  const d = dupes(tracks.map((t) => t.id));
  expect(!d.length, `id track trùng: ${d.join(", ")}`);
});
await check("Id flashcard duy nhất", () => {
  const d = dupes(flashcards.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});
await check("Id câu hỏi duy nhất", () => {
  const d = dupes(questions.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});

// #2 — File tài liệu tồn tại
const contentBuilt = existsSync(join(DIR, "content"));
await check("Mọi docs[].file tồn tại trên đĩa", () => {
  if (!contentBuilt) {
    console.log("      (bỏ qua — chưa chạy build-content.sh)");
    return SKIP;
  }
  const missing = docs.filter((d) => !existsSync(join(DIR, d.file)));
  expect(!missing.length, `thiếu file: ${missing.map((d) => d.file).join(", ")}`);
});

// #3 — Link nội bộ trỏ tới doc có thật
await check("Mọi link #/docs/<id> trỏ tới tài liệu có thật", () => {
  const ids = new Set(docs.map((d) => d.id));
  const bad = [];
  const scan = (text, where) => {
    for (const m of String(text ?? "").matchAll(/#\/docs\/([A-Za-z0-9_-]+)/g)) {
      if (!ids.has(m[1])) bad.push(`${where} → #/docs/${m[1]}`);
    }
  };
  for (const t of tracks) {
    for (const w of t.weeks) {
      for (const r of w.resources ?? []) scan(r.href, `${w.id} resources`);
      for (const it of w.items) scan(it.lesson, it.id);
    }
  }
  for (const c of flashcards) scan(c.back, `${c.id} back`);
  for (const q of questions) scan(q.explanation, `${q.id} explanation`);
  expect(!bad.length, `link hỏng:\n      ${bad.join("\n      ")}`);
});

// #3b — Link #/docs/<id> trong lộ trình phải cùng lĩnh vực với track đang chứa
// nó. Bất biến #3 chỉ kiểm id có tồn tại, không kiểm nó có "lạc" sang lĩnh
// vực khác — một link như vậy sẽ âm thầm đổi lĩnh vực đang chọn của người
// dùng giữa chừng bài học (xem navigate() trong app.js: #/docs/<id> suy ra
// lĩnh vực từ chính tài liệu đó).
await check("Link #/docs/<id> trong lộ trình khớp lĩnh vực với track", () => {
  const docField = new Map(docs.map((d) => [d.id, fieldOf(d)]));
  const bad = [];
  const scan = (text, where, trackField) => {
    for (const m of String(text ?? "").matchAll(/#\/docs\/([A-Za-z0-9_-]+)/g)) {
      const df = docField.get(m[1]);
      // id không tồn tại đã bị bất biến #3 báo — ở đây chỉ xét id có thật.
      if (df && df !== trackField) {
        bad.push(`${where} → #/docs/${m[1]} (doc field="${df}", track field="${trackField}")`);
      }
    }
  };
  for (const t of tracks) {
    const tf = fieldOf(t);
    for (const w of t.weeks) {
      for (const r of w.resources ?? []) scan(r.href, `${w.id} resources`, tf);
      for (const it of w.items) scan(it.lesson, it.id, tf);
    }
  }
  expect(!bad.length, `link khác lĩnh vực:\n      ${bad.join("\n      ")}`);
});

// N1 — bảng liên kết chéo phải trỏ tới thứ có thật.
// Gõ nhầm id tuần là lỗi IM LẶNG: merge vào một tuần không tồn tại không ném
// lỗi, chip chỉ đơn giản không bao giờ hiện ra.
await check("k8sbookCrossref trỏ tới tuần và tài liệu có thật", () => {
  const docIds = new Set(docs.map((d) => d.id));
  const bad = [];
  for (const [weekId, refs] of Object.entries(k8sbookCrossref)) {
    if (!rawWeeks.has(weekId)) bad.push(`tuần "${weekId}" không tồn tại`);
    if (weekId.startsWith("kb-w")) bad.push(`"${weekId}" là tuần của chính track k8sbook`);
    const dup = dupes(refs);
    if (dup.length) bad.push(`tuần "${weekId}" trùng: ${dup.join(", ")}`);
    for (const id of refs) {
      if (!id.startsWith("k8sbook-")) bad.push(`"${weekId}" → "${id}" không phải chương sách`);
      else if (!docIds.has(id)) bad.push(`"${weekId}" → "${id}" không tồn tại`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

// N2 — merge phải NỐI vào resources, không ghi đè.
//
// Khẳng định định danh đối tượng (raw !== now) đứng trước hai vòng kiểm nội
// dung vì lý do sau: import() trong cùng một tiến trình Node trả về CÙNG MỘT
// module instance cho cùng một đường dẫn, nên `rawWeeks` (nạp trực tiếp từ
// *-roadmap-part*.js) và `tracks` (nạp qua roadmap.js) có thể trỏ tới đúng
// một object tuần. Nếu withBookRefs mutate tại chỗ (`w.resources.push(...);
// return w;`) thay vì trả tuần mới, "tuần thô" bị sửa lây theo — hai vòng
// kiểm nội dung bên dưới khi đó so sánh một object với chính nó và luôn
// xanh, im lặng vô hiệu hoá N2. Đây là bản sao chính xác lớp lỗi mà N1 (tuần
// không tồn tại) và N3 ở Task 3 (bảng kỳ vọng bỏ sót key) được sinh ra để
// chặn: một chỗ hổng khiến bất biến trông như đang chạy nhưng không còn bắt
// được gì.
await check("Merge crossref giữ nguyên resource gốc và thêm đủ chip sách", () => {
  const merged = new Map(
    tracks.flatMap((t) => t.weeks).map((w) => [w.id, w]));
  const bad = [];
  for (const [weekId, refs] of Object.entries(k8sbookCrossref)) {
    const raw = rawWeeks.get(weekId);
    const now = merged.get(weekId);
    if (!raw || !now) continue; // N1 đã báo
    if (raw === now) {
      bad.push(`tuần "${weekId}": withBookRefs trả về chính đối tượng gốc (mutate tại chỗ) — N2 mất hiệu lực`);
      continue;
    }
    for (const r of raw.resources ?? []) {
      if (!(now.resources ?? []).some((x) => x.href === r.href)) {
        bad.push(`tuần "${weekId}" mất resource gốc "${r.href}"`);
      }
    }
    for (const id of refs) {
      if (!(now.resources ?? []).some((x) => x.href === `#/docs/${id}`)) {
        bad.push(`tuần "${weekId}" thiếu chip sách "${id}"`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});

// #4 — Khoá phân loại hợp lệ và khớp lĩnh vực
await check("question.domain hợp lệ và khớp field", () => {
  const bad = questions.filter((q) => {
    const d = DOMAINS[q.domain];
    return !d || (d.field ?? "kubernetes") !== fieldOf(q);
  });
  expect(!bad.length, `sai domain/field: ${bad.map((q) => q.id).join(", ")}`);
});
await check("flashcard.topic hợp lệ và khớp field", () => {
  const bad = flashcards.filter((c) => {
    const t = TOPICS[c.topic];
    return !t || (t.field ?? "kubernetes") !== fieldOf(c);
  });
  expect(!bad.length, `sai topic/field: ${bad.map((c) => c.id).join(", ")}`);
});

// #6 — Hình dạng câu hỏi
await check("Mỗi câu hỏi có 4 lựa chọn, answer hợp lệ, có giải thích", () => {
  const validOptions = (opts) => {
    if (!Array.isArray(opts) || opts.length !== 4) return false;
    const trimmed = opts.map((o) => (typeof o === "string" ? o.trim() : ""));
    if (trimmed.some((o) => !o)) return false;
    return new Set(trimmed).size === 4;
  };
  const bad = questions.filter((q) =>
    !validOptions(q.options) ||
    !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 ||
    !q.explanation || !String(q.explanation).trim());
  expect(!bad.length, `sai hình dạng: ${bad.map((q) => q.id).join(", ")}`);
});

// #6b — độ dài lựa chọn không được tố cáo đáp án.
//
// Chỉ áp cho ngân hàng sysprog: ngân hàng Kubernetes có sẵn từ trước và không
// thuộc phạm vi ràng buộc này. Hai luật:
//   1. Không lựa chọn nào dài quá 1.6 lần lựa chọn dài nhất còn lại.
//   2. Trên toàn bộ ngân hàng, đáp án đúng là lựa chọn dài nhất ở tối đa 45%
//      số câu (ngẫu nhiên thuần tuý là 25%; phần dôi ra dành cho những đáp án
//      thật sự cần thêm mệnh đề bổ nghĩa).
// Sửa bằng cách rút gọn đáp án đúng (chi tiết chuyển vào `explanation`) hoặc
// viết phương án nhiễu thành mệnh đề đầy đủ — đừng độn chữ cho dài ra.
const OPTION_LEN_MAX_RATIO = 1.6;
const OPTION_LEN_KEY_LONGEST_SHARE = 0.45;

await check("Độ dài lựa chọn không tố cáo đáp án (sysprog)", () => {
  const bank = questions.filter((q) => fieldOf(q) === "sysprog");
  if (!bank.length) return SKIP;

  const bad = [];
  let keyLongest = 0;
  for (const q of bank) {
    const len = (q.options ?? []).map((o) => String(o).length);
    if (len.length < 2) continue;
    const desc = [...len].sort((a, b) => b - a);
    const ratio = desc[0] / desc[1];
    if (ratio > OPTION_LEN_MAX_RATIO) {
      bad.push(`${q.id}: ${desc[0]} vs ${desc[1]} ký tự = ${ratio.toFixed(2)}×`);
    }
    // "Dài nhất" chỉ tính khi đáp án dài nhất một cách duy nhất — hoà thì không
    // còn là dấu hiệu nhận biết nữa.
    if (len[q.answer] === desc[0] && len.filter((n) => n === desc[0]).length === 1) {
      keyLongest++;
    }
  }
  if (bad.length) {
    throw new Error(
      `lựa chọn dài quá ${OPTION_LEN_MAX_RATIO}× lựa chọn dài nhì: ${bad.join("; ")}`);
  }

  const cap = Math.floor(bank.length * OPTION_LEN_KEY_LONGEST_SHARE);
  expect(keyLongest <= cap,
    `đáp án đúng là lựa chọn dài nhất ở ${keyLongest}/${bank.length} câu, vượt trần ${cap}`);
});

// #6c — Không lựa chọn nào (kể cả của câu khác) được trùng y nguyên đáp án
// đúng của một câu hỏi khác trong cùng lĩnh vực. Bất biến #6 chỉ soát trùng
// lặp NỘI BỘ một câu; lỗi thực tế từng gặp là một phương án nhiễu của câu A
// chép nguyên văn đáp án đúng của câu B — cả hai xuất hiện cùng một lượt thi,
// dễ gây lộ đáp án chéo. Chỉ áp cho sysprog, cùng lý do với #6b (Kubernetes
// có sẵn từ trước, ngoài phạm vi ràng buộc mới này).
await check("Không lựa chọn nào trùng đáp án đúng của câu khác (sysprog)", () => {
  const bank = questions.filter((q) => fieldOf(q) === "sysprog");
  if (!bank.length) return SKIP;

  const keys = bank
    .map((q) => ({ id: q.id, key: String(q.options?.[q.answer] ?? "").trim() }))
    .filter((k) => k.key);

  const bad = [];
  for (const q of bank) {
    for (const opt of q.options ?? []) {
      const text = String(opt).trim();
      if (!text) continue;
      for (const k of keys) {
        if (k.id === q.id) continue;
        if (text === k.key) bad.push(`${q.id} có lựa chọn trùng đáp án đúng của ${k.id}: "${text}"`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});

// #5 — modules trỏ tới view có thật
const { FIELDS, FIELD_ORDER, DEFAULT_FIELD, navFor, moduleAllowed } =
  await import("./js/data/fields.js");

await check("Mọi module của lĩnh vực là view có thật", () => {
  const views = new Set(
    readdirSync(join(DIR, "js/views")).map((f) => f.replace(/\.js$/, "")));
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    for (const m of f.modules) if (!views.has(m)) bad.push(`${id} → ${m}`);
  }
  expect(!bad.length, `module không có view: ${bad.join(", ")}`);
});

await check("FIELD_ORDER khớp FIELDS 1-1 (không trùng, không thiếu) và chứa DEFAULT_FIELD", () => {
  const bad = [];
  const dup = dupes(FIELD_ORDER);
  if (dup.length) bad.push(`FIELD_ORDER trùng: ${dup.join(", ")}`);
  for (const id of FIELD_ORDER) if (!FIELDS[id]) bad.push(`FIELD_ORDER có "${id}" không tồn tại trong FIELDS`);
  const orderSet = new Set(FIELD_ORDER);
  const missing = Object.keys(FIELDS).filter((id) => !orderSet.has(id));
  if (missing.length) bad.push(`FIELD_ORDER thiếu: ${missing.join(", ")}`);
  expect(!bad.length, bad.join("; "));
  expect(FIELDS[DEFAULT_FIELD], `DEFAULT_FIELD "${DEFAULT_FIELD}" không tồn tại`);
});

// #7 — khai module nào thì phải có dữ liệu cho module đó
await check("Lĩnh vực khai quiz/flashcards/roadmap/docs thì phải có dữ liệu", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    const has = {
      docs: docs.some((d) => fieldOf(d) === id),
      roadmap: tracks.some((t) => fieldOf(t) === id),
      flashcards: flashcards.some((c) => fieldOf(c) === id),
      quiz: questions.some((q) => fieldOf(q) === id),
    };
    for (const m of f.modules) if (m in has && !has[m]) bad.push(`${id} khai "${m}" nhưng không có dữ liệu`);
  }
  expect(!bad.length, bad.join("; "));
});

// #7b — module chỉ có dữ liệu Kubernetes không được khai ở lĩnh vực khác
await check("Module chỉ dành cho Kubernetes không bị lĩnh vực khác khai", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    if (id === "kubernetes") continue;
    for (const m of f.modules) {
      if (K8S_ONLY_MODULES.includes(m)) bad.push(`${id} khai "${m}" (chỉ dành riêng cho kubernetes)`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

await check("navFor() lọc đúng và bỏ nhóm rỗng", () => {
  for (const id of FIELD_ORDER) {
    const groups = navFor(id);
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    const mods = FIELDS[id].modules;
    expect(ids.length === mods.length,
      `navFor("${id}") trả ${ids.length} mục, modules có ${mods.length}`);
    for (const m of mods) expect(ids.includes(m), `navFor("${id}") thiếu "${m}"`);
    for (const g of groups) expect(g.items.length > 0, `navFor("${id}") còn nhóm rỗng "${g.title}"`);
  }
  expect(moduleAllowed("java", "docs") === true, 'moduleAllowed("java","docs") phải là true');
  expect(moduleAllowed("java", "labs") === false, 'moduleAllowed("java","labs") phải là false');
  expect(moduleAllowed("khong-ton-tai", "docs") === false, "lĩnh vực lạ phải trả false");
});

await check("Mọi DOMAINS/TOPICS khai field hợp lệ", () => {
  const bad = [];
  for (const [k, d] of Object.entries(DOMAINS))
    if (!d.field) bad.push(`DOMAINS.${k} thiếu field`);
    else if (!FIELDS[d.field]) bad.push(`DOMAINS.${k}.field="${d.field}" không tồn tại`);
  for (const [k, t] of Object.entries(TOPICS))
    if (!t.field) bad.push(`TOPICS.${k} thiếu field`);
    else if (!FIELDS[t.field]) bad.push(`TOPICS.${k}.field="${t.field}" không tồn tại`);
  expect(!bad.length, bad.join("; "));
});

await check("field khai rõ (nếu có) phải là lĩnh vực tồn tại", () => {
  const bad = [];
  const scan = (arr, label) => {
    for (const r of arr) {
      if (r.field !== undefined && r.field !== null && !FIELDS[r.field]) {
        bad.push(`${label} ${r.id} field="${r.field}" không tồn tại`);
      }
    }
  };
  scan(docs, "doc");
  scan(tracks, "track");
  scan(flashcards, "flashcard");
  scan(questions, "question");
  expect(!bad.length, bad.join("; "));
});

await check("Accessor lọc đúng theo lĩnh vực", async () => {
  const api = await import("./js/data/index.js");
  const sources = [
    ["getDocs", api.getDocs, api.allDocs],
    ["getTracks", api.getTracks, api.allTracks],
    ["getFlashcards", api.getFlashcards, api.allFlashcards],
    ["getQuestions", api.getQuestions, api.allQuestions],
  ];
  for (const [name, getX, allX] of sources) {
    const seenAt = new Map(); // id -> lĩnh vực đầu tiên bản ghi xuất hiện
    let count = 0;
    for (const f of FIELD_ORDER) {
      for (const r of getX(f)) {
        expect(api.fieldOfRecord(r) === f,
          `${name}("${f}") trả bản ghi ${r.id} nhưng fieldOfRecord(nó)="${api.fieldOfRecord(r)}"`);
        expect(!seenAt.has(r.id),
          `${name}: bản ghi ${r.id} xuất hiện ở cả "${seenAt.get(r.id)}" và "${f}"`);
        seenAt.set(r.id, f);
        count++;
      }
    }
    expect(count === allX.length,
      `${name}: tổng theo lĩnh vực (${count}) lệch tổng thật (${allX.length}) — bản ghi bị bỏ sót hoặc trùng`);
  }
  expect(api.fieldOfRecord({}) === "kubernetes", "bản ghi không có field phải mặc định kubernetes");
  expect(api.fieldOfDoc("java-01") === "java", "fieldOfDoc('java-01') phải là java");
  expect(api.fieldOfTrack("ckad") === "kubernetes", "fieldOfTrack('ckad') phải là kubernetes");
  expect(api.fieldOfDoc("khong-ton-tai") === null, "doc id lạ phải trả null");
});

await check("Flashcard sysprog phân bổ đúng theo chủ đề", () => {
  const want = { "sp-c": 18, "sp-process": 12, "sp-concurrency": 20,
                 "sp-deadlock": 10, "sp-memory-ipc": 12, "sp-io": 12, "sp-security": 6 };
  const got = {};
  for (const c of flashcards.filter((x) => fieldOf(x) === "sysprog"))
    got[c.topic] = (got[c.topic] ?? 0) + 1;
  const bad = Object.entries(want)
    .filter(([k, v]) => (got[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${got[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});

await check("Câu hỏi sysprog phân bổ đúng theo domain", () => {
  const want = { "sp-c": 22, "sp-process": 14, "sp-concurrency": 24,
                 "sp-deadlock": 12, "sp-memory-ipc": 14, "sp-io": 16, "sp-security": 8 };
  const got = {};
  for (const q of questions.filter((x) => fieldOf(x) === "sysprog"))
    got[q.domain] = (got[q.domain] ?? 0) + 1;
  const bad = Object.entries(want)
    .filter(([k, v]) => (got[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${got[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});

// N3 — bảng kỳ vọng phải phủ mọi lĩnh vực khai docs/roadmap.
// Vòng kiểm đếm bên dưới chỉ so những key CÓ MẶT trong EXPECTED, nên một lĩnh
// vực mới quên khai key sẽ trôi tự do: xoá sạch dữ liệu của nó vẫn xanh.
await check("EXPECTED.counts phủ mọi lĩnh vực khai docs/roadmap", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    if (f.modules.includes("docs") && !(`docs:${id}` in EXPECTED.counts)) {
      bad.push(`thiếu "docs:${id}"`);
    }
    if (f.modules.includes("roadmap") && !(`roadmap-items:${id}` in EXPECTED.counts)) {
      bad.push(`thiếu "roadmap-items:${id}"`);
    }
  }
  expect(!bad.length, `${bad.join("; ")} trong EXPECTED.counts`);
});

// Bảng kỳ vọng
await check("Số lượng bản ghi khớp bảng kỳ vọng", () => {
  const actual = {};
  for (const f of new Set([...docs, ...flashcards, ...questions].map(fieldOf))) {
    actual[`docs:${f}`] = docs.filter((d) => fieldOf(d) === f).length;
    actual[`flashcards:${f}`] = flashcards.filter((c) => fieldOf(c) === f).length;
    actual[`questions:${f}`] = questions.filter((q) => fieldOf(q) === f).length;
  }
  for (const t of tracks) {
    const f = fieldOf(t);
    actual[`roadmap-items:${f}`] =
      (actual[`roadmap-items:${f}`] ?? 0) + t.weeks.flatMap((w) => w.items).length;
  }
  const bad = Object.entries(EXPECTED.counts)
    .filter(([k, v]) => (actual[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${actual[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});

// ---- Kết luận ----
const passed = checked - failures.length - skipped;
const skipNote = skipped ? `, ${skipped} bỏ qua (chưa chạy build-content.sh)` : "";
console.log(`\n${passed}/${checked} bất biến đạt${skipNote}`);
if (failures.length) {
  console.error(`\n${failures.length} lỗi:\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Dữ liệu hợp lệ.");
