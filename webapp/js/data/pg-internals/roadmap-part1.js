// Lộ trình đọc PostgreSQL 14 Internals — Phần 1 (Tuần 1–6).
//
// Nguồn: bản dịch tiếng Việt "PostgreSQL 14 Internals" — Egor Rogov, Postgres Professional 2023.
// Thư mục nguồn: sources/pg-internals/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Link mục dạng [§N.M …](#/docs/pg-NN) — N luôn bằng số chương của doc.
// GIỮ NGUYÊN id (pg-w<N> / pg-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Phân bổ 12 tuần bám ranh giới Phần: T1 00–01 · T2 ch2–3 · T3 ch4–6 (§6.1–6.4) ·
// T4 §6.5–6.7 + ch7–8 + ôn Phần I · T5 ch9–10 · T6 ch11 + ôn Phần II · T7 ch12–15 ·
// T8 ch16–17 · T9 ch18–20 · T10 ch21–23 · T11 ch24–26 · T12 ch27–30 + tổng ôn.
// Tuần 1 và 6 nhẹ chữ — dành cho lab.

export const pgWeeksPart1 = [
  {
    id: "pg-w1",
    week: "Tuần 1",
    title: "Nhìn tổng thể PostgreSQL",
    goal: "Vẽ lại được sơ đồ database/schema/tablespace/relation/fork/page của một cluster PostgreSQL, và giải thích được vì sao server cần một backend process riêng cho mỗi client.",
    practice: "Dựng PostgreSQL 14+ (Docker postgres:14 trở lên), tạo database lab, chạy CREATE EXTENSION pageinspect; tìm tệp dữ liệu của một bảng bằng pg_relation_filepath và liệt kê các fork của nó trên đĩa.",
    resources: [
      { label: "PG 00 — Về cuốn sách này", href: "#/docs/pg-00" },
      { label: "PG 01 — Giới thiệu", href: "#/docs/pg-01" },
      { label: "postgresql.org — Documentation 14", href: "https://www.postgresql.org/docs/14/index.html" },
    ],
    items: [
      {
        id: "pg-w1-1",
        text: "Cách đọc cuốn sách và dựng lab psql",
        lesson: `**Mục tiêu.** Biết cuốn sách này giả định gì ở người đọc, dùng đúng quy ước ký hiệu của bản dịch (tham chiếu trang, số phiên bản, giá trị mặc định, hai phiên psql song song), và không mong đợi nó là tài liệu tra cứu hay giáo trình.

**Đọc.** [Về cuốn sách này](#/docs/pg-00) — đọc "Cuốn sách này dành cho ai?" và "Những gì cuốn sách này sẽ không mang lại" để biết giới hạn: sách không dạy cài server hay phát triển lõi C. Đọc kỹ mục "Quy ước": cách các tham chiếu trang *[→ tr. N]*, ghi chú phiên bản *(v. N)* và giá trị mặc định *(mặc định: ...)* được trình bày, và vì sao nhiều thí nghiệm trong sách cần mở hai terminal psql song song (một phiên được thụt lề, đánh dấu bằng đường kẻ dọc).

**Bẫy.** Coi cuốn sách như một tuyển tập công thức có sẵn cho mọi tình huống. Sách nói thẳng nó không phải vậy — mục tiêu là hiểu cơ chế bên trong để tự đánh giá kinh nghiệm người khác, không phải để chép giải pháp. Bẫy thứ hai: nghĩ mọi ví dụ SQL trong sách chỉ mang tính minh hoạ ước lệ. Sách khẳng định mọi ví dụ đều do một script thật sinh ra trên PostgreSQL 14, nên lặp lại đúng các lệnh sẽ ra đúng kết quả (kể cả ID transaction).

**Tự kiểm tra.** Ký hiệu *(v. 13)* đặt cạnh một đoạn văn nghĩa là gì? Vì sao sách dùng hai terminal psql thay vì một khi minh hoạ thực thi đồng thời?`,
      },
      {
        id: "pg-w1-2",
        text: "Tổ chức dữ liệu: database, schema, relation, fork, page",
        lesson: `**Mục tiêu.** Từ tên một bảng, lần ra được đường dẫn file trên đĩa của nó qua oid database và relfilenode, và liệt kê được các fork bắt buộc mà một relation có.

**Đọc.** [§1.1 Tổ chức dữ liệu (Data Organization)](#/docs/pg-01) — đọc tuần tự các mục con "Cơ sở dữ liệu", "System Catalog", "Schema", "Tablespace", "Relation", "File và fork", "Page" và "TOAST". Đọc kỹ ví dụ dùng \`pg_relation_filepath\`, \`pg_database.oid\` và \`pg_class.relfilenode\` để tìm ra đường dẫn \`base/16384/16385\` — đây là kỹ năng tra cứu sẽ dùng lại xuyên suốt sách. Chú ý bảng liệt kê bốn loại fork (main, initialization, free space map, visibility map) và vì sao ngay cả một bảng nhỏ không index cũng cần ít nhất ba file.

**Bẫy.** Tưởng "relation" chỉ nói tới bảng. Sách nêu rõ PostgreSQL dùng thuật ngữ này cho mọi thứ có cấu trúc dòng: bảng, index, sequence, materialized view và cả view thường (dù view không lưu dữ liệu). Bẫy thứ hai: nghĩ TOAST chỉ áp dụng khi cột thực sự chứa giá trị dài. Sách chỉ ra nếu bảng có một cột kiểu \`numeric\` hay \`text\`, một bảng TOAST được tạo ngay lập tức bất kể cột đó có bao giờ lưu giá trị dài hay không.

**Tự kiểm tra.** Free space map và visibility map khác nhau ở chỗ nào về mục đích, và vì sao visibility map chỉ tồn tại ở bảng chứ không ở index? Với một cột kiểu \`text\` dùng chiến lược \`external\`, giá trị dài được lưu ở đâu và có bị nén không?`,
      },
      {
        id: "pg-w1-3",
        text: "Process và bộ nhớ",
        lesson: `**Mục tiêu.** Kể tên được các tiến trình nền chính của một instance PostgreSQL và nhiệm vụ của từng tiến trình, và giải thích được vì sao shared memory cần thiết cho caching.

**Đọc.** [§1.2 Tiến trình và bộ nhớ (Processes and Memory)](#/docs/pg-01) — đọc kỹ vai trò của \`postmaster\` (sinh và giám sát các tiến trình con) và danh sách các tiến trình nền: \`startup\`, \`autovacuum\`, \`wal writer\`, \`checkpointer\`, \`writer\`, \`stats collector\`, \`wal sender\`, \`wal receiver\`. Đọc đoạn giải thích vì sao PostgreSQL vẫn dùng mô hình tiến trình (process) thay vì luồng (thread), và đoạn về buffer cache cùng double caching với hệ điều hành.

**Bẫy.** Nghĩ PostgreSQL dùng direct I/O để tránh double caching như một số hệ cơ sở dữ liệu khác. Sách nói ngược lại: PostgreSQL hầu như luôn đọc/ghi qua cache của hệ điều hành, nên dữ liệu bị cache ở cả hai tầng. Bẫy thứ hai: nghĩ mất điện chỉ làm mất dữ liệu chưa commit. Sách chỉ ra khi sự cố xảy ra, *toàn bộ* nội dung RAM (kể cả buffer cache đang chứa dữ liệu đã commit nhưng chưa ghi xuống đĩa) đều bị mất — đó là lý do cần WAL.

**Tự kiểm tra.** Tiến trình nào chịu trách nhiệm khôi phục sau sự cố khi server khởi động lại? Vì sao việc chuyển PostgreSQL sang mô hình luồng được xem là hấp dẫn nhưng vẫn chưa được thực hiện?`,
      },
      {
        id: "pg-w1-4",
        text: "Client, giao thức client-server và tự đánh giá nền",
        lesson: `**Mục tiêu.** Giải thích được vì sao mỗi client cần một backend process riêng, ba lý do khiến điều này trở thành vấn đề ở tải cao, và tự vẽ lại được toàn bộ sơ đồ database/schema/relation/fork/process của tuần này trên một trang giấy.

**Đọc.** [§1.3 Client và giao thức client-server (Clients and the Client-Server Protocol)](#/docs/pg-01) — đọc ba lý do sách đưa ra khiến nhiều backend process gây vấn đề (RAM cho mỗi tiến trình, chi phí kết nối ngắn hạn, chi phí quét danh sách tiến trình), và vì sao PostgreSQL không có connection pooling tích hợp mà phải dựa vào PgBouncer hay Odyssey. Đọc đoạn về authentication và việc một kết nối luôn gắn với một database và một role cụ thể. Sau đó tự vẽ lại sơ đồ: một cluster, ba database mặc định, các schema, tablespace, và các fork của một bảng ví dụ.

**Bẫy.** Nghĩ connection pooling ở tầng ứng dụng không ảnh hưởng gì đến cách viết code. Sách cảnh báo ngược lại: khi dùng pooling, một backend có thể lần lượt phục vụ transaction của nhiều client khác nhau, nên chỉ được dùng tài nguyên cục bộ trong phạm vi một transaction, không phải toàn bộ session. Bẫy thứ hai: nghĩ postmaster xử lý luôn truy vấn SQL của client. Sách nói postmaster chỉ sinh ra backend process; chính backend process mới parse, tối ưu hoá và thực thi truy vấn.

**Tự kiểm tra.** Vì sao càng nhiều backend process đang chạy thì hiệu năng có thể càng giảm, ngay cả khi mỗi tiến trình không làm gì? Trong sơ đồ bạn vừa vẽ, một bảng UNLOGGED khác một bảng thường ở những fork nào?`,
      },
    ],
  },
  {
    id: "pg-w2",
    week: "Tuần 2",
    title: "Isolation và cách tuple được lưu",
    goal: "Tái hiện được lost update, dirty read và non-repeatable read trên hai phiên psql, và đọc đúng ý nghĩa của xmin/xmax/infomask trong một dòng heap page.",
    practice: "Mở hai phiên psql, tái hiện lost update ở Read Committed rồi thấy Repeatable Read báo lỗi serialization; dùng pageinspect (heap_page_items) xem xmin/xmax của một dòng trước và sau UPDATE.",
    resources: [
      { label: "PG 02 — Isolation (Tính cô lập)", href: "#/docs/pg-02" },
      { label: "PG 03 — Pages and Tuples", href: "#/docs/pg-03" },
      { label: "postgresql.org — pageinspect", href: "https://www.postgresql.org/docs/14/pageinspect.html" },
    ],
    items: [
      {
        id: "pg-w2-1",
        text: "Consistency, anomaly và isolation level theo chuẩn SQL",
        lesson: `**Mục tiêu.** Định nghĩa được bốn anomaly của chuẩn SQL (lost update, dirty read, non-repeatable read, phantom read) bằng ví dụ tài khoản ngân hàng, và điền đúng bảng bốn isolation level × bốn anomaly theo chuẩn.

**Đọc.** [§2.1 Tính nhất quán (Consistency)](#/docs/pg-02) cho khái niệm consistency chặt hơn integrity, và vì sao transaction cần thiết ngay cả khi ứng dụng luôn đúng. [§2.2 Isolation level và anomaly trong chuẩn SQL (Isolation Levels and Anomalies in SQL Standard)](#/docs/pg-02) — đọc kỹ bốn ví dụ anomaly và bảng tổng hợp cuối mục; chú ý đoạn giải thích vì sao 2PL (two-phase locking) là nền tảng lý do các mức được định nghĩa như vậy, và vì sao predicate lock (cần cho Serializable thật sự) gần như chưa từng được triển khai đúng nghĩa.

**Bẫy.** Nghĩ Serializable chỉ đơn giản là cấm thêm bốn anomaly đã liệt kê. Sách nói rõ Serializable phải ngăn *mọi* anomaly, kể cả những cái chưa được đặt tên — mạnh hơn hẳn việc chỉ cấm bốn cái trong bảng. Bẫy thứ hai: nghĩ integrity constraint (như NOT NULL, UNIQUE) đủ để đảm bảo consistency. Sách chỉ ra consistency là khái niệm ứng dụng định nghĩa, database không biết gì về nó ngoài các ràng buộc đã khai báo tường minh.

**Tự kiểm tra.** Theo bảng chuẩn SQL, Repeatable Read cho phép anomaly nào trong bốn loại? Vì sao lost update bị cấm ở *mọi* isolation level theo chuẩn, kể cả Read Uncommitted?`,
      },
      {
        id: "pg-w2-2",
        text: "Isolation level trong PostgreSQL và nên chọn mức nào",
        lesson: `**Mục tiêu.** Tái hiện được read skew và write skew ở Read Committed/Repeatable Read trên hai phiên psql, và chọn được isolation level phù hợp cho một tình huống ứng dụng cụ thể.

**Đọc.** [§2.3 Isolation level trong PostgreSQL (Isolation Levels in PostgreSQL)](#/docs/pg-02) — đọc lần lượt ba mục con Read Committed (dirty read bị cấm, non-repeatable read được phép, và hai biến thể read skew), Repeatable Read (serialization failure thay lost update, write skew, anomaly transaction chỉ đọc) và Serializable (trì hoãn transaction READ ONLY DEFERRABLE). Gõ lại ví dụ bảng \`accounts\` và ít nhất kịch bản lost update ở Read Committed. Kết bằng [§2.4 Nên dùng isolation level nào? (Which Isolation Level to Use?)](#/docs/pg-02) để so sánh chi phí và trách nhiệm ứng dụng ở ba mức.

**Bẫy.** Nghĩ dùng một câu lệnh SQL duy nhất luôn tránh được mọi anomaly ở Read Committed. Sách chỉ ra một ngoại lệ tinh quái: nếu câu lệnh gọi một hàm \`VOLATILE\` chạy truy vấn lồng nhau, hàm đó có thể thấy dữ liệu không nhất quán với phần còn lại của câu lệnh chính. Bẫy thứ hai: nghĩ Repeatable Read loại bỏ hoàn toàn nguy cơ đọc sai. Sách chứng minh bằng hai ví dụ tách biệt rằng snapshot isolation (nền của Repeatable Read) chỉ không ngăn được đúng hai anomaly: write skew (hai transaction mỗi bên trừ $600 từ một trong hai tài khoản của Bob, tưởng an toàn vì mỗi bên đều thấy tổng số dư đủ điều kiện) và anomaly transaction chỉ đọc (minh hoạ riêng bằng ví dụ tính lãi, nơi một transaction chỉ đọc chen vào giữa hai transaction ghi) — bất kể còn bao nhiêu anomaly khác chưa biết.

**Tự kiểm tra.** Vì sao ở Read Committed, một UPDATE có điều kiện tổng hợp (như tính lãi theo \`sum(amount) >= 1000\`) có thể gây ra read skew thay vì lost update? Vì sao Serializable không hỗ trợ trên replica và không kết hợp được với các isolation level khác trong cùng ứng dụng?`,
      },
      {
        id: "pg-w2-3",
        text: "Cấu trúc page và bố cục row version",
        lesson: `**Mục tiêu.** Vẽ lại được năm phần của một heap page (header, item pointer, free space, tuple, special space), và tính được vì sao thứ tự cột trong CREATE TABLE ảnh hưởng đến kích thước dòng.

**Đọc.** [§3.1 Cấu trúc page (Page Structure)](#/docs/pg-03) — đọc các mục con Page header, Không gian đặc biệt, Tuple, Item pointer, Không gian trống; dùng \`page_header\`/\`get_raw_page\` của \`pageinspect\` để tự xem \`lower\`/\`upper\`/\`special\`. [§3.2 Bố cục của row version (Row Version Layout)](#/docs/pg-03) cho bốn trường chính của tuple header (xmin, xmax, infomask, ctid, null bitmap) và ví dụ \`padding\` cho thấy đổi thứ tự cột \`boolean\`/\`integer\` giảm kích thước dòng từ 40 xuống 34 byte.

**Bẫy.** Nghĩ tuple có thể được tham chiếu trực tiếp bằng offset trong page. Sách giải thích PostgreSQL cố tình dùng địa chỉ gián tiếp qua item pointer để tuple có thể di chuyển bên trong page (như khi pruning) mà không làm hỏng TID đang được index tham chiếu. Bẫy thứ hai: nghĩ 24 byte header là chi phí không đáng kể. Với bảng "hẹp" (ít cột, kiểu ngắn), sách chỉ rõ kích thước metadata có thể vượt quá kích thước dữ liệu thực sự được lưu.

**Tự kiểm tra.** Trong ví dụ \`padding\`, 6 byte bị lãng phí ở thứ tự cột đầu tiên là do căn chỉnh cho kiểu dữ liệu nào? Vì sao PostgreSQL đảm bảo free space trong một page luôn là một khối liên tục, không bị phân mảnh?`,
      },
      {
        id: "pg-w2-4",
        text: "Thao tác trên tuple, index, TOAST, virtual transaction, subtransaction",
        lesson: `**Mục tiêu.** Đọc được trạng thái xmin/xmax/hint bit của một tuple qua heap_page_items sau INSERT, UPDATE, DELETE và ROLLBACK, và giải thích được vì sao PostgreSQL cấp virtual XID trước khi cấp XID thật.

**Đọc.** [§3.3 Các thao tác trên tuple (Operations on Tuples)](#/docs/pg-03) — đọc tuần tự Insert, Commit (vai trò CLOG và hint bit), Delete, Abort, Update; gõ lại toàn bộ chuỗi thí nghiệm với hàm \`heap_page\` tự định nghĩa trong sách. [§3.4 Index (Indexes)](#/docs/pg-03) cho biết index không có xmin/xmax. Đọc lướt [§3.5 TOAST](#/docs/pg-03). Đọc kỹ [§3.6 Transaction ảo (Virtual Transactions)](#/docs/pg-03) và [§3.7 Subtransaction (Subtransactions)](#/docs/pg-03), đặc biệt đoạn savepoint và ROLLBACK TO giữ lại pointer của subtransaction đã abort trong page.

**Bẫy.** Nghĩ ROLLBACK undo dữ liệu vật lý trong page. Sách khẳng định ngược lại: cơ chế abort chỉ đặt bit \`aborted\` trong CLOG, mọi thay đổi transaction đã thực hiện trong các page dữ liệu vẫn nằm nguyên tại chỗ. Bẫy thứ hai: nghĩ mọi transaction đều tiêu tốn một transaction ID thật ngay khi BEGIN. Sách chỉ ra một transaction chỉ đọc ban đầu chỉ nhận virtual XID (process ID + số thứ tự), và chỉ nhận XID thật khi nó bắt đầu sửa đổi dữ liệu.

**Tự kiểm tra.** Sau khi UPDATE một dòng rồi COMMIT, xmax của phiên bản cũ và xmin của phiên bản mới có quan hệ gì với nhau? Vì sao \`pg_current_xact_id()\` gọi trong lúc một subtransaction đang chạy vẫn trả về ID của transaction chính chứ không phải của subtransaction?`,
      },
    ],
  },
  {
    id: "pg-w3",
    week: "Tuần 3",
    title: "Snapshot, HOT và vacuum",
    goal: "Đọc đúng bốn thành phần xmin:xmax:xip_list của một snapshot để nói tuple nào hiện ra, và giải thích được vì sao vacuum không dọn được một dead tuple khi có transaction dài giữ database horizon.",
    practice: "Giữ một transaction Repeatable Read mở ở phiên A, UPDATE nhiều lần ở phiên B, chạy VACUUM VERBOSE và thấy tuple chết không bị dọn; commit phiên A rồi vacuum lại.",
    resources: [
      { label: "PG 04 — Snapshots", href: "#/docs/pg-04" },
      { label: "PG 05 — Page Pruning và HOT Updates", href: "#/docs/pg-05" },
      { label: "PG 06 — Vacuum và Autovacuum", href: "#/docs/pg-06" },
    ],
    items: [
      {
        id: "pg-w3-1",
        text: "Snapshot và quy tắc visibility của row version",
        lesson: `**Mục tiêu.** Nhìn một snapshot \`xmin:xmax:xip_list\` và cặp \`xmin\`/\`xmax\` của một tuple là nói được tuple đó có hiện ra với transaction hay không, và giải thích vì sao Read Committed lấy snapshot mỗi câu lệnh còn Repeatable Read lấy một lần.

**Đọc.** [§4.1 Snapshot là gì?](#/docs/pg-04) → [§4.2 Khả năng nhìn thấy của row version](#/docs/pg-04) → [§4.3 Cấu trúc snapshot](#/docs/pg-04) → [§4.4 Khả năng nhìn thấy các thay đổi của chính transaction](#/docs/pg-04). Đọc kỹ hình minh hoạ các vùng transaction ID so với xmin/xmax của snapshot; mở hai phiên psql, gọi \`pg_current_snapshot()\` ở cả hai trong lúc một phiên đang giữ transaction mở.

**Bẫy.** Tưởng snapshot là bản sao dữ liệu. Sách cho thấy snapshot chỉ là vài con số transaction ID; dữ liệu "cũ" nằm ngay trong heap dưới dạng các row version khác. Bẫy thứ hai: nghĩ transaction luôn thấy mọi thay đổi của chính nó — con trỏ mở trước một lệnh sẽ không thấy thay đổi của lệnh đó (xem §4.4).

**Tự kiểm tra.** Một tuple có \`xmin\` nằm trong \`xip_list\` của snapshot thì có hiện ra không, vì sao? Vì sao hai lệnh SELECT giống hệt nhau trong một transaction Read Committed có thể trả khác nhau còn ở Repeatable Read thì không?`,
      },
      {
        id: "pg-w3-2",
        text: "Transaction horizon, snapshot của catalog, export snapshot",
        lesson: `**Mục tiêu.** Giải thích được vì sao một transaction Repeatable Read đang mở, dù không đụng tới bảng nào, vẫn có thể chặn vacuum dọn dead tuple ở bảng khác, và biết khi nào cần export snapshot.

**Đọc.** [§4.5 Transaction horizon (Chân trời transaction)](#/docs/pg-04) — đọc kỹ định nghĩa horizon qua \`xmin\` và cách \`pg_stat_activity.backend_xmin\` cho thấy horizon của một transaction; chú ý ba kết luận cuối mục về Repeatable Read/Serializable dài, Read Committed "idle in transaction", và transaction ảo. [§4.6 Snapshot của system catalog](#/docs/pg-04) cho thấy catalog cần snapshot "mới" hơn snapshot thông thường của transaction. [§4.7 Xuất snapshot (Exporting Snapshots)](#/docs/pg-04) cho ví dụ \`pg_export_snapshot\`/\`SET TRANSACTION SNAPSHOT\` dùng trong \`pg_dump\` song song.

**Bẫy.** Nghĩ chỉ transaction đang sửa đổi dữ liệu mới giữ database horizon lại. Sách chỉ rõ một transaction Read Committed hoàn toàn không thực thi câu lệnh nào (ở trạng thái "idle in transaction") vẫn giữ horizon y như một transaction đang hoạt động. Bẫy thứ hai: nghĩ database horizon là khái niệm theo từng bảng. Sách nói chỉ có *một* horizon cho toàn cơ sở dữ liệu — một transaction giữ horizon sẽ chặn vacuum dọn dữ liệu ở mọi bảng, kể cả bảng nó chưa từng truy cập.

**Tự kiểm tra.** Vì sao PostgreSQL không thể tạo snapshot cho một thời điểm bất kỳ trong quá khứ (retrospective query), dù dữ liệu vẫn còn nằm trong heap? Hai transaction song song có bắt buộc thấy cùng dữ liệu chỉ vì chúng BEGIN cùng lúc không — muốn ép chúng thấy cùng snapshot thì dùng cơ chế nào?`,
      },
      {
        id: "pg-w3-3",
        text: "Page pruning và HOT update",
        lesson: `**Mục tiêu.** Đọc được trạng thái \`redirect\`/\`dead\`/\`unused\` của item pointer sau một chuỗi HOT update, và giải thích được điều kiện để một UPDATE đủ tiêu chuẩn HOT.

**Đọc.** [§5.1 Page Pruning (Dọn dẹp trang)](#/docs/pg-05) cho ba điều kiện kích hoạt pruning và vì sao nó không đụng tới visibility map/free space map. [§5.2 HOT Updates (Cập nhật HOT)](#/docs/pg-05) — đọc kỹ điều kiện tiên quyết (cột sửa đổi không nằm trong bất kỳ index nào) và hai bit \`Heap Only Tuple\`/\`Heap Hot Updated\`. [§5.3 Page Pruning cho HOT Updates](#/docs/pg-05) cho cơ chế địa chỉ kép \`redirect\`. Đọc lướt [§5.4 Tách HOT Chain (HOT Chain Splits)](#/docs/pg-05) và [§5.5 Page Pruning cho index (Page Pruning for Indexes)](#/docs/pg-05). Gõ lại thí nghiệm bảng \`hot\` với \`fillfactor = 75\` trong sách.

**Bẫy.** Nghĩ HOT update áp dụng được cho mọi UPDATE không đổi cột được đánh index của riêng nó. Sách nhấn mạnh điều kiện là cột bị sửa đổi không thuộc *bất kỳ* index nào trên bảng, kể cả index không liên quan tới cột đó về mặt nghiệp vụ. Bẫy thứ hai: nghĩ item pointer bị prune biến mất ngay. Sách cho thấy chúng chỉ đổi trạng thái thành \`dead\` (vì index vẫn tham chiếu) rồi mới thành \`unused\` sau khi index entry cũng bị dọn.

**Tự kiểm tra.** Vì sao một HOT chain không bao giờ vượt ra ngoài một heap page duy nhất? Khi HOT chain bị tách sang page khác, index phải làm gì thêm so với trường hợp chain nằm gọn trong một page?`,
      },
      {
        id: "pg-w3-4",
        text: "Vacuum: horizon, các giai đoạn và analyze",
        lesson: `**Mục tiêu.** Kể đúng thứ tự bốn giai đoạn của VACUUM (heap scan, index vacuuming, heap vacuuming, heap truncation), và giải thích được vì sao một transaction dài có thể khiến VACUUM VERBOSE báo "cannot be removed yet".

**Đọc.** [§6.1 Vacuum](#/docs/pg-06) cho vai trò visibility map trong việc bỏ qua page, và ví dụ \`heap_page\`/\`index_page\` cho thấy pointer chuyển từ \`normal\` sang \`unused\`. [§6.2 Nhìn lại database horizon (Database Horizon Revisited)](#/docs/pg-06) — gõ lại đúng thí nghiệm mở một transaction ở bảng khác để giữ horizon, chạy \`VACUUM VERBOSE\` và đọc dòng "cannot be removed yet, oldest xmin". [§6.3 Các giai đoạn của vacuum (Vacuum Phases)](#/docs/pg-06) cho bốn giai đoạn theo đúng thứ tự và vai trò của \`maintenance_work_mem\`. Đọc lướt [§6.4 Analysis (Phân tích)](#/docs/pg-06).

**Bẫy.** Nghĩ VACUUM luôn dọn sạch mọi dead tuple trong một lần chạy. Sách chỉ rõ nếu mảng \`tid\` (giới hạn bởi \`maintenance_work_mem\`) đầy trước khi quét hết bảng, index vacuuming và heap vacuuming phải lặp lại nhiều vòng — \`VACUUM VERBOSE\` cho thấy rõ số lần quét index. Bẫy thứ hai: nghĩ transaction chỉ đọc không ảnh hưởng gì tới vacuum. Thí nghiệm trong §6.2 cho thấy một transaction ở bảng khác, không đụng gì tới bảng đang vacuum, vẫn đủ để giữ database horizon và ngăn VACUUM dọn dead tuple.

**Tự kiểm tra.** Trong bốn giai đoạn vacuum, giai đoạn nào bị bỏ qua nếu bảng chỉ có INSERT chứ không có UPDATE/DELETE nào, vì sao? \`VACUUM VERBOSE\` báo "1 dead row versions cannot be removed yet, oldest xmin: N" — con số N đến từ đâu?`,
      },
    ],
  },
  {
    id: "pg-w4",
    week: "Tuần 4",
    title: "Autovacuum, freezing và rebuild",
    goal: "Tính được ngưỡng kích hoạt autovacuum của một bảng cụ thể từ pg_stat_all_tables và pg_class.reltuples, và giải thích được vì sao transaction ID 32-bit bắt buộc phải có freezing.",
    practice: "Theo dõi tuổi bảng bằng age(relfrozenxid), chạy VACUUM FREEZE và xem cờ frozen qua pageinspect; so kích thước bảng trước/sau VACUUM FULL.",
    resources: [
      { label: "PG 06 — Vacuum và Autovacuum", href: "#/docs/pg-06" },
      { label: "PG 07 — Freezing", href: "#/docs/pg-07" },
      { label: "PG 08 — Xây dựng lại bảng và index", href: "#/docs/pg-08" },
    ],
    items: [
      {
        id: "pg-w4-1",
        text: "Autovacuum: khi nào chạy, quản lý tải, giám sát",
        lesson: `**Mục tiêu.** Viết lại được công thức ngưỡng \`n_dead_tup > threshold + scale_factor × reltuples\` kích hoạt autovacuum, và đọc được view \`pg_stat_progress_vacuum\` để biết vacuum đang ở giai đoạn nào.

**Đọc.** [§6.5 Vacuum và analysis tự động (Automatic Vacuum and Analysis)](#/docs/pg-06) — đọc cơ chế \`autovacuum launcher\`/\`autovacuum worker\`, rồi hai công thức ngưỡng (dead tuple accumulation và row insertions) cùng bốn tham số \`autovacuum_vacuum_threshold\`/\`scale_factor\`/\`insert_threshold\`/\`insert_scale_factor\`. Gõ lại view \`need_vacuum\`/\`need_analyze\` của sách để tự thấy ngưỡng thực tế trên một bảng. [§6.6 Quản lý tải (Managing the Load)](#/docs/pg-06) cho cơ chế điều tiết bằng \`vacuum_cost_limit\`/\`vacuum_cost_delay\`. [§6.7 Giám sát (Monitoring)](#/docs/pg-06) cho \`pg_stat_progress_vacuum\` và log autovacuum.

**Bẫy.** Tính ngưỡng autovacuum bằng công thức chuẩn rồi ngạc nhiên khi số thực tế khác hẳn. Sách chỉ ra nếu \`pg_class.reltuples\` = -1 (bảng chưa từng được analyze), giá trị này được coi là 0 trong công thức, nên ngưỡng thực tế nhỏ hơn nhiều so với kỳ vọng. Bẫy thứ hai: nghĩ tăng \`autovacuum_max_workers\` luôn làm autovacuum nhanh hơn. Sách nói đơn vị công việc \`autovacuum_vacuum_cost_limit\` bị *chia sẻ* giữa các worker, nên chỉ tăng số worker mà không tăng cost limit thì tác động tổng thể lên hệ thống gần như không đổi.

**Tự kiểm tra.** Vì sao bảng TOAST không xuất hiện trong danh sách "cần analyze" dù vẫn có trong danh sách "cần vacuum"? \`pg_stat_progress_vacuum.phase\` = "vacuuming indexes" cho biết vacuum đang ở giai đoạn nào trong bốn giai đoạn đã học ở tuần 3?`,
      },
      {
        id: "pg-w4-2",
        text: "Wraparound, đóng băng tuple và quản lý freezing",
        lesson: `**Mục tiêu.** Giải thích được vì sao transaction ID 32-bit cần khái niệm "cũ hơn/trẻ hơn" thay vì "nhỏ hơn/lớn hơn", và xếp đúng thứ tự bốn tham số freezing theo tuổi transaction mà chúng kích hoạt.

**Đọc.** [§7.1 Wraparound của Transaction ID (Transaction ID Wraparound)](#/docs/pg-07) — đọc kỹ phép ẩn dụ mặt đồng hồ và vì sao so sánh XID phải dùng phép trừ 32-bit thay vì so sánh trực tiếp. [§7.2 Đóng băng tuple và quy tắc visibility (Tuple Freezing and Visibility Rules)](#/docs/pg-07) cho cách freeze biến \`xmin\` thành "âm vô cùng" bằng hint bit chứ không ghi đè XID. [§7.3 Quản lý freezing (Managing Freezing)](#/docs/pg-07) — đọc tuần tự bốn mục con: tuổi freezing tối thiểu, tuổi cho freezing tích cực, tuổi cho autovacuum cưỡng bức, tuổi cho freezing failsafe; gõ lại thí nghiệm giảm \`vacuum_freeze_min_age\` xuống 1 và quan sát \`relfrozenxid\`.

**Bẫy.** Nghĩ freeze xoá \`xmin\` khỏi tuple. Sách nói \`xmin\` vẫn giữ nguyên trên đĩa; thuộc tính freeze chỉ được xác định bởi tổ hợp hai hint bit \`committed\`+\`aborted\` cùng lúc. Bẫy thứ hai: đặt \`vacuum_freeze_min_age\` quá thấp để "an toàn". Sách cảnh báo điều này lãng phí công sức freeze các dòng "nóng" đang bị UPDATE liên tục — mỗi phiên bản mới lại phải freeze lại.

**Tự kiểm tra.** \`autovacuum_freeze_max_age\` khác \`vacuum_freeze_table_age\` ở điểm nào — cái nào cưỡng bức chạy autovacuum ngay cả khi nó đã bị tắt? Chế độ freezing failsafe *(v. 14)* bỏ qua tham số nào để freeze nhanh nhất có thể?`,
      },
      {
        id: "pg-w4-3",
        text: "VACUUM FULL, các cách rebuild khác và phòng ngừa",
        lesson: `**Mục tiêu.** Giải thích được vì sao VACUUM thông thường không thu hồi được không gian đĩa dù dọn hết dead tuple, và chọn được giữa VACUUM FULL, CLUSTER, pg_repack cho một tình huống bloat cụ thể.

**Đọc.** [§8.1 Full vacuum (Full Vacuuming)](#/docs/pg-08) — đọc kỹ vì sao VACUUM thường không giảm số page (chỉ heap truncation ở cuối file mới làm được), và gõ lại ví dụ \`pgstattuple\`/\`pgstatindex\` đo mật độ dữ liệu trước/sau \`VACUUM FULL\`. [§8.2 Các phương pháp xây dựng lại khác (Other Rebuilding Methods)](#/docs/pg-08) so sánh \`CLUSTER\`, \`REINDEX\`, \`TRUNCATE\`, và \`pg_repack\`/\`pgcompacttable\` cho rebuild gần như không downtime. [§8.3 Các biện pháp phòng ngừa (Precautions)](#/docs/pg-08) cho \`old_snapshot_threshold\`, \`idle_in_transaction_session_timeout\`, và kỹ thuật \`SELECT ... FOR UPDATE SKIP LOCKED\` để UPDATE theo batch.

**Bẫy.** Nghĩ VACUUM FULL chỉ tốn thời gian, không tốn thêm dung lượng đĩa. Sách nói khi xây dựng lại, cả file cũ lẫn file mới đều phải tồn tại đồng thời trên đĩa, nên thao tác này có thể đòi hỏi rất nhiều không gian trống. Bẫy thứ hai: nghĩ UPDATE toàn bộ bảng một lần rồi VACUUM sẽ không làm bảng phình to. Sách chứng minh bằng thí nghiệm: UPDATE hết mọi dòng trong một transaction làm bảng lớn gần gấp đôi, vì VACUUM không kịp can thiệp cho tới khi transaction commit.

**Tự kiểm tra.** VACUUM FULL và CLUSTER khác nhau ở điểm nào duy nhất? Kỹ thuật SELECT ... FOR UPDATE SKIP LOCKED giúp gì cho việc UPDATE hàng loạt mà không làm bảng phình to như UPDATE một lần?`,
      },
      {
        id: "pg-w4-4",
        text: "Ôn Phần I: vòng đời một row version",
        lesson: `**Mục tiêu.** Tự vẽ trên một trang giấy vòng đời đầy đủ của một row version: sinh ra bởi INSERT/UPDATE, được snapshot nào nhìn thấy, khi nào bị HOT-prune hay vacuum dọn, khi nào bị freeze, và khi nào bảng chứa nó cần rebuild.

**Đọc.** Lướt lại H2 của [Chương 2 — Isolation](#/docs/pg-02), [Chương 3 — Pages and Tuples](#/docs/pg-03), [Chương 4 — Snapshots](#/docs/pg-04), [Chương 5 — Page Pruning và HOT Updates](#/docs/pg-05), [Chương 6 — Vacuum và Autovacuum](#/docs/pg-06), [Chương 7 — Freezing](#/docs/pg-07) và [Chương 8 — Xây dựng lại bảng và index](#/docs/pg-08), chỉ đọc lại tiêu đề từng mục con để tự kiểm tra còn nhớ nội dung. Đối chiếu song song với [Transaction](#/docs/ddia-08) của DDIA: cùng đề tài isolation level và anomaly, nhưng nhìn từ góc độ đa hệ cơ sở dữ liệu, không riêng PostgreSQL.

**Bẫy.** Khi vẽ sơ đồ, quên rằng một row version có thể bị prune (đổi trạng thái pointer) rất lâu trước khi nó thực sự bị vacuum dọn khỏi index. Đây là hai bước tách biệt: page pruning chỉ hoạt động trong phạm vi một heap page, còn việc dọn index entry tương ứng chỉ xảy ra ở giai đoạn index vacuuming của VACUUM. Bẫy thứ hai: vẽ freezing như một bước xảy ra ngay khi transaction tạo dòng commit — freezing chỉ xảy ra nhiều sau đó, khi VACUUM xác định tuple đã nằm ngoài database horizon và đủ tuổi theo \`vacuum_freeze_min_age\`.

**Tự kiểm tra.** Trong sơ đồ bạn vừa vẽ, một dòng có thể bị HOT-prune mà không bao giờ được freeze không, vì sao? Một transaction Repeatable Read đang mở có thể chặn bước nào trong sơ đồ — prune, vacuum, hay freeze?`,
      },
    ],
  },
  {
    id: "pg-w5",
    week: "Tuần 5",
    title: "Buffer cache và WAL",
    goal: "Đọc được usage count và pin count của một buffer qua pg_buffercache, và giải thích được vì sao một mục WAL phải được ghi xuống đĩa trước page dữ liệu tương ứng.",
    practice: "Chạy CREATE EXTENSION pg_buffercache; xem buffer của một bảng sau một lần seq scan; so pg_current_wal_lsn() trước/sau một UPDATE để đo lượng WAL.",
    resources: [
      { label: "PG 09 — Buffer Cache", href: "#/docs/pg-09" },
      { label: "PG 10 — Write-Ahead Log", href: "#/docs/pg-10" },
      { label: "postgresql.org — pg_buffercache", href: "https://www.postgresql.org/docs/14/pgbuffercache.html" },
    ],
    items: [
      {
        id: "pg-w5-1",
        text: "Thiết kế buffer cache, cache hit và cache miss",
        lesson: `**Mục tiêu.** Giải thích được vì sao PostgreSQL chấp nhận double caching với hệ điều hành, và đọc được usage count/pin count của một buffer qua pg_buffercache trước và sau khi mở cursor.

**Đọc.** [§9.1 Caching (Bộ nhớ đệm)](#/docs/pg-09) cho lý do PostgreSQL không dùng direct I/O. [§9.2 Thiết kế buffer cache (Buffer Cache Design)](#/docs/pg-09) — đọc kỹ cấu trúc buffer header (vị trí vật lý, dirty flag, usage count, pin count) và ví dụ hàm \`buffercache\` tự định nghĩa bằng \`pg_buffercache\`. [§9.3 Cache hit (Cache Hits)](#/docs/pg-09) cho cơ chế hash table tìm buffer và ví dụ mở cursor để giữ pin. [§9.4 Cache miss (Cache Misses)](#/docs/pg-09) cho hai kịch bản chọn buffer (còn buffer trống / phải evict bằng clock sweep) và giới hạn usage count ở 5.

**Bẫy.** Nghĩ một cache miss trong PostgreSQL luôn kéo theo một lần đọc đĩa vật lý. Sách phân biệt rõ: cache miss chỉ có nghĩa là page không có trong buffer cache của PostgreSQL — nó vẫn có thể được phục vụ từ cache của hệ điều hành mà không chạm đĩa thật. Bẫy thứ hai: nghĩ buffer đang bị pin thì không thể sửa đổi. Sách nói pin chỉ ngăn *thay thế* page (eviction); một tuple mới vẫn có thể được thêm vào page đang bị pin.

**Tự kiểm tra.** Vì sao vacuum phải bỏ qua một page có buffer đang bị pin thay vì chờ, trong khi vacuum kèm freezing thì lại chờ? Thuật toán clock sweep chọn buffer nào để evict khi mọi buffer đều có usage count khác 0 nhưng đã quay hết một vòng?`,
      },
      {
        id: "pg-w5-2",
        text: "Bulk eviction, chọn kích thước, làm nóng cache, cache cục bộ",
        lesson: `**Mục tiêu.** Chọn đúng buffer ring strategy (bulk reads/bulk writes/vacuuming) cho một thao tác cụ thể, và giải thích được vì sao seq scan trên bảng lớn không đẩy sạch buffer cache.

**Đọc.** [§9.5 Eviction hàng loạt (Bulk Eviction)](#/docs/pg-09) — đọc ba chiến lược buffer ring (bulk reads 256kB cho seq scan bảng lớn, bulk writes 16MB cho COPY FROM/CREATE TABLE AS, vacuuming 256kB) và ví dụ bảng \`big\` hơn 4096 page cho thấy seq scan chỉ chiếm 32 buffer trong khi index scan lại nạp cả bảng vào cache. [§9.6 Chọn kích thước buffer cache (Choosing the Buffer Cache Size)](#/docs/pg-09) cho khuyến nghị bắt đầu ở 1/4 RAM và cách phân tích \`usagecount\`. [§9.7 Làm nóng cache (Cache Warming)](#/docs/pg-09) cho \`pg_prewarm\`/\`autoprewarm\`. Đọc lướt [§9.8 Cache cục bộ (Local Cache)](#/docs/pg-09) cho bảng tạm.

**Bẫy.** Nghĩ buffer ring luôn bảo vệ được buffer cache khỏi bị seq scan bảng lớn làm trôi dữ liệu nóng. Sách chỉ ra ngoại lệ: nếu UPDATE/DELETE tác động nhiều dòng trong lúc quét, các page liên tục bị sửa đổi khiến buffer ring gần như vô dụng. Bẫy thứ hai: cho rằng tăng \`shared_buffers\` càng lớn càng tốt. Sách nói cache lớn hơn kéo theo chi phí bảo trì cao hơn, và không có công thức kỳ diệu nào — phải thử nghiệm trên tải thực tế.

**Tự kiểm tra.** Vì sao đọc dữ liệu TOAST luôn "đi vòng qua" buffer ring dù khối lượng đọc có thể lớn? \`autoprewarm leader\` ghi và khôi phục danh sách page đã cache ở đâu, và nó dùng thông tin đó để làm gì sau khi server khởi động lại?`,
      },
      {
        id: "pg-w5-3",
        text: "Ghi nhật ký và cấu trúc WAL",
        lesson: `**Mục tiêu.** Giải thích được vì sao WAL phải được ghi trước page dữ liệu tương ứng, và tính được kích thước một mục WAL bằng phép trừ hai giá trị pg_lsn.

**Đọc.** [§10.1 Ghi nhật ký (Logging)](#/docs/pg-10) — đọc danh sách các hành động được/không được ghi WAL, và vì sao ghi WAL tuần tự rẻ hơn ghi ngẫu nhiên các page. [§10.2 Cấu trúc WAL (WAL Structure)](#/docs/pg-10) — đọc cấu trúc logic (header, resource manager, checksum) rồi cấu trúc vật lý (segment 16MB, tên file gồm timeline + LSN cao). Gõ lại chuỗi thí nghiệm \`pg_current_wal_insert_lsn()\` trước/sau UPDATE và COMMIT, rồi trừ hai giá trị \`pg_lsn\` để ra kích thước byte; thử \`pg_waldump\` để xem resource manager \`Heap\`/\`Transaction\`.

**Bẫy.** Nghĩ LSN lưu trong page header luôn bằng đúng giá trị chèn WAL mới nhất của hệ thống. Sách chỉ ra vì chỉ có một WAL cho toàn cluster, LSN trong một page cụ thể có thể *nhỏ hơn* giá trị \`pg_current_wal_insert_lsn()\` hiện tại — chúng chỉ bằng nhau khi không có hoạt động nào khác đang diễn ra. Bẫy thứ hai: nghĩ mọi thay đổi CLOG được ghi kèm LSN vào chính page CLOG như page dữ liệu thường. Sách nói LSN của mục WAL mới nhất cho page CLOG chỉ được theo dõi trong RAM, không nằm trong chính page.

**Tự kiểm tra.** Header của một mục WAL chứa những trường nào giúp resource manager biết cách phát lại nó? Vì sao trước PostgreSQL 10, mọi hàm liên quan WAL đều mang tên viết tắt XLOG?`,
      },
      {
        id: "pg-w5-4",
        text: "Checkpoint, khôi phục, ghi nền và thiết lập WAL",
        lesson: `**Mục tiêu.** Kể đúng ba giai đoạn của một checkpoint (start/execution/completion), và giải thích được vì sao recovery phải bắt đầu từ LSN redo của checkpoint hoàn tất gần nhất chứ không phải từ đầu WAL.

**Đọc.** [§10.3 Checkpoint](#/docs/pg-10) — đọc kỹ ba giai đoạn checkpoint và vai trò của thẻ (tag) đánh trên các dirty buffer tại thời điểm bắt đầu; gõ lại thí nghiệm \`CHECKPOINT\` thủ công rồi xem \`CHECKPOINT_ONLINE\`/redo LSN bằng \`pg_waldump\` và \`pg_controldata\`. [§10.4 Khôi phục (Recovery)](#/docs/pg-10) cho vai trò tiến trình \`startup\`, khái niệm full page image (FPI) idempotent, và vì sao PostgreSQL không cần giai đoạn roll-back riêng sau roll-forward. Đọc lướt [§10.5 Ghi nền (Background Writing)](#/docs/pg-10). [§10.6 Thiết lập WAL (WAL Setup)](#/docs/pg-10) cho cách ước lượng \`checkpoint_timeout\`/\`max_wal_size\` từ tốc độ sinh WAL thực tế và các trường trong \`pg_stat_bgwriter\`.

**Bẫy.** Nghĩ checkpoint "hoàn tất" ngay khi nó bắt đầu ghi xong các buffer đã đánh dấu. Sách phân biệt rõ: checkpoint chỉ được coi là hoàn tất sau khi *tất cả* buffer dirty tại thời điểm bắt đầu đã lên đĩa — và chỉ từ lúc đó, điểm bắt đầu của nó mới trở thành mốc mới cho recovery. Bẫy thứ hai: nghĩ đặt \`checkpoint_completion_target = 1\` là tối ưu vì "dùng hết thời gian cho phép". Sách khuyên tránh giá trị này vì checkpoint kế tiếp có thể đến hạn trước khi checkpoint hiện tại kịp hoàn tất.

**Tự kiểm tra.** Vì sao một full page image (FPI) có thể được áp dụng an toàn lên một page bất kể trạng thái LSN hiện tại của nó? Trong \`pg_stat_bgwriter\`, giá trị \`buffers_backend\` cao bất thường so với \`buffers_checkpoint\` + \`buffers_clean\` cho thấy điều gì cần điều chỉnh?`,
      },
    ],
  },
  {
    id: "pg-w6",
    week: "Tuần 6",
    title: "Các chế độ WAL",
    goal: "Chọn đúng giữa synchronous_commit on/off cho một loại transaction cụ thể dựa trên đánh đổi độ trễ–độ bền, và chọn đúng wal_level tối thiểu cần cho một mục tiêu vận hành (recovery/replication/logical decoding).",
    practice: "Chạy pg_waldump trên segment WAL vừa sinh; so thời gian một vòng INSERT với synchronous_commit = on và off.",
    resources: [
      { label: "PG 11 — Các chế độ WAL", href: "#/docs/pg-11" },
      { label: "postgresql.org — Reliability and the Write-Ahead Log", href: "https://www.postgresql.org/docs/14/wal-reliability.html" },
    ],
    items: [
      {
        id: "pg-w6-1",
        text: "Hiệu năng ghi WAL",
        lesson: `**Mục tiêu.** Giải thích được vì sao commit bất đồng bộ nhanh hơn commit đồng bộ và cái giá phải trả là gì, đo được chênh lệch TPS giữa hai chế độ bằng pgbench.

**Đọc.** [§11.1 Hiệu năng (Performance)](#/docs/pg-11) — đọc kỹ định nghĩa chế độ đồng bộ (commit chờ WAL entry lên đĩa) và bất đồng bộ (walwriter ghi nền theo \`wal_writer_delay\`), cùng vai trò \`commit_delay\`/\`commit_siblings\` (ẩn dụ "giữ cửa thang máy"). Gõ lại thí nghiệm \`pgbench -T 30\` ở \`synchronous_commit = on\` rồi \`off\` và so \`tps\`/\`latency average\`.

**Bẫy.** Nghĩ \`synchronous_commit = off\` tương đương tắt \`fsync\`. Sách phân biệt rõ hai khái niệm: commit bất đồng bộ vẫn đảm bảo khôi phục về một trạng thái *nhất quán* sau sự cố, chỉ có nguy cơ mất các commit gần nhất (tối đa khoảng \`3 × wal_writer_delay\`); còn tắt \`fsync\` thì mất luôn tính nhất quán khi có sự cố. Bẫy thứ hai: nghĩ \`synchronous_commit\` chỉ đặt được ở mức toàn hệ thống. Sách nói tham số này có thể đặt riêng cho từng transaction, cho phép transaction quan trọng dùng đồng bộ còn transaction ít quan trọng dùng bất đồng bộ.

**Tự kiểm tra.** Ở chế độ đồng bộ, backend phải chờ điều gì trước khi lệnh COMMIT trả quyền điều khiển? Nếu sự cố xảy ra ở chế độ bất đồng bộ, tối đa có thể mất bao nhiêu giây dữ liệu đã commit theo công thức của sách?`,
      },
      {
        id: "pg-w6-2",
        text: "Khả năng chịu lỗi",
        lesson: `**Mục tiêu.** Kể được ba nguồn gây mất tính nhất quán mà WAL phải chống lại (caching nhiều tầng, hỏng dữ liệu, ghi không nguyên tử), và giải thích được vai trò của full page image sau mỗi checkpoint.

**Đọc.** [§11.2 Khả năng chịu lỗi (Fault Tolerance)](#/docs/pg-11) — đọc lần lượt ba mục con Caching (fsync/fdatasync, vì sao WAL entry phải được lưu tin cậy ngay lập tức kể cả ở chế độ bất đồng bộ), Hỏng dữ liệu (Data Corruption — checksum page, ba giới hạn của nó, thí nghiệm ghi đè số 0 vào page rồi thấy lỗi "page verification failed"), và Ghi không nguyên tử (Non-Atomic Writes — full page image sau lần sửa đổi đầu tiên kể từ checkpoint, \`full_page_writes\`, \`wal_compression\`). Gõ lại thí nghiệm \`pg_waldump --stats\` để thấy tỷ lệ FPI trong tổng WAL.

**Bẫy.** Nghĩ bật checksum sẽ bắt được mọi kiểu hỏng dữ liệu ngay lập tức. Sách nêu rõ ba giới hạn: checksum chỉ được kiểm khi page được truy cập (nên hỏng dữ liệu có thể âm thầm lan vào backup), một page toàn số 0 vẫn được coi là hợp lệ, và checksum chỉ bảo vệ main fork chứ không bảo vệ CLOG hay các fork khác. Bẫy thứ hai: nghĩ tắt \`full_page_writes\` chỉ làm giảm dung lượng WAL mà không có rủi ro gì khác. Sách cảnh báo việc này có thể dẫn đến hỏng dữ liệu nghiêm trọng vì recovery không còn cách xử lý an toàn các page bị ghi một phần (torn page).

**Tự kiểm tra.** Vì sao FPI có thể được áp dụng "vô điều kiện" trong lúc recovery mà không cần so sánh LSN, khác với một mục WAL thông thường? Bật \`wal_compression\` giải quyết vấn đề gì mà thí nghiệm \`pg_waldump --stats\` trong sách cho thấy rõ?`,
      },
      {
        id: "pg-w6-3",
        text: "Các mức WAL và lab đọc WAL",
        lesson: `**Mục tiêu.** Chọn đúng wal_level (minimal/replica/logical) cho một mục tiêu vận hành cụ thể, và đọc được output của pg_waldump để phân biệt một entry ghi log INSERT thường với một entry bị bỏ qua ở mức minimal.

**Đọc.** [§11.3 Các mức WAL (WAL Levels)](#/docs/pg-11) — đọc tuần tự Minimal (tối ưu hoá bỏ ghi log khi tạo/truncate bảng trong cùng transaction, ngưỡng \`wal_skip_threshold\`), Replica (thêm thông tin lock và transaction đang chạy cho replication, mức mặc định), Logical (thêm replication origin cho logical decoding). Gõ lại ba thí nghiệm \`pg_waldump\` của sách ở ba mức để tự so sánh số lượng và loại entry.

**Bẫy.** Nghĩ mức \`minimal\` luôn ghi ít WAL hơn hẳn \`replica\` trong mọi trường hợp. Sách chỉ ra khác biệt chỉ đáng kể với các thao tác chèn khối lượng lớn vào bảng vừa tạo/truncate trong cùng transaction (như \`CREATE TABLE AS SELECT\`); với INSERT/UPDATE thông thường, hai mức ghi gần như cùng lượng dữ liệu. Bẫy thứ hai: chọn \`wal_level = minimal\` mà quên rằng nó không tương thích với replication. Sách nói nếu chọn mức này, bạn *bắt buộc* phải đặt \`max_wal_senders = 0\`, tức từ bỏ hoàn toàn khả năng có replica.

**Tự kiểm tra.** Ở mức \`replica\`, entry loại \`RUNNING_XACTS\` được ghi định kỳ để phục vụ mục đích gì trên replica? Muốn dùng logical replication, \`wal_level\` tối thiểu phải đặt là gì, và nó bao gồm thêm loại entry nào so với \`replica\`?`,
      },
      {
        id: "pg-w6-4",
        text: "Ôn Phần II: từ UPDATE tới trang trên đĩa",
        lesson: `**Mục tiêu.** Tự vẽ trên một trang giấy đường đi đầy đủ của một UPDATE: sửa page trong buffer cache, ghi WAL entry trước, commit, rồi checkpoint đưa dirty page xuống đĩa — và tình huống recovery cần dùng lại WAL ở đâu trong sơ đồ đó.

**Đọc.** Lướt lại H2 của [Chương 9 — Buffer Cache](#/docs/pg-09), [Chương 10 — Write-Ahead Log](#/docs/pg-10) và [Chương 11 — Các chế độ WAL](#/docs/pg-11), chỉ đọc lại tiêu đề từng mục con để tự kiểm tra còn nhớ nội dung. Đối chiếu song song với [Lưu trữ và Truy xuất](#/docs/ddia-04) của DDIA: cùng đề tài ghi log tuần tự đứng trước cấu trúc dữ liệu chính (LSM-tree so với B-tree), nhưng WAL của PostgreSQL phục vụ recovery chứ không phải bản thân cấu trúc lưu trữ.

**Bẫy.** Khi vẽ sơ đồ, đặt bước "ghi page xuống đĩa" trước bước "ghi WAL entry xuống đĩa". Toàn bộ chương 10–11 dựa trên thứ tự ngược lại: WAL entry *phải* xuống đĩa trước page dữ liệu tương ứng, đó chính là ý nghĩa của "ghi trước" (write-ahead). Bẫy thứ hai: vẽ checkpoint như một sự kiện tức thời. Checkpoint trải dài theo thời gian (execution phase ghi lần lượt các dirty buffer đã đánh dấu), và chỉ khi ghi xong hết mới coi là hoàn tất.

**Tự kiểm tra.** Trong sơ đồ của bạn, nếu sự cố xảy ra ngay sau COMMIT nhưng trước khi checkpoint tiếp theo chạy, dữ liệu được khôi phục bằng cách nào? Vì sao PostgreSQL cần lưu cả LSN "bắt đầu" lẫn LSN "hoàn tất" của một checkpoint thay vì chỉ một mốc duy nhất?`,
      },
    ],
  },
];
