# s08 — crypto module: mã hoá địa chỉ giao hàng của đơn khi lưu, giải mã cho người đặt khi đọc.
# Một lần Maven cho test của buổi, rồi mỗi kiểm tra một dòng. Test ở order/src/test/java/lab/s08/.
lab_mvn -q -pl order -am test -Dtest='lab.s08.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "người đặt đọc được đúng địa chỉ (POST và GET /orders), user khác không thấy" 'lab.s08.S08EncryptedFieldTest#ownerSeesPlaintextOthersDoNot'
expect_test "cột orders.delivery_address không chứa bản rõ (kể cả dạng hex, Base64)" 'lab.s08.S08EncryptedFieldTest#storedValueIsNotPlaintext'
expect_test "cột orders.delivery_address giải mã được bằng khoá app.data-key (AES-GCM)" 'lab.s08.S08EncryptedFieldTest#storedValueDecryptsWithConfiguredKey'
expect_test "cùng một địa chỉ mã hoá hai lần → hai bản mã khác nhau" 'lab.s08.S08EncryptedFieldTest#sameAddressTwiceGivesDifferentCiphertext'
expect_test "app.data-key thiếu hoặc sai → order không khởi động, lỗi nói rõ" 'lab.s08.S08KeyConfigTest#badKeyStopsStartup'
expect_test "answers/s08.env: GCM_OVERHEAD_BYTES, CBC_LENGTH_FOR_16, WITH_PASSWORD_ITERATIONS" 'lab.s08.S08AnswersTest#ciphertextShape'
expect_test "answers/s08.env: DEPRECATED_FACTORIES, DELUX_CLASS, DELUX_DELEGATE" 'lab.s08.S08AnswersTest#deprecatedFactories'
expect_test "answers/s08.env: GCM_TAMPER_EXCEPTION, GCM_TAMPER_CAUSE, CBC_IV_FLIP_RESULT" 'lab.s08.S08AnswersTest#tampering'
assert_summary
