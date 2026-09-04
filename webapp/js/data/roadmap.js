// Lộ trình học nhiều track (3 chứng chỉ Kubernetes, đọc sách Kubernetes in
// Action, lập trình hệ thống, đọc sách Spring Security in Action, đọc sách
// Modern Concurrency in Java, đọc sách Designing Data-Intensive Applications,
// đọc sách Modern Java in Action, và 4 giai đoạn của Lộ trình Senior Java) —
// mỗi track là một giáo trình tương tác: mỗi mục là một bài học chi tiết
// (markdown), mỗi tuần kèm tài nguyên liên quan.
//
// Nội dung tách file theo track/tuần để dễ bảo trì:
//   CKAD: roadmap-part{1,2,3}.js      (Tuần 1–3 / 4–5 / 6–10) — 55 bài
//   CKA : cka-roadmap-part{1,2,3}.js  (Tuần 1–3 / 4–6 / 7–10) — 55 bài
//   CKS : cks-roadmap-part{1,2}.js    (Tuần 1–4 / 5–10)       — 44 bài
//   SP  : sysprog-roadmap-part{1,2}.js  (Tuần 1–5 / 6–10)      — 50 mục
//   KIA : k8sbook-roadmap-part{1,2}.js   (Tuần 1–5 / 6–9)       — 30 mục
//   SSIA: springsec-roadmap-part{1,2}.js (Tuần 1–5 / 6–9)       — 30 mục
//   MCJ : modconc-roadmap-part{1,2}.js  (Tuần 1–5 / 6–9)       — 32 mục
//   DDIA: ddia-roadmap-part{1,2}.js  (Tuần 1–6 / 7–12)      — 48 mục
//   MJIA: mjia-roadmap-part{1,2}.js (Tuần 1–6 / 7–12)      — 48 mục
//   SJ1 : senior-java-gd1.js (Tuần 1–26) — 81 mục
//   SJ2 : senior-java-gd2.js (Tuần 1–26) — 66 mục
//   SJ3 : senior-java-gd3.js (Tuần 1–26) — 64 mục
//   SJ4 : senior-java-gd4.js (Tuần 1–26) — 65 mục
//
// Lĩnh vực senior-java (4 track SJ1–SJ4) có tổng 276 mục lộ trình.
//
// LƯU Ý: id tuần (w1, cka-w1, sp-w1, kb-w1, ss-w1, mc-w1, dd-w1, mj-w1, sj-gd1-w1…) và id
// mục (w1-1, cka-w1-1, sp-w1-1, kb-w1-1, ss-w1-1, mc-w1-1, dd-w1-1, mj-w1-1, sj-gd1-w1-1…) là khóa lưu
// tiến độ trong localStorage — không được đổi.

import { weeksPart1 } from "./roadmap-part1.js";
import { weeksPart2 } from "./roadmap-part2.js";
import { weeksPart3 } from "./roadmap-part3.js";
import { ckaWeeksPart1 } from "./cka-roadmap-part1.js";
import { ckaWeeksPart2 } from "./cka-roadmap-part2.js";
import { ckaWeeksPart3 } from "./cka-roadmap-part3.js";
import { cksWeeksPart1 } from "./cks-roadmap-part1.js";
import { cksWeeksPart2 } from "./cks-roadmap-part2.js";
import { sysprogWeeksPart1 } from "./sysprog-roadmap-part1.js";
import { sysprogWeeksPart2 } from "./sysprog-roadmap-part2.js";
import { k8sbookWeeksPart1 } from "./k8sbook-roadmap-part1.js";
import { k8sbookWeeksPart2 } from "./k8sbook-roadmap-part2.js";
import { springsecWeeksPart1 } from "./springsec-roadmap-part1.js";
import { springsecWeeksPart2 } from "./springsec-roadmap-part2.js";
import { modconcWeeksPart1 } from "./modconc-roadmap-part1.js";
import { modconcWeeksPart2 } from "./modconc-roadmap-part2.js";
import { ddiaWeeksPart1 } from "./ddia-roadmap-part1.js";
import { ddiaWeeksPart2 } from "./ddia-roadmap-part2.js";
import { mjiaWeeksPart1 } from "./mjia-roadmap-part1.js";
import { mjiaWeeksPart2 } from "./mjia-roadmap-part2.js";
import { seniorJavaGd1 } from "./senior-java-gd1.js";
import { seniorJavaGd2 } from "./senior-java-gd2.js";
import { seniorJavaGd3 } from "./senior-java-gd3.js";
import { seniorJavaGd4 } from "./senior-java-gd4.js";
import { k8sbookCrossref } from "./k8sbook-crossref.js";
import { docs as allDocsRaw } from "./docs-index.js";

// Nối chip "đọc thêm trong sách" vào resources của tuần, không ghi đè.
// Nhãn lấy từ title của chính tài liệu để không phải viết tay lần thứ hai.
const docTitle = new Map(allDocsRaw.map((d) => [d.id, d.title]));

function withBookRefs(weeks) {
  return weeks.map((w) => {
    const refs = k8sbookCrossref[w.id];
    if (!refs) return w;
    const chips = refs.map((id) => ({
      label: `📖 ${docTitle.get(id) ?? id}`,
      href: `#/docs/${id}`,
    }));
    return { ...w, resources: [...(w.resources ?? []), ...chips] };
  });
}

export const tracks = [
  {
    id: "ckad",
    label: "CKAD",
    icon: "🎯",
    name: "Certified Kubernetes Application Developer",
    durationWeeks: 10,
    desc: "Góc nhìn developer: Pod, Deployment, config, networking của ứng dụng. Bắt đầu từ đây nếu bạn mới với Kubernetes.",
    prereq: "Yêu cầu: Docker, YAML, Linux cơ bản (xem tài liệu Kiến thức nền tảng).",
    weeks: withBookRefs([...weeksPart1, ...weeksPart2, ...weeksPart3]),
  },
  {
    id: "cka",
    label: "CKA",
    icon: "🛠️",
    name: "Certified Kubernetes Administrator",
    durationWeeks: 10,
    desc: "Góc nhìn admin: kubeadm, etcd backup/restore, cluster upgrade, troubleshooting mức node (30% đề thi).",
    prereq: "Khuyến nghị: học xong CKAD trước — khoảng 50% kiến thức trùng nhau.",
    weeks: withBookRefs([...ckaWeeksPart1, ...ckaWeeksPart2, ...ckaWeeksPart3]),
  },
  {
    id: "cks",
    label: "CKS",
    icon: "🔐",
    name: "Certified Kubernetes Security Specialist",
    durationWeeks: 10,
    desc: "Bảo mật chuyên sâu: CIS benchmark, hardening, supply chain (Trivy), runtime security (Falco), audit logging.",
    prereq: "Bắt buộc: đang giữ chứng chỉ CKA còn hiệu lực mới được thi.",
    weeks: withBookRefs([...cksWeeksPart1, ...cksWeeksPart2]),
  },
  {
    id: "k8sbook",
    field: "kubernetes",
    label: "Kubernetes in Action",
    icon: "📖",
    name: "Đọc Kubernetes in Action (ấn bản 2)",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra. Bổ trợ chiều sâu cho ba giáo trình chứng chỉ.",
    prereq: "Yêu cầu: biết dùng terminal Linux và Docker cơ bản. Không cần biết Kubernetes trước.",
    weeks: [...k8sbookWeeksPart1, ...k8sbookWeeksPart2],
  },
  {
    id: "sysprog",
    field: "sysprog",
    label: "System Programming",
    icon: "🖥️",
    name: "Lập trình hệ thống (UIUC CS 241)",
    durationWeeks: 10,
    desc: "Kế hoạch học 10 tuần bám theo giáo trình: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc trong sách, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết lập trình cơ bản và dùng được terminal Linux. Không cần biết C trước.",
    weeks: [...sysprogWeeksPart1, ...sysprogWeeksPart2],
  },
  {
    id: "springsec",
    field: "spring-security",
    label: "Spring Security",
    icon: "🔒",
    name: "Đọc Spring Security in Action (ấn bản 2)",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết Java và Spring Boot cơ bản (REST controller, dependency injection). Không cần biết Spring Security trước.",
    weeks: [...springsecWeeksPart1, ...springsecWeeksPart2],
  },
  {
    id: "sj-gd1",
    field: "senior-java",
    label: "Giai đoạn 1",
    icon: "☕",
    name: "Java & Spring chuyên sâu (tháng 1–6)",
    durationWeeks: 26,
    desc: "Output bắt buộc: repo java-deep-dive ≥ 10 chủ đề có code và ghi chú Feynman, 2 case optimize thực tế tại công ty có số liệu trước/sau, và pass mock interview Java Senior.",
    prereq: "Yêu cầu: đang làm Java ở mức Mid-level, có dự án Spring Boot thật để áp dụng. Dành 8–10 giờ/tuần ngoài giờ làm.",
    weeks: seniorJavaGd1,
  },
  {
    id: "sj-gd2",
    field: "senior-java",
    label: "Giai đoạn 2",
    icon: "🔧",
    name: "DevOps nền tảng (tháng 6–12)",
    durationWeeks: 26,
    desc: "Output bắt buộc: pipeline CI/CD tự động hoá deploy tại công ty (hoặc bản mô phỏng 1:1) có số liệu trước/sau, repo springboot-cicd-observability, và 1 bài blog về hành trình tự động hoá.",
    prereq: "Yêu cầu: xong giai đoạn 1 ở mức ≥ 5/6 tiêu chí nghiệm thu. Cần thêm 1 VPS khoảng 5 USD/tháng và 1 domain rẻ.",
    weeks: seniorJavaGd2,
  },
  {
    id: "sj-gd3",
    field: "senior-java",
    label: "Giai đoạn 3",
    icon: "☸️",
    name: "Kubernetes, AWS & Terraform (tháng 12–18)",
    durationWeeks: 26,
    desc: "Output bắt buộc: repo production-ready-platform dựng lại được từ số 0 trong 1 buổi (Terraform → EKS → Helm chart tự viết → HPA → monitoring), 1 chứng chỉ CKA hoặc AWS SAA, và 1 bài blog từ trải nghiệm thật.",
    prereq: "Yêu cầu: xong giai đoạn 2 ở mức ≥ 6/7 tiêu chí nghiệm thu. Ngân sách cloud khoảng 30–50 USD cho cả giai đoạn — đặt Budget alert 10 USD ngay khi có tài khoản AWS.",
    weeks: seniorJavaGd3,
  },
  {
    id: "sj-gd4",
    field: "senior-java",
    label: "Giai đoạn 4",
    icon: "🌐",
    name: "Distributed Systems & System Design (tháng 18–24)",
    durationWeeks: 26,
    desc: "Output bắt buộc: 2 design doc được review với ít nhất 1 được triển khai, repo distributed-patterns-demo, pass 2 buổi mock system design mức Senior, và hồ sơ Senior hoàn chỉnh gồm CV, GitHub và ≥ 4 bài blog.",
    prereq: "Yêu cầu: xong giai đoạn 3 ở mức ≥ 6/7 tiêu chí nghiệm thu. Sách nền của giai đoạn là DDIA — đọc Understanding Distributed Systems trước nếu thấy nặng.",
    weeks: seniorJavaGd4,
  },
  {
    id: "modconc",
    field: "modern-concurrency",
    label: "Modern Concurrency",
    icon: "🧵",
    name: "Đọc Modern Concurrency in Java",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết Java cơ bản và đã từng dùng thread hoặc ExecutorService. Không cần biết trước virtual thread.",
    weeks: [...modconcWeeksPart1, ...modconcWeeksPart2],
  },
  {
    id: "ddia",
    field: "ddia",
    label: "DDIA",
    icon: "🗄️",
    name: "Đọc Designing Data-Intensive Applications (ấn bản 2)",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: đã làm backend với một database quan hệ, hiểu index và transaction ở mức dùng được. Không cần biết trước về hệ phân tán.",
    weeks: [...ddiaWeeksPart1, ...ddiaWeeksPart2],
  },
  {
    id: "modern-java",
    field: "modern-java",
    label: "MJIA",
    icon: "🌊",
    name: "Đọc Modern Java in Action",
    durationWeeks: 12,
    desc: "Kế hoạch đọc 12 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài tập gõ code.",
    prereq: "Yêu cầu: viết được Java ở mức thành thạo cú pháp trước Java 8 (class, interface, generics, collection). Không cần biết trước lambda hay stream.",
    weeks: [...mjiaWeeksPart1, ...mjiaWeeksPart2],
  },
];

export function getTrack(id) {
  return tracks.find((t) => t.id === id);
}

// Giữ cho tương thích cũ: mặc định là lộ trình CKAD.
export const roadmap = tracks[0].weeks;
