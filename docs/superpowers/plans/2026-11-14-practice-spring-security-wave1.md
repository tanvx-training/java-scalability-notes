# Thực hành Spring Security in Action — Kế hoạch triển khai đợt 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm chương trình thực hành `ssia` (theo sách *Spring Security in Action*, ấn bản 2) vào module Thực hành: một kiểu lab chạy cục bộ trong `./labs/lab`, khung 53 buổi theo 17 chương, và nội dung đầy đủ cho chương 2–4 (8 buổi).

**Architecture:** `labs/lab` nhận thêm driver `local` bên cạnh `multipass`: chương trình khai `LAB_DRIVER` trong `env.sh`, phần theo buổi (ORDER, check/begin/verify, assert) dùng chung, phần môi trường tách theo driver. Với `local`, code người học nằm trong `labs/<p>/work/` (một kho git riêng), lời giải tham chiếu là các lớp tệp chép đè theo thứ tự buổi, chấm bằng test JUnit hộp đen chạy một lần Maven. Phần web chỉ thêm dữ liệu chương trình và vài trường tuỳ chọn; không đổi route hay lưu trữ.

**Tech Stack:** bash 3.2 (macOS) và bash 5 (CI Linux); vanilla JS ES modules, không dependency; Node cho `check-data.mjs` và `node --test`; Java 21, Maven, Spring Boot 4.1.x / Spring Security đi kèm; git cho workspace; Docker chỉ khi buổi cần.

**Spec:** `docs/superpowers/specs/2026-11-14-practice-spring-security-design.md`

## Global Constraints

- Giao diện và README bằng tiếng Việt, gọi người đọc là "bạn". Lệnh lab luôn in dạng `./labs/lab …`.
- `webapp/` không build, không dependency. Script lab chạy được trên bash 3.2 và trên bash 5 của CI.
- **Chương trình `cka` không đổi hành vi.** Mọi ca sẵn có trong `labs/tests/run.sh` vẫn đạt nguyên văn; không sửa `labs/cka/`.
- **Không chạy lệnh Multipass nào trong đợt này**, kể cả với VM `cka-*`. Các VM `cp1`, `w1`, `w2` của người dùng không bao giờ được đụng tới.
- Driver `local` chỉ ghi vào `labs/<p>/work/`, `labs/<p>/backups/`, thư mục tạm của `selftest`, và cache Maven. Mọi đích ghi/xoá được kiểm nằm trong các gốc đó sau khi giải symlink. Không lệnh nào xoá nhánh `backup/*` hay tệp trong `backups/`.
- Docker: chỉ gọi compose với đúng tệp và tên project của chương trình. Không đụng container hay tiến trình của dự án khác. Đợt 1 không cần Docker (H2).
- **Độ chính xác nội dung:** mọi khẳng định về hành vi Spring Security (thứ tự filter, tên lớp, thông báo lỗi, mặc định) phải được quan sát trên `labs/ssia/app` đang chạy với đúng phiên bản, hoặc dẫn tài liệu tham chiếu chính thức của đúng phiên bản. Không viết theo trí nhớ hay theo sách. `verifyOutput` là output thật.
- Không chép nguyên văn đoạn dài của sách vào dữ liệu buổi; dẫn chiếu `#/docs/springsec-NN` và diễn đạt lại.
- Số bất biến hiện là 73. Nếu thêm bất biến, cập nhật mọi nơi ghi con số (hai README, chú thích CI).
- Lệnh kiểm: **CHECK** `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`; **UNIT** `node --test "webapp/scripts/tests/*.test.mjs"` (bắt buộc dạng glob trong nháy); **LABTEST** `/bin/bash labs/tests/run.sh`.
- Commit theo từng bước có nghĩa trên nhánh `feat/practice-ssia`, không push.

## Review Focus

1. **Mất code người học.** `restore`, `break`, `destroy`, `begin` trên workspace có tệp chưa commit, tệp mới chưa theo dõi, hoặc đang ở giữa một merge: mọi thay đổi phải còn trong nhánh `backup/*` hoặc gói trong `backups/`. → test ở Task 2.
2. **Ghi ra ngoài workspace.** `labs/<p>/work` là symlink trỏ ra ngoài, id buổi/chương trình có ký tự đường dẫn, `solution/` chứa đường dẫn `../`: phải từ chối trước khi ghi. → test ở Task 1 và 2.
3. **Chấm sai chiều.** Maven không biên dịch được, không test nào chạy, hoặc báo cáo surefire cũ còn sót từ lần trước: mọi dòng phải ✗, không được ✓ theo báo cáo cũ. → test ở Task 2.
4. **Hồi quy `cka`.** Chương trình không khai `LAB_DRIVER` phải chạy đúng như trước, kể cả hàng rào tiền tố. → toàn bộ ca cũ ở Task 1.
5. **Chương trình không có đề thi trong web.** Trang chủ, trang buổi, bản đồ kỹ năng, trang Project của `ssia` không lỗi console và không còn chữ về kỳ thi hay VM. → unit test và kiểm trình duyệt ở Task 3 và 5.

---

### Task 1: Driver trong bộ lệnh lab và phần môi trường của driver `local`

**Files:**
- Modify: `labs/lab`, `labs/lib/core.sh`, `labs/tests/run.sh`
- Create: `labs/lib/local.sh`, `labs/tests/fixtures/loc/{env.sh,app/…}`, `labs/tests/stubs/{mvn,java}`
- Modify: `.gitignore` (thêm `labs/*/work/`, `labs/*/backups/`)

**Interfaces:**
- Consumes: `load_program`, `die`, `info`, `confirm`, `require_cmd` trong `core.sh`.
- Produces:
  - `env.sh` của chương trình `local` khai: `LAB_DRIVER="local"`, `LAB_APP_DIR` (bản gốc, tương đối `labs/<p>/`, mặc định `app`), `LAB_REQUIRE` (các lệnh bắt buộc, vd `"java mvn git"`), `LAB_PORTS` (danh sách cổng, có thể rỗng), `LAB_COMPOSE_FILE` và `LAB_COMPOSE_PROJECT` (tuỳ chọn, đi cùng nhau).
  - `load_program` đặt `LAB_DRIVER` (mặc định `multipass`); chỉ kiểm `LAB_PREFIX`/`LAB_VMS` khi driver là `multipass`; giá trị khác hai driver là lỗi.
  - `ws_dir` in đường dẫn workspace: `${LAB_WORK_DIR:-$LAB_ROOT/$LAB_PROGRAM/work}`. `LAB_WORK_DIR` chỉ dành cho `selftest` và test.
  - `ws_guard <đường dẫn>`: `die` nếu đường dẫn, sau khi giải symlink của phần đã tồn tại, không nằm trong `labs/<p>/work`, `labs/<p>/backups` hoặc `$LAB_WORK_DIR` khi biến này trỏ vào thư mục tạm của hệ thống.
  - `ws_init`: nếu chưa có workspace thì chép `LAB_APP_DIR` vào, `git init`, đặt `user.name=lab`, `user.email=lab@localhost` cục bộ, commit `lab: bản gốc`.
  - `ws_commit <nhãn>`: `git add -A` rồi commit `lab: <nhãn>` (cho phép rỗng).
  - `cmd_up`, `cmd_down`, `cmd_status`, `cmd_destroy` của driver `local`; `snapshot`, `images`, `mock` in "lệnh '<x>' không áp dụng cho chương trình '<p>' (driver local)" và thoát khác 0.

- [ ] **Bước 1: Viết test đỏ** trong `labs/tests/run.sh`, fixture `loc` (app gồm một `pom.xml` giả và một tệp nguồn). Mỗi ca chép fixture sang thư mục tạm rồi đặt `LAB_ROOT` vào đó, vì driver này có ghi. Các ca:
  - `up loc` tạo `work/` là kho git có đúng một commit `lab: bản gốc`; chạy lần hai không tạo commit mới.
  - `up loc` khi thiếu một lệnh trong `LAB_REQUIRE` → thoát khác 0, nêu tên lệnh.
  - `status loc` in đường dẫn workspace và nhãn commit cuối.
  - `destroy loc --yes` → `work/` biến mất, `backups/` có đúng một gói; `destroy loc` trả lời `n` → không đổi gì.
  - `work` là symlink trỏ ra ngoài → `up`, `destroy` từ chối, đích không bị đụng.
  - `snapshot loc x`, `images loc`, `mock loc m start` → thoát khác 0 với thông báo "không áp dụng".
  - Chương trình `loc` không gọi `multipass`: `MP_LOG` rỗng sau mọi ca trên; chạy được khi `PATH` không có `multipass`.
  - `LAB_DRIVER="kvm"` → từ chối.
- [ ] **Bước 2:** Chạy LABTEST, xác nhận các ca mới đỏ và 165 ca cũ vẫn xanh.
- [ ] **Bước 3:** Hiện thực. Trong `labs/lab`: `require_cmd multipass` và các `cmd_*` hiện có chỉ áp dụng cho driver `multipass`; `main` gọi `cmd_<lệnh>` của driver tương ứng. Cách đặt tên hàm và tách tệp do người làm quyết; `usage` mô tả lệnh theo cách đúng cho cả hai driver.
- [ ] **Bước 4:** LABTEST xanh toàn bộ. `./labs/lab help` vẫn liệt kê `cka`.
- [ ] **Bước 5:** Commit `feat(lab): driver local — workspace git, up/down/status/destroy`.

### Task 2: Lệnh theo buổi của driver `local` và trợ giúp chấm

**Files:**
- Modify: `labs/lib/local.sh`, `labs/lib/session.sh`, `labs/lib/assert.sh`, `labs/tests/run.sh`
- Create: `labs/tests/fixtures/loc/sessions/{ORDER,a1,a2,a3}/…`, `labs/tests/fixtures/loc/breaks/b1/run.sh`, `labs/tests/fixtures/surefire/*.xml`

**Interfaces:**
- Consumes: Task 1 (`ws_dir`, `ws_guard`, `ws_init`, `ws_commit`); `order_list`, `session_prev`, `require_session`, `run_script`, `check_input` trong `session.sh`.
- Produces — hợp đồng thư mục buổi của driver `local` (`labs/<p>/sessions/<id>/`):
  - `verify.sh` bắt buộc, kết thúc bằng `assert_summary`.
  - `solution/` — cây tệp chép đè lên workspace theo đúng đường dẫn tương đối; `solution.delete` — mỗi dòng một đường dẫn tương đối cần xoá. `apply.sh` tuỳ chọn, chạy sau khi chép `solution/`. Buổi đã phát hành phải có `solution/` hoặc `apply.sh`.
  - `tests/` — cây tệp test, chép vào workspace lúc `begin`; có tệp rỗng `tests.hidden` thì chép lúc `verify`.
  - `retire` — mỗi dòng một đường dẫn test cũ hết hiệu lực, gỡ lúc `begin` và trong chuỗi dựng lại.
  - `setup.sh`, `check.sh` tuỳ chọn như cũ. Script chạy với thư mục hiện hành là workspace, có sẵn `WS` (đường dẫn workspace), `SESSION_DIR`, các hàm assert; không có `vm`.
- Produces — hàm:
  - `ws_backup`: commit mọi thay đổi (kể cả tệp chưa theo dõi) rồi tạo nhánh `backup/<YYYYmmdd-HHMMSS>`; in tên nhánh. Trùng tên thì thêm hậu tố, không ghi đè.
  - `ws_build <id>`: đưa cây làm việc về bản gốc rồi áp lời giải của mọi buổi từ đầu `ORDER` tới `<id>` (chép `tests/`, gỡ `retire`, chép `solution/`, xoá theo `solution.delete`, chạy `apply.sh`).
  - `cmd_begin`: `check_input` → `ws_commit "trước buổi <id>"` → `setup.sh` → chép `tests/` (trừ khi ẩn) → gỡ `retire` → `ws_commit "đầu buổi <id>"`.
  - `cmd_verify`: chép `tests/` nếu ẩn → `verify.sh`; đạt hết thì `ws_commit "xong buổi <id>"`.
  - `cmd_restore <id>`: liệt kê việc sẽ làm, hỏi xác nhận (trừ `--yes`), `ws_backup`, `ws_build <id>`, `ws_commit "khôi phục về cuối buổi <id>"`, chạy `verify.sh` của `<id>`; in tên nhánh sao lưu.
  - `cmd_break <mã>`: `ws_commit "trước sự cố <mã>"` rồi chạy `breaks/<mã>/run.sh`.
  - `cmd_selftest`: dùng workspace tạm (`LAB_WORK_DIR` = `mktemp -d`), với từng buổi có thư mục script theo `ORDER`: `begin` → `verify` **phải đỏ** → áp lời giải của buổi → `verify` **phải xanh** → chạy `selftest.sh` của chương trình nếu có (để chương trình chạy toàn bộ test còn hiệu lực). Không đụng `work/` của người học. In thời gian tổng.
  - Trong `assert.sh`: `lab_tests <thư mục báo cáo>` ghi nhớ nơi đọc báo cáo surefire; `expect_test "<nhãn>" "<lớp>#<phương thức>"` đạt khi đúng testcase đó có trong báo cáo và không có `failure`, `error`, `skipped`. Không thấy testcase là ✗ với lý do "không chạy".
  - `lab_mvn <đối số…>`: chạy `mvn` trong workspace sau khi **xoá báo cáo surefire cũ** của các module liên quan; trả mã của Maven.

- [ ] **Bước 1: Viết test đỏ** với stub `mvn` (ghi lời gọi vào log; theo biến môi trường thì chép một bộ XML mẫu vào `target/surefire-reports/` hoặc trả lỗi biên dịch mà không sinh báo cáo). Các ca:
  - `begin loc a1` trên workspace mới: test của a1 xuất hiện, có commit `lab: đầu buổi a1`.
  - `verify loc a1` khi báo cáo có một testcase lỗi → dòng đó ✗, tổng `1/2`, mã khác 0, không có commit "xong buổi".
  - `verify` khi Maven lỗi biên dịch và **còn báo cáo cũ toàn đạt từ lần trước** → mọi dòng ✗ (Review Focus 3).
  - `verify` đạt hết → commit `lab: xong buổi a1`.
  - `begin loc a2` khi a1 chưa đạt → từ chối, gợi ý `./labs/lab restore loc a1`.
  - `restore loc a2 --yes` trên workspace có một tệp sửa chưa commit và một tệp mới chưa theo dõi → cả hai còn nguyên nội dung trong nhánh `backup/*` vừa in; cây làm việc bằng đúng bản gốc + lời giải a1, a2; `retire` của a2 đã gỡ test cũ.
  - `restore loc a2` trả lời `n` → không commit, không nhánh mới.
  - Hai lần `restore` liên tiếp trong cùng một giây → hai nhánh sao lưu khác tên.
  - `solution/` chứa đường dẫn có `..` hoặc `solution.delete` có dòng `../x` → từ chối, không ghi gì ngoài workspace (Review Focus 2).
  - `break loc b1` → có commit `lab: trước sự cố b1` trước thay đổi của `run.sh`.
  - `selftest loc` → `work/` của fixture không đổi (so `git rev-parse HEAD` và trạng thái cây); báo lỗi khi một buổi xanh ngay sau `begin`; báo lỗi khi lời giải không làm xanh.
  - a3 có `tests.hidden`: sau `begin` chưa có test, sau `verify` có và đã commit.
  - `expect_test` với XML mẫu: testcase đạt, lỗi `failure`, `error`, `skipped`, không tồn tại; tên lớp chứa dấu chấm và `$`.
- [ ] **Bước 2:** LABTEST: ca mới đỏ, ca cũ xanh.
- [ ] **Bước 3:** Hiện thực. `check_input` dùng chung; phần "VM phải đang chạy" (`require_running`) thay bằng "workspace phải tồn tại" cho driver `local`.
- [ ] **Bước 4:** LABTEST xanh toàn bộ.
- [ ] **Bước 5:** Commit `feat(lab): driver local — begin/verify/restore/break/selftest và expect_test`.

### Task 3: Web và bất biến hiểu chương trình theo sách, chạy cục bộ

**Files:**
- Modify: `webapp/scripts/check-data.mjs`, `webapp/js/views/practice.js`, `webapp/js/lib/practice.js` (nếu cần), `webapp/css/style.css` (nếu cần), `webapp/scripts/tests/practice.test.mjs`, `webapp/scripts/tests/fixtures/program.mjs`

**Interfaces:**
- Produces — trường dữ liệu mới, tất cả tuỳ chọn với chương trình cũ:
  - `program.env.tool`: `"multipass"` (mặc định) hoặc `"local"`.
  - `program.labels`: `{ workBlock, startStep }` — tiêu đề khối luyện tập trên trang buổi khi chương trình không có `exam` (vd "🧩 Trong công việc"), và tiêu đề bước 1 trên trang chủ chương trình (vd "Chuẩn bị workspace"). Thiếu thì dùng chữ hiện có.
  - `program.book`: `{ label, docPrefix }` — chương trình theo sách. Khi có: mỗi buổi đã phát hành phải có ít nhất một `refs[].href` bắt đầu bằng `#/docs/<docPrefix>`.
  - `program.rules`: `{ diagram: true, dissect: true }` — khi `diagram`, `mindset` của buổi đã phát hành phải chứa một khối ```` ```mermaid ````; khi `dissect`, buổi đã phát hành phải có ít nhất một `tasks[]` mang `kind: "dissect"`.
  - `session.work`: `{ patterns: string[], timeTargetMin: number }` — tương đương `session.exam` cho chương trình không có đề; bắt buộc với buổi đã phát hành của chương trình không có `exam`. View đọc `session.exam ?? session.work`.
  - `session.bookDiff`: `[{ book, now, why }]` — tuỳ chọn; trang buổi hiện khối "📕 Khác với sách" ngay sau khối tư duy.
  - `tasks[].kind`: `"dissect"` hiện một nhãn nhỏ "mổ xẻ" cạnh nhiệm vụ.
- PR11 theo driver: với `env.tool === "local"`, buổi đã phát hành cần `verify.sh` và (`solution/` hoặc `apply.sh`); không xét `milestones`. Với `multipass` giữ nguyên.
- Các quy tắc trên nằm trong PR8 và PR11 sẵn có; số bất biến giữ 73 trừ khi thật cần.

- [ ] **Bước 1: Test đỏ** trong `practice.test.mjs` với một chương trình fixture không có `exam`, có `labels`, `book`, `rules`, một buổi có `work`, `bookDiff`, nhiệm vụ `dissect`: các hàm thuần trong `lib/practice.js` mà view dùng cho khối luyện tập trả đúng dữ liệu từ `work`; chương trình cũ không có các trường mới cho kết quả như trước.
- [ ] **Bước 2:** Hiện thực view và `check-data.mjs`. Thêm ca kiểm tiêu cực cho các quy tắc mới theo đúng cách `check-data.mjs` đang tự kiểm (nếu tệp có cơ chế đó), nếu không thì kiểm tay bằng cách tạm sửa dữ liệu fixture và ghi kết quả vào báo cáo.
- [ ] **Bước 3:** CHECK 73/73 (hoặc số mới, đã cập nhật mọi nơi), UNIT xanh. PR12 vẫn đạt: phần dùng chung không chứa `ssia`, `cka`, "Spring".
- [ ] **Bước 4:** Commit `feat(practice): chương trình theo sách chạy cục bộ — labels, book, rules, work, bookDiff`.

### Task 4: Bản gốc `labs/ssia/app` và môi trường chương trình

**Files:**
- Create: `labs/ssia/env.sh`, `labs/ssia/app/**` (sao từ `labs/cka/app/`, bỏ `Dockerfile` nếu không dùng), `labs/ssia/sessions/ORDER` (rỗng tạm, điền ở Task 5)

**Interfaces:**
- Consumes: Task 1.
- Produces: `./labs/lab up ssia` tạo `labs/ssia/work/` biên dịch và test được bằng JDK 21; service `order` chạy bằng `mvn -pl order spring-boot:run` trên cổng khai trong `LAB_PORTS`, dùng H2 khi không có `DB_URL`. Tệp `labs/ssia/app/VERSIONS.md` ghi phiên bản thực tế: Spring Boot, Spring Security, Spring Framework, và toạ độ Maven của authorization server ở dòng này (đọc từ `mvn dependency:tree` và trang tài liệu chính thức; nếu Boot 4.1.x không còn bản nào trên Maven Central thì dùng bản 4.x mới nhất có thật và ghi lại).

- [ ] **Bước 1:** Sao app, đặt `java.version` 21, đổi `artifactId`/tên cho khỏi nhầm với bản CKA nếu cần. Giữ nguyên hành vi nghiệp vụ của ba service. Không thêm bảo mật.
- [ ] **Bước 2:** `./labs/lab up ssia`; trong `labs/ssia/work`: `mvn -q test` xanh; chạy `order`, gọi `curl` một endpoint đọc và `/actuator/health`, ghi output vào báo cáo.
- [ ] **Bước 3:** Viết `VERSIONS.md` từ số liệu thật. Ghi mức RAM của một JVM `order` đang chạy (`ps -o rss`).
- [ ] **Bước 4:** CHECK vẫn xanh (PR11 chưa biết `ssia` vì chưa đăng ký chương trình). LABTEST xanh.
- [ ] **Bước 5:** Commit `feat(lab): chương trình ssia — bản gốc shop cho Spring Security, env local`.

### Task 5: Khung chương trình `ssia` trong app

**Files:**
- Create: `webapp/js/data/practice/ssia/{program.js,skills.js,mocks.js,stage-02.js … stage-18.js}`
- Modify: `webapp/js/data/practice/index.js`, `webapp/scripts/check-data.mjs` (bảng kỳ vọng: `practice-sessions:ssia` 53, `practice-published:ssia` 0), `labs/ssia/sessions/ORDER`

**Interfaces:**
- Consumes: Task 3 (trường mới), Task 4 (`VERSIONS.md` cho phần mô tả môi trường).
- Produces: chương trình `ssia` đăng ký trong `PROGRAMS`; id buổi `s01` … `s53`; id chặng `st02` … `st18`; mảng kỹ năng và tiền tố theo spec 4.6 (`config`/`cfg-`, `internals`/`int-`, `protocol`/`pro-`, `diagnose`/`dx-`, `testing`/`tst-`); `mocks = []`; `env.commands` cho `up, down, status, begin, check, verify, restore, break, selftest, destroy` dạng `./labs/lab <lệnh> ssia …`.

Phân bổ buổi (tổng 53):

| Chặng | Chương sách | Buổi | Ghi chú |
|---|---|---|---|
| st02 | 2 | s01–s03 | |
| st03 | 3 | s04–s06 | |
| st04 | 4 | s07–s08 | |
| st05 | 5 | s09–s11 | |
| st06 | 6 | s12–s16 | s16 tự làm từ đầu |
| st07 | 7 | s17–s18 | |
| st08 | 8 | s19–s20 | |
| st09 | 9 | s21–s23 | |
| st10 | 10 | s24–s25 | |
| st11 | 11 | s26–s28 | |
| st12 | 12 | s29–s31 | s31 tự làm từ đầu |
| st13 | 13 | s32–s34 | |
| st14 | 14 | s35–s38 | |
| st15 | 15 | s39–s42 | |
| st16 | 16 | s43–s47 | s46–s47 tự làm từ đầu |
| st17 | 17 | s48–s50 | |
| st18 | 18 | s51–s53 | |

- [ ] **Bước 1:** Đọc mục lục từng chương trong `sources/spring-security/NN-*.md` (tiêu đề `##` và `###`) để đặt tên buổi và mục tiêu bám đúng mục sách. Mỗi buổi khung có đủ trường PR7: `id, stage, title, domain: null, durationMin, status: "skeleton", competencies: [], requires, uses, pieces, goals, skills (≥2), stateIn, stateOut`, cộng `refs` trỏ `#/docs/springsec-NN`.
- [ ] **Bước 2:** `skills.js`: mỗi kỹ năng học ở đúng một buổi (PR5), `ref` để trống. `program.project`: tóm tắt, sơ đồ mermaid của trạng thái cuối (auth server, gateway là client, hai resource server), và `pieces` gắn vào các buổi qua `session.pieces` sao cho mỗi mảnh hoàn thành ở đúng một buổi (PR6).
- [ ] **Bước 3:** `program.js`: `field: "spring-security"`, không `exam`, `env.tool: "local"`, `labels`, `book: { label: "Spring Security in Action, ấn bản 2", docPrefix: "springsec-" }`, `rules: { diagram: true, dissect: true }`.
- [ ] **Bước 4:** CHECK xanh, UNIT xanh. Kiểm trình duyệt (`./webapp/scripts/dev.sh 8899`, playwright-core + Chrome headless): `#/practice` liệt kê hai chương trình; trang chủ `ssia`, một buổi khung, bản đồ kỹ năng, trang Project hiện đúng, không lỗi console, không có chữ "đề thi", "VM", "cluster"; 380px không cuộn ngang; hai theme; trang CKA như cũ.
- [ ] **Bước 5:** Commit `feat(practice): khung chương trình Spring Security in Action — 17 chặng, 53 buổi`.

### Task 6: Chặng st02 — Hello Spring Security (s01–s03)

**Files:**
- Modify: `webapp/js/data/practice/ssia/stage-02.js`, `skills.js` (nếu nhãn cần chỉnh theo thực tế), `check-data.mjs` (`practice-published:ssia` → 3)
- Create: `labs/ssia/sessions/{s01,s02,s03}/{verify.sh,solution/**,tests/**,[setup.sh],[retire]}`, `labs/ssia/breaks/<mã>/run.sh` nếu buổi dùng `break`, `labs/ssia/selftest.sh`

**Interfaces:**
- Consumes: Task 2 (hợp đồng buổi, `expect_test`, `lab_mvn`), Task 3 (trường `work`, `bookDiff`, `tasks[].kind`), Task 4 (app).
- Produces: quy ước dùng cho mọi buổi sau — test của buổi `<id>` nằm ở `order/src/test/java/lab/<id>/…` (package `lab.<id>`), `verify.sh` gọi `lab_mvn -q -pl order -am test -Dtest='lab.<id>.*' -Dsurefire.failIfNoSpecifiedTests=false` một lần rồi một dòng `expect_test` cho mỗi kiểm tra; tệp trả lời của nhiệm vụ mổ xẻ ở `answers/<id>.env` trong workspace (dạng `KHOÁ=giá trị`), test đọc tệp này và so với giá trị đo từ context đang chạy; `labs/ssia/selftest.sh` chạy `mvn -q test` toàn workspace.

Bảng "người học làm / `verify` kiểm" — khung; người làm hoàn thiện sau khi quan sát hành vi thật:

| Buổi | Mục sách | Người học làm | `verify` kiểm (hộp đen) |
|---|---|---|---|
| s01 | 2.1 | Thêm starter security vào `order`; quan sát mật khẩu sinh ra, 401, HTTP Basic. Mổ xẻ: liệt kê filter của chain mặc định theo đúng thứ tự trên app đang chạy | Endpoint nghiệp vụ trả 401 khi không có credential; trả 200 với Basic đúng; câu trả lời về số filter và filter đứng ngay trước/sau một filter cho trước khớp `FilterChainProxy` thật |
| s02 | 2.2 | Lần một request bằng debugger qua filter → `AuthenticationManager` → `AuthenticationProvider` → `UserDetailsService` → `PasswordEncoder` → `SecurityContext`. Tình huống hỏng: cấu hình thiếu `PasswordEncoder` hoặc mật khẩu không có tiền tố mã hoá, đọc lỗi và sửa | Câu trả lời về lớp cụ thể của provider, của `UserDetailsService`, của encoder khớp các bean thật; đăng nhập đúng sau khi sửa |
| s03 | 2.3 | Ghi đè mặc định: `SecurityFilterChain` riêng, `UserDetailsService` và `PasswordEncoder` là bean; mở `/actuator/health`, chặn phần còn lại; tách cấu hình thành lớp riêng | `/actuator/health` 200 không cần đăng nhập; endpoint nghiệp vụ 401/200 đúng; có đúng một `SecurityFilterChain` do người học khai; user cấu hình đăng nhập được |

- [ ] **Bước 1:** Với từng buổi: viết `tests/` và `verify.sh`; chạy `./labs/lab begin ssia <id>` rồi `verify` → **đỏ**, ghi output vào báo cáo.
- [ ] **Bước 2:** Viết `solution/`; áp vào workspace; `verify` → **xanh**; lấy output làm `verifyOutput`.
- [ ] **Bước 3:** Viết nội dung đầy đủ theo PR8 và spec 4.5: `mindset` có sơ đồ mermaid của luồng trọng tâm (vẽ từ những gì quan sát được bằng debugger hoặc log `TRACE` của `org.springframework.security`), `tasks` (≥3, có ≥1 `kind: "dissect"`), `hints`, `solution` theo trình tự chẩn đoán, `tips`, `work` (tình huống công việc + thời gian mục tiêu), 2 drill có `timeLimitMin`, `outcome`, `review` 3–5 câu, `refs` có `#/docs/springsec-02` kèm số mục và trang tham chiếu chính thức đúng phiên bản, `bookDiff` ở chỗ sách khác hiện hành (kiểm từng điểm trên app thật trước khi viết).
- [ ] **Bước 4:** `./labs/lab selftest ssia` xanh cho s01–s03. `restore ssia s02` trên workspace có sửa đổi dở: sửa đổi còn trong nhánh sao lưu.
- [ ] **Bước 5:** CHECK, UNIT, LABTEST xanh; kiểm trình duyệt ba trang buổi (khối đủ, mermaid vẽ được, 380px, hai theme, không lỗi console).
- [ ] **Bước 6:** Commit `feat(practice): chặng st02 — Hello Spring Security (3 buổi)`.

### Task 7: Chặng st03 — Quản lý user (s04–s06)

**Files:** như Task 6, cho `stage-03.js`, `labs/ssia/sessions/{s04,s05,s06}/`; `practice-published:ssia` → 6.

**Interfaces:** Consumes quy ước của Task 6. Tên cố định nào test cần (bảng, cột, endpoint) phải ghi rõ trong nhiệm vụ và dùng đúng trong `solution/`.

| Buổi | Mục sách | Người học làm | `verify` kiểm (hộp đen) |
|---|---|---|---|
| s04 | 3.1–3.2 | Mô tả user của shop: thực thể user riêng và lớp bọc thành `UserDetails`; `GrantedAuthority`. Mổ xẻ: `Authentication` sau đăng nhập chứa principal kiểu gì, authority nào | Sau đăng nhập, principal là một `UserDetails` với authority đúng như dữ liệu; câu trả lời khớp đối tượng thật |
| s05 | 3.3 | `UserDetailsService` tự viết đọc user từ DB (H2); user không tồn tại và user bị khoá. Tình huống hỏng: `UsernameNotFoundException` bị che thành "Bad credentials" — vì sao, cấu hình nào điều khiển | User trong DB đăng nhập được; user bị khoá bị từ chối với đúng mã trạng thái; không còn user trong bộ nhớ |
| s06 | 3.3 | `UserDetailsManager`: tạo user, đổi mật khẩu; so với `JdbcUserDetailsManager` có sẵn và lược đồ mặc định của nó | Tạo user qua endpoint (tên endpoint ghi trong nhiệm vụ) rồi đăng nhập được; đổi mật khẩu thì mật khẩu cũ bị từ chối |

- [ ] **Bước 1–6:** như Task 6 (đỏ → lời giải → xanh → nội dung → selftest s01–s06 → kiểm → commit `feat(practice): chặng st03 — Quản lý user (3 buổi)`). Khi buổi này đổi hành vi làm test của st02 hết đúng, khai trong `retire` và giải thích trong nội dung buổi.

### Task 8: Chặng st04 — Quản lý mật khẩu (s07–s08)

**Files:** như Task 6, cho `stage-04.js`, `labs/ssia/sessions/{s07,s08}/`; `practice-published:ssia` → 8.

| Buổi | Mục sách | Người học làm | `verify` kiểm (hộp đen) |
|---|---|---|---|
| s07 | 4.1 | So các `PasswordEncoder`; `DelegatingPasswordEncoder` và tiền tố `{id}`; chuyển dần mật khẩu băm kiểu cũ sang thuật toán hiện hành khi user đăng nhập. Mổ xẻ: encoder nào thực sự được gọi cho từng user | User có băm kiểu cũ vẫn đăng nhập được; sau lần đăng nhập đó băm trong DB đã mang tiền tố của thuật toán mới; mật khẩu sai vẫn bị từ chối |
| s08 | 4.2 | Crypto module: sinh khoá, mã hoá một trường nhạy cảm của đơn hàng khi lưu và giải mã khi đọc | Giá trị trong DB không phải bản rõ; API trả đúng bản rõ cho chủ dữ liệu; hai lần mã hoá cùng bản rõ cho hai bản mã khác nhau nếu thuật toán chọn có salt/IV |

- [ ] **Bước 1–6:** như Task 6; `selftest ssia` đi trọn s01–s08, ghi thời gian vào `labs/ssia/README.md` (tạo ở Task 9 nếu chưa có); commit `feat(practice): chặng st04 — Quản lý mật khẩu (2 buổi)`.

### Task 9: Tài liệu và nghiệm thu đợt 1

**Files:**
- Modify: `README.md`, `webapp/README.md`, `labs/README.md`
- Create: `labs/ssia/README.md`

- [ ] **Bước 1:** `labs/README.md`: mục driver (`multipass` và `local`), hợp đồng buổi của `local`, quy tắc an toàn và sao lưu, bảng lệnh ghi rõ lệnh nào áp dụng cho driver nào; cập nhật "Giới hạn hiện tại" cho đúng với code sau đợt này. `labs/ssia/README.md`: yêu cầu máy, phiên bản (dẫn `app/VERSIONS.md`), cách bắt đầu, cách lấy lại code từ nhánh sao lưu, thời gian `selftest`. `webapp/README.md`: các trường dữ liệu mới và cách thêm một chương trình theo sách. `README.md` gốc: một dòng về chương trình mới.
- [ ] **Bước 2: Nghiệm thu:** CHECK, UNIT, LABTEST xanh; `./labs/lab selftest ssia` xanh; đi trọn buổi s01 trong trình duyệt (tick, ghi chú, đánh dấu xong, thấy ở s02), xuất/nhập tiến độ giữ nguyên các khoá `practice.*`, 380px, hai theme; trang CKA như cũ; `docker compose up --build` build được, image không chứa `labs/`, rồi `docker compose down`.
- [ ] **Bước 3:** Commit `docs(practice): README cho driver local và chương trình ssia`.

---

## Các đợt sau (khuôn lặp, không thuộc plan này)

Mỗi đợt một nhóm chương theo khuôn Task 6: st05–st06; st07–st10; st11–st12; st13–st14 (thêm module `auth`, cách bật nhiều service lúc chấm, đo RAM); st15–st16; st17–st18.
