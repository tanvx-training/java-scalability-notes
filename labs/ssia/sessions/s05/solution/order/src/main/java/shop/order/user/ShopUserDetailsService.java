package shop.order.user;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * UserDetailsService của order: tìm user trong DB, bọc thành SecurityUser. Không kiểm mật khẩu, không
 * kiểm khoá — đó là việc của provider (DaoAuthenticationProvider) sau khi nhận UserDetails.
 */
public class ShopUserDetailsService implements UserDetailsService {

  private final ShopUserRepository users;

  public ShopUserDetailsService(ShopUserRepository users) {
    this.users = users;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    return users.findByUsername(username)
        .map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }
}
