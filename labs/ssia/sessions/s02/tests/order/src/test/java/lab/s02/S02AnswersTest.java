package lab.s02;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import shop.order.OrderApplication;

/**
 * s02, nhiệm vụ mổ xẻ: so answers/s02.env với đường đi thật của một lần đăng nhập Basic, đo từ các
 * đối tượng trong context lúc chấm. Hết hiệu lực ở s03 (bạn khai lại UserDetailsService và PasswordEncoder).
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S02AnswersTest {

  @Autowired ApplicationContext ctx;

  @Test
  void managerWrapper() throws Exception {
    String got = Support.answer(Support.answers("s02"), "MANAGER_WRAPPER", "s02");
    assertThat(got).withFailMessage("MANAGER_WRAPPER=%s chưa đúng lớp mà BasicAuthenticationFilter gọi", got)
        .isEqualTo(Support.authPath(ctx).managerWrapper());
  }

  @Test
  void localProviders() throws Exception {
    List<String> got = Support.list(Support.answer(Support.answers("s02"), "LOCAL_PROVIDERS", "s02"));
    assertThat(got).withFailMessage("LOCAL_PROVIDERS=%s chưa đúng provider của ProviderManager đầu tiên", got)
        .isEqualTo(Support.authPath(ctx).localProviders());
  }

  @Test
  void providerAndWhere() throws Exception {
    Map<String, String> a = Support.answers("s02");
    Support.AuthPath p = Support.authPath(ctx);
    String provider = Support.answer(a, "PROVIDER", "s02");
    assertThat(provider).withFailMessage("PROVIDER=%s chưa đúng provider xác thực username/password", provider)
        .isEqualTo(p.provider());
    String in = Support.answer(a, "PROVIDER_IN", "s02");
    assertThat(in).withFailMessage("PROVIDER_IN=%s chưa đúng (local hoặc parent)", in)
        .isEqualTo(p.providerIn());
  }

  @Test
  void userDetailsService() throws Exception {
    String got = Support.answer(Support.answers("s02"), "USER_DETAILS_SERVICE", "s02");
    assertThat(got).withFailMessage("USER_DETAILS_SERVICE=%s chưa đúng lớp provider đang dùng", got)
        .isEqualTo(Support.authPath(ctx).userDetailsService());
  }

  @Test
  void passwordEncoder() throws Exception {
    String got = Support.answer(Support.answers("s02"), "PASSWORD_ENCODER", "s02");
    assertThat(got).withFailMessage("PASSWORD_ENCODER=%s chưa đúng lớp provider đang dùng", got)
        .isEqualTo(Support.authPath(ctx).passwordEncoder());
  }
}
