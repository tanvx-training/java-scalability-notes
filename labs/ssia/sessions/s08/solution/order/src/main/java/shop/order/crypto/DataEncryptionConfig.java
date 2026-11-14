package shop.order.crypto;

import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.security.crypto.encrypt.AesGcmBytesEncryptor;
import org.springframework.security.crypto.encrypt.TextEncryptor;

/**
 * Mã hoá dữ liệu nhạy cảm của order khi lưu. Khoá AES 256 bit đến từ cấu hình (app.data-key, tức biến
 * môi trường ORDER_DATA_KEY), không nằm trong code; thiếu hoặc sai độ dài thì không khởi động.
 */
@Configuration
public class DataEncryptionConfig {

  @Bean
  TextEncryptor orderDataEncryptor(@Value("${app.data-key}") String hexKey) {
    String k = hexKey == null ? "" : hexKey.strip();
    if (!k.matches("[0-9a-fA-F]{64}")) {
      throw new IllegalStateException("app.data-key (ORDER_DATA_KEY) phải là 64 ký tự hex = khoá AES 256 bit, đang có "
          + k.length() + " ký tự");
    }
    // AES/GCM/NoPadding, IV 16 byte ngẫu nhiên cho mỗi lần mã hoá (KeyGenerators.secureRandom(16)),
    // tag 128 bit: đầu ra là IV ‖ bản mã ‖ tag.
    AesGcmBytesEncryptor aes = AesGcmBytesEncryptor.withSecretKey(new SecretKeySpec(Hex.decode(k), "AES")).build();
    return new HexTextEncryptor(aes);
  }
}
