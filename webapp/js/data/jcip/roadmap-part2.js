// Lộ trình đọc Java Concurrency in Practice — Phần 2 (Tuần 6–10).
//
// Nguồn: bản dịch tiếng Việt "Java Concurrency in Practice" (Brian Goetz với
// Tim Peierls, Joshua Bloch, Joseph Bowbeer, David Holmes, Doug Lea —
// Addison-Wesley, 2006). Thư mục nguồn: sources/jcip/
// Bản dịch gồm chương 2–8, 10, 11, 13–16 và phụ lục A; chương 1, 9 (GUI) và
// 12 (kiểm thử chương trình concurrent) không thuộc phạm vi và không có PDF gốc.
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Phần thực hành nằm ở `practice` mức tuần, gõ trên máy thật.
// GIỮ NGUYÊN id (jc-w<N> / jc-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const jcipWeeksPart2 = [
  {
    id: "jc-w6",
    week: "Tuần 6",
    title: "Huỷ và shutdown: thứ Java không cho bạn làm bằng vũ lực",
    goal: "Huỷ được một task đang chạy đúng cách, và nói được vì sao `Thread.stop()` bị bỏ còn interruption thì phải hợp tác mới có tác dụng.",
    practice:
      "Viết một service chạy vòng lặp dài, huỷ được bằng interrupt đúng cách theo mục 7.1.3. Rồi cố tình phá nó theo hai cách sách cảnh báo — bắt `InterruptedException` rồi nuốt luôn, và bắt rồi quên gọi lại `Thread.currentThread().interrupt()` — chạy lại và ghi lại chuyện gì xảy ra ở mỗi bản.",
    resources: [{ label: "JCiP 07 — Cancellation and Shutdown", href: "#/docs/jcip-07" }],
    items: [
      {
        id: "jc-w6-1",
        text: "Interruption là một cơ chế hợp tác, không phải lệnh dừng",
        lesson: `**Mục tiêu.** Giải thích được vì sao Java không cung cấp cách an toàn để dừng một thread một cách áp đặt, phân biệt được cancellation policy của một task với interruption policy của một thread, và biết hai chiến lược hợp lệ để xử lý \`InterruptedException\`.

**Đọc.** [7.1. Hủy Task](#/docs/jcip-07) mở đầu bằng \`PrimeGenerator\` (Listing 7.1, 7.2) dùng một cờ \`volatile cancelled\` mà vòng lặp chính poll định kỳ — đọc kỹ định nghĩa cancellation policy: "như thế nào, khi nào, và cái gì" của việc hủy. [7.1.1. Interruption](#/docs/jcip-07) — đọc kỹ \`BrokenPrimeProducer\` (Listing 7.3): nếu producer block trong \`put\` vì queue đầy, nó sẽ không bao giờ kiểm tra cờ \`cancelled\` và không bao giờ thoát; rồi đọc về interrupted status boolean của mỗi thread, ba method của \`Thread\` ở Listing 7.4 (\`interrupt\`, \`isInterrupted\`, static \`interrupted\` — cái duy nhất xóa được interrupted status), và \`PrimeProducer\` (Listing 7.5) sửa bằng cách dùng interruption thay cờ. [7.1.2. Interruption Policy](#/docs/jcip-07) — đọc kỹ lập luận: task không sở hữu thread nó đang chạy trên (nó "mượn" thread từ một service), nên nó phải bảo toàn interrupted status cho chủ sở hữu thực sự, và một thread chỉ nên bị interrupt bởi chủ sở hữu của nó. [7.1.3. Phản hồi Interruption](#/docs/jcip-07) — đọc kỹ hai chiến lược hợp lệ: lan truyền \`InterruptedException\` (Listing 7.6), hoặc khôi phục interrupted status bằng cách gọi lại \`interrupt()\`; và vì sao \`PrimeProducer\` được phép "nuốt" interrupt trong khi hầu hết code khác thì không. Rồi đọc kỹ Listing 7.7: trong một vòng lặp retry không hỗ trợ cancellation, phải lưu interrupted status cục bộ và khôi phục nó ngay trước khi trả về, không phải ngay khi bắt được exception. [7.1.4. Ví dụ: Timed Run](#/docs/jcip-07) — đọc kỹ vì sao phiên bản \`timedRun\` đầu tiên (Listing 7.8) "vi phạm quy tắc": nó interrupt calling thread mà không biết interruption policy của thread đó.

**Bẫy.** Bắt \`InterruptedException\` rồi không làm gì cả trong code task hay thư viện tổng quát — sách nói thẳng chỉ code hiện thực interruption policy của chính thread đó (như \`PrimeProducer\`, biết rằng thread của nó sắp kết thúc) mới được phép nuốt interrupt; mọi code khác phải lan truyền exception hoặc khôi phục interrupted status. Bẫy thứ hai: interrupt một thread mà bạn không biết interruption policy của nó — minh họa bằng \`timedRun\` phiên bản đầu (Listing 7.8): vì nó có thể được gọi từ thread bất kỳ, nó không thể biết interruption policy của calling thread, và nếu task hoàn tất trước timeout, task hủy đã lập lịch vẫn có thể "nổ" và interrupt calling thread sau khi \`timedRun\` đã trả về, tại một thời điểm không ai biết trước code nào đang chạy.

**Tự kiểm tra.** Theo 7.1.3, trong hoàn cảnh nào code được phép "nuốt" một \`InterruptedException\` mà không làm gì, và vì sao hầu hết code khác không nên làm vậy? Vì sao \`timedRun\` phiên bản đầu ở Listing 7.8 "vi phạm quy tắc" về interruption, và hệ quả xấu có thể xảy ra là gì?`,
      },
      {
        id: "jc-w6-2",
        text: "Huỷ qua Future, và blocking không interrupt được",
        lesson: `**Mục tiêu.** Dùng đúng \`Future.cancel(mayInterruptIfRunning)\` để hủy một task đang chạy trong một \`Executor\` chuẩn, liệt kê được những loại blocking không phản ứng với interruption, và giải thích được cách \`ReaderThread\` cùng hook \`newTaskFor\` encapsulate cancellation phi tiêu chuẩn.

**Đọc.** [7.1.5. Cancellation qua Future](#/docs/jcip-07) — đọc kỹ \`timedRun\` viết lại bằng \`Future\` (Listing 7.10): \`Future.cancel\` nhận đối số \`mayInterruptIfRunning\` — đặt \`true\` an toàn khi task đang chạy trong một \`Executor\` chuẩn (vì các thread thực thi task của nó hiện thực sẵn một interruption policy cho phép hủy bằng interrupt), nhưng không nên tự ý interrupt trực tiếp một thread trong pool vì bạn sẽ không biết task nào đang chạy trong đó. [7.1.6. Xử lý Blocking không thể Interrupt](#/docs/jcip-07) — đọc kỹ bốn loại blocking cần cách xử lý riêng: socket I/O đồng bộ trong \`java.io\` (\`read\`/\`write\` không phản ứng interruption, nhưng đóng socket nền tảng khiến chúng ném \`SocketException\`), I/O trong \`java.nio\` (\`InterruptibleChannel\` ném \`ClosedByInterruptException\` khi bị interrupt), \`Selector.select\` (đóng hay \`wakeup\` khiến nó trả về sớm), và chờ một intrinsic lock (hoàn toàn không làm gì được, trừ dùng \`lockInterruptibly\` của các lock tường minh ở chương 13); rồi đọc kỹ \`ReaderThread\` (Listing 7.11) override \`interrupt\` để vừa gửi interrupt chuẩn vừa đóng socket nền tảng. [7.1.7. Encapsulate Cancellation phi tiêu chuẩn với newTaskFor](#/docs/jcip-07) — đọc kỹ hook \`newTaskFor\` của \`ThreadPoolExecutor\`, và cách \`CancellableTask\`/\`CancellingExecutor\`/\`SocketUsingTask\` (Listing 7.12) áp dụng cùng ý tưởng của \`ReaderThread\` nhưng ở mức task, bằng cách override \`Future.cancel\` để đóng socket.

**Bẫy.** Interrupt trực tiếp một thread bất kỳ trong thread pool để cố hủy task nó đang chạy — sách cảnh báo bạn sẽ không biết task nào đang chạy khi yêu cầu interrupt được gửi đi, nên chỉ nên hủy qua \`Future\` của task. Bẫy thứ hai: nghĩ \`Future.cancel(true)\` sẽ dừng ngay một thread đang block trong socket I/O đồng bộ hay đang chờ một intrinsic lock — sách chỉ rõ interrupt không có tác dụng gì với những blocking này ngoài việc đặt interrupted status; muốn dừng một thread bị block trong socket I/O phải đóng socket nền tảng (kỹ thuật \`ReaderThread\` override \`interrupt\`), còn chờ một intrinsic lock thì hoàn toàn không có cách nào ngoài dùng \`lockInterruptibly\` ở chương 13.

**Tự kiểm tra.** Vì sao đặt \`mayInterruptIfRunning=true\` là an toàn khi hủy một task đang chạy trong một \`Executor\` chuẩn, nhưng lại không nên tự ý interrupt trực tiếp một thread trong pool? Theo 7.1.6, \`Thread.interrupt\` không có tác dụng gì với hai loại blocking nào, và \`ReaderThread\` giải quyết vấn đề đó cho socket I/O bằng cách nào?`,
      },
      {
        id: "jc-w6-3",
        text: "Dừng một service: shutdown ExecutorService và poison pill",
        lesson: `**Mục tiêu.** Giải thích được vì sao quyền sở hữu thread không có tính bắc cầu và đòi hỏi mỗi service tự cung cấp method vòng đời, theo dõi được \`LogWriter\` tiến hoá từ có race condition tới đáng tin cậy, và phân biệt được graceful shutdown, abrupt shutdown, và poison pill.

**Đọc.** [7.2. Dừng một Service dựa trên Thread](#/docs/jcip-07) — đọc kỹ lập luận: quyền sở hữu thread không có tính bắc cầu, nên ứng dụng không nên tự dừng worker thread của một service — service phải cung cấp method vòng đời riêng để tự tắt mình và các thread nó sở hữu. [7.2.1. Ví dụ: Một Logging Service](#/docs/jcip-07) — đọc kỹ \`LogWriter\` (Listing 7.13) thiết kế nhiều producer/một consumer, rồi đọc kỹ vì sao chỉ đơn giản làm logger thread thoát không đủ: thông điệp còn chờ trong queue bị mất, và producer đang block ở \`log()\` vì queue đầy sẽ không bao giờ được bỏ block; cách vá bằng một cờ shutdown boolean (Listing 7.14) vẫn có race condition check-then-act. [7.2.2. Shutdown ExecutorService](#/docs/jcip-07) — đọc kỹ đánh đổi giữa \`shutdown\` (graceful, an toàn hơn) và \`shutdownNow\` (abrupt, nhanh hơn nhưng rủi ro hơn), và \`LogService\` bản encapsulate một \`ExecutorService\` (Listing 7.16) kéo dài chuỗi sở hữu ứng dụng → service → thread. [7.2.3. Poison Pill](#/docs/jcip-07) — đọc kỹ \`IndexingService\` (Listing 7.17–7.19) dùng một object đánh dấu "khi nhận được cái này, hãy dừng lại", và hai điều kiện sách nêu rõ để nó hoạt động đáng tin cậy. [7.2.4. Ví dụ: Một Execution Service dùng một lần](#/docs/jcip-07) — đọc lướt \`checkMail\` (Listing 7.20) dùng một \`Executor\` riêng tư có vòng đời giới hạn bởi chính method đó. [7.2.5. Hạn chế của shutdownNow](#/docs/jcip-07) — đọc kỹ vì sao không có cách tổng quát để biết task nào đã bắt đầu nhưng chưa hoàn tất khi shutdown đột ngột, và cách \`TrackingExecutor\` (Listing 7.21) tiếp cận vấn đề này dù có thể cho dương tính giả.

**Bẫy.** Nghĩ chỉ cần khiến logger thread thoát (ví dụ bằng cách interrupt nó khi nó đang \`take\`) là đã shutdown \`LogWriter\` đáng tin cậy — sách chỉ ra điều này bỏ sót những thông điệp còn chờ được ghi, và quan trọng hơn, không bao giờ bỏ block được những producer đang bị chặn ở \`log()\` vì queue đầy; ngay cả bản vá bằng cờ shutdown (Listing 7.14) vẫn có race condition khiến producer có thể quan sát thấy service "chưa tắt" rồi vẫn đưa thông điệp vào queue sau khi shutdown đã bắt đầu. Bẫy thứ hai: dùng poison pill cho một hệ có số producer/consumer không biết trước, hoặc đặt nó lên một queue có giới hạn — sách nói rõ poison pill "chỉ hoạt động khi số producer và consumer đã biết trước" và "chỉ hoạt động đáng tin cậy với queue không giới hạn".

**Tự kiểm tra.** Vì sao đơn giản làm logger thread thoát khi bị interrupt không phải một cơ chế shutdown đáng tin cậy cho \`LogWriter\`? Poison pill đòi hỏi điều kiện gì về số lượng producer/consumer và về loại queue để hoạt động đáng tin cậy?`,
      },
      {
        id: "jc-w6-4",
        text: "Thread chết bất thường, và JVM tắt: hook, daemon, finalizer",
        lesson: `**Mục tiêu.** Giải thích được vì sao một \`RuntimeException\` không bắt có thể khiến một thread "rò rỉ" âm thầm khỏi ứng dụng, biết cách gắn một \`UncaughtExceptionHandler\`, và phân biệt được shutdown hook, daemon thread, và finalizer — cùng lý do sách khuyên tránh finalizer.

**Đọc.** [7.3. Xử lý việc Thread kết thúc bất thường](#/docs/jcip-07) — đọc kỹ vì sao \`RuntimeException\` là "nguyên nhân hàng đầu khiến thread chết sớm", hệ quả tùy vai trò của thread (worker thread trong pool ít hại hơn event dispatch thread của GUI), và cấu trúc worker thread điển hình ở Listing 7.23 gọi task bên trong \`try-catch\`/\`try-finally\`. [7.3.1. Uncaught Exception Handler](#/docs/jcip-07) — đọc kỹ API \`UncaughtExceptionHandler\` (Listing 7.24, 7.25), cách gắn nó cho thread của pool qua một \`ThreadFactory\`, và phân biệt quan trọng: exception từ task gửi bằng \`execute\` mới tới được uncaught exception handler, còn task gửi bằng \`submit\` thì exception trở thành một phần trạng thái trả về, chỉ lộ ra khi gọi \`Future.get\` (bọc trong \`ExecutionException\`). [7.4. JVM Shutdown](#/docs/jcip-07) — đọc lướt phân biệt orderly shutdown và abrupt shutdown. [7.4.1. Shutdown Hook](#/docs/jcip-07) — đọc kỹ: shutdown hook là các thread chưa start đăng ký bằng \`Runtime.addShutdownHook\`, JVM không đảm bảo thứ tự chạy, và nên dùng một hook duy nhất gọi một chuỗi hành động tuần tự để tránh race condition hay deadlock giữa các hook. [7.4.2. Daemon Thread](#/docs/jcip-07) — đọc kỹ khác biệt normal/daemon thread chỉ ở điều xảy ra khi chúng thoát, và điều gì xảy ra với daemon thread còn lại khi JVM dừng. [7.4.3. Finalizer](#/docs/jcip-07) — đọc kỹ vì sao sách khuyên tránh finalizer: không đảm bảo khi nào (hay có) chạy, chi phí performance đáng kể, và khối \`finally\` cùng method \`close\` tường minh thường làm tốt việc quản lý tài nguyên hơn.

**Bẫy.** Nghĩ rằng gửi task bằng \`submit\` cũng khiến exception của nó tới \`UncaughtExceptionHandler\` giống hệt \`execute\` — sách chỉ rõ chỉ exception từ task gửi bằng \`execute\` mới tới được handler; exception của task gửi bằng \`submit\` (checked hay không) trở thành một phần trạng thái trả về, chỉ ném lại khi gọi \`Future.get\`, bọc trong \`ExecutionException\`. Bẫy thứ hai: coi daemon thread là cách thay thế tiện lợi cho việc quản lý vòng đời service đúng đắn, kể cả cho các task có I/O — sách cảnh báo daemon thread nên dùng dè dặt và "rất nguy hiểm khi dùng cho những task có thể thực hiện bất kỳ dạng I/O nào", vì khi JVM dừng, mọi daemon thread còn lại bị bỏ mặc: khối \`finally\` không được thực thi, stack không được unwind.

**Tự kiểm tra.** Vì sao một task ném exception khi được gửi bằng \`execute\` có thể tới \`UncaughtExceptionHandler\`, còn task gửi bằng \`submit\` thì không — exception đó đi đâu thay vào đó? Theo 7.4.2, điều gì xảy ra với một daemon thread khi JVM dừng, và vì sao sách khuyên nên dùng nó dè dặt?`,
      },
    ],
  },
];
