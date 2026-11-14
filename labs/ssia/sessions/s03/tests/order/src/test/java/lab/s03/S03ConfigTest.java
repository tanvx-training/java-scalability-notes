package lab.s03;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.ClassUtils;
import shop.order.OrderApplication;

/**
 * s03: cấu hình là của bạn, không còn của auto-configuration. Chỉ xem bean theo kiểu của Spring
 * Security và nơi chúng được khai; không phụ thuộc tên lớp bạn đặt.
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S03ConfigTest {

  @Autowired ConfigurableApplicationContext ctx;

  /** Lớp khai bean: lớp chứa phương thức @Bean, hoặc chính lớp bean nếu là @Component. */
  private String declaredIn(String beanName) {
    ConfigurableListableBeanFactory bf = ctx.getBeanFactory();
    BeanDefinition bd = bf.getMergedBeanDefinition(beanName);
    String factory = bd.getFactoryBeanName();
    Class<?> type = factory != null ? bf.getType(factory) : bf.getType(beanName);
    return type == null ? "(không rõ)" : ClassUtils.getUserClass(type).getName();
  }

  @Test
  void oneChainDeclaredByYou() {
    String chain = Support.onlyBean(ctx, SecurityFilterChain.class);
    String where = declaredIn(chain);
    assertThat(where).withFailMessage("SecurityFilterChain %s vẫn do %s khai, chưa phải của bạn", chain, where)
        .doesNotStartWith("org.springframework.");
  }

  @Test
  void providerUsesYourBeans() throws Exception {
    String encoder = Support.onlyBean(ctx, PasswordEncoder.class);
    String uds = Support.onlyBean(ctx, UserDetailsService.class);
    Object provider = Support.authPathProvider(ctx);
    assertThat(Support.call(provider, "getPasswordEncoder"))
        .withFailMessage("provider xác thực Basic không dùng bean PasswordEncoder %s", encoder)
        .isSameAs(ctx.getBean(encoder));
    assertThat(Support.call(provider, "getUserDetailsService"))
        .withFailMessage("provider xác thực Basic không dùng bean UserDetailsService %s", uds)
        .isSameAs(ctx.getBean(uds));
  }

  @Test
  void usersAndWebRulesInSeparateClasses() {
    String chain = declaredIn(Support.onlyBean(ctx, SecurityFilterChain.class));
    String uds = declaredIn(Support.onlyBean(ctx, UserDetailsService.class));
    String enc = declaredIn(Support.onlyBean(ctx, PasswordEncoder.class));
    assertThat(chain).withFailMessage("SecurityFilterChain và UserDetailsService cùng khai trong %s", chain)
        .isNotEqualTo(uds);
    assertThat(chain).withFailMessage("SecurityFilterChain và PasswordEncoder cùng khai trong %s", chain)
        .isNotEqualTo(enc);
  }
}
