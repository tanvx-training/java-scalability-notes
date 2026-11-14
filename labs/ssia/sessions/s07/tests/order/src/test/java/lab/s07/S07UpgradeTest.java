package lab.s07;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import shop.order.OrderApplication;

/**
 * s07: user có băm kiểu cũ (SHA-256 hex không tiền tố của hệ thống cũ, hoặc {noop}) đăng nhập được,
 * và sau lần đăng nhập đúng đầu tiên cột password đã thành {bcrypt}… — không ai gọi gì ngoài đăng nhập.
 */
@SpringBootTest(classes = OrderApplication.class)
@AutoConfigureMockMvc
class S07UpgradeTest {

  private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder();

  @Autowired MockMvc mvc;

  @Autowired JdbcClient jdbc;

  private static void assertBcryptOf(String stored, String raw, String who) {
    assertThat(stored).withFailMessage("sau khi %s đăng nhập đúng, cột password chưa mang tiền tố {bcrypt} (đang bắt đầu bằng %s)",
        who, stored.substring(0, Math.min(9, stored.length()))).startsWith("{bcrypt}");
    assertThat(BCRYPT.matches(raw, stored.substring("{bcrypt}".length())))
        .withFailMessage("cột password của %s mang {bcrypt} nhưng không phải bcrypt của mật khẩu đã gõ", who).isTrue();
  }

  @Test
  void legacySha256UserLogsInAndIsRehashed() throws Exception {
    String name = DbUsers.randomName("legacy");
    String raw = "pw-" + name;
    DbUsers.insert(jdbc, name, Login.legacySha256(raw), true, false, List.of("read"));
    int s = Login.status(mvc, name, raw);
    assertThat(s).withFailMessage("user có băm SHA-256 không tiền tố, đúng mật khẩu: mong 200, nhận %s", s).isEqualTo(200);
    assertBcryptOf(Login.stored(jdbc, name), raw, "user có băm SHA-256");
    int again = Login.status(mvc, name, raw);
    assertThat(again).withFailMessage("sau khi băm lại, đăng nhập lần hai: mong 200, nhận %s", again).isEqualTo(200);
  }

  @Test
  void noopUserIsRehashedOnceThenLeftAlone() throws Exception {
    String name = DbUsers.randomName("noop");
    String raw = "pw-" + name;
    DbUsers.insert(jdbc, name, "{noop}" + raw, true, false, List.of("read"));
    int s = Login.status(mvc, name, raw);
    assertThat(s).withFailMessage("user {noop}, đúng mật khẩu: mong 200, nhận %s", s).isEqualTo(200);
    String first = Login.stored(jdbc, name);
    assertBcryptOf(first, raw, "user {noop}");
    int again = Login.status(mvc, name, raw);
    assertThat(again).withFailMessage("đăng nhập lần hai: mong 200, nhận %s", again).isEqualTo(200);
    assertThat(Login.stored(jdbc, name)).withFailMessage("băm {bcrypt} đã đúng chuẩn mà lần đăng nhập sau vẫn ghi băm mới")
        .isEqualTo(first);
  }

  @Test
  void wrongPasswordRejectedAndNothingRewritten() throws Exception {
    String name = DbUsers.randomName("wrong");
    String raw = "pw-" + name;
    String legacy = Login.legacySha256(raw);
    DbUsers.insert(jdbc, name, legacy, true, false, List.of("read"));
    int bad = Login.status(mvc, name, "doan-bua");
    assertThat(bad).withFailMessage("băm SHA-256 cũ, sai mật khẩu: mong 401, nhận %s", bad).isEqualTo(401);
    int hashAsPassword = Login.status(mvc, name, legacy);
    assertThat(hashAsPassword).withFailMessage("gõ chính chuỗi băm cũ làm mật khẩu: mong 401, nhận %s (băm cũ bị so như chữ thường)",
        hashAsPassword).isEqualTo(401);
    assertThat(Login.stored(jdbc, name)).withFailMessage("đăng nhập sai mật khẩu mà cột password đã bị ghi lại").isEqualTo(legacy);
    int ok = Login.status(mvc, name, raw);
    assertThat(ok).withFailMessage("sau lần sai, đúng mật khẩu: mong 200, nhận %s", ok).isEqualTo(200);
    String upgraded = Login.stored(jdbc, name);
    int badAfter = Login.status(mvc, name, "doan-bua");
    assertThat(badAfter).withFailMessage("băm {bcrypt} mới, sai mật khẩu: mong 401, nhận %s", badAfter).isEqualTo(401);
    assertThat(Login.stored(jdbc, name)).withFailMessage("đăng nhập sai sau khi băm lại mà cột password vẫn bị ghi").isEqualTo(upgraded);
  }

  @Test
  void seededLegacyUserDave() throws Exception {
    List<String> rows = jdbc.sql("SELECT password FROM shop_users WHERE username = 'dave'").query(String.class).list();
    assertThat(rows).withFailMessage("chưa có dave trong shop_users (data.sql)").hasSize(1);
    String before = rows.get(0);
    assertThat(before.startsWith("{bcrypt}") || before.equals(Login.legacySha256("54321")))
        .withFailMessage("dave trong data.sql phải lưu SHA-256 hex không tiền tố của 54321").isTrue();
    int s = Login.status(mvc, "dave", "54321");
    assertThat(s).withFailMessage("dave:54321 mong 200, nhận %s", s).isEqualTo(200);
    assertBcryptOf(Login.stored(jdbc, "dave"), "54321", "dave");
  }
}
