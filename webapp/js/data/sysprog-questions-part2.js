// Ngân hàng câu hỏi System Programming — phần 2
// (sp-deadlock, sp-memory-ipc, sp-io, sp-security).
//
// Nguồn: bản dịch System Programming Coursebook (University of Illinois,
// CS 241) — B. Venkatesh, L. Angrave et al., CC BY 4.0.
// https://github.com/illinois-cs241/coursebook
//
// Mỗi câu trích dẫn mục nguồn trong sách (§X.Y) để nhảy ngược tra cứu.
// Bản ghi sysprog KHÔNG có trường `cert` — chỉ ngân hàng Kubernetes mới có.
// GIỮ NGUYÊN id (spq061–spq110) — thống kê đúng/sai trong localStorage lưu theo id.

export const sysprogQuestionsPart2 = [
  // ===== sp-deadlock — Deadlock & Lập lịch (spq061–spq072) =====
  {
    id: "spq061",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Đoạn mã sau cố ý lấy cả hai khoá hoặc không lấy khoá nào. Nó phá vỡ điều kiện Coffman nào?",
    code: {
      lang: "c",
      text: `// Get both locks or none
pthread_mutex_lock(a);
if (pthread_mutex_trylock(b)) {  /* failure */
  pthread_mutex_unlock(a);
}`,
    },
    options: [
      "Circular wait — thứ tự lấy khoá đã được cố định thành `a` rồi mới tới `b`",
      "Hold and wait — thất bại ở `b` thì `a` được trả lại ngay",
      "Mutual exclusion — `trylock` cho phép hai thread cùng vào vùng tới hạn",
      "No pre-emption — thread thứ hai buộc thread thứ nhất nhả khoá `a`",
    ],
    answer: 1,
    explanation: "Sách minh hoạ cách phá vỡ hold and wait bằng ví dụ hai sinh viên: \"thử lấy bút rồi lấy giấy, và nếu một sinh viên không lấy được giấy thì bỏ bút xuống\". `trylock` ở đây làm y hệt — process không **giữ** `a` trong khi **chờ** `b`. Phương án circular wait hấp dẫn vì đoạn mã quả thật có một thứ tự cố định, nhưng phá vỡ circular wait là lời giải của Dijkstra: đánh số tài nguyên và bắt **mọi** bên luôn lấy số nhỏ trước — điều đoạn mã này không hề bảo đảm. Cái giá phải trả cho việc phá vỡ hold and wait là livelock. (§8.2, §8.4.1, §8.7)",
  },
  {
    id: "spq062",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 1,
    question: "Trong đồ thị cấp phát tài nguyên, một chu trình bảo đảm deadlock trong điều kiện nào?",
    code: null,
    options: [
      "Mọi chu trình đều là deadlock, không cần thêm điều kiện gì",
      "Khi mỗi tài nguyên trong chu trình chỉ cung cấp một thể hiện duy nhất",
      "Khi chu trình có độ dài chẵn, tức là số process trong chu trình bằng số tài nguyên",
      "Khi đồ thị được duyệt bằng DFS chứ không phải bằng BFS",
    ],
    answer: 1,
    explanation: "Sách viết rõ: \"Nếu trong đồ thị cấp phát tài nguyên có một chu trình và mỗi tài nguyên trong chu trình đó chỉ cung cấp duy nhất một thể hiện, thì các process sẽ deadlock.\" Phương án A là hiểu lầm phổ biến nhất — và sách chỉ ra ngay lý do bạn không thấy hệ điều hành đứng hình dù chu trình xảy ra thường xuyên: hệ điều hành có thể chiếm quyền một số process và phá vỡ chu trình. DFS chỉ là cách **phát hiện** chu trình, không quyết định chu trình đó có phải deadlock hay không. (§8.1, §8.2)",
  },
  {
    id: "spq063",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Hai thread thực hiện các lời gọi dưới đây. Nếu sau đó một thread thứ ba gọi `pthread_mutex_lock(m1)`, chuyện gì xảy ra với nó?",
    code: {
      lang: "c",
      text: `// Thread 1
pthread_mutex_lock(m1); // success
pthread_mutex_lock(m2); // blocks

// Thread 2
pthread_mutex_lock(m2); // success
pthread_mutex_lock(m1); // blocks`,
    },
    options: [
      "Nó lấy được `m1` vì thread 1 đã bị chặn nên tạm thời nhả khoá ra",
      "Nó bị chặn vĩnh viễn: `m1` không bao giờ được nhả",
      "Nó nhận mã lỗi `EDEADLK` vì mutex tự phát hiện chu trình và từ chối",
      "Nó phá vỡ deadlock: kernel chiếm quyền `m1` và trao cho thread mới",
    ],
    answer: 1,
    explanation: "Thread 1 và thread 2 đã deadlock: mỗi bên giữ một khoá và chờ khoá bên kia — đúng một chu trình trong đồ thị cấp phát tài nguyên. Thread 3 vì thế cũng chờ mãi, vì `m1` do thread 1 giữ và thread 1 sẽ không bao giờ chạy tiếp để nhả nó. Phương án A là hiểu lầm về ý nghĩa của \"bị chặn\": một thread bị chặn **vẫn giữ** mọi khoá nó đã lấy — chính đó là điều kiện hold and wait. Phương án `EDEADLK` giả định mutex tự lo việc này; sách mô tả phát hiện deadlock là việc **hệ điều hành** làm, chẳng hạn tìm chu trình có hướng trong bảng file descriptor rồi phá vỡ sự nắm giữ của một process. (§8.1, §8.2, §8.3, §8.7)",
  },
  {
    id: "spq064",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Về lời giải \"mỗi triết gia nhặt nĩa trái rồi chờ nĩa phải\", phát biểu nào đúng?",
    code: null,
    options: [
      "Nó deadlock ngay ở vòng lặp đầu tiên vì mọi triết gia hành động đồng thời",
      "Nó không phải lúc nào cũng deadlock, nhưng rốt cuộc sẽ deadlock",
      "Xác suất deadlock tăng dần khi số triết gia quanh bàn tăng lên",
      "Nó chỉ deadlock khi số triết gia là số chẵn, vì các cặp đối xứng nhau",
    ],
    answer: 1,
    explanation: "Sách nói rõ hai điều: \"deadlock không phải lúc nào cũng xảy ra\", và \"rốt cuộc lời giải này **sẽ** deadlock, khiến các thread bị đói\". Phương án về xác suất là bản đảo ngược đúng một chữ của câu tiếp theo trong sách — xác suất deadlock **giảm** dần khi số triết gia tăng lên, chứ không tăng. Và đó chính là điều làm lỗi này nguy hiểm: chạy thử với nhiều triết gia thì chương trình trông như chạy tốt. Phương án A cũng sai vì lịch chạy hiếm khi đối xứng hoàn hảo. (§8.4, §8.4.1)",
  },
  {
    id: "spq065",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Sau khi đổi sang `trylock` — thất bại thì đặt nĩa trái xuống, ngủ, rồi thử lại — hệ thống gặp vấn đề mới nào?",
    code: null,
    options: [
      "Livelock: các triết gia liên tục nhặt lên đặt xuống mà không ai ăn",
      "Deadlock vẫn xảy ra như cũ, chỉ là muộn hơn vài vòng lặp thay vì ngay lập tức",
      "Race condition trên biến đếm số nĩa đang rảnh",
      "Rò rỉ mutex vì `trylock` thất bại vẫn tăng bộ đếm khoá",
    ],
    answer: 0,
    explanation: "Phá vỡ hold and wait loại bỏ deadlock nhưng mở đường cho livelock: nếu tất cả các triết gia cùng lúc nhặt nĩa trái, thử nĩa phải, đặt nĩa trái xuống rồi lặp lại đúng khuôn mẫu đó, không có việc gì được hoàn thành. Phương án \"vẫn deadlock\" hấp dẫn vì nhìn từ bên ngoài cả hai đều là \"chương trình không xong việc\", nhưng sách phân biệt rất rõ: với deadlock hệ điều hành thường biết hai process đang chờ một tài nguyên, còn với livelock các process **trông như vẫn đang làm việc** — nên livelock khó phát hiện hơn nhiều. (§8.2, §8.4.1)",
  },
  {
    id: "spq066",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Lời giải của Stallings dùng semaphore để giới hạn số triết gia được ngồi vào bàn cùng lúc. Với n triết gia và n chiếc nĩa, con số đó là bao nhiêu?",
    code: null,
    options: [
      "n − 1 — bớt đúng một triết gia thì circular wait không thể xảy ra",
      "n / 2 — mỗi triết gia ngồi cách một ghế nên không ai tranh nĩa",
      "1 — chỉ một triết gia được ăn, giống hệt lời giải trọng tài",
      "2 — đủ để hai đầu bàn ăn song song mà không chạm nĩa nhau",
    ],
    answer: 0,
    explanation: "Chứng minh trong sách: đánh số triết gia và tài nguyên, đưa một triết gia bất kỳ ra khỏi bàn; khi đó hai tài nguyên kề chỗ trống chỉ còn **một** triết gia có thể yêu cầu chúng, nên không bao giờ có chuyện một triết gia đòi trong lúc triết gia khác đang giữ. Không còn cách nào sinh ra chu trình, nên circular wait không xảy ra và deadlock không xảy ra. Phương án \"1\" là lời giải trọng tài ngây thơ — cũng không deadlock, nhưng nó là lời giải **khác** và mất đi ưu điểm chính của Stallings: nhiều triết gia có thể cùng ăn. (§8.5, §8.5.1)",
  },
  {
    id: "spq067",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 3,
    question: "Trong lời giải của Dijkstra, các nĩa được đánh số 1..n và mỗi triết gia lấy chiếc có số nhỏ hơn trước. Vì sao triết gia thứ n không bao giờ nhặt nĩa n?",
    code: null,
    options: [
      "Vì nĩa n đã bị triết gia n−1 giữ, nên anh ta chuyển sang nĩa 1",
      "Vì hai nĩa của anh ta là 1 và n, mà nĩa 1 đã bị triết gia 1 giữ",
      "Vì hệ điều hành chiếm quyền anh ta trước khi anh ta kịp lấy nĩa n",
      "Vì semaphore của trọng tài chỉ cho phép n−1 triết gia vào bàn",
    ],
    answer: 1,
    explanation: "Triết gia cuối cùng là người duy nhất mà hai nĩa của mình không liền số: anh ta đứng giữa nĩa n và nĩa 1. Quy tắc \"lấy số nhỏ trước\" buộc anh ta phải lấy nĩa 1 trước, nhưng nĩa 1 đã nằm trong tay triết gia 1 — nên anh ta chờ ở đó và **không** nhặt nĩa n. Nĩa n vì thế còn rảnh cho triết gia n−1, chu trình bị phá. Phương án A đảo ngược thứ tự: nếu anh ta được lấy nĩa n trước thì đó chính là kịch bản deadlock ban đầu. Cái giá của lời giải: phải biết trước tập tài nguyên hữu hạn và mọi bên phải thống nhất cách đánh số. (§8.5.2)",
  },
  {
    id: "spq068",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 3,
    question: "Lời giải trọng tài chứng minh được là không deadlock. Nhưng nó vẫn không bảo đảm điều gì?",
    code: null,
    options: [
      "Rằng hệ thống nói chung có tiến triển — nó có thể kẹt hoàn toàn",
      "Rằng mỗi triết gia đều tiến triển — một người có thể giữ trọng tài mãi",
      "Rằng không có chu trình nào xuất hiện trong đồ thị cấp phát tài nguyên",
      "Rằng hai triết gia ngồi cạnh nhau không cùng cầm một chiếc nĩa",
    ],
    answer: 1,
    explanation: "Sách nói thẳng: cách này ngăn deadlock cho toàn hệ thống, nhưng triết gia phải tự nhả khoá, nên một triết gia ác ý — Descartes, \"vì những Ác quỷ của ông\" — có thể giữ trọng tài mãi mãi. Anh ta tiến triển, hệ thống tiến triển, nhưng không có gì bảo đảm **mỗi** process tiến triển nếu không giả định gì về các process hoặc không có preemption thật sự. Phương án A hấp dẫn vì nghe giống \"không tiến triển thì là deadlock\", nhưng đó đúng là ranh giới: hệ thống vẫn tiến triển, chỉ có một số triết gia bị đói. Phương án về chu trình lại là điều lời giải này **có** bảo đảm — chứng minh dựa đúng vào đó. (§8.5)",
  },
  {
    id: "spq069",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 1,
    question: "Giải thuật Chủ ngân hàng bảo đảm điều gì, và không bảo đảm điều gì?",
    code: null,
    options: [
      "Bảo đảm không deadlock, nhưng hệ thống vẫn có thể livelock",
      "Bảo đảm không livelock, nhưng deadlock vẫn có thể xảy ra",
      "Bảo đảm cả hai, đó là lý do nó được dùng trong hệ điều hành thật",
      "Bảo đảm không starvation, nhưng cần biết trước thứ tự các yêu cầu",
    ],
    answer: 0,
    explanation: "Phụ lục lập luận: mỗi \"khoản vay\" chỉ được chấp thuận khi hệ thống vẫn ở trạng thái an toàn — tức vẫn còn đủ tiền để đáp ứng ít nhất một người nữa — nên \"Vì ta luôn có thể thực hiện thêm một bước nữa, hệ thống không bao giờ có thể deadlock\". Ngay câu sau: \"Tuy nhiên, không có gì đảm bảo hệ thống sẽ không livelock\", và danh sách nhược điểm nhắc lại thẳng thừng: \"Hệ thống có thể livelock\". **Cẩn thận, sách tự mâu thuẫn ở điểm này**: §8.3 giới thiệu giải thuật là \"nhờ đó ngăn được livelock\" — hãy theo phụ lục, nơi khẳng định được lập luận và nhắc lại hai lần. Phương án C bỏ qua ba nhược điểm còn lại: phải biết trước nhu cầu của mỗi process, chạy chậm khi có hàng triệu tài nguyên, và không theo dõi được tài nguyên đến rồi đi. (§17.4, §8.3)",
  },
  {
    id: "spq070",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Một process thiên về tính toán, không có I/O, cần 7 phút thời gian CPU nhưng mất 9 phút đồng hồ thực mới xong. Wait time của nó là bao nhiêu?",
    code: null,
    options: [
      "9 phút — toàn bộ khoảng thời gian từ lúc process đến tới lúc nó kết thúc",
      "2 phút — thời gian nó nằm trên ready queue mà không có CPU",
      "0 phút — nó bắt đầu chạy ngay nên không hề phải chờ",
      "7 phút — thời gian CPU chính là thời gian nó chiếm hàng đợi",
    ],
    answer: 1,
    explanation: "Công thức là `end_time - arrival_time - run_time`, ở đây là 9 − 0 − 7 = 2 phút. Sách gọi tên đúng cái bẫy: \"Một sai lầm phổ biến là cho rằng đó chỉ là thời gian chờ ban đầu trong ready queue\" — việc công việc phải chờ vào lúc nào không quan trọng, tổng vẫn là 2 phút. Phương án \"9 phút\" chính là turnaround time (`end_time - arrival_time`), một thước đo khác; còn response time là `start_time - arrival_time`. (§10.3)",
  },
  {
    id: "spq071",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 2,
    question: "Scheduler Round Robin có thể biểu hiện Convoy Effect không?",
    code: null,
    options: [
      "Không — preemption theo quantum khiến hiện tượng này không thể xảy ra",
      "Có — khi time quantum được đặt quá dài",
      "Không — Convoy Effect chỉ được định nghĩa cho scheduler FCFS",
      "Có — nhưng chỉ khi số process vượt quá số lõi CPU của máy",
    ],
    answer: 1,
    explanation: "Sách khép lại mục Convoy Effect bằng đúng câu này: hiện tượng thường được bàn trong bối cảnh FCFS, \"tuy nhiên, scheduler Round Robin cũng có thể thể hiện Convoy Effect khi time quantum quá dài\". Điều đó nhất quán với một nhận xét khác: khi time quantum tiến tới vô cùng, Round Robin tương đương FCFS. Phương án A là suy luận rất tự nhiên — \"có preemption thì hết convoy\" — nhưng preemption chỉ giúp nếu nó xảy ra đủ sớm; quantum dài nghĩa là các process I/O-intensive vẫn phải nối đuôi sau tác vụ CPU-intensive. (§10.3.1, §10.4.4)",
  },
  {
    id: "spq072",
    field: "sysprog",
    domain: "sp-deadlock",
    difficulty: 3,
    question: "Preemptive Shortest Job First và Shortest Remaining Time First khác nhau ở đâu?",
    code: null,
    options: [
      "PSJF so sánh tổng thời gian chạy; SRTF so sánh thời gian còn lại",
      "PSJF chỉ chiếm quyền khi công việc mới ngắn hơn hẳn một quantum",
      "SRTF là bản không preemptive của PSJF nên không cần context switch",
      "SRTF cần biết trước thời gian chạy, còn PSJF thì ước lượng burst time",
    ],
    answer: 0,
    explanation: "Sách định nghĩa PSJF là chiếm quyền khi công việc mới đến có **tổng thời gian chạy** ngắn hơn tổng thời gian chạy của công việc hiện tại, rồi nói rõ: \"Nếu scheduler muốn so sánh thời gian còn lại ngắn nhất, đó là một biến thể của PSJF gọi là Shortest Remaining Time First\". Phương án D đảo ngược: cả hai đều mắc cùng một nhược điểm là cần biết trước thời gian chạy, và ghi chú kỹ thuật về việc ước lượng burst time bằng trung bình trượt suy giảm theo hàm mũ thuộc về phần SJF nói chung. Lưu ý mọi scheduler không dùng preemption đều có thể gây starvation. (§10.4.1, §10.4.2, §10.2.1)",
  },

  // ===== sp-memory-ipc — Bộ nhớ ảo & IPC (spq073–spq086) =====
  {
    id: "spq073",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Máy 32-bit, page 4KiB, mỗi mục page table làm tròn lên 4 byte. Page table một cấp của MỘT process chiếm bao nhiêu bộ nhớ vật lý?",
    code: null,
    options: [
      "4 KiB — đúng bằng một page",
      "4 MiB — khoảng một triệu mục, mỗi mục 4 byte",
      "16 tỷ byte — mỗi địa chỉ khả dĩ cần 4 byte",
      "10 KiB — một bảng cấp cao và hai bảng con",
    ],
    answer: 1,
    explanation: "Một máy 32-bit với page 4KiB có `2^32 / 2^12` = `2^20` page, tức khoảng một triệu mục. Làm tròn mỗi mục lên 4 byte cho ra 4 MiB cho page table của **một** process. Phương án \"16 tỷ byte\" chính là sơ đồ ngây thơ mà sách bác bỏ ngay ở đầu chương: một bảng cho **mọi địa chỉ khả dĩ**, 4 byte mỗi địa chỉ — nó ngốn hết bộ nhớ của chiếc máy 4GB. Con số 10 KiB thuộc về cách cài đặt hai cấp trong cùng ví dụ. (§9.1, §9.1.1, §9.1.2)",
  },
  {
    id: "spq074",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 3,
    question: "Vì sao page table một cấp không dùng được trên kiến trúc 64-bit?",
    code: null,
    options: [
      "Vì con trỏ 64-bit không đánh địa chỉ được page 4KiB",
      "Vì bảng sẽ cần cỡ 40 petabyte cho mỗi process",
      "Vì MMU chỉ có sẵn mạch điện để dịch địa chỉ ảo dài tối đa 32 bit",
      "Vì TLB không cache được mục của bảng lớn hơn 4 MiB",
    ],
    answer: 1,
    explanation: "Với page 4KiB, máy 64-bit có `2^52` page; mỗi mục cần 52 bit, nên tổng cộng khoảng `2^55` byte — xấp xỉ 40 petabyte — cho page table của một process. Sách chỉ ra thêm điều làm con số này đặc biệt lãng phí: trên kiến trúc 64-bit các địa chỉ rất **thưa**, nên hầu hết mục sẽ chẳng bao giờ được dùng. Đó chính là lý do page table nhiều cấp tồn tại: các bảng con không cần thiết được bỏ trống. Phương án về MMU nhầm giới hạn kích thước bảng với giới hạn phần cứng dịch địa chỉ. (§9.1.1, §9.1.2)",
  },
  {
    id: "spq075",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 1,
    question: "Trên một máy có kích thước page 256 byte, phần nào của địa chỉ ảo là offset?",
    code: null,
    options: [
      "8 bit thấp nhất — phần còn lại là số page",
      "8 bit cao nhất — phần còn lại là số frame",
      "12 bit thấp nhất, luôn luôn, bất kể kích thước page",
      "Không có offset — page 256 byte đủ nhỏ để đánh địa chỉ trực tiếp",
    ],
    answer: 0,
    explanation: "Số bit offset chính là logarit cơ số hai của kích thước page: `256 = 2^8`, nên 8 bit thấp nhất của địa chỉ ảo được dùng nguyên vẹn làm offset, các bit cao còn lại là số page. Sách nêu đúng ví dụ này để đối chiếu với trường hợp page 4KiB, nơi offset là 12 bit. Phương án \"12 bit, luôn luôn\" là bẫy hay gặp nhất — nó biến con số của **một** ví dụ thành quy tắc chung. Offset được coi như một số nhị phân và được cộng vào địa chỉ đầu frame sau khi MMU tìm được frame. (§9.1.1)",
  },
  {
    id: "spq076",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Với page table hai cấp và một lần tra cứu TRƯỢT TLB, một lần truy cập bộ nhớ của chương trình tốn mấy lần truy cập bộ nhớ vật lý?",
    code: null,
    options: [
      "Một — MMU nằm trong CPU nên việc dịch không tốn truy cập bộ nhớ",
      "Ba — hai lần đi qua bảng, một lần lấy dữ liệu",
      "Hai — một lần cho page table và một lần cho dữ liệu",
      "Bốn — hai cấp bảng, một lần cho TLB và một lần cho dữ liệu",
    ],
    answer: 1,
    explanation: "Sách tính thẳng: với page table một cấp máy chậm gấp đôi vì cần hai lần truy cập bộ nhớ; với page table hai cấp thì \"truy cập bộ nhớ giờ chậm gấp ba – cần ba lần truy cập bộ nhớ\" — hai lần để đi qua bảng cấp cao rồi bảng con, một lần để lấy dữ liệu thật. Phương án \"hai\" đúng cho bảng một cấp và vì thế rất dễ chọn nhầm. Chính chi phí này là lý do MMU có TLB: khi trúng TLB, MMU lấy thẳng frame vật lý và bỏ qua toàn bộ chuỗi tra cứu. (§9.1.3)",
  },
  {
    id: "spq077",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Chương trình xin bộ nhớ bằng `sbrk` rồi đọc một byte trong vùng đó mà chưa hề ghi. Loại page fault nào xảy ra?",
    code: null,
    options: [
      "Minor — chưa có ánh xạ nhưng địa chỉ hợp lệ; HĐH có thể trả về 0",
      "Major — page phải được hoán đổi từ đĩa vào bộ nhớ",
      "Invalid — đọc vùng chưa ghi luôn sinh `SIGSEGV`",
      "Không có fault nào — `sbrk` đã cấp phát frame vật lý ngay lúc gọi",
    ],
    answer: 0,
    explanation: "Sách dùng đúng ví dụ này cho page fault **minor**: bộ nhớ được xin bằng `sbrk(2)` nhưng chưa được ghi thì chưa có ánh xạ, tuy vậy địa chỉ vẫn hợp lệ — HĐH tạo page, nạp vào bộ nhớ và đi tiếp, và nếu chỉ đọc thì có thể đi tắt bằng cách trả về 0. Fault **major** dành cho trường hợp ánh xạ chỉ nằm trên đĩa và phải swap vào; xảy ra đủ nhiều thì chương trình bị coi là làm thrash MMU. Phương án cuối là hiểu lầm phổ biến: cấp phát lười biếng không đồng nghĩa với truy cập không hợp lệ. (§9.1.6)",
  },
  {
    id: "spq078",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Bit read-only trên page phục vụ copy-on-write bằng cách nào?",
    code: null,
    options: [
      "Nó khoá page vĩnh viễn nên hệ thống không bao giờ phải tạo bản sao",
      "Chi phí sao chép được hoãn lại cho tới lần ghi đầu tiên",
      "Nó buộc kernel sao chép page ngay khi process con được `fork`",
      "Nó cho phép hai process ghi song song miễn là chúng ghi khác offset",
    ],
    answer: 1,
    explanation: "Sách nêu Copy-On-Write là một trong hai ví dụ của bit read-only: \"chi phí sao chép một page có thể được hoãn lại cho đến khi lần ghi đầu tiên xảy ra\". Cơ chế là đánh dấu page chỉ đọc; mọi nỗ lực ghi sinh page fault, và fault đó được kernel xử lý — lúc ấy mới thực sự sao chép. Phương án về `fork` mô tả đúng cách làm **không có** copy-on-write, tức sao chép ngay lập tức; đó chính là chi phí mà kỹ thuật này sinh ra để tránh. Ví dụ còn lại của bit read-only là chia sẻ thư viện chuẩn C giữa nhiều process. (§9.1.5)",
  },
  {
    id: "spq079",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 3,
    question: "Bit dirty trên page giúp tối ưu điều gì?",
    code: null,
    options: [
      "Page chưa bị ghi có thể bị loại bỏ mà không cần đồng bộ ra đĩa",
      "Page bị ghi được nén lại trước khi đẩy ra đĩa nên tốn ít chỗ hơn",
      "Page bẩn được giữ trong TLB lâu hơn nên lần truy cập sau nhanh hơn",
      "Page bẩn bị cấm chia sẻ giữa các process nên không cần đồng bộ hoá",
    ],
    answer: 0,
    explanation: "Sách mô tả bit dirty như một tối ưu hiệu năng: một page chỉ được đọc có thể bị loại bỏ mà không cần đồng bộ ra đĩa vì nó chưa thay đổi; nếu page bị ghi sau khi được nạp vào, bit dirty bật lên cho biết page phải được ghi trở lại backing store. Cái giá là backing store phải giữ một bản sao của page sau khi nó đã được nạp vào bộ nhớ, nên tại mọi thời điểm có những page tồn tại đồng thời ở cả hai nơi. Phương án về TLB nhầm bit dirty với chính sách thay thế cache — bit dirty nói về việc **đồng bộ ra kho lưu trữ nền**, không phải về việc giữ ánh xạ. (§9.1.5)",
  },
  {
    id: "spq080",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Đoạn mã sau mở file chỉ để đọc rồi `mmap` với `MAP_SHARED` và `PROT_WRITE`. Vấn đề là gì?",
    code: {
      lang: "c",
      text: `int fd = open("data", O_RDONLY);
char *addr = mmap(NULL, size, PROT_READ | PROT_WRITE,
                  MAP_SHARED, fd, 0);
addr[0] = 'l';`,
    },
    options: [
      "Không có vấn đề — `PROT_WRITE` tự nâng quyền của file descriptor",
      "`MAP_SHARED` đòi file descriptor phải được mở với quyền ghi",
      "`MAP_SHARED` chỉ dùng được với `MAP_ANONYMOUS` và `fd` bằng -1",
      "`PROT_WRITE` phải đi kèm `PROT_EXEC` thì lần ghi mới có hiệu lực",
    ],
    answer: 1,
    explanation: "Sách nói rõ ở cả hai chỗ: với `PROT_WRITE`, \"file descriptor bên dưới, trong trường hợp này, phải được mở với quyền ghi, hoặc phải cung cấp một ánh xạ riêng tư\"; và với `MAP_SHARED`, \"file descriptor trong trường hợp này phải được mở với quyền ghi\". Cách sửa nhẹ nhất nếu chỉ cần ghi cục bộ là đổi sang `MAP_PRIVATE` — ánh xạ khi đó chỉ hiển thị với chính process. Phương án A là hiểu lầm về vai trò của các cờ `PROT_*`: chúng khai báo chế độ bảo vệ bộ nhớ, không cấp thêm quyền cho file. Đừng quên `munmap` khi xong. (§9.2.1)",
  },
  {
    id: "spq081",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Dòng tính `page_offset` dưới đây có tác dụng gì trước khi gọi `mmap`?",
    code: {
      lang: "c",
      text: `off_t page_offset = offset & ~(sysconf(_SC_PAGE_SIZE) - 1);

char *addr = mmap(NULL, length + offset - page_offset,
                  PROT_READ, MAP_PRIVATE, fd, page_offset);`,
    },
    options: [
      "Làm tròn `offset` xuống bội số của kích thước page",
      "Đảm bảo `offset` là số dương bằng cách xoá bit dấu",
      "Chuyển `offset` từ đơn vị byte sang đơn vị page cho `mmap`",
      "Làm tròn `offset` lên page kế tiếp để tránh đọc quá cuối file",
    ],
    answer: 0,
    explanation: "Sách nêu thẳng ràng buộc: \"mmap không cho phép chương trình truyền vào giá trị offset tùy ý, nó phải là bội số của kích thước page\", và đoạn mã mẫu chọn cách làm tròn **xuống**. Đó cũng là lý do độ dài truyền cho `mmap` là `length + offset - page_offset`, và lần ghi ra sau đó bắt đầu tại `addr + offset - page_offset` — phần dôi ra ở đầu ánh xạ phải được bỏ qua bằng tay. Phương án \"làm tròn lên\" nghe hợp lý nhưng sẽ nhảy quá vị trí người dùng yêu cầu; phép `& ~(size - 1)` xoá các bit thấp, tức làm tròn xuống. (§9.2.2)",
  },
  {
    id: "spq082",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Trong ví dụ chia sẻ bộ nhớ ẩn danh của sách, process con `sleep(1)` rồi mới đọc hai ô nhớ. Nhận xét nào đúng?",
    code: {
      lang: "c",
      text: `int *shared = mmap(0, size, PROT_READ | PROT_WRITE,
                   MAP_SHARED | MAP_ANONYMOUS, -1, 0);
pid_t mychild = fork();
if (mychild > 0) {
  shared[0] = 10;
  shared[1] = 20;
} else {
  sleep(1);
  printf("%d\\n", shared[1] + shared[0]);
}`,
    },
    options: [
      "`sleep` là hàng rào hợp lệ vì kernel đồng bộ mọi page `MAP_SHARED`",
      "Không có gì bảo đảm; nên dùng mutex đặt trong vùng nhớ chia sẻ",
      "Process con đọc bản sao riêng vì `fork` nhân bản mọi ánh xạ",
      "`MAP_ANONYMOUS` với `fd` bằng -1 khiến vùng nhớ không được chia sẻ",
    ],
    answer: 1,
    explanation: "Sách tự nhận xét ngay dưới đoạn mã: \"không có gì đảm bảo các giá trị sẽ được truyền đi vì process dùng sleep chứ không phải mutex. Hầu hết thời gian thì cách này chạy được\" — và gợi ý dùng một mutex liên process như đã nhắc trong phần đồng bộ hoá. Hai phương án cuối đều bỏ qua điểm cốt lõi của `MAP_SHARED | MAP_ANONYMOUS`: hai process **chia sẻ cùng một frame vật lý**, đó là thứ khiến cách này hiệu quả (không sao chép, không system call, không truy cập đĩa) và cũng chính là thứ tạo chỗ cho data race. Nhớ `munmap` ở mỗi process. (§9.2.3)",
  },
  {
    id: "spq083",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 1,
    question: "Ví dụ hoàn chỉnh dưới đây không chạy được: ta chẳng bao giờ thấy thông điệp, và chương trình treo. Vì sao vòng lặp `while` không bao giờ thoát?",
    code: {
      lang: "c",
      text: `pid_t p = fork();
if (p > 0) {
  write(fd[1], "Hi Child!", 9);
  wait(NULL);
} else {
  char buf;
  while ((bytesread = read(fd[0], &buf, 1)) > 0) {
    putchar(buf);
  }
}`,
    },
    options: [
      "`read` chặn chờ thêm byte cho tới khi mọi bên ghi đóng đầu ghi",
      "`read` trả về -1 ngay sau byte cuối cùng nên vòng lặp không bao giờ thoát",
      "Process con đọc trước khi cha kịp ghi nên `read` trả về 0 ngay lập tức",
      "`wait(NULL)` ở process cha chặn trước khi kịp ghi vào pipe",
    ],
    answer: 0,
    explanation: "Sách nêu quy tắc: \"khi một process cố đọc từ một pipe mà vẫn còn bên ghi, process sẽ block. Nếu pipe không còn bên ghi nào, `read` trả về 0\". Ở đây cả process cha lẫn process con đều còn mở `fd[1]`, nên sau chín byte `read` chỉ đơn giản chặn và chờ thêm — đúng như sách mô tả: \"nó không bao giờ thoát khỏi vòng lặp while\". Đó cũng là lý do không có gì hiện ra: các ký tự đã vào bộ đệm stdout nhưng không có ký tự xuống dòng, và process không bao giờ thoát để bộ đệm được flush. Phương án về `read` trả về 0 nhầm \"pipe rỗng\" với \"không còn bên ghi\" — nếu `read` thật sự trả về 0 thì vòng lặp đã thoát ngay chứ không treo. Hai cách sửa của sách: sau khi fork, mỗi bên đóng đầu pipe mình không dùng; hoặc thoát vòng lặp khi gặp dấu hiệu kết thúc thông điệp, `if (buf == '!') break;`. (§9.3.1, §3.5.2)",
  },
  {
    id: "spq084",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Chương trình dưới đây cài handler cho `SIGPIPE` nhưng handler không bao giờ chạy. Vì sao?",
    code: {
      lang: "c",
      text: `pipe(filedes);
pid_t child = fork();
if (child > 0) {
  close(filedes[0]);
} else {
  write(filedes[1], "One", 3);
  sleep(2);
  write(filedes[1], "Two", 3);
  write(1, "Done\\n", 5);
}`,
    },
    options: [
      "Vì process con vẫn còn mở `filedes[0]`, nên pipe vẫn còn bên đọc",
      "Vì `SIGPIPE` chỉ được gửi tới bên đọc chứ không phải bên ghi",
      "Vì `sleep(2)` làm signal bị mất khi process con đang ngủ",
      "Vì `signal()` không đăng ký được `SIGPIPE`; phải dùng `sigaction` thay thế",
    ],
    answer: 0,
    explanation: "Đặc tả nói `write` sinh `SIGPIPE` chỉ khi **mọi** file descriptor tham chiếu tới đầu đọc của pipe đã bị đóng. Process cha đóng `filedes[0]` của mình, nhưng process con thừa kế một bản của cùng descriptor đó và không bao giờ đóng — nên pipe vẫn còn bên đọc và lần ghi thứ hai thành công. Phương án B đảo ngược chiều tín hiệu: sách nhấn mạnh chỉ **bên ghi** mới dùng được `SIGPIPE`; muốn báo cho bên đọc rằng bên ghi sắp đóng thì phải tự gửi một byte hay một thông điệp quy ước. Thói quen đúng khi fork là mỗi bên đóng ngay đầu pipe mình không dùng. (§9.3.1)",
  },
  {
    id: "spq085",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 2,
    question: "Cặp chương trình sau đôi khi in \"Hello!\", đôi khi treo mãi. Nguyên nhân là gì?",
    code: {
      lang: "c",
      text: `// Program 1
int fd = open("fifo", O_RDWR | O_TRUNC);
write(fd, "Hello!", 6);
close(fd);

// Program 2
int fd = open("fifo", O_RDONLY);
read(fd, buffer, 6);`,
    },
    options: [
      "`O_TRUNC` xoá nội dung fifo ngay sau khi Program 1 ghi xong",
      "Mở bằng `O_RDWR` khiến `open` không chờ bên đọc nào xuất hiện",
      "Đọc 6 byte là quá ngắn, phải đọc đủ 7 byte kể cả byte NUL",
      "Named pipe lưu nội dung trên đĩa nên Program 2 đọc dữ liệu cũ",
    ],
    answer: 1,
    explanation: "Sách chỉ đúng chỗ này: vì Program 1 mở pipe với **cả hai** quyền, `open` không chờ bên đọc — chương trình đã tự khai với hệ điều hành rằng chính nó là bên đọc. Nếu Program 1 kịp `write`, `close` rồi thoát trước khi Program 2 gọi `open`, thì lời gọi `open(O_RDONLY)` của Program 2 block vô hạn. Đó là một race condition, và \"đôi khi có vẻ chạy được\" chính là dấu hiệu của nó. Phương án cuối nhầm named pipe với file thường: sách nói nội dung pipe **không** được ghi ra file trên hệ thống tệp — cái tên chỉ để hai process không có quan hệ cha–con tìm được nhau. (§9.4, §9.4.1, §9.4.2)",
  },
  {
    id: "spq086",
    field: "sysprog",
    domain: "sp-memory-ipc",
    difficulty: 3,
    question: "Đoạn mã sau dùng `fdopen` để bọc hai đầu pipe. Process cha không bao giờ in ra gì. Vì sao?",
    code: {
      lang: "c",
      text: `FILE *reader = fdopen(fh[0], "r");
FILE *writer = fdopen(fh[1], "w");
pid_t p = fork();
if (p > 0) {
  int score;
  fscanf(reader, "Score %d", &score);
  printf("The child says the score is %d\\n", score);
} else {
  fprintf(writer, "Score %d", 10 + 10);
  fflush(writer);
}`,
    },
    options: [
      "`fflush` không đủ; phải gọi `fsync` trên file descriptor bên dưới",
      "Không có ký tự xuống dòng nên `fscanf` chờ hết dòng mãi mãi",
      "`fdopen` cùng một pipe hai lần làm hỏng bộ đệm của cả hai `FILE`",
      "Process con cần `fclose(writer)` thì `fscanf` mới nhận được `%d`",
    ],
    answer: 1,
    explanation: "Sách nói rõ: \"không có ký tự kết thúc dòng nào được gửi, nên `fscanf` sẽ tiếp tục đòi thêm byte vì nó đang chờ kết thúc dòng\" — cách sửa là đổi chuỗi định dạng thành `\"Score %d\\n\"`. Phương án D hấp dẫn vì đóng đầu ghi quả thật là cách làm `read` trả về 0 trong ví dụ pipe thô ở mục trước; nhưng ở đây chương trình treo bên trong `fscanf` chờ dấu xuống dòng, chứ không phải chờ EOF. Sách cũng khuyên chung: rất không nên bọc `FILE` quanh các đối tượng không seek được như pipe, socket hay epoll — chỉ nên làm vậy với file, shared memory hay terminal. (§9.3.4)",
  },

  // ===== sp-io — Hệ thống tệp & Mạng (spq087–spq102) =====
  {
    id: "spq087",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Thứ nào dưới đây KHÔNG phải là tính năng của TCP?",
    code: null,
    options: [
      "Sắp xếp lại các gói tin đến không đúng thứ tự",
      "Mã hoá dữ liệu trên đường truyền",
      "Truyền lại gói tin bị mất do tắc nghẽn",
      "Phát hiện lỗi bit đơn giản bằng checksum",
    ],
    answer: 1,
    explanation: "TCP có sắp xếp lại gói tin, truyền lại, điều khiển luồng, điều khiển tắc nghẽn và một checksum phát hiện lỗi bit đơn giản — nhưng **không** có mã hoá: sách viết \"bất kỳ ai cũng có thể nghe lén TCP thuần. Các gói tin đang truyền là văn bản thuần\", và những thứ quan trọng như mật khẩu có thể bị đọc trộm. Muốn mã hoá thì phải dùng một giao thức cao hơn như HTTPS. Phương án về checksum dễ bị loại nhầm vì sách ghi thêm rằng nó \"hiếm khi được dùng\" — hiếm dùng không có nghĩa là không có. (§11.3, §14.3.1, §15.8)",
  },
  {
    id: "spq088",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Điều khiển luồng và điều khiển tắc nghẽn trong TCP khác nhau ở chỗ nào?",
    code: null,
    options: [
      "Luồng làm ở phía nhận; tắc nghẽn làm ở phía gửi",
      "Luồng làm ở phía gửi; tắc nghẽn làm ở phía nhận",
      "Cả hai đều do router trung gian đảm nhận chứ không phải hai đầu",
      "Luồng thuộc tầng mạng còn tắc nghẽn thuộc tầng giao vận",
    ],
    answer: 0,
    explanation: "Sách phân vai rất rõ: \"Điều khiển luồng được thực hiện ở phía nhận\" để một bên nhận chậm không bị ngập trong gói tin, còn \"Điều khiển tắc nghẽn được thực hiện ở phía gửi\" để một bên gửi không làm ngập mạng. Phương án B là bản đảo ngược và cũng là nhầm lẫn phổ biến nhất, vì cả hai đều được cảm nhận như \"gửi chậm lại\". Mục tiêu thêm của điều khiển tắc nghẽn là công bằng: hai kết nối rời cùng một máy tính nên nhận được băng thông và ping tương đương. (§11.3)",
  },
  {
    id: "spq089",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Server dưới đây `accept` được client nhưng mọi lần đọc đều không nhận được dữ liệu của client. Lỗi ở đâu?",
    code: {
      lang: "c",
      text: `int sock_fd = socket(AF_INET, SOCK_STREAM, 0);
bind(sock_fd, result->ai_addr, result->ai_addrlen);
listen(sock_fd, 10);

int client_fd = accept(sock_fd, NULL, NULL);
int len = read(sock_fd, buffer, sizeof(buffer) - 1);`,
    },
    options: [
      "Phải đọc từ `client_fd`; `sock_fd` là socket thụ động chờ kết nối",
      "Phải gọi `connect` trên `client_fd` trước khi đọc được dữ liệu",
      "Phải đặt `sock_fd` sang chế độ non-blocking thì `read` mới trả về",
      "Phải gọi `listen` lại sau mỗi lần `accept` để mở lại hàng đợi",
    ],
    answer: 0,
    explanation: "Sách gọi thẳng đây là \"một lỗi lập trình phổ biến\": dùng descriptor của server socket ban đầu cho I/O của server rồi thắc mắc tại sao mã mạng lại thất bại. Socket server là **thụ động** — nó chỉ chờ kết nối đến và vẫn mở khi phía bên kia ngắt; `accept` mới trả về một file descriptor mới, gắn với đúng bộ `(client IP, client port, server IP, server port)` của client đó. Phương án B nhầm vai: `connect` là lời gọi của **client**, còn server dùng `socket`, `bind`, `listen`, `accept`. (§11.4)",
  },
  {
    id: "spq090",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 3,
    question: "Tắt server rồi chạy lại ngay, `bind` thất bại dù không chương trình nào khác dùng port đó. Vì sao, và sửa thế nào?",
    code: null,
    options: [
      "Port còn ở trạng thái TIMED-WAIT; đặt `SO_REUSEPORT` trước `bind`",
      "Port vẫn thuộc về process cũ đã chết; gọi `waitpid` để thu hồi nó",
      "Kernel giữ port cho tới khi mọi socket client đóng; gọi `shutdown`",
      "Port dưới 1024 cần quyền root; chạy lại chương trình bằng `sudo`",
    ],
    answer: 0,
    explanation: "Sách nói rõ: theo mặc định port chỉ được giải phóng sau một khoảng thời gian kể từ khi server socket bị đóng — nó đi vào trạng thái \"TIMED-WAIT\", và điều này \"có thể gây nhầm lẫn đáng kể trong quá trình phát triển vì thời gian chờ đó có thể khiến mã mạng hợp lệ trông như bị lỗi\". Cách tái sử dụng port ngay lập tức là `setsockopt(sfd, SOL_SOCKET, SO_REUSEPORT, ...)` trước khi `bind`. Phương án B nhầm port với tài nguyên riêng của process: sách nhấn mạnh \"Port thuộc về máy – không phải thuộc về process hay user\". (§11.4)",
  },
  {
    id: "spq091",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 1,
    question: "Vì sao số port phải đi qua `htons` trước khi đặt vào `struct sockaddr_in`?",
    code: null,
    options: [
      "Vì thứ tự byte mạng là big-endian, khác thứ tự host trên máy x86",
      "Vì `htons` chuyển port từ chuỗi ký tự sang số nguyên 16 bit",
      "Vì port phải được mã hoá trước khi rời khỏi máy tính của bạn",
      "Vì `htons` giới hạn giá trị port trong khoảng hợp lệ 0 đến 65535",
    ],
    answer: 0,
    explanation: "`htons` đọc là \"host to network short\": nó trả về giá trị 16 bit theo thứ tự byte mạng, được RFC1700 quy định là big-endian. Thứ tự của host thì tuỳ kiến trúc, và sách nói thẳng: \"Với máy x86, thứ tự host và thứ tự mạng khác nhau\" — bỏ qua bước chuyển đổi thì giá trị port được chỉ định sẽ sai. Hàm ngược là `ntohs`. Phương án về mã hoá nhầm thứ tự byte với bảo mật: TCP không mã hoá gì cả. Ngoại lệ duy nhất là các giao thức đã tự thoả thuận trước về endianness. (§11.3.1)",
  },
  {
    id: "spq092",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Một socket non-blocking đã nhận 100 byte. Chương trình gọi `read(fd, buf, 150)` rồi `read(fd, buf + 100, 50)`. Hai lời gọi trả về gì?",
    code: null,
    options: [
      "150 rồi 0 — lời gọi thứ hai báo đã hết dữ liệu bằng EOF",
      "100 rồi -1 với `errno` là `EAGAIN` hoặc `EWOULDBLOCK`",
      "100 rồi 50 — lần thứ hai chặn cho tới khi đủ 50 byte còn lại",
      "-1 cả hai lần vì `read` không dùng được với socket non-blocking",
    ],
    answer: 1,
    explanation: "Ở chế độ non-blocking, `read` trả về ngay với số byte đang có: 100. Sách mô tả tiếp đúng tình huống này — 50 byte cuối chưa đến, nên lời gọi thứ hai trả về -1 và đặt biến lỗi toàn cục `errno` thành `EAGAIN` hoặc `EWOULDBLOCK`; \"đó là cách hệ thống báo cho bạn biết dữ liệu chưa sẵn sàng\". Phương án C mô tả hành vi **blocking** và là nhầm lẫn hay gặp nhất, vì ở chế độ blocking lời gọi quả thật sẽ chờ. `write` cũng hành xử tương tự khi hệ thống còn bận gửi khối trước. (§11.7)",
  },
  {
    id: "spq093",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 3,
    question: "Dùng epoll ở chế độ edge-triggered, rủi ro lớn nhất khi xử lý một file descriptor là gì?",
    code: null,
    options: [
      "Nếu không đọc tới khi gặp `EWOULDBLOCK`, descriptor đó bị bỏ rơi",
      "Descriptor được trả về lặp đi lặp lại cho tới khi dữ liệu được đọc hết",
      "Chế độ này không dùng được với socket, chỉ dùng với file thường",
      "`epoll_wait` sẽ trả về descriptor kể cả khi nó chưa có sự kiện nào",
    ],
    answer: 0,
    explanation: "Ở edge-triggered, bên gọi chỉ nhận được file descriptor khi nó **chuyển từ không có sự kiện sang có sự kiện**. Sách cảnh báo hệ quả: \"nếu bạn quên read, write, accept, v.v. trên file descriptor cho đến khi nhận được `EWOULDBLOCK`, file descriptor đó sẽ bị bỏ rơi\". Phương án B mô tả đúng chế độ **level-triggered** — chế độ đó không bỏ rơi descriptor nào, nhưng đổi lại có thể bỏ đói một số descriptor vì epoll không biết ứng dụng sẽ đọc bao nhiêu từ mỗi cái. Ví dụ trong sách thêm listen socket ở level-triggered và mỗi client ở edge-triggered. (§11.7.1, §11.7.2, §11.7.3)",
  },
  {
    id: "spq094",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Một gói UDP dài 1500 byte đến, chương trình gọi `recvfrom` với bộ đệm 512 byte. Chuyện gì xảy ra với phần còn lại?",
    code: null,
    options: [
      "Phần dữ liệu còn lại bị loại bỏ — một `recvfrom` là một gói tin",
      "Phần còn lại nằm chờ và lời gọi `recvfrom` tiếp theo sẽ lấy nốt",
      "`recvfrom` thất bại và trả về -1 vì bộ đệm quá nhỏ cho gói tin",
      "Kernel tự chia gói tin thành ba lượt `recvfrom` liên tiếp cho bạn",
    ],
    answer: 0,
    explanation: "Sách nêu thẳng: \"nếu bạn đọc một phần của gói tin, phần dữ liệu còn lại sẽ bị loại bỏ. Một lời gọi `recvfrom` là một gói tin\" — và khuyên dùng 64 KiB làm không gian lưu trữ để chắc chắn có đủ chỗ. Phương án B là thói quen mang từ TCP sang: TCP là luồng byte nên đọc thiếu thì lần sau đọc tiếp, còn UDP là giao thức datagram, mỗi lần nhận là một đơn vị trọn vẹn hoặc không gì cả. Cũng nhớ UDP không bảo đảm gói tin tới nơi, không bảo đảm thứ tự và có thể trùng lặp. (§11.5, §11.5.3)",
  },
  {
    id: "spq095",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 1,
    question: "`ls -l` hiển thị kích thước của từng tệp trong một thư mục. Kích thước đó được lưu ở đâu?",
    code: null,
    options: [
      "Trong inode của tệp; thư mục chỉ ánh xạ tên sang số inode",
      "Trong directory entry, cạnh tên tệp, để `ls` khỏi phải đọc inode",
      "Trong superblock, cùng với bản đồ các inode đang được sử dụng",
      "Trong data block đầu tiên của tệp, ngay trước nội dung thật",
    ],
    answer: 0,
    explanation: "Ý tưởng lớn của chương là \"Hãy quên tên tệp đi. Chính inode mới là tệp\": inode giữ metadata — kích thước, quyền, thời điểm truy cập cuối — và các con trỏ tới disk block, còn thư mục chỉ là ánh xạ từ tên sang số inode. Phương án B là hiểu lầm tự nhiên nhất vì `ls -l` in tên và kích thước cạnh nhau; nhưng đó chính là lý do `ls -l` phải đọc thêm inode của **từng** tệp. Superblock chứa metadata về các inode và disk block nói chung, không chứa kích thước của một tệp cụ thể. (§12.2, §12.2.1, §12.2.2)",
  },
  {
    id: "spq096",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 3,
    question: "Hệ thống tệp có disk block 4 KiB và con trỏ block 4 byte. Một double indirect block tham chiếu được tối đa bao nhiêu dữ liệu?",
    code: null,
    options: [
      "4 MiB",
      "4 GiB",
      "4 TiB",
      "16 TiB",
    ],
    answer: 1,
    explanation: "Một block 4 KiB chứa `4 KiB / 4 B` = 1024 con trỏ. Một single indirect block trỏ tới 1024 disk block, tức `1024 × 4 KiB` = 4 MiB. Một double indirect block trỏ tới 1024 bảng gián tiếp, tức `1024 × 4 MiB` = 4 GiB; triple indirect cho 4 TiB. Phương án 16 TiB là kích thước **đĩa** tối đa trong cùng ví dụ của sách (`4 KiB × 2^32` block) chứ không phải sức chứa của một block gián tiếp — rất dễ nhặt nhầm vì hai con số nằm cạnh nhau. Cái giá của gián tiếp: đọc giữa các block chậm gấp ba, còn đọc bên trong một block thì không đổi. (§12.2.1)",
  },
  {
    id: "spq097",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Phát biểu nào đúng về hard link?",
    code: null,
    options: [
      "Nó chỉ tạo được bên trong cùng một hệ thống tệp",
      "Nó tham chiếu được tới tệp chưa tồn tại, khác với soft link",
      "Xoá tên gốc làm mọi hard link còn lại trỏ vào inode rỗng",
      "POSIX cho phép hard link tới thư mục nhưng cấm với tệp thường",
    ],
    answer: 0,
    explanation: "Sách viết: \"Hard link có thể được tạo ở bất cứ đâu bên trong cùng một hệ thống tệp\" — vượt ra ngoài hệ thống tệp là việc chỉ symlink làm được, cùng hai khả năng khác của symlink: trỏ tới tệp chưa tồn tại và trỏ tới thư mục. Phương án C hiểu sai `rm`: xoá một tên chỉ gỡ một tham chiếu khỏi thư mục và giảm bộ đếm tham chiếu của inode; nội dung chỉ được giải phóng khi bộ đếm về không, nên các hard link còn lại vẫn dùng bình thường. Bộ đếm này chỉ tính hard link — symlink được phép trỏ vào hư không nên không được tính. (§12.2.5)",
  },
  {
    id: "spq098",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Hàm tìm tệp dưới đây rò rỉ tài nguyên. Ở đâu?",
    code: {
      lang: "c",
      text: `int exists(char *directory, char *name) {
  struct dirent *dp;
  DIR *dirp = opendir(directory);
  while ((dp = readdir(dirp)) != NULL) {
    if (!strcmp(dp->d_name, name)) {
      return 1; /* Found */
    }
  }
  closedir(dirp);
  return 0; /* Not Found */
}`,
    },
    options: [
      "Đường return sớm khi tìm thấy tên không hề gọi `closedir`",
      "`readdir` cấp phát `dp` bằng `malloc` nên phải `free(dp)` mỗi vòng",
      "`opendir` cần được ghép cặp với `close` chứ không phải `closedir`",
      "`strcmp` giữ một bản sao chuỗi bên trong nên phải gọi `strfree`",
    ],
    answer: 0,
    explanation: "Nếu tìm thấy tên khớp, hàm `return 1` ngay và `closedir` không bao giờ chạy — mọi file descriptor đã mở và bộ nhớ do `opendir` cấp phát không được giải phóng, nên cuối cùng process cạn tài nguyên và một lời gọi `open` hay `opendir` nào đó sẽ thất bại. Cách sửa là gọi `closedir` trên **mọi** đường đi có thể của mã. Sách nhận xét đây là lỗi C phổ biến vì ngôn ngữ không có cơ chế bảo đảm tài nguyên luôn được giải phóng. Phương án B là hiểu lầm về quyền sở hữu: `dp` trỏ vào vùng do `DIR *` quản lý, người gọi không giải phóng nó. (§12.2.4)",
  },
  {
    id: "spq099",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Một thư mục đang mở bằng `opendir`, rồi chương trình `fork`. Điều gì đúng sau đó?",
    code: null,
    options: [
      "Chỉ một trong hai process được dùng `readdir`, không phải cả hai",
      "Cả hai process đều dùng được `readdir` vì mỗi bên có bản sao riêng",
      "Chỉ process cha được dùng `readdir`; process con phải `opendir` lại",
      "Cả hai đều phải gọi `rewinddir` trước lần `readdir` đầu tiên của mình",
    ],
    answer: 0,
    explanation: "POSIX quy định: với một thư mục đang mở, sau `fork()` **hoặc** process cha **hoặc** process con — chỉ một trong hai — có thể dùng `readdir()`, `rewinddir()` hay `seekdir()`; nếu cả hai cùng dùng thì hành vi là không xác định. Phương án B là hiểu lầm quen thuộc \"con thừa kế bản sao nên hai bên độc lập\": khi fork, chỉ file descriptor được nhân bản chứ không phải file description, nên vị trí duyệt là thứ hai bên dùng chung. Sách cũng nhắc `readdir` không thread-safe, nên trong cùng một process hãy đặt khoá quanh nó. (§12.2.4, §4.4.6)",
  },
  {
    id: "spq100",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Với `umask` là 022 (octal), tệp tạo bằng lời gọi sau nhận quyền gì?",
    code: {
      lang: "c",
      text: `open("myfile", O_CREAT,
     S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH);`,
    },
    options: [
      "0666 — `umask` chỉ áp dụng cho `mkdir` chứ không cho `open`",
      "0644 — group và other mất bit ghi, chỉ còn quyền đọc",
      "0022 — chỉ giữ lại đúng những bit có trong `umask`",
      "0600 — group và other mất cả quyền đọc lẫn quyền ghi",
    ],
    answer: 1,
    explanation: "`umask` **trừ bớt** bit quyền: kết quả là `0666 & ~022`, tức `S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH` — 0644. Sách mô tả mặc định 022 đúng như vậy: \"quyền của group và other sẽ chỉ còn đọc được (bị bỏ quyền ghi)\". Phương án \"0022\" đảo ngược phép toán, coi `umask` như mặt nạ **giữ lại** thay vì mặt nạ bỏ đi. Kết quả 0600 là điều xảy ra với `umask 077`, giá trị sách dùng khi muốn tệp và thư mục mới chỉ người dùng hiện tại truy cập được. Mỗi process có `umask` riêng và process con thừa kế nó khi fork. (§12.3.3)",
  },
  {
    id: "spq101",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 2,
    question: "Hai lệnh dưới đây tạo một thư mục riêng tư trong `/tmp`. Điểm yếu là gì?",
    code: {
      lang: "bash",
      text: `$ mkdir /tmp/mystuff
$ chmod 700 /tmp/mystuff`,
    },
    options: [
      "Có khoảng sơ hở giữa hai lệnh; hãy dùng `mkdir -m 700` thay thế",
      "`chmod 700` để lộ thư mục cho group vì bit thực thi vẫn còn bật",
      "`/tmp` là tmpfs nên quyền không được lưu lại sau khi máy khởi động lại",
      "`mkdir` luôn tạo thư mục với quyền 777 nên `chmod` tới quá muộn",
    ],
    answer: 0,
    explanation: "Sách gọi tên chính xác: \"Có một khoảng thời gian sơ hở giữa lúc thư mục được tạo và lúc quyền của nó được thay đổi. Điều này dẫn đến nhiều lỗ hổng dựa trên race condition\" — trong khoảng đó, một người dùng khác có thể thay `mystuff` bằng một hard link tới thứ họ sở hữu. Phiên bản tốt hơn tạo thư mục **một cách nguyên tử** với quyền đúng ngay từ đầu. Sách nói thêm rằng riêng với `/tmp`, sticky bit đã chặn kịch bản tấn công đơn giản này — nhưng \"điều này không có nghĩa là tạo thư mục rồi sau đó mới làm cho thư mục riêng tư là an toàn\". (§12.4.1, §12.3.5)",
  },
  {
    id: "spq102",
    field: "sysprog",
    domain: "sp-io",
    difficulty: 3,
    question: "RAID-5 cải thiện điều gì so với RAID-3?",
    code: null,
    options: [
      "Không còn nút thắt cổ chai ở một đĩa parity duy nhất",
      "Không cần tính parity nữa vì dữ liệu được sao gương hoàn toàn",
      "Chịu được hỏng hai đĩa cùng lúc mà vẫn dựng lại được mảng",
      "Không cần dựng lại mảng sau khi thay một đĩa đã hỏng",
    ],
    answer: 0,
    explanation: "RAID-3 ghi block parity lên một đĩa bổ sung, nên mỗi lần một disk block được ghi thì block parity cũng phải được ghi — sách nhận xét đĩa đó bị dùng 100% thời gian, tạo nút thắt cổ chai và dễ hỏng trước, kéo theo các đĩa khác. RAID-5 xoay vòng block kiểm tra qua toàn mảng, cho hiệu năng đọc và ghi tốt hơn; đổi lại cần nhiều đĩa hơn và thuật toán phức tạp hơn. Phương án C là hiểu lầm về mức dự phòng: cả hai chỉ chịu được hỏng **một** đĩa; mất hai đĩa là mất dữ liệu, và sách còn tính ra xác suất khoảng 1% hỏng đĩa thứ hai ngay trong lúc dựng lại. (§12.6.1, §12.6.2)",
  },

  // ===== sp-security — Bảo mật (spq103–spq110) =====
  {
    id: "spq103",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 3,
    question: "Trên chiếc máy 32-bit mà sách dùng làm ví dụ, dòng gán dưới đây làm gì?",
    code: {
      lang: "c",
      text: `void input() {
  void *p;
  printf("Address of stack variable: %p\\n", &p);
  *((&p)+2) = breakout;
}`,
    },
    options: [
      "Ghi đè địa chỉ trả về nên `input` trả về thẳng vào `breakout`",
      "Đặt con trỏ `p` trỏ tới `breakout` để lời gọi sau đó dùng lại",
      "Cấp phát thêm hai con trỏ trên stack để chứa mã của `breakout`",
      "Ghi đè tham số của `main` nên `main` sẽ chạy `breakout` sau khi trả về",
    ],
    answer: 0,
    explanation: "Sách xác định rằng trên kiến trúc 32-bit cụ thể của máy Live Linux Machine, địa chỉ trả về được lưu tại một địa chỉ cao hơn địa chỉ của biến tự động **hai con trỏ**, tức 8 byte — nên `(&p)+2` chính là ô chứa địa chỉ trả về, và gán `breakout` vào đó khiến luồng điều khiển nhảy sang hàm khai thác thay vì quay về `main`. Phương án B nhầm `*((&p)+2)` với `p`: dấu `*` áp lên địa chỉ **cách `p` hai con trỏ**, không phải lên chính `p`. Sách cũng nhắc bố cục stack phụ thuộc kiến trúc và trình biên dịch, nên con số 2 không phổ quát. (§17.2)",
  },
  {
    id: "spq104",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 2,
    question: "Vì sao bộ nhớ stack không nên được phép thực thi?",
    code: null,
    options: [
      "Vì attacker ghi mã tuỳ ý lên stack rồi thực thi với quyền người dùng",
      "Vì stack lớn dần xuống dưới nên lệnh sẽ được nạp theo thứ tự ngược",
      "Vì mã trên stack không được page cache nên chương trình chạy chậm",
      "Vì mỗi thread có stack riêng nên mã sẽ bị nhân bản theo số thread",
    ],
    answer: 0,
    explanation: "Đây chính là mục tiêu của Write xor Execute, còn gọi là Data Execution Prevention: một page có thể được ghi **hoặc** được thực thi, không thể cả hai. Sách nêu mục đích rõ ràng — ngăn các buffer overflow trong đó attacker ghi mã tuỳ ý, thường lưu trên stack hoặc heap, rồi thực thi nó với quyền của người dùng. Cùng ý đó xuất hiện ở chương IPC dưới tên bit execution: dữ liệu người dùng ghi vào heap hay stack không phải chỉ đọc, nên các vùng đó không nên thực thi được. Phương án B nhầm hướng phát triển của stack với thứ tự nạp lệnh — hai chuyện không liên quan. (§14.2.4, §9.1.5)",
  },
  {
    id: "spq105",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 1,
    question: "Hàm chào dưới đây bị stack smashing. Sách khuyến nghị sửa bằng cách nào?",
    code: {
      lang: "c",
      text: `void greeting(const char *name) {
  char buf[32];
  strcpy(buf, name);
  printf("Hello, %s!\\n", buf);
}`,
    },
    options: [
      "Dùng `strncpy` — hoặc `strlcpy` trên hệ thống OpenBSD",
      "Khai báo `buf` là `static` để nó không nằm trên stack nữa",
      "Đổi `strcpy` thành `sprintf(buf, \"%s\", name)` cho an toàn hơn",
      "Kiểm tra `argc` trong `main` trước khi gọi `greeting` là đủ",
    ],
    answer: 0,
    explanation: "Không có kiểm tra giới hạn ở `strcpy`, nên một chuỗi đủ dài sẽ tràn `buf` 32 byte và thay thế địa chỉ trả về của hàm. Sách đưa ra đúng cách sửa này: \"hãy dùng `strncpy`, hoặc `strlcpy` trên các hệ thống OpenBSD\", và bật stack canary cũng khắc phục được. Phương án cuối là cái bẫy tinh vi nhất vì `main` trong ví dụ của sách **đã** kiểm tra `argc < 2` — nhưng kiểm tra số lượng đối số không nói gì về **độ dài** của chúng. Đổi sang `sprintf` cũng không giúp gì: nó vẫn không nhận tham số giới hạn kích thước bộ đệm. (§14.2.1, §3.5.2)",
  },
  {
    id: "spq106",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 2,
    question: "Heartbleed thuộc loại lỗi nào, và nó phá vỡ yếu tố nào của bộ ba CIA?",
    code: null,
    options: [
      "Đọc quá biên do không kiểm tra giới hạn buffer; phá vỡ confidentiality",
      "Ghi quá biên cho phép chèn mã tuỳ ý; phá vỡ integrity của server",
      "Race condition giữa hai thread trên cùng buffer; phá vỡ availability",
      "Tràn số nguyên trong bộ đếm heartbeat; phá vỡ cả ba yếu tố cùng lúc",
    ],
    answer: 0,
    explanation: "Cơ chế SSL Heartbeat rất đơn giản: một server gửi một chuỗi có độ dài nhất định và server kia phải gửi lại chuỗi có độ dài đó. Sách mô tả lỗ hổng là \"không hề có kiểm tra giới hạn trên buffer\": kẻ tấn công khai độ dài lớn hơn những gì thực sự gửi — ví dụ gửi \"cat\" nhưng yêu cầu 500 byte — và lấy được những thông tin quan trọng như mật khẩu từ server. Phần ánh xạ sang bộ ba CIA được sách để lại làm bài tập (\"HeartBleed là ví dụ về loại vấn đề bảo mật nào? Nó phá vỡ (những) yếu tố nào trong bộ ba?\"), nhưng hai định nghĩa ở §14.1.1 cho ra câu trả lời trực tiếp: confidentiality là \"chỉ những bên được uỷ quyền mới được phép xem một mẩu thông tin\" — mà ở đây kẻ tấn công **xem** được mật khẩu; còn integrity là \"chỉ những bên được uỷ quyền mới được phép sửa đổi\" — dữ liệu không hề bị sửa nên yếu tố này vẫn nguyên. Phương án B là nhầm lẫn hay gặp nhất vì \"buffer overflow\" thường gợi tới ghi tràn. Bài học của sách: kiểm tra buffer, và biết sự khác nhau giữa một buffer và một string. (§18.2, §14.1.1, §14.5)",
  },
  {
    id: "spq107",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 3,
    question: "Dirty COW khai thác điều gì?",
    code: null,
    options: [
      "Nhiều thread cùng chạm vào một ánh xạ chỉ đọc, mong lật được bit ghi",
      "Một buffer trên stack không kiểm tra giới hạn trong trình phân giải tên",
      "Đọc quá biên của một thông điệp heartbeat để moi bộ nhớ của server",
      "Thực thi suy đoán để lại dấu vết trong cache sau khi SEGFAULT bị bỏ qua",
    ],
    answer: 0,
    explanation: "Sách mô tả Dirty COW là \"một lỗ hổng trong đó một loạt thread cùng cố truy cập vào cùng một vùng bộ nhớ tại cùng một thời điểm, với hy vọng một trong các thread đó sẽ lật được bit NX và bit cho phép ghi\"; sau đó kẻ tấn công sửa được page, và kết hợp với bit effective user id thì sinh ra một root shell từ một shell thường. Bài học sách rút ra rất gọn: \"Spinlock trong kernel rất khó làm đúng\". Phương án về heartbeat mô tả Heartbleed, còn phương án về thực thi suy đoán mô tả Spectre — cả hai đều là post-mortem có thật trong cùng chương, nên rất dễ tráo nhầm nếu chỉ nhớ tên mà không nhớ cơ chế. (§18.3, §18.2, §14.2.3)",
  },
  {
    id: "spq108",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 3,
    question: "Điều gì khiến rover Mars Pathfinder rơi vào bế tắc?",
    code: null,
    options: [
      "Thread ưu tiên trung bình chiếm quyền thread ưu tiên thấp đang giữ mutex",
      "Thiết bị hết bộ nhớ, hết dung lượng đĩa và hết cả vùng swap",
      "Một race condition làm hỏng cả hệ thống ghi log nên suốt một giờ không ai biết",
      "Timestamp 32 bit tràn số nên bộ lập lịch tính sai thứ tự các tác vụ",
    ],
    answer: 0,
    explanation: "Kiến trúc gồm ba thread: thread điều khiển dữ liệu trên bus thông tin (ưu tiên cao), thread liên lạc (trung bình) và thread thu thập dữ liệu (thấp). Mẫu hình hỏng là thread thu thập dữ liệu bắt đầu ghi lên bus trong khi giữ mutex và thread bus thông tin đang chờ dữ liệu đó, rồi thread liên lạc xuất hiện và chiếm quyền thread ưu tiên thấp — kết quả là rover bế tắc, và một lát sau hệ thống tự khởi động lại. Ba phương án còn lại đều là sự cố có thật ở cùng chương: race condition làm hỏng cả hệ thống dự phòng lẫn hệ thống ghi log là vụ mất điện vùng Đông Bắc năm 2003, hết bộ nhớ là sự cố Sao Hoả **khác**, tràn timestamp là vấn đề Năm 2038. Bài học: đừng để ứng dụng tự lo đồng bộ hoá, hãy tách một module chuyên khoá mutex. (§18.6, §18.7, §18.9, §18.8)",
  },
  {
    id: "spq109",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 2,
    question: "Một hàm xác minh chứng chỉ SSL của Apple luôn báo chứng chỉ là hợp lệ. Nguyên nhân và bài học là gì?",
    code: null,
    options: [
      "Một lệnh `goto` lạc chỗ; hãy luôn đặt ngoặc nhọn cho `if`",
      "Một phép gán `=` viết nhầm trong điều kiện; hãy đặt hằng số lên trước",
      "Một biến chưa khởi tạo trên stack; hãy luôn khởi tạo biến khi khai báo",
      "Một `strcmp` bị đảo dấu trả về; hãy so sánh với 0 một cách tường minh",
    ],
    answer: 0,
    explanation: "Sách ghi: \"Do một lệnh `goto` lạc chỗ trong mã của Apple, một hàm luôn trả về rằng chứng chỉ SSL là hợp lệ\", và các hacker đã qua mặt được hệ thống với những tên trang web khá là điên rồ. Bài học cũng được nêu rõ: luôn đặt dấu ngoặc nhọn cho các câu lệnh `if`, dùng `goto` thật dè sẻn, và nếu thấy cần `goto` thì nhiều khả năng nên viết một hàm khác hoặc một `switch`. Phương án B mô tả một cạm bẫy C có thật mà sách cũng bàn — phép gán bên trong điều kiện `if`, phòng bằng cách viết `if (42 == answer)` — nhưng đó là một mục khác, không phải nguyên nhân của lỗi này. (§18.11, §3.9.1)",
  },
  {
    id: "spq110",
    field: "sysprog",
    domain: "sp-security",
    difficulty: 2,
    question: "Sự cố double free ở AppNexus xảy ra như thế nào?",
    code: null,
    options: [
      "Hai thread cùng xoá một đối tượng nên nó vào danh sách hai lần",
      "Bộ thu gom rác giải phóng đối tượng trước khi nó rời danh sách chờ",
      "Một đối tượng đã được `free` nhưng vẫn còn con trỏ treo trỏ vào nó",
      "Free list bị hỏng vì boundary tag ở cuối khối bị ghi đè",
    ],
    answer: 0,
    explanation: "Kiến trúc là: một phần tử nằm trong danh sách \"không khả dụng\", rồi được lấy ra và đưa vào danh sách \"sắp được giải phóng\"; sau một khoảng thời gian, nếu không ai dùng đến, nó được giải phóng và thêm vào free list. Sách chỉ ra chỗ vỡ: \"Mọi chuyện đều ổn cho đến khi hai thread cố xóa cùng một đối tượng cùng lúc, khiến nó bị thêm vào danh sách hai lần\" — rồi một trong các đối tượng đã bị xoá và việc xoá đó được thông báo tới các máy khác. Phương án C mô tả con trỏ treo, một lỗi láng giềng thường đi cùng double free nhưng khác hẳn về nguyên nhân. Bài học: module hoá, đặt giới hạn bộ nhớ, giám sát và tối ưu bằng tay thay vì tin vào một bộ thu gom rác vạn năng. (§18.15, §3.8.2)",
  },
];
