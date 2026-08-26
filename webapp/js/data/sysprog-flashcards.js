// Flashcard System Programming — ôn tập theo lặp lại ngắt quãng.
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi thẻ trích dẫn mục nguồn trong sách (§X.Y) để nhảy ngược tra cứu.
// GIỮ NGUYÊN id (spf001–spf090) — tiến độ ôn tập trong localStorage lưu theo id.

export const sysprogFlashcards = [
  // ===== sp-c — C & Bộ nhớ (spf001–spf018) =====
  {
    id: "spf001",
    field: "sysprog",
    topic: "sp-c",
    front: "`malloc`, `calloc`, `realloc(NULL, n)` — cái nào bảo đảm vùng nhớ trả về đã được zero?",
    back: "Chỉ `calloc` bảo đảm zero-fill: nó nhận hai đối số (số phần tử, kích thước mỗi phần tử) và khởi tạo nội dung về không. `malloc` **để lại dữ liệu rác** trong bộ nhớ vì lý do hiệu năng; `realloc(NULL, n)` cũng không zero. Sách nói rõ: hãy kiểm tra code để chắc chắn mọi giá trị đều được khởi tạo. (§5.2)",
    code: null,
  },
  {
    id: "spf002",
    field: "sysprog",
    topic: "sp-c",
    front: "Đoạn code sao chép chuỗi này sai ở đâu?",
    back: "`malloc(strlen(src))` thiếu 1 byte cho ký tự NUL kết thúc chuỗi. Để lưu `\"Hi\"` cần 3 byte: `[H] [i] [\\0]`. `strcpy` sẽ tự đặt byte NUL nên nó ghi `strlen(src) + 1` byte → tràn heap một byte. Sửa: `malloc(strlen(src) + 1)`. (§3.8.6)",
    code: {
      lang: "c",
      text: `char *copy(char *src) {
  char *result = malloc(strlen(src));
  strcpy(result, src);
  return result;
}`,
    },
  },
  {
    id: "spf003",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao `strcpy(ary, \"World\")` chạy được còn `strcpy(ptr, \"World\")` lại SEGFAULT?",
    back: "`char ary[] = \"Hello\"` sao chép literal thành một **bản sao ghi được** trên stack (hoặc data segment). `char *ptr = \"Hello\"` chỉ trỏ tới string literal nằm trong phân đoạn bất biến của chương trình — mọi thao tác ghi vào đó khiến hệ điều hành sinh SEGFAULT. Đổi lại, `ptr` có thể trỏ đi nơi khác còn `ary` thì không (`ary = \"World\"` không biên dịch được). (§3.6.3)",
    code: {
      lang: "c",
      text: `char ary[] = "Hello";
char *ptr = "Hello";

strcpy(ary, "World"); // OK — mảng ghi được
strcpy(ptr, "World"); // SEGFAULT — literal là hằng
ptr = ary;            // OK
strcpy(ptr, "World"); // Giờ mới OK`,
    },
  },
  {
    id: "spf004",
    field: "sysprog",
    topic: "sp-c",
    front: "Với `long *long_` (`sizeof(long) == 8`), phép `long_ + 7` dịch con trỏ đi bao nhiêu byte?",
    back: "**56 byte**. Số học con trỏ trong C luôn được nhân tự động với kích thước kiểu được trỏ tới, nên `+7` nghĩa là `7 * sizeof(long) = 7 * 8`. Cũng vì vậy `long_ - sizeof(long) + sizeof(int_)` (với `sizeof(int*) == 8`) dịch đi **0 byte**: `-8 + 8` phần tử. Vì phép nhân này luôn xảy ra, POSIX cấm số học trên con trỏ `void`. (§3.12, §3.7.2)",
    code: {
      lang: "c",
      text: `int *int_;      // sizeof(int)  == 4
long *long_;    // sizeof(long) == 8
int **int_ptr;  // sizeof(int*) == 8

long_ + 7;                          // +56 byte
long_ - sizeof(long) + sizeof(int_); // 0 byte`,
    },
  },
  {
    id: "spf005",
    field: "sysprog",
    topic: "sp-c",
    front: "Dòng `int* ptr3, ptr4;` khai báo mấy con trỏ?",
    back: "Chỉ **một**. `int*` không phải là một kiểu riêng trong cú pháp C — dấu `*` gắn với từng biến, nên `ptr3` là con trỏ còn `ptr4` là một biến `int` thông thường. Cách viết an toàn là đặt `*` ngay trước mỗi tên biến: `int *ptr3, *ptr4;`. (§3.7.1)",
    code: {
      lang: "c",
      text: `int* ptr3, ptr4;   // ptr4 là int, KHÔNG phải con trỏ
int *ptr3, *ptr4;  // đúng ý định`,
    },
  },
  {
    id: "spf006",
    field: "sysprog",
    topic: "sp-c",
    front: "Sau `free(p)`, thói quen nào giúp tránh double free và dangling pointer?",
    back: "Gán `p = NULL;` ngay sau khi giải phóng. Double free là khi chương trình vô tình `free` cùng một vùng cấp phát hai lần; dangling pointer là khi ghi vào vùng nhớ mình không còn sở hữu. Đặt con trỏ về `NULL` đảm bảo nó không thể bị dùng sai mà chương trình vẫn im lặng chạy tiếp. Cách sửa gốc rễ, trước hết, vẫn là viết chương trình đúng. (§3.8.2)",
    code: {
      lang: "c",
      text: `int *p = malloc(sizeof(int));
free(p);

*p = 123;  // dangling pointer!
free(p);   // double free!

p = NULL;  // thói quen tốt sau mỗi free`,
    },
  },
  {
    id: "spf007",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao `return &result;` sai còn `return &imok;` lại được?",
    back: "`result` là **biến tự động (automatic)**: nó chỉ gắn với bộ nhớ stack trong thời gian sống của hàm. Sau khi hàm trả về, tiếp tục dùng vùng nhớ đó là một lỗi. `imok` khai báo `static` nên không nằm trên stack — nó sống trong data segment suốt vòng đời chương trình, do đó trả về địa chỉ của nó là hợp lệ. (§3.8.3)",
    code: {
      lang: "c",
      text: `int *f() {
  int result = 42;
  static int imok;
  return &imok;   // OK
  return &result; // KHÔNG OK
}`,
    },
  },
  {
    id: "spf008",
    field: "sysprog",
    topic: "sp-c",
    front: "`malloc(sizeof(user))` với `user_t *user` cấp phát bao nhiêu byte, và vì sao đó là lỗi?",
    back: "Nó cấp phát đúng bằng kích thước một **con trỏ** (thường 8 byte), chứ không phải kích thước struct. Struct `User` chứa `char name[100]` nên cần 100 byte; ngay khi bắt đầu dùng `user`, chương trình làm hỏng bộ nhớ. Sửa: `malloc(sizeof(user_t))` — lấy `sizeof` của **kiểu**, không phải của biến con trỏ. (§3.8.4)",
    code: {
      lang: "c",
      text: `struct User { char name[100]; };
typedef struct User user_t;

user_t *user = malloc(sizeof(user));   // SAI: sizeof con trỏ
user_t *user = malloc(sizeof(user_t)); // ĐÚNG`,
    },
  },
  {
    id: "spf009",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao chương trình giả định `malloc` trả về vùng nhớ toàn 0 lại \"chạy được\" lúc đầu rồi hỏng về sau?",
    back: "Bộ nhớ mới nhận từ hệ điều hành **phải được xoá về không** — nếu không, một process có thể đọc được nội dung bộ nhớ của process khác từng dùng vùng đó, tức là một lỗ hổng bảo mật. Nên các lời gọi `malloc` đầu tiên, trước khi có vùng nào được `free`, thường trả về toàn 0. Sau khi bộ nhớ đã được tái sử dụng, `malloc` trả về dữ liệu cũ và chương trình bắt đầu sai. (§5.2.1, §3.8.8)",
    code: {
      lang: "c",
      text: `char *ptr = malloc(300);
// nội dung có lẽ là 0 vì đây là bộ nhớ mới toanh
free(ptr);
// về sau
char *ptr2 = malloc(300); // giờ có thể chứa dữ liệu cũ`,
    },
  },
  {
    id: "spf010",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao `array = realloc(array, n);` là code mong manh?",
    back: "`realloc` có hai cạm bẫy: nó **có thể trả về con trỏ mới**, và nó **có thể thất bại**. Nếu thất bại nó trả về `NULL`, và gán thẳng vào `array` sẽ làm mất con trỏ cũ → rò rỉ bộ nhớ (memory leak). Code vững chắc nhận kết quả vào biến tạm, chỉ gán lại con trỏ gốc khi giá trị đó khác `NULL`. (§5.2)",
    code: {
      lang: "c",
      text: `void *tmp = realloc(array, 3 * sizeof(int));
if (tmp == NULL) {
  // giữ nguyên array cũ, xử lý lỗi
} else {
  array = tmp;
  array[2] = 30;
}`,
    },
  },
  {
    id: "spf011",
    field: "sysprog",
    topic: "sp-c",
    front: "`if (answer = 42) { ... }` làm gì, và mẹo nào giúp tránh lỗi này?",
    back: "Toán tử gán trong C **trả về giá trị được gán**, nên `answer = 42` gán 42 rồi cho kết quả 42 (khác 0) — điều kiện luôn đúng và `answer` bị ghi đè. Mẹo là tập thói quen đặt hằng số lên trước (`if (42 == answer)`), khi đó viết nhầm một dấu `=` sẽ không biên dịch được. Khi thực sự muốn gán trong điều kiện (ví dụ với `getline`), hãy bọc phép gán trong dấu ngoặc đơn. (§3.9.1)",
    code: {
      lang: "c",
      text: `if (answer = 42) { ... }   // gán, không so sánh
if (42 == answer) { ... }  // hằng số đứng trước

while ((nread = getline(&line, &len, stream)) != -1)`,
    },
  },
  {
    id: "spf012",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao `gets` bị xoá khỏi chuẩn C11, và `fgets` khác `getline` ở điểm nào?",
    back: "`gets` không có cách nào kiểm soát độ dài được đọc nên bộ đệm rất dễ bị tràn — khi việc này được làm với ý đồ xấu để chiếm luồng chương trình thì gọi là **buffer overflow**. `fgets(buf, num, stream)` giới hạn số ký tự và **sao chép cả ký tự xuống dòng** vào bộ đệm. `getline` tự cấp phát và cấp phát lại bộ đệm trên heap đủ lớn — nhớ `free(buffer)` sau khi dùng. (§3.5.3)",
    code: {
      lang: "c",
      text: `char buffer[10];
fgets(buffer, sizeof(buffer), stdin); // đọc tối đa 9 ký tự

char *line = NULL; size_t size = 0;
ssize_t chars = getline(&line, &size, stdin);
free(line);`,
    },
  },
  {
    id: "spf013",
    field: "sysprog",
    topic: "sp-c",
    front: "Khi nào phải dùng `memmove` thay cho `memcpy`?",
    back: "Khi vùng nguồn và vùng đích **chồng lấn** nhau: `memcpy` có hành vi không xác định trong trường hợp đó, còn `memmove` bảo đảm mọi byte được sao chép đúng. Sách gọi đây là ví dụ kinh điển kiểu \"Trên máy tôi chạy được mà!\" vì nhiều khi Valgrind cũng không phát hiện ra. Cả hai hàm đều khai báo trong `string.h`. (§3.5.4)",
    code: {
      lang: "c",
      text: `void *memcpy(void *dest, const void *src, size_t n);
void *memmove(void *dest, const void *src, size_t n);`,
    },
  },
  {
    id: "spf014",
    field: "sysprog",
    topic: "sp-c",
    front: "Vì sao kiểm tra lỗi của `strtol` cần một \"bước đệm\" với `errno`?",
    back: "`strtol` **không trả về mã lỗi**: khi được truyền một chuỗi số không hợp lệ, nó trả về 0 — trùng với giá trị 0 hợp lệ. Bên gọi phải lưu `errno` cũ, đặt `errno = 0`, gọi `strtol`, rồi kết luận có lỗi khi kết quả là 0 **và** `errno` đã khác 0. Hàm nhận thêm `endptr` để biết dừng phân tích ở đâu và `base` (cơ số). (§3.5.4)",
    code: {
      lang: "c",
      text: `int saved_errno = errno;
errno = 0;
long int parsed = strtol(input, &endptr, 10);
if (parsed == 0 && errno != 0) {
  // chắc chắn là lỗi
}
errno = saved_errno;`,
    },
  },
  {
    id: "spf015",
    field: "sysprog",
    topic: "sp-c",
    front: "Trong báo cáo Valgrind, \"Invalid write of size 4\" và \"definitely lost\" khác nhau thế nào?",
    back: "**Invalid write** là ghi vượt quá khối heap đã cấp phát — với `int *x = malloc(10 * sizeof(int)); x[10] = 0;` Valgrind báo địa chỉ nằm \"0 bytes after a block of size 40\". **Definitely lost** là rò rỉ bộ nhớ: ví dụ đó kết thúc với `40 bytes in 1 blocks`, `1 allocs, 0 frees`. Chương trình này biên dịch và chạy không crash — Valgrind bắt đúng những vi phạm chưa gây crash ngay. Chạy: `valgrind --leak-check=full --show-leak-kinds=all ./prog`. (§2.3)",
    code: {
      lang: "c",
      text: `void dummy_function() {
  int *x = malloc(10 * sizeof(int));
  x[10] = 0; // lỗi 1: ghi ngoài biên
}            // lỗi 2: rò rỉ, x chưa được free`,
    },
  },
  {
    id: "spf016",
    field: "sysprog",
    topic: "sp-c",
    front: "First-fit, best-fit, worst-fit chọn khối rỗng nào, và phân mảnh trong khác phân mảnh ngoài ra sao?",
    back: "**Best-fit** tìm khối nhỏ nhất đủ lớn, **worst-fit** tìm khối lớn nhất, **first-fit** lấy khối đầu tiên đủ lớn (không cần duyệt hết heap). **Phân mảnh trong** là phần dư bị lãng phí bên trong khối đã cấp (trả nguyên khối 16KiB cho yêu cầu 2KiB). **Phân mảnh ngoài** là tổng bộ nhớ trống vẫn đủ nhưng không khối liên tục nào đủ lớn — ví dụ heap 64KiB còn trống 47KiB nhưng khối lớn nhất chỉ 30KiB. (§5.3.1)",
    code: null,
  },
  {
    id: "spf017",
    field: "sysprog",
    topic: "sp-c",
    front: "Con trỏ `malloc` trả về phải được căn chỉnh (align) theo bội số nào, và vì sao?",
    back: "Theo tài liệu glibc, địa chỉ trả về luôn là **bội số của 8** trên hầu hết hệ thống GNU và **bội số của 16** trên hệ thống 64-bit. Lý do: `malloc` không biết người dùng sẽ dùng vùng nhớ ra sao nên phải căn cho trường hợp xấu nhất. Đặt kiểu nhiều byte ở biên không hợp lý làm hiệu năng giảm vì có thể cần thêm một lần đọc bộ nhớ, và trên một số kiến trúc chương trình sập với lỗi bus error. (§5.4.2)",
    code: {
      lang: "c",
      text: `// làm tròn LÊN theo đơn vị 16 byte
int s = (requested_bytes + tag_overhead_bytes + 15) / 16;`,
    },
  },
  {
    id: "spf018",
    field: "sysprog",
    topic: "sp-c",
    front: "Boundary tag là gì và vì sao bộ cấp phát cần nó khi cài đặt `free`?",
    back: "Boundary tag là bản sao kích thước khối được lưu **thêm ở cuối khối** — đây là giải pháp của Knuth cho bài toán gộp khối (coalesce) theo cả hai chiều. Nhờ nó, khối hiện tại có thể nhìn lùi vài byte để tra kích thước khối liền trước và nhảy ngược lại. Không có boundary tag thì `free` chỉ gộp được với khối kế tiếp. Với sơ đồ này, cấp phát là O(n) trong trường hợp xấu nhất còn giải phóng là thời gian hằng số. (§5.4.3, §5.4.4)",
    code: null,
  },

  // ===== sp-process — Tiến trình & Tín hiệu (spf019–spf030) =====
  {
    id: "spf019",
    field: "sysprog",
    topic: "sp-process",
    front: "`fork()` trả về những giá trị nào, và mỗi giá trị nghĩa là gì?",
    back: "**-1**: tạo process con thất bại — kiểm tra `errno` (thường gặp `EAGAIN`, `ENOENT`). **0**: đang chạy trong ngữ cảnh process **con**. **Số dương**: đang ở process **cha**, và giá trị đó chính là PID của con. Bất đối xứng này hợp lý vì con luôn tìm được cha bằng `getppid()`, còn cha có thể có nhiều con nên cần được báo PID tường minh. (§4.4.2)",
    code: {
      lang: "c",
      text: `pid_t id = fork();
if (id == -1) exit(1);   // fork thất bại
if (id > 0) {
  // process cha, con có pid = id
} else {
  // process con
}`,
    },
  },
  {
    id: "spf020",
    field: "sysprog",
    topic: "sp-process",
    front: "Vì sao chương trình này in \"Answer: 42\" **hai lần** dù `printf` nằm trước `fork()`?",
    back: "`printf` đệm dữ liệu và chỉ đẩy ra khi gặp ký tự xuống dòng, khi bộ đệm đầy, hoặc khi gọi `fflush`. Ở đây không có `\\n` nên văn bản vẫn nằm trong bộ nhớ process. `fork()` sao chép **toàn bộ bộ nhớ**, kể cả bộ đệm đó, nên process con khởi đầu với bộ đệm đầu ra không rỗng và cũng flush nó khi thoát. (§4.4.2)",
    code: {
      lang: "c",
      text: `int main() {
  int answer = 84 >> 1;
  printf("Answer: %d", answer); // không có \\n
  fork();
  return 0;
}`,
    },
  },
  {
    id: "spf021",
    field: "sysprog",
    topic: "sp-process",
    front: "Sau `fork`, process con thừa kế những gì — và thứ gì **không** được thừa kế?",
    back: "Con thừa kế mọi **file descriptor đang mở** (kể cả offset đọc — con đọc sẽ dịch offset của cha), signal handler, thư mục làm việc hiện tại và biến môi trường; các trang chỉ đọc được chia sẻ nhờ copy-on-write. **Không** thừa kế: các **pending signal** và timer alarm. Khác biệt còn lại: PID mới, và cha nhận `SIGCHLD` khi con kết thúc chứ không có chiều ngược lại. (§4.4.5)",
    code: null,
  },
  {
    id: "spf022",
    field: "sysprog",
    topic: "sp-process",
    front: "Sau khi `exec` thành công, thứ gì được giữ lại và thứ gì bị đặt lại?",
    back: "**Giữ lại**: file descriptor (trừ khi đặt cờ `O_CLOEXEC`), signal mask và tập pending signal, biến môi trường, PID, process cha, process group, người dùng/nhóm và thư mục làm việc. **Đặt lại**: các signal handler quay về hành động mặc định, vì mã của handler cũ đã biến mất cùng chương trình cũ. Mọi dòng code sau lời gọi exec đều bị thay thế — nếu chạy tới đó nghĩa là exec đã thất bại. (§4.6.1, §13.5)",
    code: null,
  },
  {
    id: "spf023",
    field: "sysprog",
    topic: "sp-process",
    front: "Zombie và orphan khác nhau thế nào, và làm sao dọn zombie?",
    back: "**Zombie** là process con đã kết thúc nhưng vẫn chiếm một chỗ trong bảng process của kernel vì cha chưa `wait`. Cách duy nhất để loại bỏ là `wait`/`waitpid` — một process cha chạy lâu dài mà không wait có thể mất khả năng `fork`. **Orphan** là con còn sống khi cha đã chết; nó được gán cho `init` (PID 1), nên `getppid()` trả về 1, và `init` tự động wait mọi con của nó. (§4.5.2)",
    code: {
      lang: "c",
      text: `// dọn zombie vững chắc trong handler SIGCHLD
void cleanup(int signal) {
  while (waitpid((pid_t)(-1), 0, WNOHANG) > 0) { }
}`,
    },
  },
  {
    id: "spf024",
    field: "sysprog",
    topic: "sp-process",
    front: "Lấy mã thoát của process con từ `waitpid` như thế nào?",
    back: "Dùng cặp macro `WIFEXITED(status)` để xác nhận con đã thoát bình thường, rồi `WEXITSTATUS(status)` để lấy giá trị. Một process chỉ có **256 giá trị trả về**; các bit còn lại chứa thông tin bổ sung (bị signal nào, có bị dừng không) và được trích ra bằng các macro khác như `WIFSTOPPED`/`WSTOPSIG`. Macro không tự kiểm tra tiền điều kiện giúp bạn — dùng sai thì giá trị không xác định. (§4.5.1)",
    code: {
      lang: "c",
      text: `int status;
pid_t pid = waitpid(child, &status, 0);
if (pid != -1 && WIFEXITED(status)) {
  int exit_status = WEXITSTATUS(status);
  printf("Process %d returned %d", pid, exit_status);
}`,
    },
  },
  {
    id: "spf025",
    field: "sysprog",
    topic: "sp-process",
    front: "Mẫu fork-exec-wait gồm những bước nào, và vì sao không exec thẳng?",
    back: "Process gốc `fork` ra một con; con gọi `exec` để chạy chương trình mới; cha gọi `wait`/`waitpid` để chờ con kết thúc. Không exec thẳng vì như vậy sẽ mất luôn chương trình hiện tại — với mẫu này ta còn một **chương trình giám sát** (process cha) có thể làm việc khác, sửa trạng thái hệ thống hoặc đọc đầu ra của con. Luôn đặt `exit` ngay sau exec để phòng exec thất bại. (§4.7)",
    code: {
      lang: "c",
      text: `pid_t pid = fork();
if (pid < 0) {
  exit(1);
} else if (pid > 0) {
  int status;
  waitpid(pid, &status, 0);
} else {
  execl("/bin/ls", "/bin/ls", NULL);
  exit(1); // exec thất bại
}`,
    },
  },
  {
    id: "spf026",
    field: "sysprog",
    topic: "sp-process",
    front: "Vòng lặp tạo 10 process con dưới đây tạo ra bao nhiêu process, và vì sao?",
    back: "**1024** process — một fork bomb. Tên chương trình bị gõ sai (`ehco`), nên `execlp` thất bại và process con **rơi xuống chạy tiếp vòng lặp**, mỗi vòng lại fork thêm. Cách sửa là đặt `exit` ngay sau exec để con chết khi exec hỏng. Nhớ `ulimit -u 40` khi thử nghiệm code fork, và `kill -9 -1` để cứu vãn tình thế. (§4.4.3)",
    code: {
      lang: "c",
      text: `for (i = 0; i < 10; i++) {
  pid_t child = fork();
  if (child == -1) break;
  if (child == 0) {
    execlp("ehco", "echo", "hello", NULL);
    exit(1);            // THIẾU dòng này -> fork bomb
  } else children[i] = child;
}`,
    },
  },
  {
    id: "spf027",
    field: "sysprog",
    topic: "sp-process",
    front: "Không gian địa chỉ của một process gồm những đoạn nào, và đoạn nào thực thi được?",
    back: "**Stack** (biến tự động, địa chỉ trả về — lớn xuống, ghi được nhưng không thực thi được nhờ bit NX / W^X), **heap** (lớn lên, `malloc` đẩy program break), **data segment** gồm phần đã khởi tạo (`int global = 1;`) và **BSS** cho biến toàn cục ngầm bằng 0, và **text segment** chứa lệnh máy — đọc được nhưng không ghi được. Theo mặc định text segment là đoạn **duy nhất** thực thi được; địa chỉ bắt đầu bị ngẫu nhiên hoá bởi ASLR. (§4.3.1)",
    code: null,
  },
  {
    id: "spf028",
    field: "sysprog",
    topic: "sp-process",
    front: "Signal disposition, signal mask và pending signal set khác nhau ở chỗ nào?",
    back: "**Disposition** là bảng cặp signal–hành động của process, quyết định signal được xử lý ra sao sau khi chuyển giao: `TERM`, `IGN`, `CORE`, `STOP`, `CONT` hoặc chạy hàm tuỳ chỉnh. **Mask** quyết định signal có được chuyển giao hay không; nếu mọi thread đều chặn thì signal ở trạng thái **blocked**. **Pending** là khoảng từ lúc signal được sinh ra tới lúc kernel áp dụng quy tắc mask. Signal được coi là **caught** nếu process còn nguyên vẹn sau khi chuyển giao. (§13.1)",
    code: null,
  },
  {
    id: "spf029",
    field: "sysprog",
    topic: "sp-process",
    front: "Signal nào không thể bị signal handler bắt, và vì sao sách khuyên tránh `kill -9`?",
    back: "**`SIGKILL`** (số 9) và **`SIGSTOP`** không thể bị bắt. Sách trích bài *Useless Use of Kill -9*: `kill -9` không cho process cơ hội dọn dẹp — đóng socket, xoá file tạm, báo cho các process con, khôi phục thiết lập terminal. Trình tự khuyến nghị là gửi 15 (`SIGTERM`), chờ một hai giây, rồi 2 (`SIGINT`), rồi 1. `SIGINT` là 2, `SIGQUIT` là 3, `SIGTERM` là 15. (§13.1)",
    code: null,
  },
  {
    id: "spf030",
    field: "sysprog",
    topic: "sp-process",
    front: "Vì sao cờ dừng chương trình trong signal handler phải khai là `volatile sig_atomic_t`?",
    back: "`volatile` ngăn compiler tối ưu hoá biểu thức điều kiện — thân vòng lặp không đổi giá trị cờ nên compiler có thể coi nó là hằng — và bảo đảm giá trị luôn được đọc/ghi từ bộ nhớ chính thay vì bị cache trong thanh ghi CPU. `sig_atomic_t` bảo đảm toàn bộ bit của biến được đọc hoặc sửa như **một thao tác nguyên tử**, không thể đọc trúng nửa cũ nửa mới. Trong handler tuyệt đối không gọi `printf` hay `malloc` — chúng không re-entrant. (§13.3)",
    code: {
      lang: "c",
      text: `volatile sig_atomic_t pleaseStop;

void handle_sigint(int signal) { pleaseStop = 1; }

int main() {
  signal(SIGINT, handle_sigint);
  pleaseStop = 0;
  while (!pleaseStop) { /* logic ứng dụng */ }
  /* dọn dẹp ở đây */
}`,
    },
  },

  // ===== sp-concurrency — Luồng & Đồng bộ hoá (spf031–spf050) =====
  {
    id: "spf031",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Vì sao `pthread_cond_wait` luôn phải nằm trong vòng `while`, không bao giờ trong `if`?",
    back: "Vì **spurious wakeup**: thỉnh thoảng thread đang chờ tỉnh dậy mà không có lý do rõ ràng. Sách giải thích nguyên nhân là hiệu năng — trên hệ nhiều CPU có thể xảy ra race khiến một yêu cầu đánh thức bị bỏ lỡ; kernel không phát hiện được lời gọi bị mất nhưng phát hiện được khi nó *có khả năng* xảy ra, nên đánh thức thread để code tự kiểm tra lại điều kiện. `while` kiểm tra lại sau mỗi lần thức dậy; `if` thì tin luôn và chạy tiếp với trạng thái sai. (§7.2, §17.11)",
    code: {
      lang: "c",
      text: `pthread_mutex_lock(&m);
while (count == 0)              // while, KHÔNG phải if
  pthread_cond_wait(&cv, &m);
count--;
pthread_mutex_unlock(&m);`,
    },
  },
  {
    id: "spf032",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Các thread trong một process dùng chung những gì, và mỗi thread có riêng những gì?",
    back: "Dùng chung **một address space duy nhất**: heap, biến toàn cục và mã chương trình đều nhìn thấy được từ mọi thread. Mỗi thread có **stack riêng** — thư viện pthread cấp phát một vùng stack rồi dùng lời gọi `clone` để khởi động thread tại đó — và một bản sao `errno` riêng nằm ở đỉnh stack của nó. Gọi `pthread_create` hai lần thì process có ba stack: một của thread ban đầu, hai của hai thread mới. (§6.2, §6.4)",
    code: null,
  },
  {
    id: "spf033",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Bốn đối số của `pthread_create` là gì, và `void *(*start_routine)(void *)` nghĩa là gì?",
    back: "Lần lượt: con trỏ tới biến nhận id thread mới, con trỏ tới `pthread_attr_t` (thuộc tính, thường `NULL`), con trỏ tới hàm cần chạy, và con trỏ được truyền cho hàm đó. `void *(*start_routine)(void *)` đọc là **con trỏ tới hàm nhận `void *` và trả về `void *`** — giống khai báo hàm nhưng tên hàm được bọc trong `(* ...)`. Biên dịch phải thêm cờ `-pthread` hoặc `-lpthread`. (§6.3)",
    code: {
      lang: "c",
      text: `int pthread_create(pthread_t *thread,
                   const pthread_attr_t *attr,
                   void *(*start_routine)(void *),
                   void *arg);

pthread_t id;
pthread_create(&id, NULL, busy, "Hi");
void *result;
pthread_join(id, &result);`,
    },
  },
  {
    id: "spf034",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Vòng lặp này lẽ ra in 0..9 nhưng lại in `1 7 8 8 8 8 8 8 8 10` — vì sao?",
    back: "Mọi thread nhận **cùng một con trỏ `&i`**, mà `i` thì đang thay đổi. Thread mới khởi động muộn hơn nên đọc `i` sau khi vòng lặp đã chạy tiếp — thread cuối thậm chí đọc sau khi vòng lặp kết thúc (giá trị 10). Cách sửa là cho mỗi thread một vùng dữ liệu riêng; ở đây đơn giản nhất là truyền chính giá trị bằng cách ép kiểu `(void *)i`. (§6.5)",
    code: {
      lang: "c",
      text: `for (i = 0; i < 10; i++)
  pthread_create(&tid, NULL, myfunc, &i);   // LỖI

for (i = 0; i < 10; i++)
  pthread_create(&tid, NULL, myfunc, (void *)i); // truyền theo giá trị`,
    },
  },
  {
    id: "spf035",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "`pthread_exit(NULL)` trong thread `main` khác `exit(42)` như thế nào?",
    back: "`pthread_exit` chỉ dừng thread đang gọi; thư viện pthread tự kết thúc process khi **không còn thread nào khác** đang chạy. Đây là cách phổ biến để chương trình đơn giản đảm bảo mọi thread đều hoàn thành. Ngược lại, `exit()` — tương đương `return` từ `main` — thoát **toàn bộ process** và dừng mọi thread bên trong, nên các thread vừa tạo có lẽ chưa kịp khởi động. (§6.4)",
    code: {
      lang: "c",
      text: `pthread_create(&tid1, NULL, myfunc, "Jabberwocky");
pthread_create(&tid2, NULL, myfunc, "Vorpel");

pthread_exit(NULL); // chờ mọi thread xong
// exit(42);        // giết luôn mọi thread`,
    },
  },
  {
    id: "spf036",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Không gọi `pthread_join` thì chuyện gì xảy ra với thread đã kết thúc?",
    back: "Thread đã kết thúc **vẫn tiếp tục tiêu tốn tài nguyên** — sách ví nó như biến process con của bạn thành zombie. Nếu tạo đủ nhiều thread, `pthread_create` cuối cùng sẽ thất bại. Trong thực tế đây chỉ là vấn đề với process chạy lâu dài, vì mọi tài nguyên thread đều được giải phóng khi process thoát. `pthread_join` vừa chờ thread kết thúc vừa ghi nhận giá trị trả về của nó. (§6.4)",
    code: null,
  },
  {
    id: "spf037",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Hai thread cùng chạy `sum += 1` mười triệu lần — vì sao kết quả nhỏ hơn 20000000?",
    back: "`sum += 1` không phải một thao tác nguyên tử: nó dịch thành **load – add – store**. Nếu hai thread cùng load giá trị 123, cả hai cộng 1 vào bản sao riêng rồi cùng ghi 124 trở lại, ta mất một lần đếm. Ngay cả khi biên dịch `-O2` gộp thành một lệnh `shl dword ptr [rdi]`, phần cứng vẫn có thể gặp race trừ khi thêm tiền tố `lock`. (§7 mở đầu, §6.5)",
    code: {
      lang: "c",
      text: `mov eax, DWORD PTR [rbp-4] ; load
add eax, eax               ; add
mov DWORD PTR [rbp-4], eax ; store`,
    },
  },
  {
    id: "spf038",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Đoạn code này dùng mutex nhưng vẫn có race condition — vì sao?",
    back: "Vì **mutex trong C không khoá biến, nó chỉ làm việc với code**. Hai thread dùng hai mutex khác nhau (`m1`, `m2`) nên chẳng thread nào phải chờ thread nào — cả hai cùng sửa `a`. Thread chỉ phải chờ khi nó cố lock **đúng mutex đang bị khoá**. Khoá chỉ là công cụ; chúng không tự phát hiện critical section giúp bạn. (§7.1.2)",
    code: {
      lang: "c",
      text: `int a;
pthread_mutex_t m1 = PTHREAD_MUTEX_INITIALIZER,
                m2 = PTHREAD_MUTEX_INITIALIZER;

// Thread 1
pthread_mutex_lock(&m1); a++; pthread_mutex_unlock(&m1);
// Thread 2
pthread_mutex_lock(&m2); a++; pthread_mutex_unlock(&m2);`,
    },
  },
  {
    id: "spf039",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Ba cách bọc mutex quanh vòng lặp `sum += 1` — cách nào nhanh nhất mà vẫn đúng?",
    back: "Cộng dồn vào **biến tự động cục bộ** rồi mới lock một lần để cộng vào tổng dùng chung. Lock ngoài vòng lặp cũng đúng nhưng biến chương trình thành tuần tự; lock/unlock bên trong vòng lặp cũng đúng nhưng phải trả chi phí một triệu lần — tốn kém so với việc chỉ tăng một biến. Luôn có chi phí nhỏ khi gọi `pthread_mutex_lock`/`unlock`, nhưng đó là cái giá của tính đúng đắn. (§7.1.2)",
    code: {
      lang: "c",
      text: `int local = 0;
for (i = 0; i < 10000000; i++) local += 1;

pthread_mutex_lock(&m);
sum += local;
pthread_mutex_unlock(&m);`,
    },
  },
  {
    id: "spf040",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Vì sao `to_message` dưới đây không thread-safe, và sửa bằng thiết kế thế nào?",
    back: "Bộ đệm kết quả là `static` — chỉ có **một bộ đệm duy nhất trong toàn bộ bộ nhớ**, nên hai thread dùng cùng lúc sẽ làm hỏng dữ liệu của nhau. Cách sửa bằng thiết kế (không cần khoá) là **chuyển trách nhiệm bộ nhớ cho bên gọi**: nhận thêm `char *buf` và `size_t nbytes`. Các hàm thư viện `asctime`, `getenv`, `strtok`, `strerror` cũng không thread-safe vì lý do tương tự. (§6.5)",
    code: {
      lang: "c",
      text: `char *to_message(int num) {
  static char result[256];       // dùng chung -> hỏng
  ...
  return result;
}

int to_message_r(int num, char *buf, size_t nbytes); // bên gọi cấp bộ nhớ`,
    },
  },
  {
    id: "spf041",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Binary semaphore khác mutex ở điểm nào khi bị lạm dụng?",
    back: "Với semaphore, **wait và post có thể đến từ các thread khác nhau** — một thread có thể \"mở khoá\" hộ thread khác. Nghĩa là một thread bất kỳ gọi thừa `sem_post(&s)` sẽ nâng biến đếm lên và cho hai thread cùng vào critical section. Mutex xử lý tốt tình huống này (lock inversion): chỉ thread đã lock mới được unlock. Khởi tạo semaphore bằng `sem_init` — không có macro tắt như `PTHREAD_MUTEX_INITIALIZER`. (§7.1.5)",
    code: {
      lang: "c",
      text: `sem_t s;
sem_init(&s, 0, 1);   // dùng như mutex

sem_wait(&s);
// Critical Section
sem_post(&s);

// Thread khác gọi thừa sem_post(&s) -> hỏng loại trừ lẫn nhau`,
    },
  },
  {
    id: "spf042",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Bên trong signal handler, vì sao dùng được `sem_post` mà không dùng được `pthread_mutex_unlock`?",
    back: "`sem_post` là một trong số ít hàm có thể dùng đúng đắn bên trong signal handler; `pthread_mutex_unlock` thì không. Mẹo thiết kế là để handler chỉ `sem_post` để **giải phóng một thread đang chờ**, và chính thread đó — chạy ngoài ngữ cảnh handler — mới thực hiện những lời gọi bị cấm trong handler như `printf`. (§7.1.5)",
    code: {
      lang: "c",
      text: `sem_t s;

void handler(int signal) { sem_post(&s); }

void *singsong(void *param) {
  sem_wait(&s);
  printf("Waiting until a signal releases...\\n"); // an toàn ở đây
}`,
    },
  },
  {
    id: "spf043",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Cài đặt `lock()` ngây thơ này sai ở hai chỗ — chỗ nào?",
    back: "Thứ nhất là **busy-waiting**, lãng phí CPU (gọi `pthread_yield()` chỉ giảm bớt chứ không chữa được). Thứ hai, nghiêm trọng hơn, chính nó **có race condition**: nếu hai thread cùng gọi `lock`, cả hai có thể đọc `m->locked` bằng 0, cùng tin rằng mình độc quyền và cùng đi tiếp. Việc kiểm tra rồi mới đặt không phải là một thao tác nguyên tử. (§7.1.3)",
    code: {
      lang: "c",
      text: `void lock(mutex_t *m) {
  while (m->locked) { /* quay vòng */ }
  m->locked = 1;   // race: hai thread cùng tới đây
}

void unlock(mutex_t *m) { m->locked = 0; }`,
    },
  },
  {
    id: "spf044",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Lời giải của Peterson (1981) hoạt động ra sao, và vì sao ngày nay không cài đặt được như vậy?",
    back: "Mỗi thread giương cờ ý định, rồi **nhường lượt cho thread kia** (`turn = other_thread_id`), rồi quay vòng chừng nào cờ của đối phương còn giương **và** turn vẫn thuộc về đối phương. Vì mỗi thread tự đặt turn cho bên kia nên chỉ một thread có thể kẹt trong vòng lặp. Đáng tiếc ngày nay không cài đặt mutex phần mềm theo cách này được, vì các lệnh được thực thi **không theo thứ tự (out-of-order)**. (§7.5.1)",
    code: {
      lang: "c",
      text: `raise my flag
turn = other_thread_id
while (your flag is up and turn is other_thread_id)
    loop
// Critical Section
lower my flag`,
    },
  },
  {
    id: "spf045",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Một lời giải cho bài toán critical section phải thoả ba tính chất nào?",
    back: "**Mutual Exclusion** — thread có quyền truy cập độc quyền, các thread khác phải chờ tới khi nó rời critical section. **Bounded Wait** — một thread không thể bị thread khác vượt mặt vô số lần. **Progress** — nếu không có thread nào trong critical section, thread phải vào được mà không phải chờ. Lời giải \"giương cờ rồi chờ\" thoả mutual exclusion nhưng deadlock; lời giải \"luân phiên theo lượt\" thoả mutual exclusion nhưng vi phạm progress. (§7.4)",
    code: null,
  },
  {
    id: "spf046",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Hàm `is_empty` này có lỗi gì, và triệu chứng xuất hiện ở đâu?",
    back: "Nó `return` **trước** lời gọi `pthread_mutex_unlock`, nên mutex không bao giờ được mở. Triệu chứng không xuất hiện ngay: mãi sau đó một thread khác gọi `push` sẽ dừng lại một cách bí ẩn, kẹt trong `lock()`. Một sơ suất ở thread này dẫn tới vấn đề rất muộn ở một thread bất kỳ khác. Sửa bằng cách lưu kết quả vào biến, unlock, rồi mới return. (§7.3)",
    code: {
      lang: "c",
      text: `int is_empty() {
  pthread_mutex_lock(&m);
  return count == 0;        // thoát khi mutex vẫn bị khoá!
  pthread_mutex_unlock(&m); // không bao giờ chạy
}

int is_empty_fixed() {
  pthread_mutex_lock(&m);
  int result = count == 0;
  pthread_mutex_unlock(&m);
  return result;
}`,
    },
  },
  {
    id: "spf047",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Cài đặt counting semaphore bằng mutex và condition variable cần những gì?",
    back: "Mỗi semaphore cần **một biến đếm, một mutex và một condition variable**. `sem_post` lock, tăng đếm, `pthread_cond_signal` rồi unlock. `sem_wait` lock rồi `while (count == 0) pthread_cond_wait(...)` — `cond_wait` mở khoá mutex trong lúc ngủ nên `sem_post` mới vào được, và khi được đánh thức nó phải giành lại khoá trước khi trả về. Bản tối ưu chỉ signal khi biến đếm vừa tăng từ 0 lên 1. (§7.6)",
    code: {
      lang: "c",
      text: `typedef struct sem_t {
  ssize_t count;
  pthread_mutex_t m;
  pthread_condition_t cv;
} sem_t;

void sem_wait(sem_t *s) {
  pthread_mutex_lock(&s->m);
  while (s->count == 0)
    pthread_cond_wait(&s->cv, &s->m);
  s->count--;
  pthread_mutex_unlock(&s->m);
}`,
    },
  },
  {
    id: "spf048",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Vì sao `b[(in++) % N] = value` trong ring buffer là lỗi tinh vi?",
    back: "Sau **hơn bốn tỷ** thao tác enqueue, biến `int in` sẽ tràn và quay về 0 — khi đó chương trình có thể ghi vào `b[0]` chứ không phải vị trí đúng. Dạng gọn đúng là dùng mặt nạ bit `b[(in++) & (N-1)]`, với điều kiện **N là luỹ thừa của hai** (16, 32, 64, ...). (§7.8.1)",
    code: {
      lang: "c",
      text: `// N là luỹ thừa của 2
void enqueue(void *value) {
  b[(in++) & (N - 1)] = value;
}`,
    },
  },
  {
    id: "spf049",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Ring buffer đa luồng đúng đặt `sem_wait`, mutex và `sem_post` theo thứ tự nào?",
    back: "`sem_wait` **ngoài** khoá, mutex chỉ bọc đúng critical section (truy cập cấu trúc dữ liệu), rồi `sem_post` sau khi đã unlock. Dùng hai semaphore đối xứng: `countsem` khởi tạo 0 đếm số phần tử, `spacesem` khởi tạo 16 đếm số ô trống. Nếu wait và post trên **cùng** một semaphore trong một hàm thì giá trị không đổi ở cuối hàm — enqueue sẽ không bao giờ chặn và bộ đệm tràn. (§7.8.5, §7.8.3)",
    code: {
      lang: "c",
      text: `void enqueue(void *value) {
  sem_wait(&spacesem);        // chờ có chỗ trống
  p_m_lock(&lock);
  b[(in++) & (N - 1)] = value;
  p_m_unlock(&lock);
  sem_post(&countsem);        // báo có thêm một phần tử
}`,
    },
  },
  {
    id: "spf050",
    field: "sysprog",
    topic: "sp-concurrency",
    front: "Lời giải reader-writer chống bỏ đói người ghi cần thêm biến đếm nào?",
    back: "Cần biến `writers` — số thread ghi **đã đến** và muốn vào critical section — tách khỏi `writing` (số thread đang thực sự ghi, chỉ 0 hoặc 1) và `reading` (số thread đang đọc). Người ghi tăng `writers` ngay khi đến, còn người đọc **đến sau** phải chờ trong `while (writers)`. Không có nó, dòng người đọc liên tục khiến `reading` không bao giờ về 0 và người ghi bị starvation. Dùng `cond_broadcast`, không phải `cond_signal`, để mọi thread cùng kiểm tra lại điều kiện. (§7.7.5, §7.7.6)",
    code: {
      lang: "c",
      text: `reader() {
  lock(&m);
  while (writers) cond_wait(&turn, &m);
  reading++;
  unlock(&m);
  /* đọc ở đây */
  lock(&m); reading--; cond_broadcast(&turn); unlock(&m);
}

writer() {
  lock(&m);
  writers++;
  while (reading || writing) cond_wait(&turn, &m);
  writing++;
  unlock(&m);
  /* ghi ở đây */
  lock(&m); writing--; writers--; cond_broadcast(&turn); unlock(&m);
}`,
    },
  },

  // ===== sp-deadlock — Deadlock & Lập lịch (spf051–spf060) =====
  {
    id: "spf051",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Bốn điều kiện Coffman là gì?",
    back: "**Mutual Exclusion** — không hai process nào lấy được cùng tài nguyên cùng lúc. **Circular Wait** — tồn tại chu trình trong đồ thị cấp phát tài nguyên. **Hold and Wait** — process giữ tài nguyên đã lấy ở trạng thái khoá. **No Pre-emption** — không gì buộc được process từ bỏ tài nguyên. Đây là điều kiện **cần và đủ**: phá vỡ bất kỳ điều kiện nào thì hệ thống không thể deadlock. (§8.2)",
    code: null,
  },
  {
    id: "spf052",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Trong đồ thị cấp phát tài nguyên (RAG), khi nào một chu trình chắc chắn nghĩa là deadlock?",
    back: "Khi **mỗi tài nguyên trong chu trình chỉ cung cấp duy nhất một thể hiện (instance)**. Mũi tên vẽ từ tài nguyên tới process nếu process đang dùng nó, và từ process tới tài nguyên nếu process đang yêu cầu. Ví dụ: P1 giữ A, P2 giữ B, P1 chờ B, P2 chờ A. Phát hiện bằng cách duyệt đồ thị tìm chu trình, chẳng hạn bằng DFS. (§8.1)",
    code: null,
  },
  {
    id: "spf053",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Vì sao lời giải \"mỗi triết gia lấy nĩa trái rồi nĩa phải\" lại deadlock?",
    back: "Nếu **mọi** triết gia cùng nhặt nĩa trái rồi cùng chờ nĩa phải, không ai đi tiếp được — đủ cả bốn điều kiện Coffman. Điểm quan trọng: deadlock **không phải lúc nào cũng xảy ra**, và xác suất giảm dần khi số triết gia tăng — nhưng rốt cuộc nó *sẽ* xảy ra, làm các thread bị đói. Các triết gia đều giống hệt nhau nên không thể bảo triết gia chẵn làm khác triết gia lẻ. (§8.4, §8.4.1)",
    code: {
      lang: "c",
      text: `while (phil_info->simulation) {
  pthread_mutex_lock(left_fork);
  pthread_mutex_lock(right_fork);   // tất cả kẹt ở đây
  eat(left_fork, right_fork);
  pthread_mutex_unlock(left_fork);
  pthread_mutex_unlock(right_fork);
}`,
    },
  },
  {
    id: "spf054",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Dùng `pthread_mutex_trylock` phá vỡ điều kiện Coffman nào, và đổi lại gặp vấn đề gì?",
    back: "Nó phá vỡ **hold and wait**: nếu không lấy được nĩa phải, triết gia đặt nĩa trái xuống rồi thử lại. Không còn deadlock — nhưng nếu tất cả cùng nhặt nĩa trái, cùng thử nĩa phải, cùng đặt xuống, cùng nhặt lại... thì rơi vào **livelock**. Livelock khó phát hiện hơn deadlock vì từ bên ngoài các process trông vẫn như đang làm việc. (§8.4.1, §8.2)",
    code: {
      lang: "c",
      text: `int left_succeed = pthread_mutex_trylock(left_fork);
if (!left_succeed) { sleep(); continue; }
int right_succeed = pthread_mutex_trylock(right_fork);
if (!right_succeed) {
  pthread_mutex_unlock(left_fork);  // nhả ra rồi thử lại
  sleep(); continue;
}`,
    },
  },
  {
    id: "spf055",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Lời giải của Stallings và của Dijkstra phá vỡ điều kiện Coffman nào?",
    back: "**Stallings** loại bớt triết gia khỏi bàn: với $n$ tài nguyên mà chỉ $n-1$ triết gia thì mỗi nĩa chỉ còn một người chờ, nên **circular wait** không thể xảy ra; cài đặt bằng semaphore chỉ cho một số nhất định đi qua. **Dijkstra** đánh số nĩa từ 1..n và bắt mỗi triết gia nhặt chiếc có **số nhỏ hơn trước** — triết gia cuối cùng do đó lấy ngược thứ tự, cũng phá vỡ circular wait. (§8.5.1, §8.5.2)",
    code: null,
  },
  {
    id: "spf056",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Giải thuật Chủ ngân hàng (Banker's Algorithm) bảo đảm điều gì, và không bảo đảm điều gì?",
    back: "Nó chỉ cấp tài nguyên khi trạng thái sau đó vẫn **an toàn** — tức là vẫn còn đủ để thoả mãn ít nhất một process nữa. Vì luôn có thể đi thêm một bước, hệ thống **không bao giờ deadlock**. Nhưng nó **không bảo đảm tránh livelock**: nếu process mà ta trông đợi lại chẳng bao giờ yêu cầu gì, không việc gì được làm. Nhược điểm khác: phải biết trước nhu cầu tài nguyên của mỗi process, và giải thuật chậm khi hệ thống có hàng triệu tài nguyên. (§17.4)",
    code: null,
  },
  {
    id: "spf057",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "\"Thuật toán Đà điểu\" (Ostrich Algorithm) là gì, và vì sao nó thường đủ dùng?",
    back: "Là cách tiếp cận **phớt lờ deadlock** — hệ điều hành phát hiện ra nhưng không làm gì đặc biệt, và deadlock thường tự biến mất. Nó hoạt động vì hệ điều hành vẫn preempt process khi chuyển ngữ cảnh, có thể ngắt bất kỳ system call nào, và đặt một số file ở chế độ chỉ đọc khiến tài nguyên đó chia sẻ được. Nói cách khác: nếu ai đó cố tình viết chương trình xấu thì hệ thống sẽ deadlock — nhưng trong đời sống thường ngày thế là ổn. (§8.3)",
    code: null,
  },
  {
    id: "spf058",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Turnaround time, response time và wait time được tính thế nào?",
    back: "**Turnaround** = `end_time - arrival_time` (từ lúc đến tới lúc kết thúc). **Response** = `start_time - arrival_time` (độ trễ tới khi CPU thực sự bắt đầu làm việc). **Wait** = `end_time - arrival_time - run_time` — tổng thời gian nằm trên ready queue, không chỉ lần chờ đầu tiên. Ví dụ: tác vụ cần 7 phút CPU nhưng mất 9 phút đồng hồ thực thì wait time là 2 phút. (§10.3)",
    code: null,
  },
  {
    id: "spf059",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Convoy Effect là gì, và scheduler nào bị ảnh hưởng?",
    back: "Một process **CPU-intensive** chiếm CPU khiến các process I/O-intensive — vốn chỉ cần rất ít thời gian CPU — phải nối đuôi chờ như đoàn xe. Với FCFS phải chờ tới khi process kia bị block vì một yêu cầu I/O, nên hiệu năng I/O của cả hệ thống suy giảm. Hiệu ứng này thường được bàn với **FCFS**, nhưng **Round Robin cũng có thể mắc phải khi time quantum quá dài**. (§10.3.1)",
    code: null,
  },
  {
    id: "spf060",
    field: "sysprog",
    topic: "sp-deadlock",
    front: "Nhược điểm chính của Shortest Job First là gì, và Round Robin trở thành FCFS khi nào?",
    back: "SJF đòi hỏi thuật toán phải **\"biết tuốt\" (omniscient)** — biết trước chương trình chạy bao lâu; cài đặt thực tế phải ước lượng burst time bằng trung bình trượt có trọng số suy giảm theo hàm mũ. Nó cũng gây starvation cho công việc dài nếu công việc ngắn liên tục đến. **Round Robin tiến tới FCFS khi time quantum tiến tới vô cùng**; bất kỳ scheduler nào không có preemption đều có thể dẫn tới starvation. (§10.4.1, §10.4.4, §10.2.1)",
    code: null,
  },

  // ===== sp-memory-ipc — Bộ nhớ ảo & IPC (spf061–spf072) =====
  {
    id: "spf061",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Page, frame và page table khác nhau thế nào? Máy 32-bit với page 4KiB có bao nhiêu page?",
    back: "**Page** là khối bộ nhớ ảo (điển hình trên Linux là 4KiB, tức $2^{12}$ địa chỉ); **frame** là khối bộ nhớ vật lý cùng kích thước; **page table** là ánh xạ từ số page sang số frame. Máy 32-bit: $2^{32} / 2^{12} = 2^{20}$ page. Các bit thấp của địa chỉ ảo được dùng lại trực tiếp làm **offset** bên trong frame — với page 4KiB là 12 bit cuối. (§9.1.1)",
    code: null,
  },
  {
    id: "spf062",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Page table nhiều cấp tiết kiệm được bao nhiêu so với một cấp trên ví dụ 32-bit của sách?",
    back: "Từ **4MiB xuống còn khoảng 10KiB**: 2KiB cho bảng cấp cao nhất ($2^{10}$ mục × 2 byte) cộng 4KiB cho mỗi bảng con — một bảng cho vùng địa chỉ thấp (mã, hằng số, heap nhỏ) và một cho vùng cao (môi trường, stack). Mỗi bảng con chỉ tham chiếu được 1024 × 4KiB = 4MiB không gian địa chỉ. Cách này cần thiết vì trên 64-bit, bảng một cấp sẽ cần khoảng $2^{55}$ byte (~40 petabyte). (§9.1.2)",
    code: null,
  },
  {
    id: "spf063",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "TLB giải quyết vấn đề gì của page table?",
    back: "Page table làm mọi truy cập bộ nhớ chậm đi: một cấp thì cần **hai** lần truy cập bộ nhớ, hai cấp thì cần **ba**. TLB (translation lookaside buffer) là cache kết hợp trong MMU lưu các kết quả dịch page ảo → frame được dùng gần đây, và được truy vấn **song song** với page table. Nếu chương trình có tính nhất quán cache kém, địa chỉ không có trong TLB và MMU phải quay lại cách dịch chậm hơn nhiều. (§9.1.3)",
    code: null,
  },
  {
    id: "spf064",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Ba bit thường thấy trên một page dùng để làm gì?",
    back: "**Read-only** — mọi nỗ lực ghi gây page fault; dùng để chia sẻ thư viện chuẩn C giữa các process và để cài đặt copy-on-write. **Execution** — quyết định các byte trong page có được thực thi như lệnh CPU hay không; bộ xử lý có thể gộp lại thành \"hoặc ghi được hoặc thực thi được\", ngăn tấn công code injection vào heap/stack. **Dirty** — page chưa bị ghi có thể bị loại bỏ mà không cần đồng bộ ra backing store. (§9.1.5)",
    code: null,
  },
  {
    id: "spf065",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Ba loại page fault là gì?",
    back: "**Minor** — chưa có ánh xạ nhưng địa chỉ hợp lệ (ví dụ bộ nhớ xin bằng `sbrk` nhưng chưa ghi); HĐH tạo page, nạp vào bộ nhớ và đi tiếp. **Major** — ánh xạ chỉ nằm trên đĩa; HĐH swap page vào và swap page khác ra; xảy ra quá thường xuyên thì gọi là thrash MMU. **Invalid** — ghi vào địa chỉ không ghi được hoặc đọc địa chỉ không đọc được; HĐH thường gửi `SIGSEGV`. (§9.1.6)",
    code: null,
  },
  {
    id: "spf066",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "`MAP_SHARED` khác `MAP_PRIVATE` thế nào, và vì sao offset của `mmap` phải căn theo page?",
    back: "`MAP_SHARED` đồng bộ ánh xạ với đối tượng file bên dưới (file descriptor phải mở với quyền ghi); `MAP_PRIVATE` chỉ hiển thị với chính process đó. `mmap` **không cho phép offset tuỳ ý** — nó phải là bội số của kích thước page, nên phải làm tròn xuống bằng `sysconf(_SC_PAGE_SIZE)`. Xong việc phải gọi `munmap` để HĐH ghi lại xuống đĩa và thu hồi địa chỉ. (§9.2.1, §9.2.2)",
    code: {
      lang: "c",
      text: `off_t page_offset = offset & ~(sysconf(_SC_PAGE_SIZE) - 1);
char *addr = mmap(NULL, length + offset - page_offset,
                  PROT_READ, MAP_PRIVATE, fd, page_offset);
// ...
munmap(addr, length + offset - page_offset);`,
    },
  },
  {
    id: "spf067",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Dùng `mmap` ẩn danh để cha–con chia sẻ bộ nhớ như thế nào, và điểm yếu của ví dụ trong sách?",
    back: "Gọi `mmap` với `MAP_SHARED | MAP_ANONYMOUS` **trước** khi `fork`; vùng nhớ đó được cả hai process nhìn thấy. Đây là IPC hiệu quả vì không có chi phí sao chép, system call hay truy cập đĩa — hai process dùng chung cùng một frame vật lý. Điểm yếu: ví dụ trong sách dùng `sleep(1)` chứ không dùng mutex, nên **không có gì bảo đảm** giá trị được truyền đi; shared memory tạo chỗ cho data race y như đa luồng. (§9.2.3)",
    code: {
      lang: "c",
      text: `int size = 100 * sizeof(int);
void *addr = mmap(0, size, PROT_READ | PROT_WRITE,
                  MAP_SHARED | MAP_ANONYMOUS, -1, 0);
int *shared = addr;
pid_t mychild = fork();
if (mychild > 0) { shared[0] = 10; shared[1] = 20; }
else { sleep(1); printf("%d\\n", shared[1] + shared[0]); }
munmap(addr, size);`,
    },
  },
  {
    id: "spf068",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Sau `pipe(filedes)`, `filedes[0]` và `filedes[1]` là đầu nào?",
    back: "`filedes[0]` là **đầu đọc**, `filedes[1]` là **đầu ghi** — mẹo nhớ của sách: người ta biết đọc trước khi biết viết. Pipe luôn chảy một chiều. Cách dùng phổ biến là tạo pipe **trước** khi `fork` để giao tiếp với process con, và khi fork xong thì đóng đầu không dùng ở mỗi bên: cha đóng đầu ghi, con đóng đầu đọc (hoặc ngược lại). (§9.3)",
    code: {
      lang: "c",
      text: `int filedes[2];
pipe(filedes);
pid_t child = fork();
if (child > 0) {
  char buffer[80];
  int bytesread = read(filedes[0], buffer, sizeof(buffer));
} else {
  write(filedes[1], "done", 4);
}`,
    },
  },
  {
    id: "spf069",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Đọc từ pipe khi không còn dữ liệu và ghi vào pipe khi không còn bên đọc — mỗi trường hợp xảy ra gì?",
    back: "**Đọc**: process bị block chờ thêm dữ liệu, trừ khi **tất cả** các bên ghi đã đóng đầu ghi của mình — khi đó `read` trả về 0. Đây là lý do vòng lặp `while ((bytesread = read(fd[0], &buf, 1)) > 0)` không bao giờ kết thúc nếu quên đóng. **Ghi**: nếu mọi file descriptor trỏ tới đầu đọc đã bị đóng thì `write` khiến tín hiệu **`SIGPIPE`** được sinh ra cho process gọi; mặc định `SIGPIPE` kết thúc chương trình. (§9.3.1)",
    code: null,
  },
  {
    id: "spf070",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Sức chứa của pipe là bao nhiêu, và khi nào thao tác ghi vào pipe không còn nguyên tử?",
    back: "Sức chứa đệm tuỳ hệ thống, **giá trị điển hình từ 4KiB tới 128KiB**. Ghi vào pipe là **atomic tới kích thước của pipe** — kernel có mutex nội bộ gắn với pipe. Ngoại lệ duy nhất là khi pipe sắp đầy: nếu hai process cùng ghi mà pipe chỉ đáp ứng được một lần ghi một phần thì lần ghi đó không còn nguyên tử. Cách tránh: tăng kích thước pipe, hoặc phổ biến hơn là thiết kế để pipe liên tục được đọc. (§9.3.2)",
    code: null,
  },
  {
    id: "spf071",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Vì sao `open` trên một named pipe (`mkfifo`) lại treo, và mở với `O_RDWR` gây lỗi gì?",
    back: "Bất kỳ lời gọi `open` nào trên named pipe đều bị kernel block **cho tới khi một process khác `open` theo chiều ngược lại** — `echo Hello > fifo` treo cho tới khi `cat fifo` chạy. Mở với `O_RDWR` phá vỡ cơ chế này: chương trình đã tự khai mình là bên đọc nên `open` không chờ ai, ghi xong rồi thoát; process kia mở sau bằng `O_RDONLY` sẽ block vô hạn. Đó là một race condition. (§9.4.1, §9.4.2)",
    code: null,
  },
  {
    id: "spf072",
    field: "sysprog",
    topic: "sp-memory-ipc",
    front: "Mảng độ dài không ở cuối struct (`char c_str[0]`) dùng để làm gì?",
    back: "Struct là **vùng nhớ liên tục**, và mảng độ dài không không chiếm byte nào — nó chỉ trỏ tới cuối struct. Nhờ vậy ta có thể `malloc(sizeof(string) + length + 1)` rồi dùng phần dư để chứa chuỗi ngay sau các trường. Đây là tối ưu hoá quan trọng thường thấy trong mã kernel: cách khác sẽ cần **hai** lời gọi cấp phát riêng biệt cho một việc phổ biến như thao tác chuỗi. (§3.6.1)",
    code: {
      lang: "c",
      text: `typedef struct {
  int length;
  char c_str[0];   // trỏ tới cuối struct, chiếm 0 byte
} string;

string *person = malloc(sizeof(string) + length + 1);
person->length = length;
strcpy(person->c_str, to_convert);`,
    },
  },

  // ===== sp-io — Hệ thống tệp & Mạng (spf073–spf084) =====
  {
    id: "spf073",
    field: "sysprog",
    topic: "sp-io",
    front: "TCP cung cấp những gì mà UDP không có, và khi nào nên chọn UDP?",
    back: "TCP hướng kết nối và lo giúp: truyền lại gói bị mất, sắp xếp lại gói đến sai thứ tự, loại gói trùng, checksum, **flow control** (phía nhận) và **congestion control** (phía gửi). UDP không kết nối, phi trạng thái, \"bắn rồi quên\" — gói có thể mất, trùng hoặc đến sai thứ tự, nhưng không tốn bắt tay ba bước và là cách **duy nhất** làm multicast. Chọn UDP khi nhận được dữ liệu **mới nhất** quan trọng hơn nhận đủ dữ liệu, ví dụ cập nhật vị trí người chơi hay video streaming. (§11.3, §11.5.1)",
    code: null,
  },
  {
    id: "spf074",
    field: "sysprog",
    topic: "sp-io",
    front: "Bốn system call tối thiểu để dựng TCP server, theo thứ tự nào, và lời gọi nào chặn?",
    back: "`socket` → `bind` → `listen` → `accept`. `socket` tạo endpoint, `bind` gắn nó vào giao diện mạng và port thật, `listen(sockfd, backlog)` đặt kích thước hàng đợi kết nối chưa xử lý (server hiệu năng cao thường 128 trở lên). **`accept` là lời gọi chặn** — nó chờ tới khi có client mới và trả về một **file descriptor mới** dành riêng cho client đó. Lỗi lập trình phổ biến là dùng nhầm descriptor của socket thụ động ban đầu để làm I/O. (§11.4)",
    code: {
      lang: "c",
      text: `struct sockaddr_storage clientaddr;
socklen_t clientaddrsize = sizeof(clientaddr);
int client_id = accept(passive_socket,
                       (struct sockaddr *)&clientaddr,
                       &clientaddrsize);`,
    },
  },
  {
    id: "spf075",
    field: "sysprog",
    topic: "sp-io",
    front: "Ba lời gọi để dựng TCP client là gì, và `getaddrinfo` báo lỗi theo kiểu nào?",
    back: "`getaddrinfo` → `socket` → `connect`. `getaddrinfo` dựng một **danh sách liên kết** các struct `addrinfo`; dùng struct `hints` để lọc (`ai_family = AF_INET6`, `ai_socktype = SOCK_STREAM`). Nó **không dùng `errno`** — chính giá trị trả về là mã lỗi, và phải đưa qua `gai_strerror` để có thông báo đọc được. Sau `connect`, socket dùng được như file descriptor thường với `read`/`write`. (§11.3.2)",
    code: {
      lang: "c",
      text: `struct addrinfo hints;
memset(&hints, 0, sizeof(hints));
hints.ai_family = AF_INET6;
hints.ai_socktype = SOCK_STREAM;

int result = getaddrinfo(host, port, &hints, &res);
if (result) fprintf(stderr, "%s\\n", gai_strerror(result));`,
    },
  },
  {
    id: "spf076",
    field: "sysprog",
    topic: "sp-io",
    front: "`htons` và `ntohs` làm gì, và thứ tự byte mạng là gì?",
    back: "`htons` (\"host to network short\") chuyển số nguyên không dấu 16 bit sang **thứ tự byte mạng**, `htonl` làm điều tương tự với 32 bit; `ntohs`/`ntohl` là chiều ngược lại. Thứ tự mạng được định nghĩa là **big-endian** theo RFC1700. Thứ tự host thì tuỳ kiến trúc — với máy x86 hai thứ tự này khác nhau. Mỗi khi đọc/ghi thông tin port và địa chỉ ở mức thấp, phải chuyển đổi, nếu không giá trị sẽ sai. (§11.3.1)",
    code: null,
  },
  {
    id: "spf077",
    field: "sysprog",
    topic: "sp-io",
    front: "Có gì đặc biệt ở port nhỏ hơn 1024, và vì sao `bind` hay thất bại lúc đang phát triển?",
    back: "Chỉ process có quyền **root** mới được lắng nghe trên port nhỏ hơn 1024; port từ 1024 trở lên thì process nào cũng lắng nghe được (port 80 dùng cho HTTP không mã hoá). `bind` thất bại nếu port đang được dùng — port thuộc về **máy**, không thuộc process hay user — và theo mặc định port bị giữ lại ở trạng thái **TIME-WAIT** sau khi server socket đóng. Đặt `SO_REUSEPORT` bằng `setsockopt` trước khi bind để tái sử dụng ngay. (§11.3, §11.4)",
    code: {
      lang: "c",
      text: `int optval = 1;
setsockopt(sfd, SOL_SOCKET, SO_REUSEPORT, &optval, sizeof(optval));
bind(...);`,
    },
  },
  {
    id: "spf078",
    field: "sysprog",
    topic: "sp-io",
    front: "Ở chế độ non-blocking, `read` báo \"chưa có dữ liệu\" bằng cách nào? `select` thua `epoll` ở đâu?",
    back: "`read` trả về **-1** và đặt `errno` thành **`EAGAIN` hoặc `EWOULDBLOCK`**; nếu có sẵn một phần dữ liệu, nó trả về số byte đọc được ngay (yêu cầu 150 nhưng mới có 100 thì trả về 100). `write` cũng vậy. `select` phải **duyệt tuyến tính** qua từng đối tượng và phải bắt đầu lại nếu trạng thái đổi giữa chừng — rất kém hiệu quả với nhiều file descriptor; `epoll` (không thuộc POSIX, có trên Linux) cho biết chính xác descriptor nào đã sẵn sàng. (§11.7, §11.7.1)",
    code: {
      lang: "c",
      text: `int flags = fcntl(fd, F_GETFL, 0);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

// hoặc ngay khi tạo socket:
fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);`,
    },
  },
  {
    id: "spf079",
    field: "sysprog",
    topic: "sp-io",
    front: "RAID-0, RAID-1, RAID-3 và RAID-5 đánh đổi gì?",
    back: "**RAID-0** chia tệp giữa hai đĩa: giảm một nửa thời gian ghi nhưng hỏng một đĩa là mất tệp. **RAID-1** nhân đôi mọi lần ghi: đọc nhanh hơn (lấy từ đĩa nào cũng được), ghi có thể chậm gấp đôi, chi phí lưu trữ tăng gấp đôi. **RAID-3** dùng bit parity trên một đĩa riêng — nút thắt cổ chai vì đĩa parity phải ghi mỗi lần. **RAID-5** xoay vòng block parity qua cả mảng nên đọc và ghi đều tốt hơn RAID-3. (§12.6.1, §12.6.2)",
    code: null,
  },
  {
    id: "spf080",
    field: "sysprog",
    topic: "sp-io",
    front: "Tên tệp được lưu ở đâu — trong inode hay ở nơi khác?",
    back: "**Không phải trong inode.** Inode *chính là* tệp: nó giữ metadata (quyền, chủ sở hữu, kích thước, thời điểm truy cập) và các con trỏ tới disk block. Tên tệp được lưu trong **thư mục**, vốn là một ánh xạ tên → số inode. Nhờ vậy một tệp có thể mang nhiều tên khác nhau hoặc tồn tại trong nhiều thư mục. Xem ánh xạ này bằng `ls -i`. (§12.2.1, §12.2.2)",
    code: {
      lang: "c",
      text: `# ls -i
12983989 dirlist.c    12984068 sandwich.c`,
    },
  },
  {
    id: "spf081",
    field: "sysprog",
    topic: "sp-io",
    front: "Với block 4KiB và con trỏ 4 byte, một single/double/triple indirect block tham chiếu được bao nhiêu dữ liệu?",
    back: "Một disk block chứa 4KiB / 4B = **1024 con trỏ**. Single indirect: 1024 × 4KiB = **4MiB**. Double indirect (1024 con trỏ tới 1024 bảng gián tiếp): 1024 × 4MiB = **4GiB**. Triple indirect: **4TiB**. Cái giá là đọc giữa các block chậm gấp ba do số tầng gián tiếp tăng lên; thời gian đọc bên trong một block thì không đổi. (§12.2.1)",
    code: null,
  },
  {
    id: "spf082",
    field: "sysprog",
    topic: "sp-io",
    front: "Hard link khác symbolic link ở điểm nào, và vì sao không được hard link tới thư mục?",
    back: "**Hard link** là một mục thư mục gán thêm tên cho **cùng số inode** — `ls -i` cho thấy cùng inode; reference count trong inode chỉ đếm hard link. **Symlink** là một tệp riêng (inode khác) có bit đặc biệt, bên trong chứa đường dẫn; nó chậm hơn vì cần thêm một lần `open` và `read`, nhưng có thể trỏ tới tệp chưa tồn tại, tới thư mục, và tới thứ nằm ngoài hệ thống tệp hiện tại. POSIX cấm hard link tới thư mục vì nó tạo chu trình: tìm kiếm đệ quy có thể không bao giờ kết thúc và `..` chỉ tham chiếu được một cha. (§12.2.5)",
    code: null,
  },
  {
    id: "spf083",
    field: "sysprog",
    topic: "sp-io",
    front: "Bit `rwx` có ý nghĩa gì trên **thư mục**, và umask mặc định 022 làm gì?",
    back: "Trên thư mục: **w** cho phép tạo hoặc xoá tệp bên trong, **r** cho phép liệt kê nội dung, **x** cho phép `cd` vào. Không có bit x thì mọi nỗ lực tạo/xoá đều thất bại dù vẫn liệt kê được. **umask trừ bớt** bit quyền khỏi giá trị yêu cầu khi tạo tệp mới: mặc định 022 nghĩa là group và other bị bỏ quyền ghi. Tạo tệp với mode 0666 dưới umask 022 sẽ ra `0666 & ~022`. umask được process con thừa kế khi fork. (§12.3, §12.3.3)",
    code: {
      lang: "c",
      text: `// 755 = rwx r-x r-x   (4=read, 2=write, 1=execute)
chmod 755 myfile

open("myfile", O_CREAT, S_IRUSR | S_IWUSR | S_IRGRP |
                        S_IWGRP | S_IROTH | S_IWOTH);
// umask 022 -> S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH`,
    },
  },
  {
    id: "spf084",
    field: "sysprog",
    topic: "sp-io",
    front: "Bit setuid và sticky bit làm gì?",
    back: "**setuid** khiến chương trình khi chạy đặt **effective user id** thành uid của chủ sở hữu tệp — ví dụ kinh điển là `sudo`, thuộc sở hữu root. `getuid` vẫn trả về uid thực của người chạy, còn `geteuid` trả về uid hiệu lực. **Sticky bit** ngày nay chỉ có ý nghĩa trên thư mục: chỉ chủ sở hữu tệp, chủ sở hữu thư mục và root mới đổi tên hay xoá được tệp bên trong — đây là cách `/tmp` vừa dùng chung vừa an toàn. Đặt bằng `chmod +t`. (§12.3.4, §12.3.5)",
    code: null,
  },

  // ===== sp-security — Bảo mật (spf085–spf090) =====
  {
    id: "spf085",
    field: "sysprog",
    topic: "sp-security",
    front: "Hàm `greeting` này bị stack smashing như thế nào, và sửa ra sao?",
    back: "`strcpy` **không kiểm tra giới hạn**, nên chuỗi dài hơn 32 byte tràn qua `buf` và có thể **thay thế địa chỉ trả về** của hàm bằng địa chỉ mã của kẻ tấn công. Hầu hết chuỗi chỉ làm chương trình thoát với segmentation fault, nhưng với bytecode được dựng khéo — chẳng hạn `execve(\"/bin/sh\", ...)` — và tệp thuộc sở hữu root, kẻ tấn công có thể lấy được root shell. Sửa: dùng `strncpy` (hoặc `strlcpy` trên OpenBSD) và bật stack canary. (§14.2.1, §17.2)",
    code: {
      lang: "c",
      text: `void greeting(const char *name) {
  char buf[32];
  strcpy(buf, name);   // không kiểm tra giới hạn
  printf("Hello, %s!\\n", buf);
}

int main(int argc, char *argv[]) {
  if (argc < 2) return 1;
  greeting(argv[1]);
  return 0;
}`,
    },
  },
  {
    id: "spf086",
    field: "sysprog",
    topic: "sp-security",
    front: "Vì sao chương trình này in ra `aoo` khi nhập `hellloooooooo`?",
    back: "`out` và `in` nằm **cạnh nhau trong bộ nhớ**. `fscanf(stdin, \"%s\", in)` không giới hạn độ dài, nên đầu vào dài tràn khỏi `in` và đè lên `out`; chương trình in `a` (byte do chính nó đặt) cộng phần dữ liệu tràn sang. Ở đây hậu quả chỉ buồn cười, nhưng đổi `out` thành `pass_hash` thì đầu vào của người dùng vừa ghi đè lên hash mật khẩu. Ví dụ cần biên dịch với `-fno-stack-protector` mới tái hiện được. (§14.2.2)",
    code: {
      lang: "c",
      text: `int main() {
  char out[10];
  char in[10];
  fscanf(stdin, "%s", in);   // không giới hạn độ dài
  out[0] = 'a';
  out[9] = '\\0';
  printf("%s\\n", out);
  return 0;
}`,
    },
  },
  {
    id: "spf087",
    field: "sysprog",
    topic: "sp-security",
    front: "ASLR, stack protector và W^X mỗi thứ chặn kiểu tấn công nào?",
    back: "**ASLR** ngẫu nhiên hoá địa chỉ cơ sở của file thực thi, stack, heap và thư viện ở mỗi lần chạy, buộc kẻ tấn công phải đoán mò — không có nó thì tấn công return-to-libc rất dễ. **Stack protector (stack canary)** là giá trị nằm trong stack phải giữ nguyên suốt lời gọi hàm; nếu bị ghi đè, runtime abort và báo đã phát hiện stack smashing. **W^X / DEP** cho phép một page hoặc ghi được hoặc thực thi được nhưng không cả hai, ngăn kẻ tấn công ghi mã tuỳ ý lên stack/heap rồi chạy nó. (§14.2.4)",
    code: null,
  },
  {
    id: "spf088",
    field: "sysprog",
    topic: "sp-security",
    front: "Bộ ba CIA gồm những gì, và deadlock phá vỡ yếu tố nào?",
    back: "**Confidentiality** — chỉ bên được uỷ quyền mới được xem thông tin. **Integrity** — chỉ bên được uỷ quyền mới được sửa đổi, bất kể có được xem hay không. **Availability** — thông tin hoặc dịch vụ luôn sẵn sàng khi cần; tính xác thực (authenticity) thường được thêm vào. Deadlock làm dịch vụ ngừng đáp ứng nên nó phá vỡ **availability**; còn buffer overflow/underflow ghi đè dữ liệu nên phá vỡ **integrity**. (§14.1.1, §14.5)",
    code: null,
  },
  {
    id: "spf089",
    field: "sysprog",
    topic: "sp-security",
    front: "Heartbleed là lỗi loại gì, và bài học rút ra là gì?",
    back: "Đơn giản là **không kiểm tra giới hạn trên buffer**. Cơ chế SSL Heartbeat để một bên gửi chuỗi kèm độ dài và bên kia gửi lại chuỗi có độ dài đó; kẻ tấn công khai báo độ dài **lớn hơn** dữ liệu thực gửi (gửi \"cat\" nhưng yêu cầu 500 byte) và moi được nội dung bộ nhớ kề bên như mật khẩu. Bài học của sách: hãy kiểm tra buffer, và hãy biết sự khác nhau giữa một **buffer** và một **string**. (§18.2, §3.8.5)",
    code: null,
  },
  {
    id: "spf090",
    field: "sysprog",
    topic: "sp-security",
    front: "Spectre khai thác điều gì, và vì sao SEGFAULT bị bỏ qua vẫn làm rò rỉ dữ liệu?",
    back: "Nó khai thác **thực thi lệnh không theo thứ tự / suy đoán**: sau 9 lần lặp nhánh đều được thực hiện, bộ xử lý đoán lần thứ 10 cũng vậy và **nạp trước** lệnh giải tham chiếu một địa chỉ không hợp lệ. Chương trình về mặt logic không bao giờ tới đó nên kết quả bị loại bỏ — nhưng lỗi **không xoá cache** tham chiếu tới vùng nhớ vật lý đó. Lừa bộ xử lý đọc lại từ cache thì đọc được giá trị mà bình thường không đọc được, ví dụ mật khẩu hay thông tin thanh toán. (§14.2.3, §18.5)",
    code: {
      lang: "c",
      text: `a[0] = 0xCAFE;   // dereference sẽ SEGFAULT
int j = 10;      // nằm trong thanh ghi
int i = 10;      // ép nằm trong bộ nhớ chính
for (int i = 10; i != 0; --i, --j) {
  if (i) { val = *a[j]; }   // lần cuối chạy suy đoán
}`,
    },
  },
];
