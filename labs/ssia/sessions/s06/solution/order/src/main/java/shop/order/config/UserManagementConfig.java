package shop.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;
import shop.order.user.ShopUserDetailsManager;
import shop.order.user.ShopUserRepository;

/** Quản lý user và mật khẩu của order: ai tồn tại (bảng shop_users), tạo/đổi thế nào, mật khẩu kiểm bằng gì. */
@Configuration
public class UserManagementConfig {

  // Một bean duy nhất vừa là UserDetailsService (Spring Security dùng để đăng nhập) vừa là
  // UserDetailsManager (UserController dùng để tạo user, đổi mật khẩu).
  @Bean
  UserDetailsManager userDetailsService(ShopUserRepository users, PasswordEncoder passwordEncoder) {
    return new ShopUserDetailsManager(users, passwordEncoder);
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
