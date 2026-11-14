package shop.order;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@RestController
public class OrderController {

  /** deliveryAddress tuỳ chọn (s08): lưu đã mã hoá, chỉ người đặt đơn đọc được bản rõ. */
  public record NewOrder(long productId, int qty, String deliveryAddress) {
    // toString mặc định của record in nguyên địa chỉ; Spring MVC ở DEBUG log thân request bằng toString.
    @Override
    public String toString() {
      return "NewOrder[productId=" + productId + ", qty=" + qty + ", deliveryAddress=" + mask(deliveryAddress) + "]";
    }
  }

  public record Order(long id, long productId, int qty, Instant createdAt, String deliveryAddress) {
    @Override
    public String toString() {
      return "Order[id=" + id + ", productId=" + productId + ", qty=" + qty + ", createdAt=" + createdAt
          + ", deliveryAddress=" + mask(deliveryAddress) + "]";
    }
  }

  private static String mask(String s) {
    return s == null ? "null" : "***";
  }

  private final JdbcClient jdbc;
  private final RestClient catalog;
  private final TextEncryptor encryptor;

  public OrderController(JdbcClient jdbc, @Value("${app.catalog-url}") String catalogUrl, TextEncryptor encryptor) {
    this.jdbc = jdbc;
    this.catalog = RestClient.builder().baseUrl(catalogUrl).build();
    this.encryptor = encryptor;
  }

  @PostMapping("/orders")
  public ResponseEntity<?> create(@RequestBody NewOrder req, Principal principal) {
    if (req.qty() < 1) {
      return error(HttpStatus.BAD_REQUEST, "qty phải >= 1");
    }
    try {
      catalog.get().uri("/products/{id}", req.productId()).retrieve().toBodilessEntity();
    } catch (HttpClientErrorException.NotFound e) {
      return error(HttpStatus.UNPROCESSABLE_ENTITY, "sản phẩm không tồn tại: " + req.productId());
    } catch (ResourceAccessException e) {
      return error(HttpStatus.SERVICE_UNAVAILABLE, "không kết nối được catalog");
    } catch (RestClientResponseException e) {
      return error(HttpStatus.BAD_GATEWAY, "catalog trả lỗi " + e.getStatusCode().value());
    }
    String encrypted = req.deliveryAddress() == null ? null : encryptor.encrypt(req.deliveryAddress());
    KeyHolder keys = new GeneratedKeyHolder();
    jdbc.sql("INSERT INTO orders (product_id, qty, owner, delivery_address) VALUES (?, ?, ?, ?)")
        .param(req.productId())
        .param(req.qty())
        .param(principal.getName())
        .param(encrypted)
        .update(keys, "id");
    long id = keys.getKey().longValue();
    Order created = jdbc.sql("SELECT id, product_id, qty, created_at, owner, delivery_address FROM orders WHERE id = ?")
        .param(id)
        .query((rs, i) -> map(rs, principal.getName()))
        .single();
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  /** Mọi đơn như trước; địa chỉ giao hàng chỉ được giải mã cho đơn của chính người gọi. */
  @GetMapping("/orders")
  public List<Order> list(Principal principal) {
    return jdbc.sql("SELECT id, product_id, qty, created_at, owner, delivery_address FROM orders ORDER BY id")
        .query((rs, i) -> map(rs, principal.getName()))
        .list();
  }

  private Order map(java.sql.ResultSet rs, String caller) throws java.sql.SQLException {
    String stored = rs.getString("delivery_address");
    String address = stored != null && caller.equals(rs.getString("owner")) ? encryptor.decrypt(stored) : null;
    return new Order(rs.getLong("id"), rs.getLong("product_id"), rs.getInt("qty"),
        rs.getTimestamp("created_at").toInstant(), address);
  }

  private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
