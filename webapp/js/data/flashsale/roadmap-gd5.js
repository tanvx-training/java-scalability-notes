// Lộ trình FlashSale — Giai đoạn 5: Góc nhìn Solution Architect.
//
// Nguồn: sources/flashsale/07-giai-doan-5.md (tài liệu fs-07).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// `fs-gd5-done` là Definition of Done (mục 1), cổng gắn tag `v5-sa`.
//
// GIỮ NGUYÊN id (fs-gd5-w<tuần tuyệt đối> / fs-gd5-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd5 = [
  {
    id: "fs-gd5-w20",
    week: "Tuần 20",
    title: "SAD arc42 mục 1–9",
    goal: "Viết chín mục đầu của SAD arc42 từ ADR, C4 và số liệu đã có.",
    doneWhen: "`docs/sad/01-03.md`; `04-05.md` + hình; `06-07.md`; `08-09.md`.",
    resources: [
      { label: "Giai đoạn 5 — bản đầy đủ", href: "#/docs/fs-07" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Tính nhất quán và Consensus", href: "#/docs/ddia-10" },
    ],
    items: [
      {
        id: "fs-gd5-w20-1",
        text: "Đọc lại toàn bộ ADR, report, attack log, postmortem",
        lesson: `**Việc cần làm.** Đọc lại toàn bộ ADR, report, attack log, postmortem; lập mục lục SAD; viết arc42 mục 1–3 (mục tiêu, ràng buộc, bối cảnh)

**Đầu ra.** \`docs/sad/01-03.md\`

**Nguồn.** [Giai đoạn 5 — buổi 1](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w20-2",
        text: "Mục 4–5: chiến lược giải pháp, building blocks từ C4 Container và Component",
        lesson: `**Việc cần làm.** Mục 4–5: chiến lược giải pháp, building blocks từ C4 Container và Component

**Đầu ra.** \`04-05.md\` + hình

**Nguồn.** [Giai đoạn 5 — buổi 2](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w20-3",
        text: "Mục 6–7: runtime view cho 4 đường saga và failover Redis",
        lesson: `**Việc cần làm.** Mục 6–7: runtime view cho 4 đường saga và failover Redis; deployment view từ kind, phác thảo cho AWS

**Đầu ra.** \`06-07.md\`

**Nguồn.** [Giai đoạn 5 — buổi 3](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w20-4",
        text: "SAD mục 8–9: cross-cutting concepts và chỉ mục ADR",
        lesson: `**Việc cần làm.** Mục 8–9: cross-cutting concepts (nhất quán, idempotency, security, observability, cấu hình) và chỉ mục ADR

**Đầu ra.** \`08-09.md\`

**Đọc thêm.** [Tính nhất quán và Consensus](#/docs/ddia-10)

**Nguồn.** [Giai đoạn 5 — buổi 4](#/docs/fs-07)`,
      },
    ],
  },

  {
    id: "fs-gd5-w21",
    week: "Tuần 21",
    title: "SAD hoàn chỉnh và threat model đầy đủ",
    goal: "Hoàn chỉnh SAD, threat model trên kiến trúc cuối và risk register.",
    doneWhen: "`10-12.md`; SAD bản 1; `threat-model-v1.md` bản nháp; Risk register; SAD bản 2.",
    resources: [
      { label: "Giai đoạn 5 — bản đầy đủ", href: "#/docs/fs-07" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd5-w21-1",
        text: "Mục 10–12: quality scenarios, rủi ro và nợ kỹ thuật, thuật ngữ",
        lesson: `**Việc cần làm.** Mục 10–12: quality scenarios, rủi ro và nợ kỹ thuật, thuật ngữ

**Đầu ra.** \`10-12.md\`; SAD bản 1

**Nguồn.** [Giai đoạn 5 — buổi 5](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w21-2",
        text: "Threat model đầy đủ: DFD mức 1–2, STRIDE theo phần tử",
        lesson: `**Việc cần làm.** Threat model đầy đủ: DFD mức 1 và 2 trên kiến trúc cuối (Threat Dragon), STRIDE theo phần tử

**Đầu ra.** \`threat-model-v1.md\` bản nháp

**Nguồn.** [Giai đoạn 5 — buổi 6](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w21-3",
        text: "Risk register có điểm, chủ và hạn; checklist ASVS mức 2",
        lesson: `**Việc cần làm.** Risk register: mọi rủi ro chấp nhận từ giai đoạn 0–4 gom lại, cho điểm, gán chủ và hạn; checklist ASVS mức 2

**Đầu ra.** Risk register

**Nguồn.** [Giai đoạn 5 — buổi 7](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w21-4",
        text: "Viết mục Security của SAD",
        lesson: `**Việc cần làm.** Viết mục Security của SAD; đối chiếu với OWASP API Top 10; rà lại attack log 1–4 thành bảng "đã chứng minh"

**Đầu ra.** SAD bản 2

**Nguồn.** [Giai đoạn 5 — buổi 8](#/docs/fs-07)`,
      },
    ],
  },

  {
    id: "fs-gd5-w22",
    week: "Tuần 22",
    title: "Chi phí, ADR-008 và Well-Architected",
    goal: "Ba phương án hạ tầng có TCO, ADR-008 và review theo sáu trụ cột.",
    doneWhen: "Bảng chi phí A; Bảng chi phí B, C; ADR-008 Accepted; `well-architected.md`.",
    resources: [
      { label: "Giai đoạn 5 — bản đầy đủ", href: "#/docs/fs-07" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd5-w22-1",
        text: "Hồ sơ tải và giả định chi phí",
        lesson: `**Việc cần làm.** Hồ sơ tải và giả định chi phí; phương án A (EKS) trên Pricing Calculator

**Đầu ra.** Bảng chi phí A

**Nguồn.** [Giai đoạn 5 — buổi 9](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w22-2",
        text: "Phương án B (ECS Fargate) và C (serverless)",
        lesson: `**Việc cần làm.** Phương án B (ECS Fargate) và C (serverless); ghi phần phải thiết kế lại ở C

**Đầu ra.** Bảng chi phí B, C

**Nguồn.** [Giai đoạn 5 — buổi 10](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w22-3",
        text: "TCO 1 năm gồm công vận hành",
        lesson: `**Việc cần làm.** TCO 1 năm gồm công vận hành; độ nhạy; chi phí mỗi đợt; ADR-008

**Đầu ra.** ADR-008 Accepted

**Nguồn.** [Giai đoạn 5 — buổi 11](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w22-4",
        text: "Well-Architected review 6 trụ cột",
        lesson: `**Việc cần làm.** Well-Architected review 6 trụ cột

**Đầu ra.** \`well-architected.md\`

**Nguồn.** [Giai đoạn 5 — buổi 12](#/docs/fs-07)`,
      },
    ],
  },

  {
    id: "fs-gd5-w23",
    week: "Tuần 23",
    title: "GraalVM native và đối chiếu hệ thống thật",
    goal: "Thí nghiệm native có số đo và đối chiếu thiết kế với các hệ thống công khai.",
    doneWhen: "Image native chạy được; Bảng so sánh; `comparison.md`; `comparison.md` hoàn chỉnh.",
    resources: [
      { label: "Giai đoạn 5 — bản đầy đủ", href: "#/docs/fs-07" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
      { label: "Thực thi mã trên JVM", href: "#/docs/ocnj-06" },
      { label: "Service Mesh", href: "#/docs/kuar-15" },
    ],
    items: [
      {
        id: "fs-gd5-w23-1",
        text: "GraalVM native cho payment-service: build, reachability metadata, nativeTest",
        lesson: `**Việc cần làm.** GraalVM native cho payment-service: build, sửa reachability metadata, \`nativeTest\`

**Đầu ra.** Image native chạy được

**Đọc thêm.** [Thực thi mã trên JVM](#/docs/ocnj-06)

**Nguồn.** [Giai đoạn 5 — buổi 13](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w23-2",
        text: "Đo JVM+AOT so với native",
        lesson: `**Việc cần làm.** Đo JVM+AOT so với native; kết luận; cập nhật SAD mục 8 và 11

**Đầu ra.** Bảng so sánh

**Nguồn.** [Giai đoạn 5 — buổi 14](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w23-3",
        text: "Đọc và đối chiếu với Tiki, Shopee/Grab, Netflix/Uber theo mẫu mục 8",
        lesson: `**Việc cần làm.** Đọc và đối chiếu với Tiki, Shopee/Grab, Netflix/Uber theo mẫu mục 8

**Đầu ra.** \`comparison.md\`

**Nguồn.** [Giai đoạn 5 — buổi 15](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w23-4",
        text: "Đọc Temporal và service mesh (Istio hoặc Linkerd) ở mức concept",
        lesson: `**Việc cần làm.** Đọc Temporal và service mesh (Istio hoặc Linkerd) ở mức concept; cập nhật ADR-007 với ghi chú; viết mục đối chiếu

**Đầu ra.** \`comparison.md\` hoàn chỉnh

**Đọc thêm.** [Service Mesh](#/docs/kuar-15)

**Nguồn.** [Giai đoạn 5 — buổi 16](#/docs/fs-07)`,
      },
    ],
  },

  {
    id: "fs-gd5-w24",
    week: "Tuần 24",
    title: "Viết, trình bày và chốt v5",
    goal: "Bài viết, tech talk, phản biện thật và gắn tag `v5-sa`.",
    doneWhen: "Bản nháp; Slide + video nháp; 5 phản biện + `proposal.md`; Tag `v5-sa`.",
    resources: [
      { label: "Giai đoạn 5 — bản đầy đủ", href: "#/docs/fs-07" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },

    ],
    items: [
      {
        id: "fs-gd5-w24-1",
        text: "Viết bài phần 1–2",
        lesson: `**Việc cần làm.** Viết bài phần 1–2

**Đầu ra.** Bản nháp

**Nguồn.** [Giai đoạn 5 — buổi 17](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w24-2",
        text: "Bài phần 3; slide 20 phút; tự ghi hình và xem lại 1 lần",
        lesson: `**Việc cần làm.** Bài phần 3; slide 20 phút; tự ghi hình và xem lại 1 lần

**Đầu ra.** Slide + video nháp

**Nguồn.** [Giai đoạn 5 — buổi 18](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w24-3",
        text: "Trình bày cho 2–3 người",
        lesson: `**Việc cần làm.** Trình bày cho 2–3 người; thu phản biện; viết proposal 2 trang từ phản biện đó

**Đầu ra.** 5 phản biện + \`proposal.md\`

**Nguồn.** [Giai đoạn 5 — buổi 19](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-w24-4",
        text: "README portfolio, retrospective, rà Definition of Done, tag",
        lesson: `**Việc cần làm.** README portfolio, retrospective, rà Definition of Done, tag

**Đầu ra.** Tag \`v5-sa\`

**Nguồn.** [Giai đoạn 5 — buổi 20](#/docs/fs-07)`,
      },
    ],
  },

  {
    id: "fs-gd5-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 5 — gắn tag v5-sa",
    goal: "Cổng ra của giai đoạn 5. Mốc kiểm tra: `docs/sad` hoàn chỉnh; ADR-008 có bảng chi phí; bài viết hoặc slide công khai; tag `v5-sa`. Tick đủ 11 tiêu chí Definition of Done bên dưới rồi mới gắn tag.",
    items: [
      {
        id: "fs-gd5-done-1",
        text: "docs/sad đủ 12 mục arc42, dưới 40 trang, có C4 ba tầng",
        lesson: `**Cách tự chấm.** \`docs/sad/\` có 12 mục arc42, mỗi mục có nội dung thật hoặc ghi rõ "không áp dụng, vì…"; tổng dưới 40 trang; C4 Context, Container, Deployment và ít nhất 2 Component view sinh từ Modulith.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-2",
        text: "SAD mục 10 có ≥ 8 quality scenario, mỗi cái trỏ tới bằng chứng",
        lesson: `**Cách tự chấm.** Mục 10 của SAD có ít nhất 8 quality scenario theo mẫu ở mục 3.3, mỗi scenario trỏ tới bằng chứng (test, report, chaos).

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-3",
        text: "threat-model-v1 có DFD, STRIDE, risk register và tự đánh giá ASVS mức 2",
        lesson: `**Cách tự chấm.** \`docs/security/threat-model-v1.md\`: DFD mức 1 và 2, bảng STRIDE theo phần tử, risk register có chủ sở hữu và hạn cho mọi rủi ro còn tồn đọng; checklist ASVS mức 2 tự đánh giá với tỷ lệ đạt và danh sách chưa đạt.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-4",
        text: "TCO 1 năm cho 3 phương án, bảng độ nhạy, ADR-008 Accepted",
        lesson: `**Cách tự chấm.** \`docs/cost/tco-1y.xlsx\` (hoặc Markdown) cho 3 phương án, mỗi dòng có link tới cấu hình trên Pricing Calculator; bảng độ nhạy 4 giả định; ADR-008 Accepted với khuyến nghị và điều kiện đổi phương án.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-5",
        text: "well-architected.md đủ 6 trụ cột, thừa nhận ≥ 3 khoảng trống",
        lesson: `**Cách tự chấm.** \`docs/well-architected.md\`: 6 trụ cột, mỗi trụ cột có bằng chứng, khoảng trống, hành động; ít nhất 3 khoảng trống được thừa nhận.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-6",
        text: "Payment-service build native thành công",
        lesson: `**Cách tự chấm.** payment-service build native thành công; bảng so sánh JVM+AOT so với native (startup, RSS, p99 warm, build time, image size); quyết định ghi thành một mục trong SAD (không cần ADR riêng).

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-7",
        text: "comparison.md: 3 khác biệt có lý do, mục Temporal và service mesh",
        lesson: `**Cách tự chấm.** \`docs/comparison.md\`: 3 điểm khác biệt với hệ thống thật có lý do, 1 mục về Temporal, 1 mục về service mesh.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-8",
        text: "Bài viết 3 phần trên Viblo (hoặc blog cá nhân) đã đăng",
        lesson: `**Cách tự chấm.** Bài viết 3 phần trên Viblo (hoặc blog cá nhân) đã đăng; slide 20 phút; talk đã trình bày cho ít nhất 2 người và có ghi lại 5 phản biện cùng câu trả lời.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-9",
        text: "proposal.md 2 trang có 3 phương án chi phí và timeline",
        lesson: `**Cách tự chấm.** \`docs/proposal.md\` 2 trang cho khách hàng giả định, có 3 phương án chi phí và timeline.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-10",
        text: "README repo là trang portfolio, link tới SAD, ADR, report, postmortem",
        lesson: `**Cách tự chấm.** README repo là trang portfolio: bài toán, NFR, kiến trúc (1 hình), số đo chính, link tới SAD, ADR, report, attack log, postmortem.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
      {
        id: "fs-gd5-done-11",
        text: "Retrospective toàn dự án 1 trang",
        lesson: `**Cách tự chấm.** Retrospective toàn dự án 1 trang; dòng giai đoạn 5 ở tab chính đổi sang Hoàn thành.

**Nguồn.** [Giai đoạn 5 — Definition of Done](#/docs/fs-07)`,
      },
    ],
  },
];
