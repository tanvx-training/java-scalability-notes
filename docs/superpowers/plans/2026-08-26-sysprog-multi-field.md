# Nền tảng học đa lĩnh vực & track System Programming — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc webapp KubePrep thành nền tảng học đa lĩnh vực (DevPrep) và đưa bản dịch *System Programming Coursebook* vào thành một track học đầy đủ gồm tài liệu, lộ trình, flashcards và trắc nghiệm.

**Architecture:** Một field registry (`js/data/fields.js`) khai báo ba lĩnh vực và tập module của từng lĩnh vực; sidebar sinh ra từ registry thay vì hardcode trong HTML. Lĩnh vực là trạng thái UI trong `localStorage`, **không** nằm trong URL — mọi id đã duy nhất toàn cục nên deep-link cũ vẫn chạy, và app tự suy ra lĩnh vực từ deep-link. Bản ghi dữ liệu Kubernetes cũ không bị đụng tới: `field` mặc định `"kubernetes"` tại một lớp truy cập mỏng (`js/data/index.js`).

**Tech Stack:** Vanilla ES modules, không framework, không build step, không dependency runtime. Node 24 chỉ dùng để chạy script kiểm tra dữ liệu ngoài trình duyệt. Python3 `http.server` cho dev, GitHub Pages cho deploy, nginx cho Docker.

**Spec:** [`docs/superpowers/specs/2026-08-26-sysprog-multi-field-design.md`](../specs/2026-08-26-sysprog-multi-field-design.md)

## Global Constraints

Mọi task đều phải tuân thủ các ràng buộc sau.

- **Namespace `localStorage` giữ nguyên `kubeprep.`** — hằng `NS` trong `js/lib/store.js` KHÔNG được đổi dù brand đổi thành DevPrep. Đổi prefix sẽ xoá sạch tiến độ học hiện có.
- **Id đã tồn tại là bất biến.** Không đổi/không xoá bất kỳ id nào đang dùng làm khoá `localStorage`: id mục lộ trình (`w1-1`, `cka-w1-1`, `cks-w1-1`…), id flashcard (`f001`…), id câu hỏi (`q001`…), id track (`ckad`, `cka`, `cks`).
- **Tiền tố id mới:** track System Programming dùng `sp-w<N>` cho tuần, `sp-w<N>-<M>` cho mục lộ trình, `spf<NNN>` cho flashcard, `spq<NNN>` cho câu hỏi, `sysprog-<NN>` cho tài liệu.
- **Không thêm dependency runtime.** Không `npm install`, không CDN mới. `webapp/package.json` chỉ được chứa `{"type":"module","private":true}` để Node đọc được ES module — không có trường `dependencies`.
- **Không sửa markdown nguồn** trong `System_Programming_VI/`. Ảnh tham chiếu dạng `images/fig-11.1.png` đã được `fixRelativePaths()` xử lý đúng.
- **Ngôn ngữ nội dung: tiếng Việt**, giữ nguyên thuật ngữ chuyên ngành tiếng Anh (process, thread, mutex, file descriptor, page table, socket…) — theo đúng nguyên tắc dịch ở `System_Programming_VI/README.md`.
- **Ghi công CC BY 4.0** ở đầu mỗi file dữ liệu sysprog mới: sách gốc *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al., https://github.com/illinois-cs241/coursebook
- **`webapp/content/` nằm trong `.gitignore`** — không bao giờ commit nội dung đã copy.
- **Mọi commit** kết thúc bằng dòng `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Structure

**Tạo mới:**

| File | Trách nhiệm |
|---|---|
| `webapp/js/data/fields.js` | Khai báo 3 lĩnh vực, nhóm nav, và hàm thuần `navFor()` / `moduleAllowed()` |
| `webapp/js/lib/field.js` | Trạng thái lĩnh vực đang chọn (`currentField`/`setCurrentField`) — tách riêng để view không phải import ngược vào `app.js` |
| `webapp/js/data/index.js` | Lớp truy cập: gộp dữ liệu K8s + sysprog, lọc theo lĩnh vực, suy lĩnh vực từ deep-link |
| `webapp/js/data/sysprog-roadmap-part1.js` | Lộ trình tuần 1–5 (22 mục) |
| `webapp/js/data/sysprog-roadmap-part2.js` | Lộ trình tuần 6–10 (28 mục) |
| `webapp/js/data/sysprog-flashcards.js` | 90 flashcard |
| `webapp/js/data/sysprog-questions-part1.js` | 60 câu (`sp-c`, `sp-process`, `sp-concurrency`) |
| `webapp/js/data/sysprog-questions-part2.js` | 50 câu (`sp-deadlock`, `sp-memory-ipc`, `sp-io`, `sp-security`) |
| `webapp/build-content.sh` | Nguồn duy nhất của logic copy markdown vào `content/` |
| `webapp/check-data.mjs` | Kiểm 7 bất biến dữ liệu + assertion cho hàm thuần |
| `webapp/package.json` | Chỉ `{"type":"module","private":true}` — để Node đọc được `js/data/*.js` |

**Sửa:**

| File | Thay đổi |
|---|---|
| `webapp/index.html` | Nav thành placeholder rỗng; brand/title/meta/favicon đổi sang DevPrep |
| `webapp/js/app.js` | Render nav từ registry, bộ chọn lĩnh vực, đồng bộ lĩnh vực từ deep-link, chặn route ngoài lĩnh vực |
| `webapp/js/data/meta.js` | Thêm `field` cho `DOMAINS`/`TOPICS` hiện có; thêm 7 khoá `sp-*` |
| `webapp/js/data/docs-index.js` | Bỏ khai báo `FIELDS` cục bộ, re-export từ `fields.js`; thêm 18 tài liệu sysprog |
| `webapp/js/data/roadmap.js` | Thêm track `sysprog` |
| `webapp/js/views/{dashboard,docs,roadmap,flashcards,quiz}.js` | Lọc theo lĩnh vực đang chọn |
| `webapp/js/lib/store.js` | Chú thích lý do giữ namespace `kubeprep.` |
| `webapp/css/style.css` | Style cho bộ chọn lĩnh vực |
| `webapp/dev.sh`, `Dockerfile`, `.github/workflows/deploy-pages.yml` | Gọi `build-content.sh`; workflow thêm job kiểm tra |
| `README.md`, `webapp/README.md` | Cập nhật cấu trúc, số liệu, brand |

---

### Task 0: Đưa nguồn nội dung & hạ tầng Docker vào git

> ⚠️ **Task này chạy trong worktree CHÍNH** `/Users/tanvx/Dev/Java/java-scalability-notes`, không phải worktree feature. Đây là task duy nhất như vậy.

`System_Programming_VI/` đang staged-nhưng-chưa-commit. `Dockerfile` và `docker-compose.yml` đang **untracked** — nhưng Task 1 phải sửa `Dockerfile`, nên chúng cần vào git trước.

**Files:**
- Commit: `System_Programming_VI/**` (19 `.md` + 48 ảnh = 67 file)
- Commit: `Dockerfile`, `docker-compose.yml`

**Interfaces:**
- Produces: thư mục `System_Programming_VI/` và file `Dockerfile` tồn tại trong worktree feature sau khi rebase — mọi task sau đều dựa vào đây.

- [ ] **Step 1: Xác nhận không có rác trong staging**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes
git diff --cached --name-only | wc -l          # kỳ vọng: 67
git diff --cached --name-only | grep -c '\.idea' || true   # kỳ vọng: 0
git status --short | grep -v '^A  System_Programming_VI'   # kỳ vọng: chỉ ?? Dockerfile, ?? docker-compose.yml
```

Nếu số file khác 67 hoặc có `.idea`, DỪNG và báo lại — đừng tự sửa.

- [ ] **Step 2: Commit bản dịch vào main**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes
git commit -m "$(cat <<'EOF'
docs: bản dịch tiếng Việt System Programming Coursebook (UIUC CS 241)

18 chương + 48 hình, dịch từ bản PDF 24/03/2020 của illinois-cs241/coursebook.
Tài liệu gốc CC BY 4.0 (B. Venkatesh, L. Angrave et al.); bản dịch giữ nguyên
giấy phép, có ghi công tác giả gốc.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Commit hạ tầng Docker**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes
git add Dockerfile docker-compose.yml
git commit -m "$(cat <<'EOF'
chore: thêm Dockerfile + docker-compose để chạy webapp bằng nginx

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Rebase branch feature lên main mới**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
git rebase main
```

- [ ] **Step 5: Xác minh worktree feature đã có nguồn**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
ls System_Programming_VI/*.md | wc -l          # kỳ vọng: 19
ls System_Programming_VI/images/*.png | wc -l  # kỳ vọng: 48
test -f Dockerfile && echo "Dockerfile OK"
git log --oneline -4
```

Kỳ vọng `git log`: commit spec nằm TRÊN commit Docker và commit bản dịch.

---

### Task 1: Gộp logic copy nội dung vào `build-content.sh`

Logic copy đang lặp ở 3 nơi (`dev.sh`, `Dockerfile`, workflow). Task này gộp về một chỗ **và** thêm nhánh sysprog.

**Files:**
- Create: `webapp/build-content.sh`
- Modify: `webapp/dev.sh:12-16`
- Modify: `Dockerfile:11-15`
- Modify: `.github/workflows/deploy-pages.yml:28-36`

**Interfaces:**
- Produces: `webapp/build-content.sh <dest-dir>` — copy toàn bộ markdown + ảnh của repo vào `<dest-dir>`, tạo các thư mục con `java/`, `images/`, `sysprog/`, `sysprog/images/`. Task 2 và Task 6 dựa vào đường dẫn `content/sysprog/*.md` và `content/sysprog/images/*.png` mà nó sinh ra.

- [ ] **Step 1: Viết lệnh kiểm chứng — phải thất bại**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
rm -rf /tmp/bc-test && ./webapp/build-content.sh /tmp/bc-test
```

Kỳ vọng: FAIL — `no such file or directory: ./webapp/build-content.sh`

- [ ] **Step 2: Viết script**

```bash
cat > webapp/build-content.sh <<'SCRIPT'
#!/usr/bin/env bash
# Nguồn duy nhất của logic copy nội dung markdown vào thư mục content/.
# Gọi bởi: webapp/dev.sh, Dockerfile, .github/workflows/deploy-pages.yml
#
#   ./webapp/build-content.sh webapp/content    (local dev)
#   ./webapp/build-content.sh _site/content     (GitHub Pages)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?usage: build-content.sh <dest-dir>}"
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"

mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images"

cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
SCRIPT
chmod +x webapp/build-content.sh
```

- [ ] **Step 3: Chạy lại lệnh kiểm chứng — phải thành công**

```bash
rm -rf /tmp/bc-test && ./webapp/build-content.sh /tmp/bc-test
ls /tmp/bc-test/sysprog/*.md | wc -l          # kỳ vọng: 19
ls /tmp/bc-test/sysprog/images/*.png | wc -l  # kỳ vọng: 48
ls /tmp/bc-test/java/*.md | wc -l             # kỳ vọng: 10
ls /tmp/bc-test/*.md | wc -l                  # kỳ vọng: 7
```

- [ ] **Step 4: Đấu nối `dev.sh`**

Thay 4 dòng `mkdir`/`cp` hiện tại (từ `mkdir -p "$DIR/content/java"` đến dòng `cp "$REPO"/images/* …`) bằng:

```bash
"$DIR/build-content.sh" "$DIR/content"
```

- [ ] **Step 5: Đấu nối `Dockerfile`**

Thay khối `RUN mkdir -p webapp/content/java … cp "$REPO"/images/* …` bằng:

```dockerfile
RUN webapp/build-content.sh webapp/content
```

- [ ] **Step 6: Đấu nối workflow**

Trong `.github/workflows/deploy-pages.yml`, thay bước "Build site" bằng:

```yaml
      - name: Build site (copy webapp + markdown content)
        run: |
          mkdir -p _site
          cp -r webapp/. _site/
          rm -f _site/dev.sh _site/build-content.sh _site/check-data.mjs _site/package.json
          webapp/build-content.sh _site/content
```

- [ ] **Step 7: Xác minh cả ba nơi gọi**

```bash
grep -n "build-content.sh" webapp/dev.sh Dockerfile .github/workflows/deploy-pages.yml
grep -rn "cp CKAD\|cp \"\$REPO\"/CKAD\|Chủ đề\"\*/\*.md" webapp/dev.sh Dockerfile .github/workflows/deploy-pages.yml || echo "OK — không còn logic copy lặp"
rm -rf webapp/content && ./webapp/dev.sh 8899 &
sleep 3 && curl -sf http://localhost:8899/content/sysprog/11-networking.md | head -1 && kill %1
```

Kỳ vọng dòng đầu: `# Chương 11. Lập trình mạng (Networking)`

- [ ] **Step 8: Commit**

```bash
git add webapp/build-content.sh webapp/dev.sh Dockerfile .github/workflows/deploy-pages.yml
git commit -m "$(cat <<'EOF'
refactor: gộp logic copy nội dung vào webapp/build-content.sh

Logic đang lặp ở dev.sh, Dockerfile và workflow deploy. Gộp về một script
và thêm nhánh copy System_Programming_VI vào content/sysprog/.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Bộ kiểm tra dữ liệu `check-data.mjs`

Đây là **hạ tầng test** cho toàn bộ các task còn lại. Repo chưa có test nào. Bộ kiểm phải chạy **xanh trên dữ liệu Kubernetes hiện có** trước khi thêm bất cứ dữ liệu mới nào — đó là bằng chứng bộ kiểm đúng, không phải bộ kiểm dễ dãi.

**Files:**
- Create: `webapp/check-data.mjs`
- Create: `webapp/package.json`

**Interfaces:**
- Produces: `node webapp/check-data.mjs` → exit 0 nếu mọi bất biến đạt, exit 1 kèm danh sách lỗi nếu không. Hằng `EXPECTED` trong file là **bảng kỳ vọng khai báo** — các task sau sửa nó TRƯỚC (đỏ) rồi mới viết dữ liệu (xanh).
- Produces: helper `check(name, fn)` và `expect(cond, msg)` dùng lại ở mọi task sau.

- [ ] **Step 1: Xác nhận Node chưa đọc được ES module trong `js/data/`**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88/webapp
node --input-type=module -e "import('./js/data/meta.js').then(m => console.log(Object.keys(m)))"
```

Kỳ vọng: FAIL — `SyntaxError: Unexpected token 'export'` (Node coi `.js` là CommonJS). Đây chính là lý do cần `package.json`.

- [ ] **Step 2: Thêm `package.json`**

```bash
cat > webapp/package.json <<'JSON'
{
  "name": "devprep-webapp",
  "private": true,
  "type": "module"
}
JSON
```

Không có `dependencies` và sẽ không bao giờ có: app chạy thẳng trong trình duyệt, file này chỉ để Node hiểu `js/data/*.js` là ES module.

- [ ] **Step 3: Xác nhận Node đã đọc được**

```bash
cd webapp && node --input-type=module -e "import('./js/data/meta.js').then(m => console.log(Object.keys(m).join(',')))"
```

Kỳ vọng: `CERTS,DOMAINS,TOPICS,COMMAND_CATEGORIES,DIFFICULTY`

- [ ] **Step 4: Viết bộ kiểm**

```js
// webapp/check-data.mjs — kiểm tính toàn vẹn dữ liệu học tập.
//
//   node webapp/check-data.mjs
//
// Chạy webapp/build-content.sh webapp/content trước, nếu muốn kiểm cả bất biến
// #2 (file tài liệu tồn tại trên đĩa). Không có bước này thì #2 được bỏ qua
// kèm cảnh báo, không tính là lỗi.

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

// ---- Bảng kỳ vọng: sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới ----
const EXPECTED = {
  counts: {},          // vd "flashcards:sysprog": 90
};

// ---- Khung chạy ----
const failures = [];
let checked = 0;

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function check(name, fn) {
  checked++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function dupes(ids) {
  const seen = new Set(), dup = new Set();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

// ---- Nạp dữ liệu ----
const { DOMAINS, TOPICS } = await import("./js/data/meta.js");
const { docs } = await import("./js/data/docs-index.js");
const { tracks } = await import("./js/data/roadmap.js");
const { flashcards } = await import("./js/data/flashcards.js");
const { questions } = await import("./js/data/questions.js");

const allItems = tracks.flatMap((t) => t.weeks.flatMap((w) => w.items));
const fieldOf = (rec) => rec.field ?? "kubernetes";

console.log("Kiểm tra dữ liệu DevPrep\n");

// #1 — Id duy nhất
await check("Id tài liệu duy nhất", () => {
  const d = dupes(docs.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});
await check("Id mục lộ trình duy nhất (mọi track)", () => {
  const d = dupes(allItems.map((x) => x.id));
  expect(!d.length, `id trùng giữa các track: ${d.join(", ")} — kiểm tiền tố`);
});
await check("Id tuần lộ trình duy nhất (mọi track)", () => {
  const d = dupes(tracks.flatMap((t) => t.weeks.map((w) => w.id)));
  expect(!d.length, `id tuần trùng: ${d.join(", ")}`);
});
await check("Id track duy nhất", () => {
  const d = dupes(tracks.map((t) => t.id));
  expect(!d.length, `id track trùng: ${d.join(", ")}`);
});
await check("Id flashcard duy nhất", () => {
  const d = dupes(flashcards.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});
await check("Id câu hỏi duy nhất", () => {
  const d = dupes(questions.map((x) => x.id));
  expect(!d.length, `id trùng: ${d.join(", ")}`);
});

// #2 — File tài liệu tồn tại
const contentBuilt = existsSync(join(DIR, "content"));
await check("Mọi docs[].file tồn tại trên đĩa", () => {
  if (!contentBuilt) {
    console.log("      (bỏ qua — chưa chạy build-content.sh)");
    return;
  }
  const missing = docs.filter((d) => !existsSync(join(DIR, d.file)));
  expect(!missing.length, `thiếu file: ${missing.map((d) => d.file).join(", ")}`);
});

// #3 — Link nội bộ trỏ tới doc có thật
await check("Mọi link #/docs/<id> trỏ tới tài liệu có thật", () => {
  const ids = new Set(docs.map((d) => d.id));
  const bad = [];
  const scan = (text, where) => {
    for (const m of String(text ?? "").matchAll(/#\/docs\/([A-Za-z0-9_-]+)/g)) {
      if (!ids.has(m[1])) bad.push(`${where} → #/docs/${m[1]}`);
    }
  };
  for (const t of tracks) {
    for (const w of t.weeks) {
      for (const r of w.resources ?? []) scan(r.href, `${w.id} resources`);
      for (const it of w.items) scan(it.lesson, it.id);
    }
  }
  expect(!bad.length, `link hỏng:\n      ${bad.join("\n      ")}`);
});

// #4 — Khoá phân loại hợp lệ và khớp lĩnh vực
await check("question.domain hợp lệ và khớp field", () => {
  const bad = questions.filter((q) => {
    const d = DOMAINS[q.domain];
    return !d || (d.field ?? "kubernetes") !== fieldOf(q);
  });
  expect(!bad.length, `sai domain/field: ${bad.map((q) => q.id).join(", ")}`);
});
await check("flashcard.topic hợp lệ và khớp field", () => {
  const bad = flashcards.filter((c) => {
    const t = TOPICS[c.topic];
    return !t || (t.field ?? "kubernetes") !== fieldOf(c);
  });
  expect(!bad.length, `sai topic/field: ${bad.map((c) => c.id).join(", ")}`);
});

// #6 — Hình dạng câu hỏi
await check("Mỗi câu hỏi có 4 lựa chọn, answer hợp lệ, có giải thích", () => {
  const bad = questions.filter((q) =>
    !Array.isArray(q.options) || q.options.length !== 4 ||
    !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 ||
    !q.explanation || !String(q.explanation).trim());
  expect(!bad.length, `sai hình dạng: ${bad.map((q) => q.id).join(", ")}`);
});

// Bảng kỳ vọng
await check("Số lượng bản ghi khớp bảng kỳ vọng", () => {
  const actual = {};
  for (const f of new Set([...docs, ...flashcards, ...questions].map(fieldOf))) {
    actual[`docs:${f}`] = docs.filter((d) => fieldOf(d) === f).length;
    actual[`flashcards:${f}`] = flashcards.filter((c) => fieldOf(c) === f).length;
    actual[`questions:${f}`] = questions.filter((q) => fieldOf(q) === f).length;
  }
  for (const t of tracks) {
    const f = fieldOf(t);
    actual[`roadmap-items:${f}`] =
      (actual[`roadmap-items:${f}`] ?? 0) + t.weeks.flatMap((w) => w.items).length;
  }
  const bad = Object.entries(EXPECTED.counts)
    .filter(([k, v]) => (actual[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${actual[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});

// ---- Kết luận ----
console.log(`\n${checked - failures.length}/${checked} bất biến đạt`);
if (failures.length) {
  console.error(`\n${failures.length} lỗi:\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Dữ liệu hợp lệ.");
```

Bất biến **#5** (modules ⊆ view thật) và **#7** (lĩnh vực khai module thì phải có dữ liệu) chưa thêm được vì `fields.js` chưa tồn tại — Task 3 sẽ bổ sung.

- [ ] **Step 5: Chạy — phải xanh trên dữ liệu hiện có**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kỳ vọng: `12/12 bất biến đạt` và `Dữ liệu hợp lệ.`, exit 0.

Nếu có bất biến ĐỎ trên dữ liệu hiện có: đó là lỗi có thật trong repo — báo lại trước khi sửa bộ kiểm cho vừa.

- [ ] **Step 6: Chứng minh bộ kiểm bắt được lỗi thật**

```bash
sed -i '' 's/id: "q002"/id: "q001"/' webapp/js/data/questions.js
node webapp/check-data.mjs; echo "exit=$?"
git checkout webapp/js/data/questions.js
```

Kỳ vọng: exit=1, có dòng `✗ Id câu hỏi duy nhất` và `id trùng: q001`.

- [ ] **Step 7: Commit**

```bash
git add webapp/check-data.mjs webapp/package.json
git commit -m "$(cat <<'EOF'
test: thêm bộ kiểm tính toàn vẹn dữ liệu học tập

node webapp/check-data.mjs kiểm id trùng, link #/docs hỏng, khoá phân loại
sai, hình dạng câu hỏi và bảng kỳ vọng số lượng. package.json chỉ khai
type:module để Node đọc được js/data/*.js — không có dependency.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Field registry `fields.js`

**Files:**
- Create: `webapp/js/data/fields.js`
- Modify: `webapp/check-data.mjs` (thêm bất biến #5, #7 và assertion hàm thuần)

**Interfaces:**
- Consumes: không có.
- Produces:
  - `FIELDS: Record<string, {label, icon, desc, certFilter: boolean, modules: string[]}>`
  - `FIELD_ORDER: string[]` — `["kubernetes", "sysprog", "java"]`
  - `DEFAULT_FIELD: string` — `"kubernetes"`
  - `NAV_GROUPS: Array<{title: string, items: Array<{id, label, icon, href}>}>`
  - `navFor(fieldId): Array<{title, items}>` — nhóm nav đã lọc, bỏ nhóm rỗng
  - `moduleAllowed(fieldId, moduleId): boolean`
  - `isField(x): boolean`

  Task 5 dùng `navFor`/`moduleAllowed`; Task 4 dùng `FIELDS`/`DEFAULT_FIELD`; Task 6 dùng `FIELDS` qua re-export ở `docs-index.js`.

Lưu ý: lĩnh vực `sysprog` khởi đầu chỉ khai `modules: ["dashboard"]` — ở task này nó chưa có bất kỳ dữ liệu nào. Các task sau **mở rộng dần** khi dữ liệu tương ứng xuất hiện (`docs` ở Task 6, `roadmap` Task 8, `flashcards` Task 10, `quiz` Task 11). Nhờ vậy bất biến #7 luôn xanh và app luôn chạy được ở mọi commit.

- [ ] **Step 1: Thêm bất biến #5 và #7 vào bộ kiểm — phải đỏ**

Chèn vào `webapp/check-data.mjs` ngay trước khối `// Bảng kỳ vọng`:

```js
// #5 — modules trỏ tới view có thật
const { FIELDS, FIELD_ORDER, DEFAULT_FIELD, navFor, moduleAllowed } =
  await import("./js/data/fields.js");

await check("Mọi module của lĩnh vực là view có thật", () => {
  const views = new Set(
    readdirSync(join(DIR, "js/views")).map((f) => f.replace(/\.js$/, "")));
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    for (const m of f.modules) if (!views.has(m)) bad.push(`${id} → ${m}`);
  }
  expect(!bad.length, `module không có view: ${bad.join(", ")}`);
});

await check("FIELD_ORDER khớp FIELDS và chứa DEFAULT_FIELD", () => {
  expect(FIELD_ORDER.length === Object.keys(FIELDS).length,
    `FIELD_ORDER (${FIELD_ORDER.length}) lệch FIELDS (${Object.keys(FIELDS).length})`);
  for (const id of FIELD_ORDER) expect(FIELDS[id], `FIELD_ORDER có "${id}" không tồn tại trong FIELDS`);
  expect(FIELDS[DEFAULT_FIELD], `DEFAULT_FIELD "${DEFAULT_FIELD}" không tồn tại`);
});

// #7 — khai module nào thì phải có dữ liệu cho module đó
await check("Lĩnh vực khai quiz/flashcards/roadmap/docs thì phải có dữ liệu", () => {
  const bad = [];
  for (const [id, f] of Object.entries(FIELDS)) {
    const has = {
      docs: docs.some((d) => fieldOf(d) === id),
      roadmap: tracks.some((t) => fieldOf(t) === id),
      flashcards: flashcards.some((c) => fieldOf(c) === id),
      quiz: questions.some((q) => fieldOf(q) === id),
    };
    for (const m of f.modules) if (m in has && !has[m]) bad.push(`${id} khai "${m}" nhưng không có dữ liệu`);
  }
  expect(!bad.length, bad.join("; "));
});

await check("navFor() lọc đúng và bỏ nhóm rỗng", () => {
  for (const id of FIELD_ORDER) {
    const groups = navFor(id);
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    const mods = FIELDS[id].modules;
    expect(ids.length === mods.length,
      `navFor("${id}") trả ${ids.length} mục, modules có ${mods.length}`);
    for (const m of mods) expect(ids.includes(m), `navFor("${id}") thiếu "${m}"`);
    for (const g of groups) expect(g.items.length > 0, `navFor("${id}") còn nhóm rỗng "${g.title}"`);
  }
  expect(moduleAllowed("java", "docs") === true, 'moduleAllowed("java","docs") phải là true');
  expect(moduleAllowed("java", "labs") === false, 'moduleAllowed("java","labs") phải là false');
  expect(moduleAllowed("khong-ton-tai", "docs") === false, "lĩnh vực lạ phải trả false");
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: FAIL — `ERR_MODULE_NOT_FOUND ... js/data/fields.js`

- [ ] **Step 3: Viết `fields.js`**

```js
// Khai báo các lĩnh vực học của DevPrep — nguồn sự thật duy nhất.
// Thêm một lĩnh vực hoặc mở thêm module cho lĩnh vực: chỉ sửa file này.
//
// `modules` quyết định sidebar hiện những mục nào. Chỉ khai một module khi
// lĩnh vực đó ĐÃ có dữ liệu tương ứng — check-data.mjs sẽ báo lỗi nếu không.

export const FIELDS = {
  kubernetes: {
    label: "Kubernetes & Chứng chỉ",
    icon: "☸️",
    desc: "Luyện thi CKAD, CKA, CKS: giáo trình theo tuần, tra cứu kubectl, flashcards, trắc nghiệm, thi thử và labs mô phỏng đề thật.",
    certFilter: true,
    modules: ["dashboard", "certs", "roadmap", "docs", "commands",
              "flashcards", "quiz", "exam", "labs"],
  },
  sysprog: {
    label: "Lập trình hệ thống",
    icon: "🖥️",
    desc: "Bản dịch tiếng Việt System Programming Coursebook (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0. C, tiến trình, luồng, đồng bộ hoá, bộ nhớ ảo, IPC, mạng và hệ thống tệp.",
    certFilter: false,
    // Mở dần theo dữ liệu: "docs" thêm ở Task 6, "roadmap" Task 8,
    // "flashcards" Task 10, "quiz" Task 11. Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard"],
  },
  java: {
    label: "Java & Spring Boot Scalability",
    icon: "☕",
    desc: "Series 10 bài về khả năng mở rộng của ứng dụng Java/Spring Boot trên Tomcat: TCP/kernel → Tomcat internals → JVM concurrency → capacity planning → transaction.",
    certFilter: false,
    modules: ["dashboard", "docs"],
  },
};

export const FIELD_ORDER = ["kubernetes", "sysprog", "java"];
export const DEFAULT_FIELD = "kubernetes";

// Thứ tự, nhãn và icon của từng module trong sidebar.
// Lấy nguyên từ index.html cũ để người dùng Kubernetes không thấy khác đi.
export const NAV_GROUPS = [
  { title: "Tổng quan", items: [
      { id: "dashboard",  label: "Bảng điều khiển", icon: "🏠", href: "#/" },
      { id: "certs",      label: "Chứng chỉ K8s",   icon: "🎓", href: "#/certs" },
      { id: "roadmap",    label: "Lộ trình học",    icon: "🗺️", href: "#/roadmap" } ] },
  { title: "Học & tham khảo", items: [
      { id: "docs",       label: "Tài liệu",        icon: "📚", href: "#/docs" },
      { id: "commands",   label: "Thực hành nhanh", icon: "⚡", href: "#/commands" } ] },
  { title: "Luyện tập", items: [
      { id: "flashcards", label: "Flashcards",      icon: "🃏", href: "#/flashcards" },
      { id: "quiz",       label: "Trắc nghiệm",     icon: "✅", href: "#/quiz" },
      { id: "exam",       label: "Thi thử",         icon: "⏱️", href: "#/exam" },
      { id: "labs",       label: "Labs thực hành",  icon: "🧪", href: "#/labs" } ] },
];

export function isField(id) {
  return Object.prototype.hasOwnProperty.call(FIELDS, id);
}

export function moduleAllowed(fieldId, moduleId) {
  return isField(fieldId) && FIELDS[fieldId].modules.includes(moduleId);
}

// Nhóm nav của một lĩnh vực: giữ lại module lĩnh vực đó có, bỏ nhóm rỗng.
export function navFor(fieldId) {
  const id = isField(fieldId) ? fieldId : DEFAULT_FIELD;
  const mods = new Set(FIELDS[id].modules);
  return NAV_GROUPS
    .map((g) => ({ title: g.title, items: g.items.filter((i) => mods.has(i.id)) }))
    .filter((g) => g.items.length > 0);
}
```

- [ ] **Step 4: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `16/16 bất biến đạt`, exit 0.

- [ ] **Step 5: Chứng minh bất biến #7 bắt được lỗi**

Tạm thêm `"quiz"` vào `modules` của `sysprog` trong `fields.js`, chạy `node webapp/check-data.mjs` — kỳ vọng ĐỎ với `sysprog khai "quiz" nhưng không có dữ liệu`. Hoàn tác thay đổi tạm đó rồi chạy lại cho xanh.

- [ ] **Step 6: Commit**

```bash
git add webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: field registry — khai báo tập trung 3 lĩnh vực học

fields.js là nguồn sự thật cho lĩnh vực + module + nav. navFor()/moduleAllowed()
là hàm thuần nên kiểm được ngoài trình duyệt. Bổ sung 4 bất biến vào check-data.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Lớp truy cập `index.js` và taxonomy theo lĩnh vực

**Files:**
- Create: `webapp/js/data/index.js`
- Modify: `webapp/js/data/meta.js`
- Modify: `webapp/check-data.mjs` (đổi nguồn nạp sang accessor)

**Interfaces:**
- Consumes: `FIELDS`, `DEFAULT_FIELD` từ `fields.js` (Task 3).
- Produces — mọi view từ Task 5 trở đi dùng các hàm này thay vì import mảng thô:
  - `allDocs, allTracks, allFlashcards, allQuestions` — mảng gộp mọi lĩnh vực
  - `getDocs(fieldId): Doc[]`
  - `getTracks(fieldId): Track[]`
  - `getFlashcards(fieldId): Flashcard[]`
  - `getQuestions(fieldId): Question[]`
  - `getDomains(fieldId): Array<[key, domain]>`
  - `getTopics(fieldId): Array<[key, topic]>`
  - `fieldOfRecord(rec): string`
  - `fieldOfDoc(docId): string | null`
  - `fieldOfTrack(trackId): string | null`

- [ ] **Step 1: Thêm bất biến field-tagging — phải đỏ**

Thêm vào `webapp/check-data.mjs` ngay trước khối `// Bảng kỳ vọng`:

```js
await check("Mọi DOMAINS/TOPICS khai field hợp lệ", () => {
  const bad = [];
  for (const [k, d] of Object.entries(DOMAINS))
    if (!d.field) bad.push(`DOMAINS.${k} thiếu field`);
    else if (!FIELDS[d.field]) bad.push(`DOMAINS.${k}.field="${d.field}" không tồn tại`);
  for (const [k, t] of Object.entries(TOPICS))
    if (!t.field) bad.push(`TOPICS.${k} thiếu field`);
    else if (!FIELDS[t.field]) bad.push(`TOPICS.${k}.field="${t.field}" không tồn tại`);
  expect(!bad.length, bad.join("; "));
});

await check("Accessor lọc đúng theo lĩnh vực", async () => {
  const api = await import("./js/data/index.js");
  const total = api.allQuestions.length;
  const sum = FIELD_ORDER.reduce((n, f) => n + api.getQuestions(f).length, 0);
  expect(sum === total, `tổng theo lĩnh vực (${sum}) lệch tổng thật (${total})`);
  expect(api.getDocs("java").every((d) => d.field === "java"), "getDocs('java') lẫn lĩnh vực khác");
  expect(api.fieldOfRecord({}) === "kubernetes", "bản ghi không có field phải mặc định kubernetes");
  expect(api.fieldOfDoc("java-01") === "java", "fieldOfDoc('java-01') phải là java");
  expect(api.fieldOfTrack("ckad") === "kubernetes", "fieldOfTrack('ckad') phải là kubernetes");
  expect(api.fieldOfDoc("khong-ton-tai") === null, "doc id lạ phải trả null");
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ ở `Mọi DOMAINS/TOPICS khai field hợp lệ` (thiếu `field`) và `ERR_MODULE_NOT_FOUND` cho `index.js`.

- [ ] **Step 3: Gắn `field` cho taxonomy hiện có và thêm 7 khoá sysprog**

Trong `webapp/js/data/meta.js`: thêm `field: "kubernetes"` vào **mọi** entry của `DOMAINS` (8 entry: `design`, `deployment`, `observability`, `config`, `networking`, `cka-core`, `cks-core`, `kcna-core`) và **mọi** entry của `TOPICS` (12 entry: `architecture` … `exam-tips`).

Ví dụ một entry sau khi sửa:

```js
  design: {
    label: "Application Design and Build",
    short: "Design & Build",
    weight: 20,
    cert: "CKAD",
    field: "kubernetes",
  },
```

Rồi thêm vào **cả `DOMAINS` và `TOPICS`** 7 khoá dùng chung (cùng `label`/`short` ở `DOMAINS`, chỉ `label` ở `TOPICS`):

```js
  // ===== System Programming (chương nguồn trong ngoặc) =====
  "sp-c":           { label: "C & Bộ nhớ",               short: "C & Bộ nhớ",     weight: 0, field: "sysprog" }, // ch 2, 3, 5
  "sp-process":     { label: "Tiến trình & Tín hiệu",    short: "Tiến trình",     weight: 0, field: "sysprog" }, // ch 4, 13
  "sp-concurrency": { label: "Luồng & Đồng bộ hoá",      short: "Đồng bộ hoá",    weight: 0, field: "sysprog" }, // ch 6, 7
  "sp-deadlock":    { label: "Deadlock & Lập lịch",      short: "Deadlock",       weight: 0, field: "sysprog" }, // ch 8, 10
  "sp-memory-ipc":  { label: "Bộ nhớ ảo & IPC",          short: "Bộ nhớ ảo & IPC", weight: 0, field: "sysprog" }, // ch 9
  "sp-io":          { label: "Hệ thống tệp & Mạng",      short: "Tệp & Mạng",     weight: 0, field: "sysprog" }, // ch 11, 12
  "sp-security":    { label: "Bảo mật",                  short: "Bảo mật",        weight: 0, field: "sysprog" }, // ch 14
```

Entry `DOMAINS` của sysprog **không có trường `cert`** — đó là chủ ý, và `quiz.js` (Task 11) phải xử lý được.

- [ ] **Step 4: Viết `js/data/index.js`**

```js
// Lớp truy cập dữ liệu học tập theo lĩnh vực.
//
// Bản ghi Kubernetes cũ KHÔNG khai `field` — mặc định "kubernetes" ở đây.
// Nhờ vậy 194 bản ghi hiện có không phải sửa và tiến độ localStorage an toàn.

import { DEFAULT_FIELD, isField } from "./fields.js";
import { DOMAINS, TOPICS } from "./meta.js";
import { docs } from "./docs-index.js";
import { tracks } from "./roadmap.js";
import { flashcards } from "./flashcards.js";
import { questions } from "./questions.js";

export const allDocs = docs;
export const allTracks = tracks;
export const allFlashcards = flashcards;
export const allQuestions = questions;

export function fieldOfRecord(rec) {
  const f = rec?.field;
  return isField(f) ? f : DEFAULT_FIELD;
}

const by = (arr) => (fieldId) => arr.filter((r) => fieldOfRecord(r) === fieldId);

export const getDocs = by(allDocs);
export const getTracks = by(allTracks);
export const getFlashcards = by(allFlashcards);
export const getQuestions = by(allQuestions);

export const getDomains = (fieldId) =>
  Object.entries(DOMAINS).filter(([, d]) => d.field === fieldId);

export const getTopics = (fieldId) =>
  Object.entries(TOPICS).filter(([, t]) => t.field === fieldId);

export function fieldOfDoc(docId) {
  const d = allDocs.find((x) => x.id === docId);
  return d ? fieldOfRecord(d) : null;
}

export function fieldOfTrack(trackId) {
  const t = allTracks.find((x) => x.id === trackId);
  return t ? fieldOfRecord(t) : null;
}
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `18/18 bất biến đạt`, exit 0.

- [ ] **Step 6: Xác minh app chưa hỏng**

```bash
./webapp/dev.sh 8899 &
sleep 3 && curl -sf http://localhost:8899/ >/dev/null && echo "server OK" && kill %1
```

Mở `http://localhost:8899/` trong trình duyệt, kiểm console không có lỗi và các trang cũ vẫn chạy (chưa có gì đổi về giao diện ở task này).

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/index.js webapp/js/data/meta.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: lớp truy cập dữ liệu theo lĩnh vực + taxonomy sysprog

index.js gộp và lọc dữ liệu theo lĩnh vực, mặc định "kubernetes" cho bản ghi
cũ nên không phải sửa 194 bản ghi hiện có. meta.js gắn field cho DOMAINS/TOPICS
và thêm 7 khoá sp-* dùng chung cho flashcards lẫn trắc nghiệm.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Sidebar sinh từ registry + bộ chọn lĩnh vực

**Files:**
- Modify: `webapp/index.html:38-60` (khối `<nav class="nav">`)
- Modify: `webapp/js/app.js`
- Modify: `webapp/css/style.css` (thêm style bộ chọn lĩnh vực)

**Interfaces:**
- Consumes: `navFor`, `moduleAllowed`, `FIELDS`, `FIELD_ORDER`, `DEFAULT_FIELD`, `isField` từ `fields.js`; `fieldOfDoc`, `fieldOfTrack` từ `index.js`.
- Produces: `webapp/js/lib/field.js` — `currentField(): string` và `setCurrentField(id): boolean`. Task 6, 7, 10, 11 import `currentField` **từ `../lib/field.js`**, KHÔNG từ `app.js`.

> ⚠️ **Vì sao tách file riêng.** `app.js` đã import mọi view (bảng `routes`). Nếu view lại import `currentField` từ `app.js` thì thành vòng tròn `app → views/docs → app`. ES module vẫn chạy được nhờ function declaration được hoist, nhưng đó là may mắn chứ không phải thiết kế — chỉ cần đổi `function` thành `const` là vỡ. `lib/field.js` không import view nào nên cắt đứt vòng lặp.

- [ ] **Step 1: Ghi nhận hành vi hiện tại để so sánh sau**

```bash
./webapp/dev.sh 8899 &
sleep 3
curl -s http://localhost:8899/index.html | grep -c 'class="nav-link"'   # kỳ vọng: 9
kill %1
```

- [ ] **Step 2: Rỗng hoá nav trong `index.html`**

Thay toàn bộ khối từ `<nav class="nav">` tới `</nav>` bằng:

```html
      <div class="field-switch" id="field-switch"></div>
      <nav class="nav" id="nav"></nav>
```

- [ ] **Step 3a: Tạo `js/lib/field.js`**

```js
// Lĩnh vực học đang chọn.
//
// Đây là trạng thái UI, KHÔNG nằm trong URL: markdown bài học của các track
// K8s chứa hàng trăm link #/docs/… và mọi id đều đã duy nhất toàn cục, nên
// thêm cấp lĩnh vực vào hash chỉ tổ làm hỏng link cũ.
//
// File này cố tình KHÔNG import view nào — nhờ vậy view import được nó mà
// không tạo vòng tròn với app.js (app.js đã import toàn bộ view).

import { store } from "./store.js";
import { DEFAULT_FIELD, isField } from "../data/fields.js";

export function currentField() {
  const f = store.get("field");
  return isField(f) ? f : DEFAULT_FIELD;
}

// Trả về true nếu lĩnh vực thực sự đổi.
export function setCurrentField(id) {
  if (!isField(id) || id === currentField()) return false;
  store.set("field", id);
  return true;
}
```

- [ ] **Step 3b: Đổi `js/app.js` để render nav và quản lý lĩnh vực**

Thêm import ở đầu file, ngay sau `import { store } from "./lib/store.js";`:

```js
import { currentField, setCurrentField } from "./lib/field.js";
import { FIELDS, FIELD_ORDER, navFor, moduleAllowed } from "./data/fields.js";
import { fieldOfDoc, fieldOfTrack } from "./data/index.js";
```

Thêm khối render nav, đặt ngay trước phần `// ---------- Router ----------`:

```js
// ---------- Lĩnh vực ----------

function onFieldChange(id) {
  if (!setCurrentField(id)) return;
  renderFieldSwitch();
  renderNav();
  navigate();
}

const fieldSwitch = document.getElementById("field-switch");
const navEl = document.getElementById("nav");

function renderFieldSwitch() {
  const cur = currentField();
  fieldSwitch.innerHTML = "";
  const sel = document.createElement("select");
  sel.className = "select field-select";
  sel.setAttribute("aria-label", "Chọn lĩnh vực học");
  for (const id of FIELD_ORDER) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${FIELDS[id].icon} ${FIELDS[id].label}`;
    if (id === cur) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener("change", () => onFieldChange(sel.value));
  fieldSwitch.append(sel);
}

function renderNav() {
  const cur = currentField();
  navEl.innerHTML = "";
  for (const group of navFor(cur)) {
    const g = document.createElement("div");
    g.className = "nav-group";
    const t = document.createElement("div");
    t.className = "nav-title";
    t.textContent = group.title;
    g.append(t);
    for (const item of group.items) {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.href = item.href;
      a.dataset.route = item.id;
      const ico = document.createElement("span");
      ico.className = "nav-ico";
      ico.textContent = item.icon;
      a.append(ico, document.createTextNode(" " + item.label));
      g.append(a);
    }
    navEl.append(g);
  }
}
```

- [ ] **Step 4: Đồng bộ lĩnh vực từ deep-link trong `navigate()`**


Thay thân hàm `navigate()` bằng:

```js
function navigate() {
  const { name, params } = parseHash();

  // Deep-link tới tài liệu/track của lĩnh vực khác → chuyển lĩnh vực theo nội dung.
  let owner = null;
  if (name === "docs" && params[0]) owner = fieldOfDoc(params[0]);
  if (name === "roadmap" && params[0]) owner = fieldOfTrack(params[0]);
  if (owner && setCurrentField(owner)) {
    renderFieldSwitch();
    renderNav();
  }

  // Route không thuộc lĩnh vực đang chọn → về bảng điều khiển.
  let routeName = routes[name] ? name : "dashboard";
  if (!moduleAllowed(currentField(), routeName)) routeName = "dashboard";
  const view = routes[routeName];

  if (currentView && typeof currentView.cleanup === "function") {
    try { currentView.cleanup(); } catch { /* ignore */ }
  }
  currentView = view;

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === routeName);
  });

  closeSidebar();
  main.innerHTML = "";
  const page = document.createElement("div");
  page.className = "fade-in";
  main.append(page);
  view.render(page, routeName === name ? params : []);
  window.scrollTo({ top: 0 });
}
```

Và đổi hai dòng khởi động ở cuối file thành:

```js
window.addEventListener("hashchange", navigate);
renderFieldSwitch();
renderNav();
navigate();
```

- [ ] **Step 5: Thêm style cho bộ chọn lĩnh vực**

Chèn vào `webapp/css/style.css` ngay sau khối `.nav-ico` (dòng ~224):

```css
.field-switch { padding: 0 12px 10px; }
.field-select {
  width: 100%;
  font-size: 13px;
  padding: 7px 9px;
}
```

- [ ] **Step 6: Kiểm bằng tay**

```bash
./webapp/dev.sh 8899
```

Mở `http://localhost:8899/` và kiểm:

| Thao tác | Kỳ vọng |
|---|---|
| Mặc định | Bộ chọn hiện "☸️ Kubernetes & Chứng chỉ", sidebar đủ **9** mục như cũ |
| Chọn "🖥️ Lập trình hệ thống" | Sidebar còn **1** mục: Bảng điều khiển (tài liệu sysprog thêm ở Task 6) |
| Chọn "☕ Java & Spring Boot Scalability" | Sidebar còn **2** mục |
| Đang ở lĩnh vực Java, gõ `#/labs` | Tự về bảng điều khiển |
| Đang ở Lập trình hệ thống, gõ `#/docs` | Tự về bảng điều khiển (chưa mở module docs) |
| Mở thẳng `#/docs/java-01` | Bộ chọn tự nhảy sang Java, tài liệu hiển thị |
| Mở thẳng `#/roadmap/cka` | Bộ chọn tự nhảy sang Kubernetes, giáo trình CKA hiển thị |
| Reload trang | Lĩnh vực đang chọn được giữ nguyên |
| Console trình duyệt | Không có lỗi |

- [ ] **Step 7: Xác minh tiến độ cũ còn nguyên**

Trong console trình duyệt:

```js
Object.keys(JSON.parse(localStorage.getItem("kubeprep.roadmap.checked") || "{}")).length
```

Con số này phải bằng đúng con số trước khi đổi (nếu bạn chưa từng tick gì thì là `0`).

- [ ] **Step 8: Commit**

```bash
git add webapp/index.html webapp/js/app.js webapp/js/lib/field.js webapp/css/style.css
git commit -m "$(cat <<'EOF'
feat: sidebar sinh từ field registry + bộ chọn lĩnh vực

Nav không còn hardcode trong index.html mà render từ fields.js theo lĩnh vực
đang chọn. Lĩnh vực lưu ở localStorage, không đưa vào URL — deep-link cũ giữ
nguyên và app tự suy lĩnh vực từ #/docs/<id> hoặc #/roadmap/<track>.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 18 tài liệu System Programming

**Files:**
- Modify: `webapp/js/data/docs-index.js`
- Modify: `webapp/js/views/docs.js:1-62`
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: `FIELDS` từ `fields.js`; `getDocs`, `fieldOfRecord` từ `index.js`; `currentField()` từ `app.js`.
- Produces: 18 doc id `sysprog-01` … `sysprog-18`. Task 8 và 9 trỏ link `#/docs/sysprog-NN` vào chúng — **không được đổi id sau đó**.

Ánh xạ id → file (đúng tên file trong `System_Programming_VI/`):

| id | file | tiêu đề chương |
|---|---|---|
| `sysprog-01` | `01-introduction.md` | Giới thiệu |
| `sysprog-02` | `02-background.md` | Kiến thức nền tảng |
| `sysprog-03` | `03-c-programming-language.md` | Ngôn ngữ lập trình C |
| `sysprog-04` | `04-processes.md` | Tiến trình |
| `sysprog-05` | `05-memory-allocators.md` | Bộ cấp phát bộ nhớ |
| `sysprog-06` | `06-threads.md` | Luồng |
| `sysprog-07` | `07-synchronization.md` | Đồng bộ hoá |
| `sysprog-08` | `08-deadlock.md` | Deadlock |
| `sysprog-09` | `09-virtual-memory-and-ipc.md` | Bộ nhớ ảo và IPC |
| `sysprog-10` | `10-scheduling.md` | Lập lịch |
| `sysprog-11` | `11-networking.md` | Lập trình mạng |
| `sysprog-12` | `12-filesystems.md` | Hệ thống tệp |
| `sysprog-13` | `13-signals.md` | Tín hiệu |
| `sysprog-14` | `14-security.md` | Bảo mật |
| `sysprog-15` | `15-review.md` | Ôn tập |
| `sysprog-16` | `16-honors-topics.md` | Chủ đề nâng cao |
| `sysprog-17` | `17-appendix.md` | Phụ lục |
| `sysprog-18` | `18-post-mortems.md` | Phân tích hậu sự cố |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa `EXPECTED`:

```js
const EXPECTED = {
  counts: {
    "docs:sysprog": 18,
  },
};
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `docs:sysprog: kỳ vọng 18, thực tế 0`.

- [ ] **Step 3: `docs-index.js` re-export `FIELDS`**

Thay khối `export const FIELDS = { … };` ở đầu file bằng:

```js
// Thư viện tài liệu — nhóm theo lĩnh vực.
// File nguồn nằm trong repo (CKAD/, CKA/, CKS/, "Chủ đề …", System_Programming_VI/);
// khi deploy (hoặc chạy dev.sh) chúng được copy vào webapp/content/ bởi
// build-content.sh.
//
// FIELDS đã chuyển sang fields.js (nguồn sự thật duy nhất); re-export để các
// import cũ không phải đổi.
export { FIELDS } from "./fields.js";
```

- [ ] **Step 4: Thêm 18 entry sysprog vào cuối mảng `docs`**

Ngay trước dấu `];` đóng mảng, thêm khối sau. `desc` phải tóm đúng nội dung chương, `tags` 2–3 thẻ.

```js
  // ===== System Programming (bản dịch UIUC CS 241, CC BY 4.0) =====
  {
    id: "sysprog-01",
    field: "sysprog",
    title: "01 — Giới thiệu",
    file: "content/sysprog/01-introduction.md",
    icon: "📖",
    desc: "Vì sao học lập trình hệ thống, cách dùng cuốn sách, quy ước ký hiệu và lời khuyên cho người mới.",
    tags: ["Nhập môn", "CS 241"],
  },
  {
    id: "sysprog-02",
    field: "sysprog",
    title: "02 — Kiến thức nền tảng",
    file: "content/sysprog/02-background.md",
    icon: "🧱",
    desc: "Kiến trúc hệ thống, ranh giới user space / kernel space, môi trường làm việc, Valgrind và GDB.",
    tags: ["Kiến trúc", "Valgrind", "GDB"],
  },
  {
    id: "sysprog-03",
    field: "sysprog",
    title: "03 — Ngôn ngữ lập trình C",
    file: "content/sysprog/03-c-programming-language.md",
    icon: "🔤",
    desc: "Cú pháp C, mô hình bộ nhớ (text/data/heap/stack), con trỏ, số học con trỏ và các lỗi kinh điển.",
    tags: ["C", "Con trỏ", "Bộ nhớ"],
  },
  {
    id: "sysprog-04",
    field: "sysprog",
    title: "04 — Tiến trình",
    file: "content/sysprog/04-processes.md",
    icon: "⚙️",
    desc: "File descriptor, nội dung một process, fork/wait/exec và mẫu fork-exec-wait.",
    tags: ["Process", "fork", "exec"],
  },
  {
    id: "sysprog-05",
    field: "sysprog",
    title: "05 — Bộ cấp phát bộ nhớ",
    file: "content/sysprog/05-memory-allocators.md",
    icon: "🧮",
    desc: "malloc/free/calloc/realloc, first–best–worst fit, tự xây allocator, buddy và SLUB.",
    tags: ["malloc", "Allocator", "Phân mảnh"],
  },
  {
    id: "sysprog-06",
    field: "sysprog",
    title: "06 — Luồng",
    file: "content/sysprog/06-threads.md",
    icon: "🧵",
    desc: "Process khác thread ở đâu, bên trong một thread, pthread_create/join và race condition.",
    tags: ["Thread", "pthread", "Race"],
  },
  {
    id: "sysprog-07",
    field: "sysprog",
    title: "07 — Đồng bộ hoá",
    file: "content/sysprog/07-synchronization.md",
    icon: "🔒",
    desc: "Mutex, condition variable, semaphore, barrier, ring buffer và các lời giải cho vùng găng.",
    tags: ["Mutex", "Semaphore", "Ring buffer"],
  },
  {
    id: "sysprog-08",
    field: "sysprog",
    title: "08 — Deadlock",
    file: "content/sysprog/08-deadlock.md",
    icon: "🪤",
    desc: "Đồ thị cấp phát tài nguyên, bốn điều kiện Coffman, bài toán triết gia ăn tối và các lời giải.",
    tags: ["Deadlock", "Coffman", "Livelock"],
  },
  {
    id: "sysprog-09",
    field: "sysprog",
    title: "09 — Bộ nhớ ảo và IPC",
    file: "content/sysprog/09-virtual-memory-and-ipc.md",
    icon: "🗺️",
    desc: "Dịch địa chỉ, page table, TLB, mmap, pipe và named pipe — bốn cách để process nói chuyện với nhau.",
    tags: ["Bộ nhớ ảo", "mmap", "Pipe"],
  },
  {
    id: "sysprog-10",
    field: "sysprog",
    title: "10 — Lập lịch",
    file: "content/sysprog/10-scheduling.md",
    icon: "📅",
    desc: "Các thước đo hiệu quả (turnaround, response, waiting time) và thuật toán FCFS, SJF, RR, PS.",
    tags: ["Scheduler", "Round Robin", "SJF"],
  },
  {
    id: "sysprog-11",
    field: "sysprog",
    title: "11 — Lập trình mạng",
    file: "content/sysprog/11-networking.md",
    icon: "🌐",
    desc: "Mô hình OSI, IP, TCP client/server, UDP, HTTP, I/O không chặn và remote procedure call.",
    tags: ["TCP", "Socket", "Non-blocking"],
  },
  {
    id: "sysprog-12",
    field: "sysprog",
    title: "12 — Hệ thống tệp",
    file: "content/sysprog/12-filesystems.md",
    icon: "💾",
    desc: "inode, lưu dữ liệu trên đĩa, bit quyền, virtual filesystem, memory mapped IO và tính tin cậy.",
    tags: ["inode", "Quyền", "VFS"],
  },
  {
    id: "sysprog-13",
    field: "sysprog",
    title: "13 — Tín hiệu",
    file: "content/sysprog/13-signals.md",
    icon: "📡",
    desc: "Gửi và xử lý signal, hàm async-signal-safe, signal mask, tín hiệu trong process con và thread.",
    tags: ["Signal", "sigaction", "Mask"],
  },
  {
    id: "sysprog-14",
    field: "sysprog",
    title: "14 — Bảo mật",
    file: "content/sysprog/14-security.md",
    icon: "🛡️",
    desc: "Thuật ngữ và đạo đức bảo mật, lỗ hổng trong chương trình C (buffer overflow, format string), an ninh mạng.",
    tags: ["Bảo mật", "Buffer overflow"],
  },
  {
    id: "sysprog-15",
    field: "sysprog",
    title: "15 — Ôn tập",
    file: "content/sysprog/15-review.md",
    icon: "📝",
    desc: "Ngân hàng câu hỏi ôn tập cho 10 mảng: C, process, bộ nhớ, threading, deadlock, IPC, filesystem, mạng, bảo mật, signal.",
    tags: ["Ôn tập", "Bài tập"],
  },
  {
    id: "sysprog-16",
    field: "sysprog",
    title: "16 — Chủ đề nâng cao",
    file: "content/sysprog/16-honors-topics.md",
    icon: "🎖️",
    desc: "Các chủ đề mở rộng ngoài chương trình chuẩn của môn học.",
    tags: ["Nâng cao"],
  },
  {
    id: "sysprog-17",
    field: "sysprog",
    title: "17 — Phụ lục",
    file: "content/sysprog/17-appendix.md",
    icon: "📎",
    desc: "Shell, stack smashing, biên dịch & liên kết, giải thuật Banker, mô hình Actor, spurious wakeup, trang man.",
    tags: ["Phụ lục", "Tham khảo"],
  },
  {
    id: "sysprog-18",
    field: "sysprog",
    title: "18 — Phân tích hậu sự cố",
    file: "content/sysprog/18-post-mortems.md",
    icon: "🔍",
    desc: "16 sự cố thật: Shellshock, Heartbleed, Dirty COW, Meltdown, Spectre, Mars Pathfinder, AT&T 1990, Year 2038…",
    tags: ["Post-mortem", "Sự cố thật"],
  },
```

- [ ] **Step 5: Cho `docs.js` chỉ hiện lĩnh vực đang chọn**

Trong `webapp/js/views/docs.js`, đổi import đầu file:

```js
import { h, pageHead, mdInto } from "../lib/ui.js";
import { docs, FIELDS } from "../data/docs-index.js";
import { getDocs } from "../data/index.js";
import { currentField } from "../lib/field.js";
```

Rồi thay thân `renderIndex` bằng:

```js
function renderIndex(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const list = getDocs(fieldKey);

  const page = h("div", { class: "page" });
  page.append(pageHead(
    `${field.icon} Thư viện tài liệu — ${field.label}`,
    `${list.length} tài liệu — đọc trực tiếp với mục lục, sơ đồ mermaid, ảnh minh họa và code có nút copy.`
  ));
  page.append(h("p", { class: "muted small", style: "margin:-8px 0 20px" }, field.desc));

  const grid = h("div", { class: "grid", style: "margin-bottom:26px" });
  for (const d of list) {
    grid.append(
      h("a", { class: "card card-link", href: `#/docs/${d.id}` },
        h("div", { class: "flex" },
          h("span", { style: "font-size:24px" }, d.icon),
          h("div", { class: "grow" },
            h("div", { class: "lab-title" }, d.title),
            h("div", { class: "muted small" }, d.desc)),
          h("span", { class: "faint" }, "Đọc →")),
        h("div", { class: "chip-row", style: "margin-top:10px" },
          d.tags.map((t) => h("span", { class: "badge badge-blue" }, t)))
      )
    );
  }
  page.append(grid);
  root.append(page);
}
```

`navRow` giữ nguyên — nó đã lọc theo `d.field`, nhưng cần sửa một dòng để bản ghi K8s (không có `field`) vẫn nhóm đúng:

```js
function navRow(doc) {
  const sameField = getDocs(fieldOfRecord(doc));
```

và thêm `fieldOfRecord` vào import từ `../data/index.js`.

- [ ] **Step 6: Mở module `docs` cho sysprog**

Trong `webapp/js/data/fields.js`, đổi `modules` của `sysprog` thành:

```js
    modules: ["dashboard", "docs"],
```

Bất biến #7 chỉ xanh sau khi 18 tài liệu ở Step 4 đã tồn tại — đó là lý do bước này nằm sau, không nằm trước.

- [ ] **Step 7: Chạy bộ kiểm — phải xanh**

```bash
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kỳ vọng: mọi bất biến đạt, gồm cả `docs:sysprog: 18` và `Mọi docs[].file tồn tại trên đĩa`.

- [ ] **Step 8: Kiểm bằng tay**

```bash
./webapp/dev.sh 8899
```

| Thao tác | Kỳ vọng |
|---|---|
| Chọn lĩnh vực "🖥️ Lập trình hệ thống" → Tài liệu | Danh sách **18** thẻ |
| Mở `sysprog-11` | Nội dung chương 11 render, mục lục nổi bên phải |
| Cuộn tới §11.2 trong `sysprog-11` | Ảnh `fig-11.1.png` **hiển thị được** (không phải icon ảnh hỏng) |
| Cuối trang `sysprog-11` | Nút "← 10 — Lập lịch" và "12 — Hệ thống tệp →" |
| Đổi sang lĩnh vực Kubernetes → Tài liệu | Chỉ **7** thẻ CKAD/CKA/CKS |
| Đổi sang Java → Tài liệu | Chỉ **10** thẻ Java |

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/js/views/docs.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: 18 tài liệu System Programming vào thư viện

Thư viện tài liệu giờ chỉ hiện lĩnh vực đang chọn. Ảnh của sách dùng đường
dẫn tương đối images/fig-N.M.png và được fixRelativePaths resolve về
content/sysprog/images/ — không phải sửa markdown nguồn.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Bảng điều khiển và trang lộ trình theo lĩnh vực

**Files:**
- Modify: `webapp/js/views/dashboard.js`
- Modify: `webapp/js/views/roadmap.js:1-66`

**Interfaces:**
- Consumes: `currentField()` từ `app.js`; `getTracks`, `getFlashcards`, `getQuestions`, `getDocs` từ `index.js`; `FIELDS`, `FIELD_ORDER`, `moduleAllowed` từ `fields.js`.
- Produces: không có API mới.

- [ ] **Step 1: Ghi nhận hành vi hiện tại**

Mở `http://localhost:8899/#/roadmap` khi lĩnh vực là Kubernetes — phải thấy 3 thẻ track (CKAD, CKA, CKS) và dải "🎯 CKAD → 🛠️ CKA → 🔐 CKS".

- [ ] **Step 2: `roadmap.js` lọc theo lĩnh vực**

Đổi import:

```js
import { h, pageHead, inlineMd, mdInto } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { tracks, getTrack } from "../data/roadmap.js";
import { getTracks } from "../data/index.js";
import { FIELDS } from "../data/fields.js";
import { currentField } from "../lib/field.js";
```

Thay `renderChooser` bằng:

```js
function renderChooser(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const list = getTracks(fieldKey);
  const page = h("div", { class: "page" });
  const checked = store.get("roadmap.checked", {});

  page.append(pageHead(
    "🗺️ Lộ trình học",
    list.length > 1
      ? `${list.length} giáo trình tương tác của lĩnh vực ${field.label} — mỗi mục là một bài học, tick đến đâu lưu đến đó.`
      : `Giáo trình tương tác của lĩnh vực ${field.label} — mỗi mục là một bài học, tick đến đâu lưu đến đó.`
  ));

  // Dải thứ tự khuyến nghị chỉ có nghĩa với 3 chứng chỉ Kubernetes.
  if (fieldKey === "kubernetes") {
    page.append(
      h("div", { class: "path-flow", style: "margin-bottom:18px" },
        h("span", { class: "path-node" }, "🎯 CKAD"),
        h("span", { class: "path-arrow" }, "→"),
        h("span", { class: "path-node" }, "🛠️ CKA"),
        h("span", { class: "path-arrow" }, "→"),
        h("span", { class: "path-node" }, "🔐 CKS"))
    );
  }

  const grid = h("div", { class: "grid" });
  for (const track of list) {
    const s = trackStats(track, checked);
    const started = s.done > 0;
    grid.append(
      h("a", { class: "card card-link", href: `#/roadmap/${track.id}` },
        h("div", { class: "flex", style: "align-items:flex-start" },
          h("span", { style: "font-size:30px" }, track.icon),
          h("div", { class: "grow", style: "min-width:0" },
            h("div", { class: "flex flex-wrap" },
              h("strong", { style: "font-size:17px" }, track.label),
              h("span", { class: "muted small" }, track.name)),
            h("p", { class: "muted small", style: "margin:6px 0" }, track.desc),
            h("p", { class: "faint", style: "margin:0 0 8px" }, `ℹ️ ${track.prereq}`),
            h("div", { class: "flex" },
              h("div", { class: "progress green grow", style: "max-width:260px" },
                h("span", { style: `width:${s.pct}%` })),
              h("span", { class: "small", style: "font-weight:700" }, `${s.done}/${s.total} bài · ${s.pct}%`))),
          h("span", { class: "btn btn-sm", style: "flex:none" },
            started ? "Tiếp tục →" : "Bắt đầu →")))
    );
  }
  page.append(grid);
  root.append(page);
}
```

- [ ] **Step 3: `dashboard.js` tính theo lĩnh vực**

Đổi import:

```js
import { h } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getTracks, getFlashcards, getQuestions, getDocs } from "../data/index.js";
import { FIELDS, FIELD_ORDER, moduleAllowed } from "../data/fields.js";
import { labs } from "../data/labs.js";
import { currentField } from "../lib/field.js";
```

Đổi 4 hàm thống kê để nhận lĩnh vực — thay `tracks`, `flashcards`, `questions` bằng tham số:

```js
function roadmapStats(fieldKey) {
  const checked = store.get("roadmap.checked", {});
  const per = getTracks(fieldKey).map((t) => {
    const items = t.weeks.flatMap((w) => w.items);
    const done = items.filter((it) => checked[it.id]).length;
    return { label: t.label, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  });
  const done = per.reduce((a, p) => a + p.done, 0);
  const total = per.reduce((a, p) => a + p.total, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, per };
}

function flashStats(fieldKey) {
  const srs = store.get("flash.srs", {});
  const now = Date.now();
  const cards = getFlashcards(fieldKey);
  let due = 0, learned = 0;
  for (const c of cards) {
    const e = srs[c.id];
    if (!e) continue;
    learned++;
    if (e.due <= now) due++;
  }
  return { due, learned, fresh: cards.length - learned, total: cards.length };
}

function quizStats(fieldKey) {
  const stats = store.get("quiz.stats", {});
  const qs = getQuestions(fieldKey);
  let seen = 0, correct = 0;
  for (const q of qs) {
    const s = stats[q.id];
    if (!s || !s.seen) continue;
    seen++;
    if (s.correct > 0) correct++;
  }
  return { seen, correct, total: qs.length, acc: seen ? Math.round((correct / seen) * 100) : null };
}
```

`examStats()` giữ nguyên (chỉ Kubernetes mới có thi thử).

- [ ] **Step 4: Đổi `render()` của dashboard**

```js
export function render(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const rm = roadmapStats(fieldKey);
  const fl = flashStats(fieldKey);
  const qz = quizStats(fieldKey);
  const ex = examStats();
  const has = (m) => moduleAllowed(fieldKey, m);

  const page = h("div", { class: "page" },
    h("div", { class: "hero" },
      h("h1", {}, "📚 DevPrep — học, ôn tập và luyện thi"),
      h("p", {},
        "Ba lĩnh vực: Kubernetes & chứng chỉ, Lập trình hệ thống, Java & Spring Boot Scalability. ",
        "Chọn lĩnh vực ở thanh bên để đổi nội dung. Tiến độ được lưu ngay trên trình duyệt của bạn."),
      h("div", { class: "flex flex-wrap", style: "margin-top:16px" },
        has("roadmap") ? h("a", { class: "btn btn-primary", href: "#/roadmap" }, "🗺️ Bắt đầu lộ trình") : null,
        has("exam") ? h("a", { class: "btn", href: "#/exam" }, "⏱️ Thi thử ngay") : null,
        h("a", { class: "btn", href: "#/docs" }, "📚 Đọc tài liệu"))));

  // Dải tổng quan 3 lĩnh vực
  const overview = h("div", { class: "grid grid-3", style: "margin-bottom:22px" });
  for (const id of FIELD_ORDER) {
    const f = FIELDS[id];
    const parts = [`${getDocs(id).length} tài liệu`];
    const t = getTracks(id).reduce((n, x) => n + x.weeks.flatMap((w) => w.items).length, 0);
    if (t) parts.push(`${t} bài học`);
    const c = getFlashcards(id).length;
    if (c) parts.push(`${c} thẻ`);
    const q = getQuestions(id).length;
    if (q) parts.push(`${q} câu hỏi`);
    overview.append(
      h("div", { class: `card${id === fieldKey ? " card-active" : ""}` },
        h("div", { class: "flex" },
          h("span", { style: "font-size:22px" }, f.icon),
          h("strong", {}, f.label)),
        h("p", { class: "muted small", style: "margin:8px 0 0" }, parts.join(" · "))));
  }
  page.append(overview);

  const cards = [
    statCard(`${rm.pct}%`, "Lộ trình hoàn thành", "#/roadmap",
      rm.per.map((p) => `${p.label} ${p.pct}%`).join(" · ") || "chưa có lộ trình"),
    has("flashcards")
      ? statCard(String(fl.due), "Flashcard đến hạn ôn", "#/flashcards", `${fl.fresh} thẻ chưa học · ${fl.total} tổng`)
      : null,
    has("quiz")
      ? statCard(qz.acc == null ? "—" : `${qz.acc}%`, "Độ chính xác trắc nghiệm", "#/quiz", `đã gặp ${qz.seen}/${qz.total} câu`)
      : null,
    has("exam")
      ? statCard(ex.best == null ? "—" : `${ex.best}%`, "Điểm thi thử tốt nhất", "#/exam", ex.count ? `${ex.count} lượt thi` : "chưa thi lần nào")
      : null,
  ].filter(Boolean);
  if (has("roadmap")) page.append(h("div", { class: "grid grid-4" }, cards));

  // Khu vực học tập — chỉ những module lĩnh vực này có
  const areas = [
    has("certs") ? area("🎓", "Chứng chỉ K8s", "So sánh KCNA, KCSA, CKAD, CKA, CKS: hình thức thi, tỷ trọng domain và lộ trình gợi ý.", "#/certs") : null,
    area("📚", "Thư viện tài liệu", `${getDocs(fieldKey).length} tài liệu của lĩnh vực ${field.label} — mục lục nổi, sơ đồ mermaid, ảnh minh hoạ, copy nhanh.`, "#/docs"),
    has("commands") ? area("⚡", "Thực hành nhanh", "Tra cứu khi làm lab: 130 lệnh, 48 YAML mẫu, 16 quy trình thuộc lòng, thẻ trước giờ thi.", "#/commands") : null,
    has("flashcards") ? area("🃏", "Flashcards", `Ôn ${fl.total} thẻ theo phương pháp lặp lại ngắt quãng (spaced repetition).`, "#/flashcards") : null,
    has("quiz") ? area("✅", "Trắc nghiệm", `${qz.total} câu hỏi có giải thích chi tiết từng câu.`, "#/quiz") : null,
    has("exam") ? area("⏱️", "Thi thử", "Mô phỏng áp lực phòng thi: bấm giờ, đánh dấu câu, chấm điểm theo domain.", "#/exam") : null,
    has("labs") ? area("🧪", "Labs thực hành", `${labs.length} bài lab kiểu đề thật kèm lời giải và cách verify.`, "#/labs") : null,
    has("roadmap") ? area("🗺️", "Lộ trình học", `${rm.total} bài học chi tiết — tick đến đâu lưu đến đó.`, "#/roadmap") : null,
  ].filter(Boolean);

  page.append(
    h("h2", { style: "margin:28px 0 12px;font-size:19px" }, "Khu vực học tập"),
    h("div", { class: "grid grid-2" }, areas));

  root.append(page);
}
```

- [ ] **Step 5: Thêm style `.card-active`**

Chèn vào `webapp/css/style.css` ngay sau khối `.card-link`:

```css
.card-active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
```

- [ ] **Step 6: Kiểm bằng tay**

| Thao tác | Kỳ vọng |
|---|---|
| Bảng điều khiển, lĩnh vực Kubernetes | Dải 3 lĩnh vực, thẻ Kubernetes được viền nhấn; 4 ô thống kê; 8 khu vực |
| Đổi sang Lập trình hệ thống | Chỉ còn khu vực "Thư viện tài liệu"; không có ô flashcard/trắc nghiệm/thi thử |
| Đổi sang Java | Tương tự, chỉ có Thư viện tài liệu |
| `#/roadmap` ở lĩnh vực Kubernetes | 3 track + dải CKAD→CKA→CKS |
| Console | Không lỗi |

- [ ] **Step 7: Commit**

```bash
git add webapp/js/views/dashboard.js webapp/js/views/roadmap.js webapp/css/style.css
git commit -m "$(cat <<'EOF'
feat: bảng điều khiển và lộ trình lọc theo lĩnh vực

Dashboard tính thống kê theo lĩnh vực đang chọn, thêm dải tổng quan 3 lĩnh
vực, và chỉ hiện khu vực học tập mà lĩnh vực đó thực sự có.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Lộ trình System Programming — tuần 1–5 (22 mục)

**Files:**
- Create: `webapp/js/data/sysprog-roadmap-part1.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js` (thêm `"roadmap"` vào `modules` của `sysprog`)
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `sysprog-01` … `sysprog-18` (Task 6).
- Produces: `export const sysprogWeeksPart1` — mảng 5 tuần, id `sp-w1` … `sp-w5`, tổng **22** mục id `sp-w1-1` … `sp-w5-4`. Task 9 nối tiếp từ `sp-w6`.

**Phân bổ mục:** tuần 1: 4 · tuần 2: 5 · tuần 3: 4 · tuần 4: 5 · tuần 5: 4 = **22**.

| Tuần | id | Tiêu đề | Chương nguồn |
|---|---|---|---|
| 1 | `sp-w1` | Nền tảng & công cụ | ch 1 (`sysprog-01`), ch 2 (`sysprog-02`) |
| 2 | `sp-w2` | C cốt lõi — cú pháp, mô hình bộ nhớ, con trỏ | ch 3 (`sysprog-03`) |
| 3 | `sp-w3` | Bộ cấp phát bộ nhớ | ch 5 (`sysprog-05`) |
| 4 | `sp-w4` | Tiến trình — fork / exec / wait | ch 4 (`sysprog-04`) |
| 5 | `sp-w5` | Tín hiệu | ch 13 (`sysprog-13`) |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts`:

```js
    "roadmap-items:sysprog": 22,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:sysprog: kỳ vọng 22, thực tế 0`.

- [ ] **Step 3: Viết `sysprog-roadmap-part1.js`**

Cấu trúc tuần giống hệt `roadmap-part1.js` hiện có: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [§X.Y Tên mục](#/docs/sysprog-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Ví dụ đầy đủ, dùng làm khuôn cho 21 mục còn lại:

```js
// Lộ trình System Programming — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi mục là KẾ HOẠCH HỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (sp-w<N> / sp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const sysprogWeeksPart1 = [
  {
    id: "sp-w1",
    week: "Tuần 1",
    title: "Nền tảng & công cụ",
    goal: "Dựng được môi trường C trên Linux và biết dùng hai công cụ sẽ theo bạn suốt khoá: Valgrind và GDB.",
    practice: "Viết một chương trình C rò rỉ bộ nhớ có chủ đích, bắt nó bằng Valgrind, rồi đặt breakpoint trong GDB để xem giá trị con trỏ trước khi rò.",
    resources: [
      { label: "Ch.1 — Giới thiệu", href: "#/docs/sysprog-01" },
      { label: "Ch.2 — Kiến thức nền tảng", href: "#/docs/sysprog-02" },
      { label: "Ch.17 §17.3 Biên dịch và liên kết", href: "#/docs/sysprog-17" },
      { label: "man7.org — man pages trực tuyến", href: "https://man7.org/linux/man-pages/" },
    ],
    items: [
      {
        id: "sp-w1-1",
        text: "Ranh giới user space / kernel space và vì sao system call đắt",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`printf\` không phải system call còn \`write\` thì có, và điều đó ảnh hưởng gì tới hiệu năng.

**Đọc.** [§2.1 Kiến trúc hệ thống](#/docs/sysprog-02) — đọc kỹ phần ranh giới hai không gian. Chưa cần nhớ danh sách system call.

**Bẫy.** Lẫn giữa **hàm thư viện C** (\`printf\`, \`malloc\` — chạy trong user space) và **system call** (\`write\`, \`brk\`/\`mmap\` — chuyển sang kernel). \`printf\` gọi \`write\` *bên dưới*, nhưng có buffer riêng — đó là lý do output đôi khi không ra đúng thứ tự bạn nghĩ khi chương trình crash.

**Tự kiểm tra.** Vì sao gọi \`write\` 1000 lần với 1 byte chậm hơn nhiều so với gọi 1 lần với 1000 byte, dù tổng số byte như nhau?`,
      },
      // … 3 mục còn lại của tuần 1: sp-w1-2 … sp-w1-4
    ],
  },
  // … tuần 2–5
];
```

**Nội dung 22 mục** (id → chủ đề → mục sách phải trỏ tới):

*Tuần 1 — Nền tảng & công cụ*
- `sp-w1-1` Ranh giới user/kernel space, chi phí system call — §2.1
- `sp-w1-2` Biên dịch & liên kết: gcc, `-Wall -Werror`, object file, link — §17.3
- `sp-w1-3` Valgrind: đọc báo cáo leak, invalid read/write — §2.3
- `sp-w1-4` GDB: breakpoint, `bt`, `print`, `watch`, debug core dump — §2.4

*Tuần 2 — C cốt lõi*
- `sp-w2-1` Cú pháp C và kiểu dữ liệu, `sizeof`, ép kiểu ngầm — §3.2, §3.3
- `sp-w2-2` Mô hình bộ nhớ: text / data / bss / heap / stack — §3.6
- `sp-w2-3` Con trỏ và số học con trỏ — §3.7, §3.12
- `sp-w2-4` Chuỗi C: `strlen`/`strcpy`/`strcat`/`strncpy`, byte NUL — §3.5
- `sp-w2-5` Lỗi C kinh điển: off-by-one, dangling pointer, UB — §3.8, §3.9

*Tuần 3 — Bộ cấp phát bộ nhớ*
- `sp-w3-1` API: `malloc`/`free`/`calloc`/`realloc`, cái nào zero-fill — §5.2
- `sp-w3-2` Chiến lược đặt khối: first / best / worst fit, phân mảnh — §5.3
- `sp-w3-3` Tự xây allocator: header, splitting, coalescing, căn lề — §5.4
- `sp-w3-4` Buddy allocator và SLUB — §5.5, §5.6

*Tuần 4 — Tiến trình*
- `sp-w4-1` File descriptor và nội dung một process — §4.1, §4.3
- `sp-w4-2` `fork`: hai giá trị trả về, copy-on-write, thứ tự không xác định — §4.4
- `sp-w4-3` `wait`/`waitpid`, macro `WIFEXITED`/`WEXITSTATUS`, zombie & orphan — §4.5
- `sp-w4-4` Họ hàm `exec`, vì sao `exec` không trở về — §4.6
- `sp-w4-5` Mẫu fork-exec-wait — cách shell chạy lệnh — §4.7

*Tuần 5 — Tín hiệu*
- `sp-w5-1` Signal là gì, hành vi mặc định, `SIGKILL`/`SIGSTOP` không bắt được — §13.1
- `sp-w5-2` Gửi signal: `kill`, `raise`, `alarm`, từ bàn phím — §13.2
- `sp-w5-3` `sigaction` và hàm async-signal-safe (vì sao không `printf` trong handler) — §13.3
- `sp-w5-4` Chặn signal: `sigprocmask`, `sigwait`, signal trong process con và thread — §13.4, §13.5

- [ ] **Step 4: Đăng ký track trong `roadmap.js`**

Thêm import:

```js
import { sysprogWeeksPart1 } from "./sysprog-roadmap-part1.js";
```

Thêm vào cuối mảng `tracks`:

```js
  {
    id: "sysprog",
    field: "sysprog",
    label: "System Programming",
    icon: "🖥️",
    name: "Lập trình hệ thống (UIUC CS 241)",
    desc: "Kế hoạch học 10 tuần bám theo giáo trình: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc trong sách, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết lập trình cơ bản và dùng được terminal Linux. Không cần biết C trước.",
    weeks: [...sysprogWeeksPart1],
  },
```

Cập nhật comment đầu file để nhắc tiền tố id:

```js
//   SP  : sysprog-roadmap-part{1,2}.js  (Tuần 1–5 / 6–10)      — 50 mục
//
// LƯU Ý: id tuần (w1, cka-w1, sp-w1…) và id mục (w1-1, cka-w1-1, sp-w1-1…)
// là khóa lưu tiến độ trong localStorage — không được đổi.
```

- [ ] **Step 5: Mở module `roadmap` cho sysprog**

Trong `webapp/js/data/fields.js`, đổi `modules` của `sysprog` thành:

```js
    modules: ["dashboard", "roadmap", "docs"],
```

- [ ] **Step 6: Chạy bộ kiểm — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: mọi bất biến đạt, gồm `roadmap-items:sysprog: 22`, `Id mục lộ trình duy nhất` và `Mọi link #/docs/<id> trỏ tới tài liệu có thật`.

- [ ] **Step 7: Kiểm tiến độ không đè nhau**

```bash
./webapp/dev.sh 8899
```

1. Lĩnh vực Kubernetes → `#/roadmap/ckad` → ghi lại con số tiến độ (vd `0/55`).
2. Đổi sang Lập trình hệ thống → `#/roadmap/sysprog` → tick 3 mục bất kỳ → phải thấy `3/22`.
3. Quay lại Kubernetes → `#/roadmap/ckad` → con số phải **y như bước 1**.
4. Console:

```js
Object.keys(JSON.parse(localStorage.getItem("kubeprep.roadmap.checked"))).filter(k => k.startsWith("sp-"))
```

Kỳ vọng: đúng 3 khoá, tất cả bắt đầu bằng `sp-`.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/sysprog-roadmap-part1.js webapp/js/data/roadmap.js \
        webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: lộ trình System Programming tuần 1-5 (22 mục)

Nền tảng & công cụ, C cốt lõi, bộ cấp phát bộ nhớ, tiến trình, tín hiệu.
Mỗi mục là kế hoạch học trỏ vào đúng mục của sách, không chép lại nội dung.
Tiền tố id sp- để tiến độ không đè lên track CKAD.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Lộ trình System Programming — tuần 6–10 (28 mục)

**Files:**
- Create: `webapp/js/data/sysprog-roadmap-part2.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng 22 → 50)

**Interfaces:**
- Consumes: khuôn `lesson` 4 khối và quy ước id từ Task 8.
- Produces: `export const sysprogWeeksPart2` — 5 tuần, id `sp-w6` … `sp-w10`, tổng **28** mục.

**Phân bổ:** tuần 6: 6 · tuần 7: 6 · tuần 8: 5 · tuần 9: 5 · tuần 10: 6 = **28**.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Sửa trong `EXPECTED.counts`: `"roadmap-items:sysprog": 50,`

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:sysprog: kỳ vọng 50, thực tế 22`.

- [ ] **Step 3: Viết `sysprog-roadmap-part2.js`**

Cùng khuôn với Task 8 (4 khối `**Mục tiêu.** / **Đọc.** / **Bẫy.** / **Tự kiểm tra.**`, 120–220 từ mỗi mục), header ghi công CC BY 4.0 giống Part 1.

*Tuần 6 — `sp-w6` "Luồng & Mutex"* (ch 6 = `sysprog-06`, ch 7 = `sysprog-07`)
- `sp-w6-1` Process khác thread ở đâu, cái gì được chia sẻ cái gì không — §6.1, §6.2
- `sp-w6-2` `pthread_create`/`pthread_join`, truyền tham số đúng cách — §6.3, §6.4
- `sp-w6-3` Race condition: vì sao `i++` không nguyên tử — §6.5
- `sp-w6-4` Mutex: `lock`/`unlock`, vùng găng, mutex không bảo vệ *dữ liệu* mà bảo vệ *code* — §7.1
- `sp-w6-5` Condition variable: `wait`/`signal`/`broadcast`, vì sao luôn `while` chứ không `if` — §7.2, §17.11
- `sp-w6-6` Peterson và các lời giải phần mềm cho vùng găng — §7.4, §7.5

*Tuần 7 — `sp-w7` "Đồng bộ nâng cao & Deadlock"* (ch 7, ch 8 = `sysprog-08`)
- `sp-w7-1` Counting semaphore: `sem_wait`/`sem_post`, khác mutex chỗ nào — §7.6
- `sp-w7-2` Barrier: chờ đủ N thread rồi cùng đi tiếp — §7.7
- `sp-w7-3` Ring buffer: producer–consumer với 2 semaphore + 1 mutex — §7.8
- `sp-w7-4` Cấu trúc dữ liệu thread-safe và đồng bộ giữa process — §7.3, §7.9
- `sp-w7-5` Đồ thị cấp phát tài nguyên và 4 điều kiện Coffman — §8.1, §8.2
- `sp-w7-6` Dining philosophers: vì sao thất bại và các lời giải — §8.4, §8.5, §17.5

*Tuần 8 — `sp-w8` "Bộ nhớ ảo & IPC"* (ch 9 = `sysprog-09`)
- `sp-w8-1` Dịch địa chỉ ảo → vật lý, page table nhiều cấp — §9.1
- `sp-w8-2` TLB, page fault, vì sao locality quyết định hiệu năng — §9.1
- `sp-w8-3` `mmap`: ánh xạ file và bộ nhớ ẩn danh, `MAP_SHARED` vs `MAP_PRIVATE` — §9.2
- `sp-w8-4` Pipe: `pipe()`, đóng đầu không dùng, `SIGPIPE`, deadlock khi quên đóng — §9.3
- `sp-w8-5` Named pipe (FIFO) và so sánh các lựa chọn IPC — §9.4, §9.6

*Tuần 9 — `sp-w9` "Lập trình mạng"* (ch 11 = `sysprog-11`)
- `sp-w9-1` Mô hình OSI và IP: địa chỉ, datagram, phân mảnh — §11.1, §11.2
- `sp-w9-2` TCP client: `getaddrinfo`, `socket`, `connect` — §11.3
- `sp-w9-3` TCP server: `bind`, `listen`, `accept`, `SO_REUSEADDR` — §11.4
- `sp-w9-4` UDP: `sendto`/`recvfrom`, khi nào chấp nhận mất gói — §11.5
- `sp-w9-5` I/O không chặn, `select`/`poll`/`epoll`, và RPC — §11.7, §11.8

*Tuần 10 — `sp-w10` "Hệ thống tệp, Lập lịch & Bảo mật"* (ch 12 = `sysprog-12`, ch 10 = `sysprog-10`, ch 14 = `sysprog-14`)
- `sp-w10-1` inode, hard link vs symbolic link, thư mục thực chất là gì — §12.1, §12.2
- `sp-w10-2` Bit quyền, setuid, sticky bit, umask — §12.3
- `sp-w10-3` Virtual filesystem, memory mapped IO, tính tin cậy và journaling — §12.4, §12.5, §12.6
- `sp-w10-4` Thước đo lập lịch: turnaround, response, waiting time — §10.2, §10.3
- `sp-w10-5` FCFS, SJF, Round Robin, Priority — ưu nhược và hiện tượng starvation — §10.4
- `sp-w10-6` Buffer overflow, format string, và bài học từ post-mortem thật — §14.2, §17.2, ch 18

Tuần 10 phải có trong `resources`: `{ label: "Ch.15 — Ôn tập (ngân hàng câu hỏi)", href: "#/docs/sysprog-15" }` và `{ label: "Ch.18 — Phân tích hậu sự cố", href: "#/docs/sysprog-18" }`.

- [ ] **Step 4: Nối vào track**

Trong `roadmap.js`, thêm import và nối:

```js
import { sysprogWeeksPart2 } from "./sysprog-roadmap-part2.js";
```

```js
    weeks: [...sysprogWeeksPart1, ...sysprogWeeksPart2],
```

- [ ] **Step 5: Chạy bộ kiểm — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `roadmap-items:sysprog: 50` đạt; không có link `#/docs/` hỏng.

- [ ] **Step 6: Kiểm bằng tay**

Mở `#/roadmap/sysprog`: 10 tuần, tổng `x/50`. Mở ngẫu nhiên 3 mục, bấm mọi link trong `resources` và trong `lesson` — tất cả phải mở đúng tài liệu, không có trang trắng.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/sysprog-roadmap-part2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: lộ trình System Programming tuần 6-10 (28 mục) — đủ 50 mục

Luồng & mutex, đồng bộ nâng cao & deadlock, bộ nhớ ảo & IPC, lập trình mạng,
hệ thống tệp & lập lịch & bảo mật.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: 90 flashcard System Programming

**Files:**
- Create: `webapp/js/data/sysprog-flashcards.js`
- Modify: `webapp/js/data/flashcards.js` (không đổi nội dung — chỉ xác nhận export giữ nguyên)
- Modify: `webapp/js/data/index.js` (gộp nguồn flashcard)
- Modify: `webapp/js/views/flashcards.js`
- Modify: `webapp/js/data/fields.js` (thêm `"flashcards"`)
- Modify: `webapp/check-data.mjs`

**Interfaces:**
- Consumes: 7 khoá `TOPICS` sysprog (Task 4); `getFlashcards`, `getTopics` (Task 4); `currentField()` (Task 5).
- Produces: `export const sysprogFlashcards` — 90 bản ghi `{ id, field: "sysprog", topic, front, back, code }`.

**Phân bổ bắt buộc:** `sp-c` 18 · `sp-process` 12 · `sp-concurrency` 20 · `sp-deadlock` 10 · `sp-memory-ipc` 12 · `sp-io` 12 · `sp-security` 6 = **90**. Id `spf001` … `spf090`, đánh số liên tục theo đúng thứ tự nhóm trên.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Thêm vào `EXPECTED.counts`: `"flashcards:sysprog": 90,`

Và thêm một bất biến phân bổ ngay trước khối `// Bảng kỳ vọng`:

```js
await check("Flashcard sysprog phân bổ đúng theo chủ đề", () => {
  const want = { "sp-c": 18, "sp-process": 12, "sp-concurrency": 20,
                 "sp-deadlock": 10, "sp-memory-ipc": 12, "sp-io": 12, "sp-security": 6 };
  const got = {};
  for (const c of flashcards.filter((x) => fieldOf(x) === "sysprog"))
    got[c.topic] = (got[c.topic] ?? 0) + 1;
  const bad = Object.entries(want)
    .filter(([k, v]) => (got[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${got[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

- [ ] **Step 3: Viết `sysprog-flashcards.js`**

Giữ đúng schema của `flashcards.js`: `{ id, topic, front, back, code }` (`code` là `null` hoặc `{ lang, text }`).

Yêu cầu chất lượng cho mỗi thẻ:
- `front` là **một câu hỏi**, không phải tiêu đề chủ đề.
- `back` trả lời gọn 2–4 câu, có **con số hoặc tên hàm cụ thể** khi có thể, và kết thúc bằng chỉ dẫn mục nguồn dạng `(§7.8)`.
- Dùng `code` khi câu trả lời cần đoạn C — đặc biệt cho `sp-c`, `sp-concurrency`, `sp-security`.
- Thuật ngữ chuyên ngành giữ tiếng Anh, giải thích tiếng Việt.

Ba thẻ mẫu làm khuôn:

```js
// Flashcard System Programming — ôn tập theo lặp lại ngắt quãng.
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook

export const sysprogFlashcards = [
  // ===== sp-c — C & Bộ nhớ (spf001–spf018) =====
  {
    id: "spf001",
    field: "sysprog",
    topic: "sp-c",
    front: "`malloc`, `calloc`, `realloc(NULL, n)` — cái nào bảo đảm vùng nhớ trả về đã được zero?",
    back: "Chỉ `calloc` bảo đảm zero-fill. `malloc` trả về vùng nhớ **chưa khởi tạo**; `realloc(NULL, n)` tương đương `malloc(n)` nên cũng không zero. Đọc giá trị chưa khởi tạo là undefined behavior — nó *có thể* tình cờ bằng 0 và làm bạn tưởng code đúng. (§5.2)",
    code: null,
  },
  {
    id: "spf002",
    field: "sysprog",
    topic: "sp-c",
    front: "Đoạn code này sai ở đâu?",
    back: "`malloc(strlen(src))` thiếu 1 byte cho ký tự NUL kết thúc chuỗi. `strcpy` sẽ ghi `strlen(src) + 1` byte → tràn heap 1 byte (off-by-one). Sửa: `malloc(strlen(src) + 1)`. (§3.5)",
    code: {
      lang: "c",
      text: `char *copy(char *src) {
  char *result = malloc(strlen(src));
  strcpy(result, src);
  return result;
}`,
    },
  },
  // ===== sp-concurrency — Luồng & Đồng bộ hoá (spf031–spf050) =====
  {
    id: "spf031",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Vì sao `pthread_cond_wait` luôn phải nằm trong vòng `while`, không bao giờ trong `if`?",
    back: "Vì **spurious wakeup**: `pthread_cond_wait` có thể trả về mà không ai `signal`. Ngoài ra khi có nhiều consumer, một thread khác có thể đã lấy mất điều kiện trong khoảng bạn được đánh thức và giành lại mutex. `while` kiểm tra lại điều kiện sau mỗi lần thức dậy; `if` thì tin luôn và chạy tiếp với trạng thái sai. (§7.2, §17.11)",
    code: {
      lang: "c",
      text: `pthread_mutex_lock(&m);
while (count == 0)              // while, KHÔNG phải if
  pthread_cond_wait(&cv, &m);
count--;
pthread_mutex_unlock(&m);`,
    },
  },
  // … tiếp tục tới spf090
];
```

**Nguồn nội dung theo nhóm:**

| Khoá | Số thẻ | Id | Khai thác từ |
|---|---|---|---|
| `sp-c` | 18 | `spf001`–`spf018` | §3.5–3.9, §3.12, §5.2–5.4, §15.1, §2.3 |
| `sp-process` | 12 | `spf019`–`spf030` | §4.1–4.7, §13.1–13.5, §15.2, §15.10 |
| `sp-concurrency` | 20 | `spf031`–`spf050` | §6.1–6.5, §7.1–7.9, §15.4, §17.11 |
| `sp-deadlock` | 10 | `spf051`–`spf060` | §8.1–8.5, §10.2–10.4, §15.5, §17.4 |
| `sp-memory-ipc` | 12 | `spf061`–`spf072` | §9.1–9.6, §3.6, §15.3, §15.6 |
| `sp-io` | 12 | `spf073`–`spf084` | §11.1–11.8, §12.1–12.7, §15.7, §15.8 |
| `sp-security` | 6 | `spf085`–`spf090` | §14.1–14.3, §17.2, ch 18, §15.9 |

- [ ] **Step 4: Gộp nguồn trong `js/data/index.js`**

```js
import { flashcards } from "./flashcards.js";
import { sysprogFlashcards } from "./sysprog-flashcards.js";

export const allFlashcards = [...flashcards, ...sysprogFlashcards];
```

- [ ] **Step 5: Bộ kiểm đọc từ nguồn gộp**

Trong `webapp/check-data.mjs`, đổi dòng nạp flashcard:

```js
const { allFlashcards: flashcards } = await import("./js/data/index.js");
```

và xoá dòng `const { flashcards } = await import("./js/data/flashcards.js");`.

- [ ] **Step 6: `flashcards.js` view lọc theo lĩnh vực**

Đổi import:

```js
import { h, pageHead, inlineMd, codeNode, shuffle } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getFlashcards, getTopics } from "../data/index.js";
import { currentField } from "../lib/field.js";
```

Trong `renderSetup`, thay dòng đầu bằng:

```js
  const fieldKey = currentField();
  const flashcards = getFlashcards(fieldKey);
```

và thay vòng lặp chip chủ đề:

```js
  const topics = getTopics(fieldKey);
  const selected = new Set(topics.map(([k]) => k));
  const chipRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  const chips = new Map();
  for (const [key, t] of topics) {
    const count = flashcards.filter((c) => c.topic === key).length;
    if (!count) continue;
    const chip = h("button", { class: "chip on" }, `${t.label} (${count})`);
    chip.addEventListener("click", () => {
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      chip.classList.toggle("on", selected.has(key));
    });
    chips.set(key, chip);
    chipRow.append(chip);
  }
```

Lưu ý: `selected` khởi tạo từ `topics` chứ không phải `Object.keys(TOPICS)` — nếu không, chủ đề của lĩnh vực khác sẽ lọt vào bộ lọc.

- [ ] **Step 7: Mở module `flashcards` cho sysprog**

```js
    modules: ["dashboard", "roadmap", "docs", "flashcards"],
```

- [ ] **Step 8: Chạy bộ kiểm — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `flashcards:sysprog: 90` và bất biến phân bổ theo chủ đề đều đạt.

- [ ] **Step 9: Kiểm bằng tay**

| Thao tác | Kỳ vọng |
|---|---|
| Lĩnh vực sysprog → Flashcards | Tiêu đề "Ôn tập 90 thẻ"; chip chủ đề đúng **7** khoá `sp-*`, không lẫn chủ đề K8s |
| Bắt đầu ôn 10 thẻ | Thẻ lật được bằng Space, chấm bằng phím 1–4, thẻ có `code` hiển thị đúng highlight |
| Đổi sang Kubernetes → Flashcards | "Ôn tập 84 thẻ", chip đúng 12 chủ đề K8s |
| Console | Không lỗi |

- [ ] **Step 10: Commit**

```bash
git add webapp/js/data/sysprog-flashcards.js webapp/js/data/index.js \
        webapp/js/views/flashcards.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: 90 flashcard System Programming

Phân bổ 18/12/20/10/12/12/6 theo 7 chủ đề sp-*. Mỗi thẻ trích dẫn mục nguồn
trong sách để nhảy ngược tra cứu. Flashcards view lọc chủ đề theo lĩnh vực.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Trắc nghiệm theo lĩnh vực + 60 câu (phần 1)

**Files:**
- Create: `webapp/js/data/sysprog-questions-part1.js`
- Modify: `webapp/js/data/index.js`
- Modify: `webapp/js/views/quiz.js:1-100`
- Modify: `webapp/js/data/fields.js` (thêm `"quiz"`)
- Modify: `webapp/check-data.mjs`

**Interfaces:**
- Consumes: `DOMAINS` sysprog (Task 4); `getQuestions`, `getDomains` (Task 4); `FIELDS[...].certFilter` (Task 3).
- Produces: `export const sysprogQuestionsPart1` — 60 bản ghi `{ id, field: "sysprog", domain, difficulty, question, code, options, answer, explanation }`, id `spq001` … `spq060`.

**Phân bổ phần 1:** `sp-c` 22 (`spq001`–`spq022`) · `sp-process` 14 (`spq023`–`spq036`) · `sp-concurrency` 24 (`spq037`–`spq060`) = **60**.

Bản ghi sysprog **không có trường `cert`** — đây là điểm `quiz.js` hiện sẽ vỡ nếu không sửa.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Thêm vào `EXPECTED.counts`: `"questions:sysprog": 60,`

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

- [ ] **Step 3: Sửa `quiz.js` cho lĩnh vực không có chứng chỉ**

Đổi import:

```js
import { h, pageHead, inlineMd, codeNode, shuffle, certBadge, domainBadge, diffBadge } from "../lib/ui.js";
import { store } from "../lib/store.js";
import { getQuestions, getDomains } from "../data/index.js";
import { FIELDS } from "../data/fields.js";
import { CERTS } from "../data/meta.js";
import { currentField } from "../lib/field.js";
```

Thay phần đầu `renderSetup` (từ `const page = …` tới hết `syncDomains();`) bằng:

```js
function renderSetup(root) {
  const fieldKey = currentField();
  const field = FIELDS[fieldKey];
  const questions = getQuestions(fieldKey);
  const page = h("div", { class: "page" });

  page.append(pageHead(
    "✅ Trắc nghiệm",
    `${questions.length} câu hỏi có giải thích chi tiết. Chế độ luyện tập: biết đúng/sai ngay sau mỗi câu.`
  ));

  // Tầng lọc chứng chỉ chỉ có nghĩa với lĩnh vực Kubernetes.
  const certSel = new Set();
  const certRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  if (field.certFilter) {
    certSel.add("CKAD");
    for (const key of Object.keys(CERTS)) {
      const count = questions.filter((q) => q.cert === key).length;
      if (!count) continue;
      const chip = h("button", { class: `chip${certSel.has(key) ? " on" : ""}` }, `${key} (${count})`);
      chip.addEventListener("click", () => {
        if (certSel.has(key)) certSel.delete(key);
        else certSel.add(key);
        chip.classList.toggle("on", certSel.has(key));
        syncDomains();
      });
      certRow.append(chip);
    }
  }

  const domainSel = new Set();
  const domainRow = h("div", { class: "chip-row", style: "margin:10px 0 16px" });
  function syncDomains() {
    domainRow.innerHTML = "";
    domainSel.clear();
    const visible = getDomains(fieldKey).filter(([key, d]) =>
      (!field.certFilter || certSel.has(d.cert)) && questions.some((q) => q.domain === key));
    for (const [key, d] of visible) {
      domainSel.add(key);
      const count = questions.filter((q) => q.domain === key).length;
      const chip = h("button", { class: "chip on" }, `${d.short} (${count})`);
      chip.addEventListener("click", () => {
        if (domainSel.has(key)) domainSel.delete(key);
        else domainSel.add(key);
        chip.classList.toggle("on", domainSel.has(key));
      });
      domainRow.append(chip);
    }
  }
  syncDomains();
```

Đổi bộ lọc trong `startBtn` để bỏ qua `cert` khi lĩnh vực không có chứng chỉ:

```js
    let pool = questions.filter((q) =>
      (!field.certFilter || certSel.has(q.cert)) && domainSel.has(q.domain));
```

Đổi khối `page.append` cuối `renderSetup` để giấu hàng chứng chỉ khi không dùng:

```js
  page.append(
    h("div", { class: "card" },
      field.certFilter ? h("strong", {}, "Chứng chỉ") : null,
      field.certFilter ? certRow : null,
      h("strong", {}, "Domain"), domainRow,
      h("div", { class: "flex flex-wrap", style: "margin-bottom:14px" }, countSel, weakChip),
      startBtn)
  );
```

Cuối cùng, tìm nơi `renderSession` gọi `certBadge(q.cert)` và bọc điều kiện:

```js
    q.cert ? certBadge(q.cert) : null,
```

- [ ] **Step 4: Viết `sysprog-questions-part1.js`**

Schema y hệt `questions.js`. Yêu cầu chất lượng:
- `difficulty` phân bố hợp lý: khoảng 30% mức 1, 45% mức 2, 25% mức 3.
- Ba phương án sai phải là **hiểu lầm có thật**, không phải phương án ngớ ngẩn.
- `explanation` giải thích vì sao đáp án đúng **và** vì sao phương án hấp dẫn nhất lại sai, kết thúc bằng mục nguồn `(§X.Y)`.
- Dùng `code` cho ít nhất một nửa số câu ở `sp-c` và `sp-concurrency`.

Hai câu mẫu làm khuôn:

```js
// Ngân hàng câu hỏi System Programming — phần 1 (sp-c, sp-process, sp-concurrency).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook

export const sysprogQuestionsPart1 = [
  // ===== sp-c (spq001–spq022) =====
  {
    id: "spq001",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Chương trình sau in ra gì, và vì sao?",
    code: {
      lang: "c",
      text: `void func(void) {
  char result[sizeof("Hello World")];
  char *src = "Hello World";
  printf("%zu\\n", sizeof(src));
}`,
    },
    options: [
      "11 — độ dài chuỗi \"Hello World\"",
      "12 — độ dài chuỗi cộng byte NUL",
      "8 trên hệ 64-bit — sizeof của một con trỏ, không phải của chuỗi",
      "Lỗi biên dịch vì sizeof không dùng được với con trỏ",
    ],
    answer: 2,
    explanation: "`src` là **con trỏ**, nên `sizeof(src)` là kích thước con trỏ (8 byte trên hệ 64-bit), không liên quan tới chuỗi nó trỏ tới. Phương án \"12\" hấp dẫn vì đúng với `sizeof(\"Hello World\")` — biểu thức đó là *mảng* 12 phần tử nên `sizeof` cho 12. Đây chính là cái bẫy: `sizeof` trên mảng và trên con trỏ cho kết quả khác hẳn nhau. Muốn độ dài chuỗi phải dùng `strlen`. (§3.7, §3.12)",
  },
  // ===== sp-concurrency (spq037–spq060) =====
  {
    id: "spq037",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Trong ring buffer dưới đây, đảo thứ tự hai dòng đánh dấu sẽ dẫn tới điều gì?",
    code: {
      lang: "c",
      text: `void enqueue(int v) {
  sem_wait(&empty_slots);        // (A)
  pthread_mutex_lock(&m);        // (B)
  buffer[in++ % N] = v;
  pthread_mutex_unlock(&m);
  sem_post(&full_slots);
}`,
    },
    options: [
      "Không có gì thay đổi — hai nguyên thuỷ độc lập nên thứ tự tuỳ ý",
      "Deadlock khi buffer đầy: thread giữ mutex rồi chặn ở sem_wait, consumer không vào được để giải phóng chỗ",
      "Race condition trên biến `in` nhưng chương trình vẫn chạy tiếp",
      "Buffer bị ghi tràn vì mất kiểm soát số phần tử",
    ],
    answer: 1,
    explanation: "Nếu `lock` trước `sem_wait`, một producer gặp buffer đầy sẽ **ngủ trong khi vẫn đang giữ mutex**. Consumer muốn lấy phần tử ra phải lấy chính mutex đó → không ai đi tiếp được: deadlock kinh điển. Phương án \"race condition\" hấp dẫn vì cũng là lỗi đồng bộ, nhưng mutex vẫn bảo vệ `in` đúng — vấn đề ở đây là *thứ tự chờ*, không phải thiếu bảo vệ. Quy tắc: luôn `sem_wait` (chờ tài nguyên) TRƯỚC khi giành mutex. (§7.8)",
  },
  // … tiếp tục tới spq060
];
```

**Nguồn nội dung:**

| Khoá | Số câu | Id | Khai thác từ |
|---|---|---|---|
| `sp-c` | 22 | `spq001`–`spq022` | §3.3, §3.5–3.9, §3.12, §5.2–5.6, §15.1, §15.3 |
| `sp-process` | 14 | `spq023`–`spq036` | §4.1–4.7, §13.1–13.5, §15.2, §15.10 |
| `sp-concurrency` | 24 | `spq037`–`spq060` | §6.1–6.5, §7.1–7.9, §15.4, §17.11–17.13 |

- [ ] **Step 5: Gộp nguồn và mở module**

Trong `js/data/index.js`:

```js
import { questions } from "./questions.js";
import { sysprogQuestionsPart1 } from "./sysprog-questions-part1.js";

export const allQuestions = [...questions, ...sysprogQuestionsPart1];
```

Trong `check-data.mjs`, đổi dòng nạp:

```js
const { allFlashcards: flashcards, allQuestions: questions } = await import("./js/data/index.js");
```

(xoá dòng import trực tiếp `questions.js`)

Trong `fields.js`:

```js
    modules: ["dashboard", "roadmap", "docs", "flashcards", "quiz"],
```

- [ ] **Step 6: Chạy bộ kiểm — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `questions:sysprog: 60`, `Mỗi câu hỏi có 4 lựa chọn…` và `question.domain hợp lệ và khớp field` đều đạt.

- [ ] **Step 7: Kiểm bằng tay**

| Thao tác | Kỳ vọng |
|---|---|
| sysprog → Trắc nghiệm | **Không** có hàng "Chứng chỉ"; chỉ có hàng "Domain" với 3 chip `sp-c (22)`, `sp-process (14)`, `sp-concurrency (24)` |
| Làm 10 câu | Không có badge chứng chỉ trên câu hỏi; badge domain và độ khó hiển thị đúng; giải thích hiện sau khi chọn |
| Kubernetes → Trắc nghiệm | Có đủ **cả hai** hàng "Chứng chỉ" và "Domain" như trước |
| Console | Không lỗi |

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/sysprog-questions-part1.js webapp/js/data/index.js \
        webapp/js/views/quiz.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: trắc nghiệm theo lĩnh vực + 60 câu System Programming (phần 1)

quiz.js chỉ hiện tầng lọc chứng chỉ khi lĩnh vực khai certFilter, và không
render badge chứng chỉ cho bản ghi không có cert.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: 50 câu trắc nghiệm còn lại (phần 2)

**Files:**
- Create: `webapp/js/data/sysprog-questions-part2.js`
- Modify: `webapp/js/data/index.js`
- Modify: `webapp/check-data.mjs`

**Interfaces:**
- Consumes: khuôn câu hỏi và tiêu chuẩn chất lượng từ Task 11.
- Produces: `export const sysprogQuestionsPart2` — 50 bản ghi, id `spq061` … `spq110`.

**Phân bổ:** `sp-deadlock` 12 (`spq061`–`spq072`) · `sp-memory-ipc` 14 (`spq073`–`spq086`) · `sp-io` 16 (`spq087`–`spq102`) · `sp-security` 8 (`spq103`–`spq110`) = **50**.

- [ ] **Step 1: Đặt kỳ vọng và bất biến phân bổ — phải đỏ**

Sửa `EXPECTED.counts`: `"questions:sysprog": 110,`

Thêm bất biến phân bổ ngay sau bất biến phân bổ flashcard:

```js
await check("Câu hỏi sysprog phân bổ đúng theo domain", () => {
  const want = { "sp-c": 22, "sp-process": 14, "sp-concurrency": 24,
                 "sp-deadlock": 12, "sp-memory-ipc": 14, "sp-io": 16, "sp-security": 8 };
  const got = {};
  for (const q of questions.filter((x) => fieldOf(x) === "sysprog"))
    got[q.domain] = (got[q.domain] ?? 0) + 1;
  const bad = Object.entries(want)
    .filter(([k, v]) => (got[k] ?? 0) !== v)
    .map(([k, v]) => `${k}: kỳ vọng ${v}, thực tế ${got[k] ?? 0}`);
  expect(!bad.length, bad.join("; "));
});
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ ở cả `questions:sysprog` và bất biến phân bổ (4 domain đang là 0).

- [ ] **Step 3: Viết `sysprog-questions-part2.js`**

Cùng schema, cùng tiêu chuẩn chất lượng và cùng header ghi công như Task 11.

| Khoá | Số câu | Id | Khai thác từ |
|---|---|---|---|
| `sp-deadlock` | 12 | `spq061`–`spq072` | §8.1–8.5, §10.2–10.4, §15.5, §17.4, §17.5 |
| `sp-memory-ipc` | 14 | `spq073`–`spq086` | §9.1–9.6, §3.6, §12.5, §15.3, §15.6 |
| `sp-io` | 16 | `spq087`–`spq102` | §11.1–11.8, §12.1–12.7, §15.7, §15.8, §17.17 |
| `sp-security` | 8 | `spq103`–`spq110` | §14.1–14.3, §17.2, ch 18, §15.9 |

Với `sp-security`, ít nhất 3 câu nên dựa vào post-mortem thật ở chương 18 (Heartbleed → đọc quá biên; Dirty COW → race condition trong copy-on-write; Mars Pathfinder → priority inversion) — đây là chỗ nối kiến thức với sự cố có thật.

- [ ] **Step 4: Gộp nguồn**

```js
import { sysprogQuestionsPart2 } from "./sysprog-questions-part2.js";

export const allQuestions = [...questions, ...sysprogQuestionsPart1, ...sysprogQuestionsPart2];
```

- [ ] **Step 5: Chạy bộ kiểm — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: mọi bất biến đạt, `questions:sysprog: 110`.

- [ ] **Step 6: Kiểm bằng tay**

sysprog → Trắc nghiệm: hàng Domain có đủ **7** chip với đúng số đếm `sp-c (22)`, `sp-process (14)`, `sp-concurrency (24)`, `sp-deadlock (12)`, `sp-memory-ipc (14)`, `sp-io (16)`, `sp-security (8)`. Chọn "Toàn bộ" → phải nạp 110 câu.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/sysprog-questions-part2.js webapp/js/data/index.js webapp/check-data.mjs
git commit -m "$(cat <<'EOF'
feat: 50 câu trắc nghiệm System Programming còn lại — đủ 110 câu

Deadlock & lập lịch, bộ nhớ ảo & IPC, hệ thống tệp & mạng, bảo mật. Nhóm
bảo mật nối kiến thức với post-mortem thật ở chương 18.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Đổi brand sang DevPrep và cập nhật tài liệu

**Files:**
- Modify: `webapp/index.html:6-8, 26, 34-38`
- Modify: `webapp/js/lib/store.js:3`
- Modify: `README.md`
- Modify: `webapp/README.md`

**Interfaces:**
- Consumes: không có.
- Produces: không có API mới.

- [ ] **Step 1: Ghi lại tiến độ hiện có để đối chiếu sau**

Trong console trình duyệt tại `http://localhost:8899/`:

```js
JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("kubeprep.")).sort())
```

Lưu kết quả lại — Step 5 sẽ so.

- [ ] **Step 2: Đổi brand trong `index.html`**

```html
  <title>DevPrep — Học · Ôn tập · Luyện thi</title>
  <meta name="description" content="Nền tảng học đa lĩnh vực: Kubernetes & chứng chỉ (CKAD, CKA, CKS), Lập trình hệ thống (UIUC CS 241), Java & Spring Boot Scalability. Tài liệu, lộ trình, flashcards, trắc nghiệm, thi thử và labs thực hành." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E" />
```

Topbar:

```html
      <a class="topbar-brand" href="#/">📚 DevPrep</a>
```

Sidebar brand:

```html
      <a class="brand" href="#/">
        <span class="brand-logo">📚</span>
        <span class="brand-text">
          <strong>DevPrep</strong>
          <small>Học · Ôn tập · Luyện thi</small>
        </span>
      </a>
```

Link ở `sidebar-footer` (`kubernetes.io/docs`) giữ nguyên — nó vẫn đúng cho lĩnh vực Kubernetes.

- [ ] **Step 3: Ghi chú bất biến vào `store.js`**

```js
// Lưu trữ tiến độ học tập trong localStorage (JSON, có namespace).
//
// ⚠️ KHÔNG ĐỔI `NS`. App đã đổi tên KubePrep → DevPrep nhưng namespace phải
// giữ nguyên "kubeprep." — đổi prefix sẽ làm mọi người dùng hiện tại mất sạch
// tiến độ lộ trình, lịch sử flashcard và điểm thi thử.
const NS = "kubeprep.";
```

- [ ] **Step 4: Cập nhật `webapp/README.md`**

Đổi tiêu đề thành `# 📚 DevPrep — Học · Ôn tập · Luyện thi`, mô tả thành nền tảng đa lĩnh vực, và cập nhật bảng tính năng với các con số **thực tế sau khi triển khai**:

| Ô cần sửa | Giá trị mới |
|---|---|
| Lộ trình học | 4 giáo trình (CKAD/CKA/CKS/System Programming), 204 mục (154 bài K8s + 50 mục sysprog) |
| Thư viện tài liệu | 35 tài liệu thuộc 3 lĩnh vực |
| Flashcards | 174 thẻ (84 K8s + 90 sysprog) |
| Trắc nghiệm | 220 câu (110 K8s + 110 sysprog) |

Thêm một mục mới mô tả bộ chọn lĩnh vực và cách sidebar đổi theo lĩnh vực. Cập nhật cây cấu trúc mã để có `fields.js`, `index.js`, các file `sysprog-*`, `build-content.sh`, `check-data.mjs`, `package.json`. Đổi phần "Chạy local" để nhắc `build-content.sh`, và thêm một mục ngắn:

```markdown
## Kiểm tra dữ liệu

```bash
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kiểm id trùng, link `#/docs` hỏng, khoá phân loại sai và số lượng bản ghi.
Chạy trước mỗi lần commit dữ liệu mới.
```

- [ ] **Step 5: Cập nhật `README.md` gốc repo**

Trong mục "☸️ Kubernetes — Học & luyện thi chứng chỉ (KubePrep)":
- Đổi tiêu đề mục thành `## 📚 DevPrep — nền tảng học đa lĩnh vực`
- Thêm dòng `System_Programming_VI/` vào bảng thành phần: bản dịch tiếng Việt System Programming Coursebook (UIUC CS 241), 18 chương, CC BY 4.0
- Cập nhật mô tả `webapp/`: ba lĩnh vực, 35 tài liệu, 204 mục lộ trình, 174 flashcards, 220 câu trắc nghiệm

Thêm mục System Programming vào phần "Cấu trúc chủ đề" ở đầu README, sau Chủ đề IV.

- [ ] **Step 6: Xác minh tiến độ còn nguyên**

Chạy lại lệnh ở Step 1 — danh sách khoá `kubeprep.*` phải **giống hệt**. Nếu xuất hiện prefix `devprep.` thì Step 3 đã bị làm sai.

```bash
grep -n 'const NS' webapp/js/lib/store.js   # phải là "kubeprep."
grep -rn 'devprep\.' webapp/js/ || echo "OK — không có prefix devprep."
```

- [ ] **Step 7: Commit**

```bash
git add webapp/index.html webapp/js/lib/store.js README.md webapp/README.md
git commit -m "$(cat <<'EOF'
feat: đổi tên KubePrep -> DevPrep, cập nhật tài liệu

App không còn chỉ phục vụ Kubernetes. Namespace localStorage giữ nguyên
"kubeprep." để không mất tiến độ của người dùng hiện tại — đã ghi chú lý do
trong store.js.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Gắn bộ kiểm vào CI và nghiệm thu

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: `node webapp/check-data.mjs` (Task 2 và mọi task sau).
- Produces: không có API mới.

- [ ] **Step 1: Thêm job kiểm tra chạy trước deploy**

Sửa `.github/workflows/deploy-pages.yml`: thêm job `check` và cho `deploy` phụ thuộc vào nó.

```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Build content
        run: webapp/build-content.sh webapp/content

      - name: Check data integrity
        run: node webapp/check-data.mjs

  deploy:
    needs: check
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      # … các bước hiện có, giữ nguyên
```

- [ ] **Step 2: Xác thực cú pháp workflow**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes/.claude/worktrees/system-programming-features-f06f88
python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/deploy-pages.yml')); print(list(d['jobs'].keys())); print('needs:', d['jobs']['deploy'].get('needs'))"
```

Kỳ vọng: `['check', 'deploy']` và `needs: check`.

- [ ] **Step 3: Mô phỏng đúng những gì CI sẽ chạy**

```bash
rm -rf webapp/content
webapp/build-content.sh webapp/content
node webapp/check-data.mjs
echo "exit=$?"
```

Kỳ vọng: exit=0, mọi bất biến đạt.

- [ ] **Step 4: Nghiệm thu toàn bộ theo checklist của spec §6.2**

```bash
./webapp/dev.sh 8899
```

Đi hết bảng sau, tick từng dòng:

| # | Kiểm | Kỳ vọng |
|---|---|---|
| 1 | Đổi lĩnh vực trên sidebar | Kubernetes 9 mục · System Programming 5 mục · Java 2 mục |
| 2 | Mở thẳng `#/docs/sysprog-11` | Lĩnh vực tự chuyển sang System Programming; ảnh `fig-11.1.png` hiển thị |
| 3 | `#/roadmap/sysprog`, tick 1 mục | Tiến độ sysprog tăng; quay lại `#/roadmap/ckad` thấy tiến độ CKAD **không đổi** |
| 4 | sysprog → Trắc nghiệm | Không có tầng lọc chứng chỉ, không có badge chứng chỉ; 7 chip domain |
| 5 | sysprog → Flashcards | Chỉ 7 chip chủ đề `sp-*`; tổng 90 thẻ |
| 6 | Đang ở sysprog, gõ `#/labs` | Về bảng điều khiển |
| 7 | Đang ở Java, gõ `#/exam` | Về bảng điều khiển |
| 8 | Nút Sáng/Tối | Đổi theme, không chớp màu khi reload |
| 9 | Thu cửa sổ còn 375px | Sidebar thu vào nút ☰; bộ chọn lĩnh vực dùng được trong menu mobile |
| 10 | Kubernetes → Thi thử, Labs, Thực hành nhanh, Chứng chỉ | Hoạt động y như trước khi refactor |
| 11 | Console trình duyệt, mọi trang | Không có lỗi |

- [ ] **Step 5: Xác nhận không còn logic copy lặp**

```bash
grep -rn 'cp CKAD\|cp "\$REPO"/CKAD' webapp/dev.sh Dockerfile .github/workflows/deploy-pages.yml \
  && echo "VẪN CÒN LẶP — sửa lại" || echo "OK — logic copy chỉ ở build-content.sh"
```

- [ ] **Step 6: Kiểm tổng thể lần cuối**

```bash
node webapp/check-data.mjs
git status --short          # kỳ vọng: sạch, không có webapp/content/
git log --oneline main..HEAD
```

`git status` phải KHÔNG liệt kê `webapp/content/` (đã gitignore).

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "$(cat <<'EOF'
ci: chạy kiểm tra tính toàn vẹn dữ liệu trước khi deploy

Job check build nội dung rồi chạy node webapp/check-data.mjs; deploy chỉ chạy
khi check xanh. Dữ liệu hỏng sẽ fail build thay vì đẩy lên GitHub Pages.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Bản đồ spec → task

| Mục spec | Task |
|---|---|
| §2 D1 field registry | 3 |
| §2 D2 không đưa lĩnh vực vào URL | 5 |
| §2 D3 không sửa bản ghi K8s cũ | 4 |
| §2 D4 ẩn module không có dữ liệu | 3, 5 |
| §2 D5 lộ trình trỏ vào sách | 8, 9 |
| §2 D6 giữ namespace `kubeprep.` | 13 |
| §2 D7 gộp logic copy | 1 |
| §2 D8 script kiểm dữ liệu | 2 |
| §3.1 `fields.js` | 3 |
| §3.2 `index.js` accessor | 4 |
| §3.3 taxonomy + 7 khoá `sp-*` | 4 |
| §3.4 router & nav | 5 |
| §3.5 thay đổi từng view | 5 (app), 6 (docs), 7 (dashboard, roadmap), 10 (flashcards), 11 (quiz) |
| §3.6 brand DevPrep | 13 |
| §4.1 18 tài liệu | 6 |
| §4.2 lộ trình 10 tuần / 50 mục | 8, 9 |
| §4.3 90 flashcard + 110 câu hỏi | 10, 11, 12 |
| §4.4 tổ chức file dữ liệu | 8, 9, 10, 11, 12 |
| §5.1 commit nguồn vào git | 0 |
| §5.2 `build-content.sh` | 1 |
| §5.3 cập nhật README | 13 |
| §6.1 `check-data.mjs` 7 bất biến | 2 (#1,2,3,4,6), 3 (#5,#7) |
| §6.1 job CI | 14 |
| §6.2 smoke checklist | 14 |
| §7 ghi công CC BY 4.0 | 3 (desc lĩnh vực), 8–12 (header file) |
| §8 tiêu chí hoàn thành | 14 |
