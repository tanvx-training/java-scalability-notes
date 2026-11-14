-- Dữ liệu mẫu của shop_users (s05). Spring Boot chạy tệp này mỗi lần context khởi động; với H2
-- trong bộ nhớ (DB_CLOSE_DELAY=-1) nhiều context test trong cùng một JVM dùng chung một DB, nên
-- lần chạy sau gặp trùng khoá — continue-on-error: true trong application.yml bỏ qua lỗi đó.
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('john', '{noop}12345', TRUE, FALSE);
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('mary', '{noop}67890', TRUE, FALSE);
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('bill', '{noop}12345', TRUE, TRUE);
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'john';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'mary';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'write' FROM shop_users WHERE username = 'mary';
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'bill';
-- s07: dave đến từ hệ thống cũ — mật khẩu 54321 lưu dạng SHA-256 hex, không salt, không tiền tố {id}.
INSERT INTO shop_users (username, password, enabled, locked) VALUES ('dave', '20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a', TRUE, FALSE);
INSERT INTO shop_user_authorities (user_id, authority) SELECT id, 'read' FROM shop_users WHERE username = 'dave';
