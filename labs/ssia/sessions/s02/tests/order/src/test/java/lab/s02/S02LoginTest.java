package lab.s02;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import shop.order.OrderApplication;

/**
 * s02, tình huống hỏng st02-no-prefix: sau khi sửa, user john (mật khẩu 12345) đăng nhập được.
 * Tên và mật khẩu cố định theo đề bài. Còn hiệu lực ở s03.
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S02LoginTest {

  @LocalServerPort int port;

  @Autowired SecurityProperties security;

  @Test
  void johnGets200() throws Exception {
    HttpResponse<String> r = Support.get(port, "/orders", "john", "12345");
    assertThat(r.statusCode())
        .withFailMessage("GET /orders với john:12345: mong 200, nhận %s", r.statusCode())
        .isEqualTo(200);
  }

  @Test
  void johnWrongPasswordIs401() throws Exception {
    HttpResponse<String> r = Support.get(port, "/orders", "john", "54321");
    assertThat(r.statusCode())
        .withFailMessage("GET /orders với john:54321: mong 401, nhận %s", r.statusCode())
        .isEqualTo(401);
  }

  @Test
  void generatedUserIsGone() throws Exception {
    SecurityProperties.User u = security.getUser();
    HttpResponse<String> r = Support.get(port, "/orders", u.getName(), u.getPassword());
    assertThat(r.statusCode())
        .withFailMessage("user mặc định %s của Spring Boot vẫn đăng nhập được (nhận %s)", u.getName(), r.statusCode())
        .isEqualTo(401);
  }
}
