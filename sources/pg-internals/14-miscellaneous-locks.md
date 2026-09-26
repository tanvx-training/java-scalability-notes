# Chương 14. Miscellaneous Locks (Các loại lock khác)

## 14.1 Lock không phải trên đối tượng quan hệ (Non-Object Locks)

Để lock một tài nguyên không được coi là *relation*, PostgreSQL sử dụng heavyweight lock thuộc loại `object`.[^1] Bạn có thể lock hầu như mọi thứ được lưu trong system catalog: tablespace, subscription, schema, role, policy, kiểu dữ liệu liệt kê (enumerated data type), v.v.

Hãy bắt đầu một transaction tạo một bảng:

```
=> BEGIN;
=> CREATE TABLE example(n integer);
```

Bây giờ hãy xem các lock không phải trên relation trong bảng `pg_locks`:

```
=> SELECT database,
  (
    SELECT datname FROM pg_database WHERE oid = database
  ) AS dbname,
  classid,
  (
    SELECT relname FROM pg_class WHERE oid = classid
  ) AS classname,
  objid,
  mode,
  granted
FROM pg_locks
WHERE locktype = 'object'
  AND pid = pg_backend_pid() \gx
-[ RECORD 1 ]--------------
database  | 16391
dbname    | internals
classid   | 2615
classname | pg_namespace
objid     | 2200
mode      | AccessShareLock
granted   | t
```

Ở đây, tài nguyên bị lock được xác định bởi ba giá trị:

**database** — `oid` của cơ sở dữ liệu chứa đối tượng đang bị lock (hoặc bằng không nếu đối tượng này là chung cho toàn bộ cluster)

**classid** — `oid` được liệt kê trong `pg_class`, tương ứng với tên của bảng system catalog xác định loại tài nguyên

**objid** — `oid` được liệt kê trong bảng system catalog mà `classid` tham chiếu tới

Giá trị `database` trỏ tới cơ sở dữ liệu `internals`; đó là cơ sở dữ liệu mà phiên hiện tại đang kết nối. Cột `classid` trỏ tới bảng `pg_namespace`, bảng liệt kê các schema.

Bây giờ chúng ta có thể giải mã `objid`:

```
=> SELECT nspname FROM pg_namespace WHERE oid = 2200;
 nspname
---------
 public
(1 row)
```

Như vậy, PostgreSQL đã lock schema `public` để đảm bảo không ai có thể xoá nó trong khi transaction vẫn đang chạy.

Tương tự, việc xoá một đối tượng đòi hỏi lock exclusive trên cả chính đối tượng đó lẫn mọi tài nguyên mà nó phụ thuộc vào.[^2]

```
=> ROLLBACK;
```

## 14.2 Lock mở rộng relation (Relation Extension Locks)

Khi số lượng tuple trong một relation tăng lên, PostgreSQL sẽ chèn các tuple mới vào không gian trống trong các page đã có bất cứ khi nào có thể. Nhưng rõ ràng là đến một lúc nào đó nó sẽ phải thêm các page mới, tức là *mở rộng relation* (*extend the relation*). Xét về bố cục vật lý, các page mới được thêm vào cuối file tương ứng (điều này, đến lượt nó, có thể dẫn tới việc tạo một file mới).

Để các page mới chỉ được thêm bởi một tiến trình tại một thời điểm, thao tác này được bảo vệ bởi một heavyweight lock đặc biệt thuộc loại `extend`.[^3] Lock này cũng được dùng khi vacuum index để cấm thêm page mới trong lúc index scan.

Lock mở rộng relation hành xử hơi khác so với những gì chúng ta đã thấy cho tới giờ:

- Chúng được giải phóng ngay khi việc mở rộng hoàn tất, không chờ transaction kết thúc.

- Chúng không thể gây ra deadlock, vì vậy chúng không được đưa vào wait-for graph (đồ thị chờ).

> Tuy nhiên, việc kiểm tra deadlock vẫn sẽ được thực hiện nếu thủ tục mở rộng relation kéo dài hơn *deadlock_timeout*. Đây không phải là tình huống điển hình, nhưng nó có thể xảy ra nếu một số lượng lớn tiến trình thực hiện nhiều thao tác chèn đồng thời. Trong trường hợp này, việc kiểm tra có thể được gọi nhiều lần, gần như làm tê liệt hoạt động bình thường của hệ thống.

> Để giảm thiểu rủi ro này, các file heap được mở rộng nhiều page cùng lúc (tỉ lệ với số tiến trình đang chờ lock, nhưng không quá 512 page mỗi thao tác) *(v. 9.6)*.[^4] Một ngoại lệ cho quy tắc này là các file index B-tree, vốn được mở rộng mỗi lần một page.[^5]

## 14.3 Lock trang (Page Locks)

Heavyweight lock mức page thuộc loại `page`[^6] chỉ được áp dụng bởi các index GIN, và chỉ trong trường hợp sau.

Index GIN có thể tăng tốc việc tìm kiếm các phần tử trong các giá trị phức hợp, chẳng hạn như các từ trong văn bản. Có thể mô tả đại khái chúng là các B-tree lưu các từ riêng lẻ thay vì toàn bộ văn bản. Khi một văn bản mới được thêm vào, index phải được cập nhật kỹ lưỡng để bao gồm từng từ xuất hiện trong văn bản này.

Để cải thiện hiệu năng, index GIN cho phép chèn trì hoãn (deferred insertion), được điều khiển bởi storage parameter *fastupdate* *(mặc định: on)*. Các từ mới trước tiên được thêm nhanh vào một *danh sách chờ* (*pending list*) không có thứ tự, và sau một thời gian, tất cả các mục đã tích luỹ sẽ được chuyển vào cấu trúc chính của index. Vì các văn bản khác nhau nhiều khả năng chứa các từ trùng lặp, cách tiếp cận này tỏ ra khá hiệu quả về chi phí.

Để tránh việc nhiều tiến trình cùng chuyển các từ đồng thời, metapage của index bị lock ở chế độ exclusive cho tới khi tất cả các từ được chuyển từ pending list vào index chính. Lock này không cản trở việc sử dụng index thông thường.

Cũng giống như lock mở rộng relation, page lock được giải phóng ngay khi công việc hoàn tất, không chờ transaction kết thúc, vì vậy chúng không bao giờ gây ra deadlock.

## 14.4 Advisory Locks

Không giống các heavyweight lock khác (chẳng hạn lock trên relation), *advisory lock* (lock tư vấn)[^7] không bao giờ được giành tự động: chúng do lập trình viên ứng dụng điều khiển. Các lock này tiện dụng nếu ứng dụng cần một logic lock riêng cho một mục đích cụ thể nào đó.

Giả sử chúng ta cần lock một tài nguyên không tương ứng với bất kỳ đối tượng cơ sở dữ liệu nào (những đối tượng mà ta có thể lock bằng các lệnh `SELECT FOR` hoặc `LOCK TABLE`). Trong trường hợp này, tài nguyên cần được gán một ID dạng số. Nếu tài nguyên có một tên duy nhất, cách dễ nhất là sinh mã băm (hash code) cho tên này:

```
=> SELECT hashtext('resource1');
 hashtext
-----------
 991601810
(1 row)
```

PostgreSQL cung cấp cả một nhóm hàm để quản lý advisory lock.[^8] Tên của chúng bắt đầu bằng tiền tố `pg_advisory` và có thể chứa các từ sau, gợi ý mục đích của hàm:

**lock** — giành một lock

**try** — giành một lock nếu có thể làm được mà không phải chờ

**unlock** — giải phóng lock

**share** — sử dụng chế độ lock shared (mặc định dùng chế độ exclusive)

**xact** — giành và giữ lock cho tới khi kết thúc transaction (mặc định lock được giữ tới khi kết thúc phiên)

Hãy giành một lock exclusive cho tới khi kết thúc phiên:

```
=> BEGIN;
=> SELECT pg_advisory_lock(hashtext('resource1'));
=> SELECT locktype, objid, mode, granted
FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid();
 locktype |   objid   |    mode      | granted
----------+-----------+---------------+---------
 advisory | 991601810 | ExclusiveLock | t
(1 row)
```

Để advisory lock thực sự có tác dụng, các tiến trình khác cũng phải tuân theo trình tự đã thiết lập khi truy cập tài nguyên; điều này phải được ứng dụng đảm bảo.

Lock đã giành sẽ vẫn được giữ ngay cả sau khi transaction hoàn tất:

```
=> COMMIT;
=> SELECT locktype, objid, mode, granted
FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid();
 locktype |   objid   |    mode      | granted
----------+-----------+---------------+---------
 advisory | 991601810 | ExclusiveLock | t
(1 row)
```

Khi thao tác trên tài nguyên đã xong, lock phải được giải phóng một cách tường minh:

```
=> SELECT pg_advisory_unlock(hashtext('resource1'));
```

## 14.5 Predicate Locks

Thuật ngữ *predicate lock* (lock theo vị từ) đã xuất hiện ngay từ những nỗ lực đầu tiên nhằm hiện thực tính cô lập đầy đủ dựa trên lock.[^9] Vấn đề gặp phải khi đó là việc lock tất cả các dòng sẽ được đọc và cập nhật vẫn không thể đảm bảo tính cô lập đầy đủ. Thật vậy, nếu các dòng *mới* thoả mãn điều kiện lọc được chèn vào bảng, chúng sẽ trở thành *phantom* (bóng ma). *[→ tr. 42](02-isolation.md)*

Vì lý do này, người ta đề xuất lock các điều kiện (vị từ — predicate) thay vì lock các dòng. Nếu bạn chạy một truy vấn với vị từ *a* > 10, việc lock vị từ này sẽ không cho phép thêm các dòng mới vào bảng nếu chúng thoả mãn điều kiện này, nhờ vậy tránh được phantom. Rắc rối là nếu xuất hiện một truy vấn với vị từ khác, chẳng hạn *a* < 20, bạn phải xác định xem các vị từ này có giao nhau hay không. Về lý thuyết, bài toán này không thể giải được bằng thuật toán; trong thực tế, nó chỉ có thể giải được cho một lớp vị từ rất đơn giản (như trong ví dụ này).

Trong PostgreSQL, isolation level `Serializable` được hiện thực theo một cách khác: nó sử dụng giao thức Serializable Snapshot Isolation (SSI).[^10] Thuật ngữ *predicate lock* vẫn còn được dùng, nhưng ý nghĩa của nó đã thay đổi hoàn toàn. Trên thực tế, những "lock" như vậy không lock bất cứ thứ gì: chúng được dùng để theo dõi sự phụ thuộc dữ liệu giữa các transaction khác nhau.

Người ta đã chứng minh rằng snapshot isolation ở mức `Repeatable Read` không cho phép anomaly (bất thường) nào ngoại trừ *write skew* và *read-only transaction anomaly* *[→ tr. 55](02-isolation.md)*. Hai anomaly này tạo ra những mẫu nhất định trong đồ thị phụ thuộc dữ liệu, có thể được phát hiện với chi phí tương đối thấp.

Vấn đề là chúng ta phải phân biệt hai loại phụ thuộc:

- Transaction thứ nhất đọc một dòng mà sau đó được transaction thứ hai cập nhật (phụ thuộc RW).

- Transaction thứ nhất sửa đổi một dòng mà sau đó được transaction thứ hai đọc (phụ thuộc WR).

Phụ thuộc WR có thể được phát hiện bằng các lock thông thường, nhưng phụ thuộc RW phải được theo dõi thông qua predicate lock. Việc theo dõi này được bật tự động ở isolation level `Serializable`, và đó chính là lý do tại sao việc dùng mức này cho *tất cả* các transaction (hoặc ít nhất là tất cả các transaction có liên quan với nhau) là quan trọng. Nếu có transaction nào chạy ở mức khác, nó sẽ không đặt (hoặc kiểm tra) predicate lock, vì vậy mức `Serializable` sẽ bị hạ xuống thành `Repeatable Read`.

Tôi muốn nhấn mạnh một lần nữa rằng, bất chấp tên gọi, predicate lock không lock bất cứ thứ gì. Thay vào đó, một transaction sẽ được kiểm tra các phụ thuộc "nguy hiểm" khi nó chuẩn bị commit, và nếu PostgreSQL nghi ngờ có anomaly, transaction này sẽ bị abort.

Hãy tạo một bảng với một index trải trên nhiều page (có thể đạt được điều này bằng cách dùng giá trị *fillfactor* thấp):

```
=> CREATE TABLE pred(n numeric, s text);
=> INSERT INTO pred(n) SELECT n FROM generate_series(1,10000) n;
=> CREATE INDEX ON pred(n) WITH (fillfactor = 10);
=> ANALYZE pred;
```

Nếu truy vấn thực hiện sequential scan, một predicate lock sẽ được giành trên toàn bộ bảng (ngay cả khi một số dòng không thoả mãn điều kiện lọc đã cho).

> ```
> => SELECT pg_backend_pid();
>  pg_backend_pid
> ----------------
>           34753
> (1 row)
> => BEGIN ISOLATION LEVEL SERIALIZABLE;
> => EXPLAIN (analyze, costs off, timing off, summary off)
>   SELECT * FROM pred WHERE n > 100;
> ```

> ```
>                  QUERY PLAN
> ---------------------------------------------
>  Seq Scan on pred (actual rows=9900 loops=1)
>    Filter: (n > '100'::numeric)
>    Rows Removed by Filter: 100
> (3 rows)
> ```

Mặc dù predicate lock có hạ tầng riêng, view `pg_locks` hiển thị chúng cùng với các heavyweight lock. Mọi predicate lock luôn được giành ở chế độ `SIRead`, viết tắt của Serializable Isolation Read:

```
=> SELECT relation::regclass, locktype, page, tuple
FROM pg_locks WHERE mode = 'SIReadLock' AND pid = 34753
ORDER BY 1, 2, 3, 4;
 relation | locktype | page | tuple
----------+----------+------+-------
 pred     | relation |     |
(1 row)
```

> ```
> => ROLLBACK;
> ```

Lưu ý rằng predicate lock có thể được giữ lâu hơn thời gian tồn tại của transaction, vì chúng được dùng để theo dõi các phụ thuộc *giữa* các transaction. Nhưng dù sao đi nữa, chúng được quản lý tự động.

Nếu truy vấn thực hiện index scan, tình hình được cải thiện. Với index B-tree, chỉ cần đặt predicate lock trên các heap tuple đã đọc và trên các leaf page (trang lá) đã quét của index là đủ. Nó sẽ "lock" toàn bộ khoảng giá trị đã được đọc, chứ không chỉ các giá trị chính xác.

> ```
> => BEGIN ISOLATION LEVEL SERIALIZABLE;
> => EXPLAIN (analyze, costs off, timing off, summary off)
>   SELECT * FROM pred WHERE n BETWEEN 1000 AND 1001;
>                            QUERY PLAN
> -------------------------------------------------------------------
>  Index Scan using pred_n_idx on pred (actual rows=2 loops=1)
>    Index Cond: ((n >= '1000'::numeric) AND (n <= '1001'::numeric))
> (2 rows)
> ```

```
=> SELECT relation::regclass, locktype, page, tuple
FROM pg_locks WHERE mode = 'SIReadLock' AND pid = 34753
ORDER BY 1, 2, 3, 4;
  relation  | locktype | page | tuple
------------+----------+------+-------
 pred       | tuple    |   4 |    96
 pred       | tuple    |   4 |    97
 pred_n_idx | page     |  28 |
(3 rows)
```

Số lượng leaf page tương ứng với các tuple đã quét có thể thay đổi: ví dụ, một page của index có thể bị tách (split) khi các dòng mới được chèn vào bảng. Tuy nhiên, PostgreSQL có tính đến điều này và cũng lock cả các page mới xuất hiện:

```
=> INSERT INTO pred
  SELECT 1000+(n/1000.0) FROM generate_series(1,999) n;
=> SELECT relation::regclass, locktype, page, tuple
FROM pg_locks WHERE mode = 'SIReadLock' AND pid = 34753
ORDER BY 1, 2, 3, 4;
  relation  | locktype | page | tuple
------------+----------+------+-------
 pred       | tuple    |   4 |    96
 pred       | tuple    |   4 |    97
 pred_n_idx | page     |  28 |
 pred_n_idx | page     | 266 |
 pred_n_idx | page     | 267 |
 pred_n_idx | page     | 268 |
 pred_n_idx | page     | 269 |
(7 rows)
```

Mỗi tuple được đọc sẽ bị lock riêng rẽ, và số lượng tuple như vậy có thể khá nhiều. Predicate lock sử dụng pool (vùng nhớ) riêng được cấp phát khi server khởi động. Tổng số predicate lock bị giới hạn bởi giá trị tham số *max_pred_locks_per_transaction* nhân với *max_connections* *(mặc định: 64 100)* (bất chấp tên tham số, predicate lock không được đếm theo từng transaction riêng lẻ).

Ở đây chúng ta gặp cùng vấn đề như với lock mức dòng, nhưng nó được giải quyết theo cách khác: áp dụng *lock escalation* (leo thang lock).[^11]

Ngay khi số lượng tuple lock liên quan tới một page vượt quá giá trị tham số *max_pred_locks_per_page* *(v. 10)* *(mặc định: 2)*, chúng sẽ được thay thế bằng một lock duy nhất ở mức page.

> ```
> => EXPLAIN (analyze, costs off, timing off, summary off)
>   SELECT * FROM pred WHERE n BETWEEN 1000 AND 1002;
>                            QUERY PLAN
> -------------------------------------------------------------------
>  Index Scan using pred_n_idx on pred (actual rows=3 loops=1)
>    Index Cond: ((n >= '1000'::numeric) AND (n <= '1002'::numeric))
> (2 rows)
> ```

Thay vì ba lock loại `tuple`, giờ chúng ta có một lock loại `page`:

```
=> SELECT relation::regclass, locktype, page, tuple
FROM pg_locks WHERE mode = 'SIReadLock' AND pid = 34753
ORDER BY 1, 2, 3, 4;
  relation  | locktype | page | tuple
------------+----------+------+-------
 pred       | page     |   4 |
 pred_n_idx | page     |  28 |
 pred_n_idx | page     | 266 |
 pred_n_idx | page     | 267 |
 pred_n_idx | page     | 268 |
 pred_n_idx | page     | 269 |
(6 rows)
```

```
=> ROLLBACK;
```

Việc leo thang các lock mức page cũng tuân theo cùng nguyên tắc *(v. 10)*. Nếu số lượng các lock như vậy đối với một relation cụ thể vượt quá giá trị *max_pred_locks_per_relation* *(mặc định: -2)*, chúng sẽ được thay thế bằng một lock duy nhất ở mức relation. (Nếu tham số này được đặt giá trị âm, ngưỡng sẽ được tính bằng *max_pred_locks_per_transaction* *(mặc định: 64)* chia cho giá trị tuyệt đối của *max_pred_locks_per_relation*; như vậy, ngưỡng mặc định là 32).

Lock escalation chắc chắn sẽ dẫn tới nhiều lỗi serialization dương tính giả (false-positive), điều này ảnh hưởng tiêu cực tới thông lượng của hệ thống. Vì vậy bạn phải tìm được sự cân bằng phù hợp giữa hiệu năng và việc dành RAM sẵn có cho lock.

Predicate lock hỗ trợ các loại index sau:

- B-tree

- index hash, GiST và GIN *(v. 11)*

Nếu thực hiện index scan nhưng index không hỗ trợ predicate lock, toàn bộ index sẽ bị lock. Dễ đoán là trong trường hợp này, số transaction bị abort mà không có lý do chính đáng cũng sẽ tăng lên.

Để hoạt động hiệu quả hơn ở mức `Serializable`, việc khai báo tường minh các transaction chỉ đọc bằng mệnh đề `READ ONLY` là hợp lý. Nếu lock manager (bộ quản lý lock) thấy rằng một transaction chỉ đọc sẽ không xung đột với các transaction khác,[^12] nó có thể giải phóng các predicate lock đã đặt và không giành thêm lock mới. Và nếu transaction như vậy còn được khai báo là `DEFERRABLE`, read-only transaction anomaly cũng sẽ được tránh *[→ tr. 59](02-isolation.md)*.

[^1]: backend/storage/lmgr/lmgr.c, các hàm LockDatabaseObject & LockSharedObject
[^2]: backend/catalog/dependency.c, hàm performDeletion
[^3]: backend/storage/lmgr/lmgr.c, hàm LockRelationForExtension
[^4]: backend/access/heap/hio.c, hàm RelationAddExtraBlocks
[^5]: backend/access/nbtree/nbtpage.c, hàm _bt_getbuf
[^6]: backend/storage/lmgr/lmgr.c, hàm LockPage
[^7]: postgresql.org/docs/14/explicit-locking.html#ADVISORY-LOCKS
[^8]: postgresql.org/docs/14/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
[^9]: K. P. Eswaran, J. N. Gray, R. A. Lorie, I. L. Traiger. The notions of consistency and predicate locks in a database system
[^10]: backend/storage/lmgr/README-SSI  
backend/storage/lmgr/predicate.c
[^11]: backend/storage/lmgr/predicate.c, hàm PredicateLockAcquire
[^12]: backend/storage/lmgr/predicate.c, macro SxactIsROSafe
