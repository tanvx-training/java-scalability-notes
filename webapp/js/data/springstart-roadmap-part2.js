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

**Tự kiểm tra.** Theo Bảng 8.1, giá trị tuỳ chọn thì gửi bằng cách nào, và vì sao cách còn lại không hợp? Và trong Listing 8.11, hai action cùng ánh xạ vào \`/products\` mà không xung đột nhờ thứ gì?`,
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
];
