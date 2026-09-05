# Chương 4. Các lệnh kubectl thông dụng

Tiện ích dòng lệnh `kubectl` là một công cụ mạnh mẽ, và trong các chương tiếp theo, bạn sẽ dùng nó để tạo các đối tượng và tương tác với Kubernetes API. Tuy nhiên, trước đó, việc điểm qua các lệnh `kubectl` cơ bản áp dụng cho mọi đối tượng Kubernetes là hợp lý.

## Namespace

Kubernetes sử dụng namespace để tổ chức các đối tượng trong cluster. Bạn có thể nghĩ về mỗi namespace như một thư mục chứa một tập các đối tượng. Theo mặc định, công cụ dòng lệnh `kubectl` tương tác với namespace `default`. Nếu bạn muốn dùng một namespace khác, bạn có thể truyền cho `kubectl` cờ `--namespace`. Ví dụ, `kubectl --namespace=mystuff` tham chiếu đến các đối tượng trong namespace `mystuff`. Bạn cũng có thể dùng cờ viết tắt `-n` nếu muốn ngắn gọn. Nếu bạn muốn tương tác với tất cả các namespace, ví dụ để liệt kê tất cả các Pod trong cluster, bạn có thể truyền cờ `--all-namespaces`.

## Context

Nếu bạn muốn thay đổi namespace mặc định một cách lâu dài hơn, bạn có thể dùng context. Điều này được ghi lại trong file cấu hình `kubectl`, thường nằm tại *$HOME/.kube/config*. File cấu hình này cũng lưu cách tìm và xác thực với cluster của bạn. Ví dụ, bạn có thể tạo một context với namespace mặc định khác cho các lệnh `kubectl` của mình bằng:

```
$ kubectl config set-context my-context --namespace=mystuff
```

Lệnh này tạo một context mới, nhưng chưa thực sự bắt đầu sử dụng nó. Để dùng context mới tạo này, bạn có thể chạy:

```
$ kubectl config use-context my-context
```

Context cũng có thể được dùng để quản lý các cluster khác nhau hoặc các người dùng khác nhau để xác thực với những cluster đó bằng các cờ `--users` hoặc `--clusters` với lệnh `set-context`.

## Xem các đối tượng Kubernetes API

Mọi thứ chứa trong Kubernetes đều được biểu diễn bằng một tài nguyên RESTful. Xuyên suốt cuốn sách này, chúng tôi gọi những tài nguyên này là các đối tượng Kubernetes (Kubernetes object). Mỗi đối tượng Kubernetes tồn tại tại một đường dẫn HTTP duy nhất; ví dụ, *https://your-k8s.com/api/v1/namespaces/default/pods/my-pod* dẫn đến biểu diễn của một Pod trong namespace `default` có tên `my-pod`. Lệnh `kubectl` tạo các yêu cầu HTTP đến các URL này để truy cập các đối tượng Kubernetes nằm tại các đường dẫn đó.

Lệnh cơ bản nhất để xem các đối tượng Kubernetes qua `kubectl` là `get`. Nếu bạn chạy `kubectl get <resource-name>`, bạn sẽ nhận được danh sách tất cả các tài nguyên trong namespace hiện tại. Nếu bạn muốn lấy một tài nguyên cụ thể, bạn có thể dùng `kubectl get <resource-name> <obj-name>`.

Theo mặc định, `kubectl` dùng một trình in dễ đọc cho con người để xem các phản hồi từ API server, nhưng trình in này loại bỏ nhiều chi tiết của các đối tượng để mỗi đối tượng vừa trên một dòng terminal. Một cách để có thêm chút thông tin là thêm cờ `-o wide`, cho nhiều chi tiết hơn trên một dòng dài hơn. Nếu bạn muốn xem đối tượng đầy đủ, bạn cũng có thể xem các đối tượng dưới dạng JSON hoặc YAML thô bằng các cờ `-o json` hoặc `-o yaml` tương ứng.

Một tùy chọn phổ biến để thao tác với kết quả của `kubectl` là loại bỏ tiêu đề, điều này thường hữu ích khi kết hợp `kubectl` với Unix pipe (ví dụ, `kubectl ... | awk ...`). Nếu bạn chỉ định cờ `--no-headers`, `kubectl` sẽ bỏ qua các tiêu đề ở đầu bảng dễ đọc.

Một tác vụ phổ biến khác là trích xuất các trường cụ thể từ đối tượng. `kubectl` dùng ngôn ngữ truy vấn JSONPath để chọn các trường trong đối tượng được trả về. Chi tiết đầy đủ về JSONPath nằm ngoài phạm vi của chương này, nhưng để làm ví dụ, lệnh này sẽ trích xuất và in địa chỉ IP của Pod được chỉ định:

```
$ kubectl get pods my-pod -o jsonpath --template={.status.podIP}
```

Bạn cũng có thể xem nhiều đối tượng thuộc các loại khác nhau bằng cách dùng danh sách các loại phân tách bằng dấu phẩy, ví dụ:

```
$ kubectl get pods,services
```

Lệnh này sẽ hiển thị tất cả các Pod và service của một namespace nhất định.

Nếu bạn quan tâm đến thông tin chi tiết hơn về một đối tượng cụ thể, hãy dùng lệnh `describe`:

```
$ kubectl describe <resource-name> <obj-name>
```

Lệnh này sẽ cung cấp một mô tả phong phú nhiều dòng dễ đọc về đối tượng cũng như bất kỳ đối tượng và sự kiện liên quan khác trong Kubernetes cluster.

Nếu bạn muốn xem danh sách các trường được hỗ trợ cho từng loại đối tượng Kubernetes được hỗ trợ, bạn có thể dùng lệnh `explain`:

```
$ kubectl explain pods
```

Đôi khi bạn muốn liên tục quan sát trạng thái của một tài nguyên Kubernetes cụ thể để thấy các thay đổi của tài nguyên khi chúng xảy ra. Ví dụ, bạn có thể đang chờ ứng dụng của mình khởi động lại. Cờ `--watch` cho phép điều này. Bạn có thể thêm cờ này vào bất kỳ lệnh `kubectl get` nào để liên tục theo dõi trạng thái của một tài nguyên cụ thể.

## Tạo, cập nhật và hủy các đối tượng Kubernetes

Các đối tượng trong Kubernetes API được biểu diễn dưới dạng các file JSON hoặc YAML. Các file này hoặc được server trả về để phản hồi một truy vấn, hoặc được gửi đến server như một phần của yêu cầu API. Bạn có thể dùng các file YAML hoặc JSON này để tạo, cập nhật hoặc xóa các đối tượng trên Kubernetes server.

Giả sử bạn có một đối tượng đơn giản được lưu trong *obj.yaml*. Bạn có thể dùng `kubectl` để tạo đối tượng này trong Kubernetes bằng cách chạy:

```
$ kubectl apply -f obj.yaml
```

Lưu ý rằng bạn không cần chỉ định loại tài nguyên của đối tượng; nó được lấy từ chính file đối tượng.

Tương tự, sau khi bạn thực hiện các thay đổi lên đối tượng, bạn có thể dùng lệnh `apply` lần nữa để cập nhật đối tượng:

```
$ kubectl apply -f obj.yaml
```

Công cụ `apply` sẽ chỉ sửa đổi các đối tượng khác với các đối tượng hiện tại trong cluster. Nếu các đối tượng bạn đang tạo đã tồn tại trong cluster, nó sẽ đơn giản thoát thành công mà không thực hiện thay đổi nào. Điều này làm nó hữu ích cho các vòng lặp mà bạn muốn đảm bảo trạng thái của cluster khớp với trạng thái của filesystem. Bạn có thể dùng `apply` lặp đi lặp lại để đồng bộ (reconcile) trạng thái.

Nếu bạn muốn xem lệnh `apply` sẽ làm gì mà không thực sự thực hiện thay đổi, bạn có thể dùng cờ `--dry-run` để in các đối tượng ra terminal mà không thực sự gửi chúng đến server.

> **LƯU Ý**
>
> Nếu bạn muốn chỉnh sửa tương tác thay vì chỉnh sửa một file cục bộ, bạn có thể dùng lệnh `edit`, lệnh này sẽ tải trạng thái mới nhất của đối tượng rồi khởi chạy một trình soạn thảo chứa định nghĩa đó:
>
> ```
> $ kubectl edit <resource-name> <obj-name>
> ```
>
> Sau khi bạn lưu file, nó sẽ tự động được tải lên lại Kubernetes cluster.

Lệnh `apply` cũng ghi lại lịch sử các cấu hình trước đó trong một annotation bên trong đối tượng. Bạn có thể thao tác với các bản ghi này bằng các lệnh `edit-last-applied`, `set-last-applied` và `view-last-applied`. Ví dụ:

```
$ kubectl apply -f myobj.yaml view-last-applied
```

sẽ cho bạn thấy trạng thái cuối cùng đã được áp dụng lên đối tượng.

Khi bạn muốn xóa một đối tượng, bạn có thể đơn giản chạy:

```
$ kubectl delete -f obj.yaml
```

Cần lưu ý rằng `kubectl` sẽ không nhắc bạn xác nhận việc xóa. Một khi bạn đưa ra lệnh, đối tượng sẽ bị xóa.

Tương tự, bạn có thể xóa một đối tượng bằng loại tài nguyên và tên:

```
$ kubectl delete <resource-name> <obj-name>
```

## Gắn Label và Annotation cho đối tượng

Label và annotation là các thẻ (tag) cho các đối tượng của bạn. Chúng ta sẽ thảo luận về sự khác biệt trong Chương 6, nhưng hiện tại, bạn có thể cập nhật label và annotation trên bất kỳ đối tượng Kubernetes nào bằng các lệnh `label` và `annotate`. Ví dụ, để thêm label `color=red` vào một Pod tên `bar`, bạn có thể chạy:

```
$ kubectl label pods bar color=red
```

Cú pháp cho annotation là giống hệt.

Theo mặc định, `label` và `annotate` sẽ không cho bạn ghi đè một label đã tồn tại. Để làm điều này, bạn cần thêm cờ `--overwrite`.

Nếu bạn muốn xóa một label, bạn có thể dùng cú pháp `<label-name>-`:

```
$ kubectl label pods bar color-
```

Lệnh này sẽ xóa label `color` khỏi Pod tên `bar`.

## Các lệnh gỡ lỗi

`kubectl` cũng cung cấp một số lệnh để gỡ lỗi các container của bạn. Bạn có thể dùng lệnh sau để xem log của một container đang chạy:

```
$ kubectl logs <pod-name>
```

Nếu bạn có nhiều container trong Pod, bạn có thể chọn container để xem bằng cờ `-c`.

Theo mặc định, `kubectl logs` liệt kê các log hiện tại và thoát. Nếu bạn muốn liên tục stream log về terminal mà không thoát, bạn có thể thêm cờ dòng lệnh `-f` (follow).

Bạn cũng có thể dùng lệnh `exec` để thực thi một lệnh trong một container đang chạy:

```
$ kubectl exec -it <pod-name> -- bash
```

Lệnh này sẽ cung cấp cho bạn một shell tương tác bên trong container đang chạy để bạn có thể thực hiện thêm việc gỡ lỗi.

Nếu bạn không có `bash` hoặc một terminal nào khác trong container, bạn luôn có thể attach vào tiến trình đang chạy:

```
$ kubectl attach -it <pod-name>
```

Lệnh `attach` tương tự `kubectl logs` nhưng sẽ cho phép bạn gửi đầu vào đến tiến trình đang chạy, giả định rằng tiến trình đó được thiết lập để đọc từ standard input.

Bạn cũng có thể sao chép file đến và từ một container bằng lệnh `cp`:

```
$ kubectl cp <pod-name>:</path/to/remote/file> </path/to/local/file>
```

Lệnh này sẽ sao chép một file từ container đang chạy về máy cục bộ của bạn. Bạn cũng có thể chỉ định thư mục, hoặc đảo ngược cú pháp để sao chép một file từ máy cục bộ ra ngược lại container.

Nếu bạn muốn truy cập Pod của mình qua mạng, bạn có thể dùng lệnh `port-forward` để chuyển tiếp lưu lượng mạng từ máy cục bộ đến Pod. Điều này cho phép bạn tạo đường hầm an toàn cho lưu lượng mạng đến các container có thể không được phơi bày ở bất kỳ đâu trên mạng công cộng. Ví dụ, lệnh sau:

```
$ kubectl port-forward <pod-name> 8080:80
```

mở một kết nối chuyển tiếp lưu lượng từ máy cục bộ trên cổng 8080 đến container từ xa trên cổng 80.

> **LƯU Ý**
>
> Bạn cũng có thể dùng lệnh `port-forward` với các service bằng cách chỉ định `services/<service-name>` thay cho `<pod-name>`, nhưng lưu ý rằng nếu bạn port-forward đến một service, các yêu cầu sẽ chỉ được chuyển tiếp đến một Pod duy nhất trong service đó. Chúng sẽ không đi qua load balancer của service.

Nếu bạn muốn xem các sự kiện (event) Kubernetes, bạn có thể dùng lệnh `kubectl get events` để xem danh sách 10 sự kiện mới nhất trên tất cả các đối tượng trong một namespace nhất định:

```
$ kubectl get events
```

Bạn cũng có thể stream các sự kiện khi chúng xảy ra bằng cách thêm `--watch` vào lệnh `kubectl get events`. Bạn cũng có thể muốn thêm `-A` để xem các sự kiện trong tất cả các namespace.

Cuối cùng, nếu bạn quan tâm đến cách cluster của mình đang sử dụng tài nguyên, bạn có thể dùng lệnh `top` để xem danh sách tài nguyên đang được sử dụng bởi các node hoặc Pod. Lệnh này:

```
$ kubectl top nodes
```

sẽ hiển thị tổng CPU và bộ nhớ đang được các node sử dụng theo cả đơn vị tuyệt đối (ví dụ, số core) và phần trăm tài nguyên khả dụng (ví dụ, tổng số core). Tương tự, lệnh này:

```
$ kubectl top pods
```

sẽ hiển thị tất cả các Pod và mức sử dụng tài nguyên của chúng. Theo mặc định nó chỉ hiển thị các Pod trong namespace hiện tại, nhưng bạn có thể thêm cờ `--all-namespaces` để xem mức sử dụng tài nguyên của tất cả các Pod trong cluster.

Các lệnh `top` này chỉ hoạt động nếu có một metrics server đang chạy trong cluster của bạn. Metrics server hiện diện trong gần như mọi môi trường Kubernetes được quản lý và cả nhiều môi trường không được quản lý. Nhưng nếu các lệnh này thất bại, có thể là do bạn cần cài đặt một metrics server.

## Quản lý Cluster

Công cụ `kubectl` cũng có thể được dùng để quản lý chính cluster. Hành động phổ biến nhất mà người ta thực hiện để quản lý cluster là cordon và drain một node cụ thể. Khi bạn cordon một node, bạn ngăn các Pod trong tương lai được lên lịch lên máy đó. Khi bạn drain một node, bạn loại bỏ mọi Pod hiện đang chạy trên máy đó. Một ví dụ điển hình về trường hợp sử dụng các lệnh này là gỡ một máy vật lý để sửa chữa hoặc nâng cấp. Trong tình huống đó, bạn có thể dùng `kubectl cordon` rồi `kubectl drain` để gỡ máy khỏi cluster một cách an toàn. Một khi máy đã được sửa xong, bạn có thể dùng `kubectl uncordon` để cho phép lên lịch Pod lên node đó trở lại. Không có lệnh `undrain`; các Pod sẽ tự nhiên được lên lịch lên node trống khi chúng được tạo. Với thứ gì đó nhanh ảnh hưởng đến node (ví dụ, khởi động lại máy), thường không cần thiết phải cordon hay drain; chỉ cần thiết nếu máy sẽ ngừng hoạt động đủ lâu để bạn muốn các Pod di chuyển sang máy khác.

## Tự động hoàn thành lệnh

`kubectl` hỗ trợ tích hợp với shell của bạn để cho phép hoàn thành bằng phím tab cho cả lệnh và tài nguyên. Tùy vào môi trường, bạn có thể cần cài đặt gói `bash-completion` trước khi kích hoạt tự động hoàn thành lệnh. Bạn có thể làm điều này bằng trình quản lý gói thích hợp:

```
# macOS
$ brew install bash-completion

# CentOS/Red Hat
$ yum install bash-completion

# Debian/Ubuntu
$ apt-get install bash-completion
```

Khi cài đặt trên macOS, hãy đảm bảo làm theo hướng dẫn từ `brew` về cách kích hoạt hoàn thành tab bằng file *${HOME}/.bash_profile* của bạn.

Một khi `bash-completion` đã được cài đặt, bạn có thể tạm thời kích hoạt nó cho terminal của mình bằng:

```
$ source <(kubectl completion bash)
```

Để làm điều này tự động cho mọi terminal, thêm nó vào file *${HOME}/.bashrc* của bạn:

```
$ echo "source <(kubectl completion bash)" >> ${HOME}/.bashrc
```

Nếu bạn dùng `zsh`, bạn có thể tìm hướng dẫn tương tự trên mạng.

## Các cách khác để xem Cluster của bạn

Ngoài `kubectl`, còn có các công cụ khác để tương tác với Kubernetes cluster của bạn. Ví dụ, có các plug-in cho một số trình soạn thảo tích hợp Kubernetes với môi trường soạn thảo, bao gồm:

- Visual Studio Code
- IntelliJ
- Eclipse

Nếu bạn đang dùng dịch vụ Kubernetes được quản lý, hầu hết chúng cũng có một giao diện đồ họa cho Kubernetes được tích hợp vào trải nghiệm người dùng trên web của họ. Kubernetes được quản lý trên public cloud cũng tích hợp với các công cụ giám sát tinh vi có thể giúp bạn hiểu rõ hơn về cách ứng dụng của mình đang chạy.

Cũng có một số giao diện đồ họa mã nguồn mở cho Kubernetes bao gồm Rancher Dashboard và dự án Headlamp.

## Tóm tắt

`kubectl` là một công cụ mạnh mẽ để quản lý các ứng dụng trong Kubernetes cluster của bạn. Chương này đã minh họa nhiều cách sử dụng phổ biến của công cụ này, nhưng `kubectl` còn có rất nhiều trợ giúp tích hợp sẵn. Bạn có thể bắt đầu xem trợ giúp này bằng:

```
$ kubectl help
```

hoặc:

```
$ kubectl help <command-name>
```
