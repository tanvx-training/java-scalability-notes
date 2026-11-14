package lab.s04;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import shop.order.OrderApplication;

/**
 * s04, nhiệm vụ mổ xẻ: Authentication của mary sau đăng nhập chứa gì. Mọi giá trị được đo lúc chấm
 * từ đối tượng thật (đăng nhập qua AuthenticationManager của BasicAuthenticationFilter) và từ
 * interface UserDetails của bản đang chạy.
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S04AnswersTest {

  @Autowired ApplicationContext ctx;

  private static Set<String> set(String v) {
    return new HashSet<>(Support.list(v));
  }

  @Test
  void principalClass() throws Exception {
    String got = Support.answer(Support.answers("s04"), "PRINCIPAL_CLASS", "s04");
    Authentication a = Support.login(ctx, "mary", "67890");
    assertThat(got).withFailMessage("PRINCIPAL_CLASS=%s chưa đúng lớp của principal sau đăng nhập", got)
        .isEqualTo(a.getPrincipal().getClass().getSimpleName());
  }

  @Test
  void extraAuthority() throws Exception {
    Map<String, String> ans = Support.answers("s04");
    Set<String> gotNames = set(Support.answer(ans, "EXTRA_AUTHORITY", "s04"));
    Set<String> gotClasses = set(Support.answer(ans, "EXTRA_AUTHORITY_CLASS", "s04"));
    Authentication a = Support.login(ctx, "mary", "67890");
    Set<String> fromUser = new HashSet<>();
    ((UserDetails) a.getPrincipal()).getAuthorities().forEach(g -> fromUser.add(g.getAuthority()));
    Set<String> names = new TreeSet<>();
    Set<String> classes = new TreeSet<>();
    for (GrantedAuthority g : a.getAuthorities()) {
      if (!fromUser.contains(g.getAuthority())) {
        names.add(g.getAuthority());
        classes.add(g.getClass().getSimpleName());
      }
    }
    assertThat(gotNames).withFailMessage("EXTRA_AUTHORITY=%s chưa đúng authority có trong Authentication mà không có trong UserDetails",
        gotNames).isEqualTo(names);
    assertThat(gotClasses).withFailMessage("EXTRA_AUTHORITY_CLASS=%s chưa đúng lớp của authority đó", gotClasses)
        .isEqualTo(classes);
  }

  @Test
  void defaultMethods() throws Exception {
    Set<String> got = set(Support.answer(Support.answers("s04"), "DEFAULT_METHODS", "s04"));
    Set<String> measured = new TreeSet<>();
    for (Method m : UserDetails.class.getDeclaredMethods()) {
      if (m.isDefault()) {
        measured.add(m.getName());
      }
    }
    assertThat(got).withFailMessage("DEFAULT_METHODS có %s tên, chưa đúng các phương thức default của UserDetails", got.size())
        .isEqualTo(measured);
  }

  @Test
  void authClassAndCredentials() throws Exception {
    Map<String, String> ans = Support.answers("s04");
    String gotClass = Support.answer(ans, "AUTH_CLASS", "s04");
    String gotCred = Support.answer(ans, "CREDENTIALS_AFTER_LOGIN", "s04");
    Authentication a = Support.login(ctx, "mary", "67890");
    assertThat(gotClass).withFailMessage("AUTH_CLASS=%s chưa đúng lớp của Authentication sau đăng nhập", gotClass)
        .isEqualTo(a.getClass().getSimpleName());
    assertThat(gotCred).withFailMessage("CREDENTIALS_AFTER_LOGIN=%s chưa đúng giá trị getCredentials() sau đăng nhập", gotCred)
        .isEqualTo(String.valueOf(a.getCredentials()));
  }
}
