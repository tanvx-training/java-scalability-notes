package shop.order.user;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Quản lý user của order qua HTTP. Đường dẫn và trường JSON cố định theo đề bài s06. */
@RestController
public class UserController {

  public record NewUser(String username, String password, List<String> authorities) {}

  public record PasswordChange(String oldPassword, String newPassword) {}

  private final UserDetailsManager manager;
  private final PasswordEncoder passwordEncoder;

  public UserController(UserDetailsManager manager, PasswordEncoder passwordEncoder) {
    this.manager = manager;
    this.passwordEncoder = passwordEncoder;
  }

  @PostMapping("/users")
  public ResponseEntity<?> create(@RequestBody NewUser req) {
    if (blank(req.username()) || blank(req.password()) || req.authorities() == null || req.authorities().isEmpty()) {
      return error(HttpStatus.BAD_REQUEST, "cần username, password và ít nhất một authority");
    }
    if (manager.userExists(req.username())) {
      return error(HttpStatus.CONFLICT, "username đã tồn tại: " + req.username());
    }
    UserDetails user = User.withUsername(req.username())
        .password(passwordEncoder.encode(req.password()))   // lưu dạng {bcrypt}…, không lưu chữ thường
        .authorities(req.authorities().toArray(String[]::new))
        .build();
    manager.createUser(user);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(Map.of("username", req.username(), "authorities", req.authorities()));
  }

  @PutMapping("/users/me/password")
  public ResponseEntity<?> changePassword(@RequestBody PasswordChange req) {
    if (blank(req.oldPassword()) || blank(req.newPassword())) {
      return error(HttpStatus.BAD_REQUEST, "cần oldPassword và newPassword");
    }
    try {
      manager.changePassword(req.oldPassword(), passwordEncoder.encode(req.newPassword()));
    } catch (BadCredentialsException e) {
      // Không để AuthenticationException thoát khỏi controller: ExceptionTranslationFilter sẽ coi đó là
      // "chưa đăng nhập" và trả 401 + WWW-Authenticate, trong khi Basic của request này vẫn đúng.
      return error(HttpStatus.BAD_REQUEST, "mật khẩu cũ không đúng");
    }
    return ResponseEntity.noContent().build();
  }

  /** Cho client không phải trình duyệt (curl) lấy token CSRF gắn với session hiện tại. */
  @GetMapping("/csrf")
  public CsrfToken csrf(CsrfToken token) {
    return token;
  }

  private static boolean blank(String s) {
    return s == null || s.isBlank();
  }

  private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
