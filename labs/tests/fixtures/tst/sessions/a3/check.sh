echo "a3/check" >> "$TRACE"
expect_ok "a3 check" test "${FAIL:-}" != "a3/check"
assert_summary
