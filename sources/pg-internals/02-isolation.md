# Chương 2. Isolation (Tính cô lập)

## 2.1 Tính nhất quán (Consistency)

Đặc điểm then chốt của các cơ sở dữ liệu quan hệ là khả năng đảm bảo *tính nhất quán* của dữ liệu, tức là *tính đúng đắn* của dữ liệu.

Như đã biết, ở mức cơ sở dữ liệu có thể tạo các *ràng buộc toàn vẹn* (integrity constraints), chẳng hạn `NOT NULL` hoặc `UNIQUE`. Hệ quản trị cơ sở dữ liệu đảm bảo rằng các ràng buộc này không bao giờ bị phá vỡ, vì vậy tính toàn vẹn của dữ liệu không bao giờ bị tổn hại.

Nếu mọi ràng buộc cần thiết đều có thể được phát biểu ở mức cơ sở dữ liệu thì tính nhất quán sẽ được đảm bảo. Nhưng có những điều kiện quá phức tạp để làm được như vậy, ví dụ chúng liên quan đến nhiều bảng cùng lúc. Và ngay cả khi một ràng buộc có thể được định nghĩa trong cơ sở dữ liệu nhưng vì lý do nào đó lại không được định nghĩa, thì điều đó cũng không có nghĩa là ràng buộc này được phép bị vi phạm.

Như vậy, tính nhất quán của dữ liệu chặt chẽ hơn tính toàn vẹn, nhưng hệ quản trị cơ sở dữ liệu không hề biết "nhất quán" thực sự có nghĩa là gì. Nếu một ứng dụng phá vỡ tính nhất quán mà không phá vỡ tính toàn vẹn, hệ quản trị cơ sở dữ liệu không có cách nào phát hiện ra. Do đó, chính ứng dụng phải đặt ra các tiêu chí về tính nhất quán của dữ liệu, và chúng ta phải tin rằng ứng dụng được viết đúng và sẽ không bao giờ có lỗi.

Nhưng nếu ứng dụng luôn chỉ thực thi các chuỗi câu lệnh đúng đắn, thì hệ quản trị cơ sở dữ liệu đóng vai trò gì ở đây?

Trước hết, một chuỗi câu lệnh đúng đắn có thể tạm thời phá vỡ tính nhất quán của dữ liệu, và — nghe có vẻ lạ — điều đó hoàn toàn bình thường.

Một ví dụ cũ rích nhưng dễ hiểu là việc chuyển tiền từ tài khoản này sang tài khoản khác. Quy tắc nhất quán có thể phát biểu như sau: *việc chuyển tiền không bao giờ được làm thay đổi tổng số dư của các tài khoản liên quan*. Khá khó (dù vẫn có thể) để phát biểu quy tắc này dưới dạng một ràng buộc toàn vẹn trong SQL, vì vậy hãy giả sử rằng nó được định nghĩa ở mức ứng dụng và hệ quản trị cơ sở dữ liệu không nhìn thấy nó. Một lần chuyển tiền gồm hai thao tác: thao tác thứ nhất rút một khoản tiền từ một tài khoản, còn thao tác thứ hai cộng khoản tiền này vào một tài khoản khác. Thao tác thứ nhất phá vỡ tính nhất quán của dữ liệu, còn thao tác thứ hai khôi phục nó.

Nếu thao tác thứ nhất thành công nhưng thao tác thứ hai thì không (do một sự cố nào đó), tính nhất quán của dữ liệu sẽ bị phá vỡ. Những tình huống như vậy là không thể chấp nhận, nhưng việc phát hiện và xử lý chúng ở mức ứng dụng đòi hỏi rất nhiều công sức. May mắn là điều đó không cần thiết — vấn đề có thể được giải quyết trọn vẹn bởi chính hệ quản trị cơ sở dữ liệu nếu nó biết rằng hai thao tác này tạo thành một khối không thể chia cắt, tức là một *transaction* (giao dịch).

Nhưng ở đây còn một khía cạnh tinh tế hơn. Dù hoàn toàn đúng đắn khi chạy riêng lẻ, các transaction có thể bắt đầu hoạt động sai khi chạy song song. Đó là vì các thao tác thuộc về các transaction khác nhau thường bị đan xen vào nhau. Sẽ không có những vấn đề như vậy nếu hệ quản trị cơ sở dữ liệu hoàn tất mọi thao tác của một transaction rồi mới chuyển sang transaction tiếp theo, nhưng hiệu năng của việc thực thi tuần tự sẽ thấp đến mức khó tin.

> Việc thực thi các transaction thực sự đồng thời chỉ có thể đạt được trên các hệ thống có phần cứng phù hợp: bộ xử lý đa lõi, mảng đĩa, v.v. Nhưng lập luận tương tự cũng đúng với một server thực thi các lệnh tuần tự theo chế độ chia sẻ thời gian (time-sharing). Để khái quát hoá, cả hai tình huống này đôi khi được gọi chung là *thực thi đồng thời* (concurrent execution).

Các transaction đúng đắn nhưng hoạt động sai khi chạy cùng nhau sẽ dẫn đến các *anomaly* (bất thường) đồng thời, hay còn gọi là các *hiện tượng* (phenomena).

Đây là một ví dụ đơn giản. Để lấy được dữ liệu nhất quán từ cơ sở dữ liệu, tối thiểu ứng dụng không được nhìn thấy bất kỳ thay đổi nào do các transaction khác chưa commit tạo ra. Nếu không (trong trường hợp một số transaction bị rollback), nó sẽ nhìn thấy một trạng thái cơ sở dữ liệu chưa từng tồn tại. Anomaly như vậy được gọi là *dirty read* (đọc bẩn). Ngoài ra còn nhiều anomaly khác, phức tạp hơn.

Khi chạy các transaction đồng thời, cơ sở dữ liệu phải đảm bảo rằng kết quả của việc thực thi như vậy sẽ giống với kết quả của một trong các cách thực thi tuần tự có thể có. Nói cách khác, nó phải *cô lập* các transaction với nhau, qua đó xử lý mọi anomaly có thể xảy ra.

Tóm lại, transaction là một tập hợp các thao tác đưa cơ sở dữ liệu từ một trạng thái đúng sang một trạng thái đúng khác (*tính nhất quán*), với điều kiện nó được thực thi trọn vẹn (*tính nguyên tử*) và không bị ảnh hưởng bởi các transaction khác (*tính cô lập*). Định nghĩa này kết hợp các yêu cầu được ngụ ý bởi ba chữ cái đầu tiên của từ viết tắt ACID. Chúng đan xen chặt chẽ đến mức nên được thảo luận cùng nhau. Thực ra, yêu cầu về tính bền vững cũng khó mà tách riêng ra được *[→ tr. 164](10-write-ahead-log.md)*: sau một sự cố, hệ thống vẫn có thể chứa một số thay đổi do các transaction chưa commit tạo ra, và bạn phải làm gì đó với chúng để khôi phục tính nhất quán của dữ liệu.

Như vậy, hệ quản trị cơ sở dữ liệu giúp ứng dụng duy trì tính nhất quán của dữ liệu bằng cách tính đến ranh giới của các transaction, dù nó không hề biết về các quy tắc nhất quán được ngụ ý.

Đáng tiếc là tính cô lập hoàn toàn khó triển khai và có thể ảnh hưởng xấu đến hiệu năng. Hầu hết các hệ thống thực tế sử dụng các isolation level (mức cô lập) yếu hơn, ngăn chặn được một số anomaly nhưng không phải tất cả. Điều đó có nghĩa là công việc duy trì tính nhất quán của dữ liệu một phần rơi vào ứng dụng. Và đó chính là lý do vì sao rất quan trọng phải hiểu isolation level nào được sử dụng trong hệ thống, điều gì được đảm bảo ở mức này và điều gì không, và làm thế nào để đảm bảo code của bạn vẫn đúng trong những điều kiện như vậy.

## 2.2 Isolation level và anomaly trong chuẩn SQL (Isolation Levels and Anomalies in SQL Standard)

Chuẩn SQL quy định bốn isolation level.[^1] Các mức này được định nghĩa thông qua danh sách các anomaly có thể xảy ra hoặc không trong quá trình thực thi đồng thời các transaction. Vì vậy, khi nói về isolation level, chúng ta phải bắt đầu từ các anomaly.

Chúng ta cần nhớ rằng chuẩn là một cấu trúc lý thuyết: nó có ảnh hưởng đến thực tiễn, nhưng thực tiễn vẫn khác biệt với nó ở nhiều điểm. Đó là lý do tại sao mọi ví dụ ở đây đều mang tính giả định. Xoay quanh các transaction trên tài khoản ngân hàng, những ví dụ này khá dễ hiểu, nhưng tôi phải thừa nhận rằng chúng chẳng liên quan gì đến các nghiệp vụ ngân hàng thực tế.

Điều thú vị là lý thuyết cơ sở dữ liệu thực thụ cũng khác biệt với chuẩn: nó được phát triển sau khi chuẩn đã được thông qua, và khi đó thực tiễn đã đi trước khá xa.

### Lost Update

Anomaly *lost update* (mất cập nhật) xảy ra khi hai transaction cùng đọc một dòng của bảng, sau đó một transaction cập nhật dòng này, và cuối cùng transaction kia cập nhật cùng dòng đó mà không tính đến bất kỳ thay đổi nào do transaction thứ nhất thực hiện.

Giả sử hai transaction cùng định tăng số dư của một tài khoản thêm $100. Transaction thứ nhất đọc giá trị hiện tại ($1,000), sau đó transaction thứ hai đọc cùng giá trị đó. Transaction thứ nhất tăng số dư (thành $1,100) và ghi giá trị mới vào cơ sở dữ liệu. Transaction thứ hai làm điều tương tự: nó nhận được $1,100 sau khi tăng số dư và ghi giá trị này. Kết quả là khách hàng mất $100.

Chuẩn cấm lost update ở mọi isolation level.

### Dirty Read và Read Uncommitted (Dirty Reads and Read Uncommitted)

Anomaly *dirty read* xảy ra khi một transaction đọc các thay đổi chưa commit do một transaction khác thực hiện.

Ví dụ, transaction thứ nhất chuyển $100 vào một tài khoản trống nhưng không commit thay đổi này. Một transaction khác đọc trạng thái tài khoản (đã được cập nhật nhưng chưa commit) và cho phép khách hàng rút tiền — mặc dù sau đó transaction thứ nhất bị ngắt và các thay đổi của nó bị rollback, nên tài khoản thực ra vẫn trống.

Chuẩn cho phép dirty read ở mức `Read Uncommitted`.

### Non-Repeatable Read và Read Committed (Non-Repeatable Reads and Read Committed)

Anomaly *non-repeatable read* (đọc không lặp lại được) xảy ra khi một transaction đọc cùng một dòng hai lần, trong khi một transaction khác cập nhật (hoặc xoá) dòng này giữa hai lần đọc đó và commit thay đổi. Do đó, transaction thứ nhất nhận được các kết quả khác nhau.

Ví dụ, giả sử có một quy tắc nhất quán *cấm tài khoản ngân hàng có số dư âm*. Transaction thứ nhất định giảm số dư tài khoản đi $100. Nó kiểm tra giá trị hiện tại, nhận được $1,000, và quyết định rằng thao tác này có thể thực hiện. Cùng lúc đó, một transaction khác rút hết tiền khỏi tài khoản này và commit các thay đổi. Nếu transaction thứ nhất kiểm tra lại số dư vào thời điểm này, nó sẽ nhận được $0 (nhưng quyết định rút tiền đã được đưa ra, và thao tác này gây ra tình trạng thấu chi).

Chuẩn cho phép non-repeatable read ở các mức `Read Uncommitted` và `Read Committed`.

### Phantom Read và Repeatable Read (Phantom Reads and Repeatable Read)

Anomaly *phantom read* (đọc bóng ma) xảy ra khi cùng một transaction thực thi hai truy vấn giống hệt nhau trả về tập các dòng thoả mãn một điều kiện cụ thể, trong khi một transaction khác thêm một số dòng khác cũng thoả mãn điều kiện này và commit các thay đổi trong khoảng thời gian giữa hai truy vấn đó. Kết quả là transaction thứ nhất nhận được hai tập dòng khác nhau.

Ví dụ, giả sử có một quy tắc nhất quán *cấm một khách hàng có nhiều hơn ba tài khoản*. Transaction thứ nhất định mở một tài khoản mới, vì vậy nó kiểm tra xem hiện có bao nhiêu tài khoản (giả sử có hai) và quyết định rằng thao tác này có thể thực hiện. Ngay lúc đó, transaction thứ hai cũng mở một tài khoản mới cho khách hàng này và commit các thay đổi. Nếu transaction thứ nhất kiểm tra lại số tài khoản đang mở, nó sẽ nhận được ba (nhưng nó đã đang mở thêm một tài khoản nữa, và rốt cuộc khách hàng có bốn tài khoản).

Chuẩn cho phép phantom read ở các isolation level `Read Uncommitted`, `Read Committed` và `Repeatable Read`.

### Không có anomaly và Serializable (No Anomalies and Serializable)

Chuẩn cũng định nghĩa mức `Serializable`, mức không cho phép bất kỳ anomaly nào. Điều này không giống với việc cấm lost update cùng dirty read, non-repeatable read và phantom read. Thực tế, số anomaly đã biết nhiều hơn rất nhiều so với những gì chuẩn nêu ra, và còn một số lượng chưa biết các anomaly chưa được phát hiện.

Mức `Serializable` phải ngăn chặn *mọi* anomaly. Điều đó có nghĩa là nhà phát triển ứng dụng không cần phải bận tâm đến tính cô lập. Nếu các transaction thực thi các chuỗi câu lệnh đúng đắn khi chạy riêng lẻ, thì việc thực thi đồng thời cũng không thể phá vỡ tính nhất quán của dữ liệu.

Để minh hoạ ý tưởng này, tôi sẽ dùng một bảng nổi tiếng có trong chuẩn; cột cuối cùng được thêm vào đây cho rõ ràng:

|  | lost update | dirty read | non-repeatable read | phantom read | các anomaly khác |
|---|---|---|---|---|---|
| Read Uncommitted | — | có | có | có | có |
| Read Committed | — | — | có | có | có |
| Repeatable Read | — | — | — | có | có |
| Serializable | — | — | — | — | — |

### Tại sao lại là những anomaly này? (Why These Anomalies?)

Trong tất cả các anomaly có thể có, tại sao chuẩn chỉ nhắc đến một số, và tại sao lại chính là những anomaly này?

Dường như không ai biết chắc chắn. Nhưng rất có thể các anomaly khác đơn giản là chưa được xem xét khi các phiên bản đầu tiên của chuẩn được thông qua, vì khi đó lý thuyết còn tụt hậu rất xa so với thực tiễn.

Bên cạnh đó, người ta đã giả định rằng tính cô lập phải dựa trên lock (khoá). *Giao thức khoá hai pha* (two-phase locking protocol, 2PL) được sử dụng rộng rãi yêu cầu các transaction khoá các dòng bị tác động trong quá trình thực thi và giải phóng các lock khi hoàn tất. Nói một cách đơn giản, transaction lấy càng nhiều lock thì càng được cô lập tốt khỏi các transaction khác. Và do đó, hiệu năng hệ thống càng kém, vì các transaction bắt đầu xếp hàng để truy cập vào cùng các dòng thay vì chạy đồng thời.

Tôi tin rằng ở mức độ lớn, sự khác biệt giữa các isolation level chuẩn được xác định bởi số lượng lock cần thiết để triển khai chúng.

Nếu các dòng cần cập nhật được khoá khi ghi nhưng không khoá khi đọc, chúng ta có isolation level `Read Uncommitted`, cho phép đọc dữ liệu trước khi nó được commit.

Nếu các dòng cần cập nhật được khoá cả khi đọc lẫn khi ghi, chúng ta có mức `Read Committed`: không được phép đọc dữ liệu chưa commit, nhưng một truy vấn có thể trả về các giá trị khác nhau nếu được chạy nhiều lần (non-repeatable read).

Khoá cả các dòng cần đọc lẫn các dòng cần cập nhật cho mọi thao tác sẽ cho chúng ta mức `Repeatable Read`: một truy vấn lặp lại sẽ trả về cùng kết quả.

Tuy nhiên, mức `Serializable` đặt ra một vấn đề: không thể khoá một dòng chưa tồn tại. Điều này để ngỏ khả năng xảy ra phantom read: một transaction có thể thêm một dòng thoả mãn điều kiện của truy vấn trước đó, và dòng này sẽ xuất hiện trong kết quả của truy vấn tiếp theo.

Như vậy, các lock thông thường không thể cung cấp tính cô lập hoàn toàn: để đạt được nó, chúng ta phải khoá các điều kiện (vị từ — predicate) thay vì các dòng. Các predicate lock như vậy đã được giới thiệu từ năm 1976 khi System R đang được phát triển; tuy nhiên, khả năng áp dụng thực tế của chúng chỉ giới hạn ở các điều kiện đơn giản mà ở đó có thể xác định rõ liệu hai vị từ khác nhau có thể xung đột hay không. Theo như tôi biết, predicate lock theo đúng hình thức dự định của nó chưa bao giờ được triển khai trong bất kỳ hệ thống nào. *[→ tr. 235](14-miscellaneous-locks.md)*

## 2.3 Isolation level trong PostgreSQL (Isolation Levels in PostgreSQL)

Theo thời gian, các giao thức quản lý transaction dựa trên lock đã được thay thế bằng giao thức *Snapshot Isolation* (SI). Ý tưởng của cách tiếp cận này là mỗi transaction truy cập vào một snapshot (ảnh chụp dữ liệu) nhất quán của dữ liệu như nó đã tồn tại tại một thời điểm cụ thể. Snapshot bao gồm mọi thay đổi hiện hành đã được commit trước khi snapshot được tạo.

Snapshot isolation giảm thiểu số lượng lock cần thiết. Thực tế, một dòng chỉ bị khoá bởi các nỗ lực cập nhật đồng thời *[→ tr. 210](13-row-level-locks.md)*. Trong mọi trường hợp khác, các thao tác có thể được thực thi đồng thời: việc ghi không bao giờ khoá việc đọc, và việc đọc không bao giờ khoá bất cứ thứ gì.

PostgreSQL sử dụng một biến thể *đa phiên bản* (multiversion) của giao thức SI. Điều khiển đồng thời đa phiên bản (multiversion concurrency control) ngụ ý rằng tại bất kỳ thời điểm nào, hệ quản trị cơ sở dữ liệu có thể chứa nhiều phiên bản của cùng một dòng, vì vậy PostgreSQL có thể đưa phiên bản thích hợp vào snapshot thay vì abort các transaction cố đọc dữ liệu cũ.

Dựa trên snapshot, tính cô lập trong PostgreSQL khác với các yêu cầu được quy định trong chuẩn — thực ra nó còn chặt chẽ hơn. Dirty read bị cấm ngay từ thiết kế. Về mặt kỹ thuật, bạn có thể chỉ định mức `Read Uncommitted`, nhưng hành vi của nó sẽ giống như `Read Committed`, vì vậy tôi sẽ không nhắc đến mức này nữa. `Repeatable Read` không cho phép cả non-repeatable read lẫn phantom read (mặc dù nó không đảm bảo tính cô lập hoàn toàn) *[→ tr. 133](07-freezing.md)*. Nhưng *trong một số trường hợp*, có nguy cơ mất thay đổi ở mức `Read Committed`.

|  | lost update | dirty read | non-repeatable read | phantom read | các anomaly khác |
|---|---|---|---|---|---|
| Read Committed | có | — | có | có | có |
| Repeatable Read | — | — | — | — | có |
| Serializable | — | — | — | — | — |

Trước khi tìm hiểu các cơ chế bên trong của tính cô lập, hãy thảo luận về từng isolation level trong ba mức *[→ tr. 80](04-snapshots.md)* từ góc nhìn của người dùng.

Với mục đích này, chúng ta sẽ tạo bảng `accounts`; Alice và Bob mỗi người sẽ có $1,000, nhưng Bob sẽ có hai tài khoản:

```
=> CREATE TABLE accounts(
  id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  client text,
  amount numeric
);
=> INSERT INTO accounts VALUES
  (1, 'alice', 1000.00), (2, 'bob', 100.00), (3, 'bob', 900.00);
```

### Read Committed

**Không có dirty read.** Có thể dễ dàng kiểm tra rằng việc đọc dữ liệu bẩn là không được phép. Hãy bắt đầu một transaction. Theo mặc định, nó sử dụng isolation level `Read Committed`[^2]:

```
=> BEGIN;
=> SHOW transaction_isolation;
 transaction_isolation
-----------------------
 read committed
(1 row)
```

Chính xác hơn, mức mặc định được thiết lập bởi parameter sau, có thể thay đổi khi cần:

```
=> SHOW default_transaction_isolation;
 default_transaction_isolation
-------------------------------
 read committed
(1 row)
```

Transaction vừa mở rút một khoản tiền từ tài khoản khách hàng nhưng chưa commit các thay đổi này. Tuy vậy, nó sẽ nhìn thấy các thay đổi của chính mình, vì điều này luôn được phép:

```
=> UPDATE accounts SET amount = amount - 200 WHERE id = 1;
=> SELECT * FROM accounts WHERE client = 'alice';
 id | client | amount
----+--------+--------
  1 | alice  | 800.00
(1 row)
```

Trong phiên thứ hai, chúng ta bắt đầu một transaction khác cũng sẽ chạy ở mức `Read Committed`:

> ```
> => BEGIN;
> => SELECT * FROM accounts WHERE client = 'alice';
>  id | client | amount
> ----+--------+---------
>   1 | alice  | 1000.00
> (1 row)
> ```

Đúng như dự đoán, transaction thứ hai không nhìn thấy bất kỳ thay đổi chưa commit nào — dirty read bị cấm.

**Non-repeatable read.** Bây giờ hãy để transaction thứ nhất commit các thay đổi. Sau đó transaction thứ hai sẽ lặp lại cùng truy vấn:

```
=> COMMIT;
```

> ```
> => SELECT * FROM accounts WHERE client = 'alice';
>  id | client | amount
> ----+--------+--------
>   1 | alice  | 800.00
> (1 row)
> => COMMIT;
> ```

Truy vấn nhận được phiên bản đã cập nhật của dữ liệu — và đó chính xác là điều được hiểu là anomaly *non-repeatable read*, vốn được phép ở mức `Read Committed`.

Một bài học thực tế: trong một transaction, bạn không được đưa ra bất kỳ quyết định nào dựa trên dữ liệu đọc được bởi câu lệnh trước đó, vì mọi thứ đều có thể thay đổi ở giữa. Đây là một ví dụ mà các biến thể của nó xuất hiện trong code ứng dụng thường xuyên đến mức có thể coi là một anti-pattern kinh điển:

```
IF (SELECT amount FROM accounts WHERE id = 1) >= 1000 THEN
  UPDATE accounts SET amount = amount - 1000 WHERE id = 1;
END IF;
```

Trong khoảng thời gian giữa lúc kiểm tra và lúc cập nhật, các transaction khác có thể tự do thay đổi trạng thái tài khoản, vì vậy việc "kiểm tra" như thế hoàn toàn vô ích. Để dễ hiểu hơn, bạn có thể hình dung rằng các câu lệnh ngẫu nhiên của các transaction khác được "chèn" vào giữa các câu lệnh của transaction hiện tại. Ví dụ, như thế này:

```
IF (SELECT amount FROM accounts WHERE id = 1) >= 1000 THEN
```

> ```
> UPDATE accounts SET amount = amount - 200 WHERE id = 1;
> COMMIT;
> ```

```
  UPDATE accounts SET amount = amount - 1000 WHERE id = 1;
END IF;
```

Nếu mọi thứ hỏng ngay khi các câu lệnh bị sắp xếp lại, thì code đó sai. Đừng tự lừa mình rằng bạn sẽ không bao giờ gặp rắc rối này: điều gì có thể sai thì sẽ sai. Những lỗi như vậy rất khó tái hiện, và do đó, sửa chúng là một thử thách thực sự.

Làm thế nào để sửa code này? Có một vài lựa chọn:

- Thay code thủ tục bằng code khai báo.

- Ví dụ, trong trường hợp cụ thể này, dễ dàng biến câu lệnh `IF` thành một ràng buộc `CHECK`:

```
ALTER TABLE accounts
  ADD CHECK amount >= 0;
```

Bây giờ bạn không cần bất kỳ kiểm tra nào trong code: chỉ cần chạy lệnh và xử lý ngoại lệ sẽ được phát sinh nếu có ý định vi phạm ràng buộc toàn vẹn.

- Sử dụng một câu lệnh SQL duy nhất.

- Tính nhất quán của dữ liệu có thể bị tổn hại nếu một transaction được commit trong khoảng hở thời gian giữa các câu lệnh của một transaction khác, qua đó làm thay đổi khả năng nhìn thấy dữ liệu. Nếu chỉ có một câu lệnh thì không có những khoảng hở như vậy.

- PostgreSQL có đủ khả năng để giải quyết các tác vụ phức tạp chỉ bằng một câu lệnh SQL. Cụ thể, nó cung cấp common table expression (CTE) có thể chứa các câu lệnh như `INSERT`, `UPDATE`, `DELETE`, cũng như câu lệnh `INSERT ON CONFLICT` triển khai logic sau: chèn dòng nếu nó chưa tồn tại, ngược lại thì thực hiện cập nhật.

- Áp dụng lock tường minh.

- Giải pháp cuối cùng là tự đặt một exclusive lock lên tất cả các dòng cần thiết (`SELECT` `FOR UPDATE`) *[→ tr. 210](13-row-level-locks.md)* hoặc thậm chí lên toàn bộ bảng (`LOCK TABLE`) *[→ tr. 204](12-relation-level-locks.md)*. Cách tiếp cận này luôn hiệu quả, nhưng nó triệt tiêu mọi ưu điểm của MVCC: một số thao tác lẽ ra có thể được thực thi đồng thời sẽ phải chạy tuần tự.

**Read skew.** Tuy nhiên, mọi chuyện không đơn giản như vậy. Cách triển khai của PostgreSQL cho phép những anomaly khác, ít được biết đến hơn, không được chuẩn quy định.

Giả sử transaction thứ nhất đã bắt đầu chuyển tiền giữa các tài khoản của Bob:

```
=> BEGIN;
=> UPDATE accounts SET amount = amount - 100 WHERE id = 2;
```

Trong khi đó, transaction kia bắt đầu duyệt qua tất cả các tài khoản của Bob để tính tổng số dư. Nó bắt đầu với tài khoản thứ nhất (tất nhiên là nhìn thấy trạng thái cũ của nó):

> ```
> => BEGIN;
> => SELECT amount FROM accounts WHERE id = 2;
>  amount
> --------
>  100.00
> (1 row)
> ```

Vào lúc này, transaction thứ nhất hoàn tất thành công:

```
=> UPDATE accounts SET amount = amount + 100 WHERE id = 3;
=> COMMIT;
```

Transaction thứ hai đọc trạng thái của tài khoản thứ hai (và nhìn thấy giá trị đã được cập nhật):

> ```
> => SELECT amount FROM accounts WHERE id = 3;
>  amount
> ---------
>  1000.00
> (1 row)
> => COMMIT;
> ```

Kết quả là transaction thứ hai nhận được $1,100 vì nó đã đọc dữ liệu không đúng. Anomaly như vậy được gọi là *read skew* (đọc lệch).

Làm thế nào để tránh anomaly này ở mức `Read Committed`? Câu trả lời rất rõ ràng: sử dụng một câu lệnh duy nhất. Ví dụ, như thế này:

```
SELECT sum(amount) FROM accounts WHERE client = 'bob';
```

Từ đầu đến giờ tôi vẫn khẳng định rằng khả năng nhìn thấy dữ liệu chỉ có thể thay đổi giữa các câu lệnh, nhưng có thực sự như vậy không? Nếu truy vấn chạy trong thời gian dài thì sao? Trong trường hợp đó, liệu nó có thể nhìn thấy các phần dữ liệu khác nhau ở các trạng thái khác nhau không?

Hãy kiểm tra xem. Một cách thuận tiện để làm điều này là thêm độ trễ vào câu lệnh bằng cách gọi hàm `pg_sleep`. Khi đó dòng đầu tiên sẽ được đọc ngay lập tức, nhưng dòng thứ hai sẽ phải đợi hai giây:

```
=> SELECT amount, pg_sleep(2) -- two seconds
FROM accounts WHERE client = 'bob';
```

Trong khi câu lệnh này đang được thực thi, hãy bắt đầu một transaction khác để chuyển tiền ngược lại:

> ```
> => BEGIN;
> => UPDATE accounts SET amount = amount + 100 WHERE id = 2;
> => UPDATE accounts SET amount = amount - 100 WHERE id = 3;
> => COMMIT;
> ```

Kết quả cho thấy câu lệnh đã nhìn thấy toàn bộ dữ liệu ở trạng thái tương ứng với thời điểm bắt đầu thực thi của nó, điều này chắc chắn là đúng:

```
 amount  | pg_sleep
---------+----------
    0.00 |
 1000.00 |
(2 rows)
```

Nhưng mọi chuyện cũng không đơn giản như vậy. Nếu truy vấn chứa một hàm được khai báo là `VOLATILE`, và hàm này thực thi một truy vấn khác, thì dữ liệu mà truy vấn lồng nhau này nhìn thấy sẽ không nhất quán với kết quả của truy vấn chính.

Hãy kiểm tra số dư các tài khoản của Bob bằng hàm sau:

```
=> CREATE FUNCTION get_amount(id integer) RETURNS numeric
AS $$
  SELECT amount FROM accounts a WHERE a.id = get_amount.id;
$$ VOLATILE LANGUAGE sql;
=> SELECT get_amount(id), pg_sleep(2)
FROM accounts WHERE client = 'bob';
```

Chúng ta sẽ lại chuyển tiền giữa các tài khoản trong khi truy vấn bị trì hoãn của chúng ta đang được thực thi:

> ```
> => BEGIN;
> => UPDATE accounts SET amount = amount + 100 WHERE id = 2;
> => UPDATE accounts SET amount = amount - 100 WHERE id = 3;
> => COMMIT;
> ```

Trong trường hợp này, chúng ta sẽ nhận được dữ liệu không nhất quán — $100 đã bị mất:

```
 get_amount | pg_sleep
------------+----------
     100.00 |
     800.00 |
(2 rows)
```

Tôi muốn nhấn mạnh rằng hiệu ứng này chỉ có thể xảy ra ở isolation level `Read Committed`, và chỉ khi hàm là `VOLATILE`. Rắc rối là PostgreSQL sử dụng chính isolation level này và chính loại volatility này theo mặc định. Vì vậy chúng ta phải thừa nhận rằng cái bẫy được giăng ra một cách rất tinh quái.

**Read skew thay cho lost update.** Anomaly read skew cũng có thể xảy ra trong một câu lệnh duy nhất khi cập nhật — dù theo một cách có phần bất ngờ.

Hãy xem điều gì xảy ra nếu hai transaction cố sửa đổi cùng một dòng. Bob hiện có tổng cộng $1,000 trong hai tài khoản:

```
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client | amount
----+--------+--------
  2 | bob    | 200.00
  3 | bob    | 800.00
(2 rows)
```

Bắt đầu một transaction sẽ giảm số dư của Bob:

```
=> BEGIN;
=> UPDATE accounts SET amount = amount - 100 WHERE id = 3;
```

Cùng lúc đó, transaction kia sẽ tính lãi cho tất cả các tài khoản của những khách hàng có tổng số dư từ $1,000 trở lên:

> ```
> => UPDATE accounts SET amount = amount * 1.01
> WHERE client IN (
>   SELECT client
>   FROM accounts
> ```

> ```
>   GROUP BY client
>   HAVING sum(amount) >= 1000
> );
> ```

Việc thực thi câu lệnh `UPDATE` về cơ bản gồm hai giai đoạn. Đầu tiên, các dòng cần cập nhật được chọn dựa trên điều kiện đã cho. Vì transaction thứ nhất chưa commit, transaction thứ hai không thể nhìn thấy kết quả của nó, nên việc chọn các dòng để tính lãi không bị ảnh hưởng. Như vậy, các tài khoản của Bob thoả mãn điều kiện, và số dư của anh ấy phải được tăng thêm $10 khi thao tác `UPDATE` hoàn tất.

Ở giai đoạn thứ hai, các dòng được chọn được cập nhật lần lượt từng dòng một. Transaction thứ hai phải đợi vì dòng có `id = 3` đang bị khoá: nó đang được cập nhật bởi transaction thứ nhất.

Trong khi đó, transaction thứ nhất commit các thay đổi của nó:

```
=> COMMIT;
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client |  amount
----+--------+----------
  2 | bob    | 202.0000
  3 | bob    | 707.0000
(2 rows)
```

Một mặt, lệnh `UPDATE` không được nhìn thấy bất kỳ thay đổi nào do transaction thứ nhất thực hiện. Nhưng mặt khác, nó không được làm mất bất kỳ thay đổi nào đã được commit.

Khi lock được giải phóng, câu lệnh `UPDATE` *đọc lại* dòng cần cập nhật (nhưng chỉ dòng này thôi!) *[→ tr. 219](13-row-level-locks.md)*. Kết quả là Bob nhận được $9 tiền lãi, dựa trên tổng số $900. Nhưng nếu anh ấy chỉ có $900 thì ngay từ đầu các tài khoản của anh ấy đã không nên được đưa vào kết quả truy vấn.

Như vậy, transaction của chúng ta đã trả về dữ liệu không đúng: các dòng khác nhau được đọc từ các snapshot khác nhau. Thay vì lost update, chúng ta lại quan sát thấy anomaly read skew.

**Lost update.** Tuy nhiên, thủ thuật đọc lại dòng bị khoá sẽ không giúp chống lại lost update nếu dữ liệu được sửa đổi bởi các câu lệnh SQL khác nhau.

Đây là một ví dụ chúng ta đã thấy *[→ tr. 41](02-isolation.md)*. Ứng dụng đọc và ghi nhận lại (bên ngoài cơ sở dữ liệu) số dư hiện tại của tài khoản Alice:

```
=> BEGIN;
=> SELECT amount FROM accounts WHERE id = 1;
 amount
--------
 800.00
(1 row)
```

Trong khi đó, transaction kia cũng làm điều tương tự:

> ```
> => BEGIN;
> => SELECT amount FROM accounts WHERE id = 1;
>  amount
> --------
>  800.00
> (1 row)
> ```

Transaction thứ nhất tăng giá trị đã ghi nhận trước đó thêm $100 và commit thay đổi này:

```
=> UPDATE accounts SET amount = 800.00 + 100 WHERE id = 1
RETURNING amount;
 amount
--------
 900.00
(1 row)
UPDATE 1
=> COMMIT;
```

Transaction thứ hai cũng làm như vậy:

> ```
> => UPDATE accounts SET amount = 800.00 + 100 WHERE id = 1
> RETURNING amount;
>  amount
> --------
>  900.00
> (1 row)
> UPDATE 1
> => COMMIT;
> ```

Thật không may, Alice đã mất $100. Hệ quản trị cơ sở dữ liệu không biết rằng giá trị $800 đã ghi nhận bằng cách nào đó có liên quan đến `accounts.amount`, vì vậy nó không thể ngăn chặn anomaly lost update. Ở isolation level `Read Committed`, code này là sai.

### Repeatable Read

**Không có non-repeatable read và phantom read.** Đúng như tên gọi, isolation level `Repeatable Read`[^3] phải đảm bảo việc đọc có thể lặp lại. Hãy kiểm tra điều đó và đảm bảo rằng phantom read cũng không thể xảy ra. Với mục đích này, chúng ta sẽ bắt đầu một transaction đưa các tài khoản của Bob về trạng thái trước đó và tạo một tài khoản mới cho Charlie:

```
=> BEGIN;
=> UPDATE accounts SET amount = 200.00 WHERE id = 2;
=> UPDATE accounts SET amount = 800.00 WHERE id = 3;
=> INSERT INTO accounts VALUES
  (4, 'charlie', 100.00);
=> SELECT * FROM accounts ORDER BY id;
 id | client  | amount
----+---------+--------
  1 | alice   | 900.00
  2 | bob     | 200.00
  3 | bob     | 800.00
  4 | charlie | 100.00
(4 rows)
```

Trong phiên thứ hai, hãy bắt đầu một transaction khác, với mức `Repeatable Read` được chỉ định tường minh trong lệnh `BEGIN` (mức của transaction thứ nhất không quan trọng):

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ;
> => SELECT * FROM accounts ORDER BY id;
>  id | client |  amount
> ----+--------+----------
>   1 | alice  |   900.00
>   2 | bob    | 202.0000
>   3 | bob    | 707.0000
> (3 rows)
> ```

Bây giờ transaction thứ nhất commit các thay đổi của nó, và transaction thứ hai lặp lại cùng truy vấn:

```
=> COMMIT;
```

> ```
> => SELECT * FROM accounts ORDER BY id;
>  id | client |  amount
> ----+--------+----------
>   1 | alice  |   900.00
>   2 | bob    | 202.0000
>   3 | bob    | 707.0000
> (3 rows)
> => COMMIT;
> ```

Transaction thứ hai vẫn nhìn thấy cùng dữ liệu như trước: cả dòng mới lẫn các cập nhật dòng đều không hiển thị. Ở isolation level này, bạn không phải lo lắng rằng điều gì đó sẽ thay đổi giữa các câu lệnh.

**Serialization failure thay cho lost update.** Như chúng ta đã thấy *[→ tr. 50](02-isolation.md)*, nếu hai transaction cập nhật cùng một dòng ở mức `Read Committed`, điều đó có thể gây ra anomaly read skew:

transaction đang chờ phải đọc lại dòng bị khoá, vì vậy nó nhìn thấy trạng thái của dòng này tại một thời điểm khác so với các dòng khác.

Anomaly như vậy không được phép ở isolation level `Repeatable Read`, và nếu nó xảy ra, transaction chỉ có thể bị abort với một serialization failure (lỗi tuần tự hoá). Hãy kiểm tra bằng cách lặp lại kịch bản tính lãi:

```
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client | amount
----+--------+--------
  2 | bob    | 200.00
  3 | bob    | 800.00
(2 rows)
=> BEGIN;
=> UPDATE accounts SET amount = amount - 100.00 WHERE id = 3;
```

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ;
> => UPDATE accounts SET amount = amount * 1.01
> WHERE client IN (
>   SELECT client
>   FROM accounts
>   GROUP BY client
>   HAVING sum(amount) >= 1000
> );
> ```

```
=> COMMIT;
```

> ```
> ERROR:  could not serialize access due to concurrent update
> => ROLLBACK;
> ```

Dữ liệu vẫn nhất quán:

```
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client | amount
----+--------+--------
  2 | bob    | 200.00
  3 | bob    | 700.00
(2 rows)
```

Lỗi tương tự sẽ được phát sinh bởi bất kỳ cập nhật dòng đồng thời nào, ngay cả khi chúng tác động đến các cột khác nhau.

Chúng ta cũng sẽ gặp lỗi này nếu cố cập nhật số dư dựa trên giá trị đã lưu trước đó:

```
=> BEGIN ISOLATION LEVEL REPEATABLE READ;
=> SELECT amount FROM accounts WHERE id = 1;
 amount
--------
 900.00
(1 row)
```

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ;
> => SELECT amount FROM accounts WHERE id = 1;
>  amount
> --------
>  900.00
> (1 row)
> ```

```
=> UPDATE accounts SET amount = 900.00 + 100.00 WHERE id = 1
RETURNING amount;
 amount
---------
 1000.00
(1 row)
UPDATE 1
=> COMMIT;
```

> ```
> => UPDATE accounts SET amount = 900.00 + 100.00 WHERE id = 1
> RETURNING amount;
> ERROR:  could not serialize access due to concurrent update
> => ROLLBACK;
> ```

Một bài học thực tế: nếu ứng dụng của bạn sử dụng isolation level `Repeatable Read` cho các transaction ghi, nó phải sẵn sàng thực hiện lại các transaction đã kết thúc với serialization failure. Với các transaction chỉ đọc, kết cục như vậy là không thể xảy ra.

**Write skew.** Như chúng ta đã thấy, cách PostgreSQL triển khai isolation level `Repeatable Read` ngăn chặn mọi anomaly được mô tả trong chuẩn. Nhưng không phải mọi anomaly có thể có: không ai biết có bao nhiêu anomaly như vậy. Tuy nhiên, có một sự thật quan trọng đã được chứng minh chắc chắn: snapshot isolation *chỉ* không ngăn chặn được *hai* anomaly, bất kể còn bao nhiêu anomaly khác tồn tại.

Anomaly thứ nhất là *write skew* (ghi lệch).

Hãy định nghĩa quy tắc nhất quán sau: *được phép có số dư âm ở một số tài khoản của khách hàng miễn là tổng số dư không âm*.

Transaction thứ nhất lấy tổng số dư các tài khoản của Bob:

```
=> BEGIN ISOLATION LEVEL REPEATABLE READ;
=> SELECT sum(amount) FROM accounts WHERE client = 'bob';
  sum
--------
 900.00
(1 row)
```

Transaction thứ hai nhận được cùng tổng đó:

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ;
> => SELECT sum(amount) FROM accounts WHERE client = 'bob';
>   sum
> --------
>  900.00
> (1 row)
> ```

Transaction thứ nhất cho rằng, một cách hợp lý, nó có thể trừ $600 từ một trong các tài khoản:

```
=> UPDATE accounts SET amount = amount - 600.00 WHERE id = 2;
```

Transaction thứ hai đi đến cùng kết luận, nhưng trừ tiền từ tài khoản còn lại:

> ```
> => UPDATE accounts SET amount = amount - 600.00 WHERE id = 3;
> => COMMIT;
> ```

```
=> COMMIT;
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client | amount
----+--------+---------
  2 | bob    | -400.00
  3 | bob    |  100.00
(2 rows)
```

Tổng số dư của Bob giờ đã âm, mặc dù cả hai transaction đều sẽ đúng nếu được chạy riêng rẽ.

**Anomaly của transaction chỉ đọc.** Anomaly *read-only transaction* (transaction chỉ đọc) là anomaly thứ hai và cũng là cuối cùng được phép ở isolation level `Repeatable Read`. Để quan sát anomaly này, chúng ta phải chạy ba transaction: hai trong số đó sẽ cập nhật dữ liệu, còn transaction thứ ba sẽ chỉ đọc.

Nhưng trước tiên hãy khôi phục số dư của Bob:

```
=> UPDATE accounts SET amount = 900.00 WHERE id = 2;
=> SELECT * FROM accounts WHERE client = 'bob';
 id | client | amount
----+--------+--------
  3 | bob    | 100.00
  2 | bob    | 900.00
(2 rows)
```

Transaction thứ nhất tính tiền lãi cần cộng dựa trên tổng số dư của Bob và cộng khoản tiền này vào một trong các tài khoản của anh ấy:

```
=> BEGIN ISOLATION LEVEL REPEATABLE READ; -- 1
=> UPDATE accounts SET amount = amount + (
  SELECT sum(amount) FROM accounts WHERE client = 'bob'
) * 0.01
WHERE id = 2;
```

Sau đó transaction thứ hai rút một ít tiền từ tài khoản còn lại của Bob và commit thay đổi này:

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ; -- 2
> => UPDATE accounts SET amount = amount - 100.00 WHERE id = 3;
> => COMMIT;
> ```

Nếu transaction thứ nhất được commit vào thời điểm này, sẽ không có anomaly nào: chúng ta có thể coi như transaction thứ nhất được commit trước transaction thứ hai (nhưng không phải ngược lại — transaction thứ nhất đã nhìn thấy trạng thái của tài khoản có `id = 3` trước khi transaction thứ hai thực hiện bất kỳ cập nhật nào).

Nhưng hãy hình dung rằng đúng vào lúc này, chúng ta bắt đầu một transaction chỉ đọc để truy vấn một tài khoản không bị hai transaction đầu tác động:

> ```
> => BEGIN ISOLATION LEVEL REPEATABLE READ; -- 3
> => SELECT * FROM accounts WHERE client = 'alice';
>  id | client | amount
> ----+--------+---------
>   1 | alice  | 1000.00
> (1 row)
> ```

Và chỉ đến lúc này transaction thứ nhất mới được commit:

```
=> COMMIT;
```

Transaction thứ ba nên nhìn thấy trạng thái nào vào thời điểm này? Khi bắt đầu, nó có thể nhìn thấy các thay đổi do transaction thứ hai thực hiện (vốn đã được commit), nhưng không thấy các thay đổi của transaction thứ nhất (khi đó chưa được commit). Nhưng như chúng ta đã xác định, transaction thứ hai phải được coi như được bắt đầu sau transaction thứ nhất. Bất kỳ trạng thái nào mà transaction thứ ba nhìn thấy đều sẽ không nhất quán — đó chính là điều được hiểu là anomaly của transaction chỉ đọc:

> ```
> => SELECT * FROM accounts WHERE client = 'bob';
>  id | client | amount
> ----+--------+--------
>   2 | bob    | 900.00
>   3 | bob    |   0.00
> (2 rows)
> => COMMIT;
> ```

### Serializable

Isolation level `Serializable`[^4] ngăn chặn mọi anomaly có thể có. Về cơ bản, mức này được xây dựng trên nền snapshot isolation. Những anomaly không xảy ra ở isolation level `Repeatable Read` (như dirty read, non-repeatable read hay phantom read) cũng không thể xảy ra ở mức `Serializable`. Còn hai anomaly có xảy ra (write skew và anomaly của transaction chỉ đọc) sẽ được phát hiện theo một cách đặc biệt để abort transaction, gây ra serialization failure quen thuộc.

**Không có anomaly.** Hãy đảm bảo rằng kịch bản write skew của chúng ta rốt cuộc sẽ kết thúc bằng một serialization failure *[→ tr. 55](02-isolation.md)*:

```
=> BEGIN ISOLATION LEVEL SERIALIZABLE;
=> SELECT sum(amount) FROM accounts WHERE client = 'bob';
   sum
----------
 910.0000
(1 row)
```

> ```
> => BEGIN ISOLATION LEVEL SERIALIZABLE;
> => SELECT sum(amount) FROM accounts WHERE client = 'bob';
>    sum
> ----------
>  910.0000
> (1 row)
> ```

```
=> UPDATE accounts SET amount = amount - 600.00 WHERE id = 2;
```

> ```
> => UPDATE accounts SET amount = amount - 600.00 WHERE id = 3;
> => COMMIT;
> COMMIT
> ```

```
=> COMMIT;
ERROR:  could not serialize access due to read/write dependencies
among transactions
DETAIL:  Reason code: Canceled on identification as a pivot, during
commit attempt.
HINT:  The transaction might succeed if retried.
```

Kịch bản với anomaly của transaction chỉ đọc cũng sẽ dẫn đến cùng lỗi này.

**Trì hoãn transaction chỉ đọc.** Để tránh các tình huống mà một transaction chỉ đọc có thể gây ra anomaly làm tổn hại tính nhất quán của dữ liệu, PostgreSQL đưa ra một giải pháp thú vị: transaction này có thể được trì hoãn cho đến khi việc thực thi nó trở nên an toàn. Đây là trường hợp duy nhất mà một câu lệnh `SELECT` có thể bị chặn bởi các cập nhật dòng.

Chúng ta sẽ kiểm tra điều đó bằng cách lặp lại kịch bản đã minh hoạ anomaly của transaction chỉ đọc:

```
=> UPDATE accounts SET amount = 900.00 WHERE id = 2;
=> UPDATE accounts SET amount = 100.00 WHERE id = 3;
=> SELECT * FROM accounts WHERE client = 'bob' ORDER BY id;
 id | client | amount
----+--------+--------
  2 | bob    | 900.00
  3 | bob    | 100.00
(2 rows)
=> BEGIN ISOLATION LEVEL SERIALIZABLE; -- 1
=> UPDATE accounts SET amount = amount + (
  SELECT sum(amount) FROM accounts WHERE client = 'bob'
) * 0.01
WHERE id = 2;
```

> ```
> => BEGIN ISOLATION LEVEL SERIALIZABLE; -- 2
> => UPDATE accounts SET amount = amount - 100.00 WHERE id = 3;
> => COMMIT;
> ```

Hãy khai báo tường minh transaction thứ ba là `READ ONLY` và `DEFERRABLE`:

> ```
> => BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE; -- 3
> => SELECT * FROM accounts WHERE client = 'alice';
> ```

Nỗ lực chạy truy vấn sẽ chặn transaction — nếu không, nó đã gây ra một anomaly.

Và chỉ khi transaction thứ nhất được commit, transaction thứ ba mới có thể tiếp tục thực thi:

```
=> COMMIT;
```

> ```
>  id | client | amount
> ----+--------+---------
>   1 | alice  | 1000.00
> (1 row)
> => SELECT * FROM accounts WHERE client = 'bob';
>  id | client |  amount
> ----+--------+----------
>   2 | bob    | 910.0000
>   3 | bob    |     0.00
> (2 rows)
> => COMMIT;
> ```

Như vậy, nếu một ứng dụng sử dụng isolation level `Serializable`, nó phải sẵn sàng thực hiện lại các transaction đã kết thúc với serialization failure. (Mức `Repeatable Read` cũng đòi hỏi cách tiếp cận tương tự, trừ khi ứng dụng chỉ giới hạn ở các transaction chỉ đọc.)

Isolation level `Serializable` mang lại sự dễ dàng khi lập trình, nhưng cái giá phải trả là chi phí phụ trội phát sinh từ việc phát hiện anomaly và buộc chấm dứt một phần nhất định các transaction. Bạn có thể giảm tác động này bằng cách sử dụng tường minh mệnh đề `READ ONLY` khi khai báo các transaction chỉ đọc. Nhưng câu hỏi chính tất nhiên là tỷ lệ transaction bị abort lớn đến mức nào — vì các transaction này sẽ phải được thực hiện lại. Sẽ không quá tệ nếu PostgreSQL chỉ abort những transaction dẫn đến xung đột dữ liệu và thực sự không tương thích. Nhưng một cách tiếp cận như vậy chắc chắn sẽ quá tốn tài nguyên, vì nó đòi hỏi phải theo dõi các thao tác trên từng dòng.

Cách triển khai hiện tại cho phép dương tính giả: PostgreSQL có thể abort một số transaction hoàn toàn an toàn nhưng đơn giản là không gặp may *[→ tr. 235](14-miscellaneous-locks.md)*. "Vận may" của chúng phụ thuộc vào nhiều yếu tố, chẳng hạn sự hiện diện của các index thích hợp hoặc lượng RAM sẵn có, vì vậy khó dự đoán trước hành vi thực tế.

Nếu bạn sử dụng mức `Serializable`, nó phải được tuân thủ bởi tất cả các transaction của ứng dụng. Khi kết hợp với các mức khác, `Serializable` hoạt động như `Repeatable Read` mà không có bất kỳ thông báo nào. Vì vậy, nếu bạn quyết định sử dụng mức `Serializable`, sẽ hợp lý khi sửa giá trị parameter *default_transaction_isolation* *(mặc định: read committed)* cho phù hợp — dù ai đó vẫn có thể ghi đè nó bằng cách đặt tường minh một mức khác.

Ngoài ra còn có những hạn chế khác; ví dụ, các truy vấn chạy ở mức `Serializable` không thể được thực thi trên replica *(v. 12)*. Và mặc dù chức năng của mức này liên tục được cải thiện, những hạn chế và chi phí phụ trội hiện tại khiến nó kém hấp dẫn hơn.

## 2.4 Nên dùng isolation level nào? (Which Isolation Level to Use?)

`Read Committed` là isolation level mặc định trong PostgreSQL, và có vẻ đây là mức được sử dụng trong đại đa số ứng dụng. Mức này có thể thuận tiện vì nó chỉ cho phép abort transaction khi có sự cố; nó không abort bất kỳ transaction nào để bảo toàn tính nhất quán của dữ liệu. Nói cách khác, serialization failure không thể xảy ra, vì vậy bạn không phải lo việc thực hiện lại transaction.

Nhược điểm của mức này là số lượng lớn các anomaly có thể xảy ra, vốn đã được thảo luận chi tiết ở trên. Nhà phát triển phải luôn ghi nhớ chúng và viết code theo cách ngăn chặn sự xuất hiện của chúng. Nếu không thể định nghĩa mọi hành động cần thiết trong một câu lệnh SQL duy nhất, thì bạn phải dùng đến lock tường minh. Phần khó nhất là code rất khó kiểm thử để tìm các lỗi liên quan đến sự không nhất quán của dữ liệu; những lỗi như vậy có thể xuất hiện theo những cách không thể đoán trước và khó tái hiện, vì vậy chúng cũng rất khó sửa.

Isolation level `Repeatable Read` loại bỏ được một số vấn đề về sự không nhất quán, nhưng than ôi, không phải tất cả. Do đó, bạn không chỉ phải nhớ về các anomaly còn lại mà còn phải sửa đổi ứng dụng để xử lý đúng các serialization failure, điều này chắc chắn là bất tiện. Tuy nhiên, đối với các transaction chỉ đọc, mức này là sự bổ sung hoàn hảo cho mức `Read Committed`; nó có thể rất hữu ích cho các trường hợp như xây dựng báo cáo liên quan đến nhiều truy vấn SQL.

Và cuối cùng, isolation level `Serializable` cho phép bạn hoàn toàn không phải lo lắng về tính nhất quán của dữ liệu, điều này giúp đơn giản hoá việc viết code ở mức độ lớn. Điều duy nhất đòi hỏi ở ứng dụng là khả năng thực hiện lại bất kỳ transaction nào bị abort với serialization failure. Tuy nhiên, số lượng transaction bị abort và chi phí phụ trội đi kèm có thể làm giảm đáng kể thông lượng của hệ thống. Bạn cũng nên nhớ rằng mức `Serializable` không được hỗ trợ trên replica và không thể kết hợp với các isolation level khác.

[^1]: postgresql.org/docs/14/transaction-iso.html
[^2]: postgresql.org/docs/14/transaction-iso.html#XACT-READ-COMMITTED
[^3]: postgresql.org/docs/14/transaction-iso.html#XACT-REPEATABLE-READ
[^4]: postgresql.org/docs/14/transaction-iso.html#XACT-SERIALIZABLE
