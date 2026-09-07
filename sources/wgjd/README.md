# The Well-Grounded Java Developer, ấn bản 2 — bản dịch tiếng Việt

Nguồn: *The Well-Grounded Java Developer, Second Edition* — Benjamin J. Evans, Jason Clark,
Martijn Verburg (Manning).

**Sách có bản quyền thương mại**, không phải giấy phép mở như CC BY 4.0. Bản dịch trong repo
này dùng cho mục đích học tập cá nhân.

## Phạm vi: 16/18 chương

| Ch. | Tệp | Tiêu đề |
|---:|---|---|
| 1 | `01-introducing-modern-java.md` | Giới thiệu về Java hiện đại |
| 2 | `02-java-modules.md` | Java modules |
| 3 | `03-java-17.md` | Java 17 |
| 4 | `04-class-files-and-bytecode.md` | Class file và bytecode |
| 5 | `05-java-concurrency-fundamentals.md` | Nền tảng lập trình đồng thời trong Java |
| 6 | `06-jdk-concurrency-libraries.md` | Thư viện concurrency của JDK |
| 7 | `07-understanding-java-performance.md` | Hiểu về hiệu năng Java |
| 8 | `08-alternative-jvm-languages.md` | Các ngôn ngữ JVM thay thế |
| 11 | `11-building-with-gradle-and-maven.md` | Build với Gradle và Maven |
| 12 | `12-running-java-in-containers.md` | Chạy Java trong container |
| 13 | `13-testing-fundamentals.md` | Nền tảng kiểm thử |
| 14 | `14-testing-beyond-junit.md` | Kiểm thử vượt ra ngoài JUnit |
| 15 | `15-advanced-functional-programming.md` | Lập trình hàm nâng cao |
| 16 | `16-advanced-concurrent-programming.md` | Lập trình đồng thời nâng cao |
| 17 | `17-modern-internals.md` | Nội tại hiện đại của JVM |
| 18 | `18-future-java.md` | Java trong tương lai |

## Chương 9 và 10 KHÔNG có trong bản dịch

Chương 9 (Kotlin) và chương 10 (Clojure) không thuộc phạm vi bản dịch, và repo **cũng không có
PDF gốc** của hai chương đó.

Đây không phải thiếu sót cần vá bằng cách đánh số lại: id tài liệu trong app giữ đúng số chương
sách (`wgjd-01`…`wgjd-08`, `wgjd-11`…`wgjd-18`), chừa trống `wgjd-09` và `wgjd-10`.

**Lưu ý khi đọc:** ba chương 14, 15 và 16 dựa vào hai chương vắng mặt này ở mức nội dung, không
chỉ nhắc tên — chương 14 chạy test qua REPL Clojure, chương 15 và 16 đọc mã Kotlin và Clojure
liên tục, và cả ba đều có câu dẫn ngược kiểu "như đã thấy ở chương 9". Lộ trình đọc trong app
dành tuần 6 cho việc tự bổ túc cú pháp cơ bản hai ngôn ngữ từ tài liệu chính thức trước khi tới
đó.

## Ảnh và PDF

93 ảnh trong `images/chNN/`, tham chiếu tương đối theo tệp markdown chứa chúng. Chương 3 không
có ảnh nào.

PDF gốc trong `pdf/`, **không** được đưa vào `webapp/content/`, bản deploy hay image Docker —
`build-content.sh` tự loại trừ `*.pdf`.
