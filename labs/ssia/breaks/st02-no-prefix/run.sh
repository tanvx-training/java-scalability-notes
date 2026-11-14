# Sự cố st02-no-prefix: một đồng nghiệp thêm user "john" cho order bằng bean UserDetailsService,
# mật khẩu ghi dạng chữ thường, không có tiền tố {id} và không khai PasswordEncoder.
# Chạy với thư mục hiện hành là workspace (lab đã commit "lab: trước sự cố st02-no-prefix").
f=order/src/main/java/shop/order/config/ProjectConfig.java
mkdir -p "$(dirname "$f")"
cat > "$f" <<'JAVA'
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
    UserDetails john = User.withUsername("john")
        .password("12345")
        .authorities("read")
        .build();
    return new InMemoryUserDetailsManager(john);
  }
}
JAVA
