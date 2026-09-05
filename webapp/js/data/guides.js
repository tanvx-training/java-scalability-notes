// Dữ liệu module "Hướng dẫn học" — ba cấp:
//   fieldGuides[fieldId]  : cách học một LĨNH VỰC — lộ trình cấp module (steps) có
//                           điều kiện hoàn thành máy tính được, cách học, bẫy, tiêu chí xong.
//   trackGuides[trackId]  : cách học một TRACK lộ trình — nhịp, trước/trong/sau.
//   groupGuides[group]    : cách đọc một NHÓM tài liệu (sách) — khoá = docs[].group.
// Hướng dẫn đọc TỪNG tài liệu không viết tay: lib/guides.js suy từ lộ trình.
//
// steps[].done.kind ∈ track | roadmap | docs | doc | flashcards | quiz | exam | tracker | manual
//   track      { id, pct=100 }            — % mục đã tick của một track
//   roadmap    { pct=100 }                — % mục đã tick của cả lĩnh vực
//   docs       { readPct=100 }            — % tài liệu đã đánh dấu đọc
//   doc        { id }                     — một tài liệu đã đánh dấu đọc
//   flashcards { learnedPct=80 }          — % thẻ đã học ít nhất một lần
//   quiz       { seenPct=50, accuracy=70 }— % câu đã gặp và độ chính xác
//   exam       { bestPct=66 }             — điểm thi thử tốt nhất
//   tracker    { pct=100 }                — % tiêu chí ma trận năng lực
//   manual     {}                         — người học tự tick (lưu guide.manual)
// check-data.mjs (G1–G4) kiểm hình dạng, id, href và ngưỡng.

export const fieldGuides = {
  kubernetes: {
    tagline: "Từ Docker tới ba chứng chỉ CNCF — học bằng tay trên cluster thật, không học thuộc YAML.",
    audience: "Developer hoặc DevOps đã dùng Docker, muốn thi **CKAD → CKA → CKS** theo đúng thứ tự hoặc chỉ cần dùng Kubernetes vững ở công ty. Nếu chưa từng chạy container, bắt đầu từ tài liệu Kiến thức nền tảng trước.",
    hoursPerWeek: "8–10 giờ/tuần · 10 tuần cho mỗi chứng chỉ, cộng 9 tuần đọc nền nếu chọn đọc sách",
    prereqs: [
      "Linux terminal: `cd`, `grep`, pipe, `vim` ở mức sửa được file YAML không mất dòng.",
      "Docker: build image, chạy container, hiểu image ≠ container.",
      "YAML: thụt đầu dòng, list vs map, chuỗi phải trong nháy kép khi là số.",
      "Một cluster để tay chân: minikube, kind hoặc Killercoda — không có cluster thì đừng bắt đầu.",
    ],
    steps: [
      { id: "k8s-1", title: "Đọc Kiến thức nền tảng", desc: "Kiểm tra lỗ hổng Linux / vim / Docker / YAML trước khi vào giáo trình. Đọc xong thì đánh dấu đã đọc ở cuối bài.", href: "#/docs/prerequisites", done: { kind: "doc", id: "prerequisites" } },
      { id: "k8s-2", title: "Đọc nền: Kubernetes: Up and Running (nửa đầu)", desc: "Cuốn nhập môn của O'Reilly, 9 tuần. Xong ít nhất tuần 1–5 (cluster, kubectl, Pod, Service, Deployment) trước khi vào giáo trình CKAD để không phải vừa học khái niệm vừa luyện đề.", href: "#/roadmap/kuar", done: { kind: "track", id: "kuar", pct: 50 } },
      { id: "k8s-3", title: "Giáo trình CKAD — 10 tuần", desc: "Track xương sống của lĩnh vực: 55 bài, mỗi bài có lệnh và YAML để gõ lại. Tick một bài chỉ khi bạn làm lại được không nhìn tài liệu.", href: "#/roadmap/ckad", done: { kind: "track", id: "ckad" } },
      { id: "k8s-4", title: "Flashcards mỗi ngày", desc: "84 thẻ theo spaced repetition. Bắt đầu từ tuần 2 của CKAD, 10 phút mỗi ngày; mục tiêu học qua ít nhất 80 % số thẻ.", href: "#/flashcards", done: { kind: "flashcards", learnedPct: 80 } },
      { id: "k8s-5", title: "Trắc nghiệm theo domain", desc: "110 câu có giải thích. Dùng chế độ ưu tiên câu sai; mục tiêu gặp 60 % ngân hàng câu và đúng từ 75 %.", href: "#/quiz", done: { kind: "quiz", seenPct: 60, accuracy: 75 } },
      { id: "k8s-6", title: "Làm 22 lab trong thời gian mục tiêu", desc: "Lab mô phỏng đề thật: tự làm trên cluster, bấm giờ, rồi mới mở lời giải. Tự đánh dấu khi mọi lab đều xong trong thời gian mục tiêu.", href: "#/labs", done: { kind: "manual" } },
      { id: "k8s-7", title: "Thi thử đạt ≥ 80 %", desc: "Điểm đậu CKAD là 66 %, nhưng phòng thi thật chậm hơn — nhắm 80 % ở thi thử để có biên an toàn. Xem điểm theo domain để biết ôn gì.", href: "#/exam", done: { kind: "exam", bestPct: 80 } },
      { id: "k8s-8", title: "Đọc sâu: Kubernetes in Action", desc: "Sau CKAD, đọc cuốn của Lukša để hiểu cơ chế bên dưới những lệnh đã thuộc. 9 tuần, mỗi mục có mục tiêu / bẫy / tự kiểm tra.", href: "#/roadmap/k8sbook", done: { kind: "track", id: "k8sbook" } },
      { id: "k8s-9", title: "Giáo trình CKA — 10 tuần", desc: "Góc nhìn admin: kubeadm, etcd, upgrade, troubleshooting (30 % đề). Khoảng nửa kiến thức trùng CKAD nên đi nhanh hơn ở tuần 4–7.", href: "#/roadmap/cka", done: { kind: "track", id: "cka" } },
      { id: "k8s-10", title: "Nước rút CKA với CKA Study Guide", desc: "Vòng ôn thứ hai, 6 tuần, bám sách luyện thi của Muschko: ưu tiên mục “Trọng tâm cho kỳ thi” và bấm giờ bài tập mẫu cuối chương.", href: "#/roadmap/ckabook", done: { kind: "track", id: "ckabook" } },
      { id: "k8s-11", title: "Giáo trình CKS — 10 tuần", desc: "Chỉ thi được khi CKA còn hiệu lực. Bảo mật chuyên sâu: CIS benchmark, AppArmor/seccomp, Trivy, Falco, audit logging.", href: "#/roadmap/cks", done: { kind: "track", id: "cks" } },
    ],
    method: [
      { title: "Gõ lại, không copy", desc: "Mọi lệnh và YAML trong bài học đều để gõ lại trên cluster của bạn. Nút Copy dành cho lúc tra cứu, không dành cho lúc học." },
      { title: "Sinh YAML bằng lệnh, sửa bằng vim", desc: "Thói quen `k run … $do > pod.yaml` rồi sửa nhanh hơn viết từ đầu và ít lỗi thụt dòng. Đây là kỹ năng ăn điểm số một trong phòng thi." },
      { title: "Một tuần = học + thực hành cuối tuần + tick", desc: "Mỗi tuần trong giáo trình có mục “Thực hành cuối tuần” và “Hoàn thành khi”. Chỉ sang tuần sau khi làm xong hai mục đó, dù đã đọc hết bài." },
      { title: "Đọc sách để hiểu, làm giáo trình để thi", desc: "Ba cuốn sách nối vào tuần giáo trình bằng chip “📖 đọc thêm trong sách”. Bí ở khái niệm nào thì đọc chương đó, không đọc trọn cuốn giữa lúc luyện đề." },
      { title: "Tra cứu như trong phòng thi", desc: "Trang Thực hành nhanh có chế độ gọn để mở cạnh terminal, và thẻ “Trước giờ thi” cho từng chứng chỉ. Tập tra kubernetes.io/docs thay vì hỏi công cụ." },
    ],
    pitfalls: [
      "Học thuộc YAML thay vì hiểu cơ chế — đề thi đổi tên field là lúng túng.",
      "Xem lời giải lab trước khi tự làm trong thời gian mục tiêu.",
      "Nhảy thẳng vào CKA/CKS khi chưa làm được lab CKAD trong giờ.",
      "Đọc ba cuốn sách tuần tự từ đầu đến cuối rồi mới bắt đầu giáo trình — mất động lực trước khi chạm cluster.",
      "Không có cluster để tay chân — mọi thứ chỉ là lý thuyết đến ngày thi.",
    ],
    doneWhen: [
      "Thi thử ổn định ≥ 80 % và mọi lab làm xong trong thời gian mục tiêu.",
      "Đọc `kubectl describe pod` là chỉ ra được vì sao Pod không chạy, không cần Google.",
      "Dựng cluster bằng kubeadm, backup/restore etcd và upgrade một minor version không nhìn tài liệu.",
      "Có ít nhất một chứng chỉ thật, hoặc tự vận hành workload của mình trên Kubernetes ở công ty.",
    ],
  },

  sysprog: {
    tagline: "Hiểu máy tính từ tầng C và syscall — nền của mọi thứ bạn làm ở Java, Kubernetes hay Kafka.",
    audience: "Người đã lập trình được bằng một ngôn ngữ bất kỳ và dùng terminal Linux ở mức cơ bản; **không cần biết C trước**. Đây là bản dịch giáo trình CS 241 của University of Illinois, giấy phép CC BY 4.0.",
    hoursPerWeek: "6–8 giờ/tuần · 10 tuần",
    prereqs: [
      "Một máy Linux (VM, WSL2 hoặc container Ubuntu) có `gcc`, `make`, `gdb`, `valgrind`.",
      "Biết vòng lặp, hàm, mảng ở một ngôn ngữ bất kỳ.",
      "Sẵn sàng đọc lỗi segfault thay vì sợ nó.",
    ],
    steps: [
      { id: "sp-1", title: "Tuần 1–5: C, bộ nhớ, tiến trình, tín hiệu", desc: "Nửa đầu giáo trình đặt nền: mô hình bộ nhớ, con trỏ, malloc, fork/exec/wait, signal. Mỗi mục đọc đúng phần sách được chỉ rồi trả lời câu tự kiểm tra.", href: "#/roadmap/sysprog", done: { kind: "track", id: "sysprog", pct: 50 } },
      { id: "sp-2", title: "Ôn flashcard nửa đầu", desc: "90 thẻ chia theo chủ đề. Chọn đúng chủ đề đã học (C & Bộ nhớ, Tiến trình) và ôn tới khi qua ít nhất nửa bộ thẻ.", href: "#/flashcards", done: { kind: "flashcards", learnedPct: 50 } },
      { id: "sp-3", title: "Tuần 6–10: luồng, đồng bộ, bộ nhớ ảo, mạng, hệ thống tệp", desc: "Nửa sau là phần khó và cũng là phần dùng lại nhiều nhất khi đọc về JVM hay Kubernetes: mutex, condition variable, deadlock, mmap, socket.", href: "#/roadmap/sysprog", done: { kind: "track", id: "sysprog" } },
      { id: "sp-4", title: "Trắc nghiệm toàn giáo trình", desc: "110 câu, nhiều câu có đoạn C để đọc. Mục tiêu gặp 70 % ngân hàng và đúng từ 70 % — dưới ngưỡng thì quay lại chương tương ứng.", href: "#/quiz", done: { kind: "quiz", seenPct: 70, accuracy: 70 } },
      { id: "sp-5", title: "Ba chương trình nhỏ tự viết", desc: "Một shell mini (fork/exec/pipe), một `malloc` đơn giản có free-list, và một server TCP echo đa luồng. Tự đánh dấu khi cả ba chạy được và qua `valgrind` không rò bộ nhớ.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Compile mọi đoạn code trong sách", desc: "Đọc C mà không chạy là đọc tiểu thuyết. Gõ lại, thêm `printf`, cố tình phá để xem lỗi gì xảy ra." },
      { title: "Vẽ bộ nhớ ra giấy", desc: "Stack, heap, con trỏ trỏ đi đâu — vẽ được thì hiểu; không vẽ được thì chưa hiểu, dù đọc trôi." },
      { title: "Dùng `gdb` và `valgrind` từ tuần 2", desc: "Hai công cụ này biến “không hiểu vì sao crash” thành “nhìn thấy dòng gây crash”. Đừng để tới tuần luồng mới học dùng." },
      { title: "Đọc man page trước khi Google", desc: "`man 2 fork`, `man 3 pthread_mutex_lock` — giáo trình cố tình dạy bạn đọc man page vì đó là cách nhanh nhất trong công việc thật." },
    ],
    pitfalls: [
      "Đọc chương luồng mà chưa vững con trỏ và bộ nhớ — mọi race condition sẽ chỉ là phép màu.",
      "Bỏ qua các câu tự kiểm tra vì “đọc hiểu rồi” — chúng được viết để lộ ra chỗ bạn chỉ tưởng là hiểu.",
      "Học trên macOS/Windows thuần: một số syscall và hành vi khác Linux; dùng VM hoặc WSL2.",
    ],
    doneWhen: [
      "Giải thích được vì sao chờ I/O trên Linux vẫn là RUNNABLE nhìn từ JVM (câu chuyện sẽ gặp lại ở lĩnh vực Java).",
      "Tự viết được shell mini, allocator và server TCP đa luồng chạy sạch dưới valgrind.",
      "Đọc một đoạn C dùng mutex/condvar và chỉ ra được deadlock tiềm ẩn.",
    ],
  },

  java: {
    tagline: "Mười bài đi từ TCP handshake tới @Transactional — để lúc 2 giờ sáng bạn gỡ sự cố trong 15 phút chứ không 15 tiếng.",
    audience: "Backend engineer Java/Spring Boot mức mid-senior, SRE vận hành dịch vụ Java, hoặc tech lead cần chốt số thread pool và connection pool bằng phép tính thay vì cảm tính. Series tự biên, đọc theo thứ tự.",
    hoursPerWeek: "3–4 giờ/tuần · 5–6 tuần nếu đọc kèm thí nghiệm",
    prereqs: [
      "Đã viết và deploy ít nhất một service Spring Boot có gọi database.",
      "Biết đọc log và metrics cơ bản (Actuator/Prometheus) — không cần biết Tomcat internals.",
      "Có Docker để dựng thí nghiệm k6 + Postgres trong các bài 01, 06–08.",
    ],
    steps: [
      { id: "jv-1", title: "Bài 01 — Hành trình một request", desc: "Bắt đầu ở tầng kernel: SYN/Accept Queue, Acceptor, Poller, worker thread. Làm thí nghiệm tự kiểm chứng cuối bài rồi đánh dấu đã đọc.", href: "#/docs/java-01", done: { kind: "doc", id: "java-01" } },
      { id: "jv-2", title: "Bài 02 — Giải phẫu các Timeout", desc: "Bốn lỗi ở tầng gói tin và ai là người ngắt. Đọc cùng bảng chẩn đoán 2h sáng — đây là bài tra cứu lại nhiều nhất.", href: "#/docs/java-02", done: { kind: "doc", id: "java-02" } },
      { id: "jv-3", title: "Chủ đề II — Concurrency Model (bài 03–05)", desc: "Sync/async ≠ blocking/non-blocking, vì sao chờ DB vẫn RUNNABLE, và virtual threads. Đọc xong nửa series (5/10 bài) thì bước này hoàn thành.", href: "#/docs", done: { kind: "docs", readPct: 50 } },
      { id: "jv-4", title: "Chủ đề III — Capacity Planning (bài 06–08)", desc: "TaskQueue “nói dối”, công thức Goetz, chuỗi 5 phép tính từ RPS ra số connection. Tính lại cho chính service của bạn khi đọc.", href: "#/docs", done: { kind: "docs", readPct: 80 } },
      { id: "jv-5", title: "Chủ đề IV — Transaction (bài 09–10)", desc: "Proxy, ThreadLocal và năm cái bẫy @Transactional. Đọc xong cả 10 bài thì lĩnh vực này khép lại.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "jv-6", title: "Áp dụng lên một service thật", desc: "Đo thread pool, Hikari pool và timeout budget của một service ở công ty theo bài 07–08; viết một ghi chú trước/sau. Tự đánh dấu khi có số liệu.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Đọc theo thứ tự, không nhảy", desc: "Bài sau tham chiếu bài trước bằng link ngay trong bài. Bài 06–08 giả định bạn đã hiểu RUNNABLE ở bài 04." },
      { title: "Làm thí nghiệm, không chỉ đọc", desc: "Bài 01, 06, 07, 08 có phần tái hiện sự cố bằng k6/Docker. Nhìn Accept Queue tràn một lần đáng hơn đọc mười lần." },
      { title: "Tính cho hệ của bạn", desc: "Mỗi công thức trong series chỉ cho điểm xuất phát. Thay số của service bạn vào, rồi kiểm bằng load test — “đo, đừng đoán”." },
      { title: "Dùng bảng tra cứu metrics", desc: "README của series có bảng Prometheus/Micrometer cốt lõi theo tầng. Gắn alert theo bảng đó là bước áp dụng nhanh nhất." },
    ],
    pitfalls: [
      "Đọc bài 05 (virtual threads) rồi bật `spring.threads.virtual.enabled=true` mà chưa đọc bài 08 — điểm nghẽn chỉ dời sang connection pool.",
      "Tăng `threads.max` khi thấy timeout mà chưa xác định CPU-bound hay I/O-bound (bài 02, 07).",
      "Coi công thức là kết luận: mọi con số trong series đều là điểm bắt đầu để load test.",
    ],
    doneWhen: [
      "Đọc thread dump là chỉ ra được thread nằm ở tầng nào (socketRead0, lock, GC) bằng pattern đỉnh stack.",
      "Chốt được `threads.max`, Hikari `maximumPoolSize` và `max_connections` cho một service kèm lý do bằng số.",
      "Kể được năm bẫy @Transactional và chỉ ra bẫy nào đang có trong code của bạn.",
    ],
  },

  "spring-security": {
    tagline: "Đọc Spring Security in Action ấn bản 2 có kỷ luật — 9 tuần từ filter chain tới OAuth 2 / OIDC.",
    audience: "Developer đã viết REST controller và hiểu dependency injection trong Spring Boot; **không cần biết Spring Security trước**. Nếu Spring còn mới, học lĩnh vực Spring Start Here trước.",
    hoursPerWeek: "5–6 giờ/tuần · 9 tuần",
    prereqs: [
      "Dựng được dự án Spring Boot với một REST endpoint và một `@Configuration`.",
      "Hiểu HTTP: header, cookie, status 401 vs 403.",
      "Biết dùng `curl` hoặc Postman để gửi request có header tuỳ ý.",
    ],
    steps: [
      { id: "ss-1", title: "Đủ nền Spring", desc: "Tự đánh giá: viết được controller, bean, `@Configuration`, hiểu context. Chưa vững thì sang lĩnh vực Spring Start Here trước rồi quay lại tick bước này.", href: "#/docs/springsec-00", done: { kind: "manual" } },
      { id: "ss-2", title: "Tuần 1–5: xác thực, người dùng, mật khẩu, filter, phân quyền endpoint", desc: "Nửa đầu là xương sống: UserDetailsService, PasswordEncoder, filter chain, authorizeHttpRequests. Mỗi mục có bẫy và câu tự kiểm tra.", href: "#/roadmap/springsec", done: { kind: "track", id: "springsec", pct: 50 } },
      { id: "ss-3", title: "Tuần 6–9: CSRF/CORS, phân quyền phương thức, OAuth 2, reactive & test", desc: "Phần thường bị làm sai ở production. Riêng OAuth 2 / OIDC (tuần 8) nên dựng authorization server thật để thử.", href: "#/roadmap/springsec", done: { kind: "track", id: "springsec" } },
      { id: "ss-4", title: "Đọc trọn bộ 21 tệp", desc: "Lời giới thiệu, 18 chương và 2 phụ lục. Track chỉ trỏ vào 17 chương; đọc nốt phần còn lại rồi đánh dấu đã đọc cho từng tệp.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "ss-5", title: "Một PR bảo mật ở dự án thật", desc: "Ví dụ: chuyển một service sang OAuth 2 resource server, hoặc thêm phân quyền cấp phương thức có test. Tự đánh dấu khi PR được review.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Chạy ví dụ của sách trong dự án của bạn", desc: "Không tạo 18 dự án mẫu; mang cấu hình của chương đang đọc vào một dự án duy nhất và xem nó phá gì." },
      { title: "Đọc filter chain bằng log DEBUG", desc: "Bật `logging.level.org.springframework.security=DEBUG` từ tuần 4 để thấy filter nào chạy, theo thứ tự nào." },
      { title: "Viết test cho mọi cấu hình", desc: "Chương kiểm thử ở tuần 9 nhưng nên dùng `@WithMockUser` và `MockMvc` từ tuần 5 — cấu hình bảo mật không có test là cấu hình sẽ vỡ khi refactor." },
    ],
    pitfalls: [
      "Copy cấu hình từ Stack Overflow viết cho phiên bản cũ (`WebSecurityConfigurerAdapter`) — ấn bản 2 dùng `SecurityFilterChain` bean.",
      "Tắt CSRF cho tiện mà không hiểu khi nào được tắt (tuần 6).",
      "Làm OAuth 2 mà không phân biệt được authorization server, resource server và client.",
    ],
    doneWhen: [
      "Vẽ được filter chain của ứng dụng bạn và giải thích 401 vs 403 xảy ra ở filter nào.",
      "Cấu hình được resource server nhận JWT từ một authorization server và kiểm được bằng test.",
      "Chỉ ra được vì sao một endpoint bị lỗi CORS và sửa đúng chỗ.",
    ],
  },

  "senior-java": {
    tagline: "24 tháng từ Mid lên Senior Java + DevOps — bốn giai đoạn, mỗi giai đoạn có output bắt buộc và cổng nghiệm thu.",
    audience: "Java developer đang làm ở mức Mid, có dự án Spring Boot thật để áp dụng, sẵn sàng dành **8–10 giờ/tuần ngoài giờ làm** trong hai năm. Lộ trình trả lời “tuần này làm gì”; ma trận năng lực trả lời “tôi đang ở mức nào” — hai tập độc lập.",
    hoursPerWeek: "8–10 giờ/tuần · 4 giai đoạn × 26 tuần",
    prereqs: [
      "Đang viết Java/Spring Boot hằng ngày và có quyền tạo PR ở dự án công ty.",
      "Tài khoản GitHub công khai để đổ output (repo, blog).",
      "Từ giai đoạn 2: một VPS ≈ 5 USD/tháng; giai đoạn 3: ngân sách cloud 30–50 USD kèm budget alert.",
    ],
    steps: [
      { id: "sj-1", title: "Đọc Tổng quan roadmap 24 tháng", desc: "Bức tranh bốn giai đoạn, nghi thức review hàng quý và quy tắc học xuyên suốt. Đánh dấu đã đọc trước khi bắt đầu tuần 1.", href: "#/docs/sj-00", done: { kind: "doc", id: "sj-00" } },
      { id: "sj-2", title: "Giai đoạn 1 — Java & Spring chuyên sâu (tháng 1–6)", desc: "Output: repo java-deep-dive ≥ 10 chủ đề, 2 case optimize có số liệu, pass mock interview. Khối “Nghiệm thu” cuối track là cổng sang giai đoạn 2.", href: "#/roadmap/sj-gd1", done: { kind: "track", id: "sj-gd1" } },
      { id: "sj-3", title: "Tự chấm ma trận năng lực lần 1", desc: "Sau giai đoạn 1, tick những tiêu chí bạn trình bày được không nhìn tài liệu — mục tiêu ≥ 25 % tổng số tiêu chí. Không tick theo cảm giác.", href: "#/tracker", done: { kind: "tracker", pct: 25 } },
      { id: "sj-4", title: "Giai đoạn 2 — DevOps nền tảng (tháng 6–12)", desc: "Pipeline CI/CD thật hoặc mô phỏng 1:1, repo springboot-cicd-observability, một bài blog. Yêu cầu vào: ≥ 5/6 tiêu chí nghiệm thu giai đoạn 1.", href: "#/roadmap/sj-gd2", done: { kind: "track", id: "sj-gd2" } },
      { id: "sj-5", title: "Ma trận ≥ 50 %", desc: "Đánh giá lại sau giai đoạn 2. Các module DevOps/Observability phải nhích lên rõ.", href: "#/tracker", done: { kind: "tracker", pct: 50 } },
      { id: "sj-6", title: "Giai đoạn 3 — Kubernetes, AWS & Terraform (tháng 12–18)", desc: "Repo production-ready-platform dựng lại từ số 0 trong một buổi; một chứng chỉ CKA hoặc AWS SAA. Lĩnh vực Kubernetes trong app là nơi luyện CKA.", href: "#/roadmap/sj-gd3", done: { kind: "track", id: "sj-gd3" } },
      { id: "sj-7", title: "Ma trận ≥ 75 %", desc: "Đánh giá lại sau giai đoạn 3.", href: "#/tracker", done: { kind: "tracker", pct: 75 } },
      { id: "sj-8", title: "Giai đoạn 4 — Distributed Systems & System Design (tháng 18–24)", desc: "Hai design doc được review, repo distributed-patterns-demo, hai buổi mock system design, hồ sơ Senior hoàn chỉnh. Sách nền là DDIA — có lĩnh vực riêng trong app.", href: "#/roadmap/sj-gd4", done: { kind: "track", id: "sj-gd4" } },
      { id: "sj-9", title: "Ma trận 100 %", desc: "96 tiêu chí theo 4 cấp độ đều tick được thành thật. Đây là lúc đổi chức danh.", href: "#/tracker", done: { kind: "tracker", pct: 100 } },
    ],
    method: [
      { title: "Output trước, kiến thức sau", desc: "Mỗi giai đoạn định nghĩa bằng output bắt buộc (repo, PR, blog, chứng chỉ). Học thứ gì không đổ ra output là học lan man." },
      { title: "Cổng nghiệm thu là thật", desc: "Khối “Nghiệm thu” cuối mỗi track có 6–7 tiêu chí; chưa đủ ngưỡng thì chưa sang giai đoạn sau — thà chậm một tháng còn hơn kéo lỗ hổng đi hai năm." },
      { title: "Review hàng quý", desc: "Tài liệu tổng quan quy định nghi thức review mỗi quý: nhìn lại ma trận, điều chỉnh tốc độ, không đổi mục tiêu." },
      { title: "Mượn lĩnh vực khác của app", desc: "Giai đoạn 1 mượn Modern Java in Action và Java Scalability; giai đoạn 3 mượn Kubernetes; giai đoạn 4 mượn Kafka và DDIA. Chip trong tuần đã nối sẵn." },
    ],
    pitfalls: [
      "Tick ma trận theo cảm giác — ma trận chỉ có giá trị khi bạn tick sau khi trình bày được cho người khác.",
      "Bỏ qua phần áp dụng ở công ty vì “dự án không cho phép” — hãy tìm một PR nhỏ, đó là điểm khác biệt giữa Mid và Senior.",
      "Chạy song song hai giai đoạn để “tiết kiệm thời gian”.",
    ],
    doneWhen: [
      "Bốn cổng nghiệm thu đều đạt ngưỡng và ma trận 96/96.",
      "Hồ sơ gồm CV, GitHub với ít nhất 3 repo có README nghiêm túc và ≥ 4 bài blog.",
      "Pass mock system design mức Senior hai lần với hai người phỏng vấn khác nhau.",
    ],
  },

  "modern-concurrency": {
    tagline: "Đọc Modern Concurrency in Java — virtual thread, structured concurrency, scoped values — bằng thí nghiệm trên JDK 21+.",
    audience: "Java developer đã dùng thread hoặc ExecutorService; **không cần biết trước virtual thread**. Rất nên đọc sau bài 04–05 của lĩnh vực Java & Spring Boot Scalability.",
    hoursPerWeek: "4–5 giờ/tuần · 9 tuần",
    prereqs: [
      "JDK 21 trở lên cài sẵn (một số ví dụ dùng preview feature — biết bật `--enable-preview`).",
      "Viết được một `ExecutorService` + `Future` cơ bản và hiểu vì sao blocking là tốn kém.",
      "Biết dùng `jcmd` hoặc JFR để nhìn thread — không bắt buộc nhưng tuần 3 sẽ cần.",
    ],
    steps: [
      { id: "mc-1", title: "Tuần 1–5: từ thread cổ điển tới structured concurrency", desc: "Nửa đầu: khái niệm virtual thread, giới hạn (pinning, ThreadLocal), cơ chế ForkJoinPool/continuation, rồi StructuredTaskScope.", href: "#/roadmap/modconc", done: { kind: "track", id: "modconc", pct: 50 } },
      { id: "mc-2", title: "Đo pinning trên một ứng dụng thật", desc: "Bật `jdk.tracePinnedThreads` hoặc JFR event `jdk.VirtualThreadPinned` trên một service có `synchronized` + I/O. Tự đánh dấu khi bạn thấy pinning xảy ra và biết chỗ nào gây ra.", done: { kind: "manual" } },
      { id: "mc-3", title: "Tuần 6–9: ngoại lệ, scoped values, reactive sau Loom, framework", desc: "Phần này quyết định bạn có dùng đúng trong dự án hay không: chính sách join, ScopedValue thay ThreadLocal, và chỗ đứng của reactive.", href: "#/roadmap/modconc", done: { kind: "track", id: "modconc" } },
      { id: "mc-4", title: "Đọc trọn 8 chương", desc: "Đánh dấu đã đọc cho từng chương — track bám sát sách nên bước này thường xong cùng bước trên.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
    ],
    method: [
      { title: "Chạy lại mọi ví dụ trên JDK của bạn", desc: "Sách ra đời khi API còn preview; chạy lại giúp bạn thấy khác biệt giữa phiên bản sách và JDK hiện tại." },
      { title: "Đối chiếu với bài 05 của Java Scalability", desc: "Bài 05 tóm tắt cơ chế; sách đi sâu. Đọc song song để một bên giải thích bên kia." },
      { title: "Đo trước khi kết luận", desc: "Virtual thread là scale-not-speed. Benchmark nhỏ với JMH hoặc đơn giản là `wrk` trên hai cấu hình trước khi tin bất kỳ con số nào." },
    ],
    pitfalls: [
      "Bật virtual thread cho toàn app rồi mong nhanh hơn — nó tăng số request đồng thời chịu được, không tăng tốc từng request.",
      "Dùng ThreadLocal như cũ với hàng triệu virtual thread.",
      "Bỏ qua chương reactive vì “Loom thay reactive rồi” — sách nói kỹ khi nào không phải vậy.",
    ],
    doneWhen: [
      "Giải thích được mount/unmount, carrier thread và vì sao `synchronized` gây pinning (và JEP 491 đổi gì).",
      "Viết được một fan-out với StructuredTaskScope có chính sách join và xử lý ngoại lệ đúng.",
      "Quyết định được cho một service cụ thể: virtual thread, reactive, hay giữ platform thread — kèm số đo.",
    ],
  },

  ddia: {
    tagline: "Đọc Designing Data-Intensive Applications ấn bản 2 có kỷ luật — 12 tuần, mỗi tuần một chương và một câu hỏi thiết kế cho hệ của bạn.",
    audience: "Backend engineer đã làm với một database quan hệ, hiểu index và transaction ở mức dùng được; **không cần biết trước về hệ phân tán**. Đây cũng là sách nền của giai đoạn 4 Lộ trình Senior Java.",
    hoursPerWeek: "5–6 giờ/tuần · 12 tuần",
    prereqs: [
      "Viết được SQL có JOIN và đọc được EXPLAIN ở mức cơ bản.",
      "Đã gặp ít nhất một sự cố dữ liệu thật (mất ghi, đọc cũ, deadlock) — sách sẽ đặt tên cho nó.",
      "Kiên nhẫn: chương 8–9 khó nhất, đừng bỏ giữa chừng.",
    ],
    steps: [
      { id: "dd-1", title: "Chương 1 — Đánh đổi trong kiến trúc hệ thống dữ liệu", desc: "Đọc kỹ cách sách phát biểu yêu cầu phi chức năng; mọi chương sau đều quay về khung này. Đánh dấu đã đọc.", href: "#/docs/ddia-01", done: { kind: "doc", id: "ddia-01" } },
      { id: "dd-2", title: "Tuần 1–6: mô hình dữ liệu, lưu trữ, encoding, replication, sharding", desc: "Nửa đầu là nền của mọi database bạn đang dùng. Sau mỗi tuần, viết một đoạn: hệ của bạn đang chọn gì và trả giá gì.", href: "#/roadmap/ddia", done: { kind: "track", id: "ddia", pct: 50 } },
      { id: "dd-3", title: "Viết một design note cho hệ của bạn", desc: "Một trang: replication kiểu gì, sharding theo khoá nào, isolation level nào, vì sao. Tự đánh dấu khi có người review.", done: { kind: "manual" } },
      { id: "dd-4", title: "Tuần 7–12: transaction, hệ phân tán, consensus, batch, stream", desc: "Nửa sau trừu tượng hơn; câu tự kiểm tra ở mỗi mục là chỗ để biết bạn có đang đọc trôi hay không.", href: "#/roadmap/ddia", done: { kind: "track", id: "ddia" } },
      { id: "dd-5", title: "Đọc trọn 14 chương", desc: "Đánh dấu đã đọc từng chương. Chương 14 (làm điều đúng đắn) đọc chậm.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
    ],
    method: [
      { title: "Một chương một tuần, không nhanh hơn", desc: "DDIA dày ý hơn dày chữ. Đọc nhanh là quên nhanh; track cố tình một chương mỗi tuần." },
      { title: "Gắn vào hệ của bạn", desc: "Mỗi khái niệm (LSM vs B-tree, leader-based replication, snapshot isolation) hãy hỏi: hệ tôi đang dùng chọn gì? Tra tài liệu Postgres/MySQL/Kafka để đối chiếu." },
      { title: "Vẽ lại hình của sách", desc: "Đặc biệt chương 5–9: vẽ lại timeline replication lag, split-brain, linearizability bằng tay." },
      { title: "Đọc cùng nhóm nếu được", desc: "Một buổi 45 phút mỗi tuần với 2–3 người đọc cùng chương làm rõ nhiều hơn đọc lại lần hai." },
    ],
    pitfalls: [
      "Đọc chương 3 (lưu trữ) rồi đi tối ưu database công ty ngay — hãy đọc hết chương 7 (transaction) trước.",
      "Bỏ chương 8–9 vì khó — đó là phần biến bạn từ người dùng database thành người thiết kế hệ.",
      "Coi consensus là lý thuyết: Kafka, etcd, ZooKeeper bạn đang dùng đều là consensus.",
    ],
    doneWhen: [
      "Giải thích được cho đồng nghiệp vì sao hệ của bạn chọn isolation level hiện tại và rủi ro của nó.",
      "Thiết kế được replication + sharding cho một bài toán mới kèm phân tích đánh đổi.",
      "Đọc tài liệu một database mới là định vị được nó trên bản đồ DDIA trong 30 phút.",
    ],
  },

  "modern-java": {
    tagline: "Đọc Modern Java in Action 12 tuần — lambda, stream, Optional, CompletableFuture — mỗi tuần một bài tập gõ code.",
    audience: "Java developer thành thạo cú pháp trước Java 8 (class, interface, generics, collection) nhưng còn viết vòng `for` cho mọi thứ; **không cần biết trước lambda hay stream**. Đây là sách nền của giai đoạn 1 Lộ trình Senior Java.",
    hoursPerWeek: "5–6 giờ/tuần · 12 tuần",
    prereqs: [
      "JDK 17+ và một IDE có gợi ý chuyển for-loop sang stream (IntelliJ làm tốt).",
      "Viết được class, interface, generics; hiểu `Comparator`.",
      "Một codebase (cá nhân hoặc công ty) để thử refactor.",
    ],
    steps: [
      { id: "mj-1", title: "Tuần 1–6: lambda, stream, collector, parallel, refactoring", desc: "Nửa đầu là phần bạn dùng mỗi ngày sau này. Mỗi tuần có một bài tập gõ code — làm trước khi tick.", href: "#/roadmap/modern-java", done: { kind: "track", id: "modern-java", pct: 50 } },
      { id: "mj-2", title: "Refactor một module thật sang stream/Optional", desc: "Chọn một class 200–500 dòng ở dự án của bạn, refactor có test, tạo PR và nhờ review. Tự đánh dấu khi PR merge.", done: { kind: "manual" } },
      { id: "mj-3", title: "Tuần 7–12: Optional, Date/Time, module, CompletableFuture, reactive, FP", desc: "Nửa sau mở rộng sang thiết kế: default method, module system, bất đồng bộ và tư duy hàm.", href: "#/roadmap/modern-java", done: { kind: "track", id: "modern-java" } },
      { id: "mj-4", title: "Đọc trọn 21 chương", desc: "Đánh dấu đã đọc từng chương; chương 21 (hướng đi tiếp) đọc cuối cùng.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
    ],
    method: [
      { title: "Gõ, không đọc", desc: "Mọi ví dụ trong sách đều ngắn — gõ lại và sửa một chi tiết để xem compiler nói gì." },
      { title: "Viết hai phiên bản cạnh nhau", desc: "For-loop cũ bên trái, stream bên phải. Khi nào stream khó đọc hơn thì đừng dùng — sách cũng nói vậy." },
      { title: "Đừng parallel sớm", desc: "Chương parallel stream có nhiều bẫy; đo trước bằng JMH, đừng thêm `.parallel()` vì thấy hay." },
    ],
    pitfalls: [
      "Stream hoá mọi thứ — vòng for ba dòng vẫn là vòng for ba dòng.",
      "Dùng `Optional` làm field hay tham số — sách nói rõ nó chỉ cho giá trị trả về.",
      "Bỏ chương CompletableFuture vì “đã có virtual thread” — hai thứ giải quyết bài toán khác nhau.",
    ],
    doneWhen: [
      "Đọc một pipeline stream 6 bước là nói được nó làm gì mà không chạy.",
      "Viết được `Collector` tuỳ biến và giải thích khi nào cần.",
      "Refactor code cũ sang phong cách hàm mà đồng nghiệp đọc dễ hơn, không khó hơn.",
    ],
  },

  kafka: {
    tagline: "Đọc Kafka: The Definitive Guide ấn bản 2 (chương 2–14) trên cluster thật — producer, consumer, tin cậy, vận hành, stream.",
    audience: "Backend engineer đọc được code Java client, quen dòng lệnh Linux, và **dựng được một cluster Kafka một broker bằng Docker**. Chương 1 (khái niệm) không nằm trong bản dịch — nếu chưa biết topic/partition/offset là gì, đọc tài liệu chính thức 30 phút trước.",
    hoursPerWeek: "5–6 giờ/tuần · 11 tuần",
    prereqs: [
      "Docker Compose để chạy Kafka (KRaft) một broker và một UI như Kafdrop/Redpanda Console.",
      "Java hoặc một ngôn ngữ có client Kafka để viết producer/consumer nhỏ.",
      "Hiểu khái niệm topic, partition, offset, consumer group ở mức định nghĩa.",
    ],
    steps: [
      { id: "kf-1", title: "Dựng cluster Kafka một broker", desc: "Chạy được `kafka-topics.sh --create` và `kafka-console-producer/consumer`. Tự đánh dấu khi cluster lên và bạn gửi/nhận được message.", done: { kind: "manual" } },
      { id: "kf-2", title: "Tuần 1–6: cài đặt, producer, consumer, internals, tin cậy, Connect", desc: "Nửa đầu là phần mọi developer dùng Kafka cần. Mỗi tuần một bài thực hành trên cluster của bạn.", href: "#/roadmap/kafka", done: { kind: "track", id: "kafka", pct: 50 } },
      { id: "kf-3", title: "Tuần 7–11: mirroring, bảo mật, vận hành, giám sát, stream", desc: "Phần SRE/platform. Tuần 9–10 nên đọc cùng dashboard metrics thật của cluster bạn dựng.", href: "#/roadmap/kafka", done: { kind: "track", id: "kafka" } },
      { id: "kf-4", title: "Đọc trọn 13 chương", desc: "Đánh dấu đã đọc từng chương (2–14).", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "kf-5", title: "Pipeline có exactly-once chạy được", desc: "Một producer idempotent + transaction, một consumer đọc `read_committed`, và một connector Connect đổ ra file/DB. Tự đánh dấu khi bạn tắt broker giữa chừng mà không mất/không trùng message.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Cluster thật, phá thật", desc: "Tắt broker, giết consumer, đổi `acks` — sách mô tả điều gì xảy ra; bạn phải thấy nó xảy ra." },
      { title: "Đọc cấu hình như đọc code", desc: "Mỗi chương có bảng tham số. Với mỗi tham số, hỏi: mặc định là gì, khi nào đổi, đổi thì trả giá gì." },
      { title: "Nối với DDIA", desc: "Chương 5–6 (tin cậy, exactly-once) và chương 14 (stream) đọc dễ hơn nhiều nếu đã qua DDIA chương 5, 7, 11." },
    ],
    pitfalls: [
      "Đọc chương producer/consumer mà chưa dựng cluster — mọi tham số chỉ là chữ.",
      "Tin “exactly-once” là một công tắc — sách dành cả chương để nói nó là gì và không là gì.",
      "Bỏ chương giám sát vì chưa vận hành — đó là chương giúp bạn hiểu consumer lag trước khi bị gọi lúc 2 giờ sáng.",
    ],
    doneWhen: [
      "Giải thích được đường đi của một message từ producer qua leader, follower tới consumer và điểm nào có thể mất/trùng.",
      "Cấu hình producer/consumer cho ba mức tin cậy khác nhau kèm lý do.",
      "Đọc dashboard là chỉ ra được cluster đang nghẽn ở đâu (under-replicated partitions, consumer lag, request queue).",
    ],
  },

  "spring-start": {
    tagline: "Spring Start Here 8 tuần — điểm bắt đầu Spring cho người mới, và bước đệm trước Spring Security.",
    audience: "Người viết được Java cơ bản (class, interface, annotation) và dựng được dự án Maven; **không cần biết trước gì về Spring**. Học xong lĩnh vực này rồi mới sang Spring Security.",
    hoursPerWeek: "4–5 giờ/tuần · 8 tuần",
    prereqs: [
      "JDK 17+ và Maven (hoặc Gradle) chạy được `mvn package`.",
      "Java: class, interface, generics, annotation ở mức đọc hiểu.",
      "Biết HTTP request/response là gì; chưa cần biết servlet.",
    ],
    steps: [
      { id: "sh-1", title: "Đọc Hướng dẫn học hiệu quả của sách", desc: "Tệp 00 nói cách đọc cuốn này: đọc gì trước, làm bài tập ra sao. Đánh dấu đã đọc rồi mới vào tuần 1.", href: "#/docs/springstart-00", done: { kind: "doc", id: "springstart-00" } },
      { id: "sh-2", title: "Tuần 1–4: context, bean, wiring, abstraction, scope, AOP", desc: "Phần Spring core — nền của mọi thứ sau này. Mỗi tuần một bài code nhỏ, làm trước khi tick.", href: "#/roadmap/spring-start", done: { kind: "track", id: "spring-start", pct: 50 } },
      { id: "sh-3", title: "Tuần 5–8: Spring Boot, MVC, REST, data source, transaction, Spring Data, test", desc: "Phần ứng dụng: từ context tới một REST service có database và test.", href: "#/roadmap/spring-start", done: { kind: "track", id: "spring-start" } },
      { id: "sh-4", title: "Đọc trọn 16 tệp", desc: "Đánh dấu đã đọc từng chương.", href: "#/docs", done: { kind: "docs", readPct: 100 } },
      { id: "sh-5", title: "Một dự án nhỏ tự làm từ đầu", desc: "REST API + PostgreSQL + `@Transactional` + test tích hợp, không copy từ sách. Tự đánh dấu khi chạy được và có ít nhất 5 test xanh.", done: { kind: "manual" } },
    ],
    method: [
      { title: "Một dự án xuyên suốt", desc: "Sách dùng nhiều dự án mẫu; bạn nên gom vào một dự án và để nó lớn dần theo từng chương." },
      { title: "Đọc log khởi động Spring Boot", desc: "Từ tuần 5, đọc log lúc app khởi động để thấy bean nào được tạo, auto-configuration nào bật." },
      { title: "Hỏi “Spring làm gì ở đây thay tôi?”", desc: "Với mỗi annotation, thử bỏ nó đi xem lỗi gì — hiểu Spring bằng cách tắt Spring." },
    ],
    pitfalls: [
      "Nhảy sang Spring Security hay microservice khi chưa hiểu bean scope và vòng đời.",
      "Dùng `@Autowired` trên field mọi nơi mà không hiểu constructor injection vì sao được khuyên.",
      "Bỏ chương test — đó là chương giúp bạn dám refactor.",
    ],
    doneWhen: [
      "Giải thích được Spring context là gì, bean được tạo và wiring thế nào, không cần nhìn sách.",
      "Tự dựng một REST service có database, transaction và test tích hợp chạy được từ đầu.",
      "Đọc một cấu hình Spring lạ và đoán được nó tạo bean gì.",
    ],
  },
};

export const trackGuides = {
  ckad: {
    rhythm: "Mỗi tuần 5–6 bài: đọc bài (15 phút) → gõ lại lệnh/YAML trên cluster (30 phút) → làm “Thực hành cuối tuần” → tick khi đạt “Hoàn thành khi”. Tuần 8–10 chuyển sang luyện đề và thi thử.",
    before: ["Cluster chạy được (minikube/kind/Killercoda) và alias `k=kubectl`, biến `$do`, `$now` đã đặt.", "Đọc xong tài liệu Kiến thức nền tảng.", "Bật flashcards từ tuần 2, 10 phút mỗi ngày."],
    during: ["Chỉ tick khi làm lại được không nhìn tài liệu — không tick vì đã đọc.", "Gặp khái niệm lạ thì bấm chip 📖 để đọc chương sách tương ứng, rồi quay lại.", "Cuối tuần làm phần Thực hành và tự kiểm bằng “Hoàn thành khi”."],
    after: ["Làm 22 lab trong thời gian mục tiêu; thi thử tới khi ổn định ≥ 80 %.", "Đăng ký thi; ngày thi đọc thẻ “Trước giờ thi” CKAD ở Thực hành nhanh.", "Sau khi đậu: đọc Kubernetes in Action để hiểu cơ chế, rồi sang CKA."],
  },
  cka: {
    rhythm: "10 tuần, mỗi tuần 5–6 bài. Tuần 1–3 và 8 là trọng tâm (kiến trúc, kubeadm, etcd, troubleshooting); tuần 4–7 trùng CKAD khoảng nửa nên đi nhanh; tuần 9–10 luyện đề.",
    before: ["Xong CKAD hoặc làm được lab CKAD trong giờ.", "Cluster nhiều node bằng kind hoặc VM để tập kubeadm, drain node, upgrade — minikube một node không đủ.", "Có quyền `sudo` trên node để sửa static pod manifest."],
    during: ["Tuần 3 (etcd backup/restore, upgrade) làm ít nhất 3 lần từ đầu tới cuối.", "Tuần 8 (troubleshooting) là 30 % đề: tự phá cluster (đổi cert path, dừng kubelet) rồi tự chữa.", "Playbook ở Thực hành nhanh có chỉ tiêu thời gian — bấm giờ mỗi lần làm."],
    after: ["Chạy track CKA Study Guide 6 tuần làm vòng ôn thứ hai.", "Thi thử và lab; đọc thẻ “Trước giờ thi” CKA.", "Sau khi đậu và còn hiệu lực: sang CKS."],
  },
  cks: {
    rhythm: "10 tuần theo 6 domain của đề: setup, hardening cluster, hardening hệ thống, pod security & secrets, admission, supply chain, runtime. Tuần 8 tổng hợp kịch bản tấn công–phòng thủ, tuần 9–10 luyện đề.",
    before: ["Đang giữ CKA còn hiệu lực — điều kiện bắt buộc để thi.", "Cài sẵn kube-bench, Trivy, Falco trên cluster tập.", "Đọc lại RBAC và NetworkPolicy từ CKA/CKAD."],
    during: ["Mỗi công cụ (AppArmor, seccomp, Falco) viết ít nhất một profile/rule của riêng bạn, không chỉ chạy ví dụ.", "Tuần 8: tự dựng một kịch bản tấn công rồi chặn — đây là cách nhớ lâu nhất.", "Tick khi tự làm lại được, kể cả những bước cài đặt tẻ nhạt."],
    after: ["Thi thử; đọc thẻ “Trước giờ thi” CKS.", "Áp dụng Pod Security Admission và NetworkPolicy mặc định ở cluster công ty.", "Theo dõi thay đổi curriculum CKS — đề đổi nhanh hơn CKAD/CKA."],
  },
  k8sbook: {
    rhythm: "9 tuần, 3–4 mục mỗi tuần; mỗi mục nêu mục tiêu, chỉ đúng mục sách cần đọc, bẫy và câu tự kiểm tra. Đọc chương (40–60 phút) rồi trả lời câu tự kiểm tra bằng lời của mình.",
    before: ["Biết terminal Linux và Docker; không cần biết Kubernetes.", "Có cluster để chạy ví dụ của sách (kind là đủ).", "Nếu đang luyện CKAD: dùng chip 📖 từ tuần giáo trình để đọc đúng chương, không đọc tuần tự."],
    during: ["Đọc phần được chỉ, không đọc cả chương nếu mục không yêu cầu.", "Trả lời câu tự kiểm tra bằng lời trước khi tick.", "Ghi lại bẫy bạn từng gặp ở công ty khớp với bẫy trong mục."],
    after: ["Quay lại giáo trình chứng chỉ với hiểu biết cơ chế — tốc độ làm lab sẽ tăng.", "Đọc Kubernetes: Up and Running nếu muốn góc nhìn vận hành của Google.", "Sang CKA."],
  },
  ckabook: {
    rhythm: "6 tuần, 4 mục mỗi tuần bám 22 chương sách luyện thi: mỗi mục ưu tiên phần “Trọng tâm cho kỳ thi” rồi làm “Bài tập mẫu” cuối chương có bấm giờ; đáp án ở Phụ lục A.",
    before: ["Đã hoàn thành lộ trình CKA — track này ôn và bấm giờ, không dạy từ đầu.", "Cluster nhiều node sẵn sàng để làm bài tập mẫu.", "Đọc chương 1 (luật chơi phòng thi) trước tuần 1."],
    during: ["Làm bài tập mẫu TRƯỚC khi đọc lời giải ở Phụ lục A.", "Bấm giờ mỗi bài; ghi lại bài nào vượt thời gian để ôn tuần 6.", "Đối chiếu “Trọng tâm cho kỳ thi” với tuần tương ứng của track CKA."],
    after: ["Thi thử lần cuối; đọc thẻ “Trước giờ thi” CKA.", "Đăng ký thi trong 2 tuần sau khi xong track — để kiến thức còn nóng."],
  },
  kuar: {
    rhythm: "9 tuần, 4 mục mỗi tuần; mỗi tuần một bài thực hành trên cluster thật. Tuần 2 đọc Phụ lục (tự dựng cluster) ngay sau chương 3 thay vì để cuối sách.",
    before: ["Biết terminal Linux và Docker cơ bản; không cần biết Kubernetes.", "Docker Desktop hoặc kind + minikube cài sẵn (tuần 2 so hai công cụ).", "Một registry công khai (Docker Hub) để đẩy image ở tuần 1."],
    during: ["Làm bài thực hành tuần trước khi tick mục cuối tuần.", "Tuần 3–5 (Pod, Service, Deployment) đọc song song tuần 1–3 của giáo trình CKAD nếu đang luyện thi.", "Câu tự kiểm tra thường hỏi một lệnh hoặc một tham số cụ thể — trả lời được thì tick."],
    after: ["Vào giáo trình CKAD với nền vững.", "Chương 19–20 (bảo mật, chính sách) đọc lại khi làm CKS.", "Chương 22 (tổ chức ứng dụng) áp dụng cho repo manifest ở công ty."],
  },
  sysprog: {
    rhythm: "10 tuần, 5 mục mỗi tuần; mỗi mục chỉ đúng mục sách cần đọc, bẫy và câu tự kiểm tra. Đọc (30–45 phút) rồi compile và chạy đoạn code của mục đó.",
    before: ["Máy Linux có `gcc`, `make`, `gdb`, `valgrind`.", "Tạo một repo `sysprog-notes` để lưu code từng tuần.", "Đọc chương 1 (giới thiệu) và cài công cụ trong tuần 1."],
    during: ["Mọi đoạn C trong mục: gõ lại, compile với `-Wall -Wextra -g`, chạy dưới valgrind.", "Câu tự kiểm tra trả lời bằng cách viết chương trình nhỏ chứng minh, không chỉ bằng lời.", "Tuần 6–7 (luồng, đồng bộ) làm chậm; đây là phần khó nhất và dùng lại nhiều nhất."],
    after: ["Ôn flashcards và trắc nghiệm của lĩnh vực.", "Viết ba chương trình nhỏ (shell, malloc, server TCP).", "Đọc lại bài 04 của Java Scalability để nối JVM với kernel."],
  },
  springsec: {
    rhythm: "9 tuần, 3–4 mục mỗi tuần bám 17 chương chính; lời giới thiệu, chương 14 và hai phụ lục xuất hiện ở tài nguyên tuần. Mỗi mục: mục tiêu, đọc gì, bẫy, tự kiểm tra.",
    before: ["Dự án Spring Boot có REST controller để áp cấu hình từng chương.", "Xong Spring Start Here hoặc tự tin về bean, context, `@Configuration`.", "Bật `logging.level.org.springframework.security=DEBUG` sẵn."],
    during: ["Mang cấu hình của chương vào dự án của bạn, không tạo dự án mới mỗi chương.", "Viết ít nhất một test `MockMvc` cho mỗi cấu hình từ tuần 5.", "Tuần 8 (OAuth 2): dựng authorization server thật (Spring Authorization Server hoặc Keycloak)."],
    after: ["Đọc nốt chương 14 và hai phụ lục.", "Một PR bảo mật ở dự án thật.", "Quay lại lĩnh vực Senior Java giai đoạn 1 nếu đang theo lộ trình đó."],
  },
  "sj-gd1": {
    rhythm: "26 tuần, mỗi khối 2 tuần có 5–7 việc cụ thể; mỗi việc là MỘT bước trong “Cách thực hiện” của tài liệu giai đoạn. Khối cuối “Nghiệm thu” là cổng sang giai đoạn 2.",
    before: ["Tạo repo `java-deep-dive` theo việc đầu tiên của tuần 1.", "Chuẩn bị Effective Java và Java Concurrency in Practice.", "Xác định 2 điểm nóng hiệu năng ở dự án công ty làm case optimize."],
    during: ["Mỗi việc kết thúc bằng commit hoặc ghi chú Feynman — không có artifact thì chưa xong.", "Tuần 15–22 (Spring, @Transactional, JPA, SQL) mượn lĩnh vực Java Scalability bài 09–10.", "Không sang khối mới nếu khối cũ còn việc chưa tick."],
    after: ["Tự chấm ma trận năng lực lần đầu (mục tiêu ≥ 25 %).", "Đủ ≥ 5/6 tiêu chí nghiệm thu mới sang giai đoạn 2.", "Viết bài blog tổng kết 6 tháng."],
  },
  "sj-gd2": {
    rhythm: "26 tuần: Linux & networking → Docker → CI → CD → metrics → dashboard → logs → game day → portfolio. Mỗi khối 2 tuần có việc cụ thể và tuần 25–26 là buffer.",
    before: ["Một VPS ≈ 5 USD/tháng và một domain rẻ.", "Repo `springboot-cicd-observability` khởi tạo từ tuần 5.", "Đủ ≥ 5/6 tiêu chí nghiệm thu giai đoạn 1."],
    during: ["Mọi pipeline/dashboard phải chạy trên VPS thật, có URL để chỉ cho người khác.", "Tuần 21–22 game day: tự gây sự cố rồi dùng đúng metrics/logs của mình để chẩn đoán.", "Ghi số liệu trước/sau cho mỗi cải tiến — đây là chất liệu blog."],
    after: ["Chấm ma trận lần hai (≥ 50 %).", "Đủ ≥ 6/7 tiêu chí nghiệm thu mới sang giai đoạn 3.", "Bài blog về hành trình tự động hoá."],
  },
  "sj-gd3": {
    rhythm: "26 tuần: Kubernetes 12 tuần (mượn lĩnh vực Kubernetes trong app) → AWS & Terraform 8 tuần → dự án production-ready-platform → nước rút chứng chỉ 4 tuần → blog.",
    before: ["Tài khoản AWS với budget alert 10 USD đặt ngay ngày đầu.", "Cluster kind local cho 6 tuần đầu; EKS chỉ dùng khi làm dự án.", "Đủ ≥ 6/7 tiêu chí nghiệm thu giai đoạn 2."],
    during: ["Tuần 1–12 làm song song giáo trình CKAD/CKA ở lĩnh vực Kubernetes.", "Terraform: mọi tài nguyên phải `destroy` được sạch cuối ngày để giữ ngân sách.", "Dự án phải dựng lại được từ số 0 trong một buổi — tập ít nhất hai lần."],
    after: ["Chấm ma trận lần ba (≥ 75 %).", "Một chứng chỉ CKA hoặc AWS SAA.", "Đủ ≥ 6/7 tiêu chí nghiệm thu mới sang giai đoạn 4."],
  },
  "sj-gd4": {
    rhythm: "26 tuần: Kafka, idempotency/outbox, Redis, resilience (8 tuần) → đọc DDIA có kỷ luật (6 tuần, dùng lĩnh vực DDIA trong app) → design doc và luyện system design → mock interview → hồ sơ.",
    before: ["Đủ ≥ 6/7 tiêu chí nghiệm thu giai đoạn 3.", "Xin trước một bài toán thật ở công ty để viết design doc #1.", "Tìm 2 người có thể làm mock system design với bạn."],
    during: ["Tuần 1–2 dùng lĩnh vực Kafka; tuần 9–14 dùng lĩnh vực DDIA — tick ở cả hai nơi.", "Design doc phải được review thật và ít nhất một cái được triển khai.", "Mock interview ghi âm lại và tự nghe."],
    after: ["Chấm ma trận lần cuối (100 %).", "Hồ sơ Senior: CV, GitHub, ≥ 4 bài blog.", "Phỏng vấn thật."],
  },
  modconc: {
    rhythm: "9 tuần, 3–4 mục mỗi tuần bám 8 chương; mỗi mục: mục tiêu, đọc phần nào, bẫy, tự kiểm tra. Mỗi tuần có ít nhất một đoạn code chạy trên JDK 21+.",
    before: ["JDK 21+ (tốt nhất là bản mới nhất) và biết bật `--enable-preview`.", "Một dự án nhỏ có I/O thật (HTTP client, JDBC) để thử virtual thread.", "Đọc bài 04–05 của Java Scalability nếu chưa."],
    during: ["Chạy lại ví dụ; ghi khác biệt giữa sách và JDK hiện tại.", "Tuần 3: đo pinning trên dự án của bạn bằng JFR.", "Tuần 8–9: đọc với câu hỏi “dự án tôi nên chọn gì?”, không chỉ hiểu API."],
    after: ["Áp một fan-out bằng StructuredTaskScope vào dự án thật.", "Đọc lại bài 08 của Java Scalability về connection pool — nút thắt mới sau virtual thread."],
  },
  ddia: {
    rhythm: "12 tuần, 4 mục mỗi tuần, một chương mỗi tuần; mỗi mục: mục tiêu, đọc phần nào, bẫy, tự kiểm tra. Cuối tuần viết một đoạn ngắn nối chương với hệ của bạn.",
    before: ["Chọn một hệ thật (của công ty hoặc dự án cá nhân) làm “ca nghiên cứu” xuyên suốt.", "Sổ tay hoặc file ghi chú theo chương.", "Chấp nhận tốc độ một chương mỗi tuần."],
    during: ["Đọc phần được chỉ; vẽ lại hình quan trọng bằng tay.", "Câu tự kiểm tra trả lời bằng ví dụ từ hệ của bạn.", "Tuần 8–9 khó nhất: đọc hai lần nếu cần, không bỏ."],
    after: ["Viết design note cho hệ của bạn và xin review.", "Nếu đang theo Lộ trình Senior Java giai đoạn 4: tick tuần 9–14 ở đó.", "Đọc Kafka: The Definitive Guide chương 5–6 và 14 với nền vừa có."],
  },
  "modern-java": {
    rhythm: "12 tuần, 4 mục mỗi tuần bám 21 chương; mỗi tuần một bài tập gõ code. Đọc (30–40 phút) → gõ ví dụ → làm bài tập → tick.",
    before: ["JDK 17+ và IDE có gợi ý refactor sang stream.", "Một codebase để thử refactor.", "Repo `modern-java-notes` lưu bài tập mỗi tuần."],
    during: ["Viết hai phiên bản (for-loop và stream) cho bài tập của tuần.", "Tuần 5 (parallel) đo bằng JMH trước khi kết luận.", "Tuần 9–11 (bất đồng bộ, reactive) đọc chậm và chạy ví dụ có độ trễ giả."],
    after: ["Một PR refactor thật được review.", "Nếu đang theo Lộ trình Senior Java giai đoạn 1: tick tuần 7–8 ở đó.", "Đọc Modern Concurrency in Java để tiếp phần bất đồng bộ."],
  },
  kafka: {
    rhythm: "11 tuần, 4 mục mỗi tuần bám chương 2–14; mỗi tuần một bài thực hành trên cluster của bạn. Đọc → làm trên cluster → trả lời tự kiểm tra → tick.",
    before: ["Cluster Kafka một broker (KRaft) chạy bằng Docker Compose.", "Một producer/consumer nhỏ bằng Java để sửa tham số theo từng chương.", "Đọc khái niệm topic/partition/offset 30 phút nếu chưa biết (chương 1 không trong bản dịch)."],
    during: ["Mọi tham số trong chương: đổi và quan sát trên cluster.", "Tuần 5 (tin cậy, exactly-once): tắt broker giữa chừng để thấy mất/trùng.", "Tuần 9–10: dựng Prometheus + Grafana cho cluster và đọc chương giám sát cùng dashboard."],
    after: ["Pipeline Connect + consumer exactly-once chạy được.", "Nếu đang theo Lộ trình Senior Java giai đoạn 4: tick tuần 1–4 ở đó.", "Đọc DDIA chương 11 (stream processing) nếu chưa."],
  },
  "spring-start": {
    rhythm: "8 tuần, 4 mục mỗi tuần bám 15 chương và hướng dẫn học; mỗi tuần một bài code. Đọc chương (30–40 phút) → làm ví dụ trong một dự án xuyên suốt → tick.",
    before: ["Đọc tệp 00 (hướng dẫn học hiệu quả) của sách.", "Dự án Maven trống với Spring Boot starter.", "Java: class, interface, annotation ở mức đọc hiểu."],
    during: ["Mọi ví dụ đưa vào một dự án duy nhất, để nó lớn theo chương.", "Với mỗi annotation, thử bỏ đi để xem Spring báo gì.", "Tuần 8 (test) không bỏ — test là thứ cho bạn dám refactor."],
    after: ["Một dự án REST + DB + transaction + test tự làm.", "Sang lĩnh vực Spring Security.", "Nếu đang theo Lộ trình Senior Java giai đoạn 1: tick tuần 15–18 ở đó."],
  },
};

// Cách đọc một NHÓM tài liệu (khoá = docs[].group). Hiện chỉ lĩnh vực Kubernetes
// có nhóm; lĩnh vực một nguồn không cần vì trackGuides đã nói cách đọc cuốn đó.
export const groupGuides = {
  "Luyện thi & tra cứu (tự biên)": {
    howToRead: "Ba Study Guide đọc một lần từ đầu tới cuối trước khi vào giáo trình tương ứng; ba Cheat Sheet không đọc — mở khi làm lab và trước giờ thi. Prerequisites đọc trước tất cả.",
    pace: "Study Guide: 1–2 buổi mỗi cuốn. Cheat Sheet: tra cứu.",
  },
  "Kubernetes in Action (Lukša, Manning)": {
    howToRead: "Sách nền đọc tuyến tính; theo track “Kubernetes in Action” 9 tuần, hoặc đọc đúng chương mà chip 📖 trong tuần giáo trình CKAD/CKA/CKS trỏ tới. Mỗi chương có ví dụ chạy được trên kind — chạy, đừng chỉ đọc.",
    pace: "Một chương 40–60 phút; 2 chương mỗi tuần.",
  },
  "CKA Study Guide (Muschko, O'Reilly)": {
    howToRead: "Sách luyện thi bám curriculum CKA: đọc SAU giáo trình CKA làm vòng ôn thứ hai. Mỗi chương ưu tiên mục “Trọng tâm cho kỳ thi” rồi làm “Bài tập mẫu” có bấm giờ; đáp án ở Phụ lục A — đọc sau khi tự làm.",
    pace: "4 chương mỗi tuần trong 6 tuần theo track “CKA Study Guide”.",
  },
  "Kubernetes: Up and Running (O'Reilly)": {
    howToRead: "Cuốn nhập môn của các tác giả từ Google: đọc trước hoặc song song giáo trình CKAD theo track “Kubernetes: Up and Running” 9 tuần. Phụ lục (tự dựng cluster) đọc ở tuần 2 ngay sau chương 3.",
    pace: "Một chương 30–45 phút; 2–3 chương mỗi tuần, kèm một bài thực hành.",
  },
};
