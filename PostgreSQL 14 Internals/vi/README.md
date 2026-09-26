# PostgreSQL 14 Internals — Bản dịch tiếng Việt

**Tác giả:** Egor Rogov
**Bản tiếng Anh:** Liudmila Mantrova dịch từ tiếng Nga
© Postgres Professional, 2022–2023 · ISBN 978-5-6045970-4-0
Sách gốc (PDF, miễn phí): postgrespro.com/community/books/internals

> **Ghi chú của bản dịch:** Mỗi chương là một file markdown riêng. Thuật ngữ chuyên ngành được giữ nguyên tiếng Anh. Mã nguồn, câu lệnh SQL và kết quả truy vấn được giữ nguyên văn. Hình minh hoạ lấy từ bản gốc (thư mục `images/`), chữ trong hình vẫn là tiếng Anh. Ghi chú bên lề của sách gốc được đặt ngay trong đoạn văn: *[→ tr. N](...)* là tham chiếu tới trang N của sách gốc (link trỏ tới chương chứa trang đó), *(v. N)* là phiên bản PostgreSQL bắt đầu có tính năng, *(mặc định: …)* là giá trị mặc định của tham số được nhắc tới. Phần Index (chỉ mục tra cứu theo số trang) của sách gốc không được đưa vào.

## Mục lục

- [Về cuốn sách này (About This Book)](00-about-this-book.md)
- [Chương 1. Giới thiệu (Introduction)](01-introduction.md)

### Phần I. Isolation và MVCC (Isolation and MVCC)

- [Chương 2. Isolation (Tính cô lập)](02-isolation.md)
- [Chương 3. Pages and Tuples (Page và tuple)](03-pages-and-tuples.md)
- [Chương 4. Snapshots (Ảnh chụp dữ liệu)](04-snapshots.md)
- [Chương 5. Page Pruning và HOT Updates (Dọn dẹp trang và cập nhật HOT)](05-page-pruning-and-hot-updates.md)
- [Chương 6. Vacuum và Autovacuum (Dọn dẹp và tự động dọn dẹp)](06-vacuum-and-autovacuum.md)
- [Chương 7. Freezing (Đóng băng)](07-freezing.md)
- [Chương 8. Xây dựng lại bảng và index (Rebuilding Tables and Indexes)](08-rebuilding-tables-and-indexes.md)

### Phần II. Buffer Cache và WAL (Buffer Cache and WAL)

- [Chương 9. Buffer Cache (Bộ đệm dữ liệu)](09-buffer-cache.md)
- [Chương 10. Write-Ahead Log (Nhật ký ghi trước)](10-write-ahead-log.md)
- [Chương 11. Các chế độ WAL (WAL Modes)](11-wal-modes.md)

### Phần III. Lock (Locks)

- [Chương 12. Relation-Level Locks (Khóa ở mức relation)](12-relation-level-locks.md)
- [Chương 13. Row-Level Locks (Khóa mức dòng)](13-row-level-locks.md)
- [Chương 14. Miscellaneous Locks (Các loại lock khác)](14-miscellaneous-locks.md)
- [Chương 15. Lock trên các cấu trúc bộ nhớ (Locks on Memory Structures)](15-locks-on-memory-structures.md)

### Phần IV. Thực thi truy vấn (Query Execution)

- [Chương 16. Các giai đoạn thực thi truy vấn (Query Execution Stages)](16-query-execution-stages.md)
- [Chương 17. Statistics (Thống kê)](17-statistics.md)
- [Chương 18. Table Access Methods (Các phương thức truy cập bảng)](18-table-access-methods.md)
- [Chương 19. Index Access Methods (Các phương thức truy cập chỉ mục)](19-index-access-methods.md)
- [Chương 20. Index Scans (Quét chỉ mục)](20-index-scans.md)
- [Chương 21. Nested Loop (Vòng lặp lồng nhau)](21-nested-loop.md)
- [Chương 22. Hashing (Băm)](22-hashing.md)
- [Chương 23. Sorting and Merging (Sắp xếp và trộn)](23-sorting-and-merging.md)

### Phần V. Các loại index (Types of Indexes)

- [Chương 24. Hash](24-hash.md)
- [Chương 25. B-tree (Cây B)](25-b-tree.md)
- [Chương 26. GiST](26-gist.md)
- [Chương 27. SP-GiST](27-sp-gist.md)
- [Chương 28. GIN](28-gin.md)
- [Chương 29. BRIN](29-brin.md)

- [Lời kết (Conclusion)](30-conclusion.md)
