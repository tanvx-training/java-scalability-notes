package lab.s08;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Đơn hàng của đề bài s08 qua MockMvc: POST /orders nhận {"productId","qty","deliveryAddress"}, cột
 * orders.delivery_address giữ địa chỉ đã mã hoá, orders.owner giữ username người đặt.
 */
final class Orders {

  private Orders() {}

  static final ObjectMapper JSON = new ObjectMapper();

  /** Catalog giả: sản phẩm 1 tồn tại. */
  static final HttpServer CATALOG;

  static {
    try {
      CATALOG = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
      CATALOG.createContext("/products/1", x -> {
        byte[] b = "{\"id\":1}".getBytes(StandardCharsets.UTF_8);
        x.getResponseHeaders().add("Content-Type", "application/json");
        x.sendResponseHeaders(200, b.length);
        x.getResponseBody().write(b);
        x.close();
      });
      CATALOG.start();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  static String catalogUrl() {
    return "http://localhost:" + CATALOG.getAddress().getPort();
  }

  static String randomAddress() {
    return "12 Lê Lợi, Quận 1 #" + UUID.randomUUID().toString().substring(0, 8);
  }

  /** POST /orders với địa chỉ; trả JSON của đơn vừa tạo (đòi 201). */
  static JsonNode create(MockMvc mvc, String user, String password, String address) throws Exception {
    String body = "{\"productId\":1,\"qty\":1,\"deliveryAddress\":" + JSON.writeValueAsString(address) + "}";
    MockHttpServletResponse r = mvc.perform(post("/orders").with(httpBasic(user, password)).with(csrf())
        .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn().getResponse();
    if (r.getStatus() != 201) {
      throw new AssertionError("POST /orders có deliveryAddress: mong 201, nhận " + r.getStatus());
    }
    return JSON.readTree(r.getContentAsString(StandardCharsets.UTF_8));
  }

  /** GET /orders của một user, trả mảng JSON (đòi 200). */
  static JsonNode list(MockMvc mvc, String user, String password) throws Exception {
    MockHttpServletResponse r = mvc.perform(get("/orders").with(httpBasic(user, password))).andReturn().getResponse();
    if (r.getStatus() != 200) {
      throw new AssertionError("GET /orders của " + user + ": mong 200, nhận " + r.getStatus());
    }
    return JSON.readTree(r.getContentAsString(StandardCharsets.UTF_8));
  }

  static JsonNode byId(JsonNode list, long id) {
    for (JsonNode o : list) {
      if (o.path("id").asLong() == id) {
        return o;
      }
    }
    throw new AssertionError("GET /orders không có đơn id " + id);
  }

  /** Giá trị cột orders.delivery_address của một đơn. */
  static String stored(JdbcClient jdbc, long id) {
    return jdbc.sql("SELECT delivery_address FROM orders WHERE id = ?").param(id).query(String.class).single();
  }
}
