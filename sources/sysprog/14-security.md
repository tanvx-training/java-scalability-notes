# Chương 14. Bảo mật (Security)

> Bản dịch tiếng Việt từ *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al. Tài liệu gốc được phát hành theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bản dịch giữ nguyên giấy phép này. Nguồn: https://github.com/illinois-cs241/coursebook

> Hacker cũng giống như các nghệ sĩ: thức dậy với tâm trạng tốt và bắt đầu vẽ tranh.
>
> — Vladimir Putin

Bảo mật máy tính (computer security) là việc bảo vệ phần cứng và phần mềm khỏi sự truy cập hoặc sửa đổi trái phép. Ngay cả khi bạn không làm việc trực tiếp trong lĩnh vực bảo mật máy tính, các khái niệm này vẫn rất quan trọng cần học, bởi vì mọi hệ thống, nếu có đủ thời gian, rồi cũng sẽ có kẻ tấn công. Dù nội dung này được giới thiệu thành một chương riêng, cần lưu ý rằng hầu hết các khái niệm và ví dụ code ở đây đều đã được giới thiệu ở những điểm khác nhau trong khoá học. Chúng tôi sẽ không đi sâu vào tất cả các cách tấn công và phòng thủ phổ biến, cũng không đi vào cách thực hiện tất cả các cuộc tấn công này trên một hệ thống bất kỳ. Mục tiêu của chúng tôi là giới thiệu cho bạn lĩnh vực làm cho chương trình làm điều bạn muốn.

## 14.1 Thuật ngữ bảo mật và đạo đức (Security Terminology and Ethics)

Có một số thuật ngữ cần được giải thích để giúp một người có ít hoặc chưa có kinh nghiệm về bảo mật máy tính bắt kịp

1. **Attacker** (kẻ tấn công) thường là người dùng đang cố gắng đột nhập vào hệ thống. Đột nhập vào hệ thống có nghĩa là thực hiện một hành động mà nhà phát triển hệ thống không hề dự định. Nó cũng có thể có nghĩa là truy cập vào một hệ thống mà bạn lẽ ra không được phép truy cập.

2. **Defender** (người phòng thủ) thường là người dùng đang ngăn chặn attacker đột nhập vào hệ thống. Đây có thể là nhà phát triển của hệ thống.

3. Có nhiều loại attacker khác nhau. Có **white hat hacker** (hacker mũ trắng), là những người cố gắng hack một defender với sự đồng ý của họ. Đây thường là một hình thức kiểm thử phòng ngừa – đề phòng một cuộc tấn công không-mấy-thân-thiện xuất hiện. **Black hat hacker** (hacker mũ đen) là những hacker hack mà không có sự cho phép và có ý định sử dụng thông tin thu được cho bất kỳ mục đích nào. **Gray hat hacking** (hack mũ xám) khác ở chỗ ý định của hacker là thông báo cho defender về lỗ hổng – dù đôi khi điều này khó mà phán xét.

**Nguy hiểm đấy, Will Robinson!** Trước khi để bạn đi xa hơn nữa, điều quan trọng là chúng ta phải nói về đạo đức. Trước khi bạn bỏ qua mục này, hãy biết rằng sự nghiệp của bạn có thể — theo đúng nghĩa đen — bị chấm dứt vì một quyết định phi đạo đức mà bạn có thể đưa ra. Đạo luật Computer Fraud and Abuse Act (đạo luật về gian lận và lạm dụng máy tính của Hoa Kỳ) là một đạo luật rộng, và có thể nói là tệ hại, coi bất kỳ việc sử dụng trái phép nào đối với một "protected computer" (máy tính được bảo vệ) là trọng tội. Vì hầu hết máy tính đều tham gia vào một hoạt động thương mại liên bang/quốc tế nào đó (Internet), hầu hết máy tính đều rơi vào diện này. Điều quan trọng là phải suy nghĩ về hành động của mình và có một chuỗi trách nhiệm giải trình trước khi thực thi bất kỳ cuộc tấn công hay phòng thủ nào. Cụ thể hơn, hãy chắc chắn rằng các cấp trên trong tổ chức của bạn đã chấp thuận trước khi bạn thử thực hiện một cuộc tấn công.

Trước hết, nếu có thể, hãy xin phép bằng văn bản từ một trong những cấp trên của bạn. Chúng tôi biết rằng đây là một cách né tránh và đẩy trách nhiệm lên một cấp cao hơn, nhưng — dù nghe có vẻ hơi hoài nghi — các tổ chức thường đổ lỗi cho một nhân viên cá nhân để tránh thiệt hại *(TODO: cần trích dẫn)*. Nếu không thể, hãy cố gắng đi theo các bước kỹ thuật sau

1. Xác định vấn đề mà bạn đang cố giải quyết là gì. Bạn không thể giải quyết một vấn đề mà bạn chưa hiểu đầy đủ.

2. Xác định xem bạn có cần "hack" hệ thống hay không. Một hack nói chung được định nghĩa là việc cố gắng sử dụng một hệ thống theo cách không được dự định. Trước hết, bạn nên xác định xem cách dùng của mình là được dự định, không được dự định, hay ở đâu đó lưng chừng – hãy xin một quyết định từ phía họ. Nếu không xin được, hãy đưa ra một phán đoán hợp lý về đâu là cách sử dụng được dự định.

3. Ước lượng một cách hợp lý chi phí của việc "hack" hệ thống. Đưa ước lượng đó cho vài kỹ sư kiểm tra lại để họ có thể chỉ ra những điểm bạn có thể đã bỏ sót. Cố gắng tìm được ai đó ký duyệt kế hoạch.

4. Thực thi kế hoạch một cách thận trọng. Nếu ở bất kỳ thời điểm nào có điều gì đó có vẻ không ổn, hãy cân nhắc các rủi ro rồi mới thực thi kế hoạch.

Nếu không có hướng dẫn đạo đức cụ thể nào cho ứng dụng hiện tại, hãy tự tạo ra. Điều này thường được gọi là **policy vacuum** (khoảng trống chính sách). Việc này có vẻ như là công việc vặt và thiên về "phía kinh doanh" hơn là những gì các nhà khoa học máy tính quen làm, nhưng sự nghiệp của bạn đang bị đặt cược ở đây. Với tư cách một người làm nghề tin học chuyên nghiệp, chính bạn phải đánh giá rủi ro và quyết định có thực thi hay không. Toà án nhìn chung thích dựa vào tiền lệ, nhưng bạn có thể dễ dàng nói rằng mình không phải là một học giả pháp lý. Thay vào đó, bạn phải có thể nói rằng mình đã phản ứng như một kỹ sư "hợp lý" sẽ phản ứng.

*(TODO: Liên kết tới một số nghiên cứu tình huống về các kỹ sư thực thụ đã phải ra quyết định)*

### 14.1.1 Bộ ba CIA (CIA Triad)

Có ba mục tiêu được chấp nhận rộng rãi giúp hiểu xem một hệ thống có an toàn hay không.

1. **Information Confidentiality** (tính bảo mật của thông tin) nghĩa là chỉ những bên được uỷ quyền mới được phép xem một mẩu thông tin

2. **Information Integrity** (tính toàn vẹn của thông tin) nghĩa là chỉ những bên được uỷ quyền mới được phép sửa đổi một mẩu thông tin, bất kể họ có được phép xem nó hay không. Nó đảm bảo thông tin vẫn còn nguyên vẹn trong quá trình truyền đi.

3. **Information Availability** (tính sẵn sàng của thông tin) nghĩa là thông tin, hoặc một dịch vụ, luôn sẵn sàng khi cần đến.

4. Bộ ba ở trên tạo thành bộ ba Confidentiality, Integrity, and Availability (CIA); thường tính xác thực (authenticity) cũng được thêm vào.

Nếu bất kỳ yếu tố nào trong số này bị phá vỡ, tính an toàn của hệ thống (dù là một dịch vụ hay một mẩu thông tin) đã bị xâm phạm.

## 14.2 Bảo mật trong chương trình C (Security in C Programs)

### 14.2.1 Stack Smashing (đập phá ngăn xếp)

Hãy xem xét đoạn code sau

```c
void greeting(const char *name) {
  char buf[32];
  strcpy(buf, name);
  printf("Hello, %s!\n", buf);
}

int main(int argc, char *argv[]) {
  if (argc < 2){
    return 1;
  }
  greeting(argv[1]);
  return 0;
}
```

Không hề có kiểm tra giới hạn ở `strcpy`! Điều này có nghĩa là ta có thể truyền vào một chuỗi lớn và khiến chương trình làm điều gì đó không được dự định, thường là bằng cách thay thế địa chỉ trả về (return address) của hàm bằng địa chỉ của mã độc. Hầu hết các chuỗi sẽ khiến chương trình thoát với một segmentation fault (lỗi truy cập bộ nhớ)

```text
$ ./a.out john
Hello, john!
$ ./a.out JohnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...
Program received signal SIGSEGV, Segmentation fault.
...
```

Nếu ta thao tác các byte theo những cách nhất định và chương trình được biên dịch với đúng các cờ, ta thực sự có thể giành được quyền truy cập vào một shell! Hãy hình dung file đó thuộc sở hữu của root, và ta đưa vào một đoạn bytecode hợp lệ (các lệnh nhị phân) làm chuỗi. Điều sẽ xảy ra là ta sẽ cố thực thi `execve('/bin/sh', '/bin/sh', NULL , NULL)` đã được biên dịch thành bytecode của hệ điều hành và truyền nó như một phần của chuỗi. Với chút may mắn, ta sẽ giành được quyền truy cập vào một root shell.

```text
$ ./a.out <payload>
root#
```

Câu hỏi đặt ra là, điều này phá vỡ những phần nào của bộ ba? Hãy thử tự trả lời câu hỏi đó. Vậy ta sẽ sửa lỗi này thế nào? Ta có thể khắc sâu vào đầu hầu hết các lập trình viên ở mức C là hãy dùng `strncpy`, hoặc `strlcpy` trên các hệ thống OpenBSD. Bật stack canary như giải thích ở phần sau cũng sẽ khắc phục được vấn đề này.

### 14.2.2 Buffer Overflow (tràn bộ đệm)

Hầu hết các bạn đã quen với Buffer Overflow rồi! Rất nhiều khi chúng khá hiền lành, chỉ dẫn tới chương trình bị crash đơn giản hoặc những sai sót buồn cười. Đây là một ví dụ hoàn chỉnh

```text
> cat main.c
#include <stdio.h>

int main() {
    char out[10];
    char in[10];
    fscanf(stdin, "%s", in);
    out[0] = 'a';
    out[9] = '\0';
    printf("%s\n", out);

     return 0;
}
> gcc main.c -fno-stack-protector # need the special flag otherwise won't work
# Stack protectors are explained later.
> ./a.out
hello
a
> ./a.out
hellloooooooo
aoo
>
```

Điều gì xảy ra ở đây hẳn là rõ ràng nếu bạn nhớ lại mô hình bộ nhớ của C. `out` và `in` nằm cạnh nhau trong bộ nhớ. Nếu bạn đọc vào một chuỗi từ standard input làm tràn `in`, thì cuối cùng bạn sẽ in ra `aoo`. Mọi chuyện trở nên nghiêm trọng hơn một chút nếu đoạn code bắt đầu như sau

```c
int main() {
  char pass_hash[10];
  char in[10];
  read_user_password(pass_hash, 10);
  // ...
}
```

### 14.2.3 Lệnh thực thi không theo thứ tự & Spectre (Out of order instructions & Spectre)

Thực thi không theo thứ tự (out of order execution) là một bước phát triển tuyệt vời đã được nhiều nhà sản xuất phần cứng áp dụng gần đây (nghĩ về những năm 1990) *(TODO: cần trích dẫn)*. Bộ xử lý ngày nay, thay vì thực thi một chuỗi lệnh tuần tự (giả sử gán một biến rồi gán một biến khác), sẽ thực thi các lệnh tiếp theo trước khi lệnh hiện tại hoàn thành [1, tr. 45]. Đó là vì các bộ xử lý hiện đại dành rất nhiều thời gian chờ đợi các truy cập bộ nhớ và các ứng dụng thiên về I/O khác. Điều này có nghĩa là bộ xử lý, trong khi chờ một thao tác hoàn tất, sẽ thực thi vài thao tác tiếp theo. Nếu bất kỳ thao tác nào có thể làm thay đổi kết quả cuối cùng, sẽ có một barrier (rào chắn), hoặc nếu việc sắp xếp lại vi phạm các phụ thuộc dữ liệu giữa các lệnh, bộ xử lý sẽ giữ các lệnh theo đúng thứ tự đã nêu [1, tr. 296].

Đương nhiên, điều này cho phép CPU trở nên tiết kiệm năng lượng hơn trong khi thực thi nhiều lệnh hơn theo thời gian thực, đồng thời làm tăng rủi ro bảo mật do kiến trúc phức tạp. Điều mà các lập trình viên hệ thống lo ngại là các thao tác với mutex lock giữa các thread bị thực thi không theo thứ tự – nghĩa là một cài đặt mutex thuần phần mềm sẽ thất bại nếu không có rất nhiều memory barrier. Do đó, lập trình viên phải thừa nhận rằng trên các bộ xử lý hiện đại, các cập nhật có thể bị bỏ lỡ giữa một loạt thread, khi không có barrier.

Một trong những lỗi nổi bật nhất liên quan đến điều này là Spectre [2]. Spectre là một lỗi trong đó các lệnh lẽ ra không được thực thi lại được thực thi một cách suy đoán (speculatively) do thực thi lệnh không theo thứ tự. Đoạn code sau là một bằng chứng khái niệm (proof of concept) ở mức cao.

```c
char *a[10];
for (int i = 10; i != 1; --i) {
  a[i] = calloc(1, 1);
}
a[0] = 0xCAFE;
int val;
int j = 10; // This will be in a register
int i = 10; // This will be in main memory
for (int i = 10; i != 0; --i, --j) {
  if (i) {
    val = *a[j];
  }
}
```

Hãy phân tích đoạn code này. Vòng lặp đầu tiên cấp phát 9 phần tử thông qua một `malloc` hợp lệ. Phần tử cuối cùng là `0xCAFE`, nghĩa là giải tham chiếu (dereference) nó sẽ dẫn tới SEGFAULT. Trong 9 lần lặp đầu, nhánh rẽ được thực hiện và `val` được gán một giá trị hợp lệ. Phần thú vị xảy ra ở lần lặp cuối. Hành vi kết quả của chương trình là bỏ qua lần lặp cuối. Do đó, `val` không bao giờ được gán giá trị cuối cùng.

Nhưng dưới đúng các điều kiện biên dịch và cờ biên dịch phù hợp, các lệnh sẽ được thực thi một cách suy đoán. Bộ xử lý nghĩ rằng nhánh rẽ sẽ được thực hiện, vì nó đã được thực hiện trong 9 lần lặp trước. Vì vậy, bộ xử lý sẽ nạp các lệnh đó. Do thực thi lệnh không theo thứ tự, trong khi giá trị của `i` đang được lấy từ bộ nhớ — ta phải ép để nó không nằm trong thanh ghi — bộ xử lý sẽ thử giải tham chiếu địa chỉ đó. Điều này lẽ ra sẽ dẫn tới SEGFAULT. Vì chương trình về mặt logic chưa bao giờ đi tới địa chỉ đó, kết quả bị loại bỏ.

Và đây là mánh khoé. Mặc dù giá trị của phép tính lẽ ra đã dẫn tới SEGFAULT, lỗi này không xoá cache tham chiếu tới vùng bộ nhớ vật lý nơi `0xCAFE` nằm. Đây là một lời giải thích không hoàn toàn chính xác, nhưng về cơ bản nó hoạt động như vậy. Vì nó vẫn còn trong cache, nếu bạn lại lừa bộ xử lý đọc từ cache thông qua `val` thì bạn sẽ đọc được một giá trị bộ nhớ mà bình thường bạn không thể đọc được. Điều này có thể bao gồm những thông tin quan trọng như mật khẩu, thông tin thanh toán, v.v.

### 14.2.4 Bảo mật hệ điều hành (Operating Systems Security)

1. **Permissions (Quyền).** Trong các hệ thống POSIX, ta có quyền ở khắp mọi nơi. Có những thư mục bạn có thể và không thể truy cập, những file bạn có thể và không thể truy cập. Mỗi tài khoản người dùng được cấp quyền truy cập vào từng file và thư mục thông qua các bit read-write-execute (RWX). Người dùng được đối chiếu với chủ sở hữu (owner), nhóm (group), hoặc "tất cả những người còn lại", và quyền truy cập của họ vào file bị giới hạn bằng các bit này. Lưu ý rằng quyền hoạt động hơi khác một chút trên thư mục so với trên file.

2. **Capabilities.** Ngoài quyền trên file, mỗi người dùng còn có một tập hợp quyền nhất định về những gì họ được làm. Để xem danh sách đầy đủ, bạn có thể tra `capabilities(7)`. Nói ngắn gọn, cho phép một capability tức là cho phép người dùng thực hiện một tập hành động. Một số ví dụ bao gồm điều khiển thiết bị mạng, tạo các file đặc biệt, và nhòm vào IPC hay giao tiếp liên tiến trình.

3. **Address Space Layout Randomization (ASLR — ngẫu nhiên hoá bố cục không gian địa chỉ).** ASLR khiến không gian địa chỉ của các phần quan trọng trong một process, bao gồm địa chỉ cơ sở của file thực thi và vị trí của stack, heap và các thư viện, bắt đầu ở các giá trị ngẫu nhiên trong mỗi lần chạy. Mục đích là để một attacker nắm trong tay một file thực thi đang chạy phải đoán mò xem thông tin nhạy cảm có thể được cất giấu ở đâu. Chẳng hạn, (nếu không có ASLR) một attacker có thể dễ dàng thực hiện một cuộc tấn công return-to-libc.

4. **Stack Protectors (bộ bảo vệ stack).** Giả sử bạn đã lập trình ra một buffer overflow như ở trên. Trong hầu hết các trường hợp, điều gì sẽ xảy ra? Trừ khi bị tắt một cách tường minh, trình biên dịch sẽ chèn vào các stack protector hay stack canary. Đây là một giá trị nằm trong stack và phải giữ nguyên không đổi trong suốt thời gian của lời gọi hàm. Nếu protector đó bị ghi đè vào cuối lời gọi hàm, run time sẽ abort và báo cho người dùng rằng đã phát hiện stack smashing.

5. **Write xor Execute, còn gọi là Data Execution Prevention (DEP).** Đây là một cơ chế bảo vệ đã được đề cập trong phần IPC, phân biệt code với dữ liệu. Một trang (page) có thể được ghi hoặc được thực thi nhưng không thể cả hai. Mục đích là ngăn các buffer overflow trong đó attacker ghi mã tuỳ ý, thường lưu trên stack hoặc heap, rồi thực thi nó với quyền của người dùng.

6. **Firewall (tường lửa).** Kernel Linux cung cấp module netfilter như một cách để quyết định liệu một kết nối đến có được cho phép hay không, cùng nhiều hạn chế khác đối với các kết nối. Điều này có thể giúp chống lại một cuộc tấn công DDOS (giải thích ở phần sau).

7. **AppArmor.** AppArmor là một bộ công cụ hệ điều hành ở mức userspace nhằm giới hạn các ứng dụng chỉ được thực hiện một số thao tác nhất định.

OpenBSD được cho là một hệ thống tốt hơn về mặt bảo mật. Nó có nhiều tính năng hướng đến bảo mật. Một số trong các tính năng này đã được nhắc tới ở trên. Danh sách đầy đủ các tính năng có tại https://www.openbsd.org/innovations.html

1. **pledge.** Pledge là một lệnh mạnh mẽ dùng để giới hạn các system call. Điều này có nghĩa là nếu bạn có một chương trình đơn giản như `cat`, vốn chỉ đọc và ghi file, ta có thể giới hạn một cách hợp lý toàn bộ truy cập mạng, truy cập pipe, và quyền ghi vào file. Đây được gọi là quá trình "hardening" (gia cố) một file thực thi hay một hệ thống: cấp lượng quyền nhỏ nhất cho số lượng file thực thi ít nhất cần thiết để vận hành một hệ thống. Pledge cũng hữu ích trong trường hợp ai đó cố thực hiện một cuộc tấn công injection (tiêm nhiễm).

2. **unveil.** Unveil là một system call giới hạn quyền truy cập của chương trình hiện tại vào chỉ một vài thư mục. Các quyền này cũng áp dụng cho tất cả các chương trình được fork ra. Điều này có nghĩa là nếu bạn có một file thực thi đáng ngờ mà bạn muốn chạy, với mô tả là "tạo một file mới và xuất ra các từ ngẫu nhiên", ta có thể dùng lời gọi này để giới hạn truy cập vào một thư mục con an toàn và chứng kiến nó nhận tín hiệu `SIGKILL` nếu nó cố truy cập các file hệ thống trong thư mục gốc chẳng hạn. Điều này cũng có thể hữu ích cho chính chương trình của bạn. Nếu bạn muốn đảm bảo không có dữ liệu người dùng nào bị mất trong một lần cập nhật (đó là điều đã xảy ra với một bản cập nhật hệ thống của Steam), thì hệ thống có thể chỉ để lộ thư mục cài đặt của chương trình. Nếu một attacker tìm được một exploit trong file thực thi, nó chỉ có thể xâm phạm được thư mục cài đặt.

3. **sudo.** Sudo là một dự án của OpenBSD chạy ở khắp mọi nơi! Trước đây, để chạy lệnh với quyền root, người ta phải chuyển xuống một root shell. Đôi khi điều đó cũng có nghĩa là trao cho người dùng những capability hệ thống đáng sợ. Sudo cho bạn quyền thực hiện các lệnh với tư cách root cho những việc lẻ tẻ mà không phải trao một danh sách dài capability cho tất cả người dùng của bạn.

### 14.2.5 Bảo mật ảo hoá (Virtualization Security)

Ảo hoá (virtualization) là hành động tạo ra một phiên bản ảo của một môi trường để chương trình chạy trên đó. Dù định nghĩa này có thể bị bẻ cong một chút với sự xuất hiện của các máy ảo bare metal thời đại mới, sự trừu tượng hoá vẫn còn đó. Ta có thể hình dung mỗi bo mạch chủ có một hệ điều hành. Ảo hoá theo nghĩa phần mềm là cung cấp các tính năng "ảo" của bo mạch chủ như cổng USB hay màn hình, mà một chương trình khác (cầu nối — bridge) giao tiếp với phần cứng thực để thực hiện một tác vụ. Một ví dụ đơn giản là chạy một máy ảo trên máy tính để bàn của bạn! Ta có thể khởi động một hệ điều hành hoàn toàn khác mà các lệnh của nó được đưa qua một chương trình khác và thực thi trên hệ thống chủ (host). Có nhiều hình thức ảo hoá mà ta sử dụng ngày nay. Chúng ta sẽ thảo luận hai hình thức phổ biến dưới đây. Một hình thức là máy ảo (virtual machine). Các chương trình này mô phỏng mọi loại thiết bị ngoại vi của bo mạch chủ để tạo ra một máy hoàn chỉnh. Hình thức khác là container. Máy ảo tốt nhưng thường cồng kềnh, và các chương trình chỉ cần một mức độ bảo vệ nhất định. Container là các máy ảo không mô phỏng tất cả thiết bị ngoại vi của bo mạch chủ mà thay vào đó dùng chung với hệ điều hành chủ, đồng thời thêm vào các lớp bảo mật bổ sung.

Giờ thì, bạn không thể có ảo hoá đúng nghĩa nếu không có bảo mật. Một trong những lý do để có ảo hoá là đảm bảo môi trường được ảo hoá không rò rỉ ngược trở lại môi trường chủ một cách ác ý. Chúng tôi nói "ác ý" vì có những cách giao tiếp có chủ đích mà ta muốn giữ trong tầm kiểm soát. Dưới đây là một số ví dụ đơn giản về bảo mật được cung cấp thông qua ảo hoá

1. **chroot** là một cách gượng ép để tạo ra một môi trường ảo hoá. chroot là viết tắt của change root. Nó thay đổi nơi mà một chương trình tin rằng (`/`) được mount trên hệ thống. Chẳng hạn với chroot, ta có thể khiến một chương trình hello world tin rằng `/home/user/` thực ra là thư mục gốc. Điều này hữu ích vì không có file nào khác bị lộ ra. Nó gượng ép vì Linux vẫn cần các công cụ bổ sung (nghĩ tới thư viện chuẩn C) đến từ các thư mục khác như `/usr/lib`, nghĩa là những thứ đó vẫn có thể bị tổn thương.

2. **namespaces** là cách tốt hơn của Linux để tạo môi trường ảo hoá. Chúng tôi sẽ không đi sâu vào phần này, chỉ cần biết rằng chúng tồn tại.

3. **Công nghệ ảo hoá phần cứng.** Các nhà sản xuất phần cứng ngày càng nhận thức rõ rằng cần có các cơ chế bảo vệ vật lý khi mô phỏng lệnh. Vì vậy, có thể có những công tắc do người dùng bật cho phép hệ điều hành chuyển sang chế độ ảo hoá, trong đó các lệnh được chạy như bình thường nhưng được giám sát để phát hiện hoạt động độc hại. Điều này giúp cải thiện hiệu năng và tăng tính bảo mật của các môi trường ảo hoá.

## 14.3 An ninh mạng (Cyber Security)

An ninh mạng (Cyber Security) có thể nói là lĩnh vực bảo mật phổ biến nhất. Ngày càng nhiều hệ thống của chúng ta bị hack qua web, nên điều quan trọng là hiểu được làm thế nào ta có thể phòng vệ trước những cuộc tấn công này

### 14.3.1 Bảo mật ở mức TCP (Security at the TCP Level)

1. **Mã hoá (Encryption).** TCP không được mã hoá! Điều này có nghĩa là mọi dữ liệu gửi qua một kết nối TCP đều ở dạng văn bản thuần (plain text). Nếu cần gửi dữ liệu đã mã hoá, ta phải dùng một giao thức ở mức cao hơn như HTTPS hoặc tự phát triển giao thức riêng.

2. **Xác minh danh tính (Identity Verification).** Trong TCP, không có cách nào để xác minh danh tính của bên mà chương trình đang kết nối tới. Không có kiểm tra hay cơ sở dữ liệu liên kết nào. Ta chỉ đành tin rằng DNS server đã đưa ra một câu trả lời hợp lý — mà đây gần như luôn là câu trả lời sai. Ngoài các hệ thống có white list được phê duyệt hoặc một giao thức kết nối "bí mật", ở mức TCP có rất ít điều ta có thể làm để ngăn chặn.

3. **Số thứ tự Syn-Ack (Syn-Ack Sequence Number).** Đây là một cải tiến về bảo mật. TCP có cái mà ta gọi là số thứ tự (sequence number). Nghĩa là trong điệu nhảy SYN–SYN/ACK–ACK, một kết nối bắt đầu từ một số nguyên ngẫu nhiên. Điều này quan trọng vì nếu một attacker đang cố giả mạo gói tin (spoof — giả vờ rằng các gói tin đó đến từ chương trình của bạn), attacker phải hoặc đoán đúng — điều này khó — hoặc nằm trên tuyến đường mà gói tin của bạn đi tới đích — điều này khả dĩ hơn nhiều. Các ISP giúp giải quyết vấn đề tuyến đường vì họ có thể đưa một kết nối qua các router khác nhau, khiến attacker khó có thể ngồi ở bất kỳ đâu mà chắc chắn sẽ nhận được gói tin của bạn — đây là lý do các chuyên gia bảo mật thường khuyên không nên dùng wifi quán cà phê cho các tác vụ nhạy cảm.

4. **Syn-Flood.** Trước khi gói tin đồng bộ đầu tiên được báo nhận (acknowledge), chưa có kết nối nào. Nghĩa là một attacker ác ý có thể viết một cài đặt TCP xấu gửi ra một cơn lũ gói SYN tới một server xấu số. SYN flood dễ dàng được giảm thiểu bằng cách dùng IPTABLES hoặc một module netfilter khác để loại bỏ mọi kết nối đến từ một địa chỉ IP sau khi lưu lượng đạt tới một ngưỡng nhất định trong một khoảng thời gian nhất định.

5. **Denial of Service (từ chối dịch vụ), Distributed Denial of Service (từ chối dịch vụ phân tán)** là hình thức tấn công khó ngăn chặn nhất. Các công ty ngày nay vẫn đang cố tìm những cách tốt để làm dịu các cuộc tấn công này. Nó bao gồm việc gửi đủ loại lưu lượng mạng tới các server với hy vọng lưu lượng đó sẽ làm nghẽn và làm chậm các server. Trong các hệ thống lớn, điều này có thể dẫn tới sự cố dây chuyền (cascading failure). Nếu một hệ thống được thiết kế kém, sự cố của một server khiến tất cả các server khác phải gánh thêm việc, làm tăng xác suất chúng cũng gặp sự cố, và cứ thế tiếp diễn.

### 14.3.2 Bảo mật ở mức DNS (Security at the DNS Level)

Tính đến năm 2019, Bộ An ninh Nội địa Hoa Kỳ (United States Department of Homeland Security) đã ban hành một chỉ thị chuyển tất cả dịch vụ từ DNS sang DNSSec https://cyber.dhs.gov/assets/report/ed-19-01.pdf. Chỉ thị này xuất phát từ một khiếm khuyết cố hữu của hệ thống DNS. Thứ nhất, DNS không cung cấp bất kỳ hình thức xác minh nào đối với các yêu cầu tên miền. Tức là, rất dễ giả mạo các nameserver DNS để chúng trỏ trình duyệt của bạn tới các server có khả năng độc hại. Hãy nhớ rằng các yêu cầu DNS được gửi dưới dạng các gói UDP không được bảo mật, vốn dễ bị can thiệp. Điều này có nghĩa là nếu một attacker chộp được một yêu cầu dạng văn bản thuần gửi tới một DNS server, attacker đó giờ có thể gửi kết quả trở lại cho bên yêu cầu. Phổ biến hơn, thay vì chỉ tấn công một người, chúng sẽ kết nối vào một trạm wifi công cộng và đầu độc cache của router (cache poisoning) – nghĩa là tất cả những ai đang kết nối sẽ nhận được một địa chỉ IP sai khi yêu cầu một tên miền. Điều này có thể dẫn tới các cuộc tấn công giả mạo nghiêm trọng nếu ai đó cố giả danh một ngân hàng lớn.

## 14.4 Chủ đề (Topics)

1. Thuật ngữ bảo mật

2. Bảo mật trong các chương trình C cục bộ

3. Bảo mật trong không gian mạng (CyberSpace)

## 14.5 Ôn tập (Review)

1. Lệnh `chmod` nào chỉ phá vỡ tính bảo mật (confidentiality) của dữ liệu của bạn?

2. Lệnh `chmod` nào chỉ phá vỡ tính bảo mật (confidentiality) và tính sẵn sàng (availability) của dữ liệu của bạn?

3. Một attacker giành được quyền root trên một hệ thống Linux mà bạn dùng để lưu trữ thông tin riêng tư. Điều này ảnh hưởng tới tính bảo mật, tính toàn vẹn, hay tính sẵn sàng của thông tin của bạn, hay cả ba?

4. Hacker brute force tên người dùng và mật khẩu git của bạn. Ai bị ảnh hưởng?

5. Tại sao tách biệt đặc quyền (privilege separation) lại hữu ích trong các ứng dụng RPC?

6. Giả mạo một gói UDP hay một gói TCP dễ hơn, và tại sao?

7. Tại sao số thứ tự TCP được khởi tạo bằng một số ngẫu nhiên?

8. Tác động sẽ là gì nếu vùng RAM dùng để chứa một thư viện chia sẻ (ví dụ thư viện chuẩn C) có thể được ghi bởi bất kỳ process nào?

9. Việc tạo ra và cài đặt các giao thức client-server an toàn và bất khả xâm phạm trước các attacker ác ý có dễ không?

10. Cái nào khó phòng thủ hơn: Syn-Flooding hay Distributed Denial of Service?

11. Deadlock có ảnh hưởng tới tính sẵn sàng của một dịch vụ không?

12. Buffer overflow / underflow có ảnh hưởng tới tính toàn vẹn của dữ liệu không?

13. Tại sao bộ nhớ stack không nên được phép thực thi?

14. HeartBleed là ví dụ về loại vấn đề bảo mật nào? Nó phá vỡ (những) yếu tố nào trong bộ ba?

15. Meltdown và Spectre là ví dụ về loại vấn đề bảo mật nào? Chúng phá vỡ (những) yếu tố nào trong bộ ba?

## Tài liệu tham khảo (Bibliography)

[1] Part Guide. Intel® 64 and IA-32 Architectures Software Developer's Manual. Volume 3B: System Programming Guide, Part 2, 2011.

[2] Paul Kocher, Daniel Genkin, Daniel Gruss, Werner Haas, Mike Hamburg, Moritz Lipp, Stefan Mangard, Thomas Prescher, Michael Schwarz, and Yuval Yarom. Spectre attacks: Exploiting speculative execution. arXiv preprint arXiv:1801.01203, 2018.
