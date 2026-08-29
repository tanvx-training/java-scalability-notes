# Tích hợp lộ trình Senior Java vào DevPrep — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lĩnh vực thứ 5 `senior-java` vào web app DevPrep (`webapp/`), gồm 5 tài liệu, 4 track lộ trình (276 mục tick) và một ma trận năng lực 96 tiêu chí có view riêng.

**Architecture:** Chỉ mang dữ liệu — không mang code React, không thêm bước build. Bốn track lộ trình tái dùng nguyên `views/roadmap.js` (chỉ cộng thêm hai trường tuỳ chọn); ma trận năng lực có `views/tracker.js` mới vì lược đồ module → chủ đề → tiêu chí không khớp lược đồ tuần/bài học. Mỗi task kết thúc bằng `node webapp/check-data.mjs` xanh.

**Tech Stack:** Vanilla ES modules, không dependency, không bundler. Bộ test duy nhất là `webapp/check-data.mjs` (khung `check()`/`expect()` tự viết). Chạy local bằng `python3 -m http.server` qua `webapp/dev.sh`.

**Spec:** `docs/superpowers/specs/2026-08-29-senior-java-integration-design.md`

## Global Constraints

- **Không thêm dependency, không thêm bước build.** `webapp/package.json` chỉ có `{"name","private","type":"module"}` và phải giữ nguyên.
- **Namespace localStorage là `kubeprep.`** — `webapp/js/lib/store.js` cấm đổi; đổi là xoá sạch tiến độ của người dùng hiện tại.
- **Id là khoá lưu tiến độ.** Mọi id mục lộ trình và id tiêu chí phải chốt đúng sơ đồ ở task tương ứng và không bao giờ đổi sau khi commit.
- **Không đụng id cũ.** Các tiền tố đang dùng: `w`, `cka-w`, `cks-w`, `sp-w`, `kb-w`, `ss-w` (mục lộ trình); `prerequisites`, `study-guide`, `springsec-*`, `sysprog-*`, `k8sbook-*` (tài liệu). Tiền tố mới đều bắt đầu bằng `sj-`.
- **Ngôn ngữ: tiếng Việt.** Mọi nhãn, mô tả, chú thích mã và thông điệp commit viết bằng tiếng Việt, theo văn phong các tệp dữ liệu sẵn có.
- **Không emoji trong tên tệp và id.**
- **Mọi liên kết `#/docs/<id>` trong `lesson` phải trỏ tới tài liệu cùng lĩnh vực** — bất biến #3b đã cưỡng chế; không cross-link sang lĩnh vực `java`.
- **Nội dung markdown nguồn giữ nguyên văn**, không biên tập lại khi copy vào repo.
- Sau mỗi task: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs` phải xanh trước khi commit.

## Cấu trúc tệp

**Tạo mới:**

| Tệp | Trách nhiệm |
|---|---|
| `senior-java-roadmap/00-tong-quan.md` … `04-*.md` | 5 tài liệu nguồn, nguyên văn |
| `webapp/js/data/senior-java-gd1.js` … `gd4.js` | Dữ liệu 4 track lộ trình, mỗi tệp một giai đoạn |
| `webapp/js/data/senior-java-matrix.js` | Ma trận năng lực (6 module, 34 chủ đề, 96 tiêu chí) |
| `webapp/js/views/tracker.js` | View ma trận năng lực |

**Sửa:**

| Tệp | Sửa gì |
|---|---|
| `webapp/js/data/fields.js` | Lĩnh vực `senior-java`, `FIELD_ORDER`, mục `tracker` trong `NAV_GROUPS` |
| `webapp/js/data/docs-index.js` | 5 bản ghi tài liệu |
| `webapp/js/data/roadmap.js` | Import + đăng ký 4 track, cập nhật chú thích đầu tệp |
| `webapp/js/data/index.js` | Export ma trận, `getMatrix()`, `fieldOfTrackerModule()` |
| `webapp/js/views/roadmap.js` | Hai trường tuỳ chọn `doneWhen` và `badge` |
| `webapp/js/views/dashboard.js` | Thống kê tracker + hai lỗi render vô điều kiện sẵn có |
| `webapp/js/app.js` | Route `tracker`, suy lĩnh vực ngược cho `#/tracker/…` |
| `webapp/css/style.css` | `.week-num` nở theo nhãn dài |
| `webapp/check-data.mjs` | Bảng kỳ vọng + bất biến mới |
| `webapp/build-content.sh` | Copy `senior-java-roadmap/` vào `content/senior/` |
| `webapp/js/lib/store.js` | Bảng chú thích khoá: `tracker.checked` |
| `webapp/README.md`, `README.md`, `webapp/index.html` | Số liệu và danh sách lĩnh vực |

**Thứ tự phụ thuộc:** Task 1 (tài liệu) → Task 2–5 (4 track, cần tài liệu để `lesson` trỏ vào) → Task 6 (dữ liệu ma trận) → Task 7 (view tracker) → Task 8 (bảng điều khiển) → Task 9 (tài liệu dự án).

---

### Task 1: Năm tài liệu và lĩnh vực mới

**Files:**
- Create: `senior-java-roadmap/00-tong-quan.md`, `01-giai-doan-1-java-spring.md`, `02-giai-doan-2-devops.md`, `03-giai-doan-3-k8s-cloud.md`, `04-giai-doan-4-system-design.md`
- Modify: `webapp/build-content.sh`, `webapp/js/data/docs-index.js`, `webapp/js/data/fields.js`, `webapp/check-data.mjs`

**Interfaces:**
- Produces: id tài liệu `sj-00`…`sj-04` (lĩnh vực `senior-java`) — Task 2–5 dùng chúng trong liên kết `#/docs/<id>` của `lesson`. Khoá lĩnh vực `"senior-java"` trong `FIELDS`.

- [ ] **Bước 1: Copy 5 tệp nguồn vào repo**

Tệp nguồn nằm trong thư mục upload của phiên trò chuyện; **copy trước tiên** vì thư mục đó có thể bị dọn.

```bash
SRC=/Users/tanvx/.claude/uploads/7c5b0d35-6d63-460e-b9a8-692eb29c77f4
mkdir -p senior-java-roadmap
cp "$SRC/b8122938-00tongquanroadmapsenior.md"            senior-java-roadmap/00-tong-quan.md
cp "$SRC/0c42546f-01giaidoan1javaspringchuyensau.md"     senior-java-roadmap/01-giai-doan-1-java-spring.md
cp "$SRC/dd1ace7b-02giaidoan2devopsnentang.md"           senior-java-roadmap/02-giai-doan-2-devops.md
cp "$SRC/7ab2cfa0-03giaidoan3kubernetescloudterraform.md" senior-java-roadmap/03-giai-doan-3-k8s-cloud.md
cp "$SRC/ca1c3b81-04giaidoan4systemdesignsenior.md"      senior-java-roadmap/04-giai-doan-4-system-design.md
wc -l senior-java-roadmap/*.md
```

Kỳ vọng: 42 / 233 / 217 / 201 / 181 dòng. Không sửa nội dung.

- [ ] **Bước 2: Viết kỳ vọng vào `check-data.mjs` TRƯỚC khi khai dữ liệu**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts` (sau dòng `"roadmap-items:spring-security": 30,`):

```js
    // Lĩnh vực Lộ trình Senior Java — 5 tài liệu kế hoạch 24 tháng.
    "docs:senior-java": 5,
```

- [ ] **Bước 3: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `Số lượng bản ghi khớp bảng kỳ vọng: docs:senior-java: kỳ vọng 5, thực tế 0`

- [ ] **Bước 4: Thêm đích copy vào `build-content.sh`**

Trong `webapp/build-content.sh`, thêm `"$DEST/senior"` vào lệnh `mkdir -p` và một dòng `cp` ở cuối:

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec" "$DEST/senior"
```

```bash
cp "$REPO"/senior-java-roadmap/*.md                      "$DEST/senior/"
```

- [ ] **Bước 5: Khai 5 tài liệu trong `docs-index.js`**

Thêm vào cuối mảng `docs` trong `webapp/js/data/docs-index.js`:

```js
  // ===== Lộ trình Senior Java =====
  {
    id: "sj-00",
    field: "senior-java",
    title: "Tổng quan roadmap 24 tháng",
    file: "content/senior/00-tong-quan.md",
    icon: "🧭",
    desc: "Bức tranh 4 giai đoạn, tỷ trọng Java/DevOps theo thời gian, nghi thức review hàng quý và quy tắc học xuyên suốt.",
    tags: ["Tổng quan", "Kế hoạch", "Review quý"],
  },
  {
    id: "sj-01",
    field: "senior-java",
    title: "Giai đoạn 1 — Java & Spring chuyên sâu (tháng 1–6)",
    file: "content/senior/01-giai-doan-1-java-spring.md",
    icon: "☕",
    desc: "JVM & GC, collections internals, concurrency, Spring IoC/AOP, @Transactional, JPA N+1, index & execution plan, testing với Testcontainers.",
    tags: ["JVM", "Concurrency", "Spring", "JPA", "SQL"],
  },
  {
    id: "sj-02",
    field: "senior-java",
    title: "Giai đoạn 2 — DevOps nền tảng (tháng 6–12)",
    file: "content/senior/02-giai-doan-2-devops.md",
    icon: "🔧",
    desc: "Linux thực chiến, networking, image Docker tối ưu, CI/CD GitHub Actions, Prometheus/Grafana/Loki, game day và runbook.",
    tags: ["Linux", "Docker", "CI/CD", "Observability"],
  },
  {
    id: "sj-03",
    field: "senior-java",
    title: "Giai đoạn 3 — Kubernetes, AWS & Terraform (tháng 12–18)",
    file: "content/senior/03-giai-doan-3-k8s-cloud.md",
    icon: "☸️",
    desc: "Workload và networking K8s, probe cùng JVM trong container, Helm chart tự viết, HPA, IAM/VPC, EKS và Terraform.",
    tags: ["Kubernetes", "Helm", "AWS", "Terraform"],
  },
  {
    id: "sj-04",
    field: "senior-java",
    title: "Giai đoạn 4 — Distributed Systems & System Design (tháng 18–24)",
    file: "content/senior/04-giai-doan-4-system-design.md",
    icon: "🌐",
    desc: "Kafka, outbox và idempotent consumer, Redis caching, resilience patterns, DDIA, design doc và luyện system design.",
    tags: ["Kafka", "Redis", "Resilience", "DDIA", "System Design"],
  },
```

- [ ] **Bước 6: Khai lĩnh vực trong `fields.js`**

Trong `webapp/js/data/fields.js`, thêm sau khoá `"spring-security"`:

```js
  "senior-java": {
    label: "Lộ trình Senior Java",
    icon: "🧭",
    desc: "Kế hoạch 24 tháng từ Mid-level lên Senior Java + DevOps — 4 giai đoạn, 276 mục tick — kèm ma trận năng lực 96 tiêu chí theo 4 cấp độ.",
    certFilter: false,
    // Mở dần theo dữ liệu: "roadmap" thêm ở Task 2, "tracker" ở Task 7.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard", "docs"],
    // Lộ trình trải từ Java/Spring qua DevOps, Kubernetes, AWS tới hệ phân tán —
    // không nguồn ngoài nào bao hết, nên bỏ externalRef thay vì bịa link.
  },
```

và sửa `FIELD_ORDER`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "spring-security", "senior-java"];
```

- [ ] **Bước 7: Build content rồi chạy check-data — phải xanh**

Run: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs`
Expected: PASS toàn bộ, dòng cuối `Dữ liệu hợp lệ.`

- [ ] **Bước 8: Kiểm tay trong trình duyệt**

Run: `./webapp/dev.sh`, mở http://localhost:8888
Kỳ vọng: bộ chọn lĩnh vực có 5 mục; chọn "Lộ trình Senior Java" thì nav chỉ còn Bảng điều khiển + Tài liệu; mở cả 5 tài liệu thấy nội dung và mục lục nổi.

- [ ] **Bước 9: Commit**

```bash
git add senior-java-roadmap webapp/build-content.sh webapp/js/data/docs-index.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "feat: khai lĩnh vực Lộ trình Senior Java với 5 tài liệu kế hoạch 24 tháng"
```

---

### Task 2: Track giai đoạn 1 và hai trường hiển thị mới

Task này gánh cả phần hạ tầng hiển thị (`doneWhen`, `badge`, CSS) vì đây là dữ liệu đầu tiên cần tới chúng.

**Files:**
- Create: `webapp/js/data/senior-java-gd1.js`
- Modify: `webapp/js/data/roadmap.js`, `webapp/js/data/fields.js`, `webapp/js/views/roadmap.js`, `webapp/css/style.css`, `webapp/check-data.mjs`
- Nguồn nội dung: `senior-java-roadmap/01-giai-doan-1-java-spring.md`

**Interfaces:**
- Consumes: id tài liệu `sj-01`, `sj-00` (Task 1).
- Produces:
  - `export const seniorJavaGd1: Week[]` từ `webapp/js/data/senior-java-gd1.js`
  - Lược đồ `Week` mở rộng: `{ id, week, badge?, title, goal, practice?, doneWhen?, resources?, items }`
  - Track id `sj-gd1` — Task 3 dùng trong `prereq`, Task 8 đếm vào thống kê.

- [ ] **Bước 1: Viết kỳ vọng và bất biến mới vào `check-data.mjs`**

Thêm vào `EXPECTED.counts`:

```js
    "roadmap-items:senior-java": 81,
```

Thêm một bất biến mới, đặt ngay sau bất biến `#3c` (`Mọi link #/roadmap/<trackId> trỏ tới track có thật`):

```js
// #3d — Mỗi track sj-gd* phải kết thúc bằng đúng một khối "Nghiệm thu".
//
// Khối nghiệm thu là khối tuần duy nhất khai `badge`, và nó chứa các tiêu chí
// cổng của giai đoạn. Đặt nhầm vị trí (không ở cuối) hay khai hai khối cùng
// badge đều làm hỏng ý nghĩa "cổng cuối giai đoạn" mà không lỗi hiển thị nào
// lộ ra — nên phải có bất biến riêng.
await check("Mỗi track sj-gd* kết thúc bằng đúng một khối nghiệm thu", () => {
  const bad = [];
  for (const t of tracks.filter((x) => x.id.startsWith("sj-gd"))) {
    const marked = t.weeks.filter((w) => w.badge === "✓");
    if (marked.length !== 1) {
      bad.push(`${t.id}: có ${marked.length} khối badge "✓", cần đúng 1`);
      continue;
    }
    if (t.weeks[t.weeks.length - 1] !== marked[0]) {
      bad.push(`${t.id}: khối nghiệm thu "${marked[0].id}" không nằm cuối track`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

// #3e — Không khối tuần nào được rỗng mục.
//
// renderTrack() tính `d / week.items.length`; với mảng rỗng thì tỷ lệ ra NaN
// (thanh tiến độ không vẽ) và `d === week.items.length` thành 0 === 0 nên ô
// tuần bị tô "done" ngay từ đầu. Nguồn markdown của lộ trình Senior Java có
// hai khối "Tuần 25–26" chỉ có văn xuôi, không bước đánh số — đây chính là
// ca thật khiến bất biến này cần thiết.
await check("Mọi khối tuần có ít nhất 1 mục", () => {
  const bad = tracks.flatMap((t) =>
    t.weeks.filter((w) => !w.items?.length).map((w) => `${t.id}/${w.id}`));
  expect(!bad.length, `khối tuần rỗng: ${bad.join(", ")}`);
});
```

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `roadmap-items:senior-java: kỳ vọng 81, thực tế 0`. Bất biến #3d và #3e xanh (chưa có track `sj-gd*` nào).

- [ ] **Bước 3: Cho `views/roadmap.js` hiểu `badge` và `doneWhen`**

Trong `webapp/js/views/roadmap.js`, hàm `renderTrack`, sửa dòng tạo `weekNum`:

```js
    const weekNum = h("div", { class: "week-num" },
      week.badge ?? week.week.replace("Tuần ", ""));
```

và thêm hộp "Hoàn thành khi" ngay sau khối `body.append(...)` chứa `explain-box` của `week.practice`. Khối `practice` hiện tại là bắt buộc; bọc nó lại để khối nghiệm thu (không có `practice`) không văng:

```js
    if (week.practice) {
      body.append(
        h("div", { class: "explain-box", style: "margin-top:10px" },
          h("span", { html: "🔨 <strong>Thực hành cuối tuần:</strong> " + inlineMd(week.practice) }))
      );
    }
    if (week.doneWhen) {
      body.append(
        h("div", { class: "explain-box", style: "margin-top:10px" },
          h("span", { html: "✅ <strong>Hoàn thành khi:</strong> " + inlineMd(week.doneWhen) }))
      );
    }
```

- [ ] **Bước 4: Cho `.week-num` nở theo nhãn dài**

Trong `webapp/css/style.css`, sửa khối `.week-num` (khoảng dòng 825): nhãn của lộ trình Senior Java là khoảng tuần ("21–24"), tràn hình tròn 42px cứng.

```css
.week-num {
  flex: none;
  min-width: 42px; height: 42px;
  padding: 0 8px;
  border-radius: 21px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 800;
  font-size: 15px;
}
```

Tuần một hoặc hai chữ số vẫn tròn như cũ vì `min-width` bằng `height`.

- [ ] **Bước 5: Viết dữ liệu track giai đoạn 1**

Tạo `webapp/js/data/senior-java-gd1.js`. Mười bốn khối tuần, tổng **81 mục**:

| Id tuần | `week` | `title` | Số mục |
|---|---|---|---|
| `sj-gd1-w1` | Tuần 1–2 | Setup + Java 17–21 | 5 |
| `sj-gd1-w2` | Tuần 3–4 | JVM memory & GC | 6 |
| `sj-gd1-w3` | Tuần 5–6 | Collections internals, equals/hashCode | 5 |
| `sj-gd1-w4` | Tuần 7–8 | Generics, lambda, stream | 4 |
| `sj-gd1-w5` | Tuần 9–10 | Thread safety, visibility, atomicity | 5 |
| `sj-gd1-w6` | Tuần 11–12 | Thread pool & ExecutorService | 4 |
| `sj-gd1-w7` | Tuần 13–14 | CompletableFuture & virtual threads | 4 |
| `sj-gd1-w8` | Tuần 15–16 | Spring IoC & AOP — vén màn magic | 6 |
| `sj-gd1-w9` | Tuần 17–18 | @Transactional tận gốc | 6 |
| `sj-gd1-w10` | Tuần 19–20 | JPA hiệu năng — N+1 (case optimize #1) | 6 |
| `sj-gd1-w11` | Tuần 21–22 | SQL — index & execution plan (case optimize #2) | 7 |
| `sj-gd1-w12` | Tuần 23–24 | Testing đáng tin | 5 |
| `sj-gd1-w13` | Tuần 25–26 | Ôn tập & mock interview | 2 + **10** |
| `sj-gd1-done` | Nghiệm thu | Giai đoạn 1 — 6 tiêu chí bắt buộc | 6 |

Quy tắc chuyển đổi, áp dụng nguyên xi cho mọi tuần:

- Mỗi **bước đánh số** trong `**Cách thực hiện:**` → một phần tử `items[]`. `text` là câu tóm tắt hành động (rút từ chính bước đó, ≤ 120 ký tự); `lesson` là markdown đầy đủ của bước đó.
- `**Mục tiêu:**` → `goal`. `**Hoàn thành khi:**` → `doneWhen`.
- Không có `**Thực hành cuối tuần**` trong nguồn này, nên **bỏ trường `practice`**.
- Tuần `sj-gd1-w13` nhận thêm **10 mục** từ `## Bộ câu hỏi tự kiểm tra`, id `sj-gd1-w13-3` … `sj-gd1-w13-12`, `text` là **nguyên văn câu hỏi**, `lesson` chỉ nêu cách tự chấm. **Không viết đáp án** — nguồn không có.
- Khối `sj-gd1-done` lấy 6 dòng `- [ ]` của `## Checklist đánh giá cuối giai đoạn`.
- Id mục: `<id tuần>-<số thứ tự từ 1>`.

Mẫu đầy đủ của tuần đầu và khối nghiệm thu — viết các tuần còn lại theo đúng khuôn này:

> Dấu `…` trong mẫu mã dưới đây **không phải việc để lại làm sau**: nó đánh dấu chỗ
> chép tiếp từ tệp nguồn theo đúng quy tắc chuyển đổi vừa nêu. Bảng số mục ở trên và
> bất biến đếm trong `check-data.mjs` là thứ bắt lỗi nếu chép thiếu hoặc chép thừa.

```js
// Lộ trình Senior Java — Giai đoạn 1: Java & Spring chuyên sâu (tháng 1–6).
//
// Nguồn: senior-java-roadmap/01-giai-doan-1-java-spring.md (tài liệu sj-01).
// Mỗi mục là MỘT BƯỚC trong "Cách thực hiện" của tuần tương ứng.
//
// GIỮ NGUYÊN id (sj-gd1-w<N> / sj-gd1-w<N>-<M>) — tiến độ localStorage lưu
// theo id này. Khối cuối `sj-gd1-done` là cổng nghiệm thu giai đoạn, nhận
// badge "✓" thay cho số tuần.

export const seniorJavaGd1 = [
  {
    id: "sj-gd1-w1",
    week: "Tuần 1–2",
    title: "Setup + Java 17–21",
    goal: "Dựng nền nếp học tập và cập nhật ngôn ngữ hiện đại.",
    doneWhen: "Repo đã có commit đầu tiên với ≥ 4 demo tính năng mới; PR refactor ở công ty được merge; kể được không cần nhìn tài liệu 5 items tâm đắc nhất của Effective Java chương 1–3.",
    resources: [
      { label: "Giai đoạn 1 — bản đầy đủ", href: "#/docs/sj-01" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "openjdk.org — JEP index", href: "https://openjdk.org/jeps/0" },
    ],
    items: [
      {
        id: "sj-gd1-w1-1",
        text: "Tạo repo `java-deep-dive` với 6 thư mục chủ đề",
        lesson: `**Việc cần làm.** Tạo repo \`java-deep-dive\` trên GitHub với cấu trúc \`/jvm-gc\`, \`/collections\`, \`/concurrency\`, \`/spring-internals\`, \`/jpa-sql\`, \`/testing\`.

Mỗi thư mục sẽ có \`README.md\` (ghi chú Feynman) cộng mã nguồn. Đây là nơi mọi output của giai đoạn 1 đổ về, nên dựng đúng khung ngay từ đầu.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      {
        id: "sj-gd1-w1-2",
        text: "Cài JDK 21 và tạo project Maven/Gradle trong repo",
        lesson: `**Việc cần làm.** Cài JDK 21 qua SDKMAN (\`sdk install java 21-tem\`), rồi tạo project Maven hoặc Gradle ngay trong repo vừa dựng.

**Nguồn.** [Giai đoạn 1 — Tuần 1–2](#/docs/sj-01)`,
      },
      // … 3 mục còn lại của tuần: đọc Effective Java ch.1–3; viết demo
      // records/sealed/pattern matching/text blocks; refactor Builder tại công ty.
    ],
  },

  // … 12 khối tuần còn lại theo bảng ở kế hoạch …

  {
    id: "sj-gd1-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 1 — 6 tiêu chí bắt buộc",
    goal: "Cổng ra của giai đoạn 1. Đạt ≥ 5/6 thì sang giai đoạn 2; trượt riêng concurrency hoặc JPA thì kéo dài chủ đề đó 3–4 tuần song song với giai đoạn 2.",
    items: [
      {
        id: "sj-gd1-done-1",
        text: "Repo ≥ 10 chủ đề có code + ghi chú Feynman",
        lesson: `**Cách tự chấm.** Đếm số thư mục chủ đề trong \`java-deep-dive\` có đủ cả mã nguồn lẫn \`README.md\` viết theo lối Feynman. Thư mục chỉ có mã, không có ghi chú, không tính.

**Nguồn.** [Giai đoạn 1 — Checklist đánh giá cuối giai đoạn](#/docs/sj-01)`,
      },
      // … 5 tiêu chí còn lại …
    ],
  },
];
```

- [ ] **Bước 6: Đăng ký track trong `roadmap.js`**

Trong `webapp/js/data/roadmap.js`, thêm import và một phần tử vào mảng `tracks`:

```js
import { seniorJavaGd1 } from "./senior-java-gd1.js";
```

```js
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
```

Cập nhật chú thích đầu tệp: thêm dòng `SJ1 : senior-java-gd1.js (Tuần 1–26) — 81 mục` vào bảng liệt kê track, và thêm `sj-gd1-w1` vào danh sách tiền tố id không được đổi.

- [ ] **Bước 7: Mở module `roadmap` cho lĩnh vực**

Trong `webapp/js/data/fields.js`, sửa `modules` của `"senior-java"`:

```js
    modules: ["dashboard", "docs", "roadmap"],
```

- [ ] **Bước 8: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS. Nếu báo `roadmap-items:senior-java: kỳ vọng 81, thực tế <n>` thì thiếu hoặc thừa mục — đối chiếu bảng số mục ở Bước 5.

- [ ] **Bước 9: Kiểm tay trong trình duyệt**

Run: `./webapp/dev.sh`
Kỳ vọng: lĩnh vực Senior Java có mục nav Lộ trình học; trang lộ trình hiện 1 track; mở track thấy 14 khối, nhãn "Tuần 21–22" không tràn ô; khối cuối hiện huy hiệu "✓"; mở một tuần thấy hộp "✅ Hoàn thành khi"; tick một mục rồi tải lại trang, dấu tick còn nguyên. Mở lại lộ trình CKAD kiểm tra không có gì đổi.

- [ ] **Bước 10: Commit**

```bash
git add webapp/js/data/senior-java-gd1.js webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/views/roadmap.js webapp/css/style.css webapp/check-data.mjs
git commit -m "feat: track giai đoạn 1 Senior Java — 81 mục, thêm trường doneWhen và badge"
```

---

### Task 3: Track giai đoạn 2

**Files:**
- Create: `webapp/js/data/senior-java-gd2.js`
- Modify: `webapp/js/data/roadmap.js`, `webapp/check-data.mjs`
- Nguồn nội dung: `senior-java-roadmap/02-giai-doan-2-devops.md`

**Interfaces:**
- Consumes: id tài liệu `sj-02`; lược đồ `Week` mở rộng (`doneWhen`, `badge`) từ Task 2; track `sj-gd1` để tham chiếu trong `prereq`.
- Produces: `export const seniorJavaGd2: Week[]`; track id `sj-gd2`.

- [ ] **Bước 1: Nâng kỳ vọng trong `check-data.mjs`**

Sửa `"roadmap-items:senior-java"` từ `81` thành `147` (81 + 66).

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `roadmap-items:senior-java: kỳ vọng 147, thực tế 81`

- [ ] **Bước 3: Viết dữ liệu track giai đoạn 2**

Tạo `webapp/js/data/senior-java-gd2.js`, `export const seniorJavaGd2`. Mười bốn khối, tổng **66 mục**:

| Id tuần | `week` | `title` | Số mục |
|---|---|---|---|
| `sj-gd2-w1` | Tuần 1–2 | Linux thực chiến | 7 |
| `sj-gd2-w2` | Tuần 3–4 | Networking cho backend engineer | 6 |
| `sj-gd2-w3` | Tuần 5–6 | Image tối ưu cho Spring Boot | 6 |
| `sj-gd2-w4` | Tuần 7–8 | docker-compose môi trường dev chuẩn | 5 |
| `sj-gd2-w5` | Tuần 9–10 | CI — build & test tự động | 5 |
| `sj-gd2-w6` | Tuần 11–12 | CD phần 1 — build image & deploy staging | 5 |
| `sj-gd2-w7` | Tuần 13–14 | CD phần 2 — production, approval, rollback | 3 |
| `sj-gd2-w8` | Tuần 15–16 | Metrics — Actuator, Micrometer, Prometheus | 5 |
| `sj-gd2-w9` | Tuần 17–18 | Grafana dashboard & alert | 4 |
| `sj-gd2-w10` | Tuần 19–20 | Logs — structured logging & Loki | 5 |
| `sj-gd2-w11` | Tuần 21–22 | Game day — tự gây sự cố, tự chẩn đoán | 4 |
| `sj-gd2-w12` | Tuần 23–24 | Hoàn thiện portfolio + blog | 2 |
| `sj-gd2-w13` | Tuần 25–26 | Đánh giá & buffer | **2** |
| `sj-gd2-done` | Nghiệm thu | Giai đoạn 2 — 7 tiêu chí bắt buộc | 7 |

Quy tắc chuyển đổi giống Task 2: mỗi bước đánh số → một `items[]` (`text` ≤ 120 ký tự, `lesson` là markdown đầy đủ của bước, kết bằng dòng `**Nguồn.** [Giai đoạn 2 — <tên tuần>](#/docs/sj-02)`); `**Mục tiêu:**` → `goal`; `**Hoàn thành khi:**` → `doneWhen`; bỏ `practice`; khối `sj-gd2-done` lấy 7 dòng `- [ ]` của checklist cuối giai đoạn, `badge: "✓"`, `week: "Nghiệm thu"`.

**Chú ý riêng của track này** — `Tuần 25–26: Đánh giá & buffer` trong nguồn **không có bước đánh số**, chỉ một câu văn xuôi. Khối tuần rỗng mục làm thanh tiến độ ra `NaN` và ô tuần tự tô *done* (bất biến #3e chặn). Tách câu đó thành đúng 2 mục:

```js
  {
    id: "sj-gd2-w13",
    week: "Tuần 25–26",
    title: "Đánh giá & buffer",
    goal: "Chốt sổ giai đoạn và trả nợ các tuần bị trễ.",
    items: [
      {
        id: "sj-gd2-w13-1",
        text: "Chấm checklist nghiệm thu và làm review quý",
        lesson: `**Việc cần làm.** Chấm từng dòng của checklist đánh giá cuối giai đoạn, rồi làm nghi thức review quý theo tài liệu tổng quan: cập nhật CV với thành tích đo được, dọn README các repo mới, và viết một đoạn trả lời "Quý này tôi làm được gì mà 3 tháng trước tôi chưa làm được?".

**Nguồn.** [Tổng quan — Nghi thức review hàng quý](#/docs/sj-00)`,
      },
      {
        id: "sj-gd2-w13-2",
        text: "Dùng buffer trả nợ các tuần trễ",
        lesson: `**Việc cần làm.** Rà lại 12 tuần trước, chọn phần bị bỏ dở và hoàn tất trong hai tuần đệm này. Nếu không nợ gì thì dùng thời gian để làm sâu thêm phần observability — nguồn nói rõ trượt observability thì mang sang giai đoạn 3 làm tiếp trên Kubernetes.

**Nguồn.** [Giai đoạn 2 — Tuần 25–26](#/docs/sj-02)`,
      },
    ],
  },
```

- [ ] **Bước 4: Đăng ký track trong `roadmap.js`**

```js
import { seniorJavaGd2 } from "./senior-java-gd2.js";
```

```js
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
```

Cập nhật chú thích đầu tệp: thêm dòng `SJ2 : senior-java-gd2.js (Tuần 1–26) — 66 mục`.

- [ ] **Bước 5: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS

- [ ] **Bước 6: Kiểm tay**

Run: `./webapp/dev.sh`
Kỳ vọng: trang lộ trình của lĩnh vực hiện 2 track; mở giai đoạn 2 thấy 14 khối; khối "Tuần 25–26" có 2 mục và thanh tiến độ 0/2, **không** bị tô sẵn màu hoàn thành.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/senior-java-gd2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: track giai đoạn 2 Senior Java — DevOps nền tảng, 66 mục"
```

---

### Task 4: Track giai đoạn 3

**Files:**
- Create: `webapp/js/data/senior-java-gd3.js`
- Modify: `webapp/js/data/roadmap.js`, `webapp/check-data.mjs`
- Nguồn nội dung: `senior-java-roadmap/03-giai-doan-3-k8s-cloud.md`

**Interfaces:**
- Consumes: id tài liệu `sj-03`; lược đồ `Week` mở rộng từ Task 2.
- Produces: `export const seniorJavaGd3: Week[]`; track id `sj-gd3`.

- [ ] **Bước 1: Nâng kỳ vọng trong `check-data.mjs`**

Sửa `"roadmap-items:senior-java"` từ `147` thành `211` (147 + 64).

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `roadmap-items:senior-java: kỳ vọng 211, thực tế 147`

- [ ] **Bước 3: Viết dữ liệu track giai đoạn 3**

Tạo `webapp/js/data/senior-java-gd3.js`, `export const seniorJavaGd3`. Mười ba khối, tổng **64 mục**:

| Id tuần | `week` | `title` | Số mục |
|---|---|---|---|
| `sj-gd3-w1` | Tuần 1–2 | Kiến trúc & workload cơ bản | 7 |
| `sj-gd3-w2` | Tuần 3–4 | Networking trong K8s | 4 |
| `sj-gd3-w3` | Tuần 5–6 | Config, Secret, probe & JVM trong container | 5 |
| `sj-gd3-w4` | Tuần 7–8 | Storage, scheduling & debug | 3 |
| `sj-gd3-w5` | Tuần 9–10 | Helm chart tự viết | 5 |
| `sj-gd3-w6` | Tuần 11–12 | HPA + kube-prometheus-stack | 5 |
| `sj-gd3-w7` | Tuần 13–14 | Tài khoản, IAM & VPC | 4 |
| `sj-gd3-w8` | Tuần 15–16 | Compute, database, storage | 4 |
| `sj-gd3-w9` | Tuần 17–18 | Terraform nền tảng | 5 |
| `sj-gd3-w10` | Tuần 19–20 | Dự án production-ready-platform | 6 |
| `sj-gd3-w11` | Tuần 21–24 | Nước rút chứng chỉ | 6 |
| `sj-gd3-w12` | Tuần 25–26 | Blog, tech-sharing & đánh giá | 3 |
| `sj-gd3-done` | Nghiệm thu | Giai đoạn 3 — 7 tiêu chí bắt buộc | 7 |

Quy tắc chuyển đổi giống Task 2: mỗi bước đánh số → một `items[]` (`text` ≤ 120 ký tự, `lesson` là markdown đầy đủ của bước, kết bằng dòng `**Nguồn.** [Giai đoạn 3 — <tên tuần>](#/docs/sj-03)`); `**Mục tiêu:**` → `goal`; `**Hoàn thành khi:**` → `doneWhen`; bỏ `practice`; khối `sj-gd3-done` lấy 7 dòng `- [ ]` của checklist cuối giai đoạn, `badge: "✓"`, `week: "Nghiệm thu"`.

**Chú ý riêng của track này.** `Tuần 21–24: Nước rút chứng chỉ` có hai nhánh song song trong nguồn — `**Cách thực hiện (CKA)**` 3 bước và `**Cách thực hiện (SAA)**` 3 bước. Giữ **cả sáu** thành 6 mục, mở đầu `text` bằng `CKA — ` hoặc `SAA — ` để người học chọn nhánh của mình. Nhãn tuần là `"Tuần 21–24"` (4 ký tự trong ô) — đây chính là ca kiểm chứng thay đổi CSS ở Task 2. Tuần này **không có** `**Mục tiêu:**` trong nguồn, nên `goal` viết từ tiêu đề mục: `"Nước rút ôn và thi lấy chứng chỉ CKA hoặc AWS SAA."`

**Không cross-link sang lĩnh vực Kubernetes.** Giai đoạn này trùng chủ đề với các tài liệu CKAD/CKA/CKS và *Kubernetes in Action*, nhưng chúng thuộc lĩnh vực `kubernetes`; liên kết `#/docs/<id>` tới chúng sẽ tự đổi lĩnh vực đang chọn của người dùng. Bất biến #3b báo đỏ nếu vi phạm. Chỉ liên kết tới `sj-00`…`sj-04` và URL ngoài.

- [ ] **Bước 4: Đăng ký track trong `roadmap.js`**

```js
import { seniorJavaGd3 } from "./senior-java-gd3.js";
```

```js
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
```

Cập nhật chú thích đầu tệp: thêm dòng `SJ3 : senior-java-gd3.js (Tuần 1–26) — 64 mục`.

- [ ] **Bước 5: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS

- [ ] **Bước 6: Kiểm tay**

Run: `./webapp/dev.sh`
Kỳ vọng: 3 track; mở giai đoạn 3, khối "Tuần 21–24" hiện nhãn đầy đủ trong ô viên thuốc, không tràn và không bị cắt.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/senior-java-gd3.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: track giai đoạn 3 Senior Java — Kubernetes, AWS, Terraform, 64 mục"
```

---

### Task 5: Track giai đoạn 4

**Files:**
- Create: `webapp/js/data/senior-java-gd4.js`
- Modify: `webapp/js/data/roadmap.js`, `webapp/check-data.mjs`
- Nguồn nội dung: `senior-java-roadmap/04-giai-doan-4-system-design.md`

**Interfaces:**
- Consumes: id tài liệu `sj-04`; lược đồ `Week` mở rộng từ Task 2.
- Produces: `export const seniorJavaGd4: Week[]`; track id `sj-gd4`. Sau task này `roadmap-items:senior-java` chốt ở **276** — Task 8 dùng con số này trong thống kê bảng điều khiển.

- [ ] **Bước 1: Nâng kỳ vọng trong `check-data.mjs`**

Sửa `"roadmap-items:senior-java"` từ `211` thành `276` (211 + 65).

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `roadmap-items:senior-java: kỳ vọng 276, thực tế 211`

- [ ] **Bước 3: Viết dữ liệu track giai đoạn 4**

Tạo `webapp/js/data/senior-java-gd4.js`, `export const seniorJavaGd4`. Mười hai khối, tổng **65 mục**:

| Id tuần | `week` | `title` | Số mục |
|---|---|---|---|
| `sj-gd4-w1` | Tuần 1–2 | Kafka nền tảng | 7 |
| `sj-gd4-w2` | Tuần 3–4 | Idempotency & outbox | 7 |
| `sj-gd4-w3` | Tuần 5–6 | Redis & caching | 6 |
| `sj-gd4-w4` | Tuần 7–8 | Resilience patterns | 6 |
| `sj-gd4-w5` | Tuần 9–14 | Đọc DDIA có kỷ luật | 5 |
| `sj-gd4-w6` | Tuần 15–16 | Design doc #1 tại công ty | 4 |
| `sj-gd4-w7` | Tuần 17–18 | Luyện system design có phương pháp | 4 |
| `sj-gd4-w8` | Tuần 19–20 | 4 đề nâng cao + design doc #2 + mentoring | 3 |
| `sj-gd4-w9` | Tuần 21–22 | Mock system design interview | 2 |
| `sj-gd4-w10` | Tuần 23–24 | Đóng gói hồ sơ | 4 |
| `sj-gd4-w11` | Tuần 25–26 | Buffer + phỏng vấn thật | **10** |
| `sj-gd4-done` | Nghiệm thu | Giai đoạn 4 — 7 tiêu chí bắt buộc | 7 |

Quy tắc chuyển đổi giống Task 2: mỗi bước đánh số → một `items[]` (`text` ≤ 120 ký tự, `lesson` là markdown đầy đủ của bước, kết bằng dòng `**Nguồn.** [Giai đoạn 4 — <tên tuần>](#/docs/sj-04)`); `**Mục tiêu:**` → `goal`; `**Hoàn thành khi:**` → `doneWhen`; bỏ `practice`; khối `sj-gd4-done` lấy 7 dòng `- [ ]` của checklist cuối giai đoạn, `badge: "✓"`, `week: "Nghiệm thu"`.

**Chú ý riêng của track này** — `Tuần 25–26: Buffer + phỏng vấn thật` trong nguồn không có bước đánh số. Khối này nhận trọn **10 câu** của `## Bộ câu hỏi tự kiểm tra cuối roadmap`, id `sj-gd4-w11-1` … `sj-gd4-w11-10`, `text` là **nguyên văn câu hỏi**. **Không viết đáp án** — nguồn không có, và tự soạn sẽ làm hỏng giá trị tự kiểm tra. `lesson` chỉ nêu cách tự chấm:

```js
  {
    id: "sj-gd4-w11",
    week: "Tuần 25–26",
    title: "Buffer + phỏng vấn thật",
    goal: "Dùng làm thời gian đệm, ôn theo bộ câu hỏi tự kiểm tra cuối roadmap, hoặc bắt đầu phỏng vấn.",
    items: [
      {
        id: "sj-gd4-w11-1",
        text: "Thiết kế notification system cho 10 triệu user trong 45 phút",
        lesson: `**Cách tự chấm.** Trả lời thành tiếng, bấm giờ 45 phút và ghi âm. Nghe lại và soát theo bốn lỗi phổ biến mà nguồn nêu ở tuần 17–18: quên hỏi làm rõ yêu cầu, không ước lượng số, không bàn failure mode, không chốt trade-off mà chỉ liệt kê. Ấp úng chỗ nào thì quay lại tuần tương ứng.

Tick khi trả lời trôi chảy không cần nhìn ghi chú.

**Nguồn.** [Giai đoạn 4 — Bộ câu hỏi tự kiểm tra cuối roadmap](#/docs/sj-04)`,
      },
      // … 9 câu còn lại, nguyên văn, cùng khuôn lesson …
    ],
  },
```

Tuần `sj-gd4-w5` (Tuần 9–14) trong nguồn ghi `**Cách thực hiện (quy trình lặp mỗi tuần):**` — vẫn là 5 bước đánh số, xử lý như mọi tuần khác.

- [ ] **Bước 4: Đăng ký track trong `roadmap.js`**

```js
import { seniorJavaGd4 } from "./senior-java-gd4.js";
```

```js
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
```

Cập nhật chú thích đầu tệp: thêm dòng `SJ4 : senior-java-gd4.js (Tuần 1–26) — 65 mục` và ghi tổng lĩnh vực `senior-java` là 276 mục.

- [ ] **Bước 5: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS, `roadmap-items:senior-java` = 276

- [ ] **Bước 6: Kiểm tay**

Run: `./webapp/dev.sh`
Kỳ vọng: 4 track; bảng điều khiển của lĩnh vực hiện `276 bài học`; nút "▶ Tiếp tục học" trong mỗi track nhảy đúng mục chưa tick đầu tiên.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/data/senior-java-gd4.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: track giai đoạn 4 Senior Java — hệ phân tán & system design, 65 mục"
```

---

### Task 6: Dữ liệu ma trận năng lực

**Files:**
- Create: `webapp/js/data/senior-java-matrix.js`
- Modify: `webapp/js/data/index.js`, `webapp/check-data.mjs`
- Nguồn nội dung: `/Users/tanvx/Dev/personal-platform/senior-java-tracker/src/main/resources/seed/roadmap-seed.yaml`

**Interfaces:**
- Produces:
  - `export const seniorJavaMatrix: Matrix` từ `webapp/js/data/senior-java-matrix.js`, với
    `Matrix = { id, field, title, version, modules: MatrixModule[] }`,
    `MatrixModule = { id, code, title, summary, weight, topics: MatrixTopic[] }`,
    `MatrixTopic = { id, title, importance: "HIGH"|"MEDIUM"|"LOW", checklist: Criterion[], resources: MatrixResource[] }`,
    `Criterion = { id, level: 1|2|3|4, criteria: string }`,
    `MatrixResource = { url, title, tags: string[] }`
  - Từ `webapp/js/data/index.js`: `export const allMatrices: Matrix[]`, `export const getMatrices: (fieldId: string) => Matrix[]`, `export function fieldOfMatrixModule(moduleId: string): string | null`
  - Task 7 (view) và Task 8 (bảng điều khiển) chỉ dùng ba export này, không import thẳng tệp dữ liệu.

- [ ] **Bước 1: Viết kỳ vọng và bất biến TRƯỚC**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts`:

```js
    // Ma trận năng lực Senior Java — chuyển từ roadmap-seed.yaml.
    "matrix-modules:senior-java": 6,
    "matrix-topics:senior-java": 34,
    "matrix-criteria:senior-java": 96,
```

Nạp thêm dữ liệu ma trận:

Sửa dòng `await import("./js/data/index.js")` sẵn có để lấy thêm `allMatrices` — đừng
import cùng một module lần thứ hai:

```js
const { allFlashcards: flashcards, allQuestions: questions, allMatrices: matrices } =
  await import("./js/data/index.js");
```

Rồi thêm ba dòng dẫn xuất ngay dưới khối `const allItems = …`:

```js
const matrixModules = matrices.flatMap((m) => m.modules);
const matrixTopics = matrixModules.flatMap((m) => m.topics);
const matrixCriteria = matrixTopics.flatMap((t) => t.checklist);
```

Bổ sung vào bất biến `Số lượng bản ghi khớp bảng kỳ vọng`, ngay trước dòng tính `bad`:

```js
  for (const m of matrices) {
    const f = fieldOf(m);
    actual[`matrix-modules:${f}`] = (actual[`matrix-modules:${f}`] ?? 0) + m.modules.length;
    actual[`matrix-topics:${f}`] =
      (actual[`matrix-topics:${f}`] ?? 0) + m.modules.flatMap((x) => x.topics).length;
    actual[`matrix-criteria:${f}`] = (actual[`matrix-criteria:${f}`] ?? 0)
      + m.modules.flatMap((x) => x.topics).flatMap((t) => t.checklist).length;
  }
```

Thêm bộ bất biến mới, đặt sau bất biến `#3e`:

```js
// #8 — Bất biến của ma trận năng lực.
//
// Dạng dữ liệu này (module → chủ đề → tiêu chí) không đi qua bất kỳ bất biến
// nào ở trên: chúng soát docs/tracks/flashcards/questions. Không có nhóm #8,
// một tiêu chí thiếu `level` hay một module sai `weight` sẽ render lặng lẽ sai.
await check("Id ma trận duy nhất và không đụng id lộ trình/tài liệu", () => {
  const ids = [
    ...matrixModules.map((m) => m.id),
    ...matrixTopics.map((t) => t.id),
    ...matrixCriteria.map((c) => c.id),
  ];
  const d = dupes(ids);
  expect(!d.length, `id trùng trong ma trận: ${d.join(", ")}`);
  const taken = new Set([...docs.map((x) => x.id), ...allItems.map((x) => x.id)]);
  const clash = ids.filter((id) => taken.has(id));
  expect(!clash.length, `id ma trận đụng id tài liệu/lộ trình: ${clash.join(", ")}`);
});

await check("Id con của ma trận khớp tiền tố id cha", () => {
  const bad = [];
  for (const m of matrixModules) {
    for (const t of m.topics) {
      if (!t.id.startsWith(`${m.id}-`)) bad.push(`${t.id} không thuộc ${m.id}`);
      for (const c of t.checklist) {
        if (!c.id.startsWith(`${t.id}-`)) bad.push(`${c.id} không thuộc ${t.id}`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});

await check("Tiêu chí có level 1–4 và nội dung không rỗng", () => {
  const bad = matrixCriteria
    .filter((c) => ![1, 2, 3, 4].includes(c.level) || !String(c.criteria ?? "").trim())
    .map((c) => c.id);
  expect(!bad.length, `tiêu chí sai level hoặc rỗng: ${bad.join(", ")}`);
});

await check("Mức quan trọng của chủ đề hợp lệ", () => {
  const ok = ["HIGH", "MEDIUM", "LOW"];
  const bad = matrixTopics.filter((t) => !ok.includes(t.importance)).map((t) => t.id);
  expect(!bad.length, `importance sai: ${bad.join(", ")}`);
});

await check("Tổng trọng số các module của mỗi ma trận bằng 100", () => {
  const bad = matrices
    .map((m) => [m.id, m.modules.reduce((s, x) => s + x.weight, 0)])
    .filter(([, sum]) => sum !== 100)
    .map(([id, sum]) => `${id}: tổng weight = ${sum}`);
  expect(!bad.length, bad.join("; "));
});

await check("Tài nguyên của ma trận là URL http(s)", () => {
  const bad = [];
  for (const t of matrixTopics) {
    for (const r of t.resources ?? []) {
      if (!/^https?:\/\//.test(r.url ?? "")) bad.push(`${t.id} → ${r.url}`);
    }
  }
  expect(!bad.length, `url không hợp lệ: ${bad.join(", ")}`);
});
```

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL khi nạp — `Cannot find module` hoặc `allMatrices is not defined`, vì `data/index.js` chưa export.

- [ ] **Bước 3: Chuyển seed YAML sang JS**

Tạo `webapp/js/data/senior-java-matrix.js`. Chuyển từng module theo đúng thứ tự trong `roadmap-seed.yaml`: M1 (weight 20), M2 (20), M3 (18), M4 (14), M5 (14), M6 (14) — tổng 100.

Sơ đồ id, chốt cứng: module `sj-m<N>`, chủ đề `sj-m<N>-t<M>`, tiêu chí `sj-m<N>-t<M>-c<K>`, đánh số từ 1 theo thứ tự xuất hiện trong YAML.

```js
// Ma trận năng lực Senior Java 2026 — module → chủ đề → tiêu chí tự đánh giá.
//
// Chuyển đổi MỘT LẦN từ roadmap-seed.yaml của kho personal-platform
// (senior-java-tracker, phiên bản seed "2026.08"). TỆP NÀY LÀ NGUỒN SỰ THẬT
// MỚI — sửa thẳng ở đây, không sinh lại từ YAML.
//
// Bản sinh cũ đặt id theo VỊ TRÍ trong YAML, nên đảo thứ tự là đổi id. Viết
// thẳng vào JS khử được điểm mong manh đó: id giờ là hằng, đảo thứ tự không
// làm mất tiến độ.
//
// GIỮ NGUYÊN id (sj-m<N> / sj-m<N>-t<M> / sj-m<N>-t<M>-c<K>) — tiến độ
// localStorage lưu theo id tiêu chí.
//
// level: 1 = Hiểu lý thuyết · 2 = Thực thi mã nguồn ·
//        3 = Phân tích đánh đổi · 4 = Thiết kế & xử lý sự cố

export const seniorJavaMatrix = {
  id: "senior-java-2026",
  field: "senior-java",
  title: "Ma trận năng lực Senior Java 2026 (Java 25 · Spring Boot 4.1)",
  version: "2026.08",
  modules: [
    {
      id: "sj-m1",
      code: "M1",
      title: "Java 25 Core, Concurrency & JVM Internals",
      summary: "Làm chủ nền tảng Java 25 LTS: virtual threads hậu JEP 491, structured concurrency, scoped values, JMM, GC thế hệ mới và bộ công cụ chẩn đoán.",
      weight: 20,
      topics: [
        {
          id: "sj-m1-t1",
          title: "Virtual threads & Project Loom",
          importance: "HIGH",
          checklist: [
            { id: "sj-m1-t1-c1", level: 1, criteria: "Giải thích cơ chế carrier thread, continuation, mount/unmount của virtual thread" },
            { id: "sj-m1-t1-c2", level: 1, criteria: "Trình bày lịch sử pinning: vì sao synchronized từng gây pinned thread và JEP 491 (JDK 24) đã sửa thế nào; trường hợp nào vẫn còn pinning (native frame)" },
            { id: "sj-m1-t1-c3", level: 3, criteria: "Phân tích khi nào virtual threads KHÔNG giúp ích (CPU-bound, thread-local nặng, pool tài nguyên giới hạn)" },
          ],
          resources: [
            { url: "https://openjdk.org/jeps/444", title: "JEP 444: Virtual Threads", tags: ["java25", "loom"] },
            { url: "https://openjdk.org/jeps/491", title: "JEP 491: Synchronize Virtual Threads without Pinning", tags: ["java25", "loom"] },
          ],
        },
        // … các chủ đề còn lại của M1 …
      ],
    },
    // … M2 đến M6 …
  ],
};
```

Giữ nguyên văn `criteria`, `title`, `summary`, `tags` và `url` của YAML.
> Dấu `…` trong mẫu mã dưới đây **không phải việc để lại làm sau**: nó đánh dấu chỗ
> chép tiếp từ tệp nguồn theo đúng quy tắc chuyển đổi vừa nêu. Bảng số mục ở trên và
> bất biến đếm trong `check-data.mjs` là thứ bắt lỗi nếu chép thiếu hoặc chép thừa.
 Các chủ đề "Capstone M*" **giữ lại** — chúng vẫn là tiêu chí năng lực hợp lệ; chỉ bỏ ngữ cảnh dự án tracker nếu câu chữ nhắc tới nó. Không mang sang `progress`, `notes`, `bookmarks`, `timeline`, `versionTags`.

Nếu tệp vượt 600 dòng, tách `senior-java-matrix-part1.js` (M1–M3) và `-part2.js` (M4–M6), rồi ghép trong `senior-java-matrix.js` — đúng nếp `roadmap-part*.js` sẵn có.

- [ ] **Bước 4: Mở lối truy cập trong `data/index.js`**

Trong `webapp/js/data/index.js`, thêm import và export:

```js
import { seniorJavaMatrix } from "./senior-java-matrix.js";
```

```js
export const allMatrices = [seniorJavaMatrix];
export const getMatrices = by(allMatrices);

// Suy lĩnh vực từ id module của ma trận — dùng cho deep-link #/tracker/<id>,
// đối xứng fieldOfTrack(). Không có nó, mở #/tracker/sj-m4 khi đang đứng ở
// lĩnh vực khác sẽ bị moduleAllowed() đá về bảng điều khiển.
export function fieldOfMatrixModule(moduleId) {
  for (const m of allMatrices) {
    if (m.modules.some((x) => x.id === moduleId)) return fieldOfRecord(m);
  }
  return null;
}
```

- [ ] **Bước 5: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS. Nếu `matrix-criteria:senior-java` lệch 96 thì thiếu tiêu chí — đối chiếu lại YAML nguồn theo từng module.

- [ ] **Bước 6: Commit**

```bash
git add webapp/js/data/senior-java-matrix.js webapp/js/data/index.js webapp/check-data.mjs
git commit -m "feat: ma trận năng lực Senior Java — 6 module, 34 chủ đề, 96 tiêu chí"
```

---

### Task 7: View ma trận năng lực

**Files:**
- Create: `webapp/js/views/tracker.js`
- Modify: `webapp/js/app.js`, `webapp/js/data/fields.js`, `webapp/js/lib/store.js`, `webapp/check-data.mjs`

**Interfaces:**
- Consumes: `getMatrices(fieldId)` và `fieldOfMatrixModule(moduleId)` từ `webapp/js/data/index.js` (Task 6); `h`, `pageHead`, `inlineMd` từ `webapp/js/lib/ui.js`; `store` từ `webapp/js/lib/store.js`; `currentField` từ `webapp/js/lib/field.js`.
- Produces: `export function render(root, params)` trong `views/tracker.js` — `params[0]` là id module cần mở sẵn. Khoá localStorage `tracker.checked` = `{ [criteriaId]: true }`.

- [ ] **Bước 1: Mở rộng bất biến #7 và #7c cho module `tracker`**

Trong `webapp/check-data.mjs`, bất biến #7, thêm khoá vào bảng `has`:

```js
      tracker: matrices.some((m) => fieldOf(m) === id),
```

Bất biến #7c, thêm chiều ngược:

```js
    const hasMatrix = matrices.some((m) => fieldOf(m) === id);
    if (hasMatrix && !f.modules.includes("tracker")) {
      bad.push(`${id} có ma trận năng lực nhưng không khai module "tracker"`);
    }
```

- [ ] **Bước 2: Chạy check-data để thấy nó đỏ**

Run: `node webapp/check-data.mjs`
Expected: FAIL — `senior-java có ma trận năng lực nhưng không khai module "tracker"`

- [ ] **Bước 3: Viết `views/tracker.js`**

```js
// Ma trận năng lực — module → chủ đề → tiêu chí tự đánh giá theo 4 cấp độ.
//
// Khác lộ trình học ở trục dữ liệu: lộ trình chia theo TUẦN và mỗi mục là một
// bài học; ma trận chia theo MODULE NĂNG LỰC và mỗi mục là một tiêu chí tự
// chấm. Vì vậy có view riêng thay vì nhánh thứ hai trong views/roadmap.js.
//
// Tiến độ lưu ở khoá riêng "tracker.checked", tách khỏi "roadmap.checked":
// hai không gian id khác nhau và người dùng đặt lại được từng cái.

import { h, pageHead, inlineMd } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getMatrices } from "../data/index.js";
import { currentField } from "../lib/field.js";

const LEVELS = [
  { n: 1, label: "Hiểu lý thuyết" },
  { n: 2, label: "Thực thi mã nguồn" },
  { n: 3, label: "Phân tích đánh đổi" },
  { n: 4, label: "Thiết kế & xử lý sự cố" },
];

const IMPORTANCE = {
  HIGH: { label: "Cao", color: "red" },
  MEDIUM: { label: "Trung bình", color: "amber" },
  LOW: { label: "Thấp", color: "blue" },
};

export function render(root, params) {
  const matrix = getMatrices(currentField())[0];
  if (!matrix) {
    root.append(h("div", { class: "page" },
      pageHead("📊 Ma trận năng lực", "Lĩnh vực này chưa có ma trận năng lực.")));
    return;
  }
  renderMatrix(root, matrix, params[0]);
}

function renderMatrix(root, matrix, focusModuleId) {
  const page = h("div", { class: "page" });
  const checked = store.get("tracker.checked", {});

  const allCriteria = matrix.modules
    .flatMap((m) => m.topics)
    .flatMap((t) => t.checklist);
  const doneCount = () => allCriteria.filter((c) => checked[c.id]).length;

  const refreshers = [];
  const progressBar = h("span", {});
  const progressText = h("span", { style: "font-weight:700" });

  function refreshProgress() {
    const done = doneCount();
    const pct = Math.round((done / allCriteria.length) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = `${done}/${allCriteria.length} tiêu chí · ${pct}%`;
    refreshers.forEach((f) => f());
  }

  page.append(pageHead(
    `📊 ${matrix.title}`,
    `${matrix.modules.length} module năng lực, ${allCriteria.length} tiêu chí tự đánh giá theo 4 cấp độ. ` +
    "Tick khi bạn tự tin trình bày được tiêu chí đó mà không cần nhìn tài liệu."
  ));

  const nextBtn = h("button", { class: "btn btn-primary btn-sm" }, "▶ Tiêu chí kế tiếp");
  const openers = new Map();
  nextBtn.addEventListener("click", () => {
    const next = allCriteria.find((c) => !checked[c.id]);
    if (!next) { alert("Bạn đã đạt toàn bộ tiêu chí của ma trận! 🎉"); return; }
    openers.get(next.id)?.();
  });

  page.append(
    h("div", { class: "card", style: "margin-bottom:16px" },
      h("div", { class: "flex spread" },
        h("strong", {}, "Tiến độ ma trận năng lực"),
        progressText),
      h("div", { class: "progress green", style: "margin-top:8px" }, progressBar),
      h("div", { class: "flex", style: "margin-top:12px" },
        nextBtn,
        h("button", {
          class: "btn btn-sm btn-danger",
          onclick: () => {
            if (confirm("Xóa tiến độ ma trận năng lực? (Lộ trình học không bị ảnh hưởng)")) {
              for (const c of allCriteria) delete checked[c.id];
              store.set("tracker.checked", checked);
              location.reload();
            }
          },
        }, "Đặt lại tiến độ")))
  );

  // Bảng cấp độ — phần riêng của view này: thấy ngay mình mạnh ở tầng nào.
  const levelGrid = h("div", {
    class: "grid",
    style: "margin-bottom:18px;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr))",
  });
  for (const lv of LEVELS) {
    const total = allCriteria.filter((c) => c.level === lv.n).length;
    const bar = h("span", {});
    const txt = h("span", { class: "small", style: "font-weight:700" });
    refreshers.push(() => {
      const done = allCriteria.filter((c) => c.level === lv.n && checked[c.id]).length;
      bar.style.width = (total ? (done / total) * 100 : 0) + "%";
      txt.textContent = `${done}/${total}`;
    });
    levelGrid.append(
      h("div", { class: "card" },
        h("div", { class: "flex spread" },
          h("strong", {}, `L${lv.n} · ${lv.label}`), txt),
        h("div", { class: "progress", style: "margin-top:8px;height:5px" }, bar))
    );
  }
  page.append(levelGrid);

  const firstOpen = matrix.modules.find(
    (m) => m.topics.some((t) => t.checklist.some((c) => !checked[c.id])))?.id;

  for (const mod of matrix.modules) {
    const modCriteria = mod.topics.flatMap((t) => t.checklist);
    const modNum = h("div", { class: "week-num" }, mod.code);
    const modCount = h("span", { class: "faint", style: "white-space:nowrap" });
    const modBar = h("span", {});
    const body = h("div", { style: "margin-top:12px" });

    refreshers.push(() => {
      const d = modCriteria.filter((c) => checked[c.id]).length;
      modCount.textContent = `${d}/${modCriteria.length}`;
      modBar.style.width = `${(d / modCriteria.length) * 100}%`;
      modNum.classList.toggle("done", d === modCriteria.length);
    });

    const details = h("details", { class: "card week-card" },
      h("summary", { class: "week-head", style: "list-style:none" },
        modNum,
        h("div", { class: "grow", style: "min-width:0" },
          h("div", { class: "lab-title" }, mod.title),
          h("div", { class: "muted small" }, mod.summary),
          h("div", { class: "progress", style: "margin-top:7px;height:5px;max-width:220px" }, modBar)),
        h("span", { class: "badge" }, `trọng số ${mod.weight}%`),
        modCount),
      body);

    for (const topic of mod.topics) {
      const imp = IMPORTANCE[topic.importance] ?? IMPORTANCE.MEDIUM;
      const block = h("div", { class: "lesson-item", style: "padding:10px 0" },
        h("div", { class: "flex flex-wrap" },
          h("strong", {}, topic.title),
          h("span", { class: `badge badge-${imp.color}` }, `Quan trọng: ${imp.label}`)));

      if (topic.resources?.length) {
        block.append(
          h("div", { class: "chip-row", style: "margin:8px 0" },
            topic.resources.map((r) =>
              h("a", { class: "chip", href: r.url, target: "_blank", rel: "noopener" },
                `${r.title} ↗`))));
      }

      for (const c of topic.checklist) {
        const cb = h("input", { type: "checkbox", title: "Đánh dấu đã đạt tiêu chí" });
        cb.checked = !!checked[c.id];
        const row = h("label", { class: `check-item${cb.checked ? " done" : ""}` },
          cb,
          h("span", { class: "badge", style: "flex:none" }, `L${c.level}`),
          h("span", { class: "check-text", html: inlineMd(c.criteria) }));
        cb.addEventListener("change", () => {
          if (cb.checked) checked[c.id] = true;
          else delete checked[c.id];
          store.set("tracker.checked", checked);
          row.classList.toggle("done", cb.checked);
          refreshProgress();
        });
        openers.set(c.id, () => {
          details.setAttribute("open", "");
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        block.append(row);
      }
      body.append(block);
    }

    if (mod.id === firstOpen) details.setAttribute("open", "");
    page.append(details);
  }

  refreshProgress();
  root.append(page);

  if (focusModuleId) {
    const target = matrix.modules.find((m) => m.id === focusModuleId);
    if (target) {
      const first = target.topics.flatMap((t) => t.checklist)[0];
      if (first) setTimeout(() => openers.get(first.id)?.(), 60);
    }
  }
}
```

- [ ] **Bước 4: Đăng ký route và mục nav**

Trong `webapp/js/app.js`: thêm import, thêm vào `routes`, và mở rộng đoạn suy lĩnh vực ngược trong `navigate()`.

```js
import * as tracker from "./views/tracker.js";
```

```js
import { fieldOfDoc, fieldOfTrack, fieldOfMatrixModule } from "./data/index.js";
```

```js
const routes = {
  dashboard,
  certs,
  roadmap,
  docs,
  commands,
  flashcards,
  quiz,
  exam,
  labs,
  tracker,
};
```

Trong `navigate()`, ngay sau dòng suy lĩnh vực của `roadmap`:

```js
  if (name === "tracker" && params[0]) owner = fieldOfMatrixModule(params[0]);
```

Trong `webapp/js/data/fields.js`, thêm vào nhóm "Tổng quan" của `NAV_GROUPS`, ngay sau `roadmap`:

```js
      { id: "tracker",    label: "Ma trận năng lực", icon: "📊", href: "#/tracker" } ] },
```

và mở module cho lĩnh vực:

```js
    modules: ["dashboard", "docs", "roadmap", "tracker"],
```

- [ ] **Bước 5: Ghi khoá mới vào bảng chú thích của `store.js`**

Trong `webapp/js/lib/store.js`, thêm một dòng vào khối chú thích cuối tệp:

```js
// tracker.checked       : { [criteriaId]: true }   (ma trận năng lực)
```

- [ ] **Bước 6: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS

- [ ] **Bước 7: Kiểm tay**

Run: `./webapp/dev.sh`
Kỳ vọng:
- Nav lĩnh vực Senior Java có 4 mục, gồm "Ma trận năng lực".
- Trang `#/tracker` hiện 4 thẻ cấp độ, 6 khối module có chip trọng số, mỗi chủ đề có huy hiệu mức quan trọng.
- Tick một tiêu chí → thanh tổng, thẻ cấp độ tương ứng và thanh module đều nhúc nhích. Tải lại trang, dấu tick còn nguyên.
- Nút "▶ Tiêu chí kế tiếp" mở đúng module và cuộn tới tiêu chí chưa tick đầu tiên.
- Đứng ở lĩnh vực Kubernetes, dán `#/tracker/sj-m4` vào thanh địa chỉ → tự chuyển sang lĩnh vực Senior Java và mở module M4.
- Tiến độ lộ trình (`roadmap.checked`) không đổi sau khi "Đặt lại tiến độ" của ma trận.

- [ ] **Bước 8: Commit**

```bash
git add webapp/js/views/tracker.js webapp/js/app.js webapp/js/data/fields.js webapp/js/lib/store.js webapp/check-data.mjs
git commit -m "feat: view ma trận năng lực với tick theo tiêu chí và bảng 4 cấp độ"
```

---

### Task 8: Bảng điều khiển

**Files:**
- Modify: `webapp/js/views/dashboard.js`

**Interfaces:**
- Consumes: `getMatrices(fieldId)` từ `data/index.js` (Task 6); khoá `tracker.checked` (Task 7).

Task này gồm hai lỗi **sẵn có** của `dashboard.js` và một phần thêm mới. Hai lỗi cũ chưa lộ vì bốn lĩnh vực đầu đều có tài liệu, nhưng vẫn sai với bất kỳ lĩnh vực nào không có `docs`.

- [ ] **Bước 1: Tự tái hiện hai lỗi sẵn có**

Tạm sửa `modules` của `"senior-java"` trong `fields.js` thành `["dashboard", "roadmap", "tracker"]` (bỏ `docs`), chạy `./webapp/dev.sh`, mở bảng điều khiển của lĩnh vực đó.

Quan sát cần ghi lại: hero vẫn có nút `📚 Đọc tài liệu`, "Khu vực học tập" vẫn có thẻ `Thư viện tài liệu` — cả hai dẫn tới trang rỗng; dải tổng quan hiện `0 tài liệu`.

**Hoàn tác thay đổi tạm** trong `fields.js` trước khi sang bước sau.

- [ ] **Bước 2: Sửa nút hero và thẻ khu vực để tôn trọng `has("docs")`**

Trong `webapp/js/views/dashboard.js`, trong khối `h("div", { class: "hero" }, …)`:

```js
        has("docs") ? h("a", { class: "btn", href: "#/docs" }, "📚 Đọc tài liệu") : null,
        has("tracker") ? h("a", { class: "btn", href: "#/tracker" }, "📊 Ma trận năng lực") : null)));
```

Trong mảng `areas`, đổi thẻ tài liệu từ vô điều kiện sang có điều kiện:

```js
    has("docs")
      ? area("📚", "Thư viện tài liệu", `${getDocs(fieldKey).length} tài liệu của lĩnh vực ${field.label} — mục lục nổi, sơ đồ mermaid, ảnh minh hoạ, copy nhanh.`, "#/docs")
      : null,
```

- [ ] **Bước 3: Sửa dải tổng quan để không in "0 tài liệu"**

Trong vòng `for (const id of FIELD_ORDER)`, đổi cách dựng `parts`:

```js
    const parts = [];
    const nDocs = getDocs(id).length;
    if (nDocs) parts.push(`${nDocs} tài liệu`);
```

- [ ] **Bước 4: Thêm thống kê ma trận năng lực**

Thêm import:

```js
import { getDocs, getFlashcards, getQuestions, getMatrices, getTracks } from "../data/index.js";
```

Thêm hàm thống kê cạnh `roadmapStats`:

```js
function matrixStats(fieldKey) {
  const checked = store.get("tracker.checked", {});
  const all = getMatrices(fieldKey)
    .flatMap((m) => m.modules)
    .flatMap((m) => m.topics)
    .flatMap((t) => t.checklist);
  const done = all.filter((c) => checked[c.id]).length;
  return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
}
```

Trong `render()`, sau `const rm = roadmapStats(fieldKey);`:

```js
  const mx = matrixStats(fieldKey);
```

Thêm số tiêu chí vào dải tổng quan, sau nhánh đếm câu hỏi:

```js
    const cr = getMatrices(id)
      .flatMap((m) => m.modules).flatMap((m) => m.topics)
      .flatMap((t) => t.checklist).length;
    if (cr) parts.push(`${cr} tiêu chí`);
```

Thêm thẻ thống kê vào mảng `cards`, và cho lưới hiện cả khi lĩnh vực chỉ có `tracker`:

```js
    has("tracker")
      ? statCard(`${mx.pct}%`, "Ma trận năng lực", "#/tracker", `${mx.done}/${mx.total} tiêu chí`)
      : null,
```

```js
  if (has("roadmap") || has("tracker")) {
```

Thêm thẻ khu vực vào mảng `areas`:

```js
    has("tracker") ? area("📊", "Ma trận năng lực", `${mx.total} tiêu chí tự đánh giá theo 4 cấp độ, nhóm theo ${getMatrices(fieldKey)[0]?.modules.length ?? 0} module năng lực.`, "#/tracker") : null,
```

- [ ] **Bước 5: Chạy check-data — phải xanh**

Run: `node webapp/check-data.mjs`
Expected: PASS (dashboard không có bất biến riêng; bước này chỉ để chắc không làm hỏng import).

- [ ] **Bước 6: Kiểm tay cả 5 lĩnh vực**

Run: `./webapp/dev.sh`
Kỳ vọng:
- Senior Java: dải tổng quan ghi `5 tài liệu · 276 bài học · 96 tiêu chí`; có 2 thẻ thống kê (lộ trình và ma trận); "Khu vực học tập" có cả 3 thẻ.
- Kubernetes, Lập trình hệ thống, Java, Spring Security: không đổi so với trước task này — đối chiếu bằng cách xem lại từng lĩnh vực.
- Lặp lại phép thử ở Bước 1 (tạm bỏ `docs` khỏi `modules`): nút và thẻ tài liệu **biến mất**, dải tổng quan không còn "0 tài liệu". Hoàn tác sau khi kiểm.

- [ ] **Bước 7: Commit**

```bash
git add webapp/js/views/dashboard.js
git commit -m "fix: bảng điều khiển tôn trọng has(docs) và thêm thống kê ma trận năng lực"
```

---

### Task 9: Cập nhật tài liệu dự án

**Files:**
- Modify: `webapp/README.md`, `README.md`, `webapp/index.html`

- [ ] **Bước 1: Cập nhật `webapp/README.md`**

- Câu mở đầu: thêm lĩnh vực thứ 5 vào danh sách.
- Bảng tính năng: sửa số liệu Lộ trình học (thêm 4 giáo trình Senior Java, 276 mục — tổng track thành 10) và Thư viện tài liệu (78 tài liệu thuộc 5 lĩnh vực: 24 Kubernetes, 18 System Programming, 10 Java & Spring Boot Scalability, 21 Spring Security, 5 Lộ trình Senior Java). Thêm một dòng cho trang `📊 Ma trận năng lực`.
- Mục "Bộ chọn lĩnh vực": thêm `Lộ trình Senior Java` vào danh sách và nêu nó có 4 module.
- Mục "Chạy local": thêm `senior-java-roadmap/` vào danh sách thư mục được `build-content.sh` copy.
- Cây "Cấu trúc mã": thêm `senior-java-gd{1..4}.js`, `senior-java-matrix.js` dưới `js/data/`, và `tracker` vào danh sách `js/views/`.

- [ ] **Bước 2: Cập nhật `README.md` gốc**

Sửa số lĩnh vực (4 → 5), thêm `senior-java-roadmap/` vào mô tả cấu trúc thư mục, và cập nhật mọi con số tổng bị ảnh hưởng.

- [ ] **Bước 3: Cập nhật `<meta name="description">` trong `webapp/index.html`**

Thẻ này đang liệt kê 3 lĩnh vực — lỗi thời từ trước khi có Spring Security. Viết lại cho đủ 5:

```html
  <meta name="description" content="Nền tảng học đa lĩnh vực: Kubernetes & chứng chỉ (CKAD, CKA, CKS), Lập trình hệ thống (UIUC CS 241), Java & Spring Boot Scalability, Spring Security và lộ trình Senior Java 24 tháng. Tài liệu, lộ trình, ma trận năng lực, flashcards, trắc nghiệm, thi thử và labs thực hành." />
```

- [ ] **Bước 4: Nghiệm thu toàn bộ**

Run: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs`
Expected: PASS toàn bộ, `Dữ liệu hợp lệ.`

Run: `./webapp/dev.sh` và chạy hết danh sách nghiệm thu ở mục 12 của spec:
- Bộ chọn hiện 5 lĩnh vực; nav `senior-java` đúng 4 mục.
- 4 track ở trang lộ trình; hộp "Hoàn thành khi" hiện đúng; khối nghiệm thu cuối có huy hiệu ✓; nhãn "Tuần 21–24" không tràn.
- Tick một bước lộ trình và một tiêu chí ma trận, tải lại — cả hai còn nguyên.
- Đổi lĩnh vực rồi quay lại — không mất tiến độ, nav đúng.
- Deep-link `#/tracker/sj-m4` và `#/roadmap/sj-gd3` mở đúng khi đang đứng ở lĩnh vực Kubernetes.
- Mở 5 tài liệu mới, mục lục nổi hoạt động.
- Tiến độ 4 lĩnh vực cũ không đổi.

- [ ] **Bước 5: Commit**

```bash
git add webapp/README.md README.md webapp/index.html
git commit -m "docs: cập nhật số liệu và danh sách lĩnh vực sau khi thêm Lộ trình Senior Java"
```
