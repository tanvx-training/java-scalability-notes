// Danh sách chương trình thực hành (module toàn cục "practice").
//
// Mỗi chương trình nằm trong thư mục riêng (data/practice/<id>/) và được ráp ở
// đây thành một đối tượng Program: meta + sessions (gộp các tệp chặng) +
// skills + mocks. `project.pieces[].sinceSession` suy ra từ `session.pieces`
// để thông tin chỉ khai một nơi.

import { program as ckaMeta } from "./cka/program.js";
import { skills as ckaSkills } from "./cka/skills.js";
import { mocks as ckaMocks } from "./cka/mocks.js";
import { sessions as cka00 } from "./cka/stage-00.js";
import { sessions as cka01 } from "./cka/stage-01.js";
import { sessions as cka02 } from "./cka/stage-02.js";
import { sessions as cka03 } from "./cka/stage-03.js";
import { sessions as cka04 } from "./cka/stage-04.js";
import { sessions as cka05 } from "./cka/stage-05.js";
import { sessions as cka06 } from "./cka/stage-06.js";
import { sessions as cka07 } from "./cka/stage-07.js";
import { sessions as cka08 } from "./cka/stage-08.js";
import { sessions as cka09 } from "./cka/stage-09.js";
import { sessions as cka10 } from "./cka/stage-10.js";
import { program as ssiaMeta } from "./ssia/program.js";
import { skills as ssiaSkills } from "./ssia/skills.js";
import { mocks as ssiaMocks } from "./ssia/mocks.js";
import { sessions as ssia02 } from "./ssia/stage-02.js";
import { sessions as ssia03 } from "./ssia/stage-03.js";
import { sessions as ssia04 } from "./ssia/stage-04.js";
import { sessions as ssia05 } from "./ssia/stage-05.js";
import { sessions as ssia06 } from "./ssia/stage-06.js";
import { sessions as ssia07 } from "./ssia/stage-07.js";
import { sessions as ssia08 } from "./ssia/stage-08.js";
import { sessions as ssia09 } from "./ssia/stage-09.js";
import { sessions as ssia10 } from "./ssia/stage-10.js";
import { sessions as ssia11 } from "./ssia/stage-11.js";
import { sessions as ssia12 } from "./ssia/stage-12.js";
import { sessions as ssia13 } from "./ssia/stage-13.js";
import { sessions as ssia14 } from "./ssia/stage-14.js";
import { sessions as ssia15 } from "./ssia/stage-15.js";
import { sessions as ssia16 } from "./ssia/stage-16.js";
import { sessions as ssia17 } from "./ssia/stage-17.js";
import { sessions as ssia18 } from "./ssia/stage-18.js";

function assemble(meta, stageFiles, skills, mocks) {
  const sessions = stageFiles.flat();
  // project và exam là tuỳ chọn: chương trình theo chủ đề có thể không có đề thi hay project xuyên suốt.
  if (!meta.project) return { ...meta, sessions, skills, mocks };
  const pieces = (meta.project.pieces || []).map((piece) => ({
    ...piece,
    sinceSession: (sessions.find((s) => (s.pieces || []).includes(piece.id)) || {}).id || null,
  }));
  return { ...meta, project: { ...meta.project, pieces }, sessions, skills, mocks };
}

export const PROGRAMS = [
  assemble(ckaMeta,
    [cka00, cka01, cka02, cka03, cka04, cka05, cka06, cka07, cka08, cka09, cka10],
    ckaSkills, ckaMocks),
  assemble(ssiaMeta,
    [ssia02, ssia03, ssia04, ssia05, ssia06, ssia07, ssia08, ssia09, ssia10, ssia11, ssia12, ssia13, ssia14, ssia15, ssia16, ssia17, ssia18],
    ssiaSkills, ssiaMocks),
];

export function getProgram(id) {
  return PROGRAMS.find((p) => p.id === id) || null;
}

export function fieldOfProgram(id) {
  const p = getProgram(id);
  return p ? p.field : null;
}

export function programsOfField(fieldId) {
  return PROGRAMS.filter((p) => p.field === fieldId);
}
