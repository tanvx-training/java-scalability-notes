# Task 5 — Báo cáo: `webapp/js/data/kafka-roadmap-part2.js` (tuần 7–9, 12 mục)

**Tệp tạo:** `webapp/js/data/kafka-roadmap-part2.js` — `export const kafkaWeeksPart2` (export duy nhất).
Header sao theo Task 3 Step 2, đổi `Phần 1 (Tuần 1–6)` → `Phần 2 (Tuần 7–11)` và tên export.
Mỗi khối tuần giữ đúng thứ tự khoá `id, week, title, goal, practice, resources, items`.

---

## 1. Nghiệm thu — lệnh và output thật

### Step 6 — đếm mục

```
$ node -e "import('./webapp/js/data/kafka-roadmap-part2.js').then(m=>{
  const w=m.kafkaWeeksPart2;
  console.log('tuần:', w.length, '| mục:', w.flatMap(x=>x.items).length);
  console.log(w.map(x=>x.id+':'+x.items.length).join(' '));
})"
tuần: 3 | mục: 12
kf-w7:4 kf-w8:4 kf-w9:4
```

Khớp kỳ vọng chính xác.

### Step 7 — anchor `#/docs/` (bản Task 3 Step 7, đổi tên tệp/export)

```
OK — mọi anchor hợp lệ và cùng lĩnh vực
```

Mọi anchor trong tệp chỉ trỏ `kafka-10`, `kafka-11`, `kafka-12` — không có anchor nào ra ngoài lĩnh vực Kafka.

### Step 7 — độ dài `lesson` và cấu trúc 4 khối (bản Task 3 Step 8)

```
kf-w7-1:393 kf-w7-2:389 kf-w7-3:387 kf-w7-4:388 kf-w8-1:367 kf-w8-2:366 kf-w8-3:376 kf-w8-4:380 kf-w9-1:390 kf-w9-2:396 kf-w9-3:397 kf-w9-4:395
OK — mọi lesson trong khung 250-400 từ
OK — mọi lesson đủ 4 khối đúng thứ tự
```

### Step 7 — tiêu đề trích nguyên văn (bản Task 3 Step 9, bảng `map` đổi theo brief)

```js
const map={'kafka-10':'10-cross-cluster-data-mirroring','kafka-11':'11-securing-kafka','kafka-12':'12-administering-kafka'};
```

```
OK — mọi tiêu đề mục trích đúng nguyên văn
```

**Cả bốn dòng `OK` như brief kỳ vọng.**

### Kiểm bổ sung (ngoài brief)

```
$ node -e "... key order / pacing / Bẫy / Tự kiểm tra ..."
key order: id,week,title,goal,practice,resources,items | (×3, cả ba tuần)
kf-w7 mục đọc chậm nhất tuần = 1
kf-w8 mục đọc chậm nhất tuần = 1
kf-w9 mục đọc chậm nhất tuần = 1
kf-w7-1..kf-w9-4 | Bẫy thứ hai: true | ? = 2 | " Và " = 1   (đủ 12/12 mục)
```

Nghĩa là: mỗi **Bẫy** có đúng hai bẫy, bẫy sau mở bằng `Bẫy thứ hai:`; mỗi **Tự kiểm tra**
đúng hai câu hỏi nối bằng ` Và `; cụm nhịp `mục đọc chậm nhất tuần` xuất hiện đúng một lần
mỗi tuần (kf-w7-3, kf-w8-2, kf-w9-3), các mục còn lại dùng biến thể `đọc chậm`,
`đọc chậm nhất`, `đọc kỹ`, `mục nặng nhất`.

### `check-data.mjs`

```
$ node webapp/check-data.mjs | tail -3
41/41 bất biến đạt
Dữ liệu hợp lệ.
```

Như brief nói trước, `check-data.mjs` **chưa** chạm tới tệp này (chưa ai import
`kafkaWeeksPart2` cho tới Task 7) — chạy để xác nhận không làm hỏng dữ liệu hiện có.

---

## 2. Kiểm quy ước tiêu đề (yêu cầu tự kiểm từng chương)

Đã tự soát cả ba chương thay vì suy từ chương hàng xóm:

| Chương | Backtick trong tiêu đề `##`/`###`/`####`? | Có phần tiếng Anh trong ngoặc? |
|---|---|---|
| ch.10 `10-cross-cluster-data-mirroring.md` | **Không** — mọi tiêu đề là chữ thuần (`## MirrorMaker của Apache Kafka`, `### Tinh chỉnh MirrorMaker`) | **Không** (trừ tiêu đề chương `# Chương 10. …(Cross-Cluster Data Mirroring)`) |
| ch.11 `11-securing-kafka.md` | **Không** (`## Security Protocols`, `#### Cấu hình TLS`, `### AclAuthorizer`) | Hỗn hợp: có ở `## Khóa chặt Kafka (Locking Down Kafka)`, `### Mã hóa đầu-cuối (End-to-End Encryption)`, `## Bảo mật ZooKeeper (Securing ZooKeeper)`, `## Bảo mật nền tảng (Securing the Platform)`, `### Cập nhật bảo mật không gây gián đoạn (Security Updates Without Downtime)`, `### Bảo vệ mật khẩu (Password Protection)`; **không** có ở `## Authentication`, `## Encryption`, `## Authorization`, `## Auditing`, `### SSL`, `### SASL`, `### Reauthentication`, `#### SASL/GSSAPI`… |
| ch.12 `12-administering-kafka.md` | **Không** | Hầu hết **có** (`## Thao tác với topic (Topic Operations)`, `### Xóa group (Delete Group)`…); **không** có ở `## Consumer Groups`, `### Console Producer`, `### Console Consumer` |

Kết luận: **cả ba chương của tuần 7–9 viết tiêu đề KHÔNG backtick** (giống ch.2/5/7,
khác ch.3/4). Mọi tiêu đề trích trong khối **Đọc** được chép nguyên văn, giữ nguyên
phần tiếng Anh trong ngoặc ở đúng những tiêu đề có nó, và không thêm backtick vào tiêu đề nào.
Lệnh Step 9 xác nhận 0 lệch.

**Lưu ý kỹ thuật cho reviewer:** lệnh Step 9 chỉ nạp tiêu đề mức `##`–`####`. Chương 11 có
một tầng `#####` (`##### Cấu hình SASL/GSSAPI`, `##### Cân nhắc về bảo mật`,
`##### Cấu hình SASL/PLAIN`, `##### Cấu hình SASL/SCRAM`, `##### Cấu hình SASL/OAUTHBEARER`,
`##### Cấu hình delegation token`). Các mục con này **không được trích thành link**
để tránh báo lệch giả; nội dung của chúng vẫn được dẫn qua tiêu đề cha mức `####`
(`#### SASL/GSSAPI`, `#### SASL/PLAIN`, `#### SASL/SCRAM`, `#### SASL/OAUTHBEARER`,
`#### Delegation token`) — trong `kf-w8-2` khối Đọc dặn rõ "với mỗi cơ chế, đọc phần mở đầu
và phần cân nhắc bảo mật trước, phần cấu hình sau".

---

## 3. Chỗ code bị PDF gốc cắt cụt — xử lý

Ba trong sáu chỗ cắt cụt của bản dịch rơi vào tuần 7–9. Không chỗ nào bị biến thành bài tập,
không chỗ nào bị đoán phần thiếu, không fragment nào được trình bày như kết quả kỳ vọng.

| Chỗ cắt cụt | Nằm ở đâu (thật) | Cảnh báo đặt ở mục nào |
|---|---|---|
| `bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --reset-offsets --al` (ch.10 dòng 177) | ch.10 §"Kiến trúc active-standby" → §"Offset khởi đầu cho ứng dụng sau khi failover" | **`kf-w7-2`** — "lệnh `kafka-consumer-groups.sh` reset offset theo timestamp ở mục này bị bản PDF gốc cắt cụt, nên đừng gõ lại và đừng đoán phần thiếu" |
| Ba dòng log ví dụ (ch.11 dòng 912–913, 919) | ch.11 §"Auditing" | **`kf-w8-4`** — "Ba dòng log ví dụ trong mục này bị bản PDF gốc cắt cụt giữa chừng, nên hãy đọc chúng như minh họa về hình dạng: đừng gõ lại và đừng đoán phần thiếu" |
| `Configs: segment.bytes=1` (ch.12 dòng 89, 155) | ch.12 §"Xem chi tiết thông tin topic" và §"Thêm partition" | **`kf-w9-1`** — "Lưu ý các dòng `Configs:` trong output ví dụ của chương bị bản PDF gốc cắt cụt: đừng lấy chúng làm kết quả kỳ vọng" |
| `kafka.host2.dom` + `among 1 parti` (ch.12 dòng 956, 960–961) | ch.12 §"Quản lý partition (Partition Management)" → §"Kiểm chứng replica (Replica Verification)" | **`kf-w9-3`** — "cả dòng lệnh lẫn dòng output ví dụ ở đây đều bị bản PDF gốc cắt cụt, nên đừng gõ lại và đừng chờ thấy đúng chúng" |

Ngoài ra, ch.12 còn vài khối lệnh bị xuống dòng lạ (`--create` xuống dòng, `--topic <string`
cụt) — phần thực hành tuần 9 và các khối Đọc đều chỉ mô tả *thao tác* (`tạo topic`, `--describe`,
`--alter --partitions`), không bảo người đọc gõ lại nguyên văn một dòng cụ thể nào.

---

## 4. Truy vết **Bẫy** — nguồn từng bẫy

Ký hiệu: **[BQ]** = trích từ blockquote `> **…**` của bản dịch; **[PROSE]** = mục không có
blockquote cảnh báo, dùng câu cảnh báo tường minh trong văn xuôi *cùng mục* (đúng như
điều khoản dự phòng của brief).

> **Ghi chú quan trọng cho cả tuần 7:** chương 10 **không có một blockquote cảnh báo nào**.
> Toàn bộ blockquote của ch.10 chỉ gồm hai khung thông tin — `> **KIẾN TRÚC 2.5 DC**` (dòng 215)
> và `> **THÊM VỀ MIRRORMAKER**` (dòng 225) — cả hai đều mô tả, không cảnh báo. Vì vậy **cả 8
> bẫy của tuần 7 đều là [PROSE]**, mỗi bẫy lấy từ một câu cảnh báo tường minh trong đúng mục
> mà khối Đọc của item đó dẫn tới.

### Tuần 7 — ch.10

| Mục | Bẫy | Nguồn |
|---|---|---|
| `kf-w7-1` | Rải broker một cluster ra hai datacenter | **[PROSE]** ch.10 §"Một số thực tế của giao tiếp xuyên datacenter" — "…**không khuyến nghị** (ngoại trừ một số trường hợp cụ thể…) việc cài đặt một số broker Kafka trong một datacenter và một số broker khác trong datacenter khác." |
| `kf-w7-1` | Bẫy thứ hai: mỗi ứng dụng tự đọc qua WAN | **[PROSE]** cùng mục — "vì băng thông bị giới hạn, nếu có nhiều ứng dụng… **chúng tôi thích cài đặt một cluster Kafka tại mỗi datacenter và mirror dữ liệu cần thiết giữa chúng một lần duy nhất**, hơn là để nhiều ứng dụng cùng consume cùng một dữ liệu qua WAN." |
| `kf-w7-2` | Mirror `__consumer_offsets` rồi tin offset khớp | **[PROSE]** ch.10 §"Offset khởi đầu cho ứng dụng sau khi failover" → "Replicate topic offsets" — "…offset đầu tiên khả dụng trong cluster chính có thể là offset 57.000.000…, nhưng offset đầu tiên trong cluster DR sẽ là 0. Vì vậy, một consumer cố đọc offset 57.000.003… **sẽ thất bại**." + "các lần retry của producer vẫn có thể khiến offset lệch nhau." |
| `kf-w7-2` | Bẫy thứ hai: cluster DR nhỏ hơn production | **[PROSE]** ch.10 §"Kiến trúc active-standby" — "Nhưng đây là **một quyết định rủi ro** vì bạn không thể chắc chắn rằng cluster kích thước tối thiểu này sẽ trụ vững trong trường hợp khẩn cấp." |
| `kf-w7-3` | Đặt MirrorMaker ở datacenter nguồn | **[PROSE]** ch.10 §"Triển khai MirrorMaker trong production" — "**Nếu có thể, hãy chạy MirrorMaker tại datacenter đích**… nếu các event đã được consume và MirrorMaker không thể produce chúng do network partition, thì **luôn có rủi ro là những event này bị MirrorMaker vô tình làm mất**." |
| `kf-w7-3` | Bẫy thứ hai: tin vào giám sát lag | **[PROSE]** cùng mục, "Giám sát lag" — "**nếu MirrorMaker bỏ qua hoặc làm rơi message, thì không cách nào trong hai cách trên phát hiện được vấn đề**, vì chúng chỉ theo dõi offset mới nhất." |
| `kf-w7-4` | Chọn uReplicator | **[PROSE]** ch.10 §"Uber uReplicator" — "**Sự phụ thuộc của uReplicator vào Apache Helix đưa vào một thành phần mới cần học và quản lý, làm tăng độ phức tạp cho mọi lần triển khai.**… MirrorMaker 2.0 giải quyết được nhiều vấn đề… mà không cần bất kỳ phụ thuộc bên ngoài nào." |
| `kf-w7-4` | Bẫy thứ hai: coi Replicator ≡ MirrorMaker | **[PROSE]** ch.10 §"Các giải pháp mirroring xuyên datacenter của Confluent" — "MirrorMaker hỗ trợ di chuyển ACL và offset translation cho mọi client, nhưng **Replicator không di chuyển ACL và chỉ hỗ trợ offset translation (dùng timestamp interceptor) cho các client Java**." |

### Tuần 8 — ch.11

| Mục | Bẫy | Nguồn |
|---|---|---|
| `kf-w8-1` | Chọn SASL_PLAINTEXT tưởng là bảo mật | **[PROSE]** ch.11 §"Security Protocols" — "**SASL_PLAINTEXT**… **Không hỗ trợ mã hóa, do đó chỉ phù hợp để dùng trong mạng riêng.**" (mục này chỉ có blockquote thông tin `> **TLS/SSL**`, không có blockquote cảnh báo) |
| `kf-w8-1` | Bẫy thứ hai: listener inter-broker thiếu tuỳ chọn phía client | **[PROSE]** cùng mục — "**Cả tùy chọn cấu hình phía server lẫn phía client đều phải được cung cấp trong cấu hình broker** cho security protocol dùng cho giao tiếp inter-broker. Lý do là các broker cần thiết lập kết nối client cho listener đó." |
| `kf-w8-2` | Tắt kiểm chứng hostname | **[BQ]** ch.11 §"Cấu hình TLS" — `> **KIỂM CHỨNG HOSTNAME CỦA SERVER (SERVER HOSTNAME VERIFICATION)**` — "Kiểm chứng hostname là một phần thiết yếu của server authentication, giúp chống lại các cuộc tấn công man-in-the-middle, **do đó không nên tắt nó trong các hệ thống production**." |
| `kf-w8-2` | Bẫy thứ hai: `ssl.client.auth=requested` | **[BQ]** cùng mục — `> **SSL CLIENT AUTHENTICATION**` — "các client không được cấu hình key store **vẫn sẽ hoàn tất TLS handshake, nhưng sẽ được gán principal `User:ANONYMOUS`**." |
| `kf-w8-3` | Bật nén trong Kafka cho message đã mã hoá | **[BQ]** ch.11 §"Mã hóa đầu-cuối (End-to-End Encryption)" — `> **NÉN CÁC MESSAGE ĐÃ MÃ HÓA (COMPRESSION OF ENCRYPTED MESSAGES)**` — "**tốt hơn là tắt nén trong Kafka vì nó tạo thêm overhead mà không mang lại lợi ích bổ sung nào**." |
| `kf-w8-3` | Bẫy thứ hai: `allow.everyone.if.no.acl.found=true` | **[PROSE]** ch.11 §"AclAuthorizer" — "**không phù hợp để dùng trong production vì quyền truy cập có thể vô tình được cấp cho các tài nguyên mới. Quyền truy cập cũng có thể bị gỡ bỏ ngoài dự kiến khi thêm ACL cho một tiền tố hoặc wildcard khớp**, vì điều kiện `no.acl.found` không còn đúng nữa." |
| `kf-w8-4` | SASL/DIGEST-MD5 cho ZooKeeper | **[PROSE]** ch.11 §"Bảo mật ZooKeeper (Securing ZooKeeper)" — "Lưu ý rằng **SASL/DIGEST-MD5 chỉ nên được dùng kèm mã hóa TLS và không phù hợp để dùng trong production do có những lỗ hổng bảo mật đã biết.**" (mục §"Auditing" tự nó **không có** blockquote cảnh báo nào — xem ghi chú dưới) |
| `kf-w8-4` | Bẫy thứ hai: principal Kerberos đầy đủ cho ZooKeeper | **[BQ]** ch.11 §"Bảo mật ZooKeeper (Securing ZooKeeper)" → §"SASL" — `> **PRINCIPAL CỦA BROKER (BROKER PRINCIPAL)**` — "Khi ACL được bật cho authorization của ZooKeeper, các ZooKeeper server **nên được cấu hình với `kerberos.removeHostFromPrincipal=true` và `kerberos.removeRealmFromPrincipal=true`** để bảo đảm tất cả broker đều có cùng một principal." |

**Ghi chú §"Auditing" (ch.11):** mục này **không chứa blockquote cảnh báo nào**, và cũng không
có câu văn xuôi mang tính cảnh báo. Vì `kf-w8-4` gộp ba mục (`Auditing` + `Bảo mật ZooKeeper` +
`Bảo mật nền tảng`), cả hai bẫy được lấy từ hai mục còn lại trong cùng item. §"Auditing"
vẫn được phủ đầy đủ trong khối **Đọc** (hai logger, nhịp mức log `INFO`/`DEBUG`/`TRACE`)
và trong câu hỏi **Tự kiểm tra** thứ nhất.

### Tuần 9 — ch.12

| Mục | Bẫy | Nguồn |
|---|---|---|
| `kf-w9-1` | Thêm partition vào topic có key | **[BQ]** ch.12 §"Thêm partition (Adding Partitions)" — `> **Điều chỉnh các topic có key (Adjusting keyed topics)**` — "ánh xạ từ key sang partition sẽ thay đổi khi số lượng partition thay đổi. Vì vậy, **nên đặt số lượng partition… một lần duy nhất, ngay khi topic được tạo, và tránh thay đổi kích thước của topic về sau**." |
| `kf-w9-1` | Bẫy thứ hai: `--if-exists` với `--alter` | **[BQ]** ch.12 §"Tạo một topic mới (Creating a New Topic)" — `> **Sử dụng đúng cách các tham số if-exists và if-not-exists**` — "**việc sử dụng nó không được khuyến nghị**… Điều đó có thể **che giấu các vấn đề** trong trường hợp một topic đáng lẽ phải được tạo nhưng lại không tồn tại." |
| `kf-w9-2` | Import offset khi group đang chạy | **[BQ]** ch.12 §"Nhập offset (Import offsets)" — `> **Dừng consumer trước (Stop consumers first)**` — "**Chúng sẽ không đọc các offset mới nếu những offset đó được ghi trong lúc consumer group đang hoạt động. Các consumer sẽ chỉ ghi đè lên những offset đã được import.**" |
| `kf-w9-2` | Bẫy thứ hai: quota 10 MBps không phải trần thật | **[BQ]** ch.12 §"Ghi đè cấu hình mặc định của client và user…" — `> **Hành vi throttling không đồng đều trong các cluster mất cân bằng…**` — "client đó sẽ được phép produce 10 MBps trên mỗi broker cùng lúc, **tổng cộng là 50 MBps**… Tuy nhiên, nếu leadership của mọi partition đều nằm trên broker 1, thì cũng producer đó **chỉ có thể produce tối đa 10 MBps**." |
| `kf-w9-3` | `--execute` không kèm `--throttle` | **[PROSE]** ch.12 §"Thay đổi replica của một partition…" → mô tả `--throttle` — "**Việc gán lại partition có ảnh hưởng lớn tới hiệu năng của cluster, vì chúng sẽ gây ra thay đổi trong tính nhất quán của memory page cache và sử dụng I/O mạng lẫn đĩa.**… Tùy chọn này có thể được kết hợp với cờ `--additional`…" |
| `kf-w9-3` | Bẫy thứ hai: bọc console consumer trong ứng dụng | **[BQ]** ch.12 §"Produce và consume (Producing and Consuming)" — `> **Chuyển hướng output sang một ứng dụng khác…**` — "**loại ứng dụng này khá mong manh và nên tránh. Rất khó để tương tác với console consumer theo cách không làm mất message.**" |
| `kf-w9-4` | Sửa metadata thẳng trong ZooKeeper | **[BQ]** ch.12 §"Các thao tác không an toàn (Unsafe Operations)" — `> **Nguy hiểm: vùng đất của rồng (Danger: here be dragons)**` — "Đây có thể là một thao tác **rất nguy hiểm**, nên bạn phải hết sức cẩn thận để **không sửa đổi trực tiếp thông tin trong ZooKeeper, ngoại trừ những trường hợp được nêu rõ**." |
| `kf-w9-4` | Bẫy thứ hai: xóa topic thủ công khi cluster online | **[BQ]** ch.12 §"Xóa topic một cách thủ công (Deleting Topics Manually)" — `> **Tắt các broker trước (Shut down brokers first)**` — "**Đừng bao giờ cố gắng xóa hoặc sửa đổi metadata của topic trong ZooKeeper khi cluster đang online.**" |

**Tổng kết nguồn Bẫy:** 24 bẫy / 12 mục — 10 **[BQ]**, 14 **[PROSE]**.
Toàn bộ 8 bẫy [PROSE] của tuần 7 là bắt buộc vì ch.10 không có blockquote cảnh báo nào;
4 bẫy [PROSE] còn lại (`kf-w8-1` ×2, `kf-w8-3` ×1, `kf-w9-3` ×1) nằm ở mục không có
blockquote cảnh báo tương ứng. **Không bẫy nào là bịa.**

---

## 5. Lệch giữa brief và nguồn — cần biết

### 5.1 Chỗ cắt cụt của ch.10 nằm ở `kf-w7-2`, không phải `kf-w7-3` (đã xử lý)

Brief ghi: *"**Cảnh báo cho `kf-w7-3`:** mục này chứa lệnh bị cắt cụt
(`kafka-consumer-groups.sh ... --reset-offsets --al`)."*

Thực tế trong `kafka-vi/10-cross-cluster-data-mirroring.md` **dòng 177**, lệnh đó nằm trong
`### Kiến trúc active-standby` → `#### Offset khởi đầu cho ứng dụng sau khi failover` →
mục con **"Failover dựa trên thời gian"** — tức thuộc `## Các kiến trúc multicluster`
(phạm vi của **`kf-w7-2`**), **không** thuộc `## MirrorMaker của Apache Kafka`
(phạm vi của `kf-w7-3`). Mục §"MirrorMaker của Apache Kafka" không chứa lệnh cắt cụt nào.

**Xử lý:** cảnh báo được đặt ở **`kf-w7-2`** — nơi người đọc thực sự gặp dòng lệnh đó — thay
vì `kf-w7-3`, để lời dặn có tác dụng. Ý định của brief (đừng lấy nó làm bài tập gõ lại) được
giữ nguyên vẹn. Không có gì bị mất; chỉ đổi chỗ đặt.

### 5.2 `kf-w7-1` đọc thêm §"Một số thực tế của giao tiếp xuyên datacenter"

Bảng brief giao `kf-w7-1` = ch.10 §"Các tình huống sử dụng của mirroring liên cluster".
Mục đó là năm gạch đầu dòng liệt kê tình huống và **không chứa câu cảnh báo nào** —
không thể rút ra một khối **Bẫy** trung thực từ riêng nó.

Khối **Đọc** của `kf-w7-1` vì thế mở rộng sang §"Các kiến trúc multicluster" (đoạn dẫn nhập)
và §"Một số thực tế của giao tiếp xuyên datacenter" — mục kề ngay sau, chứa đúng ba ràng buộc
mạng mà `**Mục tiêu.**` của item hứa, và chứa hai câu cảnh báo tường minh làm nguồn cho hai bẫy.
`kf-w7-2` vẫn phủ trọn ba kiến trúc + stretch cluster của §"Các kiến trúc multicluster";
hai item không giẫm nội dung lên nhau.

### 5.3 Lỗi chính tả trong bản dịch ch.12 (không sửa, chỉ ghi nhận)

- Dòng 88: `# kafka-topics.sh --boostrap-server …` — thiếu chữ `t` (`boostrap`). Bản dịch giữ
  nguyên lỗi OCR/PDF gốc. Khối Đọc của `kf-w9-1` không bảo gõ lại dòng này.
- Dòng 11 và 433: văn bản gọi công cụ là `kafka-config.sh` (thiếu `s`) trong khi mọi khối lệnh
  dùng đúng `kafka-configs.sh`. Tệp roadmap dùng dạng đúng `kafka-configs.sh`.
- Dòng 473: `Công cụ \`kakfa-console-producer.sh\`` — đảo chữ. Tệp roadmap không trích tên này.

Cả ba đều là lỗi của bản dịch/PDF gốc, nằm ngoài phạm vi Task 5; ghi lại để Task sau
(hoặc một fix round riêng cho `kafka-vi/`) quyết định có chỉnh không.

---

## 6. Bám giọng phần 1 — các dấu vân tay đã giữ

- **Bẫy** hai bẫy, bẫy sau mở bằng `Bẫy thứ hai:` — 12/12 mục (kiểm bằng script).
- **Tự kiểm tra** đúng hai câu hỏi nối bằng ` Và ` — 12/12 mục (kiểm bằng script).
- **Đọc** giữ ngữ vực điều hướng: `đọc lướt`, `đọc kỹ`, `đọc chậm`, `gõ lại`, `chạy thật`
  xuất hiện xuyên suốt (ví dụ: "chạy thật cả chuỗi `keytool`", "gõ lại khối bốn dòng
  `clusters = NYC, LON`", "đọc lướt ba nhóm", "Chép ra giấy ba nguyên tắc cuối mục").
- Cụm nhịp `mục đọc chậm nhất tuần` đúng **một lần mỗi tuần**: `kf-w7-3`
  (§Triển khai MirrorMaker trong production), `kf-w8-2` (§Cấu hình TLS),
  `kf-w9-3` (§Thay đổi replica của một partition). Các mục còn lại dùng biến thể.
- Nối chéo tuần như phần 1 vẫn làm: `kf-w9-4` trỏ ngược `kafka-acls.sh` → tuần 8 và
  `kafka-mirror-maker.sh` → tuần 7; `kf-w7-3` nhắc Kafka Connect từ tuần 6.
- Tiếng Việt, thuật ngữ tiếng Anh giữ nguyên ở đúng chỗ bản dịch giữ.

## 7. Điều Task 6/7 cần biết

- `export const kafkaWeeksPart2` là **export duy nhất** của tệp; Task 6 nối tuần 10–11 vào
  **cùng mảng** (kết thúc ở 20 mục), Task 7 import đúng tên này.
- Tệp chưa được ai import → chưa xuất hiện trong `webapp/check-data.mjs`
  (`EXPECTED.counts` của lĩnh vực `kafka` sẽ phải cập nhật ở Task 7, không phải ở đây).
