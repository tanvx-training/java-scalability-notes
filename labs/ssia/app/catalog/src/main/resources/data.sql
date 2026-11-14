INSERT INTO products (id, name, price)
SELECT 1, 'Bàn phím cơ', 49.90 WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 1);
INSERT INTO products (id, name, price)
SELECT 2, 'Chuột không dây', 19.90 WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 2);
INSERT INTO products (id, name, price)
SELECT 3, 'Màn hình 27 inch', 229.00 WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 3);
