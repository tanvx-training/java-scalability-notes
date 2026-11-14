package lab.s06;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import shop.order.OrderApplication;

/**
 * s06, nhiệm vụ mổ xẻ (listing 3.21): JdbcUserDetailsManager đọc được lược đồ có sẵn của shop nếu
 * bạn đưa cho nó hai truy vấn đúng. Lab dựng một JdbcUserDetailsManager trên DataSource của order
 * với USERS_QUERY và AUTHORITIES_QUERY trong answers/s06.env, nối vào một DaoAuthenticationProvider
 * dùng bean PasswordEncoder, rồi đăng nhập thật: mary vào được với đúng authority, bill bị khoá,
 * user bị vô hiệu bị từ chối, sai mật khẩu bị từ chối.
 */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S06JdbcOnShopUsersTest {

  @Autowired DataSource dataSource;

  @Autowired PasswordEncoder passwordEncoder;

  @Autowired JdbcClient jdbc;

  private static String outcome(DaoAuthenticationProvider p, String user, String password) {
    try {
      p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(user, password));
      return "đăng nhập được";
    } catch (Exception e) {
      return e.getClass().getSimpleName();
    }
  }

  @Test
  void customQueriesReadShopUsers() throws Exception {
    Map<String, String> a = Support.answers("s06");
    String usersQuery = Support.answer(a, "USERS_QUERY", "s06");
    String authoritiesQuery = Support.answer(a, "AUTHORITIES_QUERY", "s06");
    JdbcUserDetailsManager m = new JdbcUserDetailsManager(dataSource);
    m.setUsersByUsernameQuery(usersQuery);
    m.setAuthoritiesByUsernameQuery(authoritiesQuery);
    DaoAuthenticationProvider p = new DaoAuthenticationProvider(m);
    p.setPasswordEncoder(passwordEncoder);

    Authentication mary;
    try {
      mary = p.authenticate(UsernamePasswordAuthenticationToken.unauthenticated("mary", "67890"));
    } catch (Exception e) {
      throw new AssertionError("mary:67890 qua JdbcUserDetailsManager với hai truy vấn của bạn: " + e.getClass().getSimpleName()
          + " " + e.getMessage());
    }
    Set<String> got = new TreeSet<>();
    ((UserDetails) mary.getPrincipal()).getAuthorities().forEach(g -> got.add(g.getAuthority()));
    assertThat(got).withFailMessage("authority của mary qua AUTHORITIES_QUERY là %s, mong [read, write]", got)
        .isEqualTo(Set.of("read", "write"));

    String bill = outcome(p, "bill", "12345");
    assertThat(bill).withFailMessage("bill (locked = TRUE) đúng mật khẩu: mong LockedException, nhận %s", bill)
        .isEqualTo(LockedException.class.getSimpleName());

    String name = DbUsers.randomName("j");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, false, false, List.of("read"));
    String disabled = outcome(p, name, "pw-" + name);
    assertThat(disabled).withFailMessage("user enabled = FALSE đúng mật khẩu: mong DisabledException, nhận %s", disabled)
        .isEqualTo(DisabledException.class.getSimpleName());

    String wrong = outcome(p, "john", "sai-mat-khau");
    assertThat(wrong).withFailMessage("john sai mật khẩu: mong BadCredentialsException, nhận %s", wrong)
        .isEqualTo(BadCredentialsException.class.getSimpleName());
  }
}
