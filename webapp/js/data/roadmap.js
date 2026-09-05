// Lộ trình học nhiều track (3 chứng chỉ Kubernetes, đọc sách Kubernetes in
// Action, đọc sách CKA Study Guide, đọc sách Kubernetes: Up and Running, lập
// trình hệ thống, đọc sách Spring Security in Action, đọc sách Modern
// Concurrency in Java, đọc sách Designing Data-Intensive Applications, đọc
// sách Modern Java in Action, đọc sách Kafka: The Definitive Guide, đọc
// sách Spring Start Here, và 4 giai đoạn của Lộ trình Senior Java) — mỗi
// track là một giáo trình tương tác: mỗi mục là một bài học chi tiết
// (markdown), mỗi tuần kèm tài nguyên liên quan.
//
// Nội dung tách tệp theo lĩnh vực (js/data/<fieldId>/) rồi theo track/tuần:
//   kubernetes/roadmap-ckad-part{1,2,3}.js  (Tuần 1–3 / 4–5 / 6–10) — 55 bài
//   kubernetes/roadmap-cka-part{1,2,3}.js   (Tuần 1–3 / 4–6 / 7–10) — 55 bài
//   kubernetes/roadmap-cks-part{1,2}.js     (Tuần 1–4 / 5–10)       — 44 bài
//   kubernetes/roadmap-kia-part{1,2}.js     (Tuần 1–5 / 6–9)        — 30 mục  (Kubernetes in Action)
//   kubernetes/roadmap-ckabook.js           (Tuần 1–6)              — 24 mục  (CKA Study Guide)
//   kubernetes/roadmap-kuar-part{1,2}.js    (Tuần 1–5 / 6–9)        — 36 mục  (Kubernetes: Up and Running)
//   sysprog/roadmap-part{1,2}.js            (Tuần 1–5 / 6–10)       — 50 mục
//   spring-security/roadmap-part{1,2}.js    (Tuần 1–5 / 6–9)        — 30 mục
//   modern-concurrency/roadmap-part{1,2}.js (Tuần 1–5 / 6–9)        — 32 mục
//   ddia/roadmap-part{1,2}.js               (Tuần 1–6 / 7–12)       — 48 mục
//   modern-java/roadmap-part{1,2}.js        (Tuần 1–6 / 7–12)       — 48 mục
//   kafka/roadmap-part{1,2}.js              (Tuần 1–6 / 7–11)       — 44 mục
//   spring-start/roadmap-part{1,2}.js       (Tuần 1–4 / 5–8)        — 32 mục
//   senior-java/roadmap-gd{1,2,3,4}.js      (Tuần 1–26 mỗi giai đoạn) — 81 / 66 / 64 / 65 mục
//
// Lĩnh vực senior-java (4 track SJ1–SJ4) có tổng 276 mục lộ trình.
//
// LƯU Ý: id tuần (w1, cka-w1, sp-w1, kb-w1, cb-w1, ku-w1, ss-w1, mc-w1, dd-w1, mj-w1, kf-w1, sh-w1, sj-gd1-w1…) và id
// mục (w1-1, cka-w1-1, sp-w1-1, kb-w1-1, cb-w1-1, ku-w1-1, ss-w1-1, mc-w1-1, dd-w1-1, mj-w1-1, kf-w1-1, sh-w1-1, sj-gd1-w1-1…) là khóa lưu
// tiến độ trong localStorage — không được đổi.

import { weeksPart1 } from "./kubernetes/roadmap-ckad-part1.js";
import { weeksPart2 } from "./kubernetes/roadmap-ckad-part2.js";
import { weeksPart3 } from "./kubernetes/roadmap-ckad-part3.js";
import { ckaWeeksPart1 } from "./kubernetes/roadmap-cka-part1.js";
import { ckaWeeksPart2 } from "./kubernetes/roadmap-cka-part2.js";
import { ckaWeeksPart3 } from "./kubernetes/roadmap-cka-part3.js";
import { cksWeeksPart1 } from "./kubernetes/roadmap-cks-part1.js";
import { cksWeeksPart2 } from "./kubernetes/roadmap-cks-part2.js";
import { sysprogWeeksPart1 } from "./sysprog/roadmap-part1.js";
import { sysprogWeeksPart2 } from "./sysprog/roadmap-part2.js";
import { k8sbookWeeksPart1 } from "./kubernetes/roadmap-kia-part1.js";
import { k8sbookWeeksPart2 } from "./kubernetes/roadmap-kia-part2.js";
import { ckabookWeeks } from "./kubernetes/roadmap-ckabook.js";
import { kuarWeeksPart1 } from "./kubernetes/roadmap-kuar-part1.js";
import { kuarWeeksPart2 } from "./kubernetes/roadmap-kuar-part2.js";
import { springsecWeeksPart1 } from "./spring-security/roadmap-part1.js";
import { springsecWeeksPart2 } from "./spring-security/roadmap-part2.js";
import { modconcWeeksPart1 } from "./modern-concurrency/roadmap-part1.js";
import { modconcWeeksPart2 } from "./modern-concurrency/roadmap-part2.js";
import { ddiaWeeksPart1 } from "./ddia/roadmap-part1.js";
import { ddiaWeeksPart2 } from "./ddia/roadmap-part2.js";
import { mjiaWeeksPart1 } from "./modern-java/roadmap-part1.js";
import { mjiaWeeksPart2 } from "./modern-java/roadmap-part2.js";
import { kafkaWeeksPart1 } from "./kafka/roadmap-part1.js";
import { kafkaWeeksPart2 } from "./kafka/roadmap-part2.js";
import { springStartWeeksPart1 } from "./spring-start/roadmap-part1.js";
import { springStartWeeksPart2 } from "./spring-start/roadmap-part2.js";
import { seniorJavaGd1 } from "./senior-java/roadmap-gd1.js";
import { seniorJavaGd2 } from "./senior-java/roadmap-gd2.js";
import { seniorJavaGd3 } from "./senior-java/roadmap-gd3.js";
import { seniorJavaGd4 } from "./senior-java/roadmap-gd4.js";
import { bookCrossref } from "./book-crossref.js";
import { docs as allDocsRaw } from "./docs-index.js";

// Nối chip "đọc thêm trong sách" vào resources của tuần, không ghi đè.
// Nhãn lấy từ title của chính tài liệu để không phải viết tay lần thứ hai.
const docTitle = new Map(allDocsRaw.map((d) => [d.id, d.title]));

function withBookRefs(weeks) {
  return weeks.map((w) => {
    const refs = bookCrossref[w.id];
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
    id: "ckabook",
    field: "kubernetes",
    label: "CKA Study Guide",
    icon: "📘",
    name: "Nước rút CKA với CKA Study Guide (Muschko)",
    durationWeeks: 6,
    desc: "Vòng ôn thứ hai, chạy SAU giáo trình CKA: 6 tuần bám 22 chương sách luyện thi của O'Reilly, mỗi mục ưu tiên phần 'Trọng tâm cho kỳ thi' và giao bài tập mẫu cuối chương để bấm giờ.",
    prereq: "Khuyến nghị: đã hoàn thành lộ trình CKA. Track này ôn lại và bấm giờ, không dạy từ đầu.",
    weeks: ckabookWeeks,
  },
  {
    id: "kuar",
    field: "kubernetes",
    label: "Kubernetes: Up and Running",
    icon: "🚀",
    name: "Đọc Kubernetes: Up and Running (ấn bản 3)",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực hành trên cluster thật.",
    prereq: "Yêu cầu: biết dùng terminal Linux và Docker cơ bản. Không cần biết Kubernetes trước — đây là cuốn nhập môn, đọc song song hoặc trước giáo trình CKAD đều được.",
    weeks: [...kuarWeeksPart1, ...kuarWeeksPart2],
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
  {
    id: "kafka",
    field: "kafka",
    label: "Kafka",
    icon: "📨",
    name: "Đọc Kafka: The Definitive Guide (ấn bản 2)",
    durationWeeks: 11,
    desc: "Kế hoạch đọc 11 tuần bám theo bản dịch chương 2–14: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy thường gặp và câu tự kiểm tra; mỗi tuần một bài thực hành trên cluster thật.",
    prereq: "Yêu cầu: biết Java ở mức đọc được code client, quen dòng lệnh Linux, và dựng được một cluster Kafka một broker bằng Docker. Bản dịch bắt đầu từ chương 2 (cài đặt) — chương 1 giới thiệu khái niệm không nằm trong phạm vi.",
    weeks: [...kafkaWeeksPart1, ...kafkaWeeksPart2],
  },
  {
    id: "spring-start",
    field: "spring-start",
    label: "Spring Start",
    icon: "🌱",
    name: "Đọc Spring Start Here",
    durationWeeks: 8,
    desc: "Kế hoạch đọc 8 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng phần cần đọc, bẫy người mới hay vấp và câu tự kiểm tra; mỗi tuần một bài code.",
    prereq: "Yêu cầu: viết được Java cơ bản (class, interface, annotation) và dựng được một dự án Maven. Không cần biết trước gì về Spring — đây là điểm bắt đầu, và là bước đi trước lĩnh vực Spring Security.",
    weeks: [...springStartWeeksPart1, ...springStartWeeksPart2],
  },
];

export function getTrack(id) {
  return tracks.find((t) => t.id === id);
}

// Giữ cho tương thích cũ: mặc định là lộ trình CKAD.
export const roadmap = tracks[0].weeks;
