echo "a3/verify" >> "$TRACE"
expect_ok "a3 verify" test "${FAIL:-}" != "a3/verify"
assert_summary
