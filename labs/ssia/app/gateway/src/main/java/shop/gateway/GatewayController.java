package shop.gateway;

import java.net.InetAddress;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@RestController
public class GatewayController {

  public record Info(String service, String version, String hostname, String greeting) {}

  private final RestClient catalog;
  private final RestClient order;
  private final String version;
  private final String greeting;

  public GatewayController(
      @Value("${app.catalog-url}") String catalogUrl,
      @Value("${app.order-url}") String orderUrl,
      @Value("${app.version}") String version,
      @Value("${app.greeting}") String greeting) {
    this.catalog = RestClient.builder().baseUrl(catalogUrl).build();
    this.order = RestClient.builder().baseUrl(orderUrl).build();
    this.version = version;
    this.greeting = greeting;
  }

  @GetMapping("/api/info")
  public Info info() {
    return new Info("gateway", version, hostname(), greeting);
  }

  @GetMapping("/api/products")
  public ResponseEntity<String> products() {
    return forward(() -> catalog.get().uri("/products"), "catalog");
  }

  @GetMapping("/api/orders")
  public ResponseEntity<String> orders() {
    return forward(() -> order.get().uri("/orders"), "order");
  }

  @PostMapping("/api/orders")
  public ResponseEntity<String> createOrder(@RequestBody String body) {
    return forward(
        () -> order.post().uri("/orders").contentType(MediaType.APPLICATION_JSON).body(body),
        "order");
  }

  /** Chuyển tiếp nguyên trạng mã trạng thái và thân JSON; không kết nối được thì 503. */
  private ResponseEntity<String> forward(
      java.util.function.Supplier<RestClient.RequestHeadersSpec<?>> request, String target) {
    try {
      return request.get().exchange((req, res) -> {
        String payload = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.status(res.getStatusCode()).contentType(MediaType.APPLICATION_JSON).body(payload);
      });
    } catch (ResourceAccessException e) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .contentType(MediaType.APPLICATION_JSON)
          .body("{\"error\":\"không kết nối được " + target + "\"}");
    }
  }

  private static String hostname() {
    String h = System.getenv("HOSTNAME");
    if (h != null && !h.isBlank()) {
      return h;
    }
    try {
      return InetAddress.getLocalHost().getHostName();
    } catch (Exception e) {
      return "unknown";
    }
  }
}
