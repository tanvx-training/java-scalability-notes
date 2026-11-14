# s01 — Spring Security mặc định trên order. Một lần Maven (test của buổi + bốn test gốc của order),
# rồi mỗi kiểm tra một dòng. Test nằm ở order/src/test/java/lab/s01/ trong workspace.
lab_mvn -q -pl order -am test -Dtest='lab.s01.**,shop.order.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "GET /orders không credential → 401" 'lab.s01.S01ProtectedTest#ordersWithoutCredentialsIs401'
expect_test "401 kèm WWW-Authenticate: Basic" 'lab.s01.S01ProtectedTest#challengeIsHttpBasic'
expect_test "user mặc định + mật khẩu sinh ra → 200" 'lab.s01.S01DefaultUserTest#defaultUserGets200'
expect_test "mật khẩu sai → 401" 'lab.s01.S01DefaultUserTest#wrongPasswordIs401'
expect_test "answers/s01.env: CHAIN_BEAN khớp bean đang chạy" 'lab.s01.S01AnswersTest#chainBeanName'
expect_test "answers/s01.env: FILTERS đúng thứ tự thật" 'lab.s01.S01AnswersTest#filterList'
expect_test "answers/s01.env: FILTER_COUNT, BEFORE_BASIC, AFTER_CSRF" 'lab.s01.S01AnswersTest#countAndNeighbours'
expect_test "test gốc: tạo và liệt kê đơn (POST có CSRF)" 'shop.order.OrderTest#createsOrderAndListsIt'
expect_test "test gốc: sản phẩm không có → 422" 'shop.order.OrderTest#unknownProductIs422'
expect_test "test gốc: readiness UP" 'shop.order.OrderTest#readinessIsUp'
expect_test "test gốc: catalog sập → 503" 'shop.order.OrderCatalogDownTest#unreachableCatalogIs503'
expect_test "MockMvc của OrderTest vẫn chặn GET /orders ẩn danh" 'lab.s01.S01TestsKeepSecurityTest#orderTestKeepsSecurity'
expect_test "MockMvc của OrderCatalogDownTest vẫn chặn GET /orders ẩn danh" 'lab.s01.S01TestsKeepSecurityTest#catalogDownTestKeepsSecurity'
expect_test "MockMvc của OrderTest vẫn đòi CSRF cho POST đã đăng nhập" 'lab.s01.S01TestsKeepSecurityTest#orderTestKeepsCsrf'
expect_test "MockMvc của OrderCatalogDownTest vẫn đòi CSRF cho POST đã đăng nhập" 'lab.s01.S01TestsKeepSecurityTest#catalogDownTestKeepsCsrf'
assert_summary
