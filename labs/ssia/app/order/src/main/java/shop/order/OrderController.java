package shop.order;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
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

  public record NewOrder(long productId, int qty) {}

  public record Order(long id, long productId, int qty, Instant createdAt) {}

  private final JdbcClient jdbc;
  private final RestClient catalog;

  public OrderController(JdbcClient jdbc, @Value("${app.catalog-url}") String catalogUrl) {
    this.jdbc = jdbc;
    this.catalog = RestClient.builder().baseUrl(catalogUrl).build();
  }

  @PostMapping("/orders")
  public ResponseEntity<?> create(@RequestBody NewOrder req) {
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
    KeyHolder keys = new GeneratedKeyHolder();
    jdbc.sql("INSERT INTO orders (product_id, qty) VALUES (?, ?)")
        .param(req.productId())
        .param(req.qty())
        .update(keys, "id");
    long id = keys.getKey().longValue();
    Order created = jdbc.sql("SELECT id, product_id, qty, created_at FROM orders WHERE id = ?")
        .param(id)
        .query(OrderController::map)
        .single();
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/orders")
  public List<Order> list() {
    return jdbc.sql("SELECT id, product_id, qty, created_at FROM orders ORDER BY id")
        .query(OrderController::map)
        .list();
  }

  private static Order map(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
    return new Order(rs.getLong("id"), rs.getLong("product_id"), rs.getInt("qty"),
        rs.getTimestamp("created_at").toInstant());
  }

  private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }
}
