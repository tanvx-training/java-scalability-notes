// Lộ trình học CKAD 8–10 tuần — phát triển từ CKAD/CKAD-Study-Guide.md
// thành giáo trình tương tác: mỗi mục là một bài học chi tiết (markdown),
// mỗi tuần kèm tài nguyên liên quan (labs, quiz, tài liệu).
//
// Nội dung tách thành 3 phần để dễ bảo trì:
//   roadmap-part1.js — Tuần 1–3 (nền tảng, Pods, Workloads)
//   roadmap-part2.js — Tuần 4–5 (Configuration, Observability)
//   roadmap-part3.js — Tuần 6–10 (Networking, Storage/Helm, luyện thi)
//
// LƯU Ý: id của tuần (w1…) và của mục (w1-1…) là khóa lưu tiến độ
// trong localStorage — không được đổi.

import { weeksPart1 } from "./roadmap-part1.js";
import { weeksPart2 } from "./roadmap-part2.js";
import { weeksPart3 } from "./roadmap-part3.js";

export const roadmap = [...weeksPart1, ...weeksPart2, ...weeksPart3];
