# Hướng dẫn học hiệu quả với kho tài nguyên này — dành cho lập trình viên Java 4 năm muốn lên Senior

> **Bạn là ai:** Java / Spring Boot 4 năm, đang ở mức Mid vững.
> **Đích:** Senior Java có chiều sâu thật (đo được bằng ma trận năng lực) + CV có chứng chỉ danh giá.
> **Thời gian:** 24 tháng, 8–10 giờ/tuần ngoài giờ làm. Bắt đầu **tháng 10/2026**, kết thúc **tháng 9/2028**.
> **Tài liệu này trả lời ba câu:** học *cái gì trong kho* theo thứ tự nào, học *bằng cách nào* để nhớ và dùng được, và lấy chứng chỉ nào *vào lúc nào*.

---

## 0. Đọc trước 5 phút: sự thật về khối lượng

Kho có 14 lĩnh vực, 258 tài liệu, 21 giáo trình theo tuần. Nếu đọc **tuần tự trọn bộ** theo lộ trình khuyến nghị của từng lĩnh vực:

| Nhóm | Lĩnh vực | Tổng tuần theo track |
|---|---|---|
| Java Backend | Spring Start 8 · Modern Java 12 · WGJD 12 · JCiP 10 · OCNJ 12 · JPA 13 · Java Scalability 6 · Modern Concurrency 9 · Spring Security 9 | **91 tuần** |
| Kubernetes | KUAR 9 · CKAD 10 · K8s in Action 9 · CKA 10 · CKA Study Guide 6 · CKS 10 | **54 tuần** |
| Data & Distributed | DDIA 12 · Kafka 11 | **23 tuần** |
| Nền tuỳ chọn | Sysprog 10 | 10 tuần |
| | **Tổng** | **~178 tuần ≈ 3,4 năm** |

Lộ trình 24 tháng chỉ có **104 tuần**. Vì vậy nguyên tắc số một của guideline này là **phân loại, không ôm hết**:

- **Hạng A — đọc trọn, có lab, có Feynman note:** JCiP, JPA, Java Scalability (10 bài), OCNJ, DDIA, giáo trình CKAD + CKA.
- **Hạng B — đọc chọn chương theo mục tiêu:** Modern Java, WGJD, Modern Concurrency, Spring Security, Kafka, Kubernetes in Action.
- **Hạng C — tra cứu khi cần:** Spring Start Here (bạn đã 4 năm Spring), Sysprog, KUAR, CKS, giáo trình CKA Study Guide (chỉ dùng 6 tuần nước rút).

Với 4 năm kinh nghiệm, bạn **được phép bỏ qua** phần cơ bản của Spring Start Here và nửa đầu Modern Java. Đừng học lại thứ đã biết chỉ vì nó nằm trong kho.

---

## 1. Tuần 0: đo điểm xuất phát (làm trước khi học bất cứ gì)

Mục tiêu của tuần này là có **số đo ban đầu** để 3 tháng sau biết mình tiến hay lùi.

1. **Chạy app:** `./webapp/scripts/dev.sh` → mở `http://localhost:8888`. Chọn lĩnh vực **Lộ trình Senior Java**.
2. **Chấm ma trận năng lực lần đầu** (📊 Ma trận năng lực, 96 tiêu chí, 6 module). Chấm **thật thà**: tiêu chí L1 chỉ tick khi bạn giảng lại được cho junior không nhìn tài liệu; L2 chỉ tick khi đã tự viết code đó. Ghi lại % từng module. Với 4 năm kinh nghiệm, kết quả điển hình là M2 (Spring) khá, M1 (JVM/concurrency) và M4 (DB scaling/cache) lỗ hổng, M3/M5 thấp. Đó là bình thường.
3. **Làm thử 6 câu phỏng vấn L1 + 6 câu L2** của lĩnh vực *Java & Spring Boot Scalability* (🎤 Câu hỏi phỏng vấn). Tự chấm theo rubric. Kết quả này là "ảnh chụp" năng lực trả lời phỏng vấn ban đầu.
4. **Đọc hai tài liệu nền:** [Tổng quan roadmap](./00-tong-quan.md) (nghi thức review quý, quy tắc học) và bài 01 của Java Scalability để làm quen cách kho viết: cơ chế → mã nguồn → thí nghiệm → câu tự kiểm.
5. **Dựng nơi chứa bằng chứng:** tạo repo GitHub `java-deep-dive` với các thư mục `/jvm-gc /collections /concurrency /spring-internals /jpa-sql /testing`. Mọi lab từ đây đổ vào đó.
6. **Xuất tiến độ** (⚙️ Cài đặt → xuất JSON) và cất vào repo cá nhân. Tiến độ nằm trong `localStorage`, đổi máy hoặc xoá cache là mất.

**Hoàn thành khi:** có file điểm ma trận tuần 0, có repo `java-deep-dive` commit đầu tiên, có bản JSON tiến độ.

---

## 2. Vòng học cho MỘT tài liệu (áp dụng cho mọi chương, mọi sách)

Kho được thiết kế để mỗi tài liệu đi qua đúng một vòng. Đừng đọc kiểu lướt web.

```
① Đọc "hướng dẫn đọc" ở đầu trang   →  ② Đọc chương, dừng ở mỗi thí nghiệm để tự chạy
        (mục tiêu · bẫy · câu tự kiểm)                 (không chạy = chưa đọc)
                    ↑                                           ↓
④ Trả lời câu phỏng vấn cùng chủ đề    ←  ③ Viết Feynman note 1 trang + đánh dấu đã đọc
   (tự chấm, ghi rụng ở tầng nào)               (viết như đang giảng cho junior)
```

Chi tiết từng bước:

1. **Đọc hướng dẫn trước, đọc chương sau.** Trang đọc của app có khối *hướng dẫn đọc suy từ lộ trình*: mục tiêu, bài học liên quan, bẫy, câu tự kiểm tra. Đọc khối này 3 phút để biết mình cần lấy gì ra khỏi chương. Đọc không có mục tiêu là đọc để quên.
2. **Chạy mọi thí nghiệm trong chương.** Các bài Java Scalability, JCiP, JPA, OCNJ đều có mã hoặc lệnh cụ thể. Gõ lại, đổi tham số, làm hỏng nó, sửa lại. Lab đổ vào `java-deep-dive`. Quy tắc của kho: *"Đọc mà không code = chưa đọc."*
3. **Feynman note.** Sau chương, đóng sách, viết 1 trang giải thích cho junior. Chỗ nào ngập ngừng là chỗ chưa hiểu, mở lại đúng chỗ đó. Note để trong README của thư mục lab tương ứng.
4. **Đánh dấu đã đọc trong app** (nút cuối trang) và tick mục lộ trình **chỉ khi** đạt điều kiện *"Hoàn thành khi"* của tuần đó. Tick vì "đã đọc xong" là tự lừa mình; app sẽ báo tiến độ đẹp mà đầu vẫn rỗng.
5. **Câu hỏi phỏng vấn cùng chủ đề.** Mỗi lĩnh vực có 24 câu, 6 chủ đề × 4 cấp (L1 lý thuyết → L2 code → L3 đánh đổi → L4 thiết kế & sự cố). Sau mỗi chủ đề, làm câu L1–L2 của chủ đề đó; cuối lĩnh vực làm L3–L4. Trả lời **thành tiếng** trước rồi mới lật đáp án, tick từng ý `mustCover`, tự chấm 3 mức. Bảng tổng kết tách theo cấp cho biết bạn rụng ở tầng nào: rụng L3 là thiếu tư duy đánh đổi, rụng L4 là thiếu kinh nghiệm sự cố, cần lab thêm chứ không cần đọc thêm.

**Thời gian chuẩn cho 1 chương sách dày** (JCiP, DDIA, JPA): 4–6 giờ = 1,5h đọc + 2h lab + 0,5h note + 0,5h phỏng vấn tự chấm. Đúng bằng một tuần học. Đó là lý do các track đặt **một chương một tuần**, không nhanh hơn.

---

## 3. Nhịp tuần 8–10 giờ (mẫu, điều chỉnh theo lịch cá nhân)

| Ngày | Thời lượng | Việc |
|---|---|---|
| Thứ 2 | 1,5h | Đọc nửa đầu chương tuần này theo hướng dẫn đọc. |
| Thứ 3 | 1,5h | Đọc nửa sau, chạy thí nghiệm nhỏ trong chương. |
| Thứ 5 | 1,5h | Lab chính của tuần (mục *Cách thực hiện* trong lộ trình Senior Java). |
| Thứ 7 | 3h | Hoàn thiện lab, viết Feynman note, làm 3–4 câu phỏng vấn tự chấm, tick lộ trình. |
| Chủ nhật | 0,5–1h | Ôn: đọc lại note tuần trước, flashcards (giai đoạn K8s), lên kế hoạch tuần sau. |
| Mỗi ngày | 10 phút | Giai đoạn K8s: flashcards spaced repetition. Giai đoạn khác: đọc lại 1 Feynman note cũ. |

Hai quy tắc bảo vệ nhịp:

- **Không nợ lab.** Nếu tuần này không kịp lab thì tuần sau **không đọc chương mới**, làm lab cho xong. Đọc dồn 3 chương không có lab bằng 0 chương.
- **Bảo vệ khối thứ 7.** Đây là khối duy nhất đủ dài để làm lab có ý nghĩa (Testcontainers, k6, heap dump). Mất khối này là mất tuần.

Nếu chỉ có 5–6 giờ/tuần: giữ nguyên thứ tự, nhân thời lượng mỗi giai đoạn với 1,5 (lộ trình 24 tháng thành 36 tháng). Đừng cắt lab để giữ tiến độ.

---

## 4. Lộ trình 24 tháng ánh xạ vào đúng tài nguyên trong kho

Lộ trình gốc (tài liệu Giai đoạn 1–4 trong lĩnh vực này) trả lời *"tuần này làm gì"* và tham chiếu một số sách ngoài (Effective Java, High-Performance Java Persistence). Bảng dưới đây **thay tham chiếu ngoài bằng tài liệu có sẵn trong kho**, kèm cấp độ đọc (A/B/C) và mốc chứng chỉ.

### Giai đoạn 1 · Tháng 10/2026 – 3/2027 · Java & Spring chuyên sâu

Track trong app: `Lộ trình Senior Java → Giai đoạn 1` (theo tuần). Tài liệu đi kèm:

| Tuần lộ trình | Chủ đề gốc | Đọc trong kho | Lab bắt buộc |
|---|---|---|---|
| 1–2 | Java 17–21 hiện đại | **Modern Java** ch. 1, 3, 5–7, 11 (bỏ ch. 2, 4, 8, 12–14 vì đã dùng hằng ngày) + **WGJD** ch. 1–3 (Java 17 features, modules) | Demo records / sealed / pattern matching cũ-vs-mới; refactor 1 class ở công ty sang Builder |
| 3–4 | JVM memory & GC | **OCNJ** ch. 3–5 (tổng quan JVM, GC, GC nâng cao) + **WGJD** ch. 4 (class file & bytecode), ch. 7 (hiệu năng) | Gây memory leak, chẩn đoán bằng VisualVM rồi bằng `jcmd`/`jmap`/MAT; đọc GC log dưới tải |
| 5–6 | Collections, equals/hashCode | Không có sách chuyên; dùng **Modern Java** ch. 8 + đọc source `HashMap` | Tự cài `MyHashMap`, JMH ArrayList vs LinkedList |
| 7–8 | Generics, lambda, stream | **Modern Java** ch. 9–10, 18–19 (refactor, DSL, tư duy hàm) | PR refactor stream ở công ty |
| 9–10 | Thread safety, visibility, JMM | **JCiP** ch. 2–5 + ch. 16 (JMM) — *Hạng A, đọc chậm* | Race condition + fix 3 cách + JMH; lab visibility `volatile` |
| 11–12 | Thread pool, ExecutorService | **JCiP** ch. 6–8, 10 + **Java Scalability** bài 06–07 (TaskQueue, sizing) | `ThreadPoolExecutor` 2/4/queue 10; tính pool cho app công ty bằng công thức Goetz + Little's Law |
| 13–14 | CompletableFuture & virtual threads | **Modern Java** ch. 15–17 + **Java Scalability** bài 03–05 + **Modern Concurrency** ch. 1–5 (virtual thread, structured concurrency, scoped values) | 3 phiên bản gọi API; lab pinning `-Djdk.tracePinnedThreads`; 100k virtual threads |
| 15–16 | Spring IoC & AOP | **Java Scalability** bài 09 (proxy, ThreadLocal) + **Spring Start Here** ch. 2–6 chỉ khi cần tra cứu | Breakpoint `doCreateBean`; chứng minh proxy CGLIB; self-invocation |
| 17–18 | `@Transactional` tận gốc | **Java Scalability** bài 10 (5 bẫy) + **JPA** ch. 10–11 (persistence context, transaction & concurrency) | Bộ 5 test Testcontainers tái hiện 5 bẫy — tài sản quý nhất giai đoạn |
| 19–20 | JPA hiệu năng, N+1 | **JPA** ch. 3–9, 12–13 (ánh xạ, fetch plan, lọc) | Case optimize #1 ở công ty có số liệu trước/sau |
| 21–22 | SQL, index, execution plan | **DDIA** ch. 4 (lưu trữ & truy xuất, đọc trước để hiểu B-tree) + **JPA** ch. 14 | Case optimize #2: query chậm thật + EXPLAIN |
| 23–24 | Testing | **WGJD** ch. 13–14 + **JPA** ch. 20 | Integration test Testcontainers cho module mình phụ trách |
| 25–26 | Ôn & mock interview | Ngân hàng phỏng vấn: **jcip, java, jpa, modern-java, wgjd, modern-concurrency** (144 câu) | Trả lời L3–L4 thành tiếng, ghi âm; review quý |

**Ngân sách đọc thực tế giai đoạn 1:** JCiP trọn (10 tuần track, ép vào 8 tuần vì bỏ ch. 13–15 sang giai đoạn 2), JPA ~12 chương, Java Scalability trọn 10 bài, Modern Concurrency 5 chương, OCNJ 3 chương, Modern Java ~10 chương chọn lọc, WGJD ~7 chương. Đúng sức 8–10h/tuần nếu tuân thủ "một chương một tuần" cho JCiP/JPA và đọc nhanh phần đã biết.

**Chứng chỉ gắn giai đoạn này:** *Oracle Certified Professional: Java SE 21 Developer* (1Z0-830). Kho **không** có bộ đề luyện OCP, nhưng Modern Java + WGJD + JCiP phủ ~70% chủ đề lý thuyết. Nếu muốn thi: đăng ký vào **tháng 4–5/2027**, tự bổ sung 1 bộ đề luyện bên ngoài trong 6 tuần đầu giai đoạn 2. Đây là chứng chỉ "Java thuần" duy nhất còn uy tín trên CV; giá trị thật là ép bạn lấp lỗ hổng cú pháp.

### Giai đoạn 2 · Tháng 4 – 9/2027 · DevOps nền tảng

Track trong app: `Giai đoạn 2`. App **không có lĩnh vực DevOps riêng**; giai đoạn này học chủ yếu bằng tay trên VPS theo tài liệu [Giai đoạn 2](./02-giai-doan-2-devops.md). Đọc trong kho để bù lý thuyết:

| Chủ đề lộ trình | Đọc trong kho |
|---|---|
| Linux thực chiến, process, signal, network | **Sysprog** ch. 4 (processes), 6–7 (threads, sync), 11 (networking), 13 (signals) — đọc để hiểu `systemd`, `kill`, socket ở tầng kernel. Hạng C, mỗi chương 2 giờ. |
| Đường đi request, TLS, Nginx, timeout | **Java Scalability** bài 01–02 đọc lại (giờ có VPS thật để `ss`, `tcpdump`, gây SYN queue tràn). |
| Docker image Spring Boot, layered jar, JVM trong container | **WGJD** ch. 11–12 (build, container) + **OCNJ** ch. 8–9 (cloud stack, triển khai Java trên cloud) + **Java Scalability** bài 07 §container-aware JVM. |
| Observability: Actuator, Prometheus, Grafana, Loki | **OCNJ** ch. 10–12 (observability, triển khai, profiling) — *Hạng A*, đây là phần "đo đừng đoán" của Senior. |
| Load test, capacity | **Java Scalability** bài 06–08 làm lại toàn bộ thí nghiệm với k6 trên VPS; bảng metrics Prometheus ở README gốc là checklist alert. |
| Bảo mật ứng dụng (lịch đọc nhẹ, tận dụng giai đoạn ít sách) | **Spring Security** ch. 2–12 (filter chain, auth, authz, CSRF, CORS, method security) — Hạng B, 6 tuần, 4h/tuần. Ch. 13–16 (OAuth2) để sang giai đoạn 4 khi làm microservices. |

Ngân hàng phỏng vấn: **ocnj** (đủ 24 câu) và **spring-security**. Chứng chỉ gắn giai đoạn: thi OCP nếu đã chọn.

### Giai đoạn 3 · Tháng 10/2027 – 3/2028 · Kubernetes, Cloud, Terraform

Đây là giai đoạn kho hỗ trợ **đầy đủ nhất cho chứng chỉ**: 3 giáo trình theo tuần, 22 lab đề thật, 130 lệnh, 48 YAML mẫu, thi thử bấm giờ, 84 flashcards. Chuyển lĩnh vực sang **Kubernetes** trong app và đọc trang 🧭 Hướng dẫn học của lĩnh vực này trước.

| Tuần | Việc | Tài nguyên |
|---|---|---|
| 1–2 | Đọc nền nhanh | **KUAR** tuần 1–5 của track (cluster, kubectl, Pod, Service, Deployment). Với 4 năm backend, đi 2 tuần thay vì 5. |
| 3–12 | **Giáo trình CKAD** 10 tuần | Track `ckad`; flashcards 10 phút/ngày từ tuần 4; chip 📖 nối sang *Kubernetes in Action* khi vướng khái niệm. Lồng lab Spring Boot trên K8s của lộ trình Senior (probe, ConfigMap, OOMKilled, `MaxRAMPercentage`). |
| 13–14 | Luyện đề CKAD | 22 lab trong thời gian mục tiêu; thi thử tới khi ổn định ≥ 80%; **thi CKAD** cuối tuần 14 (~giữa tháng 1/2028). |
| 15–22 | **Giáo trình CKA** 8 tuần (đi nhanh tuần trùng CKAD) | Track `cka`; trọng tâm tuần 1–3 và 8 (kiến trúc, kubeadm, etcd, troubleshooting 30% đề). Song song: Helm + HPA + kube-prometheus-stack theo lộ trình Senior. |
| 23–26 | Nước rút CKA + AWS/Terraform | Track `ckabook` (CKA Study Guide) rút còn 4 tuần: chỉ mục *Trọng tâm cho kỳ thi* + bài tập bấm giờ. **Thi CKA** đầu tháng 4/2028. Terraform + EKS làm theo [Giai đoạn 3](./03-giai-doan-3-k8s-cloud.md). |

**Chứng chỉ gắn giai đoạn:** CKAD (tháng 1/2028) → CKA (tháng 4/2028). CKA có 1 lần thi lại miễn phí, hiệu lực 2 năm, đậu 66%. Đây là hai chứng chỉ có **tỷ lệ "kho hỗ trợ / giá trị CV" cao nhất** — hầu như không cần tài liệu ngoài. **CKS** chỉ thi được khi CKA còn hiệu lực; để dành sau tháng 24 nếu bạn rẽ Platform. **AWS SAA** nếu chọn thay CKA: kho không có tài liệu, cần khoá ngoài (lộ trình gợi ý Cantrill/Maarek).

Ngân hàng phỏng vấn: dùng 220 câu trắc nghiệm + thi thử của lĩnh vực Kubernetes.

### Giai đoạn 4 · Tháng 4 – 9/2028 · Distributed systems & System design

Chuyển lĩnh vực sang **DDIA** rồi **Kafka**.

| Tuần | Việc | Tài nguyên |
|---|---|---|
| 1–8 | Messaging, cache, resilience, xây `distributed-patterns-demo` | **Kafka** ch. 3–4, 6–8 (producer, consumer, internals, tin cậy, exactly-once) song song với lab outbox / idempotent consumer / DLT của lộ trình. **Java Scalability** bài 02 (retry + idempotency key, timeout budget) đọc lại trước tuần resilience. **JCiP** ch. 13–15 (lock tường minh, synchronizer, atomic) nếu còn nợ từ giai đoạn 1. |
| 9–14 | **DDIA** 6 tuần kỷ luật | Track `ddia` 12 tuần nén còn 6 bằng cách đọc 2 chương/tuần cho ch. 1–5 (đã biết nền) và 1 chương/tuần cho ch. 6–10 (replication, sharding, transaction, rắc rối hệ phân tán, consensus). Ch. 11–14 (batch, stream) đọc ở tuần 17–20. Mỗi chương: viết 1 đoạn *"hệ của tôi đang chọn gì và trả giá gì"*. |
| 15–16 | Design doc #1 tại công ty | Template trong [Giai đoạn 4](./04-giai-doan-4-system-design.md); **OCNJ** ch. 14 (kỹ thuật & mẫu hình hệ phân tán). |
| 17–20 | System design + design doc #2 + mentoring | **Kafka** ch. 9, 13–14 (pipeline, giám sát, stream) + **DDIA** ch. 11–13. **Spring Security** ch. 13–16 (OAuth2, resource server) cho microservices. |
| 21–26 | Mock system design, đóng gói hồ sơ | Ngân hàng phỏng vấn **ddia, kafka** (48 câu, tập trung L3–L4); chấm ma trận lần cuối. |

**Chứng chỉ gắn giai đoạn:** *Confluent Certified Developer for Apache Kafka* (CCDAK) là lựa chọn tự nhiên vì kho có bản dịch trọn Kafka: The Definitive Guide và 24 câu phỏng vấn. Thi khoảng tháng 8/2028 nếu công việc có Kafka. Không có thì bỏ, đừng lấy chứng chỉ cho thứ không dùng.

---

## 5. Chiến lược chứng chỉ: lấy cái nào, lúc nào, kho hỗ trợ tới đâu

| Chứng chỉ | Thời điểm | Kho hỗ trợ | Cần bổ sung ngoài | Vì sao nên có trên CV Senior Java |
|---|---|---|---|---|
| **CKAD** | Tháng 1/2028 | ★★★★★ giáo trình 10 tuần, 22 lab, thi thử, flashcards, cheat sheet | Cluster tập (kind/killercoda), 1 lần killer.sh | Chứng minh bạn deploy được app của mình đúng chuẩn, không phải "ném jar cho DevOps". |
| **CKA** | Tháng 4/2028 | ★★★★★ giáo trình + sách luyện thi Muschko + nước rút 6 tuần | killer.sh | Chứng chỉ hạ tầng được nhận diện rộng nhất; tách bạn khỏi Mid ở mắt tuyển dụng. |
| **OCP Java SE 21** (1Z0-830) | Tháng 4–5/2027 (tuỳ chọn) | ★★★☆☆ Modern Java, WGJD, JCiP phủ lý thuyết | Bộ đề luyện OCP (kho không có) | Chứng chỉ Java thuần duy nhất có uy tín; ép lấp lỗ hổng ngôn ngữ. Tuỳ chọn vì phỏng vấn Senior ít hỏi trắc nghiệm cú pháp. |
| **CCDAK** (Confluent) | Tháng 8/2028 (tuỳ chọn) | ★★★★☆ bản dịch trọn sách + 24 câu phỏng vấn | Đề mẫu Confluent | Chỉ có giá trị nếu bạn làm event-driven thật. |
| **AWS SAA** | Thay CKA nếu định hướng Backend-biết-cloud | ★☆☆☆☆ chỉ có lộ trình tuần | Khoá ngoài + đề luyện | Rộng nhưng nông; chọn nếu công ty dùng AWS sâu. |
| **CKS** | Sau tháng 24, khi CKA còn hạn | ★★★★☆ giáo trình 10 tuần + cheat sheet | Lab bảo mật | Chỉ nếu rẽ nhánh Platform/SRE. |

Thứ tự khuyến nghị cho mục tiêu **Senior Java**: **CKAD → CKA** là lõi (kho hỗ trợ trọn vẹn, giá trị cao). OCP và CCDAK là lớp bổ trợ, mỗi cái thêm một dòng đáng tin trên CV nhưng đừng để chúng ăn vào thời gian lab.

Ba quy tắc thi:

1. **Không thi khi thi thử chưa ổn định ≥ 80%** hai lần liên tiếp. Trượt tốn tiền và tốn động lực hơn lùi lịch 3 tuần.
2. **Ngày thi đọc thẻ "Trước giờ thi"** trong trang ⚡ Thực hành nhanh của app: alias, biến `$do`, checklist tra `kubernetes.io/docs`.
3. **Thi xong quay lại đọc sách** (Kubernetes in Action sau CKAD) để biến kiến thức thi thành hiểu biết vận hành. Chứng chỉ mà không giải thích được cơ chế sẽ lộ ngay ở vòng phỏng vấn kỹ thuật.

---

## 6. Ba công cụ đo trong app và cách dùng đúng

**Ma trận năng lực (96 tiêu chí, 4 cấp)** — dùng như thước, không như checklist học.
- Chấm lại **cuối mỗi quý** (tháng 12/2026, 3/2027, 6/2027, …) trong buổi review quý 2 giờ của lộ trình.
- Hồ sơ đích cho Senior Java sau 24 tháng: M1 (Java/JVM/concurrency) và M2 (Spring) đạt L3 ở ≥ 70% chủ đề; M4 (DB scaling, cache) đạt L3 ở ≥ 50%; M3 (distributed) và M5 (cloud-native) đạt L2 ở ≥ 70%; M6 (GenAI) tuỳ chọn.
- Một tiêu chí L4 chỉ tick khi bạn **đã xử lý sự cố đó thật** hoặc tái hiện được nó trong lab.

**Ngân hàng phỏng vấn (288 câu, 12 lĩnh vực)** — dùng như bài kiểm tra định kỳ, không như tài liệu đọc.
- Lần 1: sau khi học xong ~50% lĩnh vực, làm L1–L2 (12 câu). Lần 2: cuối lĩnh vực, làm L3–L4 (12 câu). Lần 3: 4 tuần sau, làm lại toàn bộ 24 câu để đo mức quên.
- Ghi vào sổ: **rụng ở tầng nào**. Rụng L2 → thiếu code, quay lại lab. Rụng L3 → thiếu đánh đổi, đọc lại mục "vì sao không chọn cách kia". Rụng L4 → thiếu kinh nghiệm sự cố, tái hiện sự cố bằng Docker/k6.
- Trước phỏng vấn thật hoặc mock: gom mọi câu L4 của jcip, java, jpa, ocnj, ddia (30 câu) — đó là bộ "câu chuyện production" bạn cần kể được.

**Lộ trình theo tuần (21 track, 998 mục)** — dùng như lịch, không như danh sách đọc.
- Chỉ bật một track "xương sống" tại một thời điểm (Giai đoạn N của Senior Java). Các track sách là **vệ tinh**, mở đúng chương khi tuần xương sống chỉ tới.
- Chip 📖 trong tuần đã nối sẵn sang chương sách; không tự mở sách ngoài thứ tự.
- Thanh tiến độ track đẹp không có nghĩa gì nếu ma trận không nhích. Nếu hai chỉ số lệch nhau, bạn đang tick sớm.

---

## 7. Bằng chứng Senior: sản phẩm bắt buộc theo mốc

Senior không được công nhận bằng số chương đã đọc mà bằng **bằng chứng đo được**. Lộ trình đã định nghĩa sẵn, đây là bản gom theo lịch:

| Mốc | Sản phẩm | Nơi lấy nguyên liệu |
|---|---|---|
| 3/2027 | Repo `java-deep-dive` ≥ 10 chủ đề có code + Feynman note; bộ 5 test `@Transactional` traps xanh; 2 case optimize ở công ty có số trước/sau | Giai đoạn 1 |
| 3/2027 | Blog #1: *"5 trường hợp @Transactional không hoạt động như bạn nghĩ"* | Java Scalability bài 10 + lab tuần 17–18 |
| 9/2027 | Repo `springboot-cicd-observability`; pipeline CI/CD có số thời gian deploy trước/sau; dashboard Grafana cho app thật; blog #2 về hành trình tự động hoá | Giai đoạn 2 + OCNJ ch. 10–12 |
| 1/2028 · 4/2028 | CKAD · CKA | Giai đoạn 3 |
| 3/2028 | Repo `production-ready-platform` (Terraform → EKS → Helm → HPA → monitoring); blog #3 | Giai đoạn 3 |
| 9/2028 | 2 design doc (≥ 1 được triển khai); repo `distributed-patterns-demo` (outbox, idempotent consumer, circuit breaker, cache stampede); pass 2 mock system design; blog #4 tổng kết 24 tháng | Giai đoạn 4 + DDIA + Kafka |

**CV** viết theo công thức của lộ trình: *"làm X, bằng cách Y, kết quả Z đo được"*. Mỗi gạch đầu dòng phải có con số (41 query → 2, p95 780ms → 95ms, deploy 30 phút → 5 phút). Cập nhật CV **mỗi quý** trong buổi review, không đợi lúc cần nộp.

---

## 8. Nghi thức review quý (2 giờ, bắt buộc, 8 lần trong 24 tháng)

Cuối tháng 12/2026, 3/2027, 6/2027, 9/2027, 12/2027, 3/2028, 6/2028, 9/2028:

- [ ] Chấm lại ma trận năng lực; so với quý trước theo từng module.
- [ ] Làm lại 24 câu phỏng vấn của lĩnh vực vừa xong; ghi rụng ở tầng nào.
- [ ] Chấm checklist cuối giai đoạn trong tài liệu Giai đoạn tương ứng (đạt/chưa đạt từng mục).
- [ ] Cập nhật CV với thành tích đo được trong quý; dọn README các repo mới.
- [ ] Xuất tiến độ app ra JSON, commit vào repo cá nhân.
- [ ] Viết 5 dòng: *"Quý này tôi làm được gì mà 3 tháng trước chưa làm được?"*
- [ ] Nếu 2 quý liên tiếp trượt mục tiêu → **thu hẹp phạm vi** (bỏ mục "nâng cao", bỏ chứng chỉ tuỳ chọn), không bỏ cuộc và không kéo dài vô hạn.

---

## 9. Bẫy phương pháp thường gặp (và cách kho đã đặt sẵn để tránh)

| Bẫy | Hậu quả | Cách tránh có sẵn trong kho |
|---|---|---|
| Đọc trọn 14 lĩnh vực theo thứ tự | Mất động lực ở tháng 4, chưa chạm lab nào có giá trị | Bảng phân hạng A/B/C ở mục 0; chỉ bật một track xương sống |
| Học lại Spring cơ bản vì "cho chắc" | Mất 8 tuần cho thứ đã biết | Spring Start Here là Hạng C; chỉ tra cứu ch. 2–6 khi debug bean lifecycle |
| Tick lộ trình khi đọc xong | Tiến độ ảo, phỏng vấn rụng L2 | Chỉ tick khi đạt "Hoàn thành khi"; đối chiếu ma trận mỗi quý |
| Đọc JCiP / DDIA nhanh | Quên sau 2 tuần | Track cố tình một chương một tuần; câu tự kiểm cuối mục |
| Báo cáo latency trung bình | Che mất đúng phần cần thấy | OCNJ ch. 2 (tuần 1 của track ocnj): xong tuần đó bạn báo p99 |
| Chỉnh cờ JVM theo cảm giác | Tối ưu sai chỗ | "Đo trước, đọc sau, chỉnh cuối" của track ocnj; bảng metrics Prometheus ở README |
| Nhảy CKA khi chưa làm lab CKAD trong giờ | Trượt CKA | Bước "Làm 22 lab trong thời gian mục tiêu" của Hướng dẫn học Kubernetes |
| Bỏ chương "hiền" (JPA ch. 10 Quản lý dữ liệu) | 3 tuần sau không hiểu lazy loading, transaction | Bẫy đã ghi trong Hướng dẫn học JPA |
| Lấy chứng chỉ cho thứ không dùng | Tốn tiền, không kể được câu chuyện khi phỏng vấn | Bảng mục 5: mỗi chứng chỉ gắn với một sản phẩm thật |
| Học một mình 24 tháng | Không ai chỉ điểm mù | Mock interview cuối giai đoạn 1 và 4; đọc DDIA theo nhóm nếu được; gửi đề xuất cho team lead dù không được duyệt |

---

## 10. Tuần đầu tiên bắt đầu như thế nào (checklist hành động)

1. Chạy app, chọn *Lộ trình Senior Java*, chấm ma trận tuần 0, xuất JSON.
2. Đọc [Tổng quan roadmap](./00-tong-quan.md) và [Giai đoạn 1](./01-giai-doan-1-java-spring.md) mục *Tháng 1*.
3. Tạo repo `java-deep-dive`, cài JDK 21 bằng SDKMAN, tạo project Maven.
4. Mở *Modern Java* ch. 1 và *WGJD* ch. 1 trong app, đọc hướng dẫn đọc, đọc chương, viết demo records / sealed / pattern matching.
5. Chọn 1 class ở công ty có constructor nhiều tham số, refactor sang Builder, tự tạo PR và tự review lý do.
6. Thứ 7: Feynman note "Java 21 khác Java 8 ở đâu và tôi dùng gì ngay tuần tới", làm 4 câu phỏng vấn L1 của *modern-java*, tick tuần 1 nếu đạt "Hoàn thành khi".
7. Chủ nhật: đặt lịch cố định 5 khối thời gian của tuần sau vào calendar.

Sau tuần này bạn đã có: một số đo, một repo, một PR, một note, một thói quen. Phần còn lại của 24 tháng là lặp lại vòng đó với chương tiếp theo.

---

*Tài liệu này bổ sung, không thay thế, lộ trình chi tiết bốn giai đoạn của lĩnh vực này. Khi hai tài liệu mâu thuẫn về "tuần này làm gì", theo lộ trình; khi mâu thuẫn về "đọc sách nào trong kho", theo tài liệu này.*
