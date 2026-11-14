package lab.s01;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.context.ApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.SecurityFilterChain;

/** Trợ giúp chung cho test của buổi s01 (lab, không phải code của bạn). */
final class Support {

  private Support() {}

  /** GET qua cổng thật; user == null thì không gửi header Authorization. */
  static HttpResponse<String> get(int port, String path, String user, String password)
      throws IOException, InterruptedException {
    HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET();
    if (user != null) {
      String token = Base64.getEncoder()
          .encodeToString((user + ":" + password).getBytes(StandardCharsets.UTF_8));
      b.header("Authorization", "Basic " + token);
    }
    return HttpClient.newHttpClient().send(b.build(), HttpResponse.BodyHandlers.ofString());
  }

  /** Chain mà FilterChainProxy chọn cho GET /orders, đúng như lúc chạy thật. */
  static SecurityFilterChain chainForOrders(ApplicationContext ctx) {
    FilterChainProxy proxy = ctx.getBean(FilterChainProxy.class);
    MockHttpServletRequest req = new MockHttpServletRequest("GET", "/orders");
    req.setServletPath("/orders");
    for (SecurityFilterChain c : proxy.getFilterChains()) {
      if (c.matches(req)) {
        return c;
      }
    }
    throw new AssertionError("không có SecurityFilterChain nào nhận GET /orders");
  }

  /** Tên lớp (simple name) của từng filter trong chain, đúng thứ tự. */
  static List<String> filterNames(SecurityFilterChain chain) {
    List<String> names = new ArrayList<>();
    chain.getFilters().forEach(f -> names.add(f.getClass().getSimpleName()));
    return names;
  }

  /**
   * Đọc answers/&lt;id&gt;.env ở gốc workspace (thư mục cha của module order). Mỗi dòng KHOÁ=giá trị;
   * bỏ dòng trống và dòng bắt đầu bằng #.
   */
  static Map<String, String> answers(String id) throws IOException {
    Path dir = Path.of(System.getProperty("user.dir")).toAbsolutePath();
    for (int i = 0; i < 3 && dir != null; i++, dir = dir.getParent()) {
      Path f = dir.resolve("answers").resolve(id + ".env");
      if (Files.isRegularFile(f)) {
        Map<String, String> m = new LinkedHashMap<>();
        for (String line : Files.readAllLines(f, StandardCharsets.UTF_8)) {
          String l = line.strip();
          int eq = l.indexOf('=');
          if (l.isEmpty() || l.startsWith("#") || eq < 1) {
            continue;
          }
          m.put(l.substring(0, eq).strip(), l.substring(eq + 1).strip());
        }
        return m;
      }
    }
    throw new AssertionError("chưa có answers/" + id + ".env ở gốc workspace");
  }

  /** Giá trị của một khoá; thiếu khoá là trượt với thông báo rõ. */
  static String answer(Map<String, String> answers, String key, String id) {
    String v = answers.get(key);
    if (v == null || v.isEmpty()) {
      throw new AssertionError("answers/" + id + ".env thiếu " + key);
    }
    return v;
  }

  /** Danh sách cách nhau bởi dấu phẩy, bỏ khoảng trắng hai đầu từng phần tử. */
  static List<String> list(String value) {
    return Arrays.stream(value.split(",")).map(String::strip).filter(s -> !s.isEmpty()).toList();
  }
}
