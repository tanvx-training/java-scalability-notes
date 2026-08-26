# Thiết kế — Đưa hai ebook (Kubernetes in Action, Spring Security in Action) vào DevPrep

- Ngày: 2026-08-26
- Branch: `claude/k8s-spring-security-features-53b017`
- Trạng thái: đã duyệt thiết kế, chờ lập kế hoạch triển khai

## 1. Mục tiêu

Hai thư mục nội dung đang nằm trong repo mà webapp **chưa hề tham chiếu** (grep
không ra một dòng nào trong `build-content.sh`, `docs-index.js`, `check-data.mjs`):

| Thư mục | Nguồn | Quy mô |
|---|---|---|
| `k8s-ebook/` | *Kubernetes in Action*, ấn bản 2 (MEAP V15) — Marko Lukša, Manning | 17 file markdown (~1.6MB), 12MB ảnh trong 17 thư mục con `ch00`…`ch17` |
| `spring-security-vi/` | *Spring Security in Action*, ấn bản 2 — Laurențiu Spilcă, Manning 2024 | 21 file markdown (~916KB), không có ảnh |

Mục tiêu: đưa cả hai vào DevPrep ở mức **tài liệu + lộ trình đọc sách** — thư viện
tài liệu đọc được trong app, kèm giáo trình theo tuần dẫn người học đi qua sách
theo đúng khuôn đã dùng cho `sysprog` (Mục tiêu → Đọc mục nào → Bẫy → Câu tự kiểm tra).

Sau khi xong: DevPrep có **4 lĩnh vực** (thêm `spring-security`), **6 giáo trình**
(thêm `k8sbook`, `springsec`), **73 tài liệu** (35 → 73), **264 mục lộ trình** (204 → 264).

### Ngoài phạm vi

Đã cân nhắc và **cố ý loại** khỏi bản thiết kế này:

- Flashcards, trắc nghiệm, thi thử, labs cho hai lĩnh vực mới
- Dịch nốt các tiêu đề còn tiếng Anh trong bản dịch K8s (vd §5.3.2 "Viewing application logs")
- Nén / chuyển định dạng 12MB ảnh sách K8s
- Tìm kiếm toàn văn trong thư viện tài liệu
- Tách `js/data/` thành thư mục con theo lĩnh vực

## 2. Quyết định thiết kế

| # | Quyết định | Lý do |
|---|---|---|
| D1 | `k8s-ebook/` vào lĩnh vực **`kubernetes`** có sẵn, không tạo lĩnh vực mới | Cùng người học, cùng dashboard; tách ra sẽ cắt đôi trải nghiệm học K8s — người ôn CKAD phải đổi lĩnh vực mới đọc được sách |
| D2 | `spring-security-vi/` thành lĩnh vực mới **`spring-security`**, không nhập vào `java` | Lĩnh vực `java` được mô tả là "series 10 bài về khả năng mở rộng"; nhồi bảo mật vào sẽ làm mô tả đó sai và trộn hai mạch kiến thức không liên quan |
| D3 | Sách K8s là **track thứ 4 độc lập** trong lĩnh vực `kubernetes`, không thay thế CKAD/CKA/CKS | Đọc sách và ôn chứng chỉ là hai mục đích khác nhau, tiến độ nên tách |
| D4 | Liên kết chéo qua **bảng ánh xạ riêng** `k8sbook-crossref.js`, merge tại `roadmap.js` | (a) 154 mục lộ trình cũ không đổi một ký tự → an toàn cho `localStorage` và cho review diff; (b) toàn bộ ánh xạ ở một chỗ; (c) merge ở tầng dữ liệu nên bất biến #3/#3b tự động phủ lên link crossref, không cần bất biến mới |
| D5 | Mỗi mục lộ trình gom 2–3 mục `##` của sách (~30 mục/track), không bám 1-1 từng mục | 1-1 sẽ ra ~100 mục — gấp đôi toàn bộ công việc lộ trình sysprog. 1 mục/chương thì phần "Đọc mục nào" mất tác dụng dẫn đường vì chương lên tới 100KB |
| D6 | Docs dùng tiền tố dài (`k8sbook-05`, `springsec-03`), mục lộ trình dùng tiền tố ngắn (`kb-w1-1`, `ss-w1-1`) | Bám đúng quy ước sysprog đã lập (`sysprog-01` ↔ `sp-w1-1`); hai không gian id tách bạch |
| D7 | `README.md` của hai ebook **không** thành mục docs | Đó là mục lục, app đã có trang danh sách tài liệu riêng — giống cách sysprog đã làm |
| D8 | Chương 14 Spring Security **vẫn vào** danh mục dù nguồn thiếu thân chương | Bỏ hẳn tạo lỗ thủng số chương khó hiểu hơn; `desc` nói thẳng khiếm khuyết và lộ trình không giao bài dựa vào nó |
| D9 | Giữ nguyên markdown nguồn, không sửa đường dẫn ảnh | `fixRelativePaths()` đã resolve tương đối theo thư mục chứa file; khuôn `content/<field>/images/…` của sysprog tái dùng nguyên vẹn |
| D10 | Thêm `loading="lazy"` cho ảnh trong `fixRelativePaths()` | 12MB ảnh mới, chương 11 có 18 PNG tải cùng lúc. Một dòng, nằm đúng đoạn mã đang phải đụng, có lợi cho cả ảnh sysprog/Java sẵn có |

## 3. Kiến trúc

### 3.1 Field registry — `js/data/fields.js` (sửa)

Thêm lĩnh vực thứ tư; `FIELD_ORDER` thành `["kubernetes", "sysprog", "java", "spring-security"]`.

```js
"spring-security": {
  label: "Spring Security", icon: "🔒", certFilter: false,
  desc: "Bản dịch tiếng Việt Spring Security in Action, ấn bản 2 (Laurențiu Spilcă, Manning 2024) — xác thực, phân quyền, CSRF/CORS, OAuth 2 & OIDC, reactive, kiểm thử.",
  modules: ["dashboard", "roadmap", "docs"],
  externalRef: { label: "docs.spring.io/spring-security", href: "https://docs.spring.io/spring-security/reference/" },
}
```

**Ràng buộc thứ tự:** bất biến #7 báo đỏ nếu khai một module chưa có dữ liệu —
chính `fields.js` cũng dặn *"Chỉ khai một module khi lĩnh vực đó ĐÃ có dữ liệu"*.
Nên lĩnh vực mới phải mở dần: khai `["dashboard", "docs"]` sau khi 21 docs đã có,
rồi mới thêm `"roadmap"` khi track xong.

### 3.2 Không đổi: `meta.js`, `views/dashboard.js`, `Dockerfile`, workflow, `.gitignore`

- `meta.js`: `DOMAINS`/`TOPICS` chỉ phục vụ quiz/flashcards — hai module mà lĩnh vực
  mới không khai (đúng như lĩnh vực `java` hiện nay). Không thêm gì.
- `views/dashboard.js`: đã hoàn toàn field-driven qua `getDocs`/`getTracks`.
- `dev.sh`, `Dockerfile`, `deploy-pages.yml`: cả ba gọi `build-content.sh <dest>`,
  không tự copy gì → sửa một chỗ là đủ.
- `.gitignore`: `webapp/content/` đã bị bỏ qua sẵn.

### 3.3 Thư viện tài liệu — `js/data/docs-index.js` (sửa)

| Nhóm | Số mục | id | `field` | `file` |
|---|---|---|---|---|
| Kubernetes in Action | 17 | `k8sbook-00`, `k8sbook-02` … `k8sbook-17` | `kubernetes` | `content/k8sbook/<tên gốc>.md` |
| Spring Security in Action | 21 | `springsec-00` … `springsec-18`, `springsec-pl-a`, `springsec-pl-b` | `spring-security` | `content/springsec/<tên gốc>.md` |

Docs lĩnh vực `kubernetes`: **7 → 24**. Docs lĩnh vực `spring-security`: **21**.

`springsec-14` mang `desc` nói rõ nguồn PDF mất thân chương 14.1–14.5; `springsec-15`
ghi chú mất mục 15.1.

### 3.4 Lộ trình — hai track mới

| Track | id | `field` | Tuần | Mục | File dữ liệu |
|---|---|---|---|---|---|
| Đọc *Kubernetes in Action* | `k8sbook` | `kubernetes` | 9 | 30 | `k8sbook-roadmap-part{1,2}.js` |
| Đọc *Spring Security in Action* | `springsec` | `spring-security` | 9 | 30 | `springsec-roadmap-part{1,2}.js` |

Id mục theo khuôn `kb-w<N>-<M>` / `ss-w<N>-<M>` — chưa từng dùng, nên không đụng
tiến độ `localStorage` của ai. Roadmap-items lĩnh vực `kubernetes`: **154 → 184**.

**Track `k8sbook` — phân bổ chương theo tuần:**

| Tuần | Chương | Mục |
|---|---|---|
| 1 | Ch.2 Tìm hiểu container | 3 |
| 2 | Ch.3 Triển khai ứng dụng đầu tiên · Ch.4 Đối tượng API | 4 |
| 3 | Ch.5 Chạy workload trong Pod | 4 |
| 4 | Ch.6 Quản lý vòng đời Pod | 3 |
| 5 | Ch.7 Volume · Ch.8 PersistentVolume | 4 |
| 6 | Ch.9 ConfigMap/Secret/Downward API · Ch.10 Namespace & Label | 3 |
| 7 | Ch.11 Service · Ch.12 Ingress | 4 |
| 8 | Ch.13 ReplicaSet · Ch.14 Deployment | 2 |
| 9 | Ch.15 StatefulSet · Ch.16 DaemonSet · Ch.17 Job & CronJob | 3 |

Ch.00 (Mở đầu) là tài liệu đọc dạo đầu, xuất hiện trong `resources` tuần 1 chứ
không thành mục lộ trình. Ch.1 không tồn tại trong nguồn (bản HTML gốc thiếu).

**Track `springsec` — phân bổ chương theo tuần:**

| Tuần | Chương | Mục |
|---|---|---|
| 1 | Ch.1 Bảo mật ngày nay · Ch.2 Xin chào Spring Security | 4 |
| 2 | Ch.3 Quản lý người dùng | 3 |
| 3 | Ch.4 Quản lý mật khẩu | 3 |
| 4 | Ch.5 Bộ lọc · Ch.6 Phương thức xác thực | 4 |
| 5 | Ch.7 · Ch.8 Phân quyền cấp endpoint | 4 |
| 6 | Ch.9 CSRF · Ch.10 CORS | 3 |
| 7 | Ch.11 · Ch.12 Phân quyền & lọc cấp phương thức | 3 |
| 8 | Ch.13 OAuth 2 & OIDC · Ch.15 Resource Server · Ch.16 Client | 4 |
| 9 | Ch.17 Reactive · Ch.18 Kiểm thử | 2 |

Tuần 8 dẫn tới `springsec-14` như phần mở đầu khái niệm về Authorization Server,
kèm ghi chú trỏ sang tài liệu chính thức của Spring Authorization Server để bù
phần nguồn thiếu.

### 3.5 Liên kết chéo — `js/data/k8sbook-crossref.js` (mới)

Bảng ánh xạ id tuần chứng chỉ → danh sách id chương sách. `roadmap.js` merge vào
`week.resources` lúc dựng track; view roadmap không đổi (nó đã render `resources`
thành hàng chip ở đầu mỗi tuần).

```js
export const k8sbookCrossref = {
  "w1":     ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10"],
  "w2":     ["k8sbook-05", "k8sbook-06"],
  "w3":     ["k8sbook-13", "k8sbook-14", "k8sbook-17"],
  "w4":     ["k8sbook-09"],
  "w5":     ["k8sbook-06"],
  "w6":     ["k8sbook-11", "k8sbook-12"],
  "w7":     ["k8sbook-07", "k8sbook-08", "k8sbook-15"],
  "cka-w1": ["k8sbook-04"],
  "cka-w4": ["k8sbook-16"],
  "cka-w5": ["k8sbook-07", "k8sbook-08"],
  "cka-w6": ["k8sbook-11", "k8sbook-12"],
  "cks-w4": ["k8sbook-09"],
};
```

Chip sinh ra mang nhãn dạng `📖 KIA Ch.5 — Chạy workload trong Pod`, phân biệt được
với resource sẵn có. Nhãn lấy từ `title` của doc tương ứng, không viết tay lại.

**Chiều ngược lại** đi qua `resources` của chính track `k8sbook`: các tuần có nội
dung trùng curriculum trỏ về `#/docs/cheat-sheet` và `#/roadmap/ckad`. Router đã
có sẵn route `#/roadmap/<trackId>`, không cần thêm route mới.

## 4. Pipeline build — `webapp/build-content.sh` (sửa)

Bốn dòng, là điểm sửa duy nhất của toàn bộ pipeline:

```bash
mkdir -p "$DEST/k8sbook/images" "$DEST/springsec"

cp    "$REPO"/k8s-ebook/*.md            "$DEST/k8sbook/"
cp -R "$REPO"/k8s-ebook/images/.        "$DEST/k8sbook/images/"
cp    "$REPO"/spring-security-vi/*.md   "$DEST/springsec/"
```

`cp -R` là bắt buộc ở dòng ảnh: `k8s-ebook/images/` có 17 thư mục con `chNN`, khác
với `images/` phẳng của lĩnh vực Java. Tên file đều ASCII, không khoảng trắng.

**Đường dẫn ảnh tự khớp:** markdown nguồn viết `![…](images/ch05/hinh-5.1.png)`;
`fixRelativePaths()` trong `js/views/docs.js` resolve theo thư mục chứa file, tức
`content/k8sbook/` → `content/k8sbook/images/ch05/hinh-5.1.png`.

**Kích thước:** artifact GitHub Pages đi từ ~6MB lên ~21MB (12MB ảnh + 2.5MB
markdown). Xa ngưỡng GitHub Pages; không cần xử lý gì ngoài `loading="lazy"` (D10).

## 5. Kiểm thử — `webapp/check-data.mjs`

Repo không có test runner; `check-data.mjs` **chính là** bộ test, và workflow deploy
chặn ở bước `check` trước khi build site. Thứ tự làm việc theo kiểu TDD: sửa bảng
kỳ vọng và viết bất biến mới **trước**, thấy đỏ, rồi mới viết dữ liệu.

### 5.1 Bảng `EXPECTED.counts` sau hai đợt

```js
"docs:kubernetes":               24,   // 7   → 24  (+17 chương sách)
"roadmap-items:kubernetes":     184,   // 154 → 184 (+30 mục track k8sbook)
"docs:spring-security":          21,   // mới
"roadmap-items:spring-security": 30,   // mới
```

Hai key `kubernetes` thuộc **Đợt 1**, hai key `spring-security` thuộc **Đợt 2** —
không khai sớm, vì bất biến N3 chỉ đòi key cho lĩnh vực đã tồn tại trong `FIELDS`.

### 5.2 Bất biến sẵn có phủ miễn phí — không phải viết gì

- **#2** bắt ngay nếu `build-content.sh` copy sai đường dẫn (38 file mới phải tồn tại trên đĩa)
- **#3 / #3b** quét `tracks` **sau khi merge** → toàn bộ link crossref được kiểm tự động (lợi ích chính của D4)
- **#5 / FIELD_ORDER / #7 / #7b / `navFor()`** ép lĩnh vực mới khai module có view thật, có dữ liệu thật, không đụng 4 module K8s-only
- **"field khai rõ phải tồn tại"** bắt `field: "spring-security"` gõ sai
- **"Accessor lọc đúng"** bắt id trùng giữa hai lĩnh vực

### 5.3 Ba bất biến mới

| # | Bất biến | Bắt lỗi gì |
|---|---|---|
| N1 | Mọi key của `k8sbookCrossref` là id tuần có thật trong track chứng chỉ; mọi giá trị là id doc `k8sbook-*` có thật; không trùng trong cùng tuần | Gõ nhầm `"w31"` sẽ merge vào tuần không tồn tại và **im lặng biến mất** — không lỗi, không cảnh báo, chip chỉ đơn giản không bao giờ hiện |
| N2 | Với mỗi tuần có crossref, `resources` sau merge chứa đủ resource gốc | Hàm merge ghi đè thay vì nối |
| N3 | Mọi field khai `docs`/`roadmap` phải có key tương ứng trong `EXPECTED.counts` | Vòng kiểm đếm hiện chỉ so những key *có mặt* trong `EXPECTED`, nên một lĩnh vực mới quên khai sẽ trôi tự do — đúng loại lỗi đợt này sẽ tạo ra |

### 5.4 Smoke checklist thủ công

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs && ./webapp/dev.sh
```

- Bộ chọn lĩnh vực có 4 mục
- `#/docs/k8sbook-11` hiện đủ 18 ảnh, mục lục nổi chạy
- `#/roadmap/k8sbook` mở được, tick tiến độ lưu lại sau reload
- Tuần 3 của CKAD (`#/roadmap/ckad`) hiện chip sách, resource cũ vẫn còn nguyên
- `#/docs/springsec-14` hiện rõ cảnh báo thiếu nguồn
- Deep-link `#/docs/springsec-03` khi đang ở lĩnh vực Kubernetes thì tự chuyển lĩnh vực
- Lĩnh vực Spring Security chỉ hiện 3 mục nav (Bảng điều khiển, Lộ trình, Tài liệu)

## 6. Tài liệu cần cập nhật

- `README.md` gốc: hiện **không nhắc tới `k8s-ebook/` và `spring-security-vi/`** dù
  hai thư mục nằm ngay trong repo → thêm hai dòng vào bảng thành phần DevPrep;
  cập nhật mô tả webapp (4 → 6 giáo trình, 35 → 73 tài liệu, 204 → 264 mục).
- `webapp/README.md`: bảng tính năng, mô tả bộ chọn lĩnh vực (3 → 4 lĩnh vực),
  sơ đồ cấu trúc mã (thêm 5 file dữ liệu mới).

## 7. Giấy phép — điểm cần chủ repo quyết

Đây là khác biệt quan trọng so với lần tích hợp `sysprog`, và cần nêu rõ:

| Nguồn | Giấy phép |
|---|---|
| `System_Programming_VI/` (đã tích hợp) | **CC BY 4.0** — tự do phân phối lại nếu ghi công |
| `k8s-ebook/` | *Kubernetes in Action* 2e, Manning — **bản quyền thương mại** |
| `spring-security-vi/` | *Spring Security in Action* 2e, Manning 2024 — **bản quyền thương mại** |

Hai ebook đã nằm sẵn trong repo, nhưng hiện **không** được copy vào site. Bản thiết
kế này sẽ đưa toàn văn cả hai lên GitHub Pages công khai — đó là một thay đổi thật
về mức độ phát tán, không chỉ là thay đổi trong app.

Ba lựa chọn để chủ repo cân nhắc, không cái nào chặn việc triển khai:

1. Giữ repo và GitHub Pages ở chế độ riêng tư (bản dịch dùng cho mục đích học cá nhân)
2. Chỉ đưa **lộ trình** vào app, phần "Đọc" trỏ tới sách bản quyền người học tự sở hữu, không copy toàn văn vào `content/`
3. Xác nhận đã có quyền phân phối bản dịch

Bản thiết kế mặc định theo yêu cầu đã duyệt (đưa toàn văn vào app). Nếu chọn (2),
phần lộ trình giữ nguyên và chỉ mục 3.3 + 4 phải viết lại.

## 8. Chia đợt

### Đợt 1 — *Kubernetes in Action* → lĩnh vực `kubernetes`

| # | Việc | File |
|---|---|---|
| 1 | Cập nhật `EXPECTED.counts` + viết N1/N2/N3 → **thấy đỏ** | `check-data.mjs` |
| 2 | Copy markdown + `cp -R` ảnh | `build-content.sh` |
| 3 | 17 mục docs `k8sbook-*` | `docs-index.js` |
| 4 | `img.loading = "lazy"` | `views/docs.js` |
| 5 | 30 mục / 9 tuần, id `kb-w<N>-<M>` | `k8sbook-roadmap-part{1,2}.js` |
| 6 | Đăng ký track `k8sbook` + hàm merge crossref | `roadmap.js` |
| 7 | Bảng ánh xạ | `k8sbook-crossref.js` |
| 8 | Cập nhật số liệu | `README.md`, `webapp/README.md` |

Kết đợt: `check-data.mjs` xanh toàn bộ, app chạy với giáo trình thứ 4 và chip sách
trong CKAD/CKA.

### Đợt 2 — *Spring Security in Action* → lĩnh vực mới

Cập nhật `EXPECTED` → 1 dòng `build-content.sh` → 21 mục docs `springsec-*` → khai
field với `["dashboard", "docs"]` → 30 mục lộ trình → đăng ký track `springsec` →
mở thêm module `roadmap` → README. Thứ tự này do ràng buộc bất biến #7 quyết định
(mục 3.1), không đảo được.

## 9. Tiêu chí hoàn thành

- `node webapp/check-data.mjs` xanh toàn bộ, không bất biến nào bị bỏ qua sau khi
  đã chạy `build-content.sh`
- Smoke checklist mục 5.4 đạt hết
- Workflow `deploy-pages.yml` chạy qua bước `check` và deploy thành công
- Hai README phản ánh đúng số liệu mới
