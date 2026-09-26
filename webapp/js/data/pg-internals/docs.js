// Tài liệu lĩnh vực "PostgreSQL 14 Internals" — 31 tài liệu: "Về cuốn sách này" (00),
// chương 1–29 và "Lời kết" (30).
// Nguồn markdown: sources/pg-internals/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/pg-internals/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// `chapter` (số / null) và `part` (Phần trong sách / null): nhãn hiển thị sinh bởi
// labels.js ("Ch. 5 · …"), `title` chỉ còn tên chương (bất biến D1).
// Phần lấy từ mục lục của bản dịch (sources/pg-internals/README.md).
//
// KHÔNG đổi tên tệp nguồn: ~250 link "[→ tr. N](NN-slug.md)" trong bản dịch được
// docs.js (rewriteMarkdownLinks) đổi thành #/docs/pg-NN nhờ khớp đúng `file` dưới đây.

const P1 = "Phần I — Isolation và MVCC";
const P2 = "Phần II — Buffer cache và WAL";
const P3 = "Phần III — Lock";
const P4 = "Phần IV — Thực thi truy vấn";
const P5 = "Phần V — Các loại index";

export const docs = [
  {
    id: "pg-00", field: "pg-internals", chapter: null, part: null,
    title: "Về cuốn sách này (About This Book)",
    file: "content/pg-internals/00-about-this-book.md", icon: "📖",
    desc: "Sách dành cho ai, không và có mang lại gì, cấu trúc năm Phần và quy ước ghi chú lề (tham chiếu trang, phiên bản, giá trị mặc định).",
    tags: ["PostgreSQL", "Giới thiệu", "Quy ước"],
  },
  {
    id: "pg-01", field: "pg-internals", chapter: 1, part: null,
    title: "Giới thiệu (Introduction)",
    file: "content/pg-internals/01-introduction.md", icon: "🐘",
    desc: "Bức tranh tổng thể: database, schema, relation, fork và page; process postmaster, backend, background; shared memory; giao thức client-server.",
    tags: ["PostgreSQL", "Kiến trúc", "Process"],
  },
  {
    id: "pg-02", field: "pg-internals", chapter: 2, part: P1,
    title: "Isolation (Tính cô lập)",
    file: "content/pg-internals/02-isolation.md", icon: "🧪",
    desc: "Consistency, các anomaly và isolation level trong chuẩn SQL, cách PostgreSQL hiện thực Read Committed, Repeatable Read, Serializable — và nên chọn mức nào.",
    tags: ["PostgreSQL", "Isolation", "Anomaly"],
  },
  {
    id: "pg-03", field: "pg-internals", chapter: 3, part: P1,
    title: "Pages and Tuples (Page và tuple)",
    file: "content/pg-internals/03-pages-and-tuples.md", icon: "📄",
    desc: "Cấu trúc page, bố cục row version (xmin, xmax, infomask), insert/update/delete trên tuple, index, TOAST, virtual transaction và subtransaction.",
    tags: ["PostgreSQL", "MVCC", "Page layout"],
  },
  {
    id: "pg-04", field: "pg-internals", chapter: 4, part: P1,
    title: "Snapshots (Ảnh chụp dữ liệu)",
    file: "content/pg-internals/04-snapshots.md", icon: "📸",
    desc: "Snapshot là gì, quy tắc visibility của row version, cấu trúc snapshot (xmin, xmax, xip), transaction horizon, snapshot của catalog và export snapshot.",
    tags: ["PostgreSQL", "Snapshot", "Visibility"],
  },
  {
    id: "pg-05", field: "pg-internals", chapter: 5, part: P1,
    title: "Page Pruning và HOT Updates (Dọn dẹp trang và cập nhật HOT)",
    file: "content/pg-internals/05-page-pruning-and-hot-updates.md", icon: "✂️",
    desc: "Dọn dẹp trong phạm vi một page khi đọc, HOT update tránh cập nhật index, HOT chain và khi nào chain bị tách, pruning cho index.",
    tags: ["PostgreSQL", "HOT update", "Pruning"],
  },
  {
    id: "pg-06", field: "pg-internals", chapter: 6, part: P1,
    title: "Vacuum và Autovacuum (Dọn dẹp và tự động dọn dẹp)",
    file: "content/pg-internals/06-vacuum-and-autovacuum.md", icon: "🧹",
    desc: "Vacuum làm gì, database horizon, các giai đoạn vacuum, analyze, autovacuum kích hoạt khi nào, quản lý tải và giám sát.",
    tags: ["PostgreSQL", "Vacuum", "Autovacuum"],
  },
  {
    id: "pg-07", field: "pg-internals", chapter: 7, part: P1,
    title: "Freezing (Đóng băng)",
    file: "content/pg-internals/07-freezing.md", icon: "🧊",
    desc: "Wraparound của transaction ID 32 bit, đóng băng tuple và quy tắc visibility, các tham số điều khiển freezing, freeze thủ công.",
    tags: ["PostgreSQL", "Freezing", "Wraparound"],
  },
  {
    id: "pg-08", field: "pg-internals", chapter: 8, part: P1,
    title: "Xây dựng lại bảng và index (Rebuilding Tables and Indexes)",
    file: "content/pg-internals/08-rebuilding-tables-and-indexes.md", icon: "🏗️",
    desc: "VACUUM FULL, các cách rebuild khác (CLUSTER, REINDEX, pg_repack) và biện pháp phòng ngừa để không phải rebuild.",
    tags: ["PostgreSQL", "Bloat", "VACUUM FULL"],
  },
  {
    id: "pg-09", field: "pg-internals", chapter: 9, part: P2,
    title: "Buffer Cache (Bộ đệm dữ liệu)",
    file: "content/pg-internals/09-buffer-cache.md", icon: "🗃️",
    desc: "Thiết kế buffer cache, cache hit và miss, thuật toán eviction, bulk eviction qua buffer ring, chọn shared_buffers, làm nóng cache, local cache.",
    tags: ["PostgreSQL", "Buffer cache", "shared_buffers"],
  },
  {
    id: "pg-10", field: "pg-internals", chapter: 10, part: P2,
    title: "Write-Ahead Log (Nhật ký ghi trước)",
    file: "content/pg-internals/10-write-ahead-log.md", icon: "📝",
    desc: "Vì sao cần WAL, cấu trúc WAL record và LSN, checkpoint, khôi phục sau sự cố, background writer và các tham số thiết lập WAL.",
    tags: ["PostgreSQL", "WAL", "Checkpoint"],
  },
  {
    id: "pg-11", field: "pg-internals", chapter: 11, part: P2,
    title: "Các chế độ WAL (WAL Modes)",
    file: "content/pg-internals/11-wal-modes.md", icon: "⚙️",
    desc: "Hiệu năng ghi WAL (synchronous/asynchronous commit), khả năng chịu lỗi (fsync, checksum, full page writes) và các mức wal_level.",
    tags: ["PostgreSQL", "WAL", "Durability"],
  },
  {
    id: "pg-12", field: "pg-internals", chapter: 12, part: P3,
    title: "Relation-Level Locks (Khóa ở mức relation)",
    file: "content/pg-internals/12-relation-level-locks.md", icon: "🔒",
    desc: "Heavyweight lock, lock trên transaction ID, tám mode lock mức relation và ma trận xung đột, hàng đợi chờ khiến một lệnh DDL chặn mọi truy vấn.",
    tags: ["PostgreSQL", "Lock", "DDL"],
  },
  {
    id: "pg-13", field: "pg-internals", chapter: 13, part: P3,
    title: "Row-Level Locks (Khóa mức dòng)",
    file: "content/pg-internals/13-row-level-locks.md", icon: "🔐",
    desc: "Lock mức dòng lưu trong tuple, bốn mode FOR UPDATE/NO KEY UPDATE/SHARE/KEY SHARE, multitransaction, hàng đợi chờ, NOWAIT/SKIP LOCKED và deadlock.",
    tags: ["PostgreSQL", "Row lock", "Deadlock"],
  },
  {
    id: "pg-14", field: "pg-internals", chapter: 14, part: P3,
    title: "Miscellaneous Locks (Các loại lock khác)",
    file: "content/pg-internals/14-miscellaneous-locks.md", icon: "🗝️",
    desc: "Lock không gắn với đối tượng, lock mở rộng relation, lock trang, advisory lock và predicate lock của Serializable.",
    tags: ["PostgreSQL", "Advisory lock", "Predicate lock"],
  },
  {
    id: "pg-15", field: "pg-internals", chapter: 15, part: P3,
    title: "Lock trên các cấu trúc bộ nhớ (Locks on Memory Structures)",
    file: "content/pg-internals/15-locks-on-memory-structures.md", icon: "🧠",
    desc: "Spinlock, lightweight lock, ví dụ trên buffer cache và WAL, giám sát wait event và lấy mẫu pg_stat_activity.",
    tags: ["PostgreSQL", "LWLock", "Wait event"],
  },
  {
    id: "pg-16", field: "pg-internals", chapter: 16, part: P4,
    title: "Các giai đoạn thực thi truy vấn (Query Execution Stages)",
    file: "content/pg-internals/16-query-execution-stages.md", icon: "🔄",
    desc: "Database demo, simple query protocol (parse, rewrite, plan, execute) và extended query protocol với prepared statement, generic và custom plan.",
    tags: ["PostgreSQL", "Planner", "EXPLAIN"],
  },
  {
    id: "pg-17", field: "pg-internals", chapter: 17, part: P4,
    title: "Statistics (Thống kê)",
    file: "content/pg-internals/17-statistics.md", icon: "📊",
    desc: "Thống kê cơ bản, NULL, distinct, most common values, histogram, correlation, thống kê cho biểu thức và thống kê đa biến — nền của mọi ước lượng cardinality.",
    tags: ["PostgreSQL", "Statistics", "Cardinality"],
  },
  {
    id: "pg-18", field: "pg-internals", chapter: 18, part: P4,
    title: "Table Access Methods (Các phương thức truy cập bảng)",
    file: "content/pg-internals/18-table-access-methods.md", icon: "🚶",
    desc: "Storage engine dạng cắm được, sequential scan và cách tính chi phí, parallel plan, parallel sequential scan và giới hạn của thực thi song song.",
    tags: ["PostgreSQL", "Seq scan", "Parallel"],
  },
  {
    id: "pg-19", field: "pg-internals", chapter: 19, part: P4,
    title: "Index Access Methods (Các phương thức truy cập chỉ mục)",
    file: "content/pg-internals/19-index-access-methods.md", icon: "🔌",
    desc: "Index và khả năng mở rộng, operator class và operator family, giao diện indexing engine và các thuộc tính (capability) của access method.",
    tags: ["PostgreSQL", "Index", "Operator class"],
  },
  {
    id: "pg-20", field: "pg-internals", chapter: 20, part: P4,
    title: "Index Scans (Quét chỉ mục)",
    file: "content/pg-internals/20-index-scans.md", icon: "🔎",
    desc: "Index scan, index-only scan và visibility map, bitmap scan, parallel index scan, và so sánh chi phí các phương thức truy cập theo selectivity.",
    tags: ["PostgreSQL", "Index scan", "Bitmap scan"],
  },
  {
    id: "pg-21", field: "pg-internals", chapter: 21, part: P4,
    title: "Nested Loop (Vòng lặp lồng nhau)",
    file: "content/pg-internals/21-nested-loop.md", icon: "🔁",
    desc: "Các kiểu join và phương thức join; nested loop join, parameterized join, memoize và cách planner ước lượng chi phí.",
    tags: ["PostgreSQL", "Join", "Nested loop"],
  },
  {
    id: "pg-22", field: "pg-internals", chapter: 22, part: P4,
    title: "Hashing (Băm)",
    file: "content/pg-internals/22-hashing.md", icon: "#️⃣",
    desc: "Hash join một lượt và hai lượt (batch ra đĩa), parallel hash join, và hash cho distinct/gom nhóm.",
    tags: ["PostgreSQL", "Hash join", "work_mem"],
  },
  {
    id: "pg-23", field: "pg-internals", chapter: 23, part: P4,
    title: "Sorting and Merging (Sắp xếp và trộn)",
    file: "content/pg-internals/23-sorting-and-merging.md", icon: "🔀",
    desc: "Merge join, các thuật toán sắp xếp (quicksort, top-N heapsort, external sort), distinct/gom nhóm bằng sort và so sánh ba phương pháp join.",
    tags: ["PostgreSQL", "Merge join", "Sort"],
  },
  {
    id: "pg-24", field: "pg-internals", chapter: 24, part: P5,
    title: "Hash",
    file: "content/pg-internals/24-hash.md", icon: "🧮",
    desc: "Hash index: tổng quan, bố cục trang, operator class và các thuộc tính — chỉ hỗ trợ tìm kiếm bằng, không hỗ trợ sắp xếp hay index-only scan.",
    tags: ["PostgreSQL", "Hash index", "Index"],
  },
  {
    id: "pg-25", field: "pg-internals", chapter: 25, part: P5,
    title: "B-tree (Cây B)",
    file: "content/pg-internals/25-b-tree.md", icon: "🌳",
    desc: "Cấu trúc B-tree, tìm kiếm và chèn (page split), bố cục page và deduplication, operator class, thuộc tính: thứ tự, unique, covering index.",
    tags: ["PostgreSQL", "B-tree", "Index"],
  },
  {
    id: "pg-26", field: "pg-internals", chapter: 26, part: P5,
    title: "GiST",
    file: "content/pg-internals/26-gist.md", icon: "🗺️",
    desc: "Khung GiST, R-tree cho điểm (tìm kiếm, k-NN), RD-tree cho tìm kiếm toàn văn và các kiểu dữ liệu khác như range với exclusion constraint.",
    tags: ["PostgreSQL", "GiST", "Không gian"],
  },
  {
    id: "pg-27", field: "pg-internals", chapter: 27, part: P5,
    title: "SP-GiST",
    file: "content/pg-internals/27-sp-gist.md", icon: "🧭",
    desc: "Cây phân hoạch không cân bằng: quadtree và k-d tree cho điểm, radix tree cho chuỗi, và các kiểu dữ liệu khác.",
    tags: ["PostgreSQL", "SP-GiST", "Radix tree"],
  },
  {
    id: "pg-28", field: "pg-internals", chapter: 28, part: P5,
    title: "GIN",
    file: "content/pg-internals/28-gin.md", icon: "🧷",
    desc: "Inverted index: tìm kiếm toàn văn, trigram, index mảng, index JSON (jsonb_ops và jsonb_path_ops) và các kiểu dữ liệu khác.",
    tags: ["PostgreSQL", "GIN", "Full-text"],
  },
  {
    id: "pg-29", field: "pg-internals", chapter: 29, part: P5,
    title: "BRIN",
    file: "content/pg-internals/29-brin.md", icon: "🧱",
    desc: "Block range index: ví dụ, bố cục page, tìm kiếm, cập nhật summary và bốn họ operator class minmax, minmax-multi, inclusion, bloom.",
    tags: ["PostgreSQL", "BRIN", "Time-series"],
  },
  {
    id: "pg-30", field: "pg-internals", chapter: null, part: null,
    title: "Lời kết (Conclusion)",
    file: "content/pg-internals/30-conclusion.md", icon: "🏁",
    desc: "Lời kết của tác giả: đừng tin tuyệt đối vào sách hay tài liệu chính thức, hãy tự thử nghiệm và đọc mã nguồn PostgreSQL.",
    tags: ["PostgreSQL", "Lời kết", "Đọc tiếp"],
  },
];
