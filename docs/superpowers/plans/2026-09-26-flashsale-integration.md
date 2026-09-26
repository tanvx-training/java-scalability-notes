# Tích hợp pet project FlashSale vào DevPrep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm lĩnh vực thứ 17 `flashsale` vào DevPrep. Gồm 10 tài liệu kế hoạch pet project FlashSale trong thư viện, 6 track lộ trình (`fs-gd0`…`fs-gd5`, 165 mục: 96 buổi + 69 tiêu chí nghiệm thu) và con đường thứ 4 "Dự án thực chiến" được link sang tài liệu mọi con đường.

**Architecture:** Web app tĩnh vanilla JS, không build.
- Dữ liệu là module ES trong `webapp/js/data/<field>/`. Nguồn markdown ở `sources/<field>/` được `build-content.sh` sao chép nguyên cây vào `webapp/content/`. Link `.md` tương đối được `rewriteMarkdownLinks` (`webapp/js/views/docs.js`) đổi thành `#/docs/<id>`.
- "Test" của repo là `webapp/scripts/check-data.mjs` (57 bất biến + bảng `EXPECTED.counts`).
- Lộ trình được **sinh bằng script** từ bảng "Lịch … theo buổi" và danh sách Definition of Done trong nguồn, nên không gõ tay 165 mục. Sau khi sinh, người làm sửa tay `text` bị cắt và kiểm chứng từng link "Đọc thêm".
- Nhịp mỗi task: sửa kỳ vọng / bất biến trước → thấy đỏ → viết dữ liệu → thấy xanh → commit.

**Tech Stack:** JavaScript ES modules, Node (check-data, script sinh và lint tạm), bash, git.

**Spec:** [`docs/superpowers/specs/2026-09-26-flashsale-integration-design.md`](../specs/2026-09-26-flashsale-integration-design.md)

**Lệch so với chặng của spec §5 (có chủ đích, cùng kết quả cuối):**
- (a) Module `roadmap` bật ngay ở Task 3 (GĐ0–2), không đợi Task 4. Bất biến #7c đòi track đã đăng ký phải có module, và step guide `kind: "track"` đòi module `roadmap`.
- (b) Nới #3b chuyển từ chặng 2 sang Task 3, vì Task 3 là nơi đầu tiên có link khác lĩnh vực để thấy đỏ rồi xanh.
- (c) Bất biến #3d (khối nghiệm thu cuối track) mở rộng từ `sj-gd*` sang `fs-gd*`.

## Global Constraints

- Nhánh làm việc: `claude/flashsale-pet-project` (đã có commit spec `7892f07`).
- Field id `flashsale`. Doc id `fs-00`…`fs-09`. Track `fs-gd0`…`fs-gd5`. Tuần `fs-gd<N>-w<T>` với `T` là **số tuần tuyệt đối 1–24**. Mục `fs-gd<N>-w<T>-<M>`, `M` = 1..4. Khối nghiệm thu `fs-gd<N>-done`, mục `fs-gd<N>-done-<K>`. Mọi id là khoá localStorage, cố định.
- Module cuối: `["dashboard", "guide", "docs", "roadmap"]`. Chỉ khai module khi dữ liệu của nó đã có (#7/#7c).
- `EXPECTED.counts`: `docs:flashsale` = 10, `roadmap-items:flashsale` = 165 (sau Task 3 là 72).
- Con đường `project`: `fields: ["flashsale"]`, `foundation: []`, `crossLinks: true`, cuối `PATH_ORDER`.
- `FIELD_ORDER`: thêm `"flashsale"` **cuối mảng**, sau `"senior-java"`.
- Nội dung 10 tệp nguồn **không sửa**, trừ hai việc: xoá byline dòng 3 và đổi 9 dòng dẫn trong `00-ke-hoach-tong-quan.md` thành link.
- `text` của mục ≤ 80 ký tự, không kết thúc bằng "…". Lesson buổi có đủ `**Việc cần làm.**`, `**Đầu ra.**`, `**Nguồn.**`. Lesson nghiệm thu có `**Cách tự chấm.**`, `**Nguồn.**`.
- "Đọc thêm" tối đa 2 link mỗi buổi, **chỉ** lấy từ bảng ứng viên bên dưới, và **chỉ** giữ sau khi đã đọc mục tương ứng trong tài liệu đích và thấy khớp đúng việc của buổi.
- Mọi văn bản hiển thị viết tiếng Việt.
- `$SCRATCH` = `/private/tmp/claude-501/-Users-tanvx-Dev-Java-java-scalability-notes/fefee6e8-84eb-43c8-a79a-2022f56c1dad/scratchpad`. Script sinh/lint đặt ở đó, không commit.
- Lệnh kiểm, chạy từ gốc repo, viết tắt **CHECK**: `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`.
- Commit message tiếng Việt, kiểu `feat(flashsale): …`. Kết thúc bằng hai dòng:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F
  ```

## Review Focus

1. **Buổi bị bỏ sót, đảo thứ tự hoặc gán sai tuần** so với bảng nguồn. Không bất biến nào của repo kiểm. Lint `lint-fs.mjs` (Task 3/4) đối chiếu từng mục với bảng buổi: số buổi `K` trong dòng Nguồn, tuần, số mục mỗi tuần.
2. **Link "Đọc thêm" trỏ tài liệu có thật nhưng sai nội dung.** #3 và #3b (sau khi nới) đều xanh trong trường hợp này. Lint giới hạn link trong bảng ứng viên của đúng buổi. Mỗi link giữ lại phải được ghi vào `$SCRATCH/readmore-verified.md` kèm tiêu đề mục `##` đã đọc. Task 3/4 có bước kiểm tệp này phủ đủ mọi link.
3. **9 link dẫn trong `fs-00` gãy** vì gõ sai tên tệp mới. Task 1 kiểm mọi link `.md` trỏ tệp có thật. Task 5 bấm thử trong app.
4. **Id tuần/mục không theo tuần tuyệt đối** (vd `fs-gd1-w1` thay vì `fs-gd1-w3`). Bất biến "khớp tiền tố" vẫn xanh. Lint kiểm `id`/`week` từng khối.
5. **README/guide còn số cũ** ("16 lĩnh vực", "Ba con đường", "23 track / 1086 mục", "301 tài liệu"). Không bất biến nào bắt. Task 5 có bước `grep` các chuỗi cũ.

---

## Bảng tham chiếu dùng chung

### Tài liệu

| doc id | Tệp (`sources/flashsale/`) | Nguồn (`pet-project/`) | `title` | icon |
|---|---|---|---|---|
| fs-00 | `00-ke-hoach-tong-quan.md` | `FlashSale — Kế hoạch pet project & theo dõi tiến độ.md` | FlashSale — Kế hoạch & theo dõi tiến độ | 🛒 |
| fs-01 | `01-thiet-lap-moi-truong.md` | `Thiết lập môi trường.md` | Thiết lập môi trường | 🧰 |
| fs-02 | `02-giai-doan-0.md` | `Giai đoạn 0 — chi tiết.md` | Giai đoạn 0 — Thiết kế trước khi code | 📐 |
| fs-03 | `03-giai-doan-1.md` | `Giai đoạn 1 — chi tiết.md` | Giai đoạn 1 — Modular monolith chạy đúng | 🧱 |
| fs-04 | `04-giai-doan-2.md` | `Giai đoạn 2 — chi tiết.md` | Giai đoạn 2 — Chịu tải flash sale | ⚡ |
| fs-05 | `05-giai-doan-3.md` | `Giai đoạn 3 — chi tiết.md` | Giai đoạn 3 — Event-driven và tách service | 📨 |
| fs-06 | `06-giai-doan-4.md` | `Giai đoạn 4 — chi tiết.md` | Giai đoạn 4 — Production-grade | 🚀 |
| fs-07 | `07-giai-doan-5.md` | `Giai đoạn 5 — chi tiết.md` | Giai đoạn 5 — Góc nhìn Solution Architect | 🏛️ |
| fs-08 | `08-security.md` | `Security — chi tiết.md` | Security xuyên suốt | 🛡️ |
| fs-09 | `09-quy-uoc-tu-danh-gia.md` | `Quy ước & tự đánh giá.md` | Quy ước làm việc và tự đánh giá | 📏 |

### Giai đoạn → track

| N | track | doc | Tuần | Buổi | DoD | Mục | tag | icon |
|---|---|---|---|---:|---:|---:|---|---|
| 0 | fs-gd0 | fs-02 | 1–2 | 8 | 10 | 18 | `v0-design` | 📐 |
| 1 | fs-gd1 | fs-03 | 3–6 | 16 | 11 | 27 | `v1-monolith` | 🧱 |
| 2 | fs-gd2 | fs-04 | 7–10 | 16 | 11 | 27 | `v2-perf` | ⚡ |
| 3 | fs-gd3 | fs-05 | 11–15 | 20 | 13 | 33 | `v3-events` | 📨 |
| 4 | fs-gd4 | fs-06 | 16–19 | 16 | 13 | 29 | `v4-prod` | 🚀 |
| 5 | fs-gd5 | fs-07 | 20–24 | 20 | 11 | 31 | `v5-sa` | 🏛️ |

Cấu trúc nguồn mỗi tệp giai đoạn (đã xác minh cả 6 tệp):
- Dòng `**Definition of Done (… tag \`vN-…\`)**` nằm trong `## 1.`. Các tiêu chí là dòng `- [ ] …` từ đó tới `## 2.`.
- Bảng buổi nằm trong `## 2.`, mỗi dòng dạng `| <buổi> | <tuần> | <Việc> | <Đầu ra> |`. GĐ0 có thêm cột giờ.

### Ứng viên "Đọc thêm" (khoá `N-K` = giai đoạn N, buổi K)

Chỉ là **ứng viên**. Với mỗi ứng viên, mở `sources/<field>/…` của doc đích, tìm mục `##` nói đúng việc của buổi. Nếu có thì giữ và ghi vào `readmore-verified.md`. Nếu không thì xoá. Buổi không có trong bảng thì không có Đọc thêm.

| Buổi | Ứng viên | Buổi | Ứng viên |
|---|---|---|---|
| 0-1 | ddia-02 | 3-1 | kafka-02, kafka-06 |
| 0-2 | ddia-02 | 3-2 | ddia-05 |
| 0-4 | ddia-01 | 3-3 | kafka-09, ddia-12 |
| 0-6 | jpa-20 | 3-4 | kafka-08 |
| 1-1 | jpa-04 | 3-5 | kafka-04, kafka-07 |
| 1-3 | springsec-15 | 3-6 | kafka-07 |
| 1-5 | jpa-11, java-10 | 3-7 | ocnj-14 |
| 1-6 | java-02 | 3-12 | ddia-05 |
| 1-8 | java-02, jpa-11 | 3-16 | ocnj-14 |
| 1-10 | pg-13, jpa-11 | 3-17 | kafka-11 |
| 1-11 | java-10 | 3-19 | ddia-09 |
| 1-12 | springsec-11 | 4-1 | ocnj-11, ocnj-10 |
| 1-13 | springsec-15, springsec-05 | 4-2 | ocnj-11 |
| 2-1 | ocnj-02 | 4-4 | ocnj-10 |
| 2-2 | java-08, java-07 | 4-5 | ocnj-09 |
| 2-3 | ocnj-12 | 4-6 | kuar-03 |
| 2-10 | java-06, java-02 | 4-7 | kuar-10, kuar-13 |
| 2-11 | java-05, modconc-02 | 4-10 | kuar-20 |
| 2-12 | ocnj-02 | 4-11 | java-02, java-06 |
| 5-4 | ddia-10 | 4-12 | ocnj-09 |
| 5-9 | ocnj-09 | 4-13 | kuar-19, kuar-14 |
| 5-13 | ocnj-06, ocnj-15 | 4-14 | ddia-09 |
| 5-16 | kuar-15, ocnj-14 | | |

### Tuần: `title` và `goal`

| T | title | goal |
|---:|---|---|
| 1 | Yêu cầu, ước lượng, C4 và ADR | Biến bài toán flash sale thành NFR bằng số, ước lượng khả thi và hai quyết định kiến trúc đầu tiên. |
| 2 | Threat model, khung repo và CI | Có threat model sơ bộ, repo build được và CI xanh trước khi viết dòng nghiệp vụ nào. |
| 3 | Dựng nền: schema, module, Keycloak, admin API | Dựng schema, ranh giới 5 module, xác thực bằng Keycloak và API quản trị đợt sale. |
| 4 | Đặt hàng đúng dưới đồng thời | Luồng đặt hàng đúng tuyệt đối với 100 request đồng thời: optimistic locking, idempotency, lỗi chuẩn. |
| 5 | Thanh toán mock, hết hạn giữ đơn, phân quyền | Hoàn chỉnh vòng đời đơn: thanh toán mock, hết hạn hoàn kho đúng một lần, phân quyền theo ownership. |
| 6 | Tự tấn công và chốt v1 | Tự tấn công luồng vừa xây, sửa lỗ hổng tìm được và gắn tag `v1-monolith`. |
| 7 | Đo baseline và tìm nút thắt | Có baseline đo được và danh sách nút thắt từ flame graph trước khi đổi bất cứ thứ gì. |
| 8 | Đường ghi qua Redis Lua | Đưa việc trừ kho sang Redis bằng Lua atomic mà vẫn giữ 0 oversell và PostgreSQL là nguồn sự thật. |
| 9 | Chặn lạm dụng và đổi mô hình thread | Token hàng chờ, rate limit và thí nghiệm virtual threads, mỗi thay đổi có số đo. |
| 10 | Đường đọc, tự tấn công và chốt v2 | Cache đường đọc, tự tấn công đường Redis và gắn tag `v2-perf` với report đầy đủ. |
| 11 | Hạ tầng event và outbox | Kafka, schema registry, envelope event và outbox chạy trong monolith. |
| 12 | Consumer idempotent và saga trong monolith | Consumer idempotent, DLT và bốn đường saga chạy đúng trước khi tách service. |
| 13 | Tách order-service | Tách order-service với database riêng và contract test giữa producer và consumer. |
| 14 | Tách payment-service và saga đầy đủ | Tách payment-service, webhook ký HMAC, hoàn tiền và hai ADR về cách tách. |
| 15 | Security Kafka, chaos và chốt v3 | Khoá Kafka bằng SASL/ACL/TLS, chạy chaos và gắn tag `v3-events`. |
| 16 | Observability trên Compose | Có trace, metric, log và SLO ngay trên Compose trước khi chuyển lên Kubernetes. |
| 17 | Đóng gói và lên kind | Image an toàn, cụm kind đủ hạ tầng và bốn đường saga chạy end-to-end trên cụm. |
| 18 | Pipeline supply chain và resilience | CI ký image kèm SBOM, GitOps với Kyverno, resilience và autoscaling dưới tải. |
| 19 | Security cụm, chaos và postmortem | Khoá cụm, chaos có kiểm chứng SLO, postmortem sự cố giả lập và gắn tag `v4-prod`. |
| 20 | SAD arc42 mục 1–9 | Viết chín mục đầu của SAD arc42 từ ADR, C4 và số liệu đã có. |
| 21 | SAD hoàn chỉnh và threat model đầy đủ | Hoàn chỉnh SAD, threat model trên kiến trúc cuối và risk register. |
| 22 | Chi phí, ADR-008 và Well-Architected | Ba phương án hạ tầng có TCO, ADR-008 và review theo sáu trụ cột. |
| 23 | GraalVM native và đối chiếu hệ thống thật | Thí nghiệm native có số đo và đối chiếu thiết kế với các hệ thống công khai. |
| 24 | Viết, trình bày và chốt v5 | Bài viết, tech talk, phản biện thật và gắn tag `v5-sa`. |

---

### Task 1: Chuyển nguồn vào `sources/flashsale/`

**Files:**
- Move: `pet-project/*.md` (10 tệp) → `sources/flashsale/NN-slug.md` theo bảng Tài liệu
- Modify: 10 tệp trên (xoá byline), `sources/flashsale/00-ke-hoach-tong-quan.md` (9 dòng dẫn → link)
- Create: `sources/flashsale/README.md`
- Modify: `sources/README.md` (bảng "Bản đồ hiện tại", thêm dòng sau dòng `senior-java`)

**Interfaces:**
- Produces: 10 tệp `sources/flashsale/NN-slug.md`. Task 2 trỏ `file: "content/flashsale/NN-slug.md"`. Task 3 đọc bảng buổi từ `02-…07-giai-doan-N.md`.

- [ ] **Step 1: Xác nhận nền xanh**

```bash
cd /Users/tanvx/Dev/Java/java-scalability-notes
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -2
```

Expected: `57/57 bất biến đạt`, `Dữ liệu hợp lệ.`

- [ ] **Step 2: Đưa vào index rồi `git mv`**

```bash
git add pet-project/
mkdir -p sources/flashsale
git mv "pet-project/FlashSale — Kế hoạch pet project & theo dõi tiến độ.md" sources/flashsale/00-ke-hoach-tong-quan.md
git mv "pet-project/Thiết lập môi trường.md"       sources/flashsale/01-thiet-lap-moi-truong.md
for i in 0 1 2 3 4 5; do git mv "pet-project/Giai đoạn $i — chi tiết.md" "sources/flashsale/0$((i+2))-giai-doan-$i.md"; done
git mv "pet-project/Security — chi tiết.md"        sources/flashsale/08-security.md
git mv "pet-project/Quy ước & tự đánh giá.md"      sources/flashsale/09-quy-uoc-tu-danh-gia.md
ls pet-project 2>/dev/null && echo "CÒN SÓT" || echo "đã sạch"
ls sources/flashsale | wc -l
```

Expected: `đã sạch`, `10`. Nếu thư mục còn `.DS_Store` không theo dõi thì chạy `rm -rf pet-project` sau khi `git status` không còn tệp tracked nào ở đó.

- [ ] **Step 3: Commit đổi tên thuần** (để git giữ lịch sử rename)

```bash
git commit -q -m "feat(flashsale): chuyển 10 tài liệu pet project vào sources/flashsale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
git show --stat HEAD | tail -1
git status --short
```

Expected: dòng tổng `10 files changed`; `git status --short` không in gì. (`Giai đoạn 5` đã được track từ `b3ded6f` nên hiện dạng rename; 9 tệp còn lại hiện dạng tệp mới — cả hai đều đúng.)

- [ ] **Step 4: Viết script sửa nguồn**

Tạo `$SCRATCH/fix-sources.py`:

```python
import pathlib, re, sys
root = pathlib.Path("sources/flashsale")
for p in sorted(root.glob("[0-9][0-9]-*.md")):
    lines = p.read_text(encoding="utf-8").split("\n")
    # Dòng 3 (index 2) là byline "Sep 2x, 2026 · @Nothing"; dòng 2 và 4 là dòng trống.
    assert re.match(r"^[A-Z][a-z]{2} \d{1,2}, 2026 · @Nothing$", lines[2]), (p, lines[2])
    assert lines[1] == "" and lines[3] == "", p
    del lines[2:4]
    p.write_text("\n".join(lines), encoding="utf-8")

LINKS = {
    "Cài đặt máy và công cụ trước khi bắt đầu: Thiết lập môi trường":
        "Cài đặt máy và công cụ trước khi bắt đầu: [Thiết lập môi trường](01-thiet-lap-moi-truong.md)",
    **{f"Tài liệu chi tiết của giai đoạn này: Giai đoạn {i} — chi tiết":
       f"Tài liệu chi tiết của giai đoạn này: [Giai đoạn {i} — chi tiết](0{i+2}-giai-doan-{i}.md)" for i in range(6)},
    "Tài liệu chi tiết của luồng này: Security — chi tiết":
        "Tài liệu chi tiết của luồng này: [Security — chi tiết](08-security.md)",
    "Tài liệu chi tiết của phần này: Quy ước & tự đánh giá":
        "Tài liệu chi tiết của phần này: [Quy ước & tự đánh giá](09-quy-uoc-tu-danh-gia.md)",
}
p = root / "00-ke-hoach-tong-quan.md"
lines = p.read_text(encoding="utf-8").split("\n")
hits = 0
for i, l in enumerate(lines):
    if l in LINKS:
        lines[i] = LINKS[l]; hits += 1
assert hits == 9, hits
p.write_text("\n".join(lines), encoding="utf-8")
print("ok", hits)
```

- [ ] **Step 5: Chạy script, kiểm không còn byline và mọi link `.md` trỏ tệp có thật** (Review Focus #3)

```bash
python3 "$SCRATCH/fix-sources.py"
grep -l "@Nothing" sources/flashsale/*.md || echo "không còn byline"
cd sources/flashsale
grep -ohE '\]\([^)#]+\.md\)' *.md | sed -E 's/^\]\(//; s/\)$//' | sort -u | while read t; do [ -f "$t" ] && echo "OK $t" || echo "LINK GÃY: $t"; done
cd ../..
git diff --stat
```

Expected: `ok 9`, `không còn byline`, đúng 9 dòng `OK …` (9 tệp đích khác nhau: `01`, `02`…`07`, `08`, `09`), không có `LINK GÃY`. `git diff --stat` chỉ ra 10 tệp, mỗi tệp −2 dòng, riêng `00` thêm 9 dòng sửa.

- [ ] **Step 6: Viết `sources/flashsale/README.md`**

```markdown
# FlashSale — pet project 24 tuần

Kế hoạch dự án thực hành của tác giả repo: nền tảng flash sale chịu tải cao, event-driven (10.000
người tranh 500 sản phẩm trong 1 phút; 0 oversell, 0 double-charge). Đi qua 6 giai đoạn, mỗi giai
đoạn kết thúc bằng một tag Git, kèm một luồng security tự tấn công chạy song song. **Không phải bản
dịch** — không có giấy phép bên thứ ba. Đọc trong app ở lĩnh vực *Pet project FlashSale*, lộ trình
tick được theo từng buổi ở 6 track `fs-gd0`…`fs-gd5`.

| # | Tài liệu | Nội dung |
|---|---|---|
| 00 | [Kế hoạch & theo dõi tiến độ](00-ke-hoach-tong-quan.md) | Bài toán, NFR, stack, bảng tiến độ, tóm tắt 6 giai đoạn, luồng security, nhật ký ADR |
| 01 | [Thiết lập môi trường](01-thiet-lap-moi-truong.md) | Yêu cầu máy, công cụ theo giai đoạn, script cài đặt, IDE, lỗi thường gặp, smoke test |
| 02 | [Giai đoạn 0 — Thiết kế trước khi code](02-giai-doan-0.md) | Tuần 1–2: requirements, ước lượng, C4, ADR-001/002, threat model v0, khung repo và CI |
| 03 | [Giai đoạn 1 — Modular monolith](03-giai-doan-1.md) | Tuần 3–6: Spring Modulith, domain và schema, API, idempotency, optimistic locking, Keycloak |
| 04 | [Giai đoạn 2 — Chịu tải flash sale](04-giai-doan-2.md) | Tuần 7–10: k6, profiling, Redis Lua, token hàng chờ, rate limit, virtual threads, JMH |
| 05 | [Giai đoạn 3 — Event-driven](05-giai-doan-3.md) | Tuần 11–15: Kafka, outbox, saga, consumer idempotent, DLQ, tách service, contract test |
| 06 | [Giai đoạn 4 — Production-grade](06-giai-doan-4.md) | Tuần 16–19: OpenTelemetry, SLO, container, kind + Helm, supply chain, resilience, chaos, postmortem |
| 07 | [Giai đoạn 5 — Góc nhìn SA](07-giai-doan-5.md) | Tuần 20–24: SAD arc42, threat model đầy đủ, TCO và ADR-008, Well-Architected, GraalVM, tech talk |
| 08 | [Security xuyên suốt](08-security.md) | Vòng xây–tấn công–sửa, bộ công cụ, attack log, secure coding, secrets, supply chain, ASVS |
| 09 | [Quy ước & tự đánh giá](09-quy-uoc-tu-danh-gia.md) | Nhịp tuần, git workflow, ADR, DoD chung, nhật ký học, bảng tự đánh giá Senior/SA, rủi ro, ngân sách |
```

- [ ] **Step 7: Thêm dòng vào `sources/README.md`**

Trong bảng "Bản đồ hiện tại", ngay sau dòng `| \`senior-java\` | …`, thêm:

```markdown
| `flashsale` | `flashsale/` | Pet project FlashSale 24 tuần — kế hoạch, môi trường, 6 giai đoạn, security, quy ước: 10 tài liệu |
```

- [ ] **Step 8: CHECK và commit**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -2
git add sources/ && git status --short
git commit -q -m "feat(flashsale): bỏ byline Claude Docs, nối 9 dòng dẫn thành link, README nguồn

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
```

Expected: `57/57 bất biến đạt` (chưa có doc nào trỏ tới, nên không bất biến nào đổi). `git status` trước commit chỉ có tệp trong `sources/`.

---

### Task 2: Khai lĩnh vực, thư viện tài liệu, con đường "Dự án thực chiến", hướng dẫn

**Files:**
- Modify: `webapp/scripts/check-data.mjs` (bảng `EXPECTED.counts`, sau khối `jpa`)
- Create: `webapp/js/data/flashsale/docs.js`
- Modify: `webapp/js/data/docs-index.js` (import + spread)
- Modify: `webapp/js/data/fields.js` (thêm `flashsale` sau `effective-java` hoặc cuối object; thêm vào `FIELD_ORDER` cuối mảng)
- Modify: `webapp/js/data/paths.js` (`PATHS.project`, `PATH_ORDER`, chú thích đầu tệp)
- Modify: `webapp/js/data/guides.js` (`fieldGuides.flashsale`, đặt sau `"senior-java"`)

**Interfaces:**
- Consumes: 10 tệp của Task 1.
- Produces:
  - `export const docs` ở `webapp/js/data/flashsale/docs.js` với id `fs-00`…`fs-09`.
  - `FIELDS.flashsale.modules = ["dashboard", "guide", "docs"]`.
  - `PATHS.project` có `crossLinks: true`. Task 3 đọc cờ này trong #3b.
  - `fieldGuides.flashsale.steps` có `fs-0`, `fs-1`. Task 3/4 chèn thêm `fs-2`…`fs-7` **sau** `fs-1`.

- [ ] **Step 1: Sửa bảng kỳ vọng trước**

Trong `webapp/scripts/check-data.mjs`, ngay trước dòng `  },` đóng `counts` (sau `"interview:jpa": 24,`), thêm:

```js
    // Lĩnh vực FlashSale — pet project 24 tuần: kế hoạch, môi trường, 6 giai
    // đoạn, security, quy ước (không phải sách: chapter/part null).
    "docs:flashsale": 10,
```

- [ ] **Step 2: CHECK thấy đỏ**

Run: CHECK
Expected: FAIL ở `Số lượng bản ghi khớp bảng kỳ vọng` (docs:flashsale kỳ vọng 10, thực 0). Có thể kèm lỗi ở bất biến "EXPECTED.counts phủ…" nếu nó cũng soát khoá thừa.

- [ ] **Step 3: Tạo `webapp/js/data/flashsale/docs.js`**

```js
// Tài liệu lĩnh vực "Pet project FlashSale" — 10 tài liệu.
// Nguồn markdown: sources/flashsale/ — scripts/build-content.sh sao chép nguyên cây
// vào webapp/content/, nên `file` luôn có dạng content/flashsale/… (bất biến #2c).
// Thứ tự mảng là thứ tự đọc có chủ ý — không sắp xếp lại.
// Không phải sách: chapter/part null (giống senior-java).

export const docs = [
  {
    id: "fs-00", field: "flashsale", chapter: null, part: null,
    title: "FlashSale — Kế hoạch & theo dõi tiến độ",
    file: "content/flashsale/00-ke-hoach-tong-quan.md",
    icon: "🛒",
    desc: "Bài toán 10.000 người tranh 500 sản phẩm, NFR đo được, stack, bảng tiến độ 6 giai đoạn, luồng security và nhật ký ADR.",
    tags: ["Tổng quan", "NFR", "Kế hoạch", "ADR"],
  },
  {
    id: "fs-01", field: "flashsale", chapter: null, part: null,
    title: "Thiết lập môi trường",
    file: "content/flashsale/01-thiet-lap-moi-truong.md",
    icon: "🧰",
    desc: "Yêu cầu máy, công cụ cần cài theo từng giai đoạn, script cài đặt và Makefile, cấu hình IDE, lỗi thường gặp và smoke test.",
    tags: ["Môi trường", "Docker", "Công cụ"],
  },
  {
    id: "fs-02", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 0 — Thiết kế trước khi code",
    file: "content/flashsale/02-giai-doan-0.md",
    icon: "📐",
    desc: "Tuần 1–2: requirements và abuse cases, ước lượng back-of-the-envelope, C4 bằng Structurizr, ADR-001/002, threat model STRIDE, khung repo và CI.",
    tags: ["NFR", "C4", "ADR", "STRIDE", "CI"],
  },
  {
    id: "fs-03", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 1 — Modular monolith chạy đúng",
    file: "content/flashsale/03-giai-doan-1.md",
    icon: "🧱",
    desc: "Tuần 3–6: Spring Modulith, domain và schema V1, hợp đồng API, Idempotency-Key, optimistic locking, Keycloak + Spring Security 7, test đồng thời.",
    tags: ["Spring Modulith", "Idempotency", "Optimistic locking", "Keycloak", "Testcontainers"],
  },
  {
    id: "fs-04", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 2 — Chịu tải flash sale",
    file: "content/flashsale/04-giai-doan-2.md",
    icon: "⚡",
    desc: "Tuần 7–10: phương pháp đo với k6, profiling JFR/async-profiler, Redis Lua trừ kho, token hàng chờ, rate limit, virtual threads và JMH.",
    tags: ["k6", "Profiling", "Redis", "Rate limit", "Virtual threads"],
  },
  {
    id: "fs-05", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 3 — Event-driven và tách service",
    file: "content/flashsale/05-giai-doan-3.md",
    icon: "📨",
    desc: "Tuần 11–15: Kafka và schema registry, outbox với Debezium, saga choreography, consumer idempotent, DLQ, tách order và payment, contract test.",
    tags: ["Kafka", "Outbox", "Saga", "DLQ", "Contract test"],
  },
  {
    id: "fs-06", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 4 — Production-grade",
    file: "content/flashsale/06-giai-doan-4.md",
    icon: "🚀",
    desc: "Tuần 16–19: OpenTelemetry và SLO, image an toàn, kind + Helm, CI ký image kèm SBOM, resilience, chaos engineering, postmortem và runbook.",
    tags: ["Observability", "Kubernetes", "Supply chain", "Resilience", "Chaos"],
  },
  {
    id: "fs-07", field: "flashsale", chapter: null, part: null,
    title: "Giai đoạn 5 — Góc nhìn Solution Architect",
    file: "content/flashsale/07-giai-doan-5.md",
    icon: "🏛️",
    desc: "Tuần 20–24: SAD theo arc42, threat model đầy đủ và risk register, TCO ba phương án và ADR-008, Well-Architected, GraalVM native, tech talk.",
    tags: ["arc42", "TCO", "Well-Architected", "GraalVM", "Solution Architect"],
  },
  {
    id: "fs-08", field: "flashsale", chapter: null, part: null,
    title: "Security xuyên suốt",
    file: "content/flashsale/08-security.md",
    icon: "🛡️",
    desc: "Vòng xây–tấn công–sửa qua 6 giai đoạn: bộ công cụ, mẫu attack log, secure coding cho Spring, secrets, supply chain, ASVS mức 2 và playbook sự cố.",
    tags: ["Security", "OWASP", "ASVS", "Threat model"],
  },
  {
    id: "fs-09", field: "flashsale", chapter: null, part: null,
    title: "Quy ước làm việc và tự đánh giá",
    file: "content/flashsale/09-quy-uoc-tu-danh-gia.md",
    icon: "📏",
    desc: "Nhịp tuần, git workflow một người, quy trình ADR, Definition of Done chung, nhật ký học, bảng tự đánh giá Senior/SA, rủi ro và ngân sách.",
    tags: ["Quy ước", "ADR", "Tự đánh giá", "Git"],
  },
];
```

- [ ] **Step 4: Đăng ký trong `docs-index.js`**

Thêm `import { docs as flashsale } from "./flashsale/docs.js";` sau dòng import `effectiveJava`, và `  ...flashsale,` sau `  ...effectiveJava,`.

- [ ] **Step 5: CHECK thấy đỏ ở bất biến module**

Run: CHECK
Expected: FAIL. `field khai rõ (nếu có) phải là lĩnh vực tồn tại` và/hoặc #7c báo `flashsale` chưa khai trong `FIELDS`.

- [ ] **Step 6: Khai lĩnh vực trong `fields.js`**

Thêm vào `FIELDS`, ngay sau khối `"senior-java": { … },`:

```js
  flashsale: {
    label: "Pet project FlashSale",
    icon: "🛒",
    short: "FlashSale",
    unit: null,
    desc: "Dự án thực chiến 24 tuần: nền tảng flash sale 10.000 người tranh 500 sản phẩm — modular monolith → chịu tải → event-driven → production-grade → góc nhìn Solution Architect, kèm luồng security tự tấn công mỗi giai đoạn.",
    certFilter: false,
    // "roadmap" bật ở Task 3 khi track fs-gd0..2 có dữ liệu (bất biến #7/#7c).
    modules: ["dashboard", "guide", "docs"],
    // Kế hoạch cá nhân trải nhiều công nghệ — không nguồn ngoài nào bao hết.
  },
```

Và `FIELD_ORDER` thêm `"flashsale"` cuối mảng: `…, "spring-security", "senior-java", "flashsale"];`

- [ ] **Step 7: CHECK thấy đỏ ở P1 và guide**

Run: CHECK
Expected: FAIL ở `PATHS phủ mọi lĩnh vực đúng một lần…` (`lĩnh vực "flashsale" không thuộc con đường nào`) và ở `Lĩnh vực khai module guide có fieldGuides…`.

- [ ] **Step 8: Thêm con đường trong `paths.js`**

Sau khối `data: { … },` trong `PATHS`:

```js
  project: {
    label: "Dự án thực chiến",
    icon: "🛒",
    desc: "Ráp mọi thứ đã học vào một hệ thống chạy thật: FlashSale đi qua Java/Spring, PostgreSQL, Redis, Kafka, Kubernetes và bảo mật, kết thúc bằng hồ sơ kiến trúc — nên được trỏ tới tài liệu của cả ba con đường.",
    fields: ["flashsale"],
    foundation: [],
    // Capstone: track của con đường này được link #/docs của MỌI lĩnh vực
    // (bất biến #3b), giống ngoại lệ của trục Senior Java.
    crossLinks: true,
  },
```

`export const PATH_ORDER = ["kubernetes", "java", "data", "project"];`

Trong chú thích đầu tệp, sau câu về SPINE, thêm dòng:
`// Con đường có crossLinks: true (capstone) được link tài liệu mọi con đường — xem #3b.`

- [ ] **Step 9: Thêm `fieldGuides.flashsale` trong `guides.js`**

Ngay sau khối `"senior-java": { … },` của `fieldGuides`:

```js
  flashsale: {
    tagline: "Xây một hệ thống flash sale thật trong 24 tuần — mỗi giai đoạn có số đo, ADR, buổi tự tấn công và một tag Git.",
    audience: "Java developer đã đi phần lớn con đường Java Backend và Data (Spring, JPA, PostgreSQL, Kafka ở mức dùng được), muốn một dự án chứng minh kỹ năng Senior và mở đầu Solution Architect. Cần **8–10 giờ/tuần** trong 24 tuần; mỗi buổi 2–2,5 giờ.",
    hoursPerWeek: "8–10 giờ/tuần · 24 tuần",
    prereqs: [
      "Máy đủ chạy Docker Compose nhiều container và (từ giai đoạn 4) một cụm kind 3 node — cấu hình tối thiểu ở tài liệu Thiết lập môi trường.",
      "Tài khoản GitHub để chạy GitHub Actions; repo public từ giai đoạn 1 để dùng CodeQL.",
      "Ngân sách tài nguyên học (sách, khoá, cloud) theo mục Ngân sách trong Quy ước & tự đánh giá.",
    ],
    steps: [
      { id: "fs-0", title: "Đọc Kế hoạch & theo dõi tiến độ", desc: "Bài toán, NFR bằng số, stack và nguyên tắc làm việc. Đây là thước đo cho mọi giai đoạn — đọc trước khi dựng máy.", href: "#/docs/fs-00", done: { kind: "doc", id: "fs-00" } },
      { id: "fs-1", title: "Thiết lập môi trường", desc: "Cài công cụ theo danh sách, chạy smoke test môi trường. Đánh dấu đã đọc khi smoke test xanh.", href: "#/docs/fs-01", done: { kind: "doc", id: "fs-01" } },
    ],
    method: [
      { title: "Đo trước khi tối ưu", desc: "Không thay đổi gì ở giai đoạn 2 và 4 khi chưa có số baseline; mỗi thay đổi là một mốc trong report với p95/p99 trước và sau." },
      { title: "Mỗi quyết định một ADR", desc: "Theo mẫu MADR trong docs/adr; ADR bị thay thế thì đánh dấu superseded, không xoá. Nhật ký ADR ở tài liệu tổng quan là mục lục." },
      { title: "Xây – tấn công – sửa", desc: "Mỗi giai đoạn có buổi tự tấn công 2–3 giờ trước khi gắn tag; mọi phát hiện vào attack log kèm commit fix và test hồi quy." },
      { title: "Khối Nghiệm thu là cổng thật", desc: "Cuối mỗi track là Definition of Done của giai đoạn; chưa tick đủ thì chưa gắn tag, chưa sang giai đoạn sau." },
    ],
    pitfalls: [
      "Mở rộng scope: làm UI đẹp, thêm tính năng ngoài flash sale, hay tích hợp payment thật — kế hoạch cố tình cấm cả ba.",
      "Tối ưu khi chưa đo, hoặc đo một lần rồi kết luận — mỗi cấu hình đo 3 lần, lấy trung vị.",
      "Bỏ buổi tấn công khi trễ lịch — kế hoạch nói rõ: cắt buổi dọn dẹp, không cắt buổi tấn công.",
    ],
    doneWhen: [
      "Sáu tag v0-design → v5-sa, mỗi tag kèm attack log và README cập nhật.",
      "SAD arc42 hoàn chỉnh, ADR-001…008 có trạng thái cuối, report hiệu năng có số trước/sau.",
      "Bài viết hoặc tech talk công khai và ít nhất 5 phản biện đã ghi lại.",
    ],
  },
```

- [ ] **Step 10: CHECK xanh**

Run: CHECK
Expected: `57/57 bất biến đạt`, `Dữ liệu hợp lệ.` (`EXPECTED.counts phủ…` xanh vì có `docs:flashsale`; chưa có roadmap nên không cần `roadmap-items`.)

- [ ] **Step 11: Commit**

```bash
git add webapp/js/data/flashsale/docs.js webapp/js/data/docs-index.js webapp/js/data/fields.js webapp/js/data/paths.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -q -m "feat(flashsale): khai lĩnh vực, thư viện 10 tài liệu và con đường Dự án thực chiến

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
```

---

### Task 3: Lộ trình giai đoạn 0–2, nới #3b, mở rộng #3d, bật module roadmap

**Files:**
- Create: `$SCRATCH/gen-fs.mjs`, `$SCRATCH/lint-fs.mjs`, `$SCRATCH/readmore-verified.md` (không commit)
- Create: `webapp/js/data/flashsale/roadmap-gd0.js`, `roadmap-gd1.js`, `roadmap-gd2.js`
- Modify: `webapp/js/data/roadmap.js` (chú thích đầu tệp, 3 import, 3 track cuối mảng `tracks`)
- Modify: `webapp/scripts/check-data.mjs` (#3b `sameWay`, #3d bộ lọc + tiêu đề, `EXPECTED.counts`)
- Modify: `webapp/js/data/fields.js` (`flashsale.modules` thêm `"roadmap"`)
- Modify: `webapp/js/data/guides.js` (`trackGuides` 3 khoá; `fieldGuides.flashsale.steps` thêm `fs-2`…`fs-4`)

**Interfaces:**
- Consumes: `PATHS.project.crossLinks` (Task 2); bảng buổi trong `sources/flashsale/0{2,3,4}-giai-doan-{0,1,2}.md`.
- Produces:
  - `export const flashsaleGd0` / `flashsaleGd1` / `flashsaleGd2` (mảng khối tuần).
  - `gen-fs.mjs <N>` và `lint-fs.mjs <N…>`, Task 4 dùng lại nguyên văn.
  - `readmore-verified.md` (Task 4 ghi tiếp).

- [ ] **Step 1: Viết script sinh `$SCRATCH/gen-fs.mjs`**

```js
// node $SCRATCH/gen-fs.mjs <N>   — chạy từ gốc repo; ghi webapp/js/data/flashsale/roadmap-gd<N>.js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const N = Number(process.argv[2]);
const PH = {
  0: { tag: "v0-design",   name: "Thiết kế trước khi code" },
  1: { tag: "v1-monolith", name: "Modular monolith chạy đúng" },
  2: { tag: "v2-perf",     name: "Chịu tải flash sale" },
  3: { tag: "v3-events",   name: "Event-driven và tách service" },
  4: { tag: "v4-prod",     name: "Production-grade" },
  5: { tag: "v5-sa",       name: "Góc nhìn Solution Architect" },
}[N];
const DOC = `fs-0${N + 2}`;
const FILE = `sources/flashsale/0${N + 2}-giai-doan-${N}.md`;

// title/goal theo tuần tuyệt đối — chép từ bảng "Tuần: title và goal" của plan.
const WEEKS = {
  1: ["Yêu cầu, ước lượng, C4 và ADR", "Biến bài toán flash sale thành NFR bằng số, ước lượng khả thi và hai quyết định kiến trúc đầu tiên."],
  2: ["Threat model, khung repo và CI", "Có threat model sơ bộ, repo build được và CI xanh trước khi viết dòng nghiệp vụ nào."],
  3: ["Dựng nền: schema, module, Keycloak, admin API", "Dựng schema, ranh giới 5 module, xác thực bằng Keycloak và API quản trị đợt sale."],
  4: ["Đặt hàng đúng dưới đồng thời", "Luồng đặt hàng đúng tuyệt đối với 100 request đồng thời: optimistic locking, idempotency, lỗi chuẩn."],
  5: ["Thanh toán mock, hết hạn giữ đơn, phân quyền", "Hoàn chỉnh vòng đời đơn: thanh toán mock, hết hạn hoàn kho đúng một lần, phân quyền theo ownership."],
  6: ["Tự tấn công và chốt v1", "Tự tấn công luồng vừa xây, sửa lỗ hổng tìm được và gắn tag `v1-monolith`."],
  7: ["Đo baseline và tìm nút thắt", "Có baseline đo được và danh sách nút thắt từ flame graph trước khi đổi bất cứ thứ gì."],
  8: ["Đường ghi qua Redis Lua", "Đưa việc trừ kho sang Redis bằng Lua atomic mà vẫn giữ 0 oversell và PostgreSQL là nguồn sự thật."],
  9: ["Chặn lạm dụng và đổi mô hình thread", "Token hàng chờ, rate limit và thí nghiệm virtual threads, mỗi thay đổi có số đo."],
  10: ["Đường đọc, tự tấn công và chốt v2", "Cache đường đọc, tự tấn công đường Redis và gắn tag `v2-perf` với report đầy đủ."],
  11: ["Hạ tầng event và outbox", "Kafka, schema registry, envelope event và outbox chạy trong monolith."],
  12: ["Consumer idempotent và saga trong monolith", "Consumer idempotent, DLT và bốn đường saga chạy đúng trước khi tách service."],
  13: ["Tách order-service", "Tách order-service với database riêng và contract test giữa producer và consumer."],
  14: ["Tách payment-service và saga đầy đủ", "Tách payment-service, webhook ký HMAC, hoàn tiền và hai ADR về cách tách."],
  15: ["Security Kafka, chaos và chốt v3", "Khoá Kafka bằng SASL/ACL/TLS, chạy chaos và gắn tag `v3-events`."],
  16: ["Observability trên Compose", "Có trace, metric, log và SLO ngay trên Compose trước khi chuyển lên Kubernetes."],
  17: ["Đóng gói và lên kind", "Image an toàn, cụm kind đủ hạ tầng và bốn đường saga chạy end-to-end trên cụm."],
  18: ["Pipeline supply chain và resilience", "CI ký image kèm SBOM, GitOps với Kyverno, resilience và autoscaling dưới tải."],
  19: ["Security cụm, chaos và postmortem", "Khoá cụm, chaos có kiểm chứng SLO, postmortem sự cố giả lập và gắn tag `v4-prod`."],
  20: ["SAD arc42 mục 1–9", "Viết chín mục đầu của SAD arc42 từ ADR, C4 và số liệu đã có."],
  21: ["SAD hoàn chỉnh và threat model đầy đủ", "Hoàn chỉnh SAD, threat model trên kiến trúc cuối và risk register."],
  22: ["Chi phí, ADR-008 và Well-Architected", "Ba phương án hạ tầng có TCO, ADR-008 và review theo sáu trụ cột."],
  23: ["GraalVM native và đối chiếu hệ thống thật", "Thí nghiệm native có số đo và đối chiếu thiết kế với các hệ thống công khai."],
  24: ["Viết, trình bày và chốt v5", "Bài viết, tech talk, phản biện thật và gắn tag `v5-sa`."],
};

// Ứng viên Đọc thêm — chép từ bảng của plan. Sinh ra đầy đủ; người làm XOÁ
// link không kiểm chứng được (Step 4).
const READ_MORE = {
  "0-1": ["ddia-02"], "0-2": ["ddia-02"], "0-4": ["ddia-01"], "0-6": ["jpa-20"],
  "1-1": ["jpa-04"], "1-3": ["springsec-15"], "1-5": ["jpa-11", "java-10"], "1-6": ["java-02"],
  "1-8": ["java-02", "jpa-11"], "1-10": ["pg-13", "jpa-11"], "1-11": ["java-10"], "1-12": ["springsec-11"],
  "1-13": ["springsec-15", "springsec-05"],
  "2-1": ["ocnj-02"], "2-2": ["java-08", "java-07"], "2-3": ["ocnj-12"], "2-10": ["java-06", "java-02"],
  "2-11": ["java-05", "modconc-02"], "2-12": ["ocnj-02"],
  "3-1": ["kafka-02", "kafka-06"], "3-2": ["ddia-05"], "3-3": ["kafka-09", "ddia-12"], "3-4": ["kafka-08"],
  "3-5": ["kafka-04", "kafka-07"], "3-6": ["kafka-07"], "3-7": ["ocnj-14"], "3-12": ["ddia-05"],
  "3-16": ["ocnj-14"], "3-17": ["kafka-11"], "3-19": ["ddia-09"],
  "4-1": ["ocnj-11", "ocnj-10"], "4-2": ["ocnj-11"], "4-4": ["ocnj-10"], "4-5": ["ocnj-09"], "4-6": ["kuar-03"],
  "4-7": ["kuar-10", "kuar-13"], "4-10": ["kuar-20"], "4-11": ["java-02", "java-06"], "4-12": ["ocnj-09"],
  "4-13": ["kuar-19", "kuar-14"], "4-14": ["ddia-09"],
  "5-4": ["ddia-10"], "5-9": ["ocnj-09"], "5-13": ["ocnj-06", "ocnj-15"], "5-16": ["kuar-15", "ocnj-14"],
};

const src = readFileSync(FILE, "utf8");
const sec2 = src.slice(src.indexOf("\n## 2."), src.indexOf("\n## 3."));
const sessions = [...sec2.matchAll(/^\| (\d+) \| (\d+) \| (.+?) \| (.+?) \|/gm)]
  .map((m) => ({ k: +m[1], week: +m[2], viec: m[3].trim(), dau: m[4].trim() }));
const dodStart = src.indexOf("**Definition of Done");
const dod = src.slice(dodStart, src.indexOf("\n## 2.")).split("\n")
  .filter((l) => l.startsWith("- [ ] ")).map((l) => l.slice(6).trim());

// text ≤ 80: cắt ở "; " đầu tiên nếu phần trước đủ dài, rồi cắt theo từ + "…".
// Mọi text có "…" PHẢI được viết lại bằng tay (lint chặn).
function short(s) {
  let t = s;
  const semi = t.indexOf("; ");
  if (semi >= 20) t = t.slice(0, semi);
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (t.length <= 80) return t;
  const cut = t.slice(0, 78);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
const tl = (s) => "`" + s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
const q = (s) => JSON.stringify(s);

const weeksNo = [...new Set(sessions.map((s) => s.week))].sort((a, b) => a - b);
let out = `// Lộ trình FlashSale — Giai đoạn ${N}: ${PH.name}.
//
// Nguồn: ${FILE} (tài liệu ${DOC}).
// Mỗi mục là MỘT BUỔI trong bảng "Lịch … theo buổi" (mục 2); khối cuối
// \`fs-gd${N}-done\` là Definition of Done (mục 1), cổng gắn tag \`${PH.tag}\`.
//
// GIỮ NGUYÊN id (fs-gd${N}-w<tuần tuyệt đối> / fs-gd${N}-w<T>-<M>) — tiến độ
// localStorage lưu theo id này.

export const flashsaleGd${N} = [
`;
for (const w of weeksNo) {
  const ss = sessions.filter((s) => s.week === w).sort((a, b) => a.k - b.k);
  const extra = [...new Set(ss.flatMap((s) => READ_MORE[`${N}-${s.k}`] ?? []))].slice(0, 2);
  out += `  {
    id: ${q(`fs-gd${N}-w${w}`)},
    week: ${q(`Tuần ${w}`)},
    title: ${q(WEEKS[w][0])},
    goal: ${q(WEEKS[w][1])},
    doneWhen: ${q(ss.map((s) => s.dau).join("; ") + ".")},
    resources: [
      { label: ${q(`Giai đoạn ${N} — bản đầy đủ`)}, href: "#/docs/${DOC}" },
      { label: "Security xuyên suốt", href: "#/docs/fs-08" },
${extra.map((id) => `      { label: "Đọc thêm", href: "#/docs/${id}" },`).join("\n")}
    ],
    items: [
`;
  ss.forEach((s, i) => {
    const rm = READ_MORE[`${N}-${s.k}`] ?? [];
    const lesson = [
      `**Việc cần làm.** ${s.viec}`,
      `**Đầu ra.** ${s.dau}`,
      ...(rm.length ? [`**Đọc thêm.** ${rm.map((id) => `[${id}](#/docs/${id})`).join(" · ")}`] : []),
      `**Nguồn.** [Giai đoạn ${N} — buổi ${s.k}](#/docs/${DOC})`,
    ].join("\n\n");
    out += `      {
        id: ${q(`fs-gd${N}-w${w}-${i + 1}`)},
        text: ${q(short(s.viec))},
        lesson: ${tl(lesson)},
      },
`;
  });
  out += `    ],
  },

`;
}
out += `  {
    id: ${q(`fs-gd${N}-done`)},
    week: "Nghiệm thu",
    badge: "✓",
    title: ${q(`Giai đoạn ${N} — gắn tag ${PH.tag}`)},
    goal: ${q(`Cổng ra của giai đoạn ${N}: tick đủ ${dod.length} tiêu chí Definition of Done mới gắn tag \`${PH.tag}\` và đổi dòng giai đoạn trong bảng tiến độ sang Hoàn thành.`)},
    items: [
`;
dod.forEach((d, i) => {
  const lesson = `**Cách tự chấm.** ${d}\n\n**Nguồn.** [Giai đoạn ${N} — Definition of Done](#/docs/${DOC})`;
  out += `      {
        id: ${q(`fs-gd${N}-done-${i + 1}`)},
        text: ${q(short(d))},
        lesson: ${tl(lesson)},
      },
`;
});
out += `    ],
  },
];
`;
mkdirSync("webapp/js/data/flashsale", { recursive: true });
writeFileSync(`webapp/js/data/flashsale/roadmap-gd${N}.js`, out);
console.log(`gd${N}: ${sessions.length} buổi, ${dod.length} DoD, tuần ${weeksNo.join(",")}; text cần viết lại: ${(out.match(/text: ".*…"/g) || []).length}`);
```

- [ ] **Step 2: Viết lint `$SCRATCH/lint-fs.mjs`**

```js
// node $SCRATCH/lint-fs.mjs <N...>  — chạy từ gốc repo. Thoát 1 nếu có lỗi.
import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const READ_MORE = JSON.parse(readFileSync(new URL("./readmore-candidates.json", import.meta.url), "utf8"));
const verified = existsSync(new URL("./readmore-verified.md", import.meta.url))
  ? readFileSync(new URL("./readmore-verified.md", import.meta.url), "utf8") : "";
const bad = [];
let total = 0;
for (const N of process.argv.slice(2).map(Number)) {
  const DOC = `fs-0${N + 2}`;
  const src = readFileSync(`sources/flashsale/0${N + 2}-giai-doan-${N}.md`, "utf8");
  const sec2 = src.slice(src.indexOf("\n## 2."), src.indexOf("\n## 3."));
  const sessions = [...sec2.matchAll(/^\| (\d+) \| (\d+) \|/gm)].map((m) => ({ k: +m[1], week: +m[2] }));
  const dod = src.slice(src.indexOf("**Definition of Done"), src.indexOf("\n## 2.")).split("\n").filter((l) => l.startsWith("- [ ] ")).length;
  const mod = await import(pathToFileURL(resolve(`webapp/js/data/flashsale/roadmap-gd${N}.js`)).href);
  const weeks = mod[`flashsaleGd${N}`];
  if (!Array.isArray(weeks)) { bad.push(`gd${N}: không export flashsaleGd${N}`); continue; }
  const weekNos = [...new Set(sessions.map((s) => s.week))].sort((a, b) => a - b);
  if (weeks.length !== weekNos.length + 1) bad.push(`gd${N}: ${weeks.length} khối, cần ${weekNos.length + 1}`);
  weekNos.forEach((w, wi) => {
    const b = weeks[wi]; if (!b) return;
    const ss = sessions.filter((s) => s.week === w).sort((a, c) => a.k - c.k);
    if (b.id !== `fs-gd${N}-w${w}`) bad.push(`${b.id}: id cần fs-gd${N}-w${w}`);
    if (b.week !== `Tuần ${w}`) bad.push(`${b.id}: week "${b.week}"`);
    for (const f of ["title", "goal", "doneWhen"]) if (!String(b[f] ?? "").trim()) bad.push(`${b.id}: thiếu ${f}`);
    const hrefs = (b.resources ?? []).map((r) => r.href);
    if (!hrefs.includes(`#/docs/${DOC}`) || !hrefs.includes("#/docs/fs-08")) bad.push(`${b.id}: resources thiếu ${DOC}/fs-08`);
    if (hrefs.length > 4) bad.push(`${b.id}: resources quá 4`);
    if (b.items.length !== ss.length) bad.push(`${b.id}: ${b.items.length} mục, nguồn có ${ss.length} buổi`);
    b.items.forEach((it, i) => {
      const s = ss[i]; if (!s) return;
      total++;
      if (it.id !== `${b.id}-${i + 1}`) bad.push(`${it.id}: id cần ${b.id}-${i + 1}`);
      if (it.text.length > 80 || it.text.endsWith("…")) bad.push(`${it.id}: text dài/cắt: "${it.text}"`);
      for (const lab of ["**Việc cần làm.**", "**Đầu ra.**", "**Nguồn.**"]) if (!it.lesson.includes(lab)) bad.push(`${it.id}: thiếu ${lab}`);
      if (!it.lesson.includes(`[Giai đoạn ${N} — buổi ${s.k}](#/docs/${DOC})`)) bad.push(`${it.id}: dòng Nguồn không phải buổi ${s.k}`);
      const allowed = new Set(READ_MORE[`${N}-${s.k}`] ?? []);
      const links = [...it.lesson.matchAll(/#\/docs\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]).filter((id) => id !== DOC);
      if (links.length > 2) bad.push(`${it.id}: quá 2 link Đọc thêm`);
      for (const id of links) {
        if (!allowed.has(id)) bad.push(`${it.id}: ${id} không nằm trong ứng viên buổi ${N}-${s.k}`);
        else if (!verified.includes(`${N}-${s.k} ${id}`)) bad.push(`${it.id}: ${id} chưa ghi kiểm chứng trong readmore-verified.md`);
      }
    });
    for (const h of hrefs) {
      const id = h.replace("#/docs/", "");
      if (id !== DOC && id !== "fs-08" && !b.items.some((it) => it.lesson.includes(`#/docs/${id})`))) bad.push(`${b.id}: resource ${id} không còn buổi nào trong tuần dùng`);
    }
  });
  const done = weeks[weeks.length - 1];
  if (done?.id !== `fs-gd${N}-done` || done.badge !== "✓" || done.week !== "Nghiệm thu") bad.push(`gd${N}: khối cuối không phải nghiệm thu`);
  else {
    if (done.items.length !== dod) bad.push(`gd${N}: nghiệm thu ${done.items.length} mục, nguồn ${dod} DoD`);
    done.items.forEach((it, i) => {
      total++;
      if (it.id !== `fs-gd${N}-done-${i + 1}`) bad.push(`${it.id}: id sai`);
      if (it.text.length > 80 || it.text.endsWith("…")) bad.push(`${it.id}: text dài/cắt: "${it.text}"`);
      if (!it.lesson.includes("**Cách tự chấm.**") || !it.lesson.includes("**Nguồn.**")) bad.push(`${it.id}: thiếu nhãn`);
    });
  }
}
console.log(`${total} mục đã soát`);
if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
console.log("lint-fs: sạch");
```

Tạo `$SCRATCH/readmore-candidates.json` với **đúng** nội dung object `READ_MORE` trong `gen-fs.mjs` ở dạng JSON (khoá và giá trị giữ nguyên), rồi tạo `$SCRATCH/readmore-verified.md` rỗng.

- [ ] **Step 3: Sinh GĐ0–2 và thấy lint đỏ**

```bash
for n in 0 1 2; do node "$SCRATCH/gen-fs.mjs" $n; done
node "$SCRATCH/lint-fs.mjs" 0 1 2
```

Expected: script sinh in `gd0: 8 buổi, 10 DoD, tuần 1,2`, `gd1: 16 buổi, 11 DoD, tuần 3,4,5,6`, `gd2: 16 buổi, 11 DoD, tuần 7,8,9,10`, kèm số text cần viết lại. Lint FAIL: text có "…" và mọi link Đọc thêm "chưa ghi kiểm chứng". **Không** có lỗi về id, số mục, dòng Nguồn. Nếu có thì sửa `gen-fs.mjs`, không sửa tay.

- [ ] **Step 4: Kiểm chứng Đọc thêm, viết lại text** (Review Focus #2)

Với mỗi link Đọc thêm trong 3 tệp:

1. Mở tệp nguồn của doc đích và liệt kê heading. Ví dụ `jpa-11`:
   ```bash
   node -e 'import("./webapp/js/data/docs-index.js").then(({docs})=>console.log(docs.find(d=>d.id==="jpa-11").file))'
   grep -n "^## " sources/<field>/<tệp>.md
   ```
   Đọc mục liên quan.
2. Nếu có mục nói đúng việc của buổi (vd buổi 1-5 "giữ kho bằng optimistic locking" ↔ mục `@Version` / optimistic locking trong jpa-11), ghi một dòng vào `readmore-verified.md`:
   `1-5 jpa-11 — "## 11.2 …" — optimistic locking bằng @Version`
3. Nếu không có, xoá link khỏi dòng `**Đọc thêm.**`. Còn 0 link thì xoá cả dòng và dòng trống kèm theo.
4. Đổi nhãn link từ id sang tiêu đề doc. Ví dụ `[jpa-11](#/docs/jpa-11)` → `[Transaction và concurrency](#/docs/jpa-11)`, và đổi `label: "Đọc thêm"` ở `resources` thành tiêu đề doc tương ứng. Nếu resource trỏ doc không còn buổi nào trong tuần dùng thì xoá resource đó.

Rồi viết lại bằng tay mọi `text` kết thúc "…" thành cụm tự nhiên ≤ 80 ký tự, giữ ý chính của cột "Việc". Ví dụ `"Keycloak realm, Spring Security 7 resource server, kiểm iss/aud/exp"`.

- [ ] **Step 5: Lint sạch**

Run: `node "$SCRATCH/lint-fs.mjs" 0 1 2`
Expected: `72 mục đã soát`, `lint-fs: sạch`.

- [ ] **Step 6: Sửa bất biến trước — #3b, #3d và kỳ vọng**

Trong `webapp/scripts/check-data.mjs`:

(a) #3b, thay định nghĩa `sameWay`:

```js
// Con đường capstone (paths.js: crossLinks: true) được link tài liệu mọi lĩnh
// vực — dự án tổng hợp cần trỏ về đúng chương Kafka/PG/K8s… nó dùng.
const crossLinkField = (fieldId) => {
  const p = pathOfField(fieldId);
  return p != null && PATHS[p]?.crossLinks === true;
};
const sameWay = (docFieldId, trackFieldId) =>
  docFieldId === trackFieldId ||
  trackFieldId === SPINE.field ||
  crossLinkField(trackFieldId) ||
  (pathOfField(docFieldId) != null && pathOfField(docFieldId) === pathOfField(trackFieldId));
```

Và dòng chú thích `// cùng lĩnh vực, HOẶC cùng con đường học (paths.js), HOẶC track thuộc trục` → thêm `HOẶC track thuộc con đường có crossLinks (capstone),` trước `HOẶC track thuộc trục`.

(b) #3d: đổi chú thích `// #3d — Mỗi track sj-gd* phải …` thành `// #3d — Mỗi track sj-gd* / fs-gd* phải …`. Đổi tiêu đề check thành `"Mỗi track sj-gd* / fs-gd* kết thúc bằng đúng một khối nghiệm thu"`. Đổi bộ lọc thành `tracks.filter((x) => /^(sj|fs)-gd/.test(x.id))`.

(c) `EXPECTED.counts`, sau `"docs:flashsale": 10,`:

```js
    // 6 track fs-gd0..5 = 96 buổi + 69 tiêu chí nghiệm thu; TĂNG DẦN: 72 sau
    // GĐ0–2 (18 + 27 + 27), 165 khi đủ 6 giai đoạn.
    "roadmap-items:flashsale": 72,
```

- [ ] **Step 7: CHECK thấy đỏ**

Run: CHECK
Expected: FAIL ở `Số lượng bản ghi khớp bảng kỳ vọng` (kỳ vọng 72, thực 0). Có thể kèm `EXPECTED.counts phủ…` nếu nó soát khoá của lĩnh vực chưa khai roadmap.

- [ ] **Step 8: Đăng ký 3 track trong `roadmap.js`**

Chú thích đầu tệp:
- Ở câu liệt kê track, sửa `…và 4 giai\n// đoạn của Lộ trình Senior Java)` thành `…, 4 giai đoạn của Lộ trình Senior Java và 6 giai đoạn của pet project FlashSale)`.
- Thêm dòng `//   flashsale/roadmap-gd{0..5}.js           (Tuần 1–24 theo giai đoạn) — 18 / 27 / 27 / 33 / 29 / 31 mục` sau dòng `senior-java/roadmap-gd…`.
- Thêm `fs-gd0-w1…` vào danh sách id tuần và `fs-gd0-w1-1…` vào danh sách id mục trong khối LƯU Ý.

Import, thêm sau import cuối cùng của senior-java:

```js
import { flashsaleGd0 } from "./flashsale/roadmap-gd0.js";
import { flashsaleGd1 } from "./flashsale/roadmap-gd1.js";
import { flashsaleGd2 } from "./flashsale/roadmap-gd2.js";
```

Cuối mảng `export const tracks = [`, ngay trước `];` đóng mảng:

```js
  {
    id: "fs-gd0",
    field: "flashsale",
    label: "Giai đoạn 0",
    icon: "📐",
    name: "Thiết kế trước khi code (tuần 1–2)",
    durationWeeks: 2,
    desc: "Repo chưa có dòng nghiệp vụ nào nhưng đã có NFR bằng số, ước lượng, C4, ADR-001/002, threat model sơ bộ và CI xanh. Kết thúc bằng tag v0-design.",
    prereq: "Yêu cầu: đã xong Thiết lập môi trường (smoke test xanh). 8 buổi, mỗi buổi 2–2,5 giờ, làm đúng thứ tự.",
    weeks: flashsaleGd0,
  },
  {
    id: "fs-gd1",
    field: "flashsale",
    label: "Giai đoạn 1",
    icon: "🧱",
    name: "Modular monolith chạy đúng (tuần 3–6)",
    durationWeeks: 4,
    desc: "Luồng đặt hàng đúng tuyệt đối dưới 100 request đồng thời: Spring Modulith, Idempotency-Key, optimistic locking, Keycloak, attack log đầu tiên. Kết thúc bằng tag v1-monolith.",
    prereq: "Yêu cầu: tag v0-design. Chưa tối ưu hiệu năng ở giai đoạn này dù thấy chậm.",
    weeks: flashsaleGd1,
  },
  {
    id: "fs-gd2",
    field: "flashsale",
    label: "Giai đoạn 2",
    icon: "⚡",
    name: "Chịu tải flash sale (tuần 7–10)",
    durationWeeks: 4,
    desc: "10.000 request/phút với p99 < 300 ms mà vẫn 0 oversell: đo baseline, profiling, Redis Lua, token hàng chờ, rate limit, virtual threads — mỗi thay đổi một mốc trong report. Kết thúc bằng tag v2-perf.",
    prereq: "Yêu cầu: tag v1-monolith và baseline-v1. Không đổi gì khi chưa có số đo trước.",
    weeks: flashsaleGd2,
  },
```

- [ ] **Step 9: Bật module, thêm trackGuides và bước hướng dẫn**

`fields.js`: `flashsale.modules` → `["dashboard", "guide", "docs", "roadmap"]`. Xoá dòng chú thích `// "roadmap" bật ở Task 3…`.

`guides.js`, trong `trackGuides` ngay sau khối `"sj-gd4": { … },`:

```js
  "fs-gd0": {
    rhythm: "2 tuần, 8 buổi 2–2,5 giờ, làm đúng thứ tự vì buổi sau dùng đầu ra của buổi trước. Mỗi buổi: đọc mục tương ứng trong tài liệu giai đoạn → làm → commit đầu ra → tick.",
    before: ["Smoke test môi trường xanh (tài liệu Thiết lập môi trường).", "Đọc tài liệu tổng quan: NFR ở bảng đầu là thước đo cho mọi quyết định của giai đoạn này.", "Tạo repo trống, bật branch protection cho `main`."],
    during: ["Viết NFR bằng số, không bằng tính từ — \"nhanh\" không kiểm được, \"p99 < 300 ms\" thì được.", "Mỗi ADR nêu ít nhất hai phương án thay thế và vì sao không chọn.", "gitleaks và Dependency-Check vào CI ngay từ commit đầu, đừng để \"sau\"."],
    after: ["Tick đủ khối Nghiệm thu rồi mới gắn tag `v0-design`.", "Cập nhật dòng giai đoạn 0 trong bảng tiến độ và nhật ký tuần.", "Sang track Giai đoạn 1."],
  },
  "fs-gd1": {
    rhythm: "4 tuần, 16 buổi: tuần 3 dựng nền, tuần 4 đặt hàng đúng, tuần 5 thanh toán và hết hạn, tuần 6 tấn công và chốt. Mỗi buổi kết thúc bằng một test xanh hoặc một tài liệu đầu ra.",
    before: ["Tag `v0-design` và CI xanh.", "Keycloak chạy được trong Docker Compose.", "Đọc mục 3–6 của tài liệu giai đoạn 1 (module, domain, API, luồng đồng thời) trước buổi 1."],
    during: ["Buổi 8 và 10 dễ trượt nhất; nếu trượt, cắt buổi 15 xuống 1 giờ chứ không bỏ buổi 13–14.", "Test đồng thời chạy lại 10 lần liên tiếp — một lần xanh không chứng minh gì.", "Không thêm Redis hay cache dù thấy chậm: đó là việc của giai đoạn 2."],
    after: ["`docs/security/attack-log-1.md` có 6 kịch bản và commit fix.", "`docs/perf/baseline-v1.md` — số liệu nền cho giai đoạn 2.", "Tick khối Nghiệm thu, gắn tag `v1-monolith`, sang Giai đoạn 2."],
  },
  "fs-gd2": {
    rhythm: "4 tuần, 16 buổi: tuần 7 đo và tìm nút thắt, tuần 8 đường ghi qua Redis, tuần 9 chặn lạm dụng và đổi mô hình thread, tuần 10 đường đọc, tấn công và chốt. Mỗi thay đổi là một mốc trong report.",
    before: ["Tag `v1-monolith` và `baseline-v1.md`.", "Môi trường đo cố định (Docker resource limit) — không đo trên máy đang chạy việc khác.", "Đọc mục 3 (phương pháp đo) của tài liệu giai đoạn 2 trước buổi 1."],
    during: ["Đo mỗi cấu hình 3 lần, lấy trung vị; ghi cả thử nghiệm không có tác dụng.", "Sau mỗi tối ưu chạy lại verify-no-oversell — nhanh mà oversell là hỏng.", "ADR-003 viết ở trạng thái Proposed trước khi code, chỉ sang Accepted khi có số."],
    after: ["`docs/perf/report.md` có bảng p95/p99 trước/sau mỗi mốc kèm flame graph.", "Attack log 3–4 có kịch bản race trên đường Redis.", "Tick khối Nghiệm thu, gắn tag `v2-perf`, sang Giai đoạn 3."],
  },
```

`guides.js`, trong `fieldGuides.flashsale.steps` sau `fs-1`:

```js
      { id: "fs-2", title: "Giai đoạn 0 — Thiết kế trước khi code (tuần 1–2)", desc: "NFR, ước lượng, C4, ADR-001/002, threat model sơ bộ, CI xanh. Tag v0-design.", href: "#/roadmap/fs-gd0", done: { kind: "track", id: "fs-gd0" } },
      { id: "fs-3", title: "Giai đoạn 1 — Modular monolith chạy đúng (tuần 3–6)", desc: "100 request đồng thời, tồn kho đúng, idempotency, Keycloak, attack log 1. Tag v1-monolith.", href: "#/roadmap/fs-gd1", done: { kind: "track", id: "fs-gd1" } },
      { id: "fs-4", title: "Giai đoạn 2 — Chịu tải flash sale (tuần 7–10)", desc: "Report p95/p99 trước và sau kèm flame graph; đạt 10.000 request/phút, p99 < 300 ms. Tag v2-perf.", href: "#/roadmap/fs-gd2", done: { kind: "track", id: "fs-gd2" } },
```

- [ ] **Step 10: CHECK xanh**

Run: CHECK
Expected: `57/57 bất biến đạt`, `Dữ liệu hợp lệ.` Riêng #3b xanh **nhờ** nhánh `crossLinkField`. Kiểm bằng cách tạm đặt `crossLinks: false` trong `paths.js`, chạy CHECK: phải FAIL ở `Link #/docs/<id> trong lộ trình cùng lĩnh vực…` với các link Đọc thêm. Rồi trả lại `true`.

- [ ] **Step 11: Commit**

```bash
git add webapp/js/data/flashsale/ webapp/js/data/roadmap.js webapp/js/data/fields.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -q -m "feat(flashsale): lộ trình giai đoạn 0–2 (72 mục), nới #3b cho con đường capstone, #3d phủ fs-gd*

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
```

---

### Task 4: Lộ trình giai đoạn 3–5

**Files:**
- Create: `webapp/js/data/flashsale/roadmap-gd3.js`, `roadmap-gd4.js`, `roadmap-gd5.js`
- Modify: `webapp/js/data/roadmap.js` (3 import, 3 track)
- Modify: `webapp/scripts/check-data.mjs` (`roadmap-items:flashsale` 72 → 165, sửa chú thích)
- Modify: `webapp/js/data/guides.js` (`trackGuides` 3 khoá; `fieldGuides.flashsale.steps` thêm `fs-5`…`fs-7`)

**Interfaces:**
- Consumes: `$SCRATCH/gen-fs.mjs`, `lint-fs.mjs`, `readmore-candidates.json`, `readmore-verified.md` của Task 3 (dùng nguyên văn). Các track `fs-gd0..2` đã đăng ký.
- Produces: `export const flashsaleGd3` / `flashsaleGd4` / `flashsaleGd5`.

- [ ] **Step 1: Kỳ vọng trước**

`check-data.mjs`: `"roadmap-items:flashsale": 72,` → `165,`. Chú thích sửa thành `// 6 track fs-gd0..5 = 96 buổi + 69 tiêu chí nghiệm thu (18 + 27 + 27 + 33 + 29 + 31).`

Run: CHECK
Expected: FAIL `Số lượng bản ghi khớp bảng kỳ vọng` (165 vs 72).

- [ ] **Step 2: Sinh và thấy lint đỏ**

```bash
for n in 3 4 5; do node "$SCRATCH/gen-fs.mjs" $n; done
node "$SCRATCH/lint-fs.mjs" 3 4 5
```

Expected: `gd3: 20 buổi, 13 DoD, tuần 11,12,13,14,15`, `gd4: 16 buổi, 13 DoD, tuần 16,17,18,19`, `gd5: 20 buổi, 11 DoD, tuần 20,21,22,23,24`. Lint FAIL chỉ vì text "…" và Đọc thêm chưa kiểm chứng.

- [ ] **Step 3: Kiểm chứng Đọc thêm và viết lại text**

Làm đúng 4 bước con của Task 3 Step 4 cho `roadmap-gd3/4/5.js`, ghi tiếp vào `readmore-verified.md`. Với 5-13 (GraalVM native), `ocnj-06`/`ocnj-15` chỉ giữ nếu có mục nói về AOT/native image. Với 4-6 (`kuar-03`), chỉ giữ nếu chương có phần kind hoặc cluster local.

- [ ] **Step 4: Lint sạch cả 6 giai đoạn**

Run: `node "$SCRATCH/lint-fs.mjs" 0 1 2 3 4 5`
Expected: `165 mục đã soát`, `lint-fs: sạch`.

- [ ] **Step 5: Đăng ký 3 track**

`roadmap.js`, import sau `flashsaleGd2`:

```js
import { flashsaleGd3 } from "./flashsale/roadmap-gd3.js";
import { flashsaleGd4 } from "./flashsale/roadmap-gd4.js";
import { flashsaleGd5 } from "./flashsale/roadmap-gd5.js";
```

Thêm sau khối track `fs-gd2`:

```js
  {
    id: "fs-gd3",
    field: "flashsale",
    label: "Giai đoạn 3",
    icon: "📨",
    name: "Event-driven và tách service (tuần 11–15)",
    durationWeeks: 5,
    desc: "Đặt hàng → thanh toán → xác nhận kho chạy bất đồng bộ qua Kafka, tự bù khi lỗi; outbox, saga, consumer idempotent, DLQ; order và payment thành hai service. Kết thúc bằng tag v3-events.",
    prereq: "Yêu cầu: tag v2-perf. Luồng event phải chạy đúng trong monolith trước khi tách service.",
    weeks: flashsaleGd3,
  },
  {
    id: "fs-gd4",
    field: "flashsale",
    label: "Giai đoạn 4",
    icon: "🚀",
    name: "Production-grade (tuần 16–19)",
    durationWeeks: 4,
    desc: "Chạy trên Kubernetes với CI/CD ký image, quan sát theo SLO, resilience và chaos có kiểm chứng; postmortem cho một sự cố tự tạo. Kết thúc bằng tag v4-prod.",
    prereq: "Yêu cầu: tag v3-events. Tuần 19 rơi vào Tết 2027 — dự phòng 1–2 tuần theo kế hoạch trong tài liệu giai đoạn 4.",
    weeks: flashsaleGd4,
  },
  {
    id: "fs-gd5",
    field: "flashsale",
    label: "Giai đoạn 5",
    icon: "🏛️",
    name: "Góc nhìn Solution Architect (tuần 20–24)",
    durationWeeks: 5,
    desc: "Biến dự án thành portfolio kiến trúc: SAD arc42, threat model đầy đủ, TCO ba phương án (ADR-008), Well-Architected, GraalVM native và một bài trình bày công khai. Kết thúc bằng tag v5-sa.",
    prereq: "Yêu cầu: tag v4-prod. Viết SAD trước vì mọi việc sau đều bổ sung vào nó.",
    weeks: flashsaleGd5,
  },
```

- [ ] **Step 6: trackGuides và bước hướng dẫn**

`guides.js`, `trackGuides` sau `"fs-gd2"`:

```js
  "fs-gd3": {
    rhythm: "5 tuần, 20 buổi: tuần 11 hạ tầng event, tuần 12 outbox và consumer trong monolith, tuần 13 tách order-service, tuần 14 tách payment-service và saga đầy đủ, tuần 15 security, chaos và chốt.",
    before: ["Tag `v2-perf` và report hiệu năng làm mốc hồi quy.", "Kafka KRaft, Apicurio, Kafka UI chạy trong Compose.", "Đọc mục 4–7 của tài liệu giai đoạn 3 (topic, outbox, saga, consumer) trước buổi 1."],
    during: ["Không tách service trước khi bốn đường saga xanh trong monolith (buổi 8).", "Mỗi consumer idempotent ngay từ đầu — replay 1.000 event không được đổi trạng thái.", "ADR-005/006/007 viết kèm số đo, không chỉ lập luận."],
    after: ["Chaos tắt payment-service 2 phút vẫn đúng 100% đơn.", "Attack log 3 có 6 kịch bản; Kafka chạy SASL/SCRAM + ACL.", "Tick khối Nghiệm thu, gắn tag `v3-events`, sang Giai đoạn 4."],
  },
  "fs-gd4": {
    rhythm: "4 tuần, 16 buổi: tuần 16 observability trên Compose, tuần 17 đóng gói và lên kind, tuần 18 pipeline và resilience, tuần 19 security, chaos và postmortem.",
    before: ["Tag `v3-events`.", "Máy đủ chạy kind 3 node cùng Strimzi, CloudNativePG, Grafana stack (xem Thiết lập môi trường).", "Đọc mục 3 (observability) trước buổi 1 — cần có mắt trước khi chuyển nhà."],
    during: ["Làm observability trên Compose trước; lên kind rồi mới thêm trace là mất khả năng so sánh.", "Pipeline fail thật khi có lỗ hổng High/Critical — không hạ ngưỡng để CI xanh.", "Chaos nào cũng đối chiếu dashboard và alert: alert không bắn là một phát hiện."],
    after: ["`docs/postmortem-001.md` blameless kèm 4 runbook.", "CI xanh có SBOM và chữ ký cosign; Kyverno chặn image không chữ ký.", "Tick khối Nghiệm thu, gắn tag `v4-prod`, sang Giai đoạn 5."],
  },
  "fs-gd5": {
    rhythm: "5 tuần, 20 buổi: tuần 20–21 SAD và threat model, tuần 22 chi phí và Well-Architected, tuần 23 thí nghiệm và đối chiếu, tuần 24 viết, nói và chốt.",
    before: ["Tag `v4-prod`; mọi ADR, report, attack log và postmortem ở một chỗ.", "Tài khoản AWS Pricing Calculator (không cần chạy cloud thật).", "Đọc mục 3 (arc42) trước buổi 1."],
    during: ["SAD dùng lại C4, ADR và số liệu đã có — không vẽ lại từ đầu.", "Mỗi phương án chi phí ghi rõ giả định; độ nhạy quan trọng hơn con số tuyệt đối.", "Trình bày cho người thật và ghi phản biện; tự trình bày cho mình không tính."],
    after: ["`docs/sad` hoàn chỉnh, ADR-008 có bảng chi phí.", "Bài viết hoặc slide công khai và proposal 2 trang từ phản biện.", "Tick khối Nghiệm thu, gắn tag `v5-sa`; xem mục \"Sau giai đoạn 5\" của tài liệu giai đoạn 5."],
  },
```

`fieldGuides.flashsale.steps` sau `fs-4`:

```js
      { id: "fs-5", title: "Giai đoạn 3 — Event-driven và tách service (tuần 11–15)", desc: "Outbox, saga, consumer idempotent, DLQ, hai service tách; chaos tắt payment vẫn không mất đơn. Tag v3-events.", href: "#/roadmap/fs-gd3", done: { kind: "track", id: "fs-gd3" } },
      { id: "fs-6", title: "Giai đoạn 4 — Production-grade (tuần 16–19)", desc: "Kubernetes, CI ký image kèm SBOM, SLO và alert, resilience, chaos, postmortem. Tag v4-prod.", href: "#/roadmap/fs-gd4", done: { kind: "track", id: "fs-gd4" } },
      { id: "fs-7", title: "Giai đoạn 5 — Góc nhìn Solution Architect (tuần 20–24)", desc: "SAD arc42, threat model đầy đủ, TCO và ADR-008, Well-Architected, bài trình bày công khai. Tag v5-sa.", href: "#/roadmap/fs-gd5", done: { kind: "track", id: "fs-gd5" } },
```

- [ ] **Step 7: CHECK xanh và kiểm tài liệu phủ**

Run: CHECK
Expected: `57/57 bất biến đạt`, `Dữ liệu hợp lệ.`

```bash
node -e 'import("./webapp/js/data/roadmap.js").then(({tracks})=>{const fs=tracks.filter(t=>t.field==="flashsale");const txt=JSON.stringify(fs);for(let i=0;i<10;i++){const id="fs-0"+i;console.log(id, txt.includes("#/docs/"+id)?"có":"KHÔNG")}; console.log("mục:",fs.reduce((a,t)=>a+t.weeks.reduce((b,w)=>b+w.items.length,0),0))})'
```

Expected: `fs-02`…`fs-08` là `có`. `fs-00`, `fs-01`, `fs-09` có thể `KHÔNG`, vì các doc này được guide trỏ tới chứ không nằm trong lộ trình. `mục: 165`.

- [ ] **Step 8: Commit**

```bash
git add webapp/js/data/flashsale/ webapp/js/data/roadmap.js webapp/js/data/guides.js webapp/scripts/check-data.mjs
git commit -q -m "feat(flashsale): lộ trình giai đoạn 3–5 — đủ 6 track, 165 mục

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
```

---

### Task 5: README và kiểm trong app

**Files:**
- Modify: `README.md` (đoạn "Ngoài mảng Java…" dòng ~103, bảng cấu trúc repo sau dòng `sources/senior-java/` ~117, dòng `webapp/` ~128)
- Modify: `webapp/README.md` (dòng 17 con đường, dòng 20 lộ trình, dòng 21 thư viện, dòng 84 `fields.js`, dòng 87 `paths.js`)

**Interfaces:**
- Consumes: số liệu cuối, đo lại ở Step 1.

- [ ] **Step 1: Đo số liệu cuối**

```bash
node -e 'Promise.all([import("./webapp/js/data/docs-index.js"),import("./webapp/js/data/roadmap.js"),import("./webapp/js/data/fields.js"),import("./webapp/js/data/paths.js")]).then(([d,r,f,p])=>console.log("fields",Object.keys(f.FIELDS).length,"paths",p.PATH_ORDER.length,"docs",d.docs.length,"tracks",r.tracks.length,"items",r.tracks.reduce((a,t)=>a+t.weeks.reduce((b,w)=>b+w.items.length,0),0)))'
```

Expected: `fields 17 paths 4 docs 311 tracks 29 items 1251`.

- [ ] **Step 2: Sửa `README.md`**

- Dòng ~103: sau `**Lộ trình Senior Java** (chương trình tự học 24 tháng)` thêm `, **pet project FlashSale** (dự án thực chiến 24 tuần)`. Đổi `cả mười sáu lĩnh vực` → `cả mười bảy lĩnh vực`.
- Bảng cấu trúc repo, sau dòng `sources/senior-java/`, thêm:
  ```markdown
  | [`sources/flashsale/`](./sources/flashsale/) | Pet project FlashSale 24 tuần: nền tảng flash sale chịu tải cao, event-driven — kế hoạch, thiết lập môi trường, 6 giai đoạn (modular monolith → chịu tải → event-driven → production-grade → góc nhìn SA), security xuyên suốt, quy ước & tự đánh giá; 10 tài liệu. Đọc trong app ở lĩnh vực Pet project FlashSale, lộ trình tick theo từng buổi. |
  ```
- Dòng `webapp/`: `(16 lĩnh vực)` → `(17 lĩnh vực)`. `**ba con đường học** (Kubernetes & Cloud · Java Backend · Data & Distributed) bao trên 16 lĩnh vực` → `**bốn con đường học** (Kubernetes & Cloud · Java Backend · Data & Distributed · Dự án thực chiến) bao trên 17 lĩnh vực`. `(23 giáo trình, 1086 mục)` → `(29 giáo trình, 1251 mục)`. `(301 tài liệu,` → `(311 tài liệu,`.

- [ ] **Step 3: Sửa `webapp/README.md`**

- Dòng 17: `Ba con đường bao trên 16 lĩnh vực:` → `Bốn con đường bao trên 17 lĩnh vực:`. Sau cụm `🗄️ **Data & Distributed** (DDIA → PostgreSQL 14 Internals → Kafka)` thêm `, 🛒 **Dự án thực chiến** (pet project FlashSale — được link tài liệu cả ba con đường)`.
- Dòng 20: `23 track / 1086 mục` → `29 track / 1251 mục`.
- Dòng 21: `301 tài liệu` → `311 tài liệu`.
- Dòng 84: `# 16 lĩnh vực:` → `# 17 lĩnh vực:`.
- Dòng 87: `# 3 con đường học,` → `# 4 con đường học (con đường capstone crossLinks),`.

- [ ] **Step 4: Quét số cũ** (Review Focus #5)

```bash
grep -rn "16 lĩnh vực\|mười sáu lĩnh vực\|Ba con đường\|ba con đường học\|3 con đường\|1086\|301 tài liệu\|23 track\|23 giáo trình" README.md webapp/README.md sources/README.md webapp/js/data/*.js
```

Expected: không dòng nào. Nếu còn dòng thuộc guide/desc ngoài bảng trên thì sửa theo số mới. Ngoại lệ: `paths.js` chú thích `SPINE … đi qua cả ba con đường` là đúng nghĩa (Senior Java đi qua 3 con đường gốc) và giữ nguyên.

- [ ] **Step 5: CHECK và kiểm trong app**

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs | tail -2
webapp/scripts/dev.sh   # chạy nền; ghi lại URL in ra
```

Mở URL, kiểm lần lượt (dùng claude-in-chrome nếu có; không có thì ghi danh sách này vào báo cáo để người dùng tự bấm):
1. Bộ chọn lĩnh vực có mục thứ 4 "🛒 Dự án thực chiến" chứa "Pet project FlashSale".
2. `#/docs/fs-00`: bấm link "Giai đoạn 0 — chi tiết" → mở `#/docs/fs-02`. Bấm "Security — chi tiết" → `#/docs/fs-08`.
3. `#/roadmap/fs-gd1`: 5 khối (Tuần 3–6 + Nghiệm thu có badge ✓); tick một mục, tải lại trang vẫn còn.
4. Trong một buổi có Đọc thêm (vd `fs-gd1-w4-1`), bấm link → mở đúng tài liệu lĩnh vực khác.
5. `#/guide` của FlashSale: 8 bước, bước fs-3 phản ánh tiến độ vừa tick.

Expected: `57/57 bất biến đạt` và 5 kiểm tra đạt. Bỏ tick mục đã thử ở (3).

- [ ] **Step 6: Commit**

```bash
git add README.md webapp/README.md
git commit -q -m "feat(flashsale): cập nhật README — 17 lĩnh vực, 4 con đường, 29 track / 1251 mục, 311 tài liệu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017T2Fjyvc5eGSiWgTo4ai5F"
git log --oneline claude/flashsale-pet-project ^main
```

Expected: 7 commit (spec + 6 commit task).
