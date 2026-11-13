# In giá trị khai BỀN (áp lúc khởi động) của ba sysctl mạng, theo đúng thứ tự systemd-sysctl áp các tệp:
# `systemd-analyze cat-config sysctl.d` in mọi tệp theo thứ tự đó (kể cả /etc/sysctl.conf qua 99-sysctl.conf);
# lấy phép gán cuối cùng của từng khoá. Khoá không được khai thì in "-". Chỉ đọc.
systemd-analyze cat-config sysctl.d 2>/dev/null | awk '
  /^[[:space:]]*[#;]/ { next }
  /=/ { k=$0; sub(/=.*/, "", k); gsub(/[[:space:]]/, "", k); sub(/^-/, "", k); gsub(/\//, ".", k)
        v=$0; sub(/^[^=]*=/, "", v); gsub(/[[:space:]]/, "", v); val[k]=v }
  END { n=split("net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.ipv4.ip_forward", ks, " ")
        out=""; for (i=1;i<=n;i++) out = out (i>1?" ":"") ((ks[i] in val) ? val[ks[i]] : "-"); print out }'
