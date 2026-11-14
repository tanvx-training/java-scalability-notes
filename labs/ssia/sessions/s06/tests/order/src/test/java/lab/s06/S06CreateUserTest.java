package lab.s06;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import shop.order.OrderApplication;

/** s06: tạo user qua POST /users (đường dẫn và trường JSON cố định theo đề bài). */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S06CreateUserTest {

  @Autowired MockMvc mvc;

  @Autowired ApplicationContext ctx;

  @Autowired JdbcClient jdbc;

  @Test
  void createdUserLogsIn() throws Exception {
    String name = DbUsers.randomName("n");
    int s = Http.createUser(mvc, "john", "12345", true, Http.newUserJson(name, "pw-" + name, "read", "report"));
    assertThat(s).withFailMessage("POST /users bởi john có CSRF: mong 201, nhận %s", s).isEqualTo(201);
    int in = Http.getOrders(mvc, name, "pw-" + name);
    assertThat(in).withFailMessage("user vừa tạo gọi GET /orders: mong 200, nhận %s", in).isEqualTo(200);
    int wrong = Http.getOrders(mvc, name, "sai-" + name);
    assertThat(wrong).withFailMessage("user vừa tạo với mật khẩu sai: mong 401, nhận %s", wrong).isEqualTo(401);
    Set<String> got = new TreeSet<>();
    ((UserDetails) Support.login(ctx, name, "pw-" + name).getPrincipal()).getAuthorities()
        .forEach(g -> got.add(g.getAuthority()));
    assertThat(got).withFailMessage("authority của user vừa tạo là %s, mong [read, report]", got)
        .isEqualTo(Set.of("read", "report"));
  }

  @Test
  void endpointsStillNeedCsrfAndLogin() throws Exception {
    String name = DbUsers.randomName("c");
    String body = Http.newUserJson(name, "pw-" + name, "read");
    int noCsrf = Http.createUser(mvc, "john", "12345", false, body);
    assertThat(noCsrf).withFailMessage("POST /users không có token CSRF: mong 403, nhận %s", noCsrf).isEqualTo(403);
    int anonymous = Http.createUser(mvc, null, null, true, body);
    assertThat(anonymous).withFailMessage("POST /users ẩn danh: mong 401, nhận %s", anonymous).isEqualTo(401);
    int pwNoCsrf = Http.changePassword(mvc, "john", "12345", false, Http.passwordJson("12345", "x"));
    assertThat(pwNoCsrf).withFailMessage("PUT /users/me/password không có token CSRF: mong 403, nhận %s", pwNoCsrf)
        .isEqualTo(403);
    int ok = Http.createUser(mvc, "john", "12345", true, body);
    assertThat(ok).withFailMessage("POST /users bởi john có CSRF: mong 201, nhận %s", ok).isEqualTo(201);
  }

  @Test
  void duplicateUsernameIs409() throws Exception {
    int s = Http.createUser(mvc, "john", "12345", true, Http.newUserJson("mary", "khac", "read"));
    assertThat(s).withFailMessage("POST /users với username mary đã có: mong 409, nhận %s", s).isEqualTo(409);
    int mary = Http.getOrders(mvc, "mary", "67890");
    assertThat(mary).withFailMessage("sau POST trùng, mary:67890 nhận %s, mong 200 (không được ghi đè)", mary)
        .isEqualTo(200);
  }

  @Test
  void storedPasswordIsEncoded() throws Exception {
    String name = DbUsers.randomName("e");
    String raw = "pw-" + name;
    int s = Http.createUser(mvc, "john", "12345", true, Http.newUserJson(name, raw, "read"));
    assertThat(s).withFailMessage("POST /users: mong 201, nhận %s", s).isEqualTo(201);
    String stored = jdbc.sql("SELECT password FROM shop_users WHERE username = ?").param(name).query(String.class).single();
    assertThat(stored.contains(raw))
        .withFailMessage("cột password của user mới còn chứa nguyên chữ người dùng gõ (chữ thường hoặc {noop}), chưa qua encode")
        .isFalse();
    assertThat(ctx.getBean(PasswordEncoder.class).matches(raw, stored))
        .withFailMessage("bean PasswordEncoder không khớp mật khẩu gõ với giá trị trong cột password").isTrue();
  }
}
