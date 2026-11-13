# shop: ứng dụng mẫu cho các buổi thực hành

Ba service Spring Boot nhỏ (`gateway`, `catalog`, `order`) để triển khai và vận hành trên cluster. Người học không sửa mã ở đây.

## Phiên bản

- **Java 25** (`eclipse-temurin:25-jre`, có `arm64`) và **Spring Boot 4.1.2**. Điều kiện của brief (`docker manifest inspect eclipse-temurin:25-jre` có `arm64`) đã thoả, nên không phải lùi về Java 21 / Boot 3.
- Build bằng Maven trong Docker, máy không cần JDK.

## Service

| Service | HTTP |
|---|---|
| gateway | `GET /api/info`, `GET /api/products`, `POST /api/orders {productId, qty}`, `GET /api/orders` |
| catalog | `GET /products`, `GET /products/{id}` |
| order | `POST /orders`, `GET /orders` |

Mỗi service còn có `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness` và `/internal/burn?ms=`, `/internal/alloc?mb=`, `/internal/slow?ms=`. Cổng 8080, `server.shutdown=graceful`, JVM chạy với `-XX:MaxRAMPercentage=75` (thêm tuỳ chọn qua `JAVA_OPTS`).

## Biến môi trường

| Biến | Dùng ở | Mặc định |
|---|---|---|
| `CATALOG_URL` | gateway, order | `http://catalog:8080` |
| `ORDER_URL` | gateway | `http://order:8080` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | catalog, order | vắng `DB_URL`: H2 trong bộ nhớ, catalog có sẵn 3 sản phẩm |
| `APP_GREETING` | gateway | `Xin chào từ shop` |
| `APP_VERSION` | cả ba | cố định trong image (`1.0` hoặc `2.0`) |

Với `DB_URL` là `jdbc:postgresql://…` service dùng PostgreSQL; bảng và dữ liệu mẫu tạo lúc khởi động (`schema.sql`, `data.sql`, chạy lại nhiều lần không lỗi). Đã thử với `postgres:17-alpine`.

## Phiên bản 1.0 và 2.0

Cùng một jar, khác `APP_VERSION` cố định trong image. Bản 2.0: `/api/info.version` là `"2.0"` và sản phẩm có thêm trường `discount` (10).

## Build và test

```
docker build --target test --progress=plain labs/cka/app     # test, không sinh image
./labs/lab images cka                                         # build (nếu thiếu) và nạp vào containerd các VM
docker build --build-arg SERVICE=catalog --build-arg APP_VERSION=2.0 -t shop/catalog:2.0 labs/cka/app
```
