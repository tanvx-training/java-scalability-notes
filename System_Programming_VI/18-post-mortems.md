# Chương 18. Phân tích hậu sự cố (Post Mortems)

> Bản dịch tiếng Việt từ *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al. Tài liệu gốc được phát hành theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bản dịch giữ nguyên giấy phép này. Nguồn: https://github.com/illinois-cs241/coursebook

> *Nhìn lại thì chuyện gì cũng rõ mười mươi.* (Hindsight is 20-20)
>
> — Khuyết danh (Unknown)

Chương này được viết ra để trả lời một câu hỏi lớn: "rốt cuộc chúng ta học tất cả những thứ này để làm gì". Trong mọi môn học trước đây, bạn được dạy *phải làm gì*: cách lập trình một cấu trúc dữ liệu, cách viết một vòng lặp for, cách chứng minh một điều gì đó. Đây là môn học đầu tiên tập trung phần lớn vào việc *không nên làm gì*. Vì thế, chúng tôi rút kinh nghiệm từ quá khứ theo những cách rất thực tế. Hãy ngồi thoải mái và lướt qua chương này khi chúng tôi kể cho bạn nghe về những rắc rối mà các lập trình viên đi trước đã gặp phải. Ngay cả khi bạn đang làm việc với thứ gì đó ở tầng cao hơn nhiều như phát triển web, mọi thứ vẫn quy về hệ thống.

## 18.1 Shell Shock

**Các mục cần đọc trước:** Phụ lục/Shell (Appendix/Shell)

Đây là một cửa hậu (back door) vào hầu hết các shell. Lỗi này cho phép kẻ tấn công khai thác một biến môi trường để thực thi mã tùy ý.

```bash
$ env x='() { :;}; echo vulnerable' bash -c "echo this is a test"
vulnerable...
```

Điều này có nghĩa là trên bất kỳ hệ thống nào có dùng biến môi trường mà không làm sạch (sanitize) đầu vào của chúng (gợi ý: chẳng ai làm sạch đầu vào từ biến môi trường cả, vì họ coi đó là thứ an toàn), bạn có thể thực thi bất kỳ đoạn mã nào mình muốn trên máy của người khác, kể cả dựng lên một web server.

**Bài học rút ra:** Trên các máy production, hãy đảm bảo hệ điều hành ở mức tối giản (chẳng hạn BusyBox với DietLibc) để bạn có thể hiểu được phần lớn mã trong hệ thống cũng như hiệu quả của chúng. Hãy đặt nhiều tầng trừu tượng và kiểm tra để chắc chắn dữ liệu không bị rò rỉ. Ví dụ, lỗi ở trên chỉ thực sự là vấn đề ở chừng mực thông tin có thể được chuyển ngược về cho kẻ tấn công, tức là khi máy được phép liên lạc với chúng. Nghĩa là bạn có thể gia cố (harden) các cổng của máy bằng cách cấm kết nối trên tất cả các port trừ một vài port nhất định. Ngoài ra, bạn có thể gia cố hệ thống sao cho không bao giờ dùng lời gọi `exec` để thực hiện các tác vụ (ví dụ gọi `exec` chỉ để cập nhật một giá trị), mà thay vào đó làm việc đó bằng C hoặc ngôn ngữ lập trình yêu thích của bạn. Dù mất đi sự linh hoạt, bạn có được sự yên tâm về những gì mình cho phép người dùng làm.

## 18.2 Heartbleed

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

Nói đơn giản, không hề có kiểm tra giới hạn (bounds checking) trên buffer. Cơ chế SSL Heartbeat cực kỳ đơn giản: một server gửi một chuỗi có độ dài nhất định, và server thứ hai phải gửi lại chuỗi có độ dài đó. Vấn đề là ai đó có thể cố ý sửa kích thước của yêu cầu thành lớn hơn những gì họ thực sự gửi (ví dụ gửi "cat" nhưng yêu cầu 500 byte) và lấy được những thông tin quan trọng như mật khẩu từ server. Có một [truyện tranh XKCD liên quan](https://xkcd.com/1354/) về vụ này.

**Bài học rút ra:** Hãy kiểm tra buffer của bạn! Hãy biết sự khác nhau giữa một buffer và một string.

## 18.3 Dirty Cow

**Các mục cần đọc trước:** Tiến trình/Bộ nhớ ảo (Processes/Virtual Memory)

[Dirty Cow](https://en.wikipedia.org/wiki/Dirty_COW)

Một process thường có quyền truy cập vào một tập các ánh xạ bộ nhớ chỉ đọc; nếu nó cố ghi vào đó thì sẽ bị segfault (lỗi truy cập bộ nhớ). Dirty COW là một lỗ hổng trong đó một loạt thread cùng cố truy cập vào cùng một vùng bộ nhớ tại cùng một thời điểm, với hy vọng một trong các thread đó sẽ lật được bit NX và bit cho phép ghi. Sau đó, kẻ tấn công có thể sửa đổi trang (page) đó. Việc này có thể được thực hiện với bit effective user id, khiến process có thể giả vờ rằng nó đang chạy với quyền root và sinh ra một root shell, cho phép truy cập vào hệ thống từ một shell thông thường.

**Bài học rút ra:** Spinlock trong kernel rất khó làm đúng.

## 18.4 Meltdown

Có một ví dụ về lỗi này trong phần kiến thức nền (background section).

## 18.5 Spectre

Xem trong phần bảo mật (security section).

## 18.6 Mars Pathfinder

**Các mục cần đọc trước:** Đồng bộ hóa và một chút về Lập lịch (Synchronization and a bit of Scheduling)

[Liên kết về Pathfinder](https://www.microsoft.com/en-us/research/people/mbj/#!just-for-fun)

Mars Pathfinder là một sứ mệnh nhằm thu thập dữ liệu khí hậu trên Sao Hỏa. Thiết bị này dùng một bus duy nhất để liên lạc với các bộ phận khác nhau. Vì đây là năm 1997, bản thân phần cứng chưa có những tính năng tiên tiến như cơ chế khóa hiệu quả, nên các nhà phát triển hệ điều hành phải tự điều phối việc đó bằng mutex. Kiến trúc khá đơn giản: có một thread điều khiển dữ liệu trên bus thông tin, một thread liên lạc, và một thread thu thập dữ liệu, lần lượt với mức ưu tiên cao, trung bình và thấp trong lập lịch. Một điểm cần lưu ý khác là nếu một ngắt (interrupt) xảy ra theo chu kỳ nào đó trong lúc một tác vụ đang chạy và có một tác vụ khác cần được lập lịch, thì tác vụ có mức ưu tiên cao hơn sẽ thắng.

Mẫu hình khiến mọi thứ bắt đầu hỏng là: thread thu thập dữ liệu bắt đầu ghi lên bus, còn thread bus thông tin đang chờ dữ liệu đó. Rồi thread liên lạc xuất hiện và chiếm quyền (preempt) thread có mức ưu tiên thấp hơn kia, trong khi thread ưu tiên thấp vẫn đang giữ mutex. Điều này có nghĩa là khi thread ưu tiên trung bình cố khóa bus, rover sẽ rơi vào deadlock. Sau một thời gian hệ thống sẽ tự khởi động lại, nhưng đó không phải chuyện nên phó mặc cho may rủi.

Bài học của câu chuyện? Đừng để bản thân các ứng dụng tự xử lý việc đồng bộ hóa. Hãy định nghĩa một module chuyên lo việc khóa mutex và để module đó giao tiếp qua file, IPC, v.v.

## 18.7 Lại là Sao Hỏa (Mars Again)

**Các mục cần đọc trước:** Malloc

[Mars](https://www.computerworld.com/article/2574759/data-storage-solutions/out-of-memory-problem-caused-mars-rover-s-glitch.html)

Nói ngắn gọn thì họ hết bộ nhớ. Nói dài dòng hơn thì họ hết bộ nhớ, hết dung lượng đĩa, và hết cả vùng swap. Bài học của câu chuyện? Hãy chắc chắn viết mã có thể xử lý được các thất bại liên quan đến file, và xử lý được khi file bị đóng hoặc hết bộ nhớ, để hệ điều hành có thể hoán đổi nóng (hot swap) các file nhằm giải phóng bộ nhớ. Ngoài ra hãy dọn dẹp file; hãy giả định rằng thư mục tạm của bạn chỉ vào khoảng một phần trăm hay một phần nghìn tổng dung lượng và chỉ dùng trong giới hạn đó.

## 18.8 Năm 2038 (Year 2038)

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

[2038](https://en.wikipedia.org/wiki/Year_2038_problem)

Đây là một vấn đề chưa xảy ra. Các timestamp trên Unix được lưu dưới dạng số giây tính từ một ngày cụ thể (ngày 1 tháng 1 năm 1970). Giá trị này được lưu trong một số nguyên có dấu 32 bit. Vào tháng 3 năm 2038 *(ND: chính xác là ngày 19 tháng 1 năm 2038)*, con số này sẽ bị tràn (overflow). Đây không phải vấn đề với hầu hết các hệ điều hành hiện đại vốn lưu số nguyên có dấu 64 bit — đủ để dùng đến tận ngày tận thế — nhưng lại là vấn đề với các thiết bị nhúng mà ta không thể thay đổi phần cứng bên trong. Hãy chờ xem chuyện gì sẽ xảy ra.

**Bài học rút ra:** Hãy lập kế hoạch như thể một ngày nào đó ứng dụng của bạn sẽ trở nên khổng lồ.

## 18.9 Sự cố mất điện vùng Đông Bắc năm 2003 (Northeast Blackout of 2003)

**Các mục cần đọc trước:** Đồng bộ hóa (Synchronization)

[2003](https://en.wikipedia.org/wiki/Northeast_blackout_of_2003)

Một race condition đã kích hoạt một chuỗi sự kiện không xác định trong một hệ thống, gây mất điện trên phần lớn vùng đông bắc Bắc Mỹ trong một thời gian khá dài. Lỗi này còn tắt hoặc làm hỏng hệ thống dự phòng và hệ thống ghi log, nên suốt một giờ đồng hồ người ta thậm chí không hề biết đến lỗi. Chính xác những bit nào đã bị lật thì không rõ, nhưng các bản vá đã được đưa vào.

**Bài học rút ra:** Hãy module hóa mã để khoanh vùng các thất bại (ví dụ giữ các race condition tách biệt giữa các process). Nếu bạn cần đồng bộ hóa giữa các process, hãy đảm bảo hệ thống phát hiện lỗi của bạn không bị đan xen vào chính hệ thống.

## 18.10 Xử lý Unicode trên Apple iOS (Apple IOS Unicode Handling)

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

[Làm sập iPhone bằng tin nhắn văn bản](http://appleinsider.com/articles/15/05/26/bug-in-ios-notifications-handling-crashes-iphones-with-a-simple-text)

Tự hỏi vì sao chúng tôi dạy phân tích cú pháp chuỗi (string parsing)? Bởi vì đó là việc khó, ngay cả với các nhà phát triển phần mềm chuyên nghiệp. Lỗi này gây ra rất nhiều hành vi không xác định (undefined behavior) khi cố phân tích một dãy ký tự Unicode. Apple có lẽ biết vì sao chuyện này xảy ra, nhưng phỏng đoán của chúng tôi là việc phân tích chuỗi diễn ra ở đâu đó bên trong kernel và dẫn đến segfault. Khi bạn gặp segfault trong kernel, kernel sẽ panic và toàn bộ thiết bị khởi động lại. Tuy nhiên, hành vi không xác định nghĩa là bất cứ điều gì cũng có thể xảy ra, và quả thật rất nhiều chuyện khác nhau đã xảy ra với lỗi này.

**Bài học rút ra:** Hãy fuzz kernel của bạn.

## 18.11 Xác thực SSL của Apple (Apple SSL Verification)

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

[Lỗi của Apple](https://en.wikipedia.org/wiki/Unreachable_code#Examples)

Do một lệnh `goto` lạc chỗ trong mã của Apple, một hàm luôn trả về rằng chứng chỉ SSL là hợp lệ. Đương nhiên, các hacker đã có thể qua mặt hệ thống với những tên trang web khá là điên rồ.

**Bài học rút ra:** Luôn đặt dấu ngoặc nhọn cho các câu lệnh `if`, dùng `goto` thật dè sẻn. Nhiều khả năng nếu bạn thấy cần dùng `goto`, hãy viết một hàm khác hoặc một câu lệnh `switch` với các nhánh rơi xuyên (fall through) (dù vẫn tệ).

## 18.12 Vụ Sony cài rootkit (Sony Rootkit Installation)

**Các mục cần đọc trước:** Nhập môn C/Tiến trình (Intro to C/Processes)

[Vụ bê bối rootkit](https://en.wikipedia.org/wiki/Sony_BMG_copy_protection_rootkit_scandal)

Hãy hình dung thế này. Đó là năm 2005, Limewire ra đời vài năm trước đó, Internet là một vũng lầy ngày càng lớn của các hoạt động bất hợp pháp — không phải nói rằng bây giờ chuyện đó đã được giải quyết. Sony biết rằng họ không có đủ năng lực tính toán để kiểm soát toàn bộ cõi mạng hay vượt qua đủ loại công nghệ mà người ta dùng để lách các cơ chế bảo vệ bản quyền. Vậy họ đã làm gì? Với 22 triệu đĩa CD nhạc, họ buộc người dùng phải cài một rootkit lên hệ điều hành, để Sony có thể giám sát thiết bị nhằm phát hiện các hoạt động phi đạo đức.

Gác lại các lo ngại về quyền riêng tư — và tin tôi đi, có rất nhiều lo ngại — vấn đề lớn là rootkit này trở thành một cửa hậu vào hệ thống của mọi người nếu được lập trình không đúng. Rootkit là một đoạn mã, thường được cài ở phía kernel, theo dõi hầu như mọi thứ người dùng làm: truy cập trang web nào, bấm chuột hay gõ phím gì, v.v. Nếu một hacker phát hiện ra điều này và có cách truy cập API đó từ tầng user space, thì bất kỳ chương trình nào cũng có thể moi được những thông tin quan trọng về thiết bị của bạn. Khỏi phải nói, mọi người đã rất giận dữ.

**Bài học rút ra:** Hãy dùng phần mềm diệt virus và/hoặc AppArmor, và đảm bảo rằng một ứng dụng chỉ yêu cầu những quyền hợp lý. Nếu bạn phân vân, hãy thử thứ gì đó như Windows Sandbox hoặc giữ sẵn một máy ảo "hy sinh" (Sacrificial VM) để xem việc cài đặt nó có làm máy tính của bạn tệ đi không. Đừng tin chứng chỉ, hãy tin vào mã.

## 18.13 Civilization và Gandhi (Civilization and Ghandi)

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

[Sự hiếu chiến của Gandhi](https://web.archive.org/web/20191216004115/https://www.geek.com/games/why-gandhi-is-always-a-warmongering-jerk-in-civilization-1608515/)

Giới game thủ hẳn đều biết chuyện vì sao một người (ngoài đời) bất bạo động như Gandhi lại hung hãn đến vậy trong trò chơi Civilization. Trong phiên bản gốc, trò chơi lưu mức độ hiếu chiến dưới dạng một số nguyên không dấu (unsigned integer). Trong quá trình chơi, số nguyên này có thể bị giảm đi, và vấn đề nảy sinh vì Gandhi vốn đã ở mức không. Điều này khiến ông trở thành nhân vật hiếu chiến nhất trong trò chơi.

**Bài học rút ra:** Điều đáng ghi nhớ ở đây là đừng bao giờ dùng số không dấu trừ khi bạn có lý do rõ ràng, được viết ra hẳn hoi (các lý do bao gồm: bạn cần biết về hành vi tràn số, bạn đang dịch bit, bạn đang dùng mặt nạ bit). Trong mọi trường hợp khác, hãy ép kiểu (cast).

## 18.14 Nỗi khổ của việc viết shell script (The Woes of Shell Scripting)

**Các mục cần đọc trước:** Nhập môn C/Phụ lục (Intro to C/Appendix)

[Steam](https://www.pcworld.com/article/2871653/scary-steam-for-linux-bug-erases-all-the-personal-files-on-your-pc.html)

Steam từng có một lỗi đơn giản khiến Steam xóa sạch toàn bộ file của bạn, theo dạng đại loại như thế này:

```bash
$ ROOT=$(cd $0/; echo $PWD);
$ rm -rf $ROOT
```

Chuyện gì xảy ra nếu `$0`, hay tham số đầu tiên truyền vào script, không tồn tại? Bạn chuyển đến thư mục gốc, và xóa sạch cả máy tính của mình.

**Bài học rút ra:** Hãy kiểm tra tham số, luôn luôn luôn đặt `set -e` trong script, và nếu bạn dự kiến một lệnh có thể thất bại thì hãy liệt kê nó ra một cách tường minh. Bạn cũng có thể alias `rm` thành `mv` rồi xóa thùng rác sau.

## 18.15 Lỗi double free ở AppNexus (Appnexus Double Free)

**Các mục cần đọc trước:** Nhập môn C/Malloc (Intro to C/Malloc)

[Double Free](https://techblog.appnexus.com/2013-09-17-outage-postmortem-586b19ae4307)

AppNexus dùng một bộ thu gom rác (garbage collector) bất đồng bộ để thu hồi các phần khác nhau của heap khi nó cho rằng các đối tượng không còn được sử dụng. Kiến trúc là: một phần tử nằm trong danh sách "không khả dụng" (unavailable list), rồi được lấy ra và đưa vào danh sách "sắp được giải phóng" (to-be-freed list). Sau một khoảng thời gian nhất định, nếu phần tử đó không được dùng đến, nó sẽ được giải phóng và thêm vào free list. Mọi chuyện đều ổn cho đến khi hai thread cố xóa cùng một đối tượng cùng lúc, khiến nó bị thêm vào danh sách hai lần. Sau một khoảng thời gian ngắn hơn, một trong các đối tượng đã bị xóa, và việc xóa đó được thông báo tới các máy tính khác.

**Bài học rút ra:** Hãy tránh làm phần mềm chắp vá (hacky) nếu có thể. Hãy module hóa, đặt giới hạn bộ nhớ, giám sát các phần khác nhau trong mã của bạn và tối ưu bằng tay. Không có bộ thu gom rác vạn năng nào phù hợp với tất cả mọi người. Ngay cả những bộ được kiểm thử kỹ lưỡng như của JVM cũng cần vài cú hích nếu bạn muốn vắt được hiệu năng từ chúng.

## 18.16 Sự cố sụp đổ dây chuyền của AT&T năm 1990 (ATT Cascading Failures - 1990)

**Các mục cần đọc trước:** Nhập môn C (Intro to C)

[Giải thích](http://users.csc.calpoly.edu/~jdalbey/SWE/Papers/att_collapse.html)

Lỗi này được giải thích rất rõ tại liên kết ở trên; chúng tôi khuyên bạn nên đọc để tìm hiểu thêm. Một loạt độ trễ mạng khiến một số tổng đài chuyển mạch điện thoại trên khắp đất nước tin rằng các tổng đài khác vẫn đang hoạt động trong khi thực tế thì không. Khi các tổng đài này hoạt động trở lại, chúng nhận ra mình có một lượng cuộc gọi tồn đọng khổng lồ cần định tuyến và bắt đầu làm việc đó. Các thất bại định tuyến khác và các lần khởi động lại chỉ càng làm vấn đề trầm trọng thêm.

**Bài học rút ra:** Không dùng C thực ra đã có thể giúp ích ở đây nhờ việc fuzz kỹ lưỡng hơn (dù C++ ở thời đại này còn tệ hơn với các cấu trúc ngôn ngữ của nó). Bài học thật sự của câu chuyện là mạng vốn ngẫu nhiên, và hãy lường trước bất kỳ cú nhảy nào ở bất kỳ điểm nào trong mã của bạn. Điều đó có nghĩa là hãy viết các mô phỏng và chạy chúng với những độ trễ ngẫu nhiên để tìm ra lỗi trước khi chúng xảy ra.
