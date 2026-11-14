package lab.s07;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

/** Đăng nhập Basic qua MockMvc (đi qua springSecurityFilterChain) và đọc cột password của shop_users. */
final class Login {

  private Login() {}

  /**
   * Mã trạng thái của GET /orders với Basic. Ngoại lệ thoát khỏi chain (ví dụ encoder ném
   * IllegalArgumentException khi băm không có tiền tố) thành AssertionError một dòng, dễ đọc trong verify.
   */
  static int status(MockMvc mvc, String user, String password) {
    try {
      return mvc.perform(get("/orders").with(httpBasic(user, password))).andReturn().getResponse().getStatus();
    } catch (Exception e) {
      Throwable root = e;
      while (root.getCause() != null) {
        root = root.getCause();
      }
      throw new AssertionError("đăng nhập " + user + " làm request ném " + root.getClass().getSimpleName()
          + " (không phải 200 hay 401): xem log của encoder");
    }
  }

  static String stored(JdbcClient jdbc, String username) {
    return jdbc.sql("SELECT password FROM shop_users WHERE username = ?").param(username).query(String.class).single();
  }

  /** Băm kiểu hệ thống cũ: SHA-256 hex của mật khẩu, không salt, không tiền tố {id}. */
  static String legacySha256(String raw) throws Exception {
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
  }
}
