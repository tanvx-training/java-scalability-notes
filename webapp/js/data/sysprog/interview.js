// Ngân hàng câu hỏi phỏng vấn Lập trình hệ thống — 24 câu,
// 6 chủ đề × 4 cấp độ năng lực.
//
// Nguồn: bản dịch tiếng Việt "System Programming" (UIUC CS 241 / CS 341).
//
// LƯU Ý: khoá học đã có 100 câu trắc nghiệm ở questions-part1/2.js với các
// khoá DOMAINS riêng (sp-c, sp-process, ...). Ngân hàng này dùng khoá
// INTERVIEW_TOPICS riêng biệt (spiq-*) để không lẫn hai hệ phân loại.
//
// Thang cấp độ và HỢP ĐỒNG THEO CẤP giống hệt ngân hàng JPA.
//
// GIỮ NGUYÊN id (sysprog-iq01–sysprog-iq24).

export const sysprogInterview = [

  // ===== spiq-c (sysprog-iq01–sysprog-iq04) =====
  {
    id: "sysprog-iq01",
    field: "sysprog",
    topic: "spiq-c",
    level: 1,
    minutes: 5,
    question: "Phân biệt bộ nhớ stack và heap trong C theo **thời gian sống**. Vì sao trả về con trỏ tới biến cục bộ là lỗi?",
    mustCover: [
      "Biến tự động (biến cục bộ) chỉ gắn với bộ nhớ stack **trong thời gian sống của hàm**",
      "Hàm trả về thì vùng nhớ đó hết hiệu lực; tiếp tục dùng nó là lỗi",
      "Bộ nhớ heap do `malloc` cấp thì sống tới khi ta gọi `free` — thời gian sống do **ta** quyết định",
      "Nên khi cần trả dữ liệu ra ngoài hàm, dữ liệu phải ở heap, hoặc do bên gọi cấp sẵn",
      "Biến `static` là ngoại lệ: nó không nằm trên stack nên trả con trỏ tới nó hợp lệ — dù không thread-safe",
      "C **không** kiểm tra con trỏ có hợp lệ hay không, nên lỗi này thường **không** làm chương trình sập ngay",
      "Đó là điều làm nó nguy hiểm: vùng nhớ đã bị tái sử dụng, nên dữ liệu đọc ra có thể vẫn \"đúng\" một thời gian",
      "Biến tự động và vùng heap mới cấp đều chứa **rác**, không được giả định là đã bằng không",
    ],
    model: "Tôi phân biệt hai vùng này bằng câu hỏi thời gian sống, vì đó là điều quyết định mọi lỗi liên quan. Biến tự động — biến cục bộ của một hàm — chỉ gắn với bộ nhớ stack trong thời gian sống của hàm đó. Khi hàm trả về, vùng nhớ ấy hết hiệu lực và sẽ được tái sử dụng cho lời gọi hàm tiếp theo. Bộ nhớ heap thì khác về bản chất: nó sống từ lúc `malloc` tới lúc ta gọi `free`, nghĩa là thời gian sống do ta quyết định chứ không do phạm vi cú pháp. Từ đó suy ra quy tắc thực dụng: khi cần trả dữ liệu ra ngoài hàm, dữ liệu đó phải nằm ở heap, hoặc bên gọi phải cấp sẵn bộ đệm và truyền vào. Vì sao trả con trỏ tới biến cục bộ là lỗi thì đã rõ theo lập luận trên — con trỏ đó trỏ tới một vùng nhớ không còn thuộc về ai. Có một ngoại lệ đáng biết: biến `static` không nằm trên stack, nên trả con trỏ tới nó là hợp lệ về mặt thời gian sống; nhưng tôi sẽ nêu kèm rằng nó dùng chung giữa mọi lời gọi, nên nó không thread-safe và hai lời gọi liên tiếp sẽ ghi đè nhau. Điều tôi muốn nhấn nhất, và là lý do lớp lỗi này tốn nhiều thời gian nhất trong thực tế: C không kiểm tra con trỏ có hợp lệ hay không. Nên trả con trỏ tới biến cục bộ thường **không** làm chương trình sập ngay — vùng nhớ vẫn đọc được, và nếu chưa có lời gọi hàm nào ghi lên đó thì dữ liệu thậm chí vẫn đúng. Chương trình chạy đúng trong kiểm thử, rồi sai ở môi trường thực tế khi luồng thực thi khác đi. Nói cách khác, hành vi không xác định không có nghĩa là hành vi sai ngay; nó có nghĩa là ta mất quyền dự đoán. Một điểm cùng họ tôi luôn kèm: cả biến tự động lẫn vùng heap vừa được cấp đều chứa rác — những mẫu bit tình cờ có sẵn — nên giả định chúng bằng không là một lỗi, và cũng là một lỗi hay đúng trong kiểm thử rồi sai về sau.",
    redFlags: [
      "Cho rằng trả con trỏ tới biến cục bộ sẽ làm chương trình sập ngay, nên dễ phát hiện",
      "Không biết `static` nằm ngoài stack",
      "Giả định bộ nhớ mới cấp đã bằng không",
      "Nói heap sống tới khi chương trình kết thúc",
    ],
    probes: [
      "Vì sao lỗi này thường qua được kiểm thử?",
      "Trả con trỏ tới biến `static` có nhược điểm gì?",
      "Ba cách để một hàm trả dữ liệu ra ngoài là gì?",
    ],
    refs: ["sysprog-03", "sysprog-05"],
  },
  {
    id: "sysprog-iq02",
    field: "sysprog",
    topic: "spiq-c",
    level: 2,
    minutes: 9,
    code: {
      lang: "c",
      text: `typedef struct { char name[100]; int id; } user_t;

user_t *make_user(const char *name, int id) {
    user_t *u = malloc(sizeof(u));              // (1)
    strcpy(u->name, name);                      // (2)
    u->id = id;
    return u;
}

char *dup_label(const char *s) {
    char *copy = malloc(strlen(s));             // (3)
    strcpy(copy, s);
    return copy;
}

void report(user_t *u) {
    char *label = dup_label(u->name);
    printf("%s\\n", label);
    free(label);
    free(u);
    printf("id=%d\\n", u->id);                   // (4)
    free(u);                                    // (5)
}

int main(void) {
    int n = 10, arr[10];
    for (int i = n; i >= 0; i--) arr[i] = i;    // (6)
    user_t *u = make_user("alice", 1);
    report(u);
}`,
    },
    question: "Đoạn mã này biên dịch không cảnh báo và \"chạy được\" trên máy của tác giả. Chỉ ra từng lỗi và sửa.",
    mustCover: [
      "Dòng (1): `sizeof(u)` là kích thước một **con trỏ**, không phải kích thước struct — phải là `sizeof(user_t)` hoặc `sizeof(*u)`",
      "Nên struct 104 byte được cấp 8 byte; mọi lần ghi vào nó làm hỏng bộ nhớ",
      "Dòng (2): `strcpy` không kiểm giới hạn, nên `name` dài hơn 99 ký tự làm **tràn bộ đệm** — dùng `snprintf` hoặc kiểm độ dài trước",
      "Dòng (3): chuỗi cần **`strlen(s) + 1`** byte vì phải có byte NUL kết thúc",
      "Thiếu một byte nghĩa là `strcpy` ghi byte NUL ra ngoài vùng cấp — sai đúng một byte, và đó là lỗi kinh điển",
      "Dòng (4): đọc `u->id` **sau** khi `free(u)` — con trỏ treo, dữ liệu có thể vẫn đúng nên lỗi rất khó thấy",
      "Dòng (5): `free` hai lần cùng một vùng — lỗi double free",
      "Sửa hai dòng đó: chuyển `free(u)` xuống **sau** lần dùng cuối, và chỉ gọi một lần; gán `u = NULL` sau khi giải phóng",
      "Dòng (6): `i` bắt đầu từ `n` = 10, nên nó ghi `arr[10]` — **ngoài biên** mảng 10 phần tử; phải bắt đầu từ `n - 1`",
      "Và không kiểm `malloc` trả `NULL` ở cả hai chỗ",
      "Điều chung của cả sáu lỗi: C không kiểm tra gì, nên \"chạy được\" **không** là bằng chứng đúng",
    ],
    model: "Sáu lỗi, và tôi sắp theo mức nghiêm trọng chứ theo thứ tự dòng, vì có cái làm hỏng bộ nhớ ngay từ dòng đầu. Dòng (1) là lỗi nặng nhất: `sizeof(u)` là kích thước của một con trỏ, tức 8 byte trên hệ thống 64 bit, còn `user_t` cần 104 byte. Nên ta cấp 8 byte rồi ghi 104 byte vào đó — mọi lần ghi sau đó làm hỏng vùng nhớ của người khác, kể cả siêu dữ liệu của bộ cấp phát. Cách viết tôi ưa là `sizeof(*u)` vì nó không bao giờ lệch khi kiểu đổi. Dòng (2) là lỗi bảo mật: `strcpy` không kiểm giới hạn, nên một `name` dài hơn 99 ký tự tràn ra ngoài trường `name`. Đây đúng là lớp lỗi đã sinh ra những lỗ hổng nổi tiếng nhất, và cách sửa là dùng một hàm có giới hạn — `snprintf` với kích thước đích — hoặc kiểm độ dài trước khi sao. Dòng (3) là lỗi sai đúng một byte: mọi chuỗi C cần `strlen(s) + 1` byte, vì byte NUL kết thúc không được `strlen` tính. Cấp thiếu một byte nghĩa là `strcpy` ghi byte NUL ra ngoài vùng cấp phát, và vì chỉ một byte nên nó thường không sập — nó chỉ làm hỏng một byte ở đâu đó. Dòng (4) và (5) là cặp lỗi về thời gian sống. Dòng (4) đọc `u->id` sau khi `u` đã được giải phóng; con trỏ treo, và vì vùng nhớ chưa bị tái dùng thì giá trị có thể vẫn đúng — nên đây là lỗi chạy đúng trong kiểm thử rồi sai lúc có tải. Dòng (5) giải phóng lần thứ hai, tức double free, và cái này thì phá siêu dữ liệu của bộ cấp phát nên nó có thể sập ở một chỗ hoàn toàn không liên quan. Sửa cả hai: chuyển `free(u)` xuống sau lần dùng cuối và gọi đúng một lần, rồi gán `u = NULL` — đặt con trỏ về `NULL` sau khi giải phóng là thói quen tôi luôn giữ, vì nó biến một lỗi im lặng thành một lần sập rõ ràng. Dòng (6) là lỗi vòng lặp cơ bản nhưng đáng nói: `i` bắt đầu từ `n` tức 10, và `arr[10]` nằm ngoài mảng mười phần tử; phải bắt đầu từ `n - 1`. Và một lỗi không nằm ở dòng nào cả: không chỗ nào kiểm `malloc` trả `NULL`. Điều chung của cả sáu và là bài học tôi muốn nói ra: C không kiểm tra biên, không kiểm tra thời gian sống, không kiểm tra kích thước. Nên \"biên dịch không cảnh báo và chạy được trên máy tôi\" không phải bằng chứng nào về tính đúng — nó chỉ có nghĩa là chưa có gì hỏng đủ to để thấy. Đó là lý do với mã C tôi luôn chạy thêm công cụ kiểm bộ nhớ động và bật cảnh báo ở mức cao, chứ không dựa vào việc chương trình chạy qua.",
    redFlags: [
      "Bỏ sót `sizeof(u)` — lỗi nặng nhất trong đoạn mã",
      "Sửa `malloc(strlen(s))` thành một con số cố định lớn thay vì `strlen(s) + 1`",
      "Chỉ bỏ một trong hai lời gọi `free` mà không chuyển thứ tự so với dòng (4)",
      "Thay `strcpy` bằng `strncpy` mà không xử lý trường hợp không có byte NUL kết thúc",
      "Kết luận đoạn mã ổn vì nó chạy được",
    ],
    probes: [
      "Vì sao lỗi sai một byte ở dòng (3) lại khó phát hiện hơn một lỗi tràn lớn?",
      "`strncpy` có thực sự an toàn hơn không, và vì sao?",
      "Bạn dùng công cụ nào để những lỗi này lộ ra khi chạy?",
    ],
    refs: ["sysprog-03"],
  },
  {
    id: "sysprog-iq03",
    field: "sysprog",
    topic: "spiq-c",
    level: 3,
    minutes: 10,
    question: "Bạn viết bộ cấp phát cho một ứng dụng cụ thể. Chọn first-fit, best-fit, hay một arena vứt bỏ được?",
    tradeoffs: [
      {
        option: "First-fit (danh sách sắp theo địa chỉ)",
        when: "Mặc định hợp lý. Không phải quét hết heap nên nhanh, và khảo sát thực nghiệm cho thấy nó hoạt động gần như tốt ngang best-fit **khi có ngưỡng tách khối và có gộp khối**.",
      },
      {
        option: "Best-fit",
        when: "Khi muốn giảm phân mảnh ngoài nhất có thể. Nhưng nó có thể sinh ra những mảnh vụn quá nhỏ để dùng, nên cần một ngưỡng tách; trường hợp xấu nhất của nó tệ, dù ít xảy ra.",
      },
      {
        option: "Arena cấp phát rồi vứt cả khối",
        when: "Khi vòng đời cấp phát theo **pha** — nạp một màn chơi, xử lý một request, phân tích một tài liệu. Không `free` từng phần, chỉ trả cả arena. Nhanh nhất và không phân mảnh; đổi lại nó chỉ đúng khi mọi thứ trong pha chết cùng lúc.",
      },
    ],
    mustCover: [
      "Câu hỏi phân định đầu tiên: **hồ sơ cấp phát** của ứng dụng — kích thước, tần suất, và vòng đời",
      "Không có chiến lược nào thắng phổ quát: cả phân mảnh lẫn hiệu năng đều phụ thuộc hồ sơ đó",
      "Hồ sơ cấp phát **đánh giá được nhưng không dự đoán được**, nên phải đo chứ không suy luận",
      "Và kể cả biết trước toàn bộ yêu cầu thì đây vẫn là bài toán cái túi — **NP-hard**",
      "Phân biệt hai loại phân mảnh: **trong** (phần dư trong khối đã cấp) và **ngoài** (đủ tổng byte nhưng không có khối liên tục đủ lớn)",
      "First-fit không cần quét hết heap; best-fit cũng có thể dừng sớm khi gặp khối vừa khít trong ngưỡng",
      "Khảo sát thực nghiệm: best-fit và first-fit sắp theo địa chỉ hoạt động **gần như tốt ngang nhau** khi có ngưỡng tách và gộp khối",
      "Nên tranh luận first-fit hay best-fit thường không phải chỗ đáng dồn sức",
      "Chỗ đáng dồn sức là **arena**: nếu vòng đời theo pha, nó thắng cả hai rất xa",
      "Vì nó biến chi phí `free` thành gần như bằng không và khử hẳn phân mảnh trong pha",
      "Đổi lại arena chỉ đúng khi mọi vùng cấp trong pha **chết cùng lúc** — một đối tượng sống dài hơn pha là một lỗi",
      "Và một bộ cấp phát chuyên dụng thường vượt trội bộ cấp phát đa dụng, nhưng chỉ trong điều kiện nó được thiết kế cho",
    ],
    model: "Câu hỏi đầu tiên tôi hỏi không phải về thuật toán mà về hồ sơ cấp phát của ứng dụng: kích thước các vùng cấp, tần suất, và quan trọng nhất là vòng đời của chúng. Lý do là không có chiến lược nào thắng phổ quát — cả phân mảnh lẫn hiệu năng đều phụ thuộc vào hồ sơ đó, và hồ sơ ấy là thứ đánh giá được bằng đo lường nhưng không dự đoán được bằng suy luận. Còn một lập luận lý thuyết đáng nêu để hạ kỳ vọng: kể cả nếu ta biết trước toàn bộ chuỗi yêu cầu, việc xếp chúng tối ưu vẫn là bài toán cái túi, tức NP-hard. Nên mục tiêu không phải tìm chiến lược tối ưu mà tìm chiến lược đủ tốt cho hồ sơ của mình. Trước khi so các chiến lược, tôi tách hai loại phân mảnh vì chúng cần biện pháp khác nhau: phân mảnh trong là phần dư nằm bên trong một khối đã cấp — xảy ra khi ta không tách khối, hoặc tách nhưng làm tròn lên; phân mảnh ngoài là tình huống tổng số byte trống đủ nhưng không có khối **liên tục** nào đủ lớn. Về first-fit so với best-fit, tôi sẽ trả lời bằng kết quả thực nghiệm thay vì trực giác. Trực giác nói best-fit giảm phân mảnh vì nó chọn khối khít nhất, nhưng chính điều đó sinh ra những mảnh vụn quá nhỏ để dùng lại — nên nó cần một ngưỡng, dưới ngưỡng thì không tách. Và khảo sát cho thấy khi đã có ngưỡng tách cùng với việc gộp khối trống liền kề, best-fit và first-fit sắp theo địa chỉ hoạt động gần như tốt ngang nhau, trên cả tải mô phỏng lẫn tải thực. Tôi rút ra kết luận thực dụng từ đó: tranh luận first-fit hay best-fit thường không phải chỗ đáng dồn sức, còn **có ngưỡng tách và có gộp khối** thì là. Nếu phải chọn một, tôi lấy first-fit sắp theo địa chỉ, vì nó không cần quét hết heap và việc sắp theo địa chỉ làm việc gộp khối liền kề trở nên tự nhiên. Chỗ thực sự đáng dồn sức là câu hỏi thứ ba, và nó không phải một chiến lược đặt chỗ: nếu vòng đời cấp phát của ứng dụng theo **pha** thì một arena thắng cả hai rất xa. Trò chơi điện tử nạp một màn chơi, một server xử lý một request, một trình phân tích đọc một tài liệu — trong những trường hợp đó, ta cấp liên tục về phía trước, không `free` từng phần, rồi trả cả khối khi pha kết thúc. Chi phí của `free` gần như bằng không, không có danh sách khối trống nào để duyệt, và không có phân mảnh nào trong pha. Cái giá phải nói rõ và nó là điều kiện duy nhất: arena chỉ đúng khi mọi vùng cấp trong pha chết cùng lúc. Một đối tượng sống dài hơn pha là một lỗi con trỏ treo, và là lỗi im lặng — nên khi chọn arena tôi phải rất rõ đâu là ranh giới pha. Nói rộng hơn, đây là một trường hợp của nguyên tắc mà tôi thấy đúng nhiều lần: một bộ cấp phát chuyên dụng thường vượt trội hẳn bộ cấp phát đa dụng, nhưng chỉ trong điều kiện nó được thiết kế cho — nên việc đầu tiên vẫn là biết điều kiện của mình.",
    redFlags: [
      "Khẳng định best-fit luôn giảm phân mảnh tốt hơn first-fit",
      "Không phân biệt phân mảnh trong và phân mảnh ngoài",
      "Không nói tới ngưỡng tách khối và việc gộp khối",
      "Chọn arena mà không nêu điều kiện mọi thứ phải chết cùng lúc",
      "Tự viết bộ cấp phát khi chưa đo hồ sơ cấp phát của ứng dụng",
    ],
    probes: [
      "Vì sao best-fit lại có thể làm phân mảnh tệ hơn?",
      "Việc gộp khối trống liền kề quan trọng đến mức nào so với chọn chiến lược?",
      "Một đối tượng sống dài hơn arena biểu hiện ra sao khi chạy?",
    ],
    refs: ["sysprog-05"],
  },
  {
    id: "sysprog-iq04",
    field: "sysprog",
    topic: "spiq-c",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ C chạy liên tục nhiều ngày. Bộ nhớ mà hệ điều hành cấp cho tiến trình tăng đều — từ 180 MB lên 2,1 GB trong 6 ngày — rồi tiến trình bị kill. Công cụ kiểm rò rỉ bộ nhớ chạy 4 giờ dưới tải mô phỏng báo **không có rò rỉ nào**: mọi vùng `malloc` đều được `free`.",
      scale: "Xử lý khoảng 40 request/giây. Mỗi request cấp phát một bộ đệm kích thước thay đổi từ 200 byte tới 4 MB tuỳ kích thước dữ liệu đầu vào. Tiến trình bị kill 3 lần trong 2 tuần, mỗi lần mất khoảng 12 phút phục vụ.",
      constraints: "Không đổi ngôn ngữ. Không thêm máy. Phải phân biệt được rò rỉ bộ nhớ thật với nguyên nhân khác, vì đội đang định bỏ hai tuần đi tìm rò rỉ.",
      },
    question: "Công cụ nói không rò rỉ mà bộ nhớ vẫn tăng. Giải thích được không? Bạn đo gì để phân định, và sửa thế nào?",
    mustCover: [
      "Kết luận đầu tiên: hai dữ kiện **không** mâu thuẫn — \"mọi `malloc` đều được `free`\" không kéo theo \"bộ nhớ trả về hệ điều hành\"",
      "Giả thuyết chính: **phân mảnh ngoài** trong heap, không phải rò rỉ",
      "Cơ chế: các vùng cấp có kích thước rất khác nhau (200 byte đến 4 MB) xen kẽ nhau theo thời gian",
      "Khi một khối lớn được giải phóng nhưng có khối nhỏ còn sống nằm giữa, khoảng trống bị chia cắt",
      "Nên tổng byte trống lớn mà **không có khối liên tục** đủ cho yêu cầu 4 MB tiếp theo → phải xin thêm từ hệ thống",
      "Và heap chỉ trả bộ nhớ về hệ điều hành khi phần trống nằm ở **đỉnh** heap — một khối nhỏ còn sống ở trên giữ lại toàn bộ phần dưới",
      "Đó là lý do bộ nhớ tăng **một chiều** và không bao giờ giảm",
      "Vì sao công cụ không báo: nó đo vùng cấp **chưa được giải phóng**, còn đây là vùng đã giải phóng mà không dùng lại được",
      "Và 4 giờ dưới tải mô phỏng có thể không sinh ra đúng mẫu hình xen kẽ kích thước cần thiết",
      "Đo để phân định: so **tổng byte đang cấp phát** (từ đếm của chính ứng dụng) với **bộ nhớ hệ điều hành cấp cho tiến trình**",
      "Nếu byte đang cấp phát phẳng mà bộ nhớ tiến trình tăng → phân mảnh; nếu cả hai cùng tăng → rò rỉ thật",
      "Đó là một dự đoán cụ thể, phân định được hai giả thuyết, và nó rẻ hơn hai tuần đi tìm rò rỉ",
      "Sửa: tách các vùng cấp **lớn** ra khỏi heap chung — cấp riêng và trả riêng cho hệ điều hành",
      "Hoặc gom các vùng cấp theo lớp kích thước, để vùng nhỏ và vùng lớn không xen kẽ nhau",
      "Hoặc dùng **arena theo request**: mọi thứ của một request chết cùng lúc, nên trả cả khối là hết phân mảnh",
      "Và khởi động lại theo lịch là biện pháp tình thế hợp lý trong lúc sửa, nhưng phải gọi đúng tên nó",
    ],
    model: "Điều đầu tiên tôi muốn nói là hai dữ kiện không mâu thuẫn nhau, và việc nhìn ra điều đó tiết kiệm cho đội hai tuần. \"Mọi vùng `malloc` đều được `free`\" là một phát biểu về mã của ta; nó không kéo theo \"bộ nhớ được trả về hệ điều hành\". Giữa hai điều đó là bộ cấp phát, và giả thuyết chính của tôi là phân mảnh ngoài chứ không phải rò rỉ. Cơ chế thì khớp rất chặt với dữ kiện về kích thước. Các vùng cấp trong dịch vụ này trải từ 200 byte tới 4 MB và xen kẽ nhau theo thời gian. Khi một bộ đệm 4 MB được giải phóng, khoảng trống đó chỉ dùng lại được cho một yêu cầu 4 MB nếu nó còn liên tục — nhưng nếu trong lúc nó còn sống đã có vài vùng cấp nhỏ được đặt xen vào và những vùng nhỏ đó sống lâu hơn, thì khoảng trống bị chia thành các mảnh nhỏ. Tổng byte trống vẫn lớn, mà không có khối liên tục nào đủ cho yêu cầu 4 MB tiếp theo, nên bộ cấp phát phải xin thêm bộ nhớ từ hệ thống. Cộng thêm một tính chất nữa giải thích vì sao con số chỉ đi một chiều: heap thường chỉ trả bộ nhớ về hệ điều hành khi phần trống nằm ở **đỉnh** heap; một vùng cấp nhỏ còn sống nằm gần đỉnh sẽ giữ lại toàn bộ phần bên dưới nó. Nên bộ nhớ tiến trình tăng đều và không bao giờ giảm, đúng như quan sát, và cuối cùng bị kill. Về việc công cụ không báo gì, tôi thấy đó là hành vi đúng của công cụ chứ không phải khiếm khuyết: nó đo những vùng cấp **chưa được giải phóng** lúc chương trình kết thúc, còn ở đây mọi vùng đều đã được giải phóng — chúng chỉ không dùng lại được. Thêm nữa, bốn giờ dưới tải mô phỏng có thể không sinh ra đúng mẫu hình xen kẽ kích thước cần thiết; phân mảnh là hiện tượng phụ thuộc vào **trình tự** cấp và giải phóng, nên một tải đồng đều thường không tái hiện được nó. Về cách phân định, tôi muốn một phép đo cho câu trả lời dứt khoát chứ không phải thêm một cuộc tìm kiếm. Tôi cho ứng dụng tự đếm tổng số byte đang được cấp phát — cộng khi `malloc`, trừ khi `free` — rồi vẽ nó cùng với lượng bộ nhớ hệ điều hành cấp cho tiến trình. Hai đường này phân định hai giả thuyết một cách sạch sẽ: nếu byte đang cấp phát phẳng trong khi bộ nhớ tiến trình tăng, đó là phân mảnh; nếu cả hai cùng tăng thì đúng là rò rỉ và đội nên đi tìm. Đây là việc của một buổi chiều, và nó quyết định có nên bỏ hai tuần hay không. Tôi cũng sẽ xin số liệu từ chính bộ cấp phát nếu nền tảng cung cấp — tổng byte của các khối trống so với khối lớn nhất trong số đó là phép đo trực tiếp của phân mảnh ngoài. Về cách sửa, nguyên tắc chung là đừng để vùng cấp lớn và vùng cấp nhỏ nằm xen kẽ trong cùng một heap. Cụ thể, hướng đơn giản nhất là tách các vùng cấp lớn ra: những bộ đệm vài MB được xin riêng từ hệ điều hành và trả riêng, nên chúng không bao giờ để lại lỗ trong heap chung — nhiều bộ cấp phát làm việc này sẵn theo một ngưỡng, và điều chỉnh ngưỡng đó có thể là cả thay đổi cần thiết. Hướng thứ hai là gom cấp phát theo lớp kích thước, để mỗi lớp có vùng riêng và một khối trống luôn dùng lại được cho yêu cầu cùng lớp. Hướng tôi ưa nhất nếu thiết kế cho phép là arena theo request: mọi vùng cấp của một request chết cùng lúc khi request kết thúc, nên ta trả cả khối và bài toán phân mảnh biến mất thay vì được quản lý. Điều kiện của nó là không có đối tượng nào sống dài hơn request, và đó là điều tôi phải kiểm trước khi đề xuất. Cuối cùng, trong lúc sửa, khởi động lại theo lịch trước khi bộ nhớ đạt ngưỡng là biện pháp hợp lý — nó đổi một lần gián đoạn có kiểm soát cho một lần bị kill không kiểm soát. Nhưng tôi sẽ gọi đúng tên nó là biện pháp tình thế, và nói rõ rằng nó che mất tín hiệu, nên phải giữ phép đo ở trên để biết việc sửa thật có tiến triển hay không.",
    redFlags: [
      "Kết luận công cụ kiểm rò rỉ sai và đi tìm rò rỉ trong hai tuần",
      "Chấp nhận khởi động lại theo lịch như lời giải cuối cùng",
      "Cho rằng `free` luôn trả bộ nhớ về hệ điều hành",
      "Đề nghị chuyển ngôn ngữ, trái ràng buộc",
      "Không đo tách tổng byte đang cấp phát khỏi bộ nhớ tiến trình",
      "Chạy lại công cụ kiểm rò rỉ lâu hơn và coi đó là bước tiếp theo",
    ],
    probes: [
      "Hai đường số liệu của bạn phân định hai giả thuyết như thế nào?",
      "Vì sao tải mô phỏng đồng đều khó tái hiện phân mảnh?",
      "Arena theo request cần điều kiện gì, và bạn kiểm nó ra sao?",
    ],
    refs: ["sysprog-05", "sysprog-03"],
  },

  // ===== spiq-process (sysprog-iq05–sysprog-iq08) =====
  {
    id: "sysprog-iq05",
    field: "sysprog",
    topic: "spiq-process",
    level: 1,
    minutes: 5,
    question: "Phân biệt zombie và tiến trình mồ côi. Cái nào nguy hiểm hơn, và tiến trình cha phải làm gì?",
    mustCover: [
      "**Zombie** sinh ra khi một tiến trình con **kết thúc** mà tiến trình cha chưa `wait` nó",
      "Nó vẫn chiếm một chỗ trong bảng tiến trình của kernel, giữ PID, trạng thái, và cách nó bị kết thúc",
      "Cách duy nhất để loại bỏ zombie là tiến trình cha `wait` các con",
      "**Mồ côi** là con mà cha đã chết trước; chúng được gán lại cho `init` — tiến trình PID 1",
      "Nên `getppid()` của một tiến trình mồ côi trả về 1",
      "Mồ côi rốt cuộc cũng kết thúc và trong chốc lát thành zombie, nhưng `init` **tự động `wait`** mọi con của nó",
      "Vì thế zombie nguy hiểm hơn: mồ côi được thu dọn tự động, còn zombie thì không",
      "Hậu quả cụ thể: một tiến trình cha chạy lâu dài không `wait` con có thể **mất khả năng `fork`**",
      "Nhưng không phải lúc nào cũng cần `wait` ngay — cha có thể tiếp tục chạy, miễn là cuối cùng thu dọn",
    ],
    model: "Hai thứ này ngược chiều nhau về mặt ai chết trước, và đó là cách nhớ chắc nhất. Zombie sinh ra khi tiến trình **con** kết thúc trước mà tiến trình cha chưa `wait` nó. Con đã chết thật, nhưng nó vẫn chiếm một chỗ trong bảng tiến trình của kernel, giữ PID cùng với trạng thái và thông tin về cách nó kết thúc. Lý do kernel giữ lại phần đó là để tiến trình cha còn cơ hội đọc mã thoát của con, nên zombie không phải một khiếm khuyết mà là một trạng thái có chủ ý — nó chỉ trở thành vấn đề khi không ai đọc. Cách duy nhất để loại bỏ zombie là tiến trình cha `wait` các con của mình. Mồ côi thì ngược: tiến trình **cha** chết trước, để lại các con. Khi đó kernel gán những con đó cho `init`, tiến trình đầu tiên có PID 1 — nên một dấu hiệu nhận ra tiến trình mồ côi là `getppid()` của nó trả về 1. Những tiến trình mồ côi đó rốt cuộc cũng kết thúc và trong chốc lát trở thành zombie, nhưng `init` tự động `wait` mọi con của nó, nên chúng được thu dọn ngay. Về câu hỏi cái nào nguy hiểm hơn, tôi trả lời dứt khoát là zombie, và chính vì lý do vừa nêu: mồ côi có một cơ chế thu dọn tự động còn zombie thì không — nó tồn tại chừng nào tiến trình cha còn sống mà không `wait`. Hậu quả cụ thể và là chỗ tôi muốn nêu rõ: bảng tiến trình là tài nguyên hữu hạn, nên một tiến trình cha chạy lâu dài mà không `wait` con sẽ tích luỹ zombie và cuối cùng **mất khả năng `fork`**. Đó là một dạng cạn tài nguyên tăng dần, nên nó không hỏng ngay mà hỏng sau nhiều giờ hay nhiều ngày — đúng kiểu khó chẩn đoán. Một sắc thái tôi muốn thêm để câu trả lời không thành giáo điều: không phải lúc nào cũng cần `wait` ngay sau khi `fork`. Tiến trình cha hoàn toàn có thể tiếp tục làm việc của nó và không chờ con — điều bắt buộc chỉ là cuối cùng phải thu dọn, và trong thực tế cách làm phổ biến là thu dọn không đồng bộ khi kernel báo có con kết thúc, thay vì chặn lại chờ.",
    redFlags: [
      "Đảo ngược hai khái niệm",
      "Cho rằng zombie tiêu tốn bộ nhớ hay CPU đáng kể",
      "Nói tiến trình mồ côi là vấn đề nghiêm trọng hơn zombie",
      "Cho rằng bắt buộc phải `wait` ngay sau mỗi `fork`",
    ],
    probes: [
      "Vì sao kernel lại giữ lại chỗ trong bảng tiến trình cho một tiến trình đã chết?",
      "Bạn thu dọn con mà không chặn tiến trình cha bằng cách nào?",
      "Zombie tích luỹ biểu hiện ra sao khi đã đầy bảng tiến trình?",
    ],
    refs: ["sysprog-04"],
  },
  {
    id: "sysprog-iq06",
    field: "sysprog",
    topic: "spiq-process",
    level: 2,
    minutes: 10,
    code: {
      lang: "c",
      text: `int main(void) {
    FILE *f = fopen("input.txt", "r");      // tệp có 3 dòng: A, B, C
    char *line = NULL;
    size_t cap = 0;

    printf("bat dau\\n");                    // (1) stdout đang được đệm

    while (getline(&line, &cap, f) != -1) {
        printf("doc: %s", line);            // (2)
        pid_t p = fork();                   // (3)
        if (p == 0) {
            process_line(line);
            exit(0);                        // (4)
        }
        // (5) cha không wait
    }
    fclose(f);
    return 0;
}

// Chạy và chuyển hướng ra tệp:  ./prog > out.txt
// out.txt chứa "bat dau" 4 lần và "doc: A" 3 lần. Và ps thấy 3 zombie.`,
    },
    question: "Ba hiện tượng: dòng đầu in 4 lần, dòng A in 3 lần, và 3 zombie. Giải thích từng cái rồi sửa.",
    mustCover: [
      "\"bat dau\" in 4 lần: dòng (1) ghi vào bộ đệm của `stdout`, chưa đẩy ra vì đầu ra là **tệp** nên nó được đệm theo khối",
      "`fork` nhân bản **toàn bộ không gian bộ nhớ**, kể cả bộ đệm chưa đẩy — nên mỗi con mang một bản sao của nội dung đó",
      "Mỗi con `exit` thì bộ đệm của nó được đẩy ra, nên chuỗi đó được ghi thêm 3 lần",
      "Khi chạy ra terminal thì `stdout` đệm theo dòng, nên lỗi **không xuất hiện** — đó là lý do nó qua được kiểm thử",
      "Sửa: `fflush(stdout)` **trước** `fork`, hoặc chỉ ghi bằng `write` không đệm",
      "\"doc: A\" in 3 lần: chỉ **file descriptor** được nhân bản, không phải *file description*",
      "Nên cha và con dùng chung một description, tức chung cả vị trí đọc trong tệp",
      "Vị trí đọc bị các tiến trình cùng dịch chuyển, và bộ đệm của `FILE*` cũng bị nhân bản — đây là **hành vi không xác định**",
      "Quy tắc: mọi file descriptor phải được **chuẩn bị** trước khi `fork`, và không được dùng đồng thời ở hai bên",
      "Sửa: `fflush(f)` trước `fork`, rồi để con `fclose(f)` và không đọc tệp; hoặc đọc hết tệp trước khi `fork`",
      "3 zombie: dòng (5) không `wait`, nên mỗi con kết thúc để lại một chỗ trong bảng tiến trình",
      "Sửa: `wait` sau mỗi vòng, hoặc thu dọn không đồng bộ khi kernel báo con kết thúc",
    ],
    model: "Ba hiện tượng, ba cơ chế khác nhau, và hai trong ba chỉ xuất hiện khi chuyển hướng ra tệp — nên đoạn mã này gần như chắc chắn đã qua kiểm thử trên terminal. Hiện tượng thứ nhất, \"bat dau\" in 4 lần, là chuyện đệm đầu ra. Khi `stdout` là một tệp, nó được đệm theo khối, nên `printf` ở dòng (1) chỉ ghi vào bộ đệm trong bộ nhớ chứ chưa đẩy ra. Rồi `fork` nhân bản toàn bộ không gian bộ nhớ của tiến trình, và bộ đệm chưa đẩy nằm trong đó — nên mỗi tiến trình con mang theo một bản sao của chuỗi ấy. Khi con gọi `exit`, bộ đệm của nó được đẩy, và ta có thêm một lần ghi. Ba con cộng với cha là bốn lần. Chi tiết đáng nói nhất: khi chạy ra terminal thì `stdout` đệm theo dòng nên nó đã được đẩy ngay ở dòng (1), và hiện tượng này không xuất hiện. Đó là một lỗi mà môi trường quyết định biểu hiện, nên kiểm thử trên terminal không bao giờ bắt được. Sửa thì `fflush(stdout)` trước `fork`, hoặc dùng `write` không đệm cho những chỗ ghi quanh `fork`. Hiện tượng thứ hai đòi một phân biệt kỹ thuật mà tôi thấy rất đáng nắm: khi `fork`, chỉ **file descriptor** được nhân bản, còn *file description* — cái struct mà descriptor trỏ tới, nơi giữ vị trí đọc hiện tại — thì được dùng chung. Nên cha và các con đều đọc trên cùng một vị trí, và họ dịch chuyển vị trí đó của nhau. Cộng thêm việc bộ đệm của `FILE*` cũng bị nhân bản, tình huống này là hành vi không xác định chứ không chỉ là kết quả lạ — nên \"doc: A\" ba lần chỉ là một trong nhiều biểu hiện có thể. Quy tắc đúng là mọi file descriptor phải được chuẩn bị trước khi `fork`: nếu là descriptor thô hay `FILE*` không đệm thì đã sẵn sàng; nếu là `FILE*` mở để đọc và đã đọc hết thì cũng sẵn sàng; ngược lại phải `fflush` hoặc đóng. Và sau khi chuẩn bị, nó phải không được dùng đồng thời ở cả hai bên — một bên đọc, ghi, hoặc gọi `exit` đều tính là đang dùng. Với đoạn mã này, cách sửa gọn nhất là `fflush(f)` trước `fork` và cho con `fclose(f)` ngay rồi không chạm vào tệp nữa; cách sửa tôi ưa hơn về thiết kế là đọc toàn bộ tệp vào bộ nhớ trước, rồi mới `fork` cho từng dòng — khi đó không có file handle nào bị chia sẻ và cả lớp vấn đề biến mất. Hiện tượng thứ ba là ba zombie, và nó đơn giản nhất: dòng (5) không `wait`, nên mỗi con kết thúc để lại một chỗ trong bảng tiến trình. Với đoạn mã ba dòng thì vô hại, nhưng nếu đây là một vòng lặp chạy mãi thì nó tích luỹ tới lúc tiến trình không `fork` được nữa. Sửa thì hoặc `wait` sau mỗi vòng — đơn giản nhưng làm việc xử lý thành tuần tự — hoặc thu dọn không đồng bộ khi kernel báo có con kết thúc, giữ được tính song song. Với vòng lặp có `fork` tôi cũng sẽ thêm một giới hạn số con đang sống, vì `fork` trong vòng lặp không giới hạn là hình dạng của một fork bomb dù không ai có ý đó.",
    redFlags: [
      "Kết luận `printf` hay `getline` có lỗi",
      "Chỉ thêm `wait` và coi hai hiện tượng kia là ngẫu nhiên",
      "Gọi `fflush(stdout)` trong tiến trình con thay vì trước `fork`",
      "Không phân biệt file descriptor và file description",
      "Kết luận đoạn mã đúng vì trên terminal nó chạy đúng",
    ],
    probes: [
      "Vì sao chạy ra terminal thì lỗi đệm không xuất hiện?",
      "Cha và con dùng chung vị trí đọc gây ra những biểu hiện nào khác?",
      "`wait` trong vòng lặp có nhược điểm gì, và bạn thay bằng gì?",
    ],
    refs: ["sysprog-04"],
  },
  {
    id: "sysprog-iq07",
    field: "sysprog",
    topic: "spiq-process",
    level: 3,
    minutes: 10,
    question: "Cần chạy song song một công việc có thể sập hoặc chạy mã không tin cậy. Dùng thread, `fork`, hay `fork` rồi `exec`?",
    tradeoffs: [
      {
        option: "Thread",
        when: "Khi công việc **tin cậy** và cần chia sẻ dữ liệu nhiều. Rẻ nhất để tạo và giao tiếp qua bộ nhớ chung. Nhưng không có cách ly nào: một lỗi bộ nhớ trong thread làm hỏng cả tiến trình, và một lần sập giết tất cả.",
      },
      {
        option: "`fork`",
        when: "Khi cần **cách ly lỗi** nhưng vẫn muốn chung mã và trạng thái ban đầu. Con sập thì cha sống. Đổi lại: giao tiếp phải qua IPC, và con thừa hưởng mọi file descriptor cùng bộ đệm chưa đẩy của cha.",
      },
      {
        option: "`fork` rồi `exec`",
        when: "Khi mã **không tin cậy**, hoặc khi công việc là một chương trình khác. Không gian bộ nhớ được thay hoàn toàn, nên không thừa hưởng trạng thái nào. Chỗ duy nhất áp được giới hạn tài nguyên và thu hẹp đặc quyền một cách sạch sẽ.",
      },
    ],
    mustCover: [
      "Trục phân định: mức **cách ly** cần thiết, và nó tương ứng với mức không tin cậy của công việc",
      "Thread chia sẻ toàn bộ không gian bộ nhớ, nên không có cách ly lỗi nào — một lỗi bộ nhớ hỏng cả tiến trình",
      "`fork` cho cách ly bộ nhớ: con sập thì cha sống, và đó là lý do chính để chọn nó",
      "Nhưng `fork` **thừa hưởng** mọi file descriptor của cha, nên mã trong con vẫn chạm được những gì cha mở",
      "Con cũng thừa hưởng bộ đệm chưa đẩy, nên phải chuẩn bị file descriptor trước khi `fork`",
      "Với mã không tin cậy thì `fork` một mình **không đủ** — con vẫn có mã và trạng thái của ta",
      "`exec` thay hoàn toàn không gian bộ nhớ, nên nó cắt sạch mọi thứ thừa hưởng ngoài file descriptor",
      "Nên giữa `fork` và `exec` là chỗ duy nhất đóng được descriptor không cần, hạ đặc quyền, và đặt giới hạn tài nguyên",
      "Đó là lập luận quyết định cho mã không tin cậy: chỉ ở đó ta ràng buộc được cái gì nó chạm tới",
      "Và phải `wait` con dù chọn đường nào, nếu không tích luỹ zombie",
      "Chi phí: thread rẻ nhất, `fork` đắt hơn, `fork`+`exec` đắt nhất — nhưng chi phí đó thường không phải trục quyết định",
    ],
    model: "Tôi phân định bằng một trục duy nhất: cần bao nhiêu cách ly? Và độ cách ly cần thiết gần như trùng khớp với mức tin cậy của công việc. Thread thì không có cách ly nào, vì mọi thread chia sẻ toàn bộ không gian bộ nhớ của tiến trình. Điều đó là ưu điểm khi công việc cần chia sẻ dữ liệu nhiều — giao tiếp chỉ là đọc ghi bộ nhớ chung, và tạo thread rẻ. Nhưng nó cũng có nghĩa là một lỗi bộ nhớ trong bất kỳ thread nào cũng làm hỏng dữ liệu của mọi thread khác, và một lần sập giết cả tiến trình. Với đề bài nói rõ công việc \"có thể sập\", thread bị loại ngay, vì cái giá của một lần sập là toàn bộ dịch vụ. `fork` cho tôi cách ly bộ nhớ: con có không gian riêng, nên nó sập mà cha vẫn sống và có thể ghi nhận rồi thử lại. Đó là lý do chính để chọn nó, và với một công việc chỉ *có thể sập* nhưng vẫn là mã của ta thì `fork` là lựa chọn đúng. Nhưng tôi sẽ nêu rõ hai thứ mà con thừa hưởng, vì chúng là nguồn của những lỗi khó thấy: con thừa hưởng mọi file descriptor đang mở của cha, nghĩa là mã trong con chạm được những tệp và socket cha đã mở; và con thừa hưởng cả bộ đệm chưa đẩy, nên phải chuẩn bị các file descriptor — `fflush` hoặc đóng — trước khi `fork`, nếu không ta rơi vào hành vi không xác định và những triệu chứng như đầu ra bị nhân bản. Với phần thứ hai của đề bài — mã **không tin cậy** — tôi sẽ nói thẳng rằng `fork` một mình không đủ, và đây là chỗ nhiều người dừng lại quá sớm. Sau `fork`, tiến trình con vẫn mang mã của ta, trạng thái của ta, và mọi descriptor của ta; một đoạn mã có ý xấu chạy trong đó vẫn đọc được những gì cha mở và vẫn có mọi đặc quyền của cha. `exec` mới là thứ cắt sạch: nó thay hoàn toàn không gian bộ nhớ bằng chương trình mới, nên không có mã hay dữ liệu nào của ta còn lại. Và lập luận quyết định của tôi là về khoảng giữa hai lời gọi đó: sau `fork` và trước `exec` là chỗ duy nhất ta còn quyền điều khiển tiến trình con trong khi mã không tin cậy chưa chạy — đó là nơi đóng những descriptor không cần, hạ đặc quyền xuống một người dùng ít quyền, đặt giới hạn tài nguyên về bộ nhớ, CPU và số tệp, và đổi thư mục làm việc. Không có khoảng đó thì không có cách nào ràng buộc được cái mà mã kia chạm tới. Nên câu trả lời của tôi là: công việc tin cậy cần chia sẻ dữ liệu thì thread; công việc của ta nhưng có thể sập thì `fork`; mã không tin cậy thì `fork` rồi `exec`, và phần giá trị nhất nằm ở những gì ta làm giữa hai lời gọi đó. Cuối cùng, đúng với cả ba đường: phải thu dọn con sau khi nó kết thúc, nếu không zombie tích luỹ và cuối cùng ta mất khả năng `fork`. Còn về chi phí thì thread rẻ nhất và `fork`+`exec` đắt nhất, nhưng tôi ít khi để chi phí đó quyết định — với một công việc đáng cách ly thì chênh lệch vài trăm micro giây gần như không bao giờ là trục quan trọng.",
    redFlags: [
      "Dùng thread cho công việc có thể sập",
      "Cho rằng `fork` một mình đủ để cách ly mã không tin cậy",
      "Không nói tới việc con thừa hưởng file descriptor",
      "Bỏ qua khoảng giữa `fork` và `exec` như chỗ áp giới hạn",
      "Quên thu dọn tiến trình con",
    ],
    probes: [
      "Bạn làm những gì giữa `fork` và `exec`, cụ thể?",
      "Con thừa hưởng descriptor của cha gây rủi ro gì với mã không tin cậy?",
      "Nếu công việc cần trao đổi nhiều dữ liệu mà vẫn cần cách ly thì bạn làm sao?",
    ],
    refs: ["sysprog-04", "sysprog-14"],
  },
  {
    id: "sysprog-iq08",
    field: "sysprog",
    topic: "spiq-process",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một dịch vụ chạy liên tục, mỗi yêu cầu nó `fork` một tiến trình con để chuyển đổi tệp. Sau khoảng 26 giờ hoạt động, dịch vụ bắt đầu trả lỗi cho **mọi** yêu cầu; log ghi `fork: Resource temporarily unavailable`. Khởi động lại thì nó chạy tốt thêm 26 giờ nữa. Bộ nhớ và CPU của tiến trình đều bình thường, đĩa còn nhiều.",
      scale: "Khoảng 1.200 yêu cầu/giờ. Giới hạn số tiến trình cho người dùng chạy dịch vụ là 32.768. Dịch vụ đã chạy như vậy 8 tháng; sự cố chỉ xuất hiện sau khi một bản phát hành 3 tuần trước \"tối ưu độ trễ\".",
      constraints: "Không được khởi động lại theo lịch như lời giải — dịch vụ phải chạy liên tục. Phải giải thích được vì sao đúng 26 giờ và vì sao chỉ xảy ra sau bản phát hành đó. Phải chỉ ra nguyên nhân trước khi đọc mã của bản phát hành, dựa trên số liệu.",
      },
    question: "Bạn suy ra nguyên nhân từ những con số nào? Nêu phép tính, chẩn đoán, và cách sửa để nó không tái diễn.",
    mustCover: [
      "`fork` thất bại với lỗi đó nghĩa là đã đạt **giới hạn số tiến trình**, không phải hết bộ nhớ",
      "Phép tính khớp: 1.200 tiến trình/giờ × 26 giờ ≈ 31.200, rất sát giới hạn 32.768",
      "Nên mỗi tiến trình con **để lại một chỗ** trong bảng tiến trình và không bao giờ được thu dọn — đó là zombie tích luỹ",
      "Bộ nhớ và CPU bình thường là bằng chứng **ủng hộ**: zombie không tiêu bộ nhớ hay CPU, chỉ chiếm một chỗ",
      "Nên \"không phải rò rỉ bộ nhớ\" là điều phép đo nói, không phải điều làm chẩn đoán khó hơn",
      "Vì sao sau bản phát hành: rất có thể \"tối ưu độ trễ\" đã **bỏ lời gọi `wait`** để không chặn tiến trình cha",
      "Đó là một tối ưu có lý về độ trễ và sai về vòng đời — nó đổi một lần chờ cho một chỗ bị giữ mãi",
      "Dự đoán kiểm chứng được **trước khi đọc mã**: `ps` phải thấy khoảng 31.000 tiến trình ở trạng thái zombie",
      "Và số zombie phải **tăng đều theo thời gian hoạt động**, tỉ lệ với số yêu cầu đã xử lý",
      "Nếu số đó khớp thì chẩn đoán xác nhận mà không cần đọc dòng mã nào",
      "Sửa đúng: thu dọn con **không đồng bộ** — cha được kernel báo khi con kết thúc rồi `wait` ở đó, nên không chặn",
      "Cách đó giữ được lợi ích về độ trễ mà bản phát hành muốn, nên nó không phải quay lui",
      "Hoặc dùng kỹ thuật `fork` hai lần, để con được `init` nhận và tự động thu dọn",
      "Thêm phòng tuyến: đếm số con đang sống và phát cảnh báo khi nó vượt ngưỡng — vì đây là tài nguyên cạn dần",
      "Bài học: một tối ưu bỏ đi một lời gọi phải được hỏi \"lời gọi đó đang giữ bảo đảm nào?\"",
    ],
    model: "Tôi bắt đầu từ chính thông điệp lỗi vì nó đã hẹp: `fork` thất bại với \"Resource temporarily unavailable\" nghĩa là đã đạt giới hạn số tiến trình, chứ không phải hết bộ nhớ — hai nguyên nhân đó cho thông điệp khác nhau. Rồi phép tính khớp gần như hoàn hảo: 1.200 yêu cầu mỗi giờ, mỗi yêu cầu một `fork`, nhân với 26 giờ là khoảng 31.200, rất sát giới hạn 32.768. Nghĩa là mỗi tiến trình con để lại đúng một chỗ trong bảng tiến trình và không chỗ nào được thu hồi — đó là zombie tích luỹ, và nó giải thích luôn vì sao con số 26 giờ lặp lại sau mỗi lần khởi động lại. Hai dữ kiện \"bộ nhớ bình thường\" và \"CPU bình thường\" thì tôi đọc là bằng chứng ủng hộ chứ không phải điều gây khó: một zombie là một tiến trình đã chết, nó không giữ bộ nhớ và không dùng CPU, nó chỉ chiếm một chỗ trong bảng cùng với PID và mã thoát. Nên nếu bộ nhớ tăng thì tôi phải đi tìm giả thuyết khác; việc nó phẳng đúng như dự đoán của giả thuyết này. Về việc vì sao chỉ xảy ra sau bản phát hành ba tuần trước, giả thuyết của tôi là bản đó đã bỏ lời gọi `wait`. Điều đáng nói là nó có lý về mặt ý định: `wait` chặn tiến trình cha cho tới khi con xong, nên với mục tiêu \"tối ưu độ trễ\" thì bỏ nó đi đúng là làm cha trả lời nhanh hơn. Nhưng `wait` không chỉ chờ — nó còn là hành động **thu dọn**, và bỏ nó đi đổi một lần chờ vài chục mili giây cho một chỗ trong bảng tiến trình bị giữ mãi mãi. Đó là dạng tối ưu đúng ở chỗ nó nhìn và sai ở chỗ nó không nhìn. Ràng buộc của đề bài đòi tôi chỉ ra nguyên nhân từ số liệu trước khi đọc mã, và tôi làm được điều đó bằng một dự đoán cụ thể: nếu chẩn đoán đúng thì `ps` phải thấy khoảng 31.000 tiến trình ở trạng thái zombie ngay lúc dịch vụ bắt đầu lỗi, tất cả đều là con của tiến trình dịch vụ. Mạnh hơn nữa, nếu tôi đếm số zombie theo thời gian hoạt động thì nó phải tăng đều và tỉ lệ với số yêu cầu đã xử lý — khoảng 1.200 mỗi giờ. Đó là một dự đoán định lượng, và nếu số đo khớp thì chẩn đoán được xác nhận mà không cần đọc một dòng mã nào; nếu số zombie ít mà số tiến trình vẫn đầy thì giả thuyết của tôi sai và tôi phải đi tìm những tiến trình con **còn sống** bị treo, đó là một sự cố khác hẳn. Về cách sửa, điều tôi muốn tránh là quay lui bản tối ưu, vì mục tiêu của nó chính đáng. Cách sửa đúng là thu dọn không đồng bộ: cha đăng ký để kernel báo khi có con kết thúc, rồi `wait` trong chỗ xử lý thông báo đó. Như vậy cha không bao giờ chặn để chờ con, nên lợi ích về độ trễ được giữ nguyên, mà chỗ trong bảng tiến trình vẫn được thu hồi. Nói cách khác cả hai mục tiêu đạt được cùng lúc, và đó là điểm tôi muốn nêu với người viết bản phát hành. Một cách thay thế là kỹ thuật `fork` hai lần: con thứ nhất `fork` ra cháu rồi thoát ngay, nên cháu trở thành mồ côi và được `init` nhận — `init` tự động `wait` mọi con của nó nên việc thu dọn thành tự động. Cách này gọn khi cha không cần biết mã thoát của công việc. Ngoài việc sửa, tôi sẽ thêm một phòng tuyến, vì đây là lớp sự cố cạn tài nguyên dần và nó rất dễ quay lại dưới hình thức khác: đếm số tiến trình con đang sống cùng số zombie, phát cảnh báo khi vượt một ngưỡng ví dụ một phần tư giới hạn. Với một tài nguyên đếm được và có trần cứng thì việc không đo nó là điều khiến sự cố trở thành bất ngờ sau 26 giờ thay vì một cảnh báo sau ba tuần. Và bài học rộng hơn tôi muốn ghi lại: khi một bản tối ưu bỏ đi một lời gọi, câu hỏi phải hỏi là \"lời gọi đó đang giữ bảo đảm nào?\" — vì rất nhiều lời gọi trông như chỉ tốn thời gian lại đang làm hai việc, và việc thứ hai mới là việc không thấy.",
    redFlags: [
      "Kết luận rò rỉ bộ nhớ và đi đo bộ nhớ",
      "Nâng giới hạn số tiến trình và coi là đã sửa",
      "Khởi động lại theo lịch như lời giải, trái ràng buộc",
      "Quay lui bản tối ưu độ trễ, bỏ luôn lợi ích của nó",
      "Thêm `wait` chặn ngay trong đường xử lý yêu cầu",
      "Không đưa ra dự đoán định lượng nào kiểm chứng được trước khi đọc mã",
    ],
    probes: [
      "Nếu `ps` thấy ít zombie mà bảng tiến trình vẫn đầy thì giả thuyết nào thay thế?",
      "Thu dọn không đồng bộ có cạm bẫy gì cần cẩn thận?",
      "Vì sao nâng giới hạn số tiến trình chỉ dịch thời điểm sập?",
    ],
    refs: ["sysprog-04", "sysprog-13"],
  },

  // ===== spiq-thread (sysprog-iq09–sysprog-iq12) =====
  {
    id: "sysprog-iq09",
    field: "sysprog",
    topic: "spiq-thread",
    level: 1,
    minutes: 5,
    question: "Biến điều kiện dùng để làm gì, và vì sao việc kiểm tra điều kiện **bắt buộc** phải nằm trong một vòng lặp?",
    mustCover: [
      "Biến điều kiện cho phép một tập thread **ngủ** cho tới khi được đánh thức",
      "Thread không đánh thức nhau trực tiếp theo id; một thread báo hiệu cho **biến điều kiện**, và nó đánh thức thread đang ngủ trong đó",
      "Có hai cách báo: đánh thức **một** thread, hoặc đánh thức **tất cả**",
      "Khi chỉ đánh thức một, hệ điều hành chọn thread nào — ta không điều khiển được",
      "Biến điều kiện luôn đi cùng một **mutex**: thread phải giữ mutex khi kiểm điều kiện",
      "Lý do phải có vòng lặp thứ nhất: **đánh thức giả** — thread có thể tỉnh mà không ai báo hiệu",
      "Đánh thức giả tồn tại vì hiệu năng: trên hệ nhiều CPU, một race có thể làm mất một lần báo hiệu",
      "Kernel không phát hiện được lần báo hiệu bị mất, nhưng phát hiện được **khi nào nó có thể xảy ra**, nên nó đánh thức thread để mã tự kiểm lại",
      "Lý do thứ hai: khi đánh thức tất cả, nhiều thread tỉnh nhưng chỉ một thread giành được điều kiện — số còn lại phải ngủ tiếp",
      "Nên `if` là sai ở cả hai lý do: thread chạy tiếp với điều kiện **không** thoả",
    ],
    model: "Biến điều kiện giải bài toán chờ mà không quay vòng tiêu CPU: nó cho một tập thread ngủ cho tới khi được đánh thức. Điều đáng chú ý về mô hình này là các thread không đánh thức nhau trực tiếp — không có ai gọi tên ai theo id. Một thread báo hiệu cho **biến điều kiện**, và chính biến điều kiện đánh thức một hoặc tất cả các thread đang ngủ bên trong nó. Khi ta chỉ đánh thức một, hệ điều hành chọn thread nào, và ta không điều khiển được lựa chọn đó — điều này quan trọng khi nghĩ về tính công bằng. Biến điều kiện luôn đi cùng một mutex, vì điều kiện ta chờ là một trạng thái dùng chung nên việc kiểm nó phải nằm trong vùng găng. Về câu hỏi vòng lặp, có hai lý do độc lập và tôi thấy nên nêu cả hai vì mỗi lý do một mình đã đủ. Lý do thứ nhất là **đánh thức giả**: một thread đang chờ có thể tỉnh dậy mà không ai báo hiệu cả. Nó tồn tại vì hiệu năng. Trên hệ nhiều CPU, có khả năng một race condition làm một lần báo hiệu bị mất. Kernel không phát hiện được rằng lần báo hiệu đó đã mất, nhưng nó phát hiện được khi nào tình huống ấy **có thể** xảy ra — và khi đó nó chọn cách an toàn là đánh thức thread lên để mã chương trình tự kiểm lại điều kiện. Nói cách khác, đánh thức giả không phải khiếm khuyết mà là một đánh đổi có chủ ý: kernel nhường việc kiểm tra lại cho ta, đổi lấy việc không phải trả giá đồng bộ hoá chặt hơn ở mọi lần báo hiệu. Lý do thứ hai không cần tới đánh thức giả nào: khi một thread đánh thức **tất cả**, nhiều thread cùng tỉnh, nhưng chỉ một thread giành được mutex và tiêu thụ điều kiện — chẳng hạn lấy đi phần tử duy nhất trong hàng đợi. Những thread còn lại tỉnh, giành được mutex sau đó, và thấy điều kiện đã không còn thoả. Chúng buộc phải ngủ tiếp, và chỉ vòng lặp cho phép điều đó. Vì vậy viết `if` thay vì `while` là sai theo cả hai đường, và hậu quả giống nhau: thread chạy tiếp với điều kiện không thoả — đọc một hàng đợi rỗng, hay dùng một tài nguyên chưa sẵn sàng. Lỗi này thưa và phụ thuộc thời điểm, nên nó là dạng khó tái hiện nhất, và đó là lý do tôi coi `while` không phải một thói quen phòng xa mà là phần bắt buộc của giao ước.",
    redFlags: [
      "Nói `if` là đủ nếu chỉ có một thread chờ",
      "Coi đánh thức giả là khiếm khuyết của hệ điều hành",
      "Không biết đánh thức tất cả cũng đòi vòng lặp",
      "Kiểm điều kiện mà không giữ mutex",
    ],
    probes: [
      "Đánh thức một thread và đánh thức tất cả — khi nào bạn chọn cái nào?",
      "Vì sao kernel không tự giải quyết lần báo hiệu bị mất?",
      "Dùng `if` gây ra biểu hiện gì trong một hàng đợi sản xuất–tiêu thụ?",
    ],
    refs: ["sysprog-07"],
  },
  {
    id: "sysprog-iq10",
    field: "sysprog",
    topic: "spiq-thread",
    level: 2,
    minutes: 10,
    code: {
      lang: "c",
      text: `#define CAP 16
static int buf[CAP], count = 0, in = 0, out = 0;
static pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t  cv = PTHREAD_COND_INITIALIZER;   // (1) một biến điều kiện

void put(int v) {
    pthread_mutex_lock(&m);
    if (count == CAP)                                   // (2)
        pthread_cond_wait(&cv, &m);
    buf[in] = v; in = (in + 1) % CAP; count++;
    pthread_cond_signal(&cv);                           // (3)
    pthread_mutex_unlock(&m);
}

int take(void) {
    pthread_mutex_lock(&m);
    if (count == 0)                                     // (4)
        pthread_cond_wait(&cv, &m);
    int v = buf[out]; out = (out + 1) % CAP; count--;
    pthread_cond_signal(&cv);                           // (5)
    pthread_mutex_unlock(&m);
    return v;
}

// 4 producer, 4 consumer. Sau vài triệu thao tác:
// đôi khi consumer nhận giá trị rác; đôi khi cả 8 thread treo cứng.`,
    },
    question: "Hai triệu chứng: giá trị rác và treo cứng. Chỉ ra từng nguyên nhân và viết lại cho đúng.",
    mustCover: [
      "Triệu chứng \"giá trị rác\": dòng (2) và (4) dùng `if` thay vì **`while`**",
      "Nên một thread tỉnh do đánh thức giả, hoặc tỉnh sau khi thread khác đã tiêu thụ điều kiện, sẽ chạy tiếp với điều kiện **không thoả**",
      "Cụ thể: consumer đọc `buf[out]` khi `count == 0`, tức đọc ô chưa được ghi",
      "Sửa: đổi cả hai thành `while (count == CAP)` và `while (count == 0)`",
      "Triệu chứng \"treo cứng\": dòng (1) dùng **một** biến điều kiện cho **hai** điều kiện khác nhau",
      "Nên `pthread_cond_signal` ở dòng (3) và (5) có thể đánh thức **sai loại** thread",
      "Ví dụ: buffer đầy, 4 producer đang chờ; một consumer lấy một phần tử rồi `signal`, nhưng hệ điều hành đánh thức một **consumer** khác",
      "Consumer đó thấy `count` vẫn > 0 nên nó chạy — và không ai đánh thức producer nào",
      "Lặp lại tới khi buffer rỗng: consumer chờ, producer chờ, không ai báo hiệu → treo cứng toàn bộ",
      "Sửa cách 1: dùng **hai** biến điều kiện — `not_full` và `not_empty` — và báo hiệu đúng cái cần",
      "Sửa cách 2: giữ một biến điều kiện nhưng đổi `signal` thành **`broadcast`** — đúng nhưng đánh thức thừa",
      "Tôi chọn hai biến điều kiện: nó diễn đạt đúng ý định và không đánh thức thread không liên quan",
      "Và giữ `while` dù đã tách biến điều kiện — vì đánh thức giả vẫn tồn tại",
    ],
    model: "Hai triệu chứng, hai lỗi riêng, và điều đáng nói là sửa một cái không sửa cái kia. Triệu chứng giá trị rác đến từ dòng (2) và (4): chúng dùng `if` thay vì `while`. Với `if`, một thread tỉnh lên rồi chạy tiếp ngay mà không kiểm lại điều kiện, và có hai đường dẫn tới việc điều kiện không còn thoả — đánh thức giả, và việc một thread khác đã tiêu thụ điều kiện trong lúc thread này còn đang giành mutex. Hậu quả cụ thể trong đoạn mã này: consumer đọc `buf[out]` khi `count` bằng 0, tức đọc một ô chưa bao giờ được ghi, nên nó nhận rác. Chiều ngược lại cũng xảy ra: producer ghi vào buffer đã đầy và làm hỏng phần tử chưa ai đọc. Sửa thì chỉ đổi hai chữ, nhưng lý do phải nói rõ vì đó là phần người ta hay coi là phòng xa: `while` là phần bắt buộc của giao ước, không phải một thói quen cẩn thận. Triệu chứng treo cứng thì tinh tế hơn và nó nằm ở dòng (1): đoạn mã dùng **một** biến điều kiện cho **hai** điều kiện khác nhau — \"buffer không đầy\" mà producer chờ, và \"buffer không rỗng\" mà consumer chờ. Vì cả hai loại thread ngủ trong cùng một biến điều kiện, `pthread_cond_signal` đánh thức **một** thread và hệ điều hành chọn ai, nên nó hoàn toàn có thể đánh thức sai loại. Hãy lấy một trình tự cụ thể: buffer đầy, bốn producer đang chờ. Một consumer lấy một phần tử, `count` giảm xuống 15, rồi nó `signal`. Điều cần xảy ra là một producer tỉnh lên, nhưng hệ điều hành lại đánh thức một consumer khác. Consumer đó tỉnh, thấy `count` vẫn lớn hơn 0 nên nó lấy tiếp một phần tử và lại `signal` — và lần báo hiệu dành cho producer đã bị dùng mất. Cứ thế cho tới khi buffer rỗng: lúc đó mọi consumer đi vào chờ, mọi producer cũng đang chờ, và không còn thread nào thức để báo hiệu. Tám thread treo cứng vĩnh viễn. Điều tôi muốn nhấn là đây không phải deadlock do khoá — không ai giữ khoá nào — mà là **mất báo hiệu**, một dạng treo khác về cơ chế nhưng cùng hậu quả. Về cách sửa, có hai đường và tôi ưa đường thứ nhất rõ rệt. Đường thứ nhất là dùng hai biến điều kiện, `not_full` và `not_empty`: producer chờ trên `not_full` và báo hiệu `not_empty`; consumer làm ngược lại. Khi đó một lần báo hiệu không bao giờ tới sai loại thread, và mã đọc ra đúng ý định. Đường thứ hai là giữ một biến điều kiện nhưng đổi `signal` thành `broadcast`, tức đánh thức tất cả — nó đúng, vì thread sai loại sẽ kiểm điều kiện rồi ngủ lại, nhưng nó đánh thức cả những thread không liên quan nên tốn công một cách không cần thiết, và mức tốn đó tăng theo số thread. Tôi coi nó là cách chữa hợp lệ khi không muốn đổi cấu trúc, chứ không phải cách viết đúng. Và dù chọn đường nào, tôi vẫn giữ `while` — vì hai lỗi này độc lập nhau, và đánh thức giả vẫn tồn tại sau khi đã tách biến điều kiện.",
    redFlags: [
      "Chỉ đổi `if` thành `while` rồi coi là xong — vẫn treo cứng",
      "Chỉ thêm biến điều kiện thứ hai mà giữ `if` — vẫn đọc rác",
      "Đổi `signal` thành `broadcast` mà không nói tới cái giá",
      "Thêm `sleep` hay quay vòng kiểm tra để \"tránh treo\"",
      "Gọi triệu chứng treo cứng là deadlock do khoá",
    ],
    probes: [
      "Vì sao đây là mất báo hiệu chứ không phải deadlock do khoá?",
      "`broadcast` tốn kém thêm bao nhiêu, và khi nào cái giá đó đáng?",
      "Bạn viết bài kiểm thử nào để bắt được hai lỗi này?",
    ],
    refs: ["sysprog-07", "sysprog-06"],
  },
  {
    id: "sysprog-iq11",
    field: "sysprog",
    topic: "spiq-thread",
    level: 3,
    minutes: 11,
    question: "Một cấu trúc dữ liệu dùng chung bị tranh chấp nặng. Dùng một khoá lớn, khoá chi tiết, hay tách dữ liệu theo thread?",
    tradeoffs: [
      {
        option: "Một khoá lớn cho cả cấu trúc",
        when: "Mặc định để **bắt đầu**. Dễ lập luận đúng, không có nguy cơ thứ tự khoá, và dễ đọc. Đúng cho tới khi đo được rằng tranh chấp là nút thắt thật.",
      },
      {
        option: "Khoá chi tiết theo phần",
        when: "Khi đo được rằng các thao tác thường chạm vào **những phần khác nhau**. Tăng song song thật. Đổi lại: nhiều khoá là nhiều **thứ tự lấy khoá**, và mỗi thao tác chạm nhiều phần là một nguy cơ deadlock mới.",
      },
      {
        option: "Tách dữ liệu theo thread, gộp lại sau",
        when: "Khi thao tác **chia được** theo khoá hay theo dải. Không có tranh chấp nào vì không có gì dùng chung — cách nhanh nhất và đúng nhất. Chỉ áp dụng được khi việc gộp lại có nghĩa và không quá đắt.",
      },
    ],
    mustCover: [
      "Việc đầu tiên là **đo**, không phải chọn: tranh chấp có thật là nút thắt, hay ta đang đoán?",
      "Đo cái gì: thời gian thread chờ khoá so với thời gian nó làm việc thật",
      "Một khoá lớn dễ đúng nhất và tôi luôn bắt đầu từ đó — tính đúng đắn trước, hiệu năng sau",
      "Khoá chi tiết mua được song song **chỉ khi** các thao tác thường chạm phần khác nhau; nếu chúng vẫn chạm cùng chỗ thì ta thêm phức tạp mà không được gì",
      "Cái giá chính của khoá chi tiết: nhiều khoá sinh ra **thứ tự lấy khoá**, và đó là nguồn deadlock",
      "Nên nếu đi hướng này, phải đặt một **thứ tự toàn cục** cho việc lấy khoá và tuân thủ ở mọi nơi",
      "Và chi phí của bản thân việc lấy khoá không miễn phí — nhiều khoá nhỏ có thể chậm hơn một khoá lớn",
      "Hướng mạnh nhất khi áp dụng được là **tách dữ liệu**: không dùng chung thì không cần đồng bộ",
      "Vì mọi primitive đồng bộ đều là chi phí; loại bỏ nhu cầu đồng bộ luôn thắng việc tối ưu nó",
      "Điều kiện của nó: thao tác chia được theo khoá, và việc gộp kết quả có nghĩa",
      "Với hàng đợi thì có hướng riêng: **bộ đệm vòng** một người ghi một người đọc hầu như không cần khoá",
      "Và quy tắc tôi giữ ở mọi hướng: **không giữ khoá khi làm I/O** hay khi gọi mã không biết trước",
    ],
    model: "Việc đầu tiên tôi làm không phải chọn phương án mà là đo, vì \"bị tranh chấp nặng\" thường là một cảm nhận chứ không phải một số. Cái tôi đo là thời gian mỗi thread chờ khoá so với thời gian nó làm việc thật bên trong vùng găng. Nếu tỉ lệ chờ nhỏ thì tranh chấp không phải nút thắt và mọi thay đổi tôi làm chỉ thêm rủi ro. Tôi cũng xem vùng găng có chứa gì không nên có ở đó — và đây là chỗ tôi tìm thấy lời giải nhiều nhất trong thực tế: nếu vùng găng đang chứa một lần đọc tệp, một lời gọi mạng, hay một lần cấp phát lớn, thì việc đúng cần làm là đưa những thứ đó ra ngoài, chứ không phải đổi sơ đồ khoá. Một khoá lớn cho cả cấu trúc là chỗ tôi luôn bắt đầu. Nó dễ lập luận đúng, nó không có thứ tự khoá nào để nhầm, và người đọc sau hiểu ngay. Với một cấu trúc dùng chung thì tôi coi tính đúng đắn là ràng buộc và hiệu năng là mục tiêu — nên tôi không đánh đổi chiều đó trước khi có số. Khoá chi tiết là bước tiếp theo, nhưng nó chỉ mua được song song khi các thao tác thường chạm vào những phần khác nhau của cấu trúc. Nếu chúng vẫn dồn vào cùng một phần — chuyện rất hay xảy ra khi dữ liệu lệch, ví dụ một khoá nóng chiếm phần lớn lưu lượng — thì ta đã thêm nhiều khoá mà mọi thread vẫn xếp hàng ở đúng một chỗ. Cái giá chính của hướng này không phải độ phức tạp của mã mà là deadlock: nhiều khoá nghĩa là có nhiều thứ tự lấy khoá, và bất kỳ hai thao tác nào lấy hai khoá theo hai thứ tự khác nhau đều có thể treo nhau. Nên nếu đi hướng này tôi đặt một thứ tự toàn cục cho việc lấy khoá — ví dụ theo địa chỉ hay theo chỉ số phần — và tuân thủ nó ở mọi chỗ không ngoại lệ, vì đó là cách phá điều kiện chờ vòng tròn một cách có hệ thống. Tôi cũng nhớ rằng việc lấy khoá tự nó có chi phí, nên một thao tác phải lấy năm khoá nhỏ có thể chậm hơn lấy một khoá lớn. Hướng mạnh nhất khi áp dụng được là tách dữ liệu theo thread: mỗi thread có phần riêng, không dùng chung gì, rồi gộp kết quả ở cuối. Lý do tôi ưa nó không phải vì nó nhanh hơn một chút mà vì nó đổi loại bài toán: mọi primitive đồng bộ đều là một chi phí, và loại bỏ nhu cầu đồng bộ luôn thắng việc tối ưu cách đồng bộ. Nó cũng loại bỏ cả một lớp lỗi — không có gì dùng chung thì không có race, không có thứ tự khoá, không có đánh thức bị mất. Điều kiện áp dụng thì rõ: thao tác phải chia được theo khoá hoặc theo dải, và việc gộp lại phải có nghĩa và không đắt hơn phần tiết kiệm được. Với trường hợp riêng là một hàng đợi giữa các thread, tôi sẽ nhắc tới bộ đệm vòng: với đúng một người ghi và một người đọc, nó hầu như không cần khoá, và đó thường là câu trả lời đúng cho bài toán truyền dữ liệu giữa hai tầng. Nhưng tôi cũng sẽ nói rằng bộ đệm vòng nhiều người ghi nhiều người đọc rất dễ viết sai — nên tôi chỉ đi hướng đó khi mô hình đúng là một–một. Cuối cùng, một quy tắc tôi giữ bất kể chọn hướng nào: không giữ khoá khi làm I/O, và không giữ khoá khi gọi một hàm mà ta không biết nó làm gì — vì cả hai đều biến một vùng găng ngắn thành một vùng găng dài vô định, và đó là nguyên nhân của phần lớn tranh chấp tôi từng gặp.",
    redFlags: [
      "Chuyển sang khoá chi tiết trước khi đo",
      "Dùng nhiều khoá mà không đặt thứ tự lấy khoá",
      "Không xét việc lấy thứ nặng ra khỏi vùng găng trước",
      "Giữ khoá trong lúc làm I/O",
      "Đề nghị bộ đệm vòng nhiều người ghi nhiều người đọc như lời giải dễ",
    ],
    probes: [
      "Bạn đo tranh chấp bằng con số nào?",
      "Dữ liệu lệch làm khoá chi tiết mất tác dụng ra sao?",
      "Việc gộp kết quả trong hướng tách dữ liệu có thể đắt tới mức nào?",
    ],
    refs: ["sysprog-07", "sysprog-06"],
  },
  {
    id: "sysprog-iq12",
    field: "sysprog",
    topic: "spiq-thread",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một bộ đệm trong bộ nhớ dùng sơ đồ người đọc–người ghi: nhiều người đọc vào cùng lúc, người ghi vào một mình. Sau khi lưu lượng đọc tăng gấp ba, thao tác **ghi** bắt đầu mất 4–90 giây thay vì 2 ms, và đôi khi không bao giờ hoàn thành. Thao tác đọc vẫn nhanh — trung bình 0,3 ms. Không có lỗi nào trong log.",
      scale: "Khoảng 9.000 lượt đọc/giây, 40 lượt ghi/giây. Dữ liệu trong bộ đệm cũ dần vì việc ghi không hoàn thành, nên người dùng thấy thông tin lỗi thời tới hàng phút.",
      constraints: "Không giảm lưu lượng đọc. Không chấp nhận dữ liệu cũ quá 5 giây. Phải giải thích được vì sao đọc vẫn nhanh trong khi ghi thì không, và vì sao không có lỗi nào trong log.",
      },
    question: "Đọc nhanh mà ghi treo — chỉ dấu đó khoanh vùng vào cơ chế nào? Nêu chẩn đoán và cách sửa.",
    mustCover: [
      "Chỉ dấu quyết định: vấn đề **bất đối xứng** giữa đọc và ghi, nên nó nằm ở chính sơ đồ người đọc–người ghi",
      "Chẩn đoán: **người ghi bị bỏ đói**, không phải deadlock và không phải chậm do tải",
      "Cơ chế: người ghi chỉ vào được khi **không còn người đọc nào** bên trong",
      "Với 9.000 lượt đọc/giây, luôn có người đọc mới vào trước khi người đọc cuối ra — số người đọc không bao giờ về 0",
      "Nên người ghi chờ một điều kiện mà hệ thống liên tục phá vỡ; đó là bỏ đói, không phải treo",
      "Điều đó giải thích vì sao thời gian ghi **trải rất rộng** (4–90 giây) chứ không tăng đồng đều: nó phụ thuộc vào một khoảng trống may mắn giữa các lượt đọc",
      "Vì sao đọc vẫn nhanh: người đọc không phải chờ nhau, nên tăng tải đọc không làm chúng chậm",
      "Vì sao không có lỗi trong log: chờ khoá **không sinh lỗi** — thao tác vẫn đúng, chỉ chậm",
      "Đây là lớp sự cố vô hình với log lỗi, nên phải đo bằng độ trễ và bằng thời gian chờ khoá",
      "Sửa cốt lõi: sơ đồ phải **ưu tiên người ghi** — người đọc mới phải chờ nếu có người ghi đang xếp hàng",
      "Cách làm: khi có người ghi chờ, không cho người đọc mới vào; người đọc đang bên trong ra hết thì người ghi vào",
      "Đổi lại độ trễ đọc tăng nhẹ và có thể dao động — đó là đánh đổi đúng vì ràng buộc đòi dữ liệu mới trong 5 giây",
      "Hướng thay thế mạnh hơn: **ghi vào bản sao rồi đổi con trỏ**, nên người đọc không bao giờ chặn người ghi",
      "Cách đó cho người đọc không cần khoá và người ghi không bị bỏ đói; cái giá là bộ nhớ gấp đôi lúc đổi",
      "Bài học: một sơ đồ đồng bộ có thể **đúng** mà vẫn không bảo đảm **tiến triển** cho mọi bên",
    ],
    model: "Chỉ dấu quyết định là tính bất đối xứng: đọc vẫn nhanh trong khi ghi thì treo. Nếu đây là chậm do tải hay do khoá quá thô thì cả hai chiều đều chậm; nếu là deadlock thì cả hai đều dừng và thời gian không có phân bố nào. Nên nó nằm ở chính sơ đồ người đọc–người ghi, và chẩn đoán của tôi là **người ghi bị bỏ đói**. Cơ chế thì trực tiếp: trong sơ đồ này, người ghi chỉ vào được khi không còn người đọc nào bên trong. Với 9.000 lượt đọc mỗi giây, hầu như luôn có một người đọc mới vào trước khi người đọc cuối cùng ra, nên số người đọc bên trong không bao giờ về 0 — người ghi đang chờ một điều kiện mà hệ thống liên tục phá vỡ. Điều đáng nói là không ai bị chặn sai: sơ đồ đang hoạt động đúng theo cách nó được viết, chỉ là nó không bảo đảm rằng người ghi cuối cùng sẽ vào được. Đó là lý do tôi gọi đây là bỏ đói chứ không phải treo. Chi tiết \"4 đến 90 giây\" là bằng chứng ủng hộ mạnh cho chẩn đoán này: nếu nguyên nhân là quá tải thì thời gian ghi sẽ tăng tương đối đồng đều, còn ở đây nó trải rất rộng vì mỗi lượt ghi phải đợi một khoảng trống tình cờ giữa các lượt đọc — một sự kiện xác suất, nên phương sai lớn và đuôi rất dài. Và \"đôi khi không bao giờ hoàn thành\" chính là phần đuôi đó, không phải một triệu chứng khác. Hai câu hỏi còn lại trả lời được từ cùng một cơ chế. Đọc vẫn nhanh vì người đọc không chặn nhau — tăng tải đọc gấp ba không làm chúng chờ nhau, nó chỉ làm điều kiện \"không còn người đọc\" trở nên khó xảy ra hơn, và người chịu hậu quả là người ghi. Còn log không có lỗi vì việc chờ một khoá không sinh ra lỗi nào: mỗi thao tác cuối cùng vẫn đúng, nó chỉ chậm. Đó là điều tôi muốn nhấn về lớp sự cố này — nó hoàn toàn vô hình nếu ta chỉ theo dõi log lỗi, nên nó phải được đo bằng phân bố độ trễ theo loại thao tác và bằng thời gian chờ khoá, tách riêng cho đọc và cho ghi. Về cách sửa, hướng trực tiếp là đổi sơ đồ sang **ưu tiên người ghi**: khi có người ghi đang xếp hàng, không cho người đọc mới vào nữa; những người đọc đang ở bên trong ra hết thì người ghi vào. Như vậy điều kiện \"không còn người đọc\" trở thành điều đạt được chắc chắn sau một khoảng hữu hạn, chứ không phải một sự kiện may mắn. Cái giá phải nói rõ: độ trễ đọc tăng nhẹ và dao động hơn, vì người đọc thỉnh thoảng phải chờ một lượt ghi. Với ràng buộc của đề bài — không chấp nhận dữ liệu cũ quá 5 giây — đó là đánh đổi đúng, và tôi sẽ trình bày nó đúng như vậy: ta chuyển một phần độ trễ từ 40 lượt ghi sang 9.000 lượt đọc, và vì phần chuyển đi được chia cho rất nhiều nên mỗi lượt đọc chỉ chịu một phần rất nhỏ. Nhưng có một hướng tôi ưa hơn nếu dữ liệu cho phép: người ghi dựng một **bản sao mới** rồi đổi con trỏ để trỏ sang bản sao đó. Khi ấy người đọc không bao giờ chặn người ghi, người ghi không bao giờ chờ người đọc, và người đọc thậm chí không cần khoá — mỗi lượt đọc thấy một bản nhất quán, hoặc bản cũ hoặc bản mới. Với tỉ lệ đọc so với ghi là 9.000 trên 40, tôi thấy hướng này gần như chắc chắn đúng: ta tối ưu cho chiều áp đảo. Cái giá là bộ nhớ gấp đôi tại thời điểm đổi, và việc dựng bản sao phải rẻ hơn 25 mili giây để giữ nhịp 40 lượt ghi mỗi giây — cả hai đều là thứ tôi kiểm được trước khi cam kết. Bài học tôi muốn ghi lại rộng hơn sự cố: một sơ đồ đồng bộ có thể **đúng** — không có race, không có hỏng dữ liệu — mà vẫn không bảo đảm **tiến triển** cho mọi bên. Tính đúng và tính tiến triển là hai tính chất khác nhau, và sơ đồ người đọc–người ghi ngây thơ là ví dụ sạch nhất về việc có cái thứ nhất mà thiếu cái thứ hai.",
    redFlags: [
      "Kết luận hệ thống quá tải và đề nghị thêm máy",
      "Gọi đây là deadlock",
      "Tăng thời gian chờ của thao tác ghi rồi thử lại",
      "Chuyển sang một khoá lớn cho cả đọc và ghi — chữa được bỏ đói nhưng làm đọc chậm hẳn",
      "Không giải thích được vì sao thời gian ghi trải từ 4 tới 90 giây",
      "Kết luận không có vấn đề vì log không có lỗi",
    ],
    probes: [
      "Vì sao phương sai lớn của thời gian ghi lại ủng hộ chẩn đoán bỏ đói?",
      "Chuyển sang ưu tiên người ghi ảnh hưởng tới độ trễ đọc bao nhiêu, tính thế nào?",
      "Hướng đổi con trỏ cần điều kiện gì để đúng?",
    ],
    refs: ["sysprog-07"],
  },

  // ===== spiq-deadlock (sysprog-iq13–sysprog-iq16) =====
  {
    id: "sysprog-iq13",
    field: "sysprog",
    topic: "spiq-deadlock",
    level: 1,
    minutes: 6,
    question: "Kể bốn điều kiện Coffman. Phá vỡ mỗi điều kiện trong thực tế nghĩa là làm gì, và livelock khác deadlock ở đâu?",
    mustCover: [
      "Bốn điều kiện **cần và đủ** cho deadlock — thoả cả bốn thì có xác suất khác không rằng hệ thống sẽ deadlock",
      "**Mutual exclusion**: không hai tiến trình nào lấy được cùng một tài nguyên cùng lúc",
      "**Circular wait**: tồn tại một chu trình chờ — P1 chờ tài nguyên P2 giữ, P2 chờ P3, ... vòng lại P1",
      "**Hold and wait**: đã lấy được tài nguyên thì giữ nó trong lúc chờ tài nguyên khác",
      "**No pre-emption**: không gì buộc được tiến trình từ bỏ tài nguyên đang giữ",
      "Phá **mutual exclusion**: làm tài nguyên chia sẻ được — ví dụ đặt tệp ở chế độ chỉ đọc",
      "Phá **circular wait**: đặt một **thứ tự toàn cục** cho việc lấy tài nguyên và tuân thủ ở mọi nơi",
      "Phá **hold and wait**: nếu không lấy được cái thứ hai thì **bỏ cái thứ nhất** xuống và thử lại",
      "Phá **no pre-emption**: cho một bên thứ ba cưỡng chế thu tài nguyên — hệ điều hành làm đúng điều này",
      "**Livelock** là khi các bên vẫn đang chạy nhưng không ai tiến triển — chẳng hạn cùng bỏ xuống và cùng nhặt lên theo một khuôn mẫu",
      "Livelock **khó phát hiện hơn** deadlock, vì từ ngoài nhìn vào các tiến trình vẫn trông như đang làm việc",
      "Và livelock có điều kiện **cần** mà **không** có điều kiện đủ — không tập quy tắc nào buộc nó phải xảy ra",
    ],
    model: "Bốn điều kiện Coffman là cần và đủ cho deadlock, nên chúng vừa là công cụ chẩn đoán vừa là công cụ thiết kế: phá bất kỳ một điều kiện nào thì deadlock không thể xảy ra. Mutual exclusion nghĩa là không hai tiến trình nào lấy được cùng một tài nguyên tại cùng thời điểm. Circular wait nghĩa là tồn tại một chu trình chờ — P1 chờ tài nguyên mà P2 giữ, P2 chờ P3, và cứ thế vòng về P1. Hold and wait nghĩa là một khi đã lấy được tài nguyên thì tiến trình giữ nó trong lúc chờ tài nguyên khác. No pre-emption nghĩa là không có gì buộc được tiến trình từ bỏ tài nguyên nó đang giữ. Phần tôi thấy giá trị hơn việc kể tên là dịch mỗi điều kiện thành một biện pháp thật, và ví dụ hai người cùng cần một cái bút và một tờ giấy làm rõ cả bốn. Phá mutual exclusion là làm tài nguyên chia sẻ được — hai người dùng chung bút và giấy; trong hệ thống thật thì đó là việc đặt một tệp ở chế độ chỉ đọc, hay thay một tài nguyên độc quyền bằng một bản sao cho mỗi bên. Phá circular wait là đặt một thứ tự toàn cục: hai người thoả thuận luôn lấy bút trước rồi mới lấy giấy. Đây là biện pháp tôi dùng nhiều nhất trong mã thật vì nó rẻ và kiểm chứng được bằng đọc mã — nếu mọi nơi lấy khoá theo cùng một thứ tự thì không có chu trình nào tồn tại được. Phá hold and wait là: thử lấy bút rồi lấy giấy, và nếu không lấy được giấy thì bỏ bút xuống rồi thử lại. Nó hoạt động, nhưng nó đưa vào một vấn đề mới, và đó là cầu nối sang phần thứ hai của câu hỏi. Phá no pre-emption là cho một bên thứ ba cưỡng chế — giáo viên bước vào và lấy đồ của một người trao cho người kia. Hệ điều hành làm đúng điều này: nó chiếm quyền tiến trình khi chuyển ngữ cảnh và ngắt được các lời gọi hệ thống, nên trong thực tế nhiều deadlock tự biến mất, và đó là lý do cách tiếp cận \"phớt lờ deadlock\" hoạt động được phần lớn thời gian. Về livelock: nó là khi các bên vẫn đang chạy nhưng không ai tiến triển. Lời giải phá hold and wait ở trên là ví dụ sạch nhất — nếu cả hai người cùng bỏ đồ xuống rồi cùng nhặt lên theo cùng một khuôn mẫu thì họ lặp mãi mà chẳng ai viết được gì. Khác biệt quan trọng nhất với deadlock là về khả năng phát hiện: với deadlock, hệ điều hành thường biết vì nó thấy hai tiến trình đang chờ một tài nguyên; với livelock, từ bên ngoài nhìn vào các tiến trình đều trông như đang làm việc bình thường — chúng đang tiêu CPU thật. Và một điểm lý thuyết đáng nêu: livelock có điều kiện cần nhưng không có điều kiện đủ, nghĩa là không có tập quy tắc nào mà theo đó livelock bắt buộc phải xảy ra. Muốn loại trừ nó thì phải chứng minh trên hệ thống bằng bất biến — chỉ ra rằng mỗi bước, sau một số hữu hạn bước, đều dẫn tới tiến triển. Những hệ thống tốt hơn còn chứng minh được chờ có giới hạn, tức chỉ có thể livelock trong tối đa n chu kỳ, và với những thứ như sàn giao dịch thì bảo đảm đó là điều bắt buộc.",
    redFlags: [
      "Kể tên bốn điều kiện mà không dịch được thành biện pháp",
      "Cho rằng phá hold and wait là lời giải không có nhược điểm",
      "Nói livelock dễ phát hiện hơn deadlock",
      "Cho rằng chỉ cần có chu trình chờ là chắc chắn deadlock",
    ],
    probes: [
      "Vì sao \"phớt lờ deadlock\" lại hoạt động được trong hệ điều hành thật?",
      "Bạn chứng minh một hệ thống không livelock bằng cách nào?",
      "Chờ có giới hạn quan trọng với loại hệ thống nào?",
    ],
    refs: ["sysprog-08"],
  },
  {
    id: "sysprog-iq14",
    field: "sysprog",
    topic: "spiq-deadlock",
    level: 2,
    minutes: 9,
    code: {
      lang: "c",
      text: `typedef struct { pthread_mutex_t lock; long balance; int id; } account_t;

// Chuyển tiền giữa hai tài khoản
void transfer(account_t *from, account_t *to, long amount) {
    pthread_mutex_lock(&from->lock);          // (1)
    pthread_mutex_lock(&to->lock);            // (2)
    from->balance -= amount;
    to->balance   += amount;
    pthread_mutex_unlock(&to->lock);
    pthread_mutex_unlock(&from->lock);
}

// Tổng số dư hai tài khoản, dùng cho đối soát
long total(account_t *a, account_t *b) {
    pthread_mutex_lock(&b->lock);             // (3) chú ý thứ tự
    pthread_mutex_lock(&a->lock);
    long t = a->balance + b->balance;
    pthread_mutex_unlock(&a->lock);
    pthread_mutex_unlock(&b->lock);
    return t;
}

// Chạy 8 thread gọi transfer và total trên cùng 50 tài khoản.
// Sau vài phút, toàn bộ 8 thread dừng lại và không bao giờ tiếp tục.`,
    },
    question: "Xác định chu trình chờ cụ thể. Rồi sửa — và nói rõ bạn phá điều kiện Coffman nào.",
    mustCover: [
      "Chu trình cụ thể: thread A gọi `transfer(x, y)` lấy khoá `x` ở dòng (1) rồi chờ khoá `y`",
      "Cùng lúc thread B gọi `total(y, x)` lấy khoá `y` ở dòng (3) rồi chờ khoá `x`",
      "Hai thread giữ khoá mình có và chờ khoá của nhau — đủ cả bốn điều kiện Coffman",
      "Thêm một chu trình nữa ngay trong `transfer`: `transfer(x, y)` và `transfer(y, x)` chạy đồng thời",
      "Nên lỗi không chỉ là do `total` viết ngược thứ tự — bản thân `transfer` đã sai",
      "Sửa: đặt **thứ tự toàn cục** cho việc lấy khoá — luôn lấy khoá của tài khoản có `id` nhỏ hơn trước",
      "Điều đó phá **circular wait**: không chu trình nào tồn tại được nếu mọi nơi lấy khoá theo cùng một thứ tự",
      "Phải xử lý trường hợp `from == to`: lấy cùng một mutex hai lần sẽ tự treo",
      "Và thứ tự đó phải áp cho **mọi** hàm chạm hai khoá, không chỉ hai hàm này",
      "Không chọn cách bỏ khoá rồi thử lại — nó phá hold and wait nhưng mở ra **livelock**",
      "Không chọn một khoá lớn cho cả 50 tài khoản — đúng nhưng tuần tự hoá mọi chuyển tiền",
      "Bài kiểm thử hồi quy: chạy `transfer` và `total` theo cả hai chiều trên cùng cặp tài khoản với nhiều thread",
    ],
    model: "Chu trình cụ thể thì dễ dựng khi đã biết phải tìm gì. Thread A gọi `transfer(x, y)`: nó lấy khoá của `x` ở dòng (1), rồi chờ khoá của `y` ở dòng (2). Cùng lúc thread B gọi `total(y, x)`: dòng (3) lấy khoá của tham số thứ hai trước, tức khoá của `x`... — thực ra hãy lấy đúng cặp làm nó treo: B gọi `total(x, y)`, nên dòng (3) lấy khoá của `y` trước rồi chờ khoá của `x`. Vậy A giữ `x` chờ `y`, B giữ `y` chờ `x`. Cả bốn điều kiện Coffman đều có mặt: mutex cho mutual exclusion, mỗi thread giữ khoá trong lúc chờ nên có hold and wait, không ai cưỡng chế thu khoá nên no pre-emption, và cặp chờ nhau là circular wait. Nhưng điều tôi muốn nêu là lỗi không chỉ ở việc `total` viết ngược thứ tự — bản thân `transfer` đã sai. Hai thread cùng gọi `transfer` với hai tài khoản theo hai chiều, `transfer(x, y)` và `transfer(y, x)`, tạo ra đúng chu trình đó mà không cần `total` tham gia. Nên nếu ai đó chỉ sửa `total` cho khớp thứ tự với `transfer` thì tần suất giảm mà lỗi vẫn còn, và đó là kiểu sửa tệ nhất vì nó làm lỗi khó tái hiện hơn. Cách sửa của tôi là đặt một thứ tự toàn cục cho việc lấy khoá: luôn lấy khoá của tài khoản có `id` nhỏ hơn trước, ở mọi hàm chạm tới hai khoá. Điều này phá circular wait một cách có hệ thống — nếu mọi nơi đều lấy khoá theo cùng một thứ tự thì không chu trình nào tồn tại được, và tôi kiểm chứng được điều đó bằng đọc mã thay vì bằng kiểm thử. Tôi chọn `id` vì nó ổn định; nếu không có `id` thì so địa chỉ của mutex cũng được, miễn là tiêu chí nhất quán. Có một trường hợp biên phải xử lý và nó hay bị quên: nếu `from` và `to` là cùng một tài khoản thì thứ tự nào cũng dẫn tới việc lấy cùng một mutex hai lần, và với mutex thường thì thread tự treo chính nó. Nên tôi kiểm và trả về sớm — một lần chuyển tiền cho chính mình vốn cũng không cần làm gì. Tôi sẽ nói rõ vì sao không chọn hai hướng khác. Bỏ khoá rồi thử lại phá hold and wait và nó đúng, nhưng nó mở ra livelock: hai thread có thể cùng bỏ, cùng lấy lại, lặp theo cùng một khuôn mẫu và không ai tiến triển — và livelock khó phát hiện hơn nhiều vì các thread trông như đang làm việc. Nếu buộc phải đi hướng đó thì phải có độ chờ ngẫu nhiên giữa các lần thử, và tôi thấy việc đó phức tạp hơn so với chỉ cần sắp thứ tự. Một khoá lớn cho cả 50 tài khoản cũng đúng và đơn giản nhất, nhưng nó tuần tự hoá mọi chuyển tiền kể cả giữa những cặp tài khoản không liên quan — với một hệ thống có tranh chấp thấp thì đó là cái giá không cần trả. Cuối cùng, bài kiểm thử hồi quy: chạy `transfer` và `total` theo cả hai chiều trên cùng một cặp tài khoản với nhiều thread trong một khoảng thời gian. Nó không chứng minh được tính đúng — không bài kiểm thử nào chứng minh được vắng mặt deadlock — nhưng nó bắt được đúng mẫu hình này rất nhanh, và nó là thứ lẽ ra đã bắt được lỗi hiện tại.",
    redFlags: [
      "Chỉ sửa `total` cho khớp thứ tự với `transfer`, bỏ qua chu trình giữa hai lần gọi `transfer`",
      "Dùng một khoá lớn mà không nói tới cái giá",
      "Bỏ khoá rồi thử lại mà không nói tới livelock",
      "Quên trường hợp `from == to`",
      "Sắp thứ tự theo một tiêu chí không ổn định",
    ],
    probes: [
      "Vì sao chỉ sửa `total` lại là kiểu sửa tệ?",
      "Bạn sắp thứ tự theo tiêu chí gì, và vì sao nó phải ổn định?",
      "Bài kiểm thử của bạn chứng minh được gì và không chứng minh được gì?",
    ],
    refs: ["sysprog-08", "sysprog-07"],
  },
  {
    id: "sysprog-iq15",
    field: "sysprog",
    topic: "spiq-deadlock",
    level: 3,
    minutes: 10,
    question: "Hệ thống của bạn có thể deadlock. Chọn cách nào: ngăn chặn bằng thiết kế, phát hiện rồi phá, hay phớt lờ?",
    tradeoffs: [
      {
        option: "Ngăn chặn — thứ tự toàn cục cho việc lấy tài nguyên",
        when: "Khi tập tài nguyên **biết trước** và sắp thứ tự được. Phá circular wait, và kiểm chứng được bằng đọc mã chứ không cần kiểm thử. Đây là mặc định trong mã ứng dụng.",
      },
      {
        option: "Phát hiện rồi phá",
        when: "Khi **không biết trước** tài nguyên nào sẽ được yêu cầu — đúng với hệ điều hành và hệ quản trị cơ sở dữ liệu. Cho hệ thống vào deadlock rồi cưỡng chế thu một tài nguyên. Đổi lại: phải hy sinh một bên, và có nguy cơ livelock nếu luôn hy sinh cùng một bên.",
      },
      {
        option: "Phớt lờ",
        when: "Khi xác suất thấp, hậu quả nhẹ, và đã có một cơ chế bên ngoài phá được bế tắc — chẳng hạn thời gian chờ, hoặc việc khởi động lại tiến trình. Ít nỗ lực nhất, và nó là lựa chọn hợp lệ nhiều hơn người ta thừa nhận.",
      },
    ],
    mustCover: [
      "Câu hỏi phân định: ta có **biết trước** tập tài nguyên và thứ tự yêu cầu hay không?",
      "Trong mã ứng dụng ta thường biết, nên ngăn chặn bằng thứ tự toàn cục là lựa chọn đúng",
      "Ưu điểm lớn nhất của ngăn chặn: nó kiểm chứng được bằng **đọc mã**, còn deadlock thì kiểm thử không chứng minh được vắng mặt",
      "Hệ điều hành và hệ quản trị cơ sở dữ liệu **không** biết trước, nên chúng buộc phải phát hiện rồi phá",
      "Lý do sâu hơn: không cách nào biết chương trình sẽ yêu cầu tài nguyên nào mà không chạy nó — một hệ quả của định lý Rice",
      "Phát hiện nghĩa là tìm **chu trình có hướng** trong đồ thị cấp phát tài nguyên, rồi phá một mắt xích",
      "Cái giá của phát hiện: phải **hy sinh** một bên — hủy một giao dịch, kill một tiến trình",
      "Và nếu luôn hy sinh cùng một bên thì bên đó bị bỏ đói; chọn ngẫu nhiên là cách thoát phổ biến",
      "\"Phớt lờ\" — thuật toán Đà điểu — hoạt động được vì hệ điều hành **chiếm quyền** tiến trình và ngắt được lời gọi hệ thống",
      "Nên nhiều deadlock thực tế tự tan, và phớt lờ là lựa chọn hợp lệ khi hậu quả nhẹ",
      "Nhưng nó chỉ đúng khi có một cơ chế bên ngoài phá được bế tắc — thời gian chờ, hoặc khởi động lại",
      "Và một điều tôi luôn kèm: **thời gian chờ** biến deadlock từ treo vĩnh viễn thành một lỗi nhìn thấy được, dù nó không ngăn được deadlock",
    ],
    model: "Câu hỏi tôi dùng để phân định là: ta có biết trước tập tài nguyên và thứ tự chúng sẽ được yêu cầu hay không? Trong mã ứng dụng thì câu trả lời thường là có — ta biết mình có những khoá nào và hàm nào chạm tới cái nào. Khi biết được thì ngăn chặn là lựa chọn đúng, và cụ thể là đặt một thứ tự toàn cục cho việc lấy tài nguyên, tức phá circular wait. Ưu điểm quyết định của nó không phải hiệu năng mà là khả năng kiểm chứng: nếu mọi nơi lấy khoá theo cùng một thứ tự thì tôi chứng minh được không có chu trình bằng cách đọc mã. Điều đó quan trọng vì deadlock là lớp lỗi mà kiểm thử gần như vô dụng — một bài kiểm thử chạy xanh không nói gì về việc deadlock không thể xảy ra, nó chỉ nói lần này chưa xảy ra. Nên tôi ưu tiên biện pháp mà tính đúng đắn nằm ở một bất biến đọc được, hơn là biện pháp phải tin vào kiểm thử. Hệ điều hành và hệ quản trị cơ sở dữ liệu ở vào tình thế khác hẳn: chúng không biết trước chương trình người dùng sẽ mở tệp nào hay khoá dòng nào. Và đây không phải chuyện thiếu thông tin tạm thời mà là một giới hạn về nguyên tắc — không có cách nào biết một chương trình sẽ yêu cầu tài nguyên nào mà không chạy nó, điều này là một hệ quả của định lý Rice về việc không quyết định được các tính chất ngữ nghĩa. Nên với chúng, ngăn chặn bằng thứ tự là bất khả thi, và phát hiện rồi phá là lựa chọn hợp lý chứ không phải lười. Phát hiện nghĩa là theo dõi đồ thị cấp phát tài nguyên và tìm chu trình có hướng, rồi phá một mắt xích. Cái giá phải nói rõ là ta buộc phải hy sinh một bên: hủy một giao dịch, hay chiếm lại tài nguyên của một tiến trình. Và có một cạm bẫy đi kèm — nếu ta luôn chọn cùng một bên để hy sinh theo một quy tắc tất định thì bên đó bị bỏ đói, hoặc hệ thống rơi vào livelock khi cùng một tập tài nguyên bị chiếm lại hết lần này đến lần khác. Cách thoát phổ biến là chọn ngẫu nhiên: người dùng vẫn có thể viết một chương trình mà việc chiếm lại từng tài nguyên dẫn tới livelock, nhưng với chương trình thực tế thì điều đó không xảy ra thường, và nếu có thì chỉ kéo dài vài chu kỳ. Hướng thứ ba là phớt lờ, và tôi muốn trình bày nó một cách công bằng vì nó bị coi nhẹ. Lý do nó hoạt động là hệ điều hành vốn đã chiếm quyền các tiến trình khi chuyển ngữ cảnh và ngắt được các lời gọi hệ thống, nên nó liên tục phá vỡ điều kiện no pre-emption mà không cần ai yêu cầu — nhiều deadlock trong thực tế tự tan. Nên với một hệ thống mà xác suất thấp, hậu quả nhẹ, và đã có một cơ chế bên ngoài phá được bế tắc, thì đầu tư vào ngăn chặn hình thức có thể không đáng. Điều kiện quan trọng là câu \"đã có cơ chế bên ngoài\": nếu không có gì phá được thì phớt lờ không phải quyết định mà là một sự thiếu sót. Và điều tôi luôn kèm vào bất kể chọn hướng nào: đặt **thời gian chờ** cho mọi lần lấy tài nguyên. Nó không ngăn được deadlock — đó là điểm tôi muốn nói chính xác — nhưng nó biến một lần treo vĩnh viễn im lặng thành một lỗi có thông điệp và có thời điểm, nên nó chuyển lớp sự cố này từ vô hình sang chẩn đoán được. Với chi phí gần như bằng không thì tôi coi đó là việc nên làm mặc định.",
    redFlags: [
      "Chọn ngăn chặn bằng thứ tự cho một hệ thống không biết trước tài nguyên",
      "Coi phát hiện rồi phá là lựa chọn kém, không hiểu vì sao hệ điều hành dùng nó",
      "Chọn phớt lờ mà không có cơ chế nào phá được bế tắc",
      "Nói thời gian chờ ngăn được deadlock",
      "Luôn hy sinh cùng một bên theo quy tắc tất định",
    ],
    probes: [
      "Vì sao kiểm thử gần như vô dụng với deadlock?",
      "Hệ quản trị cơ sở dữ liệu chọn bên nào để hủy, và theo tiêu chí gì?",
      "Thời gian chờ mua được gì nếu nó không ngăn được deadlock?",
    ],
    refs: ["sysprog-08"],
  },
  {
    id: "sysprog-iq16",
    field: "sysprog",
    topic: "spiq-deadlock",
    level: 4,
    minutes: 13,
    incident: {
      symptom: "Một hệ thống xử lý công việc dùng một hàng đợi và 16 worker, lấy việc theo thứ tự đến trước làm trước. Sau khi một khách hàng mới bắt đầu gửi các công việc rất lớn, **độ trễ trung vị** của mọi công việc tăng từ 1,2 giây lên 47 giây, dù tổng lượng công việc chỉ tăng 6%. Mức dùng CPU của 16 worker là 94% — cao và ổn định. Không worker nào bị treo.",
      scale: "Khoảng 8.000 công việc/giờ. 97% công việc mất dưới 2 giây; 3% công việc mới mất 6–20 phút. Hàng đợi có lúc dài 4.000 công việc. Hợp đồng mức dịch vụ cam kết trung vị dưới 5 giây.",
      constraints: "Không từ chối công việc lớn — khách hàng đó đã trả tiền. Không thêm worker trong quý này. Phải giải thích được vì sao CPU cao mà độ trễ vẫn tệ, và vì sao 6% lượng việc gây ra mức tăng 39 lần.",
      },
    question: "CPU 94% mà độ trễ tăng 39 lần. Cơ chế nào giải thích điều đó, và bạn sửa thế nào trong giới hạn 16 worker?",
    mustCover: [
      "Chẩn đoán: **hiệu ứng đoàn xe** — công việc ngắn xếp hàng sau công việc dài trong hàng đợi đến trước làm trước",
      "Cơ chế: một worker nhận công việc 20 phút thì nó bị chiếm suốt 20 phút, không phục vụ được ai khác",
      "Với 3% công việc rất lớn, phần lớn 16 worker có thể đang bị chiếm cùng lúc dù chúng chỉ là 3% số việc",
      "Phép tính: 3% × 8.000 = 240 công việc lớn/giờ × ~13 phút ≈ 52 giờ-worker mỗi giờ, mà ta chỉ có 16 — nên đó là quá tải thật về **thời gian worker**",
      "Vì sao 6% lượng việc gây 39 lần: \"lượng việc\" đo theo **số công việc**, còn tài nguyên bị tiêu là **thời gian worker**",
      "Đo sai đơn vị là lý do con số 6% nghe vô hại — theo thời gian worker thì mức tăng khổng lồ",
      "Vì sao CPU cao mà độ trễ tệ: CPU cao là dấu hiệu hệ thống **đang làm việc**, không phải làm việc **đúng thứ tự**",
      "Nên CPU không phải chỉ báo về độ trễ; hai đại lượng đó có thể cùng cao",
      "Sửa cốt lõi trong giới hạn 16 worker: **tách hàng đợi** theo lớp kích thước và dành riêng worker cho mỗi lớp",
      "Chẳng hạn 12 worker chỉ nhận việc ngắn, 4 worker nhận việc dài — việc ngắn không còn xếp sau việc dài",
      "Đó là cách ly tài nguyên, và nó không cần thêm worker nên thoả ràng buộc",
      "Cần một cách ước lượng kích thước **trước khi** chạy — theo dữ liệu đầu vào, hoặc theo lịch sử của khách hàng",
      "Nếu không ước lượng được: **chiếm quyền** — cắt việc dài thành lát và trả worker về hàng đợi giữa các lát",
      "Chiếm quyền cho hành vi gần với công việc ngắn nhất trước mà không cần biết trước độ dài",
      "Và phải theo dõi **phân vị** độ trễ tách theo lớp, không phải một con số trung vị gộp",
    ],
    model: "Chẩn đoán là hiệu ứng đoàn xe, và cái tên nói đúng hình ảnh: một xe tải chậm trên đường một làn làm cả đoàn xe phía sau chậm theo, dù chỉ có một xe tải. Ở đây hàng đợi lấy việc theo thứ tự đến trước làm trước, nên khi một worker nhận một công việc 20 phút thì nó bị chiếm suốt 20 phút và không phục vụ được ai khác. Những công việc 2 giây đến sau phải chờ, và chúng chờ không phải vì hệ thống thiếu CPU mà vì chỗ của chúng đang bị giữ. Điều làm sự cố nặng là phép tính về thời gian worker. 3% của 8.000 công việc mỗi giờ là khoảng 240 công việc lớn, mỗi cái trung bình chừng 13 phút, tức khoảng 52 giờ-worker cần cho mỗi giờ thời gian thực — trong khi ta chỉ có 16 giờ-worker mỗi giờ. Nên đây không chỉ là vấn đề thứ tự mà còn là quá tải thật về thời gian worker, và hàng đợi dài 4.000 là hệ quả tất yếu. Điều đó trả lời trực tiếp câu hỏi thứ hai của đề bài: vì sao 6% lượng việc gây ra mức tăng 39 lần? Vì con số 6% được đo theo **số công việc**, còn tài nguyên thực sự bị tiêu là **thời gian worker**. Theo đơn vị đúng thì mức tăng không phải 6% mà là gấp nhiều lần. Tôi coi đây là bài học riêng của sự cố: khi một chỉ số nghe vô hại mà hệ thống thì không, việc đầu tiên cần kiểm là chỉ số đó có đang đo đúng tài nguyên bị cạn hay không. Câu hỏi về CPU cũng cùng loại. 94% CPU ổn định nói rằng hệ thống đang làm việc liên tục, không có worker nào treo và không có chờ khoá nào — nó là bằng chứng loại trừ một số giả thuyết, nhưng nó không nói gì về việc hệ thống đang làm việc **đúng thứ tự**. Một hệ thống có thể dùng hết CPU để chạy đúng những công việc làm mọi người khác phải chờ. Nên CPU không phải chỉ báo về độ trễ, và ở đây hai đại lượng cùng cao một cách hoàn toàn hợp lý. Về cách sửa trong giới hạn 16 worker, hướng cốt lõi là cách ly tài nguyên: tách hàng đợi theo lớp kích thước và dành riêng worker cho mỗi lớp. Chẳng hạn 12 worker chỉ nhận việc ngắn và 4 worker nhận việc dài. Khi đó việc ngắn không bao giờ xếp sau việc dài, nên trung vị quay về gần mức cũ; việc dài chạy chậm hơn vì chỉ có 4 worker, nhưng với công việc hàng chục phút thì độ trễ thêm không thay đổi trải nghiệm nhiều. Điều quan trọng là cách này không cần thêm worker, nên nó thoả ràng buộc, và nó cũng không từ chối công việc nào. Cái nó cần là một cách ước lượng kích thước **trước khi** chạy — thường suy được từ kích thước dữ liệu đầu vào, hoặc từ lịch sử của khách hàng gửi việc. Tôi sẽ đo xem ước lượng đó chính xác đến đâu, vì một ước lượng sai đưa việc dài vào làn việc ngắn và tái tạo lại đúng vấn đề. Nếu không ước lượng được kích thước, hướng đúng là chiếm quyền: cắt công việc dài thành từng lát và cho worker trả về hàng đợi giữa các lát. Khi đó một việc dài không giữ worker liên tục, và hệ thống hành xử gần với công việc ngắn nhất trước mà không cần biết trước độ dài của gì cả — đó là lý do tôi thấy chiếm quyền là lời giải tổng quát hơn, dù nó đòi thay đổi cách công việc được viết. Và song song với việc sửa, tôi đổi cách theo dõi: một con số trung vị gộp cho mọi loại công việc đã che mất sự cố này ba tuần. Tôi muốn phân vị độ trễ tách theo lớp kích thước, cùng với thời gian chờ trong hàng đợi tách khỏi thời gian chạy — vì hai đại lượng đó chỉ vào hai nguyên nhân khác nhau, và gộp chúng lại là lý do đội đã đi tìm nguyên nhân ở chỗ CPU.",
    redFlags: [
      "Kết luận hệ thống thiếu CPU vì CPU ở 94%",
      "Đề nghị thêm worker, trái ràng buộc",
      "Từ chối hoặc giới hạn công việc lớn, trái ràng buộc",
      "Chuyển sang công việc ngắn nhất trước mà không nói làm sao biết độ dài trước khi chạy",
      "Không nhận ra 6% được đo theo số công việc chứ không theo thời gian worker",
      "Giữ một chỉ số trung vị gộp sau khi sửa",
    ],
    probes: [
      "Nếu ước lượng kích thước sai thì hệ thống hành xử thế nào?",
      "Chiếm quyền đòi thay đổi gì trong cách công việc được viết?",
      "Bạn chia 16 worker theo tỉ lệ nào, và suy ra từ số nào?",
    ],
    refs: ["sysprog-10"],
  },

  // ===== spiq-vm (sysprog-iq17–sysprog-iq20) =====
  {
    id: "sysprog-iq17",
    field: "sysprog",
    topic: "spiq-vm",
    level: 1,
    minutes: 6,
    question: "Địa chỉ ảo được dịch thành địa chỉ vật lý ra sao? Và page fault là gì — nó luôn là lỗi không?",
    mustCover: [
      "Mọi địa chỉ mà chương trình dùng là **địa chỉ ảo**; MMU dịch nó thành địa chỉ vật lý",
      "Địa chỉ ảo được tách thành **số page** và **offset** trong page",
      "MMU tra số page trong **page table** để tìm **frame** vật lý tương ứng, rồi ghép với offset",
      "Mỗi tiến trình có page table riêng, nên hai tiến trình dùng cùng địa chỉ ảo mà chạm tới bộ nhớ khác nhau — đó là nền của cách ly bộ nhớ",
      "Page table nhiều cấp tồn tại vì một bảng phẳng cho toàn bộ không gian địa chỉ sẽ **quá lớn**",
      "Mỗi mục page mang các **bit** điều khiển: có hợp lệ không, đọc được không, ghi được không, thực thi được không",
      "**Page fault** là khi MMU không hoàn tất được việc dịch và trao quyền cho kernel xử lý",
      "Nó **không** luôn là lỗi — phần lớn page fault là bình thường và cần thiết",
      "Ví dụ hợp lệ: page chưa được nạp vào bộ nhớ, nên kernel nạp nó rồi cho lệnh chạy lại",
      "Ví dụ là lỗi thật: địa chỉ không hợp lệ, hoặc ghi vào page chỉ đọc — khi đó kernel báo lỗi cho tiến trình",
      "Nên page fault là một **cơ chế**, và việc nó là lỗi hay không phụ thuộc vào các bit trên page",
    ],
    model: "Điểm khởi đầu là: mọi địa chỉ mà chương trình nhìn thấy đều là địa chỉ ảo, không phải địa chỉ trong thanh RAM. Việc dịch do MMU làm, và nó hoạt động bằng cách tách địa chỉ ảo thành hai phần — số page và offset trong page đó. MMU tra số page trong page table của tiến trình để tìm frame vật lý tương ứng, rồi ghép frame ấy với offset để có địa chỉ vật lý. Offset đi qua nguyên vẹn, chỉ phần page được dịch, và đó là lý do việc dịch chỉ cần một bảng theo page thay vì theo từng byte. Hệ quả quan trọng nhất của thiết kế này là cách ly: mỗi tiến trình có page table riêng, nên hai tiến trình dùng cùng một địa chỉ ảo hoàn toàn có thể đang chạm tới hai frame vật lý khác nhau. Đó là nền của việc một tiến trình không đọc được bộ nhớ của tiến trình khác — không phải vì có ai kiểm tra từng lần truy cập, mà vì địa chỉ của nó đơn giản không dịch tới đó. Về page table nhiều cấp, lý do tồn tại là kích thước: một bảng phẳng phủ toàn bộ không gian địa chỉ ảo của một tiến trình sẽ lớn đến mức vô lý, dù tiến trình chỉ dùng một phần rất nhỏ. Nhiều cấp cho phép chỉ tạo những phần bảng thực sự cần, đổi lấy việc mỗi lần dịch phải tra nhiều cấp — và đó là lý do tồn tại của bộ đệm dịch địa chỉ trong CPU. Mỗi mục trong page table còn mang các bit điều khiển: page này có hợp lệ không, đọc được không, ghi được không, thực thi được không. Những bit đó là chỗ thực thi việc bảo vệ bộ nhớ, và chúng dẫn trực tiếp sang câu hỏi thứ hai. Page fault là khi MMU không hoàn tất được việc dịch và trao quyền cho kernel. Và tôi muốn trả lời phần \"có luôn là lỗi không\" một cách dứt khoát: không, phần lớn page fault là bình thường và cần thiết. Trường hợp phổ biến nhất là page đó hợp lệ nhưng chưa có trong bộ nhớ — nó chưa được nạp lần nào, hoặc đã bị đẩy ra đĩa. Kernel nạp page, cập nhật page table, rồi cho lệnh gây fault chạy lại; chương trình không biết gì cả. Đây chính là cơ chế cho phép một tiến trình có không gian địa chỉ lớn hơn RAM, và cũng là cơ chế đằng sau việc chia sẻ bộ nhớ và ánh xạ tệp. Page fault chỉ là lỗi thật khi địa chỉ không hợp lệ, hoặc khi thao tác vi phạm các bit trên page — ghi vào page chỉ đọc, thực thi page không cho thực thi — và khi đó kernel báo lỗi cho tiến trình, thường bằng một tín hiệu làm nó sập. Nên cách tôi nghĩ về page fault là: nó là một cơ chế trao quyền cho kernel, và việc nó dẫn tới nạp page hay dẫn tới sập phụ thuộc vào các bit trên page ấy.",
    redFlags: [
      "Nói page fault luôn là lỗi của chương trình",
      "Cho rằng offset cũng được dịch qua bảng",
      "Không giải thích được vì sao cần page table nhiều cấp",
      "Nói cách ly bộ nhớ đến từ việc kernel kiểm tra từng lần truy cập",
    ],
    probes: [
      "Vì sao một tiến trình có thể có không gian địa chỉ lớn hơn RAM?",
      "Bit chỉ đọc trên page được dùng cho những tính năng nào?",
      "Page table nhiều cấp đổi lấy cái gì?",
    ],
    refs: ["sysprog-09"],
  },
  {
    id: "sysprog-iq18",
    field: "sysprog",
    topic: "spiq-vm",
    level: 2,
    minutes: 10,
    code: {
      lang: "c",
      text: `int main(void) {
    int fd[2];
    pipe(fd);                          // fd[0] đọc, fd[1] ghi

    pid_t p = fork();
    if (p > 0) {
        // cha: gửi 3 thông điệp rồi chờ con
        write(fd[1], "mot", 3);
        write(fd[1], "hai", 3);
        write(fd[1], "ba!", 3);
        wait(NULL);                    // (1) treo ở đây
    } else {
        // con: đọc từng byte và in
        char c;
        while (read(fd[0], &c, 1) > 0)  // (2) không bao giờ trả về 0
            putchar(c);
    }
    return 0;
}

// Chương trình in "mothaiba!" rồi treo vĩnh viễn.
// Biến thể thứ hai: cha thêm close(fd[0]) rồi ghi 1 MB — nó bị treo giữa lúc ghi.`,
    },
    question: "Vì sao treo, và vì sao biến thể thứ hai treo ở chỗ khác? Sửa cả hai, và nói rõ quy tắc chung.",
    mustCover: [
      "Treo thứ nhất: `read` trên pipe **chặn** chừng nào còn ít nhất một bên ghi đang mở",
      "`read` chỉ trả về 0 khi **mọi** file descriptor trỏ tới đầu ghi đã được đóng",
      "Sau `fork`, có **hai** đầu ghi đang mở: `fd[1]` của cha và `fd[1]` của con",
      "Nên kể cả khi cha đóng `fd[1]`, con vẫn giữ một bản của nó — vòng lặp không bao giờ kết thúc",
      "Cha thì chờ ở `wait` một tiến trình con không bao giờ thoát → cả hai treo nhau",
      "Sửa: mỗi bên **đóng đầu mình không dùng** ngay sau `fork` — cha đóng `fd[0]`, con đóng `fd[1]`",
      "Rồi cha đóng `fd[1]` khi gửi xong, để `read` của con trả về 0",
      "Treo thứ hai khác cơ chế: pipe có **dung lượng hữu hạn**, và `write` chặn khi pipe đầy",
      "Trong biến thể đó cha đóng đầu **đọc** của chính mình nhưng con vẫn không đọc gì, nên 1 MB làm pipe đầy",
      "Sửa: thiết kế để pipe **liên tục được đọc**, chứ không tăng dung lượng pipe",
      "Quy tắc chung: pipe nên đi **một chiều** — một bên chỉ ghi, một bên chỉ đọc, và mỗi bên đóng đầu không dùng",
      "Và nếu mọi đầu đọc đã đóng mà ta còn ghi, `write` sinh **`SIGPIPE`**, mặc định là kết thúc tiến trình",
    ],
    model: "Hai lần treo, hai cơ chế khác nhau, và cả hai đều truy về một quy tắc duy nhất nên tôi sẽ dẫn tới đó. Lần treo thứ nhất nằm ở dòng (2), và nó dựa trên đúng một sự thật về pipe: `read` chặn chừng nào còn ít nhất một bên ghi đang mở, và nó chỉ trả về 0 khi **mọi** file descriptor trỏ tới đầu ghi đã được đóng. Ở đây, `fork` nhân bản toàn bộ bảng file descriptor, nên sau khi fork có hai đầu ghi mở: `fd[1]` của cha và `fd[1]` của con. Con không dùng đầu ghi, nhưng nó vẫn giữ một bản đang mở — nên số bên ghi không bao giờ về 0, `read` không bao giờ trả về 0, và vòng lặp chạy mãi. Đây là chỗ tôi thấy nhiều người nhầm nhất: đóng đầu ghi ở phía cha là **không đủ**, vì bản của con vẫn còn. Hậu quả tiếp theo là cha treo ở dòng (1): nó `wait` một tiến trình con sẽ không bao giờ thoát, nên hai bên treo nhau — và triệu chứng đúng như mô tả, in xong đủ chín ký tự rồi dừng mãi. Cách sửa là một thao tác mà tôi coi là bắt buộc sau mọi `fork` có pipe: mỗi bên đóng ngay đầu mình không dùng. Cha đóng `fd[0]`, con đóng `fd[1]`. Sau đó cha đóng `fd[1]` khi đã gửi xong, và lúc ấy số bên ghi về 0 nên `read` của con trả về 0, vòng lặp kết thúc, con thoát, `wait` của cha trả về. Một cách chữa khác là quy ước một dấu hiệu kết thúc thông điệp — con thoát khi thấy ký tự `!` — nhưng tôi coi đó là cách chữa yếu hơn: nó gắn tính đúng đắn vào nội dung dữ liệu, nên nó vỡ ngay khi dữ liệu chứa ký tự đó. Biến thể thứ hai treo ở chỗ khác vì cơ chế khác: pipe có dung lượng hữu hạn, và `write` chặn khi pipe đầy. Trong biến thể đó cha đóng `fd[0]` của chính nó — đúng — nhưng con lại không đọc gì, nên khi cha ghi 1 MB thì pipe nhanh chóng đầy và `write` chặn giữa lúc ghi, đợi một lần đọc không bao giờ đến. Cách sửa đúng là thiết kế để pipe liên tục được đọc, chứ không phải tăng dung lượng pipe — tăng dung lượng chỉ dịch ngưỡng và lỗi quay lại với dữ liệu lớn hơn. Có một chi tiết đáng nói về tính nguyên tử ở đây: các lần ghi vào pipe là nguyên tử cho tới kích thước pipe, nhưng khi pipe gần đầy thì một lần ghi có thể chỉ thành công một phần — nên nếu có nhiều bên ghi, các thông điệp có thể lẫn vào nhau. Quy tắc chung mà cả hai lần treo dẫn tới: pipe nên đi một chiều. Một tiến trình chỉ ghi, một tiến trình chỉ đọc, và mỗi bên đóng đầu nó không dùng ngay sau `fork`. Nếu không làm vậy thì ngoài chuyện treo, còn có nguy cơ một tiến trình đọc lại chính dữ liệu nó vừa ghi cho bên kia. Và mặt còn lại của quy tắc: nếu mọi đầu đọc đã đóng mà ta còn ghi, `write` sinh ra `SIGPIPE`, mà mặc định của `SIGPIPE` là kết thúc tiến trình. Đó là hành vi có chủ ý và nó là thứ làm `cat /dev/urandom | head -n 20` hoạt động được — `head` thoát sau 20 dòng, `cat` nhận `SIGPIPE` và chết thay vì chạy mãi. Nếu ta muốn xử lý tình huống đó thành một lỗi trả về thay vì bị kết thúc thì phải cấu hình tường minh.",
    redFlags: [
      "Chỉ đóng `fd[1]` ở phía cha và coi là xong",
      "Tăng dung lượng pipe để chữa biến thể thứ hai",
      "Dùng dấu hiệu kết thúc thông điệp làm lời giải chính",
      "Không biết `read` chỉ trả về 0 khi mọi bên ghi đã đóng",
      "Thêm `sleep` để \"cho con kịp đọc\"",
    ],
    probes: [
      "Vì sao đóng đầu ghi ở phía cha là không đủ?",
      "`SIGPIPE` bảo vệ ta khỏi điều gì, và khi nào bạn muốn thay nó bằng một lỗi trả về?",
      "Nhiều bên cùng ghi vào một pipe thì có an toàn không?",
    ],
    refs: ["sysprog-09"],
  },
  {
    id: "sysprog-iq19",
    field: "sysprog",
    topic: "spiq-vm",
    level: 3,
    minutes: 10,
    question: "Hai tiến trình cần trao đổi dữ liệu. Chọn pipe, bộ nhớ chia sẻ qua `mmap`, hay một tệp?",
    tradeoffs: [
      {
        option: "Pipe",
        when: "Mặc định cho dữ liệu **dạng luồng** một chiều, nhất là giữa cha và con. Đồng bộ hoá có sẵn: bên đọc chặn khi rỗng, bên ghi chặn khi đầy, và đóng đầu ghi báo hiệu kết thúc. Đổi lại: dữ liệu bị **sao chép** qua kernel, và nó là luồng byte nên không có khái niệm thông điệp.",
      },
      {
        option: "Bộ nhớ chia sẻ qua `mmap`",
        when: "Khi dữ liệu **lớn** hoặc cần truy cập ngẫu nhiên. Nhanh nhất vì không sao chép — hai tiến trình ánh xạ cùng frame vật lý. Đổi lại: **không có đồng bộ hoá nào sẵn**, ta phải tự lo, và đó là phần khó thật.",
      },
      {
        option: "Tệp",
        when: "Khi dữ liệu cần **sống lâu hơn** hai tiến trình, hoặc khi hai bên không chạy cùng lúc. Đơn giản và quan sát được. Đổi lại: chậm nhất, và không có cơ chế báo hiệu nào nên bên đọc phải tự biết khi nào dữ liệu đã đủ.",
      },
    ],
    mustCover: [
      "Ba câu hỏi phân định: dữ liệu **bao nhiêu**, cần **sống bao lâu**, và hai bên có chạy **cùng lúc** không",
      "Pipe mua được đồng bộ hoá miễn phí: chặn khi rỗng, chặn khi đầy, và có dấu hiệu kết thúc rõ ràng",
      "Đó là giá trị lớn nhất của pipe và là lý do nó là mặc định — phần khó nhất của IPC được lo sẵn",
      "Cái giá của pipe: dữ liệu được **sao chép** qua kernel, nên với dữ liệu lớn thì chi phí sao chép chiếm ưu thế",
      "Và pipe là **luồng byte** không có ranh giới thông điệp, nên ta phải tự đóng khung dữ liệu",
      "`mmap` nhanh nhất vì hai tiến trình ánh xạ **cùng frame vật lý** — không có lần sao chép nào",
      "Nhưng nó **không** kèm đồng bộ hoá, nên ta phải tự có mutex hay semaphore đặt trong chính vùng chia sẻ",
      "Đó mới là phần khó: mọi lỗi race trong vùng chia sẻ đều là lỗi im lặng, không có ai chặn ta",
      "Nên `mmap` chỉ đáng chọn khi lợi ích về sao chép đủ lớn để trả cái giá tự đồng bộ",
      "Tệp là lựa chọn duy nhất khi hai bên **không chạy cùng lúc**, hoặc khi cần dữ liệu tồn tại sau khi tiến trình chết",
      "Và tệp có một ưu điểm bị coi nhẹ: nó **quan sát được** — ta đọc được nội dung khi debug",
      "Hướng kết hợp thường đúng nhất: **`mmap` cho dữ liệu, pipe cho tín hiệu** — mỗi cơ chế làm đúng việc nó giỏi",
    ],
    model: "Tôi phân định bằng ba câu hỏi: dữ liệu bao nhiêu, cần sống bao lâu, và hai bên có chạy cùng lúc không. Pipe là mặc định của tôi cho dữ liệu dạng luồng một chiều, đặc biệt giữa cha và con. Lý do không phải hiệu năng mà là điều nó cho sẵn: đồng bộ hoá. Bên đọc tự chặn khi pipe rỗng, bên ghi tự chặn khi pipe đầy, và việc đóng đầu ghi cho một dấu hiệu kết thúc rõ ràng — `read` trả về 0. Trong IPC thì đồng bộ hoá đúng là phần khó nhất, nên một cơ chế lo sẵn phần đó cho ta là rất đáng giá, và tôi sẽ không đổi nó đi vì hiệu năng khi chưa đo. Cái giá của pipe có hai phần: dữ liệu được sao chép qua kernel, nên với dữ liệu lớn thì chi phí sao chép chiếm ưu thế; và pipe là một luồng byte không có ranh giới thông điệp, nên nếu ta cần biết thông điệp bắt đầu và kết thúc ở đâu thì phải tự đóng khung — thường là gửi độ dài trước rồi gửi nội dung. Bộ nhớ chia sẻ qua `mmap` đứng ở đầu kia: hai tiến trình ánh xạ cùng frame vật lý, nên khi một bên ghi thì bên kia thấy ngay và không có lần sao chép nào. Với dữ liệu lớn hoặc truy cập ngẫu nhiên thì chênh lệch này lớn thật. Nhưng tôi luôn nói cái giá trước khi đề xuất nó, vì nó hay bị trình bày như lời giải nhanh hơn mà không kèm gì: `mmap` không cho ta đồng bộ hoá nào cả. Không có gì chặn khi rỗng, không có gì chặn khi đầy, không có dấu hiệu kết thúc. Ta phải tự đặt mutex hoặc semaphore vào chính vùng chia sẻ ấy, và ta phải tự thiết kế cách báo rằng dữ liệu đã sẵn sàng. Mọi lỗi race trong vùng chia sẻ đều là lỗi im lặng — không ai chặn ta, dữ liệu chỉ đơn giản sai. Nên quyết định chọn `mmap` là quyết định nhận lấy phần khó của IPC, và nó chỉ đáng khi lợi ích về sao chép đủ lớn. Tệp thì thắng ở một chiều mà hai cơ chế kia không có: dữ liệu sống lâu hơn tiến trình. Nếu hai bên không chạy cùng lúc — một tiến trình sinh dữ liệu hôm nay, một tiến trình đọc nó sau khi khởi động lại — thì tệp là lựa chọn duy nhất trong ba cái. Nó chậm nhất và nó không có cơ chế báo hiệu nào, nên bên đọc phải tự biết khi nào dữ liệu đã đủ, thường bằng cách ghi vào tệp tạm rồi đổi tên. Nhưng tệp có một ưu điểm mà tôi thấy bị coi nhẹ: nó quan sát được. Khi có sự cố, tôi đọc được nội dung bằng mắt, còn một vùng bộ nhớ chia sẻ thì phải viết công cụ mới xem được. Với một hệ thống sẽ phải debug lúc hai giờ sáng thì điều đó có giá. Và hướng tôi thấy đúng nhất trong nhiều trường hợp thực tế là kết hợp: dùng `mmap` cho dữ liệu và pipe cho tín hiệu. Bên sản xuất ghi vào vùng chia sẻ rồi gửi một byte qua pipe để báo; bên tiêu thụ chặn ở `read` trên pipe — nên nó không phải quay vòng tiêu CPU — rồi đọc dữ liệu từ bộ nhớ chia sẻ. Cách này lấy được phần nhanh của `mmap` và phần đồng bộ hoá của pipe, mỗi cơ chế làm đúng việc nó giỏi, và nó là mẫu hình tôi sẽ đề xuất đầu tiên khi dữ liệu lớn.",
    redFlags: [
      "Chọn `mmap` vì nhanh mà không nói tới việc phải tự đồng bộ",
      "Cho rằng pipe truyền được thông điệp có ranh giới sẵn",
      "Dùng tệp cho hai tiến trình chạy đồng thời mà không có cách báo hiệu",
      "Không xét hướng kết hợp `mmap` cộng pipe",
      "Quay vòng kiểm tra vùng bộ nhớ chia sẻ để biết dữ liệu đã tới",
    ],
    probes: [
      "Bạn đặt mutex cho vùng bộ nhớ chia sẻ ở đâu, và vì sao?",
      "Bạn đóng khung thông điệp trên pipe như thế nào?",
      "Bên đọc tệp biết dữ liệu đã ghi xong bằng cách nào?",
    ],
    refs: ["sysprog-09"],
  },
  {
    id: "sysprog-iq20",
    field: "sysprog",
    topic: "spiq-vm",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Một dịch vụ phân tích dữ liệu chạy trên máy 32 GB RAM. Sau khi đội tăng kích thước bộ đệm trong tệp cấu hình từ 16 GB lên 26 GB để \"dùng hết RAM\", thông lượng giảm từ 4.200 xuống 90 yêu cầu/giây. Mức dùng CPU giảm từ 85% xuống **11%**, nhưng máy vẫn cực kỳ chậm — ngay cả `ls` trong shell cũng mất vài giây. Không có tiến trình nào bị kill.",
      scale: "Thông lượng giảm 47 lần. Máy còn chạy một tiến trình ghi log và một tiến trình thu số liệu, tổng cộng khoảng 3 GB. Đội đã thử tăng bộ đệm lên 28 GB để \"bù lại\" và tình hình tệ hơn.",
      constraints: "Không thêm RAM trong quý này. Không giảm khối lượng dữ liệu cần phân tích. Phải giải thích được vì sao CPU **giảm** mà máy lại chậm hơn, và vì sao tăng bộ đệm tiếp lại làm tệ hơn.",
      },
    question: "CPU giảm xuống 11% mà máy chậm hơn 47 lần. Chỉ dấu đó loại trừ giả thuyết nào và chỉ vào cơ chế nào?",
    mustCover: [
      "Chỉ dấu quyết định: CPU **giảm** loại trừ mọi giả thuyết về tính toán — hệ thống không bận, nó đang **chờ**",
      "Và việc `ls` trong shell cũng chậm cho biết vấn đề ở **toàn máy**, không riêng dịch vụ",
      "Chẩn đoán: **thrashing** — bộ nhớ cần dùng vượt RAM, nên hệ thống dành phần lớn thời gian đổi page với đĩa",
      "Phép tính: 26 GB bộ đệm + 3 GB tiến trình khác + kernel > 32 GB, nên không đủ chỗ cho tập page đang hoạt động",
      "Cơ chế: mỗi lần truy cập vào page đã bị đẩy ra đĩa gây **page fault**, kernel phải nạp lại từ đĩa",
      "Đọc đĩa chậm hơn RAM nhiều bậc, nên tiến trình dành phần lớn thời gian **chờ I/O** thay vì tính toán — đó là lý do CPU thấp",
      "Và để nạp page mới, kernel phải **đẩy page khác** ra, mà page đó lại đang cần — nên nó bị nạp lại ngay",
      "Vòng lặp đẩy ra–nạp vào đó là thrashing, và nó tự duy trì",
      "Vì sao `ls` cũng chậm: bộ nhớ vật lý là tài nguyên **toàn máy**, nên page của shell cũng bị đẩy ra",
      "Vì sao tăng lên 28 GB làm tệ hơn: nó lấy thêm chỗ, làm tập page trong RAM nhỏ hơn nữa, nên tỉ lệ page fault tăng",
      "Đó là chỗ trực giác \"dùng hết RAM\" sai: RAM còn phải chứa page của kernel, bộ đệm tệp, và mọi tiến trình khác",
      "Đo để xác nhận: **tỉ lệ page fault lớn** và lưu lượng đổi page, cùng với thời gian chờ I/O",
      "Dự đoán cụ thể: page fault lớn phải tăng vọt đúng lúc đổi cấu hình, còn số lệnh CPU thực thi thì giảm",
      "Sửa ngay: hạ bộ đệm xuống mức mà tập page hoạt động **vừa trong** RAM, thấp hơn 16 GB nếu cần",
      "Sửa đúng hơn: xác định kích thước bằng **đo tỉ lệ nhớ đệm và tỉ lệ page fault**, không bằng trừ đi từ tổng RAM",
      "Bài học: bộ đệm lớn hơn chỉ tốt tới ngưỡng RAM; vượt ngưỡng thì đường cong hiệu năng **rơi thẳng đứng**, không giảm dần",
    ],
    model: "Chỉ dấu quyết định là hướng đi của CPU. Nếu hệ thống chậm vì tính toán nhiều hơn thì CPU phải tăng; ở đây nó giảm từ 85% xuống 11% trong khi thông lượng giảm 47 lần. Điều đó loại trừ mọi giả thuyết về tính toán và nói rằng hệ thống không bận — nó đang **chờ**. Dữ kiện thứ hai thu hẹp thêm: `ls` trong shell cũng mất vài giây, nên vấn đề ở toàn máy chứ không riêng tiến trình dịch vụ. Hai điều đó cùng nhau chỉ vào thrashing. Phép tính khớp ngay: 26 GB bộ đệm cộng khoảng 3 GB của hai tiến trình khác, cộng phần kernel và bộ đệm tệp, đã vượt 32 GB. Nên không còn đủ chỗ trong RAM cho tập page mà hệ thống đang thực sự dùng. Cơ chế thì như sau. Khi một page cần dùng không có trong bộ nhớ, việc truy cập gây page fault và kernel phải nạp page ấy từ đĩa. Đọc từ đĩa chậm hơn đọc từ RAM nhiều bậc, nên tiến trình dành phần lớn thời gian chờ I/O thay vì thực thi lệnh — và đó chính xác là lý do CPU thấp. Tệ hơn, để có chỗ nạp page mới, kernel phải đẩy một page khác ra, mà trong tình trạng thiếu chỗ thì page bị đẩy ra rất có thể lại đang được cần, nên nó bị nạp lại gần như ngay sau đó. Vòng lặp đẩy ra rồi nạp vào ấy là thrashing, và nó tự duy trì: càng ít chỗ thì càng nhiều fault, và mỗi fault lại đẩy một page cần thiết khác ra. Điều đó cũng giải thích vì sao `ls` chậm — bộ nhớ vật lý là tài nguyên toàn máy, nên page của shell và của lệnh `ls` cũng bị đẩy ra như mọi page khác; máy không phân biệt việc của ai. Câu hỏi \"vì sao tăng lên 28 GB lại tệ hơn\" thì trả lời được ngay từ cùng cơ chế, và nó là chỗ tôi muốn nói kỹ nhất vì nó phơi ra một trực giác sai. Đội đã nghĩ \"chậm vì bộ đệm chưa đủ lớn, tăng nữa sẽ tốt hơn\", nhưng bộ đệm lấy chỗ từ chính RAM mà mọi thứ khác đang cần, nên tăng nó làm tập page nằm trong RAM nhỏ đi, tỉ lệ page fault tăng, và hệ thống tệ hơn. Trực giác \"dùng hết RAM\" sai vì RAM không phải chỉ dành cho bộ đệm ứng dụng: nó còn phải chứa page của kernel, bộ đệm tệp mà chính hệ thống dùng để đọc dữ liệu, và mọi tiến trình khác. Nên con số đúng không phải tổng RAM trừ đi vài GB dự phòng. Về việc đo để xác nhận, tôi muốn một dự đoán định lượng chứ không chỉ một câu chuyện hợp lý: nếu chẩn đoán đúng thì tỉ lệ **page fault lớn** — loại phải đọc đĩa — phải tăng vọt đúng vào thời điểm đổi cấu hình, lưu lượng đổi page với đĩa phải cao và liên tục, thời gian chờ I/O phải chiếm phần lớn, trong khi số lệnh CPU thực sự thực thi thì giảm. Nếu page fault lớn vẫn thấp mà máy chậm thì giả thuyết của tôi sai và tôi phải đi tìm chỗ khác — chẳng hạn một tranh chấp khoá toàn máy. Việc sửa ngay là hạ kích thước bộ đệm xuống, và tôi sẽ hạ xuống thấp hơn 16 GB chứ không chỉ quay về 16, vì con số 16 chỉ được biết là \"chạy được\" chứ không được biết là tối ưu — có thể nó đã ở gần ngưỡng. Cách xác định đúng thì không phải trừ đi từ tổng RAM mà là đo: tăng dần kích thước bộ đệm và theo hai đường cùng lúc — tỉ lệ nhớ đệm thành công, vốn tăng dần theo kích thước, và tỉ lệ page fault lớn, vốn gần như bằng không rồi bật lên rất dốc khi vượt ngưỡng. Điểm đúng nằm ngay trước chỗ đường thứ hai bật lên. Và bài học tôi muốn ghi lại: quan hệ giữa kích thước bộ đệm và hiệu năng không phải một đường cong giảm dần đều mà có một vách. Dưới ngưỡng RAM, bộ đệm lớn hơn thì tốt hơn; vượt ngưỡng, hiệu năng rơi thẳng đứng chứ không suy giảm nhẹ. Với những tham số có hình dạng như vậy, tôi luôn cấu hình cách ngưỡng một khoảng an toàn, chứ không nhắm vào sát ngưỡng — vì cái giá của việc đoán thiếu và đoán quá là không đối xứng chút nào.",
    redFlags: [
      "Kết luận thiếu CPU hay thiếu worker vì hệ thống chậm",
      "Tăng bộ đệm tiếp để \"bù lại\"",
      "Đề nghị thêm RAM, trái ràng buộc",
      "Chọn kích thước bộ đệm bằng cách trừ đi từ tổng RAM",
      "Không nhận ra CPU giảm là chỉ dấu loại trừ giả thuyết tính toán",
      "Quay về đúng 16 GB mà không đo lại ngưỡng",
    ],
    probes: [
      "Nếu page fault lớn vẫn thấp mà máy chậm thì giả thuyết nào thay thế?",
      "Bạn đo hai đường cong nào để tìm kích thước bộ đệm đúng?",
      "Vì sao page của shell cũng bị ảnh hưởng?",
    ],
    refs: ["sysprog-09", "sysprog-10"],
  },

  // ===== spiq-io (sysprog-iq21–sysprog-iq24) =====
  {
    id: "sysprog-iq21",
    field: "sysprog",
    topic: "spiq-io",
    level: 1,
    minutes: 6,
    question: "Phân biệt hard link và soft link. Điều gì xảy ra khi bạn xoá tệp gốc trong mỗi trường hợp?",
    mustCover: [
      "Một **inode** giữ nội dung và siêu dữ liệu của tệp; **tên tệp** chỉ là một mục trong thư mục trỏ tới inode",
      "Nên tên và tệp là hai thứ khác nhau — đó là chìa khoá của cả câu hỏi",
      "**Hard link** là một mục thư mục nữa trỏ tới **cùng inode** đã có tên khác",
      "Kiểm chứng được: `ls -i` cho thấy hai tên có cùng số inode",
      "Nên không có \"tệp gốc\" trong trường hợp hard link — hai tên hoàn toàn **ngang nhau**",
      "Xoá một trong hai tên chỉ bỏ mục thư mục đó; inode còn sống vì còn tên khác trỏ tới",
      "Hard link chỉ tạo được **trong cùng một hệ thống tệp**, vì số inode chỉ có nghĩa trong hệ thống tệp đó",
      "**Soft link** là một tệp riêng, có inode riêng, nội dung là một **đường dẫn** tới tệp khác",
      "Nên xoá tệp được trỏ tới thì soft link **vẫn tồn tại** nhưng trỏ tới chỗ không còn gì — nó \"treo\"",
      "Soft link trỏ được qua hệ thống tệp khác, và trỏ được tới cả thư mục",
      "Khi nói \"link\" không nói rõ loại, người ta thường nói về **hard link**",
    ],
    model: "Cả câu hỏi này xoay quanh một phân biệt: tên tệp và tệp là hai thứ khác nhau. Nội dung cùng siêu dữ liệu của một tệp nằm trong một inode; còn tên tệp chỉ là một mục trong thư mục, ghi rằng cái tên này ứng với số inode kia. Một khi nắm điều đó thì hai loại link trở nên rõ ràng. Hard link đơn giản là một mục thư mục nữa trỏ tới cùng inode. Tôi kiểm chứng được bằng `ls -i`: hai tên hiện ra với cùng số inode. Hệ quả tôi muốn nhấn là trong trường hợp hard link thì **không có \"tệp gốc\"** — đề bài hỏi \"xoá tệp gốc\" và với hard link thì câu hỏi không có nghĩa, vì hai tên hoàn toàn ngang nhau và không cái nào đặc biệt hơn cái nào. Sửa nội dung qua tên này thì thấy qua tên kia, vì đó là cùng một tệp. Nên xoá một tên chỉ bỏ mục thư mục đó đi; inode vẫn sống vì vẫn còn tên khác trỏ tới, và dữ liệu chỉ thực sự được giải phóng khi không còn tên nào. Một giới hạn của hard link: nó chỉ tạo được trong cùng một hệ thống tệp, vì số inode chỉ có nghĩa trong phạm vi hệ thống tệp chứa nó. Soft link — còn gọi là symbolic link hay symlink — là một cơ chế hoàn toàn khác. Nó là một tệp riêng với inode riêng, và nội dung của nó là một đường dẫn tới tệp khác, cộng với một bit đánh dấu để hệ thống biết đây là link. Nói cách khác, nếu bỏ bit đó đi thì nó chẳng khác gì một tệp văn bản chứa một đường dẫn. Vì vậy `ls -i` cho thấy soft link có số inode **khác** với tệp nó trỏ tới, còn hard link thì cùng số. Và câu trả lời cho phần thứ hai khác hẳn: nếu xoá tệp được trỏ tới, soft link vẫn tồn tại — nó là một tệp riêng mà — nhưng nó trỏ tới một đường dẫn không còn gì, nên nó thành link treo và mọi lần mở qua nó đều lỗi. Điều này cũng là điểm mạnh của soft link theo một nghĩa khác: vì nó lưu đường dẫn chứ không lưu số inode, nó trỏ được qua hệ thống tệp khác và trỏ được tới cả thư mục — hai việc hard link không làm được. Một chi tiết nhỏ về từ ngữ mà tôi luôn nói kèm để tránh nhầm khi đọc tài liệu: khi người ta nói \"link\" mà không nêu rõ loại thì họ đang nói về hard link.",
    redFlags: [
      "Nói hard link là \"bản sao\" của tệp",
      "Cho rằng xoá \"tệp gốc\" làm hard link mất dữ liệu",
      "Không biết hard link giới hạn trong một hệ thống tệp",
      "Cho rằng soft link cũng có cùng số inode với tệp nó trỏ tới",
    ],
    probes: [
      "Vì sao hard link không tạo được qua hai hệ thống tệp?",
      "Bạn phân biệt hai loại link bằng một lệnh nào?",
      "Dữ liệu của một tệp thực sự được giải phóng khi nào?",
    ],
    refs: ["sysprog-12"],
  },
  {
    id: "sysprog-iq22",
    field: "sysprog",
    topic: "spiq-io",
    level: 2,
    minutes: 10,
    code: {
      lang: "c",
      text: `// Giao thức: mỗi thông điệp là 4 byte độ dài (big-endian) rồi nội dung.
void handle_client(int sock) {
    uint32_t len;
    read(sock, &len, 4);                       // (1)
    len = ntohl(len);

    char *buf = malloc(len);                   // (2)
    read(sock, buf, len);                      // (3)
    process(buf, len);
    free(buf);
}

// Ba báo cáo từ môi trường thực tế:
// A. Thông điệp dài đôi khi bị cắt giữa, hoặc lẫn nội dung của thông điệp sau.
// B. Tiến trình đôi khi sập trong process() với thông điệp hợp lệ.
// C. Sau khi bật một cơ chế gửi tín hiệu định kỳ, tỉ lệ lỗi tăng vọt.`,
    },
    question: "Báo cáo C xuất hiện đúng lúc bật cơ chế gửi tín hiệu — đó là manh mối gì? Truy cả ba báo cáo về cùng một giả định sai trong mã.",
    mustCover: [
      "Báo cáo A: `read` trên socket có thể trả về **ít hơn** số byte yêu cầu — đó là \"đọc ngắn\"",
      "TCP là **luồng byte**, không bảo toàn ranh giới thông điệp; một lần gửi có thể tới thành nhiều lần đọc và ngược lại",
      "Nên dòng (1) có thể đọc được 2 trong 4 byte, và dòng (3) có thể đọc được một phần nội dung",
      "Sửa: viết một hàm đọc **lặp cho tới đủ số byte**, gọi `read` nhiều lần và cộng dồn",
      "Báo cáo B: dòng (1) không kiểm giá trị trả về, nên khi `read` thất bại thì `len` là **rác** chưa khởi tạo",
      "`len` rác làm dòng (2) cấp phát sai kích thước và dòng (3) đọc sai số byte → sập trong `process`",
      "`len` đến **từ mạng**, nên nó là dữ liệu không tin cậy và phải có **giới hạn trên** do giao thức quy định",
      "Báo cáo C: tín hiệu **ngắt** một lời gọi hệ thống đang chặn, nên `read` trả về -1 với `errno` là `EINTR`",
      "Đó không phải lỗi — nó nghĩa là \"hãy gọi lại\", nên vòng đọc phải xử lý `EINTR` bằng cách thử lại",
      "Điều này giải thích vì sao lỗi chỉ xuất hiện **sau khi** bật cơ chế gửi tín hiệu",
      "Vòng đọc đúng phải phân biệt ba kết quả: đọc được n > 0 (cộng dồn), trả về 0 (bên kia đóng), -1 (xét `errno`)",
      "Và phải xử lý trường hợp trả về 0 giữa thông điệp — đó là kết nối bị đóng nửa đường, phải hủy thông điệp",
    ],
    model: "Ba báo cáo, ba nguyên nhân độc lập, và cả ba đều nằm ở một chỗ: mã này coi `read` như một hàm đọc đủ số byte và luôn thành công. Báo cáo A là hệ quả trực tiếp của bản chất TCP: nó là một luồng byte, không bảo toàn ranh giới thông điệp. Một lần `write` ở phía bên kia có thể tới thành nhiều lần `read` ở phía ta, và nhiều lần `write` có thể gộp lại thành một. Nên `read` hoàn toàn có thể trả về ít hơn số byte ta yêu cầu — hiện tượng gọi là đọc ngắn — và ở đây nó xảy ra ở cả hai chỗ: dòng (1) có thể chỉ đọc được 2 trong 4 byte độ dài, và dòng (3) có thể chỉ đọc được một phần nội dung. Điều đó giải thích cả hai biểu hiện trong báo cáo A: thông điệp bị cắt giữa khi ta xử lý một bộ đệm chưa đủ, và lẫn nội dung của thông điệp sau khi phần còn lại của thông điệp trước vẫn nằm trong luồng và bị đọc như phần đầu của thông điệp kế tiếp — một khi lệch khung thì mọi thông điệp sau đều sai. Đáng nói là hiện tượng này rất hiếm trong mạng nội bộ nhanh với thông điệp nhỏ, nên mã như thế này thường qua được cả kiểm thử lẫn một thời gian dài ở môi trường thực tế, rồi sai khi gặp thông điệp lớn hoặc mạng chậm. Cách sửa là một hàm đọc lặp: gọi `read` trong vòng lặp, cộng dồn số byte đã nhận, cho tới khi đủ hoặc tới khi gặp một trong các điều kiện kết thúc. Báo cáo B là chuyện không kiểm giá trị trả về. Dòng (1) bỏ qua kết quả của `read`, nên nếu lời gọi thất bại thì `len` không được ghi gì cả và nó giữ giá trị rác của bộ nhớ chưa khởi tạo. Một `len` rác làm dòng (2) cấp phát sai — có thể quá nhỏ — và dòng (3) đọc sai số byte, rồi `process` làm việc trên một bộ đệm không đúng như nó tưởng và sập. Chi tiết \"với thông điệp hợp lệ\" trong báo cáo khớp đúng với chẩn đoán này: thông điệp không sai, lời gọi đọc mới sai. Trong lúc sửa chỗ này tôi cũng thêm một kiểm tra mà mã đang thiếu và nó thuộc loại khác: `len` đến từ mạng, nên nó là dữ liệu không tin cậy và phải có một giới hạn trên do giao thức quy định. Không có giới hạn đó thì một client chỉ cần gửi độ dài bốn tỉ để làm ta cấp phát hết bộ nhớ — một lỗ hổng từ chối dịch vụ rẻ đến mức không cần kỹ năng gì. Báo cáo C là chi tiết tôi thấy đẹp nhất trong bài này, vì nó giải thích được **tại sao đúng lúc đó**. Khi một tín hiệu đến trong lúc một lời gọi hệ thống đang chặn, lời gọi đó bị ngắt và trả về -1 với `errno` là `EINTR`. Đó không phải một lỗi về dữ liệu hay về kết nối — nó nghĩa là \"lời gọi chưa làm gì, hãy gọi lại\". Mã hiện tại không xét `errno`, nên nó coi mọi lần trả về không như ý là một thất bại, và tỉ lệ lỗi tăng vọt đúng vào lúc bật cơ chế gửi tín hiệu định kỳ. Nếu không biết về `EINTR` thì người ta sẽ đi tìm nguyên nhân ở cơ chế gửi tín hiệu, trong khi lỗi luôn ở vòng đọc và chỉ chưa có gì kích hoạt nó. Vòng đọc đúng phải phân biệt ba kết quả của `read`. Trả về n lớn hơn 0 thì cộng dồn và tiếp tục nếu chưa đủ. Trả về 0 nghĩa là bên kia đã đóng kết nối; nếu điều đó xảy ra giữa một thông điệp thì đó là kết nối bị đóng nửa đường và ta phải hủy thông điệp dở, không được xử lý nó. Trả về -1 thì phải xét `errno`: `EINTR` thì thử lại, và với socket không chặn thì `EAGAIN` hay `EWOULDBLOCK` cũng không phải lỗi mà nghĩa là dữ liệu chưa tới; còn lại mới là lỗi thật và ta đóng kết nối. Tôi sẽ viết hàm đó một lần rồi dùng cho mọi chỗ đọc, vì đây đúng là loại logic mà mỗi lần viết lại là một lần có cơ hội bỏ sót một nhánh.",
    redFlags: [
      "Chỉ thêm kiểm giá trị trả về mà không viết vòng đọc cho đủ byte",
      "Coi `EINTR` là lỗi và đóng kết nối",
      "Thêm `sleep` trước `read` để \"chờ dữ liệu tới đủ\"",
      "Tin `len` từ mạng mà không đặt giới hạn trên theo giao thức",
      "Xử lý thông điệp dở khi `read` trả về 0 giữa đường",
      "Kết luận cơ chế gửi tín hiệu định kỳ là nguyên nhân cần bỏ",
    ],
    probes: [
      "Vì sao lỗi đọc ngắn thường không xuất hiện trong kiểm thử?",
      "Giới hạn trên của `len` bạn chọn bao nhiêu, và suy từ đâu?",
      "`EINTR` và `EAGAIN` khác nhau thế nào về ý nghĩa?",
    ],
    refs: ["sysprog-11", "sysprog-13"],
  },
  {
    id: "sysprog-iq23",
    field: "sysprog",
    topic: "spiq-io",
    level: 3,
    minutes: 11,
    question: "Server cần phục vụ nhiều kết nối đồng thời. Chọn một thread cho mỗi kết nối, `select`, hay `epoll`?",
    tradeoffs: [
      {
        option: "Một thread (hoặc tiến trình) cho mỗi kết nối",
        when: "Khi số kết nối **vừa phải** — hàng trăm tới vài nghìn. Mã đọc tuần tự nên dễ viết và dễ debug nhất, và hệ điều hành lo phần lập lịch. Đổi lại: mỗi thread tốn stack và mỗi lần chuyển ngữ cảnh tốn thời gian, nên nó không lên được hàng chục nghìn.",
      },
      {
        option: "`select`",
        when: "Khi cần một API **theo POSIX** và số file descriptor nhỏ. Nhưng nó phải duyệt **tuyến tính** qua từng descriptor mỗi lần gọi, và nếu trạng thái đổi giữa lúc duyệt thì phải bắt đầu lại — nên nó kém hiệu quả với tập lớn. Phần lớn trường hợp có lựa chọn tốt hơn.",
      },
      {
        option: "`epoll`",
        when: "Khi cần nhiều nghìn kết nối trên Linux. Nó cho biết **chính xác** descriptor nào đã sẵn sàng thay vì để ta duyệt, và cho gắn kèm một mẩu dữ liệu vào mỗi descriptor. Đổi lại: **không thuộc POSIX** nên không di động, và mã theo mô hình sự kiện khó đọc hơn hẳn.",
      },
    ],
    mustCover: [
      "Trục phân định đầu tiên: **số kết nối đồng thời** dự kiến, chứ không phải số yêu cầu mỗi giây",
      "Một thread cho mỗi kết nối là mặc định đúng cho hàng trăm tới vài nghìn kết nối",
      "Ưu điểm thật của nó là **mã đọc tuần tự** — dễ viết, dễ debug, và không có máy trạng thái nào phải quản",
      "Cái giá: bộ nhớ cho stack của mỗi thread, và chi phí chuyển ngữ cảnh tăng theo số thread",
      "`select` cần **I/O không chặn** và nó duyệt tuyến tính qua từng descriptor, nên chi phí tăng theo tổng số descriptor",
      "Tệ hơn: nếu trạng thái đổi trong lúc duyệt thì nó phải bắt đầu lại",
      "Một bẫy cài đặt của `select`: các tập descriptor là **tham số vào và ra**, nên phải lưu bản sao trước mỗi lần gọi",
      "`epoll` không duyệt — nó trả về **chính** những descriptor sẵn sàng, nên chi phí theo số sự kiện chứ không theo tổng số kết nối",
      "Và nó cho gắn một mẩu dữ liệu vào mỗi descriptor, giúp tìm ngay trạng thái của kết nối đó",
      "Cái giá: `epoll` **không** thuộc POSIX nên chỉ có trên Linux",
      "Và cái giá lớn hơn, thường bị đánh giá thấp: mô hình sự kiện buộc ta tự giữ **máy trạng thái** cho từng kết nối",
      "Nên với cùng một logic, mã theo `epoll` khó đọc và khó debug hơn nhiều so với mã tuần tự",
      "Và với mọi hướng không chặn, phải xử lý đúng `EAGAIN`, đọc ngắn, và ghi ngắn — chúng trở thành đường đi bình thường",
    ],
    model: "Trục phân định đầu tiên của tôi là số kết nối **đồng thời**, chứ không phải số yêu cầu mỗi giây — hai con số đó rất khác nhau, và một server phục vụ nhiều yêu cầu trên ít kết nối thì không cần tới hướng không chặn chút nào. Với hàng trăm tới vài nghìn kết nối, tôi chọn một thread cho mỗi kết nối, và lý do chính không phải hiệu năng mà là hình dạng của mã: mỗi thread đọc tuần tự, xử lý, ghi trả lời, theo đúng thứ tự mà logic nghiệp vụ diễn ra. Không có máy trạng thái nào phải quản, ngăn xếp lời gọi khi có lỗi nói đúng chỗ sai, và việc debug là việc bình thường. Cái giá thì đo được: mỗi thread tốn stack, và chi phí chuyển ngữ cảnh tăng theo số thread — nên mô hình này gặp tường ở khoảng hàng nghìn, không phải hàng chục nghìn. `select` là bước tiếp theo về mặt lịch sử và tôi sẽ nói thẳng rằng tôi ít chọn nó. Nó đòi ta đặt file descriptor sang chế độ không chặn, và nó cho ta chờ nhiều descriptor cùng lúc — nhưng cơ chế của nó là duyệt tuyến tính qua từng descriptor mỗi lần gọi, nên chi phí tăng theo **tổng số** descriptor chứ không theo số descriptor đang có việc. Với một server mười nghìn kết nối mà chỉ vài chục đang hoạt động thì đó là công việc lãng phí lặp lại mãi. Nó còn phải bắt đầu lại nếu trạng thái các descriptor đổi trong lúc duyệt. Và nó có một bẫy cài đặt mà tôi luôn nhắc: các tập descriptor truyền vào `select` vừa là tham số vào vừa là tham số ra — sau khi trả về, chúng đã bị ghi đè để chỉ còn những descriptor sẵn sàng. Nên nếu ta gọi `select` trong vòng lặp thì phải giữ một bản sao và dựng lại tập trước mỗi lần gọi; quên điều đó thì vòng lặp thứ hai chỉ chờ đúng những descriptor đã sẵn sàng lần trước, và mã trông như hoạt động một lúc rồi treo. `epoll` giải đúng nhược điểm cốt lõi: nó không để ta duyệt mà trả về chính những descriptor đã sẵn sàng, nên chi phí tỉ lệ với số sự kiện thay vì tổng số kết nối. Nó còn cho gắn một mẩu dữ liệu — một chỉ số mảng hay con trỏ — vào mỗi descriptor, nên từ một sự kiện ta tìm ngay được trạng thái của kết nối tương ứng mà không cần bảng tra riêng. Với nhiều nghìn kết nối trên Linux thì đó là lựa chọn đúng. Hai cái giá thì tôi nêu theo thứ tự quan trọng ngược với thứ tự người ta thường nói. Cái giá hay được nói là tính di động: `epoll` không thuộc POSIX nên nó chỉ có trên Linux, và nếu mã phải chạy nơi khác thì ta cần một tầng trừu tượng. Cái giá lớn hơn và hay bị đánh giá thấp là hình dạng mã: mô hình sự kiện buộc mỗi kết nối phải có một máy trạng thái tường minh, vì một lần xử lý sự kiện không thể chặn để chờ phần còn lại của thông điệp. Cùng một logic nghiệp vụ, bản `epoll` dài hơn, khó đọc hơn, và khó debug hơn rõ rệt so với bản tuần tự — nên tôi coi việc chuyển sang nó là một quyết định phải được biện minh bằng số kết nối, không phải bằng cảm giác rằng nó hiện đại hơn. Và một điều đúng với cả `select` lẫn `epoll`: khi đã dùng I/O không chặn thì đọc ngắn, ghi ngắn và `EAGAIN` không còn là trường hợp biên mà trở thành đường đi bình thường — `write` trả về số byte nó gửi được, có thể ít hơn nhiều so với ta yêu cầu, và ta phải giữ phần còn lại để gửi sau. Phần logic đó là nơi phát sinh phần lớn lỗi trong các server viết theo hướng này, nên tôi viết nó một lần cho cẩn thận rồi dùng lại, thay vì rải ra từng chỗ xử lý.",
    redFlags: [
      "Chọn `epoll` cho một server vài trăm kết nối",
      "Chọn `select` cho mười nghìn kết nối",
      "Không nói tới việc `select` ghi đè các tập descriptor",
      "Bỏ qua cái giá về độ phức tạp của mô hình sự kiện",
      "Dùng I/O không chặn mà không xử lý ghi ngắn",
    ],
    probes: [
      "Con số nào khiến bạn rời khỏi mô hình một thread cho mỗi kết nối?",
      "Ghi ngắn xử lý thế nào trong một server theo `epoll`?",
      "Vì sao chi phí của `select` tăng theo tổng số descriptor?",
    ],
    refs: ["sysprog-11"],
  },
  {
    id: "sysprog-iq24",
    field: "sysprog",
    topic: "spiq-io",
    level: 4,
    minutes: 14,
    incident: {
      symptom: "Máy chủ báo phân vùng `/var` đầy 100%. Nhưng khi đội đếm dung lượng các tệp trong `/var` thì tổng chỉ khoảng 12 GB trên phân vùng 80 GB. Đội đã xoá tệp log lớn nhất — 46 GB — hai giờ trước, và dung lượng trống **không** tăng lên chút nào. Dịch vụ vẫn đang ghi log bình thường và không báo lỗi.",
      scale: "Phân vùng 80 GB. Công cụ đếm theo tệp nói 12 GB đã dùng; công cụ đếm theo phân vùng nói 80 GB đã dùng. Chênh 68 GB. Dịch vụ ghi khoảng 3 GB log mỗi giờ.",
      constraints: "Không được khởi động lại dịch vụ trong giờ cao điểm — còn 4 giờ nữa mới hết. Phải giải phóng chỗ **ngay**. Phải giải thích được vì sao xoá tệp không giải phóng chỗ, và vì sao hai công cụ báo hai con số khác nhau.",
      },
    question: "Hai công cụ báo hai con số khác nhau. Cái gì tạo ra 68 GB chênh lệch, và bạn giải phóng chỗ ngay bằng cách nào?",
    mustCover: [
      "Chẩn đoán: tệp đã bị xoá nhưng một tiến trình **vẫn giữ nó mở**, nên dữ liệu chưa được giải phóng",
      "Cơ chế: xoá tệp chỉ bỏ **mục thư mục** trỏ tới inode, không xoá inode",
      "Inode chỉ được giải phóng khi **không còn tên nào** trỏ tới **và** không còn file descriptor nào mở nó",
      "Nên một tiến trình đang ghi vào tệp đã xoá vẫn tiếp tục ghi, và dung lượng vẫn tăng",
      "Đó là lý do hai công cụ báo khác nhau: công cụ đếm theo **tên** không thấy tệp không còn tên",
      "Còn công cụ đếm theo **phân vùng** thấy đúng, vì các block vẫn đang được chiếm",
      "Nói cách khác không công cụ nào sai — chúng đo hai thứ khác nhau, và chênh lệch chính là **bằng chứng** của chẩn đoán",
      "Và điều này giải thích vì sao dịch vụ không báo lỗi: file descriptor của nó vẫn hợp lệ, việc ghi vẫn thành công",
      "Khoanh vùng: liệt kê các file descriptor đang mở trỏ tới tệp đã bị xoá, tìm PID và kích thước",
      "Giải phóng ngay **không cần khởi động lại**: **ghi rỗng** vào file descriptor đó qua đường trong `/proc`",
      "Cách đó thu hồi block ngay và tiến trình vẫn ghi tiếp bình thường, nên nó thoả ràng buộc giờ cao điểm",
      "Không dùng cách xoá thêm tệp khác — vấn đề không phải thiếu tệp để xoá",
      "Sửa đúng lâu dài: luân chuyển log bằng cách **bảo tiến trình mở lại tệp** sau khi đổi tên, không phải xoá tệp đang mở",
      "Hoặc ghi log ra đầu ra chuẩn và để một tiến trình khác lo việc luân chuyển",
      "Và thêm cảnh báo dựa trên **dung lượng phân vùng**, không dựa trên tổng kích thước tệp — vì chỉ số sau vừa che mất sự cố này",
      "Bài học: xoá một tệp không giải phóng chỗ nếu ai đó còn giữ nó mở; \"tệp\" là inode, không phải tên",
    ],
    model: "Chênh lệch 68 GB giữa hai công cụ không phải một lỗi đo mà là bằng chứng trực tiếp của chẩn đoán, và tôi sẽ dựng chẩn đoán từ chính nó. Xoá một tệp không xoá tệp — nó chỉ bỏ mục thư mục trỏ tới inode. Inode và các block dữ liệu chỉ được giải phóng khi hai điều kiện cùng thoả: không còn tên nào trỏ tới nó, **và** không còn file descriptor nào đang mở nó. Ở đây điều kiện thứ nhất đã thoả từ hai giờ trước, nhưng dịch vụ vẫn giữ tệp log mở và vẫn đang ghi vào đó — nên inode còn sống, các block vẫn bị chiếm, và tệp còn **tiếp tục lớn lên** với khoảng 3 GB mỗi giờ dù nó không còn tên. Từ đó hai con số giải thích được ngay: công cụ đếm theo tên đi qua cây thư mục nên nó không thể thấy một tệp không còn tên nào, và nó báo 12 GB một cách hoàn toàn trung thực; công cụ đếm theo phân vùng hỏi chính hệ thống tệp còn bao nhiêu block rảnh, nên nó báo 80 GB cũng hoàn toàn trung thực. Không công cụ nào sai — chúng đo hai thứ khác nhau, và khoảng cách giữa chúng chính là dung lượng của những tệp đã xoá mà còn đang mở. Tôi coi việc nhận ra điều đó là phần quan trọng nhất, vì nếu không thì đội sẽ tiếp tục đi xoá thêm tệp và tự hỏi vì sao không có gì thay đổi. Chi tiết \"dịch vụ vẫn ghi bình thường và không báo lỗi\" cũng khớp và tôi muốn nêu vì nó dễ gây nhầm: file descriptor của tiến trình vẫn hợp lệ sau khi tên bị xoá, nên mọi lần ghi vẫn thành công. Dịch vụ không có cách nào biết tệp của nó đã không còn tên. Về khoanh vùng, việc đầu tiên là liệt kê các file descriptor đang mở trỏ tới tệp đã bị xoá — công cụ liệt kê tệp đang mở có sẵn cho việc này, và nó cho tôi cả PID lẫn kích thước của từng tệp. Tôi kỳ vọng thấy một mục khoảng 52 GB thuộc tiến trình dịch vụ, tức 46 GB lúc xoá cộng phần ghi thêm trong hai giờ. Nếu tổng các mục đó xấp xỉ 68 GB thì chẩn đoán được xác nhận bằng số, không phải bằng lập luận. Về việc giải phóng chỗ ngay mà không khởi động lại, đây là chỗ ràng buộc của đề bài quyết định phương án. Cách đơn giản nhất là khởi động lại dịch vụ, vì khi tiến trình chết thì file descriptor đóng và block được thu hồi ngay — nhưng ràng buộc cấm điều đó trong bốn giờ nữa. Cách đúng trong tình thế này là ghi rỗng trực tiếp vào chính file descriptor đó qua đường trong `/proc`: hệ thống cho phép truy cập tệp đã xoá qua descriptor của tiến trình đang giữ nó, và việc cắt nội dung về 0 thu hồi các block ngay lập tức. Tiến trình vẫn giữ descriptor hợp lệ và vẫn ghi tiếp bình thường, chỉ mất phần log cũ — mà phần log cũ thì chính đội đã có ý xoá từ hai giờ trước, nên ta không mất gì họ còn muốn giữ. Một lưu ý tôi sẽ nói kèm: nếu tiến trình ghi theo vị trí tuyệt đối thì sau khi cắt, tệp sẽ có một vùng trống ở đầu, nhưng vùng trống đó không chiếm block thật nên nó không ảnh hưởng tới dung lượng. Về cách sửa lâu dài, gốc rễ là quy trình luân chuyển log đang xoá một tệp mà tiến trình vẫn đang mở. Cách làm đúng là đổi tên tệp rồi **báo cho tiến trình mở lại** — thường bằng một tín hiệu mà dịch vụ xử lý bằng cách đóng và mở lại tệp log. Khi đó tệp cũ thực sự mất tên và mất descriptor nên nó được giải phóng. Cách khác gọn hơn về vận hành là để dịch vụ ghi log ra đầu ra chuẩn và giao toàn bộ việc luân chuyển cho một thành phần khác, để ứng dụng không phải biết gì về vòng đời tệp log. Và tôi sẽ đổi cả cảnh báo: hệ thống theo dõi hiện tại rõ ràng đang dựa vào tổng kích thước các tệp, vì đó là con số nói 12 GB và nó đã che mất sự cố này. Cảnh báo phải dựa trên dung lượng phân vùng, và tôi sẽ thêm một cảnh báo riêng cho chênh lệch giữa hai chỉ số đó — vì khoảng cách ấy chính là chỉ báo trực tiếp của lớp sự cố này, và nếu có nó thì đội đã biết nguyên nhân trong vài giây thay vì hai giờ. Bài học ngắn gọn tôi muốn ghi lại là câu đã dẫn cả chẩn đoán: \"tệp\" là inode chứ không phải tên, nên xoá một tên không giải phóng chỗ nếu ai đó còn giữ inode mở.",
    redFlags: [
      "Kết luận một trong hai công cụ đo sai",
      "Tiếp tục xoá thêm tệp để giải phóng chỗ",
      "Khởi động lại dịch vụ trong giờ cao điểm, trái ràng buộc",
      "Đề nghị mở rộng phân vùng như bước đầu tiên",
      "Không nhận ra tệp đã xoá vẫn đang lớn lên 3 GB mỗi giờ",
      "Giữ cảnh báo dựa trên tổng kích thước tệp sau khi sửa",
    ],
    probes: [
      "Bạn kỳ vọng thấy con số nào khi liệt kê file descriptor đang mở, và nó xác nhận điều gì?",
      "Vì sao dịch vụ không nhận được lỗi nào khi ghi vào tệp đã bị xoá?",
      "Quy trình luân chuyển log đúng gồm những bước nào?",
    ],
    refs: ["sysprog-12", "sysprog-04"],
  },
];
