package lab.s06;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.jdbc.JdbcDaoImpl;
import org.springframework.security.provisioning.JdbcUserDetailsManager;

/**
 * s06, nhiệm vụ mổ xẻ: JdbcUserDetailsManager có sẵn và lược đồ mặc định của nó. Lab dựng một H2 riêng
 * (không đụng DB của order) bằng đúng tệp DDL trong jar spring-security-core đang dùng, rồi đo.
 */
class S06AnswersTest {

  private EmbeddedDatabase db;

  private DataSource defaultSchemaDb() {
    db = new EmbeddedDatabaseBuilder().generateUniqueName(true).setType(EmbeddedDatabaseType.H2)
        .addScript("classpath:" + JdbcDaoImpl.DEFAULT_USER_SCHEMA_DDL_LOCATION).build();
    return db;
  }

  @AfterEach
  void cleanUp() {
    SecurityContextHolder.clearContext();
    if (db != null) {
      db.shutdown();
    }
  }

  private static Set<String> lower(List<String> names) {
    Set<String> s = new TreeSet<>();
    names.forEach(n -> s.add(n.toLowerCase()));
    return s;
  }

  private static Set<String> set(String v) {
    return lower(Support.list(v));
  }

  @Test
  void defaultSchema() throws Exception {
    Map<String, String> a = Support.answers("s06");
    String file = Support.answer(a, "DDL_FILE", "s06");
    Set<String> tables = set(Support.answer(a, "DEFAULT_TABLES", "s06"));
    Set<String> columns = set(Support.answer(a, "USERS_COLUMNS", "s06"));
    String f = file.startsWith("classpath:") ? file.substring("classpath:".length()) : file;
    assertThat(f).withFailMessage("DDL_FILE=%s chưa đúng đường dẫn tệp lược đồ trong jar", file)
        .isEqualTo(JdbcDaoImpl.DEFAULT_USER_SCHEMA_DDL_LOCATION);
    JdbcClient j = JdbcClient.create(defaultSchemaDb());
    Set<String> measuredTables = lower(j.sql(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?").param("PUBLIC").query(String.class).list());
    assertThat(tables).withFailMessage("DEFAULT_TABLES=%s chưa đúng các bảng mà tệp DDL tạo", tables).isEqualTo(measuredTables);
    Set<String> measuredColumns = lower(j.sql("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?")
        .params("PUBLIC", "USERS").query(String.class).list());
    assertThat(columns).withFailMessage("USERS_COLUMNS=%s chưa đúng các cột của bảng users", columns).isEqualTo(measuredColumns);
  }

  @Test
  void whatTheDefaultSchemaLoses() throws Exception {
    Map<String, String> a = Support.answers("s06");
    String gotNoAuth = Support.answer(a, "NO_AUTHORITY_EXCEPTION", "s06");
    String gotLocked = Support.answer(a, "LOCKED_AFTER_RELOAD", "s06");
    String gotMessage = Support.answer(a, "NO_AUTHORITY_MESSAGE", "s06");
    DataSource ds = defaultSchemaDb();
    JdbcUserDetailsManager m = new JdbcUserDetailsManager(ds);
    JdbcClient.create(ds).sql("INSERT INTO users (username, password, enabled) VALUES (?, ?, ?)")
        .params("noauth", "{noop}x", true).update();
    String noAuth;
    String message;
    try {
      m.loadUserByUsername("noauth");
      noAuth = "null";
      message = "null";
    } catch (Exception e) {
      noAuth = e.getClass().getSimpleName();
      message = e.getMessage();
    }
    assertThat(gotNoAuth).withFailMessage("NO_AUTHORITY_EXCEPTION=%s chưa đúng điều xảy ra với user không có dòng nào trong authorities",
        gotNoAuth).isEqualTo(noAuth);
    assertThat(gotMessage).withFailMessage("NO_AUTHORITY_MESSAGE=%s chưa đúng thông báo của ngoại lệ đó với user noauth", gotMessage)
        .isEqualTo(message);
    m.createUser(User.withUsername("bill").password("{noop}12345").authorities("read").accountLocked(true).build());
    UserDetails bill = m.loadUserByUsername("bill");
    assertThat(gotLocked).withFailMessage("LOCKED_AFTER_RELOAD=%s chưa đúng isAccountNonLocked() của bill sau khi đọc lại", gotLocked)
        .isEqualTo(String.valueOf(bill.isAccountNonLocked()));
  }

  /** Setter người học chỉ ra phải thật sự bật việc kiểm mật khẩu cũ trong changePassword. */
  @Test
  void reauthSetter() throws Exception {
    String setter = Support.answer(Support.answers("s06"), "REAUTH_SETTER", "s06");
    Method method = null;
    for (Method x : JdbcUserDetailsManager.class.getMethods()) {
      if (x.getName().equals(setter) && x.getParameterCount() == 1
          && x.getParameterTypes()[0].isAssignableFrom(ProviderManager.class)) {
        method = x;
      }
    }
    assertThat(method).withFailMessage("REAUTH_SETTER=%s không phải setter nhận AuthenticationManager của JdbcUserDetailsManager",
        setter).isNotNull();
    DataSource ds = defaultSchemaDb();
    JdbcUserDetailsManager m = new JdbcUserDetailsManager(ds);
    m.createUser(User.withUsername("john").password("{noop}12345").authorities("read").build());
    SecurityContextHolder.getContext()
        .setAuthentication(UsernamePasswordAuthenticationToken.authenticated("john", null, List.of()));
    AuthenticationManager am = new ProviderManager(new DaoAuthenticationProvider(m));
    method.invoke(m, am);
    boolean refused;
    try {
      m.changePassword("doan-bua", "{noop}hacked");
      refused = false;
    } catch (Exception e) {
      refused = true;
    }
    String pw = JdbcClient.create(ds).sql("SELECT password FROM users WHERE username = ?").param("john")
        .query(String.class).single();
    assertThat(refused && pw.equals("{noop}12345"))
        .withFailMessage("sau %s, changePassword với mật khẩu cũ sai vẫn không bị chặn", setter).isTrue();
  }
}
