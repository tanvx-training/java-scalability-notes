package lab.s08;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HexFormat;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.crypto.keygen.KeyGenerators;
import shop.order.OrderApplication;

/**
 * s08: khoá đến từ cấu hình app.data-key. Thiếu khoá hoặc khoá không đủ 256 bit thì order không khởi
 * động, và lỗi nói rõ là thiếu khoá (nhắc app.data-key hoặc ORDER_DATA_KEY).
 */
class S08KeyConfigTest {

  private static Throwable startWith(String key) {
    try (ConfigurableApplicationContext ctx = new SpringApplicationBuilder(OrderApplication.class)
        .web(WebApplicationType.SERVLET).logStartupInfo(false)
        .run("--app.data-key=" + key, "--server.port=0", "--spring.main.banner-mode=off", "--logging.level.root=OFF")) {
      return null;
    } catch (Throwable t) {
      return t;
    }
  }

  private static String chain(Throwable t) {
    StringBuilder sb = new StringBuilder();
    for (Throwable c = t; c != null; c = c.getCause()) {
      sb.append(c.getMessage()).append(" | ");
    }
    return sb.toString();
  }

  @Test
  void badKeyStopsStartup() {
    for (String bad : new String[] {"", "abcd", "zz" + HexFormat.of().formatHex(KeyGenerators.secureRandom(31).generateKey())}) {
      Throwable t = startWith(bad);
      assertThat(t).withFailMessage("order vẫn khởi động với app.data-key dài %s ký tự (không phải khoá AES 256 bit dạng hex)", bad.length())
          .isNotNull();
      String msg = chain(t);
      assertThat(msg.contains("app.data-key") || msg.contains("ORDER_DATA_KEY"))
          .withFailMessage("order không khởi động với app.data-key sai, nhưng lỗi không nhắc app.data-key hay ORDER_DATA_KEY").isTrue();
    }
    Throwable ok = startWith(HexFormat.of().formatHex(KeyGenerators.secureRandom(32).generateKey()));
    assertThat(ok).withFailMessage("order không khởi động với một khoá 64 ký tự hex hợp lệ: %s", ok == null ? "" : ok.getClass().getSimpleName())
        .isNull();
  }
}
