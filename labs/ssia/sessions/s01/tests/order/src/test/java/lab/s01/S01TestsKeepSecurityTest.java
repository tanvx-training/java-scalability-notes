package lab.s01;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.TestContextManager;
import org.springframework.test.web.servlet.MockMvc;

/**
 * s01: bộ test gốc của order xanh lại mà KHÔNG tắt bảo mật. Dựng lại đúng ApplicationContext mà
 * shop.order.OrderTest / OrderCatalogDownTest của bạn dùng (cùng annotation, cùng properties; Spring
 * dùng chung bộ nhớ đệm context nên không khởi động thêm), lấy MockMvc của context đó và gửi một
 * GET /orders không đăng nhập: chuỗi filter bảo mật phải chặn (401). addFilters = false hay loại
 * auto-configuration bảo mật sẽ làm request lọt qua (200). Thêm một POST /orders đã đăng nhập (SecurityContext
 * đặt sẵn trong session, không phụ thuộc user nào của app) nhưng không có token CSRF: CsrfFilter phải từ chối
 * (403). Một cấu hình bảo mật riêng cho test có csrf().disable() làm POST lọt tới controller.
 */
class S01TestsKeepSecurityTest {

  private static MockMvc mockMvcOf(String testClass) throws Exception {
    Class<?> c;
    try {
      c = Class.forName(testClass);
    } catch (ClassNotFoundException e) {
      throw new AssertionError("không thấy lớp test " + testClass);
    }
    ApplicationContext ctx = new TestContextManager(c).getTestContext().getApplicationContext();
    String[] names = ctx.getBeanNamesForType(MockMvc.class);
    if (names.length == 0) {
      throw new AssertionError(testClass + " chưa dùng MockMvc (@AutoConfigureMockMvc)");
    }
    return ctx.getBean(names[0], MockMvc.class);
  }

  private static int anonymousOrders(String testClass) throws Exception {
    return mockMvcOf(testClass).perform(get("/orders")).andReturn().getResponse().getStatus();
  }

  private static int authenticatedPostWithoutCsrf(String testClass) throws Exception {
    SecurityContextImpl sc = new SecurityContextImpl(UsernamePasswordAuthenticationToken.authenticated(
        "lab-s01", null, AuthorityUtils.createAuthorityList("ROLE_USER")));
    return mockMvcOf(testClass)
        .perform(post("/orders")
            .sessionAttr(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, sc)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"productId\":1,\"qty\":1}"))
        .andReturn().getResponse().getStatus();
  }

  @Test
  void orderTestKeepsSecurity() throws Exception {
    int s = anonymousOrders("shop.order.OrderTest");
    assertThat(s).withFailMessage("MockMvc của OrderTest cho GET /orders ẩn danh nhận %s, mong 401: bảo mật đang bị tắt trong test", s)
        .isEqualTo(401);
  }

  @Test
  void catalogDownTestKeepsSecurity() throws Exception {
    int s = anonymousOrders("shop.order.OrderCatalogDownTest");
    assertThat(s).withFailMessage("MockMvc của OrderCatalogDownTest cho GET /orders ẩn danh nhận %s, mong 401: bảo mật đang bị tắt trong test", s)
        .isEqualTo(401);
  }

  @Test
  void orderTestKeepsCsrf() throws Exception {
    int s = authenticatedPostWithoutCsrf("shop.order.OrderTest");
    assertThat(s).withFailMessage("MockMvc của OrderTest cho POST /orders đã đăng nhập, không token CSRF nhận %s, mong 403: CSRF đang bị tắt trong test", s)
        .isEqualTo(403);
  }

  @Test
  void catalogDownTestKeepsCsrf() throws Exception {
    int s = authenticatedPostWithoutCsrf("shop.order.OrderCatalogDownTest");
    assertThat(s).withFailMessage("MockMvc của OrderCatalogDownTest cho POST /orders đã đăng nhập, không token CSRF nhận %s, mong 403: CSRF đang bị tắt trong test", s)
        .isEqualTo(403);
  }
}
