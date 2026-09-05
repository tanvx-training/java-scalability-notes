# Chương 14. Kiểm soát truy cập dựa trên vai trò (RBAC) cho Kubernetes

Ở thời điểm này, gần như mọi Kubernetes cluster bạn gặp đều đã bật kiểm soát truy cập dựa trên vai trò (role-based access control, RBAC). Vì vậy bạn có lẽ đã gặp RBAC trước đây. Có thể ban đầu bạn không thể truy cập cluster cho đến khi dùng một lệnh thần kỳ nào đó để thêm một RoleBinding ánh xạ người dùng đến một vai trò. Mặc dù bạn có thể đã tiếp xúc với RBAC, bạn có thể chưa có nhiều kinh nghiệm hiểu về RBAC trong Kubernetes, bao gồm nó dùng để làm gì và cách sử dụng.

Kiểm soát truy cập dựa trên vai trò cung cấp một cơ chế để hạn chế cả quyền truy cập và các hành động trên Kubernetes API nhằm đảm bảo chỉ những người dùng được ủy quyền mới có quyền truy cập. RBAC là một thành phần quan trọng để vừa tăng cường bảo mật truy cập vào Kubernetes cluster nơi bạn triển khai ứng dụng vừa (có lẽ quan trọng hơn) ngăn chặn các tai nạn không mong đợi khi một người ở nhầm namespace vô tình làm sập production trong khi nghĩ rằng họ đang hủy cluster kiểm thử của mình.

> **LƯU Ý**
>
> Mặc dù RBAC có thể khá hữu ích trong việc giới hạn quyền truy cập vào Kubernetes API, điều quan trọng cần nhớ là bất kỳ ai có thể chạy code tùy ý bên trong Kubernetes cluster đều có thể thực sự giành được quyền root trên toàn bộ cluster. Có những cách tiếp cận bạn có thể thực hiện để làm những cuộc tấn công như vậy khó hơn và tốn kém hơn, và một thiết lập RBAC đúng là một phần của sự phòng thủ này. Nhưng nếu bạn tập trung vào bảo mật đa người thuê (multitenant) trong môi trường thù địch, RBAC một mình là không đủ để bảo vệ bạn.* Bạn phải cô lập các Pod chạy trong cluster để cung cấp bảo mật đa người thuê hiệu quả. Nói chung điều này được thực hiện bằng các container được cô lập bởi hypervisor hoặc một container sandbox.
>
> *\*(Ghi chú của người dịch: Nguyên bản viết "RBAC by itself is sufficient to protect you", nhiều khả năng là lỗi in; theo ngữ cảnh câu tiếp theo, ý tác giả là RBAC một mình không đủ.)*

Trước khi đi sâu vào chi tiết RBAC trong Kubernetes, sẽ có giá trị khi có một hiểu biết tổng quan về RBAC như một khái niệm, cũng như xác thực (authentication) và ủy quyền (authorization) nói chung.

Mọi yêu cầu đến Kubernetes đầu tiên đều được xác thực. Xác thực cung cấp danh tính của người gọi đưa ra yêu cầu. Nó có thể đơn giản như nói rằng yêu cầu không được xác thực, hoặc nó có thể tích hợp sâu với một nhà cung cấp xác thực có thể cắm-rút (ví dụ, Azure Active Directory) để thiết lập danh tính trong hệ thống bên thứ ba đó. Điều thú vị là Kubernetes không có kho danh tính tích hợp sẵn, thay vào đó tập trung vào việc tích hợp các nguồn danh tính khác vào bên trong nó.

Một khi người dùng đã được xác thực, giai đoạn ủy quyền xác định liệu họ có được ủy quyền để thực hiện yêu cầu không. Ủy quyền là sự kết hợp của danh tính người dùng, tài nguyên (thực chất là đường dẫn HTTP), và động từ (verb) hoặc hành động mà người dùng đang cố thực hiện. Nếu người dùng cụ thể được ủy quyền thực hiện hành động đó trên tài nguyên đó, thì yêu cầu được phép tiếp tục. Nếu không, lỗi HTTP 403 được trả về. Hãy đi sâu vào quy trình này.

## Kiểm soát truy cập dựa trên vai trò

Để quản lý truy cập đúng cách trong Kubernetes, điều quan trọng là hiểu cách danh tính, vai trò (role) và ràng buộc vai trò (role binding) tương tác để kiểm soát ai có thể làm gì với tài nguyên nào. Ban đầu, RBAC có thể trông như một thách thức để hiểu, với một loạt các khái niệm trừu tượng liên kết với nhau; nhưng một khi đã hiểu, bạn có thể tự tin vào khả năng quản lý truy cập cluster của mình.

### Danh tính trong Kubernetes

Mọi yêu cầu đến Kubernetes đều được liên kết với một danh tính nào đó. Ngay cả một yêu cầu không có danh tính cũng được liên kết với nhóm `system:unauthenticated`. Kubernetes phân biệt giữa danh tính người dùng (user identity) và danh tính service account. Service account được tạo và quản lý bởi chính Kubernetes và thường được liên kết với các thành phần chạy bên trong cluster. Tài khoản người dùng là tất cả các tài khoản khác được liên kết với người dùng thực của cluster, và thường bao gồm các tự động hóa như dịch vụ continuous delivery chạy bên ngoài cluster.

Kubernetes dùng một giao diện tổng quát cho các nhà cung cấp xác thực. Mỗi nhà cung cấp cung cấp một tên người dùng và, tùy chọn, tập các nhóm mà người dùng thuộc về. Kubernetes hỗ trợ một số nhà cung cấp xác thực, bao gồm:

- HTTP Basic Authentication (phần lớn đã bị loại bỏ)
- Chứng chỉ client x509
- File token tĩnh trên host
- Các nhà cung cấp xác thực cloud, như Azure Active Directory và AWS Identity and Access Management (IAM)
- Webhook xác thực

Mặc dù hầu hết các bản cài đặt Kubernetes được quản lý cấu hình xác thực cho bạn, nếu bạn đang triển khai xác thực của riêng mình, bạn sẽ cần cấu hình các cờ trên Kubernetes API server một cách thích hợp.

Bạn nên luôn dùng các danh tính khác nhau cho các ứng dụng khác nhau trong cluster. Ví dụ, bạn nên có một danh tính cho các frontend production, một danh tính khác cho các backend production, và tất cả các danh tính production nên khác biệt với các danh tính development. Bạn cũng nên có các danh tính khác nhau cho các cluster khác nhau. Tất cả các danh tính này nên là danh tính máy (machine identity) không được chia sẻ với người dùng. Bạn có thể dùng Kubernetes Service Account để đạt được điều này, hoặc bạn có thể dùng một Pod identity provider do hệ thống danh tính của bạn cung cấp; ví dụ, Azure Active Directory cung cấp một identity provider mã nguồn mở cho Pod, cũng như các identity provider phổ biến khác.

### Hiểu về Role và Role Binding

Danh tính chỉ là khởi đầu của ủy quyền trong Kubernetes. Một khi Kubernetes biết danh tính của yêu cầu, nó cần xác định liệu yêu cầu được ủy quyền cho người dùng đó không. Để đạt được điều này, nó dùng role và role binding.

Role là một tập các khả năng trừu tượng. Ví dụ, role `appdev` có thể đại diện cho khả năng tạo Pod và Service. Role binding là việc gán một role cho một hoặc nhiều danh tính. Như vậy, ràng buộc role `appdev` với danh tính người dùng `alice` cho biết Alice có khả năng tạo Pod và Service.

### Role và Role Binding trong Kubernetes

Trong Kubernetes, hai cặp tài nguyên liên quan đại diện cho role và role binding. Một cặp có phạm vi namespace (Role và RoleBinding), trong khi cặp khác có phạm vi cluster (ClusterRole và ClusterRoleBinding).

Hãy xem Role và RoleBinding trước. Tài nguyên Role có phạm vi namespace và đại diện cho các khả năng trong namespace đơn lẻ đó. Bạn không thể dùng các role có phạm vi namespace cho các tài nguyên không thuộc namespace (ví dụ, CustomResourceDefinition), và ràng buộc một RoleBinding với một role chỉ cung cấp ủy quyền trong Kubernetes namespace chứa cả Role và RoleBinding.

Một ví dụ cụ thể, đây là một role đơn giản cho một danh tính khả năng tạo và sửa đổi Pod và Service:

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-and-services
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
```

Để ràng buộc Role này với người dùng `alice`, chúng ta cần tạo một RoleBinding trông như sau. Role binding này cũng ràng buộc nhóm `mydevs` với cùng role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: default
  name: pods-and-services
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: alice
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: mydevs
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-and-services
```

Đôi khi bạn cần tạo một role áp dụng cho toàn bộ cluster, hoặc bạn muốn giới hạn truy cập vào các tài nguyên cấp cluster. Để đạt được điều này, bạn dùng các tài nguyên ClusterRole và ClusterRoleBinding. Chúng phần lớn giống hệt các đối tác có phạm vi namespace, nhưng có phạm vi cluster.

#### Các verb cho Kubernetes role

Role được định nghĩa theo cả tài nguyên (ví dụ, Pod) và một verb mô tả hành động có thể được thực hiện trên tài nguyên đó. Các verb tương ứng gần với các phương thức HTTP. Các verb thường dùng trong Kubernetes RBAC được liệt kê trong Bảng 14-1.

*Bảng 14-1. Các verb phổ biến của Kubernetes RBAC*

| Verb | Phương thức HTTP | Mô tả |
|---|---|---|
| `create` | `POST` | Tạo một tài nguyên mới. |
| `delete` | `DELETE` | Xóa một tài nguyên hiện có. |
| `get` | `GET` | Lấy một tài nguyên. |
| `list` | `GET` | Liệt kê một tập hợp tài nguyên. |
| `patch` | `PATCH` | Sửa đổi một tài nguyên hiện có qua một thay đổi một phần. |
| `update` | `PUT` | Sửa đổi một tài nguyên hiện có qua một đối tượng hoàn chỉnh. |
| `watch` | `GET` | Theo dõi các cập nhật streaming đến một tài nguyên. |
| `proxy` | `GET` | Kết nối đến tài nguyên qua một proxy WebSocket streaming. |

#### Sử dụng các role tích hợp sẵn

Thiết kế role của riêng bạn có thể phức tạp và tốn thời gian. Kubernetes có một số lượng lớn các cluster role tích hợp sẵn cho các danh tính hệ thống nổi tiếng (ví dụ, scheduler) yêu cầu một tập khả năng đã biết. Bạn có thể xem chúng bằng cách chạy:

```
$ kubectl get clusterroles
```

Mặc dù hầu hết các role tích hợp sẵn này dành cho các tiện ích hệ thống, bốn role được thiết kế cho người dùng cuối thông thường:

- Role `cluster-admin` cung cấp quyền truy cập hoàn toàn vào toàn bộ cluster.
- Role `admin` cung cấp quyền truy cập hoàn toàn vào một namespace hoàn chỉnh.
- Role `edit` cho phép người dùng cuối sửa đổi các tài nguyên trong một namespace.
- Role `view` cho phép truy cập chỉ đọc vào một namespace.

Hầu hết các cluster đã có nhiều ClusterRole binding được thiết lập, và bạn có thể xem các binding này bằng `kubectl get clusterrolebindings`.

#### Tự động đồng bộ các role tích hợp sẵn

Khi Kubernetes API server khởi động, nó tự động cài đặt một số ClusterRole mặc định được định nghĩa trong code của chính API server. Điều này có nghĩa là nếu bạn sửa đổi bất kỳ cluster role tích hợp sẵn nào, những sửa đổi đó là tạm thời. Bất cứ khi nào API server được khởi động lại (ví dụ, để nâng cấp), các thay đổi của bạn sẽ bị ghi đè.

Để ngăn điều này xảy ra, trước khi thực hiện bất kỳ sửa đổi nào khác, bạn cần thêm annotation `rbac.authorization.kubernetes.io/autoupdate` với giá trị `false` vào tài nguyên ClusterRole tích hợp sẵn. Nếu annotation này được đặt là `false`, API server sẽ không ghi đè tài nguyên ClusterRole đã sửa đổi.

> **CẢNH BÁO**
>
> Theo mặc định, Kubernetes API server cài đặt một cluster role cho phép người dùng `system:unauthenticated` truy cập vào endpoint khám phá API (API discovery) của API server. Với bất kỳ cluster nào được phơi bày ra môi trường thù địch (ví dụ, internet công cộng), đây là một ý tưởng tồi, và đã có ít nhất một lỗ hổng bảo mật nghiêm trọng thông qua sự phơi bày này. Nếu bạn đang chạy một dịch vụ Kubernetes trên internet công cộng hoặc một môi trường thù địch khác, bạn nên đảm bảo cờ `--anonymous-auth=false` được đặt trên API server của mình.

## Các kỹ thuật quản lý RBAC

Quản lý RBAC cho một cluster có thể phức tạp và gây bực bội. Có lẽ đáng lo hơn là RBAC được cấu hình sai có thể dẫn đến các vấn đề bảo mật. May mắn thay, có một số công cụ và kỹ thuật giúp quản lý RBAC dễ hơn.

### Kiểm tra ủy quyền với can-i

Công cụ hữu ích đầu tiên là lệnh `auth can-i` của `kubectl`. Công cụ này được dùng để kiểm tra liệu một người dùng cụ thể có thể thực hiện một hành động cụ thể không. Bạn có thể dùng `can-i` để xác thực các thiết lập cấu hình khi bạn cấu hình cluster, hoặc bạn có thể yêu cầu người dùng dùng công cụ này để xác thực quyền truy cập của họ khi báo lỗi hoặc gửi báo cáo lỗi.

Ở cách dùng đơn giản nhất, lệnh `can-i` nhận một verb và một tài nguyên. Ví dụ, lệnh này sẽ cho biết liệu người dùng `kubectl` hiện tại có được ủy quyền tạo Pod không:

```
$ kubectl auth can-i create pods
```

Bạn cũng có thể kiểm tra các tài nguyên con như log hoặc port-forwarding bằng cờ dòng lệnh `--subresource`:

```
$ kubectl auth can-i get pods --subresource=logs
```

### Quản lý RBAC trong hệ thống quản lý mã nguồn

Giống như tất cả các tài nguyên trong Kubernetes, tài nguyên RBAC được mô hình hóa bằng YAML. Với biểu diễn dạng văn bản này, việc lưu các tài nguyên này trong hệ thống quản lý phiên bản là hợp lý, cho phép trách nhiệm giải trình, khả năng kiểm toán và rollback.

Công cụ dòng lệnh `kubectl` cung cấp lệnh `reconcile` hoạt động hơi giống `kubectl apply` và sẽ đồng bộ một tập role và role binding với trạng thái hiện tại của cluster. Bạn có thể chạy:

```
$ kubectl auth reconcile -f some-rbac-config.yaml
```

Nếu bạn muốn xem các thay đổi trước khi chúng được thực hiện, bạn có thể thêm cờ `--dry-run` vào lệnh để xuất ra, nhưng không áp dụng, các thay đổi.

## Các chủ đề nâng cao

Một khi bạn đã định hướng được những điều cơ bản về kiểm soát truy cập dựa trên vai trò, việc quản lý truy cập vào Kubernetes cluster tương đối dễ. Nhưng khi quản lý một số lượng lớn người dùng hoặc role, có thêm các khả năng nâng cao bạn có thể dùng để quản lý RBAC ở quy mô lớn.

### Tổng hợp ClusterRole

Đôi khi bạn muốn có thể định nghĩa các role là sự kết hợp của các role khác. Một lựa chọn là đơn giản sao chép tất cả các quy tắc từ một ClusterRole vào một ClusterRole khác, nhưng điều này phức tạp và dễ lỗi, vì các thay đổi lên một ClusterRole không được tự động phản ánh vào cái khác. Thay vào đó, Kubernetes RBAC hỗ trợ việc dùng quy tắc tổng hợp (aggregation rule) để kết hợp nhiều role thành một role mới. Role mới này kết hợp tất cả các khả năng của tất cả các role được tổng hợp, và bất kỳ thay đổi nào lên bất kỳ role con cấu thành nào sẽ tự động được lan truyền trở lại role tổng hợp.

Như với các tổng hợp hoặc nhóm khác trong Kubernetes, các ClusterRole cần được tổng hợp được chỉ định bằng label selector. Trong trường hợp cụ thể này, trường `aggregationRule` trong tài nguyên ClusterRole chứa một trường `clusterRoleSelector`, đến lượt nó là một label selector. Tất cả các tài nguyên ClusterRole khớp với selector này được tổng hợp động vào mảng `rules` trong tài nguyên ClusterRole tổng hợp.

Một thực hành tốt nhất để quản lý các tài nguyên ClusterRole là tạo một số cluster role chi tiết rồi tổng hợp chúng để tạo thành các cluster role cấp cao hơn hoặc rộng hơn. Đây là cách các cluster role tích hợp sẵn được định nghĩa. Ví dụ, bạn có thể thấy role `edit` tích hợp sẵn trông như thế này:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: edit
  ...
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.authorization.k8s.io/aggregate-to-edit: "true"
...
```

Điều này có nghĩa là role `edit` được định nghĩa là tổng hợp của tất cả các đối tượng ClusterRole có label `rbac.authorization.k8s.io/aggregate-to-edit` được đặt là `true`.

### Sử dụng Group cho Binding

Khi quản lý một số lượng lớn người trong các tổ chức khác nhau có quyền truy cập tương tự vào cluster, thực hành tốt nhất nói chung là dùng group để quản lý các role định nghĩa quyền truy cập, thay vì thêm từng binding riêng lẻ cho các danh tính cụ thể. Khi bạn ràng buộc một group với một Role hoặc ClusterRole, bất kỳ ai là thành viên của group đó đều có quyền truy cập vào các tài nguyên và verb được định nghĩa bởi role đó. Như vậy, để cho phép bất kỳ cá nhân nào có quyền truy cập vào role của group, cá nhân đó cần được thêm vào group.

Sử dụng group là chiến lược ưa thích để quản lý truy cập ở quy mô lớn vì một số lý do. Thứ nhất là trong bất kỳ tổ chức lớn nào, quyền truy cập vào cluster được định nghĩa theo đội mà ai đó thuộc về, thay vì danh tính cụ thể của họ. Ví dụ, ai đó thuộc đội vận hành frontend sẽ cần quyền truy cập để cả xem và chỉnh sửa các tài nguyên liên quan đến frontend, trong khi họ có thể chỉ cần quyền xem/đọc các tài nguyên liên quan đến backend. Cấp đặc quyền cho một group làm rõ sự liên kết giữa đội cụ thể và các khả năng của nó. Khi cấp role cho các cá nhân, việc hiểu rõ các đặc quyền thích hợp (tức là tối thiểu) cần thiết cho mỗi đội khó hơn nhiều, đặc biệt khi một cá nhân có thể thuộc nhiều đội.

Các lợi ích bổ sung của việc ràng buộc role với group thay vì cá nhân là sự đơn giản và nhất quán. Khi ai đó gia nhập hoặc rời một đội, việc đơn giản thêm hoặc xóa họ khỏi một group trong một thao tác duy nhất là rất dễ. Nếu thay vào đó bạn phải xóa một số role binding khác nhau cho danh tính của họ, bạn có thể xóa quá ít hoặc quá nhiều binding, dẫn đến quyền truy cập không cần thiết hoặc ngăn họ thực hiện các hành động cần thiết. Ngoài ra, vì chỉ có một tập role binding của group cần duy trì, bạn không phải làm nhiều việc để đảm bảo tất cả các thành viên đội có cùng tập quyền nhất quán.

> **LƯU Ý**
>
> Nhiều nhà cung cấp cloud hỗ trợ tích hợp với các nền tảng quản lý danh tính và truy cập của họ để người dùng và group từ các nền tảng đó có thể được dùng kết hợp với Kubernetes RBAC.

Nhiều hệ thống group cho phép truy cập "đúng lúc" (just in time, JIT), sao cho người ta chỉ được thêm tạm thời vào một group để phản ứng với một sự kiện (chẳng hạn, một cuộc gọi khẩn cấp giữa đêm) thay vì có quyền truy cập thường trực. Điều này có nghĩa là bạn vừa có thể kiểm toán ai đã có quyền truy cập tại bất kỳ thời điểm cụ thể nào vừa đảm bảo rằng, nói chung, ngay cả một danh tính bị xâm phạm cũng không thể có quyền truy cập vào hạ tầng production của bạn.

Cuối cùng, trong nhiều trường hợp, chính những group này được dùng để quản lý truy cập vào các tài nguyên khác, từ cơ sở vật chất đến tài liệu và đăng nhập máy. Do đó, dùng cùng các group để kiểm soát truy cập vào Kubernetes đơn giản hóa đáng kể việc quản lý.

Để ràng buộc một group với một ClusterRole, dùng kind `Group` cho subject trong binding:

```yaml
...
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: my-great-groups-name
...
```

Trong Kubernetes, group được cung cấp bởi các nhà cung cấp xác thực. Không có ý niệm mạnh về group trong Kubernetes, chỉ là một danh tính có thể là một phần của một hoặc nhiều group, và những group đó có thể được liên kết với một Role hoặc ClusterRole thông qua một binding.

## Tóm tắt

Khi bạn bắt đầu với một cluster nhỏ và một đội nhỏ, việc mọi thành viên trong đội có quyền truy cập tương đương vào cluster là đủ. Nhưng khi các đội phát triển và sản phẩm trở nên quan trọng hơn, việc giới hạn truy cập vào các phần của cluster là rất quan trọng. Trong một cluster được thiết kế tốt, quyền truy cập được giới hạn ở tập tối thiểu người và khả năng cần thiết để quản lý hiệu quả các ứng dụng trong cluster.

Hiểu cách Kubernetes hiện thực RBAC và cách các khả năng đó có thể được dùng để kiểm soát truy cập vào cluster của bạn là quan trọng cho cả nhà phát triển và quản trị viên cluster. Như với việc xây dựng hạ tầng kiểm thử, thực hành tốt nhất là thiết lập RBAC sớm hơn thay vì muộn hơn. Bắt đầu với nền tảng đúng dễ hơn nhiều so với việc cố trang bị thêm sau này. Hy vọng thông tin trong chương này đã cung cấp nền tảng cần thiết để thêm RBAC vào cluster của bạn.
