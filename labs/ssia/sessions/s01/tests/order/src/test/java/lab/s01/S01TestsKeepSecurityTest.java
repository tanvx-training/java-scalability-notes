package lab.s01;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestContextManager;
import org.springframework.test.web.servlet.MockMvc;

/**
 * s01: bộ test gốc của order xanh lại mà KHÔNG tắt bảo mật. Dựng lại đúng ApplicationContext mà
 * shop.order.OrderTest / OrderCatalogDownTest của bạn dùng (cùng annotation, cùng properties; Spring
 * dùng chung bộ nhớ đệm context nên không khởi động thêm), lấy MockMvc của context đó và gửi một
 * GET /orders không đăng nhập: chuỗi filter bảo mật phải chặn (401). addFilters = false hay loại
 * auto-configuration bảo mật sẽ làm request lọt qua (200).
 */
class S01TestsKeepSecurityTest {

  private static int anonymousOrders(String testClass) throws Exception {
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
    return ctx.getBean(names[0], MockMvc.class).perform(get("/orders")).andReturn().getResponse().getStatus();
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
}
