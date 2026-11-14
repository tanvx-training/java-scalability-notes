# Sự cố st03-sql-init-off: chuẩn bị cho Postgres, một đồng nghiệp tắt việc Spring Boot tự chạy
# schema.sql/data.sql (spring.sql.init.mode: always → never trong application.yml của order).
# Chạy với thư mục hiện hành là workspace (lab đã commit "lab: trước sự cố st03-sql-init-off").
f=order/src/main/resources/application.yml
grep -q '^      mode: always$' "$f" || { echo "lab: không thấy dòng 'mode: always' trong $f" >&2; exit 1; }
sed 's/^      mode: always$/      mode: never   # schema sẽ do công cụ migration quản lý khi lên Postgres/' "$f" > "$f.tmp"
mv "$f.tmp" "$f"
