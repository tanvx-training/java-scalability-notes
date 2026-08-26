// Lộ trình System Programming — Phần 2 (Tuần 6–10).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi mục là KẾ HOẠCH HỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (sp-w<N> / sp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const sysprogWeeksPart2 = [
  {
    id: "sp-w6",
    week: "Tuần 6",
    title: "Luồng & Mutex",
    goal: "Viết đúng một chương trình đa luồng dùng pthread và mutex để bảo vệ một biến dùng chung, và giải thích được vì sao thiếu đồng bộ hoá dẫn đến kết quả sai không thể tái hiện ổn định.",
    practice: "Viết chương trình N thread cùng tăng một biến đếm dùng chung 10 triệu lần không khoá, quan sát kết quả sai, rồi sửa bằng mutex và đo lại chi phí lock/unlock.",
    resources: [
      { label: "Ch.6 — Luồng (Threads)", href: "#/docs/sysprog-06" },
      { label: "Ch.7 — Đồng bộ hoá (Synchronization)", href: "#/docs/sysprog-07" },
      { label: "man7.org — pthreads(7)", href: "https://man7.org/linux/man-pages/man7/pthreads.7.html" },
    ],
    items: [
      {
        id: "sp-w6-1",
        text: "Process khác thread ở đâu, cái gì được chia sẻ cái gì không",
        lesson: `**Mục tiêu.** Liệt kê chính xác những gì các thread trong cùng một process chia sẻ (address space, heap, biến toàn cục, file descriptor) và những gì mỗi thread có riêng (stack, giá trị các thanh ghi), và giải thích được khi nào nên chọn process thay vì thread.

**Đọc.** [§6.1 Tiến trình và luồng](#/docs/sysprog-06) và [§6.2 Bên trong luồng](#/docs/sysprog-06) — đọc kỹ danh sách lý do chọn process vs thread, và đoạn giải thích "một thread chính là một process" qua \`clone\`. Chưa cần đọc §6.3 trở đi ở mục này.

**Bẫy.** Sách nói thẳng: tạo thread "tương tự \`fork\`, chỉ khác là không có sao chép — tức không có copy on write". Người mới hay lẫn lộn: vì thread giống fork về cơ chế tạo, họ tưởng mỗi thread cũng có bản sao riêng của heap và biến toàn cục như process con sau fork. Sai — một chương trình đa luồng có nhiều stack nhưng CHỈ MỘT address space; mọi thread nhìn thấy cùng một heap, cùng biến toàn cục.

**Tự kiểm tra.** Nếu thread A ghi vào một biến toàn cục, thread B (chạy song song, không đồng bộ hoá) có đảm bảo nhìn thấy giá trị mới ngay lập tức không? Vì sao "chia sẻ được" không đồng nghĩa với "an toàn khi chia sẻ"?`,
      },
      {
        id: "sp-w6-2",
        text: "pthread_create/pthread_join, truyền tham số đúng cách",
        lesson: `**Mục tiêu.** Viết đúng một lời gọi \`pthread_create\`/\`pthread_join\` lấy được giá trị trả về của thread, và giải thích vì sao quên \`pthread_join\` không làm chương trình sai ngay lập tức mà chỉ gây hại về sau.

**Đọc.** [§6.3 Cách dùng đơn giản](#/docs/sysprog-06) — đọc kỹ ví dụ \`busy\`/\`pthread_join\` và cách đọc khai báo \`void *(*start_routine)(void *)\`. Sau đó đọc [§6.4 Các hàm Pthread](#/docs/sysprog-06), đặc biệt mục nói về \`pthread_join\`.

**Bẫy.** Sách nói rõ: "Các thread đã kết thúc sẽ vẫn tiếp tục tiêu tốn tài nguyên" nếu không được \`join\` — giống hệt zombie process không được \`wait\`. Với một chương trình ngắn, việc bỏ qua \`pthread_join\` trông như vô hại vì mọi tài nguyên được giải phóng khi process thoát. Nhưng trong một process chạy lâu dài liên tục tạo thread mới mà không join thread cũ, tài nguyên tích luỹ dần cho tới khi \`pthread_create\` bắt đầu thất bại — một lỗi chỉ lộ ra sau hàng giờ chạy, không phải ngay khi biên dịch hay chạy thử.

**Tự kiểm tra.** Sách gọi việc "quên join" là điều tương tự với zombie process. Zombie process được dọn khi nào? Điều tương tự nào áp dụng cho một thread chưa được join khi process của nó thoát hoàn toàn?`,
      },
      {
        id: "sp-w6-3",
        text: "Race condition: vì sao i++ không nguyên tử",
        lesson: `**Mục tiêu.** Giải thích bằng assembly vì sao \`x += x\` (hay \`i++\`) trên một biến dùng chung có thể mất cập nhật khi hai thread chạy đồng thời, kể cả khi trình biên dịch tối ưu nó thành một lệnh máy duy nhất.

**Đọc.** [§6.5 Race Conditions](#/docs/sysprog-06) — đọc kỹ đoạn phân tích assembly ba lệnh \`mov/add/mov\` không tối ưu, rồi đoạn nói về bản dịch \`-O2\` chỉ còn một lệnh \`shl\`. Đọc luôn ví dụ "Một ngày ở trường đua" (\`pthread_create(&tid, NULL, myfunc, &i)\` trong vòng \`for\`).

**Bẫy.** Trực giác sai phổ biến: "biên dịch với \`-O2\` ra đúng MỘT lệnh assembly (\`shl dword ptr [rdi]\`), vậy chắc chắn không thể bị chen ngang, nên hết race condition." Sách bác bỏ thẳng: một lệnh assembly không tự động là nguyên tử ở mức phần cứng — CPU vẫn có thể xen kẽ việc đọc/ghi bộ nhớ giữa các lõi nếu không có tiền tố \`lock\`. Số lệnh ít không liên quan gì đến tính nguyên tử.

**Tự kiểm tra.** Vì sao thêm tiền tố \`lock\` trước một lệnh assembly lại khắc phục được race condition ở mức phần cứng, còn việc trình biên dịch chỉ gộp 3 lệnh thành 1 thì không?`,
      },
      {
        id: "sp-w6-4",
        text: "Mutex: lock/unlock, vùng găng, mutex không bảo vệ dữ liệu mà bảo vệ code",
        lesson: `**Mục tiêu.** Xác định đúng phạm vi cần khoá (critical section) cho một đoạn mã cụ thể, và giải thích vì sao dùng hai mutex khác nhau cho hai đoạn code cùng đụng vào một biến vẫn có thể gây race condition.

**Đọc.** [§7.1 Mutex](#/docs/sysprog-07) — đọc kỹ mục 7.1.1 (vòng đời mutex) và 7.1.2, đặc biệt đoạn ví dụ hai mutex \`m1\`/\`m2\` "tạo ra một mutex mà thực chất chẳng làm gì cả". Danh sách 10 cạm bẫy cuối 7.1.2 nên đọc hết.

**Bẫy.** Sách nói thẳng: "mutex trong C không khoá biến... Nó làm việc với mã, không phải với dữ liệu." Khoá hai đoạn code khác nhau bằng hai mutex khác nhau (\`m1\` cho thread 1, \`m2\` cho thread 2) dù cùng đụng vào biến \`a\` vẫn chạy "được" — không deadlock, không lỗi cú pháp — nhưng hoàn toàn không loại trừ lẫn nhau, vì mutex không biết gì về biến \`a\`, nó chỉ biết về chính nó.

**Tự kiểm tra.** Nếu một thiết kế thread-safe dùng một khoá riêng cho mỗi cấu trúc dữ liệu, điều gì xảy ra khi hai hàm khác nhau cùng thao tác trên CÙNG một cấu trúc nhưng vô tình dùng hai biến mutex khác nhau để bảo vệ nó?`,
      },
      {
        id: "sp-w6-5",
        text: "Condition variable: wait/signal/broadcast, vì sao luôn while chứ không if",
        lesson: `**Mục tiêu.** Viết đúng mẫu \`while(điều_kiện) pthread_cond_wait(&cv, &m);\` thay vì \`if\`, và giải thích được vì sao cần giữ mutex trước khi gọi \`pthread_cond_signal\`.

**Đọc.** [§7.2 Biến điều kiện](#/docs/sysprog-07) — đọc kỹ định nghĩa spurious wakeup. Sau đó đọc [§17.11 Câu chuyện kỳ lạ về những lần thức dậy giả](#/docs/sysprog-17) để hiểu vì sao hiện tượng này tồn tại có chủ đích, không phải bug của hệ điều hành.

**Bẫy.** §17.11 chỉ ra hai lý do bị bỏ sót: (1) nếu \`signal\` được gọi mà không giữ mutex, có thể xảy ra một cách xen kẽ khiến \`wait\` bỏ lỡ tín hiệu dù về mặt kỹ thuật API vẫn "đúng" theo đặc tả; (2) một số hệ thống thời gian thực cố tình đánh thức sai để tránh chi phí đồng bộ hoá bên trong bản thân condition variable. Dùng \`if\` thay vì \`while\` giả định tín hiệu luôn đáng tin — sai cả hai lý do trên.

**Tự kiểm tra.** Theo Bảng 17.1 trong §17.11, tại sao gọi \`pthread_cond_signal\` mà KHÔNG giữ mutex trước đó có thể khiến thread đang chờ bỏ lỡ tín hiệu, dù đúng thứ tự signal-rồi-mới-wait?`,
      },
      {
        id: "sp-w6-6",
        text: "Peterson và các lời giải phần mềm cho vùng găng",
        lesson: `**Mục tiêu.** Chỉ ra được phản ví dụ khiến lời giải "cờ + lượt" (candidate #4) vi phạm mutual exclusion, và phát biểu đúng ba tiêu chí Mutual Exclusion/Bounded Wait/Progress.

**Đọc.** [§7.4 Lời giải phần mềm cho bài toán vùng găng](#/docs/sysprog-07) — đọc lần lượt candidate #1 đến #4 và bảng phân tích candidate #4. Sau đó [§7.5 Các lời giải đúng](#/docs/sysprog-07) — lời giải Dekker và Peterson.

**Bẫy.** Candidate #4 (giương cờ, rồi kiểm tra cờ đối phương + lượt) "thoạt nhìn có vẻ thoả mãn cả ba tiêu chí" — sách nói thẳng ngay cả các bài báo được bình duyệt về chủ đề này cũng từng chứa lời giải sai tương tự. Bẫy sâu hơn: dù Peterson (1981) được chứng minh đúng về mặt logic, sách kết luận "ngày nay chúng ta không thể cài đặt một mutex phần mềm theo cùng cách này vì các lệnh được thực thi không theo thứ tự (out-of-order)" — đúng về giấy tờ không có nghĩa là đúng trên CPU hiện đại.

**Tự kiểm tra.** Trong Bảng 7.5 (candidate #4), tại thời điểm nào chính xác thread #2 được phép vào critical section trong khi thread #1 vẫn đang ở trong đó? Cờ của ai đang giương lúc đó?`,
      },
    ],
  },
  {
    id: "sp-w7",
    week: "Tuần 7",
    title: "Đồng bộ nâng cao & Deadlock",
    goal: "Cài đặt đúng producer–consumer bằng semaphore đếm và mutex, và giải thích được 4 điều kiện Coffman cùng vì sao dining philosophers minh hoạ chúng.",
    practice: "Cài đặt một ring buffer đa luồng dùng 2 semaphore + 1 mutex, rồi thử phá nó bằng cách đổi thứ tự sem_wait/mutex_lock để quan sát deadlock hoặc mất dữ liệu.",
    resources: [
      { label: "Ch.7 — Đồng bộ hoá (Synchronization)", href: "#/docs/sysprog-07" },
      { label: "Ch.8 — Deadlock (Bế tắc)", href: "#/docs/sysprog-08" },
      { label: "Ch.17 §17.5 Nĩa sạch/Nĩa bẩn", href: "#/docs/sysprog-17" },
    ],
    items: [
      {
        id: "sp-w7-1",
        text: "Counting semaphore: sem_wait/sem_post, khác mutex chỗ nào",
        lesson: `**Mục tiêu.** Giải thích đúng hai khác biệt giữa semaphore và mutex (ai được wait/post, và ai được unlock), và tự cài đặt được một counting semaphore tối giản bằng condition variable + mutex.

**Đọc.** [§7.5.1 Semaphore](#/docs/sysprog-07) và [§7.6 Cài đặt counting semaphore](#/docs/sysprog-07) — đọc kỹ cấu trúc \`sem_t\` (count + mutex + cv) và hai hàm \`sem_post\`/\`sem_wait\`.

**Bẫy.** Sách giải thích vì sao không cài đặt semaphore trực tiếp bằng cách cẩu thả: "Chúng ta không muốn gọi \`malloc\` trong khi cài đặt một primitive, nếu không có thể bị deadlock!" — một primitive đồng bộ hoá không được phép tự mình phụ thuộc vào một primitive khác (heap allocator) có thể đang bị khoá bởi chính thread gọi nó. Ngoài ra, không như mutex (chỉ thread đã lock mới được unlock), \`sem_wait\`/\`sem_post\` có thể được gọi từ các thread khác nhau — đây là lý do semaphore dùng được cho producer-consumer còn mutex thì không.

**Tự kiểm tra.** Trong cài đặt \`sem_wait\` ở §7.6, vì sao vòng lặp kiểm tra \`while (s->count == 0)\` chứ không phải \`if\`, giống hệt lý do ở condition variable?`,
      },
      {
        id: "sp-w7-2",
        text: "Barrier: chờ đủ N thread rồi cùng đi tiếp",
        lesson: `**Mục tiêu.** Cài đặt đúng một reusable barrier bằng condition variable + biến đếm, và giải thích vì sao một cài đặt barrier "ngây thơ" có thể deadlock khi được đặt trong vòng lặp.

**Đọc.** [§7.7 Rào chắn](#/docs/sysprog-07) — đọc kỹ đoạn \`barrier_wait\` có bug và phần giải thích "thread tham vọng" ngay sau đó.

**Bẫy.** Sách chỉ ra một lỗi tinh vi: nếu một thread "tham vọng" — tức chạy nhanh hơn hẳn các thread khác — nó có thể thoát khỏi \`pthread_cond_broadcast\`, đi làm phần tính toán tiếp theo, quay lại gọi \`barrier_wait\` lần nữa cho vòng lặp kế tiếp, tự đặt lại \`remain = NUM_THREADS\` và giảm nó — tất cả trước khi các thread khác kịp tỉnh dậy từ broadcast trước đó. Kết quả: các thread còn ngủ vĩnh viễn không được đánh thức lần hai, dù \`barrier_wait\` "về mặt logic" đã đúng cho một lần dùng duy nhất.

**Tự kiểm tra.** Barrier ở §7.7 an toàn khi dùng đúng một lần. Điều gì cụ thể trong mã \`barrier_wait\` (gợi ý: dòng \`if (b->remain == 0) b->remain = NUM_THREADS;\`) khiến nó không an toàn khi đặt trong một vòng lặp gọi lặp lại?`,
      },
      {
        id: "sp-w7-3",
        text: "Ring buffer: producer–consumer với 2 semaphore + 1 mutex",
        lesson: `**Mục tiêu.** Cài đặt đúng thứ tự \`sem_wait\` → \`mutex_lock\` → thao tác → \`mutex_unlock\` → \`sem_post\` cho cả enqueue và dequeue, và giải thích vì sao đảo thứ tự này có thể gây deadlock hoặc mất dữ liệu.

**Đọc.** [§7.8 Bộ đệm vòng](#/docs/sysprog-07) — đọc kỹ 7.8.2/7.8.3 (hai cài đặt sai và phân tích) rồi 7.8.5 (cài đặt đúng). Chú ý đoạn "Vài điều đáng suy ngẫm" ở cuối 7.8.5.

**Bẫy.** Ở "Một phân tích khác" (7.8.4), lỗi không chỉ là logic sai mà còn có mutex chưa từng được khởi tạo bằng \`PTHREAD_MUTEX_INITIALIZER\` hay \`pthread_mutex_init\` — khiến \`pthread_mutex_lock\` "có thể đơn giản là không làm gì", một lỗi im lặng dễ bị bỏ qua khi review code vì cú pháp gọi khoá trông hoàn toàn bình thường. Một bẫy khác ở 7.8.1: dùng \`% N\` thay vì \`& (N-1)\` để bọc chỉ số sẽ tràn số nguyên sau hơn 4 tỷ lần enqueue, khiến chỉ số nhảy về một giá trị sai.

**Tự kiểm tra.** Trong "Sketch #2" ở §7.8, \`sem_post\` được gọi ngay sau \`sem_wait\` trong cùng một hàm enqueue/dequeue — tại sao điều này đánh thức một thread khác "quá sớm", trước khi thao tác đọc/ghi bộ đệm thực sự hoàn tất?`,
      },
      {
        id: "sp-w7-4",
        text: "Cấu trúc dữ liệu thread-safe và đồng bộ giữa process",
        lesson: `**Mục tiêu.** Chỉ ra lỗi trong một cấu trúc dữ liệu "thread-safe" dùng sai mutex, và giải thích vì sao một mutex được tạo trước \`fork()\` không tự động được chia sẻ giữa cha và con.

**Đọc.** [§7.3 Cấu trúc dữ liệu thread-safe](#/docs/sysprog-07) — đọc kỹ "phiên bản 2" của stack (dùng \`m1\` cho push, \`m2\` cho pop) và lỗi \`is_empty\` return sớm khi đang giữ khoá. Sau đó [§7.9 Đồng bộ hoá giữa các process](#/docs/sysprog-07).

**Bẫy.** §7.9 nói thẳng: "process con và process cha sẽ không chia sẻ bộ nhớ ảo, và mỗi bên sẽ có một mutex độc lập với bên kia" — nghĩa là khởi tạo một \`pthread_mutex_t\` bình thường (kể cả trên heap) trước khi \`fork()\` rồi mong hai process cùng khoá lẫn nhau là vô nghĩa; phải cấp phát mutex trên vùng nhớ \`mmap\` với \`MAP_SHARED\` và cờ \`PTHREAD_PROCESS_SHARED\`. Đây là bẫy dễ mắc vì code "biên dịch và chạy" bình thường — mỗi process chỉ đang khoá bản sao mutex của riêng mình.

**Tự kiểm tra.** Trong "phiên bản 2" của stack ở §7.3, tại sao dùng khoá \`m1\` cho \`push\` và khoá riêng \`m2\` cho \`pop\` KHÔNG ngăn được một \`push\` và một \`pop\` chạy đồng thời trên cùng mảng \`values\`?`,
      },
      {
        id: "sp-w7-5",
        text: "Đồ thị cấp phát tài nguyên và 4 điều kiện Coffman",
        lesson: `**Mục tiêu.** Vẽ đúng một đồ thị cấp phát tài nguyên (RAG) từ một danh sách "process nào giữ/chờ tài nguyên nào", và phát biểu chính xác 4 điều kiện Coffman.

**Đọc.** [§8.1 Đồ thị cấp phát tài nguyên](#/docs/sysprog-08) và [§8.2 Các điều kiện Coffman](#/docs/sysprog-08) — đọc kỹ điều kiện để một chu trình trong RAG suy ra deadlock, và chứng minh "khi và chỉ khi" ngay sau bảng 4 điều kiện.

**Bẫy.** Sách ghi rất cụ thể: một chu trình trong RAG chỉ chắc chắn gây deadlock "nếu mỗi tài nguyên trong chu trình đó chỉ cung cấp duy nhất một thể hiện (instance)". Nhầm lẫn phổ biến: thấy một chu trình trong RAG rồi vội kết luận hệ thống deadlock — sai nếu tài nguyên đó có nhiều instance (ví dụ một pool 3 kết nối CSDL), vì một process khác trong chu trình vẫn có thể lấy được một instance còn trống và phá vỡ circular wait trên thực tế.

**Tự kiểm tra.** Với đồ thị: P1 giữ R1 (2 instance), P1 chờ R2, P2 giữ R2 (1 instance), P2 chờ R1 — đây có tạo thành chu trình không? Chu trình đó có chắc chắn suy ra deadlock không? Vì sao?`,
      },
      {
        id: "sp-w7-6",
        text: "Dining philosophers: vì sao thất bại và các lời giải",
        lesson: `**Mục tiêu.** Giải thích được vì sao lời giải "phá vỡ hold-and-wait" (trylock nĩa phải, bỏ nĩa trái nếu thất bại) tránh được deadlock nhưng lại tạo ra livelock, và trình bày được ý tưởng cốt lõi của lời giải Dijkstra (thứ tự bộ phận).

**Đọc.** [§8.4 Dining Philosophers](#/docs/sysprog-08) và [§8.5 Các lời giải khả thi](#/docs/sysprog-08) — đọc kỹ 8.4.1 (lời giải thất bại) và 8.5.2 (Dijkstra). Sau đó [§17.5 Nĩa sạch/Nĩa bẩn](#/docs/sysprog-17) để biết còn lời giải nào khác ngoài trọng tài, Stallings và Dijkstra.

**Bẫy.** Sách mô tả chính xác kịch bản livelock: nếu MỌI triết gia cùng lúc "nhặt nĩa trái, thử nĩa phải thất bại, đặt nĩa trái xuống, nhặt nĩa trái lên lại" theo cùng một nhịp, hệ thống không hề deadlock (mọi thread vẫn "đang làm việc") nhưng cũng chẳng ai ăn được — đây chính xác là lý do "phá vỡ hold-and-wait" trong sách bị coi là chưa đủ, và vì sao livelock khó phát hiện hơn deadlock từ góc nhìn hệ điều hành bên ngoài.

**Tự kiểm tra.** Lời giải của Dijkstra (đánh số nĩa, lấy nĩa nhỏ hơn trước) phá vỡ điều kiện Coffman nào trong 4 điều kiện? Vì sao triết gia cuối cùng phải lấy nĩa theo thứ tự ngược lại các triết gia khác?`,
      },
    ],
  },
  {
    id: "sp-w8",
    week: "Tuần 8",
    title: "Bộ nhớ ảo & IPC",
    goal: "Giải thích được cách MMU dịch một địa chỉ ảo sang địa chỉ vật lý qua page table, và dùng đúng mmap/pipe để chia sẻ dữ liệu giữa các process.",
    practice: "Viết hai chương trình giao tiếp qua mmap MAP_SHARED|MAP_ANONYMOUS sau fork, rồi viết lại bằng pipe, so sánh độ phức tạp đồng bộ hoá của hai cách.",
    resources: [
      { label: "Ch.9 — Bộ nhớ ảo và IPC", href: "#/docs/sysprog-09" },
      { label: "man7.org — mmap(2)", href: "https://man7.org/linux/man-pages/man2/mmap.2.html" },
    ],
    items: [
      {
        id: "sp-w8-1",
        text: "Dịch địa chỉ ảo → vật lý, page table nhiều cấp",
        lesson: `**Mục tiêu.** Tính được kích thước page table một cấp cho một máy 32-bit và 64-bit cụ thể, và giải thích vì sao page table nhiều cấp là bắt buộc trên kiến trúc 64-bit chứ không chỉ là một tối ưu.

**Đọc.** [§9.1 Dịch địa chỉ](#/docs/sysprog-09) — đọc kỹ 9.1.1 (thuật ngữ, phép tính kích thước page table một cấp) và 9.1.2 (page table nhiều cấp, phần "Những cân nhắc về kích thước").

**Bẫy.** Với máy 64-bit dùng page 4KiB, page table MỘT cấp cần khoảng 40 petabyte cho một process — con số này không phải "chậm" mà là hoàn toàn bất khả thi để cấp phát. Nhầm lẫn phổ biến: nghĩ page table nhiều cấp chỉ giúp tiết kiệm bộ nhớ đôi chút; thực ra nó là điều kiện sống còn để hệ điều hành 64-bit hoạt động được, nhờ chỉ cấp phát bảng con cho những vùng địa chỉ thực sự được dùng (ví dụ heap thấp + stack cao), bỏ trống mọi thứ ở giữa.

**Tự kiểm tra.** Theo phép tính ở §9.1.2, tổng chi phí bộ nhớ cho page table hai cấp của một process nhỏ (chỉ cần code + heap nhỏ + stack) là bao nhiêu KiB? So sánh với 4MiB của page table một cấp 32-bit.`,
      },
      {
        id: "sp-w8-2",
        text: "TLB, page fault, vì sao locality quyết định hiệu năng",
        lesson: `**Mục tiêu.** Phân biệt đúng 3 loại page fault (minor/major/invalid) và giải thích vì sao một chương trình truy cập bộ nhớ lộn xộn (cache-unfriendly) chậm hơn hẳn dù thuật toán giống hệt.

**Đọc.** [§9.1 Dịch địa chỉ — mục 9.1.3 và 9.1.6](#/docs/sysprog-09) — đọc kỹ vai trò của TLB (9.1.3) và định nghĩa minor/major/invalid fault (9.1.6).

**Bẫy.** Sách nói rõ: page table một cấp làm máy "chậm gấp đôi" vì cần hai lần truy cập bộ nhớ (tra page table rồi mới đọc dữ liệu thật); TLB là cache khắc phục việc này, nhưng chỉ hiệu quả khi chương trình có "tính nhất quán cache (cache coherence) tốt". Bẫy: nhầm TLB miss (chậm hơn vì phải tra page table) với major page fault (chậm hơn NHIỀU vì phải đọc từ đĩa/swap) — hai nguyên nhân chậm hoàn toàn khác bậc độ lớn nhưng đều biểu hiện là "chương trình bỗng dưng chạy chậm".

**Tự kiểm tra.** Một chương trình duyệt mảng 2 chiều theo cột thay vì theo hàng (với mảng lưu row-major) vẫn cho ra kết quả đúng — vậy tại sao nó có thể chạy chậm hơn hẳn, và loại fault/miss nào liên quan trực tiếp đến hiện tượng này?`,
      },
      {
        id: "sp-w8-3",
        text: "mmap: ánh xạ file và bộ nhớ ẩn danh, MAP_SHARED vs MAP_PRIVATE",
        lesson: `**Mục tiêu.** Chọn đúng cờ \`MAP_SHARED\`/\`MAP_PRIVATE\` và \`PROT_*\` cho hai tình huống khác nhau: đọc một file lớn tuần tự, và chia sẻ bộ nhớ giữa process cha–con sau \`fork\`.

**Đọc.** [§9.2 mmap](#/docs/sysprog-09) — đọc kỹ 9.2.1 (định nghĩa các cờ) và 9.2.3 (giao tiếp bằng mmap giữa cha–con qua \`MAP_ANONYMOUS\`).

**Bẫy.** \`MAP_PRIVATE\` "chỉ hiển thị với chính process đó" — ghi vào vùng nhớ này KHÔNG đồng bộ trở lại file trên đĩa và KHÔNG được process khác nhìn thấy, dù ánh xạ ban đầu trỏ tới cùng một file. Ai đó cấp phát \`mmap(..., MAP_PRIVATE, fd, 0)\` rồi mong việc ghi vào bộ nhớ đó "tự lưu xuống file" sẽ ngạc nhiên khi file trên đĩa không hề đổi. Ngược lại, \`MAP_SHARED\` đồng bộ với file VÀ chia sẻ được giữa các process — nhưng \`PROT_WRITE\` chỉ hợp lệ nếu fd bên dưới cũng được mở với quyền ghi.

**Tự kiểm tra.** Trong ví dụ giao tiếp cha–con ở §9.2.3, tại sao phải dùng \`MAP_ANONYMOUS\` kèm \`fd = -1\` thay vì mmap một file thật, khi ta chỉ cần chia sẻ 100 số nguyên tạm thời giữa hai process?`,
      },
      {
        id: "sp-w8-4",
        text: "Pipe: pipe(), đóng đầu không dùng, SIGPIPE, deadlock khi quên đóng",
        lesson: `**Mục tiêu.** Giải thích vì sao \`read()\` trên một pipe có thể block vĩnh viễn ngay cả khi bên ghi "có vẻ" đã đóng, và xử lý đúng \`SIGPIPE\` khi ghi vào pipe không còn ai đọc.

**Đọc.** [§9.3 Pipe](#/docs/sysprog-09) — đọc kỹ 9.3.1 (ví dụ đọc từng byte không bao giờ dừng) và đoạn về \`SIGPIPE\`.

**Bẫy.** Sách chỉ rõ: \`read\` trên pipe chỉ trả về 0 (EOF) khi mọi file descriptor tham chiếu tới đầu ghi đã đóng — không phải chỉ đầu ghi mà process cha đang giữ. Sau \`fork\`, cả cha lẫn con đều có bản sao của cả hai đầu pipe; nếu con quên đóng đầu ghi mà nó không dùng tới (dù không hề ghi gì vào đó), process đọc vẫn treo vĩnh viễn chờ EOF không bao giờ tới, dù về mặt logic "không còn ai đang ghi nữa".

**Tự kiểm tra.** Sau \`fork()\` tạo pipe, process cha muốn đọc còn process con muốn ghi. Ngoài việc con phải đóng đầu đọc của nó, cha có cần đóng đầu ghi của mình không? Nếu cha quên đóng đầu ghi, con ghi xong và đóng đầu ghi của nó — cha có nhận được EOF không?`,
      },
      {
        id: "sp-w8-5",
        text: "Named pipe (FIFO) và so sánh các lựa chọn IPC",
        lesson: `**Mục tiêu.** Giải thích vì sao mở một FIFO bằng \`O_RDWR\` thay vì \`O_RDONLY\`/\`O_WRONLY\` phá vỡ ngữ nghĩa "block cho tới khi có cả bên đọc lẫn bên ghi", và chọn đúng cơ chế IPC (pipe/file/mmap) cho một tình huống cụ thể.

**Đọc.** [§9.4 Named pipe](#/docs/sysprog-09) — đọc kỹ 9.4.2 (race condition với named pipe). Sau đó [§9.6 Các lựa chọn IPC](#/docs/sysprog-09) để so sánh khi nào dùng pipe, file hay mmap.

**Bẫy.** Mở named pipe bằng \`open("fifo", O_RDWR)\` (thay vì đúng một trong hai chiều) khiến \`open\` KHÔNG chờ bên đối diện — vì process đó vừa tự nhận là bên đọc vừa là bên ghi cùng lúc, phá vỡ đúng cơ chế đồng bộ hoá tự nhiên mà named pipe cung cấp miễn phí. Bug này "thỉnh thoảng chạy đúng" tuỳ vào việc process kia đến sớm hay muộn, khiến nó rất khó tái hiện khi debug.

**Tự kiểm tra.** Theo Bảng 9.2 trong §9.4.2, chuỗi thao tác nào (giữa Program 1 mở \`O_RDWR\` và Program 2 mở \`O_RDONLY\`) khiến Program 2 bị block vô hạn dù Program 1 đã ghi xong dữ liệu?`,
      },
    ],
  },
  {
    id: "sp-w9",
    week: "Tuần 9",
    title: "Lập trình mạng",
    goal: "Viết được một cặp TCP client/server tối giản bằng getaddrinfo/socket/bind/listen/accept, và giải thích khi nào nên chọn UDP thay vì TCP.",
    practice: "Viết một echo server TCP dùng epoll để phục vụ nhiều client đồng thời không cần một thread mỗi kết nối.",
    resources: [
      { label: "Ch.11 — Lập trình mạng (Networking)", href: "#/docs/sysprog-11" },
      { label: "man7.org — socket(7)", href: "https://man7.org/linux/man-pages/man7/socket.7.html" },
    ],
    items: [
      {
        id: "sp-w9-1",
        text: "Mô hình OSI và IP: địa chỉ, datagram, phân mảnh",
        lesson: `**Mục tiêu.** Xác định đúng tầng OSI chịu trách nhiệm cho một chức năng cụ thể (định tuyến, thứ tự gói tin, mã hoá...), và giải thích vì sao IP tự nó không đảm bảo gói tin đến đúng thứ tự.

**Đọc.** [§11.1 Mô hình OSI](#/docs/sysprog-11) — đọc kỹ vai trò của tầng 3 và tầng 4. Sau đó [§11.2 Tầng 3: Giao thức Internet](#/docs/sysprog-11), đặc biệt đoạn về địa chỉ đặc biệt (localhost) và câu cuối "IP xử lý định tuyến, phân mảnh và tái hợp".

**Bẫy.** Sách phân định rạch ròi: tầng 3 (IP) chỉ lo định tuyến gói tin (datagram) từ đầu này đến đầu kia; "Ba tầng bên dưới [tầng 4] không đảm bảo gì về thứ tự các gói tin được nhận và điều gì xảy ra khi một gói tin bị mất." Nhầm lẫn phổ biến: tưởng gửi qua IP là gói tin sẽ tự động đến đúng thứ tự, không mất, không trùng — tất cả những đảm bảo đó là việc của TCP ở tầng 4, IP không cung cấp gì trong số đó.

**Tự kiểm tra.** Nếu chỉ dùng IP thuần (không qua TCP hay UDP), một ứng dụng gửi 3 gói tin liên tiếp có thể nhận được chúng theo thứ tự nào ở đầu kia? Tầng nào chịu trách nhiệm sắp xếp lại nếu cần?`,
      },
      {
        id: "sp-w9-2",
        text: "TCP client: getaddrinfo, socket, connect",
        lesson: `**Mục tiêu.** Viết đúng chuỗi \`getaddrinfo\` → \`socket\` → \`connect\` cho một TCP client, và xử lý đúng trường hợp \`read\`/\`write\` trả về ít byte hơn yêu cầu.

**Đọc.** [§11.3.2 TCP Client](#/docs/sysprog-11) — đọc kỹ 4 bước gọi hàm và cách xử lý lỗi riêng của \`getaddrinfo\` (\`gai_strerror\`, không dùng \`errno\`). Đọc thêm [§11.3.3 Gửi chút dữ liệu](#/docs/sysprog-11).

**Bẫy.** Sách cảnh báo trực tiếp: dù TCP "trong hầu hết các điều kiện" đảm bảo byte đến không hỏng, "mã hiệu năng cao và mã dễ gặp lỗi thậm chí sẽ không giả định điều đó" — cụ thể, "số byte đọc hoặc ghi được có thể nhỏ hơn mong đợi." Gọi \`write(fd, buf, 1000)\` một lần và giả định cả 1000 byte đã được gửi là một lỗi kinh điển; phải kiểm tra giá trị trả về và lặp lại cho tới khi gửi đủ, giống hệt cách xử lý \`write\` không đầy đủ trên pipe.

**Tự kiểm tra.** \`getaddrinfo\` trả về một danh sách liên kết các \`addrinfo\` chứ không phải một kết quả duy nhất — tại sao code trong sách vẫn thường chỉ dùng phần tử ĐẦU TIÊN của danh sách để \`connect\`, và điều đó có luôn an toàn không?`,
      },
      {
        id: "sp-w9-3",
        text: "TCP server: bind, listen, accept, và cạm bẫy socket descriptor",
        lesson: `**Mục tiêu.** Viết đúng thứ tự \`socket\` → \`bind\` → \`listen\` → \`accept\` cho một TCP server, và giải thích vì sao dùng nhầm file descriptor của server socket để đọc/ghi dữ liệu với client là sai.

**Đọc.** [§11.4 Tầng 4: TCP Server](#/docs/sysprog-11) — đọc kỹ phần mô tả \`accept\` trả về descriptor mới, và danh sách "vài điểm dễ mắc lỗi khi tạo server" ngay sau đó.

**Bẫy.** Sách liệt kê đúng lỗi này đầu tiên: "Dùng socket descriptor của server socket thụ động" để đọc/ghi — \`accept\` trả về MỘT file descriptor MỚI riêng cho từng client, còn descriptor gốc (từ \`socket\`/\`bind\`/\`listen\`) chỉ dùng để nhận kết nối mới, không bao giờ dùng để \`read\`/\`write\` dữ liệu thật. Một bẫy khác: \`bind\` thất bại nếu port đang ở trạng thái "TIMED-WAIT" sau khi server trước đó đóng — muốn tái sử dụng port ngay, phải đặt \`SO_REUSEPORT\` trước khi \`bind\` (không phải \`SO_REUSEADDR\`, dù tên hai cờ dễ gây nhầm).

**Tự kiểm tra.** Sau khi \`accept\` trả về \`client_fd\`, server socket gốc (\`sock_fd\`) còn dùng để làm gì tiếp theo trong vòng lặp chính của server? Nếu server muốn phục vụ nhiều client, nó có cần gọi lại \`accept\` trên \`sock_fd\` hay trên \`client_fd\`?`,
      },
      {
        id: "sp-w9-4",
        text: "UDP: sendto/recvfrom, khi nào chấp nhận mất gói",
        lesson: `**Mục tiêu.** Viết đúng \`sendto\`/\`recvfrom\` cho một UDP client/server, và giải thích vì sao test trên \`localhost\` không phát hiện được các lỗi liên quan đến mất gói của UDP.

**Đọc.** [§11.5 Tầng 4: UDP](#/docs/sysprog-11) — đọc kỹ 11.5.1 (thuộc tính UDP, đặc biệt gạch đầu dòng đầu tiên) và ví dụ client/server ở 11.5.2/11.5.3.

**Bẫy.** Sách cảnh báo đúng điểm này: tính "unreliable" của UDP "đặc biệt gây bối rối vì nếu bạn chỉ kiểm thử trên thiết bị loopback... thì gói tin hiếm khi bị mất vì không có gói tin mạng nào thực sự được gửi đi." Một chương trình UDP viết ẩu, không xử lý mất gói/trùng gói/sai thứ tự, vẫn "chạy hoàn hảo" suốt quá trình phát triển trên \`127.0.0.1\` — rồi hỏng ngay khi triển khai qua mạng thật.

**Tự kiểm tra.** \`sendto\` trả về thành công không có nghĩa là gói tin đã đến nơi — vậy làm sao một chương trình dùng UDP biết được liệu server có thực sự nhận được gói tin hay không, nếu bản thân giao thức UDP không cung cấp cơ chế đó?`,
      },
      {
        id: "sp-w9-5",
        text: "I/O không chặn, select/poll/epoll, và RPC",
        lesson: `**Mục tiêu.** Phân biệt đúng chế độ level-triggered và edge-triggered của \`epoll\`, và giải thích vì sao dùng edge-triggered mà không đọc tới khi gặp \`EWOULDBLOCK\` khiến file descriptor bị "bỏ rơi".

**Đọc.** [§11.7 I/O không chặn](#/docs/sysprog-11) — đọc kỹ 11.7.1 (epoll) và 11.7.3 (những bẫy linh tinh của epoll, đặc biệt mục 1). Đọc lướt [§11.8 Gọi thủ tục từ xa](#/docs/sysprog-11) để biết RPC là gì và vì sao nó chậm hơn lời gọi cục bộ 10-100 lần.

**Bẫy.** Sách nói rõ ở edge-triggered: bên gọi "chỉ nhận được file descriptor khi nó chuyển từ không có sự kiện sang có sự kiện" — nghĩa là "nếu bạn quên read, write, accept... trên file descriptor cho đến khi nhận được \`EWOULDBLOCK\`, file descriptor đó sẽ bị bỏ rơi" — dữ liệu vẫn còn trong buffer kernel nhưng \`epoll_wait\` sẽ không bao giờ báo lại cho tới khi có dữ liệu MỚI đến, khiến chương trình treo một phần dữ liệu vô thời hạn.

**Tự kiểm tra.** Với \`epoll\` ở chế độ edge-triggered (\`EPOLLET\`), nếu một client gửi 10KB dữ liệu nhưng chương trình chỉ \`read\` 4KB rồi ngừng vì tưởng đã xong, 6KB còn lại sẽ được xử lý khi nào — hay không bao giờ?`,
      },
    ],
  },
  {
    id: "sp-w10",
    week: "Tuần 10",
    title: "Hệ thống tệp, Lập lịch & Bảo mật",
    goal: "Giải thích được inode/hard link/permission bits, so sánh các thuật toán lập lịch CPU bằng đúng công thức turnaround/response/wait time, và chỉ ra một lỗ hổng buffer overflow kinh điển.",
    practice: "Tự tính turnaround/response/wait time cho 5 process theo FCFS, SJF và Round Robin trên cùng một tập dữ liệu, rồi so sánh kết quả.",
    resources: [
      { label: "Ch.12 — Hệ thống tệp (Filesystems)", href: "#/docs/sysprog-12" },
      { label: "Ch.10 — Lập lịch (Scheduling)", href: "#/docs/sysprog-10" },
      { label: "Ch.14 — Bảo mật (Security)", href: "#/docs/sysprog-14" },
      { label: "Ch.15 — Ôn tập (ngân hàng câu hỏi)", href: "#/docs/sysprog-15" },
      { label: "Ch.18 — Phân tích hậu sự cố", href: "#/docs/sysprog-18" },
    ],
    items: [
      {
        id: "sp-w10-1",
        text: "inode, hard link vs symbolic link, thư mục thực chất là gì",
        lesson: `**Mục tiêu.** Giải thích vì sao xoá một tên tệp bằng \`rm\` không nhất thiết xoá dữ liệu, và phân biệt đúng hard link với symbolic link qua số inode.

**Đọc.** [§12.1 Hệ thống tệp là gì?](#/docs/sysprog-12) và [§12.2 Lưu trữ dữ liệu trên đĩa](#/docs/sysprog-12) — đọc kỹ đoạn "Ý tưởng lớn: Hãy quên tên tệp đi" và mục 12.2.5 (Liên kết).

**Bẫy.** Sách nhấn mạnh: "Người ta thường nghĩ tên tệp là tệp 'thực sự'. Không phải vậy!" — inode mới là tệp; tên chỉ là một mục ánh xạ (dirent) trong thư mục trỏ tới inode đó. Hệ quả: một inode có thể có NHIỀU tên (hard link) ở nhiều thư mục khác nhau cùng lúc; \`rm\` một trong các tên chỉ giảm reference count của inode đi 1, dữ liệu chỉ thực sự biến mất khi reference count về 0. Ngược lại, symbolic link là một tệp riêng chứa một đường dẫn văn bản — xoá tệp gốc để lại một symlink "gãy" (dangling) mà \`ls -i\` cho thấy số inode hoàn toàn khác.

**Tự kiểm tra.** Nếu một tệp có 2 hard link (\`file1.txt\` và \`blip.txt\` cùng trỏ tới một inode) và bạn \`rm file1.txt\`, \`blip.txt\` còn đọc được nội dung không? Điều đó có đúng với symbolic link không?`,
      },
      {
        id: "sp-w10-2",
        text: "Bit quyền, setuid, sticky bit, umask",
        lesson: `**Mục tiêu.** Tính đúng quyền một tệp mới được tạo dưới một \`umask\` cho trước, và giải thích vì sao chương trình có bit setuid chạy với quyền của chủ sở hữu tệp chứ không phải người thực thi nó.

**Đọc.** [§12.3 Quyền và các bit](#/docs/sysprog-12) — đọc kỹ 12.3.3 (umask), 12.3.4 (setuid, phân biệt \`getuid\`/\`geteuid\`) và 12.3.5 (sticky bit).

**Bẫy.** Bit setuid không đổi "ai đang chạy chương trình" (\`getuid\` vẫn trả về uid thật) mà chỉ đổi "effective user id" (\`geteuid\`) dùng để kiểm tra quyền lúc chạy — \`sudo\` chính là ví dụ kinh điển: \`-r-s--x--x root wheel .../sudo\`, một binary bất kỳ user nào cũng thực thi được (\`x\` cho other) nhưng chạy với quyền root nhờ bit \`s\`. Nhầm lẫn phổ biến: viết code kiểm tra quyền bằng \`getuid() == 0\` thay vì \`geteuid() == 0\` sẽ bỏ lỡ chính xác trường hợp setuid mà cơ chế này được thiết kế để phục vụ.

**Tự kiểm tra.** umask mặc định là 022 (octal). Một tệp được \`open\` với mode 666 (rw cho user/group/other) sẽ có quyền thực tế là bao nhiêu sau khi áp umask? Viết ra dạng octal và dạng \`rwxrwxrwx\`.`,
      },
      {
        id: "sp-w10-3",
        text: "Virtual filesystem, memory mapped IO, tính tin cậy và journaling",
        lesson: `**Mục tiêu.** Giải thích vì sao tạo một thư mục riêng tư bằng \`mkdir\` rồi \`chmod\` (hai bước) có thể bị khai thác qua race condition, và mô tả journaling giúp gì khi hệ thống crash giữa chừng một thao tác ghi.

**Đọc.** [§12.4 Hệ thống tệp ảo và các hệ thống tệp khác](#/docs/sysprog-12) — đọc kỹ 12.4.1 (ví dụ race condition khi tạo thư mục an toàn). Sau đó [§12.5 IO ánh xạ bộ nhớ](#/docs/sysprog-12) và [§12.6 Hệ thống tệp đơn đĩa tin cậy](#/docs/sysprog-12) (journaling, write-back vs write-through cache).

**Bẫy.** Sách chỉ ra chính xác: \`mkdir /tmp/mystuff\` rồi \`chmod 700 /tmp/mystuff\` có "khoảng thời gian sơ hở giữa lúc thư mục được tạo và lúc quyền của nó được thay đổi" — một người dùng khác kịp thay \`mystuff\` bằng hard link tới tệp của họ trong khoảng hở đó. Lời giải đúng là \`mkdir -m 700\` (nguyên tử), không phải hai lệnh riêng biệt. Bẫy khác: journaling không đảm bảo dữ liệu KHÔNG MẤT khi crash, nó chỉ đảm bảo hệ thống tệp không bị hỏng cấu trúc (có thể dò theo journal để sửa).

**Tự kiểm tra.** Vì sao \`mkdir -m 700 dir\` an toàn hơn \`mkdir dir; chmod 700 dir\` dù hai cách trông như làm cùng một việc?`,
      },
      {
        id: "sp-w10-4",
        text: "Thước đo lập lịch: turnaround, response, waiting time",
        lesson: `**Mục tiêu.** Tính đúng turnaround time, response time và wait time cho một tập process cho trước, không nhầm wait time với "thời gian chờ ban đầu trong ready queue".

**Đọc.** [§10.2 Các phép đo](#/docs/sysprog-10) và [§10.3 Các thước đo hiệu quả](#/docs/sysprog-10) — đọc kỹ định nghĩa công thức của cả 3 thước đo và ví dụ 7 phút CPU / 9 phút thực tế.

**Bẫy.** Sách cảnh báo trực tiếp: "Một sai lầm phổ biến là cho rằng đó [wait time] chỉ là thời gian chờ ban đầu trong ready queue." Một process bị preempt nhiều lần (ví dụ dưới Round Robin) tích luỹ wait time ở MỌI lần nó nằm trong ready queue chờ được cấp CPU trở lại, không chỉ lần đầu tiên trước khi được chạy lần đầu. Công thức đúng là \`end_time - arrival_time - run_time\`, tính tổng toàn bộ thời gian không chạy, bất kể nó bị ngắt quãng bao nhiêu lần.

**Tự kiểm tra.** Một process có \`run_time\` = 3000ms, đến ready queue lúc \`arrival_time\` = 0, và kết thúc lúc \`end_time\` = 8000ms sau khi bị preempt 2 lần. Wait time của nó là bao nhiêu? Có cần biết chính xác nó bị preempt ở những thời điểm nào để tính ra con số này không?`,
      },
      {
        id: "sp-w10-5",
        text: "FCFS, SJF, Round Robin, Priority — ưu nhược và hiện tượng starvation",
        lesson: `**Mục tiêu.** Mô phỏng đúng lịch chạy của FCFS, (P)SJF, Round Robin trên cùng một tập process, và giải thích vì sao Convoy Effect không chỉ là vấn đề riêng của FCFS.

**Đọc.** [§10.4 Các thuật toán lập lịch](#/docs/sysprog-10) — đọc kỹ cả 5 mục con (10.4.1 đến 10.4.5) và bảng ví dụ 5 process dùng xuyên suốt. Đọc lại [§10.3.1 Hiệu ứng đoàn xe](#/docs/sysprog-10).

**Bẫy.** Sách nói rõ ở cuối 10.3.1: "Hiệu ứng này thường được bàn đến trong bối cảnh scheduler FCFS; tuy nhiên, scheduler Round Robin cũng có thể thể hiện Convoy Effect khi time quantum quá dài." Nhầm lẫn phổ biến: nghĩ Round Robin "miễn nhiễm" với Convoy Effect vì nó có preemption — sai, nếu quantum đủ lớn thì RR hành xử gần giống FCFS (sách còn nói khi quantum tiến tới vô cùng, RR = FCFS). Ngoài ra, SJF không preemptive vẫn có thể bỏ đói (starve) các job dài nếu job ngắn liên tục đến.

**Tự kiểm tra.** Với time quantum = 10 giây và một process CPU-bound cần 9000 giây, Round Robin còn có ưu điểm gì so với FCFS trong tình huống này, hay về cơ bản đã suy biến thành FCFS?`,
      },
      {
        id: "sp-w10-6",
        text: "Buffer overflow, stack smashing, và bài học từ post-mortem thật",
        lesson: `**Mục tiêu.** Giải thích chính xác cơ chế một \`strcpy\` không kiểm tra giới hạn có thể ghi đè địa chỉ trả về trên stack, và liên hệ được với ít nhất một sự cố bảo mật thật đã xảy ra vì thiếu bounds checking.

**Đọc.** [§14.2.1 Stack Smashing](#/docs/sysprog-14) và [§14.2.2 Buffer Overflow](#/docs/sysprog-14) — đọc kỹ ví dụ \`greeting\`/\`strcpy\`. Sau đó [§17.2 Stack Smashing](#/docs/sysprog-17) — đọc kỹ ví dụ \`input()\`/\`breakout()\` ghi đè địa chỉ trả về bằng con trỏ hàm. Cuối cùng đọc [§18.2 Heartbleed](#/docs/sysprog-18).

**Bẫy.** §17.2 cho thấy cụ thể: địa chỉ trả về không nằm ở một "nơi bí mật" nào — nó nằm ngay trên stack, cách một biến tự động một khoảng cố định tuỳ kiến trúc/trình biên dịch, và có thể bị ghi đè bằng chính con trỏ thường (\`*((&p)+2) = breakout;\`). Heartbleed (§18.2) cho thấy bug tương tự không cần "ghi đè return address" mới nguy hiểm — chỉ cần THIẾU kiểm tra độ dài yêu cầu so với dữ liệu thật gửi kèm là đủ để rò rỉ bộ nhớ chứa mật khẩu, dù không hề có \`strcpy\` nào trong bức tranh.

**Tự kiểm tra.** Trong ví dụ \`greeting(argv[1])\` ở §14.2.1, biến \`buf[32]\` và địa chỉ trả về của hàm \`greeting\` cái nào nằm ở địa chỉ THẤP hơn trên stack? Vì sao đó là điều kiện cần để tràn \`buf\` có thể ghi đè được địa chỉ trả về?`,
      },
    ],
  },
];
