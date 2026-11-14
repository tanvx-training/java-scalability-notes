package lab.s04;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import shop.order.OrderApplication;

/** s04: hai user của shop theo đề bài — john / 12345 (read) và mary / 67890 (read, write). */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S04LoginTest {

  @LocalServerPort int port;

  @Test
  void johnAndMaryLogIn() throws Exception {
    int john = Support.get(port, "/orders", "john", "12345").statusCode();
    assertThat(john).withFailMessage("GET /orders với john:12345: mong 200, nhận %s", john).isEqualTo(200);
    int mary = Support.get(port, "/orders", "mary", "67890").statusCode();
    assertThat(mary).withFailMessage("GET /orders với mary:67890: mong 200, nhận %s", mary).isEqualTo(200);
    int swapped = Support.get(port, "/orders", "mary", "12345").statusCode();
    assertThat(swapped).withFailMessage("GET /orders với mary:12345 (mật khẩu của john): mong 401, nhận %s", swapped)
        .isEqualTo(401);
  }
}
