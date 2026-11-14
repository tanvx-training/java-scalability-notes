package lab.s05;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import shop.order.OrderApplication;

/** s05: cột locked và enabled của shop_users có hiệu lực — đúng mật khẩu vẫn bị từ chối. */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S05AccountStatusTest {

  @LocalServerPort int port;

  @Autowired ApplicationContext ctx;

  @Autowired JdbcClient jdbc;

  private void rejected(String name, String password, Class<?> expected) throws Exception {
    HttpResponse<String> r = Support.get(port, "/orders", name, password);
    assertThat(r.statusCode()).withFailMessage("%s đúng mật khẩu: mong 401, nhận %s", name, r.statusCode()).isEqualTo(401);
    assertThat(r.headers().firstValue("WWW-Authenticate").orElse(""))
        .withFailMessage("401 của %s thiếu WWW-Authenticate: Basic", name).startsWith("Basic");
    Throwable thrown = null;
    try {
      Support.login(ctx, name, password);
    } catch (Exception e) {
      thrown = e;
    }
    String got = thrown == null ? "không ngoại lệ" : thrown.getClass().getSimpleName();
    assertThat(thrown).withFailMessage("đăng nhập %s: mong %s, nhận %s", name, expected.getSimpleName(), got)
        .isInstanceOf(expected);
  }

  @Test
  void lockedUserRejected() throws Exception {
    rejected("bill", "12345", LockedException.class);
    String name = DbUsers.randomName("l");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, true, true, List.of("read"));
    rejected(name, "pw-" + name, LockedException.class);
  }

  @Test
  void disabledUserRejected() throws Exception {
    String name = DbUsers.randomName("d");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, false, false, List.of("read"));
    rejected(name, "pw-" + name, DisabledException.class);
  }
}
