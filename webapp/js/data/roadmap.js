// Lộ trình học 3 chứng chỉ — mỗi track là một giáo trình tương tác:
// mỗi mục là một bài học chi tiết (markdown), mỗi tuần kèm tài nguyên liên quan.
//
// Nội dung tách file theo track/tuần để dễ bảo trì:
//   CKAD: roadmap-part{1,2,3}.js      (Tuần 1–3 / 4–5 / 6–10) — 55 bài
//   CKA : cka-roadmap-part{1,2,3}.js  (Tuần 1–3 / 4–6 / 7–10) — 55 bài
//   CKS : cks-roadmap-part{1,2}.js    (Tuần 1–4 / 5–10)       — 44 bài
//
// LƯU Ý: id tuần (w1, cka-w1…) và id mục (w1-1, cka-w1-1…) là khóa lưu
// tiến độ trong localStorage — không được đổi.

import { weeksPart1 } from "./roadmap-part1.js";
import { weeksPart2 } from "./roadmap-part2.js";
import { weeksPart3 } from "./roadmap-part3.js";
import { ckaWeeksPart1 } from "./cka-roadmap-part1.js";
import { ckaWeeksPart2 } from "./cka-roadmap-part2.js";
import { ckaWeeksPart3 } from "./cka-roadmap-part3.js";
import { cksWeeksPart1 } from "./cks-roadmap-part1.js";
import { cksWeeksPart2 } from "./cks-roadmap-part2.js";

export const tracks = [
  {
    id: "ckad",
    label: "CKAD",
    icon: "🎯",
    name: "Certified Kubernetes Application Developer",
    desc: "Góc nhìn developer: Pod, Deployment, config, networking của ứng dụng. Bắt đầu từ đây nếu bạn mới với Kubernetes.",
    prereq: "Yêu cầu: Docker, YAML, Linux cơ bản (xem tài liệu Kiến thức nền tảng).",
    weeks: [...weeksPart1, ...weeksPart2, ...weeksPart3],
  },
  {
    id: "cka",
    label: "CKA",
    icon: "🛠️",
    name: "Certified Kubernetes Administrator",
    desc: "Góc nhìn admin: kubeadm, etcd backup/restore, cluster upgrade, troubleshooting mức node (30% đề thi).",
    prereq: "Khuyến nghị: học xong CKAD trước — khoảng 50% kiến thức trùng nhau.",
    weeks: [...ckaWeeksPart1, ...ckaWeeksPart2, ...ckaWeeksPart3],
  },
  {
    id: "cks",
    label: "CKS",
    icon: "🔐",
    name: "Certified Kubernetes Security Specialist",
    desc: "Bảo mật chuyên sâu: CIS benchmark, hardening, supply chain (Trivy), runtime security (Falco), audit logging.",
    prereq: "Bắt buộc: đang giữ chứng chỉ CKA còn hiệu lực mới được thi.",
    weeks: [...cksWeeksPart1, ...cksWeeksPart2],
  },
];

export function getTrack(id) {
  return tracks.find((t) => t.id === id);
}

// Giữ cho tương thích cũ: mặc định là lộ trình CKAD.
export const roadmap = tracks[0].weeks;
