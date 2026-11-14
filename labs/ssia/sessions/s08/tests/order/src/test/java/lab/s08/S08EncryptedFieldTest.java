package lab.s08;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.encrypt.AesGcmBytesEncryptor;
import org.springframework.security.crypto.keygen.KeyGenerators;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import shop.order.OrderApplication;
import tools.jackson.databind.JsonNode;

/**
 * s08: địa chỉ giao hàng được mã hoá khi lưu. Lab đặt app.data-key là một khoá ngẫu nhiên sinh lúc chấm
 * (không ai biết trước), rồi đọc thẳng cột orders.delivery_address và tự giải mã bằng khoá đó.
 */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S08EncryptedFieldTest {

  static final byte[] KEY = KeyGenerators.secureRandom(32).generateKey();

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("app.data-key", () -> HexFormat.of().formatHex(KEY));
    r.add("CATALOG_URL", Orders::catalogUrl);
  }

  @Autowired MockMvc mvc;

  @Autowired JdbcClient jdbc;

  private String user() {
    String name = DbUsers.randomName("buyer");
    DbUsers.insert(jdbc, name, "{noop}pw-" + name, true, false, List.of("read", "write"));
    return name;
  }

  private static String text(JsonNode n, String field) {
    JsonNode v = n.get(field);
    return v == null || v.isNull() ? null : v.asString();
  }

  @Test
  void ownerSeesPlaintextOthersDoNot() throws Exception {
    String owner = user();
    String other = user();
    String address = Orders.randomAddress();
    JsonNode created = Orders.create(mvc, owner, "pw-" + owner, address);
    assertThat(text(created, "deliveryAddress")).withFailMessage("201 của POST /orders không trả deliveryAddress đúng bản rõ")
        .isEqualTo(address);
    long id = created.path("id").asLong();
    String mine = text(Orders.byId(Orders.list(mvc, owner, "pw-" + owner), id), "deliveryAddress");
    assertThat(mine).withFailMessage("GET /orders của người đặt: deliveryAddress của đơn %s không đúng bản rõ", id).isEqualTo(address);
    JsonNode theirs = Orders.list(mvc, other, "pw-" + other);
    assertThat(text(Orders.byId(theirs, id), "deliveryAddress"))
        .withFailMessage("GET /orders của user khác vẫn có deliveryAddress của đơn %s", id).isNull();
    String stored = Orders.stored(jdbc, id);
    assertThat(theirs.toString()).withFailMessage("GET /orders của user khác chứa địa chỉ hoặc bản mã của đơn %s", id)
        .doesNotContain(address).doesNotContain(String.valueOf(stored));
  }

  @Test
  void storedValueIsNotPlaintext() throws Exception {
    String owner = user();
    String address = Orders.randomAddress();
    long id = Orders.create(mvc, owner, "pw-" + owner, address).path("id").asLong();
    String stored = Orders.stored(jdbc, id);
    assertThat(stored).withFailMessage("cột orders.delivery_address của đơn có địa chỉ đang rỗng").isNotNull();
    String marker = address.substring(address.indexOf('#') + 1);
    assertThat(stored).withFailMessage("cột orders.delivery_address chứa nguyên bản rõ").doesNotContain(marker);
    assertThat(decodedForms(stored)).withFailMessage("cột orders.delivery_address chỉ là bản rõ đã đổi sang hex hoặc Base64, chưa mã hoá")
        .noneMatch(s -> s.contains(marker));
  }

  @Test
  void storedValueDecryptsWithConfiguredKey() throws Exception {
    String owner = user();
    String address = Orders.randomAddress();
    long id = Orders.create(mvc, owner, "pw-" + owner, address).path("id").asLong();
    String stored = Orders.stored(jdbc, id);
    String plain;
    try {
      byte[] bytes = HexFormat.of().parseHex(stored);
      plain = new String(AesGcmBytesEncryptor.withSecretKey(new SecretKeySpec(KEY, "AES")).build().decrypt(bytes),
          StandardCharsets.UTF_8);
    } catch (RuntimeException e) {
      throw new AssertionError("không giải mã được cột orders.delivery_address bằng khoá app.data-key (AES-GCM, hex của IV 16 byte ‖ bản mã ‖ tag): "
          + e.getClass().getSimpleName());
    }
    assertThat(plain).withFailMessage("giải mã bằng app.data-key ra chuỗi khác địa chỉ đã gửi").isEqualTo(address);
  }

  @Test
  void sameAddressTwiceGivesDifferentCiphertext() throws Exception {
    String owner = user();
    String address = Orders.randomAddress();
    long a = Orders.create(mvc, owner, "pw-" + owner, address).path("id").asLong();
    long b = Orders.create(mvc, owner, "pw-" + owner, address).path("id").asLong();
    String sa = Orders.stored(jdbc, a);
    String sb = Orders.stored(jdbc, b);
    assertThat(sa).withFailMessage("cột orders.delivery_address của đơn có địa chỉ đang rỗng").isNotNull();
    assertThat(sa).withFailMessage("hai đơn cùng địa chỉ cho cùng một bản mã: IV không ngẫu nhiên").isNotEqualTo(sb);
    JsonNode list = Orders.list(mvc, owner, "pw-" + owner);
    assertThat(List.of(text(Orders.byId(list, a), "deliveryAddress"), text(Orders.byId(list, b), "deliveryAddress")))
        .withFailMessage("hai bản mã khác nhau nhưng không cùng giải ra địa chỉ đã gửi").containsOnly(address);
  }

  private static List<String> decodedForms(String stored) {
    List<String> out = new java.util.ArrayList<>();
    try {
      out.add(new String(HexFormat.of().parseHex(stored), StandardCharsets.UTF_8));
    } catch (RuntimeException e) {
      // không phải hex
    }
    try {
      out.add(new String(Base64.getDecoder().decode(stored), StandardCharsets.UTF_8));
    } catch (RuntimeException e) {
      // không phải Base64
    }
    return out;
  }
}
