package lab.s04;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import shop.order.OrderApplication;

/**
 * s04: sau đăng nhập, principal trong Authentication là UserDetails do bạn viết, bọc một thực thể
 * user của shop, và mang đúng quyền như dữ liệu. Đăng nhập qua đúng AuthenticationManager mà
 * BasicAuthenticationFilter dùng; không phụ thuộc tên lớp bạn đặt.
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S04PrincipalTest {

  @Autowired ApplicationContext ctx;

  private Authentication login(String user, String password) throws Exception {
    try {
      return Support.login(ctx, user, password);
    } catch (AuthenticationException e) {
      throw new AssertionError("đăng nhập " + user + " thất bại: " + e.getClass().getSimpleName() + " " + e.getMessage());
    }
  }

  static Set<String> names(java.util.Collection<? extends GrantedAuthority> authorities) {
    Set<String> s = new TreeSet<>();
    authorities.forEach(a -> s.add(a.getAuthority()));
    return s;
  }

  @Test
  void principalIsYourUserDetails() throws Exception {
    Object p = login("mary", "67890").getPrincipal();
    assertThat(p).withFailMessage("principal của mary không phải UserDetails mà là %s", p.getClass().getName())
        .isInstanceOf(UserDetails.class);
    assertThat(p.getClass().getName())
        .withFailMessage("principal của mary là %s, lớp của Spring, chưa phải lớp của bạn", p.getClass().getName())
        .doesNotStartWith("org.springframework.");
  }

  @Test
  void principalWrapsYourUserEntity() throws Exception {
    Class<?> type = login("mary", "67890").getPrincipal().getClass();
    boolean wraps = false;
    for (Class<?> c = type; c != null && c != Object.class; c = c.getSuperclass()) {
      for (Field f : c.getDeclaredFields()) {
        Class<?> t = f.getType();
        String n = t.getName();
        if (Modifier.isStatic(f.getModifiers()) || t.isPrimitive() || t.isArray()) {
          continue;
        }
        if (n.startsWith("java.") || n.startsWith("javax.") || n.startsWith("jakarta.") || n.startsWith("org.springframework.")) {
          continue;
        }
        if (!UserDetails.class.isAssignableFrom(t)) {
          wraps = true;
        }
      }
    }
    assertThat(wraps).withFailMessage("%s không giữ trường nào kiểu thực thể user của bạn (lớp riêng, không phải UserDetails)",
        type.getSimpleName()).isTrue();
  }

  @Test
  void authoritiesMatchData() throws Exception {
    UserDetails john = (UserDetails) login("john", "12345").getPrincipal();
    UserDetails mary = (UserDetails) login("mary", "67890").getPrincipal();
    assertThat(names(john.getAuthorities())).withFailMessage("authority của john là %s, mong [read]",
        names(john.getAuthorities())).isEqualTo(Set.of("read"));
    assertThat(names(mary.getAuthorities())).withFailMessage("authority của mary là %s, mong [read, write]",
        names(mary.getAuthorities())).isEqualTo(Set.of("read", "write"));
  }
}
