package shop.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.MessageDigestPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;
import shop.order.user.ShopUserDetailsManager;
import shop.order.user.ShopUserRepository;

/** Quản lý user và mật khẩu của order: ai tồn tại (bảng shop_users), tạo/đổi thế nào, mật khẩu kiểm bằng gì. */
@Configuration
public class UserManagementConfig {

  // Một bean duy nhất vừa là UserDetailsService (đăng nhập), UserDetailsManager (UserController) và
  // UserDetailsPasswordService (Spring Security ghi băm mới sau khi đăng nhập bằng băm kiểu cũ).
  @Bean
  UserDetailsManager userDetailsService(ShopUserRepository users, PasswordEncoder passwordEncoder) {
    return new ShopUserDetailsManager(users, passwordEncoder);
  }

  /**
   * Băm mới luôn là {bcrypt}…. Băm có tiền tố {id} đi tới encoder của id đó. Băm không tiền tố là
   * SHA-256 hex không salt do hệ thống cũ để lại (và job nhập user vẫn ghi kiểu đó): đi tới
   * MessageDigestPasswordEncoder("SHA-256") thay vì UnmappedIdPasswordEncoder (ném lỗi).
   */
  @Bean
  @SuppressWarnings("deprecation") // MessageDigestPasswordEncoder: chỉ để đọc băm cũ, không bao giờ để băm mới
  PasswordEncoder passwordEncoder() {
    DelegatingPasswordEncoder encoder =
        (DelegatingPasswordEncoder) PasswordEncoderFactories.createDelegatingPasswordEncoder();
    encoder.setDefaultPasswordEncoderForMatches(new MessageDigestPasswordEncoder("SHA-256"));
    return encoder;
  }
}
