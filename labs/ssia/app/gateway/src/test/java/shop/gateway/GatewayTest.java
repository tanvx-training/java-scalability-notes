package shop.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {"APP_GREETING=xin chao test", "ORDER_URL=http://localhost:1"})
class GatewayTest {

  static HttpServer fake;

  static {
    try {
      fake = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
      fake.createContext("/products/1", x -> reply(x, 200, "{\"id\":1}"));
      fake.createContext("/products/999", x -> reply(x, 404, "{}"));
      fake.createContext("/products", x -> reply(x, 200, "[{\"id\":1,\"name\":\"a\"}]"));
      fake.start();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  static void reply(HttpExchange x, int code, String body) throws java.io.IOException {
    byte[] b = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    x.getResponseHeaders().add("Content-Type", "application/json");
    x.sendResponseHeaders(code, b.length);
    x.getResponseBody().write(b);
    x.close();
  }

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("CATALOG_URL", () -> "http://localhost:" + fake.getAddress().getPort());
  }

  @LocalServerPort int port;

  HttpResponse<String> get(String path) throws Exception {
    return HttpClient.newHttpClient().send(
        HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build(),
        HttpResponse.BodyHandlers.ofString());
  }

  @Test
  void infoHasFourFieldsAndGreetingFromEnv() throws Exception {
    String body = get("/api/info").body();
    assertThat(body).contains("\"service\":\"gateway\"").contains("\"version\":\"1.0\"")
        .contains("\"hostname\":").contains("\"greeting\":\"xin chao test\"");
  }

  @Test
  void productsAreForwardedFromCatalog() throws Exception {
    HttpResponse<String> r = get("/api/products");
    assertThat(r.statusCode()).isEqualTo(200);
    assertThat(r.body()).contains("\"name\":\"a\"");
  }

  @Test
  void orderServiceDownIs503() throws Exception {
    assertThat(get("/api/orders").statusCode()).isEqualTo(503);
  }

  @Test
  void readinessIsUp() throws Exception {
    HttpResponse<String> r = get("/actuator/health/readiness");
    assertThat(r.statusCode()).isEqualTo(200);
    assertThat(r.body()).contains("\"UP\"");
  }
}
