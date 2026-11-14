# s02 — lần theo một lần đăng nhập Basic và sửa sự cố st02-no-prefix. Một lần Maven cho test của buổi,
# rồi mỗi kiểm tra một dòng. Test nằm ở order/src/test/java/lab/s02/ trong workspace.
lab_mvn -q -pl order -am test -Dtest='lab.s02.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "john:12345 → 200" 'lab.s02.S02LoginTest#johnGets200'
expect_test "john + mật khẩu sai → 401" 'lab.s02.S02LoginTest#johnWrongPasswordIs401'
expect_test "user mặc định của Spring Boot không còn" 'lab.s02.S02LoginTest#generatedUserIsGone'
expect_test "answers/s02.env: MANAGER_WRAPPER" 'lab.s02.S02AnswersTest#managerWrapper'
expect_test "answers/s02.env: LOCAL_PROVIDERS" 'lab.s02.S02AnswersTest#localProviders'
expect_test "answers/s02.env: PROVIDER, PROVIDER_IN" 'lab.s02.S02AnswersTest#providerAndWhere'
expect_test "answers/s02.env: USER_DETAILS_SERVICE" 'lab.s02.S02AnswersTest#userDetailsService'
expect_test "answers/s02.env: PASSWORD_ENCODER" 'lab.s02.S02AnswersTest#passwordEncoder'
assert_summary
