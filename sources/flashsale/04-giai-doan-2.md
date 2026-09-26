# Giai đoạn 2 — Chịu tải flash sale (tài liệu chi tiết)

Bốn tuần này đưa hệ thống từ đúng ở 100 request đồng thời lên đúng và nhanh ở 2.500 request/giây; mọi thay đổi phải có số đo trước và sau, không có số thì không merge.

## 1. Mục tiêu, phạm vi và Definition of Done

Giai đoạn 2 kết thúc khi kịch bản k6 spike 10.000 người trong 60 giây đạt p99 đặt hàng dưới 300 ms, 0 oversell, và `docs/perf/report.md` giải thích được từng bước cải thiện bằng số.

**Mục tiêu**

- Đạt NFR-01 và NFR-02 (2.500 request/giây đỉnh, p99 đặt hàng < 300 ms, p99 đọc đợt < 100 ms) trong môi trường đo cố định ở mục 3.1.
- Giữ NFR-03: 0 oversell, 0 double-charge, kể cả khi Redis và PostgreSQL lệch nhau tạm thời.
- Biết cách tìm nút thắt bằng profiling thay vì đoán; mỗi thay đổi kiến trúc có flame graph hoặc số đo đi kèm.
- Chặn 3 abuse case của giai đoạn này (AC-01 bot mua gom, AC-06 dùng token người khác, AC-07 làm chậm hệ thống) và có nhật ký tấn công thứ hai.
- Ra hai ADR có số liệu: trừ kho trên Redis và virtual threads.

**Trong phạm vi:** k6, JFR, async-profiler, JMH; Redis cho tồn kho nóng, token hàng chờ, cache, rate limit; virtual threads; giới hạn body và timeout; Redis ACL và TLS local; job đối chiếu Redis với PostgreSQL.

**Ngoài phạm vi:** Kafka, outbox, tách service (3); Kubernetes, HPA, OpenTelemetry đầy đủ (4); CDN, WAF, chống DDoS tầng mạng (ghi nhận ở rủi ro chấp nhận); proof-of-work hoặc CAPTCHA làm thật (chỉ để chỗ cắm).

**Definition of Done (đủ mới gắn tag `v2-perf`)**

- [ ] `docs/perf/baseline-v1.md` có số đo của tag `v1-monolith` trên đúng môi trường đo ở mục 3.1 (đo lại, không dùng số của giai đoạn 1).
- [ ] `docs/perf/report.md` có bảng p50/p95/p99, RPS, error rate cho ít nhất 5 mốc: v1, sau Redis Lua, sau rate limit và token, sau virtual threads, sau cache đọc; mỗi mốc kèm commit và flame graph.
- [ ] Kịch bản k6 spike đạt: p99 đặt hàng < 300 ms, p99 đọc đợt < 100 ms, tỷ lệ 5xx < 0,1%, 429 chỉ xuất hiện với client vượt giới hạn.
- [ ] Script `verify-no-oversell` chạy sau mỗi lần k6: số đơn không CANCELLED ≤ tồn kho ban đầu; Redis stock + số đơn đã giữ = tồn kho ban đầu; không có 2 payment SUCCESS cho một đơn.
- [ ] Job đối chiếu Redis và PostgreSQL chạy mỗi phút, có metric `inventory.drift` và test ép lệch rồi tự sửa.
- [ ] Token hàng chờ: 1 token/user/đợt, TTL 60 giây, dùng một lần; test dùng lại và test token của user khác đều bị từ chối.
- [ ] Rate limit theo user và theo IP, 429 kèm `Retry-After`; test bypass qua `X-Forwarded-For` thất bại.
- [ ] Thí nghiệm virtual threads có bảng so sánh 3 cấu hình và kết luận ghi thành ADR-004.
- [ ] `docs/adr/0003-redis-reservation.md` và `0004-virtual-threads.md` ở trạng thái Accepted.
- [ ] `docs/security/attack-log-2.md` có 6 kịch bản; Redis chạy với ACL và mật khẩu riêng cho ứng dụng.
- [ ] Dòng giai đoạn 2 ở tab chính đổi sang Hoàn thành.

## 2. Lịch 4 tuần theo buổi

16 buổi, khoảng 36 giờ; tuần 7 đo và tìm nút thắt, tuần 8 đổi đường ghi sang Redis, tuần 9 chặn lạm dụng và đổi mô hình thread, tuần 10 đường đọc, tấn công và chốt.

| Buổi | Tuần | Việc | Đầu ra |
| --- | --- | --- | --- |
| 1 | 7 | Dựng môi trường đo cố định (Docker resource limit), viết kịch bản k6 spike và script verify-no-oversell | `perf/k6/spike.js`, `perf/verify-no-oversell.sh` |
| 2 | 7 | Đo v1 3 lần, lấy trung vị; ghi baseline; xác nhận hệ thống gãy ở đâu (timeout, 5xx, pool wait) | `docs/perf/baseline-v1.md` |
| 3 | 7 | Profiling v1 dưới tải bằng JFR và async-profiler; đọc flame graph; liệt kê 3 nút thắt theo thứ tự | `docs/perf/flame-v1.html`, mục "Nút thắt" trong report |
| 4 | 7 | Thiết kế luồng đặt hàng mới (mục 5), viết ADR-003 ở trạng thái Proposed với giả thuyết và cách đo | ADR-003 Proposed |
| 5 | 8 | Lua script trừ kho và giới hạn per-user trên Redis; `RedisInventory` với Lettuce; test đơn vị script bằng Testcontainers Redis | Script + test xanh |
| 6 | 8 | Nối vào `Orders.place`: Redis là cổng, PostgreSQL ghi sau; bù trừ khi ghi DB lỗi | Luồng mới chạy, test đồng thời giai đoạn 1 vẫn xanh |
| 7 | 8 | Job đối chiếu Redis và PostgreSQL; metric drift; test ép lệch | `InventoryReconciler` + test |
| 8 | 8 | Đo lại, so với baseline, cập nhật report và ADR-003 sang Accepted | Mốc "sau Redis Lua" trong report |
| 9 | 9 | Token hàng chờ: endpoint cấp token, HMAC, TTL, dùng một lần bằng SETNX; k6 cập nhật để lấy token trước | Token chạy, k6 xanh |
| 10 | 9 | Rate limiting bằng Bucket4j + Redis; cấu hình trust proxy; giới hạn body và timeout | 429 đúng chỗ, test bypass thất bại |
| 11 | 9 | Thí nghiệm thread: Tomcat 200, Tomcat 750, virtual threads; đo 3 lần mỗi cấu hình; kiểm tra pinning | Bảng so sánh, ADR-004 |
| 12 | 9 | JMH cho HMAC verify và SHA-256 request hash; đo lại toàn bộ; mốc "sau rate limit và token", "sau virtual threads" | Report cập nhật |
| 13 | 10 | Cache đọc đợt và sản phẩm trên Redis, chống stampede, `availableApprox`; đo mốc "sau cache đọc" | p99 đọc < 100 ms |
| 14 | 10 | Redis ACL, TLS local, mật khẩu riêng; buổi tấn công 3: dùng lại token, token user khác, bypass rate limit | 3 dòng attack log |
| 15 | 10 | Buổi tấn công 4: single-packet race trên đường Redis, payload lớn, slow client; fix và test hồi quy | 3 dòng attack log |
| 16 | 10 | Chạy đủ kịch bản k6 lần cuối, verify-no-oversell, rà Definition of Done, viết kết luận report, tag | Tag `v2-perf` |

Nếu buổi 2 cho thấy v1 đã đạt p99 < 300 ms trên laptop (có thể xảy ra vì k6 và API chia sẻ CPU), tăng tải lên 20.000 người để hệ thống gãy; mục đích của tuần 7 là nhìn thấy nút thắt, không phải đạt chuẩn.

## 3. Phương pháp đo

Mọi số trong report đều đến từ một môi trường cố định, một kịch bản cố định, chạy 3 lần lấy trung vị; số đo trên môi trường khác chỉ được ghi ở phụ lục.

**3.1. Môi trường đo cố định (`compose.perf.yaml`)**

| Thành phần | Giới hạn | Lý do |
| --- | --- | --- |
| FlashSale API | 2 CPU, 2 GB RAM (`deploy.resources.limits`), `-Xmx1g`, ZGC generational (`-XX:+UseZGC`) | Bằng một pod nhỏ ở giai đoạn 4; giới hạn để nút thắt lộ ra thay vì bị laptop mạnh che đi |
| PostgreSQL | 2 CPU, 2 GB, `shared_buffers=512MB`, `max_connections=100` | Đủ cho dưới 400 ghi/giây theo ước lượng |
| Redis | 1 CPU, 512 MB, `maxmemory-policy noeviction` | Không được evict key tồn kho |
| Keycloak | Không đo; k6 lấy token trước khi bắt đầu tải | Đăng nhập không thuộc NFR |
| k6 | Chạy ngoài Docker, trên cùng laptop, `--vus 10000` với executor `ramping-arrival-rate` | Chấp nhận k6 ăn CPU; nếu có máy thứ hai hoặc VPS, chạy k6 ở đó và ghi rõ trong report |

Trước mỗi lần đo: `docker compose -f compose.perf.yaml down -v && up`, seed một đợt 500 sản phẩm, warm-up 30 giây ở 200 request/giây, rồi mới bắt đầu ghi số.

**3.2. Kịch bản k6 (`perf/k6/spike.js`, trích)**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('tokens', () => JSON.parse(open('./tokens.json'))); // 10.000 JWT lấy sẵn
const SALE = __ENV.SALE_ID;

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 200, timeUnit: '1s',
      preAllocatedVUs: 2000, maxVUs: 10000,
      stages: [
        { target: 200,  duration: '30s' },   // warm-up
        { target: 2500, duration: '10s' },   // dồn lên đỉnh
        { target: 2500, duration: '60s' },   // giữ đỉnh
        { target: 300,  duration: '30s' },   // đuôi: poll trạng thái
      ],
    },
  },
  thresholds: {
    'http_req_duration{name:place}': ['p(99)<300'],
    'http_req_duration{name:sale}':  ['p(99)<100'],
    'http_req_failed{expected:false}': ['rate<0.001'],
  },
};

export default function () {
  const jwt = tokens[__VU % tokens.length];
  const h = { headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' } };

  http.get(`${__ENV.BASE}/api/flash-sales/${SALE}`, { ...h, tags: { name: 'sale' } });

  const tok = http.post(`${__ENV.BASE}/api/flash-sales/${SALE}/token`, null, { ...h, tags: { name: 'token' } });
  if (tok.status !== 201) return;                       // 429 hoặc đã có token: dừng, không retry vô hạn

  const res = http.post(`${__ENV.BASE}/api/orders`,
    JSON.stringify({ flashSaleId: SALE, qty: 1, queueToken: tok.json('token') }),
    { ...h, headers: { ...h.headers, 'Idempotency-Key': crypto.randomUUID() }, tags: { name: 'place' } });

  check(res, { 'place 201 or 409': r => r.status === 201 || r.status === 409 });
  if (res.status === 201) {
    for (let i = 0; i < 3; i++) { sleep(1); http.get(res.headers['Location'], { ...h, tags: { name: 'order' } }); }
  }
}
```

409 `sold-out` là kết quả đúng của 97% request nên không tính là lỗi; chỉ 5xx và timeout tính vào `http_req_failed`. Kịch bản thứ hai `perf/k6/steady.js` giữ 500 request/giây trong 10 phút để đo rò rỉ bộ nhớ và GC.

**3.3. Chỉ số ghi cho mỗi mốc**

| Chỉ số | Nguồn | Ngưỡng đạt |
| --- | --- | --- |
| p50, p95, p99 của `place`, `sale`, `token`, `order` | k6 summary | p99 place < 300 ms, sale < 100 ms |
| RPS đạt được ở đỉnh và số request bị k6 bỏ vì hết VU | k6 `dropped_iterations` | dropped = 0 |
| Tỷ lệ 5xx, timeout | k6 `http_req_failed` | < 0,1% |
| CPU, RAM của API, PostgreSQL, Redis | `docker stats` ghi mỗi giây | Ghi để giải thích, không có ngưỡng |
| GC pause p99, số lần GC | JFR hoặc `-Xlog:gc` | Pause < 10 ms với ZGC |
| HikariCP: `pending`, `acquire` p99 | Actuator `/metrics` | pending = 0 ở đỉnh |
| Redis: `instantaneous_ops_per_sec`, latency | `redis-cli --latency` | p99 < 2 ms |
| Số lần retry optimistic lock (chỉ v1) | Metric `orders.place.retries` | Ghi baseline |

**3.4. Kiểm tra oversell sau mỗi lần đo (`perf/verify-no-oversell.sh`)**

```sql
-- 1. Đơn còn hiệu lực không vượt kho ban đầu
SELECT fs.id, fs.initial_qty, COALESCE(SUM(o.qty), 0) AS reserved
FROM flash_sale fs LEFT JOIN orders o ON o.flash_sale_id = fs.id AND o.status <> 'CANCELLED'
GROUP BY fs.id HAVING COALESCE(SUM(o.qty), 0) > fs.initial_qty;      -- phải rỗng

-- 2. Không đơn nào có 2 payment SUCCESS
SELECT order_id FROM payment WHERE status = 'SUCCESS' GROUP BY order_id HAVING COUNT(*) > 1;   -- phải rỗng

-- 3. Không user nào có 2 đơn còn hiệu lực trong một đợt
SELECT flash_sale_id, user_id FROM orders WHERE status <> 'CANCELLED'
GROUP BY flash_sale_id, user_id HAVING COUNT(*) > 1;               -- phải rỗng
```

Bước 4 của script so `GET sale:{id}:stock` trên Redis với `initial_qty - reserved` trong PostgreSQL; lệch cho phép bằng 0 sau khi job đối chiếu chạy xong.

**3.5. Mẫu `docs/perf/report.md`**

```markdown
# Báo cáo hiệu năng giai đoạn 2

Môi trường: compose.perf.yaml, commit <sha>, ngày <yyyy-mm-dd>, k6 chạy trên <máy>.

| Mốc | Commit | place p50/p95/p99 (ms) | sale p99 | RPS đỉnh | 5xx % | CPU API % | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| v1 baseline | … | … | … | … | … | … | pool wait, 3 nút thắt |
| Sau Redis Lua | … | | | | | | |
| Sau token + rate limit | … | | | | | | |
| Sau virtual threads | … | | | | | | |
| Sau cache đọc | … | | | | | | |

## Nút thắt tìm được và cách xác nhận
## Những gì đã thử mà không có tác dụng
## Kết luận và việc để lại cho giai đoạn 4
```

Mục "đã thử mà không có tác dụng" là bắt buộc; một report chỉ có thành công là report không đáng tin.

## 4. Profiling

Profiling trả lời "CPU và thời gian chờ đang ở đâu"; không sửa gì trước khi có câu trả lời, và sau khi sửa phải profiling lại để chắc nút thắt đã dời chỗ chứ không biến mất vào chỗ khác.

**4.1. Ba công cụ và khi nào dùng**

| Công cụ | Cách bật | Nhìn thấy gì | Dùng ở buổi |
| --- | --- | --- | --- |
| JFR (JDK Flight Recorder) | `-XX:StartFlightRecording=duration=120s,filename=v1.jfr,settings=profile` khi khởi động, hoặc `jcmd <pid> JFR.start` giữa chừng | GC, allocation, lock contention (`Java Monitor Blocked`), socket I/O, thread park, exception thrown; overhead khoảng 1–2% | 3, 8, 12, 13 |
| JDK Mission Control | Mở file `.jfr` | Automated Analysis chỉ ra vấn đề rõ ràng; tab Threads xem thread chờ gì | Cùng JFR |
| async-profiler | `asprof -d 60 -e cpu -f flame-v1.html <pid>`; trong Docker cần `--cap-add SYS_PTRACE` và `perf_event_paranoid` | Flame graph CPU chính xác (không bị safepoint bias), có cả frame native và kernel; `-e wall` để xem thời gian chờ, `-e lock` để xem tranh chấp lock | 3, 11 |

Bật đủ hai: JFR cho GC, lock và I/O; async-profiler cho CPU. Không dùng `jstack` lặp tay để đoán hotspot.

**4.2. Danh sách nút thắt kỳ vọng ở v1 (kiểm chứng ở buổi 3, không mặc định đúng)**

1. Thread pool Tomcat 200 hết chỗ: JFR cho thấy request nằm ở accept queue, latency tăng theo bậc thang; `docker stats` cho CPU API dưới 60%.
2. HikariCP `pending` tăng: 200 thread tranh 20 connection; flame `-e wall` có `HikariPool.getConnection` cao.
3. Optimistic lock trên dòng `inventory`: rất nhiều rollback; `orders.place.retries` cao; PostgreSQL CPU cao vì transaction rollback và dead tuple.
4. Ghi `idempotency_key` cho 16.000 request từ chối: PostgreSQL ghi nhiều hơn cần; đường từ chối không rẻ.
5. Xác minh JWT: nếu `JwtDecoder` gọi JWKS mỗi request (cache bị tắt), flame CPU có `NimbusJwtDecoder` và HTTP client; sửa bằng cache JWKS.

Ghi từng nút thắt vào report với bằng chứng: tên frame trong flame graph hoặc tên event JFR, và con số.

**4.3. Đọc flame graph**

- Trục ngang là tỷ lệ mẫu, không phải thời gian; frame rộng ở trên cùng là nơi CPU đang thật sự tiêu; frame rộng ở dưới chỉ là đường gọi.
- Tìm `epollWait`, `park`, `Object.wait` trong flame `-e wall`: đó là thời gian chờ, không phải CPU; đối chiếu với JFR để biết chờ gì (DB, Redis, lock).
- Frame có tên `Unsafe.park` dưới `HikariPool` là chờ connection; dưới `LettuceConnection` là chờ Redis; dưới `ReentrantLock` trong code mình là bug thiết kế.
- So sánh flame trước và sau bằng chế độ diff của async-profiler (`--diff`), đây là hình dùng trong report và tech talk.

**4.4. GC và bộ nhớ**

- ZGC generational: kỳ vọng pause dưới 1 ms; nếu thấy allocation rate trên 1 GB/giây trong JFR, tìm nguồn allocation (thường là JSON serialization, chuỗi log, `List` tạm) trước khi tăng heap.
- Kịch bản `steady.js` 10 phút: heap sau mỗi GC phải phẳng; nếu tăng dần, lấy heap dump (`jcmd GC.heap_dump`) và mở bằng Eclipse MAT, nghi ngờ đầu tiên là cache trong JVM không có giới hạn.

**4.5. Quy tắc**

- Một thay đổi mỗi lần đo; hai thay đổi cùng lúc thì không biết cái nào có tác dụng.
- Số đo phải lặp lại được: 3 lần chạy chênh nhau trên 15% ở p99 thì môi trường chưa ổn định, sửa môi trường trước.
- Không tối ưu thứ chưa xuất hiện trong flame graph, kể cả khi "ai cũng biết" nó chậm.

## 5. Kiến trúc chịu tải

Nguyên tắc duy nhất của giai đoạn 2: 97% request sẽ bị từ chối, nên đường từ chối phải rẻ (chỉ chạm Redis), còn đường đắt (PostgreSQL) chỉ dành cho 3% đã chắc chắn có hàng.

**5.1. Luồng đặt hàng mới**

&#91;embedded content: luồng đặt hàng giai đoạn 2 · 3 quyết định, 1 đường bù\]

Ba quyết định đầu đều trả lời từ Redis trong dưới 1 ms; chỉ khi Lua script trả "còn" mới mở transaction PostgreSQL. Ghi DB lỗi (hết connection, unique index `already-ordered`, timeout) thì bù lại kho trên Redis bằng `INCRBY` và xóa user khỏi tập đã mua; bù lỗi nữa thì job đối chiếu ở mục 5.4 sửa trong vòng 1 phút.

**5.2. Khóa Redis cho mỗi đợt**

| Key | Kiểu | Nội dung | TTL |
| --- | --- | --- | --- |
| `sale:{id}:stock` | string (số nguyên) | Tồn kho còn lại, khởi tạo từ PostgreSQL lúc admin mở đợt | Đến `ends_at` + 1 giờ |
| `sale:{id}:buyers` | set | `user_id` đã giữ kho thành công, để chặn 2 đơn/user ngay trên Redis | Như trên |
| `sale:{id}:reserved` | hash `user_id → qty` | Để đối chiếu và để bù khi hủy | Như trên |
| `sale:{id}:qtoken:{user}` | string | Token hàng chờ (mục 6.1) | 60 giây |
| `ratelimit:user:{user}` và `ratelimit:ip:{ip}` | Bucket4j | Bucket rate limit (mục 6.2) | Theo bucket |
| `cache:sale:{id}` | string JSON | Cache đọc đợt (mục 8) | 2 giây |

Tất cả key của một đợt dùng cùng hash tag `{sale:<id>}` để sau này chạy được trên Redis Cluster mà không đổi script.

**5.3. Lua script trừ kho (`reserve.lua`)**

```lua
-- KEYS[1] = sale:{id}:stock, KEYS[2] = sale:{id}:buyers, KEYS[3] = sale:{id}:reserved, KEYS[4] = sale:{id}:qtoken:{user}
-- ARGV[1] = user_id, ARGV[2] = qty, ARGV[3] = token được gửi lên
local token = redis.call('GET', KEYS[4])
if not token or token ~= ARGV[3] then return {-1, 'bad-token'} end   -- token sai, hết hạn hoặc đã dùng
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return {-2, 'already-ordered'} end
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
local qty = tonumber(ARGV[2])
if stock < qty then return {-3, 'sold-out'} end
redis.call('DECRBY', KEYS[1], qty)
redis.call('SADD', KEYS[2], ARGV[1])
redis.call('HSET', KEYS[3], ARGV[1], qty)
redis.call('DEL', KEYS[4])                                            -- token dùng một lần
return {stock - qty, 'ok'}
```

Script chạy atomic trên Redis single-thread nên không có race giữa kiểm tra và trừ; nạp bằng `SCRIPT LOAD` lúc khởi động và gọi bằng `EVALSHA`, fallback `EVAL` khi `NOSCRIPT` (Redis khởi động lại). Test script bằng Testcontainers Redis với 100 lần gọi song song từ 100 thread, kho 10.

**5.4. Nhất quán giữa Redis và PostgreSQL**

| Tình huống | Hậu quả nếu không xử lý | Cách xử lý |
| --- | --- | --- |
| Lua "còn" nhưng ghi PostgreSQL lỗi | Kho Redis thấp hơn thực tế, bán thiếu | Bù ngay: `INCRBY stock qty`, `SREM buyers user`, `HDEL reserved user`; ghi metric `inventory.compensation` |
| Bù cũng lỗi (Redis mất kết nối) | Như trên | Job đối chiếu mỗi phút: `stock_redis` phải bằng `initial_qty - SUM(qty của đơn không CANCELLED)`; lệch thì `SET` lại theo PostgreSQL và ghi metric `inventory.drift` |
| Đơn hết hạn hoặc thanh toán lỗi (CANCELLED) | Kho Redis không được hoàn | Listener `OrderCancelled` của `inventory` giờ hoàn cả PostgreSQL lẫn Redis (`INCRBY` + `SREM` + `HDEL`), idempotent nhờ `HDEL` trả 0 khi đã hoàn |
| Redis mất dữ liệu (restart không persistence) | Kho về 0 hoặc về giá trị cũ, bán thừa hoặc thiếu | Bật AOF `appendfsync everysec`; lúc khởi động API kiểm tra key `stock` tồn tại, không thì khởi tạo lại từ PostgreSQL (`SET NX`) |
| Admin đóng đợt | Key Redis còn sống | Job đối chiếu cuối cùng rồi xóa key; PostgreSQL là nguồn sự thật duy nhất sau khi đóng |

PostgreSQL vẫn giữ `CHECK (available >= 0)` và cột `inventory.available` được cập nhật trong cùng transaction ghi đơn (không còn `@Version` tranh chấp vì Redis đã lọc); nếu Redis sai và cho qua nhiều hơn kho, DB từ chối và đường bù chạy. Đây là hai lớp bảo vệ độc lập.

**5.5. ADR-003: Trừ kho trên Redis, PostgreSQL là nguồn sự thật ghi sau**

- Trạng thái: Proposed ở buổi 4, Accepted ở buổi 8 khi có số.
- Bối cảnh: baseline v1 cho thấy PostgreSQL là nút thắt vì 16.000 request đều mở transaction và phần lớn rollback.
- Phương án: (1) giữ PostgreSQL, đổi sang `SELECT FOR UPDATE SKIP LOCKED` và hàng đợi; (2) Redis Lua làm cổng, PostgreSQL ghi sau (chọn); (3) đưa toàn bộ đặt hàng vào queue và xử lý bất đồng bộ (để dành giai đoạn 3 so sánh).
- Hệ quả xấu chấp nhận: hai nguồn dữ liệu cần đối chiếu; Redis thành điểm lỗi đơn cho đường đặt hàng (giai đoạn 4 thêm Sentinel hoặc chấp nhận và ghi vào SAD).
- Cách xác nhận: p99 `place` giảm ít nhất 50% so với baseline, số transaction PostgreSQL mỗi đợt giảm từ \~16.000 xuống \~500, `verify-no-oversell` xanh, metric `inventory.drift` = 0 sau job.

## 6. Token hàng chờ, rate limiting, giới hạn body và timeout

Ba lớp này chặn AC-01, AC-06 và AC-07 và đồng thời giảm tải cho đường đặt hàng: request không có token hợp lệ không bao giờ chạm Lua script.

**6.1. Token hàng chờ (`POST /api/flash-sales/{id}/token`)**

| Thuộc tính | Thiết kế |
| --- | --- |
| Ai được cấp | User đã xác thực, đợt đang OPEN, chưa có đơn còn hiệu lực trong đợt |
| Số lượng | 1 token/user/đợt; gọi lại khi token còn hạn trả về 200 với token cũ, không cấp mới |
| Nội dung | `base64url(saleId.userId.exp.nonce)` + `.` + HMAC-SHA256 với khóa 256-bit trong biến môi trường (xoay khóa ở giai đoạn 4) |
| Lưu ở đâu | `sale:{id}:qtoken:{user}` = token, TTL 60 giây; Lua script so khớp và `DEL` khi dùng |
| Vì sao vừa ký vừa lưu | Chữ ký cho phép từ chối token giả mà không chạm Redis; bản ghi Redis cho phép "dùng một lần" và thu hồi |
| Chống bot ở bước cấp token | Rate limit theo IP chặt hơn (mục 6.2); chỗ cắm `ChallengeVerifier` (mặc định luôn đúng) để giai đoạn sau gắn proof-of-work hoặc Turnstile |

Endpoint trả 201 với `{ token, expiresAt }`; k6 gọi endpoint này trước khi đặt hàng nên số đo `token` cũng nằm trong report.

**6.2. Rate limiting bằng Bucket4j trên Redis**

| Phạm vi | Endpoint | Giới hạn | Lý do |
| --- | --- | --- | --- |
| Theo user (`sub`) | `POST /api/orders`, `POST .../pay` | 5 request / 10 giây | Người thật retry vài lần là đủ; bot bắn hàng trăm lần bị chặn sớm |
| Theo user | `POST .../token` | 3 request / phút | Một token là đủ |
| Theo IP | Mọi `/api/**` | 100 request / 10 giây | Chặn một máy giả nhiều tài khoản; đủ rộng cho NAT văn phòng nhỏ |
| Theo IP | `POST .../token` | 20 request / phút | Bước rẻ nhất để bot lạm dụng |
| Toàn hệ thống | `POST /api/orders` | 3.000 request / giây | Van an toàn trên NFR-01, bảo vệ Redis và DB khi có sự cố |

- Dùng `bucket4j-redis` với Lettuce, thuật toán token bucket; bucket sống trong Redis để nhiều instance ở giai đoạn 4 chia sẻ.
- 429 kèm `Retry-After` (giây) và Problem Details `rate-limited`; k6 coi 429 là kết quả hợp lệ chỉ với client cố ý vượt giới hạn.
- IP lấy từ `X-Forwarded-For` **chỉ khi** request đến từ proxy tin cậy (`server.forward-headers-strategy=framework` + danh sách CIDR proxy); ở giai đoạn 2 không có proxy nên IP là địa chỉ TCP; test bypass ở mục 9 xác nhận header giả không có tác dụng.
- Thứ tự filter: rate limit theo IP → xác thực JWT → rate limit theo user → controller; rate limit IP đứng trước xác thực để token giả cũng bị đếm.

**6.3. Giới hạn body, timeout và kết nối**

| Tham số | Giá trị | Chặn gì |
| --- | --- | --- |
| `server.tomcat.max-http-form-post-size` và `spring.servlet.multipart.max-request-size` | 16 KB | Payload lớn (AC-07) |
| `server.tomcat.connection-timeout` | 5 giây | Slowloris: client mở kết nối rồi không gửi hết header |
| `server.tomcat.keep-alive-timeout` | 15 giây, `max-keep-alive-requests` 100 | Giữ kết nối vô hạn |
| `server.tomcat.max-connections` | 8.000 | Trần kết nối đồng thời, khớp ước lượng 750 request đồng thời × dự phòng |
| `spring.mvc.async.request-timeout` | 3 giây | Request treo trong hệ thống |
| Lettuce `commandTimeout` | 200 ms | Redis chậm không kéo cả API |
| HikariCP `connectionTimeout` | 1 giây, `maximumPoolSize` 20 | Chờ connection vô hạn |
| Payment mock `tok_timeout` | 3 giây (đã có từ giai đoạn 1) | Dùng để test timeout end-to-end |

Mọi timeout đều ngắn hơn 5 giây; request đặt hàng thất bại nhanh còn hơn treo và chiếm thread. Không dùng regex trên bất kỳ input người dùng nào (validation bằng `@Size`, `@Pattern` chỉ với pattern hằng đã kiểm tra ReDoS).

## 7. Virtual threads, pool và JMH

Ước lượng ở giai đoạn 0 cho 750 request đồng thời ở đỉnh, vượt 200 thread mặc định của Tomcat; giai đoạn này thí nghiệm ba cấu hình và ghi kết luận thành ADR-004 với số đo, không chọn theo cảm tính.

**7.1. Ba cấu hình thí nghiệm (buổi 11)**

| Cấu hình | Cài đặt | Giả thuyết |
| --- | --- | --- |
| A: Tomcat mặc định | `server.tomcat.threads.max=200` | Gãy ở khoảng 200 request đồng thời; latency bậc thang; CPU chưa hết |
| B: Tomcat tăng pool | `threads.max=750` | Đạt NFR nhưng tốn bộ nhớ stack (750 × 1 MB dự trữ), context switch tăng, RAM API cao |
| C: Virtual threads | `spring.threads.virtual.enabled=true` | Đạt NFR, RAM thấp hơn B, throughput tương đương hoặc hơn; nút thắt dời sang HikariCP và Redis |

Đo mỗi cấu hình 3 lần bằng `spike.js` trên cùng commit, ghi p99, RPS, RAM, CPU, `hikaricp.connections.pending`. Kết luận kỳ vọng: chọn C, nhưng nếu C không hơn B rõ rệt thì ghi đúng như vậy.

**7.2. Những gì cần kiểm tra khi bật virtual threads**

- Pinning: từ JDK 24 (JEP 491) `synchronized` không còn ghim carrier thread, nên trên Java 25 chỉ còn lo native frame; bật `-Djdk.tracePinnedThreads=full` một lần để xác nhận log trống, và xem event `jdk.VirtualThreadPinned` trong JFR.
- JDBC là blocking nhưng an toàn với virtual threads; nút thắt thành `maximumPoolSize` của HikariCP: theo định luật Little với 350 ghi/giây × 20 ms = 7 connection bận, pool 20 là đủ; nếu `pending` > 0 ở đỉnh, tăng pool lên 30 rồi đo lại, không tăng mù.
- Lettuce dùng Netty, không block; giữ một kết nối chia sẻ, không tạo pool Lettuce.
- `ThreadLocal` trong code (MDC, `SecurityContextHolder`) vẫn chạy nhưng tốn bộ nhớ khi có 10.000 virtual thread; Spring Security 7 đã hỗ trợ, chỉ cần không tự cache gì trong `ThreadLocal`.
- Không dùng `ExecutorService` pool cố định cho việc song song trong request; nếu cần fan-out (ví dụ đọc đợt và tồn kho cùng lúc), dùng `Executors.newVirtualThreadPerTaskExecutor()` hoặc structured concurrency (preview trên Java 25, chỉ thử trong nhánh riêng).

**7.3. ADR-004: Virtual threads cho request handling**

- Phương án A, B, C như trên; hệ quả xấu của C: khó nhìn thấy trong thread dump truyền thống (dùng `jcmd Thread.dump_to_file -format=json`), một số agent APM cũ không hỗ trợ.
- Cách xác nhận: bảng 7.1; xem lại ở giai đoạn 4 khi có nhiều instance và HPA.

**7.4. JMH (buổi 12)**

JMH ở giai đoạn này để học phương pháp microbenchmark đúng, không phải để tìm nút thắt (nút thắt tìm bằng k6 và flame graph). Hai benchmark có ý nghĩa vì chạy trên mọi request:

| Benchmark | So sánh | Câu hỏi |
| --- | --- | --- |
| `QueueTokenVerifyBench` | HMAC-SHA256 qua `javax.crypto.Mac` tạo mới mỗi lần, so với `Mac` clone, so với Ed25519 verify | Chi phí xác minh token là bao nhiêu ns; có đáng cache `Mac` không |
| `RequestHashBench` | SHA-256 body 200 byte bằng `MessageDigest` mới mỗi lần, so với `ThreadLocal<MessageDigest>` | Idempotency hash có đáng tối ưu không |

```java
@BenchmarkMode(Mode.AverageTime) @OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1) @Measurement(iterations = 5, time = 1) @Fork(2)
@State(Scope.Thread)
public class QueueTokenVerifyBench {
    byte[] key = new byte[32]; String token;
    @Setup public void setUp() { new SecureRandom().nextBytes(key); token = QueueTokens.issue(key, "sale", "user", 60); }
    @Benchmark public boolean verifyNewMac() throws Exception { return QueueTokens.verifyNewMac(key, token); }
    @Benchmark public boolean verifyClonedMac() throws Exception { return QueueTokens.verifyClonedMac(key, token); }
}
```

Quy tắc JMH: `@Fork(2)` trở lên, trả kết quả về `Blackhole` hoặc `return`, không đo trên laptop đang chạy k6, và kết luận chỉ ở mức "không đáng tối ưu" hay "đáng thử", sau đó xác nhận bằng k6. Ghi kết quả vào phụ lục report cùng một câu về giới hạn của microbenchmark.

## 8. Đường đọc

Xem đợt chiếm một phần tư traffic và không cần chính xác tuyệt đối, nên đường đọc phục vụ từ Redis với TTL 2 giây và không bao giờ để PostgreSQL bị dồn khi cache hết hạn đúng lúc 2.500 request/giây cùng đến.

**8.1. Cache đợt và sản phẩm (`GET /api/flash-sales/{id}`)**

- Key `cache:sale:{id}` chứa JSON của đợt và sản phẩm (không chứa tồn kho), TTL 2 giây; admin mở/đóng đợt thì `DEL` key ngay.
- `availableApprox` lấy từ `sale:{id}:stock` trên Redis, làm tròn xuống bội số của 10, và trả 0 khi dưới 10; không đọc `inventory` trong PostgreSQL trên đường này.
- Hết hàng thì response thêm `soldOut: true` để client dừng gọi token.

**8.2. Chống cache stampede**

| Kỹ thuật | Cách làm | Dùng |
| --- | --- | --- |
| Single-flight trong JVM | `Caffeine.newBuilder().refreshAfterWrite(1s)` lớp L1 trước Redis, một thread nạp, các thread khác dùng giá trị cũ | Có, L1 giới hạn 1.000 entry |
| Khóa nạp trên Redis | `SET cache:sale:{id}:lock NX PX 500`; ai lấy được khóa mới đọc DB, còn lại chờ 50 ms rồi đọc lại cache | Có, cho trường hợp nhiều instance ở giai đoạn 4 |
| Logical expiry | Lưu `expiresAt` trong giá trị, trả giá trị cũ và nạp lại nền khi gần hết hạn | Không, `refreshAfterWrite` của Caffeine đã làm việc này ở L1 |
| Jitter TTL | TTL 2 giây ± 200 ms | Có, tránh nhiều key hết hạn cùng lúc |

Test stampede: xóa key, bắn 500 request đồng thời, đếm số query PostgreSQL bằng `pg_stat_statements` hoặc counter trong repository; phải bằng 1.

**8.3. Những gì không cache**

- Đơn hàng của user (`GET /api/orders/{id}`): đọc PostgreSQL trực tiếp vì cần trạng thái đúng và có index theo `(user_id, created_at)`; traffic poll ở đuôi đợt chỉ khoảng 300 request/giây.
- Kết quả rate limit và token: đã nằm trên Redis, không cache thêm.
- JWKS của Keycloak: `NimbusJwtDecoder` tự cache; xác nhận bằng flame graph ở buổi 3 rằng không có HTTP call tới Keycloak trong lúc tải.

## 9. Security giai đoạn 2

Giai đoạn 2 thêm một hệ thống mới vào ranh giới tin cậy 2 (Redis giữ tồn kho thật) và mở mặt tấn công mới (token, rate limit), nên vừa phải bảo vệ Redis vừa phải tự tấn công đúng những cơ chế vừa xây.

**9.1. Bảo vệ Redis**

| Việc | Cách làm |
| --- | --- |
| Xác thực | Tắt user `default`; tạo user `flashsale-api` với mật khẩu riêng, ACL chỉ cho phép lệnh cần: `GET SET DECRBY INCRBY SADD SREM SISMEMBER HSET HDEL HGETALL DEL EXPIRE EVAL EVALSHA SCRIPT` và pattern key `~sale:* ~cache:* ~ratelimit:*` |
| Job đối chiếu | User riêng `flashsale-reconciler` có thêm `SCAN`, không có `FLUSHALL`, `CONFIG`, `DEBUG` |
| Mạng | Redis chỉ bind vào network của Compose, không publish port ra host ở `compose.perf.yaml`; ở giai đoạn 4 thêm NetworkPolicy |
| TLS | Bật TLS local bằng chứng chỉ tự ký để Lettuce đi qua `rediss://`; chi phí handshake không đáng kể vì giữ một kết nối |
| Persistence | AOF `everysec` để kho không mất khi restart; đây cũng là biện pháp cho dòng "Redis mất dữ liệu" ở mục 5.4 |
| Lua | Script chỉ dùng key truyền qua `KEYS`, không ghép key từ `ARGV`, để ACL pattern có hiệu lực và chạy được trên Cluster |

**9.2. Cập nhật threat model v0**

- Dòng "API → Redis": thêm biện pháp ACL, TLS, AOF; mức rủi ro giữ Trung bình vì Redis vẫn là điểm lỗi đơn.
- Dòng mới "Client → API (lấy token)": kẻ tấn công xin token bằng nhiều tài khoản; biện pháp rate limit IP và chỗ cắm challenge; mức Trung bình, rủi ro còn lại ghi vào 7.3 của tab giai đoạn 0 (chưa có phát hiện gian lận theo hành vi).
- Dòng mới "Client → API (rate limit)": bypass qua header; biện pháp trust proxy theo CIDR; mức Thấp sau khi test.

**9.3. Hai buổi tự tấn công (buổi 14 và 15) — `docs/security/attack-log-2.md`**

| # | Kịch bản | Cách thử | Kết quả kỳ vọng | Test hồi quy |
| --- | --- | --- | --- | --- |
| 1 | Dùng lại token hàng chờ sau khi đã đặt hàng thành công | Repeater gửi lại body cũ với `Idempotency-Key` mới | 403 `bad-token` (Lua trả -1 vì key đã `DEL`) | `QueueTokenReuseTest` |
| 2 | Dùng token của user khác | Lấy token bằng alice, gửi đặt hàng bằng JWT của bob | 403: chữ ký hợp lệ nhưng `userId` trong token khác `sub`; Lua cũng không thấy key của bob | `QueueTokenOwnerTest` |
| 3 | Giả token: sửa `exp`, đổi `saleId`, ký bằng khóa đoán | jwt\_tool hoặc script Python | 403 trước khi chạm Redis; so sánh chữ ký hằng thời gian (`MessageDigest.isEqual`) | `QueueTokenForgeryTest` |
| 4 | Bypass rate limit bằng `X-Forwarded-For: 1.2.3.4` ngẫu nhiên mỗi request | Turbo Intruder 500 request | Vẫn 429 sau ngưỡng vì header bị bỏ qua khi không có proxy tin cậy | `RateLimitSpoofTest` |
| 5 | Race trên đường Redis: 200 request đặt hàng cùng user, cùng token, cùng mili-giây | Turbo Intruder single-packet | Đúng 1 đơn; 199 request 403 hoặc 409; kho giảm đúng 1 lần | `ConcurrentSameTokenTest` |
| 6 | Payload 5 MB và slow client gửi 1 byte/giây | curl với `--limit-rate`, script socket | 413 cho payload lớn; kết nối chậm bị đóng sau 5 giây; p99 của client khác không đổi (đo bằng k6 chạy song song) | `BodyLimitTest`, kịch bản k6 `slowloris.js` |

Thêm kịch bản 7 tùy chọn nếu còn thời gian: kẻ tấn công có mật khẩu Redis cũ (giả lập rò rỉ) — xoay mật khẩu, xác nhận ứng dụng vẫn chạy nhờ đọc secret từ biến môi trường và Lettuce reconnect.

## 10. Nguồn học cho giai đoạn 2 và quyết định cho các câu hỏi mở

Khoảng 8 giờ đọc; hai cuốn sách của giai đoạn này là *Optimizing Cloud Native Java* 2nd và chương về caching, rate limiting trong *System Design Interview* Vol 1.

| Buổi | Nguồn | Phần cần đọc | Miễn phí |
| --- | --- | --- | --- |
| 1–2 | k6 docs: Scenarios, `ramping-arrival-rate`, Thresholds, Tags | Viết kịch bản đúng loại executor | Có |
| 3 | *Optimizing Cloud Native Java* 2nd: chương về performance testing, profiling và "Don't microbenchmark if you can help it" | Phương pháp đo và bẫy thường gặp | Không |
| 3 | async-profiler README và wiki; JFR docs trên dev.java; Brendan Gregg, Flame Graphs | Cách đọc flame graph, event JFR | Có |
| 4–5 | Redis docs: Scripting with Lua, Transactions, Keyspace, Hash tags; Lettuce docs | Atomic script, EVALSHA, hash tag | Có |
| 4 | ByteByteGo và Viblo System Design VN: các bài về flash sale, inventory, race condition tồn kho | Cách hệ thống thật xử lý và so với thiết kế của mình | Có |
| 7 | DDIA 2nd: chương về consistency và dual writes | Vì sao hai kho dữ liệu cần đối chiếu | Không |
| 9–10 | Bucket4j docs; Spring Security docs về filter order; *System Design Interview* Vol 1 chương Rate Limiter | Token bucket, đặt filter đúng chỗ | Bucket4j có |
| 11 | Inside.java và JEP 444, JEP 491; Spring Boot docs về virtual threads; bài của Spring team về Tomcat và virtual threads | Pinning, cấu hình, giới hạn | Có |
| 12 | JMH samples trên OpenJDK; Aleksey Shipilëv, "JMH pitfalls" | Warmup, dead-code elimination, `Blackhole` | Có |
| 13 | Caffeine wiki: Refresh, Population; bài về cache stampede và single-flight | L1 + L2, chống stampede | Có |
| 14–15 | PortSwigger: Race conditions (single-packet attack), Rate limit bypass; Redis Security docs, ACL | Kịch bản tấn công tương ứng | Có |

**Quyết định cho các câu hỏi mở** (chốt sẵn theo tiêu chí thực tế và học sâu; đổi được bằng cách sửa bảng này)

| # | Câu hỏi | Quyết định | Lý do |
| --- | --- | --- | --- |
| 1 | k6 chạy trên laptop hay thuê VPS? | **Laptop trước**; nếu 3 lần đo chênh trên 15% ở p99, thuê VPS 2 vCPU theo giờ chỉ để chạy k6 | Tiết kiệm; số tuyệt đối không quan trọng bằng số tương đối giữa các mốc |
| 2 | Redis Lua hay Redis `WATCH`/`MULTI` hay Redisson lock? | **Lua** | Atomic, một round-trip, là cách flash sale thật dùng; `WATCH` phải retry, lock phân tán thêm phức tạp không cần thiết |
| 3 | Rate limit bằng Bucket4j hay tự viết sliding window bằng Lua? | **Bucket4j** cho sản phẩm; **tự viết sliding window** trong một nhánh thử nghiệm ở buổi 10 nếu còn giờ | Thư viện đúng chỗ cần đúng; tự viết một lần để hiểu rồi bỏ |
| 4 | Chống bot ở bước lấy token: proof-of-work, Turnstile hay không làm? | **Chỉ để chỗ cắm `ChallengeVerifier`**, không tích hợp dịch vụ thật | Ngoài mục tiêu học của giai đoạn; ghi vào rủi ro chấp nhận và bàn lại ở SAD giai đoạn 5 |
| 5 | Cache L1 Caffeine + L2 Redis, hay chỉ Redis? | **L1 + L2** | Dạy đúng bài về nhiều tầng cache và stampede; ở giai đoạn 4 nhiều instance sẽ thấy L1 lệch nhau, là bài học tiếp theo |
| 6 | Redis một node hay Sentinel ngay từ giai đoạn 2? | **Một node có AOF**; ghi "điểm lỗi đơn" vào ADR-003 và xử lý ở giai đoạn 4 | Sentinel không dạy thêm gì về hiệu năng; để giai đoạn 4 gắn với chaos test |
| 7 | GC: ZGC hay G1 cho môi trường đo? | **ZGC generational**, đo thêm G1 một lần ở buổi 12 để có số so sánh | Mục tiêu latency p99; so sánh một lần để hiểu trade-off throughput |
