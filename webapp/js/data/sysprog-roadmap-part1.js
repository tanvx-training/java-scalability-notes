// Lộ trình System Programming — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi mục là KẾ HOẠCH HỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (sp-w<N> / sp-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const sysprogWeeksPart1 = [
  {
    id: "sp-w1",
    week: "Tuần 1",
    title: "Nền tảng & công cụ",
    goal: "Dựng được môi trường C trên Linux và biết dùng hai công cụ sẽ theo bạn suốt khoá: Valgrind và GDB.",
    practice: "Viết một chương trình C rò rỉ bộ nhớ có chủ đích, bắt nó bằng Valgrind, rồi đặt breakpoint trong GDB để xem giá trị con trỏ trước khi rò.",
    resources: [
      { label: "Ch.1 — Giới thiệu", href: "#/docs/sysprog-01" },
      { label: "Ch.2 — Kiến thức nền tảng", href: "#/docs/sysprog-02" },
      { label: "Ch.17 §17.3 Biên dịch và liên kết", href: "#/docs/sysprog-17" },
      { label: "man7.org — man pages trực tuyến", href: "https://man7.org/linux/man-pages/" },
    ],
    items: [
      {
        id: "sp-w1-1",
        text: "Ranh giới user space / kernel space và vì sao system call đắt",
        lesson: `**Mục tiêu.** Giải thích được vì sao \`printf\` không phải system call còn \`write\` thì có, và điều đó ảnh hưởng gì tới hiệu năng.

**Đọc.** [§2.1 Kiến trúc hệ thống](#/docs/sysprog-02) — đọc kỹ phần ranh giới hai không gian. Chưa cần nhớ danh sách system call.

**Bẫy.** Lẫn giữa **hàm thư viện C** (\`printf\`, \`malloc\` — chạy trong user space) và **system call** (\`write\`, \`brk\`/\`mmap\` — chuyển sang kernel). \`printf\` gọi \`write\` *bên dưới*, nhưng có buffer riêng — đó là lý do output đôi khi không ra đúng thứ tự bạn nghĩ khi chương trình crash.

**Tự kiểm tra.** Vì sao gọi \`write\` 1000 lần với 1 byte chậm hơn nhiều so với gọi 1 lần với 1000 byte, dù tổng số byte như nhau?`,
      },
      {
        id: "sp-w1-2",
        text: "Biên dịch & liên kết: gcc, object file, static vs dynamic linking",
        lesson: `**Mục tiêu.** Giải thích được sự khác nhau giữa liên kết tĩnh và liên kết động, và biết lỗi nào xảy ra ở giai đoạn nào (biên dịch, liên kết, hay lúc chạy).

**Đọc.** [§17.3 Biên dịch và liên kết](#/docs/sysprog-17) — đọc kỹ 7 giai đoạn và bảng ưu/nhược của static vs dynamic linking. Bỏ qua phần "Giải thích vấn đề Fork-FILE" ở cuối, không liên quan tới mục này.

**Bẫy.** Nghĩ rằng biên dịch xong nghĩa là chương trình đã "đóng gói" toàn bộ mã cần chạy. Với thư viện động, hàm chỉ thực sự được điền địa chỉ **lúc hệ điều hành nạp chương trình**, không phải lúc \`gcc\` chạy xong — đó là lý do hai bản build giống hệt nhau nhưng khác thư viện chia sẻ trên máy có thể chạy khác nhau, và tại sao ai đó có thể "thay" một \`.so\` để chèn mã độc.

**Tự kiểm tra.** Vì sao trình liên kết tĩnh có thể báo lỗi "undefined reference" ngay lúc build, nhưng chương trình dùng thư viện động lại biên dịch trót lọt rồi mới sập lúc chạy nếu thiếu file \`.so\`?`,
      },
      {
        id: "sp-w1-3",
        text: "Valgrind: đọc báo cáo leak, invalid read/write",
        lesson: `**Mục tiêu.** Đọc được một báo cáo Valgrind/Memcheck thật và chỉ ra chính xác dòng gây lỗi cùng loại lỗi (invalid write, definitely lost).

**Đọc.** [§2.3 Valgrind](#/docs/sysprog-02) — chạy đúng ví dụ \`dummy_function\` trong sách, so kết quả in ra với phần giải thích bên dưới nó. Chưa cần đọc phần TSAN (§2.3.1) nếu chưa học đa luồng.

**Bẫy.** Chương trình mẫu trong sách "biên dịch và chạy mà không có lỗi" ở góc nhìn thông thường — tức là không segfault. Valgrind không phải công cụ bắt crash; nó bắt những vi phạm **chưa gây crash ngay** (ghi vượt biên một khối đã cấp phát, quên free) mà một ngày nào đó sẽ gây ra hành vi khó tái hiện. Đừng đợi chương trình sập mới chạy Valgrind.

**Tự kiểm tra.** Trong ví dụ \`dummy_function\`, vì sao Valgrind báo "Invalid write of size 4" đúng tại lệnh \`x[10] = 0\`, còn "definitely lost" lại báo ở cuối hàm, không tại một lệnh cụ thể nào?`,
      },
      {
        id: "sp-w1-4",
        text: "GDB: breakpoint, bt, print, watch, debug core dump",
        lesson: `**Mục tiêu.** Dùng được breakpoint, \`bt\`, \`print\` và \`x\` để tìm ra vì sao một vòng lặp không bao giờ chạy hoặc chạy sai giá trị.

**Đọc.** [§2.4 GDB](#/docs/sysprog-02) — đặc biệt mục 2.4.1 "Một ví dụ gdb chi tiết", vì nó mô phỏng đúng quy trình suy luận thật, không chỉ liệt kê lệnh. Có thể lướt qua 2.4.5 strace/ltrace, để dành cho sau.

**Bẫy.** Đặt breakpoint đúng dòng không có nghĩa là nó sẽ được kích hoạt — một điều kiện vòng lặp sai (ví dụ \`deg > 360\` khi \`deg\` bắt đầu từ 0) khiến thân vòng lặp không bao giờ chạy, nên breakpoint bên trong nó im lặng không báo gì cả. Sự im lặng đó của GDB cũng là một manh mối cần đọc ra.

**Tự kiểm tra.** Trong ví dụ \`convert_to_radians\` của sách, vì sao \`(31415 / 1000) * deg / 180\` cho kết quả sai dù công thức toán học viết ra có vẻ đúng?`,
      },
    ],
  },
  {
    id: "sp-w2",
    week: "Tuần 2",
    title: "C cốt lõi — cú pháp, mô hình bộ nhớ, con trỏ",
    goal: "Đọc và viết được C ở mức đủ để tự gỡ lỗi bộ nhớ do chính mình gây ra: phân biệt được lỗi trình biên dịch bắt được với undefined behavior mà nó không bắt được.",
    practice: "Viết một chương trình cố tình chứa 3 lỗi kinh điển (double free, off-by-one, dùng biến chưa khởi tạo), dự đoán hành vi trước khi chạy, rồi xác nhận lại bằng Valgrind.",
    resources: [
      { label: "Ch.3 — Ngôn ngữ lập trình C", href: "#/docs/sysprog-03" },
      { label: "cppreference.com — tra cứu chuẩn C", href: "https://en.cppreference.com/w/c" },
    ],
    items: [
      {
        id: "sp-w2-1",
        text: "Cú pháp C và kiểu dữ liệu, sizeof, ép kiểu ngầm",
        lesson: `**Mục tiêu.** Dự đoán đúng kết quả khai triển của một macro có tham số trước khi biên dịch, và biết khi nào \`sizeof\` cho ra một con số vô nghĩa.

**Đọc.** [§3.2 Khóa học cấp tốc nhập môn C](#/docs/sysprog-03) — phần bộ tiền xử lý, và [§3.3 Các phương tiện của ngôn ngữ](#/docs/sysprog-03) — bảng kiểu dữ liệu và toán tử. Không cần học thuộc bảng, chỉ cần biết tra khi cần.

**Bẫy.** Macro là phép thay thế **văn bản**, không phải hàm — \`#define min(a,b) a<b?a:b\` gọi với \`min(x++, 5)\` khai triển thành \`x++<5?x++:5\`, tăng \`x\` hai lần. Tệ hơn: macro \`ARRAY_LENGTH(A) (sizeof(A)/sizeof(A[0]))\` đúng với mảng tĩnh nhưng cho số vô nghĩa khi \`A\` là một con trỏ do \`malloc\` trả về — \`sizeof\` của con trỏ không biết gì về vùng nhớ nó trỏ tới.

**Tự kiểm tra.** Viết lại khai triển đầy đủ của \`10 + min(99, 100)\` theo đúng độ ưu tiên toán tử — kết quả có phải 100 như trực giác ban đầu không?`,
      },
      {
        id: "sp-w2-2",
        text: "Mô hình bộ nhớ: text / data / bss / heap / stack",
        lesson: `**Mục tiêu.** Vẽ được sơ đồ các vùng bộ nhớ của một chương trình cụ thể và chỉ ra vùng nào ghi được, vùng nào chỉ đọc.

**Đọc.** [§3.6 Mô hình bộ nhớ của C](#/docs/sysprog-03) — đọc kỹ phần "Nơi chứa chuỗi" và ví dụ struct dùng mảng độ dài không (\`char c_str[0]\`). Phần đóng gói struct ở phụ lục có thể để dành khi học nâng cao.

**Bẫy.** \`char *ptr = "Hi"\` và \`char arr[] = "Hi"\` trông giống nhau nhưng khác vùng nhớ: \`ptr\` trỏ vào phân đoạn dữ liệu **chỉ đọc**, còn \`arr\` là bản sao ghi được nằm trên stack. \`strcpy(ptr, "Yo")\` biên dịch được nhưng SEGFAULT lúc chạy — trình biên dịch không hề cảnh báo trước.

**Tự kiểm tra.** Với mảng độ dài không \`char c_str[0]\` ở cuối struct, \`sizeof(struct)\` có tính vùng cho \`c_str\` không? Vậy \`malloc\` cần cấp phát bao nhiêu byte để chứa thêm chuỗi "person" (6 ký tự)?`,
      },
      {
        id: "sp-w2-3",
        text: "Con trỏ và số học con trỏ",
        lesson: `**Mục tiêu.** Tính đúng số byte mà một phép cộng/trừ con trỏ thực sự dịch chuyển, với mọi kiểu con trỏ, không chỉ \`char*\`.

**Đọc.** [§3.7 Con trỏ](#/docs/sysprog-03) — phần số học con trỏ và con trỏ void; sau đó tự làm [§3.12 Hỏi nhanh: Số học con trỏ](#/docs/sysprog-03) trước khi xem đáp án ngay bên dưới nó.

**Bẫy.** \`int* ptr3, ptr4;\` chỉ khai báo \`ptr3\` là con trỏ — \`ptr4\` là một \`int\` bình thường, vì dấu \`*\` chỉ gắn với biến đứng ngay sau nó, không gắn với kiểu. Và số học con trỏ luôn nhân theo \`sizeof\` của kiểu bên dưới: \`bna += 1\` trên một \`int*\` nhảy 4 byte chứ không phải 1, dù cú pháp trông như "chỉ cộng 1".

**Tự kiểm tra.** Tự làm cả 7 câu hỏi nhanh ở §3.12 trước khi nhìn đáp án — sai câu nào cho biết bạn còn nhầm quy tắc nào?`,
      },
      {
        id: "sp-w2-4",
        text: "Chuỗi C: strlen/strcpy/strcat/strncpy, byte NUL",
        lesson: `**Mục tiêu.** Dùng đúng \`strtok\`/\`strtol\` mà không dính lỗi trạng thái ẩn hoặc lỗi bị nuốt im lặng.

**Đọc.** [§3.5.4 string.h](#/docs/sysprog-03) — đọc kỹ ví dụ \`strtok\` và đoạn về \`strtol\`/\`errno\`. Có thể bỏ qua phần liệt kê \`strchr\`/\`strstr\` nếu đã quen, quay lại tra khi cần dùng.

**Bẫy.** \`strtok\` **sửa trực tiếp** chuỗi đầu vào (chèn byte NUL tại mỗi dấu phân cách) và giữ trạng thái ẩn giữa các lần gọi kế tiếp (\`strtok(NULL, ...)\`) — gọi nó từ hai chỗ khác nhau xen kẽ nhau sẽ đá trạng thái của nhau. Còn \`strtol\` trả về 0 cả khi phân tích **thành công** lẫn khi **thất bại**; phải kiểm tra \`errno\` mới phân biệt được hai trường hợp.

**Tự kiểm tra.** Chuỗi \`"strtok,is,tricky,,,!!"\` (có 3 dấu phẩy liền nhau) khi tách bằng \`strtok(..., ",")\` cho ra bao nhiêu token, và vì sao?`,
      },
      {
        id: "sp-w2-5",
        text: "Lỗi C kinh điển: off-by-one, dangling pointer, undefined behavior",
        lesson: `**Mục tiêu.** Nhận diện bằng mắt được ít nhất 5 lỗi C kinh điển trong một đoạn mã ngắn, không cần chạy chương trình.

**Đọc.** [§3.8 Các lỗi thường gặp](#/docs/sysprog-03) và [§3.9 Lỗi logic và luồng chương trình](#/docs/sysprog-03) — đọc lướt tất cả các mục con một lượt, đây là danh sách để tra chứ không phải để học thuộc lòng.

**Bẫy.** Lỗi nguy hiểm nhất trong nhóm này không phải lỗi crash ngay mà là lỗi *im lặng*: \`if (answer = 42)\` (gán thay vì so sánh) vẫn biên dịch, vẫn chạy, và có thể cho ra kết quả "đúng một cách tình cờ" — nó chỉ lộ ra khi logic phức tạp hơn. Tương tự, \`malloc(sizeof(user))\` với \`user\` là con trỏ chỉ cấp phát đúng kích thước một con trỏ (8 byte) chứ không phải cả struct.

**Tự kiểm tra.** Trong đoạn \`for(int i=0;i<5;i++) ; printf(...)\`, dấu \`;\` thừa ngay sau vòng \`for\` ảnh hưởng thế nào đến số lần \`printf\` thực sự chạy?`,
      },
    ],
  },
  {
    id: "sp-w3",
    week: "Tuần 3",
    title: "Bộ cấp phát bộ nhớ",
    goal: "Giải thích được vì sao malloc/free chậm hơn dùng biến cục bộ, và tự vẽ được sơ đồ một free list sau vài lần cấp phát/giải phóng liên tiếp.",
    practice: "Cài đặt một malloc/free tối giản dùng implicit free list và chiến lược first-fit, rồi so sánh mức phân mảnh với việc gọi calloc/realloc chuẩn trên cùng một chuỗi cấp phát.",
    resources: [
      { label: "Ch.5 — Bộ cấp phát bộ nhớ", href: "#/docs/sysprog-05" },
      { label: "man7.org — malloc(3)", href: "https://man7.org/linux/man-pages/man3/malloc.3.html" },
    ],
    items: [
      {
        id: "sp-w3-1",
        text: "API: malloc/free/calloc/realloc, cái nào zero-fill",
        lesson: `**Mục tiêu.** Nói đúng vùng nhớ mà mỗi hàm trong họ \`malloc/calloc/realloc/free\` trả về có được khởi tạo hay không, và xử lý đúng giá trị trả về của \`realloc\`.

**Đọc.** [§5.2 API cấp phát bộ nhớ của C](#/docs/sysprog-05) — đọc kỹ đoạn về \`sbrk\` và ví dụ minh hoạ vì sao bộ nhớ vừa \`malloc\` từ hệ điều hành thường là 0 nhưng bộ nhớ tái sử dụng sau \`free\` thì không.

**Bẫy.** "Bộ nhớ mới xin từ OS luôn bằng 0" là đúng — nhưng đó là hành vi của **trang bộ nhớ mới**, không phải một cam kết chung của \`malloc\`. Nếu bạn \`free\` một khối rồi \`malloc\` lại kích thước tương tự, khối đó rất có thể chứa rác của lần cấp phát trước, không phải toàn số 0 — chương trình "chạy đúng" lúc đầu chỉ vì may mắn.

**Tự kiểm tra.** Viết lại đoạn dùng \`realloc\` không kiểm tra giá trị trả về thành bản an toàn — điều gì xảy ra với con trỏ gốc nếu \`realloc\` trả về \`NULL\`?`,
      },
      {
        id: "sp-w3-2",
        text: "Chiến lược đặt khối: first / best / worst fit, phân mảnh",
        lesson: `**Mục tiêu.** Phân biệt được phân mảnh trong và phân mảnh ngoài bằng một ví dụ tự vẽ, và giải thích vì sao first-fit hay best-fit không có người thắng tuyệt đối.

**Đọc.** [§5.3 Nhập môn cấp phát](#/docs/sysprog-05) — đọc kỹ ví dụ heap 64K với 3 khoảng trống, so sánh first/best/worst-fit trên cùng một yêu cầu 2KiB. Phần khảo sát toán học (tỷ số ~1.7) chỉ cần nhớ kết luận, không cần nhớ chứng minh.

**Bẫy.** Trực giác "best-fit luôn tiết kiệm bộ nhớ nhất" không đúng tuyệt đối: khi khối chọn được chỉ lớn hơn yêu cầu một chút, phần dư sau khi tách quá nhỏ để còn dùng được — sách chỉ ra đây là kiểu phân mảnh mà best-fit dễ mắc phải, và khảo sát thực nghiệm cho thấy first-fit sắp theo địa chỉ đạt hiệu quả gần tương đương.

**Tự kiểm tra.** Với heap có 3 khoảng trống 16KiB, 30KiB và 2KiB, và một yêu cầu \`malloc(2048)\`, first-fit và best-fit chọn khoảng trống nào — có luôn khác nhau không?`,
      },
      {
        id: "sp-w3-3",
        text: "Tự xây allocator: header, splitting, coalescing, căn lề",
        lesson: `**Mục tiêu.** Cài đặt được một \`malloc\`/\`free\` tối giản dùng implicit free list và boundary tag, và biết vì sao con trỏ trả về không trỏ vào đúng đầu khối thật.

**Đọc.** [§5.4 Hướng dẫn xây dựng bộ cấp phát bộ nhớ](#/docs/sysprog-05) — đọc kỹ phần con trỏ ngầm giữa các khối và phần căn chỉnh (§5.4.2). Có thể lướt §5.4.5 explicit free list nếu chỉ làm bài first-fit đơn giản.

**Bẫy.** Con trỏ header của một khối và con trỏ mà \`malloc\` trả về cho người gọi **không phải cùng một địa chỉ** — phải cộng thêm kích thước metadata trước khi trả về. Và khi nhảy từ khối này sang khối kế tiếp bằng cộng con trỏ, quên ép kiểu về \`char*\` trước khi cộng sẽ khiến con trỏ nhảy sai hàng chục, hàng trăm byte, vì số học con trỏ luôn nhân theo \`sizeof\` của kiểu đang dùng.

**Tự kiểm tra.** Nếu chỉ lưu size ở đầu khối mà không cấy boundary tag ở cuối, thao tác gộp khối lùi (coalesce với khối liền trước) khi \`free\` còn thực hiện được không? Vì sao?`,
      },
      {
        id: "sp-w3-4",
        text: "Buddy allocator và SLUB",
        lesson: `**Mục tiêu.** Giải thích được vì sao buddy allocator gộp/tách khối nhanh hơn allocator dùng danh sách liên kết, và đánh đổi gì để đạt được tốc độ đó.

**Đọc.** [§5.5 Buddy Allocator](#/docs/sysprog-05) và [§5.6 SLUB Allocator](#/docs/sysprog-05) — hai case study ngắn, đọc để so sánh với nhau, không cần nhớ chi tiết cài đặt thật của kernel Linux.

**Bẫy.** Buddy allocator nhanh chính vì nó **hy sinh** độ chính xác kích thước: một yêu cầu 68 byte luôn bị làm tròn lên khối 128 byte gần nhất, dù 60 byte bị lãng phí — đây là đánh đổi tốc độ (tính khối liền kề trực tiếp từ địa chỉ, không cần duyệt) lấy phân mảnh trong, ngược hẳn với allocator tuần trước vốn ít lãng phí hơn nhưng chậm hơn.

**Tự kiểm tra.** SLUB dùng segregated list theo kích thước cấp phát thực tế thay vì lũy thừa của 2 như buddy — điều đó đánh đổi gì so với buddy về tốc độ tìm khối liền kề để gộp?`,
      },
    ],
  },
  {
    id: "sp-w4",
    week: "Tuần 4",
    title: "Tiến trình — fork / exec / wait",
    goal: "Viết được một shell tối giản chạy lệnh con bằng đúng mẫu fork-exec-wait, xử lý đúng exit status và không để lại zombie.",
    practice: "Viết chương trình fork ra 5 process con, mỗi con exec một lệnh khác nhau, cha đợi tất cả rồi in exit status của từng con bằng WIFEXITED/WEXITSTATUS.",
    resources: [
      { label: "Ch.4 — Tiến trình", href: "#/docs/sysprog-04" },
      { label: "man7.org — fork(2)", href: "https://man7.org/linux/man-pages/man2/fork.2.html" },
    ],
    items: [
      {
        id: "sp-w4-1",
        text: "File descriptor và nội dung một process",
        lesson: `**Mục tiêu.** Liệt kê được các thành phần một process mang theo (không chỉ mã nguồn) và giải thích vì sao file descriptor là số nguyên chứ không phải con trỏ trực tiếp tới file.

**Đọc.** [§4.1 File Descriptors](#/docs/sysprog-04) và [§4.3 Nội dung của tiến trình](#/docs/sysprog-04) — đọc kỹ bố cục bộ nhớ (stack/heap/data/bss/text) và mục "Các nội dung khác" (PID, quyền, biến môi trường).

**Bẫy.** File descriptor là một số nguyên chỉ có ý nghĩa **trong phạm vi một process** — fd số 3 ở process A và fd số 3 ở process B có thể trỏ tới hai thứ hoàn toàn khác nhau, dù cùng con số. Nhầm điều này khiến người mới nghĩ có thể "truyền" một fd sang process khác chỉ bằng cách gửi con số đó qua biến toàn cục — không hoạt động, vì bảng file descriptor là của riêng từng process.

**Tự kiểm tra.** Vùng heap và vùng stack lớn lên theo hai hướng ngược nhau trong không gian địa chỉ — vì sao thiết kế theo cách đó, thay vì để cả hai lớn lên cùng một chiều?`,
      },
      {
        id: "sp-w4-2",
        text: "fork: hai giá trị trả về, copy-on-write, thứ tự không xác định",
        lesson: `**Mục tiêu.** Dự đoán chính xác process con thấy gì ngay sau \`fork()\` — kể cả những thứ "vô hình" như buffer chưa flush của \`printf\`.

**Đọc.** [§4.4 Giới thiệu về fork](#/docs/sysprog-04) — đọc kỹ ví dụ \`printf\` không có \`\\n\` trước khi \`fork()\`, và mục 4.4.5 tóm tắt POSIX (cái gì được kế thừa, cái gì không).

**Bẫy.** \`fork()\` sao chép **toàn bộ bộ nhớ của process, kể cả buffer chưa flush của stdout** — nếu \`printf("Answer: %d", x)\` chưa có \`\\n\` và chưa gọi \`fflush\`, cả cha lẫn con đều mang theo bản sao của buffer đó, và có thể in ra **hai lần** khi mỗi process thoát, dù mã nguồn chỉ gọi \`printf\` một lần. Đây không phải lỗi của fork, mà là hệ quả của I/O có buffer.

**Tự kiểm tra.** Giá trị trả về của \`fork()\` khác nhau ở cha và con — vì sao thiết kế lại chọn "0 cho con, PID dương cho cha" thay vì để con tự gọi \`getpid()\` là đủ?`,
      },
      {
        id: "sp-w4-3",
        text: "wait/waitpid, macro WIFEXITED/WEXITSTATUS, zombie & orphan",
        lesson: `**Mục tiêu.** Dùng đúng cặp macro \`WIFEXITED\`/\`WEXITSTATUS\` sau \`waitpid\`, và giải thích được zombie khác orphan ở điểm nào.

**Đọc.** [§4.5 Chờ và thực thi](#/docs/sysprog-04) — đọc kỹ 4.5.1 (mã thoát) và 4.5.2 (zombie/orphan). Mục 4.5.3 (chờ bất đồng bộ bằng \`SIGCHLD\`) có thể để dành tới tuần Tín hiệu.

**Bẫy.** Các macro \`WIFEXITED\`/\`WEXITSTATUS\`/... **không tự kiểm tra tiền điều kiện giúp bạn** — gọi \`WEXITSTATUS(status)\` khi process thực ra bị signal giết chết (chưa qua \`WIFEXITED\`) cho ra một con số vô nghĩa mà không hề báo lỗi. Và process cha "quên" \`wait\` một con đã chết không làm con đó biến mất — nó thành **zombie**, chiếm một chỗ trong bảng process cho tới khi được wait hoặc cha nó chết (khi đó \`init\` dọn hộ).

**Tự kiểm tra.** Một process cha chạy rất lâu mà không bao giờ \`wait()\` các con của nó — điều gì xảy ra về lâu dài, và triệu chứng đầu tiên bạn quan sát được là gì?`,
      },
      {
        id: "sp-w4-4",
        text: "Họ hàm exec, vì sao exec không trở về",
        lesson: `**Mục tiêu.** Chọn đúng biến thể \`exec*\` (l/v, p, e) cho một tình huống cụ thể, và biết cái gì sống sót qua exec, cái gì không.

**Đọc.** [§4.6 exec](#/docs/sysprog-04) — đọc kỹ quy ước đặt tên (l/v/p/e) và mục 4.6.1 (chi tiết POSIX: fd nào sống sót, signal handler có sống sót không).

**Bẫy.** File descriptor **sống sót qua exec** trừ khi có cờ \`O_CLOEXEC\` — process mới, dù là chương trình hoàn toàn khác, vẫn có thể vô tình thừa hưởng và giữ mở một fd mà bạn tưởng đã "đóng lại khi chạy chương trình mới". Ngược lại, signal handler do bạn cài **không** sống sót — chương trình mới không biết mã handler cũ nằm ở đâu nên nó bị đặt lại về mặc định.

**Tự kiểm tra.** \`system("ls")\` thực chất gọi \`execl("/bin/sh", "/bin/sh", "-c", "ls")\` — vì sao truyền thẳng đối số người dùng vào \`system()\` lại nguy hiểm hơn nhiều so với gọi \`execlp\` trực tiếp với đối số đó?`,
      },
      {
        id: "sp-w4-5",
        text: "Mẫu fork-exec-wait — cách shell chạy lệnh",
        lesson: `**Mục tiêu.** Viết được một vòng lặp fork-exec-wait không rơi vào fork bomb khi exec thất bại.

**Đọc.** [§4.7 Mẫu fork-exec-wait](#/docs/sysprog-04) — đọc lại kỹ ví dụ fork bomb do gõ nhầm \`ehco\` ở mục 4.4.3 (dù nằm ở phần trước, nó giải thích trực tiếp cái bẫy của mẫu này).

**Bẫy.** Nếu \`exec*\` thất bại (ví dụ gõ sai tên lệnh) mà process con không tự \`exit()\` ngay, nó sẽ **rơi tiếp xuống phần code còn lại của vòng lặp fork** — với một vòng \`for\` định tạo N con mà mỗi con "sống sót" sau exec hỏng, số process con thực tế tạo ra tăng theo cấp số nhân, không phải N như bạn tưởng.

**Tự kiểm tra.** Trong vòng lặp fork-exec-wait, câu lệnh nào bắt buộc phải đứng ngay sau lời gọi \`exec*\` thất bại trong nhánh con, và vì sao thiếu nó nguy hiểm hơn hẳn một lỗi logic thông thường?`,
      },
    ],
  },
  {
    id: "sp-w5",
    week: "Tuần 5",
    title: "Tín hiệu",
    goal: "Viết được một chương trình bắt Ctrl-C bằng sigaction, dọn dẹp sạch sẽ rồi thoát, thay vì chết đột ngột hoặc treo mãi.",
    practice: "Viết một handler cho SIGINT dùng volatile sig_atomic_t để thoát vòng lặp chính an toàn, rồi thử phá nó bằng cách gọi printf trong handler và giải thích tại sao đó là lỗi.",
    resources: [
      { label: "Ch.13 — Tín hiệu", href: "#/docs/sysprog-13" },
      { label: "man7.org — signal(7)", href: "https://man7.org/linux/man-pages/man7/signal.7.html" },
    ],
    items: [
      {
        id: "sp-w5-1",
        text: "Signal là gì, hành vi mặc định, SIGKILL/SIGSTOP không bắt được",
        lesson: `**Mục tiêu.** Liệt kê được 4 giai đoạn vòng đời của một signal (sinh ra, chờ, bị chặn, được chuyển giao) và giải thích vì sao \`SIGKILL\`/\`SIGSTOP\` là ngoại lệ.

**Đọc.** [§13.1 Tìm hiểu sâu về tín hiệu](#/docs/sysprog-13) — đọc kỹ bảng signal disposition và bảng các signal POSIX phổ biến. Chưa cần đọc phần gửi/xử lý signal (13.2, 13.3) ở mục này.

**Bẫy.** Không phải mọi signal đều có thể bị bắt hay bỏ qua — \`SIGKILL\` và \`SIGSTOP\` **không có disposition tùy chỉnh**: hệ điều hành cố tình không cho phép chương trình can thiệp vào hai signal này, để luôn có một cách chắc chắn dừng được một process dù nó lỗi nặng đến đâu.

**Tự kiểm tra.** Signal disposition khác signal mask ở điểm nào — một cái quyết định *làm gì* khi signal tới, cái kia quyết định *có được tới* hay không?`,
      },
      {
        id: "sp-w5-2",
        text: "Gửi signal: kill, raise, alarm, từ bàn phím",
        lesson: `**Mục tiêu.** Gửi được một signal cụ thể tới process khác bằng cả dòng lệnh (\`kill\`) lẫn trong code C (\`kill()\`, \`raise()\`), và biết giới hạn quyền khi làm vậy.

**Đọc.** [§13.2 Gửi tín hiệu](#/docs/sysprog-13) — đọc kỹ ví dụ \`SIGSTOP\`/\`SIGCONT\` tạm dừng rồi chạy tiếp một process nền, và đoạn giải thích vì sao không nên dùng \`kill -9\`.

**Bẫy.** \`kill -9\` (tức \`SIGKILL\`) giết process ngay lập tức nhưng **không cho nó cơ hội dọn dẹp** — không đóng socket, không xoá file tạm, không báo cho process con. Sách khuyên gửi \`SIGTERM\` (15) trước, đợi, rồi mới leo thang. Ngoài ra, process không phải root chỉ được gửi signal cho process của **cùng người dùng** với mình, không thể tùy ý \`kill\` process của người khác.

**Tự kiểm tra.** Vì sao trình tự khuyến nghị là gửi \`SIGTERM\` trước rồi mới \`SIGKILL\`, thay vì luôn dùng \`SIGKILL\` cho chắc chắn?`,
      },
      {
        id: "sp-w5-3",
        text: "sigaction và hàm async-signal-safe (vì sao không printf trong handler)",
        lesson: `**Mục tiêu.** Viết được một signal handler chỉ set một cờ \`volatile sig_atomic_t\` thay vì gọi thẳng logic ứng dụng bên trong handler, và giải thích vì sao phải làm vậy.

**Đọc.** [§13.3 Xử lý tín hiệu](#/docs/sysprog-13) — đọc kỹ ví dụ hàm \`func\` với buffer tĩnh bị signal chen ngang, và mẫu \`pleaseStop\`/\`volatile sig_atomic_t\`. Phần struct \`sigaction\` (13.3.1) có thể tra khi cần viết code thật.

**Bẫy.** Hầu hết hàm thư viện (kể cả \`printf\`, \`malloc\`) là **async-signal-unsafe**: nếu chương trình chính đang giữa chừng gọi \`malloc\` thì bị signal ngắt, mà handler cũng gọi \`malloc\`/\`printf\`, cấu trúc dữ liệu nội bộ của \`malloc\` đang ở trạng thái dở dang sẽ bị hỏng — đây là hành vi không xác định tất yếu, không phải một lỗi hiếm gặp.

**Tự kiểm tra.** Vì sao khai \`int pleaseStop\` bình thường (không \`volatile sig_atomic_t\`) có thể khiến trình biên dịch tối ưu vòng lặp \`while(!pleaseStop)\` thành một vòng lặp vô hạn thực sự?`,
      },
      {
        id: "sp-w5-4",
        text: "Chặn signal: sigprocmask, sigwait, signal trong process con và thread",
        lesson: `**Mục tiêu.** Giải thích được signal mask khác signal disposition ở phạm vi áp dụng (theo từng thread hay theo cả process), và dùng đúng \`sigprocmask\`/\`pthread_sigmask\`.

**Đọc.** [§13.4 Chặn tín hiệu](#/docs/sysprog-13) và [§13.5 Tín hiệu trong tiến trình con và luồng](#/docs/sysprog-13) — đọc kỹ ví dụ dùng thread riêng với \`sigwait\`, và đoạn tóm tắt fork/exec kế thừa những gì.

**Bẫy.** Lỗi kinh điển: gọi \`sigaddset(&set, SIGINT)\` mà quên \`sigemptyset(&set)\` trước — \`set\` chứa rác chưa khởi tạo, nên mask thực tế không phải "chỉ chặn SIGINT" như bạn tưởng. Một bẫy khác: **signal mask là của từng thread**, nhưng **signal disposition (bắt bằng handler nào) lại là của cả process** — đặt \`sigaction\` từ một thread áp dụng cho mọi thread khác trong cùng process.

**Tự kiểm tra.** Sau \`fork()\`, signal mask và signal disposition của process cha có được process con kế thừa không? Còn các signal đang ở trạng thái pending thì sao?`,
      },
    ],
  },
];
