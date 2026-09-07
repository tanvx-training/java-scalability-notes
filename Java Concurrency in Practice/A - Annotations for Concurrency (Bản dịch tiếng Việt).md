# Phụ lục A. Annotations for Concurrency

> **Về bản dịch này.** Đây là bản **dịch đầy đủ** Phụ lục A của cuốn *Java Concurrency in Practice* (Brian Goetz và cộng sự). Các **thuật ngữ chuyên ngành được giữ nguyên tiếng Anh**. Phụ lục này trong PDF gốc **không có code listing hay hình vẽ** nào.

---

Chúng ta đã dùng các annotation như `@GuardedBy` và `@ThreadSafe` để cho thấy cách các cam kết về thread-safety và các synchronization policy có thể được **ghi lại thành tài liệu**. Phụ lục này ghi lại tài liệu về những annotation đó; mã nguồn của chúng có thể tải về từ website của cuốn sách. (Dĩ nhiên, còn có thêm những cam kết về thread-safety và chi tiết hiện thực **nên được ghi lại** nhưng **không** được nắm bắt bởi tập annotation tối thiểu này.)

---

## A.1. Class Annotation

Chúng ta dùng **ba annotation ở cấp class** để mô tả những cam kết về thread-safety mà một class hướng tới: **`@Immutable`**, **`@ThreadSafe`**, và **`@NotThreadSafe`**.

`@Immutable` dĩ nhiên nghĩa là class đó **immutable**, và **hàm ý** `@ThreadSafe`. `@NotThreadSafe` là **tùy chọn** — nếu một class không được annotate là thread-safe, thì **nên giả định rằng nó không thread-safe**, nhưng nếu bạn muốn làm rõ hơn nữa, hãy dùng `@NotThreadSafe`.

Những annotation này **tương đối không xâm lấn** và có lợi cho **cả người dùng lẫn người bảo trì**. Người dùng có thể **thấy ngay** một class có thread-safe hay không, còn người bảo trì có thể **thấy ngay** liệu các bảo đảm về thread-safety có phải được bảo toàn hay không. Annotation cũng hữu ích cho một nhóm đối tượng thứ ba: **các công cụ**. Các công cụ phân tích code tĩnh có thể **kiểm chứng** rằng code tuân thủ hợp đồng mà annotation chỉ ra, chẳng hạn kiểm chứng rằng một class được annotate `@Immutable` thực sự là immutable.

---

## A.2. Field và Method Annotation

Các annotation cấp class ở trên là một phần **tài liệu công khai** của class. Những khía cạnh khác trong chiến lược thread-safety của một class thì **hoàn toàn dành cho người bảo trì** và **không** thuộc tài liệu công khai của nó.

Những class dùng locking nên **ghi lại tài liệu** về việc **state variable nào được lock nào bảo vệ**, và **những lock nào được dùng để bảo vệ những biến đó**. Một nguồn phổ biến gây mất thread-safety một cách vô tình là khi một class thread-safe dùng locking nhất quán để bảo vệ state của nó, nhưng **sau đó bị sửa** để thêm hoặc là những **state variable mới không được locking bảo vệ đầy đủ**, hoặc là những **method mới không dùng locking đúng cách** để bảo vệ các state variable hiện có. Việc ghi lại tài liệu về biến nào được lock nào bảo vệ có thể giúp **ngăn cả hai loại thiếu sót** này.

**`@GuardedBy(lock)`** ghi lại rằng một field hay method **chỉ nên được truy cập khi đang giữ một lock cụ thể**. Đối số `lock` xác định lock nào phải được giữ khi truy cập field hay method được annotate. Các giá trị khả dĩ cho `lock` là:

- **`@GuardedBy("this")`** — nghĩa là **intrinsic lock trên object chứa nó** (object mà method hay field đó là thành viên);
- **`@GuardedBy("fieldName")`** — nghĩa là lock gắn với object được field mang tên đó tham chiếu tới, hoặc là một **intrinsic lock** (với những field không tham chiếu tới một `Lock`) hoặc là một **`Lock` tường minh** (với những field tham chiếu tới một `Lock`);
- **`@GuardedBy("ClassName.fieldName")`** — giống `@GuardedBy("fieldName")`, nhưng tham chiếu tới một lock object được giữ trong một **static field của một class khác**;
- **`@GuardedBy("methodName()")`** — nghĩa là **lock object được trả về** bởi việc gọi method mang tên đó;
- **`@GuardedBy("ClassName.class")`** — nghĩa là **class literal object** của class mang tên đó.

Việc dùng `@GuardedBy` để xác định **mỗi state variable cần locking** và **lock nào bảo vệ nó** có thể hỗ trợ việc **bảo trì và review code**, đồng thời có thể giúp các **công cụ phân tích tự động** phát hiện những lỗi thread-safety tiềm tàng.
