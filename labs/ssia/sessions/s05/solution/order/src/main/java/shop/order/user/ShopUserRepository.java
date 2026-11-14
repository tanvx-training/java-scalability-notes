package shop.order.user;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Đọc user của shop từ bảng shop_users và shop_user_authorities. Không biết gì về Spring Security. */
@Repository
public class ShopUserRepository {

  private final JdbcClient jdbc;

  public ShopUserRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  public Optional<ShopUser> findByUsername(String username) {
    return jdbc.sql("SELECT id, username, password, enabled, locked FROM shop_users WHERE username = ?")
        .param(username)
        .query((rs, i) -> new ShopUser(rs.getLong("id"), rs.getString("username"), rs.getString("password"),
            authorities(rs.getLong("id")), rs.getBoolean("enabled"), rs.getBoolean("locked")))
        .optional();
  }

  private List<String> authorities(long userId) {
    return jdbc.sql("SELECT authority FROM shop_user_authorities WHERE user_id = ? ORDER BY authority")
        .param(userId)
        .query(String.class)
        .list();
  }
}
