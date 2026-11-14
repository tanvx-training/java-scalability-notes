package shop.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

/** Quản lý user và mật khẩu của order: ai tồn tại, mật khẩu kiểm bằng gì. */
@Configuration
public class UserManagementConfig {

  @Bean
  UserDetailsService userDetailsService() {
    UserDetails john = User.withUsername("john")
        .password("{noop}12345")
        .authorities("read")
        .build();
    return new InMemoryUserDetailsManager(john);
  }

  // Cùng loại encoder mà DaoAuthenticationProvider tự tạo khi không có bean, nhưng giờ là bean của bạn:
  // inject được vào nơi khác (vd. khi tạo user mới) và đổi được ở một chỗ.
  @Bean
  PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
