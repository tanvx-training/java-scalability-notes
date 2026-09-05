# Chương 10. ConfigMap và Secret

*Dịch từ: Chapter 10. ConfigMaps and Secrets — Certified Kubernetes Administrator (CKA) Study Guide, 2nd Edition (O'Reilly).*

Kubernetes dành riêng hai primitive để định nghĩa dữ liệu cấu hình: *ConfigMap* và *Secret*. Cả hai primitive này đều hoàn toàn tách rời khỏi vòng đời (lifecycle) của Pod, điều đó cho phép bạn thay đổi các giá trị dữ liệu cấu hình của chúng mà không nhất thiết phải triển khai lại Pod.

Về bản chất, ConfigMap và Secret lưu trữ một tập các cặp key-value. Những cặp key-value đó có thể được đưa (inject) vào container dưới dạng biến môi trường (environment variable), hoặc có thể được mount dưới dạng volume. Hình 10-1 minh họa các lựa chọn này.

![Hình 10-1. Sử dụng dữ liệu cấu hình](images/ch10/figure-10-1.png)

*Hình 10-1. Sử dụng dữ liệu cấu hình*

Thoạt nhìn, ConfigMap và Secret có vẻ gần như giống hệt nhau về mục đích và cấu trúc; tuy nhiên, có một khác biệt nhỏ nhưng đáng kể. ConfigMap lưu trữ dữ liệu dạng văn bản thuần (plain-text), ví dụ như URL kết nối, các cờ (flag) lúc chạy, hoặc thậm chí dữ liệu có cấu trúc như nội dung JSON hay YAML. Secret phù hợp hơn để biểu diễn dữ liệu nhạy cảm như mật khẩu, khóa API, hoặc chứng chỉ (certificate) Secure Sockets Layer (SSL), và lưu trữ dữ liệu ở dạng được encode Base64 (Base64-encoded).

> **MÃ HÓA DỮ LIỆU CONFIGMAP VÀ SECRET**
>
> Thành phần cluster lưu trữ dữ liệu của đối tượng ConfigMap và Secret là etcd, thành phần này mặc định quản lý dữ liệu đó ở dạng không mã hóa (unencrypted). Bạn có thể cấu hình mã hóa (encryption) dữ liệu trong etcd, như được mô tả trong tài liệu Kubernetes. Mã hóa etcd không nằm trong phạm vi của kỳ thi.

Chương này tham chiếu rất nhiều đến khái niệm volume. Hãy xem lại Chương 15 để ôn lại cơ chế sử dụng volume trong Pod.

> **PHẠM VI BAO PHỦ MỤC TIÊU ĐỀ CƯƠNG**
>
> Chương này đề cập đến mục tiêu đề cương (curriculum) sau:
>
> - Sử dụng ConfigMap và Secret để cấu hình ứng dụng

## Làm việc với ConfigMap

Các ứng dụng thường cài đặt logic sử dụng dữ liệu cấu hình để điều khiển hành vi lúc chạy (runtime). Ví dụ về dữ liệu cấu hình bao gồm URL kết nối và các tùy chọn giao tiếp mạng (như số lần thử lại hoặc thời gian chờ) tới các dịch vụ bên thứ ba, vốn khác nhau giữa các môi trường triển khai đích.

Không hiếm khi cùng một dữ liệu cấu hình cần được cung cấp cho nhiều Pod. Thay vì sao chép–dán cùng các cặp key-value vào nhiều định nghĩa Pod, bạn có thể chọn tập trung thông tin đó vào một đối tượng ConfigMap. Đối tượng ConfigMap chứa dữ liệu cấu hình và có thể được sử dụng bởi bao nhiêu Pod tùy ý. Nhờ đó, bạn sẽ chỉ cần sửa đổi dữ liệu ở một nơi duy nhất khi cần thay đổi.

### Tạo ConfigMap

Bạn có thể tạo ConfigMap bằng cách phát lệnh mệnh lệnh (imperative) `create configmap`. Lệnh này yêu cầu bạn cung cấp nguồn dữ liệu dưới dạng một tùy chọn. Kubernetes phân biệt bốn tùy chọn khác nhau như trong Bảng 10-1.

**Bảng 10-1. Các tùy chọn nguồn dữ liệu được ConfigMap phân tích**

| Tùy chọn | Ví dụ | Mô tả |
|---|---|---|
| `--from-literal` | `--from-literal=locale=en_US` | Giá trị literal, là các cặp key-value dạng văn bản thuần |
| `--from-env-file` | `--from-env-file=config.env` | Một file chứa các cặp key-value và kỳ vọng chúng là biến môi trường |
| `--from-file` | `--from-file=app-config.json` | Một file với nội dung tùy ý |
| `--from-file` | `--from-file=config-dir` | Một thư mục với một hay nhiều file |

Rất dễ nhầm lẫn giữa hai tùy chọn `--from-env-file` và `--from-file`. Tùy chọn `--from-env-file` kỳ vọng một file chứa các biến môi trường theo định dạng `KEY=value`, mỗi biến trên một dòng. Các cặp key-value tuân theo quy ước đặt tên thông thường của biến môi trường (ví dụ, key viết hoa, và các từ riêng lẻ được ngăn cách bằng ký tự gạch dưới). Về mặt lịch sử, tùy chọn này được dùng để xử lý các file `.env` của Docker Compose, mặc dù bạn có thể dùng nó cho bất kỳ file nào khác chứa biến môi trường.

Tùy chọn `--from-env-file` không bắt buộc hay chuẩn hóa quy ước đặt tên thông thường của biến môi trường. Tùy chọn `--from-file` trỏ tới một file hoặc thư mục chứa *bất kỳ* nội dung tùy ý nào. Đây là tùy chọn thích hợp cho các file chứa dữ liệu cấu hình có cấu trúc mà ứng dụng sẽ đọc (ví dụ, file properties, file JSON, hoặc file XML).

Lệnh sau minh họa việc tạo ConfigMap trong thực tế. Chúng ta chỉ đơn giản cung cấp các cặp key-value dưới dạng literal:

```shell
$ kubectl create configmap db-config --from-literal=DB_HOST=mysql-service \
  --from-literal=DB_USER=backend
configmap/db-config created
```

Đối tượng YAML thu được trông giống như trong Ví dụ 10-1. Như bạn thấy, đối tượng này định nghĩa các cặp key-value trong một phần có tên `data`. ConfigMap không có phần `spec`.

**Ví dụ 10-1. Manifest YAML của ConfigMap**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-config
data:
  DB_HOST: mysql-service
  DB_USER: backend
```

Có thể bạn đã nhận thấy key được gán cho dữ liệu của ConfigMap tuân theo quy ước đặt tên thông thường của biến môi trường. Ý định là để sử dụng chúng như vậy trong container.

### Sử dụng ConfigMap dưới dạng biến môi trường

Sau khi đã tạo ConfigMap, giờ bạn có thể đưa các cặp key-value của nó vào container dưới dạng biến môi trường. Ví dụ 10-2 cho thấy cách dùng `spec.containers[].envFrom[].configMapRef` để tham chiếu ConfigMap theo tên.

**Ví dụ 10-2. Đưa các cặp key-value của ConfigMap vào container**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: bmuschko/web-app:1.0.1
    name: backend
    envFrom:
    - configMapRef:
        name: db-config
```

Sau khi tạo Pod từ manifest YAML, bạn có thể kiểm tra các biến môi trường có sẵn trong container bằng cách chạy lệnh Unix `env`:

```shell
$ kubectl exec backend -- env
...
DB_HOST=mysql-service
DB_USER=backend
...
```

Dữ liệu cấu hình được đưa vào sẽ được liệt kê trong số các biến môi trường có sẵn cho container.

### Mount ConfigMap dưới dạng volume

Một cách khác để cấu hình ứng dụng lúc chạy là xử lý một file cấu hình mà máy đọc được. Giả sử chúng ta đã quyết định lưu cấu hình cơ sở dữ liệu trong một file JSON tên là *db.json* với cấu trúc như trong Ví dụ 10-3.

**Ví dụ 10-3. File JSON dùng để cấu hình thông tin cơ sở dữ liệu**

```json
{
  "db": {
    "host": "mysql-service",
    "user": "backend"
  }
}
```

Do chúng ta không làm việc với các cặp key-value dạng literal, ta cần cung cấp tùy chọn `--from-file` khi tạo đối tượng ConfigMap:

```shell
$ kubectl create configmap db-config --from-file=db.json
configmap/db-config created
```

Ví dụ 10-4 cho thấy manifest YAML tương ứng của ConfigMap. Bạn có thể thấy tên file trở thành key; nội dung file được dùng làm giá trị nhiều dòng.

**Ví dụ 10-4. Manifest YAML của ConfigMap định nghĩa dữ liệu có cấu trúc**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-config
data:
  db.json: |-                              # ❶
    {
      "db": {
        "host": "mysql-service",
        "user": "backend"
      }
    }
```

❶ Cú pháp chuỗi nhiều dòng (`|-`) được dùng trong cấu trúc YAML này loại bỏ ký tự xuống dòng cuối cùng và loại bỏ các dòng trống ở cuối. Để biết thêm thông tin, hãy xem cú pháp YAML cho chuỗi nhiều dòng.

Pod mount ConfigMap dưới dạng volume vào một đường dẫn cụ thể bên trong container với quyền chỉ đọc. Giả định là ứng dụng sẽ đọc file cấu hình khi khởi động. Ví dụ 10-5 minh họa định nghĩa YAML.

**Ví dụ 10-5. Mount ConfigMap dưới dạng volume**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: bmuschko/web-app:1.0.1
    name: backend
    volumeMounts:
    - name: db-config-volume
      mountPath: /etc/config
  volumes:
  - name: db-config-volume
    configMap:                             # ❶
      name: db-config
```

❶ Gán loại volume dùng để tham chiếu đối tượng ConfigMap theo tên.

Để xác minh hành vi đúng, hãy mở một shell tương tác vào container. Như bạn thấy trong các lệnh sau, thư mục */etc/config* chứa một file có tên là key mà chúng ta đã dùng trong ConfigMap. Nội dung của nó chính là cấu hình JSON:

```shell
$ kubectl exec -it backend -- /bin/sh
# ls -1 /etc/config
db.json
# cat /etc/config/db.json
{
    "db": {
        "host": "mysql-service",
        "user": "backend"
    }
}
```

Mã ứng dụng giờ đây có thể đọc file từ đường dẫn mount và cấu hình hành vi lúc chạy khi cần.

## Làm việc với Secret

Dữ liệu lưu trong ConfigMap biểu diễn các cặp key-value văn bản thuần tùy ý. So với ConfigMap, primitive Secret được dùng để biểu diễn dữ liệu cấu hình nhạy cảm. Ví dụ điển hình cho dữ liệu Secret là mật khẩu hoặc khóa API dùng cho xác thực (authentication).

> **GIÁ TRỊ LƯU TRONG SECRET CHỈ ĐƯỢC ENCODE, KHÔNG ĐƯỢC MÃ HÓA**
>
> Secret kỳ vọng giá trị của mỗi mục được encode Base64. Base64 encode một giá trị, nhưng không mã hóa (encrypt) nó. Bất kỳ ai có quyền truy cập vào giá trị đó đều có thể decode nó một cách dễ dàng. Do đó, nên tránh lưu trữ manifest của Secret trong kho mã nguồn cùng với các file tài nguyên khác.

Thật đáng tiếc là dự án Kubernetes đã quyết định chọn thuật ngữ "Secret" để biểu diễn dữ liệu nhạy cảm. Cách đặt tên này ngụ ý rằng dữ liệu thực sự là bí mật và do đó được mã hóa. Để giữ an toàn cho dữ liệu nhạy cảm trong các dự án thực tế, bạn có thể chọn từ nhiều phương án.

Bitnami Sealed Secrets là một Kubernetes Operator đã sẵn sàng cho production và đã được kiểm chứng, sử dụng mã hóa bất đối xứng cho dữ liệu. Dạng biểu diễn manifest của dữ liệu, tức CRD SealedSecret, có thể được lưu trữ an toàn trong kho mã nguồn công khai. Bản thân bạn không thể giải mã dữ liệu này. Controller được cài đặt cùng với Operator là thực thể duy nhất có thể giải mã dữ liệu. Một phương án khác là lưu dữ liệu nhạy cảm trong các trình quản lý secret bên ngoài, ví dụ HashiCorp Vault hoặc AWS Secrets Manager, và tích hợp chúng với Kubernetes. External Secrets Operator đồng bộ hóa Secret từ các API bên ngoài vào Kubernetes. Kỳ thi chỉ yêu cầu bạn hiểu primitive Secret tích hợp sẵn, được đề cập trong các mục tiếp theo.

### Tạo Secret

Bạn có thể tạo Secret bằng lệnh mệnh lệnh `create secret`. Ngoài ra, cần cung cấp một lệnh con (subcommand) bắt buộc để xác định loại Secret. Bảng 10-2 liệt kê các loại khác nhau. Kubernetes gán giá trị ở cột Loại nội bộ (Internal Type) cho thuộc tính `type` trong đối tượng đang chạy (live object). "Các loại Secret chuyên biệt" thảo luận về các loại Secret khác và trường hợp sử dụng của chúng.

**Bảng 10-2. Các tùy chọn để tạo Secret**

| Tùy chọn CLI | Mô tả | Loại nội bộ |
|---|---|---|
| `generic` | Tạo Secret từ file, thư mục, hoặc giá trị literal | `Opaque` |
| `docker-registry` | Tạo Secret để dùng với Docker registry, ví dụ để pull image từ một registry riêng khi Pod yêu cầu | `kubernetes.io/dockercfg` |
| `tls` | Tạo Secret TLS | `kubernetes.io/tls` |

Loại Secret được dùng phổ biến nhất là `generic`. Các tùy chọn cho Secret loại generic hoàn toàn giống với ConfigMap, như trong Bảng 10-3.

**Bảng 10-3. Các tùy chọn nguồn dữ liệu được Secret phân tích**

| Tùy chọn | Ví dụ | Mô tả |
|---|---|---|
| `--from-literal` | `--from-literal=password=secret` | Giá trị literal, là các cặp key-value dạng văn bản thuần |
| `--from-env-file` | `--from-env-file=config.env` | Một file chứa các cặp key-value và kỳ vọng chúng là biến môi trường |
| `--from-file` | `--from-file=id_rsa=~/.ssh/id_rsa` | Một file với nội dung tùy ý |
| `--from-file` | `--from-file=config-dir` | Một thư mục với một hay nhiều file |

Để minh họa chức năng này, hãy tạo một Secret loại `generic`. Lệnh này lấy các cặp key-value từ các literal được cung cấp qua tùy chọn dòng lệnh:

```shell
$ kubectl create secret generic db-creds --from-literal=pwd=s3cre!
secret/db-creds created
```

Khi được tạo bằng lệnh mệnh lệnh, Secret sẽ tự động encode Base64 giá trị được cung cấp. Có thể quan sát điều này bằng cách xem manifest YAML được tạo ra. Bạn có thể thấy trong Ví dụ 10-6 rằng giá trị `s3cre!` đã được chuyển thành `czNjcmUh`, tức dạng encode Base64 tương ứng.

**Ví dụ 10-6. Secret với các giá trị được encode Base64**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque                               # ❶
data:
  pwd: czNjcmUh                            # ❷
```

❶ Giá trị `Opaque` được gán cho `type` để biểu diễn dữ liệu nhạy cảm dạng tổng quát (generic).

❷ Giá trị văn bản thuần đã được encode Base64 tự động nếu đối tượng được tạo theo cách mệnh lệnh.

Nếu bạn bắt đầu từ manifest YAML để tạo đối tượng Secret, bạn sẽ cần tự tạo giá trị được encode Base64 nếu muốn gán nó cho thuộc tính `data`. Một công cụ Unix làm được việc này là `base64`. Lệnh sau thực hiện chính xác điều đó:

```shell
$ echo -n 's3cre!' | base64
czNjcmUh
```

Xin nhắc lại, nếu bạn có quyền truy cập vào đối tượng Secret hoặc manifest YAML của nó, thì bạn có thể decode giá trị được encode Base64 bất cứ lúc nào bằng công cụ Unix `base64`. Do đó, bạn cũng có thể chỉ định giá trị ở dạng văn bản thuần khi định nghĩa manifest, điều này được thảo luận trong mục tiếp theo.

#### Định nghĩa dữ liệu Secret với giá trị văn bản thuần

Việc phải tạo và gán các giá trị được encode Base64 vào manifest của Secret có thể trở nên phiền phức. Primitive Secret cung cấp thuộc tính `stringData` để thay thế cho thuộc tính `data`. Với `stringData`, bạn có thể gán các giá trị văn bản thuần trong file manifest, như trong Ví dụ 10-7.

**Ví dụ 10-7. Secret với các giá trị văn bản thuần**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque
stringData:                                # ❶
  pwd: s3cre!                              # ❷
```

❶ Thuộc tính `stringData` cho phép gán các cặp key-value văn bản thuần.

❷ Giá trị được tham chiếu bởi key `pwd` được cung cấp ở định dạng văn bản thuần.

Kubernetes sẽ tự động encode Base64 giá trị `s3cre!` khi tạo đối tượng từ manifest. Kết quả là biểu diễn đối tượng đang chạy như trong Ví dụ 10-8, mà bạn có thể lấy được bằng lệnh `kubectl get secret db-creds -o yaml`.

**Ví dụ 10-8. Đối tượng Secret đang chạy**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-creds
type: Opaque
data:                                      # ❶
  pwd: czNjcmUh                            # ❷
```

❶ Đối tượng đang chạy của Secret luôn dùng thuộc tính `data` ngay cả khi bạn có thể đã dùng `stringData` trong manifest.

❷ Giá trị đã được encode Base64 khi tạo.

Bạn có thể biểu diễn dữ liệu Secret tùy ý bằng loại `Opaque`. Kubernetes cung cấp các loại Secret chuyên biệt để bạn lựa chọn nếu dữ liệu phù hợp với những trường hợp sử dụng cụ thể. Mục tiếp theo thảo luận về các loại Secret chuyên biệt đó.

#### Các loại Secret chuyên biệt

Thay vì dùng loại Secret `Opaque`, bạn cũng có thể dùng một trong các loại chuyên biệt để biểu diễn dữ liệu cấu hình cho những trường hợp sử dụng cụ thể. Loại `kubernetes.io/basic-auth` dành cho xác thực cơ bản (basic authentication) và kỳ vọng các key `username` và `password`. Tại thời điểm viết sách, Kubernetes không kiểm tra tính đúng đắn của các key được gán.

Đối tượng được tạo từ định nghĩa này tự động encode Base64 giá trị của cả hai key. Ví dụ 10-9 minh họa manifest YAML cho một Secret có type `kubernetes.io/basic-auth`.

**Ví dụ 10-9. Cách dùng loại Secret kubernetes.io/basic-auth**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: secret-basic-auth
type: kubernetes.io/basic-auth
stringData:                                # ❶
  username: bmuschko                       # ❷
  password: secret                         # ❷
```

❶ Dùng thuộc tính `stringData` để cho phép gán các giá trị văn bản thuần

❷ Chỉ định các key bắt buộc mà loại Secret `kubernetes.io/basic-auth` yêu cầu

### Sử dụng Secret dưới dạng biến môi trường

Việc sử dụng Secret dưới dạng biến môi trường hoạt động tương tự như cách bạn làm với ConfigMap. Ở đây, bạn sẽ dùng biểu thức YAML `spec.containers[].envFrom[].secretRef` để tham chiếu tên của Secret. Ví dụ 10-10 đưa Secret có tên `secret-basic-auth` vào container có tên `backend` dưới dạng biến môi trường.

**Ví dụ 10-10. Đưa các cặp key-value của Secret vào container**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: bmuschko/web-app:1.0.1
    name: backend
    envFrom:
    - secretRef:
        name: secret-basic-auth
```

Kiểm tra các biến môi trường trong container cho thấy các giá trị Secret không cần phải được decode. Đó là việc Kubernetes tự động làm. Do đó, ứng dụng đang chạy không cần cài đặt logic riêng để decode giá trị. Lưu ý rằng Kubernetes không kiểm tra hay chuẩn hóa quy ước đặt tên thông thường của biến môi trường, như bạn thấy trong kết quả sau:

```shell
$ kubectl exec backend -- env
...
username=bmuschko
password=secret
...
```

### Ánh xạ lại key của biến môi trường

Đôi khi, các cặp key-value lưu trong Secret không tuân theo quy ước đặt tên thông thường của biến môi trường hoặc không thể thay đổi mà không ảnh hưởng đến các dịch vụ đang chạy. Bạn có thể định nghĩa lại các key dùng để đưa biến môi trường vào Pod bằng thuộc tính `spec.containers[].env[].valueFrom`. Ví dụ 10-11 chuyển key `username` thành `USER` và key `password` thành `PWD`.

**Ví dụ 10-11. Ánh xạ lại key của biến môi trường cho các mục Secret**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: bmuschko/web-app:1.0.1
    name: backend
    env:
    - name: USER
      valueFrom:
        secretKeyRef:
          name: secret-basic-auth
          key: username
    - name: PWD
      valueFrom:
        secretKeyRef:
          name: secret-basic-auth
          key: password
```

Các biến môi trường thu được có sẵn cho container giờ đây tuân theo quy ước thông thường của biến môi trường, và chúng ta đã thay đổi cách chúng được mã ứng dụng sử dụng:

```shell
$ kubectl exec backend -- env
...
USER=bmuschko
PWD=secret
...
```

Cơ chế gán lại biến môi trường tương tự cũng hoạt động với ConfigMap. Bạn sẽ dùng thuộc tính `spec.containers[].env[].valueFrom.configMapRef` thay thế.

### Mount Secret dưới dạng volume

Để minh họa việc mount Secret dưới dạng volume, chúng ta sẽ tạo một Secret mới có loại `kubernetes.io/ssh-auth`. Loại Secret này chứa giá trị của khóa riêng (private key) SSH mà bạn có thể xem bằng lệnh `cat ~/.ssh/id_rsa`. Để xử lý file khóa riêng SSH bằng lệnh `create secret`, file đó cần có sẵn với tên *ssh-privatekey*:

```shell
$ cp ~/.ssh/id_rsa ssh-privatekey
$ kubectl create secret generic secret-ssh-auth --from-file=ssh-privatekey \
  --type=kubernetes.io/ssh-auth
secret/secret-ssh-auth created
```

Mount Secret dưới dạng volume tuân theo cách tiếp cận hai bước: định nghĩa volume trước, rồi tham chiếu nó làm đường dẫn mount cho một hoặc nhiều container. Loại volume này có tên là `secret`, như được dùng trong Ví dụ 10-12.

**Ví dụ 10-12. Mount Secret dưới dạng volume**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: backend
spec:
  containers:
  - image: bmuschko/web-app:1.0.1
    name: backend
    volumeMounts:
    - name: ssh-volume
      mountPath: /var/app
      readOnly: true                       # ❶
  volumes:
  - name: ssh-volume
    secret:
      secretName: secret-ssh-auth          # ❷
```

❶ Các file do Secret cung cấp khi được mount dưới dạng volume không thể bị sửa đổi.

❷ Lưu ý rằng thuộc tính `secretName` trỏ tới tên Secret không giống với ConfigMap (vốn là `name`).

Bạn sẽ tìm thấy file có tên *ssh-privatekey* trong đường dẫn mount */var/app*. Để xác minh, hãy mở một shell tương tác và hiển thị nội dung file. Nội dung của file không được encode Base64:

```shell
$ kubectl exec -it backend -- /bin/sh
# ls -1 /var/app
ssh-privatekey
# cat /var/app/ssh-privatekey
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-128-CBC,8734C9153079F2E8497C8075289EBBF1
...
-----END RSA PRIVATE KEY-----
```

## Tóm tắt

Hành vi lúc chạy của ứng dụng có thể được điều khiển bằng cách đưa dữ liệu cấu hình vào dưới dạng biến môi trường hoặc bằng cách mount một volume vào một đường dẫn. Trong Kubernetes, dữ liệu cấu hình này được biểu diễn bởi các tài nguyên API ConfigMap và Secret dưới dạng các cặp key-value. ConfigMap dành cho dữ liệu văn bản thuần, còn Secret encode các giá trị bằng Base64 để làm mờ (obfuscate) chúng. Secret phù hợp hơn cho thông tin nhạy cảm như thông tin đăng nhập (credentials) và khóa riêng SSH.

## Trọng tâm cho kỳ thi

**Luyện tập tạo đối tượng ConfigMap theo cách mệnh lệnh và khai báo (declarative)**

Cách nhanh nhất để tạo các đối tượng đó là các lệnh mệnh lệnh `kubectl create configmap`. Hãy hiểu cách cung cấp dữ liệu với sự trợ giúp của các cờ dòng lệnh khác nhau. ConfigMap chỉ định các cặp key-value văn bản thuần trong phần `data` của manifest YAML.

**Luyện tập tạo đối tượng Secret theo cách mệnh lệnh và khai báo**

Tạo Secret bằng lệnh mệnh lệnh `kubectl create secret` không đòi hỏi bạn phải encode Base64 các giá trị được cung cấp. `kubectl` thực hiện thao tác encode một cách tự động. Cách tiếp cận khai báo yêu cầu manifest YAML của Secret chỉ định giá trị được encode Base64 trong phần `data`. Bạn có thể dùng thuộc tính tiện lợi `stringData` thay cho thuộc tính `data` nếu muốn cung cấp giá trị văn bản thuần. Đối tượng đang chạy sẽ dùng giá trị được encode Base64. Về mặt chức năng, không có sự khác biệt lúc chạy giữa việc dùng `data` và `stringData`.

**Hiểu mục đích của các loại Secret chuyên biệt**

Secret cung cấp các loại chuyên biệt, ví dụ `kubernetes.io/basic-auth` hoặc `kubernetes.io/service-account-token`, để biểu diễn dữ liệu cho những trường hợp sử dụng cụ thể. Hãy đọc thêm về các loại khác nhau trong tài liệu Kubernetes và hiểu mục đích của chúng.

**Biết cách kiểm tra dữ liệu ConfigMap và Secret**

Kỳ thi có thể đặt bạn trước các đối tượng ConfigMap và Secret có sẵn. Bạn cần hiểu cách dùng lệnh `kubectl get` hoặc `kubectl describe` để kiểm tra dữ liệu của các đối tượng đó. Đối tượng đang chạy của Secret sẽ luôn biểu diễn giá trị ở định dạng được encode Base64.

**Thực hành việc sử dụng ConfigMap và Secret trong Pod**

Trường hợp sử dụng chính của ConfigMap và Secret là sử dụng dữ liệu từ một Pod. Pod có thể đưa dữ liệu cấu hình vào container dưới dạng biến môi trường hoặc mount dữ liệu cấu hình dưới dạng volume. Với kỳ thi, bạn cần quen thuộc với cả hai phương pháp sử dụng này.

## Bài tập mẫu

Lời giải cho các bài tập này có trong Phụ lục A.

1. Trong bài tập này, trước tiên bạn sẽ tạo một ConfigMap từ một file cấu hình YAML làm nguồn. Sau đó, bạn sẽ tạo một Pod, sử dụng ConfigMap dưới dạng volume, và kiểm tra các cặp key-value dưới dạng file.

   Di chuyển đến thư mục *app-a/ch10/configmap* của kho GitHub *bmuschko/cka-study-guide* đã checkout. Kiểm tra file cấu hình YAML có tên *application.yaml*.

   Tạo một ConfigMap mới có tên `app-config` từ file đó.

   Tạo một Pod có tên `backend` sử dụng ConfigMap dưới dạng volume tại đường dẫn mount */etc/config*. Container chạy image `nginx:1.23.4-alpine`.

   Shell vào Pod và kiểm tra file tại đường dẫn volume đã mount.

2. Trong bài tập này, trước tiên bạn sẽ tạo một Secret từ các giá trị literal. Tiếp theo, bạn sẽ tạo một Pod và sử dụng Secret dưới dạng biến môi trường. Cuối cùng, bạn sẽ in ra các giá trị của nó từ bên trong container.

   Tạo một Secret mới có tên `db-credentials` với cặp key-value `db-password=passwd`.

   Tạo một Pod có tên `backend` dùng Secret làm biến môi trường có tên `DB_PASSWORD` và chạy container với image `nginx:1.23.4-alpine`.

   Shell vào Pod và in ra các biến môi trường đã được tạo. Bạn sẽ tìm thấy biến `DB_PASSWORD`.
