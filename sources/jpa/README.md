# Java Persistence with Spring Data and Hibernate

Bản dịch tiếng Việt của *Java Persistence with Spring Data and Hibernate* — Cătălin Tudose
(Manning).

> **Bản quyền.** Đây là sách thương mại có bản quyền, **không** phải giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Chương | 20 (1–20, đủ, không thiếu chương nào) |
| Số từ | 178.653 |
| Hình | 127, trong `images/chNN/` (hai chữ số, đệm 0) |
| PDF gốc | 20, trong `pdf/` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Trong app | Chưa có — task chuẩn hoá nguồn này là bước đầu tiên, chưa lĩnh vực nào trỏ tới `content/jpa/` |

## Mục lục

1. [Tìm hiểu về object/relational persistence](01-tim-hieu-object-relational-persistence.md)
2. [Bắt đầu một dự án](02-bat-dau-mot-du-an.md)
3. [Domain model và metadata](03-domain-model-va-metadata.md)
4. [Làm việc với Spring Data JPA](04-lam-viec-voi-spring-data-jpa.md)
5. [Ánh xạ các persistent class](05-anh-xa-cac-persistent-class.md)
6. [Ánh xạ value type](06-anh-xa-value-type.md)
7. [Ánh xạ inheritance](07-anh-xa-inheritance.md)
8. [Ánh xạ collection và entity association](08-anh-xa-collection-va-entity-association.md)
9. [Ánh xạ entity association nâng cao](09-anh-xa-entity-association-nang-cao.md)
10. [Quản lý dữ liệu](10-quan-ly-du-lieu.md)
11. [Transaction và concurrency](11-transaction-va-concurrency.md)
12. [Fetch plan, strategy và profile](12-fetch-plan-strategy-va-profile.md)
13. [Lọc dữ liệu](13-loc-du-lieu.md)
14. [Tích hợp JPA và Hibernate với Spring](14-tich-hop-jpa-va-hibernate-voi-spring.md)
15. [Làm việc với Spring Data JDBC](15-lam-viec-voi-spring-data-jdbc.md)
16. [Làm việc với Spring Data REST](16-lam-viec-voi-spring-data-rest.md)
17. [Làm việc với Spring Data MongoDB](17-lam-viec-voi-spring-data-mongodb.md)
18. [Làm việc với Hibernate OGM](18-lam-viec-voi-hibernate-ogm.md)
19. [Truy vấn JPA với Querydsl](19-truy-van-jpa-voi-querydsl.md)
20. [Kiểm thử ứng dụng Java persistence](20-kiem-thu-ung-dung-java-persistence.md)

## Ghi chú

- Chương 18 dạy Hibernate OGM, một dự án không còn được phát triển tích cực và không theo
  kịp Jakarta EE. Chương này được giữ trong bộ tài liệu để hiểu ý tưởng mở rộng khả chuyển
  của JPA sang NoSQL, không phải để dựng hệ thống mới trên Hibernate OGM.
