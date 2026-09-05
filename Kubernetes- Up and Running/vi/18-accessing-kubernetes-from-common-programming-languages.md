# Chương 18. Truy cập Kubernetes từ các ngôn ngữ lập trình phổ biến

Mặc dù phần lớn cuốn sách này dành cho việc sử dụng cấu hình YAML khai báo, trực tiếp qua `kubectl` hoặc thông qua các công cụ như Helm, có những tình huống cần tương tác với Kubernetes API trực tiếp từ một ngôn ngữ lập trình. Ví dụ, chính các tác giả của công cụ Helm cần viết ứng dụng đó bằng một ngôn ngữ lập trình. Tổng quát hơn, điều này phổ biến nếu bạn cần viết một công cụ bổ sung nào đó, như một plug-in `kubectl`, hoặc một đoạn code phức tạp hơn, như một Kubernetes operator.

Phần lớn hệ sinh thái Kubernetes được viết bằng ngôn ngữ lập trình Go. Kết quả là, ngôn ngữ Go có client phong phú và đầy đủ nhất. Tuy nhiên, có các client chất lượng cao cho hầu hết các ngôn ngữ lập trình phổ biến (và thậm chí một số ngôn ngữ không phổ biến). Vì đã có rất nhiều tài liệu và ví dụ về cách dùng Go client, chương này sẽ đề cập đến những điều cơ bản về tương tác với Kubernetes API server với các ví dụ bằng Python, Java và .NET.

## Kubernetes API: Góc nhìn của Client

Cuối cùng thì Kubernetes API server chỉ là một HTTP(S) server và đó chính xác là cách mỗi thư viện client nhìn nhận nó, mặc dù mỗi client có nhiều logic bổ sung hiện thực các lời gọi API khác nhau và tuần tự hóa đến và từ JSON. Với điều này, bạn có thể bị cám dỗ đơn giản dùng một HTTP client thuần để làm việc với Kubernetes API, nhưng các thư viện client gói các lời gọi HTTP khác nhau này thành các API có ý nghĩa giúp code của bạn dễ đọc hơn (ví dụ, `readNamespacedPod(...)`), và các mô hình đối tượng có kiểu có ý nghĩa tạo điều kiện cho kiểm tra kiểu tĩnh và do đó dẫn đến ít lỗi hơn (ví dụ, `Deployment`). Có lẽ quan trọng hơn, các thư viện client cũng hiện thực các khả năng đặc thù của Kubernetes, như tải thông tin ủy quyền từ file kubeconfig hoặc từ môi trường của Pod. Các client cũng cung cấp các hiện thực của các phần không phải RESTful của bề mặt Kubernetes API như port-forward, log và watch. Chúng tôi sẽ mô tả các khả năng nâng cao này trong các phần sau.

### OpenAPI và các thư viện Client được sinh tự động

Tập tài nguyên và hàm trong Kubernetes API là khổng lồ. Có nhiều tài nguyên khác nhau trong các API group khác nhau và nhiều thao tác khác nhau trên mỗi tài nguyên này. Theo kịp tất cả các tài nguyên và phiên bản tài nguyên khác nhau này sẽ là một công việc khổng lồ (và rõ ràng là nhàm chán) nếu các nhà phát triển phải viết tay tất cả các lời gọi API này. Đặc biệt khi xem xét rằng client phải được viết tay cho từng ngôn ngữ lập trình. Thay vào đó, các client thực hiện một cách tiếp cận khác, và những điều cơ bản về tương tác với Kubernetes API server đều được sinh ra bởi một chương trình máy tính hơi giống một trình biên dịch ngược. Trình sinh code cho các API client lấy một đặc tả dữ liệu cho Kubernetes API và dùng đặc tả này để sinh ra một client cho một ngôn ngữ cụ thể.

Kubernetes API được biểu diễn ở định dạng gọi là OpenAPI, là schema phổ biến nhất để biểu diễn các RESTful API. Để bạn cảm nhận được kích cỡ của Kubernetes API, đặc tả OpenAPI trên GitHub có kích cỡ hơn bốn megabyte. Đó là một file văn bản khá lớn! Các thư viện client Kubernetes chính thức đều được sinh ra bằng cùng logic sinh code cốt lõi, có thể tìm thấy trên GitHub. Không có khả năng bạn thực sự phải tự sinh các thư viện client, nhưng dù vậy, việc hiểu quy trình tạo ra các thư viện này là hữu ích. Cụ thể, vì phần lớn code client được sinh tự động, các cập nhật và sửa lỗi không thể được thực hiện trực tiếp trong code client được sinh ra, vì nó sẽ bị ghi đè lần tiếp theo API được sinh. Thay vào đó, khi tìm thấy lỗi trong client, các bản sửa cần được thực hiện lên đặc tả OpenAPI (nếu lỗi nằm trong chính đặc tả) hoặc trình sinh code (nếu lỗi nằm trong code được sinh). Mặc dù quy trình này có vẻ quá phức tạp, đó là cách duy nhất để một số nhỏ tác giả client Kubernetes theo kịp độ rộng của Kubernetes API.

### Nhưng còn kubectl x thì sao?

Khi bạn bắt đầu hiện thực logic của riêng mình để tương tác với Kubernetes API, có lẽ không lâu sau bạn sẽ tự hỏi làm sao để thực hiện `kubectl x`. Hầu hết mọi người bắt đầu với công cụ `kubectl` khi học Kubernetes và do đó kỳ vọng có một ánh xạ 1-1 giữa các khả năng trong `kubectl` và Kubernetes API. Mặc dù một số lệnh được biểu diễn trực tiếp trong Kubernetes API (ví dụ, `kubectl get pods`), hầu hết các tính năng tinh vi hơn thực ra là một số lượng lớn hơn các lời gọi API với logic phức tạp trong công cụ `kubectl`.

Sự cân bằng giữa các tính năng phía client và phía server này đã là một sự đánh đổi thiết kế từ đầu Kubernetes. Nhiều tính năng hiện có trong API server bắt đầu như các hiện thực phía client trong `kubectl`. Ví dụ, các khả năng rollout hiện được hiện thực trên server bởi tài nguyên Deployment trước đây được hiện thực trong client. Tương tự, cho đến gần đây, `kubectl apply ...` chỉ có sẵn trong công cụ dòng lệnh, nhưng đã được chuyển sang server dưới dạng khả năng server-side apply sẽ được thảo luận sau trong chương này.

Bất kể quỹ đạo chung hướng đến các hiện thực phía server, vẫn có những khả năng đáng kể còn ở client. Mỗi khả năng này phải được hiện thực lại trong mỗi thư viện client. Sự tương đương với công cụ dòng lệnh `kubectl` khác nhau giữa các ngôn ngữ. Java client đặc biệt đã xây dựng một client dày mô phỏng nhiều chức năng của `kubectl`.

Nếu bạn không tìm thấy chức năng bạn đang tìm trong thư viện client, một mẹo hữu ích là thêm cờ `--v=10` vào lệnh `kubectl` của bạn. Điều đó sẽ bật logging chi tiết, bao gồm tất cả các yêu cầu và phản hồi HTTP được gửi đến Kubernetes API server. Bạn có thể dùng log này để tái tạo phần lớn những gì `kubectl` đang làm. Nếu bạn vẫn cần đào sâu hơn, mã nguồn `kubectl` cũng có sẵn trong Kubernetes repository.

## Lập trình với Kubernetes API

Giờ bạn đã có góc nhìn sâu hơn về cách Kubernetes API hoạt động và cách client và server tương tác. Trong các phần sau, chúng ta sẽ đi qua cách xác thực với Kubernetes API server và tương tác với các tài nguyên. Chúng ta sẽ kết thúc với các chủ đề nâng cao từ viết operator đến tương tác với Pod cho các thao tác tương tác.

### Cài đặt các thư viện Client

Trước khi bạn có thể bắt đầu lập trình với Kubernetes API, bạn cần tìm các thư viện client. Chúng ta sẽ dùng các thư viện client chính thức do chính dự án Kubernetes sản xuất, mặc dù cũng có một số client chất lượng cao được phát triển như các dự án độc lập. Các thư viện client đều được lưu trữ dưới repository `kubernetes-client` trên GitHub:

- Python
- Java
- .NET

Mỗi dự án này có một ma trận tương thích để cho thấy phiên bản client nào hoạt động với phiên bản Kubernetes API nào và cũng đưa ra hướng dẫn cài đặt các thư viện bằng trình quản lý gói (ví dụ, `npm`) liên quan đến một ngôn ngữ lập trình cụ thể.[^1]

### Xác thực với Kubernetes API

Kubernetes API server sẽ không an toàn lắm nếu nó cho phép bất kỳ ai trên thế giới truy cập và đọc hoặc ghi các tài nguyên mà nó điều phối. Do đó, bước đầu tiên trong lập trình với Kubernetes API là kết nối đến nó và định danh bản thân để xác thực. Vì API server về cốt lõi là một HTTP server, các phương thức xác thực này là các phương thức xác thực HTTP cốt lõi. Các hiện thực đầu tiên của Kubernetes dùng xác thực HTTP cơ bản qua kết hợp người dùng và mật khẩu, nhưng cách tiếp cận này đã bị loại bỏ để ưu tiên hạ tầng xác thực hiện đại hơn.

Nếu bạn đã dùng công cụ dòng lệnh `kubectl` cho các tương tác với Kubernetes, bạn có thể chưa xem xét các chi tiết hiện thực của xác thực. May mắn thay, các thư viện client thường giúp dễ dàng kết nối đến API. Tuy nhiên, hiểu biết cơ bản về cách xác thực Kubernetes hoạt động vẫn hữu ích để gỡ lỗi khi có sự cố.

Có hai cách cơ bản mà công cụ `kubectl` và các client lấy thông tin xác thực: từ file kubeconfig và từ ngữ cảnh của một Pod trong Kubernetes cluster.

Code không chạy bên trong Kubernetes cluster yêu cầu một file kubeconfig để cung cấp thông tin cần thiết cho xác thực. Theo mặc định, client tìm file này trong *${HOME}/.kube/config* hoặc biến môi trường `$KUBECONFIG`. Nếu biến `KUBECONFIG` hiện diện, nó có ưu tiên hơn bất kỳ file cấu hình nào nằm ở vị trí home mặc định. File kubeconfig chứa tất cả thông tin cần thiết để truy cập Kubernetes API server. Các client đều có các lời gọi dễ sử dụng để tạo client từ các vị trí mặc định hoặc từ file kubeconfig được cung cấp trong chính code:

**Python**

```python
config.load_kube_config()
```

**Java**

```java
ApiClient client = Config.defaultClient();
Configuration.setDefaultApiClient(client);
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.BuildDefaultConfig();
var client = new Kubernetes(config);
```

> **LƯU Ý**
>
> Xác thực cho nhiều nhà cung cấp cloud diễn ra qua một file thực thi bên ngoài biết cách sinh token cho Kubernetes cluster. File thực thi này thường được cài đặt như một phần của bộ công cụ dòng lệnh của nhà cung cấp cloud. Khi bạn viết code để tương tác với Kubernetes API, bạn cần đảm bảo file thực thi này cũng có sẵn trong ngữ cảnh nơi code đang chạy để nó có thể được thực thi để lấy token.

Trong ngữ cảnh của một Pod trong Kubernetes cluster, code chạy trong Pod có quyền truy cập vào Kubernetes service account được liên kết với Pod đó. Các file chứa token và certificate authority liên quan được Kubernetes đặt vào Pod dưới dạng volume khi Pod được tạo. Trong Kubernetes cluster, API server luôn có sẵn tại một tên DNS cố định, thường là `kubernetes`. Vì tất cả dữ liệu cần thiết đều hiện diện trong Pod, file kubeconfig là không cần thiết và client có thể tổng hợp cấu hình của nó từ ngữ cảnh. Các client đều có các lời gọi dễ sử dụng để tạo client "trong cluster" như vậy:

**Python**

```python
config.load_incluster_config()
```

**Java**

```java
ApiClient client = ClientBuilder.cluster().build();
Configuration.setDefaultApiClient(client);
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.InClusterConfig();
var client = new Kubernetes(config);
```

> **LƯU Ý**
>
> Service account mặc định liên kết với các Pod có các role (RBAC) tối thiểu được cấp. Điều này có nghĩa là theo mặc định, code chạy trong Pod không thể làm nhiều với Kubernetes API. Nếu bạn nhận được lỗi ủy quyền, bạn có thể cần điều chỉnh service account thành một cái đặc thù cho code của bạn và có quyền truy cập vào các role cần thiết trong cluster.

### Truy cập Kubernetes API

Các cách phổ biến nhất mà mọi người tương tác với Kubernetes API là qua các thao tác cơ bản như tạo, liệt kê và xóa tài nguyên. Vì tất cả các client đều được sinh từ cùng đặc tả OpenAPI, chúng đều tuân theo cùng một mẫu gần giống nhau. Trước khi đi vào code, có vài chi tiết nữa về Kubernetes API cần hiểu.

Trong Kubernetes, có sự phân biệt giữa tài nguyên có phạm vi namespace và tài nguyên cấp cluster. Tài nguyên có phạm vi namespace tồn tại trong một Kubernetes namespace; ví dụ, một Pod hoặc Deployment có thể tồn tại trong namespace `kube-system`. Tài nguyên cấp cluster chỉ tồn tại một lần trong toàn bộ cluster. Ví dụ rõ ràng nhất của tài nguyên như vậy là Namespace, nhưng các tài nguyên cấp cluster khác bao gồm CustomResourceDefinition và ClusterRoleBinding. Sự phân biệt này quan trọng vì nó được bảo toàn trong các lời gọi hàm bạn dùng để truy cập tài nguyên. Ví dụ, để liệt kê các Pod trong namespace `default` bằng Python, bạn sẽ viết `api.list_namespaced_pods('default')`. Để liệt kê các Namespace, bạn sẽ viết `api.list_namespaces()`.

Khái niệm thứ hai bạn cần hiểu là API group. Trong Kubernetes, tất cả các tài nguyên được nhóm thành các tập API khác nhau. Điều này phần lớn được ẩn khỏi người dùng công cụ `kubectl`, mặc dù bạn có thể đã thấy nó trong trường `apiVersion` trong đặc tả YAML của một đối tượng Kubernetes. Khi lập trình với Kubernetes API, việc nhóm này trở nên quan trọng, vì thường mỗi API group có client riêng để tương tác với tập tài nguyên đó. Ví dụ, để tạo client tương tác với tài nguyên Deployment (tồn tại trong API group và phiên bản `apps/v1`), bạn tạo một đối tượng `AppsV1Api()` mới biết cách tương tác với tất cả các tài nguyên trong API group và phiên bản `apps/v1`. Một ví dụ về cách tạo client cho một API group được thể hiện trong phần sau.

### Kết hợp tất cả lại: Liệt kê và tạo Pod bằng Python, Java và .NET

Giờ chúng ta đã sẵn sàng thực sự viết một số code. Bắt đầu bằng cách tạo một đối tượng client, rồi dùng nó để liệt kê các Pod trong namespace "default"; đây là code để làm điều đó bằng Python, Java và .NET:

**Python**

```python
config.load_kube_config()
api = client.CoreV1Api()
pod_list = api.list_namespaced_pod('default')
```

**Java**

```java
ApiClient client = Config.defaultClient();
Configuration.setDefaultApiClient(client);
CoreV1Api api = new CoreV1Api();
V1PodList list = api.listNamespacedPod("default");
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.BuildDefaultConfig();
var client = new Kubernetes(config);
var list = client.ListNamespacedPod("default");
```

Một khi bạn đã tìm ra cách liệt kê, đọc và xóa các đối tượng, tác vụ phổ biến tiếp theo là tạo các đối tượng mới. Lời gọi API để tạo đối tượng khá dễ tìm ra (ví dụ, `create_namespaced_pod` trong Python), nhưng thực sự định nghĩa các tài nguyên Pod mới có thể phức tạp hơn.

Đây là cách bạn tạo một Pod bằng Python, Java và .NET:

**Python**

```python
container = client.V1Container(
    name="myapp",
    image="my_cool_image:v1",
)

pod = client.V1Pod(
    metadata = client.V1ObjectMeta(
        name="myapp",
    ),
    spec=client.V1PodSpec(containers=[container]),
)
```

**Java**

```java
V1Pod pod =
    new V1PodBuilder()
        .withNewMetadata().withName("myapp").endMetadata()
        .withNewSpec()
          .addNewContainer()
            .withName("myapp")
            .withImage("my_cool_image:v1")
          .endContainer()
        .endSpec()
        .build();
```

**.NET**

```csharp
var pod = new V1Pod()
{
    Metadata = new V1ObjectMeta{ Name = "myapp", },
    Spec = new V1PodSpec
    {
        Containers = new[] {
          new V1Container() {
            Name = "myapp", Image = "my_cool_image:v1",
          },
        },
    }
};
```

### Tạo và Patch đối tượng

Khi bạn khám phá client API cho Kubernetes, bạn sẽ nhận thấy có vẻ như có ba cách khác nhau để thao tác tài nguyên, cụ thể là `create`, `replace` và `patch`. Ba verb này đại diện cho các ngữ nghĩa hơi khác nhau khi tương tác với tài nguyên:

**Create**

Như bạn có thể thấy từ tên, lệnh này tạo một tài nguyên mới. Tuy nhiên, nó sẽ thất bại nếu tài nguyên đã tồn tại.

**Replace**

Lệnh này thay thế hoàn toàn một tài nguyên hiện có, mà không xem tài nguyên hiện có. Khi bạn dùng `replace`, bạn phải chỉ định một tài nguyên hoàn chỉnh.

**Patch**

Lệnh này sửa đổi một tài nguyên hiện có, giữ nguyên các phần của tài nguyên không thay đổi. Khi dùng `patch`, bạn dùng một tài nguyên `Patch` đặc biệt thay vì gửi tài nguyên (ví dụ, Pod) mà bạn đang sửa đổi.

> **LƯU Ý**
>
> Patch một tài nguyên có thể phức tạp. Trong nhiều trường hợp, chỉ cần thay thế nó sẽ dễ hơn. Tuy nhiên, trong một số trường hợp, đặc biệt với các tài nguyên lớn, patch tài nguyên có thể hiệu quả hơn nhiều về băng thông mạng và xử lý của API server. Ngoài ra, nhiều tác nhân có thể patch các phần khác nhau của tài nguyên đồng thời mà không lo xung đột ghi, điều này giảm chi phí.

Để patch một tài nguyên Kubernetes, bạn phải tạo một đối tượng `Patch` đại diện cho thay đổi bạn muốn thực hiện lên tài nguyên. Có ba định dạng cho patch này được Kubernetes hỗ trợ: JSON Patch, JSON Merge Patch và strategic merge patch. Hai định dạng patch đầu là các tiêu chuẩn RFC được dùng ở nơi khác, và định dạng thứ ba là định dạng patch do Kubernetes phát triển. Mỗi định dạng patch có ưu và nhược điểm. Trong các ví dụ này, chúng ta sẽ dùng JSON Patch vì nó đơn giản nhất để hiểu.

Đây là cách bạn patch một Deployment để tăng số replica lên ba:

**Python**

```python
deployment.spec.replicas = 3

api_response = api_instance.patch_namespaced_deployment(
    name="my-deployment",
    namespace="some-namespace",
    body=deployment)
```

**Java**

```java
// JSON-patch format
static String jsonPatch =
  "[{\"op\":\"replace\",\"path\":\"/spec/replicas\",\"value\":3}]";

V1Deployment patched =
    PatchUtils.patch(
        V1Deployment.class,
        () ->
            api.patchNamespacedDeploymentCall(
                "my-deployment",
                "some-namespace",
                new V1Patch(jsonPatchStr),
                null,
                null,
                null,
                null,
                null),
        V1Patch.PATCH_FORMAT_JSON_PATCH,
        api.getApiClient());
```

**.NET**

```csharp
var jsonPatch = @"
[{
    ""op"": ""replace"",
    ""path"": ""/spec/replicas"",
    ""value"": 3
}]";

client.PatchNamespacedPod(
   new V1Patch(patchStr, V1Patch.PatchType.JsonPatch),
   "my-deployment",
   "some-namespace");
```

Trong mỗi mẫu code này, tài nguyên Deployment đã được patch để đặt số replica trong deployment thành ba.

### Theo dõi (Watch) các thay đổi của Kubernetes API

Tài nguyên trong Kubernetes là khai báo. Chúng đại diện cho trạng thái mong muốn của hệ thống. Để biến trạng thái mong muốn đó thành hiện thực, một chương trình phải theo dõi trạng thái mong muốn để phát hiện thay đổi và hành động để làm trạng thái hiện tại của thế giới khớp với trạng thái mong muốn.

Vì mẫu này, một trong những tác vụ phổ biến nhất khi lập trình với Kubernetes API là theo dõi các thay đổi lên một tài nguyên rồi thực hiện hành động nào đó dựa trên các thay đổi đó. Cách dễ nhất để làm điều này là qua thăm dò (polling). Thăm dò đơn giản gọi hàm liệt kê được mô tả ở trên theo một khoảng thời gian cố định (như mỗi 60 giây) và liệt kê tất cả các tài nguyên mà code quan tâm. Mặc dù code này dễ viết, nó có nhiều nhược điểm cho cả code client và API server. Thăm dò gây ra độ trễ không cần thiết, vì việc chờ chu kỳ thăm dò quay lại gây ra độ trễ cho các thay đổi xảy ra ngay sau khi lần thăm dò trước hoàn thành. Ngoài ra, thăm dò gây tải nặng hơn lên API server vì nó liên tục trả về các tài nguyên chưa thay đổi. Mặc dù nhiều client đơn giản bắt đầu bằng thăm dò, quá nhiều client thăm dò API server có thể làm nó quá tải và thêm độ trễ.

Để giải quyết vấn đề này, Kubernetes API cũng cung cấp ngữ nghĩa watch, hay dựa trên sự kiện. Sử dụng lời gọi watch, bạn có thể đăng ký quan tâm đến các thay đổi cụ thể với API server và, thay vì thăm dò liên tục, API server sẽ gửi thông báo mỗi khi có thay đổi. Về mặt thực tế, client thực hiện một GET treo (hanging GET) đến HTTP API server. Kết nối TCP nền tảng của yêu cầu HTTP này giữ mở trong suốt thời gian watch, và server ghi phản hồi vào luồng đó (nhưng không đóng luồng) mỗi khi có thay đổi.

Từ góc nhìn lập trình, ngữ nghĩa watch cho phép lập trình dựa trên sự kiện, thay đổi một vòng lặp `while` thăm dò liên tục thành một tập các callback. Đây là các ví dụ về theo dõi thay đổi của Pod:

**Python**

```python
config.load_kube_config()
api = client.CoreV1Api()
w = watch.Watch()

for event in w.stream(v1.list_namespaced_pods, "some-namespace"):
  print(event)
```

**Java**

```java
ApiClient client = Config.defaultClient();
CoreV1Api api = new CoreV1Api();

Watch<V1Namespace> watch =
    Watch.createWatch(
        client,
        api.listNamespacedPodCall(
            "some-namespace",
            null,
            null,
            null,
            null,
            null,
            Integer.MAX_VALUE,
            null,
            null,
            60,
            Boolean.TRUE);
        new TypeToken<Watch.Response<V1Pod>>() {}.getType());

try {
  for (Watch.Response<V1Pod> item : watch) {
    System.out.printf(
      "%s : %s%n", item.type, item.object.getMetadata().getName())
  }
} finally {
    watch.close();
}
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.BuildConfigFromConfigFile();
var client = new Kubernetes(config);

var watch =
  client.ListNamespacedPodWithHttpMessagesAsync("default", watch: true);
using (watch.Watch<V1Pod, V1PodList>((type, item) =>
{
  Console.WriteLine(item);
}
```

Trong mỗi ví dụ này, thay vì một vòng lặp thăm dò lặp lại, lời gọi watch API chuyển mỗi thay đổi lên tài nguyên đến một callback do người dùng cung cấp. Điều này vừa giảm độ trễ vừa giảm tải lên Kubernetes API server.

### Tương tác với Pod

Kubernetes API cũng cung cấp các hàm để tương tác trực tiếp với các ứng dụng chạy trong Kubernetes Pod. Công cụ `kubectl` cung cấp một số lệnh để tương tác với Pod, cụ thể là `logs`, `exec` và `port-forward`, và cũng có thể dùng từng lệnh này từ code tùy chỉnh.

> **LƯU Ý**
>
> Vì các API `logs`, `exec` và `port-forward` là không tiêu chuẩn theo nghĩa RESTful, chúng yêu cầu logic tùy chỉnh trong các thư viện client và do đó hơi kém nhất quán giữa các client khác nhau. Thật không may, không có lựa chọn nào khác ngoài việc học hiện thực cho từng ngôn ngữ.

Khi lấy log cho một Pod, bạn phải quyết định liệu bạn sẽ đọc log của Pod để lấy một snapshot về trạng thái hiện tại của chúng hay bạn sẽ stream chúng để nhận log mới khi chúng xảy ra. Nếu bạn stream log (tương đương với `kubectl logs -f ...`), bạn tạo một kết nối mở đến API server, và các dòng log mới được ghi vào luồng này khi chúng được ghi vào Pod. Nếu không, bạn đơn giản nhận nội dung hiện tại của log.

Đây là cách bạn vừa đọc vừa stream log:

**Python**

```python
config.load_kube_config()
api = client.CoreV1Api()
log = api_instance.read_namespaced_pod_log(
  name="my-pod", namespace="some-namespace")
```

**Java**

```java
V1Pod pod = ...; // some code to define or get a Pod here
PodLogs logs = new PodLogs();
InputStream is = logs.streamNamespacedPodLog(pod);
```

**.NET**

```csharp
IKubernetes client = new Kubernetes(config);
var response = await client.ReadNamespacedPodLogWithHttpMessagesAsync(
    "my-pod", "my-namespace", follow: true);
var stream = response.Body;
```

Một tác vụ phổ biến khác là thực thi một lệnh nào đó trong Pod và lấy kết quả của việc chạy tác vụ đó. Bạn có thể dùng lệnh `kubectl exec ...` trên dòng lệnh. Bên dưới, API hiện thực điều này đang tạo một kết nối WebSocket đến API server. WebSocket cho phép nhiều luồng dữ liệu (trong trường hợp này, `stdin`, `stdout` và `stderr`) cùng tồn tại trên cùng một kết nối HTTP. Nếu bạn chưa từng có kinh nghiệm với WebSocket, đừng lo; các chi tiết tương tác với WebSocket được các thư viện client xử lý.

Đây là cách bạn thực thi lệnh `ls /foo` trong một Pod:

**Python**

```python
cmd = [ 'ls', '/foo' ]
response = stream(
    api_instance.connect_get_namespaced_pod_exec,
    "my-pod",
    "some-namespace",
    command=cmd,
    stderr=True,
    stdin=False,
    stdout=True,
    tty=False)
```

**Java**

```java
ApiClient client = Config.defaultClient();
Configuration.setDefaultApiClient(client);
Exec exec = new Exec();
final Process proc =
  exec.exec("some-namespace",
            "my-pod",
            new String[] {"ls", "/foo"},
            true,
            true /*tty*/);
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.BuildConfigFromConfigFile();
IKubernetes client = new Kubernetes(config);
var webSocket =
    await client.WebSocketNamespacedPodExecAsync(
      "my-pod", "some-namespace", "ls /foo", "my-container-name");
var demux = new StreamDemuxer(webSocket);
demux.Start();
var stream = demux.GetStream(1, 1);
```

Ngoài việc chạy lệnh trong Pod, bạn cũng có thể port-forward các kết nối mạng từ Pod đến code chạy trên máy cục bộ. Giống như `exec`, lưu lượng được port-forward đi qua WebSocket. Code của bạn làm gì với socket được port-forward này là tùy bạn. Bạn có thể đơn giản gửi một yêu cầu duy nhất và nhận phản hồi dưới dạng chuỗi byte, hoặc bạn có thể xây dựng một proxy server hoàn chỉnh (giống như những gì `kubectl port-forward` làm) để phục vụ các yêu cầu tùy ý qua proxy này.

Bất kể bạn dự định làm gì với kết nối, đây là cách bạn thiết lập port-forwarding:

**Python**

```python
pf = portforward(
    api_instance.connect_get_namespaced_pod_portforward,
    'my-pod', 'some-namespace',
    ports='8080',
)
```

**Java**

```java
PortForward fwd = new PortForward();

List<Integer> ports = new ArrayList<>();
int localPort = 8080;
int targetPort = 8080;
ports.add(targetPort);
final PortForward.PortForwardResult result =
    fwd.forward("some-namespace", "my-pod", ports);
```

**.NET**

```csharp
var config = KubernetesClientConfiguration.BuildConfigFromConfigFile();
IKubernetes client = new Kubernetes(config);
var webSocket = await client.WebSocketNamespacedPodPortForwardAsync(
  "some-namespace", "my-pod", new int[] {8080}, "v4.channel.k8s.io");
var demux = new StreamDemuxer(webSocket, StreamType.PortForward);
demux.Start();
var stream = demux.GetStream((byte?)0, (byte?)0);
```

Mỗi ví dụ này tạo một kết nối từ cổng 8080 trong Pod đến cổng 8080 trong chương trình của bạn. Code trả về các luồng byte cần thiết, giao tiếp qua kênh port-forwarding này. Bạn có thể dùng các luồng này để gửi và nhận thông điệp.

## Tóm tắt

Kubernetes API cung cấp chức năng phong phú và mạnh mẽ để bạn viết code tùy chỉnh. Viết ứng dụng của bạn bằng ngôn ngữ phù hợp nhất với một tác vụ hoặc một đối tượng người dùng chia sẻ sức mạnh của API điều phối với càng nhiều người dùng Kubernetes càng tốt. Khi bạn sẵn sàng vượt ra ngoài việc viết script gọi file thực thi `kubectl`, các thư viện client Kubernetes cung cấp một cách để đi sâu vào API để xây dựng một operator, một agent giám sát, một giao diện người dùng mới, hoặc bất cứ thứ gì trí tưởng tượng của bạn có thể mơ tới.

---

[^1]: Chúng tôi không bao gồm các ví dụ JavaScript để ngắn gọn, nhưng nó cũng đang được phát triển tích cực.
