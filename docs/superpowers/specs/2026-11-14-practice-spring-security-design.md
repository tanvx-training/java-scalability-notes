# Chương trình thực hành Spring Security in Action — bản thiết kế

Ngày: 2026-11-14. Trạng thái: chờ người dùng duyệt.

Nhãn trong tài liệu: **[Đã chốt]** là điều người dùng nói ra; **[Đề xuất]** là điều tôi nêu và người dùng không phản đối; **[Tự quyết]** là lựa chọn của tôi, người dùng chưa xem riêng.

## 1. Ý định

Người dùng là kỹ sư Java/Spring, đã có module 🛠️ Thực hành trong DevPrep với chương trình CKA. Chương trình thứ hai là thực hành theo sách *Spring Security in Action, ấn bản 2* (bản dịch đã có trong repo ở `sources/spring-security/`, 17 chương 2–18). [Đã chốt]

Sau chương trình, người dùng muốn:

1. Làm authentication và authorization cho ứng dụng Spring Boot theo cách tốt nhất hiện nay. [Đã chốt]
2. Dựng được auth service cho hệ microservices Spring. [Đã chốt]
3. Hiểu sâu các thành phần và cơ chế bên trong Spring Security. [Đã chốt]
4. Nắm các khái niệm nâng cao (OAuth2/OIDC, JWT, method security, reactive, testing — danh sách này là tôi suy ra từ mục lục sách). [Đề xuất]

Cách học: **thực hành theo đúng lộ trình của sách, một cách sâu sắc; hiểu cặn kẽ luồng xử lý và cách xử lý vấn đề.** [Đã chốt] Không có kỳ thi làm thước đo. Người dùng bắt đầu học sau khi thi CKA, nên không có hạn chót; nhịp giả định là 3 buổi/tuần, mỗi buổi ít nhất 60 phút. [Tự quyết về nhịp]

### Một buổi điển hình [Đề xuất]

1. Mở app, vào chương trình, xem buổi hôm nay và 3–5 câu ôn của buổi trước.
2. `./labs/lab begin ssia <buổi>` đưa project về trạng thái đầu buổi, kèm các test đang đỏ.
3. Đọc phần sách tương ứng trong app, rồi phần "tư duy" có sơ đồ luồng của thành phần hôm đó.
4. Làm nhiệm vụ trong IDE. Mỗi buổi có ít nhất một nhiệm vụ **mổ xẻ** (debug hoặc log TRACE để tự thấy request đi qua đâu) và một **tình huống hỏng** để chẩn đoán.
5. Tự kiểm bằng `curl` hoặc trình duyệt.
6. `./labs/lab verify ssia <buổi>` in từng dòng đạt/không đạt.
7. Câu luyện bấm giờ kiểu tình huống công việc.
8. Ghi chú, đánh dấu xong.

## 2. Mục tiêu, ngoài phạm vi, điều phải tránh

### Mục tiêu

- Chương trình `ssia` trong module Thực hành, đạt cùng tiêu chí với CKA: mỗi buổi có mục tiêu, tư duy, tài liệu đọc, trạng thái đầu vào, nhiệm vụ, gợi ý, cách xử lý, tips, kết quả mong muốn có lệnh chấm, kỹ năng đạt được, câu ôn; các buổi nối nhau thành một project hoàn chỉnh.
- Thứ tự chặng trùng thứ tự chương sách 2 → 18.
- Ba lớp độ sâu cho mỗi chương [Đề xuất, người dùng xác nhận "đúng"]:
  1. Làm lại ví dụ của sách cho chạy được.
  2. Mổ xẻ bên trong: lần theo luồng bằng debugger, đọc mã nguồn Spring Security của đúng thành phần, tự viết một bản tối giản khi điều đó giúp hiểu thiết kế.
  3. Vượt khỏi sách: biến thể, tình huống hỏng thật, và cách làm hiện hành ở chỗ sách đã cũ.
- Một kiểu lab mới chạy trên máy cá nhân (JDK, Maven, Docker), dùng chung bộ lệnh `./labs/lab`.
- Thiết kế đủ tổng quát để chương trình thực hành theo sách khác (ví dụ Spring Start Here, JPA) thêm được bằng dữ liệu và script, không phải sửa phần dùng chung lần nữa.

### Ngoài phạm vi

- Không dịch lại hay sửa nội dung sách. Chỗ sách khác với phiên bản hiện hành được ghi trong buổi học, không sửa trong `sources/`.
- Không có mock thi, không có theo dõi mức thành thạo từng kỹ năng (giữ quyết định ở đợt CKA).
- Không triển khai lên Kubernetes trong chương trình này. Việc đưa hệ `shop` có bảo mật lên cluster, nếu muốn, là việc của sau này.
- Không thay đổi hành vi của chương trình CKA và bộ lệnh Multipass.
- Chương 1 và hai phụ lục của sách (không có trong bản dịch).

### Điều phải tránh

- Buổi học chỉ là "chép code cho test xanh" mà không buộc người học nhìn vào luồng bên trong.
- Lệnh lab làm mất code người học đã viết mà không có bản lưu.
- Nội dung nói sai về hành vi của Spring Security. Mọi khẳng định về luồng, lớp, thứ tự filter, thông báo lỗi phải được kiểm trên đúng phiên bản đang dùng, không viết theo trí nhớ hay theo sách.
- Việc thêm bảo mật vào `shop` làm hỏng các buổi CKA đang dùng `labs/cka/app/`.

## 3. Hiện trạng liên quan

- Lĩnh vực `spring-security` trong `webapp/js/data/fields.js` có các module `dashboard, guide, docs, roadmap, interview`. Tài liệu có id `springsec-02` … `springsec-18` (`webapp/js/data/spring-security/docs.js`); lộ trình đọc có id `ss-w1` … (`roadmap-part1.js`, `roadmap-part2.js`).
- Module Thực hành: dữ liệu ở `webapp/js/data/practice/<id>/`, đăng ký trong `index.js`; `program.exam` là tuỳ chọn, `skillAreas` khai trong dữ liệu chương trình; bất biến PR1–PR12 trong `webapp/scripts/check-data.mjs`. Cách thêm chương trình và các giới hạn hiện tại ghi ở `labs/README.md` (mục "Thêm chương trình mới" và "Giới hạn hiện tại của phần dùng chung").
- Bộ lệnh lab: `labs/lab` + `labs/lib/{core,multipass,session,assert,snapshot,images}.sh`. `load_program` hiện bắt buộc `LAB_PREFIX` và `LAB_VMS`; `main` bắt buộc có `multipass`. Script buổi chạy lệnh trong VM qua `vm`.
- App `shop` ở `labs/cka/app/`: Maven nhiều module (`gateway`, `catalog`, `order`, `common`), Spring Boot 4.1.2, chưa có bảo mật, build trong Docker với Java 25.
- Máy người dùng: macOS arm64, JDK 21 (Corretto), Maven, Docker (OrbStack). RAM 16 GB, hay chạy song song dự án khác.

## 4. Chương trình `ssia`

### 4.1 Định danh [Tự quyết]

- Id chương trình: `ssia` (tránh trùng tiền tố `ss-` của lộ trình đọc). Thư mục lab: `labs/ssia/`. Dữ liệu web: `webapp/js/data/practice/ssia/`. `field: "spring-security"`; thêm `practice` không cần vì đó là module toàn cục.
- Không có `exam`, không có mock. Buổi khai `domain: null`.

### 4.2 Phiên bản [Tự quyết]

- Spring Boot 4.1.x và Spring Security đi kèm (dòng 7.x), Java 21 trên máy người học. Sách viết cho Spring Security 6.
- Mỗi buổi có mục **"Khác với sách"** khi API, mặc định hoặc cách làm khuyến nghị đã đổi; nêu sách viết gì, hiện nay làm gì, vì sao. Buổi không có khác biệt thì bỏ mục này.
- Người triển khai phải xác nhận trên chính project: phiên bản Spring Security thực tế mà Boot 4.1.x kéo về, và toạ độ Maven của authorization server ở dòng này (tôi nhớ là nó đã nhập vào dự án Spring Security từ 7.0, chưa kiểm).

### 4.3 Project xuyên suốt [Đề xuất về hướng; chi tiết là Tự quyết]

Hệ `shop`, bản sao riêng tại `labs/ssia/app/` (không dùng chung với `labs/cka/app/`). Ví dụ của sách được làm lại **trên miền của shop** thay vì thành các project rời theo từng chương, để các buổi nối nhau.

| Phần sách | Làm trên | Project có thêm |
|---|---|---|
| Ch. 2–6 (nền tảng, user, mật khẩu, filter, authentication) | service `order` | Đăng nhập, user lưu trong DB, mã hoá mật khẩu, filter và provider tự viết |
| Ch. 7–12 (authorization endpoint và method, CSRF, CORS, filtering) | service `order` | Phân quyền theo role và theo chủ đơn hàng, CSRF/CORS đúng cho một client web |
| Ch. 13–16 (OAuth2/OIDC) | cả hệ | Module `auth` (authorization server); `order` và `catalog` là resource server; `gateway` là OAuth2 client và chuyển tiếp token |
| Ch. 17 (reactive) | một service reactive mới | Người triển khai đợt đó chọn: service mới nhỏ, hay gateway reactive |
| Ch. 18 (testing) | cả hệ | Người học tự viết test bảo mật cho những gì đã dựng |

Vì sao là `order`: đơn hàng thuộc về một user, nên có sẵn bài toán "chỉ chủ đơn mới xem được" cho method security và filtering.

Trang Project của chương trình hiện sơ đồ hệ thống và danh sách mảnh ghép (`project.pieces`) như CKA.

### 4.4 Lộ trình [Đề xuất; số buổi là ước lượng, người triển khai chỉnh ±1 mỗi chặng, tổng 50–56]

Mỗi chương một chặng (`st02` … `st18`, đánh số theo chương cho dễ đối chiếu). Buổi "tự làm từ đầu" nằm cuối các chặng 6, 12, 16.

| Chặng | Chương | Buổi | Trọng tâm mổ xẻ |
|---|---|---|---|
| st02 | Hello Spring Security | 3 | Auto-configuration sinh ra gì; một request đi qua những lớp nào; ghi đè mặc định |
| st03 | Quản lý user | 3 | `UserDetails`, `UserDetailsService`, `UserDetailsManager`; user trong DB |
| st04 | Quản lý mật khẩu | 2 | `PasswordEncoder`, `DelegatingPasswordEncoder` và chuyển đổi thuật toán; crypto module |
| st05 | Filter | 3 | `DelegatingFilterProxy` → `FilterChainProxy` → `SecurityFilterChain`; thứ tự filter; thêm filter trước/sau/tại chỗ |
| st06 | Authentication | 4 + 1 tự làm | `AuthenticationManager`/`ProviderManager`/`AuthenticationProvider`; `SecurityContext` và luồng bất đồng bộ; HTTP Basic và form login, các handler và entry point |
| st07 | Authorization endpoint: hạn chế | 2 | Authority và role; `AuthorizationManager`; từ chối truy cập đi đường nào |
| st08 | Authorization endpoint: áp dụng | 2 | Thứ tự matcher; nhiều `SecurityFilterChain` |
| st09 | CSRF | 3 | Token sinh, lưu và kiểm ở đâu; tình huống thực tế; tuỳ chỉnh |
| st10 | CORS | 1–2 | Preflight; ai trả header; CORS và filter chain |
| st11 | Method authorization | 3 | Pre/post authorize; permission evaluator; interceptor AOP đứng ở đâu |
| st12 | Method filtering | 2 + 1 tự làm | Pre/post filter; filtering trong Spring Data |
| st13 | OAuth2 và OIDC | 3 | Vai trò, token, grant type — thực hành bằng `curl` với một authorization server dựng sẵn; mổ JWT |
| st14 | Authorization server | 4 | JWT; authorization code + PKCE; client credentials; opaque token, introspection, thu hồi |
| st15 | Resource server | 4 | Kiểm JWT; claim tuỳ chỉnh; introspection; multitenant |
| st16 | OAuth2 client | 3 + 1–2 tự làm | OAuth2 login; client và chuyển tiếp token qua gateway; gọi giữa các service |
| st17 | Reactive | 3 | Khác gì so với servlet: filter, context, method security |
| st18 | Testing | 3 | Người học viết test; chấm bằng cách chạy test của họ trên các bản cấu hình cố ý sai |

Buổi "tự làm từ đầu": đề bài ngắn, không có gợi ý từng bước, chấm bằng bộ test chỉ được chép vào lúc `verify`. Về dữ liệu nó vẫn là `kind: "lesson"`. [Tự quyết]

### 4.5 Mỗi buổi phải thoả

Ngoài các ràng buộc sẵn có của PR7–PR9:

- `refs` có ít nhất một liên kết `#/docs/springsec-NN` của đúng chương, nêu rõ mục (ví dụ "mục 5.2").
- Có ít nhất một nhiệm vụ mổ xẻ: người học tìm ra một sự thật trên hệ thống đang chạy (ví dụ thứ tự filter thực tế, lớp ném ra ngoại lệ, giá trị một header) và ghi vào tệp trả lời; `verify` so với sự thật do chính lab đo lúc chấm, không so với hằng số viết tay. Đây là cách buổi s08 của CKA đã làm với `answers.env`.
- Có một sơ đồ luồng (mermaid) của thành phần trọng tâm, đúng với phiên bản đang dùng.
- Có một tình huống hỏng: hoặc là một drill, hoặc là `break`. Lời giải phải đi theo trình tự chẩn đoán (triệu chứng → log/breakpoint nào → nguyên nhân → sửa), không chỉ đưa đáp án.
- Lớp 1 (ví dụ của sách) và lớp 3 (vượt khỏi sách) đều có mặt trong mỗi **chặng**; không bắt buộc trong mỗi buổi.
- Thời lượng 60–90 phút.

### 4.6 Kỹ năng [Tự quyết]

`skillAreas` của chương trình:

| id | Nhãn | Tiền tố | Ví dụ |
|---|---|---|---|
| `config` | Cấu hình | `cfg-` | Viết một `SecurityFilterChain`, khai `PasswordEncoder` |
| `internals` | Bên trong | `int-` | Vẽ lại luồng authentication; chỉ ra filter nào tạo `SecurityContext` |
| `protocol` | Giao thức | `pro-` | Authorization code + PKCE; cấu trúc JWT; CSRF, CORS |
| `diagnose` | Chẩn đoán | `dx-` | 403 dù đúng role; bật log TRACE của security; đọc stack trace qua filter chain |
| `testing` | Kiểm thử | `tst-` | `@WithMockUser`, test CSRF bằng MockMvc |

`kind` dùng lại bộ sẵn có (`command|yaml|procedure|concept|docs|path`). Nếu cần loại mới cho đoạn code Java (ví dụ `code`), người triển khai thêm vào danh sách hợp lệ và nhãn hiển thị. `ref` để trống vì lĩnh vực này không có module Thực hành nhanh.

## 5. Kiểu lab chạy cục bộ

### 5.1 Driver [Tự quyết]

`env.sh` của chương trình khai `LAB_DRIVER`: `multipass` (mặc định, giữ nguyên hành vi cho `cka`) hoặc `local`.

Với `local`:

- Không cần `LAB_PREFIX`, `LAB_VMS`, không gọi và không đòi `multipass`.
- Đòi `java`, `mvn`; đòi `docker` chỉ khi buổi cần hạ tầng.
- Script buổi chạy trực tiếp trên máy, thư mục làm việc là workspace. Không có `vm`; gọi `vm` trong chương trình `local` là lỗi rõ ràng.

Phần dùng chung giữa hai driver (đọc `ORDER`, tìm buổi, chạy `apply/verify/check/setup`, `assert.sh`, xác nhận trước thao tác phá huỷ) giữ một bản. Cách tách tệp trong `labs/lib/` do người triển khai quyết.

### 5.2 Workspace và trạng thái [Tự quyết]

- Code người học nằm ở `labs/ssia/work/`, bị git của repo bỏ qua, và tự nó là **một kho git riêng** do lab khởi tạo.
- `labs/ssia/app/` trong repo là bản gốc chưa có bảo mật. Mỗi buổi có `sessions/<id>/solution/`: các tệp lời giải tham chiếu, chép đè lên workspace theo đúng đường dẫn (cộng một danh sách tệp cần xoá nếu có). Trạng thái cuối buổi N = bản gốc + lời giải của các buổi 1…N theo thứ tự. Đây là tương đương của chuỗi `apply.sh` ở CKA.
- **Người học xây tiếp trên code của chính mình.** `begin` không chép lời giải tham chiếu đè lên; lời giải chỉ vào workspace qua `restore` (hoặc khi người học tự mở `sessions/<id>/solution/` để so). Nếu `check` đầu buổi không đạt, lệnh gợi ý `restore` về cuối buổi trước.
- `begin <buổi>`: kiểm workspace đang ở trạng thái cuối buổi trước (bằng `check`), commit hiện trạng với nhãn "trước buổi", chạy `setup.sh` nếu có, chép test của buổi vào, gỡ các test cũ mà buổi này khai là hết hiệu lực (mục 5.4), rồi commit với nhãn đầu buổi.
- `break <id>`: commit hiện trạng với nhãn "trước sự cố" rồi mới sửa workspace, để người học luôn quay lại được.
- `verify <buổi>`: chạy chấm; khi đạt hết thì commit nhãn cuối buổi.
- `restore <buổi>`: dựng lại workspace ở trạng thái cuối buổi đó từ bản gốc và chuỗi lời giải. **Trước khi ghi đè, mọi thay đổi của người học được giữ lại** trong một nhánh sao lưu có dấu thời gian của kho workspace (kể cả tệp chưa commit); lệnh in tên nhánh đó. Vẫn hỏi xác nhận trừ khi có `--yes`.
- `check <buổi>`: chạy `check.sh` của buổi nếu có, nếu không thì `verify.sh` của buổi trước, không sửa gì.
- Không có snapshot và milestone cho driver này: dựng lại từ chuỗi lời giải đủ nhanh.

### 5.3 Lệnh [Tự quyết]

| Lệnh | Driver `local` |
|---|---|
| `up` | Tạo workspace nếu chưa có; tải sẵn dependency Maven; bật hạ tầng Docker nếu chương trình khai (compose) |
| `down` | Tắt hạ tầng Docker của chương trình; dừng các tiến trình app do lab bật |
| `status` | Workspace đang ở buổi nào (theo nhãn commit), hạ tầng nào đang chạy, cổng nào đang bị chiếm |
| `check`, `begin`, `verify`, `restore`, `break`, `selftest` | Như mục 5.2; `selftest` dựng workspace tạm ở thư mục riêng, đi cả chuỗi (verify đỏ sau `begin`, xanh sau lời giải), không đụng workspace của người học |
| `destroy` | Hỏi xác nhận, đóng gói cả workspace (gồm kho git của nó) vào `labs/<chương trình>/backups/` rồi mới xoá `work/` |
| `snapshot`, `images`, `mock` | Báo rõ là không áp dụng cho chương trình này, thoát mã khác 0 |

Lệnh in trên trang buổi lấy từ `env.commands` trong dữ liệu, như hiện nay.

### 5.4 Chấm [Tự quyết]

- Nguồn chấm chính là test JUnit (MockMvc, hoặc test tích hợp tự bật app trên cổng ngẫu nhiên). Test của buổi nằm ở `sessions/<id>/tests/` và được chép vào workspace lúc `begin` — người học đọc được, chúng là đặc tả của nhiệm vụ. Riêng buổi "tự làm từ đầu" thì test chỉ được chép lúc `verify`.
- `verify.sh` chạy Maven **một lần** rồi in mỗi kiểm tra một dòng ✓/✗ có nhãn tiếng Việt, kết thúc bằng dòng tổng `→ a/b đạt`, đúng định dạng của `assert.sh`. Cần một trợ giúp đọc kết quả từng test từ báo cáo surefire; không chạy lại JVM cho từng dòng.
- **Test là hộp đen.** Test chỉ dựa vào hành vi quan sát được: HTTP qua MockMvc hoặc cổng thật, và bean lấy theo kiểu của Spring Security (ví dụ "có đúng một `PasswordEncoder`", "`SecurityFilterChain` chứa một filter kiểu X sau filter Y"). Test không biên dịch dựa vào lớp do người học đặt tên. Khi một nhiệm vụ buộc phải có tên cố định (ví dụ một endpoint, một bảng, một lớp mà test cần nạp), nhiệm vụ nêu rõ tên đó và lời giải tham chiếu dùng đúng tên đó.
- **Mỗi buổi chấm bằng test của chính nó.** Test của buổi nằm trong một package riêng theo id buổi; `verify` chỉ chạy package đó. Test của buổi trước ở lại workspace cho tới khi một buổi sau đổi hành vi một cách chính đáng (ví dụ thay HTTP Basic bằng resource server): buổi sau khai danh sách test hết hiệu lực trong thư mục buổi, và `begin` cùng chuỗi `restore` gỡ chúng. `selftest` chạy **toàn bộ** test còn hiệu lực sau lời giải của mỗi buổi, để chuỗi lời giải tham chiếu không tự làm hỏng buổi cũ; với người học, `./labs/lab check` và việc chạy `mvn test` là cách tự kiểm hồi quy, không bắt buộc.
  - *Đã thay đổi khi triển khai:* `selftest` chạy `labs/ssia/selftest.sh` (toàn bộ test còn hiệu lực) **một lần ở cuối chuỗi**, không phải sau mỗi buổi, để mỗi buổi chỉ tốn hai lần Maven. Một lời giải làm hỏng buổi cũ vì thế chỉ lộ ra ở cuối; cách tìm buổi gây ra ở mục "`selftest` của driver `local`" trong `labs/README.md`.
- Test của buổi "tự làm từ đầu" được chép lúc `verify`, ở lại workspace và được commit sau đó, để `check` của buổi kế tiếp chạy được.
- Nhiệm vụ mổ xẻ chấm qua tệp trả lời như mục 4.5.
- Với các chương OAuth2 cần nhiều service cùng chạy, cách bật/tắt service lúc chấm do người triển khai đợt đó thiết kế, với điều kiện: `verify` tự dọn tiến trình nó bật, và không để lại cổng bị chiếm.
- `verifyOutput` trong dữ liệu buổi là output thật của một lần chạy, không viết tay.

### 5.5 Ràng buộc an toàn

- Driver `local` chỉ ghi vào `labs/<chương trình>/work/`, `labs/<chương trình>/backups/` (cả hai bị git của repo bỏ qua), thư mục tạm của `selftest`, và cache Maven của người dùng. Trước mọi thao tác ghi hoặc xoá, đường dẫn đích được kiểm là nằm trong gốc đó sau khi giải symlink.
- Không lệnh nào xoá nhánh sao lưu hay tệp trong `backups/`.
- Hạ tầng Docker chạy dưới một tên project compose riêng của chương trình (ví dụ `lab-ssia`); lab chỉ gọi compose với đúng tệp và tên project đó, không bao giờ đụng container khác. Cổng dùng được khai trong `env.sh`; `up` báo lỗi rõ khi cổng đã bị chiếm thay vì giành.
- Bash 3.2. Các VM `cp1`, `w1`, `w2` và mọi lệnh Multipass nằm ngoài tầm của driver này.
- Chương trình này phải học được khi máy chỉ còn khoảng 2 GB RAM trống cho nó ở các chương 2–12 (một JVM + H2 hoặc một container Postgres). Con số cho các chương OAuth2 do đợt đó đo và ghi vào README.

### 5.6 Kiểm bộ lab

`labs/tests/run.sh` thêm ca cho driver `local` bằng stub (`mvn`, `java`, `docker` giả): `begin/verify/restore/check/selftest`, sao lưu trước khi ghi đè, từ chối đường dẫn ngoài workspace, lệnh không áp dụng, và mọi ca sẵn có của `cka` vẫn đạt. CI đã chạy bộ này trên Linux.

## 6. Thay đổi ở web app

Phần web đã nhận chương trình không có đề thi. Cần thêm [Tự quyết]:

- **Khối "Trong đề thi" của trang buổi** phải có nghĩa với chương trình không có đề: tiêu đề và lời dẫn lấy từ dữ liệu chương trình (ví dụ "🧩 Trong công việc"), nội dung là dạng tình huống thường gặp và thời gian mục tiêu. Tên trường dữ liệu do người triển khai quyết, miễn không còn chữ viết cứng về kỳ thi trong phần dùng chung khi chương trình không có `exam`.
- **Mục "Khác với sách"** trên trang buổi (tuỳ chọn theo buổi).
- **Lời văn về môi trường** (khởi động, kiểm đầu vào, khôi phục) trên trang chủ chương trình và trang buổi lấy từ dữ liệu chương trình, không giả định VM hay cluster.
- **Bất biến**: PR11 hiểu driver `local` (thư mục `solution/`, `tests/`; không đòi `milestones`). Nếu thêm bất biến mới thì cập nhật mọi nơi ghi số bất biến.
- Trang chủ Thực hành liệt kê hai chương trình; thẻ trên bảng điều khiển của lĩnh vực Spring Security trỏ tới `ssia`.

Không đổi: route, khoá localStorage, cách lưu tiến độ, bản đồ kỹ năng, trang Project.

## 7. Thứ tự giao hàng [Đề xuất]

**Đợt 1:**

1. Driver `local` trong bộ lệnh lab, có test, không đổi hành vi của `cka`.
2. `labs/ssia/app/` (bản gốc của shop cho chương trình này) và workspace.
3. Khung cả chương trình trong app: 17 chặng, mọi buổi ở dạng `skeleton` (tên, mục tiêu, kỹ năng, chương sách), bảng kỹ năng, trang Project.
4. Các thay đổi web ở mục 6.
5. Nội dung và script đầy đủ cho st02, st03, st04 (khoảng 8 buổi), `selftest` xanh.
6. README (`labs/README.md`, `labs/ssia/README.md`, `webapp/README.md`).

**Các đợt sau:** mỗi đợt một nhóm chương theo khuôn lặp của CKA — bảng "người học làm / `verify` kiểm" → script đỏ rồi xanh → nội dung → tăng số buổi phát hành → `selftest` → kiểm trình duyệt. Thứ tự gợi ý: st05–st06; st07–st10; st11–st12; st13–st14; st15–st16; st17–st18.

## 8. Kiểm chứng

- CHECK, UNIT, LABTEST xanh; số bất biến ghi trong tài liệu khớp thực tế.
- `./labs/lab selftest ssia` đi hết các buổi đã phát hành trên máy thật: mỗi buổi đỏ sau `begin`, xanh sau lời giải.
- `restore` trên một workspace có thay đổi chưa commit: thay đổi còn nguyên trong nhánh sao lưu.
- Chương trình `cka` không đổi: bộ test lab sẵn có đạt, trang CKA trong trình duyệt như cũ.
- Trình duyệt: trang chủ chương trình, một buổi đã phát hành đi trọn (tick, ghi chú, đánh dấu xong, thấy ở buổi sau), bản đồ kỹ năng, trang Project; màn 380px; hai theme; không lỗi console.
- Mỗi buổi phát hành được một reviewer độc lập kiểm độ chính xác kỹ thuật so với phiên bản Spring Security đang dùng, theo cùng cách đã làm với các buổi CKA.

## 9. Để người triển khai quyết

- Cách tách tệp trong `labs/lib/` cho hai driver; tên biến và hàm.
- Cơ chế đọc kết quả test từ surefire; cách đặt nhãn tiếng Việt cho từng test.
- Gói Java, tên lớp, cấu trúc module trong `labs/ssia/app/`; H2 hay Postgres ở từng chương (ưu tiên H2 khi chương không cần DB thật).
- Số buổi chính xác của từng chặng trong biên độ đã nêu; tên buổi.
- Tên trường dữ liệu mới ở mục 6.
- Dùng `mvn` của máy hay Maven Wrapper trong workspace.

## 10. Rủi ro đã biết

- **Sách và phiên bản lệch nhau.** Một số ví dụ của sách có thể không còn biên dịch hoặc không còn là cách khuyến nghị. Cách xử lý là mục "Khác với sách"; nếu một mục của sách không còn tương ứng nào ở phiên bản hiện hành, buổi đó nói rõ và dạy cái thay thế.
- **Trí nhớ về Spring Security 7 có thể sai.** Mọi nội dung phải kiểm trên project thật và tài liệu tham chiếu chính thức.
- **Test nhìn thấy được có thể bị "lách".** Chấp nhận: mục đích là học, và nhiệm vụ mổ xẻ cùng buổi tự làm từ đầu bù lại.
- **Bản quyền.** Buổi học dẫn chiếu tới chương sách và diễn đạt lại bằng lời của mình; không chép nguyên văn đoạn dài của sách vào dữ liệu buổi.
