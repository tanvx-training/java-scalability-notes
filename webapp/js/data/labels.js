// Nhãn hiển thị thống nhất cho tài liệu — sinh bằng hàm, không viết tay trong dữ liệu.
//   docLabel(doc)         → "Ch. 5 · Pod" | "Bài 2 · Giải phẫu các Timeout" | "Phụ lục A · …" | title
//   docLabelWithBook(doc) → "KIA · Ch. 5 · Pod"   (ngữ cảnh trộn nhiều sách)
//   docBook(doc)          → { label, short, unit, group }
// Tệp lá: chỉ import fields.js và books.js, để roadmap.js và index.js cùng dùng
// mà không tạo vòng import.

import { FIELDS } from "./fields.js";
import { BOOKS } from "./books.js";
import { related } from "./related.js";

export function docBook(doc) {
  const g = doc.group ? BOOKS[doc.group] : null;
  const f = FIELDS[doc.field];
  return {
    label: doc.group ?? f?.label ?? "",
    short: g ? g.short : (f?.short ?? ""),
    unit: g ? g.unit : (f?.unit ?? "Ch."),
    group: doc.group ?? null,
  };
}

export function chapterLabel(doc) {
  if (doc.chapter == null) return null;
  if (typeof doc.chapter === "string") return `Phụ lục ${doc.chapter}`;
  const unit = docBook(doc).unit ?? "Ch.";
  return `${unit} ${doc.chapter}`;
}

export function docLabel(doc) {
  const c = chapterLabel(doc);
  return c ? `${c} · ${doc.title}` : doc.title;
}

export function docLabelWithBook(doc) {
  const b = docBook(doc);
  return [b.short, chapterLabel(doc), doc.title].filter(Boolean).join(" · ");
}

// Phản chiếu hai chiều bảng related (một chiều trong dữ liệu).
let mirrored = null;
export function relatedOf(docId) {
  if (!mirrored) {
    mirrored = new Map();
    const add = (a, b) => {
      if (!mirrored.has(a)) mirrored.set(a, []);
      if (!mirrored.get(a).includes(b)) mirrored.get(a).push(b);
    };
    for (const [from, tos] of Object.entries(related)) {
      for (const to of tos) { add(from, to); add(to, from); }
    }
  }
  return mirrored.get(docId) ?? [];
}
