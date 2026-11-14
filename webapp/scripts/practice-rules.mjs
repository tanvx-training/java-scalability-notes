// Quy tắc dữ liệu của chương trình Thực hành, tách khỏi check-data.mjs để test được.
// Mọi hàm thuần: nhận dữ liệu (và hàm existsFn nếu cần), trả mảng thông báo lỗi tiếng Việt.
import { hasExam, isPublished } from "../js/lib/practice.js";

const nonEmptyStr = (v) => typeof v === "string" && v.trim().length > 0;
const strList = (v, n) => Array.isArray(v) && v.length >= n && v.every(nonEmptyStr);
const isObj = (v) => v != null && typeof v === "object" && !Array.isArray(v);

export const ENV_TOOLS = ["multipass", "local"];
export const TASK_KINDS = ["dissect"];

// Hình dạng các trường cấp chương trình: env.tool, labels, book, rules.
export function programShapeProblems(p) {
  const bad = [];
  const at = p.id;
  const tool = p.env?.tool;
  if (tool !== undefined && !ENV_TOOLS.includes(tool)) bad.push(`${at}: env.tool "${tool}" lạ (${ENV_TOOLS.join(" | ")})`);
  if (p.labels !== undefined) {
    if (!isObj(p.labels)) bad.push(`${at}: labels phải là object`);
    else for (const k of Object.keys(p.labels)) {
      if (!["workBlock", "startStep"].includes(k)) bad.push(`${at}: labels.${k} lạ`);
      else if (!nonEmptyStr(p.labels[k])) bad.push(`${at}: labels.${k} phải là chuỗi không rỗng`);
    }
  }
  if (p.book !== undefined) {
    if (!isObj(p.book) || !nonEmptyStr(p.book.label) || !nonEmptyStr(p.book.docPrefix)) bad.push(`${at}: book cần label + docPrefix`);
  }
  if (p.rules !== undefined) {
    if (!isObj(p.rules)) bad.push(`${at}: rules phải là object`);
    else for (const [k, v] of Object.entries(p.rules)) {
      if (!["diagram", "dissect"].includes(k)) bad.push(`${at}: rules.${k} lạ`);
      else if (typeof v !== "boolean") bad.push(`${at}: rules.${k} phải là true/false`);
    }
  }
  return bad;
}

// Quy tắc nội dung của một buổi (ngoài các quy tắc sẵn có của PR8).
export function sessionContentProblems(p, s) {
  const bad = [];
  const at = `${p.id}/${s.id}`;
  for (const t of s.tasks ?? []) {
    if (t?.kind !== undefined && !TASK_KINDS.includes(t.kind)) bad.push(`${at}: tasks[${t.id}].kind "${t.kind}" lạ`);
  }
  if (s.bookDiff !== undefined) {
    const ok = Array.isArray(s.bookDiff) && s.bookDiff.every((d) => nonEmptyStr(d?.book) && nonEmptyStr(d?.now) && nonEmptyStr(d?.why));
    if (!ok) bad.push(`${at}: bookDiff cần mảng { book, now, why } đều không rỗng`);
  }
  if (!isPublished(s)) return bad;

  const practice = s.exam ?? s.work;
  if (!hasExam(p)) {
    if (!strList(s.work?.patterns, 1)) bad.push(`${at}: work.patterns cần ≥1`);
    if (!(Number.isFinite(s.work?.timeTargetMin) && s.work.timeTargetMin > 0)) bad.push(`${at}: thiếu work.timeTargetMin`);
  } else {
    if (s.domain && !strList(practice?.patterns, 1)) bad.push(`${at}: exam.patterns cần ≥1`);
    if (!(Number.isFinite(s.exam?.timeTargetMin) && s.exam.timeTargetMin > 0)) bad.push(`${at}: thiếu exam.timeTargetMin`);
  }
  if (p.book) {
    const prefix = `#/docs/${p.book.docPrefix}`;
    if (!(s.refs ?? []).some((r) => String(r?.href ?? "").startsWith(prefix))) bad.push(`${at}: refs cần ≥1 link ${prefix}…`);
  }
  if (p.rules?.diagram && !/```mermaid/.test(String(s.mindset ?? ""))) bad.push(`${at}: mindset cần một khối \`\`\`mermaid`);
  if (p.rules?.dissect && !(s.tasks ?? []).some((t) => t?.kind === "dissect")) bad.push(`${at}: cần ≥1 nhiệm vụ kind "dissect"`);
  return bad;
}

// Tệp/thư mục bắt buộc của một buổi đã phát hành trong labs/<p>/sessions/<id>/ theo driver.
// existsFn(tương đối) → boolean. Trả lỗi dạng đường dẫn thiếu.
export function sessionLabProblems(p, id, existsFn) {
  const bad = [];
  const rel = (f) => `labs/${p.id}/sessions/${id}/${f}`;
  const has = (f) => existsFn(rel(f));
  if (p.env?.tool === "local") {
    if (!has("verify.sh")) bad.push(`thiếu ${rel("verify.sh")}`);
    if (!has("solution") && !has("apply.sh")) bad.push(`thiếu ${rel("solution")}/ hoặc ${rel("apply.sh")}`);
  } else {
    for (const f of ["verify.sh", "apply.sh"]) if (!has(f)) bad.push(`thiếu ${rel(f)}`);
  }
  return bad;
}
