# s05 — UserDetailsService tự viết đọc user của order từ bảng shop_users (H2).
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s05/.
lab_mvn -q -pl order -am test -Dtest='lab.s05.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "user chèn vào shop_users đăng nhập được ngay, xoá đi thì 401" 'lab.s05.S05DbUsersTest#newDbUserLogsInDeletedUserCannot'
expect_test "john, mary đến từ shop_users: đổi hoặc xoá trong DB có hiệu lực ngay" 'lab.s05.S05DbUsersTest#seededUsersComeFromDb'
expect_test "dữ liệu mẫu: john, mary mở; bill bị khoá" 'lab.s05.S05DbUsersTest#seedDataInTable'
expect_test "user bị khoá đúng mật khẩu → 401 (LockedException)" 'lab.s05.S05AccountStatusTest#lockedUserRejected'
expect_test "user bị vô hiệu đúng mật khẩu → 401 (DisabledException)" 'lab.s05.S05AccountStatusTest#disabledUserRejected'
expect_test "answers/s05.env: NOT_FOUND_EXCEPTION, NOT_FOUND_CAUSE" 'lab.s05.S05AnswersTest#notFound'
expect_test "answers/s05.env: HIDE_FLAG, HIDE_FLAG_DECLARED_IN" 'lab.s05.S05AnswersTest#hideFlag'
expect_test "answers/s05.env: LOCKED_EXCEPTION, LOCKED_PARENT, LOCKED_WRONG_PASSWORD" 'lab.s05.S05AnswersTest#locked'
assert_summary
