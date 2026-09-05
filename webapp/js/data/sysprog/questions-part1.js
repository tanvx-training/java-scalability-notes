// Ngân hàng câu hỏi System Programming — phần 1 (sp-c, sp-process, sp-concurrency).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi câu trích dẫn mục nguồn trong sách (§X.Y) để nhảy ngược tra cứu.
// Bản ghi sysprog KHÔNG có trường `cert` — chỉ ngân hàng Kubernetes mới có.
// GIỮ NGUYÊN id (spq001–spq060) — thống kê đúng/sai trong localStorage lưu theo id.

export const sysprogQuestionsPart1 = [
  // ===== sp-c — C & Bộ nhớ (spq001–spq022) =====
  {
    id: "spq001",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Chương trình sau in ra gì, và vì sao?",
    code: {
      lang: "c",
      text: `void func(void) {
  char result[sizeof("Hello World")];
  char *src = "Hello World";
  printf("%zu\\n", sizeof(src));
}`,
    },
    options: [
      "11 — `strlen` của chuỗi \"Hello World\"",
      "12 — độ dài chuỗi cộng byte NUL kết thúc",
      "8 trên hệ 64-bit — kích thước một con trỏ",
      "Lỗi biên dịch: `sizeof` không dùng được với con trỏ",
    ],
    answer: 2,
    explanation: "`src` là **con trỏ**, nên `sizeof(src)` là kích thước con trỏ, không liên quan tới chuỗi nó trỏ tới. Sách nêu thẳng cặp ví dụ: `char str1[] = \"will be 11\"` cho `sizeof` bằng 11 vì đó là **mảng**, còn `char *str2 = \"will be 8\"` cho 8 vì đó là **con trỏ**. Phương án \"12\" hấp dẫn vì đúng với `sizeof(\"Hello World\")` — biểu thức đó mới là mảng 12 phần tử. Đây chính là cái bẫy sách cảnh báo: \"Hãy cẩn thận khi dùng `sizeof` để lấy độ dài của một chuỗi!\" Muốn độ dài chuỗi phải dùng `strlen`. (§3.3.1, §15.1.1)",
  },
  {
    id: "spq002",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Dòng khai báo sau tạo ra mấy con trỏ?",
    code: {
      lang: "c",
      text: `int* ptr3, ptr4;`,
    },
    options: [
      "Hai — cả `ptr3` lẫn `ptr4` đều là `int*`",
      "Một — `ptr3` là con trỏ, `ptr4` là biến `int` thông thường",
      "Không con trỏ nào — dòng này không biên dịch được",
      "Hai, nhưng `ptr4` chưa được khởi tạo nên là hành vi không xác định",
    ],
    answer: 1,
    explanation: "Do cú pháp C, `int*` **không phải một kiểu riêng**: dấu `*` gắn với từng biến chứ không gắn với kiểu. Vì vậy chỉ `ptr3` là con trỏ, còn `ptr4` là một `int` bình thường. Phương án \"hai con trỏ\" là hiểu lầm phổ biến nhất, xuất phát từ cách đọc `int*` như một kiểu trọn vẹn. Cách viết an toàn là đặt `*` ngay trước mỗi tên biến: `int *ptr3, *ptr4;`. (§3.7.1)",
  },
  {
    id: "spq003",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Trong đoạn mã sau, dòng nào KHÔNG biên dịch được, và dòng nào biên dịch được nhưng sập lúc chạy?",
    code: {
      lang: "c",
      text: `char ary[] = "Hello";
char *ptr = "Hello";

strcpy(ptr, "World");  // (1)
ary = "World";         // (2)
ptr = ary;             // (3)`,
    },
    options: [
      "(1) không biên dịch được; (2) biên dịch được nhưng sập lúc chạy",
      "(2) không biên dịch được; (1) sập lúc chạy với SEGFAULT",
      "Cả (1) và (2) đều không biên dịch được",
      "Cả ba dòng đều hợp lệ; chỉ (3) làm rò rỉ bộ nhớ",
    ],
    answer: 1,
    explanation: "`ary` là tên mảng — nó \"mãi mãi tham chiếu tới mảng gốc\", nên phép gán `ary = \"World\"` bị trình biên dịch từ chối. Ngược lại `strcpy(ptr, \"World\")` biên dịch tốt nhưng ghi vào một string literal bất biến → hệ điều hành sinh SEGFAULT. Phương án A đảo ngược hai chuyện này và rất hấp dẫn vì trực giác \"mảng cố định nên không ghi được\" — thực tế thì ngược lại: mảng char là **bản sao ghi được**, còn con trỏ tới literal mới là thứ chỉ đọc. Dòng (3) hoàn toàn hợp lệ và sau đó `strcpy(ptr, \"World\")` sẽ chạy được. (§3.6.3)",
  },
  {
    id: "spq004",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Nỗ lực sao chép chuỗi sau sai ở đâu?",
    code: {
      lang: "c",
      text: `char *copy(char *src) {
  char *result = malloc(strlen(src));
  strcpy(result, src);
  return result;
}`,
    },
    options: [
      "Không sai gì — `strlen` đã tính cả byte kết thúc",
      "Thiếu 1 byte: mọi chuỗi cần `strlen(s) + 1` byte cho ký tự NUL",
      "`strcpy` không tự đặt byte NUL, nên phải gán tay `result[strlen(src)] = '\\0'`",
      "Phải dùng `calloc` vì `malloc` để lại dữ liệu rác",
    ],
    answer: 1,
    explanation: "Để lưu chuỗi `\"Hi\"` cần 3 byte: `[H] [i] [\\0]`. `strcpy` **sẽ** ghi byte NUL, tức nó ghi `strlen(src) + 1` byte → tràn heap đúng một byte. Phương án C hấp dẫn vì nghe rất giống lời cảnh báo quen thuộc \"nhớ kết thúc chuỗi bằng NUL\", nhưng sách nói rõ `strcpy` tự cung cấp byte kết thúc; vấn đề nằm ở chỗ cấp phát thiếu chỗ cho nó. Sửa: `malloc(strlen(src) + 1)`. (§3.8.6)",
  },
  {
    id: "spq005",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 3,
    question: "Với các định nghĩa sau, biểu thức `long_ - sizeof(long) + sizeof(int_)` dịch con trỏ đi bao nhiêu byte?",
    code: {
      lang: "c",
      text: `int *int_;      // sizeof(int)  == 4
long *long_;    // sizeof(long) == 8
int **int_ptr;  // sizeof(int*) == 8`,
    },
    options: [
      "0 byte",
      "-8 byte",
      "64 byte",
      "16 byte",
    ],
    answer: 0,
    explanation: "Số học con trỏ đếm theo **phần tử**, không theo byte: biểu thức dịch `-sizeof(long) + sizeof(int_)` = `-8 + 8` = 0 phần tử → 0 byte. Phương án \"-8 byte\" là bẫy hay gặp nhất vì nó cộng trực tiếp các giá trị `sizeof` như thể chúng là byte, quên mất phép nhân tự động với kích thước kiểu được trỏ tới. Lưu ý `int_` có kiểu `int *`, nên `sizeof(int_)` là kích thước một con trỏ (8), không phải `sizeof(int)`. Chính vì phép nhân này luôn xảy ra mà POSIX cấm số học trên con trỏ `void`. (§3.7.2, §3.12, §3.12.1)",
  },
  {
    id: "spq006",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Trong đoạn mã dưới đây, những con trỏ nào được **bảo đảm** trỏ tới vùng nhớ đã bằng không?",
    code: {
      lang: "c",
      text: `void func() {
  int *ptr1 = malloc(sizeof(int));
  int *ptr2 = realloc(NULL, sizeof(int));
  int *ptr3 = calloc(1, sizeof(int));
  int *ptr4 = calloc(sizeof(int), 1);

  printf("%d %d %d %d\\n", *ptr1, *ptr2, *ptr3, *ptr4);
}`,
    },
    options: [
      "Cả bốn — bộ nhớ mới xin từ hệ điều hành luôn được xóa về không",
      "Chỉ `ptr3` — `calloc(sizeof(int), 1)` truyền sai thứ tự đối số nên không zero",
      "`ptr3` và `ptr4`",
      "`ptr2`, `ptr3` và `ptr4`",
    ],
    answer: 2,
    explanation: "Chỉ `calloc` bảo đảm zero-fill, và sách nói rõ `calloc(x, y)` giống hệt `calloc(y, x)` — nên cả `ptr3` lẫn `ptr4` đều được bảo đảm. `malloc` để lại dữ liệu rác vì lý do hiệu năng, và `realloc(NULL, n)` cũng vậy. Phương án A là hiểu lầm nguy hiểm nhất và sách dành hẳn một đoạn cảnh báo nó: trang mới lấy từ hệ điều hành **thường** bằng không, nên các chương trình sai kiểu này \"có vẻ chạy được\" cho tới khi có vùng nhớ được `free` rồi tái sử dụng. (§5.2, §5.2.1, §3.8.8, §15.1.1)",
  },
  {
    id: "spq007",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Hàm sau có hợp lệ không, và `output` nằm ở đâu trong bộ nhớ?",
    code: {
      lang: "c",
      text: `char *foo(int var) {
  static char output[20];
  snprintf(output, 20, "%d", var);
  return output;
}`,
    },
    options: [
      "Không hợp lệ — đây là trả về con trỏ tới biến tự động trên stack, vùng nhớ đã hết hiệu lực",
      "Hợp lệ — `output` có cấp phát tĩnh, nhưng mọi lời gọi dùng chung MỘT bộ đệm",
      "Không hợp lệ vì `snprintf` đòi hỏi bộ đệm cấp phát trên heap",
      "Hợp lệ, và mỗi lời gọi nhận một bản sao `output` của riêng nó",
    ],
    answer: 1,
    explanation: "`static` bên trong hàm nghĩa là biến được cấp phát **một lần khi chương trình khởi động** chứ không phải mỗi lần hàm chạy, và thời gian sống bằng thời gian sống của chương trình — nên trả về con trỏ tới nó là hợp lệ. Sách chú thích thẳng vào ví dụ tương tự: bộ đệm này \"được dùng chung mỗi lần hàm được gọi\". Phương án A là phản xạ đúng cho `char output[20]` không có `static` (§3.8.3) nhưng sai ở đây — chính từ khóa `static` làm nên khác biệt. Cái giá phải trả là lời gọi sau ghi đè kết quả của lời gọi trước. (§3.3.1, §3.8.3)",
  },
  {
    id: "spq008",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Lập trình viên đã mắc sai lầm gì trong hàm sinh mã vé sau?",
    code: {
      lang: "c",
      text: `static int id;

char *next_ticket() {
  id++;
  char result[20];
  sprintf(result, "%d", id);
  return result;
}`,
    },
    options: [
      "`id` là `static` nên nó được chia sẻ và không tăng đúng giữa các lời gọi",
      "Trả về con trỏ tới mảng tự động trên stack — vùng nhớ hết hiệu lực",
      "`sprintf` không giới hạn độ dài nên có thể tràn bộ đệm `result` 20 byte",
      "Thiếu `free(result)` nên mỗi lần gọi hàm lại rò rỉ 20 byte trên heap",
    ],
    answer: 1,
    explanation: "`result` là biến tự động: nó chỉ gắn với bộ nhớ stack trong thời gian sống của hàm, nên tiếp tục dùng vùng nhớ đó sau khi hàm trả về là một lỗi. Phương án C nghe rất hợp lý với ai quen cảnh giác `sprintf`, nhưng sách tính rõ khi bàn về `sprintf` và `snprintf`: in một số nguyên \"không bao giờ vượt quá 11 ký tự kể cả byte NUL\", nên 20 byte là thừa. Phương án D sai vì `result` không hề được `malloc`. Cách sửa: dùng bộ nhớ heap, hoặc khai báo bộ đệm là `static` như ví dụ ở §3.11. (§3.8.3, §3.5.2, §15.1.3)",
  },
  {
    id: "spq009",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Cách duy nhất để biết độ dài của một chuỗi C là gì?",
    code: null,
    options: [
      "Đọc trường độ dài được lưu ngay trước ký tự đầu tiên",
      "Tiếp tục đọc bộ nhớ cho tới khi gặp byte NUL",
      "Hỏi bộ cấp phát kích thước khối chứa chuỗi",
      "Dùng `sizeof` trên biến chuỗi",
    ],
    answer: 1,
    explanation: "Sách định nghĩa chuỗi C là một dãy byte kết thúc bởi `'\\0'`, và nói rõ cách duy nhất để biết độ dài là đọc bộ nhớ cho tới khi tìm thấy byte NUL — đó cũng là lý do `\"ABC\"` cần bốn byte. Phương án A mô tả chuỗi **có tiền tố độ dài** (length prefixed): sách nêu đích danh nó như lựa chọn mà C đã **không** chọn vì lý do lịch sử. Phương án D chỉ ra đúng số byte khi đối tượng là mảng, còn với con trỏ thì cho kích thước con trỏ. (§3.6.2, §3.6.3)",
  },
  {
    id: "spq010",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Hàm `mystrcpy` sau sai ở đâu?",
    code: {
      lang: "c",
      text: `void mystrcpy(char *dest, char *src) {
  while (*src) { dest = src; src++; dest++; }
}`,
    },
    options: [
      "Sao chép đúng nội dung nhưng quên byte NUL kết thúc chuỗi",
      "Không byte nào được chép — nó chỉ dịch `dest` sang trỏ vào chuỗi nguồn",
      "Vòng lặp chạy quá một byte nên ghi tràn ra ngoài bộ đệm `dest`",
      "Không biên dịch được vì tham số `src` phải khai báo là `const char *`",
    ],
    answer: 1,
    explanation: "Thiếu dấu `*`: `dest = src` gán **con trỏ**, không gán ký tự. Hàm chỉ dời hai con trỏ song song rồi kết thúc, bộ đệm đích không hề đổi. Phương án A là câu trả lời hấp dẫn nhất vì \"quên byte NUL\" đúng là một lỗi có thật trong đoạn này — nhưng nó chỉ là lỗi **thứ hai**; lỗi thứ nhất nghiêm trọng hơn nhiều. Bản đúng là `*dest = *src;` trong vòng lặp, rồi `*dest = *src;` một lần nữa sau vòng lặp để chép byte NUL. (§3.8.1)",
  },
  {
    id: "spq011",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Đoạn mã sau in ra gì?",
    code: {
      lang: "c",
      text: `int answer = 3;
if (answer = 42) { printf("The answer is %d", answer); }`,
    },
    options: [
      "Không in gì — điều kiện sai nên khối `if` bị bỏ qua hoàn toàn",
      "\"The answer is 42\" — phép gán trả về giá trị vừa gán, mà 42 khác không",
      "\"The answer is 3\" — `answer` giữ nguyên giá trị ban đầu",
      "Lỗi biên dịch: trình biên dịch hiện đại cấm gán bên trong điều kiện `if`",
    ],
    answer: 1,
    explanation: "Trong C, toán tử gán **cũng trả về giá trị được gán**. `answer = 42` gán 42 rồi cho ra 42, một giá trị khác không, nên điều kiện đúng và `answer` đã bị đổi thành 42. Phương án D hấp dẫn vì trình biên dịch hiện đại **có** cảnh báo, nhưng sách nói rõ chúng chỉ đòi thêm dấu ngoặc đơn chứ không cấm — và có những lúc ta thực sự muốn viết vậy, ví dụ `while ((nread = getline(&line, &len, stream)) != -1)`. Mẹo phòng lỗi: đặt hằng số lên trước, `if (42 == answer)`. (§3.9.1)",
  },
  {
    id: "spq012",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Lời gọi `malloc` dưới đây dành ra bao nhiêu byte?",
    code: {
      lang: "c",
      text: `struct User {
  char name[100];
};
typedef struct User user_t;

user_t *user = (user_t *) malloc(sizeof(user));`,
    },
    options: [
      "100 byte — vừa đủ cho mảng `name` bên trong struct",
      "Kích thước một con trỏ — 8 byte trên hệ 64-bit",
      "Không biên dịch được vì `sizeof` phải nhận tên kiểu",
      "104 byte — 100 byte dữ liệu cộng bốn byte đệm căn chỉnh",
    ],
    answer: 1,
    explanation: "`sizeof(user)` lấy kích thước của **biến** `user`, mà `user` là một con trỏ — nên ta chỉ dành đủ chỗ cho một địa chỉ. Ngay khi bắt đầu dùng `user`, chương trình sẽ làm hỏng bộ nhớ. Phương án A là điều lập trình viên **tưởng** mình đã viết, và đó chính là lý do lỗi này khó thấy: chỉ thiếu đúng hai ký tự `_t`. Mã đúng là `malloc(sizeof(user_t))`. (§3.8.4)",
  },
  {
    id: "spq013",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Đoạn mã sau mắc mấy lỗi, và sách khuyến nghị thói quen nào để phòng ngừa?",
    code: {
      lang: "c",
      text: `int *p = malloc(sizeof(int));
free(p);

*p = 123;

free(p);`,
    },
    options: [
      "Một lỗi (double free); phòng bằng cách nhớ chỉ gọi `free` một lần",
      "Hai lỗi (ghi qua con trỏ treo, rồi double free); nên gán `p = NULL` sau `free`",
      "Không lỗi nào — `free` chỉ đánh dấu khối là trống nên vùng nhớ vẫn còn ghi được",
      "Một lỗi (rò rỉ bộ nhớ) vì `free` được gọi trước khi dùng xong",
    ],
    answer: 1,
    explanation: "Có hai lỗi riêng biệt: `*p = 123` ghi vào vùng nhớ ta không còn sở hữu (dangling pointer), rồi `free(p)` lần hai là double free. Sách khuyên đặt con trỏ về `NULL` ngay sau khi giải phóng, vì `free(NULL)` vô hại và mọi lần dùng nhầm sẽ lộ ra ngay. Phương án C là hiểu lầm rất phổ biến, sinh ra từ việc đọc phần cài đặt bộ cấp phát (nơi `free` quả thật chỉ bật một bit trạng thái) — nhưng ở góc nhìn chương trình, dùng bộ nhớ sau khi `free` là **hành vi không xác định**. (§3.8.2, §5.2)",
  },
  {
    id: "spq014",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Lời gọi `memcpy` dưới đây thuộc loại lỗi \"trên máy tôi chạy được mà!\". Vì sao?",
    code: {
      lang: "c",
      text: `char buf[16] = "abcdefgh";
memcpy(buf + 2, buf, 8);`,
    },
    options: [
      "Hoàn toàn hợp lệ — `memcpy` xử lý được vùng nhớ chồng lấn",
      "Hành vi không xác định vì hai vùng nhớ chồng lấn; nên dùng `memmove`",
      "Lỗi biên dịch vì `memcpy` nhận `void *` chứ không nhận `char *` như ở đây",
      "Hợp lệ nhưng chậm hơn `memmove` nên không nên dùng",
    ],
    answer: 1,
    explanation: "Nguyên mẫu là `memcpy(void *restrict dest, const void *restrict src, size_t n)`: từ khóa `restrict` báo cho trình biên dịch rằng hai vùng nhớ **không được chồng lấn**, và nếu chồng lấn thì đó là hành vi không xác định. Sách gọi đây là ví dụ kinh điển kiểu \"trên máy tôi chạy được\" vì nhiều khi cả Valgrind cũng không phát hiện. Phương án D là hiểu lầm ngược chiều rất hay gặp: `memmove` không phải phiên bản chậm-hơn-nhưng-tương-đương, nó là phiên bản **đúng** khi vùng nhớ có thể chồng lấn. (§3.5.4, §3.3.1)",
  },
  {
    id: "spq015",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 3,
    question: "Chạy chương trình sau trên terminal, các đoạn văn bản xuất hiện theo thứ tự nào?",
    code: {
      lang: "c",
      text: `int main() {
  fprintf(stderr, "Hello ");
  fprintf(stdout, "It's a small ");
  fprintf(stderr, "World\\n");
  fprintf(stdout, "place\\n");
  return 0;
}`,
    },
    options: [
      "Đúng thứ tự trong mã: \"Hello It's a small World place\"",
      "\"Hello World\" ra trước, rồi mới tới \"It's a small place\"",
      "\"It's a small place\" ra trước vì stdout được ghi qua bộ đệm nên nhanh hơn",
      "Thứ tự không xác định và đổi sau mỗi lần chạy",
    ],
    answer: 1,
    explanation: "Chuẩn ISO định nghĩa standard error là không đệm toàn phần — trên thực tế nó **không đệm**, nên `\"Hello \"` và `\"World\\n\"` tới màn hình ngay. Standard output khi đích là terminal thì **đệm theo dòng**: `\"It's a small \"` không có ký tự xuống dòng nên nằm lại trong bộ đệm cho tới khi `\"place\\n\"` được in, lúc đó cả hai mới ra cùng lúc. Phương án A là câu trả lời trực giác nhất và cũng sai nhất — nó giả định mọi lời gọi `fprintf` đều ghi ngay lập tức. Muốn ép ghi, gọi `fflush()` trên stream. (§3.5.2)",
  },
  {
    id: "spq016",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 3,
    question: "Đoạn phân tích cú pháp sau có một lỗi con trỏ. Nó là gì và hậu quả ra sao?",
    code: {
      lang: "c",
      text: `int *data = malloc(sizeof(int));
char *line = "v 10";
char type;

int ok = 2 == sscanf(line, "%c %d", &type, &data);`,
    },
    options: [
      "Không lỗi — `&data` chính là địa chỉ vùng nhớ đã `malloc`",
      "Phải truyền `data` chứ không phải `&data` — `sscanf` ghi đè chính con trỏ",
      "`%c` phải đổi thành `%s`, nếu không `type` sẽ nuốt cả khoảng trắng đứng trước",
      "Phải kiểm tra `sscanf` trả về 1 chứ không phải 2 vì chỉ có một số",
    ],
    answer: 1,
    explanation: "`&data` là địa chỉ **của biến con trỏ**, không phải vùng nhớ mà con trỏ trỏ tới. `sscanf` sẽ ghi số 10 đè lên chính `data`, nên `data` trở thành con trỏ tới địa chỉ 10 — vùng nhớ đã `malloc` bị mất, và `free(data)` về sau sẽ thất bại. Phương án A là đúng cách đọc `&` cho một biến `int` bình thường và vì thế rất dễ mắc; ở đây `data` **đã** là con trỏ nên không cần lấy địa chỉ thêm lần nữa. Sách cũng nhắc: luôn kiểm tra số mục `sscanf` phân tích được (ở đây 2 là đúng), và dùng ký hiệu định dạng có giới hạn độ dài để tránh tràn bộ đệm. (§3.5.3)",
  },
  {
    id: "spq017",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Vì sao `gets` bị loại bỏ ở C99 và bị xóa hẳn khỏi chuẩn C11?",
    code: null,
    options: [
      "Vì nó chậm hơn `fgets` do phải quét chuỗi hai lần",
      "Vì không giới hạn được độ dài đọc vào, nên bộ đệm rất dễ bị tràn",
      "Vì nó không hoạt động khi standard input bị chuyển hướng từ một file",
      "Vì nó không sao chép ký tự xuống dòng vào bộ đệm",
    ],
    answer: 1,
    explanation: "`gets` không nhận tham số kích thước, nên nó ghi bao nhiêu byte tùy vào đầu vào — người dùng quyết định, không phải lập trình viên. Khi bị khai thác có chủ ý để chiếm luồng điều khiển, đây chính là buffer overflow. Phương án D nêu một sự thật **có thật** trong sách — `fgets`, khác với `gets`, sao chép cả ký tự xuống dòng — nhưng đó là điểm khác biệt về hành vi, không phải lý do khiến `gets` bị xóa. Hãy dùng `fgets` hoặc `getline`. (§3.5.3)",
  },
  {
    id: "spq018",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Theo sách, ưu điểm chính của `getline` so với `fgets` là gì?",
    code: {
      lang: "c",
      text: `char *buffer = NULL;
size_t size = 0;

ssize_t chars = getline(&buffer, &size, stdin);
// ...
free(buffer);`,
    },
    options: [
      "`getline` không sao chép ký tự xuống dòng vào bộ đệm",
      "`getline` tự cấp phát và cấp phát lại bộ đệm heap đủ lớn cho dòng",
      "`getline` là system call nên nhanh hơn hàm thư viện `fgets`",
      "`getline` không bao giờ trả về -1 nên chương trình không cần kiểm tra lỗi",
    ],
    answer: 1,
    explanation: "Truyền `buffer = NULL` và `size = 0`, `getline` sẽ tự `malloc`; ở lần đọc sau nó tái sử dụng bộ đệm cũ hoặc `free` rồi cấp phát bộ đệm lớn hơn nếu cần — nên dòng dài đến đâu cũng đọc trọn (nhớ `free` khi xong). Phương án A hấp dẫn vì đúng là có chuyện ký tự xuống dòng ở đây, nhưng ngược chiều: `getline` **cũng** giữ lại `'\\n'`, chính vì thế đoạn mã mẫu trong sách phải tự cắt bỏ nó. (§3.5.3)",
  },
  {
    id: "spq019",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 2,
    question: "Vì sao đoạn kiểm tra lỗi cho `strtol` dưới đây chưa đủ?",
    code: {
      lang: "c",
      text: `char *endptr;
long parsed = strtol(input, &endptr, 10);

if (parsed == 0) {
  // coi là lỗi phân tích
}`,
    },
    options: [
      "Vì `strtol` trả về -1 khi lỗi chứ không phải trả về 0",
      "Vì `strtol` trả về 0 cho cả `\"0\"` hợp lệ lẫn chuỗi hỏng; phải dùng `errno`",
      "Vì phải dùng `strtoll` mới nhận được mã lỗi trả về",
      "Vì `strtol` đặt `endptr` về `NULL` khi lỗi nên phải kiểm tra `endptr` thay vì giá trị trả về",
    ],
    answer: 1,
    explanation: "`strtol` **không** trả về mã lỗi: gặp chuỗi số không hợp lệ nó trả về 0, đúng bằng giá trị hợp lệ của chuỗi `\"0\"`. Bên gọi phải tự phân biệt hai trường hợp, và cách sách chỉ ra là \"bước đệm\" `errno`: lưu `errno` cũ, đặt `errno = 0`, gọi `strtol`, rồi nếu `parsed == 0 && errno != 0` thì chắc chắn là lỗi. Phương án A là thói quen mang từ các system call kiểu `open`/`read` sang — đó chính là điều khiến lỗi này hay lọt lưới: không phải hàm C nào cũng báo lỗi bằng giá trị âm. (§3.5.4)",
  },
  {
    id: "spq020",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 3,
    question: "Heap còn ba khoảng trống, theo thứ tự duyệt là 16KiB, 30KiB rồi 2KiB. Với `malloc(2048)`, mỗi chiến lược đặt chỗ chọn khoảng trống nào?",
    code: null,
    options: [
      "best fit → 2KiB · worst fit → 30KiB · first fit → 16KiB",
      "best fit → 16KiB · worst fit → 2KiB · first fit → 30KiB",
      "Cả ba đều chọn khoảng 2KiB vì nó vừa khít",
      "best fit → 30KiB · worst fit → 16KiB · first fit → 2KiB",
    ],
    answer: 0,
    explanation: "Best fit tìm khoảng trống **nhỏ nhất mà vẫn đủ lớn** — ở đây là 2KiB, tình cờ vừa khít nên thậm chí không phải tách. Worst fit tìm khoảng trống **lớn nhất**, tức 30KiB, rồi tách nó làm hai. First fit lấy khoảng trống **đầu tiên** đủ lớn, tức 16KiB, và không cần duyệt hết heap. Phương án C hấp dẫn vì \"vừa khít\" nghe như kết quả mọi thuật toán đều muốn — nhưng worst fit và first fit không hề đi tìm sự vừa khít; đó chính là điểm phân biệt ba chiến lược. (§5.3.1)",
  },
  {
    id: "spq021",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 1,
    question: "Heap 64KiB có 17KiB đã cấp phát và 47KiB còn trống, nhưng khối liên tục lớn nhất chỉ 30KiB. Hiện tượng này gọi là gì?",
    code: null,
    options: [
      "Phân mảnh trong (internal fragmentation)",
      "Phân mảnh ngoài (external fragmentation)",
      "Rò rỉ bộ nhớ (memory leak)",
      "Chi phí phụ trội của boundary tag",
    ],
    answer: 1,
    explanation: "Phân mảnh **ngoài** là đúng tình huống này: tổng bộ nhớ trống thừa đủ, nhưng nó bị cắt vụn nên không còn khối liên tục nào đủ lớn. Phân mảnh **trong** là chuyện khác hẳn và rất hay bị lẫn: đó là khi bộ cấp phát trả về nguyên một khối lớn hơn yêu cầu — ví dụ trả cả khối 16KiB cho lời gọi `malloc(2048)` mà không tách, để lại khoảng 14KiB không ai dùng được, nằm **bên trong** khối đã cấp. (§5.3.1)",
  },
  {
    id: "spq022",
    field: "sysprog",
    domain: "sp-c",
    difficulty: 3,
    question: "Vì sao bộ cấp phát lưu kích thước khối ở **cả cuối** khối (boundary tag)?",
    code: null,
    options: [
      "Để phát hiện chương trình ghi tràn ra ngoài khối đã cấp phát",
      "Để tìm được khối liền TRƯỚC, nhờ đó `free` gộp được cả hai phía",
      "Để căn chỉnh con trỏ trả về cho người dùng theo bội số của 16 byte",
      "Để lưu con trỏ `next` và `prev` của explicit free list",
    ],
    answer: 1,
    explanation: "Danh sách khối là **ngầm**: từ một khối ta cộng kích thước để nhảy tới khối kế tiếp, nhưng không có cách nào nhảy lùi. Ghi thêm kích thước ở cuối mỗi khối — giải pháp của Knuth — cho phép khối hiện tại nhìn lùi vài byte để biết khối liền trước dài bao nhiêu, nhờ đó gộp được cả hai phía khi giải phóng. Phương án D là khái niệm láng giềng rất dễ lẫn: explicit free list quả thật lưu con trỏ `next`/`prev` **bên trong** khối rỗng, nhưng đó là cấu trúc khác và sách nói rõ nó **vẫn cần** boundary tag để gộp khối. (§5.4.3, §5.4.5)",
  },

  // ===== sp-process — Tiến trình & Tín hiệu (spq023–spq036) =====
  {
    id: "spq023",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 1,
    question: "`fork()` trả về giá trị gì cho process con và cho process cha?",
    code: null,
    options: [
      "0 ở process con, PID của con ở process cha, -1 khi thất bại",
      "PID của process cha ở con, và 0 ở process cha — đối xứng nhau",
      "PID của process con ở cả hai bên, cha và con giống nhau",
      "1 ở process con, 0 ở process cha, giống quy ước exit code",
    ],
    answer: 0,
    explanation: "Sách còn cho một mẹo nhớ **vì sao** lại bất đối xứng như vậy: process con luôn tìm được cha của mình bằng `getppid()` nên không cần `fork` trả về thêm thông tin gì; ngược lại, process cha có thể có nhiều con nên buộc phải được báo tường minh PID của từng con. Phương án B là cách hiểu \"đối xứng\" rất tự nhiên nhưng thừa: `getppid()` đã lo phần đó rồi. Giá trị -1 nghĩa là tạo process thất bại và chương trình nên đọc `errno`. (§4.4.2)",
  },
  {
    id: "spq024",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Chương trình sau in ra gì?",
    code: {
      lang: "c",
      text: `#include <unistd.h>
#include <stdio.h>

int main() {
  int answer = 84 >> 1;
  printf("Answer: %d", answer);
  fork();
  return 0;
}`,
    },
    options: [
      "\"Answer: 42\" đúng một lần — `printf` đã chạy xong trước khi `fork` được gọi",
      "\"Answer: 42\" hai lần — bộ đệm stdout chưa flush bị nhân bản theo process",
      "Không in gì cả vì chuỗi thiếu ký tự xuống dòng kết thúc",
      "Hành vi không xác định vì gọi `fork` sau `printf` mà không `wait`",
    ],
    answer: 1,
    explanation: "Dòng `printf` quả thật chỉ **thực thi** một lần — nhưng nó chưa hề ghi ra màn hình: không có ký tự xuống dòng, không gọi `fflush`, nên văn bản còn nằm trong bộ đệm bên trong bộ nhớ process. `fork()` sao chép toàn bộ bộ nhớ đó, kể cả bộ đệm, nên process con khởi đầu với một bộ đệm đầu ra không rỗng và bộ đệm này **có thể** được flush khi nó thoát. Phương án A chính là bẫy: nó suy luận đúng về thứ tự thực thi nhưng quên rằng \"đã thực thi `printf`\" không đồng nghĩa với \"đã ghi ra ngoài\". (§4.4.2, §3.5.2)",
  },
  {
    id: "spq025",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Vòng lặp sau định tạo 10 process con, nhưng tên chương trình bị gõ nhầm thành `ehco`. Hậu quả là gì?",
    code: {
      lang: "c",
      text: `for (i = 0; i < HELLO_NUMBER; i++) {   // HELLO_NUMBER == 10
  pid_t child = fork();
  if (child == -1) break;
  if (child == 0) {
    execlp("ehco", "echo", "hello", NULL);
  } else {
    children[i] = child;
  }
}`,
    },
    options: [
      "Vẫn đúng 10 process; sửa bằng cách kiểm tra giá trị trả về của `fork`",
      "1024 process — một fork bomb; sửa bằng cách thêm `exit` ngay sau `exec`",
      "Đúng 10 process; `exec` thất bại nên các process con chỉ đơn giản không làm gì",
      "20 process, vì mỗi vòng lặp gọi `fork` đúng hai lần",
    ],
    answer: 1,
    explanation: "`exec` chỉ thay thế ảnh process khi nó **thành công**. Vì `ehco` không tồn tại, mỗi process con rơi xuống dòng tiếp theo và tiếp tục chạy chính vòng lặp `for` đó — mỗi vòng lại nhân đôi số process, cho ra 1024. Phương án C là cách nghĩ tự nhiên nhất (\"exec hỏng thì con đứng yên\") và cũng chính là điều khiến fork bomb kiểu này thường không phải do ác ý mà do lỗi lập trình. Cách sửa là đặt `exit` ngay sau `exec`, vì đến được dòng đó nghĩa là `exec` đã thất bại. (§4.4.3)",
  },
  {
    id: "spq026",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 1,
    question: "Một process con kết thúc nhưng process cha chưa `wait`. Nó ở trạng thái nào, và chuyện gì xảy ra nếu process cha chết trước?",
    code: null,
    options: [
      "Zombie; nếu cha chết, `init` (PID 1) nhận nuôi và tự wait dọn sạch",
      "Orphan (mồ côi); kernel kill nó ngay lập tức",
      "Zombie; nó vẫn tiếp tục được cấp thời gian CPU cho tới khi bị `kill -9`",
      "Orphan; PPID của nó trở thành 0 và nó chạy mãi mãi",
    ],
    answer: 0,
    explanation: "Zombie là process con đã kết thúc nhưng vẫn chiếm một chỗ trong bảng process của kernel (PID, trạng thái, cách nó bị kill) — cách duy nhất để dọn là process cha `wait`. Nếu cha chết trước, các con thành mồ côi và được gán cho `init` (PID 1); `init` tự động wait mọi con của nó nên các zombie này biến mất. Phương án C là hiểu lầm dai dẳng nhất về zombie: chúng **không** tiêu tốn CPU — chỉ chiếm một mục trong bảng process, và cái giá thật sự là một process cha chạy lâu ngày không wait có thể mất khả năng `fork`. (§4.5.2)",
  },
  {
    id: "spq027",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Sau một lời gọi `exec` thành công, thứ nào dưới đây KHÔNG được giữ lại?",
    code: null,
    options: [
      "Các file descriptor đang mở (trừ khi có cờ `O_CLOEXEC`)",
      "Signal mask và tập signal đang chờ (pending)",
      "Các signal handler đã đăng ký",
      "PID, process cha và thư mục làm việc hiện tại",
    ],
    answer: 2,
    explanation: "`exec` thay thế ảnh process bằng một chương trình khác, nên mã của các signal handler cũ đã biến mất cùng ảnh cũ — chúng buộc phải được đặt lại về hành động mặc định ban đầu. Signal mask và tập pending thì **được** mang theo, và đó chính là chỗ dễ lẫn: nhiều người gộp chung \"mọi thứ về signal\" thành một khối. File descriptor cũng được giữ nguyên (sách coi đây là một vấn đề, vì process mới thường không biết gì về chúng), và process sau `exec` vẫn giữ nguyên PID, process cha, process group, người dùng và thư mục làm việc. (§4.6.1, §13.5)",
  },
  {
    id: "spq028",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 3,
    question: "Process cha đang có một signal ở trạng thái pending, đã cài handler cho `SIGINT`, và đang chặn `SIGQUIT`. Sau `fork`, process con thừa hưởng những gì?",
    code: null,
    options: [
      "Cả ba: signal pending, handler `SIGINT` và trạng thái chặn `SIGQUIT`",
      "Bản sao của handler `SIGINT` và của signal mask, nhưng KHÔNG có pending",
      "Signal pending và mask được giữ, nhưng handler bị đặt lại về mặc định",
      "Không thừa hưởng gì cả — process con khởi đầu với trạng thái signal sạch",
    ],
    answer: 1,
    explanation: "POSIX quy định process con thừa kế bản sao signal disposition và bản sao signal mask của cha: đã cài handler cho `SIGINT` trước khi fork thì con cũng gọi handler đó, `SIGQUIT` bị chặn ở cha thì cũng bị chặn ở con. Nhưng **pending signal không được thừa kế** — con sẽ không nhận signal đang chờ của cha trừ khi có ai đó gửi riêng cho nó. Phương án C mô tả đúng hành vi của `exec` chứ không phải của `fork`, và đây là cặp dễ tráo nhất: `fork` giữ handler và bỏ pending, `exec` bỏ handler và giữ pending. (§4.4.5, §13.5)",
  },
  {
    id: "spq029",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 3,
    question: "Đoạn mã sau tưởng như chỉ in file ra từng dòng kèm vài lần fork thừa. Vấn đề thật sự là gì?",
    code: {
      lang: "c",
      text: `FILE *file = fopen("test.txt", "r");

while ((nread = getline(&buffer, &buffer_cap, file)) != -1) {
  printf("%s", buffer);
  if (fork() == 0) {
    exit(0);
  }
  wait(NULL);
}`,
    },
    options: [
      "Không có vấn đề — process con thoát ngay nên không kịp đụng vào file",
      "Hành vi không xác định: `FILE*` chưa được chuẩn bị trước khi fork",
      "Rò rỉ bộ nhớ vì `buffer` không bao giờ được `free` trong process con",
      "Đây là fork bomb vì lời gọi `fork` nằm bên trong vòng lặp",
    ],
    answer: 1,
    explanation: "Khi fork, chỉ **file descriptor** được nhân bản chứ không phải file description, còn `FILE*` lại mang thêm bộ đệm riêng trong bộ nhớ process. Sách nêu quy tắc rõ ràng: mọi file descriptor phải được chuẩn bị trước khi fork — một `FILE*` mở để đọc và chưa đọc hết thì phải `fflush` hoặc đóng thì mới coi là đã chuẩn bị. Phương án A hấp dẫn vì `exit(0)` trông như vô hại, nhưng sách nói thẳng rằng một process bị coi là **đang dùng** descriptor nếu nó đọc, ghi, **hoặc vì lý do nào đó gọi `exit`**. Phương án D sai vì `wait(NULL)` và `exit(0)` giữ số process luôn ở mức hai. (§4.4.6)",
  },
  {
    id: "spq030",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 3,
    question: "Chương trình sau ghi những gì, và ghi vào đâu?",
    code: {
      lang: "c",
      text: `int main() {
  close(1);
  open("log.txt", O_RDWR | O_CREAT | O_APPEND, S_IRUSR | S_IWUSR);
  puts("Captain's log");
  chdir("/usr/include");

  execl("/bin/ls", "/bin/ls", ".", (char *) NULL);
  perror("exec failed");
  return 0;
}`,
    },
    options: [
      "\"Captain's log\" ra terminal, còn danh sách `/usr/include` đi vào `log.txt`",
      "Cả hai đều đi vào `log.txt` — `open` lấy file descriptor trống thấp nhất, chính là 1",
      "`execl` thất bại và `perror` chạy, vì thư mục làm việc đã bị đổi trước lời gọi",
      "`log.txt` chỉ nhận danh sách thư mục gốc của chương trình chứ không phải `/usr/include`",
    ],
    answer: 1,
    explanation: "Mấu chốt là quy tắc \"file descriptor trống thấp nhất\": `close(1)` giải phóng slot 1, nên `open` ngay sau đó nhận đúng số 1 — tức stdout giờ trỏ vào `log.txt`. `puts` do đó ghi vào file; `chdir` đổi thư mục hiện tại; `execl` thay ảnh chương trình bằng `/bin/ls` (file descriptor được giữ nguyên qua exec) nên `ls .` liệt kê `/usr/include` cũng vào file đó. Phương án A là cách đọc tuần tự đầy trực giác — nó bỏ qua chuyện `open` âm thầm chiếm lại số 1. Dòng `perror` chỉ chạy nếu `exec` thất bại. (§4.6, §4.6.1)",
  },
  {
    id: "spq031",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 1,
    question: "Vì sao dùng mẫu fork-exec-wait thay vì gọi thẳng `exec` trong process hiện tại?",
    code: null,
    options: [
      "Vì `exec` không thể chạy nếu chương trình chưa gọi `fork` trước đó",
      "Vì `exec` thay ảnh process; `fork` giữ cho cha còn sống để giám sát",
      "Vì `fork` nhanh hơn `exec` rất nhiều nhờ cơ chế copy-on-write",
      "Vì theo POSIX mọi lời gọi `exec` đều bắt buộc phải đi kèm `wait`",
    ],
    answer: 1,
    explanation: "`exec` thay toàn bộ ảnh process: mọi dòng mã sau lời gọi đều bị thay bằng mã của chương trình mới, nên nếu gọi thẳng thì chương trình gốc biến mất. Fork trước cho ta một \"chương trình giám sát\" — process cha có thể chờ con, đọc mã thoát của nó, sửa trạng thái hệ thống hoặc chạy tiếp việc khác. Phương án A hấp dẫn vì fork và exec gần như luôn đi cùng nhau trong ví dụ, nhưng chúng độc lập: gọi `exec` một mình hoàn toàn hợp lệ, chỉ là process gọi sẽ không bao giờ quay lại. (§4.6, §4.7)",
  },
  {
    id: "spq032",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Vì sao sách khuyến khích học fork + exec + waitpid thay vì dùng `system()`?",
    code: {
      lang: "c",
      text: `int main(int argc, char **argv) {
  char *to_exec = asprintf("ls %s", argv[1]);
  system(to_exec);
}`,
    },
    options: [
      "Vì `system` không chặn nên khó biết lệnh đã chạy xong hay chưa",
      "Vì `system` sinh hẳn một shell diễn giải chuỗi — mở đường leo thang đặc quyền",
      "Vì `system` không dùng được biến môi trường `PATH` để tìm chương trình",
      "Vì `system` chỉ chạy được các lệnh dựng sẵn của shell chứ không chạy được file nhị phân",
    ],
    answer: 1,
    explanation: "`system(\"ls\")` tương đương `execl(\"/bin/sh\", \"/bin/sh\", \"-c\", ...)`: nó tạo một shell rồi giao nguyên chuỗi cho shell diễn giải. Với `argv[1] = \"; sudo su\"`, shell sẽ vui vẻ chạy luôn lệnh thứ hai — đúng định nghĩa leo thang đặc quyền. Phương án A đảo ngược sự thật và là hiểu lầm hay gặp: `system` **là** lời gọi chặn, process cha không tiếp tục cho tới khi lệnh thoát. Phương án C cũng sai theo chiều ngược lại — shell chuẩn **có** dùng `PATH`, đó lại là một lý do khiến `system` khó đoán. (§4.6.2)",
  },
  {
    id: "spq033",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Vì sao phải kiểm tra `WIFEXITED(status)` trước khi đọc `WEXITSTATUS(status)`?",
    code: {
      lang: "c",
      text: `pid_t pid = waitpid(child, &status, 0);

if (pid != -1 && WIFEXITED(status)) {
  int exit_status = WEXITSTATUS(status);
  printf("Process %d returned %d", pid, exit_status);
}`,
    },
    options: [
      "Vì `WEXITSTATUS` trả về -1 khi process bị kết thúc bởi một signal",
      "Vì các macro không tự kiểm tra tiền điều kiện; giá trị lấy ra sẽ vô nghĩa",
      "Vì `waitpid` có thể trả về ngay cả khi process con chưa thực sự đổi trạng thái",
      "Vì exit status chỉ có 8 bit nên phải tự dịch bit trước khi dùng",
    ],
    answer: 1,
    explanation: "`status` gói nhiều thông tin khác nhau — đã thoát, bị signal, hay bị dừng — và mỗi nhóm macro chỉ có nghĩa khi tiền điều kiện của nó đúng. Sách nói thẳng: các macro **sẽ không kiểm tra giúp chương trình**, lập trình viên phải tự đảm bảo logic. Muốn biết signal nào đã dừng process thì phải hỏi `WIFSTOPPED` trước rồi mới dùng `WSTOPSIG`. Phương án A giả định macro có một giá trị \"báo lỗi\" lịch sự — không hề có; đọc sai tiền điều kiện chỉ cho ra rác. (§4.5.1)",
  },
  {
    id: "spq034",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 3,
    question: "Vì sao gọi `printf` bên trong một signal handler là không an toàn?",
    code: null,
    options: [
      "Vì `printf` chậm, mà signal handler phải kết thúc trong vài mili-giây",
      "Vì `printf` dùng `malloc`; signal có thể chen vào lúc `malloc` đang dở dang",
      "Vì stdout bị khoá trong khi handler đang chạy nên `printf` sẽ block vĩnh viễn",
      "Vì signal handler chạy trong không gian kernel nên không gọi được hàm user space",
    ],
    answer: 1,
    explanation: "Vấn đề là tính **re-entrant**: hàm phải chịu được việc bị đóng băng giữa chừng rồi được gọi lại từ đầu. Sách nêu đích danh tình huống này — chương trình bị ngắt trong lúc đang thực thi mã thư viện của `malloc`, các cấu trúc bộ nhớ mà `malloc` dùng đang ở trạng thái không nhất quán, nên gọi `printf` (vốn dùng `malloc`) trong handler là không an toàn và dẫn tới hành vi không xác định. Phương án D là hiểu lầm về đặc quyền: handler chạy ngay trong chương trình ở user space — sách mô tả nó đúng như việc \"chương trình nhảy từ dòng đang được thực thi sang signal handler\". Cách an toàn là chỉ đặt một cờ `volatile sig_atomic_t` rồi để chương trình chính xử lý. (§13.3, §4.4.4)",
  },
  {
    id: "spq035",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 2,
    question: "Đoạn mã sau đúng về mặt logic nhưng vòng lặp vẫn có thể chạy mãi. Vì sao, và sửa thế nào?",
    code: {
      lang: "c",
      text: `int pleaseStop;

void handle_sigint(int signal) {
  pleaseStop = 1;
}

int main() {
  signal(SIGINT, handle_sigint);
  pleaseStop = 0;
  while (!pleaseStop) {
    /* application logic here */
  }
  /* clean up code here */
}`,
    },
    options: [
      "Vì `signal` không đăng ký được handler; phải dùng `sigaction`",
      "Vì trình biên dịch có thể tối ưu bỏ phép kiểm tra và giá trị bị cache trong thanh ghi",
      "Vì `pleaseStop` được hai chuỗi thực thi cùng chạm vào nên phải bọc bằng mutex",
      "Vì signal handler chạy trên một thread riêng nên nó ghi vào bản sao `pleaseStop` của thread đó",
    ],
    answer: 1,
    explanation: "Biểu thức `pleaseStop` không hề bị thay đổi trong thân vòng lặp, nên một số trình biên dịch rút gọn nó thành `while (1)`; ngoài ra giá trị có thể nằm lại trong thanh ghi thay vì được đọc từ bộ nhớ chính. `volatile` buộc đọc lại mỗi vòng, còn `sig_atomic_t` bảo đảm toàn bộ các bit được đọc/ghi như một thao tác không thể bị ngắt. Phương án A hấp dẫn vì sách **thật sự** khuyên dùng `sigaction` thay `signal` — nhưng đó là vấn đề khả chuyển của ngữ nghĩa handler, hoàn toàn không cứu được vòng lặp bị tối ưu. (§13.3)",
  },
  {
    id: "spq036",
    field: "sysprog",
    domain: "sp-process",
    difficulty: 1,
    question: "Cặp signal nào KHÔNG thể bị bắt bởi một signal handler?",
    code: null,
    options: [
      "`SIGINT` và `SIGQUIT`",
      "`SIGTERM` và `SIGSEGV`",
      "`SIGKILL` và `SIGSTOP`",
      "`SIGSEGV` và `SIGINT`",
    ],
    answer: 2,
    explanation: "Bảng signal POSIX trong sách ghi rõ `SIGKILL` là \"Terminate Process (Cannot be caught)\" và `SIGSTOP` là \"Stop Process (Cannot be caught)\" — đây là cách hệ thống bảo đảm luôn dừng hay giết được một process bất trị. Mọi signal còn lại trong các phương án kia đều không mang dấu đó: bảng ghi `SIGINT` và `SIGQUIT` là \"Can be caught\", còn chú thích trong phần gửi signal nói `kill(child, SIGTERM)` là thứ \"the child can prevent\" — đối lập với `SIGSTOP`, thứ \"the child cannot prevent\". `SIGSEGV` là cái dễ chọn nhầm nhất vì ta quen thấy nó làm sập chương trình — nhưng sập chỉ là **hành động mặc định**, và sách còn có chú thích rằng chương trình sập \"unless SIGSEGV is blocked\". Cũng vì `SIGKILL` không cho process kịp dọn dẹp mà sách khuyên gửi 15 trước rồi mới tính tới `kill -9`. (§13.1, §13.2, §3.6.3)",
  },

  // ===== sp-concurrency — Luồng & Đồng bộ hoá (spq037–spq060) =====
  {
    id: "spq037",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Trong ring buffer dưới đây, đảo thứ tự hai dòng đánh dấu sẽ dẫn tới điều gì?",
    code: {
      lang: "c",
      text: `void enqueue(int v) {
  sem_wait(&spacesem);           // (A)
  pthread_mutex_lock(&m);        // (B)
  b[(in++) & (N - 1)] = v;
  pthread_mutex_unlock(&m);
  sem_post(&countsem);
}`,
    },
    options: [
      "Không có gì thay đổi — hai nguyên thuỷ độc lập nên thứ tự nào cũng được",
      "Deadlock khi buffer đầy: thread ngủ ở `sem_wait` trong lúc vẫn giữ mutex",
      "Race condition trên biến `in` nhưng chương trình vẫn tiếp tục chạy được",
      "Buffer bị ghi tràn vì mất kiểm soát số phần tử đang có",
    ],
    answer: 1,
    explanation: "Nếu `lock` đứng trước `sem_wait`, một producer gặp buffer đầy sẽ **ngủ trong khi vẫn đang giữ mutex**. Consumer muốn lấy phần tử ra phải giành chính mutex đó → không ai đi tiếp được. Phương án \"race condition\" hấp dẫn vì cũng là lỗi đồng bộ, nhưng mutex vẫn bảo vệ `in` đúng — vấn đề nằm ở **thứ tự chờ**, không phải thiếu bảo vệ. Sách nêu quy tắc này khi phân tích một cài đặt hỏng: \"Thứ tự của mutex lock và `sem_wait` cần được hoán đổi\", tức luôn chờ tài nguyên TRƯỚC khi giành mutex, và để lại chính câu hỏi này ở cuối phần cài đặt đúng. (§7.8.3, §7.8.5)",
  },
  {
    id: "spq038",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Các thread trong cùng một process dùng chung những gì, và có riêng những gì?",
    code: null,
    options: [
      "Dùng chung stack, còn heap thì mỗi thread có riêng một cái",
      "Dùng chung không gian bộ nhớ ảo; mỗi thread có stack riêng",
      "Dùng chung mọi thứ, kể cả stack của từng thread",
      "Mỗi thread nhận một bản sao riêng của các biến toàn cục",
    ],
    answer: 1,
    explanation: "Các thread là một phần của cùng một process nên tất cả sống trong cùng một virtual memory: heap, biến toàn cục và mã đều nhìn thấy được từ mọi thread. Cái riêng là stack — thư viện pthread cấp phát một vùng stack rồi dùng `clone` để khởi động thread tại đó, nên gọi `pthread_create` hai lần thì process có ba stack. Phương án D là hiểu lầm mang từ mô hình process sang: process con sau `fork` mới có bản sao riêng của bộ nhớ, còn thread thì không — và đó chính là lý do phải bàn tới race condition. (§6.2, §6.4)",
  },
  {
    id: "spq039",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Với `data = 1` và hai thread cùng chạy `thread_main(&data)`, chương trình in ra gì?",
    code: {
      lang: "c",
      text: `void *thread_main(void *p) {
  int *p_int = (int *) p;
  int x = *p_int;
  x += x;
  *p_int = x;
  return NULL;
}`,
    },
    options: [
      "Luôn luôn 4 — mỗi thread nhân đôi giá trị của mình đúng một lần",
      "Có thể là 4, nhưng cũng có thể là 2 khi các lệnh đan xen — race condition",
      "Luôn luôn 2 vì hai thread luôn ghi đè lẫn nhau một cách tất định",
      "Lỗi biên dịch vì hai thread không được phép nhận cùng một con trỏ",
    ],
    answer: 1,
    explanation: "Không tối ưu hoá, phần cộng dịch thành ba lệnh: nạp giá trị, cộng, ghi lại. Nếu thread thứ hai nạp trước khi thread thứ nhất kịp ghi, cả hai cùng tính `1 + 1` và cùng ghi 2 — kết quả là 2 thay vì 4. Phương án A là điều chương trình **muốn** và thường xảy ra khi chạy thử, nên đây đúng là kiểu lỗi \"máy tôi chạy được\": kết quả phụ thuộc vào trình tự sự kiện do bộ xử lý quyết định, tức là không đơn định. (§6.5)",
  },
  {
    id: "spq040",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Biên dịch chính ví dụ `x += x` ở trên với `-O2`, gcc rút gọn phần cộng thành một lệnh assembly duy nhất `shl dword ptr [rdi]`. Điều đó có xoá được race condition không?",
    code: {
      lang: "nasm",
      text: `shl dword ptr [rdi]   ; cách tối ưu để thực hiện x += x`,
    },
    options: [
      "Có — một lệnh assembly duy nhất thì không thể bị đan xen",
      "Không — phần cứng vẫn có thể gặp race; cần thêm tiền tố `lock`",
      "Có, nhưng chỉ đúng trên máy chỉ có một lõi xử lý",
      "Không, vì `-O2` không bảo đảm lúc nào cũng sinh ra đúng lệnh này",
    ],
    answer: 1,
    explanation: "\"Một lệnh assembly\" **không** đồng nghĩa với \"nguyên tử\". Một lệnh như `add BYTE PTR [0x20], 1` hay `shl` vẫn gồm nhiều bước trên mạch: nạp từ RAM, tính, ghi ngược lại — hai bộ xử lý có thể cùng làm và một lần cộng bị mất. Muốn nguyên tử phải nói rõ với phần cứng bằng tiền tố `lock`, và cái giá là lệnh chạy chậm hơn, nên nó không được bật mặc định. Phương án A là hiểu lầm cốt lõi mà cả §2.1.2 lẫn §6.5 đều dựng lên để bác bỏ. Ta muốn một lời giải ở tầng phần mềm chứ không phải viết assembly. (§6.5, §2.1.1, §2.1.2)",
  },
  {
    id: "spq041",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Vòng lặp sau lẽ ra khởi động 10 thread với các số 0..9, nhưng lại in `1 7 8 8 8 8 8 8 8 10`. Vì sao?",
    code: {
      lang: "c",
      text: `void *myfunc(void *ptr) {
  int i = *((int *) ptr);
  printf("%d ", i);
  return NULL;
}

int main() {
  int i;
  pthread_t tid;
  for (i = 0; i < 10; i++) {
    pthread_create(&tid, NULL, myfunc, &i);   // ERROR
  }
  pthread_exit(NULL);
}`,
    },
    options: [
      "Vì `printf` không thread-safe nên đầu ra bị trộn lẫn",
      "Vì mọi thread nhận cùng con trỏ `&i`, mà `i` vẫn đang thay đổi",
      "Vì các thread chạy không theo đúng thứ tự được tạo ra",
      "Vì `pthread_create` thất bại ở một số vòng lặp nên vài giá trị bị bỏ qua",
    ],
    answer: 1,
    explanation: "Mỗi thread giải tham chiếu **cùng một địa chỉ**, và thread thường khởi động muộn hơn lời gọi tạo nó — trong đầu ra ví dụ, thread cuối cùng chạy sau khi vòng lặp đã kết thúc nên đọc được `i == 10`, một giá trị lẽ ra không bao giờ được truyền. Phương án C là điều đúng nhưng không đủ, và vì thế là bẫy hay nhất: chạy sai thứ tự chỉ giải thích được một hoán vị của 0..9, không giải thích nổi các giá trị trùng lặp lẫn số 10. Cách sửa của sách là truyền chính giá trị bằng cách ép kiểu `(void *) i`, hoặc cho mỗi thread một vùng dữ liệu riêng. (§6.5)",
  },
  {
    id: "spq042",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Trong hàm `main`, gọi `pthread_exit(NULL)` khác `exit(42)` ở điểm nào?",
    code: null,
    options: [
      "Không khác — cả hai đều kết thúc toàn bộ process ngay lập tức",
      "`pthread_exit` chỉ kết thúc thread gọi nó; `exit` kết thúc cả process",
      "`pthread_exit` chờ tất cả các thread rồi mới trả về từ `main` như bình thường",
      "`exit(42)` chỉ kết thúc thread chính, các thread còn lại vẫn chạy",
    ],
    answer: 1,
    explanation: "`pthread_exit` dừng thread đang gọi và không bao giờ quay lại; thư viện pthread chỉ kết thúc process khi không còn thread nào chạy — nên gọi nó trong `main` là cách phổ biến để các thread vừa tạo kịp hoàn thành. `exit()` thì thoát cả process, đặt mã thoát, và mọi thread bên trong đều bị dừng. Phương án C hấp dẫn vì kết quả **quan sát được** gần giống `pthread_join` cho tất cả — nhưng khác nhau ở chỗ `pthread_exit` không hề trả về, và các thread đã kết thúc sẽ ở dạng zombie. (§6.4)",
  },
  {
    id: "spq043",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Một server chạy lâu dài liên tục tạo thread nhưng không bao giờ gọi `pthread_join`. Hậu quả là gì?",
    code: null,
    options: [
      "Không sao — tài nguyên của thread luôn được giải phóng ngay khi hàm thread trả về xong",
      "Thread đã kết thúc vẫn giữ tài nguyên; tạo đủ nhiều thì `pthread_create` thất bại",
      "Chương trình sẽ deadlock ngay ở lần tạo thread thứ hai",
      "Giá trị trả về của mỗi thread bị rò rỉ trên heap, ngoài ra không ảnh hưởng gì",
    ],
    answer: 1,
    explanation: "`pthread_join` vừa chờ thread kết thúc vừa thu lại tài nguyên của nó. Không join thì thread đã kết thúc vẫn giữ tài nguyên — sách ví thẳng đây là \"biến các tiến trình con của bạn thành zombie\". Phương án A đúng cho một process ngắn hạn (mọi tài nguyên thread được giải phóng khi process thoát) và chính vì thế lỗi này thường không lộ ra khi chạy thử; sách nói rõ đây chỉ là vấn đề với process **chạy lâu dài**. (§6.4)",
  },
  {
    id: "spq044",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Đoạn mã sau có bảo vệ được biến `a` không?",
    code: {
      lang: "c",
      text: `int a;
pthread_mutex_t m1 = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t m2 = PTHREAD_MUTEX_INITIALIZER;

// Thread 1
pthread_mutex_lock(&m1);
a++;
pthread_mutex_unlock(&m1);

// Thread 2
pthread_mutex_lock(&m2);
a++;
pthread_mutex_unlock(&m2);`,
    },
    options: [
      "Có — mỗi thread đều khoá một mutex trước khi ghi vào `a`",
      "Không — mutex khoá mã chứ không khoá biến, mà đây là hai mutex khác nhau",
      "Có, miễn là `m1` và `m2` được khởi tạo trước khi tạo thread",
      "Không, vì `a` cần được khai báo `volatile` thì mutex mới thực sự có tác dụng",
    ],
    answer: 1,
    explanation: "Sách nói thẳng cạm bẫy này: \"mutex trong C không khoá biến\" — nó chỉ khiến một thread phải chờ khi thread khác đang giữ **chính mutex đó**. Ở đây hai thread giữ hai mutex khác nhau nên chẳng ai chờ ai, và ta có một mutex \"thực chất chẳng làm gì cả\". Phương án D là hiểu lầm rất dai dẳng: `volatile` là chỉ thị cho trình biên dịch về việc đọc lại giá trị, nó không tạo ra loại trừ lẫn nhau. Cách sửa là dùng cùng một mutex cho mọi đoạn mã chạm vào `a`. (§7.1.2)",
  },
  {
    id: "spq045",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Nỗ lực làm stack thread-safe dưới đây sai ở đâu?",
    code: {
      lang: "c",
      text: `pthread_mutex_t m1 = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t m2 = PTHREAD_MUTEX_INITIALIZER;

void push(double v) {
  pthread_mutex_lock(&m1);
  values[count++] = v;
  pthread_mutex_unlock(&m1);
}

double pop() {
  pthread_mutex_lock(&m2);
  double v = values[--count];
  pthread_mutex_unlock(&m2);
  return v;
}

int is_empty() {
  pthread_mutex_lock(&m1);
  return count == 0;
  pthread_mutex_unlock(&m1);
}`,
    },
    options: [
      "`push` và `pop` khoá hai mutex khác nhau, và `is_empty` `return` trước `unlock`",
      "`push` và `pop` đã đúng; chỉ thiếu kiểm tra stack đầy và stack rỗng",
      "`is_empty` không cần khoá vì chỉ đọc; sai duy nhất nằm ở `pop`",
      "`push` và `pop` cần dùng chung một mutex, còn `is_empty` thì đã hoàn toàn đúng",
    ],
    answer: 0,
    explanation: "Hai mutex khác nhau không loại trừ lẫn nhau: ba thread cùng `push` thì `m1` giữ trật tự, nhưng một `push` và một `pop` vẫn có thể chạy đồng thời và làm hỏng `count`. Lỗi thứ hai âm hiểm hơn nhiều vì nó **không lộ ra ngay**: `is_empty` trả về trước dòng `unlock`, nên mutex bị bỏ khoá vĩnh viễn — một thread khác gọi `push` sau đó sẽ kẹt một cách bí ẩn ở `lock`, tức là sơ suất ở một thread gây ra sự cố muộn hơn rất nhiều ở một thread bất kỳ khác. Sửa: dùng chung một mutex và lưu kết quả vào biến rồi mới `unlock` và `return`. (§7.3)",
  },
  {
    id: "spq046",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Lời giải ứng viên #2 cho bài toán vùng găng thoả mãn tính chất nào và vi phạm tính chất nào?",
    code: {
      lang: "text",
      text: `// Candidate #2
raise my flag
wait until your flag is lowered
// Do Critical Section stuff
lower my flag`,
    },
    options: [
      "Thoả mãn Mutual Exclusion nhưng deadlock khi cả hai cùng giương cờ — vi phạm Progress",
      "Vi phạm Mutual Exclusion vì cả hai thread có thể cùng đọc thấy cờ của bên kia đang hạ rồi cùng đi tiếp",
      "Thoả mãn cả ba tính chất Mutual Exclusion, Bounded Wait và Progress",
      "Thoả mãn Mutual Exclusion và Progress, chỉ vi phạm Bounded Wait vì một thread có thể bị vượt mặt vô hạn lần",
    ],
    answer: 0,
    explanation: "Giương cờ **trước** khi kiểm tra cờ đối phương đúng là đã đảm bảo Mutual Exclusion — không thể có hai thread cùng trong vùng găng. Nhưng nếu cả hai giương cờ gần như đồng thời, mỗi bên sẽ chờ bên kia hạ cờ và cả hai kẹt mãi mãi. Phương án B mô tả chính xác lỗi của ứng viên **#1** (`wait until your flag is lowered` rồi mới `raise my flag`) — đây là cặp dễ tráo nhất, và sự khác biệt chỉ nằm ở thứ tự hai dòng đầu. Hướng đi tiếp theo của sách là đưa thêm biến `turn` để phân định khi hoà. (§7.4, §7.4.1)",
  },
  {
    id: "spq047",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "`pthread_cond_wait(&cv, &m)` thực hiện ba hành động nào?",
    code: null,
    options: [
      "Khoá mutex, ngủ, rồi trả về với mutex vẫn đang bị khoá",
      "Mở khoá mutex, ngủ tới khi được signal, rồi khoá LẠI trước khi trả về",
      "Ngủ trước, sau đó khoá mutex, rồi mở khoá nó ra ngay",
      "Mở khoá mutex, ngủ, rồi trả về với mutex đang ở trạng thái mở khoá",
    ],
    answer: 1,
    explanation: "Mutex phải đang được khoá khi gọi `wait`; `wait` mở khoá nó (nhờ vậy thread khác mới vào được vùng găng để thay đổi điều kiện và đánh thức ta), ngủ, rồi **giành lại khoá trước khi trả về**. Chính hành động thứ ba làm nên tính đúng đắn của reader-writer và của barrier: dù nhiều thread cùng được broadcast đánh thức, chúng vẫn phải xếp hàng qua mutex nên chỉ một thread chạy trong vùng găng tại một thời điểm. Phương án D là hiểu lầm hay gặp nhất và dẫn thẳng tới lỗi mở khoá hai lần; nó cũng khiến người ta quên rằng `wait` phải nằm trong vòng `while`. (§7.7.4, §17.12)",
  },
  {
    id: "spq048",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Nỗ lực dùng condition variable cho `push` dưới đây sai ở đâu?",
    code: {
      lang: "c",
      text: `void push(stack_t *s, double v) {
  pthread_mutex_lock(&s->m);
  if (s->count == 0) pthread_cond_wait(&s->cv, &s->m);
  s->values[(s->count)++] = v;
  pthread_mutex_unlock(&s->m);
}`,
    },
    options: [
      "Điều kiện phải so với dung lượng; phải dùng `while`; và không ai signal",
      "Chỉ thiếu một lời gọi `pthread_cond_signal` ở cuối hàm `push`",
      "Mutex phải được mở khoá trước khi gọi `cond_wait`, ở đây nó đang khoá",
      "Phải thay `cond_wait` bằng `cond_broadcast` và bỏ hẳn mutex đi",
    ],
    answer: 0,
    explanation: "Ba lỗi độc lập: (1) `push` phải chờ khi stack **đầy**, nên điều kiện đúng là so với dung lượng chứ không phải so với 0 — đó là điều kiện của `pop`; (2) `wait` có thể tỉnh dậy giả (spurious wakeup) nên điều kiện phải được kiểm tra lại trong vòng `while`; (3) không hàm nào gọi `signal`/`broadcast` nên thread ngủ rồi không ai đánh thức. Phương án B chỉ thấy lỗi thứ ba và bỏ qua hai lỗi kia — nó hấp dẫn vì \"quên signal\" là lỗi nổi tiếng nhất khi dùng condition variable. Phương án C thì ngược hoàn toàn: mutex **phải** đang khoá khi gọi `cond_wait`. (§7.3, §7.2)",
  },
  {
    id: "spq049",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Spurious wakeup (thức dậy giả) là gì, và vì sao nó tồn tại?",
    code: null,
    options: [
      "Một lỗi của thư viện pthread, sẽ hết nếu nâng cấp lên libc mới",
      "Thread tỉnh dậy dù chưa có signal tương ứng — mã phải kiểm tra lại điều kiện",
      "Việc bộ lập lịch đánh thức thread để nó nhường CPU lại cho thread ưu tiên cao hơn",
      "Hệ quả của việc gọi `pthread_cond_broadcast` thay vì `pthread_cond_signal`",
    ],
    answer: 1,
    explanation: "Trên hệ nhiều CPU có thể xảy ra race khiến một yêu cầu đánh thức không được ghi nhận. Kernel không phát hiện được lời gọi bị mất đó, nhưng nó phát hiện được **khi nào chuyện đó có khả năng xảy ra**, và giải pháp rẻ nhất là đánh thức thread để chính mã chương trình kiểm tra lại điều kiện. Đây cũng là lý do `cond_wait` luôn phải nằm trong vòng `while`. Phương án A là phản xạ tự nhiên (\"chắc là bug\") nhưng sai bản chất: đây là hành vi được API cho phép, và sách còn liên hệ nó với thất bại giả của `atomic_compare_exchange_weak`. (§7.2, §7.1.4)",
  },
  {
    id: "spq050",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Lời giải reader-writer ứng viên #3 dùng `pthread_cond_signal`. Vì sao nên đổi sang `pthread_cond_broadcast`?",
    code: null,
    options: [
      "Vì `cond_signal` chỉ đánh thức MỘT thread, trong khi nhiều người đọc đang chờ",
      "Vì `cond_signal` không có tác dụng khi thread gọi nó đang giữ mutex",
      "Vì `cond_broadcast` nhanh hơn do không phải chọn thread nào để đánh thức",
      "Vì `cond_signal` có thể đánh thức nhầm một thread ghi thay vì thread đọc",
    ],
    answer: 0,
    explanation: "Bài toán reader-writer cho phép **nhiều** người đọc cùng hoạt động, nên khi người ghi xong ta muốn tất cả người đọc đang ngủ đều tỉnh dậy và tự kiểm tra điều kiện vòng `while` của mình. `cond_signal` chỉ giải phóng một thread, phần còn lại tiếp tục ngủ dù điều kiện đã cho phép chúng chạy. Phương án D nghe hợp lý vì mọi thread đều chờ trên cùng một condition variable, nhưng \"đánh thức nhầm\" không phải vấn đề: thread nào tỉnh dậy cũng phải kiểm tra lại điều kiện và ngủ tiếp nếu chưa tới lượt — điều thiếu ở đây đơn giản là số lượng thread được đánh thức. (§7.7.4)",
  },
  {
    id: "spq051",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Trong lời giải reader-writer mà người đọc chỉ chờ biến `writing`, một dòng người đọc liên tục gây ra hiện tượng gì, và sách sửa thế nào?",
    code: null,
    options: [
      "Deadlock giữa người đọc và người ghi; sửa bằng cách đảo thứ tự `lock`",
      "Người ghi bị bỏ đói vì `reading` không bao giờ về 0; thêm biến đếm `writers`",
      "Race condition trên `reading` vì nó được tăng ở ngoài vùng găng",
      "Người đọc bị bỏ đói vì người ghi luôn giành lại được khoá ngay sau khi xong",
    ],
    answer: 1,
    explanation: "Người ghi phải chờ tới khi `reading == 0`, nhưng nếu người đọc mới cứ đến liên tục thì bộ đếm ấy không bao giờ chạm 0 — người ghi chờ mãi. Đây là starvation, và nó chỉ lộ ra dưới tải nặng. Cách sửa là cấp cho người ghi tính chất Bounded Wait: người ghi tăng biến `writers` để **đăng ký ý định** ngay khi đến; người đọc đến sau đó thấy `writers != 0` sẽ phải chờ, còn người ghi chỉ cần chờ nốt những người đọc đang hoạt động. Phương án D đảo ngược nạn nhân — đó là hệ quả **sau khi** đã ưu tiên người ghi, chứ không phải vấn đề của ứng viên #3. (§7.7.5, §7.7.6)",
  },
  {
    id: "spq052",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Bản phác thảo barrier dưới đây có vấn đề gì?",
    code: {
      lang: "c",
      text: `// Global:
int remain = N;

// Sau khi làm xong phép tính #1:
remain--;
if (remain == 0) {
  /* Tôi là người cuối! Đánh thức mọi người */
} else {
  while (remain != 0) { /* spin spin spin */ }
}`,
    },
    options: [
      "`remain` phải khởi tạo bằng 0 rồi tăng dần lên N, chứ không phải ngược lại",
      "Phép giảm `remain` không nguyên tử, và vòng chờ là vòng lặp bận đốt CPU",
      "Chỉ cần đổi `while` thành `if` là đủ, phần còn lại đã đúng",
      "Thiếu `pthread_join` nên thread chính thoát trước khi các thread tới barrier",
    ],
    answer: 1,
    explanation: "`remain--` là đọc–sửa–ghi nên hai thread có thể đan xen và làm mất một lần giảm — khi đó bộ đếm không bao giờ chạm 0 và cả nhóm treo. Khiếm khuyết thứ hai là chờ bận: thread quay vòng đốt CPU thay vì ngủ. Sách sửa cả hai bằng một mutex bảo vệ `remain` và một condition variable, trong đó thread cuối cùng gọi `pthread_cond_broadcast` còn các thread khác `pthread_cond_wait` trong vòng `while`. Phương án C đi ngược hướng: vòng `while` là thứ **phải giữ lại** khi chuyển sang condition variable, vì spurious wakeup. (§7.7)",
  },
  {
    id: "spq053",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Vì sao barrier dựa trên bộ đếm `remain` không tái sử dụng được khi đặt trong một vòng lặp tính toán nhiều pha?",
    code: {
      lang: "c",
      text: `void barrier_wait(barrier *b) {
  pthread_mutex_lock(&b->m);
  if (b->remain == 0) b->remain = NUM_THREADS;
  b->remain--;
  if (b->remain == 0) {
    pthread_cond_broadcast(&cv);
  } else {
    while (b->remain != 0) {
      pthread_cond_wait(&cv, &m);
    }
  }
  pthread_mutex_unlock(&b->m);
}`,
    },
    options: [
      "Vì `pthread_cond_broadcast` chỉ có tác dụng đúng một lần trên mỗi condition variable",
      "Vì một thread nhanh có thể đặt lại `remain` trước khi các thread khác kịp tỉnh",
      "Vì mutex bị huỷ ngay sau lần broadcast đầu tiên nên lần sau vô hiệu",
      "Vì `pthread_barrier_wait` của POSIX chỉ hỗ trợ một lần chờ duy nhất",
    ],
    answer: 1,
    explanation: "Sách dựng lại đúng chuỗi sự kiện: nhiều thread đang chờ, thread cuối broadcast, **một** thread thoát khỏi vòng `while`, chạy nốt phép tính của nó nhanh tới mức quay lại barrier trước khi các thread kia kịp dậy, thấy `remain == 0` nên đặt lại bằng `NUM_THREADS` rồi ngủ — những thread lẽ ra phải tỉnh thì điều kiện `remain != 0` lại đúng trở lại, và cả nhóm deadlock. Phương án A là hiểu lầm về API (`broadcast` dùng lại được tuỳ ý); vấn đề nằm ở chỗ nhiều thread ở **hai vòng lặp khác nhau** cùng nhìn vào một bộ đếm. Gợi ý sửa của sách: bảo đảm các thread gọi `barrier_wait` đang ở cùng một vòng lặp. (§7.7)",
  },
  {
    id: "spq054",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Lời giải của Peterson thoả mãn cả ba tính chất của bài toán vùng găng. Vì sao ngày nay ta vẫn không cài đặt mutex phần mềm theo đúng cách này?",
    code: {
      lang: "text",
      text: `// Candidate #5 — Peterson (1981)
raise my flag
turn = other_thread_id
while (your flag is up and turn is other_thread_id)
    loop
// Do Critical Section stuff
lower my flag`,
    },
    options: [
      "Vì thuật toán chỉ đúng cho hai thread, không mở rộng lên N được",
      "Vì bộ xử lý thực thi lệnh không theo thứ tự (out-of-order)",
      "Vì biến `turn` phải là kiểu nguyên tử thì thuật toán mới đúng",
      "Vì nó vi phạm Bounded Wait khi có nhiều hơn hai thread tranh chấp",
    ],
    answer: 1,
    explanation: "Chứng minh của Peterson dựa vào việc các thao tác đọc và ghi xảy ra đúng thứ tự viết trong mã. Bộ xử lý hiện đại không bảo đảm điều đó — nó có thể sắp xếp lại lệnh — nên sách kết luận thẳng rằng ngày nay không cài đặt được mutex phần mềm theo cùng cách này và chỉ sang phụ lục để tìm lời giải. Phương án A đúng ở chỗ bản trình bày chỉ xét hai thread, và vì thế là bẫy hay nhất: giới hạn số thread là hạn chế của **bản mô tả**, còn thứ làm thuật toán hỏng trên phần cứng thật lại là out-of-order execution. Thực tế ta dùng lệnh atomic của phần cứng, ví dụ `lock cmpxchg` trên x86. (§7.5.1, §7.1.4)",
  },
  {
    id: "spq055",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Khác biệt then chốt giữa một binary semaphore và một mutex là gì?",
    code: null,
    options: [
      "Semaphore nhanh hơn mutex vì không phải theo dõi chủ sở hữu",
      "Semaphore cho thread khác `sem_post`; mutex chỉ chủ sở hữu mới mở khoá được",
      "Mutex đếm được nhiều hơn 1, còn semaphore thì chỉ có hai trạng thái",
      "Semaphore chỉ dùng được giữa các process chứ không dùng được giữa các thread",
    ],
    answer: 1,
    explanation: "Với semaphore, `wait` và `post` có thể đến từ hai thread khác nhau — chính đặc tính đó khiến nó dùng được cho bài toán chỗ trống/phần tử của ring buffer. Nhưng nó cũng khiến \"mutex giả lập bằng semaphore\" gãy: một thread bất kỳ gọi `sem_post` thêm một lần là hai thread cùng vào được vùng găng. Mutex xử lý tốt tình huống này (sách gọi là lock inversion) vì chỉ thread đã khoá mới được mở khoá. Phương án C nói ngược hoàn toàn: chính semaphore mới là thứ đếm được (counting semaphore); mutex đôi khi được gọi là binary semaphore vì nó chỉ có hai trạng thái. (§7.1.5)",
  },
  {
    id: "spq056",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Hàm nào dưới đây dùng được một cách đúng đắn bên trong một signal handler?",
    code: {
      lang: "c",
      text: `sem_t s;

void handler(int signal) {
  /* ??? */
}

void *singsong(void *param) {
  sem_wait(&s);
  printf("Waiting until a signal releases...\\n");
  return NULL;
}`,
    },
    options: [
      "`pthread_mutex_unlock` để nhả khoá",
      "`sem_post` để tăng semaphore",
      "`printf` để in thông báo",
      "Cả ba đều dùng được vì đều thuộc thư viện chuẩn",
    ],
    answer: 1,
    explanation: "`sem_post` là một trong số ít hàm có thể dùng đúng đắn trong signal handler; `pthread_mutex_unlock` thì không. Đây chính là mẫu thiết kế mà sách trình bày: handler chỉ gọi `sem_post` để giải phóng một thread đang chờ, và thread đó — chạy ngoài ngữ cảnh handler — mới được phép gọi những hàm bị cấm trong handler như `printf`. Phương án C là hàm dễ chọn nhầm nhất và cũng là ví dụ kinh điển về hàm **không** an toàn: `printf` dùng `malloc` nên có thể bắt gặp cấu trúc bộ nhớ đang dở dang. (§7.1.5, §13.3)",
  },
  {
    id: "spq057",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 3,
    question: "Cài đặt ring buffer sau bị hỏng. Chuyện gì thực sự xảy ra khi các thread gọi `enqueue` và `dequeue`?",
    code: {
      lang: "c",
      text: `void init() {
  p_m_init(&lock, NULL);
  sem_init(&s1, 0, 16);
  sem_init(&s2, 0, 0);
}

enqueue(void *value) {
  p_m_lock(&lock);
  sem_wait(&s1);
  b[(in++) & (N - 1)] = value;
  sem_post(&s1);
  p_m_unlock(&lock);
}

void *dequeue() {
  p_m_lock(&lock);
  sem_wait(&s2);
  void *result = b[(out++) & (N - 1)];
  sem_post(&s2);
  p_m_unlock(&lock);
  return result;
}`,
    },
    options: [
      "Hoạt động đúng nhưng chậm vì giữ mutex quá lâu trong critical section",
      "Mỗi hàm wait rồi post trên CÙNG một semaphore: `enqueue` overflow, `dequeue` kẹt",
      "Vấn đề duy nhất là thiếu loại trừ lẫn nhau, gây race trên `in` và `out`",
      "Underflow xảy ra vì `out` có thể vượt qua `in` khi buffer rỗng",
    ],
    answer: 1,
    explanation: "Lỗi gốc là mỗi hàm giảm rồi tăng ngay **chính semaphore của mình**, nên tới cuối hàm giá trị không hề thay đổi — hai semaphore mất hẳn vai trò đếm chỗ trống và đếm phần tử. Hệ quả: `s1` khởi tạo 16 và không bao giờ giảm về 0 → `enqueue` không chặn khi buffer đầy, ghi đè dữ liệu; `s2` khởi tạo 0 nên `dequeue` chặn ngay ở lời gọi đầu tiên và không bao giờ trả về. Phương án C là thứ đập vào mắt trước tiên (thứ tự `lock` rồi `sem_wait` quả thật cần đảo lại), nhưng ở đây mutex vẫn bảo vệ `in` và `out` — sách nhận xét rằng ví dụ này hỏng đến mức lỗi thứ tự chẳng còn kịp gây tác dụng. (§7.8.2, §7.8.3)",
  },
  {
    id: "spq058",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Cài đặt ring buffer thứ hai dưới đây sai ở những chỗ nào?",
    code: {
      lang: "c",
      text: `void *b[16];
int in = 0, out = 0;
p_m_t lock;              // không hề khởi tạo
sem_t s1, s2;

void init() {
  sem_init(&s1, 0, 16);
  sem_init(&s2, 0, 0);
}

enqueue(void *value) {
  sem_wait(&s2);
  p_m_lock(&lock);
  b[(in++) & (N - 1)] = value;
  p_m_unlock(&lock);
  sem_post(&s1);
}

void *dequeue() {
  sem_wait(&s1);
  p_m_lock(&lock);
  void *result = b[(out++) & (N - 1)];
  p_m_unlock(&lock);
  sem_post(&s2);
  return result;
}`,
    },
    options: [
      "Hai semaphore bị gán ngược vai trò, và `lock` chưa bao giờ được khởi tạo",
      "Chỉ cần đổi tên hai semaphore cho nhau là đoạn mã hoàn toàn đúng",
      "Buffer overflow sau 16 phần tử vì không ai so `in` với `out`",
      "`in` và `out` tràn số nguyên sau bốn tỷ thao tác nên chỉ số quay về 0 sai",
    ],
    answer: 0,
    explanation: "Hai semaphore bị gán ngược vai trò: `enqueue` chờ trên semaphore đếm **phần tử** (khởi tạo 0) nên chặn ngay dù buffer rỗng, còn `dequeue` chờ trên semaphore đếm **chỗ trống** (khởi tạo 16) nên đi thẳng vào và trả về dữ liệu không hợp lệ. Vấn đề thứ ba dễ bỏ sót nhất: đoạn mã **trông như** có dùng mutex, nhưng `lock` chưa bao giờ được khởi tạo bằng `pthread_mutex_init()` hay `PTHREAD_MUTEX_INITIALIZER` nên nó có thể đơn giản là không làm gì. Phương án D nêu một cạm bẫy có thật của ring buffer, nhưng nó thuộc về dạng viết `b[(in++) % N]`; ở đây mặt nạ bit `& (N-1)` với N là luỹ thừa của hai đã xử lý đúng chuyện tràn số. (§7.8.4, §7.8.1)",
  },
  {
    id: "spq059",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 1,
    question: "Dạng viết gọn sau của `enqueue` chứa một lỗi tinh vi. Đó là gì, và dạng gọn đúng ra sao?",
    code: {
      lang: "c",
      text: `// N là dung lượng của buffer
void enqueue(void *value) {
  b[(in++) % N] = value;
}`,
    },
    options: [
      "Phép `%` chậm; nên dùng `& (N-1)` để chương trình chạy nhanh hơn",
      "`in` tràn số nguyên sau hơn bốn tỷ lần; dạng đúng dùng mặt nạ `& (N-1)`",
      "`in++` bên trong chỉ số mảng là hành vi không xác định trong C",
      "Phải dùng tiền tố `++in` thay cho hậu tố `in++` thì chỉ số mới tính đúng",
    ],
    answer: 1,
    explanation: "Giá trị `int` của `in` sẽ tràn sau khoảng bốn tỷ lần enqueue và quay về 0, khi đó phần tử có thể rơi vào `b[0]` thay vì ô đáng lẽ phải tới. Dạng gọn đúng dùng mặt nạ bit, với điều kiện N là luỹ thừa của hai (16, 32, 64, ...). Phương án A là bẫy tinh vi vì nó dẫn tới **đúng đoạn mã sửa lỗi** nhưng vì **lý do sai**: sách không đề xuất mặt nạ bit để tăng tốc mà để chương trình vẫn đúng khi bộ đếm tràn. Lưu ý cả hai dạng đều chưa ngăn được ghi đè khi buffer đầy — việc đó thuộc về semaphore. (§7.8.1)",
  },
  {
    id: "spq060",
    field: "sysprog",
    domain: "sp-concurrency",
    difficulty: 2,
    question: "Chương trình tạo một `pthread_mutex_t` rồi mới `fork`. Process cha và process con có thực sự dùng chung mutex đó không?",
    code: null,
    options: [
      "Có — mutex nằm trong bộ nhớ được process con thừa kế nên hai bên khoá cùng một đối tượng",
      "Không — mỗi bên có một mutex riêng; phải đặt nó trong bộ nhớ chia sẻ",
      "Có, miễn là mutex được khai báo ở phạm vi toàn cục chứ không phải trên heap",
      "Không, và mutex về nguyên tắc không thể dùng để đồng bộ giữa các process",
    ],
    answer: 1,
    explanation: "Process con và process cha **không chia sẻ bộ nhớ ảo**: mutex được nhân bản cùng phần bộ nhớ còn lại, nên mỗi bên khoá một bản riêng và chẳng bên nào chờ bên kia. Phương án A và C hấp dẫn vì \"con thừa kế bộ nhớ của cha\" đúng là chuyện có thật — nhưng thừa kế một **bản sao** thì khác hẳn dùng chung, và phạm vi toàn cục không thay đổi điều đó. Cách làm đúng của sách là `mmap` một đoạn bộ nhớ chia sẻ rồi `pthread_mutex_init` mutex trong đó, sau khi đã `pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED)`. Barrier, semaphore và condition variable cũng dùng được theo cách này. (§7.9.2)",
  },
];
