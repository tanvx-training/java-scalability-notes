package shop.order.user;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** Đọc và ghi user của shop trong bảng shop_users và shop_user_authorities. Không biết gì về Spring Security. */
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

  public boolean exists(String username) {
    return jdbc.sql("SELECT COUNT(*) FROM shop_users WHERE username = ?").param(username).query(Long.class).single() > 0;
  }

  /** Thêm user và quyền của nó trong một transaction; password đã được mã hoá bởi nơi gọi. */
  @Transactional
  public void insert(String username, String password, boolean enabled, boolean locked, List<String> authorities) {
    jdbc.sql("INSERT INTO shop_users (username, password, enabled, locked) VALUES (?, ?, ?, ?)")
        .params(username, password, enabled, locked)
        .update();
    replaceAuthorities(username, authorities);
  }

  @Transactional
  public void update(String username, String password, boolean enabled, boolean locked, List<String> authorities) {
    jdbc.sql("UPDATE shop_users SET password = ?, enabled = ?, locked = ? WHERE username = ?")
        .params(password, enabled, locked, username)
        .update();
    replaceAuthorities(username, authorities);
  }

  public void updatePassword(String username, String password) {
    jdbc.sql("UPDATE shop_users SET password = ? WHERE username = ?").params(password, username).update();
  }

  @Transactional
  public void delete(String username) {
    jdbc.sql("DELETE FROM shop_user_authorities WHERE user_id IN (SELECT id FROM shop_users WHERE username = ?)")
        .param(username)
        .update();
    jdbc.sql("DELETE FROM shop_users WHERE username = ?").param(username).update();
  }

  private void replaceAuthorities(String username, List<String> authorities) {
    jdbc.sql("DELETE FROM shop_user_authorities WHERE user_id IN (SELECT id FROM shop_users WHERE username = ?)")
        .param(username)
        .update();
    for (String a : authorities) {
      jdbc.sql("INSERT INTO shop_user_authorities (user_id, authority) SELECT id, ? FROM shop_users WHERE username = ?")
          .params(a, username)
          .update();
    }
  }

  private List<String> authorities(long userId) {
    return jdbc.sql("SELECT authority FROM shop_user_authorities WHERE user_id = ? ORDER BY authority")
        .param(userId)
        .query(String.class)
        .list();
  }
}
