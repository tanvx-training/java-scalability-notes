# s04 — UserDetails của bạn bọc thực thể user của shop; Authentication sau đăng nhập chứa gì.
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s04/.
lab_mvn -q -pl order -am test -Dtest='lab.s04.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "john:12345 và mary:67890 → 200, mary với mật khẩu của john → 401" 'lab.s04.S04LoginTest#johnAndMaryLogIn'
expect_test "principal sau đăng nhập là UserDetails của bạn" 'lab.s04.S04PrincipalTest#principalIsYourUserDetails'
expect_test "principal bọc một thực thể user riêng" 'lab.s04.S04PrincipalTest#principalWrapsYourUserEntity'
expect_test "authority đúng như dữ liệu: john [read], mary [read, write]" 'lab.s04.S04PrincipalTest#authoritiesMatchData'
expect_test "answers/s04.env: PRINCIPAL_CLASS" 'lab.s04.S04AnswersTest#principalClass'
expect_test "answers/s04.env: EXTRA_AUTHORITY, EXTRA_AUTHORITY_CLASS" 'lab.s04.S04AnswersTest#extraAuthority'
expect_test "answers/s04.env: DEFAULT_METHODS" 'lab.s04.S04AnswersTest#defaultMethods'
expect_test "answers/s04.env: AUTH_CLASS, CREDENTIALS_AFTER_LOGIN" 'lab.s04.S04AnswersTest#authClassAndCredentials'
assert_summary
