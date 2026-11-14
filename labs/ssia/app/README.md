# shop cho chương trình ssia

Ba service Spring Boot nhỏ (`gateway`, `catalog`, `order`) và module chung `common`. Đây là bản gốc chưa có bảo mật: qua các buổi, bạn sẽ thêm Spring Security vào từng bước. Phiên bản đã đo nằm trong `VERSIONS.md`.

## Chạy

Cần JDK, Maven và git. JDK đã chạy được: 21 (Amazon Corretto 21.0.11) và 25 (Microsoft OpenJDK 25.0.4); chi tiết trong `VERSIONS.md`. Trên JDK 25, `mvn test` vẫn xanh nhưng in cảnh báo của Mockito/ByteBuddy (tự gắn agent động). Muốn sạch cảnh báo, chuyển sang JDK 21 trên macOS: `export JAVA_HOME=$(/usr/libexec/java_home -v 21)`. Maven dùng `JAVA_HOME`, còn lệnh `java` lấy theo `PATH`; hai thứ có thể là hai JDK khác nhau, nên kiểm bằng `mvn -v` và `java -version`. Tạo workspace, rồi làm việc trong `labs/ssia/work/`:

```
./labs/lab up ssia
cd labs/ssia/work
mvn -q test
mvn -q -pl order -am package -DskipTests && java -jar order/target/order.jar
```

Lệnh `mvn -pl order spring-boot:run` không dùng được ở cấu trúc này (`common` không nằm trong reactor nên không phân giải được; thêm `-am` thì lỗi vì `common` không có lớp main). Hãy dùng lệnh `package` rồi `java -jar` ở trên.

`POST /orders` gọi sang `catalog`, nên cần `catalog` đang chạy trên cổng 8081 (`java -jar catalog/target/catalog.jar` sau khi `package`); `GET /orders` và `/actuator/health` thì không cần.

Không có `DB_URL` thì `order` và `catalog` dùng H2 trong bộ nhớ (catalog có sẵn 3 sản phẩm), không cần Docker.

## Cổng và service

| Service | Cổng mặc định | HTTP |
|---|---|---|
| gateway | 8080 | `GET /api/info`, `GET /api/products`, `POST /api/orders {productId, qty}`, `GET /api/orders` |
| catalog | 8081 | `GET /products`, `GET /products/{id}` |
| order | 8082 | `POST /orders`, `GET /orders` |

Mỗi service có `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness` và `/internal/burn?ms=`, `/internal/alloc?mb=`, `/internal/slow?ms=`.

## Biến môi trường

| Biến | Dùng ở | Mặc định |
|---|---|---|
| `SERVER_PORT` | cả ba | 8080 / 8081 / 8082 như bảng trên |
| `CATALOG_URL` | gateway, order | `http://localhost:8081` |
| `ORDER_URL` | gateway | `http://localhost:8082` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | catalog, order | vắng `DB_URL`: H2 trong bộ nhớ |
| `APP_GREETING` | gateway | `Xin chào từ shop` |
| `APP_VERSION` | cả ba | `1.0` |
