package lab.s01;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import shop.order.OrderApplication;

/**
 * s01: user mặc định do Spring Boot tạo đăng nhập được bằng HTTP Basic. Tên và mật khẩu lấy từ
 * SecurityProperties của chính context này (mật khẩu sinh lại mỗi lần khởi động).
 * Hết hiệu lực ở s02, khi order có UserDetailsService riêng (xem labs/ssia/sessions/s02/retire).
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S01DefaultUserTest {

  @LocalServerPort int port;

  @Autowired SecurityProperties security;

  @Test
  void defaultUserGets200() throws Exception {
    SecurityProperties.User u = security.getUser();
    HttpResponse<String> r = Support.get(port, "/orders", u.getName(), u.getPassword());
    assertThat(r.statusCode())
        .withFailMessage("GET /orders với user mặc định %s: mong 200, nhận %s", u.getName(), r.statusCode())
        .isEqualTo(200);
  }

  @Test
  void wrongPasswordIs401() throws Exception {
    SecurityProperties.User u = security.getUser();
    HttpResponse<String> r = Support.get(port, "/orders", u.getName(), u.getPassword() + "-sai");
    assertThat(r.statusCode())
        .withFailMessage("GET /orders với mật khẩu sai: mong 401, nhận %s", r.statusCode())
        .isEqualTo(401);
  }
}
