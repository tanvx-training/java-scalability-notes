package lab.s03;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import shop.order.OrderApplication;

/** s03: luật endpoint do bạn viết — health mở cho probe, phần còn lại cần đăng nhập. */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S03AccessTest {

  @LocalServerPort int port;

  private int status(String path, String user, String password) throws Exception {
    HttpResponse<String> r = Support.get(port, path, user, password);
    return r.statusCode();
  }

  @Test
  void healthIsOpen() throws Exception {
    int s = status("/actuator/health", null, null);
    assertThat(s).withFailMessage("GET /actuator/health không đăng nhập: mong 200, nhận %s", s).isEqualTo(200);
  }

  @Test
  void livenessIsOpen() throws Exception {
    int s = status("/actuator/health/liveness", null, null);
    assertThat(s).withFailMessage("GET /actuator/health/liveness không đăng nhập: mong 200, nhận %s", s).isEqualTo(200);
  }

  @Test
  void actuatorIndexNeedsLogin() throws Exception {
    int s = status("/actuator", null, null);
    assertThat(s).withFailMessage("GET /actuator không đăng nhập: mong 401, nhận %s", s).isEqualTo(401);
  }

  @Test
  void ordersNeedLogin() throws Exception {
    int s = status("/orders", null, null);
    assertThat(s).withFailMessage("GET /orders không đăng nhập: mong 401, nhận %s", s).isEqualTo(401);
  }

  @Test
  void johnGets200() throws Exception {
    int s = status("/orders", "john", "12345");
    assertThat(s).withFailMessage("GET /orders với john:12345: mong 200, nhận %s", s).isEqualTo(200);
  }
}
