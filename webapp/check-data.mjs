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
  counts: {},          // vd "flashcards:sysprog": 90
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
const { flashcards } = await import("./js/data/flashcards.js");
const { questions } = await import("./js/data/questions.js");

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

await check("Accessor lọc đúng theo lĩnh vực", async () => {
  const api = await import("./js/data/index.js");
  const total = api.allQuestions.length;
  const sum = FIELD_ORDER.reduce((n, f) => n + api.getQuestions(f).length, 0);
  expect(sum === total, `tổng theo lĩnh vực (${sum}) lệch tổng thật (${total})`);
  expect(api.getDocs("java").every((d) => d.field === "java"), "getDocs('java') lẫn lĩnh vực khác");
  expect(api.fieldOfRecord({}) === "kubernetes", "bản ghi không có field phải mặc định kubernetes");
  expect(api.fieldOfDoc("java-01") === "java", "fieldOfDoc('java-01') phải là java");
  expect(api.fieldOfTrack("ckad") === "kubernetes", "fieldOfTrack('ckad') phải là kubernetes");
  expect(api.fieldOfDoc("khong-ton-tai") === null, "doc id lạ phải trả null");
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
