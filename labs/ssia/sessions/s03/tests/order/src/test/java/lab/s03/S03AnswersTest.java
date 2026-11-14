package lab.s03;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import shop.order.OrderApplication;

/**
 * s03, nhiệm vụ mổ xẻ: chain của bạn khác chain mặc định ở đâu. Đo chain đang chạy lúc chấm và so
 * với FILTERS trong answers/s01.env (đã được verify của s01 so với chain mặc định thật).
 */
@SpringBootTest(classes = OrderApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class S03AnswersTest {

  @Autowired ApplicationContext ctx;

  @LocalServerPort int port;

  @Test
  void filterCount() throws Exception {
    String got = Support.answer(Support.answers("s03"), "FILTER_COUNT", "s03");
    int measured = Support.filterNames(Support.chainForOrders(ctx)).size();
    assertThat(got).withFailMessage("FILTER_COUNT=%s chưa đúng số filter của chain đang chạy", got)
        .isEqualTo(String.valueOf(measured));
  }

  @Test
  void removedFilters() throws Exception {
    Set<String> got = new HashSet<>(Support.list(Support.answer(Support.answers("s03"), "REMOVED_FILTERS", "s03")));
    List<String> before = Support.list(Support.answer(Support.answers("s01"), "FILTERS", "s01"));
    Set<String> measured = new HashSet<>(before);
    measured.removeAll(Support.filterNames(Support.chainForOrders(ctx)));
    assertThat(got).withFailMessage("REMOVED_FILTERS có %s tên, chưa đúng các filter đã mất so với FILTERS của s01",
        got.size()).isEqualTo(measured);
  }

  @Test
  void loginPageStatus() throws Exception {
    Map<String, String> a = Support.answers("s03");
    String got = Support.answer(a, "LOGIN_PAGE_STATUS", "s03");
    int measured = Support.get(port, "/login", null, null).statusCode();
    assertThat(got).withFailMessage("LOGIN_PAGE_STATUS=%s chưa đúng mã của GET /login không đăng nhập", got)
        .isEqualTo(String.valueOf(measured));
  }
}
