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

// ---- Bảng kỳ vọng: sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới ----
const EXPECTED = {
  counts: {},          // vd "flashcards:sysprog": 90
};

// ---- Khung chạy ----
const failures = [];
let checked = 0;

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function check(name, fn) {
  checked++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
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
    return;
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
  const bad = questions.filter((q) =>
    !Array.isArray(q.options) || q.options.length !== 4 ||
    !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 ||
    !q.explanation || !String(q.explanation).trim());
  expect(!bad.length, `sai hình dạng: ${bad.map((q) => q.id).join(", ")}`);
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
console.log(`\n${checked - failures.length}/${checked} bất biến đạt`);
if (failures.length) {
  console.error(`\n${failures.length} lỗi:\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Dữ liệu hợp lệ.");
