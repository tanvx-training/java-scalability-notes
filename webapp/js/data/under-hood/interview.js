// Ngân hàng câu hỏi phỏng vấn Java Under the Hood — 24 câu,
// 6 chủ đề (= 6 chặng của series) × 4 cấp độ năng lực (đúng 6 câu mỗi cấp).
// Phần 1 (uh-iq01–12: uh-found, uh-exec, uh-gc) và phần 2 (uh-iq13–24: uh-conc,
// uh-lang, uh-diag) nằm ở hai tệp riêng; tệp này chỉ ghép lại theo thứ tự id.
// GIỮ NGUYÊN id — tiến độ localStorage lưu theo id.

import { uhInterviewPart1 } from "./interview-part1.js";
import { uhInterviewPart2 } from "./interview-part2.js";

export const underHoodInterview = [...uhInterviewPart1, ...uhInterviewPart2];
