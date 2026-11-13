# 🛠️ Labs — bộ lệnh `lab` cho module Thực hành

Thư mục này là phần chạy trên máy bạn của module **Thực hành** trong DevPrep (`#/practice`). Web app chỉ hiển thị đề bài, gợi ý và lời giải; còn **dựng VM, đặt bài, chấm kết quả** là việc của `./labs/lab`, một CLI bash điều khiển các VM [Multipass](https://canonical.com/multipass).

Mỗi chương trình thực hành (hiện có `cka`) có một thư mục riêng `labs/<chương trình>/`. Phần dùng chung (`lab`, `lib/`) không biết gì về chương trình cụ thể nào: mọi thứ riêng nằm trong `labs/<chương trình>/`.

## Yêu cầu máy

| Cần | Ghi chú |
|---|---|
| macOS, `/bin/bash` 3.2 có sẵn | Script trong `labs/` viết cho bash 3.2 của macOS (không mảng kết hợp, không `mapfile`). Script chạy bên trong VM thì không bị ràng buộc này |
| [Multipass](https://canonical.com/multipass) | `brew install --cask multipass`; `lab` báo lỗi rõ nếu thiếu |
| Docker (Docker Desktop hoặc OrbStack) | Chỉ cần cho `lab images` (build rồi nạp image ứng dụng vào VM) |
| Tài nguyên cho chương trình `cka` | Ba VM: `cka-cp` 2 vCPU, 3G RAM, 20G đĩa; `cka-w1` và `cka-w2` mỗi máy 2 vCPU, 2G RAM, 15G đĩa. Tổng 6 vCPU, 7G RAM, 50G đĩa; image Ubuntu 24.04 |

Image ứng dụng build cho `linux/arm64`, tức máy Mac Apple Silicon.

## ⚠️ Cảnh báo về tiền tố VM

Mỗi chương trình khai một **tiền tố** (`LAB_PREFIX`, ví dụ `cka-`) trong `labs/<chương trình>/env.sh`. Mọi VM mà `lab` đụng tới đều phải có tên bắt đầu bằng tiền tố đó, nên các VM Multipass có sẵn của bạn (đặt tên khác, ví dụ `cp1`, `w1`, `w2`) **không bao giờ bị `lab` khởi động, dừng, chụp snapshot hay xoá**.

Cách bảo đảm điều này:

- Mọi lời gọi `multipass` trong `labs/` đi qua hàm bao `mp` (`labs/lib/multipass.sh`). Hàm này từ chối mọi tên không bắt đầu bằng `LAB_PREFIX`, kể cả dạng `tên.snapshot` và `tên:đường-dẫn`, và chỉ cho phép một danh sách tuỳ chọn đã biết cho từng lệnh con.
- Khi nạp chương trình, `lab` từ chối nếu `LAB_PREFIX` rỗng hay sai dạng (cần `chữ-thường-hoặc-số` rồi dấu `-`), hoặc nếu có VM trong `LAB_VMS` không bắt đầu bằng tiền tố.

Vì vậy: **không** đặt tên VM riêng của bạn bắt đầu bằng `cka-`, và khi viết chương trình mới hãy chọn tiền tố không trùng VM nào bạn đang dùng. `destroy` xoá hẳn mọi VM có tên trong `LAB_VMS` của chương trình đó (có hỏi trước), không hơn.

## Các lệnh

Chạy từ **gốc repo**: `./labs/lab <lệnh> <chương trình> [đối số…]`. Chạy `./labs/lab help` để xem danh sách và các chương trình có sẵn.

| Lệnh | Việc làm |
|---|---|
| `up <ct>` | Tạo VM chưa có (đúng cấu hình của chương trình), khởi động VM đang dừng, chờ tới khi tất cả Running. Chạy lại an toàn |
| `down <ct>` | Dừng các VM đang chạy, giữ nguyên dữ liệu |
| `status <ct>` | Bảng tên, trạng thái, IPv4 của từng VM |
| `destroy <ct>` | Xoá hẳn (purge) các VM của chương trình. Liệt kê VM rồi hỏi `y/N`; thêm `--yes` để bỏ hỏi |
| `check <ct> <buổi>` | Kiểm **đầu vào** của buổi, không sửa gì. VM phải đang chạy; rồi chạy `check.sh` của buổi nếu có, nếu không thì `verify.sh` của buổi đứng trước trong `ORDER`. Với buổi đầu tiên trong `ORDER` không chạy script nào, chỉ đòi VM đang chạy |
| `begin <ct> <buổi>` | `check` rồi chạy `setup.sh` của buổi (nếu có): đặt tệp bài tập, hoặc gây lỗi cho buổi sự cố. Đầu vào chưa đạt thì dừng và gợi ý `restore` về buổi trước. Đây là bước khởi động mà trang buổi học hiển thị |
| `verify <ct> <buổi>` | Chạy `verify.sh` của buổi: kiểm **kết quả** bạn làm. Thoát mã 0 khi mọi mục đạt |
| `restore <ct> <buổi>` | Đưa VM về trạng thái sau khi hoàn thành buổi đó (xem bên dưới). Hỏi xác nhận, `--yes` để bỏ hỏi |
| `break <ct> <mã-lỗi>` | Gây một lỗi có chủ ý, theo `labs/<ct>/breaks/<mã-lỗi>/run.sh`, để luyện sự cố |
| `mock <ct> <đề> start` | Bắt đầu một đề mock: chạy `mocks/<đề>/setup.sh` |
| `mock <ct> <đề> score` | Chấm đề: chạy `mocks/<đề>/score.sh`, in bảng điểm theo domain và một dòng `devprep-mock:v1:…` để dán vào trang Thực hành |
| `selftest <ct> [--from <buổi>]` | Kiểm chính bộ lab: lần lượt chạy `apply.sh` rồi `verify.sh` của mọi buổi. Không có `--from` thì **xoá và dựng lại** VM sạch trước (có hỏi). Có `--from` thì dùng VM đang chạy và bắt đầu từ buổi đó. Dừng ở lỗi đầu tiên |
| `snapshot <ct> <tên>` | Dừng VM, chụp snapshot cùng tên cho mọi VM của chương trình (ghi đè nếu đã có, có hỏi), rồi bật lại |
| `images <ct>` | Build (nếu chưa có) và nạp image ứng dụng của chương trình vào containerd của từng VM đang chạy |
| `help` | In trợ giúp |

Với mọi lệnh, thêm `--yes` hoặc `-y` để bỏ các câu hỏi xác nhận. `up`, `down`, `status`, `destroy`, `images` không nhận đối số nào ngoài tên chương trình.

### `restore` và mốc snapshot

Chương trình có thể khai các **mốc** trong tệp `labs/<ct>/milestones`, mỗi dòng `<id buổi> <tên snapshot>`. `selftest` chụp snapshot ngay sau khi buổi mốc qua `verify`; bạn cũng có thể tự chụp bằng `snapshot`.

`restore <ct> <buổi>` làm theo thứ tự sau:

1. Tìm mốc gần nhất tại hoặc trước buổi đích mà **mọi** VM đều có snapshot.
2. Có mốc: khôi phục mọi VM về snapshot đó, rồi bật lên. **Áp lại `apply.sh` của chính buổi mốc**, rồi `apply.sh` của các buổi sau mốc cho tới buổi đích. Lý do: snapshot chụp lúc VM đã dừng nên phần không bền của kết quả buổi mốc (netns, container chạy bằng tay…) không có trong đó; `apply.sh` chạy lại được nên áp lại là an toàn.
3. Không có mốc: xoá hẳn và dựng lại VM, rồi áp `apply.sh` từ buổi đầu tới buổi đích.
4. Cuối cùng chạy `verify.sh` của buổi đích.

Buổi trong `ORDER` mà chưa có thư mục script thì bị bỏ qua với thông báo `bỏ qua '<id>' (chưa có script)`.

## Hợp đồng script buổi

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

## Thêm một chương trình thực hành mới

Ví dụ chương trình `xyz`. Id chương trình chỉ gồm chữ thường, số, `-` và `_`.

1. **`labs/xyz/env.sh`**: khai các biến `lab` cần.
   - `LAB_PREFIX` (dạng `xyz-`, **không trùng VM nào bạn đang dùng**), `LAB_VMS` (mọi tên bắt đầu bằng tiền tố), `LAB_CP`, `LAB_IMAGE` (mặc định `24.04`).
   - Hàm `lab_vm_spec <tên-vm>` in `"<cpus> <mem> <disk>"`, ví dụ `2 2G 15G`.
   - Nếu cần nạp image: `LAB_IMAGES` và hàm `lab_build_images`.
2. **`labs/xyz/sessions/ORDER`** liệt kê id buổi theo thứ tự học, rồi mỗi buổi **đã phát hành** có thư mục `sessions/<id>/` theo hợp đồng ở trên. Tuỳ chọn thêm `milestones` và `breaks/`; `mocks/<đề>/` chỉ được bỏ khi danh sách `mocks` trong `mocks.js` rỗng, còn mỗi đề đã khai thì cần đủ `setup.sh` và `score.sh`.
3. **Dữ liệu cho web** trong `webapp/js/data/practice/xyz/`: `program.js` (meta, đề thi, `project`, `stages[].sessions`; `field` phải là id một lĩnh vực có trong `webapp/js/data/fields.js`, và `exam.domains[].weight` phải cộng đúng 100 — PR1), `skills.js`, `mocks.js`, và các tệp `stage-NN.js` chứa buổi học. Xem các tệp trong `webapp/js/data/practice/cka/` làm mẫu; schema và quy tắc nằm ở các bất biến PR1–PR12 trong `webapp/scripts/check-data.mjs`.
4. **Đăng ký** trong `webapp/js/data/practice/index.js`: import các tệp trên và thêm một phần tử `assemble(...)` vào `PROGRAMS`. Phần dùng chung `webapp/js/lib/practice.js` và `webapp/js/views/practice.js` không được chứa tên chương trình cụ thể nào (bất biến PR12).
5. **Khai số kỳ vọng** (số buổi, số buổi đã phát hành) trong bảng kỳ vọng của `check-data.mjs`, rồi chạy các lệnh kiểm ở mục dưới.

Bất biến PR11 ép thứ tự trong `ORDER` khớp thứ tự chặng trong dữ liệu web, mỗi buổi đã phát hành phải có `apply.sh` và `verify.sh`, và thư mục buổi nào không phải buổi đã phát hành thì bị báo.

## Kiểm bộ lab

```bash
/bin/bash labs/tests/run.sh      # test CLI lab với multipass và docker giả (stub), không đụng VM thật
```

Test này chạy trên `labs/tests/fixtures` và các stub, không gọi `multipass` thật. Kiểm một buổi trên VM thật là việc của `./labs/lab selftest <ct>`, hoặc `verify` sau khi làm buổi đó.

Kiểm dữ liệu và test đơn vị của phần web, từ gốc repo:

```bash
webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs
node --test "webapp/scripts/tests/*.test.mjs"
```

`labs/` nằm trong `.dockerignore` nên không vào image Docker của web app.
