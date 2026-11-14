package lab.s06;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import shop.order.OrderApplication;

/** s06: PUT /users/me/password đổi mật khẩu của chính user đang đăng nhập, sau khi kiểm mật khẩu cũ. */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S06ChangePasswordTest {

  @Autowired MockMvc mvc;

  @Autowired JdbcClient jdbc;

  @Test
  void oldPasswordRejectedAfterChange() throws Exception {
    String name = DbUsers.randomName("p");
    DbUsers.insert(jdbc, name, "{noop}old-" + name, true, false, List.of("read"));
    int s = Http.changePassword(mvc, name, "old-" + name, true, Http.passwordJson("old-" + name, "new-" + name));
    assertThat(s).withFailMessage("PUT /users/me/password đúng mật khẩu cũ: mong 2xx, nhận %s", s).isBetween(200, 299);
    int old = Http.getOrders(mvc, name, "old-" + name);
    assertThat(old).withFailMessage("sau khi đổi, mật khẩu cũ: mong 401, nhận %s", old).isEqualTo(401);
    int fresh = Http.getOrders(mvc, name, "new-" + name);
    assertThat(fresh).withFailMessage("sau khi đổi, mật khẩu mới: mong 200, nhận %s", fresh).isEqualTo(200);
  }

  @Test
  void wrongOldPasswordChangesNothing() throws Exception {
    String name = DbUsers.randomName("w");
    DbUsers.insert(jdbc, name, "{noop}old-" + name, true, false, List.of("read"));
    MockHttpServletResponse r = Http.changePasswordResponse(mvc, name, "old-" + name,
        Http.passwordJson("doan-bua", "hacked-" + name));
    String challenge = r.getHeader("WWW-Authenticate");
    assertThat(challenge).withFailMessage("PUT sai mật khẩu cũ trả %s kèm WWW-Authenticate: %s (lỗi nghiệp vụ bị biến thành thách thức đăng nhập)",
        r.getStatus(), challenge).isNull();
    assertThat(r.getStatus()).withFailMessage("PUT /users/me/password sai mật khẩu cũ: mong 400, nhận %s", r.getStatus())
        .isEqualTo(400);
    int hacked = Http.getOrders(mvc, name, "hacked-" + name);
    assertThat(hacked).withFailMessage("sai mật khẩu cũ mà mật khẩu vẫn bị đổi (mật khẩu mới nhận %s)", hacked).isEqualTo(401);
    int ok = Http.changePassword(mvc, name, "old-" + name, true, Http.passwordJson("old-" + name, "new-" + name));
    assertThat(ok).withFailMessage("sau lần sai, đổi với đúng mật khẩu cũ: mong 2xx, nhận %s", ok).isBetween(200, 299);
    int fresh = Http.getOrders(mvc, name, "new-" + name);
    assertThat(fresh).withFailMessage("mật khẩu mới sau lần đổi đúng: mong 200, nhận %s", fresh).isEqualTo(200);
  }
}
