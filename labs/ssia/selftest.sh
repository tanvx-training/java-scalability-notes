# Chạy sau lời giải của mỗi buổi trong `./labs/lab selftest ssia`: toàn bộ test còn hiệu lực của
# workspace (test gốc của bốn module + test của mọi buổi đã qua, trừ những test đã retire) phải xanh,
# để chuỗi lời giải tham chiếu không làm hỏng buổi cũ. Thư mục hiện hành là workspace tạm.
# Output của test vào target/surefire-reports/; -Xshare:off bỏ cảnh báo CDS của JVM test
# ("Sharing is only supported for boot loader classes…", do Mockito tự gắn agent).
mvn -q test -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
