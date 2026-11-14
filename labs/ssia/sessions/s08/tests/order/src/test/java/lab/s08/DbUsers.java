package lab.s08;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * Ghi user thẳng vào bảng của đề bài: shop_users (id, username, password, enabled, locked) và
 * shop_user_authorities (user_id, authority). Mỗi test dùng một username ngẫu nhiên vì mọi context
 * test trong cùng JVM dùng chung một H2 trong bộ nhớ.
 */
final class DbUsers {

  private DbUsers() {}

  static String randomName(String prefix) {
    return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
  }

  static void insert(JdbcClient jdbc, String username, String storedPassword, boolean enabled, boolean locked,
      List<String> authorities) {
    jdbc.sql("INSERT INTO shop_users (username, password, enabled, locked) VALUES (?, ?, ?, ?)")
        .params(username, storedPassword, enabled, locked)
        .update();
    for (String a : authorities) {
      jdbc.sql("INSERT INTO shop_user_authorities (user_id, authority) SELECT id, ? FROM shop_users WHERE username = ?")
          .params(a, username)
          .update();
    }
  }

  static void delete(JdbcClient jdbc, String username) {
    jdbc.sql("DELETE FROM shop_user_authorities WHERE user_id IN (SELECT id FROM shop_users WHERE username = ?)")
        .param(username)
        .update();
    jdbc.sql("DELETE FROM shop_users WHERE username = ?").param(username).update();
  }
}
