import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../../js/lib/practice.js";
import { makeProgram } from "./fixtures/program.mjs";

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
