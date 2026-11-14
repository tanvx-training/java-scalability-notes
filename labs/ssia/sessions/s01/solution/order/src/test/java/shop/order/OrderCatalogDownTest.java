package shop.order;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

// Cổng 1 không có ai nghe: catalog "không kết nối được".
// Từ s01: chạy qua MockMvc với @WithMockUser và token CSRF (xem OrderTest).
@SpringBootTest(properties = "CATALOG_URL=http://localhost:1")
@AutoConfigureMockMvc
@WithMockUser
class OrderCatalogDownTest {

  @Autowired MockMvc mvc;

  @Test
  void unreachableCatalogIs503() throws Exception {
    mvc.perform(post("/orders").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"productId\":1,\"qty\":1}"))
        .andExpect(status().isServiceUnavailable());
  }
}
