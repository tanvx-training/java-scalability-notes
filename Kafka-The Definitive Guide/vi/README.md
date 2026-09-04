# Kafka: The Definitive Guide, 2nd Edition — Bản dịch tiếng Việt

Bản dịch tiếng Việt các chương 2–14 của sách *Kafka: The Definitive Guide, 2nd Edition*
(Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty — O'Reilly), dịch từ các file PDF gốc
nằm ở thư mục cha.

## Mục lục

| Chương | Tiêu đề | File |
|---|---|---|
| 2 | Cài đặt Kafka | [chuong-02-installing-kafka.md](chuong-02-installing-kafka.md) |
| 3 | Kafka Producer: Ghi message vào Kafka | [chuong-03-kafka-producers.md](chuong-03-kafka-producers.md) |
| 4 | Kafka Consumer: Đọc dữ liệu từ Kafka | [chuong-04-kafka-consumers.md](chuong-04-kafka-consumers.md) |
| 5 | Quản trị Apache Kafka bằng lập trình | [chuong-05-managing-kafka-programmatically.md](chuong-05-managing-kafka-programmatically.md) |
| 6 | Cơ chế bên trong Kafka | [chuong-06-kafka-internals.md](chuong-06-kafka-internals.md) |
| 7 | Truyền dữ liệu tin cậy | [chuong-07-reliable-data-delivery.md](chuong-07-reliable-data-delivery.md) |
| 8 | Ngữ nghĩa Exactly-Once | [chuong-08-exactly-once-semantics.md](chuong-08-exactly-once-semantics.md) |
| 9 | Xây dựng data pipeline | [chuong-09-building-data-pipelines.md](chuong-09-building-data-pipelines.md) |
| 10 | Mirroring dữ liệu liên cluster | [chuong-10-cross-cluster-data-mirroring.md](chuong-10-cross-cluster-data-mirroring.md) |
| 11 | Bảo mật Kafka | [chuong-11-securing-kafka.md](chuong-11-securing-kafka.md) |
| 12 | Quản trị vận hành Kafka | [chuong-12-administering-kafka.md](chuong-12-administering-kafka.md) |
| 13 | Giám sát Kafka | [chuong-13-monitoring-kafka.md](chuong-13-monitoring-kafka.md) |
| 14 | Xử lý luồng (Stream Processing) | [chuong-14-stream-processing.md](chuong-14-stream-processing.md) |

## Quy ước dịch

- **Thuật ngữ chuyên ngành giữ nguyên tiếng Anh**: broker, topic, partition, offset, replica,
  ISR, consumer group, rebalance, serializer, exactly-once semantics, log compaction,
  MirrorMaker, Kafka Streams, ACL, SASL... Lần đầu xuất hiện có thể kèm chú thích ngắn trong ngoặc.
- **Code, output lệnh, file cấu hình, chuỗi JMX MBean**: giữ nguyên văn 100%, không dịch, không chỉnh sửa.
- **Tên tham số cấu hình, class, method, đường dẫn**: giữ nguyên, bọc trong backtick.
- **Note / Tip / Warning / sidebar**: chuyển thành blockquote (`> **Lưu ý**`, `> **Mẹo**`, `> **Cảnh báo**`).
- **Hình**: ảnh gốc được trích trực tiếp từ PDF (`pdfimages`) và lưu trong `images/` theo tên
  `hinh-<chương>-<số>.png`, nhúng ngay trên dòng caption `**Hình 2-1. ...**`. Tổng cộng 47 hình.
- **Bảng**: tái tạo thành bảng Markdown chuẩn.

## Hình ảnh

Thư mục `images/` chứa 47 hình trích từ PDF gốc:
chương 2 (2), 3 (3), 4 (9), 6 (7), 8 (4), 10 (7), 11 (2), 14 (13).
Các chương 5, 7, 9, 12, 13 không có hình trong bản gốc.

## Lưu ý về khiếm khuyết của nguồn

Một số dòng code/output bị cắt cụt ngay trong chính PDF gốc (do code block trong ebook là vùng
cuộn ngang, phần tràn lề không nằm trong nội dung file). Những chỗ này được giữ nguyên đúng như
bản gốc thay vì suy đoán phần thiếu. Các trường hợp đã ghi nhận:

- Chương 3: lệnh `kafka-configs ... --add-config 'producer_byte_` (mục Quota).
- Chương 4: dòng `throw new SerializationException("Error when deserializing " +` trong `CustomerDeserializer`.
- Chương 9: lệnh `echo '{"name":"dump-kafka-config"...` và một số dòng output Elasticsearch.
- Chương 10: lệnh `kafka-consumer-groups.sh ... --reset-offsets --al`.
- Chương 11: ba dòng log ví dụ trong mục Auditing.
- Chương 12: một vài dòng output (`Configs: segment.bytes=1`, `kafka.host2.dom`, `among 1 parti`).
