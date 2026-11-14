package shop.order;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

// Từ s01 order có Spring Security: test nghiệp vụ chạy qua MockMvc (vẫn đi qua chuỗi filter bảo mật),
// đăng nhập bằng @WithMockUser để không phụ thuộc user thật, và gửi token CSRF cho POST.
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser
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

  @Autowired MockMvc mvc;

  @Test
  void createsOrderAndListsIt() throws Exception {
    mvc.perform(post("/orders").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"productId\":1,\"qty\":2}"))
        .andExpect(status().isCreated())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("\"productId\":1")))
        .andExpect(content().string(org.hamcrest.Matchers.containsString("\"qty\":2")));
    mvc.perform(get("/orders"))
        .andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("\"productId\":1")));
  }

  @Test
  void unknownProductIs422() throws Exception {
    mvc.perform(post("/orders").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"productId\":999,\"qty\":1}"))
        .andExpect(status().isUnprocessableEntity());
  }

  @Test
  void readinessIsUp() throws Exception {
    mvc.perform(get("/actuator/health/readiness"))
        .andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("\"UP\"")));
  }
}
