# Tích hợp *Spring Start Here* vào DevPrep — thiết kế

Ngày: 2026-09-05
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `spring-start`

Spec chị em: [`2026-09-05-kafka-integration-design.md`](2026-09-05-kafka-integration-design.md).
Hai lĩnh vực độc lập, mỗi cái một spec, một kế hoạch, một phiên triển khai. **Thứ tự làm
không ràng buộc** — xem §10 về cách xử lý số liệu tài liệu để cuốn làm sau không sai số.

## 1. Bối cảnh

Commit `133fe65` đưa vào repo thư mục `Spring Start Here/`: 15 PDF chương, 16 tệp markdown
bản dịch tiếng Việt của *Spring Start Here* (Laurențiu Spilcă — Manning, 2021), và 179 ảnh.
Nội dung **đã dịch xong**; việc còn lại thuần tuý là tích hợp vào web app DevPrep.

Khuôn mẫu trực tiếp: lần thêm gần nhất — Modern Java in Action, merge `b97573b`.

Số liệu đã đo, không ước lượng:

| Chỉ số | Spring Start Here | MJIA (đối chiếu) |
|---|---:|---:|
| Tệp nội dung | **16** (15 chương + 1 hướng dẫn học) | 21 chương |
| Tổng số từ | **113.228** | 212.942 |
| Trung bình mỗi chương | 7.331 | 10.140 |
| Chương nặng nhất | ch.6 AOP — 9.819 | ch.6 — 15.047 |
| Chương nhẹ nhất | ch.13 Transaction — 5.027 | ch.8 — 5.524 |
| Số ảnh | **179** | 100 |

Toàn vẹn ảnh đã kiểm: **179 tệp, 179 lượt tham chiếu, 0 gãy, 0 mồ côi.**

Đây là **sách nhập môn** — chương đều tay và nhẹ hơn hẳn mọi cuốn đã tích hợp. Không chương
nào nặng gấp đôi mặt bằng.

### 1.1 Tệp `00` là hướng dẫn học, không phải chương sách

`00 Hướng dẫn học hiệu quả _ Spring Start Here.md` (3.265 từ, H1: *"Hướng dẫn học hiệu quả với
Spring Start Here"*) là tài liệu hướng dẫn cách học, do người dịch viết, **không có PDF tương
ứng** vì không phải chương của sách gốc.

Nó vẫn thành một bản ghi `docs` — đúng tiền lệ `k8sbook-00` và `springsec-00` đã có trong repo.
Nó là mục đọc đầu tiên của tuần 1.

### 1.2 Hình dạng nguồn khác mọi cuốn trước

Khác Kafka và MJIA (có sẵn tầng `vi/` và tệp `chuong-NN-slug.md`), thư mục này **phẳng và
mang tên tiếng Anh có dấu cách**:

```
Spring Start Here/
├── 8 Implementing web apps with Spring Boot and Spring MVC _ Spring Start Here.md
├── 8 Implementing web apps with Spring Boot and Spring MVC _ Spring Start Here.pdf
└── images/ch01 … ch15/
```

`.md` nằm cạnh `.pdf`, và `images/` cùng cấp với chúng. Việc chuẩn hoá vì thế **nặng hơn**
hai cuốn trước: phải đổi tên 16 tệp `.md` và 15 tệp `.pdf` sang slug tiếng Việt (§3).

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Module `["dashboard", "docs", "roadmap"]` | Đồng khuôn 5 lĩnh vực sách hiện có. |
| 2 | Lộ trình **8 tuần / 32 mục**, đều 4 mục/tuần | ~14,2k từ/tuần. Sách nhập môn nên lộ trình phải ngắn — người học cần xong sớm để sang Spring Security. Chương đều tay nên không cần nhịp lệch. |
| 3 | Doc id `springstart-00`…`springstart-15` (**16 tài liệu**) | `-00` cho hướng dẫn học, đúng tiền lệ `k8sbook-00` / `springsec-00`. |
| 4 | `FIELD_ORDER`: chèn **ngay trước** `spring-security` | Nó là bước đi trước; xếp cạnh nhau thì thứ tự sidebar tự kể đúng trình tự học. |
| 5 | **Hai** chip liên kết chéo: từ `ss-w1` và `sj-gd1-w8` | Hai neo có thật — xem §6. |
| 6 | Chip từ Spring Security đặt ở `ss-w1`, **không** ở `ss-w4`/`ss-w7` | Xem §6.1 — quyết định có tranh cãi, ghi rõ lý do. |
| 7 | Liên kết chéo ở mức **track**, không mức chương | Bất biến #3b — xem §6.2. |
| 8 | Chia 2 chặng, mỗi chặng tự chạy được | `fields.js` tự đặt luật. |

## 3. Nguồn: chuẩn hoá `spring-start-vi/`

`git mv "Spring Start Here" spring-start-vi`, rồi đổi tên 16 `.md` và 15 `.pdf` sang slug.
`images/` đi cùng nguyên khối — nó đã nằm cùng cấp với các `.md` nên đường dẫn tương đối
`images/chNN/...` **không gãy và không được sửa**.

Slug lấy từ chính tiêu đề H1 tiếng Việt trong tệp, **không dịch lại từ tên tiếng Anh**.

| # | `.md` mới | Tiêu đề H1 | Có `.pdf`? |
|---:|---|---|---|
| 00 | `00-huong-dan-hoc-hieu-qua.md` | Hướng dẫn học hiệu quả với *Spring Start Here* | **không** |
| 01 | `01-spring-trong-the-gioi-thuc.md` | 1 Spring trong thế giới thực | có |
| 02 | `02-spring-context-dinh-nghia-bean.md` | 2 Spring context: Định nghĩa bean | có |
| 03 | `03-spring-context-wiring-bean.md` | 3 Spring context: Wiring bean | có |
| 04 | `04-spring-context-su-dung-abstraction.md` | 4 Spring context: Sử dụng abstraction | có |
| 05 | `05-spring-context-bean-scope-va-vong-doi.md` | 5 Spring context: Bean scope và vòng đời | có |
| 06 | `06-su-dung-aspect-voi-spring-aop.md` | 6 Sử dụng aspect với Spring AOP | có |
| 07 | `07-tim-hieu-spring-boot-va-spring-mvc.md` | 7 Tìm hiểu Spring Boot và Spring MVC | có |
| 08 | `08-trien-khai-ung-dung-web-voi-spring-boot-va-spring-mvc.md` | 8 Triển khai ứng dụng web với Spring Boot và Spring MVC | có |
| 09 | `09-su-dung-cac-web-scope-cua-spring.md` | 9 Sử dụng các web scope của Spring | có |
| 10 | `10-trien-khai-rest-service.md` | 10 Triển khai REST service | có |
| 11 | `11-su-dung-cac-rest-endpoint.md` | 11 Sử dụng các REST endpoint | có |
| 12 | `12-su-dung-data-source-trong-ung-dung-spring.md` | 12 Sử dụng data source trong ứng dụng Spring | có |
| 13 | `13-su-dung-transaction-trong-ung-dung-spring.md` | 13 Sử dụng transaction trong ứng dụng Spring | có |
| 14 | `14-trien-khai-luu-tru-du-lieu-voi-spring-data.md` | 14 Triển khai lưu trữ dữ liệu với Spring Data | có |
| 15 | `15-kiem-thu-ung-dung-spring.md` | 15 Kiểm thử ứng dụng Spring | có |

Mỗi `.pdf` đổi tên thành `NN-<cùng slug>.pdf`. **Tệp `00` không có PDF** — đó là đúng nguồn,
không phải mất mát, và kế hoạch phải kiểm cặp `.md`/`.pdf` với ngoại lệ này (15 cặp, không 16).

Trước khi đổi tên: `grep -rn "Spring Start Here" --exclude-dir=.git .`. **Kết quả sẽ rất
nhiều và phần lớn hợp lệ** — đã đếm: **7 tệp trong `spring-security-vi/`** nhắc tên cuốn này
(`00`, `01`, `02`, `06`, `11`, `16`, `phu-luc-b`), cộng bản sao của chúng trong
`webapp/content/springsec/` nếu đã chạy build. Đó là **sách tự giới thiệu sách** — cùng tác
giả — **không phải tham chiếu đường dẫn**, và không được sửa.

Cách lọc đúng: chỉ quan tâm tham chiếu tới **đường dẫn thư mục**, không phải tên sách trong
văn xuôi:

```bash
grep -rn "Spring Start Here/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir="Spring Start Here" .
```

Kỳ vọng: **không dòng nào** (đã chạy thử, đúng 0 dòng). Dừng lại nếu có.

**Dùng `--exclude-dir`, không dùng `grep -v "^./..."`.** Trên máy này `grep -r .` không thêm
tiền tố `./` vào đường dẫn, nên bộ lọc dạng `^./` **không ăn** và sẽ cho cảm giác an toàn giả.

### 3.1 Ảnh — theo thư mục chương

179 ảnh trong `images/ch01`–`ch15`. Phân bố:

| ch01 | ch02 | ch03 | ch04 | ch05 | ch06 | ch07 | ch08 | ch09 | ch10 | ch11 | ch12 | ch13 | ch14 | ch15 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 14 | 13 | 12 | 10 | 16 | 18 | 11 | 15 | 11 | 11 | 9 | 8 | 12 | 11 |

Không có `ch00` — hướng dẫn học không có hình. Mọi chương đều có hình.

### 3.2 `webapp/build-content.sh`

```bash
# thêm vào lệnh mkdir -p sẵn có:
"$DEST/springstart/images"

# thêm 2 dòng cp:
cp    "$REPO"/spring-start-vi/*.md          "$DEST/springstart/"
cp -R "$REPO"/spring-start-vi/images/.      "$DEST/springstart/images/"
```

`.pdf` **không** copy sang `content/`.

Thư mục đích là `springstart` (một từ) để không đụng `springsec` khi nhìn lướt cây thư mục.

`Dockerfile` và `.github/workflows/deploy-pages.yml` không đổi.

## 4. Lĩnh vực mới — `webapp/js/data/fields.js`

```js
"spring-start": {
  label: "Spring Start Here",
  icon: "🌱",
  desc: "Bản dịch tiếng Việt Spring Start Here (Laurențiu Spilcă, Manning 2021) — sách " +
        "nhập môn Spring: context và bean, wiring, abstraction, bean scope, AOP, Spring " +
        "Boot và MVC, web scope, REST, data source, transaction, Spring Data và kiểm thử.",
  certFilter: false,
  modules: ["dashboard", "docs"],              // chặng 1
  // modules: ["dashboard", "docs", "roadmap"],   // chặng 2
  externalRef: { label: "spring.io — Spring Framework",
                 href: "https://spring.io/projects/spring-framework" },
},
```

`FIELD_ORDER` — chèn `spring-start` ngay **trước** `spring-security`:

```js
["kubernetes", "sysprog", "java", "modern-java", "ddia", "modern-concurrency",
 "spring-start", "spring-security", "senior-java"]
```

(Nếu lĩnh vực `kafka` đã được thêm trước, nó nằm giữa `ddia` và `modern-concurrency` — chèn
`spring-start` vào đúng chỗ trước `spring-security` bất kể `kafka` đã có hay chưa.)

Icon 🌱 không đụng icon nào đang dùng: ☸️ 🖥️ ☕ 🌊 🗄️ 📨 🧵 🔒 🧭.

**Bản quyền:** sách thương mại của Manning. Ghi đúng khuôn đã dùng cho `k8s-ebook`,
`spring-security-vi`, `ddia-vi`, `modern-java-vi`.

### Sơ đồ id

| Loại | Khuôn | Ví dụ |
|---|---|---|
| Lĩnh vực | `spring-start` | — |
| Tài liệu | `springstart-NN` | `springstart-00` … `springstart-15` |
| Track | `spring-start` | — |
| Tuần | `sh-wN` | `sh-w1` … `sh-w8` |
| Mục | `sh-wN-M` | `sh-w4-3` |

Tiền tố tuần là **`sh-`**, không phải `ss-` hay `ssh-`: `ss-w` đã thuộc Spring Security, và
`ssh-w1` chỉ khác `ss-w1` một ký tự — quá dễ nhầm khi đọc dữ liệu. `sh-` phân biệt được ngay.
`springstart-` không đụng `springsec-`.
**Mọi id là khoá localStorage — không được đổi về sau.**

## 5. Module `docs` — 16 tài liệu

16 bản ghi trong `webapp/js/data/docs-index.js`, nhóm
`// ===== Spring Start Here (Laurențiu Spilcă — Manning, 2021) =====`:

```js
{
  id: "springstart-06",
  field: "spring-start",
  title: "Spring Start 06 — Sử dụng aspect với Spring AOP",
  file: "content/springstart/06-su-dung-aspect-voi-spring-aop.md",
  icon: "🪝",
  desc: "<1–2 câu>",
  tags: ["AOP", "Aspect", "Proxy"],
}
```

`title` theo khuôn `Spring Start NN — <tiêu đề chương>`, bỏ số thứ tự lặp ở đầu H1
(`"2 Spring context: Định nghĩa bean"` → `"Spring Start 02 — Spring context: Định nghĩa bean"`).
Riêng `springstart-00` dùng `"Spring Start 00 — Hướng dẫn học hiệu quả"`.

Cập nhật khối chú thích đầu `docs-index.js` để thêm `spring-start-vi/`.

## 6. Liên kết chéo — hai chip

### 6.1 Hai neo có thật, và một quyết định có tranh cãi

**Neo mạnh nhất trong cả repo:** bản dịch *Spring Security in Action* — **cùng tác giả** — tự
giới thiệu cuốn này ở ba chỗ:

| Chỗ | Nguyên văn (rút gọn) |
|---|---|
| `springsec-06` | *"Để ôn lại kiến thức về tiêm phụ thuộc, tôi đề xuất cuốn sách Spring Start Here (Manning, 2021), một tác phẩm khác do tôi biên soạn."* |
| `springsec-11` | *"Nếu cần ôn lại kiến thức về aspect và AOP, bạn có thể tham khảo Chương 6 trong cuốn sách Spring Start Here…"* |
| `springsec-pl-b` | Mục "Spring Start Here viết bởi Laurențiu Spilcă (Manning, 2021)" trong danh sách đọc thêm |

Trong track `springsec`, `springsec-06` được đọc ở tuần **`ss-w4`** và `springsec-11` ở
**`ss-w7`**.

**Quyết định: đặt chip ở `ss-w1` ("Nền tảng bảo mật & dự án đầu tiên"), không ở `ss-w4`/`ss-w7`.**

Lý do: chip là biển chỉ đường, và giá trị của nó cao nhất ở **lối vào** track — nơi người đọc
còn kịp quyết định "học Spring Start Here trước đã". Đặt ở tuần 4 hay tuần 7 nghĩa là người
đọc chỉ gặp nó sau khi đã lạc. Một chip mức track cũng là con trỏ thô, phục vụ được cả hai
vai (điều kiện tiên quyết và ôn lại), nên không cần đặt hai chip trong cùng track.

**Đây là chỗ spec đi ngược neo văn bản có chủ đích** — ghi lại để người sau không tưởng là sót.

Neo thứ hai: `sj-gd1-w8` — `title: "Spring IoC & AOP — vén màn magic"` trong `senior-java-gd1.js`.

Cả hai thêm **đúng một** phần tử vào `resources` của tuần tương ứng:

```js
{ label: "🌱 Sang lĩnh vực Spring Start Here — lộ trình đọc 8 tuần",
  href: "#/roadmap/spring-start" }
```

**Không sửa chữ nào khác** của hai tuần đó. **Không thêm/bớt mục.**

**Hồi quy bắt buộc:** `"roadmap-items:spring-security"` vẫn **30** và
`"roadmap-items:senior-java"` vẫn **276** sau khi sửa.

### 6.2 Không liên kết chéo ở mức chương

Bất biến **#3b** quét `week.resources[].href` *và* `item.lesson`, bắt mọi link `#/docs/<id>`
phải cùng lĩnh vực với track chứa nó. `navigate()` (`webapp/js/app.js:159`) suy lĩnh vực từ
tài liệu được mở.

Cám dỗ ở đây lớn hơn mọi lần trước — sách Spring Security **chỉ đích danh "Chương 6 trong
Spring Start Here"**, nên rất muốn link thẳng `#/docs/springstart-06`. **Không được.** Không
nới bất biến, không thêm allowlist. `withBookRefs` giữ nguyên chữ ký cũ.

## 7. Module `roadmap` — track `spring-start`

### 7.1 Phân bổ tuần

Nguyên tắc: bám đúng cụm của sách (ch.1 mở đầu · ch.2–5 Spring context · ch.6 AOP ·
ch.7–9 Boot/MVC/web scope · ch.10–11 REST · ch.12–14 dữ liệu · ch.15 kiểm thử). Nhịp **đều
4 mục/tuần** vì chương đều tay.

| Tuần | Chương | Số từ | Ảnh | Mục | Tiêu đề |
|---|---|---:|---:|---:|---|
| `sh-w1` | 00 + ch.1 | 12.177 | 8 | 4 | Spring là gì, và cách học cuốn sách này |
| `sh-w2` | ch.2 | 9.125 | 14 | 4 | Spring context: định nghĩa bean |
| `sh-w3` | ch.3 + ch.4 | 15.164 | 25 | 4 | Wiring bean và lập trình theo abstraction |
| `sh-w4` | ch.5 + ch.6 | 16.608 | 26 | 4 | Bean scope, vòng đời, và AOP |
| `sh-w5` | ch.7 + ch.8 | 15.748 | 29 | 4 | Spring Boot, Spring MVC và ứng dụng web |
| `sh-w6` | ch.9 + ch.10 | 13.117 | 26 | 4 | Web scope và REST service |
| `sh-w7` | ch.11 + ch.12 | 13.095 | 20 | 4 | Gọi REST endpoint và dùng data source |
| `sh-w8` | ch.13 + ch.14 + ch.15 | 18.194 | 31 | 4 | Transaction, Spring Data và kiểm thử |

**Tổng 32 mục / 113.228 từ / 179 ảnh.**

`sh-w8` gộp ba chương (18,2k từ) — nặng nhất, nhưng ch.13 (5,0k) là chương nhẹ nhất sách và
ba chương này là một mạch "đưa dữ liệu vào rồi kiểm thử nó", cắt giữa sẽ gãy.

### 7.2 Lược đồ nội dung mỗi mục

Giữ nguyên khuôn 4 khối của track DDIA / Modern Concurrency / MJIA / Kafka:

```js
{
  id: "sh-w4-3",
  text: "<một dòng nêu việc cần làm>",
  lesson: `**Mục tiêu.** … **Đọc.** … **Bẫy.** … **Tự kiểm tra.** …`,
}
```

- **Mục tiêu** — người đọc làm được gì sau mục này.
- **Đọc** — anchor vào bản dịch (`#/docs/springstart-06`), tên mục trích **nguyên văn** tiêu
  đề `##`/`###` trong tệp nguồn. **Không chép lại nội dung sách.**
- **Bẫy** — lấy từ chỗ sách tự cảnh báo, không bịa.
- **Tự kiểm tra** — câu hỏi chỉ trả lời được sau khi đọc đúng phần đó.

**Lưu ý riêng cho sách nhập môn:** đối tượng đọc là người mới, nên khối **Bẫy** phải là bẫy
người mới thật sự vấp (bean không được quét, `@Autowired` trên trường vs constructor, proxy
tự gọi chính mình mất aspect…), lấy từ chỗ sách cảnh báo — **không** nâng lên thành bẫy nâng
cao mà sách không bàn.

Tuần có `id`, `week`, `title`, `goal`, `practice`, `resources`, `items` — dùng `practice`.
`practice` là bài code cụ thể bám đúng ví dụ của chương tuần đó.

### 7.3 Chia tệp và khai track

- `webapp/js/data/springstart-roadmap-part1.js` → `springStartWeeksPart1`, tuần 1–4, **16 mục**
- `webapp/js/data/springstart-roadmap-part2.js` → `springStartWeeksPart2`, tuần 5–8, **16 mục**

```js
{
  id: "spring-start",
  field: "spring-start",
  label: "Spring Start",
  icon: "🌱",
  name: "Đọc Spring Start Here",
  durationWeeks: 8,
  desc: "Kế hoạch đọc 8 tuần bám theo bản dịch cuốn sách: mỗi mục nêu mục tiêu, chỉ đúng " +
        "phần cần đọc, bẫy người mới hay vấp và câu tự kiểm tra; mỗi tuần một bài code.",
  prereq: "Yêu cầu: viết được Java cơ bản (class, interface, annotation) và dựng được một " +
          "dự án Maven. Không cần biết trước gì về Spring — đây là điểm bắt đầu, và là " +
          "bước đi trước lĩnh vực Spring Security.",
  weeks: [...springStartWeeksPart1, ...springStartWeeksPart2],
}
```

Không bọc `withBookRefs`.

## 8. Bất biến dữ liệu — `webapp/check-data.mjs`

**Không viết bất biến mới.** Chỉ mở rộng bảng kỳ vọng, **khai trước khi viết dữ liệu**:

```js
// Lĩnh vực Spring Start Here — 15 chương + 1 hướng dẫn học (Manning 2021).
"docs:spring-start": 16,
"roadmap-items:spring-start": 32,   // thêm ở chặng 2
```

Các bất biến sẵn có tự phủ: #1 id duy nhất · #2 tệp docs tồn tại trên đĩa · **#2b ảnh trong
markdown tồn tại trên đĩa (179 ảnh — nhiều nhất trong mọi lĩnh vực sách)** · #3/#3b/#3c ·
"Id mục lộ trình khớp tiền tố id tuần cha" (`sh-w4-3` ⊂ `sh-w4`) · "Mọi khối tuần có ít nhất
1 mục" · "FIELD_ORDER khớp FIELDS 1-1" · #7/#7b.

## 9. Thứ tự triển khai

**Chặng 1 — lĩnh vực sống, đọc được 16 tài liệu.**

1. `grep` xác nhận không tham chiếu đường dẫn cũ (**bỏ qua 3 chỗ sách tự giới thiệu sách**,
   §3), rồi `git mv "Spring Start Here" spring-start-vi` và đổi tên 16 `.md` + 15 `.pdf`.
2. `build-content.sh`: `mkdir` + 2 dòng `cp`.
3. `check-data.mjs`: khai `"docs:spring-start": 16`.
4. `fields.js`: entry `spring-start`, `modules: ["dashboard", "docs"]`, chèn `FIELD_ORDER`
   ngay trước `spring-security`.
5. `docs-index.js`: 16 bản ghi + cập nhật chú thích đầu tệp.
6. Nghiệm thu chặng 1 (§11), rồi cập nhật tài liệu (§10).

**Chặng 2 — giáo trình 8 tuần.**

7. `check-data.mjs`: khai `"roadmap-items:spring-start": 32`.
8. `springstart-roadmap-part1.js` (16 mục) và `springstart-roadmap-part2.js` (16 mục).
9. `roadmap.js`: import + khai track + cập nhật chú thích đầu tệp.
10. `fields.js`: bật `"roadmap"`.
11. `springsec-roadmap-part1.js` (`ss-w1`) + `senior-java-gd1.js` (`sj-gd1-w8`): mỗi tệp thêm
    **đúng một** chip (§6.1).
12. Nghiệm thu chặng 2 (§11), cập nhật số liệu tài liệu (§10).

## 10. Tài liệu phải cập nhật — dùng DELTA, không chốt cứng

Lĩnh vực này và `kafka` triển khai ở hai phiên riêng, **thứ tự chưa xác định**. Kế hoạch phải
**đo số liệu sống ngay trước khi sửa tài liệu** bằng lệnh sau:

```bash
node -e "Promise.all([
  import('./webapp/js/data/docs-index.js'),
  import('./webapp/js/data/roadmap.js'),
  import('./webapp/js/data/fields.js')
]).then(([d,r,f])=>{
  console.log('tài liệu:', d.docs.length);
  console.log('track:', r.tracks.length);
  console.log('mục lộ trình:', r.tracks.flatMap(t=>t.weeks).flatMap(w=>w.items).length);
  console.log('lĩnh vực:', f.FIELD_ORDER.length);
  console.log('lĩnh vực có roadmap:',
    f.FIELD_ORDER.filter(x=>f.FIELDS[x].modules.includes('roadmap')).length);
})"
```

Delta của đợt này: **+16 tài liệu · +1 track · +32 mục · +1 lĩnh vực · +1 lĩnh vực có roadmap.**

| Chỗ | Sửa gì |
|---|---|
| `webapp/README.md` dòng "Lộ trình học" | số giáo trình, tổng mục, thêm mô tả track (8 tuần, 32 mục, bám theo 15 chương + hướng dẫn học) và addend `+ 32 mục đọc Spring Start Here` — **nhấn markdown chỉ in nghiêng tên sách** |
| `webapp/README.md` dòng "Thư viện tài liệu" | tổng tài liệu, số lĩnh vực, thêm `16 Spring Start Here` **đúng vị trí `FIELD_ORDER`** (ngay trước Spring Security) |
| `webapp/README.md` cây thư mục | `khai N lĩnh vực` |
| `README.md` câu liệt kê lĩnh vực | thêm "bản dịch **Spring Start Here**", cập nhật "cả N lĩnh vực" |
| `README.md` bảng thành phần | thêm dòng `spring-start-vi/` — *"15 chương + 1 hướng dẫn học, 179 hình"* + khuôn bản quyền thương mại |
| `README.md` dòng `webapp/` | số giáo trình / mục / tài liệu, thêm Spring Start Here đúng vị trí |
| `webapp/index.html:7` | meta description: thêm "Spring Start Here" **ngay trước** "Spring Security" |
| `webapp/js/data/roadmap.js` | chú thích đầu tệp: dòng bảng `SSH : springstart-roadmap-part{1,2}.js (Tuần 1–4 / 5–8) — 32 mục`, thêm vào câu liệt kê track, thêm `sh-w1` / `sh-w1-1` vào dòng LƯU Ý id |
| `webapp/js/data/docs-index.js` chú thích đầu | thêm `spring-start-vi/` |
| `webapp/js/views/roadmap.js:1` | "N track thuộc M lĩnh vực" — **M đếm lĩnh vực khai module `roadmap`** (`java` không khai) |

## 11. Nghiệm thu

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

Repo **không có test runner nào khác**. Phải dán output thật.

**Chặng 1 xanh khi:** #1, #2 (16 tệp), **#2b (179 ảnh)**, `"docs:spring-start": 16`, N3,
FIELD_ORDER khớp FIELDS 1-1, #7/#7b.
Kiểm bằng mắt (người, không phải subagent): mở `Spring Start 07 — Tìm hiểu Spring Boot và
Spring MVC` (18 ảnh, nhiều nhất) và `Spring Start 06 — Sử dụng aspect với Spring AOP` (16 ảnh),
xác nhận ảnh hiện và mục lục nổi dựng đúng.

**Chặng 2 xanh khi:** id tuần/mục duy nhất, tiền tố mục khớp tuần cha, mọi tuần ≥ 1 mục,
#3/#3b/#3c, `"roadmap-items:spring-start": 32`.

**Hồi quy bắt buộc:** `"roadmap-items:spring-security"` vẫn **30**,
`"roadmap-items:senior-java"` vẫn **276**.

## 12. Ngoài phạm vi

- **Hiệu đính nội dung 16 tệp.** Nhận nguyên trạng.
- **Flashcards và trắc nghiệm.** Đợt sau.
- **Phục vụ `.pdf` qua web.**
- **Crossref mức chương từ `spring-security`** dù sách chỉ đích danh "Chương 6 trong Spring
  Start Here" (§6.2).
- **Chip thứ hai trong cùng track `springsec`** ở `ss-w4` hoặc `ss-w7` (§6.1).
- **Sửa `app.js` để link xuyên lĩnh vực không đổi lĩnh vực đang chọn.**

## 13. Rủi ro và giới hạn đã biết

1. **Chuẩn hoá nguồn nặng nhất trong 6 lần tích hợp.** 31 tệp phải đổi tên từ tên tiếng Anh
   có dấu cách sang slug tiếng Việt, và 15 trong số đó là cặp `.md`/`.pdf` phải khớp nhau.
   Giảm nhẹ: kế hoạch liệt kê đủ 31 lệnh `git mv` tường minh, không dùng vòng lặp tự chế.
2. **`00` không có PDF.** Lệnh kiểm cặp `.md`/`.pdf` phải trừ nó ra, nếu không sẽ báo lỗi giả.
3. **179 ảnh — nhiều nhất trong mọi lĩnh vực sách.** #2b sẽ quét cả 179 sau khi build. Nó đỏ
   nghĩa là `cp -R images` thiếu hoặc `git mv` bỏ sót thư mục.
4. **`grep "Spring Start Here"` sẽ ra hàng chục kết quả hợp lệ** — 7 tệp nguồn trong
   `spring-security-vi/` nhắc tên cuốn này trong văn xuôi, cộng bản sao đã build. Người triển
   khai dễ tưởng đó là tham chiếu đường dẫn phải sửa. **Không sửa.** Dùng mẫu có dấu `/` ở
   §3 để lọc ra tham chiếu đường dẫn thật.
5. **Chip đặt ở `ss-w1` đi ngược neo văn bản** (`ss-w4`, `ss-w7`). Quyết định có chủ đích với
   lý do ở §6.1 — nếu thấy sai, đổi chỗ chip là một dòng, nhưng phải sửa cả spec.
6. **Khối "Bẫy" dễ trôi thành bẫy nâng cao.** Đây là sách nhập môn; bẫy phải là chỗ người mới
   thật sự vấp và sách thật sự cảnh báo.
7. **Tiền tố `sh-` dễ bị gõ nhầm thành `ss-`** khi copy khuôn từ track Spring Security. Bất
   biến "id duy nhất" sẽ bắt được va chạm, nhưng chỉ khi trùng nguyên id — `sh-w9` không tồn
   tại nên gõ nhầm thành `ss-w9` sẽ tạo id lạ mà không va chạm. Kế hoạch phải có lệnh đếm
   xác nhận **đúng 32 id bắt đầu bằng `sh-w`**.
