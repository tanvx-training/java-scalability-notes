package shop.order.user;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Bọc một ShopUser thành UserDetails: chỉ dịch, không lưu gì của riêng nó. */
public final class SecurityUser implements UserDetails {

  private final ShopUser user;

  public SecurityUser(ShopUser user) {
    this.user = Objects.requireNonNull(user, "user");
  }

  public ShopUser user() {
    return user;
  }

  @Override
  public String getUsername() {
    return user.username();
  }

  @Override
  public String getPassword() {
    return user.password();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    List<SimpleGrantedAuthority> list = user.authorities().stream().map(SimpleGrantedAuthority::new).toList();
    return list;
  }

  // Tên phủ định: true nghĩa là "được phép". Cột locked=true phải thành false ở đây.
  @Override
  public boolean isAccountNonLocked() {
    return !user.locked();
  }

  @Override
  public boolean isEnabled() {
    return user.enabled();
  }

  @Override
  public String toString() {
    return "SecurityUser[" + user.username() + ", " + user.authorities() + "]";
  }
}
