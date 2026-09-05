// Lộ trình đọc Spring Start Here — Phần 2 (Tuần 5–8).
//
// Nguồn: bản dịch tiếng Việt "Spring Start Here" (Laurențiu Spilcă — Manning, 2021).
// Thư mục nguồn: spring-start-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Đây là sách NHẬP MÔN: khối "Bẫy" phải là bẫy người mới thật sự vấp.
// GIỮ NGUYÊN id (sh-w<N> / sh-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là sh-, KHÔNG phải ss- (đã thuộc lĩnh vực Spring Security).

export const springStartWeeksPart2 = [
  {
    id: "sh-w5",
    week: "Tuần 5",
    title: "Spring Boot, Spring MVC và ứng dụng web",
    goal: "Chuyển từ chương trình console sang một web app chạy được trong trình duyệt: dựng project bằng Spring Boot, hiểu luồng Spring MVC đủ để tự gỡ một lỗi 404, và nhận dữ liệu client gửi bằng cả request parameter lẫn path variable trên đúng HTTP method.",
    practice:
      "Dựng một project Spring Boot từ start.spring.io với dependency starter web (mục 7.2.1 và 7.2.2). Viết một controller trả về view động, rồi thêm một form POST nhận dữ liệu qua `@RequestParam` và một endpoint nhận `@PathVariable`. Cuối cùng xoá dòng khai starter web khỏi `pom.xml` và chạy lại để thấy autoconfiguration ngừng cấu hình những gì.",
    resources: [
      { label: "Spring Start 07 — Tìm hiểu Spring Boot và Spring MVC", href: "#/docs/springstart-07" },
      { label: "Spring Start 08 — Triển khai ứng dụng web với Spring Boot và Spring MVC", href: "#/docs/springstart-08" },
      { label: "start.spring.io", href: "https://start.spring.io/" },
    ],
    items: [
      {
        id: "sh-w5-1",
        text: "Web app hoạt động ra sao, và các cách triển khai với Spring",
        lesson: `**Mục tiêu.** Vẽ được đường đi của một HTTP request từ trình duyệt tới code Java của bạn, gọi đúng tên thành phần đứng giữa, và chọn được kiểu kiến trúc web app trước khi gõ dòng code đầu tiên.

**Đọc.** [7.1.1 Tổng quan chung về web app](#/docs/springstart-07) đọc lướt hai định nghĩa client và server, nhưng dừng ở chú thích Hình 7.3: backend phục vụ nhiều client đồng thời nên một số thao tác chạy song song — hạt giống của tuần 6. [7.1.2 Các cách khác nhau để triển khai web app với Spring](#/docs/springstart-07) chép ra hai cách tiếp cận: backend trả về view đã chuẩn bị đầy đủ, thứ bạn làm ngay tuần này; và tách biệt frontend-backend, nơi backend chỉ gửi dữ liệu thô, gặp lại tuần sau. Đặt Hình 7.4 cạnh Hình 7.5 tới khi nói được response của server khác nhau chỗ nào. [7.1.3 Sử dụng servlet container trong phát triển web app](#/docs/springstart-07) đọc kỹ nhất buổi: servlet container là trình phiên dịch các thông điệp HTTP cho ứng dụng Java, còn servlet là đối tượng Java tương tác trực tiếp với container. Đi qua Hình 7.6, Hình 7.7 và Hình 7.8 đúng thứ tự rồi tự kể lại luồng bằng lời của bạn.

**Bẫy.** Coi Tomcat là bắt buộc, hoặc coi "servlet container" và "Tomcat" là một. Khối LƯU Ý ngay sau đoạn giới thiệu Tomcat nói rõ sách chỉ chọn nó cho các ví dụ, còn Jetty, JBoss và Payara cũng nằm trong danh sách rất dài các giải pháp dùng thực tế. Bẫy thứ hai: thấy chữ servlet rồi bỏ cả buổi học cách tự viết một servlet, hoặc lao vào đặc tả HTTP. Mục 7.1.3 chặn cả hai: sách nói thẳng chúng ta thường không tự tạo các instance servlet nên bạn không phải tập trung học cách triển khai nó, và trừ khi bạn đam mê về mạng máy tính, bạn không cần hiểu chi tiết cách HTTP hoạt động để viết web app.

**Tự kiểm tra.** Trong hai cách tiếp cận của mục 7.1.2, cách nào để trình duyệt tự quyết định hiển thị dữ liệu thế nào? Và nếu bỏ servlet container khỏi kiến trúc, ứng dụng Java của bạn phải tự gánh thêm việc gì?`,
      },
      {
        id: "sh-w5-2",
        text: "Spring Boot: initializr, dependency starter, autoconfiguration",
        lesson: `**Mục tiêu.** Tạo được project Spring Boot từ dịch vụ khởi tạo, đọc hiểu năm thứ nó cấu hình sẵn cho bạn, và nói được autoconfiguration đã âm thầm làm gì thay bạn.

**Đọc.** [7.2 Điều kỳ diệu của Spring Boot](#/docs/springstart-07) chép ra ba gạch đầu dòng tính năng chính. [7.2.1 Sử dụng dịch vụ khởi tạo dự án để tạo dự án Spring Boot](#/docs/springstart-07) làm thật theo năm bước của Hình 7.10: vào start.spring.io, chọn Maven, thêm đúng một dependency Spring Web như Hình 7.12, đặt tên project "sq-ch7-ex1" rồi mở trong IDE. Sau đó mở từng thứ trong danh sách năm cấu hình nằm ngay trước Hình 7.13: class \`Main\` mang \`@SpringBootApplication\`, node parent \`spring-boot-starter-parent\`, \`spring-boot-maven-plugin\`, dependency \`spring-boot-starter-web\` không kèm version, và "application.properties" rỗng. [7.2.2 Sử dụng dependency starter để đơn giản hóa việc quản lý dependency](#/docs/springstart-07) ngắn: nhớ quy ước tên "spring-boot-starter-", rồi mở thư mục External Libraries tự xác nhận điều sách nói — bạn khai một starter mà JAR của Spring context, AOP và Tomcat đều đã có mặt. [7.2.3 Sử dụng autoconfiguration theo quy ước dựa trên dependency](#/docs/springstart-07) đọc xong thì khởi động ứng dụng lúc chưa viết dòng nào và soi console tìm dòng "Tomcat started on port(s): 8080".

**Bẫy.** Thêm \`<version>\` cho dependency starter cho chắc, hoặc chép version từ một bài viết trên mạng. Mục 7.2.1 nói ngược lại: node parent của Spring Boot cung cấp sẵn các phiên bản tương thích, và sách khuyến nghị để Spring Boot chọn phiên bản để bạn không gặp tình trạng không tương thích. Bẫy thứ hai: dừng lại đào cho hiểu \`@SpringBootApplication\` và \`SpringApplication.run()\` trước khi đi tiếp. Tác giả cố ý không giải thích, nói rằng những chi tiết này không liên quan đến điều bạn đang học lúc này và Spring Boot là chủ đề của cả một cuốn sách riêng; ông khép chương bằng đúng nguyên tắc đó — đừng vội học chi tiết trước khi hiểu đúng những điều cơ bản.

**Tự kiểm tra.** Trong file \`pom.xml\` vừa sinh ra, thứ nào chịu trách nhiệm chọn phiên bản cho dependency, và thứ nào kéo Tomcat về? Và khi bạn xoá dòng khai \`spring-boot-starter-web\` rồi chạy lại, dòng log nào biến mất khỏi console?`,
      },
      {
        id: "sh-w5-3",
        text: "Spring MVC và view động",
        lesson: `**Mục tiêu.** Triển khai được trang đầu tiên bằng \`@Controller\` và \`@RequestMapping\`, kể lại được luồng Spring MVC theo đúng thứ tự thành phần, rồi nâng trang tĩnh đó thành view động nhận dữ liệu từ controller.

**Đọc.** [7.3 Triển khai web app với Spring MVC](#/docs/springstart-07) là mục đọc chậm nhất tuần. Làm đủ hai bước của Hình 7.15: Listing 7.1 là file HTML đặt trong "resources/static", Listing 7.2 là class \`MainController\` mang \`@Controller\` với action ánh xạ vào \`/home\` và trả về chuỗi "home.html". Chạy thật rồi mở http://localhost:8080/home. Sau đó đọc chậm bảy bước của Hình 7.18 và chép ra bốn cái tên: dispatcher servlet — sách cũng gọi là front controller, handler mapping, controller, view resolver; chỉ controller là do bạn viết. Khối LƯU Ý khép mục thú nhận một chỗ đã đơn giản hoá: handler mapping còn tìm theo cả HTTP method. Sang [8.1 Triển khai ứng dụng web với view động](#/docs/springstart-08): thêm starter Thymeleaf, gõ lại Listing 8.1 với tham số \`Model\` cùng hai lời gọi \`addAttribute()\`, rồi Listing 8.2 khai \`xmlns:th\` và dùng \`th:text\`. Khép buổi bằng [8.1.1 Nhận dữ liệu trên HTTP request](#/docs/springstart-08): chép ra bốn cách client gửi dữ liệu — request parameter, header, path variable, request body.

**Bẫy.** Tưởng project vừa tải về đã là web app vì console báo Tomcat đã chạy. Mở đầu mục 7.3 chặn ngay: các cấu hình mặc định đó mới chỉ khởi động một Tomcat server, chúng chưa biến ứng dụng thành web app, bạn vẫn phải viết trang và controller. Hệ quả là lỗi mà khối LƯU Ý sau Listing 8.1 kể: gõ "localhost:8080" trần tức là gọi đường dẫn "/", chưa gán action nào cho nó nên nhận HTTP 404 là bình thường. Bẫy thứ hai: để nguyên file HTML ở "resources/static" khi chuyển sang view động. Sách dừng lại nhắc đúng khác biệt nhỏ này: trang tĩnh của chương 7 nằm ở "resources/static", còn khi đã dùng template engine thì file HTML phải nằm ở "resources/templates".

**Tự kiểm tra.** Trong bảy bước của Hình 7.18, thành phần nào trả lời "gọi action nào", và thành phần nào trả lời "lấy nội dung view ở đâu"? Và nếu bỏ tham số \`Model\` khỏi action, chỗ nào trên trang hỏng?`,
      },
      {
        id: "sh-w5-4",
        text: "Request parameter, path variable, và GET so với POST",
        lesson: `**Mục tiêu.** Nhận được dữ liệu client gửi bằng cả \`@RequestParam\` lẫn \`@PathVariable\`, chọn đúng cách theo Bảng 8.1, và tách use case đọc với ghi thành hai action GET và POST trên cùng đường dẫn.

**Đọc.** [8.1.2 Dùng request parameter để gửi dữ liệu từ client đến server](#/docs/springstart-08) gõ lại Listing 8.3 rồi chạy với \`/home?color=blue\`, sau đó thêm tham số thứ hai theo cú pháp Hình 8.7. [8.1.3 Dùng path variable để gửi dữ liệu từ client đến server](#/docs/springstart-08) đổi sang Listing 8.4: tên biến đặt giữa cặp ngoặc nhọn trong đường dẫn, và tham số \`@PathVariable\` phải trùng tên. Bảng 8.1 rút lại thành hai quy tắc: giá trị tuỳ chọn thì dùng request parameter, và đừng gửi quá ba giá trị theo cách nào cả. [8.2 Dùng các HTTP method GET và POST](#/docs/springstart-08) dài nhất tuần: học thuộc năm dòng của Bảng 8.2, rồi dựng "sq-ch8-ex5" theo chuỗi Listing 8.5 đến Listing 8.12 — model \`Product\`, \`ProductService\` giữ một \`List\`, action GET gửi danh sách sang view, action POST nhận name và price bằng request parameter, Listing 8.11 đổi sang \`@GetMapping\` với \`@PostMapping\`, Listing 8.12 thêm HTML form. Khối LƯU Ý sau Listing 8.6 nhắc lại bài học singleton của tuần 4.

**Bẫy.** Bỏ trống một request parameter rồi chờ server nhận \`null\`. Khối LƯU Ý ngay sau Hình 8.7 nói rõ: mặc định request parameter là bắt buộc, thiếu nó thì server trả về status "400 Bad Request", muốn tuỳ chọn phải khai tường minh trên annotation — nhưng để ý khối này viết \`optional=true\` trong khi code chạy được ở "sq-ch8-ex3" dùng \`@RequestParam(required = false)\`; tin vào listing. Bẫy thứ hai: dùng GET cho một chức năng có sửa dữ liệu vì gõ thẳng lên thanh địa chỉ cho nhanh. Sách mở mục 8.2 bằng cảnh báo gắt nhất chương: về mặt kỹ thuật bạn làm được, nhưng đó là một lựa chọn rất, rất tệ — đừng bao giờ dùng một HTTP method trái với mục đích thiết kế của nó.

**Tự kiểm tra.** Theo mục 8.1.3, giá trị tuỳ chọn thì gửi bằng cách nào, và vì sao cách còn lại không hợp? Và trong Listing 8.11, hai action cùng ánh xạ vào \`/products\` mà không xung đột nhờ thứ gì?`,
      },
    ],
  },
  {
    id: "sh-w6",
    week: "Tuần 6",
    title: "Web scope và REST service",
    goal: "Chọn được đúng một trong ba web scope cho từng mẩu dữ liệu thay vì nhét tất cả vào singleton, và mở ứng dụng ra cho ứng dụng khác gọi bằng REST endpoint trả JSON với status cùng header do bạn kiểm soát.",
    practice:
      "Thêm ba bean vào ứng dụng tuần 5: một request-scoped đếm số lần gọi trong một request, một session-scoped giữ tên người dùng, một application-scoped đếm tổng lượt truy cập. Mở hai trình duyệt khác nhau để thấy ba scope hành xử khác nhau. Rồi chuyển một controller sang `@RestController` và trả JSON.",
    resources: [
      { label: "Spring Start 09 — Sử dụng các web scope của Spring", href: "#/docs/springstart-09" },
      { label: "Spring Start 10 — Triển khai REST service", href: "#/docs/springstart-10" },
    ],
    items: [
      {
        id: "sh-w6-1",
        text: "Request scope: sống bao lâu và hợp với dữ liệu nào",
        lesson: `**Mục tiêu.** Đổi được scope của một bean sang request, nói được vì sao thông tin đăng nhập không nên sống lâu hơn một HTTP request, và biết thứ gì không nên đặt vào constructor của bean loại này.

**Đọc.** [9.1 Sử dụng request scope trong ứng dụng web Spring](#/docs/springstart-09) là mục đọc chậm nhất tuần. Bắt đầu ở phần mở chương với ba định nghĩa web scope — request, session, application — rồi bám Hình 9.2: Spring quản lý kiểu, tức cây cà phê, và phát một instance mới, tức hạt cà phê, cho mỗi HTTP request, kể cả request từ cùng một client. Khối "Các khía cạnh chính của bean có scope request" là bảng bốn cột đáng chép ra giấy; đọc kỹ cột "cần cân nhắc" — instance tồn tại ngắn và được thu gom rác khi request hoàn thành, và vì chỉ một thread chạm tới nên bạn được phép dùng thuộc tính lưu dữ liệu của request. Rồi làm "sq-ch9-ex1" đúng thứ tự: Listing 9.1 là "login.html" với form POST về "/", Listing 9.3 là action POST với biến \`loggedIn\` còn cứng bằng \`false\`, và Listing 9.4 mới là đích đến — \`LoginProcessor\` mang \`@Component\` cùng \`@RequestScope\`.

**Bẫy.** Bê nguyên logic đăng nhập của chương vào một ứng dụng thật. Khối LƯU Ý ngay trước phần triển khai nói thẳng: ví dụ đăng nhập kiểu này rất tốt cho mục đích giảng dạy, nhưng trong ứng dụng sẵn sàng cho production thì tốt hơn là tránh tự triển khai xác thực và phân quyền — hãy dùng Spring Security để không vô tình đưa vào lỗ hổng. Bẫy thứ hai: nhét việc nặng vào constructor hoặc method \`@PostConstruct\` của bean có scope request. Cột "cần tránh" của bảng cảnh báo đúng chỗ đó: Spring tạo instance mới cho mỗi HTTP request, nên logic tốn thời gian như lấy dữ liệu từ database hay gọi mạng sẽ bị trả giá trên từng request; Tóm tắt nhắc lại y hệt.

**Tự kiểm tra.** Vì sao cột "cần tránh" bảo bạn đừng đồng bộ hoá các thuộc tính của bean có scope request, trong khi tuần 4 lại cảnh báo về race condition trên singleton? Và trong "sq-ch9-ex1", vì sao \`LoginController\` vẫn để nguyên scope singleton?`,
      },
      {
        id: "sh-w6-2",
        text: "Session scope và application scope",
        lesson: `**Mục tiêu.** Giữ được trạng thái đăng nhập xuyên nhiều request của cùng một client, chuyển hướng đúng cách giữa hai trang, và nói được vì sao tác giả khuyên tránh application scope.

**Đọc.** [9.2 Sử dụng session scope trong ứng dụng web Spring](#/docs/springstart-09) mở bằng Hình 9.8 và Hình 9.9 — đặt Hình 9.9 cạnh Hình 9.2 của buổi trước rồi nói ra khác biệt: một instance mỗi request so với một instance mỗi HTTP session. Chép ra bảng "Các khía cạnh chính của bean có scope session", đặc biệt hai cột cuối. Rồi làm "sq-ch9-ex2" theo bốn bước sách liệt kê: Listing 9.5 tạo \`LoggedUserManagementService\` mang \`@Service\` cùng \`@SessionScope\`; Listing 9.6 cho \`LoginProcessor\` — vẫn là request scope — ghi username vào nó; Listing 9.7 dựng \`MainController\` chặn \`/main\` bằng chuỗi "redirect:/" nếu username còn \`null\`; Listing 9.9 với Listing 9.10 thêm liên kết đăng xuất qua request parameter "logout"; Listing 9.11 chuyển hướng sang \`/main\` sau khi xác thực. [9.3 Sử dụng application scope trong ứng dụng web Spring](#/docs/springstart-09) ngắn, đọc một mạch: Hình 9.14 rồi Listing 9.12 đến Listing 9.15. Khép tuần bằng [Tóm tắt](#/docs/springstart-09).

**Bẫy.** Coi session bean là chỗ tiện để cất mọi thứ về người dùng. Bảng khía cạnh của session bean cấm hẳn một nhóm: không bao giờ lưu chi tiết nhạy cảm — mật khẩu, khóa riêng hay bí mật nào khác — trong thuộc tính session bean; và ngay cả dữ liệu thường cũng đừng giữ quá nhiều vì các instance này sống lâu hơn và ít bị thu gom rác hơn bean có scope request. Bẫy thứ hai: thấy application scope giống singleton mà lại "hợp web" nên lấy làm kho dùng chung. Mục 9.3 nói ngược lại: tác giả khuyên tránh dùng nó và dùng thẳng một tầng lưu trữ như database — Tóm tắt nêu lý do: mọi thao tác ghi thường cần đồng bộ hoá, tạo điểm nghẽn, và bean này không được thu gom rác chừng nào ứng dụng còn chạy.

**Tự kiểm tra.** Trong Listing 9.10, thao tác nào thực sự "đăng xuất" người dùng, và vì sao chỉ cần chừng đó? Và nếu các thuộc tính của một bean có scope application đều bất biến, sách nói nên dùng thứ gì thay cho nó?`,
      },
      {
        id: "sh-w6-3",
        text: "REST dùng để làm gì, và viết endpoint đầu tiên",
        lesson: `**Mục tiêu.** Nói được REST endpoint khác một action trả view ở đúng chỗ nào, viết được endpoint đầu tiên bằng cả hai cú pháp, và tự gọi nó bằng Postman lẫn cURL.

**Đọc.** [10.1 Dùng REST service để trao đổi dữ liệu giữa các ứng dụng](#/docs/springstart-10) đọc chậm hai thứ. Thứ nhất là Hình 10.2 đặt cạnh sơ đồ Spring MVC tuần trước: mọi thành phần giữ nguyên, chỉ view resolver biến mất, và dispatcher servlet trả thẳng thứ action trả về. Thứ hai là bốn gạch đầu dòng về các vấn đề giao tiếp — chép cả bốn ra giấy. [10.2 Triển khai REST endpoint](#/docs/springstart-10) làm thật: gõ Listing 10.1 với \`@Controller\` cộng \`@GetMapping\` cộng \`@ResponseBody\`, rồi Listing 10.2 để thấy annotation ấy lặp lại phiền thế nào, rồi Listing 10.3 thay cả hai bằng \`@RestController\` — đây là sự kết hợp của \`@Controller\` và \`@ResponseBody\`. Nửa sau mục là hai công cụ: cài Postman rồi gửi thử \`/hello\` theo Hình 10.3 và Hình 10.4; cài cURL rồi chạy lần lượt \`curl http://localhost:8080/hello\`, bản có \`-X GET\`, và bản có \`-v\` — đọc output dài đó tới khi chỉ đúng được dòng nào là status, dòng nào là response body.

**Bẫy.** Quên \`@ResponseBody\` hoặc \`@RestController\` rồi ngơ ngác vì ứng dụng báo lỗi thay vì in ra chuỗi. Sách giải thích cơ chế: hai annotation này báo cho dispatcher servlet rằng method không trả về tên view; thiếu chúng, dispatcher servlet vẫn giả định "Hello!" là tên một view và đi tìm view đó. Bẫy thứ hai: coi một lời gọi REST như một lời gọi method trong cùng JVM. Mục 10.1 liệt kê bốn kiểu hỏng: action chạy lâu khiến lời gọi timeout, gửi hơn vài megabyte cũng timeout, quá nhiều lời gọi đồng thời làm ứng dụng thất bại, và mạng thì không bao giờ đáng tin cậy 100%. Tác giả chốt: mỗi lần dựng giao tiếp bằng REST phải tự hỏi điều gì xảy ra nếu một lời gọi thất bại.

**Tự kiểm tra.** So với sơ đồ Spring MVC ở tuần 5, thành phần nào biến mất khi bạn viết REST endpoint, và phần việc của nó rơi vào đâu? Và trong ba lệnh cURL bạn vừa chạy, cờ nào cho bạn thấy HTTP status?`,
      },
      {
        id: "sh-w6-4",
        text: "Kiểm soát HTTP response, và nhận dữ liệu qua request body",
        lesson: `**Mục tiêu.** Trả về đối tượng và collection dưới dạng JSON, đặt status cùng header bằng \`ResponseEntity\`, tách logic exception khỏi controller, và nhận dữ liệu lớn qua request body.

**Đọc.** [10.3 Quản lý HTTP response](#/docs/springstart-10) mở bằng ba thành phần: header, body, status. [10.3.1 Gửi đối tượng làm response body](#/docs/springstart-10) gõ Listing 10.4 định nghĩa DTO \`Country\`, Listing 10.5 trả thẳng một instance, Listing 10.6 trả một \`List\`; gọi cả hai endpoint rồi so hai khối JSON in ra. [10.3.2 Đặt status và header cho response](#/docs/springstart-10) chép ra bốn status mặc định Spring đặt sẵn — 200, 404, 400, 500 — rồi gõ Listing 10.7: \`ResponseEntity\` đổi status thành 202 Accepted và thêm ba header. [10.3.3 Quản lý exception ở cấp endpoint](#/docs/springstart-10) dài nhất: dựng "sq-ch10-ex5" với \`NotEnoughMoneyException\`, \`PaymentService\` luôn ném nó, hai model \`PaymentDetails\` và \`ErrorDetails\`, rồi Listing 10.8 bắt exception trong action; sau đó "sq-ch10-ex6" cho Listing 10.9 chỉ còn happy flow và Listing 10.10 dời logic sang \`@RestControllerAdvice\`. Khối LƯU Ý khép mục thêm một nước đi: khai tham số kiểu exception trên method handler thì Spring tự truyền tham chiếu. [10.4 Dùng request body để lấy dữ liệu từ client](#/docs/springstart-10) ngắn: Listing 10.11 với \`@RequestBody\`, và lệnh cURL kèm \`-H "Content-Type: application/json"\`.

**Bẫy.** Bọc \`try/catch\` quanh mọi action rồi tự dựng \`ResponseEntity\` trong từng khối catch. Mục 10.3.3 nêu hai cái giá: cùng một exception thường phải quản lý cho nhiều endpoint nên sinh ra code trùng lặp, và logic exception nằm rải rác khiến bạn không còn một chỗ duy nhất để đọc; Tóm tắt gọi đó là điều tốt nhất nên tránh. Bẫy thứ hai: đọc một bài viết cũ rồi tin rằng HTTP GET không được mang request body. Sidebar khép chương xử đúng câu hỏi này: trước năm 2014 đặc tả HTTP không cho phép, nhưng đặc tả đã đổi vào năm đó và giờ thì cho phép — thứ gây nhầm lẫn là các bài viết cũ và các ấn bản sách chưa được cập nhật.

**Tự kiểm tra.** Trong Listing 10.9, action controller còn chịu trách nhiệm gì và đã giao lại việc gì cho ai? Và nếu client gửi một chuỗi JSON mà Spring không giải mã được thành kiểu tham số, ứng dụng trả về status nào?`,
      },
    ],
  },
  {
    id: "sh-w7",
    week: "Tuần 7",
    title: "Gọi REST endpoint và dùng data source",
    goal: "Mở ứng dụng ra hai phía: gọi được REST endpoint của một service khác bằng cả ba công cụ Spring cung cấp và chọn đúng công cụ theo tiêu chí sách đưa ra, rồi nối được ứng dụng xuống một relational database qua data source và đọc ghi bằng `JdbcTemplate`.",
    practice:
      "Viết một ứng dụng thứ hai gọi chính REST endpoint bạn đã viết ở tuần 6, bằng cả ba cách của chương 11 — OpenFeign, `RestTemplate`, `WebClient`. Ghi lại cách nào ít code nhất và cách nào chặn thread. Rồi nối một H2 in-memory data source vào ứng dụng và viết một insert cùng một select bằng `JdbcTemplate`.",
    resources: [
      { label: "Spring Start 11 — Sử dụng các REST endpoint", href: "#/docs/springstart-11" },
      { label: "Spring Start 12 — Sử dụng data source trong ứng dụng Spring", href: "#/docs/springstart-12" },
    ],
    items: [
      {
        id: "sh-w7-1",
        text: "Gọi REST endpoint bằng Spring Cloud OpenFeign",
        lesson: `**Mục tiêu.** Gọi được một REST endpoint từ ứng dụng Spring mà không tự viết dòng code HTTP nào: khai một interface, gắn annotation, và để OpenFeign cung cấp phần triển khai.

**Đọc.** Phần mở chương 11 xếp hạng ba công cụ ngay từ đầu: OpenFeign là thứ tác giả khuyên dùng cho mọi triển khai mới. Dựng dự án nền "sq-ch11-payments" theo Listing 11.1 — action \`@PostMapping("/payment")\` nhận \`@RequestHeader\` cùng \`@RequestBody\`, gán một ID ngẫu nhiên rồi trả \`ResponseEntity\` có header; bạn sẽ gọi lại đúng endpoint này ở cả ba mục. [11.1 Gọi các REST endpoint bằng Spring Cloud OpenFeign](#/docs/springstart-11) là phần làm thật trong "sq-ch11-ex1": thêm dependency \`spring-cloud-starter-openfeign\`, rồi gõ lại Listing 11.2 — interface \`PaymentsProxy\` mang \`@FeignClient\` với hai thuộc tính \`name\` và \`url\`. Đọc kỹ Hình 11.5 tới khi nói được OpenFeign đặt cái gì vào Spring context. Chép ra ba dòng annotation tái sử dụng: \`@PostMapping\` cho đường dẫn và HTTP method, \`@RequestHeader\` cho header, \`@RequestBody\` cho body — đúng bộ tuần 6 đã dùng, không có gì mới phải học. Listing 11.3 bật client bằng \`@EnableFeignClients\`, Listing 11.4 inject proxy vào controller. Khép buổi bằng chạy thật cả hai ứng dụng rồi gọi cURL POST tới port 9090.

**Bẫy.** Viết thẳng địa chỉ "http://localhost:8080" vào thuộc tính \`url\` của \`@FeignClient\` cho nhanh. Khối LƯU Ý ngay sau đoạn giải thích \`@FeignClient\` nói rõ: hãy đảm bảo bạn luôn lưu các URI và những chi tiết khác có thể khác nhau giữa các môi trường trong các properties file, và không bao giờ hardcode chúng trong ứng dụng. Bẫy thứ hai: khai xong \`@FeignClient\` rồi tưởng thế là đủ, và không hiểu vì sao chẳng có bean nào để inject. Sách nêu điều kiện còn thiếu ngay trước Listing 11.3: OpenFeign cần biết nơi tìm các interface định nghĩa các hợp đồng client, nên bạn phải đặt \`@EnableFeignClients\` trên một class cấu hình và trỏ \`basePackages\` vào đúng package chứa interface đó.

**Tự kiểm tra.** Trong Listing 11.2, thuộc tính nào của \`@FeignClient\` định danh duy nhất client trong ứng dụng, và thuộc tính nào chỉ ra URI gốc của endpoint? Và theo Hình 11.5, thứ bạn inject vào controller là do ai triển khai?`,
      },
      {
        id: "sh-w7-2",
        text: "RestTemplate và WebClient — ba lựa chọn khác nhau ở đâu",
        lesson: `**Mục tiêu.** Viết được cùng một lời gọi bằng \`RestTemplate\` rồi bằng \`WebClient\`, đọc ra khác biệt về lượng code và về cách thread hành xử, và chọn được công cụ theo tiêu chí sách đưa ra.

**Đọc.** [11.2 Gọi các REST endpoint bằng RestTemplate](#/docs/springstart-11) chép ba bước ra giấy trước khi gõ code: tạo và cấu hình một \`HttpHeaders\`, tạo một \`HttpEntity\` đại diện cho header cùng body, rồi gửi bằng method \`exchange()\`. Gõ lại Listing 11.5 trong "sq-ch11-ex2" rồi đếm số dòng so với Listing 11.2 buổi trước — đó là bằng chứng cho ba thứ sách nói lập trình viên muốn mà công cụ này không cho dễ dàng. [11.3 Gọi các REST endpoint bằng WebClient](#/docs/springstart-11) là mục đọc chậm nhất tuần, nhưng đọc để hiểu ý chứ không để thuộc. Đặt Hình 11.8 cạnh Hình 11.10 rồi chép ra hai vấn đề sách nêu ở cách không reactive: thread nằm rảnh chờ I/O mà vẫn chiếm bộ nhớ, và các tác vụ vốn độc lập bị ép chạy tuần tự. Rồi làm "sq-ch11-ex3" với dependency \`spring-boot-starter-webflux\`: Listing 11.7 đặt bean \`WebClient\`, Listing 11.8 xâu chuỗi \`post()\`, \`uri()\`, \`header()\`, \`body()\`, \`retrieve()\`, \`bodyToMono()\`.

**Bẫy.** Bỏ qua \`RestTemplate\` vì nó đã vào chế độ bảo trì và sẽ bị đánh dấu lỗi thời. Khối LƯU Ý giữa mục 11.2 chặn đúng phản xạ đó: khi thứ gì bị gọi là "deprecated" hay "legacy", điều đó không nhất thiết có nghĩa là bạn không nên học nó — các công nghệ lỗi thời vẫn được dùng trong dự án nhiều năm sau khi bị tuyên bố lỗi thời. Bẫy thứ hai: đọc tài liệu thấy khuyến nghị \`WebClient\` rồi chuyển cả ứng dụng sang nó. Khối LƯU Ý khép mục 11.3 nói ngược lại: nếu bạn quyết định không triển khai một ứng dụng reactive, hãy dùng OpenFeign; chỉ ứng dụng reactive mới nên dùng một công cụ reactive đúng nghĩa là \`WebClient\`.

**Tự kiểm tra.** Trong Listing 11.8, method của proxy trả về kiểu \`Mono\`, và theo sách \`Mono\` đóng vai trò gì trong cặp producer với subscriber? Và giữa ba công cụ của chương, phần Tóm tắt nói bạn không nên dùng cái nào trong các triển khai mới?`,
      },
      {
        id: "sh-w7-3",
        text: "Data source là gì, và làm việc với dữ liệu bằng JdbcTemplate",
        lesson: `**Mục tiêu.** Nói được data source giải quyết vấn đề gì so với việc tự xin kết nối cho từng thao tác, và viết được một insert cùng một select bằng \`JdbcTemplate\` mà không đụng tới \`PreparedStatement\`.

**Đọc.** [12.1 Data source là gì](#/docs/springstart-12) đọc lướt nhưng dừng ở hai mốc. Hình 12.3: JDK chỉ cho abstraction, còn implementation đến từ một runtime dependency tên là JDBC driver. Và khối định nghĩa data source ngay sau Hình 12.5 — chép nguyên câu đó, rồi nhớ tên implementation Spring Boot mặc định chọn: HikariCP. [12.2 Dùng JdbcTemplate để làm việc với dữ liệu được lưu trữ](#/docs/springstart-12) là buổi gõ code, dựng "sq-ch12-ex1" theo ba bước sách liệt kê. Ba dependency: starter web, starter jdbc, và h2 scope "runtime". File "schema.sql" tạo bảng purchase ba cột id, product, price. Listing 12.1 gắn \`@Repository\`; Listing 12.2 inject \`JdbcTemplate\` qua constructor — Spring Boot thấy dependency H2 thì tự cấu hình cả data source lẫn \`JdbcTemplate\`. Listing 12.3 gọi \`update()\` cho câu INSERT, dấu chấm hỏi thay chỗ cho tham số; Listing 12.4 gọi \`query()\` kèm một \`RowMapper\` viết dạng lambda. Listing 12.5 mở hai endpoint, kiểm bằng cURL POST và GET tới /purchase.

**Bẫy.** Khai \`price\` là \`double\` vì ví dụ Java cơ bản nào cũng làm thế. Khối LƯU Ý ngay sau class model \`Purchase\` chặn: khi bạn muốn lưu chính xác một giá trị dấu phẩy động, hãy dùng \`BigDecimal\` chứ không phải \`double\` hay \`float\` — bạn có thể mất độ chính xác ngay cả với phép cộng hay trừ đơn giản. Bẫy thứ hai: mang cách tạo bảng bằng "schema.sql" sang một dự án thật. Khối LƯU Ý ngay sau câu CREATE TABLE giới hạn phạm vi: cách này chỉ phù hợp cho ví dụ lý thuyết; trong ví dụ thực tế bạn cần một dependency quản lý được phiên bản các script database, và tác giả chỉ đích danh Flyway cùng Liquibase.

**Tự kiểm tra.** Theo chú thích của Listing 12.4, hai tham số r và i trong lambda \`RowMapper\` lần lượt là gì? Và nếu bỏ hẳn data source khỏi thiết kế, ứng dụng sẽ phải làm gì cho mỗi thao tác với dữ liệu?`,
      },
      {
        id: "sh-w7-4",
        text: "Tuỳ chỉnh cấu hình của data source",
        lesson: `**Mục tiêu.** Trỏ được ứng dụng sang một DBMS bên ngoài chỉ bằng file properties, và biết khi nào phải tự định nghĩa bean \`DataSource\` thay vì để Spring Boot làm hộ.

**Đọc.** [12.3 Tùy chỉnh cấu hình của data source](#/docs/springstart-12) đi theo đúng hai bước sách vạch ra ở đầu mục. [12.3.1 Định nghĩa data source trong file application properties](#/docs/springstart-12) làm trên "sq-ch12-ex2": bỏ dependency H2 khỏi \`pom.xml\`, thêm JDBC driver của MySQL với scope "runtime", rồi khai bốn property. Ba cái đầu dễ đoán — \`spring.datasource.url\`, \`spring.datasource.username\`, \`spring.datasource.password\`. Cái thứ tư mới là chỗ dễ mất cả buổi tối: \`spring.datasource.initialization-mode\` phải đặt giá trị "always" thì Spring Boot mới chạy "schema.sql" và tạo bảng purchase, còn với H2 thì mặc định nó đã chạy file này rồi. [12.3.2 Dùng bean DataSource tùy chỉnh](#/docs/springstart-12) chép ra bốn tình huống buộc bạn tự khai bean: cần một implementation chỉ xác định được lúc runtime, ứng dụng nối nhiều database nên phải phân biệt bằng qualifier, phải chỉnh tham số theo môi trường khởi động, và ứng dụng dùng Spring nhưng không dùng Spring Boot. Rồi gõ lại Listing 12.6 trong "sq-ch12-ex3": ba \`@Value\` đọc property tên bắt đầu bằng "custom", một method \`@Bean\` trả về \`HikariDataSource\` đã đặt url, username, password và \`setConnectionTimeout(1000)\`.

**Bẫy.** Coi file "application.properties" là chỗ để mật khẩu database. Khối LƯU Ý ngay sau đoạn cấu hình MySQL nói rõ: lưu các bí mật như mật khẩu trong file properties không phải là thực hành tốt trong ứng dụng sẵn sàng cho production, những chi tiết riêng tư như vậy được lưu trong các kho bí mật. Bẫy thứ hai: chạy "sq-ch12-ex3", thấy GET /purchase trả về nhiều bản ghi hơn số lần bạn POST, rồi đi lục lỗi trong code. Khối LƯU Ý cuối mục giải thích: nếu bạn không dọn dẹp bảng purchase và dùng cùng database như dự án "sq-ch12-ex2", kết quả sẽ chứa cả các bản ghi bạn đã thêm trước đó.

**Tự kiểm tra.** Theo chú thích của Listing 12.6, nếu context đã có sẵn một bean \`DataSource\` do bạn khai thì Spring Boot làm gì? Và vì sao ba property trong ví dụ này mang tiền tố "custom" chứ không phải "spring.datasource"?`,
      },
    ],
  },
  {
    id: "sh-w8",
    week: "Tuần 8",
    title: "Transaction, Spring Data và kiểm thử",
    goal: "Đưa dữ liệu vào cho đúng rồi chứng minh nó đúng: bọc use case trong transaction và tự kiểm chứng rollback thay vì tin nó xảy ra, thay repository viết tay bằng một interface Spring Data, và viết được cả unit test lẫn integration test cho cùng một hành vi.",
    practice:
      "Bọc hai lệnh ghi vào một method `@Transactional`, ném exception ở giữa, và xác nhận cả hai bị rollback. Rồi thay `JdbcTemplate` bằng một repository của Spring Data JDBC cho cùng bảng đó. Cuối cùng viết một unit test và một integration test cho **cùng một hành vi**, và ghi lại chúng khác nhau ở chỗ nào — đó chính là điểm mục 15.2 muốn dạy.",
    resources: [
      { label: "Spring Start 13 — Sử dụng transaction trong ứng dụng Spring", href: "#/docs/springstart-13" },
      { label: "Spring Start 14 — Triển khai lưu trữ dữ liệu với Spring Data", href: "#/docs/springstart-14" },
      { label: "Spring Start 15 — Kiểm thử ứng dụng Spring", href: "#/docs/springstart-15" },
    ],
    items: [
      {
        id: "sh-w8-1",
        text: "Transaction là gì, và Spring cài đặt nó bằng cơ chế nào",
        lesson: `**Mục tiêu.** Định nghĩa được commit và rollback bằng đúng lời của sách, và nói được Spring dựng transaction bằng cơ chế nào cùng điều kiện chính xác để nó rollback.

**Đọc.** Mở chương 13 bằng ví dụ ví điện tử: John gửi $100 cho Jane, bước một rút xong, bước hai hỏng, $100 biến mất — Hình 13.2 là bức tranh dữ liệu không nhất quán mà cả chương muốn xoá bỏ. [13.1 Transaction](#/docs/springstart-13) ngắn, chép ra ba thứ: transaction là một tập hợp xác định các thao tác khả biến hoặc thực thi đúng tất cả cùng nhau hoặc hoàn toàn không, tên gọi của tính chất đó là atomicity, và hai khối định nghĩa COMMIT với ROLLBACK. [13.2 Transaction hoạt động như thế nào trong Spring](#/docs/springstart-13) là mục đọc chậm nhất tuần dù chỉ dài hai trang. Nối nó với tuần AOP: transaction là một aspect do Spring cấu hình sẵn, chặn các method bạn đánh dấu \`@Transactional\` rồi quyết định commit hay rollback. Đọc Hình 13.4 và Hình 13.5 liền nhau rồi nói ra khác biệt giữa hai hình bằng đúng một động từ. Khép buổi bằng sidebar về checked exception ở cuối mục.

**Bẫy.** Bọc \`try/catch\` bên trong một method \`@Transactional\` rồi tin transaction vẫn rollback. Đây đúng là bẫy sách kể học viên trên lớp thường vấp: tác giả nhấn mạnh từ "ném ra" và nói thẳng rằng chỉ xảy ra exception bên trong method là không đủ — method transactional phải ném exception ra ngoài để aspect biết nó cần rollback; nếu method tự xử lý, aspect không thể biết exception đã xảy ra. Bẫy thứ hai: nghĩ mọi exception đều gây rollback. Sidebar "Còn checked exception trong transaction thì sao?" trả lời gọn rằng mặc định là không, Spring chỉ rollback khi gặp runtime exception; \`@Transactional\` có thuộc tính để đổi hành vi đó, nhưng tác giả khuyên trừ khi cần thiết hãy cứ dựa vào mặc định.

**Tự kiểm tra.** Theo sidebar, vì sao tác giả cho rằng một tình huống được biểu diễn bằng checked exception không phải là vấn đề có thể gây không nhất quán dữ liệu? Và trong tình huống của Hình 13.5, aspect kết thúc transaction bằng commit hay bằng rollback?`,
      },
      {
        id: "sh-w8-2",
        text: "Dùng @Transactional trong ứng dụng thật",
        lesson: `**Mục tiêu.** Dựng xong use case chuyển tiền có \`@Transactional\`, rồi tự chứng minh rollback thật sự xảy ra thay vì tin rằng nó xảy ra.

**Đọc.** [13.3 Sử dụng transaction trong ứng dụng Spring](#/docs/springstart-13) là một buổi gõ code liền mạch trên "sq-ch13-ex1". Dependency: starter web, \`spring-boot-starter-data-jdbc\`, và h2 với scope "runtime". Hai file trong thư mục resources — "schema.sql" tạo bảng account ba cột id, name, amount; "data.sql" chèn hai bản ghi Helen Down và Peter Read, mỗi người 1000. Rồi theo thiết kế Hình 13.6 từ dưới lên. Listing 13.2 là \`AccountRepository\` với \`findAccountById()\` dùng \`queryForObject()\` và \`changeAmount()\` dùng \`update()\`. Listing 13.3 là \`AccountRowMapper\` triển khai contract \`RowMapper\`. Listing 13.5 là trái tim của mục: \`transferMoney()\` mang \`@Transactional\`, lấy hai tài khoản, tính hai số tiền mới, gọi \`changeAmount()\` hai lần. Đọc Hình 13.7 để thấy transaction mở ngay trước method và đóng ngay sau khi method kết thúc thành công. Chạy thật ba lệnh cURL theo đúng thứ tự sách đưa: xem trước, chuyển $100, xem lại. Rồi mở "sq-ch13-ex2" — bản sao chỉ khác đúng một dòng của Listing 13.9 — và chạy lại đủ ba lệnh đó.

**Bẫy.** Thấy /accounts trả về 900 với 1100 rồi kết luận transaction đang hoạt động. Sách dừng lại đúng chỗ đó để hỏi ngược: làm sao bạn biết ứng dụng thật sự khôi phục dữ liệu khi có runtime exception? Khối LƯU Ý ngay sau đó là câu chốt — bạn không bao giờ nên tin thứ gì đó hoạt động trừ khi đã kiểm tra nó đúng cách; đó là lý do "sq-ch13-ex2" tồn tại. Bẫy thứ hai: gắn \`@Transactional\` lên class, gắn thêm một \`@Transactional\` cấu hình khác lên một method, rồi chờ hai cấu hình cộng lại. Sidebar "Sử dụng @Transactional" nói rõ luật: dùng trên class thì annotation áp dụng cho tất cả các method của class, còn khi dùng trên cả hai thì cấu hình ở cấp method ghi đè cấu hình trên class.

**Tự kiểm tra.** Trong Listing 13.9, dòng code duy nhất được thêm nằm ở chỗ nào của method, và sau khi chạy nó thì /accounts trả về bao nhiêu cho Helen? Và theo sidebar, vì sao ứng dụng thực tế thường gắn \`@Transactional\` lên class?`,
      },
      {
        id: "sh-w8-3",
        text: "Spring Data: là gì, hoạt động ra sao, và Spring Data JDBC",
        lesson: `**Mục tiêu.** Thay được cả class repository viết tay bằng một interface gần như rỗng, chọn đúng contract trong ba contract chuẩn, và thêm thao tác tuỳ chỉnh bằng \`@Query\`.

**Đọc.** [14.1 Spring Data là gì](#/docs/springstart-14) đọc nhanh, chỉ cần lấy lý do tồn tại: Hình 14.2 với Hình 14.3 bày ra mớ lựa chọn — JDBC trần, \`JdbcTemplate\`, Hibernate, NoSQL — mỗi thứ một bộ API phải học, còn Hình 14.4 đặt Spring Data thành một lớp abstraction chung phía trên. [14.2 Spring Data hoạt động như thế nào](#/docs/springstart-14) là phần phải chép ra giấy. Trước hết: không có "dependency Spring Data" duy nhất, mỗi công nghệ lưu trữ có module riêng. Sau đó là ba contract của Hình 14.6, học theo thứ tự tăng dần — \`Repository\` là marker interface không khai báo method nào, \`CrudRepository\` cho các thao tác tạo, truy xuất, cập nhật, xoá, còn \`PagingAndSortingRepository\` thêm sắp xếp cùng phân trang. [14.3 Sử dụng Spring Data JDBC](#/docs/springstart-14) làm thật trên "sq-ch14-ex1": Listing 14.1 đánh dấu primary key bằng \`@Id\`; Listing 14.2 là toàn bộ repository, một interface rỗng mở rộng \`CrudRepository<Account, Long>\`; Listing 14.3 thêm \`findAccountsByName\`; Listing 14.4 gắn \`@Query\`; Listing 14.5 thêm \`@Modifying\` cho câu UPDATE. Cuối buổi so Listing 14.7 với bản \`JdbcTemplate\` tuần trước.

**Bẫy.** Nhầm annotation \`@Repository\` với interface \`Repository\` của Spring Data. Khối LƯU Ý ngay sau Hình 14.6 tách bạch: \`@Repository\` là stereotype annotation bạn dùng với class để Spring thêm một instance vào application context, còn \`Repository\` là interface đặc thù của Spring Data mà bạn mở rộng — hoặc mở rộng một interface kế thừa từ nó — để định nghĩa một repository. Bẫy thứ hai: viết \`@Query\` cho một câu UPDATE rồi dừng ở đó. Sách nói thẳng thứ còn thiếu: khi truy vấn của bạn thay đổi dữ liệu, tức là UPDATE, INSERT hoặc DELETE, bạn cũng cần đánh dấu method bằng \`@Modifying\`; phần Tóm tắt nhắc lại bằng chữ "phải".

**Tự kiểm tra.** Theo chú thích của Listing 14.4, tên tham số trong câu truy vấn phải quan hệ thế nào với tham số của method? Và theo phần Tóm tắt, chuyện gì xảy ra nếu Spring Data không giải quyết được tên một method mà bạn không gắn \`@Query\`?`,
      },
      {
        id: "sh-w8-4",
        text: "Viết test đúng cách: unit test và integration test",
        lesson: `**Mục tiêu.** Viết được một unit test có đủ ba phần, chuyển chính nó thành một Spring integration test, và nói được vì sao không nên dùng loại thứ hai để thay loại thứ nhất.

**Đọc.** [15.1 Viết test được triển khai đúng cách](#/docs/springstart-15) đọc để lấy phương pháp chứ không lấy code. Lấy lại use case chuyển tiền rồi chép ra năm kịch bản sách liệt kê, vì mỗi kịch bản sẽ thành một method test. [15.2.1 Triển khai unit test](#/docs/springstart-15) là phần gõ code dài nhất tuần. Học thuộc ba phần của một test trước đã: giả định, gọi, xác nhận. Rồi đi theo chuỗi listing đúng thứ tự. Listing 15.2 tạo mock bằng \`mock(AccountRepository.class)\` rồi dựng \`TransferService\` quanh nó. Listing 15.3 điều khiển mock bằng \`given(...).willReturn(...)\`. Listing 15.4 thêm hai lời \`verify()\` khẳng định \`changeAmount()\` đã được gọi với 900 và với 1100. Listing 15.5 viết lại đúng test đó bằng \`@Mock\`, \`@InjectMocks\` và \`@ExtendWith(MockitoExtension.class)\`. Listing 15.6 là luồng exception. [15.2.2 Triển khai integration test](#/docs/springstart-15) ngắn hơn nhiều: gõ Listing 15.10 và tự nhận ra nó gần như chép lại test cũ, chỉ đổi sang \`@SpringBootTest\`, \`@MockBean\` và \`@Autowired\`, rồi để ý: khối LƯU Ý kế đó viết nhầm annotation thay thế thành \`@ExtendsWith\`, tên đúng là \`@ExtendWith\`.

**Bẫy.** Thấy integration test chạy được mọi thứ nên viết luôn mọi kịch bản bằng \`@SpringBootTest\`. Khối LƯU Ý khép chương cấm đúng nước đi này: hãy dùng unit test để xác nhận hành vi của các thành phần và integration test cho các kịch bản tích hợp cần thiết; dùng integration test cho mục đích kia không phải ý hay vì chúng mất nhiều thời gian hơn do phải cấu hình Spring context. Bẫy thứ hai: không mock repository trong integration test rồi trỏ thẳng vào database thật. Khối LƯU Ý ngay trước Listing 15.10 nói ngược lại: hãy dùng một database in-memory như H2, vì database thật gây độ trễ và có thể làm test thất bại khi hạ tầng trục trặc — bạn kiểm thử ứng dụng chứ không phải hạ tầng.

**Tự kiểm tra.** Trong Listing 15.6, lệnh nào khẳng định exception được ném ra, và lệnh nào khẳng định \`changeAmount()\` chưa hề được gọi? Và theo khối LƯU Ý về \`@MockBean\`, loại ứng dụng nào không dùng được annotation này, và ví dụ cho cách thay thế đó nằm trong project nào?`,
      },
    ],
  },
];
