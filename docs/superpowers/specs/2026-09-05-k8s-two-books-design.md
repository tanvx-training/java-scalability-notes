# Tích hợp *CKA Study Guide* và *Kubernetes: Up and Running* vào DevPrep — thiết kế

Ngày: 2026-09-05
Trạng thái: đã duyệt thiết kế, chờ lập kế hoạch triển khai
**Không có lĩnh vực mới** — cả hai cuốn vào lĩnh vực `kubernetes` sẵn có

Khác mọi lần thêm sách kể từ Spring Security, lần này **không khai lĩnh vực mới**. Lý do và
hệ quả nằm ở §2. Spec gần nhất để đối chiếu khuôn mẫu:
[`2026-09-05-spring-start-integration-design.md`](2026-09-05-spring-start-integration-design.md).

## 1. Bối cảnh

Repo đã có hai thư mục nguồn, nội dung **đã dịch xong tiếng Việt**, việc còn lại thuần tuý là
tích hợp vào web app DevPrep.

Số liệu đã đo, không ước lượng:

| Chỉ số | CKA Study Guide 2e | Kubernetes: Up and Running 3e |
|---|---:|---:|
| Tệp markdown | **23** (ch.1–22 + Phụ lục A) | **23** (ch.1–22 + Phụ lục) + `README.md` |
| Tổng số từ | **98.703** | **103.741** |
| Trung bình mỗi tệp | 4.291 | 4.510 |
| Nặng nhất | Phụ lục A — 11.274; ch.6 — 6.690 | ch.5 Pod — 6.978; ch.1 — 6.911 |
| Nhẹ nhất | ch.15 Volume — 1.673 | Phụ lục — 2.445; ch.11 — 2.668 |
| Số ảnh | **50** (`images/chNN/`) | **18** (`images/` phẳng) |
| Toàn vẹn ảnh | 50 tệp, 50 tham chiếu, **0 gãy, 0 mồ côi** | 18 tệp, 18 tham chiếu, **0 gãy, 0 mồ côi** |

Tác giả: *Certified Kubernetes Administrator (CKA) Study Guide*, ấn bản 2 — Benjamin Muschko
(O'Reilly). *Kubernetes: Up and Running*, ấn bản 3 — Brendan Burns, Joe Beda, Kelsey
Hightower, Lachlan Evenson (O'Reilly). Cả hai là **sách có bản quyền thương mại**, không phải
giấy phép mở như CC BY 4.0 — README phải ghi đúng điều này, như đã ghi cho 7 cuốn trước.

### 1.1 Hai cuốn khác nhau về thể loại, và điều đó quyết định thiết kế

*CKA Study Guide* là **sách luyện thi**, tổ chức bám curriculum CKA: mỗi chương kết thúc bằng
mục **"Trọng tâm cho kỳ thi"** và **"Bài tập mẫu"**, lời giải dồn vào **Phụ lục A** (11.274
từ — dài gấp 2,6 lần chương trung bình vì nó gom đáp án của cả 22 chương).

*Kubernetes: Up and Running* là **sách nền tảng** đọc tuyến tính, cùng thể loại với *Kubernetes
in Action* đã tích hợp trong repo.

Sự khác biệt đó là lý do hai track lộ trình được định vị khác nhau (§6, §7), chứ không phải
hai bản sao của cùng một khuôn.

### 1.2 Hai hình dạng nguồn khác nhau

```
Certified Kubernetes Administrator (CKA) Study Guide/
├── 09. Pods and Namespaces.md          ← tên tiếng Anh, có dấu cách và dấu chấm
├── 9. Pods and Namespaces _ Certified … 2nd Edition.pdf
└── images/ch01 … ch22/

Kubernetes- Up and Running/
├── 5. Pods _ Kubernetes_ Up and Running, 3rd Edition.pdf   ← PDF ở tầng cha
└── vi/
    ├── 05-pods.md                       ← đã slug hoá sẵn
    ├── README.md
    └── images/
```

KUAR đã có sẵn tầng `vi/` slug hoá — đúng hình dạng `kafka-vi/` trước khi chuẩn hoá. CKA Study
Guide thì phẳng và mang tên tiếng Anh — đúng hình dạng `Spring Start Here/` trước khi chuẩn
hoá. Cả hai đường đi đều đã có tiền lệ trong repo.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| 1 | **Không khai lĩnh vực mới.** Cả hai vào `kubernetes` | Đúng tiền lệ của chính repo cho sách Kubernetes: *Kubernetes in Action* nằm trong lĩnh vực "Kubernetes & Chứng chỉ" chứ không tách ra. CKA Study Guide luyện đúng kỳ thi mà track `cka` đang dạy — tách ra thì người học phải nhảy lĩnh vực để đọc cuốn mà chip lộ trình trỏ tới. |
| 2 | Thư viện tài liệu của lĩnh vực gom nhóm theo sách | Hệ quả bắt buộc của #1: 24 → **70 thẻ**. Một bức tường 70 thẻ phẳng là hồi quy trải nghiệm thật, không né được bằng cách viết `desc` khéo hơn. §5. |
| 3 | Track `ckabook` = **nước rút ôn thi, 6 tuần / 24 mục** | Sách bám curriculum nên một track đọc đầy đủ sẽ trùng track `cka` gần như tuần-đối-tuần. Định vị "chạy sau khi xong `cka`" biến trùng lặp thành vòng ôn thứ hai — có ích thay vì gây phân tâm. §6. |
| 4 | Track `kuar` = **đọc nền, 9 tuần / 36 mục** | Đúng khuôn track `k8sbook` (KIA): mục tiêu / đọc gì / bẫy / tự kiểm tra. §7. |
| 5 | **Không** chuyển "Bài tập mẫu" và Phụ lục A thành dữ liệu `labs`/`quiz` | Repo giữ nguyên tắc "mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách". Phụ lục A thành một tài liệu đọc bình thường; mục lộ trình giao việc qua trường `practice`. |
| 6 | `k8sbook-crossref.js` → `book-crossref.js`, giữ cả **ba** cuốn | Cơ chế `withBookRefs()` vốn đã không biết mình xử lý sách nào; chỉ cái tên tệp và một điều kiện trong bất biến N1 là đóng cứng vào một cuốn. §8. |
| 7 | Chia **3 chặng**, mỗi chặng tự qua cổng kiểm | §10. |
| 8 | Id tiến độ: `cb-w*` và `ku-w*` | Hai tiền tố còn trống. 12 tiền tố đang dùng: `w`, `cka-w`, `cks-w`, `sp-w`, `kb-w`, `ss-w`, `mc-w`, `dd-w`, `mj-w`, `kf-w`, `sh-w`, `sj-gd*-w`. |

### 2.1 Cái giá của quyết định #1, nói thẳng

Gộp vào một lĩnh vực khiến `kubernetes` thành lĩnh vực nặng nhất repo: 70 tài liệu, 6 track,
244 mục lộ trình, cộng 22 labs / 110 câu quiz / 84 flashcards sẵn có. Nếu về sau còn thêm sách
Kubernetes nữa thì phải xét lại — nhưng ngưỡng đó chưa tới, và tách sớm sẽ cắt đứt liên kết
chéo giữa sách và giáo trình chứng chỉ, vốn là giá trị lớn nhất của việc gộp.

## 3. Nguồn: chuẩn hoá `cka-book-vi/` và `kuar-vi/`

### 3.1 `cka-book-vi/`

`git mv "Certified Kubernetes Administrator (CKA) Study Guide" cka-book-vi`, rồi đổi tên 23
`.md` và 23 `.pdf` sang slug tiếng Việt lấy từ **chính tiêu đề H1 trong tệp**, không dịch lại
từ tên tiếng Anh.

Tên thư mục là `cka-book-vi`, **không** `cka-guide-vi`: repo đã có `CKA/CKA-Study-Guide.md` tự
biên và một bản ghi doc `cka-study-guide`. Hai thứ khác nhau, không được lẫn.

| # | `.md` mới | Tiêu đề H1 |
|---:|---|---|
| 01 | `01-chi-tiet-ve-ky-thi-va-tai-nguyen.md` | Chương 1. Chi tiết về kỳ thi và tài nguyên |
| 02 | `02-tom-luoc-ve-kubernetes.md` | Chương 2. Tóm lược về Kubernetes |
| 03 | `03-tuong-tac-voi-kubernetes.md` | Chương 3. Tương tác với Kubernetes |
| 04 | `04-cai-dat-va-nang-cap-cluster.md` | Chương 4. Cài đặt và nâng cấp cluster |
| 05 | `05-sao-luu-va-khoi-phuc-etcd.md` | Chương 5. Sao lưu và khôi phục etcd |
| 06 | `06-xac-thuc-uy-quyen-va-kiem-soat-tiep-nhan.md` | Chương 6. Xác thực, ủy quyền và kiểm soát tiếp nhận |
| 07 | `07-operator-va-custom-resource-definition.md` | Chương 7. Operator và Custom Resource Definition (CRD) |
| 08 | `08-helm-va-kustomize.md` | Chương 8. Helm và Kustomize |
| 09 | `09-pod-va-namespace.md` | Chương 9. Pod và Namespace |
| 10 | `10-configmap-va-secret.md` | Chương 10. ConfigMap và Secret |
| 11 | `11-deployment-va-replicaset.md` | Chương 11. Deployment và ReplicaSet |
| 12 | `12-scale-workload.md` | Chương 12. Scale workload |
| 13 | `13-yeu-cau-tai-nguyen-gioi-han-va-quota.md` | Chương 13. Yêu cầu tài nguyên, giới hạn và quota |
| 14 | `14-lap-lich-pod.md` | Chương 14. Lập lịch Pod |
| 15 | `15-volume.md` | Chương 15. Volume |
| 16 | `16-persistent-volume.md` | Chương 16. Persistent Volume |
| 17 | `17-service.md` | Chương 17. Service |
| 18 | `18-ingress.md` | Chương 18. Ingress |
| 19 | `19-gateway-api.md` | Chương 19. Gateway API |
| 20 | `20-network-policy.md` | Chương 20. Network Policy |
| 21 | `21-xu-ly-su-co-ung-dung.md` | Chương 21. Xử lý sự cố ứng dụng |
| 22 | `22-xu-ly-su-co-cluster.md` | Chương 22. Xử lý sự cố cluster |
| A | `A-dap-an-cau-hoi-on-tap.md` | Phụ lục A. Đáp án câu hỏi ôn tập |

Mỗi `.pdf` đổi tên thành `NN-<cùng slug>.pdf`. Ở đây **đủ 23 cặp `.md`/`.pdf`**, không có
ngoại lệ như tệp `00` của Spring Start Here.

### 3.2 `kuar-vi/`

`git mv "Kubernetes- Up and Running" kuar-vi`, rồi kéo nội dung `kuar-vi/vi/` lên một tầng và
xoá thư mục `vi/` rỗng.

**Giữ nguyên 23 slug tiếng Anh sẵn có** (`05-pods.md`, `A-building-your-own-kubernetes-cluster.md`)
— đúng tiền lệ `kafka-vi/`, nơi nguồn cũng đã có tầng `vi/` slug hoá và repo không dịch lại
tên tệp. Đổi tên ở đây chỉ tạo rủi ro gãy liên kết trong `README.md` của bản dịch mà không đổi
lấy được gì.

23 `.pdf` ở tầng cha `git mv` vào `kuar-vi/` và đổi tên thành `NN-<cùng slug>.pdf`
(`05-pods.pdf`, `A-building-your-own-kubernetes-cluster.pdf`).

`README.md` của bản dịch **giữ nguyên tại chỗ** — bảng mục lục của nó trỏ tới các `.md` cùng
thư mục nên không gãy. Nó **không** thành một bản ghi doc: nó là mục lục của thư mục, không
phải chương sách (khác `k8sbook-00` và `springsec-00` vốn là nội dung học thật).

### 3.3 Ảnh: không đụng vào

Cả hai cuốn có `images/` **cùng cấp** với các `.md`, nên đường dẫn tương đối `images/chNN/...`
và `images/chNN-figNN.png` **không gãy và không được sửa**. Đã kiểm: 68 tham chiếu, 0 gãy, 0
mồ côi. Kế hoạch phải đo lại con số này sau khi `git mv` để chứng minh không mất tệp.

### 3.4 Trước khi đổi tên: soát tham chiếu

Chạy `grep -rn "Kubernetes- Up and Running\|Certified Kubernetes Administrator (CKA) Study Guide" --exclude-dir=.git .`

Chỉ sửa tham chiếu tới **đường dẫn thư mục**. Tên sách xuất hiện trong văn xuôi (ví dụ
`k8s-ebook/` nhắc *Kubernetes: Up and Running* như sách cùng chủ đề) **không phải tham chiếu
đường dẫn và không được sửa**.

### 3.5 `build-content.sh`

Thêm `"$DEST/ckabook/images"` và `"$DEST/kuar/images"` vào lệnh `mkdir -p`, rồi thêm bốn dòng
copy đúng khuôn 8 nguồn hiện có:

```bash
cp    "$REPO"/cka-book-vi/*.md          "$DEST/ckabook/"
cp -R "$REPO"/cka-book-vi/images/.      "$DEST/ckabook/images/"
cp    "$REPO"/kuar-vi/*.md              "$DEST/kuar/"
cp -R "$REPO"/kuar-vi/images/.          "$DEST/kuar/images/"
```

`README.md` của `kuar-vi/` sẽ bị copy sang `content/kuar/README.md` — vô hại, không bản ghi doc
nào trỏ tới nó, đúng như `content/k8sbook/README.md` đang có sẵn.

## 4. Thư viện tài liệu — 46 bản ghi mới

Tất cả đều `field: "kubernetes"`. Tiêu đề dùng tiền tố ngắn để phân biệt trong một thư viện 70
thẻ; **`CKA Book` chứ không phải `CKA Study Guide`** vì chuỗi sau đã là tiêu đề của bản ghi
`cka-study-guide` tự biên.

**23 bản ghi `ckabook-*`** — `id` `ckabook-01`…`ckabook-22`, `ckabook-A`; `file`
`content/ckabook/<slug>.md`; `title` dạng `CKA Book 09 — Pod và Namespace`; `tags` bắt đầu
bằng `"CKA Study Guide"`.

**23 bản ghi `kuar-*`** — `id` `kuar-01`…`kuar-22`, `kuar-A`; `file` `content/kuar/<slug>.md`;
`title` dạng `KUAR 05 — Pod`; `tags` bắt đầu bằng `"KUAR"`.

`desc` mỗi bản ghi viết từ nội dung thật của chương (đọc mục lục H2 của chương, không đoán từ
tiêu đề). `icon` chọn theo chủ đề, không trùng liên tiếp.

`fields.js` — `desc` của lĩnh vực `kubernetes` hiện chỉ nói về luyện thi; cập nhật để nêu cả ba
cuốn sách. `modules` **không đổi** (đã đủ 9 module).

## 5. Thay đổi view duy nhất: gom nhóm trang Tài liệu

`views/docs.js:renderIndex()` hiện đổ toàn bộ `getDocs(field)` vào một `div.grid` phẳng. Với 70
thẻ, đó là hồi quy thật.

**Thiết kế:** thêm trường **tuỳ chọn** `group: "<nhãn>"` vào bản ghi doc. `renderIndex` gom thẻ
theo `group`, **giữ thứ tự xuất hiện đầu tiên trong mảng `docs`** (không sắp xếp lại — thứ tự
mảng đang là thứ tự đọc có chủ ý), mỗi nhóm một tiêu đề kèm số lượng. Bản ghi **không** khai
`group` render y hệt hiện tại, trong một khối không tiêu đề đặt trước các nhóm.

Bốn nhóm của lĩnh vực `kubernetes`:

| Nhãn nhóm | Số thẻ | Bản ghi |
|---|---:|---|
| Luyện thi & tra cứu (tự biên) | 7 | `prerequisites`, `study-guide`, `cheat-sheet`, `cka-study-guide`, `cka-cheat-sheet`, `cks-study-guide`, `cks-cheat-sheet` |
| Kubernetes in Action (Lukša, Manning) | 17 | `k8sbook-00`, `k8sbook-02`…`k8sbook-17` |
| CKA Study Guide (Muschko, O'Reilly) | 23 | `ckabook-*` |
| Kubernetes: Up and Running (O'Reilly) | 23 | `kuar-*` |

Chín lĩnh vực còn lại không khai `group` nên **không đổi một pixel nào**. Đây là thay đổi view
duy nhất trong cả dự án; mọi thứ khác là dữ liệu.

`views/docs.js:renderDoc()` (trang đọc) **không đổi**.

## 6. Track `ckabook` — nước rút ôn thi, 6 tuần / 24 mục

```js
{
  id: "ckabook",
  field: "kubernetes",
  label: "CKA Study Guide",
  icon: "📘",
  name: "Nước rút CKA với CKA Study Guide (Muschko)",
  durationWeeks: 6,
  desc: "Vòng ôn thứ hai, chạy SAU khi xong giáo trình CKA: 6 tuần bám 22 chương sách luyện thi …",
  prereq: "Khuyến nghị: đã hoàn thành lộ trình CKA. Track này ôn lại, không dạy từ đầu.",
  weeks: [...ckabookWeeks],
}
```

Nhịp đọc đo được — chênh lệch giữa tuần nhẹ nhất và nặng nhất là 1,3× (trừ tuần 6 có Phụ lục):

| Tuần | Chương | Chủ đề | Từ |
|---:|---|---|---:|
| 1 | 1–4 | Kỳ thi và tài nguyên, tóm lược K8s, `kubectl`, cài đặt & nâng cấp cluster | 15.677 |
| 2 | 5–8 | etcd backup/restore, authn/authz/admission, Operator & CRD, Helm & Kustomize | 15.818 |
| 3 | 9–12 | Pod & Namespace, ConfigMap & Secret, Deployment & ReplicaSet, scale workload | 16.102 |
| 4 | 13–16 | Tài nguyên & quota, lập lịch Pod, Volume, PersistentVolume | 15.503 |
| 5 | 17–20 | Service, Ingress, Gateway API, NetworkPolicy | 15.461 |
| 6 | 21–22 + A | Xử lý sự cố ứng dụng, xử lý sự cố cluster, đối chiếu Phụ lục A | 20.142 |

**4 mục mỗi tuần, tổng 24.** Tuần 1–5 mỗi mục ứng một chương. Tuần 6 chia: 2 mục cho chương 21
(sự cố ứng dụng có 2 nhóm kỹ thuật rõ rệt), 1 mục cho chương 22, 1 mục tổng duyệt Phụ lục A.

**Khuôn mỗi mục** khác track đọc sách thường, vì đây là vòng ôn:

- **Mục tiêu** — phát biểu ở dạng năng lực làm được trong phòng thi, có ràng buộc thời gian.
- **Đọc** — trỏ chương, **ưu tiên mục "Trọng tâm cho kỳ thi"** của chương đó.
- **Bẫy** — lấy từ chính cảnh báo của sách, không bịa.
- **Tự kiểm tra** — một câu buộc phải nhớ lệnh/cờ, không phải câu khái niệm.

**Trường `practice` của tuần** giao bài tập của sách: *"Làm bài tập mẫu cuối chương 9–12, đối
chiếu [Phụ lục A](#/docs/ckabook-A). Bấm giờ: 8 phút/bài."* — **không chép đề bài sang dữ liệu
app** (quyết định #5).

Chia tệp: **một tệp duy nhất `ckabook-roadmap.js`** (6 tuần, 24 mục). Không chia đôi như các
track sách khác — 24 mục nằm gọn dưới ngưỡng mà các tệp part1/part2 hiện có đang mang (32–48
mục).

## 7. Track `kuar` — đọc nền, 9 tuần / 36 mục

```js
{
  id: "kuar",
  field: "kubernetes",
  label: "Kubernetes: Up and Running",
  icon: "🚀",
  name: "Đọc Kubernetes: Up and Running (ấn bản 3)",
  durationWeeks: 9,
  desc: "Kế hoạch đọc 9 tuần bám bản dịch: mỗi mục nêu mục tiêu, chỉ đúng mục cần đọc, bẫy thường gặp và câu tự kiểm tra …",
  prereq: "Yêu cầu: terminal Linux và Docker cơ bản. Không cần biết Kubernetes trước.",
  weeks: [...kuarWeeksPart1, ...kuarWeeksPart2],
}
```

| Tuần | Chương | Chủ đề | Từ |
|---:|---|---|---:|
| 1 | 1–2 | Giới thiệu, tạo và chạy container | 12.467 |
| 2 | 3 + Phụ lục + 4 | Triển khai cluster, tự dựng cluster, lệnh `kubectl` | 8.526 |
| 3 | 5–6 | Pod, Label & Annotation | 10.162 |
| 4 | 7–8 | Service Discovery, cân bằng tải HTTP với Ingress | 9.860 |
| 5 | 9–10 | ReplicaSet, Deployment | 9.551 |
| 6 | 11–13 | DaemonSet, Job, ConfigMap & Secret | 10.004 |
| 7 | 14–16 | RBAC, Service Mesh, tích hợp lưu trữ | 12.456 |
| 8 | 17–19 | Mở rộng Kubernetes, truy cập từ ngôn ngữ lập trình, bảo mật ứng dụng | 14.879 |
| 9 | 20–22 | Chính sách & quản trị, đa cluster, tổ chức ứng dụng | 15.836 |

**4 mục mỗi tuần, tổng 36.**

Phụ lục "Tự xây dựng Kubernetes Cluster" xếp **cạnh chương 3** chứ không ở cuối: nó cùng chủ đề
dựng cluster với chương 3, và đọc nó ở tuần 9 thì đã muộn để dùng. Đây là sai lệch có chủ ý so
với thứ tự sách, phải ghi rõ trong `desc` của tuần 2.

Tuần 8–9 nặng hơn mặt bằng (~15k từ) vì ba chương cuối mỗi cuốn đều là chủ đề nâng cao/tuỳ
chọn; chấp nhận, không cắt thành 10 tuần để giữ nhịp 4 mục/tuần đều.

Chia tệp: `kuar-roadmap-part1.js` (tuần 1–5, 20 mục) và `kuar-roadmap-part2.js` (tuần 6–9, 16
mục), đúng khuôn 7 track sách hiện có.

**Khuôn mỗi mục** đúng khuôn track `k8sbook`: **Mục tiêu / Đọc / Bẫy / Tự kiểm tra**, mỗi mục
là kế hoạch đọc trỏ vào sách, không chép nội dung sách.

## 8. Liên kết chéo — `book-crossref.js`

### 8.1 Đổi tên và mở rộng

`k8sbook-crossref.js` → `book-crossref.js`, export `k8sbookCrossref` → `bookCrossref`. Hàm
`withBookRefs()` trong `roadmap.js` **không đổi một dòng logic** — nó tra theo id tuần và dựng
chip từ `title` của tài liệu, vốn đã không biết mình đang xử lý sách nào.

Phải sửa: 1 dòng `import` trong `roadmap.js`, 1 dòng `import` trong `check-data.mjs`, và điều
kiện đóng cứng trong bất biến N1 (§9.1).

### 8.2 CKA Study Guide → track `cka` (phủ trọn 9 tuần)

| Tuần track `cka` | Chương CKA Book |
|---|---|
| `cka-w1` Kiến trúc cluster chuyên sâu | `ckabook-02`, `ckabook-03` |
| `cka-w2` Cài đặt cluster với kubeadm | `ckabook-04` |
| `cka-w3` etcd Backup/Restore & Cluster Upgrade | `ckabook-05` |
| `cka-w4` Scheduling | `ckabook-13`, `ckabook-14` |
| `cka-w5` Storage | `ckabook-15`, `ckabook-16` |
| `cka-w6` Services & Networking (mức admin) | `ckabook-17`, `ckabook-18`, `ckabook-19`, `ckabook-20` |
| `cka-w7` RBAC, Users & Helm/Kustomize | `ckabook-06`, `ckabook-07`, `ckabook-08` |
| `cka-w8` Troubleshooting | `ckabook-21`, `ckabook-22` |
| `cka-w9` Luyện đề | `ckabook-01`, `ckabook-A` |

Chương 9–12 (Pod, ConfigMap, Deployment, scale) **không** nối vào track `cka`: đó là kiến thức
CKAD, người học đã qua ở track trước. Nối vào đây là làm loãng, không phải làm đầy.

### 8.3 KUAR → track `ckad`, `cka`, `cks`

Nguyên tắc: **chỉ nối khi chương sách dạy đúng thứ tuần đó cần**, không nối cho đủ mặt — và
chọn chương **bổ sung** cho chip đã có, không lặp lại thứ chip KIA đã dạy.

| Tuần | Chương KUAR | Vì sao |
|---|---|---|
| `w1` Nền tảng | `kuar-04` | 4 chip KIA sẵn có nói về container và đối tượng API; `kubectl` là chỗ trống. |
| `w2` Pod & multi-container | `kuar-05`, `kuar-06` | Pod và label — đúng trọng tâm tuần. |
| `w3` Workloads | `kuar-10`, `kuar-12` | Deployment và Job; ReplicaSet đã có ở chip KIA. |
| `w4` Configuration | `kuar-13` | ConfigMap & Secret. |
| `w6` Services & Networking | `kuar-07`, `kuar-08` | Service discovery và Ingress. |
| `w7` Storage, Helm, Kustomize | `kuar-16` | Tích hợp lưu trữ. |
| `cka-w1` Kiến trúc cluster | `kuar-A` | Phụ lục tự dựng cluster — đúng chiều admin. |
| `cka-w5` Storage | `kuar-16` | Góc nhìn vận hành storage. |
| `cks-w2` Hardening — RBAC | `kuar-14` | Chương RBAC. |
| `cks-w4` Pod Security & Secrets | `kuar-19` | Bảo mật ứng dụng. |
| `cks-w5` Admission & Isolation | `kuar-20` | Chính sách & quản trị (admission, Gatekeeper). |

`w5` (Observability) và `w8`/`w10` (luyện đề) **không nối**: KUAR không có chương tương ứng.
Track `ckad` dùng id `w1`…`w8` rồi **`w10`** — **không có `w9`**; bất biến N1 sẽ bắt nếu gõ nhầm.

Một tài liệu xuất hiện ở hai tuần khác nhau (`kuar-16` ở `w7` và `cka-w5`) là hợp lệ — N1 chỉ
chặn trùng **trong cùng một tuần**.

### 8.4 Object hợp nhất — đây mới là thứ phải viết ra tệp

`bookCrossref` là **một object, mỗi id tuần đúng một khoá**. Bảng §8.2 và §8.3 là hai góc nhìn
theo sách, và **bảng KIA hiện có trong repo cũng dùng chung nhiều khoá đó** — 11 trong 12 khoá
cũ bị đụng. Viết ba bảng thành ba nhóm khoá trùng tên trong cùng object là **lỗi im lặng**:
JavaScript lấy khoá cuối và bỏ các khoá trước, chip của hai cuốn kia biến mất mà không cảnh báo.
Bất biến N1 cũng không bắt được — nó chỉ nhìn thấy object đã hợp nhất.

Kết quả hợp nhất đầy đủ, **đây là dạng chuẩn để chép ra tệp**:

```js
export const bookCrossref = {
  // ----- CKAD -----
  "w1":  ["k8sbook-02", "k8sbook-03", "k8sbook-04", "k8sbook-10", "kuar-04"],
  "w2":  ["k8sbook-05", "k8sbook-06", "kuar-05", "kuar-06"],
  "w3":  ["k8sbook-13", "k8sbook-14", "k8sbook-17", "kuar-10", "kuar-12"],
  "w4":  ["k8sbook-09", "kuar-13"],
  "w5":  ["k8sbook-06"],
  "w6":  ["k8sbook-11", "k8sbook-12", "kuar-07", "kuar-08"],
  "w7":  ["k8sbook-07", "k8sbook-08", "k8sbook-15", "kuar-16"],

  // ----- CKA -----
  "cka-w1": ["k8sbook-04", "ckabook-02", "ckabook-03", "kuar-A"],
  "cka-w2": ["ckabook-04"],
  "cka-w3": ["ckabook-05"],
  "cka-w4": ["k8sbook-16", "ckabook-13", "ckabook-14"],
  "cka-w5": ["k8sbook-07", "k8sbook-08", "ckabook-15", "ckabook-16", "kuar-16"],
  "cka-w6": ["k8sbook-11", "k8sbook-12", "ckabook-17", "ckabook-18", "ckabook-19", "ckabook-20"],
  "cka-w7": ["ckabook-06", "ckabook-07", "ckabook-08"],
  "cka-w8": ["ckabook-21", "ckabook-22"],
  "cka-w9": ["ckabook-01", "ckabook-A"],

  // ----- CKS -----
  "cks-w2": ["kuar-14"],
  "cks-w4": ["k8sbook-09", "kuar-19"],
  "cks-w5": ["kuar-20"],
};
```

Chặng 1 viết object này **không có** phần `kuar-*`; chặng 2 **nối thêm vào mảng có sẵn**, không
thêm khoá mới trùng tên. 12 khoá cũ của KIA giữ nguyên giá trị cũ ở đầu mỗi mảng — không xoá,
không sắp xếp lại, để chip mà người học đã quen không đổi chỗ.

**Trần chip: tối đa 6 mỗi tuần.** Chỉ `cka-w6` chạm trần, và chạm có lý do — đó là tuần
networking, bốn chương CKA Book (Service, Ingress, Gateway API, NetworkPolicy) đều thuộc đúng
phạm vi tuần đó. Mọi tuần khác ≤ 5.

### 8.5 Chip ngược

Chip từ hai track mới trỏ về `#/roadmap/cka`, `#/roadmap/ckad` và các chương KIA viết **thẳng
vào `resources` của tuần**, không qua bảng crossref. Bảng crossref chỉ phục vụ chiều
giáo-trình-chứng-chỉ → chương sách, đúng thiết kế hiện có.

## 9. Bất biến và bảng kỳ vọng

### 9.1 Sửa bất biến N1

N1 hiện đóng cứng vào một cuốn ở hai chỗ:

```js
if (weekId.startsWith("kb-w")) bad.push(`"${weekId}" là tuần của chính track k8sbook`);
if (!id.startsWith("k8sbook-")) bad.push(`"${weekId}" → "${id}" không phải chương sách`);
```

Thay bằng bảng tiền tố, để thêm cuốn thứ tư sau này chỉ phải sửa một dòng dữ liệu:

```js
const BOOK_PREFIXES = { "k8sbook-": "kb-w", "ckabook-": "cb-w", "kuar-": "ku-w" };
```

- id tài liệu phải bắt đầu bằng **một trong các khoá**;
- id tuần **không được** bắt đầu bằng bất kỳ giá trị nào (một cuốn không tự nối chip vào track
  của chính nó);
- giữ nguyên kiểm "tuần có thật" và "không trùng trong cùng tuần".

### 9.2 Bảng kỳ vọng `EXPECTED`

| Khoá | Trước | Sau chặng 1 | Sau chặng 2 |
|---|---:|---:|---:|
| `docs:kubernetes` | 24 | 47 | **70** |
| `roadmap-items:kubernetes` | 184 | 208 | **244** |

Không khoá nào khác đổi. Bất biến N3 (bảng kỳ vọng phải phủ mọi lĩnh vực khai `docs`/`roadmap`)
tự thoả vì không có lĩnh vực mới.

### 9.3 README

| Số liệu | Trước | Sau |
|---|---:|---:|
| Giáo trình | 15 | **17** |
| Mục lộ trình | 744 | **804** |
| Tài liệu | 150 | **196** |

Thêm 2 dòng nguồn vào bảng thành phần (`cka-book-vi/`, `kuar-vi/`), ghi rõ **sách có bản quyền
thương mại**, và bổ sung tên hai cuốn vào đoạn giới thiệu DevPrep.

Comment đầu `views/roadmap.js` ("15 track thuộc 9 lĩnh vực") và đầu `roadmap.js` (bảng chia tệp
theo track) phải cập nhật — chúng là tài liệu, sai thì gây hiểu nhầm cho lần thêm sau. Số **9
lĩnh vực** giữ nguyên: lĩnh vực `java` không có module `roadmap`, và lần này không thêm lĩnh
vực nào.

## 10. Chia chặng và cổng kiểm

Cổng kiểm chung của mọi chặng:

```bash
./webapp/build-content.sh webapp/content && node webapp/check-data.mjs
```

| Chặng | Việc | Cổng kiểm riêng |
|---|---|---|
| **0** | §3 chuẩn hoá hai thư mục + `build-content.sh`; §5 trường `group` + gom nhóm trong `views/docs.js` + gán `group` cho 24 doc Kubernetes hiện có | check-data xanh, **`docs:kubernetes` vẫn 24**, `roadmap-items` vẫn 184 — chặng này không thêm bản ghi nào. Đếm lại ảnh sau `git mv`: 50 + 18, 0 gãy. Mở app xem 4 → 2 nhóm hiện đúng. |
| **1** | 23 doc `ckabook-*`; `ckabook-roadmap.js` 6 tuần/24 mục; `book-crossref.js` (đổi tên + bảng CKA Book); N1 mới; `EXPECTED` 47/208; README | check-data xanh với 47/208. Mở `#/roadmap/cka` thấy chip sách ở cả 9 tuần. |
| **2** | 23 doc `kuar-*`; `kuar-roadmap-part{1,2}.js` 9 tuần/36 mục; bảng crossref KUAR; `EXPECTED` 70/244; README | check-data xanh với 70/244. |

Mỗi chặng tự đứng được: dừng sau chặng 0 hay chặng 1 thì app vẫn đúng và vẫn qua toàn bộ bất
biến. Nội dung lộ trình commit theo cụm 1–2 tuần, đúng nhịp 8 lần tích hợp trước — không dồn
một commit lớn.

## 11. Ngoài phạm vi

Ghi ra để lần sau không phải tranh luận lại:

- **Không** thêm labs/quiz/flashcards từ hai cuốn sách (quyết định #5).
- **Không** sửa 55 mục của track `cka`, 55 mục `ckad`, 44 mục `cks` — chip nối vào qua bảng
  crossref, dữ liệu track cũ không bị chạm.
- **Không** đổi `FIELD_ORDER`, `NAV_GROUPS`, hay `modules` của lĩnh vực `kubernetes`.
- **Không** dịch lại tên tệp KUAR sang tiếng Việt (§3.2).
- **Không** tách nhóm cho 9 lĩnh vực còn lại trong trang Tài liệu — chúng chưa đủ lớn để cần.
