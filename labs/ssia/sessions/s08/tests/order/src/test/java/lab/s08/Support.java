package lab.s08;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

/** Trợ giúp chung cho test của buổi s08 (lab, không phải code của bạn). */
final class Support {

  private Support() {}

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

  /**
   * Provider đầu tiên nhận UsernamePasswordAuthenticationToken trên đường đi thật của một lần đăng
   * nhập Basic (từ AuthenticationManager mà BasicAuthenticationFilter giữ, qua các ProviderManager cha),
   * đã bóc lớp bọc đo đạc.
   */
  static Object authPathProvider(ApplicationContext ctx) throws Exception {
    ProviderManager pm = providerManager(basicManager(ctx));
    while (pm != null) {
      for (AuthenticationProvider p : pm.getProviders()) {
        if (p.supports(UsernamePasswordAuthenticationToken.class)) {
          return unwrap(p);
        }
      }
      Object parent = field(pm, "parent");
      pm = parent == null ? null : providerManager(parent);
    }
    throw new AssertionError("không provider nào nhận UsernamePasswordAuthenticationToken");
  }

  /** AuthenticationManager mà BasicAuthenticationFilter của chain GET /orders đang giữ. */
  static AuthenticationManager basicManager(ApplicationContext ctx) throws Exception {
    for (Object f : chainForOrders(ctx).getFilters()) {
      if (f instanceof BasicAuthenticationFilter b) {
        return (AuthenticationManager) call(b, "getAuthenticationManager");
      }
    }
    throw new AssertionError("chain của GET /orders không có BasicAuthenticationFilter");
  }

  /**
   * Đăng nhập đúng như BasicAuthenticationFilter làm (cùng AuthenticationManager), trả về đối tượng
   * Authentication mà filter sẽ đặt vào SecurityContext.
   */
  static Authentication login(ApplicationContext ctx, String user, String password) throws Exception {
    return basicManager(ctx).authenticate(UsernamePasswordAuthenticationToken.unauthenticated(user, password));
  }

  /** Tên lớp (simple name) của từng filter trong chain, đúng thứ tự. */
  static List<String> filterNames(SecurityFilterChain chain) {
    List<String> names = new ArrayList<>();
    chain.getFilters().forEach(f -> names.add(f.getClass().getSimpleName()));
    return names;
  }

  /** Tên bean duy nhất của một kiểu; không có hoặc nhiều hơn một là trượt với thông báo rõ. */
  static String onlyBean(ApplicationContext ctx, Class<?> type) {
    String[] names = ctx.getBeanNamesForType(type);
    if (names.length != 1) {
      throw new AssertionError("cần đúng một bean " + type.getSimpleName() + ", đang có " + names.length);
    }
    return names[0];
  }

  /** Bóc các lớp bọc (vd. đo đạc Observation) có trường delegate, tới ProviderManager. */
  private static ProviderManager providerManager(Object manager) throws Exception {
    Object m = unwrap(manager);
    if (m instanceof ProviderManager pm) {
      return pm;
    }
    throw new AssertionError("AuthenticationManager không phải ProviderManager: " + m.getClass().getName());
  }

  private static Object unwrap(Object o) throws Exception {
    Object cur = o;
    for (int i = 0; i < 5; i++) {
      Object d = fieldOrNull(cur, "delegate");
      if (d instanceof AuthenticationManager || d instanceof AuthenticationProvider) {
        cur = d;
      } else {
        return cur;
      }
    }
    return cur;
  }

  static Object call(Object o, String name) throws Exception {
    for (Class<?> c = o.getClass(); c != null; c = c.getSuperclass()) {
      try {
        Method m = c.getDeclaredMethod(name);
        m.setAccessible(true);
        return m.invoke(o);
      } catch (NoSuchMethodException e) {
        // lên lớp cha
      }
    }
    throw new NoSuchMethodException(o.getClass().getName() + "." + name);
  }

  private static Object field(Object o, String name) throws Exception {
    for (Class<?> c = o.getClass(); c != null; c = c.getSuperclass()) {
      try {
        Field f = c.getDeclaredField(name);
        f.setAccessible(true);
        return f.get(o);
      } catch (NoSuchFieldException e) {
        // lên lớp cha
      }
    }
    throw new NoSuchFieldException(o.getClass().getName() + "." + name);
  }

  private static Object fieldOrNull(Object o, String name) {
    try {
      return field(o, name);
    } catch (Exception e) {
      return null;
    }
  }

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

  static String answer(Map<String, String> answers, String key, String id) {
    String v = answers.get(key);
    if (v == null || v.isEmpty()) {
      throw new AssertionError("answers/" + id + ".env thiếu " + key);
    }
    return v;
  }

  static List<String> list(String value) {
    return Arrays.stream(value.split(",")).map(String::strip).filter(s -> !s.isEmpty()).toList();
  }
}
