# Tích hợp lộ trình Senior Java vào DevPrep — thiết kế

Ngày: 2026-08-29 · Trạng thái: đã duyệt thiết kế, chưa triển khai

## 1. Bối cảnh

Hai nguồn dữ liệu học tập nằm ngoài `java-scalability-notes` cần được đưa vào
web app DevPrep (`webapp/`):

1. **Ma trận năng lực** — `roadmap-seed.yaml` của `personal-platform/senior-java-tracker`,
   hiện phục vụ một app React riêng (`senior-java-tracker-web`). 6 module, 34 chủ đề,
   96 tiêu chí tự đánh giá theo 4 cấp độ.
2. **Kế hoạch 24 tháng** — 5 tệp markdown do người dùng cung cấp: một tệp tổng quan
   và bốn tệp giai đoạn. 49 khối tuần, 227 bước thực hiện, 27 tiêu chí nghiệm thu,
   20 câu tự kiểm tra.

Hai nguồn này **không phải một lộ trình**. Seed lấy mốc Java 25 / Spring Boot 4.1
và chia theo module năng lực; markdown lấy mốc Java 17–21 và chia theo 4 giai đoạn
thời gian. Chúng chồng lấn chủ đề nhưng không có ánh xạ M1–M6 ↔ giai đoạn 1–4.
Thiết kế này đặt chúng cạnh nhau với vai trò phân biệt rõ:

- **Lộ trình** trả lời *"tuần này làm gì"* — kế hoạch thực hiện, tick theo bước.
- **Ma trận năng lực** trả lời *"tôi đang ở cấp độ nào"* — tự đánh giá theo tiêu chí.

## 2. Quyết định đã chốt

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Hình thức tích hợp | Chỉ mang **dữ liệu**, bỏ code React | Giữ DevPrep một stack: vanilla JS, không build, không dependency |
| Vị trí | **Lĩnh vực thứ 5** `senior-java` | Tách bạch với lĩnh vực `java` (series 10 bài scalability) |
| Ma trận năng lực | **View `tracker` mới** | Giữ 96 ô tick theo tiêu chí; không làm `roadmap.js` phục vụ hai dạng dữ liệu |
| Nguồn sự thật | **Chuyển hẳn sang JS** trong repo này | Đúng nếp DevPrep; hai kho rẽ nhánh từ đây, có ghi xuất xứ |
| Phạm vi markdown | **Đủ 4 module**: dashboard, roadmap, docs, tracker | Khai thác hết nguồn, đúng nếp đã dùng cho `spring-security-vi/` và `k8s-ebook/` |

## 3. Lĩnh vực mới

Thêm vào `webapp/js/data/fields.js`:

```js
"senior-java": {
  label: "Lộ trình Senior Java",
  icon: "🧭",
  desc: "Kế hoạch 24 tháng từ Mid-level lên Senior Java + DevOps — 4 giai đoạn, "
      + "276 mục tick — kèm ma trận năng lực 96 tiêu chí theo 4 cấp độ.",
  certFilter: false,
  modules: ["dashboard", "roadmap", "docs", "tracker"],
  // Lộ trình trải từ Java/Spring qua DevOps, Kubernetes, AWS tới hệ phân tán —
  // không nguồn ngoài nào bao hết, nên bỏ externalRef thay vì bịa link.
},
```

`FIELD_ORDER` thêm `"senior-java"` ở cuối. Icon ☕ đã thuộc lĩnh vực `java`, dùng 🧭
để phân biệt trong bộ chọn.

Thêm module thứ 10 vào `NAV_GROUPS`, nhóm "Tổng quan", ngay sau `roadmap`:

```js
{ id: "tracker", label: "Ma trận năng lực", icon: "📊", href: "#/tracker" }
```

Không thêm vào `K8S_ONLY_MODULES` — view nhận `field` làm tham số, không đọc cứng
dữ liệu Kubernetes.

## 4. Module `docs` — 5 tài liệu

Năm tệp markdown vào thư mục mới ở gốc repo:

```
senior-java-roadmap/
├── 00-tong-quan.md                  (id: sj-00)
├── 01-giai-doan-1-java-spring.md    (id: sj-01)
├── 02-giai-doan-2-devops.md         (id: sj-02)
├── 03-giai-doan-3-k8s-cloud.md      (id: sj-03)
└── 04-giai-doan-4-system-design.md  (id: sj-04)
```

`build-content.sh` thêm một đích copy:

```bash
mkdir -p "$DEST/senior"
cp "$REPO"/senior-java-roadmap/*.md "$DEST/senior/"
```

`docs-index.js` thêm 5 bản ghi `field: "senior-java"`, `file: "content/senior/<tên>.md"`.

Nội dung markdown **giữ nguyên văn**, không biên tập lại. Đây là tài liệu do người
dùng viết, không vướng bản quyền bên thứ ba như `k8s-ebook/` hay `spring-security-vi/`.

## 5. Module `roadmap` — 4 track

49 khối tuần trong một danh sách phẳng là quá dài; bộ chọn track sẵn có đã xử lý
nhiều track cùng lĩnh vực (Kubernetes đang có 4). Nên chia bốn track, mỗi track một
giai đoạn:

| Track | Giai đoạn | Tuần | Bước | Nghiệm thu | Câu hỏi | Tổng mục |
|---|---|---|---|---|---|---|
| `sj-gd1` | Java & Spring chuyên sâu (tháng 1–6) | 13 | 65 | 6 | 10 | **81** |
| `sj-gd2` | DevOps nền tảng (tháng 6–12) | 13 | 57 + 2 | 7 | — | **66** |
| `sj-gd3` | Kubernetes, AWS, Terraform (tháng 12–18) | 12 | 57 | 7 | — | **64** |
| `sj-gd4` | Distributed systems & System design (tháng 18–24) | 11 | 48 | 7 | 10 | **65** |
| | | **49** | **229** | **27** | **20** | **276** |

Hai khối "Tuần 25–26" (GĐ2 và GĐ4) trong nguồn **không có bước đánh số nào**, chỉ có văn
xuôi. Khối tuần `items: []` làm `refreshWeek()` tính `0/0`: thanh tiến độ ra `NaN%` và ô
tuần tự đánh dấu *done* ngay. Xử lý: GĐ2 tách văn xuôi của tuần đó thành **2 mục**
("chấm checklist & review quý", "dùng buffer trả nợ tuần trễ") — cộng 2 vào cột Bước;
GĐ4 nhận 10 câu tự kiểm tra nên đã đủ mục, không cần thêm.

Cột **Tuần** đếm khối tuần có trong nguồn. Mỗi track còn có thêm một khối *Nghiệm thu*
(mục 5.2), nên số khối `<details>` thực render là 14 / 14 / 13 / 12 — tổng **53**.

Cỡ mỗi track ngang CKAD (10 tuần, 55 mục) nên trải nghiệm không lệch.

### Ánh xạ nguồn → lược đồ

| Nguồn markdown | Trường trong track |
|---|---|
| `### Tuần 1–2: Setup + Java 17–21` | `week: "Tuần 1–2"`, `title: "Setup + Java 17–21"` |
| `**Mục tiêu:**` | `goal` |
| Mỗi bước đánh số trong `**Cách thực hiện:**` | một phần tử `items[]` (`text` + `lesson`) |
| `**Hoàn thành khi:**` | `doneWhen` (**trường mới**, xem 5.2) |
| `## Tài nguyên chính` của giai đoạn | `resources[]` ở tuần đầu track |
| `## Output bắt buộc cuối giai đoạn` | `desc` của track |
| Điều kiện sang giai đoạn sau (`Đạt ≥ 5/6 →`) | `prereq` của track kế tiếp |
| `## Checklist đánh giá cuối giai đoạn` | một khối tuần *Nghiệm thu* cuối track |
| `## Bộ câu hỏi tự kiểm tra` | mục tick trong tuần ôn tập (GĐ1 và GĐ4, Tuần 25–26) |

`items[].lesson` là markdown của chính bước đó, mở rộng vừa đủ để đứng độc lập, kèm
liên kết `#/docs/sj-0N` về đúng tài liệu nguồn. Toàn văn vẫn nằm ở `docs` —
lesson không chép lại cả mục.

**Bộ câu hỏi tự kiểm tra giữ nguyên văn câu hỏi, không kèm đáp án.** Nguồn không có
đáp án; tự soạn sẽ làm hỏng giá trị tự kiểm tra. Tick = "trả lời trôi chảy không cần
nhìn ghi chú".

### 5.1 Id

Khoảng id mới, không đụng `w1-1` / `cka-w1-1` / `sp-w1-1` / `kb-w1-1` / `ss-w1-1`:

```
tuần        sj-gd1-w1          nghiệm thu   sj-gd1-done
mục         sj-gd1-w1-1                     sj-gd1-done-1
```

Id là khoá `localStorage` (`roadmap.checked`) — **không đổi sau khi phát hành**.

### 5.2 Ba thay đổi nhỏ ở tầng hiển thị

Cả hai đều **cộng thêm**, không rẽ nhánh render như hướng đã bị loại:

1. **`doneWhen` (tuỳ chọn) trong `views/roadmap.js`** — một `if` render hộp
   "✅ Hoàn thành khi" cạnh hộp "🔨 Thực hành cuối tuần" hiện có. Track cũ không khai
   trường này nên không đổi gì.
2. **`badge` (tuỳ chọn) cho khối tuần** — ô tròn hiện đang lấy
   `week.week.replace("Tuần ", "")`. Nhãn của nguồn này là khoảng ("Tuần 21–24") và
   khối *Nghiệm thu* không có số tuần. View đổi thành `week.badge ?? week.week.replace(...)`.
   Khối nghiệm thu khai `week: "Nghiệm thu"`, `badge: "✓"`.
3. **CSS `.week-num`** đang cứng `width: 42px` hình tròn — "21–24" tràn. Đổi sang
   `min-width: 42px; width: auto; padding: 0 8px; border-radius: 21px`. Tuần một chữ số
   vẫn tròn như cũ; nhãn dài nở thành viên thuốc.

### 5.3 Không liên kết chéo sang lĩnh vực `java`

Giai đoạn 1 trùng chủ đề với 10 bài `Chủ đề I–IV` (lĩnh vực `java`), nhưng
`navigate()` tự đổi lĩnh vực theo chủ sở hữu tài liệu khi mở `#/docs/<id>` — bấm một
liên kết như vậy sẽ kéo người dùng ra khỏi `senior-java` mà không báo. Bản đầu **không**
cross-link. Muốn làm sau thì phải xử lý riêng ở `navigate()`, ngoài phạm vi tài liệu này.

## 6. Module `tracker` — ma trận năng lực

### 6.1 Dữ liệu

`webapp/js/data/senior-java-matrix.js`, giữ nguyên lược đồ miền của seed:

```js
export const seniorJavaMatrix = {
  id: "senior-java-2026",
  field: "senior-java",
  title: "Ma trận năng lực Senior Java 2026 (Java 25 · Spring Boot 4.1)",
  version: "2026.08",
  modules: [
    { id: "sj-m1", code: "M1", title: "…", summary: "…", weight: 20,
      topics: [
        { id: "sj-m1-t1", title: "Virtual threads & Project Loom", importance: "HIGH",
          checklist: [{ id: "sj-m1-t1-c1", level: 1, criteria: "…" }],
          resources: [{ url: "…", title: "…", tags: ["java25", "loom"] }] }] }],
};
```

6 module (M1–M6, tổng `weight` = 100) · 34 chủ đề · 96 tiêu chí · 32 tài nguyên.
Ước ~750 dòng; vượt 600 thì tách `senior-java-matrix-part{1,2}.js` (M1–M3 / M4–M6)
đúng nếp các track khác.

Header ghi rõ: chuyển đổi một lần từ `roadmap-seed.yaml` (`personal-platform`,
phiên bản `2026.08`); **tệp này là nguồn sự thật mới**, sửa thẳng tại đây, không sinh lại.

Id giữ cấu trúc `m<N>-t<N>-c<N>` của bản sinh cũ, thêm tiền tố `sj-`. Bản sinh cũ đặt
id **theo vị trí**, nên đảo thứ tự trong seed là đổi id; viết thẳng vào JS khử được
điểm mong manh đó.

**Không mang sang**: `progress`, `notes`, `bookmarks`, `timeline`/phase, `versionTags`
và ràng buộc `completed_requires_evidence`. Các chủ đề "Capstone M*" nói về việc nâng
cấp chính backend tracker — vẫn là tiêu chí năng lực hợp lệ nên **giữ**, chỉ bỏ ngữ
cảnh dự án.

### 6.2 View

`webapp/js/views/tracker.js`, bám cấu trúc `renderTrack()` để không tạo lối tương tác mới:

- **Đầu trang**: tiến độ tổng `x/96 tiêu chí`, nút `▶ Tiêu chí kế tiếp` và
  `Đặt lại tiến độ` — đúng cặp nút roadmap đang có.
- **Bảng cấp độ** (riêng của view này): bốn cột `1 Hiểu lý thuyết` ·
  `2 Thực thi mã nguồn` · `3 Phân tích đánh đổi` · `4 Thiết kế & xử lý sự cố`, mỗi cột
  một thanh tiến độ. Nhãn lấy từ chú thích đầu `roadmap-seed.yaml`.
- **Một `<details>` mỗi module**: mã `M1`, tiêu đề, `summary`, chip `trọng số 20%`,
  thanh tiến độ.
- **Mỗi chủ đề một khối**: tiêu đề + huy hiệu mức quan trọng (Cao / Trung bình / Thấp),
  hàng chip tài nguyên (mở tab mới), rồi danh sách tiêu chí — **mỗi tiêu chí một ô tick**
  kèm nhãn cấp độ `L1`–`L4`.
- Deep-link `#/tracker/sj-m4` mở sẵn và cuộn tới module đó.

### 6.3 Tiến độ

Khoá `localStorage` mới `tracker.checked` = `{ [criteriaId]: true }`, ghi vào bảng chú
thích cuối `lib/store.js`. Tách khỏi `roadmap.checked` vì khác không gian id và người
dùng có thể muốn đặt lại riêng. Namespace `kubeprep.` **giữ nguyên** — cảnh báo trong
`store.js` đã nêu rõ lý do.

### 6.4 Điều hướng

`app.js` thêm `tracker` vào `routes`, và mở rộng đoạn suy lĩnh vực ngược trong
`navigate()` — hiện chỉ xử lý `docs` và `roadmap`. Không thêm thì deep-link
`#/tracker/sj-m1` gửi cho người đang ở lĩnh vực khác sẽ bị `moduleAllowed` đá về bảng
điều khiển. Thêm `fieldOfMatrixModule()` trong `data/index.js`, đối xứng `fieldOfTrack()`.

## 7. Bảng điều khiển

Ba sửa đổi ở `views/dashboard.js`, hai trong đó là lỗi sẵn có:

1. **Lỗi sẵn có** — nút `📚 Đọc tài liệu` ở hero và thẻ `Thư viện tài liệu` ở "Khu vực
   học tập" render **vô điều kiện**. Bọc cả hai bằng `has("docs")`. Lĩnh vực mới có
   `docs` nên không lộ ngay, nhưng lỗi vẫn có thật với bất kỳ lĩnh vực nào không có
   tài liệu.
2. **Lỗi sẵn có** — dải tổng quan mọi lĩnh vực luôn mở đầu `parts` bằng
   `${getDocs(id).length} tài liệu`, nên lĩnh vực không có tài liệu hiện "0 tài liệu".
   Cho phần tài liệu vào điều kiện như các phần còn lại.
3. **Mới** — thêm `trackerStats(fieldKey)`; dải tổng quan thêm `${n} tiêu chí`; thẻ
   thống kê `x% · Ma trận năng lực` (dòng phụ `y/96 tiêu chí`); thẻ khu vực
   `📊 Ma trận năng lực` khi `has("tracker")`. Điều kiện render lưới thẻ thống kê đổi
   từ `has("roadmap")` thành `has("roadmap") || has("tracker")`.

## 8. Bất biến dữ liệu

Repo không có framework test — `check-data.mjs` **là** bộ test. Theo đúng chỉ dẫn trong
chính tệp đó ("Bảng kỳ vọng: sửa Ở ĐÂY TRƯỚC khi viết dữ liệu mới"), khai kỳ vọng và
bất biến **trước**, xác nhận chúng đỏ, rồi mới viết dữ liệu.

`EXPECTED.counts` thêm:

```
docs:senior-java              5
roadmap-items:senior-java     276
matrix-modules:senior-java    6
matrix-topics:senior-java     34
matrix-criteria:senior-java   96
```

Mở rộng bất biến sẵn có:

- **#7** (khai module thì phải có dữ liệu) — thêm `tracker` vào bảng `has`.
- **#7c** (chiều ngược) — thêm `tracker`: có ma trận thì phải khai module.

Bất biến mới cho dạng dữ liệu ma trận:

- Id tiêu chí/chủ đề/module duy nhất **toàn cục**, không đụng id lộ trình và tài liệu.
- Id con khớp tiền tố cha: `sj-m1-t1-c1` ⊂ `sj-m1-t1` ⊂ `sj-m1`.
- `level` ∈ 1–4; `criteria` không rỗng.
- `importance` ∈ `HIGH | MEDIUM | LOW`.
- Tổng `weight` các module = 100.
- `resources[].url` là http(s).

Bất biến mới cho dữ liệu lộ trình mới:

- Mỗi track `sj-gd*` có đúng một khối tuần `badge: "✓"` (khối nghiệm thu) và nó nằm cuối.
- ~~Mọi liên kết `#/docs/…` cùng lĩnh vực~~ — **bất biến #3b đã có sẵn** và cưỡng chế đúng
  luật này; không viết mới, chỉ dựa vào nó.

## 9. Tài liệu phải cập nhật

- `webapp/README.md` — bảng tính năng, mục "Bộ chọn lĩnh vực", cây cấu trúc mã.
- `README.md` gốc — danh sách lĩnh vực và số liệu.
- `webapp/js/data/roadmap.js` — chú thích đầu tệp liệt kê track và số mục.
- `webapp/index.html` — `<meta name="description">` đang liệt kê 3 lĩnh vực, lỗi thời
  từ trước khi có Spring Security.
- `webapp/js/lib/store.js` — bảng chú thích khoá, thêm `tracker.checked`.

## 10. Ngoài phạm vi

- Backend `senior-java-tracker` (Java/Maven) và app React `senior-java-tracker-web`:
  không đưa sang, không sửa.
- Minh chứng (`evidence_url`), nhật ký, bookmark, timeline phase, version tag.
- Flashcards và trắc nghiệm cho lĩnh vực mới — nguồn không có đáp án; muốn có thì phải
  soạn nội dung mới, là một việc riêng.
- Cross-link sang lĩnh vực `java` (xem 5.3).
- Đồng bộ ngược về `personal-platform`. Hai kho rẽ nhánh từ đây.

## 11. Rủi ro và giới hạn đã biết

| Rủi ro | Xử lý |
|---|---|
| Hai lộ trình lệch mốc công nghệ (Java 21 vs Java 25) gây hiểu nhầm | Đặt tên và mô tả phân vai rõ: *Lộ trình* = kế hoạch thực hiện, *Ma trận năng lực* = tự đánh giá. Không tuyên bố chúng ánh xạ với nhau |
| 276 mục là track lớn nhất repo, khối lượng soạn `lesson` lớn | Chia 4 track, làm và nghiệm thu từng giai đoạn một |
| Đổi id sau khi phát hành làm mất tiến độ người dùng | Chốt sơ đồ id ở mục 5.1 và 6.1 trước khi viết dữ liệu; bất biến kiểm tiền tố |
| `roadmap-seed.yaml` chưa được git theo dõi ở kho nguồn | Chính là lý do chuyển hẳn nguồn sự thật sang tệp JS trong kho này |

## 12. Nghiệm thu

1. `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs` — xanh toàn bộ,
   gồm cả các bất biến mới.
2. `./webapp/dev.sh` rồi kiểm tay:
   - Bộ chọn hiện 5 lĩnh vực; nav `senior-java` đúng 4 mục.
   - 4 track hiện ở trang lộ trình; mở một track thấy hộp "Hoàn thành khi"; khối nghiệm
     thu ở cuối có huy hiệu ✓; nhãn "Tuần 21–24" không tràn ô.
   - Tick một bước và một tiêu chí, tải lại trang — cả hai còn nguyên.
   - Đổi sang lĩnh vực khác rồi quay lại — không mất tiến độ, nav đúng.
   - Deep-link `#/tracker/sj-m4` và `#/roadmap/sj-gd3` mở đúng kể cả khi đang đứng ở
     lĩnh vực Kubernetes.
   - Mở 5 tài liệu mới, ảnh và mục lục nổi hiển thị đúng.
3. Tiến độ của bốn lĩnh vực cũ không đổi (id cũ không bị đụng).
