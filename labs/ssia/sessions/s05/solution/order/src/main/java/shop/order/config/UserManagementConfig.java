package shop.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import shop.order.user.ShopUserDetailsService;
import shop.order.user.ShopUserRepository;

/** Quản lý user và mật khẩu của order: ai tồn tại (bảng shop_users), mật khẩu kiểm bằng gì. */
@Configuration
public class UserManagementConfig {

  @Bean
  UserDetailsService userDetailsService(ShopUserRepository users) {
    return new ShopUserDetailsService(users);
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
