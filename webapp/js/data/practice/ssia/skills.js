// Danh mục kỹ năng của chương trình ssia. Mỗi kỹ năng được HỌC ở đúng một buổi
// (session.skills) và có thể được DÙNG LẠI ở các buổi sau (session.uses) —
// check-data PR5. Nhóm theo buổi học để dễ soát.
//
// kind: command | yaml | procedure | concept | docs | path
// area: id một mảng trong program.skillAreas (suy ra từ tiền tố id: cfg- int- pro- dx- tst-)
// ref:  để trống — lĩnh vực spring-security không có module Thực hành nhanh.

export const skills = [
  // ── s01 Thêm Spring Security vào order: mặc định sinh ra gì ──
  { id: "cfg-starter-security", kind: "procedure", area: "config", label: "Thêm spring-boot-starter-security vào pom của order và build lại" },
  { id: "dx-default-user-password", kind: "command", area: "diagnose", label: "Tìm mật khẩu sinh sẵn của user mặc định trong log khởi động; curl -u user:<mật khẩu> /orders" },
  { id: "int-autoconfig-security", kind: "concept", area: "internals", label: "Auto-configuration bật những bean bảo mật nào khi có starter trên classpath" },

  // ── s02 Bức tranh class của Spring Security: lần theo một request ──
  { id: "int-auth-flow-diagram", kind: "concept", area: "internals", label: "Vẽ luồng authentication từ filter tới SecurityContext, gọi đúng tên contract" },
  { id: "dx-security-debug-log", kind: "command", area: "diagnose", label: "Bật logging.level.org.springframework.security=TRACE và đọc luồng request" },
  { id: "int-debug-breakpoint-filter", kind: "procedure", area: "internals", label: "Đặt breakpoint trong chuỗi filter để thấy request đi qua đâu" },

  // ── s03 Ghi đè các cấu hình mặc định ──
  { id: "cfg-userdetailsservice-bean", kind: "yaml", area: "config", label: "Bean UserDetailsService và PasswordEncoder thay user mặc định" },
  { id: "cfg-securityfilterchain-bean", kind: "yaml", area: "config", label: "Bean SecurityFilterChain với authorizeHttpRequests và httpBasic" },
  { id: "cfg-multiple-config-classes", kind: "procedure", area: "config", label: "Tách cấu hình bảo mật ra nhiều lớp @Configuration" },
  { id: "int-custom-provider-sketch", kind: "concept", area: "internals", label: "AuthenticationProvider tùy chỉnh thay UserDetailsService và PasswordEncoder" },

  // ── s04 UserDetails và GrantedAuthority ──
  { id: "int-userdetails-contract", kind: "concept", area: "internals", label: "Các phương thức của UserDetails và ý nghĩa của từng cờ tài khoản" },
  { id: "int-grantedauthority", kind: "concept", area: "internals", label: "GrantedAuthority là một chuỗi quyền; SimpleGrantedAuthority" },
  { id: "dx-account-status-errors", kind: "command", area: "diagnose", label: "Gọi /orders với user bị disabled/locked và đọc phản hồi cùng log" },

  // ── s05 Hiện thực UserDetails: tối giản, builder, và gói entity ──
  { id: "cfg-userdetails-impl", kind: "procedure", area: "config", label: "Hiện thực UserDetails tối giản cho user của order" },
  { id: "cfg-user-builder", kind: "command", area: "config", label: "User.withUsername(...).password(...).authorities(...).build()" },
  { id: "int-userdetails-wrapper", kind: "concept", area: "internals", label: "Bọc entity bằng UserDetails thay vì để một lớp có hai trách nhiệm" },

  // ── s06 UserDetailsService và UserDetailsManager: user lưu trong DB ──
  { id: "cfg-userdetailsservice-db", kind: "procedure", area: "config", label: "UserDetailsService đọc user từ bảng users của order" },
  { id: "cfg-userdetailsmanager", kind: "procedure", area: "config", label: "UserDetailsManager tạo, đổi, xoá user (JdbcUserDetailsManager)" },
  { id: "dx-username-not-found", kind: "command", area: "diagnose", label: "Đăng nhập với username không có và đọc UsernameNotFoundException / phản hồi" },

  // ── s07 PasswordEncoder: contract, tự viết, và các bản có sẵn ──
  { id: "int-passwordencoder-contract", kind: "concept", area: "internals", label: "encode, matches, upgradeEncoding của PasswordEncoder" },
  { id: "cfg-passwordencoder-bean", kind: "yaml", area: "config", label: "Khai PasswordEncoder (BCrypt) làm bean" },
  { id: "dx-encoder-benchmark", kind: "procedure", area: "diagnose", label: "Đo thời gian băm các encoder với cùng một mật khẩu" },

  // ── s08 DelegatingPasswordEncoder và crypto module ──
  { id: "cfg-delegating-encoder", kind: "yaml", area: "config", label: "PasswordEncoderFactories.createDelegatingPasswordEncoder và tiền tố {id}" },
  { id: "pro-hash-vs-encrypt", kind: "concept", area: "protocol", label: "Băm một chiều (mật khẩu) khác mã hóa hai chiều (secret) thế nào" },
  { id: "cfg-crypto-encryptors", kind: "procedure", area: "config", label: "KeyGenerators và Encryptors của spring-security-crypto" },

  // ── s09 Filter trong kiến trúc Spring Security; thêm filter trước một filter có sẵn ──
  { id: "int-filterchain-proxy", kind: "concept", area: "internals", label: "DelegatingFilterProxy, FilterChainProxy và SecurityFilterChain nối với nhau thế nào" },
  { id: "dx-list-filters", kind: "command", area: "diagnose", label: "In danh sách filter của chuỗi (log TRACE hoặc debug FilterChainProxy)" },
  { id: "cfg-add-filter-before", kind: "procedure", area: "config", label: "http.addFilterBefore(filter, tênFilter.class)" },

  // ── s10 Thêm filter sau và tại vị trí của một filter khác ──
  { id: "cfg-add-filter-after", kind: "procedure", area: "config", label: "http.addFilterAfter(filter, tênFilter.class)" },
  { id: "cfg-add-filter-at", kind: "procedure", area: "config", label: "http.addFilterAt(filter, tênFilter.class) và hệ quả khi trùng vị trí" },
  { id: "dx-filter-order-bug", kind: "procedure", area: "diagnose", label: "Chẩn đoán filter chạy sai thứ tự: log TRACE rồi đối chiếu danh sách filter" },

  // ── s11 Các filter có sẵn: GenericFilterBean, OncePerRequestFilter và bạn bè ──
  { id: "int-once-per-request-filter", kind: "concept", area: "internals", label: "OncePerRequestFilter, GenericFilterBean và khi nào chọn cái nào" },
  { id: "cfg-should-not-filter", kind: "procedure", area: "config", label: "Bỏ qua filter cho một số request bằng shouldNotFilter" },

  // ── s12 AuthenticationProvider: Authentication, logic tùy chỉnh ──
  { id: "int-authentication-contract", kind: "concept", area: "internals", label: "Authentication: principal, credentials, authorities, cờ authenticated" },
  { id: "cfg-authenticationprovider", kind: "procedure", area: "config", label: "Viết và đăng ký AuthenticationProvider tùy chỉnh" },
  { id: "int-providermanager", kind: "concept", area: "internals", label: "ProviderManager hỏi từng AuthenticationProvider qua supports() và authenticate()" },

  // ── s13 SecurityContext và các chiến lược lưu giữ ──
  { id: "int-securitycontextholder", kind: "concept", area: "internals", label: "SecurityContextHolder và ba chiến lược lưu giữ" },
  { id: "cfg-holder-strategy", kind: "command", area: "config", label: "Đặt chiến lược bằng SecurityContextHolder.setStrategyName hoặc thuộc tính hệ thống" },
  { id: "dx-context-lost-async", kind: "procedure", area: "diagnose", label: "Chẩn đoán Authentication null trong thread @Async" },

  // ── s14 Chuyển tiếp SecurityContext sang thread khác ──
  { id: "cfg-delegating-runnable", kind: "procedure", area: "config", label: "DelegatingSecurityContextRunnable và Callable" },
  { id: "cfg-delegating-executor", kind: "procedure", area: "config", label: "DelegatingSecurityContextExecutorService bọc executor" },
  { id: "dx-verify-context-thread", kind: "procedure", area: "diagnose", label: "Kiểm Authentication trong thread con bằng log và test" },

  // ── s15 HTTP Basic và form login ──
  { id: "cfg-http-basic-entrypoint", kind: "yaml", area: "config", label: "httpBasic với AuthenticationEntryPoint tùy chỉnh" },
  { id: "cfg-form-login", kind: "yaml", area: "config", label: "formLogin với loginPage, successHandler, failureHandler" },
  { id: "dx-401-vs-redirect", kind: "concept", area: "diagnose", label: "Khi nào trả 401 và khi nào chuyển hướng tới trang đăng nhập" },

  // ── s16 Tự làm: đăng nhập cho order từ đầu ──
  { id: "cfg-login-from-scratch", kind: "procedure", area: "config", label: "Dựng đăng nhập hoàn chỉnh cho một service từ đề bài" },
  { id: "dx-self-debug-auth", kind: "procedure", area: "diagnose", label: "Tự chẩn đoán lỗi đăng nhập từ log TRACE và stack trace" },

  // ── s17 Hạn chế truy cập theo authority ──
  { id: "cfg-has-authority", kind: "yaml", area: "config", label: "hasAuthority, hasAnyAuthority trong authorizeHttpRequests" },
  { id: "int-authorizationmanager", kind: "concept", area: "internals", label: "AuthorizationFilter và AuthorizationManager quyết định cho/không cho thế nào" },
  { id: "dx-403-trace", kind: "procedure", area: "diagnose", label: "Đọc log TRACE của một request bị 403" },

  // ── s18 Hạn chế theo role và chặn mọi endpoint ──
  { id: "cfg-has-role", kind: "yaml", area: "config", label: "hasRole, hasAnyRole và tiền tố ROLE_" },
  { id: "cfg-deny-all", kind: "yaml", area: "config", label: "anyRequest().denyAll() làm luật cuối mặc định đóng" },
  { id: "dx-403-right-role", kind: "procedure", area: "diagnose", label: "403 dù đúng role: kiểm tiền tố ROLE_ và thứ tự luật" },

  // ── s19 requestMatchers để chọn endpoint ──
  { id: "cfg-request-matchers", kind: "yaml", area: "config", label: "requestMatchers(HttpMethod, đường dẫn) trong authorizeHttpRequests" },
  { id: "int-matcher-order", kind: "concept", area: "internals", label: "Luật đầu tiên khớp sẽ thắng: thứ tự khai báo" },
  { id: "dx-matcher-miss", kind: "procedure", area: "diagnose", label: "Chẩn đoán matcher không khớp request (dấu gạch chéo, phương thức, path variable)" },

  // ── s20 Chọn request áp luật và matcher dùng biểu thức chính quy ──
  { id: "cfg-regex-matchers", kind: "yaml", area: "config", label: "Matcher biểu thức chính quy cho request" },
  { id: "cfg-multiple-filterchains", kind: "procedure", area: "config", label: "Nhiều SecurityFilterChain với @Order và securityMatcher" },
  { id: "int-chain-selection", kind: "concept", area: "internals", label: "FilterChainProxy chọn chain đầu tiên khớp request" },

  // ── s21 CSRF hoạt động thế nào trong Spring Security ──
  { id: "pro-csrf-attack", kind: "concept", area: "protocol", label: "Kịch bản CSRF: trình duyệt tự gửi cookie phiên" },
  { id: "int-csrffilter", kind: "concept", area: "internals", label: "CsrfFilter, CsrfTokenRepository và CsrfTokenRequestHandler" },
  { id: "dx-csrf-403", kind: "procedure", area: "diagnose", label: "Chẩn đoán 403 do thiếu hoặc sai CSRF token" },

  // ── s22 Dùng CSRF trong các tình huống thực tế ──
  { id: "cfg-csrf-in-forms", kind: "procedure", area: "config", label: "Gửi CSRF token trong form và trong header X-CSRF-TOKEN" },
  { id: "pro-csrf-when-disable", kind: "concept", area: "protocol", label: "Khi nào tắt CSRF an toàn (API không dựa cookie phiên) và khi nào không" },
  { id: "dx-csrf-spa", kind: "procedure", area: "diagnose", label: "Chẩn đoán CSRF với client JavaScript (cookie, header, phiên)" },

  // ── s23 Tùy chỉnh bảo vệ CSRF ──
  { id: "cfg-csrf-token-repository", kind: "procedure", area: "config", label: "CsrfTokenRepository (cookie, phiên, tự viết)" },
  { id: "cfg-csrf-ignoring", kind: "yaml", area: "config", label: "csrf.ignoringRequestMatchers và csrfTokenRequestHandler" },
  { id: "tst-csrf-manual", kind: "procedure", area: "testing", label: "Kiểm CSRF bằng curl: lấy token, gửi lại cùng cookie" },

  // ── s24 CORS hoạt động thế nào; @CrossOrigin ──
  { id: "pro-cors-preflight", kind: "concept", area: "protocol", label: "Same-origin, preflight OPTIONS và các header Access-Control-*" },
  { id: "cfg-cross-origin-annotation", kind: "procedure", area: "config", label: "@CrossOrigin(origins, methods, allowedHeaders)" },
  { id: "dx-cors-devtools", kind: "procedure", area: "diagnose", label: "Đọc lỗi CORS ở DevTools và so với header thật bằng curl -i" },

  // ── s25 CORS bằng CorsConfigurer và vị trí của nó trong chuỗi filter ──
  { id: "cfg-cors-configurer", kind: "yaml", area: "config", label: "http.cors(...) với CorsConfigurationSource" },
  { id: "int-cors-filter-order", kind: "concept", area: "internals", label: "CorsFilter đứng trước xác thực để trả lời preflight" },
  { id: "dx-preflight-denied", kind: "procedure", area: "diagnose", label: "Chẩn đoán preflight OPTIONS bị từ chối" },

  // ── s26 Bật method security và call authorization ──
  { id: "cfg-enable-method-security", kind: "yaml", area: "config", label: "@EnableMethodSecurity trong lớp cấu hình" },
  { id: "int-method-security-proxy", kind: "concept", area: "internals", label: "Method security hoạt động qua proxy AOP, interceptor đứng trước/sau method" },
  { id: "dx-annotation-ignored", kind: "procedure", area: "diagnose", label: "Chẩn đoán @PreAuthorize không có tác dụng: self-invocation, thiếu bật, bean không phải proxy" },

  // ── s27 Preauthorization và postauthorization ──
  { id: "cfg-preauthorize", kind: "yaml", area: "config", label: "@PreAuthorize với SpEL và tham số method" },
  { id: "cfg-postauthorize", kind: "yaml", area: "config", label: "@PostAuthorize với returnObject" },
  { id: "dx-postauthorize-sideeffect", kind: "concept", area: "diagnose", label: "@PostAuthorize chỉ chặn sau khi method đã chạy: hệ quả với side effect" },

  // ── s28 Hiện thực permission cho method ──
  { id: "cfg-permission-evaluator", kind: "procedure", area: "config", label: "PermissionEvaluator và MethodSecurityExpressionHandler" },
  { id: "cfg-spel-bean-call", kind: "yaml", area: "config", label: "@PreAuthorize(\"@bean.kiemTra(#id)\") gọi bean tự viết" },
  { id: "tst-method-permission", kind: "procedure", area: "testing", label: "Kiểm permission với nhiều user trong test" },

  // ── s29 Prefiltering: @PreFilter ──
  { id: "cfg-prefilter", kind: "yaml", area: "config", label: "@PreFilter với filterObject" },
  { id: "dx-filter-collection-type", kind: "procedure", area: "diagnose", label: "Chẩn đoán lỗi @PreFilter với collection không sửa được" },
  { id: "int-filter-before-method", kind: "concept", area: "internals", label: "Interceptor lọc tham số trước khi method thực thi" },

  // ── s30 Postfiltering và filtering trong Spring Data repository ──
  { id: "cfg-postfilter", kind: "yaml", area: "config", label: "@PostFilter với filterObject" },
  { id: "cfg-data-security-spel", kind: "yaml", area: "config", label: "Biểu thức SpEL của security trong @Query của Spring Data" },
  { id: "dx-filter-perf", kind: "procedure", area: "diagnose", label: "So @PostFilter với lọc ở query theo số dòng đọc" },

  // ── s31 Tự làm: chỉ chủ đơn mới thấy đơn ──
  { id: "cfg-owner-only-from-scratch", kind: "procedure", area: "config", label: "Dựng quy tắc chỉ chủ sở hữu từ đề bài" },
  { id: "dx-self-debug-method-security", kind: "procedure", area: "diagnose", label: "Tự chẩn đoán lỗi method security từ log và test" },

  // ── s32 Bức tranh OAuth 2 / OIDC và các loại token ──
  { id: "pro-oauth2-roles", kind: "concept", area: "protocol", label: "Resource owner, client, authorization server, resource server" },
  { id: "pro-jwt-anatomy", kind: "procedure", area: "protocol", label: "Giải mã header và payload của JWT, đọc các claim iss, sub, aud, exp" },
  { id: "pro-opaque-vs-jwt", kind: "concept", area: "protocol", label: "Opaque token cần introspection; JWT tự mô tả và kiểm bằng chữ ký" },

  // ── s33 Lấy token bằng các grant type ──
  { id: "pro-authcode-flow", kind: "procedure", area: "protocol", label: "Authorization code: redirect, code, đổi code lấy token" },
  { id: "pro-pkce", kind: "procedure", area: "protocol", label: "code_verifier, code_challenge và vì sao chặn đánh cắp code" },
  { id: "pro-grant-types", kind: "concept", area: "protocol", label: "Client credentials và refresh token: dùng khi nào" },

  // ── s34 OpenID Connect và những "tội lỗi" của OAuth 2 ──
  { id: "pro-oidc-idtoken", kind: "concept", area: "protocol", label: "ID token, scope openid, userinfo của OpenID Connect" },
  { id: "pro-oauth2-pitfalls", kind: "concept", area: "protocol", label: "Những sai lầm điển hình của OAuth 2 (implicit, lưu token sai chỗ, scope rộng)" },

  // ── s35 Authorization server cấp JWT ──
  { id: "cfg-authserver-module", kind: "procedure", area: "config", label: "Module auth từ starter authorization server" },
  { id: "cfg-registered-client", kind: "yaml", area: "config", label: "RegisteredClient: clientId, secret, grant type, scope" },
  { id: "pro-jwks-metadata", kind: "command", area: "protocol", label: "curl endpoint metadata và JWKS của authorization server" },

  // ── s36 Chạy authorization code grant type ──
  { id: "cfg-authcode-client", kind: "yaml", area: "config", label: "Client authorization code với redirectUri và PKCE" },
  { id: "pro-authserver-endpoints", kind: "concept", area: "protocol", label: "Các endpoint authorize, token, jwks, introspect, revoke của server" },
  { id: "dx-invalid-grant", kind: "procedure", area: "diagnose", label: "Chẩn đoán redirect_uri sai, code hết hạn, invalid_grant" },

  // ── s37 Chạy client credentials grant type ──
  { id: "cfg-client-credentials", kind: "yaml", area: "config", label: "Client dùng client_credentials và scope riêng" },
  { id: "cfg-token-customizer", kind: "procedure", area: "config", label: "OAuth2TokenCustomizer thêm claim vào JWT" },

  // ── s38 Opaque token, introspection và thu hồi token ──
  { id: "cfg-opaque-token", kind: "yaml", area: "config", label: "Client dùng opaque (reference) token" },
  { id: "pro-introspection", kind: "command", area: "protocol", label: "POST tới introspection endpoint và đọc active" },
  { id: "pro-token-revocation", kind: "command", area: "protocol", label: "POST tới revocation endpoint rồi introspect lại" },

  // ── s39 Cấu hình kiểm chứng JWT ──
  { id: "cfg-resource-server-jwt", kind: "yaml", area: "config", label: "oauth2ResourceServer(jwt) với issuer-uri hoặc jwk-set-uri" },
  { id: "int-bearer-token-filter", kind: "concept", area: "internals", label: "BearerTokenAuthenticationFilter và JwtAuthenticationProvider" },
  { id: "dx-bearer-401", kind: "procedure", area: "diagnose", label: "Đọc header WWW-Authenticate khi token sai hoặc hết hạn" },

  // ── s40 Dùng JWT tùy chỉnh: claim và authority ──
  { id: "cfg-jwt-authorities-converter", kind: "procedure", area: "config", label: "JwtAuthenticationConverter và JwtGrantedAuthoritiesConverter" },
  { id: "cfg-scope-rules", kind: "yaml", area: "config", label: "hasAuthority(\"SCOPE_x\") hoặc @PreAuthorize theo scope" },
  { id: "dx-scope-vs-role", kind: "procedure", area: "diagnose", label: "Chẩn đoán 403 do prefix SCOPE_ và claim không khớp" },

  // ── s41 Kiểm chứng token bằng introspection ──
  { id: "cfg-resource-server-opaque", kind: "yaml", area: "config", label: "oauth2ResourceServer(opaqueToken) với introspection-uri" },
  { id: "dx-introspection-failure", kind: "procedure", area: "diagnose", label: "Chẩn đoán introspection lỗi: client, URL, token không active" },

  // ── s42 Hệ thống multitenant ──
  { id: "cfg-multitenant-resolver", kind: "procedure", area: "config", label: "AuthenticationManagerResolver chọn issuer theo request" },
  { id: "pro-multitenancy-models", kind: "concept", area: "protocol", label: "Các mô hình multitenant: một issuer nhiều tenant hay mỗi tenant một issuer" },

  // ── s43 OAuth 2 login với một nhà cung cấp phổ biến ──
  { id: "cfg-oauth2-login", kind: "yaml", area: "config", label: "http.oauth2Login và spring.security.oauth2.client.registration" },
  { id: "int-clientregistration", kind: "concept", area: "internals", label: "ClientRegistration và ClientRegistrationRepository" },
  { id: "dx-oauth2-login-redirect", kind: "procedure", area: "diagnose", label: "Chẩn đoán redirect-uri không khớp khi oauth2Login" },

  // ── s44 OAuth 2 login với auth server của shop ──
  { id: "cfg-custom-provider-registration", kind: "yaml", area: "config", label: "Đăng ký provider tùy chỉnh bằng issuer-uri" },
  { id: "cfg-clientregistrationrepository", kind: "procedure", area: "config", label: "ClientRegistrationRepository tự viết" },
  { id: "cfg-oauth2-user-authorities", kind: "procedure", area: "config", label: "Ánh xạ authority của user từ OAuth 2 login" },

  // ── s45 Hiện thực OAuth 2 client: gateway gọi service ──
  { id: "cfg-authorized-client-manager", kind: "procedure", area: "config", label: "OAuth2AuthorizedClientManager và OAuth2AuthorizedClientService" },
  { id: "cfg-token-relay", kind: "procedure", area: "config", label: "Gắn Authorization: Bearer vào cuộc gọi từ gateway sang order" },
  { id: "dx-token-expired-client", kind: "procedure", area: "diagnose", label: "Chẩn đoán access token hết hạn và refresh trong client" },

  // ── s46 Tự làm: chuyển tiếp token qua gateway ──
  { id: "cfg-relay-from-scratch", kind: "procedure", area: "config", label: "Dựng chuyển tiếp token qua gateway từ đề bài" },
  { id: "dx-trace-token-across-services", kind: "procedure", area: "diagnose", label: "Lần theo một token qua gateway, order, catalog bằng log" },

  // ── s47 Tự làm: order gọi catalog bằng client credentials ──
  { id: "cfg-s2s-from-scratch", kind: "procedure", area: "config", label: "Dựng cuộc gọi service-to-service bằng client credentials từ đề bài" },
  { id: "dx-user-vs-service-identity", kind: "concept", area: "diagnose", label: "Phân biệt danh tính user và danh tính service trong log và token" },

  // ── s48 Ứng dụng reactive và quản lý user trong đó ──
  { id: "int-reactive-vs-servlet", kind: "concept", area: "internals", label: "WebFilter, ServerWebExchange và ngữ cảnh reactive khác servlet thế nào" },
  { id: "cfg-reactive-userdetails", kind: "yaml", area: "config", label: "ReactiveUserDetailsService và SecurityWebFilterChain" },
  { id: "dx-reactive-blocking-call", kind: "procedure", area: "diagnose", label: "Chẩn đoán lời gọi blocking trong luồng reactive" },

  // ── s49 Authorization trong ứng dụng reactive: endpoint và method ──
  { id: "cfg-authorize-exchange", kind: "yaml", area: "config", label: "authorizeExchange và pathMatchers" },
  { id: "cfg-reactive-method-security", kind: "yaml", area: "config", label: "@EnableReactiveMethodSecurity và @PreAuthorize với Mono/Flux" },
  { id: "int-reactive-security-context", kind: "concept", area: "internals", label: "ReactiveSecurityContextHolder lấy context từ Reactor Context" },

  // ── s50 Resource server OAuth 2 reactive ──
  { id: "cfg-reactive-resource-server", kind: "yaml", area: "config", label: "oauth2ResourceServer(jwt) trong SecurityWebFilterChain" },
  { id: "dx-reactive-401", kind: "procedure", area: "diagnose", label: "Chẩn đoán 401 trong WebFlux: log và header" },

  // ── s51 Mock user, user từ UserDetailsService và Authentication tùy chỉnh ──
  { id: "tst-with-mock-user", kind: "procedure", area: "testing", label: "@WithMockUser và SecurityMockMvcRequestPostProcessors.user" },
  { id: "tst-with-user-details", kind: "procedure", area: "testing", label: "@WithUserDetails nạp user từ UserDetailsService" },
  { id: "tst-custom-security-context", kind: "procedure", area: "testing", label: "Annotation + WithSecurityContextFactory cho Authentication tùy chỉnh" },

  // ── s52 Test method security và test authentication ──
  { id: "tst-method-security", kind: "procedure", area: "testing", label: "Test method security với @WithMockUser trên bean" },
  { id: "tst-authentication", kind: "procedure", area: "testing", label: "Test httpBasic và formLogin bằng MockMvc" },
  { id: "dx-test-catches-misconfig", kind: "procedure", area: "diagnose", label: "Dùng test đỏ để định vị cấu hình bảo mật sai" },

  // ── s53 Test CSRF, CORS và ứng dụng reactive ──
  { id: "tst-csrf", kind: "procedure", area: "testing", label: "with(csrf()) trong MockMvc và kiểm phản hồi 403" },
  { id: "tst-cors", kind: "procedure", area: "testing", label: "Kiểm header Access-Control-* và preflight trong MockMvc" },
  { id: "tst-reactive", kind: "procedure", area: "testing", label: "WebTestClient với mutateWith và SecurityMockServerConfigurers" },

];
