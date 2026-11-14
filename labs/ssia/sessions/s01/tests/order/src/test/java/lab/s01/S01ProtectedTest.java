package lab.s01;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import shop.order.OrderApplication;

/** s01: endpoint nghiệp vụ của order không còn mở cho người lạ. Còn hiệu lực ở các buổi sau. */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S01ProtectedTest {

  @LocalServerPort int port;

  @Test
  void ordersWithoutCredentialsIs401() throws Exception {
    HttpResponse<String> r = Support.get(port, "/orders", null, null);
    assertThat(r.statusCode())
        .withFailMessage("GET /orders không gửi Authorization: mong 401, nhận %s", r.statusCode())
        .isEqualTo(401);
  }

  @Test
  void challengeIsHttpBasic() throws Exception {
    HttpResponse<String> r = Support.get(port, "/orders", null, null);
    String challenge = r.headers().firstValue("WWW-Authenticate").orElse("(không có)");
    assertThat(challenge)
        .withFailMessage("401 phải kèm WWW-Authenticate: Basic …, nhận %s", challenge)
        .startsWith("Basic ");
  }
}
