lab_mvn -q test
expect_test "A có hello" 'lab.a1.A1Test#greets'
expect_test "A có world" 'lab.a1.A1Test$Nested#deep'
assert_summary
