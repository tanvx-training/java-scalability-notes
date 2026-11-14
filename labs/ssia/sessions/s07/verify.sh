# s07 — băm mật khẩu: DelegatingPasswordEncoder, băm kiểu cũ và băm lại khi đăng nhập.
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s07/.
lab_mvn -q -pl order -am test -Dtest='lab.s07.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "user băm SHA-256 kiểu cũ (không tiền tố) đăng nhập được, sau đó cột password là {bcrypt}" 'lab.s07.S07UpgradeTest#legacySha256UserLogsInAndIsRehashed'
expect_test "user {noop} được băm lại một lần, lần sau không ghi nữa" 'lab.s07.S07UpgradeTest#noopUserIsRehashedOnceThenLeftAlone'
expect_test "mật khẩu sai (kể cả gõ chuỗi băm cũ) → 401, cột password không đổi" 'lab.s07.S07UpgradeTest#wrongPasswordRejectedAndNothingRewritten'
expect_test "dữ liệu mẫu: dave (SHA-256 của 54321) đăng nhập được và được băm lại" 'lab.s07.S07UpgradeTest#seededLegacyUserDave'
expect_test "answers/s07.env: ENCODE_ID, ENCODER_IDS" 'lab.s07.S07AnswersTest#encoderIds'
expect_test "answers/s07.env: DEPRECATED_ENCODERS" 'lab.s07.S07AnswersTest#deprecatedEncoders'
expect_test "answers/s07.env: MATCHER_NOOP, MATCHER_BCRYPT, MATCHER_UNPREFIXED, MATCHER_SHA256_PREFIXED, SCRYPT_ERROR" 'lab.s07.S07AnswersTest#whichEncoderMatches'
expect_test "answers/s07.env: UPGRADE_CALLER, PASSWORD_SERVICE_BEAN" 'lab.s07.S07AnswersTest#whoRehashes'
assert_summary
