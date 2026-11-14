package lab.s05;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import shop.order.OrderApplication;

/** s05: user của order nằm trong bảng shop_users; UserDetailsService đọc DB ở mỗi lần đăng nhập. */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S05DbUsersTest {

  @LocalServerPort int port;

  @Autowired ApplicationContext ctx;

  @Autowired JdbcClient jdbc;

  private int status(String user, String password) throws Exception {
    return Support.get(port, "/orders", user, password).statusCode();
  }

  @Test
  void newDbUserLogsInDeletedUserCannot() throws Exception {
    String name = DbUsers.randomName("u");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, true, false, List.of("read", "report"));
    int in = status(name, "pw-" + name);
    assertThat(in).withFailMessage("user vừa chèn vào shop_users: mong 200, nhận %s", in).isEqualTo(200);
    Authentication a = Support.login(ctx, name, "pw-" + name);
    Set<String> got = new TreeSet<>();
    ((UserDetails) a.getPrincipal()).getAuthorities().forEach(g -> got.add(g.getAuthority()));
    assertThat(got).withFailMessage("authority của user vừa chèn là %s, mong [read, report] như shop_user_authorities", got)
        .isEqualTo(Set.of("read", "report"));
    DbUsers.delete(jdbc, name);
    int out = status(name, "pw-" + name);
    assertThat(out).withFailMessage("user đã xoá khỏi shop_users vẫn đăng nhập được (nhận %s): còn user giữ ngoài DB", out)
        .isEqualTo(401);
  }

  @Test
  void seedDataInTable() {
    Map<String, String> rows = new java.util.TreeMap<>();
    jdbc.sql("SELECT username, enabled, locked FROM shop_users WHERE username IN (?, ?, ?)")
        .params("john", "mary", "bill")
        .query((rs, i) -> rows.put(rs.getString("username"), rs.getBoolean("enabled") + "/" + rs.getBoolean("locked")))
        .list();
    assertThat(rows).withFailMessage("shop_users có %s (enabled/locked), mong john true/false, mary true/false, bill true/true", rows)
        .isEqualTo(Map.of("john", "true/false", "mary", "true/false", "bill", "true/true"));
  }
}
