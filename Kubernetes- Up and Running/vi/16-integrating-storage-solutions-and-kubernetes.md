# Chương 16. Tích hợp các giải pháp lưu trữ với Kubernetes

Trong nhiều trường hợp, việc tách trạng thái khỏi ứng dụng và xây dựng các microservice của bạn càng stateless càng tốt dẫn đến các hệ thống đáng tin cậy và dễ quản lý nhất.

Tuy nhiên, gần như mọi hệ thống có độ phức tạp nào đó đều có trạng thái ở đâu đó trong hệ thống, từ các bản ghi trong cơ sở dữ liệu đến các index shard phục vụ kết quả cho một công cụ tìm kiếm web. Đến một lúc nào đó, bạn phải lưu dữ liệu ở đâu đó.

Tích hợp dữ liệu này với container và các giải pháp điều phối container thường là khía cạnh phức tạp nhất của việc xây dựng hệ thống phân tán. Sự phức tạp này chủ yếu xuất phát từ thực tế rằng việc chuyển sang kiến trúc container hóa cũng là việc chuyển sang phát triển ứng dụng tách rời, bất biến và khai báo. Những mẫu này tương đối dễ áp dụng cho các ứng dụng web stateless, nhưng ngay cả các giải pháp lưu trữ "cloud native" như Cassandra hay MongoDB cũng bao gồm một số bước thủ công hoặc mệnh lệnh để thiết lập một giải pháp đáng tin cậy, được nhân bản.

Ví dụ, hãy xem xét việc thiết lập ReplicaSet trong MongoDB, bao gồm triển khai daemon Mongo rồi chạy một lệnh mệnh lệnh để xác định leader cũng như các thành viên tham gia trong Mongo cluster. Dĩ nhiên, các bước này có thể được viết thành script, nhưng trong thế giới container hóa, khó thấy cách tích hợp những lệnh như vậy vào một deployment. Tương tự, ngay cả việc có tên phân giải được qua DNS cho từng container riêng lẻ trong một tập container được nhân bản cũng là thách thức.

Sự phức tạp bổ sung đến từ thực tế có "trọng lực dữ liệu" (data gravity). Hầu hết các hệ thống container hóa không được xây dựng trong chân không; chúng thường được điều chỉnh từ các hệ thống hiện có được triển khai lên VM, và những hệ thống này có thể bao gồm dữ liệu phải được nhập hoặc di chuyển.

Cuối cùng, tiến hóa lên cloud thường có nghĩa là lưu trữ là một dịch vụ cloud bên ngoài, và, trong bối cảnh đó, nó không bao giờ thực sự tồn tại bên trong Kubernetes cluster.

Chương này đề cập đến nhiều cách tiếp cận để tích hợp lưu trữ vào các microservice container hóa trong Kubernetes. Đầu tiên, chúng ta đề cập đến cách nhập các giải pháp lưu trữ bên ngoài hiện có (hoặc dịch vụ cloud hoặc chạy trên VM) vào Kubernetes. Tiếp theo, chúng ta khám phá cách chạy các singleton đáng tin cậy bên trong Kubernetes cho phép bạn có một môi trường phần lớn khớp với các VM nơi bạn từng triển khai các giải pháp lưu trữ. Cuối cùng, chúng ta đề cập đến StatefulSet, tài nguyên Kubernetes mà hầu hết mọi người dùng cho các workload stateful trong Kubernetes.

## Nhập các Service bên ngoài

Trong nhiều trường hợp, bạn có một máy hiện có đang chạy trong mạng của mình với một loại cơ sở dữ liệu nào đó đang chạy trên đó. Trong tình huống này, bạn có thể không muốn di chuyển ngay cơ sở dữ liệu đó vào container và Kubernetes. Có thể nó được vận hành bởi một đội khác, hoặc bạn đang thực hiện di chuyển dần dần, hoặc nhiệm vụ di chuyển dữ liệu đơn giản là rắc rối hơn giá trị nó mang lại.

Bất kể lý do giữ nguyên là gì, server và service cũ này sẽ không di chuyển vào Kubernetes, nhưng vẫn đáng để biểu diễn server này trong Kubernetes. Khi bạn làm điều này, bạn được tận dụng tất cả các primitive đặt tên và service discovery tích hợp sẵn do Kubernetes cung cấp. Ngoài ra, điều này cho phép bạn cấu hình tất cả các ứng dụng của mình sao cho trông như cơ sở dữ liệu đang chạy trên một máy ở đâu đó thực ra là một Kubernetes service. Điều này có nghĩa là việc thay thế nó bằng một cơ sở dữ liệu là Kubernetes service trở nên đơn giản. Ví dụ, trong production, bạn có thể dựa vào cơ sở dữ liệu cũ đang chạy trên một máy, nhưng cho kiểm thử liên tục, bạn có thể triển khai một cơ sở dữ liệu kiểm thử dưới dạng container tạm thời. Vì nó được tạo và hủy cho mỗi lần chạy kiểm thử, tính bền vững dữ liệu không quan trọng trong trường hợp kiểm thử liên tục. Biểu diễn cả hai cơ sở dữ liệu dưới dạng Kubernetes service cho phép bạn duy trì các cấu hình giống hệt trong cả kiểm thử và production. Độ trung thực cao giữa kiểm thử và production đảm bảo rằng các kiểm thử vượt qua sẽ dẫn đến triển khai thành công trong production.

Để thấy cụ thể cách bạn duy trì độ trung thực cao giữa development và production, hãy nhớ rằng tất cả các đối tượng Kubernetes được triển khai vào namespace. Hãy tưởng tượng chúng ta có các namespace `test` và `production` được định nghĩa. Service kiểm thử được nhập bằng một đối tượng như thế này:

```yaml
kind: Service
metadata:
  name: my-database
  # note 'test' namespace here
  namespace: test
...
```

Service production trông giống vậy, ngoại trừ nó dùng một namespace khác:

```yaml
kind: Service
metadata:
  name: my-database
  # note 'prod' namespace here
  namespace: prod
...
```

Khi bạn triển khai một Pod vào namespace `test` và nó tra cứu service tên `my-database`, nó sẽ nhận được một con trỏ đến `my-database.test.svc.cluster.internal`, đến lượt nó trỏ đến cơ sở dữ liệu kiểm thử. Ngược lại, khi một Pod được triển khai trong namespace `prod` tra cứu cùng tên (`my-database`), nó sẽ nhận được một con trỏ đến `my-database.prod.svc.cluster.internal`, là cơ sở dữ liệu production. Như vậy, cùng một tên service, trong hai namespace khác nhau, phân giải đến hai service khác nhau. Để biết thêm chi tiết về cách hoạt động, xem Chương 7.

> **LƯU Ý**
>
> Các kỹ thuật sau đây đều dùng cơ sở dữ liệu hoặc các dịch vụ lưu trữ khác, nhưng những cách tiếp cận này có thể được dùng tốt như nhau với các service khác không chạy bên trong Kubernetes cluster của bạn.

### Service không có Selector

Khi lần đầu giới thiệu service, chúng ta đã nói nhiều về truy vấn label và cách chúng được dùng để xác định tập Pod động là các backend cho một service cụ thể. Tuy nhiên, với các service bên ngoài, không có truy vấn label như vậy. Thay vào đó, bạn thường có một tên DNS trỏ đến server cụ thể đang chạy cơ sở dữ liệu. Cho ví dụ của chúng ta, hãy giả định server này có tên `database.company.com`. Để nhập dịch vụ cơ sở dữ liệu bên ngoài này vào Kubernetes, chúng ta bắt đầu bằng cách tạo một service không có Pod selector tham chiếu đến tên DNS của server cơ sở dữ liệu (Ví dụ 16-1).

*Ví dụ 16-1. dns-service.yaml*

```yaml
kind: Service
apiVersion: v1
metadata:
  name: external-database
spec:
  type: ExternalName
  externalName: database.company.com
```

Khi một Kubernetes service điển hình được tạo, một địa chỉ IP cũng được tạo, và dịch vụ Kubernetes DNS được điền một bản ghi A trỏ đến địa chỉ IP đó. Khi bạn tạo một service loại `ExternalName`, dịch vụ Kubernetes DNS thay vào đó được điền một bản ghi CNAME trỏ đến tên bên ngoài bạn đã chỉ định (`database.company.com` trong trường hợp này). Khi một ứng dụng trong cluster thực hiện tra cứu DNS cho hostname `external-database.svc.default.cluster`, giao thức DNS đặt bí danh tên đó thành `database.company.com`. Điều này sau đó phân giải đến địa chỉ IP của server cơ sở dữ liệu bên ngoài của bạn. Theo cách này, tất cả các container trong Kubernetes tin rằng chúng đang nói chuyện với một service được hỗ trợ bởi các container khác, trong khi thực tế chúng đang được chuyển hướng đến một cơ sở dữ liệu bên ngoài.

Lưu ý rằng điều này không bị giới hạn ở các cơ sở dữ liệu bạn đang chạy trên hạ tầng của riêng mình. Nhiều cơ sở dữ liệu cloud và các dịch vụ khác cung cấp cho bạn một tên DNS để dùng khi truy cập cơ sở dữ liệu (ví dụ, `my-database.databases.cloudprovider.com`). Bạn có thể dùng tên DNS này làm `externalName`. Điều này nhập cơ sở dữ liệu do cloud cung cấp vào namespace của Kubernetes cluster của bạn.

Tuy nhiên, đôi khi bạn không có địa chỉ DNS cho một dịch vụ cơ sở dữ liệu bên ngoài, chỉ có địa chỉ IP. Trong những trường hợp như vậy, vẫn có thể nhập dịch vụ này như một Kubernetes service, nhưng thao tác hơi khác. Đầu tiên, bạn tạo một Service không có label selector, nhưng cũng không có loại `ExternalName` chúng ta đã dùng trước đó (Ví dụ 16-2).

*Ví dụ 16-2. external-ip-service.yaml*

```yaml
kind: Service
apiVersion: v1
metadata:
  name: external-ip-database
```

Kubernetes sẽ cấp phát một địa chỉ IP ảo cho service này và điền một bản ghi A cho nó. Tuy nhiên, vì không có selector cho service, sẽ không có endpoint nào được điền để load balancer chuyển hướng lưu lượng đến.

Vì đây là một service bên ngoài, người dùng chịu trách nhiệm điền các endpoint thủ công bằng một tài nguyên Endpoints (Ví dụ 16-3).

*Ví dụ 16-3. external-ip-endpoints.yaml*

```yaml
kind: Endpoints
apiVersion: v1
metadata:
  name: external-ip-database
subsets:
  - addresses:
    - ip: 192.168.0.1
    ports:
    - port: 3306
```

Nếu bạn có nhiều hơn một địa chỉ IP để dự phòng, bạn có thể lặp lại chúng trong mảng `addresses`. Một khi các endpoint được điền, load balancer sẽ bắt đầu chuyển hướng lưu lượng từ Kubernetes service của bạn đến (các) endpoint địa chỉ IP.

> **LƯU Ý**
>
> Vì người dùng đã nhận trách nhiệm giữ địa chỉ IP của server luôn cập nhật, bạn cần đảm bảo nó không bao giờ thay đổi hoặc đảm bảo một quy trình tự động nào đó cập nhật bản ghi Endpoints.

### Hạn chế của Service bên ngoài: Kiểm tra sức khỏe

Các service bên ngoài trong Kubernetes có một hạn chế đáng kể: chúng không thực hiện bất kỳ kiểm tra sức khỏe nào. Người dùng chịu trách nhiệm đảm bảo endpoint hoặc tên DNS được cung cấp cho Kubernetes đáng tin cậy như ứng dụng cần.

## Chạy các Singleton đáng tin cậy

Thách thức của việc chạy các giải pháp lưu trữ trong Kubernetes thường là các primitive như ReplicaSet kỳ vọng mọi container giống hệt và có thể thay thế, nhưng với hầu hết các giải pháp lưu trữ, điều này không đúng. Một lựa chọn để giải quyết điều này là dùng các primitive Kubernetes, nhưng không cố nhân bản lưu trữ. Thay vào đó, đơn giản chạy một Pod duy nhất chạy cơ sở dữ liệu hoặc giải pháp lưu trữ khác. Theo cách này, các thách thức của việc chạy lưu trữ được nhân bản trong Kubernetes không xảy ra vì không có nhân bản.

Thoạt nhìn, điều này có vẻ đi ngược lại các nguyên tắc xây dựng hệ thống phân tán đáng tin cậy, nhưng nói chung, nó không kém tin cậy hơn việc chạy cơ sở dữ liệu hoặc hạ tầng lưu trữ của bạn trên một máy ảo hoặc vật lý duy nhất, đó là cách nhiều hệ thống hiện đang được xây dựng. Thực tế, nếu bạn cấu trúc hệ thống đúng cách, điều duy nhất bạn hy sinh là thời gian ngừng hoạt động tiềm năng cho việc nâng cấp hoặc trong trường hợp máy gặp lỗi. Mặc dù với các hệ thống quy mô lớn hoặc quan trọng điều này có thể không chấp nhận được, với nhiều ứng dụng quy mô nhỏ hơn, kiểu thời gian ngừng hoạt động hạn chế này là một sự đánh đổi hợp lý cho độ phức tạp giảm đi. Nếu điều này không đúng với bạn, hãy thoải mái bỏ qua phần này và hoặc nhập các service hiện có như mô tả ở phần trước, hoặc chuyển đến "Lưu trữ gốc Kubernetes với StatefulSet". Với những người còn lại, chúng ta sẽ xem lại cách xây dựng các singleton đáng tin cậy cho lưu trữ dữ liệu.

### Chạy một MySQL Singleton

Trong phần này, chúng tôi sẽ mô tả cách chạy một instance singleton đáng tin cậy của cơ sở dữ liệu MySQL dưới dạng Pod trong Kubernetes và cách phơi bày singleton đó cho các ứng dụng khác trong cluster. Để làm điều này, chúng ta sẽ tạo ba đối tượng cơ bản:

- Một persistent volume để quản lý vòng đời của lưu trữ trên đĩa độc lập với vòng đời của ứng dụng MySQL đang chạy
- Một Pod MySQL sẽ chạy ứng dụng MySQL
- Một service sẽ phơi bày Pod này cho các container khác trong cluster

Trong Chương 5, chúng tôi đã mô tả persistent volume: các vị trí lưu trữ có vòng đời độc lập với bất kỳ Pod hay container nào. Persistent volume hữu ích trong trường hợp các giải pháp lưu trữ bền vững, nơi biểu diễn trên đĩa của cơ sở dữ liệu nên tồn tại ngay cả khi các container chạy ứng dụng cơ sở dữ liệu bị sập hoặc di chuyển sang máy khác. Nếu ứng dụng di chuyển sang máy khác, volume nên di chuyển cùng nó, và dữ liệu nên được bảo toàn. Tách lưu trữ dữ liệu ra thành persistent volume làm điều này trở nên khả thi.

Để bắt đầu, chúng ta sẽ tạo một persistent volume cho cơ sở dữ liệu MySQL sử dụng. Ví dụ này dùng NFS để có tính di động tối đa, nhưng Kubernetes hỗ trợ nhiều loại driver persistent volume khác nhau. Ví dụ, có các driver persistent volume cho tất cả các nhà cung cấp public cloud lớn cũng như nhiều nhà cung cấp private cloud. Để dùng các giải pháp này, đơn giản thay `nfs` bằng loại volume của nhà cung cấp cloud thích hợp (ví dụ, `azure`, `awsElasticBlockStore`, hoặc `gcePersistentDisk`). Trong mọi trường hợp, thay đổi này là tất cả những gì bạn cần. Kubernetes biết cách tạo đĩa lưu trữ thích hợp trong nhà cung cấp cloud tương ứng. Đây là một ví dụ tuyệt vời về cách Kubernetes đơn giản hóa việc phát triển hệ thống phân tán đáng tin cậy. Ví dụ 16-4 cho thấy đối tượng PersistentVolume.

*Ví dụ 16-4. nfs-volume.yaml*

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: database
  labels:
    volume: my-volume
spec:
  accessModes:
  - ReadWriteMany
  capacity:
    storage: 1Gi
  nfs:
    server: 192.168.0.1
    path: "/exports"
```

Điều này định nghĩa một đối tượng PersistentVolume NFS với 1 GB dung lượng lưu trữ. Chúng ta có thể tạo persistent volume này như thường lệ bằng:

```
$ kubectl apply -f nfs-volume.yaml
```

Giờ chúng ta đã tạo một persistent volume, chúng ta cần yêu cầu (claim) persistent volume đó cho Pod của mình. Chúng ta làm điều này bằng một đối tượng PersistentVolumeClaim (Ví dụ 16-5).

*Ví dụ 16-5. nfs-volume-claim.yaml*

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: database
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
  selector:
    matchLabels:
      volume: my-volume
```

Trường `selector` dùng label để tìm volume khớp mà chúng ta đã định nghĩa trước đó.

Kiểu gián tiếp này có vẻ quá phức tạp, nhưng nó có mục đích: nó phục vụ việc cô lập định nghĩa Pod của chúng ta khỏi định nghĩa lưu trữ. Bạn có thể khai báo volume trực tiếp bên trong đặc tả Pod, nhưng điều này khóa đặc tả Pod đó vào một nhà cung cấp volume cụ thể (ví dụ, một public hoặc private cloud cụ thể). Bằng cách dùng volume claim, bạn có thể giữ đặc tả Pod của mình không phụ thuộc cloud; đơn giản tạo các volume khác nhau, đặc thù cho cloud, và dùng PersistentVolumeClaim để ràng buộc chúng với nhau. Hơn nữa, trong nhiều trường hợp, persistent volume controller thực sự sẽ tự động tạo volume cho bạn. Có thêm chi tiết về quy trình này trong phần tiếp theo.

Giờ chúng ta đã claim volume của mình, chúng ta có thể dùng ReplicaSet để xây dựng Pod singleton. Có vẻ kỳ lạ khi dùng ReplicaSet để quản lý một Pod duy nhất, nhưng điều đó cần thiết cho độ tin cậy. Hãy nhớ rằng một khi được lên lịch lên một máy, một Pod trần bị ràng buộc với máy đó mãi mãi. Nếu máy gặp lỗi, thì bất kỳ Pod nào trên máy đó không được quản lý bởi một controller cấp cao hơn như ReplicaSet sẽ biến mất cùng máy và không được lên lịch lại ở nơi khác. Do đó, để đảm bảo Pod cơ sở dữ liệu của chúng ta được lên lịch lại khi máy gặp lỗi, chúng ta dùng ReplicaSet controller cấp cao hơn, với kích cỡ replica là `1`, để quản lý cơ sở dữ liệu (Ví dụ 16-6).

*Ví dụ 16-6. mysql-replicaset.yaml*

```yaml
apiVersion: extensions/v1
kind: ReplicaSet
metadata:
  name: mysql
  # Labels so that we can bind a Service to this Pod
  labels:
    app: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: database
        image: mysql
        resources:
          requests:
            cpu: 1
            memory: 2Gi
        env:
        # Environment variables are not a best practice for security,
        # but we're using them here for brevity in the example.
        # See Chapter 11 for better options.
        - name: MYSQL_ROOT_PASSWORD
          value: some-password-here
        livenessProbe:
          tcpSocket:
            port: 3306
        ports:
        - containerPort: 3306
        volumeMounts:
          - name: database
            # /var/lib/mysql is where MySQL stores its databases
            mountPath: "/var/lib/mysql"
      volumes:
      - name: database
        persistentVolumeClaim:
          claimName: database
```

Một khi chúng ta tạo ReplicaSet, nó sẽ đến lượt tạo một Pod chạy MySQL bằng persistent disk chúng ta đã tạo ban đầu. Bước cuối cùng là phơi bày nó như một Kubernetes service (Ví dụ 16-7).

*Ví dụ 16-7. mysql-service.yaml*

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  ports:
  - port: 3306
    protocol: TCP
  selector:
    app: mysql
```

Giờ chúng ta có một instance MySQL singleton đáng tin cậy chạy trong cluster và được phơi bày như một service tên `mysql`, mà chúng ta có thể truy cập tại tên miền đầy đủ `mysql.svc.default.cluster`.

Các hướng dẫn tương tự có thể được dùng cho nhiều kho dữ liệu khác nhau, và nếu nhu cầu của bạn đơn giản và bạn có thể chịu được thời gian ngừng hoạt động hạn chế khi máy gặp lỗi hoặc khi bạn cần nâng cấp phần mềm cơ sở dữ liệu, một singleton đáng tin cậy có thể là cách tiếp cận lưu trữ đúng cho ứng dụng của bạn.

### Cấp phát Volume động

Nhiều cluster cũng bao gồm cấp phát volume động (dynamic volume provisioning). Với cấp phát volume động, người vận hành cluster tạo một hoặc nhiều đối tượng `StorageClass`. Trong Kubernetes, một `StorageClass` đóng gói các đặc tính của một loại lưu trữ cụ thể. Một cluster có thể có nhiều storage class khác nhau được cài đặt. Ví dụ, bạn có thể có một storage class cho NFS server trên mạng của bạn và một storage class cho iSCSI block store. Storage class cũng có thể đóng gói các mức độ tin cậy hoặc hiệu năng khác nhau. Ví dụ 16-8 cho thấy một storage class mặc định tự động cấp phát các đối tượng đĩa trên nền tảng Microsoft Azure.

*Ví dụ 16-8. storageclass.yaml*

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: default
  annotations:
    storageclass.beta.kubernetes.io/is-default-class: "true"
  labels:
    kubernetes.io/cluster-service: "true"
provisioner: kubernetes.io/azure-disk
```

Một khi storage class đã được tạo cho cluster, bạn có thể tham chiếu đến storage class này trong persistent volume claim của mình, thay vì tham chiếu đến bất kỳ persistent volume cụ thể nào. Khi trình cấp phát động thấy storage claim này, nó dùng driver volume thích hợp để tạo volume và ràng buộc nó với persistent volume claim của bạn.

Ví dụ 16-9 cho thấy một ví dụ về PersistentVolumeClaim dùng storage class `default` chúng ta vừa định nghĩa để claim một persistent volume mới được tạo.

*Ví dụ 16-9. dynamic-volume-claim.yaml*

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: my-claim
  annotations:
    volume.beta.kubernetes.io/storage-class: default
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Annotation `volume.beta.kubernetes.io/storage-class` là thứ liên kết claim này trở lại với storage class chúng ta đã tạo.

> **THẬN TRỌNG**
>
> Cấp phát tự động persistent volume là một tính năng tuyệt vời giúp việc xây dựng và quản lý các ứng dụng stateful trong Kubernetes dễ hơn đáng kể. Tuy nhiên, vòng đời của các persistent volume này được quy định bởi chính sách thu hồi (reclamation policy) của PersistentVolumeClaim, và mặc định là ràng buộc vòng đời đó với vòng đời của Pod tạo volume.
>
> Điều này có nghĩa là nếu bạn tình cờ xóa Pod (ví dụ, qua thu nhỏ hoặc sự kiện khác), thì volume cũng bị xóa. Mặc dù đây có thể là điều bạn muốn trong một số trường hợp nhất định, bạn cần cẩn thận để đảm bảo không vô tình xóa các persistent volume của mình.

Persistent volume rất tốt cho các ứng dụng truyền thống yêu cầu lưu trữ, nhưng nếu bạn cần phát triển lưu trữ có tính sẵn sàng cao, có khả năng mở rộng theo cách gốc Kubernetes, đối tượng StatefulSet mới được phát hành có thể được dùng thay thế. Chúng tôi sẽ mô tả cách triển khai MongoDB bằng StatefulSet trong phần tiếp theo.

## Lưu trữ gốc Kubernetes với StatefulSet

Khi Kubernetes lần đầu được phát triển, có sự nhấn mạnh lớn vào tính đồng nhất cho tất cả các replica trong một tập được nhân bản. Trong thiết kế này, không replica nào có danh tính hoặc cấu hình riêng lẻ. Việc xác định một thiết kế có thể thiết lập danh tính này cho ứng dụng của họ là tùy thuộc vào nhà phát triển ứng dụng.

Mặc dù cách tiếp cận này cung cấp mức độ cô lập lớn cho hệ thống điều phối, nó cũng làm việc phát triển các ứng dụng stateful khá khó. Sau nhiều đóng góp đáng kể từ cộng đồng và rất nhiều thử nghiệm với các ứng dụng stateful hiện có khác nhau, StatefulSet đã được giới thiệu trong Kubernetes phiên bản 1.5.

### Các thuộc tính của StatefulSet

StatefulSet là các nhóm Pod được nhân bản, tương tự ReplicaSet. Nhưng khác với ReplicaSet, chúng có một số thuộc tính độc đáo:

- Mỗi replica có một hostname bền vững với một chỉ số duy nhất (ví dụ, `database-0`, `database-1`, v.v.).
- Mỗi replica được tạo theo thứ tự từ chỉ số thấp nhất đến cao nhất, và việc tạo sẽ tạm dừng cho đến khi Pod ở chỉ số trước đó khỏe mạnh và sẵn sàng. Điều này cũng áp dụng cho việc mở rộng.
- Khi một StatefulSet bị xóa, mỗi Pod replica được quản lý cũng bị xóa theo thứ tự từ cao nhất đến thấp nhất. Điều này cũng áp dụng cho việc thu nhỏ số replica.

Hóa ra tập yêu cầu đơn giản này giúp việc triển khai các ứng dụng lưu trữ trên Kubernetes dễ hơn đáng kể. Ví dụ, sự kết hợp của các hostname ổn định (ví dụ, `database-0`) và các ràng buộc thứ tự có nghĩa là tất cả các replica, ngoài replica đầu tiên, có thể tham chiếu đáng tin cậy đến `database-0` cho mục đích khám phá và thiết lập quorum nhân bản.

### MongoDB được nhân bản thủ công với StatefulSet

Trong phần này, chúng ta sẽ triển khai một MongoDB cluster được nhân bản. Hiện tại, bản thân việc thiết lập nhân bản sẽ được thực hiện thủ công để bạn cảm nhận được cách StatefulSet hoạt động. Cuối cùng, chúng ta cũng sẽ tự động hóa thiết lập này.

Để bắt đầu, chúng ta sẽ tạo một tập được nhân bản gồm ba Pod MongoDB bằng một đối tượng StatefulSet (Ví dụ 16-10).

*Ví dụ 16-10. mongo-simple.yaml*

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
spec:
  serviceName: "mongo"
  replicas: 3
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongodb
        image: mongo:3.4.24
        command:
        - mongod
        - --replSet
        - rs0
        ports:
        - containerPort: 27017
          name: peer
```

Như bạn có thể thấy, định nghĩa này tương tự các định nghĩa ReplicaSet chúng ta đã thấy trước đó. Các thay đổi duy nhất là ở các trường `apiVersion` và `kind`.

Tạo StatefulSet:

```
$ kubectl apply -f mongo-simple.yaml
```

Một khi được tạo, sự khác biệt giữa ReplicaSet và StatefulSet trở nên rõ ràng. Chạy `kubectl get pods` và bạn có thể sẽ thấy điều này:

```
NAME      READY   STATUS              RESTARTS   AGE
mongo-0   1/1     Running             0          1m
mongo-1   0/1     ContainerCreating   0          10s
```

Có hai khác biệt quan trọng giữa điều này và những gì bạn sẽ thấy với ReplicaSet. Thứ nhất là mỗi Pod được nhân bản có một chỉ số số (`0`, `1`, …), thay vì hậu tố ngẫu nhiên được ReplicaSet controller thêm vào. Thứ hai là các Pod đang được tạo chậm theo thứ tự, không phải tất cả cùng lúc như với ReplicaSet.

Sau khi StatefulSet được tạo, chúng ta cũng cần tạo một service "headless" để quản lý các bản ghi DNS cho StatefulSet. Trong Kubernetes, một service được gọi là "headless" nếu nó không có địa chỉ IP ảo của cluster. Vì với StatefulSet, mỗi Pod có một danh tính duy nhất, việc có một địa chỉ IP cân bằng tải cho service được nhân bản không thực sự có ý nghĩa. Bạn có thể tạo một headless service bằng `clusterIP: None` trong đặc tả service (Ví dụ 16-11).

*Ví dụ 16-11. mongo-service.yaml*

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongo
spec:
  ports:
  - port: 27017
    name: peer
  clusterIP: None
  selector:
    app: mongo
```

Một khi bạn tạo service đó, bốn bản ghi DNS thường được điền. Như thường lệ, `mongo.default.svc.cluster.local` được tạo, nhưng khác với service tiêu chuẩn, việc tra cứu DNS trên hostname này cung cấp tất cả các địa chỉ trong StatefulSet. Ngoài ra, các bản ghi được tạo cho `mongo-0.mongo.default.svc.cluster.local` cũng như `mongo-1.mongo` và `mongo-2.mongo`. Mỗi cái này phân giải đến địa chỉ IP cụ thể của chỉ số replica trong StatefulSet. Như vậy, với StatefulSet bạn có các tên được định nghĩa rõ, bền vững cho mỗi replica trong tập. Điều này thường rất hữu ích khi bạn cấu hình một giải pháp lưu trữ được nhân bản. Bạn có thể thấy các bản ghi DNS này trong thực tế bằng cách chạy lệnh sau trong một trong các replica Mongo:

```
$ kubectl run -it --rm --image busybox busybox ping mongo-1.mongo
```

Tiếp theo, chúng ta sẽ thiết lập nhân bản Mongo thủ công bằng các hostname theo từng Pod này. Chúng ta sẽ chọn `mongo-0.mongo` làm primary ban đầu. Chạy công cụ `mongo` trong Pod đó:

```
$ kubectl exec -it mongo-0 mongo
> rs.initiate( {
  _id: "rs0",
  members:[ { _id: 0, host: "mongo-0.mongo:27017" } ]
 });
 OK
```

Lệnh này báo cho `mongodb` khởi tạo ReplicaSet `rs0` với `mongo-0.mongo` là replica primary.

> **LƯU Ý**
>
> Tên `rs0` là tùy ý. Bạn có thể dùng bất kỳ tên nào bạn muốn, nhưng bạn cũng sẽ cần thay đổi nó trong định nghĩa StatefulSet *mongo-simple.yaml*.

Một khi bạn đã khởi tạo Mongo ReplicaSet, bạn có thể thêm các replica còn lại bằng cách chạy các lệnh sau trong công cụ `mongo` trên Pod `mongo-0.mongo`:

```
> rs.add("mongo-1.mongo:27017");
> rs.add("mongo-2.mongo:27017");
```

Như bạn có thể thấy, chúng ta đang dùng các tên DNS đặc thù cho replica để thêm chúng làm replica trong Mongo cluster của chúng ta. Tại thời điểm này, chúng ta đã xong. MongoDB được nhân bản của chúng ta đang chạy. Nhưng nó thực sự không tự động như chúng ta muốn. Trong phần tiếp theo, chúng ta sẽ xem cách dùng script để tự động hóa việc thiết lập.

### Tự động hóa việc tạo MongoDB Cluster

Để tự động hóa việc triển khai MongoDB cluster dựa trên StatefulSet, chúng ta sẽ thêm một container vào các Pod để thực hiện khởi tạo. Để cấu hình Pod này mà không phải build một Docker image mới, chúng ta sẽ dùng một ConfigMap để thêm một script vào MongoDB image hiện có.

Chúng ta sẽ chạy script này bằng một container khởi tạo (initialization container). Container khởi tạo (hay container "init") là các container chuyên biệt chạy một lần khi Pod khởi động. Chúng thường được dùng cho các trường hợp như thế này, khi có một lượng nhỏ công việc thiết lập cần làm trước khi ứng dụng chính chạy. Trong định nghĩa Pod, có một danh sách `initContainers` riêng nơi các init container có thể được định nghĩa. Một ví dụ về điều này được đưa ra ở đây:

```yaml
...
      initContainers:
      - name: init-mongo
        image: mongo:3.4.24
        command:
        - bash
        - /config/init.sh
        volumeMounts:
        - name: config
          mountPath: /config
...
      volumes:
      - name: config
        configMap:
          name: "mongo-init"
```

Lưu ý rằng nó đang mount một ConfigMap volume có tên `mongo-init`. ConfigMap này giữ một script thực hiện việc khởi tạo của chúng ta. Đầu tiên, script xác định liệu nó đang chạy trên `mongo-0` hay không. Nếu nó ở trên `mongo-0`, nó tạo ReplicaSet bằng cùng lệnh chúng ta đã chạy theo kiểu mệnh lệnh trước đó. Nếu nó ở trên một replica Mongo khác, nó chờ đến khi ReplicaSet tồn tại, rồi đăng ký chính nó làm thành viên của ReplicaSet đó.

Ví dụ 16-12 có đối tượng ConfigMap hoàn chỉnh.

*Ví dụ 16-12. mongo-configmap.yaml*

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mongo-init
data:
  init.sh: |
    #!/bin/bash

    # Need to wait for the readiness health check to pass so that the
    # Mongo names resolve. This is kind of wonky.
    until ping -c 1 ${HOSTNAME}.mongo; do
      echo "waiting for DNS (${HOSTNAME}.mongo)..."
      sleep 2
    done

    until /usr/bin/mongo --eval 'printjson(db.serverStatus())'; do
      echo "connecting to local mongo..."
      sleep 2
    done
    echo "connected to local."

    HOST=mongo-0.mongo:27017

    until /usr/bin/mongo --host=${HOST} --eval 'printjson(db.serverStatus())'; do
      echo "connecting to remote mongo..."
      sleep 2
    done
    echo "connected to remote."

    if [[ "${HOSTNAME}" != 'mongo-0' ]]; then
      until /usr/bin/mongo --host=${HOST} --eval="printjson(rs.status())" \
            | grep -v "no replset config has been received"; do
        echo "waiting for replication set initialization"
        sleep 2
      done
      echo "adding self to mongo-0"
      /usr/bin/mongo --host=${HOST} \
         --eval="printjson(rs.add('${HOSTNAME}.mongo'))"
    fi

    if [[ "${HOSTNAME}" == 'mongo-0' ]]; then
      echo "initializing replica set"
      /usr/bin/mongo --eval="printjson(rs.initiate(\
          {'_id': 'rs0', 'members': [{'_id': 0, \
             'host': 'mongo-0.mongo:27017'}]}))"
    fi
    echo "initialized"
```

Bạn sẽ nhận thấy script này thoát ngay lập tức. Điều này quan trọng khi dùng `initContainers`. Mỗi container khởi tạo chờ đến khi container trước đó đã hoàn thành, trước khi chạy. Container ứng dụng chính chờ đến khi tất cả các container khởi tạo đã xong. Nếu script này không thoát, server Mongo chính sẽ không bao giờ khởi động.

Kết hợp tất cả lại, Ví dụ 16-13 là StatefulSet hoàn chỉnh dùng ConfigMap.

*Ví dụ 16-13. mongo.yaml*

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
spec:
  serviceName: "mongo"
  replicas: 3
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongodb
        image: mongo:3.4.24
        command:
        - mongod
        - --replSet
        - rs0
        ports:
        - containerPort: 27017
          name: web
      # This container initializes the MongoDB server, then sleeps.
      - name: init-mongo
        image: mongo:3.4.24
        command:
        - bash
        - /config/init.sh
        volumeMounts:
        - name: config
          mountPath: /config
      volumes:
      - name: config
        configMap:
          name: "mongo-init"
```

Với tất cả các file này, bạn có thể tạo một Mongo cluster bằng:

```
$ kubectl apply -f mongo-config-map.yaml
$ kubectl apply -f mongo-service.yaml
$ kubectl apply -f mongo-simple.yaml
```

Hoặc, nếu muốn, bạn có thể kết hợp tất cả chúng vào một file YAML duy nhất trong đó các đối tượng riêng lẻ được phân tách bằng `---`. Hãy đảm bảo bạn giữ cùng thứ tự, vì định nghĩa StatefulSet dựa vào việc định nghĩa ConfigMap đã tồn tại.

### Persistent Volume và StatefulSet

Để có lưu trữ bền vững, bạn cần mount một persistent volume vào thư mục */data/db*. Trong Pod template, bạn cần cập nhật nó để mount một persistent volume claim vào thư mục đó:

```yaml
...
        volumeMounts:
        - name: database
          mountPath: /data/db
```

Mặc dù cách tiếp cận này tương tự cách chúng ta đã thấy với các singleton đáng tin cậy, vì StatefulSet nhân bản nhiều hơn một Pod, bạn không thể đơn giản tham chiếu đến một persistent volume claim. Thay vào đó, bạn cần thêm một persistent volume claim template. Bạn có thể nghĩ về claim template giống hệt Pod template, nhưng thay vì tạo Pod, nó tạo volume claim. Bạn cần thêm phần sau vào cuối định nghĩa StatefulSet của mình:

```yaml
  volumeClaimTemplates:
  - metadata:
      name: database
      annotations:
        volume.alpha.kubernetes.io/storage-class: anything
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
```

Khi bạn thêm volume claim template vào định nghĩa StatefulSet, mỗi lần StatefulSet controller tạo một Pod là một phần của StatefulSet, nó sẽ tạo một persistent volume claim dựa trên template này như một phần của Pod đó.

> **LƯU Ý**
>
> Để các persistent volume được nhân bản này hoạt động đúng, bạn cần hoặc thiết lập tự động cấp phát cho persistent volume hoặc điền sẵn một tập các đối tượng persistent volume để StatefulSet controller lấy từ đó. Nếu không có claim nào có thể được tạo, StatefulSet controller sẽ không thể tạo các Pod tương ứng.

### Một điều cuối cùng: Readiness Probe

Mảnh ghép cuối cùng trong việc đưa MongoDB cluster của chúng ta lên production là thêm kiểm tra liveness vào các container phục vụ Mongo. Như chúng ta đã học trong "Kiểm tra sức khỏe", liveness probe được dùng để xác định liệu một container đang hoạt động đúng không.

Cho kiểm tra liveness, chúng ta có thể dùng chính công cụ `mongo` bằng cách thêm phần sau vào Pod template trong đối tượng StatefulSet:

```yaml
...
 livenessProbe:
   exec:
     command:
     - /usr/bin/mongo
     - --eval
     - db.serverStatus()
   initialDelaySeconds: 10
   timeoutSeconds: 10
...
```

## Tóm tắt

Một khi chúng ta đã kết hợp StatefulSet, persistent volume claim và liveness probe, chúng ta có một bản cài đặt MongoDB cloud native được tăng cường, có khả năng mở rộng chạy trên Kubernetes. Mặc dù ví dụ này xử lý MongoDB, các bước để tạo StatefulSet quản lý các giải pháp lưu trữ khác khá tương tự và các mẫu tương tự có thể được áp dụng.
