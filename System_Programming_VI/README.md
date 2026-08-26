# System Programming Coursebook — Bản dịch tiếng Việt

Bản dịch tiếng Việt đầy đủ của cuốn **System Programming Coursebook** (University of Illinois at Urbana-Champaign, môn CS 241) — tác giả **B. Venkatesh, L. Angrave et al.**

- Nguồn gốc: https://github.com/illinois-cs241/coursebook (bản PDF build ngày 24/03/2020, 390 trang)
- Giấy phép tài liệu gốc: [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Bản dịch này là tác phẩm phái sinh, được phân phối theo cùng giấy phép, có ghi công tác giả gốc.
- Nguyên tắc dịch: dịch đầy đủ từng mục, **giữ nguyên thuật ngữ chuyên ngành bằng tiếng Anh** (process, thread, mutex, file descriptor, page table, socket, ...) kèm giải nghĩa tiếng Việt ở lần xuất hiện đầu tiên; mã nguồn, tên hàm, system call, lệnh shell và output chương trình giữ nguyên văn.

## Mục lục

| Chương | File | Tên gốc |
|---|---|---|
| 1. Giới thiệu | [01-introduction.md](01-introduction.md) | Introduction |
| 2. Kiến thức nền tảng | [02-background.md](02-background.md) | Background |
| 3. Ngôn ngữ lập trình C | [03-c-programming-language.md](03-c-programming-language.md) | The C Programming Language |
| 4. Tiến trình | [04-processes.md](04-processes.md) | Processes |
| 5. Bộ cấp phát bộ nhớ | [05-memory-allocators.md](05-memory-allocators.md) | Memory Allocators |
| 6. Luồng | [06-threads.md](06-threads.md) | Threads |
| 7. Đồng bộ hoá | [07-synchronization.md](07-synchronization.md) | Synchronization |
| 8. Deadlock | [08-deadlock.md](08-deadlock.md) | Deadlock |
| 9. Bộ nhớ ảo và Giao tiếp liên tiến trình | [09-virtual-memory-and-ipc.md](09-virtual-memory-and-ipc.md) | Virtual Memory and Interprocess Communication |
| 10. Lập lịch | [10-scheduling.md](10-scheduling.md) | Scheduling |
| 11. Lập trình mạng | [11-networking.md](11-networking.md) | Networking |
| 12. Hệ thống tệp | [12-filesystems.md](12-filesystems.md) | Filesystems |
| 13. Tín hiệu | [13-signals.md](13-signals.md) | Signals |
| 14. Bảo mật | [14-security.md](14-security.md) | Security |
| 15. Ôn tập | [15-review.md](15-review.md) | Review |
| 16. Các chủ đề nâng cao | [16-honors-topics.md](16-honors-topics.md) | Honors topics |
| 17. Phụ lục | [17-appendix.md](17-appendix.md) | Appendix |
| 18. Phân tích hậu sự cố | [18-post-mortems.md](18-post-mortems.md) | Post Mortems |

Hình vẽ trong sách (48 hình) được trích từ PDF gốc và đặt trong thư mục [`images/`](images/) với tên `fig-<chương>.<số>.png`, tương ứng "Figure X.Y" trong bản gốc.

## Bảng thuật ngữ rút gọn

| Tiếng Anh (giữ nguyên) | Giải nghĩa |
|---|---|
| process / thread | tiến trình / luồng |
| kernel / system call | nhân hệ điều hành / lời gọi hệ thống |
| file descriptor | bộ mô tả tệp |
| virtual memory / page table / page fault / TLB | bộ nhớ ảo / bảng trang / lỗi trang / TLB |
| mutex / semaphore / condition variable | khoá loại trừ / semaphore / biến điều kiện |
| critical section / race condition / deadlock / livelock | vùng găng / tình huống đua / bế tắc / livelock |
| scheduler / context switch / preemption | bộ lập lịch / chuyển ngữ cảnh / chiếm quyền |
| socket / port / datagram | socket / cổng / datagram |
| filesystem / inode / directory | hệ thống tệp / inode / thư mục |
| allocator / free list / fragmentation / coalescing | bộ cấp phát / danh sách rỗng / phân mảnh / gộp khối |
| signal / signal handler / signal mask | tín hiệu / hàm xử lý tín hiệu / mặt nạ tín hiệu |
| buffer overflow / undefined behavior / memory leak | tràn bộ đệm / hành vi không xác định / rò rỉ bộ nhớ |

## Ghi chú về bản dịch

- Toàn bộ 18 chương được dịch đầy đủ từng mục, sau đó được hiệu đính đối chiếu với nguồn (kể cả đối chiếu từng dòng code với mã nguồn LaTeX gốc của sách).
- Một số chỗ bản gốc có lỗi hiển nhiên (ví dụ `DEBUG` thay vì `NDEBUG`, `AF_INET4`, đảo `O_RDONLY`/`O_WRONLY`, "March 2038") được dịch theo nghĩa đúng; nơi cần thiết có chú thích ngắn dạng *(ND: ...)*.
- Mã nguồn được giữ nguyên văn (kể cả các lỗi cố ý/vô ý trong sách gốc), chỉ chuẩn hoá dấu nháy cong do PDF và nối lại các dòng bị ngắt trang.
- Đề từ (epigraph) của chương 8 và chương 10 là lời bài hát có bản quyền riêng (không thuộc phần CC BY của sách) nên chỉ tóm lược ý và ghi nguồn, không dịch nguyên văn.
- Một số hyperlink trong sách gốc bị mất khi trích xuất PDF đã được khôi phục từ mã nguồn LaTeX (chương 3, 17, 18); các mục 16.2.2–16.2.4 trống nội dung ngay trong bản gốc.
