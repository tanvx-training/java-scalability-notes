# Tích hợp *Java Persistence with Spring Data and Hibernate* vào DevPrep — thiết kế

Ngày: 2026-09-09
Trạng thái: đã duyệt, chờ lập kế hoạch triển khai
Lĩnh vực mới của DevPrep — id `jpa`

Khuôn mẫu trực tiếp: [`2026-09-07-ocnj-integration-design.md`](2026-09-07-ocnj-integration-design.md)
và [`2026-09-07-jcip-integration-design.md`](2026-09-07-jcip-integration-design.md).

## 1. Bối cảnh

Repo nhận thêm thư mục `Java Persistence with Spring Data and Hibernate/` ở gốc: 20 PDF chương và
một thư mục `vi/` chứa 20 tệp markdown bản dịch tiếng Việt *Java Persistence with Spring Data and
Hibernate* (Cătălin Tudose — Manning), kèm 127 ảnh. Nội dung **đã dịch xong**; việc còn lại thuần
tuý là tích hợp vào web app DevPrep.

Số liệu đã đo, không ước lượng:

| Chỉ số | JPA | OCNJ (đối chiếu) | Kafka (đối chiếu) |
|---|---:|---:|---:|
| Số tệp | **20** (chương 1–20, không thiếu chương nào) | 15 | 13 |
| Tổng số từ | **178.653** | 156.555 | 175.089 |
| Trung bình mỗi chương | 8.933 | 10.437 | 13.468 |
| Chương nặng nhất | ch.6 Ánh xạ value type — 14.810 | ch.13 — 16.310 | — |
| Chương nhẹ nhất | ch.18 Hibernate OGM — 3.378 | ch.8 — 6.628 | — |
| Số ảnh | **127** | 116 | 47 |

Toàn vẹn ảnh đã kiểm: **127 tệp, 127 lượt tham chiếu, 0 gãy, 0 mồ côi.**

Xếp thứ tư về khối lượng trong repo, sau DDIA (295.193), WGJD (215.650) và MJiA (213.929), trên
Kafka (175.089).

Số liệu từng chương (dùng để cân nhịp tuần ở §6 và viết `desc` ở §5):

| Ch. | Từ | Ảnh | Mục cấp hai | Ch. | Từ | Ảnh | Mục cấp hai |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 9.332 | 5 | 3 | 11 | 14.475 | 5 | 4 |
| 2 | 8.170 | 9 | 7 | 12 | 9.664 | 5 | 3 |
| 3 | 12.041 | 6 | 3 | 13 | 9.534 | 1 | 4 |
| 4 | 7.983 | 3 | 10 | 14 | 6.028 | 2 | 5 |
| 5 | 9.886 | 6 | 3 | 15 | 6.920 | 1 | 3 |
| 6 | 14.810 | 5 | 3 | 16 | 5.208 | 14 | 6 |
| 7 | 8.331 | 6 | 8 | 17 | 6.988 | 4 | 6 |
| 8 | 13.080 | 16 | 3 | 18 | 3.378 | 2 | 3 |
| 9 | 11.038 | 19 | 4 | 19 | 4.745 | 1 | 3 |
| 10 | 10.903 | 5 | 3 | 20 | 6.139 | 12 | 8 |

Nền trước khi bắt đầu (đã chạy `check-data.mjs`): **49/49 bất biến đạt, 13 lĩnh vực, 242 tài liệu,
20 track, 946 mục lộ trình.** Sau đợt này: **14 lĩnh vực, 262 tài liệu, 21 track, 998 mục.**

### 1.1 Nguồn đủ 20 chương, không lỗ hổng nội dung

Khác WGJD (thiếu ch.9–10), JCiP (thiếu ch.1, 9, 12) và OCNJ (thiếu hai phụ lục), bản dịch này
**đủ cả 20 chương, không chương nào vắng và không phụ lục nào được tham chiếu ngược**. Đây là
nguồn hoàn chỉnh nhất trong các sách thương mại đã tích hợp.

Không có lỗ hổng nội dung để ghi vào `desc` hay `prereq`. Chỗ duy nhất cần chú thích là tính thời
sự của chương 18, xem §1.4 — đó là vấn đề khác hẳn, không phải nguồn thiếu.

### 1.2 Không có README nguồn — `part` phải để trống

`vi/` **không có** `README.md`. Ba cách tìm bằng chứng tên Phần đều trả về rỗng:

| Cách tìm | Kết quả |
|---|---|
| `ls -a vi/` | Chỉ 20 tệp `Chuong-*.md` và `images/`. Không README. |
| `grep -nE '^#+ *Phần\|Phần [1-9IV]' Chuong-*.md` | 0 dòng. |
| `pdftotext -f 1 -l 2` trên cả 20 PDF, tìm `Part N` | 0 dòng. PDF tách theo chương nên không chứa trang phân Phần. |

Quy ước `sources/README.md` nói `part` lấy từ README nguồn, **không bịa**. Ở đây không có README
nguồn, nên `part: null` cho cả 20 tài liệu — cùng cách xử lý như `wgjd` và `jcip`.

Điều này **không** đồng nghĩa sách không chia Phần. Nó chỉ nghĩa là bộ nguồn trong repo không mang
bằng chứng nào về tên Phần, và điền theo trí nhớ về bản in tiếng Anh là bịa. Nếu về sau người dịch
bổ sung README có mục lục theo Phần, điền `part` là một thay đổi nhỏ và độc lập.

### 1.3 Mỗi tệp có đúng một H1 — đừng "sửa" các dòng `#` trong khối mã

`grep -c '^# '` trên ch.4, 15, 16, 17 và 20 trả về 6, 5, 7, 3 và 6. Đã kiểm bằng bộ đếm hàng rào
```` ``` ````: **mọi dòng thừa đều nằm trong khối mã** — đó là các chú thích đánh dấu vòng tròn
(`# Ⓐ`, `# Ⓑ`, …) mà Manning dùng để chú giải listing. Mỗi tệp có đúng **một** H1 thật ở dòng 1.

Ghi lại ở đây để lần sau không ai chạy một `grep` tham lam rồi đi "chuẩn hoá tiêu đề" trong khối mã.

### 1.4 Chương 18 dạy Hibernate OGM — công nghệ đã ngưng phát triển

Chương 18 (3.378 từ, chương nhẹ nhất sách) giới thiệu Hibernate OGM, dựng ví dụ với MongoDB rồi
chuyển sang Neo4j. Hibernate OGM không còn được phát triển tích cực và không theo kịp Jakarta EE;
đây là thông tin **ngoài** bộ nguồn, không phải điều sách nói.

**Quyết định:** giữ chương 18 trong thư viện tài liệu và trong lộ trình như mọi chương khác — bộ
nguồn đủ 20 chương thì thư viện phải đủ 20 chương. Ghi tính thời sự ở **đúng một chỗ**: một
`pitfall` trong `fieldGuides.jpa` (§4.3), diễn đạt là ghi chú thời sự chứ không phải chê nguồn.
Không ghi vào `desc` của `jpa-18`: `desc` mô tả chương nói gì, không phải chỗ bình luận.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | Lĩnh vực **mới** `jpa`, không gộp vào `spring-start` | Khác sách, khác độ sâu: *Spring Start Here* dạy Spring nhập môn và chỉ có hai chương chạm tới dữ liệu (`springstart-12`, `springstart-14`), còn cuốn này là 178.653 từ chuyên về persistence. Tiền lệ nhiều nguồn duy nhất là `kubernetes`, nơi cả 4 nguồn cùng phục vụ luyện thi chứng chỉ — không đúng ở đây. |
| 2 | Module `["dashboard", "guide", "docs", "roadmap"]` | Đồng khuôn 9 lĩnh vực sách hiện có. Không làm flashcards/quiz đợt này. |
| 3 | Doc id `jpa-01`…`jpa-20`, liền mạch, **không lỗ hổng** | Bản dịch đủ 20 chương. Số id khớp số chương sách, như mọi lĩnh vực sách khác. |
| 4 | **`part: null`** cho cả 20 tài liệu | §1.2. Không có bằng chứng nào trong bộ nguồn về tên Phần. |
| 5 | Slug tệp **tiếng Việt** không dấu, chữ thường | Tiêu đề chương của bản dịch **đã dịch** ("Chương 6. Ánh xạ value type"), nên slug tiếng Việt bám sát nguồn. Tiền lệ `ddia`, `kafka`, `ocnj` (chương dịch → slug Việt) đối lại `wgjd`, `jcip` (chương giữ tên Anh → slug Anh). |
| 6 | Vị trí trên con đường Java Backend: **sau `ocnj`, trước `java`** | `java-09` (proxy và ThreadLocal trong `@Transactional`) và `java-10` (năm bẫy `@Transactional`) giả định người đọc đã biết persistence context và flush; ch.10–11 của sách dạy đúng nền đó. Ch.11 (isolation, optimistic/pessimistic locking) cũng đọc tốt hơn sau JMM và lock của `jcip`. Giữ mạch nông → sâu → ứng dụng. |
| 7 | Lộ trình **13 tuần / 52 mục**, tuyến tính theo thứ tự sách, cân theo số từ | 13,7k từ/tuần. Phương án 12 tuần (14,9k/tuần) buộc tuần cuối gánh bốn chương 17+18+19+20 ở 21.250 từ, cao hơn mọi tuần của phương án 13 tuần. Xem §6.1. |
| 8 | Giữ chương 18 (Hibernate OGM) đủ trong docs và lộ trình, ghi tính thời sự ở một `pitfall` | §1.4. Bộ nguồn đủ 20 chương thì thư viện phải đủ 20 chương. |
| 9 | `externalRef` = Hibernate ORM documentation | §4.1. |
| 10 | Ảnh giữ nguyên bố cục `images/chNN/` (hai chữ số, **có** đệm 0) | Khác `ocnj`/`ddia` (một chữ số). Sắp xếp lại sẽ gãy toàn bộ 127 tham chiếu tương đối, đổi lấy đúng một chút nhất quán hình thức. |
| 11 | Chia 6 chặng, mỗi chặng `check-data.mjs` xanh | `fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu (#7), và có dữ liệu thì phải khai module (#7b). |

## 3. Nguồn: chuẩn hoá `sources/jpa/`

`git mv` thư mục `Java Persistence with Spring Data and Hibernate/` thành `sources/jpa/`, **nâng
nội dung `vi/` lên một cấp** (bản dịch nằm thẳng trong `sources/jpa/`, không giữ cấp trung gian
`vi/` — quy ước `sources/README.md` chỉ cho phép cấp con khi lĩnh vực có nhiều nguồn), đổi tên 20
tệp markdown theo quy ước `NN-slug.md`, rồi chuyển 20 PDF vào `sources/jpa/pdf/` theo cùng slug.
`images/` đi cùng. Giữ nguyên nội dung — **không sửa một ký tự nào**: đường dẫn ảnh là tương đối
theo tệp chứa, và `images/` di chuyển cùng các tệp `.md`.

Tiêu đề dưới đây trích **nguyên văn từ dòng H1 của từng tệp dịch**, không dịch lại. `title` trong
`docs.js` bỏ tiền tố "Chương N. " vì nhãn "Ch. N · …" do `labels.js` sinh (bất biến D1).

| # | `.md` mới | H1 trong bản dịch | `title` trong `docs.js` |
|---:|---|---|---|
| 01 | `01-tim-hieu-object-relational-persistence.md` | Chương 1. Tìm hiểu về object/relational persistence | Tìm hiểu về object/relational persistence |
| 02 | `02-bat-dau-mot-du-an.md` | Chương 2. Bắt đầu một dự án | Bắt đầu một dự án |
| 03 | `03-domain-model-va-metadata.md` | Chương 3. Domain model và metadata | Domain model và metadata |
| 04 | `04-lam-viec-voi-spring-data-jpa.md` | Chương 4. Làm việc với Spring Data JPA | Làm việc với Spring Data JPA |
| 05 | `05-anh-xa-cac-persistent-class.md` | Chương 5. Ánh xạ các persistent class | Ánh xạ các persistent class |
| 06 | `06-anh-xa-value-type.md` | Chương 6. Ánh xạ value type | Ánh xạ value type |
| 07 | `07-anh-xa-inheritance.md` | Chương 7. Ánh xạ inheritance | Ánh xạ inheritance |
| 08 | `08-anh-xa-collection-va-entity-association.md` | Chương 8. Ánh xạ collection và entity association | Ánh xạ collection và entity association |
| 09 | `09-anh-xa-entity-association-nang-cao.md` | Chương 9. Ánh xạ entity association nâng cao | Ánh xạ entity association nâng cao |
| 10 | `10-quan-ly-du-lieu.md` | Chương 10. Quản lý dữ liệu | Quản lý dữ liệu |
| 11 | `11-transaction-va-concurrency.md` | Chương 11. Transaction và concurrency | Transaction và concurrency |
| 12 | `12-fetch-plan-strategy-va-profile.md` | Chương 12. Fetch plan, strategy và profile | Fetch plan, strategy và profile |
| 13 | `13-loc-du-lieu.md` | Chương 13. Lọc dữ liệu | Lọc dữ liệu |
| 14 | `14-tich-hop-jpa-va-hibernate-voi-spring.md` | Chương 14. Tích hợp JPA và Hibernate với Spring | Tích hợp JPA và Hibernate với Spring |
| 15 | `15-lam-viec-voi-spring-data-jdbc.md` | Chương 15. Làm việc với Spring Data JDBC | Làm việc với Spring Data JDBC |
| 16 | `16-lam-viec-voi-spring-data-rest.md` | Chương 16. Làm việc với Spring Data REST | Làm việc với Spring Data REST |
| 17 | `17-lam-viec-voi-spring-data-mongodb.md` | Chương 17. Làm việc với Spring Data MongoDB | Làm việc với Spring Data MongoDB |
| 18 | `18-lam-viec-voi-hibernate-ogm.md` | Chương 18. Làm việc với Hibernate OGM | Làm việc với Hibernate OGM |
| 19 | `19-truy-van-jpa-voi-querydsl.md` | Chương 19. Truy vấn JPA với Querydsl | Truy vấn JPA với Querydsl |
| 20 | `20-kiem-thu-ung-dung-java-persistence.md` | Chương 20. Kiểm thử ứng dụng Java persistence | Kiểm thử ứng dụng Java persistence |

PDF đổi tên theo cùng slug: `1 Understanding object_relational persistence _ Java Persistence with
Spring Data and Hibernate.pdf` → `pdf/01-tim-hieu-object-relational-persistence.pdf`, và tương tự
cho 19 tệp còn lại.

**Cái bẫy của chặng 1.** Tên PDF gốc là **tiếng Anh**, chương một chữ số **không** có số 0 đứng
đầu, và **không** có dấu chấm sau số (`1 Understanding…`, `10 Managing data…`). Slug đích là
**tiếng Việt** và **có** đệm 0. `ls` xếp `10 Managing data` ngay sau `1 Understanding`. Ghép theo
**số chương**, không theo thứ tự sắp xếp chuỗi.

Sau khi `git mv` xong, thư mục `Java Persistence with Spring Data and Hibernate/` biến mất hoàn toàn.

Trước khi đổi tên, xác nhận không nơi nào tham chiếu đường dẫn cũ:

```bash
grep -rn "Java Persistence with Spring Data and Hibernate/" --exclude-dir=.git --exclude-dir=docs \
     --exclude-dir=content --exclude-dir="Java Persistence with Spring Data and Hibernate" .
```

Dùng dấu `/` cuối mẫu để chỉ bắt tham chiếu **đường dẫn**, không bắt tên sách trong văn xuôi. Loại
trừ cả `content/` vì đó là ảnh gương do `build-content.sh` sinh, không phải nguồn.

### 3.1 Ảnh — bố cục theo chương, hai chữ số

127 ảnh nằm trong `images/chNN/` (hai chữ số, **có** đệm 0: `ch01`, `ch02`, …, `ch20`). Phân bố đã
đếm:

| ch.1 | ch.2 | ch.3 | ch.4 | ch.5 | ch.6 | ch.7 | ch.8 | ch.9 | ch.10 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 9 | 6 | 3 | 6 | 5 | 6 | 16 | 19 | 5 |

| ch.11 | ch.12 | ch.13 | ch.14 | ch.15 | ch.16 | ch.17 | ch.18 | ch.19 | ch.20 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 5 | 1 | 2 | 1 | 14 | 4 | 2 | 1 | 12 |

Tổng 127, khớp đúng 127 lượt tham chiếu trong markdown, 0 gãy, 0 mồ côi.

Ghi chú cho người kiểm lại: dùng mẫu khớp đúng cú pháp markdown `!\[[^]]*\]\(images/[^)]+\)`, không
dùng `grep` tham lam dạng `images/[^)]*` — mẫu tham lam sẽ bắt cả những lần văn bản nhắc đường dẫn
trong dấu backtick và cho ra số "ảnh gãy" giả.

### 3.2 `sources/jpa/README.md` — viết mới hoàn toàn

Khác OCNJ (có sẵn `vi/README.md` để giữ lại và mở rộng), ở đây **không có gì để giữ**. README viết
mới theo khuôn README các nguồn khác:

- Tên sách, tác giả **Cătălin Tudose**, Manning.
- Ghi rõ **sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0**.
- 20 chương đầy đủ, 127 ảnh trong `images/chNN/`, PDF gốc trong `pdf/` và không vào bản deploy.
- Mục lục 20 chương theo `NN-slug.md`, **không** chia Phần (§1.2 — bộ nguồn không có bằng chứng).
- Ghi chú tính thời sự của chương 18 (§1.4).

**Xác minh tác giả.** Không lấy từ trí nhớ. Bằng chứng nằm trong chính bộ nguồn: PDF chương 20 viết
*"you can refer to my book JUnit in Action, third edition (Tudose, 2020)"* — tác giả tự xưng, và
PDF chương 1 dẫn bài báo *"Object-Relational Mapping Using JPA, Hibernate and Spring Data JPA"* của
Cătălin Tudose và Carmen Odubășteanu. Nhà xuất bản xác nhận qua package của mã ví dụ:
`com.manning.javapersistence`.

## 4. Khai lĩnh vực

### 4.1 `webapp/js/data/fields.js`

| Trường | Giá trị |
|---|---|
| `label` | `Java Persistence with Spring Data and Hibernate` |
| `icon` | `🪢` |
| `short` | `JPA` |
| `unit` | `Ch.` |
| `certFilter` | `false` |
| `modules` | `["dashboard", "guide", "docs", "roadmap"]` |
| `externalRef` | `{ label: "hibernate.org — ORM documentation", href: "https://hibernate.org/orm/documentation/" }` |

`desc` (viết liền một dòng khi vào code): *Bản dịch tiếng Việt Java Persistence with Spring Data
and Hibernate (Cătălin Tudose — Manning) — đủ 20 chương: object/relational paradigm mismatch và vai
trò của ORM, dựng dự án với JPA thuần, Hibernate native và Spring Data JPA, domain model và
metadata, query method và projection, ánh xạ persistent class, value type, inheritance, collection
và entity association, vòng đời persistence và EntityManager, transaction và điều khiển đồng thời,
fetch plan và fetch profile, cascade, Envers và data filter, tích hợp với Spring theo mẫu DAO,
Spring Data JDBC, Spring Data REST, Spring Data MongoDB, Hibernate OGM, Querydsl, và kiểm thử tầng
persistence bằng Spring TestContext.*

`externalRef` chọn Hibernate ORM documentation vì phần nặng nhất của sách là ánh xạ và persistence
context ở chương 5–13, chiếm **101.721 trong 178.653 từ (57%)**, và đó là tài liệu tham chiếu chuẩn
cho mọi annotation ánh xạ, chiến lược fetch và ngữ nghĩa locking sách nhắc tới. Đã cân nhắc
`docs.spring.io/spring-data/jpa/reference/` nhưng nó chỉ phủ phần Spring (ch.4, 14–17, 19–20 =
44.011 từ, 25%). Dùng trang landing `hibernate.org/orm/documentation/` thay vì URL user guide gắn
phiên bản để link không mục theo mỗi bản Hibernate.

`icon` `🪢` chưa lĩnh vực, track hay con đường nào dùng (đã kiểm toàn bộ icon trong `fields.js`,
`paths.js` và `roadmap.js`). Icon ban đầu là `🗃️`, đổi lại sau review toàn nhánh: kiểm trùng ở trên
chỉ bắt trùng **chính xác**, nên bỏ lọt việc `🗃️` gần trùng thị giác với `🗄️` của `ddia` ở cỡ nhỏ
trong bộ chọn lĩnh vực.

`FIELD_ORDER` chèn `"jpa"` ngay sau `"ocnj"`.

### 4.2 `webapp/js/data/paths.js`

```js
PATHS.java.fields = ["spring-start", "modern-java", "wgjd", "jcip", "ocnj", "jpa", "java",
                     "modern-concurrency", "spring-security"];
```

`PATHS.java.desc` hiện viết *"Một nghề, tám chặng…"* — phải sửa thành **chín chặng** và nêu chặng
mới (persistence: ánh xạ, persistence context, transaction và fetch), đặt giữa "đo và tối ưu trên
cloud" và "khả năng mở rộng trên Tomcat". Bất biến P1 kiểm mọi lĩnh vực xuất hiện đúng một lần
trong `PATHS ∪ SPINE`; quên thêm `jpa` là đỏ ngay.

### 4.3 `webapp/js/data/guides.js`

`fieldGuides.jpa` — tagline, audience, `hoursPerWeek: "6–8 giờ/tuần · 13 tuần"`, prereqs (đọc và
viết được SQL ở mức join và index, chạy được một ứng dụng Spring Boot thật, có một SQL database
chạy được cục bộ hoặc qua Docker, và Docker cho ch.17–18 vốn cần MongoDB và Neo4j), 5 `steps`,
`method`, `pitfalls`, `doneWhen`.

Ba `pitfall` bắt buộc:

1. **Đọc sách như danh mục annotation.** Giá trị của sách nằm ở đánh đổi giữa các chiến lược ánh
   xạ — ch.7 dành cả một mục "Chọn chiến lược" cho bốn cách ánh xạ inheritance. Học thuộc annotation
   mà không bật SQL log để nhìn schema và câu lệnh thật sinh ra là bỏ đúng phần đó.
2. **Chương 18 dạy công nghệ đã ngưng phát triển.** Hibernate OGM không còn được phát triển tích
   cực và không theo kịp Jakarta EE. Đọc để hiểu ý tưởng mở rộng khả chuyển của JPA sang NoSQL,
   đừng dựng hệ thống mới trên nó. Đây là ghi chú thời sự, không phải chê nguồn (§1.4).
3. **Ranh giới phiên bản.** Tên package (`javax.persistence` so với `jakarta.persistence`), giá trị
   mặc định của Hibernate và API của Spring Data đổi theo phiên bản. Đọc để hiểu **cơ chế**, còn cấu
   hình thì tra lại theo phiên bản đang chạy — `externalRef` Hibernate ORM docs có sẵn ở chân
   sidebar cho đúng việc này.

`trackGuides.jpa` — `rhythm` / `before` / `during` / `after`.

Bất biến G1 bắt buộc: khai module `guide` mà thiếu `fieldGuides` là đỏ; mọi track phải có
`trackGuides`.

## 5. Thư viện tài liệu — `webapp/js/data/jpa/docs.js`

20 bản ghi theo thứ tự đọc. Mỗi bản ghi: `id`, `field: "jpa"`, `chapter` (số chương thật),
`part: null` (§1.2), `title` (chỉ tên chương — xem bảng §3), `file: "content/jpa/NN-slug.md"`,
`icon`, `desc` (một câu nói chương này trả lời câu hỏi gì), `tags` (3 từ khoá).

### 5.1 Mục lục cấp hai — dùng để viết `desc`, đã trích thật

`desc` bám mục lục thật của bản dịch, không suy từ trí nhớ về bản in tiếng Anh. Mục "Tóm tắt" cuối
mỗi chương bỏ khỏi bảng này vì không mang nội dung.

| Ch. | Các mục cấp hai |
|---:|---|
| 1 | Persistence là gì? · Paradigm mismatch · ORM, JPA, Hibernate và Spring Data |
| 2 | Giới thiệu Hibernate · Giới thiệu Spring Data · "Hello World" với JPA · Cấu hình native của Hibernate · Chuyển đổi giữa JPA và Hibernate · "Hello World" với Spring Data JPA · So sánh các cách tiếp cận lưu trữ entity |
| 3 | Ứng dụng ví dụ CaveatEmptor · Hiện thực domain model · Metadata của domain model |
| 4 | Giới thiệu Spring Data JPA · Bắt đầu một dự án Spring Data JPA mới · Những bước đầu tiên để cấu hình một dự án Spring Data JPA · Định nghĩa query method với Spring Data JPA · Giới hạn kết quả truy vấn, sắp xếp và phân trang · Streaming kết quả · Annotation @Query · Projection · Truy vấn sửa đổi · Query by Example |
| 5 | Hiểu về entity và value type · Ánh xạ entity với identity · Các tùy chọn ánh xạ entity |
| 6 | Ánh xạ basic property · Ánh xạ embeddable component · Ánh xạ kiểu Java và kiểu SQL bằng converter |
| 7 | Table per concrete class với đa hình ngầm định · Table per concrete class với union · Table per class hierarchy · Table per subclass với join · Trộn các chiến lược inheritance · Inheritance của các class embeddable · Chọn chiến lược · Polymorphic association |
| 8 | Set, bag, list và map của value type · Collection của component · Ánh xạ entity association |
| 9 | Association một-một · Association một-nhiều · Association nhiều-nhiều và bậc ba · Entity association với map |
| 10 | Vòng đời persistence · Interface EntityManager · Làm việc với trạng thái detached |
| 11 | Những điều thiết yếu về transaction · Điều khiển truy cập đồng thời · Truy cập dữ liệu phi giao dịch · Quản lý transaction với Spring và Spring Data |
| 12 | Lazy loading và eager loading · Chọn fetch strategy · Sử dụng fetch profile |
| 13 | Cascade các chuyển đổi trạng thái · Lắng nghe và chặn sự kiện · Auditing và versioning với Hibernate Envers · Data filter động |
| 14 | Spring Framework và dependency injection · Ứng dụng JPA dùng Spring và mẫu DAO · Tổng quát hóa ứng dụng JPA dùng Spring và DAO · Ứng dụng Hibernate dùng Spring và mẫu DAO · Tổng quát hóa ứng dụng Hibernate dùng Spring và DAO |
| 15 | Tạo một dự án Spring Data JDBC · Làm việc với truy vấn trong Spring Data JDBC · Mô hình hóa quan hệ với Spring Data JDBC |
| 16 | Giới thiệu ứng dụng REST · Tạo một ứng dụng Spring Data REST · Dùng ETag cho các yêu cầu có điều kiện · Giới hạn truy cập tới repository, phương thức và field · Làm việc với REST event · Sử dụng projection và excerpt |
| 17 | Giới thiệu MongoDB · Giới thiệu Spring Data MongoDB · Dùng MongoRepository để truy cập cơ sở dữ liệu · Query by Example · Tham chiếu tới các document MongoDB khác · Dùng MongoTemplate để truy cập cơ sở dữ liệu |
| 18 | Giới thiệu Hibernate OGM · Xây dựng một ứng dụng Hibernate OGM đơn giản với MongoDB · Chuyển sang cơ sở dữ liệu NoSQL Neo4j |
| 19 | Giới thiệu Querydsl · Tạo một ứng dụng Querydsl · Truy vấn cơ sở dữ liệu với Querydsl |
| 20 | Giới thiệu kim tự tháp kiểm thử · Tạo ứng dụng persistence để kiểm thử · Dùng Spring TestContext Framework · Annotation @DirtiesContext · Thực thi với @Transactional · Annotation @BeforeTransaction và @AfterTransaction · Làm việc với Spring profile · Làm việc với test execution listener |

`docs-index.js`: thêm `import { docs as jpa } from "./jpa/docs.js";` và `...jpa,` trong mảng.

`check-data.mjs`: thêm `"docs:jpa": 20` vào `EXPECTED.counts`.

## 6. Lộ trình đọc — track `jpa`

Track id `jpa`, week id `jp-w1`…`jp-w13`, item id `jp-w<N>-<M>`. Tiền tố `jp-` chưa ai dùng (đã có
`w`, `cka-`, `cks-`, `sp-`, `kb-`, `cb-`, `ku-`, `ss-`, `mc-`, `dd-`, `mj-`, `kf-`, `sh-`, `wg-`,
`jc-`, `oc-`, `sj-gd*-` — đã kiểm bằng cách liệt kê tiền tố id tuần của cả 20 track).
**Id là khoá lưu tiến độ trong localStorage — không được đổi về sau.**

4 mục mỗi tuần, tách hai tệp: `jpa/roadmap-part1.js` (W1–7, 28 mục) và `jpa/roadmap-part2.js`
(W8–13, 24 mục). Tổng 52 mục.

| Tuần | Chương | Từ | Trọng tâm |
|---|---|---:|---|
| W1 | 1 + 2 | 17.502 | Persistence và paradigm mismatch; ORM, JPA, Hibernate, Spring Data; "Hello World" bằng cả ba cách và so sánh chúng |
| W2 | 3 + 4 | 20.024 | CaveatEmptor, hiện thực domain model, metadata; query method, phân trang, `@Query`, projection, modifying query, Query by Example |
| W3 | 5 | 9.886 | Entity so với value type, ánh xạ entity với identity, các tuỳ chọn ánh xạ entity |
| W4 | 6 | 14.810 | Basic property, embeddable component, converter giữa kiểu Java và kiểu SQL |
| W5 | 7 | 8.331 | Bốn chiến lược inheritance, trộn chiến lược, inheritance của embeddable, polymorphic association |
| W6 | 8 | 13.080 | Set/bag/list/map của value type, collection của component, ánh xạ entity association |
| W7 | 9 | 11.038 | Một-một, một-nhiều, nhiều-nhiều và bậc ba, entity association với map |
| W8 | 10 | 10.903 | Vòng đời persistence, interface `EntityManager`, làm việc với trạng thái detached |
| W9 | 11 | 14.475 | Thiết yếu về transaction, điều khiển truy cập đồng thời, truy cập phi giao dịch, transaction với Spring |
| W10 | 12 + 13 | 19.198 | Lazy/eager, chọn fetch strategy, fetch profile; cascade, listener và interceptor, Envers, data filter động |
| W11 | 14 + 15 | 12.948 | DI và mẫu DAO cho cả JPA lẫn Hibernate; dự án Spring Data JDBC, truy vấn và mô hình hoá quan hệ |
| W12 | 16 + 17 | 12.196 | Spring Data REST, ETag, giới hạn truy cập, REST event, projection và excerpt; MongoDB, MongoRepository, MongoTemplate |
| W13 | 18 + 19 + 20 | 14.262 | Hibernate OGM với MongoDB và Neo4j; Querydsl; kim tự tháp kiểm thử và Spring TestContext |

Tổng cột "Từ" bằng đúng 178.653 — không tuần nào được làm tròn cho vừa. Trung bình 13.742 từ/tuần;
biên độ 8.331–20.024.

### 6.1 Vì sao 13 tuần chứ không 12

Phương án 12 tuần (48 mục, đúng khuôn `ddia`, `modern-java`, `ocnj`) đòi trung bình 14,9k từ/tuần và
buộc dồn bảy chương cuối vào hai tuần: W11 = ch.14+15+16 (18.156) và W12 = ch.17+18+19+20 (21.250).
Tuần 21.250 từ đó **cao hơn mọi tuần** của phương án 13 tuần, và nó rơi đúng vào tuần cuối — chỗ
người học dễ bỏ cuộc nhất.

Phương án 13 tuần trả giá bằng việc thành track đơn sách dài nhất repo (52 mục, vượt `ddia` và
`modern-java` ở 48). Đổi lại tuần nặng nhất giảm từ 21.250 xuống 20.024 và tuần cuối chỉ còn 14.262
với ba chương nhẹ nhất sách. Đã chốt 13 tuần.

### 6.2 Bốn chỗ ghép đôi chương — lý do nội dung, không phải để cho vừa số

- **W1 (ch.1 + ch.2):** ch.1 thuần khái niệm — paradigm mismatch, ORM là gì. Ch.2 dựng "Hello
  World" bằng ba cách. Đọc rời để lại một tuần chỉ có khái niệm mà chưa chạy được dòng nào, rồi một
  tuần chỉ gõ cấu hình mà chưa biết vì sao.
- **W2 (ch.3 + ch.4):** ch.3 dựng domain model CaveatEmptor và khai metadata; ch.4 dùng repository
  **ngay trên chính model đó**. Tách ra thì tuần sau phải nhớ lại model của tuần trước. Đây là tuần
  nặng nhất (20.024) nhưng ch.4 có 10 mục cấp hai phần lớn là listing query method, đọc nhanh hơn
  mật độ chữ gợi ý.
- **W10 (ch.12 + ch.13):** cả hai nói về **hành vi lúc chạy** chứ không phải ánh xạ tĩnh — fetch
  plan quyết định query nào chạy, còn cascade/listener/filter quyết định điều gì xảy ra quanh một
  thao tác. Cùng một câu hỏi "Hibernate làm gì sau lưng tôi".
- **W11, W12, W13:** bảy chương cuối đều nhẹ (3.378–6.988 từ) và mỗi chương là một công nghệ riêng.
  Gom theo cặp/bộ ba giữ mỗi tuần ở 12–15k thay vì bảy tuần lẻ tẻ.

Phương án thay thế cho W2 là tách ch.3 riêng (12.041) rồi ghép ch.4 + ch.5 (17.869). Nó hạ tuần
nặng nhất xuống 19.198 nhưng ghép Spring Data JPA với ánh xạ entity — hai chủ đề khác hẳn nhau, và
cắt ch.4 khỏi domain model mà nó thao tác. Đã cân và chọn giữ mạch nội dung.

### 6.3 Khuôn một mục

Giữ đúng khuôn 4 khối của repo: **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**. Mỗi mục là **kế hoạch đọc
trỏ vào sách**, không chép lại nội dung sách; link dạng `#/docs/jpa-NN` gắn vào tên mục thật trong
chương (xem bảng mục lục §5.1). `practice` ở mức tuần, làm trên máy thật — **cả 13 tuần đều có**:

| Tuần | `practice` |
|---|---|
| W1 | Dựng cùng một schema "Hello World" bằng ba cách sách trình bày — JPA thuần, cấu hình native của Hibernate, Spring Data JPA — rồi đối chiếu số dòng cấu hình và điểm khác biệt thật giữa chúng |
| W2 | Dựng domain model CaveatEmptor, bật `spring.jpa.show-sql` và đọc DDL Hibernate sinh ra; viết 5 query method Spring Data với tên method khác nhau và đối chiếu SQL từng cái sinh ra |
| W3 | Ánh xạ một entity với ba chiến lược sinh id (IDENTITY, SEQUENCE, TABLE), insert 100 bản ghi mỗi kiểu và đếm số round-trip tới database |
| W4 | Ánh xạ một `@Embeddable` và viết một `AttributeConverter` cho kiểu tự định nghĩa; kiểm cột SQL thật sinh ra khớp điều mình nghĩ |
| W5 | Hiện thực cùng một cây thừa kế bằng cả bốn chiến lược của ch.7, so schema sinh ra và so SQL của cùng một truy vấn đa hình trên từng chiến lược |
| W6 | Ánh xạ cùng một collection bằng `Set`, rồi `List`, rồi `Map`; bật SQL log và đếm số câu lệnh khi thêm và khi xoá một phần tử |
| W7 | Dựng association một-nhiều hai chiều, cố tình quên `mappedBy` rồi sửa; so số bảng sinh ra và số câu UPDATE thừa giữa hai lần |
| W8 | Tái hiện `LazyInitializationException` bằng cách chạm proxy ngoài persistence context, rồi sửa bằng ba cách khác nhau và nêu cái giá của từng cách |
| W9 | Cho hai luồng cùng sửa một entity để tái hiện lost update, rồi chặn bằng `@Version` (optimistic) và bằng pessimistic lock; so hành vi và so câu SQL của hai cách |
| W10 | Bật `hibernate.generate_statistics`, tái hiện N+1 select, sửa bằng join fetch rồi bằng `@EntityGraph`; đếm số query trước và sau mỗi cách |
| W11 | Chuyển một repository Spring Data JPA sang Spring Data JDBC; so cách hai bên mô hình hoá quan hệ và so SQL sinh ra |
| W12 | Phơi một repository qua Spring Data REST, thử `If-None-Match` để thấy ETag trả 304, rồi giới hạn field trả về bằng projection |
| W13 | Viết bộ test cho tầng persistence bằng Spring TestContext với `@Transactional` và `@DirtiesContext`, chạy trên một database thật trong container thay vì H2 |

### 6.4 Đăng ký track — `webapp/js/data/roadmap.js`

| Trường | Giá trị |
|---|---|
| `id` | `jpa` |
| `field` | `jpa` |
| `label` | `Java Persistence` |
| `icon` | `🪢` |
| `name` | `Đọc Java Persistence with Spring Data and Hibernate` |
| `durationWeeks` | `13` |
| `weeks` | `[...jpaWeeksPart1, ...jpaWeeksPart2]` |

`prereq` nêu: đọc và viết được SQL ở mức join và index (sách nói thẳng ở ch.1 rằng nắm vững mô hình
quan hệ và SQL là điều kiện tiên quyết), chạy được một ứng dụng Spring Boot thật, có một SQL
database chạy được cục bộ hoặc qua Docker, và Docker cho ch.17–18 vốn cần MongoDB và Neo4j. Thêm
ghi chú ranh giới phiên bản: tên package và mặc định của Hibernate/Spring Data đổi theo phiên bản,
đọc để hiểu cơ chế còn cấu hình thì tra lại.

**Không** có ghi chú lỗ hổng nguồn trong `prereq` — bộ nguồn đủ 20 chương (§1.1).

`check-data.mjs`: thêm `"roadmap-items:jpa": 52` vào `EXPECTED.counts`.

## 7. Liên kết chéo — `webapp/js/data/related.js`

Khai **một chiều**; `relatedOf` phản chiếu hai chiều khi đọc. Bất biến R1 chặn nối cùng lĩnh vực.
Mọi id đích dưới đây **đã kiểm tồn tại thật** trong `docs.js` của lĩnh vực tương ứng.

**9 khoá / 14 liên kết**, sang 5 lĩnh vực:

| Khoá | Đích | Lý do đọc liền mạch |
|---|---|---|
| `jpa-01` | `ddia-03` | Paradigm mismatch và ORM ↔ "Mô hình dữ liệu và ngôn ngữ truy vấn" — cùng câu hỏi mô hình object hợp với mô hình quan hệ tới đâu, nhìn từ tầng framework và từ tầng thiết kế hệ dữ liệu |
| `jpa-04` | `springstart-14` | Spring Data JPA đầy đủ ↔ "Triển khai lưu trữ dữ liệu với Spring Data" nhập môn |
| `jpa-10` | `java-09` | Vòng đời persistence và `EntityManager` ↔ Connection cất trong `ThreadLocal` qua `TransactionSynchronizationManager` — cùng một ranh giới transaction nhìn từ JPA và từ Spring AOP |
| `jpa-11` | `ddia-08` | Transaction và điều khiển đồng thời ↔ chương Transaction của DDIA: isolation level và anomaly nhìn từ ngữ nghĩa JPA và từ lý thuyết hệ dữ liệu |
| `jpa-11` | `java-10` | Optimistic/pessimistic locking và ranh giới transaction ↔ năm bẫy `@Transactional` trong production |
| `jpa-11` | `springstart-13` | Quản lý transaction với Spring ↔ transaction nhập môn |
| `jpa-11` | `jcip-02` | Lost update ở tầng database ↔ check-then-act và race condition ở tầng bộ nhớ — **cùng một lớp lỗi ở hai tầng**, và cùng một cách chữa là biến kiểm-rồi-ghi thành một thao tác nguyên tử |
| `jpa-12` | `java-08` | N+1 select và fetch strategy ↔ các ca giữ connection quá lâu trong bài sizing connection pool: N+1 là một trong số đó |
| `jpa-14` | `springstart-06` | Tích hợp bằng mẫu DAO ↔ aspect và Spring AOP |
| `jpa-14` | `springstart-12` | `EntityManagerFactory` và cấu hình ↔ data source trong ứng dụng Spring |
| `jpa-16` | `springstart-10` | Spring Data REST ↔ triển khai REST service viết tay: cùng một endpoint, một bên sinh tự động một bên gõ tay |
| `jpa-16` | `springsec-11` | Giới hạn truy cập tới repository, phương thức và field ↔ phân quyền ở cấp độ phương thức |
| `jpa-17` | `ddia-03` | Tham chiếu giữa các document MongoDB ↔ mô hình document so với quan hệ |
| `jpa-20` | `springstart-15` | Kiểm thử tầng persistence bằng TestContext ↔ kiểm thử ứng dụng Spring nói chung |

Đã cân và **loại**: `jpa-13` (Envers) → `ddia-12` (Stream Processing) vì audit log và change data
capture chỉ giống nhau ở bề mặt "ghi lại thay đổi", không cùng cơ chế; `jpa-20` → `springsec-18` vì
chung mỗi Spring TestContext, không đủ thành một mạch đọc.

## 8. Sáu chặng triển khai

Mỗi chặng kết thúc bằng `build-content.sh` rồi `check-data.mjs` **xanh**, và một commit riêng.
`fields.js` tự đặt luật: chỉ khai module khi đã có dữ liệu (#7), và có dữ liệu thì phải khai module
(#7b) — nên không tách tuỳ tiện được.

| Chặng | Nội dung | Tệp chạm |
|---|---|---|
| 1 | Chuẩn hoá nguồn: `git mv`, đổi tên 20 markdown và 20 PDF, viết README nguồn | `sources/jpa/**` |
| 2 | Khai lĩnh vực + thư viện tài liệu (module `dashboard`, `docs`) | `fields.js`, `paths.js`, `jpa/docs.js`, `docs-index.js`, `check-data.mjs` |
| 3 | Hướng dẫn học (mở module `guide`) | `fields.js`, `guides.js` |
| 4 | Lộ trình 13 tuần (mở module `roadmap`) | `jpa/roadmap-part1.js`, `jpa/roadmap-part2.js`, `roadmap.js`, `guides.js`, `fields.js`, `check-data.mjs` |
| 5 | Liên kết chéo | `related.js` |
| 6 | Tài liệu repo, cập nhật số liệu | `README.md`, `sources/README.md`, `webapp/README.md` |

`webapp/README.md` là tệp hay bị bỏ sót nhất ở chặng cuối — đã lặp ở ba đợt tích hợp liên tiếp
(nhánh `ocnj`, `jcip`, và bản thân `jpa` trước khi có bản sửa này). Tệp này mang số liệu riêng của
nó (số lĩnh vực, số track/mục lộ trình, số tài liệu, **số cặp liên kết chéo**, chuỗi con đường Java
Backend, và chú thích số lĩnh vực trong cây thư mục ở cuối tệp), và `README.md` gốc trỏ người đọc
sang `webapp/README.md` — nên khi hai tệp lệch số liệu, đó là một mâu thuẫn thấy được ngay, không
phải lỗi ẩn.

Chặng 3 và 4 phải mở module đúng lúc: bất biến G1 bắt khai `guide` thì phải có `fieldGuides`, và
mọi track phải có `trackGuides` — nên `trackGuides.jpa` đi cùng chặng 4, không phải chặng 3.

Số liệu repo sau chặng 6: **14 lĩnh vực, 262 tài liệu, 21 track, 998 mục lộ trình.**
