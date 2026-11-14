package lab.s08;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.encrypt.AesCbcBytesEncryptor;
import org.springframework.security.crypto.encrypt.AesGcmBytesEncryptor;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.security.crypto.keygen.KeyGenerators;

/**
 * s08, nhiệm vụ mổ xẻ: crypto module của spring-security-crypto đang dùng. Không cần Spring context:
 * mọi giá trị so sánh được đo bằng chính các lớp trong jar lúc chấm.
 */
class S08AnswersTest {

  static final String PLAIN = "12 Le Loi, Q1";

  private static Object field(Object o, String name) throws Exception {
    for (Class<?> c = o.getClass(); c != null; c = c.getSuperclass()) {
      try {
        Field f = c.getDeclaredField(name);
        f.setAccessible(true);
        return f.get(o);
      } catch (NoSuchFieldException e) {
        // lên lớp cha
      }
    }
    throw new NoSuchFieldException(name);
  }

  private static SecretKeySpec key() {
    return new SecretKeySpec(KeyGenerators.secureRandom(32).generateKey(), "AES");
  }

  private static Set<String> lower(List<String> xs) {
    Set<String> s = new TreeSet<>();
    xs.forEach(x -> s.add(x.toLowerCase()));
    return s;
  }

  @Test
  void ciphertextShape() throws Exception {
    Map<String, String> ans = Support.answers("s08");
    String overhead = Support.answer(ans, "GCM_OVERHEAD_BYTES", "s08");
    String cbc16 = Support.answer(ans, "CBC_LENGTH_FOR_16", "s08");
    String iterations = Support.answer(ans, "WITH_PASSWORD_ITERATIONS", "s08");
    BytesEncryptor gcm = AesGcmBytesEncryptor.withSecretKey(key()).build();
    byte[] p = PLAIN.getBytes(StandardCharsets.UTF_8);
    assertThat(overhead).withFailMessage("GCM_OVERHEAD_BYTES=%s chưa đúng số byte AesGcmBytesEncryptor thêm vào bản rõ", overhead)
        .isEqualTo(String.valueOf(gcm.encrypt(p).length - p.length));
    BytesEncryptor cbc = AesCbcBytesEncryptor.withSecretKey(key()).build();
    assertThat(cbc16).withFailMessage("CBC_LENGTH_FOR_16=%s chưa đúng độ dài đầu ra của AesCbcBytesEncryptor cho 16 byte", cbc16)
        .isEqualTo(String.valueOf(cbc.encrypt(new byte[16]).length));
    Field f = AesGcmBytesEncryptor.class.getDeclaredField("DEFAULT_PBKDF2_ITERATIONS");
    f.setAccessible(true);
    assertThat(iterations.replace("_", "").replace(",", "")).withFailMessage("WITH_PASSWORD_ITERATIONS=%s chưa đúng số vòng PBKDF2 của AesGcmBytesEncryptor.withPassword", iterations)
        .isEqualTo(String.valueOf(f.get(null)));
  }

  @Test
  @SuppressWarnings("deprecation")
  void deprecatedFactories() throws Exception {
    Map<String, String> ans = Support.answers("s08");
    Set<String> got = lower(Support.list(Support.answer(ans, "DEPRECATED_FACTORIES", "s08")));
    Set<String> measured = new TreeSet<>();
    for (Method m : Encryptors.class.getDeclaredMethods()) {
      if (Modifier.isPublic(m.getModifiers()) && Modifier.isStatic(m.getModifiers()) && m.isAnnotationPresent(Deprecated.class)) {
        measured.add(m.getName().toLowerCase());
      }
    }
    assertThat(got).withFailMessage("DEPRECATED_FACTORIES có %s tên, chưa đúng các phương thức @Deprecated của Encryptors", got.size())
        .isEqualTo(measured);
    String deluxClass = Support.answer(ans, "DELUX_CLASS", "s08");
    String deluxDelegate = Support.answer(ans, "DELUX_DELEGATE", "s08");
    TextEncryptor delux = Encryptors.delux("secret", "5c0744940b5c369b");
    Object inner = field(delux, "encryptor");
    assertThat(deluxClass).withFailMessage("DELUX_CLASS=%s chưa đúng lớp của Encryptors.delux(...)", deluxClass)
        .isEqualTo(delux.getClass().getSimpleName());
    assertThat(deluxDelegate).withFailMessage("DELUX_DELEGATE=%s chưa đúng lớp BytesEncryptor bên trong", deluxDelegate)
        .isEqualTo(inner.getClass().getSimpleName());
  }

  @Test
  void tampering() throws Exception {
    Map<String, String> ans = Support.answers("s08");
    String ex = Support.answer(ans, "GCM_TAMPER_EXCEPTION", "s08");
    String cause = Support.answer(ans, "GCM_TAMPER_CAUSE", "s08");
    String flipped = Support.answer(ans, "CBC_IV_FLIP_RESULT", "s08");
    BytesEncryptor gcm = AesGcmBytesEncryptor.withSecretKey(key()).build();
    byte[] c = gcm.encrypt(PLAIN.getBytes(StandardCharsets.UTF_8));
    c[c.length - 1] ^= 0x01;
    String mEx = "none";
    String mCause = "none";
    try {
      gcm.decrypt(c);
    } catch (RuntimeException e) {
      mEx = e.getClass().getSimpleName();
      mCause = e.getCause() == null ? "none" : e.getCause().getClass().getSimpleName();
    }
    assertThat(ex + "/" + cause).withFailMessage("GCM_TAMPER_EXCEPTION=%s, GCM_TAMPER_CAUSE=%s chưa đúng điều xảy ra khi giải mã bản mã GCM bị sửa một bit", ex, cause)
        .isEqualTo(mEx + "/" + mCause);
    BytesEncryptor cbc = AesCbcBytesEncryptor.withSecretKey(key()).build();
    byte[] d = cbc.encrypt(PLAIN.getBytes(StandardCharsets.UTF_8));
    d[0] ^= 0x01;
    String measured = new String(cbc.decrypt(d), StandardCharsets.UTF_8);
    assertThat(flipped).withFailMessage("CBC_IV_FLIP_RESULT=%s chưa đúng chuỗi giải ra sau khi lật bit thấp nhất của byte đầu IV", flipped)
        .isEqualTo(measured);
  }
}
