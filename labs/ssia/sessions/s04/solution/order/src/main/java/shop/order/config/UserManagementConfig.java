package shop.order.config;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import shop.order.user.SecurityUser;
import shop.order.user.ShopUser;

/** Quản lý user và mật khẩu của order: ai tồn tại, mật khẩu kiểm bằng gì. */
@Configuration
public class UserManagementConfig {

  // Tạm giữ trong bộ nhớ; s05 chuyển sang bảng shop_users.
  private static final Map<String, ShopUser> USERS = Map.of(
      "john", new ShopUser(1, "john", "{noop}12345", List.of("read"), true, false),
      "mary", new ShopUser(2, "mary", "{noop}67890", List.of("read", "write"), true, false));

  // Không dùng InMemoryUserDetailsManager: nó chép mọi UserDetails sang lớp User của Spring,
  // principal sau đăng nhập sẽ không còn là SecurityUser.
  @Bean
  UserDetailsService userDetailsService() {
    return username -> Optional.ofNullable(USERS.get(username))
        .map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
