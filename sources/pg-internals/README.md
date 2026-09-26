# PostgreSQL 14 Internals

Bản dịch tiếng Việt của *PostgreSQL 14 Internals* — Egor Rogov. Bản tiếng Anh do Liudmila Mantrova
dịch từ tiếng Nga. © Postgres Professional, 2022–2023 · ISBN 978-5-6045970-4-0.

> **Bản quyền.** Sách gốc được Postgres Professional phát hành **miễn phí** dạng PDF tại
> <https://postgrespro.com/community/books/internals>, nhưng **không** kèm giấy phép mở như
> CC BY 4.0 (khác `sources/sysprog/`). Bản dịch nằm trong repo để học cá nhân.

| Chỉ số | Giá trị |
|---|---|
| Tệp | 31: "Về cuốn sách này" (00), chương 1–29, "Lời kết" (30) |
| Phần | 5 — Isolation và MVCC · Buffer cache và WAL · Lock · Thực thi truy vấn · Các loại index |
| Số từ | 161.670 |
| Hình | 146, trong `images/` (chữ trong hình giữ tiếng Anh) |
| PDF gốc | `pdf/postgresql-internals-14.pdf` — `build-content.sh` không sao chép `*.pdf` vào bản deploy hay image Docker |
| Trong app | Lĩnh vực **PostgreSQL 14 Internals**, kèm lộ trình đọc 12 tuần / 48 mục và 24 câu phỏng vấn |

## Ghi chú của bản dịch

Mỗi chương là một file markdown riêng. Thuật ngữ chuyên ngành được giữ nguyên tiếng Anh. Mã nguồn, câu
lệnh SQL và kết quả truy vấn được giữ nguyên văn. Ghi chú bên lề của sách gốc được đặt ngay trong đoạn
văn: *[→ tr. N](...)* là tham chiếu tới trang N của sách gốc (link trỏ tới chương chứa trang đó),
*(v. N)* là phiên bản PostgreSQL bắt đầu có tính năng, *(mặc định: …)* là giá trị mặc định của tham số
được nhắc tới. Phần Index (chỉ mục tra cứu theo số trang) của sách gốc không được đưa vào.

**Không đổi tên tệp.** Các link `[→ tr. N](NN-slug.md)` và `images/…` dựa vào tên tệp hiện tại; web app
đổi chúng thành link nội bộ lúc hiển thị.

## Mục lục

- [Về cuốn sách này (About This Book)](00-about-this-book.md)
- [Chương 1. Giới thiệu (Introduction)](01-introduction.md)

### Phần I. Isolation và MVCC

- [Chương 2. Isolation (Tính cô lập)](02-isolation.md)
- [Chương 3. Pages and Tuples (Page và tuple)](03-pages-and-tuples.md)
- [Chương 4. Snapshots (Ảnh chụp dữ liệu)](04-snapshots.md)
- [Chương 5. Page Pruning và HOT Updates](05-page-pruning-and-hot-updates.md)
- [Chương 6. Vacuum và Autovacuum](06-vacuum-and-autovacuum.md)
- [Chương 7. Freezing (Đóng băng)](07-freezing.md)
- [Chương 8. Xây dựng lại bảng và index](08-rebuilding-tables-and-indexes.md)

### Phần II. Buffer cache và WAL

- [Chương 9. Buffer Cache (Bộ đệm dữ liệu)](09-buffer-cache.md)
- [Chương 10. Write-Ahead Log (Nhật ký ghi trước)](10-write-ahead-log.md)
- [Chương 11. Các chế độ WAL (WAL Modes)](11-wal-modes.md)

### Phần III. Lock

- [Chương 12. Relation-Level Locks](12-relation-level-locks.md)
- [Chương 13. Row-Level Locks](13-row-level-locks.md)
- [Chương 14. Miscellaneous Locks](14-miscellaneous-locks.md)
- [Chương 15. Lock trên các cấu trúc bộ nhớ](15-locks-on-memory-structures.md)

### Phần IV. Thực thi truy vấn

- [Chương 16. Các giai đoạn thực thi truy vấn](16-query-execution-stages.md)
- [Chương 17. Statistics (Thống kê)](17-statistics.md)
- [Chương 18. Table Access Methods](18-table-access-methods.md)
- [Chương 19. Index Access Methods](19-index-access-methods.md)
- [Chương 20. Index Scans (Quét chỉ mục)](20-index-scans.md)
- [Chương 21. Nested Loop](21-nested-loop.md)
- [Chương 22. Hashing (Băm)](22-hashing.md)
- [Chương 23. Sorting and Merging](23-sorting-and-merging.md)

### Phần V. Các loại index

- [Chương 24. Hash](24-hash.md)
- [Chương 25. B-tree (Cây B)](25-b-tree.md)
- [Chương 26. GiST](26-gist.md)
- [Chương 27. SP-GiST](27-sp-gist.md)
- [Chương 28. GIN](28-gin.md)
- [Chương 29. BRIN](29-brin.md)

- [Lời kết (Conclusion)](30-conclusion.md)
