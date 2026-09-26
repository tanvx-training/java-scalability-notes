# Chương 11. Các chế độ WAL (WAL Modes)

## 11.1 Hiệu năng (Performance)

Khi server hoạt động bình thường, các file WAL liên tục được ghi xuống đĩa. Tuy nhiên, các thao tác ghi này là tuần tự: hầu như không có truy cập ngẫu nhiên, vì vậy ngay cả ổ HDD cũng có thể đáp ứng được. Do kiểu tải này rất khác với việc truy cập file dữ liệu thông thường, có thể đáng để thiết lập một thiết bị lưu trữ vật lý riêng cho các file WAL và thay thư mục `PGDATA/pg_wal` bằng một symbolic link trỏ tới một thư mục trong một hệ thống file được mount.

> Có một vài tình huống mà các file WAL vừa phải được ghi vừa phải được đọc. Tình huống thứ nhất là trường hợp hiển nhiên của khôi phục sau sự cố (crash recovery); tình huống thứ hai là stream replication. Tiến trình walsender[^1] đọc các WAL entry (bản ghi WAL) trực tiếp từ file.[^2] Vì vậy, nếu một replica không nhận các WAL entry trong khi các page cần thiết vẫn còn nằm trong buffer của hệ điều hành trên server chính, dữ liệu sẽ phải được đọc từ đĩa. Nhưng việc truy cập vẫn sẽ là tuần tự chứ không phải ngẫu nhiên.

Các WAL entry có thể được ghi theo một trong các chế độ sau:

- Chế độ đồng bộ (synchronous) cấm mọi thao tác tiếp theo cho đến khi việc commit transaction lưu tất cả các WAL entry liên quan xuống đĩa.

- Chế độ bất đồng bộ (asynchronous) cho phép commit transaction ngay lập tức, còn các WAL entry sẽ được ghi xuống đĩa sau đó ở chế độ nền.

Chế độ hiện tại được xác định bởi tham số *synchronous_commit*. *(mặc định: on)*

**Chế độ đồng bộ.** Để ghi nhận một cách tin cậy việc commit, chỉ chuyển các WAL entry cho hệ điều hành là chưa đủ; bạn phải đảm bảo rằng việc đồng bộ đĩa đã hoàn tất thành công. Vì đồng bộ hoá kéo theo các thao tác I/O thực sự (vốn khá chậm), nên thực hiện nó càng ít lần càng tốt thì càng có lợi.

Vì mục đích này, backend hoàn tất transaction và ghi các WAL entry xuống đĩa có thể tạm dừng một khoảng ngắn theo giá trị của tham số *commit_delay*. Tuy nhiên, *(mặc định: 0s 5)* điều này chỉ xảy ra nếu có ít nhất *commit_siblings* transaction đang hoạt động trong hệ thống:[^3] trong khoảng tạm dừng này, một số transaction trong số đó có thể kết thúc, và server sẽ kịp đồng bộ tất cả các WAL entry trong một lần. Điều này rất giống việc giữ cửa thang máy chờ ai đó chạy vào kịp.

Theo mặc định, không có khoảng tạm dừng nào. Chỉ nên thay đổi tham số *commit_delay* đối với những hệ thống thực hiện rất nhiều transaction OLTP ngắn.

Sau khoảng tạm dừng (nếu có), tiến trình hoàn tất transaction sẽ flush tất cả các WAL entry đã tích luỹ xuống đĩa và thực hiện đồng bộ hoá (điều quan trọng là phải lưu entry commit và tất cả các entry trước đó liên quan đến transaction này; phần còn lại được ghi chỉ vì làm vậy không làm tăng chi phí).

Kể từ thời điểm này, yêu cầu về tính bền vững (durability) của ACID được đảm bảo — transaction được coi là đã commit một cách tin cậy.[^4] Đó là lý do chế độ đồng bộ là chế độ mặc định.

Nhược điểm của commit đồng bộ là độ trễ lớn hơn (lệnh `COMMIT` không trả lại quyền điều khiển cho đến khi kết thúc đồng bộ hoá) và thông lượng hệ thống thấp hơn, đặc biệt với tải OLTP.

**Chế độ bất đồng bộ.** Bạn phải tắt tham số *synchronous_commit* để bật commit bất đồng bộ.[^5]

Ở chế độ bất đồng bộ, các WAL entry được ghi xuống đĩa bởi tiến trình `walwriter`[^6], tiến trình này luân phiên giữa làm việc và ngủ. Độ dài các khoảng tạm dừng được xác định bởi giá trị *wal_writer_delay*. *(mặc định: 200ms)*

Khi thức dậy sau một khoảng tạm dừng, tiến trình kiểm tra cache xem có các WAL page mới đã *được lấp đầy hoàn toàn* hay không. Nếu có các page như vậy, tiến trình sẽ ghi chúng xuống đĩa, bỏ qua page hiện tại. Nếu không, nó sẽ ghi page hiện tại đang đầy một nửa, vì dù sao nó cũng đã thức dậy rồi.[^7]

Mục đích của thuật toán này là tránh flush cùng một page nhiều lần, điều mang lại lợi ích hiệu năng đáng kể cho các workload có nhiều thay đổi dữ liệu.

Mặc dù WAL cache được sử dụng như một ring buffer (bộ đệm vòng), `walwriter` dừng lại khi tới page cuối cùng của cache; sau một khoảng tạm dừng, chu kỳ ghi tiếp theo bắt đầu từ page đầu tiên. Vì vậy, trong trường hợp xấu nhất `walwriter` cần ba lượt chạy để tới được một WAL entry cụ thể: đầu tiên, nó sẽ ghi tất cả các page đầy nằm ở cuối cache, sau đó quay lại đầu cache, và cuối cùng xử lý page chưa đầy chứa entry đó. Nhưng trong hầu hết các trường hợp chỉ cần một hoặc hai chu kỳ.

Việc đồng bộ hoá được thực hiện mỗi khi đã ghi được một lượng dữ liệu bằng *wal_writer_flush_after* *(mặc định: 1MB)*, và một lần nữa khi kết thúc chu kỳ ghi.

Commit bất đồng bộ nhanh hơn commit đồng bộ vì chúng không phải chờ việc ghi vật lý xuống đĩa. Nhưng độ tin cậy bị ảnh hưởng: bạn có thể mất dữ liệu đã commit trong khoảng thời gian 3 × *wal_writer_delay* trước khi xảy ra sự cố (mặc định là 0.6 giây).

Trong thực tế, hai chế độ này bổ sung cho nhau. Ở chế độ đồng bộ, các WAL entry liên quan đến một transaction dài vẫn có thể được ghi bất đồng bộ để giải phóng các WAL buffer. Và ngược lại, một WAL entry liên quan đến một page sắp bị evict khỏi buffer cache sẽ được flush xuống đĩa ngay lập tức ngay cả ở chế độ bất đồng bộ — nếu không thì không thể tiếp tục hoạt động.

Trong hầu hết các trường hợp, người thiết kế hệ thống phải đưa ra một lựa chọn khó khăn giữa hiệu năng và tính bền vững.

Tham số *synchronous_commit* cũng có thể được đặt cho từng transaction cụ thể. Nếu có thể phân loại tất cả các transaction ở mức ứng dụng thành loại cực kỳ quan trọng (chẳng hạn xử lý dữ liệu tài chính) hoặc loại ít quan trọng hơn, bạn có thể tăng hiệu năng trong khi chỉ chấp nhận rủi ro mất các transaction không quan trọng.

Để có chút khái niệm về lợi ích hiệu năng tiềm năng của commit bất đồng bộ, hãy so sánh độ trễ và thông lượng ở hai chế độ bằng một bài kiểm tra `pgbench`.[^8]

Đầu tiên, khởi tạo các bảng cần thiết:

```
postgres$ /usr/local/pgsql/bin/pgbench -i internals
```

Chạy bài kiểm tra 30 giây ở chế độ đồng bộ:

```
postgres$ /usr/local/pgsql/bin/pgbench -T 30 internals
```

```
pgbench (14.7)
starting vacuum...end.
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 1
query mode: simple
number of clients: 1
number of threads: 1
duration: 30 s
number of transactions actually processed: 20123
latency average = 1.491 ms
initial connection time = 2.507 ms
tps = 670.809688 (without initial connection time)
```

Và bây giờ chạy cùng bài kiểm tra đó ở chế độ bất đồng bộ:

```
=> ALTER SYSTEM SET synchronous_commit = off;
=> SELECT pg_reload_conf();
postgres$ /usr/local/pgsql/bin/pgbench -T 30 internals
pgbench (14.7)
starting vacuum...end.
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 1
query mode: simple
number of clients: 1
number of threads: 1
duration: 30 s
number of transactions actually processed: 61809
latency average = 0.485 ms
initial connection time = 1.915 ms
tps = 2060.399861 (without initial connection time)
```

Ở chế độ bất đồng bộ, benchmark đơn giản này cho thấy độ trễ thấp hơn đáng kể và thông lượng (TPS) cao hơn. Đương nhiên, mỗi hệ thống cụ thể sẽ có các con số riêng tuỳ thuộc vào tải hiện tại, nhưng rõ ràng tác động lên các transaction OLTP ngắn có thể khá rõ rệt.

Hãy khôi phục lại các thiết lập mặc định:

```
=> ALTER SYSTEM RESET synchronous_commit;
=> SELECT pg_reload_conf();
```

## 11.2 Khả năng chịu lỗi (Fault Tolerance)

Hiển nhiên là write-ahead logging phải đảm bảo khôi phục sau sự cố trong mọi hoàn cảnh (trừ khi chính thiết bị lưu trữ bền vững bị hỏng). Có nhiều yếu tố có thể ảnh hưởng đến tính nhất quán của dữ liệu, nhưng tôi sẽ chỉ đề cập đến những yếu tố quan trọng nhất: caching, hỏng dữ liệu (data corruption) và ghi không nguyên tử (non-atomic writes).[^9]

### Caching

Trước khi tới được một thiết bị lưu trữ không mất dữ liệu khi mất điện (non-volatile storage, chẳng hạn ổ cứng), dữ liệu có thể đi qua nhiều lớp cache khác nhau.

Một thao tác ghi đĩa đơn giản chỉ yêu cầu hệ điều hành đặt dữ liệu vào cache của nó (vốn cũng dễ bị mất khi có sự cố, giống như mọi phần khác của RAM). Việc ghi thực sự được thực hiện bất đồng bộ, theo các thiết lập của bộ lập lịch I/O (I/O scheduler) của hệ điều hành.

Khi bộ lập lịch quyết định flush dữ liệu đã tích luỹ, dữ liệu này được chuyển vào cache của thiết bị lưu trữ (như HDD). Các thiết bị lưu trữ cũng có thể trì hoãn việc ghi, chẳng hạn để gộp các page liền kề lại với nhau. Một RAID controller bổ sung thêm một tầng cache nữa giữa đĩa và hệ điều hành.

Nếu không có biện pháp đặc biệt, thời điểm dữ liệu được lưu tin cậy trên đĩa vẫn là không xác định. Điều này thường không quá quan trọng vì chúng ta có WAL, nhưng bản thân các WAL entry phải được lưu tin cậy xuống đĩa ngay lập tức.[^10] Điều này cũng đúng với chế độ bất đồng bộ — nếu không, không thể đảm bảo rằng các WAL entry được ghi xuống đĩa trước dữ liệu đã bị sửa đổi.

Tiến trình `checkpointer` cũng phải lưu dữ liệu một cách tin cậy, đảm bảo các dirty page được đưa từ cache của hệ điều hành xuống đĩa. Ngoài ra, nó phải đồng bộ hoá tất cả các thao tác file đã được thực hiện bởi các tiến trình khác (chẳng hạn ghi page hoặc xoá file): khi checkpoint hoàn tất, kết quả của tất cả các hành động này phải đã được lưu trên đĩa.[^11]

Cũng có một số tình huống khác đòi hỏi việc ghi an toàn trước sự cố, chẳng hạn thực thi các thao tác không được ghi log (unlogged) ở WAL level `minimal`.

Các hệ điều hành cung cấp nhiều cách khác nhau để đảm bảo dữ liệu được ghi ngay vào thiết bị lưu trữ non-volatile. Tất cả đều quy về hai cách tiếp cận chính sau: hoặc gọi một lệnh đồng bộ hoá riêng sau khi ghi (như `fsync` hoặc `fdatasync`), hoặc chỉ định yêu cầu thực hiện đồng bộ hoá (hoặc thậm chí ghi trực tiếp bỏ qua cache của hệ điều hành) khi mở file hoặc khi ghi vào file.

Tiện ích `pg_test_fsync` có thể giúp bạn xác định cách tốt nhất để đồng bộ WAL tuỳ theo hệ điều hành và hệ thống file cụ thể; phương pháp được ưu tiên có thể được chỉ định trong tham số *wal_sync_method*. Với các thao tác khác, một phương pháp đồng bộ hoá phù hợp được chọn tự động và không thể cấu hình.[^12]

Một khía cạnh tinh tế ở đây là trong từng trường hợp cụ thể, phương pháp phù hợp nhất phụ thuộc vào phần cứng. Ví dụ, nếu bạn dùng một controller có pin dự phòng, bạn có thể tận dụng cache của nó, vì pin sẽ bảo vệ dữ liệu trong trường hợp mất điện.

Bạn nên nhớ rằng commit bất đồng bộ và việc không đồng bộ hoá là hai chuyện hoàn toàn khác nhau. Tắt đồng bộ hoá (bằng tham số *fsync*) giúp tăng *(mặc định: on)* hiệu năng hệ thống, nhưng bất kỳ sự cố nào cũng sẽ dẫn đến mất dữ liệu nghiêm trọng. Chế độ bất đồng bộ đảm bảo khôi phục sau sự cố về một trạng thái nhất quán, nhưng một số cập nhật dữ liệu mới nhất có thể bị mất.

### Hỏng dữ liệu (Data Corruption)

Thiết bị kỹ thuật không hoàn hảo, và dữ liệu có thể bị hỏng cả trong bộ nhớ lẫn trên đĩa, hoặc trong khi được truyền qua các cáp giao tiếp. Những lỗi như vậy thường được xử lý ở mức phần cứng, nhưng vẫn có một số lỗi lọt qua.

Để phát hiện sự cố kịp thời, PostgreSQL luôn bảo vệ các WAL entry bằng checksum.

Checksum cũng có thể được tính cho các page dữ liệu.[^13] Việc này được thực hiện hoặc khi khởi tạo cluster, hoặc bằng cách chạy tiện ích `pg_checksums`[^14] khi server đã dừng.[^15] *(v. 12)*

Trong các hệ thống production, checksum luôn phải được bật, bất chấp một chút chi phí phụ trội (nhỏ) cho việc tính toán và kiểm tra. Nó làm tăng khả năng phát hiện hỏng dữ liệu kịp thời, mặc dù vẫn còn một số trường hợp đặc biệt:

- Việc kiểm tra checksum chỉ được thực hiện khi page được truy cập, vì vậy hỏng dữ liệu có thể không bị phát hiện trong một thời gian dài, cho đến khi nó đã lọt vào tất cả các bản backup và không còn nguồn dữ liệu đúng nào.

- Một page toàn số không được coi là đúng, vì vậy nếu hệ thống file vô tình ghi toàn số không vào một page, vấn đề này sẽ không bị phát hiện.

- Checksum chỉ được tính cho main fork của các relation; các fork và file khác (chẳng hạn trạng thái transaction trong CLOG) vẫn không được bảo vệ.

Hãy xem tham số chỉ đọc *data_checksums* để chắc chắn rằng checksum đã được bật:

```
=> SHOW data_checksums;
 data_checksums
----------------
 on
(1 row)
```

Bây giờ dừng server và ghi đè số không lên vài byte trong page số không (zero page) của main fork của bảng:

```
=> SELECT pg_relation_filepath('wal');
 pg_relation_filepath
----------------------
 base/16391/16562
(1 row)
postgres$ pg_ctl stop
postgres$ dd if=/dev/zero of=/usr/local/pgsql/data/base/16391/16562 \
oflag=dsync conv=notrunc bs=1 count=8
8+0 records in
8+0 records out
8 bytes copied, 0,00776573 s, 1,0 kB/s
```

Khởi động lại server:

```
postgres$ pg_ctl start -l /home/postgres/logfile
```

Thực ra, chúng ta có thể để server tiếp tục chạy — chỉ cần ghi page xuống đĩa và evict nó khỏi cache là đủ (nếu không, server sẽ tiếp tục dùng phiên bản trong cache của nó). Nhưng quy trình như vậy khó tái hiện hơn.

Bây giờ hãy thử đọc bảng:

```
=> SELECT * FROM wal LIMIT 1;
WARNING:  page verification failed, calculated checksum 20397 but
expected 28733
ERROR:  invalid page in block 0 of relation base/16391/16562
```

Nếu không thể khôi phục dữ liệu từ bản backup, ít nhất cũng nên thử đọc page bị hỏng (chấp nhận rủi ro nhận được kết quả bị sai lệch). Để làm việc này, bạn phải bật tham số *ignore_checksum_failure*: *(mặc định: off)*

```
=> SET ignore_checksum_failure = on;
=> SELECT * FROM wal LIMIT 1;
WARNING:  page verification failed, calculated checksum 20397 but
expected 28733
```

```
 id
----
  2
(1 row)
```

Mọi thứ đều ổn trong trường hợp này vì chúng ta đã làm hỏng một phần không quan trọng của page header (LSN của WAL entry mới nhất), chứ không phải bản thân dữ liệu.

### Ghi không nguyên tử (Non-Atomic Writes)

Một page của cơ sở dữ liệu thường chiếm 8 kB, nhưng ở mức thấp, việc ghi được thực hiện theo các block, thường nhỏ hơn (điển hình là 512 byte hoặc 4 kB). Do đó, nếu xảy ra sự cố, một page có thể chỉ được ghi một phần. Việc áp dụng các WAL entry thông thường lên một page như vậy trong quá trình khôi phục là vô nghĩa.

Để tránh ghi một phần, PostgreSQL lưu một ảnh toàn trang (full page image, FPI) vào WAL khi page này được sửa đổi lần đầu tiên sau khi checkpoint bắt đầu *[→ tr. 174](10-write-ahead-log.md)*. Hành vi này được điều khiển bởi tham số *full_page_writes*, nhưng tắt nó có thể dẫn đến hỏng dữ liệu nghiêm trọng. *(mặc định: on)*

Nếu tiến trình khôi phục gặp một FPI trong WAL, nó sẽ ghi FPI đó xuống đĩa một cách vô điều kiện (không kiểm tra LSN của nó); giống như mọi WAL entry khác, FPI được bảo vệ bằng checksum, vì vậy việc chúng bị hỏng không thể không bị phát hiện. Sau đó các WAL entry thông thường sẽ được áp dụng lên trạng thái này, vốn được đảm bảo là đúng.

Không có loại WAL entry riêng cho việc đặt hint bit: thao tác này được coi là không quan trọng *[→ tr. 71](03-pages-and-tuples.md)* vì bất kỳ truy vấn nào truy cập một page cũng sẽ đặt lại các bit cần thiết. Tuy nhiên, mọi thay đổi hint bit đều ảnh hưởng đến checksum của page. Vì vậy nếu checksum được bật (hoặc nếu tham số *wal_log_hints* được bật), các thay đổi hint bit sẽ được ghi log dưới dạng FPI.[^16] *(mặc định: off)*

Mặc dù cơ chế ghi log loại trừ không gian trống khỏi FPI,[^17] kích thước của các file WAL được tạo ra vẫn tăng đáng kể. Tình hình có thể được cải thiện rất nhiều nếu bạn bật nén FPI thông qua tham số *wal_compression*. *(mặc định: off)*

Hãy chạy một thí nghiệm đơn giản bằng tiện ích `pgbench`. Chúng ta sẽ thực hiện một checkpoint và ngay lập tức bắt đầu một bài benchmark với số lượng transaction cố định:

```
=> CHECKPOINT;
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/42CE5DA8
(1 row)
```

```
postgres$ /usr/local/pgsql/bin/pgbench -t 20000 internals
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/449113E0
(1 row)
```

Đây là kích thước của các WAL entry đã được tạo ra:

```
=> SELECT pg_size_pretty('0/449755C0'::pg_lsn - '0/42CE5DA8'::pg_lsn);
 pg_size_pretty
----------------
 29 MB
(1 row)
```

Trong ví dụ này, FPI chiếm hơn một nửa tổng kích thước WAL. Bạn có thể tự kiểm chứng điều đó trong thống kê thu thập được, cho biết số lượng WAL entry (`N`), kích thước các entry thông thường (`Record size`), và kích thước FPI cho từng loại tài nguyên (`Type`):

```
postgres$ /usr/local/pgsql/bin/pg_waldump --stats \
-p /usr/local/pgsql/data/pg_wal -s 0/42CE5DA8 -e 0/449755C0
Type            N      (%)  Record size      (%)   FPI size      (%)
----            -      ---  -----------      ---   --------      ---
XLOG         4294 (  3,31)       210406 (  2,50)   19820068 ( 93,78)
Transaction 20004 ( 15,41)       680536 (  8,10)          0 (  0,00)
Storage         1 (  0,00)           42 (  0,00)          0 (  0,00)
CLOG            1 (  0,00)           30 (  0,00)          0 (  0,00)
Standby         6 (  0,00)          416 (  0,00)          0 (  0,00)
Heap2       24774 ( 19,09)      1536253 ( 18,27)      24576 (  0,12)
Heap        80234 ( 61,81)      5946242 ( 70,73)     295664 (  1,40)
Btree         494 (  0,38)        32747 (  0,39)     993860 (  4,70)
           ------              --------            --------
Total      129808               8406672 [28,46%]   21134168 [71,54%]
```

Tỷ lệ này sẽ nhỏ hơn nếu các page dữ liệu bị sửa đổi nhiều lần giữa các checkpoint. Đây lại là một lý do nữa để thực hiện checkpoint thưa hơn.

Chúng ta sẽ lặp lại cùng thí nghiệm để xem liệu việc nén có giúp ích hay không.

```
=> ALTER SYSTEM SET wal_compression = on;
=> SELECT pg_reload_conf();
=> CHECKPOINT;
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/44D4C228
(1 row)
```

```
postgres$ /usr/local/pgsql/bin/pgbench -t 20000 internals
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/457653B0
(1 row)
```

Đây là kích thước WAL khi bật nén:

```
=> SELECT pg_size_pretty('0/457653B0'::pg_lsn - '0/44D4C228'::pg_lsn);
 pg_size_pretty
----------------
 10 MB
(1 row)
postgres$ /usr/local/pgsql/bin/pg_waldump --stats \
-p /usr/local/pgsql/data/pg_wal -s 0/44D4C228 -e 0/457653B0
Type            N      (%)  Record size      (%)   FPI size      (%)
----            -      ---  -----------      ---   --------      ---
XLOG          344 (  0,29)        17530 (  0,22)     435492 ( 17,75)
Transaction 20001 ( 16,73)       680114 (  8,68)          0 (  0,00)
Storage         1 (  0,00)           42 (  0,00)          0 (  0,00)
Standby         5 (  0,00)          330 (  0,00)          0 (  0,00)
Heap2       18946 ( 15,84)      1207425 ( 15,42)     101601 (  4,14)
Heap        80141 ( 67,02)      5918020 ( 75,56)    1627008 ( 66,31)
Btree         143 (  0,12)         8443 (  0,11)     289654 ( 11,80)
           ------              --------            --------
Total      119581               7831904 [76,14%]    2453755 [23,86%]
```

Tóm lại, khi có một lượng lớn FPI do bật checksum hoặc *full_page_writes* (tức là hầu như luôn luôn), nên sử dụng nén bất chấp một chút chi phí phụ trội về CPU.

## 11.3 Các mức WAL (WAL Levels)

Mục tiêu chính của write-ahead logging là cho phép khôi phục sau sự cố. Nhưng nếu bạn mở rộng phạm vi thông tin được ghi log, WAL cũng có thể được dùng cho các mục đích khác. PostgreSQL cung cấp các mức ghi log `minimal`, `replica` và `logical`. Mỗi mức bao gồm mọi thứ được ghi log ở mức trước đó và bổ sung thêm một số thông tin.

Mức đang dùng được xác định bởi tham số *wal_level*; việc thay đổi nó đòi hỏi phải khởi động lại server. *(mặc định: replica)*

### Minimal

Mức `minimal` chỉ đảm bảo khôi phục sau sự cố. Để tiết kiệm không gian, các thao tác trên những relation đã được tạo hoặc truncate trong transaction hiện tại sẽ không được ghi log nếu chúng kéo theo việc chèn khối lượng lớn dữ liệu (như trong trường hợp các lệnh `CREATE TABLE AS SELECT` và `CREATE INDEX`).[^18] Thay vì được ghi log, tất cả dữ liệu cần thiết được flush ngay xuống đĩa, và các thay đổi trong system catalog trở nên visible ngay sau khi transaction commit.

Nếu một thao tác như vậy bị gián đoạn do sự cố, dữ liệu đã được ghi xuống đĩa vẫn invisible và không ảnh hưởng đến tính nhất quán. Nếu sự cố xảy ra khi thao tác đã hoàn tất, tất cả dữ liệu cần thiết để áp dụng các WAL entry tiếp theo đều đã được lưu xuống đĩa.

Khối lượng dữ liệu phải được ghi vào một relation mới tạo để tối ưu hoá này *(v. 13)* có hiệu lực được xác định bởi tham số *wal_skip_threshold*. *(mặc định: 2MB)*

Hãy xem những gì được ghi log ở mức `minimal`.

Theo mặc định, mức `replica` cao hơn được sử dụng, mức này hỗ trợ sao chép dữ liệu (replication). Nếu bạn chọn *(v. 10)* mức `minimal`, bạn cũng phải đặt số lượng tiến trình `walsender` được phép bằng không trong tham số *max_wal_senders*: *(mặc định: 10)*

```
=> ALTER SYSTEM SET wal_level = minimal;
=> ALTER SYSTEM SET max_wal_senders = 0;
```

Server phải được khởi động lại để các thay đổi này có hiệu lực:

```
postgres$ pg_ctl restart -l /home/postgres/logfile
```

Ghi lại vị trí WAL hiện tại:

```
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/45767698
(1 row)
```

Truncate bảng và liên tục chèn các dòng mới trong cùng transaction cho đến khi vượt quá *wal_skip_threshold*:

```
=> BEGIN;
=> TRUNCATE TABLE wal;
```

```
=> INSERT INTO wal
     SELECT id FROM generate_series(1,100000) id;
=> COMMIT;
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/45767840
(1 row)
```

> Thay vì tạo một bảng mới, tôi chạy lệnh TRUNCATE vì nó tạo ra ít WAL entry hơn.

Hãy xem xét WAL được tạo ra bằng tiện ích `pg_waldump` đã quen thuộc.

```
postgres$ /usr/local/pgsql/bin/pg_waldump \
-p /usr/local/pgsql/data/pg_wal -s 0/45767698 -e 0/45767840#
rmgr: Storage     len (rec/tot):    42/    42, tx:          0, lsn:
0/45767698, prev 0/45767660, desc: CREATE base/16391/24784
rmgr: Heap        len (rec/tot):   123/   123, tx:     122844, lsn:
0/457676C8, prev 0/45767698, desc: UPDATE off 45 xmax 122844 flags
0x60 ; new off 48 xmax 0, blkref #0: rel 1663/16391/1259 blk 0
rmgr: Btree       len (rec/tot):    64/    64, tx:     122844, lsn:
0/45767748, prev 0/457676C8, desc: INSERT_LEAF off 176, blkref #0:
rel 1663/16391/2662 blk 2
rmgr: Btree       len (rec/tot):    64/    64, tx:     122844, lsn:
0/45767788, prev 0/45767748, desc: INSERT_LEAF off 147, blkref #0:
rel 1663/16391/2663 blk 2
rmgr: Btree       len (rec/tot):    64/    64, tx:     122844, lsn:
0/457677C8, prev 0/45767788, desc: INSERT_LEAF off 254, blkref #0:
rel 1663/16391/3455 blk 4
rmgr: Transaction len (rec/tot):    54/    54, tx:     122844, lsn:
0/45767808, prev 0/457677C8, desc: COMMIT 2023-03-06 14:03:58.395214
MSK; rels: base/16391/24783
```

Entry đầu tiên ghi log việc tạo một file mới cho relation (vì `TRUNCATE` thực chất là ghi lại toàn bộ bảng *[→ tr. 140](08-rebuilding-tables-and-indexes.md)*).

Bốn entry tiếp theo gắn với các thao tác trên system catalog. Chúng phản ánh các thay đổi trong bảng `pg_class` và ba index của nó.

Cuối cùng là một entry liên quan đến commit. Việc chèn dữ liệu không được ghi log.

### Replica

Trong quá trình khôi phục sau sự cố, các WAL entry được replay (phát lại) để khôi phục dữ liệu trên đĩa về một trạng thái nhất quán. Khôi phục từ backup hoạt động theo cách tương tự, nhưng nó còn có thể khôi phục trạng thái cơ sở dữ liệu tới một điểm đích khôi phục (recovery target) được chỉ định bằng cách dùng WAL archive. Số lượng WAL entry được lưu trữ có thể khá lớn (ví dụ, chúng có thể trải dài nhiều ngày), vì vậy giai đoạn khôi phục sẽ bao gồm nhiều checkpoint. Do đó, WAL level `minimal` là không đủ: không thể lặp lại một thao tác nếu nó không được ghi log. Để khôi phục từ backup, các file WAL phải bao gồm *tất cả* các thao tác.

Điều tương tự cũng đúng với replication: các lệnh không được ghi log sẽ không được gửi tới replica và sẽ không được replay trên đó.

Mọi thứ còn phức tạp hơn nếu replica được dùng để thực thi truy vấn. Trước hết, nó cần có thông tin về các exclusive lock được giành trên server chính *[→ tr. 204](12-relation-level-locks.md)* vì chúng có thể xung đột với các truy vấn trên replica. Thứ hai, nó phải có khả năng lấy snapshot *[→ tr. 80](04-snapshots.md)*, điều này đòi hỏi thông tin về các transaction đang hoạt động. Khi làm việc với replica, phải tính đến cả các transaction cục bộ lẫn các transaction đang chạy trên server chính.

Cách duy nhất để gửi dữ liệu này tới replica là định kỳ ghi nó vào các file WAL.[^19] Việc này được thực hiện bởi tiến trình `bgwriter`[^20], cứ 15 giây một lần (khoảng thời gian này được hard-code).

Khả năng khôi phục dữ liệu từ backup và sử dụng physical replication được đảm bảo ở mức `replica`.

Mức `replica` được dùng theo mặc định, vì vậy chúng ta chỉ cần reset các tham số đã cấu hình ở trên *(v. 10)* và khởi động lại server:

```
=> ALTER SYSTEM RESET wal_level;
=> ALTER SYSTEM RESET max_wal_senders;
```

```
postgres$ pg_ctl restart -l /home/postgres/logfile
```

Hãy lặp lại quy trình như trước (nhưng lần này chúng ta chỉ chèn một dòng để có kết quả gọn gàng hơn):

```
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/45D88E48
(1 row)
```

```
=> BEGIN;
=> TRUNCATE TABLE wal;
=> INSERT INTO wal VALUES (42);
=> COMMIT;
```

```
=> SELECT pg_current_wal_insert_lsn();
 pg_current_wal_insert_lsn
---------------------------
 0/45D89108
(1 row)
```

Hãy xem các WAL entry đã được tạo ra.

Ngoài những gì chúng ta đã thấy ở mức `minimal`, chúng ta còn nhận được các entry sau:

- các entry liên quan đến replication của resource manager `Standby`: `RUNNING_XACTS` (các transaction đang hoạt động) và `LOCK`

- entry ghi log thao tác `INSERT+INIT`, thao tác này khởi tạo một page mới và chèn một dòng mới vào page đó

```
postgres$ /usr/local/pgsql/bin/pg_waldump \
-p /usr/local/pgsql/data/pg_wal -s 0/45D88E48 -e 0/45D89108
rmgr: Standby     len (rec/tot):    42/    42, tx:     122846, lsn:
0/45D88E48, prev 0/45D88DD0, desc: LOCK xid 122846 db 16391 rel 16562
rmgr: Storage     len (rec/tot):    42/    42, tx:     122846, lsn:
0/45D88E78, prev 0/45D88E48, desc: CREATE base/16391/24786
rmgr: Heap        len (rec/tot):   123/   123, tx:     122846, lsn:
0/45D88EA8, prev 0/45D88E78, desc: UPDATE off 49 xmax 122846 flags
0x60 ; new off 50 xmax 0, blkref #0: rel 1663/16391/1259 blk 0
rmgr: Btree       len (rec/tot):    64/    64, tx:     122846, lsn:
0/45D88F28, prev 0/45D88EA8, desc: INSERT_LEAF off 178, blkref #0:
rel 1663/16391/2662 blk 2
rmgr: Btree       len (rec/tot):    64/    64, tx:     122846, lsn:
0/45D88F68, prev 0/45D88F28, desc: INSERT_LEAF off 149, blkref #0:
rel 1663/16391/2663 blk 2
rmgr: Btree       len (rec/tot):    64/    64, tx:     122846, lsn:
0/45D88FA8, prev 0/45D88F68, desc: INSERT_LEAF off 256, blkref #0:
rel 1663/16391/3455 blk 4
rmgr: Heap        len (rec/tot):    59/    59, tx:     122846, lsn:
0/45D88FE8, prev 0/45D88FA8, desc: INSERT+INIT off 1 flags 0x00,
blkref #0: rel 1663/16391/24786 blk 0
rmgr: Standby     len (rec/tot):    42/    42, tx:          0, lsn:
0/45D89028, prev 0/45D88FE8, desc: LOCK xid 122846 db 16391 rel 16562
rmgr: Standby     len (rec/tot):    54/    54, tx:          0, lsn:
0/45D89058, prev 0/45D89028, desc: RUNNING_XACTS nextXid 122847
latestCompletedXid 122845 oldestRunningXid 122846; 1 xacts: 122846
rmgr: Transaction len (rec/tot):   114/   114, tx:     122846, lsn:
0/45D89090, prev 0/45D89058, desc: COMMIT 2023-03-06 14:04:14.538399
MSK; rels: base/16391/24785; inval msgs: catcache 51 catcache 50
relcache 16562
```

### Logical

Cuối cùng nhưng không kém phần quan trọng, mức `logical` cho phép logical decoding và logical replication. Nó phải được kích hoạt trên server phát hành (publishing server).

Nếu xem xét các WAL entry, chúng ta sẽ thấy mức này gần như giống hệt `replica`: nó bổ sung các entry liên quan đến nguồn replication (replication origin) và một số entry logic tuỳ ý có thể được ứng dụng tạo ra. Phần lớn, logical decoding phụ thuộc vào thông tin về các transaction đang hoạt động (`RUNNING_XACTS`) vì nó cần lấy snapshot để theo dõi các thay đổi của system catalog.

[^1]: backend/replication/walsender.c
[^2]: backend/access/transam/xlogreader.c
[^3]: backend/access/transam/xlog.c, hàm XLogFlush
[^4]: backend/access/transam/xlog.c, hàm RecordTransactionCommit
[^5]: postgresql.org/docs/14/wal-async-commit.html
[^6]: backend/postmaster/walwriter.c
[^7]: backend/access/transam/xlog.c, hàm XLogBackgroundFlush
[^8]: postgresql.org/docs/14/pgbench.html
[^9]: postgresql.org/docs/14/wal-reliability.html
[^10]: backend/access/transam/xlog.c, hàm issue_xlog_fsync
[^11]: backend/storage/sync/sync.c
[^12]: backend/storage/file/fd.c, hàm pg_fsync
[^13]: backend/storage/page/README
[^14]: postgresql.org/docs/14/app-pgchecksums.html
[^15]: commitfest.postgresql.org/27/2260
[^16]: backend/storage/buffer/bufmgr.c, hàm MarkBufferDirtyHint
[^17]: backend/access/transam/xloginsert.c, hàm XLogRecordAssemble
[^18]: include/utils/rel.h, macro RelationNeedsWAL
[^19]: backend/storage/ipc/standby, hàm LogStandbySnapshot
[^20]: backend/postmaster/bgwriter.c
