package shop.catalog;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

  /** Từ v2 sản phẩm có thêm trường discount (phần trăm). */
  public record Product(long id, String name, BigDecimal price, Integer discount) {}

  private final JdbcClient jdbc;
  private final boolean v2;

  public ProductController(JdbcClient jdbc, @Value("${app.version}") String version) {
    this.jdbc = jdbc;
    this.v2 = version.startsWith("2");
  }

  @GetMapping("/products")
  public List<Product> list() {
    return jdbc.sql("SELECT id, name, price FROM products ORDER BY id")
        .query((rs, i) -> toProduct(rs.getLong("id"), rs.getString("name"), rs.getBigDecimal("price")))
        .list();
  }

  @GetMapping("/products/{id}")
  public ResponseEntity<Product> get(@PathVariable long id) {
    return jdbc.sql("SELECT id, name, price FROM products WHERE id = ?")
        .param(id)
        .query((rs, i) -> toProduct(rs.getLong("id"), rs.getString("name"), rs.getBigDecimal("price")))
        .optional()
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  private Product toProduct(long id, String name, BigDecimal price) {
    return new Product(id, name, price, v2 ? 10 : null);
  }
}
