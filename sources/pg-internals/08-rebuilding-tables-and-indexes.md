# Chương 8. Xây dựng lại bảng và index (Rebuilding Tables and Indexes)

## 8.1 Full vacuum (Full Vacuuming)

### Vì sao vacuum thông thường là chưa đủ? (Why is Routine Vacuuming not Enough?)

Vacuum thông thường (routine vacuuming) có thể giải phóng nhiều không gian hơn page pruning, nhưng đôi khi vẫn có thể chưa đủ.

Nếu file của bảng hoặc index đã phình to, `VACUUM` có thể dọn dẹp một phần không gian bên trong các page, nhưng hiếm khi giảm được số lượng page. Không gian thu hồi được chỉ có thể trả lại cho hệ điều hành nếu có vài page trống xuất hiện ở ngay cuối file, điều này không xảy ra thường xuyên.

Kích thước quá lớn có thể dẫn đến những hệ quả khó chịu:

- Việc quét toàn bộ bảng (hoặc index) sẽ mất nhiều thời gian hơn.

- Có thể cần buffer cache lớn hơn (các page được cache nguyên cả page, nên mật độ dữ liệu giảm xuống).

- B-tree có thể bị thêm một tầng, làm chậm việc truy cập index.

- Các file chiếm thêm không gian trên đĩa và trong các bản sao lưu.

Nếu tỷ lệ dữ liệu hữu ích trong file đã giảm xuống dưới một mức hợp lý nào đó, quản trị viên có thể thực hiện *full vacuuming* (vacuum toàn phần) bằng cách chạy lệnh `VACUUM FULL`.[^1] Khi đó, bảng và tất cả các index của nó được xây dựng lại từ đầu, và dữ liệu được đóng gói dày đặc nhất có thể (có tính đến tham số *fillfactor*). *[→ tr. 92](05-page-pruning-and-hot-updates.md)*

Khi thực hiện full vacuum, PostgreSQL trước tiên xây dựng lại toàn bộ bảng, sau đó lần lượt đến từng index của nó. Trong khi một đối tượng đang được xây dựng lại, cả file cũ lẫn file mới đều phải được lưu trên đĩa,[^2] vì vậy quá trình này có thể đòi hỏi rất nhiều không gian trống.

Bạn cũng nên nhớ rằng thao tác này chặn hoàn toàn việc truy cập vào bảng, cả đọc lẫn ghi.

### Ước lượng mật độ dữ liệu (Estimating Data Density)

Để minh họa, hãy chèn một số dòng vào bảng:

```
=> TRUNCATE vac;
=> INSERT INTO vac(id,s)
  SELECT id, id::text FROM generate_series(1,500000) id;
```

Mật độ lưu trữ có thể được ước lượng bằng extension `pgstattuple`:

```
=> CREATE EXTENSION pgstattuple;
=> SELECT * FROM pgstattuple('vac') \gx
-[ RECORD 1 ]------+---------
table_len          | 70623232
tuple_count        | 500000
tuple_len          | 64500000
tuple_percent      | 91.33
dead_tuple_count   | 0
dead_tuple_len     | 0
dead_tuple_percent | 0
free_space         | 381844
free_percent       | 0.54
```

Hàm này đọc toàn bộ bảng và hiển thị thống kê về sự phân bố không gian trong các file của nó. Trường `tuple_percent` cho biết phần trăm không gian được chiếm bởi dữ liệu hữu ích (các heap tuple). Giá trị này chắc chắn nhỏ hơn 100% do có nhiều loại metadata bên trong các page, nhưng trong ví dụ này nó vẫn khá cao.

Với index, thông tin hiển thị có khác một chút, nhưng trường `avg_leaf_density` mang cùng ý nghĩa: nó cho biết phần trăm dữ liệu hữu ích (trong các leaf page của B-tree).

```
=> SELECT * FROM pgstatindex('vac_s') \gx
-[ RECORD 1 ]------+----------
version            | 4
tree_level         | 3
index_size         | 114302976
root_block_no      | 2825
internal_pages     | 376
leaf_pages         | 13576
empty_pages        | 0
deleted_pages      | 0
avg_leaf_density   | 53.88
leaf_fragmentation | 10.59
```

Các hàm `pgstattuple` vừa dùng ở trên đọc toàn bộ bảng hoặc index để có được thống kê chính xác. Với những đối tượng lớn, việc này có thể trở nên quá tốn kém, vì vậy extension này còn cung cấp một hàm khác tên là `pgstattuple_approx`, hàm này bỏ qua các page được theo dõi trong visibility map để hiển thị các con số gần đúng.

Một phương pháp nhanh hơn nhưng còn kém chính xác hơn nữa là ước lượng sơ bộ tỷ lệ giữa khối lượng dữ liệu và kích thước file bằng system catalog.[^3]

Đây là kích thước hiện tại của bảng và index của nó:

```
=> SELECT pg_size_pretty(pg_table_size('vac')) AS table_size,
        pg_size_pretty(pg_indexes_size('vac')) AS index_size;
 table_size | index_size
------------+------------
 67 MB      | 109 MB
(1 row)
```

Bây giờ hãy xóa 90% tổng số dòng:

```
=> DELETE FROM vac WHERE id % 10 != 0;
DELETE 450000
```

Vacuum thông thường không ảnh hưởng đến kích thước file vì không có page trống nào ở cuối file:

```
=> VACUUM vac;
=> SELECT pg_size_pretty(pg_table_size('vac')) AS table_size,
        pg_size_pretty(pg_indexes_size('vac')) AS index_size;
 table_size | index_size
------------+------------
 67 MB      | 109 MB
(1 row)
```

Tuy nhiên, mật độ dữ liệu đã giảm khoảng 10 lần:

```
=> SELECT vac.tuple_percent, vac_s.avg_leaf_density
FROM pgstattuple('vac') vac, pgstatindex('vac_s') vac_s;
 tuple_percent | avg_leaf_density
---------------+------------------
          9.13 |            6.71
(1 row)
```

Bảng và index hiện đang nằm trong các file sau:

```
=> SELECT pg_relation_filepath('vac') AS vac_filepath,
        pg_relation_filepath('vac_s') AS vac_s_filepath \gx
-[ RECORD 1 ]--+-----------------
vac_filepath   | base/16391/16514
vac_s_filepath | base/16391/16515
```

Hãy kiểm tra xem chúng ta sẽ nhận được gì sau `VACUUM FULL`. Trong khi lệnh đang chạy, tiến độ của nó có thể được theo dõi trong view `pg_stat_progress_cluster` (tương tự như view `pg_stat_progress_vacuum` dành cho `VACUUM`) *(v. 12)*:

```
=> VACUUM FULL vac;
```

> ```
> => SELECT * FROM pg_stat_progress_cluster \gx
> -[ RECORD 1 ]-------+-----------------
> pid                 | 19488
> datid               | 16391
> datname             | internals
> relid               | 16479
> command             | VACUUM FULL
> phase               | rebuilding index
> cluster_index_relid | 0
> heap_tuples_scanned | 50000
> heap_tuples_written | 50000
> heap_blks_total     | 8621
> heap_blks_scanned   | 8621
> index_rebuild_count | 0
> ```

Đúng như dự đoán, các giai đoạn (phase) của `VACUUM FULL`[^4] khác với các giai đoạn của vacuum thông thường.

Full vacuum đã thay thế các file cũ bằng các file mới:

```
=> SELECT pg_relation_filepath('vac') AS vac_filepath,
        pg_relation_filepath('vac_s') AS vac_s_filepath \gx
-[ RECORD 1 ]--+-----------------
vac_filepath   | base/16391/16526
vac_s_filepath | base/16391/16529
```

Giờ đây cả kích thước index lẫn bảng đều nhỏ hơn nhiều:

```
=> SELECT pg_size_pretty(pg_table_size('vac')) AS table_size,
        pg_size_pretty(pg_indexes_size('vac')) AS index_size;
 table_size | index_size
------------+------------
 6904 kB    | 6504 kB
(1 row)
```

Kết quả là mật độ dữ liệu đã tăng lên. Với index, nó thậm chí còn cao hơn ban đầu: tạo một B-tree từ đầu dựa trên dữ liệu sẵn có thì hiệu quả hơn là chèn từng mục, từng dòng một vào một index đã tồn tại:

```
=> SELECT vac.tuple_percent,
          vac_s.avg_leaf_density
FROM pgstattuple('vac') vac,
     pgstatindex('vac_s') vac_s;
```

```
 tuple_percent | avg_leaf_density
---------------+------------------
         91.23 |           91.08
(1 row)
```

### Freezing

Khi bảng đang được xây dựng lại, PostgreSQL freeze các tuple của nó, vì thao tác này gần như không tốn chi phí gì so với phần việc còn lại:

```
=> SELECT * FROM heap_page('vac',0,0) LIMIT 5;
 ctid  | state  | xmin | xmin_age | xmax
-------+--------+-------+----------+------
 (0,1) | normal | 861 f |       5 | 0 a
 (0,2) | normal | 861 f |       5 | 0 a
 (0,3) | normal | 861 f |       5 | 0 a
 (0,4) | normal | 861 f |       5 | 0 a
 (0,5) | normal | 861 f |       5 | 0 a
(5 rows)
```

Nhưng các page không được ghi nhận trong visibility map lẫn freeze map, và page header cũng không nhận thuộc tính visibility (như điều xảy ra khi lệnh `COPY` được thực thi với tùy chọn `FREEZE`): *[→ tr. 133](07-freezing.md)*

```
=> SELECT * FROM pg_visibility_map('vac',0);
 all_visible | all_frozen
-------------+------------
 f           | f
(1 row)
=> SELECT flags & 4 > 0 all_visible
FROM page_header(get_raw_page('vac',0));
 all_visible
-------------
 f
(1 row)
```

Tình hình chỉ được cải thiện sau khi `VACUUM` được gọi (hoặc autovacuum được kích hoạt):

```
=> VACUUM vac;
=> SELECT * FROM pg_visibility_map('vac',0);
 all_visible | all_frozen
-------------+------------
 t           | t
(1 row)
=> SELECT flags & 4 > 0 AS all_visible
FROM page_header(get_raw_page('vac',0));
```

```
 all_visible
-------------
 t
(1 row)
```

Về cơ bản, điều đó có nghĩa là ngay cả khi mọi tuple trong một page đều đã nằm ngoài database horizon, page đó vẫn sẽ phải được ghi lại.

## 8.2 Các phương pháp xây dựng lại khác (Other Rebuilding Methods)

### Các lựa chọn thay thế cho full vacuum (Alternatives to Full Vacuuming)

Ngoài `VACUUM FULL`, còn có một số lệnh khác có thể xây dựng lại hoàn toàn bảng và index. Tất cả các lệnh này đều khóa độc quyền (exclusive lock) bảng, tất cả đều xóa các file dữ liệu cũ và tạo lại chúng từ đầu.

Lệnh `CLUSTER` hoàn toàn tương tự `VACUUM FULL`, nhưng nó còn sắp xếp lại thứ tự các tuple trong file dựa trên một trong các index sẵn có *[→ tr. 326](19-index-access-methods.md)*. Trong một số trường hợp, điều này có thể giúp planner sử dụng index scan hiệu quả hơn. Nhưng bạn nên nhớ rằng việc cluster hóa không được duy trì: *[→ tr. 331](20-index-scans.md)* mọi cập nhật tiếp theo trên bảng sẽ phá vỡ thứ tự vật lý của các tuple.

Về mặt lập trình, `VACUUM FULL` đơn giản chỉ là một trường hợp đặc biệt của lệnh `CLUSTER` không yêu cầu sắp xếp lại tuple.[^5]

Lệnh `REINDEX` xây dựng lại một hoặc nhiều index.[^6] Thực tế, `VACUUM FULL` và `CLUSTER` sử dụng lệnh này ở bên dưới khi xây dựng lại index.

Lệnh `TRUNCATE`[^7] xóa tất cả các dòng của bảng; về mặt logic nó tương đương với `DELETE` chạy không có mệnh đề `WHERE`. Nhưng trong khi `DELETE` chỉ đơn giản đánh dấu các heap tuple là đã bị xóa (nên chúng vẫn phải được vacuum) *[→ tr. 72](03-pages-and-tuples.md)*, thì `TRUNCATE` tạo ra một file trống mới, điều này thường nhanh hơn.

### Giảm thời gian gián đoạn khi xây dựng lại (Reducing Downtime During Rebuilding)

`VACUUM FULL` không được thiết kế để chạy thường xuyên, vì nó khóa độc quyền bảng (ngay cả đối với các truy vấn) *[→ tr. 204](12-relation-level-locks.md)* trong suốt thời gian hoạt động. Điều này thường không thể chấp nhận với các hệ thống yêu cầu tính sẵn sàng cao.

Có một số extension (chẳng hạn như `pg_repack`[^8]) có thể xây dựng lại bảng và index mà gần như không gây gián đoạn. Vẫn cần một exclusive lock, nhưng chỉ ở đầu và cuối quá trình này, và chỉ trong thời gian ngắn. Điều này đạt được nhờ một cách cài đặt phức tạp hơn: mọi thay đổi được thực hiện trên bảng gốc trong khi nó đang được xây dựng lại sẽ được một trigger lưu lại, rồi sau đó áp dụng vào bảng mới. Để hoàn tất thao tác, tiện ích này thay thế bảng này bằng bảng kia trong system catalog.

Một giải pháp khác thường được đưa ra bởi tiện ích `pgcompacttable`.[^9] Nó thực hiện nhiều lần cập nhật dòng giả (không thay đổi dữ liệu nào) để các row version hiện hành dần dần dịch chuyển về phía đầu file.

Giữa các loạt cập nhật này, vacuum loại bỏ các tuple lỗi thời và cắt ngắn (truncate) file từng chút một *[→ tr. 108](06-vacuum-and-autovacuum.md)*. Cách tiếp cận này tốn nhiều thời gian và tài nguyên hơn hẳn, nhưng nó không đòi hỏi thêm không gian để xây dựng lại bảng và không gây ra các đợt tăng tải đột biến. Các exclusive lock ngắn hạn vẫn được giành lấy trong khi bảng đang bị cắt ngắn, nhưng vacuum xử lý chúng khá êm.

## 8.3 Các biện pháp phòng ngừa (Precautions)

### Truy vấn chỉ đọc (Read-Only Queries)

Một trong những nguyên nhân khiến file phình to là việc thực thi các transaction chạy lâu giữ database horizon trong khi dữ liệu được cập nhật với cường độ cao. *[→ tr. 88](04-snapshots.md)*

Bản thân các transaction chạy lâu (chỉ đọc) không gây ra vấn đề gì. Vì vậy, một cách tiếp cận phổ biến là chia tải giữa các hệ thống khác nhau: giữ các truy vấn OLTP nhanh trên server chính (primary) và chuyển tất cả các transaction OLAP sang một replica. Mặc dù điều này làm cho giải pháp đắt đỏ và phức tạp hơn, những biện pháp như vậy có thể trở nên không thể thiếu.

Trong một số trường hợp, các transaction dài là hệ quả của lỗi trong ứng dụng hoặc driver chứ không phải là điều cần thiết. Nếu vấn đề không thể giải quyết một cách văn minh, quản trị viên có thể viện đến hai tham số sau:

- Tham số *old_snapshot_threshold* xác định thời gian sống tối đa của một snapshot *(v. 9.6)*. Khi hết thời gian này, server có quyền loại bỏ các tuple lỗi thời; nếu một transaction chạy lâu vẫn cần đến chúng, nó sẽ nhận lỗi ("snapshot too old").

- Tham số *idle_in_transaction_session_timeout* giới hạn thời gian sống của một transaction ở trạng thái rỗi (idle) *(v. 9.6)*. Transaction sẽ bị abort khi chạm đến ngưỡng này.

### Cập nhật dữ liệu (Data Updates)

Một nguyên nhân khác gây phình to là việc sửa đổi đồng thời một số lượng lớn tuple. Nếu tất cả các dòng của bảng được cập nhật, số lượng tuple có thể tăng gấp đôi, và vacuum sẽ không có đủ thời gian để can thiệp. Page pruning có thể giảm bớt vấn đề này, nhưng không giải quyết được hoàn toàn.

Hãy mở rộng kết quả với một cột khác để theo dõi các dòng đã được xử lý:

```
=> ALTER TABLE vac ADD processed boolean DEFAULT false;
=> SELECT pg_size_pretty(pg_table_size('vac'));
 pg_size_pretty
----------------
 6936 kB
(1 row)
```

Khi tất cả các dòng đã được cập nhật, bảng lớn lên gần gấp đôi:

```
=> UPDATE vac SET processed = true;
UPDATE 50000
=> SELECT pg_size_pretty(pg_table_size('vac'));
 pg_size_pretty
----------------
 14 MB
(1 row)
```

Để xử lý tình huống này, bạn có thể giảm số lượng thay đổi được thực hiện bởi một transaction duy nhất, trải chúng ra theo thời gian; khi đó vacuum có thể xóa các tuple lỗi thời và giải phóng một phần không gian cho các tuple mới bên trong các page đã tồn tại. Giả sử rằng mỗi lần cập nhật dòng có thể được commit riêng rẽ, chúng ta có thể dùng truy vấn sau, vốn chọn ra một lô (batch) dòng có kích thước cho trước, làm khuôn mẫu:

```
SELECT ID
FROM table
WHERE filtering the already processed rows
LIMIT batch size
FOR UPDATE SKIP LOCKED
```

Đoạn code này chọn và ngay lập tức khóa một tập hợp dòng không vượt quá kích thước đã chỉ định. Các dòng đã bị các transaction khác khóa sẽ được bỏ qua: chúng sẽ được đưa vào một lô khác trong lần tiếp theo *[→ tr. 224](13-row-level-locks.md)*. Đây là một giải pháp khá linh hoạt và tiện lợi, cho phép bạn dễ dàng thay đổi kích thước lô và khởi động lại thao tác trong trường hợp có lỗi. Hãy bỏ đặt thuộc tính `processed` và thực hiện full vacuum để khôi phục kích thước ban đầu của bảng:

```
=> UPDATE vac SET processed = false;
=> VACUUM FULL vac;
```

Sau khi lô đầu tiên được cập nhật, kích thước bảng tăng lên một chút:

```
=> WITH batch AS (
  SELECT id FROM vac WHERE NOT processed LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE vac SET processed = true
WHERE id IN (SELECT id FROM batch);
UPDATE 1000
=> SELECT pg_size_pretty(pg_table_size('vac'));
 pg_size_pretty
----------------
 7064 kB
(1 row)
```

Nhưng từ đây trở đi, kích thước gần như giữ nguyên vì các tuple mới thay thế chỗ của các tuple đã bị loại bỏ:

```
=> VACUUM vac;
=> WITH batch AS (
  SELECT id FROM vac WHERE NOT processed LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE vac SET processed = true
WHERE id IN (SELECT id FROM batch);
UPDATE 1000
=> SELECT pg_size_pretty(pg_table_size('vac'));
 pg_size_pretty
----------------
 7072 kB
(1 row)
```

[^1]: postgresql.org/docs/14/routine-vacuuming.html#VACUUM-FOR-SPACE-RECOVERY
[^2]: backend/commands/cluster.c
[^3]: wiki.postgresql.org/wiki/Show_database_bloat
[^4]: postgresql.org/docs/14/progress-reporting.html#CLUSTER-PHASES
[^5]: backend/commands/cluster.c
[^6]: backend/commands/indexcmds.c
[^7]: backend/commands/tablecmds.c, hàm ExecuteTruncate
[^8]: github.com/reorg/pg_repack
[^9]: github.com/dataegret/pgcompacttable
