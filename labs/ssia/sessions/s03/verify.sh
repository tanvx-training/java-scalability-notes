# s03 — ghi đè mặc định: SecurityFilterChain, UserDetailsService và PasswordEncoder của bạn, tách lớp.
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s03/.
lab_mvn -q -pl order -am test -Dtest='lab.s03.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "/actuator/health không đăng nhập → 200" 'lab.s03.S03AccessTest#healthIsOpen'
expect_test "/actuator/health/liveness không đăng nhập → 200" 'lab.s03.S03AccessTest#livenessIsOpen'
expect_test "/actuator không đăng nhập → 401" 'lab.s03.S03AccessTest#actuatorIndexNeedsLogin'
expect_test "/orders không đăng nhập → 401" 'lab.s03.S03AccessTest#ordersNeedLogin'
expect_test "john:12345 → 200" 'lab.s03.S03AccessTest#johnGets200'
expect_test "đúng một SecurityFilterChain, do bạn khai" 'lab.s03.S03ConfigTest#oneChainDeclaredByYou'
expect_test "provider dùng bean UserDetailsService và PasswordEncoder của bạn" 'lab.s03.S03ConfigTest#providerUsesYourBeans'
expect_test "user/mật khẩu và luật web ở hai lớp cấu hình khác nhau" 'lab.s03.S03ConfigTest#usersAndWebRulesInSeparateClasses'
expect_test "answers/s03.env: FILTER_COUNT" 'lab.s03.S03AnswersTest#filterCount'
expect_test "answers/s03.env: REMOVED_FILTERS" 'lab.s03.S03AnswersTest#removedFilters'
expect_test "answers/s03.env: LOGIN_PAGE_STATUS" 'lab.s03.S03AnswersTest#loginPageStatus'
assert_summary
