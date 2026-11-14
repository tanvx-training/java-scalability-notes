package shop.order.user;

import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;

/**
 * UserDetailsManager của order trên bảng shop_users: vừa là UserDetailsService cho đăng nhập (như s05),
 * vừa tạo, sửa, xoá user và đổi mật khẩu. Giống JdbcUserDetailsManager, mật khẩu nhận vào đã được mã
 * hoá bởi nơi gọi; khác nó, changePassword luôn kiểm mật khẩu cũ. Từ s07 nó còn là
 * UserDetailsPasswordService: DaoAuthenticationProvider gọi updatePassword sau một lần đăng nhập đúng
 * với băm kiểu cũ, truyền băm mới đã mã hoá bằng encoder hiện hành.
 */
public class ShopUserDetailsManager implements UserDetailsManager, UserDetailsPasswordService {

  private final ShopUserRepository users;
  private final PasswordEncoder passwordEncoder;

  public ShopUserDetailsManager(ShopUserRepository users, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    return users.findByUsername(username)
        .map(SecurityUser::new)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Override
  public void createUser(UserDetails user) {
    users.insert(user.getUsername(), user.getPassword(), user.isEnabled(), !user.isAccountNonLocked(),
        authorityNames(user));
  }

  @Override
  public void updateUser(UserDetails user) {
    users.update(user.getUsername(), user.getPassword(), user.isEnabled(), !user.isAccountNonLocked(),
        authorityNames(user));
  }

  @Override
  public void deleteUser(String username) {
    users.delete(username);
  }

  /**
   * Đổi mật khẩu của user đang đăng nhập (lấy từ SecurityContext). {@code newPassword} đã mã hoá;
   * {@code oldPassword} là chữ người dùng gõ, so với mật khẩu đã lưu bằng PasswordEncoder.
   */
  @Override
  public void changePassword(String oldPassword, String newPassword) {
    Authentication current = SecurityContextHolder.getContext().getAuthentication();
    if (current == null) {
      throw new IllegalStateException("không có user đăng nhập trong SecurityContext");
    }
    ShopUser user = users.findByUsername(current.getName())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.password())) {
      throw new BadCredentialsException("mật khẩu cũ không đúng");
    }
    users.updatePassword(user.username(), newPassword);
  }

  /**
   * Ghi băm mới ({@code newPassword} đã mã hoá, ví dụ {bcrypt}…) thay băm cũ và trả về user mang
   * mật khẩu mới. Spring Security gọi phương thức này, không phải ứng dụng.
   */
  @Override
  public UserDetails updatePassword(UserDetails user, String newPassword) {
    users.updatePassword(user.getUsername(), newPassword);
    return loadUserByUsername(user.getUsername());
  }

  @Override
  public boolean userExists(String username) {
    return users.exists(username);
  }

  private static List<String> authorityNames(UserDetails user) {
    return user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
  }
}
