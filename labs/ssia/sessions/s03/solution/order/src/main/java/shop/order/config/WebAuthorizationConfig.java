package shop.order.config;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/** Luật ở mức endpoint của order: health mở cho probe, mọi thứ khác cần đăng nhập bằng HTTP Basic. */
@Configuration
public class WebAuthorizationConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http.httpBasic(withDefaults());
    http.authorizeHttpRequests(c -> c
        // /actuator/health và /actuator/health/** (liveness, readiness), theo base-path của actuator
        .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
        .anyRequest().authenticated());
    return http.build();
  }
}
