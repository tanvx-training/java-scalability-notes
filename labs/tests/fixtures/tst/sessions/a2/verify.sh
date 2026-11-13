echo "a2/verify" >> "$TRACE"
expect_ok "a2 verify" test "${FAIL:-}" != "a2/verify"
assert_summary
