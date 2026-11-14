package shop.order.crypto;

import java.nio.charset.StandardCharsets;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.encrypt.TextEncryptor;

/**
 * TextEncryptor trên một BytesEncryptor: chuỗi UTF-8 vào, hex ra. Làm đúng việc của
 * HexEncodingTextEncryptor trong spring-security-crypto (lớp đó không public; Encryptors.text/delux
 * dựng nó nhưng đã deprecated).
 */
final class HexTextEncryptor implements TextEncryptor {

  private final BytesEncryptor bytes;

  HexTextEncryptor(BytesEncryptor bytes) {
    this.bytes = bytes;
  }

  @Override
  public String encrypt(String text) {
    return new String(Hex.encode(bytes.encrypt(text.getBytes(StandardCharsets.UTF_8))));
  }

  @Override
  public String decrypt(String encryptedText) {
    return new String(bytes.decrypt(Hex.decode(encryptedText)), StandardCharsets.UTF_8);
  }
}
