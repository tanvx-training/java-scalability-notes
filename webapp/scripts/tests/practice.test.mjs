import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../../js/lib/practice.js";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { makeProgram, makeTopicProgram, makeBookProgram } from "./fixtures/program.mjs";

const p = makeProgram();
const ids = (a) => a.map((s) => s.id);

test("keys and reserved segments", () => {
  assert.deepEqual(P.RESERVED_SEGMENTS, ["skills", "project", "mock"]);
  assert.equal(P.sessionKey("tst", "s14"), "tst:s14");
  assert.equal(P.taskKey("tst", "s14", "t1"), "tst:s14:t1");
});

test("orderedSessions / find / neighbors", () => {
  assert.deepEqual(ids(P.orderedSessions(p)), ["x1", "x2", "x3", "x4"]);
  assert.equal(P.findSession(p, "s99"), null);
  assert.equal(P.findSession(p, "x2").id, "x2");
  assert.equal(P.findMock(p, "m9"), null);
  assert.equal(P.findMock(p, "m1").id, "m1");
  assert.equal(P.neighbors(p, "x1").prev, null);
  assert.equal(P.neighbors(p, "x1").next.id, "x2");
  assert.deepEqual(P.neighbors(p, "zz"), { prev: null, next: null });
});

test("isDone / doneCount", () => {
  assert.equal(P.isPublished(p.sessions[0]), true);
  assert.equal(P.isPublished(p.sessions[3]), false);
  assert.equal(P.isDone(p, "x1", { "tst:x1": 1 }), true);
  assert.equal(P.isDone(p, "x4", { "tst:x4": 1 }), false);
  assert.equal(P.isDone(p, "zz", { "tst:zz": 1 }), false);
  assert.equal(P.doneCount(p, { "tst:x1": 1, "tst:zz": 1, "tst:x4": 1, "other:x2": 1 }), 1);
});

test("nextSession", () => {
  const k = (...xs) => Object.fromEntries(xs.map((x) => ["tst:" + x, 1]));
  assert.equal(P.nextSession(p, {}).id, "x1");
  assert.equal(P.nextSession(p, k("x1")).id, "x2");
  assert.equal(P.nextSession(p, k("x1", "x2", "x3")).id, "x4");
  const q = makeProgram();
  q.sessions = q.sessions.filter((s) => s.id !== "x4");
  q.stages[1].sessions = ["x3"];
  assert.equal(P.nextSession(q, k("x1", "x2", "x3")), null);
});

test("missingRequires", () => {
  assert.deepEqual(P.missingRequires(p, "x3", { "tst:x1": 1 }), ["x2"]);
  assert.deepEqual(P.missingRequires(p, "x3", { "tst:x1": 1, "tst:x2": 1 }), []);
  assert.deepEqual(P.missingRequires(p, "zz", {}), []);
});

test("stageProgress / domainCoverage / weeksLeft", () => {
  const sp = P.stageProgress(p, { "tst:x1": 1 });
  assert.deepEqual(sp.map((r) => [r.stage.id, r.done, r.total]), [["st0", 1, 2], ["st1", 0, 2]]);
  const dc = P.domainCoverage(p, { "tst:x2": 1 });
  assert.deepEqual(dc.map((r) => [r.domain.id, r.done, r.total]), [["a", 1, 2], ["b", 0, 1]]);
  assert.equal(P.weeksLeft(p, {}), 2);
  assert.equal(P.weeksLeft(p, {}, 4), 1);
});

test("projectPieces", () => {
  const r = P.projectPieces(p, { "tst:x1": 1 });
  assert.equal(r.find((x) => x.piece.id === "p1").have, true);
  assert.equal(r.find((x) => x.piece.id === "p2").have, false);
});

test("skillIndex", () => {
  const r = P.skillIndex(p, p.skills);
  assert.equal(r[0].skill.id, "k-one");
  assert.equal(r[0].learnedIn, "x2");
  assert.deepEqual(r[0].usedIn, ["x3"]);
  assert.equal(r[2].learnedIn, null);
  assert.deepEqual(r[2].usedIn, []);
});

test("reviewFor", () => {
  assert.equal(P.reviewFor(p, "x1"), null);
  const r = P.reviewFor(p, "x2");
  assert.equal(r.session.id, "x1");
  assert.equal(r.review.length, 1);
  assert.equal(P.reviewFor(p, "x3"), null);
});

const rec = { program: "tst", mock: "m1", date: "2026-11-13", total: 70,
  byDomain: { a: { got: 40, max: 60 }, b: { got: 30, max: 40 } } };

test("mock line round trip", () => {
  const line = P.formatMockLine(rec);
  assert.equal(line, "devprep-mock:v1:tst:m1:2026-11-13:a=40/60,b=30/40");
  const r = P.parseMockResult(line, p);
  assert.equal(r.ok, true);
  assert.deepEqual(r.record, rec);
  assert.equal(P.parseMockResult("  " + line + "\n", p).ok, true);
});

test("mock line rejections", () => {
  const bad = [
    "", "abc",
    "devprep-mock:v2:tst:m1:2026-11-13:a=40/60,b=30/40",
    "devprep-mock:v1:cka:m1:2026-11-13:a=40/60,b=30/40",
    "devprep-mock:v1:tst:m9:2026-11-13:a=40/60,b=30/40",
    "devprep-mock:v1:tst:m1:2026-13-40:a=40/60,b=30/40",
    "devprep-mock:v1:tst:m1:2026-11-13:a=40/60,zz=30/40",
    "devprep-mock:v1:tst:m1:2026-11-13:a=40/60",
    "devprep-mock:v1:tst:m1:2026-11-13:a=70/60,b=30/40",
    "devprep-mock:v1:tst:m1:2026-11-13:a=-1/60,b=30/40",
    "devprep-mock:v1:tst:m1:2026-11-13:a=40/60,a=40/60,b=30/40",
  ];
  for (const line of bad) {
    const r = P.parseMockResult(line, p);
    assert.equal(r.ok, false, line);
    assert.ok(r.error, line);
  }
});

// localStorage giả trong bộ nhớ; `seed` là các giá trị THÔ (đã là chuỗi JSON) theo khoá không namespace.
function withStorage(seed, fn) {
  const mem = new Map(Object.entries(seed).map(([k, v]) => ["kubeprep." + k, v]));
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
  try {
    return fn((k) => JSON.parse(mem.get("kubeprep." + k)));
  } finally {
    delete globalThis.localStorage;
  }
}

test("addMockResult: the same line pasted twice is stored once; a different score the same day is kept", () => {
  withStorage({}, (read) => {
    const line = "devprep-mock:v1:tst:m1:2026-11-13:a=40/60,b=30/40";
    const added = [0, 1].map(() => P.addMockResult(P.parseMockResult(line, p).record));
    assert.deepEqual(added, [true, false]);
    assert.equal(P.practiceState().mock.length, 1);
    assert.equal(P.practiceState().mock[0].total, 70);
    assert.equal(P.addMockResult(P.parseMockResult("devprep-mock:v1:tst:m1:2026-11-13:a=50/60,b=30/40", p).record), true);
    assert.equal(read("practice.mock").length, 2);
  });
});

test("practiceState: wrong-shaped stored values never crash and come back in the right shape", () => {
  const empty = { done: {}, tasks: {}, notes: {}, mock: [] };
  for (const raw of ["null", "[]", '"chuỗi"', "42", "true", "{}"]) {
    const seed = { "practice.done": raw, "practice.tasks": raw, "practice.notes": raw, "practice.mock": raw };
    withStorage(seed, () => assert.deepEqual(P.practiceState(), empty, raw));
  }
  // Giá trị lồng sai kiểu: ghi chú không phải chuỗi, bản ghi mock thiếu hay sai byDomain bị bỏ.
  const good = { program: "tst", mock: "m1", date: "2026-11-13", total: 70, byDomain: { a: { got: 1, max: 2 } } };
  const seed = {
    "practice.done": JSON.stringify({ "tst:x1": 1 }),
    "practice.notes": JSON.stringify({ "tst:x1": "ghi chú", "tst:x2": { x: 1 }, "tst:x3": null }),
    "practice.mock": JSON.stringify([good, null, "x", 3, [], { ...good, byDomain: null }, { ...good, byDomain: [] },
      { ...good, byDomain: { a: "40/60" } }, { ...good, byDomain: { a: { got: "1", max: 2 } } }, { ...good, total: "70" },
      { ...good, date: 20261113 }]),
  };
  withStorage(seed, () => {
    const st = P.practiceState();
    assert.deepEqual(st.done, { "tst:x1": 1 });
    assert.deepEqual(st.notes, { "tst:x1": "ghi chú" });
    assert.deepEqual(st.mock, [good]);
    assert.equal(P.isDone(p, "x1", st.done), true);
  });
  assert.deepEqual(P.normalizeState(null), empty);
  assert.deepEqual(P.normalizeState([1, 2]), empty);
});

test("store wrappers write the right shape, starting from empty or wrong-shaped storage", () => {
  for (const raw of [undefined, "null", "[1,2]", '"x"', "7"]) {
    const seed = raw === undefined ? {} : { "practice.done": raw, "practice.tasks": raw, "practice.notes": raw, "practice.mock": raw };
    withStorage(seed, (read) => {
      P.setDone("tst", "x1", true);
      assert.equal(typeof read("practice.done")["tst:x1"], "number");
      P.setDone("tst", "x1", false);
      assert.deepEqual(read("practice.done"), {});
      P.setTask("tst", "x1", "t1", true);
      assert.deepEqual(read("practice.tasks"), { "tst:x1:t1": true });
      P.setTask("tst", "x1", "t1", false);
      assert.deepEqual(read("practice.tasks"), {});
      P.setNote("tst", "x1", "nhớ lệnh");
      assert.deepEqual(read("practice.notes"), { "tst:x1": "nhớ lệnh" });
      P.setNote("tst", "x1", "");
      assert.deepEqual(read("practice.notes"), {});
      const rec = P.parseMockResult("devprep-mock:v1:tst:m1:2026-11-13:a=40/60,b=30/40", p).record;
      assert.equal(P.addMockResult(rec), true);
      assert.deepEqual(read("practice.mock"), [rec]);
    });
  }
});

test("programme without exam: pure functions work and report no exam", () => {
  const t = makeTopicProgram();
  const done = { "topic:y1": 1 };
  assert.equal(P.hasExam(p), true);
  assert.equal(P.hasExam(t), false);
  assert.equal(P.hasExam({ ...t, exam: {} }), false);
  assert.equal(P.hasExam({ ...t, exam: { domains: [] } }), false);
  assert.deepEqual(P.domainCoverage(t, done), []);
  assert.deepEqual(ids(P.orderedSessions(t)), ["y1", "y2"]);
  assert.equal(P.doneCount(t, done), 1);
  assert.equal(P.nextSession(t, done).id, "y2");
  assert.deepEqual(P.stageProgress(t, done).map((r) => [r.stage.id, r.done, r.total]), [["st0", 1, 2]]);
  assert.deepEqual(P.projectPieces(t, done), []);
  assert.equal(P.weeksLeft(t, done), 1);
  assert.equal(P.reviewFor(t, "y2").session.id, "y1");
  const si = P.skillIndex(t, t.skills);
  assert.deepEqual([si[0].learnedIn, si[0].usedIn], ["y1", ["y2"]]);
  const r = P.parseMockResult("devprep-mock:v1:topic:m1:2026-11-13:a=1/2", t);
  assert.equal(r.ok, false);
  assert.match(r.error, /không có đề thi/);
});

test("skillAreaLabel comes from programme data; unknown area shows its id", () => {
  const t = makeTopicProgram();
  assert.equal(P.skillAreaLabel(t, "jvm"), "JVM");
  assert.equal(P.skillAreaLabel(t, "linux"), "linux");
  assert.equal(P.skillAreaLabel(p, "kubernetes"), "kubernetes");
  assert.equal(P.skillAreaLabel({ skillAreas: [null, { id: "x" }] }, "x"), "x");
});

test("weeksLeft with a non-positive pace is null, not Infinity", () => {
  assert.equal(P.weeksLeft(p, {}, 0), null);
  assert.equal(P.weeksLeft(p, {}, -1), null);
});

test("findMock with unknown id is null", () => {
  assert.equal(P.findMock(p, "m9"), null);
  assert.equal(P.findMock({ id: "x" }, "m1"), null);
});

test("lab mock score output round-trips through parseMockResult", () => {
  const labs = fileURLToPath(new URL("../../../labs/", import.meta.url));
  const env = {
    ...process.env,
    LAB_ROOT: `${labs}tests/fixtures`,
    PATH: `${labs}tests/stubs:${process.env.PATH}`,
    MP_LIST: 'tst-a,Running,10.0.0.1,,x,""\ntst-b,Running,10.0.0.2,,x,""',
  };
  delete env.MP_LOG;
  const out = execFileSync("/bin/bash", [`${labs}lab`, "mock", "tst", "m1", "score"], { env, encoding: "utf8" });
  const last = out.trim().split("\n").pop();
  assert.match(last, /^devprep-mock:v1:tst:m1:\d{4}-\d{2}-\d{2}:a=3\/6,b=2\/4$/);
  const r = P.parseMockResult(last, p);
  assert.equal(r.ok, true);
  assert.deepEqual(r.record.byDomain, { a: { got: 3, max: 6 }, b: { got: 2, max: 4 } });
  assert.equal(r.record.total, 50);
});

// ---- Chương trình theo sách, chạy cục bộ ----
import { programShapeProblems, sessionContentProblems, sessionLabProblems } from "../practice-rules.mjs";

test("practiceData reads exam first, then work, else empty", () => {
  const b = makeBookProgram();
  assert.deepEqual(P.practiceData(b.sessions[0]), b.sessions[0].work);
  assert.deepEqual(P.practiceData(p.sessions[0]), {});
  assert.deepEqual(P.practiceData({ exam: { patterns: ["a"] }, work: { patterns: ["b"] } }), { patterns: ["a"] });
  assert.deepEqual(P.practiceData(null), {});
});

test("labels fall back to the existing wording; programme labels win", () => {
  const b = makeBookProgram();
  assert.equal(P.workBlockTitle(b), "🧩 Trong công việc");
  assert.equal(P.startStepTitle(b), "Chuẩn bị workspace");
  assert.equal(P.workBlockTitle(makeTopicProgram()), "🏋️ Luyện tập");
  assert.equal(P.startStepTitle(p), "Khởi động lab");
  assert.equal(P.startStepTitle({ labels: { startStep: "  " } }), "Khởi động lab");
});

test("bookDiffRows and isDissect: only well-formed data, old programmes get nothing", () => {
  const b = makeBookProgram();
  assert.deepEqual(P.bookDiffRows(b.sessions[0]), b.sessions[0].bookDiff);
  assert.deepEqual(P.bookDiffRows(p.sessions[0]), []);
  assert.deepEqual(P.bookDiffRows({ bookDiff: "x" }), []);
  assert.equal(P.isDissect(b.sessions[0].tasks[1]), true);
  assert.equal(P.isDissect(b.sessions[0].tasks[0]), false);
  assert.equal(P.isDissect(null), false);
});

test("practice block applies to a book programme through work and not to an empty one", () => {
  const b = makeBookProgram();
  assert.equal(P.hasPracticeBlock(b, b.sessions[0]), true);
  assert.equal(P.hasPracticeBlock(b, b.sessions[1]), false);
  assert.equal(P.hasPracticeBlock(p, p.sessions[0]), true); // chương trình có đề thi luôn hiện khối
});

test("rules: the book programme fixture is valid; each rule has a negative case", () => {
  const b = makeBookProgram();
  const s = b.sessions[0];
  assert.deepEqual(programShapeProblems(b), []);
  assert.deepEqual(sessionContentProblems(b, s), []);
  assert.deepEqual(sessionContentProblems(b, b.sessions[1]), []); // buổi khung không bị đòi nội dung
  const bad = (mut) => sessionContentProblems(b, { ...s, ...mut });
  assert.match(bad({ work: undefined }).join(), /work\.patterns/);
  assert.match(bad({ work: { patterns: ["x"] } }).join(), /work\.timeTargetMin/);
  assert.match(bad({ refs: [{ label: "a", href: "#/docs/other-01" }] }).join(), /bookx-/);
  assert.match(bad({ mindset: "không có sơ đồ" }).join(), /mermaid/);
  assert.match(bad({ tasks: s.tasks.map((t) => ({ ...t, kind: undefined })) }).join(), /dissect/);
  assert.match(bad({ tasks: [{ id: "t", text: "x", kind: "lạ" }] }).join(), /kind "lạ"/);
  assert.match(bad({ bookDiff: [{ book: "a", now: "b" }] }).join(), /bookDiff/);
  // Không bật rules thì không đòi sơ đồ/dissect/link sách.
  const plain = { ...b, rules: undefined, book: undefined };
  assert.deepEqual(sessionContentProblems(plain, { ...s, mindset: "x", refs: [], tasks: [] }), []);
  assert.match(programShapeProblems({ ...b, env: { tool: "vagrant" } }).join(), /env\.tool/);
  assert.match(programShapeProblems({ ...b, book: { label: "x" } }).join(), /book/);
  assert.match(programShapeProblems({ ...b, rules: { diagram: "yes" } }).join(), /rules\.diagram/);
  assert.match(programShapeProblems({ ...b, labels: { startStep: "" } }).join(), /labels\.startStep/);
});

test("rules: programmes with an exam keep the old requirements", () => {
  const s = { ...p.sessions[1], status: "published", mindset: "m", refs: [{ label: "a", href: "#/x" }] };
  assert.match(sessionContentProblems(p, s).join(), /exam\.patterns/);
  assert.match(sessionContentProblems(p, { ...s, exam: { patterns: ["a"] } }).join(), /exam\.timeTargetMin/);
  assert.deepEqual(sessionContentProblems(p, { ...s, exam: { patterns: ["a"], timeTargetMin: 5 } }), []);
});

test("lab directory rules by driver", () => {
  const b = makeBookProgram();
  const files = (...f) => (rel) => f.includes(rel);
  const base = "labs/bk/sessions/w1/";
  assert.deepEqual(sessionLabProblems(b, "w1", files(base + "verify.sh", base + "solution")), []);
  assert.deepEqual(sessionLabProblems(b, "w1", files(base + "verify.sh", base + "apply.sh")), []);
  assert.equal(sessionLabProblems(b, "w1", files(base + "verify.sh")).length, 1);
  assert.equal(sessionLabProblems(b, "w1", files(base + "solution")).length, 1);
  // multipass (mặc định): cả verify.sh lẫn apply.sh.
  const t = { id: "bk", env: { tool: "multipass" } };
  assert.equal(sessionLabProblems(t, "w1", files("labs/bk/sessions/w1/verify.sh", "labs/bk/sessions/w1/solution")).length, 1);
  assert.equal(sessionLabProblems({ id: "bk" }, "w1", () => false).length, 2);
});
