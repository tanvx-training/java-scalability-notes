echo "a1/verify" >> "$TRACE"
expect_ok "a1 verify" test "${FAIL:-}" != "a1/verify"
assert_summary
