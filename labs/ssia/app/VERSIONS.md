# Phiên bản đã đo của `labs/ssia/app`

Mọi số dưới đây lấy từ `mvn dependency:tree`, từ `spring-boot-dependencies-4.1.2.pom` và từ siêu dữ liệu Maven Central, đo ngày 2026-11-14.

## Đã thấy trong cây phụ thuộc của module `order`

| Thành phần | Phiên bản | Nguồn |
|---|---|---|
| Spring Boot (parent) | 4.1.2 | `pom.xml`, `dependency:tree` |
| Spring Framework | 7.0.10 | `spring-framework.version` trong BOM Boot 4.1.2; `spring-web`, `spring-core` 7.0.10 có trong `~/.m2` |
| Tomcat nhúng | 11.0.27 (`tomcat-embed-core`) | `dependency:tree` |
| H2 | 2.4.240 (runtime) | `dependency:tree` |
| JUnit Jupiter | 6.0.3 | `junit-jupiter.version` trong BOM |
| maven-surefire-plugin | 3.5.6 | log `mvn test` |
| JDK dùng để đo | Amazon Corretto 21.0.11 (`java.version=21` trong `pom.xml`) | `mvn -v` |

## Spring Security

Ứng dụng gốc **chưa có** Spring Security nên `dependency:tree` không liệt kê nó. Phiên bản Boot 4.1.2 sẽ kéo vào khi thêm `spring-boot-starter-security` là **7.1.2** (`spring-security.version` trong BOM; `spring-security-bom` 7.1.2 được import).

## Authorization server

Đã xác minh trên Maven Central (POM của Boot 4.1.2 và siêu dữ liệu):

- Starter: `org.springframework.boot:spring-boot-starter-security-oauth2-authorization-server`, quản lý bởi BOM Boot 4.1.2 (không cần ghi phiên bản). Nó kéo `spring-boot-starter`, `spring-boot-starter-security`, `spring-boot-starter-webmvc` và `spring-boot-security-oauth2-authorization-server`.
- Starter thứ hai cũng có trong BOM: `org.springframework.boot:spring-boot-starter-oauth2-authorization-server` (4.1.2), POM cùng danh sách phụ thuộc. Chưa xác minh quan hệ giữa hai starter.
- Thư viện lõi: `org.springframework.security:spring-security-oauth2-authorization-server`. Dòng 1.x (đến 1.5.8) là dòng độc lập cũ; từ 7.0.0 nó cùng số phiên bản với Spring Security. Với Boot 4.1.2 là **7.1.2**.
- Chưa tải thử các artifact này vào ứng dụng (chưa thêm vào `pom.xml`), nên chưa quan sát chúng chạy.

## Khác

- JDK đã đo (workspace mới từ `./labs/lab up ssia`):
  - Corretto 21.0.11: `mvn -q clean test` xanh (13 test), `order` chạy, `/orders` trả 200 `[]`, `/actuator/health` UP.
  - Microsoft OpenJDK 25.0.4 (mặc định của `JAVA_HOME` trên máy đo): `mvn -q test` xanh (13 test), `java -jar order/target/order.jar` chạy ("Using Java 25.0.4"), cùng kết quả curl. Khi test in cảnh báo (mỗi JVM test một lần, nguyên văn):
    - `Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in future releases of the JDK. Please add Mockito as an agent to your build as described in Mockito's documentation: ...`
    - `WARNING: A Java agent has been loaded dynamically (.../byte-buddy-agent-1.18.15.jar)`, `WARNING: Dynamic loading of agents will be disallowed by default in a future release`
    - `OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended`
  - Chuyển về 21 trên macOS: `export JAVA_HOME=$(/usr/libexec/java_home -v 21)`. Lưu ý Maven theo `JAVA_HOME`, còn `java` theo `PATH` (trên máy đo hai thứ này khác JDK nhau).
- RAM: một JVM `order` đang chạy (`java -jar order/target/order.jar`, H2, JDK 21, không đặt `-Xmx`) có RSS khoảng 254 MB (259 568 KB sau khởi động, 260 528 KB sau 20 giây).
- Cổng mặc định: gateway 8080, catalog 8081, order 8082 (ghi đè bằng `SERVER_PORT`).
