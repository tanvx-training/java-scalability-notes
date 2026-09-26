// Lộ trình đọc PostgreSQL 14 Internals — Phần 2 (Tuần 7–12).
//
// Nguồn: bản dịch tiếng Việt "PostgreSQL 14 Internals" — Egor Rogov, Postgres Professional 2023.
// Thư mục nguồn: sources/pg-internals/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Link mục dạng [§N.M …](#/docs/pg-NN) — N luôn bằng số chương của doc.
// GIỮ NGUYÊN id (pg-w<N> / pg-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 6 tuần còn lại bám ranh giới Phần: T7 ch12–15 (Phần III — Lock) ·
// T8 ch16–17 (Phần IV — Thực thi truy vấn: giao thức, planner, statistics) ·
// T9 ch18–20 (truy cập bảng và index) · T10 ch21–23 (ba phương pháp join) ·
// T11 ch24–26 (Phần V — Hash, B-tree, GiST) · T12 ch27–29 + Lời kết + tổng ôn
// (SP-GiST, GIN, BRIN).

export const pgWeeksPart2 = [
  {
    id: "pg-w7",
    week: "Tuần 7",
    title: "Lock",
    goal: "Đọc đúng bảng pg_locks/pg_blocking_pids để biết ai đang chặn ai và ở mode nào, và giải thích được vì sao PostgreSQL tách lock thành bốn tầng (heavyweight, mức dòng, trên cấu trúc bộ nhớ, predicate) thay vì dùng một cơ chế duy nhất.",
    practice: "Phiên A BEGIN; SELECT … giữ transaction; phiên B ALTER TABLE … ADD COLUMN; phiên C một SELECT bình thường — quan sát C bị chặn qua pg_locks và pg_blocking_pids(); lặp lại với SET lock_timeout = '2s'.",
    resources: [
      { label: "PG 12 — Relation-Level Locks", href: "#/docs/pg-12" },
      { label: "PG 13 — Row-Level Locks", href: "#/docs/pg-13" },
      { label: "PG 14 — Miscellaneous Locks", href: "#/docs/pg-14" },
      { label: "PG 15 — Lock trên các cấu trúc bộ nhớ", href: "#/docs/pg-15" },
    ],
    items: [
      {
        id: "pg-w7-1",
        text: "Heavyweight lock, lock trên transaction ID và lock mức relation",
        lesson: `**Mục tiêu.** Giải thích được hai yếu tố quyết định hiệu quả của một cơ chế lock (granularity và tập mode), đọc đúng ma trận tương thích của tám mode khóa relation để biết lệnh nào chặn lệnh nào, và diễn giải trạng thái khóa transaction ID/virtualxid qua \`pg_locks\`.

**Đọc.** [§12.1 Về khóa (About Locks)](#/docs/pg-12) → [§12.2 Heavyweight Locks (Khóa hạng nặng)](#/docs/pg-12) → [§12.3 Khóa trên Transaction ID (Locks on Transaction IDs)](#/docs/pg-12) → [§12.4 Khóa ở mức relation (Relation-Level Locks)](#/docs/pg-12) → [§12.5 Wait Queue (Hàng đợi chờ)](#/docs/pg-12). Đọc kỹ bảng ma trận tương thích tám mode ở §12.4 và ba ví dụ lệnh \`CREATE INDEX\`/\`CREATE INDEX CONCURRENTLY\`/\`ALTER TABLE\`; gõ lại thí nghiệm bốn phiên (UPDATE, CREATE INDEX, VACUUM FULL, SELECT) xếp hàng ở §12.5 và dùng \`pg_blocking_pids\` để xem chuỗi chờ.

**Bẫy.** Nghĩ số lượng heavyweight lock của một transaction bị giới hạn cứng bởi \`max_locks_per_transaction\`. Sách nói rõ mọi transaction dùng chung một pool khóa, nên một transaction cụ thể có thể lấy nhiều hơn \`max_locks_per_transaction\` khóa — điều thực sự quan trọng là tổng số khóa toàn hệ thống không vượt ngưỡng (bằng \`max_locks_per_transaction\` nhân \`max_connections\`). Bẫy thứ hai: nghĩ \`CREATE INDEX CONCURRENTLY\` nhanh hơn \`CREATE INDEX\` vì "concurrently" nghe có vẻ song song hơn. Sách chỉ ra ngược lại: nó dùng mode \`Share Update Exclusive\` yếu hơn để cho phép cập nhật đồng thời, nên mất nhiều thời gian hơn (và thậm chí có thể thất bại).

**Tự kiểm tra.** Vì sao một \`SELECT\` đơn giản có thể chạy song song với hầu hết thao tác nhưng vẫn bị chặn bởi \`DROP TABLE\`? Trong thí nghiệm bốn phiên của sách, vì sao \`SELECT\` ở phiên thứ tư phải xếp hàng sau \`VACUUM FULL\` dù mode \`Access Share\` của nó tương thích với \`Row Exclusive\` đang được giữ bởi phiên thứ nhất?`,
      },
      {
        id: "pg-w7-2",
        text: "Lock mức dòng: mode, multitransaction, hàng đợi, NOWAIT, deadlock",
        lesson: `**Mục tiêu.** Giải thích được vì sao PostgreSQL biểu diễn lock mức dòng bằng chính trường \`xmax\`/hint bit của tuple thay vì một cấu trúc riêng trong RAM, phân biệt bốn mode lock dòng qua ma trận tương thích, và đọc đúng chuỗi bốn bước một transaction phải làm để lock một dòng.

**Đọc.** [§13.1 Thiết kế lock (Lock Design)](#/docs/pg-13) → [§13.2 Các mode lock mức dòng (Row-Level Locking Modes)](#/docs/pg-13) → [§13.3 Multitransaction](#/docs/pg-13) → [§13.4 Hàng đợi chờ (Wait Queue)](#/docs/pg-13) → [§13.5 Lock không chờ (No-Wait Locks)](#/docs/pg-13) → [§13.6 Deadlock](#/docs/pg-13). Đọc kỹ bốn bước lock một dòng ở §13.4 và vai trò riêng của tuple lock (ngăn resource starvation); gõ lại cả hai kịch bản deadlock của §13.6 — một do hai UPDATE khóa hai tài khoản theo thứ tự ngược nhau, một do chính một UPDATE hàng loạt khóa các dòng theo hai thứ tự khác nhau (seq scan so với index scan trên index giảm dần).

**Bẫy.** Nghĩ PostgreSQL cần một heavyweight lock riêng cho mỗi dòng đang bị sửa đổi. Sách chỉ ra ngược lại: lock mức dòng chỉ là thuộc tính trong header tuple (qua \`xmax\` và hint bit), không tốn thêm bộ nhớ nào dù lock bao nhiêu dòng; heavyweight lock chỉ cần cho tiến trình đang chờ, nên số lượng của chúng tỷ lệ với số tiến trình đồng thời chứ không phải số dòng. Bẫy thứ hai: nghĩ deadlock chỉ xảy ra khi ứng dụng cố tình khóa nhiều tài nguyên theo thứ tự khác nhau. Sách chứng minh bằng thí nghiệm thứ hai rằng ngay cả một UPDATE hàng loạt duy nhất cũng có thể tự gây deadlock với chính một UPDATE khác, nếu hai lệnh quét bảng theo hai thứ tự khác nhau.

**Tự kiểm tra.** Vì sao lock mức dòng ở PostgreSQL cần thêm một heavyweight "tuple lock" riêng thay vì chỉ đơn giản để mọi tiến trình đang chờ cùng chờ transaction giữ \`xmax\`? Multixact ID khác gì so với transaction ID thông thường về cách chúng được freeze — cụ thể trường nào của tuple bị freeze trong mỗi trường hợp?`,
      },
      {
        id: "pg-w7-3",
        text: "Lock khác: mở rộng relation, trang, advisory, predicate",
        lesson: `**Mục tiêu.** Giải thích được vì sao lock mở rộng relation và lock trang GIN không bao giờ gây deadlock, dùng đúng hàm \`pg_advisory_*\` cho một tài nguyên tự định nghĩa, và phân biệt được ý nghĩa "predicate lock" trong PostgreSQL với khái niệm lock theo vị từ nguyên gốc.

**Đọc.** [§14.1 Lock không phải trên đối tượng quan hệ (Non-Object Locks)](#/docs/pg-14) → [§14.2 Lock mở rộng relation (Relation Extension Locks)](#/docs/pg-14) → [§14.3 Lock trang (Page Locks)](#/docs/pg-14) → [§14.4 Advisory Locks](#/docs/pg-14) → [§14.5 Predicate Locks](#/docs/pg-14). Đọc kỹ đoạn giải thích hai loại phụ thuộc RW/WR ở §14.5 và vì sao chỉ phụ thuộc RW cần predicate lock; gõ lại thí nghiệm so sánh predicate lock của seq scan (lock cả bảng) với index scan (lock từng tuple/leaf page) trên bảng \`pred\`.

**Bẫy.** Nghĩ predicate lock thực sự khóa dữ liệu như tên gọi của nó. Sách nhấn mạnh nhiều lần điều ngược lại: ở PostgreSQL, "predicate lock" chỉ dùng để theo dõi phụ thuộc RW giữa các transaction Serializable, không ngăn cản bất kỳ ai đọc hay ghi; một transaction chỉ bị abort khi nó chuẩn bị commit và PostgreSQL nghi ngờ có anomaly. Bẫy thứ hai: nghĩ lock mở rộng relation và lock trang GIN có thể gây deadlock như heavyweight lock khác. Sách nói rõ hai loại này được giải phóng ngay khi thao tác hoàn tất (không chờ transaction kết thúc) nên không được đưa vào wait-for graph.

**Tự kiểm tra.** Vì sao chạy Serializable cho một số transaction nhưng không phải tất cả sẽ khiến mức cô lập này bị "hạ" xuống Repeatable Read trong thực tế? Việc leo thang predicate lock từ tuple lên page rồi lên relation đánh đổi điều gì để lấy điều gì?`,
      },
      {
        id: "pg-w7-4",
        text: "Spinlock, lightweight lock và giám sát chờ",
        lesson: `**Mục tiêu.** Phân biệt được spinlock và lightweight lock theo ba tiêu chí (thời gian giữ, mode hỗ trợ, có hàng đợi/instrumentation hay không), và đọc được \`wait_event_type\`/\`wait_event\` của \`pg_stat_activity\` để biết một tiến trình đang chờ loại tài nguyên nào.

**Đọc.** [§15.1 Spinlock (Spinlocks)](#/docs/pg-15) → [§15.2 Lightweight lock (Lightweight Locks)](#/docs/pg-15) → [§15.3 Ví dụ (Examples)](#/docs/pg-15) → [§15.4 Giám sát các lần chờ (Monitoring Waits)](#/docs/pg-15) → [§15.5 Lấy mẫu (Sampling)](#/docs/pg-15). Đọc kỹ ví dụ buffer cache/WAL buffer ở §15.3 (tranche 128 lock cho bảng băm buffer, một lightweight lock \`WALBufMapping\` duy nhất cho WAL); nếu cài được, gõ lại thí nghiệm \`pg_wait_sampling\` ở §15.5 so hai hồ sơ chờ (đĩa nhanh/chậm).

**Bẫy.** Nghĩ mọi lần chờ của một tiến trình đều hiện ra trong \`pg_stat_activity\`. Sách cảnh báo view này chỉ hiển thị những lần chờ được xử lý tường minh trong mã nguồn; một khoảng thời gian không có tên chờ nào không có nghĩa tiến trình không chờ gì, mà chỉ là "không được tính đến". Bẫy thứ hai: nghĩ tăng tần suất lấy mẫu của \`pg_wait_sampling\` luôn cho bức tranh chính xác hơn mà không mất gì. Sách chỉ ra đánh đổi: mẫu càng dày thì bắt được lần chờ ngắn càng tốt, nhưng chi phí phụ trội cũng tăng theo.

**Tự kiểm tra.** Vì sao spinlock được coi là an toàn để dùng ngay cả khi PostgreSQL không cung cấp cơ chế phát hiện deadlock cho nó? Ví dụ \`WALSync\` trong sách cho thấy điều gì về các phiên bản PostgreSQL trước 12 khi phân tích hồ sơ chờ?`,
      },
    ],
  },
  {
    id: "pg-w8",
    week: "Tuần 8",
    title: "Từ câu lệnh tới plan",
    goal: "Kể đúng bốn giai đoạn của giao thức truy vấn đơn giản, dự đoán được khi nào PostgreSQL chuyển từ custom plan sang generic plan, và tính lại được một ước lượng cardinality của planner từ dữ liệu thô trong pg_stats.",
    practice: "PREPARE một truy vấn, chạy 6 lần và xem EXPLAIN EXECUTE chuyển sang generic plan; xem pg_stats của một cột lệch phân phối, tạo CREATE STATISTICS cho hai cột tương quan và so ước lượng trước/sau.",
    resources: [
      { label: "PG 16 — Các giai đoạn thực thi truy vấn", href: "#/docs/pg-16" },
      { label: "PG 17 — Statistics", href: "#/docs/pg-17" },
      { label: "postgresql.org — Planner Statistics", href: "https://www.postgresql.org/docs/14/planner-stats.html" },
    ],
    items: [
      {
        id: "pg-w8-1",
        text: "Database demo và simple query protocol",
        lesson: `**Mục tiêu.** Kể đúng bốn giai đoạn của giao thức truy vấn đơn giản (parse, transform, plan, execute), đọc được vì sao planner loại bỏ một bảng khỏi cây plan trong ví dụ \`pg_tables\`, và giải thích ý nghĩa của startup cost/total cost trong output \`EXPLAIN\`.

**Đọc.** [§16.1 Cơ sở dữ liệu demo (Demo Database)](#/docs/pg-16) cho cấu trúc cơ sở dữ liệu vé máy bay dùng xuyên suốt Phần IV của sách (\`bookings\` → \`tickets\` → \`ticket_flights\` → \`flights\` → \`airports\`, cùng \`boarding_passes\` và \`seats\`/\`aircrafts\`) — cài đặt bản demo lớn này trước khi đọc tiếp. [§16.2 Giao thức truy vấn đơn giản (Simple Query Protocol)](#/docs/pg-16) — đọc tuần tự Parsing (lexer/parser dựng parse tree), Transformation (viết lại view, rule system), Planning (cost-based optimizer, cách planner ước tính cardinality và selectivity, \`join_collapse_limit\`/\`from_collapse_limit\`, \`geqo\`) và Execution (executor kéo dòng qua cây plan theo mô hình dây chuyền, \`work_mem\` cho mỗi nút cần giữ dữ liệu). Gõ lại ví dụ \`EXPLAIN\` trên \`pg_tables\` và đối chiếu parse tree/plan tree trong hình minh họa.

**Bẫy.** Nghĩ startup cost là chi phí để lấy ra dòng đầu tiên của kết quả. Sách nói thẳng điều này "không hoàn toàn chính xác" — startup cost là cái giá phải trả để *chuẩn bị* cho việc thực thi nút (ví dụ một nút \`Sort\` phải chờ nhận hết dữ liệu từ nút con trước khi bắt đầu), không nhất thiết trùng với thời điểm dòng đầu tiên xuất hiện. Bẫy thứ hai: nghĩ một plan có cost thấp hơn luôn thực thi nhanh hơn plan có cost cao hơn của một truy vấn khác. Sách nhấn mạnh cost chỉ dùng để so sánh các plan của *cùng một* truy vấn trong *cùng* điều kiện; so cost giữa các truy vấn khác nhau là vô nghĩa.

**Tự kiểm tra.** Vì sao planner có thể loại hẳn một bảng ra khỏi cây plan dù truy vấn có JOIN nó trong mệnh đề FROM? Nếu client mở một cursor thay vì lấy toàn bộ kết quả, planner tối ưu hóa cho việc lấy ra bao nhiêu phần trăm số dòng, theo tham số nào?`,
      },
      {
        id: "pg-w8-2",
        text: "Extended query protocol: prepared statement, generic và custom plan",
        lesson: `**Mục tiêu.** Giải thích được vì sao PostgreSQL không có cache truy vấn toàn cục, và dự đoán đúng ở lần thực thi thứ mấy một prepared statement có tham số sẽ chuyển từ custom plan sang generic plan.

**Đọc.** [§16.3 Giao thức truy vấn mở rộng (Extended Query Protocol)](#/docs/pg-16) — đọc tuần tự Preparation (parse tree được giữ lại trong bộ nhớ backend, không có cache toàn cục), Parameter Binding (vì sao prepared statement miễn nhiễm SQL injection), Planning and Execution (năm lần thực thi đầu luôn dùng custom plan; từ lần thứ sáu, nếu generic plan rẻ hơn trung bình các custom plan thì planner giữ generic plan; tham số \`plan_cache_mode\` để ép buộc) và Getting the Results (lấy kết quả theo lô, \`cursor_tuple_fraction\`). Gõ lại đúng chuỗi \`PREPARE\`/\`EXECUTE\` của sách trên bảng \`aircrafts\` và xem \`EXPLAIN EXECUTE\` đổi từ hằng số cụ thể ('319') sang tham số vị trí ($1).

**Bẫy.** Nghĩ PostgreSQL cache plan cho mọi truy vấn giống hệt nhau từ các client khác nhau, giống một số hệ khác. Sách nói rõ PostgreSQL không có cache toàn cục — mỗi backend tự parse truy vấn của riêng nó; đây là đánh đổi có chủ ý để tránh cache trở thành nút thắt cổ chai vì lock. Bẫy thứ hai: nghĩ generic plan luôn tệ hơn custom plan vì nó "không biết" giá trị tham số thực tế. Sách chỉ ra planner chỉ chuyển sang generic plan nếu cost trung bình của nó (đã tính cả việc custom plan phải xây lại mỗi lần) rẻ hơn — với truy vấn không tham số hoặc phân phối dữ liệu đều, generic plan có thể tốt ngang custom plan mà rẻ hơn về chi phí lập kế hoạch.

**Tự kiểm tra.** Tham số \`plan_cache_mode\` có những giá trị nào để ép buộc quyết định của planner khi nó chọn sai? Vì sao gắn tham số qua prepared statement (Parameter Binding) loại bỏ hoàn toàn nguy cơ SQL injection so với nối chuỗi trực tiếp?`,
      },
      {
        id: "pg-w8-3",
        text: "Thống kê cơ bản, NULL, distinct, most common values",
        lesson: `**Mục tiêu.** Tính lại được ước lượng cardinality của planner từ chính các cột \`reltuples\`/\`null_frac\`/\`n_distinct\`/\`most_common_vals\` trong \`pg_class\` và \`pg_stats\`, và giải thích được vì sao \`reltuples = -1\` khác với một bảng thực sự rỗng.

**Đọc.** [§17.1 Thống kê cơ bản (Basic Statistics)](#/docs/pg-17) — đọc kỹ công thức lấy mẫu 300 × \`default_statistics_target\` dòng và cách planner co giãn \`reltuples\` khi \`relpages\` lệch so với kích thước file thực tế. [§17.2 Giá trị NULL (NULL Values)](#/docs/pg-17) cho \`null_frac\`. [§17.3 Giá trị phân biệt (Distinct Values)](#/docs/pg-17) — đọc kỹ quy ước dấu của \`n_distinct\` (âm là tỷ lệ, dương là số lượng tuyệt đối) và ngưỡng 10% quyết định bộ phân tích dùng loại nào. [§17.4 Giá trị phổ biến nhất (Most Common Values)](#/docs/pg-17) cho \`most_common_vals\`/\`most_common_freqs\` và cách chúng cũng được dùng cho điều kiện bất đẳng thức. Gõ lại thí nghiệm tạo \`flights_copy\` với autovacuum tắt, \`ANALYZE\`, rồi tự tính lại số dòng ước lượng bằng đúng công thức \`reltuples × null_frac\` hoặc \`reltuples / n_distinct\` và so với \`EXPLAIN\`.

**Bẫy.** Nghĩ \`n_distinct\` luôn là một số đếm giá trị phân biệt. Sách chỉ ra nó có thể mang dấu âm, khi đó giá trị tuyệt đối là *tỷ lệ* chứ không phải số lượng — bộ phân tích tự chọn dạng nào dựa trên ngưỡng 10% tổng số dòng. Bẫy thứ hai: nghĩ \`pg_class.reltuples\` luôn phản ánh đúng số dòng hiện tại của bảng. Thí nghiệm trong §17.1 cho thấy dù \`reltuples\` lỗi thời (chưa \`ANALYZE\` lại sau khi số dòng tăng gấp đôi), ước lượng của planner vẫn có thể chính xác nhờ nó tự co giãn \`reltuples\` theo tỷ lệ giữa kích thước file thực tế và \`relpages\`.

**Tự kiểm tra.** Giá trị \`n_distinct = -3\` và \`n_distinct = 3\` khác nhau thế nào về ý nghĩa? Vì sao \`pg_class.reltuples\` của một bảng vừa \`CREATE TABLE ... LIKE\` và chưa \`ANALYZE\` lại là -1 thay vì 0?`,
      },
      {
        id: "pg-w8-4",
        text: "Histogram, correlation, thống kê biểu thức và đa biến",
        lesson: `**Mục tiêu.** Tính lại được ước lượng selectivity của một điều kiện bất đẳng thức bằng \`histogram_bounds\` kết hợp \`most_common_vals\`, và chọn đúng loại extended statistics (dependencies/ndistinct/mcv/expression) cho một cặp cột tương quan cụ thể.

**Đọc.** [§17.5 Histogram](#/docs/pg-17) — đọc kỹ cách mỗi bucket nhận xấp xỉ cùng số lượng giá trị (không tính các giá trị đã nằm trong MCV) và công thức selectivity = N/(số bucket); gõ lại đúng ví dụ \`seat_no > '30B'\` cộng cả phần MCV lẫn phần histogram. [§17.6 Statistics cho kiểu dữ liệu không vô hướng (Statistics for Non-Scalar Data Types)](#/docs/pg-17) đọc lướt. [§17.7 Độ rộng trung bình của trường (Average Field Width)](#/docs/pg-17) và [§17.8 Correlation (Tương quan)](#/docs/pg-17) cho ý nghĩa của \`avg_width\` và \`correlation\` (gần 1/-1 là dữ liệu được sắp theo thứ tự vật lý, gần 0 là hỗn loạn). [§17.9 Statistics cho biểu thức (Expression Statistics)](#/docs/pg-17) — đọc kỹ vì sao "function-call = constant" mặc định bị ước lượng selectivity cố định 0.5%, và hai cách sửa (\`CREATE STATISTICS\` cho biểu thức, hoặc tạo expression index). [§17.10 Statistics đa biến (Multivariate Statistics)](#/docs/pg-17) — đọc cả ba loại (functional dependencies, ndistinct, MCV đa biến) qua ba ví dụ \`flight_no\`/\`departure_airport\`, cặp sân bay, và \`departure_airport\`/\`aircraft_code\`. Gõ lại ví dụ \`CREATE STATISTICS ... (dependencies)\` cho \`flight_no, departure_airport\` và so plan trước/sau \`ANALYZE\`.

**Bẫy.** Nghĩ tăng \`default_statistics_target\` luôn cải thiện chất lượng plan mà không mất gì. Sách kết luận rõ ràng ở cuối §17.5: tăng tham số này có thể làm chậm việc lập plan và phân tích mà không mang lại lợi ích, còn giảm xuống 0 tuy tăng tốc phân tích nhưng dễ chọn nhầm plan tồi — "sự tiết kiệm như vậy thường không đáng". Bẫy thứ hai: nghĩ vấn đề vị từ tương quan (\`flight_no\` và \`departure_airport\` ước lượng thấp khi kết hợp AND) chỉ có thể sửa bằng cách viết lại truy vấn. Sách chỉ ra planner giả định các vị từ độc lập theo mặc định (nhân các selectivity), và cách sửa đúng là khai báo functional dependency bằng \`CREATE STATISTICS\`, không phải đổi câu SQL.

**Tự kiểm tra.** Vì sao selectivity của "function-call = constant" được ước lượng cố định 0.5% thay vì dùng \`most_common_vals\` của cột bên trong hàm? Ba loại multivariate statistics ở §17.10 (dependencies, ndistinct, mcv) mỗi loại sửa đúng loại sai lệch ước lượng nào — phụ thuộc hàm, GROUP BY nhiều cột, hay AND của hai điều kiện tương quan không hoàn toàn?`,
      },
    ],
  },
  {
    id: "pg-w9",
    week: "Tuần 9",
    title: "Truy cập bảng và index",
    goal: "Tính lại được cost của Seq Scan/Parallel Seq Scan bằng đúng công thức của planner, chọn đúng operator class cho một điều kiện LIKE, và giải thích được vì sao correlation cùng work_mem quyết định index scan hay bitmap scan rẻ hơn.",
    practice: "Trên bảng 1 triệu dòng, ép từng phương thức (SET enable_seqscan/enable_indexscan/enable_bitmapscan = off) và so chi phí ước lượng với thời gian thật; VACUUM rồi xem Heap Fetches của index-only scan về 0.",
    resources: [
      { label: "PG 18 — Table Access Methods", href: "#/docs/pg-18" },
      { label: "PG 19 — Index Access Methods", href: "#/docs/pg-19" },
      { label: "PG 20 — Index Scans", href: "#/docs/pg-20" },
    ],
    items: [
      {
        id: "pg-w9-1",
        text: "Sequential scan, chi phí và thực thi song song",
        lesson: `**Mục tiêu.** Giải thích được vì sao PostgreSQL không phân định rạch ròi giữa table access method \`heap\` và lõi, tính lại được cost của một \`Seq Scan\`/\`Aggregate\` từ đúng bốn tham số cost cơ bản, và đọc được vì sao một \`Parallel Seq Scan\` chia việc không đều giữa leader và các worker.

**Đọc.** [§18.1 Storage engine dạng cắm được (Pluggable Storage Engines)](#/docs/pg-18) cho danh sách việc mà một table access method phải tự định nghĩa (định dạng tuple, cách quét, insert/update/lock, quy tắc visibility, vacuum/analyze) và hai engine đang phát triển (Zheap, Zedstore). [§18.2 Sequential scan (Sequential Scans)](#/docs/pg-18) — đọc kỹ công thức I/O cost (\`seq_page_cost\` × \`relpages\`) cộng CPU cost (\`cpu_tuple_cost\` × \`reltuples\`), và ví dụ \`Aggregate\` cộng thêm \`cpu_operator_cost\`. [§18.3 Parallel plan (Parallel Plans)](#/docs/pg-18) cho vai trò node \`Gather\` và tham số \`parallel_leader_participation\`. [§18.4 Parallel sequential scan (Parallel Sequential Scans)](#/docs/pg-18) — đọc kỹ vì sao hệ điều hành không còn thấy bức tranh tuần tự khi nhiều tiến trình cùng đọc, và hệ số chia việc không đều cho leader. [§18.5 Các giới hạn của thực thi song song (Parallel Execution Limitations)](#/docs/pg-18) cho ba tham số \`max_worker_processes\`/\`max_parallel_workers\`/\`max_parallel_workers_per_gather\`, công thức 1 + ⌊log₃(kích thước bảng / \`min_parallel_table_scan_size\`)⌋, và các loại truy vấn không thể song song hóa. Gõ lại đúng phép tính cost cho \`EXPLAIN SELECT count(*) FROM seats\` và so với plan thật.

**Bẫy.** Nghĩ "quét song song" (\`Parallel Seq Scan\`) đọc file theo kiểu ngẫu nhiên khác hẳn seq scan thường. Sách nói ngược lại: xét việc truy cập file, các page vẫn được đọc tuần tự đúng thứ tự — chỉ là nhiều tiến trình cùng làm việc đó, khiến hệ điều hành nhìn thấy nhiều luồng đọc "ngẫu nhiên" thay vì một luồng tuần tự, nên PostgreSQL phải tự bù bằng cách giao mỗi tiến trình vài page liên tiếp một lúc. Bẫy thứ hai: nghĩ leader luôn xử lý cùng số dòng như mỗi worker. Sách chỉ ra hệ số chia việc giảm phần của leader khi số worker tăng (ví dụ hệ số 2.4 cho hai worker), vì leader còn phải làm việc gom dữ liệu ở node \`Gather\`.

**Tự kiểm tra.** Với bảng 216MB và \`min_parallel_table_scan_size\` mặc định, công thức 1 + ⌊log₃(kích thước/8MB)⌋ cho ra mấy parallel worker? Kể tên ba loại truy vấn hoàn toàn không thể dùng parallel plan theo §18.5.`,
      },
      {
        id: "pg-w9-2",
        text: "Index access method và operator class",
        lesson: `**Mục tiêu.** Kể đúng sáu index access method dựng sẵn của PostgreSQL 14, giải thích vì sao chọn sai operator class khiến \`LIKE\` không dùng được index B-tree thông thường, và tra đúng thuộc tính (CAN ORDER, CAN UNIQUE, RETURNABLE…) để biết một index có hỗ trợ một tính năng cụ thể hay không.

**Đọc.** [§19.1 Index và khả năng mở rộng (Indexes and Extensibility)](#/docs/pg-19) cho vai trò indexing engine (đọc/kiểm visibility/kiểm tra lại điều kiện) và operator class là gì. [§19.2 Operator class và operator family (Operator Classes and Families)](#/docs/pg-19) — đọc kỹ ví dụ \`text_ops\` so với \`text_pattern_ops\` (năm strategy number bắt buộc của B-tree, vì sao LIKE cần operator class riêng khi collation khác C) và khái niệm operator family gom nhiều operator class của các kiểu liên quan. [§19.3 Giao diện của indexing engine (Indexing Engine Interface)](#/docs/pg-19) — đọc tuần tự ba nhóm thuộc tính: mức access method (CAN ORDER, CAN UNIQUE, CAN MULTI COL, CAN EXCLUDE, CAN INCLUDE), mức index (CLUSTERABLE, INDEX SCAN, BITMAP SCAN, BACKWARD SCAN), mức cột (ASC/DESC/NULLS FIRST/NULLS LAST, ORDERABLE, DISTANCE ORDERABLE, RETURNABLE, SEARCH ARRAY, SEARCH NULLS). Gõ lại đúng ví dụ tạo index \`text_pattern_ops\` trên \`passenger_name\` và so \`Index Cond\` trước/sau.

**Bẫy.** Nghĩ tạo index B-tree bình thường trên một cột text luôn tăng tốc được \`LIKE 'X%'\`. Sách chứng minh ngược lại: trong một database dùng collation khác C, B-tree với operator class mặc định \`text_ops\` không có toán tử so khớp mẫu, nên planner vẫn seq scan; phải tạo index với \`text_pattern_ops\` (không tính collation) thì \`Index Cond\` mới viết lại được thành khoảng >=/< trên tiền tố. Bẫy thứ hai: nghĩ CAN ORDER/CAN UNIQUE là thuộc tính chung của mọi index access method. Sách nói rõ cả hai hiện chỉ được B-tree hỗ trợ.

**Tự kiểm tra.** Muốn một unique index mở rộng bằng cột không phải khóa (covering) mà không phá tính duy nhất, dùng thuộc tính/mệnh đề nào? Vì sao \`SELECT * FROM t WHERE initcap(col) = 'X'\` không dùng được một index B-tree thường trên \`col\`, và cách sửa đúng theo sách là gì?`,
      },
      {
        id: "pg-w9-3",
        text: "Index scan và index-only scan",
        lesson: `**Mục tiêu.** Giải thích được vì sao correlation thấp làm index scan đắt gần bằng đọc ngẫu nhiên từng dòng, và giải thích được vì sao "index-only" scan đôi khi vẫn phải truy cập heap (\`Heap Fetches\` > 0).

**Đọc.** [§20.1 Index scan thông thường (Regular Index Scans)](#/docs/pg-20) — đọc kỹ hai kịch bản correlation cao/thấp, vai trò \`effective_cache_size\` trong việc nội suy giữa chi phí đọc tuần tự và ngẫu nhiên, và phân biệt \`Index Cond\` với \`Filter\` trong output \`EXPLAIN\`. [§20.2 Index-Only Scans](#/docs/pg-20) — đọc kỹ vì sao index không lưu thông tin visibility nên phải dựa vào visibility map, và ví dụ \`Heap Fetches\` giảm về 0 sau \`VACUUM\`. Gõ lại đúng thí nghiệm tạo \`bookings_tmp\`, \`EXPLAIN ANALYZE\` trước và sau \`VACUUM\` để tự thấy \`Heap Fetches\` đổi từ khác 0 về 0.

**Bẫy.** Nghĩ "Index Only Scan" trong tên node nghĩa là node này không bao giờ đụng tới heap. Sách nói ngược lại: nó vẫn phải đọc heap cho những tuple nằm trong page chưa được đánh dấu all-visible trong visibility map — cái tên chỉ mô tả khả năng, không phải cam kết. Bẫy thứ hai: nghĩ correlation cao luôn được đảm bảo cho một cột chỉ vì nó được đánh index. Sách nhấn mạnh correlation cao ở ví dụ \`book_ref\` là do dữ liệu được nạp theo thứ tự tăng dần và chưa từng UPDATE; bất kỳ UPDATE nào sau đó cũng đẩy tuple xuống cuối bảng và làm correlation xấu đi.

**Tự kiểm tra.** Vì sao planner không đơn giản đổi \`seq_page_cost\` thành \`random_page_cost\` khi correlation bằng 0, mà phải tính đến \`effective_cache_size\`? Sau khi VACUUM một bảng, điều gì có thể khiến \`Heap Fetches\` của một index-only scan tăng trở lại từ 0?`,
      },
      {
        id: "pg-w9-4",
        text: "Bitmap scan, parallel index scan và so sánh phương thức truy cập",
        lesson: `**Mục tiêu.** Giải thích được vì sao một segment bitmap trở thành "lossy" khi \`work_mem\` không đủ, và tóm tắt được bằng lời bốn phương thức truy cập bảng nên dùng trong tình huống nào theo hình so sánh cuối chương.

**Đọc.** [§20.3 Bitmap Scans](#/docs/pg-20) — đọc kỹ cách \`Bitmap Index Scan\` dựng bitmap rồi \`Bitmap Heap Scan\` đọc heap page theo thứ tự tăng dần, ý nghĩa exact so với lossy (giới hạn bởi \`work_mem\`), \`BitmapAnd\`/\`BitmapOr\` khi kết hợp nhiều index, và \`effective_io_concurrency\` cho prefetch bất đồng bộ. [§20.4 Parallel Index Scans (Index scan song song)](#/docs/pg-20) — đọc kỹ vì sao node \`Bitmap Index Scan\` không bao giờ có chữ Parallel trong tên (bitmap luôn được leader dựng tuần tự) trong khi \`Bitmap Heap Scan\` phía sau nó thì có. [§20.5 So sánh các phương thức truy cập (Comparison of Various Access Methods)](#/docs/pg-20) cho bốn kết luận định tính về sequential/index/index-only/bitmap scan theo selectivity. Gõ lại thí nghiệm hạ \`work_mem\` xuống 512kB và xem \`Heap Blocks: exact=.../lossy=...\` đổi từ toàn exact.

**Bẫy.** Nghĩ giảm \`work_mem\` chỉ ảnh hưởng tới sort hay hash, không liên quan bitmap scan. Sách chứng minh ngược lại bằng thí nghiệm: \`work_mem\` quá nhỏ buộc một số segment bitmap trở thành lossy (một bit đại diện cả dải page thay vì một page), kéo theo \`Rows Removed by Index Recheck\` tăng vọt. Bẫy thứ hai: nghĩ bitmap scan luôn chậm hơn index scan vì phải qua hai bước (\`Bitmap Index Scan\` rồi \`Bitmap Heap Scan\`). Sách kết luận ngược lại ở §20.5: khi correlation thấp, bitmap scan thường rẻ hơn nhiều so với index scan thông thường vì nó đọc mỗi heap page đúng một lần theo thứ tự tăng dần thay vì nhảy qua lại.

**Tự kiểm tra.** Vì sao node \`Bitmap Index Scan\` không bao giờ mang tiền tố "Parallel" dù đứng trong một parallel plan? Theo hình so sánh của §20.5, index-only scan có thể "suy biến" thành gì trong trường hợp xấu nhất, và điều gì gây ra sự suy biến đó?`,
      },
    ],
  },
  {
    id: "pg-w10",
    week: "Tuần 10",
    title: "Ba phương pháp join",
    goal: "Chọn đúng phương thức join (nested loop/hash/merge) cho một tình huống OLTP hay OLAP cụ thể, và đọc được EXPLAIN ANALYZE để biết một Hash Join hay Sort đã tràn ra file tạm hay chưa.",
    practice: "Cùng một join, ép lần lượt nested loop / hash / merge; hạ work_mem để thấy hash join chia batch và sort chuyển sang external merge Disk.",
    resources: [
      { label: "PG 21 — Nested Loop", href: "#/docs/pg-21" },
      { label: "PG 22 — Hashing", href: "#/docs/pg-22" },
      { label: "PG 23 — Sorting and Merging", href: "#/docs/pg-23" },
    ],
    items: [
      {
        id: "pg-w10-1",
        text: "Kiểu join và nested loop",
        lesson: `**Mục tiêu.** Phân biệt được các kiểu join logic (inner/outer, semi/anti) với ba phương thức join vật lý mà PostgreSQL cung cấp, và tính lại được cardinality/cost của một \`Nested Loop\` tham số hóa bằng foreign key.

**Đọc.** [§21.1 Các kiểu join và phương thức join (Join Types and Methods)](#/docs/pg-21) — đọc kỹ phân biệt kiểu join (inner/outer/semi/anti, tất cả đều là thao tác logic) với ba phương thức join vật lý (nested loop, hash join, merge join) mà PostgreSQL hiện thực. [§21.2 Nested Loop Join (Nested Loop Joins)](#/docs/pg-21) — đọc tuần tự Tích Descartes (node \`Materialize\`), Join có tham số (công thức selectivity dựa trên foreign key hoặc \`n_distinct\`), Cache các dòng — Memoize *(v. 14)* (khóa băm và \`enable_memoize\`), Outer Joins (vì sao Right/Full join không được nested loop hỗ trợ), Anti-join và semi-join, Non-equi-join, và Chế độ song song. Gõ lại đúng ví dụ JOIN \`tickets\`/\`ticket_flights\` theo \`book_ref\` và so cardinality ước lượng với \`EXPLAIN ANALYZE\`.

**Bẫy.** Nghĩ Right Join và Full Join chỉ đơn giản chưa được PostgreSQL cài đặt cho nested loop vì thiếu thời gian phát triển. Sách chỉ ra lý do cấu trúc: thuật toán nested loop đối xử khác nhau với tập trong và tập ngoài — tập ngoài luôn được quét toàn bộ còn tập trong có thể chỉ đọc một phần qua index, nên không đảm bảo giữ lại được các dòng "không khớp" của tập trong mà right/full join cần. Bẫy thứ hai: nghĩ node \`Memoize\` hoạt động giống hệt \`Materialize\`, chỉ đổi tên. Sách phân biệt rõ: \`Materialize\` lưu mọi dòng và có thể tràn ra đĩa, còn \`Memoize\` tách riêng dòng theo từng giá trị tham số và luôn giữ trong bộ nhớ — không có ý nghĩa gì nếu phải ghi đĩa.

**Tự kiểm tra.** Vì sao ước lượng cardinality của một \`Nested Loop\` tham số hóa theo foreign key dùng công thức nghịch đảo kích thước bảng cha thay vì \`n_distinct\` thông thường? Semi-join và anti-join khác nhau ở điều kiện dừng vòng lặp trong như thế nào?`,
      },
      {
        id: "pg-w10-2",
        text: "Hash join và gom nhóm bằng hash",
        lesson: `**Mục tiêu.** Giải thích được vì sao hash join chuyển sang hai lượt khi \`work_mem\` không đủ, và đọc được các trường Buckets/Batches/Memory Usage trong \`EXPLAIN ANALYZE\` để biết join có tràn ra file tạm hay không.

**Đọc.** [§22.1 Hash join (Hash Joins)](#/docs/pg-22) — đọc tuần tự Hash join một lượt (giai đoạn xây bảng băm rồi dò tập ngoài, \`work_mem\` × \`hash_mem_multiplier\`), Hash join hai lượt (chia batch, \`temp_file_limit\`), Điều chỉnh động (tăng gấp đôi batch giữa chừng, skew optimization dùng MCV), song song một lượt và hai lượt (hash table dùng chung trong shared memory so với mỗi tiến trình một bảng riêng), và Các biến thể (right/full join đổi vai trò inner/outer theo cost). [§22.2 Giá trị phân biệt và gom nhóm (Distinct Values and Grouping)](#/docs/pg-22) cho node \`HashAggregate\` và cách nó phân vùng khi tràn bộ nhớ *(v. 13)*. Gõ lại đúng thí nghiệm hạ \`work_mem\` xuống 64kB cho JOIN \`flights\`/\`seats\` và so \`Batches\` trước/sau.

**Bẫy.** Nghĩ tăng \`work_mem\` luôn giúp hash join nhanh hơn tuyến tính. Sách chỉ ra hiệu ứng "bậc thang": chỉ khi \`work_mem\` đủ để hash table vừa trong một batch thì cost mới giảm hẳn; ở mọi mức dưới ngưỡng đó, số batch (và do đó số lần ghi/đọc file tạm) chỉ giảm dần theo lũy thừa của hai, không tuyến tính. Bẫy thứ hai: nghĩ số lượng batch có thể giảm lại nếu planner ước lượng quá cao. Sách nói rõ số batch chỉ có thể tăng (gấp đôi) trong lúc chạy để chống ước lượng thấp, không bao giờ giảm nếu ước lượng ban đầu quá cao.

**Tự kiểm tra.** Vì sao thuật toán hash join song song hai lượt *(v. 11)* phải ghi cả batch đầu tiên xuống đĩa, khác với phiên bản không song song? \`HashAggregate\` quyết định số partition dựa trên yếu tố gì, và vì sao con số ước lượng được nhân thêm 1.5?`,
      },
      {
        id: "pg-w10-3",
        text: "Merge join và sắp xếp",
        lesson: `**Mục tiêu.** Giải thích được vì sao merge join chỉ hỗ trợ equi-join dùng operator class B-tree, và chọn đúng thuật toán sắp xếp (quicksort/top-N heapsort/external merge/incremental sort) mà một \`Sort\` node sẽ dùng dựa trên \`work_mem\` và mệnh đề LIMIT/ORDER BY.

**Đọc.** [§23.1 Merge Joins](#/docs/pg-23) — đọc kỹ thuật toán trộn hai con trỏ, cách xử lý giá trị trùng lặp ở tập outer, và vì sao Full/Right merge join cần thêm node \`Sort\` để khôi phục thứ tự bị NULL chen vào. [§23.2 Sắp xếp (Sorting)](#/docs/pg-23) — đọc tuần tự Quicksort, Top-N Heapsort (ngưỡng LIMIT giảm ít nhất một nửa số dòng), Sắp xếp ngoài — External Sorting (ghi run ra file tạm rồi trộn, tối thiểu sáu tối đa 500 file mỗi lượt trộn), Sắp xếp tăng dần — Incremental Sorting *(v. 13)* (dùng \`Presorted Key\` có sẵn từ index scan), và Chế độ song song (\`Gather Merge\` dùng binary heap). Gõ lại đúng ví dụ \`ORDER BY scheduled_departure\` trên bảng \`flights\` và xem \`Sort Method\` đổi giữa quicksort/external merge khi đổi \`work_mem\`.

**Bẫy.** Nghĩ "Sort Method: external merge Disk" là dấu hiệu cấu hình sai cần tránh bằng mọi giá. Sách chỉ trình bày nó như một chiến lược hợp lệ khi dữ liệu không vừa \`work_mem\` — vấn đề thật sự cần theo dõi là số lượt trộn (mỗi lượt tăng gấp đôi I/O), không phải việc dùng đĩa. Bẫy thứ hai: nghĩ Incremental Sort luôn nhanh hơn Sort thông thường vì "tăng dần" nghe có vẻ tối ưu hơn. Sách chỉ ra nó chỉ có lợi khi dữ liệu đã có sẵn thứ tự sắp xếp một phần (\`Presorted Key\` từ index scan) — không có tiền đề đó thì nó không được planner chọn.

**Tự kiểm tra.** Full merge join có bảo toàn thứ tự sắp xếp của mệnh đề ORDER BY không, vì sao cần thêm một node \`Sort\` riêng sau nó? Top-N heapsort được planner chọn dựa trên điều kiện nào liên quan tới LIMIT?`,
      },
      {
        id: "pg-w10-4",
        text: "Gom nhóm bằng sort và so sánh các phương pháp join",
        lesson: `**Mục tiêu.** Đọc được plan \`MixedAggregate\` kết hợp cả sort lẫn hash cho GROUPING SETS, và chọn đúng phương thức join (nested loop/hash/merge) phù hợp cho một tình huống OLTP hay OLAP cụ thể dựa trên bảng so sánh cuối chương.

**Đọc.** [§23.3 Giá trị phân biệt và gom nhóm (Distinct Values and Grouping)](#/docs/pg-23) — đọc kỹ node \`Unique\` (trên dữ liệu đã sắp xếp), \`GroupAggregate\`, và ví dụ \`MixedAggregate\` xử lý GROUPING SETS bằng cả \`Group Key\` (sort) lẫn \`Hash Key\` trong cùng một node. [§23.4 So sánh các phương pháp join (Comparison of Join Methods)](#/docs/pg-23) — đọc kỹ ba đoạn tổng kết: nested loop tốt cho OLTP ngắn nhờ không cần quét hết tập trong, hash join tốt cho OLAP nhờ độ phức tạp tuyến tính nhưng không trả dòng sớm, merge join hiệu quả khi có sẵn thứ tự nhờ index. Gõ lại thí nghiệm GROUP BY GROUPING SETS trên \`flights\` với \`work_mem\` thấp và đọc đúng ba dòng \`Hash Key\`/\`Group Key\`/\`Sort Key\` trong plan.

**Bẫy.** Nghĩ ba phương thức join luôn có một "phương thức tốt nhất" áp dụng chung. Sách kết luận rõ ràng không có phương pháp nào luôn vượt trội — mỗi phương pháp có kịch bản sử dụng lý tưởng riêng (nested loop cho OLTP có index, hash cho OLAP không cần sắp xếp, merge khi thứ tự đã có sẵn hoặc kết quả cần được sắp xếp). Bẫy thứ hai: nghĩ \`MixedAggregate\` là một thuật toán thứ tư khác hẳn sort/hash. Sách chỉ ra nó chỉ đơn giản kết hợp cả hai chiến lược đã học (sort cho một số cột GROUPING SETS, hash cho cột khác) trong cùng một lượt quét, không phải một thuật toán mới.

**Tự kiểm tra.** Vì sao node \`Unique\` chỉ hoạt động đúng trên một tập dữ liệu đã sắp xếp, khác với \`HashAggregate\`? Theo bảng so sánh của §23.4, trong tình huống nào merge join gần như luôn thắng hash join dù phải trả thêm cost sắp xếp?`,
      },
    ],
  },
  {
    id: "pg-w11",
    week: "Tuần 11",
    title: "Hash, B-tree, GiST",
    goal: "So sánh được điều kiện phù hợp của Hash, B-tree và GiST bằng cách đọc đúng bảng thuộc tính can_order/can_unique/distance_orderable của mỗi access method, và tự lần được một đường tìm kiếm B-tree/GiST qua pageinspect.",
    practice: "So kích thước và tốc độ tra = giữa hash index và B-tree trên cùng cột; tạo GiST trên cột point, chạy truy vấn k-NN ORDER BY p <-> point(…).",
    resources: [
      { label: "PG 24 — Hash", href: "#/docs/pg-24" },
      { label: "PG 25 — B-tree", href: "#/docs/pg-25" },
      { label: "PG 26 — GiST", href: "#/docs/pg-26" },
    ],
    items: [
      {
        id: "pg-w11-1",
        text: "Hash index",
        lesson: `**Mục tiêu.** Giải thích được vì sao hash index không hỗ trợ index-only scan mặc dù lưu mã băm của khóa, và đọc được bốn loại page (metapage/bucket/overflow/bitmap) qua \`pageinspect\` để biết khi nào một bucket bị tách.

**Đọc.** [§24.1 Tổng quan (Overview)](#/docs/pg-24) cho cơ chế bucket, mở rộng động bằng tách bucket, và vì sao chỉ hỗ trợ điều kiện bằng. [§24.2 Bố cục trang (Page Layout)](#/docs/pg-24) — đọc kỹ bốn loại page, ý nghĩa \`ffactor\`/\`maxbucket\`/\`highmask\`/\`lowmask\` trong metapage, và gõ lại đúng thí nghiệm chèn 500 dòng cùng giá trị để gây tràn rồi 115 dòng khác để gây tách bucket. [§24.3 Operator Class](#/docs/pg-24) cho vai trò support function số 1 (hàm băm) và toán tử bằng duy nhất. [§24.4 Thuộc tính (Properties)](#/docs/pg-24) — đọc bảng thuộc tính \`can_order\`/\`can_unique\` đều false, và vì sao hash index không thể co lại kích thước (chỉ \`REINDEX\`/\`VACUUM FULL\` mới trả lại được không gian).

**Bẫy.** Nghĩ hash index luôn nhỏ hơn B-tree vì chỉ lưu mã băm chứ không lưu khóa. Sách chỉ ra một nhược điểm ngược lại: hash index không bao giờ co lại — một khi page chính đã được cấp cho một bucket, nó gắn vĩnh viễn với bucket đó dù rỗng, và chỉ \`REINDEX\` hay \`VACUUM FULL\` mới trả lại được không gian. Bẫy thứ hai: nghĩ tăng số bucket luôn giúp hash index nhanh hơn khi dữ liệu bị trùng lặp nhiều. Sách nói ngược lại: nếu một khóa lặp lại quá nhiều (skew), mọi giá trị rơi vào cùng một bucket, và tăng số bucket không giúp ích gì.

**Tự kiểm tra.** Vì sao hash index bắt buộc phải kiểm tra lại (recheck) mọi TID mà nó trả về? \`highmask\` và \`lowmask\` trong metapage phối hợp với nhau thế nào để xác định số hiệu bucket khi số bucket không phải là lũy thừa của hai tròn?`,
      },
      {
        id: "pg-w11-2",
        text: "B-tree: tìm kiếm, chèn, bố cục page, thuộc tính",
        lesson: `**Mục tiêu.** Tự lần theo được ba mức của một B-tree bằng \`pageinspect\` từ metapage tới leaf page cho một khóa cụ thể, và giải thích được vì sao thứ tự cột trong một index nhiều cột quyết định truy vấn nào dùng được index đó.

**Đọc.** [§25.1 Tổng quan (Overview)](#/docs/pg-25) cho ba thuộc tính cốt lõi (cân bằng, nhiều nhánh, dữ liệu có thứ tự nối bằng danh sách hai chiều). [§25.2 Tìm kiếm và chèn (Search and Insertions)](#/docs/pg-25) — đọc tuần tự tìm theo đẳng thức/bất đẳng thức/khoảng, và vì sao page đã tách không bao giờ được gộp lại. [§25.3 Bố cục page (Page Layout)](#/docs/pg-25) — đọc kỹ khái niệm high key, gõ lại đúng chuỗi truy vấn dùng \`bt_metap\`/\`bt_page_items\` để lần từ root xuống leaf tìm một booking cụ thể; đọc thêm deduplication *(v. 13)* và compact storage của inner entry qua suffix truncation *(v. 12)*. [§25.4 Operator class (Operator Class)](#/docs/pg-25) cho năm strategy bắt buộc và phần Index nhiều cột và sắp xếp — đọc kỹ vì sao điều kiện lọc chỉ dùng được index hiệu quả nếu bao phủ dãy cột liên tục từ cột đầu tiên. [§25.5 Thuộc tính (Properties)](#/docs/pg-25) cho việc B-tree là access method duy nhất có \`can_order\` và \`can_unique\` đều true.

**Bẫy.** Nghĩ một index nhiều cột \`(book_ref, passenger_name)\` cũng tăng tốc được truy vấn lọc riêng theo \`passenger_name\`. Sách chứng minh bằng \`EXPLAIN\` rằng truy vấn đó vẫn phải \`Parallel Seq Scan\` toàn bộ, vì điều kiện không bao phủ cột đầu tiên của index. Bẫy thứ hai: nghĩ một page B-tree đã tách rồi có thể được gộp lại khi phần lớn dữ liệu của nó bị xóa. Sách nói rõ đây là hạn chế của cách PostgreSQL hiện thực B-tree — page chỉ có thể được prune/dedup để nhường chỗ, không bao giờ được gộp lại với page khác.

**Tự kiểm tra.** High key trong một page B-tree dùng để làm gì, và vì sao nó thường được đặt ở đầu page thay vì cuối? Deduplication *(v. 13)* không áp dụng được cho những kiểu dữ liệu hoặc cấu hình nào, và vì sao?`,
      },
      {
        id: "pg-w11-3",
        text: "GiST: tổng quan và R-tree cho điểm",
        lesson: `**Mục tiêu.** Giải thích được sự khác biệt giữa cách B-tree và GiST xác định đường đi tìm kiếm (thứ tự so sánh so với hàm consistency trên predicate), và tự tính lại được một bước tìm k láng giềng gần nhất bằng distance function trên bounding box.

**Đọc.** [§26.1 Tổng quan (Overview)](#/docs/pg-26) — đọc kỹ khái niệm predicate của leaf/inner entry, và bốn support function bắt buộc (consistency, union, penalty, picksplit) — GiST chỉ cần một operator class khoảng chục hàm thay vì viết cả một access method từ đầu. [§26.2 R-Tree cho điểm (R-Trees for Points)](#/docs/pg-26) — đọc tuần tự Bố cục page (không có metapage, page 0 luôn là root), Operator class (\`point_ops\`, 11 strategy), Tìm các phần tử được chứa (nhiều cây con có thể phải quét, khác B-tree chỉ đi đúng một nhánh), Tìm láng giềng gần nhất — k-NN (distance function không bao giờ được ước lượng cao hơn khoảng cách thật), và Chèn (penalty function chọn nút tăng diện tích ít nhất). Gõ lại đúng ví dụ \`ORDER BY coordinates <-> point(...) LIMIT 10\` trên bảng sân bay.

**Bẫy.** Nghĩ việc tìm kiếm trên GiST, giống B-tree, luôn chỉ đi xuống đúng một nhánh ở mỗi tầng. Sách minh họa bằng ví dụ tìm điểm trong hình chữ nhật rằng nếu các bounding box ở một tầng chồng lấn nhau, thuật toán phải quét *nhiều* cây con cùng lúc, không chỉ một. Bẫy thứ hai: nghĩ hàm khoảng cách (distance function) cho một inner entry phải tính đúng khoảng cách nhỏ nhất tới mọi điểm con của nó. Sách cho phép nó ước lượng thấp hơn (lạc quan) miễn không bao giờ ước lượng cao hơn thực tế — và minh họa hệ quả: ước lượng lạc quan khiến thuật toán quét thêm một node thừa nhưng vẫn cho kết quả đúng.

**Tự kiểm tra.** Vì sao các predicate của một inner entry trong GiST chỉ có thể mở rộng ra theo thời gian mà không bao giờ tự thu hẹp lại (trừ khi tách page hay rebuild)? Penalty function dùng tiêu chí gì để chọn nút con khi chèn một điểm mới vào R-tree?`,
      },
      {
        id: "pg-w11-4",
        text: "GiST: RD-tree cho tìm kiếm toàn văn và các kiểu khác",
        lesson: `**Mục tiêu.** Giải thích được đánh đổi giữa kích thước signature (\`siglen\`) và tỷ lệ false positive khi đánh index \`tsvector\` bằng GiST, và kể tên được ít nhất bốn kiểu dữ liệu/extension khác dùng GiST qua RD-tree hoặc R-tree.

**Đọc.** [§26.3 RD-Tree cho tìm kiếm toàn văn (RD-Trees for Full-Text Search)](#/docs/pg-26) — đọc kỹ vì sao RD-tree dùng bounding set (Russian Doll) thay vì bounding box, rồi signature tree thay thế liệt kê lexeme bằng chuỗi bit cố định (mặc định 124 byte/992 bit) để tránh page quá lớn; đọc ví dụ thí nghiệm với \`mail_messages\` so \`Rows Removed by Index Recheck\` giữa \`siglen\` mặc định và \`siglen=248\`. [§26.4 Các kiểu dữ liệu khác (Other Data Types)](#/docs/pg-26) — đọc lướt danh sách kiểu hình học, range/multirange, ordinal (qua \`btree_gist\`), network address, integer array, ltree, hstore, trigram. Gõ lại đúng thí nghiệm tạo cột \`tsvector\` generated, index GiST, và so \`Rows Removed by Index Recheck\`.

**Bẫy.** Nghĩ tăng \`siglen\` luôn "miễn phí" để giảm false positive. Sách chứng minh bằng số liệu thật (127 MB → 139 MB khi giảm \`siglen\` mặc định xuống 248, đồng thời \`Rows Removed by Index Recheck\` giảm từ 7859 xuống 2060) rằng độ chính xác đánh đổi trực tiếp bằng kích thước index. Bẫy thứ hai: nghĩ vì GiST hỗ trợ toán tử >, < và = qua \`btree_gist\` nên nó là lựa chọn tương đương B-tree cho dữ liệu có thứ tự. Sách cảnh báo rõ B-tree vẫn hiệu quả hơn nhiều cho việc này, và \`btree_gist\` chỉ nên dùng khi cần kết hợp một cột có thứ tự vào cùng index nhiều cột với một cột GiST-only (ví dụ exclusion constraint).

**Tự kiểm tra.** Vì sao index-only scan không thể thực hiện được trên một GiST signature tree cho \`tsvector\`? Giữa hai lựa chọn lưu \`tsvector\` trong biểu thức index và lưu trong một cột generated riêng, sách chỉ ra cách nào nhanh hơn khi truy vấn, và vì sao?`,
      },
    ],
  },
  {
    id: "pg-w12",
    week: "Tuần 12",
    title: "SP-GiST, GIN, BRIN và tổng ôn",
    goal: "Chọn đúng operator class SP-GiST/GIN/BRIN cho một kiểu dữ liệu và một loại tải cụ thể, và tự lập được một bảng chọn loại index cho một bài toán mới mà không cần mở lại sách.",
    practice: "Tạo GIN trên cột jsonb và tsvector, so jsonb_ops với jsonb_path_ops; tạo BRIN trên bảng log chèn theo thời gian, xem pages_per_range ảnh hưởng số trang đọc.",
    resources: [
      { label: "PG 27 — SP-GiST", href: "#/docs/pg-27" },
      { label: "PG 28 — GIN", href: "#/docs/pg-28" },
      { label: "PG 29 — BRIN", href: "#/docs/pg-29" },
      { label: "PG 30 — Lời kết", href: "#/docs/pg-30" },
    ],
    items: [
      {
        id: "pg-w12-1",
        text: "SP-GiST: quadtree, k-d tree, radix tree",
        lesson: `**Mục tiêu.** Giải thích được vì sao cây SP-GiST không cân bằng (khác B-tree và GiST), và chọn đúng operator class (\`quad_point_ops\`/\`kd_point_ops\`/\`text_ops\` radix) cho một kiểu dữ liệu và một kiểu truy vấn cụ thể.

**Đọc.** [§27.1 Tổng quan (Overview)](#/docs/pg-27) cho khái niệm prefix, label, và bốn support function (config, choose, picksplit, inner/leaf consistent). [§27.2 Quadtree cho điểm (Quadtrees for Points)](#/docs/pg-27) — đọc kỹ cách centroid chia mặt phẳng thành bốn góc phần tư, gõ lại ví dụ tìm điểm phía trên Dikson bằng toán tử \`>^\`. [§27.3 K-D tree cho điểm (K-Dimensional Trees for Points)](#/docs/pg-27) cho cách \`kd_point_ops\` luân phiên chia theo trục X/Y, mỗi node chỉ có hai con. [§27.4 Radix tree cho chuỗi (Radix Trees for Strings)](#/docs/pg-27) — đọc kỹ vì sao radix tree hiệu quả cho \`LIKE 'X%'\` và toán tử \`^@\` dành riêng cho tìm theo tiền tố, nhưng kém hơn B-tree cho tìm theo khoảng. [§27.5 Các kiểu dữ liệu khác (Other Data Types)](#/docs/pg-27) đọc lướt \`box_ops\`/\`poly_ops\`/\`range_ops\`/\`inet_ops\`.

**Bẫy.** Nghĩ cây không cân bằng của SP-GiST luôn là bất lợi. Sách chỉ ra ngược lại: nếu cây được giữ trong bộ nhớ thì không sao, và trên đĩa PostgreSQL vẫn đóng gói được nhiều node vào một page — chính vì cây không cân bằng nên SP-GiST phù hợp với cấu trúc như quadtree/k-D tree/radix tree mà B-tree và GiST không hiện thực được. Bẫy thứ hai: nghĩ tìm kiếm theo khoảng (range search) trên radix tree của SP-GiST hiệu quả ngang B-tree vì cả hai đều dùng toán tử >/<. Sách cảnh báo rõ radix tree kém hiệu quả hơn nhiều cho việc này, vì B-tree chỉ cần đi xuống một biên rồi quét danh sách liên kết, còn SP-GiST không có cấu trúc đó.

**Tự kiểm tra.** Vì sao hàm choice của \`quad_point_ops\` luôn tìm được một góc phần tư để gửi giá trị mới vào, trong khi hàm choice của radix tree đôi khi phải tách một node? Giữa \`quad_point_ops\` và \`kd_point_ops\`, operator class nào giữ label trên con trỏ tới node con?`,
      },
      {
        id: "pg-w12-2",
        text: "GIN: toàn văn, trigram, mảng, JSON",
        lesson: `**Mục tiêu.** Giải thích được vì sao GIN chỉ hỗ trợ bitmap scan chứ không index scan, và chọn đúng giữa \`jsonb_ops\` và \`jsonb_path_ops\` cho một tập truy vấn jsonb cụ thể.

**Đọc.** [§28.1 Tổng quan (Overview)](#/docs/pg-28) cho cấu trúc cây phần tử + posting list/posting tree, và ba kết luận rút ra từ việc một phần tử chỉ lưu một lần. [§28.2 Index cho tìm kiếm toàn văn (Index for Full-Text Search)](#/docs/pg-28) — đọc kỹ tối ưu hóa lexeme phổ biến/hiếm (bắt buộc so với tùy chọn), \`fastupdate\` và pending list, và vì sao BITMAP SCAN được hỗ trợ nhưng INDEX SCAN thì không. [§28.3 Trigram (Trigrams)](#/docs/pg-28) cho \`gin_trgm_ops\` và so sánh mờ. [§28.4 Index mảng (Indexing Arrays)](#/docs/pg-28) — đọc kỹ ví dụ điều kiện bằng vẫn cần recheck dù index đã lọc theo phần tử. [§28.5 Index JSON (Indexing JSON)](#/docs/pg-28) — đọc kỹ khác biệt \`jsonb_ops\` (mọi khóa/giá trị/phần tử mảng riêng lẻ) và \`jsonb_path_ops\` (băm cả path, index nhỏ và chính xác hơn nhưng không tăng tốc kiểm tra tồn tại khóa đơn lẻ \`?\`). [§28.6 Index các kiểu dữ liệu khác (Indexing Other Data Types)](#/docs/pg-28) đọc lướt. Gõ lại đúng thí nghiệm so sánh tốc độ tìm "tattoo" (hiếm) và "wrote" (phổ biến) trên kho \`mail_messages\`.

**Bẫy.** Nghĩ \`jsonb_path_ops\` là "bản nâng cấp" nên luôn nên dùng thay \`jsonb_ops\`. Sách nói rõ \`jsonb_path_ops\` chỉ hỗ trợ ba toán tử (\`@>\`, \`@?\`, \`@@\`) — không có \`?\`, \`?|\`, \`?&\`; nếu truy vấn cần kiểm tra tồn tại khóa đơn lẻ thì bắt buộc phải dùng \`jsonb_ops\`. Bẫy thứ hai: nghĩ đặt LIMIT trên một truy vấn GIN sẽ dừng sớm giống index scan thông thường. Sách chứng minh bằng \`EXPLAIN\` rằng GIN luôn phải dựng xong toàn bộ bitmap trước, nên LIMIT không giảm được cost — muốn giới hạn gần đúng phải dùng \`gin_fuzzy_search_limit\`, và ngay cả cách đó cũng không cho kết quả nhất quán giữa hai lần chạy.

**Tự kiểm tra.** Vì sao một GIN index không bao giờ lưu bản trùng lặp của cùng một phần tử? Với truy vấn "farm & cluck", lexeme nào được coi là bắt buộc và vì sao — dựa trên tần suất xuất hiện hay thứ tự viết trong truy vấn?`,
      },
      {
        id: "pg-w12-3",
        text: "BRIN và bốn họ operator class",
        lesson: `**Mục tiêu.** Giải thích được vì sao hiệu quả của BRIN minmax phụ thuộc vào correlation trong khi BRIN bloom thì không, và tính lại được hệ số hiệu quả của một BRIN index từ số liệu Buffers trong \`EXPLAIN\`.

**Đọc.** [§29.1 Tổng quan (Overview)](#/docs/pg-29) cho khái niệm range/\`pages_per_range\` và lossy bitmap. [§29.2 Ví dụ (Example)](#/docs/pg-29) — gõ lại đúng phép so sánh kích thước 184kB (BRIN) so với 210MB (B-tree) trên cùng cột. [§29.3 Bố cục page (Page Layout)](#/docs/pg-29) cho metapage/range map (revmap)/page tóm tắt. [§29.4 Tìm kiếm (Search)](#/docs/pg-29) — đọc kỹ vì sao range chưa tóm tắt luôn bị thêm vào bitmap. [§29.5 Cập nhật thông tin tóm tắt (Summary Information Updates)](#/docs/pg-29) cho \`autosummarize\` (mặc định off) và vì sao thông tin tóm tắt chỉ có thể rộng ra, không co lại. [§29.6 Các lớp minmax (Minmax Classes)](#/docs/pg-29) — đọc kỹ cách chọn cột bằng \`correlation\` trong \`pg_stats\` và công thức hệ số hiệu quả. [§29.7 Các lớp minmax-multi (Minmax-Multi Classes)](#/docs/pg-29) *(v. 14)* cho vì sao UPDATE/DELETE phá vỡ correlation dù không đổi giá trị logic, và \`values_per_range\`. [§29.8 Các lớp inclusion (Inclusion Classes)](#/docs/pg-29) cho bounding box và vì sao planner ít khi tự chọn nó (thiếu thống kê correlation). [§29.9 Các lớp bloom (Bloom Classes)](#/docs/pg-29) *(v. 14)* cho \`n_distinct_per_range\` và \`false_positive_rate\`.

**Bẫy.** Nghĩ BRIN luôn là lựa chọn "miễn phí" để tăng tốc mọi cột của một bảng lớn. Sách chứng minh ngược lại bằng bảng correlation của \`flights_bi\`: các cột như \`passenger_id\` hay \`flight_no\` có correlation gần 0, và đánh index chúng bằng minmax thường vô dụng — phải dùng bloom *(v. 14)* hoặc chấp nhận sequential scan. Bẫy thứ hai: nghĩ UPDATE một dòng chỉ ảnh hưởng tới đúng dòng đó nên không phá được correlation của cả bảng. Sách minh họa bằng thí nghiệm xóa 0.1% dòng rồi VACUUM: row version mới bị chèn vào bất kỳ khoảng trống nào, khiến range đầu tiên (vốn chỉ bao phủ chưa đến một ngày) mở rộng ra bao trùm cả năm.

**Tự kiểm tra.** Vì sao BRIN không hỗ trợ thuộc tính CLUSTERABLE dù nó rất nhạy cảm với thứ tự vật lý? Vì sao planner "thường tránh dùng" index inclusion ngay cả khi nó chính xác, theo giải thích ở §29.8?`,
      },
      {
        id: "pg-w12-4",
        text: "Lời kết và tổng ôn: chọn index cho một bài toán",
        lesson: `**Mục tiêu.** Tự lập được trên một trang một bảng loại index (Hash/B-tree/GiST/SP-GiST/GIN/BRIN) × toán tử hỗ trợ chính × kiểu dữ liệu điển hình × cái giá phải trả khi ghi, đủ để chọn đúng loại cho một bài toán mới mà không cần mở lại sách.

**Đọc.** [Lời kết](#/docs/pg-30) — ngắn, đọc trọn lời khuyên của tác giả về việc tự kiểm chứng thay vì tin sách hay tài liệu chính thức. Sau đó lướt lại đúng phần thuộc tính/tổng quan của từng chương index để tự điền bảng: [§24.4 Thuộc tính](#/docs/pg-24), [§25.1 Tổng quan](#/docs/pg-25) và [§25.5 Thuộc tính](#/docs/pg-25), [§26.1 Tổng quan](#/docs/pg-26), [§27.1 Tổng quan](#/docs/pg-27), [§28.1 Tổng quan](#/docs/pg-28), [§29.1 Tổng quan](#/docs/pg-29). Đối chiếu thêm với [Chương 24 — Hash](#/docs/pg-24), [Chương 25 — B-tree](#/docs/pg-25), [Chương 26 — GiST](#/docs/pg-26), [Chương 27 — SP-GiST](#/docs/pg-27), [Chương 28 — GIN](#/docs/pg-28) và [Chương 29 — BRIN](#/docs/pg-29) để lấy đúng cái giá phải trả khi ghi của mỗi loại.

**Bẫy.** Mặc định chọn B-tree cho mọi cột chỉ vì nó là access method quen thuộc nhất. Nhiều chương đã chỉ ra B-tree không dùng được cho kiểu không có thứ tự (điểm, jsonb, tsvector) và tốn nhiều dung lượng hơn hẳn BRIN trên bảng cực lớn có correlation cao (210MB so với 184kB trong ví dụ §29.2). Bẫy thứ hai: tạo GIN trên một bảng ghi nhiều mà không đo trước. Sách nói thẳng ở §28.2 rằng cập nhật GIN chậm vì một dòng có thể sửa đổi rất nhiều phần tử trong cây cùng lúc; nên đo cost ghi bằng \`fastupdate\`/pending list trước khi đưa GIN vào một bảng OLTP có UPDATE thường xuyên.

**Tự kiểm tra.** Với ba bài toán — tìm kiếm jsonb bằng \`@>\`, một bảng log append-only một tỷ dòng cần lọc theo thời gian, và một ràng buộc "lịch phòng không được chồng lấn" — bảng một trang của bạn chỉ ra loại index nào cho mỗi bài toán, và vì sao hai bài toán đầu không thể dùng B-tree hiệu quả? Nếu phải đổi loại index đã chọn vì bảng ghi nhiều hơn dự kiến, chương nào trong số 24–29 cho biết cái giá cụ thể phải trả khi ghi tăng lên?`,
      },
    ],
  },
];
