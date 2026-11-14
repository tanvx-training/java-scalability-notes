package shop.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CatalogTest {

  @LocalServerPort int port;

  HttpResponse<String> get(String path) throws Exception {
    return HttpClient.newHttpClient().send(
        HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build(),
        HttpResponse.BodyHandlers.ofString());
  }

  @Test
  void listsThreeSeedProductsWithoutDbUrl() throws Exception {
    HttpResponse<String> r = get("/products");
    assertThat(r.statusCode()).isEqualTo(200);
    assertThat(r.body().split("\"name\"", -1)).hasSize(4);
    assertThat(r.body()).doesNotContain("discount");
  }

  @Test
  void unknownProductIs404() throws Exception {
    assertThat(get("/products/999").statusCode()).isEqualTo(404);
  }

  @Test
  void knownProductIs200() throws Exception {
    assertThat(get("/products/1").statusCode()).isEqualTo(200);
  }

  @Test
  void readinessIsUp() throws Exception {
    HttpResponse<String> r = get("/actuator/health/readiness");
    assertThat(r.statusCode()).isEqualTo(200);
    assertThat(r.body()).contains("\"UP\"");
  }
}
