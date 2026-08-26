// Lớp truy cập dữ liệu học tập theo lĩnh vực.
//
// Bản ghi Kubernetes cũ KHÔNG khai `field` — mặc định "kubernetes" ở đây.
// Nhờ vậy 194 bản ghi hiện có không phải sửa và tiến độ localStorage an toàn.

import { DEFAULT_FIELD, isField } from "./fields.js";
import { DOMAINS, TOPICS } from "./meta.js";
import { docs } from "./docs-index.js";
import { tracks } from "./roadmap.js";
import { flashcards } from "./flashcards.js";
import { sysprogFlashcards } from "./sysprog-flashcards.js";
import { questions } from "./questions.js";

export const allDocs = docs;
export const allTracks = tracks;
export const allFlashcards = [...flashcards, ...sysprogFlashcards];
export const allQuestions = questions;

export function fieldOfRecord(rec) {
  const f = rec?.field;
  return isField(f) ? f : DEFAULT_FIELD;
}

const by = (arr) => (fieldId) => arr.filter((r) => fieldOfRecord(r) === fieldId);

export const getDocs = by(allDocs);
export const getTracks = by(allTracks);
export const getFlashcards = by(allFlashcards);
export const getQuestions = by(allQuestions);

export const getDomains = (fieldId) =>
  Object.entries(DOMAINS).filter(([, d]) => d.field === fieldId);

export const getTopics = (fieldId) =>
  Object.entries(TOPICS).filter(([, t]) => t.field === fieldId);

export function fieldOfDoc(docId) {
  const d = allDocs.find((x) => x.id === docId);
  return d ? fieldOfRecord(d) : null;
}

export function fieldOfTrack(trackId) {
  const t = allTracks.find((x) => x.id === trackId);
  return t ? fieldOfRecord(t) : null;
}
