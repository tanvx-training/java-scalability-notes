package shop.order.user;

import java.io.Serializable;
import java.util.List;

/**
 * User của shop như nghiệp vụ hiểu: định danh, mật khẩu đã lưu, quyền, trạng thái tài khoản.
 * Không biết gì về Spring Security — SecurityUser lo phần đó.
 */
public record ShopUser(long id, String username, String password, List<String> authorities,
    boolean enabled, boolean locked) implements Serializable {

  public ShopUser {
    authorities = List.copyOf(authorities);
  }
}
