package shop.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

/** User nội bộ gọi API của order, giữ trong bộ nhớ cho tới khi có bảng users (chương 3). */
@Configuration
public class ProjectConfig {

  @Bean
  UserDetailsService userDetailsService() {
    // Sửa sự cố st02-no-prefix: chưa có bean PasswordEncoder nên DaoAuthenticationProvider dùng
    // DelegatingPasswordEncoder; nó chọn encoder theo tiền tố {id}. {noop} = so chuỗi nguyên văn.
    UserDetails john = User.withUsername("john")
        .password("{noop}12345")
        .authorities("read")
        .build();
    return new InMemoryUserDetailsManager(john);
  }
}
