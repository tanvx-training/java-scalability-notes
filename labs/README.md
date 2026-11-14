# 🛠️ Labs — bộ lệnh `lab` cho module Thực hành

Thư mục này là phần chạy trên máy bạn của module **Thực hành** trong DevPrep (`#/practice`). Web app chỉ hiển thị đề bài, gợi ý và lời giải; còn **dựng môi trường, đặt bài, chấm kết quả** là việc của `./labs/lab`, một CLI bash. Mỗi chương trình chọn một **driver**: `multipass` điều khiển các VM [Multipass](https://canonical.com/multipass), `local` làm việc trong một workspace git ngay trên máy bạn (xem mục [Driver](#driver)).

Mỗi chương trình thực hành có một thư mục riêng `labs/<chương trình>/`. Hiện có hai chương trình:

| Chương trình | Driver | Ghi chú riêng |
|---|---|---|
| `cka` | `multipass` | Dựng và vận hành một hệ Spring Boot trên cluster kubeadm 3 VM: [`cka/README.md`](cka/README.md) |
| `ssia` | `local` | Spring Security in Action trên ứng dụng shop chạy bằng JDK + Maven: [`ssia/README.md`](ssia/README.md) |

Phần dùng chung (`lab`, `lib/`) không biết gì về chương trình cụ thể nào: mọi thứ riêng nằm trong `labs/<chương trình>/`.

## Yêu cầu máy

| Cần | Cho | Ghi chú |
|---|---|---|
| macOS, `/bin/bash` 3.2 có sẵn | cả hai driver | Script trong `labs/` viết cho bash 3.2 của macOS (không mảng kết hợp, không `mapfile`). Script chạy bên trong VM thì không bị ràng buộc này |
| [Multipass](https://canonical.com/multipass) | `multipass` | `brew install --cask multipass`; `lab` báo lỗi rõ nếu thiếu. Driver `local` không gọi và không đòi `multipass` |
| Docker (Docker Desktop hoặc OrbStack) | `multipass`; `local` khi chương trình khai compose | Với `cka`: cần cho `lab images` (build rồi nạp image ứng dụng vào VM), và cho `selftest`/`restore` khi chuỗi buổi có buổi nạp image (`apply.sh` của s05 và s06). Với `local`: chỉ khi `env.sh` khai `LAB_COMPOSE_FILE` (`ssia` hiện không khai) |
| Các lệnh trong `LAB_REQUIRE` | `local` | `up` kiểm từng lệnh và dừng nếu thiếu. `ssia` khai `git java mvn` |
| Tài nguyên cho chương trình `cka` | `cka` | Ba VM: `cka-cp` 2 vCPU, 3G RAM, 20G đĩa; `cka-w1` và `cka-w2` mỗi máy 2 vCPU, 2G RAM, 15G đĩa. Tổng 6 vCPU, 7G RAM, 50G đĩa; image Ubuntu 24.04 |

Image ứng dụng của `cka` build cho `linux/arm64`, tức máy Mac Apple Silicon.

## Driver

`labs/<chương trình>/env.sh` khai `LAB_DRIVER`. Không khai thì là `multipass`, nên chương trình cũ chạy như trước; giá trị khác `multipass` và `local` bị từ chối ngay khi nạp chương trình.

| | `multipass` | `local` |
|---|---|---|
| Môi trường | Các VM Multipass có tên trong `LAB_VMS`, đều bắt đầu bằng `LAB_PREFIX` | Workspace `labs/<ct>/work/`: bản chép của `labs/<ct>/<LAB_APP_DIR>/` (mặc định `app/`), tự nó là một **kho git riêng** do `lab` tạo. Repo này bỏ qua `labs/*/work/` và `labs/*/backups/` |
| Script buổi chạy ở đâu | Trên Mac, lệnh vào VM qua `vm <tên-vm> "<lệnh>"` | Trên Mac, thư mục hiện hành là workspace (biến `WS`); không có `vm`, `vm_put` |
| Lời giải chuẩn | `apply.sh` của mỗi buổi | `solution/` (cây tệp chép đè), `solution.delete`, tuỳ chọn `apply.sh` |
| Chấm | `expect_*` chạy lệnh (thường qua `vm`) | `lab_mvn` chạy Maven một lần, `expect_test` đọc báo cáo JUnit của Surefire |
| Dựng lại về cuối một buổi | Snapshot mốc (`milestones`) hoặc xoá VM rồi áp `apply.sh` từ đầu | Đưa workspace về commit `lab: bản gốc` rồi áp lời giải các buổi từ đầu; code của bạn vào nhánh `backup/<thời điểm>` trước |
| Biến riêng trong `env.sh` | `LAB_PREFIX`, `LAB_VMS`, `LAB_CP`, `LAB_IMAGE`, `lab_vm_spec`, `LAB_IMAGES`, `lab_build_images`, `LAB_CTR_NAMESPACE` | `LAB_APP_DIR`, `LAB_REQUIRE`, `LAB_PORTS`, `LAB_COMPOSE_FILE` + `LAB_COMPOSE_PROJECT` (phải đi cùng nhau) |

## ⚠️ Cảnh báo về tiền tố VM (driver `multipass`)

Mỗi chương trình driver `multipass` khai một **tiền tố** (`LAB_PREFIX`, ví dụ `cka-`) trong `labs/<chương trình>/env.sh`. Mọi VM mà `lab` đụng tới đều phải có tên bắt đầu bằng tiền tố đó, nên các VM Multipass có sẵn của bạn (đặt tên khác, ví dụ `cp1`, `w1`, `w2`) **không bao giờ bị `lab` khởi động, dừng, chụp snapshot hay xoá**.

Cách bảo đảm điều này:

- Mọi lời gọi `multipass` trong `labs/` đi qua hàm bao `mp` (`labs/lib/multipass.sh`). Hàm này từ chối mọi tên không bắt đầu bằng `LAB_PREFIX`, kể cả dạng `tên.snapshot` và `tên:đường-dẫn`, và chỉ cho phép một danh sách tuỳ chọn đã biết cho từng lệnh con.
- Khi nạp chương trình, `lab` từ chối nếu `LAB_PREFIX` rỗng hay sai dạng (cần `chữ-thường-hoặc-số` rồi dấu `-`), hoặc nếu có VM trong `LAB_VMS` không bắt đầu bằng tiền tố.

Vì vậy: **không** đặt tên VM riêng của bạn bắt đầu bằng `cka-`, và khi viết chương trình mới hãy chọn tiền tố không trùng VM nào bạn đang dùng. `destroy` xoá hẳn mọi VM có tên trong `LAB_VMS` của chương trình đó (có hỏi trước), không hơn.

## Các lệnh

Chạy từ **gốc repo**: `./labs/lab <lệnh> <chương trình> [đối số…]`. Chạy `./labs/lab help` để xem danh sách và các chương trình có sẵn.

Mỗi lệnh làm một việc khác nhau tuỳ driver của chương trình:

| Lệnh | Driver `multipass` | Driver `local` |
|---|---|---|
| `up <ct>` | Tạo VM chưa có (đúng cấu hình của chương trình), khởi động VM đang dừng, chờ tới khi tất cả Running. Chạy lại an toàn | Kiểm các lệnh trong `LAB_REQUIRE`; workspace chưa có thì chép bản gốc vào `labs/<ct>/work/`, `git init` và commit `lab: bản gốc`; khai compose thì `docker compose up -d`; rồi in như `status`. Chạy lại an toàn (workspace đã có thì giữ nguyên) |
| `down <ct>` | Dừng các VM đang chạy, giữ nguyên dữ liệu | Khai compose thì `docker compose down`; không thì báo không có gì để dừng. Không dừng tiến trình `java` bạn tự bật |
| `status <ct>` | Bảng tên, trạng thái, IPv4 của từng VM | Đường dẫn workspace, nhãn commit cuối, và từng cổng trong `LAB_PORTS` đang trống hay đang được dùng |
| `destroy <ct>` | Xoá hẳn (purge) các VM của chương trình. Liệt kê VM rồi hỏi `y/N`; `--yes` để bỏ hỏi | Hỏi `y/N` (`--yes` để bỏ hỏi), đóng gói cả workspace, kể cả kho git của nó, vào `labs/<ct>/backups/<ct>-<YYYYmmdd-HHMMSS>.tar.gz`, đọc lại gói, rồi mới xoá `work/` |
| `check <ct> <buổi>` | Kiểm **đầu vào** của buổi, không sửa gì. VM phải đang chạy; rồi chạy `check.sh` của buổi nếu có, nếu không thì `verify.sh` của buổi đứng trước trong `ORDER`. Buổi đầu tiên chỉ đòi VM đang chạy | Như bên trái, nhưng thay "VM đang chạy" bằng "workspace đã có". `verify.sh` của buổi trước chạy Maven trong workspace, nên chỉ ghi vào `target/` |
| `begin <ct> <buổi>` | `check` rồi chạy `setup.sh` của buổi (nếu có): đặt tệp bài tập, hoặc gây lỗi cho buổi sự cố. Đầu vào chưa đạt thì dừng và gợi ý `restore` về buổi trước | `check`; chưa đạt thì dừng, gợi ý `restore` về buổi trước, không ghi gì. Đạt thì commit `lab: trước buổi <buổi>`, chạy `setup.sh` (nếu có), chép `tests/` của buổi vào workspace (trừ khi buổi có `tests.hidden`), gỡ các test liệt kê trong `retire`, rồi commit `lab: đầu buổi <buổi>`. Không chép lời giải: bạn xây tiếp trên code của chính bạn. Buổi đã bắt đầu (lịch sử có `lab: đầu buổi <buổi>` mà sau đó không có `restore` về một buổi đứng trước) hoặc đã nằm trong một lần `restore` về chính nó hay buổi sau: `begin` và `check` chỉ báo, trả 0, không chạy kiểm đầu vào, không commit, không chép đè gì; muốn làm lại từ đầu thì `restore` về buổi trước rồi `begin` |
| `verify <ct> <buổi>` | Chạy `verify.sh` của buổi, thoát mã 0 khi mọi mục đạt. Có buổi (với `cka`: s07, s09) chép một script trợ giúp vào `/tmp` của control plane và tạo một **namespace tạm** có Pod; namespace bị xoá trước khi `verify` thoát. `check` chạy `verify` của buổi trước nên cũng vậy | Buổi có `tests.hidden` thì commit `lab: trước khi chấm <buổi>` (nếu có thay đổi) rồi chép `tests/` vào. Chạy `verify.sh`; đạt hết thì commit `lab: xong buổi <buổi>` |
| `restore <ct> <buổi>` | Đưa VM về trạng thái sau khi hoàn thành buổi đó (xem bên dưới). Hỏi xác nhận, `--yes` để bỏ hỏi | Hỏi xác nhận (`--yes` để bỏ hỏi), commit mọi thay đổi (kể cả tệp chưa theo dõi) thành `lab: sao lưu trước khi khôi phục` và tạo nhánh `backup/<YYYYmmdd-HHMMSS>`, đưa cây làm việc về bản gốc (xoá cả `target/` cạnh mỗi `pom.xml`), áp lời giải các buổi từ đầu `ORDER` tới buổi đích, commit `lab: khôi phục về cuối buổi <buổi>`, chạy `verify.sh` của buổi đích, rồi in tên nhánh sao lưu |
| `break <ct> <mã-lỗi>` | Gây một lỗi có chủ ý, theo `labs/<ct>/breaks/<mã-lỗi>/run.sh`, để luyện sự cố | Commit `lab: trước sự cố <mã-lỗi>` rồi mới chạy `breaks/<mã-lỗi>/run.sh` trong workspace |
| `selftest <ct>` | `selftest <ct> [--from <buổi>]`: lần lượt chạy `apply.sh` rồi `verify.sh` của mọi buổi. Không có `--from` thì **xoá và dựng lại** VM sạch trước (có hỏi). Có `--from` thì dùng VM đang chạy và bắt đầu từ buổi đó. Dừng ở lỗi đầu tiên | Không nhận đối số. Dựng một workspace tạm trong thư mục tạm của hệ thống (không đụng `work/` của bạn, xoá khi xong), rồi với mỗi buổi có thư mục: `begin` (chỉ chạy `check.sh` nếu buổi có, không chạy lại `verify.sh` của buổi trước vì nó vừa xanh), `verify` phải **đỏ**, áp lời giải, `verify` phải **xanh**. Cuối chuỗi chạy `labs/<ct>/selftest.sh` (nếu có) một lần. In tổng thời gian. Dừng ở lỗi đầu tiên (xem [hợp đồng](#hợp-đồng-buổi-của-driver-local)) |
| `mock <ct> <đề> start` | Bắt đầu một đề mock: chạy `mocks/<đề>/setup.sh` | Không áp dụng: báo lỗi, mã khác 0 |
| `mock <ct> <đề> score` | Chấm đề: chạy `mocks/<đề>/score.sh`, in bảng điểm theo domain và một dòng `devprep-mock:v1:…` để dán vào trang Thực hành | Không áp dụng |
| `snapshot <ct> <tên>` | Dừng VM, chụp snapshot cùng tên cho mọi VM của chương trình (ghi đè nếu đã có, có hỏi), rồi bật lại | Không áp dụng |
| `images <ct>` | Chọn các VM đang chạy và đã có containerd, rồi mới build (nếu chưa có) và nạp image ứng dụng vào containerd của từng VM đó, trong namespace `LAB_CTR_NAMESPACE` của chương trình. Không VM nào nhận được thì dừng với mã khác 0, không build gì | Không áp dụng |
| `help` | In trợ giúp và các chương trình có sẵn | như bên trái |

Với mọi lệnh, thêm `--yes` hoặc `-y` để bỏ các câu hỏi xác nhận. `up`, `down`, `status`, `destroy`, `images` không nhận đối số nào ngoài tên chương trình; với driver `local`, `selftest` cũng vậy.

### `restore` và mốc snapshot (driver `multipass`)

Chương trình có thể khai các **mốc** trong tệp `labs/<ct>/milestones`, mỗi dòng `<id buổi> <tên snapshot>`. `selftest` chụp snapshot ngay sau khi buổi mốc qua `verify`; bạn cũng có thể tự chụp bằng `snapshot`.

`restore <ct> <buổi>` làm theo thứ tự sau:

1. Tìm mốc gần nhất tại hoặc trước buổi đích mà **mọi** VM đều có snapshot.
2. Có mốc: khôi phục mọi VM về snapshot đó, rồi bật lên. **Áp lại `apply.sh` của chính buổi mốc**, rồi `apply.sh` của các buổi sau mốc cho tới buổi đích. Lý do: snapshot chụp lúc VM đã dừng nên phần không bền của kết quả buổi mốc (netns, container chạy bằng tay…) không có trong đó; `apply.sh` chạy lại được nên áp lại là an toàn.
3. Không có mốc (ví dụ buổi đích đứng trước mốc đầu tiên): xoá hẳn và dựng lại VM, rồi áp `apply.sh` từ buổi đầu tới buổi đích. **Xoá VM là mất luôn mọi snapshot của nó, kể cả mốc của các buổi sau**; lời hỏi xác nhận liệt kê các mốc sẽ mất. Sau đó mỗi lần `restore` về buổi sau mốc lại phải dựng từ đầu, cho tới khi bạn chụp lại mốc bằng `selftest` hoặc `snapshot` (restore không tự chụp mốc).
4. Cuối cùng chạy `verify.sh` của buổi đích.

Dò snapshot dựa vào mã thoát của `multipass info <vm>.<snapshot>`: 0 là có, 2 là không có. Mã khác (daemon không trả lời, lỗi lạ), hoặc không đọc được danh sách VM, thì `restore` và `snapshot` **dừng với lỗi**, kể cả khi có `--yes`; không bao giờ coi lỗi dò là "không có mốc" để rơi sang nhánh xoá VM.

Buổi trong `ORDER` mà chưa có thư mục script thì bị bỏ qua với thông báo `bỏ qua '<id>' (chưa có script)`.

## Hợp đồng script buổi (driver `multipass`)

```
labs/<chương trình>/
├── env.sh                    # giá trị riêng của chương trình (xem mục dưới)
├── milestones                # tuỳ chọn: "<id buổi> <tên snapshot>" mỗi dòng
├── sessions/
│   ├── ORDER                 # id các buổi theo đúng thứ tự học, mỗi dòng một id
│   └── <id>/
│       ├── apply.sh          # bắt buộc: lời giải chuẩn, chạy lại được nhiều lần
│       ├── verify.sh         # bắt buộc: chỉ đọc, kết thúc bằng assert_summary
│       ├── check.sh          # tuỳ chọn: thay verify.sh của buổi trước khi kiểm đầu vào
│       ├── setup.sh          # tuỳ chọn: chạy bởi `begin`
│       └── files/            # tuỳ chọn: tệp đi kèm buổi
├── breaks/<mã-lỗi>/run.sh    # lỗi gây có chủ ý, dùng bởi `break` hoặc gọi từ setup.sh
└── mocks/<đề>/{setup.sh,score.sh}   # bắt buộc với mỗi đề khai trong mocks.js (PR11)
```

- Mỗi script được `source` trong một subshell riêng, stdin là `/dev/null`. `apply.sh`, `setup.sh`, `break` chạy với `set -e`; `verify.sh`, `check.sh`, `score.sh` thì không.
- Có sẵn trong script: `vm <tên-vm> "<lệnh>"` (chạy lệnh trong VM, qua `mp`), `vm_put <nguồn> <tên-vm> <đích>` (chép tệp vào VM), `lab_break <mã-lỗi>` (gây lỗi từ `setup.sh`), các biến `LAB_CP`, `LAB_VMS`, `LAB_PROGRAM`, `SESSION_DIR`, và các hàm assert.
- **Assert** (`labs/lib/assert.sh`), mỗi hàm in một dòng ✓ hoặc ✗:
  - `expect_ok "<nhãn>" <lệnh…>` đạt khi lệnh trả 0; `expect_fail` đạt khi lệnh trả khác 0.
  - `expect_eq "<nhãn>" "<kỳ vọng>" <lệnh…>` đạt khi lệnh trả 0 **và** stdout (đã cắt khoảng trắng đầu và cuối) bằng kỳ vọng.
  - `expect_match "<nhãn>" "<regex>" <lệnh…>` đạt khi lệnh trả 0 **và** stdout với stderr gộp lại khớp regex (`grep -E`).
  - `assert_summary` in `→ a/b đạt` và trả 0 khi đủ. Script `verify.sh` phải kết thúc bằng lệnh này.
- **Đề mock**: `score.sh` in mỗi dòng `<câu> <domain> <got> <max>`. `lab` cộng điểm theo domain, in bảng và dòng kết quả không có khoảng trắng: `devprep-mock:v1:<chương trình>:<đề>:<YYYY-MM-DD>:<domain>=<got>/<max>,…`. Dòng sai hình dạng là lỗi, không bị bỏ qua.
- Trạng thái đầu vào của một buổi mặc định được kiểm bằng `verify.sh` của buổi đứng trước. Buổi nào có trạng thái đầu vào không bền qua khởi động lại VM thì có `check.sh` riêng.

## Hợp đồng buổi của driver `local`

```
labs/<chương trình>/
├── env.sh                    # LAB_DRIVER="local", LAB_APP_DIR, LAB_REQUIRE, LAB_PORTS (xem mục Driver)
├── app/                      # bản gốc (LAB_APP_DIR), chép vào work/ lúc `up`
├── selftest.sh               # tuỳ chọn: chạy một lần ở cuối `selftest`, trên workspace tạm cuối chuỗi
├── sessions/
│   ├── ORDER                 # id các buổi theo đúng thứ tự học
│   └── <id>/
│       ├── verify.sh         # bắt buộc: lab_mvn một lần, rồi expect_test …, kết thúc bằng assert_summary
│       ├── solution/         # cây tệp lời giải, chép đè lên workspace theo cùng đường dẫn tương đối
│       ├── solution.delete   # tuỳ chọn: mỗi dòng một đường dẫn cần xoá sau khi chép solution/
│       ├── apply.sh          # tuỳ chọn: chạy sau solution/ và solution.delete
│       ├── tests/            # cây tệp test của buổi, chép vào workspace lúc `begin`
│       ├── tests.hidden      # tuỳ chọn (chỉ cần có tệp): tests/ chỉ được chép lúc `verify`
│       ├── retire            # tuỳ chọn: mỗi dòng một đường dẫn test hết hiệu lực
│       ├── setup.sh          # tuỳ chọn: `begin` chạy sau commit "trước buổi"
│       └── check.sh          # tuỳ chọn: thay verify.sh của buổi trước khi kiểm đầu vào
├── breaks/<mã-lỗi>/run.sh    # lỗi gây có chủ ý, dùng bởi `break`
├── work/                     # workspace của bạn (repo bỏ qua)
└── backups/                  # gói của `destroy` (repo bỏ qua)
```

- **Buổi đã phát hành** cần `verify.sh` và ít nhất một trong `solution/`, `apply.sh` (PR11). Không có `milestones`, `mocks/`.
- **Dựng lại về cuối buổi N** (`restore`, và chuỗi lời giải của `selftest`): từ bản gốc, với mỗi buổi từ đầu `ORDER` tới N, theo thứ tự: chép `tests/`, gỡ `retire`, chép `solution/`, xoá theo `solution.delete`, chạy `apply.sh`. Trạng thái cuối buổi N là bản gốc cộng lời giải của các buổi 1…N.
- **`retire`**: khi một buổi sau đổi hành vi một cách chính đáng, test cũ không còn đúng được gỡ khỏi workspace lúc `begin` của buổi đó và khi dựng lại. Gỡ theo tệp, nên tách test "có thể hết hiệu lực" ra tệp riêng.
- **`tests.hidden`**: cho buổi "tự làm từ đầu": test chỉ vào workspace lúc `verify` (sau một commit `lab: trước khi chấm <id>` nếu workspace có thay đổi, vì chép test có thể đè tệp của bạn), rồi ở lại và được commit cùng `lab: xong buổi <id>` để `check` của buổi sau chạy được.
- Tệp danh sách (`retire`, `solution.delete`) bỏ dòng trống và dòng `#`. Mọi đường dẫn (trong danh sách, và trong cây `tests/`, `solution/`) phải tương đối, không có thành phần `..`, `.` hay `.git`; cây chỉ chứa tệp thường và thư mục (không symlink). Sai là `lab` từ chối trước khi ghi gì.
- **Môi trường của script**: mỗi script được `source` trong subshell riêng, stdin là `/dev/null`, thư mục hiện hành là workspace. Có sẵn: `WS` (đường dẫn workspace), `SESSION_DIR`, `LAB_PROGRAM`, `LAB_ROOT`, các hàm assert, `lab_mvn`, `expect_test`, `lab_tests`, `lab_break`. Không có `vm`, `vm_put`. `apply.sh`, `setup.sh`, `breaks/*/run.sh` chạy với `set -e`; `verify.sh`, `check.sh` thì không.

### Chấm bằng báo cáo Surefire

`verify.sh` chạy Maven **một lần** rồi in mỗi kiểm tra một dòng:

```bash
lab_mvn -q -pl order -am test -Dtest='lab.<id>.**' -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.redirectTestOutputToFile=true -DargLine=-Xshare:off
expect_test "<nhãn tiếng Việt>" 'lab.<id>.<Lớp>#<phương thức>'
assert_summary
```

- `lab_mvn <đối số…>` xoá mọi thư mục `target/surefire-reports` trong workspace rồi chạy `mvn <đối số…>` ở đó, trả mã của Maven. Hai quy tắc:
  - **Gọi đúng một lần mỗi script**, trước mọi `expect_test`. Lần gọi thứ hai xoá báo cáo của mọi module, kể cả báo cáo lần đầu vừa sinh ra, nên các kiểm tra dựa vào lần đầu thành ✗ "không chạy". Cần nhiều module hay nhiều nhóm test thì gộp vào một lệnh (`-pl a,b -am`, `-Dtest='lab.s01.**,shop.order.**'`).
  - **Gọi như một lệnh đứng riêng**, không trong `$(…)` hay pipeline (`lab_mvn … | tee …`). Ở đó nó chạy trong subshell, script không biết Maven đã chạy, nên mọi dòng là ✗ "không chạy".
- `expect_test "<nhãn>" '<lớp>#<phương thức>'` đạt khi testcase đó có trong báo cáo và không có `failure`, `error` hay `skipped`. Lớp lồng viết bằng `$` (`lab.s01.FooTest$Nested#bar`); test tham số hoá đạt khi mọi lần chạy đều đạt. Không thấy testcase (Maven lỗi biên dịch, không test nào chạy, hay chưa gọi `lab_mvn` trong script) là ✗ "không chạy", không bao giờ ✓ theo báo cáo cũ. Dòng ✗ in lại thông báo lỗi của test, đã giải mã thực thể XML (`&lt;`, `&apos;`, `&#10;`…), xuống dòng thành dấu cách nên mỗi kiểm tra vẫn một dòng.
- `lab_tests <thư mục>` đọc báo cáo `*.xml` ở thư mục khác thay cho mặc định (dùng trong test của bộ lab).
- **Chọn test bằng `-Dtest='lab.<id>.**'`**, hai dấu sao. Với maven-surefire-plugin 3.5.6, `-Dtest='lab.s01.*'` chọn **0 test** (đã thử: không sinh báo cáo nào, còn `'lab.s01.**'` chạy đủ 4 lớp), và vì có `-Dsurefire.failIfNoSpecifiedTests=false` nên Maven vẫn thoát 0: mọi dòng ✗ "không chạy" mà không có lỗi nào chỉ ra nguyên nhân. Cờ `failIfNoSpecifiedTests=false` vẫn cần, vì `-am` kéo theo module không có test khớp mẫu (với `ssia` là `common`), và thiếu cờ thì Maven dừng ở đó với `No tests matching pattern "…" were executed!`.
- `-Dmaven.test.redirectTestOutputToFile=true` đưa log của test vào `<module>/target/surefire-reports/<lớp>-output.txt` thay vì màn hình; `-DargLine=-Xshare:off` bỏ dòng cảnh báo CDS của JVM test. Nếu `pom.xml` đặt `<argLine>` riêng thì cấu hình trong pom thắng.
- **Nhiệm vụ mổ xẻ** (đọc log, chạy debugger rồi ghi lại điều quan sát được) chấm qua tệp trả lời do chương trình quy ước; với `ssia` là `answers/<id>.env` ở gốc workspace, mỗi dòng `KHOÁ=giá trị`, test của buổi đọc tệp này và so với giá trị đo lại từ context lúc chấm. Lời giải có `solution/answers/<id>.env`.

### `selftest` của driver `local`

Với mỗi buổi có thư mục trong `ORDER`, `selftest` chạy trên workspace tạm: `check.sh` của buổi (nếu có), phần ghi của `begin`, `verify` (phải đỏ, nếu xanh ngay thì test của buổi không kiểm được gì), áp lời giải, `verify` (phải xanh). Nó **không** chạy lại `verify.sh` của buổi trước làm kiểm đầu vào như `begin` thường làm, vì vòng trước vừa thấy nó xanh; nên mỗi buổi tốn đúng hai lần Maven. `labs/<ct>/selftest.sh` (với `ssia`: toàn bộ `mvn test` của workspace) chạy **một lần ở cuối chuỗi**, lỗi thì `selftest` lỗi. Đánh đổi: một lời giải làm hỏng test còn hiệu lực của buổi cũ chỉ bị phát hiện ở cuối, không phải đúng ở buổi gây ra; muốn tìm buổi đó thì `restore` về từng buổi rồi chạy `mvn test` trong workspace.

## An toàn và sao lưu (driver `local`)

- `lab` chỉ ghi vào `labs/<ct>/work/`, `labs/<ct>/backups/`, workspace tạm của `selftest` (phải nằm trong thư mục tạm của hệ thống) và cache Maven của bạn. Trước mọi thao tác ghi hoặc xoá, đường dẫn đích được kiểm là nằm trong các gốc đó **sau khi giải symlink**: `work/` hay `backups/` là symlink trỏ ra ngoài, một tệp trong workspace là symlink trỏ ra ngoài (kể cả sang `backups/`), id buổi hay đường dẫn có `..` đều bị từ chối trước khi ghi.
- Mọi lệnh sắp đè code của bạn đều commit trước, kể cả tệp chưa theo dõi và kể cả khi đang giữa một merge (commit ghi lại cả tệp còn dấu xung đột): `begin` (`lab: trước buổi <id>`), `break` (`lab: trước sự cố <mã>`), `verify` của buổi có `tests.hidden` (`lab: trước khi chấm <id>`), `restore` (`lab: sao lưu trước khi khôi phục`, cộng nhánh `backup/<YYYYmmdd-HHMMSS>`; trùng giây thì thêm `-2`, `-3`…). Commit của lab bỏ qua hook của bạn (`--no-verify`) để một hook lỗi không chặn được việc sao lưu.
- `destroy` chỉ xoá `work/` sau khi gói `.tar.gz` đã ghi xong và đọc lại được.
- **Không lệnh nào xoá nhánh `backup/*` hay tệp trong `backups/`.** Dọn chúng là việc của bạn. Cách lấy lại code: [`ssia/README.md`](ssia/README.md#lấy-lại-code-của-bạn).
- `target/` cạnh mỗi `pom.xml` của bản gốc không vào kho của workspace (`.git/info/exclude`), nên commit của lab chỉ chứa code.
- Compose (nếu chương trình khai) chỉ được gọi dạng `docker compose -f <LAB_COMPOSE_FILE> -p <LAB_COMPOSE_PROJECT> …`, không đụng project hay container nào khác.

## Thêm một chương trình thực hành mới

Ví dụ chương trình `xyz`. Id chương trình chỉ gồm chữ thường, số, `-` và `_`.

1. **`labs/xyz/env.sh`**: khai các biến `lab` cần. Chương trình driver `multipass`:
   - `LAB_PREFIX` (dạng `xyz-`, **không trùng VM nào bạn đang dùng**), `LAB_VMS` (mọi tên bắt đầu bằng tiền tố), `LAB_CP`, `LAB_IMAGE` (mặc định `24.04`).
   - Hàm `lab_vm_spec <tên-vm>` in `"<cpus> <mem> <disk>"`, ví dụ `2 2G 15G`.
   - Nếu cần nạp image: `LAB_IMAGES`, hàm `lab_build_images`, và `LAB_CTR_NAMESPACE` (namespace containerd nhận image; mặc định `default`, `cka` khai `k8s.io` vì kubelet chỉ đọc namespace đó).
   - Biến riêng của chương trình (với `cka`: `K8S_INSTALL_MINOR`, `K8S_TARGET_MINOR`) khai luôn ở đây; script buổi được `source` sau `env.sh` nên đọc được. `lib/` không biết tới chúng.

   Chương trình driver `local` (xem `labs/ssia/env.sh`):
   - `LAB_DRIVER="local"`, `LAB_APP_DIR` (thư mục bản gốc trong `labs/xyz/`, mặc định `app`, phải là đường dẫn tương đối), `LAB_REQUIRE` (lệnh `up` đòi có, ví dụ `"git java mvn"`), `LAB_PORTS` (cổng `status` báo, chỉ gồm số).
   - Nếu cần hạ tầng Docker: `LAB_COMPOSE_FILE` (tương đối so với `labs/xyz/`) và `LAB_COMPOSE_PROJECT`, phải khai cả hai.
   - Không khai `LAB_PREFIX`, `LAB_VMS`. Tạo bản gốc ở `labs/xyz/app/` và, nếu muốn kiểm toàn bộ test sau chuỗi lời giải, `labs/xyz/selftest.sh`.
2. **`labs/xyz/sessions/ORDER`** liệt kê id buổi theo thứ tự học, rồi mỗi buổi **đã phát hành** có thư mục `sessions/<id>/` theo hợp đồng của driver (hai mục ở trên). Driver `multipass`: tuỳ chọn thêm `milestones` và `breaks/`; `mocks/<đề>/` chỉ được bỏ khi danh sách `mocks` trong `mocks.js` rỗng, còn mỗi đề đã khai thì cần đủ `setup.sh` và `score.sh`. Driver `local`: tuỳ chọn `breaks/`; không có `milestones`, `mocks/`.
3. **Dữ liệu cho web** trong `webapp/js/data/practice/xyz/`: `program.js`, `skills.js`, `mocks.js`, và các tệp `stage-NN.js` chứa buổi học. Trong `program.js`:
   - `field` là id một lĩnh vực có trong `webapp/js/data/fields.js` (PR1); `stages[].sessions` là thứ tự học.
   - `skillAreas: [{ id, label, prefix }]`: các mảng kỹ năng của chương trình. Mỗi kỹ năng trong `skills.js` khai `area` là một `id` ở đây và có id bắt đầu bằng `prefix` đó (PR5); `label` hiện trên bản đồ kỹ năng.
   - `exam` là **tuỳ chọn**. Chương trình theo chứng chỉ khai `exam` với `domains` (tỷ trọng cộng đúng 100), `passPct`, `durationMin`, `competencies` (PR1). Chương trình theo chủ đề bỏ hẳn `exam`: buổi khai `domain: null`, trang chủ không có khối độ phủ đề thi, số tuần còn lại, tag domain hay ngưỡng đậu, và không có trang mock nếu `mocks` rỗng. Đề mock cần `exam` để chấm theo domain (PR10).
   - `env.tool` là `"multipass"` hoặc `"local"`, phải khớp `LAB_DRIVER` để PR11 đòi đúng tệp của buổi. Chương trình theo sách (như `ssia`) còn có `labels`, `book`, `rules`, `stages[].num`, và buổi khai `work`, `bookDiff`, `tasks[].kind`: xem [`webapp/README.md`](../webapp/README.md#thêm-chương-trình-thực-hành).
   - `project` là tuỳ chọn; `env.commands` khai mẫu lệnh mà trang buổi in ra (`up`, `begin`, `restore`, `verify`, `mockStart`, `mockScore`…, chỗ điền `<session>`, `<mock>`). Xem các tệp trong `webapp/js/data/practice/cka/` làm mẫu; schema và quy tắc nằm ở các bất biến PR1–PR12 trong `webapp/scripts/check-data.mjs`.
4. **Đăng ký** trong `webapp/js/data/practice/index.js`: import các tệp trên và thêm một phần tử `assemble(...)` vào `PROGRAMS`. Phần dùng chung `webapp/js/lib/practice.js` và `webapp/js/views/practice.js` không được chứa tên chương trình cụ thể nào (bất biến PR12).
5. **Khai số kỳ vọng** (số buổi, số buổi đã phát hành) trong bảng kỳ vọng của `check-data.mjs`, rồi chạy các lệnh kiểm ở mục dưới.

Bất biến PR11 ép thứ tự trong `ORDER` khớp thứ tự chặng trong dữ liệu web, mỗi buổi đã phát hành phải có `apply.sh` và `verify.sh` (driver `local`: `verify.sh` và `solution/` hoặc `apply.sh`), và báo: thư mục buổi không phải buổi đã phát hành, thư mục `mocks/<đề>` không có trong `mocks.js`, dòng `milestones` trỏ tới buổi không có hoặc chưa phát hành, và `lab_break <id>` (trong script) hay `./labs/lab break xyz <id>` (trong dữ liệu buổi) không có `breaks/<id>/run.sh`.

### Giới hạn hiện tại của phần dùng chung

Những thứ dưới đây vẫn giả định một kiểu lab nhất định; chương trình mới khác kiểu thì phải sửa `lib/` hoặc phần web, không chỉ thêm dữ liệu:

- **Môi trường**: hai driver, `multipass` (VM Ubuntu trên macOS, lệnh trong VM chạy qua `bash -lc`) và `local` (workspace git trên chính máy bạn, cộng Docker Compose nếu chương trình khai). Không có đường cho kind, máy từ xa hay VM của công cụ khác.
- **Nạp image** (`lab images`, chỉ driver `multipass`): build bằng Docker trên Mac, `docker save`, rồi `sudo ctr -n "$LAB_CTR_NAMESPACE" images import` trong VM. Cần containerd và `ctr` trong VM; runtime khác (Podman, Docker trong VM) chưa có đường.
- **Chấm của driver `local`** chỉ đọc báo cáo JUnit XML của Maven Surefire (`target/surefire-reports/*.xml` trong workspace). Gradle, hay test không ra báo cáo dạng đó, chưa có đường; `expect_ok`/`expect_eq`/`expect_match` vẫn dùng được cho lệnh thường.
- **Tiến trình ứng dụng** của driver `local` không do `lab` quản lý: `down` không dừng `java -jar` bạn tự bật, `up` và `status` chỉ báo cổng trong `LAB_PORTS` đang trống hay bận chứ không giành hay từ chối. Test của buổi tự bật app (cổng ngẫu nhiên) trong JVM của Maven. Buổi cần nhiều service cùng chạy lúc chấm (các chương OAuth 2 của `ssia`) chưa có cơ chế chung.
- **Không có snapshot cho driver `local`**: `restore` luôn dựng lại từ bản gốc và chuỗi lời giải; `selftest` luôn đi từ buổi đầu (không có `--from`).
- **`ref` của kỹ năng** chỉ trỏ được vào trang Thực hành nhanh (`#/commands`, dữ liệu lệnh/YAML/quy trình nằm ở `webapp/js/data/kubernetes/`), nên chỉ hợp lệ khi lĩnh vực của chương trình bật module `commands` (PR5). Chương trình của lĩnh vực khác (như `ssia`) để trống `ref`.
- **Kết quả mock** luôn chấm theo `exam.domains`; chương trình không có đề thi thì không có mock.
- **Dữ liệu web** chỉ nhận các giá trị đã biết: `env.tool` là `multipass` hoặc `local`, `tasks[].kind` chỉ có `dissect`, `labels` chỉ có `workBlock` và `startStep`, `rules` chỉ có `diagram` và `dissect` (PR8). Thêm giá trị mới là sửa `webapp/scripts/practice-rules.mjs` và phần hiển thị.

## Kiểm bộ lab

```bash
/bin/bash labs/tests/run.sh      # test CLI lab với multipass và docker giả (stub), không đụng VM thật
```

Test này chạy trên `labs/tests/fixtures` và các stub (`multipass`, `docker`, `mvn`, `java` giả), không gọi `multipass` hay Maven thật; driver `local` được thử trên chương trình giả `labs/tests/fixtures/loc`. CI (`.github/workflows/deploy-pages.yml`, job `check`) chạy nó trên runner Ubuntu với bash 5; script vẫn viết cho bash 3.2 của macOS, bộ test chỉ tránh lệnh riêng của BSD/GNU (stub thử `stat -c` của GNU trước `stat -f` của BSD). Kiểm một buổi trên môi trường thật (VM, hay JDK và Maven thật) là việc của `./labs/lab selftest <ct>`, hoặc `verify` sau khi làm buổi đó.

Kiểm dữ liệu và test đơn vị của phần web, từ gốc repo:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
node --test "webapp/scripts/tests/*.test.mjs"
```

`labs/` nằm trong `.dockerignore` nên không vào image Docker của web app.
