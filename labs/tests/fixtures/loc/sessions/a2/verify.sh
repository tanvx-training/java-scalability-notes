lab_mvn -q test
expect_test "B có bee" 'lab.a2.A2Test#bee'
assert_summary
