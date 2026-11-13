package shop.order;

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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderTest {

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

  HttpResponse<String> send(String method, String path, String body) throws Exception {
    HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
        .header("Content-Type", "application/json");
    b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
    return HttpClient.newHttpClient().send(b.build(), HttpResponse.BodyHandlers.ofString());
  }

  @Test
  void createsOrderAndListsIt() throws Exception {
    HttpResponse<String> r = send("POST", "/orders", "{\"productId\":1,\"qty\":2}");
    assertThat(r.statusCode()).isEqualTo(201);
    assertThat(r.body()).contains("\"productId\":1").contains("\"qty\":2");
    HttpResponse<String> list = send("GET", "/orders", null);
    assertThat(list.statusCode()).isEqualTo(200);
    assertThat(list.body()).contains("\"productId\":1");
  }

  @Test
  void unknownProductIs422() throws Exception {
    assertThat(send("POST", "/orders", "{\"productId\":999,\"qty\":1}").statusCode()).isEqualTo(422);
  }

  @Test
  void readinessIsUp() throws Exception {
    HttpResponse<String> r = send("GET", "/actuator/health/readiness", null);
    assertThat(r.statusCode()).isEqualTo(200);
    assertThat(r.body()).contains("\"UP\"");
  }
}
