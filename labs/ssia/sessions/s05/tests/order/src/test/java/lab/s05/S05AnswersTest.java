package lab.s05;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import shop.order.OrderApplication;

/**
 * s05, nhiệm vụ mổ xẻ: username không tồn tại và tài khoản bị khoá đi ra khỏi AuthenticationManager
 * dưới dạng ngoại lệ nào, và cờ nào quyết định việc che UsernameNotFoundException. Đo lúc chấm, trên
 * AuthenticationManager thật của BasicAuthenticationFilter và trên provider của bản đang chạy.
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S05AnswersTest {

  @Autowired ApplicationContext ctx;

  private Throwable failure(String user, String password) {
    try {
      Support.login(ctx, user, password);
      return null;
    } catch (Throwable t) {
      return t;
    }
  }

  private static String name(Object o) {
    return o == null ? "null" : o.getClass().getSimpleName();
  }

  @Test
  void notFound() throws Exception {
    Map<String, String> a = Support.answers("s05");
    String gotEx = Support.answer(a, "NOT_FOUND_EXCEPTION", "s05");
    String gotCause = Support.answer(a, "NOT_FOUND_CAUSE", "s05");
    Throwable t = failure(DbUsers.randomName("ghost"), "x");
    assertThat(gotEx).withFailMessage("NOT_FOUND_EXCEPTION=%s chưa đúng ngoại lệ ra khỏi AuthenticationManager", gotEx)
        .isEqualTo(name(t));
    assertThat(gotCause).withFailMessage("NOT_FOUND_CAUSE=%s chưa đúng getCause() của ngoại lệ đó", gotCause)
        .isEqualTo(t == null ? "null" : name(t.getCause()));
  }

  /** Cờ người học chỉ ra phải là trường boolean của provider và thật sự đổi được hành vi. */
  @Test
  void hideFlag() throws Exception {
    Map<String, String> a = Support.answers("s05");
    String flag = Support.answer(a, "HIDE_FLAG", "s05");
    String declaredIn = Support.answer(a, "HIDE_FLAG_DECLARED_IN", "s05");
    Field f = null;
    for (Class<?> c = DaoAuthenticationProvider.class; c != null && f == null; c = c.getSuperclass()) {
      for (Field x : c.getDeclaredFields()) {
        if (x.getName().equals(flag) && x.getType() == boolean.class) {
          f = x;
        }
      }
    }
    assertThat(f).withFailMessage("HIDE_FLAG=%s không phải trường boolean của DaoAuthenticationProvider hay lớp cha", flag)
        .isNotNull();
    assertThat(declaredIn).withFailMessage("HIDE_FLAG_DECLARED_IN=%s chưa đúng lớp khai trường %s", declaredIn, flag)
        .isEqualTo(f.getDeclaringClass().getSimpleName());
    f.setAccessible(true);
    String ghost = DbUsers.randomName("ghost");
    String hidden = name(tryProvider(f, true, ghost));
    String shown = name(tryProvider(f, false, ghost));
    assertThat(shown).withFailMessage("đặt %s=false không làm lộ ngoại lệ gốc (vẫn %s): cờ này không điều khiển việc che",
        flag, shown).isEqualTo("UsernameNotFoundException");
    assertThat(hidden).withFailMessage("đặt %s=true vẫn ra %s", flag, hidden).isNotEqualTo("UsernameNotFoundException");
  }

  private Throwable tryProvider(Field flag, boolean value, String user) throws Exception {
    DaoAuthenticationProvider p = new DaoAuthenticationProvider(ctx.getBean(UserDetailsService.class));
    p.setPasswordEncoder(ctx.getBean(PasswordEncoder.class));
    flag.setBoolean(p, value);
    try {
      p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(user, "x"));
      return null;
    } catch (Throwable t) {
      return t;
    }
  }

  @Test
  void locked() throws Exception {
    Map<String, String> a = Support.answers("s05");
    String gotEx = Support.answer(a, "LOCKED_EXCEPTION", "s05");
    String gotParent = Support.answer(a, "LOCKED_PARENT", "s05");
    String gotWrong = Support.answer(a, "LOCKED_WRONG_PASSWORD", "s05");
    Throwable right = failure("bill", "12345");
    Throwable wrong = failure("bill", "sai-mat-khau");
    assertThat(gotEx).withFailMessage("LOCKED_EXCEPTION=%s chưa đúng ngoại lệ khi bill đăng nhập đúng mật khẩu", gotEx)
        .isEqualTo(name(right));
    assertThat(gotParent).withFailMessage("LOCKED_PARENT=%s chưa đúng lớp cha trực tiếp của ngoại lệ đó", gotParent)
        .isEqualTo(right == null ? "null" : right.getClass().getSuperclass().getSimpleName());
    assertThat(gotWrong).withFailMessage("LOCKED_WRONG_PASSWORD=%s chưa đúng ngoại lệ khi bill gõ sai mật khẩu", gotWrong)
        .isEqualTo(name(wrong));
  }
}
