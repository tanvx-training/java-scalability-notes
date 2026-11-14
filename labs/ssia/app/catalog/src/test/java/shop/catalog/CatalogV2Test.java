package shop.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "APP_VERSION=2.0")
class CatalogV2Test {

  @LocalServerPort int port;

  @Test
  void v2ProductsHaveDiscount() throws Exception {
    HttpResponse<String> r = HttpClient.newHttpClient().send(
        HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/products/1")).build(),
        HttpResponse.BodyHandlers.ofString());
    assertThat(r.body()).contains("\"discount\":10");
  }
}
