package lab.s06;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Gọi endpoint của đề bài s06 qua MockMvc (đi qua springSecurityFilterChain): POST /users với
 * {"username","password","authorities"}, PUT /users/me/password với {"oldPassword","newPassword"}.
 */
final class Http {

  private Http() {}

  static String newUserJson(String username, String password, String... authorities) {
    StringBuilder a = new StringBuilder();
    for (String x : authorities) {
      a.append(a.length() == 0 ? "" : ",").append('"').append(x).append('"');
    }
    return "{\"username\":\"" + username + "\",\"password\":\"" + password + "\",\"authorities\":[" + a + "]}";
  }

  static String passwordJson(String oldPassword, String newPassword) {
    return "{\"oldPassword\":\"" + oldPassword + "\",\"newPassword\":\"" + newPassword + "\"}";
  }

  /** user == null: ẩn danh; withCsrf == false: không gửi token CSRF. */
  static int createUser(MockMvc mvc, String user, String password, boolean withCsrf, String body) throws Exception {
    return status(mvc, post("/users"), user, password, withCsrf, body);
  }

  static int changePassword(MockMvc mvc, String user, String password, boolean withCsrf, String body) throws Exception {
    return status(mvc, put("/users/me/password"), user, password, withCsrf, body);
  }

  /** Như changePassword nhưng trả cả response để xem header. */
  static MockHttpServletResponse changePasswordResponse(MockMvc mvc, String user, String password, String body)
      throws Exception {
    return mvc.perform(put("/users/me/password").contentType(MediaType.APPLICATION_JSON).content(body)
        .with(httpBasic(user, password)).with(csrf())).andReturn().getResponse();
  }

  static int getOrders(MockMvc mvc, String user, String password) throws Exception {
    return mvc.perform(get("/orders").with(httpBasic(user, password))).andReturn().getResponse().getStatus();
  }

  private static int status(MockMvc mvc, MockHttpServletRequestBuilder b, String user, String password,
      boolean withCsrf, String body) throws Exception {
    b.contentType(MediaType.APPLICATION_JSON).content(body);
    if (user != null) {
      b.with(httpBasic(user, password));
    }
    if (withCsrf) {
      b.with(csrf());
    }
    return mvc.perform(b).andReturn().getResponse().getStatus();
  }
}
