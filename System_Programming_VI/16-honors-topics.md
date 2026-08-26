# Chương 16. Các chủ đề nâng cao (Honors topics)

> Bản dịch tiếng Việt từ *System Programming Coursebook* (University of Illinois, CS 241) — B. Venkatesh, L. Angrave et al. Tài liệu gốc được phát hành theo giấy phép [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bản dịch giữ nguyên giấy phép này. Nguồn: https://github.com/illinois-cs241/coursebook

> Nếu tôi nhìn được xa hơn, ấy là vì tôi đứng trên vai những người khổng lồ.
>
> — Sir Isaac Newton

Chương này chứa nội dung của một số bài giảng thuộc chương trình honors (CS 296-41). Các chủ đề này dành cho những sinh viên muốn đào sâu hơn vào các chủ đề của CS 241.

## 16.1 Nhân Linux (The Linux Kernel)

Trong suốt khoá học CS 241, bạn đã trở nên quen thuộc với system call (lời gọi hệ thống) — giao diện ở không gian người dùng (userspace) để tương tác với kernel (nhân hệ điều hành). Vậy kernel này thực sự hoạt động như thế nào? Kernel là gì? Trong mục này, chúng ta sẽ khám phá những câu hỏi đó chi tiết hơn và làm sáng tỏ một số "hộp đen" mà bạn đã gặp trong khoá học. Chúng tôi sẽ tập trung chủ yếu vào kernel Linux trong chương này, vì vậy hãy mặc định rằng mọi ví dụ đều nói về kernel Linux trừ khi có ghi chú khác.

### 16.1.1 Có những loại kernel nào?

Hiện tại, hầu hết các bạn có lẽ đã quen với kernel Linux, ít nhất là ở khía cạnh tương tác với nó thông qua system call. Một số bạn có thể cũng đã tìm hiểu kernel Windows, hoặc Darwin — kernel kiểu UNIX của macOS (một nhánh phái sinh từ BSD) — những thứ mà chúng tôi sẽ không bàn nhiều trong chương này. Những bạn đã đào sâu hơn một chút có thể còn bắt gặp các dự án như GNU HURD hay zircon.

Kernel nhìn chung có thể được xếp vào một trong hai loại: monolithic kernel (nhân nguyên khối) hoặc micro-kernel (vi nhân). Một monolithic kernel về cơ bản là kernel cùng toàn bộ các dịch vụ đi kèm của nó gộp lại thành một chương trình duy nhất. Ngược lại, micro-kernel được thiết kế để có một thành phần chính chỉ cung cấp chức năng tối thiểu mà một kernel cần có. Điều này bao gồm việc thiết lập các device driver (trình điều khiển thiết bị) quan trọng, hệ thống tệp gốc (root filesystem), phân trang (paging) hoặc các chức năng khác thiết yếu để những tính năng cấp cao hơn có thể được hiện thực. Các tính năng cấp cao hơn (chẳng hạn như ngăn xếp mạng — networking stack, các hệ thống tệp khác, và các device driver không thiết yếu) sau đó được hiện thực dưới dạng những chương trình riêng biệt, có thể tương tác với kernel thông qua một hình thức IPC (giao tiếp liên tiến trình) nào đó, thường là RPC (gọi thủ tục từ xa). Do thiết kế này, micro-kernel theo truyền thống vẫn chậm hơn monolithic kernel vì chi phí phụ trội của IPC.

Từ đây trở đi, chúng ta sẽ dành phần thảo luận để tập trung vào monolithic kernel, và trừ khi có ghi chú khác, cụ thể là kernel Linux.

### 16.1.2 Giải mã system call

System call sử dụng một lệnh (instruction) mà một chương trình chạy trong userspace có thể thực thi để trap (bẫy) vào kernel (thông qua một signal — tín hiệu) nhằm hoàn tất lời gọi. Điều này bao gồm các hành động như ghi dữ liệu xuống đĩa, tương tác trực tiếp với phần cứng nói chung, hoặc các thao tác liên quan đến việc giành lấy hay từ bỏ đặc quyền (ví dụ: trở thành người dùng root và có được toàn bộ các capability).

Để đáp ứng yêu cầu của người dùng, kernel sẽ dựa vào các kernel call. Kernel call về cơ bản là các hàm "public" của kernel — những hàm do các nhà phát triển khác hiện thực để dùng ở các phần khác của kernel. Dưới đây là một trích đoạn từ trang man của một kernel call:

```text
Name

kmalloc — allocate memory
Synopsis
void * kmalloc ( size_t size,
    gfp_t flags);

Arguments

size_t size

    how many bytes of memory are required.
gfp_t flags

     the type of memory to allocate.

Description

kmalloc is the normal method of allocating memory for objects smaller than page size in the kernel.

The flags argument may be one of:

GFP_USER - Allocate memory on behalf of user. May sleep.

GFP_KERNEL - Allocate normal kernel ram. May sleep.

GFP_ATOMIC - Allocation will not sleep. May use emergency pools. For example, use this inside interrupt handlers.
```

Bạn sẽ để ý thấy một số flag được đánh dấu là có thể gây ra ngủ (sleep). Điều này cho chúng ta biết liệu có thể dùng các flag đó trong những tình huống đặc biệt hay không, chẳng hạn như ngữ cảnh ngắt (interrupt context), nơi tốc độ là điều tối quan trọng và những thao tác có thể block hoặc chờ một process khác có thể sẽ không bao giờ hoàn tất.

## 16.2 Containerization (Công nghệ container)

Khi chúng ta bước vào một kỷ nguyên có quy mô chưa từng thấy, với khoảng 20 tỷ thiết bị kết nối internet vào năm 2018, chúng ta cần những công nghệ giúp phát triển và duy trì phần mềm có khả năng mở rộng theo quy mô đó. Thêm vào đó, khi phần mềm ngày càng phức tạp và việc thiết kế phần mềm an toàn ngày càng khó hơn, chúng ta thấy mình bị áp thêm những ràng buộc mới khi phát triển ứng dụng. Như thể vậy còn chưa đủ, những nỗ lực nhằm đơn giản hoá việc phân phối và phát triển phần mềm, chẳng hạn như các hệ thống trình quản lý gói (package manager), thường lại gây ra những rắc rối của riêng chúng, dẫn tới các gói bị hỏng, những phụ thuộc (dependency) không thể giải quyết được và các "cơn ác mộng môi trường" tương tự đã trở nên quá đỗi phổ biến ngày nay. Mặc dù thoạt nhìn đây có vẻ là những vấn đề rời rạc, tất cả chúng — và còn hơn thế nữa — đều có thể được giải quyết bằng cách áp dụng containerization vào vấn đề.

### 16.2.1 Container là gì?

Một container gần giống như một máy ảo (virtual machine). Theo một nghĩa nào đó, container so với máy ảo cũng giống như thread so với process. Container là một môi trường gọn nhẹ chia sẻ tài nguyên và kernel với máy chủ (host), đồng thời tự cô lập khỏi các container hoặc process khác trên host. Bạn có thể đã gặp container khi làm việc với những công nghệ như Docker — có lẽ là hiện thực container nổi tiếng nhất hiện nay.

### 16.2.2 Linux Namespaces (Không gian tên Linux)

*(ND: Trong bản gốc, các mục 16.2.2, 16.2.3, 16.2.4 và phần Bibliography chỉ có tiêu đề, chưa có nội dung.)*

### 16.2.3 Xây dựng một container từ đầu

### 16.2.4 Container trong thực tế: Phân phối phần mềm dễ như Snap (Containers in the wild: Software distribution is a Snap)

## Tài liệu tham khảo (Bibliography)
