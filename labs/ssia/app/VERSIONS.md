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
- Bản cũ hơn cùng BOM: `org.springframework.boot:spring-boot-starter-oauth2-authorization-server` (có trong BOM, POM cùng danh sách phụ thuộc).
- Thư viện lõi: `org.springframework.security:spring-security-oauth2-authorization-server`. Dòng 1.x (đến 1.5.8) là dòng độc lập cũ; từ 7.0.0 nó cùng số phiên bản với Spring Security. Với Boot 4.1.2 là **7.1.2**.
- Chưa tải thử các artifact này vào ứng dụng (chưa thêm vào `pom.xml`), nên chưa quan sát chúng chạy.

## Khác

- Nhiều JDK cài sẵn trên máy đo; JDK mặc định của shell là 25, nên mọi lệnh Maven ở đây đặt `JAVA_HOME` về Corretto 21.
- RAM: một JVM `order` đang chạy (`java -jar order/target/order.jar`, H2, JDK 21, không đặt `-Xmx`) có RSS khoảng 254 MB (259 568 KB sau khởi động, 260 528 KB sau 20 giây).
- Cổng mặc định: gateway 8080, catalog 8081, order 8082 (ghi đè bằng `SERVER_PORT`).
