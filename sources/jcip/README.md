# Java Concurrency in Practice — bản dịch tiếng Việt

Bản dịch tiếng Việt *Java Concurrency in Practice* — Brian Goetz với Tim Peierls, Joshua Bloch,
Joseph Bowbeer, David Holmes, Doug Lea (Addison-Wesley, 2006).

**Sách có bản quyền thương mại**, không phải giấy phép mở như CC BY 4.0. Bản dịch nằm trong repo
này để học cá nhân; không phân phối lại.

## Phạm vi: 13 chương + 1 phụ lục

| Tệp | Chương |
|---|---|
| `02-thread-safety.md` | 2. Thread Safety |
| `03-sharing-objects.md` | 3. Sharing Objects |
| `04-composing-objects.md` | 4. Composing Objects |
| `05-building-blocks.md` | 5. Building Blocks |
| `06-task-execution.md` | 6. Task Execution |
| `07-cancellation-and-shutdown.md` | 7. Cancellation and Shutdown |
| `08-applying-thread-pools.md` | 8. Applying Thread Pools |
| `10-avoiding-liveness-hazards.md` | 10. Avoiding Liveness Hazards |
| `11-performance-and-scalability.md` | 11. Performance and Scalability |
| `13-explicit-locks.md` | 13. Explicit Locks |
| `14-building-custom-synchronizers.md` | 14. Building Custom Synchronizers |
| `15-atomic-variables-and-nonblocking-synchronization.md` | 15. Atomic Variables and Nonblocking Synchronization |
| `16-the-java-memory-model.md` | 16. The Java Memory Model |
| `A-annotations-for-concurrency.md` | Phụ lục A. Annotations for Concurrency |

Tổng 109.417 từ.

## Chương 1, 9 và 12 KHÔNG có trong bản dịch

Bản dịch không có chương 1 (Introduction), chương 9 (GUI Applications) và chương 12 (Testing
Concurrent Programs), và **cũng không có PDF gốc của ba chương đó**. Đây là giới hạn cứng của
nguồn, không phải việc còn dang dở.

Lỗ hổng này đã được đo và **nhẹ**: toàn bộ 14 tệp chỉ có 6 tham chiếu ngược tới ba chương vắng
(ch.1 hai lần ở chương 2 — câu dẫn nhập; ch.9 ba lần — đều về GUI/subsystem single-threaded;
ch.12 một lần ở chương 5 — nhắc một class ví dụ). **Không chương nào còn lại phụ thuộc vào ba
chương đó để đọc hiểu được.**

Phần kiểm thử chương trình concurrent mà ch.12 phụ trách được bù trong lộ trình đọc bằng
[jcstress](https://openjdk.org/projects/code-tools/jcstress/) ở tuần 10.

## Ảnh và PDF

204 ảnh trong `images/chNN/`, tham chiếu tương đối theo tệp chứa. Phụ lục A không có ảnh.

PDF gốc trong `pdf/`. Thư mục này **không** vào bản deploy hay image Docker —
`webapp/scripts/build-content.sh` sao chép cả cây `sources/` trừ `*.pdf`.
