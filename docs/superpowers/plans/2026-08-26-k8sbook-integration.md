# Kubernetes in Action → DevPrep (Đợt 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa 17 chương bản dịch *Kubernetes in Action* (ấn bản 2) vào lĩnh vực `kubernetes` của DevPrep thành thư viện tài liệu đọc được trong app, cộng một giáo trình đọc sách 9 tuần / 30 mục, cộng bảng liên kết chéo từ ba giáo trình chứng chỉ sang chương sách tương ứng.

**Architecture:** App tĩnh vanilla ES modules, không build step. Nội dung markdown nằm trong repo và được `build-content.sh` copy vào `webapp/content/` lúc chạy dev/deploy. Dữ liệu học tập là các module ES trong `webapp/js/data/`; `check-data.mjs` chạy bằng `node` là bộ test duy nhất của repo. Liên kết chéo dùng bảng ánh xạ riêng merge tại tầng dữ liệu (`roadmap.js`) nên 154 mục lộ trình cũ không phải đổi và các bất biến link sẵn có tự động phủ lên link mới.

**Tech Stack:** Vanilla ES modules · Node ≥ 22 (chỉ để chạy `check-data.mjs`) · bash · python3 `http.server` (dev) · GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-08-26-k8sbook-springsec-design.md`

## Global Constraints

- **Không thêm dependency.** Repo không có `node_modules`, không bundler. `webapp/package.json` chỉ chứa `{"type": "module"}`.
- **Không đổi id đã tồn tại.** Id tuần (`w1`, `cka-w1`, `cks-w1`, `sp-w1`…) và id mục lộ trình là khoá lưu tiến độ trong `localStorage`. Đổi = xoá tiến độ người dùng.
- **Bản ghi Kubernetes cũ không khai trường `field`** — mặc định `"kubernetes"` tại lớp truy cập. Bản ghi MỚI của đợt này **phải** khai `field: "kubernetes"` tường minh.
- **Không sửa markdown nguồn** trong `k8s-ebook/`. Đó là bản dịch, không phải mã nguồn app.
- **Chỉ khai một module cho lĩnh vực khi lĩnh vực đó ĐÃ có dữ liệu** (bất biến #7).
- **Bảng `EXPECTED.counts` trong `check-data.mjs` sửa TRƯỚC khi viết dữ liệu**, để mỗi task bắt đầu bằng một lần chạy đỏ.
- Toàn bộ văn bản hướng tới người dùng viết **tiếng Việt**, bám giọng văn hiện có (xưng "bạn", không dùng "chúng ta" trong phần chỉ dẫn).
- Mọi commit dùng tiếng Việt, tiền tố `feat:` / `fix:` / `docs:` như lịch sử repo.
- Lệnh kiểm sau mỗi task: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs`

## File Structure

**Tạo mới:**

| File | Trách nhiệm |
|---|---|
| `webapp/js/data/k8sbook-roadmap-part1.js` | Tuần 1–5 của track đọc sách (18 mục). Chỉ dữ liệu, không logic. |
| `webapp/js/data/k8sbook-roadmap-part2.js` | Tuần 6–9 của track đọc sách (12 mục). Chỉ dữ liệu, không logic. |
| `webapp/js/data/k8sbook-crossref.js` | Bảng ánh xạ id tuần chứng chỉ → id chương sách. Chỉ dữ liệu, không logic. |

**Sửa:**

| File | Sửa gì |
|---|---|
| `webapp/build-content.sh` | 4 dòng copy markdown + ảnh sách |
| `webapp/js/views/docs.js` | 1 dòng `img.loading = "lazy"` trong `fixRelativePaths()` |
| `webapp/js/data/docs-index.js` | +17 mục docs `k8sbook-*` |
| `webapp/js/data/roadmap.js` | import 2 part mới + `k8sbook-crossref.js`, hàm merge, đăng ký track `k8sbook` |
| `webapp/check-data.mjs` | bảng kỳ vọng + 3 bất biến mới (N1, N2, N3) |
| `README.md`, `webapp/README.md` | số liệu và bảng thành phần |

**Lý do tách 3 file dữ liệu mới thay vì nhét vào file sẵn có:** `roadmap.js` là file đăng ký track, đang giữ đúng một trách nhiệm đó và chỉ dài ~80 dòng; 30 mục lộ trình (~1200 dòng) nhét vào sẽ phá vỡ nó. Cách tách part1/part2 bám đúng khuôn `sysprog-roadmap-part{1,2}.js` và `cks-roadmap-part{1,2}.js` đã có.

---

### Task 1: Đưa nội dung sách vào pipeline build

**Files:**
- Modify: `webapp/build-content.sh`
- Modify: `webapp/js/views/docs.js` (hàm `fixRelativePaths`, khoảng dòng 144–152)

**Interfaces:**
- Consumes: nguồn `k8s-ebook/*.md` và `k8s-ebook/images/ch00…ch17/` đã có trong repo.
- Produces: thư mục `<dest>/k8sbook/` chứa 17 file `.md` và `<dest>/k8sbook/images/chNN/` chứa 184 ảnh. Task 2 dùng đường dẫn `content/k8sbook/<tên gốc>.md` làm giá trị `file` của docs.

- [ ] **Step 1: Viết lệnh kiểm chứng — phải thất bại**

```bash
./webapp/build-content.sh webapp/content
test -d webapp/content/k8sbook && echo "CÓ" || echo "KHÔNG CÓ"
```

Kỳ vọng: in `KHÔNG CÓ`.

- [ ] **Step 2: Sửa `webapp/build-content.sh`**

Đổi khối `mkdir` và thêm 3 dòng `cp`. File sau khi sửa, từ dòng `mkdir -p` trở đi:

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images"

cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
cp "$REPO"/k8s-ebook/*.md                               "$DEST/k8sbook/"
cp -R "$REPO"/k8s-ebook/images/.                        "$DEST/k8sbook/images/"
```

`cp -R` là bắt buộc: `k8s-ebook/images/` có 17 thư mục con `chNN`, khác `images/` phẳng của lĩnh vực Java. Dấu `/.` ở cuối nguồn copy *nội dung* thư mục chứ không lồng thêm một cấp `images/images`.

- [ ] **Step 3: Chạy lại lệnh kiểm chứng — phải thành công**

```bash
rm -rf webapp/content
./webapp/build-content.sh webapp/content
echo "md:    $(ls webapp/content/k8sbook/*.md | wc -l | tr -d ' ')  (kỳ vọng 18)"
echo "thumuc:$(ls webapp/content/k8sbook/images | wc -l | tr -d ' ')  (kỳ vọng 17)"
echo "anh:   $(find webapp/content/k8sbook/images -type f | wc -l | tr -d ' ')  (kỳ vọng 184)"
test -f webapp/content/k8sbook/images/ch05/hinh-5.1.png && echo "ảnh mẫu OK"
```

Kỳ vọng: `md: 18` (17 chương + `README.md` cũng được copy, vô hại — không có mục docs nào trỏ tới nó), `thumuc: 17`, `anh: 184`, `ảnh mẫu OK`.

- [ ] **Step 4: Xác minh ba nơi gọi vẫn dùng chung một script**

```bash
grep -n "build-content.sh" webapp/dev.sh Dockerfile .github/workflows/deploy-pages.yml
```

Kỳ vọng: 4 dòng khớp (dev.sh 1, Dockerfile 1, workflow 2). Không sửa gì ở ba file này.

- [ ] **Step 5: Thêm lazy-load ảnh trong `webapp/js/views/docs.js`**

Trong hàm `fixRelativePaths`, thêm đúng một dòng vào thân vòng lặp:

```js
function fixRelativePaths(prose, docFile) {
  const dir = docFile.slice(0, docFile.lastIndexOf("/") + 1);
  const base = new URL(dir, document.baseURI);
  prose.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    const src = img.getAttribute("src") || "";
    if (/^(https?:|data:|\/)/i.test(src)) return;
    img.src = new URL(src, base).href;
  });
}
```

Đặt `img.loading` **trước** câu `return` sớm, để ảnh tuyệt đối (nếu có) cũng được lazy-load.

- [ ] **Step 6: Kiểm bằng tay rằng tài liệu cũ chưa hỏng**

```bash
./webapp/dev.sh
```

Mở `http://localhost:8888/#/docs/java-01` (lĩnh vực Java) và một tài liệu sysprog có ảnh. Ảnh vẫn hiện đúng. Dừng server.

- [ ] **Step 7: Commit**

```bash
git add webapp/build-content.sh webapp/js/views/docs.js
git commit -m "feat: copy bản dịch Kubernetes in Action vào content/ và lazy-load ảnh"
```

---

### Task 2: 17 tài liệu Kubernetes in Action

**Files:**
- Modify: `webapp/js/data/docs-index.js` (thêm vào cuối mảng `docs`)
- Modify: `webapp/check-data.mjs` (bảng `EXPECTED.counts`)

**Interfaces:**
- Consumes: `content/k8sbook/*.md` do Task 1 sinh ra.
- Produces: 17 doc id `k8sbook-00`, `k8sbook-02` … `k8sbook-17`, tất cả `field: "kubernetes"`. Task 4, 5, 6 tham chiếu các id này qua link `#/docs/<id>`.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa dòng có sẵn:

```js
    "docs:kubernetes": 24,
```

(đang là `7`)

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `docs:kubernetes: kỳ vọng 24, thực tế 7`.

- [ ] **Step 3: Thêm 17 entry vào cuối mảng `docs` trong `webapp/js/data/docs-index.js`**

Chèn ngay trước dấu `];` đóng mảng:

```js
  // ===== Kubernetes in Action, ấn bản 2 (bản dịch) — đọc theo thứ tự chương =====
  // Chương 1 không có nội dung trong tài liệu HTML gốc, chỉ xuất hiện ở mục lục.
  {
    id: "k8sbook-00",
    field: "kubernetes",
    title: "KIA 00 — Mở đầu: về cuốn sách",
    file: "content/k8sbook/00-mo-dau.md",
    icon: "📖",
    desc: "Lời chào của tác giả, cấu trúc cuốn sách và cách đọc. Đọc dạo đầu trước khi vào chương 2.",
    tags: ["Kubernetes in Action", "Mở đầu"],
  },
  {
    id: "k8sbook-02",
    field: "kubernetes",
    title: "KIA 02 — Tìm hiểu về container",
    file: "content/k8sbook/02-tim-hieu-ve-container.md",
    icon: "📦",
    desc: "Container khác máy ảo thế nào, Linux namespace và cgroups, Docker cơ bản, triển khai ứng dụng mẫu Kiada.",
    tags: ["Kubernetes in Action", "Container", "Docker"],
  },
  {
    id: "k8sbook-03",
    field: "kubernetes",
    title: "KIA 03 — Triển khai ứng dụng đầu tiên của bạn",
    file: "content/k8sbook/03-trien-khai-ung-dung-dau-tien-cua-ban.md",
    icon: "🚀",
    desc: "Dựng cụm Kubernetes (kind, minikube, cloud), làm quen kubectl và chạy ứng dụng đầu tiên.",
    tags: ["Kubernetes in Action", "kubectl", "Cluster"],
  },
  {
    id: "k8sbook-04",
    field: "kubernetes",
    title: "KIA 04 — Giới thiệu các đối tượng API của Kubernetes",
    file: "content/k8sbook/04-gioi-thieu-cac-doi-tuong-api-cua-kubernetes.md",
    icon: "🧩",
    desc: "Cấu trúc chung của một đối tượng API, group/version/kind, spec vs status, và đối tượng Event.",
    tags: ["Kubernetes in Action", "API", "Event"],
  },
  {
    id: "k8sbook-05",
    field: "kubernetes",
    title: "KIA 05 — Chạy các workload trong Pod",
    file: "content/k8sbook/05-chay-cac-workload-trong-pod.md",
    icon: "🫙",
    desc: "Vì sao cần pod, viết manifest YAML, logs/exec/cp/port-forward, pod nhiều container và init container.",
    tags: ["Kubernetes in Action", "Pod", "Init container"],
  },
  {
    id: "k8sbook-06",
    field: "kubernetes",
    title: "KIA 06 — Quản lý vòng đời của Pod",
    file: "content/k8sbook/06-quan-ly-vong-doi-cua-pod.md",
    icon: "♻️",
    desc: "Phase và condition của pod, restart policy, liveness probe, lifecycle hook và trình tự tắt pod êm.",
    tags: ["Kubernetes in Action", "Lifecycle", "Probe"],
  },
  {
    id: "k8sbook-07",
    field: "kubernetes",
    title: "KIA 07 — Gắn kết các volume lưu trữ vào Pod",
    file: "content/k8sbook/07-gan-ket-cac-volume-luu-tru-vao-pod.md",
    icon: "💾",
    desc: "Volume là gì, emptyDir chia sẻ giữa container, gắn bộ lưu trữ ngoài và hostPath trên node worker.",
    tags: ["Kubernetes in Action", "Volume", "emptyDir"],
  },
  {
    id: "k8sbook-08",
    field: "kubernetes",
    title: "KIA 08 — Lưu trữ dữ liệu trong PersistentVolume",
    file: "content/k8sbook/08-luu-tru-du-lieu-trong-persistentvolume.md",
    icon: "🗄️",
    desc: "Tách pod khỏi công nghệ lưu trữ bên dưới: PV, PVC, StorageClass, cấp phát động và PV cục bộ trên node.",
    tags: ["Kubernetes in Action", "PV", "PVC", "StorageClass"],
  },
  {
    id: "k8sbook-09",
    field: "kubernetes",
    title: "KIA 09 — Cấu hình ứng dụng qua ConfigMap, Secret và Downward API",
    file: "content/k8sbook/09-cau-hinh-ung-dung-qua-configmap-secret-va-downward-api.md",
    icon: "⚙️",
    desc: "command/args/env, tách cấu hình bằng ConfigMap, truyền dữ liệu nhạy cảm bằng Secret, Downward API và projected volume.",
    tags: ["Kubernetes in Action", "ConfigMap", "Secret"],
  },
  {
    id: "k8sbook-10",
    field: "kubernetes",
    title: "KIA 10 — Tổ chức các đối tượng bằng Namespace và Label",
    file: "content/k8sbook/10-to-chuc-cac-doi-tuong-bang-namespace-va-label.md",
    icon: "🏷️",
    desc: "Chia cụm bằng namespace, gắn nhãn cho pod, lọc bằng label selector và ghi chú bằng annotation.",
    tags: ["Kubernetes in Action", "Namespace", "Label"],
  },
  {
    id: "k8sbook-11",
    field: "kubernetes",
    title: "KIA 11 — Cung cấp quyền truy cập Pod qua Service",
    file: "content/k8sbook/11-cung-cap-quyen-truy-cap-pod-qua-service.md",
    icon: "🔌",
    desc: "Service và cách nó tìm pod, phơi ra ngoài bằng NodePort/LoadBalancer, Endpoints, bản ghi DNS và định tuyến theo vùng.",
    tags: ["Kubernetes in Action", "Service", "DNS", "Endpoints"],
  },
  {
    id: "k8sbook-12",
    field: "kubernetes",
    title: "KIA 12 — Công khai dịch vụ ra ngoài bằng Ingress",
    file: "content/k8sbook/12-cong-khai-dich-vu-ra-ngoai-bang-ingress.md",
    icon: "🌐",
    desc: "Ingress và ingress controller, định tuyến theo host/path, cấu hình TLS, dùng nhiều controller.",
    tags: ["Kubernetes in Action", "Ingress", "TLS"],
  },
  {
    id: "k8sbook-13",
    field: "kubernetes",
    title: "KIA 13 — Nhân bản Pod bằng ReplicaSet",
    file: "content/k8sbook/13-nhan-ban-pod-bang-replicaset.md",
    icon: "🔁",
    desc: "ReplicaSet giữ đúng số bản sao, cập nhật và xoá ReplicaSet, nguyên lý hoạt động của bộ điều khiển.",
    tags: ["Kubernetes in Action", "ReplicaSet"],
  },
  {
    id: "k8sbook-14",
    field: "kubernetes",
    title: "KIA 14 — Quản lý Pod bằng Deployment",
    file: "content/k8sbook/14-quan-ly-pod-bang-deployment.md",
    icon: "🚢",
    desc: "Deployment và rollout, cập nhật không gián đoạn, quay lui, và các chiến lược deployment khác.",
    tags: ["Kubernetes in Action", "Deployment", "Rollout"],
  },
  {
    id: "k8sbook-15",
    field: "kubernetes",
    title: "KIA 15 — Triển khai các workload có trạng thái bằng StatefulSet",
    file: "content/k8sbook/15-trien-khai-cac-workload-co-trang-thai-bang-statefulset.md",
    icon: "🧱",
    desc: "Danh tính ổn định và volume riêng cho từng bản sao, hành vi khi scale/cập nhật, và vai trò của Operator.",
    tags: ["Kubernetes in Action", "StatefulSet", "Operator"],
  },
  {
    id: "k8sbook-16",
    field: "kubernetes",
    title: "KIA 16 — Triển khai các tác nhân node và daemon bằng DaemonSet",
    file: "content/k8sbook/16-trien-khai-cac-tac-nhan-node-va-daemon-bang-daemonset.md",
    icon: "🛰️",
    desc: "Chạy đúng một pod trên mỗi node, các đặc quyền pod tác nhân node thường cần, và cách gọi daemon cục bộ.",
    tags: ["Kubernetes in Action", "DaemonSet"],
  },
  {
    id: "k8sbook-17",
    field: "kubernetes",
    title: "KIA 17 — Chạy các khối công việc hữu hạn bằng Job và CronJob",
    file: "content/k8sbook/17-chay-cac-khoi-cong-viec-huu-han-bang-job-va-cronjob.md",
    icon: "⏲️",
    desc: "Job chạy tới khi hoàn thành, chạy song song, và lập lịch định kỳ bằng CronJob.",
    tags: ["Kubernetes in Action", "Job", "CronJob"],
  },
```

- [ ] **Step 4: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH toàn bộ. Bất biến "Mọi `docs[].file` tồn tại trên đĩa" đang xác minh 17 đường dẫn mới — nếu Task 1 copy sai chỗ, nó đỏ ở đây.

- [ ] **Step 5: Chứng minh bất biến bắt được lỗi thật**

Đổi tạm `file` của `k8sbook-05` thành `content/k8sbook/khong-ton-tai.md`, chạy `node webapp/check-data.mjs`, xác nhận ĐỎ với `thiếu file:`. Hoàn tác.

- [ ] **Step 6: Kiểm bằng tay**

```bash
./webapp/dev.sh
```

- `#/docs` ở lĩnh vực Kubernetes hiện **24** thẻ.
- `#/docs/k8sbook-11` mở được, hiện đủ **13** ảnh, mục lục nổi bên phải hoạt động.
- `#/docs/k8sbook-02` hiện đủ **18** ảnh.

Dừng server.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/check-data.mjs
git commit -m "feat: 17 chương Kubernetes in Action vào thư viện tài liệu"
```

---

### Task 3: Bất biến N3 — bảng kỳ vọng phải phủ mọi lĩnh vực

**Files:**
- Modify: `webapp/check-data.mjs`

**Interfaces:**
- Consumes: `FIELDS` từ `js/data/fields.js`, `EXPECTED.counts` trong cùng file.
- Produces: không có API mới. Sau task này, thêm một lĩnh vực mà quên khai key đếm sẽ bị chặn — chính là cái Đợt 2 cần.

**Bối cảnh:** vòng kiểm đếm hiện chỉ so những key *có mặt* trong `EXPECTED.counts`. Lĩnh vực `java` khai module `docs` và có 10 tài liệu, nhưng **không hề có key `docs:java`** trong bảng — nghĩa là xoá sạch 10 tài liệu Java vẫn qua được toàn bộ bất biến. Task này vá đúng lỗ hổng đó, và nó đỏ ngay trên dữ liệu hiện tại.

- [ ] **Step 1: Viết bất biến — phải đỏ**

Thêm vào `webapp/check-data.mjs`, ngay **trước** khối `// Bảng kỳ vọng`:

```js
// N3 — bảng kỳ vọng phải phủ mọi lĩnh vực khai docs/roadmap.
// Vòng kiểm đếm bên dưới chỉ so những key CÓ MẶT trong EXPECTED, nên một lĩnh
// vực mới quên khai key sẽ trôi tự do: xoá sạch dữ liệu của nó vẫn xanh.
await check("EXPECTED.counts phủ mọi lĩnh vực khai docs/roadmap", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    if (f.modules.includes("docs") && !(`docs:${id}` in EXPECTED.counts)) {
      bad.push(`thiếu "docs:${id}"`);
    }
    if (f.modules.includes("roadmap") && !(`roadmap-items:${id}` in EXPECTED.counts)) {
      bad.push(`thiếu "roadmap-items:${id}"`);
    }
  }
  expect(!bad.length, `${bad.join("; ")} trong EXPECTED.counts`);
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `thiếu "docs:java" trong EXPECTED.counts`.

- [ ] **Step 3: Vá lỗ hổng bằng cách khai key còn thiếu**

Trong `EXPECTED.counts`, thêm dưới nhóm Kubernetes:

```js
    // Lĩnh vực Java chỉ có tài liệu, không có lộ trình/flashcard/trắc nghiệm.
    "docs:java": 10,
```

- [ ] **Step 4: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH, và tổng số bất biến tăng 1 so với lần chạy ở Task 2.

- [ ] **Step 5: Chứng minh bất biến bắt được lỗi thật**

Xoá tạm dòng `"docs:java": 10,`, chạy lại, xác nhận ĐỎ. Khôi phục.

- [ ] **Step 6: Commit**

```bash
git add webapp/check-data.mjs
git commit -m "fix: bắt lĩnh vực thiếu key trong bảng kỳ vọng (lộ ra docs:java)"
```

---

### Task 4: Track `k8sbook` — tuần 1–5 (18 mục)

**Files:**
- Create: `webapp/js/data/k8sbook-roadmap-part1.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `k8sbook-00` … `k8sbook-17` (Task 2).
- Produces: `export const k8sbookWeeksPart1` — mảng 5 tuần, id `kb-w1` … `kb-w5`, tổng **18** mục id `kb-w1-1` … `kb-w5-4`. Track id `k8sbook` với `field: "kubernetes"`. Task 5 nối tiếp từ `kb-w6`.

**Phân bổ mục:** tuần 1: 3 · tuần 2: 4 · tuần 3: 4 · tuần 4: 3 · tuần 5: 4 = **18**.

| Tuần | id | Tiêu đề | Chương nguồn |
|---|---|---|---|
| 1 | `kb-w1` | Container — nền móng bên dưới Kubernetes | Ch.2 (`k8sbook-02`) |
| 2 | `kb-w2` | Cụm đầu tiên & mô hình đối tượng API | Ch.3 (`k8sbook-03`), Ch.4 (`k8sbook-04`) |
| 3 | `kb-w3` | Pod — đơn vị triển khai nhỏ nhất | Ch.5 (`k8sbook-05`) |
| 4 | `kb-w4` | Vòng đời Pod & giữ ứng dụng sống | Ch.6 (`k8sbook-06`) |
| 5 | `kb-w5` | Lưu trữ — từ emptyDir tới PersistentVolume | Ch.7 (`k8sbook-07`), Ch.8 (`k8sbook-08`) |

**Bảng mục — id, nội dung, mục sách phải đọc:**

| id | `text` | Đọc |
|---|---|---|
| `kb-w1-1` | Container khác máy ảo ở đâu, và vì sao khác biệt đó quan trọng | §2.1 |
| `kb-w1-2` | Đóng gói và chạy ứng dụng mẫu Kiada bằng Docker | §2.2 |
| `kb-w1-3` | Namespace và cgroups — cơ chế thật đứng sau chữ "container" | §2.3 |
| `kb-w2-1` | Dựng cụm Kubernetes để học: kind, minikube hay cloud | §3.1 |
| `kb-w2-2` | kubectl và chạy ứng dụng đầu tiên trên cụm | §3.2–3.3 |
| `kb-w2-3` | Giải phẫu một đối tượng API: group/version/kind, spec vs status | §4.1 |
| `kb-w2-4` | Đọc thuộc tính chi tiết và theo dõi cụm qua đối tượng Event | §4.2–4.3 |
| `kb-w3-1` | Vì sao cần pod, cách gom container, và viết manifest YAML đầu tiên | §5.1–5.2 |
| `kb-w3-2` | Làm việc với pod đang chạy: logs, exec, cp, port-forward | §5.3 |
| `kb-w3-3` | Nhiều container trong một pod và container khởi tạo | §5.4–5.5 |
| `kb-w3-4` | Xoá pod và các đối tượng khác — ba cách và khác biệt của chúng | §5.6 |
| `kb-w4-1` | Đọc trạng thái pod: phase, condition, trạng thái từng container | §6.1 |
| `kb-w4-2` | Restart policy và liveness probe — giữ container sống đúng cách | §6.2 |
| `kb-w4-3` | Lifecycle hook và trình tự tắt pod êm | §6.3–6.4 |
| `kb-w5-1` | Volume là gì và emptyDir chia sẻ dữ liệu giữa các container | §7.1–7.2 |
| `kb-w5-2` | Gắn bộ lưu trữ ngoài và đọc file trên node worker bằng hostPath | §7.3–7.4 |
| `kb-w5-3` | PV và PVC — tách pod khỏi công nghệ lưu trữ bên dưới | §8.1–8.2 |
| `kb-w5-4` | Cấp phát động qua StorageClass và PV cục bộ trên node | §8.3–8.4 |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa:

```js
    "roadmap-items:kubernetes": 172,
```

(đang là `154`; 154 + 18 = 172)

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:kubernetes: kỳ vọng 172, thực tế 154`.

- [ ] **Step 3: Viết `webapp/js/data/k8sbook-roadmap-part1.js`**

Cấu trúc tuần giống hệt `sysprog-roadmap-part1.js`: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [§X.Y Tên mục](#/docs/k8sbook-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Ba quy tắc bắt buộc khi viết `lesson`:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng file `k8s-ebook/NN-*.md`, đọc mục được trích, rồi mới viết. Không suy diễn từ kiến thức Kubernetes chung.
2. **Trích đúng số mục.** Nếu §5.4 trong bản dịch còn mang tiêu đề tiếng Anh ("Running multiple containers in a pod") thì viết nhãn tiếng Việt của bạn kèm số mục, đừng bịa ra tiêu đề tiếng Việt như thể sách có sẵn.
3. **Câu "Tự kiểm tra" phải trả lời được bằng chính mục vừa đọc**, không cần kiến thức ngoài sách.

Tuần 1 viết đầy đủ dưới đây, dùng làm khuôn cho 15 mục còn lại:

```js
// Lộ trình đọc Kubernetes in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes in Action", ấn bản 2 (MEAP V15) —
// Marko Lukša, Manning. Thư mục nguồn: k8s-ebook/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (kb-w<N> / kb-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const k8sbookWeeksPart1 = [
  {
    id: "kb-w1",
    week: "Tuần 1",
    title: "Container — nền móng bên dưới Kubernetes",
    goal: "Giải thích được container là gì ở mức cơ chế kernel, và tự đóng gói được ứng dụng mẫu của sách thành image chạy được.",
    practice: "Build image Kiada theo chương 2, chạy nó bằng Docker, rồi dùng `docker exec` vào trong container và so `ps aux`, `ls /proc` với máy thật để thấy ranh giới namespace.",
    resources: [
      { label: "KIA 00 — Mở đầu: về cuốn sách", href: "#/docs/k8sbook-00" },
      { label: "KIA 02 — Tìm hiểu về container", href: "#/docs/k8sbook-02" },
      { label: "Ôn lại: CKAD tuần 1", href: "#/roadmap/ckad" },
      { label: "docs.docker.com — Get started", href: "https://docs.docker.com/get-started/" },
    ],
    items: [
      {
        id: "kb-w1-1",
        text: "Container khác máy ảo ở đâu, và vì sao khác biệt đó quan trọng",
        lesson: `**Mục tiêu.** Nói được vì sao khởi động một container nhanh hơn một máy ảo hàng chục lần, và điều đó đánh đổi lấy cái gì về mặt cách ly.

**Đọc.** [§2.1 Giới thiệu về container](#/docs/k8sbook-02) — đọc kỹ phần so sánh container với máy ảo. Chưa cần đọc §2.2 và §2.3 ở mục này.

**Bẫy.** Nghĩ container là "máy ảo nhẹ". Container **không có kernel riêng** — mọi container trên một máy dùng chung kernel của host. Đó vừa là lý do nó nhẹ, vừa là lý do ranh giới bảo mật của nó yếu hơn máy ảo, và là lý do bạn không chạy được container Linux trên kernel Windows mà không có một máy ảo ở giữa.

**Tự kiểm tra.** Nếu hai container trên cùng một node dùng chung kernel, điều gì ngăn tiến trình trong container A nhìn thấy tiến trình của container B?`,
      },
      {
        id: "kb-w1-2",
        text: "Đóng gói và chạy ứng dụng mẫu Kiada bằng Docker",
        lesson: `**Mục tiêu.** Tự build được image từ Dockerfile của sách, chạy nó, và giải thích được mỗi dòng trong Dockerfile đó làm gì.

**Đọc.** [§2.2 Triển khai Kiada — ứng dụng mẫu của Kubernetes in Action](#/docs/k8sbook-02) — làm theo từng lệnh, đừng chỉ đọc. Kiada sẽ theo bạn suốt cả cuốn sách, nên bỏ công ở đây là đầu tư cho 15 chương sau.

**Bẫy.** Build được image trên máy mình rồi cho rằng cụm cũng chạy được nó. Cụm kéo image từ **registry**, không phải từ ổ đĩa của bạn — image chỉ nằm ở local là node sẽ báo \`ImagePullBackOff\`. Ghi nhớ điều này ngay từ tuần 1, vì tuần 2 bạn sẽ gặp đúng lỗi đó.

**Tự kiểm tra.** Vì sao thứ tự các lệnh trong Dockerfile ảnh hưởng tới tốc độ build lần thứ hai, dù kết quả cuối cùng giống hệt nhau?`,
      },
      {
        id: "kb-w1-3",
        text: "Namespace và cgroups — cơ chế thật đứng sau chữ \\"container\\"",
        lesson: `**Mục tiêu.** Chỉ ra được namespace nào chịu trách nhiệm cho việc gì, và phân biệt được vai trò của namespace với vai trò của cgroups.

**Đọc.** [§2.3 Tìm hiểu sâu về container](#/docs/k8sbook-02) — đây là mục quan trọng nhất của chương. Đọc chậm phần liệt kê các loại namespace và phần cgroups.

**Bẫy.** Gộp namespace và cgroups làm một. Chúng giải quyết hai bài toán khác nhau: **namespace quyết định tiến trình *nhìn thấy* gì** (PID, mount, network, user…), còn **cgroups quyết định nó *dùng được bao nhiêu*** (CPU, bộ nhớ). Một container thiếu giới hạn cgroups vẫn được cách ly tầm nhìn nhưng có thể ăn hết RAM của node — đó chính là lý do Kubernetes có \`resources.limits\`.

**Tự kiểm tra.** Nếu bạn chạy container với \`--pid=host\`, namespace nào bị bỏ và hậu quả quan sát được là gì?`,
      },
    ],
  },
  // Tuần 2–5: viết theo đúng "Bảng mục" ở đầu Task 4 — mỗi hàng của bảng là
  // một phần tử `items`, lấy `id` và `text` nguyên văn từ cột tương ứng, và
  // `lesson` bám đúng 4 khối + 3 quy tắc nêu ở Step 3 này.
  // Số mục mỗi tuần: kb-w2: 4 · kb-w3: 4 · kb-w4: 3 · kb-w5: 4.
];
```

Lưu ý cú pháp: `text` của `kb-w1-3` chứa dấu nháy kép nên phải escape (`\\"container\\"`) hoặc đổi sang nháy đơn — chọn một và giữ nhất quán.

- [ ] **Step 4: Đăng ký track trong `webapp/js/data/roadmap.js`**

Thêm import ở đầu file, sau import `sysprogWeeksPart2`:

```js
import { k8sbookWeeksPart1 } from "./k8sbook-roadmap-part1.js";
```

Thêm phần tử vào mảng `tracks`, **sau** track `cks` và **trước** track `sysprog` (để giáo trình cùng lĩnh vực Kubernetes đứng liền nhau):

```js
  {
    id: "k8sbook",
    field: "kubernetes",
    label: "Kubernetes in Action",
    icon: "📖",
    name: "Đọc Kubernetes in Action (ấn bản 2)",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra. Bổ trợ chiều sâu cho ba giáo trình chứng chỉ.",
    prereq: "Yêu cầu: biết dùng terminal Linux và Docker cơ bản. Không cần biết Kubernetes trước.",
    weeks: [...k8sbookWeeksPart1],
  },
```

Cập nhật khối chú thích ở đầu file, thêm một dòng vào danh sách:

```js
//   KIA : k8sbook-roadmap-part{1,2}.js   (Tuần 1–5 / 6–9)       — 30 mục
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH. Ba bất biến đang làm việc thầm lặng ở đây — id mục duy nhất, mọi link `#/docs/…` trong `lesson` trỏ tới doc có thật, và link đó cùng lĩnh vực với track.

- [ ] **Step 6: Chứng minh bất biến link bắt được lỗi thật**

Đổi tạm một link trong `lesson` thành `#/docs/k8sbook-99`, chạy lại, xác nhận ĐỎ với `link hỏng`. Sau đó đổi thành `#/docs/sysprog-01` (id có thật nhưng khác lĩnh vực), chạy lại, xác nhận ĐỎ với `link khác lĩnh vực`. Hoàn tác cả hai.

- [ ] **Step 7: Kiểm bằng tay**

```bash
./webapp/dev.sh
```

- `#/roadmap` ở lĩnh vực Kubernetes hiện **4** giáo trình.
- `#/roadmap/k8sbook` mở được, 5 tuần, tick vài mục rồi reload — tiến độ còn.
- Tick mục ở CKAD **không** bị ảnh hưởng.

Dừng server.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/k8sbook-roadmap-part1.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: lộ trình đọc Kubernetes in Action tuần 1-5 (18 mục)"
```

---

### Task 5: Track `k8sbook` — tuần 6–9 (12 mục)

**Files:**
- Create: `webapp/js/data/k8sbook-roadmap-part2.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `k8sbook-09` … `k8sbook-17` (Task 2); nối tiếp id tuần từ `k8sbookWeeksPart1` (Task 4).
- Produces: `export const k8sbookWeeksPart2` — mảng 4 tuần, id `kb-w6` … `kb-w9`, tổng **12** mục id `kb-w6-1` … `kb-w9-3`. Sau task này track `k8sbook` đủ 30 mục.

**Phân bổ mục:** tuần 6: 3 · tuần 7: 4 · tuần 8: 2 · tuần 9: 3 = **12**.

| Tuần | id | Tiêu đề | Chương nguồn |
|---|---|---|---|
| 6 | `kb-w6` | Cấu hình & tổ chức đối tượng | Ch.9 (`k8sbook-09`), Ch.10 (`k8sbook-10`) |
| 7 | `kb-w7` | Mạng — Service và Ingress | Ch.11 (`k8sbook-11`), Ch.12 (`k8sbook-12`) |
| 8 | `kb-w8` | Nhân bản & cập nhật không gián đoạn | Ch.13 (`k8sbook-13`), Ch.14 (`k8sbook-14`) |
| 9 | `kb-w9` | Workload chuyên biệt — StatefulSet, DaemonSet, Job | Ch.15, Ch.16, Ch.17 |

**Bảng mục:**

| id | `text` | Đọc |
|---|---|---|
| `kb-w6-1` | command, args, biến môi trường và ConfigMap | §9.1–9.2 |
| `kb-w6-2` | Secret, Downward API và projected volume | §9.3–9.5 |
| `kb-w6-3` | Namespace, label, label selector và annotation | Ch.10 §10.1–10.4 |
| `kb-w7-1` | Service tìm pod thế nào, và ba cách phơi ra ngoài | §11.1–11.2 |
| `kb-w7-2` | Endpoints và bản ghi DNS của Service | §11.3–11.4 |
| `kb-w7-3` | Định tuyến tới endpoint ở gần và điều kiện pod được nhận lưu lượng | §11.5–11.6 |
| `kb-w7-4` | Ingress, định tuyến theo host/path và cấu hình TLS | §12.1–12.3 |
| `kb-w8-1` | ReplicaSet giữ đúng số bản sao — và nguyên lý bộ điều khiển | Ch.13 §13.1–13.4 |
| `kb-w8-2` | Deployment, rollout, quay lui và các chiến lược cập nhật | Ch.14 §14.1–14.3 |
| `kb-w9-1` | StatefulSet: danh tính ổn định và volume riêng từng bản sao | Ch.15 §15.1–15.4 |
| `kb-w9-2` | DaemonSet: một pod mỗi node và các đặc quyền đi kèm | Ch.16 §16.1–16.3 |
| `kb-w9-3` | Job chạy tới khi xong, CronJob chạy theo lịch | Ch.17 §17.1–17.2 |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa `172` thành:

```js
    "roadmap-items:kubernetes": 184,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:kubernetes: kỳ vọng 184, thực tế 172`.

- [ ] **Step 3: Viết `webapp/js/data/k8sbook-roadmap-part2.js`**

Cấu trúc tuần: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [§X.Y Tên mục](#/docs/k8sbook-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Ba quy tắc bắt buộc khi viết `lesson`:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng file `k8s-ebook/NN-*.md`, đọc mục được trích, rồi mới viết. Không suy diễn từ kiến thức Kubernetes chung.
2. **Trích đúng số mục.** Nếu mục trong bản dịch còn mang tiêu đề tiếng Anh (vd §8.3 "Dynamic provisioning of persistent volumes", §9.3 "Using Secrets to pass sensitive data to containers") thì viết nhãn tiếng Việt của bạn kèm số mục, đừng bịa ra tiêu đề tiếng Việt như thể sách có sẵn.
3. **Câu "Tự kiểm tra" phải trả lời được bằng chính mục vừa đọc**, không cần kiến thức ngoài sách.

Header file và tuần 6 làm khuôn:

```js
// Lộ trình đọc Kubernetes in Action — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes in Action", ấn bản 2 (MEAP V15) —
// Marko Lukša, Manning. Thư mục nguồn: k8s-ebook/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (kb-w<N> / kb-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const k8sbookWeeksPart2 = [
  {
    id: "kb-w6",
    week: "Tuần 6",
    title: "Cấu hình & tổ chức đối tượng",
    goal: "Tách được toàn bộ cấu hình ra khỏi image, và tổ chức đối tượng trong cụm bằng namespace và label thay vì bằng quy ước đặt tên.",
    practice: "Chuyển toàn bộ biến môi trường hard-code của Kiada sang ConfigMap và Secret, rồi gắn nhãn `app`/`rel` cho pod và thử lọc bằng `kubectl get pod -l`.",
    resources: [
      { label: "KIA 09 — ConfigMap, Secret, Downward API", href: "#/docs/k8sbook-09" },
      { label: "KIA 10 — Namespace và Label", href: "#/docs/k8sbook-10" },
      { label: "Tra cứu nhanh: CKAD Cheat Sheet", href: "#/docs/cheat-sheet" },
    ],
    items: [
      // kb-w6-1, kb-w6-2, kb-w6-3 — lấy `id` và `text` nguyên văn từ "Bảng mục"
      // ở đầu Task 5, `lesson` theo 4 khối + 3 quy tắc nêu ở Step 3 này.
    ],
  },
  // Tuần 7–9: cùng cách làm.
  // Số mục mỗi tuần: kb-w7: 4 · kb-w8: 2 · kb-w9: 3.
];
```

- [ ] **Step 4: Nối part2 vào track trong `webapp/js/data/roadmap.js`**

Thêm import:

```js
import { k8sbookWeeksPart2 } from "./k8sbook-roadmap-part2.js";
```

Sửa `weeks` của track `k8sbook`:

```js
    weeks: [...k8sbookWeeksPart1, ...k8sbookWeeksPart2],
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH, `roadmap-items:kubernetes` = 184.

- [ ] **Step 6: Kiểm bằng tay**

```bash
./webapp/dev.sh
```

`#/roadmap/k8sbook` hiện đủ 9 tuần, 30 mục; nút "Tiếp tục học" nhảy đúng mục chưa xong. Dừng server.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/k8sbook-roadmap-part2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: lộ trình đọc Kubernetes in Action tuần 6-9 — đủ 30 mục"
```

---

### Task 6: Bảng liên kết chéo & merge vào `resources`

**Files:**
- Create: `webapp/js/data/k8sbook-crossref.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/check-data.mjs` (bất biến N1, N2)

**Interfaces:**
- Consumes: doc id `k8sbook-*` (Task 2); id tuần `w1`…`w7`, `cka-w1`, `cka-w4`, `cka-w5`, `cka-w6`, `cks-w4` của ba track chứng chỉ (đã có sẵn trong repo).
- Produces: `export const k8sbookCrossref` — object `{ [weekId: string]: string[] }`. `roadmap.js` xuất `tracks` với `week.resources` đã được merge; view roadmap **không đổi**.

- [ ] **Step 1: Viết N1 và N2 — phải đỏ**

Thêm vào `webapp/check-data.mjs`. Trước hết, ở khối nạp dữ liệu đầu file, thêm:

```js
const { k8sbookCrossref } = await import("./js/data/k8sbook-crossref.js");
const { weeksPart1 } = await import("./js/data/roadmap-part1.js");
const { weeksPart2 } = await import("./js/data/roadmap-part2.js");
const { weeksPart3 } = await import("./js/data/roadmap-part3.js");
const { ckaWeeksPart1 } = await import("./js/data/cka-roadmap-part1.js");
const { ckaWeeksPart2 } = await import("./js/data/cka-roadmap-part2.js");
const { ckaWeeksPart3 } = await import("./js/data/cka-roadmap-part3.js");
const { cksWeeksPart1 } = await import("./js/data/cks-roadmap-part1.js");
const { cksWeeksPart2 } = await import("./js/data/cks-roadmap-part2.js");

// Tuần "thô" — trước khi roadmap.js merge crossref vào resources.
const rawWeeks = new Map(
  [...weeksPart1, ...weeksPart2, ...weeksPart3,
   ...ckaWeeksPart1, ...ckaWeeksPart2, ...ckaWeeksPart3,
   ...cksWeeksPart1, ...cksWeeksPart2].map((w) => [w.id, w]));
```

Rồi thêm hai bất biến, đặt sau bất biến #3b:

```js
// N1 — bảng liên kết chéo phải trỏ tới thứ có thật.
// Gõ nhầm id tuần là lỗi IM LẶNG: merge vào một tuần không tồn tại không ném
// lỗi, chip chỉ đơn giản không bao giờ hiện ra.
await check("k8sbookCrossref trỏ tới tuần và tài liệu có thật", () => {
  const docIds = new Set(docs.map((d) => d.id));
  const bad = [];
  for (const [weekId, refs] of Object.entries(k8sbookCrossref)) {
    if (!rawWeeks.has(weekId)) bad.push(`tuần "${weekId}" không tồn tại`);
    if (weekId.startsWith("kb-w")) bad.push(`"${weekId}" là tuần của chính track k8sbook`);
    const dup = dupes(refs);
    if (dup.length) bad.push(`tuần "${weekId}" trùng: ${dup.join(", ")}`);
    for (const id of refs) {
      if (!id.startsWith("k8sbook-")) bad.push(`"${weekId}" → "${id}" không phải chương sách`);
      else if (!docIds.has(id)) bad.push(`"${weekId}" → "${id}" không tồn tại`);
    }
  }
  expect(!bad.length, bad.join("; "));
});

// N2 — merge phải NỐI vào resources, không ghi đè.
await check("Merge crossref giữ nguyên resource gốc và thêm đủ chip sách", () => {
  const merged = new Map(
    tracks.flatMap((t) => t.weeks).map((w) => [w.id, w]));
  const bad = [];
  for (const [weekId, refs] of Object.entries(k8sbookCrossref)) {
    const raw = rawWeeks.get(weekId);
    const now = merged.get(weekId);
    if (!raw || !now) continue; // N1 đã báo
    for (const r of raw.resources ?? []) {
      if (!(now.resources ?? []).some((x) => x.href === r.href)) {
        bad.push(`tuần "${weekId}" mất resource gốc "${r.href}"`);
      }
    }
    for (const id of refs) {
      if (!(now.resources ?? []).some((x) => x.href === `#/docs/${id}`)) {
        bad.push(`tuần "${weekId}" thiếu chip sách "${id}"`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ ngay ở bước nạp module, `Cannot find module .../k8sbook-crossref.js`. Đó là red hợp lệ: file chưa tồn tại.

- [ ] **Step 3: Viết `webapp/js/data/k8sbook-crossref.js`**

```js
// Liên kết chéo: tuần của giáo trình chứng chỉ → chương sách Kubernetes in Action.
//
// roadmap.js merge bảng này vào `week.resources` lúc dựng track, nên dữ liệu
// lộ trình chứng chỉ (154 mục) không phải sửa một ký tự nào.
//
// Khoá là id tuần CÓ THẬT của track ckad/cka/cks; giá trị là id tài liệu
// "k8sbook-*". check-data.mjs (N1) chặn cả hai loại gõ nhầm.

export const k8sbookCrossref = {
  // ----- CKAD -----
  "w1": ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10"],
  "w2": ["k8sbook-05", "k8sbook-06"],
  "w3": ["k8sbook-13", "k8sbook-14", "k8sbook-17"],
  "w4": ["k8sbook-09"],
  "w5": ["k8sbook-06"],
  "w6": ["k8sbook-11", "k8sbook-12"],
  "w7": ["k8sbook-07", "k8sbook-08", "k8sbook-15"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04"],
  "cka-w4": ["k8sbook-16"],
  "cka-w5": ["k8sbook-07", "k8sbook-08"],
  "cka-w6": ["k8sbook-11", "k8sbook-12"],

  // ----- CKS -----
  "cks-w4": ["k8sbook-09"],
};
```

- [ ] **Step 4: Viết hàm merge trong `webapp/js/data/roadmap.js`**

Thêm import:

```js
import { k8sbookCrossref } from "./k8sbook-crossref.js";
import { docs as allDocsRaw } from "./docs-index.js";
```

Thêm hàm ngay **trước** `export const tracks`:

```js
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
```

Rồi bọc `weeks` của **ba track chứng chỉ** (không bọc `sysprog`, không bọc `k8sbook`):

```js
    weeks: withBookRefs([...weeksPart1, ...weeksPart2, ...weeksPart3]),
```
```js
    weeks: withBookRefs([...ckaWeeksPart1, ...ckaWeeksPart2, ...ckaWeeksPart3]),
```
```js
    weeks: withBookRefs([...cksWeeksPart1, ...cksWeeksPart2]),
```

`withBookRefs` trả về **tuần mới** (`{ ...w }`) chứ không sửa tại chỗ, nên `rawWeeks` mà `check-data.mjs` nạp trực tiếp từ các file part vẫn giữ nguyên trạng thái gốc — đó là điều kiện để N2 so sánh được.

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH toàn bộ. Bất biến #3 và #3b giờ cũng đang soi 20 link chip mới mà không cần thêm mã.

- [ ] **Step 6: Chứng minh N1 bắt được lỗi im lặng**

Thêm tạm `"w31": ["k8sbook-05"],` vào bảng, chạy lại, xác nhận ĐỎ với `tuần "w31" không tồn tại`. Xoá đi. Đây chính là lớp lỗi mà nếu không có N1 sẽ không ai phát hiện.

- [ ] **Step 7: Chứng minh N2 bắt được lỗi ghi đè**

Sửa tạm `withBookRefs` thành `resources: chips` (bỏ phần nối), chạy lại, xác nhận ĐỎ với `mất resource gốc`. Hoàn tác.

- [ ] **Step 8: Kiểm bằng tay**

```bash
./webapp/dev.sh
```

- `#/roadmap/ckad` tuần 1: hàng chip có **cả** resource cũ **và** 4 chip `📖 KIA …`.
- Bấm chip `📖 KIA 05 …` → mở đúng `#/docs/k8sbook-05`, lĩnh vực vẫn là Kubernetes.
- `#/roadmap/sysprog` **không** có chip sách nào.
- `#/roadmap/k8sbook` **không** có chip sách trỏ vào chính nó.

Dừng server.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/k8sbook-crossref.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: liên kết chéo từ giáo trình chứng chỉ sang chương Kubernetes in Action"
```

---

### Task 7: Cập nhật tài liệu & nghiệm thu Đợt 1

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`

**Interfaces:**
- Consumes: toàn bộ kết quả Task 1–6.
- Produces: không có API mới. Đây là cổng nghiệm thu của Đợt 1.

- [ ] **Step 1: Lấy số liệu thật, không chép từ trí nhớ**

Cờ `--input-type=module` phải đứng **trước** `-e`, và lệnh chạy từ trong `webapp/`:

```bash
cd webapp && node --input-type=module -e '
const {allDocs, allTracks} = await import("./js/data/index.js");
console.log("docs:", allDocs.length, "| tracks:", allTracks.length,
  "| items:", allTracks.reduce((n,t)=>n+t.weeks.flatMap(w=>w.items).length,0));
'
```

Kỳ vọng: `docs: 52 | tracks: 5 | items: 234`.
(Trước Đợt 1, cùng lệnh này in `docs: 35 | tracks: 4 | items: 204`.)

- [ ] **Step 2: Cập nhật `webapp/README.md`**

- Dòng mô tả đầu: giữ 3 lĩnh vực (Đợt 1 chưa thêm lĩnh vực nào).
- Bảng tính năng, dòng 🗺️ Lộ trình học: `4 giáo trình` → `5 giáo trình`, `204 mục` → `234 mục`, và bổ sung mô tả giáo trình đọc sách.
- Bảng tính năng, dòng 📚 Thư viện tài liệu: `35 tài liệu` → `52 tài liệu`, `7 Kubernetes` → `24 Kubernetes`.
- Sơ đồ cấu trúc mã trong mục "Cấu trúc mã": thêm dòng
  `│   ├── k8sbook-roadmap-part*.js, k8sbook-crossref.js  # sách Kubernetes in Action`
- Mục "Kiểm tra dữ liệu": số bất biến `23` → số thật in ra ở cuối `node webapp/check-data.mjs`.

- [ ] **Step 3: Cập nhật `README.md` gốc**

- Trong bảng thành phần DevPrep, thêm dòng trước dòng `webapp/`:

```markdown
| [`k8s-ebook/`](./k8s-ebook/) | Bản dịch tiếng Việt *Kubernetes in Action*, ấn bản 2 (Marko Lukša, Manning) — 17 chương, 184 hình. Đọc trong app ở lĩnh vực Kubernetes. |
```

- Dòng mô tả `webapp/`: `4 giáo trình, 204 mục` → `5 giáo trình, 234 mục`; `35 tài liệu` → `52 tài liệu`.

- [ ] **Step 4: Chạy toàn bộ cổng kiểm**

```bash
rm -rf webapp/content
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kỳ vọng: XANH toàn bộ, **0 bất biến bị bỏ qua** (dòng cuối không có "bỏ qua").

- [ ] **Step 5: Smoke checklist đầy đủ**

```bash
./webapp/dev.sh
```

- [ ] Bộ chọn lĩnh vực vẫn 3 mục (Kubernetes / Lập trình hệ thống / Java)
- [ ] `#/docs` lĩnh vực Kubernetes: 52 − 18 sysprog − 10 java = **24** thẻ
- [ ] `#/docs/k8sbook-11` hiện đủ **13** ảnh; `#/docs/k8sbook-02` hiện đủ **18** ảnh
- [ ] `#/roadmap` lĩnh vực Kubernetes: **4** giáo trình
- [ ] `#/roadmap/k8sbook`: 9 tuần, 30 mục, tiến độ giữ sau reload
- [ ] `#/roadmap/ckad` tuần 1: có cả resource cũ lẫn 4 chip `📖 KIA …`
- [ ] Đổi sang lĩnh vực Java rồi quay lại — lựa chọn lĩnh vực được nhớ
- [ ] Tiến độ CKAD cũ (nếu có trong localStorage) không mất

- [ ] **Step 6: Commit**

```bash
git add README.md webapp/README.md
git commit -m "docs: cập nhật số liệu sau khi thêm Kubernetes in Action"
```

- [ ] **Step 7: Xác nhận CI sẽ qua**

```bash
git log --oneline -8
git status
```

Kỳ vọng: working tree sạch, 7 commit của Đợt 1. Workflow `deploy-pages.yml` chạy `build-content.sh` rồi `check-data.mjs` — cả hai vừa chạy xanh ở local nên bước `check` sẽ qua.

---

## Ghi chú cho Đợt 2

Đợt 2 (Spring Security → lĩnh vực mới) nằm ngoài plan này; xem mục 8 của spec. Ràng buộc thứ tự quan trọng nhất: bất biến #7 buộc phải có dữ liệu trước khi khai module, nên lĩnh vực mới mở dần `["dashboard", "docs"]` rồi mới thêm `"roadmap"`. Bất biến N3 viết ở Task 3 sẽ chặn nếu Đợt 2 quên khai key đếm cho lĩnh vực mới.
