# Spring Security in Action → DevPrep (Đợt 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa 21 tệp bản dịch *Spring Security in Action* (ấn bản 2) vào DevPrep thành **lĩnh vực học thứ tư** — thư viện tài liệu đọc được trong app cộng một giáo trình đọc sách 9 tuần / 30 mục.

**Architecture:** App tĩnh vanilla ES modules, không build step. Lĩnh vực khai báo tập trung trong `webapp/js/data/fields.js`; `check-data.mjs` chạy bằng `node` là bộ test duy nhất. Lĩnh vực mới **mở dần theo dữ liệu** — khai `["dashboard"]` trước, thêm `"docs"` khi đã có 21 tài liệu, thêm `"roadmap"` khi đã có track. Thứ tự này do bất biến ép, không đảo được.

**Tech Stack:** Vanilla ES modules · Node ≥ 22 (chỉ để chạy `check-data.mjs`) · bash · python3 `http.server` (dev) · GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-08-26-k8sbook-springsec-design.md` (mục 8, "Đợt 2")

**Đợt 1 đã hoàn tất** và là nền của kế hoạch này: 17 chương *Kubernetes in Action* vào lĩnh vực `kubernetes`, track `k8sbook` 9 tuần/30 mục, bảng liên kết chéo. Trạng thái đầu Đợt 2: **52 tài liệu · 5 giáo trình · 234 mục lộ trình · 28 bất biến xanh**.

## Global Constraints

- **Không thêm dependency.** Repo không có `node_modules`, không bundler. `webapp/package.json` chỉ chứa `{"type": "module"}`.
- **Không đổi id đã tồn tại.** Id tuần và id mục lộ trình là khoá lưu tiến độ `localStorage`.
- **Không sửa markdown nguồn** trong `spring-security-vi/`.
- **Mọi bản ghi mới phải khai `field: "spring-security"` tường minh.**
- **Chỉ khai một module cho lĩnh vực khi lĩnh vực đó ĐÃ có dữ liệu** (bất biến #7). Xem "Ràng buộc thứ tự" bên dưới.
- **Lĩnh vực mới KHÔNG được khai bốn module chỉ dành cho Kubernetes**: `certs`, `commands`, `exam`, `labs` (bất biến #7b).
- **Bảng `EXPECTED.counts` sửa TRƯỚC khi viết dữ liệu**, để mỗi task bắt đầu bằng một lần chạy đỏ.
- Văn bản hướng tới người dùng viết **tiếng Việt**, xưng "bạn".
- Commit tiếng Việt, tiền tố `feat:` / `fix:` / `docs:`.
- Lệnh kiểm sau mỗi task: `./webapp/build-content.sh webapp/content && node webapp/check-data.mjs`

### Ràng buộc thứ tự — đọc trước khi làm bất cứ task nào

Ba bất biến khoá chặt thứ tự và **không thể đảo**:

| Bất biến | Nội dung | Hệ quả |
|---|---|---|
| "field khai rõ phải là lĩnh vực tồn tại" | Bản ghi khai `field: "spring-security"` thì khoá đó phải có trong `FIELDS` | Field phải được **khai trước** khi thêm docs |
| #7 | Lĩnh vực khai `docs`/`roadmap`/`flashcards`/`quiz` thì phải có dữ liệu tương ứng | Module `docs` chỉ được bật **sau** khi 21 docs đã tồn tại |
| N3 (thêm ở Đợt 1) | Lĩnh vực khai `docs`/`roadmap` phải có khoá đếm trong `EXPECTED.counts` | Bật module nào thì khai khoá đếm ấy trong cùng bước |

Vì vậy thứ tự bắt buộc là: **khai field với `modules: ["dashboard"]`** → thêm 21 docs → **bật `"docs"` + khai `docs:spring-security`** → thêm track → **bật `"roadmap"` + khai `roadmap-items:spring-security`**.

## File Structure

**Tạo mới:**

| File | Trách nhiệm |
|---|---|
| `webapp/js/data/springsec-roadmap-part1.js` | Tuần 1–5 của track đọc sách (18 mục). Chỉ dữ liệu. |
| `webapp/js/data/springsec-roadmap-part2.js` | Tuần 6–9 của track đọc sách (12 mục). Chỉ dữ liệu. |

**Sửa:**

| File | Sửa gì |
|---|---|
| `webapp/build-content.sh` | 2 dòng copy markdown sách (không có ảnh) |
| `webapp/js/data/fields.js` | khai lĩnh vực `spring-security`, mở rộng `FIELD_ORDER`, mở dần `modules` |
| `webapp/js/data/docs-index.js` | +21 mục docs `springsec-*` |
| `webapp/js/data/roadmap.js` | import 2 part mới, đăng ký track `springsec` |
| `webapp/check-data.mjs` | bảng kỳ vọng (2 khoá mới) |
| `README.md`, `webapp/README.md` | số liệu, danh sách lĩnh vực, bảng thành phần |

**Không đụng:** `meta.js` (`DOMAINS`/`TOPICS` chỉ phục vụ quiz/flashcards — lĩnh vực này không khai hai module đó, giống lĩnh vực `java` hiện nay), `webapp/js/views/` (dashboard/roadmap/docs đã hoàn toàn field-driven), `Dockerfile`, `.github/workflows/`, `.gitignore`, `k8sbook-crossref.js`.

## Khiếm khuyết nguồn đã biết — không được tự vá

`spring-security-vi/` được tách từ một PDF in ra từ web, và **thiếu nội dung thật**:

- **Chương 14** chỉ còn phần mở đầu. Toàn bộ §14.1–14.5 (JWT, authorization code grant, client credentials grant, opaque token & introspection, thu hồi token) **không có trong nguồn**. Tệp có sẵn một khối cảnh báo `> ⚠️ **Ghi chú về nguồn:**` nói rõ điều đó.
- **Chương 15 thiếu §15.1.** Tệp bắt đầu thẳng từ `## 15.2 Sử dụng JWT tùy chỉnh`.
- Rải rác có đoạn bị cắt cụt, đánh dấu `[…]`.

Hệ quả bắt buộc cho kế hoạch này: `springsec-14` vẫn vào danh mục tài liệu (bỏ hẳn tạo lỗ thủng số chương khó hiểu hơn) nhưng `desc` phải nói thẳng khiếm khuyết; **lộ trình không giao bài nào dựa vào §14.1–14.5 hay §15.1**. Nếu người triển khai thấy một mục sách mà bảng mục giả định nhưng nguồn không có, phải DỪNG và báo, không được lấp bằng kiến thức Spring Security của mình.

---

### Task 1: Pipeline nội dung + khai lĩnh vực `spring-security`

**Files:**
- Modify: `webapp/build-content.sh`
- Modify: `webapp/js/data/fields.js`

**Interfaces:**
- Consumes: nguồn `spring-security-vi/*.md` đã có trong repo.
- Produces: thư mục `<dest>/springsec/` chứa 22 tệp `.md`; khoá lĩnh vực `"spring-security"` tồn tại trong `FIELDS` và `FIELD_ORDER`. Task 2 dùng cả hai.

- [ ] **Step 1: Viết lệnh kiểm chứng — phải thất bại**

```bash
./webapp/build-content.sh webapp/content
test -d webapp/content/springsec && echo "CÓ" || echo "KHÔNG CÓ"
```

Kỳ vọng: in `KHÔNG CÓ`.

- [ ] **Step 2: Sửa `webapp/build-content.sh`**

Thêm `"$DEST/springsec"` vào lệnh `mkdir -p` và một dòng `cp`. Khối sau khi sửa:

```bash
mkdir -p "$DEST/java" "$DEST/images" "$DEST/sysprog/images" \
         "$DEST/k8sbook/images" "$DEST/springsec"

cp "$REPO"/CKAD/*.md "$REPO"/CKA/*.md "$REPO"/CKS/*.md  "$DEST/"
cp "$REPO/Chủ đề"*/*.md                                 "$DEST/java/"
cp "$REPO"/images/*                                     "$DEST/images/"
cp "$REPO"/System_Programming_VI/*.md                   "$DEST/sysprog/"
cp "$REPO"/System_Programming_VI/images/*               "$DEST/sysprog/images/"
cp "$REPO"/k8s-ebook/*.md                               "$DEST/k8sbook/"
cp -R "$REPO"/k8s-ebook/images/.                        "$DEST/k8sbook/images/"
cp "$REPO"/spring-security-vi/*.md                      "$DEST/springsec/"
```

Không có dòng ảnh: `spring-security-vi/` **không có thư mục `images/`**.

- [ ] **Step 3: Chạy lại lệnh kiểm chứng — phải thành công**

```bash
find webapp/content -mindepth 1 -delete
./webapp/build-content.sh webapp/content
echo "md: $(ls webapp/content/springsec/*.md | wc -l | tr -d ' ')  (kỳ vọng 22)"
test -f webapp/content/springsec/03-quan-ly-nguoi-dung.md && echo "tệp mẫu OK"
```

Kỳ vọng: `md: 22` (21 tệp nội dung + `README.md` cũng được copy, vô hại — không mục docs nào trỏ tới nó, giống cách `sysprog/` và `k8sbook/` đang làm), `tệp mẫu OK`.

- [ ] **Step 4: Khai lĩnh vực trong `webapp/js/data/fields.js`**

Thêm vào object `FIELDS`, sau khoá `java`:

```js
  "spring-security": {
    label: "Spring Security",
    icon: "🔒",
    desc: "Bản dịch tiếng Việt Spring Security in Action, ấn bản 2 (Laurențiu Spilcă, Manning 2024) — xác thực, phân quyền, CSRF/CORS, OAuth 2 & OIDC, ứng dụng phản ứng và kiểm thử cấu hình bảo mật.",
    certFilter: false,
    // Mở dần theo dữ liệu: "docs" thêm ở Task 2, "roadmap" ở Task 4.
    // Khai sớm là bất biến #7 báo đỏ.
    modules: ["dashboard"],
    externalRef: { label: "docs.spring.io/spring-security", href: "https://docs.spring.io/spring-security/reference/" },
  },
```

Và sửa `FIELD_ORDER`:

```js
export const FIELD_ORDER = ["kubernetes", "sysprog", "java", "spring-security"];
```

**Chỉ khai `["dashboard"]` ở bước này.** Lĩnh vực chưa có tài liệu nào; khai `"docs"` bây giờ là bất biến #7 báo đỏ ngay.

- [ ] **Step 5: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH 28/28. Bốn bất biến đang làm việc thầm lặng ở đây: `#5` (module `dashboard` là view có thật), `FIELD_ORDER khớp FIELDS 1-1`, `#7` (không khai module thiếu dữ liệu), `#7b` (không khai module riêng Kubernetes), `navFor()` lọc đúng.

- [ ] **Step 6: Chứng minh bất biến #7 bắt được lỗi thật**

Đổi tạm `modules` thành `["dashboard", "docs"]`, chạy `node webapp/check-data.mjs`, xác nhận ĐỎ với `spring-security khai "docs" nhưng không có dữ liệu`. Hoàn tác về `["dashboard"]`.

- [ ] **Step 7: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh 8888
```

Bộ chọn lĩnh vực hiện **4** mục; chọn "Spring Security" thì sidebar chỉ còn "Bảng điều khiển", và bảng điều khiển hiện 0 tài liệu / 0 lộ trình mà không lỗi console. Dừng server, xoá localStorage thử nghiệm.

- [ ] **Step 8: Commit**

```bash
git add webapp/build-content.sh webapp/js/data/fields.js
git commit -m "feat: khai lĩnh vực Spring Security và copy bản dịch vào content/"
```

---

### Task 2: 21 tài liệu Spring Security

**Files:**
- Modify: `webapp/js/data/docs-index.js` (thêm vào cuối mảng `docs`)
- Modify: `webapp/js/data/fields.js` (bật module `"docs"`)
- Modify: `webapp/check-data.mjs` (bảng `EXPECTED.counts`)

**Interfaces:**
- Consumes: `content/springsec/*.md` (Task 1) và khoá lĩnh vực `"spring-security"` (Task 1).
- Produces: 21 doc id `springsec-00` … `springsec-18`, `springsec-pl-a`, `springsec-pl-b`, tất cả `field: "spring-security"`. Task 3 và 4 link tới các id này bằng `#/docs/<id>`.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts`:

```js
    "docs:spring-security": 21,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `docs:spring-security: kỳ vọng 21, thực tế 0`.

- [ ] **Step 3: Thêm 21 entry vào cuối mảng `docs` trong `webapp/js/data/docs-index.js`**

Chèn ngay trước dấu `];` đóng mảng:

```js
  // ===== Spring Security in Action, ấn bản 2 (bản dịch) — đọc theo thứ tự chương =====
  // Nguồn PDF gốc thiếu thân chương 14 (§14.1–14.5) và mục 15.1; các mục dưới
  // đây nói rõ chỗ nào thiếu thay vì giấu đi.
  {
    id: "springsec-00",
    field: "spring-security",
    title: "SSIA 00 — Lời giới thiệu & về cuốn sách",
    file: "content/springsec/00-loi-gioi-thieu-va-ve-cuon-sach.md",
    icon: "📖",
    desc: "Lời giới thiệu, lời nói đầu, cách cuốn sách được tổ chức và cách đọc. Đọc dạo đầu trước khi vào chương 1.",
    tags: ["Spring Security in Action", "Mở đầu"],
  },
  {
    id: "springsec-01",
    field: "spring-security",
    title: "SSIA 01 — Bảo mật ngày nay",
    file: "content/springsec/01-bao-mat-ngay-nay.md",
    icon: "🛡️",
    desc: "Bảo mật phần mềm là gì, vì sao nó quan trọng, và lộ trình cuốn sách sẽ dẫn bạn đi.",
    tags: ["Spring Security in Action", "Nhập môn"],
  },
  {
    id: "springsec-02",
    field: "spring-security",
    title: "SSIA 02 — Xin chào, Spring Security",
    file: "content/springsec/02-xin-chao-spring-security.md",
    icon: "👋",
    desc: "Dự án Spring Security đầu tiên, bức tranh tổng thể về thiết kế lớp, và cách ghi đè cấu hình mặc định.",
    tags: ["Spring Security in Action", "Khởi động", "Kiến trúc"],
  },
  {
    id: "springsec-03",
    field: "spring-security",
    title: "SSIA 03 — Quản lý người dùng",
    file: "content/springsec/03-quan-ly-nguoi-dung.md",
    icon: "👤",
    desc: "Giao ước UserDetails và GrantedAuthority, UserDetailsService và UserDetailsManager — cách Spring Security biết người dùng là ai.",
    tags: ["Spring Security in Action", "UserDetails", "Xác thực"],
  },
  {
    id: "springsec-04",
    field: "spring-security",
    title: "SSIA 04 — Quản lý mật khẩu",
    file: "content/springsec/04-quan-ly-mat-khau.md",
    icon: "🔑",
    desc: "Giao ước PasswordEncoder, các cài đặt có sẵn, DelegatingPasswordEncoder để nâng cấp thuật toán, và mô-đun Spring Security Crypto.",
    tags: ["Spring Security in Action", "PasswordEncoder", "Mã hoá"],
  },
  {
    id: "springsec-05",
    field: "spring-security",
    title: "SSIA 05 — Bảo mật ứng dụng web bắt đầu từ các bộ lọc",
    file: "content/springsec/05-bao-mat-cua-ung-dung-web-bat-dau-tu-cac-bo-loc.md",
    icon: "🧱",
    desc: "Chuỗi bộ lọc trong kiến trúc Spring Security, cách chèn bộ lọc của bạn vào trước/sau/thay vị trí một bộ lọc có sẵn.",
    tags: ["Spring Security in Action", "Filter chain"],
  },
  {
    id: "springsec-06",
    field: "spring-security",
    title: "SSIA 06 — Triển khai các phương thức xác thực",
    file: "content/springsec/06-trien-khai-cac-phuong-thuc-xac-thuc.md",
    icon: "🔐",
    desc: "AuthenticationProvider và logic xác thực tuỳ chỉnh, SecurityContext và chiến lược lưu giữ, HTTP Basic và đăng nhập bằng biểu mẫu.",
    tags: ["Spring Security in Action", "AuthenticationProvider", "SecurityContext"],
  },
  {
    id: "springsec-07",
    field: "spring-security",
    title: "SSIA 07 — Phân quyền cấp endpoint: giới hạn truy cập",
    file: "content/springsec/07-cau-hinh-phan-quyen-cap-endpoint-gioi-han-truy-cap.md",
    icon: "🚧",
    desc: "Giới hạn truy cập dựa trên quyền hạn (authority) và vai trò (role), cùng khác biệt giữa hai khái niệm này.",
    tags: ["Spring Security in Action", "Phân quyền", "Role"],
  },
  {
    id: "springsec-08",
    field: "spring-security",
    title: "SSIA 08 — Phân quyền cấp endpoint: áp dụng các giới hạn",
    file: "content/springsec/08-cau-hinh-phan-quyen-cap-endpoint-ap-dung-cac-gioi-han.md",
    icon: "🎯",
    desc: "Dùng requestMatchers() để chọn endpoint, chọn yêu cầu áp hạn chế, và bộ khớp yêu cầu bằng biểu thức chính quy.",
    tags: ["Spring Security in Action", "requestMatchers"],
  },
  {
    id: "springsec-09",
    field: "spring-security",
    title: "SSIA 09 — Cấu hình bảo vệ chống CSRF",
    file: "content/springsec/09-cau-hinh-bao-ve-chong-csrf.md",
    icon: "🎭",
    desc: "Cơ chế CSRF hoạt động thế nào trong Spring Security, dùng nó trong kịch bản thực tế, và cách tuỳ chỉnh.",
    tags: ["Spring Security in Action", "CSRF"],
  },
  {
    id: "springsec-10",
    field: "spring-security",
    title: "SSIA 10 — Cấu hình CORS",
    file: "content/springsec/10-cau-hinh-cors.md",
    icon: "🌍",
    desc: "CORS hoạt động thế nào, áp dụng chính sách bằng annotation @CrossOrigin và bằng CorsConfigurer.",
    tags: ["Spring Security in Action", "CORS"],
  },
  {
    id: "springsec-11",
    field: "spring-security",
    title: "SSIA 11 — Phân quyền ở cấp độ phương thức",
    file: "content/springsec/11-trien-khai-phan-quyen-o-cap-do-phuong-thuc.md",
    icon: "🧩",
    desc: "Kích hoạt bảo mật phương thức, quy tắc tiền ủy quyền và hậu ủy quyền, và permission tuỳ chỉnh cho phương thức.",
    tags: ["Spring Security in Action", "Method security", "PreAuthorize"],
  },
  {
    id: "springsec-12",
    field: "spring-security",
    title: "SSIA 12 — Lọc ở cấp độ phương thức",
    file: "content/springsec/12-trien-khai-loc-o-cap-do-phuong-thuc.md",
    icon: "🧹",
    desc: "Tiền lọc và hậu lọc trong phân quyền phương thức, và cách dùng cơ chế lọc với repository Spring Data.",
    tags: ["Spring Security in Action", "PreFilter", "PostFilter"],
  },
  {
    id: "springsec-13",
    field: "spring-security",
    title: "SSIA 13 — OAuth 2 và OpenID Connect là gì?",
    file: "content/springsec/13-oauth-2-va-openid-connect-la-gi.md",
    icon: "🪪",
    desc: "Các vai trò trong OAuth 2, token đục và token rõ, các phương thức cấp quyền kèm PKCE và refresh token, cùng điểm yếu của OAuth 2.",
    tags: ["Spring Security in Action", "OAuth 2", "OIDC"],
  },
  {
    id: "springsec-14",
    field: "spring-security",
    title: "SSIA 14 — Máy chủ ủy quyền OAuth 2 (nguồn thiếu thân chương)",
    file: "content/springsec/14-trien-khai-mot-may-chu-uy-quyen-oauth-2.md",
    icon: "⚠️",
    desc: "CHỈ CÓ phần mở đầu giới thiệu vai trò máy chủ ủy quyền. Toàn bộ §14.1–14.5 (JWT, authorization code, client credentials, opaque token & introspection, thu hồi token) thiếu trong bản PDF gốc.",
    tags: ["Spring Security in Action", "OAuth 2", "Nguồn thiếu"],
  },
  {
    id: "springsec-15",
    field: "spring-security",
    title: "SSIA 15 — Máy chủ tài nguyên OAuth 2",
    file: "content/springsec/15-trien-khai-mot-may-chu-tai-nguyen-oauth-2.md",
    icon: "🗝️",
    desc: "JWT tuỳ chỉnh, xác thực token qua cơ chế introspection, và hệ thống đa khách thuê. Mục 15.1 thiếu trong bản PDF gốc.",
    tags: ["Spring Security in Action", "Resource server", "JWT"],
  },
  {
    id: "springsec-16",
    field: "spring-security",
    title: "SSIA 16 — Triển khai một client OAuth 2",
    file: "content/springsec/16-trien-khai-mot-client-oauth-2.md",
    icon: "📱",
    desc: "Đăng nhập bằng OAuth 2 và xây dựng một client gọi tới tài nguyên được bảo vệ.",
    tags: ["Spring Security in Action", "OAuth 2", "Client"],
  },
  {
    id: "springsec-17",
    field: "spring-security",
    title: "SSIA 17 — Bảo mật trong các ứng dụng phản ứng",
    file: "content/springsec/17-trien-khai-bao-mat-trong-cac-ung-dung-phan-ung.md",
    icon: "🌊",
    desc: "Ứng dụng phản ứng là gì, quản lý người dùng và quy tắc phân quyền trong ngữ cảnh phản ứng, và reactive OAuth 2 resource server.",
    tags: ["Spring Security in Action", "Reactive", "WebFlux"],
  },
  {
    id: "springsec-18",
    field: "spring-security",
    title: "SSIA 18 — Kiểm thử cấu hình bảo mật",
    file: "content/springsec/18-kiem-thu-cau-hinh-bao-mat.md",
    icon: "🧪",
    desc: "Người dùng giả lập, người dùng lấy từ UserDetailsService, đối tượng Authentication tuỳ chỉnh, kiểm thử bảo mật phương thức, xác thực và CSRF.",
    tags: ["Spring Security in Action", "Kiểm thử"],
  },
  {
    id: "springsec-pl-a",
    field: "spring-security",
    title: "SSIA Phụ lục A — Liên kết tài liệu chính thức",
    file: "content/springsec/phu-luc-a-lien-ket-tai-lieu-chinh-thuc.md",
    icon: "🔗",
    desc: "Các đường dẫn tới tài liệu chính thức của Spring Security và Spring Boot.",
    tags: ["Spring Security in Action", "Tham khảo"],
  },
  {
    id: "springsec-pl-b",
    field: "spring-security",
    title: "SSIA Phụ lục B — Tài liệu đọc thêm",
    file: "content/springsec/phu-luc-b-tai-lieu-doc-them.md",
    icon: "📗",
    desc: "Danh mục sách và tài liệu đọc thêm về bảo mật ứng dụng, mật mã học và Spring.",
    tags: ["Spring Security in Action", "Đọc thêm"],
  },
```

- [ ] **Step 4: Bật module `docs` trong `webapp/js/data/fields.js`**

```js
    modules: ["dashboard", "docs"],
```

Xoá dòng chú thích nói `"docs"` sẽ thêm ở Task 2, giữ lại phần nói `"roadmap"` thêm ở Task 4.

- [ ] **Step 5: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH. Bất biến "Mọi `docs[].file` tồn tại trên đĩa" đang xác minh 21 đường dẫn mới — nếu Task 1 copy sai chỗ, nó đỏ ở đây.

- [ ] **Step 6: Chứng minh bất biến bắt được lỗi thật**

Đổi tạm `file` của `springsec-05` thành `content/springsec/khong-ton-tai.md`, chạy lại, xác nhận ĐỎ với `thiếu file:`. Hoàn tác.

- [ ] **Step 7: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh 8888
```

- Chọn lĩnh vực "Spring Security": sidebar có "Bảng điều khiển" + "Tài liệu".
- `#/docs` hiện **21** thẻ.
- Mở `#/docs/springsec-03`, xác nhận nội dung tải được và mục lục nổi hoạt động.
- Mở `#/docs/springsec-14`, xác nhận khối cảnh báo `⚠️ Ghi chú về nguồn` của chính tệp nguồn hiện ra.
- Deep-link: từ lĩnh vực Kubernetes mở `#/docs/springsec-01`, app phải tự chuyển sang lĩnh vực Spring Security.

Dừng server, xoá localStorage thử nghiệm.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/docs-index.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "feat: 21 tài liệu Spring Security in Action vào thư viện"
```

---

### Task 3: Track `springsec` — tuần 1–5 (18 mục)

**Files:**
- Create: `webapp/js/data/springsec-roadmap-part1.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/js/data/fields.js` (bật module `"roadmap"`)
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `springsec-00` … `springsec-pl-b` (Task 2).
- Produces: `export const springsecWeeksPart1` — mảng 5 tuần, id `ss-w1` … `ss-w5`, tổng **18** mục id `ss-w1-1` … `ss-w5-4`. Track id `springsec` với `field: "spring-security"`. Task 4 nối tiếp từ `ss-w6`.

**Phân bổ mục:** tuần 1: 4 · tuần 2: 3 · tuần 3: 3 · tuần 4: 4 · tuần 5: 4 = **18**.

| Tuần | id | Tiêu đề | Chương nguồn |
|---|---|---|---|
| 1 | `ss-w1` | Nền tảng bảo mật & dự án đầu tiên | Ch.1 (`springsec-01`), Ch.2 (`springsec-02`) |
| 2 | `ss-w2` | Quản lý người dùng | Ch.3 (`springsec-03`) |
| 3 | `ss-w3` | Quản lý mật khẩu | Ch.4 (`springsec-04`) |
| 4 | `ss-w4` | Bộ lọc & phương thức xác thực | Ch.5 (`springsec-05`), Ch.6 (`springsec-06`) |
| 5 | `ss-w5` | Phân quyền cấp endpoint | Ch.7 (`springsec-07`), Ch.8 (`springsec-08`) |

**Bảng mục — id, nội dung, mục sách phải đọc:**

| id | `text` | Đọc |
|---|---|---|
| `ss-w1-1` | Bảo mật phần mềm là gì, và vì sao một lỗ hổng lại đắt đến thế | §1.2–1.3 |
| `ss-w1-2` | Dựng dự án Spring Security đầu tiên và đọc hiểu cấu hình mặc định | §2.1 |
| `ss-w1-3` | Thiết kế lớp: từ bộ lọc tới AuthenticationProvider và UserDetailsService | §2.2 |
| `ss-w1-4` | Ghi đè cấu hình mặc định — ba thứ đầu tiên bạn luôn phải thay | §2.3 |
| `ss-w2-1` | Các thành phần tham gia luồng xác thực | §3.1 |
| `ss-w2-2` | UserDetails và GrantedAuthority — mô tả người dùng | §3.2 |
| `ss-w2-3` | UserDetailsService và UserDetailsManager — tự quản lý người dùng | §3.3 |
| `ss-w3-1` | Giao ước PasswordEncoder và các cài đặt có sẵn | §4.1.1–4.1.3 |
| `ss-w3-2` | DelegatingPasswordEncoder và bài toán nâng cấp thuật toán | §4.1.4 |
| `ss-w3-3` | Spring Security Crypto: bộ tạo khoá và bộ mã hoá | §4.2 |
| `ss-w4-1` | Chuỗi bộ lọc và cách chèn bộ lọc của bạn vào đúng chỗ | §5.1–5.4 |
| `ss-w4-2` | Các bộ lọc Spring Security cung cấp sẵn | §5.5 |
| `ss-w4-3` | AuthenticationProvider — viết logic xác thực của riêng bạn | §6.1 |
| `ss-w4-4` | SecurityContext, chiến lược lưu giữ, HTTP Basic và form login | §6.2–6.3 |
| `ss-w5-1` | Quyền hạn (authority) khác vai trò (role) ở đâu | §7.1 |
| `ss-w5-2` | Dùng requestMatchers() để chọn đúng endpoint | §8.1 |
| `ss-w5-3` | Chọn yêu cầu để áp hạn chế phân quyền | §8.2 |
| `ss-w5-4` | Bộ khớp yêu cầu bằng biểu thức chính quy | §8.3 |

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, thêm vào `EXPECTED.counts`:

```js
    "roadmap-items:spring-security": 18,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:spring-security: kỳ vọng 18, thực tế 0`.

- [ ] **Step 3: Viết `webapp/js/data/springsec-roadmap-part1.js`**

Cấu trúc tuần: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

**Khuôn mẫu để bắt giọng — đọc trước khi viết:** `webapp/js/data/k8sbook-roadmap-part1.js` đã có sẵn trong repo. Đó là giáo trình đọc sách của Đợt 1, cùng thể loại, và **đã qua một vòng review đối chiếu ngược từng trích dẫn về tệp nguồn**. Dùng nó làm chuẩn về giọng văn, độ dài, cách viết bốn khối và cách trích mục sách — thay vì tự nghĩ ra kiểu riêng.

Kế hoạch này cố ý **không viết sẵn một bài học mẫu**: ở Đợt 1, cả hai lỗi thật tìm được đều nằm trong đoạn mẫu do kế hoạch cung cấp, còn những mục người triển khai tự viết sau khi mở sách đọc thì không mắc lỗi nào.

**Lưu ý về `goal`:** trường này được render là **plain text**, không phải markdown (chỉ `practice` mới đi qua `inlineMd`). Đừng dùng backtick hay `**` trong `goal`.

Mỗi `lesson` là **kế hoạch học, không phải bài giảng** — 4 khối cố định, khoảng 120–220 từ:

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [§X.Y Tên mục](#/docs/springsec-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Bốn quy tắc bắt buộc khi viết `lesson`:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng tệp `spring-security-vi/NN-*.md`, đọc mục được trích, rồi mới viết. Không suy diễn từ kiến thức Spring Security chung.
2. **Trích đúng số mục và đúng tiêu đề sách thật có.** Dùng `grep -nF` để đối chiếu, dán số dòng tuyệt đối trong tệp.
3. **Khối `Tự kiểm tra` phải trả lời được bằng chính mục vừa đọc**, không cần tài liệu ngoài. Quy tắc này thắng mọi đoạn văn mẫu — nếu đoạn mẫu dưới đây vi phạm, sửa luôn và ghi rõ trong báo cáo kèm bằng chứng `grep`.
4. **Nếu nguồn không chứa nội dung mà bảng mục giả định** (xem mục "Khiếm khuyết nguồn đã biết"), DỪNG và báo, không lấp bằng kiến thức của bạn.

Tuần 1 làm khuôn:

```js
// Lộ trình đọc Spring Security in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Spring Security in Action", ấn bản 2 —
// Laurențiu Spilcă, Manning 2024. Thư mục nguồn: spring-security-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const springsecWeeksPart1 = [
  {
    id: "ss-w1",
    week: "Tuần 1",
    title: "Nền tảng bảo mật & dự án đầu tiên",
    goal: "Dựng được một ứng dụng Spring Boot có Spring Security, giải thích được điều gì xảy ra khi bạn chỉ thêm dependency mà chưa viết dòng cấu hình nào.",
    practice: "Tạo dự án Spring Boot với `spring-boot-starter-security`, chạy lên, gọi thử một endpoint bằng `curl` không kèm thông tin xác thực rồi kèm thông tin xác thực mặc định, và đọc mật khẩu sinh ra trong log.",
    resources: [
      { label: "SSIA 00 — Lời giới thiệu & về cuốn sách", href: "#/docs/springsec-00" },
      { label: "SSIA 01 — Bảo mật ngày nay", href: "#/docs/springsec-01" },
      { label: "SSIA 02 — Xin chào, Spring Security", href: "#/docs/springsec-02" },
      { label: "docs.spring.io — Spring Security Reference", href: "https://docs.spring.io/spring-security/reference/" },
    ],
    items: [
      // 4 mục ss-w1-1 … ss-w1-4 — lấy `id` và `text` nguyên văn từ "Bảng mục"
      // ở đầu Task 3, `lesson` theo 4 khối + 4 quy tắc nêu ở Step 3 này.
    ],
  },
  // Tuần 2–5: cùng cách làm.
  // Số mục mỗi tuần: ss-w2: 3 · ss-w3: 3 · ss-w4: 4 · ss-w5: 4.
];
```

- [ ] **Step 4: Đăng ký track trong `webapp/js/data/roadmap.js`**

Thêm import sau các import `k8sbook`:

```js
import { springsecWeeksPart1 } from "./springsec-roadmap-part1.js";
```

Thêm phần tử vào cuối mảng `tracks` (sau `sysprog`):

```js
  {
    id: "springsec",
    field: "spring-security",
    label: "Spring Security",
    icon: "🔒",
    name: "Đọc Spring Security in Action (ấn bản 2)",
    durationWeeks: 9,
    desc: "Kế hoạch đọc 9 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra.",
    prereq: "Yêu cầu: biết Java và Spring Boot cơ bản (REST controller, dependency injection). Không cần biết Spring Security trước.",
    weeks: [...springsecWeeksPart1],
  },
```

Cập nhật khối chú thích đầu file, thêm dòng:

```js
//   SSIA: springsec-roadmap-part{1,2}.js (Tuần 1–5 / 6–9)       — 30 mục
```

- [ ] **Step 5: Bật module `roadmap` trong `webapp/js/data/fields.js`**

```js
    modules: ["dashboard", "docs", "roadmap"],
```

Xoá nốt dòng chú thích về việc mở dần.

- [ ] **Step 6: Chạy — phải xanh**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: XANH. Ba bất biến làm việc thầm lặng: id mục duy nhất, mọi link `#/docs/…` trong `lesson` trỏ tới doc có thật, và link đó **cùng lĩnh vực với track**.

- [ ] **Step 7: Chứng minh bất biến link bắt được lỗi thật**

Đổi tạm một link trong `lesson` thành `#/docs/springsec-99`, chạy lại, xác nhận ĐỎ với `link hỏng`. Rồi đổi thành `#/docs/k8sbook-05` (id có thật nhưng khác lĩnh vực), chạy lại, xác nhận ĐỎ với `link khác lĩnh vực`. Hoàn tác cả hai.

- [ ] **Step 8: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh 8888
```

- Lĩnh vực Spring Security: sidebar có "Bảng điều khiển", "Lộ trình học", "Tài liệu" — và **không** có Chứng chỉ / Thực hành nhanh / Thi thử / Labs.
- `#/roadmap` hiện **1** giáo trình; `#/roadmap/springsec` mở được với 5 tuần.
- Tick vài mục rồi reload — tiến độ còn. Tick ở CKAD và `k8sbook` **không** bị ảnh hưởng.
- `goal` của mỗi tuần hiện sạch, không lọt ký tự markdown thô.

Dừng server, xoá localStorage thử nghiệm.

- [ ] **Step 9: Commit**

```bash
git add webapp/js/data/springsec-roadmap-part1.js webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/check-data.mjs
git commit -m "feat: lộ trình đọc Spring Security in Action tuần 1-5 (18 mục)"
```

---

### Task 4: Track `springsec` — tuần 6–9 (12 mục)

**Files:**
- Create: `webapp/js/data/springsec-roadmap-part2.js`
- Modify: `webapp/js/data/roadmap.js`
- Modify: `webapp/check-data.mjs` (bảng kỳ vọng)

**Interfaces:**
- Consumes: doc id `springsec-09` … `springsec-18` (Task 2); nối tiếp id tuần từ `springsecWeeksPart1` (Task 3).
- Produces: `export const springsecWeeksPart2` — mảng 4 tuần, id `ss-w6` … `ss-w9`, tổng **12** mục id `ss-w6-1` … `ss-w9-2`. Sau task này track `springsec` đủ 30 mục.

**Phân bổ mục:** tuần 6: 3 · tuần 7: 3 · tuần 8: 4 · tuần 9: 2 = **12**.

| Tuần | id | Tiêu đề | Chương nguồn |
|---|---|---|---|
| 6 | `ss-w6` | CSRF & CORS | Ch.9 (`springsec-09`), Ch.10 (`springsec-10`) |
| 7 | `ss-w7` | Phân quyền & lọc cấp phương thức | Ch.11 (`springsec-11`), Ch.12 (`springsec-12`) |
| 8 | `ss-w8` | OAuth 2 & OpenID Connect | Ch.13 (`springsec-13`), Ch.15 (`springsec-15`), Ch.16 (`springsec-16`) |
| 9 | `ss-w9` | Ứng dụng phản ứng & kiểm thử | Ch.17 (`springsec-17`), Ch.18 (`springsec-18`) |

**Bảng mục:**

| id | `text` | Đọc |
|---|---|---|
| `ss-w6-1` | CSRF hoạt động thế nào trong Spring Security | §9.1 |
| `ss-w6-2` | CSRF trong kịch bản thực tế, và khi nào được phép tắt | §9.2–9.3 |
| `ss-w6-3` | CORS: @CrossOrigin và CorsConfigurer | §10.1–10.3 |
| `ss-w7-1` | Kích hoạt bảo mật phương thức, tiền ủy quyền và hậu ủy quyền | §11.1–11.3 |
| `ss-w7-2` | Permission tuỳ chỉnh cho phương thức | §11.4 |
| `ss-w7-3` | Tiền lọc, hậu lọc, và lọc trong repository Spring Data | §12.1–12.3 |
| `ss-w8-1` | Các vai trò trong OAuth 2, và token đục khác token rõ ở đâu | §13.1–13.2 |
| `ss-w8-2` | Các phương thức cấp quyền, PKCE và refresh token | §13.3–13.4 |
| `ss-w8-3` | Resource server: JWT tuỳ chỉnh, introspection, đa khách thuê | §15.2–15.4 |
| `ss-w8-4` | Client OAuth 2: đăng nhập và gọi tài nguyên được bảo vệ | §16.1–16.2 |
| `ss-w9-1` | Bảo mật trong ứng dụng phản ứng | §17.1–17.4 |
| `ss-w9-2` | Kiểm thử cấu hình bảo mật | §18.1–18.6 |

**Cảnh báo riêng cho tuần 8:** chương 14 (máy chủ ủy quyền) **không có thân chương** trong nguồn, và chương 15 **thiếu §15.1**. Vì vậy tuần 8 không có mục nào giao đọc §14.1–14.5 hay §15.1. Khối `resources` của tuần 8 được phép trỏ tới `#/docs/springsec-14` như phần mở đầu khái niệm, nhưng nhãn phải nói rõ nguồn thiếu, và nên kèm một link ngoài tới tài liệu chính thức của Spring Authorization Server để người học bù phần thiếu.

- [ ] **Step 1: Đặt kỳ vọng — phải đỏ**

Trong `webapp/check-data.mjs`, sửa `18` thành:

```js
    "roadmap-items:spring-security": 30,
```

- [ ] **Step 2: Chạy — phải đỏ**

```bash
node webapp/check-data.mjs
```

Kỳ vọng: ĐỎ với `roadmap-items:spring-security: kỳ vọng 30, thực tế 18`.

- [ ] **Step 3: Viết `webapp/js/data/springsec-roadmap-part2.js`**

Cấu trúc tuần: `{ id, week, title, goal, practice, resources: [{label, href}], items: [{id, text, lesson}] }`.

**Khuôn mẫu để bắt giọng — đọc trước khi viết:** `webapp/js/data/k8sbook-roadmap-part1.js` đã có sẵn trong repo. Đó là giáo trình đọc sách của Đợt 1, cùng thể loại, và **đã qua một vòng review đối chiếu ngược từng trích dẫn về tệp nguồn**. Dùng nó làm chuẩn về giọng văn, độ dài, cách viết bốn khối và cách trích mục sách — thay vì tự nghĩ ra kiểu riêng.

Kế hoạch này cố ý **không viết sẵn một bài học mẫu**: ở Đợt 1, cả hai lỗi thật tìm được đều nằm trong đoạn mẫu do kế hoạch cung cấp, còn những mục người triển khai tự viết sau khi mở sách đọc thì không mắc lỗi nào.

**Lưu ý về `goal`:** render là plain text, không phải markdown — đừng dùng backtick hay `**` trong `goal`.

Mỗi `lesson` gồm 4 khối cố định, khoảng 120–220 từ:

```
**Mục tiêu.** <điều người học phải làm được sau mục này>

**Đọc.** [§X.Y Tên mục](#/docs/springsec-NN) — <chỉ dẫn đọc gì, bỏ qua gì>

**Bẫy.** <hiểu lầm hoặc lỗi kinh điển ở đúng chỗ này>

**Tự kiểm tra.** <1–2 câu hỏi tự trả lời, không kèm đáp án>
```

Bốn quy tắc bắt buộc:

1. **Chỉ khẳng định điều sách thật sự nói.** Mở đúng tệp `spring-security-vi/NN-*.md`, đọc mục được trích, rồi mới viết.
2. **Trích đúng số mục và đúng tiêu đề sách thật có**, kiểm bằng `grep -nF`, dán số dòng tuyệt đối.
3. **Khối `Tự kiểm tra` phải trả lời được bằng chính mục vừa đọc.** Quy tắc này thắng mọi đoạn văn mẫu.
4. **Nếu nguồn không chứa nội dung bảng mục giả định**, DỪNG và báo, không lấp bằng kiến thức của bạn.

Header tệp và tuần 6 làm khuôn:

```js
// Lộ trình đọc Spring Security in Action — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Spring Security in Action", ấn bản 2 —
// Laurențiu Spilcă, Manning 2024. Thư mục nguồn: spring-security-vi/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ss-w<N> / ss-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const springsecWeeksPart2 = [
  {
    id: "ss-w6",
    week: "Tuần 6",
    title: "CSRF & CORS",
    goal: "Giải thích được vì sao tắt CSRF là lựa chọn có điều kiện chứ không phải mặc định an toàn, và cấu hình được CORS đúng chỗ thay vì rắc annotation khắp nơi.",
    practice: "Bật CSRF trên một form đơn giản, xem token trong HTML và trong request; rồi gọi cùng endpoint đó từ một trang ở origin khác để tự thấy trình duyệt chặn ở đâu.",
    resources: [
      { label: "SSIA 09 — Cấu hình bảo vệ chống CSRF", href: "#/docs/springsec-09" },
      { label: "SSIA 10 — Cấu hình CORS", href: "#/docs/springsec-10" },
    ],
    items: [
      // ss-w6-1, ss-w6-2, ss-w6-3 — lấy `id` và `text` nguyên văn từ "Bảng mục"
      // ở đầu Task 4, `lesson` theo 4 khối + 4 quy tắc nêu ở Step 3 này.
    ],
  },
  // Tuần 7–9: cùng cách làm.
  // Số mục mỗi tuần: ss-w7: 3 · ss-w8: 4 · ss-w9: 2.
];
```

- [ ] **Step 4: Nối part2 vào track trong `webapp/js/data/roadmap.js`**

Thêm import:

```js
import { springsecWeeksPart2 } from "./springsec-roadmap-part2.js";
```

Sửa `weeks` của track `springsec`:

```js
    weeks: [...springsecWeeksPart1, ...springsecWeeksPart2],
```

- [ ] **Step 5: Chạy — phải xanh**

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Kỳ vọng: XANH, `roadmap-items:spring-security` = 30.

- [ ] **Step 6: Kiểm bằng trình duyệt**

```bash
./webapp/dev.sh 8888
```

`#/roadmap/springsec` hiện đủ 9 tuần, 30 mục; nút "Tiếp tục học" nhảy đúng mục chưa xong; tuần 8 có link tới `#/docs/springsec-14` với nhãn nói rõ nguồn thiếu. Dừng server, xoá localStorage thử nghiệm.

- [ ] **Step 7: Commit**

```bash
git add webapp/js/data/springsec-roadmap-part2.js webapp/js/data/roadmap.js webapp/check-data.mjs
git commit -m "feat: lộ trình đọc Spring Security in Action tuần 6-9 — đủ 30 mục"
```

---

### Task 5: Cập nhật tài liệu & nghiệm thu Đợt 2

**Files:**
- Modify: `README.md`
- Modify: `webapp/README.md`

**Interfaces:**
- Consumes: toàn bộ kết quả Task 1–4.
- Produces: không có API mới. Đây là cổng nghiệm thu của Đợt 2.

- [ ] **Step 1: Lấy số liệu thật, không chép từ trí nhớ**

Cờ `--input-type=module` phải đứng **trước** `-e`, và lệnh chạy từ trong `webapp/`:

```bash
cd webapp && node --input-type=module -e '
const {allDocs, allTracks} = await import("./js/data/index.js");
const per = {};
for (const d of allDocs) per[d.field ?? "kubernetes"] = (per[d.field ?? "kubernetes"] ?? 0) + 1;
console.log("docs:", allDocs.length, JSON.stringify(per));
console.log("tracks:", allTracks.length, "| items:",
  allTracks.reduce((n,t)=>n+t.weeks.flatMap(w=>w.items).length,0));
'
```

Kỳ vọng: `docs: 73 {"kubernetes":24,"java":10,"sysprog":18,"spring-security":21}` · `tracks: 6 | items: 264`.
(Trước Đợt 2: `docs: 52` · `tracks: 5 | items: 234`.)

- [ ] **Step 2: Cập nhật `webapp/README.md`**

- Đoạn mở đầu: **3 lĩnh vực → 4**, bổ sung **Spring Security**.
- Bảng tính năng, dòng 🗺️ Lộ trình học: `5 giáo trình` → `6 giáo trình`, `234 mục` → `264 mục`, thêm mô tả lộ trình đọc *Spring Security in Action* (9 tuần, 30 mục).
- Bảng tính năng, dòng 📚 Thư viện tài liệu: `52 tài liệu` → `73 tài liệu`, `3 lĩnh vực` → `4 lĩnh vực`, thêm `21 Spring Security`.
- Mục "Bộ chọn lĩnh vực": danh sách lĩnh vực thêm `Spring Security`; câu ví dụ về module bị ẩn nên nhắc lĩnh vực Spring Security chỉ có Bảng điều khiển + Lộ trình + Tài liệu.
- Mục "Chạy local": danh sách thư mục `build-content.sh` copy phải **thêm `spring-security-vi/`**. Hãy `cat webapp/build-content.sh` và đối chiếu để danh sách khớp đúng mọi nguồn.
- Sơ đồ "Cấu trúc mã": thêm dòng
  `│   ├── springsec-roadmap-part*.js   # sách Spring Security in Action`
  và sửa chú thích `fields.js` từ `khai 3 lĩnh vực` → `khai 4 lĩnh vực`.
- Mục "Kiểm tra dữ liệu": số bất biến lấy đúng dòng cuối `node webapp/check-data.mjs`.

- [ ] **Step 3: Cập nhật `README.md` gốc**

- Trong bảng thành phần DevPrep, thêm dòng sau dòng `k8s-ebook/`:

```markdown
| [`spring-security-vi/`](./spring-security-vi/) | Bản dịch tiếng Việt *Spring Security in Action*, ấn bản 2 (Laurențiu Spilcă, Manning 2024) — 18 chương + 2 phụ lục. Đọc trong app ở lĩnh vực Spring Security. |
```

- Câu dẫn mục DevPrep: bổ sung bản dịch *Spring Security in Action* vào danh sách.
- Dòng mô tả `webapp/`: `5 giáo trình, 234 mục` → `6 giáo trình, 264 mục`; `52 tài liệu` → `73 tài liệu`.

- [ ] **Step 4: Rà lượt cuối cho hết lớp lỗi "câu văn xuôi đã cũ"**

Quét cả hai README tìm mọi câu mô tả phạm vi, thành phần hoặc danh sách mà Đợt 2 đã làm cho không còn đúng hoặc không còn đủ — kể cả câu không nằm trong các bước trên. Sửa hết. Liệt kê trong báo cáo những mục đã rà.

- [ ] **Step 5: Chạy toàn bộ cổng kiểm**

```bash
find webapp/content -mindepth 1 -delete
./webapp/build-content.sh webapp/content
node webapp/check-data.mjs
```

Kỳ vọng: XANH toàn bộ, **0 bất biến bị bỏ qua** (dòng cuối không có chữ "bỏ qua").

- [ ] **Step 6: Smoke checklist đầy đủ**

```bash
./webapp/dev.sh 8888
```

- [ ] Bộ chọn lĩnh vực có **4** mục
- [ ] Lĩnh vực Spring Security: sidebar chỉ có Bảng điều khiển · Lộ trình học · Tài liệu
- [ ] `#/docs` ở lĩnh vực Spring Security: **21** thẻ
- [ ] `#/docs/springsec-14` hiện rõ cảnh báo thiếu nguồn
- [ ] `#/roadmap/springsec`: 9 tuần, 30 mục, tiến độ giữ sau reload
- [ ] Deep-link `#/docs/springsec-03` khi đang ở lĩnh vực Kubernetes thì tự chuyển lĩnh vực
- [ ] Ba lĩnh vực cũ không đổi: `#/docs` ở Kubernetes vẫn 24 thẻ, `#/roadmap` vẫn 4 giáo trình
- [ ] Tiến độ lộ trình cũ trong `localStorage` không mất khi chuyển qua lại giữa 4 lĩnh vực

- [ ] **Step 7: Commit**

```bash
git add README.md webapp/README.md
git commit -m "docs: cập nhật số liệu sau khi thêm Spring Security in Action"
```

- [ ] **Step 8: Xác nhận CI sẽ qua**

```bash
git log --oneline -6
git status
```

Kỳ vọng: working tree sạch. Workflow `deploy-pages.yml` chạy `build-content.sh` rồi `check-data.mjs` — cả hai vừa chạy xanh ở local nên bước `check` sẽ qua.

## Tiêu chí hoàn thành

- `node webapp/check-data.mjs` xanh toàn bộ, không bất biến nào bị bỏ qua sau khi đã chạy `build-content.sh`
- Smoke checklist Task 5 đạt hết
- Hai README phản ánh đúng số liệu mới (73 tài liệu · 6 giáo trình · 264 mục · 4 lĩnh vực)
