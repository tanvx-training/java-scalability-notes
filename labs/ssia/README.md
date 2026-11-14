# Chương trình `ssia` — ghi chú bộ lab

Thực hành *Spring Security in Action* (ấn bản 2) trên một hệ "shop" ba service Spring Boot, chạy ngay trên máy bạn bằng JDK và Maven: không VM, không Docker. Đề bài, gợi ý và lời giải ở trang **🛠️ Thực hành** của DevPrep (`#/practice`, chương trình `ssia`); bản dịch sách ở lĩnh vực Spring Security (`#/docs/springsec-…`).

Phần chung của bộ lệnh `lab` (các lệnh, hợp đồng buổi của driver `local`, quy tắc an toàn) ở [`../README.md`](../README.md). Tệp này chỉ ghi những gì riêng của `ssia`.

## Yêu cầu máy

| Cần | Ghi chú |
|---|---|
| macOS, `/bin/bash` 3.2 | Như mọi chương trình của `lab` |
| `git`, `java`, `mvn` | `./labs/lab up ssia` kiểm cả ba (`LAB_REQUIRE` trong `env.sh`) và dừng nếu thiếu. Đã đo với Maven 3.9.14 |
| JDK 21 hoặc 25 | Cả hai đã chạy hết chuỗi buổi (`selftest` xanh, xem dưới). `pom.xml` đặt `java.version=21` |
| Cổng 8080, 8081, 8082 trống | gateway, catalog, order khi bạn tự chạy service. `./labs/lab status ssia` báo cổng nào đang bận. Test của buổi tự bật app trên cổng ngẫu nhiên nên không cần các cổng này |
| RAM | Một JVM `order` (H2, không đặt `-Xmx`) khoảng 254 MB RSS. `POST /orders` cần thêm `catalog`, tức hai JVM |

### Phiên bản

Phiên bản đã đo nằm ở [`app/VERSIONS.md`](app/VERSIONS.md): Spring Boot 4.1.2, Spring Framework 7.0.10, **Spring Security 7.1.2**, Tomcat 11.0.27, H2 2.4.240, JUnit Jupiter 6.0.3, maven-surefire-plugin 3.5.6. Nội dung buổi học (tên lớp, thứ tự filter, thông báo lỗi, `verifyOutput`) được đo trên đúng các phiên bản này.

### JDK: `JAVA_HOME` và `java` có thể khác nhau

Maven chạy bằng JDK của `JAVA_HOME`, còn lệnh `java` (dùng cho `java -jar …`) lấy theo `PATH`. Trên máy đo, hai thứ này là hai JDK khác nhau:

```bash
mvn -v          # Java version: 25.0.4, vendor: Microsoft …   (theo JAVA_HOME)
java -version   # openjdk version "21.0.11" … Corretto         (theo PATH)
```

Muốn Maven dùng JDK 21 trên macOS (đã thử: `mvn -v` báo `Java version: 21.0.11`):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

`/usr/libexec/java_home -v 21` in đường dẫn JDK 21 mới nhất đã cài (trên máy đo là Corretto 21.0.11).

**Cảnh báo khi chạy test.** Chạy thẳng `mvn -q test` trong workspace thì **cả JDK 21 lẫn JDK 25** in cùng một bộ cảnh báo, mỗi JVM test một lần (đã đo trên workspace mới, hai bộ dòng giống hệt nhau):

```
Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in future releases of the JDK. …
OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended
WARNING: A Java agent has been loaded dynamically (…/byte-buddy-agent-1.18.15.jar)
WARNING: Dynamic loading of agents will be disallowed by default in a future release
```

Test vẫn xanh; đó là Mockito tự gắn agent ByteBuddy lúc chạy. `verify` và `selftest` không in các dòng này, vì `verify.sh` chạy Maven với `-Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off` (output của test vào `target/surefire-reports/`, bỏ dòng CDS). Bạn tự chạy cùng hai cờ đó thì màn hình cũng sạch.

## Bắt đầu

```bash
./labs/lab up ssia              # tạo labs/ssia/work/ (bản chép của app/, một kho git riêng, commit "lab: bản gốc")
./labs/lab begin ssia s01       # commit hiện trạng, chép test của buổi vào workspace
# … làm theo trang buổi s01 trong DevPrep, sửa code trong labs/ssia/work/ …
./labs/lab verify ssia s01      # chấm; đạt hết thì commit "lab: xong buổi s01"
```

Rồi bấm "Đánh dấu hoàn thành" trên trang buổi và sang buổi sau bằng `./labs/lab begin ssia s02`. `begin` kiểm workspace đang ở trạng thái cuối buổi trước (chạy `verify` của buổi đó); chưa đạt thì nó gợi ý `./labs/lab restore ssia <buổi trước>`.

Chạy service bằng tay, trong `labs/ssia/work/`:

```bash
mvn -q -pl order -am package -DskipTests && java -jar order/target/order.jar
```

`POST /orders` gọi sang `catalog`, nên cần `catalog` đang chạy trên cổng 8081 (`mvn -q -pl catalog -am package -DskipTests && java -jar catalog/target/catalog.jar`). Đã thử trên bản gốc: `catalog` tắt thì `POST /orders` trả `503` với `{"error":"không kết nối được catalog"}`; `catalog` bật thì trả `201`. `GET /orders` và `/actuator/health` chạy được khi chỉ có `order`. Chi tiết cổng, endpoint và biến môi trường ở [`app/README.md`](app/README.md).

Các lệnh khác: `./labs/lab check ssia <buổi>` (kiểm đầu vào, không sửa gì), `./labs/lab restore ssia <buổi>` (dựng lại workspace ở cuối một buổi), `./labs/lab break ssia <mã>` (buổi sự cố yêu cầu), `./labs/lab status ssia`, `./labs/lab destroy ssia`.

## Lấy lại code của bạn

`lab` không bao giờ xoá code của bạn mà không giữ lại một bản. Có ba nơi để tìm. Mọi lệnh dưới đây chạy từ gốc repo và đã thử trên một workspace thật; tên nhánh, tên gói và tệp (`notes.txt` là một tệp chưa theo dõi tạo thử trước `restore`) là ví dụ từ lần thử đó, thay bằng của bạn.

**1. Nhánh `backup/<thời điểm>` do `restore` tạo.** Trước khi dựng lại, `restore` commit mọi thay đổi (kể cả tệp chưa theo dõi) thành `lab: sao lưu trước khi khôi phục` và đặt nhánh `backup/<YYYYmmdd-HHMMSS>` vào đó; lệnh in tên nhánh khi xong.

```bash
git -C labs/ssia/work branch --list 'backup/*'                              # các nhánh sao lưu
git -C labs/ssia/work log --oneline --graph --all                           # commit "lab: …" và nhánh sao lưu
git -C labs/ssia/work diff --stat HEAD backup/20261114-122534               # khác gì so với hiện tại
git -C labs/ssia/work show backup/20261114-122534:notes.txt                 # xem một tệp trong bản sao lưu
git -C labs/ssia/work restore --source=backup/20261114-122534 -- notes.txt order/src/main/java/shop/order/OrderApplication.java
```

Lệnh `restore --source` cuối cùng lấy đúng các tệp đó về cây làm việc (chưa commit), các tệp khác giữ nguyên.

**2. Các commit `lab: …` do `begin`, `break`, `verify` tạo.** `begin` commit `lab: trước buổi <id>` trước khi chép test, `break` commit `lab: trước sự cố <mã>` trước khi gây lỗi, `verify` commit `lab: xong buổi <id>` khi đạt (và `lab: trước khi chấm <id>` với buổi chép test lúc chấm). Tìm commit theo nhãn rồi lấy tệp như trên:

```bash
git -C labs/ssia/work log --oneline --grep='^lab: trước buổi'
git -C labs/ssia/work restore --source=<mã commit> -- <đường dẫn tệp>
```

**3. Gói `.tar.gz` trong `labs/ssia/backups/` do `destroy` tạo.** `destroy` đóng gói cả `work/`, gồm kho git và mọi nhánh sao lưu, thành `labs/ssia/backups/ssia-<YYYYmmdd-HHMMSS>.tar.gz` rồi mới xoá. Gói chứa thư mục `work/`:

```bash
tar xzf labs/ssia/backups/ssia-20261114-122603.tar.gz -C <thư mục bất kỳ>   # được <thư mục>/work, đủ lịch sử git
tar xzf labs/ssia/backups/ssia-20261114-122603.tar.gz -C labs/ssia          # đặt lại thành workspace (khi chưa có work/)
./labs/lab status ssia
```

Không lệnh nào của `lab` xoá nhánh `backup/*` hay gói trong `backups/`; khi không cần nữa, bạn tự xoá (`git -C labs/ssia/work branch -D backup/…`, `rm labs/ssia/backups/…`). Repo bỏ qua cả `labs/ssia/work/` lẫn `labs/ssia/backups/`.

## Quy ước của bộ lab `ssia`

- **Test của buổi** nằm ở `sessions/<id>/tests/order/src/test/java/lab/<id>/`, package `lab.<id>`, và được chép vào workspace lúc `begin`: đọc chúng là đọc đặc tả của nhiệm vụ. `verify.sh` chạy Maven một lần cho `-Dtest='lab.<id>.**'` (s01 còn chấm bốn test gốc của `order`).
- **Tệp trả lời** của nhiệm vụ mổ xẻ: `labs/ssia/work/answers/<id>.env`, mỗi dòng `KHOÁ=giá trị`, danh sách cách nhau dấu phẩy, tên lớp là simple name. Test đọc tệp này và so với giá trị đo lại từ context lúc chấm.
- **Test hết hiệu lực** được gỡ theo tệp `retire` của buổi sau (s02, s03, s07 có): ví dụ s02 gỡ test của user mặc định vì s02 khai user riêng.
- **`selftest.sh`** chạy toàn bộ `mvn -q test` của workspace tạm một lần ở cuối `./labs/lab selftest ssia`.

### Thời gian `selftest`

`./labs/lab selftest ssia` đi trên workspace tạm (không đụng `work/` của bạn) qua 8 buổi đã phát hành s01–s08, mỗi buổi hai lần Maven (verify đỏ, rồi xanh sau lời giải), rồi chạy `selftest.sh` một lần. Đo ngày 2026-11-14 trên Mac Apple Silicon, cache Maven đã có:

| JDK của Maven | Kết quả | Tổng thời gian |
|---|---|---|
| Microsoft OpenJDK 25.0.4 | 8 buổi đạt | 162 giây |
| Corretto 21.0.11 (`JAVA_HOME=$(/usr/libexec/java_home -v 21)`) | 8 buổi đạt | 127 giây |

Trước khi bỏ việc chạy lại `verify` của buổi trước và chạy `selftest.sh` sau mỗi buổi, cùng 8 buổi mất 343 giây và tăng theo bình phương số buổi; giờ thời gian tăng tuyến tính, khoảng 16–20 giây mỗi buổi. Cả hai lần chạy không in dòng cảnh báo JVM nào.

## Nâng phiên bản

Test của các buổi đọc vào chi tiết hiện thực của Spring Security 7.1.2 bằng reflection: đi đồ thị `AuthenticationManager` qua trường `parent` của `ProviderManager` và trường `delegate` của lớp bọc, gọi getter protected của filter. Các hàm này nằm trong `Support.java` của từng buổi (`sessions/<id>/tests/order/src/test/java/lab/<id>/Support.java`). Bản chép lặp lại ở mỗi buổi là có chủ ý: `retire` gỡ test theo tệp, nên một buổi không được phụ thuộc vào tệp của buổi khác.

Vì vậy nâng Spring Boot trong `labs/ssia/app/pom.xml` (kéo theo Spring Security) nghĩa là:

1. Chạy `./labs/lab selftest ssia`. Test dựa vào chi tiết đã đổi sẽ hỏng ở buổi đầu tiên dùng nó.
2. Sửa **mọi** bản `Support.java` liên quan (một bản mỗi buổi), không chỉ bản của buổi hỏng đầu tiên.
3. Đo lại `app/VERSIONS.md` và mọi `verifyOutput`, tên lớp, thông báo lỗi trong dữ liệu buổi (`webapp/js/data/practice/ssia/`) trên phiên bản mới.
