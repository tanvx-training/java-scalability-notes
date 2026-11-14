package lab.s07;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.simple.JdbcClient;
import shop.order.OrderApplication;

/**
 * s07, nhiệm vụ mổ xẻ: DelegatingPasswordEncoder đang chạy giao mỗi băm cho encoder nào, và ai băm lại
 * mật khẩu sau đăng nhập. Mọi giá trị so sánh được đo trên bean PasswordEncoder và provider thật lúc chấm.
 */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S07AnswersTest {

  /** Bốn giá trị cột password cố định của đề bài (t4). */
  static final String NOOP = "{noop}12345";
  static final String BCRYPT = "{bcrypt}$2a$10$dP4t8jNkckwh0PaPzcOK8eEu4lN.8Zl7kOns5/vmDbD2VtoAYxgXu";
  static final String UNPREFIXED = "20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a";
  static final String SHA256_PREFIXED = "{SHA-256}" + UNPREFIXED;
  static final String SCRYPT = "{scrypt}$e0801$zXSQzs6vJzwg5jtrQHMlSg==$8Cs5Kde6yx6M3JMrGsvL7Ts4fV/E6Kk3fqTOITfx5Bg=";

  @Autowired ApplicationContext ctx;

  @Autowired PasswordEncoder encoder;

  @Autowired JdbcClient jdbc;

  private DelegatingPasswordEncoder delegating() {
    assertThat(encoder).withFailMessage("bean PasswordEncoder là %s, đề bài cần một DelegatingPasswordEncoder",
        encoder.getClass().getSimpleName()).isInstanceOf(DelegatingPasswordEncoder.class);
    return (DelegatingPasswordEncoder) encoder;
  }

  @SuppressWarnings("unchecked")
  private Map<String, PasswordEncoder> map() throws Exception {
    return (Map<String, PasswordEncoder>) field(delegating(), "idToPasswordEncoder");
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
    throw new NoSuchFieldException(name);
  }

  /** Encoder mà DelegatingPasswordEncoder đang chạy sẽ gọi matches cho một giá trị đã lưu. */
  private String matcherFor(String stored) throws Exception {
    String id = null;
    if (stored.startsWith("{") && stored.indexOf('}') > 0) {
      id = stored.substring(1, stored.indexOf('}'));
    }
    PasswordEncoder d = map().get(id);
    if (d == null) {
      d = (PasswordEncoder) field(delegating(), "defaultPasswordEncoderForMatches");
    }
    return d.getClass().getSimpleName();
  }

  private static Set<String> lower(List<String> xs) {
    Set<String> s = new TreeSet<>();
    xs.forEach(x -> s.add(x.toLowerCase()));
    return s;
  }

  @Test
  void encoderIds() throws Exception {
    Map<String, String> ans = Support.answers("s07");
    String encodeId = Support.answer(ans, "ENCODE_ID", "s07");
    Set<String> ids = lower(Support.list(Support.answer(ans, "ENCODER_IDS", "s07")));
    assertThat(encodeId).withFailMessage("ENCODE_ID=%s chưa đúng id mà bean dùng khi encode", encodeId)
        .isEqualTo(field(delegating(), "idForEncode"));
    List<String> measured = new ArrayList<>();
    map().keySet().forEach(k -> measured.add(String.valueOf(k)));
    assertThat(ids).withFailMessage("ENCODER_IDS có %s id, chưa đúng tập id trong map của bean PasswordEncoder", ids.size())
        .isEqualTo(lower(measured));
  }

  @Test
  void deprecatedEncoders() throws Exception {
    Set<String> got = lower(Support.list(Support.answer(Support.answers("s07"), "DEPRECATED_ENCODERS", "s07")));
    List<String> measured = new ArrayList<>();
    for (PasswordEncoder e : map().values()) {
      if (e.getClass().isAnnotationPresent(Deprecated.class)) {
        measured.add(e.getClass().getSimpleName());
      }
    }
    assertThat(got).withFailMessage("DEPRECATED_ENCODERS có %s lớp, chưa đúng các lớp @Deprecated trong map", got.size())
        .isEqualTo(lower(measured));
  }

  @Test
  void whichEncoderMatches() throws Exception {
    Map<String, String> ans = Support.answers("s07");
    String[][] cases = {
        {"MATCHER_NOOP", NOOP}, {"MATCHER_BCRYPT", BCRYPT}, {"MATCHER_UNPREFIXED", UNPREFIXED},
        {"MATCHER_SHA256_PREFIXED", SHA256_PREFIXED}};
    for (String[] c : cases) {
      String got = Support.answer(ans, c[0], "s07");
      assertThat(got).withFailMessage("%s=%s chưa đúng encoder được gọi matches cho giá trị đó", c[0], got)
          .isEqualTo(matcherFor(c[1]));
    }
    String got = Support.answer(ans, "SCRYPT_ERROR", "s07");
    String measured = "none";
    try {
      encoder.matches("12345", SCRYPT);
    } catch (Throwable t) {
      measured = t.getClass().getSimpleName();
    }
    assertThat(got).withFailMessage("SCRYPT_ERROR=%s chưa đúng cái bean ném ra khi so một băm {scrypt} trên order", got)
        .isEqualTo(measured);
  }

  @Test
  void whoRehashes() throws Exception {
    Map<String, String> ans = Support.answers("s07");
    String caller = Support.answer(ans, "UPGRADE_CALLER", "s07");
    String bean = Support.answer(ans, "PASSWORD_SERVICE_BEAN", "s07");
    // Ai gọi updatePassword: dựng một provider với UserDetailsService và PasswordEncoder thật, nối một
    // UserDetailsPasswordService ghi lại khung gọi nó, rồi đăng nhập một user {noop} ngẫu nhiên.
    String name = DbUsers.randomName("who");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, true, false, List.of("read"));
    String[] frame = new String[1];
    DaoAuthenticationProvider p = new DaoAuthenticationProvider(ctx.getBean(UserDetailsService.class));
    p.setPasswordEncoder(encoder);
    p.setUserDetailsPasswordService((user, newPassword) -> {
      for (StackTraceElement e : new Throwable().getStackTrace()) {
        if (e.getClassName().startsWith("org.springframework.security")) {
          frame[0] = e.getClassName().substring(e.getClassName().lastIndexOf('.') + 1) + "." + e.getMethodName();
          break;
        }
      }
      return user;
    });
    p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(name, "pw-" + name));
    assertThat(caller).withFailMessage("UPGRADE_CALLER=%s chưa đúng Lớp.phươngThức gọi updatePassword", caller)
        .isEqualTo(String.valueOf(frame[0]));
    // Bean nào được nối vào provider thật của đăng nhập Basic.
    Object live = field(Support.authPathProvider(ctx), "userDetailsPasswordService");
    String measured = "NOOP";
    for (String n : ctx.getBeanNamesForType(UserDetailsPasswordService.class)) {
      if (ctx.getBean(n) == live) {
        measured = n;
      }
    }
    assertThat(bean).withFailMessage("PASSWORD_SERVICE_BEAN=%s chưa đúng bean UserDetailsPasswordService mà provider của Basic đang giữ", bean)
        .isEqualTo(measured);
  }
}
