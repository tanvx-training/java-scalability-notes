package lab.s01;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.web.SecurityFilterChain;
import shop.order.OrderApplication;

/**
 * s01, nhiệm vụ mổ xẻ: so answers/s01.env với chain mà FilterChainProxy đang dùng cho GET /orders.
 * Mọi giá trị đo lúc chấm, không có đáp án viết sẵn. Hết hiệu lực ở s03 (bạn thay chain mặc định).
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S01AnswersTest {

  @Autowired ApplicationContext ctx;

  @Test
  void chainBeanName() throws Exception {
    String got = Support.answer(Support.answers("s01"), "CHAIN_BEAN", "s01");
    String[] names = ctx.getBeanNamesForType(SecurityFilterChain.class);
    SecurityFilterChain chain = Support.chainForOrders(ctx);
    String measured = null;
    for (String n : names) {
      if (ctx.getBean(n) == chain) {
        measured = n;
      }
    }
    assertThat(got).withFailMessage("CHAIN_BEAN=%s chưa đúng tên bean của chain đang chạy", got).isEqualTo(measured);
  }

  @Test
  void filterList() throws Exception {
    List<String> got = Support.list(Support.answer(Support.answers("s01"), "FILTERS", "s01"));
    List<String> measured = Support.filterNames(Support.chainForOrders(ctx));
    assertThat(got)
        .withFailMessage("FILTERS có %s filter, chưa khớp danh sách và thứ tự thật", got.size())
        .isEqualTo(measured);
  }

  @Test
  void countAndNeighbours() throws Exception {
    Map<String, String> a = Support.answers("s01");
    List<String> measured = Support.filterNames(Support.chainForOrders(ctx));
    String count = Support.answer(a, "FILTER_COUNT", "s01");
    assertThat(count).withFailMessage("FILTER_COUNT=%s chưa đúng", count)
        .isEqualTo(String.valueOf(measured.size()));
    String before = Support.answer(a, "BEFORE_BASIC", "s01");
    assertThat(before).withFailMessage("BEFORE_BASIC=%s không đứng ngay trước BasicAuthenticationFilter", before)
        .isEqualTo(neighbour(measured, "BasicAuthenticationFilter", -1));
    String after = Support.answer(a, "AFTER_CSRF", "s01");
    assertThat(after).withFailMessage("AFTER_CSRF=%s không đứng ngay sau CsrfFilter", after)
        .isEqualTo(neighbour(measured, "CsrfFilter", +1));
  }

  private static String neighbour(List<String> names, String of, int step) {
    int i = names.indexOf(of);
    if (i < 0 || i + step < 0 || i + step >= names.size()) {
      return "(không có)";
    }
    return names.get(i + step);
  }
}
