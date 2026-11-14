# s06 — UserDetailsManager của bạn: tạo user và đổi mật khẩu qua HTTP; so với JdbcUserDetailsManager.
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s06/.
lab_mvn -q -pl order -am test -Dtest='lab.s06.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "POST /users tạo user, user mới đăng nhập được với đúng authority" 'lab.s06.S06CreateUserTest#createdUserLogsIn'
expect_test "POST /users và PUT /users/me/password vẫn đòi CSRF và đăng nhập" 'lab.s06.S06CreateUserTest#endpointsStillNeedCsrfAndLogin'
expect_test "username đã có → 409, user cũ không bị ghi đè" 'lab.s06.S06CreateUserTest#duplicateUsernameIs409'
expect_test "mật khẩu lưu đã qua PasswordEncoder" 'lab.s06.S06CreateUserTest#storedPasswordIsEncoded'
expect_test "đổi mật khẩu: mật khẩu cũ → 401, mật khẩu mới → 200" 'lab.s06.S06ChangePasswordTest#oldPasswordRejectedAfterChange'
expect_test "sai mật khẩu cũ → bị từ chối, không đổi gì" 'lab.s06.S06ChangePasswordTest#wrongOldPasswordChangesNothing'
expect_test "answers/s06.env: DDL_FILE, DEFAULT_TABLES, USERS_COLUMNS" 'lab.s06.S06AnswersTest#defaultSchema'
expect_test "answers/s06.env: NO_AUTHORITY_EXCEPTION, LOCKED_AFTER_RELOAD" 'lab.s06.S06AnswersTest#whatTheDefaultSchemaLoses'
expect_test "answers/s06.env: REAUTH_SETTER" 'lab.s06.S06AnswersTest#reauthSetter'
assert_summary
