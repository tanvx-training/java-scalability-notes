# Về cuốn sách này (About This Book)

> *Sách không được viết ra để người ta tin, mà để người ta đem ra chất vấn. — Umberto Eco, *Tên của đóa hồng (The Name of the Rose)**

## Cuốn sách này dành cho ai? (For Whom Is This Book?)

Cuốn sách này dành cho những ai không chịu bằng lòng với cách tiếp cận "hộp đen" khi làm việc với cơ sở dữ liệu. Nếu bạn ham học hỏi, không muốn mặc nhiên chấp nhận lời khuyên của chuyên gia và muốn tự mình tìm hiểu mọi thứ, hãy cùng đồng hành.

Tôi giả định rằng người đọc đã từng thử dùng PostgreSQL và có ít nhất một hiểu biết chung về cách nó hoạt động. Người dùng mới bắt đầu có thể thấy nội dung hơi khó. Chẳng hạn, tôi sẽ không nói gì về cách cài đặt server, nhập lệnh `psql` hay thiết lập các parameter cấu hình.

Tôi hy vọng cuốn sách cũng sẽ hữu ích cho những ai đã quen thuộc với một hệ quản trị cơ sở dữ liệu khác nhưng chuyển sang PostgreSQL và muốn hiểu chúng khác nhau như thế nào. Một cuốn sách như thế này hẳn đã giúp tôi tiết kiệm rất nhiều thời gian cách đây vài năm. Và đó chính là lý do cuối cùng tôi đã viết nó.

## Những gì cuốn sách này sẽ không mang lại (What This Book Will Not Provide)

Cuốn sách này không phải là một tuyển tập công thức. Bạn không thể tìm thấy các giải pháp làm sẵn cho mọi tình huống có thể xảy ra, nhưng nếu hiểu được các cơ chế bên trong của một hệ thống phức tạp, bạn sẽ có khả năng phân tích và đánh giá một cách có phê phán kinh nghiệm của người khác, rồi tự rút ra kết luận của riêng mình. Vì lý do này, tôi giải thích cả những chi tiết mà thoạt nhìn có vẻ không có ích lợi thực tế nào.

Nhưng cuốn sách này cũng không phải là một giáo trình hướng dẫn. Trong khi đi sâu vào một số lĩnh vực (những lĩnh vực mà bản thân tôi quan tâm hơn), nó có thể hoàn toàn không nói gì về những lĩnh vực khác.

Cuốn sách này càng không phải là tài liệu tra cứu. Tôi đã cố gắng viết chính xác, nhưng không nhằm mục đích thay thế tài liệu chính thức, vì vậy tôi có thể dễ dàng bỏ qua một số chi tiết mà tôi cho là không quan trọng. Trong bất kỳ tình huống nào chưa rõ ràng, hãy đọc tài liệu chính thức.

Cuốn sách này sẽ không dạy bạn cách phát triển lõi PostgreSQL. Tôi không đòi hỏi bất kỳ kiến thức nào về ngôn ngữ C, vì cuốn sách chủ yếu dành cho các quản trị viên cơ sở dữ liệu và các nhà phát triển ứng dụng. Nhưng tôi có đưa ra nhiều tham chiếu tới mã nguồn, nơi có thể cung cấp cho bạn bao nhiêu chi tiết tùy thích, thậm chí còn nhiều hơn thế.

## Những gì cuốn sách này mang lại (What This Book Does Provide)

Trong chương mở đầu, tôi lướt qua các khái niệm cơ sở dữ liệu chính, vốn sẽ là nền tảng cho toàn bộ phần trình bày tiếp theo. Tôi không kỳ vọng bạn sẽ thu được nhiều thông tin mới từ chương này nhưng vẫn đưa nó vào để hoàn thiện bức tranh tổng thể. Ngoài ra, phần tổng quan này có thể hữu ích cho những ai đang chuyển đổi từ các hệ quản trị cơ sở dữ liệu khác.

Phần I dành cho các vấn đề về tính nhất quán của dữ liệu và tính cô lập. Trước tiên tôi đề cập đến chúng từ góc nhìn của người dùng (bạn sẽ biết có những isolation level nào và hệ quả của chúng là gì), sau đó đi sâu vào cơ chế bên trong. Để làm được điều đó, tôi phải giải thích các chi tiết triển khai của multiversion concurrency control (điều khiển đồng thời đa phiên bản) và snapshot isolation, đặc biệt chú ý đến việc dọn dẹp các row version đã lỗi thời.

Phần II mô tả buffer cache và WAL, thứ được dùng để khôi phục tính nhất quán của dữ liệu sau sự cố.

Phần III đi vào chi tiết cấu trúc và cách sử dụng các loại lock khác nhau: lightweight lock cho RAM, heavyweight lock cho relation, và lock cấp dòng (row-level lock).

Phần IV giải thích cách server lập plan và thực thi các truy vấn SQL. Tôi sẽ cho bạn biết có những phương thức truy cập dữ liệu nào, những phương thức join nào có thể được sử dụng, và các statistics thu thập được áp dụng như thế nào.

Phần V mở rộng thảo luận về index từ B-tree đã được đề cập sang các access method khác. Tôi sẽ giải thích một số nguyên tắc chung về khả năng mở rộng, vốn xác định ranh giới giữa lõi của hệ thống đánh index, các index access method và các kiểu dữ liệu (điều sẽ dẫn chúng ta đến khái niệm operator class), rồi sau đó trình bày chi tiết từng access method hiện có.

PostgreSQL bao gồm nhiều extension "nội quan" (introspective), không được dùng trong công việc thường ngày nhưng cho chúng ta cơ hội nhìn vào hành vi bên trong của server. Cuốn sách này sử dụng khá nhiều extension như vậy. Ngoài việc cho phép chúng ta khám phá cơ chế bên trong của server, các extension này cũng có thể hỗ trợ việc xử lý sự cố trong các kịch bản sử dụng phức tạp.

## Quy ước (Conventions)

Tôi đã cố gắng viết cuốn sách này theo cách cho phép đọc nó lần lượt từng trang, từ đầu đến cuối. Nhưng khó mà phơi bày toàn bộ sự thật ngay một lúc, vì thế tôi đã phải quay lại cùng một chủ đề nhiều lần. Việc viết đi viết lại rằng "điều này sẽ được xem xét sau" chắc chắn sẽ làm văn bản dài hơn nhiều, vì vậy trong những trường hợp như thế tôi chỉ đơn giản đặt số trang ở lề để dẫn bạn tới phần thảo luận tiếp theo. Một con số tương tự trỏ ngược lại *[→ tr. 17](00-about-this-book.md)* sẽ đưa bạn tới trang nơi điều gì đó về chủ đề này đã được nói tới.

Cả phần văn bản lẫn tất cả các ví dụ code trong cuốn sách này đều áp dụng cho PostgreSQL 14. Bên cạnh một số đoạn văn, bạn có thể thấy một số phiên bản ở lề trang. Điều đó có nghĩa là thông tin được cung cấp *(v. 14)* có hiệu lực kể từ phiên bản PostgreSQL được chỉ ra, còn tất cả các phiên bản trước đó hoặc hoàn toàn không có tính năng được mô tả, hoặc dùng một cách triển khai khác. Những ghi chú như vậy có thể hữu ích cho những ai chưa nâng cấp hệ thống của mình lên bản phát hành mới nhất.

Tôi cũng dùng lề trang để hiển thị giá trị mặc định của các parameter được thảo luận. Tên của cả parameter thông thường lẫn storage parameter đều được in nghiêng: *work_mem*. *(mặc định: 4MB)*

> **Ghi chú của bản dịch:** Trong bản markdown này, các tham chiếu trang ở lề được thể hiện dưới dạng *[→ tr. N](file.md)*, trong đó N là số trang trong sách gốc và link trỏ tới file chương chứa trang đó; số phiên bản được thể hiện dưới dạng *(v. N)*; giá trị mặc định của parameter được thể hiện dưới dạng *(mặc định: ...)*. Các hình minh hoạ được giữ nguyên từ bản gốc (chữ trong hình là tiếng Anh).

Trong phần footnote, tôi đưa ra nhiều liên kết tới các nguồn thông tin khác nhau. Có một vài nguồn như vậy, nhưng trước hết và quan trọng nhất, tôi liệt kê tài liệu PostgreSQL,[^1] vốn là một kho kiến thức dồi dào. Là một phần thiết yếu của dự án, tài liệu này luôn được chính các nhà phát triển PostgreSQL cập nhật. Tuy nhiên, nguồn tham khảo chính yếu chắc chắn là mã nguồn.[^2] Thật đáng kinh ngạc khi bạn có thể tìm thấy bao nhiêu câu trả lời chỉ bằng cách đọc các comment và duyệt qua các file README, ngay cả khi bạn không biết C. Đôi khi tôi cũng tham chiếu tới các mục commitfest:[^3] bạn luôn có thể lần theo lịch sử của mọi thay đổi và hiểu được logic của các quyết định mà nhà phát triển đưa ra nếu đọc các thảo luận liên quan trong mailing list psql-hackers, nhưng việc đó đòi hỏi phải lục lọi hàng đống email.

> Những ghi chú bên lề có thể khiến phần thảo luận đi chệch hướng (mà tôi không thể cưỡng lại việc đưa vào sách) được in như thế này, để có thể dễ dàng bỏ qua.

Lẽ tự nhiên, cuốn sách chứa nhiều ví dụ code, chủ yếu bằng SQL. Code được đưa ra kèm dấu nhắc `=>`; phản hồi của server theo sau nếu cần:

```
=> SELECT now();
              now
-------------------------------
 2023-03-06 14:00:08.008545+03
(1 row)
```

Nếu bạn cẩn thận lặp lại tất cả các lệnh đã đưa ra trên PostgreSQL 14, bạn sẽ nhận được chính xác cùng kết quả (cho đến cả ID của transaction và những chi tiết không quan trọng khác). Dù sao đi nữa, tất cả các ví dụ code trong cuốn sách này đều được sinh ra bởi script chứa đúng những lệnh này.

Khi cần minh hoạ việc thực thi đồng thời nhiều transaction, code chạy trong một phiên (session) khác được thụt lề và đánh dấu bằng một đường kẻ dọc.

> ```
> => SHOW server_version;
>  server_version
> ----------------
>  14.7
> (1 row)
> ```

Để thử những lệnh như vậy (điều hữu ích cho việc tự học, cũng như bất kỳ thử nghiệm nào), sẽ thuận tiện nếu mở hai terminal `psql`.

Tên của các lệnh và các đối tượng cơ sở dữ liệu khác nhau (như bảng và cột, hàm, hoặc extension) được làm nổi bật trong văn bản bằng font sans-serif: `UPDATE`, `pg_class`.

Nếu một tiện ích được gọi từ hệ điều hành, nó được hiển thị với dấu nhắc kết thúc bằng `$`:

```
postgres$ whoami
postgres
```

Tôi dùng Linux, nhưng không đi vào chi tiết kỹ thuật nào; chỉ cần có hiểu biết cơ bản về hệ điều hành này là đủ.

## Lời cảm ơn (Acknowledgments)

Không thể viết một cuốn sách một mình, và giờ đây tôi có một cơ hội tuyệt vời để cảm ơn những người tốt.

Tôi vô cùng biết ơn Pavel Luzanov, người đã tìm đúng thời điểm và đề nghị tôi bắt đầu làm một điều thực sự đáng giá.

Tôi mang ơn Postgres Professional vì đã cho tôi cơ hội làm việc với cuốn sách này ngoài thời gian rảnh của mình. Nhưng đằng sau công ty là những con người cụ thể, vì vậy tôi muốn bày tỏ lòng biết ơn tới Oleg Bartunov vì đã chia sẻ ý tưởng và nguồn năng lượng vô tận, và tới Ivan Panchenko vì sự hỗ trợ chu đáo và LATEX.

Tôi muốn cảm ơn các đồng nghiệp trong nhóm đào tạo vì bầu không khí sáng tạo và những cuộc thảo luận đã định hình phạm vi và hình thức các khoá đào tạo của chúng tôi, điều cũng được phản ánh trong cuốn sách. Đặc biệt cảm ơn Pavel Tolmachev vì đã rà soát tỉ mỉ các bản nháp.

Nhiều chương của cuốn sách này lần đầu được đăng dưới dạng bài viết trên blog Habr,[^4] và tôi biết ơn độc giả vì những bình luận và phản hồi của họ. Điều đó cho thấy tầm quan trọng của công việc này, chỉ ra một số lỗ hổng trong kiến thức của tôi và giúp tôi cải thiện văn bản.

Tôi cũng muốn cảm ơn Liudmila Mantrova, người đã bỏ nhiều công sức trau chuốt ngôn ngữ của cuốn sách. Nếu bạn không vấp váp ở từng câu một, công lao đó thuộc về cô ấy. Ngoài ra, Liudmila còn đảm nhận việc dịch cuốn sách này sang tiếng Anh, điều mà tôi cũng rất biết ơn.

Tôi không nêu tên, nhưng mỗi hàm hay tính năng được đề cập trong cuốn sách này đều đòi hỏi nhiều năm làm việc của những con người cụ thể. Tôi ngưỡng mộ các nhà phát triển PostgreSQL, và tôi rất vui khi có vinh dự gọi nhiều người trong số họ là đồng nghiệp của mình.

[^1]: postgresql.org/docs/14/index.html
[^2]: git.postgresql.org/gitweb/?p=postgresql.git;a=summary
[^3]: commitfest.postgresql.org
[^4]: habr.com/en/company/postgrespro/blog
