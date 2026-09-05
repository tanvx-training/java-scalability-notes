# CKA Study Guide + Kubernetes: Up and Running — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản dịch tiếng Việt *Certified Kubernetes Administrator (CKA) Study Guide* (ấn bản 2) và *Kubernetes: Up and Running* (ấn bản 3) vào **lĩnh vực `kubernetes` sẵn có** của DevPrep: 46 tài liệu mới, hai track lộ trình mới (`ckabook` 6 tuần/24 mục, `kuar` 9 tuần/36 mục), và gom nhóm theo sách cho trang Thư viện tài liệu.

**Architecture:** DevPrep là web app tĩnh, không build, không dependency. **Không khai lĩnh vực mới** — đây là điểm khác biệt lớn nhất so với 6 đợt thêm sách trước. Hệ quả: mọi con số trong `EXPECTED.counts` là `docs:kubernetes` / `roadmap-items:kubernetes`, hai cuốn dùng chung, nên thứ tự chặng là **bắt buộc**, không tráo được. Đây cũng là đợt đầu tiên **có sửa view** (`views/docs.js`), vì thư viện lĩnh vực này nhảy từ 24 lên 70 thẻ.

**Tech Stack:** JavaScript ES modules thuần (không framework, không bundler) · Node.js ≥ 18 để chạy `check-data.mjs` · bash cho `build-content.sh` · python3 `http.server` cho dev.

**Spec:** [`docs/superpowers/specs/2026-09-05-k8s-two-books-design.md`](../specs/2026-09-05-k8s-two-books-design.md)

## Global Constraints

- **Mọi `id` là khoá localStorage lưu tiến độ người dùng — không bao giờ đổi sau khi đã commit.** Áp dụng cho `ckabook-01`…`ckabook-22`, `ckabook-A`, `kuar-01`…`kuar-22`, `kuar-A`, `cb-w1`…`cb-w6`, `cb-w1-1`…`cb-w6-4`, `ku-w1`…`ku-w9`, `ku-w1-1`…`ku-w9-4`.
- **Tiền tố tuần là `cb-` và `ku-`.** Không phải `cka-` (đã thuộc track chứng chỉ CKA) và không phải `kb-` (đã thuộc track Kubernetes in Action). Bất biến "Id mục lộ trình khớp tiền tố id tuần cha" (`check-data.mjs:143`) bắt sai lệch giữa mục và tuần, nhưng **không** bắt việc bạn đặt nhầm cả cụm sang tiền tố của track khác — Task 7 và Task 12 có lệnh đếm xác nhận.
- **`field: "kubernetes"` cho cả 46 tài liệu và cả 2 track.** Bất biến #3b (`check-data.mjs:242`) đỏ ngay nếu một mục lộ trình của track lĩnh vực này link `#/docs/<id>` sang tài liệu lĩnh vực khác. Ở đợt này ràng buộc đó **dễ thoả nhưng cũng dễ quên chiều ngược**: link sang `#/docs/k8sbook-05` là **hợp lệ** (KIA cũng thuộc lĩnh vực `kubernetes`), khác hẳn 6 đợt trước nơi mọi link xuyên sách đều bị cấm.
- **Thứ tự chặng là bắt buộc.** Chặng 1 và chặng 2 cùng sửa `docs:kubernetes` và `roadmap-items:kubernetes`. Làm chặng 2 trước sẽ khiến bảng kỳ vọng của chặng 1 sai.
- **Không viết bất biến mới trong `check-data.mjs`.** Chỉ (a) mở rộng `EXPECTED.counts`, (b) tổng quát hoá N1 cho ba cuốn (Task 5), (c) đổi tên import `k8sbookCrossref` → `bookCrossref`.
- **Không copy `.pdf` sang `webapp/content/`.**
- **Không sửa 154 mục lộ trình của `ckad`/`cka`/`cks`.** Chip sách nối vào qua bảng crossref; dữ liệu track cũ không được chạm. Bất biến N2 (`check-data.mjs:445`) đỏ nếu merge ghi đè thay vì nối.
- **`bookCrossref` là MỘT object, mỗi id tuần đúng MỘT khoá.** Khoá trùng tên là lỗi im lặng: JavaScript giữ khoá cuối và bỏ các khoá trước, không cảnh báo, và N1 không bắt được vì nó chỉ nhìn object đã hợp nhất. **11 trong 12 khoá KIA hiện có sẽ bị đụng.** Xem spec §8.4.
- **Ngôn ngữ: tiếng Việt.** Thuật ngữ giữ nguyên tiếng Anh đúng như hai bản dịch giữ (Pod, Deployment, ReplicaSet, Service, Ingress, namespace, label, annotation, taint, toleration, admission, `kubectl`, StatefulSet, DaemonSet…).
- **Khối "Đọc" trỏ anchor vào bản dịch, không chép lại nội dung sách.** Tên mục trích **nguyên văn** tiêu đề `##`/`###` của bản dịch.
- **Độ dài mỗi `lesson`: 250–400 từ**, đúng bốn khối theo thứ tự `**Mục tiêu.** / **Đọc.** / **Bẫy.** / **Tự kiểm tra.**`.
- **Mỗi khối tuần có đủ `goal` và `practice`.** Thứ tự khoá: `id, week, title, goal, practice, resources, items`.
- **Bản quyền:** cả hai là sách thương mại O'Reilly. Khuôn chữ dùng trong README: *"sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0"*.
- **Chương 1, 2, 3 của CKA Study Guide KHÔNG có mục "Trọng tâm cho kỳ thi" và "Bài tập mẫu".** Chỉ chương 4–22 có. Đừng hứa hẹn hai mục đó cho ba chương đầu (ảnh hưởng Task 6 tuần 1).
- **Lệnh nghiệm thu duy nhất của repo** (không có test runner nào khác):

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

- **Luôn dán output thật**, không tóm tắt "đã xanh".

## Bảng phân bổ — track `ckabook` (6 tuần / 24 mục)

| Tuần | Chương | Số từ | Ảnh | Mục | Task |
|---|---|---:|---:|---:|---|
| `cb-w1` | ch.1 + ch.2 + ch.3 + ch.4 | 15.677 | 10 | 4 | Task 6 |
| `cb-w2` | ch.5 + ch.6 + ch.7 + ch.8 | 15.818 | 13 | 4 | Task 6 |
| `cb-w3` | ch.9 + ch.10 + ch.11 + ch.12 | 16.102 | 8 | 4 | Task 6 |
| `cb-w4` | ch.13 + ch.14 + ch.15 + ch.16 | 15.503 | 6 | 4 | Task 7 |
| `cb-w5` | ch.17 + ch.18 + ch.19 + ch.20 | 15.461 | 11 | 4 | Task 7 |
| `cb-w6` | ch.21 + ch.22 + Phụ lục A | 20.142 | 2 | 4 | Task 7 |

Tổng **98.703 từ / 50 ảnh / 24 mục**. Một tệp duy nhất `ckabook-roadmap.js`.

## Bảng phân bổ — track `kuar` (9 tuần / 36 mục)

| Tuần | Chương | Số từ | Mục | Task |
|---|---|---:|---:|---|
| `ku-w1` | ch.1 + ch.2 | 12.467 | 4 | Task 11 |
| `ku-w2` | ch.3 + Phụ lục + ch.4 | 8.526 | 4 | Task 11 |
| `ku-w3` | ch.5 + ch.6 | 10.162 | 4 | Task 11 |
| `ku-w4` | ch.7 + ch.8 | 9.860 | 4 | Task 11 |
| `ku-w5` | ch.9 + ch.10 | 9.551 | 4 | Task 11 |
| `ku-w6` | ch.11 + ch.12 + ch.13 | 10.004 | 4 | Task 12 |
| `ku-w7` | ch.14 + ch.15 + ch.16 | 12.456 | 4 | Task 12 |
| `ku-w8` | ch.17 + ch.18 + ch.19 | 14.879 | 4 | Task 12 |
| `ku-w9` | ch.20 + ch.21 + ch.22 | 15.836 | 4 | Task 12 |

Tổng **103.741 từ / 18 ảnh / 36 mục**. `kuarWeeksPart1` = tuần 1–5 = 20 mục · `kuarWeeksPart2` = tuần 6–9 = 16 mục.

## Bảng con số qua từng chặng

| Sau chặng | `docs:kubernetes` | `roadmap-items:kubernetes` | Track lĩnh vực |
|---|---:|---:|---:|
| (hiện tại) | 24 | 184 | 4 |
| 0 | 24 | 184 | 4 |
| 1 | 47 | 208 | 5 |
| 2 | **70** | **244** | **6** |

---

# CHẶNG 0 — Chuẩn hoá nguồn và gom nhóm thư viện

Chặng này **không thêm bản ghi nào**. Cổng kiểm của cả ba task là: check-data xanh với `docs:kubernetes` **vẫn 24**.

## Task 1: Chuẩn hoá `cka-book-vi/` và nối vào build

**Files:**
- Rename: `Certified Kubernetes Administrator (CKA) Study Guide/` → `cka-book-vi/` (23 `.md`, 23 `.pdf`, `images/ch01`–`ch21` + `images/chA` với 50 tệp)
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có.
- Produces: 23 markdown tại `cka-book-vi/NN-slug.md` và 50 ảnh tại `cka-book-vi/images/chNN/`; sau build có mặt tại `webapp/content/ckabook/`. Task 4 tham chiếu qua `file: "content/ckabook/NN-slug.md"`.

- [ ] **Step 1: Ghi lại số đo TRƯỚC khi đụng vào, để đối chiếu sau**

```bash
cd "Certified Kubernetes Administrator (CKA) Study Guide"
echo "md: $(ls *.md | wc -l) | pdf: $(ls *.pdf | wc -l) | ảnh: $(find images -type f | wc -l)"
echo "tham chiếu ảnh: $(grep -oh '!\[[^]]*\](images/[^)]*)' *.md | wc -l)"
cd ..
```

Kỳ vọng chính xác: `md: 23 | pdf: 23 | ảnh: 50` và `tham chiếu ảnh: 50`.

- [ ] **Step 2: Xác nhận không nơi nào tham chiếu ĐƯỜNG DẪN cũ**

```bash
grep -rn "Certified Kubernetes Administrator (CKA) Study Guide/" \
     --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Certified Kubernetes Administrator (CKA) Study Guide" .
```

Kỳ vọng: **không dòng nào**.

**Đừng grep thiếu dấu `/` cuối.** Không có nó, kết quả sẽ gồm cả tên sách xuất hiện trong văn xuôi — đó không phải tham chiếu đường dẫn và **không được sửa**. Loại trừ `docs/` vì spec và kế hoạch này cố ý nhắc tên thư mục cũ.

- [ ] **Step 3: Đổi tên thư mục**

```bash
git mv "Certified Kubernetes Administrator (CKA) Study Guide" cka-book-vi
```

- [ ] **Step 4: Đổi tên 23 tệp `.md` sang slug tiếng Việt**

```bash
cd cka-book-vi
git mv "01. Exam Details and Resources.md"                          01-chi-tiet-ve-ky-thi-va-tai-nguyen.md
git mv "02. Kubernetes in a Nutshell.md"                            02-tom-luoc-ve-kubernetes.md
git mv "03. Interacting with Kubernetes.md"                         03-tuong-tac-voi-kubernetes.md
git mv "04. Cluster Installation and Upgrade.md"                    04-cai-dat-va-nang-cap-cluster.md
git mv "05. Backing Up and Restoring etcd.md"                       05-sao-luu-va-khoi-phuc-etcd.md
git mv "06. Authentication, Authorization, and Admission Control.md" 06-xac-thuc-uy-quyen-va-kiem-soat-tiep-nhan.md
git mv "07. Operators and Custom Resource Definitions (CRDs).md"    07-operator-va-custom-resource-definition.md
git mv "08. Helm and Kustomize.md"                                  08-helm-va-kustomize.md
git mv "09. Pods and Namespaces.md"                                 09-pod-va-namespace.md
git mv "10. ConfigMaps and Secrets.md"                              10-configmap-va-secret.md
git mv "11. Deployments and ReplicaSets.md"                         11-deployment-va-replicaset.md
git mv "12. Scaling Workloads.md"                                   12-scale-workload.md
git mv "13. Resource Requirements, Limits, and Quotas.md"           13-yeu-cau-tai-nguyen-gioi-han-va-quota.md
git mv "14. Pod Scheduling.md"                                      14-lap-lich-pod.md
git mv "15. Volumes.md"                                             15-volume.md
git mv "16. Persistent Volumes.md"                                  16-persistent-volume.md
git mv "17. Services.md"                                            17-service.md
git mv "18. Ingresses.md"                                           18-ingress.md
git mv "19. Gateway API.md"                                         19-gateway-api.md
git mv "20. Network Policies.md"                                    20-network-policy.md
git mv "21. Troubleshooting Applications.md"                        21-xu-ly-su-co-ung-dung.md
git mv "22. Troubleshooting Clusters.md"                            22-xu-ly-su-co-cluster.md
git mv "A. Answers to Review Questions.md"                          A-dap-an-cau-hoi-on-tap.md
cd ..
```

- [ ] **Step 5: Đổi tên 23 tệp `.pdf` sang cùng slug**

Tên PDF gốc dài và có dấu phẩy; dùng vòng lặp khớp theo số chương đứng đầu thay vì gõ tay 23 dòng:

```bash
cd cka-book-vi
for md in [0-9][0-9]-*.md; do
  n="${md%%-*}"                      # "09"
  num=$((10#$n))                     # 9 — PDF dùng số không có số 0 đứng đầu
  slug="${md%.md}"
  pdf=$(ls "${num}. "*.pdf 2>/dev/null | head -1)
  [ -n "$pdf" ] && git mv "$pdf" "${slug}.pdf"
done
git mv "A. Answers to Review Questions _ Certified Kubernetes Administrator (CKA) Study Guide, 2nd Edition.pdf" \
       A-dap-an-cau-hoi-on-tap.pdf
ls *.pdf | wc -l
cd ..
```

Kỳ vọng: `23`.

- [ ] **Step 6: Đối chiếu lại số đo — không tệp nào mất, không ảnh nào gãy**

```bash
cd cka-book-vi
echo "md: $(ls *.md | wc -l) | pdf: $(ls *.pdf | wc -l) | ảnh: $(find images -type f | wc -l)"
echo "--- cặp md/pdf thiếu:"
for f in *.md; do [ -f "${f%.md}.pdf" ] || echo "THIẾU PDF: $f"; done
echo "--- ảnh gãy:"
grep -oh '](images/[^)]*)' *.md | sed 's/^](//;s/)$//' | sort -u \
  | while read -r p; do [ -f "$p" ] || echo "GÃY: $p"; done
cd ..
```

Kỳ vọng chính xác: `md: 23 | pdf: 23 | ảnh: 50`, **không** dòng `THIẾU PDF`, **không** dòng `GÃY`.

Đường dẫn ảnh `images/chNN/...` là tương đối và `images/` đi cùng thư mục, nên **không được sửa một đường dẫn ảnh nào** ở task này. Nếu thấy `GÃY`, nghĩa là `git mv` thư mục đã sai — dừng lại, đừng "sửa" bằng cách viết lại đường dẫn trong markdown.

- [ ] **Step 7: Nối vào `build-content.sh`**

Trong `webapp/build-content.sh`, thêm `"$DEST/ckabook/images"` vào cuối danh sách của lệnh `mkdir -p` (dòng bắt đầu `mkdir -p "$DEST/java" …`), rồi thêm hai dòng copy vào cuối tệp:

```bash
cp    "$REPO"/cka-book-vi/*.md                           "$DEST/ckabook/"
cp -R "$REPO"/cka-book-vi/images/.                       "$DEST/ckabook/images/"
```

**Không** copy `.pdf`.

- [ ] **Step 8: Chạy build và đếm tệp đã sang `content/`**

```bash
./webapp/build-content.sh webapp/content
echo "md: $(ls webapp/content/ckabook/*.md | wc -l) | ảnh: $(find webapp/content/ckabook/images -type f | wc -l)"
```

Kỳ vọng chính xác: `md: 23 | ảnh: 50`.

- [ ] **Step 9: Chạy nghiệm thu — phải xanh y như trước, chưa có bản ghi mới**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` Chưa có tài liệu `ckabook-*` nào nên `docs:kubernetes` vẫn là 24 — nếu nó đỏ ở đây thì lỗi không nằm ở task này.

- [ ] **Step 10: Commit**

```bash
git add -A cka-book-vi webapp/build-content.sh
git commit -m "chore: chuẩn hoá nguồn CKA Study Guide thành cka-book-vi/ (23 tệp, 50 ảnh) và nối vào build-content"
```

---

## Task 2: Chuẩn hoá `kuar-vi/` và nối vào build

**Files:**
- Rename: `Kubernetes- Up and Running/` → `kuar-vi/`, kéo nội dung `vi/` lên một tầng, gom 23 `.pdf` từ tầng cha
- Modify: `webapp/build-content.sh`

**Interfaces:**
- Consumes: không có.
- Produces: 23 markdown + `README.md` tại `kuar-vi/`, 18 ảnh tại `kuar-vi/images/`; sau build có mặt tại `webapp/content/kuar/`. Task 9 tham chiếu qua `file: "content/kuar/<slug>.md"`.

- [ ] **Step 1: Ghi lại số đo trước khi đụng vào**

```bash
cd "Kubernetes- Up and Running"
echo "pdf ở tầng cha: $(ls *.pdf | wc -l)"
cd vi
echo "md: $(ls *.md | wc -l) (gồm README) | ảnh: $(find images -type f | wc -l)"
cd ../..
```

Kỳ vọng chính xác: `pdf ở tầng cha: 23` và `md: 24 (gồm README) | ảnh: 18`.

- [ ] **Step 2: Xác nhận không nơi nào tham chiếu đường dẫn cũ**

```bash
grep -rn "Kubernetes- Up and Running/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Kubernetes- Up and Running" .
```

Kỳ vọng: **không dòng nào**.

- [ ] **Step 3: Đổi tên thư mục và kéo `vi/` lên một tầng**

```bash
git mv "Kubernetes- Up and Running" kuar-vi
cd kuar-vi
for f in vi/*.md; do git mv "$f" "$(basename "$f")"; done
git mv vi/images images
rmdir vi 2>/dev/null || ls -la vi
cd ..
```

Sau bước này `vi/` phải biến mất. Nếu `ls -la vi` còn in ra thứ gì, dừng lại và xem đó là gì trước khi xoá.

**Giữ nguyên 23 slug tiếng Anh** (`05-pods.md`, `A-building-your-own-kubernetes-cluster.md`) — đúng tiền lệ `kafka-vi/`. Đổi sang slug tiếng Việt sẽ làm gãy bảng mục lục trong `README.md` của bản dịch mà không đổi lại được gì.

- [ ] **Step 4: Đổi tên 23 `.pdf` sang cùng slug với `.md`**

```bash
cd kuar-vi
for md in [0-9][0-9]-*.md; do
  n="${md%%-*}"; num=$((10#$n)); slug="${md%.md}"
  pdf=$(ls "${num}. "*.pdf 2>/dev/null | head -1)
  [ -n "$pdf" ] && git mv "$pdf" "${slug}.pdf"
done
git mv "A. Building Your Own Kubernetes Cluster _ Kubernetes_ Up and Running, 3rd Edition.pdf" \
       A-building-your-own-kubernetes-cluster.pdf
ls *.pdf | wc -l
cd ..
```

Kỳ vọng: `23`.

- [ ] **Step 5: Đối chiếu số đo và kiểm ảnh**

```bash
cd kuar-vi
echo "md: $(ls *.md | wc -l) (gồm README) | pdf: $(ls *.pdf | wc -l) | ảnh: $(find images -type f | wc -l)"
echo "--- cặp md/pdf thiếu (README không có PDF — đúng, bỏ qua):"
for f in *.md; do [ "$f" = README.md ] && continue; [ -f "${f%.md}.pdf" ] || echo "THIẾU PDF: $f"; done
echo "--- ảnh gãy (bỏ qua 'images/' trần — đó là link tới thư mục trong README):"
grep -oh '](images/[^)]*)' *.md | sed 's/^](//;s/)$//' | sort -u \
  | while read -r p; do [ "$p" = "images/" ] && continue; [ -f "$p" ] || echo "GÃY: $p"; done
cd ..
```

Kỳ vọng chính xác: `md: 24 (gồm README) | pdf: 23 | ảnh: 18`, **không** dòng `THIẾU PDF`, **không** dòng `GÃY`.

`README.md` không có PDF vì nó là mục lục do người dịch viết, không phải chương sách — đó là đúng nguồn, không phải mất mát.

- [ ] **Step 6: Nối vào `build-content.sh`**

Thêm `"$DEST/kuar/images"` vào lệnh `mkdir -p`, rồi hai dòng copy vào cuối tệp:

```bash
cp    "$REPO"/kuar-vi/*.md                               "$DEST/kuar/"
cp -R "$REPO"/kuar-vi/images/.                           "$DEST/kuar/images/"
```

`README.md` sẽ bị copy sang `content/kuar/README.md`. **Vô hại và đúng tiền lệ** — `content/k8sbook/README.md` đã tồn tại như vậy, không bản ghi doc nào trỏ tới nó.

- [ ] **Step 7: Build và đếm**

```bash
./webapp/build-content.sh webapp/content
echo "md: $(ls webapp/content/kuar/*.md | wc -l) | ảnh: $(find webapp/content/kuar/images -type f | wc -l)"
```

Kỳ vọng chính xác: `md: 24 | ảnh: 18` (24 vì có README).

- [ ] **Step 8: Nghiệm thu**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.`

- [ ] **Step 9: Commit**

```bash
git add -A kuar-vi webapp/build-content.sh
git commit -m "chore: chuẩn hoá nguồn Kubernetes Up and Running thành kuar-vi/ (23 chương, 18 ảnh) và nối vào build-content"
```

---

## Task 3: Gom nhóm theo sách cho trang Thư viện tài liệu

**Files:**
- Modify: `webapp/js/views/docs.js:26-55` (hàm `renderIndex`)
- Modify: `webapp/js/data/docs-index.js` (thêm `group` cho 24 bản ghi lĩnh vực `kubernetes`)

**Interfaces:**
- Consumes: bản ghi `docs` hiện có.
- Produces: quy ước trường tuỳ chọn `group: "<nhãn>"` trên bản ghi doc. Task 4 và Task 9 khai `group` cho 46 bản ghi mới.

- [ ] **Step 1: Sửa `renderIndex` để gom nhóm**

Thay toàn bộ thân hàm `renderIndex` trong `webapp/js/views/docs.js` bằng:

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

  // Gom theo `group`, giữ thứ tự xuất hiện đầu tiên trong mảng docs — thứ tự
  // mảng đang là thứ tự đọc có chủ ý, không được sắp xếp lại. Tài liệu không
  // khai `group` rơi vào nhóm không tiêu đề đứng trước, render y như cũ.
  const groups = new Map();
  for (const d of list) {
    const key = d.group ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  for (const [label, items] of groups) {
    if (label) {
      page.append(h("h2", { class: "section-title", style: "margin:26px 0 12px" },
        label, h("span", { class: "faint", style: "margin-left:8px;font-weight:400" },
          `${items.length} tài liệu`)));
    }
    const grid = h("div", { class: "grid", style: "margin-bottom:26px" });
    for (const d of items) {
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
  }
  root.append(page);
}
```

- [ ] **Step 2: Xác nhận `section-title` là class có thật trong CSS**

```bash
grep -n "section-title" webapp/css/style.css
```

Nếu **không có dòng nào**, bỏ `class: "section-title"` và dùng thay bằng
`style: "margin:26px 0 12px;font-size:17px"` — đừng thêm class mới vào CSS cho một chỗ dùng duy nhất.

- [ ] **Step 3: Gán `group` cho 24 bản ghi lĩnh vực `kubernetes`**

Trong `webapp/js/data/docs-index.js`, thêm dòng `group:` ngay sau dòng `field: "kubernetes",` của từng bản ghi:

| Bản ghi | Giá trị `group` |
|---|---|
| `prerequisites`, `study-guide`, `cheat-sheet`, `cka-study-guide`, `cka-cheat-sheet`, `cks-study-guide`, `cks-cheat-sheet` | `"Luyện thi & tra cứu (tự biên)"` |
| `k8sbook-00`, `k8sbook-02` … `k8sbook-17` (17 bản ghi) | `"Kubernetes in Action (Lukša, Manning)"` |

Ví dụ:

```js
  {
    id: "prerequisites",
    field: "kubernetes",
    group: "Luyện thi & tra cứu (tự biên)",
    title: "Kiến thức nền tảng (Prerequisites)",
```

**Không đụng vào 126 bản ghi của 9 lĩnh vực còn lại** — chúng không khai `group` và phải render y hệt hiện tại.

- [ ] **Step 4: Đếm xác nhận đúng 24 bản ghi được gán, không thừa không thiếu**

```bash
node -e "import('./webapp/js/data/docs-index.js').then(m=>{
  const k=m.docs.filter(d=>(d.field??'kubernetes')==='kubernetes');
  const g={}; for(const d of k) g[d.group??'(không nhóm)']=(g[d.group??'(không nhóm)']||0)+1;
  console.log('docs kubernetes:', k.length); console.log(g);
  const other=m.docs.filter(d=>(d.field??'kubernetes')!=='kubernetes'&&d.group);
  console.log('lĩnh vực khác lỡ khai group:', other.length);
})"
```

Kỳ vọng chính xác:

```
docs kubernetes: 24
{ 'Luyện thi & tra cứu (tự biên)': 7, 'Kubernetes in Action (Lukša, Manning)': 17 }
lĩnh vực khác lỡ khai group: 0
```

Không được có khoá `(không nhóm)` — nếu có, còn bản ghi bị bỏ sót.

- [ ] **Step 5: Nghiệm thu tự động**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` với `docs:kubernetes` **vẫn 24** — chặng 0 không thêm bản ghi nào.

- [ ] **Step 6: Nghiệm thu bằng mắt**

```bash
./webapp/dev.sh
```

Mở `http://localhost:8888/#/docs`, lĩnh vực Kubernetes: phải thấy **hai tiêu đề nhóm** với số đếm 7 và 17. Rồi chuyển sang lĩnh vực **Kafka** (`#/docs` sau khi đổi lĩnh vực ở sidebar): phải là **một lưới phẳng không tiêu đề nhóm**, y hệt trước.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/views/docs.js webapp/js/data/docs-index.js
git commit -m "feat: gom nhóm theo sách cho trang Thư viện tài liệu

Trường tuỳ chọn group trên bản ghi doc; renderIndex gom theo group giữ
nguyên thứ tự mảng. 24 tài liệu Kubernetes chia 2 nhóm; 9 lĩnh vực còn
lại không khai group nên render không đổi."
```

---

# CHẶNG 1 — CKA Study Guide sống trong app

## Task 4: 23 tài liệu `ckabook-*`

**Files:**
- Modify: `webapp/check-data.mjs:29` (`"docs:kubernetes": 24` → `47`)
- Modify: `webapp/js/data/docs-index.js` (thêm 23 bản ghi sau khối `k8sbook-17`)

**Interfaces:**
- Consumes: markdown tại `webapp/content/ckabook/` do Task 1 sinh ra; quy ước `group` do Task 3 sinh ra.
- Produces: 23 doc id `ckabook-01`…`ckabook-22`, `ckabook-A`. Task 5 dùng chúng làm giá trị bảng crossref; Task 6–7 dùng làm đích anchor `#/docs/ckabook-NN`.

- [ ] **Step 1: Sửa bảng kỳ vọng TRƯỚC khi viết dữ liệu**

Trong `webapp/check-data.mjs`, sửa dòng 29 và cập nhật chú thích ngay trên nó:

```js
    // Nội dung Kubernetes có từ trước — chốt luôn để xoá/thiếu bản ghi không
    // âm thầm lọt qua (vd xoá bớt câu hỏi vẫn qua đủ 23 bất biến trước đây).
    // 24 gốc + 23 chương CKA Study Guide (Muschko, O'Reilly).
    "docs:kubernetes": 47,
```

Đây là cách repo tự quy định làm việc: *"Bảng kỳ vọng: sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới"* (`check-data.mjs:20`).

- [ ] **Step 2: Chạy nghiệm thu để thấy nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **THẤT BẠI** với dòng chứa `docs:kubernetes: kỳ vọng 47, thực tế 24`.

Nếu nó xanh, bạn đã sửa sai dòng — dừng và kiểm lại.

- [ ] **Step 3: Đọc mục lục thật của 23 chương**

```bash
cd cka-book-vi && for f in *.md; do echo "### $f"; grep '^## ' "$f" | sed 's/^## /  /'; done; cd ..
```

`desc` của mỗi bản ghi viết **từ danh sách này**, dài 15–30 từ, nêu đúng nội dung chương — không suy từ tiêu đề.

Bỏ qua ba mục lặp lại ở gần hết các chương (`Tóm tắt`, `Trọng tâm cho kỳ thi`, `Bài tập mẫu`) khi viết `desc` — chúng không phân biệt chương này với chương khác.

- [ ] **Step 4: Thêm 23 bản ghi vào `docs-index.js`**

Chèn **ngay sau** bản ghi `k8sbook-17`, trước khối `// ===== Java & Spring Boot Scalability`… nếu khối đó đứng sau; nếu không, chèn cuối khối Kubernetes. Mọi bản ghi có `field: "kubernetes"` và `group: "CKA Study Guide (Muschko, O'Reilly)"`.

Khuôn một bản ghi, đã điền đủ cho `ckabook-09` làm mẫu:

```js
  {
    id: "ckabook-09",
    field: "kubernetes",
    group: "CKA Study Guide (Muschko, O'Reilly)",
    title: "CKA Book 09 — Pod và Namespace",
    file: "content/ckabook/09-pod-va-namespace.md",
    icon: "🫙",
    desc: "Tạo, liệt kê, xem log và exec vào Pod bằng cả cách mệnh lệnh lẫn khai báo; các pha vòng đời, restart policy, và làm việc với namespace.",
    tags: ["CKA Study Guide", "Pod", "Namespace"],
  },
```

Bảng đầy đủ 23 bản ghi — `desc` bạn viết theo Step 3:

| `id` | `title` | `file` (dưới `content/ckabook/`) | `icon` | `tags` |
|---|---|---|---|---|
| `ckabook-01` | CKA Book 01 — Chi tiết về kỳ thi và tài nguyên | `01-chi-tiet-ve-ky-thi-va-tai-nguyen.md` | 🎫 | `["CKA Study Guide", "Kỳ thi", "Đề cương"]` |
| `ckabook-02` | CKA Book 02 — Tóm lược về Kubernetes | `02-tom-luoc-ve-kubernetes.md` | 🧭 | `["CKA Study Guide", "Kiến trúc"]` |
| `ckabook-03` | CKA Book 03 — Tương tác với Kubernetes | `03-tuong-tac-voi-kubernetes.md` | ⌨️ | `["CKA Study Guide", "kubectl", "API"]` |
| `ckabook-04` | CKA Book 04 — Cài đặt và nâng cấp cluster | `04-cai-dat-va-nang-cap-cluster.md` | 🏗️ | `["CKA Study Guide", "kubeadm", "Upgrade"]` |
| `ckabook-05` | CKA Book 05 — Sao lưu và khôi phục etcd | `05-sao-luu-va-khoi-phuc-etcd.md` | 💾 | `["CKA Study Guide", "etcd", "Backup"]` |
| `ckabook-06` | CKA Book 06 — Xác thực, ủy quyền và kiểm soát tiếp nhận | `06-xac-thuc-uy-quyen-va-kiem-soat-tiep-nhan.md` | 🔑 | `["CKA Study Guide", "RBAC", "Admission"]` |
| `ckabook-07` | CKA Book 07 — Operator và CRD | `07-operator-va-custom-resource-definition.md` | 🤖 | `["CKA Study Guide", "Operator", "CRD"]` |
| `ckabook-08` | CKA Book 08 — Helm và Kustomize | `08-helm-va-kustomize.md` | 📦 | `["CKA Study Guide", "Helm", "Kustomize"]` |
| `ckabook-09` | CKA Book 09 — Pod và Namespace | `09-pod-va-namespace.md` | 🫙 | `["CKA Study Guide", "Pod", "Namespace"]` |
| `ckabook-10` | CKA Book 10 — ConfigMap và Secret | `10-configmap-va-secret.md` | 🗝️ | `["CKA Study Guide", "ConfigMap", "Secret"]` |
| `ckabook-11` | CKA Book 11 — Deployment và ReplicaSet | `11-deployment-va-replicaset.md` | 🚢 | `["CKA Study Guide", "Deployment", "Rollout"]` |
| `ckabook-12` | CKA Book 12 — Scale workload | `12-scale-workload.md` | 📈 | `["CKA Study Guide", "Scaling", "HPA"]` |
| `ckabook-13` | CKA Book 13 — Yêu cầu tài nguyên, giới hạn và quota | `13-yeu-cau-tai-nguyen-gioi-han-va-quota.md` | 📊 | `["CKA Study Guide", "Resources", "Quota"]` |
| `ckabook-14` | CKA Book 14 — Lập lịch Pod | `14-lap-lich-pod.md` | 📌 | `["CKA Study Guide", "Scheduling", "Affinity"]` |
| `ckabook-15` | CKA Book 15 — Volume | `15-volume.md` | 🗂️ | `["CKA Study Guide", "Volume"]` |
| `ckabook-16` | CKA Book 16 — Persistent Volume | `16-persistent-volume.md` | 🧱 | `["CKA Study Guide", "PV", "StorageClass"]` |
| `ckabook-17` | CKA Book 17 — Service | `17-service.md` | 🔀 | `["CKA Study Guide", "Service"]` |
| `ckabook-18` | CKA Book 18 — Ingress | `18-ingress.md` | 🌐 | `["CKA Study Guide", "Ingress"]` |
| `ckabook-19` | CKA Book 19 — Gateway API | `19-gateway-api.md` | 🚪 | `["CKA Study Guide", "Gateway API"]` |
| `ckabook-20` | CKA Book 20 — Network Policy | `20-network-policy.md` | 🛡️ | `["CKA Study Guide", "NetworkPolicy"]` |
| `ckabook-21` | CKA Book 21 — Xử lý sự cố ứng dụng | `21-xu-ly-su-co-ung-dung.md` | 🔍 | `["CKA Study Guide", "Troubleshooting"]` |
| `ckabook-22` | CKA Book 22 — Xử lý sự cố cluster | `22-xu-ly-su-co-cluster.md` | 🩺 | `["CKA Study Guide", "Troubleshooting", "Node"]` |
| `ckabook-A` | CKA Book A — Đáp án câu hỏi ôn tập | `A-dap-an-cau-hoi-on-tap.md` | ✅ | `["CKA Study Guide", "Đáp án"]` |

Tiền tố `CKA Book` là **cố ý**, không phải `CKA Study Guide`: chuỗi sau đã là tiêu đề của bản ghi `cka-study-guide` tự biên trong cùng thư viện, và hai thứ đó khác nhau.

- [ ] **Step 5: Nghiệm thu — phải XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` Bất biến #2 (`docs[].file` tồn tại trên đĩa) và #2b (ảnh trong markdown tồn tại) giờ mới thực sự kiểm 23 tệp mới — nếu gõ sai một `file:` nào, nó đỏ ở đây.

- [ ] **Step 6: Kiểm nhóm và icon không trùng trong cùng nhóm**

```bash
node -e "import('./webapp/js/data/docs-index.js').then(m=>{
  const g=m.docs.filter(d=>d.group==='CKA Study Guide (Muschko, O\'Reilly)');
  console.log('bản ghi:', g.length);
  const ic=g.map(d=>d.icon); const dup=ic.filter((x,i)=>ic.indexOf(x)!==i);
  console.log('icon trùng:', dup.length? dup.join(' ') : 'không');
})"
```

Kỳ vọng chính xác: `bản ghi: 23` và `icon trùng: không`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/check-data.mjs
git commit -m "feat: 23 tài liệu CKA Study Guide trong lĩnh vực Kubernetes"
```

---

## Task 5: `book-crossref.js` — một bảng cho ba cuốn

**Files:**
- Rename: `webapp/js/data/k8sbook-crossref.js` → `webapp/js/data/book-crossref.js`
- Modify: `webapp/js/data/roadmap.js` (dòng import + tên biến trong `withBookRefs`)
- Modify: `webapp/check-data.mjs:101` (import) và bất biến N1 (`:416`) và N2 (`:445`)

**Interfaces:**
- Consumes: doc id `ckabook-*` từ Task 4.
- Produces: `export const bookCrossref`. Task 10 nối thêm `kuar-*` **vào các mảng có sẵn**, không thêm khoá mới trùng tên.

- [ ] **Step 1: Đổi tên tệp và biến export**

```bash
git mv webapp/js/data/k8sbook-crossref.js webapp/js/data/book-crossref.js
```

Trong tệp vừa đổi tên, sửa `export const k8sbookCrossref = {` thành `export const bookCrossref = {` và viết lại phần chú thích đầu tệp:

```js
// Liên kết chéo: tuần của giáo trình chứng chỉ → chương sách.
//
// Ba cuốn dùng CHUNG bảng này: Kubernetes in Action (k8sbook-*), CKA Study
// Guide (ckabook-*) và Kubernetes: Up and Running (kuar-*). Đây là MỘT object,
// mỗi id tuần đúng MỘT khoá — viết một tuần thành hai khoá cho hai cuốn là lỗi
// im lặng: JavaScript giữ khoá cuối và bỏ khoá trước, không cảnh báo, và N1
// không bắt được vì nó chỉ thấy object đã hợp nhất.
//
// roadmap.js merge bảng này vào `week.resources` lúc dựng track, nên dữ liệu
// lộ trình chứng chỉ (154 mục) không phải sửa một ký tự nào.
//
// Khoá là id tuần CÓ THẬT của track ckad/cka/cks; giá trị là id tài liệu sách.
// check-data.mjs (N1) chặn cả hai loại gõ nhầm.
```

- [ ] **Step 2: Viết giá trị hợp nhất cho chặng 1**

Thay toàn bộ thân object bằng (phần `kuar-*` sẽ do Task 10 nối thêm):

```js
export const bookCrossref = {
  // ----- CKAD -----
  "w1": ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10"],
  "w2": ["k8sbook-05", "k8sbook-06"],
  "w3": ["k8sbook-13", "k8sbook-14", "k8sbook-17"],
  "w4": ["k8sbook-09"],
  "w5": ["k8sbook-06"],
  "w6": ["k8sbook-11", "k8sbook-12"],
  "w7": ["k8sbook-07", "k8sbook-08", "k8sbook-15"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04", "ckabook-02", "ckabook-03"],
  "cka-w2": ["ckabook-04"],
  "cka-w3": ["ckabook-05"],
  "cka-w4": ["k8sbook-16", "ckabook-13", "ckabook-14"],
  "cka-w5": ["k8sbook-07", "k8sbook-08", "ckabook-15", "ckabook-16"],
  "cka-w6": ["k8sbook-11", "k8sbook-12", "ckabook-17", "ckabook-18", "ckabook-19", "ckabook-20"],
  "cka-w7": ["ckabook-06", "ckabook-07", "ckabook-08"],
  "cka-w8": ["ckabook-21", "ckabook-22"],
  "cka-w9": ["ckabook-01", "ckabook-A"],

  // ----- CKS -----
  "cks-w4": ["k8sbook-09"],
};
```

Chú ý ba điều: **12 khoá KIA cũ giữ nguyên giá trị cũ ở đầu mỗi mảng** (không xoá, không sắp xếp lại — chip người học đã quen không được đổi chỗ); `cka-w1`, `cka-w4`, `cka-w5`, `cka-w6` là các khoá **đã có sẵn** nay được nối thêm; chương 9–12 của CKA Book **không** nối vào track `cka` vì đó là kiến thức CKAD người học đã qua.

- [ ] **Step 3: Sửa `roadmap.js`**

```js
import { bookCrossref } from "./book-crossref.js";
```

và trong `withBookRefs`, đổi `const refs = k8sbookCrossref[w.id];` thành `const refs = bookCrossref[w.id];`.

```bash
grep -n "k8sbookCrossref\|k8sbook-crossref" webapp/js/data/roadmap.js
```

Kỳ vọng sau khi sửa: **không dòng nào**.

- [ ] **Step 4: Tổng quát hoá bất biến N1 cho ba cuốn**

Trong `webapp/check-data.mjs`, sửa dòng import (`:101`):

```js
const { bookCrossref } = await import("./js/data/book-crossref.js");
```

Thêm bảng tiền tố ngay trên bất biến N1:

```js
// Mỗi cuốn sách: tiền tố doc id → tiền tố id tuần của track đọc chính cuốn đó.
// Thêm cuốn thứ tư chỉ phải thêm một dòng ở đây.
const BOOK_PREFIXES = { "k8sbook-": "kb-w", "ckabook-": "cb-w", "kuar-": "ku-w" };
```

Rồi thay thân N1 bằng:

```js
await check("bookCrossref trỏ tới tuần và tài liệu có thật", () => {
  const docIds = new Set(docs.map((d) => d.id));
  const bad = [];
  for (const [weekId, refs] of Object.entries(bookCrossref)) {
    if (!rawWeeks.has(weekId)) bad.push(`tuần "${weekId}" không tồn tại`);
    for (const wp of Object.values(BOOK_PREFIXES)) {
      if (weekId.startsWith(wp)) bad.push(`"${weekId}" là tuần của chính track sách`);
    }
    const dup = dupes(refs);
    if (dup.length) bad.push(`tuần "${weekId}" trùng: ${dup.join(", ")}`);
    for (const id of refs) {
      if (!Object.keys(BOOK_PREFIXES).some((p) => id.startsWith(p))) {
        bad.push(`"${weekId}" → "${id}" không phải chương sách`);
      } else if (!docIds.has(id)) {
        bad.push(`"${weekId}" → "${id}" không tồn tại`);
      }
    }
  }
  expect(!bad.length, bad.join("; "));
});
```

Trong N2 (`:445`), đổi `Object.entries(k8sbookCrossref)` thành `Object.entries(bookCrossref)`. **Không sửa gì khác trong N2** — phần khẳng định `raw !== now` và hai vòng kiểm nội dung giữ nguyên.

- [ ] **Step 5: Xác nhận không còn tên cũ ở đâu**

```bash
grep -rn "k8sbookCrossref\|k8sbook-crossref" webapp/ || echo "sạch"
```

Kỳ vọng: `sạch`.

- [ ] **Step 6: Nghiệm thu**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` N2 sẽ đỏ nếu bạn lỡ làm `withBookRefs` mutate tại chỗ; N1 đỏ nếu gõ nhầm id tuần hoặc doc id.

- [ ] **Step 7: Đếm chip thực tế đã merge vào track `cka`**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  const t=m.tracks.find(x=>x.id==='cka');
  for(const w of t.weeks){
    const n=(w.resources??[]).filter(r=>String(r.href).startsWith('#/docs/')).length;
    console.log(w.id, '→', n, 'chip sách');
  }
})"
```

Kỳ vọng: cả **9 tuần** đều có ≥ 1 chip, `cka-w6` có 6 (trần cho phép), không tuần nào quá 6.

- [ ] **Step 8: Commit**

```bash
git add -A webapp/js/data/book-crossref.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "refactor: k8sbook-crossref.js thành book-crossref.js giữ cả ba cuốn

Nối chip 22 chương CKA Study Guide vào đủ 9 tuần của giáo trình CKA.
N1 chuyển sang bảng BOOK_PREFIXES thay vì đóng cứng một tiền tố."
```

---

## Task 6: Track `ckabook` tuần 1–3 (12 mục)

**Files:**
- Create: `webapp/js/data/ckabook-roadmap.js`

**Interfaces:**
- Consumes: doc id `ckabook-01`…`ckabook-16` từ Task 4; track id `cka` (đã tồn tại) làm đích chip ôn lại.
- Produces: `export const ckabookWeeks`. Task 7 nối tuần 4–6 vào **cùng mảng** và import tên này vào `roadmap.js`.

- [ ] **Step 1: Đọc 8 tệp nguồn của tuần 1–3**

`cka-book-vi/01-…` đến `cka-book-vi/12-…`. Đọc thật, không suy từ tiêu đề — khối "Bẫy" phải lấy từ cảnh báo có thật của sách.

- [ ] **Step 2: Tạo tệp với header**

```js
// Lộ trình NƯỚC RÚT ôn thi CKA — bám cuốn CKA Study Guide (ấn bản 2).
//
// Nguồn: bản dịch tiếng Việt "Certified Kubernetes Administrator (CKA) Study
// Guide", ấn bản 2 — Benjamin Muschko, O'Reilly. Thư mục nguồn: cka-book-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// ĐỊNH VỊ: track này chạy SAU khi học xong giáo trình CKA (#/roadmap/cka).
// Nó là vòng ôn thứ hai, KHÔNG dạy lại từ đầu — mỗi mục ưu tiên phần
// "Trọng tâm cho kỳ thi" của chương, và giao bài tập mẫu cuối chương.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Đề bài "Bài tập mẫu" KHÔNG được chép sang đây — chỉ trỏ tới chương.
// GIỮ NGUYÊN id (cb-w<N> / cb-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là cb-, KHÔNG phải cka- (đã thuộc track chứng chỉ CKA).

export const ckabookWeeks = [
  // … 3 khối tuần ở Step 3–5, thêm 3 khối nữa ở Task 7 …
];
```

- [ ] **Step 3: Viết tuần 1 — `cb-w1`, 4 mục (ch.1–4)**

`week`: `"Tuần 1"` · `title`: `"Luật chơi phòng thi, kiến trúc cluster và kubeadm"`

`goal`: Nói lại được đề cương chấm điểm theo tỷ trọng nào, và tự dựng rồi nâng cấp một cluster kubeadm mà không tra tài liệu.

`practice`: Làm **Bài tập mẫu** cuối chương 4, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bấm giờ 12 phút cho bài nâng cấp cluster — đó là mốc thời gian thực tế của đề thật.

`resources`: `#/docs/ckabook-01`, `#/docs/ckabook-02`, `#/docs/ckabook-03`, `#/docs/ckabook-04`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`, và `{ label: "kubernetes.io — Upgrading kubeadm clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/" }`.

**Chương 1, 2, 3 không có mục "Trọng tâm cho kỳ thi" và "Bài tập mẫu"** — chỉ chương 4 có. Đừng viết khối "Đọc" trỏ tới hai mục đó ở ba mục đầu.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w1-1` | Đề cương chấm điểm, môi trường thi và cách chia thời gian | ch.1 §"Mục tiêu của kỳ thi" + §"Đề cương" + §"Môi trường thi và các mẹo" + §"Quản lý thời gian" |
| `cb-w1-2` | Kiến trúc cluster và các primitive API phải thuộc | ch.2 §"Kiến trúc tổng quan" + §"Các tính năng" · ch.3 §"Các primitive và đối tượng của API" |
| `cb-w1-3` | `kubectl` ở tốc độ phòng thi: alias, `--dry-run`, `explain` | ch.1 §"Mẹo và thủ thuật dòng lệnh" · ch.3 §"Sử dụng kubectl" + §"Quản lý đối tượng" |
| `cb-w1-4` | Dựng cluster bằng kubeadm và nâng cấp phiên bản | ch.4 §"Sử dụng kubeadm" + §"Cài đặt Cluster" + §"Quản lý cluster có tính sẵn sàng cao" + §"Nâng cấp phiên bản Cluster" + §"Trọng tâm cho kỳ thi" |

- [ ] **Step 4: Viết tuần 2 — `cb-w2`, 4 mục (ch.5–8)**

`week`: `"Tuần 2"` · `title`: `"etcd, xác thực/ủy quyền, CRD và đóng gói"`

`goal`: Snapshot rồi khôi phục etcd trong 8 phút, và đọc được một lỗi `Forbidden` để chỉ ra thiếu Role hay thiếu RoleBinding.

`practice`: Làm **Bài tập mẫu** cuối chương 5, 6 và 8, đối chiếu [Phụ lục A](#/docs/ckabook-A). Riêng bài etcd làm hai lần: lần hai không mở tài liệu.

`resources`: `#/docs/ckabook-05` … `#/docs/ckabook-08`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`, và `{ label: "kubernetes.io — Operating etcd clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w2-1` | Snapshot và khôi phục etcd — bài gần như chắc chắn có trong đề | ch.5 §"Sử dụng các tiện ích quản trị etcd" + §"Trọng tâm cho kỳ thi" |
| `cb-w2-2` | Một request đi qua API server: xác thực trước, ủy quyền sau | ch.6 §"Xử lý một yêu cầu API" + §"Xác thực với kubectl" + §"Ủy quyền với kiểm soát truy cập dựa trên vai trò" |
| `cb-w2-3` | Service Account, kiểm soát tiếp nhận, Operator và CRD | ch.6 §"Làm việc với Service Account" + §"Kiểm soát tiếp nhận" + §"Trọng tâm cho kỳ thi" · ch.7 §"Làm việc với Operator" + §"Làm việc với Custom Resource Definition" |
| `cb-w2-4` | Helm và Kustomize — khác nhau ở đâu và gõ lệnh nào | ch.8 §"Làm việc với Helm" + §"Làm việc với Kustomize" + §"Những khác biệt chính giữa Helm và Kustomize" |

Chương 7 là chương nhẹ nhất phần này (2.200 từ) nên đi kèm phần đuôi chương 6 trong cùng một mục — đó là chủ ý, không phải nhồi nhét.

- [ ] **Step 5: Viết tuần 3 — `cb-w3`, 4 mục (ch.9–12)**

`week`: `"Tuần 3"` · `title`: `"Pod, cấu hình, Deployment và scale"`

`goal`: Tạo và sửa được bốn primitive này hoàn toàn bằng lệnh mệnh lệnh, không mở trình soạn thảo trừ khi bắt buộc.

`practice`: Làm **Bài tập mẫu** cuối cả bốn chương 9–12, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bấm giờ 6 phút mỗi bài.

`resources`: `#/docs/ckabook-09` … `#/docs/ckabook-12`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w3-1` | Pod và namespace ở tốc độ mệnh lệnh | ch.9 §"Làm việc với Pod" + §"Làm việc với Namespace" + §"Trọng tâm cho kỳ thi" |
| `cb-w3-2` | ConfigMap và Secret: các cách đưa cấu hình vào container | ch.10 §"Làm việc với ConfigMap" + §"Làm việc với Secret" + §"Trọng tâm cho kỳ thi" |
| `cb-w3-3` | Deployment: rolling update, rollback và thay thế replica | ch.11 §"Làm việc với Deployment" + §"Thay thế replica" + §"Thực hiện rolling update và rollback" + §"Trọng tâm cho kỳ thi" |
| `cb-w3-4` | Scale thủ công và autoscaling | ch.12 §"Scale workload thủ công" + §"Autoscaling workload" + §"Trọng tâm cho kỳ thi" |

- [ ] **Step 6: Đếm mục để nghiệm thu**

```bash
node -e "import('./webapp/js/data/ckabook-roadmap.js').then(m=>{
  const w=m.ckabookWeeks;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 3 | mục: 12` và `cb-w1:4 cb-w2:4 cb-w3:4`.

- [ ] **Step 7: Kiểm anchor và tiền tố id**

```bash
node -e "
import('./webapp/js/data/ckabook-roadmap.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const byId=new Map(docs.map(d=>[d.id,d]));
  const bad=[];
  const scan=(o,s)=>{ for(const x of String(s).matchAll(/#\/docs\/([\w-]+)/g)){
    const d=byId.get(x[1]);
    if(!d) bad.push(o+' → '+x[1]+' (không tồn tại)');
    else if((d.field??'kubernetes')!=='kubernetes') bad.push(o+' → '+x[1]+' (lĩnh vực '+d.field+')');
  }};
  for(const w of m.ckabookWeeks){
    if(!w.id.startsWith('cb-w')) bad.push('tuần sai tiền tố: '+w.id);
    for(const r of w.resources??[]) scan(w.id, r.href);
    for(const it of w.items){
      if(!it.id.startsWith(w.id+'-')) bad.push('mục '+it.id+' không thuộc '+w.id);
      scan(it.id, it.lesson);
    }
  }
  console.log(bad.length? 'HỎNG: '+bad.join(', ') : 'OK — anchor hợp lệ, tiền tố đúng');
})"
```

Kỳ vọng: `OK — anchor hợp lệ, tiền tố đúng`.

- [ ] **Step 8: Kiểm độ dài và cấu trúc 4 khối**

```bash
node -e "import('./webapp/js/data/ckabook-roadmap.js').then(m=>{
  for(const w of m.ckabookWeeks) for(const it of w.items){
    const n=it.lesson.trim().split(/\s+/).length;
    const ok=['**Mục tiêu.**','**Đọc.**','**Bẫy.**','**Tự kiểm tra.**'].every(k=>it.lesson.includes(k));
    if(n<250||n>400||!ok) console.log(it.id, n+' từ', ok?'':'THIẾU KHỐI');
  }
  console.log('xong');
})"
```

Kỳ vọng: chỉ in `xong`. Mọi dòng khác là một mục phải viết lại.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/ckabook-roadmap.js
git commit -m "feat: lộ trình nước rút CKA Study Guide tuần 1-3 — 12 mục"
```

Track chưa được đăng ký vào `roadmap.js` nên `check-data.mjs` chưa nhìn thấy tệp này — đó là chủ ý: đăng ký ở Task 7, sau khi đủ 24 mục, để bảng kỳ vọng không đỏ liên tục qua hai task.

---

## Task 7: Track `ckabook` tuần 4–6, đăng ký track, chốt bảng kỳ vọng

**Files:**
- Modify: `webapp/js/data/ckabook-roadmap.js` (thêm 3 khối tuần)
- Modify: `webapp/js/data/roadmap.js` (import + phần tử track mới + chú thích đầu tệp)
- Modify: `webapp/check-data.mjs:30` (`"roadmap-items:kubernetes": 184` → `208`)

**Interfaces:**
- Consumes: `ckabookWeeks` từ Task 6; doc id `ckabook-13`…`ckabook-22`, `ckabook-A`.
- Produces: track id `ckabook` trong mảng `tracks`. Task 8 đếm lại số liệu README từ đây.

- [ ] **Step 1: Viết tuần 4 — `cb-w4`, 4 mục (ch.13–16)**

`week`: `"Tuần 4"` · `title`: `"Tài nguyên, lập lịch và lưu trữ"`

`goal`: Đặt được Pod lên đúng node bằng ba cơ chế khác nhau, và nối được một PVC vào Pod từ con số không.

`practice`: Làm **Bài tập mẫu** cuối chương 13–16, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bài chương 14 làm trên cluster nhiều node — chương có hướng dẫn dựng sẵn ở §"Thiết lập cluster phát triển nhiều node".

`resources`: `#/docs/ckabook-13` … `#/docs/ckabook-16`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w4-1` | requests/limits, ResourceQuota và LimitRange | ch.13 §"Làm việc với yêu cầu tài nguyên" + §"Làm việc với ResourceQuota" + §"Làm việc với LimitRange" |
| `cb-w4-2` | Thuật toán lập lịch và node affinity | ch.14 §"Thuật toán lập lịch Pod" + §"Các tùy chọn lập lịch Pod" + §"Làm việc với node affinity và anti-affinity" |
| `cb-w4-3` | Taint, toleration và ràng buộc phân bố topology | ch.14 §"Làm việc với taint và toleration" + §"Làm việc với ràng buộc phân bố topology của Pod" + §"Trọng tâm cho kỳ thi" |
| `cb-w4-4` | Volume, PersistentVolume, PVC và StorageClass | ch.15 §"Các loại Volume" + §"Tạo và truy cập Volume" · ch.16 §"Cung cấp tĩnh và cung cấp động" + §"Tạo PersistentVolume" + §"Tạo PersistentVolumeClaim" + §"Mount PersistentVolumeClaim trong Pod" + §"Storage Class" |

- [ ] **Step 2: Viết tuần 5 — `cb-w5`, 4 mục (ch.17–20)**

`week`: `"Tuần 5"` · `title`: `"Service, Ingress, Gateway API và NetworkPolicy"`

`goal`: Chọn đúng loại Service cho một yêu cầu mô tả bằng lời, và viết được NetworkPolicy chặn đúng chiều cần chặn.

`practice`: Làm **Bài tập mẫu** cuối chương 17–20, đối chiếu [Phụ lục A](#/docs/ckabook-A). Sau khi xong bài chương 20, thử xoá policy và kiểm lại bằng Pod tạm — thấy tận mắt cluster mặc định cho mọi Pod nói chuyện với nhau.

`resources`: `#/docs/ckabook-17` … `#/docs/ckabook-20`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`, và `{ label: "kubernetes.io — Network Policies", href: "https://kubernetes.io/docs/concepts/services-networking/network-policies/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w5-1` | Service: ClusterIP, NodePort và LoadBalancer | ch.17 §"Làm việc với Service" + §"Loại Service ClusterIP" + §"Loại Service NodePort" + §"Loại Service LoadBalancer" + §"Trọng tâm cho kỳ thi" |
| `cb-w5-2` | Ingress và luật định tuyến theo host/path | ch.18 §"Làm việc với Ingress" + §"Trọng tâm cho kỳ thi" |
| `cb-w5-3` | Gateway API và đường chuyển từ Ingress | ch.19 §"Tại sao primitive Ingress chưa đủ?" + §"Làm việc với Gateway API" + §"Chuyển đổi từ Ingress sang Gateway API" |
| `cb-w5-4` | NetworkPolicy: mặc định mở, đóng bằng tay | ch.20 §"Làm việc với Network Policy" + §"Trọng tâm cho kỳ thi" |

- [ ] **Step 3: Viết tuần 6 — `cb-w6`, 4 mục (ch.21–22 + Phụ lục A)**

`week`: `"Tuần 6"` · `title`: `"Xử lý sự cố (30% đề thi) và tổng duyệt"`

`goal`: Đi từ triệu chứng tới nguyên nhân theo một trình tự cố định, không đoán mò — và đóng được mọi khoảng trống còn lại trước ngày thi.

`practice`: Làm lại **toàn bộ Bài tập mẫu** của 19 chương có bài (ch.4–22), bấm giờ, rồi đối chiếu [Phụ lục A](#/docs/ckabook-A). Ghi lại chương nào còn phải mở sách — đó chính là danh sách ôn của ngày cuối.

`resources`: `#/docs/ckabook-21`, `#/docs/ckabook-22`, `#/docs/ckabook-A`, chip `{ label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" }`, và `{ label: "kubernetes.io — Troubleshooting Clusters", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `cb-w6-1` | Xử lý sự cố Pod và container | ch.21 §"Xử lý sự cố Pod" + §"Xử lý sự cố container" |
| `cb-w6-2` | Xử lý sự cố Service/mạng và đọc số liệu tài nguyên | ch.21 §"Xử lý sự cố Service và mạng" + §"Kiểm tra số liệu tài nguyên" + §"Trọng tâm cho kỳ thi" |
| `cb-w6-3` | Xử lý sự cố node và thành phần control plane | ch.22 §"Kiểm tra trạng thái của các node trong cluster" + §"Kiểm tra trạng thái của các thành phần trong cluster" + §"Xử lý sự cố node" + §"Trọng tâm cho kỳ thi" |
| `cb-w6-4` | Tổng duyệt: chạy lại bài tập 19 chương và đối chiếu đáp án | Phụ lục A (`#/docs/ckabook-A`) — dùng để **đối chiếu sau khi tự làm**, không đọc trước |

- [ ] **Step 4: Đăng ký track vào `roadmap.js`**

Thêm import cạnh các import track khác:

```js
import { ckabookWeeks } from "./ckabook-roadmap.js";
```

Thêm phần tử vào mảng `tracks`, **ngay sau** track `k8sbook` — giữ trật tự "ba track chứng chỉ trước, các track đọc sách của cùng lĩnh vực sau":

```js
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
```

**Không** bọc `withBookRefs()` quanh `ckabookWeeks` — hàm đó chỉ dành cho ba track chứng chỉ; track sách tự viết `resources` của mình.

Cập nhật bảng chú thích đầu `roadmap.js`, thêm một dòng vào danh sách track:

```
//   CKAB: ckabook-roadmap.js         (Tuần 1–6)              — 24 mục
```

- [ ] **Step 5: Chốt bảng kỳ vọng**

`webapp/check-data.mjs` dòng 30:

```js
    // 184 gốc + 24 mục nước rút CKA Study Guide.
    "roadmap-items:kubernetes": 208,
```

- [ ] **Step 6: Nghiệm thu**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` với `docs:kubernetes` 47 và `roadmap-items:kubernetes` 208.

- [ ] **Step 7: Đếm toàn track và xác nhận không lẫn tiền tố**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  const t=m.tracks.find(x=>x.id==='ckabook');
  const items=t.weeks.flatMap(w=>w.items);
  console.log('tuần:', t.weeks.length, '| mục:', items.length);
  console.log('mục sai tiền tố cb-w:', items.filter(i=>!i.id.startsWith('cb-w')).length);
  console.log('track lĩnh vực kubernetes:', m.tracks.filter(x=>(x.field??'kubernetes')==='kubernetes').length);
})"
```

Kỳ vọng chính xác: `tuần: 6 | mục: 24`, `mục sai tiền tố cb-w: 0`, `track lĩnh vực kubernetes: 5`.

- [ ] **Step 8: Nghiệm thu bằng mắt**

```bash
./webapp/dev.sh
```

Mở `#/roadmap` ở lĩnh vực Kubernetes: phải thấy **5 track**. Mở `#/roadmap/ckabook`, tick thử một mục, tải lại trang — tick phải còn. Mở `#/roadmap/cka` tuần 6: phải thấy 6 chip sách.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/ckabook-roadmap.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: lộ trình nước rút CKA Study Guide tuần 4-6 và đăng ký track — đủ 6 tuần / 24 mục"
```

---

## Task 8: Cập nhật số liệu chặng 1

**Files:**
- Modify: `README.md:99` (dòng bảng `webapp/`), `README.md` đoạn giới thiệu DevPrep, và thêm một dòng nguồn
- Modify: `webapp/js/data/fields.js:11` (`desc` của lĩnh vực `kubernetes`)
- Modify: `webapp/js/views/roadmap.js` (chú thích đầu tệp)

**Interfaces:**
- Consumes: số liệu thật đếm được ở Step 1.
- Produces: README phản ánh đúng trạng thái sau chặng 1. Task 13 cập nhật lần cuối sau chặng 2.

- [ ] **Step 1: Đếm số liệu thật, không chép từ kế hoạch**

```bash
node -e "Promise.all([
  import('./webapp/js/data/docs-index.js'), import('./webapp/js/data/roadmap.js')
]).then(([d,r])=>{
  console.log('tài liệu:', d.docs.length);
  console.log('giáo trình:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length);
})"
```

Kỳ vọng sau chặng 1: `tài liệu: 173`, `giáo trình: 16`, `mục lộ trình: 768`.

Nếu ba số này khác kỳ vọng, **dừng lại** — có task trước chưa xong đúng, đừng viết con số sai vào README.

- [ ] **Step 2: Cập nhật `README.md` dòng 99**

Sửa ba con số trong dòng bảng `webapp/`: `15 giáo trình, 744 mục` → `16 giáo trình, 768 mục`; `150 tài liệu` → `173 tài liệu`.

- [ ] **Step 3: Thêm dòng nguồn `cka-book-vi/` vào bảng thành phần README**

Chèn ngay sau dòng `k8s-ebook/`:

```markdown
| [`cka-book-vi/`](./cka-book-vi/) | Bản dịch tiếng Việt *Certified Kubernetes Administrator (CKA) Study Guide*, ấn bản 2 (Benjamin Muschko, O'Reilly) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 22 chương + 1 phụ lục đáp án, 50 hình. Đọc trong app ở lĩnh vực Kubernetes, kèm lộ trình nước rút ôn thi 6 tuần. |
```

Và thêm **CKA Study Guide** vào danh sách bản dịch ở đoạn văn mở đầu mục "DevPrep — nền tảng học đa lĩnh vực".

- [ ] **Step 4: Cập nhật `desc` lĩnh vực `kubernetes` trong `fields.js`**

```js
    desc: "Luyện thi CKAD, CKA, CKS: giáo trình theo tuần, tra cứu kubectl, flashcards, trắc nghiệm, thi thử và labs mô phỏng đề thật — kèm bản dịch Kubernetes in Action và CKA Study Guide để đọc sâu.",
```

- [ ] **Step 5: Cập nhật chú thích đầu `views/roadmap.js`**

`"nay là 15 track thuộc 9 lĩnh vực"` → `"nay là 16 track thuộc 9 lĩnh vực"`, và thêm *CKA Study Guide* vào danh sách track Kubernetes trong cùng đoạn chú thích.

Số **9 lĩnh vực** giữ nguyên: lĩnh vực `java` không khai module `roadmap`, và đợt này không thêm lĩnh vực nào.

- [ ] **Step 6: Nghiệm thu**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.`

- [ ] **Step 7: Commit**

```bash
git add README.md webapp/js/data/fields.js webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm CKA Study Guide vào lĩnh vực Kubernetes"
```

---

# CHẶNG 2 — Kubernetes: Up and Running sống trong app

## Task 9: 23 tài liệu `kuar-*`

**Files:**
- Modify: `webapp/check-data.mjs:29` (`"docs:kubernetes": 47` → `70`)
- Modify: `webapp/js/data/docs-index.js` (thêm 23 bản ghi sau khối `ckabook-A`)

**Interfaces:**
- Consumes: markdown tại `webapp/content/kuar/` do Task 2 sinh ra.
- Produces: 23 doc id `kuar-01`…`kuar-22`, `kuar-A`. Task 10 dùng chúng làm giá trị crossref; Task 11–12 dùng làm đích anchor.

- [ ] **Step 1: Sửa bảng kỳ vọng trước**

```js
    // 24 gốc + 23 CKA Study Guide + 23 Kubernetes: Up and Running.
    "docs:kubernetes": 70,
```

- [ ] **Step 2: Chạy để thấy nó ĐỎ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: **THẤT BẠI** với `docs:kubernetes: kỳ vọng 70, thực tế 47`.

- [ ] **Step 3: Đọc mục lục thật của 23 chương**

```bash
cd kuar-vi && for f in [0-9]*.md A-*.md; do echo "### $f"; grep '^## ' "$f" | sed 's/^## /  /'; done; cd ..
```

`desc` viết từ danh sách này, 15–30 từ. Bỏ qua mục `Tóm tắt` và `Dọn dẹp` lặp ở nhiều chương.

- [ ] **Step 4: Thêm 23 bản ghi vào `docs-index.js`**

Chèn ngay sau bản ghi `ckabook-A`. Mọi bản ghi có `field: "kubernetes"` và `group: "Kubernetes: Up and Running (O'Reilly)"`.

Khuôn một bản ghi, đã điền đủ cho `kuar-05` làm mẫu:

```js
  {
    id: "kuar-05",
    field: "kubernetes",
    group: "Kubernetes: Up and Running (O'Reilly)",
    title: "KUAR 05 — Pod",
    file: "content/kuar/05-pods.md",
    icon: "🥚",
    desc: "Vì sao nhóm container thành Pod, viết Pod manifest, chạy và truy cập Pod, health check, quản lý tài nguyên và gắn volume.",
    tags: ["KUAR", "Pod", "Health check"],
  },
```

| `id` | `title` | `file` (dưới `content/kuar/`) | `icon` | `tags` |
|---|---|---|---|---|
| `kuar-01` | KUAR 01 — Giới thiệu | `01-introduction.md` | 🚀 | `["KUAR", "Cloud native"]` |
| `kuar-02` | KUAR 02 — Tạo và chạy Container | `02-creating-and-running-containers.md` | 🐳 | `["KUAR", "Container", "Docker"]` |
| `kuar-03` | KUAR 03 — Triển khai một Kubernetes Cluster | `03-deploying-a-kubernetes-cluster.md` | 🧰 | `["KUAR", "Cluster", "minikube"]` |
| `kuar-04` | KUAR 04 — Các lệnh kubectl thông dụng | `04-common-kubectl-commands.md` | 🖥️ | `["KUAR", "kubectl"]` |
| `kuar-05` | KUAR 05 — Pod | `05-pods.md` | 🥚 | `["KUAR", "Pod", "Health check"]` |
| `kuar-06` | KUAR 06 — Label và Annotation | `06-labels-and-annotations.md` | 🏷️ | `["KUAR", "Label", "Annotation"]` |
| `kuar-07` | KUAR 07 — Service Discovery | `07-service-discovery.md` | 📡 | `["KUAR", "Service", "DNS"]` |
| `kuar-08` | KUAR 08 — Cân bằng tải HTTP với Ingress | `08-http-load-balancing-with-ingress.md` | 🕸️ | `["KUAR", "Ingress", "Contour"]` |
| `kuar-09` | KUAR 09 — ReplicaSet | `09-replicasets.md` | 🧬 | `["KUAR", "ReplicaSet"]` |
| `kuar-10` | KUAR 10 — Deployment | `10-deployments.md` | 🎢 | `["KUAR", "Deployment", "Rollout"]` |
| `kuar-11` | KUAR 11 — DaemonSet | `11-daemonsets.md` | 👹 | `["KUAR", "DaemonSet"]` |
| `kuar-12` | KUAR 12 — Job | `12-jobs.md` | ⏱️ | `["KUAR", "Job", "CronJob"]` |
| `kuar-13` | KUAR 13 — ConfigMap và Secret | `13-configmaps-and-secrets.md` | 📋 | `["KUAR", "ConfigMap", "Secret"]` |
| `kuar-14` | KUAR 14 — Kiểm soát truy cập dựa trên vai trò (RBAC) | `14-role-based-access-control.md` | 👮 | `["KUAR", "RBAC"]` |
| `kuar-15` | KUAR 15 — Service Mesh | `15-service-meshes.md` | 🔗 | `["KUAR", "Service Mesh", "mTLS"]` |
| `kuar-16` | KUAR 16 — Tích hợp các giải pháp lưu trữ | `16-integrating-storage-solutions-and-kubernetes.md` | 💽 | `["KUAR", "Storage", "StatefulSet"]` |
| `kuar-17` | KUAR 17 — Mở rộng Kubernetes | `17-extending-kubernetes.md` | 🧩 | `["KUAR", "CRD", "Extensibility"]` |
| `kuar-18` | KUAR 18 — Truy cập Kubernetes từ ngôn ngữ lập trình | `18-accessing-kubernetes-from-common-programming-languages.md` | 💻 | `["KUAR", "Client library", "API"]` |
| `kuar-19` | KUAR 19 — Bảo mật ứng dụng trong Kubernetes | `19-securing-applications-in-kubernetes.md` | 🔐 | `["KUAR", "SecurityContext", "Pod Security"]` |
| `kuar-20` | KUAR 20 — Chính sách và quản trị cho Cluster | `20-policy-and-governance-for-kubernetes-clusters.md` | ⚖️ | `["KUAR", "Admission", "Gatekeeper"]` |
| `kuar-21` | KUAR 21 — Triển khai ứng dụng đa Cluster | `21-multicluster-application-deployments.md` | 🌍 | `["KUAR", "Multicluster"]` |
| `kuar-22` | KUAR 22 — Tổ chức ứng dụng của bạn | `22-organizing-your-application.md` | 🗄️ | `["KUAR", "GitOps", "Template"]` |
| `kuar-A` | KUAR A — Tự xây dựng Kubernetes Cluster | `A-building-your-own-kubernetes-cluster.md` | 🔧 | `["KUAR", "Phụ lục", "Bare metal"]` |

- [ ] **Step 5: Nghiệm thu — phải XANH**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.`

- [ ] **Step 6: Kiểm bốn nhóm hiện đủ và icon không trùng trong nhóm**

```bash
node -e "import('./webapp/js/data/docs-index.js').then(m=>{
  const k=m.docs.filter(d=>(d.field??'kubernetes')==='kubernetes');
  const g={}; for(const d of k) g[d.group??'(không nhóm)']=(g[d.group??'(không nhóm)']||0)+1;
  console.log('docs kubernetes:', k.length); console.log(g);
  for(const [name,] of Object.entries(g)){
    const ic=k.filter(d=>(d.group??'(không nhóm)')===name).map(d=>d.icon);
    const dup=ic.filter((x,i)=>ic.indexOf(x)!==i);
    if(dup.length) console.log('ICON TRÙNG trong', name, ':', dup.join(' '));
  }
})"
```

Kỳ vọng chính xác:

```
docs kubernetes: 70
{
  'Luyện thi & tra cứu (tự biên)': 7,
  'Kubernetes in Action (Lukša, Manning)': 17,
  "CKA Study Guide (Muschko, O'Reilly)": 23,
  "Kubernetes: Up and Running (O'Reilly)": 23
}
```

Không dòng `ICON TRÙNG`, không khoá `(không nhóm)`.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/check-data.mjs
git commit -m "feat: 23 tài liệu Kubernetes Up and Running trong lĩnh vực Kubernetes"
```

---

## Task 10: Nối chip KUAR vào bảng crossref

**Files:**
- Modify: `webapp/js/data/book-crossref.js`

**Interfaces:**
- Consumes: doc id `kuar-*` từ Task 9; `bookCrossref` từ Task 5.
- Produces: bảng crossref hoàn chỉnh cho ba cuốn.

- [ ] **Step 1: Nối `kuar-*` vào các mảng CÓ SẴN**

Sửa `webapp/js/data/book-crossref.js` thành đúng object sau. **Bảy khoá được nối thêm, ba khoá mới được tạo, không khoá nào bị nhân đôi:**

```js
export const bookCrossref = {
  // ----- CKAD -----
  "w1": ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10", "kuar-04"],
  "w2": ["k8sbook-05", "k8sbook-06", "kuar-05", "kuar-06"],
  "w3": ["k8sbook-13", "k8sbook-14", "k8sbook-17", "kuar-10", "kuar-12"],
  "w4": ["k8sbook-09", "kuar-13"],
  "w5": ["k8sbook-06"],
  "w6": ["k8sbook-11", "k8sbook-12", "kuar-07", "kuar-08"],
  "w7": ["k8sbook-07", "k8sbook-08", "k8sbook-15", "kuar-16"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04", "ckabook-02", "ckabook-03", "kuar-A"],
  "cka-w2": ["ckabook-04"],
  "cka-w3": ["ckabook-05"],
  "cka-w4": ["k8sbook-16", "ckabook-13", "ckabook-14"],
  "cka-w5": ["k8sbook-07", "k8sbook-08", "ckabook-15", "ckabook-16", "kuar-16"],
  "cka-w6": ["k8sbook-11", "k8sbook-12", "ckabook-17", "ckabook-18", "ckabook-19", "ckabook-20"],
  "cka-w7": ["ckabook-06", "ckabook-07", "ckabook-08"],
  "cka-w8": ["ckabook-21", "ckabook-22"],
  "cka-w9": ["ckabook-01", "ckabook-A"],

  // ----- CKS -----
  "cks-w2": ["kuar-14"],
  "cks-w4": ["k8sbook-09", "kuar-19"],
  "cks-w5": ["kuar-20"],
};
```

Ba tuần **không** nối KUAR và đó là chủ ý: `w5` của CKAD là Observability, `w8`/`w10` là luyện đề — KUAR không có chương tương ứng, nối vào chỉ để đủ mặt là làm loãng.

Track `ckad` dùng id `w1`…`w8` rồi **`w10`**, **không có `w9`**. Nếu gõ nhầm `w9`, N1 báo `tuần "w9" không tồn tại`.

- [ ] **Step 2: Kiểm không có khoá trùng trong tệp nguồn**

`bookCrossref` là object nên khoá trùng bị JavaScript nuốt im lặng. Kiểm ở mức **văn bản**, trước khi Node phân giải:

```bash
grep -oE '^\s*"[a-z0-9-]+":' webapp/js/data/book-crossref.js \
  | tr -d ' ":' | sort | uniq -d
```

Kỳ vọng: **không dòng nào**. Mỗi dòng in ra là một khoá bị viết hai lần — chip của cuốn viết trước đã biến mất.

- [ ] **Step 3: Nghiệm thu**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.`

- [ ] **Step 4: Đếm chip thực tế trên cả ba track chứng chỉ**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  let over=0;
  for(const id of ['ckad','cka','cks']){
    const t=m.tracks.find(x=>x.id===id);
    console.log('--',id);
    for(const w of t.weeks){
      const n=(w.resources??[]).filter(r=>String(r.href).startsWith('#/docs/')).length;
      if(n) console.log('  ',w.id,'→',n,'chip');
      if(n>6) over++;
    }
  }
  console.log('tuần vượt trần 6 chip:', over);
})"
```

Kỳ vọng: `tuần vượt trần 6 chip: 0`, và `cka-w6` đúng 6 chip.

- [ ] **Step 5: Commit**

```bash
git add webapp/js/data/book-crossref.js
git commit -m "feat: nối chip 11 chương Kubernetes Up and Running vào giáo trình CKAD/CKA/CKS"
```

---

## Task 11: Track `kuar` tuần 1–5 (20 mục)

**Files:**
- Create: `webapp/js/data/kuar-roadmap-part1.js`

**Interfaces:**
- Consumes: doc id `kuar-01`…`kuar-10`, `kuar-A`; track id `ckad` làm đích chip ôn lại.
- Produces: `export const kuarWeeksPart1`. Task 12 import cùng `kuarWeeksPart2` vào `roadmap.js`.

- [ ] **Step 1: Đọc 11 tệp nguồn của tuần 1–5**

`kuar-vi/01-introduction.md` … `10-deployments.md`, cộng `A-building-your-own-kubernetes-cluster.md`.

- [ ] **Step 2: Tạo tệp với header**

```js
// Lộ trình đọc Kubernetes: Up and Running (ấn bản 3) — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes: Up and Running", ấn bản 3 — Brendan
// Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson (O'Reilly).
// Thư mục nguồn: kuar-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ku-w<N> / ku-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là ku-, KHÔNG phải kb- (đã thuộc track Kubernetes in Action).
//
// Tuần 2 đọc Phụ lục NGAY SAU chương 3 chứ không để cuối sách: cùng chủ đề
// dựng cluster, và đọc nó ở tuần 9 thì đã muộn để dùng.

export const kuarWeeksPart1 = [
  // … 5 khối tuần ở Step 3–7 …
];
```

- [ ] **Step 3: Viết tuần 1 — `ku-w1`, 4 mục (ch.1–2)**

`week`: `"Tuần 1"` · `title`: `"Vì sao Kubernetes, và container đến từ đâu"`

`goal`: Nói được bốn lợi ích mà sách dùng để biện minh cho Kubernetes, và tự đóng gói được một ứng dụng thành image chạy được.

`practice`: Viết Dockerfile cho ứng dụng `kuard` theo §"Xây dựng Application Image với Docker", đẩy lên một registry công khai, rồi `docker run` lại từ registry đó trên máy sạch (hoặc sau khi `docker image rm`).

`resources`: `#/docs/kuar-01`, `#/docs/kuar-02`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`, và `{ label: "docs.docker.com — Get started", href: "https://docs.docker.com/get-started/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w1-1` | Tốc độ, tính bất biến và cấu hình khai báo | ch.1 §"Tốc độ (Velocity)" |
| `ku-w1-2` | Mở rộng đội ngũ, trừu tượng hoá hạ tầng, hiệu quả | ch.1 §"Mở rộng dịch vụ và đội ngũ của bạn" + §"Trừu tượng hóa hạ tầng" + §"Hiệu quả" + §"Hệ sinh thái cloud native" |
| `ku-w1-3` | Container image và cách Docker dựng nó theo lớp | ch.2 §"Container Image" + §"Xây dựng Application Image với Docker" |
| `ku-w1-4` | Registry và Container Runtime Interface | ch.2 §"Lưu trữ Image trong Registry từ xa" + §"Container Runtime Interface" + §"Dọn dẹp" |

- [ ] **Step 4: Viết tuần 2 — `ku-w2`, 4 mục (ch.3 + Phụ lục + ch.4)**

`week`: `"Tuần 2"` · `title`: `"Dựng cluster và sống trong kubectl"`

`goal`: Có một cluster chạy được trên máy mình, và gọi tên được từng thành phần của nó khi `kubectl get` trả về.

`practice`: Dựng cluster bằng `kind` **và** `minikube`, rồi chạy `kubectl get componentstatuses` cùng `kubectl get pods -n kube-system` trên cả hai; ghi lại khác biệt về danh sách thành phần.

`resources`: `#/docs/kuar-03`, `#/docs/kuar-A`, `#/docs/kuar-04`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`, và `{ label: "kubernetes.io — kubectl Cheat Sheet", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w2-1` | Ba đường dựng cluster: cloud, minikube, Docker | ch.3 §"Cài đặt Kubernetes trên nhà cung cấp Public Cloud" + §"Cài đặt Kubernetes cục bộ bằng minikube" + §"Chạy Kubernetes trong Docker" + §"Kubernetes Client" |
| `ku-w2-2` | Các thành phần chạy bên trong một cluster | ch.3 §"Các thành phần của Cluster" |
| `ku-w2-3` | Tự dựng cluster trên phần cứng thật | Phụ lục §"Danh sách linh kiện" → §"Thiết lập mạng Cluster" (đọc hết) |
| `ku-w2-4` | `kubectl`: namespace, context, CRUD đối tượng và lệnh gỡ lỗi | ch.4 §"Namespace" + §"Context" + §"Xem các đối tượng Kubernetes API" + §"Tạo, cập nhật và hủy các đối tượng Kubernetes" + §"Gắn Label và Annotation cho đối tượng" + §"Các lệnh gỡ lỗi" |

- [ ] **Step 5: Viết tuần 3 — `ku-w3`, 4 mục (ch.5–6)**

`week`: `"Tuần 3"` · `title`: `"Pod và cách gắn nhãn cho mọi thứ"`

`goal`: Quyết định được hai container nên ở chung Pod hay tách Pod, và giải thích được vì sao.

`practice`: Chạy Pod `kuard` theo §"Chạy Pod", thêm liveness và readiness probe theo §"Kiểm tra sức khỏe", rồi cố ý làm probe thất bại và quan sát khác biệt giữa hai loại probe.

`resources`: `#/docs/kuar-05`, `#/docs/kuar-06`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w3-1` | Pod là gì, và khi nào KHÔNG nên gộp container | ch.5 §"Pod trong Kubernetes" + §"Tư duy với Pod" + §"Pod Manifest" + §"Chạy Pod" |
| `ku-w3-2` | Truy cập Pod và hai loại health check | ch.5 §"Truy cập Pod của bạn" + §"Kiểm tra sức khỏe (Health Check)" |
| `ku-w3-3` | requests/limits và volume trong Pod | ch.5 §"Quản lý tài nguyên" + §"Lưu trữ dữ liệu bền vững với Volume" + §"Kết hợp tất cả lại" |
| `ku-w3-4` | Label và annotation — khác nhau ở mục đích, không ở cú pháp | ch.6 §"Label" + §"Annotation" + §"Dọn dẹp" |

- [ ] **Step 6: Viết tuần 4 — `ku-w4`, 4 mục (ch.7–8)**

`week`: `"Tuần 4"` · `title`: `"Service discovery và Ingress"`

`goal`: Đưa được một ứng dụng ra ngoài cluster bằng đúng cơ chế phù hợp, và nói được vì sao không chọn hai cơ chế kia.

`practice`: Cài Contour theo §"Cài đặt Contour", tạo hai Ingress trỏ hai host khác nhau về hai Service, rồi kiểm bằng `curl -H "Host: ..."`.

`resources`: `#/docs/kuar-07`, `#/docs/kuar-08`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`, và `{ label: "kubernetes.io — Ingress", href: "https://kubernetes.io/docs/concepts/services-networking/ingress/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w4-1` | Service discovery và đối tượng Service | ch.7 §"Service Discovery là gì?" + §"Đối tượng Service" |
| `ku-w4-2` | Ra ngoài cluster: NodePort, LoadBalancer và chi tiết bên trong | ch.7 §"Nhìn ra ngoài Cluster" + §"Tích hợp Load Balancer" + §"Chi tiết nâng cao" + §"Kết nối với các môi trường khác" |
| `ku-w4-3` | Ingress và Ingress Controller là hai thứ khác nhau | ch.8 §"Đặc tả Ingress so với Ingress Controller" + §"Cài đặt Contour" + §"Sử dụng Ingress" |
| `ku-w4-4` | Giới hạn của Ingress và những gì đến sau nó | ch.8 §"Các chủ đề nâng cao về Ingress và những điều cần lưu ý" + §"Các hiện thực Ingress thay thế" + §"Tương lai của Ingress" |

- [ ] **Step 7: Viết tuần 5 — `ku-w5`, 4 mục (ch.9–10)**

`week`: `"Tuần 5"` · `title`: `"ReplicaSet và Deployment"`

`goal`: Giải thích được vòng lặp đồng bộ bằng lời của mình, và chọn được chiến lược rollout phù hợp với một ràng buộc cho trước.

`practice`: Tạo Deployment, đổi image để kích hoạt rollout, rồi `kubectl rollout pause` giữa chừng và quan sát số Pod của **hai** ReplicaSet cùng lúc. Sau đó `resume` và `undo`.

`resources`: `#/docs/kuar-09`, `#/docs/kuar-10`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w5-1` | Vòng lặp đồng bộ và quan hệ Pod ↔ ReplicaSet | ch.9 §"Vòng lặp đồng bộ (Reconciliation Loop)" + §"Liên hệ giữa Pod và ReplicaSet" + §"Thiết kế với ReplicaSet" |
| `ku-w5-2` | Tạo, kiểm tra, mở rộng và xoá ReplicaSet | ch.9 §"Đặc tả ReplicaSet" + §"Tạo ReplicaSet" + §"Kiểm tra ReplicaSet" + §"Mở rộng ReplicaSet" + §"Xóa ReplicaSet" |
| `ku-w5-3` | Deployment điều khiển ReplicaSet như thế nào | ch.10 §"Deployment đầu tiên của bạn" + §"Tạo Deployment" + §"Quản lý Deployment" + §"Cập nhật Deployment" |
| `ku-w5-4` | Chiến lược rollout, xoá và giám sát | ch.10 §"Chiến lược Deployment" + §"Xóa Deployment" + §"Giám sát Deployment" |

- [ ] **Step 8: Đếm mục**

```bash
node -e "import('./webapp/js/data/kuar-roadmap-part1.js').then(m=>{
  const w=m.kuarWeeksPart1;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
```

Kỳ vọng chính xác: `tuần: 5 | mục: 20` và `ku-w1:4 ku-w2:4 ku-w3:4 ku-w4:4 ku-w5:4`.

- [ ] **Step 9: Kiểm anchor, tiền tố, độ dài và cấu trúc 4 khối**

```bash
node -e "
import('./webapp/js/data/kuar-roadmap-part1.js').then(async m=>{
  const {docs}=await import('./webapp/js/data/docs-index.js');
  const byId=new Map(docs.map(d=>[d.id,d]));
  const bad=[];
  const scan=(o,s)=>{ for(const x of String(s).matchAll(/#\/docs\/([\w-]+)/g)){
    const d=byId.get(x[1]);
    if(!d) bad.push(o+' → '+x[1]+' (không tồn tại)');
    else if((d.field??'kubernetes')!=='kubernetes') bad.push(o+' → '+x[1]+' (lĩnh vực '+d.field+')');
  }};
  for(const w of m.kuarWeeksPart1){
    if(!w.id.startsWith('ku-w')) bad.push('tuần sai tiền tố: '+w.id);
    for(const r of w.resources??[]) scan(w.id, r.href);
    for(const it of w.items){
      if(!it.id.startsWith(w.id+'-')) bad.push('mục '+it.id+' không thuộc '+w.id);
      scan(it.id, it.lesson);
      const n=it.lesson.trim().split(/\s+/).length;
      const ok=['**Mục tiêu.**','**Đọc.**','**Bẫy.**','**Tự kiểm tra.**'].every(k=>it.lesson.includes(k));
      if(n<250||n>400) bad.push(it.id+' dài '+n+' từ');
      if(!ok) bad.push(it.id+' thiếu khối');
    }
  }
  console.log(bad.length? 'HỎNG:\n  '+bad.join('\n  ') : 'OK — 20 mục hợp lệ');
})"
```

Kỳ vọng: `OK — 20 mục hợp lệ`.

- [ ] **Step 10: Commit**

```bash
git add webapp/js/data/kuar-roadmap-part1.js
git commit -m "feat: lộ trình đọc Kubernetes Up and Running tuần 1-5 — 20 mục"
```

---

## Task 12: Track `kuar` tuần 6–9, đăng ký track, chốt bảng kỳ vọng

**Files:**
- Create: `webapp/js/data/kuar-roadmap-part2.js`
- Modify: `webapp/js/data/roadmap.js` (import + phần tử track + chú thích)
- Modify: `webapp/check-data.mjs:30` (`208` → `244`)

**Interfaces:**
- Consumes: `kuarWeeksPart1` từ Task 11; doc id `kuar-11`…`kuar-22`.
- Produces: `export const kuarWeeksPart2` và track id `kuar`. Task 13 đếm số liệu README từ đây.

- [ ] **Step 1: Tạo tệp phần 2 với header**

```js
// Lộ trình đọc Kubernetes: Up and Running (ấn bản 3) — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes: Up and Running", ấn bản 3 — Brendan
// Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson (O'Reilly).
// Thư mục nguồn: kuar-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Bốn tuần cuối nặng hơn mặt bằng (12–16k từ/tuần) vì các chương cuối là chủ
// đề nâng cao/tuỳ chọn — giữ nhịp 4 mục/tuần, không tách thành 10 tuần.
// GIỮ NGUYÊN id (ku-w<N> / ku-w<N>-<M>).

export const kuarWeeksPart2 = [
  // … 4 khối tuần ở Step 2–5 …
];
```

- [ ] **Step 2: Viết tuần 6 — `ku-w6`, 4 mục (ch.11–13)**

`week`: `"Tuần 6"` · `title`: `"DaemonSet, Job và cấu hình"`

`goal`: Chọn đúng controller cho một mô tả công việc, và đưa cấu hình vào ứng dụng mà không nướng cứng nó vào image.

`practice`: Chạy một DaemonSet giới hạn theo nodeSelector, một CronJob mỗi phút, rồi nạp cùng một tệp cấu hình vào Pod theo cả hai cách của chương 13 (biến môi trường và volume) và so sánh điều gì xảy ra khi ConfigMap đổi.

`resources`: `#/docs/kuar-11`, `#/docs/kuar-12`, `#/docs/kuar-13`, chip `{ label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w6-1` | DaemonSet: một Pod trên mỗi node | ch.11 §"DaemonSet Scheduler" + §"Tạo DaemonSet" + §"Giới hạn DaemonSet cho các Node cụ thể" + §"Cập nhật DaemonSet" + §"Xóa DaemonSet" |
| `ku-w6-2` | Job và các mẫu song song | ch.12 §"Đối tượng Job" + §"Các mẫu Job" |
| `ku-w6-3` | CronJob | ch.12 §"CronJob" |
| `ku-w6-4` | ConfigMap, Secret và cách quản lý chúng | ch.13 §"ConfigMap" + §"Secret" + §"Ràng buộc đặt tên" + §"Quản lý ConfigMap và Secret" |

- [ ] **Step 3: Viết tuần 7 — `ku-w7`, 4 mục (ch.14–16)**

`week`: `"Tuần 7"` · `title`: `"RBAC, service mesh và lưu trữ"`

`goal`: Cấp đúng quyền tối thiểu cho một service account, và biết khi nào service mesh là câu trả lời sai.

`practice`: Tạo một ServiceAccount với Role chỉ đọc Pod trong một namespace, rồi dùng `kubectl auth can-i --as=system:serviceaccount:...` để kiểm cả trường hợp được phép lẫn bị từ chối.

`resources`: `#/docs/kuar-14`, `#/docs/kuar-15`, `#/docs/kuar-16`, chip `{ label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w7-1` | Role, RoleBinding, ClusterRole và chủ thể | ch.14 §"Kiểm soát truy cập dựa trên vai trò" |
| `ku-w7-2` | Quản lý RBAC trong thực tế | ch.14 §"Các kỹ thuật quản lý RBAC" + §"Các chủ đề nâng cao" |
| `ku-w7-3` | Service mesh: mTLS, traffic shaping — và câu hỏi có cần không | ch.15 §"Mã hóa và xác thực với Mutual TLS" + §"Điều chỉnh lưu lượng (Traffic Shaping)" + §"Khả năng quan sát nội tại (Introspection)" + §"Bạn thực sự cần Service Mesh không?" |
| `ku-w7-4` | Nối lưu trữ vào cluster: service ngoài, singleton, StatefulSet | ch.16 §"Nhập các Service bên ngoài" + §"Chạy các Singleton đáng tin cậy" + §"Lưu trữ gốc Kubernetes với StatefulSet" |

- [ ] **Step 4: Viết tuần 8 — `ku-w8`, 4 mục (ch.17–19)**

`week`: `"Tuần 8"` · `title`: `"Mở rộng Kubernetes và bảo mật ứng dụng"`

`goal`: Chỉ ra được điểm mở rộng phù hợp cho một yêu cầu, và siết một Pod đang chạy quyền root xuống mức tối thiểu.

`practice`: Khai một CRD đơn giản theo chương 17 và tạo một đối tượng của nó. Rồi lấy một Pod bất kỳ, thêm `securityContext` theo chương 19 để nó chạy non-root, read-only rootfs, và bỏ hết capability — sửa cho tới khi Pod vẫn chạy được.

`resources`: `#/docs/kuar-17`, `#/docs/kuar-18`, `#/docs/kuar-19`, chip `{ label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w8-1` | Mở rộng Kubernetes nghĩa là gì và có những điểm nào | ch.17 §"Mở rộng Kubernetes có nghĩa là gì" + §"Các điểm mở rộng" |
| `ku-w8-2` | Các mẫu dùng Custom Resource | ch.17 §"Các mẫu cho Custom Resource" + §"Bắt đầu" |
| `ku-w8-3` | Gọi Kubernetes API từ code ứng dụng | ch.18 §"Kubernetes API: Góc nhìn của Client" + §"Lập trình với Kubernetes API" |
| `ku-w8-4` | SecurityContext, Pod Security và các lớp phòng thủ khác | ch.19 §"Hiểu về SecurityContext" + §"Pod Security" + §"Quản lý Service Account" + §"RuntimeClass" + §"Network Policy" + §"Bảo mật Image" |

- [ ] **Step 5: Viết tuần 9 — `ku-w9`, 4 mục (ch.20–22)**

`week`: `"Tuần 9"` · `title`: `"Chính sách, đa cluster và tổ chức ứng dụng"`

`goal`: Đặt được một ràng buộc chính sách chặn cấu hình sai ngay khi nộp, và bố trí được repo cho nhiều môi trường mà không sao chép YAML.

`practice`: Cài Gatekeeper theo chương 20, viết một constraint bắt mọi Pod phải có label `app`, rồi thử nộp một Pod thiếu label và đọc thông điệp từ chối. Sau đó tổ chức lại manifest của bài tập tuần 6 theo cấu trúc thư mục chương 22.

`resources`: `#/docs/kuar-20`, `#/docs/kuar-21`, `#/docs/kuar-22`, chip `{ label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" }`, và `{ label: "open-policy-agent.github.io — Gatekeeper", href: "https://open-policy-agent.github.io/gatekeeper/website/docs/" }`.

| id | `text` | Mục sách phải đọc |
|---|---|---|
| `ku-w9-1` | Luồng admission và vì sao cần chính sách | ch.20 §"Tại sao chính sách và quản trị quan trọng" + §"Luồng Admission" |
| `ku-w9-2` | Gatekeeper: constraint template và constraint | ch.20 §"Chính sách và quản trị với Gatekeeper" |
| `ku-w9-3` | Triển khai ứng dụng trên nhiều cluster | ch.21 §"Trước khi bạn bắt đầu" + §"Bắt đầu từ trên cùng với cách tiếp cận cân bằng tải" + §"Xây dựng ứng dụng cho nhiều Cluster" |
| `ku-w9-4` | Tổ chức repo và tham số hoá bằng template | ch.22 §"Các nguyên tắc dẫn đường" + §"Quản lý ứng dụng trong hệ thống quản lý mã nguồn" + §"Cấu trúc ứng dụng cho phát triển, kiểm thử và triển khai" + §"Tham số hóa ứng dụng với Template" + §"Triển khai ứng dụng của bạn khắp thế giới" |

- [ ] **Step 6: Đăng ký track vào `roadmap.js`**

Thêm import:

```js
import { kuarWeeksPart1 } from "./kuar-roadmap-part1.js";
import { kuarWeeksPart2 } from "./kuar-roadmap-part2.js";
```

Thêm phần tử vào mảng `tracks`, ngay sau track `ckabook`:

```js
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
```

**Không** bọc `withBookRefs()`.

Thêm dòng vào bảng chú thích đầu tệp:

```
//   KUAR: kuar-roadmap-part{1,2}.js  (Tuần 1–5 / 6–9)        — 36 mục
```

- [ ] **Step 7: Chốt bảng kỳ vọng**

```js
    // 184 gốc + 24 nước rút CKA Study Guide + 36 đọc Kubernetes: Up and Running.
    "roadmap-items:kubernetes": 244,
```

- [ ] **Step 8: Nghiệm thu**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` với `docs:kubernetes` 70 và `roadmap-items:kubernetes` 244.

- [ ] **Step 9: Đếm toàn track và kiểm tiền tố**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  const t=m.tracks.find(x=>x.id==='kuar');
  const items=t.weeks.flatMap(w=>w.items);
  console.log('tuần:', t.weeks.length, '| mục:', items.length);
  console.log('mục sai tiền tố ku-w:', items.filter(i=>!i.id.startsWith('ku-w')).length);
  const k=m.tracks.filter(x=>(x.field??'kubernetes')==='kubernetes');
  console.log('track lĩnh vực kubernetes:', k.length, '|', k.map(x=>x.id).join(' '));
  console.log('tổng mục lĩnh vực:', k.flatMap(x=>x.weeks).flatMap(w=>w.items).length);
})"
```

Kỳ vọng chính xác:

```
tuần: 9 | mục: 36
mục sai tiền tố ku-w: 0
track lĩnh vực kubernetes: 6 | ckad cka cks k8sbook ckabook kuar
tổng mục lĩnh vực: 244
```

- [ ] **Step 10: Kiểm độ dài và cấu trúc 4 khối cho cả 36 mục**

```bash
node -e "import('./webapp/js/data/roadmap.js').then(m=>{
  const t=m.tracks.find(x=>x.id==='kuar');
  let bad=0;
  for(const w of t.weeks) for(const it of w.items){
    const n=it.lesson.trim().split(/\s+/).length;
    const ok=['**Mục tiêu.**','**Đọc.**','**Bẫy.**','**Tự kiểm tra.**'].every(k=>it.lesson.includes(k));
    if(n<250||n>400||!ok){ console.log(it.id, n+' từ', ok?'':'THIẾU KHỐI'); bad++; }
  }
  console.log(bad? bad+' mục phải viết lại' : 'OK — 36 mục đạt');
})"
```

Kỳ vọng: `OK — 36 mục đạt`.

- [ ] **Step 11: Commit**

```bash
git add webapp/js/data/kuar-roadmap-part2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: lộ trình đọc Kubernetes Up and Running tuần 6-9 và đăng ký track — đủ 9 tuần / 36 mục"
```

---

## Task 13: Chốt số liệu và nghiệm thu toàn hệ

**Files:**
- Modify: `README.md` (dòng bảng `webapp/`, đoạn giới thiệu, thêm dòng nguồn `kuar-vi/`)
- Modify: `webapp/js/data/fields.js:11` (`desc` lĩnh vực `kubernetes`)
- Modify: `webapp/js/views/roadmap.js` (chú thích đầu tệp)

**Interfaces:**
- Consumes: số liệu thật đếm ở Step 1.
- Produces: repo ở trạng thái hoàn tất, không còn task nào.

- [ ] **Step 1: Đếm số liệu thật**

```bash
node -e "Promise.all([
  import('./webapp/js/data/docs-index.js'), import('./webapp/js/data/roadmap.js')
]).then(([d,r])=>{
  console.log('tài liệu:', d.docs.length);
  console.log('giáo trình:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length);
})"
```

Kỳ vọng chính xác: `tài liệu: 196`, `giáo trình: 17`, `mục lộ trình: 804`.

Nếu lệch, **dừng và tìm nguyên nhân** — đừng viết con số đếm được nếu nó khác kỳ vọng, và cũng đừng viết con số kỳ vọng nếu nó khác thực tế. Lệch nghĩa là có task trước làm sai.

- [ ] **Step 2: Cập nhật `README.md` dòng bảng `webapp/`**

`16 giáo trình, 768 mục` → `17 giáo trình, 804 mục`; `173 tài liệu` → `196 tài liệu`.

- [ ] **Step 3: Thêm dòng nguồn `kuar-vi/`**

Chèn ngay sau dòng `cka-book-vi/`:

```markdown
| [`kuar-vi/`](./kuar-vi/) | Bản dịch tiếng Việt *Kubernetes: Up and Running*, ấn bản 3 (Brendan Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson — O'Reilly) — sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0. 22 chương + 1 phụ lục, 18 hình. Đọc trong app ở lĩnh vực Kubernetes, kèm lộ trình đọc 9 tuần. |
```

Và thêm **Kubernetes: Up and Running** vào danh sách bản dịch ở đoạn văn mở đầu mục "DevPrep — nền tảng học đa lĩnh vực".

- [ ] **Step 4: Cập nhật `desc` lĩnh vực `kubernetes`**

```js
    desc: "Luyện thi CKAD, CKA, CKS: giáo trình theo tuần, tra cứu kubectl, flashcards, trắc nghiệm, thi thử và labs mô phỏng đề thật — kèm ba bản dịch Kubernetes in Action, CKA Study Guide và Kubernetes: Up and Running để đọc sâu.",
```

- [ ] **Step 5: Cập nhật chú thích đầu `views/roadmap.js`**

`"nay là 16 track thuộc 9 lĩnh vực"` → `"nay là 17 track thuộc 9 lĩnh vực"`, và thêm *Kubernetes: Up and Running* vào danh sách track Kubernetes.

- [ ] **Step 6: Nghiệm thu tự động toàn hệ**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: `Dữ liệu hợp lệ.` với **toàn bộ bất biến đạt**, không có dòng "bỏ qua".

- [ ] **Step 7: Nghiệm thu bằng mắt — bốn điểm**

```bash
./webapp/dev.sh
```

1. `#/docs` lĩnh vực Kubernetes: **70 thẻ chia 4 nhóm** với số đếm 7 / 17 / 23 / 23.
2. `#/docs` lĩnh vực Kafka: lưới phẳng **không tiêu đề nhóm**, y hệt trước đợt này.
3. `#/roadmap` lĩnh vực Kubernetes: **6 track**. Mở `ckabook` và `kuar`, tick một mục ở mỗi track, tải lại trang — cả hai tick còn nguyên.
4. `#/roadmap/cka` tuần 6: **6 chip sách**; `#/roadmap/ckad` tuần 1: 5 chip. Bấm một chip CKA Book → mở đúng tài liệu, **và sidebar vẫn ở lĩnh vực Kubernetes** (không nhảy lĩnh vực).

- [ ] **Step 8: Kiểm không còn dấu vết tên thư mục cũ**

```bash
grep -rn "Kubernetes- Up and Running\|Certified Kubernetes Administrator (CKA) Study Guide" \
     --exclude-dir=.git --exclude-dir=docs --exclude-dir=content . || echo "sạch"
```

Kỳ vọng: `sạch`. (`docs/` bị loại vì spec và kế hoạch cố ý nhắc tên cũ.)

- [ ] **Step 9: Commit**

```bash
git add README.md webapp/js/data/fields.js webapp/js/views/roadmap.js
git commit -m "docs: cập nhật số liệu sau khi thêm Kubernetes Up and Running

Lĩnh vực Kubernetes: 70 tài liệu, 6 giáo trình, 244 mục lộ trình.
Toàn repo: 17 giáo trình, 804 mục, 196 tài liệu."
```
